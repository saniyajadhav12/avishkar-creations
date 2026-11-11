/**
 * Build-time data layer. Runs only while `next build` (or `next dev`) generates pages;
 * customers' browsers never call Supabase for catalog data.
 * Rows are validated with Zod, so a schema mismatch fails the build loudly
 * instead of silently publishing broken pages.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { createBuildSupabase } from "@/lib/supabase/build";

// ---------- Schemas (types are inferred from these, so they can't drift apart) ----------

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  sort_order: z.number().int(),
});

const productRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  price_inr: z.number().int(),
  is_featured: z.boolean(),
  is_sold_out: z.boolean(),
  category: z.object({ id: z.string(), name: z.string(), slug: z.string() }).nullable(),
  images: z.array(z.object({ id: z.string(), alt_text: z.string(), sort_order: z.number().int() })),
});

const exhibitionSchema = z.object({
  id: z.string(),
  title: z.string(),
  venue: z.string(),
  city: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  notes: z.string(),
});

const manifestSchema = z.object({
  images: z.record(
    z.string(),
    z.object({ width: z.number(), height: z.number(), widths: z.array(z.number()) }),
  ),
});

export type Category = z.infer<typeof categorySchema>;
export type Exhibition = z.infer<typeof exhibitionSchema>;
type ImageManifest = z.infer<typeof manifestSchema>;

export type CatalogImage = {
  id: string;
  alt: string;
  width: number;
  height: number;
  /** Largest generated size, used as the fallback src */
  src: string;
  /** All generated sizes for the browser to choose from */
  srcSet: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceInr: number;
  isFeatured: boolean;
  isSoldOut: boolean;
  category: { id: string; name: string; slug: string } | null;
  images: CatalogImage[];
};

// ---------- Internals ----------

let client: ReturnType<typeof createBuildSupabase> | undefined;
function db() {
  client ??= createBuildSupabase();
  return client;
}

const MANIFEST_PATH = path.join(process.cwd(), ".generated", "image-manifest.json");

let manifestPromise: Promise<ImageManifest> | undefined;
function loadImageManifest(): Promise<ImageManifest> {
  manifestPromise ??= readFile(MANIFEST_PATH, "utf8")
    .then((raw) => manifestSchema.parse(JSON.parse(raw)))
    .catch((error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        console.warn("Image manifest not found. Run `npm run images` first. Images will be hidden.");
        return { images: {} };
      }
      throw error;
    });
  return manifestPromise;
}

function imageUrl(imageId: string, width: number): string {
  return `/product-images/${imageId}-${width}.webp`;
}

// ---------- Public API ----------

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await db()
    .from("categories")
    .select("id, name, slug, sort_order")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return z.array(categorySchema).parse(data);
}

async function loadProducts(): Promise<CatalogProduct[]> {
  const [{ data, error }, manifest] = await Promise.all([
    db()
      .from("products")
      .select(
        "id, name, slug, description, price_inr, is_featured, is_sold_out, " +
          "category:categories(id, name, slug), images:product_images(id, alt_text, sort_order)",
      )
      .order("created_at", { ascending: false }),
    loadImageManifest(),
  ]);
  if (error) throw new Error(`Could not load products: ${error.message}`);

  return z
    .array(productRowSchema)
    .parse(data)
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      priceInr: row.price_inr,
      isFeatured: row.is_featured,
      isSoldOut: row.is_sold_out,
      category: row.category,
      images: [...row.images]
        .sort((a, b) => a.sort_order - b.sort_order)
        .flatMap((image): CatalogImage[] => {
          const entry = manifest.images[image.id];
          if (!entry) return [];
          const largest = Math.max(...entry.widths);
          return [
            {
              id: image.id,
              alt: image.alt_text || row.name,
              width: entry.width,
              height: entry.height,
              src: imageUrl(image.id, largest),
              srcSet: entry.widths.map((width) => `${imageUrl(image.id, width)} ${width}w`).join(", "),
            },
          ];
        }),
    }));
}

// Fetched once per build and shared by every page that needs products
let productsPromise: Promise<CatalogProduct[]> | undefined;
export function getProducts(): Promise<CatalogProduct[]> {
  productsPromise ??= loadProducts();
  return productsPromise;
}

export async function getFeaturedProducts(): Promise<CatalogProduct[]> {
  return (await getProducts()).filter((product) => product.isFeatured);
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  return (await getProducts()).find((product) => product.slug === slug);
}

/** RLS already hides past exhibitions; this just orders them soonest first */
export async function getUpcomingExhibitions(): Promise<Exhibition[]> {
  const { data, error } = await db()
    .from("exhibitions")
    .select("id, title, venue, city, start_date, end_date, notes")
    .order("start_date");
  if (error) throw new Error(`Could not load exhibitions: ${error.message}`);
  return z.array(exhibitionSchema).parse(data);
}
