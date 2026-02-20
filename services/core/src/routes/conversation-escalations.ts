import type { FastifyInstance } from "fastify";
import {
  createConversationEscalationSchema,
  getConversationEscalationsQuerySchema,
  updateConversationEscalationSchema,
  type ApiResponse
} from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

export async function registerConversationEscalationRoutes(app: FastifyInstance): Promise<void> {
  app.get("/conversation-escalations", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff or admins can view escalations" } } as ApiResponse;
    }
    const parsed = getConversationEscalationsQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid escalation query", details: parsed.error.flatten() }
      } as ApiResponse;
    }
    try {
      const escalations = await prisma.conversationEscalation.findMany({
        where: {
          ...(parsed.data.conversationId ? { conversationId: parsed.data.conversationId } : {}),
          ...(parsed.data.status ? { status: parsed.data.status } : {})
        },
        orderBy: { createdAt: "desc" }
      });
      return { success: true, data: escalations, meta: { requestId: scope.requestId } } as ApiResponse<typeof escalations>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "ESCALATIONS_FETCH_FAILED", message: "Unable to load escalations" } } as ApiResponse;
    }
  });

  app.post("/conversation-escalations", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff or admins can create escalations" } } as ApiResponse;
    }
    const parsed = createConversationEscalationSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid escalation payload", details: parsed.error.flatten() } } as ApiResponse;
    }
    try {
      const escalation = await prisma.conversationEscalation.create({
        data: {
          conversationId: parsed.data.conversationId,
          messageId: parsed.data.messageId ?? null,
          severity: parsed.data.severity ?? "MEDIUM",
          status: "OPEN",
          reason: parsed.data.reason,
          ownerAdminId: scope.role === "ADMIN" ? scope.userId ?? null : null
        }
      });
      return { success: true, data: escalation, meta: { requestId: scope.requestId } } as ApiResponse<typeof escalation>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "ESCALATION_CREATE_FAILED", message: "Unable to create escalation" } } as ApiResponse;
    }
  });

  app.patch<{ Params: { escalationId: string } }>("/conversation-escalations/:escalationId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff or admins can update escalations" } } as ApiResponse;
    }
    const parsed = updateConversationEscalationSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid escalation update", details: parsed.error.flatten() } } as ApiResponse;
    }
    try {
      const existing = await prisma.conversationEscalation.findUnique({ where: { id: request.params.escalationId } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "ESCALATION_NOT_FOUND", message: "Escalation not found" } } as ApiResponse;
      }
      const updated = await prisma.conversationEscalation.update({
        where: { id: existing.id },
        data: {
          status: parsed.data.status ?? existing.status,
          ownerAdminId: parsed.data.ownerAdminId ?? existing.ownerAdminId,
          resolvedAt: parsed.data.resolvedAt ? new Date(parsed.data.resolvedAt) : existing.resolvedAt
        }
      });
      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "ESCALATION_UPDATE_FAILED", message: "Unable to update escalation" } } as ApiResponse;
    }
  });
}
