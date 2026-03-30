# P0-4: OAuth / Integration Token Encryption at Rest — Design Spec

**Date:** 2026-03-30
**Status:** Approved

---

## 1. Problem Statement

`UserPreference` records store Google Calendar OAuth tokens (`gcal_access_token`, `gcal_refresh_token`) as plaintext strings in the `value` column. `ClientIntegrationConnection.metadata` is a free-form JSON blob that can hold provider credentials. Both represent credentials that grant third-party account access and must not be stored in the clear.

---

## 2. Scope

| Surface | Fields | Action |
|---------|--------|--------|
| `UserPreference` | `gcal_access_token`, `gcal_refresh_token` | Encrypt at write; decrypt on read |
| `UserPreference` | `gcal_email`, `gcal_token_expiry`, all other non-secret keys | Leave plaintext |
| `ClientIntegrationConnection.metadata` | Per-provider secret registry keys (see §4) | Encrypt listed fields; leave all other fields plaintext |
| `ClientIntegrationConnection.configurationSummary` | Any field | Enforce never-secret via allowlist validation at write |

---

## 3. Encryption Scheme

**Algorithm:** AES-256-GCM with 96-bit random IV and 128-bit authentication tag.

**Envelope format:** `v1:<base64url-encoded-JSON>` where the JSON contains:

```json
{ "iv": "<base64>", "ciphertext": "<base64>", "tag": "<base64>" }
```

The `v1:` prefix:
- Distinguishes encrypted values from plaintext during live migration (values without the prefix are treated as legacy plaintext during the migration window).
- Acts as a version discriminator for future key-rotation schemes. Future formats would use `v2:` etc. with new derivation strategies. Mixed `v1:`/`v2:` data would be simultaneously decryptable during a rotation window. Key rotation is out of scope for P0-4.

**Key:** `INTEGRATION_ENCRYPTION_KEY` — a 32-byte random value base64-encoded, stored in environment secrets. Required at service startup (fail-fast via `validateRequiredEnv`, which checks presence only). Both `encryptField` and `decryptField` validate that the decoded key is exactly 32 bytes and throw `Error("INTEGRATION_ENCRYPTION_KEY must decode to 32 bytes")` immediately if not — so a misconfigured key is caught at the first encrypt/decrypt call rather than silently producing bad output.

**IV generation:** Uses Node.js `crypto.randomBytes(12)` for all random IV generation. Each call produces a fresh 96-bit IV.

**AAD (Authenticated Additional Data):** Every GCM operation binds a stable context string to the ciphertext:

```
{entityType}/{entityId}/{fieldName}/v1
```

| Surface | `entityType` | `entityId` | `fieldName` |
|---------|-------------|-----------|------------|
| `UserPreference` | `userPreference` | `UserPreference.id` (UUID) | preference key, e.g. `gcal_access_token` |
| `ClientIntegrationConnection.metadata` | `clientIntegrationConnection` | `ClientIntegrationConnection.id` (UUID) | metadata key, e.g. `bot_token` |

AAD is never stored — it is recomputed from the record's primary key and field name at encrypt/decrypt time. The entity UUID makes the AAD unique per record even for the same field name, preventing cross-record ciphertext transplanting. The field name component prevents cross-field transplanting within the same record.

`metadata` object keys must be top-level (non-nested). The secret registry only applies to top-level keys. Nested objects are not supported for encryption in this iteration; if a provider needs nested secrets it must flatten them at the application layer before storage.

**Fail-closed contract:** If decryption raises any error (auth tag mismatch, malformed envelope JSON, wrong key length, missing IV/ciphertext/tag fields, IV not 12 bytes, empty ciphertext):
- The function throws; it never returns partial or raw data.
- The caller logs `{ event: "decrypt_failure", entityType, entityId, fieldName }` at `error` level — no secret data, no ciphertext, no key material in the log entry.
- The error surface is described per-context in §6.

---

## 4. Per-Provider Secret Field Registry

A static registry in `services/core/src/lib/integration-secret-registry.ts` declares which top-level JSON keys within `metadata` are secrets for each provider, and which top-level keys are permitted in `configurationSummary`.

