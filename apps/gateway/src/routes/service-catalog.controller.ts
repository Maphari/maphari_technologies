// ════════════════════════════════════════════════════════════════════════════
// service-catalog.controller.ts — Gateway proxy for service catalog routes
//
// Public:
//   GET  /public/services           — no auth (landing page, marketing)
//
// Portal (clients):
//   GET  /portal/services           — CLIENT | ADMIN | STAFF
//
// Admin read:
//   GET  /admin/services/packages
//   GET  /admin/services/addons
//   GET  /admin/services/retainers
//   GET  /admin/services/bundles
//
// Admin CRUD (ADMIN only):
//   POST|PATCH|DELETE /admin/services/packages/:id?
//   POST|PATCH|DELETE /admin/services/addons/:id?
//   POST|PATCH|DELETE /admin/services/retainers/:id?
//   POST|PATCH|DELETE /admin/services/bundles/:id?
// ════════════════════════════════════════════════════════════════════════════

import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Public } from "../auth/public.decorator.js";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

const CORE = () => process.env.CORE_SERVICE_URL ?? "http://localhost:4002";

function scopeHeaders(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
  return {
    "x-user-id":    userId    ?? "",
    "x-user-role":  role      ?? "CLIENT",
    "x-client-id":  clientId  ?? "",
    "x-request-id": requestId ?? "",
    "x-trace-id":   traceId   ?? requestId ?? "",
  };
}

@Controller()
export class ServiceCatalogController {

  // ── Public (no auth) ────────────────────────────────────────────────────

  @Public()
  @Get("public/services")
  async getPublicServices(): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/public/services`, "GET", undefined, {});
  }

  // ── Portal (client view) ────────────────────────────────────────────────

  @Roles("CLIENT", "ADMIN", "STAFF")
  @Get("portal/services")
  async getPortalServices(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/portal/services`, "GET", undefined, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  // ── Admin — Packages ────────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF")
  @Get("admin/services/packages")
  async listPackages(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/packages`, "GET", undefined, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Post("admin/services/packages")
  async createPackage(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/packages`, "POST", body, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Patch("admin/services/packages/:id")
  async updatePackage(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/packages/${id}`, "PATCH", body, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Delete("admin/services/packages/:id")
  async deletePackage(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/packages/${id}`, "DELETE", undefined, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  // ── Admin — Add-ons ─────────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF")
  @Get("admin/services/addons")
  async listAddons(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/addons`, "GET", undefined, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Post("admin/services/addons")
  async createAddon(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/addons`, "POST", body, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Patch("admin/services/addons/:id")
  async updateAddon(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/addons/${id}`, "PATCH", body, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Delete("admin/services/addons/:id")
  async deleteAddon(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/addons/${id}`, "DELETE", undefined, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  // ── Admin — Retainer Plans ──────────────────────────────────────────────

  @Roles("ADMIN", "STAFF")
  @Get("admin/services/retainers")
  async listRetainers(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/retainers`, "GET", undefined, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Post("admin/services/retainers")
  async createRetainer(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/retainers`, "POST", body, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Patch("admin/services/retainers/:id")
  async updateRetainer(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/retainers/${id}`, "PATCH", body, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Delete("admin/services/retainers/:id")
  async deleteRetainer(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/retainers/${id}`, "DELETE", undefined, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  // ── Admin — Bundles ─────────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF")
  @Get("admin/services/bundles")
  async listBundles(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/bundles`, "GET", undefined, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Post("admin/services/bundles")
  async createBundle(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/bundles`, "POST", body, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Patch("admin/services/bundles/:id")
  async updateBundle(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/bundles/${id}`, "PATCH", body, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Delete("admin/services/bundles/:id")
  async deleteBundle(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/services/bundles/${id}`, "DELETE", undefined, scopeHeaders(userId, role, clientId, requestId, traceId));
  }
}
