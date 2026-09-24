import { z } from "zod";
import type { FitCheckMediaType, FitCheckResult, Product } from "@omardtf/shared-types";

const OLLAMA_HOST = (process.env.OLLAMA_HOST ?? "http://localhost:11434").replace(/\/$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma3:4b";
const REQUEST_TIMEOUT_MS = 180_000;
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
  const sizeOrEmpty = { type: "string", enum: [...sizes, ""] };
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

async function callOllama(body: unknown): Promise<string> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.OLLAMA_API_KEY) headers.authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("Ollama took too long to answer");
    }
    throw new FitCheckUnavailableError(
      `Can't reach Ollama at ${OLLAMA_HOST}. Start it with "ollama serve" or set OLLAMA_HOST.`,
    );
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    if (res.status === 404) {
      throw new FitCheckUnavailableError(
        `Model "${OLLAMA_MODEL}" isn't available. Run: ollama pull ${OLLAMA_MODEL}`,
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new FitCheckUnavailableError("Ollama rejected the API key. Check OLLAMA_API_KEY.");
    }
    throw new Error(`Ollama error ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  const content = data.message?.content;
  if (!content) throw new Error("Ollama returned an empty answer");
  return content;
}

/** Sends the customer photo and product details to an Ollama vision model and returns a validated size recommendation. */
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
    const content = await callOllama({
      model: OLLAMA_MODEL,
      stream: false,
      format: buildJsonSchema(product.sizes),
      options: { temperature: 0.2, num_ctx: 4096 },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Garment: ${product.name} (${product.category}). ${product.description}
Sizes offered: ${product.sizes.join(", ")}
Colors: ${product.colors.join(", ")}

Customer details:
${describeCustomer(input)}`,
          images: [image.data],
        },
      ],
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
