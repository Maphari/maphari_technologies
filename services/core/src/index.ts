import { createCoreApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { cache, eventBus } from "./lib/infrastructure.js";

const app = await createCoreApp();
const port = Number(process.env.PORT ?? 4002);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Core service listening on :${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });

async function shutdown(): Promise<void> {
  await eventBus.close();
  await cache.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
