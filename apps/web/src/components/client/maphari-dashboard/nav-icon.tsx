import type { PageId } from "./types";

export function NavIcon({ id, className }: { id: PageId; className: string }) {
  if (id === "dashboard") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (id === "projects") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "create") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.5v7M4.5 8h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "docs") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M4 1h6l4 4v10H4V1z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 1v4h4" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (id === "invoices") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 5h6M5 8h4M5 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "messages") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 2h12v9H9l-3 3v-3H2V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "automations") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M6 2h4v4H6zM2 10h4v4H2zM10 10h4v4h-4z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 6v2M6 10H4M10 10h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.41 1.41M3.05 12.95l1.42-1.41M11.54 4.46l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
