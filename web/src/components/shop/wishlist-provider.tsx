"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useCustomerSession } from "@/components/auth/customer-session";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type WishlistContextValue = {
  savedIds: ReadonlySet<string>;
  /** True once the signed-in customer's wishlist has loaded */
  ready: boolean;
  error: string;
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
};

const EMPTY: ReadonlySet<string> = new Set();
const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist(): WishlistContextValue {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used inside WishlistProvider");
  return value;
}

/**
 * Wishlist saved to the customer's account (RLS limits each customer to their own rows).
 * Hearts update instantly, then save; if saving fails, the change is undone with a message.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const session = useCustomerSession();
  const router = useRouter();
  const pathname = usePathname();
  const userId = session.status === "signed-in" ? session.user.id : null;

  // Stored together with the user it belongs to, so a sign-out or account switch never shows stale hearts
  const [state, setState] = useState<{ userId: string; ids: Set<string> } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getBrowserSupabase()
      .from("wishlist_items")
      .select("product_id")
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError || !data) {
          setError("Couldn't load your wishlist. Please refresh.");
          return;
        }
        setState({ userId, ids: new Set(data.map((row: { product_id: string }) => row.product_id)) });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const savedIds = state && state.userId === userId ? state.ids : EMPTY;
  const ready = Boolean(userId && state?.userId === userId);

  const update = useCallback(
    async (productId: string, save: boolean) => {
      if (!userId) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setError("");
      const apply = (shouldSave: boolean) =>
        setState((current) => {
          const ids = new Set(current && current.userId === userId ? current.ids : []);
          if (shouldSave) ids.add(productId);
          else ids.delete(productId);
          return { userId, ids };
        });

      apply(save);
      const table = getBrowserSupabase().from("wishlist_items");
      const { error: saveError } = save
        ? await table.upsert(
            { user_id: userId, product_id: productId },
            { onConflict: "user_id,product_id", ignoreDuplicates: true },
          )
        : await table.delete().eq("user_id", userId).eq("product_id", productId);

      if (saveError) {
        apply(!save);
        setError("Couldn't update your wishlist. Please try again.");
      }
    },
    [userId, router, pathname],
  );

  const value: WishlistContextValue = {
    savedIds,
    ready,
    error,
    toggle: (productId) => void update(productId, !savedIds.has(productId)),
    remove: (productId) => void update(productId, false),
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
