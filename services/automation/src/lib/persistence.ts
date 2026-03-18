import { RedisCache } from "@maphari/platform";
import type { AutomationConfig } from "./config.js";
import type { AutomationJobRecord } from "./subscriptions.js";

interface LoggerLike {
  warn?(message: string): void;
  error?(message: string): void;
}

export interface AutomationPersistence {
  hasProcessedEvent(eventId: string): Promise<boolean>;
  markProcessedEvent(eventId: string): Promise<void>;
  saveJob(record: AutomationJobRecord): Promise<void>;
  getJob(jobId: string): Promise<AutomationJobRecord | null>;
  listJobs(): Promise<AutomationJobRecord[]>;
  listDeadLetters(): Promise<AutomationJobRecord[]>;
  acknowledgeDeadLetters(): Promise<number>;
  requeueFailed(): Promise<number>;
  enqueueScheduledNotification(record: ScheduledNotificationRecord): Promise<void>;
  claimDueScheduledNotifications(nowIso: string, limit: number): Promise<ScheduledNotificationRecord[]>;
  markScheduledNotificationSent(id: string): Promise<void>;
  markScheduledNotificationFailed(id: string, error: string): Promise<void>;
  getScheduledQueueStats(): Promise<{ pending: number; sent: number; failed: number }>;
  close(): Promise<void>;
}

export interface ScheduledNotificationRecord {
  id: string;
  eventId: string;
  channel: "email" | "whatsapp" | "internal";
  template: string;
  payload: unknown;
  scheduleAt: string;
  createdAt: string;
  status: "pending" | "processing" | "sent" | "failed";
  lastError?: string;
}

interface RedisPersistenceOptions {
  redisUrl: string;
  namespace: string;
  idempotencyTtlSeconds: number;
  jobTtlSeconds: number;
  maxJobHistory: number;
}

class RedisAutomationPersistence implements AutomationPersistence {
  private readonly cache: RedisCache;
  private readonly options: RedisPersistenceOptions;

  constructor(options: RedisPersistenceOptions, logger?: LoggerLike) {
    this.options = options;
    const redisLogger = logger
      ? {
          warn: (...args: unknown[]) => logger.warn?.(args.map(String).join(" ")),
          error: (...args: unknown[]) => logger.error?.(args.map(String).join(" "))
        }
      : undefined;
    this.cache = new RedisCache(options.redisUrl, redisLogger);
  }

  async hasProcessedEvent(eventId: string): Promise<boolean> {
    const key = this.key("idempotency", eventId);
    const value = await this.cache.getJson<{ processed: boolean }>(key);
    return Boolean(value?.processed);
  }

  async markProcessedEvent(eventId: string): Promise<void> {
    const key = this.key("idempotency", eventId);
    await this.cache.setJson(key, { processed: true }, this.options.idempotencyTtlSeconds);
  }

  async saveJob(record: AutomationJobRecord): Promise<void> {
    const jobKey = this.key("job", record.jobId);
    await this.cache.setJson(jobKey, record, this.options.jobTtlSeconds);
    await this.pushIndexKey(this.key("jobs", "index"), record.jobId);

    if (record.status === "dead-lettered") {
      await this.pushIndexKey(this.key("deadletters", "index"), record.jobId);
    }
  }

  async getJob(jobId: string): Promise<AutomationJobRecord | null> {
    return this.cache.getJson<AutomationJobRecord>(this.key("job", jobId));
  }

  async listJobs(): Promise<AutomationJobRecord[]> {
    return this.listByIndex(this.key("jobs", "index"));
  }

  async listDeadLetters(): Promise<AutomationJobRecord[]> {
    const records = await this.listByIndex(this.key("deadletters", "index"));
    return records.filter((record) => record.status === "dead-lettered");
  }

  async acknowledgeDeadLetters(): Promise<number> {
    const records = await this.listDeadLetters();
    await Promise.all(
      records.map(async (record) => {
        const updated: AutomationJobRecord = { ...record, status: "acknowledged", updatedAt: new Date().toISOString() };
        await this.cache.setJson(this.key("job", record.jobId), updated, this.options.jobTtlSeconds);
      })
    );
    await this.cache.setJson(this.key("deadletters", "index"), [], this.options.jobTtlSeconds);
    return records.length;
  }

