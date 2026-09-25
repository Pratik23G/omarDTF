"use client";

import { useState } from "react";
import type { Product } from "@omardtf/shared-types";
import { requestRecolor } from "@/lib/api";

/** Lets a customer preview the garment in a color of their choice via AI recolor. */
export default function RecolorPanel({ product }: { product: Product }) {
  const [hexColor, setHexColor] = useState("#1d4ed8");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleRecolor() {
    setLoading(true);
    setError(null);
    try {
      const result = await requestRecolor({ productId: product.id, targetColor: hexColor });
      setPreviewUrl(result.image);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Recolor failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 border border-stone-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">AI Recolor</span>
        <input
          type="color"
          value={hexColor}
          onChange={(e) => setHexColor(e.target.value)}
          aria-label="Pick a color"
          className="h-8 w-10 cursor-pointer border border-stone-300"
        />
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Preview this garment in any color. Keeps the printed design as-is.
      </p>
      <button
        onClick={handleRecolor}
        disabled={loading}
        className="mt-3 w-full rounded-full border border-black px-4 py-2 text-sm font-medium uppercase tracking-wide transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Recoloring…" : "Preview this color"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {previewUrl && (
        <img
          src={previewUrl}
          alt={`${product.name} recolored preview`}
          className="mt-3 aspect-square w-full border border-stone-200 object-cover"
        />
      )}
    </div>
  );
}
