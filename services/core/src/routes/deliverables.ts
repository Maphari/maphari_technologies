// ════════════════════════════════════════════════════════════════════════════
// deliverables.ts — Project deliverable routes
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
export async function registerDeliverableRoutes(app: FastifyInstance): Promise<void> {

  // ── GET Routes ────────────────────────────────────────────────────────────

  /** GET /projects/:projectId/deliverables — list all deliverables for a project */
  app.get("/projects/:projectId/deliverables", async (request) => {
    const scope = readScopeHeaders(request);
    const { projectId } = request.params as { projectId: string };
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    try {
      // Tenant safety: verify project belongs to scoped client
      if (scopedClientId) {
        const project = await prisma.project.findFirst({ where: { id: projectId, clientId: scopedClientId }, select: { id: true } });
        if (!project) return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found." } } as ApiResponse;
      }

      const cacheKey = CacheKeys.deliverables(projectId);
      const data = await withCache(cacheKey, 60, () =>
        prisma.projectDeliverable.findMany({
          where: { projectId },
          orderBy: { createdAt: "asc" }
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DELIVERABLES_FETCH_FAILED", message: "Unable to fetch deliverables." } } as ApiResponse;
    }
  });

  // ── POST / PATCH / DELETE Routes ──────────────────────────────────────────

  /** POST /projects/:projectId/deliverables — create a deliverable */
  app.post("/projects/:projectId/deliverables", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot create deliverables." } } as ApiResponse;
    }
    const { projectId } = request.params as { projectId: string };
    const body = request.body as {
      name: string;
      milestoneId?: string;
      ownerName?: string;
      status?: string;
      dueAt?: string;
    };

    try {
      const deliverable = await prisma.projectDeliverable.create({
        data: {
          projectId,
          name: body.name,
          milestoneId: body.milestoneId ?? null,
          ownerName: body.ownerName ?? null,
          status: body.status ?? "NOT_STARTED",
          dueAt: body.dueAt ? new Date(body.dueAt) : null
        }
      });
      await cache.delete(CacheKeys.deliverables(projectId));
      reply.status(201);
      return { success: true, data: deliverable } as ApiResponse<typeof deliverable>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DELIVERABLE_CREATE_FAILED", message: "Unable to create deliverable." } } as ApiResponse;
    }
  });

  /** PATCH /projects/:projectId/deliverables/:id — update status / fields */
  app.patch("/projects/:projectId/deliverables/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot update deliverables." } } as ApiResponse;
    }
    const { projectId, id } = request.params as { projectId: string; id: string };
    const body = request.body as {
      name?: string;
      ownerName?: string;
      status?: string;
      dueAt?: string | null;
      deliveredAt?: string | null;
    };

    try {
      const deliverable = await prisma.projectDeliverable.update({
        where: { id, projectId },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.ownerName !== undefined && { ownerName: body.ownerName }),
          ...(body.status !== undefined && { status: body.status }),
          ...(body.dueAt !== undefined && { dueAt: body.dueAt ? new Date(body.dueAt) : null }),
          ...(body.deliveredAt !== undefined && { deliveredAt: body.deliveredAt ? new Date(body.deliveredAt) : null })
        }
      });
      await cache.delete(CacheKeys.deliverables(projectId));
      return { success: true, data: deliverable } as ApiResponse<typeof deliverable>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DELIVERABLE_UPDATE_FAILED", message: "Unable to update deliverable." } } as ApiResponse;
    }
  });

  /** DELETE /projects/:projectId/deliverables/:id — admin-only hard delete */
  app.delete("/projects/:projectId/deliverables/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can delete deliverables." } } as ApiResponse;
    }
    const { projectId, id } = request.params as { projectId: string; id: string };

    try {
      await prisma.projectDeliverable.delete({ where: { id, projectId } });
      await cache.delete(CacheKeys.deliverables(projectId));
      return { success: true, data: { deleted: true } } as ApiResponse<{ deleted: boolean }>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DELIVERABLE_DELETE_FAILED", message: "Unable to delete deliverable." } } as ApiResponse;
    }
  });
}
