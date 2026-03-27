# Prospecting System Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all email domain references across the codebase, introduce a dedicated outreach email address for prospect pitches, make the auto-prospect script run hourly and persist results to the DB automatically with cross-run deduplication, improve lead scoring with industry weighting, and sharpen pitch personalisation with richer context.

**Architecture:** Three work streams executed in order — (1) email domain migration, pure config/string changes; (2) `Lead` schema fix to allow `clientId`-less creation for auto-sourced leads; (3) prospecting engine improvements touching the AI service library, auto-prospect script, and AI routes. Stream 1 must be committed first so stream 3 can reference the correct env var names. Stream 2 must be committed before stream 3 so the leads endpoint accepts auto-prospect payloads.

**Tech Stack:** TypeScript, Resend REST API (email), SerpAPI (Google Maps search), Claude Sonnet 4.6 (pitch generation), Prisma + PostgreSQL (`Lead` model in `services/core`), Fastify (`services/ai`, `services/core`), Next.js admin UI.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `services/notifications/.env` | Modify | Update `NOTIFICATION_FROM_EMAIL` to `@mapharitechnologies.com` domain |
| `services/notifications/.env.example` | Modify | Canonical example for new devs |
| `services/ai/.env` | Modify | Add `OUTREACH_FROM_EMAIL`, `SERPAPI_KEY`, `HUNTER_API_KEY`, `ADMIN_EMAILS` vars |
| `services/ai/.env.example` | Modify | Document new vars |
| `services/auth/.env.example` | Modify | Update placeholder emails to `@mapharitechnologies.com` |
| `services/notifications/src/lib/providers/email.ts` | Modify | Update fallback FROM address and footer support link |
| `services/ai/src/scripts/lib/send-email.ts` | Modify | Update fallback FROM address, footer support link; add optional `from` override param |
| `services/ai/src/routes/ai.ts` | Modify | `send-pitch` route uses `OUTREACH_FROM_EMAIL` via updated `sendEmail`; preserve metrics line |
| `services/core/prisma/schema.prisma` | Modify | Make `Lead.clientId` optional (`String?`) |
| `services/core/prisma/migrations/` | Create | Migration file for `clientId` nullable change |
| `services/core/src/routes/leads.ts` | Modify | Allow `clientId`-less creation when `source === "auto-prospect"` and role is `ADMIN` |
| `services/ai/src/lib/prospecting.ts` | Modify | Add `industry` field to `ProspectResult`; smarter scoring with industry tiers; richer pitch context |
| `services/ai/src/scripts/auto-prospect.ts` | Modify | Hourly cadence; DB persistence; cross-run dedup; correct AI service port default |
| `apps/web/src/lib/api/admin/prospecting.ts` | Modify | Sync `ProspectResult` frontend type with new `industry` field |

---

## Task 1: Email Domain Migration — ENV Files

**Files:**
- Modify: `services/notifications/.env`
- Modify: `services/notifications/.env.example`
- Modify: `services/ai/.env`
- Modify: `services/ai/.env.example`
- Modify: `services/auth/.env.example`

- [ ] **Step 1: Update `services/notifications/.env`**

  Change line 9:
  ```
  NOTIFICATION_FROM_EMAIL="Maphari <notifications@mapharitechnologies.com>"
  ```

- [ ] **Step 2: Update `services/notifications/.env.example`**

  ```
  NOTIFICATION_FROM_EMAIL="Maphari <notifications@mapharitechnologies.com>"
  ```

