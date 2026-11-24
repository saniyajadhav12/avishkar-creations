/**
 * Admin product data, called from the browser with the admin's login.
 * RLS lets admins read and write everything (including hidden products); rows are validated with Zod.
 */
import { z } from "zod";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const BUCKET = "product-images";

// ---------- Options (categories, colours, materials) ----------

const optionSchema = z.object({ id: z.string(), name: z.string(), slug: z.string() });
const colorOptionSchema = optionSchema.extend({ hex: z.string() });

export type Option = z.infer<typeof optionSchema>;
export type ColorOption = z.infer<typeof colorOptionSchema>;
export type ProductOptions = { categories: Option[]; colors: ColorOption[]; materials: Option[] };

export async function loadProductOptions(): Promise<ProductOptions> {
  const supabase = getBrowserSupabase();
  const [categories, colors, materials] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("sort_order").order("name"),
    supabase.from("colors").select("id, name, slug, hex").order("sort_order").order("name"),
    supabase.from("materials").select("id, name, slug").order("sort_order").order("name"),
  ]);
  if (categories.error) throw categories.error;
  if (colors.error) throw colors.error;
  if (materials.error) throw materials.error;

  return {
    categories: z.array(optionSchema).parse(categories.data),
    colors: z.array(colorOptionSchema).parse(colors.data),
    materials: z.array(optionSchema).parse(materials.data),
  };
}

// ---------- Product list ----------

const summaryRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price_inr: z.number().int(),
  is_visible: z.boolean(),
  is_featured: z.boolean(),
  is_sold_out: z.boolean(),
  category: z.object({ name: z.string() }).nullable(),
  images: z.array(z.object({ storage_path: z.string(), sort_order: z.number().int() })),
});

export type AdminProductSummary = {
  id: string;
  name: string;
  slug: string;
  priceInr: number;
  isVisible: boolean;
  isFeatured: boolean;
  isSoldOut: boolean;
  categoryName: string | null;
  thumbnailUrl: string | null;
};

export function publicImageUrl(storagePath: string): string {
  return getBrowserSupabase().storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export async function listAdminProducts(): Promise<AdminProductSummary[]> {
  const { data, error } = await getBrowserSupabase()
    .from("products")
    .select(
      "id, name, slug, price_inr, is_visible, is_featured, is_sold_out, " +
        "category:categories(name), images:product_images(storage_path, sort_order)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  return z
    .array(summaryRowSchema)
    .parse(data)
    .map((row) => {
      const firstImage = [...row.images].sort((a, b) => a.sort_order - b.sort_order)[0];
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        priceInr: row.price_inr,
        isVisible: row.is_visible,
        isFeatured: row.is_featured,
        isSoldOut: row.is_sold_out,
        categoryName: row.category?.name ?? null,
        thumbnailUrl: firstImage ? publicImageUrl(firstImage.storage_path) : null,
      };
    });
}

export type ProductFlagColumn = "is_visible" | "is_featured" | "is_sold_out";

export async function updateProductFlag(id: string, column: ProductFlagColumn, value: boolean): Promise<void> {
  const patch: Partial<Record<ProductFlagColumn, boolean>> = {};
  patch[column] = value;
  const { error } = await getBrowserSupabase().from("products").update(patch).eq("id", id);
  if (error) throw error;
}

// ---------- Single product ----------

const detailRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  price_inr: z.number().int(),
  category_id: z.string().nullable(),
  is_visible: z.boolean(),
  is_featured: z.boolean(),
  is_sold_out: z.boolean(),
  colors: z.array(z.object({ color_id: z.string() })),
  materials: z.array(z.object({ material_id: z.string() })),
});

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceInr: number;
  categoryId: string | null;
  isVisible: boolean;
  isFeatured: boolean;
  isSoldOut: boolean;
  colorIds: string[];
  materialIds: string[];
};

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  const { data, error } = await getBrowserSupabase()
    .from("products")
    .select(
      "id, name, slug, description, price_inr, category_id, is_visible, is_featured, is_sold_out, " +
        "colors:product_colors(color_id), materials:product_materials(material_id)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = detailRowSchema.parse(data);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    priceInr: row.price_inr,
    categoryId: row.category_id,
    isVisible: row.is_visible,
    isFeatured: row.is_featured,
    isSoldOut: row.is_sold_out,
    colorIds: row.colors.map((c) => c.color_id),
    materialIds: row.materials.map((m) => m.material_id),
  };
}

// ---------- Save and delete ----------

export type ProductInput = Omit<AdminProductDetail, "id">;

/** Returns the slug itself, or slug-2, slug-3… if another product already uses it */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const { data, error } = await getBrowserSupabase().from("products").select("id, slug").like("slug", `${base}%`);
  if (error) throw error;
  const taken = new Set(
    z
      .array(z.object({ id: z.string(), slug: z.string() }))
      .parse(data)
      .filter((row) => row.id !== excludeId)
      .map((row) => row.slug),
  );
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

/** Makes a product's links match the selected ids: removes un-ticked ones, adds new ones */
async function syncLinks(
  table: "product_colors" | "product_materials",
  column: "color_id" | "material_id",
  productId: string,
  ids: string[],
): Promise<void> {
  const supabase = getBrowserSupabase();

  const remove = supabase.from(table).delete().eq("product_id", productId);
  const { error: deleteError } = ids.length > 0 ? await remove.not(column, "in", `(${ids.join(",")})`) : await remove;
  if (deleteError) throw deleteError;

  if (ids.length === 0) return;
  const rows = ids.map((id) => ({ product_id: productId, [column]: id }));
  const { error: insertError } = await supabase
    .from(table)
    .upsert(rows, { onConflict: `product_id,${column}`, ignoreDuplicates: true });
  if (insertError) throw insertError;
}

export async function saveProduct(input: ProductInput, id?: string): Promise<{ id: string; slug: string }> {
  const supabase = getBrowserSupabase();
  const slug = await uniqueSlug(input.slug, id);
  const row = {
    name: input.name,
    slug,
    description: input.description,
    price_inr: input.priceInr,
    category_id: input.categoryId,
    is_visible: input.isVisible,
    is_featured: input.isFeatured,
    is_sold_out: input.isSoldOut,
  };

  let productId = id;
  if (productId) {
    const { error } = await supabase.from("products").update(row).eq("id", productId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) throw error;
    productId = z.object({ id: z.string() }).parse(data).id;
  }

  await syncLinks("product_colors", "color_id", productId, input.colorIds);
  await syncLinks("product_materials", "material_id", productId, input.materialIds);
  return { id: productId, slug };
}

/**
 * Deletes the product row first (its image rows and links cascade), then its photo files.
 * If file cleanup fails, the worst case is an unused file in storage, never a broken product page.
 */
export async function deleteProduct(id: string): Promise<void> {
  const supabase = getBrowserSupabase();
  const { data, error } = await supabase.from("product_images").select("storage_path").eq("product_id", id);
  if (error) throw error;
  const paths = z.array(z.object({ storage_path: z.string() })).parse(data).map((row) => row.storage_path);

  const { error: deleteError } = await supabase.from("products").delete().eq("id", id);
  if (deleteError) throw deleteError;

  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths);
    if (storageError) console.error("Product deleted, but some photo files could not be removed:", storageError);
  }
}
