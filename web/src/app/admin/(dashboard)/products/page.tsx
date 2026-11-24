"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { errorClass, inputClass } from "@/components/admin/form-styles";
import { ToggleSwitch } from "@/components/admin/toggle-switch";
import { buttonStyles } from "@/components/button-styles";
import {
  listAdminProducts,
  updateProductFlag,
  type AdminProductSummary,
  type ProductFlagColumn,
} from "@/lib/admin/products";
import { formatPriceInr } from "@/lib/format";

type FlagField = "isVisible" | "isFeatured" | "isSoldOut";

const flagColumns: Record<FlagField, ProductFlagColumn> = {
  isVisible: "is_visible",
  isFeatured: "is_featured",
  isSoldOut: "is_sold_out",
};

function withFlag(product: AdminProductSummary, field: FlagField, value: boolean): AdminProductSummary {
  const updated = { ...product };
  updated[field] = value;
  return updated;
}

function Badge({ children, tone = "muted" }: { children: string; tone?: "muted" | "badge" | "primary" }) {
  const tones = {
    muted: "border border-fg/20 text-fg-muted",
    badge: "bg-badge text-on-badge",
    primary: "bg-primary text-on-primary",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs ${tones[tone]}`}>{children}</span>;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductSummary[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [toggleError, setToggleError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    listAdminProducts()
      .then(setProducts)
      .catch(() => setLoadError("Couldn't load products. Check your internet connection and refresh."));
  }, []);

  async function toggleFlag(id: string, field: FlagField, value: boolean) {
    setToggleError("");
    // Update the screen right away, then save; undo if saving fails
    setProducts((current) => current?.map((p) => (p.id === id ? withFlag(p, field, value) : p)) ?? current);
    try {
      await updateProductFlag(id, flagColumns[field], value);
    } catch {
      setProducts((current) => current?.map((p) => (p.id === id ? withFlag(p, field, !value) : p)) ?? current);
      setToggleError("Couldn't save that change. Please try again.");
    }
  }

  const search = query.trim().toLowerCase();
  const visibleList = (products ?? []).filter(
    (p) => !search || p.name.toLowerCase().includes(search) || p.categoryName?.toLowerCase().includes(search),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl">Products</h1>
          {products && <p className="text-sm text-fg-muted">{products.length} pieces</p>}
        </div>
        <Link href="/admin/products/new" className={buttonStyles.primary}>
          + Add product
        </Link>
      </div>

      <p className="rounded-xl border border-border bg-surface-raised p-4 text-sm text-fg-muted">
        Changes appear on the live website after you tap <strong className="text-fg">Publish changes</strong> on the
        Dashboard.
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <input
          id="product-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or category"
          className={inputClass}
        />
      </div>

      {loadError && (
        <p role="alert" className={errorClass}>
          {loadError}
        </p>
      )}
      {toggleError && (
        <p role="alert" className={errorClass}>
          {toggleError}
        </p>
      )}
      {!products && !loadError && <p className="text-fg-muted">Loading products…</p>}
      {products && visibleList.length === 0 && (
        <p className="text-fg-muted">{products.length === 0 ? "No products yet. Add your first piece!" : "No matches."}</p>
      )}

      <ul className="flex flex-col gap-3">
        {visibleList.map((product) => (
          <li key={product.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
            <Link
              href={`/admin/products/edit?id=${product.id}`}
              className="flex min-w-0 items-center gap-4 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
            >
              {product.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail straight from Supabase Storage
                <img
                  src={product.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-surface-raised font-devanagari text-2xl text-fg-muted">
                  आ
                </span>
              )}
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-display text-xl">{product.name}</span>
                <span className="text-sm text-fg-muted">
                  {formatPriceInr(product.priceInr)}
                  {product.categoryName && ` · ${product.categoryName}`}
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {!product.isVisible && <Badge>Hidden</Badge>}
                  {product.isSoldOut && <Badge tone="badge">Sold out</Badge>}
                  {product.isFeatured && <Badge tone="primary">Featured</Badge>}
                </span>
              </span>
            </Link>
            <div className="flex flex-wrap gap-x-6 border-t border-border pt-2">
              <ToggleSwitch label="Visible" checked={product.isVisible} onChange={(v) => toggleFlag(product.id, "isVisible", v)} />
              <ToggleSwitch label="Sold out" checked={product.isSoldOut} onChange={(v) => toggleFlag(product.id, "isSoldOut", v)} />
              <ToggleSwitch label="Featured" checked={product.isFeatured} onChange={(v) => toggleFlag(product.id, "isFeatured", v)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
