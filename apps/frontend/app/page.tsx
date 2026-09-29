import Hero from "@/components/Hero";
import InstagramFeed from "@/components/instagram/InstagramFeed";
import ProductGrid from "@/components/ProductGrid";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProductGrid />
      <InstagramFeed />
    </main>
  );
}
