/**
 * Staff dashboard navigation icon component.
 *
 * Maps each staff PageId to a unique SVG icon. Used in the sidebar
 * navigation items.
 */
import type { PageId } from "./types";

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
  if (id === "tasks") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <path d="M4 5h8M4 8h6M4 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "notifications") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M8 2.2a4.8 4.8 0 0 0-3 8.5V13h6v-2.3A4.8 4.8 0 0 0 8 2.2Z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6 14.2h4M6.6 15.4h2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "kanban") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="6" y="1" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="11" y="1" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  if (id === "clients") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
        <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "autodraft") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 3h12v10H2z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M3 4l5 4 5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 11h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "meetingprep") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="2.5" width="13" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M4.5 1.5v2.2M11.5 1.5v2.2M4 7h8M4 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "comms") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 3h12v8H6l-3 2v-2H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M5 6h6M5 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "onboarding") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "health") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 9.5h2l1.4-3 2.2 5 1.9-4H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  if (id === "response") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 12l3-4 2 2 3-5 4 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 13.2h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "sentiment") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="6" cy="6.8" r="0.8" fill="currentColor" />
        <circle cx="10" cy="6.8" r="0.8" fill="currentColor" />
        <path d="M5.5 9.8c.6.8 1.5 1.2 2.5 1.2s1.9-.4 2.5-1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "lasttouched") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 4.6v3.6l2.3 1.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "portal") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 6h6M5 8h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "smartsuggestions") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M8 2.2a4.8 4.8 0 0 0-3 8.5V13h6v-2.3A4.8 4.8 0 0 0 8 2.2Z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6 14.2h4M6.6 15.4h2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "sprintplanning") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2.5" width="12" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 1.5v2.2M11 1.5v2.2M4 6h8M4.8 8.6h2.2M8 8.6h3.2M4.8 11h1.6M7.2 11h3.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "taskdependencies") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1.8" y="2" width="4.2" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
        <rect x="10" y="5.8" width="4.2" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1.8" y="10.5" width="4.2" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 3.8h2.5a1 1 0 0 1 1 1v1.1M6 12.2h2.5a1 1 0 0 0 1-1V9.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "recurringtasks") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M3 6.5A5 5 0 0 1 8 2a5 5 0 0 1 4.6 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M13 9.5A5 5 0 0 1 8 14a5 5 0 0 1-4.6-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M12.3 2.8v2.7H9.6M3.7 13.2v-2.7h2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "focusmode") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 5.2v2.9l1.9 1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M8 1.4v1.6M8 13v1.6M1.4 8h1.6M13 8h1.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "peerrequests") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="5.2" r="2.2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="11.1" cy="10.8" r="2.2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6.9 6.8l2.4 2.1M9.7 4.2h3.1M3 12h3.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "triggerlog") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 13h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M3.2 10.5h2.2V13H3.2zM6.9 8.2h2.2V13H6.9zM10.6 5.6h2.2V13h-2.2z" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (id === "privatenotes") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2.5" y="2" width="11" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 5.2h6M5 8h6M5 10.8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M1.6 3.5h2.2v2.2H1.6z" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    );
  }
  if (id === "keyboardshortcuts") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1.8" y="3" width="12.4" height="9.8" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
        <path d="M4.2 6.3h1.8M7 6.3h1.8M9.8 6.3h1.8M4.2 8.8h3.6M8.4 8.8h3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "estimatesactuals") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 13.2h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="3" y="8.3" width="2.2" height="4.9" stroke="currentColor" strokeWidth="1.2" />
        <rect x="6.9" y="6.2" width="2.2" height="7" stroke="currentColor" strokeWidth="1.2" />
        <rect x="10.8" y="4.6" width="2.2" height="8.6" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (id === "satisfactionscores") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 8l2.8-1.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="8" r="1.3" fill="currentColor" />
      </svg>
    );
  }
  if (id === "knowledge") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M3 2h10v12H3z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "decisionlog") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M3 2h10v12H3z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 5h6M5 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M9.5 11l1.2 1.2L13 9.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "handoverchecklist") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 5.5l1.4 1.4L9 4.3M5 9h6M5 11.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "closeoutreport") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M3 1.8h7.2l2 2v10.4H3z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M10.2 1.8v2h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M5 8.2h6M5 10.5h4M5 6h3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "staffhandovers") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="4.5" cy="4.5" r="2.2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="11.5" cy="11.5" r="2.2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6.7 5.8l2.6 2.6M8.5 4.2h3.3M4.2 8.5v3.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "context") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="2" width="13" height="12.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 1v3M11 1v3M3.5 6h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="5.2" cy="9.6" r="1" fill="currentColor" />
        <path d="M7.5 9.6h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="5.2" cy="12.2" r="1" fill="currentColor" />
        <path d="M7.5 12.2h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "signoff") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M3 2h10v12H3z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 5h6M5 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M9.5 11l1.2 1.2L13 9.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "standup") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 1v3M11 1v3M4 7h8M5 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "retainer") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 6h6M5 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M4 3V2h8v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "performance") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 13h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M3 11.5L6.2 8.6L8.5 10.3L12.8 5.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12.8" cy="5.7" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (id === "eodwrap") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 4.5v3.8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "deliverables") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M3 1h10v14H3z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 5h6M5 8h4M5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "timelog") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="9" r="6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 6v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M6 1h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "automations") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M6 2h4v4H6zM2 10h4v4H2zM10 10h4v4h-4z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 6v2M6 10H4M10 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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
