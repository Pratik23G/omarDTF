import { getProducts } from "@/lib/api";
import ApiUnavailable from "./ApiUnavailable";
import ProductSlider from "./products/ProductSlider";
import Reveal from "./Reveal";

export default async function ProductGrid() {
  const products = await getProducts().catch(() => null);
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <Reveal>
        {products ? <ProductSlider title="Featured Products" products={products} /> : <ApiUnavailable />}
      </Reveal>
    </section>
  );
}
