import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles } from "@/components/button-styles";
import { ChatIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { SectionHeading } from "@/components/section-heading";
import { getProductBySlug, getProducts, type CatalogProduct } from "@/lib/catalog";
import { formatPriceInr } from "@/lib/format";
import { contactLink, site } from "@/lib/site";

// Only real product slugs exist; anything else is a 404
export const dynamicParams = false;

// A static export needs at least one path per dynamic route. With an empty catalog,
// this placeholder builds a single page that shows the 404 instead of failing the build.
const EMPTY_CATALOG_PLACEHOLDER = "coming-soon";

export async function generateStaticParams() {
  const products = await getProducts();
  if (products.length === 0) return [{ slug: EMPTY_CATALOG_PLACEHOLDER }];
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };

  return {
    title: product.name,
    description:
      product.description.slice(0, 155) || `${product.name}, handmade by ${site.founder}.`,
  };
}

/** Same-category pieces first, topped up with others, up to four */
function relatedProducts(product: CatalogProduct, all: CatalogProduct[]): CatalogProduct[] {
  const others = all.filter((p) => p.id !== product.id);
  const sameCategory = others.filter((p) => product.category && p.category?.id === product.category.id);
  const rest = others.filter((p) => !sameCategory.includes(p));
  return [...sameCategory, ...rest].slice(0, 4);
}

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
const chipClass =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-fg/20 px-4 text-sm transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";
const labelClass = "font-sans text-xs font-medium tracking-[0.2em] text-fg-muted uppercase";

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const [product, products] = await Promise.all([getProductBySlug(slug), getProducts()]);
  if (!product) notFound();

  const price = formatPriceInr(product.priceInr);
  const related = relatedProducts(product, products);
  const contact = contactLink(
    product.isSoldOut
      ? `Hello! I saw that the ${product.name} is sold out. Do you have anything similar?`
      : `Hello! I'm interested in the ${product.name} (${price}).`,
  );
  const askLabel = product.isSoldOut ? "Ask about similar pieces" : contact.label.replace("Message on", "Ask on");

  return (
    <div>
      <div className={`${container} pt-8 pb-20 lg:pt-12`}>
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-fg-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/shop" className="hover:text-fg">
                Shop
              </Link>
            </li>
            {product.category && (
              <>
                <li aria-hidden="true">›</li>
                <li>
                  <Link href={`/shop?category=${product.category.slug}`} className="hover:text-fg">
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-fg">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          <div className="flex flex-col gap-6 lg:pt-8">
            <div className="flex flex-col gap-3">
              {product.category && (
                <p className="text-xs font-medium tracking-[0.25em] text-accent uppercase">{product.category.name}</p>
              )}
              <h1 className="text-4xl sm:text-5xl">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-2xl">{price}</p>
                {product.isSoldOut && (
                  <span className="rounded-full bg-badge px-3 py-1 text-xs font-medium tracking-wide text-on-badge">
                    Sold out
                  </span>
                )}
              </div>
            </div>

            <span aria-hidden="true" className="h-px w-16 bg-accent-line" />

            {product.description && (
              <p className="max-w-prose whitespace-pre-line text-fg-muted">{product.description}</p>
            )}

            {(product.colors.length > 0 || product.materials.length > 0) && (
              <dl className="flex flex-col gap-4">
                {product.colors.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <dt className={labelClass}>Colour</dt>
                    <dd className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <Link key={color.id} href={`/shop?color=${color.slug}`} className={chipClass}>
                          <span
                            aria-hidden="true"
                            className="size-3.5 rounded-full border border-border"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.name}
                        </Link>
                      ))}
                    </dd>
                  </div>
                )}
                {product.materials.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <dt className={labelClass}>Material</dt>
                    <dd className="flex flex-wrap gap-2">
                      {product.materials.map((material) => (
                        <Link key={material.id} href={`/shop?material=${material.slug}`} className={chipClass}>
                          {material.name}
                        </Link>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            <div className="flex flex-wrap gap-3">
              <a href={contact.href} target="_blank" rel="noopener noreferrer" className={buttonStyles.primary}>
                <ChatIcon />
                {askLabel}
              </a>
              {/* Phase 4: wishlist heart and "Add to cart" go here */}
            </div>

            <p className="flex items-start gap-2 text-sm text-fg-muted">
              <span aria-hidden="true" className="text-accent-line">
                ✦
              </span>
              Each piece is handmade, so small variations make it truly one of a kind.
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <SectionHeading eyebrow="More to love" title="You may also like" />
            <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard product={item} sizes="(min-width: 1024px) 25vw, 50vw" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Mobile and tablet: sticky price-and-ask bar. As the last element in the page content,
          it follows the visitor while scrolling, then settles above the footer instead of covering it. */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-display text-lg">{product.name}</p>
            <p className="text-sm text-fg-muted">
              {price}
              {product.isSoldOut && " · Sold out"}
            </p>
          </div>
          <a
            href={contact.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonStyles.primary} shrink-0`}
          >
            <ChatIcon />
            {askLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
