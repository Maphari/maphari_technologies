// ════════════════════════════════════════════════════════════════════════════
// admin.controller.ts — Gateway proxy for admin-only governance routes
// Prefixes  : /admin/announcements, /admin/knowledge, /admin/market-intel,
//             /admin/content-submissions, /admin/handovers,
//             /admin/decision-records, /admin/design-reviews,
//             /admin/audit-events
// Scope     : ADMIN only
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

/** Shared admin scope headers */
function adminHeaders(
  userId = "",
  role: Role = "ADMIN",
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
export class AdminController {

  // ══════════════════════════════════════════════════════════════════════════
  // ANNOUNCEMENTS
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/announcements ──────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("admin/announcements")
  async listAnnouncements(
    @Query() query: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const qs = params.size > 0 ? `?${params.toString()}` : "";
    return proxyRequest(
      `${CORE()}/announcements${qs}`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /admin/announcements — create (ADMIN) ────────────────────────────
  @Roles("ADMIN")
  @Post("admin/announcements")
  async createAnnouncement(
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/announcements`,
      "POST",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /admin/announcements/:id/publish ────────────────────────────────
  @Roles("ADMIN")
  @Patch("admin/announcements/:id/publish")
  async publishAnnouncement(
    @Param("id")              id: string,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/announcements/${id}/publish`,
      "PATCH",
      {},
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // KNOWLEDGE BASE
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/knowledge ──────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("admin/knowledge")
  async listKnowledge(
    @Query() query: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const qs = params.size > 0 ? `?${params.toString()}` : "";
    return proxyRequest(
      `${CORE()}/knowledge${qs}`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /admin/knowledge — create article (ADMIN) ────────────────────────
  @Roles("ADMIN")
  @Post("admin/knowledge")
  async createKnowledgeArticle(
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/knowledge`,
      "POST",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /admin/knowledge/:id — update article (ADMIN) ──────────────────
  @Roles("ADMIN")
  @Patch("admin/knowledge/:id")
  async updateKnowledgeArticle(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/knowledge/${id}`,
      "PATCH",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MARKET INTELLIGENCE
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/market-intel ───────────────────────────────────────────────
  @Roles("ADMIN")
  @Get("admin/market-intel")
  async listMarketIntel(
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/market-intel`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /admin/market-intel — add intel entry (ADMIN) ───────────────────
  @Roles("ADMIN")
  @Post("admin/market-intel")
  async createMarketIntel(
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/market-intel`,
      "POST",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMPETITOR INTELLIGENCE
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/competitors ────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("admin/competitors")
  async listCompetitors(
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/competitors`, "GET", undefined, adminHeaders(userId, role, clientId, requestId, traceId));
  }

  // ── POST /admin/competitors ───────────────────────────────────────────────
  @Roles("ADMIN")
  @Post("admin/competitors")
  async createCompetitor(
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/competitors`, "POST", body, adminHeaders(userId, role, clientId, requestId, traceId));
  }

  // ── PATCH /admin/competitors/:id ──────────────────────────────────────────
  @Roles("ADMIN")
  @Patch("admin/competitors/:id")
  async updateCompetitor(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/competitors/${id}`, "PATCH", body, adminHeaders(userId, role, clientId, requestId, traceId));
  }

  // ── GET /admin/win-loss ───────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("admin/win-loss")
  async listWinLoss(
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/win-loss`, "GET", undefined, adminHeaders(userId, role, clientId, requestId, traceId));
  }

  // ── POST /admin/win-loss ──────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("admin/win-loss")
  async createWinLossEntry(
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/win-loss`, "POST", body, adminHeaders(userId, role, clientId, requestId, traceId));
  }

  // ── GET /admin/market-rates ───────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("admin/market-rates")
  async listMarketRates(
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/market-rates`, "GET", undefined, adminHeaders(userId, role, clientId, requestId, traceId));
  }

  // ── POST /admin/market-rates ──────────────────────────────────────────────
  @Roles("ADMIN")
  @Post("admin/market-rates")
  async createMarketRate(
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/market-rates`, "POST", body, adminHeaders(userId, role, clientId, requestId, traceId));
  }

  // ── PATCH /admin/market-rates/:id ─────────────────────────────────────────
  @Roles("ADMIN")
  @Patch("admin/market-rates/:id")
  async updateMarketRate(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(`${CORE()}/market-rates/${id}`, "PATCH", body, adminHeaders(userId, role, clientId, requestId, traceId));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONTENT SUBMISSIONS (ADMIN view)
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/content-submissions ───────────────────────────────────────
  @Roles("ADMIN")
  @Get("admin/content-submissions")
  async listAdminContentSubmissions(
    @Query() query: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const qs = params.size > 0 ? `?${params.toString()}` : "";
    return proxyRequest(
      `${CORE()}/content-submissions${qs}`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /admin/content-submissions/:id/approve ──────────────────────────
  @Roles("ADMIN")
  @Patch("admin/content-submissions/:id/approve")
  async approveAdminContentSubmission(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/content-submissions/${id}/approve`,
      "PATCH",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HANDOVERS (ADMIN view — in addition to staff /handovers)
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/handovers ──────────────────────────────────────────────────
  @Roles("ADMIN")
  @Get("admin/handovers")
  async listAdminHandovers(
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/handovers`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /admin/handovers ─────────────────────────────────────────────────
  @Roles("ADMIN")
  @Post("admin/handovers")
  async createAdminHandover(
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/handovers`,
      "POST",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /admin/handovers/:id ────────────────────────────────────────────
  @Roles("ADMIN")
  @Patch("admin/handovers/:id")
  async updateAdminHandover(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/handovers/${id}`,
      "PATCH",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DECISION RECORDS
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/decision-records ───────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("admin/decision-records")
  async listDecisionRecords(
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/decision-records`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /admin/decision-records ──────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("admin/decision-records")
  async createDecisionRecord(
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/decision-records`,
      "POST",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DESIGN REVIEWS
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/design-reviews ─────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("admin/design-reviews")
  async listDesignReviews(
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/design-reviews`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /admin/design-reviews/:id/resolve ───────────────────────────────
  @Roles("ADMIN")
  @Patch("admin/design-reviews/:id/resolve")
  async resolveDesignReview(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/design-reviews/${id}/resolve`,
      "PATCH",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUDIT EVENTS
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/audit-events ───────────────────────────────────────────────
  @Roles("ADMIN")
  @Get("admin/audit-events")
  async listAuditEvents(
    @Query() query: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const qs = params.size > 0 ? `?${params.toString()}` : "";
    return proxyRequest(
      `${CORE()}/audit-events${qs}`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CLOSEOUT REPORTS
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/closeout-reports ───────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("admin/closeout-reports")
  async listCloseoutReports(
    @Query() query: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const qs = params.size > 0 ? `?${params.toString()}` : "";
    return proxyRequest(
      `${CORE()}/admin/closeout-reports${qs}`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /admin/closeout-reports ──────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("admin/closeout-reports")
  async createCloseoutReport(
    @Body() body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/closeout-reports`,
      "POST",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /admin/closeout-reports/:id ─────────────────────────────────────
  @Roles("ADMIN")
  @Patch("admin/closeout-reports/:id")
  async updateCloseoutReport(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/closeout-reports/${id}`,
      "PATCH",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FEATURE FLAGS
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/feature-flags ──────────────────────────────────────────────
  @Roles("ADMIN")
  @Get("admin/feature-flags")
  async listFeatureFlags(
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/feature-flags`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /admin/feature-flags — upsert ───────────────────────────────────
  @Roles("ADMIN")
  @Post("admin/feature-flags")
  async upsertFeatureFlag(
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/feature-flags`,
      "POST",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /admin/feature-flags/:key/toggle ────────────────────────────────
  @Roles("ADMIN")
  @Patch("admin/feature-flags/:key/toggle")
  async toggleFeatureFlag(
    @Param("key")             key: string,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/feature-flags/${key}/toggle`,
      "PATCH",
      {},
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PIPELINE CONVERSION ANALYTICS
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/pipeline/conversion-analytics ──────────────────────────────
  @Roles("ADMIN")
  @Get("admin/pipeline/conversion-analytics")
  async getPipelineConversionAnalytics(
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/pipeline/conversion-analytics`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CAPACITY FORECAST
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/capacity-forecast ──────────────────────────────────────────
  @Roles("ADMIN")
  @Get("admin/capacity-forecast")
  async getCapacityForecast(
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/capacity-forecast`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WEBHOOKS
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/webhooks ───────────────────────────────────────────────────
  @Roles("ADMIN")
  @Get("admin/webhooks")
  async listWebhooks(
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/webhooks`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /admin/webhooks — create ─────────────────────────────────────────
  @Roles("ADMIN")
  @Post("admin/webhooks")
  async createWebhook(
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/webhooks`,
      "POST",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── PATCH /admin/webhooks/:id ─────────────────────────────────────────────
  @Roles("ADMIN")
  @Patch("admin/webhooks/:id")
  async updateWebhook(
    @Param("id")              id: string,
    @Body()                   body: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/webhooks/${id}`,
      "PATCH",
      body,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── DELETE /admin/webhooks/:id ────────────────────────────────────────────
  @Roles("ADMIN")
  @Delete("admin/webhooks/:id")
  async deleteWebhook(
    @Param("id")              id: string,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/webhooks/${id}`,
      "DELETE",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ── POST /admin/webhooks/:id/test ─────────────────────────────────────────
  @Roles("ADMIN")
  @Post("admin/webhooks/:id/test")
  async testWebhook(
    @Param("id")              id: string,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    return proxyRequest(
      `${CORE()}/admin/webhooks/${id}/test`,
      "POST",
      {},
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAFF UTILISATION
  // ══════════════════════════════════════════════════════════════════════════

  // ── GET /admin/staff-utilisation ──────────────────────────────────────────
  @Roles("ADMIN")
  @Get("admin/staff-utilisation")
  async getStaffUtilisation(
    @Query() query: unknown,
    @Headers("x-user-id")    userId?: string,
    @Headers("x-user-role")  role?: Role,
    @Headers("x-client-id")  clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id")   traceId?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query && typeof query === "object") {
      Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const qs = params.size > 0 ? `?${params.toString()}` : "";
    return proxyRequest(
      `${CORE()}/staff-utilisation${qs}`,
      "GET",
      undefined,
      adminHeaders(userId, role, clientId, requestId, traceId)
    );
  }
}
