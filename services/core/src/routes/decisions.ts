// ════════════════════════════════════════════════════════════════════════════
// decisions.ts — Project decision log routes
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
export async function registerDecisionRoutes(app: FastifyInstance): Promise<void> {

  // ── GET Routes ────────────────────────────────────────────────────────────

  /** GET /projects/:projectId/decisions — list project decisions */
  app.get("/projects/:projectId/decisions", async (request) => {
    const scope = readScopeHeaders(request);
    const { projectId } = request.params as { projectId: string };
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    try {
      const cacheKey = CacheKeys.decisions(projectId);
      const data = await withCache(cacheKey, 60, () =>
        prisma.projectDecision.findMany({
          where: {
            projectId,
            ...(scopedClientId ? { clientId: scopedClientId } : {})
          },
          orderBy: { decidedAt: "desc" }
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DECISIONS_FETCH_FAILED", message: "Unable to fetch decisions." } } as ApiResponse;
    }
  });

  // ── POST / PATCH Routes ───────────────────────────────────────────────────

  /** POST /projects/:projectId/decisions — create a decision */
  app.post("/projects/:projectId/decisions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot create decisions." } } as ApiResponse;
    }
    const { projectId } = request.params as { projectId: string };
    const body = request.body as {
      clientId: string;
      title: string;
      context?: string;
      decidedByName?: string;
      decidedByRole?: string;
      decidedAt?: string;
    };

    try {
      const decision = await prisma.projectDecision.create({
        data: {
          projectId,
          clientId: body.clientId,
          title: body.title,
          context: body.context ?? null,
          decidedByName: body.decidedByName ?? null,
          decidedByRole: body.decidedByRole ?? null,
          decidedAt: body.decidedAt ? new Date(body.decidedAt) : null
        }
      });
      await cache.delete(CacheKeys.decisions(projectId));
      reply.status(201);
      return { success: true, data: decision } as ApiResponse<typeof decision>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DECISION_CREATE_FAILED", message: "Unable to create decision." } } as ApiResponse;
    }
  });

  /** PATCH /projects/:projectId/decisions/:id — update a decision */
  app.patch("/projects/:projectId/decisions/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot update decisions." } } as ApiResponse;
    }
    const { projectId, id } = request.params as { projectId: string; id: string };
    const body = request.body as {
      title?: string;
      context?: string;
      decidedByName?: string;
      decidedByRole?: string;
      decidedAt?: string | null;
    };

    try {
      const decision = await prisma.projectDecision.update({
        where: { id, projectId },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.context !== undefined && { context: body.context }),
          ...(body.decidedByName !== undefined && { decidedByName: body.decidedByName }),
          ...(body.decidedByRole !== undefined && { decidedByRole: body.decidedByRole }),
          ...(body.decidedAt !== undefined && { decidedAt: body.decidedAt ? new Date(body.decidedAt) : null })
        }
      });
      await cache.delete(CacheKeys.decisions(projectId));
      return { success: true, data: decision } as ApiResponse<typeof decision>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DECISION_UPDATE_FAILED", message: "Unable to update decision." } } as ApiResponse;
    }
  });
}
