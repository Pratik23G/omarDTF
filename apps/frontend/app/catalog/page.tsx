import { mockProducts } from "@/lib/mock-products";
import CatalogGrid from "./CatalogGrid";

export default function CatalogPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-bold">Catalog</h1>
      <p className="mt-2 text-gray-500">
        Browse blanks ready for your custom DTF design.
      </p>
      <div className="mt-8">
        <CatalogGrid products={mockProducts} />
      </div>
    </main>
  );
}
