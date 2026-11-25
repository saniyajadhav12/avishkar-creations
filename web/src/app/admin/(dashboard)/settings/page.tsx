"use client";

import { useEffect, useState } from "react";
import { cardClass, errorClass } from "@/components/admin/form-styles";
import { ToggleSwitch } from "@/components/admin/toggle-switch";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export default function AdminSettingsPage() {
  const [requireLogin, setRequireLogin] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getBrowserSupabase()
      .from("site_settings")
      .select("require_login_to_message")
      .single()
      .then(({ data, error: loadError }) => {
        if (loadError || !data) setError("Couldn't load settings. Please refresh.");
        else setRequireLogin(data.require_login_to_message === true);
      });
  }, []);

  async function change(value: boolean) {
    setSaving(true);
    setError("");
    setMessage("");
    setRequireLogin(value);
    const { error: saveError } = await getBrowserSupabase()
      .from("site_settings")
      .update({ require_login_to_message: value })
      .eq("id", true);
    setSaving(false);
    if (saveError) {
      setRequireLogin(!value);
      setError("Couldn't save the setting. Please try again.");
      return;
    }
    setMessage("Saved. This applies on the website right away; no need to publish.");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl">Settings</h1>
      <section className={`${cardClass} flex flex-col gap-3`}>
        <h2 className="text-2xl">Messaging</h2>
        <p className="text-sm text-fg-muted">
          When on, customers sign in before tapping &quot;Ask on WhatsApp&quot; on a piece or &quot;Order on
          WhatsApp&quot; in their cart. Turn it off if it seems to put customers off. If the website ever can&apos;t
          check this setting, customers can always message.
        </p>
        {requireLogin === null && !error && <p className="text-sm text-fg-muted">Loading…</p>}
        {requireLogin !== null && (
          <ToggleSwitch
            label="Customers must sign in to message"
            checked={requireLogin}
            onChange={change}
            disabled={saving}
          />
        )}
        {error && (
          <p role="alert" className={errorClass}>
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-fg-muted">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
