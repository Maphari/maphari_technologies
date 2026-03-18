import { EventTopics, type DomainEvent } from "@maphari/platform";
import type { AutomationAdapters } from "./adapters/index.js";
import type { AutomationPersistence } from "./persistence.js";

export interface EventMetrics {
  inc(name: string, labels?: Record<string, string | number>): void;
  set(name: string, value: number, labels?: Record<string, string | number>): void;
}

export interface EventLogger {
  info(payload: Record<string, unknown>, message: string): void;
  warn?(payload: Record<string, unknown>, message: string): void;
  error?(payload: Record<string, unknown>, message: string): void;
}

export interface EventBusSubscriber {
  subscribe(topic: string, handler: (event: DomainEvent) => Promise<void>): Promise<unknown>;
}

export type AutomationJobStatus =
  | "received"
  | "processing"
  | "succeeded"
  | "failed"
  | "dead-lettered"
  | "skipped-duplicate"
  | "acknowledged";

export interface AutomationJobRecord {
  jobId: string;
  eventId: string;
  topic: string;
  workflow: string;
  status: AutomationJobStatus;
  attempts: number;
  maxAttempts: number;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
}

interface AutomationHandlerOptions {
  maxRetries?: number;
  initialRetryDelayMs?: number;
  scheduler?: (delayMs: number) => Promise<void>;
  adapters?: AutomationAdapters;
  persistence?: AutomationPersistence;
  initialAuditLog?: AutomationJobRecord[];
}

export interface AutomationEventHandler {
  (event: DomainEvent): Promise<void>;
  getAuditLog(): AutomationJobRecord[];
  getDeadLetters(): AutomationJobRecord[];
}

export const automationTopics = [
  EventTopics.userLoggedIn,
  EventTopics.tokenRefreshed,
  EventTopics.projectCreated,
  EventTopics.projectStatusUpdated,
  EventTopics.projectCompleted,
  EventTopics.bookingCreated,
  EventTopics.proposalSigned,
  EventTopics.onboardingSubmitted,
  EventTopics.maintenanceCheckCompleted,
  EventTopics.securityIncidentDetected,
  EventTopics.reportGenerated,
  EventTopics.testimonialReceived,
  EventTopics.clientReengagementDue,
  EventTopics.aiLeadQualified,
  EventTopics.aiProposalDrafted,
  EventTopics.aiEstimateGenerated,
  EventTopics.leadCreated,
  EventTopics.leadStatusUpdated,
  EventTopics.leadFollowUpDue,
  EventTopics.clientCreated,
  EventTopics.clientStatusUpdated,
  EventTopics.clientRenewalDue,
  EventTopics.conversationCreated,
  EventTopics.messageCreated,
  EventTopics.fileUploaded,
  EventTopics.invoiceIssued,
  EventTopics.invoicePaid,
  EventTopics.invoiceOverdue,
  EventTopics.taskAssigned,
  EventTopics.appointmentCreated
] as const;

export function resolveWorkflow(topic: string): string {
  if (topic === EventTopics.bookingCreated) return "marketing.booking-automation-workflow";
  if (topic === EventTopics.proposalSigned) return "sales.proposal-conversion-workflow";
  if (topic === EventTopics.onboardingSubmitted) return "onboarding.submission-workflow";
  if (topic === EventTopics.projectStatusUpdated) return "project.status-sync-workflow";
  if (topic === EventTopics.projectCompleted) return "project.completion-testimonial-workflow";
  if (topic === EventTopics.maintenanceCheckCompleted) return "ops.maintenance-alert-workflow";
  if (topic === EventTopics.securityIncidentDetected) return "security.incident-alert-workflow";
  if (topic === EventTopics.reportGenerated) return "reporting.distribution-workflow";
  if (topic === EventTopics.testimonialReceived) return "growth.testimonial-publish-workflow";
  if (topic === EventTopics.clientReengagementDue) return "growth.client-reengagement-workflow";
  if (topic === EventTopics.aiLeadQualified) return "ai.lead-qualification-workflow";
  if (topic === EventTopics.aiProposalDrafted) return "ai.proposal-drafting-workflow";
  if (topic === EventTopics.aiEstimateGenerated) return "ai.estimation-workflow";
  if (topic === EventTopics.leadCreated) return "marketing.lead-capture-workflow";
  if (topic === EventTopics.leadStatusUpdated) return "sales.pipeline-stage-workflow";
  if (topic === EventTopics.leadFollowUpDue) return "sales.lead-follow-up-workflow";
  if (topic === EventTopics.clientCreated) return "clients.onboarding-workflow";
  if (topic === EventTopics.clientStatusUpdated) return "clients.lifecycle-update-workflow";
  if (topic === EventTopics.clientRenewalDue) return "clients.renewal-workflow";
  if (topic === EventTopics.messageCreated) return "communication.chat-notification-workflow";
  if (topic === EventTopics.invoiceIssued) return "billing.invoice-issue-workflow";
  if (topic === EventTopics.invoicePaid) return "billing.invoice-settlement-workflow";
  if (topic === EventTopics.invoiceOverdue) return "billing.invoice-overdue-workflow";
  if (topic === EventTopics.taskAssigned) return "ops.task-assignment-workflow";
  if (topic === EventTopics.appointmentCreated) return "ops.appointment-confirmation-workflow";
  return "generic.domain-workflow";
}

