/**
 * Client dashboard navigation icon component.
 *
 * Maps each client PageId to a unique SVG icon. Used in the sidebar
 * navigation items.
 */
import type { PageId } from "./config";

export function NavIcon({ id, className }: { id: PageId; className: string }) {
  if (id === "dashboard") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
        <rect x="9" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
        <rect x="1" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
        <rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  if (id === "projects") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 4.5V13h12V4.5H2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M2 4.5l2-2.5h4l2 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 7.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "request") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2.5" y="2" width="11" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6 8h4M8 6v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "approvals") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5L2.5 4v4c0 3.5 2.4 5.8 5.5 6.5 3.1-.7 5.5-3 5.5-6.5V4L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "meetings") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="2.5" width="13" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M4.5 1.5v2.2M11.5 1.5v2.2M4 7h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="10.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 9.5v1l.8.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "files") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M4 1.5h5.5l3 3V14.5H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M9.5 1.5v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 8h4.5M6 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "feedback") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 3h12v8H6l-3 2v-2H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M5 6h6M5 8.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "billing") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" />
        <path d="M4 10h3M9 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "contracts") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M3.5 1.5h9v13h-9z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M5.5 4.5h5M5.5 7h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="8" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 9.5v-0.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "messages") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 2.5h8v6H5.5L3 10.5V8.5H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M10 5.5h4v6h-1v2l-2.5-2H7v-3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "notifications") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M8 2a4.5 4.5 0 0 0-4.5 4.5V10l-1 2h11l-1-2V6.5A4.5 4.5 0 0 0 8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M6.2 13a2 2 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "reports") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 13.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="3" y="9" width="2.2" height="4.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="6.9" y="5.5" width="2.2" height="8" stroke="currentColor" strokeWidth="1.2" />
        <rect x="10.8" y="2.5" width="2.2" height="11" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (id === "automation") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M8 1.6 2.4 4.4v7.2L8 14.4l5.6-2.8V4.4L8 1.6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 4.6v1.1M8 10.3v1.1M11.4 8h-1.1M5.7 8H4.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "services") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2.5 4.5h11v7h-11z" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5.2 4.5V3.2a2.8 2.8 0 0 1 5.6 0v1.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M6 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M6.8 10h2.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "support") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M3.6 3.6l2.6 2.6M9.8 9.8l2.6 2.6M12.4 3.6l-2.6 2.6M6.2 9.8l-2.6 2.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "onboarding") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 5l1.3 1.3L9 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 8.5l1.3 1.3L9 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "team") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="6" cy="4.5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M1.5 13c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="11.5" cy="5.5" r="1.7" stroke="currentColor" strokeWidth="1.2" />
        <path d="M14.5 12.5c0-1.7-1.3-3-3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.41 1.41M3.05 12.95l1.42-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
