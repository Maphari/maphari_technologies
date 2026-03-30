# P0-4: OAuth / Integration Token Encryption at Rest

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encrypt `gcal_access_token`, `gcal_refresh_token`, and `ClientIntegrationConnection.metadata` secret fields at rest using AES-256-GCM with per-record AAD, and enforce `configurationSummary` as a non-secret surface.

**Architecture:** A new `integration-crypto.ts` module provides `encryptField`/`decryptField` (AES-256-GCM, `v1:` envelope prefix, AAD for cross-field/cross-record protection). A static provider registry declares which metadata fields are secrets and which configurationSummary keys are allowed. The core service startup validates `INTEGRATION_ENCRYPTION_KEY` for both presence and 32-byte length. A one-shot backfill script encrypts pre-existing plaintext rows using optimistic concurrency.

**Tech Stack:** Node.js `node:crypto` (AES-256-GCM), Prisma, Fastify, Vitest, TypeScript, pnpm workspaces

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `services/core/src/lib/validate-env.ts` | Create | Presence-only env validation (copy of auth pattern) |
| `services/core/src/lib/integration-crypto.ts` | Create | `encryptField` / `decryptField` — AES-256-GCM with AAD and `v1:` prefix |
| `services/core/src/lib/integration-secret-registry.ts` | Create | `METADATA_SECRET_FIELDS` + `CONFIG_SUMMARY_ALLOWED_KEYS` per-provider registry |
| `services/core/src/app.ts` | Modify | Call `validateRequiredEnv` + 32-byte key startup check |
| `services/core/src/routes/integrations.ts` | Modify | Encrypt on GCal token write; decrypt on read; encrypt/decrypt metadata secret fields; enforce configurationSummary allowlist |
| `services/core/scripts/backfill-encrypt-secrets.ts` | Create | One-shot idempotent backfill with optimistic concurrency |
| `services/core/src/__tests__/integration-crypto.test.ts` | Create | Unit tests for crypto module (13 cases) |
| `services/core/src/__tests__/integration-secret-registry.test.ts` | Create | Unit tests for registry + metadata write/read logic |

---

## Task 1: Create validate-env module

**Files:**
- Create: `services/core/src/lib/validate-env.ts`
- Create: `services/core/src/__tests__/validate-env.test.ts`

This is identical in structure to `services/auth/src/lib/validate-env.ts`. Presence-only check (undefined / null / whitespace = missing).

- [ ] **Step 1: Write the failing test**

```typescript
// services/core/src/__tests__/validate-env.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { validateRequiredEnv } from "../lib/validate-env.js";

describe("validateRequiredEnv", () => {
  const ORIGINAL = { ...process.env };
  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL)) delete process.env[key];
    }
    Object.assign(process.env, ORIGINAL);
  });

  it("does not throw when all vars present and non-empty", () => {
    process.env.CORE_TEST_A = "value";
    expect(() => validateRequiredEnv(["CORE_TEST_A"])).not.toThrow();
  });

  it("throws listing all missing vars", () => {
    delete process.env.MISSING_X;
    delete process.env.MISSING_Y;
    expect(() => validateRequiredEnv(["MISSING_X", "MISSING_Y"])).toThrow(
      /\[startup\].*MISSING_X.*MISSING_Y/
    );
  });

  it("treats empty string as missing", () => {
    process.env.EMPTY_VAR = "";
    expect(() => validateRequiredEnv(["EMPTY_VAR"])).toThrow(/EMPTY_VAR/);
  });

  it("treats whitespace-only as missing", () => {
    process.env.WS_VAR = "   ";
    expect(() => validateRequiredEnv(["WS_VAR"])).toThrow(/WS_VAR/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @maphari/core test src/__tests__/validate-env.test.ts
```

Expected: FAIL with "Cannot find module '../lib/validate-env.js'"

- [ ] **Step 3: Create validate-env.ts**

```typescript
// services/core/src/lib/validate-env.ts
export function validateRequiredEnv(required: string[]): void {
  const missing = required.filter((key) => {
    const val = process.env[key];
    return val === undefined || val === null || val.trim() === "";
  });
  if (missing.length > 0) {
    throw new Error(
      `[startup] Missing required environment variables: ${missing.join(", ")}. Service cannot start.`
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @maphari/core test src/__tests__/validate-env.test.ts
```

Expected: 4 passing

- [ ] **Step 5: Commit**

