import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { createBookingSchema } from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { eventBus } from "../lib/infrastructure.js";

export async function registerBookingRoutes(app: FastifyInstance): Promise<void> {
  app.post("/bookings", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createBookingSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid booking payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    if (!clientId) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "client scope is required"
        }
      } as ApiResponse;
    }

    const booking = {
      id: randomUUID(),
      clientId,
      service: parsedBody.data.service,
      startsAt: parsedBody.data.startsAt,
      attendeeName: parsedBody.data.attendeeName,
      attendeeEmail: parsedBody.data.attendeeEmail,
      attendeePhone: parsedBody.data.attendeePhone ?? null,
      notes: parsedBody.data.notes ?? null,
      source: parsedBody.data.source ?? null,
      createdAt: new Date().toISOString()
    };

    try {
      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        clientId,
        topic: EventTopics.bookingCreated,
        payload: {
          bookingId: booking.id,
          clientId: booking.clientId,
          service: booking.service,
          startsAt: booking.startsAt,
          attendeeName: booking.attendeeName,
          attendeeEmail: booking.attendeeEmail,
          attendeePhone: booking.attendeePhone,
          source: booking.source
        }
      });

      return {
        success: true,
        data: booking,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof booking>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "BOOKING_CREATE_FAILED",
          message: "Unable to create booking"
        }
      } as ApiResponse;
    }
  });
}
