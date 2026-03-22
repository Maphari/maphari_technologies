// ════════════════════════════════════════════════════════════════════════════
// data-retention.ts — Data Retention Policy routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN only
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { Prisma } from "@prisma/client";
import { CacheKeys, withCache, cache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Cache invalidation helper ─────────────────────────────────────────────────
async function invalidateDataRetentionCache(): Promise<void> {
  await cache.delete(CacheKeys.dataRetention());
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerDataRetentionRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /data-retention — list all policies (ADMIN only) ─────────────────
  app.get("/data-retention", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can view data retention policies." } } as ApiResponse;
    }

    try {
      const data = await withCache(CacheKeys.dataRetention(), 60, () =>
        prisma.dataRetentionPolicy.findMany({ orderBy: { dataType: "asc" } })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "DATA_RETENTION_FETCH_FAILED", message: "Unable to fetch data retention policies." } } as ApiResponse;
    }
  });

  // ── PATCH /data-retention/:id — update a policy (ADMIN only) ─────────────
  app.patch("/data-retention/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can update data retention policies." } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as {
      status?:      string;
      retainYears?: number;
      lastPurge?:   string;
      nextPurge?:   string;
    };

    let lastPurgeDate: Date | undefined;
    if (body.lastPurge !== undefined) {
      const d = new Date(body.lastPurge);
      if (isNaN(d.getTime())) {
        return reply.status(400).send({ error: "INVALID_DATE_FORMAT_lastPurge" });
      }
      lastPurgeDate = d;
    }

    let nextPurgeDate: Date | undefined;
    if (body.nextPurge !== undefined) {
      const d = new Date(body.nextPurge);
      if (isNaN(d.getTime())) {
        return reply.status(400).send({ error: "INVALID_DATE_FORMAT_nextPurge" });
      }
      nextPurgeDate = d;
    }

    try {
      const record = await prisma.dataRetentionPolicy.update({
        where: { id },
        data: {
          ...(body.status      !== undefined && { status:      body.status }),
          ...(body.retainYears !== undefined && { retainYears: body.retainYears }),
          ...(lastPurgeDate    !== undefined && { lastPurge:   lastPurgeDate }),
          ...(nextPurgeDate    !== undefined && { nextPurge:   nextPurgeDate }),
        }
      });
      await invalidateDataRetentionCache();
      return { success: true, data: record } as ApiResponse<typeof record>;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return reply.status(404).send({ error: "DATA_RETENTION_POLICY_NOT_FOUND" });
      }
      request.log.error(error);
      return { success: false, error: { code: "DATA_RETENTION_UPDATE_FAILED", message: "Unable to update data retention policy." } } as ApiResponse;
    }
  });
}
