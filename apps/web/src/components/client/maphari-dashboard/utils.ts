/**
 * Client dashboard utilities — re-exports from the shared foundation.
 */

export { formatDateShort, formatDateLong, formatRelative, startOfWeek } from "@/lib/utils/format-date";
export { formatStatus, capitalize } from "@/lib/utils/format-status";
export { clamp, estimateMinutes, formatDuration, formatTimer } from "@/lib/utils/format-time";
export { formatMoney } from "@/lib/utils/format-money";

import { getInitials as _getInitials } from "@/lib/utils/format-status";

/** Extract initials from a name — client default fallback is "C" */
export function getInitials(value: string): string {
  return _getInitials(value, "C");
}

/** Map a project status to a display tone */
export function statusTone(status: string): "green" | "accent" | "amber" | "red" | "muted" {
  const s = status.toUpperCase();
  if (s === "COMPLETED" || s === "DELIVERED") return "green";
  if (s === "ACTIVE" || s === "IN_PROGRESS") return "accent";
  if (s === "ON_HOLD" || s === "PAUSED" || s === "PENDING") return "amber";
  if (s === "CANCELLED" || s === "OVERDUE" || s === "AT_RISK") return "red";
  return "muted";
}

/** Map a progress percentage to a display tone */
export function progressTone(percent: number): "green" | "accent" | "amber" | "red" {
  if (percent >= 75) return "green";
  if (percent >= 40) return "accent";
  if (percent >= 20) return "amber";
  return "red";
}

/** Map a due date to a display tone */
export function dueTone(dueAt: string | null): "red" | "amber" | "muted" {
  if (!dueAt) return "muted";
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff < 0) return "red";
  if (diff < 7 * 86400000) return "amber";
  return "muted";
}

/** Generate deterministic avatar background from seed string */
export function avatarBg(seed: string): string {
  const colors = [
    "rgba(200,241,53,0.16)",
    "rgba(52,217,139,0.16)",
    "rgba(245,166,35,0.16)",
    "rgba(91,156,245,0.16)",
    "rgba(91,156,245,0.16)",
    "rgba(255,95,95,0.16)",
    "rgba(100,217,204,0.16)",
    "rgba(250,200,60,0.16)"
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/** Case-insensitive search match */
export function matchesSearch(text: string, query: string): boolean {
  if (!query) return true;
  return text.toLowerCase().includes(query.toLowerCase());
}

/** Check if an ISO date is within a given range from now */
export function isWithinRange(dateStr: string | null, range: "7d" | "30d" | "90d" | "all"): boolean {
  if (range === "all" || !dateStr) return true;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return true;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return Date.now() - date.getTime() < days * 86400000;
}

/** Format file size bytes to human readable string */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
