"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAdminSession } from "@/components/admin/admin-session";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/options", label: "Options" },
  { href: "/admin/profile", label: "Profile" },
];

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";

function isActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  return href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`);
}

/** Admin chrome: compact header with navigation, built for phones first */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useAdminSession();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4">
          <Link href="/admin" className={`flex items-center gap-3 rounded-sm ${focusRing}`}>
            <Image src="/brand/avishkar-logo.webp" alt="Avishkar Creations" width={600} height={201} className="h-9 w-auto rounded-sm" />
            <span className="text-xs font-medium tracking-[0.2em] text-fg-muted uppercase">Admin</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm text-fg-muted hover:text-fg ${focusRing}`}
            >
              Sign out
            </button>
          </div>
        </div>
        <nav aria-label="Admin" className="mx-auto max-w-4xl px-4">
          <ul className="-mb-px flex gap-1 overflow-x-auto">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href} className="shrink-0">
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm ${focusRing} ${
                      active ? "border-primary text-primary" : "border-transparent text-fg-muted hover:text-fg"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="shrink-0">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm text-fg-muted hover:text-fg ${focusRing}`}
              >
                View site ↗
              </a>
            </li>
          </ul>
        </nav>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
