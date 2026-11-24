/**
 * Base URL of the Cloudflare Worker (publish endpoint, account deletion, keep-alive cron).
 * Stored in NEXT_PUBLIC_PUBLISH_URL, named when publishing was its only job.
 */
export const WORKER_URL = process.env.NEXT_PUBLIC_PUBLISH_URL;
