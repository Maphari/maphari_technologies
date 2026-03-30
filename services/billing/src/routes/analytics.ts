// ════════════════════════════════════════════════════════════════════════════
// analytics.ts — Billing analytics routes
// Routes : GET /analytics/clv        (ADMIN only — CLV + churn risk per client)
//          GET /analytics/mrr-history (ADMIN only — monthly revenue last N months)
// ════════════════════════════════════════════════════════════════════════════

import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

export interface ClientCLVRow {
  clientId: string;
  clv: number;
  avgMonthly: number;
  engagementMonths: number;
  churnRisk: number;
  missedInvoices: number;
  totalInvoices: number;
  daysSinceLastActivity: number;
}

export async function registerBillingAnalyticsRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /analytics/clv ───────────────────────────────────────────────────
  app.get("/analytics/clv", async (request, reply) => {
    const scope = readScopeHeaders(request);

    if (scope.role !== "ADMIN") {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Admin access required" }
      } as ApiResponse;
    }

    try {
      // Fetch all invoices grouped by client
      const invoices = await prisma.invoice.findMany({
        select: {
          clientId: true,
          amountCents: true,
          status: true,
          issuedAt: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: "asc" }
      });

      // Group by client
      const byClient = new Map<string, typeof invoices>();
      for (const inv of invoices) {
        const existing = byClient.get(inv.clientId) ?? [];
        existing.push(inv);
        byClient.set(inv.clientId, existing);
      }

      const now = Date.now();
      const MS_PER_DAY = 24 * 60 * 60 * 1000;
      const MS_PER_MONTH = 30 * MS_PER_DAY;

      const rows: ClientCLVRow[] = [];

      for (const [clientId, clientInvoices] of byClient.entries()) {
        if (clientInvoices.length === 0) continue;

        const totalInvoices = clientInvoices.length;
        const missedInvoices = clientInvoices.filter((inv) => inv.status === "OVERDUE").length;

        // Total invoice value in cents
        const totalAmountCents = clientInvoices.reduce((sum, inv) => sum + Number(inv.amountCents), 0);

        // Engagement months: from first invoice to now (or last invoice)
        const firstAt = clientInvoices[0].createdAt.getTime();
        const lastActivity = clientInvoices.reduce((latest, inv) => {
          const t = inv.updatedAt.getTime();
          return t > latest ? t : latest;
        }, firstAt);

        const engagementMonths = Math.max(1, Math.round((lastActivity - firstAt) / MS_PER_MONTH));

        // Average monthly invoice value (in whole currency units, cents / 100)
        const avgMonthly = Math.round(totalAmountCents / engagementMonths / 100);

        // CLV = avgMonthly * 12 (projected annual value)
        const clv = avgMonthly * 12;

        // Missed invoice ratio
        const missedInvoiceRatio = totalInvoices > 0 ? missedInvoices / totalInvoices : 0;

        // Days since last activity
        const daysSinceLastActivity = Math.round((now - lastActivity) / MS_PER_DAY);

        // Churn risk score: 0.0 to 1.0
        const churnRisk = Math.min(
          1,
          missedInvoiceRatio * 0.4 + Math.min(daysSinceLastActivity / 90, 1) * 0.6
        );

        rows.push({
          clientId,
          clv,
          avgMonthly,
          engagementMonths,
          churnRisk: Math.round(churnRisk * 1000) / 1000,
          missedInvoices,
          totalInvoices,
          daysSinceLastActivity
        });
      }

      // Sort by churn risk descending
      rows.sort((a, b) => b.churnRisk - a.churnRisk);

      return {
        success: true,
        data: rows,
        meta: { requestId: scope.requestId }
      } as ApiResponse<ClientCLVRow[]>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "CLV_FETCH_FAILED", message: "Unable to compute CLV analytics" }
      } as ApiResponse;
    }
  });

  // ── GET /analytics/mrr-history ────────────────────────────────────────────
  app.get("/analytics/mrr-history", async (request, reply) => {
    const scope = readScopeHeaders(request);

    if (scope.role !== "ADMIN") {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Admin access required" }
      } as ApiResponse;
    }

    const query = request.query as Record<string, string | undefined>;
    const months = Math.min(24, Math.max(1, parseInt(query.months ?? "6") || 6));

    try {
      const results: { month: string; total: number }[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const start = new Date();
        start.setDate(1);
        start.setMonth(start.getMonth() - i);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        // Sum all paid invoices where paidAt falls within this month
        const invoices = await prisma.invoice.findMany({
          where: {
            status: "PAID",
            paidAt: { gte: start, lt: end },
          },
          select: { amountCents: true },
        });

        const total = invoices.reduce((sum, inv) => sum + Number(inv.amountCents), 0);
        results.push({ month: start.toISOString().slice(0, 7), total });
      }

      return { success: true, data: results } as ApiResponse<typeof results>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "MRR_HISTORY_FAILED", message: "Unable to load MRR history" }
      } as ApiResponse;
    }
  });
}
