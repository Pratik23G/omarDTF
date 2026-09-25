"use client";

import { useState } from "react";
import type { Product } from "@omardtf/shared-types";
import FitCheckModal from "@/components/fit/FitCheckModal";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useCartStore } from "@/lib/cart-store";
import RecolorPanel from "./RecolorPanel";

export default function ProductOptions({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [added, setAdded] = useState(false);
  const [fitOpen, setFitOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  function handleAddToCart() {
    addItem(product, size, color);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="mt-6 space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Size</span>
          <button
            onClick={() => setFitOpen(true)}
            className="text-sm font-semibold uppercase tracking-wide text-accent underline-offset-4 hover:underline"
          >
            Not sure? AI fit check
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                size === s
                  ? "border-black bg-black text-white"
                  : "border-stone-300 text-stone-600 hover:border-black"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="text-sm font-medium">Color</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {product.colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                color === c
                  ? "border-accent bg-accent text-white"
                  : "border-stone-300 text-stone-600 hover:border-black"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <RecolorPanel product={product} />
      <button
        onClick={handleAddToCart}
        className="mt-2 w-full rounded-full bg-black px-4 py-3 font-medium uppercase tracking-wide text-white transition hover:bg-accent"
      >
        {added ? "Added!" : "Add to Cart"}
      </button>
      <WhatsAppButton
        message={`Hi! I'd like a bulk order quote for ${product.name}.`}
        label="Bulk order? Ask on WhatsApp"
      />
      <FitCheckModal
        product={product}
        open={fitOpen}
        onClose={() => setFitOpen(false)}
        onUseSize={setSize}
      />
    </div>
  );
}
