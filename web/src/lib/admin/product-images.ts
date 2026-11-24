/**
 * Product photos for the admin dashboard. Photos are compressed in the browser before upload
 * (saving mobile data), stored under products/<productId>/ in the product-images bucket,
 * and listed in product_images with their display order and description (alt text).
 */
import imageCompression from "browser-image-compression";
import { z } from "zod";
import { publicImageUrl } from "@/lib/admin/products";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const BUCKET = "product-images";

const imageRowSchema = z.object({
  id: z.string(),
  storage_path: z.string(),
  alt_text: z.string(),
  sort_order: z.number().int(),
});

export type AdminProductImage = {
  id: string;
  storagePath: string;
  altText: string;
  sortOrder: number;
  url: string;
};

function toImage(row: z.infer<typeof imageRowSchema>): AdminProductImage {
  return {
    id: row.id,
    storagePath: row.storage_path,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    url: publicImageUrl(row.storage_path),
  };
}

/** Unique file name. crypto.randomUUID() needs https (or localhost), so plain-http testing gets a fallback. */
function uniqueId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function listProductImages(productId: string): Promise<AdminProductImage[]> {
  const { data, error } = await getBrowserSupabase()
    .from("product_images")
    .select("id, storage_path, alt_text, sort_order")
    .eq("product_id", productId)
    .order("sort_order");
  if (error) throw error;
  return z.array(imageRowSchema).parse(data).map(toImage);
}

/** Phone photos are often 4–8 MB; this brings them to at most 1600px and about 0.6 MB */
async function compressPhoto(file: File): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 0.6,
    initialQuality: 0.85,
    fileType: "image/jpeg",
    useWebWorker: true,
  });
}

export async function uploadProductImage(
  productId: string,
  file: File,
  altText: string,
  sortOrder: number,
): Promise<AdminProductImage> {
  const supabase = getBrowserSupabase();
  const compressed = await compressPhoto(file);
  const path = `products/${productId}/${uniqueId()}.jpg`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, storage_path: path, alt_text: altText.slice(0, 200), sort_order: sortOrder })
    .select("id, storage_path, alt_text, sort_order")
    .single();

  if (error) {
    // Don't leave an orphan file in storage if the database row couldn't be saved
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
  return toImage(imageRowSchema.parse(data));
}

export async function updateImageAlt(id: string, altText: string): Promise<void> {
  const { error } = await getBrowserSupabase()
    .from("product_images")
    .update({ alt_text: altText.slice(0, 200) })
    .eq("id", id);
  if (error) throw error;
}

/** Saves the given order: the first image becomes sort_order 0 (the main photo) */
export async function saveImageOrder(images: AdminProductImage[]): Promise<void> {
  const supabase = getBrowserSupabase();
  const results = await Promise.all(
    images.map((image, index) => supabase.from("product_images").update({ sort_order: index }).eq("id", image.id)),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

/** Deletes the database row first, then the file (an unused file is harmless; a missing one isn't) */
export async function deleteProductImage(image: AdminProductImage): Promise<void> {
  const supabase = getBrowserSupabase();
  const { error } = await supabase.from("product_images").delete().eq("id", image.id);
  if (error) throw error;

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([image.storagePath]);
  if (storageError) console.error("Photo removed from the product, but its file could not be deleted:", storageError);
}
