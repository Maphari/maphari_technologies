/**
 * Admin dashboard shared utilities and components.
 *
 * Core implementations live in the shared foundation (@/lib/utils/*
 * and @/components/shared/ui/*). This file re-exports them under
 * their original names so existing admin page imports work unchanged.
 */
import type { ReactNode } from "react";
import { styles } from "../style";
import type { LeadPipelineStatus } from "../../../../lib/api/admin";

// ─── Re-export shared formatting ───

export { formatDateLong as formatDate } from "@/lib/utils/format-date";
export { formatMoney } from "@/lib/utils/format-money";

// ─── Re-export shared UI components under original admin names ───

export { DashboardTabs as AdminTabs } from "@/components/shared/ui/tabs";
export { DashboardFilterBar as AdminFilterBar } from "@/components/shared/ui/filter-bar";

// ─── EmptyState with admin CSS module pre-bound ───

import { EmptyState as SharedEmptyState } from "@/components/shared/ui/empty-state";

/** Empty-state component pre-bound to the admin dashboard CSS module */
export function EmptyState(props: {
  title: string;
  subtitle?: string;
  compact?: boolean;
  variant?: "data" | "message" | "security";
}) {
  return <SharedEmptyState {...props} styles={styles} />;
}

// ─── Domain-specific logic (not shared) ───

/** Return the valid next pipeline statuses for a given lead status */
export function nextStatuses(current: LeadPipelineStatus): LeadPipelineStatus[] {
  switch (current) {
    case "NEW":
      return ["CONTACTED", "QUALIFIED"];
    case "CONTACTED":
      return ["QUALIFIED", "LOST"];
    case "QUALIFIED":
      return ["PROPOSAL", "LOST"];
    case "PROPOSAL":
      return ["WON", "LOST"];
    default:
      return [];
  }
}