- [ ] **Step 3: Append to `services/ai/.env`**

  ```
  # ── Prospecting ───────────────────────────────────────────────────────────────
  # Outbound pitch emails come FROM this address (must be a verified Resend sender)
  OUTREACH_FROM_EMAIL="Maphari Technologies <outreach@mapharitechnologies.com>"
  # SerpAPI — Google Maps business search. Get key: https://serpapi.com/dashboard
  SERPAPI_KEY="replace-with-your-serpapi-key"
  # Hunter.io — email enrichment. Get key: https://hunter.io/api-keys
  HUNTER_API_KEY="replace-with-your-hunter-api-key"
  # Comma-separated admin emails for run-summary alerts
  ADMIN_EMAILS="mat.official@mapharitechnologies.com"
  # Resend API key for direct pitch email delivery
  RESEND_API_KEY="replace-with-your-resend-api-key"
  ```

- [ ] **Step 4: Mirror the same block in `services/ai/.env.example`**

  Append the block from Step 3 (with placeholder values as shown).

- [ ] **Step 5: Update `services/auth/.env.example` placeholder emails**

  Change:
  ```
  ADMIN_EMAILS="admin@maphari.com"
  ```
  To:
  ```
  ADMIN_EMAILS="mat.official@mapharitechnologies.com"
  ```

  Change the STAFF_EMAILS comment:
  ```
  # Example: "staff@mapharitechnologies.com,support@mapharitechnologies.com"
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add services/notifications/.env services/notifications/.env.example \
          services/ai/.env services/ai/.env.example \
          services/auth/.env.example
  git commit -m "chore: migrate email addresses to mapharitechnologies.com domain"
  ```

---

## Task 2: Email Domain Migration — Source Code Fallbacks & Support Links

**Files:**
- Modify: `services/notifications/src/lib/providers/email.ts`
- Modify: `services/ai/src/scripts/lib/send-email.ts`

- [ ] **Step 1: Update fallback FROM in `services/notifications/src/lib/providers/email.ts` (line 45)**

  ```ts
  // Before
  const from = process.env.NOTIFICATION_FROM_EMAIL ?? "Maphari <notifications@maphari.com>";
  // After
  const from = process.env.NOTIFICATION_FROM_EMAIL ?? "Maphari <notifications@mapharitechnologies.com>";
  ```

- [ ] **Step 2: Update footer support link in same file (line 61)**

  ```ts
  // Before
  <a href="mailto:support@maphari.com" style="color:#8b6fff">support@maphari.com</a>.
  // After
  <a href="mailto:support@mapharitechnologies.com" style="color:#8b6fff">support@mapharitechnologies.com</a>.
  ```

- [ ] **Step 3: Add optional `from` override to `sendEmail` in `services/ai/src/scripts/lib/send-email.ts`**

  Change `SendEmailOptions` interface:
  ```ts
  export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    text: string;
    from?: string;  // ← add; if omitted, uses NOTIFICATION_FROM_EMAIL env var
  }
  ```

  Update the `from` line in `sendEmail`:
  ```ts
  // Before
  const from = process.env.NOTIFICATION_FROM_EMAIL ?? "Maphari <notifications@mapharitechnologies.com>";
  // After
  const from =
    options.from ??
    process.env.NOTIFICATION_FROM_EMAIL ??
    "Maphari <notifications@mapharitechnologies.com>";
  ```

- [ ] **Step 4: Update footer support link in same file (line 47)**

  ```ts
  // Before
  <a href="mailto:support@maphari.com" style="color:#8b6fff">support@maphari.com</a>.
  // After
  <a href="mailto:support@mapharitechnologies.com" style="color:#8b6fff">support@mapharitechnologies.com</a>.
  ```

- [ ] **Step 5: Verify no stray `@maphari.com` remain in source files**

  ```bash
  grep -r "@maphari\.com" services/ai/src services/notifications/src services/auth/src apps/web/src --include="*.ts" --include="*.tsx"
  ```
  Expected: zero matches.

- [ ] **Step 6: Commit**

  ```bash
  git add services/notifications/src/lib/providers/email.ts \
          services/ai/src/scripts/lib/send-email.ts
  git commit -m "chore: update email fallbacks and support links to mapharitechnologies.com; add from override to sendEmail"
  ```

---

