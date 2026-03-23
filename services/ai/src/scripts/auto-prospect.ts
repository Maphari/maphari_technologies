// ════════════════════════════════════════════════════════════════════════════
// auto-prospect.ts — Automated prospecting script
//
// Runs hourly. Each run picks a fresh random industry + location combination.
// Picks a random industry category from an international pool of cities, and
// opportunity filters, then runs the full AI prospecting pipeline, persists
// each prospect to the DB, and sends pitch emails to leads with a contact email.
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

async function fetchExistingLeadNames(coreBaseUrl: string): Promise<Set<string>> {
  try {
    const res = await fetch(`${coreBaseUrl}/leads`, {
      headers: { "x-user-role": "ADMIN" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return new Set();
    const json = (await res.json()) as { data?: { company?: string | null }[] };
    const leads = json.data ?? [];
    return new Set(
      leads
        .map((l) => (l.company ?? "").toLowerCase().trim())
        .filter((c) => c.length > 0)
    );
  } catch {
    return new Set();
  }
}

async function saveLead(
  coreBaseUrl: string,
  prospect: {
    company: string;
    contactEmail?: string;
    contactPhone?: string;
    rating?: number;
    opportunityType: string;
    opportunityReason: string;
    leadScore?: number;
    address?: string;
  }
): Promise<boolean> {
  // Fields the Lead schema doesn't have columns for are stored in notes as JSON.
  const notes = JSON.stringify({
    opportunityType: prospect.opportunityType,
    opportunityReason: prospect.opportunityReason,
    address: prospect.address,
    rating: prospect.rating,
    leadScore: prospect.leadScore,
  });

  try {
    const res = await fetch(`${coreBaseUrl}/leads`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-role": "ADMIN",
      },
      body: JSON.stringify({
        title: `[Auto] ${prospect.company}`,
        company: prospect.company,
        contactEmail: prospect.contactEmail,
        contactPhone: prospect.contactPhone,
        source: "auto-prospect",
        status: "NEW",
        notes,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    return res.ok;
  } catch {
    return false;
  }
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
  const aiBaseUrl   = process.env.SERVICE_AI_BASE_URL ?? "http://localhost:3003";
  const coreBaseUrl = process.env.CORE_SERVICE_URL    ?? "http://localhost:4002";

  // 1. Random selections
  const industry   = pickRandom(INDUSTRIES);
  const location   = pickRandom(LOCATIONS);
  const numFilters = Math.random() < 0.5 ? 1 : 2;
  const filters    = pickRandomN(ALL_FILTERS, numFilters);

  console.log(`[auto-prospect] ── Hourly run ──`);
  console.log(`[auto-prospect] Industry : ${industry}`);
  console.log(`[auto-prospect] Location : ${location}`);
  console.log(`[auto-prospect] Filters  : ${filters.join(", ")}`);

  // 2. Cross-run dedup
  const existing = await fetchExistingLeadNames(coreBaseUrl);
  console.log(`[auto-prospect] Existing leads in DB: ${existing.size}`);

  // 3. Run prospecting pipeline
  const rawProspects = await searchProspects(industry, location, 20, filters);
  const prospects    = await generatePitches(rawProspects, true);
  console.log(`[auto-prospect] Prospects found: ${prospects.length}`);

  let saved   = 0;
  let sent    = 0;
  let skipped = 0;

  for (const prospect of prospects) {
    const key = prospect.company.toLowerCase().trim();

    if (existing.has(key)) {
      console.log(`[auto-prospect] ⟳ Duplicate skipped: ${prospect.company}`);
      skipped++;
      continue;
    }

    // Persist to DB
    const didSave = await saveLead(coreBaseUrl, prospect);
    if (didSave) {
      saved++;
      existing.add(key); // prevent double-save within the same run
      console.log(`[auto-prospect] ✓ Saved: ${prospect.company}`);

      // Send pitch email only if lead was persisted (for traceability)
      if (prospect.contactEmail && prospect.pitch) {
        const subject = `Quick question for ${prospect.company}`;
        const success = await sendPitch(aiBaseUrl, prospect.contactEmail, subject, prospect.pitch);
        if (success) {
          sent++;
          console.log(`[auto-prospect] ✉ Pitched: ${prospect.company} <${prospect.contactEmail}>`);
        }
      }
    } else {
      console.warn(`[auto-prospect] ✗ DB save failed: ${prospect.company}`);
    }
  }

  // Summary
  console.log(`\n[auto-prospect] ── Run complete ──`);
  console.log(`[auto-prospect] Prospects found : ${prospects.length}`);
  console.log(`[auto-prospect] Saved to DB     : ${saved}`);
  console.log(`[auto-prospect] Emails sent     : ${sent}`);
  console.log(`[auto-prospect] Duplicates skip : ${skipped}`);
  console.log(`[auto-prospect] Industry        : ${industry} in ${location}`);
  console.log(`[auto-prospect] Filters         : ${filters.join(", ")}`);
}

run().catch((err: unknown) => {
  console.error("[auto-prospect] Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
