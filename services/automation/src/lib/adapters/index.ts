import type { AutomationConfig } from "../config.js";
import type { AutomationPersistence } from "../persistence.js";
import { createCrmAdapter, type CrmAdapter } from "./crm.js";
import { createNotificationAdapter, type NotificationAdapter } from "./notifications.js";

interface LoggerLike {
  info(payload: Record<string, unknown>, message: string): void;
  error?(payload: Record<string, unknown>, message: string): void;
}

interface MetricsLike {
  inc(name: string, labels?: Record<string, string | number>): void;
  set(name: string, value: number, labels?: Record<string, string | number>): void;
}

export interface AutomationAdapters {
  notifications: NotificationAdapter;
  crm: CrmAdapter;
}

export function createAutomationAdapters(
  config: AutomationConfig,
  logger: LoggerLike,
  options: { persistence: AutomationPersistence; metrics: MetricsLike }
): AutomationAdapters {
  return {
    notifications: createNotificationAdapter(
      {
        ...config.notifications,
        signingSecret: config.webhookSigningSecret
      },
      logger,
      options
    ),
    crm: createCrmAdapter(
      {
        ...config.crm,
        signingSecret: config.webhookSigningSecret
      },
      logger
    )
  };
}
