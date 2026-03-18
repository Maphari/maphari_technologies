// ════════════════════════════════════════════════════════════════════════════
// training.ts — Staff Training Record routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : ADMIN full access; STAFF read-own; CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerTrainingRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /training ──────────────────────────────────────────────────────────
  app.get("/training", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    if (scope.role === "STAFF") {
      const ownProfile = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
      if (!ownProfile) return { success: true, data: [], meta: { requestId: scope.requestId } } as ApiResponse<[]>;

      const data = await withCache(CacheKeys.training(ownProfile.id), 120, () =>
        prisma.trainingRecord.findMany({
          where: { staffId: ownProfile.id },
          orderBy: { createdAt: "desc" }
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    }

    // ADMIN sees all
    const data = await withCache(CacheKeys.training("all"), 120, () =>
      prisma.trainingRecord.findMany({ orderBy: { createdAt: "desc" } })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /training — ADMIN only ────────────────────────────────────────────
  app.post("/training", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can create training records." } } as ApiResponse);
    }

    const body = request.body as {
      staffId: string;
      courseName: string;
      category?: string;
      provider?: string;
      status?: string;
      score?: number;
      completedAt?: string;
    };

    const record = await prisma.trainingRecord.create({
      data: {
        staffId:     body.staffId,
        courseName:  body.courseName,
        category:    body.category   ?? null,
        provider:    body.provider   ?? null,
        status:      body.status     ?? "ENROLLED",
        score:       body.score      ?? null,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
      }
    });

    await Promise.all([
      cache.delete(CacheKeys.training(body.staffId)),
      cache.delete(CacheKeys.training("all")),
    ]);

    return reply.code(201).send({ success: true, data: record, meta: { requestId: scope.requestId } } as ApiResponse<typeof record>);
  });

  // ── PATCH /training/:id — ADMIN only ──────────────────────────────────────
  app.patch("/training/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can update training records." } } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const existing = await prisma.trainingRecord.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Training record not found." } } as ApiResponse);
    }

    const body = request.body as {
      courseName?: string;
      category?: string;
      provider?: string;
      status?: string;
      score?: number;
      completedAt?: string;
    };

    const updated = await prisma.trainingRecord.update({
      where: { id },
      data: {
        courseName:  body.courseName  ?? existing.courseName,
        category:    body.category    !== undefined ? body.category    : existing.category,
        provider:    body.provider    !== undefined ? body.provider    : existing.provider,
        status:      body.status      ?? existing.status,
        score:       body.score       !== undefined ? body.score       : existing.score,
        completedAt: body.completedAt ? new Date(body.completedAt)     : existing.completedAt,
      }
    });

    await Promise.all([
      cache.delete(CacheKeys.training(existing.staffId)),
      cache.delete(CacheKeys.training("all")),
    ]);

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
