/** Free, in-browser garment recolor. Picks a hand-painted mask when one exists, else detects the fabric. */
import { buildAutoWeights } from "./auto-mask";
import { loadHandWeights } from "./mask-file";
import { describeFabric, type RecolorMask } from "./recolor-mask";

export type { RecolorMask } from "./recolor-mask";
export { hexToRgb, paintRecolor } from "./recolor-paint";

/** Loads an image; returns a 700px copy for automatic mask-finding and the full-resolution pixels (capped) to paint onto. */
export async function loadImageData(src: string, maskSide = 700, fullSide = 1600): Promise<{ small: ImageData; full: ImageData }> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = src;
  await image.decode();
  const pixelsAt = (maxSide: number) => {
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas isn't available in this browser.");
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  };
  return { small: pixelsAt(maskSide), full: pixelsAt(fullSide) };
}

/**
 * Returns what's needed to recolor a product photo, or null if the garment can't be separated from the backdrop.
 * A hand-painted /masks/<name>.png always wins over the automatic mask (pass preferHand: false to force auto).
 */
export async function loadRecolorMask(src: string, options: { preferHand?: boolean } = {}): Promise<RecolorMask | null> {
  const { small, full } = await loadImageData(src);
  if (options.preferHand !== false) {
    const hand = await loadHandWeights(src, full.width, full.height);
    if (hand) return describeFabric(full, hand, "hand");
  }
  const weights = buildAutoWeights(small, full);
  return weights ? describeFabric(full, weights, "auto") : null;
}
