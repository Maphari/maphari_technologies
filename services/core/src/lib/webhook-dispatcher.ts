// ── webhook-dispatcher.ts — fire outbound webhooks for platform events ────────
import { prisma } from "./prisma.js";

export interface WebhookEventPayload {
  event:        string;   // e.g. "project.created"
  resourceType: string;
  resourceId:   string | null;
  data:         unknown;
  timestamp:    string;
}

export function dispatchWebhooks(payload: WebhookEventPayload): void {
  (async () => {
    try {
      const endpoints = await prisma.webhookEndpoint.findMany({
        where: { active: true },
      });

      // Filter endpoints that subscribe to this event
      const matching = endpoints.filter((ep) =>
        ep.events.split(",").map((e) => e.trim()).includes(payload.event)
      );

      for (const endpoint of matching) {
        fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(endpoint.secret ? { "X-Maphari-Signature": endpoint.secret } : {}),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10_000),
        }).catch((err) => {
          console.error(`[webhook] Failed to dispatch to ${endpoint.url}:`, err);
        });
      }
    } catch (err) {
      console.error("[webhook] Failed to fetch webhook endpoints:", err);
    }
  })();
}
