"use client";

/**
 * Staff dashboard UI components.
 *
 * Shared components (ToggleRow, ActivityRow, TimeEntry) are imported from
 * the shared foundation and re-exported with the staff CSS module pre-bound.
 * NavIcon is extracted to nav-icon.tsx and re-exported for backward compat.
 */
import { styles } from "./style";

// ─── Shared UI components, pre-bound to staff styles ───

import { ToggleRow as SharedToggleRow } from "@/components/shared/ui/toggle-row";
import { ActivityRow as SharedActivityRow } from "@/components/shared/ui/activity-row";
import { TimeEntry as SharedTimeEntry } from "@/components/shared/ui/time-entry";

/** Toggle switch row — staff styles pre-bound */
export function ToggleRow(props: Omit<Parameters<typeof SharedToggleRow>[0], "styles">) {
  return <SharedToggleRow {...props} styles={styles} />;
}

/** Activity feed row — staff styles pre-bound */
export function ActivityRow(props: Omit<Parameters<typeof SharedActivityRow>[0], "styles">) {
  return <SharedActivityRow {...props} styles={styles} />;
}

/** Time log entry row — staff styles pre-bound */
export function TimeEntry(props: Omit<Parameters<typeof SharedTimeEntry>[0], "styles">) {
  return <SharedTimeEntry {...props} styles={styles} />;
}

// ─── Staff-specific NavIcon (re-exported from nav-icon.tsx) ───

export { NavIcon } from "./nav-icon";
