"use client";

import { useEffect, useState } from "react";
import { ExhibitionForm } from "@/components/admin/exhibition-form";
import { errorClass } from "@/components/admin/form-styles";
import { buttonStyles } from "@/components/button-styles";
import { deleteExhibition, listExhibitions, type AdminExhibition } from "@/lib/admin/exhibitions";
import { formatDateRange } from "@/lib/format";

/** Today's date as YYYY-MM-DD on this device, for splitting upcoming and past exhibitions */
function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function AdminExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState<AdminExhibition[] | null>(null);
  const [today, setToday] = useState("");
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    listExhibitions()
      .then((list) => {
        setToday(localToday());
        setExhibitions(list);
      })
      .catch(() => setLoadError("Couldn't load exhibitions. Check your internet connection and refresh."));
  }, []);

  function upsert(saved: AdminExhibition) {
    setExhibitions((current) => {
      const others = (current ?? []).filter((item) => item.id !== saved.id);
      return [...others, saved];
    });
    setAdding(false);
    setEditingId(null);
  }

  async function remove(exhibition: AdminExhibition) {
    if (!window.confirm(`Delete “${exhibition.title}”? This can't be undone.`)) return;
    setError("");
    try {
      await deleteExhibition(exhibition.id);
      setExhibitions((current) => current?.filter((item) => item.id !== exhibition.id) ?? current);
    } catch {
      setError("Couldn't delete that exhibition. Please try again.");
    }
  }

  const list = exhibitions ?? [];
  const upcoming = list.filter((e) => e.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = list.filter((e) => e.endDate < today).sort((a, b) => b.startDate.localeCompare(a.startDate));

  function renderItem(exhibition: AdminExhibition, isPast: boolean) {
    if (editingId === exhibition.id) {
      return (
        <li key={exhibition.id}>
          <ExhibitionForm exhibition={exhibition} onSaved={upsert} onCancel={() => setEditingId(null)} />
        </li>
      );
    }
    return (
      <li
        key={exhibition.id}
        className={`flex flex-col gap-2 rounded-2xl border border-border p-5 ${isPast ? "opacity-60" : ""}`}
      >
        <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">
          {formatDateRange(exhibition.startDate, exhibition.endDate)}
        </p>
        <h3 className="font-display text-2xl">{exhibition.title}</h3>
        <p className="text-sm text-fg-muted">
          {exhibition.venue}, {exhibition.city}
        </p>
        {exhibition.notes && <p className="text-sm text-fg-muted">{exhibition.notes}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => setEditingId(exhibition.id)} className={buttonStyles.secondary}>
            Edit
          </button>
          <button
            type="button"
            onClick={() => remove(exhibition)}
            className="inline-flex min-h-12 items-center rounded-full px-4 text-sm text-badge hover:underline"
          >
            Delete
          </button>
        </div>
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl">Exhibitions</h1>
          <p className="text-sm text-fg-muted">Upcoming exhibitions appear on the home and contact pages after you publish.</p>
        </div>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className={buttonStyles.primary}>
            + Add exhibition
          </button>
        )}
      </div>

      {adding && <ExhibitionForm onSaved={upsert} onCancel={() => setAdding(false)} />}

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
      {!exhibitions && !loadError && <p className="text-fg-muted">Loading…</p>}

      {exhibitions && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-fg-muted">No upcoming exhibitions.</p>
            ) : (
              <ul className="flex flex-col gap-3">{upcoming.map((e) => renderItem(e, false))}</ul>
            )}
          </section>
          {past.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-2xl">Past</h2>
              <ul className="flex flex-col gap-3">{past.map((e) => renderItem(e, true))}</ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
