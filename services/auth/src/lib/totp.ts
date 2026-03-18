/**
 * TOTP (Time-based One-Time Password) — RFC 6238 implementation.
 *
 * Pure Node.js crypto — no external dependencies beyond `qrcode` for QR rendering.
 * Compatible with Google Authenticator, Authy, 1Password, Microsoft Authenticator, etc.
 */

import { createHmac, randomBytes } from "node:crypto";
import QRCode from "qrcode";

const ISSUER      = "Maphari Technologies";
const DIGITS      = 6;
const PERIOD      = 30;   // seconds per time step
const WINDOW      = 1;    // check ±1 step for clock skew tolerance

// ── Base32 codec ──────────────────────────────────────────────────────────────
// RFC 4648 base32 alphabet (uppercase, no padding required for decoding)

const B32_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encode random bytes as a base32 string (secret key format).
 */
function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += B32_ALPHA[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) output += B32_ALPHA[(value << (5 - bits)) & 0x1f];
  return output;
}

/**
 * Decode a base32 string (case-insensitive, strips padding) to a Buffer.
 */
function base32Decode(input: string): Buffer {
  const s = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of s) {
    const idx = B32_ALPHA.indexOf(char);
    if (idx < 0) throw new Error(`Invalid base32 char: ${char}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

// ── HOTP core ─────────────────────────────────────────────────────────────────

/**
 * Compute a HOTP value for the given counter (RFC 4226).
 */
function hotp(secretBytes: Buffer, counter: number): string {
  const counterBuf = Buffer.alloc(8);
  const hi = Math.floor(counter / 0x100000000);
  const lo = counter >>> 0;
  counterBuf.writeUInt32BE(hi, 0);
  counterBuf.writeUInt32BE(lo, 4);

  const hmac = createHmac("sha1", secretBytes).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    Math.pow(10, DIGITS);
  return code.toString().padStart(DIGITS, "0");
}

/**
 * Get the current TOTP time-step counter.
 */
function timeStep(epoch = Math.floor(Date.now() / 1000)): number {
  return Math.floor(epoch / PERIOD);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a new TOTP secret (base32-encoded, 20 bytes / 160 bits of entropy).
 */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/**
 * Build the standard otpauth:// URI for QR code generation.
 */
export function buildTotpUri(email: string, secret: string): string {
  const label = `${encodeURIComponent(ISSUER)}:${encodeURIComponent(email)}`;
  return (
    `otpauth://totp/${label}` +
    `?secret=${secret}` +
    `&issuer=${encodeURIComponent(ISSUER)}` +
    `&algorithm=SHA1&digits=${DIGITS}&period=${PERIOD}`
  );
}

/**
 * Render an otpauth URI as a base64 PNG data URL for embedding in <img src>.
 */
export async function generateQrDataUrl(totpUri: string): Promise<string> {
  return QRCode.toDataURL(totpUri, {
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

/**
 * Verify a 6-digit TOTP code against a stored base32 secret.
 * Checks current step ±WINDOW steps to handle clock skew.
 */
export function verifyTotpCode(code: string, secret: string): boolean {
  const token = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) return false;

  let secretBytes: Buffer;
  try {
    secretBytes = base32Decode(secret);
  } catch {
    return false;
  }

  const step = timeStep();
  for (let delta = -WINDOW; delta <= WINDOW; delta++) {
    if (hotp(secretBytes, step + delta) === token) return true;
  }
  return false;
}

/**
 * Generate 8 one-time backup codes (format: XXXX-XXXX, uppercase hex).
 */
export function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () => {
    const hex = randomBytes(4).toString("hex").toUpperCase();
    return `${hex.slice(0, 4)}-${hex.slice(4)}`;
  });
}
