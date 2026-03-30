import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret } from "../lib/crypto.js";

describe("encryptSecret / decryptSecret", () => {
  const KEY = Buffer.from("a".repeat(64), "hex").toString("base64"); // 32-byte base64

  it("round-trips a secret correctly", () => {
    const original = "sk_abc123def456";
    const encrypted = encryptSecret(original, KEY);
    const decrypted = decryptSecret(encrypted, KEY);
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext on each call (unique IV)", () => {
    const secret = "sk_same_secret";
    const enc1 = encryptSecret(secret, KEY);
    const enc2 = encryptSecret(secret, KEY);
    expect(enc1).not.toBe(enc2);
  });

  it("encrypted output is a valid JSON string with iv, ciphertext, tag fields", () => {
    const encrypted = encryptSecret("sk_test", KEY);
    const parsed = JSON.parse(Buffer.from(encrypted, "base64url").toString("utf8"));
    expect(parsed).toHaveProperty("iv");
    expect(parsed).toHaveProperty("ciphertext");
    expect(parsed).toHaveProperty("tag");
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encryptSecret("sk_test", KEY);
    const parsed = JSON.parse(Buffer.from(encrypted, "base64url").toString("utf8"));
    parsed.ciphertext = "tampered";
    const tampered = Buffer.from(JSON.stringify(parsed)).toString("base64url");
    expect(() => decryptSecret(tampered, KEY)).toThrow();
  });

  it("throws on wrong key", () => {
    const KEY2 = Buffer.from("b".repeat(64), "hex").toString("base64");
    const encrypted = encryptSecret("sk_test", KEY);
    expect(() => decryptSecret(encrypted, KEY2)).toThrow();
  });
});
