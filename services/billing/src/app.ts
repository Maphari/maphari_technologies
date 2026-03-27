import Fastify, { type FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { registerServiceRateLimit, ServiceMetrics } from "@maphari/platform";
import { registerInvoiceRoutes } from "./routes/invoices.js";
import { registerPaymentRoutes } from "./routes/payments.js";
import { registerPayFastRoutes } from "./routes/payfast.js";
import { registerExpenseRoutes } from "./routes/expenses.js";
import { registerVendorRoutes } from "./routes/vendors.js";
import { registerLoyaltyRoutes } from "./routes/loyalty.js";
import { registerInstallmentRoutes } from "./routes/installments.js";
import { registerBillingAnalyticsRoutes } from "./routes/analytics.js";
import { registerInvoiceReminderRoutes } from "./routes/invoice-reminders.js";

export async function createBillingApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  // Parse PayFast ITN webhooks (sent as application/x-www-form-urlencoded)
  app.addContentTypeParser("application/x-www-form-urlencoded", { parseAs: "string" }, (_req, body, done) => {
    try {
      const parsed = Object.fromEntries(new URLSearchParams(body as string));
      done(null, parsed);
    } catch (err) {
      done(err as Error);
    }
  });
  const metrics = new ServiceMetrics();
  const publicLimit = Number(process.env.SERVICE_RATE_LIMIT_PUBLIC_MAX ?? 120);
  const protectedLimit = Number(process.env.SERVICE_RATE_LIMIT_PROTECTED_MAX ?? 240);
  const rateWindowMs = Number(process.env.SERVICE_RATE_LIMIT_WINDOW_MS ?? 60_000);

  registerServiceRateLimit(app, {
    service: "billing",
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
    metrics.inc("http_requests_total", { service: "billing", method: request.method, route, status: reply.statusCode });
    metrics.observe("http_request_duration_ms", duration, { service: "billing", method: request.method, route });
  });

  app.get("/health", async () => {
    return {
      success: true,
      data: { service: "billing", status: "ok" }
    } as ApiResponse<{ service: string; status: string }>;
  });

  app.get("/metrics", async (_, reply) => {
    reply.header("content-type", "text/plain; version=0.0.4");
    return metrics.renderPrometheus();
  });

  await registerInvoiceRoutes(app);
  await registerPaymentRoutes(app);
  await registerPayFastRoutes(app);
  await registerExpenseRoutes(app);
  await registerVendorRoutes(app);
  await registerLoyaltyRoutes(app);
  await registerInstallmentRoutes(app);
  await registerBillingAnalyticsRoutes(app);
  await registerInvoiceReminderRoutes(app);

  return app;
}
