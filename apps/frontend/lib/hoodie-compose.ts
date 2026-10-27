/** Builds a hoodie product photo (and its recolor mask) from a tee photo's printed design. */
import { loadImageData } from "./canvas-recolor";
import { extractDesign, type ExtractedDesign } from "./design-extract";
import { loadHoodieBase, type HoodieBase } from "./hoodie-base";
import { drawHoodie, HOODIE_SIZE, PRINT_BOX, type HoodieRender, type HoodieView } from "./hoodie-draw";
import { describeFabric, luminance } from "./recolor-mask";
import { hexToRgb, paintRecolor } from "./recolor-paint";

// Pure black cloth would hide every fold once shaded, so very dark fabrics are lifted slightly (still reads as black).
const MIN_CHANNEL = 26;
const toHex = ([r, g, b]: number[]) => `#${[r, g, b].map((v) => Math.max(MIN_CHANNEL, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
// The photo base is already black; only recolor when the target is clearly lighter than that.
const RECOLOR_ABOVE_LUMINANCE = 0.12;

export type ComposedHoodie = HoodieRender & { color: string };

/** True for designs printed on the back of the tee (name or description says so). */
export const isBackPrint = (product: { name: string; description: string }) => /back[- ]?print/i.test(`${product.name} ${product.description}`);

const newCanvas = (width: number, height: number) => Object.assign(document.createElement("canvas"), { width, height });

/** Fits the design's bounds into `box`, centered, on a canvas of `size`. */
function placeDesign(design: ExtractedDesign, box: { x: number; y: number; width: number; height: number }, size: { width: number; height: number }) {
  const { bounds } = design;
  const scale = Math.min(box.width / bounds.width, box.height / bounds.height);
  const width = bounds.width * scale;
  const height = bounds.height * scale;
  const layer = newCanvas(size.width, size.height);
  const context = layer.getContext("2d") as CanvasRenderingContext2D;
  context.imageSmoothingQuality = "high";
  context.drawImage(design.canvas, bounds.x, bounds.y, bounds.width, bounds.height, box.x + (box.width - width) / 2, box.y + (box.height - height) / 2, width, height);
  return layer;
}

/** Recolors the base photo's cloth (if needed), lays the print on it with the cloth's fold shading, then the drawstrings. */
function composeOnPhoto(base: HoodieBase, design: ExtractedDesign | null, color: string): ComposedHoodie {
  const { width, height } = base.canvas;
  const image = newCanvas(width, height);
  const ctx = image.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  const fabric = describeFabric(base.pixels, base.weights, "hand");
  if (fabric && luminance(...hexToRgb(color)) > RECOLOR_ABOVE_LUMINANCE) paintRecolor(image, fabric, color);
  else ctx.drawImage(base.canvas, 0, 0);

  const layer = design ? placeDesign(design, base.printBox, { width, height }) : newCanvas(width, height);
  const layerCtx = layer.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  const printed = layerCtx.getImageData(0, 0, width, height);

  // Let the print follow the cloth: scale it by the broad brightness of the folds underneath.
  const blur = newCanvas(width, height);
  const blurCtx = blur.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  blurCtx.filter = "blur(8px)";
  blurCtx.drawImage(base.canvas, 0, 0);
  const smooth = blurCtx.getImageData(0, 0, width, height).data;
  const reference = Math.max(0.06, fabric?.referenceLuminance ?? 0.1);
  const maskCanvas = newCanvas(width, height);
  const maskCtx = maskCanvas.getContext("2d") as CanvasRenderingContext2D;
  const mask = maskCtx.createImageData(width, height);
  for (let i = 0; i < base.weights.length; i++) {
    const alpha = printed.data[i * 4 + 3] / 255;
    if (alpha > 0) {
      const folds = Math.min(1.4, luminance(smooth[i * 4], smooth[i * 4 + 1], smooth[i * 4 + 2]) / reference);
      const factor = 0.8 + 0.2 * folds;
      for (let k = 0; k < 3; k++) printed.data[i * 4 + k] = Math.min(255, printed.data[i * 4 + k] * factor);
    }
    mask.data[i * 4] = mask.data[i * 4 + 1] = mask.data[i * 4 + 2] = 255;
    mask.data[i * 4 + 3] = Math.round(base.weights[i] * (1 - alpha) * 255);
  }
  layerCtx.putImageData(printed, 0, 0);
  maskCtx.putImageData(mask, 0, 0);

  ctx.drawImage(layer, 0, 0);
  ctx.drawImage(base.cords, 0, 0);
  return { image, fabricMask: maskCanvas, color };
}

/** A hoodie with no print, in `color`, for the custom-order product. */
export async function blankHoodie(color = "#16171a"): Promise<ComposedHoodie> {
  const base = await loadHoodieBase("front");
  return base ? composeOnPhoto(base, null, color) : { ...drawHoodie("front", color), color };
}

/**
 * Takes the print from `teeSrc` and puts it on a hoodie in the tee's own fabric color (so the print's soft edges
 * blend in) unless `color` is given. Uses the hoodie photo base when one is prepared, else the drawn hoodie.
 */
export async function composeHoodie(teeSrc: string, view: HoodieView, color?: string): Promise<ComposedHoodie | null> {
  const { full } = await loadImageData(teeSrc);
  const design = extractDesign(full);
  if (!design) return null;
  const hoodieColor = color ?? toHex(design.fabric);

  const base = await loadHoodieBase(view);
  if (base) return composeOnPhoto(base, design, hoodieColor);

  const layer = placeDesign(design, PRINT_BOX[view], HOODIE_SIZE);
  return { ...drawHoodie(view, hoodieColor, layer), color: hoodieColor };
}
