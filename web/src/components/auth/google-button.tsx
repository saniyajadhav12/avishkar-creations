"use client";

import { useState } from "react";
import { buttonStyles } from "@/components/button-styles";
import { safeNext } from "@/lib/auth-redirect";
import { getBrowserSupabase } from "@/lib/supabase/browser";

/** Sends the customer to Google, then back to the page they came from */
export function GoogleButton({ next }: { next: string | null }) {
  const [error, setError] = useState("");

  async function signIn() {
    setError("");
    const { error: oauthError } = await getBrowserSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${safeNext(next)}` },
    });
    if (oauthError) setError("Couldn't open Google sign-in. Please try again.");
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={signIn} className={`${buttonStyles.secondary} w-full`}>
        Continue with Google
      </button>
      {error && (
        <p role="alert" className="text-sm text-badge">
          {error}
        </p>
      )}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs tracking-[0.2em] text-fg-muted uppercase">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
