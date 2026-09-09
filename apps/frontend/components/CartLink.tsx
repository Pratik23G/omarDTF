"use client";

import Link from "next/link";
import { useCartStore, cartCount } from "@/lib/cart-store";

export default function CartLink() {
  const items = useCartStore((state) => state.items);
  const count = cartCount(items);

  return (
    <Link
      href="/cart"
      className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-white normal-case tracking-normal hover:bg-neutral-800"
    >
      Cart
      {count > 0 && (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
          {count}
        </span>
      )}
    </Link>
  );
}
