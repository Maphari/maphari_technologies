import {
  createNotificationJobSchema,
  getNotificationJobsQuerySchema,
  providerCallbackSchema,
  setNotificationArchiveStateSchema,
  setNotificationReadStateSchema,
  setNotificationSnoozeStateSchema,
  type ApiResponse
} from "@maphari/contracts";
import { verifyWebhookSignature } from "@maphari/platform";
import type { FastifyInstance } from "fastify";
import { enforceCallbackRateLimit } from "../lib/callback-rate-limit.js";
import {
  applyProviderCallback,
  archiveAllJobs,
  enqueueJob,
  listJobs,
  markAllJobsRead,
  processNextJob,
  restoreSnoozedJobs,
  setNotificationArchiveState,
  setNotificationReadState,
  setNotificationSnoozeState,
  unreadCounts
} from "../lib/queue.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

type MetricsApp = FastifyInstance & {
  serviceMetrics?: {
    inc: (name: string, labels?: Record<string, string | number>) => void;
  };
};

export async function registerNotificationRoutes(app: FastifyInstance): Promise<void> {
  const metrics = (app as MetricsApp).serviceMetrics;

  app.post("/notifications/jobs", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = createNotificationJobSchema.safeParse(request.body);

    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid notification payload",
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

    const job = await enqueueJob(
      { ...parsedBody.data, clientId },
      { requestId: scope.requestId }
    );
    metrics?.inc("notification_jobs_total", { service: "notifications", status: "QUEUED" });

    return {
      success: true,
      data: job,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof job>;
  });

  app.post("/notifications/process", async () => {
    const processed = await processNextJob();
    if (!processed) {
      return {
        success: true,
        data: { processed: false }
      } as ApiResponse<{ processed: boolean }>;
    }

    if (processed.status === "QUEUED") {
      metrics?.inc("notification_job_retries_total", { service: "notifications", channel: processed.channel });
    }

    metrics?.inc("notification_jobs_total", { service: "notifications", status: processed.status });
    return {
      success: true,
      data: { processed: true, job: processed }
    } as ApiResponse<{ processed: boolean; job?: typeof processed }>;
  });

  app.get("/notifications/jobs", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedQuery = getNotificationJobsQuerySchema.safeParse(request.query ?? {});
    if (!parsedQuery.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid notification jobs query",
          details: parsedQuery.error.flatten()
        }
      } as ApiResponse;
    }
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const jobs = await listJobs(clientId, parsedQuery.data);

    return {
      success: true,
      data: jobs,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof jobs>;
  });

  app.get("/notifications/unread-count", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const counts = await unreadCounts(clientId);
    return {
      success: true,
      data: counts,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof counts>;
  });

  app.patch<{ Params: { id: string } }>("/notifications/jobs/:id/read-state", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = setNotificationReadStateSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid read-state payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const updated = await setNotificationReadState(request.params.id, parsedBody.data.read, {
      userId: scope.userId,
      role: scope.role
    });
    if (!updated) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: "JOB_NOT_FOUND",
          message: "Notification job not found"
        }
      } as ApiResponse;
    }

    return {
      success: true,
      data: updated,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof updated>;
  });

  app.patch<{ Params: { id: string } }>("/notifications/jobs/:id/archive-state", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = setNotificationArchiveStateSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid archive-state payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const updated = await setNotificationArchiveState(request.params.id, parsedBody.data.archived, {
      userId: scope.userId,
      role: scope.role
    });
    if (!updated) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: "JOB_NOT_FOUND",
          message: "Notification job not found"
        }
      } as ApiResponse;
    }

    return {
      success: true,
      data: updated,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof updated>;
  });

  app.patch<{ Params: { id: string } }>("/notifications/jobs/:id/snooze-state", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = setNotificationSnoozeStateSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid snooze payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const updated = await setNotificationSnoozeState(request.params.id, parsedBody.data.snoozedUntil);
    if (!updated) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: "JOB_NOT_FOUND",
          message: "Notification job not found"
        }
      } as ApiResponse;
    }

    return {
      success: true,
      data: updated,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof updated>;
  });

  app.patch("/notifications/mark-all-read", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const result = await markAllJobsRead(clientId, {
      userId: scope.userId,
      role: scope.role as "ADMIN" | "STAFF" | "CLIENT"
    });
    return {
      success: true,
      data: result,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof result>;
  });

  app.patch("/notifications/archive-all", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const result = await archiveAllJobs(clientId, {
      userId: scope.userId,
      role: scope.role as "ADMIN" | "STAFF" | "CLIENT"
    });
    return {
      success: true,
      data: result,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof result>;
  });

  app.patch("/notifications/restore-snoozed", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const result = await restoreSnoozedJobs(clientId);
    return {
      success: true,
      data: result,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof result>;
  });

  app.post("/notifications/provider-callback", async (request, reply) => {
    const signature = request.headers["x-provider-signature"] as string | undefined;
    const callbackSecret = process.env.NOTIFICATION_CALLBACK_SECRET ?? "dev-notification-callback-secret";
    const rawBody = JSON.stringify(request.body ?? {});

    const callbackLimit = Number(process.env.NOTIFICATION_CALLBACK_RATE_LIMIT_MAX ?? 30);
    const callbackWindowMs = Number(process.env.NOTIFICATION_CALLBACK_RATE_LIMIT_WINDOW_MS ?? 60_000);
    const callbackProviderHeader = (request.headers["x-provider-name"] as string | undefined) ?? "unknown";

    if (!enforceCallbackRateLimit(callbackProviderHeader, callbackLimit, callbackWindowMs)) {
      reply.status(429);
      return {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Provider callback rate limit exceeded"
        }
      } as ApiResponse;
    }

    if (!signature || !verifyWebhookSignature(rawBody, signature, callbackSecret)) {
      metrics?.inc("notification_callback_invalid_total", { service: "notifications", reason: "signature" });
      reply.status(401);
      return {
        success: false,
        error: {
          code: "INVALID_SIGNATURE",
          message: "Callback signature is invalid"
        }
      } as ApiResponse;
    }

    const parsedBody = providerCallbackSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid callback payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const job = await applyProviderCallback(parsedBody.data.externalId, parsedBody.data.status, parsedBody.data.reason);
    if (!job) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: "JOB_NOT_FOUND",
          message: "Notification job not found"
        }
      } as ApiResponse;
    }

    return {
      success: true,
      data: job
    } as ApiResponse<typeof job>;
  });
}