const topicValidators: Partial<Record<(typeof automationTopics)[number], (payload: unknown) => string | null>> = {
  [EventTopics.userLoggedIn]: (payload) => requireObjectPayload(payload),
  [EventTopics.tokenRefreshed]: (payload) => requireObjectPayload(payload),
  [EventTopics.projectCreated]: (payload) => requireObjectPayload(payload),
  [EventTopics.projectStatusUpdated]: (payload) => requireObjectPayloadWithField(payload, "projectId"),
  [EventTopics.projectCompleted]: (payload) => requireObjectPayloadWithField(payload, "projectId"),
  [EventTopics.maintenanceCheckCompleted]: (payload) => requireObjectPayloadWithField(payload, "checkId"),
  [EventTopics.securityIncidentDetected]: (payload) => requireObjectPayloadWithField(payload, "incidentId"),
  [EventTopics.reportGenerated]: (payload) => requireObjectPayloadWithField(payload, "reportId"),
  [EventTopics.testimonialReceived]: (payload) => requireObjectPayloadWithField(payload, "testimonialId"),
  [EventTopics.clientReengagementDue]: (payload) => requireObjectPayloadWithField(payload, "reengagementId"),
  [EventTopics.aiLeadQualified]: (payload) => requireObjectPayloadWithFields(payload, ["jobId", "leadId"]),
  [EventTopics.aiProposalDrafted]: (payload) => requireObjectPayloadWithField(payload, "jobId"),
  [EventTopics.aiEstimateGenerated]: (payload) => requireObjectPayloadWithField(payload, "jobId"),
  [EventTopics.bookingCreated]: (payload) => requireObjectPayloadWithFields(payload, ["bookingId", "startsAt"]),
  [EventTopics.proposalSigned]: (payload) => requireObjectPayloadWithField(payload, "proposalId"),
  [EventTopics.onboardingSubmitted]: (payload) => requireObjectPayloadWithField(payload, "submissionId"),
  [EventTopics.leadCreated]: (payload) => requireObjectPayload(payload),
  [EventTopics.leadStatusUpdated]: (payload) => requireObjectPayload(payload),
  [EventTopics.leadFollowUpDue]: (payload) => requireObjectPayloadWithField(payload, "leadId"),
  [EventTopics.clientCreated]: (payload) => requireObjectPayloadWithField(payload, "clientId"),
  [EventTopics.clientStatusUpdated]: (payload) => requireObjectPayloadWithField(payload, "clientId"),
  [EventTopics.clientRenewalDue]: (payload) => requireObjectPayloadWithField(payload, "clientId"),
  [EventTopics.conversationCreated]: (payload) => requireObjectPayload(payload),
  [EventTopics.messageCreated]: (payload) => requireObjectPayload(payload),
  [EventTopics.fileUploaded]: (payload) => requireObjectPayload(payload),
  [EventTopics.invoiceIssued]: (payload) => requireObjectPayloadWithField(payload, "invoiceId"),
  [EventTopics.invoicePaid]: (payload) => requireObjectPayloadWithField(payload, "invoiceId"),
  [EventTopics.invoiceOverdue]: (payload) => requireObjectPayloadWithField(payload, "invoiceId"),
  [EventTopics.taskAssigned]: (payload) => requireObjectPayloadWithFields(payload, ["taskId", "assignedToId"]),
  [EventTopics.appointmentCreated]: (payload) => requireObjectPayloadWithField(payload, "bookingId")
};

