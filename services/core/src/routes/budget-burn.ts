// ════════════════════════════════════════════════════════════════════════════
// budget-burn.ts — GET /portal/projects/:id/budget-burn
// Returns per-project budget utilisation, weekly burn rate, and projected
// run-out date based on billing-service invoices + core time entries.
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Billing-service response shape (matches billing/routes/invoices.ts) ─────
type BillingInvoiceResponse = {
  id: string;
  clientId: string;
  amountCents: number;
  paidAt: string | null;
  status: string;
};

async function fetchClientInvoices(
  clientId: string,
  headers: { userId?: string; role?: string; clientId?: string; requestId: string; traceId?: string }
): Promise<BillingInvoiceResponse[]> {
  const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
  try {
    const url = `${baseUrl}/invoices`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        "x-user-id":    headers.userId    ?? "",
        "x-user-role":  headers.role      ?? "ADMIN", // fetch all invoices for this client
        "x-client-id":  clientId,
        "x-request-id": headers.requestId,
        "x-trace-id":   headers.traceId   ?? headers.requestId,
      },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      console.warn(`[budget-burn] Billing service returned ${res.status} for client ${clientId}`);
      return [];
    }
    const body = (await res.json()) as ApiResponse<BillingInvoiceResponse[]>;
    return body.success ? (body.data ?? []) : [];
  } catch {
    return [];
  }
}

export async function registerBudgetBurnRoutes(app: FastifyInstance): Promise<void> {
  app.get("/portal/projects/:id/budget-burn", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id: projectId } = request.params as { id: string };
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    // ── 1. Load project (with tenant-scoping for CLIENT role) ────────────────
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...(scopedClientId ? { clientId: scopedClientId } : {}),
      },
      select: {
        id: true,
        name: true,
        budgetCents: true,
        startAt: true,
        dueAt: true,
        clientId: true,
      },
    });

    if (!project) {
      return reply.code(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      } as ApiResponse);
    }

    // ── 2. Fetch all client-level invoices from billing service ──────────────
    // Invoice model has no projectId FK so we aggregate at client level,
    // consistent with the existing BudgetHealth computation on the portal.
    const clientInvoices = await fetchClientInvoices(project.clientId, {
      userId:    scope.userId,
      role:      "ADMIN", // elevate so billing service returns all invoices
      clientId:  project.clientId,
      requestId: scope.requestId ?? "",
      traceId:   scope.requestId ?? "",
    });

    const billedCents = clientInvoices.reduce((sum, inv) => sum + (inv.amountCents ?? 0), 0);
    const paidCents   = clientInvoices
      .filter((i) => i.paidAt !== null)
      .reduce((sum, inv) => sum + (inv.amountCents ?? 0), 0);

    // ── 3. Weekly burn rate from time entries (last 4 weeks) ─────────────────
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 3600_000);
    const recentAgg = await prisma.projectTimeEntry.aggregate({
      where: { projectId, createdAt: { gte: fourWeeksAgo } },
      _sum: { minutes: true },
    });
    const weeklyBurnHours = ((recentAgg._sum.minutes ?? 0) / 60) / 4;

    // ── 4. Compute budget metrics ─────────────────────────────────────────────
    // budgetCents is BigInt — convert to number
    const budgetCents     = Number(project.budgetCents ?? 0);
    const remainingCents  = Math.max(0, budgetCents - billedCents);
    const burnPercent     = budgetCents > 0 ? Math.round((billedCents / budgetCents) * 100) : 0;

    // ── 5. Projected run-out date ─────────────────────────────────────────────
    const allEntries = await prisma.projectTimeEntry.aggregate({
      where: { projectId },
      _sum: { minutes: true },
    });
    const totalHours              = (allEntries._sum.minutes ?? 0) / 60;
    const impliedHourlyRateCents  = totalHours > 0 ? billedCents / totalHours : 0;
    const projectedWeeksRemaining =
      impliedHourlyRateCents > 0 && weeklyBurnHours > 0
        ? Math.ceil(remainingCents / (weeklyBurnHours * impliedHourlyRateCents))
        : null;

    const projectedEndDate =
      projectedWeeksRemaining != null
        ? new Date(Date.now() + projectedWeeksRemaining * 7 * 24 * 3600_000)
            .toISOString()
            .split("T")[0]
        : null;

    // ── 6. Build response ─────────────────────────────────────────────────────
    const result = {
      projectId,
      projectName:      project.name,
      budgetRand:       budgetCents    / 100,
      billedRand:       billedCents    / 100,
      paidRand:         paidCents      / 100,
      remainingRand:    remainingCents / 100,
      burnPercent,
      weeklyBurnHours,
      projectedEndDate,
      dueAt: project.dueAt?.toISOString().split("T")[0] ?? null,
    };

    return {
      success: true,
      data: result,
      meta: { requestId: scope.requestId },
    } as ApiResponse<typeof result>;
  });
}
