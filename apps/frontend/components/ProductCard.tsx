import Link from "next/link";
import type { Product } from "@omardtf/shared-types";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/catalog/${product.id}`}
      className="group block border border-stone-300 bg-white transition hover:border-black hover:shadow-lg"
    >
      <div className="overflow-hidden bg-stone-900">
        <img
          src={product.images[0]}
          alt={product.name}
          className="aspect-square w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-[0.15em] text-accent">
          {product.category}
        </p>
        <h3 className="mt-1 font-display text-base font-semibold uppercase leading-tight tracking-[0.03em]">{product.name}</h3>
        <p className="mt-2 font-semibold">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
