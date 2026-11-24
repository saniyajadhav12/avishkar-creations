import type { ReactNode } from "react";
import { cardClass } from "@/components/admin/form-styles";

/** Centered card used by the storefront's sign-in, sign-up, and password pages */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className={cardClass}>{children}</div>
    </div>
  );
}
