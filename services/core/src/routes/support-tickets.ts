// ════════════════════════════════════════════════════════════════════════════
// support-tickets.ts — Support Ticket routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : CLIENT read-own + create; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerSupportTicketRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /support-tickets ──────────────────────────────────────────────────
  app.get("/support-tickets", async (request) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    const where = scopedClientId ? { clientId: scopedClientId } : {};
    const cacheKey = scopedClientId
      ? CacheKeys.supportTickets(scopedClientId)
      : CacheKeys.supportTickets("all");

    const data = await withCache(cacheKey, 60, () =>
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: "desc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /support-tickets ─────────────────────────────────────────────────
  app.post("/support-tickets", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = request.body as {
      clientId: string;
      title: string;
      description?: string;
      category?: string;
      priority?: string;
    };

    // CLIENT can only submit for themselves
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== body.clientId) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        clientId: body.clientId,
        title: body.title,
        description: body.description ?? null,
        category: body.category ?? null,
        priority: body.priority ?? "MEDIUM",
        status: "OPEN",
        assignedTo: null
      }
    });

    await cache.delete(CacheKeys.supportTickets(body.clientId));
    await cache.delete(CacheKeys.supportTickets("all"));

    return reply.code(201).send({ success: true, data: ticket, meta: { requestId: scope.requestId } } as ApiResponse<typeof ticket>);
  });

  // ── PATCH /support-tickets/:id ────────────────────────────────────────────
  app.patch("/support-tickets/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };
    const body = request.body as {
      title?: string;
      description?: string;
      category?: string;
      priority?: string;
      status?: string;
      assignedTo?: string;
      resolvedAt?: string;
    };

    const existing = await prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Support ticket not found." } } as ApiResponse);
    }

    // CLIENT can update only their own tickets (and cannot change assignedTo/resolvedAt)
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== existing.clientId) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        description: body.description !== undefined ? body.description : existing.description,
        category: body.category !== undefined ? body.category : existing.category,
        priority: body.priority ?? existing.priority,
        status: body.status ?? existing.status,
        assignedTo: scope.role !== "CLIENT" && body.assignedTo !== undefined ? body.assignedTo : existing.assignedTo,
        resolvedAt: scope.role !== "CLIENT" && body.resolvedAt ? new Date(body.resolvedAt) : existing.resolvedAt
      }
    });

    await cache.delete(CacheKeys.supportTickets(existing.clientId));
    await cache.delete(CacheKeys.supportTickets("all"));

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });

  // ── POST /support-tickets/:id/comments ────────────────────────────────────
  app.post<{ Params: { id: string } }>("/support-tickets/:id/comments", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params;
    const body = (request.body ?? {}) as { message: string; authorName?: string };

    if (!body.message?.trim()) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "message is required" }
      } as ApiResponse;
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      reply.status(404);
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Support ticket not found" }
      } as ApiResponse;
    }

    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== ticket.clientId) {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied" }
      } as ApiResponse;
    }

    const comment = await prisma.communicationLog.create({
      data: {
        clientId:   ticket.clientId,
        type:       "TICKET_COMMENT",
        subject:    id,                          // ticketId stored in subject
        fromName:   body.authorName ?? scope.userId ?? null,
        direction:  scope.role === "CLIENT" ? "INBOUND" : "INTERNAL",
        occurredAt: new Date(),
      }
    });

    // Store comment text in actionLabel (repurposed as comment body)
    const updated = await prisma.communicationLog.update({
      where: { id: comment.id },
      data:  { actionLabel: body.message }
    });

    return reply
      .code(201)
      .send({ success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>);
  });
}
