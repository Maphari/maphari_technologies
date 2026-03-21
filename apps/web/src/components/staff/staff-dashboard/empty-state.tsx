"use client";
import React from "react";
import { cx } from "./style";

interface StaffEmptyStateProps {
  /** SVG icon node shown in the circle (16–20px works best) */
  icon?: React.ReactNode;
  title: string;
  sub?: string;
  /** Optional CTA button label */
  action?: string;
  onAction?: () => void;
}

/** Unified empty state used across all staff dashboard pages */
export function StaffEmptyState({
  icon,
  title,
  sub,
  action,
  onAction,
}: StaffEmptyStateProps) {
  return (
    <div className={cx("emptyState")}>
      <div className={cx("emptyStateIcon")} aria-hidden="true">
        {icon ?? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="9" r="7.5"/>
            <path d="M9 5.5v4l2.5 1.5"/>
          </svg>
        )}
      </div>
      <div className={cx("emptyStateTitle")}>{title}</div>
      {sub && <div className={cx("emptyStateSub")}>{sub}</div>}
      {action && onAction && (
        <button type="button" className={cx("emptyStateAction")} onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

// ── Preset icon helpers (stroke-based, 18px) ─────────────────────────────────

const ic = (path: React.ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

export const EmptyIcons = {
  inbox:     ic(<><path d="M2 9h4l2 3h2l2-3h4"/><path d="M2.5 5.5h13a1 1 0 011 1v7a1 1 0 01-1 1h-13a1 1 0 01-1-1v-7a1 1 0 011-1z"/></>),
  tasks:     ic(<><rect x="3" y="3" width="12" height="12" rx="1.5"/><path d="M6.5 9l2 2 3-3"/></>),
  chart:     ic(<><rect x="2" y="9" width="3" height="7" rx="0.75"/><rect x="7.5" y="5.5" width="3" height="10.5" rx="0.75"/><rect x="13" y="2" width="3" height="14" rx="0.75"/></>),
  users:     ic(<><circle cx="6" cy="5.5" r="2.5"/><path d="M1 15.5c0-3 2.2-5 5-5"/><circle cx="12" cy="5.5" r="2"/><path d="M17 15.5c0-2.5-2-4.5-5-4.5"/></>),
  file:      ic(<><path d="M10.5 2H4.5a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 004.5 16h9A1.5 1.5 0 0015 14.5V6.5L10.5 2z"/><path d="M10 2v5h5"/><path d="M6.5 10h5M6.5 13h3"/></>),
  clock:     ic(<><circle cx="9" cy="9" r="7"/><path d="M9 5.5V9l3 1.5"/></>),
  search:    ic(<><circle cx="8" cy="8" r="5.5"/><path d="M13 13l3 3"/></>),
  bell:      ic(<><path d="M9 2a5 5 0 00-5 5v3l-1.5 2.5h13L14 10V7a5 5 0 00-5-5z"/><path d="M7 14.5a2 2 0 004 0"/></>),
  check:     ic(<><circle cx="9" cy="9" r="7"/><path d="M6 9l2 2 4-4"/></>),
  building:  ic(<><rect x="2.5" y="5" width="13" height="11" rx="1"/><path d="M6 16V9h6v7"/><rect x="7" y="2" width="4" height="3" rx="0.75"/><path d="M6.5 11.5h1M10.5 11.5h1M6.5 13.5h1M10.5 13.5h1"/></>),
  shield:    ic(<path d="M9 2L3 4.5v4.5c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V4.5L9 2z"/>),
  notes:     ic(<><path d="M14 2H4a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1z"/><path d="M5.5 6.5h7M5.5 9.5h7M5.5 12.5h4"/></>),
} as const;
