import type { ReactNode } from "react";

type ArchFrameProps = {
  children: ReactNode;
  /** Set the shape's proportions from the caller, e.g. "aspect-[4/5]" */
  className?: string;
};

/** Temple-window arch with a thin gold inner border, used for all product photos */
export function ArchFrame({ children, className = "" }: ArchFrameProps) {
  return (
    <div className={`relative overflow-hidden rounded-t-full bg-surface-raised ${className}`}>
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 rounded-t-full border border-accent-line/50"
      />
    </div>
  );
}
