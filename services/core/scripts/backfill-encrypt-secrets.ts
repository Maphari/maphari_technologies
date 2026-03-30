// services/core/scripts/backfill-encrypt-secrets.ts
// Usage: INTEGRATION_ENCRYPTION_KEY=<key> npx tsx services/core/scripts/backfill-encrypt-secrets.ts
import { prisma } from "../src/lib/prisma.js";
import { encryptField } from "../src/lib/integration-crypto.js";
import { METADATA_SECRET_FIELDS } from "../src/lib/integration-secret-registry.js";

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
      const result = await prisma.clientIntegrationConnection.updateMany({
        where: {
          id: conn.id,
          metadata: conn.metadata, // optimistic concurrency snapshot compare
        },
        data: {
          metadata: updatedMeta,
        },
      });
      if (result.count === 0) {
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
