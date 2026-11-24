"use client";

import Link from "next/link";
import { useCustomerSession } from "@/components/auth/customer-session";
import { UserIcon } from "@/components/icons";

/** Header icon: "Sign in" when signed out, "Your account" (with a small dot) when signed in */
export function AccountLink() {
  const session = useCustomerSession();
  const signedIn = session.status === "signed-in";
  const label = signedIn ? "Your account" : "Sign in";

  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      aria-label={label}
      title={label}
      className="relative inline-flex size-11 items-center justify-center rounded-full text-fg transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
    >
      <UserIcon />
      {signedIn && <span aria-hidden="true" className="absolute top-2.5 right-2.5 size-2 rounded-full bg-primary" />}
    </Link>
  );
}
