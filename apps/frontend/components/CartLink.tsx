"use client";

import Link from "next/link";
import { useCartStore, cartCount } from "@/lib/cart-store";

export default function CartLink() {
  const items = useCartStore((state) => state.items);
  const count = cartCount(items);

  return (
    <Link href="/cart" className="relative hover:text-gray-600">
      Cart
      {count > 0 && (
        <span className="absolute -right-3 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
