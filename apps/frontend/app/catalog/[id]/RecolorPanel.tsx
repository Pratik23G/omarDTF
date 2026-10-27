"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@omardtf/shared-types";
import { loadRecolorMask, paintRecolor, type RecolorMask } from "@/lib/canvas-recolor";

const PRESETS = [
  { name: "Royal blue", hex: "#1d4ed8" },
  { name: "Red", hex: "#b91c1c" },
  { name: "Forest green", hex: "#166534" },
  { name: "Purple", hex: "#6d28d9" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Pink", hex: "#db2777" },
  { name: "Gold", hex: "#ca8a04" },
  { name: "White", hex: "#f5f5f4" },
];

type Status = "loading" | "ready" | "unsupported";

/** Lets a customer preview the garment in any color, recolored in the browser (free, instant, no AI call). */
export default function RecolorPanel({ product }: { product: Product }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<RecolorMask | null>(null);
  const [hexColor, setHexColor] = useState("#1d4ed8");
  const [status, setStatus] = useState<Status>("loading");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    maskRef.current = null;
    setStatus("loading");
    loadRecolorMask(product.images[0])
      .then((mask) => {
        if (cancelled) return;
        maskRef.current = mask;
        setStatus(mask ? "ready" : "unsupported");
      })
      .catch((error) => {
        console.error("color preview unavailable:", error);
        if (!cancelled) setStatus("unsupported");
      });
    return () => {
      cancelled = true;
    };
  }, [product.images]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (status === "ready" && touched && canvas && maskRef.current) {
      paintRecolor(canvas, maskRef.current, hexColor);
    }
  }, [status, touched, hexColor]);

  function pick(hex: string) {
    setHexColor(hex);
    setTouched(true);
  }

  if (status === "unsupported") return null;

  return (
    <div className="mt-4 border border-stone-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Try another color</span>
        <label className="flex items-center gap-2 text-xs text-stone-500">
          Custom
          <input
            type="color"
            value={hexColor}
            onChange={(e) => pick(e.target.value)}
            aria-label="Pick a custom color"
            className="h-10 w-11 cursor-pointer border border-stone-300 p-0.5"
          />
        </label>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Preview this tee in a color we don&apos;t stock. The printed design stays as-is.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.hex}
            type="button"
            onClick={() => pick(preset.hex)}
            aria-label={preset.name}
            aria-pressed={touched && hexColor === preset.hex}
            disabled={status !== "ready"}
            style={{ backgroundColor: preset.hex }}
            className={`h-11 w-11 rounded-full border-2 transition disabled:opacity-40 ${
              touched && hexColor === preset.hex ? "border-black ring-2 ring-black/20" : "border-stone-300"
            }`}
          />
        ))}
      </div>
      {status === "loading" && <p className="mt-3 text-xs text-stone-400">Getting the preview ready…</p>}
      {touched && (
        <div className="mt-3">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`${product.name} in ${hexColor}`}
            className="h-auto w-full border border-stone-200"
          />
          <button
            type="button"
            onClick={() => setTouched(false)}
            className="mt-2 min-h-11 text-xs font-semibold uppercase tracking-wide text-stone-500 hover:text-black"
          >
            Reset preview
          </button>
          <p className="text-xs text-stone-400">Preview only. Real fabric color and shade may vary slightly.</p>
        </div>
      )}
    </div>
  );
}
