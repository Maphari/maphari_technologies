import {
  aiEstimateSchema,
  aiGenerateSchema,
  aiLeadQualificationSchema,
  aiProposalDraftSchema,
  type ApiResponse
} from "@maphari/contracts";
import { EventTopics } from "@maphari/platform";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { eventBus } from "../lib/infrastructure.js";
import { createAiJob, createAiWorkflowJob, listAiJobs } from "../lib/store.js";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { searchProspects, generatePitches } from "../lib/prospecting.js";

// ── Types ─────────────────────────────────────────────────────────────────────

type MetricsApp = FastifyInstance & {
  serviceMetrics?: {
    inc: (name: string, labels?: Record<string, string | number>) => void;
    observe: (name: string, value: number, labels?: Record<string, string | number>) => void;
  };
};

// ── Health score / invoice shapes returned by upstream services ───────────────

interface HealthScoreRecord {
  clientId: string;
  score: number;
  trend?: string;
  sentiment?: string;
  overdueTasks?: number;
  unreadMessages?: number;
  milestoneDelayDays?: number;
  invoiceStatus?: string;
  recordedAt?: string;
}

interface InvoiceRecord {
  id: string;
  clientId: string;
  number?: string;
  totalAmount?: number;
  status?: string;
  dueAt?: string | null;
}

// ── Recommendation type returned to callers ───────────────────────────────────

export interface AiRecommendation {
  id: string;
  type: "Risk" | "Revenue" | "Efficiency";
  title: string;
  confidence: number;
  estimatedValue: string;
  reasoning: string;
  action: string;
}

// ── Helper: safe upstream fetch ───────────────────────────────────────────────

