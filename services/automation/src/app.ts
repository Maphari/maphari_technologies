import type { ApiResponse } from "@maphari/contracts";
import { registerServiceRateLimit, ServiceMetrics } from "@maphari/platform";
import Fastify, { type FastifyInstance } from "fastify";
import type { AutomationJobRecord } from "./lib/subscriptions.js";

export interface AutomationRuntime {
  app: FastifyInstance;
  metrics: ServiceMetrics;
}

interface AutomationRuntimeOptions {
  listJobs?: () => AutomationJobRecord[] | Promise<AutomationJobRecord[]>;
  listDeadLetters?: () => AutomationJobRecord[] | Promise<AutomationJobRecord[]>;
  getJobById?: (jobId: string) => AutomationJobRecord | null | Promise<AutomationJobRecord | null>;
  getRuntimeStats?: () => Promise<Record<string, unknown>> | Record<string, unknown>;
}

export function createAutomationRuntime(options: AutomationRuntimeOptions = {}): AutomationRuntime {
  const app = Fastify({ logger: true });
  const metrics = new ServiceMetrics();
  const publicLimit = Number(process.env.SERVICE_RATE_LIMIT_PUBLIC_MAX ?? 120);
  const protectedLimit = Number(process.env.SERVICE_RATE_LIMIT_PROTECTED_MAX ?? 240);
  const rateWindowMs = Number(process.env.SERVICE_RATE_LIMIT_WINDOW_MS ?? 60_000);

  registerServiceRateLimit(app, {
    service: "automation",
    publicPolicy: { limit: publicLimit, windowMs: rateWindowMs },
    protectedPolicy: { limit: protectedLimit, windowMs: rateWindowMs },
    isPublicRoute: (url) => url === "/health" || url === "/metrics"
  });

  metrics.registerCounter("http_requests_total", "Total HTTP requests");
  metrics.registerHistogram("http_request_duration_ms", "HTTP request latency in milliseconds", [
    5, 10, 25, 50, 100, 250, 500, 1000, 2500
  ]);
  metrics.registerCounter("events_received_total", "Total domain events consumed");
  metrics.registerCounter("events_failed_total", "Total automation events that failed processing attempts");
  metrics.registerCounter("events_retry_total", "Total automation retries attempted");
  metrics.registerCounter("events_dead_lettered_total", "Total automation events moved to dead-letter");
  metrics.registerCounter("events_validation_failed_total", "Total automation events rejected by schema validation");
  metrics.registerCounter("events_duplicate_total", "Total duplicate automation events skipped by idempotency key");
  metrics.registerGauge("event_backlog_depth", "In-memory count of events currently being processed");
  metrics.registerCounter("scheduled_notifications_enqueued_total", "Total scheduled notifications enqueued");
  metrics.registerCounter("scheduled_notifications_sent_total", "Total scheduled notifications sent");
  metrics.registerCounter("scheduled_notifications_failed_total", "Total scheduled notifications failed");
  metrics.registerGauge("scheduled_notifications_pending", "Count of scheduled notifications pending dispatch");

  app.addHook("onRequest", async (request) => {
    (request as typeof request & { __start?: number }).__start = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = (request as typeof request & { __start?: number }).__start ?? Date.now();
    const duration = Date.now() - startedAt;
    const route = request.routeOptions?.url ?? request.url;
    metrics.inc("http_requests_total", {
      service: "automation",
      method: request.method,
      route,
      status: reply.statusCode
    });
    metrics.observe("http_request_duration_ms", duration, {
      service: "automation",
      method: request.method,
      route
    });
  });

  app.get("/health", async () => {
    return {
      success: true,
      data: { service: "automation", status: "ok" }
    } as ApiResponse<{ service: string; status: string }>;
  });

  app.get("/metrics", async (_, reply) => {
    reply.header("content-type", "text/plain; version=0.0.4");
    return metrics.renderPrometheus();
  });

  app.get("/automation/jobs", async () => {
    return {
      success: true,
      data: options.listJobs ? await options.listJobs() : []
    } as ApiResponse<AutomationJobRecord[]>;
  });

  app.get("/automation/jobs/:jobId", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const record = options.getJobById ? await options.getJobById(jobId) : null;

    if (!record) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: "AUTOMATION_JOB_NOT_FOUND",
          message: "Automation job was not found"
        }
      } as ApiResponse;
    }

    return {
      success: true,
      data: record
    } as ApiResponse<AutomationJobRecord>;
  });

  app.get("/automation/dead-letters", async () => {
    return {
      success: true,
      data: options.listDeadLetters ? await options.listDeadLetters() : []
    } as ApiResponse<AutomationJobRecord[]>;
  });

  app.get("/automation/runtime", async () => {
    return {
      success: true,
      data: options.getRuntimeStats ? await options.getRuntimeStats() : {}
    } as ApiResponse<Record<string, unknown>>;
  });

  return { app, metrics };
}
