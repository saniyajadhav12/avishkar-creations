"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BagIcon, HeartIcon } from "@/components/icons";
import { useWishlist } from "@/components/shop/wishlist-provider";
import { useCart } from "@/lib/cart";

function CountLink({ href, label, count, children }: { href: string; label: string; count: number; children: ReactNode }) {
  const fullLabel = count > 0 ? `${label}, ${count} ${count === 1 ? "item" : "items"}` : label;
  return (
    <Link
      href={href}
      aria-label={fullLabel}
      title={fullLabel}
      className="relative inline-flex size-11 items-center justify-center rounded-full text-fg transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
    >
      {children}
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-5 text-on-primary"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

/** Header wishlist and cart icons with counts */
export function HeaderShopLinks() {
  const { savedIds } = useWishlist();
  const cartCount = useCart().reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <CountLink href="/wishlist" label="Wishlist" count={savedIds.size}>
        <HeartIcon />
      </CountLink>
      <CountLink href="/cart" label="Cart" count={cartCount}>
        <BagIcon />
      </CountLink>
    </>
  );
}
