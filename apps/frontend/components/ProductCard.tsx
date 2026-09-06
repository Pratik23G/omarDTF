import Link from "next/link";
import type { Product } from "@omardtf/shared-types";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/catalog/${product.id}`}
      className="group block rounded-lg border border-gray-200 p-4 transition hover:shadow-md"
    >
      <img
        src={product.images[0]}
        alt={product.name}
        className="aspect-square w-full rounded-md object-cover"
      />
      <h3 className="mt-3 font-medium">{product.name}</h3>
      <p className="mt-1 text-sm text-gray-500">{product.category}</p>
      <p className="mt-2 font-semibold">${product.price.toFixed(2)}</p>
    </Link>
  );
}
