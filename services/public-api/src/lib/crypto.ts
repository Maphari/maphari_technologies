import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function loadKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) {
    throw new Error("API_KEY_ENCRYPTION_KEY must be a 32-byte base64 string");
  }
  return key;
}

export function encryptSecret(plaintext: string, base64Key: string): string {
  const key = loadKey(base64Key);
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = JSON.stringify({
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    tag: tag.toString("base64"),
  });
  return Buffer.from(payload).toString("base64url");
}

export function decryptSecret(encrypted: string, base64Key: string): string {
  const key = loadKey(base64Key);
  const payload = JSON.parse(Buffer.from(encrypted, "base64url").toString("utf8")) as {
    iv: string;
    ciphertext: string;
    tag: string;
  };
  const iv = Buffer.from(payload.iv, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
