// ════════════════════════════════════════════════════════════════════════════
// calendar.controller.ts — Gateway proxy for unified calendar events
// Endpoint : GET /calendar/events?from=ISO_DATE&to=ISO_DATE
// Scope    : ADMIN, STAFF, CLIENT (role-scoped in core)
// ════════════════════════════════════════════════════════════════════════════

import { Controller, Get, Headers, Query } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class CalendarController {
  /**
   * GET /calendar/events?from=ISO_DATE&to=ISO_DATE
   *
   * Returns unified calendar events (appointments, milestones, sprint deadlines)
   * scoped by role. Proxied to the core service's /calendar/events endpoint.
   */
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("calendar/events")
  async listCalendarEvents(
    @Query("from") from?: string,
    @Query("to")   to?: string,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to)   params.set("to",   to);

    return proxyRequest(
      `${baseUrl}/calendar/events?${params.toString()}`,
      "GET",
      undefined,
      {
        "x-user-id":    userId    ?? "",
        "x-user-role":  role      ?? "CLIENT",
        "x-client-id":  clientId  ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id":   traceId   ?? requestId ?? "",
      }
    );
  }
}
