import {
  aiEstimateSchema,
  aiGenerateSchema,
  aiLeadQualificationSchema,
  aiProposalDraftSchema,
  type ApiResponse
} from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { eventBus } from "../lib/infrastructure.js";
import { createAiJob, createAiWorkflowJob, listAiJobs } from "../lib/store.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

type MetricsApp = FastifyInstance & {
  serviceMetrics?: {
    inc: (name: string, labels?: Record<string, string | number>) => void;
    observe: (name: string, value: number, labels?: Record<string, string | number>) => void;
  };
};

export async function registerAiRoutes(app: FastifyInstance): Promise<void> {
  const metrics = (app as MetricsApp).serviceMetrics;

  app.post("/ai/generate", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = aiGenerateSchema.safeParse(request.body);

    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid AI generate payload",
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

    const job = createAiJob({ ...parsedBody.data, clientId });
    metrics?.inc("ai_jobs_total", { service: "ai", status: job.status });
    metrics?.observe("ai_job_latency_ms", job.latencyMs, { service: "ai", model: job.model });

    return {
      success: true,
      data: job,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof job>;
  });

  app.get("/ai/jobs", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const jobs = listAiJobs(clientId);

    return {
      success: true,
      data: jobs,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof jobs>;
  });

  app.post("/ai/lead-qualify", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = aiLeadQualificationSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid AI lead qualification payload",
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

    const job = createAiWorkflowJob("lead-qualification", {
      clientId,
      prompt: parsedBody.data.prompt,
      model: parsedBody.data.model
    });
    metrics?.inc("ai_jobs_total", { service: "ai", status: job.status, task: job.task });
    metrics?.observe("ai_job_latency_ms", job.latencyMs, { service: "ai", model: job.model, task: job.task });

    await eventBus.publish({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      requestId: scope.requestId,
      traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
      clientId,
      topic: EventTopics.aiLeadQualified,
      payload: {
        jobId: job.id,
        leadId: parsedBody.data.leadId,
        clientId,
        model: job.model,
        result: job.response
      }
    });

    return {
      success: true,
      data: job,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof job>;
  });

  app.post("/ai/proposal-draft", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = aiProposalDraftSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid AI proposal draft payload",
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

    const job = createAiWorkflowJob("proposal-draft", {
      clientId,
      prompt: parsedBody.data.prompt,
      model: parsedBody.data.model
    });
    metrics?.inc("ai_jobs_total", { service: "ai", status: job.status, task: job.task });
    metrics?.observe("ai_job_latency_ms", job.latencyMs, { service: "ai", model: job.model, task: job.task });

    await eventBus.publish({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      requestId: scope.requestId,
      traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
      clientId,
      topic: EventTopics.aiProposalDrafted,
      payload: {
        jobId: job.id,
        leadId: parsedBody.data.leadId ?? null,
        projectId: parsedBody.data.projectId ?? null,
        clientId,
        model: job.model,
        result: job.response
      }
    });

    return {
      success: true,
      data: job,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof job>;
  });

  app.post("/ai/estimate", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = aiEstimateSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid AI estimate payload",
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

    const job = createAiWorkflowJob("estimate", {
      clientId,
      prompt: parsedBody.data.prompt,
      model: parsedBody.data.model
    });
    metrics?.inc("ai_jobs_total", { service: "ai", status: job.status, task: job.task });
    metrics?.observe("ai_job_latency_ms", job.latencyMs, { service: "ai", model: job.model, task: job.task });

    await eventBus.publish({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      requestId: scope.requestId,
      traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
      clientId,
      topic: EventTopics.aiEstimateGenerated,
      payload: {
        jobId: job.id,
        projectId: parsedBody.data.projectId ?? null,
        clientId,
        model: job.model,
        result: job.response
      }
    });

    return {
      success: true,
      data: job,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof job>;
  });
}