  async requeueFailed(): Promise<number> {
    const allJobs = await this.listJobs();
    const failing = allJobs.filter((j) => j.status === "failed" || j.status === "dead-lettered");
    await Promise.all(
      failing.map(async (record) => {
        const updated: AutomationJobRecord = { ...record, status: "acknowledged", updatedAt: new Date().toISOString() };
        await this.cache.setJson(this.key("job", record.jobId), updated, this.options.jobTtlSeconds);
      })
    );
    return failing.length;
  }

  async enqueueScheduledNotification(record: ScheduledNotificationRecord): Promise<void> {
    await this.cache.setJson(this.key("notify", record.id), record, this.options.jobTtlSeconds);
    await this.pushIndexKey(this.key("notify", "pending"), record.id);
  }

  async claimDueScheduledNotifications(nowIso: string, limit: number): Promise<ScheduledNotificationRecord[]> {
    const pendingIds = (await this.cache.getJson<string[]>(this.key("notify", "pending"))) ?? [];
    if (pendingIds.length === 0) return [];

    const now = Date.parse(nowIso);
    const claimed: ScheduledNotificationRecord[] = [];
    const nextPending: string[] = [];

    for (const id of pendingIds) {
      const record = await this.cache.getJson<ScheduledNotificationRecord>(this.key("notify", id));
      if (!record) continue;

      const due = Date.parse(record.scheduleAt) <= now;
      if (claimed.length < limit && record.status === "pending" && due) {
        const processing: ScheduledNotificationRecord = { ...record, status: "processing" };
        await this.cache.setJson(this.key("notify", id), processing, this.options.jobTtlSeconds);
        claimed.push(processing);
        continue;
      }

      if (record.status === "pending" || record.status === "processing") {
        nextPending.push(id);
      }
    }

    await this.cache.setJson(this.key("notify", "pending"), nextPending, this.options.jobTtlSeconds);
    return claimed;
  }

  async markScheduledNotificationSent(id: string): Promise<void> {
    const key = this.key("notify", id);
    const record = await this.cache.getJson<ScheduledNotificationRecord>(key);
    if (!record) return;
    await this.cache.setJson(key, { ...record, status: "sent", lastError: undefined }, this.options.jobTtlSeconds);
  }

  async markScheduledNotificationFailed(id: string, error: string): Promise<void> {
    const key = this.key("notify", id);
    const record = await this.cache.getJson<ScheduledNotificationRecord>(key);
    if (!record) return;
    await this.cache.setJson(key, { ...record, status: "failed", lastError: error }, this.options.jobTtlSeconds);
  }

  async getScheduledQueueStats(): Promise<{ pending: number; sent: number; failed: number }> {
    const pendingIds = (await this.cache.getJson<string[]>(this.key("notify", "pending"))) ?? [];
    let sent = 0;
    let failed = 0;
    for (const id of pendingIds) {
      const record = await this.cache.getJson<ScheduledNotificationRecord>(this.key("notify", id));
      if (!record) continue;
      if (record.status === "sent") sent += 1;
      if (record.status === "failed") failed += 1;
    }
    return { pending: pendingIds.length, sent, failed };
  }

  async close(): Promise<void> {
    await this.cache.close();
  }

  private key(scope: string, id: string): string {
    return `${this.options.namespace}:${scope}:${id}`;
  }

  private async pushIndexKey(indexKey: string, jobId: string): Promise<void> {
    const existing = (await this.cache.getJson<string[]>(indexKey)) ?? [];
    const deduped = [jobId, ...existing.filter((id) => id !== jobId)].slice(0, this.options.maxJobHistory);
    await this.cache.setJson(indexKey, deduped, this.options.jobTtlSeconds);
  }

