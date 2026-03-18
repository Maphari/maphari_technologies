// ════════════════════════════════════════════════════════════════════════════
// feedback.ts — Feedback reaction & reply routes (scoped to support tickets)
// Service : core  |  Scope: CLIENT own tickets; STAFF/ADMIN full access
// Endpoints:
//   POST   /feedback/:ticketId/reactions       — add reaction (upsert)
//   DELETE /feedback/:ticketId/reactions/:emoji — remove reaction
//   GET    /feedback/:ticketId/replies          — list replies
//   POST   /feedback/:ticketId/replies          — add reply
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

export async function registerFeedbackRoutes(app: FastifyInstance): Promise<void> {

  // Helper to verify ticket access
  async function verifyTicketAccess(ticketId: string, scope: ReturnType<typeof readScopeHeaders>): Promise<boolean> {
    if (scope.role !== "CLIENT") return true;
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId }, select: { clientId: true } });
    return ticket?.clientId === scope.clientId;
  }

  // ── POST /feedback/:ticketId/reactions ────────────────────────────────────
  app.post("/feedback/:ticketId/reactions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { ticketId } = request.params as { ticketId: string };
    const body = request.body as { emoji: string };

    if (!body.emoji) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "emoji is required" } } as ApiResponse;
    }
    if (!scope.clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId scope is required" } } as ApiResponse;
    }

    const allowed = await verifyTicketAccess(ticketId, scope);
    if (!allowed) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse;
    }

    try {
      const reaction = await prisma.feedbackReaction.upsert({
        where: { ticketId_clientId_emoji: { ticketId, clientId: scope.clientId, emoji: body.emoji } },
        create: { ticketId, clientId: scope.clientId, emoji: body.emoji },
        update: {},
      });

      reply.status(201);
      return { success: true, data: reaction } as ApiResponse<typeof reaction>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "REACTION_FAILED", message: "Unable to add reaction" } } as ApiResponse;
    }
  });

  // ── DELETE /feedback/:ticketId/reactions/:emoji ───────────────────────────
  app.delete("/feedback/:ticketId/reactions/:emoji", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { ticketId, emoji } = request.params as { ticketId: string; emoji: string };

    if (!scope.clientId) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "clientId scope is required" } } as ApiResponse;
    }

    const allowed = await verifyTicketAccess(ticketId, scope);
    if (!allowed) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse;
    }

    try {
      await prisma.feedbackReaction.deleteMany({
        where: { ticketId, clientId: scope.clientId, emoji },
      });

      reply.status(204);
      return;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "REACTION_DELETE_FAILED", message: "Unable to remove reaction" } } as ApiResponse;
    }
  });

  // ── GET /feedback/:ticketId/replies ───────────────────────────────────────
  app.get("/feedback/:ticketId/replies", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { ticketId } = request.params as { ticketId: string };

    const allowed = await verifyTicketAccess(ticketId, scope);
    if (!allowed) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse;
    }

    try {
      const replies = await prisma.feedbackReply.findMany({
        where: { ticketId },
        orderBy: { createdAt: "asc" },
      });

      return { success: true, data: replies, meta: { requestId: scope.requestId } } as ApiResponse<typeof replies>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "REPLIES_FETCH_FAILED", message: "Unable to fetch replies" } } as ApiResponse;
    }
  });

  // ── POST /feedback/:ticketId/replies ──────────────────────────────────────
  app.post("/feedback/:ticketId/replies", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { ticketId } = request.params as { ticketId: string };
    const body = request.body as { body: string; authorName?: string };

    if (!body.body?.trim()) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "body is required" } } as ApiResponse;
    }

    const allowed = await verifyTicketAccess(ticketId, scope);
    if (!allowed) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse;
    }

    try {
      const feedbackReply = await prisma.feedbackReply.create({
        data: {
          ticketId,
          authorId: scope.userId ?? null,
          authorRole: scope.role ?? "CLIENT",
          authorName: body.authorName ?? null,
          body: body.body.trim(),
        },
      });

      reply.status(201);
      return { success: true, data: feedbackReply } as ApiResponse<typeof feedbackReply>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "REPLY_CREATE_FAILED", message: "Unable to add reply" } } as ApiResponse;
    }
  });
}
