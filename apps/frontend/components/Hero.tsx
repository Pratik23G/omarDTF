import Link from "next/link";
import { getProducts } from "@/lib/api";
import ArtisanStrip from "./hero/ArtisanStrip";
import HeroCarousel from "./hero/HeroCarousel";
import HeroBackdrop from "./hero/HeroBackdrop";

// Army Crest, Stargazing, Monster Mama, Viking Voyage
const SHOWCASE_IDS = ["3", "2", "12", "5"];

export default async function Hero() {
  const products = await getProducts().catch(() => []);
  const showcase = SHOWCASE_IDS.map((id) => products.find((p) => p.id === id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );

  return (
    <section
      data-header-theme="dark"
      className="relative overflow-hidden bg-carbon text-white"
    >
      <HeroBackdrop />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <p
            className="fade-up gold-text font-display text-sm font-semibold uppercase tracking-[0.3em]"
            style={{ "--d": "0.1s" } as React.CSSProperties}
          >
            Redwood City, CA
          </p>
          <h1 className="mt-5 font-display text-6xl font-extrabold italic uppercase leading-[0.92] tracking-tight sm:text-7xl">
            <span className="line-mask">
              <span
                className="etched-title"
                style={{ "--d": "0.2s" } as React.CSSProperties}
              >
                Custom DTF
              </span>
            </span>
            <span className="line-mask">
              <span
                className="etched-title"
                style={{ "--d": "0.35s" } as React.CSSProperties}
              >
                Transfers.
              </span>
            </span>
          </h1>
          <p
            className="fade-up mt-6 max-w-md text-lg leading-relaxed text-gunmetal-100/90"
            style={{ "--d": "0.7s" } as React.CSSProperties}
          >
            Upload your design, pick your gear, and we&apos;ll print it —
            made in Redwood City, CA.
          </p>
          <div
            className="fade-up mt-10 flex flex-wrap items-center gap-x-8 gap-y-5"
            style={{ "--d": "0.85s" } as React.CSSProperties}
          >
            <Link
              href="/catalog"
              className="neon-btn rounded-full px-8 py-3.5 font-display text-[13px] font-semibold uppercase tracking-[0.16em]"
            >
              Shop Catalog
            </Link>
            <Link
              href="/quote"
              className="ghost-btn font-display text-[13px] font-semibold uppercase tracking-[0.16em]"
            >
              Get a Bulk Quote
            </Link>
          </div>
        </div>
        {showcase.length > 0 && (
          <div className="fade-up" style={{ "--d": "0.5s" } as React.CSSProperties}>
            <HeroCarousel products={showcase} />
          </div>
        )}
      </div>
      <ArtisanStrip />
    </section>
  );
}
