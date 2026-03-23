import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class AdminProposedActionsController {
  private get baseUrl(): string {
    return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  }

  private headers(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
    return {
      "x-user-id":    userId ?? "",
      "x-user-role":  role ?? "CLIENT",   // least-privilege fallback
      "x-client-id":  clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id":   traceId ?? requestId ?? "",
    };
  }

  @Roles("ADMIN")
  @Get("admin/proposed-actions")
  async list(
    @Query("status") status?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return proxyRequest(`${this.baseUrl}/admin/proposed-actions${qs}`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Post("admin/proposed-actions")
  async propose(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/admin/proposed-actions`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Patch("admin/proposed-actions/:id/approve")
  async approve(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/admin/proposed-actions/${id}/approve`, "PATCH", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Patch("admin/proposed-actions/:id/reject")
  async reject(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/admin/proposed-actions/${id}/reject`, "PATCH", body, this.headers(userId, role, clientId, requestId, traceId));
  }
}
