// ════════════════════════════════════════════════════════════════════════════
// prospecting.ts — AI-powered business prospecting
//
// Searches for local businesses via SerpAPI Google Maps, tags each prospect
// with the detected opportunity type, then uses Claude Sonnet 4.6 to draft
// a personalised pitch email.
//
// Enrichment pipeline (all optional, degrade gracefully without API keys):
//   1. Google PageSpeed Insights — free, no key required
//   2. Hunter.io domain-search  — requires HUNTER_API_KEY env var
//   3. Lead scoring            — local, no API call
//
// Dev fallback: if SERPAPI_KEY is not set, returns 5 hardcoded mock prospects
// so the full UI flow is testable without any API keys.
// ════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";

// ── Types ──────────────────────────────────────────────────────────────────────

export type OpportunityFilter = "no_website" | "needs_redesign" | "needs_automation" | "needs_seo";

export interface ProspectResult {
  name: string;
  company: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  rating?: number;
  industry?: string;
  opportunityType: OpportunityFilter;
  opportunityReason: string;
  pitch: string;
  source: "serpapi" | "mock";
  // Enriched fields (populated by enrichment pipeline)
  healthScore?: number;    // 0–100 PageSpeed mobile performance score
  healthIssues?: string[]; // Key performance issues detected
  leadScore?: number;      // 0–100 composite lead quality score
}

// ── External API shapes (partial) ─────────────────────────────────────────────

interface SerpApiLocalResult {
  title?: string;
  website?: string;
  phone?: string;
  address?: string;
  rating?: number;
}

interface SerpApiResponse {
  local_results?: SerpApiLocalResult[];
}

interface PageSpeedAudit {
  score?: number | null;
}

interface PageSpeedResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score?: number };
    };
    audits?: Record<string, PageSpeedAudit>;
  };
}

interface HunterEmail {
  value?: string;
}

interface HunterResponse {
  data?: {
    emails?: HunterEmail[];
  };
}

// ── Mock data ─────────────────────────────────────────────────────────────────

function buildMockProspects(filters: OpportunityFilter[]): ProspectResult[] {
  const allMocks: ProspectResult[] = [
    {
      name: "Maria Nkosi",
      company: "Nkosi's Kitchen",
      website: undefined,
      contactPhone: "+27 71 234 5678",
      address: "12 Main Road, Cape Town",
      rating: 4.6,
      opportunityType: "no_website",
      opportunityReason: "No website listed on Google Maps",
      pitch: "",
      source: "mock"
    },
    {
      name: "James Coetzee",
      company: "Coetzee Auto Repairs",
      website: "http://coetzeeauto.co.za",
      contactPhone: "+27 82 876 5432",
      address: "45 Industrial Ave, Johannesburg",
      rating: 3.8,
      opportunityType: "needs_redesign",
      opportunityReason: "Website appears outdated and lacks mobile optimisation",
      pitch: "",
      source: "mock"
    },
    {
      name: "Fatima Osman",
      company: "Osman Beauty Studio",
      website: "http://osmanbeauty.co.za",
      contactPhone: "+27 63 345 6789",
      address: "7 Kloof Street, Cape Town",
      rating: 4.9,
      opportunityType: "needs_automation",
      opportunityReason: "Beauty salon with no online booking or automated follow-up system",
      pitch: "",
      source: "mock"
    },
    {
      name: "Sipho Dlamini",
      company: "Dlamini Legal Advisors",
      website: "http://dlaminilaw.co.za",
      contactPhone: "+27 11 567 8901",
      address: "222 Rosebank Mall, Johannesburg",
      rating: 4.2,
      opportunityType: "needs_seo",
      opportunityReason: "Not appearing in top Google results for 'legal advisors Johannesburg'",
      pitch: "",
      source: "mock"
    },
    {
      name: "Thandi Molefe",
      company: "Molefe Catering Co.",
      website: undefined,
      contactPhone: "+27 74 678 9012",
      address: "88 Pretoria Street, Durban",
      rating: 4.4,
      opportunityType: "no_website",
      opportunityReason: "No website listed on Google Maps",
      pitch: "",
      source: "mock"
    }
  ];

  // Return only mocks whose opportunityType is in the requested filters
  const filtered = allMocks.filter((m) => filters.includes(m.opportunityType));
  // If no exact match, return all mocks (safety fallback)
  return filtered.length > 0 ? filtered : allMocks;
}

