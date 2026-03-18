// ════════════════════════════════════════════════════════════════════════════
// closeout-reports.ts — Project close-out report routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN + STAFF submit; ADMIN approve; CLIENT forbidden
//
// Endpoints:
//   GET    /admin/closeout-reports         → list all (ADMIN/STAFF)
//   POST   /admin/closeout-reports         → submit new report (ADMIN/STAFF)
//   PATCH  /admin/closeout-reports/:id     → approve / request changes (ADMIN)
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── DTO ───────────────────────────────────────────────────────────────────────

type CloseoutReportDto = {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  submittedBy: string;
  status: string;
  budgetVarianceCents: number;
  budgetVariance: string;   // formatted string e.g. "+R 5,000" or "-R 2,000"
  lessonsCount: number;
  lessonsLearned: string[];
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatVariance(cents: bigint): string {
  const amount = Number(cents);
  const abs = Math.abs(amount) / 100;
  const formatted = abs.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount >= 0 ? `+R ${formatted}` : `-R ${formatted}`;
}

function parseLessons(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String);
    return [];
  } catch {
    return [];
  }
}

import type { ProjectCloseoutReport } from "../generated/prisma/index.js";

function toDto(r: ProjectCloseoutReport): CloseoutReportDto {
  return {
    id:                  r.id,
    projectId:           r.projectId,
    projectName:         r.projectName,
    clientName:          r.clientName,
    submittedBy:         r.submittedBy,
    status:              r.status,
    budgetVarianceCents: Number(r.budgetVarianceCents),
    budgetVariance:      formatVariance(r.budgetVarianceCents),
    lessonsCount:        r.lessonsCount,
    lessonsLearned:      parseLessons(r.lessonsLearned),
    notes:               r.notes,
    approvedBy:          r.approvedBy,
    approvedAt:          r.approvedAt?.toISOString() ?? null,
    createdAt:           r.createdAt.toISOString(),
    updatedAt:           r.updatedAt.toISOString(),
  };
}

// ── Route registration ────────────────────────────────────────────────────────

export async function registerCloseoutReportRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /admin/closeout-reports ─────────────────────────────────────────────
  app.get("/admin/closeout-reports", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients." } } as ApiResponse;
    }

    const query = request.query as { status?: string; projectId?: string };

    try {
      const data = await withCache(CacheKeys.closeoutReports("admin"), 60, () =>
        prisma.projectCloseoutReport.findMany({
          where: {
            ...(query.status    ? { status:    query.status    } : {}),
            ...(query.projectId ? { projectId: query.projectId } : {}),
          },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        }).then((rows) => rows.map(toDto))
      );

      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<CloseoutReportDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CLOSEOUT_FETCH_FAILED", message: "Unable to fetch close-out reports." } } as ApiResponse;
    }
  });

  // ── POST /admin/closeout-reports ────────────────────────────────────────────
  app.post("/admin/closeout-reports", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Not available for clients." } } as ApiResponse;
    }

    const body = request.body as {
      projectId: string;
      projectName: string;
      clientName: string;
      submittedBy?: string;
      budgetVarianceCents?: number;
      lessonsLearned?: string[];
      notes?: string;
    };

    if (!body.projectId || !body.projectName || !body.clientName) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "projectId, projectName, and clientName are required." } } as ApiResponse;
    }

    // Ensure project exists
    const project = await prisma.project.findUnique({ where: { id: body.projectId } });
    if (!project) {
      reply.status(404);
      return { success: false, error: { code: "NOT_FOUND", message: "Project not found." } } as ApiResponse;
    }

    const lessons = body.lessonsLearned ?? [];

    try {
      const report = await prisma.projectCloseoutReport.create({
        data: {
          projectId:           body.projectId,
          projectName:         body.projectName,
          clientName:          body.clientName,
          submittedBy:         body.submittedBy ?? scope.userId ?? "Unknown",
          budgetVarianceCents: BigInt(body.budgetVarianceCents ?? 0),
          lessonsLearned:      JSON.stringify(lessons),
          lessonsCount:        lessons.length,
          notes:               body.notes ?? null,
          status:              "PENDING_REVIEW",
        },
      });

      await cache.delete(CacheKeys.closeoutReports("admin"));

      reply.status(201);
      return { success: true, data: toDto(report), meta: { requestId: scope.requestId } } as ApiResponse<CloseoutReportDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CLOSEOUT_CREATE_FAILED", message: "Unable to submit close-out report." } } as ApiResponse;
    }
  });

  // ── PATCH /admin/closeout-reports/:id ───────────────────────────────────────
  app.patch("/admin/closeout-reports/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only admins can approve close-out reports." } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as {
      status?: "PENDING_REVIEW" | "APPROVED" | "CHANGES_REQUESTED";
      notes?: string;
    };

    try {
      const existing = await prisma.projectCloseoutReport.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Close-out report not found." } } as ApiResponse;
      }

      const updateData: Record<string, unknown> = {};
      if (body.status !== undefined) {
        updateData.status = body.status;
        if (body.status === "APPROVED") {
          updateData.approvedBy = scope.userId ?? "Unknown";
          updateData.approvedAt = new Date();
        }
      }
      if (body.notes !== undefined) updateData.notes = body.notes;

      const updated = await prisma.projectCloseoutReport.update({ where: { id }, data: updateData });
      await cache.delete(CacheKeys.closeoutReports("admin"));

      return { success: true, data: toDto(updated), meta: { requestId: scope.requestId } } as ApiResponse<CloseoutReportDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CLOSEOUT_UPDATE_FAILED", message: "Unable to update close-out report." } } as ApiResponse;
    }
  });
}
