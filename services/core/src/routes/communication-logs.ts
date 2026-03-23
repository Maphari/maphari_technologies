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
      body?: string;
      occurredAt: string;
    };

    const createdLog = await prisma.communicationLog.create({
      data: {
        clientId,
        type: body.type,
        subject: body.subject,
        fromName: body.fromName ?? null,
        direction: body.direction,
        relatedFileId: body.relatedFileId ?? null,
        actionLabel: body.actionLabel ?? null,
        body: body.body ?? null,
        occurredAt: new Date(body.occurredAt)
      }
    });

    await cache.delete(CacheKeys.commLogs(clientId));

    // Fire-and-forget sentiment for INBOUND client messages
    if (createdLog.direction === "INBOUND") {
      const textToAnalyse = createdLog.body ?? createdLog.subject;
      if (textToAnalyse) {
        (async () => {
          try {
            const aiRes = await fetch(
              `${process.env.AI_SERVICE_URL ?? "http://localhost:4007"}/ai/sentiment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-role": "ADMIN",
                  "x-user-id": "system",
                },
                body: JSON.stringify({ content: textToAnalyse.slice(0, 500) }),
                signal: AbortSignal.timeout(10_000),
              }
            );
            if (aiRes.ok) {
              const d = await aiRes.json() as { success?: boolean; data?: { score?: number; label?: string } };
              if (d.success && d.data) {
                await prisma.communicationLog.update({
                  where: { id: createdLog.id },
                  data: { sentimentScore: d.data.score ?? null, sentimentLabel: d.data.label ?? null },
                });
              }
            }
          } catch (err) {
            console.warn("[sentiment] Failed to analyse or persist sentiment:", err);
          }
        })();
      }
    }

    return reply.code(201).send({ success: true, data: createdLog, meta: { requestId: scope.requestId } } as ApiResponse<typeof createdLog>);
  });

  // GET /admin/sentiment-alerts — ADMIN: last 50 negative-sentiment inbound messages
  app.get("/admin/sentiment-alerts", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse);
    }

    const alerts = await prisma.communicationLog.findMany({
      where: { sentimentLabel: "NEGATIVE", direction: "INBOUND" },
      orderBy: { occurredAt: "desc" },
      take: 50,
      select: { id: true, clientId: true, subject: true, body: true, sentimentScore: true, occurredAt: true, createdAt: true },
    });

    return { success: true, data: alerts, meta: { requestId: scope.requestId } } as ApiResponse<typeof alerts>;
  });

  // ── GET /staff/client-notes/:clientId — Private CRM notes for a client ─────
  app.get("/staff/client-notes/:clientId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const { clientId } = request.params as { clientId: string };

    const rows = await prisma.communicationLog.findMany({
      where: { clientId, type: "PRIVATE_NOTE", direction: "INTERNAL" },
      orderBy: { occurredAt: "desc" },
      take: 100,
    });

    const data = rows.map((r) => {
      let category = "general";
      try {
        const parsed = JSON.parse(r.subject);
        if (parsed?.category) category = parsed.category;
      } catch { /* subject may be plain text */ }
      return {
        id:          r.id,
        clientId:    r.clientId,
        note:        r.actionLabel ?? "",
        category,
        authorName:  r.fromName ?? null,
        createdAt:   r.occurredAt.toISOString(),
      };
    });

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /staff/client-notes — Create a private CRM note ──────────────────
  app.post("/staff/client-notes", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const body = request.body as {
      clientId:  string;
      note:      string;
      category?: string;
    };

    if (!body.clientId || !body.note?.trim()) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "clientId and note are required." } } as ApiResponse);
    }

    const validCategories = ["preference", "risk", "opportunity", "general"];
    const category = validCategories.includes(body.category ?? "") ? (body.category ?? "general") : "general";

    const log = await prisma.communicationLog.create({
      data: {
        clientId:    body.clientId,
        type:        "PRIVATE_NOTE",
        subject:     JSON.stringify({ category }),
        direction:   "INTERNAL",
        fromName:    scope.userId ?? null,
        actionLabel: body.note.trim(),
        occurredAt:  new Date(),
      },
    });

    await cache.delete(CacheKeys.commLogs(body.clientId));

    const data = {
      id:          log.id,
      clientId:    log.clientId,
      note:        log.actionLabel ?? "",
      category,
      authorName:  log.fromName ?? null,
      createdAt:   log.occurredAt.toISOString(),
    };

    return reply.code(201).send({ success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>);
  });

  // ── DELETE /staff/client-notes/:id — Delete a private CRM note ────────────
  app.delete("/staff/client-notes/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };

    const existing = await prisma.communicationLog.findUnique({ where: { id }, select: { clientId: true, type: true } });
    if (!existing || existing.type !== "PRIVATE_NOTE") {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Note not found." } } as ApiResponse);
    }

    await prisma.communicationLog.delete({ where: { id } });
    await cache.delete(CacheKeys.commLogs(existing.clientId));

    reply.code(204);
    return;
  });
}
