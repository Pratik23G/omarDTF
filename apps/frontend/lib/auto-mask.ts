import { findOuterBackground, findPrintZone, softenZone } from "./print-zone";

/** Automatic fabric mask: finds the garment fabric in a product photo (used when no hand-painted mask exists). */

const FABRIC_TOLERANCE = 45;
const BACKGROUND_EXCLUSION = 20;
const MIN_FABRIC_SHARE = 0.05;
// Mean per-channel step between neighbors above which a pixel counts as a print/seam edge.
const EDGE_THRESHOLD = 11;
const EDGE_FEATHER_PX = 2;
// A separate fabric-colored region must cover at least this share of the photo to count as garment.
const MIN_ISLAND_SHARE = 0.01;
// Brightness varies with folds, hue does not, so brightness differences are discounted.
const LUMA_WEIGHT = 0.6;
const CHROMA_WEIGHT = 1.4;
// Below this the garment is indistinguishable from the backdrop (e.g. white tee on light grey).
const MIN_BACKGROUND_SEPARATION = 70;
// The printed design: gaps up to this many px (at 700px scale) are bridged, and it must span this share of the photo.
const PRINT_CLOSE_RADIUS = 7;
const MIN_PRINT_SHARE = 0.02;
// Protection extends past the design by PRINT_GROW_PX and fades out over PRINT_FEATHER_PX, covering fuzzy print edges.
const PRINT_GROW_PX = 5;
const PRINT_FEATHER_PX = 4;
// Inside the print zone only pixels this close to pure fabric color (fraction of tolerance) are recolored.
const PRINT_FABRIC_STRICTNESS = 0.4;

const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) =>
  Math.hypot(r1 - r2, g1 - g2, b1 - b2);

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** Returns the most common color along the image border, which is almost always the studio backdrop. */
export function findBackground(data: Uint8ClampedArray, width: number, height: number): [number, number, number] {
  const bins = new Map<number, { count: number; r: number; g: number; b: number }>();
  const ring = 6;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (x >= ring && x < width - ring && y >= ring && y < height - ring) continue;
      const i = (y * width + x) * 4;
      if (data[i + 3] < 128) continue;
      const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
      const bin = bins.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      bin.count += 1;
      bin.r += data[i];
      bin.g += data[i + 1];
      bin.b += data[i + 2];
      bins.set(key, bin);
    }
  }
  const top = [...bins.values()].sort((a, b) => b.count - a.count)[0];
  return top ? [top.r / top.count, top.g / top.count, top.b / top.count] : [255, 255, 255];
}

/** Returns the dominant non-background color, assumed to be the garment fabric. */
function findFabricColor(
  data: Uint8ClampedArray,
  background: [number, number, number],
): { color: [number, number, number]; share: number } | null {
  const bins = new Map<number, { count: number; r: number; g: number; b: number }>();
  let considered = 0;
  for (let i = 0; i < data.length; i += 8) {
    if (data[i + 3] < 128) continue;
    if (colorDistance(data[i], data[i + 1], data[i + 2], ...background) < BACKGROUND_EXCLUSION) continue;
    considered += 1;
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const bin = bins.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bin.count += 1;
    bin.r += data[i];
    bin.g += data[i + 1];
    bin.b += data[i + 2];
    bins.set(key, bin);
  }
  const top = [...bins.values()].sort((a, b) => b.count - a.count)[0];
  if (!top) return null;
  return { color: [top.r / top.count, top.g / top.count, top.b / top.count], share: top.count / (data.length / 8) };
}

/** Marks pixels sitting on a sharp edge (print outline, seam) so the fill can't cross into the design. */
function findEdges(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const edges = new Uint8Array(width * height);
  const step = (a: number, b: number) =>
    (Math.abs(data[a] - data[b]) + Math.abs(data[a + 1] - data[b + 1]) + Math.abs(data[a + 2] - data[b + 2])) / 3;
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      if (Math.max(step(i, i + 4), step(i, i + width * 4)) > EDGE_THRESHOLD) edges[y * width + x] = 1;
    }
  }
  return edges;
}

/**
 * Builds the fabric mask. Flood-fills outward from a fabric pixel, judging color by hue/chroma more than
 * brightness (folds change brightness, print changes hue) and refusing to cross sharp edges, so the printed
 * design stays untouched even when parts of it are dark. Returns full-resolution 0..1 weights, or null if no garment is found.
 */
