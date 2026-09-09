import { Hono } from "hono";
import { z } from "zod";
import Stripe from "stripe";

export const payments = new Hono();

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

const createIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("usd"),
});

payments.post("/create-intent", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createIntentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payment payload", issues: parsed.error.issues }, 400);
  }

  const { amount, currency } = parsed.data;

  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch {
    return c.json({ error: "Stripe is not configured on the server" }, 500);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    automatic_payment_methods: { enabled: true },
  });

  return c.json({ clientSecret: paymentIntent.client_secret });
});