const knownTopics = new Set<string>(automationTopics);

function requireObjectPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Payload must be an object";
  }
  return null;
}

function requireObjectPayloadWithField(payload: unknown, field: string): string | null {
  const baseError = requireObjectPayload(payload);
  if (baseError) return baseError;
  if (!(field in (payload as Record<string, unknown>))) {
    return `Payload is missing required field: ${field}`;
  }
  return null;
}

function requireObjectPayloadWithFields(payload: unknown, fields: string[]): string | null {
  const baseError = requireObjectPayload(payload);
  if (baseError) return baseError;
  for (const field of fields) {
    if (!(field in (payload as Record<string, unknown>))) {
      return `Payload is missing required field: ${field}`;
    }
  }
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.max(0, ms));
  });
}

function createJobId(event: DomainEvent): string {
  return `${event.topic}:${event.eventId}`;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function computeBackoffDelay(initialDelayMs: number, attempt: number): number {
  return initialDelayMs * Math.pow(2, Math.max(0, attempt - 1));
}

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateDomainEvent(event: DomainEvent): string | null {
  if (!event.eventId || typeof event.eventId !== "string") return "Missing eventId";
  if (!event.occurredAt || Number.isNaN(Date.parse(event.occurredAt))) return "Invalid occurredAt";
  if (!event.topic || typeof event.topic !== "string") return "Missing topic";
  if (!knownTopics.has(event.topic)) return `Unsupported topic: ${event.topic}`;

  const validator = topicValidators[event.topic as (typeof automationTopics)[number]];
  if (!validator) return null;
  return validator(event.payload);
}

/**
 * Centralized event handler keeps instrumentation/log format aligned across
 * all domain topics and reduces subscriber boilerplate.
 */
export function createAutomationEventHandler(
  metrics: EventMetrics,
  logger: EventLogger,
  options: AutomationHandlerOptions = {}
): AutomationEventHandler {
  let backlogDepth = 0;
  const maxAttempts = Math.max(1, options.maxRetries ?? Number(process.env.AUTOMATION_MAX_RETRIES ?? 3));
  const initialRetryDelayMs = Math.max(
    0,
    options.initialRetryDelayMs ?? Number(process.env.AUTOMATION_RETRY_INITIAL_DELAY_MS ?? 250)
  );
  const schedule = options.scheduler ?? delay;
  const adapters = options.adapters;
  const persistence = options.persistence;
  const idempotencyKeys = new Set<string>();
  const auditLog = new Map<string, AutomationJobRecord>(
    (options.initialAuditLog ?? []).map((record) => [record.jobId, record] as const)
  );

  const upsertAuditRecord = async (
    event: DomainEvent,
    workflow: string,
    status: AutomationJobStatus,
    attempts: number,
    lastError?: string
  ): Promise<AutomationJobRecord> => {
    const now = new Date().toISOString();
    const jobId = createJobId(event);
    const previous = auditLog.get(jobId);
    const record: AutomationJobRecord = {
      jobId,
      eventId: event.eventId,
      topic: event.topic,
      workflow,
      status,
      attempts,
      maxAttempts,
      clientId: event.clientId ?? ((event.payload as { clientId?: string }).clientId ?? undefined),
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      ...(lastError ? { lastError } : {})
    };
    auditLog.set(jobId, record);
    if (persistence) {
      await persistence.saveJob(record);
    }
    return record;
  };

  const performWorkflow = async (event: DomainEvent, workflow: string): Promise<void> => {
    if (adapters) {
      if (event.topic === EventTopics.bookingCreated) {
        await adapters.crm.createBookingPipelineEntry({ eventId: event.eventId, payload: event.payload });
        await adapters.notifications.send({
          channel: "email",
          template: "booking-confirmation",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "internal",
          template: "booking-created-team-alert",
          eventId: event.eventId,
          payload: event.payload
        });

        const startsAt = parseIsoDate((event.payload as { startsAt?: unknown }).startsAt);
        if (startsAt) {
          const reminder24h = new Date(startsAt.getTime() - 24 * 60 * 60 * 1000);
          if (reminder24h.getTime() > Date.now()) {
            await adapters.notifications.send({
              channel: "email",
              template: "booking-reminder-24h",
              eventId: event.eventId,
              payload: event.payload,
              scheduleAt: reminder24h.toISOString()
            });
          }

          const reminder1h = new Date(startsAt.getTime() - 60 * 60 * 1000);
          if (reminder1h.getTime() > Date.now()) {
            await adapters.notifications.send({
              channel: "email",
              template: "booking-reminder-1h",
              eventId: event.eventId,
              payload: event.payload,
              scheduleAt: reminder1h.toISOString()
            });
          }
        }
      }

      if (event.topic === EventTopics.proposalSigned) {
        await adapters.crm.updatePipelineStage({
          eventId: event.eventId,
          payload: {
            ...(event.payload as Record<string, unknown>),
            status: "WON"
          }
        });
        await adapters.crm.generateInvoiceFromProposal({ eventId: event.eventId, payload: event.payload });
        await adapters.crm.createProjectFromProposal({ eventId: event.eventId, payload: event.payload });
        await adapters.notifications.send({
          channel: "email",
          template: "proposal-signed-onboarding-welcome",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "internal",
          template: "proposal-signed-team-alert",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.onboardingSubmitted) {
        await adapters.crm.assignOnboardingTasks({ eventId: event.eventId, payload: event.payload });
        await adapters.notifications.send({
          channel: "internal",
          template: "onboarding-submitted-alert",
          eventId: event.eventId,
          payload: event.payload
        });

        const assets = (event.payload as { assetsProvided?: unknown }).assetsProvided;
        const hasAssets = Array.isArray(assets) && assets.length > 0;
        if (!hasAssets) {
          await adapters.notifications.send({
            channel: "email",
            template: "onboarding-missing-assets-reminder-3d",
            eventId: event.eventId,
            payload: event.payload,
            scheduleAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }

      if (event.topic === EventTopics.projectStatusUpdated) {
        await adapters.notifications.send({
          channel: "internal",
          template: "project-status-updated-dashboard-sync",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.projectCompleted) {
        await adapters.notifications.send({
          channel: "email",
          template: "project-completed-testimonial-request",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "internal",
          template: "project-completed-team-alert",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.maintenanceCheckCompleted) {
        await adapters.notifications.send({
          channel: "internal",
          template: "maintenance-check-completed",
          eventId: event.eventId,
          payload: event.payload
        });
        const status = (event.payload as { status?: unknown }).status;
        if (status === "WARN" || status === "FAIL") {
          await adapters.notifications.send({
            channel: "internal",
            template: "maintenance-check-alert",
            eventId: event.eventId,
            payload: event.payload
          });
        }
      }

      if (event.topic === EventTopics.securityIncidentDetected) {
        await adapters.notifications.send({
          channel: "internal",
          template: "security-incident-detected",
          eventId: event.eventId,
          payload: event.payload
        });
        const severity = (event.payload as { severity?: unknown }).severity;
        if (severity === "HIGH" || severity === "CRITICAL") {
          await adapters.notifications.send({
            channel: "email",
            template: "security-incident-critical-alert",
            eventId: event.eventId,
            payload: event.payload
          });
        }
      }

      if (event.topic === EventTopics.reportGenerated) {
        await adapters.notifications.send({
          channel: "internal",
          template: "report-generated-internal",
          eventId: event.eventId,
          payload: event.payload
        });
        const reportType = (event.payload as { reportType?: unknown }).reportType;
        if (reportType === "CLIENT_PERFORMANCE" || reportType === "MAINTENANCE") {
          await adapters.notifications.send({
            channel: "email",
            template: "report-generated-client",
            eventId: event.eventId,
            payload: event.payload
          });
        }
      }

      if (event.topic === EventTopics.testimonialReceived) {
        await adapters.notifications.send({
          channel: "internal",
          template: "testimonial-received-publish-queue",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "email",
          template: "testimonial-thank-you",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.clientReengagementDue) {
        await adapters.notifications.send({
          channel: "email",
          template: "client-reengagement-campaign",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "internal",
          template: "client-reengagement-created",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.clientCreated) {
        await adapters.notifications.send({
          channel: "internal",
          template: "client-onboarding-created",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.clientStatusUpdated) {
        await adapters.notifications.send({
          channel: "internal",
          template: "client-status-changed-alert",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.clientRenewalDue) {
        await adapters.notifications.send({
          channel: "email",
          template: "client-renewal-reminder",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "internal",
          template: "client-renewal-alert",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.aiLeadQualified) {
        await adapters.crm.tagLead({
          eventId: event.eventId,
          payload: {
            ...(event.payload as Record<string, unknown>),
            tags: ["ai-qualified"]
          }
        });
        await adapters.crm.updatePipelineStage({
          eventId: event.eventId,
          payload: {
            ...(event.payload as Record<string, unknown>),
            status: "QUALIFIED"
          }
        });
        await adapters.notifications.send({
          channel: "internal",
          template: "ai-lead-qualified-review",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.aiProposalDrafted) {
        await adapters.notifications.send({
          channel: "internal",
          template: "ai-proposal-draft-ready",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.aiEstimateGenerated) {
        await adapters.notifications.send({
          channel: "internal",
          template: "ai-estimate-generated-review",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.leadCreated) {
        await adapters.crm.upsertLead({ eventId: event.eventId, payload: event.payload });
        await adapters.crm.tagLead({
          eventId: event.eventId,
          payload: {
            ...(event.payload as Record<string, unknown>),
            tags: ["new-lead", "website-inquiry"]
          }
        });
        await adapters.notifications.send({
          channel: "email",
          template: "lead-auto-reply",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "internal",
          template: "lead-created-alert",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "whatsapp",
          template: "lead-created-alert",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "email",
          template: "lead-follow-up-3d",
          eventId: event.eventId,
          payload: event.payload,
          scheduleAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        });
        await adapters.notifications.send({
          channel: "email",
          template: "lead-follow-up-7d",
          eventId: event.eventId,
          payload: event.payload,
          scheduleAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      if (event.topic === EventTopics.leadStatusUpdated) {
        await adapters.crm.updatePipelineStage({ eventId: event.eventId, payload: event.payload });
      }

      if (event.topic === EventTopics.leadFollowUpDue) {
        await adapters.notifications.send({
          channel: "email",
          template: "lead-follow-up-due",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "internal",
          template: "lead-follow-up-due-alert",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.invoiceIssued) {
        await adapters.notifications.send({
          channel: "email",
          template: "invoice-issued",
          eventId: event.eventId,
          payload: event.payload
        });
        const dueAt = parseIsoDate((event.payload as { dueAt?: unknown }).dueAt);
        if (dueAt) {
          const reminderAt = new Date(dueAt.getTime() - 3 * 24 * 60 * 60 * 1000);
          if (reminderAt.getTime() > Date.now()) {
            await adapters.notifications.send({
              channel: "email",
              template: "invoice-due-reminder-3d",
              eventId: event.eventId,
              payload: event.payload,
              scheduleAt: reminderAt.toISOString()
            });
          }
        }
      }

      if (event.topic === EventTopics.invoicePaid) {
        await adapters.notifications.send({
          channel: "email",
          template: "invoice-payment-receipt",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "internal",
          template: "invoice-paid-admin-notification",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.crm.markInvoicePaid({ eventId: event.eventId, payload: event.payload });
        await adapters.crm.createProjectFromPayment({ eventId: event.eventId, payload: event.payload });
      }

      if (event.topic === EventTopics.invoiceOverdue) {
        await adapters.notifications.send({
          channel: "internal",
          template: "invoice-overdue-escalation",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      if (event.topic === EventTopics.messageCreated) {
        await adapters.notifications.send({
          channel: "internal",
          template: "chat-message-created",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "internal",
          template: "chat-no-reply-sla-24h",
          eventId: event.eventId,
          payload: event.payload,
          scheduleAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
      }

      if (event.topic === EventTopics.fileUploaded) {
        await adapters.notifications.send({
          channel: "internal",
          template: "file-uploaded-notification",
          eventId: event.eventId,
          payload: event.payload
        });
        await adapters.notifications.send({
          channel: "email",
          template: "file-uploaded-notification",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      // ── Task assigned → notify assigned staff member ──────────────────────
      if (event.topic === EventTopics.taskAssigned) {
        // Notify the assigned staff member via email
        await adapters.notifications.send({
          channel: "email",
          template: "task-assigned-notification",
          eventId: event.eventId,
          payload: event.payload
        });
        // Internal dashboard notification
        await adapters.notifications.send({
          channel: "internal",
          template: "task-assigned-notification",
          eventId: event.eventId,
          payload: event.payload
        });
      }

      // ── Appointment created → notify attendees ────────────────────────────
      if (event.topic === EventTopics.appointmentCreated) {
        // Confirmation email to attendees
        await adapters.notifications.send({
          channel: "email",
          template: "appointment-confirmation",
          eventId: event.eventId,
          payload: event.payload
        });
        // Internal team notification
        await adapters.notifications.send({
          channel: "internal",
          template: "appointment-created-notification",
          eventId: event.eventId,
          payload: event.payload
        });
        // 24h reminder before appointment
        const appointmentPayload = event.payload as { startsAt?: string };
        if (appointmentPayload.startsAt) {
          const reminderAt = new Date(new Date(appointmentPayload.startsAt).getTime() - 24 * 60 * 60 * 1000).toISOString();
          await adapters.notifications.send({
            channel: "email",
            template: "appointment-reminder-24h",
            eventId: event.eventId,
            payload: event.payload,
            scheduleAt: reminderAt
          });
        }
      }
    }

    logger.info(
      {
        topic: event.topic,
        clientId: event.clientId ?? ((event.payload as { clientId?: string }).clientId ?? undefined),
        workflow,
        payload: event.payload
      },
      "automation event received"
    );
  };

  const handler = async (event: DomainEvent): Promise<void> => {
    backlogDepth += 1;
    metrics.set("event_backlog_depth", backlogDepth, { service: "automation" });
    metrics.inc("events_received_total", { service: "automation", topic: event.topic });
    const workflow = resolveWorkflow(event.topic);

    try {
      const validationError = validateDomainEvent(event);
      if (validationError) {
        await upsertAuditRecord(event, workflow, "dead-lettered", 0, validationError);
        metrics.inc("events_validation_failed_total", { service: "automation", topic: event.topic });
        metrics.inc("events_dead_lettered_total", { service: "automation", topic: event.topic });
        logger.warn?.(
          {
            eventId: event.eventId,
            topic: event.topic,
            workflow,
            error: validationError
          },
          "automation event validation failed"
        );
        return;
      }

      const alreadyProcessed = idempotencyKeys.has(event.eventId) || (await persistence?.hasProcessedEvent(event.eventId));
      if (alreadyProcessed) {
        await upsertAuditRecord(event, workflow, "skipped-duplicate", 0);
        metrics.inc("events_duplicate_total", { service: "automation", topic: event.topic });
        logger.info(
          {
            eventId: event.eventId,
            topic: event.topic,
            workflow
          },
          "automation duplicate event skipped"
        );
        return;
      }

      await upsertAuditRecord(event, workflow, "received", 0);
      let lastErrorMessage: string | undefined;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        await upsertAuditRecord(event, workflow, "processing", attempt, lastErrorMessage);
        try {
          await performWorkflow(event, workflow);
          await upsertAuditRecord(event, workflow, "succeeded", attempt);
          idempotencyKeys.add(event.eventId);
          if (persistence) {
            await persistence.markProcessedEvent(event.eventId);
          }
          return;
        } catch (error) {
          lastErrorMessage = toErrorMessage(error);
          await upsertAuditRecord(event, workflow, "failed", attempt, lastErrorMessage);
          metrics.inc("events_failed_total", { service: "automation", topic: event.topic, attempt });

          if (attempt < maxAttempts) {
            metrics.inc("events_retry_total", { service: "automation", topic: event.topic, attempt });
            await schedule(computeBackoffDelay(initialRetryDelayMs, attempt));
            continue;
          }

          await upsertAuditRecord(event, workflow, "dead-lettered", attempt, lastErrorMessage);
          metrics.inc("events_dead_lettered_total", { service: "automation", topic: event.topic });
          logger.error?.(
            {
              eventId: event.eventId,
              topic: event.topic,
              workflow,
              attempts: attempt,
              error: lastErrorMessage
            },
            "automation event moved to dead-letter queue"
          );
        }
      }
    } finally {
      backlogDepth = Math.max(backlogDepth - 1, 0);
      metrics.set("event_backlog_depth", backlogDepth, { service: "automation" });
    }
  };

  return Object.assign(handler, {
    getAuditLog: () => Array.from(auditLog.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    getDeadLetters: () =>
      Array.from(auditLog.values())
        .filter((record) => record.status === "dead-lettered")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  });
}

export async function registerAutomationSubscriptions(
  eventBus: EventBusSubscriber,
  handler: (event: DomainEvent) => Promise<void>
): Promise<void> {
  for (const topic of automationTopics) {
    await eventBus.subscribe(topic, handler);
  }
}
