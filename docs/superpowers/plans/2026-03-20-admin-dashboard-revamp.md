# Admin Dashboard Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp all 93 admin dashboard pages — Executive Intelligence UI elevation (tab bars, KPI cards, skeletons, alert banners, health bars) + API wiring to replace all static placeholder data with real data.

**Architecture:** Task 0 lays CSS and utility foundations that all batch tasks depend on. Tasks 1–8 are fully independent batch agents — each owns its assigned pages completely, applying both Track A (UI) and Track B (functionality) in a single pass. Tasks 1–8 run in parallel after Task 0 completes.

**Tech Stack:** Next.js (App Router), TypeScript, CSS Modules, `withAuthorizedSession` API pattern, Syne + DM Mono fonts, `cx()` helper from `@/lib/utils/cx`

**Spec:** `docs/superpowers/specs/2026-03-20-admin-dashboard-revamp-design.md`

---

## Files Created or Modified

**CSS changes:**
- Modify: `apps/web/src/app/style/admin.module.css` — add `.kpiPurple`, `.kpiAmber`, `.kpiRed`
- Modify: `apps/web/src/app/style/admin/core.module.css` — add `.skeletonBlock`, `.skeletonCard`, `.alertBanner*`, `.healthBarBg`, `.healthBarFill`

**Utility:**
- Modify: `apps/web/src/lib/utils/format-money.ts` — add `formatMoneyK`

**Page files (93 total):**
- Modify: every `apps/web/src/components/admin/dashboard/pages/*.tsx` except `shared.tsx`, `admin-stub-page.tsx`, `admin-page-utils.tsx`

**API client additions (as needed per batch):**
- Modify: relevant files in `apps/web/src/lib/api/admin/` for any missing functions
- Modify: `apps/web/src/lib/api/admin/index.ts` — export any new functions

---

## Per-Page Process (applies to every page in every batch)

Every subagent follows this process for each page in their batch:

**Audit sweep first (before touching anything):**
1. `grep -n "<select" <file>` — identify tab-switcher selects (those driving `activeTab`) vs filter/sort selects (leave those alone)
2. `grep -n "if (loading)" <file>` — confirm skeleton exists; if missing, add one
3. `grep -n "error" <file>` — confirm error state; if missing, add one
4. `grep -n "\.map(" <file>` — verify all map calls have `key` props and empty-state branches
5. `grep -n "/ [a-z]" <file>` — spot bare division expressions needing NaN guards

**Apply changes:**
1. Replace `<select>` tab switchers → `tabBar`/`tabItem`/`tabItemActive` (classes from shared CSS — no new CSS needed)
2. Upgrade KPI cards to use `kpiPurple` (primary), `kpiAmber` (warning), `kpiRed` (critical)
3. Add alert banners (conditionally rendered) using `alertBanner*` classes
4. Add/fix skeleton loading state that mirrors real page layout
5. Add/fix error state with visible message + retry button
6. Ensure all `map()` calls have empty states using existing `EmptyState` component
7. Add NaN guards to all bare division
8. Wire API: add `useEffect` + `useState` + API function call (for non-context pages)

**CSS classes reference (all available via the spread — no new imports needed in TSX):**
- Tabs: `cx("tabBar")`, `cx("tabItem")`, `cx("tabItemActive")`
- KPI variants: `cx(styles.kpiCard, styles.kpiPurple/kpiAmber/kpiRed/kpiTeal/kpiSlate/kpiGold)`
- Alert banners: `cx(styles.alertBanner, styles.alertBannerInfo/alertBannerWarning/alertBannerCritical)`
- Skeleton: `cx("skeletonBlock")`, `cx("skeletonCard")`
- Health bars: `cx(styles.healthBarBg)`, `cx(styles.healthBarFill)`
- Existing shared: `cx("card")`, `cx("pageBody")`, `cx("pageHeader")`, `cx("pageTitle")`, `cx("pageEyebrow")`, `cx("pageSub")`, `cx("filterRow")`, `cx("fontMono")`, `cx("text10")`, `cx("text12")`, `cx("text13")`, `cx("fw700")`, `cx("uppercase")`, `cx("tracking")`, `cx("colorAccent")`, `cx("colorAmber")`, `cx("colorRed")`, `cx("colorMuted")`, `cx("flexRow")`, `cx("flexCol")`, `cx("gap8")`, `cx("gap12")`, `cx("gap16")`

**API wiring pattern (non-workspace-context pages only):**
```tsx
"use client";
import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadXWithRefresh } from "../../../../lib/api/admin/x";

export function XPage({ session }: { session: AuthSession }) {
  const [data, setData] = useState<XType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadXWithRefresh(session).then(result => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) { setError(result.error.message); setLoading(false); return; }
      setData(result.data ?? []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session, retryCount]);

  if (loading) return (/* skeleton approximating real layout */);
  if (error) return (
    <div className={styles.pageBody}>
      <div className={cx(styles.card, "p24", "flexCol", "gap12")}>
        <div className={cx("text13", "fw700", "colorRed")}>Failed to load data</div>
        <div className={cx("text12", "colorMuted")}>{error}</div>
        <button type="button" onClick={() => setRetryCount(c => c + 1)} className={cx("text11", "fw700")}>Retry</button>
      </div>
    </div>
  );
  // real page JSX
}
```

**Workspace-context pages (Track B = UI-only):** These 10 pages already receive data via `useAdminWorkspaceContext()` and must NOT have `useEffect`/API calls added: `admin-analytics-page-client.tsx`, `admin-audit-page-client.tsx`, `admin-automation-page-client.tsx`, `admin-billing-page-client.tsx`, `admin-clients-page-client.tsx`, `admin-integrations-page-client.tsx`, `admin-leads-page-client.tsx`, `admin-projects-page-client.tsx`, `admin-reports-page-client.tsx`, `admin-settings-page-client.tsx`. For these, apply Track A UI elevation only, using `snapshot.loading` for skeleton state.

---

## Task 0: CSS Foundations + formatMoneyK

**Prerequisite for all other tasks. Complete this first.**

**Files:**
- Modify: `apps/web/src/app/style/admin.module.css`
- Modify: `apps/web/src/app/style/admin/core.module.css`
- Modify: `apps/web/src/lib/utils/format-money.ts`
- Modify: `apps/web/src/components/admin/dashboard/pages/revenue-forecasting-page.tsx`

- [ ] **Step 1: Add KPI card variants to `admin.module.css`**

Open `apps/web/src/app/style/admin.module.css`. Find the `.kpiGold` class (around line 788). Add immediately after it:

```css
.kpiPurple {
  background: linear-gradient(160deg, rgba(139, 111, 255, 0.16) 0%, rgba(10, 12, 18, 0.95) 66%);
}

.kpiAmber {
  background: linear-gradient(160deg, rgba(251, 191, 36, 0.16) 0%, rgba(10, 12, 18, 0.95) 66%);
}

.kpiRed {
  background: linear-gradient(160deg, rgba(239, 68, 68, 0.16) 0%, rgba(10, 12, 18, 0.95) 66%);
}
```

- [ ] **Step 2: Add utility classes to `admin/core.module.css`**

Open `apps/web/src/app/style/admin/core.module.css`. Append at the end of the file:

