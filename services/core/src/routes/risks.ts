// ════════════════════════════════════════════════════════════════════════════
// risks.ts — Project risk routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN / STAFF full access; CLIENT own-tenant read-only
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerRiskRoutes(app: FastifyInstance): Promise<void> {

  // ── GET Routes ────────────────────────────────────────────────────────────

  /** GET /risks — list all risks across all projects (ADMIN only) */
  app.get("/risks", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can view all portfolio risks." } } as ApiResponse;
    }
    try {
      const data = await withCache("risks:all", 60, () =>
        prisma.projectRisk.findMany({
          include: { project: { select: { name: true } } },
          orderBy: { createdAt: "desc" }
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "RISKS_FETCH_FAILED", message: "Unable to fetch portfolio risks." } } as ApiResponse;
    }
  });

  /** GET /projects/:projectId/risks — list project risks */
  app.get("/projects/:projectId/risks", async (request) => {
    const scope = readScopeHeaders(request);
    const { projectId } = request.params as { projectId: string };
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    try {
      const cacheKey = CacheKeys.risks(projectId);
      const data = await withCache(cacheKey, 60, () =>
        prisma.projectRisk.findMany({
          where: {
            projectId,
            ...(scopedClientId ? { clientId: scopedClientId } : {})
          },
          orderBy: { createdAt: "desc" }
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "RISKS_FETCH_FAILED", message: "Unable to fetch project risks." } } as ApiResponse;
    }
  });

  // ── POST / PATCH Routes ───────────────────────────────────────────────────

  /** POST /projects/:projectId/risks — create a risk */
  app.post("/projects/:projectId/risks", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot create risks." } } as ApiResponse;
    }
    const { projectId } = request.params as { projectId: string };
    const body = request.body as {
      clientId: string;
      name: string;
      detail?: string;
      likelihood?: string;
      impact?: string;
      mitigation?: string;
      status?: string;
    };

    try {
      const risk = await prisma.projectRisk.create({
        data: {
          projectId,
          clientId: body.clientId,
          name: body.name,
          detail: body.detail ?? null,
          likelihood: body.likelihood ?? "MEDIUM",
          impact: body.impact ?? "MEDIUM",
          mitigation: body.mitigation ?? null,
          status: body.status ?? "OPEN"
        }
      });
      await Promise.all([cache.delete(CacheKeys.risks(projectId)), cache.delete("risks:all")]);
      reply.status(201);
      return { success: true, data: risk } as ApiResponse<typeof risk>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "RISK_CREATE_FAILED", message: "Unable to create risk." } } as ApiResponse;
    }
  });

  /** PATCH /projects/:projectId/risks/:id — update a risk */
  app.patch("/projects/:projectId/risks/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot update risks." } } as ApiResponse;
    }
    const { projectId, id } = request.params as { projectId: string; id: string };
    const body = request.body as {
      name?: string;
      detail?: string;
      likelihood?: string;
      impact?: string;
      mitigation?: string;
      status?: string;
    };

    try {
      const risk = await prisma.projectRisk.update({
        where: { id, projectId },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.detail !== undefined && { detail: body.detail }),
          ...(body.likelihood !== undefined && { likelihood: body.likelihood }),
          ...(body.impact !== undefined && { impact: body.impact }),
          ...(body.mitigation !== undefined && { mitigation: body.mitigation }),
          ...(body.status !== undefined && { status: body.status })
        }
      });
      await Promise.all([cache.delete(CacheKeys.risks(projectId)), cache.delete("risks:all")]);
      return { success: true, data: risk } as ApiResponse<typeof risk>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "RISK_UPDATE_FAILED", message: "Unable to update risk." } } as ApiResponse;
    }
  });
}
