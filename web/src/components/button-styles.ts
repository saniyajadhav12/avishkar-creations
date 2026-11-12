// Shared button styles for links and buttons, so every call-to-action looks consistent.
const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-medium tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";

export const buttonStyles = {
  primary: `${base} bg-primary text-on-primary hover:bg-primary-hover`,
  secondary: `${base} border border-fg/25 text-fg hover:border-primary hover:text-primary`,
};
