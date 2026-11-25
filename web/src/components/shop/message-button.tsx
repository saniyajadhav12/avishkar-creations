"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCustomerSession } from "@/components/auth/customer-session";
import { ChatIcon } from "@/components/icons";
import { useLoginRequiredForMessages } from "@/lib/site-settings";
import { contactLink } from "@/lib/site";

type MessageButtonProps = {
  /** Prefilled message (WhatsApp only) */
  message: string;
  label: string;
  className: string;
};

/**
 * "Ask" or "Order" on WhatsApp/Instagram. When the admin requires sign-in to message and the
 * customer is signed out, it links to sign-in instead and returns them here afterwards.
 * Fails open: if the setting can't be loaded, messaging is allowed.
 */
export function MessageButton({ message, label, className }: MessageButtonProps) {
  const pathname = usePathname();
  const session = useCustomerSession();
  const loginRequired = useLoginRequiredForMessages();

  if (loginRequired && session.status === "signed-out") {
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={className}>
        <ChatIcon />
        Sign in to message
      </Link>
    );
  }

  return (
    <a href={contactLink(message).href} target="_blank" rel="noopener noreferrer" className={className}>
      <ChatIcon />
      {label}
    </a>
  );
}
