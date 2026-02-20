import { EventTopics, type DomainEvent } from "@maphari/platform";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { clearNotificationQueue, listJobs } from "../lib/queue.js";
import {
  createNotificationEventHandler,
  notificationTopics,
  registerNotificationSubscriptions
} from "../lib/subscriptions.js";

class FakeEventBus {
  handlers = new Map<string, (event: DomainEvent) => Promise<void>>();

  async subscribe(topic: string, handler: (event: DomainEvent) => Promise<void>): Promise<null> {
    this.handlers.set(topic, handler);
    return null;
  }
}

describe("notifications event subscription integration", () => {
  beforeEach(async () => {
    await clearNotificationQueue();
  });

  it("registers topic subscriptions and enqueues notification jobs from domain events", async () => {
    const eventBus = new FakeEventBus();
    const metrics = { inc: vi.fn(), set: vi.fn() };
    const logger = { info: vi.fn() };
    const handler = createNotificationEventHandler(metrics, logger);

    await registerNotificationSubscriptions(eventBus, handler);

    expect(notificationTopics).toContain(EventTopics.leadCreated);
    expect(notificationTopics).toContain(EventTopics.messageCreated);
    expect(notificationTopics).toContain(EventTopics.invoiceOverdue);

    const topicHandler = eventBus.handlers.get(EventTopics.invoiceOverdue);
    await topicHandler?.({
      eventId: "event-1",
      occurredAt: "2026-02-17T00:00:00.000Z",
      requestId: "request-1",
      clientId: "550e8400-e29b-41d4-a716-446655440333",
      topic: EventTopics.invoiceOverdue,
      payload: {
        invoiceId: "inv-1"
      }
    });

    await expect(listJobs("550e8400-e29b-41d4-a716-446655440333")).resolves.toHaveLength(1);
    expect(metrics.inc).toHaveBeenCalledWith(
      "events_received_total",
      expect.objectContaining({ service: "notifications", topic: EventTopics.invoiceOverdue })
    );
    expect(logger.info).toHaveBeenCalled();
  });
});
