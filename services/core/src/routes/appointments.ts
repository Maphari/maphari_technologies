// ════════════════════════════════════════════════════════════════════════════
// appointments.ts — Appointment Booking routes
// Service : core  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : CLIENT read-own + create; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { withCache, CacheKeys, cache, eventBus } from "../lib/infrastructure.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { createDailyRoom, deleteDailyRoom } from "../lib/daily.js";

// ── Route registration ────────────────────────────────────────────────────────
export async function registerAppointmentRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /appointments — list all (admin/staff) or own (client) ────────────
  app.get("/appointments", async (request) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);

    const where = scopedClientId ? { clientId: scopedClientId } : {};
    const cacheKey = scopedClientId
      ? CacheKeys.appointments(scopedClientId)
      : CacheKeys.appointments("all");

    const data = await withCache(cacheKey, 60, () =>
      prisma.appointment.findMany({
        where,
        orderBy: { scheduledAt: "asc" }
      })
    );

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<typeof data>;
  });

  // ── GET /appointments/:id ─────────────────────────────────────────────────
  app.get("/appointments/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };

    const appt = await prisma.appointment.findFirst({
      where: scope.role === "CLIENT"
        ? { id, clientId: scope.clientId ?? "" }
        : { id },
    });

    if (!appt) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Appointment not found." } } as ApiResponse);

    return { success: true, data: appt, meta: { requestId: scope.requestId } } as ApiResponse<typeof appt>;
  });

  // ── POST /appointments ────────────────────────────────────────────────────
  app.post("/appointments", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = request.body as {
      clientId: string;
      type: string;
      scheduledAt: string;
      durationMins: number;
      ownerName?: string;
      notes?: string;
    };

    // CLIENT can only book for themselves
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== body.clientId) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    const created = await prisma.appointment.create({
      data: {
        clientId: body.clientId,
        type: body.type,
        scheduledAt: new Date(body.scheduledAt),
        durationMins: body.durationMins,
        ownerName: body.ownerName ?? null,
        status: "SCHEDULED",
        notes: body.notes ?? null
      }
    });

    // After creating appointment, try to create a video room
    const room = await createDailyRoom({
      name:        `appt-${created.id.slice(0, 8)}`,
      startsAt:    created.scheduledAt,
      durationMin: created.durationMins,
    });

    const finalAppointment = room
      ? await prisma.appointment.update({
          where: { id: created.id },
          data: {
            videoRoomUrl:    room.url,
            videoProvider:   "daily",
            videoCallStatus: "SCHEDULED",
          },
        })
      : created;

    await cache.delete(CacheKeys.appointments(body.clientId));
    await cache.delete(CacheKeys.appointments("all"));

    // Fire appointment-created event so staff/admin get notified
    try {
      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId,
        topic: EventTopics.appointmentCreated,
        payload: {
          appointmentId: finalAppointment.id,
          clientId: finalAppointment.clientId,
          type: finalAppointment.type,
          scheduledAt: finalAppointment.scheduledAt.toISOString(),
          durationMins: finalAppointment.durationMins,
          ownerName: finalAppointment.ownerName ?? null,
          videoRoomUrl: finalAppointment.videoRoomUrl ?? null,
        },
      });
    } catch (_) { /* best-effort — don't block response */ }

    return reply.code(201).send({ success: true, data: finalAppointment, meta: { requestId: scope.requestId } } as ApiResponse<typeof finalAppointment>);
  });

  // ── PATCH /appointments/:id ───────────────────────────────────────────────
  app.patch("/appointments/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const { id } = request.params as { id: string };
    const body = request.body as {
      type?: string;
      scheduledAt?: string;
      durationMins?: number;
      ownerName?: string;
      status?: string;
      notes?: string;
    };

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Appointment not found." } } as ApiResponse);
    }

    // CLIENT can only update their own appointments
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (scopedClientId && scopedClientId !== existing.clientId) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }

    // If cancelling and there is a video room, clean it up
    if (body.status === "CANCELLED" && existing.videoRoomUrl) {
      const roomName = `appt-${existing.id.slice(0, 8)}`;
      await deleteDailyRoom(roomName);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        type: body.type ?? existing.type,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : existing.scheduledAt,
        durationMins: body.durationMins ?? existing.durationMins,
        ownerName: body.ownerName !== undefined ? body.ownerName : existing.ownerName,
        status: body.status ?? existing.status,
        notes: body.notes !== undefined ? body.notes : existing.notes
      }
    });

    await cache.delete(CacheKeys.appointments(existing.clientId));
    await cache.delete(CacheKeys.appointments("all"));

    return { success: true, data: updated, meta: { requestId: scope.requestId } } as ApiResponse<typeof updated>;
  });
}
