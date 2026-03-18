// ════════════════════════════════════════════════════════════════════════════
// monthly-revenue-report.ts — Monthly automated revenue email
//
// Runs on the 1st of every month at 07:00. Fetches the revenue series from
// billing, computes this month vs last month delta, uses Claude to write a
// professional summary email, then sends it to all admin emails via Resend.
//
// Usage: npx tsx services/ai/src/scripts/monthly-revenue-report.ts
// ════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { sendEmail, getAdminEmails } from "./lib/send-email.js";

// ── Types ──────────────────────────────────────────────────────────────────

interface RevenueSeries {
  key: string;        // "2026-03"
  month: string;      // "Mar"
  year: number;       // 2026
  paidCents: number;
  issuedCents: number;
  overdueCount: number;
  invoiceCount: number;
  currency?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

// ── Fetch revenue series ───────────────────────────────────────────────────

async function fetchRevenueSeries(): Promise<RevenueSeries[]> {
  const billingUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
  try {
    const res = await fetch(`${billingUrl}/admin/revenue-series?months=3`, {
      headers: {
        "x-user-role": "ADMIN",
        "content-type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as ApiResponse<RevenueSeries[]>;
    if (!json.success || !json.data) throw new Error(json.error?.message ?? "No data");
    return json.data;
  } catch (err) {
    throw new Error(`Failed to fetch revenue series: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Format helpers ─────────────────────────────────────────────────────────

function detectCurrency(series: RevenueSeries[]): string {
  return series[0]?.currency?.trim().toUpperCase() || process.env.BILLING_CURRENCY?.trim().toUpperCase() || "ZAR";
}

function fmt(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function delta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "—";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

// ── Generate email via Claude ──────────────────────────────────────────────

async function generateEmailBody(
  current: RevenueSeries,
  previous: RevenueSeries,
  currency: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const revDelta = delta(current.paidCents, previous.paidCents);
    return [
      `Monthly Revenue Report — ${current.month} ${current.year}`,
      ``,
      `Revenue collected this month: ${fmt(current.paidCents, currency)} (${revDelta} vs last month)`,
      `Invoices issued: ${fmt(current.issuedCents, currency)}`,
      `Overdue invoices: ${current.overdueCount}`,
      ``,
      `Previous month (${previous.month} ${previous.year}): ${fmt(previous.paidCents, currency)} collected`,
      ``,
      `This is an automated report from Maphari.`,
    ].join("\n");
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = [
    `You are a professional financial analyst writing a monthly revenue report email for a digital agency called Maphari.`,
    ``,
    `Data:`,
    `Current month (${current.month} ${current.year}):`,
    `  - Revenue collected (paid invoices): ${fmt(current.paidCents, currency)}`,
    `  - Revenue issued (new invoices sent): ${fmt(current.issuedCents, currency)}`,
    `  - Overdue invoices: ${current.overdueCount}`,
    `  - Total invoices: ${current.invoiceCount}`,
    ``,
    `Previous month (${previous.month} ${previous.year}):`,
    `  - Revenue collected: ${fmt(previous.paidCents, currency)}`,
    `  - Revenue issued: ${fmt(previous.issuedCents, currency)}`,
    `  - Overdue invoices: ${previous.overdueCount}`,
    ``,
    `Month-over-month changes:`,
    `  - Collected revenue: ${delta(current.paidCents, previous.paidCents)}`,
    `  - Issued revenue: ${delta(current.issuedCents, previous.issuedCents)}`,
    `  - Overdue count: ${current.overdueCount > previous.overdueCount ? "increased" : current.overdueCount < previous.overdueCount ? "decreased" : "unchanged"}`,
    ``,
    `Write a professional but warm monthly revenue report email to the admin team. Include:`,
    `1. A brief headline summary (one sentence)`,
    `2. Key metrics with context`,
    `3. One or two concrete improvement suggestions based on the data`,
    `4. A forward-looking close`,
    ``,
    `Keep it under 250 words. Use plain text, no markdown formatting. Do not include a subject line.`,
  ].join("\n");

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });
    const block = message.content.find((b) => b.type === "text");
    return block?.type === "text" ? block.text.trim() : "Revenue report generation failed — check billing data manually.";
  } catch (err) {
    console.warn("[monthly-revenue] Claude generation failed, using fallback:", err instanceof Error ? err.message : String(err));
    const revDelta = delta(current.paidCents, previous.paidCents);
    return [
      `${current.month} ${current.year} Revenue Summary`,
      ``,
      `Collected this month: ${fmt(current.paidCents, currency)} (${revDelta} vs ${previous.month})`,
      `Issued: ${fmt(current.issuedCents, currency)} | Overdue: ${current.overdueCount} invoice${current.overdueCount !== 1 ? "s" : ""}`,
      ``,
      `Previous month: ${fmt(previous.paidCents, currency)} collected`,
      ``,
      `This is an automated report from Maphari.`,
    ].join("\n");
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  console.log("[monthly-revenue] Starting monthly revenue report");

  // 1. Fetch revenue data
  const series = await fetchRevenueSeries();
  if (series.length < 2) {
    console.log("[monthly-revenue] Not enough monthly data (need at least 2 months). Skipping.");
    return;
  }

  const currency = detectCurrency(series);
  const current  = series[series.length - 1]!;
  const previous = series[series.length - 2]!;

  console.log(`[monthly-revenue] Current month  : ${current.month} ${current.year} — ${fmt(current.paidCents, currency)} collected`);
  console.log(`[monthly-revenue] Previous month : ${previous.month} ${previous.year} — ${fmt(previous.paidCents, currency)} collected`);
  console.log(`[monthly-revenue] Delta          : ${delta(current.paidCents, previous.paidCents)}`);

  // 2. Generate email body
  const body    = await generateEmailBody(current, previous, currency);
  const subject = `Monthly Revenue Report — ${current.month} ${current.year}`;

  // 3. Resolve admin emails
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    console.warn("[monthly-revenue] ADMIN_EMAILS not set — cannot send report.");
    console.log(`[monthly-revenue] Report body:\n${body}`);
    return;
  }

  // 4. Send
  for (const recipient of adminEmails) {
    const result = await sendEmail({ to: recipient, subject, text: body });
    if (result.skipped) {
      console.log(`[monthly-revenue] Dev mode — email skipped (would go to ${recipient})`);
    } else if (result.success) {
      console.log(`[monthly-revenue] ✓ Sent to ${recipient} (id: ${result.id ?? "?"})`);
    } else {
      console.warn(`[monthly-revenue] Failed to send to ${recipient}: ${result.error ?? "unknown"}`);
    }
  }

  console.log(`\n[monthly-revenue] ── Run complete ──`);
  console.log(`[monthly-revenue] Report sent to: ${adminEmails.join(", ")}`);
}

run().catch((err: unknown) => {
  console.error("[monthly-revenue] Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
