"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCartStore, cartTotal } from "@/lib/cart-store";
import { API_URL } from "@/lib/api";
import PaymentForm from "./PaymentForm";
import { CardBrandStrip } from "@/components/payment/CardBrandIcons";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const total = cartTotal(items);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    fetch(`${API_URL}/payments/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setError("Could not start checkout. Please try again.");
      })
      .catch(() => setError("Could not reach payment server."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

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
        Checkout
      </h1>

      <div className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.size}-${item.color}`}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 text-sm"
          >
            <span className="min-w-0 break-words">
              {item.name} ({item.size} / {item.color}) × {item.quantity}
            </span>
            <span className="font-medium">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between text-lg font-semibold">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!error && !clientSecret && (
        <p className="mt-10 text-sm text-stone-500">Loading payment form…</p>
      )}

      {clientSecret && (
        <div className="mt-10">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-stone-500">
              We accept
            </span>
            <CardBrandStrip />
          </div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm />
          </Elements>
        </div>
      )}
    </main>
  );
}
