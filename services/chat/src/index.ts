import { createChatRuntime } from "./app.js";
import { cache, eventBus } from "./lib/infrastructure.js";
import { prisma } from "./lib/prisma.js";
import { createRealtimeGateway, type RealtimeGateway } from "./lib/realtime.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
let realtimeGateway: RealtimeGateway | null = null;

const { app, metrics } = await createChatRuntime({
  broadcastRealtimeMessage: async (payload) => {
    await realtimeGateway?.emitMessageCreated(payload);
  }
});
const port = Number(process.env.PORT ?? 4004);

realtimeGateway = await createRealtimeGateway({
  server: app.server,
  metrics,
  redisUrl,
  resolveConversationClientId: async (conversationId) => {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { clientId: true }
    });
    return conversation?.clientId ?? null;
  },
  logger: app.log
});

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Chat service listening on :${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });

async function shutdown(): Promise<void> {
  await realtimeGateway?.close();
  await eventBus.close();
  await cache.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
