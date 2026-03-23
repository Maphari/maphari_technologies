// ── webhook-dispatcher.ts — fire outbound webhooks for platform events ────────
import { createHmac } from "node:crypto";
import { prisma } from "./prisma.js";

export interface WebhookEventPayload {
  event:        string;   // e.g. "project.created"
  resourceType: string;
  resourceId:   string | null;
  data:         unknown;
  timestamp:    string;
}

function signPayload(secret: string, body: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

export function dispatchWebhooks(payload: WebhookEventPayload): void {
  (async () => {
    try {
      const endpoints = await prisma.webhookEndpoint.findMany({
        where: { active: true },
        take: 100,
      });
      if (endpoints.length === 100) {
        console.warn("[webhook] Endpoint list truncated at 100 — consider deactivating unused endpoints");
      }

      // Filter endpoints that subscribe to this event
      const matching = endpoints.filter((ep) =>
        ep.events.split(",").map((e) => e.trim()).includes(payload.event)
      );

      const bodyStr = JSON.stringify(payload);

      for (const endpoint of matching) {
        fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(endpoint.secret ? { "X-Maphari-Signature": signPayload(endpoint.secret, bodyStr) } : {}),
          },
          body: bodyStr,
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
