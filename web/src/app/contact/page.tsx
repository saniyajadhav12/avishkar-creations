import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { CameraIcon, ChatIcon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";
import { contactLink, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.founder} about a piece, a custom order, or an upcoming exhibition.`,
};

const cardClass = "flex items-start gap-4 rounded-2xl border border-border p-5";
const linkClass =
  "font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";

export default function ContactPage() {
  const contact = contactLink("Hello! I'd love to know more about your jewellery.");

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:gap-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-8">
        <SectionHeading
          as="h1"
          align="left"
          eyebrow="Contact"
          title="Say hello"
          description="Have a question about a piece, want something made specially, or planning to visit an exhibition? Kavita would love to hear from you."
        />

        <ul className="flex flex-col gap-4">
          <li className={cardClass}>
            <ChatIcon className="mt-0.5 size-5 shrink-0 text-accent" />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-fg-muted">The quickest way to reach her</p>
              <a href={contact.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {contact.label}
              </a>
            </div>
          </li>
          <li className={cardClass}>
            <CameraIcon className="mt-0.5 size-5 shrink-0 text-accent" />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-fg-muted">New pieces, first on Instagram</p>
              <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                @{site.instagramHandle}
              </a>
            </div>
          </li>
          <li className={cardClass}>
            <span aria-hidden="true" className="mt-0.5 shrink-0 text-accent">
              ✦
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-fg-muted">Based in {site.location}, India</p>
              <p>
                Meet her in person at an exhibition.{" "}
                <Link href="/" className={linkClass}>
                  See upcoming dates
                </Link>
              </p>
            </div>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl bg-surface-raised p-6 sm:p-10">
        <ContactForm />
      </div>
    </div>
  );
}
