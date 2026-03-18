import { EventTopics, type DomainEvent } from "@maphari/platform";
import { describe, expect, it, vi } from "vitest";
import { automationTopics, createAutomationEventHandler, registerAutomationSubscriptions } from "../lib/subscriptions.js";

class FakeEventBus {
  handlers = new Map<string, (event: DomainEvent) => Promise<void>>();

  async subscribe(topic: string, handler: (event: DomainEvent) => Promise<void>): Promise<null> {
    this.handlers.set(topic, handler);
    return null;
  }
}

function createMockAdapters() {
  return {
    crm: {
      upsertLead: vi.fn().mockResolvedValue(undefined),
      updatePipelineStage: vi.fn().mockResolvedValue(undefined),
      tagLead: vi.fn().mockResolvedValue(undefined),
      createBookingPipelineEntry: vi.fn().mockResolvedValue(undefined),
      generateInvoiceFromProposal: vi.fn().mockResolvedValue(undefined),
      createProjectFromProposal: vi.fn().mockResolvedValue(undefined),
      assignOnboardingTasks: vi.fn().mockResolvedValue(undefined),
      createProjectFromPayment: vi.fn().mockResolvedValue(undefined),
      markInvoicePaid: vi.fn().mockResolvedValue(undefined)
    },
    notifications: {
      send: vi.fn().mockResolvedValue(undefined),
      flushDueScheduled: vi.fn().mockResolvedValue(undefined),
      queueStats: vi.fn().mockResolvedValue({ pending: 0, sent: 0, failed: 0 })
    }
  };
}

