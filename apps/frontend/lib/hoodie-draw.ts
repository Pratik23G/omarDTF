/** Draws a studio-style hoodie product photo in code (front or back view) so any print can be placed on it. */

export const HOODIE_SIZE = { width: 1000, height: 1200 };

export type HoodieView = "front" | "back";

export type HoodieRender = {
  image: HTMLCanvasElement;
  /** White where the fabric is (alpha 1), excluding cords and the print: the recolor mask. */
  fabricMask: HTMLCanvasElement;
};

/** Where a print may sit, per view (canvas px). */
export const PRINT_BOX: Record<HoodieView, { x: number; y: number; width: number; height: number }> = {
  front: { x: 345, y: 440, width: 310, height: 300 },
  back: { x: 320, y: 470, width: 360, height: 480 },
};

type Ctx = CanvasRenderingContext2D;

const newCanvas = () => {
  const canvas = document.createElement("canvas");
  canvas.width = HOODIE_SIZE.width;
  canvas.height = HOODIE_SIZE.height;
  return canvas;
};

/** Small seeded PRNG so every build of the same hoodie is identical. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Every fabric shape of the hoodie, as paths (shared by the color fill and the mask). */
function fabricShapes(view: HoodieView): Path2D[] {
  const shapes: Path2D[] = [];
  const add = (d: string) => shapes.push(new Path2D(d));
  // Sleeves (behind the body), with ribbed cuffs.
  add("M300 365 C235 372 190 405 170 440 L84 930 L226 976 L316 650 L316 380 Z");
  add("M700 365 C765 372 810 405 830 440 L916 930 L774 976 L684 650 L684 380 Z");
  add("M84 930 L226 976 L218 1040 L72 990 Z");
  add("M916 930 L774 976 L782 1040 L928 990 Z");
  if (view === "front") {
    add("M330 385 C300 200 400 92 500 92 C600 92 700 200 670 385 Z"); // hood
    add("M430 358 Q500 482 570 358 Q500 342 430 358 Z"); // inside of the hood showing at the neckline
    add("M300 365 Q400 332 440 352 Q500 470 560 352 Q600 332 700 365 L712 1000 L288 1000 Z"); // body with V neckline
    add("M360 760 L640 760 L692 962 L308 962 Z"); // kangaroo pocket
  } else {
    add("M345 395 C310 200 410 90 500 90 C590 90 690 200 655 395 Q500 450 345 395 Z"); // hood hanging down the back
    add("M300 372 Q500 430 700 372 L712 1000 L288 1000 Z"); // body
  }
  add("M288 1000 L712 1000 L716 1064 L284 1064 Z"); // ribbed hem
  return shapes;
}

/** Draws the cords (front only), which keep their own light color. */
function drawCords(ctx: Ctx) {
  ctx.lineCap = "round";
  ctx.strokeStyle = "#d9d9db";
  ctx.lineWidth = 9;
  for (const [x0, x1] of [[452, 448], [548, 552]]) {
    ctx.beginPath();
    ctx.moveTo(x0, 420);
    ctx.bezierCurveTo(x0 - 5, 490, x1 + 3, 540, x1, 604);
    ctx.stroke();
    ctx.fillStyle = "#b9b9bc";
    ctx.fillRect(x1 - 6, 600, 12, 30);
  }
}

