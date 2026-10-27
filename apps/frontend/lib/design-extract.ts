/** Cuts the printed design out of a tee product photo, with soft edges, so it can be placed on another garment. */
import { findBackground, upscaleWeights } from "./auto-mask";
import { dilateMask, erodeMask, findOuterBackground, findPrintZone, softenZone } from "./print-zone";

const WORK_SIDE = 600;
const FABRIC_MATCH = 45;
const CHANNEL_RADIUS = 2;
const MIN_DESIGN_SHARE = 0.01;
// Pieces smaller than this fraction of the main design are treated as stray fabric edges, not art.
const KEEP_RELATIVE = 0.25;
// On light fabric the art's own white ink looks like shirt, so bigger gaps inside the design are bridged and kept.
const CLOSE_RADIUS = 3;
const LIGHT_CLOSE_RADIUS = 6;
const isLight = ([r, g, b]: number[]) => 0.299 * r + 0.587 * g + 0.114 * b > 150;

export type ExtractedDesign = {
  /** Design pixels as a canvas the size of the source photo, alpha = design strength. */
  canvas: HTMLCanvasElement;
  /** Bounding box of the design in source-photo pixels. */
  bounds: { x: number; y: number; width: number; height: number };
  /** The tee's fabric color, [r, g, b]. */
  fabric: [number, number, number];
};

/** Most common color on the garment (the fabric), judged from the pixels inside the silhouette. */
function dominantColor(data: Uint8ClampedArray, outer: Uint8Array): [number, number, number] {
  const bins = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < outer.length; i += 2) {
    if (outer[i] || data[i * 4 + 3] < 128) continue;
    const key = ((data[i * 4] >> 4) << 8) | ((data[i * 4 + 1] >> 4) << 4) | (data[i * 4 + 2] >> 4);
    const bin = bins.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bin.count += 1;
    bin.r += data[i * 4];
    bin.g += data[i * 4 + 1];
    bin.b += data[i * 4 + 2];
    bins.set(key, bin);
  }
  const top = [...bins.values()].sort((a, b) => b.count - a.count)[0];
  return top ? [top.r / top.count, top.g / top.count, top.b / top.count] : [0, 0, 0];
}

/**
 * The design is everything on the garment that isn't plain fabric, plus fabric-colored pockets fully enclosed
 * by it (dark parts of the art). Fabric connected to the garment's outline (sleeves, body, halo) is not design.
 */
export function extractDesign(source: ImageData): ExtractedDesign | null {
  const scale = Math.min(1, WORK_SIDE / Math.max(source.width, source.height));
  const sw = Math.max(1, Math.round(source.width * scale));
  const sh = Math.max(1, Math.round(source.height * scale));
  const total = sw * sh;
  const small = new Uint8ClampedArray(total * 4);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const from = Math.min(source.height - 1, Math.floor(y / scale)) * source.width + Math.min(source.width - 1, Math.floor(x / scale));
      small.set(source.data.subarray(from * 4, from * 4 + 4), (y * sw + x) * 4);
    }
  }

  const outer = findOuterBackground(small, sw, sh, findBackground(small, sw, sh), 35);
  const fabric = dominantColor(small, outer);
  const passable = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const near = Math.hypot(small[i * 4] - fabric[0], small[i * 4 + 1] - fabric[1], small[i * 4 + 2] - fabric[2]) <= FABRIC_MATCH;
    passable[i] = !outer[i] && small[i * 4 + 3] >= 128 && near ? 1 : 0;
  }
  const channels = erodeMask(passable, sw, sh, CHANNEL_RADIUS);

  // Fabric connected to the garment outline: start from channel pixels touching the silhouette edge.
  const outerNear = dilateMask(outer, sw, sh, 6);
  const reached = new Uint8Array(total);
  const stack: number[] = [];
  for (let i = 0; i < total; i++) if (channels[i] && outerNear[i]) { reached[i] = 1; stack.push(i); }
  while (stack.length > 0) {
    const i = stack.pop() as number;
    const x = i % sw;
    for (const n of [x > 0 ? i - 1 : -1, x < sw - 1 ? i + 1 : -1, i - sw, i + sw]) {
      if (n >= 0 && n < total && channels[n] && !reached[n]) { reached[n] = 1; stack.push(n); }
    }
  }
  const fabricSide = dilateMask(reached, sw, sh, CHANNEL_RADIUS + 1);

  const design = new Uint8Array(total);
  for (let i = 0; i < total; i++) design[i] = !outer[i] && small[i * 4 + 3] >= 128 && !fabricSide[i] ? 1 : 0;
  const zone = findPrintZone(design, sw, sh, isLight(fabric) ? LIGHT_CLOSE_RADIUS : CLOSE_RADIUS, MIN_DESIGN_SHARE, KEEP_RELATIVE);

  let minX = sw, minY = sh, maxX = -1, maxY = -1;
  for (let i = 0; i < total; i++) {
    if (!zone[i]) continue;
    const x = i % sw;
    const y = Math.floor(i / sw);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  if (maxX < 0) return null;

  const alpha = upscaleWeights(softenZone(zone, sw, sh, 1, 2), sw, sh, source.width, source.height);
  const pixels = new Uint8ClampedArray(source.data);
  for (let i = 0; i < alpha.length; i++) pixels[i * 4 + 3] = Math.round(Math.min(1, alpha[i] * 1.2) * 255);
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  canvas.getContext("2d")?.putImageData(new ImageData(pixels, source.width, source.height), 0, 0);

  const pad = 3 / scale;
  const x = Math.max(0, Math.floor(minX / scale - pad));
  const y = Math.max(0, Math.floor(minY / scale - pad));
  return {
    canvas,
    bounds: { x, y, width: Math.min(source.width - x, Math.ceil((maxX - minX + 1) / scale + pad * 2)), height: Math.min(source.height - y, Math.ceil((maxY - minY + 1) / scale + pad * 2)) },
    fabric: fabric.map(Math.round) as [number, number, number],
  };
}
