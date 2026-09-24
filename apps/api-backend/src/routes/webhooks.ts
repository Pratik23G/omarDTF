import { Hono } from "hono";
import Stripe from "stripe";

export const webhooks = new Hono();

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

webhooks.post("/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return c.json({ error: "Webhook is not configured on the server" }, 500);
  }

  const rawBody = await c.req.text();

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return c.json({ error: `Webhook signature verification failed: ${message}` }, 400);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    console.log(
      `[stripe webhook] payment_intent.succeeded: ${intent.id} ($${(intent.amount / 100).toFixed(2)} ${intent.currency})`
    );
  } else if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    console.log(`[stripe webhook] payment_intent.payment_failed: ${intent.id}`);
  }

  return c.json({ received: true });
});
