import type { AnalyticsIngestEventInput } from "@maphari/contracts";
import { randomUUID } from "node:crypto";

export interface AnalyticsRecord {
  id: string;
  clientId: string;
  eventName: string;
  category: string | null;
  value: number | null;
  occurredAt: string;
  ingestedAt: string;
  properties: Record<string, string | number | boolean>;
}

const analyticsSchemaStore = new Map<string, AnalyticsRecord[]>();

export function saveAnalyticsEvent(input: AnalyticsIngestEventInput & { clientId: string }): AnalyticsRecord {
  const ingestedAt = new Date().toISOString();
  const record: AnalyticsRecord = {
    id: randomUUID(),
    clientId: input.clientId,
    eventName: input.eventName,
    category: input.category ?? null,
    value: input.value ?? null,
    occurredAt: input.occurredAt ?? ingestedAt,
    ingestedAt,
    properties: input.properties ?? {}
  };

  const current = analyticsSchemaStore.get(record.clientId) ?? [];
  current.push(record);
  analyticsSchemaStore.set(record.clientId, current);
  return record;
}

export function queryAnalyticsRecords(clientId?: string, eventName?: string): AnalyticsRecord[] {
  const allRecords = clientId
    ? (analyticsSchemaStore.get(clientId) ?? [])
    : Array.from(analyticsSchemaStore.values()).flat();

  return allRecords.filter((record) => (eventName ? record.eventName === eventName : true));
}

export function clearAnalyticsStore(): void {
  analyticsSchemaStore.clear();
}
