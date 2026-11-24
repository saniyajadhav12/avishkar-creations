"use client";

import { useState, type FormEvent } from "react";
import { errorClass, inputClass, labelClass } from "@/components/admin/form-styles";
import { buttonStyles } from "@/components/button-styles";
import { exhibitionFormSchema, type ExhibitionField } from "@/lib/admin/exhibition-schema";
import { saveExhibition, type AdminExhibition } from "@/lib/admin/exhibitions";

type ExhibitionFormProps = {
  exhibition?: AdminExhibition;
  onSaved: (exhibition: AdminExhibition) => void;
  onCancel: () => void;
};

const fieldOrder: ExhibitionField[] = ["title", "venue", "city", "startDate", "endDate", "notes"];

export function ExhibitionForm({ exhibition, onSaved, onCancel }: ExhibitionFormProps) {
  const [values, setValues] = useState({
    title: exhibition?.title ?? "",
    venue: exhibition?.venue ?? "",
    city: exhibition?.city ?? "Pune",
    startDate: exhibition?.startDate ?? "",
    endDate: exhibition?.endDate ?? "",
    notes: exhibition?.notes ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<ExhibitionField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const idPrefix = exhibition ? `exhibition-${exhibition.id}` : "exhibition-new";

  function set(field: ExhibitionField, value: string) {
    setValues((current) => {
      const next = { ...current, [field]: value };
      // Many exhibitions are single-day: default the end date to the start date
      if (field === "startDate" && (!current.endDate || current.endDate < value)) next.endDate = value;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const parsed = exhibitionFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<ExhibitionField, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as ExhibitionField;
        fieldErrors[field] ??= issue.message;
      }
      setErrors(fieldErrors);
      const first = fieldOrder.find((field) => fieldErrors[field]);
      if (first) document.getElementById(`${idPrefix}-${first}`)?.focus();
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      onSaved(await saveExhibition(parsed.data, exhibition?.id));
    } catch {
      setFormError("Couldn't save. Check your internet connection and try again.");
      setSaving(false);
    }
  }

  function field(name: ExhibitionField, label: string, input: "text" | "date" | "textarea" = "text") {
    const id = `${idPrefix}-${name}`;
    const shared = {
      id,
      value: values[name],
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? `${id}-error` : undefined,
    };
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {input === "textarea" ? (
          <textarea
            {...shared}
            rows={3}
            maxLength={500}
            onChange={(event) => set(name, event.target.value)}
            className={`${inputClass} py-3`}
          />
        ) : (
          <input
            {...shared}
            type={input}
            onChange={(event) => set(name, event.target.value)}
            className={inputClass}
          />
        )}
        {errors[name] && (
          <p id={`${id}-error`} className={errorClass}>
            {errors[name]}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-2xl border border-primary/40 p-5">
      <h2 className="text-2xl">{exhibition ? "Edit exhibition" : "New exhibition"}</h2>
      {field("title", "Title")}
      {field("venue", "Venue")}
      {field("city", "City")}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("startDate", "Start date", "date")}
        {field("endDate", "End date", "date")}
      </div>
      {field("notes", "Notes (optional)", "textarea")}

      {formError && (
        <p role="alert" className={errorClass}>
          {formError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className={`${buttonStyles.primary} disabled:opacity-60`}>
          {saving ? "Saving…" : "Save exhibition"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className={buttonStyles.secondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