```css
/* ─── Skeleton loading ────────────────────────────────────── */
@keyframes adminSkeletonPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
.skeletonBlock { background: rgba(255,255,255,0.06); border-radius: 4px; animation: adminSkeletonPulse 1.5s ease-in-out infinite; }
.skeletonCard  { animation: adminSkeletonPulse 1.5s ease-in-out infinite; }

/* ─── Alert banners ──────────────────────────────────────── */
.alertBanner {
  border-left: 3px solid;
  border-radius: 0 8px 8px 0;
  padding: 9px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.alertBannerInfo     { background: rgba(139, 111, 255, 0.08); border-color: var(--accent); }
.alertBannerWarning  { background: rgba(251, 191, 36, 0.06);  border-color: var(--amber); }
.alertBannerCritical { background: rgba(239, 68, 68, 0.06);   border-color: var(--red); }

/* ─── Health bars ────────────────────────────────────────── */
.healthBarBg   { flex: 1; background: var(--b1); border-radius: 3px; height: 4px; }
.healthBarFill { height: 4px; border-radius: 3px; transition: width 0.3s; }
```

- [ ] **Step 3: Verify classes are not duplicated**

```bash
grep -n "skeletonBlock\|alertBanner\|healthBarBg\|kpiPurple" \
  apps/web/src/app/style/admin/core.module.css \
  apps/web/src/app/style/admin.module.css
```

Expected: each class appears exactly once.

- [ ] **Step 4: Add `formatMoneyK` to `format-money.ts`**

Open `apps/web/src/lib/utils/format-money.ts`. Add at the end:

```ts
/** Abbreviate cents to a compact KPI label — e.g. 8_400_000 → "R84k" */
export function formatMoneyK(cents: number): string {
  return `R${(cents / 100_000).toFixed(0)}k`;
}
```

- [ ] **Step 5: Replace inline `centsToK` in `revenue-forecasting-page.tsx`**

In `apps/web/src/components/admin/dashboard/pages/revenue-forecasting-page.tsx`:
- Add import: `import { formatMoneyK } from "@/lib/utils/format-money";`
- Delete the inline `function centsToK(cents: number): string { ... }` definition
- Replace all calls `centsToK(...)` with `formatMoneyK(...)`

```bash
grep -n "centsToK" apps/web/src/components/admin/dashboard/pages/revenue-forecasting-page.tsx
```

Expected: zero results.

- [ ] **Step 6: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: zero errors.

- [ ] **Step 7: Verify and update `admin/index.ts` barrel**

Several files exist in `apps/web/src/lib/api/admin/` but are not yet exported from `index.ts`. Check which are missing:

```bash
grep -o "from '\./[^']*'" apps/web/src/lib/api/admin/index.ts | sort
```

Common files that may be absent: `automation`, `webhooks`, `prospecting`, `pipeline`, `capacity`, `documents`, `contracts`, `utilisation`, `support`, `loyalty`, `vendors`, `closeout`, `onboarding`. For each missing file, add:

```ts
export * from "./filename";
```

Then verify no duplicate exports:
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep "duplicate" | head -10
```

- [ ] **Step 8: Commit**

```bash
git add \
  apps/web/src/app/style/admin.module.css \
  apps/web/src/app/style/admin/core.module.css \
  apps/web/src/lib/utils/format-money.ts \
  apps/web/src/components/admin/dashboard/pages/revenue-forecasting-page.tsx \
  apps/web/src/lib/api/admin/index.ts
git commit -m "feat(admin): add CSS foundations + formatMoneyK + barrel exports for dashboard revamp"
```

---

## Task 1: Batch 1 — Command (6 pages)

**Depends on Task 0. Can run in parallel with Tasks 2–8.**

**Pages to process:**
1. `owners-workspace-page.tsx`
2. `executive-dashboard-page.tsx`
3. `business-development-page.tsx`
4. `ai-action-recommendations-page.tsx`
5. `decision-registry-page.tsx`
6. `eod-digest-page.tsx`

All pages are in `apps/web/src/components/admin/dashboard/pages/`.

Follow the **Per-Page Process** defined above for each page.

**API functions for this batch:**

| Page | API function | Import from |
|------|-------------|-------------|
| `owners-workspace-page.tsx` | `loadDecisionRecordsWithRefresh` | `../../../../lib/api/admin/governance` |
| `executive-dashboard-page.tsx` | Already wired — ensure `saveSession` is called | — |
| `business-development-page.tsx` | `loadAdminSnapshotWithRefresh` | `../../../../lib/api/admin/clients` |
| `ai-action-recommendations-page.tsx` | No API call — compute from snapshot or skip wiring | — |
| `decision-registry-page.tsx` | `loadDecisionRecordsWithRefresh` | `../../../../lib/api/admin/governance` |
| `eod-digest-page.tsx` | `loadAnnouncementsWithRefresh` | `../../../../lib/api/admin/governance` |

**Page-specific UI notes:**
- `owners-workspace-page.tsx` — currently uses `<select>` for tab switching between "owner dashboard", "personal okrs", "decision journal", "private notes". Replace with tab bar. Add `kpiPurple` KPI cards to the owner dashboard tab. Add skeleton for all 4 tabs.
- `executive-dashboard-page.tsx` — already wired to real data. Replace `<select>` with tab bar. Add `alertBannerWarning` for overdue invoices, `alertBannerCritical` for critical health alerts. Upgrade primary KPI card to `kpiPurple`.
- `business-development-page.tsx` — derive MRR, pipeline value, and lead count from `AdminSnapshot` (clients, leads, invoices arrays). Add 4-card KPI strip.
- `ai-action-recommendations-page.tsx` — no API call. Add skeleton and meaningful empty state with `variant="data"`.
- `decision-registry-page.tsx` — replace `<select>` tabs. Wire to `loadDecisionRecordsWithRefresh`. Show decisions in a card list with date, title, tags, outcome.
- `eod-digest-page.tsx` — wire to `loadAnnouncementsWithRefresh`. Show today's announcements in a feed. Add empty state "No digest entries for today."

- [ ] **Step 1: Process `owners-workspace-page.tsx`** — audit sweep, replace select tab, add `kpiPurple` KPI row, add skeleton, wire `loadDecisionRecordsWithRefresh`

- [ ] **Step 2: Process `executive-dashboard-page.tsx`** — audit sweep, replace select with tab bar, add alert banners, upgrade KPI card to `kpiPurple`, verify `saveSession` is called

- [ ] **Step 3: Process `business-development-page.tsx`** — audit sweep, add skeleton, wire `loadAdminSnapshotWithRefresh`, derive KPI metrics (MRR from invoices, lead count from leads)

- [ ] **Step 4: Process `ai-action-recommendations-page.tsx`** — audit sweep, add skeleton, add contextual empty state

- [ ] **Step 5: Process `decision-registry-page.tsx`** — audit sweep, replace select tab, add skeleton, wire `loadDecisionRecordsWithRefresh`

- [ ] **Step 6: Process `eod-digest-page.tsx`** — audit sweep, add skeleton, wire `loadAnnouncementsWithRefresh`, add empty state

- [ ] **Step 7: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

Expected: zero errors.

- [ ] **Step 8: Verify no select-tab switchers remain**

```bash
grep -n "activeTab\|setActiveTab" \
  apps/web/src/components/admin/dashboard/pages/owners-workspace-page.tsx \
  apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx \
  apps/web/src/components/admin/dashboard/pages/decision-registry-page.tsx
```

Confirm none of these lines also appear alongside a `<select` element driving the same state.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/owners-workspace-page.tsx \
        apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx \
        apps/web/src/components/admin/dashboard/pages/business-development-page.tsx \
        apps/web/src/components/admin/dashboard/pages/ai-action-recommendations-page.tsx \
        apps/web/src/components/admin/dashboard/pages/decision-registry-page.tsx \
        apps/web/src/components/admin/dashboard/pages/eod-digest-page.tsx
git commit -m "feat(admin): revamp batch 1 — command pages (UI elevation + API wiring)"
```

