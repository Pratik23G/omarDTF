"use client";

import { useState } from "react";
import type { Review } from "@omardtf/shared-types";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import ReviewStars from "./ReviewStars";

export default function ProductReviews({
  productId,
  initialReviews,
}: {
  productId: string;
  initialReviews: Review[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <section className="mt-16 border-t border-stone-200 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide">Reviews</h2>
          {reviews.length > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <ReviewStars rating={average} />
              <span className="text-sm text-stone-500">
                {average.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>
        <ReviewForm productId={productId} onSubmitted={(r) => setReviews((prev) => [r, ...prev])} />
      </div>
      <div className="mt-8">
        <ReviewList reviews={reviews} />
      </div>
    </section>
  );
}
