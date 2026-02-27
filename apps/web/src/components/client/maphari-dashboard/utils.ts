/**
 * Client dashboard utilities — re-exports from the shared foundation.
 *
 * All formatting functions are defined in @/lib/utils/* and re-exported
 * here so existing page-level imports continue to work unchanged.
 */
import { formatMoneyCents } from "../../../lib/i18n/currency";

// ─── Date formatting ───
export { formatDateShort, formatDateLong, formatRelative, isPast } from "@/lib/utils/format-date";

// ─── Status / text formatting ───
export { formatStatus, capitalize, getInitials } from "@/lib/utils/format-status";

// ─── Client-specific formatMoney with zero decimal places ───

/** Format cents as currency with no decimal digits */
export function formatMoney(amountCents: number, currency = "AUTO"): string {
  return formatMoneyCents(amountCents, {
    currency: currency === "AUTO" ? null : currency,
    maximumFractionDigits: 0
  });
}
