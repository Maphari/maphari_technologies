/**
 * Admin dashboard navigation icon component.
 *
 * Maps each admin PageId to a unique SVG icon. Used in the sidebar
 * navigation items and the all-pages grid.
 */
import type { PageId } from "./config";

export function NavIcon({ id, className }: { id: PageId; className: string }) {
  switch (id) {
    case "dashboard":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <rect x="2" y="2" width="5" height="5" rx="1" />
          <rect x="9" y="2" width="5" height="3" rx="1" />
          <rect x="9" y="6" width="5" height="8" rx="1" />
          <rect x="2" y="8" width="5" height="6" rx="1" />
        </svg>
      );
    case "leads":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14" />
          <path d="M7 4.5v5M4.5 7h5" />
        </svg>
      );
    case "clients":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <circle cx="6" cy="5.5" r="2.5" />
          <circle cx="11.2" cy="6.2" r="1.8" />
          <path d="M1.8 13c0-2.4 1.9-4.3 4.2-4.3S10.2 10.6 10.2 13" />
          <path d="M9.8 12.8c.3-1.8 1.8-3.1 3.6-3.1" />
        </svg>
      );
    case "projects":
    case "portfolio":
    case "bizdev":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <rect x="2" y="3" width="12" height="10" rx="1.5" />
          <path d="M2 6h12M6 3v3" />
        </svg>
      );
    case "resources":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M2 12h12M3 10V6M7 10V4M11 10V7M14 10V5" />
        </svg>
      );
    case "gantt":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M2 3h12M2 8h12M2 13h12" />
          <rect x="3" y="2" width="4" height="2" rx="1" />
          <rect x="6" y="7" width="5" height="2" rx="1" />
          <rect x="9" y="12" width="4" height="2" rx="1" />
        </svg>
      );
    case "qa":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M8 2 13 4v4c0 3-2.2 5-5 6-2.8-1-5-3-5-6V4l5-2Z" />
          <path d="m5.8 8.1 1.5 1.5 3-3" />
        </svg>
      );
    case "sla":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <circle cx="8" cy="8" r="6" />
          <path d="M8 4.5v3.8l2.4 1.4" />
        </svg>
      );
    case "experience":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M8 13s-4.8-2.8-4.8-6.2A2.8 2.8 0 0 1 8 5a2.8 2.8 0 0 1 4.8 1.8C12.8 10.2 8 13 8 13Z" />
        </svg>
      );
    case "onboarding":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M2 8h9" />
          <path d="m8 4 4 4-4 4" />
          <rect x="2" y="3" width="12" height="10" rx="1.5" />
        </svg>
      );
    case "offboarding":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <rect x="2" y="3" width="12" height="10" rx="1.5" />
          <path d="M14 8H5" />
          <path d="m8 5-3 3 3 3" />
        </svg>
      );
    case "satisfaction":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <circle cx="8" cy="8" r="6" />
          <path d="M5.5 10c.7.8 1.5 1.2 2.5 1.2S9.8 10.8 10.5 10" />
          <circle cx="5.8" cy="6.3" r=".7" />
          <circle cx="10.2" cy="6.3" r=".7" />
        </svg>
      );
    case "comms":
    case "messages":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M2 2.5h12v8H8.8L6 13v-2.5H2z" />
        </svg>
      );
    case "vault":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <rect x="2" y="2" width="12" height="12" rx="1.5" />
          <path d="M5 6h6M5 8h6M5 10h4" />
        </svg>
      );
    case "referrals":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M4 6h8" />
          <path d="m9 3 3 3-3 3" />
          <path d="M12 10H4" />
          <path d="m7 7-3 3 3 3" />
        </svg>
      );
    case "interventions":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M8 2 14 13H2L8 2z" />
          <path d="M8 6.2v3.3M8 11.4h.01" />
        </svg>
      );
    case "invoices":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" />
          <path d="M5 5h6M5 8h4M5 11h3" />
        </svg>
      );
    case "revops":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M2 12.5h12" />
          <path d="m3.5 10.5 3-3 2 2 4-5" />
          <circle cx="12.5" cy="4.5" r="1" />
        </svg>
      );
    case "pricing":
    case "profitability":
    case "projectProfitability":
    case "cashflow":
    case "payroll":
    case "fyCloseout":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M8 2v12M10.8 4.6c-.5-.8-1.4-1.3-2.8-1.3-1.6 0-2.7.8-2.7 2 0 1.3 1 1.8 2.8 2.1 1.8.3 2.7.8 2.7 2.1 0 1.2-1.1 2-2.7 2-1.5 0-2.5-.4-3.1-1.3" />
        </svg>
      );
    case "expenses":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <rect x="2.5" y="2" width="11" height="12" rx="1.5" />
          <path d="M5 5h6M5 7.5h6M5 10h4" />
          <path d="M10.5 12.5h3" />
        </svg>
      );
    case "vendors":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <rect x="2" y="3" width="12" height="10" rx="1.5" />
          <path d="M2 6.5h12M6 3v10M10 3v10" />
        </svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M8 2.2a3.8 3.8 0 0 1 3.8 3.8v2.3L13.4 11H2.6l1.6-2.7V6A3.8 3.8 0 0 1 8 2.2Z" />
          <path d="M6.2 12a1.8 1.8 0 0 0 3.6 0" />
        </svg>
      );
    case "staff":
    case "staffOnboarding":
    case "leaveAbsence":
    case "recruitment":
    case "learningDev":
    case "staffSatisfaction":
    case "employmentRecords":
    case "team":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <circle cx="5.8" cy="5.4" r="2.3" />
          <circle cx="10.8" cy="6.3" r="1.8" />
          <path d="M2 13c0-2.2 1.7-4 3.8-4s3.8 1.8 3.8 4" />
          <path d="M9 12.8c.2-1.5 1.5-2.7 3-2.7" />
        </svg>
      );
    case "automation":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <rect x="2" y="2" width="4" height="4" />
          <rect x="10" y="2" width="4" height="4" />
          <rect x="6" y="10" width="4" height="4" />
          <path d="M6 4h4M8 6v4" />
        </svg>
      );
    case "integrations":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="m5.5 5.5-2.8 2.8 2.8 2.8M10.5 5.5l2.8 2.8-2.8 2.8M9 3.5 7 12.5" />
        </svg>
      );
    case "owner":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <circle cx="8" cy="5" r="2.5" />
          <path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5" />
          <path d="m10.7 2.2.8.8 1.3-.2-.2 1.3.8.8-1.2.2-.6 1-.6-1-1.2-.2.8-.8-.2-1.3 1.3.2z" />
        </svg>
      );
    case "brand":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M8 2.5 2.5 5.5 8 8.5l5.5-3Z" />
          <path d="M2.5 8.2 8 11.2l5.5-3M2.5 10.8 8 13.8l5.5-3" />
        </svg>
      );
    case "market":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <circle cx="8" cy="8" r="5.8" />
          <path d="M8 2.2v11.6M2.2 8h11.6M3.8 3.8l8.4 8.4M12.2 3.8l-8.4 8.4" />
        </svg>
      );
    case "intelligence":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M8 1.8c3.4 0 5.8 2.6 5.8 6.2S11.4 14.2 8 14.2 2.2 11.6 2.2 8 4.6 1.8 8 1.8Z" />
          <path d="M6.2 10.4c.8-.3 1.7-.3 2.5 0M6.2 6.2h.01M9.8 6.2h.01" />
        </svg>
      );
    case "platform":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
          <path d="M2 6h12M5 13.5v-3M8 13.5v-3M11 13.5v-3" />
        </svg>
      );
    case "performance":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M2 13h12" />
          <path d="M4.5 11V7M8 11V4M11.5 11V8" />
        </svg>
      );
    case "legal":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M8 2v2.2M3 5.5h10" />
          <path d="M5 5.5v7.2M11 5.5v7.2" />
          <path d="M3 12.7h10" />
        </svg>
      );
    case "crisis":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M8 2 14 13H2L8 2z" />
          <path d="M8 6.5v3.1M8 11.4h.01" />
        </svg>
      );
    case "analytics":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <path d="M2 13h12" />
          <path d="m3.5 10 3-3 2 2 4-5" />
        </svg>
      );
    case "reports":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <rect x="2.5" y="2" width="11" height="12" rx="1.5" />
          <path d="M5 5.5h6M5 8h6M5 10.5h4" />
        </svg>
      );
    case "access":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <rect x="2.5" y="7" width="11" height="7" rx="1.5" />
          <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
          <path d="M8 9.5v2" />
        </svg>
      );
    case "audit":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <circle cx="8" cy="8" r="5.8" />
          <path d="M8 4.8v3.4l2.3 1.4" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <circle cx="8" cy="8" r="2.3" />
          <path d="M8 1.6v2M8 12.4v2M1.6 8h2M12.4 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 16 16" className={className}>
          <circle cx="8" cy="8" r="2.5" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.41 1.41M3.05 12.95l1.42-1.41M11.54 4.46l1.41-1.41" />
        </svg>
      );
  }
}