---

## Task 2: Batch 2 — Revenue (7 pages)

**Depends on Task 0. Can run in parallel with Tasks 1, 3–8.**

**Pages to process:**
1. `leads-page.tsx`
2. `prospecting-page.tsx`
3. `pipeline-analytics-page.tsx`
4. `revops-dashboard-page.tsx`
5. `revenue-forecasting-page.tsx`
6. `referral-tracking-page.tsx`
7. `invoice-chasing-page.tsx`

Follow the **Per-Page Process** defined above.

**API functions for this batch:**

| Page | API function | Import from |
|------|-------------|-------------|
| `leads-page.tsx` | UI-only (workspace context) — use `snapshot.loading` for skeleton | — |
| `prospecting-page.tsx` | `loadProspectingDataWithRefresh` | `../../../../lib/api/admin/prospecting` |
| `pipeline-analytics-page.tsx` | `loadPipelineSummaryWithRefresh` | `../../../../lib/api/admin/pipeline` |
| `revops-dashboard-page.tsx` | `loadBillingSnapshotWithRefresh` | `../../../../lib/api/admin/billing` |
| `revenue-forecasting-page.tsx` | Already wired — upgrade UI only | — |
| `referral-tracking-page.tsx` | Check `clients.ts` for referral function; add `loadReferralsWithRefresh` if missing | `../../../../lib/api/admin/clients` |
| `invoice-chasing-page.tsx` | `loadBillingSnapshotWithRefresh` — filter for overdue invoices | `../../../../lib/api/admin/billing` |

**Page-specific UI notes:**
- `leads-page.tsx` — workspace context page. Apply UI-only: replace `<select>` with tab bar (if present), upgrade KPI strip with `kpiPurple`, add severity row highlighting (red border for high-priority leads), ensure skeleton uses `snapshot.loading`.
- `prospecting-page.tsx` — check if `loadProspectingDataWithRefresh` exists in `prospecting.ts`; if missing, add it (call `/admin/prospecting`).
- `pipeline-analytics-page.tsx` — show pipeline stages as horizontal funnel bars using inline `style={{ width: \`${pct}%\` }}`. KPI strip with 4 cards.
- `revops-dashboard-page.tsx` — `kpiPurple` on primary MRR card. Alert banners for overdue invoices. Tab bar for sections.
- `revenue-forecasting-page.tsx` — already wired. Replace any `<select>` with tab bar. Replace `centsToK` calls with `formatMoneyK` (Task 0 already does this in this file — verify it's done, don't redo it).
- `referral-tracking-page.tsx` — KPI strip (total referrals, converted, conversion rate). Table with referrer name, referred client, status, value.
- `invoice-chasing-page.tsx` — alert banners for overdue count. Severity table (red rows for >30 days overdue, amber for 14–30 days). Filter chips: All / Overdue / Sent / Paid.

- [ ] **Step 1: Check for missing API functions**

```bash
grep -n "loadProspectingDataWithRefresh\|loadPipelineSummaryWithRefresh\|loadBillingSnapshotWithRefresh\|loadReferralsWithRefresh" \
  apps/web/src/lib/api/admin/prospecting.ts \
  apps/web/src/lib/api/admin/pipeline.ts \
  apps/web/src/lib/api/admin/billing.ts \
  apps/web/src/lib/api/admin/clients.ts 2>/dev/null
```

For any function not found, add it to the appropriate file following the B2 pattern from the spec. Then add it to `apps/web/src/lib/api/admin/index.ts`.

- [ ] **Step 2: Process `leads-page.tsx`** — UI-only: audit sweep, replace select tab, add severity row highlighting, verify skeleton uses workspace context `loading`

- [ ] **Step 3: Process `prospecting-page.tsx`** — audit sweep, add skeleton, wire API, KPI strip

- [ ] **Step 4: Process `pipeline-analytics-page.tsx`** — audit sweep, add skeleton, wire API, funnel bar chart, tab bar

- [ ] **Step 5: Process `revops-dashboard-page.tsx`** — audit sweep, add skeleton, wire API, `kpiPurple` KPI grid, alert banners, tab bar

- [ ] **Step 6: Process `revenue-forecasting-page.tsx`** — audit sweep, replace select with tab bar, verify `formatMoneyK` import is correct (from Task 0)

- [ ] **Step 7: Process `referral-tracking-page.tsx`** — audit sweep, add skeleton, wire API, KPI strip, table

- [ ] **Step 8: Process `invoice-chasing-page.tsx`** — audit sweep, add skeleton, wire API, alert banners, severity table, filter chips

- [ ] **Step 9: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/leads-page.tsx \
        apps/web/src/components/admin/dashboard/pages/prospecting-page.tsx \
        apps/web/src/components/admin/dashboard/pages/pipeline-analytics-page.tsx \
        apps/web/src/components/admin/dashboard/pages/revops-dashboard-page.tsx \
        apps/web/src/components/admin/dashboard/pages/revenue-forecasting-page.tsx \
        apps/web/src/components/admin/dashboard/pages/referral-tracking-page.tsx \
        apps/web/src/components/admin/dashboard/pages/invoice-chasing-page.tsx \
        apps/web/src/lib/api/admin/
