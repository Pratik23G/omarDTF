"use client";

import Link from "next/link";
import { useCartStore, cartTotal } from "@/lib/cart-store";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const total = cartTotal(items);

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl uppercase tracking-wide">
          Your cart is empty
        </h1>
        <Link
          href="/catalog"
          className="mt-4 inline-block text-neutral-600 underline"
        >
          Browse the catalog
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-2xl uppercase tracking-wide">
        Your Cart
      </h1>
      <div className="mt-8 divide-y divide-neutral-200">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.size}-${item.color}`}
            className="flex items-center gap-4 py-4"
          >
            <img
              src={item.image}
              alt={item.name}
              className="h-20 w-20 border border-neutral-300 object-cover"
            />
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-neutral-500">
                {item.size} / {item.color}
              </p>
              <p className="mt-1 font-semibold">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateQuantity(
                    item.productId,
                    item.size,
                    item.color,
                    item.quantity - 1
                  )
                }
                className="h-8 w-8 rounded-full border border-neutral-300 font-medium hover:border-black"
              >
                −
              </button>
              <span className="w-6 text-center">{item.quantity}</span>
              <button
                onClick={() =>
                  updateQuantity(
                    item.productId,
                    item.size,
                    item.color,
                    item.quantity + 1
                  )
                }
                className="h-8 w-8 rounded-full border border-neutral-300 font-medium hover:border-black"
              >
                +
              </button>
            </div>
            <button
              onClick={() => removeItem(item.productId, item.size, item.color)}
              className="ml-4 text-sm text-neutral-400 hover:text-black"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-6">
        <span className="text-lg font-semibold">
          Total: ${total.toFixed(2)}
        </span>
        <button
          disabled
          title="Checkout comes in Phase 2"
          className="cursor-not-allowed rounded-full bg-neutral-300 px-6 py-3 font-medium uppercase tracking-wide text-white"
        >
          Checkout (coming soon)
        </button>
      </div>
    </main>
  );
}
