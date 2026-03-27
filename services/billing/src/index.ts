import { createBillingApp } from "./app.js";
import { dispatchScheduledInvoiceReminders } from "./lib/invoice-reminders.js";
import { prisma } from "./lib/prisma.js";
import { cache, eventBus } from "./lib/infrastructure.js";

const app = await createBillingApp();
const port = Number(process.env.PORT ?? 4006);
const reminderSweepIntervalMs = Number(process.env.INVOICE_REMINDER_SWEEP_MS ?? 300_000);
const reminderSweepHandle = setInterval(() => {
  void dispatchScheduledInvoiceReminders(app.log);
}, reminderSweepIntervalMs);

void dispatchScheduledInvoiceReminders(app.log);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Billing service listening on :${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });

async function shutdown(): Promise<void> {
  clearInterval(reminderSweepHandle);
  await eventBus.close();
  await cache.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
