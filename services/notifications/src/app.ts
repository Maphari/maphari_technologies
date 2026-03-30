import Fastify, { type FastifyInstance } from "fastify";
import { Readable } from "node:stream";
import type { ApiResponse } from "@maphari/contracts";
import { registerServiceRateLimit, ServiceMetrics } from "@maphari/platform";
import { registerNotificationRoutes } from "./routes/notifications.js";

declare module "fastify" {
  interface FastifyInstance {
    serviceMetrics?: ServiceMetrics;
  }
}

export async function createNotificationsApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const metrics = new ServiceMetrics();
  app.serviceMetrics = metrics;

  const publicLimit = Number(process.env.SERVICE_RATE_LIMIT_PUBLIC_MAX ?? 120);
  const protectedLimit = Number(process.env.SERVICE_RATE_LIMIT_PROTECTED_MAX ?? 240);
  const rateWindowMs = Number(process.env.SERVICE_RATE_LIMIT_WINDOW_MS ?? 60_000);

  registerServiceRateLimit(app, {
    service: "notifications",
    publicPolicy: { limit: publicLimit, windowMs: rateWindowMs },
    protectedPolicy: { limit: protectedLimit, windowMs: rateWindowMs },
    isPublicRoute: (url) => url === "/health" || url === "/metrics"
  });

  metrics.registerCounter("http_requests_total", "Total HTTP requests");
  metrics.registerHistogram("http_request_duration_ms", "HTTP request latency in milliseconds", [
    5, 10, 25, 50, 100, 250, 500, 1000, 2500
  ]);
  metrics.registerCounter("notification_jobs_total", "Total notification jobs by lifecycle status");
  metrics.registerCounter("notification_job_retries_total", "Total notification job retries");
  metrics.registerCounter("notification_callback_invalid_total", "Total invalid provider callbacks");
  metrics.registerCounter("events_received_total", "Total domain events consumed");
  metrics.registerGauge("event_backlog_depth", "Approximate in-flight event processing depth");

  app.addHook(
    "preParsing",
    async (_request, _reply, payload) => {
      const chunks: Buffer[] = [];
      for await (const chunk of payload) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
      }
      const raw = Buffer.concat(chunks);
      (_request as typeof _request & { rawBody?: Buffer }).rawBody = raw;
      const stream = new Readable();
      stream.push(raw);
      stream.push(null);
      return stream;
    }
  );

  app.addHook("onRequest", async (request) => {
    (request as typeof request & { __start?: number }).__start = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = (request as typeof request & { __start?: number }).__start ?? Date.now();
    const duration = Date.now() - startedAt;
    const route = request.routeOptions?.url ?? request.url;

    metrics.inc("http_requests_total", {
      service: "notifications",
      method: request.method,
      route,
      status: reply.statusCode
    });
    metrics.observe("http_request_duration_ms", duration, {
      service: "notifications",
      method: request.method,
      route
    });
  });

  app.get("/health", async () => {
    return {
      success: true,
      data: { service: "notifications", status: "ok" }
    } as ApiResponse<{ service: string; status: string }>;
  });

  app.get("/metrics", async (_, reply) => {
    reply.header("content-type", "text/plain; version=0.0.4");
    return metrics.renderPrometheus();
  });

  await registerNotificationRoutes(app);
  return app;
}
