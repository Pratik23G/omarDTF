"use client";

type Rating = 1 | 2 | 3 | 4 | 5;

/** Star row. Read-only display when `onChange` is omitted; an interactive 1-5 picker when it's passed. */
export default function ReviewStars({
  rating,
  onChange,
  size = "text-base",
}: {
  rating: number;
  onChange?: (value: Rating) => void;
  size?: string;
}) {
  const stars: Rating[] = [1, 2, 3, 4, 5];

  return (
    <div
      className={`flex gap-0.5 leading-none ${size}`}
      role={onChange ? "radiogroup" : undefined}
      aria-label={onChange ? "Your rating" : `Rated ${rating} out of 5`}
    >
      {stars.map((n) => {
        const filled = n <= Math.round(rating);
        if (!onChange) {
          return (
            <span key={n} aria-hidden className={filled ? "text-accent" : "text-stone-300"}>
              &#9733;
            </span>
          );
        }
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`transition ${filled ? "text-accent" : "text-stone-300 hover:text-accent/60"}`}
          >
            &#9733;
          </button>
        );
      })}
    </div>
  );
}
