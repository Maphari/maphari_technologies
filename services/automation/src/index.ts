import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { NatsEventBus } from "@maphari/platform";
import { createAutomationRuntime } from "./app.js";
import type { AutomationJobRecord } from "./lib/subscriptions.js";
import { createAutomationAdapters } from "./lib/adapters/index.js";
import { readAutomationConfig } from "./lib/config.js";
import { createAutomationPersistence } from "./lib/persistence.js";
import { createAutomationEventHandler, registerAutomationSubscriptions } from "./lib/subscriptions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

const config = readAutomationConfig();
let listJobs: () => Promise<AutomationJobRecord[]> = async () => [];
let listDeadLetters: () => Promise<AutomationJobRecord[]> = async () => [];
let getJobById: (jobId: string) => Promise<AutomationJobRecord | null> = async () => null;
let getRuntimeStats: () => Promise<Record<string, unknown>> = async () => ({});
const { app, metrics } = createAutomationRuntime({
  listJobs: () => listJobs(),
  listDeadLetters: () => listDeadLetters(),
  getJobById: (jobId) => getJobById(jobId),
  getRuntimeStats: () => getRuntimeStats()
});
const persistence = createAutomationPersistence(config, app.log);
const persistedJobs = await persistence.listJobs();
const adapters = createAutomationAdapters(config, app.log, { persistence, metrics });
const handleEvent = createAutomationEventHandler(metrics, app.log, {
  maxRetries: config.maxRetries,
  initialRetryDelayMs: config.retryInitialDelayMs,
  adapters,
  persistence,
  initialAuditLog: persistedJobs
});
listJobs = async () => {
  const jobs = await persistence.listJobs();
  return jobs.length > 0 ? jobs : handleEvent.getAuditLog();
};
listDeadLetters = async () => {
  const jobs = await persistence.listDeadLetters();
  return jobs.length > 0 ? jobs : handleEvent.getDeadLetters();
};
getJobById = async (jobId: string) => {
  const persisted = await persistence.getJob(jobId);
  if (persisted) return persisted;
  return handleEvent.getAuditLog().find((record) => record.jobId === jobId) ?? null;
};
let schedulerRunning = false;
const schedulerInterval = setInterval(async () => {
  if (schedulerRunning) return;
  schedulerRunning = true;
  try {
    await adapters.notifications.flushDueScheduled(config.schedulerBatchSize);
  } catch (error) {
    app.log.error({ error: String(error) }, "scheduled notification worker cycle failed");
  } finally {
    schedulerRunning = false;
  }
}, config.schedulerIntervalMs);
getRuntimeStats = async () => {
  const queue = await adapters.notifications.queueStats();
  return {
    scheduler: {
      intervalMs: config.schedulerIntervalMs,
      batchSize: config.schedulerBatchSize
    },
    notificationsQueue: queue
  };
};
const eventBus = new NatsEventBus(config.natsUrl, app.log);
await registerAutomationSubscriptions(eventBus, handleEvent);

app
  .listen({ port: config.port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(
      {
        port: config.port,
        notificationsProvider: config.notifications.provider,
        crmProvider: config.crm.provider
      },
      `Automation service listening on :${config.port}`
    );
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });

async function shutdown(): Promise<void> {
  clearInterval(schedulerInterval);
  await eventBus.close();
  await persistence.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
