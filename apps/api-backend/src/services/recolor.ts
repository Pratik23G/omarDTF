import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Product } from "@omardtf/shared-types";
import { sniffImageType } from "../lib/image-type.js";

const GEMINI_HOST = "https://generativelanguage.googleapis.com";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-image";
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_CONCURRENT = 2;

// apps/api-backend/src/services -> apps/frontend/public, where product photos live on disk.
const FRONTEND_PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../frontend/public");

export class RecolorUnavailableError extends Error {}
export class RecolorBusyError extends Error {}

let inFlight = 0;

/**
 * Reads a product photo directly off disk for local paths (apps/frontend/public/...) instead of
 * looping a request back through the frontend dev/prod server — that hop broke whenever the
 * frontend didn't happen to be on the exact port FRONTEND_URL assumed (e.g. Next fell back to a
 * different port because 3000 was taken), surfacing as a "failed to fetch" recolor error.
 */
async function fetchSourceImage(imagePath: string): Promise<{ mediaType: string; base64: string }> {
  if (/^https?:\/\//.test(imagePath)) {
    let res: Response;
    try {
      res = await fetch(imagePath, { signal: AbortSignal.timeout(15_000) });
    } catch {
      throw new Error(`Couldn't fetch the product image at ${imagePath}`);
    }
    if (!res.ok) throw new Error(`Couldn't fetch the product image (${res.status}): ${imagePath}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const base64 = buffer.toString("base64");
    return { mediaType: sniffImageType(base64) ?? "image/png", base64 };
  }

  const filePath = path.join(FRONTEND_PUBLIC_DIR, imagePath);
  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    throw new Error(`Couldn't read the product image at ${filePath}`);
  }
  const base64 = buffer.toString("base64");
  return { mediaType: sniffImageType(base64) ?? "image/png", base64 };
}

/**
 * Fetches the product's photo and sends it to Google's Gemini image model
 * (free tier, no card required — sign up at aistudio.google.com/apikey) with
 * an instruction to recolor only the garment and keep the printed design,
 * then returns the edited image.
 */
export async function runRecolor(input: { product: Product; targetColor: string }): Promise<{ image: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new RecolorUnavailableError(
      "AI recolor isn't configured yet. Set GEMINI_API_KEY (free at aistudio.google.com/apikey) to enable it.",
    );
  }

  if (inFlight >= MAX_CONCURRENT) throw new RecolorBusyError("Recolor is busy");
  inFlight += 1;
  try {
    const { product, targetColor } = input;
    const source = await fetchSourceImage(product.images[0]);

    const prompt = `Recolor only the ${product.category.toLowerCase()} garment in this photo to ${targetColor}. Keep the printed design, logo text, background, lighting and shadows exactly as they are — change nothing but the fabric color. Return only the edited image.`;

    let res: Response;
    try {
      res = await fetch(`${GEMINI_HOST}/v1beta/models/${GEMINI_MODEL}:generateContent`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: source.mediaType, data: source.base64 } },
              ],
            },
          ],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new Error("Recolor took too long");
      }
      throw new RecolorUnavailableError("Can't reach the recolor service right now.");
    }

    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      if (res.status === 401 || res.status === 403) {
        throw new RecolorUnavailableError("Recolor service rejected the API key. Check GEMINI_API_KEY.");
      }
      if (res.status === 429) {
        console.error("recolor: Gemini rate-limited (429):", detail);
        throw new RecolorBusyError("Recolor is busy");
      }
      throw new Error(`Recolor error ${res.status}: ${detail}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[];
    };
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imagePart?.inlineData) throw new Error("Recolor model didn't return an image");

    return { image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` };
  } finally {
    inFlight -= 1;
  }
}