async function fetchUpstream<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url, {
      headers: { "x-user-role": "ADMIN", "content-type": "application/json" },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { success?: boolean; data?: T[] };
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

// ── Route registration ────────────────────────────────────────────────────────

export async function registerAiRoutes(app: FastifyInstance): Promise<void> {
  const metrics = (app as MetricsApp).serviceMetrics;

  // ── POST /ai/generate ─────────────────────────────────────────────────────

  app.post("/ai/generate", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = aiGenerateSchema.safeParse(request.body);

    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid AI generate payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    if (!clientId) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "client scope is required" }
      } as ApiResponse;
    }

    const job = await createAiJob({ ...parsedBody.data, clientId });
    metrics?.inc("ai_jobs_total", { service: "ai", status: job.status });
    metrics?.observe("ai_job_latency_ms", job.latencyMs, { service: "ai", model: job.model });

    return {
      success: true,
      data: job,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof job>;
  });

  // ── GET /ai/jobs ──────────────────────────────────────────────────────────

  app.get("/ai/jobs", async (request) => {
    const scope = readScopeHeaders(request);
    const clientId = resolveClientFilter(scope.role, scope.clientId);
    const jobs = listAiJobs(clientId);

    return {
      success: true,
      data: jobs,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof jobs>;
  });

  // ── POST /ai/lead-qualify ─────────────────────────────────────────────────

  app.post("/ai/lead-qualify", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = aiLeadQualificationSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid AI lead qualification payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    if (!clientId) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "client scope is required" }
      } as ApiResponse;
    }

    const job = await createAiWorkflowJob("lead-qualification", {
      clientId,
      prompt: parsedBody.data.prompt,
      model: parsedBody.data.model
    });
    metrics?.inc("ai_jobs_total", { service: "ai", status: job.status, task: job.task });
    metrics?.observe("ai_job_latency_ms", job.latencyMs, { service: "ai", model: job.model, task: job.task });

    await eventBus.publish({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      requestId: scope.requestId,
      traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
      clientId,
      topic: EventTopics.aiLeadQualified,
      payload: {
        jobId: job.id,
        leadId: parsedBody.data.leadId,
        clientId,
        model: job.model,
        result: job.response
      }
    });

    return {
      success: true,
      data: job,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof job>;
  });

  // ── POST /ai/proposal-draft ───────────────────────────────────────────────

  app.post("/ai/proposal-draft", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = aiProposalDraftSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid AI proposal draft payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    if (!clientId) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "client scope is required" }
      } as ApiResponse;
    }

    const job = await createAiWorkflowJob("proposal-draft", {
      clientId,
      prompt: parsedBody.data.prompt,
      model: parsedBody.data.model
    });
    metrics?.inc("ai_jobs_total", { service: "ai", status: job.status, task: job.task });
    metrics?.observe("ai_job_latency_ms", job.latencyMs, { service: "ai", model: job.model, task: job.task });

    await eventBus.publish({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      requestId: scope.requestId,
      traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
      clientId,
      topic: EventTopics.aiProposalDrafted,
      payload: {
        jobId: job.id,
        leadId: parsedBody.data.leadId ?? null,
        projectId: parsedBody.data.projectId ?? null,
        clientId,
        model: job.model,
        result: job.response
      }
    });

    return {
      success: true,
      data: job,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof job>;
  });

  // ── POST /ai/estimate ─────────────────────────────────────────────────────

  app.post("/ai/estimate", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const parsedBody = aiEstimateSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid AI estimate payload",
          details: parsedBody.error.flatten()
        }
      } as ApiResponse;
    }

    const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
    if (!clientId) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "client scope is required" }
      } as ApiResponse;
    }

    const job = await createAiWorkflowJob("estimate", {
      clientId,
      prompt: parsedBody.data.prompt,
      model: parsedBody.data.model
    });
    metrics?.inc("ai_jobs_total", { service: "ai", status: job.status, task: job.task });
    metrics?.observe("ai_job_latency_ms", job.latencyMs, { service: "ai", model: job.model, task: job.task });

    await eventBus.publish({
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      requestId: scope.requestId,
      traceId: (request.headers["x-trace-id"] as string | undefined) ?? undefined,
      clientId,
      topic: EventTopics.aiEstimateGenerated,
      payload: {
        jobId: job.id,
        projectId: parsedBody.data.projectId ?? null,
        clientId,
        model: job.model,
        result: job.response
      }
    });

    return {
      success: true,
      data: job,
      meta: { requestId: scope.requestId }
    } as ApiResponse<typeof job>;
  });

  // ── GET /ai/recommendations ───────────────────────────────────────────────
  // Rule-based analysis of health scores + overdue invoices.
  // Returns prioritised action recommendations for admin review.
  // ADMIN only — enforced at the gateway layer.

  app.get("/ai/recommendations", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "AI recommendations are available to admins only." }
      } as ApiResponse;
    }

    const coreUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    const billingUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";

    // Fetch data in parallel
    const [healthScores, invoices] = await Promise.all([
      fetchUpstream<HealthScoreRecord>(`${coreUrl}/health-scores`),
      fetchUpstream<InvoiceRecord>(`${billingUrl}/invoices`)
    ]);

    const now = Date.now();
    const recommendations: AiRecommendation[] = [];

    // ── Rule 1: Low health score clients (score < 60) ────────────────────────
    // Deduplicate to latest score per client
    const latestByClient = new Map<string, HealthScoreRecord>();
    for (const hs of healthScores) {
      const existing = latestByClient.get(hs.clientId);
      if (!existing) {
        latestByClient.set(hs.clientId, hs);
      } else {
        const existDate = existing.recordedAt ? new Date(existing.recordedAt).getTime() : 0;
        const thisDate = hs.recordedAt ? new Date(hs.recordedAt).getTime() : 0;
        if (thisDate > existDate) latestByClient.set(hs.clientId, hs);
      }
    }

    for (const hs of latestByClient.values()) {
      if (hs.score < 60) {
        const severity = hs.score < 40 ? "critical" : "moderate";
        const overdue = hs.overdueTasks ?? 0;
        const delay = hs.milestoneDelayDays ?? 0;

        recommendations.push({
          id: randomUUID(),
          type: "Risk",
          title: `Client health score at ${hs.score}% — ${severity} risk`,
          confidence: hs.score < 40 ? 92 : 78,
          estimatedValue: overdue > 0 ? `${overdue} overdue task${overdue !== 1 ? "s" : ""}` : "—",
          reasoning: [
            `Health score is ${hs.score}% (below the 60% warning threshold).`,
            delay > 0 ? ` Milestone delay: ${delay} day${delay !== 1 ? "s" : ""}.` : "",
            hs.unreadMessages ? ` ${hs.unreadMessages} unread message${hs.unreadMessages !== 1 ? "s" : ""}.` : "",
            hs.sentiment === "NEGATIVE" ? " Sentiment flagged as negative." : ""
          ]
            .filter(Boolean)
            .join("")
            .trim(),
          action: "Schedule check-in call"
        });
      }
    }

    // ── Rule 2: Overdue invoices (30+ days past due) ──────────────────────────
    for (const inv of invoices) {
      if (!inv.dueAt) continue;
      const daysOverdue = Math.floor((now - new Date(inv.dueAt).getTime()) / 86400000);
      if (daysOverdue < 30) continue;

      const amount = inv.totalAmount
        ? new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(
            inv.totalAmount
          )
        : "—";

      recommendations.push({
        id: randomUUID(),
        type: "Revenue",
        title: `Invoice ${inv.number ?? inv.id.slice(0, 8)} overdue by ${daysOverdue} days`,
        confidence: daysOverdue > 60 ? 95 : 82,
        estimatedValue: amount,
        reasoning: `Invoice ${inv.number ?? inv.id.slice(0, 8)} of ${amount} has been unpaid for ${daysOverdue} days. Delayed revenue directly impacts cash flow. Follow up immediately or escalate to collections process.`,
        action: "Send payment reminder"
      });
    }

    // ── Rule 3: Clients with high overdue task count ──────────────────────────
    for (const hs of latestByClient.values()) {
      const overdue = hs.overdueTasks ?? 0;
      if (overdue >= 5) {
        recommendations.push({
          id: randomUUID(),
          type: "Efficiency",
          title: `${overdue} overdue tasks detected — delivery risk`,
          confidence: 75,
          estimatedValue: "—",
          reasoning: `This client has ${overdue} overdue tasks, which may indicate resourcing bottlenecks or unclear ownership. Assigning a task owner and reviewing the sprint backlog can resolve delays quickly.`,
          action: "Review sprint backlog"
        });
      }
    }

    // Sort: Risk first, then Revenue, then Efficiency; highest confidence first within each type
    const order: Record<AiRecommendation["type"], number> = { Risk: 0, Revenue: 1, Efficiency: 2 };
    recommendations.sort((a, b) => {
      const typeOrder = order[a.type] - order[b.type];
      if (typeOrder !== 0) return typeOrder;
      return b.confidence - a.confidence;
    });

    return {
      success: true,
      data: recommendations,
      meta: { requestId: scope.requestId }
    } as ApiResponse<AiRecommendation[]>;
  });

  // ── POST /ai/auto-draft ───────────────────────────────────────────────────

  app.post("/ai/auto-draft", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = request.body as {
      clientName?: string;
      projectName?: string;
      milestones?: Array<{ title: string; status: string }>;
      tasks?: Array<{ title: string; status: string; assignee?: string }>;
      tone?: string;
      focus?: string;
      customNote?: string;
    } | null;

    if (!body || typeof body.clientName !== "string" || typeof body.projectName !== "string") {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "clientName and projectName are required." }
      } as ApiResponse;
    }

    const { clientName, projectName, milestones = [], tasks = [], tone = "professional", focus = "progress", customNote } = body;

    const milestoneSummary = milestones.length
      ? milestones.map((m) => `  - ${m.title} [${m.status}]`).join("\n")
      : "  (no milestones listed)";

    const taskSummary = tasks.length
      ? tasks.slice(0, 12).map((t) => `  - ${t.title} [${t.status}]${t.assignee ? ` — ${t.assignee}` : ""}`).join("\n")
      : "  (no tasks listed)";

    const prompt = [
      `You are a professional account manager writing a project update for a client.`,
      ``,
      `Client: ${clientName}`,
      `Project: ${projectName}`,
      `Tone: ${tone}`,
      `Focus: ${focus}`,
      customNote ? `Additional context: ${customNote}` : "",
      ``,
      `Milestones:`,
      milestoneSummary,
      ``,
      `Recent tasks:`,
      taskSummary,
      ``,
      `Write a concise, professional client update covering:`,
      `1. Overall project health and progress`,
      `2. Key milestone status`,
      `3. What was completed recently`,
      `4. What comes next`,
      `5. Any blockers or items needing client attention`,
      ``,
      `Keep it under 200 words. Use paragraph format, not bullet points. Do not include a subject line.`
    ].filter(Boolean).join("\n");

    const clientId = scope.clientId ?? "system";
    const job = await createAiWorkflowJob("auto-draft", { clientId, prompt, model: "claude-sonnet-4-6" });
    metrics?.inc("ai_jobs_total", { service: "ai", status: job.status });
    metrics?.observe("ai_job_latency_ms", job.latencyMs, { service: "ai", model: job.model });

    const draft = job.response;
    const wordCount = draft.trim().split(/\s+/).filter(Boolean).length;

    return {
      success: true,
      data: { draft, wordCount, jobId: job.id },
      meta: { requestId: scope.requestId }
    } as ApiResponse<{ draft: string; wordCount: number; jobId: string }>;
  });

  // ── POST /ai/draft-client-update ─────────────────────────────────────────
  // Generates a friendly client update email from completed task data.
  // STAFF + ADMIN only — enforced at the gateway layer.

  app.post("/ai/draft-client-update", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = request.body as {
      projectId?: unknown;
      clientName?: unknown;
      completedTasks?: unknown;
      period?: unknown;
    } | null;

    const projectId      = typeof body?.projectId   === "string" ? body.projectId.trim()   : "";
    const clientName     = typeof body?.clientName  === "string" ? body.clientName.trim()  : "";
    const period         = typeof body?.period       === "string" ? body.period.trim()       : "this week";
    const completedTasks = Array.isArray(body?.completedTasks)
      ? (body.completedTasks as unknown[]).filter((t): t is string => typeof t === "string")
      : [];

    if (!clientName) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "clientName is required." }
      } as ApiResponse;
    }

    const taskBullets = completedTasks.length
      ? completedTasks.map((t) => `• ${t}`).join("\n")
      : "• (no specific tasks listed)";

    const prompt = [
      `Write a professional but friendly client update email for ${clientName}.`,
      projectId ? `Project ID: ${projectId}.` : "",
      `Period: ${period}.`,
      ``,
      `Completed this period:`,
      taskBullets,
      ``,
      `Keep it under 200 words. Positive tone. No jargon. Use paragraph format.`,
      `Return JSON with exactly two fields: "subject" (a concise email subject line) and "draft" (the email body only, no subject line repeated).`
    ].filter(Boolean).join("\n");

    const clientId = scope.clientId ?? "system";
    const job = await createAiWorkflowJob("client-update", { clientId, prompt, model: "claude-sonnet-4-6" });
    metrics?.inc("ai_jobs_total", { service: "ai", status: job.status });
    metrics?.observe("ai_job_latency_ms", job.latencyMs, { service: "ai", model: job.model });

    // Attempt to parse JSON from LLM response; fall back to raw text
    let draft  = job.response;
    let subject = `${period.charAt(0).toUpperCase() + period.slice(1)} update — ${clientName}`;
    try {
      const jsonMatch = job.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { subject?: string; draft?: string };
        if (typeof parsed.draft === "string")   draft   = parsed.draft;
        if (typeof parsed.subject === "string") subject = parsed.subject;
      }
    } catch { /* keep raw response */ }

    return {
      success: true,
      data: { draft, subject, jobId: job.id },
      meta: { requestId: scope.requestId }
    } as ApiResponse<{ draft: string; subject: string; jobId: string }>;
  });

  // ── POST /ai/generate-report ──────────────────────────────────────────────
  // Generates a markdown project report for staff recurring-report feature.
  // STAFF + ADMIN only — enforced at the gateway layer.

  app.post("/ai/generate-report", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = request.body as {
      reportType?: unknown;
      projectId?: unknown;
      clientName?: unknown;
      period?: unknown;
    } | null;

    const reportType = typeof body?.reportType === "string" ? body.reportType.trim() : "Weekly Progress";
    const projectId  = typeof body?.projectId  === "string" ? body.projectId.trim()  : "";
    const clientName = typeof body?.clientName === "string" ? body.clientName.trim() : "Client";
    const period     = typeof body?.period      === "string" ? body.period.trim()      : "this week";

    const prompt = [
      `Generate a ${reportType} report for ${clientName}.`,
      projectId ? `Project ID: ${projectId}.` : "",
      `Period: ${period}.`,
      ``,
      `Create a well-structured markdown report with these sections:`,
      `1. Executive Summary`,
      `2. Progress This Period`,
      `3. Milestones & Deliverables`,
      `4. Risks & Blockers`,
      `5. Next Steps`,
      ``,
      `Keep each section concise. Use markdown headers (##) and bullet points.`,
      `Return JSON with exactly two fields: "title" (report title string) and "markdown" (the full markdown content).`
    ].filter(Boolean).join("\n");

    const clientId = scope.clientId ?? "system";
    const job = await createAiWorkflowJob("report", { clientId, prompt, model: "claude-sonnet-4-6" });
    metrics?.inc("ai_jobs_total", { service: "ai", status: job.status });
    metrics?.observe("ai_job_latency_ms", job.latencyMs, { service: "ai", model: job.model });

    // Attempt to parse JSON from LLM response; fall back to raw text
    let markdown = job.response;
    let title    = `${reportType} — ${clientName} (${period})`;
    try {
      const jsonMatch = job.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { title?: string; markdown?: string };
        if (typeof parsed.markdown === "string") markdown = parsed.markdown;
        if (typeof parsed.title    === "string") title    = parsed.title;
      }
    } catch { /* keep raw response */ }

    return {
      success: true,
      data: { markdown, title, jobId: job.id },
      meta: { requestId: scope.requestId }
    } as ApiResponse<{ markdown: string; title: string; jobId: string }>;
  });

  // ── POST /ai/prospect ─────────────────────────────────────────────────────
  // Searches for local businesses matching the given industry + location, then
  // uses Claude Sonnet 4.6 to draft a personalised pitch email per prospect.
  // ADMIN + STAFF only — enforced at the gateway layer.

  const VALID_FILTERS = new Set(["no_website", "needs_redesign", "needs_automation", "needs_seo"]);

  app.post("/ai/prospect", async (request, reply) => {
    const scope = readScopeHeaders(request);

    const body = request.body as {
      industry?: unknown;
      location?: unknown;
      count?: unknown;
      filters?: unknown;
      draftPitch?: unknown;
    } | null;

    const industry = typeof body?.industry === "string" ? body.industry.trim() : "";
    const location = typeof body?.location === "string" ? body.location.trim() : "";

    if (industry.length < 2 || location.length < 2) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "industry and location must each be at least 2 characters." }
      } as ApiResponse;
    }

    const rawCount = typeof body?.count === "number" ? body.count : 20;
    const count = Math.min(50, Math.max(1, Math.floor(rawCount)));

    const rawFilters = Array.isArray(body?.filters) ? body.filters : ["no_website"];
    const filters = (rawFilters as unknown[])
      .filter((f): f is import("../lib/prospecting.js").OpportunityFilter =>
        typeof f === "string" && VALID_FILTERS.has(f)
      );

    if (filters.length === 0) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "At least one valid filter is required." }
      } as ApiResponse;
    }

    const draftPitch = body?.draftPitch !== false;

    const rawProspects = await searchProspects(industry, location, count, filters);
    const prospects = await generatePitches(rawProspects, draftPitch);

    const jobId = randomUUID();
    metrics?.inc("ai_jobs_total", { service: "ai", status: "COMPLETED" });

    return {
      success: true,
      data: { prospects, totalFound: prospects.length, jobId },
      meta: { requestId: scope.requestId }
    } as ApiResponse<{ prospects: typeof prospects; totalFound: number; jobId: string }>;
  });

  // ── POST /ai/prospect/send-pitch ──────────────────────────────────────────
  // Sends a personalised pitch email to a prospect contact via the
  // notifications service (NATS event). ADMIN + STAFF only — enforced at
  // the gateway layer.

  app.post("/ai/prospect/send-pitch", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = request.body as {
      to?: unknown;
      subject?: unknown;
      body?: unknown;
    } | null;

    const to      = typeof body?.to      === "string" ? body.to.trim()      : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.body    === "string" ? body.body.trim()    : "";

    if (!to || !subject || !message) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "to, subject, and body are required." }
      } as ApiResponse;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      reply.status(400);
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid email address." }
      } as ApiResponse;
    }

    try {
      await eventBus.publish({
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        requestId: scope.requestId ?? undefined,
        traceId:   scope.requestId ?? undefined,
        topic: EventTopics.notificationRequested,
        payload: {
          channel: "EMAIL",
          recipientEmail: to,
          message: `Subject: ${subject}\n\n${message}`
        }
      });
    } catch {
      reply.status(500);
      return {
        success: false,
        error: { code: "SEND_ERROR", message: "Failed to queue pitch email." }
      } as ApiResponse;
    }

    metrics?.inc("ai_jobs_total", { service: "ai", status: "COMPLETED" });

    return {
      success: true,
      data: { sent: true, to, subject },
      meta: { requestId: scope.requestId }
    } as ApiResponse<{ sent: boolean; to: string; subject: string }>;
  });
}