/** Soft folds, seams, edge falloff and fabric grain, clipped to the fabric so they follow the garment. */
function drawShading(ctx: Ctx, shapes: Path2D[], view: HoodieView) {
  const { width, height } = HOODIE_SIZE;
  const random = seeded(7);
  ctx.save();
  const clip = new Path2D();
  for (const shape of shapes) clip.addPath(shape);
  ctx.clip(clip);

  const edge = ctx.createLinearGradient(70, 0, 930, 0);
  edge.addColorStop(0, "rgba(0,0,0,0.38)");
  edge.addColorStop(0.18, "rgba(0,0,0,0)");
  edge.addColorStop(0.82, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, width, height);

  const sheen = ctx.createRadialGradient(440, 520, 20, 440, 520, 420);
  sheen.addColorStop(0, "rgba(255,255,255,0.16)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, width, height);

  // Fabric folds: soft alternating shadow / highlight bands on sleeves and torso.
  ctx.filter = "blur(11px)";
  const fold = (x0: number, y0: number, x1: number, y1: number, bend: number, alpha: number, light: boolean) => {
    ctx.strokeStyle = light ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = 26 + random() * 18;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2 + bend, (y0 + y1) / 2, x1, y1);
    ctx.stroke();
  };
  for (const side of [1, -1]) {
    const cx = (x: number) => (side === 1 ? x : 1000 - x);
    fold(cx(250), 440, cx(190), 640, 26, 0.16, false);
    fold(cx(205), 640, cx(150), 900, -22, 0.14, false);
    fold(cx(236), 520, cx(176), 760, 30, 0.07, true);
    fold(cx(310), 690, cx(335), 990, 10, 0.14, false);
  }
  fold(420, 800, 360, 1000, 12, 0.16, false);
  fold(600, 790, 650, 1000, -12, 0.16, false);
  fold(300, 420, 470, 700, 24, 0.12, false);
  ctx.filter = "none";

  // Seams.
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 3;
  const seam = (d: string) => ctx.stroke(new Path2D(d));
  seam("M300 365 C292 480 292 580 292 650");
  seam("M700 365 C708 480 708 580 708 650");
  seam("M226 976 L218 1040");
  seam("M774 976 L782 1040");
  seam("M288 1000 L712 1000");
  if (view === "front") {
    seam("M360 760 L640 760");
    seam("M360 760 L308 962");
    seam("M640 760 L692 962");
    seam("M440 352 Q500 470 560 352");
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    seam("M360 780 Q330 830 322 900");
    seam("M640 780 Q670 830 678 900");
  } else {
    seam("M500 100 L500 440");
    seam("M345 395 Q500 450 655 395");
  }

  // Ribbed cuffs and hem.
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 2;
  for (let x = 296; x <= 704; x += 14) seam(`M${x} 1002 L${x + (x - 500) * 0.01} 1062`);
  for (let t = 0; t <= 1; t += 0.1) {
    seam(`M${84 + t * 142} ${930 + t * 46} L${72 + t * 146} ${990 + t * 50 - t * 0}`);
    seam(`M${916 - t * 142} ${930 + t * 46} L${928 - t * 146} ${990 + t * 50}`);
  }

  // Inner hood shadow (front): the dark opening behind the neckline.
  if (view === "front") {
    const inner = ctx.createRadialGradient(500, 330, 10, 500, 330, 170);
    inner.addColorStop(0, "rgba(0,0,0,0.85)");
    inner.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.moveTo(380, 372);
    ctx.bezierCurveTo(370, 230, 430, 160, 500, 160);
    ctx.bezierCurveTo(570, 160, 630, 230, 620, 372);
    ctx.quadraticCurveTo(560, 335, 500, 440);
    ctx.quadraticCurveTo(440, 335, 380, 372);
    ctx.fill();
  }

  // Fabric grain: fine neutral noise blended in only where there is fabric.
  const noise = newCanvas();
  const noiseCtx = noise.getContext("2d") as Ctx;
  const grain = noiseCtx.createImageData(width, height);
  for (let i = 0; i < grain.data.length; i += 4) {
    const value = 128 + (random() - 0.5) * 46;
    grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = value;
    grain.data[i + 3] = 255;
  }
  noiseCtx.putImageData(grain, 0, 0);
  ctx.globalCompositeOperation = "soft-light";
  ctx.drawImage(noise, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

/**
 * Renders the hoodie in `color`. `printLayer` (if given) is drawn on the fabric before the shading, so the print
 * picks up the same folds and edge falloff as the cloth.
 */
export function drawHoodie(view: HoodieView, color: string, printLayer?: HTMLCanvasElement): HoodieRender {
  const { width, height } = HOODIE_SIZE;
  const image = newCanvas();
  const ctx = image.getContext("2d", { willReadFrequently: true }) as Ctx;

  const backdrop = ctx.createRadialGradient(500, 520, 100, 500, 560, 760);
  backdrop.addColorStop(0, "#ececee");
  backdrop.addColorStop(1, "#d5d5d8");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  const shapes = fabricShapes(view);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 22;
  ctx.fillStyle = color;
  for (const shape of shapes) ctx.fill(shape);
  ctx.restore();
  ctx.fillStyle = color;
  for (const shape of shapes) ctx.fill(shape);

  if (printLayer) ctx.drawImage(printLayer, 0, 0);
  drawShading(ctx, shapes, view);
  if (view === "front") drawCords(ctx);

  const fabricMask = newCanvas();
  const maskCtx = fabricMask.getContext("2d") as Ctx;
  maskCtx.fillStyle = "#fff";
  for (const shape of shapes) maskCtx.fill(shape);
  if (printLayer) {
    maskCtx.globalCompositeOperation = "destination-out";
    maskCtx.drawImage(printLayer, 0, 0);
  }
  return { image, fabricMask };
}
