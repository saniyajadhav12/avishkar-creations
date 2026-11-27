import type { ReactNode } from "react";
import { CustomerSessionProvider } from "@/components/auth/customer-session";
import { Footer } from "@/components/footer";
import { Header, type MenuCategory } from "@/components/header";
import { WishlistProvider } from "@/components/shop/wishlist-provider";
import { getCategories, getProducts } from "@/lib/catalog";

/** Categories that have at least one visible piece, in the shop's order, for the mobile menu */
async function getMenuCategories(): Promise<MenuCategory[]> {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const inUse = new Set(products.flatMap((product) => (product.category ? [product.category.id] : [])));
  return categories
    .filter((category) => inUse.has(category.id))
    .map((category) => ({ name: category.name, slug: category.slug }));
}

// Storefront chrome: skip link, header, main content, and footer, plus the shared customer login
// state and wishlist. "(site)" is a route group, so it doesn't appear in URLs (/shop stays /shop).
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const menuCategories = await getMenuCategories();

  return (
    <CustomerSessionProvider>
      <WishlistProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-on-primary"
        >
          Skip to content
        </a>
        <Header menuCategories={menuCategories} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </WishlistProvider>
    </CustomerSessionProvider>
  );
}
