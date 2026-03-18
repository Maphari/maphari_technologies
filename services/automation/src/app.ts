import { randomUUID } from "node:crypto";
import type { ApiResponse } from "@maphari/contracts";
import { registerServiceRateLimit, ServiceMetrics } from "@maphari/platform";
import Fastify, { type FastifyInstance } from "fastify";
import type { AutomationJobRecord } from "./lib/subscriptions.js";
import { resolveWorkflow } from "./lib/subscriptions.js";

// Static map: workflow → estimated action descriptions for simulation dry-run
const WORKFLOW_ACTIONS: Record<string, string[]> = {
  "marketing.booking-automation-workflow": ["Send booking confirmation email", "Create CRM contact", "Enqueue follow-up reminder"],
  "sales.proposal-conversion-workflow": ["Mark proposal as signed", "Trigger contract generation", "Notify account manager"],
  "onboarding.submission-workflow": ["Create client workspace", "Send welcome email", "Assign onboarding checklist"],
  "project.status-sync-workflow": ["Sync status to dashboard", "Notify stakeholders", "Update SLA tracker"],
  "project.completion-testimonial-workflow": ["Send testimonial request email", "Archive project files", "Update portfolio"],
  "ops.maintenance-alert-workflow": ["Create maintenance ticket", "Alert on-call engineer", "Log to audit trail"],
  "security.incident-alert-workflow": ["Escalate to security team", "Lock affected accounts", "Log security event"],
  "reporting.distribution-workflow": ["Generate PDF report", "Distribute to subscribers", "Archive report"],
  "growth.testimonial-publish-workflow": ["Moderate testimonial", "Publish to portfolio", "Share on social"],
  "growth.client-reengagement-workflow": ["Send re-engagement email", "Create outreach task", "Flag in CRM"],
  "ai.lead-qualification-workflow": ["Score lead with AI", "Assign to sales rep", "Create qualification record"],
  "ai.proposal-drafting-workflow": ["Draft proposal with AI", "Send for review", "Log draft to CRM"],
  "ai.estimation-workflow": ["Generate cost estimate", "Attach to project brief", "Notify PM"],
  "marketing.lead-capture-workflow": ["Create lead record", "Send acknowledgement email", "Assign to pipeline"],
  "sales.pipeline-stage-workflow": ["Update pipeline stage", "Notify sales rep", "Log stage change"],
  "sales.lead-follow-up-workflow": ["Send follow-up email", "Create follow-up task", "Log interaction"],
  "clients.onboarding-workflow": ["Create client portal account", "Send onboarding email", "Schedule kickoff meeting"],
  "clients.lifecycle-update-workflow": ["Update client status", "Notify account manager", "Log lifecycle change"],
  "clients.renewal-workflow": ["Send renewal notice", "Create renewal task", "Update contract dates"],
  "communication.chat-notification-workflow": ["Push in-app notification", "Send email digest if offline", "Log message event"],
  "billing.invoice-issue-workflow": ["Send invoice email", "Create payment reminder schedule", "Log invoice event"],
  "billing.invoice-settlement-workflow": ["Mark invoice paid", "Send payment receipt", "Update financial records"],
  "billing.invoice-overdue-workflow": ["Send overdue notice", "Escalate to account manager", "Flag client account"],
  "ops.task-assignment-workflow": ["Notify assignee", "Update task board", "Log assignment event"],
  "ops.appointment-confirmation-workflow": ["Send appointment confirmation", "Create calendar event", "Send reminder T-24h"],
  "generic.domain-workflow": ["Route event to default handler", "Log to audit trail"]
};

export interface AutomationRuntime {
  app: FastifyInstance;
  metrics: ServiceMetrics;
}

interface AutomationRuntimeOptions {
  listJobs?: () => AutomationJobRecord[] | Promise<AutomationJobRecord[]>;
  listDeadLetters?: () => AutomationJobRecord[] | Promise<AutomationJobRecord[]>;
  getJobById?: (jobId: string) => AutomationJobRecord | null | Promise<AutomationJobRecord | null>;
  getRuntimeStats?: () => Promise<Record<string, unknown>> | Record<string, unknown>;
  acknowledgeDeadLetters?: () => Promise<number>;
  requeueFailed?: () => Promise<number>;
  saveJob?: (record: AutomationJobRecord) => Promise<void>;
}

