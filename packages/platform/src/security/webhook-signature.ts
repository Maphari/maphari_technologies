import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Creates a stable SHA-256 signature for webhook bodies.
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verifies a webhook signature using timing-safe comparison.
 */
export function verifyWebhookSignature(payload: string, providedSignature: string, secret: string): boolean {
  const expected = signWebhookPayload(payload, secret);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}
