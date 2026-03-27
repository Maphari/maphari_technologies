import { createHash } from "node:crypto";

/**
 * PayFast endpoint — sandbox for development, production for live payments.
 * Switch by setting NODE_ENV="production".
 */
export const PAYFAST_ENDPOINT =
  process.env.NODE_ENV === "production"
    ? "https://www.payfast.co.za/eng/process"
    : "https://sandbox.payfast.co.za/eng/process";

/**
 * Generates the MD5 signature for a PayFast payment.
 *
 * Algorithm:
 * 1. Remove undefined / empty-string fields and the `signature` key itself.
 * 2. Preserve the field order exactly as supplied.
 * 3. URL-encode each trimmed value (replacing %20 with +), join as query string.
 * 4. If PAYFAST_PASSPHRASE is set, append `&passphrase=<encoded>`.
 * 5. MD5-hash the result → lowercase hex string.
 */
export function generateSignature(fields: Record<string, string | undefined>): string {
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";

  const params = Object.entries(fields)
    .filter(([k, v]) => k !== "signature" && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent((v as string).trim()).replace(/%20/g, "+")}`)
    .join("&");

  const base = passphrase
    ? `${params}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`
    : params;

  return createHash("md5").update(base).digest("hex");
}

/**
 * Verifies an inbound PayFast ITN signature.
 * Returns true only when the computed signature matches the one in the body.
 */
export function verifyItnSignature(body: Record<string, string>): boolean {
  const { signature, ...rest } = body;
  if (!signature) return false;
  const computed = generateSignature(rest as Record<string, string>);
  return computed === signature.toLowerCase();
}

/**
 * Converts a cents integer to a 2-decimal ZAR string suitable for PayFast.
 * Example: 150000 → "1500.00"
 */
export function centsToZar(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

/**
 * PayFast sandbox rejects `localhost` URLs in request payloads.
 * For local development we normalize them to 127.0.0.1 without touching
 * production hosts or malformed values that the caller should inspect.
 */
export function normalizePayfastUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost") {
      parsed.hostname = "127.0.0.1";
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Parses a PayFast amount_gross string ("1500.00") back to integer cents.
 * Uses Math.round to avoid floating-point drift.
 */
export function zarToCents(amountGross: string): number {
  return Math.round(parseFloat(amountGross) * 100);
}
