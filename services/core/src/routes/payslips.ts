// ════════════════════════════════════════════════════════════════════════════
// payslips.ts — Staff Payslip routes
// Service : core  |  Cache TTL: 300 s (GET), invalidate on write
// Scope   : ADMIN full access; STAFF read-own only; CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerPayslipRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /staff/:staffId/payslips ───────────────────────────────────────────
  app.get("/staff/:staffId/payslips", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const { staffId } = request.params as { staffId: string };

    // STAFF can only read their own payslips
    if (scope.role === "STAFF") {
      const ownProfile = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
      if (!ownProfile || ownProfile.id !== staffId) {
        return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
      }
    }

    const data = await withCache(CacheKeys.payslips(staffId), 300, () =>
      prisma.staffPayslip.findMany({
        where: { staffId },
        orderBy: { periodStart: "desc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /payslips/me ───────────────────────────────────────────────────────
  app.get("/payslips/me", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const ownProfile = await prisma.staffProfile.findFirst({ where: { userId: scope.userId } });
    if (!ownProfile) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Staff profile not found for this user." } } as ApiResponse);
    }

    const data = await withCache(CacheKeys.payslips(ownProfile.id), 300, () =>
      prisma.staffPayslip.findMany({
        where: { staffId: ownProfile.id },
        orderBy: { periodStart: "desc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── POST /staff/:staffId/payslips — ADMIN only ─────────────────────────────
  app.post("/staff/:staffId/payslips", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only admins can create payslips." } } as ApiResponse);
    }

    const { staffId } = request.params as { staffId: string };
    const body = request.body as {
      period: string;
      periodStart: string;
      periodEnd: string;
      grossPayCents: number;
      taxCents: number;
      uifCents: number;
      medicalCents?: number;
      totalDeductionsCents: number;
      netPayCents: number;
      status?: string;
      paidAt?: string;
    };

    const payslip = await prisma.staffPayslip.create({
      data: {
        staffId,
        period:               body.period,
        periodStart:          new Date(body.periodStart),
        periodEnd:            new Date(body.periodEnd),
        grossPayCents:        body.grossPayCents,
        taxCents:             body.taxCents,
        uifCents:             body.uifCents,
        medicalCents:         body.medicalCents         ?? 0,
        totalDeductionsCents: body.totalDeductionsCents,
        netPayCents:          body.netPayCents,
        status:               body.status               ?? "DRAFT",
        paidAt:               body.paidAt               ? new Date(body.paidAt) : null,
      }
    });

    await cache.delete(CacheKeys.payslips(staffId));

    return reply.code(201).send({ success: true, data: payslip, meta: { requestId: scope.requestId } } as ApiResponse<typeof payslip>);
  });
}
