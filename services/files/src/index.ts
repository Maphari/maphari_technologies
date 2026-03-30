import { createFilesApp } from "./app.js";
import { cache, eventBus } from "./lib/infrastructure.js";
import { prisma } from "./lib/prisma.js";
import { validateRequiredEnv } from "./lib/validate-env.js";

validateRequiredEnv(["UPLOAD_TOKEN_SECRET"]);

const app = await createFilesApp();
const port = Number(process.env.PORT ?? 4005);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Files service listening on :${port}`);
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
