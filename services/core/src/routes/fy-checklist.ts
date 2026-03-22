// ════════════════════════════════════════════════════════════════════════════
// fy-checklist.ts — Financial Year Closeout Checklist routes
// Service : core  |  Cache TTL: 30 s (GET), invalidate on write
// Scope   : ADMIN only
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { Prisma } from "@prisma/client";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Cache invalidation helper ─────────────────────────────────────────────────
async function invalidateFyChecklist(year: string): Promise<void> {
  await cache.delete(CacheKeys.fyChecklist(year));
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerFyChecklistRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /fy-checklist?year=2025-2026 — list items for a fiscal year ────────
  app.get("/fy-checklist", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can view the FY checklist." } } as ApiResponse;
    }

    const { year } = request.query as { year?: string };
    if (!year) {
      return reply.status(400).send({ success: false, error: { code: "MISSING_YEAR", message: "Query param ?year= is required." } });
    }

    try {
      const data = await withCache(CacheKeys.fyChecklist(year), 30, () =>
        prisma.fyChecklistItem.findMany({
          where: { fiscalYear: year },
          orderBy: [{ category: "asc" }, { createdAt: "asc" }],
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "FY_CHECKLIST_FETCH_FAILED", message: "Unable to fetch FY checklist." } } as ApiResponse;
    }
  });

  // ── PATCH /fy-checklist/:id — toggle done state ────────────────────────────
  app.patch("/fy-checklist/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can update the FY checklist." } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as { done?: boolean };

    if (typeof body.done !== "boolean") {
      return reply.status(400).send({ success: false, error: { code: "INVALID_BODY", message: "Body must contain a boolean `done` field." } });
    }

    try {
      const record = await prisma.fyChecklistItem.update({
        where: { id },
        data: {
          done:   body.done,
          doneAt: body.done ? new Date() : null,
          doneBy: body.done ? (scope.userId ?? null) : null,
        },
      });
      await invalidateFyChecklist(record.fiscalYear);
      return { success: true, data: record } as ApiResponse<typeof record>;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return reply.status(404).send({ success: false, error: { code: "FY_CHECKLIST_ITEM_NOT_FOUND", message: "Checklist item not found." } });
      }
      request.log.error(error);
      return { success: false, error: { code: "FY_CHECKLIST_UPDATE_FAILED", message: "Unable to update checklist item." } } as ApiResponse;
    }
  });
}
