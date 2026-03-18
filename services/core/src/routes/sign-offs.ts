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

  // ── Approval decision (generic sign-off items) ────────────────────────────

  /**
   * PATCH /sign-offs/:id
   * Update approval decision on a sign-off item.
   * Body: { status: "APPROVED" | "REVISION_REQUESTED" | "REJECTED"; notes?: string }
   * CLIENT may approve/request-revision/reject items assigned to them.
   */
  app.patch("/sign-offs/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };
    const body = request.body as {
      status: "APPROVED" | "REVISION_REQUESTED" | "REJECTED";
      notes?: string;
    };

    if (!body.status || !["APPROVED", "REVISION_REQUESTED", "REJECTED"].includes(body.status)) {
      reply.status(400);
      return { success: false, error: { code: "INVALID_STATUS", message: "status must be APPROVED, REVISION_REQUESTED, or REJECTED." } } as ApiResponse;
    }

    try {
      const signOff = await prisma.projectSignOff.update({
        where: { id },
        data: {
          status: body.status === "APPROVED" ? "SIGNED" : body.status,
          ...(body.status === "APPROVED" && { signedAt: new Date() }),
          ...(body.notes != null && { description: body.notes }),
        }
      });
      await cache.delete(CacheKeys.signOffs(signOff.projectId));
      return { success: true, data: signOff } as ApiResponse<typeof signOff>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "SIGN_OFF_UPDATE_FAILED", message: "Unable to update approval decision." } } as ApiResponse;
    }
  });

  // ── Send reminder ─────────────────────────────────────────────────────────

  /**
   * POST /sign-offs/:id/remind
   * Creates an audit-event with action APPROVAL_REMINDER_SENT so staff can
   * track that a reminder was sent to the client.
   * ADMIN / STAFF only.
   */
  app.post("/sign-offs/:id/remind", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot send reminders." } } as ApiResponse;
    }
    const { id } = request.params as { id: string };

    try {
      const signOff = await prisma.projectSignOff.findUnique({ where: { id } });
      if (!signOff) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Sign-off item not found." } } as ApiResponse;
      }

      const auditEvent = await prisma.auditEvent.create({
        data: {
          action: "APPROVAL_REMINDER_SENT",
          resourceType: "ProjectSignOff",
          resourceId: id,
          actorId: scope.userId ?? null,
          details: JSON.stringify({ signOffId: id, projectId: signOff.projectId, clientId: signOff.clientId }),
        }
      });
      reply.status(201);
      return { success: true, data: { reminderId: auditEvent.id, sentAt: auditEvent.createdAt } } as ApiResponse<{ reminderId: string; sentAt: Date }>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "REMINDER_FAILED", message: "Unable to record reminder." } } as ApiResponse;
    }
  });
}
