import { validateRequiredEnv } from "./lib/validate-env.js";

validateRequiredEnv(["DATABASE_URL", "REDIS_URL", "API_KEY_ENCRYPTION_KEY"]);

import { createPublicApiApp } from "./app.js";
import { getRedis, closeRedis } from "./lib/redis.js";
import { prisma } from "./lib/prisma.js";

// Verify Redis is reachable before starting
try {
  await getRedis().ping();
} catch (err) {
  console.error("[startup] Redis connection failed:", err);
  process.exit(1);
}

const app = await createPublicApiApp();
const port = Number(process.env.PORT ?? 4010);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Public API service listening on :${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });

async function shutdown(): Promise<void> {
  await closeRedis();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
