import { getProducts } from "@/lib/api";
import CatalogGrid from "./CatalogGrid";

export default async function CatalogPage() {
  const products = await getProducts();
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-bold">Catalog</h1>
      <p className="mt-2 text-gray-500">
        Browse blanks ready for your custom DTF design.
      </p>
      <div className="mt-8">
        <CatalogGrid products={products} />
      </div>
    </main>
  );
}
