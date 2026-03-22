// ════════════════════════════════════════════════════════════════════════════
// notification-prefs.ts — Notification preference routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : CLIENT read/write own; STAFF/ADMIN full access
// Note    : Prefs stored as JSON blob in UserPreference.
//           key = "portal.notificationPrefs", scoped to userId
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { cache } from "../lib/infrastructure.js";

export interface NotificationPrefs {
  clientId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  weeklyDigest: boolean;
  projectUpdates: boolean;
  invoiceAlerts: boolean;
  marketingEmails: boolean;
  updatedAt: string;
}

const PREF_KEY = "portal.notificationPrefs";

// Internal blob shape — includes clientId so automation can resolve subscribers
interface StoredNotifPrefs extends Omit<NotificationPrefs, "updatedAt"> {}

const DEFAULT_PREFS: Omit<NotificationPrefs, "clientId" | "updatedAt"> = {
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: false,
  weeklyDigest: true,
  projectUpdates: true,
  invoiceAlerts: true,
  marketingEmails: false,
};

function ck(clientId: string): string {
  return `core:notification-prefs:${clientId}`;
}

function perKeyCk(userId: string): string {
  return `core:notif-prefs-perkey:${userId}`;
}

export const NOTIF_PREF_KEYS = [
  "notif_email_invoice",
  "notif_email_milestone",
  "notif_email_message",
  "notif_email_announcement",
  "notif_inapp_invoice",
  "notif_inapp_milestone",
  "notif_inapp_message",
  "notif_inapp_announcement",
] as const;

export type NotifPrefKey = (typeof NOTIF_PREF_KEYS)[number];

