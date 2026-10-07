import { Hono } from "hono";
import { z } from "zod";
import Stripe from "stripe";
import { OrderStatus } from "@omardtf/shared-types";
import { prisma } from "../db/prisma.js";
import { getOrder, listOrders, toApiOrder, updateOrderStatus } from "../db/orders.js";
import { requireAdmin } from "../lib/admin-auth.js";
import { priceCart } from "../lib/pricing.js";
import { getStripeClient } from "../lib/stripe.js";

export const orders = new Hono();

const createOrderSchema = z.object({
  paymentIntentId: z.string().startsWith("pi_"),
  customerEmail: z.string().email(),
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().min(1).max(50),
  designUploadUrl: z.string().max(2000).optional(),
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

const statusSchema = z.object({ status: z.nativeEnum(OrderStatus) });

/**
 * Public. Records an order once Stripe confirms the PaymentIntent succeeded.
 * Prices and the charged amount come from the server and Stripe, never the browser,
 * and the call is idempotent per PaymentIntent so retries can't create duplicates.
 */
orders.post("/", async (c) => {
  const parsed = createOrderSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid order payload", issues: parsed.error.issues }, 400);
  }
  const { paymentIntentId, items, ...customer } = parsed.data;

  const existing = await prisma.order.findUnique({ where: { paymentIntentId }, include: { items: true } });
  if (existing) return c.json(toApiOrder(existing), 200);

  const priced = priceCart(items);
  if ("error" in priced) return c.json({ error: priced.error }, 400);

  let intent: Stripe.PaymentIntent;
  try {
    intent = await getStripeClient().paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
  } catch {
    return c.json({ error: "Could not verify payment" }, 502);
  }
  if (intent.status !== "succeeded") return c.json({ error: "Payment has not succeeded" }, 402);
  if (intent.amount !== priced.totalCents) return c.json({ error: "Order does not match the payment amount" }, 400);

  const charge = typeof intent.latest_charge === "object" ? intent.latest_charge : null;
  const paymentMethod = charge?.payment_method_details?.type ?? "card";

  try {
    const created = await prisma.order.create({
      data: {
        ...customer,
        paymentIntentId,
        paymentMethod,
        totalAmountCents: intent.amount,
        items: { create: priced.lines },
      },
      include: { items: true },
    });
    return c.json(toApiOrder(created), 201);
  } catch {
    // lost a race with a concurrent retry for the same PaymentIntent
    const raced = await prisma.order.findUnique({ where: { paymentIntentId }, include: { items: true } });
    if (raced) return c.json(toApiOrder(raced), 200);
    return c.json({ error: "Could not save order" }, 500);
  }
});

orders.get("/", requireAdmin, async (c) => {
  const status = statusSchema.shape.status.safeParse(c.req.query("status"));
  return c.json(await listOrders(status.success ? status.data : undefined));
});

orders.get("/:id", requireAdmin, async (c) => {
  const order = await getOrder(c.req.param("id"));
  if (!order) return c.json({ error: "Order not found" }, 404);
  return c.json(order);
});

orders.patch("/:id/status", requireAdmin, async (c) => {
  const parsed = statusSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Invalid status" }, 400);
  const order = await updateOrderStatus(c.req.param("id"), parsed.data.status);
  if (!order) return c.json({ error: "Order not found" }, 404);
  return c.json(order);
});
