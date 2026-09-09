import Link from "next/link";
import CartLink from "./CartLink";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl tracking-wide">
          OMARDTF
        </Link>
        <nav className="flex items-center gap-8 text-xs font-medium uppercase tracking-[0.15em]">
          <Link href="/" className="hover:text-neutral-500">
            Home
          </Link>
          <Link href="/catalog" className="hover:text-neutral-500">
            Catalog
          </Link>
          <CartLink />
        </nav>
      </div>
    </header>
  );
}
