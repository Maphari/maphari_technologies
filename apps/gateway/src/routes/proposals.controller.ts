import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { signProposalSchema, type ApiResponse, type Role } from "@maphari/contracts";
import { BadRequestException } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class ProposalsController {
  private get baseUrl(): string {
    return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  }

  private headers(
    userId?: string,
    role?: Role,
    clientId?: string,
    requestId?: string,
    traceId?: string
  ) {
    return {
      "x-user-id":    userId    ?? "",
      "x-user-role":  role      ?? "CLIENT",
      "x-client-id":  clientId  ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id":   traceId   ?? requestId ?? "",
    };
  }

  // ── POST /proposals/sign — existing route ────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("proposals/sign")
  async signProposal(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = signProposalSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid proposal sign payload");
    }
    return proxyRequest(
      `${this.baseUrl}/proposals/sign`,
      "POST",
      parsedBody.data,
      this.headers(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /admin/proposals — create proposal ───────────────────────────────────
  @Roles("ADMIN")
  @Post("admin/proposals")
  async createProposal(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${this.baseUrl}/admin/proposals`,
      "POST",
      body,
      this.headers(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /admin/proposals — list all proposals ─────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("admin/proposals")
  async listAdminProposals(
    @Query("clientId") qClientId?: string,
    @Query("status") qStatus?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (qClientId) params.set("clientId", qClientId);
    if (qStatus)   params.set("status",   qStatus);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return proxyRequest(
      `${this.baseUrl}/admin/proposals${qs}`,
      "GET",
      undefined,
      this.headers(userId, role, clientId, requestId, traceId)
    );
  }

  // ── DELETE /admin/proposals/:id — delete draft proposal ──────────────────────
  @Roles("ADMIN")
  @Delete("admin/proposals/:id")
  async deleteAdminProposal(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${this.baseUrl}/admin/proposals/${id}`,
      "DELETE",
      undefined,
      this.headers(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /portal/proposals — list client proposals ─────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("portal/proposals")
  async listPortalProposals(
    @Query("clientId") qClientId?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (qClientId) params.set("clientId", qClientId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return proxyRequest(
      `${this.baseUrl}/portal/proposals${qs}`,
      "GET",
      undefined,
      this.headers(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /portal/proposals/:id/accept ───────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("portal/proposals/:id/accept")
  async acceptPortalProposal(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${this.baseUrl}/portal/proposals/${id}/accept`,
      "PATCH",
      undefined,
      this.headers(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /portal/proposals/:id/decline ──────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("portal/proposals/:id/decline")
  async declinePortalProposal(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${this.baseUrl}/portal/proposals/${id}/decline`,
      "PATCH",
      body,
      this.headers(userId, role, clientId, requestId, traceId)
    );
  }
}
