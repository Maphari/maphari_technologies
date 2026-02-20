import { signWebhookPayload } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import type { AutomationPersistence, ScheduledNotificationRecord } from "../persistence.js";

interface NotificationPayload {
  channel: "email" | "whatsapp" | "internal";
  template: string;
  eventId: string;
  payload: unknown;
  scheduleAt?: string;
}

export interface NotificationAdapter {
  send(input: NotificationPayload): Promise<void>;
  flushDueScheduled(limit: number): Promise<void>;
  queueStats(): Promise<{ pending: number; sent: number; failed: number }>;
}

interface NotificationAdapterConfig {
  provider: "noop" | "webhook";
  webhookUrl?: string;
  apiKey?: string;
  signingSecret?: string;
}

interface LoggerLike {
  info(payload: Record<string, unknown>, message: string): void;
  error?(payload: Record<string, unknown>, message: string): void;
}

interface MetricsLike {
  inc(name: string, labels?: Record<string, string | number>): void;
  set(name: string, value: number, labels?: Record<string, string | number>): void;
}

async function postWebhook(
  url: string,
  apiKey: string | undefined,
  signingSecret: string | undefined,
  body: Record<string, unknown>
): Promise<void> {
  const serialized = JSON.stringify(body);
  const timestamp = String(Date.now());
  const signature = signingSecret ? signWebhookPayload(`${timestamp}.${serialized}`, signingSecret) : undefined;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {})
      ,
      ...(signature ? { "x-maphari-signature": signature, "x-maphari-timestamp": timestamp } : {})
    },
    body: serialized
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notification webhook failed (${response.status}): ${text || response.statusText}`);
  }
}

export function createNotificationAdapter(
  config: NotificationAdapterConfig,
  logger: LoggerLike,
  options: { persistence: AutomationPersistence; metrics: MetricsLike }
): NotificationAdapter {
  const dispatchNow = async (input: NotificationPayload): Promise<void> => {
    if (config.provider === "webhook" && config.webhookUrl) {
      await postWebhook(config.webhookUrl as string, config.apiKey, config.signingSecret, {
        provider: "notifications",
        ...input
      });
      return;
    }

    logger.info(
      {
        provider: "notifications.noop",
        channel: input.channel,
        template: input.template,
        eventId: input.eventId
      },
      "notification adapter noop send"
    );
  };

  const queueRecordFrom = (input: NotificationPayload): ScheduledNotificationRecord => ({
    id: randomUUID(),
    eventId: input.eventId,
    channel: input.channel,
    template: input.template,
    payload: input.payload,
    scheduleAt: input.scheduleAt as string,
    createdAt: new Date().toISOString(),
    status: "pending"
  });

  if (config.provider === "webhook" && config.webhookUrl) {
    return {
      async send(input: NotificationPayload): Promise<void> {
        if (input.scheduleAt && Date.parse(input.scheduleAt) > Date.now()) {
          await options.persistence.enqueueScheduledNotification(queueRecordFrom(input));
          options.metrics.inc("scheduled_notifications_enqueued_total", { service: "automation", channel: input.channel });
          const stats = await options.persistence.getScheduledQueueStats();
          options.metrics.set("scheduled_notifications_pending", stats.pending, { service: "automation" });
          return;
        }
        await dispatchNow(input);
      },
      async flushDueScheduled(limit: number): Promise<void> {
        const due = await options.persistence.claimDueScheduledNotifications(new Date().toISOString(), limit);
        for (const record of due) {
          try {
            await dispatchNow(record);
            await options.persistence.markScheduledNotificationSent(record.id);
            options.metrics.inc("scheduled_notifications_sent_total", { service: "automation", channel: record.channel });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await options.persistence.markScheduledNotificationFailed(record.id, message);
            options.metrics.inc("scheduled_notifications_failed_total", { service: "automation", channel: record.channel });
            logger.error?.({ id: record.id, error: message }, "scheduled notification failed");
          }
        }
        const stats = await options.persistence.getScheduledQueueStats();
        options.metrics.set("scheduled_notifications_pending", stats.pending, { service: "automation" });
      },
      async queueStats(): Promise<{ pending: number; sent: number; failed: number }> {
        return options.persistence.getScheduledQueueStats();
      }
    };
  }

  return {
    async send(input: NotificationPayload): Promise<void> {
      if (input.scheduleAt && Date.parse(input.scheduleAt) > Date.now()) {
        await options.persistence.enqueueScheduledNotification(queueRecordFrom(input));
        options.metrics.inc("scheduled_notifications_enqueued_total", { service: "automation", channel: input.channel });
        const stats = await options.persistence.getScheduledQueueStats();
        options.metrics.set("scheduled_notifications_pending", stats.pending, { service: "automation" });
        return;
      }
      await dispatchNow(input);
    },
    async flushDueScheduled(limit: number): Promise<void> {
      const due = await options.persistence.claimDueScheduledNotifications(new Date().toISOString(), limit);
      for (const record of due) {
        try {
          await dispatchNow(record);
          await options.persistence.markScheduledNotificationSent(record.id);
          options.metrics.inc("scheduled_notifications_sent_total", { service: "automation", channel: record.channel });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await options.persistence.markScheduledNotificationFailed(record.id, message);
          options.metrics.inc("scheduled_notifications_failed_total", { service: "automation", channel: record.channel });
          logger.error?.({ id: record.id, error: message }, "scheduled notification failed");
        }
      }
      const stats = await options.persistence.getScheduledQueueStats();
      options.metrics.set("scheduled_notifications_pending", stats.pending, { service: "automation" });
    },
    async queueStats(): Promise<{ pending: number; sent: number; failed: number }> {
      return options.persistence.getScheduledQueueStats();
    }
  };
}
