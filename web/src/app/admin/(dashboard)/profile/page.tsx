"use client";

import { useState, type FormEvent } from "react";
import { useAdminSession } from "@/components/admin/admin-session";
import { cardClass, errorClass, inputClass, labelClass, successClass } from "@/components/admin/form-styles";
import { PasswordInput } from "@/components/admin/password-input";
import { buttonStyles } from "@/components/button-styles";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const MIN_PASSWORD_LENGTH = 8;
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type FormState = { status: "idle" | "saving" | "done"; error: string; message: string };
const idle: FormState = { status: "idle", error: "", message: "" };

function ChangePasswordForm() {
  const [state, setState] = useState<FormState>(idle);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("new-password") ?? "");
    const confirm = String(data.get("confirm-password") ?? "");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setState({ ...idle, error: `Please use at least ${MIN_PASSWORD_LENGTH} characters.` });
      return;
    }
    if (password !== confirm) {
      setState({ ...idle, error: "The two passwords don't match." });
      return;
    }

    setState({ ...idle, status: "saving" });
    const { error } = await getBrowserSupabase().auth.updateUser({ password });
    if (error) {
      setState({
        ...idle,
        error:
          error.code === "same_password"
            ? "Please choose a password different from your current one."
            : "Couldn't update your password. Please try again.",
      });
      return;
    }
    form.reset();
    setState({ ...idle, status: "done", message: "Your password has been changed." });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`${cardClass} flex flex-col gap-5`}>
      <h2 className="text-2xl">Change password</h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="new-password" className={labelClass}>
          New password
        </label>
        <PasswordInput id="new-password" name="new-password" autoComplete="new-password" describedBy="new-password-hint" />
        <p id="new-password-hint" className="text-xs text-fg-muted">
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm-password" className={labelClass}>
          Confirm new password
        </label>
        <PasswordInput id="confirm-password" name="confirm-password" autoComplete="new-password" />
      </div>

      {state.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className={successClass}>
          {state.message}
        </p>
      )}

      <button type="submit" disabled={state.status === "saving"} className={`${buttonStyles.primary} self-start disabled:opacity-60`}>
        {state.status === "saving" ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, setState] = useState<FormState>(idle);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("new-email") ?? "").trim().toLowerCase();

    if (!emailPattern.test(email)) {
      setState({ ...idle, error: "Please enter a valid email address." });
      return;
    }
    if (email === currentEmail.toLowerCase()) {
      setState({ ...idle, error: "That's already your email." });
      return;
    }

    setState({ ...idle, status: "saving" });
    const { error } = await getBrowserSupabase().auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/admin/profile/` },
    );
    if (error) {
      setState({
        ...idle,
        error:
          error.status === 429
            ? "Too many requests. Please wait a minute and try again."
            : "Couldn't start the email change. That email may already be in use.",
      });
      return;
    }
    form.reset();
    setState({
      ...idle,
      status: "done",
      message: `We've sent confirmation links to both ${currentEmail} and ${email}. Your login email changes after you click both links. Check spam folders if you don't see them.`,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`${cardClass} flex flex-col gap-5`}>
      <h2 className="text-2xl">Change email</h2>
      <p className="text-sm text-fg-muted">
        Current email: <span className="text-fg">{currentEmail}</span>
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="new-email" className={labelClass}>
          New email
        </label>
        <input id="new-email" name="new-email" type="email" inputMode="email" autoComplete="email" className={inputClass} />
      </div>

      {state.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className={successClass}>
          {state.message}
        </p>
      )}

      <button type="submit" disabled={state.status === "saving"} className={`${buttonStyles.primary} self-start disabled:opacity-60`}>
        {state.status === "saving" ? "Sending…" : "Change email"}
      </button>
    </form>
  );
}

export default function AdminProfilePage() {
  const { user } = useAdminSession();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl">Profile</h1>
        <p className="text-sm text-fg-muted">Manage how you sign in to the dashboard.</p>
      </div>
      <ChangePasswordForm />
      <ChangeEmailForm currentEmail={user.email ?? ""} />
    </div>
  );
}
