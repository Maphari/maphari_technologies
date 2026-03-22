// ════════════════════════════════════════════════════════════════════════════
// survey.controller.ts — Public tokenised NPS survey routes
// Scope: public (no auth) — GET /public/survey/:token, POST /public/survey/:token/respond
// ════════════════════════════════════════════════════════════════════════════

import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type { ApiResponse } from "@maphari/contracts";
import { Public } from "../auth/public.decorator.js";
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
}