export function createAutomationRuntime(options: AutomationRuntimeOptions = {}): AutomationRuntime {
  const app = Fastify({ logger: true });
  const metrics = new ServiceMetrics();
  const publicLimit = Number(process.env.SERVICE_RATE_LIMIT_PUBLIC_MAX ?? 120);
  const protectedLimit = Number(process.env.SERVICE_RATE_LIMIT_PROTECTED_MAX ?? 240);
  const rateWindowMs = Number(process.env.SERVICE_RATE_LIMIT_WINDOW_MS ?? 60_000);

  registerServiceRateLimit(app, {
    service: "automation",
    publicPolicy: { limit: publicLimit, windowMs: rateWindowMs },
    protectedPolicy: { limit: protectedLimit, windowMs: rateWindowMs },
    isPublicRoute: (url) => url === "/health" || url === "/metrics"
  });

  metrics.registerCounter("http_requests_total", "Total HTTP requests");
  metrics.registerHistogram("http_request_duration_ms", "HTTP request latency in milliseconds", [
    5, 10, 25, 50, 100, 250, 500, 1000, 2500
  ]);
  metrics.registerCounter("events_received_total", "Total domain events consumed");
  metrics.registerCounter("events_failed_total", "Total automation events that failed processing attempts");
  metrics.registerCounter("events_retry_total", "Total automation retries attempted");
  metrics.registerCounter("events_dead_lettered_total", "Total automation events moved to dead-letter");
  metrics.registerCounter("events_validation_failed_total", "Total automation events rejected by schema validation");
  metrics.registerCounter("events_duplicate_total", "Total duplicate automation events skipped by idempotency key");
  metrics.registerGauge("event_backlog_depth", "In-memory count of events currently being processed");
  metrics.registerCounter("scheduled_notifications_enqueued_total", "Total scheduled notifications enqueued");
  metrics.registerCounter("scheduled_notifications_sent_total", "Total scheduled notifications sent");
  metrics.registerCounter("scheduled_notifications_failed_total", "Total scheduled notifications failed");
  metrics.registerGauge("scheduled_notifications_pending", "Count of scheduled notifications pending dispatch");

  app.addHook("onRequest", async (request) => {
    (request as typeof request & { __start?: number }).__start = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = (request as typeof request & { __start?: number }).__start ?? Date.now();
    const duration = Date.now() - startedAt;
    const route = request.routeOptions?.url ?? request.url;
    metrics.inc("http_requests_total", {
      service: "automation",
      method: request.method,
      route,
      status: reply.statusCode
    });
    metrics.observe("http_request_duration_ms", duration, {
      service: "automation",
      method: request.method,
      route
    });
  });

  app.get("/health", async () => {
    return {
      success: true,
      data: { service: "automation", status: "ok" }
    } as ApiResponse<{ service: string; status: string }>;
  });

  app.get("/metrics", async (_, reply) => {
    reply.header("content-type", "text/plain; version=0.0.4");
    return metrics.renderPrometheus();
  });

  app.get("/automation/jobs", async () => {
    return {
      success: true,
      data: options.listJobs ? await options.listJobs() : []
    } as ApiResponse<AutomationJobRecord[]>;
  });

  app.get("/automation/jobs/:jobId", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const record = options.getJobById ? await options.getJobById(jobId) : null;

    if (!record) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: "AUTOMATION_JOB_NOT_FOUND",
          message: "Automation job was not found"
        }
      } as ApiResponse;
    }

    return {
      success: true,
      data: record
    } as ApiResponse<AutomationJobRecord>;
  });

  app.post("/automation/jobs", async (request, reply) => {
    const body = request.body as { type?: string; clientId?: string; projectId?: string; invoiceIds?: string[]; leadIds?: string[]; payload?: Record<string, unknown> };

    if (!body.type) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Job type is required." } } as ApiResponse;
    }

    const record: AutomationJobRecord = {
      jobId: randomUUID(),
      eventId: randomUUID(),
      topic: `manual.${body.type.toLowerCase().replace(/_/g, "-")}`,
      workflow: `manual.${body.type.toLowerCase().replace(/_/g, "-")}-workflow`,
      status: "received",
      attempts: 0,
      maxAttempts: 3,
      clientId: body.clientId ?? undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (options.saveJob) {
      await options.saveJob(record);
    }

    reply.status(201);
    return {
      success: true,
      data: record,
      meta: { requestId: request.headers["x-request-id"] ?? undefined }
    } as ApiResponse;
  });

  app.get("/automation/dead-letters", async () => {
    return {
      success: true,
      data: options.listDeadLetters ? await options.listDeadLetters() : []
    } as ApiResponse<AutomationJobRecord[]>;
  });

  app.post("/automation/jobs/acknowledge", async () => {
    const count = options.acknowledgeDeadLetters ? await options.acknowledgeDeadLetters() : 0;
    return {
      success: true,
      data: { acknowledged: count }
    } as ApiResponse<{ acknowledged: number }>;
  });

  app.post("/automation/jobs/retry-failed", async () => {
    const count = options.requeueFailed ? await options.requeueFailed() : 0;
    return {
      success: true,
      data: { requeued: count }
    } as ApiResponse<{ requeued: number }>;
  });

  app.post("/automation/simulate", async (request, reply) => {
    const body = request.body as { topic?: string; payload?: Record<string, unknown> } | null;
    if (!body || typeof body.topic !== "string" || !body.topic) {
      reply.status(400);
      return {
        success: false,
        error: { code: "SIMULATE_MISSING_TOPIC", message: "Request body must include a 'topic' string." }
      } as ApiResponse;
    }
    const { topic, payload = {} } = body;
    const workflow = resolveWorkflow(topic);
    const wouldTrigger = workflow !== "generic.domain-workflow";
    const estimatedActions = WORKFLOW_ACTIONS[workflow] ?? WORKFLOW_ACTIONS["generic.domain-workflow"] ?? [];
    return {
      success: true,
      data: {
        topic,
        workflow,
        wouldTrigger,
        estimatedActions,
        payloadKeys: Object.keys(payload)
      }
    } as ApiResponse<{
      topic: string;
      workflow: string;
      wouldTrigger: boolean;
      estimatedActions: string[];
      payloadKeys: string[];
    }>;
  });

  app.get("/automation/runtime", async () => {
    return {
      success: true,
      data: options.getRuntimeStats ? await options.getRuntimeStats() : {}
    } as ApiResponse<Record<string, unknown>>;
  });

  return { app, metrics };
}
