// ════════════════════════════════════════════════════════════════════════════
// meetings.ts — Meeting archive routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : CLIENT read-own; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { cache, CacheKeys, withCache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerMeetingRoutes(app: FastifyInstance): Promise<void> {

  /** GET /meetings — list all MeetingRecords scoped to the authenticated client */
  app.get("/meetings", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    const where = scopedClientId ? { clientId: scopedClientId } : {};
    const cacheKey = CacheKeys.meetings(scopedClientId ?? "all");

    try {
      const data = await withCache(cacheKey, 60, () =>
        prisma.meetingRecord.findMany({
          where,
          orderBy: { meetingAt: "desc" },
        })
      );
      return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "MEETINGS_FETCH_FAILED", message: "Unable to fetch meetings." } } as ApiResponse;
    }
  });

  /** POST /meetings/:id/mood — set clientMoodRating (1–5) on a MeetingRecord */
  app.post("/meetings/:id/mood", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };
    const body = request.body as { rating: number };

    const rating = Number(body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "rating must be an integer between 1 and 5." },
      } as ApiResponse;
    }

    try {
      const meeting = await prisma.meetingRecord.findFirst({
        where: scope.role === "CLIENT"
          ? { id, clientId: scope.clientId ?? "" }
          : { id },
      });

      if (!meeting) {
        reply.status(404);
        return { success: false, error: { code: "NOT_FOUND", message: "Meeting not found." } } as ApiResponse;
      }

      const updated = await prisma.meetingRecord.update({
        where: { id },
        data: { clientMoodRating: rating },
      });

      await cache.delete(CacheKeys.meetings(meeting.clientId));
      await cache.delete(CacheKeys.meetings("all"));

      return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { success: false, error: { code: "MOOD_UPDATE_FAILED", message: "Unable to update meeting rating." } } as ApiResponse;
    }
  });
}
