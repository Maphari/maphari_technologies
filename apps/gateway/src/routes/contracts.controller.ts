import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class ContractsController {
  private get baseUrl(): string {
    return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  }

  private headers(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
    return {
      "x-user-id":      userId    ?? "",
      "x-user-role":    role      ?? "CLIENT",
      "x-client-id":    clientId  ?? "",
      "x-request-id":   requestId ?? "",
      "x-trace-id":     traceId   ?? requestId ?? "",
    };
  }

  // ── GET /contracts ──────────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("contracts")
  async listContracts(
    @Query("clientId") clientId?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") scopedClientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
    return proxyRequest(`${this.baseUrl}/contracts${qs}`, "GET", undefined, this.headers(userId, role, scopedClientId, requestId, traceId));
  }

  // ── POST /contracts ─────────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("contracts")
  async createContract(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/contracts`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── PATCH /contracts/:id ────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("contracts/:id")
  async patchContract(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/contracts/${id}`, "PATCH", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── GET /contracts/:id/download ─────────────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("contracts/:id/download")
  async getContractDownload(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/contracts/${id}/download`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── GET /contract-templates ──────────────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("contract-templates")
  async listTemplates(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/contract-templates`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── GET /contract-templates/:id ──────────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("contract-templates/:id")
  async getTemplate(
    @Param("id") id: string,
    @Query() query: Record<string, string>,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    const qs = new URLSearchParams(query).toString();
    return proxyRequest(`${this.baseUrl}/contract-templates/${id}${qs ? "?" + qs : ""}`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── POST /contracts/generate ─────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("contracts/generate")
  async generateContract(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/contracts/generate`, "POST", body as Record<string, unknown>, this.headers(userId, role, clientId, requestId, traceId));
  }
}
