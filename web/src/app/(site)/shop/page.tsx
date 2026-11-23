import type { Metadata } from "next";
import { Suspense } from "react";
import { buttonStyles } from "@/components/button-styles";
import { CameraIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
import { ShopCatalog } from "@/components/shop-catalog";
import { getCategories, getColors, getMaterials, getProducts } from "@/lib/catalog";
import type { FilterOption } from "@/lib/shop";
import { sortProducts } from "@/lib/shop";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse handmade pendant sets, necklaces, bracelets, and earrings by Kavita Jadhav. Every piece is one of a kind.",
};

/** Keeps only options that at least one product uses, with their product counts */
function withCounts<T extends { id: string; name: string; slug: string }>(
  options: T[],
  countFor: (option: T) => number,
  extra?: (option: T) => Partial<FilterOption>,
): FilterOption[] {
  return options.flatMap((option) => {
    const count = countFor(option);
    if (count === 0) return [];
    return [{ id: option.id, name: option.name, slug: option.slug, count, ...extra?.(option) }];
  });
}

export default async function ShopPage() {
  const [products, categories, colors, materials] = await Promise.all([
    getProducts(),
    getCategories(),
    getColors(),
    getMaterials(),
  ]);

  const categoryOptions = withCounts(
    categories,
    (category) => products.filter((p) => p.category?.id === category.id).length,
  );
  const colorOptions = withCounts(
    colors,
    (color) => products.filter((p) => p.colors.some((c) => c.id === color.id)).length,
    (color) => ({ hex: color.hex }),
  );
  const materialOptions = withCounts(
    materials,
    (material) => products.filter((p) => p.materials.some((m) => m.id === material.id)).length,
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Shop"
        title="The collection"
        description={`Every piece is handmade by ${site.founder}. Tap any piece to see it up close.`}
      />

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-16 text-center">
          <p className="text-fg-muted">New pieces are on their way. Follow along on Instagram to see them first.</p>
          <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondary}>
            <CameraIcon />@{site.instagramHandle}
          </a>
        </div>
      ) : (
        // Reading the URL needs a Suspense boundary in a static export. The fallback is the full
        // grid, so the page is never empty before JavaScript loads.
        <Suspense fallback={<ProductGrid products={sortProducts(products, "newest")} />}>
          <ShopCatalog
            products={products}
            categories={categoryOptions}
            colors={colorOptions}
            materials={materialOptions}
          />
        </Suspense>
      )}
    </div>
  );
}
