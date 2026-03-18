// ════════════════════════════════════════════════════════════════════════════
// briefs.ts — Project brief routes (one brief per project, upsert semantics)
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : ADMIN / STAFF full access; CLIENT own-tenant read-only
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerBriefRoutes(app: FastifyInstance): Promise<void> {

  // ── GET Routes ────────────────────────────────────────────────────────────

  /** GET /projects/:projectId/brief — fetch the project brief */
  app.get("/projects/:projectId/brief", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { projectId } = request.params as { projectId: string };
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    try {
      const cacheKey = CacheKeys.brief(projectId);
      const brief = await withCache(cacheKey, 120, async () => {
        const record = await prisma.projectBrief.findUnique({ where: { projectId } });
        if (!record) return null;
        if (scopedClientId && record.clientId !== scopedClientId) return null;
        return record;
      });

      if (!brief) {
        reply.status(404);
        return { success: false, error: { code: "BRIEF_NOT_FOUND", message: "No brief found for this project." } } as ApiResponse;
      }

      return { success: true, data: brief, meta: { requestId: scope.requestId } } as ApiResponse<typeof brief>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "BRIEF_FETCH_FAILED", message: "Unable to fetch project brief." } } as ApiResponse;
    }
  });

  // ── PUT Route (upsert) ────────────────────────────────────────────────────

  /** PUT /projects/:projectId/brief — create or replace the brief (increments version) */
  app.put("/projects/:projectId/brief", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot update the project brief." } } as ApiResponse;
    }
    const { projectId } = request.params as { projectId: string };
    const body = request.body as {
      clientId: string;
      objectives: string;
      inScope: string;
      outOfScope: string;
      contacts: string;
      status?: string;
    };

    try {
      const brief = await prisma.projectBrief.upsert({
        where: { projectId },
        create: {
          projectId,
          clientId: body.clientId,
          objectives: body.objectives,
          inScope: body.inScope,
          outOfScope: body.outOfScope,
          contacts: body.contacts,
          status: body.status ?? "ACTIVE"
        },
        update: {
          objectives: body.objectives,
          inScope: body.inScope,
          outOfScope: body.outOfScope,
          contacts: body.contacts,
          ...(body.status !== undefined && { status: body.status }),
          version: { increment: 1 }
        }
      });
      await cache.delete(CacheKeys.brief(projectId));
      reply.status(200);
      return { success: true, data: brief } as ApiResponse<typeof brief>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "BRIEF_UPSERT_FAILED", message: "Unable to save project brief." } } as ApiResponse;
    }
  });
}
