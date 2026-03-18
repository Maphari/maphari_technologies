// ════════════════════════════════════════════════════════════════════════════
// weekly-invoice-aging.ts — Weekly overdue invoice aging alert
//
// Runs every Monday at 08:30. Fetches overdue invoices, groups them into age
// buckets, uses Claude to write an actionable summary, then sends the alert
// to all admin emails via Resend.
//
// Usage: npx tsx services/ai/src/scripts/weekly-invoice-aging.ts
// ════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { sendEmail, getAdminEmails } from "./lib/send-email.js";

// ── Types ──────────────────────────────────────────────────────────────────

interface InvoiceRecord {
  id: string;
  clientId: string;
  number: string;
  amountCents: number;
  currency: string;
  status: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

interface AgeBucket {
  label: string;
  invoices: Array<{ id: string; number: string; amountCents: number; daysOverdue: number }>;
  totalCents: number;
}

// ── Fetch overdue invoices ─────────────────────────────────────────────────

async function fetchOverdueInvoices(): Promise<InvoiceRecord[]> {
  const billingUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
  try {
    const res = await fetch(`${billingUrl}/invoices`, {
      headers: {
        "x-user-role": "ADMIN",
        "content-type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as ApiResponse<InvoiceRecord[]>;
    if (!json.success || !json.data) throw new Error(json.error?.message ?? "No data");
    return json.data.filter((inv) => inv.status.toUpperCase() === "OVERDUE");
  } catch (err) {
    throw new Error(`Failed to fetch invoices: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Format currency ────────────────────────────────────────────────────────

function detectCurrency(invoices: InvoiceRecord[]): string {
  return invoices[0]?.currency?.trim().toUpperCase() || process.env.BILLING_CURRENCY?.trim().toUpperCase() || "ZAR";
}

function fmt(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ── Build age buckets ──────────────────────────────────────────────────────

function buildBuckets(invoices: InvoiceRecord[]): AgeBucket[] {
  const now = Date.now();
  const buckets: AgeBucket[] = [
    { label: "1–7 days overdue",   invoices: [], totalCents: 0 },
    { label: "8–30 days overdue",  invoices: [], totalCents: 0 },
    { label: "31–60 days overdue", invoices: [], totalCents: 0 },
    { label: "60+ days overdue",   invoices: [], totalCents: 0 },
  ];

  for (const inv of invoices) {
    if (!inv.dueAt) continue;
    const daysOverdue = Math.floor((now - new Date(inv.dueAt).getTime()) / 86400000);
    if (daysOverdue < 1) continue;

    const entry = { id: inv.id, number: inv.number, amountCents: inv.amountCents, daysOverdue };

    if (daysOverdue <= 7)        { buckets[0]!.invoices.push(entry); buckets[0]!.totalCents += inv.amountCents; }
    else if (daysOverdue <= 30)  { buckets[1]!.invoices.push(entry); buckets[1]!.totalCents += inv.amountCents; }
    else if (daysOverdue <= 60)  { buckets[2]!.invoices.push(entry); buckets[2]!.totalCents += inv.amountCents; }
    else                         { buckets[3]!.invoices.push(entry); buckets[3]!.totalCents += inv.amountCents; }
  }

  return buckets.filter((b) => b.invoices.length > 0);
}

// ── Generate email via Claude ──────────────────────────────────────────────

async function generateEmailBody(
  buckets: AgeBucket[],
  totalOverdue: number,
  totalCents: number,
  currency: string
): Promise<string> {
  const bucketSummary = buckets
    .map((b) => `  ${b.label}: ${b.invoices.length} invoice${b.invoices.length !== 1 ? "s" : ""} — ${fmt(b.totalCents, currency)}`)
    .join("\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return [
      `Weekly Invoice Aging Report`,
      ``,
      `Total overdue: ${totalOverdue} invoice${totalOverdue !== 1 ? "s" : ""} — ${fmt(totalCents, currency)}`,
      ``,
      `Breakdown:`,
      bucketSummary,
      ``,
      `Recommended action: Follow up on all 60+ day invoices immediately, then work through 31–60 day invoices before end of week.`,
      ``,
      `This is an automated report from Maphari.`,
    ].join("\n");
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = [
    `You are a professional accounts receivable manager writing a weekly overdue invoice alert email for Maphari, a digital agency.`,
    ``,
    `Overdue invoice summary:`,
    `  Total overdue: ${totalOverdue} invoice${totalOverdue !== 1 ? "s" : ""} — ${fmt(totalCents, currency)}`,
    ``,
    `Age bucket breakdown:`,
    bucketSummary,
    ``,
    `Write a concise, action-oriented alert email to the admin team. Include:`,
    `1. One-line severity summary`,
    `2. The bucket breakdown with urgency context`,
    `3. Specific recommended follow-up actions per bucket (e.g., send reminder, call client, escalate to legal)`,
    `4. Priority guidance for the week`,
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
    return block?.type === "text" ? block.text.trim() : `Weekly aging report: ${totalOverdue} invoices overdue totalling ${fmt(totalCents, currency)}.`;
  } catch {
    return [
      `Weekly Invoice Aging Alert`,
      ``,
      `${totalOverdue} invoice${totalOverdue !== 1 ? "s" : ""} overdue — total exposure: ${fmt(totalCents, currency)}`,
      ``,
      bucketSummary,
      ``,
      `Priority action: Contact clients with 60+ day overdue invoices immediately.`,
      ``,
      `This is an automated report from Maphari.`,
    ].join("\n");
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  console.log("[invoice-aging] Starting weekly invoice aging check");

  const overdue = await fetchOverdueInvoices();
  console.log(`[invoice-aging] Found ${overdue.length} overdue invoice${overdue.length !== 1 ? "s" : ""}`);

  if (overdue.length === 0) {
    console.log("[invoice-aging] No overdue invoices — nothing to report. Skipping email.");
    return;
  }

  const currency   = detectCurrency(overdue);
  const buckets    = buildBuckets(overdue);
  const totalCents = overdue.reduce((s, inv) => s + inv.amountCents, 0);
  const body       = await generateEmailBody(buckets, overdue.length, totalCents, currency);

  const now     = new Date();
  const subject = `Invoice Aging Alert — ${overdue.length} Overdue (${now.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })})`;

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    console.warn("[invoice-aging] ADMIN_EMAILS not set — cannot send alert.");
    console.log(`[invoice-aging] Report:\n${body}`);
    return;
  }

  for (const recipient of adminEmails) {
    const result = await sendEmail({ to: recipient, subject, text: body });
    if (result.skipped) {
      console.log(`[invoice-aging] Dev mode — email skipped (would go to ${recipient})`);
    } else if (result.success) {
      console.log(`[invoice-aging] ✓ Sent to ${recipient}`);
    } else {
      console.warn(`[invoice-aging] Failed to send to ${recipient}: ${result.error ?? "unknown"}`);
    }
  }

  console.log(`\n[invoice-aging] ── Run complete ──`);
  console.log(`[invoice-aging] Overdue invoices : ${overdue.length}`);
  console.log(`[invoice-aging] Total exposure   : ${fmt(totalCents, currency)}`);
  console.log(`[invoice-aging] Alert sent to    : ${adminEmails.join(", ")}`);
}

run().catch((err: unknown) => {
  console.error("[invoice-aging] Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
