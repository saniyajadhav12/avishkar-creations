import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SectionHeading } from "@/components/section-heading";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${site.name} collects, uses, and protects your information.`,
};

const CONTACT_EMAIL = "avishkarcreations.site@gmail.com";
const LAST_UPDATED = "23 November 2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      <div className="flex flex-col gap-3 text-fg-muted [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-fg">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12 sm:px-6 lg:py-16">
      <SectionHeading as="h1" align="left" eyebrow="Privacy" title="Privacy policy" />
      <p className="text-fg-muted">
        Last updated: {LAST_UPDATED}. This policy explains what information {site.name} ({site.founder},{" "}
        {site.location}, India) collects through this website, why, and the choices you have. We collect only what we
        need, and we never sell your information.
      </p>

      <Section title="What we collect">
        <ul className="flex flex-col gap-2">
          <li>
            <strong>Account details:</strong> your name and email address, and optionally your phone number. If you
            sign in with Google, we receive your name and email address from Google. Passwords are stored securely by
            our sign-in provider, and we never see them.
          </li>
          <li>
            <strong>Your wishlist:</strong> the pieces you save to your account.
          </li>
          <li>
            <strong>Contact form messages:</strong> your name, phone number or email, and your message.
          </li>
          <li>
            <strong>Stored only in your browser:</strong> your cart and your light/dark theme choice. These stay on
            your device and are not sent to us.
          </li>
        </ul>
        <p>
          We don&apos;t use advertising or tracking cookies, and we don&apos;t use analytics that follow you across
          websites. Your browser stores a small sign-in token so you stay logged in.
        </p>
      </Section>

      <Section title="How we use it">
        <ul className="flex flex-col gap-2">
          <li>To create and manage your account, and to save your wishlist.</li>
          <li>To reply to your messages and enquiries.</li>
          <li>To send account emails, such as confirming your email address or resetting your password.</li>
        </ul>
        <p>
          When you order or ask about a piece on WhatsApp or Instagram, your conversation happens on those services
          and is covered by their own privacy policies.
        </p>
      </Section>

      <Section title="Where it's stored and who helps us">
        <p>We use a small number of trusted services to run this website:</p>
        <ul className="flex flex-col gap-2">
          <li>
            <strong>Supabase:</strong> stores account details, wishlists, and messages, on servers in Mumbai, India.
          </li>
          <li>
            <strong>Cloudflare:</strong> hosts and delivers the website.
          </li>
          <li>
            <strong>Google:</strong> provides &quot;Continue with Google&quot; sign-in (if you choose it) and sends our
            account emails through Gmail.
          </li>
        </ul>
        <p>We don&apos;t sell, rent, or share your information with anyone else for marketing.</p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your account details and wishlist until you delete your account. We keep contact form messages only
          as long as needed to reply and follow up, and delete them regularly.
        </p>
      </Section>

      <Section title="Your choices">
        <ul className="flex flex-col gap-2">
          <li>
            <strong>See and update</strong> your details anytime on your{" "}
            <Link href="/account" className="text-primary underline">
              account page
            </Link>
            .
          </li>
          <li>
            <strong>Delete your account</strong> yourself from the account page. This permanently removes your details
            and wishlist.
          </li>
          <li>
            <strong>Ask us</strong> to access, correct, or delete any information we hold about you, including contact
            form messages, by emailing{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
              {CONTACT_EMAIL}
            </a>
            .
          </li>
        </ul>
      </Section>

      <Section title="Children">
        <p>
          This website is intended for adults. If you are under 18, please use it with a parent or guardian&apos;s
          permission.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>
          If we change this policy, we&apos;ll update the date at the top of this page. Questions? Email us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
