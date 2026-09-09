import Link from "next/link";
import { getProducts } from "@/lib/api";

export default async function Hero() {
  const products = await getProducts().catch(() => []);
  const showcase = products.slice(0, 2);

  return (
    <section className="bg-grain border-b border-neutral-200 bg-neutral-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-500">
            Redwood City, CA
          </p>
          <h1 className="mt-4 font-display text-5xl uppercase leading-[0.95] tracking-wide sm:text-6xl">
            Custom DTF
            <br />
            Transfers
          </h1>
          <p className="mt-5 max-w-md text-neutral-600">
            Upload your design, pick your gear, and we&apos;ll print it —
            made in Redwood City, CA.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="rounded-full bg-black px-6 py-3 text-sm font-medium uppercase tracking-wide text-white hover:bg-neutral-800"
            >
              Shop Catalog
            </Link>
            <Link
              href="/quote"
              className="rounded-full border border-black px-6 py-3 text-sm font-medium uppercase tracking-wide hover:bg-black hover:text-white"
            >
              Get a Bulk Quote
            </Link>
          </div>
        </div>
        {showcase.length > 0 && (
          <div className="hidden grid-cols-2 gap-4 md:grid">
            {showcase.map((product) => (
              <img
                key={product.id}
                src={product.images[0]}
                alt={product.name}
                className="aspect-[3/4] w-full border border-neutral-300 object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
