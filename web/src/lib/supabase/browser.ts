import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

let browserClient: SupabaseClient | undefined;

/**
 * Shared client for the admin dashboard, accounts, and contact form, running in the browser.
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
        // Implicit flow lets email links (password reset, email change) work in any browser,
        // e.g. requested on a laptop and opened on a phone. PKCE would require the same browser.
        flowType: "implicit",
      },
    });
  }

  return browserClient;
}
