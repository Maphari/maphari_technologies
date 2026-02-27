/**
 * Shared date-formatting utilities for all dashboards.
 *
 * Consolidates duplicated helpers from staff/utils.ts, client/utils.ts,
 * and admin/shared.tsx into a single source of truth.
 */

/** Short date display — e.g. "Jan 15" */
export function formatDateShort(value?: string | null, fallback = "TBD"): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(date);
}

/** Long date display — e.g. "Jan 15, 2025" */
export function formatDateLong(value?: string | null, fallback = "TBD"): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

/** Date with time — e.g. "Jan 15, 2025, 02:30 PM" */
export function formatDateTime(value?: string | null, fallback = "N/A"): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

/** Relative time — "5m ago", "3h ago", "2d ago", falls back to short date after 7 days */
export function formatRelative(value?: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateShort(value);
}

/** Check whether a date string refers to a moment in the past */
export function isPast(dateValue: string | null): boolean {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

/** Get the Monday (start) of the week containing the given date */
export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
