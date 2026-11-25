/**
 * Runs before `next build` and `next dev`.
 * - Downloads product photos from Supabase Storage and creates responsive WebP sizes with sharp,
 *   plus a 1200×630 JPEG per photo for link previews (WhatsApp previews are most reliable with JPEG).
 * - Writes a manifest of image dimensions.
 * - Generates the site's default link-preview image from the logo.
 * The output is baked into the static site, so images never depend on Supabase being awake.
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const BUCKET = "product-images";
const TARGET_WIDTHS = [400, 800, 1200];
const WEBP_QUALITY = 78;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const PUBLIC_DIR = path.join(process.cwd(), "public");
const OUTPUT_DIR = path.join(PUBLIC_DIR, "product-images");
const MANIFEST_DIR = path.join(process.cwd(), ".generated");
const MANIFEST_PATH = path.join(MANIFEST_DIR, "image-manifest.json");

type ManifestEntry = { width: number; height: number; widths: number[] };
type Manifest = { images: Record<string, ManifestEntry> };

function variantPath(imageId: string, width: number): string {
  return path.join(OUTPUT_DIR, `${imageId}-${width}.webp`);
}

function ogPath(imageId: string): string {
  return path.join(OUTPUT_DIR, `${imageId}-og.jpg`);
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

/** Default link preview: the logo centered on ivory, with a thin gold line and an emerald band */
async function writeDefaultOgImage(): Promise<void> {
  const logo = await sharp(path.join(PUBLIC_DIR, "brand", "avishkar-logo-large.webp"))
    .resize({ width: 900 })
    .toBuffer();
  const decoration = Buffer.from(
    `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect x="520" y="500" width="160" height="2" fill="#b8893b"/>
      <rect x="0" y="${OG_HEIGHT - 24}" width="${OG_WIDTH}" height="24" fill="#1f4d3a"/>
    </svg>`,
  );

  await sharp({ create: { width: OG_WIDTH, height: OG_HEIGHT, channels: 3, background: "#f7f1e8" } })
    .composite([
      { input: logo, gravity: "center" },
      { input: decoration, top: 0, left: 0 },
    ])
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(PUBLIC_DIR, "og-image.jpg"));
}

async function main(): Promise<void> {
  await writeDefaultOgImage();

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
    const cachedFilesExist =
      cached &&
      cached.widths.every((width) => existsSync(variantPath(image.id, width))) &&
      existsSync(ogPath(image.id));
    if (cached && cachedFilesExist) {
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

    // "attention" keeps the most detailed part of the photo (usually the jewellery) in the crop
    await sharp(normalized.data)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: sharp.strategy.attention })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(ogPath(image.id));

    next.images[image.id] = {
      width: normalized.info.width,
      height: normalized.info.height,
      widths,
    };
    processed += 1;
  }

  // Remove files for images that were deleted or hidden since the last run
  const keep = new Set(
    Object.entries(next.images).flatMap(([id, entry]) => [
      ...entry.widths.map((width) => `${id}-${width}.webp`),
      `${id}-og.jpg`,
    ]),
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
    `prepare-images: ${images.length} images (${processed} processed, ${reused} reused, ${removed} stale files removed) + default preview image`,
  );
}

main().catch((error: unknown) => {
  console.error("prepare-images failed:", error);
  process.exit(1);
});
