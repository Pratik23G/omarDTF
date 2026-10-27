"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildAutoWeights } from "@/lib/auto-mask";
import { loadImageData, paintRecolor } from "@/lib/canvas-recolor";
import { maskUrlFor, loadHandWeights } from "@/lib/mask-file";
import {
  drawOverlay,
  exportMaskBlob,
  fillMaskFromWeights,
  stamp,
  strokeBetween,
  weightsFromMask,
} from "@/lib/mask-painter";
import { protectDesign } from "@/lib/design-protect";
import { describeFabric } from "@/lib/recolor-mask";

type PainterProduct = { id: string; name: string; image: string };

const MAX_UNDO = 8;
const PREVIEW_COLOR = "#1d4ed8";
const BUTTON = "min-h-10 rounded border border-stone-400 px-3 py-1.5 text-sm font-medium hover:bg-stone-200 disabled:opacity-40";

/** Paint-by-hand editor: starts from the automatic mask (or the saved hand mask), saves to public/masks. */
export default function MaskPainter({ products }: { products: PainterProduct[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [erase, setErase] = useState(true);
  const [radius, setRadius] = useState(24);
  const [softness, setSoftness] = useState(0.35);
  const [zoom, setZoom] = useState(1);
  const [previewing, setPreviewing] = useState(false);
  const [status, setStatus] = useState("Loading…");

  const displayRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const sourceRef = useRef<ImageData | null>(null);
  const autoRef = useRef<Float32Array | null>(null);
  const undoRef = useRef<ImageData[]>([]);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const product = products.find((p) => p.id === productId);

  const redraw = useCallback(() => {
    const display = displayRef.current;
    const base = baseRef.current;
    const mask = maskRef.current;
    const source = sourceRef.current;
    if (!display || !base || !mask || !source) return;
    if (previewing) {
      const fabric = describeFabric(source, weightsFromMask(mask), "hand");
      if (fabric) return paintRecolor(display, fabric, PREVIEW_COLOR);
    }
    drawOverlay(display, base, mask);
  }, [previewing]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    setStatus("Loading…");
    undoRef.current = [];
    (async () => {
      const { small, full } = await loadImageData(product.image);
      const hand = await loadHandWeights(product.image, full.width, full.height);
      const auto = buildAutoWeights(small, full);
      if (cancelled) return;

      const base = document.createElement("canvas");
      base.width = full.width;
      base.height = full.height;
      base.getContext("2d")?.putImageData(full, 0, 0);
      const mask = document.createElement("canvas");
      mask.width = full.width;
      mask.height = full.height;
      fillMaskFromWeights(mask, hand ?? auto ?? new Float32Array(full.width * full.height));

      baseRef.current = base;
      maskRef.current = mask;
      sourceRef.current = full;
      autoRef.current = auto;
      setPreviewing(false);
      setStatus(hand ? "Loaded your saved hand mask." : auto ? "Started from the automatic mask." : "No automatic mask for this photo; paint the shirt in with the green brush.");
      redraw();
    })().catch((error) => setStatus(`Couldn't load: ${error instanceof Error ? error.message : error}`));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(redraw, [redraw]);

  function pointFor(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * canvas.width, y: ((event.clientY - rect.top) / rect.height) * canvas.height };
  }

  function snapshot() {
    const mask = maskRef.current;
    if (!mask) return;
    undoRef.current.push((mask.getContext("2d") as CanvasRenderingContext2D).getImageData(0, 0, mask.width, mask.height));
    if (undoRef.current.length > MAX_UNDO) undoRef.current.shift();
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const mask = maskRef.current;
    if (!mask || previewing) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    snapshot();
    lastPoint.current = pointFor(event);
    stamp(mask, lastPoint.current.x, lastPoint.current.y, radius, softness, erase);
    redraw();
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const mask = maskRef.current;
    if (!mask || !lastPoint.current) return;
    const point = pointFor(event);
    strokeBetween(mask, lastPoint.current, point, radius, softness, erase);
    lastPoint.current = point;
    redraw();
  }

  function undo() {
    const mask = maskRef.current;
    const previous = undoRef.current.pop();
    if (!mask || !previous) return;
    (mask.getContext("2d") as CanvasRenderingContext2D).putImageData(previous, 0, 0);
    redraw();
  }

  function resetToAuto() {
    const mask = maskRef.current;
    if (!mask) return;
    snapshot();
    fillMaskFromWeights(mask, autoRef.current ?? new Float32Array(mask.width * mask.height));
    redraw();
  }

  function protectWholeDesign() {
    const mask = maskRef.current;
    const source = sourceRef.current;
    if (!mask || !source) return;
    snapshot();
    fillMaskFromWeights(mask, protectDesign(source, weightsFromMask(mask)));
    redraw();
  }

  function clearAll() {
    const mask = maskRef.current;
    if (!mask) return;
    snapshot();
    fillMaskFromWeights(mask, new Float32Array(mask.width * mask.height));
    redraw();
  }

  async function save() {
    const mask = maskRef.current;
    if (!mask || !product) return;
    const blob = await exportMaskBlob(mask);
    if (!blob) return setStatus("Couldn't export the mask.");
    const form = new FormData();
    form.set("name", maskUrlFor(product.image).replace("/masks/", "").replace(".png", ""));
    form.set("file", blob, "mask.png");
    const response = await fetch("/api/dev/masks", { method: "POST", body: form });
    const result = await response.json().catch(() => null);
    setStatus(response.ok ? `Saved ${result.saved}. Reload the product page to see it.` : "Save failed (dev server only).");
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className="min-h-10 border border-stone-400 px-2">
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button className={BUTTON} onClick={() => setErase(false)} aria-pressed={!erase} style={!erase ? { background: "#bbf7d0" } : undefined}>
          Brush: recolor
        </button>
        <button className={BUTTON} onClick={() => setErase(true)} aria-pressed={erase} style={erase ? { background: "#fecaca" } : undefined}>
          Brush: keep original
        </button>
        <button className={BUTTON} onClick={undo}>Undo</button>
        <button className={BUTTON} onClick={resetToAuto}>Reset to auto</button>
        <button className={BUTTON} onClick={protectWholeDesign}>Protect whole design</button>
        <button className={BUTTON} onClick={clearAll}>Clear all</button>
        <button className={BUTTON} onClick={() => setPreviewing((v) => !v)}>{previewing ? "Back to painting" : "Preview in blue"}</button>
        <button className={`${BUTTON} bg-black text-white hover:bg-stone-700`} onClick={save}>Save mask</button>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">Size {radius}px<input type="range" min={4} max={120} value={radius} onChange={(e) => setRadius(Number(e.target.value))} /></label>
        <label className="flex items-center gap-2">Softness<input type="range" min={0} max={1} step={0.05} value={softness} onChange={(e) => setSoftness(Number(e.target.value))} /></label>
        <label className="flex items-center gap-2">Zoom {zoom.toFixed(1)}x<input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></label>
      </div>
      <p className="text-sm text-stone-600">
        Magenta = will be recolored. Paint &quot;keep original&quot; over the print and anything that shouldn&apos;t change; paint &quot;recolor&quot; over fabric that was missed.
        Saves to <code>public/masks/{product ? maskUrlFor(product.image).replace("/masks/", "") : ""}</code>. {status}
      </p>
      <div className="max-h-[75vh] overflow-auto border border-stone-300 bg-stone-300">
        <canvas
          ref={displayRef}
          style={{ width: `${zoom * 100}%`, touchAction: "none", cursor: "crosshair" }}
          className="block"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (lastPoint.current = null)}
          onPointerCancel={() => (lastPoint.current = null)}
        />
      </div>
    </div>
  );
}