export async function registerNotificationPrefRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /portal/settings/notifications ───────────────────────────────────
  app.get("/portal/settings/notifications", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (!scopedClientId) {
      return reply.status(400).send({ success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse);
    }
    if (!scope.userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Missing user scope." } } as ApiResponse);
    }

    try {
      const cached = await cache.getJson<NotificationPrefs>(ck(scopedClientId));
      if (cached) return { success: true, data: cached, meta: { requestId: scope.requestId } } as ApiResponse<NotificationPrefs>;

      const row = await prisma.userPreference.findUnique({
        where: { userId_key: { userId: scope.userId, key: PREF_KEY } }
      });

      const values = row?.value
        ? (JSON.parse(row.value) as Omit<NotificationPrefs, "clientId" | "updatedAt">)
        : DEFAULT_PREFS;

      const prefs: NotificationPrefs = {
        clientId: scopedClientId,
        ...values,
        updatedAt: row?.updatedAt?.toISOString() ?? new Date().toISOString(),
      };

      await cache.setJson(ck(scopedClientId), prefs, 120);
      return { success: true, data: prefs, meta: { requestId: scope.requestId } } as ApiResponse<NotificationPrefs>;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: "NOTIFICATION_PREFS_FETCH_FAILED", message: "Unable to fetch notification preferences." } } as ApiResponse);
    }
  });

  // ── PATCH /portal/settings/notifications ─────────────────────────────────
  app.patch("/portal/settings/notifications", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (!scopedClientId) {
      return reply.status(400).send({ success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse);
    }
    if (!scope.userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Missing user scope." } } as ApiResponse);
    }

    const body = request.body as Partial<Omit<NotificationPrefs, "clientId" | "updatedAt">>;

    try {
      const existing = await prisma.userPreference.findUnique({
        where: { userId_key: { userId: scope.userId, key: PREF_KEY } }
      });

      const existingRaw: StoredNotifPrefs | Omit<NotificationPrefs, "clientId" | "updatedAt"> = existing?.value
        ? (JSON.parse(existing.value) as StoredNotifPrefs)
        : DEFAULT_PREFS;

      const merged = { ...existingRaw, ...body, clientId: scopedClientId };
      const now = new Date();

      await prisma.userPreference.upsert({
        where: { userId_key: { userId: scope.userId, key: PREF_KEY } },
        create: { userId: scope.userId, key: PREF_KEY, value: JSON.stringify(merged) },
        update: { value: JSON.stringify(merged) },
      });

      await cache.delete(ck(scopedClientId));

      const prefs: NotificationPrefs = { ...merged, clientId: scopedClientId, updatedAt: now.toISOString() };
      return { success: true, data: prefs, meta: { requestId: scope.requestId } } as ApiResponse<NotificationPrefs>;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: "NOTIFICATION_PREFS_UPDATE_FAILED", message: "Unable to update notification preferences." } } as ApiResponse);
    }
  });

  // ── GET /notification-prefs ───────────────────────────────────────────────
  app.get("/notification-prefs", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Missing user scope." } } as ApiResponse);
    }

    try {
      const cached = await cache.getJson<Record<NotifPrefKey, boolean>>(perKeyCk(scope.userId));
      if (cached) return { success: true, data: cached, meta: { requestId: scope.requestId } } as ApiResponse<Record<NotifPrefKey, boolean>>;

      const rows = await prisma.userPreference.findMany({
        where: { userId: scope.userId, key: { in: [...NOTIF_PREF_KEYS] } },
      });

      const rowMap = new Map(rows.map((r) => [r.key, r.value === "true"]));
      const result = Object.fromEntries(
        NOTIF_PREF_KEYS.map((k) => [k, rowMap.has(k) ? (rowMap.get(k) as boolean) : true])
      ) as Record<NotifPrefKey, boolean>;

      await cache.setJson(perKeyCk(scope.userId), result, 120);
      return { success: true, data: result, meta: { requestId: scope.requestId } } as ApiResponse<Record<NotifPrefKey, boolean>>;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: "NOTIF_PREFS_FETCH_FAILED", message: "Unable to fetch notification preferences." } } as ApiResponse);
    }
  });

  // ── GET /internal/digest-subscribers ─────────────────────────────────────
  // Internal-only: called by automation service to find weekly digest opt-ins.
  // No scope auth — network-level isolation is sufficient (automation → core).
  app.get("/internal/digest-subscribers", async (request, reply) => {
    try {
      const rows = await prisma.userPreference.findMany({
        where: { key: PREF_KEY },
      });

      const subscribers: Array<{ userId: string; clientId: string }> = [];

      for (const row of rows) {
        if (!row.value) continue;
        let parsed: StoredNotifPrefs | null = null;
        try {
          parsed = JSON.parse(row.value) as StoredNotifPrefs;
        } catch {
          continue;
        }
        if (!parsed?.weeklyDigest) continue;
        const clientId = parsed?.clientId ?? null;
        if (!clientId) continue;
        subscribers.push({ userId: row.userId, clientId });
      }

      return { success: true, data: subscribers } as ApiResponse<Array<{ userId: string; clientId: string }>>;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: "DIGEST_SUBSCRIBERS_FETCH_FAILED", message: "Unable to fetch digest subscribers." } } as ApiResponse);
    }
  });

  // ── PATCH /notification-prefs ─────────────────────────────────────────────
  app.patch("/notification-prefs", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Missing user scope." } } as ApiResponse);
    }

    const body = request.body as { key: unknown; value: unknown };
    const key = body.key;
    const value = body.value;

    if (!NOTIF_PREF_KEYS.includes(key as NotifPrefKey)) {
      return reply.status(400).send({ success: false, error: { code: "INVALID_KEY", message: "Invalid notification preference key." } } as ApiResponse);
    }
    if (typeof value !== "boolean") {
      return reply.status(400).send({ success: false, error: { code: "INVALID_VALUE", message: "Value must be a boolean." } } as ApiResponse);
    }

    try {
      await prisma.userPreference.upsert({
        where: { userId_key: { userId: scope.userId, key: key as NotifPrefKey } },
        update: { value: String(value) },
        create: { userId: scope.userId, key: key as NotifPrefKey, value: String(value) },
      });

      await cache.delete(perKeyCk(scope.userId));

      return { success: true, data: { success: true }, meta: { requestId: scope.requestId } } as ApiResponse<{ success: boolean }>;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: "NOTIF_PREF_UPDATE_FAILED", message: "Unable to update notification preference." } } as ApiResponse);
    }
  });
}
