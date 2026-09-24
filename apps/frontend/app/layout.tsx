import type { Metadata } from "next";
import { Inter, Jost } from "next/font/google";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "./globals.css";
import "./premium.css";
import "./garment.css";
import "./header.css";
import "./motion.css";
import "./slider.css";

// Futura-style geometric sans (Nike/Supreme lineage) for headings, nav and buttons.
const jost = Jost({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Helvetica-style neutral grotesk for body copy.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
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
    <html lang="en" className={`${jost.variable} ${inter.variable}`}>
      <body className="bg-stone-100 font-sans text-stone-900 antialiased">
        <AnnouncementBar />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
