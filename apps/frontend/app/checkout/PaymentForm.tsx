"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useCartStore, cartTotal } from "@/lib/cart-store";
import { API_URL } from "@/lib/api";

export default function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        payment_method_data: { billing_details: { name, email, phone } },
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: email,
          customerName: name,
          customerPhone: phone,
          paymentMethod: "card",
          totalAmount: cartTotal(items),
          items: items.map((item) => ({
            id: crypto.randomUUID(),
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: item.price,
          })),
        }),
      }).catch(() => {
        // order record is best-effort; payment already succeeded
      });

      clear();
      router.push("/checkout/success");
      return;
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-stone-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-stone-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
        />
        <input
          required
          type="tel"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border border-stone-300 px-3 py-2 text-sm focus:border-black focus:outline-none sm:col-span-2"
        />
      </div>

      <PaymentElement />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-full bg-black px-4 py-3 font-medium uppercase tracking-wide text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {submitting ? "Processing…" : "Pay now"}
      </button>
    </form>
  );
}
