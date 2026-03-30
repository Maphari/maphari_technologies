import { describe, it, expect } from "vitest";
import { encryptField, decryptField } from "../lib/integration-crypto.js";

// 32 random bytes as base64
const VALID_KEY = Buffer.alloc(32, 0xab).toString("base64");
const WRONG_KEY  = Buffer.alloc(32, 0xcd).toString("base64");
const BAD_KEY    = Buffer.alloc(16, 0x01).toString("base64"); // 16 bytes — wrong length
const AAD        = "userPreference/user-1:gcal_access_token/gcal_access_token/v1";

describe("encryptField", () => {
  it("output always starts with 'v1:'", () => {
    expect(encryptField("hello", VALID_KEY, AAD)).toMatch(/^v1:/);
  });

  it("produces different ciphertexts each call (IV is random)", () => {
    const a = encryptField("hello", VALID_KEY, AAD);
    const b = encryptField("hello", VALID_KEY, AAD);
    expect(a).not.toBe(b);
  });

  it("throws on wrong key length", () => {
    expect(() => encryptField("hello", BAD_KEY, AAD)).toThrow(/32 bytes/);
  });
});

describe("decryptField", () => {
  it("round-trip returns original value", () => {
    const enc = encryptField("secret-token", VALID_KEY, AAD);
    expect(decryptField(enc, VALID_KEY, AAD)).toBe("secret-token");
  });

  it("throws when AAD differs (cross-field protection)", () => {
    const enc = encryptField("secret-token", VALID_KEY, AAD);
    const wrongAad = "userPreference/user-1:gcal_refresh_token/gcal_refresh_token/v1";
    expect(() => decryptField(enc, VALID_KEY, wrongAad)).toThrow();
  });

  it("throws when key differs", () => {
    const enc = encryptField("secret-token", VALID_KEY, AAD);
    expect(() => decryptField(enc, WRONG_KEY, AAD)).toThrow();
  });

  it("throws on wrong key length", () => {
    const enc = encryptField("secret-token", VALID_KEY, AAD);
    expect(() => decryptField(enc, BAD_KEY, AAD)).toThrow(/32 bytes/);
  });

  it("throws if value does not start with 'v1:'", () => {
    expect(() => decryptField("plaintext-no-prefix", VALID_KEY, AAD)).toThrow(/v1:/);
  });

  it("throws on malformed base64url envelope (not valid JSON)", () => {
    const bad = "v1:" + Buffer.from("not-json!!!").toString("base64url");
    expect(() => decryptField(bad, VALID_KEY, AAD)).toThrow();
  });

  it("throws on envelope missing 'iv' field", () => {
    const payload = Buffer.from(JSON.stringify({ ciphertext: "aaa", tag: "bbb" })).toString("base64url");
    expect(() => decryptField("v1:" + payload, VALID_KEY, AAD)).toThrow();
  });

  it("throws on envelope missing 'ciphertext' field", () => {
    const payload = Buffer.from(JSON.stringify({ iv: "aaa", tag: "bbb" })).toString("base64url");
    expect(() => decryptField("v1:" + payload, VALID_KEY, AAD)).toThrow();
  });

  it("throws on envelope missing 'tag' field", () => {
    const payload = Buffer.from(JSON.stringify({ iv: "aaa", ciphertext: "bbb" })).toString("base64url");
    expect(() => decryptField("v1:" + payload, VALID_KEY, AAD)).toThrow();
  });

  it("does not include plaintext in thrown error message", () => {
    const enc = encryptField("super-secret-value", VALID_KEY, AAD);
    let threw = false;
    try {
      decryptField(enc, WRONG_KEY, AAD);
    } catch (e) {
      threw = true;
      expect(String(e)).not.toContain("super-secret-value");
    }
    expect(threw).toBe(true);
  });
});
