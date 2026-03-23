import { Body, Controller, Delete, Get, Headers, Param, Post } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class AvailabilityController {
  private get baseUrl(): string {
    return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  }

  private headers(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
    return {
      "x-user-id":    userId ?? "",
      "x-user-role":  role ?? "CLIENT",  // least-privilege fallback
      "x-client-id":  clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id":   traceId ?? requestId ?? "",
    };
  }

  @Roles("CLIENT", "ADMIN", "STAFF")
  @Get("portal/availability")
  async listSlots(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/portal/availability`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Post("portal/availability")
  async createSlot(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/portal/availability`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("CLIENT")
  @Post("portal/appointments/book")
  async bookSlot(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/portal/appointments/book`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Delete("portal/availability/:id")
  async deleteSlot(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/portal/availability/${id}`, "DELETE", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }
}
