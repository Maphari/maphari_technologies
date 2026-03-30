import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

const CORE = () => process.env.CORE_SERVICE_URL ?? "http://localhost:4002";

function scopeHeaders(userId?: string, role?: Role, clientId?: string, requestId?: string, traceId?: string) {
  return {
    "x-user-id": userId ?? "",
    "x-user-role": role ?? "STAFF",
    "x-client-id": clientId ?? "",
    "x-request-id": requestId ?? "",
    "x-trace-id": traceId ?? requestId ?? "",
  };
}

@Controller()
export class IntegrationProvidersController {
  @Roles("ADMIN", "STAFF")
  @Get("admin/integrations/providers")
  async listProviders(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null) params.set(key, String(value));
      });
    }
    const queryString = params.size > 0 ? `?${params.toString()}` : "";
    return proxyRequest(
      `${CORE()}/admin/integrations/providers${queryString}`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN", "STAFF")
  @Patch("admin/integrations/providers/:providerId")
  async updateProvider(
    @Param("providerId") providerId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/integrations/providers/${providerId}`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN", "STAFF")
  @Get("admin/integration-requests")
  async listIntegrationRequests(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null) params.set(key, String(value));
      });
    }
    const queryString = params.size > 0 ? `?${params.toString()}` : "";
    return proxyRequest(
      `${CORE()}/admin/integration-requests${queryString}`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN", "STAFF")
  @Patch("admin/integration-requests/:requestId")
  async updateIntegrationRequest(
    @Param("requestId") requestIdParam: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/integration-requests/${requestIdParam}`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN", "STAFF")
  @Post("admin/integrations/tasks/:taskId/create-external-link")
  async createExternalTaskLink(
    @Param("taskId") taskId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/integrations/tasks/${taskId}/create-external-link`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN", "STAFF")
  @Get("admin/integrations/connections")
  async listConnections(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null) params.set(key, String(value));
      });
    }
    const queryString = params.size > 0 ? `?${params.toString()}` : "";
    return proxyRequest(
      `${CORE()}/admin/integrations/connections${queryString}`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN", "STAFF")
  @Get("admin/integrations/connections/:connectionId/sync-events")
  async getConnectionSyncEvents(
    @Param("connectionId") connectionId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/integrations/connections/${connectionId}/sync-events`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN", "STAFF")
  @Post("admin/integrations/connections")
  async createConnection(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/integrations/connections`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN", "STAFF")
  @Patch("admin/integrations/connections/:connectionId")
  async updateConnection(
    @Param("connectionId") connectionId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/integrations/connections/${connectionId}`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN")
  @Post("admin/integrations/seed-providers")
  async seedProviders(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/integrations/seed-providers`,
      "POST",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  @Roles("ADMIN", "STAFF")
  @Get("admin/tasks/:taskId/integration-sync-events")
  async getTaskIntegrationSyncEvents(
    @Param("taskId") taskId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/tasks/${taskId}/integration-sync-events`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }
}