git commit -m "feat(admin): revamp batch 2 — revenue pages (UI elevation + API wiring)"
```

---

## Task 3: Batch 3 — Clients (9 pages)

**Depends on Task 0. Can run in parallel with Tasks 1–2, 4–8.**

**Pages to process:**
1. `clients-projects-page.tsx`
2. `client-journey-page.tsx`
3. `client-health-scorecard-page.tsx`
4. `client-satisfaction-page.tsx`
5. `lifecycle-dashboard-page.tsx`
6. `client-onboarding-page.tsx`
7. `client-offboarding-page.tsx`
8. `loyalty-credits-page.tsx`
9. `sla-tracker-page.tsx`

Follow the **Per-Page Process** defined above.

**API functions for this batch:**

| Page | API function | Import from |
|------|-------------|-------------|
| `clients-projects-page.tsx` | UI-only (workspace context `snapshot`) | — |
| `client-journey-page.tsx` | `loadClientJourneyWithRefresh` (add to `client-ops.ts` if missing) | `../../../../lib/api/admin/client-ops` |
| `client-health-scorecard-page.tsx` | `loadAllHealthScoresWithRefresh` | `../../../../lib/api/admin/client-ops` |
| `client-satisfaction-page.tsx` | `loadAllSatisfactionSurveysWithRefresh` | `../../../../lib/api/admin/client-ops` |
| `lifecycle-dashboard-page.tsx` | `loadClientLifecycleWithRefresh` (add to `client-ops.ts` if missing) | `../../../../lib/api/admin/client-ops` |
| `client-onboarding-page.tsx` | `loadOnboardingStatusWithRefresh` | `../../../../lib/api/admin/onboarding` |
| `client-offboarding-page.tsx` | `loadOffboardingStatusWithRefresh` | `../../../../lib/api/admin/closeout` |
| `loyalty-credits-page.tsx` | `loadLoyaltyCreditsWithRefresh` | `../../../../lib/api/admin/loyalty` |
| `sla-tracker-page.tsx` | `loadSLADataWithRefresh` (add to `billing.ts` if missing) | `../../../../lib/api/admin/billing` |

**Page-specific UI notes:**
- `clients-projects-page.tsx` — workspace context page (UI-only). Apply expandable table rows (clicking a client row reveals its projects). KPI strip: Total MRR, Active Clients, Active Projects, At-Risk count. Health bars with colour thresholds. Severity row: red left border for health <50, amber for health 50–69. Filter chips: All / Retainer / Project / At-Risk. Pagination at bottom.
- `client-health-scorecard-page.tsx` — KPI strip with `kpiPurple` (avg health), `kpiAmber` (at-risk count), `kpiRed` (critical count). Health bars for each client. Alert banners for clients below 50.
- `client-satisfaction-page.tsx` — KPI strip with satisfaction score. Bar chart of survey responses. Tab bar: Recent / By Client / Trends.
- `client-onboarding-page.tsx` / `client-offboarding-page.tsx` — step progress indicator (numbered steps, current step highlighted in `--accent`). KPI strip.
- `sla-tracker-page.tsx` — alert banners for SLA breaches. Severity table. Color thresholds: green (met), amber (at risk), red (breached).

- [ ] **Step 1: Check and add missing API functions in `client-ops.ts` and `billing.ts`**

- [ ] **Step 2: Process `clients-projects-page.tsx`** — UI-only, expandable rows, KPI strip, health bars, filter chips, pagination

- [ ] **Step 3: Process `client-journey-page.tsx`** — audit, add skeleton, wire API, tab bar

- [ ] **Step 4: Process `client-health-scorecard-page.tsx`** — audit, add skeleton, wire API, KPI strip with kpiPurple/kpiAmber/kpiRed, health bars, alert banners

- [ ] **Step 5: Process `client-satisfaction-page.tsx`** — audit, add skeleton, wire API, KPI strip, tab bar

- [ ] **Step 6: Process `lifecycle-dashboard-page.tsx`** — audit, add skeleton, wire API, stage funnel bars, tab bar

- [ ] **Step 7: Process `client-onboarding-page.tsx`** — audit, add skeleton, wire API, step progress, KPI strip

- [ ] **Step 8: Process `client-offboarding-page.tsx`** — audit, add skeleton, wire API, step progress, alert banners

- [ ] **Step 9: Process `loyalty-credits-page.tsx`** — audit, add skeleton, wire API, KPI strip, table

- [ ] **Step 10: Process `sla-tracker-page.tsx`** — audit, add skeleton, wire API, alert banners, severity table

- [ ] **Step 11: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 12: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/clients-projects-page.tsx \
        apps/web/src/components/admin/dashboard/pages/client-journey-page.tsx \
        apps/web/src/components/admin/dashboard/pages/client-health-scorecard-page.tsx \
        apps/web/src/components/admin/dashboard/pages/client-satisfaction-page.tsx \
        apps/web/src/components/admin/dashboard/pages/lifecycle-dashboard-page.tsx \
        apps/web/src/components/admin/dashboard/pages/client-onboarding-page.tsx \
        apps/web/src/components/admin/dashboard/pages/client-offboarding-page.tsx \
        apps/web/src/components/admin/dashboard/pages/loyalty-credits-page.tsx \
        apps/web/src/components/admin/dashboard/pages/sla-tracker-page.tsx \
        apps/web/src/lib/api/admin/
git commit -m "feat(admin): revamp batch 3 — client pages (UI elevation + API wiring)"
```

---

## Task 4: Batch 4 — Projects (9 pages)

**Depends on Task 0. Can run in parallel with Tasks 1–3, 5–8.**

**Pages to process:**
1. `project-portfolio-page.tsx`
2. `project-operations-page.tsx`
3. `sprint-board-admin-page.tsx`
4. `timeline-gantt-page.tsx`
5. `capacity-forecast-page.tsx`
6. `resource-allocation-page.tsx`
7. `portfolio-risk-register-page.tsx`
8. `change-request-manager-page.tsx`
9. `quality-assurance-page.tsx`

Follow the **Per-Page Process** defined above.

**API functions for this batch:**

| Page | API function | Import from |
|------|-------------|-------------|
| `project-portfolio-page.tsx` | UI-only (workspace context `snapshot.projects`) | — |
| `project-operations-page.tsx` | `loadProjectOpsDataWithRefresh` | `../../../../lib/api/admin/project-ops` |
| `sprint-board-admin-page.tsx` | `loadSprintBoardWithRefresh` | `../../../../lib/api/admin/project-ops` |
| `timeline-gantt-page.tsx` | `loadProjectTimelineWithRefresh` | `../../../../lib/api/admin/project-layer` |
| `capacity-forecast-page.tsx` | `loadCapacityForecastWithRefresh` | `../../../../lib/api/admin/capacity` |
| `resource-allocation-page.tsx` | `loadResourceAllocationWithRefresh` | `../../../../lib/api/admin/capacity` |
| `portfolio-risk-register-page.tsx` | `loadAllPortfolioRisksWithRefresh` | `../../../../lib/api/admin/governance` |
| `change-request-manager-page.tsx` | `loadChangeRequestsWithRefresh` | `../../../../lib/api/admin/project-ops` |
| `quality-assurance-page.tsx` | `loadQADataWithRefresh` | `../../../../lib/api/admin/project-ops` |

**Page-specific UI notes:**
- `project-portfolio-page.tsx` — workspace context (UI-only). Expandable table: each project row expands to show phase list, current phase, budget used. KPI strip: Active Projects, At-Risk, On Track, Avg Health.
- `sprint-board-admin-page.tsx` — 3-column kanban: Todo / In Progress / Done. Each card shows project name, assignee, priority badge. KPI strip above.
- `timeline-gantt-page.tsx` — month navigation (prev/next buttons). Gantt rows with project name + coloured bar spanning date range. Use `--accent` for on-track, `--amber` for at-risk.
- `capacity-forecast-page.tsx` — `kpiPurple` utilisation card. Donut chart using existing donut CSS classes from `core.module.css`.
- `portfolio-risk-register-page.tsx` — alert banners for critical risks. Severity table (red rows for critical, amber for high). KPI strip: Total Risks, Critical, High, Medium.

- [ ] **Step 1: Check and add missing API functions in `project-ops.ts`, `project-layer.ts`, `capacity.ts`**

- [ ] **Step 2: Process `project-portfolio-page.tsx`** — UI-only, expandable table, KPI strip

- [ ] **Step 3: Process `project-operations-page.tsx`** — audit, skeleton, wire API, tab bar, board+list toggle

- [ ] **Step 4: Process `sprint-board-admin-page.tsx`** — audit, skeleton, wire API, kanban columns

- [ ] **Step 5: Process `timeline-gantt-page.tsx`** — audit, skeleton, wire API, gantt bars, month nav

- [ ] **Step 6: Process `capacity-forecast-page.tsx`** — audit, skeleton, wire API, donut chart, `kpiPurple` KPI strip

- [ ] **Step 7: Process `resource-allocation-page.tsx`** — audit, skeleton, wire API, assignment table, progress bars

- [ ] **Step 8: Process `portfolio-risk-register-page.tsx`** — audit, skeleton, wire API, alert banners, severity table

- [ ] **Step 9: Process `change-request-manager-page.tsx`** — audit, skeleton, wire API, tab bar, table

- [ ] **Step 10: Process `quality-assurance-page.tsx`** — audit, skeleton, wire API, tab bar, score cards

