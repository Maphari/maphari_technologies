import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createNotificationJobSchema,
  getNotificationJobsQuerySchema,
  providerCallbackSchema,
  setNotificationReadStateSchema,
  type ApiResponse,
  type Role
} from "@maphari/contracts";
import { Public } from "../auth/public.decorator.js";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class NotificationsController {
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("notifications/jobs")
  async createJob(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createNotificationJobSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid notification payload");
    }

    const baseUrl = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:4009";
    return proxyRequest(`${baseUrl}/notifications/jobs`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("notifications/process")
  async processQueue(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:4009";
    return proxyRequest(`${baseUrl}/notifications/process`, "POST", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("notifications/jobs")
  async listJobs(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedQuery = getNotificationJobsQuerySchema.safeParse(query ?? {});
    if (!parsedQuery.success) {
      throw new BadRequestException("Invalid notification query");
    }
    const params = new URLSearchParams();
    Object.entries(parsedQuery.data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    const baseUrl = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:4009";
    return proxyRequest(`${baseUrl}/notifications/jobs${params.size > 0 ? `?${params.toString()}` : ""}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("notifications/unread-count")
  async unreadCount(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:4009";
    return proxyRequest(`${baseUrl}/notifications/unread-count`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("notifications/jobs/:id/read-state")
  async updateReadState(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = setNotificationReadStateSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid notification read-state payload");
    }
    const baseUrl = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:4009";
    return proxyRequest(`${baseUrl}/notifications/jobs/${id}/read-state`, "PATCH", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Public()
  @Post("notifications/provider-callback")
  async providerCallback(
    @Body() body: unknown,
    @Headers("x-provider-name") providerName?: string,
    @Headers("x-provider-signature") signature?: string
  ): Promise<ApiResponse> {
    const parsedBody = providerCallbackSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid provider callback payload");
    }

    const baseUrl = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:4009";
    return proxyRequest(`${baseUrl}/notifications/provider-callback`, "POST", parsedBody.data, {
      "x-provider-name": providerName ?? "",
      "x-provider-signature": signature ?? ""
    });
  }
}
