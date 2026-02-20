import Fastify, { type FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { registerServiceRateLimit, ServiceMetrics } from "@maphari/platform";
import { registerConversationRoutes } from "./routes/conversations.js";
import { registerMessageRoutes } from "./routes/messages.js";

export interface RealtimeMessagePayload {
  id: string;
  clientId: string;
  conversationId: string;
  authorId: string | null;
  authorRole: string | null;
  deliveryStatus: "SENT" | "DELIVERED" | "READ";
  deliveredAt: string | null;
  readAt: string | null;
  content: string;
  createdAt: string;
}

interface ChatRuntimeOptions {
  broadcastRealtimeMessage?: (payload: RealtimeMessagePayload) => Promise<void>;
}

export interface ChatRuntime {
  app: FastifyInstance;
  metrics: ServiceMetrics;
}

export async function createChatRuntime(options: ChatRuntimeOptions = {}): Promise<ChatRuntime> {
  const app = Fastify({ logger: true });
  const metrics = new ServiceMetrics();
  (app as FastifyInstance & { serviceMetrics?: ServiceMetrics }).serviceMetrics = metrics;
  const publicLimit = Number(process.env.SERVICE_RATE_LIMIT_PUBLIC_MAX ?? 120);
  const protectedLimit = Number(process.env.SERVICE_RATE_LIMIT_PROTECTED_MAX ?? 240);
  const rateWindowMs = Number(process.env.SERVICE_RATE_LIMIT_WINDOW_MS ?? 60_000);

  registerServiceRateLimit(app, {
    service: "chat",
    publicPolicy: { limit: publicLimit, windowMs: rateWindowMs },
    protectedPolicy: { limit: protectedLimit, windowMs: rateWindowMs },
    isPublicRoute: (url) => url === "/health" || url === "/metrics"
  });

  metrics.registerCounter("http_requests_total", "Total HTTP requests");
  metrics.registerHistogram("http_request_duration_ms", "HTTP request latency in milliseconds", [
    5, 10, 25, 50, 100, 250, 500, 1000, 2500
  ]);
  metrics.registerHistogram("db_query_duration_ms", "Database query latency in milliseconds", [
    1, 5, 10, 25, 50, 100, 250, 500, 1000
  ]);

  app.addHook("onRequest", async (request) => {
    (request as typeof request & { __start?: number }).__start = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = (request as typeof request & { __start?: number }).__start ?? Date.now();
    const duration = Date.now() - startedAt;
    const route = request.routeOptions?.url ?? request.url;
    metrics.inc("http_requests_total", { service: "chat", method: request.method, route, status: reply.statusCode });
    metrics.observe("http_request_duration_ms", duration, { service: "chat", method: request.method, route });
  });

  app.get("/health", async () => {
    return {
      success: true,
      data: { service: "chat", status: "ok" }
    } as ApiResponse<{ service: string; status: string }>;
  });

  app.get("/metrics", async (_, reply) => {
    reply.header("content-type", "text/plain; version=0.0.4");
    return metrics.renderPrometheus();
  });

  await registerConversationRoutes(app);
  await registerMessageRoutes(app, { broadcastRealtimeMessage: options.broadcastRealtimeMessage });

  return { app, metrics };
}

export async function createChatApp(options: ChatRuntimeOptions = {}): Promise<FastifyInstance> {
  const runtime = await createChatRuntime(options);
  return runtime.app;
}
