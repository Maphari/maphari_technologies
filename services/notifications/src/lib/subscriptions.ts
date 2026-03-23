import { EventTopics, type DomainEvent } from "@maphari/platform";
import { enqueueJob } from "./queue.js";

export interface EventMetrics {
  inc(name: string, labels?: Record<string, string | number>): void;
  set(name: string, value: number, labels?: Record<string, string | number>): void;
}

export interface EventLogger {
  info(payload: Record<string, unknown>, message: string): void;
}

export interface EventBusSubscriber {
  subscribe(topic: string, handler: (event: DomainEvent) => Promise<void>): Promise<unknown>;
}

export const notificationTopics = [
  EventTopics.notificationRequested,
  EventTopics.leadCreated,
  EventTopics.messageCreated,
  EventTopics.invoiceOverdue,
  EventTopics.healthAlert
] as const;

function defaultMessageForTopic(topic: string): string {
  if (topic === EventTopics.notificationRequested) return "A notification was requested.";
  if (topic === EventTopics.leadCreated) return "A new lead was created.";
  if (topic === EventTopics.messageCreated) return "A new chat message was received.";
  if (topic === EventTopics.invoiceOverdue) return "An invoice is now overdue.";
  if (topic === EventTopics.healthAlert) return "A project health alert was triggered.";
  return "A platform event was received.";
}

/**
 * Maps domain events to notification jobs so trigger-based alerts can flow
 * without coupling this service to domain implementations.
 */
export function createNotificationEventHandler(metrics: EventMetrics, logger: EventLogger) {
  let backlogDepth = 0;

  return async (event: DomainEvent): Promise<void> => {
    backlogDepth += 1;
    metrics.set("event_backlog_depth", backlogDepth, { service: "notifications" });
    metrics.inc("events_received_total", { service: "notifications", topic: event.topic });

    const payload = event.payload as {
      clientId?: string;
      channel?: "EMAIL" | "SMS" | "PUSH";
      recipient?: string;
      recipientEmail?: string;
      recipientRole?: string;
      subject?: string;
      message?: string;
      tab?: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
      // fields forwarded by leads.ts for auto-reply
      contactName?: string;
      contactEmail?: string;
      // health alert specific fields
      projectId?: string;
      projectName?: string;
      alertType?: string;
      severity?: string;
    };
    const eventClientId = event.clientId ?? payload.clientId ?? undefined;

    if (event.topic === EventTopics.notificationRequested) {
      const channel = payload.channel ?? "EMAIL";
      const recipient =
        payload.recipientEmail ??
        payload.recipient ??
        (payload.recipientRole ? `${payload.recipientRole.toLowerCase()}@mapharitechnologies.com` : "ops@mapharitechnologies.com");
      await enqueueJob({
        clientId: eventClientId ?? "system",
        channel,
        recipient,
        subject: payload.subject ?? "Maphari notification",
        message: payload.message ?? defaultMessageForTopic(event.topic),
        tab: payload.tab ?? "dashboard",
        metadata: {
          eventId: event.eventId,
          topic: event.topic
        }
      });
      metrics.inc("notification_jobs_total", { service: "notifications", status: "QUEUED" });
    } else if (event.topic === EventTopics.healthAlert && eventClientId) {
      // ── Health alert: notify ADMIN ops channel + client ────────────────────
      const projectName = payload.projectName ?? "A project";
      const alertType   = payload.alertType ?? "health_alert";
      const severity    = payload.severity ?? "HIGH";
      const subject     = `[${severity}] Project health alert: ${projectName}`;
      const alertMessages: Record<string, string> = {
        risk_escalated:  `${projectName} has been escalated to ${severity} risk level and requires immediate attention.`,
        invoice_overdue: `An invoice for ${projectName} is more than 14 days overdue.`,
        sprint_at_risk:  `${projectName} sprint completion is below 50% with less than 7 days to the deadline.`
      };
      const message = alertMessages[alertType] ?? `Health alert triggered for ${projectName}.`;

      // Notify internal ops (ADMIN)
      await enqueueJob({
        clientId: eventClientId,
        channel: "EMAIL",
        recipient: "ops@mapharitechnologies.com",
        subject,
        message,
        tab: "projects",
        metadata: {
          eventId:     event.eventId,
          topic:       event.topic,
          alertType,
          severity,
          projectId:   payload.projectId ?? "",
          projectName
        }
      });
      metrics.inc("notification_jobs_total", { service: "notifications", status: "QUEUED" });

      // Notify client (in-portal notification, tab: projects)
      await enqueueJob({
        clientId: eventClientId,
        channel: "PUSH",
        recipient: eventClientId,
        subject,
        message,
        tab: "projects",
        metadata: {
          eventId:     event.eventId,
          topic:       event.topic,
          alertType,
          severity,
          projectId:   payload.projectId ?? "",
          projectName
        }
      });
      metrics.inc("notification_jobs_total", { service: "notifications", status: "QUEUED" });
    } else if (eventClientId) {
      // Internal ops alert for all non-notification events
      await enqueueJob({
        clientId: eventClientId,
        channel: "EMAIL",
        recipient: "ops@mapharitechnologies.com",
        subject: `Event: ${event.topic}`,
        message: defaultMessageForTopic(event.topic),
        metadata: {
          eventId: event.eventId,
          topic: event.topic
        }
      });
      metrics.inc("notification_jobs_total", { service: "notifications", status: "QUEUED" });

      // Auto-reply to contact form submitters when a lead is created with an email
      if (event.topic === EventTopics.leadCreated && payload.contactEmail) {
        const name = payload.contactName ?? "there";
        await enqueueJob({
          clientId: eventClientId,
          channel: "EMAIL",
          recipient: payload.contactEmail,
          subject: "Thanks for reaching out to Maphari",
          message: [
            `Hi ${name},`,
            "",
            "Thank you for your message — we've received your inquiry and will be in touch within one business day.",
            "",
            "In the meantime, feel free to browse our service catalog at maphari.com.",
            "",
            "Best regards,",
            "The Maphari Team"
          ].join("\n"),
          tab: "dashboard",
          metadata: {
            eventId: event.eventId,
            topic: event.topic,
            autoReply: true
          }
        });
        metrics.inc("notification_jobs_total", { service: "notifications", status: "QUEUED" });
      }
    }

    logger.info(
      {
        topic: event.topic,
        clientId: eventClientId,
        eventId: event.eventId
      },
      "notification trigger event received"
    );

    backlogDepth = Math.max(backlogDepth - 1, 0);
    metrics.set("event_backlog_depth", backlogDepth, { service: "notifications" });
  };
}

export async function registerNotificationSubscriptions(
  eventBus: EventBusSubscriber,
  handler: (event: DomainEvent) => Promise<void>
): Promise<void> {
  for (const topic of notificationTopics) {
    await eventBus.subscribe(topic, handler);
  }
}
