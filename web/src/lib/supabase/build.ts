import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/**
 * Client for fetching public data while `next build` generates static pages.
 * No visitor exists at build time, so it never stores or refreshes a session.
 */
export function createBuildSupabase(): SupabaseClient {
  const { url, publishableKey } = getSupabaseEnv();

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
