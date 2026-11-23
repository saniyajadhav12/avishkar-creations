"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { buttonStyles } from "@/components/button-styles";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type AdminSession = { user: User; signOut: () => Promise<void> };

const AdminSessionContext = createContext<AdminSession | null>(null);

export function useAdminSession(): AdminSession {
  const session = useContext(AdminSessionContext);
  if (!session) throw new Error("useAdminSession must be used inside AdminSessionProvider");
  return session;
}

/**
 * Asks the database whether the logged-in user is an admin. The check runs in Postgres with the
 * user's token, so a tampered browser session can't pass it. (RLS enforces the same rule on every write.)
 */
export async function checkIsAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  return data === true;
}

async function signOut() {
  await getBrowserSupabase().auth.signOut();
}

type GuardState =
  | { status: "checking" }
  | { status: "admin"; user: User }
  | { status: "not-admin"; email: string }
  | { status: "error" };

function CenteredMessage({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">{children}</div>;
}

/**
 * Guards admin pages: logged-out visitors go to the login page, non-admin accounts see a message,
 * and admins get the page. This guard is for a good experience; real security is RLS in the database.
 */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>({ status: "checking" });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let cancelled = false;

    async function verify() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        router.replace(`/admin/login?next=${next}`);
        return;
      }

      try {
        const isAdmin = await checkIsAdmin(supabase);
        if (cancelled) return;
        setState(isAdmin ? { status: "admin", user: session.user } : { status: "not-admin", email: session.user.email ?? "" });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }

    void verify();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") router.replace("/admin/login");
      // Keep the shown email current after a profile change
      if (event === "USER_UPDATED" && session) {
        setState((current) => (current.status === "admin" ? { status: "admin", user: session.user } : current));
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  if (state.status === "checking") {
    return (
      <CenteredMessage>
        <p className="text-fg-muted">Checking your login…</p>
      </CenteredMessage>
    );
  }

  if (state.status === "error") {
    return (
      <CenteredMessage>
        <p className="max-w-sm text-fg-muted">
          Couldn&apos;t reach the server. Check your internet connection and try again.
        </p>
        <button type="button" onClick={() => window.location.reload()} className={buttonStyles.primary}>
          Try again
        </button>
      </CenteredMessage>
    );
  }

  if (state.status === "not-admin") {
    return (
      <CenteredMessage>
        <p className="max-w-sm text-fg-muted">
          {state.email ? `${state.email} doesn't` : "This account doesn't"} have admin access.
        </p>
        <button type="button" onClick={signOut} className={buttonStyles.secondary}>
          Sign out
        </button>
      </CenteredMessage>
    );
  }

  return (
    <AdminSessionContext.Provider value={{ user: state.user, signOut }}>{children}</AdminSessionContext.Provider>
  );
}
