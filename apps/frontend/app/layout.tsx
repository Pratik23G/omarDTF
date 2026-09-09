import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body className="bg-neutral-50 font-sans text-black antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
