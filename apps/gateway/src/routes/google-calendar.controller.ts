// ════════════════════════════════════════════════════════════════════════════
// google-calendar.controller.ts — Gateway proxy for Google Calendar integration
// Proxies: GET    /integrations/google-calendar/auth-url
//          POST   /integrations/google-calendar/callback
//          GET    /integrations/google-calendar/status
//          DELETE /integrations/google-calendar/disconnect
//          POST   /integrations/google-calendar/sync-meeting
// Scope  : CLIENT, STAFF, ADMIN
// ════════════════════════════════════════════════════════════════════════════

import { Body, Controller, Delete, Get, Headers, Post } from "@nestjs/common";
import { type ApiResponse, type Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

const CORE = () => process.env.CORE_SERVICE_URL ?? "http://localhost:4002";

function scopeHeaders(
  userId    = "",
  role: Role = "CLIENT",
  clientId  = "",
  requestId = "",
  traceId   = ""
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
export class GoogleCalendarController {

  /** GET /integrations/google-calendar/auth-url */
  @Roles("CLIENT", "STAFF", "ADMIN")
  @Get("integrations/google-calendar/auth-url")
  async getAuthUrl(
    @Headers("x-user-id")    userId?:    string,
    @Headers("x-user-role")  role?:      Role,
    @Headers("x-client-id")  clientId?:  string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?:   string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/integrations/google-calendar/auth-url`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  /** POST /integrations/google-calendar/callback */
  @Roles("CLIENT", "STAFF", "ADMIN")
  @Post("integrations/google-calendar/callback")
  async handleCallback(
    @Body()                  body:       unknown,
    @Headers("x-user-id")    userId?:    string,
    @Headers("x-user-role")  role?:      Role,
    @Headers("x-client-id")  clientId?:  string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?:   string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/integrations/google-calendar/callback`,
      "POST",
      body as Record<string, unknown>,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  /** GET /integrations/google-calendar/status */
  @Roles("CLIENT", "STAFF", "ADMIN")
  @Get("integrations/google-calendar/status")
  async getStatus(
    @Headers("x-user-id")    userId?:    string,
    @Headers("x-user-role")  role?:      Role,
    @Headers("x-client-id")  clientId?:  string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?:   string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/integrations/google-calendar/status`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  /** DELETE /integrations/google-calendar/disconnect */
  @Roles("CLIENT", "STAFF", "ADMIN")
  @Delete("integrations/google-calendar/disconnect")
  async disconnect(
    @Headers("x-user-id")    userId?:    string,
    @Headers("x-user-role")  role?:      Role,
    @Headers("x-client-id")  clientId?:  string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?:   string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/integrations/google-calendar/disconnect`,
      "DELETE",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  /** POST /integrations/google-calendar/sync-meeting */
  @Roles("CLIENT", "STAFF", "ADMIN")
  @Post("integrations/google-calendar/sync-meeting")
  async syncMeeting(
    @Body()                  body:       unknown,
    @Headers("x-user-id")    userId?:    string,
    @Headers("x-user-role")  role?:      Role,
    @Headers("x-client-id")  clientId?:  string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?:   string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/integrations/google-calendar/sync-meeting`,
      "POST",
      body as Record<string, unknown>,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }
}
