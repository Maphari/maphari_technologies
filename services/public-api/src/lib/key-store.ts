import { randomUUID } from "node:crypto";
import { prisma } from "./prisma.js";
import { encryptSecret, decryptSecret } from "./crypto.js";

export interface ApiKeyRecord {
  keyId: string;
  keySecret: string;
  clientId: string;
}

export interface LookedUpKey {
  keySecret: string;
  clientId: string;
}

export async function createApiKey(params: {
  clientId: string;
  projectId: string;
  label: string;
  encryptionKey: string;
  createdBy?: string;
  expiresAt?: Date;
}): Promise<ApiKeyRecord> {
  const keyId = `pk_${randomUUID().replace(/-/g, "")}`;
  const keySecret = `sk_${randomUUID().replace(/-/g, "")}`;
  const keySecretEnc = encryptSecret(keySecret, params.encryptionKey);

  await prisma.publicApiKey.create({
    data: {
      keyId,
      keySecretEnc,
      clientId: params.clientId,
      projectId: params.projectId,
      label: params.label,
      status: "ACTIVE",
      createdBy: params.createdBy ?? null,
      expiresAt: params.expiresAt ?? null,
    },
  });

  return { keyId, keySecret, clientId: params.clientId };
}

export async function lookupActiveKey(
  keyId: string,
  encryptionKey: string
): Promise<LookedUpKey | null> {
  const record = await prisma.publicApiKey.findUnique({ where: { keyId } });
  if (!record) return null;
  if (record.status !== "ACTIVE") return null;
  if (record.expiresAt && record.expiresAt < new Date()) return null;

  const keySecret = decryptSecret(record.keySecretEnc, encryptionKey);
  return { keySecret, clientId: record.clientId };
}

export async function revokeApiKey(
  keyId: string,
  revokedBy: string
): Promise<void> {
  await prisma.publicApiKey.update({
    where: { keyId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedBy,
    },
  });
}

export function touchLastUsed(
  keyId: string,
  log: { error: (obj: object) => void }
): void {
  prisma.publicApiKey
    .update({ where: { keyId }, data: { lastUsedAt: new Date() } })
    .catch((err) => log.error({ err, event: "lastUsedAt_update_failed" }));
}

export async function listApiKeys(clientId?: string) {
  return prisma.publicApiKey.findMany({
    where: clientId ? { clientId, status: "ACTIVE" } : { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
}

export async function listProjects(clientId?: string) {
  return prisma.publicApiProject.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { createdAt: "desc" },
  });
}
