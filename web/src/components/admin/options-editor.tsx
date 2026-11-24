"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { cardClass, errorClass, inputClass, labelClass } from "@/components/admin/form-styles";
import { buttonStyles } from "@/components/button-styles";
import {
  createOption,
  deleteOption,
  listOptions,
  renameOption,
  saveOptionOrder,
  updateColourHex,
  type AdminOption,
  type OptionTable,
} from "@/lib/admin/options";

type OptionsEditorProps = {
  table: OptionTable;
  title: string;
  description: string;
  /** Item label used in messages, e.g. "category" */
  itemLabel: string;
  withColour?: boolean;
};

const MAX_NAME_LENGTH = 40;
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";

function SmallButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-fg/20 hover:border-primary disabled:opacity-40 ${focusRing}`}
    >
      {children}
    </button>
  );
}

function pieces(count: number): string {
  return `${count} ${count === 1 ? "product" : "products"}`;
}

/** Reusable list editor for categories, colours, and materials */
export function OptionsEditor({ table, title, description, itemLabel, withColour = false }: OptionsEditorProps) {
  const [options, setOptions] = useState<AdminOption[] | null>(null);
  const [savedNames, setSavedNames] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#b8893b");

  async function load() {
    try {
      const list = await listOptions(table);
      setOptions(list);
      setSavedNames(Object.fromEntries(list.map((option) => [option.id, option.name])));
    } catch {
      setLoadError(`Couldn't load ${title.toLowerCase()}. Check your internet connection and refresh.`);
    }
  }

  useEffect(() => {
    listOptions(table)
      .then((list) => {
        setOptions(list);
        setSavedNames(Object.fromEntries(list.map((option) => [option.id, option.name])));
      })
      .catch(() => setLoadError(`Couldn't load ${title.toLowerCase()}. Check your internet connection and refresh.`));
  }, [table, title]);

  function updateLocal(id: string, patch: Partial<AdminOption>) {
    setOptions((current) => current?.map((option) => (option.id === id ? { ...option, ...patch } : option)) ?? current);
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) {
      setError(`Please enter a name for the new ${itemLabel}.`);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const created = await createOption(table, name, options?.length ?? 0, withColour ? newHex : undefined);
      setOptions((current) => [...(current ?? []), created]);
      setSavedNames((current) => ({ ...current, [created.id]: created.name }));
      setNewName("");
    } catch {
      setError(`Couldn't add that ${itemLabel}. Please try again.`);
    } finally {
      setBusy(false);
    }
  }

  async function saveName(option: AdminOption) {
    const name = option.name.trim();
    if (name === savedNames[option.id]) return;
    if (!name) {
      updateLocal(option.id, { name: savedNames[option.id] });
      return;
    }
    setError("");
    try {
      await renameOption(table, option.id, name);
      setSavedNames((current) => ({ ...current, [option.id]: name }));
    } catch {
      setError("Couldn't save the new name. Please try again.");
      updateLocal(option.id, { name: savedNames[option.id] });
    }
  }

  async function saveHex(option: AdminOption) {
    if (!option.hex) return;
    setError("");
    try {
      await updateColourHex(option.id, option.hex);
    } catch {
      setError("Couldn't save the colour. Please try again.");
      await load();
    }
  }

  async function move(index: number, offset: -1 | 1) {
    if (!options) return;
    const target = index + offset;
    if (target < 0 || target >= options.length) return;
    const reordered = [...options];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setOptions(reordered);
    setError("");
    try {
      await saveOptionOrder(table, reordered);
    } catch {
      setError("Couldn't save the new order. Please try again.");
      await load();
    }
  }

  async function remove(option: AdminOption) {
    const impact =
      option.productCount === 0
        ? ""
        : table === "categories"
          ? ` ${pieces(option.productCount)} will be left without a category.`
          : ` It will be removed from ${pieces(option.productCount)}.`;
    if (!window.confirm(`Delete “${savedNames[option.id] ?? option.name}”?${impact}`)) return;

    setBusy(true);
    setError("");
    try {
      await deleteOption(table, option.id);
      const remaining = (options ?? []).filter((item) => item.id !== option.id);
      setOptions(remaining);
      await saveOptionOrder(table, remaining);
    } catch {
      setError(`Couldn't delete that ${itemLabel}. Please try again.`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${cardClass} flex flex-col gap-5`}>
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl">{title}</h2>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>

      {loadError && (
        <p role="alert" className={errorClass}>
          {loadError}
        </p>
      )}
      {!options && !loadError && <p className="text-sm text-fg-muted">Loading…</p>}

      {options && (
        <ul className="flex flex-col gap-3">
          {options.map((option, index) => (
            <li key={option.id} className="flex flex-wrap items-center gap-2 border-b border-border pb-3 last:border-b-0">
              {withColour && option.hex && (
                <input
                  type="color"
                  aria-label={`Swatch colour for ${option.name}`}
                  value={option.hex}
                  onChange={(event) => updateLocal(option.id, { hex: event.target.value })}
                  onBlur={() => saveHex(option)}
                  className="size-11 shrink-0 cursor-pointer rounded-full border border-border bg-transparent p-1"
                />
              )}
              <div className="flex min-w-40 flex-1 flex-col">
                <label htmlFor={`${table}-${option.id}`} className="sr-only">
                  {`Name of ${itemLabel} ${index + 1}`}
                </label>
                <input
                  id={`${table}-${option.id}`}
                  value={option.name}
                  onChange={(event) => updateLocal(option.id, { name: event.target.value })}
                  onBlur={() => saveName(option)}
                  maxLength={MAX_NAME_LENGTH}
                  className={`${inputClass} min-h-11`}
                />
                <span className="mt-1 text-xs text-fg-muted">Used by {pieces(option.productCount)}</span>
              </div>
              <SmallButton label={`Move ${option.name} up`} onClick={() => move(index, -1)} disabled={busy || index === 0}>
                ↑
              </SmallButton>
              <SmallButton
                label={`Move ${option.name} down`}
                onClick={() => move(index, 1)}
                disabled={busy || index === options.length - 1}
              >
                ↓
              </SmallButton>
              <button
                type="button"
                onClick={() => remove(option)}
                disabled={busy}
                className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm text-badge hover:underline disabled:opacity-40 ${focusRing}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}

      <form onSubmit={add} noValidate className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
        {withColour && (
          <input
            type="color"
            aria-label={`Swatch colour for the new ${itemLabel}`}
            value={newHex}
            onChange={(event) => setNewHex(event.target.value)}
            className="size-11 shrink-0 cursor-pointer rounded-full border border-border bg-transparent p-1"
          />
        )}
        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <label htmlFor={`${table}-new`} className={labelClass}>
            {`New ${itemLabel}`}
          </label>
          <input
            id={`${table}-new`}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            maxLength={MAX_NAME_LENGTH}
            className={`${inputClass} min-h-11`}
          />
        </div>
        <button type="submit" disabled={busy} className={`${buttonStyles.primary} disabled:opacity-60`}>
          Add
        </button>
      </form>
    </section>
  );
}
