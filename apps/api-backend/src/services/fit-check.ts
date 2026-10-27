import { createHash } from "node:crypto";
import { z } from "zod";
import { createTtlCache } from "../lib/ttl-cache.js";
import type { FitCheckMediaType, FitCheckResult, Product } from "@omardtf/shared-types";

const GEMINI_HOST = "https://generativelanguage.googleapis.com";
// Fastest first; later entries are fallbacks for when Google reports "high demand" (503) on a model.
const FIT_MODELS = [
  ...(process.env.GEMINI_FIT_MODEL ? [process.env.GEMINI_FIT_MODEL] : []),
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
];
const REQUEST_TIMEOUT_MS = 25_000;
// If a model hasn't answered by then, the next one starts in parallel; first answer wins.
const HEDGE_DELAY_MS = 5_000;
const MAX_CONCURRENT = 2;

const SYSTEM_PROMPT = `You are the size assistant for OMARDTF, a custom apparel print shop. Recommend a garment size from the customer's photo.

First describe the photo in photoContent, then set personVisible true only if a real human body is visible (clothing alone, mannequins, product shots and drawings are false).

Rules:
- Judge only from visible overall proportions and any measurements given, using standard unisex retail sizing.
- Be neutral and respectful. Never judge bodies or comment on attractiveness, weight, age, health, gender or ethnicity. Never identify anyone.
- If personVisible is false, or the person is cropped, dark, blurry or one of several people, set usable false, give a short unusableReason saying how to retake the photo, and leave other fields empty.
- If unsure, pick the roomier size, set confidence low, and suggest a chest measurement.
- recommendedSize and alternateSize must be offered sizes (alternateSize may be empty).
- fitSummary: two short sentences. buildNote: one neutral sentence. stylingTips: up to three short tips.
Reply with JSON only.`;

const resultSchema = z.object({
  photoContent: z.string(),
  personVisible: z.boolean(),
  usable: z.boolean(),
  unusableReason: z.string(),
  recommendedSize: z.string(),
  alternateSize: z.string(),
  fitSummary: z.string(),
  buildNote: z.string(),
  stylingTips: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
});

export class FitCheckUnavailableError extends Error {}
export class FitCheckBusyError extends Error {}

let inFlight = 0;

// Identical photo + product + measurements within an hour reuse the earlier answer (no second API call).
const resultCache = createTtlCache<FitCheckResult>(60 * 60 * 1000, 200);

function buildJsonSchema(sizes: string[]) {
  const sizeOrEmpty = { type: "string", description: `One of: ${sizes.join(", ")}, or empty` };
  return {
    type: "object",
    properties: {
      photoContent: { type: "string" },
      personVisible: { type: "boolean" },
      usable: { type: "boolean" },
      unusableReason: { type: "string" },
      recommendedSize: sizeOrEmpty,
      alternateSize: sizeOrEmpty,
      fitSummary: { type: "string" },
      buildNote: { type: "string" },
      stylingTips: { type: "array", items: { type: "string" } },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
    },
    required: [
      "photoContent",
      "personVisible",
      "usable",
      "unusableReason",
      "recommendedSize",
      "alternateSize",
      "fitSummary",
      "buildNote",
      "stylingTips",
      "confidence",
    ],
  };
}

function describeCustomer(input: {
  heightCm?: number;
  weightKg?: number;
  usualSize?: string;
  fitPreference?: string;
}) {
  const lines = [
    input.heightCm && `Height: ${input.heightCm} cm`,
    input.weightKg && `Weight: ${input.weightKg} kg`,
    input.usualSize && `Usual size in other brands: ${input.usualSize}`,
    input.fitPreference && `Preferred fit: ${input.fitPreference}`,
  ].filter(Boolean);
  return lines.length > 0 ? lines.join("\n") : "No extra measurements provided.";
}

/** Outcome of one model attempt: text on success, or a reason worth trying the next model for. */
type Attempt = { text: string } | { retry: "busy" | "timeout" | "rejected"; detail: string };

