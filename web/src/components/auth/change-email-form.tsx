"use client";

import { useState, type FormEvent } from "react";
import { cardClass, errorClass, inputClass, labelClass, successClass } from "@/components/admin/form-styles";
import { buttonStyles } from "@/components/button-styles";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type FormState = { saving: boolean; error: string; message: string };
const idle: FormState = { saving: false, error: "", message: "" };

type ChangeEmailFormProps = {
  currentEmail: string;
  /** Page the confirmation links return to, e.g. "/account/" */
  redirectPath: string;
};

/** Shared by the customer account page and the admin profile. Supabase confirms the change from both addresses. */
export function ChangeEmailForm({ currentEmail, redirectPath }: ChangeEmailFormProps) {
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

    setState({ ...idle, saving: true });
    const { error } = await getBrowserSupabase().auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}${redirectPath}` },
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
      message: `We've sent confirmation links to both ${currentEmail} and ${email}. Your email changes after you click both links (they expire in 1 hour). Check spam folders if you don't see them.`,
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

      <button type="submit" disabled={state.saving} className={`${buttonStyles.primary} self-start disabled:opacity-60`}>
        {state.saving ? "Sending…" : "Change email"}
      </button>
    </form>
  );
}
