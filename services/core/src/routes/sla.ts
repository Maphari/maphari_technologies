// ════════════════════════════════════════════════════════════════════════════
// sla.ts — SLA Record routes
// Service : core  |  Cache TTL: 180 s (GET), invalidate on write
// Scope   : CLIENT read-own; STAFF/ADMIN list-all + create
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerSlaRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /sla — Admin/Staff list all SLA records ───────────────────────────
  app.get("/sla", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Use /clients/:id/sla to view your SLA records." } } as ApiResponse);
    }

    const data = await withCache(CacheKeys.slaAll(), 180, () =>
      prisma.sLARecord.findMany({
        orderBy: [{ clientId: "asc" }, { periodStart: "desc" }]
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /clients/:clientId/sla ────────────────────────────────────────────
  app.get("/clients/:clientId/sla", async (request) => {
    const scope = readScopeHeaders(request);
    const { clientId } = request.params as { clientId: string };

    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== clientId) {
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
    }

    const data = await withCache(CacheKeys.slaRecords(clientId), 180, () =>
      prisma.sLARecord.findMany({
        where: { clientId },
        orderBy: { periodStart: "desc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /clients/:clientId/sla ───────────────────────────────────────────
  app.post("/clients/:clientId/sla", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot create SLA records." } } as ApiResponse);
    }

    const { clientId } = request.params as { clientId: string };
    const body = request.body as {
      tier: string;
      metric: string;
      target: string;
      targetHrs?: number;
      actual: string;
      actualHrs?: number;
      variance?: string;
      status: string;
      periodStart: string;
      periodEnd?: string;
    };

    const record = await prisma.sLARecord.create({
      data: {
        clientId,
        tier: body.tier,
        metric: body.metric,
        target: body.target,
        targetHrs: body.targetHrs ?? null,
        actual: body.actual,
        actualHrs: body.actualHrs ?? null,
        variance: body.variance ?? null,
        status: body.status,
        periodStart: new Date(body.periodStart),
        periodEnd: body.periodEnd ? new Date(body.periodEnd) : null
      }
    });

    await cache.delete(CacheKeys.slaRecords(clientId));
    await cache.delete(CacheKeys.slaAll());

    return reply.code(201).send({ success: true, data: record, meta: { requestId: scope.requestId } } as ApiResponse<typeof record>);
  });
}
