"use client";

import Link from "next/link";
import { buttonStyles } from "@/components/button-styles";
import { BagIcon } from "@/components/icons";
import { addToCart, useCart } from "@/lib/cart";

type AddToCartButtonProps = {
  slug: string;
  soldOut: boolean;
  className?: string;
};

/**
 * Adds a piece to the cart. Once it's in the cart, it stays marked as added and links to the cart
 * (quantities are changed there). It reads the shared cart, so it stays correct after a refresh or in other tabs.
 */
export function AddToCartButton({ slug, soldOut, className = "" }: AddToCartButtonProps) {
  const inCart = useCart().some((item) => item.slug === slug);

  if (soldOut) {
    return (
      <button type="button" disabled className={`${buttonStyles.secondary} opacity-60 ${className}`}>
        Sold out
      </button>
    );
  }

  if (inCart) {
    return (
      <Link href="/cart" className={`${buttonStyles.primary} ${className}`}>
        <BagIcon />
        Added ✓ · View cart
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => addToCart(slug)} className={`${buttonStyles.primary} ${className}`}>
      <BagIcon />
      Add to cart
    </button>
  );
}
