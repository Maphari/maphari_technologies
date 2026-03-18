// ════════════════════════════════════════════════════════════════════════════
// recurring-tasks.controller.ts — Gateway proxy for recurring task routes
// Forwards to core service  |  Scope: STAFF + ADMIN only (CLIENT = 403)
// ════════════════════════════════════════════════════════════════════════════

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Headers } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class RecurringTasksController {

  // ── GET /recurring-tasks ──────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("recurring-tasks")
  async listRecurringTasks(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
        if (value !== undefined && value !== null) params.set(key, String(value));
      }
    }

    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/recurring-tasks${params.size > 0 ? `?${params.toString()}` : ""}`,
      "GET",
      undefined,
      {
        "x-user-id": userId ?? "",
        "x-user-role": role ?? "STAFF",
        "x-client-id": clientId ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  // ── POST /recurring-tasks ─────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("recurring-tasks")
  async createRecurringTask(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/recurring-tasks`,
      "POST",
      body,
      {
        "x-user-id": userId ?? "",
        "x-user-role": role ?? "STAFF",
        "x-client-id": clientId ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  // ── PATCH /recurring-tasks/:id ────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Patch("recurring-tasks/:id")
  async updateRecurringTask(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/recurring-tasks/${id}`,
      "PATCH",
      body,
      {
        "x-user-id": userId ?? "",
        "x-user-role": role ?? "STAFF",
        "x-client-id": clientId ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  // ── DELETE /recurring-tasks/:id ───────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Delete("recurring-tasks/:id")
  async deleteRecurringTask(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/recurring-tasks/${id}`,
      "DELETE",
      undefined,
      {
        "x-user-id": userId ?? "",
        "x-user-role": role ?? "STAFF",
        "x-client-id": clientId ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }
}
