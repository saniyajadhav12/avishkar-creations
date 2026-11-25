import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

let requireLoginPromise: Promise<boolean> | undefined;

/** Fails open: if the setting can't be loaded, customers can still message and order */
async function fetchRequireLogin(): Promise<boolean> {
  try {
    const { data, error } = await getBrowserSupabase()
      .from("site_settings")
      .select("require_login_to_message")
      .maybeSingle();
    return !error && data?.require_login_to_message === true;
  } catch {
    return false;
  }
}

/** Whether customers must sign in before messaging about a piece or ordering (loaded once per visit) */
export function useLoginRequiredForMessages(): boolean {
  const [required, setRequired] = useState(false);
  useEffect(() => {
    let active = true;
    requireLoginPromise ??= fetchRequireLogin();
    requireLoginPromise.then((value) => {
      if (active) setRequired(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return required;
}