```bash
git add services/core/src/lib/validate-env.ts services/core/src/__tests__/validate-env.test.ts
git commit -m "feat(core): add validateRequiredEnv utility"
```

---

## Task 2: Create integration-crypto module

**Files:**
- Create: `services/core/src/lib/integration-crypto.ts`
- Create: `services/core/src/__tests__/integration-crypto.test.ts`

AES-256-GCM with 96-bit IV, 128-bit auth tag. AAD is passed in by the caller and bound into the cipher. Output: `v1:<base64url-JSON>`. Input validation throws immediately — no partial returns.

- [ ] **Step 1: Write the failing tests**

```typescript
// services/core/src/__tests__/integration-crypto.test.ts
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
    try {
      decryptField(enc, WRONG_KEY, AAD);
    } catch (e) {
      expect(String(e)).not.toContain("super-secret-value");
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @maphari/core test src/__tests__/integration-crypto.test.ts
```

Expected: FAIL with "Cannot find module '../lib/integration-crypto.js'"

- [ ] **Step 3: Create integration-crypto.ts**

```typescript
// services/core/src/lib/integration-crypto.ts
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
  const decipher   = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @maphari/core test src/__tests__/integration-crypto.test.ts
```

Expected: 13 passing

- [ ] **Step 5: Commit**

```bash
git add services/core/src/lib/integration-crypto.ts services/core/src/__tests__/integration-crypto.test.ts
git commit -m "feat(core): add AES-256-GCM field encryption with AAD (integration-crypto)"
```

---

## Task 3: Create per-provider secret field registry

**Files:**
- Create: `services/core/src/lib/integration-secret-registry.ts`
- Create: `services/core/src/__tests__/integration-secret-registry.test.ts`

Registry + the helper functions that implement the encrypt-metadata and validate-configSummary logic. Testing the helpers here keeps the route tests focused on HTTP concerns.

- [ ] **Step 1: Write the failing tests**

```typescript
// services/core/src/__tests__/integration-secret-registry.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @maphari/core test src/__tests__/integration-secret-registry.test.ts
```

Expected: FAIL with "Cannot find module '../lib/integration-secret-registry.js'"

- [ ] **Step 3: Create integration-secret-registry.ts**

```typescript
// services/core/src/lib/integration-secret-registry.ts
import { encryptField, decryptField } from "./integration-crypto.js";
import type { FastifyBaseLogger } from "fastify";

// ── Provider declarations ─────────────────────────────────────────────────────
// GCal tokens live in UserPreference, NOT here.
export const METADATA_SECRET_FIELDS: Record<string, string[]> = {
  gcal:   [],
  slack:  ["bot_token", "webhook_url"],
  stripe: ["webhook_secret", "restricted_key"],
};

export const CONFIG_SUMMARY_ALLOWED_KEYS: Record<string, string[]> = {
  gcal:   ["calendar_id", "sync_enabled", "last_synced_email"],
  slack:  ["channel_id", "workspace_name"],
  stripe: ["account_name", "livemode"],
};

// ── Metadata helpers ──────────────────────────────────────────────────────────

function metadataAad(connectionId: string, fieldName: string): string {
  return `clientIntegrationConnection/${connectionId}/${fieldName}/v1`;
}

/**
 * Encrypts secret-registry fields in a metadata object before DB write.
 * Non-secret fields pass through unchanged.
 */
export function encryptMetadataSecrets(
  providerKey: string,
  metadata: Record<string, unknown>,
  base64Key: string,
  connectionId: string,
): Record<string, unknown> {
  const secretFields = METADATA_SECRET_FIELDS[providerKey] ?? [];
  const result: Record<string, unknown> = { ...metadata };
  for (const field of secretFields) {
    const value = result[field];
    if (typeof value === "string") {
      result[field] = encryptField(value, base64Key, metadataAad(connectionId, field));
    }
  }
  return result;
}

/**
 * Decrypts secret-registry fields in a metadata object for internal use.
 * Returns both the internal form (plaintext secrets) and the API view (secrets replaced with null or omitted).
 * Log is optional — pass request.log from Fastify when available.
 */
export function decryptMetadataSecrets(
  providerKey: string,
  metadata: Record<string, unknown>,
  base64Key: string,
  connectionId: string,
  log?: Pick<FastifyBaseLogger, "warn" | "error">,
): {
  internal: Record<string, unknown>;
  apiView: Record<string, unknown>;
} {
  const secretFields = METADATA_SECRET_FIELDS[providerKey] ?? [];
  const internal: Record<string, unknown> = { ...metadata };
  const apiView: Record<string, unknown>  = {};

  // Copy non-secret fields to apiView as-is
  for (const [k, v] of Object.entries(metadata)) {
    if (!secretFields.includes(k)) {
      apiView[k] = v;
    }
  }

  for (const field of secretFields) {
    const stored = metadata[field];
    if (stored === undefined || stored === null) continue; // absent — omit

    const aad = metadataAad(connectionId, field);

    if (typeof stored !== "string") {
      // Unexpected type — treat as unavailable
      internal[field] = "CREDENTIAL_UNAVAILABLE";
      continue;
    }

    if (!stored.startsWith("v1:")) {
      // Migration window: plaintext
      log?.warn({ event: "plaintext_secret_read", entityType: "clientIntegrationConnection", entityId: connectionId, fieldName: field });
      internal[field] = stored;
      apiView[field]  = null;
      continue;
    }

    try {
      internal[field] = decryptField(stored, base64Key, aad);
      apiView[field]  = null; // never expose even when decrypted successfully
    } catch {
      log?.error({ event: "decrypt_failure", entityType: "clientIntegrationConnection", entityId: connectionId, fieldName: field });
      internal[field] = "CREDENTIAL_UNAVAILABLE";
      // omit from apiView
    }
  }

  return { internal, apiView };
}

// ── configurationSummary validation ──────────────────────────────────────────

/**
 * Validates that all keys in configurationSummary are in the provider's allowlist.
 * Returns null if valid; returns { unknownKeys, allowedKeys } if invalid.
 */
export function validateConfigSummary(
  providerKey: string,
  summary: Record<string, unknown>,
): { unknownKeys: string[]; allowedKeys: string[] } | null {
  const allowed    = CONFIG_SUMMARY_ALLOWED_KEYS[providerKey] ?? [];
  const keys       = Object.keys(summary);
  const unknownKeys = keys.filter((k) => !allowed.includes(k));
  if (unknownKeys.length === 0) return null;
  return { unknownKeys, allowedKeys: allowed };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @maphari/core test src/__tests__/integration-secret-registry.test.ts
```

