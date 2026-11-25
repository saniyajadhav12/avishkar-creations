"use client";

import Link from "next/link";
import { useCustomerSession } from "@/components/auth/customer-session";
import { buttonStyles } from "@/components/button-styles";
import { ArchFrame } from "@/components/arch-frame";
import { ProductImage } from "@/components/product-image";
import { HeartButton } from "@/components/shop/heart-button";
import { useWishlist } from "@/components/shop/wishlist-provider";
import { addToCart } from "@/lib/cart";
import type { ClientProduct } from "@/lib/client-products";
import { formatPriceInr } from "@/lib/format";
import { site } from "@/lib/site";

export function WishlistView({ products }: { products: ClientProduct[] }) {
  const session = useCustomerSession();
  const { savedIds, ready, error, remove } = useWishlist();

  if (session.status === "loading") return <p className="text-fg-muted">Loading…</p>;

  if (session.status === "signed-out") {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <p className="max-w-sm text-fg-muted">Sign in to save your favourite pieces and see them on any device.</p>
        <Link href="/login?next=/wishlist/" className={buttonStyles.primary}>
          Sign in
        </Link>
      </div>
    );
  }

  if (!ready) return <p className="text-fg-muted">{error || "Loading your wishlist…"}</p>;

  const saved = products.filter((product) => savedIds.has(product.id));

  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <p className="text-fg-muted">No saved pieces yet. Tap the heart on any piece to save it here.</p>
        <Link href="/shop" className={buttonStyles.primary}>
          Browse the collection
        </Link>
      </div>
    );
  }

  function shareOnWhatsApp() {
    const lines = saved.map((product) => `• ${product.name}: ${window.location.origin}/shop/${product.slug}/`);
    const text = [`Some pieces I love from ${site.name}:`, "", ...lines].join("\n");
    // No number: WhatsApp lets the customer choose who to share with
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-fg-muted">
          {saved.length} saved {saved.length === 1 ? "piece" : "pieces"}
        </p>
        <button type="button" onClick={shareOnWhatsApp} className={buttonStyles.secondary}>
          Share on WhatsApp
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-badge">
          {error}
        </p>
      )}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
        {saved.map((product) => (
          <li key={product.id} className="flex flex-col gap-3">
            <div className="relative">
              <Link href={`/shop/${product.slug}`} tabIndex={-1} aria-hidden="true" className="block">
                <ArchFrame className="aspect-[4/5]">
                  {product.image && <ProductImage image={product.image} sizes="(min-width: 640px) 33vw, 50vw" />}
                </ArchFrame>
              </Link>
              <HeartButton productId={product.id} productName={product.name} className="absolute right-3 bottom-3" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <Link href={`/shop/${product.slug}`} className="font-display text-xl hover:text-primary">
                {product.name}
              </Link>
              <p className="text-sm">{formatPriceInr(product.priceInr)}</p>
            </div>
            {product.isSoldOut ? (
              <p className="text-center text-sm text-badge">Sold out</p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  addToCart(product.slug);
                  remove(product.id);
                }}
                className={`${buttonStyles.primary} w-full`}
              >
                Move to cart
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
