// ════════════════════════════════════════════════════════════════════════════
// send-email.ts — Lightweight email helper for standalone scripts
//
// Uses the Resend REST API directly via native fetch so that the ai service
// does not need to depend on the resend npm package.
// ════════════════════════════════════════════════════════════════════════════

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(text: string): string {
  const body = text
    .split("\n")
    .map((line) =>
      line.trim().length === 0
        ? "<br/>"
        : `<p style="margin:0 0 8px;font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a">${escapeHtml(line)}</p>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff;padding:32px 16px;max-width:600px;margin:auto">
  ${body}
  <hr style="margin:32px 0;border:none;border-top:1px solid #e5e5e5"/>
  <p style="font-size:12px;color:#999;margin:0">
    This email was sent by Maphari. Questions? Contact
    <a href="mailto:support@maphari.com" style="color:#8b6fff">support@maphari.com</a>.
  </p>
</body>
</html>`;
}

/**
 * Send a transactional email via Resend REST API.
 * Returns { skipped: true } in dev when RESEND_API_KEY is not set.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.startsWith("re_replace") || apiKey.trim().length === 0) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, error: "RESEND_API_KEY is not configured" };
    }
    // Dev: skip silently
    return { success: true, skipped: true };
  }

  const from = process.env.NOTIFICATION_FROM_EMAIL ?? "Maphari <notifications@maphari.com>";
  const to   = Array.isArray(options.to) ? options.to : [options.to];

  const payload = {
    from,
    to,
    subject: options.subject,
    text: options.text,
    html: buildHtml(options.text),
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    const json = (await res.json()) as { id?: string; name?: string; message?: string };

    if (!res.ok) {
      return { success: false, error: json.message ?? `HTTP ${res.status}` };
    }

    return { success: true, id: json.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Resolve admin emails from the ADMIN_EMAILS environment variable.
 * Returns an empty array if not set.
 */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}