/** Calls one Gemini model's generateContent; maps overload, timeout and model-level errors to a retryable result. */
async function tryModel(
  model: string,
  body: unknown,
  apiKey: string,
  cancel: AbortSignal,
): Promise<Attempt> {
  let res: Response;
  try {
    res = await fetch(`${GEMINI_HOST}/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.any([cancel, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return { retry: "timeout", detail: `${model} timed out` };
    }
    if (cancel.aborted) return { retry: "timeout", detail: `${model} cancelled` };
    throw new FitCheckUnavailableError("Can't reach the fit checker right now.");
  }

  if (!res.ok) {
    const detail = `${model} ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`;
    if (res.status === 401 || res.status === 403) {
      throw new FitCheckUnavailableError("Fit checker rejected the API key. Check GEMINI_API_KEY.");
    }
    if (res.status === 429 || res.status === 503) return { retry: "busy", detail };
    if (res.status === 400 || res.status === 404) return { retry: "rejected", detail };
    throw new Error(`Gemini error ${detail}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
  return text ? { text } : { retry: "rejected", detail: `${model} returned an empty answer` };
}

/**
 * Races FIT_MODELS: starts the first, adds the next when one fails or HEDGE_DELAY_MS passes with no answer,
 * resolves with the first success and cancels the rest. Rejects "busy" only when every model failed.
 */
function callGemini(body: unknown): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Promise.reject(new FitCheckUnavailableError("Fit checker isn't configured. Set GEMINI_API_KEY."));
  }

  return new Promise((resolve, reject) => {
    const cancel = new AbortController();
    const failures: string[] = [];
    let nextIndex = 0;
    let pending = 0;
    let finished = false;
    let timer: NodeJS.Timeout | undefined;

    const finish = (settle: () => void) => {
      finished = true;
      clearTimeout(timer);
      cancel.abort();
      settle();
    };

    const launch = () => {
      if (finished) return;
      if (nextIndex >= FIT_MODELS.length) {
        if (pending === 0) finish(() => reject(new FitCheckBusyError(`Fit checker is busy (${failures.join(" | ")})`)));
        return;
      }
      const model = FIT_MODELS[nextIndex++];
      pending += 1;
      clearTimeout(timer);
      timer = setTimeout(launch, HEDGE_DELAY_MS);

      tryModel(model, body, apiKey, cancel.signal)
        .then((attempt) => {
          pending -= 1;
          if (finished) return;
          if ("text" in attempt) return finish(() => resolve(attempt.text));
          failures.push(attempt.detail);
          console.warn("fit-check model failed:", attempt.detail);
          launch();
        })
        .catch((error) => {
          if (!finished) finish(() => reject(error));
        });
    };

    launch();
  });
}

/** Sends the customer photo and product details to a Gemini vision model and returns a validated size recommendation. */
export async function runFitCheck(input: {
  product: Product;
  image: { mediaType: FitCheckMediaType; data: string };
  heightCm?: number;
  weightKg?: number;
  usualSize?: string;
  fitPreference?: "fitted" | "regular" | "relaxed";
}): Promise<FitCheckResult> {
  const { product, image } = input;

  const cacheKey = createHash("sha256")
    .update(JSON.stringify([product.id, input.heightCm, input.weightKg, input.usualSize, input.fitPreference]))
    .update(image.data)
    .digest("hex");
  const cached = resultCache.get(cacheKey);
  if (cached) return cached;

  if (inFlight >= MAX_CONCURRENT) throw new FitCheckBusyError("Fit checker is busy");
  inFlight += 1;
  try {
    const content = await callGemini({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Garment: ${product.name} (${product.category}). ${product.description}
Sizes offered: ${product.sizes.join(", ")}
Colors: ${product.colors.join(", ")}

Customer details:
${describeCustomer(input)}`,
            },
            { inlineData: { mimeType: image.mediaType, data: image.data } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 700,
        mediaResolution: "MEDIA_RESOLUTION_LOW",
        thinkingConfig: { thinkingLevel: "minimal" },
        responseMimeType: "application/json",
        responseSchema: buildJsonSchema(product.sizes),
      },
    });

    const parsed = resultSchema.parse(JSON.parse(content));
    const recommended = product.sizes.includes(parsed.recommendedSize) ? parsed.recommendedSize : null;
    const alternate = product.sizes.includes(parsed.alternateSize) ? parsed.alternateSize : null;

    const usable = parsed.personVisible && parsed.usable && recommended !== null;
    if (!usable) {
      return declined(
        parsed.unusableReason ||
          "We couldn't see a person in that photo. Try a clear, full-length photo of yourself.",
      );
    }

    const result: FitCheckResult = {
      usable: true,
      unusableReason: null,
      recommendedSize: recommended,
      alternateSize: alternate === recommended ? null : alternate,
      fitSummary: parsed.fitSummary,
      buildNote: parsed.buildNote,
      stylingTips: parsed.stylingTips.slice(0, 3),
      confidence: parsed.confidence,
    };
    resultCache.set(cacheKey, result);
    return result;
  } finally {
    inFlight -= 1;
  }
}

function declined(reason: string): FitCheckResult {
  return {
    usable: false,
    unusableReason: reason,
    recommendedSize: null,
    alternateSize: null,
    fitSummary: "",
    buildNote: "",
    stylingTips: [],
    confidence: "low",
  };
}
