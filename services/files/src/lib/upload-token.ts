import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

interface UploadTokenPayload {
  clientId: string;
  storageKey: string;
  expiresAt: number;
  nonce: string;
}

interface CreateUploadTokenInput {
  clientId: string;
  storageKey: string;
  ttlSeconds: number;
  secret: string;
}

function toBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

/**
 * Signed upload tokens allow direct upload URLs while preventing
 * tenant key tampering and expired upload confirmations.
 */
export function createUploadToken(input: CreateUploadTokenInput): string {
  const payload: UploadTokenPayload = {
    clientId: input.clientId,
    storageKey: input.storageKey,
    expiresAt: Date.now() + input.ttlSeconds * 1000,
    nonce: randomUUID()
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, input.secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyUploadToken(token: string, secret: string): UploadTokenPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload, secret);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as UploadTokenPayload;
    if (!parsed.clientId || !parsed.storageKey || !parsed.expiresAt || !parsed.nonce) return null;
    if (parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
