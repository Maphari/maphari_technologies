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

      const existingValues: Omit<NotificationPrefs, "clientId" | "updatedAt"> = existing?.value
        ? (JSON.parse(existing.value) as Omit<NotificationPrefs, "clientId" | "updatedAt">)
        : DEFAULT_PREFS;

      const merged = { ...existingValues, ...body };
      const now = new Date();

      await prisma.userPreference.upsert({
        where: { userId_key: { userId: scope.userId, key: PREF_KEY } },
        create: { userId: scope.userId, key: PREF_KEY, value: JSON.stringify(merged) },
        update: { value: JSON.stringify(merged) },
      });

      await cache.delete(ck(scopedClientId));

      const prefs: NotificationPrefs = { clientId: scopedClientId, ...merged, updatedAt: now.toISOString() };
      return { success: true, data: prefs, meta: { requestId: scope.requestId } } as ApiResponse<NotificationPrefs>;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: "NOTIFICATION_PREFS_UPDATE_FAILED", message: "Unable to update notification preferences." } } as ApiResponse);
    }
  });
}
