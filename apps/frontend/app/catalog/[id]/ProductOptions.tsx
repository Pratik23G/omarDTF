"use client";

import { useState } from "react";
import type { Product } from "@omardtf/shared-types";

export default function ProductOptions({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);

  return (
    <div className="mt-6 space-y-4">
      <div>
        <span className="text-sm font-medium">Size</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                size === s
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
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
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                color === c
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <button
        disabled
        title="Cart comes in the next step"
        className="mt-2 w-full cursor-not-allowed rounded-md bg-gray-300 px-4 py-3 font-medium text-white"
      >
        Add to Cart (coming soon)
      </button>
    </div>
  );
}
