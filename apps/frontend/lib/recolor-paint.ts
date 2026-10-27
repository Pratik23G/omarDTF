/** Paints a recolored garment: hue from the chosen color, shading and weave from the original photo. */
import { luminance, type RecolorMask } from "./recolor-mask";

// Highlights may exceed the fabric's reference brightness a little (sheen, lit folds) but not blow out.
const MAX_SHADE = 1.35;
// <1 lifts shadows slightly so deep folds on dark fabric don't crush to flat black once recolored.
const SHADE_GAMMA = 0.9;
// Light cloth shows far less contrast than dark cloth under the same light, so shading is damped as the target brightens.
const LIGHT_CONTRAST = 0.5;
const SHADE_FLOOR_DARK = 0.25;
const SHADE_FLOOR_LIGHT = 0.6;

/** Parses "#rrggbb" into [r, g, b]. */
export function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/**
 * Each fabric pixel's brightness relative to the fabric's highlight brightness scales the target color, which
 * is how real dyed cloth behaves: wrinkles, seams and weave keep their depth at any color. The original
 * photo is never modified; the result is drawn on the given canvas.
 */
export function paintRecolor(canvas: HTMLCanvasElement, mask: RecolorMask, hex: string) {
  const { source, weights, referenceLuminance } = mask;
  const target = hexToRgb(hex);
  const lightness = Math.min(1, Math.max(0, (luminance(...target) - 0.35) / 0.5));
  const contrast = 1 - (1 - LIGHT_CONTRAST) * lightness;
  const floor = SHADE_FLOOR_DARK + (SHADE_FLOOR_LIGHT - SHADE_FLOOR_DARK) * lightness;

  const output = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  const out = output.data;
  for (let index = 0; index < weights.length; index++) {
    const weight = weights[index];
    if (weight <= 0.002) continue;
    const i = index * 4;
    const raw = Math.pow(Math.min(MAX_SHADE, luminance(out[i], out[i + 1], out[i + 2]) / referenceLuminance), SHADE_GAMMA);
    const shade = Math.max(floor, 1 + (raw - 1) * contrast);
    for (let k = 0; k < 3; k++) {
      const painted = Math.min(255, target[k] * shade);
      out[i + k] = out[i + k] + (painted - out[i + k]) * weight;
    }
  }

  canvas.width = source.width;
  canvas.height = source.height;
  canvas.getContext("2d")?.putImageData(output, 0, 0);
}
