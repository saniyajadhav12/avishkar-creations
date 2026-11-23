"use client";

import { useState } from "react";
import { inputClass } from "@/components/admin/form-styles";

type PasswordInputProps = {
  id: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  describedBy?: string;
};

/** Password field with a show/hide button, which helps a lot when typing on a phone */
export function PasswordInput({ id, name, autoComplete, describedBy }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        className={`${inputClass} pr-20`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-2 my-auto h-9 rounded-lg px-3 text-sm text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-accent-line"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
