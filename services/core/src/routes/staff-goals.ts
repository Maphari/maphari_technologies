// ════════════════════════════════════════════════════════════════════════════
// staff-goals.ts — Staff OKR / Personal Goal routes
// Service : core  |  Cache TTL: none (personal, real-time read)
// Scope   : STAFF + ADMIN only; staff may only read/write their OWN goals
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const VALID_STATUSES = ["ACTIVE", "ACHIEVED", "CANCELLED"] as const;
type GoalStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(s: unknown): s is GoalStatus {
  return VALID_STATUSES.includes(s as GoalStatus);
}

function clampProgress(n: unknown): number {
  const parsed = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerStaffGoalRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /staff-goals — list goals for authenticated staff user ────────────
  app.get("/staff-goals", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "STAFF" && scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff can view goals." } } as ApiResponse;
    }
    if (!scope.userId) {
      reply.status(400);
      return { success: false, error: { code: "MISSING_USER_ID", message: "User ID is required." } } as ApiResponse;
    }

    const query = request.query as { quarter?: string };

    try {
      const goals = await prisma.staffGoal.findMany({
        where: {
          staffUserId: scope.userId,
          ...(query.quarter ? { quarter: query.quarter } : {}),
          status: { not: "CANCELLED" }
        },
        orderBy: [{ status: "asc" }, { targetDate: "asc" }]
      });

      return { success: true, data: goals, meta: { requestId: scope.requestId } } as ApiResponse<typeof goals>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "GOALS_FETCH_FAILED", message: "Unable to fetch goals." } } as ApiResponse;
    }
  });

  // ── POST /staff-goals — create a goal ────────────────────────────────────
  app.post("/staff-goals", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "STAFF" && scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff can create goals." } } as ApiResponse;
    }
    if (!scope.userId) {
      reply.status(400);
      return { success: false, error: { code: "MISSING_USER_ID", message: "User ID is required." } } as ApiResponse;
    }

    const body = request.body as {
      title?: unknown;
      description?: unknown;
      targetDate?: unknown;
      quarter?: unknown;
      progress?: unknown;
    };

    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Goal title is required." } } as ApiResponse;
    }
    if (!body.targetDate || typeof body.targetDate !== "string") {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Target date is required." } } as ApiResponse;
    }
    if (!body.quarter || typeof body.quarter !== "string" || body.quarter.trim().length === 0) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Quarter is required (e.g. Q1-2026)." } } as ApiResponse;
    }

    const targetDate = new Date(body.targetDate as string);
    if (Number.isNaN(targetDate.getTime())) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid target date." } } as ApiResponse;
    }

    try {
      const goal = await prisma.staffGoal.create({
        data: {
          staffUserId: scope.userId,
          title: (body.title as string).trim(),
          description: typeof body.description === "string" ? body.description.trim() || null : null,
          targetDate,
          quarter: (body.quarter as string).trim(),
          progress: clampProgress(body.progress ?? 0),
          status: "ACTIVE"
        }
      });

      reply.status(201);
      return { success: true, data: goal, meta: { requestId: scope.requestId } } as ApiResponse<typeof goal>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "GOAL_CREATE_FAILED", message: "Unable to create goal." } } as ApiResponse;
    }
  });

  // ── PATCH /staff-goals/:id — update progress, status, title ──────────────
  app.patch("/staff-goals/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "STAFF" && scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff can update goals." } } as ApiResponse;
    }
    if (!scope.userId) {
      reply.status(400);
      return { success: false, error: { code: "MISSING_USER_ID", message: "User ID is required." } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as {
      title?: unknown;
      description?: unknown;
      progress?: unknown;
      status?: unknown;
      targetDate?: unknown;
      quarter?: unknown;
    };

    try {
      const existing = await prisma.staffGoal.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "GOAL_NOT_FOUND", message: "Goal not found." } } as ApiResponse;
      }
      if (existing.staffUserId !== scope.userId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "You can only update your own goals." } } as ApiResponse;
      }

      const patch: Record<string, unknown> = {};
      if (typeof body.title === "string" && body.title.trim().length > 0) {
        patch.title = body.title.trim();
      }
      if (typeof body.description === "string") {
        patch.description = body.description.trim() || null;
      }
      if (body.progress !== undefined) {
        patch.progress = clampProgress(body.progress);
      }
      if (body.status !== undefined && isValidStatus(body.status)) {
        patch.status = body.status;
      }
      if (typeof body.targetDate === "string") {
        const d = new Date(body.targetDate);
        if (!Number.isNaN(d.getTime())) patch.targetDate = d;
      }
      if (typeof body.quarter === "string" && body.quarter.trim().length > 0) {
        patch.quarter = body.quarter.trim();
      }

      const updated = await prisma.staffGoal.update({ where: { id }, data: patch });
      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "GOAL_UPDATE_FAILED", message: "Unable to update goal." } } as ApiResponse;
    }
  });

  // ── DELETE /staff-goals/:id — soft-delete by setting status to CANCELLED ──
  app.delete("/staff-goals/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "STAFF" && scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Only staff can cancel goals." } } as ApiResponse;
    }
    if (!scope.userId) {
      reply.status(400);
      return { success: false, error: { code: "MISSING_USER_ID", message: "User ID is required." } } as ApiResponse;
    }

    const { id } = request.params as { id: string };

    try {
      const existing = await prisma.staffGoal.findUnique({ where: { id } });
      if (!existing) {
        reply.status(404);
        return { success: false, error: { code: "GOAL_NOT_FOUND", message: "Goal not found." } } as ApiResponse;
      }
      if (existing.staffUserId !== scope.userId) {
        reply.status(403);
        return { success: false, error: { code: "FORBIDDEN", message: "You can only cancel your own goals." } } as ApiResponse;
      }

      await prisma.staffGoal.update({ where: { id }, data: { status: "CANCELLED" } });
      return { success: true, data: null, meta: { requestId: scope.requestId } } as ApiResponse<null>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "GOAL_DELETE_FAILED", message: "Unable to cancel goal." } } as ApiResponse;
    }
  });
}
