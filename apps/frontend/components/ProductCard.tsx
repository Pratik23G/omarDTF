import Link from "next/link";
import type { Product } from "@omardtf/shared-types";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/catalog/${product.id}`}
      className="group block border border-neutral-300 transition hover:border-black"
    >
      <div className="overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="aspect-square w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">
          {product.category}
        </p>
        <h3 className="mt-1 font-medium">{product.name}</h3>
        <p className="mt-2 font-semibold">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