## Task 3: Dedicated Outreach Email for Pitch Sends

The `/ai/prospect/send-pitch` route publishes a NATS event, which routes through the notifications service — so the FROM is always `NOTIFICATION_FROM_EMAIL`. Pitch emails must come FROM `outreach@mapharitechnologies.com` so replies land in a dedicated sales inbox.

**Fix:** Call `sendEmail` (from `send-email.ts`) directly inside the route handler, passing `OUTREACH_FROM_EMAIL` as the `from` override added in Task 2.

**Files:**
- Modify: `services/ai/src/routes/ai.ts` (around line 785)

- [ ] **Step 1: Read send-pitch handler**

  Read `services/ai/src/routes/ai.ts` lines 780–850 to locate:
  - The `eventBus.publish(...)` block
  - The `metrics?.inc(...)` line that follows it
  - The final `return { success: true, data: { sent: true, ... } }` response

- [ ] **Step 2: Add import for `sendEmail` at the top of `ai.ts`**

  ```ts
  import { sendEmail } from "../scripts/lib/send-email.js";
  ```

- [ ] **Step 3: Replace the `eventBus.publish` block with a direct `sendEmail` call**

  Replace only the `eventBus.publish` block. Do NOT remove the `metrics?.inc(...)` line or the return statement — keep them exactly as they are.

  ```ts
  // Replace the try { await eventBus.publish(...) } catch { ... } block with:
  const outreachFrom =
    process.env.OUTREACH_FROM_EMAIL ??
    "Maphari Technologies <outreach@mapharitechnologies.com>";

  const result = await sendEmail({
    to,
    subject,
    text: message,
    from: outreachFrom,
  });

  if (!result.success && !result.skipped) {
    reply.status(500);
    return {
      success: false,
      error: { code: "SEND_ERROR", message: result.error ?? "Failed to send pitch email." },
    } as ApiResponse;
  }

  // ← keep the existing metrics?.inc(...) line here, unchanged
  // ← keep the existing return { success: true, data: { sent: true, to, subject } } here, unchanged
  ```

- [ ] **Step 4: TypeScript check for ai service**

  ```bash
  pnpm --filter @maphari/ai exec tsc --noEmit
  ```
  Expected: zero errors.

- [ ] **Step 5: Commit**

  ```bash
  git add services/ai/src/routes/ai.ts
  git commit -m "feat: send pitch emails from outreach@mapharitechnologies.com via sendEmail helper"
  ```

---

## Task 4: Make `Lead.clientId` Optional in Prisma Schema

`POST /leads` calls `resolveClientFilter(role, scopedClientId, inputClientId)`. With `x-user-role: ADMIN` and no `clientId` in the body, it returns `undefined` → HTTP 400. Auto-sourced leads have no associated client yet, so `clientId` must be nullable.

**Files:**
- Modify: `services/core/prisma/schema.prisma`
- Create: migration via `prisma migrate dev`
- Modify: `services/core/src/routes/leads.ts`

- [ ] **Step 1: Make `clientId` optional on the `Lead` model**

  In `services/core/prisma/schema.prisma`, find the `Lead` model and change:
  ```prisma
  // Before
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  // After
  clientId    String?
  client      Client?  @relation(fields: [clientId], references: [id], onDelete: Cascade)
  ```

  Also update the `@@index` entries — `clientId` in compound indexes is fine as nullable.

- [ ] **Step 2: Run the migration**

  ```bash
  cd services/core
  npx prisma migrate dev --name make-lead-clientid-optional
  ```
  Expected: creates a new migration file under `services/core/prisma/migrations/` and applies it.

