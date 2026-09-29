import { notFound } from "next/navigation";
import ProductReviews from "@/components/reviews/ProductReviews";
import { getProduct, getReviews } from "@/lib/api";
import ProductDetail from "./ProductDetail";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const reviews = await getReviews(id).catch(() => []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <ProductDetail product={product} />
      <ProductReviews productId={product.id} initialReviews={reviews} />
    </main>
  );
}