// ── SerpAPI search ────────────────────────────────────────────────────────────

async function fetchSerpApiResults(
  industry: string,
  location: string
): Promise<SerpApiLocalResult[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return [];

  const query = `${industry} ${location}`;
  const url = new URL("https://serpapi.com/search");
  url.searchParams.set("engine", "google_maps");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", key);
  url.searchParams.set("hl", "en");

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15_000)
    });
    if (!res.ok) return [];
    const json = (await res.json()) as SerpApiResponse;
    return json.local_results ?? [];
  } catch {
    return [];
  }
}

// ── Industry value tiers ──────────────────────────────────────────────────────

const HIGH_VALUE_INDUSTRIES = new Set([
  "dental practice", "optometrist", "pharmacy",
  "physiotherapy clinic", "accounting firm", "tax consultant",
  "real estate agent", "property developer",
]);

const MID_VALUE_INDUSTRIES = new Set([
  "gym and fitness", "personal trainer",
  "wedding photographer", "driving school",
  "tutoring centre", "daycare centre",
]);

// ── Build typed prospects from raw SerpAPI results ────────────────────────────

function classifyResults(
  results: SerpApiLocalResult[],
  filters: OpportunityFilter[],
  count: number,
  industry: string,
): Omit<ProspectResult, "pitch">[] {
  const noWebsiteResults = results.filter((r) => !r.website);
  const hasWebsiteResults = results.filter((r) => !!r.website);

  const prospects: Omit<ProspectResult, "pitch">[] = [];

  // Fill no_website slots
  if (filters.includes("no_website")) {
    for (const r of noWebsiteResults) {
      if (prospects.length >= count) break;
      prospects.push({
        name: r.title ?? "Business Owner",
        company: r.title ?? "Unknown Business",
        website: undefined,
        contactPhone: r.phone,
        address: r.address,
        rating: r.rating,
        industry,
        opportunityType: "no_website",
        opportunityReason: "No website listed on Google Maps",
        source: "serpapi"
      });
    }
  }

  // Fill slots for website-related filters (round-robin)
  const websiteFilters = filters.filter(
    (f): f is "needs_redesign" | "needs_automation" | "needs_seo" => f !== "no_website"
  );

  if (websiteFilters.length > 0) {
    let filterIndex = 0;
    for (const r of hasWebsiteResults) {
      if (prospects.length >= count) break;
      const filterType = websiteFilters[filterIndex % websiteFilters.length];
      filterIndex++;

      const reasons: Record<"needs_redesign" | "needs_automation" | "needs_seo", string> = {
        needs_redesign: "Website may benefit from a modern redesign",
        needs_automation: "Business could benefit from automated booking or follow-up workflows",
        needs_seo: "Website may have limited search visibility for local queries"
      };

      prospects.push({
        name: r.title ?? "Business Owner",
        company: r.title ?? "Unknown Business",
        website: r.website,
        contactPhone: r.phone,
        address: r.address,
        rating: r.rating,
        industry,
        opportunityType: filterType,
        opportunityReason: reasons[filterType],
        source: "serpapi"
      });
    }
  }

  return prospects.slice(0, count);
}

// ── Website health check (Google PageSpeed Insights — free, no key needed) ────

