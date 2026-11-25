import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog";
import { site } from "@/lib/site";

export const dynamic = "force-static";

/** Public pages and every visible product, generated at build time */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["/", "/shop/", "/about/", "/contact/", "/privacy/"];
  const products = await getProducts();
  return [
    ...pages.map((page) => ({ url: `${site.url}${page}` })),
    ...products.map((product) => ({ url: `${site.url}/shop/${product.slug}/` })),
  ];
}
