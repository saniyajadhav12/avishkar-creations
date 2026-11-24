"use client";

import Link from "next/link";
import { useAdminSession } from "@/components/admin/admin-session";
import { PublishButton } from "@/components/admin/publish-button";

const sections = [
  { title: "Products", description: "Add pieces, upload photos, set prices", href: null },
  { title: "Categories, colours & materials", description: "Manage the shop's filter options", href: null },
  { title: "Exhibitions", description: "Add upcoming exhibition dates", href: null },
  { title: "Enquiries", description: "Read messages from the contact form", href: null },
  { title: "Profile", description: "Change your password or email", href: "/admin/profile" },
];

export default function AdminHomePage() {
  const { user } = useAdminSession();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl">Welcome back</h1>
        <p className="text-sm text-fg-muted">Signed in as {user.email}</p>
      </div>

      <PublishButton />

      <ul className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <li key={section.title}>
            {section.href ? (
              <Link
                href={section.href}
                className="flex min-h-24 flex-col justify-center gap-1 rounded-2xl border border-border bg-surface-raised p-5 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line"
              >
                <span className="font-display text-2xl">{section.title}</span>
                <span className="text-sm text-fg-muted">{section.description}</span>
              </Link>
            ) : (
              <div className="flex min-h-24 flex-col justify-center gap-1 rounded-2xl border border-dashed border-border p-5 opacity-70">
                <span className="font-display text-2xl">{section.title}</span>
                <span className="text-sm text-fg-muted">{section.description} · coming soon</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