- [ ] **Step 11: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 12: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/project-portfolio-page.tsx \
        apps/web/src/components/admin/dashboard/pages/project-operations-page.tsx \
        apps/web/src/components/admin/dashboard/pages/sprint-board-admin-page.tsx \
        apps/web/src/components/admin/dashboard/pages/timeline-gantt-page.tsx \
        apps/web/src/components/admin/dashboard/pages/capacity-forecast-page.tsx \
        apps/web/src/components/admin/dashboard/pages/resource-allocation-page.tsx \
        apps/web/src/components/admin/dashboard/pages/portfolio-risk-register-page.tsx \
        apps/web/src/components/admin/dashboard/pages/change-request-manager-page.tsx \
        apps/web/src/components/admin/dashboard/pages/quality-assurance-page.tsx \
        apps/web/src/lib/api/admin/
git commit -m "feat(admin): revamp batch 4 — project pages (UI elevation + API wiring)"
```

---

## Task 5: Batch 5 — Finance (8 pages)

**Depends on Task 0. Can run in parallel with Tasks 1–4, 6–8.**

**Pages to process:**
1. `invoices-page.tsx`
2. `payroll-ledger-page.tsx`
3. `cash-flow-calendar-page.tsx`
4. `expense-tracker-page.tsx`
5. `profitability-per-client-page.tsx`
6. `profitability-per-project-page.tsx`
7. `financial-year-closeout-page.tsx`
8. `vendor-cost-control-page.tsx`

Follow the **Per-Page Process** defined above.

**API functions for this batch:**

| Page | API function | Import from |
|------|-------------|-------------|
| `invoices-page.tsx` | UI-only (workspace context `snapshot.invoices`) | — |
| `payroll-ledger-page.tsx` | `loadPayrollWithRefresh` | `../../../../lib/api/admin/expenses` |
| `cash-flow-calendar-page.tsx` | `loadCashFlowWithRefresh` (add to `billing.ts` if missing) | `../../../../lib/api/admin/billing` |
| `expense-tracker-page.tsx` | `loadExpensesWithRefresh` | `../../../../lib/api/admin/expenses` |
| `profitability-per-client-page.tsx` | `loadProfitabilityByClientWithRefresh` (check `billing.ts`) | `../../../../lib/api/admin/billing` |
| `profitability-per-project-page.tsx` | `loadProfitabilityByProjectWithRefresh` (check `billing.ts`) | `../../../../lib/api/admin/billing` |
| `financial-year-closeout-page.tsx` | `loadCloseoutDataWithRefresh` | `../../../../lib/api/admin/closeout` |
| `vendor-cost-control-page.tsx` | `loadVendorCostsWithRefresh` | `../../../../lib/api/admin/vendors` |

**Page-specific UI notes:**
- `invoices-page.tsx` — workspace context (UI-only). Severity table: red rows for overdue invoices. Alert banner if any invoices are overdue. Filter chips: All / Draft / Sent / Overdue / Paid. KPI strip: `kpiPurple` (total outstanding), `kpiAmber` (overdue count), neutral (paid this month), neutral (draft).
- `cash-flow-calendar-page.tsx` — calendar grid with month nav. Event chips: green for payments received, amber for invoices due, red for overdue. List view toggle tab.
- `profitability-per-client-page.tsx` / `profitability-per-project-page.tsx` — replace `<select>` tab if present. KPI strip with `formatMoneyK` for currency values.
- `vendor-cost-control-page.tsx` — KPI strip: total vendor spend, number of vendors, largest vendor cost. Table with vendor name, category, monthly cost, trend arrow.

- [ ] **Step 1: Check and add missing API functions in `billing.ts`, `expenses.ts`**

```bash
grep -n "loadPayrollWithRefresh\|loadCashFlowWithRefresh\|loadExpensesWithRefresh\|loadProfitabilityBy\|loadVendorCostsWithRefresh" \
  apps/web/src/lib/api/admin/billing.ts \
  apps/web/src/lib/api/admin/expenses.ts \
  apps/web/src/lib/api/admin/vendors.ts 2>/dev/null
```

- [ ] **Step 2: Process `invoices-page.tsx`** — UI-only, severity table, alert banners, filter chips, KPI strip

- [ ] **Step 3: Process `payroll-ledger-page.tsx`** — audit, skeleton, wire API, KPI strip, table

- [ ] **Step 4: Process `cash-flow-calendar-page.tsx`** — audit, skeleton, wire API, calendar grid, month nav, list toggle

- [ ] **Step 5: Process `expense-tracker-page.tsx`** — audit, skeleton, wire API, KPI strip, category bars, table

- [ ] **Step 6: Process `profitability-per-client-page.tsx`** — audit, replace select tab, skeleton (if missing), wire API

- [ ] **Step 7: Process `profitability-per-project-page.tsx`** — audit, replace select tab, skeleton (if missing), wire API

- [ ] **Step 8: Process `financial-year-closeout-page.tsx`** — audit, skeleton, wire API, step progress, KPI strip, alert banners

- [ ] **Step 9: Process `vendor-cost-control-page.tsx`** — audit, skeleton, wire API, KPI strip, table

- [ ] **Step 10: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 11: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/invoices-page.tsx \
        apps/web/src/components/admin/dashboard/pages/payroll-ledger-page.tsx \
        apps/web/src/components/admin/dashboard/pages/cash-flow-calendar-page.tsx \
        apps/web/src/components/admin/dashboard/pages/expense-tracker-page.tsx \
        apps/web/src/components/admin/dashboard/pages/profitability-per-client-page.tsx \
        apps/web/src/components/admin/dashboard/pages/profitability-per-project-page.tsx \
        apps/web/src/components/admin/dashboard/pages/financial-year-closeout-page.tsx \
        apps/web/src/components/admin/dashboard/pages/vendor-cost-control-page.tsx \
        apps/web/src/lib/api/admin/
git commit -m "feat(admin): revamp batch 5 — finance pages (UI elevation + API wiring)"
```

---

## Task 6: Batch 6 — People (13 pages)

**Depends on Task 0. Can run in parallel with Tasks 1–5, 7–8.**

**Pages to process:**
1. `staff-access-page.tsx`
2. `employment-records-page.tsx`
3. `staff-satisfaction-page.tsx`
4. `staff-utilisation-page.tsx`
5. `staff-transition-planner-page.tsx`
6. `staff-onboarding-page.tsx`
7. `peer-review-queue-page.tsx`
8. `recruitment-pipeline-page.tsx`
9. `leave-absence-page.tsx`
10. `learning-development-page.tsx`
11. `team-structure-page.tsx`
12. `team-performance-report-page.tsx`
13. `standup-feed-page.tsx`

All in `apps/web/src/components/admin/dashboard/pages/`. Follow the **Per-Page Process**.

**API functions for this batch:**

