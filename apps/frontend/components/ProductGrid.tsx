import { getProducts } from "@/lib/api";
import ProductSlider from "./products/ProductSlider";
import Reveal from "./Reveal";

export default async function ProductGrid() {
  const products = await getProducts();
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <Reveal>
        <ProductSlider title="Featured Products" products={products} />
      </Reveal>
    </section>
  );
}
