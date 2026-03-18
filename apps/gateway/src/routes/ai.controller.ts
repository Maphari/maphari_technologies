import { BadRequestException, Body, Controller, Get, Headers, Post } from "@nestjs/common";
import {
  aiEstimateSchema,
  aiGenerateSchema,
  aiLeadQualificationSchema,
  aiProposalDraftSchema,
  type ApiResponse,
  type Role
} from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class AiController {
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("ai/generate")
  async generate(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = aiGenerateSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid ai generate payload");
    }

    const baseUrl = process.env.AI_SERVICE_URL ?? "http://localhost:4007";
    return proxyRequest(`${baseUrl}/ai/generate`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("ai/jobs")
  async listJobs(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AI_SERVICE_URL ?? "http://localhost:4007";
    return proxyRequest(`${baseUrl}/ai/jobs`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("ai/lead-qualify")
  async leadQualify(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = aiLeadQualificationSchema.safeParse(body);
    if (!parsedBody.success) throw new BadRequestException("Invalid ai lead qualification payload");

    const baseUrl = process.env.AI_SERVICE_URL ?? "http://localhost:4007";
    return proxyRequest(`${baseUrl}/ai/lead-qualify`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("ai/proposal-draft")
  async proposalDraft(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = aiProposalDraftSchema.safeParse(body);
    if (!parsedBody.success) throw new BadRequestException("Invalid ai proposal draft payload");

    const baseUrl = process.env.AI_SERVICE_URL ?? "http://localhost:4007";
    return proxyRequest(`${baseUrl}/ai/proposal-draft`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN")
  @Get("ai/recommendations")
  async recommendations(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.AI_SERVICE_URL ?? "http://localhost:4007";
    return proxyRequest(`${baseUrl}/ai/recommendations`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("ai/auto-draft")
  async autoDraft(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    if (!body || typeof body !== "object") {
      throw new BadRequestException("Invalid auto-draft payload");
    }
    const baseUrl = process.env.AI_SERVICE_URL ?? "http://localhost:4007";
    return proxyRequest(`${baseUrl}/ai/auto-draft`, "POST", body, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("ai/estimate")
  async estimate(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = aiEstimateSchema.safeParse(body);
    if (!parsedBody.success) throw new BadRequestException("Invalid ai estimate payload");

    const baseUrl = process.env.AI_SERVICE_URL ?? "http://localhost:4007";
    return proxyRequest(`${baseUrl}/ai/estimate`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("ai/prospect")
  async runProspecting(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    if (!body || typeof body !== "object") {
      throw new BadRequestException("Invalid prospect payload");
    }
    const baseUrl = process.env.AI_SERVICE_URL ?? "http://localhost:4007";
    return proxyRequest(`${baseUrl}/ai/prospect`, "POST", body, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("ai/prospect/send-pitch")
  async sendPitch(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    if (
      !body ||
      typeof body !== "object" ||
      !("to" in body) ||
      !("subject" in body) ||
      !("body" in body)
    ) {
      throw new BadRequestException("to, subject, and body are required");
    }
    const baseUrl = process.env.AI_SERVICE_URL ?? "http://localhost:4007";
    return proxyRequest(`${baseUrl}/ai/prospect/send-pitch`, "POST", body, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}