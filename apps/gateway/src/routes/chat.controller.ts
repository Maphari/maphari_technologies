import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import {
  createConversationSchema,
  createMessageSchema,
  updateConversationAssigneeSchema,
  updateMessageDeliverySchema,
  type ApiResponse,
  type Role
} from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class ChatController {
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("conversations")
  async listConversations(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CHAT_SERVICE_URL ?? "http://localhost:4004";
    return proxyRequest(`${baseUrl}/conversations`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("conversations")
  async createConversation(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createConversationSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid conversation payload");
    }

    const baseUrl = process.env.CHAT_SERVICE_URL ?? "http://localhost:4004";
    return proxyRequest(`${baseUrl}/conversations`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Patch("conversations/:conversationId/assignee")
  async updateConversationAssignee(
    @Param("conversationId") conversationId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateConversationAssigneeSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid assignee payload");
    }

    const baseUrl = process.env.CHAT_SERVICE_URL ?? "http://localhost:4004";
    return proxyRequest(`${baseUrl}/conversations/${conversationId}/assignee`, "PATCH", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("conversations/:conversationId/messages")
  async listMessages(
    @Param("conversationId") conversationId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CHAT_SERVICE_URL ?? "http://localhost:4004";
    return proxyRequest(`${baseUrl}/conversations/${conversationId}/messages`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("messages")
  async createMessage(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createMessageSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid message payload");
    }

    const baseUrl = process.env.CHAT_SERVICE_URL ?? "http://localhost:4004";
    return proxyRequest(`${baseUrl}/messages`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("messages/:messageId/delivery")
  async updateMessageDelivery(
    @Param("messageId") messageId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateMessageDeliverySchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid message delivery payload");
    }

    const baseUrl = process.env.CHAT_SERVICE_URL ?? "http://localhost:4004";
    return proxyRequest(`${baseUrl}/messages/${messageId}/delivery`, "PATCH", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
