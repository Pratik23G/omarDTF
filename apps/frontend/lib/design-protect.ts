/** One-click "protect the whole printed design": locks the design's area so no recolor touches any of it. */
import { findBackground, upscaleWeights } from "./auto-mask";
import { dilateMask, erodeMask, findOuterBackground, findPrintZone, softenZone } from "./print-zone";

const WORK_SIDE = 600;
const MIN_DESIGN_SHARE = 0.02;
// A pixel this close to the fabric color is "no ink": the shirt showing through the design.
const FABRIC_MATCH = 45;
// Dark channels at least this wide (px, work scale) connect a dark patch to the real fabric.
const CHANNEL_RADIUS = 2;

/** Mean color of the pixels the mask already treats as fabric. */
function averageFabricColor(data: Uint8ClampedArray, weights: Float32Array): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < weights.length; i += 3) {
    if (weights[i] < 0.9) continue;
    r += data[i * 4];
    g += data[i * 4 + 1];
    b += data[i * 4 + 2];
    count += 1;
  }
  return count ? [r / count, g / count, b / count] : [0, 0, 0];
}

/**
 * Locks the printed design. The design is every non-fabric pixel on the garment plus any fabric-colored
 * pocket fully enclosed by it (dark parts of the art). Fabric-colored areas that connect to the real fabric
 * through a channel (the dark halo around art) are not design and get recolored. Returns new weights.
 */
export function protectDesign(source: ImageData, weights: Float32Array, options: { closeRadius?: number; grow?: number; feather?: number } = {}): Float32Array {
  const { closeRadius = 3, grow = 1, feather = 2 } = options;
  const scale = Math.min(1, WORK_SIDE / Math.max(source.width, source.height));
  const sw = Math.max(1, Math.round(source.width * scale));
  const sh = Math.max(1, Math.round(source.height * scale));
  const total = sw * sh;

  const small = new Uint8ClampedArray(total * 4);
  const smallWeights = new Float32Array(total);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const from = Math.min(source.height - 1, Math.floor(y / scale)) * source.width + Math.min(source.width - 1, Math.floor(x / scale));
      small.set(source.data.subarray(from * 4, from * 4 + 4), (y * sw + x) * 4);
      smallWeights[y * sw + x] = weights[from];
    }
  }

  const fabric = averageFabricColor(small, smallWeights);
  const fabricLike = (i: number) =>
    Math.hypot(small[i * 4] - fabric[0], small[i * 4 + 1] - fabric[1], small[i * 4 + 2] - fabric[2]) <= FABRIC_MATCH;
  const outer = findOuterBackground(small, sw, sh, findBackground(small, sw, sh), 35);

  // Pixels connected to real fabric through fabric-colored channels (wide enough to survive erosion).
  const passable = new Uint8Array(total);
  for (let i = 0; i < total; i++) passable[i] = !outer[i] && small[i * 4 + 3] >= 128 && fabricLike(i) ? 1 : 0;
  const channels = erodeMask(passable, sw, sh, CHANNEL_RADIUS);
  const reached = new Uint8Array(total);
  const stack: number[] = [];
  for (let i = 0; i < total; i++) if (channels[i] && smallWeights[i] > 0.9) { reached[i] = 1; stack.push(i); }
  while (stack.length > 0) {
    const i = stack.pop() as number;
    const x = i % sw;
    for (const n of [x > 0 ? i - 1 : -1, x < sw - 1 ? i + 1 : -1, i - sw, i + sw]) {
      if (n >= 0 && n < total && channels[n] && !reached[n]) { reached[n] = 1; stack.push(n); }
    }
  }
  const fabricSide = dilateMask(reached, sw, sh, CHANNEL_RADIUS + 1);

  const design = new Uint8Array(total);
  for (let i = 0; i < total; i++) design[i] = !outer[i] && small[i * 4 + 3] >= 128 && smallWeights[i] < 0.35 && !fabricSide[i] ? 1 : 0;
  const zone = findPrintZone(design, sw, sh, closeRadius, MIN_DESIGN_SHARE);
  const protection = upscaleWeights(softenZone(zone, sw, sh, grow, feather), sw, sh, source.width, source.height);

  const result = new Float32Array(weights.length);
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const i = y * source.width + x;
      const small_i = Math.min(sh - 1, Math.floor(y * scale)) * sw + Math.min(sw - 1, Math.floor(x * scale));
      const open = 1 - Math.min(1, protection[i] * 1.2);
      // Halo/no-ink pixels connected to the fabric are fabric too, even if the automatic fill missed them.
      const weight = fabricSide[small_i] && fabricLike(small_i) ? Math.max(weights[i], 1) : weights[i];
      result[i] = weight * open;
    }
  }
  return result;
}
