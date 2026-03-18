// ════════════════════════════════════════════════════════════════════════════
// communication-logs.ts — Communication Log routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : CLIENT read-own; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerCommunicationLogRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /comms — Admin/Staff: all comm logs across all clients ────────────
  app.get("/comms", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Use /clients/:id/comms to view your logs." } } as ApiResponse);
    }
    const data = await withCache("comms:all", 60, () =>
      prisma.communicationLog.findMany({ orderBy: { occurredAt: "desc" } })
    );
    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /clients/:clientId/comms ──────────────────────────────────────────
  app.get("/clients/:clientId/comms", async (request) => {
    const scope = readScopeHeaders(request);
    const { clientId } = request.params as { clientId: string };

    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== clientId) {
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
    }

    const data = await withCache(CacheKeys.commLogs(clientId), 60, () =>
      prisma.communicationLog.findMany({
        where: { clientId },
        orderBy: { occurredAt: "desc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /staff/auto-drafts — list saved auto-draft communication logs ─────
  app.get("/staff/auto-drafts", async (request) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
    }

    const { clientId } = request.query as { clientId?: string };

    const where: Record<string, unknown> = { type: "AUTO_DRAFT" };
    if (clientId) where.clientId = clientId;
    if (scope.role === "STAFF" && scope.userId) where.fromName = scope.userId;

    const data = await prisma.communicationLog.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: 50,
    });

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /staff/auto-drafts — save an auto-draft ──────────────────────────
  app.post("/staff/auto-drafts", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const body = request.body as {
      clientId: string;
      subject: string;
      content: string;
      status?: "DRAFT" | "SENT";
    };

    const log = await prisma.communicationLog.create({
      data: {
        clientId: body.clientId,
        type: "AUTO_DRAFT",
        subject: body.subject,
        fromName: scope.userId ?? null,
        direction: "OUTBOUND",
        actionLabel: body.content,
        occurredAt: new Date(),
      },
    });

    await cache.delete(CacheKeys.commLogs(body.clientId));

    return reply.code(201).send({ success: true, data: log, meta: { requestId: scope.requestId } } as ApiResponse<typeof log>);
  });

  // ── POST /clients/:clientId/comms ─────────────────────────────────────────
  app.post("/clients/:clientId/comms", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot create communication logs." } } as ApiResponse);
    }

    const { clientId } = request.params as { clientId: string };
    const body = request.body as {
      type: string;
      subject: string;
      fromName?: string;
      direction: string;
      relatedFileId?: string;
      actionLabel?: string;
      occurredAt: string;
    };

    const log = await prisma.communicationLog.create({
      data: {
        clientId,
        type: body.type,
        subject: body.subject,
        fromName: body.fromName ?? null,
        direction: body.direction,
        relatedFileId: body.relatedFileId ?? null,
        actionLabel: body.actionLabel ?? null,
        occurredAt: new Date(body.occurredAt)
      }
    });

    await cache.delete(CacheKeys.commLogs(clientId));

    return reply.code(201).send({ success: true, data: log, meta: { requestId: scope.requestId } } as ApiResponse<typeof log>);
  });
}
