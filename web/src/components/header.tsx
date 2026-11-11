"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CameraIcon, ChatIcon, CloseIcon, MenuIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { contactLink, navLinks, site } from "@/lib/site";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const contact = contactLink();

  // While the mobile menu is open: lock page scroll, focus the first link,
  // close on Escape, and close if the screen grows past the mobile breakpoint.
  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstMenuLinkRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    const widerThanMobile = window.matchMedia("(min-width: 640px)");
    function handleBreakpointChange(event: MediaQueryListEvent) {
      if (event.matches) setIsMenuOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    widerThanMobile.addEventListener("change", handleBreakpointChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      widerThanMobile.removeEventListener("change", handleBreakpointChange);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
          <Link href="/" onClick={closeMenu} className={`shrink-0 rounded-sm ${focusRing}`}>
            <Image
              src="/brand/avishkar-logo.webp"
              alt={site.name}
              width={600}
              height={201}
              priority
              className="h-10 w-auto rounded-sm lg:h-12"
            />
          </Link>

          <nav aria-label="Main" className="hidden sm:block">
            <ul className="flex items-center gap-1 lg:gap-4">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative inline-flex min-h-11 items-center rounded-sm px-3 text-sm tracking-wide transition-colors lg:text-base ${focusRing} after:absolute after:inset-x-3 after:bottom-2 after:h-px after:origin-left after:bg-accent-line after:transition-transform ${
                        active
                          ? "text-primary after:scale-x-100"
                          : "text-fg-muted after:scale-x-0 hover:text-fg hover:after:scale-x-100"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              className={`inline-flex size-11 items-center justify-center rounded-full text-fg transition-colors hover:bg-surface-raised sm:hidden ${focusRing}`}
            >
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Rendered outside <header>: its backdrop blur would otherwise trap this fixed panel inside the header box */}
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-16 bottom-0 z-30 flex flex-col overflow-y-auto bg-surface px-6 pt-6 pb-10 sm:hidden"
        >
          <nav aria-label="Mobile">
            <ul className="flex flex-col">
              {navLinks.map((link, index) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href} className="border-b border-border">
                    <Link
                      ref={index === 0 ? firstMenuLinkRef : undefined}
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-16 items-center font-display text-3xl ${focusRing} ${
                        active ? "text-primary" : "text-fg"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto flex flex-col gap-2 pt-10">
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex min-h-11 items-center gap-3 rounded-sm text-fg-muted hover:text-fg ${focusRing}`}
            >
              <CameraIcon />@{site.instagramHandle}
            </a>
            <a
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex min-h-11 items-center gap-3 rounded-sm text-fg-muted hover:text-fg ${focusRing}`}
            >
              <ChatIcon />
              {contact.label}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