- [ ] **Step 3: Update `logLeadActivity` to accept `clientId: string | null`**

  This single change handles all 6 call-sites in the file automatically — no other spots need individual null-guards.

  ```ts
  // Before
  async function logLeadActivity(input: { leadId: string; clientId: string; type: string; details?: string | null }): Promise<void> {
    await prisma.leadActivity.create({ ... });
  }

  // After
  async function logLeadActivity(input: { leadId: string; clientId: string | null; type: string; details?: string | null }): Promise<void> {
    if (!input.clientId) return; // Auto-prospect leads have no clientId — skip activity log
    await prisma.leadActivity.create({
      data: {
        leadId: input.leadId,
        clientId: input.clientId,  // TypeScript now knows this is string (non-null, guarded above)
        type: input.type,
        details: input.details ?? null
      }
    });
  }
  ```

- [ ] **Step 4: Update the `POST /leads` route to allow `clientId`-less creation for auto-sourced leads**

  In `services/core/src/routes/leads.ts`, replace the `clientId` resolution block (lines 85–96):

  ```ts
  // Before
  const clientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);
  if (!clientId) {
    reply.status(400);
    return { success: false, error: { code: "VALIDATION_ERROR", message: "client scope is required" } } as ApiResponse;
  }

  // After
  const resolvedClientId = resolveClientFilter(scope.role, scope.clientId, parsedBody.data.clientId);

  // Auto-prospect leads (source: "auto-prospect") may have no associated client yet.
  const isAutoProspect = parsedBody.data.source === "auto-prospect" && scope.role === "ADMIN";

  if (!resolvedClientId && !isAutoProspect) {
    reply.status(400);
    return { success: false, error: { code: "VALIDATION_ERROR", message: "client scope is required" } } as ApiResponse;
  }

  const clientId: string | null = resolvedClientId ?? null;
  ```

  Update the `prisma.lead.create` data block — `clientId` is now `string | null`. Prisma accepts null for an optional field. No other changes needed to the create call.

  Update the `eventBus.publish` call below the create — the `leadCreated` payload currently passes `clientId: lead.clientId`. After the schema change, `lead.clientId` is `string | null`. Pass it as optional:
  ```ts
  // In the eventBus.publish payload, change:
  clientId: lead.clientId,
  // To:
  clientId: lead.clientId ?? undefined,
  ```

- [ ] **Step 5: Update `GET /leads` to also return `clientId`-less leads when called by ADMIN**

  Current `GET /leads`: `const whereClause = clientId ? { clientId } : {};`
  With the nullable change, `resolveClientFilter("ADMIN", undefined, undefined)` returns `undefined`, so `whereClause = {}` — which already returns all leads including `clientId`-less ones. No change needed. ✓

- [ ] **Step 6: TypeScript check for core service**

  ```bash
  pnpm --filter @maphari/core exec tsc --noEmit
  ```
  Expected: zero errors. If you see `string | null is not assignable to string` errors anywhere in `leads.ts`, they will all be in `logLeadActivity` call-sites — the function signature change in Step 3 should resolve all of them.

- [ ] **Step 7: Commit**

  ```bash
  git add services/core/prisma/schema.prisma \
          services/core/prisma/migrations/ \
          services/core/src/routes/leads.ts
  git commit -m "feat: make Lead.clientId optional to support auto-sourced prospect leads"
  ```

---

## Task 5: Auto-Prospect — Hourly Cadence + DB Persistence + Cross-Run Dedup

**Files:**
- Modify: `services/ai/src/scripts/auto-prospect.ts`

After this task:
- Cadence comment reflects hourly execution
- Every prospect is persisted to DB via `POST /leads` (with `source: "auto-prospect"`)
- Extra fields (`address`, `rating`, `opportunityType`, `opportunityReason`, `leadScore`) that the `Lead` schema doesn't have columns for are stored serialised in the `notes` field
- Cross-run dedup guard: fetch existing leads before each run; skip companies already in DB
- AI service URL default remains `http://localhost:3003` (already correct in the existing script)

- [ ] **Step 1: Read the full current `auto-prospect.ts`**

  Read `services/ai/src/scripts/auto-prospect.ts` in full to understand the current `sendPitch` helper and `run` function.

