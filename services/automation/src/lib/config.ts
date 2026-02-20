type IntegrationProvider = "noop" | "webhook";

interface IntegrationConfig {
  provider: IntegrationProvider;
  webhookUrl?: string;
  apiKey?: string;
}

export interface AutomationConfig {
  port: number;
  natsUrl: string;
  redisEnabled: boolean;
  redisUrl: string;
  persistenceNamespace: string;
  idempotencyTtlSeconds: number;
  jobTtlSeconds: number;
  maxJobHistory: number;
  maxRetries: number;
  retryInitialDelayMs: number;
  schedulerIntervalMs: number;
  schedulerBatchSize: number;
  strictSecrets: boolean;
  webhookSigningSecret?: string;
  notifications: IntegrationConfig;
  crm: IntegrationConfig;
}

function readNumber(env: NodeJS.ProcessEnv, key: string, fallback: number, min = 0): number {
  const raw = env[key];
  const parsed = raw ? Number(raw) : fallback;
  if (!Number.isFinite(parsed) || parsed < min) {
    throw new Error(`Invalid ${key}. Expected a number >= ${min}.`);
  }
  return parsed;
}

function readProvider(raw: string | undefined): IntegrationProvider {
  if (!raw || raw === "noop") return "noop";
  if (raw === "webhook") return "webhook";
  throw new Error(`Invalid provider "${raw}". Supported: noop, webhook.`);
}

function readBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (!raw) return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new Error(`Invalid boolean value "${raw}". Use "true" or "false".`);
}

function ensureValidWebhookUrl(name: string, value: string | undefined, errors: string[]): void {
  if (!value) {
    errors.push(`${name} is required when provider=webhook.`);
    return;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      errors.push(`${name} must use http or https protocol.`);
    }
  } catch {
    errors.push(`${name} must be a valid URL.`);
  }
}

export function readAutomationConfig(env: NodeJS.ProcessEnv = process.env): AutomationConfig {
  const config: AutomationConfig = {
    port: readNumber(env, "PORT", 4003, 1),
    natsUrl: env.NATS_URL ?? "nats://localhost:4222",
    redisEnabled: readBoolean(env.AUTOMATION_REDIS_ENABLED, true),
    redisUrl: env.REDIS_URL ?? "redis://localhost:6379",
    persistenceNamespace: env.AUTOMATION_PERSISTENCE_NAMESPACE ?? "automation",
    idempotencyTtlSeconds: readNumber(env, "AUTOMATION_IDEMPOTENCY_TTL_SECONDS", 7 * 24 * 60 * 60, 60),
    jobTtlSeconds: readNumber(env, "AUTOMATION_JOB_TTL_SECONDS", 30 * 24 * 60 * 60, 60),
    maxJobHistory: readNumber(env, "AUTOMATION_MAX_JOB_HISTORY", 1000, 100),
    maxRetries: readNumber(env, "AUTOMATION_MAX_RETRIES", 3, 1),
    retryInitialDelayMs: readNumber(env, "AUTOMATION_RETRY_INITIAL_DELAY_MS", 250, 0),
    schedulerIntervalMs: readNumber(env, "AUTOMATION_SCHEDULER_INTERVAL_MS", 5000, 250),
    schedulerBatchSize: readNumber(env, "AUTOMATION_SCHEDULER_BATCH_SIZE", 50, 1),
    strictSecrets: readBoolean(env.AUTOMATION_STRICT_SECRETS, false),
    webhookSigningSecret: env.AUTOMATION_WEBHOOK_SIGNING_SECRET,
    notifications: {
      provider: readProvider(env.AUTOMATION_NOTIFICATIONS_PROVIDER),
      webhookUrl: env.AUTOMATION_NOTIFICATIONS_WEBHOOK_URL,
      apiKey: env.AUTOMATION_NOTIFICATIONS_API_KEY
    },
    crm: {
      provider: readProvider(env.AUTOMATION_CRM_PROVIDER),
      webhookUrl: env.AUTOMATION_CRM_WEBHOOK_URL,
      apiKey: env.AUTOMATION_CRM_API_KEY
    }
  };

  const errors: string[] = [];

  if (!config.natsUrl.startsWith("nats://")) {
    errors.push("NATS_URL must start with nats://");
  }
  if (config.redisEnabled && !config.redisUrl.startsWith("redis://") && !config.redisUrl.startsWith("rediss://")) {
    errors.push("REDIS_URL must start with redis:// or rediss:// when Redis persistence is enabled.");
  }
  if (config.strictSecrets && !config.webhookSigningSecret) {
    errors.push("AUTOMATION_WEBHOOK_SIGNING_SECRET is required when strict secrets mode is enabled.");
  }

  if (config.notifications.provider === "webhook") {
    ensureValidWebhookUrl("AUTOMATION_NOTIFICATIONS_WEBHOOK_URL", config.notifications.webhookUrl, errors);
    if (config.strictSecrets && !config.notifications.apiKey) {
      errors.push("AUTOMATION_NOTIFICATIONS_API_KEY is required when strict secrets mode is enabled.");
    }
  }

  if (config.crm.provider === "webhook") {
    ensureValidWebhookUrl("AUTOMATION_CRM_WEBHOOK_URL", config.crm.webhookUrl, errors);
    if (config.strictSecrets && !config.crm.apiKey) {
      errors.push("AUTOMATION_CRM_API_KEY is required when strict secrets mode is enabled.");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid automation configuration:\n- ${errors.join("\n- ")}`);
  }

  return config;
}
