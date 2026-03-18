// ════════════════════════════════════════════════════════════════════════════
// sprints.ts — Project sprint + sprint-task routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN / STAFF full access; CLIENT own-tenant read-only
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerSprintRoutes(app: FastifyInstance): Promise<void> {

  // ── GET Routes ────────────────────────────────────────────────────────────

  /** GET /projects/:projectId/sprints — list sprints for a project */
  app.get("/projects/:projectId/sprints", async (request) => {
    const scope = readScopeHeaders(request);
    const { projectId } = request.params as { projectId: string };
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    try {
      const cacheKey = CacheKeys.sprints(projectId);
      const data = await withCache(cacheKey, 60, () =>
        prisma.projectSprint.findMany({
          where: {
            projectId,
            ...(scopedClientId ? { clientId: scopedClientId } : {})
          },
          orderBy: { startAt: "desc" }
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "SPRINTS_FETCH_FAILED", message: "Unable to fetch sprints." } } as ApiResponse;
    }
  });

  /** GET /projects/:projectId/sprints/:sprintId/tasks — tasks for a sprint */
  app.get("/projects/:projectId/sprints/:sprintId/tasks", async (request) => {
    const scope = readScopeHeaders(request);
    const { sprintId } = request.params as { projectId: string; sprintId: string };

    try {
      const cacheKey = CacheKeys.sprintTasks(sprintId);
      const data = await withCache(cacheKey, 60, () =>
        prisma.projectTask.findMany({
          where: { sprintId },
          orderBy: { createdAt: "asc" }
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "SPRINT_TASKS_FETCH_FAILED", message: "Unable to fetch sprint tasks." } } as ApiResponse;
    }
  });

  // ── POST / PATCH Routes ───────────────────────────────────────────────────

  /** POST /projects/:projectId/sprints — create a sprint */
  app.post("/projects/:projectId/sprints", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot create sprints." } } as ApiResponse;
    }
    const { projectId } = request.params as { projectId: string };
    const body = request.body as {
      clientId: string;
      name: string;
      ownerName?: string;
      startAt?: string;
      endAt?: string;
      status?: string;
    };

    try {
      const sprint = await prisma.projectSprint.create({
        data: {
          projectId,
          clientId: body.clientId,
          name: body.name,
          ownerName: body.ownerName ?? null,
          startAt: body.startAt ? new Date(body.startAt) : null,
          endAt: body.endAt ? new Date(body.endAt) : null,
          status: body.status ?? "ACTIVE"
        }
      });
      await cache.delete(CacheKeys.sprints(projectId));
      reply.status(201);
      return { success: true, data: sprint } as ApiResponse<typeof sprint>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "SPRINT_CREATE_FAILED", message: "Unable to create sprint." } } as ApiResponse;
    }
  });

  // ── Burn-down / velocity ──────────────────────────────────────────────────

  /** GET /sprints/burn-down?projectId=X — burn-down chart data for a sprint */
  app.get("/sprints/burn-down", async (request) => {
    const scope = readScopeHeaders(request);
    const { projectId } = request.query as { projectId?: string };
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    if (!projectId) {
      return { success: false, error: { code: "MISSING_PROJECT_ID", message: "projectId query param is required." } } as ApiResponse;
    }

    try {
      // Fetch the most recent ACTIVE sprint (or COMPLETED) for this project
      const sprint = await prisma.projectSprint.findFirst({
        where: {
          projectId,
          ...(scopedClientId ? { clientId: scopedClientId } : {}),
          status: { in: ["ACTIVE", "COMPLETED"] }
        },
        orderBy: { startAt: "desc" },
        include: { tasks: true }
      });

      // Also fetch last 5 sprints for velocity history
      const allSprints = await prisma.projectSprint.findMany({
        where: {
          projectId,
          ...(scopedClientId ? { clientId: scopedClientId } : {})
        },
        orderBy: { startAt: "desc" },
        take: 5,
        include: { tasks: true }
      });

      if (!sprint) {
        return { success: true, data: null, meta: { requestId: scope.requestId } } as ApiResponse<null>;
      }

      const tasks = sprint.tasks;
      const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints ?? 1), 0);
      const completedPoints = tasks
        .filter((t) => t.status === "DONE")
        .reduce((sum, t) => sum + (t.storyPoints ?? 1), 0);

      // Build daily remaining — walk day by day from start to end (or today)
      const startDate = sprint.startAt ? new Date(sprint.startAt) : new Date();
      const endDate   = sprint.endAt   ? new Date(sprint.endAt)   : new Date(Date.now() + 13 * 86_400_000);
      const today     = new Date();

      const msPerDay = 86_400_000;
      const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1);

      const dailyRemaining: { date: string; remaining: number; ideal: number }[] = [];

      for (let d = 0; d < totalDays; d++) {
        const dayDate = new Date(startDate.getTime() + d * msPerDay);
        const dayLabel = dayDate.toISOString().slice(0, 10);

        // Count tasks completed on or before this day (use updatedAt as proxy for completedAt)
        const completedByDay = tasks
          .filter((t) => t.status === "DONE" && t.updatedAt <= dayDate)
          .reduce((sum, t) => sum + (t.storyPoints ?? 1), 0);

        const remaining = Math.max(0, totalPoints - completedByDay);
        const ideal     = Math.max(0, totalPoints - Math.round((totalPoints / Math.max(totalDays - 1, 1)) * d));

        // Only emit past days and today (don't project future actual)
        if (dayDate <= today) {
          dailyRemaining.push({ date: dayLabel, remaining, ideal });
        } else {
          // For future days only push ideal
          dailyRemaining.push({ date: dayLabel, remaining: -1, ideal });
        }
      }

      // Velocity history — last 5 sprints (planned vs completed)
      const velocityHistory = allSprints.map((s) => ({
        sprintName: s.name,
        planned: s.tasks.length > 0 ? s.tasks.reduce((sum, t) => sum + (t.storyPoints ?? 1), 0) : s.totalTasks,
        completed: s.tasks.filter((t) => t.status === "DONE").reduce((sum, t) => sum + (t.storyPoints ?? 1), 0)
      })).reverse();

      const result = {
        sprintId:         sprint.id,
        sprintName:       sprint.name,
        startDate:        startDate.toISOString(),
        endDate:          endDate.toISOString(),
        totalPoints,
        completedPoints,
        dailyRemaining,
        velocityHistory
      };

      return { success: true, data: result, meta: { requestId: scope.requestId } } as ApiResponse<typeof result>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "BURNDOWN_FETCH_FAILED", message: "Unable to fetch burn-down data." } } as ApiResponse;
    }
  });

  /** PATCH /projects/:projectId/sprints/:sprintId — update sprint or sync metrics */
  app.patch("/projects/:projectId/sprints/:sprintId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Clients cannot update sprints." } } as ApiResponse;
    }
    const { projectId, sprintId } = request.params as { projectId: string; sprintId: string };
    const body = request.body as {
      name?: string;
      ownerName?: string;
      startAt?: string | null;
      endAt?: string | null;
      status?: string;
      progressPercent?: number;
      totalTasks?: number;
      completedTasks?: number;
      overdueTasks?: number;
    };

    try {
      const sprint = await prisma.projectSprint.update({
        where: { id: sprintId, projectId },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.ownerName !== undefined && { ownerName: body.ownerName }),
          ...(body.startAt !== undefined && { startAt: body.startAt ? new Date(body.startAt) : null }),
          ...(body.endAt !== undefined && { endAt: body.endAt ? new Date(body.endAt) : null }),
          ...(body.status !== undefined && { status: body.status }),
          ...(body.progressPercent !== undefined && { progressPercent: body.progressPercent }),
          ...(body.totalTasks !== undefined && { totalTasks: body.totalTasks }),
          ...(body.completedTasks !== undefined && { completedTasks: body.completedTasks }),
          ...(body.overdueTasks !== undefined && { overdueTasks: body.overdueTasks })
        }
      });
      await cache.delete(CacheKeys.sprints(projectId));
      await cache.delete(CacheKeys.sprintTasks(sprintId));
      return { success: true, data: sprint } as ApiResponse<typeof sprint>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "SPRINT_UPDATE_FAILED", message: "Unable to update sprint." } } as ApiResponse;
    }
  });
}
