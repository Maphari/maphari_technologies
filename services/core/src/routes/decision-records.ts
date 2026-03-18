// ════════════════════════════════════════════════════════════════════════════
// decision-records.ts — Decision record routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN full; STAFF read + create; CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { DecisionRecord } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { withCache, cache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── DTO ───────────────────────────────────────────────────────────────────────
type DecisionRecordDto = {
  id: string;
  title: string;
  context: string | null;
  outcome: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  tags: string | null;
  projectId: string | null;
  clientId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function toDto(d: DecisionRecord): DecisionRecordDto {
  return {
    ...d,
    decidedAt: d.decidedAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerDecisionRecordRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /decision-records ───────────────────────────────────────────────────
  app.get("/decision-records", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients" } } as ApiResponse;
    }

    const query = request.query as { projectId?: string; status?: string };
    const cacheScope = scope.role === "ADMIN" ? "admin" : `staff:${query.projectId ?? "all"}`;

    try {
      const data = await withCache(CacheKeys.decisionRecords(cacheScope), 60, () =>
        prisma.decisionRecord.findMany({
          where: {
            ...(query.projectId ? { projectId: query.projectId } : {}),
            ...(query.status    ? { status:    query.status    } : {}),
          },
          orderBy: { createdAt: "desc" },
        }).then((rows) => rows.map(toDto))
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<DecisionRecordDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DECISIONS_FETCH_FAILED", message: "Unable to fetch decision records" } } as ApiResponse;
    }
  });

  // ── POST /decision-records ──────────────────────────────────────────────────
  app.post("/decision-records", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients" } } as ApiResponse;
    }

    const body = request.body as {
      title: string;
      context?: string;
      outcome?: string;
      decidedByName?: string;
      decidedAt?: string;
      tags?: string;
      projectId?: string;
      clientId?: string;
    };

    if (!body.title) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "title is required" } } as ApiResponse;
    }

    try {
      const record = await prisma.decisionRecord.create({
        data: {
          title:         body.title,
          context:       body.context       ?? null,
          outcome:       body.outcome       ?? null,
          decidedByName: body.decidedByName ?? null,
          decidedAt:     body.decidedAt ? new Date(body.decidedAt) : null,
          tags:          body.tags          ?? null,
          projectId:     body.projectId     ?? null,
          clientId:      body.clientId      ?? null,
          status:        "ACTIVE",
        },
      });

      await Promise.all([
        cache.delete(CacheKeys.decisionRecords("admin")),
        cache.delete(CacheKeys.decisionRecords(`staff:${body.projectId ?? "all"}`)),
      ]);

      reply.status(201);
      return { success: true, data: toDto(record) } as ApiResponse<DecisionRecordDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DECISION_CREATE_FAILED", message: "Unable to create decision record" } } as ApiResponse;
    }
  });

  // ── PATCH /decision-records/:id ─────────────────────────────────────────────
  app.patch("/decision-records/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      title: string;
      context: string;
      outcome: string;
      decidedByName: string;
      decidedAt: string;
      tags: string;
      status: string;
    }>;

    try {
      const data: Record<string, unknown> = {};
      if (body.title)         data.title         = body.title;
      if (body.context)       data.context       = body.context;
      if (body.outcome)       data.outcome       = body.outcome;
      if (body.decidedByName) data.decidedByName = body.decidedByName;
      if (body.decidedAt)     data.decidedAt     = new Date(body.decidedAt);
      if (body.tags)          data.tags          = body.tags;
      if (body.status)        data.status        = body.status;

      const record = await prisma.decisionRecord.update({ where: { id }, data });

      await Promise.all([
        cache.delete(CacheKeys.decisionRecords("admin")),
        cache.delete(CacheKeys.decisionRecords(`staff:${record.projectId ?? "all"}`)),
      ]);

      return { success: true, data: toDto(record) } as ApiResponse<DecisionRecordDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DECISION_UPDATE_FAILED", message: "Unable to update decision record" } } as ApiResponse;
    }
  });
}
