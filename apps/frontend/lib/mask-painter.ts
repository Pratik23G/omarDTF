/** Canvas helpers for the dev mask painter. The mask canvas stores white with alpha = recolor strength. */

/** Fills the mask canvas from 0..1 weights. */
export function fillMaskFromWeights(mask: HTMLCanvasElement, weights: Float32Array) {
  const context = mask.getContext("2d") as CanvasRenderingContext2D;
  const image = context.createImageData(mask.width, mask.height);
  for (let i = 0; i < weights.length; i++) {
    image.data[i * 4] = image.data[i * 4 + 1] = image.data[i * 4 + 2] = 255;
    image.data[i * 4 + 3] = Math.round(weights[i] * 255);
  }
  context.putImageData(image, 0, 0);
}

/** Reads the mask canvas back as 0..1 weights. */
export function weightsFromMask(mask: HTMLCanvasElement): Float32Array {
  const { data } = (mask.getContext("2d") as CanvasRenderingContext2D).getImageData(0, 0, mask.width, mask.height);
  const weights = new Float32Array(mask.width * mask.height);
  for (let i = 0; i < weights.length; i++) weights[i] = data[i * 4 + 3] / 255;
  return weights;
}

/** Stamps one soft round dab: `erase` removes recolor (keep original), otherwise adds it. */
export function stamp(mask: HTMLCanvasElement, x: number, y: number, radius: number, softness: number, erase: boolean) {
  const context = mask.getContext("2d") as CanvasRenderingContext2D;
  const gradient = context.createRadialGradient(x, y, radius * (1 - softness), x, y, radius);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.globalCompositeOperation = erase ? "destination-out" : "source-over";
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.globalCompositeOperation = "source-over";
}

/** Stamps along a line so fast strokes stay continuous. */
export function strokeBetween(
  mask: HTMLCanvasElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  radius: number,
  softness: number,
  erase: boolean,
) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius / 4)));
  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    stamp(mask, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, radius, softness, erase);
  }
}

/** Draws the photo with the masked (to-be-recolored) area tinted magenta. */
export function drawOverlay(display: HTMLCanvasElement, base: HTMLCanvasElement, mask: HTMLCanvasElement) {
  const tint = document.createElement("canvas");
  tint.width = mask.width;
  tint.height = mask.height;
  const tintContext = tint.getContext("2d") as CanvasRenderingContext2D;
  tintContext.fillStyle = "rgba(255,0,190,0.55)";
  tintContext.fillRect(0, 0, tint.width, tint.height);
  tintContext.globalCompositeOperation = "destination-in";
  tintContext.drawImage(mask, 0, 0);

  display.width = base.width;
  display.height = base.height;
  const context = display.getContext("2d") as CanvasRenderingContext2D;
  context.drawImage(base, 0, 0);
  context.drawImage(tint, 0, 0);
}

/** Exports the mask as a grayscale PNG (white = recolor, black = keep), the format the site loads. */
export function exportMaskBlob(mask: HTMLCanvasElement): Promise<Blob | null> {
  const flat = document.createElement("canvas");
  flat.width = mask.width;
  flat.height = mask.height;
  const context = flat.getContext("2d") as CanvasRenderingContext2D;
  context.fillStyle = "#000";
  context.fillRect(0, 0, flat.width, flat.height);
  context.drawImage(mask, 0, 0);
  return new Promise((resolve) => flat.toBlob(resolve, "image/png"));
}
