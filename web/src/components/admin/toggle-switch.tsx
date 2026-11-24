type ToggleSwitchProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

/** Accessible on/off switch with a large tap target */
export function ToggleSwitch({ label, checked, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-11 items-center gap-3 rounded-full text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-fg/20"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}
