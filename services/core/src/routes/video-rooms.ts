// ════════════════════════════════════════════════════════════════════════════
// video-rooms.ts — Video room creation routes
// Service : core
// POST /video-rooms               → ADMIN + STAFF only (ad-hoc rooms)
// POST /portal/video-rooms/instant → CLIENT + ADMIN + STAFF (instant rooms)
// ════════════════════════════════════════════════════════════════════════════
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { readScopeHeaders } from "../lib/scope.js";
import { createLiveKitRoom, getRecordingsByRoom } from "../lib/livekit.js";

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

    const room = await createLiveKitRoom({
      name:        roomName,
      durationMin: 120, // 2-hour ad-hoc rooms
    });

    if (!room) {
      return reply.code(503).send({
        success: false,
        error: { code: "VIDEO_UNAVAILABLE", message: "Video service is not configured. Set LIVEKIT_API_KEY / LIVEKIT_API_SECRET / LIVEKIT_WS_URL." }
      } as ApiResponse);
    }

    return reply.code(201).send({
      success: true,
      data: {
        roomUrl:          room.joinUrl,
        roomName:         room.name,
        topic:            body.topic ?? "Ad-hoc Meeting",
        createdBy:        scope.userId ?? null,
        expiresInMinutes: 120,
      },
    } as ApiResponse<{ roomUrl: string; roomName: string; topic: string; createdBy: string | null; expiresInMinutes: number }>);
  });

  // POST /portal/video-rooms/instant — CLIENT / ADMIN / STAFF can create instant rooms
  app.post("/portal/video-rooms/instant", async (request, reply) => {
    const scope = readScopeHeaders(request);
    // Defence-in-depth: reject unknown roles (gateway already enforces CLIENT/ADMIN/STAFF)
    if (!["CLIENT", "ADMIN", "STAFF"].includes(scope.role)) {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse;
    }
    const clientId = scope.clientId ?? "unknown";
    const roomName = `instant-${clientId.slice(0, 8)}-${Date.now()}`;

    const room = await createLiveKitRoom({
      name:        roomName,
      durationMin: 60,  // 1-hour instant rooms
    });

    if (!room) {
      reply.status(503);
      return {
        success: false,
        error: { code: "VIDEO_UNAVAILABLE", message: "Video service is not currently available. Please book a scheduled call instead." }
      } as ApiResponse;
    }

    reply.status(201);
    return {
      success: true,
      data: {
        joinUrl:   room.joinUrl,
        roomName:  room.name,
        expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    } as ApiResponse<{ joinUrl: string; roomName: string; expiresAt: string; createdAt: string }>;
  });

  // GET /video-rooms/:roomName/recordings — ADMIN + STAFF only
  app.get("/video-rooms/:roomName/recordings", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied." }
      } as ApiResponse);
    }
    const { roomName } = request.params as { roomName: string };
    const recordings = await getRecordingsByRoom(roomName);
    return reply.code(200).send({
      success: true,
      data: recordings,
      meta: { requestId: scope.requestId, count: recordings.length }
    } as ApiResponse<typeof recordings>);
  });
}