Expected: all passing

- [ ] **Step 5: Commit**

```bash
git add services/core/src/lib/integration-secret-registry.ts services/core/src/__tests__/integration-secret-registry.test.ts
git commit -m "feat(core): add integration secret field registry with encrypt/decrypt helpers"
```

---

## Task 4: Add startup validation to app.ts

**Files:**
- Modify: `services/core/src/app.ts`

Two additions at the top of `createCoreApp()`:
1. `validateRequiredEnv(["INTEGRATION_ENCRYPTION_KEY"])` — presence check.
2. Inline 32-byte decode check — fails fast if key is present but wrong length.

- [ ] **Step 1: Open `services/core/src/app.ts` and add the import at the top of the imports section**

Find the imports block and add:

```typescript
import { validateRequiredEnv } from "./lib/validate-env.js";
```

- [ ] **Step 2: Add startup validation at the very start of `createCoreApp()`**

`createCoreApp()` begins at line ~158. Add these lines immediately after the opening brace, before `const app = Fastify(...)`:

```typescript
export async function createCoreApp(): Promise<FastifyInstance> {
  // ── Startup: env + key validation ─────────────────────────────────────────
  validateRequiredEnv(["INTEGRATION_ENCRYPTION_KEY"]);
  const _keyBuf = Buffer.from(process.env.INTEGRATION_ENCRYPTION_KEY!, "base64");
  if (_keyBuf.length !== 32) {
    throw new Error(
      "[startup] INTEGRATION_ENCRYPTION_KEY must decode to exactly 32 bytes. " +
      `Got ${_keyBuf.length} bytes. Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    );
  }

  const app = Fastify({ logger: true });
  // ... rest unchanged
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm --filter @maphari/core lint
```

Expected: no errors

- [ ] **Step 4: Verify the test suite still passes**

```bash
pnpm --filter @maphari/core test
```

Expected: all existing tests pass (the startup validation only runs inside `createCoreApp()`, which tests don't call)

- [ ] **Step 5: Commit**

```bash
git add services/core/src/app.ts
git commit -m "feat(core): fail-fast startup validation for INTEGRATION_ENCRYPTION_KEY (presence + 32-byte length)"
```

---

## Task 5: Encrypt GCal tokens on write

**Files:**
- Modify: `services/core/src/routes/integrations.ts`

There are **three** places in the file where access/refresh tokens are written to `userPreference`. Find them all with: `grep -n "GC_ACCESS_TOKEN_KEY\|GC_REFRESH_TOKEN_KEY" services/core/src/routes/integrations.ts`

The current write pattern is:
```typescript
prisma.userPreference.upsert({
  where:  { userId_key: { userId, key: GC_ACCESS_TOKEN_KEY } },
  update: { value: tokens.access_token },
  create: { userId, key: GC_ACCESS_TOKEN_KEY, value: tokens.access_token },
})
```

It needs to become:
```typescript
prisma.userPreference.upsert({
  where:  { userId_key: { userId, key: GC_ACCESS_TOKEN_KEY } },
  update: { value: encryptPref(userId, GC_ACCESS_TOKEN_KEY, tokens.access_token) },
  create: { userId, key: GC_ACCESS_TOKEN_KEY, value: encryptPref(userId, GC_ACCESS_TOKEN_KEY, tokens.access_token) },
})
```

The AAD for a UserPreference field is:
`userPreference/{userId}:{preferenceKey}/{preferenceKey}/v1`

For example: `userPreference/user-123:gcal_access_token/gcal_access_token/v1`

- [ ] **Step 1: Refactor `getValidAccessToken` to accept a logger parameter**

`getValidAccessToken` is a module-level async function. Change its signature:

```typescript
// Before
async function getValidAccessToken(userId: string): Promise<string | null>

