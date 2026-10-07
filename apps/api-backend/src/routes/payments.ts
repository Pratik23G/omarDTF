import { Hono } from "hono";
import { z } from "zod";
import Stripe from "stripe";
import { priceCart } from "../lib/pricing.js";
import { getStripeClient } from "../lib/stripe.js";

export const payments = new Hono();

const createIntentSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive().max(100),
        size: z.string(),
        color: z.string(),
      }),
    )
    .min(1),
});

payments.post("/create-intent", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createIntentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payment payload", issues: parsed.error.issues }, 400);
  }

  const priced = priceCart(parsed.data.items);
  if ("error" in priced) return c.json({ error: priced.error }, 400);

  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch {
    return c.json({ error: "Stripe is not configured on the server" }, 500);
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: priced.totalCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });
    return c.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : "Payment intent creation failed";
    return c.json({ error: message }, 502);
  }
});