  private async listByIndex(indexKey: string): Promise<AutomationJobRecord[]> {
    const jobIds = (await this.cache.getJson<string[]>(indexKey)) ?? [];
    if (jobIds.length === 0) return [];

    const records = await Promise.all(
      jobIds.map(async (jobId) => this.cache.getJson<AutomationJobRecord>(this.key("job", jobId)))
    );
    return records
      .filter((record): record is AutomationJobRecord => Boolean(record))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

class MemoryAutomationPersistence implements AutomationPersistence {
  private readonly processed = new Set<string>();
  private readonly jobs = new Map<string, AutomationJobRecord>();
  private readonly notifications = new Map<string, ScheduledNotificationRecord>();

  constructor(private readonly maxJobHistory: number) {}

  async hasProcessedEvent(eventId: string): Promise<boolean> {
    return this.processed.has(eventId);
  }

  async markProcessedEvent(eventId: string): Promise<void> {
    this.processed.add(eventId);
  }

  async saveJob(record: AutomationJobRecord): Promise<void> {
    this.jobs.set(record.jobId, record);
    if (this.jobs.size <= this.maxJobHistory) return;
    const entries = Array.from(this.jobs.entries()).sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt));
    const keep = new Set(entries.slice(0, this.maxJobHistory).map(([jobId]) => jobId));
    for (const jobId of this.jobs.keys()) {
      if (!keep.has(jobId)) this.jobs.delete(jobId);
    }
  }

  async getJob(jobId: string): Promise<AutomationJobRecord | null> {
    return this.jobs.get(jobId) ?? null;
  }

  async listJobs(): Promise<AutomationJobRecord[]> {
    return Array.from(this.jobs.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async listDeadLetters(): Promise<AutomationJobRecord[]> {
    return (await this.listJobs()).filter((record) => record.status === "dead-lettered");
  }

  async acknowledgeDeadLetters(): Promise<number> {
    const now = new Date().toISOString();
    let count = 0;
    for (const [jobId, record] of this.jobs.entries()) {
      if (record.status === "dead-lettered") {
        this.jobs.set(jobId, { ...record, status: "acknowledged", updatedAt: now });
        count++;
      }
    }
    return count;
  }

  async requeueFailed(): Promise<number> {
    const now = new Date().toISOString();
    let count = 0;
    for (const [jobId, record] of this.jobs.entries()) {
      if (record.status === "failed" || record.status === "dead-lettered") {
        this.jobs.set(jobId, { ...record, status: "acknowledged", updatedAt: now });
        count++;
      }
    }
    return count;
  }

  async enqueueScheduledNotification(record: ScheduledNotificationRecord): Promise<void> {
    this.notifications.set(record.id, record);
  }

  async claimDueScheduledNotifications(nowIso: string, limit: number): Promise<ScheduledNotificationRecord[]> {
    const now = Date.parse(nowIso);
    const due = Array.from(this.notifications.values())
      .filter((record) => record.status === "pending" && Date.parse(record.scheduleAt) <= now)
      .slice(0, limit)
      .map((record) => ({ ...record, status: "processing" as const }));

    for (const record of due) {
      this.notifications.set(record.id, record);
    }
    return due;
  }

  async markScheduledNotificationSent(id: string): Promise<void> {
    const record = this.notifications.get(id);
    if (!record) return;
    this.notifications.set(id, { ...record, status: "sent" });
  }

  async markScheduledNotificationFailed(id: string, error: string): Promise<void> {
    const record = this.notifications.get(id);
    if (!record) return;
    this.notifications.set(id, { ...record, status: "failed", lastError: error });
  }

  async getScheduledQueueStats(): Promise<{ pending: number; sent: number; failed: number }> {
    let pending = 0;
    let sent = 0;
    let failed = 0;
    for (const record of this.notifications.values()) {
      if (record.status === "pending" || record.status === "processing") pending += 1;
      if (record.status === "sent") sent += 1;
      if (record.status === "failed") failed += 1;
    }
    return { pending, sent, failed };
  }

  async close(): Promise<void> {
    return;
  }
}

export function createAutomationPersistence(config: AutomationConfig, logger?: LoggerLike): AutomationPersistence {
  if (config.redisEnabled) {
    return new RedisAutomationPersistence(
      {
        redisUrl: config.redisUrl,
        namespace: config.persistenceNamespace,
        idempotencyTtlSeconds: config.idempotencyTtlSeconds,
        jobTtlSeconds: config.jobTtlSeconds,
        maxJobHistory: config.maxJobHistory
      },
      logger
    );
  }

  return new MemoryAutomationPersistence(config.maxJobHistory);
}
