import { createNotificationsApp } from "./app.js";
import { NatsEventBus } from "@maphari/platform";
import { createNotificationEventHandler, registerNotificationSubscriptions } from "./lib/subscriptions.js";
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

async function shutdown(): Promise<void> {
  await eventBus.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
