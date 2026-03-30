// ════════════════════════════════════════════════════════════════════════════
// integrations.ts — Portal integrations catalog + Google Calendar OAuth routes
// Service : core  |  Scope: CLIENT read own; STAFF/ADMIN full access
// Note    : Google Calendar tokens are stored as UserPreference entries.
//           Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
//                              GOOGLE_REDIRECT_URI, FRONTEND_URL
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { randomUUID } from "node:crypto";
import { EventTopics } from "@maphari/platform";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { prisma } from "../lib/prisma.js";
import { eventBus } from "../lib/infrastructure.js";
import { encryptField, decryptField } from "../lib/integration-crypto.js";
import { encryptMetadataSecrets, decryptMetadataSecrets, validateConfigSummary } from "../lib/integration-secret-registry.js";

const enforceConfigSummaryAllowlist =
  process.env.ENFORCE_CONFIG_SUMMARY_ALLOWLIST !== "false";

type ProviderKind = "oauth" | "assisted" | "coming_soon";
type ProviderAvailabilityStatus = "active" | "beta" | "hidden" | "coming_soon" | "deprecated";
type RequestStatus = "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED";
type LegacyDisplayStatus = "connected" | "available" | "requested" | "coming_soon";

export interface IntegrationOption {
  provider: string;
  providerId: string;
  label: string;
  description: string;
  category: string;
  iconKey: string;
  kind: ProviderKind;
  availabilityStatus: ProviderAvailabilityStatus;
  requestEnabled: boolean;
  supportsDisconnect: boolean;
  supportsReconnect: boolean;
  supportsHealthChecks: boolean;
  status: LegacyDisplayStatus;
  connectedAt: string | null;
  requestedAt: string | null;
  requestId: string | null;
  requestStatus: RequestStatus | null;
}

const OPEN_REQUEST_STATUSES = ["REQUESTED", "IN_PROGRESS"];
const ALL_REQUEST_STATUSES = ["REQUESTED", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"] as const;
const VALID_REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  REQUESTED: ["IN_PROGRESS", "REJECTED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "REJECTED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};
const INTEGRATION_ALERT_RECIPIENT = process.env.INTEGRATION_ALERT_RECIPIENT_EMAIL ?? "ops@maphari.com";

const PROVIDER_CIRCUIT_BREAKER_THRESHOLD = Number(process.env.INTEGRATION_PROVIDER_CIRCUIT_THRESHOLD ?? 3);
const PROVIDER_CIRCUIT_BREAKER_COOLDOWN_MS = Number(process.env.INTEGRATION_PROVIDER_CIRCUIT_COOLDOWN_MS ?? 90_000);
const PROVIDER_RETRY_MAX_ATTEMPTS = Number(process.env.INTEGRATION_PROVIDER_RETRY_MAX_ATTEMPTS ?? 3);
const PROVIDER_RETRY_BASE_DELAY_MS = Number(process.env.INTEGRATION_PROVIDER_RETRY_BASE_DELAY_MS ?? 350);
const providerCircuitState = new Map<string, { consecutiveFailures: number; openUntil: number }>();

// ── Preference keys for Google Calendar token storage ─────────────────────
const GC_ACCESS_TOKEN_KEY  = "gcal_access_token";
const GC_REFRESH_TOKEN_KEY = "gcal_refresh_token";
const GC_EMAIL_KEY         = "gcal_email";
const GC_EXPIRY_KEY        = "gcal_token_expiry";

// ── Helpers: UserPreference token encryption ──────────────────────────────
function prefAad(userId: string, prefKey: string): string {
  return `userPreference/${userId}:${prefKey}/${prefKey}/v1`;
}

function encryptPref(userId: string, prefKey: string, value: string): string {
  return encryptField(value, process.env.INTEGRATION_ENCRYPTION_KEY!, prefAad(userId, prefKey));
}

// Always throws on decrypt failure (CREDENTIAL_DECRYPT_FAILED) — never returns null.
// Plan specified string|null but throw-only is safer: null would silently suppress
// downstream operations rather than surfacing the decrypt error as HTTP 500.
function decryptPref(
  userId: string,
  prefKey: string,
  stored: string,
  log: { warn: (obj: object) => void; error: (obj: object) => void },
  prefId: string,
): string {
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

interface GcalTokens {
  access_token:  string;
  refresh_token: string | null;
  expiry_date:   number | null;
  email:         string | null;
}

type TaskExternalLink = {
  id: string;
  providerKey: string;
  externalId: string;
  externalUrl: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
};

function parseMetadataRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readMetadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveSecretFromMetadata(
  metadata: Record<string, unknown>,
  directKey: string,
  refKey: string,
  envFallbackKeys: string[] = []
): string | null {
  const ref = readMetadataString(metadata, refKey);
  if (ref && process.env[ref]) return process.env[ref] ?? null;

  const direct = readMetadataString(metadata, directKey);
  if (direct) {
    if (direct.startsWith("env:")) {
      const envKey = direct.slice(4).trim();
      if (envKey.length > 0 && process.env[envKey]) return process.env[envKey] ?? null;
      return null;
    }
    return null;
  }

  for (const envKey of envFallbackKeys) {
    if (process.env[envKey]) return process.env[envKey] ?? null;
  }
  return null;
}

function getRetryAfterMs(retryAfterHeader: string | null): number | null {
  if (!retryAfterHeader) return null;
  const asSeconds = Number(retryAfterHeader);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) return asSeconds * 1000;
  const asDate = new Date(retryAfterHeader);
  if (!Number.isNaN(asDate.getTime())) {
    return Math.max(0, asDate.getTime() - Date.now());
  }
  return null;
}

function computeRetryDelayMs(attempt: number, retryAfterMs: number | null): number {
  if (retryAfterMs && retryAfterMs > 0) return Math.min(retryAfterMs, 15_000);
  const expo = PROVIDER_RETRY_BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 120);
  return Math.min(expo + jitter, 8_000);
}

async function sleepMs(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

type ProviderCallResult =
  | { ok: true; response: Response }
  | { ok: false; code: "CIRCUIT_OPEN" | "UPSTREAM_FAILED"; message: string; statusCode?: number; upstreamBody?: string };

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function callProviderWithSafety(
  providerKey: string,
  operationLabel: string,
  execute: () => Promise<Response>
): Promise<ProviderCallResult> {
  const now = Date.now();
  const state = providerCircuitState.get(providerKey);
  if (state && state.openUntil > now) {
    const opensInSec = Math.ceil((state.openUntil - now) / 1000);
    return {
      ok: false,
      code: "CIRCUIT_OPEN",
      message: `${providerKey.toUpperCase()} integration is temporarily paused after repeated failures. Retry in ~${opensInSec}s.`,
    };
  }

  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 1; attempt <= PROVIDER_RETRY_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await execute();
      if (response.ok) {
        providerCircuitState.set(providerKey, { consecutiveFailures: 0, openUntil: 0 });
        return { ok: true, response };
      }
      lastStatus = response.status;
      const bodyText = await response.text();
      lastBody = bodyText.slice(0, 600);
      const retryAfterMs = getRetryAfterMs(response.headers.get("retry-after"));
      if (attempt < PROVIDER_RETRY_MAX_ATTEMPTS && isRetryableStatus(response.status)) {
        await sleepMs(computeRetryDelayMs(attempt, retryAfterMs));
        continue;
      }
      break;
    } catch (error) {
      lastBody = error instanceof Error ? error.message.slice(0, 600) : "Provider call failed.";
      if (attempt < PROVIDER_RETRY_MAX_ATTEMPTS) {
        await sleepMs(computeRetryDelayMs(attempt, null));
        continue;
      }
      lastStatus = 0;
      break;
    }
  }

  const failures = (providerCircuitState.get(providerKey)?.consecutiveFailures ?? 0) + 1;
  const openUntil = failures >= PROVIDER_CIRCUIT_BREAKER_THRESHOLD ? Date.now() + PROVIDER_CIRCUIT_BREAKER_COOLDOWN_MS : 0;
  providerCircuitState.set(providerKey, { consecutiveFailures: failures, openUntil });
  return {
    ok: false,
    code: "UPSTREAM_FAILED",
    message: `${providerKey.toUpperCase()} ${operationLabel} failed.`,
    statusCode: lastStatus || undefined,
    upstreamBody: lastBody || undefined,
  };
}

function normalizeTaskExternalLinks(links: TaskExternalLink[]): TaskExternalLink[] {
  const nowIso = new Date().toISOString();
  return links.slice(0, 20).map((link) => ({
    id: link.id.trim(),
    providerKey: link.providerKey.trim().toLowerCase(),
    externalId: link.externalId.trim(),
    externalUrl: link.externalUrl.trim(),
    ...(link.title?.trim() ? { title: link.title.trim() } : {}),
    createdAt: link.createdAt ?? nowIso,
    updatedAt: nowIso,
  }));
}

