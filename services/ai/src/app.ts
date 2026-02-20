import Fastify, { type FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { registerServiceRateLimit, ServiceMetrics } from "@maphari/platform";
import { registerAiRoutes } from "./routes/ai.js";

declare module "fastify" {
  interface FastifyInstance {
    serviceMetrics?: ServiceMetrics;
  }
}

export async function createAiApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const metrics = new ServiceMetrics();
  app.serviceMetrics = metrics;

  const publicLimit = Number(process.env.SERVICE_RATE_LIMIT_PUBLIC_MAX ?? 120);
  const protectedLimit = Number(process.env.SERVICE_RATE_LIMIT_PROTECTED_MAX ?? 240);
  const rateWindowMs = Number(process.env.SERVICE_RATE_LIMIT_WINDOW_MS ?? 60_000);

  registerServiceRateLimit(app, {
    service: "ai",
    publicPolicy: { limit: publicLimit, windowMs: rateWindowMs },
    protectedPolicy: { limit: protectedLimit, windowMs: rateWindowMs },
    isPublicRoute: (url) => url === "/health" || url === "/metrics"
  });

  metrics.registerCounter("http_requests_total", "Total HTTP requests");
  metrics.registerHistogram("http_request_duration_ms", "HTTP request latency in milliseconds", [
    5, 10, 25, 50, 100, 250, 500, 1000, 2500
  ]);
  metrics.registerCounter("ai_jobs_total", "Total generated AI jobs");
  metrics.registerHistogram("ai_job_latency_ms", "AI generation job latency in milliseconds", [
    5, 10, 25, 50, 100, 250, 500, 1000
  ]);

  app.addHook("onRequest", async (request) => {
    (request as typeof request & { __start?: number }).__start = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = (request as typeof request & { __start?: number }).__start ?? Date.now();
    const duration = Date.now() - startedAt;
    const route = request.routeOptions?.url ?? request.url;

    metrics.inc("http_requests_total", { service: "ai", method: request.method, route, status: reply.statusCode });
    metrics.observe("http_request_duration_ms", duration, { service: "ai", method: request.method, route });
  });

  app.get("/health", async () => {
    return {
      success: true,
      data: { service: "ai", status: "ok" }
    } as ApiResponse<{ service: string; status: string }>;
  });

  app.get("/metrics", async (_, reply) => {
    reply.header("content-type", "text/plain; version=0.0.4");
    return metrics.renderPrometheus();
  });

  await registerAiRoutes(app);
  return app;
}
