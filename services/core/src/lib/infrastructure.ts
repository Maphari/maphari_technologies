import { NatsEventBus, RedisCache } from "@maphari/platform";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const natsUrl = process.env.NATS_URL ?? "nats://localhost:4222";

export const cache = new RedisCache(redisUrl, console);
export const eventBus = new NatsEventBus(natsUrl, console);

export const CacheKeys = {
  clients: (clientId?: string) => `core:clients:${clientId ?? "all"}`,
  projects: (clientId?: string) => `core:projects:${clientId ?? "all"}`,
  leads: (clientId?: string) => `core:leads:${clientId ?? "all"}`
};