| Page | API function | Import from |
|------|-------------|-------------|
| `staff-access-page.tsx` | `loadAllStaffWithRefresh` | `../../../../lib/api/admin/hr` |
| `employment-records-page.tsx` | `loadEmploymentRecordsWithRefresh` (add if missing) | `../../../../lib/api/admin/hr` |
| `staff-satisfaction-page.tsx` | `loadAllSatisfactionSurveysWithRefresh` | `../../../../lib/api/admin/client-ops` |
| `staff-utilisation-page.tsx` | `loadUtilisationWithRefresh` | `../../../../lib/api/admin/utilisation` |
| `staff-transition-planner-page.tsx` | `loadTransitionPlansWithRefresh` (add if missing) | `../../../../lib/api/admin/hr` |
| `staff-onboarding-page.tsx` | `loadStaffOnboardingWithRefresh` | `../../../../lib/api/admin/hr` |
| `peer-review-queue-page.tsx` | `loadAdminPeerReviewsWithRefresh` | `../../../../lib/api/admin/hr` |
| `recruitment-pipeline-page.tsx` | `loadRecruitmentPipelineWithRefresh` (add if missing) | `../../../../lib/api/admin/hr` |
| `leave-absence-page.tsx` | `loadLeaveRequestsWithRefresh` (add if missing) | `../../../../lib/api/admin/hr` |
| `learning-development-page.tsx` | `loadTrainingDataWithRefresh` (add if missing) | `../../../../lib/api/admin/hr` |
| `team-structure-page.tsx` | `loadAllStaffWithRefresh` | `../../../../lib/api/admin/hr` |
| `team-performance-report-page.tsx` | `loadUtilisationWithRefresh` | `../../../../lib/api/admin/utilisation` |
| `standup-feed-page.tsx` | `loadStandupFeedWithRefresh` | `../../../../lib/api/admin/hr` |

**Page-specific UI notes:**
- `staff-utilisation-page.tsx` — `kpiPurple` for billable utilisation. Donut chart (reuse existing donut CSS). Bar chart per staff member.
- `recruitment-pipeline-page.tsx` — kanban columns: Applied / Screening / Interview / Offer / Hired. KPI strip: Open Roles, Applicants, Avg Time-to-Hire.
- `leave-absence-page.tsx` — calendar grid showing approved/pending/rejected leave. Tab bar: Calendar / List. Table below with leave requests.
- `standup-feed-page.tsx` — date navigation (prev/next day buttons). Feed of standup entries grouped by staff member. Empty state if no standups today.
- `staff-satisfaction-page.tsx` — filter for staff type. Note this uses the same API as `client-satisfaction-page.tsx` — derive from `loadAllSatisfactionSurveysWithRefresh` and filter by `type === 'staff'`.

- [ ] **Step 1: Check and add missing API functions in `hr.ts`**

```bash
grep -n "loadEmploymentRecords\|loadTransitionPlans\|loadRecruitmentPipeline\|loadLeaveRequests\|loadTrainingData\|loadStaffOnboarding" \
  apps/web/src/lib/api/admin/hr.ts
```

- [ ] **Step 2: Process `staff-access-page.tsx`** — audit, skeleton, wire `loadAllStaffWithRefresh`, table with role badges

- [ ] **Step 3: Process `employment-records-page.tsx`** — audit, skeleton, wire API, tab bar, table

- [ ] **Step 4: Process `staff-satisfaction-page.tsx`** — audit, skeleton, wire `loadAllSatisfactionSurveysWithRefresh` (filter `type === 'staff'`), KPI strip, bar chart

- [ ] **Step 5: Process `staff-utilisation-page.tsx`** — audit, skeleton, wire `loadUtilisationWithRefresh`, donut chart, `kpiPurple` KPI strip, per-staff bar chart

- [ ] **Step 6: Process `staff-transition-planner-page.tsx`** — audit, skeleton, wire API, tab bar, table

- [ ] **Step 7: Process `staff-onboarding-page.tsx`** — audit, skeleton, wire `loadStaffOnboardingWithRefresh`, step progress, KPI strip

- [ ] **Step 8: Process `peer-review-queue-page.tsx`** — audit, skeleton, wire `loadAdminPeerReviewsWithRefresh`, tab bar, severity table

- [ ] **Step 9: Process `recruitment-pipeline-page.tsx`** — audit, skeleton, wire API, kanban columns, KPI strip

- [ ] **Step 10: Process `leave-absence-page.tsx`** — audit, skeleton, wire API, calendar grid, table, tab bar

- [ ] **Step 11: Process `learning-development-page.tsx`** — audit, skeleton, wire API, progress bars, table

- [ ] **Step 12: Process `team-structure-page.tsx`** — audit, skeleton, wire `loadAllStaffWithRefresh`, KPI strip, staff table

- [ ] **Step 13: Process `team-performance-report-page.tsx`** — audit, skeleton, wire `loadUtilisationWithRefresh`, tab bar, score cards

- [ ] **Step 14: Process `standup-feed-page.tsx`** — audit, skeleton, wire `loadStandupFeedWithRefresh`, date nav, feed list, empty state

- [ ] **Step 15: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 16: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/staff-access-page.tsx \
        apps/web/src/components/admin/dashboard/pages/employment-records-page.tsx \
        apps/web/src/components/admin/dashboard/pages/staff-satisfaction-page.tsx \
        apps/web/src/components/admin/dashboard/pages/staff-utilisation-page.tsx \
        apps/web/src/components/admin/dashboard/pages/staff-transition-planner-page.tsx \
        apps/web/src/components/admin/dashboard/pages/staff-onboarding-page.tsx \
        apps/web/src/components/admin/dashboard/pages/peer-review-queue-page.tsx \
        apps/web/src/components/admin/dashboard/pages/recruitment-pipeline-page.tsx \
        apps/web/src/components/admin/dashboard/pages/leave-absence-page.tsx \
        apps/web/src/components/admin/dashboard/pages/learning-development-page.tsx \
        apps/web/src/components/admin/dashboard/pages/team-structure-page.tsx \
        apps/web/src/components/admin/dashboard/pages/team-performance-report-page.tsx \
        apps/web/src/components/admin/dashboard/pages/standup-feed-page.tsx \
        apps/web/src/lib/api/admin/
git commit -m "feat(admin): revamp batch 6 — people pages (UI elevation + API wiring)"
```

---

## Task 7: Batch 7 — Intelligence (10 pages)

**Depends on Task 0. Can run in parallel with Tasks 1–6, 8.**

**Pages to process:**
1. `strategic-client-intelligence-page.tsx`
2. `competitor-market-intel-page.tsx`
3. `communication-audit-page.tsx`
4. `health-interventions-page.tsx`
5. `crisis-command-page.tsx`
6. `active-health-monitor-page.tsx`
7. `project-briefing-page.tsx`
8. `closeout-review-page.tsx`
9. `booking-appointments-page.tsx`
10. `meeting-archive-page.tsx`

Follow the **Per-Page Process** defined above.

**API functions for this batch:**

| Page | API function | Import from |
|------|-------------|-------------|
| `strategic-client-intelligence-page.tsx` | `loadClientIntelligenceWithRefresh` (add if missing) | `../../../../lib/api/admin/client-ops` |
| `competitor-market-intel-page.tsx` | `loadMarketIntelWithRefresh` (add if missing) | `../../../../lib/api/admin/prospecting` |
| `communication-audit-page.tsx` | `loadAllCommLogsWithRefresh` | `../../../../lib/api/admin/client-ops` |
| `health-interventions-page.tsx` | `loadAllHealthScoresWithRefresh` — filter below threshold | `../../../../lib/api/admin/client-ops` |
| `crisis-command-page.tsx` | `loadSupportTicketsWithRefresh` | `../../../../lib/api/admin/support` |
| `active-health-monitor-page.tsx` | `loadAllHealthScoresWithRefresh` | `../../../../lib/api/admin/client-ops` |
| `project-briefing-page.tsx` | `loadProjectBriefsWithRefresh` (add if missing) | `../../../../lib/api/admin/project-layer` |
| `closeout-review-page.tsx` | `loadCloseoutReportsWithRefresh` | `../../../../lib/api/admin/closeout` |
| `booking-appointments-page.tsx` | `loadAllAppointmentsWithRefresh` | `../../../../lib/api/admin/client-ops` |
| `meeting-archive-page.tsx` | `loadMeetingArchiveWithRefresh` (add if missing) | `../../../../lib/api/admin/support` |

**Page-specific UI notes:**
- `health-interventions-page.tsx` — filter `loadAllHealthScoresWithRefresh` data for `score < 70`. Alert banners: `alertBannerCritical` for score <50, `alertBannerWarning` for 50–69.
- `active-health-monitor-page.tsx` — live indicator chip in topbar area. KPI strip: `kpiRed` for critical count, `kpiAmber` for at-risk, `kpiPurple` for avg score. Health bars per client row.
- `crisis-command-page.tsx` — alert banners prominent at top. Severity table with escalation badges.
- `booking-appointments-page.tsx` — calendar grid with month nav. Each appointment as a chip: colour-coded by type. Tab bar: Calendar / List.
- `meeting-archive-page.tsx` — month nav. Past meetings in a grouped list by date. Each meeting shows title, attendees, duration. Tab bar: By Month / By Client.

- [ ] **Step 1: Check and add missing API functions**

```bash
grep -n "loadClientIntelligenceWithRefresh\|loadMarketIntelWithRefresh\|loadSupportTicketsWithRefresh\|loadProjectBriefsWithRefresh\|loadMeetingArchiveWithRefresh\|loadCloseoutReportsWithRefresh" \
  apps/web/src/lib/api/admin/client-ops.ts \
  apps/web/src/lib/api/admin/prospecting.ts \
  apps/web/src/lib/api/admin/support.ts \
  apps/web/src/lib/api/admin/project-layer.ts \
  apps/web/src/lib/api/admin/closeout.ts 2>/dev/null
