import { getProducts } from "@/lib/api";
import ProductCard from "./ProductCard";

export default async function ProductGrid() {
  const products = await getProducts();
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-2xl font-bold">Featured Products</h2>
      <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
