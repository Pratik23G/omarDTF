"use client";

/** Site-wide fallback so an unexpected server error shows a retry option instead of a blank "Application error". */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-2xl uppercase tracking-wide">Something went wrong</h1>
      <p className="mt-3 text-stone-600">The page couldn&apos;t load. This is usually brief, so try again.</p>
      <button
        onClick={reset}
        className="mt-6 min-h-11 rounded-full bg-black px-6 py-3 font-medium uppercase tracking-wide text-white hover:bg-accent"
      >
        Try again
      </button>
    </main>
  );
}
