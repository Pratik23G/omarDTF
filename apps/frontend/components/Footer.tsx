import Link from "next/link";
import { SpoolIcon } from "./icons";
import Wordmark from "./Wordmark";

const LINKS = [
  { href: "/catalog", label: "Catalog" },
  { href: "/cart", label: "Cart" },
  { href: "/quote", label: "Bulk Quote" },
];

export default function Footer() {
  return (
    <footer data-header-theme="dark" className="footer-gold text-gunmetal-100">
      <div className="rule-gold" />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <SpoolIcon className="h-6 w-6 text-gold" />
              <Wordmark className="h-14" />
            </div>
            <p className="mt-4 max-w-sm leading-relaxed text-gunmetal-100/90">
              Custom DTF transfers and personalized apparel, pressed to order in
              Redwood City, CA.
            </p>
          </div>
          <div className="md:text-right">
            <p className="gold-text font-display text-sm font-semibold uppercase tracking-[0.3em]">
              Explore
            </p>
            <nav className="mt-4 flex flex-wrap gap-x-8 gap-y-3 font-display text-[13px] font-semibold uppercase tracking-[0.16em] md:justify-end">
              {LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="nav-link">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="rule-gold mt-12" />
        <p className="mt-6 text-center font-display text-xs font-semibold uppercase tracking-[0.22em] text-gold-light">
          &copy; {new Date().getFullYear()} OMARDTF &middot; Made in Redwood City, CA
        </p>
      </div>
    </footer>
  );
}
