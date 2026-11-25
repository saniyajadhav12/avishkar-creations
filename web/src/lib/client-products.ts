import type { CatalogImage, CatalogProduct } from "@/lib/catalog";

/** The few product fields the cart and wishlist pages need in the browser */
export type ClientProduct = {
  id: string;
  slug: string;
  name: string;
  priceInr: number;
  isSoldOut: boolean;
  image: CatalogImage | null;
};

export function toClientProduct(product: CatalogProduct): ClientProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    priceInr: product.priceInr,
    isSoldOut: product.isSoldOut,
    image: product.images[0] ?? null,
  };
}