export function buildAutoWeights(small: ImageData, full: ImageData = small): Float32Array | null {
  const { data, width, height } = small;
  const background = findBackground(data, width, height);
  const fabric = findFabricColor(data, background);
  if (!fabric || fabric.share < MIN_FABRIC_SHARE) return null;

  const [br, bg, bb] = fabric.color;
  // When the backdrop is close to the fabric color (white tee on grey), tighten so the fill can't leak out.
  const separation = colorDistance(br, bg, bb, ...background);
  if (separation < MIN_BACKGROUND_SEPARATION) return null;
  const tolerance = Math.min(FABRIC_TOLERANCE, separation * 0.5);
  const outer = tolerance * 1.3;

  const baseY = 0.299 * br + 0.587 * bg + 0.114 * bb;
  const distanceAt = (index: number) => {
    const r = data[index * 4];
    const g = data[index * 4 + 1];
    const b = data[index * 4 + 2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    return Math.hypot(LUMA_WEIGHT * (y - baseY), CHROMA_WEIGHT * (b - y - (bb - baseY)), CHROMA_WEIGHT * (r - y - (br - baseY)));
  };
  const edges = findEdges(data, width, height);

  let seed = -1;
  let bestScore = Infinity;
  for (let y = Math.floor(height * 0.5); y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const index = y * width + x;
      if (data[index * 4 + 3] < 128 || edges[index] || distanceAt(index) > tolerance * 0.5) continue;
      const score = Math.abs(x - width / 2) + Math.abs(y - height * 0.85) * 2;
      if (score < bestScore) {
        bestScore = score;
        seed = index;
      }
    }
  }
  if (seed < 0) return null;

  const total = width * height;
  const weights = new Float32Array(total);
  const visited = new Uint8Array(total);
  const stack = new Int32Array(total);
  const frontier: number[] = [];
  const neighborsOf = (index: number) => {
    const x = index % width;
    return [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, index - width, index + width].filter(
      (n) => n >= 0 && n < total && data[n * 4 + 3] >= 128,
    );
  };
  const weightFor = (index: number) => 1 - smoothstep(tolerance * 0.6, outer, distanceAt(index));

  /** Flood-fills fabric-like, edge-free pixels from `start`; returns the pixels reached. */
  const fillFrom = (start: number): number[] => {
    const reached: number[] = [];
    let top = 0;
    stack[top++] = start;
    visited[start] = 1;
    while (top > 0) {
      const index = stack[--top];
      reached.push(index);
      for (const next of neighborsOf(index)) {
        if (visited[next] || distanceAt(next) > outer) continue;
        if (edges[next]) {
          frontier.push(next);
          continue;
        }
        visited[next] = 1;
        stack[top++] = next;
      }
    }
    return reached;
  };

  for (const index of fillFrom(seed)) weights[index] = weightFor(index);

  // Seams can cut off sleeves or the hem; adopt other large fabric-colored regions, skip small ones (print bits).
  for (let index = 0; index < total; index += 2) {
    if (visited[index] || edges[index] || data[index * 4 + 3] < 128 || distanceAt(index) > tolerance * 0.5) continue;
    const island = fillFrom(index);
    if (island.length >= total * MIN_ISLAND_SHARE) for (const i of island) weights[i] = weightFor(i);
  }

  // Feather a couple of pixels into the edge pixels so the design isn't ringed by leftover old fabric color.
  let layer = frontier;
  for (let depth = 0; depth < EDGE_FEATHER_PX && layer.length > 0; depth++) {
    const nextLayer: number[] = [];
    for (const index of layer) {
      if (visited[index]) continue;
      visited[index] = 1;
      weights[index] = weightFor(index) * (1 - (depth + 1) / (EDGE_FEATHER_PX + 1));
      for (const next of neighborsOf(index)) if (!visited[next] && distanceAt(next) <= outer) nextLayer.push(next);
    }
    layer = nextLayer;
  }

  // Fabric grain can trip the edge test and leave pinholes; fill pixels that are mostly surrounded by garment.
  for (let pass = 0; pass < 2; pass++) {
    const snapshot = weights.slice();
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        if (snapshot[index] >= 0.5 || data[index * 4 + 3] < 128 || distanceAt(index) > outer) continue;
        let around = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (snapshot[index + dy * width + dx] > 0.5) around++;
        if (around >= 5) weights[index] = Math.max(weights[index], 0.9 * weightFor(index));
      }
    }
  }

  protectPrint(data, weights, width, height, background, distanceAt, tolerance);

  return upscaleWeights(weights, width, height, full.width, full.height);
}

/** Leaves the printed design alone: inside the design's zone, only near-pure fabric color stays recolorable. */
function protectPrint(
  data: Uint8ClampedArray,
  weights: Float32Array,
  width: number,
  height: number,
  background: [number, number, number],
  distanceAt: (index: number) => number,
  tolerance: number,
) {
  const outerBackground = findOuterBackground(data, width, height, background, 35);
  const print = new Uint8Array(weights.length);
  for (let i = 0; i < print.length; i++) print[i] = !outerBackground[i] && weights[i] < 0.35 && data[i * 4 + 3] >= 128 ? 1 : 0;
  const zone = findPrintZone(print, width, height, PRINT_CLOSE_RADIUS, MIN_PRINT_SHARE);
  const protection = softenZone(zone, width, height, PRINT_GROW_PX, PRINT_FEATHER_PX);
  for (let i = 0; i < weights.length; i++) {
    if (protection[i] <= 0 || weights[i] <= 0) continue;
    const strict = 1 - smoothstep(tolerance * PRINT_FABRIC_STRICTNESS * 0.4, tolerance * PRINT_FABRIC_STRICTNESS, distanceAt(i));
    weights[i] = weights[i] + (Math.min(weights[i], strict) - weights[i]) * protection[i];
  }
}

/** Bilinearly resamples the low-res weight map onto the full-resolution photo, so the original pixels stay sharp. */
export function upscaleWeights(weights: Float32Array, sw: number, sh: number, fw: number, fh: number): Float32Array {
  if (sw === fw && sh === fh) return weights;
  const out = new Float32Array(fw * fh);
  for (let y = 0; y < fh; y++) {
    const fy = Math.min(sh - 1, Math.max(0, ((y + 0.5) * sh) / fh - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(sh - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < fw; x++) {
      const fx = Math.min(sw - 1, Math.max(0, ((x + 0.5) * sw) / fw - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(sw - 1, x0 + 1);
      const tx = fx - x0;
      const top = weights[y0 * sw + x0] * (1 - tx) + weights[y0 * sw + x1] * tx;
      const bottom = weights[y1 * sw + x0] * (1 - tx) + weights[y1 * sw + x1] * tx;
      out[y * fw + x] = top * (1 - ty) + bottom * ty;
    }
  }
  return out;
}
