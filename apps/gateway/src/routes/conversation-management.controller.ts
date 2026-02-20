import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createConversationEscalationSchema,
  createConversationNoteSchema,
  getConversationEscalationsQuerySchema,
  getConversationNotesQuerySchema,
  type ApiResponse,
  type Role,
  updateConversationEscalationSchema
} from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class ConversationManagementController {
  @Roles("ADMIN", "STAFF")
  @Get("conversation-notes")
  async listConversationNotes(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = getConversationNotesQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException("Invalid conversation note query");
    }
    const params = new URLSearchParams();
    params.set("conversationId", parsed.data.conversationId);
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/conversation-notes?${params.toString()}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("conversation-notes")
  async createConversationNote(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createConversationNoteSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid conversation note payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/conversation-notes`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Get("conversation-escalations")
  async listEscalations(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = getConversationEscalationsQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException("Invalid conversation escalation query");
    }
    const params = new URLSearchParams();
    if (parsed.data.conversationId) params.set("conversationId", parsed.data.conversationId);
    if (parsed.data.status) params.set("status", parsed.data.status);
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/conversation-escalations?${params.toString()}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("conversation-escalations")
  async createEscalation(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createConversationEscalationSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid conversation escalation payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/conversation-escalations`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Patch("conversation-escalations/:escalationId")
  async updateEscalation(
    @Param("escalationId") escalationId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateConversationEscalationSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid escalation update payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/conversation-escalations/${escalationId}`, "PATCH", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
