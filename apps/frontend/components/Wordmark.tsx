/**
 * OMARDTF brand logo, shown in full — no cropping. The source art already sits on a
 * near-black backdrop that matches the site's dark header/footer/hero sections, so it
 * blends in there; over the light header state it reads as a small rounded badge.
 * `className` sets height (e.g. "h-10"); width follows the image's own aspect ratio.
 */
export default function Wordmark({ className = "h-9" }: { className?: string }) {
  return (
    <img
      src="/brand/omardtf-logo.png"
      alt="OMARDTF — Custom Transfers & Apparel"
      width={1248}
      height={832}
      className={`w-auto rounded-md object-contain ${className}`}
    />
  );
}
