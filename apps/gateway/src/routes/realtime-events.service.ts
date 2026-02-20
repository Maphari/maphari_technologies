import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { EventTopics, NatsEventBus, type DomainEvent } from "@maphari/platform";
import { Observable, Subject } from "rxjs";
import { MetricsService } from "../observability/metrics.service.js";

type Subscribable = { unsubscribe: () => void };

export type RealtimeDomainEvent = {
  eventId: string;
  occurredAt: string;
  topic: string;
  clientId: string | null;
  payload: Record<string, unknown>;
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

@Injectable()
export class RealtimeEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly stream = new Subject<RealtimeDomainEvent>();
  private readonly subscriptions: Subscribable[] = [];
  private readonly eventBus = new NatsEventBus(process.env.NATS_URL ?? "nats://localhost:4222", console);

  constructor(private readonly metricsService: MetricsService) {}

  get events$(): Observable<RealtimeDomainEvent> {
    return this.stream.asObservable();
  }

  async onModuleInit(): Promise<void> {
    const topics = Array.from(new Set(Object.values(EventTopics)));
    await Promise.all(
      topics.map(async (topic) => {
        const subscription = await this.eventBus.subscribe(topic, async (event) => {
          const normalized = this.normalizeEvent(event);
          if (!normalized) {
            this.metricsService.incRealtimeEventDropped("invalid_event", topic);
            return;
          }
          this.metricsService.incRealtimeEventReceived(normalized.topic);
          this.stream.next(normalized);
        });
        if (subscription && typeof subscription.unsubscribe === "function") {
          this.subscriptions.push(subscription);
        }
      })
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.subscriptions.forEach((subscription) => {
      try {
        subscription.unsubscribe();
      } catch {
        // ignore unsubscribe race conditions during shutdown
      }
    });
    this.subscriptions.length = 0;
    this.stream.complete();
    await this.eventBus.close();
  }

  private normalizeEvent(event: DomainEvent): RealtimeDomainEvent | null {
    if (!event?.eventId || !event?.occurredAt || !event?.topic) {
      return null;
    }
    const payload = asObject(event.payload);
    const payloadClientId = typeof payload.clientId === "string" ? payload.clientId : null;
    return {
      eventId: event.eventId,
      occurredAt: event.occurredAt,
      topic: event.topic,
      clientId: event.clientId ?? payloadClientId,
      payload
    };
  }
}
