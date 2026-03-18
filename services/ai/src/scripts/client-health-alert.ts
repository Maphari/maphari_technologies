// ════════════════════════════════════════════════════════════════════════════
// client-health-alert.ts — Daily client health drop alert
//
// Runs daily at 09:00. Fetches all client health scores, identifies clients
// where the score dropped >15 points vs their previous reading, uses Claude
// to write an actionable alert email, and sends it to admin emails.
// Skips sending if no at-risk clients are found (no noise).
//
// Usage: npx tsx services/ai/src/scripts/client-health-alert.ts
// ════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { sendEmail, getAdminEmails } from "./lib/send-email.js";

// ── Types ──────────────────────────────────────────────────────────────────

interface HealthScoreRecord {
  id: string;
  clientId: string;
  score: number;
  trend?: string | null;
  sentiment?: string | null;
  overdueTasks?: number | null;
  unreadMessages?: number | null;
  milestoneDelayDays?: number | null;
  recordedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

interface AtRiskClient {
  clientId: string;
  currentScore: number;
  previousScore: number;
  drop: number;
  trend: string | null;
  overdueTasks: number;
  unreadMessages: number;
}

// ── Fetch all health scores ────────────────────────────────────────────────

async function fetchHealthScores(): Promise<HealthScoreRecord[]> {
  const coreUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
  try {
    const res = await fetch(`${coreUrl}/health-scores`, {
      headers: {
        "x-user-role": "ADMIN",
        "content-type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as ApiResponse<HealthScoreRecord[]>;
    if (!json.success || !json.data) throw new Error(json.error?.message ?? "No data");
    return json.data;
  } catch (err) {
    throw new Error(`Failed to fetch health scores: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Detect at-risk clients (drop > 15 points vs previous reading) ──────────

function detectAtRiskClients(scores: HealthScoreRecord[]): AtRiskClient[] {
  const byClient = new Map<string, HealthScoreRecord[]>();
  for (const score of scores) {
    const arr = byClient.get(score.clientId) ?? [];
    arr.push(score);
    byClient.set(score.clientId, arr);
  }

  const atRisk: AtRiskClient[] = [];

  for (const [clientId, records] of byClient) {
    if (records.length < 2) continue;

    records.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

    const current  = records[0]!;
    const previous = records[1]!;
    const drop     = previous.score - current.score;

    if (drop > 15) {
      atRisk.push({
        clientId,
        currentScore:  current.score,
        previousScore: previous.score,
        drop,
        trend:           current.trend ?? null,
        overdueTasks:   current.overdueTasks ?? 0,
        unreadMessages: current.unreadMessages ?? 0,
      });
    }
  }

  atRisk.sort((a, b) => b.drop - a.drop);
  return atRisk;
}

// ── Generate email body ────────────────────────────────────────────────────

async function generateEmailBody(clients: AtRiskClient[]): Promise<string> {
  const clientLines = clients
    .map((c) =>
      `  - Client ${c.clientId.slice(0, 8)}: score dropped ${c.drop} points (${c.previousScore} → ${c.currentScore})` +
      (c.overdueTasks > 0 ? ` | ${c.overdueTasks} overdue task${c.overdueTasks !== 1 ? "s" : ""}` : "") +
      (c.unreadMessages > 0 ? ` | ${c.unreadMessages} unread message${c.unreadMessages !== 1 ? "s" : ""}` : "")
    )
    .join("\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return [
      `Client Health Alert — ${clients.length} At-Risk Client${clients.length !== 1 ? "s" : ""}`,
      ``,
      `The following clients have had a health score drop of more than 15 points:`,
      ``,
      clientLines,
      ``,
      `Recommended action: Schedule check-in calls and address overdue tasks and unread messages immediately.`,
      ``,
      `This is an automated alert from Maphari.`,
    ].join("\n");
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = [
    `You are a client success manager writing an urgent health alert email for Maphari, a digital agency.`,
    ``,
    `The following clients have had a significant health score drop (>15 points) since their last assessment:`,
    ``,
    clientLines,
    ``,
    `Write a concise, urgent alert email to the admin team. Include:`,
    `1. Severity headline (how many clients, overall risk level)`,
    `2. Client breakdown with context on what the score drop likely means`,
    `3. Specific recommended interventions per client (check-in call, address overdue tasks, reply to messages, etc.)`,
    `4. Priority order for follow-up today`,
    ``,
    `Keep it under 200 words. Use plain text, no markdown. Do not include a subject line.`,
  ].join("\n");

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    const block = message.content.find((b) => b.type === "text");
    return block?.type === "text" ? block.text.trim() : `Health alert: ${clients.length} client${clients.length !== 1 ? "s" : ""} at risk. Review dashboard immediately.`;
  } catch {
    return [
      `Client Health Alert — ${clients.length} At-Risk Client${clients.length !== 1 ? "s" : ""}`,
      ``,
      clientLines,
      ``,
      `Action required: Schedule check-in calls and address open tasks.`,
      ``,
      `This is an automated alert from Maphari.`,
    ].join("\n");
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  console.log("[health-alert] Starting daily client health check");

  const allScores = await fetchHealthScores();
  console.log(`[health-alert] Fetched ${allScores.length} health score records`);

  const atRisk = detectAtRiskClients(allScores);
  console.log(`[health-alert] At-risk clients (>15 point drop): ${atRisk.length}`);

  if (atRisk.length === 0) {
    console.log("[health-alert] No at-risk clients detected. No alert sent.");
    return;
  }

  const body    = await generateEmailBody(atRisk);
  const subject = `Client Health Alert — ${atRisk.length} At-Risk Client${atRisk.length !== 1 ? "s" : ""}`;

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    console.warn("[health-alert] ADMIN_EMAILS not set — cannot send alert.");
    console.log(`[health-alert] Alert:\n${body}`);
    return;
  }

  for (const recipient of adminEmails) {
    const result = await sendEmail({ to: recipient, subject, text: body });
    if (result.skipped) {
      console.log(`[health-alert] Dev mode — email skipped (would go to ${recipient})`);
    } else if (result.success) {
      console.log(`[health-alert] ✓ Sent to ${recipient}`);
    } else {
      console.warn(`[health-alert] Failed to send to ${recipient}: ${result.error ?? "unknown"}`);
    }
  }

  console.log(`\n[health-alert] ── Run complete ──`);
  console.log(`[health-alert] At-risk clients : ${atRisk.length}`);
  console.log(`[health-alert] Alert sent to   : ${adminEmails.join(", ")}`);
}

run().catch((err: unknown) => {
  console.error("[health-alert] Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
