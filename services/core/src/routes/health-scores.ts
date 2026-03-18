// ════════════════════════════════════════════════════════════════════════════
// health-scores.ts — Client health score routes
// Service : core  |  Cache TTL: 300 s (GET), invalidate on write
// Scope   : ADMIN / STAFF full access; CLIENT own-tenant read-only
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerHealthScoreRoutes(app: FastifyInstance): Promise<void> {

  // ── GET Routes ────────────────────────────────────────────────────────────

  /** GET /health-scores — Admin/Staff: all health scores across all clients */
  app.get("/health-scores", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Use /clients/:id/health to view your health scores." } } as ApiResponse;
    }
    try {
      const data = await withCache("health-scores:all", 300, () =>
        prisma.clientHealthScore.findMany({ orderBy: { recordedAt: "desc" } })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "HEALTH_FETCH_FAILED", message: "Unable to fetch health scores." } } as ApiResponse;
    }
  });

  /** GET /clients/:clientId/health — latest health scores for a client */
  app.get("/clients/:clientId/health", async (request) => {
    const scope = readScopeHeaders(request);
    const { clientId } = request.params as { clientId: string };
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    if (scopedClientId && scopedClientId !== clientId) {
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
    }

    try {
      const cacheKey = CacheKeys.healthScore(clientId);
      const data = await withCache(cacheKey, 300, () =>
        prisma.clientHealthScore.findMany({
          where: { clientId },
          orderBy: { recordedAt: "desc" },
          take: 12
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "HEALTH_FETCH_FAILED", message: "Unable to fetch health scores." } } as ApiResponse;
    }
  });

  // ── POST Routes ───────────────────────────────────────────────────────────

  /** POST /clients/:clientId/health — record a new health score (admin/staff only) */
  app.post("/clients/:clientId/health", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot record health scores." } } as ApiResponse;
    }

    const { clientId } = request.params as { clientId: string };
    const body = request.body as {
      score: number;
      trend?: string;
      trendValue?: number;
      sentiment?: string;
      lastTouched?: string;
      overdueTasks?: number;
      unreadMessages?: number;
      milestoneDelayDays?: number;
      retainerBurnPct?: number;
      invoiceStatus?: string;
    };

    try {
      const record = await prisma.clientHealthScore.create({
        data: {
          clientId,
          score:              body.score,
          trend:              body.trend ?? "STABLE",
          trendValue:         body.trendValue ?? 0,
          sentiment:          body.sentiment ?? "NEUTRAL",
          lastTouched:        body.lastTouched ? new Date(body.lastTouched) : null,
          overdueTasks:       body.overdueTasks ?? 0,
          unreadMessages:     body.unreadMessages ?? 0,
          milestoneDelayDays: body.milestoneDelayDays ?? 0,
          retainerBurnPct:    body.retainerBurnPct ?? 0,
          invoiceStatus:      body.invoiceStatus ?? "PENDING"
        }
      });
      await cache.delete(CacheKeys.healthScore(clientId));
      reply.status(201);
      return { success: true, data: record } as ApiResponse<typeof record>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "HEALTH_CREATE_FAILED", message: "Unable to record health score." } } as ApiResponse;
    }
  });
}