// After
async function getValidAccessToken(
  userId: string,
  log: { warn: (obj: object) => void; error: (obj: object) => void },
): Promise<string | null>
```

Update all call sites within the file to pass `request.log` (all callers are inside route handlers that have `request` in scope). Run `grep -n "getValidAccessToken" services/core/src/routes/integrations.ts` to find all call sites.

- [ ] **Step 2: Add the import and helper to integrations.ts**

At the top of `services/core/src/routes/integrations.ts`, add after existing imports:

```typescript
import { encryptField, decryptField } from "../lib/integration-crypto.js";
```

Then just below the `const GC_EXPIRY_KEY = ...` block, add:

```typescript
// ── Helpers: UserPreference token encryption ──────────────────────────────
function prefAad(userId: string, prefKey: string): string {
  return `userPreference/${userId}:${prefKey}/${prefKey}/v1`;
}

function encryptPref(userId: string, prefKey: string, value: string): string {
  return encryptField(value, process.env.INTEGRATION_ENCRYPTION_KEY!, prefAad(userId, prefKey));
}

function decryptPref(
  userId: string,
  prefKey: string,
  stored: string,
  log: { warn: (obj: object) => void; error: (obj: object) => void },
  prefId: string,
): string | null {
  if (stored.startsWith("v1:")) {
    try {
      return decryptField(stored, process.env.INTEGRATION_ENCRYPTION_KEY!, prefAad(userId, prefKey));
    } catch {
      log.error({ event: "decrypt_failure", entityType: "userPreference", entityId: prefId, fieldName: prefKey });
      throw new Error("CREDENTIAL_DECRYPT_FAILED");
    }
  }
  // Migration window: plaintext
  log.warn({ event: "plaintext_secret_read", entityType: "userPreference", entityId: prefId, fieldName: prefKey });
  return stored;
}
```

- [ ] **Step 2: Update the OAuth callback token write (around line 1750)**

Find the block that writes `tokens.access_token` and `tokens.refresh_token` in the OAuth callback handler (search for `"Persist tokens as UserPreference entries"`). Replace each secret token upsert value with `encryptPref(userId, KEY, value)`:

```typescript
// access_token write
prisma.userPreference.upsert({
  where:  { userId_key: { userId, key: GC_ACCESS_TOKEN_KEY } },
  update: { value: encryptPref(userId, GC_ACCESS_TOKEN_KEY, tokens.access_token) },
  create: { userId, key: GC_ACCESS_TOKEN_KEY, value: encryptPref(userId, GC_ACCESS_TOKEN_KEY, tokens.access_token) },
}),

