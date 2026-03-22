import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import { createTimeEntrySchema, getTimeEntryQuerySchema, type ApiResponse, type Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

const CORE = () => process.env.CORE_SERVICE_URL ?? "http://localhost:4002";

@Controller()
export class TimeEntriesController {
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("time-entries")
  async listTimeEntries(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = getTimeEntryQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException("Invalid time entry query");
    }
    const params = new URLSearchParams();
    Object.entries(parsed.data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    });
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/time-entries?${params.toString()}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("time-entries")
  async createTimeEntry(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = createTimeEntrySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("Invalid time entry payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/time-entries`, "POST", parsed.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── PATCH /time-entries/submit-week (staff submits week) ──────────────────
  // NOTE: declared before /:id/* routes so NestJS registers static path first.
  @Roles("ADMIN", "STAFF")
  @Patch("time-entries/submit-week")
  async submitWeekTimesheet(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/time-entries/submit-week`, "PATCH", body as Record<string, unknown> | undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /time-entries/pending (admin: all submitted entries) ──────────────
  @Roles("ADMIN")
  @Get("time-entries/pending")
  async listPendingTimesheets(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/time-entries/pending`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── PATCH /time-entries/:id/stop ─────────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("time-entries/:id/stop")
  async stopTimeEntry(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/time-entries/${id}/stop`, "PATCH", body as Record<string, unknown> | undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── PATCH /time-entries/:id/approve (admin approves) ─────────────────────
  @Roles("ADMIN")
  @Patch("time-entries/:id/approve")
  async approveTimesheetEntry(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/time-entries/${id}/approve`, "PATCH", {}, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── PATCH /time-entries/:id/reject (admin rejects) ───────────────────────
  @Roles("ADMIN")
  @Patch("time-entries/:id/reject")
  async rejectTimesheetEntry(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/time-entries/${id}/reject`, "PATCH", body as Record<string, unknown> | undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
