import { describe, it, expect } from "vitest";
import {
  encryptMetadataSecrets,
  decryptMetadataSecrets,
  validateConfigSummary,
} from "../lib/integration-secret-registry.js";

const KEY = Buffer.alloc(32, 0xaa).toString("base64");
const CONNECTION_ID = "conn-abc-123";

describe("encryptMetadataSecrets", () => {
  it("encrypts only secret-registry fields", () => {
    const metadata = { bot_token: "tok-secret", channel_id: "C123" };
    const result = encryptMetadataSecrets("slack", metadata, KEY, CONNECTION_ID);
    expect(result.bot_token).toMatch(/^v1:/);
    expect(result.channel_id).toBe("C123"); // non-secret unchanged
  });

  it("leaves metadata untouched for unknown provider (empty registry)", () => {
    const metadata = { some_key: "value" };
    const result = encryptMetadataSecrets("unknown_provider", metadata, KEY, CONNECTION_ID);
    expect(result.some_key).toBe("value");
  });

  it("leaves out non-present secret keys", () => {
    const metadata = { channel_id: "C123" }; // bot_token absent
    const result = encryptMetadataSecrets("slack", metadata, KEY, CONNECTION_ID);
    expect(Object.keys(result)).toEqual(["channel_id"]);
  });
});

describe("decryptMetadataSecrets", () => {
  it("decrypted secret fields return null in API view", () => {
    const metadata = { bot_token: "tok-secret", channel_id: "C123" };
    const encrypted = encryptMetadataSecrets("slack", metadata, KEY, CONNECTION_ID);
    const { internal, apiView } = decryptMetadataSecrets("slack", encrypted, KEY, CONNECTION_ID);
    expect(internal.bot_token).toBe("tok-secret");
    expect(apiView.bot_token).toBeNull();
    expect(apiView.channel_id).toBe("C123");
  });

  it("decrypt failure sets CREDENTIAL_UNAVAILABLE internally and omits field from apiView", () => {
    const metadata = { bot_token: "v1:BADDATA", channel_id: "C123" };
    const { internal, apiView } = decryptMetadataSecrets("slack", metadata, KEY, CONNECTION_ID);
    expect(internal.bot_token).toBe("CREDENTIAL_UNAVAILABLE");
    expect(Object.keys(apiView)).not.toContain("bot_token");
    expect(apiView.channel_id).toBe("C123"); // non-secret still present
  });

  it("absent secret fields omitted from both internal and apiView", () => {
    const metadata = { channel_id: "C123" };
    const { internal, apiView } = decryptMetadataSecrets("slack", metadata, KEY, CONNECTION_ID);
    expect(Object.keys(internal)).not.toContain("bot_token");
    expect(Object.keys(apiView)).not.toContain("bot_token");
  });

  it("plaintext secret (migration window) returns null in apiView", () => {
    const metadata = { bot_token: "plaintext-no-v1-prefix", channel_id: "C123" };
    const { internal, apiView } = decryptMetadataSecrets("slack", metadata, KEY, CONNECTION_ID);
    expect(internal.bot_token).toBe("plaintext-no-v1-prefix");
    expect(apiView.bot_token).toBeNull();
  });
});

describe("validateConfigSummary", () => {
  it("passes when all keys are allowlisted", () => {
    expect(() =>
      validateConfigSummary("gcal", { calendar_id: "abc", sync_enabled: true })
    ).not.toThrow();
  });

  it("returns 422-shaped error when unknown key present", () => {
    const result = validateConfigSummary("gcal", { calendar_id: "abc", secret_key: "bad" });
    expect(result).toMatchObject({
      unknownKeys: ["secret_key"],
      allowedKeys: expect.arrayContaining(["calendar_id"]),
    });
  });

  it("rejects any key for unknown provider (empty allowlist)", () => {
    const result = validateConfigSummary("unknown_provider", { anything: "val" });
    expect(result).toMatchObject({ unknownKeys: ["anything"] });
  });

  it("allows empty configurationSummary object for any provider", () => {
    expect(validateConfigSummary("gcal", {})).toBeNull();
  });
});
