import { Resend } from "resend";

let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith("re_replace") || apiKey.trim().length === 0) {
    return null;
  }
  if (!_resend) {
    _resend = new Resend(apiKey);
  }
  return _resend;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Sends a transactional email via Resend.
 *
 * Returns { skipped: true } when RESEND_API_KEY is not configured so that
 * development environments without a real key do not fail jobs — the queue
 * can treat skipped as a soft-success and mark the job SENT.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
}): Promise<SendEmailResult> {
  const client = getResendClient();

  // No API key configured — skip in dev, error in production
  if (!client) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, error: "RESEND_API_KEY is not configured" };
    }
    return { success: true, skipped: true };
  }

  const from = process.env.NOTIFICATION_FROM_EMAIL ?? "Maphari <notifications@maphari.com>";

  // Convert plain-text newlines to a simple HTML layout
  const htmlBody = options.text
    .split("\n")
    .map((line) => (line.trim().length === 0 ? "<br/>" : `<p style="margin:0 0 8px">${escapeHtml(line)}</p>`))
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff;padding:32px 16px;max-width:600px;margin:auto">
  ${htmlBody}
  <hr style="margin:32px 0;border:none;border-top:1px solid #e5e5e5"/>
  <p style="font-size:12px;color:#999;margin:0">
    This email was sent by Maphari. If you have questions, reply to this email or contact
    <a href="mailto:support@maphari.com" style="color:#8b6fff">support@maphari.com</a>.
  </p>
</body>
</html>`;

  try {
    const result = await client.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html,
      text: options.text
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email delivery error";
    return { success: false, error: message };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
