import { notFound } from "next/navigation";
import HoodieBuilder from "@/components/dev/HoodieBuilder";
import { getProducts } from "@/lib/api";

/** Dev-only: builds hoodie product photos (and recolor masks) from the tee designs. */
export default async function HoodiesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const products = await getProducts();
  const designs = products
    .filter((p) => p.category !== "Hoodies" && p.images[0]?.startsWith("/"))
    .map((p) => ({ id: p.id, name: p.name, description: p.description, image: p.images[0] }));
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl uppercase tracking-wide">Hoodie builder</h1>
      <HoodieBuilder designs={designs} />
    </main>
  );
}
