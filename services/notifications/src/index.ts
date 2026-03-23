import { createNotificationsApp } from "./app.js";
import { NatsEventBus } from "@maphari/platform";
import { createNotificationEventHandler, registerNotificationSubscriptions } from "./lib/subscriptions.js";
import { processNextJob } from "./lib/queue.js";
import { prisma } from "./lib/prisma.js";

const app = await createNotificationsApp();
const eventBus = new NatsEventBus(process.env.NATS_URL ?? "nats://localhost:4222", app.log);
const metrics = app.serviceMetrics;
if (metrics) {
  const handleEvent = createNotificationEventHandler(metrics, app.log);
  await registerNotificationSubscriptions(eventBus, handleEvent);
}
const port = Number(process.env.PORT ?? 4009);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Notifications service listening on :${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });

// ── Background queue processor ────────────────────────────────────────────────
// Drain the notification queue every 5 seconds. Runs up to 10 jobs per tick to
// keep latency low without hammering the DB under normal load.
const POLL_INTERVAL_MS = Number(process.env.NOTIFICATION_POLL_INTERVAL_MS ?? 5_000);
const MAX_JOBS_PER_TICK = Number(process.env.NOTIFICATION_MAX_JOBS_PER_TICK ?? 10);

async function drainQueue(): Promise<void> {
  for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
    try {
      const job = await processNextJob();
      if (!job) break; // no more ready jobs
    } catch (err) {
      app.log.error({ err }, "notification queue drain error");
      break;
    }
  }
}

const pollTimer = setInterval(() => { void drainQueue(); }, POLL_INTERVAL_MS);

async function shutdown(): Promise<void> {
  clearInterval(pollTimer);
  await eventBus.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
