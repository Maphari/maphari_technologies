// ════════════════════════════════════════════════════════════════════════════
// automation-metrics.ts — Workflow execution metric recording and aggregation
// Routes : GET  /automation/metrics   (ADMIN/STAFF — success rates per workflow)
//          POST /automation/metrics   (ADMIN/STAFF — record a job result)
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

export interface WorkflowMetric {
  workflowId: string;
  totalRuns: number;
  successCount: number;
  successRate: number;
}

export async function registerAutomationMetricRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /automation/metrics ─────────────────────────────────────────────
  app.get("/automation/metrics", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin or Staff only" },
      } as ApiResponse);
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const metrics = await prisma.automationJobMetric.findMany({
      where: { runAt: { gte: since } },
      select: { workflowId: true, success: true },
    });

    const grouped: Record<string, { total: number; success: number }> = {};
    for (const m of metrics) {
      if (!grouped[m.workflowId]) grouped[m.workflowId] = { total: 0, success: 0 };
      grouped[m.workflowId]!.total++;
      if (m.success) grouped[m.workflowId]!.success++;
    }

    const result: WorkflowMetric[] = Object.entries(grouped).map(([workflowId, { total, success }]) => ({
      workflowId,
      totalRuns: total,
      successCount: success,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
    }));

    return { success: true, data: result } as ApiResponse<WorkflowMetric[]>;
  });

  // ── POST /automation/metrics ────────────────────────────────────────────
  app.post("/automation/metrics", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin or Staff only" },
      } as ApiResponse);
    }

    const body = request.body as {
      workflowId: string;
      workspaceId?: string;
      success: boolean;
      durationMs?: number;
      errorMessage?: string;
      triggeredBy?: string;
    };

    if (!body?.workflowId || typeof body.success !== "boolean") {
      return reply.code(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "workflowId and success are required" },
      } as ApiResponse);
    }

    const metric = await prisma.automationJobMetric.create({
      data: {
        workflowId: body.workflowId,
        workspaceId: body.workspaceId ?? "default",
        success: body.success,
        durationMs: body.durationMs ?? null,
        errorMessage: body.errorMessage ?? null,
        triggeredBy: body.triggeredBy ?? null,
      },
    });

    return { success: true, data: metric } as ApiResponse<typeof metric>;
  });
}
