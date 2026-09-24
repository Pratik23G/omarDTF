import Link from "next/link";
import type { CSSProperties } from "react";
import type { Product } from "@omardtf/shared-types";
import DesignerPanel from "./DesignerPanel";

/** One garment tile: rippling fabric at rest, configurator effects on hover/focus. */
export default function GarmentPane({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  return (
    <Link
      href={`/catalog/${product.id}`}
      style={{ "--i": index } as CSSProperties}
      className="garment-pane block aspect-[3/4] border border-gunmetal-700/70 bg-black md:even:mt-8"
    >
      <div className="garment-fabric">
        <img src={product.images[0]} alt={product.name} draggable={false} />
        <span className="garment-sheen" />
      </div>

      <span className="print-area" aria-hidden />
      <span className="garment-scan" aria-hidden>
        <span className="scan-head" />
        <span className="scan-cross" />
      </span>
      <span className="garment-steam" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <DesignerPanel />

      <span className="absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-black/85 to-transparent px-3 pb-2.5 pt-8">
        <span className="block font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-light">
          {product.category}
        </span>
        <span className="mt-0.5 block truncate text-xs text-gunmetal-100">
          {product.name}
        </span>
      </span>
    </Link>
  );
}
