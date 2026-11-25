"use client";

import { HeartIcon } from "@/components/icons";
import { useWishlist } from "@/components/shop/wishlist-provider";

type HeartButtonProps = {
  productId: string;
  productName: string;
  className?: string;
};

/** Save or remove a piece from the wishlist. Signed-out customers are sent to sign in first. */
export function HeartButton({ productId, productName, className = "" }: HeartButtonProps) {
  const { savedIds, toggle } = useWishlist();
  const saved = savedIds.has(productId);
  const label = saved ? `Remove ${productName} from your wishlist` : `Save ${productName} to your wishlist`;

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`inline-flex size-11 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line ${
        saved ? "text-badge" : "text-fg"
      } ${className}`}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}
