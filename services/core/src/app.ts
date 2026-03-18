// ════════════════════════════════════════════════════════════════════════════
// app.ts — Core service Fastify application factory
// Service : core  |  Port: 4001 (behind gateway at 4000)
// Exports : createCoreApp()
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ───────────────────────────────────────────────────────────────────
import Fastify, { type FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { registerServiceRateLimit, ServiceMetrics } from "@maphari/platform";

// ── Existing routes ───────────────────────────────────────────────────────────
import { registerClientRoutes } from "./routes/clients.js";
import { registerProjectRoutes } from "./routes/projects.js";
import { registerLeadRoutes } from "./routes/leads.js";
import { registerBookingRoutes } from "./routes/bookings.js";
import { registerProposalRoutes } from "./routes/proposals.js";
import { registerProposalCrudRoutes } from "./routes/proposals-crud.js";
import { registerOnboardingRoutes } from "./routes/onboarding.js";
import { registerOperationsRoutes } from "./routes/operations.js";
import { registerTimeEntryRoutes } from "./routes/time-entries.js";
import { registerRetainerRoutes } from "./routes/retainer.js";
import { registerConversationNoteRoutes } from "./routes/conversation-notes.js";
import { registerConversationEscalationRoutes } from "./routes/conversation-escalations.js";
import { registerMilestoneApprovalRoutes } from "./routes/milestone-approvals.js";
import { registerBlockerRoutes } from "./routes/blockers.js";
import { registerChangeRequestRoutes } from "./routes/change-requests.js";

// ── Batch 2 — Project layer (stubs; full impl in Batch 2) ─────────────────────
import { registerDeliverableRoutes } from "./routes/deliverables.js";
import { registerRiskRoutes } from "./routes/risks.js";
import { registerDecisionRoutes } from "./routes/decisions.js";
import { registerSprintRoutes } from "./routes/sprints.js";
import { registerSignOffRoutes } from "./routes/sign-offs.js";
import { registerPhaseRoutes } from "./routes/phases.js";
import { registerBriefRoutes } from "./routes/briefs.js";

// ── Batch 3 — Client CX (stubs; full impl in Batch 3) ────────────────────────
import { registerHealthScoreRoutes } from "./routes/health-scores.js";
import { registerInterventionRoutes } from "./routes/interventions.js";
import { registerSatisfactionRoutes } from "./routes/satisfaction.js";
import { registerClientOnboardingCxRoutes } from "./routes/client-onboarding-cx.js";
import { registerOffboardingRoutes } from "./routes/offboarding.js";
import { registerCommunicationLogRoutes } from "./routes/communication-logs.js";
import { registerSlaRoutes } from "./routes/sla.js";
import { registerAppointmentRoutes } from "./routes/appointments.js";
import { registerReferralRoutes } from "./routes/referrals.js";
import { registerSupportTicketRoutes } from "./routes/support-tickets.js";

// ── Staff Analytics — health scores, analytics, capacity, approvals ───────────
import { registerStaffAnalyticsRoutes } from "./routes/staff-analytics.js";

// ── Batch 4 — Staff & HR (stubs; full impl in Batch 4) ───────────────────────
import { registerStaffProfileRoutes } from "./routes/staff-profiles.js";
import { registerPayslipRoutes } from "./routes/payslips.js";
import { registerLeaveRequestRoutes } from "./routes/leave-requests.js";
import { registerStaffOnboardingRoutes } from "./routes/staff-onboarding.js";
import { registerJobPostingRoutes } from "./routes/job-postings.js";
import { registerJobApplicationRoutes } from "./routes/job-applications.js";
import { registerTrainingRoutes } from "./routes/training.js";
import { registerStandupRoutes } from "./routes/standup.js";
import { registerPeerReviewRoutes } from "./routes/peer-reviews.js";

// ── Recurring Tasks ───────────────────────────────────────────────────────────
import { registerRecurringTaskRoutes } from "./routes/recurring-tasks.js";

// ── Batch 6 — Governance & Ops (stubs; full impl in Batch 6) ─────────────────
import { registerAnnouncementRoutes } from "./routes/announcements.js";
import { registerContentSubmissionRoutes } from "./routes/content-submissions.js";
import { registerDesignReviewRoutes } from "./routes/design-reviews.js";
import { registerMeetingRoutes } from "./routes/meetings.js";
import { registerKnowledgeArticleRoutes } from "./routes/knowledge-articles.js";
import { registerDecisionRecordRoutes } from "./routes/decision-records.js";
import { registerHandoverRoutes } from "./routes/handovers.js";
import { registerAuditEventRoutes } from "./routes/audit-events.js";
import { registerMarketIntelRoutes } from "./routes/market-intel.js";
import { registerCompetitorRoutes } from "./routes/competitors.js";
import { registerVideoRoomRoutes } from "./routes/video-rooms.js";
import { registerClientProfileRoutes } from "./routes/client-profile.js";
import { registerBrandAssetRoutes } from "./routes/brand-assets.js";
import { registerFeedbackRoutes } from "./routes/feedback.js";
import { registerContractRoutes } from "./routes/contracts.js";
import { registerCloseoutReportRoutes } from "./routes/closeout-reports.js";
import { registerSearchRoutes } from "./routes/search.js";
import { registerFeatureFlagRoutes } from "./routes/feature-flags.js";
import { registerServiceCatalogRoutes } from "./routes/service-catalog.js";
import { registerNotificationPrefRoutes } from "./routes/notification-prefs.js";
import { registerIntegrationRoutes } from "./routes/integrations.js";
import { registerDataPrivacyRoutes } from "./routes/data-privacy.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";

export async function createCoreApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const metrics = new ServiceMetrics();
  const publicLimit = Number(process.env.SERVICE_RATE_LIMIT_PUBLIC_MAX ?? 120);
  const protectedLimit = Number(process.env.SERVICE_RATE_LIMIT_PROTECTED_MAX ?? 240);
  const rateWindowMs = Number(process.env.SERVICE_RATE_LIMIT_WINDOW_MS ?? 60_000);

  registerServiceRateLimit(app, {
    service: "core",
    publicPolicy: { limit: publicLimit, windowMs: rateWindowMs },
    protectedPolicy: { limit: protectedLimit, windowMs: rateWindowMs },
    isPublicRoute: (url) => url === "/health" || url === "/metrics"
  });

  metrics.registerCounter("http_requests_total", "Total HTTP requests");
  metrics.registerHistogram("http_request_duration_ms", "HTTP request latency in milliseconds", [
    5, 10, 25, 50, 100, 250, 500, 1000, 2500
  ]);
  metrics.registerHistogram("db_query_duration_ms", "Database query latency in milliseconds", [
    1, 5, 10, 25, 50, 100, 250, 500, 1000
  ]);

  app.addHook("onRequest", async (request) => {
    (request as typeof request & { __start?: number }).__start = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = (request as typeof request & { __start?: number }).__start ?? Date.now();
    const duration = Date.now() - startedAt;
    const route = request.routeOptions?.url ?? request.url;
    metrics.inc("http_requests_total", { service: "core", method: request.method, route, status: reply.statusCode });
    metrics.observe("http_request_duration_ms", duration, { service: "core", method: request.method, route });
  });

  app.get("/health", async () => {
    return {
      success: true,
      data: { service: "core", status: "ok" }
    } as ApiResponse<{ service: string; status: string }>;
  });

  app.get("/metrics", async (_, reply) => {
    reply.header("content-type", "text/plain; version=0.0.4");
    return metrics.renderPrometheus();
  });

  // ── Existing routes ─────────────────────────────────────────────────────────
  await registerClientRoutes(app);
  await registerProjectRoutes(app);
  await registerLeadRoutes(app);
  await registerBookingRoutes(app);
  await registerProposalRoutes(app);
  await registerProposalCrudRoutes(app);
  await registerOnboardingRoutes(app);
  await registerOperationsRoutes(app);
  await registerTimeEntryRoutes(app);
  await registerRetainerRoutes(app);
  await registerConversationNoteRoutes(app);
  await registerConversationEscalationRoutes(app);
  await registerMilestoneApprovalRoutes(app);
  await registerBlockerRoutes(app);
  await registerChangeRequestRoutes(app);

  // ── Batch 2 — Project layer ──────────────────────────────────────────────
  await registerDeliverableRoutes(app);
  await registerRiskRoutes(app);
  await registerDecisionRoutes(app);
  await registerSprintRoutes(app);
  await registerSignOffRoutes(app);
  await registerPhaseRoutes(app);
  await registerBriefRoutes(app);

  // ── Batch 3 — Client CX ──────────────────────────────────────────────────
  await registerHealthScoreRoutes(app);
  await registerInterventionRoutes(app);
  await registerSatisfactionRoutes(app);
  await registerClientOnboardingCxRoutes(app);
  await registerOffboardingRoutes(app);
  await registerCommunicationLogRoutes(app);
  await registerSlaRoutes(app);
  await registerAppointmentRoutes(app);
  await registerReferralRoutes(app);
  await registerSupportTicketRoutes(app);

  // ── Staff Analytics ──────────────────────────────────────────────────────
  await registerStaffAnalyticsRoutes(app);

  // ── Batch 4 — Staff & HR ─────────────────────────────────────────────────
  await registerStaffProfileRoutes(app);
  await registerPayslipRoutes(app);
  await registerLeaveRequestRoutes(app);
  await registerStaffOnboardingRoutes(app);
  await registerJobPostingRoutes(app);
  await registerJobApplicationRoutes(app);
  await registerTrainingRoutes(app);
  await registerStandupRoutes(app);
  await registerPeerReviewRoutes(app);

  // ── Recurring Tasks ──────────────────────────────────────────────────────
  await registerRecurringTaskRoutes(app);

  // ── Batch 6 — Governance & Ops ───────────────────────────────────────────
  await registerAnnouncementRoutes(app);
  await registerContentSubmissionRoutes(app);
  await registerDesignReviewRoutes(app);
  await registerMeetingRoutes(app);
  await registerKnowledgeArticleRoutes(app);
  await registerDecisionRecordRoutes(app);
  await registerHandoverRoutes(app);
  await registerAuditEventRoutes(app);
  await registerMarketIntelRoutes(app);
  await registerCompetitorRoutes(app);
  await registerVideoRoomRoutes(app);
  await registerClientProfileRoutes(app);
  await registerBrandAssetRoutes(app);
  await registerFeedbackRoutes(app);
  await registerContractRoutes(app);
  await registerCloseoutReportRoutes(app);
  await registerSearchRoutes(app);
  await registerFeatureFlagRoutes(app);

  // ── Service Catalog ──────────────────────────────────────────────────────
  await registerServiceCatalogRoutes(app);

  // ── Portal Settings ───────────────────────────────────────────────────────
  await registerNotificationPrefRoutes(app);
  await registerIntegrationRoutes(app);

  // ── Data Privacy ─────────────────────────────────────────────────────────
  await registerDataPrivacyRoutes(app);

  // ── Webhooks ──────────────────────────────────────────────────────────────
  await registerWebhookRoutes(app);

  return app;
}
