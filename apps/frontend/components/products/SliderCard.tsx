"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { Product } from "@omardtf/shared-types";
import { useTilt } from "./useTilt";

/** Slider tile: image with thickness that rotates in 3D following the cursor, plus a hover info panel that stays put. */
export default function SliderCard({ product }: { product: Product }) {
  const cardRef = useTilt<HTMLAnchorElement>();

  return (
    <li className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[31%] lg:w-[23.5%]">
      <Link
        ref={cardRef}
        href={`/catalog/${product.id}`}
        draggable={false}
        style={{ "--img": `url("${encodeURI(product.images[0])}")` } as CSSProperties}
        className="slider-card relative block aspect-[4/5]"
      >
        <div className="slider-tilt">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className="slider-layer" style={{ "--n": n } as CSSProperties} aria-hidden />
          ))}
          <div className="slider-face">
            <img
              src={product.images[0]}
              alt={product.name}
              draggable={false}
              className="slider-card-img h-full w-full object-cover"
            />
            <span className="slider-gloss" aria-hidden />
          </div>
        </div>
        <span className="pointer-events-none absolute left-3 top-3 z-[6] bg-black/70 px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
          {product.category}
        </span>
        {!product.inStock && (
          <span className="pointer-events-none absolute right-3 top-3 z-[6] bg-white px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
            Sold out
          </span>
        )}

        <div className="slider-info text-white">
          <p className="line-clamp-3 text-sm leading-relaxed text-stone-200">{product.description}</p>
          <dl className="mt-3 space-y-1.5 text-xs">
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 font-display font-semibold uppercase tracking-[0.14em] text-gold-light">Sizes</dt>
              <dd className="text-stone-200">{product.sizes.join(" · ")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 font-display font-semibold uppercase tracking-[0.14em] text-gold-light">Colors</dt>
              <dd className="text-stone-200">{product.colors.join(" · ")}</dd>
            </div>
          </dl>
          <p className="mt-3 border-t border-white/15 pt-3 text-xs text-stone-300">
            Not sure of your size? Try the AI fit check on the product page.
          </p>
        </div>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-semibold uppercase leading-tight tracking-[0.03em]">
          {product.name}
        </h3>
        <p className="shrink-0 font-semibold">${product.price.toFixed(2)}</p>
      </div>
    </li>
  );
}
