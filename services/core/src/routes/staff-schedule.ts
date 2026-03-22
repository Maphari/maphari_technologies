// ════════════════════════════════════════════════════════════════════════════
// staff-schedule.ts — Staff scheduling timeline route
// Service : core  |  Scope: ADMIN only
// Endpoint: GET /admin/staff-schedule
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StaffScheduleWeek {
  weekStart: string; // ISO date string (YYYY-MM-DD)
  status: "available" | "partial" | "on-leave";
  leaveReason?: string;
  projectAssignments: Array<{ projectId: string; projectName: string }>;
}

export interface StaffScheduleEntry {
  staffId: string;
  staffName: string;
  role: string;
  weeklyCapacity: number; // hours (default 40)
  weeks: StaffScheduleWeek[];
}

// ── Route registration ────────────────────────────────────────────────────────

export async function registerStaffScheduleRoutes(app: FastifyInstance): Promise<void> {
  app.get("/admin/staff-schedule", async (request, reply) => {
    const scope = readScopeHeaders(request);

    if (scope.role !== "ADMIN") {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin access required." },
      } as ApiResponse);
    }

    const query = request.query as Record<string, string>;
    const weekStartParam = query.weekStart ?? new Date().toISOString().split("T")[0];
    const weeksAhead = Math.min(parseInt(query.weeksAhead ?? "8", 10) || 8, 52);

    // Build week boundaries
    const startDate = new Date(weekStartParam);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeksAhead * 7);

    const weeks: Date[] = [];
    for (let i = 0; i < weeksAhead; i++) {
      const w = new Date(startDate);
      w.setDate(w.getDate() + i * 7);
      weeks.push(w);
    }

    // Fetch active staff
    const staff = await prisma.staffProfile.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    // Fetch approved leaves in window
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    // Fetch project assignments for active staff via ProjectTaskCollaborator
    // staffUserId is the field linking to auth userId; staffProfile also has userId
    const staffUserIds = staff
      .map((s) => s.userId)
      .filter((uid): uid is string => uid !== null);

    const collabs = staffUserIds.length > 0
      ? await prisma.projectTaskCollaborator.findMany({
          where: {
            staffUserId: { in: staffUserIds },
            active: true,
          },
          include: {
            task: {
              include: {
                project: { select: { id: true, name: true } },
              },
            },
          },
        })
      : [];

    // Build a map of staffUserId → unique projects
    const projectsByUserId = new Map<
      string,
      Array<{ projectId: string; projectName: string }>
    >();
    for (const collab of collabs) {
      if (!collab.staffUserId) continue;
      const proj = collab.task?.project;
      if (!proj) continue;
      const existing = projectsByUserId.get(collab.staffUserId) ?? [];
      if (!existing.find((p) => p.projectId === proj.id)) {
        existing.push({ projectId: proj.id, projectName: proj.name });
      }
      projectsByUserId.set(collab.staffUserId, existing);
    }

    const entries: StaffScheduleEntry[] = staff.map((s) => {
      const staffLeaves = leaves.filter((l) => l.staffId === s.id);
      const staffProjects = s.userId
        ? (projectsByUserId.get(s.userId) ?? [])
        : [];

      const weekData: StaffScheduleWeek[] = weeks.map((weekStart) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const leave = staffLeaves.find(
          (l) => l.startDate <= weekEnd && l.endDate >= weekStart
        );

        let status: "available" | "partial" | "on-leave" = "available";
        let leaveReason: string | undefined;

        if (leave) {
          // Full week on leave if leave spans the entire week
          if (leave.startDate <= weekStart && leave.endDate >= weekEnd) {
            status = "on-leave";
          } else {
            status = "partial";
          }
          leaveReason = leave.type;
        } else if (staffProjects.length > 0) {
          status = "partial"; // Has active assignments
        }

        return {
          weekStart: weekStart.toISOString().split("T")[0] as string,
          status,
          leaveReason,
          projectAssignments: leave ? [] : staffProjects,
        };
      });

      return {
        staffId: s.id,
        staffName: s.name,
        role: s.role,
        weeklyCapacity: 40,
        weeks: weekData,
      };
    });

    return {
      success: true,
      data: entries,
      meta: { requestId: scope.requestId },
    } as ApiResponse<StaffScheduleEntry[]>;
  });
}
