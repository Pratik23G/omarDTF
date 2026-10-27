import { notFound } from "next/navigation";
import MaskPainter from "@/components/dev/MaskPainter";
import { getProducts } from "@/lib/api";

/** Dev-only tool for painting the recolor mask of each product photo by hand. */
export default async function MaskPainterPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const products = await getProducts();
  const local = products.filter((p) => p.images[0]?.startsWith("/"));
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-2xl uppercase tracking-wide">Recolor mask painter</h1>
      <MaskPainter products={local.map((p) => ({ id: p.id, name: p.name, image: p.images[0] }))} />
    </main>
  );
}
