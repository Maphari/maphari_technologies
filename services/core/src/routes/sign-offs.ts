// ════════════════════════════════════════════════════════════════════════════
// sign-offs.ts — Project milestone sign-off routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN / STAFF create; CLIENT may sign (PATCH /:id/sign)
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerSignOffRoutes(app: FastifyInstance): Promise<void> {

  // ── GET Routes ────────────────────────────────────────────────────────────

  /** GET /projects/:projectId/sign-offs — list sign-off items for a project */
  app.get("/projects/:projectId/sign-offs", async (request) => {
    const scope = readScopeHeaders(request);
    const { projectId } = request.params as { projectId: string };
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    try {
      const cacheKey = CacheKeys.signOffs(projectId);
      const data = await withCache(cacheKey, 60, () =>
        prisma.projectSignOff.findMany({
          where: {
            projectId,
            ...(scopedClientId ? { clientId: scopedClientId } : {})
          },
          orderBy: { createdAt: "asc" }
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "SIGN_OFFS_FETCH_FAILED", message: "Unable to fetch sign-offs." } } as ApiResponse;
    }
  });

  // ── POST / PATCH Routes ───────────────────────────────────────────────────

  /** POST /projects/:projectId/sign-offs — create a sign-off item (admin/staff) */
  app.post("/projects/:projectId/sign-offs", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot create sign-off items." } } as ApiResponse;
    }
    const { projectId } = request.params as { projectId: string };
    const body = request.body as {
      clientId: string;
      name: string;
      description?: string;
      status?: string;
    };

    try {
      const signOff = await prisma.projectSignOff.create({
        data: {
          projectId,
          clientId: body.clientId,
          name: body.name,
          description: body.description ?? null,
          status: body.status ?? "NOT_READY"
        }
      });
      await cache.delete(CacheKeys.signOffs(projectId));
      reply.status(201);
      return { success: true, data: signOff } as ApiResponse<typeof signOff>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "SIGN_OFF_CREATE_FAILED", message: "Unable to create sign-off item." } } as ApiResponse;
    }
  });

  /** PATCH /projects/:projectId/sign-offs/:id/sign — mark as signed (all roles) */
  app.patch("/projects/:projectId/sign-offs/:id/sign", async (request) => {
    const scope = readScopeHeaders(request);
    const { projectId, id } = request.params as { projectId: string; id: string };
    const body = request.body as { signedByName?: string };

    try {
      const signOff = await prisma.projectSignOff.update({
        where: { id, projectId },
        data: {
          status: "SIGNED",
          signedAt: new Date(),
          signedByName: body.signedByName ?? null
        }
      });
      await cache.delete(CacheKeys.signOffs(projectId));
      return { success: true, data: signOff } as ApiResponse<typeof signOff>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "SIGN_OFF_FAILED", message: "Unable to record sign-off." } } as ApiResponse;
    }
  });
}
