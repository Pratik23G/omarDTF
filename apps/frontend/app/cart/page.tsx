"use client";

import Link from "next/link";
import { useCartStore, cartTotal, cartCount } from "@/lib/cart-store";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const total = cartTotal(items);
  const count = cartCount(items);
  const bulkMessage = `Hi! I'd like a bulk order quote for:\n${items
    .map((item) => `- ${item.name} (${item.size}/${item.color}) × ${item.quantity}`)
    .join("\n")}`;

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl uppercase tracking-wide">
          Your cart is empty
        </h1>
        <Link
          href="/catalog"
          className="mt-4 inline-block text-stone-600 underline"
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
      <div className="mt-8 divide-y divide-stone-200">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.size}-${item.color}`}
            className="flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap"
          >
            <img
              src={item.image}
              alt={item.name}
              className="h-20 w-20 shrink-0 border border-stone-300 object-cover"
            />
            <div className="min-w-[10rem] flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-stone-500">
                {item.size} / {item.color}
              </p>
              <p className="mt-1 font-semibold">${item.price.toFixed(2)}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 sm:ml-0">
              <button
                onClick={() =>
                  updateQuantity(
                    item.productId,
                    item.size,
                    item.color,
                    item.quantity - 1
                  )
                }
                className="h-8 w-8 rounded-full border border-stone-300 font-medium hover:border-black"
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
                className="h-8 w-8 rounded-full border border-stone-300 font-medium hover:border-black"
              >
                +
              </button>
            </div>
            <button
              onClick={() => removeItem(item.productId, item.size, item.color)}
              className="text-sm text-stone-400 hover:text-black sm:ml-4"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
        <p className="font-medium">Placing a bulk order ({count} items)?</p>
        <p className="mt-1 text-stone-600">
          Chat with us on WhatsApp for bulk pricing and turnaround time.
        </p>
        <WhatsAppButton message={bulkMessage} className="mt-3" />
      </div>

      <div className="mt-8 flex flex-col items-stretch justify-between gap-4 border-t border-stone-200 pt-6 sm:flex-row sm:items-center">
        <span className="text-lg font-semibold">
          Total: ${total.toFixed(2)}
        </span>
        <Link
          href="/checkout"
          className="rounded-full bg-black px-6 py-3 text-center font-medium uppercase tracking-wide text-white transition hover:bg-accent"
        >
          Checkout
        </Link>
      </div>
    </main>
  );
}
