// @ts-check
/**
 * Creates responsive WebP sizes and a 1200×630 JPEG link preview from one photo.
 * Same rules as web/scripts/prepare-images.mts, so the site looks identical either way.
 */
import sharp from "sharp";

export const TARGET_WIDTHS = [400, 800, 1200];
const WEBP_QUALITY = 78;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/**
 * Target widths smaller than the original, plus the original width capped at the largest target.
 * @param {number} originalWidth
 * @returns {number[]}
 */
export function widthsFor(originalWidth) {
  const largest = Math.max(...TARGET_WIDTHS);
  const widths = TARGET_WIDTHS.filter((width) => width < originalWidth);
  widths.push(Math.min(originalWidth, largest));
  return [...new Set(widths)].sort((a, b) => a - b);
}

/**
 * @typedef {{ name: string, contentType: string, data: Buffer }} VariantFile
 * @typedef {{ width: number, height: number, widths: number[], files: VariantFile[] }} ProcessedImage
 */

/**
 * @param {Buffer} input original photo (any format sharp can read)
 * @returns {Promise<ProcessedImage>}
 */
export async function processImage(input) {
  // rotate() applies the phone camera's EXIF orientation so photos aren't sideways
  const normalized = await sharp(input).rotate().toBuffer({ resolveWithObject: true });
  const { width, height } = normalized.info;
  const widths = widthsFor(width);

  /** @type {VariantFile[]} */
  const files = [];
  for (const target of widths) {
    const data = await sharp(normalized.data)
      .resize({ width: target, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    files.push({ name: `${target}.webp`, contentType: "image/webp", data });
  }

  // "attention" keeps the most detailed part of the photo (usually the jewellery) in the crop
  const og = await sharp(normalized.data)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  files.push({ name: "og.jpg", contentType: "image/jpeg", data: og });

  return { width, height, widths, files };
}
