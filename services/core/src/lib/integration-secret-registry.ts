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
