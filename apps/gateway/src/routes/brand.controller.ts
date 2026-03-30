import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class BrandController {
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

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("brand-assets")
  async listBrandAssets(
    @Query("type") type?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    const qs = type ? `?type=${encodeURIComponent(type)}` : "";
    return proxyRequest(`${this.baseUrl}/brand-assets${qs}`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("brand-assets")
  async createBrandAsset(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/brand-assets`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Delete("brand-assets/:id")
  async deleteBrandAsset(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/brand-assets/${id}`, "DELETE", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── GET /email-templates ─────────────────────────────────────────────────
  @Roles("ADMIN")
  @Get("email-templates")
  async listEmailTemplates(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/email-templates`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── POST /email-templates ────────────────────────────────────────────────
  @Roles("ADMIN")
  @Post("email-templates")
  async createEmailTemplate(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/email-templates`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── PATCH /email-templates/:id ───────────────────────────────────────────
  @Roles("ADMIN")
  @Patch("email-templates/:id")
  async updateEmailTemplate(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/email-templates/${id}`, "PATCH", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── DELETE /email-templates/:id ──────────────────────────────────────────
  @Roles("ADMIN")
  @Delete("email-templates/:id")
  async deleteEmailTemplate(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/email-templates/${id}`, "DELETE", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── GET /custom-domains ──────────────────────────────────────────────────
  @Roles("ADMIN")
  @Get("custom-domains")
  async listCustomDomains(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/custom-domains`, "GET", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── POST /custom-domains ─────────────────────────────────────────────────
  @Roles("ADMIN")
  @Post("custom-domains")
  async createCustomDomain(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/custom-domains`, "POST", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── PATCH /custom-domains/:id ────────────────────────────────────────────
  @Roles("ADMIN")
  @Patch("custom-domains/:id")
  async updateCustomDomain(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/custom-domains/${id}`, "PATCH", body, this.headers(userId, role, clientId, requestId, traceId));
  }

  // ── DELETE /custom-domains/:id ───────────────────────────────────────────
  @Roles("ADMIN")
  @Delete("custom-domains/:id")
  async deleteCustomDomain(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/custom-domains/${id}`, "DELETE", undefined, this.headers(userId, role, clientId, requestId, traceId));
  }
}
