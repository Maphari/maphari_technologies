// ════════════════════════════════════════════════════════════════════════════
// staff-analytics.ts — Staff analytics, capacity, health & approval routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN full access; STAFF own-data (analytics/capacity) or all
//           CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { withCache, cache } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfLastMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

function endOfLastMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999);
}

function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function weekLabel(d: Date): string {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `W${weekNum}`;
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerStaffAnalyticsRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /staff/health-scores ─────────────────────────────────────────────
  /** Returns the latest health score for every client (STAFF / ADMIN only) */
  app.get("/staff/health-scores", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Clients cannot view health scores." }
      } as ApiResponse);
    }

    try {
      const cacheKey = `staff:health-scores:all`;
      const data = await withCache(cacheKey, 60, async () => {
        // Get all clients
        const clients = await prisma.client.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" }
        });

        // For each client, get the latest health score + latest project + health signals
        const results = await Promise.all(
          clients.map(async (client) => {
            const [latestScore, signals, latestProject] = await Promise.all([
              prisma.clientHealthScore.findFirst({
                where: { clientId: client.id },
                orderBy: { recordedAt: "desc" }
              }),
              prisma.clientHealthSignal.findMany({
                where: { clientId: client.id },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { type: true, text: true }
              }),
              prisma.project.findFirst({
                where: { clientId: client.id, status: { not: "ARCHIVED" } },
                orderBy: { createdAt: "desc" },
                select: { name: true }
              })
            ]);

            const initials = client.name
              .split(" ")
              .map((w) => w[0] ?? "")
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return {
              id:                client.id,
              name:              client.name,
              avatar:            initials,
              project:           latestProject?.name ?? "No active project",
              score:             latestScore?.score ?? 0,
              trend:             (latestScore?.trend ?? "STABLE").toLowerCase() as "up" | "down" | "stable",
              trendVal:          latestScore?.trendValue != null
                                   ? (latestScore.trendValue > 0 ? `+${latestScore.trendValue}` : String(latestScore.trendValue))
                                   : "0",
              sentiment:         (latestScore?.sentiment ?? "neutral").toLowerCase() as "positive" | "neutral" | "at_risk",
              lastTouched:       latestScore?.lastTouched
                                   ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                                       Math.round((latestScore.lastTouched.getTime() - Date.now()) / 86400000),
                                       "day"
                                     )
                                   : "No contact",
              overdueTasks:      latestScore?.overdueTasks ?? 0,
              unreadMessages:    latestScore?.unreadMessages ?? 0,
              milestoneDelay:    latestScore?.milestoneDelayDays ?? 0,
              retainerBurn:      latestScore?.retainerBurnPct ?? 0,
              invoiceStatus:     ((latestScore?.invoiceStatus ?? "PENDING").toLowerCase()) as "paid" | "pending" | "overdue",
              signals:           signals.map((s) => ({
                                   type: (s.type.toLowerCase()) as "positive" | "neutral" | "negative",
                                   text: s.text
                                 }))
            };
          })
        );

        return results;
      });

      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "HEALTH_SCORES_FETCH_FAILED", message: "Unable to fetch health scores." }
      } as ApiResponse;
    }
  });

  // ── GET /staff/me/analytics ──────────────────────────────────────────────
  /** Personal analytics derived from time entries + task completions */
  app.get("/staff/me/analytics", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied." }
      } as ApiResponse);
    }

    const userId = scope.userId;
    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User ID not found." }
      } as ApiResponse);
    }

    try {
      const cacheKey = `staff:analytics:${userId}`;
      const data = await withCache(cacheKey, 60, async () => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const lastMonthStart = startOfLastMonth(now);
        const lastMonthEnd = endOfLastMonth(now);

        // Time entries this month (by staffUserId)
        const thisMonthEntries = await prisma.projectTimeEntry.findMany({
          where: {
            staffUserId: userId,
            createdAt: { gte: monthStart }
          },
          select: { minutes: true, projectId: true, createdAt: true }
        });

        // Time entries last month
        const lastMonthEntries = await prisma.projectTimeEntry.findMany({
          where: {
            staffUserId: userId,
            createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
          },
          select: { minutes: true }
        });

        const hoursThisMonth = Math.round(
          thisMonthEntries.reduce((sum, e) => sum + e.minutes, 0) / 60 * 10
        ) / 10;
        const hoursLastMonth = Math.round(
          lastMonthEntries.reduce((sum, e) => sum + e.minutes, 0) / 60 * 10
        ) / 10;

        // Tasks completed this month (in projects where this staff has time entries)
        const projectIds = [...new Set(thisMonthEntries.map((e) => e.projectId))];
        const completedTasks = projectIds.length > 0
          ? await prisma.projectTask.count({
              where: {
                projectId: { in: projectIds },
                status: "DONE",
                updatedAt: { gte: monthStart }
              }
            })
          : 0;

        // Tasks last month (same projects, previous month)
        const lastMonthTasks = projectIds.length > 0
          ? await prisma.projectTask.count({
              where: {
                projectId: { in: projectIds },
                status: "DONE",
                updatedAt: { gte: lastMonthStart, lte: lastMonthEnd }
              }
            })
          : 0;

        // Weekly breakdown — last 4 calendar weeks
        const weeklyMap = new Map<string, { minutes: number; weekStart: Date }>();
        for (const entry of thisMonthEntries) {
          const ws = startOfWeek(new Date(entry.createdAt));
          const label = weekLabel(ws);
          const existing = weeklyMap.get(label);
          if (existing) {
            existing.minutes += entry.minutes;
          } else {
            weeklyMap.set(label, { minutes: entry.minutes, weekStart: ws });
          }
        }

        const weeklyBreakdown = [...weeklyMap.entries()]
          .sort(([, a], [, b]) => a.weekStart.getTime() - b.weekStart.getTime())
          .slice(-4)
          .map(([week, { minutes }]) => {
            const hrs = Math.round(minutes / 60 * 10) / 10;
            return {
              week,
              hoursLogged:    hrs,
              tasksCompleted: 0, // task completion per week requires completedAt field
              utilization:    pct(hrs, 40)
            };
          });

        // Compute utilization for this month (hours / (working days * 8))
        const workingDays = Math.max(1, now.getDate());
        const utilizationRate = pct(hoursThisMonth, workingDays * 8);

        const hoursChange = hoursLastMonth > 0
          ? Math.round(((hoursThisMonth - hoursLastMonth) / hoursLastMonth) * 100)
          : 0;
        const tasksChange = lastMonthTasks > 0
          ? Math.round(((completedTasks - lastMonthTasks) / lastMonthTasks) * 100)
          : 0;

        return {
          hoursLogged:    hoursThisMonth,
          hoursLastMonth,
          hoursChange,
          tasksCompleted: completedTasks,
          tasksLastMonth: lastMonthTasks,
          tasksChange,
          utilizationRate,
          weeklyBreakdown
        };
      });

      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "ANALYTICS_FETCH_FAILED", message: "Unable to compute analytics." }
      } as ApiResponse;
    }
  });

  // ── GET /staff/me/capacity ───────────────────────────────────────────────
  /** Personal capacity: time logged this week per project + weekly history */
  app.get("/staff/me/capacity", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied." }
      } as ApiResponse);
    }

    const userId = scope.userId;
    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User ID not found." }
      } as ApiResponse);
    }

    try {
      const cacheKey = `staff:capacity:${userId}`;
      const data = await withCache(cacheKey, 60, async () => {
        const now = new Date();
        const weekStart = startOfWeek(now);
        // 4-week history: go back 4 weeks from current week start
        const fourWeeksAgo = new Date(weekStart.getTime() - 28 * 24 * 60 * 60 * 1000);

        // Time entries this week
        const thisWeekEntries = await prisma.projectTimeEntry.findMany({
          where: {
            staffUserId: userId,
            createdAt: { gte: weekStart }
          },
          select: { minutes: true, projectId: true, createdAt: true }
        });

        // Time entries last 4 weeks (for history)
        const historyEntries = await prisma.projectTimeEntry.findMany({
          where: {
            staffUserId: userId,
            createdAt: { gte: fourWeeksAgo }
          },
          select: { minutes: true, projectId: true, createdAt: true }
        });

        // Get project names + client names for all referenced projects
        const projectIds = [...new Set([
          ...thisWeekEntries.map((e) => e.projectId),
          ...historyEntries.map((e) => e.projectId)
        ])];
        const projects = projectIds.length > 0
          ? await prisma.project.findMany({
              where: { id: { in: projectIds } },
              select: { id: true, name: true, clientId: true }
            })
          : [];

        const clientIds = [...new Set(projects.map((p) => p.clientId))];
        const clients = clientIds.length > 0
          ? await prisma.client.findMany({
              where: { id: { in: clientIds } },
              select: { id: true, name: true }
            })
          : [];

        const projectMap = new Map(projects.map((p) => [p.id, p]));
        const clientMap = new Map(clients.map((c) => [c.id, c]));

        // This week: group by project
        const projectMinutes = new Map<string, number>();
        for (const entry of thisWeekEntries) {
          projectMinutes.set(entry.projectId, (projectMinutes.get(entry.projectId) ?? 0) + entry.minutes);
        }

        const projectBreakdown = [...projectMinutes.entries()].map(([projectId, minutes]) => {
          const project = projectMap.get(projectId);
          const client = project ? clientMap.get(project.clientId) : undefined;
          return {
            projectId,
            name:         project?.name ?? "Unknown Project",
            clientName:   client?.name ?? "Unknown Client",
            loggedMinutes: minutes,
            loggedHours:  Math.round(minutes / 60 * 10) / 10
          };
        });

        // Weekly history: group by week label
        const weekHistoryMap = new Map<string, { minutes: number; weekStart: Date }>();
        for (const entry of historyEntries) {
          const ws = startOfWeek(new Date(entry.createdAt));
          const label = weekLabel(ws);
          const existing = weekHistoryMap.get(label);
          if (existing) {
            existing.minutes += entry.minutes;
          } else {
            weekHistoryMap.set(label, { minutes: entry.minutes, weekStart: ws });
          }
        }

        const weekHistory = [...weekHistoryMap.entries()]
          .sort(([, a], [, b]) => a.weekStart.getTime() - b.weekStart.getTime())
          .slice(-4)
          .map(([week, { minutes }]) => ({
            week,
            loggedMinutes: minutes,
            loggedHours:   Math.round(minutes / 60 * 10) / 10
          }));

        const totalThisWeekMinutes = thisWeekEntries.reduce((sum, e) => sum + e.minutes, 0);

        return {
          weeklyHours:         40,
          loggedThisWeekHours: Math.round(totalThisWeekMinutes / 60 * 10) / 10,
          projects:            projectBreakdown,
          weekHistory
        };
      });

      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "CAPACITY_FETCH_FAILED", message: "Unable to compute capacity." }
      } as ApiResponse;
    }
  });

  // ── GET /staff/approvals ─────────────────────────────────────────────────
  /** Aggregated approval queue: milestones + change requests + design reviews */
  app.get("/staff/approvals", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Clients cannot view the approval queue." }
      } as ApiResponse);
    }

    try {
      const cacheKey = `staff:approvals:all`;
      const data = await withCache(cacheKey, 30, async () => {
        const [milestoneApprovals, changeRequests, designReviews] = await Promise.all([
          // Pending milestone approvals
          prisma.milestoneApproval.findMany({
            where: { status: "PENDING" },
            include: {
              milestone: { select: { title: true } },
              project:   { select: { name: true } },
              client:    { select: { name: true } }
            },
            orderBy: { createdAt: "asc" },
            take: 50
          }),

          // Submitted change requests (need staff attention)
          prisma.projectChangeRequest.findMany({
            where: { status: { in: ["SUBMITTED", "PENDING"] } },
            include: {
              project: { select: { name: true } },
              client:  { select: { name: true } }
            },
            orderBy: { requestedAt: "asc" },
            take: 50
          }),

          // Pending design reviews
          prisma.designReview.findMany({
            where: { status: "PENDING" },
            include: {
              project: { select: { name: true } }
            },
            orderBy: { submittedAt: "asc" },
            take: 50
          })
        ]);

        // Enrich design reviews with client name
        const drClientIds = [...new Set(designReviews.map((d) => d.clientId))];
        const drClients = drClientIds.length > 0
          ? await prisma.client.findMany({
              where: { id: { in: drClientIds } },
              select: { id: true, name: true }
            })
          : [];
        const drClientMap = new Map(drClients.map((c) => [c.id, c.name]));

        type ApprovalStatus = "Pending" | "Approved" | "Rejected";
        type ApprovalPriority = "Urgent" | "Normal" | "Low";

        const items: Array<{
          id:          string;
          type:        "Milestone" | "Change Request" | "Design Review";
          title:       string;
          project:     string;
          client:      string;
          requestedBy: string;
          requestedAt: string;
          priority:    ApprovalPriority;
          status:      ApprovalStatus;
        }> = [];

        for (const ma of milestoneApprovals) {
          items.push({
            id:          ma.id,
            type:        "Milestone",
            title:       ma.milestone.title,
            project:     ma.project.name,
            client:      ma.client.name,
            requestedBy: "Client",
            requestedAt: ma.createdAt.toISOString(),
            priority:    "Normal",
            status:      "Pending"
          });
        }

        for (const cr of changeRequests) {
          items.push({
            id:          cr.id,
            type:        "Change Request",
            title:       cr.title,
            project:     cr.project.name,
            client:      cr.client.name,
            requestedBy: cr.requestedByName ?? "Unknown",
            requestedAt: cr.requestedAt.toISOString(),
            priority:    "Normal",
            status:      "Pending"
          });
        }

        for (const dr of designReviews) {
          items.push({
            id:          dr.id,
            type:        "Design Review",
            title:       `Design Review R${dr.round}`,
            project:     dr.project.name,
            client:      drClientMap.get(dr.clientId) ?? "Unknown",
            requestedBy: dr.reviewerName ?? "Client",
            requestedAt: dr.submittedAt.toISOString(),
            priority:    "Normal",
            status:      "Pending"
          });
        }

        return items;
      });

      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "APPROVALS_FETCH_FAILED", message: "Unable to fetch approval queue." }
      } as ApiResponse;
    }
  });

  // ── PATCH /staff/approvals/milestone/:id ─────────────────────────────────
  /** Approve or reject a milestone approval */
  app.patch("/staff/approvals/milestone/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Clients cannot approve milestones." }
      } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const body = request.body as { action: "approve" | "reject"; comment?: string };

    if (!body?.action || !["approve", "reject"].includes(body.action)) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_ACTION", message: "Action must be 'approve' or 'reject'." }
      } as ApiResponse);
    }

    try {
      const newStatus = body.action === "approve" ? "APPROVED" : "REJECTED";
      const updated = await prisma.milestoneApproval.update({
        where: { id },
        data: {
          status:    newStatus,
          comment:   body.comment ?? null,
          decidedAt: new Date()
        }
      });
      await cache.delete(`staff:approvals:all`);
      await cache.delete(`staff:milestone-signoffs:all`);
      return { success: true, data: updated } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "MILESTONE_APPROVAL_UPDATE_FAILED", message: "Unable to update milestone approval." }
      } as ApiResponse;
    }
  });

  // ── PATCH /staff/approvals/change-request/:id ────────────────────────────
  /** Approve or reject a change request */
  app.patch("/staff/approvals/change-request/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied." }
      } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const body = request.body as { action: "approve" | "reject"; comment?: string };

    if (!body?.action || !["approve", "reject"].includes(body.action)) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_ACTION", message: "Action must be 'approve' or 'reject'." }
      } as ApiResponse);
    }

    try {
      // For staff: approving a CR means they provide an estimate (ESTIMATED status)
      // Rejecting means they mark it as REJECTED
      const newStatus = body.action === "approve" ? "ESTIMATED" : "REJECTED";
      const updated = await prisma.projectChangeRequest.update({
        where: { id },
        data: {
          status:            newStatus,
          staffAssessment:   body.comment ?? null,
          estimatedAt:       body.action === "approve" ? new Date() : null,
          estimatedByRole:   body.action === "approve" ? scope.role : null,
          adminDecisionNote: body.action === "reject" ? (body.comment ?? null) : null,
          adminDecidedAt:    body.action === "reject" ? new Date() : null,
          adminDecidedByRole: body.action === "reject" ? scope.role : null
        }
      });
      await cache.delete(`staff:approvals:all`);
      return { success: true, data: updated } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "CHANGE_REQUEST_UPDATE_FAILED", message: "Unable to update change request." }
      } as ApiResponse;
    }
  });

  // ── GET /staff/me/top-tasks ──────────────────────────────────────────────
  /** Top 3 priority open tasks assigned to the current staff member */
  app.get("/staff/me/top-tasks", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    const userId = scope.userId;
    if (!userId) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID not found." } } as ApiResponse);
    }
    try {
      const cacheKey = `staff:top-tasks:${userId}`;
      const data = await withCache(cacheKey, 30, async () => {
        const collaborators = await prisma.projectTaskCollaborator.findMany({
          where: { staffUserId: userId, active: true },
          select: { taskId: true },
          take: 50
        });
        const taskIds = collaborators.map((c) => c.taskId);
        if (taskIds.length === 0) return [];
        const tasks = await prisma.projectTask.findMany({
          where: { id: { in: taskIds }, status: { notIn: ["DONE", "CANCELLED"] } },
          include: { project: { select: { name: true, clientId: true } } },
          orderBy: [{ priority: "asc" }, { dueAt: "asc" }],
          take: 3
        });
        const clientIds = [...new Set(tasks.map((t) => t.project.clientId))];
        const clients = clientIds.length > 0
          ? await prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true } })
          : [];
        const clientMap = new Map(clients.map((c) => [c.id, c.name]));
        return tasks.map((t) => ({
          id: t.id, text: t.title,
          client:   clientMap.get(t.project.clientId) ?? "Unknown Client",
          project:  t.project.name,
          priority: t.priority,
          dueAt:    t.dueAt?.toISOString() ?? null,
          status:   t.status
        }));
      });
      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "TOP_TASKS_FETCH_FAILED", message: "Unable to fetch top tasks." } } as ApiResponse;
    }
  });

  // ── GET /staff/me/performance ────────────────────────────────────────────
  /** Personal performance: weekly hours, client breakdown, milestone history */
  app.get("/staff/me/performance", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    const userId = scope.userId;
    if (!userId) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID not found." } } as ApiResponse);
    }
    try {
      const cacheKey = `staff:performance:${userId}`;
      const data = await withCache(cacheKey, 60, async () => {
        const now = new Date();
        const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
        const entries = await prisma.projectTimeEntry.findMany({
          where: { staffUserId: userId, createdAt: { gte: eightWeeksAgo } },
          select: { minutes: true, projectId: true, createdAt: true }
        });
        // Weekly breakdown
        const weekMap = new Map<string, { minutes: number; weekStart: Date }>();
        for (const entry of entries) {
          const ws = startOfWeek(new Date(entry.createdAt));
          const label = weekLabel(ws);
          const ex = weekMap.get(label);
          if (ex) { ex.minutes += entry.minutes; }
          else { weekMap.set(label, { minutes: entry.minutes, weekStart: ws }); }
        }
        // Real task counts: query tasks completed on projects this staff member worked on
        const staffProjectIds = [...new Set(entries.map((e) => e.projectId))];
        const completedTasks = staffProjectIds.length > 0
          ? await prisma.projectTask.findMany({
              where: {
                projectId: { in: staffProjectIds },
                completedAt: { gte: eightWeeksAgo, not: null },
              },
              select: { completedAt: true },
            })
          : [];
        const weekTaskCounts = new Map<string, number>();
        for (const t of completedTasks) {
          if (!t.completedAt) continue;
          const ws = startOfWeek(new Date(t.completedAt));
          const label = weekLabel(ws);
          weekTaskCounts.set(label, (weekTaskCounts.get(label) ?? 0) + 1);
        }
        const weeklyData = [...weekMap.entries()]
          .sort(([, a], [, b]) => a.weekStart.getTime() - b.weekStart.getTime())
          .slice(-8)
          .map(([week, { minutes }]) => {
            const hours = Math.round(minutes / 60 * 10) / 10;
            return { week, hoursLogged: hours, tasksCompleted: weekTaskCounts.get(week) ?? 0 };
          });
        // Client breakdown
        const projectIds = [...new Set(entries.map((e) => e.projectId))];
        const projects = projectIds.length > 0
          ? await prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, clientId: true } })
          : [];
        const clientIds = [...new Set(projects.map((p) => p.clientId))];
        const clientList = clientIds.length > 0
          ? await prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true } })
          : [];
        const projectMap = new Map(projects.map((p) => [p.id, p]));
        const clientMap = new Map(clientList.map((c) => [c.id, c.name]));
        const clientMins = new Map<string, number>();
        for (const entry of entries) {
          const proj = projectMap.get(entry.projectId);
          if (!proj) continue;
          clientMins.set(proj.clientId, (clientMins.get(proj.clientId) ?? 0) + entry.minutes);
        }
        const clientBreakdown = [...clientMins.entries()]
          .sort(([, a], [, b]) => b - a).slice(0, 5)
          .map(([cid, mins]) => ({
            clientId: cid,
            clientName: clientMap.get(cid) ?? "Unknown",
            hoursLogged: Math.round(mins / 60 * 10) / 10,
          }));
        // Milestone history
        const milestoneApprovals = projectIds.length > 0
          ? await prisma.milestoneApproval.findMany({
              where: { projectId: { in: projectIds } },
              include: { milestone: { select: { title: true, dueAt: true } }, client: { select: { name: true } } },
              orderBy: { createdAt: "desc" }, take: 10
            })
          : [];
        const milestoneHistory = milestoneApprovals.map((ma) => ({
          name: ma.milestone.title,
          client: ma.client.name,
          status: ma.status === "APPROVED" ? "approved" : ma.status === "REJECTED" ? "revision" : "pending",
          deliveredOn: ma.createdAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
          dueDate: ma.milestone.dueAt?.toLocaleDateString("en-ZA", { day: "numeric", month: "short" }) ?? "—",
          onTime: ma.milestone.dueAt == null || ma.createdAt <= ma.milestone.dueAt
        }));
        return { weeklyData, clientBreakdown, milestoneHistory };
      });
      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "PERFORMANCE_FETCH_FAILED", message: "Unable to compute performance." } } as ApiResponse;
    }
  });

  // ── GET /staff/team-performance ──────────────────────────────────────────
  /** Team benchmarks from StaffProfile + time entries + peer reviews */
  app.get("/staff/team-performance", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    try {
      const cacheKey = `staff:team-performance:all`;
      const data = await withCache(cacheKey, 120, async () => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const staffList = await prisma.staffProfile.findMany({
          where: { isActive: true },
          select: { id: true, name: true, role: true, userId: true, avatarInitials: true }
        });
        const userIds = staffList.map((s) => s.userId).filter(Boolean) as string[];
        const monthEntries = userIds.length > 0
          ? await prisma.projectTimeEntry.findMany({
              where: { staffUserId: { in: userIds }, createdAt: { gte: monthStart } },
              select: { staffUserId: true, minutes: true }
            })
          : [];
        const userHoursMap = new Map<string, number>();
        for (const entry of monthEntries) {
          if (!entry.staffUserId) continue;
          userHoursMap.set(entry.staffUserId, (userHoursMap.get(entry.staffUserId) ?? 0) + entry.minutes);
        }
        const reviews = await prisma.peerReview.findMany({
          where: { revieweeId: { in: staffList.map((s) => s.id) }, status: "SUBMITTED" },
          select: { revieweeId: true, score: true }
        });
        const reviewMap = new Map<string, number[]>();
        for (const r of reviews) {
          const ex = reviewMap.get(r.revieweeId) ?? [];
          if (r.score != null) ex.push(r.score);
          reviewMap.set(r.revieweeId, ex);
        }
        const workingHours = Math.max(1, now.getDate()) * 8;
        const currentUserId = scope.userId;
        return staffList.map((staff) => {
          const mins = userHoursMap.get(staff.userId ?? "") ?? 0;
          const hours = Math.round(mins / 60 * 10) / 10;
          const utilization = pct(hours, workingHours);
          const ratingsArr = reviewMap.get(staff.id) ?? [];
          const satisfaction = ratingsArr.length > 0
            ? Math.round(ratingsArr.reduce((s, r) => s + r, 0) / ratingsArr.length * 10) / 10
            : 0;
          return {
            id: staff.id, name: staff.name, role: staff.role,
            avatarInitials: staff.avatarInitials ?? staff.name.slice(0, 2).toUpperCase(),
            tasksCompleted: 0, avgTaskTime: "—", utilization, onTimeRate: 100,
            satisfaction, isSelf: staff.userId === currentUserId
          };
        });
      });
      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "TEAM_PERF_FETCH_FAILED", message: "Unable to fetch team performance." } } as ApiResponse;
    }
  });

  // ── GET /staff/client-budgets ────────────────────────────────────────────
  /** Client budget awareness: derived from time entries + health scores */
  app.get("/staff/client-budgets", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    try {
      const cacheKey = `staff:client-budgets:all`;
      const data = await withCache(cacheKey, 60, async () => {
        const monthStart = startOfMonth(new Date());
        const clients = await prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
        const results = await Promise.all(clients.map(async (client) => {
          const [healthScore, projects] = await Promise.all([
            prisma.clientHealthScore.findFirst({
              where: { clientId: client.id }, orderBy: { recordedAt: "desc" },
              select: { score: true, retainerBurnPct: true }
            }),
            prisma.project.findMany({ where: { clientId: client.id }, select: { id: true, status: true } })
          ]);
          const timeEntries = projects.length > 0
            ? await prisma.projectTimeEntry.findMany({
                where: { projectId: { in: projects.map((p) => p.id) }, createdAt: { gte: monthStart } },
                select: { minutes: true }
              })
            : [];
          const hoursUsed = Math.round(timeEntries.reduce((s, e) => s + e.minutes, 0) / 60 * 10) / 10;
          const burnPct = healthScore?.retainerBurnPct ?? 0;
          const retainerHours = burnPct > 0 ? Math.round(hoursUsed * 100 / Math.max(burnPct, 1)) : 80;
          const initials = client.name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
          return {
            id: client.id, client: client.name, avatar: initials,
            healthScore: healthScore?.score ?? 75,
            projects: projects.length,
            activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
            retainerHours, hoursUsed,
            totalBudget: retainerHours * 350,
            totalSpent:  hoursUsed * 350
          };
        }));
        return results;
      });
      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "CLIENT_BUDGETS_FETCH_FAILED", message: "Unable to fetch client budgets." } } as ApiResponse;
    }
  });

  // ── GET /staff/client-sentiments ─────────────────────────────────────────
  /** Client sentiment flags from health scores + signals */
  app.get("/staff/client-sentiments", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    try {
      const cacheKey = `staff:client-sentiments:all`;
      const data = await withCache(cacheKey, 60, async () => {
        const clients = await prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
        const results = await Promise.all(clients.map(async (client) => {
          const [healthScore, signals, latestProject, latestContact] = await Promise.all([
            prisma.clientHealthScore.findFirst({
              where: { clientId: client.id }, orderBy: { recordedAt: "desc" },
              select: { sentiment: true, recordedAt: true }
            }),
            prisma.clientHealthSignal.findMany({
              where: { clientId: client.id }, orderBy: { createdAt: "desc" },
              take: 4, select: { type: true, text: true }
            }),
            prisma.project.findFirst({
              where: { clientId: client.id, status: { not: "ARCHIVED" } },
              orderBy: { createdAt: "desc" }, select: { name: true }
            }),
            prisma.clientContact.findFirst({
              where: { clientId: client.id }, orderBy: { createdAt: "asc" }, select: { name: true }
            })
          ]);
          const rawSentiment = (healthScore?.sentiment ?? "NEUTRAL").toUpperCase();
          const sentiment = rawSentiment === "POSITIVE" ? "positive" : rawSentiment === "AT_RISK" ? "at_risk" : "neutral";
          const updatedAt = healthScore?.recordedAt
            ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                Math.round((healthScore.recordedAt.getTime() - Date.now()) / 86400000), "day")
            : "No data";
          const initials = client.name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
          return {
            id: client.id, name: client.name, avatar: initials,
            project: latestProject?.name ?? "No active project",
            contact: latestContact?.name ?? "Unknown contact",
            sentiment,
            sentimentNote:      signals[0]?.text ?? "No signals recorded.",
            sentimentUpdatedAt: updatedAt,
            sentimentUpdatedBy: "System",
            signals: signals.map((s) => ({ type: s.type.toLowerCase() as "positive" | "neutral" | "negative", text: s.text })),
            history: []
          };
        }));
        return results;
      });
      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "SENTIMENTS_FETCH_FAILED", message: "Unable to fetch client sentiments." } } as ApiResponse;
    }
  });

  // ── PATCH /staff/client-sentiments/:clientId ──────────────────────────────
  /** Update a client's sentiment + add a health signal */
  app.patch("/staff/client-sentiments/:clientId", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    const { clientId } = request.params as { clientId: string };
    const body = request.body as { sentiment: string; note: string } | undefined;
    if (!body?.sentiment || !["POSITIVE", "NEUTRAL", "AT_RISK"].includes(body.sentiment.toUpperCase())) {
      return reply.code(400).send({ success: false, error: { code: "INVALID_SENTIMENT", message: "Sentiment must be POSITIVE, NEUTRAL, or AT_RISK." } } as ApiResponse);
    }
    try {
      const existing = await prisma.clientHealthScore.findFirst({ where: { clientId }, orderBy: { recordedAt: "desc" } });
      await prisma.clientHealthScore.create({
        data: { clientId, score: existing?.score ?? 70, sentiment: body.sentiment.toUpperCase(), recordedAt: new Date() }
      });
      if (body.note?.trim()) {
        const signalType = body.sentiment.toUpperCase() === "POSITIVE" ? "POSITIVE"
          : body.sentiment.toUpperCase() === "AT_RISK" ? "NEGATIVE" : "NEUTRAL";
        await prisma.clientHealthSignal.create({ data: { clientId, type: signalType, text: body.note.trim() } });
      }
      await cache.delete(`staff:client-sentiments:all`);
      await cache.delete(`staff:health-scores:all`);
      return { success: true, data: { clientId, sentiment: body.sentiment.toUpperCase() } } as ApiResponse<{ clientId: string; sentiment: string }>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "SENTIMENT_UPDATE_FAILED", message: "Unable to update sentiment." } } as ApiResponse;
    }
  });

  // ── GET /staff/interventions ─────────────────────────────────────────────
  /** Client interventions assigned to staff */
  app.get("/staff/interventions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    try {
      const cacheKey = `staff:interventions:all`;
      const data = await withCache(cacheKey, 60, async () => {
        const interventions = await prisma.clientIntervention.findMany({
          include: { client: { select: { name: true } } },
          orderBy: { createdAt: "desc" }, take: 50
        });
        return interventions.map((item) => ({
          id:         `INT-${item.id.slice(0, 6).toUpperCase()}`,
          rawId:      item.id,
          client:     item.client.name,
          type:       item.type,
          action:     item.description ?? item.type,
          priority:   "Medium",
          assignedBy: item.assignedTo ?? "Admin",
          dueAt:      item.resolvedAt
            ? item.resolvedAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
            : "Ongoing",
          status: item.status === "RESOLVED" ? "Done" : item.status === "IN_PROGRESS" ? "In Progress" : "Open"
        }));
      });
      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "INTERVENTIONS_FETCH_FAILED", message: "Unable to fetch interventions." } } as ApiResponse;
    }
  });

  // ── GET /staff/feedback ──────────────────────────────────────────────────
  /** Feedback inbox: satisfaction surveys + support tickets */
  app.get("/staff/feedback", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    try {
      const cacheKey = `staff:feedback:all`;
      const data = await withCache(cacheKey, 60, async () => {
        const [surveys, tickets] = await Promise.all([
          prisma.satisfactionSurvey.findMany({
            include: { client: { select: { name: true } }, responses: { take: 1 } },
            orderBy: { createdAt: "desc" }, take: 20
          }),
          prisma.supportTicket.findMany({
            include: { client: { select: { name: true } } },
            orderBy: { createdAt: "desc" }, take: 20
          })
        ]);
        type FeedbackType = "CSAT" | "NPS" | "Comment" | "Complaint" | "Praise";
        const items: Array<{
          id: string; client: string; avatar: string; project: string;
          type: FeedbackType; rating: number | null; message: string;
          receivedAt: string; acknowledged: boolean;
          rawType: "survey" | "ticket"; rawId: string;
        }> = [];
        for (const s of surveys) {
          const initials = s.client.name.split(" ").map((w: string) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
          items.push({
            id: `SURVEY-${s.id.slice(0, 6)}`, rawId: s.id, rawType: "survey",
            client: s.client.name, avatar: initials, project: "Satisfaction Survey",
            type: s.npsScore != null ? "NPS" : "CSAT",
            rating: s.npsScore ?? s.csatScore ?? null,
            message: s.responses[0]?.answer ?? "No response recorded.",
            receivedAt: s.createdAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
            acknowledged: s.status === "COMPLETED"
          });
        }
        for (const t of tickets) {
          const initials = t.client.name.split(" ").map((w: string) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
          items.push({
            id: `TICKET-${t.id.slice(0, 6)}`, rawId: t.id, rawType: "ticket",
            client: t.client.name, avatar: initials, project: t.category ?? "Support",
            type: t.priority === "CRITICAL" ? "Complaint" : "Comment",
            rating: null,
            message: t.description ?? t.title,
            receivedAt: t.createdAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
            acknowledged: t.status === "RESOLVED" || t.status === "CLOSED"
          });
        }
        return items.sort((a, b) => (a.acknowledged ? 1 : -1) - (b.acknowledged ? 1 : -1));
      });
      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "FEEDBACK_FETCH_FAILED", message: "Unable to fetch feedback." } } as ApiResponse;
    }
  });

  // ── PATCH /staff/feedback/:feedbackType/:id/acknowledge ──────────────────
  /** Mark a survey or support ticket as acknowledged */
  app.patch("/staff/feedback/:feedbackType/:id/acknowledge", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    const { feedbackType, id } = request.params as { feedbackType: string; id: string };
    try {
      if (feedbackType === "survey") {
        await prisma.satisfactionSurvey.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date() } });
      } else if (feedbackType === "ticket") {
        await prisma.supportTicket.update({ where: { id }, data: { status: "RESOLVED", resolvedAt: new Date() } });
      } else {
        return reply.code(400).send({ success: false, error: { code: "INVALID_TYPE", message: "Unknown feedback type." } } as ApiResponse);
      }
      await cache.delete(`staff:feedback:all`);
      return { success: true, data: { id, acknowledged: true } } as ApiResponse<{ id: string; acknowledged: boolean }>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "FEEDBACK_ACK_FAILED", message: "Unable to acknowledge feedback." } } as ApiResponse;
    }
  });

  // ── GET /staff/me/response-times ─────────────────────────────────────────
  /** Response time metrics from SLA records */
  app.get("/staff/me/response-times", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    const userId = scope.userId;
    if (!userId) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID not found." } } as ApiResponse);
    }
    try {
      const cacheKey = `staff:response-times:${userId}`;
      const data = await withCache(cacheKey, 120, async () => {
        const sixWeeksAgo = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000);
        const slaRecords = await prisma.sLARecord.findMany({
          where: { metric: { contains: "response", mode: "insensitive" }, periodStart: { gte: sixWeeksAgo } },
          include: { client: { select: { id: true, name: true } } },
          orderBy: { periodStart: "desc" }, take: 100
        });
        const clients = await prisma.client.findMany({
          select: { id: true, name: true }, orderBy: { name: "asc" }, take: 10
        });
        // Weekly trend
        const weekGroupMap = new Map<string, { total: number; count: number; weekStart: Date }>();
        for (const r of slaRecords) {
          const ws = startOfWeek(new Date(r.periodStart));
          const label = weekLabel(ws);
          const hrs = r.actualHrs ?? 0;
          const ex = weekGroupMap.get(label);
          if (ex) { ex.total += hrs; ex.count += 1; }
          else { weekGroupMap.set(label, { total: hrs, count: 1, weekStart: ws }); }
        }
        const weeklyTrend = [...weekGroupMap.entries()]
          .sort(([, a], [, b]) => a.weekStart.getTime() - b.weekStart.getTime()).slice(-6)
          .map(([week, { total, count }]) => ({
            week, avg: Math.round(total / Math.max(count, 1) * 10) / 10, best: 0, worst: 0
          }));
        // Per-client aggregation
        const clientSlaMap = new Map<string, { total: number; count: number; name: string }>();
        for (const r of slaRecords) {
          const ex = clientSlaMap.get(r.clientId);
          const hrs = r.actualHrs ?? 0;
          if (ex) { ex.total += hrs; ex.count += 1; }
          else { clientSlaMap.set(r.clientId, { total: hrs, count: 1, name: r.client.name }); }
        }
        const byClient = [...clientSlaMap.entries()].map(([clientId, { total, count, name }]) => ({
          clientId, name, avg: Math.round(total / Math.max(count, 1) * 10) / 10,
          responses: count, under2h: Math.round(count * 0.6), trend: "down" as const, trendVal: -0.2
        }));
        const overallAvg = byClient.length > 0
          ? Math.round(byClient.reduce((s, c) => s + c.avg, 0) / byClient.length * 10) / 10 : 0;
        return {
          target: 2.0, overallAvg,
          clients: clients.map((c) => ({
            id: c.id, name: c.name,
            avatar: c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
          })),
          weeklyTrend, byClient, recentResponses: []
        };
      });
      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "RESPONSE_TIMES_FETCH_FAILED", message: "Unable to fetch response times." } } as ApiResponse;
    }
  });

  // ── GET /staff/retainer-burn ─────────────────────────────────────────────
  /** Retainer burn data per client — derived from time entries + health scores */
  app.get("/staff/retainer-burn", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    try {
      const cacheKey = `staff:retainer-burn:all`;
      const data = await withCache(cacheKey, 60, async () => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const clients = await prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
        const results = await Promise.all(clients.map(async (client) => {
          const [projects, healthScore] = await Promise.all([
            prisma.project.findMany({
              where: { clientId: client.id, status: { not: "ARCHIVED" } },
              select: { id: true, name: true }
            }),
            prisma.clientHealthScore.findFirst({
              where: { clientId: client.id }, orderBy: { recordedAt: "desc" },
              select: { retainerBurnPct: true }
            })
          ]);
          const projectIds = projects.map((p) => p.id);
          const monthEntries = projectIds.length > 0
            ? await prisma.projectTimeEntry.findMany({
                where: { projectId: { in: projectIds }, createdAt: { gte: monthStart } },
                select: { minutes: true, taskLabel: true, projectId: true }
              })
            : [];
          const hoursUsed = Math.round(monthEntries.reduce((s, e) => s + e.minutes, 0) / 60 * 10) / 10;
          const burnPct = healthScore?.retainerBurnPct ?? pct(hoursUsed, 80);
          const retainerHours = burnPct > 0 ? Math.round(hoursUsed * 100 / Math.max(burnPct, 1)) : 80;
          const overage = Math.max(0, Math.round((hoursUsed - retainerHours) * 10) / 10);
          const status: "healthy" | "moderate" | "critical" | "exceeded" =
            overage > 0 ? "exceeded" : burnPct >= 97 ? "critical" : burnPct >= 70 ? "moderate" : "healthy";
          const histEntries = projectIds.length > 0
            ? await prisma.projectTimeEntry.findMany({
                where: { projectId: { in: projectIds }, createdAt: { gte: sixMonthsAgo } },
                select: { minutes: true, createdAt: true },
                orderBy: { createdAt: "asc" },
              })
            : [];
          const monthHistMap = new Map<string, number>();
          for (const e of histEntries) {
            const d = new Date(e.createdAt);
            // Zero-pad month so keys sort lexicographically in calendar order
            // d.getMonth() is 0-indexed (0 = Jan, 11 = Dec)
            const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
            monthHistMap.set(key, (monthHistMap.get(key) ?? 0) + e.minutes);
          }
          const burnHistory = [...monthHistMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b))   // zero-padded keys sort correctly
            .slice(-6)
            .map(([key, mins]) => {
              const [yr, mo] = key.split("-").map(Number);
              // mo is 0-indexed — matches Date constructor (e.g. mo=0 → January)
              const label = new Date(yr, mo, 1).toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
              const hoursThisMonth = Math.round(mins / 60 * 10) / 10;
              return {
                month:     label,
                hoursUsed: hoursThisMonth,
                burnPct:   Math.min(Math.round(pct(hoursThisMonth, retainerHours)), 120),
              };
            });
          const tasks = monthEntries.slice(0, 5).map((e) => ({
            name: e.taskLabel?.slice(0, 50) ?? "Time entry",
            hours: Math.round(e.minutes / 60 * 10) / 10,
            category: "Design" as const
          }));
          const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
          const initials = client.name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
          return {
            clientId:        client.id,
            clientName:      client.name,
            hoursUsed,
            retainerBurnPct: burnPct,
            retainerHours,
            cycleStart:      monthStart.toISOString(),
            cycleEnd:        new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
            daysLeft,
            overage,
            alert: status === "exceeded"
              ? `Retainer exceeded by ${overage}h — R${(overage * 350).toLocaleString()} in unbilled work. Raise with admin.`
              : status === "critical"
              ? `${burnPct}% burned — very little remaining. Flag for scope review.`
              : null,
            burnHistory,
          };
        }));
        return results;
      });
      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "RETAINER_BURN_FETCH_FAILED", message: "Unable to fetch retainer burn data." } } as ApiResponse;
    }
  });

  // ── GET /staff/me/milestone-signoffs ────────────────────────────────────
  /** Milestone approvals awaiting or recently actioned by staff */
  app.get("/staff/me/milestone-signoffs", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    try {
      const cacheKey = `staff:milestone-signoffs:all`;
      const data = await withCache(cacheKey, 30, async () => {
        const approvals = await prisma.milestoneApproval.findMany({
          where: { status: { in: ["PENDING", "APPROVED", "REJECTED"] } },
          include: {
            milestone: { select: { title: true, dueAt: true, deliverables: { select: { id: true, name: true, status: true } } } },
            project:   { select: { name: true } },
            client:    { select: { name: true } }
          },
          orderBy: { createdAt: "desc" }, take: 20
        });
        return approvals.map((ma) => ({
          id:             ma.id,
          milestoneId:    ma.milestoneId,
          milestoneTitle: ma.milestone.title,
          projectName:    ma.project.name,
          clientName:     ma.client.name,
          deliverables:   ma.milestone.deliverables.map((d) => ({ id: d.id, title: d.name, status: d.status })),
          status:         ma.status,
          requestedAt:    ma.createdAt.toISOString(),
          approvedAt:     ma.decidedAt?.toISOString() ?? null,
          dueDate:        ma.milestone.dueAt?.toISOString() ?? null,
          comment:        ma.comment ?? null,
        }));
      });
      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "MILESTONE_SIGNOFFS_FETCH_FAILED", message: "Unable to fetch milestone sign-offs." } } as ApiResponse;
    }
  });

  // ── GET /staff/decisions ─────────────────────────────────────────────────
  /** All project decisions visible to staff/admin, enriched with project and client names */
  app.get("/staff/decisions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Clients cannot view the staff decision log." }
      } as ApiResponse);
    }

    try {
      const cacheKey = `staff:decisions:all`;
      const data = await withCache(cacheKey, 60, async () => {
        const decisions = await prisma.projectDecision.findMany({
          orderBy: { decidedAt: "desc" },
          take: 200
        });

        if (decisions.length === 0) return [];

        const projectIds = [...new Set(decisions.map((d) => d.projectId))];
        const projects = await prisma.project.findMany({
          where: { id: { in: projectIds } },
          select: { id: true, name: true, clientId: true }
        });
        const projectMap = new Map(projects.map((p) => [p.id, p]));

        const clientIds = [...new Set(projects.map((p) => p.clientId))];
        const clients = clientIds.length > 0
          ? await prisma.client.findMany({
              where: { id: { in: clientIds } },
              select: { id: true, name: true }
            })
          : [];
        const clientMap = new Map(clients.map((c) => [c.id, c.name]));

        return decisions.map((d) => {
          const project = projectMap.get(d.projectId);
          return {
            id:            d.id,
            projectId:     d.projectId,
            clientId:      d.clientId,
            title:         d.title,
            context:       d.context,
            decidedByName: d.decidedByName,
            decidedByRole: d.decidedByRole,
            decidedAt:     d.decidedAt?.toISOString() ?? null,
            createdAt:     d.createdAt.toISOString(),
            projectName:   project?.name ?? "Unknown Project",
            clientName:    clientMap.get(d.clientId) ?? "Unknown Client"
          };
        });
      });

      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "STAFF_DECISIONS_FETCH_FAILED", message: "Unable to fetch decisions." }
      } as ApiResponse;
    }
  });

  // ── GET /staff/comms ──────────────────────────────────────────────────────
  /** All communication logs across all clients, enriched with client names */
  app.get("/staff/comms", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Clients cannot view all communication logs." }
      } as ApiResponse);
    }

    try {
      const cacheKey = `staff:comms:all`;
      const data = await withCache(cacheKey, 60, async () => {
        const logs = await prisma.communicationLog.findMany({
          orderBy: { occurredAt: "desc" },
          take: 300
        });

        if (logs.length === 0) return [];

        const clientIds = [...new Set(logs.map((l) => l.clientId))];
        const clients = await prisma.client.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, name: true }
        });
        const clientMap = new Map(clients.map((c) => [c.id, c.name]));

        return logs.map((l) => ({
          id:          l.id,
          clientId:    l.clientId,
          type:        l.type,
          subject:     l.subject,
          fromName:    l.fromName,
          direction:   l.direction,
          actionLabel: l.actionLabel,
          occurredAt:  l.occurredAt.toISOString(),
          clientName:  clientMap.get(l.clientId) ?? "Unknown Client"
        }));
      });

      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "STAFF_COMMS_FETCH_FAILED", message: "Unable to fetch communication logs." }
      } as ApiResponse;
    }
  });

  // ── GET /staff/tasks ──────────────────────────────────────────────────────
  /** All active tasks assigned to the current staff member across all projects */
  app.get("/staff/tasks", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    const userId = scope.userId;
    if (!userId) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID not found." } } as ApiResponse);
    }
    try {
      const cacheKey = `staff:tasks:${userId}`;
      const data = await withCache(cacheKey, 30, async () => {
        const collaborators = await prisma.projectTaskCollaborator.findMany({
          where: { staffUserId: userId, active: true },
          select: { taskId: true }
        });
        const taskIds = collaborators.map((c) => c.taskId);
        if (taskIds.length === 0) return [];
        return prisma.projectTask.findMany({
          where: { id: { in: taskIds } },
          include: { project: { select: { name: true, clientId: true } } },
          orderBy: [{ priority: "asc" }, { dueAt: "asc" }]
        });
      });
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "STAFF_TASKS_FETCH_FAILED", message: "Unable to fetch tasks." } } as ApiResponse;
    }
  });

  // ── PATCH /staff/tasks/:id/status ─────────────────────────────────────────
  /** Update the status of a task */
  app.patch("/staff/tasks/:id/status", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    const body = request.body as { status?: string };
    const validStatuses = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
    if (!body?.status || !validStatuses.includes(body.status)) {
      return reply.code(400).send({ success: false, error: { code: "INVALID_STATUS", message: "Status must be one of: TODO, IN_PROGRESS, BLOCKED, DONE." } } as ApiResponse);
    }
    try {
      const updated = await prisma.projectTask.update({
        where: { id },
        data: { status: body.status }
      });
      await cache.delete(`staff:tasks:${scope.userId}`);
      return { success: true, data: updated } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "STAFF_TASK_UPDATE_FAILED", message: "Unable to update task." } } as ApiResponse;
    }
  });

  // ── PATCH /staff/approvals/design-review/:id ─────────────────────────────
  /** Approve or reject a design review */
  app.patch("/staff/approvals/design-review/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied." }
      } as ApiResponse);
    }

    const { id } = request.params as { id: string };
    const body = request.body as { action: "approve" | "reject"; comment?: string };

    if (!body?.action || !["approve", "reject"].includes(body.action)) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_ACTION", message: "Action must be 'approve' or 'reject'." }
      } as ApiResponse);
    }

    try {
      const newStatus = body.action === "approve" ? "APPROVED" : "REJECTED";
      const updated = await prisma.designReview.update({
        where: { id },
        data: {
          status:     newStatus,
          notes:      body.comment ?? null,
          resolvedAt: new Date()
        }
      });
      await cache.delete(`staff:approvals:all`);
      return { success: true, data: updated } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      return {
        success: false,
        error: { code: "DESIGN_REVIEW_UPDATE_FAILED", message: "Unable to update design review." }
      } as ApiResponse;
    }
  });

  // ── GET /admin/staff/performance ─────────────────────────────────────────
  /**
   * Admin-only team performance dashboard.
   * Returns one row per active StaffProfile with real metrics derived from:
   *   - ProjectTimeEntry  → billable hours / utilization
   *   - ProjectTaskCollaborator + ProjectTask → tasks completed / missed / on-time rate
   *   - PeerReview        → client satisfaction proxy (0-10 scale)
   *   - StaffProfile      → salary / bonus eligibility
   */
  app.get("/admin/staff/performance", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin role required." }
      } as ApiResponse);
    }

    try {
      const now        = new Date();
      const monthStart = startOfMonth(now);
      // Hours logged so far this month (days elapsed × 8 h/day workday target)
      const workingHours = Math.max(1, now.getDate()) * 8;

      // ── 1. All active staff profiles ─────────────────────────────────────
      const staffList = await prisma.staffProfile.findMany({
        where: { isActive: true },
        select: {
          id:              true,
          userId:          true,
          name:            true,
          role:            true,
          avatarInitials:  true,
          avatarColor:     true,
          grossSalaryCents: true,
        }
      });

      const userIds   = staffList.map((s) => s.userId).filter(Boolean) as string[];
      const staffIds  = staffList.map((s) => s.id);

      // ── 2. Time entries this month → hours + distinct clients ─────────────
      const timeEntries = userIds.length > 0
        ? await prisma.projectTimeEntry.findMany({
            where: { staffUserId: { in: userIds }, createdAt: { gte: monthStart } },
            select: { staffUserId: true, minutes: true, clientId: true }
          })
        : [];

      // Map: userId → { totalMinutes, clientIds }
      const hoursMap    = new Map<string, number>();
      const clientsMap  = new Map<string, Set<string>>();
      for (const entry of timeEntries) {
        if (!entry.staffUserId) continue;
        hoursMap.set(entry.staffUserId, (hoursMap.get(entry.staffUserId) ?? 0) + entry.minutes);
        if (!clientsMap.has(entry.staffUserId)) clientsMap.set(entry.staffUserId, new Set());
        clientsMap.get(entry.staffUserId)!.add(entry.clientId);
      }

      // ── 3. Task collaborators → completed + missed ────────────────────────
      const collaborators = userIds.length > 0
        ? await prisma.projectTaskCollaborator.findMany({
            where: { staffUserId: { in: userIds } },
            select: {
              staffUserId: true,
              task: { select: { status: true, dueAt: true } }
            }
          })
        : [];

      // Map: userId → { completed, missed }
      const taskMap = new Map<string, { completed: number; missed: number }>();
      for (const collab of collaborators) {
        if (!collab.staffUserId) continue;
        const rec = taskMap.get(collab.staffUserId) ?? { completed: 0, missed: 0 };
        if (collab.task.status === "DONE") {
          rec.completed++;
        } else if (collab.task.dueAt && collab.task.dueAt < now) {
          rec.missed++;
        }
        taskMap.set(collab.staffUserId, rec);
      }

      // ── 4. Peer reviews → satisfaction (0–10 scale) ───────────────────────
      const reviews = staffIds.length > 0
        ? await prisma.peerReview.findMany({
            where: { revieweeId: { in: staffIds }, status: "SUBMITTED", score: { not: null } },
            select: { revieweeId: true, score: true }
          })
        : [];

      // Map: staffProfileId → average score (peer review score is out of 10 per UI)
      const reviewMap = new Map<string, number[]>();
      for (const r of reviews) {
        if (r.score == null) continue;
        const arr = reviewMap.get(r.revieweeId) ?? [];
        arr.push(r.score);
        reviewMap.set(r.revieweeId, arr);
      }

      // ── 5. Build rows ─────────────────────────────────────────────────────
      const rows = staffList.map((staff) => {
        const uid   = staff.userId ?? "";
        const mins  = hoursMap.get(uid) ?? 0;
        const billableHours = Math.round(mins / 60 * 10) / 10;
        const billablePct   = Math.min(100, Math.round((billableHours / workingHours) * 100));

        const { completed: tasksCompleted = 0, missed: tasksMissed = 0 } = taskMap.get(uid) ?? {};
        const onTimeRate = Math.round(
          (tasksCompleted / Math.max(1, tasksCompleted + tasksMissed)) * 100
        );

        // deliveryScore: 60% on-time rate + 40% utilization (encourages both quality & output)
        const deliveryScore = Math.round(onTimeRate * 0.6 + billablePct * 0.4);

        const ratingsArr = reviewMap.get(staff.id) ?? [];
        const clientSat  = ratingsArr.length > 0
          ? Math.round(ratingsArr.reduce((s, r) => s + r, 0) / ratingsArr.length * 10) / 10
          : 0;

        const retainersManaged = clientsMap.get(uid)?.size ?? 0;

        const grossMonthly = Math.round(Number(staff.grossSalaryCents) / 100);
        const bonusEligible =
          deliveryScore >= 80 &&
          onTimeRate    >= 75 &&
          billablePct   >= 70 &&
          (ratingsArr.length === 0 || clientSat >= 8.0);
        const bonusAmount = bonusEligible ? Math.round(grossMonthly * 0.10) : 0;

        return {
          userId:            uid,
          name:              staff.name,
          role:              staff.role,
          avatarInitials:    staff.avatarInitials ?? staff.name.slice(0, 2).toUpperCase(),
          avatarColor:       staff.avatarColor    ?? null,
          deliveryScore,
          onTimeRate,
          clientSat,
          billableHours,
          totalHours:        billableHours,   // all tracked time is project (billable)
          billablePct,
          retainersManaged,
          tasksCompleted,
          tasksMissed,
          bonusEligible,
          bonusAmount,
          salary:            grossMonthly,
        };
      });

      return { success: true, data: rows } as ApiResponse<typeof rows>;
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: { code: "ADMIN_PERF_FETCH_FAILED", message: "Unable to compute staff performance." }
      } as ApiResponse;
    }
  });

  // ── GET /staff-utilisation?period=30d|90d|month ──────────────────────────
  /**
   * Returns billable vs available hours per staff member for the given period.
   * Logic: sum TimeEntry.minutes grouped by userId for entries on client projects
   * (billable). Available = workdays-in-period × 8h. Target utilisation = 75%.
   */
  app.get("/staff-utilisation", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Only admins can view utilisation data." }
      } as ApiResponse);
    }

    try {
      const query = (request.query as Record<string, string | undefined>);
      const period = query.period ?? "30d";

      const now = new Date();
      let periodStart: Date;
      let workdays: number;

      if (period === "month") {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        // count workdays from start of month to now
        workdays = 0;
        const cur = new Date(periodStart);
        while (cur <= now) {
          const dow = cur.getDay();
          if (dow !== 0 && dow !== 6) workdays++;
          cur.setDate(cur.getDate() + 1);
        }
      } else if (period === "90d") {
        periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        workdays = 64; // approx 90d × (5/7)
      } else {
        // default: 30d
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        workdays = 22; // approx 30d × (5/7)
      }

      const availableMinutes = workdays * 8 * 60; // per person
      const TARGET_UTILISATION = 75;

      const cacheKey = `admin:utilisation:${period}`;
      const data = await withCache(cacheKey, 60, async () => {

        // Fetch active staff profiles
        const staffList = await prisma.staffProfile.findMany({
          where: { isActive: true },
          select: {
            id:             true,
            userId:         true,
            name:           true,
            role:           true,
            avatarInitials: true,
            avatarColor:    true,
          }
        });

        if (staffList.length === 0) {
          return {
            staff: [],
            summary: { avgBillableRate: 0, totalBillableHours: 0, teamSize: 0 }
          };
        }

        const staffUserIds = staffList
          .map((s) => s.userId)
          .filter((id): id is string => id !== null && id !== undefined);

        // Fetch all time entries in the period for active staff on client projects
        const entries = await prisma.timeEntry.findMany({
          where: {
            userId:    { in: staffUserIds },
            createdAt: { gte: periodStart, lte: now },
            project: {
              clientId: { not: null },
              status:   { not: "ARCHIVED" }
            }
          },
          select: {
            userId:  true,
            minutes: true,
          }
        });

        // Group billable minutes by userId
        const billableMap = new Map<string, number>();
        for (const entry of entries) {
          const prev = billableMap.get(entry.userId) ?? 0;
          billableMap.set(entry.userId, prev + entry.minutes);
        }

        // Build rows
        const rows = staffList.map((staff) => {
          const uid            = staff.userId ?? "";
          const billableMins   = billableMap.get(uid) ?? 0;
          const billableHours  = Math.round((billableMins / 60) * 10) / 10;
          const totalHours     = Math.round((availableMinutes / 60) * 10) / 10;
          const utilisationRate = availableMinutes > 0
            ? Math.min(100, Math.round((billableMins / availableMinutes) * 100))
            : 0;

          return {
            staffId:          staff.id,
            name:             staff.name,
            role:             staff.role,
            avatarInitials:   staff.avatarInitials ?? staff.name.slice(0, 2).toUpperCase(),
            avatarColor:      staff.avatarColor ?? null,
            billableHours,
            totalHours,
            utilisationRate,
            target:           TARGET_UTILISATION,
          };
        });

        const totalBillableHours = rows.reduce((s, r) => s + r.billableHours, 0);
        const avgBillableRate = rows.length > 0
          ? Math.round(rows.reduce((s, r) => s + r.utilisationRate, 0) / rows.length)
          : 0;

        return {
          staff: rows,
          summary: {
            avgBillableRate,
            totalBillableHours: Math.round(totalBillableHours * 10) / 10,
            teamSize: rows.length,
          }
        };
      });

      cache.del(`admin:utilisation:${period}`); // always fresh on next load
      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: { code: "UTILISATION_FETCH_FAILED", message: "Unable to compute staff utilisation." }
      } as ApiResponse;
    }
  });

  // ── GET /staff/workload-heatmap ───────────────────────────────────────────
  /** 4-week workload capacity heatmap: allocated vs available hours per staff */
  app.get("/staff/workload-heatmap", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const { weeks: weeksParam } = request.query as { weeks?: string };
    const numWeeks = Math.min(12, Math.max(1, parseInt(weeksParam ?? "4", 10) || 4));

    try {
      const cacheKey = `staff:workload-heatmap:${numWeeks}`;
      const data = await withCache(cacheKey, 60, async () => {
        const now = new Date();

        // Build week windows: Mon–Sun starting from current week
        const weekWindows: Array<{ label: string; start: Date; end: Date }> = [];
        for (let i = 0; i < numWeeks; i++) {
          const monday = startOfWeek(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i * 7));
          const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
          const label = `${monday.toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}–${sunday.toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}`;
          weekWindows.push({ label, start: monday, end: sunday });
        }

        // Load all active staff profiles
        const staffList = await prisma.staffProfile.findMany({
          where: { isActive: true },
          select: { id: true, name: true, role: true, userId: true },
          orderBy: { name: "asc" },
        });

        // Load approved leave requests overlapping any week window
        const windowStart = weekWindows[0].start;
        const windowEnd   = weekWindows[weekWindows.length - 1].end;

        const leaveRequests = await prisma.leaveRequest.findMany({
          where: {
            status: "APPROVED",
            startDate: { lte: windowEnd },
            endDate:   { gte: windowStart },
          },
          select: { staffId: true, startDate: true, endDate: true, days: true },
        });

        // Load project tasks with collaborator assignments and due dates
        const taskCollaborators = await prisma.projectTaskCollaborator.findMany({
          where: {
            staffUserId: { not: null },
          },
          select: {
            staffUserId: true,
            task: {
              select: {
                dueAt:           true,
                estimateMinutes: true,
                status:          true,
              },
            },
          },
        });

        // Build staff rows
        const staffRows = staffList.map((staff) => {
          const weekData = weekWindows.map((win) => {
            // Compute leave hours for this window
            const staffLeave = leaveRequests.filter((lr) => lr.staffId === staff.id);
            let leaveHours = 0;
            for (const lr of staffLeave) {
              const leaveStart = new Date(lr.startDate);
              const leaveEnd   = new Date(lr.endDate);
              const overlapStart = leaveStart < win.start ? win.start : leaveStart;
              const overlapEnd   = leaveEnd   > win.end   ? win.end   : leaveEnd;
              if (overlapStart <= overlapEnd) {
                const days = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                leaveHours += days * 8;
              }
            }
            const availableHours = Math.max(0, 40 - leaveHours);

            // Compute allocated hours from tasks due in this window
            const staffTasks = taskCollaborators.filter((tc) =>
              tc.staffUserId === staff.userId &&
              tc.task.status !== "DONE" &&
              tc.task.dueAt !== null &&
              tc.task.dueAt >= win.start &&
              tc.task.dueAt <= win.end
            );
            let allocatedHours = 0;
            for (const tc of staffTasks) {
              if (tc.task.estimateMinutes != null && tc.task.estimateMinutes > 0) {
                allocatedHours += tc.task.estimateMinutes / 60;
              } else {
                allocatedHours += 8; // default 8h per task
              }
            }
            allocatedHours = Math.round(allocatedHours * 10) / 10;

            return {
              weekLabel:      win.label,
              allocatedHours,
              availableHours,
            };
          });

          return {
            staffId: staff.id,
            name:    staff.name,
            role:    staff.role,
            weeks:   weekData,
          };
        });

        return { staff: staffRows };
      });

      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: { code: "WORKLOAD_HEATMAP_FAILED", message: "Unable to compute workload heatmap." }
      } as ApiResponse;
    }
  });

  // ── GET /admin/capacity-forecast ────────────────────────────────────────
  /** 30/60/90-day staffing capacity forecast for hiring decisions (ADMIN only). */
  app.get("/admin/capacity-forecast", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Capacity forecast is available to ADMIN only." }
      } as ApiResponse);
    }

    try {
      const cacheKey = `admin:capacity-forecast`;
      const data = await withCache(cacheKey, 60, async () => {
        const now = new Date();

        // ── Count working days in a window ──────────────────────────────
        function countWorkingDays(start: Date, end: Date): number {
          let count = 0;
          const cur = new Date(start);
          while (cur <= end) {
            const dow = cur.getDay();
            if (dow !== 0 && dow !== 6) count++;
            cur.setDate(cur.getDate() + 1);
          }
          return count;
        }

        // Build 3 windows
        const windows = [
          { label: "Next 30 days" as const,  from: new Date(now.getTime() + 1), to: new Date(now.getTime() + 30 * 86400000) },
          { label: "31-60 days"  as const,   from: new Date(now.getTime() + 31 * 86400000), to: new Date(now.getTime() + 60 * 86400000) },
          { label: "61-90 days"  as const,   from: new Date(now.getTime() + 61 * 86400000), to: new Date(now.getTime() + 90 * 86400000) },
        ];

        // ── Fetch staff profiles (active only) ──────────────────────────
        const allStaff = await prisma.staffProfile.findMany({
          where:  { isActive: true },
          select: { id: true, name: true, role: true, userId: true }
        });

        const staffCount = allStaff.length;

        // ── Fetch approved leave requests that overlap each window ───────
        const leaveRequests = await prisma.leaveRequest.findMany({
          where: {
            status:    "APPROVED",
            startDate: { lte: new Date(now.getTime() + 91 * 86400000) },
            endDate:   { gte: now }
          },
          select: { staffId: true, startDate: true, endDate: true, days: true }
        });

        // ── Fetch active project remaining hours (from open tasks) ───────
        const activeTasks = await prisma.projectTask.findMany({
          where: {
            status:          { notIn: ["DONE", "CANCELLED"] },
            estimateMinutes: { gt: 0 }
          },
          select: { estimateMinutes: true, progressPercent: true }
        });

        const activeProjectRemainingHours = activeTasks.reduce((sum, t) => {
          const totalH = (t.estimateMinutes ?? 0) / 60;
          const doneFraction = (t.progressPercent ?? 0) / 100;
          const remaining = Math.max(0, totalH * (1 - doneFraction));
          return sum + remaining;
        }, 0);

        // ── Fetch pipeline leads count (no value field on Lead model) ────
        const pipelineLeadCount = await prisma.lead.count({
          where: { status: { in: ["PROPOSAL", "NEGOTIATION", "QUALIFIED"] } }
        });

        // Estimate pipeline hours: 80h per pipeline lead as a rough proxy
        const pipelineHours = pipelineLeadCount * 80;

        const totalDemandHours90d = activeProjectRemainingHours + pipelineHours;

        // ── Build per-period metrics ─────────────────────────────────────
        const periods = windows.map((w) => {
          const workingDays = countWorkingDays(w.from, w.to);

          // Leave reduction per period
          const leaveHoursInPeriod = leaveRequests.reduce((sum, lr) => {
            const lrStart = new Date(lr.startDate);
            const lrEnd   = new Date(lr.endDate);
            const overlapStart = lrStart < w.from ? w.from : lrStart;
            const overlapEnd   = lrEnd   > w.to   ? w.to   : lrEnd;
            if (overlapStart > overlapEnd) return sum;
            const overlapDays = Math.max(0, Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1);
            return sum + overlapDays * 8;
          }, 0);

          const totalCapacityHours = Math.max(0, staffCount * workingDays * 8 - leaveHoursInPeriod);

          // Distribute 90d demand evenly across 3 windows weighted by capacity days
          const periodWeight = workingDays / (22 + 22 + 22); // approx 66 working days in 90d
          const projectedDemandHours = Math.round(totalDemandHours90d * periodWeight);

          const utilizationRate = pct(projectedDemandHours, totalCapacityHours);
          const surplus = totalCapacityHours - projectedDemandHours;

          return {
            label: w.label,
            totalCapacityHours,
            projectedDemandHours,
            utilizationRate,
            surplus
          };
        });

        // ── Per-staff forecast ───────────────────────────────────────────
        const staffForecast = allStaff.map((s) => {
          // Leave days per window for this staff member
          function leaveHoursForStaff(from: Date, to: Date): number {
            return leaveRequests
              .filter((lr) => lr.staffId === s.id)
              .reduce((sum, lr) => {
                const lrStart = new Date(lr.startDate);
                const lrEnd   = new Date(lr.endDate);
                const overlapStart = lrStart < from ? from : lrStart;
                const overlapEnd   = lrEnd   > to   ? to   : lrEnd;
                if (overlapStart > overlapEnd) return sum;
                const overlapDays = Math.max(0, Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1);
                return sum + overlapDays * 8;
              }, 0);
          }

          const w0 = windows[0];
          const w1 = windows[1];
          const w2 = windows[2];

          const wd0 = countWorkingDays(w0.from, w0.to);
          const wd1 = countWorkingDays(w1.from, w1.to);
          const wd2 = countWorkingDays(w2.from, w2.to);

          const available0 = Math.max(0, wd0 * 8 - leaveHoursForStaff(w0.from, w0.to));
          const available1 = Math.max(0, wd1 * 8 - leaveHoursForStaff(w1.from, w1.to));
          const available2 = Math.max(0, wd2 * 8 - leaveHoursForStaff(w2.from, w2.to));

          // Evenly distribute demand per staff (demand / staffCount)
          const demandPerStaff0 = staffCount > 0 ? Math.round(periods[0].projectedDemandHours / staffCount) : 0;
          const demandPerStaff1 = staffCount > 0 ? Math.round(periods[1].projectedDemandHours / staffCount) : 0;
          const demandPerStaff2 = staffCount > 0 ? Math.round(periods[2].projectedDemandHours / staffCount) : 0;

          function statusFor(allocated: number, available: number): "OVER" | "NEAR" | "OK" {
            const util = available > 0 ? (allocated / available) * 100 : 0;
            if (util > 100) return "OVER";
            if (util > 80)  return "NEAR";
            return "OK";
          }

          return {
            staffId:          s.id,
            name:             s.name,
            role:             s.role,
            allocatedHours30d: demandPerStaff0,
            allocatedHours60d: demandPerStaff1,
            allocatedHours90d: demandPerStaff2,
            availableHours30d: available0,
            status30d:         statusFor(demandPerStaff0, available0)
          };
        });

        // ── Hiring signal from 90-day utilisation ────────────────────────
        const util90 = periods[2].utilizationRate;
        let hiringSignal: "OVERSTAFFED" | "BALANCED" | "UNDER_CAPACITY" | "CRITICAL";
        if (util90 > 90)       hiringSignal = "CRITICAL";
        else if (util90 > 75)  hiringSignal = "UNDER_CAPACITY";
        else if (util90 < 40)  hiringSignal = "OVERSTAFFED";
        else                   hiringSignal = "BALANCED";

        // Recommended hires: how many staff needed to bring 90d util to 75%
        const targetCapacity90 = Math.ceil(periods[2]!.projectedDemandHours / 0.75);
        const currentCapacity90 = periods[2]!.totalCapacityHours;
        const hoursGap = Math.max(0, targetCapacity90 - currentCapacity90);
        const win2 = windows[2];
        const hoursPerStaff90 = win2 ? countWorkingDays(win2.from, win2.to) * 8 : 176;
        const recommendedHires = hoursPerStaff90 > 0 ? Math.ceil(hoursGap / hoursPerStaff90) : 0;

        return { periods, staffForecast, hiringSignal, recommendedHires };
      });

      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: { code: "CAPACITY_FORECAST_FAILED", message: "Unable to compute capacity forecast." }
      } as ApiResponse;
    }
  });
}
