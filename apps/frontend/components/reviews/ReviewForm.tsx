"use client";

import { useState, type FormEvent } from "react";
import type { Review } from "@omardtf/shared-types";
import { submitReview } from "@/lib/api";
import ReviewStars from "./ReviewStars";

export default function ReviewForm({
  productId,
  onSubmitted,
}: {
  productId: string;
  onSubmitted: (review: Review) => void;
}) {
  const [open, setOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const review = await submitReview({ productId, authorName, rating, comment });
      onSubmitted(review);
      setAuthorName("");
      setComment("");
      setRating(5);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full border border-black px-5 py-2 text-sm font-semibold uppercase tracking-wide transition hover:bg-black hover:text-white"
      >
        Write a review
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 border border-stone-200 p-4 sm:max-w-sm">
      <div>
        <span className="text-sm font-medium">Your rating</span>
        <div className="mt-1">
          <ReviewStars rating={rating} onChange={setRating} size="text-2xl" />
        </div>
      </div>
      <input
        required
        placeholder="Your name"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        className="w-full border border-stone-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
      />
      <textarea
        required
        placeholder="How'd it turn out?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="w-full border border-stone-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
      />
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-black px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Posting…" : "Post review"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-500 hover:text-black">
          Cancel
        </button>
      </div>
    </form>
  );
}
