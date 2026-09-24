"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@omardtf/shared-types";
import SliderCard from "./SliderCard";
import { useDragScroll } from "./useDragScroll";

const EDGE_TOLERANCE_PX = 4;

/** Horizontally scrollable product row: snap scrolling, mouse drag, and prev/next buttons. */
export default function ProductSlider({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  const trackRef = useDragScroll<HTMLUListElement>();
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({
      atStart: el.scrollLeft <= EDGE_TOLERANCE_PX,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - EDGE_TOLERANCE_PX,
    });
  }, [trackRef]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [trackRef, updateEdges]);

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  const arrow =
    "flex h-11 w-11 items-center justify-center rounded-full border border-stone-400 text-lg transition hover:border-black hover:bg-black hover:text-white disabled:cursor-default disabled:opacity-25 disabled:hover:border-stone-400 disabled:hover:bg-transparent disabled:hover:text-inherit";

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-4xl font-extrabold italic uppercase tracking-tight">
          {title}
        </h2>
        <div className="flex gap-2">
          <button aria-label="Previous products" onClick={() => scrollByPage(-1)} disabled={edges.atStart} className={arrow}>
            &larr;
          </button>
          <button aria-label="Next products" onClick={() => scrollByPage(1)} disabled={edges.atEnd} className={arrow}>
            &rarr;
          </button>
        </div>
      </div>
      <ul
        ref={trackRef}
        tabIndex={0}
        aria-label={title}
        onDragStart={(e) => e.preventDefault()}
        className="slider-track flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto py-6"
      >
        {products.map((product) => (
          <SliderCard key={product.id} product={product} />
        ))}
      </ul>
    </div>
  );
}
