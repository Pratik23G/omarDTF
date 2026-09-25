import type { CSSProperties } from "react";

const SOURCE = { w: 1248, h: 832 };
// Crop window onto just the "OMAR DTF / CUSTOM TRANSFERS & APPAREL" text,
// cutting the shirt-stack and paint-splatter art on either side.
const CROP = { x: 370, y: 335, w: 560, h: 155 };

const style: CSSProperties = {
  aspectRatio: `${CROP.w} / ${CROP.h}`,
  backgroundImage: "url(/brand/omardtf-logo.png)",
  backgroundRepeat: "no-repeat",
  backgroundSize: `${(SOURCE.w / CROP.w) * 100}% auto`,
  backgroundPosition: `${(CROP.x / (SOURCE.w - CROP.w)) * 100}% ${(CROP.y / (SOURCE.h - CROP.h)) * 100}%`,
};

/** OMARDTF brand logo, cropped to just the wordmark. `className` sets height (e.g. "h-10"); width follows the crop's aspect ratio. */
export default function Wordmark({ className = "h-9" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="OMARDTF — Custom Transfers & Apparel"
      className={`inline-block w-auto ${className}`}
      style={style}
    />
  );
}
