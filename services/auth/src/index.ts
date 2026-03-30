import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAuthApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { readAuthConfig } from "./lib/config.js";
import { validateRequiredEnv } from "./lib/validate-env.js";
import { NatsEventBus } from "@maphari/platform";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

validateRequiredEnv([
  "JWT_ACCESS_SECRET",
  "REDIS_URL",
  "ADMIN_LOGIN_PASSWORD",
  "STAFF_LOGIN_PASSWORD",
]);

const config = readAuthConfig();
const eventBus = new NatsEventBus(config.natsUrl, console);
const app = await createAuthApp(config, { eventBus });

app
  .listen({ port: config.port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Auth service listening on :${config.port}`);
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
