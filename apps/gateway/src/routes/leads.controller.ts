import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import {
  bulkUpdateLeadStatusSchema,
  createLeadSchema,
  getLeadPreferencesQuerySchema,
  mergeLeadsSchema,
  type ApiResponse,
  type Role,
  upsertLeadPreferencesSchema,
  updateLeadSchema,
  updateLeadStatusSchema
} from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class LeadsController {
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("leads")
  async listLeads(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/leads`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("leads")
  async createLead(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createLeadSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid lead payload");
    }

    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/leads`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("leads/:leadId/status")
  async updateLeadStatus(
    @Param("leadId") leadId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateLeadStatusSchema.safeParse({ leadId, ...(body as object) });
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid lead status payload");
    }

    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/leads/${parsedBody.data.leadId}/status`,
      "PATCH",
      { status: parsedBody.data.status, lostReason: parsedBody.data.lostReason },
      {
        "x-user-id": userId ?? "",
        "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("leads/:leadId")
  async updateLead(
    @Param("leadId") leadId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateLeadSchema.safeParse({ leadId, ...(body as object) });
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid lead update payload");
    }

    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/leads/${parsedBody.data.leadId}`,
      "PATCH",
      {
        title: parsedBody.data.title,
        source: parsedBody.data.source,
        notes: parsedBody.data.notes,
        contactName: parsedBody.data.contactName,
        contactEmail: parsedBody.data.contactEmail,
        contactPhone: parsedBody.data.contactPhone,
        company: parsedBody.data.company,
        ownerName: parsedBody.data.ownerName,
        nextFollowUpAt: parsedBody.data.nextFollowUpAt
      },
      {
        "x-user-id": userId ?? "",
        "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  @Roles("ADMIN", "STAFF")
  @Post("leads/bulk-status")
  async bulkUpdateLeadStatus(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = bulkUpdateLeadStatusSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid bulk lead status payload");
    }

    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/leads/bulk-status`,
      "POST",
      {
        leadIds: parsedBody.data.leadIds,
        status: parsedBody.data.status,
        lostReason: parsedBody.data.lostReason
      },
      {
        "x-user-id": userId ?? "",
        "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  @Roles("ADMIN")
  @Post("leads/merge")
  async mergeLeads(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = mergeLeadsSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid merge payload");
    }

    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/leads/merge`,
      "POST",
      {
        primaryLeadId: parsedBody.data.primaryLeadId,
        duplicateLeadId: parsedBody.data.duplicateLeadId
      },
      {
        "x-user-id": userId ?? "",
        "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("leads/:leadId/activities")
  async listLeadActivities(
    @Param("leadId") leadId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/leads/${leadId}/activities`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("leads/analytics")
  async getLeadAnalytics(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/leads/analytics`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("leads/preferences")
  async getLeadPreferences(
    @Query("key") key = "savedView",
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = getLeadPreferencesQuerySchema.safeParse({ key });
    if (!parsed.success) {
      throw new BadRequestException("Invalid preference query");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/leads/preferences?key=${parsed.data.key}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("leads/preferences")
  async upsertLeadPreferences(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = upsertLeadPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("Invalid preference payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/leads/preferences`, "POST", parsed.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
