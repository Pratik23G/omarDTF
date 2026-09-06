import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmarDTF — Custom DTF Transfers & Apparel",
  description:
    "Custom DTF transfers and personalized apparel, made in Redwood City, CA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
