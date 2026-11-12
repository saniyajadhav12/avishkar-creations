import type { CatalogImage } from "@/lib/catalog";

type ProductImageProps = {
  image: CatalogImage;
  /** Tells the browser how wide the image displays, so it downloads the right size */
  sizes: string;
  /** Load immediately for above-the-fold images; everything else is lazy-loaded */
  priority?: boolean;
  className?: string;
};

export function ProductImage({ image, sizes, priority = false, className = "" }: ProductImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export has no image optimizer; we serve our own pre-generated WebP srcSet
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={sizes}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={`block h-full w-full object-cover ${className}`}
    />
  );
}
