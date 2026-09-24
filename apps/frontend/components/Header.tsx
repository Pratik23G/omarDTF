"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CartLink from "./CartLink";
import Wordmark from "./Wordmark";

/**
 * Sticky header that adopts the theme of whatever section sits beneath it:
 * dark sections carry data-header-theme="dark", everything else is the grey page.
 */
export default function Header() {
  const ref = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const pathname = usePathname();

  useEffect(() => {
    const header = ref.current;
    if (!header) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const top = Math.max(header.getBoundingClientRect().top, 0);
      const bottom = top + header.offsetHeight;
      const center = top + header.offsetHeight / 2;
      const overDark = Array.from(
        document.querySelectorAll('[data-header-theme="dark"]'),
      ).some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top <= bottom + 1 && rect.bottom > center;
      });
      setTheme(overDark ? "dark" : "light");
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <header ref={ref} className="site-header" data-theme={theme}>
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-6">
        <nav className="flex items-center gap-7 font-display text-[13px] font-semibold uppercase tracking-[0.16em]">
          <Link href="/" className="nav-link hidden sm:inline">
            Home
          </Link>
          <Link href="/catalog" className="nav-link">
            Catalog
          </Link>
        </nav>
        <Link href="/" aria-label="OMARDTF home" className="text-2xl">
          <Wordmark />
        </Link>
        <div className="flex justify-end font-display text-[13px] font-semibold uppercase tracking-[0.16em]">
          <CartLink />
        </div>
      </div>
    </header>
  );
}
