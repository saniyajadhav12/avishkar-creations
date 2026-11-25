import type { Metadata } from "next";
import Link from "next/link";
import SiteLayout from "./(site)/layout";
import { buttonStyles } from "@/components/button-styles";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

/** Branded 404 with the normal storefront header, footer, cart, and wishlist */
export default function NotFound() {
  return (
    <SiteLayout>
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
        <p lang="mr" className="font-devanagari text-6xl text-primary/40">
          आ
        </p>
        <h1 className="text-4xl sm:text-5xl">This page wandered off</h1>
        <p className="text-fg-muted">
          The page you&apos;re looking for doesn&apos;t exist, or the piece may have found a new home.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/shop" className={buttonStyles.primary}>
            Browse the collection
          </Link>
          <Link href="/" className={buttonStyles.secondary}>
            Go home
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
