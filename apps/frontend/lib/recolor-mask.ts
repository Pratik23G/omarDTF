/** Shared mask type plus the fabric brightness statistics the painter needs. */

export type RecolorMask = {
  /** Full-resolution original pixels; never modified. */
  source: ImageData;
  /** 0..1 per source pixel: how strongly the pixel is garment fabric (1 = fully recolor). */
  weights: Float32Array;
  /** Average fabric brightness (0..1). */
  baseLuminance: number;
  /** Fabric highlight brightness (70th percentile); shading is measured relative to this. */
  referenceLuminance: number;
  origin: "hand" | "auto";
};

export const luminance = (r: number, g: number, b: number) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

/** Measures the fabric under the mask so recoloring can scale shading relative to the real fabric. */
export function describeFabric(source: ImageData, weights: Float32Array, origin: RecolorMask["origin"]): RecolorMask | null {
  const histogram = new Uint32Array(256);
  let count = 0;
  let sum = 0;
  for (let index = 0; index < weights.length; index += 3) {
    if (weights[index] < 0.9) continue;
    const value = luminance(source.data[index * 4], source.data[index * 4 + 1], source.data[index * 4 + 2]);
    histogram[Math.min(255, Math.round(value * 255))] += 1;
    sum += value;
    count += 1;
  }
  if (count < weights.length / 3 / 100) return null;

  let seen = 0;
  let reference = 0;
  for (let bin = 0; bin < 256 && seen < count * 0.7; bin++) {
    seen += histogram[bin];
    reference = bin / 255;
  }
  return { source, weights, baseLuminance: sum / count, referenceLuminance: Math.max(reference, 0.06), origin };
}