// ── Refresh the access token using a stored refresh token ─────────────────
async function refreshGcalAccessToken(refreshToken: string): Promise<{ access_token: string; expiry_date: number } | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID     ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        refresh_token: refreshToken,
        grant_type:    "refresh_token",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    return {
      access_token: data.access_token,
      expiry_date:  Date.now() + (data.expires_in ?? 3600) * 1000,
    };
  } catch {
    return null;
  }
}

// ── Get a valid access token (refreshing if necessary) ────────────────────
async function getValidAccessToken(
  userId: string,
  log: { warn: (obj: object) => void; error: (obj: object) => void },
): Promise<string | null> {
  const [tokenPref, expiryPref, refreshPref] = await Promise.all([
    prisma.userPreference.findUnique({ where: { userId_key: { userId, key: GC_ACCESS_TOKEN_KEY } } }),
    prisma.userPreference.findUnique({ where: { userId_key: { userId, key: GC_EXPIRY_KEY } } }),
    prisma.userPreference.findUnique({ where: { userId_key: { userId, key: GC_REFRESH_TOKEN_KEY } } }),
  ]);

  if (!tokenPref) return null;

  const expiryDate = expiryPref ? Number(expiryPref.value) : 0;
  const isExpired  = expiryDate < Date.now() + 60_000; // refresh if < 1 min left

  // Non-expired path: decrypt the stored access token
  if (!isExpired) {
    return decryptPref(userId, GC_ACCESS_TOKEN_KEY, tokenPref.value, log, tokenPref.id);
  }

  // Expired path: load and decrypt refresh token, then issue new access token
  if (!refreshPref) return null;
  const refreshToken = decryptPref(userId, GC_REFRESH_TOKEN_KEY, refreshPref.value, log, refreshPref.id);

  const refreshed = await refreshGcalAccessToken(refreshToken);
  if (!refreshed) return null;

  await prisma.userPreference.upsert({
    where:  { userId_key: { userId, key: GC_ACCESS_TOKEN_KEY } },
    update: { value: encryptPref(userId, GC_ACCESS_TOKEN_KEY, refreshed.access_token) },
    create: { userId, key: GC_ACCESS_TOKEN_KEY, value: encryptPref(userId, GC_ACCESS_TOKEN_KEY, refreshed.access_token) },
  });
  await prisma.userPreference.upsert({
    where:  { userId_key: { userId, key: GC_EXPIRY_KEY } },
    update: { value: String(refreshed.expiry_date) },
    create: { userId, key: GC_EXPIRY_KEY, value: String(refreshed.expiry_date) },
  });

  return refreshed.access_token;
}

async function publishIntegrationFailureAlert(input: {
  requestId?: string;
  traceId?: string;
  clientId: string;
  providerKey: string;
  taskId?: string;
  reason: string;
}): Promise<void> {
  await eventBus.publish({
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    requestId: input.requestId,
    traceId: input.traceId,
    topic: EventTopics.notificationRequested,
    payload: {
      clientId: input.clientId,
      channel: "EMAIL",
      recipientEmail: INTEGRATION_ALERT_RECIPIENT,
      subject: `Integration failure: ${input.providerKey.toUpperCase()}`,
      message: `EXTERNAL_CREATE_FAILED for ${input.providerKey.toUpperCase()}${input.taskId ? ` task ${input.taskId}` : ""}: ${input.reason}`,
      tab: "myintegrations",
    },
  });
}

