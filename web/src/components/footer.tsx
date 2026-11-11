import Image from "next/image";
import Link from "next/link";
import { CameraIcon, ChatIcon } from "@/components/icons";
import { contactLink, navLinks, site } from "@/lib/site";

const linkClass =
  "inline-flex min-h-11 items-center gap-2 rounded-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";

const headingClass = "font-sans text-xs font-medium tracking-[0.2em] text-fg-muted uppercase";

export function Footer() {
  const contact = contactLink();
  // Static export: the year is set at build time, and every publish triggers a fresh build.
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border bg-surface-raised">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[2fr_1fr_1fr] lg:px-8">
        <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
          <Image
            src="/brand/avishkar-logo-large.webp"
            alt={site.name}
            width={1400}
            height={469}
            className="h-16 w-auto self-start rounded-sm"
          />
          <div className="h-px w-16 bg-accent-line" />
          <p className="max-w-xs font-display text-xl text-fg italic">{site.tagline}</p>
          <p className="text-sm text-fg-muted">Handmade in India by {site.founder}.</p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2">
          <h2 className={headingClass}>Explore</h2>
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-2">
          <h2 className={headingClass}>Say hello</h2>
          <ul>
            <li>
              <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <CameraIcon />@{site.instagramHandle}
              </a>
            </li>
            <li>
              <a href={contact.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <ChatIcon />
                {contact.label}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-fg-muted sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p>Website by Saniya Jadhav</p>
        </div>
      </div>
    </footer>
  );
}