```typescript
export const METADATA_SECRET_FIELDS: Record<string, string[]> = {
  gcal:         [],        // GCal tokens live in UserPreference, not metadata
  slack:        ["bot_token", "webhook_url"],
  stripe:       ["webhook_secret", "restricted_key"],
  // extend: document which fields are credentials in the provider integration guide,
  // then add here and add unit tests for the new provider's encrypt/decrypt paths.
};

export const CONFIG_SUMMARY_ALLOWED_KEYS: Record<string, string[]> = {
  gcal:   ["calendar_id", "sync_enabled", "last_synced_email"],
  slack:  ["channel_id", "workspace_name"],
  stripe: ["account_name", "livemode"],
  // extend: add only non-credential keys; secret keys must never appear here.
};
```

**Adding a new provider (required steps):**
1. Identify which fields are credentials via the provider's documentation.
2. Add entries to `METADATA_SECRET_FIELDS` (secret fields) and `CONFIG_SUMMARY_ALLOWED_KEYS` (non-secret summary keys).
3. Add unit tests covering: metadata write encrypts listed secret fields; metadata read decrypts them; `configurationSummary` write rejects any secret key name.

Only keys listed in `METADATA_SECRET_FIELDS` are encrypted. All other `metadata` keys remain plaintext. This makes the policy explicit and auditable.

---

## 5. Crypto Module Placement

The existing `encryptSecret`/`decryptSecret` implementation in `services/public-api/src/lib/crypto.ts` is the proven base pattern. For `services/core` (a separate service), the pattern is **duplicated** — not shared via a package — to maintain per-service independence.

`services/core/src/lib/integration-crypto.ts` exports:

```typescript
/**
 * Encrypts plaintext and returns a "v1:<base64url>" envelope.
 * @param aad  Stable context string: "{entityType}/{entityId}/{fieldName}/v1"
 * @throws if base64Key does not decode to 32 bytes
 */
export function encryptField(
  plaintext: string,
  base64Key: string,
  aad: string
): string;

/**
 * Decrypts a "v1:<base64url>" envelope.
 * @param aad  Must match the value used at encryption time
 * @throws if encrypted does not start with "v1:", envelope is malformed,
 *         auth tag fails, key length wrong, IV not 12 bytes, or any crypto error
 */
export function decryptField(
  encrypted: string,
  base64Key: string,
  aad: string
): string;
```

The `v1:` prefix is applied by `encryptField` and stripped/validated by `decryptField` before base64url-decoding. Both functions throw on any invalid input — they never return partial results.

---

## 6. Read/Write Touch Points

### 6.1 UserPreference — Google Calendar tokens

**Encryption key source:** `process.env.INTEGRATION_ENCRYPTION_KEY`

**Write** (`saveGcalTokens` in `services/core/src/routes/integrations.ts`):
- Before `prisma.userPreference.upsert`, call `encryptField(token, key, aad)` for `gcal_access_token` and `gcal_refresh_token`.
- `gcal_email` and `gcal_token_expiry` written as-is (non-secret).
- AAD for access token: `userPreference/{pref.id}/gcal_access_token/v1`.
- AAD for refresh token: `userPreference/{pref.id}/gcal_refresh_token/v1`.
  - Note: The preference record is upserted; Prisma's `.upsert()` returns the full record including the final `id`. Use the returned record's `id` to compute AAD — this works for both insert (new UUID) and update (existing UUID).

**Read** (`loadGcalTokens` helper):
- If value starts with `v1:`, call `decryptField`. On decrypt error: log `{ event: "decrypt_failure", entityType: "userPreference", entityId: pref.id, fieldName }` and throw. Caller returns HTTP 500.
- If value does NOT start with `v1:` (migration window): return the plaintext value as-is and emit `log.warn({ event: "plaintext_secret_read", entityType: "userPreference", entityId: pref.id, fieldName })`. No plaintext value is included in the log.
- Once the backfill migration completes (§7), the plaintext path can be removed in a follow-up.

**Error surface (UserPreference):** Decrypt failure → throw → caller returns HTTP 500 with a generic error body. No credential data in response or logs.

### 6.2 ClientIntegrationConnection.metadata

**Encryption key source:** `process.env.INTEGRATION_ENCRYPTION_KEY`

