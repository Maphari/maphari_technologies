/**
 * Staff dashboard utilities — re-exports from the shared foundation.
 *
 * All formatting functions are defined in @/lib/utils/* and re-exported
 * here so existing page-level imports continue to work unchanged.
 */

// ─── Date formatting ───
export { formatDateShort, formatDateLong, formatRelative, startOfWeek } from "@/lib/utils/format-date";

// ─── Status / text formatting ───
export { formatStatus, capitalize } from "@/lib/utils/format-status";

// ─── Time tracking ───
export { clamp, estimateMinutes, formatDuration, formatTimer } from "@/lib/utils/format-time";

// ─── Staff-specific getInitials with "MS" fallback ───
import { getInitials as _getInitials } from "@/lib/utils/format-status";

/** Extract initials from a name — staff default fallback is "MS" */
export function getInitials(value: string): string {
  return _getInitials(value, "MS");
}
