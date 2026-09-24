"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@omardtf/shared-types";
import GarmentPane from "./GarmentPane";

/** Garment grid; the fabric ripple only runs while the grid is on screen. */
export default function HeroCarousel({ products }: { products: Product[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={gridRef}
      className={`grid grid-cols-2 gap-4 ${inView ? "is-rippling" : ""}`}
    >
      {products.map((product, index) => (
        <GarmentPane key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}
