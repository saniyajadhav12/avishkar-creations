import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

let browserClient: SupabaseClient | undefined;

/**
 * Shared client for the admin dashboard and contact form, running in the browser.
 * Created once and reused, so the whole app shares one login session.
 */
export function getBrowserSupabase(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("getBrowserSupabase() must only be called in the browser.");
  }

  if (!browserClient) {
    const { url, publishableKey } = getSupabaseEnv();
    browserClient = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
