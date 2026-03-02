"use client";

export type DashboardUtilityIconKind =
  | "apps"
  | "notifications"
  | "messages"
  | "help";

export function DashboardUtilityIcon({
  kind,
  className,
}: {
  kind: DashboardUtilityIconKind;
  className: string;
}) {
  switch (kind) {
    case "apps":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
          <rect x="2" y="2" width="4" height="4" />
          <rect x="10" y="2" width="4" height="4" />
          <rect x="2" y="10" width="4" height="4" />
          <rect x="10" y="10" width="4" height="4" />
        </svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
          <path d="M8 2.2a3.8 3.8 0 0 1 3.8 3.8v2.3L13.4 11H2.6l1.6-2.7V6A3.8 3.8 0 0 1 8 2.2Z" />
          <path d="M6.2 12a1.8 1.8 0 0 0 3.6 0" />
        </svg>
      );
    case "messages":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
          <path d="M2 2.5h12v8H8.8L6 13v-2.5H2z" />
        </svg>
      );
    case "help":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
          <circle cx="8" cy="8" r="6" />
          <path d="M6.6 6.2a1.7 1.7 0 1 1 2.8 1.3c-.7.5-1 .9-1 1.7" />
          <circle cx="8" cy="11.8" r=".6" />
        </svg>
      );
    default:
      return null;
  }
}
