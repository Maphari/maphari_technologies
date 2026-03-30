import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const PREFIX    = "v1:";

function loadKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY must decode to 32 bytes");
  }
  return key;
}

/**
 * Encrypts plaintext and returns a "v1:<base64url-JSON>" envelope.
 * @param aad  Stable context string: "{entityType}/{entityId}/{fieldName}/v1"
 * @throws if base64Key does not decode to 32 bytes
 */
export function encryptField(
  plaintext: string,
  base64Key: string,
  aad: string,
): string {
  const key        = loadKey(base64Key);
  const iv         = randomBytes(12); // 96-bit IV for GCM
  const cipher     = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag        = cipher.getAuthTag();
  const payload    = JSON.stringify({
    iv:         iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    tag:        tag.toString("base64"),
  });
  return PREFIX + Buffer.from(payload).toString("base64url");
}

/**
 * Decrypts a "v1:<base64url-JSON>" envelope.
 * @param aad  Must match the value used at encryption time exactly.
 * @throws if value does not start with "v1:", envelope is malformed,
 *         auth tag fails, key length wrong, or any other crypto error.
 *         Never returns partial data.
 */
export function decryptField(
  encrypted: string,
  base64Key: string,
  aad: string,
): string {
  if (!encrypted.startsWith(PREFIX)) {
    throw new Error(`decryptField: value must start with '${PREFIX}'`);
  }
  const key     = loadKey(base64Key);
  const raw     = encrypted.slice(PREFIX.length);
  let payload: { iv: string; ciphertext: string; tag: string };
  try {
    payload = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as typeof payload;
  } catch {
    throw new Error("decryptField: malformed envelope (JSON parse failed)");
  }
  if (!payload.iv || !payload.ciphertext || !payload.tag) {
    throw new Error("decryptField: envelope missing required fields (iv, ciphertext, tag)");
  }
  const iv         = Buffer.from(payload.iv, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const tag        = Buffer.from(payload.tag, "base64");
  if (iv.length !== 12) throw new Error("decryptField: invalid IV length (expected 12 bytes)");
  if (tag.length !== 16) throw new Error("decryptField: invalid tag length (expected 16 bytes)");
  const decipher   = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
