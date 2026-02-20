import Fastify, { type FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { registerServiceRateLimit, ServiceMetrics } from "@maphari/platform";
import { registerAnalyticsRoutes } from "./routes/analytics.js";

declare module "fastify" {
  interface FastifyInstance {
    serviceMetrics?: ServiceMetrics;
  }
}

export async function createAnalyticsApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const metrics = new ServiceMetrics();
  app.serviceMetrics = metrics;

  const publicLimit = Number(process.env.SERVICE_RATE_LIMIT_PUBLIC_MAX ?? 120);
  const protectedLimit = Number(process.env.SERVICE_RATE_LIMIT_PROTECTED_MAX ?? 240);
  const rateWindowMs = Number(process.env.SERVICE_RATE_LIMIT_WINDOW_MS ?? 60_000);

  registerServiceRateLimit(app, {
    service: "analytics",
    publicPolicy: { limit: publicLimit, windowMs: rateWindowMs },
    protectedPolicy: { limit: protectedLimit, windowMs: rateWindowMs },
    isPublicRoute: (url) => url === "/health" || url === "/metrics"
  });

  metrics.registerCounter("http_requests_total", "Total HTTP requests");
  metrics.registerHistogram("http_request_duration_ms", "HTTP request latency in milliseconds", [
    5, 10, 25, 50, 100, 250, 500, 1000, 2500
  ]);
  metrics.registerCounter("analytics_ingest_total", "Total analytics events ingested");
  metrics.registerCounter("analytics_ingest_failures_total", "Total analytics ingest failures");
  metrics.registerHistogram("analytics_ingest_lag_ms", "Ingest lag from occurredAt to ingest time in milliseconds", [
    10, 50, 100, 250, 500, 1000, 5000, 10000
  ]);

  app.addHook("onRequest", async (request) => {
    (request as typeof request & { __start?: number }).__start = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = (request as typeof request & { __start?: number }).__start ?? Date.now();
    const duration = Date.now() - startedAt;
    const route = request.routeOptions?.url ?? request.url;

    metrics.inc("http_requests_total", {
      service: "analytics",
      method: request.method,
      route,
      status: reply.statusCode
    });
    metrics.observe("http_request_duration_ms", duration, { service: "analytics", method: request.method, route });
  });

  app.get("/health", async () => {
    return {
      success: true,
      data: { service: "analytics", status: "ok" }
    } as ApiResponse<{ service: string; status: string }>;
  });

  app.get("/metrics", async (_, reply) => {
    reply.header("content-type", "text/plain; version=0.0.4");
    return metrics.renderPrometheus();
  });

  await registerAnalyticsRoutes(app);
  return app;
}
