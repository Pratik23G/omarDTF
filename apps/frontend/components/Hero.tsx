import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-gray-900 text-white">
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold sm:text-5xl">
          Custom DTF Transfers &amp; Apparel
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-300">
          Upload your design, pick your gear, and we&apos;ll print it —
          made in Redwood City, CA.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/catalog"
            className="rounded-md bg-white px-6 py-3 font-medium text-gray-900 hover:bg-gray-100"
          >
            Shop Catalog
          </Link>
          <Link
            href="/quote"
            className="rounded-md border border-white px-6 py-3 font-medium hover:bg-white hover:text-gray-900"
          >
            Get a Bulk Quote
          </Link>
        </div>
      </div>
    </section>
  );
}
