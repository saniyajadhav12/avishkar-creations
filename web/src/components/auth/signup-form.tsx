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

const MIN_PASSWORD_LENGTH = 8;
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function SignupForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const session = useCustomerSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (session.status === "signed-in") router.replace(safeNext(next));
  }, [session.status, next, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fullName = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");

    if (!fullName) return setError("Please enter your name.");
    if (!emailPattern.test(email)) return setError("Please enter a valid email address.");
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Please use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (password !== confirm) return setError("The two passwords don't match.");

    setError("");
    setSaving(true);
    const { error: signUpError } = await getBrowserSupabase().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.slice(0, 100) },
        emailRedirectTo: `${window.location.origin}${safeNext(next)}`,
      },
    });
    setSaving(false);

    if (signUpError) {
      setError(
        signUpError.status === 429
          ? "Too many attempts. Please wait a minute and try again."
          : signUpError.code === "weak_password"
            ? "Please choose a stronger password."
            : "Couldn't create your account right now. Please try again.",
      );
      return;
    }
    // Shown even if the email already has an account: Supabase doesn't reveal which emails are registered
    setSentTo(email);
  }

  async function resend() {
    const { error: resendError } = await getBrowserSupabase().auth.resend({
      type: "signup",
      email: sentTo,
      options: { emailRedirectTo: `${window.location.origin}${safeNext(next)}` },
    });
    setResendMessage(resendError ? "Couldn't resend right now. Please wait a minute and try again." : "Sent again.");
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl">Check your email</h1>
        <p className={successClass}>
          We&apos;ve sent a confirmation link to <strong>{sentTo}</strong>. Click it to finish creating your account.
          The link expires in 1 hour. If you don&apos;t see the email, check your spam folder.
        </p>
        <button type="button" onClick={resend} className={`${buttonStyles.secondary} self-start`}>
          Resend the email
        </button>
        {resendMessage && <p className="text-sm text-fg-muted">{resendMessage}</p>}
      </div>
    );
  }

  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl">Create an account</h1>
        <p className="text-sm text-fg-muted">Save your favourite pieces and message Kavita about them.</p>
      </div>

      <GoogleButton next={next} />
      <OrDivider />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="signup-name" className={labelClass}>
            Your name
          </label>
          <input id="signup-name" name="name" autoComplete="name" maxLength={100} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="signup-email" className={labelClass}>
            Email
          </label>
          <input id="signup-email" name="email" type="email" inputMode="email" autoComplete="email" className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="signup-password" className={labelClass}>
            Password
          </label>
          <PasswordInput id="signup-password" name="password" autoComplete="new-password" describedBy="signup-password-hint" />
          <p id="signup-password-hint" className="text-xs text-fg-muted">
            At least {MIN_PASSWORD_LENGTH} characters.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="signup-confirm" className={labelClass}>
            Confirm password
          </label>
          <PasswordInput id="signup-confirm" name="confirm" autoComplete="new-password" />
        </div>

        {error && (
          <p role="alert" className={errorClass}>
            {error}
          </p>
        )}

        <button type="submit" disabled={saving} className={`${buttonStyles.primary} w-full disabled:opacity-60`}>
          {saving ? "Creating account…" : "Create account"}
        </button>
        <p className="text-xs text-fg-muted">
          By creating an account, you agree to our{" "}
          <Link href="/privacy" className={linkClass}>
            privacy policy
          </Link>
          .
        </p>
      </form>

      <p className="text-center text-sm text-fg-muted">
        Already have an account?{" "}
        <Link href={`/login${nextQuery}`} className={linkClass}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
