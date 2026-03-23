// ════════════════════════════════════════════════════════════════════════════
// churn-risk.ts — GET /clients/:id/churn-risk
// Computes a 0-100 predictive churn risk score from:
//   1. ClientHealthScore (latest)
//   2. SatisfactionSurvey NPS (last 3 completed)
//   3. Overdue invoices > 14 days (billing service, non-fatal)
// Access: ADMIN / STAFF only
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

export async function registerChurnRiskRoutes(app: FastifyInstance): Promise<void> {
  app.get("/clients/:id/churn-risk", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin or Staff only" },
      } as ApiResponse);
    }

    const { id: clientId } = request.params as { id: string };

    // ── 1. Parallel DB queries ─────────────────────────────────────────────
    const [healthScore, surveys] = await Promise.all([
      prisma.clientHealthScore.findFirst({
        where: { clientId },
        orderBy: { recordedAt: "desc" },
      }),
      prisma.satisfactionSurvey.findMany({
        where: { clientId, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { npsScore: true },
      }),
    ]);

    // ── 2. Fetch overdue invoices from billing service (non-fatal) ─────────
    let overdueCount = 0;
    try {
      const billingUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
      const res = await fetch(`${billingUrl}/invoices`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
          "x-user-id":    scope.userId    ?? "system",
          "x-user-role":  "ADMIN",
          "x-client-id":  clientId,
          "x-request-id": scope.requestId ?? "",
          "x-trace-id":   scope.requestId ?? "",
        },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const body = (await res.json()) as ApiResponse<Array<{ dueAt: string | null; status: string }>>;
        if (body.success && body.data) {
          const cutoff = Date.now() - 14 * 86_400_000;
          overdueCount = body.data.filter(
            (inv) =>
              inv.status === "OVERDUE" &&
              inv.dueAt &&
              new Date(inv.dueAt).getTime() < cutoff
          ).length;
        }
      }
    } catch {
      // Non-fatal — skip invoice signal if billing service is unavailable
    }

    // ── 3. Score computation ───────────────────────────────────────────────
    const signals: string[] = [];
    let riskScore = 0;

    // Signal 1: Health score (max 35 pts)
    const hs = healthScore?.score ?? 50;
    if (hs < 40) {
      riskScore += 35;
      signals.push(`Low health score: ${hs}`);
    } else if (hs < 60) {
      riskScore += 15;
      signals.push(`Moderate health score: ${hs}`);
    }

    // Signal 2: NPS average (max 30 pts)
    const nonNullSurveys = surveys.filter((sv) => sv.npsScore != null);
    const avgNps = nonNullSurveys.length > 0
      ? nonNullSurveys.reduce((s, sv) => s + sv.npsScore!, 0) / nonNullSurveys.length
      : null;
    if (avgNps !== null && avgNps < 7) {
      riskScore += 30;
      signals.push(`Low NPS: ${avgNps.toFixed(1)}`);
    }

    // Signal 3: Overdue invoices > 14 days (max 35 pts)
    if (overdueCount > 0) {
      riskScore += 35;
      signals.push(`${overdueCount} invoice(s) overdue > 14 days`);
    }

    const churnRisk = Math.min(100, riskScore);
    const level: "HIGH" | "MEDIUM" | "LOW" =
      churnRisk >= 70 ? "HIGH" : churnRisk >= 40 ? "MEDIUM" : "LOW";

    const result = { clientId, churnRisk, level, signals, healthScore: hs, avgNps };

    return {
      success: true,
      data: result,
      meta: { requestId: scope.requestId },
    } as ApiResponse<typeof result>;
  });
}