- [ ] **Step 2: Update the header comment**

  Change:
  ```ts
  // Runs daily at 08:00.
  ```
  To:
  ```ts
  // Runs hourly. Each run picks a fresh random industry + location combination.
  ```

- [ ] **Step 3: Add `fetchExistingLeadNames` helper (cross-run dedup)**

  Add after the `pickRandomN` helper:

  ```ts
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
  ```

- [ ] **Step 4: Add `saveLead` helper (DB persistence)**

  Add after `fetchExistingLeadNames`:

  ```ts
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
  ```

- [ ] **Step 5: Rewrite the `run` function**

  Replace the existing `run` function body:

  ```ts
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
      } else {
        console.warn(`[auto-prospect] ✗ DB save failed: ${prospect.company}`);
      }

      // Send pitch email if contact email is available
      if (prospect.contactEmail && prospect.pitch) {
        const subject = `Quick question for ${prospect.company}`;
        const success = await sendPitch(aiBaseUrl, prospect.contactEmail, subject, prospect.pitch);
        if (success) {
          sent++;
          console.log(`[auto-prospect] ✉ Pitched: ${prospect.company} <${prospect.contactEmail}>`);
        }
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
  ```

- [ ] **Step 6: Update cron schedule if registered externally**

  Search for any cron registration file:
  ```bash
  grep -r "auto-prospect\|0 8 \* \* \*" . --include="*.sh" --include="*.yaml" --include="*.yml" --include="crontab" -l 2>/dev/null
  ```
  If found, change `0 8 * * *` (daily at 08:00) to `0 * * * *` (every hour).

- [ ] **Step 7: Commit**

  ```bash
  git add services/ai/src/scripts/auto-prospect.ts
  git commit -m "feat: auto-prospect runs hourly, persists leads to DB, cross-run dedup guard"
  ```

---

## Task 6: Improved Lead Scoring and Pitch Personalisation

**Files:**
- Modify: `services/ai/src/lib/prospecting.ts`

- [ ] **Step 1: Read `prospecting.ts` lines 20–45 and 310–375**

  Confirm the `ProspectResult` interface and `scoreProspect` / `generateOnePitch` functions.

- [ ] **Step 2: Add `industry` field to `ProspectResult` interface (MUST do this before any function changes)**

  ```ts
  export interface ProspectResult {
    name: string;
    company: string;
    website?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    rating?: number;
    industry?: string;         // ← add
    opportunityType: OpportunityFilter;
    opportunityReason: string;
    pitch: string;
    source: "serpapi" | "mock";
    healthScore?: number;
    healthIssues?: string[];
    leadScore?: number;
  }
  ```

- [ ] **Step 3: Add industry value tier constants (after the `LOCATIONS` array)**

  ```ts
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
  ```

- [ ] **Step 4: Update `scoreProspect` to use industry weighting**

  ```ts
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
  ```

- [ ] **Step 5: Update `classifyResults` to accept and propagate `industry`**

  Change the function signature:
  ```ts
  function classifyResults(
    results: SerpApiLocalResult[],
    filters: OpportunityFilter[],
    count: number,
    industry: string,   // ← add
  ): Omit<ProspectResult, "pitch">[]
  ```

  Inside each `prospects.push(...)` call add `industry` to the object:
  ```ts
  prospects.push({
    name: r.title ?? "Business Owner",
    company: r.title ?? "Unknown Business",
    industry,   // ← add to every push
    website: ...,
    // ... rest unchanged
  });
  ```

- [ ] **Step 6: Update `searchProspects` to pass `industry` into `classifyResults`**

  Find the `classifyResults(results, filters, count)` call inside `searchProspects` and change to:
  ```ts
  base = classifyResults(results, filters, count, industry);
  ```

- [ ] **Step 7: Enrich pitch context in `generateOnePitch`**

  Update the `contextLines` array:
  ```ts
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
  ```

