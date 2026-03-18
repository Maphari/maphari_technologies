// ════════════════════════════════════════════════════════════════════════════
// auto-prospect.ts — Daily automated prospecting script
//
// Runs daily at 08:00. Picks a random industry category from an international
// pool of cities, and opportunity filters, then runs the full AI prospecting
// pipeline and sends pitch emails to each lead that has a contact email.
//
// Usage: npx tsx services/ai/src/scripts/auto-prospect.ts
// ════════════════════════════════════════════════════════════════════════════

import { searchProspects, generatePitches } from "../lib/prospecting.js";
import type { OpportunityFilter } from "../lib/prospecting.js";

// ── Random selection pools ─────────────────────────────────────────────────

const INDUSTRIES = [
  "restaurant", "hair salon", "barbershop", "nail salon",
  "physiotherapy clinic", "accounting firm", "tax consultant",
  "plumbing services", "electrician", "cleaning services",
  "real estate agent", "property developer",
  "dental practice", "optometrist", "pharmacy",
  "gym and fitness", "personal trainer",
  "wedding photographer", "graphic designer",
  "car wash", "auto repair", "driving school",
  "daycare centre", "tutoring centre",
  "clothing boutique", "hardware store",
] as const;

const LOCATIONS = [
  // South Africa
  "Johannesburg, South Africa",
  "Cape Town, South Africa",
  "Durban, South Africa",
  "Pretoria, South Africa",
  "Sandton, South Africa",
  // United Kingdom
  "London, UK",
  "Manchester, UK",
  "Birmingham, UK",
  // United States
  "New York, USA",
  "Los Angeles, USA",
  "Chicago, USA",
  "Houston, USA",
  // Canada
  "Toronto, Canada",
  "Vancouver, Canada",
  // Australia
  "Sydney, Australia",
  "Melbourne, Australia",
  // Nigeria
  "Lagos, Nigeria",
  "Abuja, Nigeria",
  // Kenya
  "Nairobi, Kenya",
  // UAE
  "Dubai, UAE",
  "Abu Dhabi, UAE",
  // Germany
  "Berlin, Germany",
  // Singapore
  "Singapore",
  // India
  "Mumbai, India",
] as const;

const ALL_FILTERS: OpportunityFilter[] = [
  "no_website",
  "needs_redesign",
  "needs_automation",
  "needs_seo",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickRandomN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ── Email dispatch via prospect/send-pitch endpoint ────────────────────────

async function sendPitch(
  baseUrl: string,
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/ai/prospect/send-pitch`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-role": "ADMIN",
      },
      body: JSON.stringify({ to, subject, body }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      console.warn(`[auto-prospect] Pitch to ${to} failed: ${err?.error?.message ?? res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[auto-prospect] Pitch to ${to} threw: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  const baseUrl = process.env.SERVICE_AI_BASE_URL ?? "http://localhost:3003";

  // 1. Random selections
  const industry  = pickRandom(INDUSTRIES);
  const location  = pickRandom(LOCATIONS);
  const numFilters = Math.random() < 0.5 ? 1 : 2;
  const filters   = pickRandomN(ALL_FILTERS, numFilters);

  console.log(`[auto-prospect] Starting daily run`);
  console.log(`[auto-prospect] Industry : ${industry}`);
  console.log(`[auto-prospect] Location : ${location}`);
  console.log(`[auto-prospect] Filters  : ${filters.join(", ")}`);

  // 2. Run prospecting pipeline (search + enrich + pitch)
  const rawProspects = await searchProspects(industry, location, 20, filters);
  const prospects    = await generatePitches(rawProspects, true);

  console.log(`[auto-prospect] Found ${prospects.length} prospects`);

  // 3. Send pitches to leads with a contact email
  const sendable = prospects.filter((p) => p.contactEmail);
  console.log(`[auto-prospect] ${sendable.length} prospects have email addresses`);

  let sent    = 0;
  let skipped = 0;

  for (const prospect of sendable) {
    if (!prospect.contactEmail || !prospect.pitch) {
      skipped++;
      continue;
    }

    const subject = `Quick question for ${prospect.company}`;
    const success = await sendPitch(baseUrl, prospect.contactEmail, subject, prospect.pitch);

    if (success) {
      sent++;
      console.log(`[auto-prospect] ✓ Sent to ${prospect.company} <${prospect.contactEmail}>`);
    } else {
      skipped++;
    }
  }

  // 4. Summary
  console.log(`\n[auto-prospect] ── Run complete ──`);
  console.log(`[auto-prospect] Prospects found : ${prospects.length}`);
  console.log(`[auto-prospect] Emails sent     : ${sent}`);
  console.log(`[auto-prospect] Skipped         : ${skipped + (prospects.length - sendable.length)} (no email or send error)`);
  console.log(`[auto-prospect] Filters used    : ${filters.join(", ")}`);
  console.log(`[auto-prospect] Industry        : ${industry} in ${location}`);
}

run().catch((err: unknown) => {
  console.error("[auto-prospect] Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
