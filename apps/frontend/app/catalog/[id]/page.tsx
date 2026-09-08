import { notFound } from "next/navigation";
import { getProduct } from "@/lib/api";
import DesignUploader from "./DesignUploader";
import ProductOptions from "./ProductOptions";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-10 md:grid-cols-2">
        <img
          src={product.images[0]}
          alt={product.name}
          className="aspect-square w-full rounded-lg object-cover"
        />
        <div>
          <p className="text-sm text-gray-500">{product.category}</p>
          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 text-xl font-semibold">
            ${product.price.toFixed(2)}
          </p>
          <p className="mt-4 text-gray-600">{product.description}</p>

          <ProductOptions product={product} />

          <div className="mt-8">
            <h2 className="font-medium">Your design</h2>
            <div className="mt-3">
              <DesignUploader />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
