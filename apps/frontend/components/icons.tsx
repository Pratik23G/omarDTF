const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** Sewing thread spool. */
export function SpoolIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="3" width="14" height="3" rx="1" />
      <rect x="5" y="18" width="14" height="3" rx="1" />
      <path d="M7.5 6.5l9 2.5M7.5 9.5l9 2.5M7.5 12.5l9 2.5M7.5 15.5l9 2" />
      <path d="M16.5 15c2 .5 3.5 1.5 4 4" />
    </svg>
  );
}

/** Heat press: base plate, platen and lever arm. */
export function PressIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="17" width="18" height="3" rx="1" />
      <rect x="5" y="12" width="11" height="3" rx="1" />
      <path d="M16 13.5h3.5L21 6" />
      <path d="M19.5 6h3" />
    </svg>
  );
}

/** Shopping bag, used for the cart nav link. */
export function CartIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M6 8h12l-1 12.5a1 1 0 01-1 .9H8a1 1 0 01-1-.9L6 8z" />
      <path d="M9 8V6.5a3 3 0 016 0V8" />
    </svg>
  );
}

/** Official WhatsApp glyph: green rounded-square badge with the phone mark. */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        fill="#25D366"
        d="M16.04 0C7.2 0 .02 7.16.02 16c0 2.82.74 5.56 2.14 7.98L0 32l8.24-2.15A15.93 15.93 0 0016.04 32C24.88 32 32 24.84 32 16S24.88 0 16.04 0z"
      />
      <path
        fill="#fff"
        d="M24.1 21.35c-.36 1-1.86 1.86-2.98 2.1-.8.17-1.85.3-5.37-1.15-4.5-1.87-7.4-6.4-7.62-6.7-.22-.3-1.82-2.42-1.82-4.62 0-2.2 1.15-3.28 1.56-3.73.41-.44.9-.55 1.2-.55.3 0 .6 0 .86.01.28.02.65-.1 1.02.78.38.9 1.28 3.1 1.4 3.33.11.22.19.48.04.78-.15.3-.23.48-.45.74-.22.26-.47.58-.67.78-.22.22-.46.46-.2.9.26.44 1.16 1.9 2.5 3.08 1.72 1.5 3.16 1.97 3.62 2.19.46.22.73.19 1-.11.28-.3 1.16-1.34 1.47-1.8.3-.46.6-.38 1.02-.23.42.15 2.65 1.24 3.1 1.47.46.22.76.33.87.52.11.19.11 1.08-.25 2.08z"
      />
    </svg>
  );
}