describe("automation billing workflow integration", () => {
  it("registers billing topics and logs workflow handling for each billing event", async () => {
    const eventBus = new FakeEventBus();
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const handler = createAutomationEventHandler(metrics, logger);

    await registerAutomationSubscriptions(eventBus, handler);

    for (const topic of [EventTopics.invoiceIssued, EventTopics.invoicePaid, EventTopics.invoiceOverdue]) {
      expect(automationTopics).toContain(topic);
      const topicHandler = eventBus.handlers.get(topic);
      expect(topicHandler).toBeTypeOf("function");
      await topicHandler?.({
        eventId: `${topic}-event`,
        occurredAt: "2026-02-17T00:00:00.000Z",
        requestId: `${topic}-request`,
        clientId: "550e8400-e29b-41d4-a716-446655440221",
        topic,
        payload: {
          invoiceId: "invoice-1",
          clientId: "550e8400-e29b-41d4-a716-446655440221"
        }
      });
    }

    expect(metrics.inc).toHaveBeenCalledWith(
      "events_received_total",
      expect.objectContaining({
        service: "automation",
        topic: EventTopics.invoiceIssued
      })
    );
    expect(metrics.inc).toHaveBeenCalledWith(
      "events_received_total",
      expect.objectContaining({
        service: "automation",
        topic: EventTopics.invoicePaid
      })
    );
    expect(metrics.inc).toHaveBeenCalledWith(
      "events_received_total",
      expect.objectContaining({
        service: "automation",
        topic: EventTopics.invoiceOverdue
      })
    );
    expect(metrics.set).toHaveBeenCalledWith("event_backlog_depth", 1, { service: "automation" });
    expect(metrics.set).toHaveBeenCalledWith("event_backlog_depth", 0, { service: "automation" });
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: EventTopics.invoiceIssued,
        workflow: "billing.invoice-issue-workflow"
      }),
      "automation event received"
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: EventTopics.invoicePaid,
        workflow: "billing.invoice-settlement-workflow"
      }),
      "automation event received"
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: EventTopics.invoiceOverdue,
        workflow: "billing.invoice-overdue-workflow"
      }),
      "automation event received"
    );
  });

  it("skips duplicate events using idempotency key", async () => {
    const eventBus = new FakeEventBus();
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const handler = createAutomationEventHandler(metrics, logger);
    await registerAutomationSubscriptions(eventBus, handler);

    const topicHandler = eventBus.handlers.get(EventTopics.invoicePaid);
    const duplicateEvent: DomainEvent = {
      eventId: "same-event-id",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.invoicePaid,
      clientId: "550e8400-e29b-41d4-a716-446655440221",
      payload: { invoiceId: "inv-1", clientId: "550e8400-e29b-41d4-a716-446655440221" }
    };

    await topicHandler?.(duplicateEvent);
    await topicHandler?.(duplicateEvent);

    expect(metrics.inc).toHaveBeenCalledWith(
      "events_duplicate_total",
      expect.objectContaining({ service: "automation", topic: EventTopics.invoicePaid })
    );
  });

  it("dead-letters invalid events and exposes them in dead-letter list", async () => {
    const eventBus = new FakeEventBus();
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn(), warn: vi.fn() };
    const handler = createAutomationEventHandler(metrics, logger);
    await registerAutomationSubscriptions(eventBus, handler);

    const topicHandler = eventBus.handlers.get(EventTopics.invoiceIssued);
    await topicHandler?.({
      eventId: "invalid-invoice-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.invoiceIssued,
      payload: { clientId: "550e8400-e29b-41d4-a716-446655440221" }
    });

    expect(metrics.inc).toHaveBeenCalledWith(
      "events_dead_lettered_total",
      expect.objectContaining({ service: "automation", topic: EventTopics.invoiceIssued })
    );
    expect(handler.getDeadLetters()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventId: "invalid-invoice-event",
          status: "dead-lettered",
          topic: EventTopics.invoiceIssued
        })
      ])
    );
  });

  it("uses persistence-backed idempotency across handler invocations", async () => {
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const persistence = {
      hasProcessedEvent: vi.fn().mockResolvedValue(true),
      markProcessedEvent: vi.fn(),
      saveJob: vi.fn(),
      getJob: vi.fn().mockResolvedValue(null),
      listJobs: vi.fn().mockResolvedValue([]),
      listDeadLetters: vi.fn().mockResolvedValue([]),
      acknowledgeDeadLetters: vi.fn().mockResolvedValue(0),
      requeueFailed: vi.fn().mockResolvedValue(0),
      enqueueScheduledNotification: vi.fn().mockResolvedValue(undefined),
      claimDueScheduledNotifications: vi.fn().mockResolvedValue([]),
      markScheduledNotificationSent: vi.fn().mockResolvedValue(undefined),
      markScheduledNotificationFailed: vi.fn().mockResolvedValue(undefined),
      getScheduledQueueStats: vi.fn().mockResolvedValue({ pending: 0, sent: 0, failed: 0 }),
      close: vi.fn()
    };
    const handler = createAutomationEventHandler(metrics, logger, { persistence });

    await handler({
      eventId: "persisted-event-id",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.invoicePaid,
      payload: { invoiceId: "inv-1" }
    });

    expect(persistence.hasProcessedEvent).toHaveBeenCalledWith("persisted-event-id");
    expect(metrics.inc).toHaveBeenCalledWith(
      "events_duplicate_total",
      expect.objectContaining({ service: "automation", topic: EventTopics.invoicePaid })
    );
  });

  it("runs lead capture automation steps on lead created events", async () => {
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const adapters = createMockAdapters();

    const handler = createAutomationEventHandler(metrics, logger, { adapters });
    await handler({
      eventId: "lead-capture-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.leadCreated,
      payload: { leadId: "lead-1", clientId: "client-1", status: "NEW" }
    });

    expect(adapters.crm.upsertLead).toHaveBeenCalledTimes(1);
    expect(adapters.crm.tagLead).toHaveBeenCalledTimes(1);
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "lead-auto-reply", channel: "email" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "lead-created-alert", channel: "internal" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "lead-created-alert", channel: "whatsapp" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "lead-follow-up-3d", channel: "email" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "lead-follow-up-7d", channel: "email" })
    );
  });

  it("runs payment confirmation and project creation automation on invoice paid", async () => {
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const adapters = createMockAdapters();

    const handler = createAutomationEventHandler(metrics, logger, { adapters });
    await handler({
      eventId: "invoice-paid-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.invoicePaid,
      payload: { invoiceId: "inv-1", clientId: "client-1", status: "PAID" }
    });

    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "invoice-payment-receipt", channel: "email" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "invoice-paid-admin-notification", channel: "internal" })
    );
    expect(adapters.crm.markInvoicePaid).toHaveBeenCalledTimes(1);
    expect(adapters.crm.createProjectFromPayment).toHaveBeenCalledTimes(1);
  });

  it("runs booking confirmation/reminder pipeline on booking created events", async () => {
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const adapters = createMockAdapters();

    const startsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const handler = createAutomationEventHandler(metrics, logger, { adapters });
    await handler({
      eventId: "booking-created-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.bookingCreated,
      payload: { bookingId: "book-1", startsAt, service: "consultation" }
    });

    expect(adapters.crm.createBookingPipelineEntry).toHaveBeenCalledTimes(1);
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "booking-confirmation", channel: "email" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "booking-created-team-alert", channel: "internal" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "booking-reminder-24h", channel: "email" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "booking-reminder-1h", channel: "email" })
    );
  });

  it("runs proposal signed conversion workflow", async () => {
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const adapters = createMockAdapters();

    const handler = createAutomationEventHandler(metrics, logger, { adapters });
    await handler({
      eventId: "proposal-signed-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.proposalSigned,
      payload: { proposalId: "a231247e-f1cc-4f44-b8d8-733cbbf5f0fd", clientId: "client-1" }
    });

    expect(adapters.crm.updatePipelineStage).toHaveBeenCalledTimes(1);
    expect(adapters.crm.generateInvoiceFromProposal).toHaveBeenCalledTimes(1);
    expect(adapters.crm.createProjectFromProposal).toHaveBeenCalledTimes(1);
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "proposal-signed-onboarding-welcome", channel: "email" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "proposal-signed-team-alert", channel: "internal" })
    );
  });

  it("runs onboarding submission workflow and schedules missing-assets reminder", async () => {
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const adapters = createMockAdapters();

    const handler = createAutomationEventHandler(metrics, logger, { adapters });
    await handler({
      eventId: "onboarding-submitted-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.onboardingSubmitted,
      payload: { submissionId: "6d46f155-04c0-44ff-b61b-2f9497e9f95d", clientId: "client-1", assetsProvided: [] }
    });

    expect(adapters.crm.assignOnboardingTasks).toHaveBeenCalledTimes(1);
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "onboarding-submitted-alert", channel: "internal" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "onboarding-missing-assets-reminder-3d", channel: "email" })
    );
  });

  it("runs project completion workflow and requests testimonial", async () => {
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const adapters = createMockAdapters();

    const handler = createAutomationEventHandler(metrics, logger, { adapters });
    await handler({
      eventId: "project-completed-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.projectCompleted,
      payload: { projectId: "proj-1", clientId: "client-1" }
    });

    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "project-completed-testimonial-request", channel: "email" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "project-completed-team-alert", channel: "internal" })
    );
  });

  it("runs file uploaded and chat SLA reminder notifications", async () => {
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const adapters = createMockAdapters();

    const handler = createAutomationEventHandler(metrics, logger, { adapters });
    await handler({
      eventId: "file-uploaded-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.fileUploaded,
      payload: { fileId: "file-1", clientId: "client-1" }
    });
    await handler({
      eventId: "message-created-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.messageCreated,
      payload: { messageId: "msg-1", clientId: "client-1" }
    });

    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "file-uploaded-notification", channel: "internal" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "file-uploaded-notification", channel: "email" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "chat-no-reply-sla-24h", channel: "internal" })
    );
  });

  it("runs operations/security/reporting/growth workflows", async () => {
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const adapters = createMockAdapters();

    const handler = createAutomationEventHandler(metrics, logger, { adapters });
    await handler({
      eventId: "maint-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.maintenanceCheckCompleted,
      payload: { checkId: "chk-1", status: "FAIL", checkType: "SSL" }
    });
    await handler({
      eventId: "sec-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.securityIncidentDetected,
      payload: { incidentId: "inc-1", severity: "CRITICAL", incidentType: "SUSPICIOUS_LOGIN", message: "x" }
    });
    await handler({
      eventId: "report-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.reportGenerated,
      payload: { reportId: "rep-1", reportType: "CLIENT_PERFORMANCE" }
    });
    await handler({
      eventId: "testimonial-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.testimonialReceived,
      payload: { testimonialId: "tes-1" }
    });
    await handler({
      eventId: "reengage-event",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.clientReengagementDue,
      payload: { reengagementId: "rea-1", contactEmail: "client@example.com" }
    });

    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "maintenance-check-alert", channel: "internal" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "security-incident-critical-alert", channel: "email" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "report-generated-client", channel: "email" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "testimonial-thank-you", channel: "email" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "client-reengagement-campaign", channel: "email" })
    );
  });

  it("runs AI qualification/proposal/estimate workflows", async () => {
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const adapters = createMockAdapters();

    const handler = createAutomationEventHandler(metrics, logger, { adapters });
    await handler({
      eventId: "ai-lead-qualified",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.aiLeadQualified,
      payload: { jobId: "job-1", leadId: "lead-1", score: "high" }
    });
    await handler({
      eventId: "ai-proposal-drafted",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.aiProposalDrafted,
      payload: { jobId: "job-2", result: "draft" }
    });
    await handler({
      eventId: "ai-estimate-generated",
      occurredAt: "2026-02-17T00:00:00.000Z",
      topic: EventTopics.aiEstimateGenerated,
      payload: { jobId: "job-3", result: "estimate" }
    });

    expect(adapters.crm.tagLead).toHaveBeenCalledTimes(1);
    expect(adapters.crm.updatePipelineStage).toHaveBeenCalledTimes(1);
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "ai-lead-qualified-review", channel: "internal" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "ai-proposal-draft-ready", channel: "internal" })
    );
    expect(adapters.notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ template: "ai-estimate-generated-review", channel: "internal" })
    );
  });
});
