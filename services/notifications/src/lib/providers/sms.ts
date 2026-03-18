/**
 * Twilio SMS + WhatsApp provider.
 *
 * Uses the Twilio REST API directly (no SDK dependency).
 * WhatsApp delivery is auto-detected: if the `to` field starts with "whatsapp:"
 * the message is sent via WhatsApp Business API; otherwise as a plain SMS.
 *
 * WhatsApp recipient format:  "whatsapp:+27821234567"
 * SMS recipient format:       "+27821234567"
 *
 * The same TWILIO_FROM_NUMBER is used for both channels.
 * When sending WhatsApp, the from is automatically prefixed with "whatsapp:".
 */

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
}

function isConfigured(): boolean {
  const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const token = process.env.TWILIO_AUTH_TOKEN ?? "";
  const from = process.env.TWILIO_FROM_NUMBER ?? "";

  // Real Twilio account SIDs are exactly "AC" + 32 hex chars (34 chars total)
  // Real auth tokens are 32 hex chars
  const sidValid = /^AC[0-9a-f]{32}$/i.test(sid);
  const tokenValid = token.length === 32 && !token.includes("replace");
  const fromValid = from.startsWith("+") && from.length >= 8;

  return sidValid && tokenValid && fromValid;
}

/**
 * Sends an SMS or WhatsApp message via the Twilio Messaging REST API.
 *
 * Returns { skipped: true } when Twilio credentials are not configured so that
 * development environments without real credentials do not fail jobs.
 */
export async function sendSms(options: {
  to: string;
  body: string;
}): Promise<SendSmsResult> {
  if (!isConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, error: "Twilio credentials are not configured" };
    }
    return { success: true, skipped: true };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
  const authToken = process.env.TWILIO_AUTH_TOKEN as string;
  const fromNumber = process.env.TWILIO_FROM_NUMBER as string;

  const isWhatsApp = options.to.startsWith("whatsapp:");
  const from = isWhatsApp ? `whatsapp:${fromNumber}` : fromNumber;

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const payload = new URLSearchParams({
    From: from,
    To: options.to,
    Body: options.body
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: payload.toString(),
      signal: AbortSignal.timeout(10_000)
    });

    const data = (await response.json()) as { sid?: string; message?: string; code?: number };

    if (!response.ok) {
      const errMsg = data.message ?? `Twilio HTTP ${response.status}`;
      return { success: false, error: `[${data.code ?? response.status}] ${errMsg}` };
    }

    return { success: true, messageId: data.sid };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SMS delivery error";
    return { success: false, error: message };
  }
}
