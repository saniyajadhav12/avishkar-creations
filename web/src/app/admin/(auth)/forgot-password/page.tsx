"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { errorClass, inputClass, labelClass, linkClass, successClass } from "@/components/admin/form-styles";
import { buttonStyles } from "@/components/button-styles";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setError("");
    setSending(true);
    const { error: resetError } = await getBrowserSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password/`,
    });
    setSending(false);

    if (resetError) {
      setError(
        resetError.status === 429
          ? "Too many requests. Please wait a minute and try again."
          : "Couldn't send the email right now. Please try again in a minute.",
      );
      return;
    }

    // Same message whether or not the account exists, so this page never reveals which emails have accounts
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl">Check your email</h1>
        <p className={successClass}>
          If an account exists for that email, we&apos;ve sent a link to reset your password. It expires in one hour.
          If you don&apos;t see it, check your spam folder.
        </p>
        <Link href="/admin/login" className={`${linkClass} self-center`}>
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <h1 className="text-3xl">Forgot password</h1>
      <p className="text-sm text-fg-muted">Enter your email and we&apos;ll send you a link to set a new password.</p>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" className={inputClass} />
      </div>

      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}

      <button type="submit" disabled={sending} className={`${buttonStyles.primary} w-full disabled:opacity-60`}>
        {sending ? "Sending…" : "Send reset link"}
      </button>

      <Link href="/admin/login" className={`${linkClass} self-center`}>
        Back to login
      </Link>
    </form>
  );
}
