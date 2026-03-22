import { Controller, Get, Headers, Patch, Body } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";
import type { ApiResponse, Role } from "@maphari/contracts";

@Controller()
export class NotificationPrefsController {
  @Roles("CLIENT", "STAFF", "ADMIN")
  @Get("notification-prefs")
  async getNotifPrefs(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4008";
    return proxyRequest(`${baseUrl}/notification-prefs`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? "",
    });
  }

  @Roles("CLIENT", "STAFF", "ADMIN")
  @Patch("notification-prefs")
  async updateNotifPref(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4008";
    return proxyRequest(`${baseUrl}/notification-prefs`, "PATCH", body, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? "",
    });
  }
}
