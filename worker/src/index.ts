/**
 * Avishkar Creations Worker
 * - POST /publish: lets a signed-in admin trigger a Cloudflare Pages rebuild ("Publish changes").
 * - DELETE /account: lets a signed-in customer delete their own account (admin accounts excluded).
 * - Cron: a tiny Supabase query twice a day so the free project isn't paused for inactivity.
 * The deploy hook URL and Supabase secret key are Worker secrets and never reach the browser.
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  /** Comma-separated exact origins allowed to call the API */
  ALLOWED_ORIGINS: string;
  /** Secret: Cloudflare Pages deploy hook URL */
  DEPLOY_HOOK_URL: string;
  /** Secret: Supabase secret key, used only to delete a verified customer's account */
  SUPABASE_SECRET_KEY: string;
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
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
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

function bearerToken(request: Request): string | undefined {
  return request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
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

/** Asks Supabase Auth who the token belongs to; null if the token is invalid or expired */
async function getUserId(token: string, env: Env): Promise<string | null> {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: unknown };
  return typeof user.id === "string" ? user.id : null;
}

async function handlePublish(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const token = bearerToken(request);
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

/**
 * Deletes the signed-in customer's own account. Their profile and wishlist are removed by the
 * database (on delete cascade). Admin accounts are refused, so they can't be deleted by accident.
 */
async function handleDeleteAccount(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const token = bearerToken(request);
  if (!token) return json({ error: "Please sign in again." }, 401, cors);

  const userId = await getUserId(token, env);
  if (!userId) return json({ error: "Please sign in again." }, 401, cors);

  if (await isAdmin(token, env)) {
    return json({ error: "Admin accounts can't be deleted here." }, 403, cors);
  }

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` },
  });
  if (!response.ok) {
    console.error(`Account deletion failed with HTTP ${response.status}`);
    return json({ error: "Couldn't delete your account right now. Please try again." }, 502, cors);
  }

  return json({ status: "deleted" }, 200, cors);
}

async function keepAlive(env: Env): Promise<void> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/categories?select=id&limit=1`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY },
  });
  if (!response.ok) throw new Error(`Keep-alive query failed with HTTP ${response.status}`);
  console.log("Keep-alive: Supabase responded OK");
}

const routes: Record<string, { method: string; handler: typeof handlePublish }> = {
  "/publish": { method: "POST", handler: handlePublish },
  "/account": { method: "DELETE", handler: handleDeleteAccount },
};

export default {
  async fetch(request, env): Promise<Response> {
    const route = routes[new URL(request.url).pathname];
    if (!route) return json({ error: "Not found" }, 404);

    const origin = request.headers.get("Origin");
    if (!isAllowedOrigin(origin, env)) return json({ error: "Origin not allowed" }, 403);
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== route.method) return json({ error: "Method not allowed" }, 405, cors);

    return route.handler(request, env, cors);
  },

  async scheduled(_controller, env, ctx): Promise<void> {
    ctx.waitUntil(keepAlive(env));
  },
} satisfies ExportedHandler<Env>;
