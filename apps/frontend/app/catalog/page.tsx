import { getProducts } from "@/lib/api";
import CatalogGrid from "./CatalogGrid";

export default async function CatalogPage() {
  const products = await getProducts();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl uppercase tracking-wide">
        Catalog
      </h1>
      <p className="mt-2 text-stone-500">
        Browse blanks ready for your custom DTF design.
      </p>
      <div className="mt-8">
        <CatalogGrid products={products} />
      </div>
    </main>
  );
}
