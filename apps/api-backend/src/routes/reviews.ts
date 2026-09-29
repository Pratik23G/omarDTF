import { Hono } from "hono";
import { z } from "zod";
import { createReview, listReviews } from "../db/reviews.js";

export const reviews = new Hono();

const createReviewSchema = z.object({
  productId: z.string().min(1),
  authorName: z.string().min(1).max(60),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  comment: z.string().min(1).max(600),
});

reviews.get("/", (c) => {
  const productId = c.req.query("productId");
  return c.json(listReviews(productId));
});

reviews.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid review", issues: parsed.error.issues }, 400);
  }

  const newReview = createReview(parsed.data);
  return c.json(newReview, 201);
});
