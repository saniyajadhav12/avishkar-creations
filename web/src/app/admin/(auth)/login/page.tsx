"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { checkIsAdmin } from "@/components/admin/admin-session";
import { errorClass, inputClass, labelClass, linkClass } from "@/components/admin/form-styles";
import { PasswordInput } from "@/components/admin/password-input";
import { buttonStyles } from "@/components/button-styles";
import { getBrowserSupabase } from "@/lib/supabase/browser";

/** Only allow redirects back into the admin area, never to another site */
function safeNextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  // Already signed in as an admin? Go straight to the dashboard.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && (await checkIsAdmin(supabase).catch(() => false))) router.replace(safeNextPath());
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setSigningIn(true);
    const supabase = getBrowserSupabase();

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "That email and password don't match. Please try again."
          : "Couldn't sign in right now. Check your internet connection and try again.",
      );
      setSigningIn(false);
      return;
    }

    const isAdmin = await checkIsAdmin(supabase).catch(() => false);
    if (!isAdmin) {
      await supabase.auth.signOut();
      setError("This account doesn't have admin access.");
      setSigningIn(false);
      return;
    }

    router.replace(safeNextPath());
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <h1 className="text-3xl">Admin login</h1>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" className={inputClass} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <PasswordInput id="password" name="password" autoComplete="current-password" />
      </div>

      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}

      <button type="submit" disabled={signingIn} className={`${buttonStyles.primary} w-full disabled:opacity-60`}>
        {signingIn ? "Signing in…" : "Sign in"}
      </button>

      <Link href="/admin/forgot-password" className={`${linkClass} self-center`}>
        Forgot password?
      </Link>
    </form>
  );
}
