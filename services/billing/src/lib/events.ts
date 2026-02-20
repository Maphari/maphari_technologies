import { EventTopics } from "@maphari/platform";
import { randomUUID } from "node:crypto";
import { eventBus } from "./infrastructure.js";

export type BillingEventTopic =
  | (typeof EventTopics)["invoiceIssued"]
  | (typeof EventTopics)["invoicePaid"]
  | (typeof EventTopics)["invoiceOverdue"];

interface PublishBillingEventInput {
  topic: BillingEventTopic;
  clientId: string;
  requestId?: string;
  traceId?: string;
  payload: Record<string, unknown>;
}

/**
 * Keeps billing event envelope consistent across routes so downstream
 * automation can rely on stable metadata fields.
 */
export async function publishBillingEvent(input: PublishBillingEventInput): Promise<void> {
  await eventBus.publish({
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    requestId: input.requestId,
    traceId: input.traceId,
    clientId: input.clientId,
    topic: input.topic,
    payload: input.payload
  });
}
