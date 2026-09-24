import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-display text-2xl uppercase tracking-wide">
        Order confirmed
      </h1>
      <p className="mt-4 text-stone-600">
        Thanks for your order! We&apos;ll start working on your DTF transfer
        and reach out with updates.
      </p>
      <Link
        href="/catalog"
        className="mt-8 inline-block rounded-full bg-black px-6 py-3 font-medium uppercase tracking-wide text-white transition hover:bg-accent"
      >
        Keep browsing
      </Link>
    </main>
  );
}
