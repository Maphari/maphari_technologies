import { analyticsIngestEventSchema, analyticsQuerySchema, type ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import { queryAnalyticsRecords, saveAnalyticsEvent } from "../lib/store.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";

type MetricsApp = FastifyInstance & {
  serviceMetrics?: {
    inc: (name: string, labels?: Record<string, string | number>) => void;
    observe: (name: string, value: number, labels?: Record<string, string | number>) => void;
  };
};

export async function registerAnalyticsRoutes(app: FastifyInstance): Promise<void> {
  const metrics = (app as MetricsApp).serviceMetrics;

  app.post("/analytics/events", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = analyticsIngestEventSchema.safeParse(request.body);

    if (!parsedBody.success) {
      metrics?.inc("analytics_ingest_failures_total", { service: "analytics", reason: "validation" });
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid analytics event payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    if (!clientId) {
      metrics?.inc("analytics_ingest_failures_total", { service: "analytics", reason: "scope" });
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "client scope is required"
        }
      } as ApiResponse;
    }

    const record = saveAnalyticsEvent({ ...parsedBody.data, clientId });
    metrics?.inc("analytics_ingest_total", { service: "analytics", event_name: record.eventName });
    metrics?.observe(
      "analytics_ingest_lag_ms",
      Date.now() - new Date(record.occurredAt).getTime(),
      { service: "analytics", event_name: record.eventName }
    );

    return {
      success: true,
      data: record,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof record>;
  });

  app.get("/analytics/metrics", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedQuery = analyticsQuerySchema.safeParse(request.query ?? {});

    if (!parsedQuery.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid analytics query payload",
          details: parsedQuery.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedQuery.data.clientId);
    const results = queryAnalyticsRecords(clientId, parsedQuery.data.eventName);

    const responseData = {
      totalEvents: results.length,
      byEventName: results.reduce<Record<string, number>>((accumulator, record) => {
        accumulator[record.eventName] = (accumulator[record.eventName] ?? 0) + 1;
        return accumulator;
      }, {})
    };

    return {
      success: true,
      data: responseData,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof responseData>;
  });
}
