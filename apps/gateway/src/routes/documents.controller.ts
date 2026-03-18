import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

/**
 * Document Vault proxy controller.
 *
 * All routes are ADMIN / STAFF only — the files service enforces this again
 * via x-user-role, providing defence-in-depth.
 *
 * Proxies to FILES_SERVICE_URL/admin/documents.
 */
@Controller()
export class DocumentsController {
  private get baseUrl(): string {
    return process.env.FILES_SERVICE_URL ?? "http://localhost:4005";
  }

  private headers(
    userId: string | undefined,
    role: Role | undefined,
    clientId: string | undefined,
    requestId: string | undefined,
    traceId: string | undefined
  ) {
    return {
      "x-user-id":    userId    ?? "",
      "x-user-role":  role      ?? "ADMIN",
      "x-client-id":  clientId  ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id":   traceId   ?? requestId ?? "",
    };
  }

  // ── GET /admin/documents ────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("admin/documents")
  async listDocuments(
    @Query("category")  category?:  string,
    @Query("clientId")  clientId?:  string,
    @Query("status")    status?:    string,
    @Headers("x-user-id")    userId?:    string,
    @Headers("x-user-role")  role?:      Role,
    @Headers("x-client-id")  xClientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?:   string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (category) params.set("category",  category);
    if (clientId) params.set("clientId",  clientId);
    if (status)   params.set("status",    status);

    const qs = params.toString();
    return proxyRequest(
      `${this.baseUrl}/admin/documents${qs ? `?${qs}` : ""}`,
      "GET",
      undefined,
      this.headers(userId, role, xClientId, requestId, traceId)
    );
  }

  // ── POST /admin/documents ───────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("admin/documents")
  async createDocument(
    @Body() body: unknown,
    @Headers("x-user-id")    userId?:    string,
    @Headers("x-user-role")  role?:      Role,
    @Headers("x-client-id")  clientId?:  string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?:   string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${this.baseUrl}/admin/documents`,
      "POST",
      body,
      this.headers(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /admin/documents/export-index ───────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("admin/documents/export-index")
  async exportIndex(
    @Headers("x-user-id")    userId?:    string,
    @Headers("x-user-role")  role?:      Role,
    @Headers("x-client-id")  clientId?:  string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?:   string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${this.baseUrl}/admin/documents/export-index`,
      "GET",
      undefined,
      this.headers(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /admin/documents/:id ──────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Patch("admin/documents/:id")
  async updateDocument(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id")    userId?:    string,
    @Headers("x-user-role")  role?:      Role,
    @Headers("x-client-id")  clientId?:  string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?:   string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${this.baseUrl}/admin/documents/${id}`,
      "PATCH",
      body,
      this.headers(userId, role, clientId, requestId, traceId)
    );
  }

  // ── DELETE /admin/documents/:id ─────────────────────────────────────────
  @Roles("ADMIN")
  @Delete("admin/documents/:id")
  async archiveDocument(
    @Param("id") id: string,
    @Headers("x-user-id")    userId?:    string,
    @Headers("x-user-role")  role?:      Role,
    @Headers("x-client-id")  clientId?:  string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?:   string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${this.baseUrl}/admin/documents/${id}`,
      "DELETE",
      undefined,
      this.headers(userId, role, clientId, requestId, traceId)
    );
  }
}
