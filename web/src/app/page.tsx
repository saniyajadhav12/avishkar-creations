import { getCategories, getProducts, getUpcomingExhibitions } from "@/lib/catalog";
import { formatPriceInr } from "@/lib/format";

// Temporary build-time data check. Replaced by the real home page next.
export default async function HomePage() {
  const [categories, products, exhibitions] = await Promise.all([
    getCategories(),
    getProducts(),
    getUpcomingExhibitions(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <h1 className="text-4xl">Catalog data check</h1>
      <p className="text-fg-muted">
        {categories.length} categories · {products.length} products · {exhibitions.length} upcoming
        exhibitions · price format: {formatPriceInr(1250)}
      </p>
      <ul className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <li key={category.id} className="rounded-full border border-border px-4 py-2 text-sm">
            {category.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
