import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

/** Lets search engines index the shop, but not private or personal pages */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/account/",
        "/cart/",
        "/wishlist/",
        "/login/",
        "/signup/",
        "/forgot-password/",
        "/reset-password/",
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
