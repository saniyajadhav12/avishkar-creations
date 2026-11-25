import Link from "next/link";
import { ArchFrame } from "@/components/arch-frame";
import { ProductImage } from "@/components/product-image";
import { HeartButton } from "@/components/shop/heart-button";
import type { CatalogProduct } from "@/lib/catalog";
import { formatPriceInr } from "@/lib/format";

type ProductCardProps = {
  product: CatalogProduct;
  sizes?: string;
  priority?: boolean;
};

const defaultSizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw";

export function ProductCard({ product, sizes = defaultSizes, priority = false }: ProductCardProps) {
  const [primaryImage, secondaryImage] = product.images;
  const href = `/shop/${product.slug}`;

  return (
    <article className="group">
      <div className="relative">
        {/* The photo repeats the text link below, so it's skipped by keyboard and screen readers */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block rounded-t-full">
          <ArchFrame className="aspect-[4/5]">
            {primaryImage ? (
              <ProductImage
                image={primaryImage}
                sizes={sizes}
                priority={priority}
                className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-devanagari text-6xl text-fg-muted/40">
                आ
              </div>
            )}

            {/* Second photo fades in on hover. Tailwind's hover: only applies on devices that can hover,
                so touch screens simply show the main photo. */}
            {secondaryImage && (
              <ProductImage
                image={secondaryImage}
                sizes={sizes}
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </ArchFrame>
        </Link>

        {product.isSoldOut && (
          <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-badge px-3 py-1 text-xs font-medium tracking-wide text-on-badge">
            Sold out
          </span>
        )}
        <HeartButton productId={product.id} productName={product.name} className="absolute right-3 bottom-3" />
      </div>

      <Link
        href={href}
        className="mt-4 flex flex-col items-center gap-1 rounded-sm text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-line"
      >
        {product.category && (
          <span className="text-xs tracking-[0.2em] text-fg-muted uppercase">{product.category.name}</span>
        )}
        <h3 className="font-display text-xl transition-colors group-hover:text-primary">{product.name}</h3>
        <span className="text-sm">{formatPriceInr(product.priceInr)}</span>
      </Link>
    </article>
  );
}
