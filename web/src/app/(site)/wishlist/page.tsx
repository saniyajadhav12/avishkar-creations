import type { Metadata } from "next";
import { SectionHeading } from "@/components/section-heading";
import { WishlistView } from "@/components/shop/wishlist-view";
import { getProducts } from "@/lib/catalog";
import { toClientProduct } from "@/lib/client-products";

export const metadata: Metadata = { title: "Your wishlist", robots: { index: false, follow: true } };

export default async function WishlistPage() {
  const products = (await getProducts()).map(toClientProduct);
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <SectionHeading as="h1" align="left" eyebrow="Saved pieces" title="Wishlist" />
      <WishlistView products={products} />
    </div>
  );
}
