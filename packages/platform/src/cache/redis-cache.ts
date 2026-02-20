import { Redis } from "ioredis";

type RedisClient = InstanceType<typeof Redis>;

export class RedisCache {
  private client: RedisClient | null = null;
  private connectPromise: Promise<void> | null = null;

  constructor(private readonly url: string, private readonly logger?: Pick<Console, "warn" | "error">) {}

  private getClient(): RedisClient {
    if (!this.client) {
      this.client = new Redis(this.url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false
      });
      this.client.on("error", (error) => {
        this.logger?.warn?.(`Redis connection error (${this.url}): ${String(error)}`);
      });
    }

    return this.client;
  }

  private async ensureConnected(): Promise<RedisClient | null> {
    const client = this.getClient();

    if (client.status === "ready") {
      return client;
    }

    if (client.status === "connecting" && this.connectPromise) {
      await this.connectPromise.catch(() => undefined);
      return (client.status as string) === "ready" ? client : null;
    }

    try {
      this.connectPromise = client.connect();
      await this.connectPromise;
      this.connectPromise = null;
      return client;
    } catch (error) {
      this.connectPromise = null;
      this.logger?.warn?.(`Redis unavailable (${this.url}): ${String(error)}`);
      return null;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const client = await this.ensureConnected();
    if (!client) return null;

    const value = await client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const client = await this.ensureConnected();
    if (!client) return;
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    const client = await this.ensureConnected();
    if (!client) return;
    await client.del(key);
  }

  async close(): Promise<void> {
    if (!this.client) return;
    await this.client.quit();
    this.client = null;
  }
}
