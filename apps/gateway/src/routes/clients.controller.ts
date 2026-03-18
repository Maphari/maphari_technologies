import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createClientContactSchema,
  createClientSchema,
  getClientPreferencesQuerySchema,
  getClientQuerySchema,
  type ApiResponse,
  type Role,
  updateClientContactSchema,
  updateClientSchema,
  updateClientStatusSchema,
  upsertClientPreferencesSchema
} from "@maphari/contracts";
import { proxyRequest } from "../utils/proxy-request.js";
import { Roles } from "../auth/roles.decorator.js";

@Controller()
export class ClientsController {
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("clients")
  async listClients(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("clients/directory")
  async listClientDirectory(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedQuery = getClientQuerySchema.safeParse(query ?? {});
    if (!parsedQuery.success) {
      throw new BadRequestException("Invalid client directory query");
    }

    const params = new URLSearchParams();
    Object.entries(parsedQuery.data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });

    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/directory?${params.toString()}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("clients/:clientId")
  async getClientDetail(
    @Param("clientId") targetClientId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("clients")
  async createClient(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createClientSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid client payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Patch("clients/:clientId")
  async updateClient(
    @Param("clientId") targetClientId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateClientSchema.safeParse({ clientId: targetClientId, ...(body as object) });
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid client update payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}`, "PATCH", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Patch("clients/:clientId/status")
  async updateClientStatus(
    @Param("clientId") targetClientId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateClientStatusSchema.safeParse({ clientId: targetClientId, ...(body as object) });
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid client status payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/status`, "PATCH", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("clients/:clientId/contacts")
  async listClientContacts(
    @Param("clientId") targetClientId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/contacts`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Post("clients/:clientId/contacts")
  async createClientContact(
    @Param("clientId") targetClientId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createClientContactSchema.safeParse({ clientId: targetClientId, ...(body as object) });
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid contact payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/contacts`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Patch("clients/:clientId/contacts/:contactId")
  async updateClientContact(
    @Param("clientId") targetClientId: string,
    @Param("contactId") contactId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = updateClientContactSchema.safeParse({
      clientId: targetClientId,
      contactId,
      ...(body as object)
    });
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid contact update payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/contacts/${contactId}`, "PATCH", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("clients/:clientId/activities")
  async listClientActivities(
    @Param("clientId") targetClientId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/activities`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("clients/:clientId/status-history")
  async listClientStatusHistory(
    @Param("clientId") targetClientId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/status-history`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("client-preferences")
  async getClientPreference(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = getClientPreferencesQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException("Invalid client preference query");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/client-preferences?key=${parsed.data.key}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("client-preferences")
  async upsertClientPreference(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsed = upsertClientPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("Invalid client preference payload");
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/client-preferences`, "POST", parsed.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── CX: Onboarding ───────────────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("clients/:clientId/onboarding")
  async getClientOnboarding(
    @Param("clientId") targetClientId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/onboarding`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("clients/:clientId/onboarding/:recordId")
  async patchClientOnboardingRecord(
    @Param("clientId") targetClientId: string,
    @Param("recordId") recordId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/onboarding/${recordId}`, "PATCH", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── CX: Offboarding ──────────────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("clients/:clientId/offboarding")
  async getClientOffboarding(
    @Param("clientId") targetClientId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/offboarding`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("clients/:clientId/offboarding/:taskId")
  async patchClientOffboardingTask(
    @Param("clientId") targetClientId: string,
    @Param("taskId") taskId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/offboarding/${taskId}`, "PATCH", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── CX: Surveys ───────────────────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("clients/:clientId/surveys")
  async getClientSurveys(
    @Param("clientId") targetClientId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/surveys`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("clients/:clientId/surveys/:surveyId/responses")
  async submitClientSurveyResponses(
    @Param("clientId") targetClientId: string,
    @Param("surveyId") surveyId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/surveys/${surveyId}/responses`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── CX: Communication Logs ───────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("clients/:clientId/comms")
  async getClientCommLogs(
    @Param("clientId") targetClientId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/comms`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── CX: SLA Records ──────────────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("clients/:clientId/sla")
  async getClientSla(
    @Param("clientId") targetClientId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${targetClientId}/sla`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── CX: Appointments ─────────────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("appointments")
  async listAppointments(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/appointments`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("appointments")
  async createAppointment(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/appointments`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── CX: Referrals ────────────────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("referrals")
  async listReferrals(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/referrals`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("referrals")
  async createReferral(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/referrals`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── CX: Support Tickets ───────────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("support-tickets")
  async listSupportTickets(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/support-tickets`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("support-tickets")
  async createSupportTicket(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/support-tickets`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("support-tickets/:id/comments")
  async addTicketComment(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/support-tickets/${id}/comments`,
      "POST",
      body as Record<string, unknown>,
      {
        "x-user-id":    userId ?? "",
        "x-user-role":  role ?? "CLIENT",
        "x-client-id":  clientId ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id":   traceId ?? requestId ?? ""
      }
    );
  }

  // ── Team Management ───────────────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("clients/:clientId/team")
  async listClientTeam(
    @Param("clientId") clientId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") scopedClientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${clientId}/team`, "GET", undefined, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": scopedClientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("clients/:clientId/team/invite")
  async inviteClientTeamMember(
    @Param("clientId") clientId: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") scopedClientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/clients/${clientId}/team/invite`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": scopedClientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── Governance: Announcements ──────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("announcements")
  async listAnnouncements(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/announcements${params.size > 0 ? `?${params.toString()}` : ""}`,
      "GET", undefined, {
        "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  // ── Governance: Knowledge Base ─────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("knowledge")
  async listKnowledgeArticles(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/knowledge${params.size > 0 ? `?${params.toString()}` : ""}`,
      "GET", undefined, {
        "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  // ── Governance: Content Submissions ────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("content-submissions")
  async listContentSubmissions(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/content-submissions${params.size > 0 ? `?${params.toString()}` : ""}`,
      "GET", undefined, {
        "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? ""
      }
    );
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("content-submissions")
  async createContentSubmission(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/content-submissions`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── PATCH /content-submissions/:id — CLIENT approve/revisions ────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("content-submissions/:id")
  async updateContentSubmission(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/content-submissions/${id}`, "PATCH", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── PATCH /content-submissions/:id/approve — ADMIN approve ───────────────
  @Roles("ADMIN")
  @Patch("content-submissions/:id/approve")
  async approveContentSubmission(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/content-submissions/${id}/approve`, "PATCH", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /portal/activity-feed — real-time project activity feed ──────────
  @Roles("CLIENT")
  @Get("portal/activity-feed")
  async getPortalActivityFeed(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/portal/activity-feed`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── PATCH /appointments/:id — update appointment status ───────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("appointments/:id")
  async updateAppointment(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/appointments/${id}`, "PATCH", body as Record<string, unknown>, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── NPS: GET /portal/nps-pending — milestones awaiting NPS ──────────────
  @Roles("CLIENT")
  @Get("portal/nps-pending")
  async getPortalNpsPending(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/portal/nps-pending`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── NPS: POST /portal/nps-response — submit NPS score ────────────────────
  @Roles("CLIENT")
  @Post("portal/nps-response")
  async submitPortalNpsResponse(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/portal/nps-response`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── Comments: GET /comments ───────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("comments")
  async getComments(
    @Query() query: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(
      `${baseUrl}/comments?${params.toString()}`,
      "GET",
      undefined,
      {
        "x-user-id": userId ?? "",
        "x-user-role": role ?? "CLIENT",
        "x-client-id": clientId ?? "",
        "x-request-id": requestId ?? "",
        "x-trace-id": traceId ?? requestId ?? "",
      }
    );
  }

  // ── Comments: POST /comments ──────────────────────────────────────────────

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("comments")
  async postComment(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/comments`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? "",
    });
  }
}
