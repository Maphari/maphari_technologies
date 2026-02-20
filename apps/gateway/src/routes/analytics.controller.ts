import { BadRequestException, Body, Controller, Get, Headers, Post, Query } from "@nestjs/common";
import {
  analyticsIngestEventSchema,
  analyticsQuerySchema,
  type ApiResponse,
  type Role
} from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class AnalyticsController {
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("analytics/events")
  async ingestEvent(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = analyticsIngestEventSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid analytics event payload");
    }

    const baseUrl = process.env.ANALYTICS_SERVICE_URL ?? "http://localhost:4008";
    return proxyRequest(`${baseUrl}/analytics/events`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("analytics/metrics")
  async queryMetrics(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedQuery = analyticsQuerySchema.safeParse(query ?? {});
    if (!parsedQuery.success) {
      throw new BadRequestException("Invalid analytics query payload");
    }

    const baseUrl = process.env.ANALYTICS_SERVICE_URL ?? "http://localhost:4008";
    const queryRecord = Object.entries(parsedQuery.data).reduce<Record<string, string>>((accumulator, [key, value]) => {
      if (value !== undefined) {
        accumulator[key] = String(value);
      }
      return accumulator;
    }, {});
    const queryString = new URLSearchParams(queryRecord).toString();
    const upstreamUrl = queryString.length > 0 ? `${baseUrl}/analytics/metrics?${queryString}` : `${baseUrl}/analytics/metrics`;

    return proxyRequest(upstreamUrl, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
