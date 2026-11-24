/** Customer account data: profile (name, phone) and account deletion */
import { z } from "zod";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { WORKER_URL } from "@/lib/worker";

const profileSchema = z.object({ full_name: z.string(), phone: z.string().nullable() });

export type Profile = { fullName: string; phone: string };

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await getBrowserSupabase()
    .from("profiles")
    .select("full_name, phone")
    .eq("id", userId)
    .single();
  if (error) throw error;
  const row = profileSchema.parse(data);
  return { fullName: row.full_name, phone: row.phone ?? "" };
}

export async function updateProfile(userId: string, profile: Profile): Promise<void> {
  const { error } = await getBrowserSupabase()
    .from("profiles")
    .update({ full_name: profile.fullName, phone: profile.phone || null })
    .eq("id", userId);
  if (error) throw error;
}

/**
 * Deletes the signed-in customer's account through the Worker, which verifies the login and
 * refuses admin accounts. Returns an error message, or null on success.
 */
export async function deleteAccount(): Promise<string | null> {
  if (!WORKER_URL) return "Account deletion isn't set up yet.";
  const {
    data: { session },
  } = await getBrowserSupabase().auth.getSession();
  if (!session) return "Please sign in again.";

  try {
    const response = await fetch(`${WORKER_URL}/account`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (response.ok) return null;
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    return body?.error ?? "Couldn't delete your account. Please try again.";
  } catch {
    return "Couldn't reach the server. Check your internet connection and try again.";
  }
}
