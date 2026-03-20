/**
 * Thin currency-formatting wrapper around the core formatMoneyCents utility.
 *
 * Unifies the admin and client formatMoney helpers that both delegate
 * to formatMoneyCents with slightly different options.
 */
import { formatMoneyCents } from "@/lib/i18n/currency";

/** Format an amount in cents as a currency string — e.g. formatMoney(150000, "ZAR") → "R1,500.00" */
export function formatMoney(
  amountCents: number,
  currency = "AUTO",
  options?: { maximumFractionDigits?: number; minimumFractionDigits?: number }
): string {
  return formatMoneyCents(amountCents, {
    currency: currency === "AUTO" ? null : currency,
    ...options
  });
}

/** Abbreviate cents to a compact KPI label — e.g. 8_400_000 → "R84k" */
export function formatMoneyK(cents: number): string {
  return `R${(cents / 100_000).toFixed(0)}k`;
}
