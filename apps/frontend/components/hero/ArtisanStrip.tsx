import { PressIcon, SpoolIcon } from "@/components/icons";

/** Thin-ruled local-artisan sign-off shown under the hero carousel. */
export default function ArtisanStrip() {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 pb-8 sm:px-6 sm:pb-10">
      <div className="flex items-center gap-3 text-gold sm:gap-5">
        <span className="rule-gold flex-1" />
        <SpoolIcon className="h-5 w-5 text-gold" />
        <p className="gold-text font-display text-xs font-semibold uppercase tracking-[0.16em] sm:text-sm sm:tracking-[0.28em]">
          Serving Redwood City, CA &amp; Beyond
        </p>
        <PressIcon className="h-5 w-5 text-gold" />
        <span className="rule-gold flex-1" />
      </div>
    </div>
  );
}