async function checkWebsiteHealth(
  url: string
): Promise<{ score: number | null; issues: string[] }> {
  try {
    const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("strategy", "mobile");
    apiUrl.searchParams.set("category", "performance");

    const res = await fetch(apiUrl.toString(), { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return { score: null, issues: [] };

    const data = (await res.json()) as PageSpeedResponse;
    const rawScore = data.lighthouseResult?.categories?.performance?.score;
    const score =
      rawScore !== undefined && rawScore !== null ? Math.round(rawScore * 100) : null;

    const audits = data.lighthouseResult?.audits ?? {};
    const issues: string[] = [];

    if ((audits["render-blocking-resources"]?.score ?? 1) < 0.9) {
      issues.push("Render-blocking resources");
    }
    if ((audits["unused-javascript"]?.score ?? 1) < 0.9) {
      issues.push("Unused JavaScript");
    }
    if ((audits["largest-contentful-paint"]?.score ?? 1) < 0.5) {
      issues.push("Slow page load (LCP)");
    }
    if ((audits["cumulative-layout-shift"]?.score ?? 1) < 0.9) {
      issues.push("Layout shift (CLS)");
    }
    if ((audits["uses-responsive-images"]?.score ?? 1) < 0.9) {
      issues.push("Unoptimised images");
    }

    return { score, issues };
  } catch {
    return { score: null, issues: [] };
  }
}

// ── Contact enrichment via Hunter.io (requires HUNTER_API_KEY) ────────────────

async function enrichContact(domain: string): Promise<string | undefined> {
  const key = process.env.HUNTER_API_KEY;
  if (!key) return undefined;

  try {
    const url = new URL("https://api.hunter.io/v2/domain-search");
    url.searchParams.set("domain", domain);
    url.searchParams.set("api_key", key);
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return undefined;

    const data = (await res.json()) as HunterResponse;
    return data.data?.emails?.[0]?.value;
  } catch {
    return undefined;
  }
}

// ── Lead scoring (local, no API call) ─────────────────────────────────────────

function scoreProspect(prospect: Omit<ProspectResult, "pitch">): number {
  let score = 0;

  // Contact completeness
  if (prospect.contactPhone)  score += 20;
  if (prospect.contactEmail)  score += 25;

  // Business quality signals
  if ((prospect.rating ?? 0) >= 4.5)      score += 20;
  else if ((prospect.rating ?? 0) >= 4.0) score += 10;

  // Opportunity urgency (no website = highest impact)
  if (prospect.opportunityType === "no_website") score += 15;

  // Website health (low score = big opportunity)
  if (prospect.healthScore !== undefined) {
    if (prospect.healthScore < 50)      score += 20;
    else if (prospect.healthScore < 80) score += 10;
  }

  // Industry value bonus
  const ind = (prospect.industry ?? "").toLowerCase();
  if (HIGH_VALUE_INDUSTRIES.has(ind))      score += 15;
  else if (MID_VALUE_INDUSTRIES.has(ind))  score += 8;

  return Math.min(100, score);
}

// ── Claude pitch generation ───────────────────────────────────────────────────

const PITCH_SYSTEM: Record<OpportunityFilter, string> = {
  no_website: `You are a professional business development consultant. Write a short, warm outreach email to a local business owner who has no website. The goal is to introduce your web design agency and offer to build them a professional website. Keep it under 130 words, conversational, not pushy.`,
  needs_redesign: `You are a professional business development consultant. Write a short, warm outreach email to a local business owner whose website could benefit from a modern redesign. Mention that modern, mobile-friendly websites convert better and build trust. Keep it under 130 words, conversational, not pushy.`,
  needs_automation: `You are a professional business development consultant. Write a short, warm outreach email to a local business owner who could save time and grow revenue with automation (e.g. online booking, automated follow-ups, CRM). Keep it under 130 words, conversational, not pushy.`,
  needs_seo: `You are a professional business development consultant. Write a short, warm outreach email to a local business owner whose website has limited search visibility. Explain how better SEO means more local customers finding them online. Keep it under 130 words, conversational, not pushy.`
};

async function generateOnePitch(
  prospect: Omit<ProspectResult, "pitch">,
  anthropic: Anthropic
): Promise<string> {
  const system = PITCH_SYSTEM[prospect.opportunityType];
  const contextLines = [
    `Business name: ${prospect.company}`,
    `Industry: ${prospect.industry ?? "local business"}`,
    `Location: ${prospect.address ?? "South Africa"}`,
    prospect.rating !== undefined
      ? `Google Maps rating: ${prospect.rating}/5 — this business has real customer traction.`
      : "",
    prospect.contactPhone
      ? `Phone on file: ${prospect.contactPhone} — you may invite them to call or reply.`
      : "",
    prospect.website ? `Current website: ${prospect.website}` : "No current website.",
    prospect.healthScore !== undefined
      ? `Website performance score (mobile): ${prospect.healthScore}/100${
          prospect.healthIssues?.length
            ? ` — Key issues: ${prospect.healthIssues.join(", ")}`
            : ""
        }`
      : "",
    ``,
    `Write the pitch email now. Mention the business name and location naturally. Keep it under 130 words. Be warm, not pushy.`,
  ].filter(Boolean);

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system,
      messages: [{ role: "user", content: contextLines.join("\n") }]
    });
    const block = message.content.find((b) => b.type === "text");
    return block?.type === "text" ? block.text.trim() : "";
  } catch {
    return `Hi, I noticed ${prospect.company} and wanted to reach out about a digital opportunity. Would love to connect!`;
  }
}

