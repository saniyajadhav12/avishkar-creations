"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { errorClass, inputClass, labelClass, linkClass, successClass } from "@/components/admin/form-styles";
import { PasswordInput } from "@/components/admin/password-input";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { useCustomerSession } from "@/components/auth/customer-session";
import { buttonStyles } from "@/components/button-styles";
import { safeNext } from "@/lib/auth-redirect";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const session = useCustomerSession();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  // Already signed in (including just back from Google)? Continue to where they were going.
  useEffect(() => {
    if (session.status === "signed-in") router.replace(safeNext(next));
  }, [session.status, next, router]);

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
    setUnconfirmedEmail("");
    setResendMessage("");
    setSigningIn(true);
    const { error: signInError } = await getBrowserSupabase().auth.signInWithPassword({ email, password });
    setSigningIn(false);

    if (!signInError) return; // the session change triggers the redirect above
    if (signInError.code === "email_not_confirmed") {
      setUnconfirmedEmail(email);
    } else if (signInError.message === "Invalid login credentials") {
      setError("That email and password don't match. Please try again.");
    } else {
      setError("Couldn't sign in right now. Check your internet connection and try again.");
    }
  }

  async function resendConfirmation() {
    const { error: resendError } = await getBrowserSupabase().auth.resend({
      type: "signup",
      email: unconfirmedEmail,
      options: { emailRedirectTo: `${window.location.origin}${safeNext(next)}` },
    });
    setResendMessage(
      resendError
        ? "Couldn't resend right now. Please wait a minute and try again."
        : "We've sent a new confirmation link. It expires in 1 hour; check your spam folder too.",
    );
  }

  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl">Sign in</h1>
        <p className="text-sm text-fg-muted">Save your favourite pieces and message Kavita about them.</p>
      </div>

      <GoogleButton next={next} />
      <OrDivider />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className={labelClass}>
            Email
          </label>
          <input id="login-email" name="email" type="email" inputMode="email" autoComplete="email" className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="login-password" className={labelClass}>
            Password
          </label>
          <PasswordInput id="login-password" name="password" autoComplete="current-password" />
        </div>

        {error && (
          <p role="alert" className={errorClass}>
            {error}
          </p>
        )}
        {unconfirmedEmail && (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-border p-4 text-sm">
            <p>Please confirm your email first. We sent a link to {unconfirmedEmail} when you signed up.</p>
            <button type="button" onClick={resendConfirmation} className={`${buttonStyles.secondary} self-start`}>
              Resend confirmation email
            </button>
            {resendMessage && <p className={successClass}>{resendMessage}</p>}
          </div>
        )}

        <button type="submit" disabled={signingIn} className={`${buttonStyles.primary} w-full disabled:opacity-60`}>
          {signingIn ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="flex flex-col items-center gap-2 text-sm">
        <Link href="/forgot-password" className={linkClass}>
          Forgot password?
        </Link>
        <p className="text-fg-muted">
          New here?{" "}
          <Link href={`/signup${nextQuery}`} className={linkClass}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
