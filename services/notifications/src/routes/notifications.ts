import {
  createNotificationJobSchema,
  getNotificationJobsQuerySchema,
  providerCallbackSchema,
  setNotificationArchiveStateSchema,
  setNotificationReadStateSchema,
  setNotificationSnoozeStateSchema,
  type ApiResponse
} from "@maphari/contracts";
import { createHmac, timingSafeEqual } from "node:crypto";
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

async function verifyCallbackSignature(
  rawBody: string,
  secret: string,
  headers: Record<string, string | string[] | undefined>,
  log: { warn: (obj: object) => void },
  redis: { set: (key: string, value: string, expiryMode: string, time: number, setMode: string) => Promise<string | null> }
): Promise<boolean> {
  const timestamp = headers["x-timestamp"] as string | undefined;
  const nonce = headers["x-nonce"] as string | undefined;
  const signature = headers["x-api-signature"] as string | undefined;
  const provider = (headers["x-provider-name"] as string | undefined) ?? "unknown";

  // New canonical format
  if (timestamp && nonce && signature) {
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 300_000) return false;
    const replayKey = `replay:notification:${provider}:${nonce}`;
    const replaySet = await redis.set(replayKey, "1", "EX", 300, "NX");
    if (replaySet === null) return false;
    const payload = `${timestamp}.${rawBody}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    const sigBuf = Buffer.from(signature, "utf8");
    if (expectedBuf.length !== sigBuf.length) return false;
    return timingSafeEqual(expectedBuf, sigBuf);
  }

  // Legacy fallback
  const legacySig = headers["x-maphari-signature"] as string | undefined;
  if (legacySig) {
    log.warn({ event: "legacy_callback_signature", provider });
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    const legacyBuf = Buffer.from(legacySig, "utf8");
    if (expectedBuf.length !== legacyBuf.length) return false;
    return timingSafeEqual(expectedBuf, legacyBuf);
  }

  return false;
}

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
    const callbackSecret = process.env.NOTIFICATION_CALLBACK_SECRET as string;
    const rawBodyBuf = (request as typeof request & { rawBody?: Buffer }).rawBody;
    let rawBody: string;
    if (rawBodyBuf) {
      rawBody = rawBodyBuf.toString("utf8");
    } else {
      request.log.warn({ event: "rawBody_missing_fallback", note: "preParsing hook did not capture raw body — falling back to JSON.stringify(body)" });
      rawBody = JSON.stringify(request.body ?? {});
    }

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

    const redisUrl = process.env.REDIS_URL;
    let redisAdapter: { set: (key: string, value: string, expiryMode: string, time: number, setMode: string) => Promise<string | null> } | null = null;
    if (redisUrl) {
      try {
        const { Redis } = await import("ioredis");
        const r = new Redis(redisUrl);
        redisAdapter = {
          set: (key, value, expiryMode, time, setMode) =>
            (r as unknown as { set: (...args: unknown[]) => Promise<string | null> }).set(key, value, expiryMode, time, setMode),
        };
      } catch {
        // Redis unavailable — skip nonce check for canonical path
      }
    }

    const signatureValid = redisAdapter
      ? await verifyCallbackSignature(rawBody, callbackSecret, request.headers as Record<string, string | string[] | undefined>, request.log, redisAdapter)
      : (() => {
          // Fallback: legacy signature only when Redis unavailable
          const legacySig = request.headers["x-maphari-signature"] as string | undefined;
          if (legacySig) return verifyWebhookSignature(rawBody, legacySig, callbackSecret);
          return false;
        })();

    if (!signatureValid) {
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