// ── Stub pitch (no API key) ───────────────────────────────────────────────────

function stubPitch(prospect: Omit<ProspectResult, "pitch">): string {
  const lines: Record<OpportunityFilter, string> = {
    no_website: `Hi, I came across ${prospect.company} and noticed you don't have a website yet. We'd love to help you build a professional online presence that attracts more customers. Would you be open to a quick chat?`,
    needs_redesign: `Hi, I came across ${prospect.company}'s website and saw an opportunity to modernise it. A fresh, mobile-friendly design can significantly boost your credibility and conversions. Happy to show you some examples!`,
    needs_automation: `Hi, I noticed ${prospect.company} could benefit from automated booking and customer follow-up tools. We help businesses like yours save hours every week while improving customer experience. Let me know if you'd like to learn more!`,
    needs_seo: `Hi, I noticed ${prospect.company} isn't showing up prominently in local search results. Better SEO could bring you a steady stream of new customers. I'd love to share a quick audit — no obligation!`
  };
  return lines[prospect.opportunityType];
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function searchProspects(
  industry: string,
  location: string,
  count: number,
  filters: OpportunityFilter[]
): Promise<Omit<ProspectResult, "pitch">[]> {
  // 1. Get base prospects (SerpAPI or mock fallback)
  let base: Omit<ProspectResult, "pitch">[];

  const serpKey = process.env.SERPAPI_KEY;
  if (!serpKey) {
    console.warn("[prospecting] SERPAPI_KEY not set — returning mock prospects");
    base = buildMockProspects(filters).slice(0, count).map(({ pitch: _pitch, ...rest }) => ({ ...rest, industry }));
  } else {
    const raw = await fetchSerpApiResults(industry, location);
    base =
      raw.length > 0
        ? classifyResults(raw, filters, count, industry)
        : buildMockProspects(filters).slice(0, count).map(({ pitch: _pitch, ...rest }) => ({ ...rest, industry }));
  }

  // 2. Enrich all prospects in parallel (health check + contact enrichment + scoring)
  const enriched = await Promise.allSettled(
    base.map(async (p) => {
      const result: Omit<ProspectResult, "pitch"> = { ...p };

      // Website health check (free, no key required)
      if (p.website) {
        const health = await checkWebsiteHealth(p.website);
        if (health.score !== null) result.healthScore = health.score;
        if (health.issues.length > 0) result.healthIssues = health.issues;
      }

      // Contact enrichment via Hunter.io (optional key)
      if (!p.contactEmail && p.website) {
        try {
          const domain = new URL(p.website).hostname;
          const email = await enrichContact(domain);
          if (email) result.contactEmail = email;
        } catch {
          // invalid URL — skip
        }
      }

      // Lead scoring (local, always runs)
      result.leadScore = scoreProspect(result);

      return result;
    })
  );

  return enriched
    .filter(
      (r): r is PromiseFulfilledResult<Omit<ProspectResult, "pitch">> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value);
}

export async function generatePitches(
  prospects: Omit<ProspectResult, "pitch">[],
  draftPitch: boolean
): Promise<ProspectResult[]> {
  if (!draftPitch) {
    return prospects.map((p) => ({ ...p, pitch: "" }));
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    // No LLM key — return stub pitches
    return prospects.map((p) => ({ ...p, pitch: stubPitch(p) }));
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // Generate pitches in parallel (max 10 at a time to avoid rate limits)
  const BATCH = 10;
  const results: ProspectResult[] = [];
  for (let i = 0; i < prospects.length; i += BATCH) {
    const batch = prospects.slice(i, i + BATCH);
    const pitched = await Promise.all(
      batch.map(async (p) => ({
        ...p,
        pitch: await generateOnePitch(p, anthropic)
      }))
    );
    results.push(...pitched);
  }
  return results;
}

export { randomUUID };
