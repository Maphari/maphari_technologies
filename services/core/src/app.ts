import Fastify, { type FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { registerServiceRateLimit, ServiceMetrics } from "@maphari/platform";
import { registerClientRoutes } from "./routes/clients.js";
import { registerProjectRoutes } from "./routes/projects.js";
import { registerLeadRoutes } from "./routes/leads.js";
import { registerBookingRoutes } from "./routes/bookings.js";
import { registerProposalRoutes } from "./routes/proposals.js";
import { registerOnboardingRoutes } from "./routes/onboarding.js";
import { registerOperationsRoutes } from "./routes/operations.js";
import { registerTimeEntryRoutes } from "./routes/time-entries.js";
import { registerConversationNoteRoutes } from "./routes/conversation-notes.js";
import { registerConversationEscalationRoutes } from "./routes/conversation-escalations.js";
import { registerMilestoneApprovalRoutes } from "./routes/milestone-approvals.js";
import { registerBlockerRoutes } from "./routes/blockers.js";
import { registerChangeRequestRoutes } from "./routes/change-requests.js";

export async function createCoreApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const metrics = new ServiceMetrics();
  const publicLimit = Number(process.env.SERVICE_RATE_LIMIT_PUBLIC_MAX ?? 120);
  const protectedLimit = Number(process.env.SERVICE_RATE_LIMIT_PROTECTED_MAX ?? 240);
  const rateWindowMs = Number(process.env.SERVICE_RATE_LIMIT_WINDOW_MS ?? 60_000);

  registerServiceRateLimit(app, {
    service: "core",
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
    metrics.inc("http_requests_total", { service: "core", method: request.method, route, status: reply.statusCode });
    metrics.observe("http_request_duration_ms", duration, { service: "core", method: request.method, route });
  });

  app.get("/health", async () => {
    return {
      success: true,
      data: { service: "core", status: "ok" }
    } as ApiResponse<{ service: string; status: string }>;
  });

  app.get("/metrics", async (_, reply) => {
    reply.header("content-type", "text/plain; version=0.0.4");
    return metrics.renderPrometheus();
  });

  await registerClientRoutes(app);
  await registerProjectRoutes(app);
  await registerLeadRoutes(app);
  await registerBookingRoutes(app);
  await registerProposalRoutes(app);
  await registerOnboardingRoutes(app);
  await registerOperationsRoutes(app);
  await registerTimeEntryRoutes(app);
  await registerConversationNoteRoutes(app);
  await registerConversationEscalationRoutes(app);
  await registerMilestoneApprovalRoutes(app);
  await registerBlockerRoutes(app);
  await registerChangeRequestRoutes(app);

  return app;
}
