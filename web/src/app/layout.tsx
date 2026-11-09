import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Tiro_Devanagari_Marathi } from "next/font/google";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

// Fonts are downloaded at build time and self-hosted (no requests to Google at runtime)
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const tiroDevanagari = Tiro_Devanagari_Marathi({
  variable: "--font-tiro-devanagari",
  subsets: ["devanagari", "latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Avishkar Creations · Handmade Jewellery",
    template: "%s · Avishkar Creations",
  },
  description:
    "Handmade jewellery by Kavita Jadhav: pearl strands, beaded necklaces, temple and kundan pendants, oxidised silver, and matching earrings.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1f4d3a" },
    { media: "(prefers-color-scheme: dark)", color: "#121814" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline script sets data-theme before React hydrates
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cormorant.variable} ${dmSans.variable} ${tiroDevanagari.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-surface font-sans text-fg">{children}</body>
    </html>
  );
}
