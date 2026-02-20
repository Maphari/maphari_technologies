import Fastify, { type FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { registerServiceRateLimit, ServiceMetrics } from "@maphari/platform";
import { registerFileRoutes } from "./routes/files.js";
import { registerUploadFlowRoutes } from "./routes/upload-flow.js";

export async function createFilesApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const metrics = new ServiceMetrics();
  (app as FastifyInstance & { serviceMetrics?: ServiceMetrics }).serviceMetrics = metrics;
  const publicLimit = Number(process.env.SERVICE_RATE_LIMIT_PUBLIC_MAX ?? 120);
  const protectedLimit = Number(process.env.SERVICE_RATE_LIMIT_PROTECTED_MAX ?? 240);
  const rateWindowMs = Number(process.env.SERVICE_RATE_LIMIT_WINDOW_MS ?? 60_000);

  registerServiceRateLimit(app, {
    service: "files",
    publicPolicy: { limit: publicLimit, windowMs: rateWindowMs },
    protectedPolicy: { limit: protectedLimit, windowMs: rateWindowMs },
    isPublicRoute: (url, method) =>
      url === "/health" ||
      url === "/metrics" ||
      method === "OPTIONS" ||
      url.startsWith("/uploads/")
  });

  // Upload endpoints accept direct binary payloads from presigned URL clients.
  app.addContentTypeParser("application/octet-stream", { parseAs: "buffer" }, (_, payload, done) => {
    done(null, payload);
  });

  metrics.registerCounter("http_requests_total", "Total HTTP requests");
  metrics.registerHistogram("http_request_duration_ms", "HTTP request latency in milliseconds", [
    5, 10, 25, 50, 100, 250, 500, 1000, 2500
  ]);
  metrics.registerHistogram("db_query_duration_ms", "Database query latency in milliseconds", [
    1, 5, 10, 25, 50, 100, 250, 500, 1000
  ]);
  metrics.registerGauge("files_upload_confirm_backlog", "Estimated issued uploads awaiting confirmation");

  app.addHook("onRequest", async (request) => {
    (request as typeof request & { __start?: number }).__start = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = (request as typeof request & { __start?: number }).__start ?? Date.now();
    const duration = Date.now() - startedAt;
    const route = request.routeOptions?.url ?? request.url;
    metrics.inc("http_requests_total", { service: "files", method: request.method, route, status: reply.statusCode });
    metrics.observe("http_request_duration_ms", duration, { service: "files", method: request.method, route });
  });

  app.get("/health", async () => {
    return {
      success: true,
      data: { service: "files", status: "ok" }
    } as ApiResponse<{ service: string; status: string }>;
  });

  app.get("/metrics", async (_, reply) => {
    reply.header("content-type", "text/plain; version=0.0.4");
    return metrics.renderPrometheus();
  });

  await registerUploadFlowRoutes(app);
  await registerFileRoutes(app);

  return app;
}
