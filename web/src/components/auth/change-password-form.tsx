"use client";

import { useState, type FormEvent } from "react";
import { cardClass, errorClass, labelClass, successClass } from "@/components/admin/form-styles";
import { PasswordInput } from "@/components/admin/password-input";
import { buttonStyles } from "@/components/button-styles";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const MIN_PASSWORD_LENGTH = 8;

type FormState = { saving: boolean; error: string; message: string };
const idle: FormState = { saving: false, error: "", message: "" };

/** Shared by the customer account page and the admin profile. For Google accounts, this adds a password. */
export function ChangePasswordForm({ title = "Change password" }: { title?: string }) {
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

    setState({ ...idle, saving: true });
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
    setState({ ...idle, message: "Your password has been saved." });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`${cardClass} flex flex-col gap-5`}>
      <h2 className="text-2xl">{title}</h2>

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

      <button type="submit" disabled={state.saving} className={`${buttonStyles.primary} self-start disabled:opacity-60`}>
        {state.saving ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
