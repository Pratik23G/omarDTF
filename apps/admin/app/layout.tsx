import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider, Show, UserButton } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = { title: "OMARDTF Admin", robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
          <Show when="signed-in">
            <header className="border-b border-neutral-200 bg-white">
              <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
                <span className="font-bold uppercase tracking-wide">OMARDTF Admin</span>
                <Link href="/" className="text-sm hover:underline">Dashboard</Link>
                <Link href="/orders" className="text-sm hover:underline">Orders</Link>
                <div className="ml-auto"><UserButton /></div>
              </nav>
            </header>
          </Show>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
