// ════════════════════════════════════════════════════════════════════════════
// profile.controller.ts — Gateway proxy for client company profile
// Proxies : GET  /portal/profile
//           PATCH /portal/profile
// Scope   : CLIENT read/write own; STAFF/ADMIN full access
// ════════════════════════════════════════════════════════════════════════════

import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { type ApiResponse, type Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

const CORE = () => process.env.CORE_SERVICE_URL ?? "http://localhost:4002";

function scopeHeaders(
  userId = "",
  role: Role = "CLIENT",
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
export class ProfileController {

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("portal/profile")
  async getProfile(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/portal/profile`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("portal/profile")
  async updateProfile(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/portal/profile`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /portal/settings/notifications ───────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("portal/settings/notifications")
  async getNotificationPrefs(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/portal/settings/notifications`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /portal/settings/notifications ─────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("portal/settings/notifications")
  async updateNotificationPrefs(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/portal/settings/notifications`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /portal/settings/integrations ────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("portal/settings/integrations")
  async getIntegrations(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/portal/settings/integrations`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("portal/settings/integrations/requests")
  async requestIntegration(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/portal/settings/integrations/requests`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN", "STAFF")
  @Patch("portal/settings/integrations/requests/:requestId")
  async updateIntegrationRequest(
    @Param("requestId")       requestId: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestIdHeader?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/portal/settings/integrations/requests/${requestId}`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestIdHeader, traceId)
    );
  }

  // ── POST /data-export-requests ────────────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("data-export-requests")
  async requestDataExport(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/data-export-requests`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /account-deletion-requests ──────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("account-deletion-requests")
  async requestAccountDeletion(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/account-deletion-requests`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }
}
