// ════════════════════════════════════════════════════════════════════════════
// compliance.ts — Compliance Record routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN only
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { Prisma } from "@prisma/client";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Cache invalidation helper ─────────────────────────────────────────────────
async function invalidateComplianceCache(): Promise<void> {
  await cache.delete(CacheKeys.compliance());
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerComplianceRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /compliance — list all compliance records (ADMIN only) ────────────
  app.get("/compliance", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can view compliance records." } } as ApiResponse;
    }

    try {
      const data = await withCache(CacheKeys.compliance(), 60, () =>
        prisma.complianceRecord.findMany({ orderBy: { area: "asc" } })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "COMPLIANCE_FETCH_FAILED", message: "Unable to fetch compliance records." } } as ApiResponse;
    }
  });

  // ── PATCH /compliance/:id — update a compliance record (ADMIN only) ───────
  app.patch("/compliance/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can update compliance records." } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as {
      status?:    string;
      riskLevel?: string;
      notes?:     string;
      lastAudit?: string;
      nextAudit?: string;
    };

    let lastAuditDate: Date | undefined;
    if (body.lastAudit !== undefined) {
      const d = new Date(body.lastAudit);
      if (isNaN(d.getTime())) {
        return reply.status(400).send({ error: "INVALID_DATE_FORMAT_lastAudit" });
      }
      lastAuditDate = d;
    }

    let nextAuditDate: Date | undefined;
    if (body.nextAudit !== undefined) {
      const d = new Date(body.nextAudit);
      if (isNaN(d.getTime())) {
        return reply.status(400).send({ error: "INVALID_DATE_FORMAT_nextAudit" });
      }
      nextAuditDate = d;
    }

    try {
      const record = await prisma.complianceRecord.update({
        where: { id },
        data: {
          ...(body.status    !== undefined && { status:    body.status }),
          ...(body.riskLevel !== undefined && { riskLevel: body.riskLevel }),
          ...(body.notes     !== undefined && { notes:     body.notes }),
          ...(lastAuditDate  !== undefined && { lastAudit: lastAuditDate }),
          ...(nextAuditDate  !== undefined && { nextAudit: nextAuditDate }),
        }
      });
      await invalidateComplianceCache();
      return { success: true, data: record } as ApiResponse<typeof record>;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return reply.status(404).send({ error: "COMPLIANCE_RECORD_NOT_FOUND" });
      }
      request.log.error(error);
      return { success: false, error: { code: "COMPLIANCE_UPDATE_FAILED", message: "Unable to update compliance record." } } as ApiResponse;
    }
  });
}
