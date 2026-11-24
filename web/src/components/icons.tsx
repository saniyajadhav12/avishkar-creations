// Small inline SVG icons. They inherit the text color and are hidden from screen readers;
// the surrounding link or button always provides the accessible label.

type IconProps = { className?: string };

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function MenuIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function CameraIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function ChatIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M4 5h16v11H9l-5 4V5z" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "size-4" }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function UserIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export function HeartIcon({ className = "size-5", filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg {...baseProps} fill={filled ? "currentColor" : "none"} className={className}>
      <path d="M12 20s-7-4.4-9.2-9C1.4 7.9 3.3 4.5 6.6 4.5c2 0 3.4 1.1 4.4 2.6 1-1.5 2.4-2.6 4.4-2.6 3.3 0 5.2 3.4 3.8 6.5C19 15.6 12 20 12 20z" />
    </svg>
  );
}

export function BagIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </svg>
  );
}
