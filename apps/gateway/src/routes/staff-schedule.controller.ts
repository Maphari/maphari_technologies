// ════════════════════════════════════════════════════════════════════════════
// staff-schedule.controller.ts — Gateway proxy for staff scheduling timeline
// Prefix  : /admin/staff-schedule
// Scope   : ADMIN only
// ════════════════════════════════════════════════════════════════════════════

import { Controller, Get, Headers, Query } from "@nestjs/common";
import { type ApiResponse, type Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

const CORE = () => process.env.CORE_SERVICE_URL ?? "http://localhost:4002";

function adminHeaders(
  userId = "",
  role: Role = "ADMIN",
  clientId = "",
  requestId = "",
  traceId = ""
) {
  return {
    "x-user-id":    userId,
    "x-user-role":  role,
    "x-client-id":  clientId,
    "x-request-id": requestId,
    "x-trace-id":   traceId || requestId,
  };
}

@Controller()
export class StaffScheduleController {

  // ── GET /admin/staff-schedule ─────────────────────────────────────────────
  @Roles("ADMIN")
  @Get("admin/staff-schedule")
  async getStaffSchedule(
    @Query() query: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const qs = params.size > 0 ? `?${params.toString()}` : "";
    return proxyRequest(
      `${CORE()}/admin/staff-schedule${qs}`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }
}
