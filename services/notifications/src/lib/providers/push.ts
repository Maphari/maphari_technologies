// ════════════════════════════════════════════════════════════════════════════
// push.ts — Firebase Cloud Messaging (FCM) push notification provider
// Uses the legacy FCM HTTP v1 API with a server key.
// If FCM_SERVER_KEY is not set, logs a warning and skips gracefully (dev mode).
// ════════════════════════════════════════════════════════════════════════════

export interface SendPushResult {
  success: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
}

interface FcmResponse {
  multicast_id?: number;
  success?: number;
  failure?: number;
  results?: Array<{ message_id?: string; error?: string }>;
  message_id?: string;
  error?: string;
}

/**
 * Sends a push notification via Firebase Cloud Messaging.
 *
 * @param to      - FCM device registration token
 * @param title   - Notification title
 * @param body    - Notification body text
 * @param data    - Optional key-value data payload
 */
export async function sendPush(
  to: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<SendPushResult> {
  const key = process.env.FCM_SERVER_KEY;

  if (!key || key.startsWith("replace_") || key.trim().length === 0) {
    console.warn("[push] FCM_SERVER_KEY not configured — skipping push notification");
    return { success: true, skipped: true };
  }

  if (!to || to.trim().length === 0) {
    console.warn("[push] No device token provided — skipping push notification");
    return { success: true, skipped: true };
  }

  const payload = {
    to,
    notification: { title, body },
    data: data ?? {},
    priority: "high",
  };

  try {
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${key}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[push] FCM HTTP error ${res.status}:`, text);
      return { success: false, error: `FCM error ${res.status}: ${text}` };
    }

    const json = (await res.json()) as FcmResponse;

    // Batch response: { success, failure, results[] }
    if (json.success === 0 && json.failure === 1) {
      const errorMsg = json.results?.[0]?.error ?? "FCM delivery failed";
      console.error("[push] FCM delivery failure:", errorMsg);
      return { success: false, error: errorMsg };
    }

    const messageId =
      json.message_id ?? json.results?.[0]?.message_id ?? "sent";

    return { success: true, messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown push error";
    console.error("[push] FCM fetch error:", msg);
    return { success: false, error: msg };
  }
}
