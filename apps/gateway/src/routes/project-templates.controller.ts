// ════════════════════════════════════════════════════════════════════════════
// project-templates.controller.ts — Gateway proxy for admin project templates
//
// Admin only:
//   GET    /admin/project-templates
//   POST   /admin/project-templates
//   DELETE /admin/project-templates/:id
//   POST   /admin/project-templates/:id/apply
// ════════════════════════════════════════════════════════════════════════════

import { Body, Controller, Delete, Get, Headers, Param, Post } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

const CORE = () => process.env.CORE_SERVICE_URL ?? "http://localhost:4002";

function scopeHeaders(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
  return {
    "x-user-id":    userId    ?? "",
    "x-user-role":  role      ?? "ADMIN",
    "x-client-id":  clientId  ?? "",
    "x-request-id": requestId ?? "",
    "x-trace-id":   traceId   ?? requestId ?? "",
  };
}

@Controller()
export class ProjectTemplatesController {

  @Roles("ADMIN")
  @Get("admin/project-templates")
  async listTemplates(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/project-templates`, "GET", undefined, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Post("admin/project-templates")
  async createTemplate(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/project-templates`, "POST", body as Record<string, unknown>, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Delete("admin/project-templates/:id")
  async deleteTemplate(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/project-templates/${id}`, "DELETE", undefined, scopeHeaders(userId, role, clientId, requestId, traceId));
  }

  @Roles("ADMIN")
  @Post("admin/project-templates/:id/apply")
  async applyTemplate(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/admin/project-templates/${id}/apply`, "POST", body as Record<string, unknown>, scopeHeaders(userId, role, clientId, requestId, traceId));
  }
}
