import type { PageId } from "./types";

export function NavIcon({ id, className }: { id: PageId; className: string }) {
  /* dashboard ─ 2×2 grid, bottom-right accent-filled panel */
  if (id === "dashboard") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1.5" y="1.5" width="5.5" height="5.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="1.5" width="5.5" height="5.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1.5" y="9" width="5.5" height="5.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="9" width="5.5" height="5.5" fill="currentColor" fillOpacity="0.28" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }

  /* reports ─ ascending bar chart with baseline */
  if (id === "reports") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 14h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="2.5" y="9.5" width="2.5" height="4.5" rx="0.5" fill="currentColor" fillOpacity="0.42" />
        <rect x="6.75" y="6" width="2.5" height="8" rx="0.5" fill="currentColor" fillOpacity="0.7" />
        <rect x="11" y="2.5" width="2.5" height="11.5" rx="0.5" fill="currentColor" />
      </svg>
    );
  }

  /* ai ─ CPU chip with edge pins */
  if (id === "ai") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="4.5" y="4.5" width="7" height="7" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M7 2.5V4.5M9 2.5V4.5M7 11.5V13.5M9 11.5V13.5
             M2.5 7H4.5M2.5 9H4.5M11.5 7H13.5M11.5 9H13.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <rect x="7" y="7" width="2" height="2" fill="currentColor" fillOpacity="0.55" />
      </svg>
    );
  }

  /* onboarding ─ rounded rect with bold checkmark */
  if (id === "onboarding") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2.5" y="2.5" width="11" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.5 8l2 2 3-4" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  /* projects ─ briefcase with handle */
  if (id === "projects") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1.5" y="6" width="13" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M1.5 10.5h13" stroke="currentColor" strokeWidth="1.1" opacity="0.42" />
        <path d="M6.5 10.5v1.5M9.5 10.5v1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.58" />
      </svg>
    );
  }

  /* milestones ─ flag on a pole */
  if (id === "milestones") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M4 1.5v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M4 2.5h8.5l-2.5 3.5L12.5 9.5H4V2.5z"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  /* create ─ plus inside a filled circle */
  if (id === "create") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6.5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      </svg>
    );
  }

  /* docs ─ document with folded corner + text lines */
  if (id === "docs") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3.5 1h7l4 4v10H3.5V1z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10.5 1v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M5.5 7.5h5M5.5 10h5M5.5 12.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.52" />
      </svg>
    );
  }

  /* invoices ─ credit card with stripe */
  if (id === "invoices") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1.5 7h13" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="9.5" width="4" height="1.5" rx="0.4" fill="currentColor" fillOpacity="0.5" />
      </svg>
    );
  }

  /* messages ─ speech bubble with text lines */
  if (id === "messages") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 2h12v9.5H9l-3 2.5v-2.5H2V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M5 6h6M5 8.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.52" />
      </svg>
    );
  }

  /* automations ─ gear / cog */
  if (id === "automations") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M8 1.5V3.5M8 12.5V14.5M14.5 8H12.5M3.5 8H1.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M12.2 3.8L10.8 5.2M5.2 10.8L3.8 12.2M12.2 12.2L10.8 10.8M5.2 5.2L3.8 3.8"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  /* team ─ two person silhouettes */
  if (id === "team") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="6" cy="5" r="2.3" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1.5 14.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="11.5" cy="5.5" r="1.8" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        <path d="M9 14.5c0-1.8 1.2-3 3-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      </svg>
    );
  }

  /* support ─ headset with mic arc */
  if (id === "support") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3 9c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="1.5" y="8.5" width="2.5" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
        <rect x="12" y="8.5" width="2.5" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
        <path d="M14.5 11.5V13a2.5 2.5 0 01-2.5 2.5H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  /* notifications ─ bell */
  if (id === "notifications") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 2a5 5 0 00-5 5v2.5L2 12h12l-1-2.5V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M6.5 13.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }

  /* settings ─ three-line equalizer / sliders */
  if (id === "settings") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="5" cy="4.5" r="1.5" fill="var(--surface, #0d0d14)" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="10" cy="8" r="1.5" fill="var(--surface, #0d0d14)" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="6" cy="11.5" r="1.5" fill="var(--surface, #0d0d14)" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }

  /* reviews ─ magnifying glass with checkmark */
  if (id === "reviews") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.2 7l1.3 1.3 2.5-2.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  /* calendar ─ calendar grid with date dots */
  if (id === "calendar") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1.5" y="3" width="13" height="11.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="5" cy="9.5" r="0.8" fill="currentColor" />
        <circle cx="8" cy="9.5" r="0.8" fill="currentColor" fillOpacity="0.5" />
        <circle cx="11" cy="9.5" r="0.8" fill="currentColor" fillOpacity="0.5" />
        <circle cx="5" cy="12" r="0.8" fill="currentColor" fillOpacity="0.5" />
        <circle cx="8" cy="12" r="0.8" fill="currentColor" />
      </svg>
    );
  }

  /* analytics ─ trending-up line chart */
  if (id === "analytics") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 13l3.5-4 3 2.5L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 4h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  /* payments ─ wallet with card slot */
  if (id === "payments") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1.5 7.5h13" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        <circle cx="11.5" cy="10" r="1" fill="currentColor" fillOpacity="0.6" />
        <path d="M4 3.5V2a1 1 0 011-1h6a1 1 0 011 1v1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      </svg>
    );
  }

  /* brand ─ paint palette with accent dot */
  if (id === "brand") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 1.5c-3.6 0-6.5 2.9-6.5 6.5 0 1.5.5 2.8 1.4 3.8.4.5 1.1.7 1.7.7H8c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5-1.5-.7-1.5-1.5 2-3.5 4.5-3.5c1.5 0 2.5.5 3 1.5.5 1 .5 2.2 0 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="5" cy="6" r="1.2" fill="currentColor" fillOpacity="0.6" />
        <circle cx="8" cy="4.5" r="1.2" fill="currentColor" fillOpacity="0.4" />
        <circle cx="11" cy="6" r="1.2" fill="currentColor" />
      </svg>
    );
  }

  /* contracts ─ scroll document with seal */
  if (id === "contracts") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M4 1.5h8a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1v-11a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.5 5h5M5.5 7.5h5M5.5 10h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.52" />
        <circle cx="11" cy="11" r="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    );
  }

  /* feedback ─ star */
  if (id === "feedback") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 1.5l2 4 4.5.7-3.25 3.2.8 4.5L8 11.7l-4.05 2.2.8-4.5L1.5 6.2 6 5.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
      </svg>
    );
  }

  /* exports ─ download arrow into tray */
  if (id === "exports") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 2v7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5 7.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.5 11v2a1 1 0 001 1h9a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  /* resources ─ open book */
  if (id === "resources") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 3.5c-1.5-1.5-4-2-6-.5v10c2-1.5 4.5-1 6 .5m0-10c1.5-1.5 4-2 6-.5v10c-2-1.5-4.5-1-6 .5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 3.5v10" stroke="currentColor" strokeWidth="1.1" opacity="0.4" />
      </svg>
    );
  }

  /* referrals ─ gift box with ribbon */
  if (id === "referrals") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2" y="6.5" width="12" height="7.5" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1" y="4" width="14" height="3" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 4v10" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 4c-1-2-3-3-4.5-2S2 5 8 4z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.1" />
        <path d="M8 4c1-2 3-3 4.5-2S14 5 8 4z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    );
  }

  /* integrations ─ puzzle piece */
  if (id === "integrations") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M9 2.5h4.5V7h-1a1.5 1.5 0 000 3h1v4.5H9v-1a1.5 1.5 0 00-3 0v1H2.5V10h1a1.5 1.5 0 000-3h-1V2.5H7v1a1.5 1.5 0 003 0v-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="currentColor" fillOpacity="0.08" />
      </svg>
    );
  }

  /* fallback ─ circle target */
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}
