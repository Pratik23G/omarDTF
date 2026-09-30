"use client";

import { useState } from "react";
import type { Product } from "@omardtf/shared-types";
import DesignUploader from "./DesignUploader";
import ProductGallery from "./ProductGallery";
import ProductOptions from "./ProductOptions";

/** Owns the selected color so the photo and the color swatches stay in sync. */
export default function ProductDetail({ product }: { product: Product }) {
  const [color, setColor] = useState(product.colors[0]);

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <ProductGallery images={product.images} colors={product.colors} selectedColor={color} name={product.name} />
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-accent">{product.category}</p>
        <h1 className="mt-1 font-display text-3xl uppercase tracking-wide">{product.name}</h1>
        <p className="mt-2 text-xl font-semibold text-accent">${product.price.toFixed(2)}</p>
        <p className="mt-4 text-stone-600">{product.description}</p>

        <ProductOptions product={product} color={color} onColorChange={setColor} />

        <div className="mt-8">
          <h2 className="font-medium">Your design</h2>
          <div className="mt-3">
            <DesignUploader />
          </div>
        </div>
      </div>
    </div>
  );
}
