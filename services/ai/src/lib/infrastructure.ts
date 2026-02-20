import { NatsEventBus } from "@maphari/platform";

const natsUrl = process.env.NATS_URL ?? "nats://localhost:4222";
export const eventBus = new NatsEventBus(natsUrl, console);