// refresh_token write (inside the `if (tokens.refresh_token)` block)
prisma.userPreference.upsert({
  where:  { userId_key: { userId, key: GC_REFRESH_TOKEN_KEY } },
  update: { value: encryptPref(userId, GC_REFRESH_TOKEN_KEY, tokens.refresh_token) },
  create: { userId, key: GC_REFRESH_TOKEN_KEY, value: encryptPref(userId, GC_REFRESH_TOKEN_KEY, tokens.refresh_token) },
}),
```

Leave `gcal_email` and `gcal_token_expiry` upserts unchanged.

- [ ] **Step 3: Update the refresh path access_token write (around line 266)**

Find: `update: { value: refreshed.access_token }` in `getValidAccessToken`. Replace with:

```typescript
update: { value: encryptPref(userId, GC_ACCESS_TOKEN_KEY, refreshed.access_token) },
create: { userId, key: GC_ACCESS_TOKEN_KEY, value: encryptPref(userId, GC_ACCESS_TOKEN_KEY, refreshed.access_token) },
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm --filter @maphari/core lint
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add services/core/src/routes/integrations.ts
git commit -m "feat(core/integrations): encrypt gcal_access_token and gcal_refresh_token on write"
```

---

## Task 6: Decrypt GCal tokens on read

**Files:**
- Modify: `services/core/src/routes/integrations.ts`

There are two read paths: `getValidAccessToken` (reads access + refresh token) and the status endpoint (reads access token only to check connectivity). Both must decrypt via `decryptPref`.

- [ ] **Step 1: Update getValidAccessToken body**

In `getValidAccessToken` (around line 246–280), after loading `tokenPref` and `refreshPref`, add decryption. Use the `log` parameter added in Task 5 Step 1:

Replace:
```typescript
if (!isExpired) return tokenPref.value;
// ...
const refreshed = await refreshGcalAccessToken(refreshPref.value);
```

With:
```typescript
if (!isExpired) {
  return decryptPref(userId, GC_ACCESS_TOKEN_KEY, tokenPref.value, app.log, tokenPref.id);
}

if (!refreshPref) return null;
const refreshToken = decryptPref(userId, GC_REFRESH_TOKEN_KEY, refreshPref.value, app.log, refreshPref.id);
if (!refreshToken) return null;
const refreshed = await refreshGcalAccessToken(refreshToken);
```

Note: `getValidAccessToken` must receive `app` (or a logger) as a parameter. Check its current signature and add `log: { warn: ..., error: ... }` if needed. If it already has access to a logger from the outer scope, use that.

- [ ] **Step 2: Handle CREDENTIAL_DECRYPT_FAILED in callers of getValidAccessToken**

`getValidAccessToken` can now throw `CREDENTIAL_DECRYPT_FAILED`. Any caller that catches errors from it should return HTTP 500. Run:

```bash
grep -n "getValidAccessToken" services/core/src/routes/integrations.ts
```

For each call site, ensure the surrounding try/catch returns:

```typescript
return reply.status(500).send({
  success: false,
  error: { code: "CREDENTIAL_UNAVAILABLE", message: "Could not decrypt stored credentials." },
} as ApiResponse);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm --filter @maphari/core lint
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add services/core/src/routes/integrations.ts
git commit -m "feat(core/integrations): decrypt gcal tokens on read with fail-closed error handling"
```

---

## Task 7: Encrypt/decrypt metadata secret fields on connection write/read

**Files:**
- Modify: `services/core/src/routes/integrations.ts`

There are **two** write paths that set `metadata` on `ClientIntegrationConnection`:
1. The upsert route (`POST /admin/integrations/connections`) — around line 1459.
2. The patch route (`PATCH /admin/integrations/connections/:connectionId`) — around line 1546.

Both must encrypt secret fields before writing and decrypt on read.

- [ ] **Step 1: Add the registry import to integrations.ts**

At the top of the file, add:

```typescript
import { encryptMetadataSecrets, decryptMetadataSecrets } from "../lib/integration-secret-registry.js";
```

- [ ] **Step 2: Update the upsert route — two-step write to get connection.id before encrypting**

Encryption requires `connection.id` for the AAD, but for new records the ID doesn't exist until after the upsert. Use a two-step approach:

**Step A:** Upsert without metadata (pass `metadata: null` in create, and omit the `metadata` key in update so existing metadata is not disturbed). Get `connection.id` from the result.

**Step B:** If the caller supplied metadata, encrypt it using the stable `connection.id`, then write it with a separate `prisma.clientIntegrationConnection.update`.

```typescript
// Before the upsert, extract rawMetadata from body
const rawMetadata = body.metadata != null && typeof body.metadata === "object"
  ? (body.metadata as Record<string, unknown>)
  : null;

