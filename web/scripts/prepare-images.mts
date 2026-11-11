/**
 * Runs before `next build` and `next dev`.
 * Downloads product photos from Supabase Storage, creates responsive WebP sizes with sharp,
 * and writes a manifest of image dimensions. The output is baked into the static site, so
 * product images never depend on Supabase being awake when customers visit.
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const BUCKET = "product-images";
const TARGET_WIDTHS = [400, 800, 1200];
const WEBP_QUALITY = 78;
const OUTPUT_DIR = path.join(process.cwd(), "public", "product-images");
const MANIFEST_DIR = path.join(process.cwd(), ".generated");
const MANIFEST_PATH = path.join(MANIFEST_DIR, "image-manifest.json");

type ManifestEntry = { width: number; height: number; widths: number[] };
type Manifest = { images: Record<string, ManifestEntry> };

function variantPath(imageId: string, width: number): string {
  return path.join(OUTPUT_DIR, `${imageId}-${width}.webp`);
}

// Target widths smaller than the original, plus the original width capped at the largest target.
function widthsFor(originalWidth: number): number[] {
  const largest = Math.max(...TARGET_WIDTHS);
  const widths = TARGET_WIDTHS.filter((width) => width < originalWidth);
  widths.push(Math.min(originalWidth, largest));
  return [...new Set(widths)].sort((a, b) => a - b);
}

async function readPreviousManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as Manifest;
  } catch {
    return { images: {} };
  }
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Refusing to build a shop with no products.",
    );
  }

  const supabase = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  // RLS only returns images of visible products
  const { data, error } = await supabase.from("product_images").select("id, storage_path");
  if (error) throw new Error(`Could not load product images: ${error.message}`);

  const images = (data ?? []).map((row: { id: string; storage_path: string }) => ({
    id: row.id,
    storagePath: row.storage_path,
  }));

  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(MANIFEST_DIR, { recursive: true });

  const previous = await readPreviousManifest();
  const next: Manifest = { images: {} };
  let processed = 0;
  let reused = 0;

  for (const image of images) {
    const cached = previous.images[image.id];
    if (cached && cached.widths.every((width) => existsSync(variantPath(image.id, width)))) {
      next.images[image.id] = cached;
      reused += 1;
      continue;
    }

    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(image.storagePath).data.publicUrl;
    const response = await fetch(publicUrl);
    if (!response.ok) {
      throw new Error(`Could not download ${image.storagePath} (HTTP ${response.status})`);
    }

    // rotate() applies the phone camera's EXIF orientation so photos aren't sideways
    const normalized = await sharp(Buffer.from(await response.arrayBuffer()))
      .rotate()
      .toBuffer({ resolveWithObject: true });

    const widths = widthsFor(normalized.info.width);
    for (const width of widths) {
      await sharp(normalized.data)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(variantPath(image.id, width));
    }

    next.images[image.id] = {
      width: normalized.info.width,
      height: normalized.info.height,
      widths,
    };
    processed += 1;
  }

  // Remove files for images that were deleted or hidden since the last run
  const keep = new Set(
    Object.entries(next.images).flatMap(([id, entry]) =>
      entry.widths.map((width) => `${id}-${width}.webp`),
    ),
  );
  let removed = 0;
  for (const file of await readdir(OUTPUT_DIR)) {
    if (!keep.has(file)) {
      await rm(path.join(OUTPUT_DIR, file));
      removed += 1;
    }
  }

  await writeFile(MANIFEST_PATH, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `prepare-images: ${images.length} images (${processed} processed, ${reused} reused, ${removed} stale files removed)`,
  );
}

main().catch((error: unknown) => {
  console.error("prepare-images failed:", error);
  process.exit(1);
});