```

- [ ] **Step 2: Process `strategic-client-intelligence-page.tsx`** — audit, skeleton, wire API, tab bar, detail split layout

- [ ] **Step 3: Process `competitor-market-intel-page.tsx`** — audit, skeleton, wire API, tab bar, card grid

- [ ] **Step 4: Process `communication-audit-page.tsx`** — audit, skeleton, wire `loadAllCommLogsWithRefresh`, KPI strip, table

- [ ] **Step 5: Process `health-interventions-page.tsx`** — audit, skeleton, wire `loadAllHealthScoresWithRefresh` (filter score <70), `alertBannerCritical` for <50, `alertBannerWarning` for 50–69, severity table

- [ ] **Step 6: Process `crisis-command-page.tsx`** — audit, skeleton, wire `loadSupportTicketsWithRefresh`, alert banners prominent at top, severity table with escalation badges

- [ ] **Step 7: Process `active-health-monitor-page.tsx`** — audit, skeleton, wire `loadAllHealthScoresWithRefresh`, `kpiRed` / `kpiAmber` / `kpiPurple` KPI strip, health bars per client, live indicator chip

- [ ] **Step 8: Process `project-briefing-page.tsx`** — audit, skeleton, wire API, detail layout, tab bar

- [ ] **Step 9: Process `closeout-review-page.tsx`** — audit, skeleton, wire `loadCloseoutReportsWithRefresh`, step progress, checklist items

- [ ] **Step 10: Process `booking-appointments-page.tsx`** — audit, skeleton, wire `loadAllAppointmentsWithRefresh`, calendar grid, month nav, list view tab

- [ ] **Step 11: Process `meeting-archive-page.tsx`** — audit, skeleton, wire API, month nav, grouped date list, tab bar (By Month / By Client)

- [ ] **Step 12: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 13: Commit**

```bash
git add \
  apps/web/src/components/admin/dashboard/pages/strategic-client-intelligence-page.tsx \
  apps/web/src/components/admin/dashboard/pages/competitor-market-intel-page.tsx \
  apps/web/src/components/admin/dashboard/pages/communication-audit-page.tsx \
  apps/web/src/components/admin/dashboard/pages/health-interventions-page.tsx \
  apps/web/src/components/admin/dashboard/pages/crisis-command-page.tsx \
  apps/web/src/components/admin/dashboard/pages/active-health-monitor-page.tsx \
  apps/web/src/components/admin/dashboard/pages/project-briefing-page.tsx \
  apps/web/src/components/admin/dashboard/pages/closeout-review-page.tsx \
  apps/web/src/components/admin/dashboard/pages/booking-appointments-page.tsx \
  apps/web/src/components/admin/dashboard/pages/meeting-archive-page.tsx \
  apps/web/src/lib/api/admin/
git commit -m "feat(admin): revamp batch 7 — intelligence pages (UI elevation + API wiring)"
```

---

## Task 8: Batch 8 — Operations (17 pages)

**Depends on Task 0. Can run in parallel with Tasks 1–7.**

**Pages to process:**
1. `messages-page.tsx`
2. `notifications-page.tsx`
3. `announcements-manager-page.tsx`
4. `support-queue-page.tsx`
5. `content-approval-page.tsx`
6. `design-review-admin-page.tsx`
7. `brand-control-page.tsx`
8. `knowledge-base-admin-page.tsx`
9. `document-vault-page.tsx`
10. `automation-audit-trail-page.tsx`
11. `webhook-hub-page.tsx`
12. `platform-infrastructure-page.tsx`
13. `access-control-page.tsx`
14. `legal-page.tsx`
15. `admin-settings-page-client.tsx` *(workspace context — UI-only)*
16. `admin-audit-page-client.tsx` *(workspace context — UI-only)*
17. `admin-automation-page-client.tsx` *(workspace context — UI-only)*

Follow the **Per-Page Process** defined above.

**API functions for this batch:**

| Page | API function | Import from |
|------|-------------|-------------|
| `messages-page.tsx` | `loadSupportInboxWithRefresh` (check `support.ts`) | `../../../../lib/api/admin/support` |
| `notifications-page.tsx` | `loadNotificationsWithRefresh` | `../../../../lib/api/admin/notifications` |
| `announcements-manager-page.tsx` | `loadAnnouncementsWithRefresh` | `../../../../lib/api/admin/governance` |
| `support-queue-page.tsx` | `loadSupportTicketsWithRefresh` | `../../../../lib/api/admin/support` |
| `content-approval-page.tsx` | `loadContentSubmissionsWithRefresh` | `../../../../lib/api/admin/governance` |
| `design-review-admin-page.tsx` | `loadDesignReviewsWithRefresh` | `../../../../lib/api/admin/governance` |
| `brand-control-page.tsx` | `loadClientBrandingWithRefresh` | `../../../../lib/api/admin/clients` |
| `knowledge-base-admin-page.tsx` | `loadKnowledgeArticlesWithRefresh` | `../../../../lib/api/admin/governance` |
| `document-vault-page.tsx` | `loadDocumentsWithRefresh` | `../../../../lib/api/admin/documents` |
| `automation-audit-trail-page.tsx` | `loadAutomationLogsWithRefresh` (check `automation.ts`) | `../../../../lib/api/admin/automation` |
| `webhook-hub-page.tsx` | `loadWebhooksWithRefresh` | `../../../../lib/api/admin/webhooks` |
| `platform-infrastructure-page.tsx` | `loadPlatformStatusWithRefresh` (add to `governance.ts` if missing) | `../../../../lib/api/admin/governance` |
| `access-control-page.tsx` | UI-only (workspace context) | — |
| `legal-page.tsx` | `loadContractsWithRefresh` | `../../../../lib/api/admin/contracts` |
| `admin-settings-page-client.tsx` | UI-only (workspace context) | — |
| `admin-audit-page-client.tsx` | UI-only (workspace context) | — |
| `admin-automation-page-client.tsx` | UI-only (workspace context) | — |

**Page-specific UI notes:**
- `messages-page.tsx` — inbox split: message list left, thread panel right. Skeleton mirrors both columns. KPI strip above: Unread, Total, Replied.
- `support-queue-page.tsx` — severity table with `kpiRed` for critical count. Alert banners for SLA-breached tickets.
- `announcements-manager-page.tsx` — card list of announcements. "Create" button in topbar. Empty state for no announcements.
- `webhook-hub-page.tsx` — table: webhook URL, event type, status badge (active/inactive/errored), last triggered. KPI strip: active webhooks, failures this week.
- `admin-settings-page-client.tsx` — workspace context. Replace `<select>` tab with tab bar for settings sections. No API changes.
- `admin-audit-page-client.tsx` — workspace context. Add filter chips for event type. No API changes.
- `admin-automation-page-client.tsx` — workspace context. Replace select with tab bar. No API changes.

- [ ] **Step 1: Check and add missing API functions**

```bash
grep -n "loadSupportInboxWithRefresh\|loadAutomationLogsWithRefresh\|loadPlatformStatusWithRefresh\|loadDocumentsWithRefresh\|loadContractsWithRefresh\|loadWebhooksWithRefresh" \
  apps/web/src/lib/api/admin/support.ts \
  apps/web/src/lib/api/admin/automation.ts \
  apps/web/src/lib/api/admin/governance.ts \
  apps/web/src/lib/api/admin/documents.ts \
  apps/web/src/lib/api/admin/contracts.ts \
  apps/web/src/lib/api/admin/webhooks.ts 2>/dev/null
