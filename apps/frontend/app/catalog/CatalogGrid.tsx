"use client";

import { useMemo, useState } from "react";
import type { Product } from "@omardtf/shared-types";
import ProductCard from "@/components/ProductCard";

export default function CatalogGrid({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filtered = useMemo(
    () =>
      category === "All"
        ? products
        : products.filter((p) => p.category === category),
    [products, category]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium uppercase tracking-wide transition ${
              category === c
                ? "border-black bg-black text-white"
                : "border-neutral-300 text-neutral-600 hover:border-black"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