export async function registerIntegrationRoutes(app: FastifyInstance): Promise<void> {
  type IntegrationRequestUpdateSuccess = {
    ok: true;
    updated: Awaited<ReturnType<typeof prisma.clientIntegrationRequest.update>>;
  };
  type IntegrationRequestUpdateError = {
    ok: false;
    code: "NOT_FOUND" | "INVALID_TRANSITION" | "PROVIDER_NOT_FOUND";
    currentStatus?: RequestStatus;
    nextStatus?: RequestStatus;
  };
  const isRequestUpdateError = (
    value: IntegrationRequestUpdateSuccess | IntegrationRequestUpdateError
  ): value is IntegrationRequestUpdateError => value.ok === false;

  const applyRequestUpdate = async (
    requestId: string,
    body: {
      status?: RequestStatus;
      assignedToUserId?: string | null;
      notes?: string | null;
      rejectedReason?: string | null;
      priority?: string | null;
    },
    actorUserId: string | null
  ): Promise<IntegrationRequestUpdateSuccess | IntegrationRequestUpdateError> => {
    const existing = await prisma.clientIntegrationRequest.findUnique({ where: { id: requestId } });
    if (!existing) return { ok: false, code: "NOT_FOUND" };

    const nextStatus = body.status ?? (existing.status as RequestStatus);
    const currentStatus = existing.status as RequestStatus;
    if (body.status && body.status !== currentStatus) {
      const allowed = VALID_REQUEST_TRANSITIONS[currentStatus] ?? [];
      if (!allowed.includes(body.status)) {
        return { ok: false, code: "INVALID_TRANSITION", currentStatus, nextStatus: body.status };
      }
    }

    const data: {
      status?: RequestStatus;
      assignedToUserId?: string | null;
      notes?: string | null;
      rejectedReason?: string | null;
      priority?: string | null;
      completedAt?: Date | null;
      completedByUserId?: string | null;
    } = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.assignedToUserId !== undefined) data.assignedToUserId = body.assignedToUserId;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.rejectedReason !== undefined) data.rejectedReason = body.rejectedReason;

    if (nextStatus === "COMPLETED") {
      data.completedAt = existing.completedAt ?? new Date();
      data.completedByUserId = actorUserId;
    } else if (body.status !== undefined && existing.status !== body.status) {
      data.completedAt = null;
      data.completedByUserId = null;
    }

    const updated = await prisma.clientIntegrationRequest.update({
      where: { id: requestId },
      data,
    });

    if (updated.status === "COMPLETED") {
      const provider = await prisma.integrationProvider.findUnique({
        where: { key: updated.provider },
      });
      if (!provider) return { ok: false, code: "PROVIDER_NOT_FOUND" };

      await prisma.clientIntegrationConnection.upsert({
        where: {
          clientId_providerKey: {
            clientId: updated.clientId,
            providerKey: updated.provider,
          },
        },
        create: {
          clientId: updated.clientId,
          providerId: provider.id,
          providerKey: updated.provider,
          status: "CONNECTED",
          connectionType: "assisted",
          connectedByUserId: actorUserId,
          connectedAt: updated.completedAt ?? new Date(),
          healthStatus: "UNKNOWN",
        },
        update: {
          providerId: provider.id,
          status: "CONNECTED",
          connectionType: "assisted",
          connectedByUserId: actorUserId,
          connectedAt: updated.completedAt ?? new Date(),
          disconnectedAt: null,
        },
      });
    }

    return { ok: true, updated };
  };

  // ── GET /portal/settings/integrations ────────────────────────────────────
  app.get("/portal/settings/integrations", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (!scopedClientId || !scope.userId) {
      return reply.status(400).send({ success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse);
    }

    const [providers, requests, connections, tokenPref] = await Promise.all([
      prisma.integrationProvider.findMany({
        where: {
          isClientVisible: true,
          availabilityStatus: { not: "hidden" },
        },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      }),
      prisma.clientIntegrationRequest.findMany({
        where: {
          clientId: scopedClientId,
          status: { in: ALL_REQUEST_STATUSES as unknown as string[] },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.clientIntegrationConnection.findMany({
        where: { clientId: scopedClientId },
      }),
      prisma.userPreference.findUnique({
        where: { userId_key: { userId: scope.userId, key: GC_ACCESS_TOKEN_KEY } },
      }),
    ]);

    const latestRequestByProvider = new Map(requests.map((entry) => [entry.provider, entry]));
    const connectionByProvider = new Map(connections.map((entry) => [entry.providerKey, entry]));

    const data: IntegrationOption[] = providers.map((provider) => {
      const requestEntry = latestRequestByProvider.get(provider.key);
      const connection = connectionByProvider.get(provider.key);
      const gcalConnected = provider.key === "gcal" && !!tokenPref;
      const connectionConnected = connection?.status === "CONNECTED";
      const assistedConnected = provider.kind === "assisted" && requestEntry?.status === "COMPLETED";
      const isRequested = requestEntry?.status === "REQUESTED" || requestEntry?.status === "IN_PROGRESS";
      const isComingSoon = provider.kind === "coming_soon" || provider.availabilityStatus === "coming_soon";
      const connectedAt =
        connection?.connectedAt?.toISOString()
        ?? connection?.updatedAt.toISOString()
        ?? (gcalConnected ? tokenPref?.updatedAt.toISOString() ?? null : null)
        ?? (assistedConnected ? requestEntry?.completedAt?.toISOString() ?? requestEntry?.updatedAt.toISOString() ?? null : null);

      return {
        provider: provider.key,
        providerId: provider.id,
        label: provider.label,
        description: provider.description,
        category: provider.category,
        iconKey: provider.iconKey,
        kind: provider.kind as ProviderKind,
        availabilityStatus: provider.availabilityStatus as ProviderAvailabilityStatus,
        requestEnabled: provider.isRequestEnabled,
        supportsDisconnect: provider.supportsDisconnect,
        supportsReconnect: provider.supportsReconnect,
        supportsHealthChecks: provider.supportsHealthChecks,
        status:
          gcalConnected || connectionConnected || assistedConnected ? "connected"
          : isComingSoon ? "coming_soon"
          : isRequested ? "requested"
          : "available",
        connectedAt,
        requestedAt: isRequested ? requestEntry?.createdAt.toISOString() ?? null : null,
        requestId: requestEntry?.id ?? null,
        requestStatus: (requestEntry?.status as RequestStatus | undefined) ?? null,
      };
    });

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<IntegrationOption[]>;
  });

  app.post("/portal/settings/integrations/requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (!scopedClientId) {
      return reply.status(400).send({ success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse);
    }

    const body = request.body as { provider?: string; providerKey?: string };
    const providerKeyRaw = typeof body?.providerKey === "string" ? body.providerKey : body?.provider;
    const providerKey = typeof providerKeyRaw === "string" ? providerKeyRaw.trim() : "";
    const catalogEntry = providerKey
      ? await prisma.integrationProvider.findUnique({ where: { key: providerKey } })
      : null;

    if (!catalogEntry || !catalogEntry.isClientVisible || catalogEntry.availabilityStatus === "hidden") {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Unknown integration provider." } } as ApiResponse);
    }
    if (catalogEntry.kind === "oauth") {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "This integration is self-serve and should be connected directly." } } as ApiResponse);
    }
    if (catalogEntry.kind === "coming_soon" || !catalogEntry.isRequestEnabled) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "This integration is not available for requests yet." } } as ApiResponse);
    }

    const existing = await prisma.clientIntegrationRequest.findFirst({
      where: {
        clientId: scopedClientId,
        provider: catalogEntry.key,
        status: { in: OPEN_REQUEST_STATUSES },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return { success: true, data: existing, meta: { requestId: scope.requestId } } as ApiResponse<typeof existing>;
    }

    const created = await prisma.clientIntegrationRequest.create({
      data: {
        clientId: scopedClientId,
        provider: catalogEntry.key,
        status: "REQUESTED",
        requestedByUserId: scope.userId ?? null,
      },
    });

    return reply.code(201).send({ success: true, data: created, meta: { requestId: scope.requestId } } as ApiResponse<typeof created>);
  });

  app.patch("/portal/settings/integrations/requests/:requestId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only staff or admins can update integration requests." } } as ApiResponse);
    }

    const params = request.params as { requestId?: string };
    const body = request.body as { status?: RequestStatus };
    if (!params.requestId || !body?.status || !(ALL_REQUEST_STATUSES as readonly string[]).includes(body.status)) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "A valid requestId and status are required." } } as ApiResponse);
    }

    const result = await applyRequestUpdate(
      params.requestId,
      { status: body.status },
      scope.userId ?? null
    );
    if (isRequestUpdateError(result)) {
      if (result.code === "NOT_FOUND") {
        return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Integration request not found." } } as ApiResponse);
      }
      if (result.code === "INVALID_TRANSITION") {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid status transition from ${result.currentStatus} to ${result.nextStatus}.`,
          },
        } as ApiResponse);
      }
      if (result.code === "PROVIDER_NOT_FOUND") {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Request provider is not configured in provider catalog." },
        } as ApiResponse);
      }
      return reply.status(500).send({ success: false, error: { code: "INTEGRATION_REQUEST_UPDATE_FAILED", message: "Unable to update integration request." } } as ApiResponse);
    }

    return { success: true, data: result.updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof result.updated>;
  });

  // ── GET /admin/integrations/providers ───────────────────────────────────
  app.get("/admin/integrations/providers", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only staff or admins can manage integration providers." } } as ApiResponse);
    }

    const query = request.query as {
      availabilityStatus?: string;
      kind?: string;
      isClientVisible?: string;
      isRequestEnabled?: string;
    };

    const parseBoolean = (value: string | undefined): boolean | undefined => {
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    };

    const where = {
      ...(typeof query.availabilityStatus === "string" && query.availabilityStatus.length > 0 ? { availabilityStatus: query.availabilityStatus } : {}),
      ...(typeof query.kind === "string" && query.kind.length > 0 ? { kind: query.kind } : {}),
      ...(parseBoolean(query.isClientVisible) !== undefined ? { isClientVisible: parseBoolean(query.isClientVisible) } : {}),
      ...(parseBoolean(query.isRequestEnabled) !== undefined ? { isRequestEnabled: parseBoolean(query.isRequestEnabled) } : {}),
    };

    const providers = await prisma.integrationProvider.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });

    return {
      success: true,
      data: providers.map((provider) => ({
        ...provider,
        createdAt: provider.createdAt.toISOString(),
        updatedAt: provider.updatedAt.toISOString(),
      })),
      meta: { requestId: scope.requestId },
    } as ApiResponse<Array<Record<string, unknown>>>;
  });

  // ── PATCH /admin/integrations/providers/:providerId ─────────────────────
  app.patch("/admin/integrations/providers/:providerId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only staff or admins can manage integration providers." } } as ApiResponse);
    }

    const params = request.params as { providerId?: string };
    if (!params.providerId) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "providerId is required." } } as ApiResponse);
    }

    const body = (request.body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    const setString = (key: string) => {
      if (body[key] !== undefined) data[key] = body[key] == null ? null : String(body[key]);
    };
    const setBool = (key: string) => {
      if (body[key] === undefined) return;
      const value = body[key];
      if (typeof value === "boolean") {
        data[key] = value;
        return;
      }
      if (value === "true") {
        data[key] = true;
        return;
      }
      if (value === "false") {
        data[key] = false;
      }
    };
    const setInt = (key: string) => {
      if (body[key] === undefined) return;
      const parsed = Number(body[key]);
      if (!Number.isNaN(parsed)) data[key] = parsed;
    };

    setString("label");
    setString("description");
    setString("category");
    setString("availabilityStatus");
    setBool("isClientVisible");
    setBool("isRequestEnabled");
    setBool("supportsDisconnect");
    setBool("supportsReconnect");
    setBool("supportsHealthChecks");
    setInt("sortOrder");
    setString("helpUrl");
    setString("setupGuideUrl");
    setString("launchStage");
    setString("iconKey");
    if (body.metadata !== undefined) data.metadata = body.metadata;

    const updated = await prisma.integrationProvider.update({
      where: { id: params.providerId },
      data,
    });

    return {
      success: true,
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      meta: { requestId: scope.requestId },
    } as ApiResponse<Record<string, unknown>>;
  });

  // ── GET /admin/integration-requests ─────────────────────────────────────
  app.get("/admin/integration-requests", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Only staff or admins can view integration requests." },
      } as ApiResponse);
    }

    const query = request.query as {
      status?: RequestStatus;
      providerKey?: string;
      clientId?: string;
      assignedToUserId?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    };

    const createdAtRange: { gte?: Date; lte?: Date } = {};
    if (typeof query.dateFrom === "string" && query.dateFrom.trim().length > 0) {
      const value = new Date(query.dateFrom);
      if (!Number.isNaN(value.getTime())) createdAtRange.gte = value;
    }
    if (typeof query.dateTo === "string" && query.dateTo.trim().length > 0) {
      const value = new Date(query.dateTo);
      if (!Number.isNaN(value.getTime())) createdAtRange.lte = value;
    }

    const search = typeof query.search === "string" ? query.search.trim() : "";
    const where = {
      ...(typeof query.status === "string" && (ALL_REQUEST_STATUSES as readonly string[]).includes(query.status) ? { status: query.status } : {}),
      ...(typeof query.providerKey === "string" && query.providerKey.trim().length > 0 ? { provider: query.providerKey.trim() } : {}),
      ...(typeof query.clientId === "string" && query.clientId.trim().length > 0 ? { clientId: query.clientId.trim() } : {}),
      ...(typeof query.assignedToUserId === "string" && query.assignedToUserId.trim().length > 0 ? { assignedToUserId: query.assignedToUserId.trim() } : {}),
      ...(Object.keys(createdAtRange).length > 0 ? { createdAt: createdAtRange } : {}),
      ...(search.length > 0
        ? {
            OR: [
              { provider: { contains: search, mode: "insensitive" as const } },
              { notes: { contains: search, mode: "insensitive" as const } },
              { client: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const requests = await prisma.clientIntegrationRequest.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const providerKeys = Array.from(new Set(requests.map((entry) => entry.provider)));
    const providers = providerKeys.length > 0
      ? await prisma.integrationProvider.findMany({
          where: { key: { in: providerKeys } },
          select: { key: true, label: true },
        })
      : [];
    const providerLabelByKey = new Map(providers.map((provider) => [provider.key, provider.label]));

    const items = requests.map((entry) => ({
      id: entry.id,
      clientId: entry.clientId,
      clientName: entry.client.name,
      providerKey: entry.provider,
      providerLabel: providerLabelByKey.get(entry.provider) ?? entry.provider,
      status: entry.status as RequestStatus,
      requestedByUserId: entry.requestedByUserId ?? null,
      requestedByName: null,
      requestedByEmail: null,
      assignedToUserId: entry.assignedToUserId ?? null,
      assignedToName: null,
      notes: entry.notes ?? null,
      rejectedReason: entry.rejectedReason ?? null,
      requestedAt: entry.createdAt.toISOString(),
      completedAt: entry.completedAt?.toISOString() ?? null,
      completedByUserId: entry.completedByUserId ?? null,
      priority: entry.priority ?? null,
    }));

    return { success: true, data: items, meta: { requestId: scope.requestId } } as ApiResponse<typeof items>;
  });

  // ── PATCH /admin/integration-requests/:requestId ────────────────────────
  app.patch("/admin/integration-requests/:requestId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Only staff or admins can update integration requests." },
      } as ApiResponse);
    }

    const params = request.params as { requestId?: string };
    if (!params.requestId) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "requestId is required." },
      } as ApiResponse);
    }

    const body = (request.body ?? {}) as {
      status?: RequestStatus;
      assignedToUserId?: string | null;
      notes?: string | null;
      rejectedReason?: string | null;
      priority?: string | null;
    };
    if (body.status !== undefined && !(ALL_REQUEST_STATUSES as readonly string[]).includes(body.status)) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid status value." },
      } as ApiResponse);
    }

    const result = await applyRequestUpdate(
      params.requestId,
      {
        status: body.status,
        assignedToUserId: body.assignedToUserId,
        notes: body.notes,
        rejectedReason: body.rejectedReason,
        priority: body.priority,
      },
      scope.userId ?? null
    );

    if (isRequestUpdateError(result)) {
      if (result.code === "NOT_FOUND") {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Integration request not found." },
        } as ApiResponse);
      }
      if (result.code === "INVALID_TRANSITION") {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid status transition from ${result.currentStatus} to ${result.nextStatus}.`,
          },
        } as ApiResponse);
      }
      if (result.code === "PROVIDER_NOT_FOUND") {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Request provider is not configured in provider catalog." },
        } as ApiResponse);
      }
      return reply.status(500).send({
        success: false,
        error: { code: "INTEGRATION_REQUEST_UPDATE_FAILED", message: "Unable to update integration request." },
      } as ApiResponse);
    }

    return { success: true, data: result.updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof result.updated>;
  });

  // ── POST /admin/integrations/tasks/:taskId/create-external-link ─────────
  app.post("/admin/integrations/tasks/:taskId/create-external-link", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Only staff or admins can create external task links." },
      } as ApiResponse);
    }

    const params = request.params as { taskId?: string };
    const body = request.body as {
      providerKey?: string;
      title?: string;
      description?: string;
      idempotencyKey?: string;
    };
    const taskId = typeof params.taskId === "string" ? params.taskId.trim() : "";
    const providerKey = typeof body.providerKey === "string" ? body.providerKey.trim().toLowerCase() : "";
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim().slice(0, 180) : null;
    if (!taskId || !providerKey) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "taskId and providerKey are required." },
      } as ApiResponse);
    }
    if (!["jira", "asana", "clickup"].includes(providerKey)) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Unsupported provider for external task creation." },
      } as ApiResponse);
    }

    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
      include: { project: { select: { id: true, clientId: true, name: true } } },
    });
    if (!task) {
      return reply.status(404).send({
        success: false,
        error: { code: "TASK_NOT_FOUND", message: "Task not found." },
      } as ApiResponse);
    }

    const connection = await prisma.clientIntegrationConnection.findFirst({
      where: {
        clientId: task.project.clientId,
        providerKey,
        status: "CONNECTED",
      },
      orderBy: { updatedAt: "desc" },
    });
    if (!connection) {
      return reply.status(400).send({
        success: false,
        error: { code: "INTEGRATION_NOT_CONNECTED", message: "Selected integration is not connected for this client." },
      } as ApiResponse);
    }

    const rawMeta = connection.metadata as Record<string, unknown> | null;
    const metaInternal = rawMeta != null
      ? decryptMetadataSecrets(connection.providerKey, rawMeta, process.env.INTEGRATION_ENCRYPTION_KEY!, connection.id, request.log).internal
      : null;
    const metadata = parseMetadataRecord(metaInternal);
    const title = (typeof body.title === "string" && body.title.trim().length > 0 ? body.title.trim() : task.title).slice(0, 180);
    const description = typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : `Project: ${task.project.name}\nTask: ${task.title}\nCreated by Maphari staff sync flow.`;

    const startedAt = new Date();
    const syncBase = {
      connectionId: connection.id,
      clientId: task.project.clientId,
      taskId: task.id,
      providerKey,
      idempotencyKey,
      startedAt,
    };
    const traceId = (request.headers["x-trace-id"] as string | undefined) ?? scope.requestId;
    const alertFailure = async (reason: string) => {
      try {
        await publishIntegrationFailureAlert({
          requestId: scope.requestId,
          traceId,
          clientId: task.project.clientId,
          providerKey,
          taskId: task.id,
          reason,
        });
      } catch {
        // non-blocking alert publish
      }
    };

    if (idempotencyKey) {
      const existingSync = await prisma.integrationSyncEvent.findFirst({
        where: {
          taskId: task.id,
          providerKey,
          idempotencyKey,
        },
        orderBy: { createdAt: "desc" },
      });
      if (existingSync) {
        if (existingSync.status === "SUCCESS") {
          const details = parseMetadataRecord(existingSync.details);
          const externalId = readMetadataString(details, "externalId");
          const externalUrl = readMetadataString(details, "externalUrl");
          const existingLinks = Array.isArray(task.externalLinks) ? (task.externalLinks as unknown as TaskExternalLink[]) : [];
          const existingLink =
            existingLinks.find((link) => link.providerKey === providerKey && externalId && link.externalId === externalId)
            ?? existingLinks.find((link) => externalUrl && link.externalUrl === externalUrl);
          if (existingLink) {
            return {
              success: true,
              data: {
                task,
                createdLink: {
                  providerKey: existingLink.providerKey,
                  externalId: existingLink.externalId,
                  externalUrl: existingLink.externalUrl,
                  title: existingLink.title ?? title,
                },
              },
              meta: { requestId: scope.requestId },
            } as ApiResponse<{ task: typeof task; createdLink: Record<string, string> }>;
          }
        }
        return reply.status(409).send({
          success: false,
          error: {
            code: "IDEMPOTENCY_REPLAY_CONFLICT",
            message: `This idempotency key was already used for a ${existingSync.status.toLowerCase()} attempt.`,
          },
        } as ApiResponse);
      }
    }

    try {
      let externalId = "";
      let externalUrl = "";

      if (providerKey === "jira") {
        const baseUrl = readMetadataString(metadata, "baseUrl");
        const email = readMetadataString(metadata, "email");
        const apiToken = resolveSecretFromMetadata(metadata, "apiToken", "apiTokenRef", ["JIRA_API_TOKEN"]);
        const projectKey = readMetadataString(metadata, "projectKey");
        const issueTypeName = readMetadataString(metadata, "issueTypeName") ?? "Task";
        if (!baseUrl || !email || !apiToken || !projectKey) {
          await alertFailure("Jira metadata missing or insecure secret format.");
          return reply.status(400).send({
            success: false,
            error: { code: "INTEGRATION_CONFIG_MISSING", message: "Jira connection metadata is incomplete. Tokens must be referenced via apiTokenRef or env:*." },
          } as ApiResponse);
        }
        const jiraCreateRes = await callProviderWithSafety(providerKey, "create issue", () => fetch(`${baseUrl.replace(/\/+$/, "")}/rest/api/3/issue`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
          },
          body: JSON.stringify({
            fields: {
              project: { key: projectKey },
              summary: title,
              description,
              issuetype: { name: issueTypeName },
            },
          }),
        }));
        if (!jiraCreateRes.ok) {
          await prisma.integrationSyncEvent.create({
            data: {
              ...syncBase,
              status: "FAILED",
              finishedAt: new Date(),
              durationMs: Date.now() - startedAt.getTime(),
              errorCode: jiraCreateRes.code === "CIRCUIT_OPEN"
                ? "JIRA_CIRCUIT_OPEN"
                : `JIRA_${jiraCreateRes.statusCode ?? "UPSTREAM"}`,
              errorMessage: (jiraCreateRes.upstreamBody ?? jiraCreateRes.message).slice(0, 600),
            },
          });
          await alertFailure(jiraCreateRes.message);
          return reply.status(502).send({
            success: false,
            error: { code: jiraCreateRes.code === "CIRCUIT_OPEN" ? "INTEGRATION_TEMPORARILY_UNAVAILABLE" : "EXTERNAL_CREATE_FAILED", message: jiraCreateRes.message },
          } as ApiResponse);
        }
        const jiraPayload = await jiraCreateRes.response.json() as { key?: string; self?: string };
        externalId = jiraPayload.key ?? "";
        externalUrl = externalId ? `${baseUrl.replace(/\/+$/, "")}/browse/${encodeURIComponent(externalId)}` : (jiraPayload.self ?? "");
      } else if (providerKey === "asana") {
        const accessToken = resolveSecretFromMetadata(metadata, "accessToken", "accessTokenRef", ["ASANA_ACCESS_TOKEN"]);
        const workspaceId = readMetadataString(metadata, "workspaceId");
        const projectId = readMetadataString(metadata, "projectId");
        if (!accessToken || !workspaceId || !projectId) {
          await alertFailure("Asana metadata missing or insecure secret format.");
          return reply.status(400).send({
            success: false,
            error: { code: "INTEGRATION_CONFIG_MISSING", message: "Asana connection metadata is incomplete. Tokens must be referenced via accessTokenRef or env:*." },
          } as ApiResponse);
        }
        const asanaRes = await callProviderWithSafety(providerKey, "create task", () => fetch("https://app.asana.com/api/1.0/tasks", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            data: {
              name: title,
              notes: description,
              workspace: workspaceId,
              projects: [projectId],
            },
          }),
        }));
        if (!asanaRes.ok) {
          await prisma.integrationSyncEvent.create({
            data: {
              ...syncBase,
              status: "FAILED",
              finishedAt: new Date(),
              durationMs: Date.now() - startedAt.getTime(),
              errorCode: asanaRes.code === "CIRCUIT_OPEN"
                ? "ASANA_CIRCUIT_OPEN"
                : `ASANA_${asanaRes.statusCode ?? "UPSTREAM"}`,
              errorMessage: (asanaRes.upstreamBody ?? asanaRes.message).slice(0, 600),
            },
          });
          await alertFailure(asanaRes.message);
          return reply.status(502).send({
            success: false,
            error: { code: asanaRes.code === "CIRCUIT_OPEN" ? "INTEGRATION_TEMPORARILY_UNAVAILABLE" : "EXTERNAL_CREATE_FAILED", message: asanaRes.message },
          } as ApiResponse);
        }
        const asanaPayload = await asanaRes.response.json() as { data?: { gid?: string; permalink_url?: string } };
        externalId = asanaPayload.data?.gid ?? "";
        externalUrl = asanaPayload.data?.permalink_url ?? (externalId ? `https://app.asana.com/0/${encodeURIComponent(projectId)}/${encodeURIComponent(externalId)}` : "");
      } else {
        const apiToken = resolveSecretFromMetadata(metadata, "apiToken", "apiTokenRef", ["CLICKUP_API_TOKEN"]);
        const listId = readMetadataString(metadata, "listId");
        if (!apiToken || !listId) {
          await alertFailure("ClickUp metadata missing or insecure secret format.");
          return reply.status(400).send({
            success: false,
            error: { code: "INTEGRATION_CONFIG_MISSING", message: "ClickUp connection metadata is incomplete. Tokens must be referenced via apiTokenRef or env:*." },
          } as ApiResponse);
        }
        const clickUpRes = await callProviderWithSafety(providerKey, "create task", () => fetch(`https://api.clickup.com/api/v2/list/${encodeURIComponent(listId)}/task`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: apiToken,
          },
          body: JSON.stringify({
            name: title,
            description,
          }),
        }));
        if (!clickUpRes.ok) {
          await prisma.integrationSyncEvent.create({
            data: {
              ...syncBase,
              status: "FAILED",
              finishedAt: new Date(),
              durationMs: Date.now() - startedAt.getTime(),
              errorCode: clickUpRes.code === "CIRCUIT_OPEN"
                ? "CLICKUP_CIRCUIT_OPEN"
                : `CLICKUP_${clickUpRes.statusCode ?? "UPSTREAM"}`,
              errorMessage: (clickUpRes.upstreamBody ?? clickUpRes.message).slice(0, 600),
            },
          });
          await alertFailure(clickUpRes.message);
          return reply.status(502).send({
            success: false,
            error: { code: clickUpRes.code === "CIRCUIT_OPEN" ? "INTEGRATION_TEMPORARILY_UNAVAILABLE" : "EXTERNAL_CREATE_FAILED", message: clickUpRes.message },
          } as ApiResponse);
        }
        const clickupPayload = await clickUpRes.response.json() as { id?: string; url?: string };
        externalId = clickupPayload.id ?? "";
        externalUrl = clickupPayload.url ?? (externalId ? `https://app.clickup.com/t/${encodeURIComponent(externalId)}` : "");
      }

      if (!externalId || !externalUrl) {
        await prisma.integrationSyncEvent.create({
          data: {
            ...syncBase,
            status: "FAILED",
            finishedAt: new Date(),
            durationMs: Date.now() - startedAt.getTime(),
            errorCode: "MISSING_EXTERNAL_REFERENCE",
            errorMessage: "Provider response did not include required external identifiers.",
          },
        });
        await alertFailure("Provider response missing external reference.");
        return reply.status(502).send({
          success: false,
          error: { code: "EXTERNAL_CREATE_FAILED", message: "Provider response did not include link details." },
        } as ApiResponse);
      }

      const existingLinks = Array.isArray(task.externalLinks) ? (task.externalLinks as unknown as TaskExternalLink[]) : [];
      const duplicate = existingLinks.find((link) => link.providerKey === providerKey && link.externalId === externalId);
      const mergedLinks = duplicate
        ? existingLinks
        : [
            ...existingLinks,
            {
              id: randomUUID(),
              providerKey,
              externalId,
              externalUrl,
              title,
            },
          ];
      const normalizedLinks = normalizeTaskExternalLinks(mergedLinks);
      const updatedTask = await prisma.projectTask.update({
        where: { id: task.id },
        data: { externalLinks: normalizedLinks },
      });

      try {
        await prisma.integrationSyncEvent.create({
          data: {
            ...syncBase,
            status: "SUCCESS",
            finishedAt: new Date(),
            durationMs: Date.now() - startedAt.getTime(),
            summary: `Created external task ${providerKey.toUpperCase()} ${externalId}`,
            details: { taskId: task.id, providerKey, externalId, externalUrl },
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (
          !message.includes("integration_sync_events_task_provider_idempotency_success_uniq")
          && !message.includes("integration_sync_events_task_provider_idempotency_uniq")
          && !message.includes("Unique constraint failed")
        ) {
          throw error;
        }
      }

      return {
        success: true,
        data: {
          task: updatedTask,
          createdLink: {
            providerKey,
            externalId,
            externalUrl,
            title,
          },
        },
        meta: { requestId: scope.requestId },
      } as ApiResponse<{ task: typeof updatedTask; createdLink: Record<string, string> }>;
    } catch (error) {
      request.log.error(error);
      await prisma.integrationSyncEvent.create({
        data: {
          ...syncBase,
          status: "FAILED",
          finishedAt: new Date(),
          durationMs: Date.now() - startedAt.getTime(),
          errorCode: "EXTERNAL_CREATE_EXCEPTION",
          errorMessage: error instanceof Error ? error.message.slice(0, 600) : "Unknown external task create failure.",
        },
      });
      await alertFailure(error instanceof Error ? error.message : "Unknown external task create failure.");
      return reply.status(500).send({
        success: false,
        error: { code: "EXTERNAL_CREATE_FAILED", message: "Unable to create external task link." },
      } as ApiResponse);
    }
  });

  // ── GET /admin/tasks/:taskId/integration-sync-events ─────────────────────
  app.get("/admin/tasks/:taskId/integration-sync-events", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Only staff or admins can view integration sync logs." },
      } as ApiResponse);
    }
    const params = request.params as { taskId?: string };
    const taskId = typeof params.taskId === "string" ? params.taskId.trim() : "";
    if (!taskId) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "taskId is required." },
      } as ApiResponse);
    }
    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
      include: { project: { select: { clientId: true } } },
    });
    if (!task) {
      return reply.status(404).send({
        success: false,
        error: { code: "TASK_NOT_FOUND", message: "Task not found." },
      } as ApiResponse);
    }
    const records = await prisma.integrationSyncEvent.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    const items = records.map((entry) => ({
      id: entry.id,
      taskId: entry.taskId,
      providerKey: entry.providerKey,
      status: entry.status,
      startedAt: entry.startedAt.toISOString(),
      finishedAt: entry.finishedAt?.toISOString() ?? null,
      durationMs: entry.durationMs ?? null,
      summary: entry.summary ?? null,
      errorCode: entry.errorCode ?? null,
      errorMessage: entry.errorMessage ?? null,
      createdAt: entry.createdAt.toISOString(),
    }));
    return {
      success: true,
      data: items,
      meta: { requestId: scope.requestId },
    } as ApiResponse<typeof items>;
  });

  // ── GET /admin/integrations/connections ──────────────────────────────────
  app.get("/admin/integrations/connections", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Only staff or admins can view integration connections." },
      } as ApiResponse);
    }

    const query = request.query as {
      clientId?: string;
      providerKey?: string;
      status?: string;
      healthStatus?: string;
    };

    const where = {
      ...(typeof query.clientId === "string" && query.clientId.trim().length > 0 ? { clientId: query.clientId.trim() } : {}),
      ...(typeof query.providerKey === "string" && query.providerKey.trim().length > 0 ? { providerKey: query.providerKey.trim() } : {}),
      ...(typeof query.status === "string" && query.status.trim().length > 0 ? { status: query.status.trim() } : {}),
      ...(typeof query.healthStatus === "string" && query.healthStatus.trim().length > 0 ? { healthStatus: query.healthStatus.trim() } : {}),
    };

    const connections = await prisma.clientIntegrationConnection.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        provider: { select: { id: true, key: true, label: true, category: true } },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 200,
    });

    const items = connections.map((conn) => ({
      id: conn.id,
      clientId: conn.clientId,
      clientName: conn.client.name,
      providerId: conn.providerId,
      providerKey: conn.providerKey,
      providerLabel: conn.provider.label,
      providerCategory: conn.provider.category,
      status: conn.status,
      connectionType: conn.connectionType,
      connectedByUserId: conn.connectedByUserId ?? null,
      connectedByContactEmail: conn.connectedByContactEmail ?? null,
      assignedOwnerUserId: conn.assignedOwnerUserId ?? null,
      connectedAt: conn.connectedAt?.toISOString() ?? null,
      disconnectedAt: conn.disconnectedAt?.toISOString() ?? null,
      lastCheckedAt: conn.lastCheckedAt?.toISOString() ?? null,
      lastSyncedAt: conn.lastSyncedAt?.toISOString() ?? null,
      lastSuccessfulSyncAt: conn.lastSuccessfulSyncAt?.toISOString() ?? null,
      lastErrorCode: conn.lastErrorCode ?? null,
      lastErrorMessage: conn.lastErrorMessage ?? null,
      healthStatus: conn.healthStatus ?? null,
      externalAccountId: conn.externalAccountId ?? null,
      externalAccountLabel: conn.externalAccountLabel ?? null,
      createdAt: conn.createdAt.toISOString(),
      updatedAt: conn.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data: items,
      meta: { requestId: scope.requestId },
    } as ApiResponse<typeof items>;
  });

  // ── GET /admin/integrations/connections/:connectionId/sync-events ─────────
  app.get("/admin/integrations/connections/:connectionId/sync-events", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Only staff or admins can view connection sync events." },
      } as ApiResponse);
    }

    const params = request.params as { connectionId?: string };
    const connectionId = typeof params.connectionId === "string" ? params.connectionId.trim() : "";
    if (!connectionId) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "connectionId is required." },
      } as ApiResponse);
    }

    const connection = await prisma.clientIntegrationConnection.findUnique({
      where: { id: connectionId },
      select: { id: true },
    });
    if (!connection) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Connection not found." },
      } as ApiResponse);
    }

    const records = await prisma.integrationSyncEvent.findMany({
      where: { connectionId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const items = records.map((entry) => ({
      id: entry.id,
      connectionId: entry.connectionId,
      clientId: entry.clientId,
      providerKey: entry.providerKey,
      status: entry.status,
      startedAt: entry.startedAt.toISOString(),
      finishedAt: entry.finishedAt?.toISOString() ?? null,
      durationMs: entry.durationMs ?? null,
      summary: entry.summary ?? null,
      errorCode: entry.errorCode ?? null,
      errorMessage: entry.errorMessage ?? null,
      details: entry.details ?? null,
      createdAt: entry.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: items,
      meta: { requestId: scope.requestId },
    } as ApiResponse<typeof items>;
  });

  // ── POST /admin/integrations/connections ─────────────────────────────────
  app.post("/admin/integrations/connections", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Only staff or admins can create integration connections." },
      } as ApiResponse);
    }

    const body = (request.body ?? {}) as {
      clientId?: string;
      providerKey?: string;
      status?: string;
      connectionType?: string;
      connectedByContactEmail?: string | null;
      assignedOwnerUserId?: string | null;
      externalAccountId?: string | null;
      externalAccountLabel?: string | null;
      configurationSummary?: unknown;
      metadata?: unknown;
    };

    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    const providerKey = typeof body.providerKey === "string" ? body.providerKey.trim().toLowerCase() : "";
    if (!clientId || !providerKey) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "clientId and providerKey are required." },
      } as ApiResponse);
    }

    const provider = await prisma.integrationProvider.findUnique({ where: { key: providerKey } });
    if (!provider) {
      return reply.status(404).send({
        success: false,
        error: { code: "PROVIDER_NOT_FOUND", message: "Integration provider not found." },
      } as ApiResponse);
    }

    if (body.configurationSummary !== undefined && body.configurationSummary !== null && typeof body.configurationSummary === "object" && !Array.isArray(body.configurationSummary)) {
      const validationError = validateConfigSummary(
        providerKey,
        body.configurationSummary as Record<string, unknown>
      );
      if (validationError) {
        request.log.warn({
          event: enforceConfigSummaryAllowlist ? "config_summary_rejected" : "config_summary_unknown_provider_warn",
          providerKey,
          unknownKeys: validationError.unknownKeys,
        });
        if (enforceConfigSummaryAllowlist) {
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
    }

    // Extract rawMetadata before upsert — connection.id is needed for AAD
    const rawMetadata = body.metadata != null && typeof body.metadata === "object"
      ? (body.metadata as Record<string, unknown>)
      : null;

    // Step A: upsert without touching metadata (id needed for AAD in Step B)
    const connection = await prisma.clientIntegrationConnection.upsert({
      where: { clientId_providerKey: { clientId, providerKey } },
      create: {
        clientId,
        providerId: provider.id,
        providerKey,
        status: typeof body.status === "string" && body.status.trim().length > 0 ? body.status.trim() : "CONNECTED",
        connectionType: typeof body.connectionType === "string" && body.connectionType.trim().length > 0 ? body.connectionType.trim() : "assisted",
        connectedByUserId: scope.userId ?? null,
        connectedByContactEmail: typeof body.connectedByContactEmail === "string" ? body.connectedByContactEmail.trim() : null,
        assignedOwnerUserId: typeof body.assignedOwnerUserId === "string" ? body.assignedOwnerUserId.trim() : null,
        connectedAt: new Date(),
        healthStatus: "UNKNOWN",
        externalAccountId: typeof body.externalAccountId === "string" ? body.externalAccountId.trim() : null,
        externalAccountLabel: typeof body.externalAccountLabel === "string" ? body.externalAccountLabel.trim() : null,
        configurationSummary: body.configurationSummary ?? null,
        metadata: null,
      },
      update: {
        providerId: provider.id,
        status: typeof body.status === "string" && body.status.trim().length > 0 ? body.status.trim() : "CONNECTED",
        connectionType: typeof body.connectionType === "string" && body.connectionType.trim().length > 0 ? body.connectionType.trim() : "assisted",
        connectedByUserId: scope.userId ?? null,
        connectedByContactEmail: typeof body.connectedByContactEmail === "string" ? body.connectedByContactEmail.trim() : null,
        assignedOwnerUserId: typeof body.assignedOwnerUserId === "string" ? body.assignedOwnerUserId.trim() : null,
        connectedAt: new Date(),
        disconnectedAt: null,
        externalAccountId: typeof body.externalAccountId === "string" ? body.externalAccountId.trim() : null,
        externalAccountLabel: typeof body.externalAccountLabel === "string" ? body.externalAccountLabel.trim() : null,
        configurationSummary: body.configurationSummary ?? null,
        // metadata intentionally omitted — updated in Step B only if provided
      },
    });

    // Step B: encrypt metadata and write if caller provided it
    let metaApiView: Record<string, unknown> | null = null;
    if (rawMetadata != null) {
      const encrypted = encryptMetadataSecrets(
        providerKey, rawMetadata, process.env.INTEGRATION_ENCRYPTION_KEY!, connection.id
      );
      await prisma.clientIntegrationConnection.update({
        where: { id: connection.id },
        data: { metadata: encrypted } as Record<string, unknown>,
      });
      metaApiView = decryptMetadataSecrets(
        providerKey, encrypted, process.env.INTEGRATION_ENCRYPTION_KEY!, connection.id, request.log
      ).apiView;
    }

    return {
      success: true,
      data: {
        ...connection,
        metadata: metaApiView,
        connectedAt: connection.connectedAt?.toISOString() ?? null,
        disconnectedAt: connection.disconnectedAt?.toISOString() ?? null,
        lastCheckedAt: connection.lastCheckedAt?.toISOString() ?? null,
        lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
        lastSuccessfulSyncAt: connection.lastSuccessfulSyncAt?.toISOString() ?? null,
        createdAt: connection.createdAt.toISOString(),
        updatedAt: connection.updatedAt.toISOString(),
      },
      meta: { requestId: scope.requestId },
    } as ApiResponse<Record<string, unknown>>;
  });

  // ── PATCH /admin/integrations/connections/:connectionId ───────────────────
  app.patch("/admin/integrations/connections/:connectionId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Only staff or admins can update integration connections." },
      } as ApiResponse);
    }

    const params = request.params as { connectionId?: string };
    const connectionId = typeof params.connectionId === "string" ? params.connectionId.trim() : "";
    if (!connectionId) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "connectionId is required." },
      } as ApiResponse);
    }

    const existing = await prisma.clientIntegrationConnection.findUnique({ where: { id: connectionId } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Connection not found." },
      } as ApiResponse);
    }

    const body = (request.body ?? {}) as Record<string, unknown>;

    if (body.configurationSummary !== undefined && body.configurationSummary !== null && typeof body.configurationSummary === "object" && !Array.isArray(body.configurationSummary)) {
      const validationError = validateConfigSummary(
        existing.providerKey,
        body.configurationSummary as Record<string, unknown>
      );
      if (validationError) {
        request.log.warn({
          event: enforceConfigSummaryAllowlist ? "config_summary_rejected" : "config_summary_unknown_provider_warn",
          providerKey: existing.providerKey,
          unknownKeys: validationError.unknownKeys,
        });
        if (enforceConfigSummaryAllowlist) {
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
    }

    const data: Record<string, unknown> = {};

    const setStr = (key: string) => {
      if (body[key] !== undefined) data[key] = body[key] == null ? null : String(body[key]);
    };
    const setDateTime = (key: string) => {
      if (body[key] === undefined) return;
      if (body[key] == null) { data[key] = null; return; }
      const parsed = new Date(String(body[key]));
      if (!Number.isNaN(parsed.getTime())) data[key] = parsed;
    };

    setStr("status");
    setStr("healthStatus");
    setStr("assignedOwnerUserId");
    setStr("lastErrorCode");
    setStr("lastErrorMessage");
    setStr("externalAccountId");
    setStr("externalAccountLabel");
    setDateTime("connectedAt");
    setDateTime("disconnectedAt");
    setDateTime("lastCheckedAt");
    setDateTime("lastSyncedAt");
    setDateTime("lastSuccessfulSyncAt");
    if (body.configurationSummary !== undefined) data.configurationSummary = body.configurationSummary;
    if (body.metadata !== undefined && body.metadata !== null) {
      const raw = body.metadata as Record<string, unknown>;
      data.metadata = encryptMetadataSecrets(existing.providerKey, raw, process.env.INTEGRATION_ENCRYPTION_KEY!, connectionId);
    } else if (body.metadata === null) {
      data.metadata = null;
    }

    const updated = await prisma.clientIntegrationConnection.update({
      where: { id: connectionId },
      data,
    });

    const metaRaw = updated.metadata as Record<string, unknown> | null;
    const { apiView: updatedMetaApiView } = metaRaw != null
      ? decryptMetadataSecrets(existing.providerKey, metaRaw, process.env.INTEGRATION_ENCRYPTION_KEY!, connectionId, request.log)
      : { apiView: null };

    return {
      success: true,
      data: {
        ...updated,
        metadata: updatedMetaApiView,
        connectedAt: updated.connectedAt?.toISOString() ?? null,
        disconnectedAt: updated.disconnectedAt?.toISOString() ?? null,
        lastCheckedAt: updated.lastCheckedAt?.toISOString() ?? null,
        lastSyncedAt: updated.lastSyncedAt?.toISOString() ?? null,
        lastSuccessfulSyncAt: updated.lastSuccessfulSyncAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      meta: { requestId: scope.requestId },
    } as ApiResponse<Record<string, unknown>>;
  });

  // ── POST /admin/integrations/seed-providers ───────────────────────────────
  // Idempotent seed — inserts the canonical 17 providers if not yet present.
  // Safe to call repeatedly (upsert by key). Requires ADMIN role.
  app.post("/admin/integrations/seed-providers", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Only admins can seed integration providers." },
      } as ApiResponse);
    }

    const PROVIDERS = [
      { key: "gcal", label: "Google Calendar", description: "Sync calendar events and meeting scheduling", category: "Productivity", kind: "oauth", availabilityStatus: "active", isClientVisible: true, isRequestEnabled: true, supportsDisconnect: true, supportsReconnect: true, supportsHealthChecks: true, sortOrder: 1, iconKey: "" },
      { key: "slack", label: "Slack", description: "Delivery alerts, approval reminders, and escalations", category: "Communication", kind: "assisted", availabilityStatus: "active", isRequestEnabled: true, sortOrder: 2, iconKey: "" },
      { key: "msteams", label: "Microsoft Teams", description: "Milestone alerts and approval notifications", category: "Communication", kind: "assisted", availabilityStatus: "active", isRequestEnabled: true, sortOrder: 3, iconKey: "" },
      { key: "gdrive", label: "Google Drive", description: "Export approved deliverables and handoff folders", category: "Documents", kind: "assisted", availabilityStatus: "active", isRequestEnabled: true, sortOrder: 4, iconKey: "" },
      { key: "dropbox", label: "Dropbox", description: "File sync and asset sharing", category: "Documents", kind: "assisted", availabilityStatus: "coming_soon", sortOrder: 5, iconKey: "" },
      { key: "quickbooks", label: "QuickBooks", description: "Invoice sync and accounting integration", category: "Finance", kind: "assisted", availabilityStatus: "active", isRequestEnabled: true, sortOrder: 6, iconKey: "" },
      { key: "xero", label: "Xero", description: "Accounting and payment reconciliation", category: "Finance", kind: "assisted", availabilityStatus: "active", isRequestEnabled: true, sortOrder: 7, iconKey: "" },
      { key: "zapier", label: "Zapier", description: "Connect to 5,000+ apps via automation", category: "Automation", kind: "assisted", availabilityStatus: "active", isRequestEnabled: true, sortOrder: 8, iconKey: "" },
      { key: "hubspot", label: "HubSpot", description: "CRM integration for account visibility", category: "CRM", kind: "assisted", availabilityStatus: "beta", sortOrder: 9, iconKey: "" },
      { key: "salesforce", label: "Salesforce", description: "Enterprise CRM integration", category: "CRM", kind: "assisted", availabilityStatus: "beta", sortOrder: 10, iconKey: "" },
      { key: "notion", label: "Notion", description: "Knowledge base and doc sync", category: "Productivity", kind: "assisted", availabilityStatus: "coming_soon", sortOrder: 11, iconKey: "" },
      { key: "jira", label: "Jira", description: "Issue tracking and project management bridge", category: "Project Management", kind: "assisted", availabilityStatus: "coming_soon", sortOrder: 12, iconKey: "" },
      { key: "asana", label: "Asana", description: "Task management integration", category: "Project Management", kind: "assisted", availabilityStatus: "coming_soon", sortOrder: 13, iconKey: "" },
      { key: "clickup", label: "ClickUp", description: "Project and task management", category: "Project Management", kind: "assisted", availabilityStatus: "coming_soon", sortOrder: 14, iconKey: "" },
      { key: "docusign", label: "DocuSign", description: "Electronic signature for contracts and approvals", category: "Documents", kind: "assisted", availabilityStatus: "coming_soon", sortOrder: 15, iconKey: "" },
      { key: "pandadoc", label: "PandaDoc", description: "Proposal and contract signing", category: "Documents", kind: "assisted", availabilityStatus: "coming_soon", sortOrder: 16, iconKey: "" },
      { key: "sharepoint", label: "SharePoint / OneDrive", description: "Microsoft file storage and collaboration", category: "Documents", kind: "assisted", availabilityStatus: "coming_soon", sortOrder: 17, iconKey: "" },
    ] as const;

    const results: { key: string; action: "upserted" }[] = [];
    for (const provider of PROVIDERS) {
      await prisma.integrationProvider.upsert({
        where: { key: provider.key },
        create: {
          key: provider.key,
          label: provider.label,
          description: provider.description,
          category: provider.category,
          kind: provider.kind,
          availabilityStatus: provider.availabilityStatus,
          iconKey: provider.iconKey,
          isClientVisible: "isClientVisible" in provider ? provider.isClientVisible : true,
          isRequestEnabled: "isRequestEnabled" in provider ? provider.isRequestEnabled : false,
          supportsDisconnect: "supportsDisconnect" in provider ? provider.supportsDisconnect : false,
          supportsReconnect: "supportsReconnect" in provider ? provider.supportsReconnect : false,
          supportsHealthChecks: "supportsHealthChecks" in provider ? provider.supportsHealthChecks : false,
          sortOrder: provider.sortOrder,
        },
        update: {
          label: provider.label,
          description: provider.description,
          category: provider.category,
          kind: provider.kind,
          availabilityStatus: provider.availabilityStatus,
          sortOrder: provider.sortOrder,
        },
      });
      results.push({ key: provider.key, action: "upserted" });
    }

    return {
      success: true,
      data: { seeded: results.length, providers: results },
      meta: { requestId: scope.requestId },
    } as ApiResponse<{ seeded: number; providers: { key: string; action: string }[] }>;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Google Calendar OAuth2
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /integrations/google-calendar/auth-url
   *  Returns the Google OAuth2 authorization URL. */
  app.get("/integrations/google-calendar/auth-url", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID required." } } as ApiResponse);
    }

    const clientId    = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.FRONTEND_URL ?? ""}/auth/google-calendar/callback`;

    if (!clientId) {
      return reply.status(503).send({ success: false, error: { code: "GCAL_NOT_CONFIGURED", message: "Google Calendar is not configured." } } as ApiResponse);
    }

    const state = encodeURIComponent(JSON.stringify({ userId: scope.userId, clientId: scope.clientId }));
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent("https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email")}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;

    return { success: true, data: { authUrl }, meta: { requestId: scope.requestId } } as ApiResponse<{ authUrl: string }>;
  });

  /** POST /integrations/google-calendar/callback
   *  Exchanges the authorization code for tokens and stores them. */
  app.post("/integrations/google-calendar/callback", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body  = request.body as { code?: string; state?: string };

    if (!body?.code) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Authorization code is required." } } as ApiResponse);
    }

    // Parse state to get userId (fallback to scope header)
    let userId = scope.userId ?? "";
    try {
      const parsed = JSON.parse(decodeURIComponent(body.state ?? "{}")) as { userId?: string };
      if (parsed.userId) userId = parsed.userId;
    } catch { /* use scope.userId */ }

    if (!userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Unable to identify user." } } as ApiResponse);
    }

    const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.FRONTEND_URL ?? ""}/auth/google-calendar/callback`;

    // Exchange code for tokens
    let tokens: GcalTokens;
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code:          body.code,
          client_id:     process.env.GOOGLE_CLIENT_ID     ?? "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          redirect_uri:  redirectUri,
          grant_type:    "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        request.log.error({ errBody }, "Google token exchange failed");
        return reply.status(502).send({ success: false, error: { code: "GCAL_TOKEN_EXCHANGE_FAILED", message: "Failed to exchange authorization code." } } as ApiResponse);
      }

      const tokenData = await tokenRes.json() as {
        access_token:  string;
        refresh_token?: string;
        expires_in?:   number;
        error?:        string;
      };

      if (tokenData.error || !tokenData.access_token) {
        return reply.status(502).send({ success: false, error: { code: "GCAL_TOKEN_EXCHANGE_FAILED", message: tokenData.error ?? "Missing access token." } } as ApiResponse);
      }

      tokens = {
        access_token:  tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        expiry_date:   Date.now() + (tokenData.expires_in ?? 3600) * 1000,
        email:         null,
      };
    } catch (err) {
      request.log.error(err, "Google token exchange error");
      return reply.status(502).send({ success: false, error: { code: "GCAL_TOKEN_EXCHANGE_FAILED", message: "Network error during token exchange." } } as ApiResponse);
    }

    // Fetch Google account email
    try {
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json() as { email?: string };
        tokens.email = profile.email ?? null;
      }
    } catch { /* non-fatal */ }

    // Persist tokens as UserPreference entries
    try {
      const upserts: Promise<unknown>[] = [
        prisma.userPreference.upsert({
          where:  { userId_key: { userId, key: GC_ACCESS_TOKEN_KEY } },
          update: { value: encryptPref(userId, GC_ACCESS_TOKEN_KEY, tokens.access_token) },
          create: { userId, key: GC_ACCESS_TOKEN_KEY, value: encryptPref(userId, GC_ACCESS_TOKEN_KEY, tokens.access_token) },
        }),
        prisma.userPreference.upsert({
          where:  { userId_key: { userId, key: GC_EXPIRY_KEY } },
          update: { value: String(tokens.expiry_date ?? 0) },
          create: { userId, key: GC_EXPIRY_KEY, value: String(tokens.expiry_date ?? 0) },
        }),
      ];

      if (tokens.refresh_token) {
        upserts.push(
          prisma.userPreference.upsert({
            where:  { userId_key: { userId, key: GC_REFRESH_TOKEN_KEY } },
            update: { value: encryptPref(userId, GC_REFRESH_TOKEN_KEY, tokens.refresh_token) },
            create: { userId, key: GC_REFRESH_TOKEN_KEY, value: encryptPref(userId, GC_REFRESH_TOKEN_KEY, tokens.refresh_token) },
          })
        );
      }

      if (tokens.email) {
        upserts.push(
          prisma.userPreference.upsert({
            where:  { userId_key: { userId, key: GC_EMAIL_KEY } },
            update: { value: tokens.email },
            create: { userId, key: GC_EMAIL_KEY, value: tokens.email },
          })
        );
      }

      await Promise.all(upserts);
    } catch (err) {
      request.log.error(err, "Failed to persist Google Calendar tokens");
      return reply.status(500).send({ success: false, error: { code: "GCAL_STORE_FAILED", message: "Failed to store authorization tokens." } } as ApiResponse);
    }

    return { success: true, data: { connected: true, email: tokens.email }, meta: { requestId: scope.requestId } } as ApiResponse<{ connected: boolean; email: string | null }>;
  });

  /** GET /integrations/google-calendar/status */
  app.get("/integrations/google-calendar/status", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID required." } } as ApiResponse);
    }

    const [tokenPref, emailPref, expiryPref] = await Promise.all([
      prisma.userPreference.findUnique({ where: { userId_key: { userId: scope.userId, key: GC_ACCESS_TOKEN_KEY } } }),
      prisma.userPreference.findUnique({ where: { userId_key: { userId: scope.userId, key: GC_EMAIL_KEY } } }),
      prisma.userPreference.findUnique({ where: { userId_key: { userId: scope.userId, key: GC_EXPIRY_KEY } } }),
    ]);

    const connected = !!tokenPref;
    const email     = emailPref?.value ?? null;
    const expiresAt = expiryPref ? new Date(Number(expiryPref.value)).toISOString() : null;

    return { success: true, data: { connected, email, expiresAt }, meta: { requestId: scope.requestId } } as ApiResponse<{ connected: boolean; email: string | null; expiresAt: string | null }>;
  });

  /** DELETE /integrations/google-calendar/disconnect */
  app.delete("/integrations/google-calendar/disconnect", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID required." } } as ApiResponse);
    }

    await prisma.userPreference.deleteMany({
      where: {
        userId: scope.userId,
        key: { in: [GC_ACCESS_TOKEN_KEY, GC_REFRESH_TOKEN_KEY, GC_EMAIL_KEY, GC_EXPIRY_KEY] },
      },
    });

    return { success: true, data: { disconnected: true }, meta: { requestId: scope.requestId } } as ApiResponse<{ disconnected: boolean }>;
  });

  /** POST /integrations/google-calendar/sync-meeting  body: { meetingId } */
  app.post("/integrations/google-calendar/sync-meeting", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID required." } } as ApiResponse);
    }

    const body = request.body as { meetingId?: string };
    if (!body?.meetingId) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "meetingId is required." } } as ApiResponse);
    }

    // Look up meeting — enforce client scope for CLIENT role
    const meeting = await prisma.meetingRecord.findFirst({
      where: scope.role === "CLIENT"
        ? { id: body.meetingId, clientId: scope.clientId ?? "" }
        : { id: body.meetingId },
    });

    if (!meeting) {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Meeting not found." } } as ApiResponse);
    }

    // Get a valid access token (auto-refresh if expired)
    let accessToken: string | null;
    try {
      accessToken = await getValidAccessToken(scope.userId, request.log);
    } catch (err) {
      if (err instanceof Error && err.message === "CREDENTIAL_DECRYPT_FAILED") {
        return reply.status(500).send({
          success: false,
          error: { code: "CREDENTIAL_UNAVAILABLE", message: "Could not decrypt stored credentials." },
        } as ApiResponse);
      }
      throw err;
    }
    if (!accessToken) {
      return reply.status(403).send({ success: false, error: { code: "GCAL_NOT_CONNECTED", message: "Google Calendar is not connected. Please connect first." } } as ApiResponse);
    }

    // Build Google Calendar event
    const startTime = new Date(meeting.meetingAt);
    const endTime   = new Date(startTime.getTime() + meeting.durationMins * 60_000);

    const event = {
      summary:     meeting.title,
      description: meeting.notes ?? `Meeting with ${meeting.attendeeCount} attendee(s). Action items: ${meeting.actionItemStatus}.`,
      start:       { dateTime: startTime.toISOString() },
      end:         { dateTime: endTime.toISOString() },
    };

    try {
      const gcalRes = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method:  "POST",
          headers: {
            Authorization:  `Bearer ${accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!gcalRes.ok) {
        const errText = await gcalRes.text();
        request.log.error({ errText, status: gcalRes.status }, "Google Calendar event creation failed");

        if (gcalRes.status === 401) {
          return reply.status(403).send({ success: false, error: { code: "GCAL_TOKEN_INVALID", message: "Google Calendar token is invalid. Please reconnect." } } as ApiResponse);
        }

        return reply.status(502).send({ success: false, error: { code: "GCAL_EVENT_FAILED", message: "Failed to create Google Calendar event." } } as ApiResponse);
      }

      const gcalEvent = await gcalRes.json() as { id?: string; htmlLink?: string };

      return {
        success: true,
        data: {
          synced:      true,
          googleEventId:   gcalEvent.id ?? null,
          googleEventLink: gcalEvent.htmlLink ?? null,
        },
        meta: { requestId: scope.requestId },
      } as ApiResponse<{ synced: boolean; googleEventId: string | null; googleEventLink: string | null }>;

    } catch (err) {
      request.log.error(err, "Google Calendar sync error");
      return reply.status(502).send({ success: false, error: { code: "GCAL_SYNC_FAILED", message: "Network error during calendar sync." } } as ApiResponse);
    }
  });
}
