import { ProductCard } from "@/components/product-card";
import type { CatalogProduct } from "@/lib/catalog";

const gridSizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

/** Shop grid: 2 columns on phones for easy comparison, 3 from tablets up */
export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} sizes={gridSizes} priority={index < 2} />
        </li>
      ))}
    </ul>
  );
}
