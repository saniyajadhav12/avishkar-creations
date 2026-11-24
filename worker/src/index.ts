/**
 * Avishkar Creations Worker
 * - POST /publish: lets a signed-in admin trigger a Cloudflare Pages rebuild ("Publish changes").
 *   The deploy hook URL is a Worker secret, so it never reaches the browser.
 * - Cron: a tiny Supabase query twice a day so the free project isn't paused for inactivity.
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  /** Comma-separated exact origins allowed to call /publish */
  ALLOWED_ORIGINS: string;
  /** Secret: Cloudflare Pages deploy hook URL */
  DEPLOY_HOOK_URL: string;
}

// Cloudflare Pages preview deployments, e.g. https://feat-x.avishkar-creations.pages.dev
const PREVIEW_HOST_SUFFIX = ".avishkar-creations.pages.dev";

function isAllowedOrigin(origin: string | null, env: Env): origin is string {
  if (!origin) return false;
  const exact = env.ALLOWED_ORIGINS.split(",").map((value) => value.trim());
  if (exact.includes(origin)) return true;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname.endsWith(PREVIEW_HOST_SUFFIX);
  } catch {
    return false;
  }
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * Calls is_admin() in Supabase *as the user*. Supabase verifies the token's signature and expiry,
 * and the anonymous role can't run is_admin() at all, so missing or fake tokens fail here.
 */
async function isAdmin(token: string, env: Env): Promise<boolean> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!response.ok) return false;
  return (await response.json()) === true;
}

async function handlePublish(request: Request, env: Env, origin: string): Promise<Response> {
  const cors = corsHeaders(origin);

  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return json({ error: "Please sign in again." }, 401, cors);

  if (!(await isAdmin(token, env))) {
    return json({ error: "This account can't publish changes." }, 403, cors);
  }

  const hook = await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });
  if (!hook.ok) {
    console.error(`Deploy hook failed with HTTP ${hook.status}`);
    return json({ error: "Couldn't start publishing. Please try again in a minute." }, 502, cors);
  }

  return json({ status: "building" }, 202, cors);
}

async function keepAlive(env: Env): Promise<void> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/categories?select=id&limit=1`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY },
  });
  if (!response.ok) throw new Error(`Keep-alive query failed with HTTP ${response.status}`);
  console.log("Keep-alive: Supabase responded OK");
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/publish") return json({ error: "Not found" }, 404);

    const origin = request.headers.get("Origin");
    if (!isAllowedOrigin(origin, env)) return json({ error: "Origin not allowed" }, 403);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders(origin));

    return handlePublish(request, env, origin);
  },

  async scheduled(_controller, env, ctx): Promise<void> {
    ctx.waitUntil(keepAlive(env));
  },
} satisfies ExportedHandler<Env>;
