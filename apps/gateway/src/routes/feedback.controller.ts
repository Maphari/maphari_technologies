import { Body, Controller, Delete, Get, Headers, Param, Post } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class FeedbackController {
  private get baseUrl(): string {
    return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  }

  private headers(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
    return {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? "",
    };
  }

  // ── POST /feedback/:ticketId/reactions ────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("feedback/:ticketId/reactions")
  async addReaction(
    @Param("ticketId") ticketId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/feedback/${ticketId}/reactions`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── DELETE /feedback/:ticketId/reactions/:emoji ───────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Delete("feedback/:ticketId/reactions/:emoji")
  async removeReaction(
    @Param("ticketId") ticketId: string,
    @Param("emoji") emoji: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/feedback/${ticketId}/reactions/${emoji}`, "DELETE", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── GET /feedback/:ticketId/replies ───────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("feedback/:ticketId/replies")
  async listReplies(
    @Param("ticketId") ticketId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/feedback/${ticketId}/replies`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── POST /feedback/:ticketId/replies ──────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("feedback/:ticketId/replies")
  async addReply(
    @Param("ticketId") ticketId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/feedback/${ticketId}/replies`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }
}
