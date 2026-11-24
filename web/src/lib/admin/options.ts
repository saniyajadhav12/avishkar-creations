/**
 * Admin management of the shop's filter options: categories, colours, and materials.
 * Each option is loaded with how many products use it, so deletes can warn about the impact.
 */
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export type OptionTable = "categories" | "colors" | "materials";

// The relation that links each option type to products, used for the "used by N products" count
const usageRelation: Record<OptionTable, string> = {
  categories: "products(count)",
  colors: "product_colors(count)",
  materials: "product_materials(count)",
};

const rowSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  sort_order: z.number().int(),
  hex: z.string().optional(),
  usage: z.array(z.object({ count: z.number() })),
});

export type AdminOption = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  hex: string | null;
  productCount: number;
};

function toOption(row: z.infer<typeof rowSchema>): AdminOption {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sort_order,
    hex: row.hex ?? null,
    productCount: row.usage[0]?.count ?? 0,
  };
}

function columns(table: OptionTable): string {
  return `id, name, slug, sort_order${table === "colors" ? ", hex" : ""}, usage:${usageRelation[table]}`;
}

export async function listOptions(table: OptionTable): Promise<AdminOption[]> {
  const { data, error } = await getBrowserSupabase()
    .from(table)
    .select(columns(table))
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return z.array(rowSchema).parse(data).map(toOption);
}

async function uniqueSlug(table: OptionTable, base: string): Promise<string> {
  const { data, error } = await getBrowserSupabase().from(table).select("slug").like("slug", `${base}%`);
  if (error) throw error;
  const taken = new Set(z.array(z.object({ slug: z.string() })).parse(data).map((row) => row.slug));
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export async function createOption(
  table: OptionTable,
  name: string,
  sortOrder: number,
  hex?: string,
): Promise<AdminOption> {
  const slug = await uniqueSlug(table, slugify(name) || "option");
  const row: Record<string, string | number> = { name, slug, sort_order: sortOrder };
  if (table === "colors") row.hex = hex ?? "#cccccc";

  const { data, error } = await getBrowserSupabase().from(table).insert(row).select(columns(table)).single();
  if (error) throw error;
  return toOption(rowSchema.parse(data));
}

/** Only the display name changes; the slug stays the same so shared shop links keep working */
export async function renameOption(table: OptionTable, id: string, name: string): Promise<void> {
  const { error } = await getBrowserSupabase().from(table).update({ name }).eq("id", id);
  if (error) throw error;
}

export async function updateColourHex(id: string, hex: string): Promise<void> {
  const { error } = await getBrowserSupabase().from("colors").update({ hex }).eq("id", id);
  if (error) throw error;
}

export async function saveOptionOrder(table: OptionTable, options: AdminOption[]): Promise<void> {
  const supabase = getBrowserSupabase();
  const results = await Promise.all(
    options.map((option, index) => supabase.from(table).update({ sort_order: index }).eq("id", option.id)),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

/** Categories: products are left uncategorised. Colours/materials: the tag is removed from products. */
export async function deleteOption(table: OptionTable, id: string): Promise<void> {
  const { error } = await getBrowserSupabase().from(table).delete().eq("id", id);
  if (error) throw error;
}
