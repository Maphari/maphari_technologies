// ════════════════════════════════════════════════════════════════════════════
// survey.controller.ts — NPS survey routes (public + admin/staff token gen)
// Scope: public (no auth) for GET/respond; ADMIN/STAFF for token generation
// ════════════════════════════════════════════════════════════════════════════

import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import type { ApiResponse, Role } from "@maphari/contracts";
import { Public } from "../auth/public.decorator.js";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class SurveyController {
  private get baseUrl(): string {
    return process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  }

  // ── GET /public/survey/:token ─────────────────────────────────────────────
  @Public()
  @Get("public/survey/:token")
  async getSurveyByToken(
    @Param("token") token: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/public/survey/${token}`, "GET", undefined, {});
  }

  // ── POST /public/survey/:token/respond ────────────────────────────────────
  @Public()
  @Post("public/survey/:token/respond")
  async respondToSurvey(
    @Param("token") token: string,
    @Body() body: unknown
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/public/survey/${token}/respond`, "POST", body as Record<string, unknown>, {});
  }

  // ── POST /clients/:clientId/surveys/:surveyId/tokens ─────────────────────
  // Admin/Staff only — generates a share token for the specified survey
  @Roles("ADMIN", "STAFF")
  @Post("clients/:clientId/surveys/:surveyId/tokens")
  async generateSurveyToken(
    @Param("clientId") targetClientId: string,
    @Param("surveyId") surveyId: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${this.baseUrl}/clients/${targetClientId}/surveys/${surveyId}/tokens`, "POST", {}, {
      "x-user-id": userId ?? "", "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "", "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
