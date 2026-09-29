import type { Review } from "@omardtf/shared-types";
import ReviewStars from "./ReviewStars";

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-stone-500">No reviews yet — be the first to leave one.</p>;
  }

  return (
    <ul className="divide-y divide-stone-200">
      {reviews.map((r) => (
        <li key={r.id} className="py-5 first:pt-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{r.authorName}</p>
            <ReviewStars rating={r.rating} size="text-sm" />
          </div>
          <p className="mt-1 text-xs text-stone-400">
            {new Date(r.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">{r.comment}</p>
        </li>
      ))}
    </ul>
  );
}
