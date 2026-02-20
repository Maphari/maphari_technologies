import {
  connect,
  JSONCodec,
  type NatsConnection,
  StringCodec,
  type Subscription
} from "nats";
import type { EventTopic } from "./topics.js";

export interface DomainEvent<TPayload = Record<string, unknown>> {
  eventId: string;
  occurredAt: string;
  requestId?: string;
  traceId?: string;
  clientId?: string;
  topic: EventTopic | string;
  payload: TPayload;
}

export class NatsEventBus {
  private readonly jsonCodec = JSONCodec<DomainEvent>();
  private readonly stringCodec = StringCodec();
  private connection: NatsConnection | null = null;

  constructor(private readonly servers: string, private readonly logger?: Pick<Console, "warn" | "error">) {}

  private async getConnection(): Promise<NatsConnection | null> {
    if (this.connection) {
      return this.connection;
    }

    try {
      this.connection = await connect({ servers: this.servers });
      return this.connection;
    } catch (error) {
      this.logger?.warn?.(`NATS unavailable (${this.servers}): ${String(error)}`);
      return null;
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    const connection = await this.getConnection();
    if (!connection) return;
    connection.publish(event.topic, this.jsonCodec.encode(event));
  }

  async subscribe(topic: string, handler: (event: DomainEvent) => Promise<void>): Promise<Subscription | null> {
    const connection = await this.getConnection();
    if (!connection) return null;

    const subscription = connection.subscribe(topic);

    (async () => {
      for await (const message of subscription) {
        try {
          const event = this.jsonCodec.decode(message.data);
          await handler(event);
        } catch (error) {
          const raw = this.stringCodec.decode(message.data);
          this.logger?.error?.(`Failed to process NATS message on ${topic}: ${String(error)} payload=${raw}`);
        }
      }
    })().catch((error) => {
      this.logger?.error?.(`NATS subscription loop error on ${topic}: ${String(error)}`);
    });

    return subscription;
  }

  async close(): Promise<void> {
    if (!this.connection) return;
    await this.connection.drain();
    this.connection = null;
  }
}
