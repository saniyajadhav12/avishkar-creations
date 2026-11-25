/**
 * Cart saved in the browser (localStorage), shared by every component through useSyncExternalStore.
 * Changes in one tab update other open tabs too. Saved data is validated, so a corrupted cart just resets.
 */
import { useSyncExternalStore } from "react";
import { z } from "zod";

const STORAGE_KEY = "avishkar-cart";
export const MAX_QUANTITY = 5;

const cartSchema = z.array(
  z.object({ slug: z.string(), quantity: z.number().int().min(1).max(MAX_QUANTITY) }),
);

export type CartItem = z.infer<typeof cartSchema>[number];

const EMPTY: CartItem[] = [];
let cache: CartItem[] | undefined;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? cartSchema.parse(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): CartItem[] {
  cache ??= read();
  return cache;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

function emit() {
  for (const listener of listeners) listener();
}

function write(items: CartItem[]) {
  cache = items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage may be unavailable (e.g. private browsing); the cart still works for this visit
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      cache = read();
      emit();
    }
  }
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function addToCart(slug: string, quantity = 1) {
  const items = getSnapshot();
  const existing = items.find((item) => item.slug === slug);
  write(
    existing
      ? items.map((item) =>
          item.slug === slug ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + quantity) } : item,
        )
      : [...items, { slug, quantity: Math.min(MAX_QUANTITY, quantity) }],
  );
}

export function setQuantity(slug: string, quantity: number) {
  const clamped = Math.max(1, Math.min(MAX_QUANTITY, quantity));
  write(getSnapshot().map((item) => (item.slug === slug ? { ...item, quantity: clamped } : item)));
}

export function removeFromCart(slug: string) {
  write(getSnapshot().filter((item) => item.slug !== slug));
}

export function keepOnly(slugs: Set<string>) {
  write(getSnapshot().filter((item) => slugs.has(item.slug)));
}
