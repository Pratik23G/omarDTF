"use client";

import Link from "next/link";
import { useCartStore, cartCount } from "@/lib/cart-store";
import { CartIcon } from "./icons";

export default function CartLink() {
  const items = useCartStore((state) => state.items);
  const count = cartCount(items);

  return (
    <Link href="/cart" aria-label="Cart" className="nav-link relative flex items-center gap-2">
      <CartIcon className="h-5 w-5" />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="cart-badge flex h-4 min-w-4 items-center justify-center rounded-full border border-current px-1 text-[10px] font-semibold tracking-normal">
          {count}
        </span>
      )}
    </Link>
  );
}
