"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { cardClass, errorClass, inputClass, labelClass, linkClass, successClass } from "@/components/admin/form-styles";
import { ChangeEmailForm } from "@/components/auth/change-email-form";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { useCustomerSession } from "@/components/auth/customer-session";
import { buttonStyles } from "@/components/button-styles";
import { deleteAccount, getProfile, updateProfile } from "@/lib/account";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const phonePattern = /^\+?[0-9 ()-]{7,20}$/;

function ProfileForm({ user }: { user: User }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getProfile(user.id)
      .then((profile) => {
        setFullName(profile.fullName);
        setPhone(profile.phone);
        setLoaded(true);
      })
      .catch(() => setError("Couldn't load your details. Please refresh."));
  }, [user.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const name = fullName.trim();
    const phoneValue = phone.trim();
    if (name.length > 100) return setError("Please keep your name under 100 characters.");
    if (phoneValue && !phonePattern.test(phoneValue)) {
      return setError("Please enter a valid phone number, e.g. +91 98765 43210.");
    }

    setError("");
    setSaving(true);
    try {
      await updateProfile(user.id, { fullName: name, phone: phoneValue });
      setMessage("Your details have been saved.");
    } catch {
      setError("Couldn't save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`${cardClass} flex flex-col gap-5`}>
      <h2 className="text-2xl">Your details</h2>
      <div className="flex flex-col gap-2">
        <label htmlFor="profile-name" className={labelClass}>
          Name
        </label>
        <input
          id="profile-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={!loaded}
          autoComplete="name"
          maxLength={100}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="profile-phone" className={labelClass}>
          Phone <span className="font-normal text-fg-muted">(optional)</span>
        </label>
        <input
          id="profile-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={!loaded}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          maxLength={20}
          className={inputClass}
        />
      </div>

      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}
      {message && (
        <p role="status" className={successClass}>
          {message}
        </p>
      )}

      <button type="submit" disabled={saving || !loaded} className={`${buttonStyles.primary} self-start disabled:opacity-60`}>
        {saving ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}

function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setDeleting(true);
    const failure = await deleteAccount();
    if (failure) {
      setError(failure);
      setDeleting(false);
      return;
    }
    // The account is gone; clear the saved session from this browser and leave
    await getBrowserSupabase().auth.signOut({ scope: "local" });
    window.location.assign("/");
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-badge/40 p-6">
      <h2 className="text-2xl">Delete account</h2>
      <p className="text-sm text-fg-muted">
        This permanently deletes your account, your details, and your saved pieces. It can&apos;t be undone.
      </p>
      <div className="flex flex-col gap-2">
        <label htmlFor="delete-confirm" className={labelClass}>
          Type DELETE to confirm
        </label>
        <input
          id="delete-confirm"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          className={`${inputClass} max-w-xs`}
        />
      </div>
      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={confirmText !== "DELETE" || deleting}
        className="inline-flex min-h-12 items-center self-start rounded-full bg-badge px-7 text-sm font-medium text-on-badge disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete my account"}
      </button>
    </section>
  );
}

export function AccountView() {
  const router = useRouter();
  const session = useCustomerSession();

  useEffect(() => {
    if (session.status === "signed-out") router.replace("/login?next=/account/");
  }, [session.status, router]);

  if (session.status !== "signed-in") {
    return <p className="mx-auto max-w-2xl px-4 py-16 text-fg-muted">Loading…</p>;
  }

  async function signOut() {
    await getBrowserSupabase().auth.signOut();
    router.replace("/");
  }

  const { user } = session;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl">Your account</h1>
          <p className="text-sm text-fg-muted">Signed in as {user.email}</p>
        </div>
        <button type="button" onClick={signOut} className={buttonStyles.secondary}>
          Sign out
        </button>
      </div>

      <ProfileForm user={user} />
      <ChangePasswordForm title="Password" />
      <ChangeEmailForm currentEmail={user.email ?? ""} redirectPath="/account/" />
      <DeleteAccountSection />

      <p className="text-sm text-fg-muted">
        Read how we handle your information in our{" "}
        <Link href="/privacy" className={linkClass}>
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
