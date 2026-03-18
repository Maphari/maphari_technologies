import { NatsEventBus, RedisCache } from "@maphari/platform";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const natsUrl = process.env.NATS_URL ?? "nats://localhost:4222";

export const cache = new RedisCache(redisUrl, console);
export const eventBus = new NatsEventBus(natsUrl, console);

export const CacheKeys = {
  invoices:        (clientId?: string)  => `billing:invoices:${clientId ?? "all"}`,
  expenses:        ()                   => `billing:expenses:all`,
  expenseBudgets:  ()                   => `billing:expense-budgets:all`,
  vendors:         ()                   => `billing:vendors:all`,
  vendorContracts: (vendorId: string)   => `billing:vendor-contracts:${vendorId}`,
  loyaltyAll:      ()                   => `billing:loyalty:all`,
  loyalty:         (clientId: string)   => `billing:loyalty:${clientId}`,
  installments:    (invoiceId: string)  => `billing:installments:${invoiceId}`,
};
