import type { FastifyInstance } from "fastify";
import {
  getMilestoneApprovalsQuerySchema,
  updateMilestoneApprovalSchema,
  type ApiResponse
} from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { writeAuditEvent } from "../lib/audit.js";

export async function registerMilestoneApprovalRoutes(app: FastifyInstance): Promise<void> {
  app.get("/milestone-approvals", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = getMilestoneApprovalsQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid approval query", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId, parsed.data.clientId);
    try {
      const approvals = await prisma.milestoneApproval.findMany({
        where: {
          ...(clientId ? { clientId } : {}),
          ...(parsed.data.projectId ? { projectId: parsed.data.projectId } : {}),
          ...(parsed.data.status ? { status: parsed.data.status } : {})
        },
        orderBy: { createdAt: "desc" }
      });
      return { success: true, data: approvals, meta: { requestId: scope.requestId } } as ApiResponse<typeof approvals>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "APPROVALS_FETCH_FAILED", message: "Unable to load approvals" } } as ApiResponse;
    }
  });

  app.get<{ Params: { milestoneId: string } }>("/milestones/:milestoneId/approval", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const approval = await prisma.milestoneApproval.findFirst({
        where: {
          milestoneId: request.params.milestoneId,
          ...(clientId ? { clientId } : {})
        }
      });
      if (!approval) {
        reply.status(404);
        return { success: false, error: { code: "APPROVAL_NOT_FOUND", message: "Approval not found" } } as ApiResponse;
      }
      return { success: true, data: approval, meta: { requestId: scope.requestId } } as ApiResponse<typeof approval>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "APPROVAL_FETCH_FAILED", message: "Unable to load approval" } } as ApiResponse;
    }
  });

  app.put<{ Params: { milestoneId: string } }>("/milestones/:milestoneId/approval", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = updateMilestoneApprovalSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid approval payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const milestone = await prisma.projectMilestone.findUnique({ where: { id: request.params.milestoneId } });
      if (!milestone) {
        reply.status(404);
        return { success: false, error: { code: "MILESTONE_NOT_FOUND", message: "Milestone not found" } } as ApiResponse;
      }
      const project = await prisma.project.findUnique({ where: { id: milestone.projectId } });
      if (!project) {
        reply.status(404);
        return { success: false, error: { code: "PROJECT_NOT_FOUND", message: "Project not found" } } as ApiResponse;
      }
      if (clientId && project.clientId !== clientId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "Forbidden client scope" } } as ApiResponse;
      }
      const updated = await prisma.milestoneApproval.upsert({
        where: { milestoneId: request.params.milestoneId },
        create: {
          milestoneId: request.params.milestoneId,
          projectId: project.id,
          clientId: project.clientId,
          status: parsed.data.status,
          comment: parsed.data.comment ?? null,
          decidedAt: parsed.data.status === "PENDING" ? null : new Date()
        },
        update: {
          status: parsed.data.status,
          comment: parsed.data.comment ?? null,
          decidedAt: parsed.data.status === "PENDING" ? null : new Date()
        }
      });
      if (parsed.data.status === "APPROVED") {
        writeAuditEvent({
          actorId:      scope.userId,
          actorRole:    scope.role,
          action:       "MILESTONE_APPROVED",
          resourceType: "Milestone",
          resourceId:   request.params.milestoneId,
        });
      } else if (parsed.data.status === "REJECTED") {
        writeAuditEvent({
          actorId:      scope.userId,
          actorRole:    scope.role,
          action:       "MILESTONE_REJECTED",
          resourceType: "Milestone",
          resourceId:   request.params.milestoneId,
          details:      parsed.data.comment ?? null,
        });
      }

      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "APPROVAL_UPDATE_FAILED", message: "Unable to update approval" } } as ApiResponse;
    }
  });
}
