/**
 * Photo-based hoodie bases. A base is a blank hoodie photo plus: a fabric mask (white = recolorable cloth),
 * a drawstring layer (drawn over the print) and the print placement. `prepareFrontBase` builds them once from
 * a reference photo; `loadHoodieBase` reads them back at compose time.
 */
import { findOuterBackground } from "./print-zone";

export type PrintBox = { x: number; y: number; width: number; height: number };
export type HoodieBase = {
  canvas: HTMLCanvasElement;
  pixels: ImageData;
  /** 0..1 per pixel: hoodie cloth (excludes drawstrings). */
  weights: Float32Array;
  cords: HTMLCanvasElement;
  printBox: PrintBox;
};
export type PreparedBase = { blank: HTMLCanvasElement; mask: HTMLCanvasElement; cords: HTMLCanvasElement; meta: { printBox: PrintBox } };

// Measured on the reference photo (full-image coordinates). The print plate and drawstrings are specific to it.
const REF = {
  crop: { x: 112, y: 89, width: 827, height: 827 },
  stray: { x: 106, y: 83, width: 278, height: 76 }, // text box the image generator left in the corner (full-image coords)
  hoodCenterX: 520, // horizontal center of the hood where the photo is cut off
  plate: { x: 424, y: 364, width: 196, height: 259 }, // printed panel (padded) to erase
  cordBands: [{ x: 466, y: 316, width: 40, height: 135 }, { x: 548, y: 316, width: 40, height: 135 }],
};
const PAD = { x: 20, top: 60, bottom: 20 };
const CAP_HEIGHT = 12;
const MAX_CORD_WIDTH = 16;
// Only clearly dark edge pixels count as hoodie; lighter ones are mostly backdrop or its shadow, and recoloring them leaves a ring.
const EDGE_BACKDROP_LUMINANCE = 195;
const MASK_EDGE_BLUR_PX = 0.9;
const EDGE_HOODIE_LUMINANCE = 45;
const SHARPEN_AMOUNT = 0.7;
const SHARPEN_RADIUS_PX = 1.3;

const lumAt = (d: Uint8ClampedArray, i: number) => 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
const canvasOf = (width: number, height: number) => Object.assign(document.createElement("canvas"), { width, height });

/** Unsharp mask: adds back the difference from a slight blur so ribbing, seams and weave read crisply. */
function sharpen(ctx: CanvasRenderingContext2D, width: number, height: number, outside: Uint8Array) {
  const original = ctx.getImageData(0, 0, width, height);
  const soft = canvasOf(width, height);
  const softCtx = soft.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  softCtx.filter = `blur(${SHARPEN_RADIUS_PX}px)`;
  softCtx.drawImage(ctx.canvas, 0, 0);
  const blurred = softCtx.getImageData(0, 0, width, height).data;
  for (let i = 0; i < original.data.length; i += 4) {
    // Only well inside the cloth: sharpening the silhouette edge would leave a bright halo against the backdrop.
    if (outside[i / 4] || nearOutside(outside, i / 4, width, height)) continue;
    for (let k = 0; k < 3; k++) {
      original.data[i + k] = Math.max(0, Math.min(255, original.data[i + k] + (original.data[i + k] - blurred[i + k]) * SHARPEN_AMOUNT));
    }
  }
  ctx.putImageData(original, 0, 0);
}

/** Fills a rectangle by blending the pixels just outside its four sides across it, plus matching grain. */
function inpaintRect(image: ImageData, width: number, rect: { x: number; y: number; width: number; height: number }, grain: number) {
  const px = (x: number, y: number, k: number) => image.data[(y * width + x) * 4 + k];
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) {
      const tx = (x - rect.x) / rect.width;
      const ty = (y - rect.y) / rect.height;
      const noise = (Math.random() - 0.5) * 2 * grain;
      for (let k = 0; k < 3; k++) {
        const horizontal = px(rect.x - 3, y, k) * (1 - tx) + px(rect.x + rect.width + 3, y, k) * tx;
        const vertical = px(x, rect.y - 3, k) * (1 - ty) + px(x, rect.y + rect.height + 3, k) * ty;
        image.data[(y * width + x) * 4 + k] = Math.max(0, Math.min(255, (horizontal + vertical) / 2 + noise));
      }
    }
  }
}