- [ ] **Step 8: TypeScript check**

  ```bash
  pnpm --filter @maphari/ai exec tsc --noEmit
  ```
  Expected: zero errors.

- [ ] **Step 9: Commit**

  ```bash
  git add services/ai/src/lib/prospecting.ts
  git commit -m "feat: add industry to ProspectResult; improve lead scoring with industry tiers; richer pitch context"
  ```

---

## Task 7: Sync Frontend ProspectResult Type

**Files:**
- Modify: `apps/web/src/lib/api/admin/prospecting.ts`

- [ ] **Step 1: Add `industry?: string` to `ProspectResult` interface**

  ```ts
  export interface ProspectResult {
    name: string;
    company: string;
    website?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    rating?: number;
    industry?: string;          // ← add
    opportunityType: OpportunityFilter;
    opportunityReason: string;
    pitch: string;
    source: "serpapi" | "mock";
    healthScore?: number;
    healthIssues?: string[];
    leadScore?: number;
  }
  ```

- [ ] **Step 2: TypeScript check for web app**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: zero errors.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/lib/api/admin/prospecting.ts
  git commit -m "chore: add industry field to ProspectResult frontend type"
  ```

---

## Task 8: End-to-End Smoke Test

- [ ] **Step 1: Run auto-prospect script in mock mode (no `SERPAPI_KEY`)**

  ```bash
  npx tsx services/ai/src/scripts/auto-prospect.ts
  ```

  Expected output (with core service running):
  ```
  [auto-prospect] ── Hourly run ──
  [auto-prospect] Industry : <some industry>
  [auto-prospect] Location : <some location>
  [auto-prospect] Existing leads in DB: <N>
  [auto-prospect] Prospects found: 5
  [auto-prospect] ✓ Saved: Nkosi's Kitchen
  ...
  [auto-prospect] ── Run complete ──
  [auto-prospect] Saved to DB     : <N>
  ```

- [ ] **Step 2: Run a second time immediately — verify dedup fires**

  ```bash
  npx tsx services/ai/src/scripts/auto-prospect.ts
  ```

  Expected: any prospect company that was saved in Step 1 shows `⟳ Duplicate skipped`.

  > **Note:** Mock mode filters by `opportunityFilter`, and filters are randomly picked each run. If run 1 and run 2 select different filters, different mock subsets are returned, so not all companies are guaranteed to appear in both runs. The important thing to verify is that companies that DO appear in both runs are skipped — not that all 5 are skipped.

- [ ] **Step 3: Commit any smoke-test fixes**

  ```bash
  git add -p
  git commit -m "fix: smoke test corrections"
  ```

---

## Out of Scope (Future Plans)

These gaps exist but are complex enough to warrant their own spec + plan:

- **Follow-up cadence** — D+3, D+7, D+14 follow-up emails to non-responders via a cron that reads `LeadActivity` timestamps.
- **Reply / open tracking** — Resend webhooks updating lead status when a prospect opens or replies.
- **Smarter opportunity classification** — Actually crawl website to detect tech stack age, missing mobile viewport, missing SSL, etc., instead of round-robining filter types.
- **Lead notes UI** — Display the auto-prospect JSON stored in `notes` field as structured data in the admin prospecting page.

---

## Summary Checklist

- [ ] Task 1: ENV files — domain migration + new outreach vars
- [ ] Task 2: Source code fallbacks, support links, `sendEmail` `from` override
- [ ] Task 3: Pitch sends use `outreach@mapharitechnologies.com`
- [ ] Task 4: `Lead.clientId` optional; route allows auto-prospect creation
- [ ] Task 5: Auto-prospect hourly + DB persistence + dedup + correct port default
- [ ] Task 6: Industry tiers in scoring; richer pitch context; `industry` field propagated
- [ ] Task 7: Frontend type sync
- [ ] Task 8: Smoke test passes
