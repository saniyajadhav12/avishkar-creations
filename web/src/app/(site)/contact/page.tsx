import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { CameraIcon, ChatIcon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";
import { getUpcomingExhibitions } from "@/lib/catalog";
import { formatDateRange } from "@/lib/format";
import { contactLink, generalEnquiryMessage, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.founder} about a piece, a custom order, or an upcoming exhibition.`,
};

const cardClass = "flex items-start gap-4 rounded-2xl border border-border p-5";
const linkClass =
  "font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";

/** Opens Google Maps searching for the venue (public exhibition venues only, never her home) */
function directionsUrl(venue: string, city: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue}, ${city}`)}`;
}

export default async function ContactPage() {
  const contact = contactLink(generalEnquiryMessage);
  const exhibitions = await getUpcomingExhibitions();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:gap-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-10">
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
              <p>Meet her in person at an exhibition.</p>
            </div>
          </li>
        </ul>

        <section aria-labelledby="exhibitions-heading" className="flex flex-col gap-4">
          <h2 id="exhibitions-heading" className="text-3xl">
            Upcoming exhibitions
          </h2>
          {exhibitions.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {exhibitions.map((exhibition) => (
                <li key={exhibition.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-raised p-5">
                  <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">
                    {formatDateRange(exhibition.start_date, exhibition.end_date)}
                  </p>
                  <h3 className="font-display text-2xl">{exhibition.title}</h3>
                  <p className="text-fg-muted">
                    {exhibition.venue}, {exhibition.city}
                  </p>
                  {exhibition.notes && <p className="whitespace-pre-line text-sm text-fg-muted">{exhibition.notes}</p>}
                  <a
                    href={directionsUrl(exhibition.venue, exhibition.city)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${linkClass} self-start text-sm`}
                  >
                    Get directions
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-fg-muted">
              No exhibitions are scheduled right now. Follow{" "}
              <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                @{site.instagramHandle}
              </a>{" "}
              to hear about the next one.
            </p>
          )}
        </section>
      </div>

      <div className="h-fit rounded-3xl bg-surface-raised p-6 sm:p-10">
        <div className="mb-8 flex flex-col gap-2">
          <h2 className="text-3xl">Prefer to write?</h2>
          <p className="text-fg-muted">Leave your details and Kavita will get back to you by phone or email.</p>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
