"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { buttonStyles } from "@/components/button-styles";
import { ChatIcon } from "@/components/icons";
import { enquirySchema, type EnquiryField } from "@/lib/enquiry";
import { contactLink } from "@/lib/site";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type Status = "idle" | "sending" | "sent" | "error";

// Bots usually submit instantly; people take longer than this to fill a form
const MIN_FILL_TIME_MS = 2000;

const fieldOrder: EnquiryField[] = ["name", "phone", "email", "message"];

const inputClass =
  "w-full rounded-xl border border-fg/20 bg-surface px-4 py-3 text-fg placeholder:text-fg-muted/70 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-line aria-[invalid=true]:border-badge";
const labelClass = "text-sm font-medium";
const errorClass = "text-sm text-badge";

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const loadedAtRef = useRef(0);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<EnquiryField, string>>>({});
  const [unsentMessage, setUnsentMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadedAtRef.current = Date.now();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    // Spam checks: the honeypot is filled, or the form was submitted too quickly.
    // Pretend it worked so bots learn nothing.
    if (data.get("website") || Date.now() - loadedAtRef.current < MIN_FILL_TIME_MS) {
      setStatus("sent");
      return;
    }

    const parsed = enquirySchema.safeParse({
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
    });

    if (!parsed.success) {
      const fieldErrors: Partial<Record<EnquiryField, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as EnquiryField;
        fieldErrors[field] ??= issue.message;
      }
      setErrors(fieldErrors);
      const firstInvalid = fieldOrder.find((field) => fieldErrors[field]);
      (form.elements.namedItem(firstInvalid ?? "name") as HTMLElement | null)?.focus();
      return;
    }

    setErrors({});
    setStatus("sending");
    const { name, phone, email, message } = parsed.data;

    try {
      // No .select() after insert: visitors can't read enquiries (RLS), so asking for the row back would fail
      const { error } = await getBrowserSupabase()
        .from("enquiries")
        .insert({ name, phone: phone || null, email: email || null, message });
      if (error) throw error;
      setStatus("sent");
      form.reset();
    } catch {
      // Supabase may be paused or unreachable: keep their words and offer another way to send them
      setUnsentMessage(`Hello! I'm ${name}. ${message}`);
      setStatus("error");
    }
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(unsentMessage);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 py-6">
        <h2 className="text-3xl">Thank you!</h2>
        <p className="text-fg-muted">Your message has been sent. Kavita will get back to you soon.</p>
        <button type="button" onClick={() => setStatus("idle")} className={buttonStyles.secondary}>
          Send another message
        </button>
      </div>
    );
  }

  const fallback = contactLink(unsentMessage);

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Honeypot: off-screen (not display:none, which some bots skip). People never see or fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={100}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={inputClass}
        />
        {errors.name && (
          <p id="name-error" className={errorClass}>
            {errors.name}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className={labelClass}>
            Phone <span className="font-normal text-fg-muted">(WhatsApp preferred)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            maxLength={20}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "phone-error" : "contact-hint"}
            className={inputClass}
          />
          {errors.phone && (
            <p id="phone-error" className={errorClass}>
              {errors.phone}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : "contact-hint"}
            className={inputClass}
          />
          {errors.email && (
            <p id="email-error" className={errorClass}>
              {errors.email}
            </p>
          )}
        </div>
      </div>
      <p id="contact-hint" className="-mt-3 text-xs text-fg-muted">
        Share a phone number, an email, or both, so Kavita can reply.
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={2000}
          placeholder="Ask about a piece, a custom order, or an upcoming exhibition."
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`${inputClass} resize-y`}
        />
        {errors.message && (
          <p id="message-error" className={errorClass}>
            {errors.message}
          </p>
        )}
      </div>

      {status === "error" && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-badge/40 bg-surface p-4">
          <p className="text-sm">
            Sorry, we couldn&apos;t send your message right now. You can send it directly instead:
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={fallback.href} target="_blank" rel="noopener noreferrer" className={buttonStyles.primary}>
              <ChatIcon />
              Send on {fallback.label.replace("Message on ", "")} instead
            </a>
            <button type="button" onClick={copyMessage} className={buttonStyles.secondary}>
              {copied ? "Copied!" : "Copy message"}
            </button>
          </div>
        </div>
      )}

      <div>
        <button type="submit" disabled={status === "sending"} className={`${buttonStyles.primary} disabled:opacity-60`}>
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
