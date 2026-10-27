/** Helpers that find the printed design on a garment photo so recoloring can leave it alone. */

/** Flood-fills the backdrop inward from the photo border (so look-alike print areas are not included). */
export function findOuterBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  background: [number, number, number],
  tolerance: number,
): Uint8Array {
  const outer = new Uint8Array(width * height);
  const stack: number[] = [];
  const isBackdrop = (index: number) =>
    data[index * 4 + 3] < 128 ||
    Math.hypot(
      data[index * 4] - background[0],
      data[index * 4 + 1] - background[1],
      data[index * 4 + 2] - background[2],
    ) < tolerance;
  const push = (index: number) => {
    if (!outer[index] && isBackdrop(index)) {
      outer[index] = 1;
      stack.push(index);
    }
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  while (stack.length > 0) {
    const index = stack.pop() as number;
    const x = index % width;
    if (x > 0) push(index - 1);
    if (x < width - 1) push(index + 1);
    if (index >= width) push(index - width);
    if (index < width * (height - 1)) push(index + width);
  }
  return outer;
}

/** Separable max (dilate) or min (erode) filter over a binary mask. */
function morph(mask: Uint8Array, width: number, height: number, radius: number, dilate: boolean): Uint8Array {
  const pass = (src: Uint8Array, length: number, lines: number, stride: number, lineStride: number) => {
    const dst = new Uint8Array(src.length);
    for (let line = 0; line < lines; line++) {
      const origin = line * lineStride;
      for (let k = 0; k < length; k++) {
        let hit = dilate ? 0 : 1;
        for (let j = Math.max(0, k - radius); j <= Math.min(length - 1, k + radius); j++) {
          const value = src[origin + j * stride];
          if (dilate ? value : !value) {
            hit = dilate ? 1 : 0;
            break;
          }
        }
        dst[origin + k * stride] = hit;
      }
    }
    return dst;
  };
  return pass(pass(mask, width, height, 1, width), height, width, width, 1);
}

/**
 * Closes small gaps in the print pixels (letter spacing, thin fabric between art) and keeps only large
 * connected blobs, so seams, hems and collar ribs aren't mistaken for the design. With keepRelative > 0, blobs smaller
 * than that fraction of the largest are dropped too.
 */
export function findPrintZone(
  print: Uint8Array,
  width: number,
  height: number,
  closeRadius: number,
  minShare: number,
  keepRelative = 0,
): Uint8Array {
  const closed = morph(morph(print, width, height, closeRadius, true), width, height, closeRadius, false);
  const zone = new Uint8Array(closed.length);
  const seen = new Uint8Array(closed.length);
  const blobs: number[][] = [];
  for (let start = 0; start < closed.length; start++) {
    if (!closed[start] || seen[start]) continue;
    const blob: number[] = [start];
    seen[start] = 1;
    for (let head = 0; head < blob.length; head++) {
      const index = blob[head];
      const x = index % width;
      const neighbors = [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, index - width, index + width];
      for (const next of neighbors) {
        if (next < 0 || next >= closed.length || seen[next] || !closed[next]) continue;
        seen[next] = 1;
        blob.push(next);
      }
    }
    if (blob.length >= closed.length * minShare) blobs.push(blob);
  }
  // keepRelative drops blobs much smaller than the biggest one (stray hems, collars) that would skew the design's bounds.
  const largest = Math.max(0, ...blobs.map((blob) => blob.length));
  for (const blob of blobs) if (blob.length >= largest * keepRelative) for (const index of blob) zone[index] = 1;
  return zone;
}

/** Grows the print zone by `grow` px and feathers its border (box blur) so protection fades in with no hard steps. */
export function softenZone(zone: Uint8Array, width: number, height: number, grow: number, blur: number): Float32Array {
  const grown = morph(zone, width, height, grow, true);
  const blurAxis = (src: Float32Array, length: number, lines: number, stride: number, lineStride: number) => {
    const dst = new Float32Array(src.length);
    for (let line = 0; line < lines; line++) {
      const origin = line * lineStride;
      for (let k = 0; k < length; k++) {
        let sum = 0;
        let count = 0;
        for (let j = Math.max(0, k - blur); j <= Math.min(length - 1, k + blur); j++) {
          sum += src[origin + j * stride];
          count += 1;
        }
        dst[origin + k * stride] = sum / count;
      }
    }
    return dst;
  };
  const start = Float32Array.from(grown);
  return blurAxis(blurAxis(start, width, height, 1, width), height, width, width, 1);
}

export const dilateMask = (mask: Uint8Array, width: number, height: number, radius: number) => morph(mask, width, height, radius, true);
export const erodeMask = (mask: Uint8Array, width: number, height: number, radius: number) => morph(mask, width, height, radius, false);
