import { z } from "zod";
import type { FitCheckMediaType, FitCheckResult, Product } from "@omardtf/shared-types";

const GEMINI_HOST = "https://generativelanguage.googleapis.com";
const GEMINI_MODEL = process.env.GEMINI_FIT_MODEL ?? "gemini-flash-latest";
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_CONCURRENT = 2;

const SYSTEM_PROMPT = `You are the size assistant for OMARDTF, a custom apparel print shop.
Look at the customer's photo and recommend a size for the garment described.

First describe what the photo shows in photoContent, then decide personVisible: true only if a real human body is visible. A photo of clothing alone, a mannequin, a product image or a drawing means personVisible is false.

Rules:
- Judge only from the overall proportions visible and any measurements given. Assume standard unisex retail sizing.
- Be neutral and respectful. Never judge or rank bodies, and never comment on attractiveness, weight, age, health, gender or ethnicity. Never identify the person.
- If personVisible is false, or the person is cropped, dark, blurry or there are several people, set usable to false, give a short unusableReason saying how to retake it, and leave the other fields empty.
- If unsure, pick the roomier size, set confidence to low, and mention that a chest measurement would help.
- recommendedSize and alternateSize must be one of the sizes offered (alternateSize may be empty).
- fitSummary: two short sentences on how the garment should fit. buildNote: one neutral sentence about proportions. stylingTips: up to three short tips.
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

/** Calls Gemini's generateContent with the photo and a JSON response schema; returns the raw JSON text. */
async function callGemini(body: unknown, retriesLeft = 2): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new FitCheckUnavailableError("Fit checker isn't configured. Set GEMINI_API_KEY.");
  }

  let res: Response;
  try {
    res = await fetch(`${GEMINI_HOST}/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("Fit checker took too long to answer");
    }
    throw new FitCheckUnavailableError("Can't reach the fit checker right now.");
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    if (res.status === 401 || res.status === 403) {
      throw new FitCheckUnavailableError("Fit checker rejected the API key. Check GEMINI_API_KEY.");
    }
    if (res.status === 503 && retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, 1500));
      return callGemini(body, retriesLeft - 1);
    }
    if (res.status === 429 || res.status === 503) throw new FitCheckBusyError("Fit checker is busy");
    throw new Error(`Gemini error ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const content = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
  if (!content) throw new Error("Fit checker returned an empty answer");
  return content;
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

    return {
      usable: true,
      unusableReason: null,
      recommendedSize: recommended,
      alternateSize: alternate === recommended ? null : alternate,
      fitSummary: parsed.fitSummary,
      buildNote: parsed.buildNote,
      stylingTips: parsed.stylingTips.slice(0, 3),
      confidence: parsed.confidence,
    };
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
