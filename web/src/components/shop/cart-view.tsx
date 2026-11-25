"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonStyles } from "@/components/button-styles";
import { ProductImage } from "@/components/product-image";
import { MessageButton } from "@/components/shop/message-button";
import { keepOnly, MAX_QUANTITY, removeFromCart, setQuantity, useCart } from "@/lib/cart";
import type { ClientProduct } from "@/lib/client-products";
import { formatPriceInr } from "@/lib/format";
import { site } from "@/lib/site";

const stepClass =
  "inline-flex size-11 items-center justify-center rounded-full border border-fg/20 text-lg hover:border-primary disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";

export function CartView({ products }: { products: ClientProduct[] }) {
  const items = useCart();
  const [copied, setCopied] = useState(false);
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const lines = items.flatMap((item) => {
    const product = bySlug.get(item.slug);
    return product ? [{ item, product }] : [];
  });
  const unavailableCount = items.length - lines.length;
  const orderable = lines.filter(({ product }) => !product.isSoldOut);
  const total = orderable.reduce((sum, { item, product }) => sum + item.quantity * product.priceInr, 0);

  const message = [
    "Hello! I'd like to order:",
    "",
    ...orderable.map(
      ({ item, product }) =>
        `• ${product.name} × ${item.quantity}: ${formatPriceInr(item.quantity * product.priceInr)}`,
    ),
    "",
    `Total: ${formatPriceInr(total)}`,
    "",
    "Please let me know the next steps. Thank you!",
  ].join("\n");

  async function copyOrder() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <p className="text-fg-muted">Your cart is empty.</p>
        <Link href="/shop" className={buttonStyles.primary}>
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        {unavailableCount > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4 text-sm text-fg-muted">
            {unavailableCount === 1 ? "1 piece is" : `${unavailableCount} pieces are`} no longer available.
            <button
              type="button"
              onClick={() => keepOnly(new Set(lines.map(({ item }) => item.slug)))}
              className="text-primary underline"
            >
              Remove from cart
            </button>
          </div>
        )}

        <ul className="flex flex-col divide-y divide-border">
          {lines.map(({ item, product }) => (
            <li key={product.slug} className="flex gap-4 py-4">
              <Link href={`/shop/${product.slug}`} tabIndex={-1} aria-hidden="true" className="shrink-0">
                <div className="size-24 overflow-hidden rounded-xl bg-surface-raised">
                  {product.image && <ProductImage image={product.image} sizes="96px" />}
                </div>
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/shop/${product.slug}`} className="font-display text-xl hover:text-primary">
                    {product.name}
                  </Link>
                  <p>{formatPriceInr(product.priceInr * item.quantity)}</p>
                </div>
                {product.isSoldOut ? (
                  <p className="text-sm text-badge">Sold out, so it won&apos;t be included in your order.</p>
                ) : (
                  <p className="text-sm text-fg-muted">{formatPriceInr(product.priceInr)} each</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(product.slug, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label={`Decrease quantity of ${product.name}`}
                    className={stepClass}
                  >
                    −
                  </button>
                  <span aria-live="polite" className="min-w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(product.slug, item.quantity + 1)}
                    disabled={item.quantity >= MAX_QUANTITY}
                    aria-label={`Increase quantity of ${product.name}`}
                    className={stepClass}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromCart(product.slug)}
                    className="ml-auto inline-flex min-h-11 items-center px-2 text-sm text-badge hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-border bg-surface-raised p-6 lg:sticky lg:top-28">
        <h2 className="text-2xl">Order summary</h2>
        <div className="flex items-baseline justify-between">
          <span className="text-fg-muted">Total</span>
          <span className="text-2xl">{formatPriceInr(total)}</span>
        </div>
        <p className="text-sm text-fg-muted">
          Orders are confirmed on WhatsApp, where {site.founder} will share payment and delivery details.
        </p>
        {orderable.length > 0 ? (
          <>
            <MessageButton message={message} label="Order on WhatsApp" className={`${buttonStyles.primary} w-full`} />
            <button type="button" onClick={copyOrder} className={`${buttonStyles.secondary} w-full`}>
              {copied ? "Copied!" : "Copy order details"}
            </button>
          </>
        ) : (
          <p className="text-sm text-badge">Everything in your cart is sold out.</p>
        )}
      </aside>
    </div>
  );
}
