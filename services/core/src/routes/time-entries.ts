import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { createTimeEntrySchema, getTimeEntryQuerySchema } from "@maphari/contracts";
import { randomUUID } from "node:crypto";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { prisma } from "../lib/prisma.js";

/** Returns the ISO week string for a date, e.g. "2026-W12" */
function getIsoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function registerTimeEntryRoutes(app: FastifyInstance): Promise<void> {
  app.get("/time-entries", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = getTimeEntryQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid time entry query", details: parsed.error.flatten() }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId);
    try {
      const entries = await prisma.projectTimeEntry.findMany({
        where: {
          ...(clientId ? { clientId } : {}),
          ...(parsed.data.projectId ? { projectId: parsed.data.projectId } : {}),
          ...(parsed.data.from || parsed.data.to
            ? {
                createdAt: {
                  ...(parsed.data.from ? { gte: new Date(parsed.data.from) } : {}),
                  ...(parsed.data.to ? { lte: new Date(parsed.data.to) } : {})
                }
              }
            : {})
        },
        orderBy: { createdAt: "desc" },
        take: parsed.data.limit ?? 200
      });
      return { success: true, data: entries, meta: { requestId: scope.requestId } } as ApiResponse<typeof entries>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TIME_ENTRIES_FETCH_FAILED", message: "Unable to load time entries" } } as ApiResponse;
    }
  });

  app.post("/time-entries", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsed = createTimeEntrySchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid time entry payload", details: parsed.error.flatten() }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId);
    if (!clientId) {
      reply.status(400);
      return { success: false, error: { code: "CLIENT_SCOPE_REQUIRED", message: "Client scope required" } } as ApiResponse;
    }

    try {
      const entryDate = parsed.data.startedAt ? new Date(parsed.data.startedAt) : new Date();
      const submittedWeek = getIsoWeek(entryDate);
      const entry = await prisma.projectTimeEntry.create({
        data: {
          id: randomUUID(),
          projectId: parsed.data.projectId,
          clientId,
          staffUserId: scope.userId ?? null,
          staffName: parsed.data.staffName ?? null,
          taskLabel: parsed.data.taskLabel,
          minutes: parsed.data.minutes,
          startedAt: parsed.data.startedAt ? new Date(parsed.data.startedAt) : null,
          endedAt: parsed.data.endedAt ? new Date(parsed.data.endedAt) : null,
          status: "DRAFT",
          submittedWeek,
        }
      });
      return { success: true, data: entry, meta: { requestId: scope.requestId } } as ApiResponse<typeof entry>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TIME_ENTRY_CREATE_FAILED", message: "Unable to create time entry" } } as ApiResponse;
    }
  });

  // ── PATCH /time-entries/submit-week ──────────────────────────────────────────
  // Staff submits all DRAFT entries for a given ISO week (e.g. "2026-W12").
  app.patch("/time-entries/submit-week", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      reply.status(401);
      return { success: false, error: { code: "UNAUTHORIZED", message: "User identity required" } } as ApiResponse;
    }
    const body = (request.body ?? {}) as { week?: string };
    if (!body.week || !/^\d{4}-W\d{2}$/.test(body.week)) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid week format. Expected YYYY-Www (e.g. 2026-W12)" } } as ApiResponse;
    }
    try {
      const now = new Date();
      const result = await prisma.projectTimeEntry.updateMany({
        where: {
          staffUserId: scope.userId,
          submittedWeek: body.week,
          status: "DRAFT",
        },
        data: {
          status: "SUBMITTED",
          submittedAt: now,
        },
      });
      return { success: true, data: { count: result.count }, meta: { requestId: scope.requestId } } as ApiResponse<{ count: number }>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TIMESHEET_SUBMIT_FAILED", message: "Unable to submit timesheet" } } as ApiResponse;
    }
  });

  // ── GET /time-entries/pending ─────────────────────────────────────────────
  // Admin only — returns all SUBMITTED entries across all staff.
  app.get("/time-entries/pending", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }
    try {
      const entries = await prisma.projectTimeEntry.findMany({
        where: { status: "SUBMITTED" },
        orderBy: { submittedAt: "asc" },
      });
      return { success: true, data: entries, meta: { requestId: scope.requestId } } as ApiResponse<typeof entries>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "PENDING_TIMESHEETS_FETCH_FAILED", message: "Unable to load pending timesheets" } } as ApiResponse;
    }
  });

  // ── PATCH /time-entries/:id/approve ──────────────────────────────────────
  // Admin only — approve a submitted time entry.
  app.patch<{ Params: { id: string } }>("/time-entries/:id/approve", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }
    const { id } = request.params;
    try {
      const existing = await prisma.projectTimeEntry.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Time entry not found" } } as ApiResponse;
      }
      if (existing.status !== "SUBMITTED") {
        reply.status(400);
        return { success: false, error: { code: "INVALID_STATUS", message: "Only SUBMITTED entries can be approved" } } as ApiResponse;
      }
      const updated = await prisma.projectTimeEntry.update({
        where: { id },
        data: { status: "APPROVED" },
      });
      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TIMESHEET_APPROVE_FAILED", message: "Unable to approve time entry" } } as ApiResponse;
    }
  });

  // ── PATCH /time-entries/:id/reject ───────────────────────────────────────
  // Admin only — reject a submitted time entry, optional reason.
  app.patch<{ Params: { id: string } }>("/time-entries/:id/reject", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } } as ApiResponse;
    }
    const { id } = request.params;
    const body = (request.body ?? {}) as { reason?: string };
    try {
      const existing = await prisma.projectTimeEntry.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Time entry not found" } } as ApiResponse;
      }
      if (existing.status !== "SUBMITTED") {
        reply.status(400);
        return { success: false, error: { code: "INVALID_STATUS", message: "Only SUBMITTED entries can be rejected" } } as ApiResponse;
      }
      const updated = await prisma.projectTimeEntry.update({
        where: { id },
        data: { status: "REJECTED" },
      });
      void body.reason; // reason stored on rejection acknowledged; future: add notes field
      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TIMESHEET_REJECT_FAILED", message: "Unable to reject time entry" } } as ApiResponse;
    }
  });

  // ── PATCH /time-entries/:id/stop ─────────────────────────────────────────────
  app.patch<{ Params: { id: string } }>("/time-entries/:id/stop", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params;
    const body = (request.body ?? {}) as { taskLabel?: string };

    try {
      const existing = await prisma.projectTimeEntry.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Time entry not found" } } as ApiResponse;
      }

      const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
      if (scopedClientId && existing.clientId !== scopedClientId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "Access denied" } } as ApiResponse;
      }

      const now = new Date();
      const startedAt = existing.startedAt ?? existing.createdAt;
      const elapsedMinutes = Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 60_000));

      const updated = await prisma.projectTimeEntry.update({
        where: { id },
        data: {
          endedAt: now,
          minutes: elapsedMinutes,
          ...(body.taskLabel ? { taskLabel: body.taskLabel } : {})
        }
      });

      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "TIME_ENTRY_STOP_FAILED", message: "Unable to stop time entry" } } as ApiResponse;
    }
  });
}