// Step A: upsert connection without touching metadata
const connection = await prisma.clientIntegrationConnection.upsert({
  where: { clientId_providerKey: { clientId, providerKey } },
  create: {
    clientId, providerId: provider.id, providerKey,
    // ... all other fields ...
    metadata: null,                      // ← always null on create; encrypted next
    configurationSummary: body.configurationSummary ?? null,
  },
  update: {
    // ... all other fields ...
    // DO NOT include metadata here — update it in Step B only if provided
    configurationSummary: body.configurationSummary ?? null,
  },
});

// Step B: encrypt and write metadata if provided
if (rawMetadata != null) {
  const encrypted = encryptMetadataSecrets(
    providerKey, rawMetadata, process.env.INTEGRATION_ENCRYPTION_KEY!, connection.id
  );
  await prisma.clientIntegrationConnection.update({
    where: { id: connection.id },
    data: { metadata: encrypted },
  });
}
```

- [ ] **Step 3: Update the patch route — encrypt metadata before write**

In the patch route (`PATCH .../:connectionId`), replace:

```typescript
if (body.metadata !== undefined) data.metadata = body.metadata;
```

With:

```typescript
if (body.metadata !== undefined && body.metadata !== null) {
  const raw = body.metadata as Record<string, unknown>;
  data.metadata = encryptMetadataSecrets(providerKey, raw, process.env.INTEGRATION_ENCRYPTION_KEY!, connectionId);
} else if (body.metadata === null) {
  data.metadata = null;
}
```

**Note:** The patch route needs to resolve `providerKey` for the connection. Query the existing connection before updating to get its `providerKey`.

- [ ] **Step 4: Find all GET routes that return metadata — decrypt on read**

First identify every route that returns a `ClientIntegrationConnection` record:

```bash
grep -n "clientIntegrationConnection\.\(findUnique\|findMany\|findFirst\)" services/core/src/routes/integrations.ts
```

Also check for spread patterns like `...connection` or `...updated` in return values:

```bash
grep -n "\.\.\.(connection\|updated\|conn\|result)" services/core/src/routes/integrations.ts
```

For **each** matching route, after loading the connection, apply decryption before the response:

```typescript
data: { ...connection }
```

With decryption applied:

```typescript
const metaRaw = connection.metadata as Record<string, unknown> | null;
const { apiView: metaApiView } = metaRaw != null
  ? decryptMetadataSecrets(connection.providerKey, metaRaw, process.env.INTEGRATION_ENCRYPTION_KEY!, connection.id, request.log)
  : { apiView: null };

