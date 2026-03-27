// ════════════════════════════════════════════════════════════════════════════
// staff.controller.ts — Gateway proxy for staff-specific routes
// Proxies : /staff/health-scores, /staff/me/analytics, /staff/me/capacity,
//           /staff/approvals, /staff/approvals/:type/:id,
//           /staff/me/top-tasks, /staff/me/performance,
//           /staff/team-performance, /staff/client-budgets,
//           /staff/client-sentiments, /staff/interventions,
//           /staff/feedback, /staff/me/response-times,
//           /staff/retainer-burn, /staff/me/milestone-signoffs,
//           /staff/decisions, /staff/comms,
//           /staff/me, /staff/tasks, /staff/:staffId/onboarding,
//           /handovers, /meetings, /standup, /peer-reviews,
//           /leave-requests, /training, /payslips/me, /video-rooms
// Scope   : ADMIN + STAFF only (CLIENT forbidden)
// ════════════════════════════════════════════════════════════════════════════

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
import { type ApiResponse, type Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

const CORE = () => process.env.CORE_SERVICE_URL ?? "http://localhost:4002";

/** Shared scope headers forwarded on every proxied request */
function scopeHeaders(
  userId = "",
  role: Role = "STAFF",
  clientId = "",
  requestId = "",
  traceId = ""
) {
  return {
    "x-user-id":    userId,
    "x-user-role":  role,
    "x-client-id":  clientId,
    "x-request-id": requestId,
    "x-trace-id":   traceId || requestId,
  };
}

@Controller()
export class StaffController {

  // ── GET /staff — list all active staff profiles (admin use) ───────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff")
  async listStaffProfiles(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/health-scores ──────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/health-scores")
  async listHealthScores(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/health-scores`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/me/analytics ───────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/me/analytics")
  async getMyAnalytics(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/me/analytics`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/me/capacity ────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/me/capacity")
  async getMyCapacity(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/me/capacity`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/approvals ──────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/approvals")
  async listApprovals(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/approvals`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /staff/approvals/:type/:id ─────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Patch("staff/approvals/:type/:id")
  async resolveApproval(
    @Param("type")            type: string,
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    const validTypes = ["milestone", "change-request", "design-review"];
    if (!validTypes.includes(type)) {
      return {
        success: false,
        error: { code: "INVALID_TYPE", message: `Unknown approval type '${type}'.` }
      };
    }
    return proxyRequest(
      `${CORE()}/staff/approvals/${type}/${id}`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/me/top-tasks ───────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/me/top-tasks")
  async getMyTopTasks(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/me/top-tasks`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/me/performance ─────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/me/performance")
  async getMyPerformance(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/me/performance`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /admin/staff/performance — full metrics per staff member (ADMIN only) ─
  @Roles("ADMIN")
  @Get("admin/staff/performance")
  async getAdminStaffPerformance(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/staff/performance`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/team-performance ───────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/team-performance")
  async getTeamPerformance(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/team-performance`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/client-budgets ─────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/client-budgets")
  async getClientBudgets(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/client-budgets`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/client-sentiments ──────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/client-sentiments")
  async getClientSentiments(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/client-sentiments`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /staff/client-sentiments/:clientId ──────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Patch("staff/client-sentiments/:clientId")
  async updateClientSentiment(
    @Param("clientId")        clientId: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   xClientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/client-sentiments/${clientId}`,
      "PATCH",
      body,
      scopeHeaders(userId, role, xClientId, requestId, traceId)
    );
  }

  // ── GET /staff/interventions ──────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/interventions")
  async getInterventions(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/interventions`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/feedback ───────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/feedback")
  async getFeedback(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/feedback`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /staff/feedback/:feedbackType/:id/acknowledge ───────────────────
  @Roles("ADMIN", "STAFF")
  @Patch("staff/feedback/:feedbackType/:id/acknowledge")
  async acknowledgeFeedback(
    @Param("feedbackType")    feedbackType: string,
    @Param("id")              id: string,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    const validTypes = ["survey", "ticket"];
    if (!validTypes.includes(feedbackType)) {
      return {
        success: false,
        error: { code: "INVALID_TYPE", message: `Unknown feedback type '${feedbackType}'.` }
      };
    }
    return proxyRequest(
      `${CORE()}/staff/feedback/${feedbackType}/${id}/acknowledge`,
      "PATCH",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/me/response-times ──────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/me/response-times")
  async getMyResponseTimes(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/me/response-times`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/retainer-burn ──────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/retainer-burn")
  async getRetainerBurn(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/retainer-burn`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/me/milestone-signoffs ─────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/me/milestone-signoffs")
  async getMyMilestoneSignoffs(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/me/milestone-signoffs`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/decisions ──────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/decisions")
  async getStaffDecisions(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/decisions`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/comms ──────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/comms")
  async getStaffComms(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/comms`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/me ─────────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/me")
  async getMyProfile(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/me`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /staff/me ───────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Patch("staff/me")
  async updateMyProfile(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/me`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/tasks ──────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/tasks")
  async getMyTasks(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/tasks`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /staff/tasks ─────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("staff/tasks")
  async createTask(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/tasks`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /staff/tasks/:id/status ─────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Patch("staff/tasks/:id/status")
  async updateTaskStatus(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/tasks/${id}/status`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/:staffId/onboarding ────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/:staffId/onboarding")
  async getStaffOnboarding(
    @Param("staffId")         staffId: string,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/${staffId}/onboarding`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /handovers ────────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("handovers")
  async listHandovers(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/handovers`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /handovers/:id ──────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Patch("handovers/:id")
  async updateHandover(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/handovers/${id}`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /handovers/:id/summarise ────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("handovers/:id/summarise")
  async summariseHandover(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string,
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/handovers/${id}/summarise`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /meetings ─────────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("meetings")
  async listMeetings(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/meetings`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /video-rooms ─────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("video-rooms")
  async createVideoRoom(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/video-rooms`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /standup/me — current user's standup history ─────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("standup/me")
  async listMyStandups(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/standup/me`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /standup ──────────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("standup")
  async listStandups(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/standup`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /standup ─────────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("standup")
  async postStandup(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/standup`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /peer-reviews ─────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("peer-reviews")
  async listPeerReviews(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/peer-reviews`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /peer-reviews ────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("peer-reviews")
  async createPeerReview(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/peer-reviews`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /peer-reviews/:id/submit ────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Patch("peer-reviews/:id/submit")
  async submitPeerReview(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/peer-reviews/${id}/submit`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /leave-requests ───────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("leave-requests")
  async listLeaveRequests(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/leave-requests`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /leave-requests ──────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("leave-requests")
  async submitLeaveRequest(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/leave-requests`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /training ─────────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("training")
  async listTraining(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/training`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /payslips/me ──────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("payslips/me")
  async getMyPayslips(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/payslips/me`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /payslips — list all payslips (ADMIN) ─────────────────────────────
  @Roles("ADMIN")
  @Get("payslips")
  async listPayslips(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/payslips`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /payslips — create payslip (ADMIN) ───────────────────────────────
  @Roles("ADMIN")
  @Post("payslips")
  async createPayslip(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/payslips`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /leave-requests/:id/approve — approve leave (ADMIN) ────────────
  @Roles("ADMIN")
  @Patch("leave-requests/:id/approve")
  async approveLeaveRequest(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/leave-requests/${id}/approve`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /leave-requests/:id/decline — decline leave (ADMIN) ────────────
  @Roles("ADMIN")
  @Patch("leave-requests/:id/decline")
  async declineLeaveRequest(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/leave-requests/${id}/decline`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /job-postings ─────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("job-postings")
  async listJobPostings(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/job-postings`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /job-postings ────────────────────────────────────────────────────
  @Roles("ADMIN")
  @Post("job-postings")
  async createJobPosting(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/job-postings`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /job-postings/:id ───────────────────────────────────────────────
  @Roles("ADMIN")
  @Patch("job-postings/:id")
  async updateJobPosting(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/job-postings/${id}`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /job-postings/:id/applications ────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("job-postings/:id/applications")
  async listJobApplications(
    @Param("id")              id: string,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/job-postings/${id}/applications`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /job-postings/:id/applications ───────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("job-postings/:id/applications")
  async createJobApplication(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/job-postings/${id}/applications`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /job-applications/:id ───────────────────────────────────────────
  @Roles("ADMIN")
  @Patch("job-applications/:id")
  async updateJobApplication(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/job-applications/${id}`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/auto-drafts — list saved AI auto-draft logs ──────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/auto-drafts")
  async listAutoDrafts(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/auto-drafts`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /staff/auto-drafts — save an AI auto-draft ──────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("staff/auto-drafts")
  async createAutoDraft(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/auto-drafts`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/workload-heatmap — 4-week capacity heatmap ────────────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/workload-heatmap")
  async getWorkloadHeatmap(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/workload-heatmap`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff/client-notes/:clientId — list private CRM notes ───────────
  @Roles("ADMIN", "STAFF")
  @Get("staff/client-notes/:clientId")
  async listClientNotes(
    @Param("clientId")        clientId: string,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   xClientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/client-notes/${clientId}`,
      "GET",
      undefined,
      scopeHeaders(userId, role, xClientId, requestId, traceId)
    );
  }

  // ── POST /staff/client-notes — create a private CRM note ─────────────────
  @Roles("ADMIN", "STAFF")
  @Post("staff/client-notes")
  async createClientNote(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/client-notes`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── DELETE /staff/client-notes/:id — delete a private CRM note ───────────
  @Roles("ADMIN", "STAFF")
  @Delete("staff/client-notes/:id")
  async deleteClientNote(
    @Param("id")              id: string,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff/client-notes/${id}`,
      "DELETE",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /standup/feed — admin view of all standup entries ─────────────────
  @Roles("ADMIN", "STAFF")
  @Get("standup/feed")
  async getStandupFeed(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/standup/feed`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Staff Goals (OKR / Personal Goal Tracking)
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /staff/goals — list my goals (optionally filter by quarter) ───────
  @Roles("ADMIN", "STAFF")
  @Get("staff/goals")
  async listMyGoals(
    @Query("quarter")         quarter?: string,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    const qs = quarter ? `?quarter=${encodeURIComponent(quarter)}` : "";
    return proxyRequest(
      `${CORE()}/staff-goals${qs}`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /staff/goals — create a new personal goal ────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("staff/goals")
  async createMyGoal(
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff-goals`,
      "POST",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /staff/goals/:id — update progress, status, title ──────────────
  @Roles("ADMIN", "STAFF")
  @Patch("staff/goals/:id")
  async updateMyGoal(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff-goals/${id}`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── DELETE /staff/goals/:id — soft-delete (cancel) a personal goal ────────
  @Roles("ADMIN", "STAFF")
  @Delete("staff/goals/:id")
  async deleteMyGoal(
    @Param("id")              id: string,
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff-goals/${id}`,
      "DELETE",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── GET /staff-profiles/skills/matrix — skill matrix for all active staff ──
  @Roles("ADMIN", "STAFF")
  @Get("staff-profiles/skills/matrix")
  async getSkillsMatrix(
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff-profiles/skills/matrix`,
      "GET",
      undefined,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /staff-profiles/:id/skills — update skill tags (admin only) ──────
  @Roles("ADMIN")
  @Patch("staff-profiles/:id/skills")
  async updateSkills(
    @Param("id")              id: string,
    @Body()                   body: { skills: string[] },
    @Headers("x-user-id")     userId?: string,
    @Headers("x-user-role")   role?: Role,
    @Headers("x-client-id")   clientId?: string,
    @Headers("x-request-id")  requestId?: string,
    @Headers("x-trace-id")    traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/staff-profiles/${id}/skills`,
      "PATCH",
      body,
      scopeHeaders(userId, role, clientId, requestId, traceId)
    );
  }
}
