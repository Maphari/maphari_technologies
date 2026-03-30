import Fastify, { type FastifyInstance } from "fastify";
import { Readable } from "node:stream";
import type { ApiResponse } from "@maphari/contracts";
import { registerServiceRateLimit, ServiceMetrics } from "@maphari/platform";
import { registerPublicApiRoutes } from "./routes/public-api.js";

declare module "fastify" {
  interface FastifyInstance {
    serviceMetrics?: ServiceMetrics;
  }
}

export async function createPublicApiApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const metrics = new ServiceMetrics();
  app.serviceMetrics = metrics;

  const publicLimit = Number(process.env.SERVICE_RATE_LIMIT_PUBLIC_MAX ?? 120);
  const protectedLimit = Number(process.env.SERVICE_RATE_LIMIT_PROTECTED_MAX ?? 240);
  const rateWindowMs = Number(process.env.SERVICE_RATE_LIMIT_WINDOW_MS ?? 60_000);

  registerServiceRateLimit(app, {
    service: "public-api",
    publicPolicy: { limit: publicLimit, windowMs: rateWindowMs },
    protectedPolicy: { limit: protectedLimit, windowMs: rateWindowMs },
    isPublicRoute: (url) => url === "/health" || url === "/metrics"
  });

  metrics.registerCounter("http_requests_total", "Total HTTP requests");
  metrics.registerHistogram("http_request_duration_ms", "HTTP request latency in milliseconds", [
    5, 10, 25, 50, 100, 250, 500, 1000, 2500
  ]);
  metrics.registerCounter("public_api_auth_failures_total", "Total public API auth failures");
  metrics.registerCounter("public_api_requests_total", "Total authenticated public API requests");

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

    metrics.inc("http_requests_total", { service: "public-api", method: request.method, route, status: reply.statusCode });
    metrics.observe("http_request_duration_ms", duration, { service: "public-api", method: request.method, route });
  });

  app.get("/health", async () => {
    return {
      success: true,
      data: { service: "public-api", status: "ok" }
    } as ApiResponse<{ service: string; status: string }>;
  });

  app.get("/metrics", async (_, reply) => {
    reply.header("content-type", "text/plain; version=0.0.4");
    return metrics.renderPrometheus();
  });

  await registerPublicApiRoutes(app);
  return app;
}
