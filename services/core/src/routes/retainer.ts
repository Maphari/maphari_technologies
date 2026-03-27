import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { prisma } from "../lib/prisma.js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RetainerWeekRow {
  week: string;
  weekStart: string;
  dev: number;
  design: number;
  pm: number;
  qa: number;
  total: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the Monday (ISO week start) for any given date.
 */
function isoWeekStart(date: Date): Date {
  const d = new Date(date);
  // getDay() returns 0=Sun, 1=Mon … 6=Sat
  const day = d.getUTCDay(); // use UTC so there are no timezone shifts
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Format a Date as YYYY-MM-DD (UTC).
 */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Convert minutes to hours rounded to 1 decimal place.
 */
function minsToHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

/**
 * Map a taskLabel to one of the four service categories.
 */
function categorise(taskLabel: string | null): "design" | "qa" | "pm" | "dev" {
  const label = (taskLabel ?? "").toLowerCase();
  if (label.includes("design")) return "design";
  if (label.includes("qa") || label.includes("test")) return "qa";
  if (label.includes("pm") || label.includes("manage")) return "pm";
  return "dev";
}

// ── Route registration ────────────────────────────────────────────────────────

export async function registerRetainerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/retainer", async (request, reply) => {
    const scope = readScopeHeaders(request);

    // ADMIN/STAFF can narrow by an explicit ?clientId= query param
    const queryClientId = (request.query as Record<string, string | undefined>).clientId;
    const clientId = resolveClientFilter(scope.role, scope.clientId, queryClientId);

    // Only look back 8 ISO weeks from the start of the current week
    const now = new Date();
    const currentWeekStart = isoWeekStart(now);
    const windowStart = new Date(currentWeekStart);
    windowStart.setUTCDate(windowStart.getUTCDate() - 8 * 7); // 8 weeks back

    try {
      const entries = await prisma.projectTimeEntry.findMany({
        where: {
          ...(clientId ? { clientId } : {}),
          OR: [
            { startedAt: { gte: windowStart } },
            { startedAt: null, createdAt: { gte: windowStart } }
          ]
        },
        select: {
          taskLabel: true,
          minutes: true,
          startedAt: true,
          createdAt: true
        },
        orderBy: { createdAt: "asc" }
      });

      // Bucket entries by their ISO week start date string
      const buckets = new Map<
        string,
        { weekStartDate: Date; dev: number; design: number; pm: number; qa: number }
      >();

      for (const entry of entries) {
        const entryDate = entry.startedAt ?? entry.createdAt;
        const ws = isoWeekStart(entryDate);
        const key = toDateString(ws);

        if (!buckets.has(key)) {
          buckets.set(key, { weekStartDate: ws, dev: 0, design: 0, pm: 0, qa: 0 });
        }

        const bucket = buckets.get(key)!;
        const category = categorise(entry.taskLabel);
        bucket[category] += entry.minutes;
      }

      // Sort by week start ascending and build the response array
      const sortedKeys = Array.from(buckets.keys()).sort();

      const rows: RetainerWeekRow[] = sortedKeys.map((key, index) => {
        const bucket = buckets.get(key)!;
        const dev = minsToHours(bucket.dev);
        const design = minsToHours(bucket.design);
        const pm = minsToHours(bucket.pm);
        const qa = minsToHours(bucket.qa);

        return {
          week: `Week ${index + 1}`,
          weekStart: key,
          dev,
          design,
          pm,
          qa,
          total: Math.round((dev + design + pm + qa) * 10) / 10
        };
      });

      return {
        success: true,
        data: rows,
        meta: { requestId: scope.requestId }
      } as ApiResponse<RetainerWeekRow[]>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: { code: "RETAINER_FETCH_FAILED", message: "Unable to load retainer time data" }
      } as ApiResponse;
    }
  });
}
