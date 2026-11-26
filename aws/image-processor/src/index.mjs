// @ts-check
/**
 * Avishkar Creations image processor (AWS Lambda behind a Function URL).
 *
 * POST { "imageId": "<uuid>" } with "Authorization: Bearer <admin's Supabase token>".
 * Verifies the caller is an admin, downloads the original photo, creates the WebP sizes and the
 * link-preview JPEG, and uploads them to product-images/variants/<imageId>/.
 *
 * No secrets live in AWS: every Supabase call uses the admin's own token, so the Lambda can never
 * do more than the admin could. CORS is handled by the Function URL configuration (template.yaml).
 */
import { processImage } from "./process-image.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
const BUCKET = "product-images";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @param {number} statusCode
 * @param {unknown} body
 */
function json(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

/**
 * Calls Supabase as the admin (their token, plus the public key Supabase requires).
 * @param {string} path
 * @param {string} token
 * @param {RequestInit} [init]
 */
function supabase(path, token, init = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
}

/**
 * Supabase verifies the token's signature and expiry; the anonymous role can't run is_admin() at all.
 * @param {string} token
 */
async function isAdmin(token) {
  const response = await supabase("/rest/v1/rpc/is_admin", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  return response.ok && (await response.json()) === true;
}

/**
 * @param {string} imageId
 * @param {string} token
 * @returns {Promise<string | null>} the original photo's storage path
 */
async function findStoragePath(imageId, token) {
  const response = await supabase(`/rest/v1/product_images?id=eq.${imageId}&select=storage_path`, token);
  if (!response.ok) throw new Error(`Image lookup failed with HTTP ${response.status}`);
  const rows = /** @type {{ storage_path: string }[]} */ (await response.json());
  return rows[0]?.storage_path ?? null;
}

/** @param {import("aws-lambda").LambdaFunctionURLEvent} event */
export async function handler(event) {
  if (event.requestContext.http.method !== "POST") return json(405, { error: "Method not allowed" });

  // Function URLs lower-case header names
  const token = event.headers?.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return json(401, { error: "Please sign in again." });

  /** @type {unknown} */
  let body;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString("utf8") : event.body;
    body = JSON.parse(raw ?? "{}");
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }
  const imageId =
    typeof body === "object" && body !== null && "imageId" in body && typeof body.imageId === "string"
      ? body.imageId
      : "";
  if (!UUID_PATTERN.test(imageId)) return json(400, { error: "A valid imageId is required." });

  try {
    if (!(await isAdmin(token))) return json(403, { error: "This account can't process images." });

    const storagePath = await findStoragePath(imageId, token);
    if (!storagePath) return json(404, { error: "Image not found." });

    const original = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath.split("/").map(encodeURIComponent).join("/")}`,
    );
    if (!original.ok) throw new Error(`Downloading the original failed with HTTP ${original.status}`);

    const processed = await processImage(Buffer.from(await original.arrayBuffer()));
    const prefix = `variants/${imageId}`;

    for (const file of processed.files) {
      const upload = await supabase(`/storage/v1/object/${BUCKET}/${prefix}/${file.name}`, token, {
        method: "POST",
        headers: { "Content-Type": file.contentType, "x-upsert": "true", "cache-control": "31536000" },
        body: file.data,
      });
      if (!upload.ok) throw new Error(`Uploading ${file.name} failed with HTTP ${upload.status}`);
    }

    return json(200, {
      imageId,
      variants: { prefix, width: processed.width, height: processed.height, widths: processed.widths, og: "og.jpg" },
    });
  } catch (error) {
    console.error("Image processing failed:", error);
    return json(502, { error: "Couldn't process this image. Please try again." });
  }
}
