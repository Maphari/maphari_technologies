// ════════════════════════════════════════════════════════════════════════════
// offboarding.ts — Client Offboarding routes
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
export async function registerOffboardingRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /clients/:clientId/offboarding ───────────────────────────────────
  app.get("/clients/:clientId/offboarding", async (request) => {
    const scope = readScopeHeaders(request);
    const { clientId } = request.params as { clientId: string };

    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== clientId) {
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
    }

    const data = await withCache(CacheKeys.offboarding(clientId), 120, () =>
      prisma.offboardingTask.findMany({
        where: { clientId },
        orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }]
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── PATCH /clients/:clientId/offboarding/:id ──────────────────────────────
  app.patch("/clients/:clientId/offboarding/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { clientId, id } = request.params as { clientId: string; id: string };
    const body = request.body as {
      status?: string;
      completedAt?: string;
    };

    // CLIENT can only update their own offboarding tasks
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== clientId) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const existing = await prisma.offboardingTask.findFirst({ where: { id, clientId } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Offboarding task not found." } } as ApiResponse);
    }

    const updated = await prisma.offboardingTask.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
        completedAt: body.completedAt ? new Date(body.completedAt) : existing.completedAt
      }
    });

    await cache.delete(CacheKeys.offboarding(clientId));

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
