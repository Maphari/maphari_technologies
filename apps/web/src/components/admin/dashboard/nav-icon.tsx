/**
 * Admin dashboard navigation icon component.
 *
 * Maps each admin PageId to a unique SVG icon. Uses stroke-based style
 * (fill="none", stroke="currentColor") matching client/staff dashboards.
 */
import type { PageId } from "./config";

export function NavIcon({ id, className }: { id: PageId; className: string }) {
  switch (id) {
    case "executive":
    case "dashboard":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
          <rect x="9" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
          <rect x="1" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
          <rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "leads":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M7 4.5v5M4.5 7h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "clients":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <circle cx="6" cy="4.5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 13c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="11.5" cy="5.5" r="1.7" stroke="currentColor" strokeWidth="1.2" />
          <path d="M14.5 12.5c0-1.7-1.3-3-3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "projects":
    case "portfolio":
    case "bizdev":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M2 4.5V13h12V4.5H2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M2 4.5l2-2.5h4l2 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 7.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "resources":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M3 10V6M7 10V4M11 10V7M14 10V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "gantt":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="3" y="2" width="4" height="2" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="6" y="7" width="5" height="2" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="9" y="12" width="4" height="2" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case "qa":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M8 1.5L2.5 4v4c0 3.5 2.4 5.8 5.5 6.5 3.1-.7 5.5-3 5.5-6.5V4L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "sla":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 4.5v3.8l2.4 1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "experience":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M8 13s-4.8-2.8-4.8-6.2A2.8 2.8 0 0 1 8 5a2.8 2.8 0 0 1 4.8 1.8C12.8 10.2 8 13 8 13Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "onboarding":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 5l1.3 1.3L9 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 8.5l1.3 1.3L9 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "offboarding":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M14 8H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="m8 5-3 3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "satisfaction":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5.5 9.8c.6.8 1.5 1.2 2.5 1.2s1.9-.4 2.5-1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="6" cy="6.8" r="0.8" fill="currentColor" />
          <circle cx="10" cy="6.8" r="0.8" fill="currentColor" />
        </svg>
      );
    case "comms":
    case "messages":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M2 2.5h8v6H5.5L3 10.5V8.5H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M10 5.5h4v6h-1v2l-2.5-2H7v-3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "vault":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 6h6M5 8h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "referrals":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M4 6h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="m9 3 3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 10H4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="m7 7-3 3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "interventions":
    case "crisis":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M8 2 14 13H2L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M8 6.2v3.3M8 11.4h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "invoices":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 5h6M5 8h4M5 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "revops":
    case "revenueForecasting":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M2 12.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="m3.5 10.5 3-3 2 2 4-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12.5" cy="4.5" r="1" fill="currentColor" />
        </svg>
      );
    case "pricing":
    case "profitability":
    case "projectProfitability":
    case "cashflow":
    case "payroll":
    case "fyCloseout":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M8 2v12M10.8 4.6c-.5-.8-1.4-1.3-2.8-1.3-1.6 0-2.7.8-2.7 2 0 1.3 1 1.8 2.8 2.1 1.8.3 2.7.8 2.7 2.1 0 1.2-1.1 2-2.7 2-1.5 0-2.5-.4-3.1-1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "expenses":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <rect x="2.5" y="2" width="11" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 5h6M5 7.5h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "vendors":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 6.5h12M6 3v10M10 3v10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M8 2a4.5 4.5 0 0 0-4.5 4.5V10l-1 2h11l-1-2V6.5A4.5 4.5 0 0 0 8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M6.2 13a2 2 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <circle cx="6" cy="4.5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 13c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="11.5" cy="5.5" r="1.7" stroke="currentColor" strokeWidth="1.2" />
          <path d="M14.5 12.5c0-1.7-1.3-3-3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "automation":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M6 2h4v4H6zM2 10h4v4H2zM10 10h4v4h-4z" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 6v2M6 10H4M10 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "integrations":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="m5.5 5.5-2.8 2.8 2.8 2.8M10.5 5.5l2.8 2.8-2.8 2.8M9 3.5 7 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "owner":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="m10.7 2.2.8.8 1.3-.2-.2 1.3.8.8-1.2.2-.6 1-.6-1-1.2-.2.8-.8-.2-1.3 1.3.2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      );
    case "brand":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M8 2.5 2.5 5.5 8 8.5l5.5-3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M2.5 8.2 8 11.2l5.5-3M2.5 10.8 8 13.8l5.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "market":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 2.2v11.6M2.2 8h11.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M3.8 3.8c2.4 1.2 5.2 1.2 8.4 0M3.8 12.2c2.4-1.2 5.2-1.2 8.4 0" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case "intelligence":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M8 2.2a4.8 4.8 0 0 0-3 8.5V13h6v-2.3A4.8 4.8 0 0 0 8 2.2Z" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6 14.2h4M6.6 15.4h2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "platform":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <rect x="2" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 6h12" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 13.5v-3M8 13.5v-3M11 13.5v-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "performance":
    case "teamPerformanceReport":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M2 13h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M3 11.5L6.2 8.6L8.5 10.3L12.8 5.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12.8" cy="5.7" r="1" fill="currentColor" />
        </svg>
      );
    case "portfolioRiskRegister":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M8 1.5L2.5 4v4c0 3.5 2.4 5.8 5.5 6.5 3.1-.7 5.5-3 5.5-6.5V4L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M8 6v3M8 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "healthScorecard":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M2 9.5h2l1.4-3 2.2 5 1.9-4H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "legal":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M8 2v2.2M3 5.5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M5 5.5v7.2M11 5.5v7.2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M3 12.7h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "analytics":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M2 13h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="m3.5 10 3-3 2 2 4-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "reports":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <path d="M2 13.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <rect x="3" y="9" width="2.2" height="4.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="6.9" y="5.5" width="2.2" height="8" stroke="currentColor" strokeWidth="1.2" />
          <rect x="10.8" y="2.5" width="2.2" height="11" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case "access":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <rect x="2.5" y="7" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M8 9.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "audit":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 4.8v3.4l2.3 1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <circle cx="8" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 1.6v2M8 12.4v2M1.6 8h2M12.4 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className}>
          <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.41 1.41M3.05 12.95l1.42-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
  }
}
