import Stripe from "stripe";

/** Builds a Stripe client from STRIPE_SECRET_KEY; throws when the key is missing. */
export function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}
