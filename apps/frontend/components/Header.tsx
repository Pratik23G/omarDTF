import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold">
          OmarDTF
        </Link>
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-gray-600">
            Home
          </Link>
          <Link href="/catalog" className="hover:text-gray-600">
            Catalog
          </Link>
        </nav>
      </div>
    </header>
  );
}
