// ════════════════════════════════════════════════════════════════════════════
// client-onboarding-cx.ts — Client Onboarding CX routes
// Service : core  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : CLIENT read-own; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerClientOnboardingCxRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /clients/:clientId/onboarding ────────────────────────────────────
  app.get("/clients/:clientId/onboarding", async (request) => {
    const scope = readScopeHeaders(request);
    const { clientId } = request.params as { clientId: string };

    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== clientId) {
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
    }

    const data = await withCache(CacheKeys.clientOnboarding(clientId), 120, () =>
      prisma.clientOnboardingRecord.findMany({
        where: { clientId },
        orderBy: { sortOrder: "asc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── PATCH /clients/:clientId/onboarding/:id ───────────────────────────────
  app.patch("/clients/:clientId/onboarding/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { clientId, id } = request.params as { clientId: string; id: string };
    const body = request.body as {
      status?: string;
      notes?: string;
      estimatedAt?: string;
      completedAt?: string;
    };

    // CLIENT can only update their own onboarding records
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== clientId) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const existing = await prisma.clientOnboardingRecord.findFirst({ where: { id, clientId } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Onboarding record not found." } } as ApiResponse);
    }

    const updated = await prisma.clientOnboardingRecord.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        estimatedAt: body.estimatedAt ? new Date(body.estimatedAt) : existing.estimatedAt,
        completedAt: body.completedAt ? new Date(body.completedAt) : existing.completedAt
      }
    });

    await cache.delete(CacheKeys.clientOnboarding(clientId));

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