```

- [ ] **Step 2: Process `messages-page.tsx`** — audit, skeleton, wire `loadSupportInboxWithRefresh`, inbox split layout, thread panel, KPI strip

- [ ] **Step 3: Process `notifications-page.tsx`** — audit, skeleton, wire `loadNotificationsWithRefresh`, tab bar, feed list

- [ ] **Step 4: Process `announcements-manager-page.tsx`** — audit, skeleton, wire `loadAnnouncementsWithRefresh`, card list, create form section, empty state

- [ ] **Step 5: Process `support-queue-page.tsx`** — audit, skeleton, wire `loadSupportTicketsWithRefresh`, `kpiRed` KPI strip, alert banners for SLA breaches, severity table

- [ ] **Step 6: Process `content-approval-page.tsx`** — audit, skeleton, wire `loadContentSubmissionsWithRefresh`, tab bar, card grid

- [ ] **Step 7: Process `design-review-admin-page.tsx`** — audit, skeleton, wire `loadDesignReviewsWithRefresh`, tab bar, card grid

- [ ] **Step 8: Process `brand-control-page.tsx`** — audit, skeleton, wire `loadClientBrandingWithRefresh`, tab bar, asset grid

- [ ] **Step 9: Process `knowledge-base-admin-page.tsx`** — audit, skeleton, wire `loadKnowledgeArticlesWithRefresh`, search input, article list

- [ ] **Step 10: Process `document-vault-page.tsx`** — audit, skeleton, wire `loadDocumentsWithRefresh`, folder/file table

- [ ] **Step 11: Process `automation-audit-trail-page.tsx`** — audit, skeleton, wire `loadAutomationLogsWithRefresh`, filter chips, event feed

- [ ] **Step 12: Process `webhook-hub-page.tsx`** — audit, skeleton, wire `loadWebhooksWithRefresh`, KPI strip, status badge table

- [ ] **Step 13: Process `platform-infrastructure-page.tsx`** — audit, skeleton, wire API, status cards, KPI strip

- [ ] **Step 14: Process `access-control-page.tsx`** — UI-only (workspace context), audit, role table, permission grid, skeleton using `snapshot.loading`

- [ ] **Step 15: Process `legal-page.tsx`** — audit, skeleton, wire `loadContractsWithRefresh`, document list, tab bar

- [ ] **Step 16: Process `admin-settings-page-client.tsx`** — UI-only (workspace context), replace `<select>` with tab bar, verify skeleton uses `loading` from context

- [ ] **Step 17: Process `admin-audit-page-client.tsx`** — UI-only (workspace context), add filter chips for event type, replace `<select>` with tab bar if present

- [ ] **Step 18: Process `admin-automation-page-client.tsx`** — UI-only (workspace context), replace `<select>` with tab bar, card grid

- [ ] **Step 19: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 20: Final verification — no select-tab switchers remain across all 93 pages**

```bash
grep -rn "activeTab" apps/web/src/components/admin/dashboard/pages/ | \
  grep -v "tabBar\|tabItem\|tabItemActive" | head -20
```

If any results appear with a `<select` element on a nearby line, that select must be converted.

- [ ] **Step 21: Commit**

```bash
git add \
  apps/web/src/components/admin/dashboard/pages/messages-page.tsx \
  apps/web/src/components/admin/dashboard/pages/notifications-page.tsx \
  apps/web/src/components/admin/dashboard/pages/announcements-manager-page.tsx \
  apps/web/src/components/admin/dashboard/pages/support-queue-page.tsx \
  apps/web/src/components/admin/dashboard/pages/content-approval-page.tsx \
  apps/web/src/components/admin/dashboard/pages/design-review-admin-page.tsx \
  apps/web/src/components/admin/dashboard/pages/brand-control-page.tsx \
  apps/web/src/components/admin/dashboard/pages/knowledge-base-admin-page.tsx \
  apps/web/src/components/admin/dashboard/pages/document-vault-page.tsx \
  apps/web/src/components/admin/dashboard/pages/automation-audit-trail-page.tsx \
  apps/web/src/components/admin/dashboard/pages/webhook-hub-page.tsx \
  apps/web/src/components/admin/dashboard/pages/platform-infrastructure-page.tsx \
  apps/web/src/components/admin/dashboard/pages/access-control-page.tsx \
  apps/web/src/components/admin/dashboard/pages/legal-page.tsx \
  apps/web/src/components/admin/dashboard/pages/admin-settings-page-client.tsx \
  apps/web/src/components/admin/dashboard/pages/admin-audit-page-client.tsx \
  apps/web/src/components/admin/dashboard/pages/admin-automation-page-client.tsx \
  apps/web/src/lib/api/admin/
git commit -m "feat(admin): revamp batch 8 — operations pages (UI elevation + API wiring)"
```

---

## Final Verification (after all batches complete)

- [ ] **TypeScript clean build**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **CSS class name resolution check**

```bash
grep -rn 'cx("' apps/web/src/components/admin/dashboard/pages/ | \
  grep -v 'styles\.' | head -30
```

For each bare string class name (e.g. `cx("tabBar", ...)`), confirm it is defined in the merged styles spread (`shared`, `adminPrimitives`, `core`, `pagesA`–`pagesC`, `pagesClm`, `pagesAnalytics`, `pagesMisc`).

- [ ] **No select-tab switchers remaining**

```bash
grep -rn "<select" apps/web/src/components/admin/dashboard/pages/ | wc -l
```

Compare against your pre-work count. The delta should equal the number of filter/sort selects that were intentionally left in place (not tab switchers).

- [ ] **Final commit**

```bash
git add apps/web/src/lib/api/admin/index.ts
git commit -m "feat(admin): admin dashboard revamp complete — all 93 pages elevated + wired"
```
