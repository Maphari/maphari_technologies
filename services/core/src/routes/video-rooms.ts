// ════════════════════════════════════════════════════════════════════════════
// video-rooms.ts — Ad-hoc video room creation for staff/admin
// Service : core  |  Scope: ADMIN + STAFF only; CLIENT forbidden
// ════════════════════════════════════════════════════════════════════════════
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { readScopeHeaders } from "../lib/scope.js";
import { createDailyRoom } from "../lib/daily.js";

export async function registerVideoRoomRoutes(app: FastifyInstance): Promise<void> {

  // POST /video-rooms — create an ad-hoc room immediately
  app.post("/video-rooms", async (request, reply) => {
    const scope = readScopeHeaders(request);

    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Clients cannot create ad-hoc video rooms." }
      } as ApiResponse);
    }

    const body = request.body as { topic?: string };
    const roomName = `adhoc-${scope.userId?.slice(0, 8) ?? "anon"}-${Date.now()}`;

    const room = await createDailyRoom({
      name:        roomName,
      startsAt:    new Date(),
      durationMin: 120, // 2-hour ad-hoc rooms
    });

    if (!room) {
      return reply.code(503).send({
        success: false,
        error: { code: "VIDEO_UNAVAILABLE", message: "Video service is not configured. Set DAILY_API_KEY." }
      } as ApiResponse);
    }

    return reply.code(201).send({
      success: true,
      data: {
        roomUrl:          room.url,
        roomName:         room.name,
        topic:            body.topic ?? "Ad-hoc Meeting",
        createdBy:        scope.userId ?? null,
        expiresInMinutes: 240,
      },
    } as ApiResponse<{ roomUrl: string; roomName: string; topic: string; createdBy: string | null; expiresInMinutes: number }>);
  });
}
