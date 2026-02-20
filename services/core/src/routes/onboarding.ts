import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { submitOnboardingSchema } from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { eventBus } from "../lib/infrastructure.js";

export async function registerOnboardingRoutes(app: FastifyInstance): Promise<void> {
  app.post("/onboarding/submissions", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = submitOnboardingSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid onboarding submission payload",
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

    const submission = {
      submissionId: randomUUID(),
      clientId,
      projectId: parsedBody.data.projectId ?? null,
      contactEmail: parsedBody.data.contactEmail,
      assetsProvided: parsedBody.data.assetsProvided ?? [],
      notes: parsedBody.data.notes ?? null,
      submittedAt: parsedBody.data.submittedAt ?? new Date().toISOString()
    };

    try {
      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId,
        traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
        clientId,
        topic: EventTopics.onboardingSubmitted,
        payload: submission
      });

      return {
        success: true,
        data: submission,
        meta: { requestId: scope.requestId }
      } as ApiResponse<typeof submission>;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: {
          code: "ONBOARDING_SUBMISSION_FAILED",
          message: "Unable to process onboarding submission"
        }
      } as ApiResponse;
    }
  });
}