data: { ...connection, metadata: metaApiView }
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm --filter @maphari/core lint
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add services/core/src/routes/integrations.ts
git commit -m "feat(core/integrations): encrypt metadata secret fields on write, decrypt to null on read"
```

---

## Task 8: Enforce configurationSummary allowlist

**Files:**
- Modify: `services/core/src/routes/integrations.ts`

Both the upsert and patch routes that write `configurationSummary` must validate it through `validateConfigSummary`. This is Phase B (enforcement) — reject with 422 on any unknown key.

- [ ] **Step 1: Add validateConfigSummary import (already added in Task 7 via registry import)**

`validateConfigSummary` is already exported from `integration-secret-registry.ts`. Confirm it's imported.

- [ ] **Step 2: Add validation to upsert route**

Before the `prisma.clientIntegrationConnection.upsert`, add:

```typescript
if (body.configurationSummary != null && typeof body.configurationSummary === "object") {
  const validationError = validateConfigSummary(
    providerKey,
    body.configurationSummary as Record<string, unknown>
  );
  if (validationError) {
    request.log.warn({ event: "config_summary_rejected", providerKey, unknownKeys: validationError.unknownKeys });
    return reply.status(422).send({
      success: false,
      error: {
        code: "INVALID_CONFIGURATION_SUMMARY",
        message: "configurationSummary contains disallowed keys",
        unknownKeys: validationError.unknownKeys,
        allowedKeys: validationError.allowedKeys,
      },
    });
  }
}
```

- [ ] **Step 3: Add validation to patch route**

In the patch route, similarly:

```typescript
if (body.configurationSummary !== undefined && body.configurationSummary !== null) {
  const validationError = validateConfigSummary(
    connection.providerKey, // resolved from existing connection
    body.configurationSummary as Record<string, unknown>
  );
  if (validationError) {
    request.log.warn({ event: "config_summary_rejected", providerKey: connection.providerKey, unknownKeys: validationError.unknownKeys });
    return reply.status(422).send({
      success: false,
      error: {
        code: "INVALID_CONFIGURATION_SUMMARY",
        message: "configurationSummary contains disallowed keys",
        unknownKeys: validationError.unknownKeys,
        allowedKeys: validationError.allowedKeys,
      },
    });
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm --filter @maphari/core lint
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add services/core/src/routes/integrations.ts
git commit -m "feat(core/integrations): enforce configurationSummary allowlist — reject unknown keys with 422"
```

---

## Task 9: Write backfill script

**Files:**
- Create: `services/core/scripts/backfill-encrypt-secrets.ts`

One-shot idempotent script. Reads plaintext rows, encrypts them, writes back using an optimistic-concurrency WHERE clause to avoid stale overwrites from concurrent application writes.

**AAD note:** The backfill must use the same AAD as the runtime code:
- UserPreference: `userPreference/{row.userId}:{row.key}/{row.key}/v1`
- Metadata: `clientIntegrationConnection/{row.id}/{fieldName}/v1`

- [ ] **Step 1: Create scripts directory**

```bash
mkdir -p services/core/scripts
```

- [ ] **Step 2: Create the backfill script**

```typescript
// services/core/scripts/backfill-encrypt-secrets.ts
// Usage: INTEGRATION_ENCRYPTION_KEY=<key> npx tsx services/core/scripts/backfill-encrypt-secrets.ts
import { PrismaClient } from "@prisma/client";
import { encryptField } from "../src/lib/integration-crypto.js";
import { METADATA_SECRET_FIELDS } from "../src/lib/integration-secret-registry.js";

const prisma = new PrismaClient();

const KEY = process.env.INTEGRATION_ENCRYPTION_KEY;
if (!KEY) {
  console.error("[backfill] INTEGRATION_ENCRYPTION_KEY is required");
  process.exit(1);
}
const keyBuf = Buffer.from(KEY, "base64");
if (keyBuf.length !== 32) {
  console.error(`[backfill] INTEGRATION_ENCRYPTION_KEY must decode to 32 bytes, got ${keyBuf.length}`);
  process.exit(1);
}

const SECRET_PREF_KEYS = ["gcal_access_token", "gcal_refresh_token"];

let processed = 0;
let encrypted = 0;
let skipped   = 0;
let errors    = 0;
let conflicts = 0;

async function backfillUserPreferences(): Promise<void> {
  const rows = await prisma.userPreference.findMany({
    where: { key: { in: SECRET_PREF_KEYS } },
  });

  for (const row of rows) {
    processed++;
    if (row.value.startsWith("v1:")) { skipped++; continue; }

    const aad = `userPreference/${row.userId}:${row.key}/${row.key}/v1`;
    let encryptedValue: string;
    try {
      encryptedValue = encryptField(row.value, KEY!, aad);
    } catch (e) {
      console.error({ event: "backfill_error", entityId: row.id, error: String(e) });
      errors++;
      continue;
    }

    try {
      const result = await prisma.$executeRaw`
        UPDATE "user_preferences"
        SET value = ${encryptedValue}
        WHERE id = ${row.id} AND value = ${row.value}
      `;
      if (result === 0) {
        console.warn({ event: "backfill_conflict_skip", entityId: row.id, fieldName: row.key });
        conflicts++;
      } else {
        console.log({ event: "backfill_encrypted", entityType: "userPreference", entityId: row.id, fieldName: row.key });
        encrypted++;
      }
    } catch (e) {
      console.error({ event: "backfill_error", entityId: row.id, error: String(e) });
      errors++;
    }
  }
}

async function backfillConnectionMetadata(): Promise<void> {
  const connections = await prisma.clientIntegrationConnection.findMany({
    where: { metadata: { not: null } },
  });

  for (const conn of connections) {
    const secretFields = METADATA_SECRET_FIELDS[conn.providerKey] ?? [];
    if (secretFields.length === 0) { skipped++; continue; }

    processed++;
    let meta: Record<string, unknown>;
    try {
      meta = conn.metadata as Record<string, unknown>;
      if (!meta || typeof meta !== "object") throw new Error("not an object");
    } catch {
      console.warn({ event: "backfill_skip_invalid_json", entityId: conn.id });
      skipped++;
      continue;
    }

    const originalMetaJson = JSON.stringify(conn.metadata);
    const updatedMeta = { ...meta };
    let anyEncrypted = false;

    for (const field of secretFields) {
      const value = updatedMeta[field];
      if (typeof value !== "string") continue;
      if (value.startsWith("v1:")) continue; // already encrypted

      const aad = `clientIntegrationConnection/${conn.id}/${field}/v1`;
      try {
        updatedMeta[field] = encryptField(value, KEY!, aad);
        anyEncrypted = true;
      } catch (e) {
        console.error({ event: "backfill_error", entityId: conn.id, fieldName: field, error: String(e) });
        errors++;
      }
    }

    if (!anyEncrypted) { skipped++; continue; }

    try {
      const result = await prisma.$executeRaw`
        UPDATE "client_integration_connections"
        SET metadata = ${JSON.stringify(updatedMeta)}::jsonb
        WHERE id = ${conn.id} AND metadata::text = ${originalMetaJson}
      `;
      if (result === 0) {
        console.warn({ event: "backfill_conflict_skip", entityId: conn.id });
        conflicts++;
      } else {
        console.log({ event: "backfill_encrypted", entityType: "clientIntegrationConnection", entityId: conn.id });
        encrypted++;
      }
    } catch (e) {
      console.error({ event: "backfill_error", entityId: conn.id, error: String(e) });
      errors++;
    }
  }
}

try {
  console.log("[backfill] Starting UserPreference backfill...");
  await backfillUserPreferences();

  console.log("[backfill] Starting ClientIntegrationConnection.metadata backfill...");
  await backfillConnectionMetadata();

  console.log("[backfill] Complete", { processed, encrypted, skipped, conflicts, errors });
} finally {
  await prisma.$disconnect();
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm --filter @maphari/core exec tsc --noEmit --skipLibCheck -p tsconfig.json 2>&1 | head -30
```

Expected: no errors (or only pre-existing unrelated errors)

- [ ] **Step 4: Dry-run test (no DB required — just verify it parses)**

```bash
npx tsx services/core/scripts/backfill-encrypt-secrets.ts 2>&1 | head -5
```

Expected: prints `[backfill] INTEGRATION_ENCRYPTION_KEY is required` and exits 1 (because we didn't set the env var)

- [ ] **Step 5: Commit**

```bash
git add services/core/scripts/backfill-encrypt-secrets.ts
git commit -m "feat(core): add backfill script for encrypting existing plaintext tokens in DB"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run the full core test suite**

```bash
pnpm --filter @maphari/core test
```

Expected: all tests pass

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm --filter @maphari/core lint
```

Expected: exit code 0

- [ ] **Step 3: Spot-check acceptance criteria**

```bash
# Verify encryptField output starts with v1:
node -e "
  const { encryptField } = await import('./services/core/src/lib/integration-crypto.js');
  const key = require('crypto').randomBytes(32).toString('base64');
  const out = encryptField('test', key, 'userPreference/u1:gcal_access_token/gcal_access_token/v1');
  console.log('starts with v1:', out.startsWith('v1:'));
" 2>/dev/null || echo "(run manually in ESM context)"

# Verify validateConfigSummary rejects unknown key
node -e "
  const { validateConfigSummary } = await import('./services/core/src/lib/integration-secret-registry.js');
  const result = validateConfigSummary('gcal', { secret_key: 'bad' });
  console.log('unknown key rejected:', result?.unknownKeys?.includes('secret_key'));
" 2>/dev/null || echo "(run manually in ESM context)"
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore(core): P0-4 final verification — all acceptance criteria met"
```

---

## Acceptance Criteria Checklist

- [ ] `INTEGRATION_ENCRYPTION_KEY` missing → core service refuses to start
- [ ] `INTEGRATION_ENCRYPTION_KEY` decodes to wrong byte length → core service refuses to start
- [ ] `gcal_access_token` and `gcal_refresh_token` stored with `v1:` prefix after OAuth callback
- [ ] Decrypt with wrong key logs `{ event: "decrypt_failure", entityType, entityId, fieldName }` — no `value`, `plaintext`, `ciphertext`, `key`, `iv`, or `tag` in log
- [ ] Different AAD causes `decryptField` to throw (tested in Task 2)
- [ ] `metadata` secret-registry fields encrypted; non-secret metadata fields plaintext
- [ ] Secret metadata fields return `null` in API responses
- [ ] `configurationSummary` with unknown key returns 422 with `unknownKeys` + `allowedKeys`
- [ ] Backfill script skips already-encrypted rows (`v1:` prefix); uses optimistic concurrency WHERE clause
- [ ] All unit tests pass (`integration-crypto`, `integration-secret-registry`, `validate-env`)
