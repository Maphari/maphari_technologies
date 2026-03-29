// ════════════════════════════════════════════════════════════════════════════
// cash-flow-scenarios.ts — CRUD for persisted cash flow scenarios
// Routes : GET    /cash-flow/scenarios
//          POST   /cash-flow/scenarios
//          PUT    /cash-flow/scenarios/:id
//          DELETE /cash-flow/scenarios/:id
// Scope  : ADMIN only
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

export async function registerCashFlowScenarioRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /cash-flow/scenarios ─────────────────────────────────────────────
  app.get("/cash-flow/scenarios", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin only" },
      } as ApiResponse);
    }

    const scenarios = await prisma.cashFlowScenario.findMany({
      where: { workspaceId: "default" },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: scenarios } as ApiResponse<typeof scenarios>;
  });

  // ── POST /cash-flow/scenarios ────────────────────────────────────────────
  app.post("/cash-flow/scenarios", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin only" },
      } as ApiResponse);
    }

    const body = request.body as {
      name: string;
      description?: string;
      adjustments?: unknown[];
      isBaseline?: boolean;
    };

    if (!body?.name?.trim()) {
      return reply.code(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "name is required" },
      } as ApiResponse);
    }

    const scenario = await prisma.cashFlowScenario.create({
      data: {
        name: body.name.trim(),
        description: body.description ?? null,
        adjustments: body.adjustments ?? [],
        isBaseline: body.isBaseline ?? false,
        createdByAdminId: scope.userId ?? null,
      },
    });

    reply.code(201);
    return { success: true, data: scenario } as ApiResponse<typeof scenario>;
  });

  // ── PUT /cash-flow/scenarios/:id ─────────────────────────────────────────
  app.put("/cash-flow/scenarios/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin only" },
      } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      description?: string;
      adjustments?: unknown[];
      isBaseline?: boolean;
    };

    const existing = await prisma.cashFlowScenario.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Scenario not found" },
      } as ApiResponse);
    }

    const updated = await prisma.cashFlowScenario.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        adjustments: body.adjustments !== undefined ? body.adjustments : existing.adjustments,
        isBaseline: body.isBaseline !== undefined ? body.isBaseline : existing.isBaseline,
      },
    });

    return { success: true, data: updated } as ApiResponse<typeof updated>;
  });

  // ── DELETE /cash-flow/scenarios/:id ──────────────────────────────────────
  app.delete("/cash-flow/scenarios/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin only" },
      } as ApiResponse);
    }

    const { id } = request.params as { id: string };

    const existing = await prisma.cashFlowScenario.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Scenario not found" },
      } as ApiResponse);
    }

    await prisma.cashFlowScenario.delete({ where: { id } });

    return { success: true, data: { id } } as ApiResponse<{ id: string }>;
  });
}
