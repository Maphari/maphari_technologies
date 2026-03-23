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
import { writeAuditEvent } from "../lib/audit.js";

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
      writeAuditEvent({
        actorId:      scope.userId,
        actorRole:    scope.role,
        action:       "DELIVERABLE_CREATED",
        resourceType: "Deliverable",
        resourceId:   deliverable.id,
        details:      deliverable.name ?? null,
      });
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
      writeAuditEvent({
        actorId:      scope.userId,
        actorRole:    scope.role,
        action:       "DELIVERABLE_DELETED",
        resourceType: "Deliverable",
        resourceId:   id,
      });
      return { success: true, data: { deleted: true } } as ApiResponse<{ deleted: boolean }>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DELIVERABLE_DELETE_FAILED", message: "Unable to delete deliverable." } } as ApiResponse;
    }
  });

  /** POST /projects/:projectId/deliverables/:id/approve — client approves a deliverable */
  app.post("/projects/:projectId/deliverables/:id/approve", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { projectId, id } = request.params as { projectId: string; id: string };

    // Tenant safety for CLIENT
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, clientId: scopedClientId }, select: { id: true } });
      if (!project) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found." } } as ApiResponse;
      }
    }

    try {
      const current = await prisma.projectDeliverable.findFirst({
        where: { id, projectId },
        select: { status: true }
      });
      if (!current) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Deliverable not found." } } as ApiResponse;
      }
      if (current.status !== "DELIVERED") {
        reply.status(409);
        return { success: false, error: { code: "INVALID_STATUS", message: "Only delivered deliverables can be approved." } } as ApiResponse;
      }
      const deliverable = await prisma.projectDeliverable.update({
        where: { id, projectId },
        data: { status: "ACCEPTED" }
      });
      await cache.delete(CacheKeys.deliverables(projectId));
      writeAuditEvent({
        actorId:      scope.userId,
        actorRole:    scope.role,
        action:       "DELIVERABLE_APPROVED",
        resourceType: "Deliverable",
        resourceId:   id,
      });
      return { success: true, data: deliverable } as ApiResponse<typeof deliverable>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DELIVERABLE_APPROVE_FAILED", message: "Unable to approve deliverable." } } as ApiResponse;
    }
  });

  /** POST /projects/:projectId/deliverables/:id/request-changes — client requests changes */
  app.post("/projects/:projectId/deliverables/:id/request-changes", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { projectId, id } = request.params as { projectId: string; id: string };
    const body = request.body as { reason?: string };

    // Tenant safety for CLIENT
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, clientId: scopedClientId }, select: { id: true } });
      if (!project) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found." } } as ApiResponse;
      }
    }

    try {
      const current = await prisma.projectDeliverable.findFirst({
        where: { id, projectId },
        select: { status: true }
      });
      if (!current) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Deliverable not found." } } as ApiResponse;
      }
      if (current.status !== "DELIVERED") {
        reply.status(409);
        return { success: false, error: { code: "INVALID_STATUS", message: "Only delivered deliverables can have changes requested." } } as ApiResponse;
      }
      const deliverable = await prisma.projectDeliverable.update({
        where: { id, projectId },
        data: { status: "CHANGES_REQUESTED" }
      });
      await cache.delete(CacheKeys.deliverables(projectId));
      writeAuditEvent({
        actorId:      scope.userId,
        actorRole:    scope.role,
        action:       "DELIVERABLE_CHANGES_REQUESTED",
        resourceType: "Deliverable",
        resourceId:   id,
      });
      return { success: true, data: deliverable } as ApiResponse<typeof deliverable>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DELIVERABLE_CHANGES_FAILED", message: "Unable to submit change request." } } as ApiResponse;
    }
  });
}
