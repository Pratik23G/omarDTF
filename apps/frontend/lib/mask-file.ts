/** Hand-painted masks: /masks/<photo-name>.png where white = recolor, black = keep, grey = partial. */

/** Maps a product photo path to its hand-painted mask path, e.g. /products/a-tee.png -> /masks/a-tee.png. */
export function maskUrlFor(imageSrc: string): string {
  const name = imageSrc.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
  return `/masks/${name}.png`;
}

/** Loads a hand-painted mask scaled to the photo's size; resolves null when there isn't one. */
export async function loadHandWeights(imageSrc: string, width: number, height: number): Promise<Float32Array | null> {
  const image = new Image();
  image.src = maskUrlFor(imageSrc);
  try {
    await image.decode();
  } catch {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  const weights = new Float32Array(width * height);
  for (let i = 0; i < weights.length; i++) weights[i] = (data[i * 4] / 255) * (data[i * 4 + 3] / 255);
  return weights;
}
