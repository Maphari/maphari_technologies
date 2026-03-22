// ════════════════════════════════════════════════════════════════════════════
// calendar.ts — Unified Calendar endpoint
// Service : core  |  Cache TTL: 30 s (GET)
// Scope   : ADMIN sees all; STAFF sees all appointments + all projects;
//            CLIENT sees own appointments + own milestones
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  type: "appointment" | "milestone" | "sprint_deadline";
  title: string;
  date: string;         // ISO date string
  clientName?: string;
  projectName?: string;
  status?: string;
  sourceId: string;     // original record ID
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerCalendarRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /calendar/events?from=ISO_DATE&to=ISO_DATE ────────────────────────
  app.get("/calendar/events", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const query = request.query as Record<string, string>;

    const fromStr = query.from;
    const toStr   = query.to;

    const fromDate = fromStr ? new Date(fromStr) : (() => {
      const d = new Date(); d.setDate(d.getDate() - 7); return d;
    })();
    const toDate   = toStr ? new Date(toStr) : (() => {
      const d = new Date(); d.setDate(d.getDate() + 60); return d;
    })();

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      reply.code(400);
      return { success: false, error: { code: "INVALID_DATE_RANGE", message: "from/to must be valid ISO date strings." } } as ApiResponse;
    }

    try {
      const events: CalendarEvent[] = [];

      // ── 1. Appointments ──────────────────────────────────────────────────
      // ADMIN: all; STAFF: all; CLIENT: own only
      const apptWhere = {
        scheduledAt: { gte: fromDate, lte: toDate },
        ...(scope.role === "CLIENT" ? { clientId: scope.clientId ?? "" } : {}),
      };

      const appointments = await prisma.appointment.findMany({
        where: apptWhere,
        include: { client: { select: { name: true } } },
        orderBy: { scheduledAt: "asc" },
      });

      for (const appt of appointments) {
        events.push({
          id:         `appt-${appt.id}`,
          type:       "appointment",
          title:      appt.notes ?? appt.type,
          date:       appt.scheduledAt.toISOString(),
          clientName: appt.client.name,
          status:     appt.status,
          sourceId:   appt.id,
        });
      }

      // ── 2. Project Milestones ────────────────────────────────────────────
      // ADMIN: all; STAFF: all; CLIENT: own projects only
      const milestoneWhere = {
        dueAt: { gte: fromDate, lte: toDate },
        ...(scope.role === "CLIENT"
          ? { project: { clientId: scope.clientId ?? "" } }
          : {}),
      };

      const milestones = await prisma.projectMilestone.findMany({
        where: milestoneWhere,
        include: { project: { select: { name: true, client: { select: { name: true } } } } },
        orderBy: { dueAt: "asc" },
      });

      for (const ms of milestones) {
        if (!ms.dueAt) continue;
        events.push({
          id:          `ms-${ms.id}`,
          type:        "milestone",
          title:       ms.title,
          date:        ms.dueAt.toISOString(),
          clientName:  ms.project.client.name,
          projectName: ms.project.name,
          status:      ms.status,
          sourceId:    ms.id,
        });
      }

      // ── 3. Sprint deadlines — ADMIN and STAFF only ────────────────────────
      if (scope.role !== "CLIENT") {
        const sprintWhere = {
          endAt: { gte: fromDate, lte: toDate },
        };

        const sprints = await prisma.projectSprint.findMany({
          where: sprintWhere,
          include: { project: { select: { name: true, client: { select: { name: true } } } } },
          orderBy: { endAt: "asc" },
        });

        for (const sp of sprints) {
          if (!sp.endAt) continue;
          events.push({
            id:          `sprint-${sp.id}`,
            type:        "sprint_deadline",
            title:       `Sprint: ${sp.name}`,
            date:        sp.endAt.toISOString(),
            clientName:  sp.project.client.name,
            projectName: sp.project.name,
            status:      sp.status,
            sourceId:    sp.id,
          });
        }
      }

      // Sort all events chronologically
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        success: true,
        data: events,
        meta: { requestId: scope.requestId, count: events.length },
      } as ApiResponse<CalendarEvent[]>;

    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: { code: "CALENDAR_FETCH_FAILED", message: "Failed to fetch calendar events." },
      } as ApiResponse;
    }
  });
}
