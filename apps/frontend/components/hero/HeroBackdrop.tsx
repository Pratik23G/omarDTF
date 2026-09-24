/** Static glow layers; scroll depth comes from the CSS-only .parallax-glow animation. */
export default function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="parallax-glow absolute -inset-x-10 -inset-y-24 bg-[radial-gradient(45%_40%_at_78%_35%,rgba(160,170,185,0.16),transparent_70%)]"
        style={{ "--drift": "80px" } as React.CSSProperties}
      />
      <div
        className="parallax-glow absolute -inset-x-10 -inset-y-24 bg-[radial-gradient(35%_30%_at_12%_85%,rgba(212,175,55,0.12),transparent_70%)]"
        style={{ "--drift": "40px" } as React.CSSProperties}
      />
    </div>
  );
}