/** Blank hoodie from the reference: hood dome restored, stray text and print removed, drawstrings split off. */
export function prepareFrontBase(reference: HTMLImageElement): PreparedBase {
  const { crop } = REF;
  const width = crop.width + PAD.x * 2;
  const height = crop.height + PAD.top + PAD.bottom;
  const canvas = canvasOf(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;

  // The photo is smooth backdrop behind the stray text box, so stretch the clean column just right of it across.
  const sampler = canvasOf(reference.naturalWidth, reference.naturalHeight);
  const sctx = sampler.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  sctx.drawImage(reference, 0, 0);
  const { stray } = REF;
  sctx.drawImage(sampler, stray.x + stray.width + 2, stray.y, 1, stray.height, stray.x, stray.y, stray.width, stray.height);

  // Padding: stretch the photo's own edge pixels outward so the crop boundary is invisible.
  ctx.drawImage(sampler, crop.x, crop.y, crop.width, crop.height, PAD.x, PAD.top, crop.width, crop.height);
  const padRight = PAD.x + crop.width;
  const bottom = PAD.top + crop.height;
  ctx.drawImage(sampler, crop.x, crop.y, 1, crop.height, 0, PAD.top, PAD.x, crop.height);
  ctx.drawImage(sampler, crop.x + crop.width - 1, crop.y, 1, crop.height, padRight, PAD.top, PAD.x, crop.height);
  ctx.drawImage(sampler, crop.x, crop.y, crop.width, 1, PAD.x, 0, crop.width, PAD.top);
  ctx.drawImage(sampler, crop.x, crop.y + crop.height - 1, crop.width, 1, PAD.x, bottom, crop.width, PAD.bottom);
  for (const [sx, sy, dx, dy, w, h] of [
    [crop.x, crop.y, 0, 0, PAD.x, PAD.top],
    [crop.x + crop.width - 1, crop.y, padRight, 0, PAD.x, PAD.top],
    [crop.x, crop.y + crop.height - 1, 0, bottom, PAD.x, PAD.bottom],
    [crop.x + crop.width - 1, crop.y + crop.height - 1, padRight, bottom, PAD.x, PAD.bottom],
  ]) ctx.drawImage(sampler, sx, sy, 1, 1, dx, dy, w, h);

  const at = (r: { x: number; y: number; width: number; height: number }) => ({ x: r.x - crop.x + PAD.x, y: r.y - crop.y + PAD.top, width: r.width, height: r.height });


  // Restore the clipped hood: find the hood's width at the top edge, then close it with a dome.
  const top = ctx.getImageData(0, PAD.top + 1, width, 1).data;
  const hoodCenter = REF.hoodCenterX - crop.x + PAD.x;
  let left = hoodCenter;
  let right = hoodCenter;
  while (left > 0 && lumAt(top, left - 1) < 70) left--;
  while (right < width - 1 && lumAt(top, right + 1) < 70) right++;
  if (right - left < 40) left = right = -1;
  if (left >= 0) {
    // The stretched top edge would smear the dark hood upward; blend the backdrop across those columns instead.
    const pad = ctx.getImageData(0, 0, width, PAD.top);
    for (let y = 0; y < PAD.top; y++) {
      for (let x = left; x <= right; x++) {
        const t = (x - left) / Math.max(1, right - left);
        for (let k = 0; k < 3; k++) pad.data[(y * width + x) * 4 + k] = pad.data[(y * width + left - 3) * 4 + k] * (1 - t) + pad.data[(y * width + right + 3) * 4 + k] * t;
      }
    }
    ctx.putImageData(pad, 0, 0);
  }
  if (left >= 0) {
    const gradient = ctx.createLinearGradient(left, PAD.top - CAP_HEIGHT, right, PAD.top);
    gradient.addColorStop(0, "#1a1a1c");
    gradient.addColorStop(1, "#0b0b0c");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse((left + right) / 2, PAD.top + 2, (right - left) / 2, CAP_HEIGHT, 0, Math.PI, 2 * Math.PI);
    ctx.fill();
  }

  // Drawstrings: bright, colorless pixels inside the cord bands, kept as their own layer.
  const cords = canvasOf(width, height);
  const cordCtx = cords.getContext("2d") as CanvasRenderingContext2D;
  const source = ctx.getImageData(0, 0, width, height);
  const cordPixels = cordCtx.createImageData(width, height);
  const cordMask = new Uint8Array(width * height);
  for (const band of REF.cordBands) {
    const b = at(band);
    for (let y = b.y; y < b.y + b.height; y++) {
      for (let x = b.x; x < b.x + b.width; x++) {
        const i = y * width + x;
        const r = source.data[i * 4], g = source.data[i * 4 + 1], bl = source.data[i * 4 + 2];
        if (lumAt(source.data, i) > 195 && Math.max(r, g, bl) - Math.min(r, g, bl) < 28) cordMask[i] = 1;
      }
    }
  }
  // Keep thin strands only: wide bright runs are hardware or highlights, not drawstring.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!cordMask[y * width + x]) continue;
      let end = x;
      while (end < width && cordMask[y * width + end]) end++;
      if (end - x > MAX_CORD_WIDTH) for (let k = x; k < end; k++) cordMask[y * width + k] = 0;
      x = end;
    }
  }
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (!(cordMask[i] || cordMask[i - 1] || cordMask[i + 1] || cordMask[i - width] || cordMask[i + width])) continue;
      cordPixels.data.set(source.data.subarray(i * 4, i * 4 + 3), i * 4);
      cordPixels.data[i * 4 + 3] = cordMask[i] ? 255 : 150;
    }
  }
  cordCtx.putImageData(cordPixels, 0, 0);

  // Take the drawstrings out of the photo (fill across them from the fabric either side), then erase the print.
  const removal = new Uint8Array(cordMask);
  for (let y = 0; y < height; y++) {
    for (let x = 4; x < width - 4; x++) if (cordMask[y * width + x]) for (let dx = -4; dx <= 4; dx++) removal[y * width + x + dx] = 1;
  }
  for (let y = 0; y < height; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!removal[y * width + x]) continue;
      let l = x;
      let r = x;
      while (l > 0 && (removal[y * width + l] || removal[y * width + l - 1])) l--;
      while (r < width - 1 && (removal[y * width + r] || removal[y * width + r + 1])) r++;
      l = Math.max(0, l - 2);
      r = Math.min(width - 1, r + 2);
      const t = (x - l) / Math.max(1, r - l);
      for (let k = 0; k < 3; k++) source.data[(y * width + x) * 4 + k] = source.data[(y * width + l) * 4 + k] * (1 - t) + source.data[(y * width + r) * 4 + k] * t;
    }
  }
  inpaintRect(source, width, at(REF.plate), 3);
  ctx.putImageData(source, 0, 0);

  // Fabric mask: the dark hoodie silhouette (holes filled), soft at the edge, minus the drawstrings.
  const dark = new Uint8Array(width * height);
  for (let i = 0; i < dark.length; i++) dark[i] = lumAt(source.data, i) < 95 ? 1 : 0;
  const outside = findOuterBackground(new Uint8ClampedArray(source.data.map((v, i) => (i % 4 === 3 ? 255 : dark[(i / 4) | 0] ? 0 : 255))), width, height, [255, 255, 255], 30);
  const mask = canvasOf(width, height);
  const maskCtx = mask.getContext("2d") as CanvasRenderingContext2D;
  const maskPixels = maskCtx.createImageData(width, height);
  for (let i = 0; i < outside.length; i++) {
    const inside = !outside[i];
    // Edge pixels blend hoodie and backdrop; how dark they are says how much of the pixel is hoodie.
    const edge = Math.max(0, Math.min(1, (EDGE_BACKDROP_LUMINANCE - lumAt(source.data, i)) / (EDGE_BACKDROP_LUMINANCE - EDGE_HOODIE_LUMINANCE)));
    const alpha = inside ? 1 : edge * (nearInside(outside, i, width, height) ? 1 : 0);
    const cord = cordPixels.data[i * 4 + 3] > 0 ? 0 : 1;
    maskPixels.data[i * 4] = maskPixels.data[i * 4 + 1] = maskPixels.data[i * 4 + 2] = 255;
    maskPixels.data[i * 4 + 3] = Math.round(alpha * cord * 255);
  }
  // A touch of blur on the mask edge hides the pixel stair-steps, so recolored edges don't show a dashed line.
  const rawMask = canvasOf(width, height);
  rawMask.getContext("2d")?.putImageData(maskPixels, 0, 0);
  maskCtx.filter = `blur(${MASK_EDGE_BLUR_PX}px)`;
  maskCtx.drawImage(rawMask, 0, 0);
  maskCtx.filter = "none";
  sharpen(ctx, width, height, outside);

  const centerX = REF.plate.x + REF.plate.width / 2 - crop.x + PAD.x;
  const centerY = REF.plate.y + REF.plate.height / 2 - crop.y + PAD.top;
  const printBox = { x: Math.round(centerX - 112), y: Math.round(centerY - 140), width: 224, height: 280 };
  return { blank: canvas, mask, cords, meta: { printBox } };
}

