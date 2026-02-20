import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import {
  createClientReengagementSchema,
  createMaintenanceCheckSchema,
  createReportGeneratedSchema,
  createSecurityIncidentSchema,
  createTestimonialReceivedSchema
} from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { eventBus } from "../lib/infrastructure.js";

export async function registerOperationsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/ops/maintenance/checks", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createMaintenanceCheckSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid maintenance check payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    const payload = {
      checkId: randomUUID(),
      clientId: clientId ?? null,
      checkType: parsedBody.data.checkType,
      status: parsedBody.data.status,
      details: parsedBody.data.details ?? null,
      checkedAt: parsedBody.data.checkedAt ?? new Date().toISOString()
    };

    await eventBus.publish({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      requestId: scope.requestId,
      traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
      clientId: clientId ?? undefined,
      topic: EventTopics.maintenanceCheckCompleted,
      payload
    });

    return { success: true, data: payload, meta: { requestId: scope.requestId } } as ApiResponse<typeof payload>;
  });

  app.post("/ops/security/incidents", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createSecurityIncidentSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid security incident payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    const payload = {
      incidentId: randomUUID(),
      clientId: clientId ?? null,
      incidentType: parsedBody.data.incidentType,
      severity: parsedBody.data.severity,
      message: parsedBody.data.message,
      occurredAt: parsedBody.data.occurredAt ?? new Date().toISOString()
    };

    await eventBus.publish({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      requestId: scope.requestId,
      traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
      clientId: clientId ?? undefined,
      topic: EventTopics.securityIncidentDetected,
      payload
    });

    return { success: true, data: payload, meta: { requestId: scope.requestId } } as ApiResponse<typeof payload>;
  });

  app.post("/ops/reports/generated", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createReportGeneratedSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid report generated payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    const payload = {
      reportId: randomUUID(),
      clientId: clientId ?? null,
      reportType: parsedBody.data.reportType,
      periodStart: parsedBody.data.periodStart,
      periodEnd: parsedBody.data.periodEnd,
      generatedAt: parsedBody.data.generatedAt ?? new Date().toISOString()
    };

    await eventBus.publish({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      requestId: scope.requestId,
      traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
      clientId: clientId ?? undefined,
      topic: EventTopics.reportGenerated,
      payload
    });

    return { success: true, data: payload, meta: { requestId: scope.requestId } } as ApiResponse<typeof payload>;
  });

  app.post("/ops/growth/testimonials", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createTestimonialReceivedSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid testimonial payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    const payload = {
      testimonialId: randomUUID(),
      clientId: clientId ?? null,
      projectId: parsedBody.data.projectId ?? null,
      authorName: parsedBody.data.authorName,
      rating: parsedBody.data.rating,
      content: parsedBody.data.content,
      submittedAt: parsedBody.data.submittedAt ?? new Date().toISOString()
    };

    await eventBus.publish({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      requestId: scope.requestId,
      traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
      clientId: clientId ?? undefined,
      topic: EventTopics.testimonialReceived,
      payload
    });

    return { success: true, data: payload, meta: { requestId: scope.requestId } } as ApiResponse<typeof payload>;
  });

  app.post("/ops/growth/reengagement", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createClientReengagementSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid client reengagement payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    const payload = {
      reengagementId: randomUUID(),
      clientId: clientId ?? null,
      contactEmail: parsedBody.data.contactEmail,
      monthsInactive: parsedBody.data.monthsInactive,
      dueAt: parsedBody.data.dueAt ?? new Date().toISOString()
    };

    await eventBus.publish({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      requestId: scope.requestId,
      traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
      clientId: clientId ?? undefined,
      topic: EventTopics.clientReengagementDue,
      payload
    });

    return { success: true, data: payload, meta: { requestId: scope.requestId } } as ApiResponse<typeof payload>;
  });
}
