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
  if (id === "settings") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 1.8v1.7M8 12.5v1.7M1.8 8h1.7M12.5 8h1.7M4.1 4.1l1.2 1.2M10.7 10.7l1.2 1.2M4.1 11.9l1.2-1.2M10.7 5.3l1.2-1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "approvalqueue") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.5 7.2l1.5 1.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "myportfolio") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="5.5" width="13" height="9" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.5 5.5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M1.5 9.5h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "clientteam") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="5.8" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M1.5 14c0-2.5 1.9-4.5 4.3-4.5s4.3 2 4.3 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M11.8 7.5a2 2 0 1 0 0-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M12 10.2c2 .4 3.5 1.9 3.5 3.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "deliverystatus") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 8.5h9M9.5 5.8l2.5 2.7-2.5 2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="3.5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="3.5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3.5 6.5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M13 5.5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.8 1.2" />
      </svg>
    );
  }
  if (id === "myteam") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="4.2" r="1.9" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4.8 13c0-1.8 1.4-3.2 3.2-3.2s3.2 1.4 3.2 3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="2.6" cy="7.8" r="1.5" stroke="currentColor" strokeWidth="1.1" />
        <path d="M1 13c0-1.6 1-2.8 2.4-2.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="13.4" cy="7.8" r="1.5" stroke="currentColor" strokeWidth="1.1" />
        <path d="M15 13c0-1.6-1-2.8-2.4-2.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "myrisks") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M8 2L2.5 5v3.5c0 3 2.4 5 5.5 5.8 3.1-.8 5.5-2.8 5.5-5.8V5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M8 6.5v2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="11.1" r="0.8" fill="currentColor" />
      </svg>
    );
  }
  if (id === "systemstatus") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="3.8" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="2" y="9.2" width="12" height="3.8" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="12.5" cy="4.9" r="0.9" fill="currentColor" />
        <circle cx="12.5" cy="11.1" r="0.9" fill="currentColor" />
        <path d="M4 4.9h5M4 11.1h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "incidentalerts") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M8 2.8L2 13.5h12z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M8 7.5v2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="12" r="0.8" fill="currentColor" />
      </svg>
    );
  }
  if (id === "myanalytics") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 13.2h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="3" y="8.8" width="2.5" height="4.4" stroke="currentColor" strokeWidth="1.2" />
        <rect x="6.8" y="6.2" width="2.5" height="7" stroke="currentColor" strokeWidth="1.2" />
        <rect x="10.5" y="3.5" width="2.5" height="9.7" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (id === "myreports") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M3 2h7.5l2.5 2.5V14H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M10.5 2v2.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M5 9.8l2-2.2 1.6 1.8 2.2-3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "teamperformance") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M2 13.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="2.5" y="9.5" width="3" height="4" stroke="currentColor" strokeWidth="1.2" />
        <rect x="6.5" y="6" width="3" height="7.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="10.5" y="11" width="3" height="2.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 2v2.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="8" cy="5.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    );
  }
  if (id === "myintegrations") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="3.5" cy="3.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="12.5" cy="3.5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="8" cy="13" r="1.8" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5.3 3.5h4.4M4.2 5.2l3.2 6.1M11.8 5.2l-3.2 6.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "invoiceviewer") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M3 2h7l3 3v9H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.5 8.5h3M5.5 10.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="11.5" cy="12.5" r="1.8" stroke="currentColor" strokeWidth="1.1" />
      <path d="M12.8 13.8l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "projectbudget") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v6M6 7.5c0-.8.9-1.3 2-1.3s2 .5 2 1.3-1 1.3-2 1.3-2 .5-2 1.4c0 .8 1 1.3 2 1.3s2-.5 2-1.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "clientbudget") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="5.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 12.5c0-2 1.6-3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 7v7M9.5 8.5c-.4-.5-1-.8-1.8-.8s-1.7.6-1.7 1.4.8 1.2 1.8 1.4 1.8.7 1.8 1.5-.8 1.4-1.8 1.4c-.8 0-1.5-.3-1.8-.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "expensesubmit") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="4" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 1.5v5M6 3.5l2-2 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "paystub") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 5h5M5.5 7.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 9.5v4M6.5 10.8c0-.7.7-1.2 1.5-1.2s1.5.5 1.5 1.2-.7 1.2-1.5 1.2-1.5.5-1.5 1.2.7 1.2 1.5 1.2 1.5-.5 1.5-1.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
  if (id === "ratecard") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 7h2M5 9.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 6.5v5M9.8 7.5c.2-.6.6-1 1.2-1s1.2.4 1.2 1-.5 1-1.2 1-1.2.4-1.2 1 .5 1 1.2 1 1.2-.4 1.2-1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
  if (id === "vendordirectory") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 13V5.5L8 2l6 3.5V13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5.5" y="8" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 8v5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
  if (id === "mycapacity") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2.5 10.5A5.5 5.5 0 0 1 13.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3.5 12.5A4.5 4.5 0 0 1 8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 8l2.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="10.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
  if (id === "mytimeline") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M1.5 8h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 5.5v1M8 4.5v2M12 5.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "qachecklist") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 5.5l1.2 1.2L9 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 8.5l1.2 1.2L9 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "clienthealthsummary") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 13c0-2.5 2.4-4.5 5.5-4.5s5.5 2 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 10.5h1.5l1-2 1.5 4 1.2-2H11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "feedbackinbox") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="7.5" width="12" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 10.5h3.5L7 12.5h2l1.5-2H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 2l.9 2.2 2.4.3-1.7 1.7.4 2.3L8 7.4l-2 1.1.4-2.3L4.7 4.5l2.4-.3z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "myonboarding") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 5.5l1.2 1.2L9 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 8.5l1.2 1.2L9 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 11.5l1.2 1.2L9 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "myleave") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 7.5h12M5.5 2v3M10.5 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 10.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "mylearning") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M8 3L1.5 6.5 8 10l6.5-3.5L8 3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M4.5 8.5V12l3.5 1.5 3.5-1.5V8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 6.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
  if (id === "myenps") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 13.5c0-2.5 2-4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 7.5l.8 2 2.2.3-1.6 1.5.4 2.2-1.8-1-1.8 1 .4-2.2-1.6-1.5 2.2-.3z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "myemployment") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 4V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 10h1.5M10.5 10H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "brandkit") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="5" cy="11" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 11h4M11 9v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
  if (id === "contractviewer") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 5h6M5 7.5h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8.5 12.5l2 .5.5-2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "servicecatalog") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 10.5h5M9 13h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "projectdocuments") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M4 3h7l3 2.5V14H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11 3v2.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2 5h2v10H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6.5 8.5h4M6.5 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "requestviewer") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="7.5" width="12" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 10.5h3.5L7 12.5h2l1.5-2H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="4" r="0.8" fill="currentColor" />
    </svg>
  );
  if (id === "clientjourney") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="2.5" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="13.5" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 8c0-2 1.8-4 4-4M9.5 4c2.2 0 4 2 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2.5 9.5v2.5h11V9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "offboardingtasks") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M9 3H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 7h4M12 5l2 2-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8l1.2 1.2 2.8-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "interventionactions") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M9 2L5.5 8.5H8L7 14l6.5-8H11z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "changeRequests") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 11.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (id === "slaTracker") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5v3.8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.5 13l1.2-1.2 1.2 1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (id === "appointments") return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 7.5h12M5.5 2v3M10.5 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 10.5l.6 1.8 2 .3-1.4 1.3.3 1.9L8 15l-1.5.8.3-1.9L5.4 12.6l2-.3z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.41 1.41M3.05 12.95l1.42-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
