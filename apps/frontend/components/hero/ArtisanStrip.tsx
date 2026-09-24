import { PressIcon, SpoolIcon } from "@/components/icons";

/** Thin-ruled local-artisan sign-off shown under the hero carousel. */
export default function ArtisanStrip() {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 pb-10">
      <div className="flex items-center gap-5 text-gold">
        <span className="rule-gold flex-1" />
        <SpoolIcon className="h-5 w-5 text-gold" />
        <p className="gold-text font-display text-xs font-semibold uppercase tracking-[0.28em] sm:text-sm">
          Serving Redwood City, CA &amp; Beyond
        </p>
        <PressIcon className="h-5 w-5 text-gold" />
        <span className="rule-gold flex-1" />
      </div>
    </div>
  );
}
