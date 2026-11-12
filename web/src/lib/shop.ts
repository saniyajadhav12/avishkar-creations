/**
 * Pure filtering and sorting for the shop page, shared by the static fallback and the
 * interactive catalog. Kept free of React so it's easy to test.
 */
import type { CatalogProduct } from "@/lib/catalog";

export type FilterOption = { id: string; name: string; slug: string; count: number; hex?: string };

export type SortKey = "newest" | "price-asc" | "price-desc";

export const sortLabels: Record<SortKey, string> = {
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

export function isSortKey(value: string | null): value is SortKey {
  return value === "newest" || value === "price-asc" || value === "price-desc";
}

export type ProductFilters = {
  category: string | null;
  colors: string[];
  materials: string[];
};

/** Options within a group match with OR; groups combine with AND */
export function filterProducts(products: CatalogProduct[], filters: ProductFilters): CatalogProduct[] {
  return products.filter((product) => {
    if (filters.category && product.category?.slug !== filters.category) return false;
    if (filters.colors.length > 0 && !product.colors.some((c) => filters.colors.includes(c.slug))) {
      return false;
    }
    if (
      filters.materials.length > 0 &&
      !product.materials.some((m) => filters.materials.includes(m.slug))
    ) {
      return false;
    }
    return true;
  });
}

/** Available pieces first, then by the chosen order */
export function sortProducts(products: CatalogProduct[], sort: SortKey): CatalogProduct[] {
  return [...products].sort((a, b) => {
    if (a.isSoldOut !== b.isSoldOut) return a.isSoldOut ? 1 : -1;
    if (sort === "price-asc") return a.priceInr - b.priceInr;
    if (sort === "price-desc") return b.priceInr - a.priceInr;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
