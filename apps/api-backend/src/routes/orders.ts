import { Hono } from "hono";
import { z } from "zod";
import { OrderStatus, type Order } from "@omardtf/shared-types";
import { mockOrders } from "../data/mock-orders.js";

export const orders = new Hono();

const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  quantity: z.number().int().positive(),
  size: z.string(),
  color: z.string(),
  price: z.number().nonnegative(),
});

const createOrderSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  paymentMethod: z.string().min(1),
  totalAmount: z.number().nonnegative(),
  designUploadUrl: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
});

orders.get("/", (c) => {
  return c.json(mockOrders);
});

orders.get("/:id", (c) => {
  const order = mockOrders.find((o) => o.id === c.req.param("id"));
  if (!order) return c.json({ error: "Order not found" }, 404);
  return c.json(order);
});

orders.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid order payload", issues: parsed.error.issues }, 400);
  }

  const newOrder: Order = {
    id: `ord_${mockOrders.length + 1}`,
    status: OrderStatus.PENDING,
    createdAt: new Date().toISOString(),
    ...parsed.data,
  };
  mockOrders.push(newOrder);
  return c.json(newOrder, 201);
});