/** True if any pixel within 4px is outside the hoodie. */
function nearOutside(outside: Uint8Array, i: number, width: number, height: number): boolean {
  const x = i % width;
  const y = (i / width) | 0;
  for (const d of [-4, -2, 2, 4]) {
    if (x + d < 0 || x + d >= width || y + d < 0 || y + d >= height) return true;
    if (outside[y * width + x + d] || outside[(y + d) * width + x]) return true;
  }
  return false;
}

/** True if a pixel within 2px belongs to the hoodie (used to keep the soft edge from leaking into the backdrop). */
function nearInside(outside: Uint8Array, i: number, width: number, height: number): boolean {
  const x = i % width;
  const y = (i / width) | 0;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < width && ny < height && !outside[ny * width + nx]) return true;
    }
  }
  return false;
}

/**
 * A back view derived from the front base: the hood opening is closed over, the pocket and drawstrings are gone,
 * and the print area is the broad back panel. Only the broad shapes change, so it keeps the photo's cloth and lighting.
 */
export function prepareBackBase(front: HoodieBase): PreparedBase {
  const { width, height } = front.canvas;
  const blank = canvasOf(width, height);
  const ctx = blank.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  ctx.drawImage(front.canvas, 0, 0);

  const image = ctx.getImageData(0, 0, width, height);
  inpaintRect(image, width, { x: 270, y: 598, width: 318, height: 214 }, 2.5); // kangaroo pocket
  ctx.putImageData(image, 0, 0);

  // Close the hood: fill the opening and the neckline V with hood cloth.
  const rim = ctx.getImageData(318, 200, 10, 40).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < rim.length; i += 4) { r += rim[i]; g += rim[i + 1]; b += rim[i + 2]; }
  const n = rim.length / 4;
  const cloth = `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
  const hood = new Path2D("M318 252 C312 160 360 100 433 100 C506 100 552 160 548 252 L520 272 Q433 350 345 272 Z");
  const fill = ctx.createLinearGradient(0, 100, 0, 330);
  fill.addColorStop(0, cloth);
  fill.addColorStop(1, "#111113");
  ctx.fillStyle = fill;
  ctx.fill(hood);
  ctx.save();
  ctx.clip(hood);
  const highlight = ctx.createRadialGradient(433, 170, 10, 433, 170, 150);
  highlight.addColorStop(0, "rgba(255,255,255,0.07)");
  highlight.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = highlight;
  ctx.fillRect(300, 90, 270, 270);
  ctx.strokeStyle = "rgba(0,0,0,0.5)"; // center seam of the hood
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(433, 100);
  ctx.lineTo(433, 330);
  ctx.stroke();
  ctx.restore();
  const grain = ctx.getImageData(300, 90, 270, 270);
  for (let i = 0; i < grain.data.length; i += 4) {
    const x = (i / 4) % 270 + 300;
    const y = Math.floor(i / 4 / 270) + 90;
    if (!ctx.isPointInPath(hood, x, y)) continue;
    const noise = (Math.random() - 0.5) * 7;
    grain.data[i] += noise; grain.data[i + 1] += noise; grain.data[i + 2] += noise;
  }
  ctx.putImageData(grain, 300, 90);

  // Cords are gone on the back, so the cloth mask covers where they were.
  const cordPixels = front.cords.getContext("2d")?.getImageData(0, 0, width, height).data;
  const weights = new Float32Array(front.weights);
  if (cordPixels) for (let i = 0; i < weights.length; i++) if (cordPixels[i * 4 + 3] > 0 || weights[i] === 0 && nearCord(cordPixels, i, width, height)) weights[i] = Math.max(weights[i], 1);
  const mask = canvasOf(width, height);
  const maskCtx = mask.getContext("2d") as CanvasRenderingContext2D;
  const maskImage = maskCtx.createImageData(width, height);
  for (let i = 0; i < weights.length; i++) {
    maskImage.data[i * 4] = maskImage.data[i * 4 + 1] = maskImage.data[i * 4 + 2] = 255;
    maskImage.data[i * 4 + 3] = Math.round(weights[i] * 255);
  }
  maskCtx.putImageData(maskImage, 0, 0);

  return { blank, mask, cords: canvasOf(width, height), meta: { printBox: { x: 282, y: 338, width: 300, height: 392 } } };
}

/** True when a cord pixel is within 3px (so the soft hole around a removed cord is filled too). */
function nearCord(cordPixels: Uint8ClampedArray, i: number, width: number, height: number): boolean {
  const x = i % width;
  const y = (i / width) | 0;
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < width && ny < height && cordPixels[(ny * width + nx) * 4 + 3] > 0) return true;
  }
  return false;
}

const loadImage = async (src: string) => {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
};

/** Loads a prepared base for a view, or null if none has been prepared yet. */
export async function loadHoodieBase(view: "front" | "back"): Promise<HoodieBase | null> {
  try {
    const [blank, mask, cordsImage, meta] = await Promise.all([
      loadImage(`/hoodie-bases/${view}-blank.jpg`),
      loadImage(`/hoodie-bases/${view}-mask.png`),
      loadImage(`/hoodie-bases/${view}-cords.png`),
      fetch(`/hoodie-bases/${view}.json`).then((r) => (r.ok ? (r.json() as Promise<{ printBox: PrintBox }>) : Promise.reject(new Error("missing")))),
    ]);
    const canvas = canvasOf(blank.naturalWidth, blank.naturalHeight);
    const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    ctx.drawImage(blank, 0, 0);
    const maskCanvas = canvasOf(canvas.width, canvas.height);
    const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    maskCtx.drawImage(mask, 0, 0);
    const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height).data;
    const weights = new Float32Array(canvas.width * canvas.height);
    for (let i = 0; i < weights.length; i++) weights[i] = (maskData[i * 4] / 255) * (maskData[i * 4 + 3] / 255);
    const cords = canvasOf(canvas.width, canvas.height);
    cords.getContext("2d")?.drawImage(cordsImage, 0, 0);
    return { canvas, pixels: ctx.getImageData(0, 0, canvas.width, canvas.height), weights, cords, printBox: meta.printBox };
  } catch {
    return null;
  }
}
