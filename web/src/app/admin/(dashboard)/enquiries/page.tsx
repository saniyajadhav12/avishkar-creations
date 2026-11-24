"use client";

import { useEffect, useState } from "react";
import { errorClass } from "@/components/admin/form-styles";
import { deleteEnquiry, listEnquiries, whatsappDigits, type AdminEnquiry } from "@/lib/admin/enquiries";

const actionClass =
  "inline-flex min-h-11 items-center rounded-full border border-fg/20 px-4 text-sm hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";

function formatReceived(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<AdminEnquiry[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listEnquiries()
      .then(setEnquiries)
      .catch(() => setLoadError("Couldn't load enquiries. Check your internet connection and refresh."));
  }, []);

  async function remove(enquiry: AdminEnquiry) {
    if (!window.confirm(`Delete the message from ${enquiry.name}? This can't be undone.`)) return;
    setError("");
    try {
      await deleteEnquiry(enquiry.id);
      setEnquiries((current) => current?.filter((item) => item.id !== enquiry.id) ?? current);
    } catch {
      setError("Couldn't delete that message. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl">Enquiries</h1>
        <p className="text-sm text-fg-muted">Messages from the website&apos;s contact form, newest first.</p>
      </div>

      {loadError && (
        <p role="alert" className={errorClass}>
          {loadError}
        </p>
      )}
      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}
      {!enquiries && !loadError && <p className="text-fg-muted">Loading…</p>}
      {enquiries && enquiries.length === 0 && <p className="text-fg-muted">No messages yet.</p>}

      <ul className="flex flex-col gap-4">
        {enquiries?.map((enquiry) => (
          <li key={enquiry.id} className="flex flex-col gap-3 rounded-2xl border border-border p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl">{enquiry.name}</h2>
              <p className="text-xs text-fg-muted">{formatReceived(enquiry.createdAt)}</p>
            </div>
            <p className="whitespace-pre-line">{enquiry.message}</p>
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              {enquiry.phone && (
                <>
                  <a
                    href={`https://wa.me/${whatsappDigits(enquiry.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={actionClass}
                  >
                    Reply on WhatsApp
                  </a>
                  <a href={`tel:${enquiry.phone.replace(/[^\d+]/g, "")}`} className={actionClass}>
                    Call {enquiry.phone}
                  </a>
                </>
              )}
              {enquiry.email && (
                <a href={`mailto:${enquiry.email}`} className={actionClass}>
                  Email {enquiry.email}
                </a>
              )}
              <button
                type="button"
                onClick={() => remove(enquiry)}
                className="ml-auto inline-flex min-h-11 items-center rounded-full px-4 text-sm text-badge hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
