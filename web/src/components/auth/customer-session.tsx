"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export type CustomerSession =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: User };

const CustomerSessionContext = createContext<CustomerSession>({ status: "loading" });

export function useCustomerSession(): CustomerSession {
  return useContext(CustomerSessionContext);
}

/**
 * Shared login state for the storefront. Creating the Supabase client here also completes
 * Google sign-in and email-confirmation links, whose tokens arrive in the URL of the page
 * the customer lands on. The saved session is read from the browser, so this works offline too.
 */
export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CustomerSession>({ status: "loading" });

  useEffect(() => {
    const supabase = getBrowserSupabase();

    supabase.auth
      .getSession()
      .then(({ data }) =>
        setSession(data.session ? { status: "signed-in", user: data.session.user } : { status: "signed-out" }),
      )
      .catch(() => setSession({ status: "signed-out" }));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, current) => {
      setSession(current ? { status: "signed-in", user: current.user } : { status: "signed-out" });
    });

    return () => subscription.unsubscribe();
  }, []);

  return <CustomerSessionContext.Provider value={session}>{children}</CustomerSessionContext.Provider>;
}
