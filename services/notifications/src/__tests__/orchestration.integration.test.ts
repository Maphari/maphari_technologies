import { beforeEach, describe, expect, it } from "vitest";
import { signWebhookPayload } from "@maphari/platform";
import { createNotificationsApp } from "../app.js";
import { clearCallbackRateLimitState } from "../lib/callback-rate-limit.js";
import { clearNotificationQueue } from "../lib/queue.js";

describe("notifications orchestration integration", () => {
  beforeEach(async () => {
    await clearNotificationQueue();
    clearCallbackRateLimitState();
    process.env.NOTIFICATION_CALLBACK_SECRET = "test-callback-secret";
  });

  it("processes queued jobs and tracks status", async () => {
    const app = await createNotificationsApp();

    const enqueue = await app.inject({
      method: "POST",
      url: "/notifications/jobs",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440910"
      },
      payload: {
        channel: "EMAIL",
        recipient: "alice@example.com",
        message: "Welcome"
      }
    });

    expect(enqueue.statusCode).toBe(200);

    const processResponse = await app.inject({
      method: "POST",
      url: "/notifications/process"
    });

    expect(processResponse.statusCode).toBe(200);
    expect(processResponse.json().data.job.status).toBe("SENT");
    await app.close();
  });

  it("verifies callback signature and updates delivery status", async () => {
    const app = await createNotificationsApp();

    const enqueue = await app.inject({
      method: "POST",
      url: "/notifications/jobs",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440911"
      },
      payload: {
        channel: "SMS",
        recipient: "+27110000000",
        message: "Status update"
      }
    });

    const externalId = enqueue.json().data.id as string;
    const callbackPayload = {
      provider: "twilio",
      externalId,
      status: "delivered"
    };

    const signature = signWebhookPayload(JSON.stringify(callbackPayload), process.env.NOTIFICATION_CALLBACK_SECRET!);

    const callback = await app.inject({
      method: "POST",
      url: "/notifications/provider-callback",
      headers: {
        "x-provider-name": "twilio",
        "x-provider-signature": signature
      },
      payload: callbackPayload
    });

    expect(callback.statusCode).toBe(200);
    expect(callback.json().data.status).toBe("SENT");
    await app.close();
  });
});
