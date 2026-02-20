import { createAiApp } from "./app.js";
import { eventBus } from "./lib/infrastructure.js";

const app = await createAiApp();
const port = Number(process.env.PORT ?? 4007);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`AI service listening on :${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });

async function shutdown(): Promise<void> {
  await eventBus.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
