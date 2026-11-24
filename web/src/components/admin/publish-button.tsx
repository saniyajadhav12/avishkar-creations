"use client";

import { useEffect, useState } from "react";
import { cardClass, errorClass, successClass } from "@/components/admin/form-styles";
import { buttonStyles } from "@/components/button-styles";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const PUBLISH_URL = process.env.NEXT_PUBLIC_PUBLISH_URL;

// After a successful publish, the button rests briefly so repeated taps don't start several builds
const COOLDOWN_MS = 60_000;

type State =
  | { status: "idle" }
  | { status: "publishing" }
  | { status: "started"; at: Date }
  | { status: "error"; message: string };

/**
 * Sends the admin's login token to the publish Worker, which checks it with Supabase and then
 * triggers a Cloudflare Pages rebuild. The deploy hook itself stays secret inside the Worker.
 */
export function PublishButton() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [coolingDown, setCoolingDown] = useState(false);

  useEffect(() => {
    if (!coolingDown) return;
    const timer = setTimeout(() => setCoolingDown(false), COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [coolingDown]);

  async function publish() {
    if (!PUBLISH_URL) return;
    setState({ status: "publishing" });

    const {
      data: { session },
    } = await getBrowserSupabase().auth.getSession();
    if (!session) {
      setState({ status: "error", message: "Please sign in again." });
      return;
    }

    try {
      const response = await fetch(`${PUBLISH_URL}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.status === 202) {
        setState({ status: "started", at: new Date() });
        setCoolingDown(true);
        return;
      }

      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setState({ status: "error", message: body?.error ?? "Couldn't start publishing. Please try again." });
    } catch {
      setState({
        status: "error",
        message: "Couldn't reach the publishing service. Check your internet connection and try again.",
      });
    }
  }

  if (!PUBLISH_URL) {
    return (
      <section className={cardClass}>
        <p className={errorClass}>Publishing isn&apos;t set up yet (NEXT_PUBLIC_PUBLISH_URL is missing).</p>
      </section>
    );
  }

  return (
    <section className={`${cardClass} flex flex-col gap-4`}>
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl">Publish changes</h2>
        <p className="text-sm text-fg-muted">
          After adding or editing products, tap Publish to update the live website.
        </p>
      </div>

      {state.status === "started" && (
        <p role="status" className={successClass}>
          Build started at {state.at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. Your changes
          will be live in about 2 minutes.
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className={errorClass}>
          {state.message}
        </p>
      )}

      <button
        type="button"
        onClick={publish}
        disabled={state.status === "publishing" || coolingDown}
        className={`${buttonStyles.primary} self-start disabled:opacity-60`}
      >
        {state.status === "publishing" ? "Publishing…" : coolingDown ? "Published" : "Publish changes"}
      </button>
    </section>
  );
}
