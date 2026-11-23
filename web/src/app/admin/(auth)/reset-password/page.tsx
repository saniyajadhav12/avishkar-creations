"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { errorClass, labelClass, successClass } from "@/components/admin/form-styles";
import { PasswordInput } from "@/components/admin/password-input";
import { buttonStyles } from "@/components/button-styles";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const MIN_PASSWORD_LENGTH = 8;

type Status = "checking" | "ready" | "invalid" | "saving" | "done";

/**
 * Reads the email link's details from the URL. Supabase reset links are single-use and time-limited:
 * a used or expired link comes back with an error_code instead of a recovery token.
 */
function readRecoveryLink(): { isRecoveryLink: boolean; hasError: boolean } {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);
  return {
    isRecoveryLink: hash.get("type") === "recovery" && hash.has("access_token"),
    hasError: hash.has("error_code") || query.has("error_code"),
  };
}

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    // Read the link before supabase-js processes it, because the library clears it from the address bar
    const link = readRecoveryLink();
    getBrowserSupabase()
      .auth.getSession()
      .then(({ data: { session } }) => {
        // Only a fresh, unused recovery link shows the form. Being signed in from an earlier click doesn't count.
        setStatus(link.isRecoveryLink && !link.hasError && session ? "ready" : "invalid");
      });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Please use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setError("");
    setStatus("saving");
    const { error: updateError } = await getBrowserSupabase().auth.updateUser({ password });
    if (updateError) {
      setError(
        updateError.code === "same_password"
          ? "Please choose a password different from your current one."
          : "Couldn't update your password. Please try again.",
      );
      setStatus("ready");
      return;
    }
    setStatus("done");
  }

  if (status === "checking") {
    return <p className="text-fg-muted">Checking your link…</p>;
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl">Link expired</h1>
        <p className="text-sm text-fg-muted">
          This reset link has already been used or has expired. Each link works once and expires one hour after it&apos;s sent.
        </p>
        <Link href="/admin/forgot-password" className={buttonStyles.primary}>
          Send a new link
        </Link>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl">Password updated</h1>
        <p className={successClass}>Your new password is saved, and you&apos;re signed in. This reset link can&apos;t be used again.</p>
        <Link href="/admin" className={buttonStyles.primary}>
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <h1 className="text-3xl">Set a new password</h1>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={labelClass}>
          New password
        </label>
        <PasswordInput id="password" name="password" autoComplete="new-password" describedBy="password-hint" />
        <p id="password-hint" className="text-xs text-fg-muted">
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className={labelClass}>
          Confirm new password
        </label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" />
      </div>

      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}

      <button type="submit" disabled={status === "saving"} className={`${buttonStyles.primary} w-full disabled:opacity-60`}>
        {status === "saving" ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
