// ════════════════════════════════════════════════════════════════════════════
// interventions.ts — Client Intervention routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : CLIENT read-only (own tenant); STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerInterventionRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /interventions — Admin/Staff: all interventions across all clients ──
  app.get("/interventions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Use /clients/:id/interventions to view your interventions." } } as ApiResponse);
    }
    const data = await withCache("interventions:all", 60, () =>
      prisma.clientIntervention.findMany({ orderBy: { createdAt: "desc" } })
    );
    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /clients/:clientId/interventions ──────────────────────────────────
  app.get("/clients/:clientId/interventions", async (request) => {
    const scope = readScopeHeaders(request);
    const { clientId } = request.params as { clientId: string };

    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== clientId) {
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
    }

    const data = await withCache(CacheKeys.interventions(clientId), 60, () =>
      prisma.clientIntervention.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /clients/:clientId/interventions ─────────────────────────────────
  app.post("/clients/:clientId/interventions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot create interventions." } } as ApiResponse);
    }

    const { clientId } = request.params as { clientId: string };
    const body = request.body as {
      type: string;
      description?: string;
      assignedTo?: string;
    };

    const intervention = await prisma.clientIntervention.create({
      data: {
        clientId,
        type: body.type,
        description: body.description ?? null,
        status: "OPEN",
        assignedTo: body.assignedTo ?? null
      }
    });

    await cache.delete(CacheKeys.interventions(clientId));

    return reply.code(201).send({ success: true, data: intervention, meta: { requestId: scope.requestId } } as ApiResponse<typeof intervention>);
  });

  // ── PATCH /clients/:clientId/interventions/:id ────────────────────────────
  app.patch("/clients/:clientId/interventions/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Clients cannot update interventions." } } as ApiResponse);
    }

    const { clientId, id } = request.params as { clientId: string; id: string };
    const body = request.body as {
      type?: string;
      description?: string;
      status?: string;
      assignedTo?: string;
      resolvedAt?: string;
    };

    const existing = await prisma.clientIntervention.findFirst({ where: { id, clientId } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Intervention not found." } } as ApiResponse);
    }

    const updated = await prisma.clientIntervention.update({
      where: { id },
      data: {
        type: body.type ?? existing.type,
        description: body.description !== undefined ? body.description : existing.description,
        status: body.status ?? existing.status,
        assignedTo: body.assignedTo !== undefined ? body.assignedTo : existing.assignedTo,
        resolvedAt: body.resolvedAt ? new Date(body.resolvedAt) : existing.resolvedAt
      }
    });

    await cache.delete(CacheKeys.interventions(clientId));

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
