// ════════════════════════════════════════════════════════════════════════════
// staff-onboarding.ts — Staff Onboarding Record routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : ADMIN full access; STAFF read/write-own; CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerStaffOnboardingRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /staff/:staffId/onboarding ────────────────────────────────────────
  app.get("/staff/:staffId/onboarding", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const { staffId } = request.params as { staffId: string };

    // STAFF can only read their own onboarding
    if (scope.role === "STAFF") {
      const ownProfile = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
      if (!ownProfile || ownProfile.id !== staffId) {
        return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
      }
    }

    const data = await withCache(CacheKeys.staffOnboarding(staffId), 120, () =>
      prisma.staffOnboardingRecord.findMany({
        where: { staffId },
        orderBy: { sortOrder: "asc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── PATCH /staff/:staffId/onboarding/:id ──────────────────────────────────
  app.patch("/staff/:staffId/onboarding/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const { staffId, id } = request.params as { staffId: string; id: string };

    // STAFF can only update their own records
    if (scope.role === "STAFF") {
      const ownProfile = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
      if (!ownProfile || ownProfile.id !== staffId) {
        return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
      }
    }

    const existing = await prisma.staffOnboardingRecord.findFirst({ where: { id, staffId } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Onboarding record not found." } } as ApiResponse);
    }

    const body = request.body as { status?: string; notes?: string; completedAt?: string };

    const updated = await prisma.staffOnboardingRecord.update({
      where: { id },
      data: {
        status:      body.status      ?? existing.status,
        notes:       body.notes       !== undefined ? body.notes       : existing.notes,
        completedAt: body.completedAt ? new Date(body.completedAt)     : existing.completedAt,
      }
    });

    await cache.delete(CacheKeys.staffOnboarding(staffId));

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
