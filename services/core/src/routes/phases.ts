// ════════════════════════════════════════════════════════════════════════════
// phases.ts — Project phase routes
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
export async function registerPhaseRoutes(app: FastifyInstance): Promise<void> {

  // ── GET Routes ────────────────────────────────────────────────────────────

  /** GET /projects/:projectId/phases — list phases in sort order */
  app.get("/projects/:projectId/phases", async (request) => {
    const scope = readScopeHeaders(request);
    const { projectId } = request.params as { projectId: string };
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    try {
      const cacheKey = CacheKeys.phases(projectId);
      const data = await withCache(cacheKey, 60, () =>
        prisma.projectPhase.findMany({
          where: {
            projectId,
            ...(scopedClientId ? { clientId: scopedClientId } : {})
          },
          orderBy: { sortOrder: "asc" }
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "PHASES_FETCH_FAILED", message: "Unable to fetch project phases." } } as ApiResponse;
    }
  });

  // ── POST / PATCH Routes ───────────────────────────────────────────────────

  /** POST /projects/:projectId/phases — create a phase */
  app.post("/projects/:projectId/phases", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot create phases." } } as ApiResponse;
    }
    const { projectId } = request.params as { projectId: string };
    const body = request.body as {
      clientId: string;
      name: string;
      budgetedHours?: number;
      color?: string;
      sortOrder?: number;
    };

    try {
      const phase = await prisma.projectPhase.create({
        data: {
          projectId,
          clientId: body.clientId,
          name: body.name,
          budgetedHours: body.budgetedHours ?? 0,
          color: body.color ?? null,
          sortOrder: body.sortOrder ?? 0
        }
      });
      await cache.delete(CacheKeys.phases(projectId));
      reply.status(201);
      return { success: true, data: phase } as ApiResponse<typeof phase>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "PHASE_CREATE_FAILED", message: "Unable to create phase." } } as ApiResponse;
    }
  });

  /** PATCH /projects/:projectId/phases/:id — update phase name/budget/order */
  app.patch("/projects/:projectId/phases/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot update phases." } } as ApiResponse;
    }
    const { projectId, id } = request.params as { projectId: string; id: string };
    const body = request.body as {
      name?: string;
      budgetedHours?: number;
      loggedHours?: number;
      color?: string;
      sortOrder?: number;
    };

    try {
      const phase = await prisma.projectPhase.update({
        where: { id, projectId },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.budgetedHours !== undefined && { budgetedHours: body.budgetedHours }),
          ...(body.loggedHours !== undefined && { loggedHours: body.loggedHours }),
          ...(body.color !== undefined && { color: body.color }),
          ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder })
        }
      });
      await cache.delete(CacheKeys.phases(projectId));
      return { success: true, data: phase } as ApiResponse<typeof phase>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "PHASE_UPDATE_FAILED", message: "Unable to update phase." } } as ApiResponse;
    }
  });
}