**Write** (any route that sets `metadata`):
- Resolve `METADATA_SECRET_FIELDS[providerKey]` (default `[]` if provider not in registry).
- For each secret key present in the incoming metadata object: replace the value with `encryptField(value, key, aad)` where AAD = `clientIntegrationConnection/{connection.id}/{secretKey}/v1`.
- Write the modified object. Non-secret keys are written unchanged.

**Read** (any route that returns `metadata`):
- For each key in `METADATA_SECRET_FIELDS[providerKey]`:
  - If key absent from stored metadata: omit from output (field was never set).
  - If value starts with `v1:`: decrypt. On success, **return `null` in the API response**. Secret field values are never returned to callers even when decrypted — they are only consumed internally (e.g., to issue API calls to the provider). The `null` signals "a credential is connected here" without exposing the value.
  - If value starts with `v1:` and decrypt fails: log `{ event: "decrypt_failure", entityType: "clientIntegrationConnection", entityId: connection.id, fieldName }` at `error` level. Set the field value to `"CREDENTIAL_UNAVAILABLE"` in the internal result and **omit it from the API response**. Do not return HTTP 500 for metadata reads — other non-secret fields on the connection record remain usable.
  - If value does NOT start with `v1:` (migration window): use as-is internally, emit `log.warn({ event: "plaintext_secret_read", entityType: "clientIntegrationConnection", entityId: connection.id, fieldName })`.

**Summary of metadata API response behaviour:**

| Field state | Internal value | API response value |
|-------------|---------------|-------------------|
| Not present | absent | omitted |
| Encrypted + decrypt OK | plaintext (used internally) | `null` |
| Encrypted + decrypt fail | `"CREDENTIAL_UNAVAILABLE"` | omitted |
| Plaintext (migration window) | plaintext (used internally) | `null` |
| Non-secret field (any state) | raw JSON value | raw JSON value |

**Error surface (metadata):** Decrypt failure does not fail the entire request. Only the affected secret field is unavailable; a `decrypt_failure` event is logged. If the calling code requires the secret to complete its operation (e.g., issuing an API call to the provider), it must check for `"CREDENTIAL_UNAVAILABLE"` and return an appropriate error to its caller.

### 6.3 ClientIntegrationConnection.configurationSummary

**Write:** Before persisting, validate every key in the payload against `CONFIG_SUMMARY_ALLOWED_KEYS[providerKey]`. If the provider has no entry in the registry, reject all writes (empty allowlist = no keys permitted). If any unknown key is present, reject with:

```
HTTP 422
{
  "error": "INVALID_CONFIGURATION_SUMMARY",
  "message": "configurationSummary contains disallowed keys",
  "unknownKeys": ["<key1>", "<key2>"],
  "allowedKeys": ["<allowed1>", "<allowed2>"]
}
```

Log: `{ event: "config_summary_rejected", providerKey, unknownKeys: [...] }` at `warn` level. No values logged — only key names.

No encryption applied to `configurationSummary`. Its design-time allowlist constraint enforces that it can never store credentials.

---

## 7. Data Migration

A one-shot backfill script `services/core/scripts/backfill-encrypt-secrets.ts` handles existing plaintext rows. The script is safe to run while the service is live and safe to run multiple times.

**Algorithm:**

```
UserPreference backfill:
  SELECT all rows WHERE key IN ('gcal_access_token', 'gcal_refresh_token')
  For each row:
    If value starts with 'v1:' → skip (already encrypted)
    Compute aad = "userPreference/{row.id}/{row.key}/v1"
    encrypted = encryptField(row.value, INTEGRATION_ENCRYPTION_KEY, aad)
    UPDATE userPreference SET value = encrypted WHERE id = row.id
    Log: { event: "backfill_encrypted", entityType: "userPreference", entityId: row.id, fieldName: row.key }
    On error: log { event: "backfill_error", entityId: row.id, error: err.message } and continue

ClientIntegrationConnection.metadata backfill:
  SELECT all rows WHERE metadata IS NOT NULL
  For each row:
    secretFields = METADATA_SECRET_FIELDS[row.providerKey] ?? []
    If secretFields is empty → skip
    Parse metadata JSON; if invalid → log { event: "backfill_skip_invalid_json", entityId: row.id } and continue
    For each secretField in secretFields:
      If secretField absent from metadata → skip
      If metadata[secretField] starts with 'v1:' → skip (already encrypted)
      Compute aad = "clientIntegrationConnection/{row.id}/{secretField}/v1"
      metadata[secretField] = encryptField(plaintext, key, aad)
    UPDATE ClientIntegrationConnection SET metadata = updatedMetadata WHERE id = row.id
    Log: { event: "backfill_encrypted", entityType: "clientIntegrationConnection", entityId: row.id }
    On error: log { event: "backfill_error", entityId: row.id, error: err.message } and continue

Print summary: { processed, encrypted, skipped, errors }
```

