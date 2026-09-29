import { randomUUID } from "node:crypto";
import type { CreateReviewInput, Review } from "@omardtf/shared-types";
import { db } from "./client.js";

export function listReviews(productId?: string): Review[] {
  const rows = productId
    ? db.prepare("SELECT * FROM reviews WHERE productId = ? ORDER BY createdAt DESC").all(productId)
    : db.prepare("SELECT * FROM reviews ORDER BY createdAt DESC").all();
  return rows as Review[];
}

export function createReview(input: CreateReviewInput): Review {
  const review: Review = {
    id: `rev_${randomUUID()}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
  db.prepare(
    "INSERT INTO reviews (id, productId, authorName, rating, comment, createdAt) VALUES (@id, @productId, @authorName, @rating, @comment, @createdAt)",
  ).run(review);
  return review;
}
