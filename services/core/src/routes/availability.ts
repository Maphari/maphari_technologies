// ════════════════════════════════════════════════════════════════════════════
// availability.ts — Client self-serve booking
// GET    /portal/availability        → list open slots (next 14 days)
// POST   /portal/availability        → ADMIN: create slot
// POST   /portal/appointments/book   → CLIENT: book a slot
// DELETE /portal/availability/:id    → ADMIN: delete slot
// ════════════════════════════════════════════════════════════════════════════
import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";
import { readScopeHeaders } from "../lib/scope.js";
import { createDailyRoom } from "../lib/daily.js";

export async function registerAvailabilityRoutes(app: FastifyInstance): Promise<void> {

  // GET /portal/availability — list open slots for next 14 days
  app.get("/portal/availability", async (request) => {
    const scope = readScopeHeaders(request);
    const now = new Date();
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 3_600_000);

    const slots = await prisma.availabilitySlot.findMany({
      where: { booked: false, startsAt: { gte: now, lte: twoWeeks } },
      orderBy: { startsAt: "asc" },
    });
    return { success: true, data: slots, meta: { requestId: scope.requestId } } as ApiResponse<typeof slots>;
  });

  // POST /portal/availability — ADMIN creates a slot
  app.post("/portal/availability", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    if (!scope.userId) {
      return reply.code(403).send({ success: false, error: { code: "USER_ID_REQUIRED", message: "User ID required." } } as ApiResponse);
    }
    const body = request.body as { startsAt: string; endsAt: string };
    if (!body.startsAt || !body.endsAt) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "startsAt and endsAt are required." } } as ApiResponse);
    }
    const slot = await prisma.availabilitySlot.create({
      data: {
        adminId:  scope.userId,
        startsAt: new Date(body.startsAt),
        endsAt:   new Date(body.endsAt),
      },
    });
    return reply.code(201).send({ success: true, data: slot } as ApiResponse<typeof slot>);
  });

  // POST /portal/appointments/book — CLIENT books a slot
  app.post("/portal/appointments/book", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Client only." } } as ApiResponse);
    }
    if (!scope.clientId) {
      return reply.code(403).send({ success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID required to book." } } as ApiResponse);
    }
    const body = request.body as { slotId: string; topic?: string; projectId?: string };
    if (!body.slotId) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "slotId is required." } } as ApiResponse);
    }

    const slot = await prisma.availabilitySlot.findUnique({ where: { id: body.slotId } });
    if (!slot || slot.booked) {
      return reply.code(409).send({ success: false, error: { code: "SLOT_UNAVAILABLE", message: "Slot is no longer available." } } as ApiResponse);
    }

    const roomName = `booking-${body.slotId.slice(0, 8)}-${Date.now()}`;
    const durationMins = Math.round((slot.endsAt.getTime() - slot.startsAt.getTime()) / 60_000) || 60;

    // Create Daily.co room BEFORE the transaction (external API call — must not be inside tx)
    const room = await createDailyRoom({ name: roomName, startsAt: slot.startsAt, durationMin: durationMins }).catch(() => null);
    if (!room) {
      console.warn("[availability] Daily.co room creation failed for slot", body.slotId, "— appointment will have no video URL");
    }

    let appointment;
    try {
      appointment = await prisma.$transaction(async (tx) => {
        // Atomic check-and-mark: only succeeds if the slot is still unbooked
        const updated = await tx.availabilitySlot.updateMany({
          where: { id: body.slotId, booked: false },
          data: { booked: true },
        });
        if (updated.count === 0) {
          throw new Error("SLOT_UNAVAILABLE");
        }

        const appt = await tx.appointment.create({
          data: {
            clientId:     scope.clientId,
            scheduledAt:  slot.startsAt,
            durationMins: durationMins,
            type:         "CHECK_IN",
            notes:        body.topic ?? "Client Meeting",
            videoRoomUrl: room?.url ?? null,
            status:       "PENDING",
          },
        });

        // Link the slot back to the new appointment
        await tx.availabilitySlot.update({
          where: { id: body.slotId },
          data: { appointmentId: appt.id },
        });

        return appt;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === "SLOT_UNAVAILABLE") {
        return reply.code(409).send({ success: false, error: { code: "SLOT_UNAVAILABLE", message: "Slot is no longer available." } } as ApiResponse);
      }
      throw err;
    }

    return reply.code(201).send({
      success: true,
      data: { appointment, videoRoomUrl: room?.url ?? null },
    } as ApiResponse);
  });

  // DELETE /portal/availability/:id — ADMIN removes a slot
  app.delete("/portal/availability/:id", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin only." } } as ApiResponse);
    }
    const { id } = request.params as { id: string };
    try {
      await prisma.availabilitySlot.delete({ where: { id } });
      return { success: true, data: null } as ApiResponse;
    } catch {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Slot not found." } } as ApiResponse);
    }
  });
}