Each row is updated in its own `prisma.model.update` call (no cross-row transaction). A concurrent write during encryption is safe: the next write will re-encrypt any field the application writes, and the backfill skipping `v1:`-prefixed values prevents double-encryption.

---

## 8. Environment

| Variable | Description | Required |
|---|---|---|
| `INTEGRATION_ENCRYPTION_KEY` | 32-byte random, base64-encoded | Yes — core service startup fails without it |

`validateRequiredEnv(["INTEGRATION_ENCRYPTION_KEY"])` called in `services/core/src/app.ts` before the Fastify instance builds.

---

## 9. Testing

**`services/core/src/__tests__/integration-crypto.test.ts`:**
- Encrypt → decrypt round-trip returns original value.
- Different AAD on decrypt throws (auth tag mismatch).
- Correct AAD after decrypt returns plaintext.
- Wrong key on decrypt throws.
- Key that decodes to wrong byte length throws at both encrypt and decrypt.
- Malformed base64url envelope (not valid JSON) throws on decrypt.
- Envelope missing `iv` field throws on decrypt.
- Envelope missing `ciphertext` field throws on decrypt.
- Envelope missing `tag` field throws on decrypt.
- IV not 12 bytes throws on decrypt.
- Auth tag that is wrong length throws on decrypt.
- `decryptField` called on value without `v1:` prefix throws.
- `encryptField` output always starts with `v1:`.
- No secret data appears in thrown error messages (error message checked against plaintext).

**`services/core/src/__tests__/integration-secret-registry.test.ts`:**
- `configurationSummary` with unknown key returns 422 with `unknownKeys` and `allowedKeys` in response body.
- `configurationSummary` with only allowlisted keys accepted.
- `configurationSummary` for unknown provider (not in registry) returns 422 for any non-empty payload.
- `metadata` write encrypts only secret-registry fields; other fields unchanged.
- `metadata` read: decrypted secret fields return `null` in API response.
- `metadata` read: decrypt failure sets `CREDENTIAL_UNAVAILABLE` internally and omits field from response.
- `metadata` read: non-secret fields pass through unchanged.
- `metadata` read: absent secret fields are omitted from response.

**`services/core/src/__tests__/integrations.route.test.ts`:**
- OAuth callback stores `gcal_access_token` with `v1:` prefix in DB.
- OAuth callback stores `gcal_refresh_token` with `v1:` prefix in DB.
- Reading back tokens via internal helper decrypts correctly.
- Token decrypt with wrong key logs `decrypt_failure` and returns HTTP 500 with no credential data in response body.

---

## 10. Acceptance Criteria

- [ ] `INTEGRATION_ENCRYPTION_KEY` missing → core service refuses to start.
- [ ] `gcal_access_token` and `gcal_refresh_token` stored with `v1:` prefix after write.
- [ ] Decrypt with wrong key returns HTTP 500 and logs `{ event: "decrypt_failure" }` with no secret data in log.
- [ ] Different AAD (wrong entity/field) causes `decryptField` to throw.
- [ ] `metadata` secret fields (per registry) encrypted; non-secret metadata fields plaintext.
- [ ] Secret metadata fields return `null` in API responses; non-secret fields return their values.
- [ ] `configurationSummary` write rejected with 422 if unknown key present; response includes `unknownKeys` and `allowedKeys`.
- [ ] Backfill script is idempotent (rows starting with `v1:` are skipped; running twice produces no change).
- [ ] `encryptField` / `decryptField` throw on malformed envelope, wrong key length, missing fields, IV length error.
- [ ] All unit and integration tests pass.
