# Admin Dashboard Revamp — UI Elevation & Functionality

**Date:** 2026-03-20
**Scope:** Admin dashboard — 93 pages (all files in `pages/` except `shared.tsx`, `admin-stub-page.tsx`, `admin-page-utils.tsx`)
**Goal:** (A) Executive Intelligence UI elevation, (B) API wiring to replace all static placeholder data with real data.

---

## Background

The admin dashboard has 93 pages. Most pages currently:
- Use `<select>` dropdowns for tabs instead of proper tab bars (49 pages have `<select>`, 29 are tab-switchers)
- Hold static empty arrays as placeholder data with no API calls
- Lack skeleton loading states that mirror real page structure (~30 pages)
- Have bare empty states (plain text, no icon or context)
- Miss NaN division guards on derived metrics

Predecessor: `2026-03-20-staff-dashboard-ui-audit-elevation-design.md` (staff dashboard equivalent).

---

## Execution Model

**One agent per batch, full ownership.** Each of the 8 batch agents handles both Track A (UI) and Track B (functionality) for their assigned pages in a single pass. This eliminates cross-track merge conflicts since no file is touched by more than one agent.

The 8 batches run in parallel. Within each batch, pages are processed sequentially.

**Do NOT** run a separate UI-only agent and a separate functionality-only agent against the same files simultaneously.

---

## Design System Reference

| Token | Value | Use |
|-------|-------|-----|
| `--s1` | `#0d0d14` | Page background |
| `--s2` | `#13131e` | Card / hover surface |
| `--s3` | `#171726` | Input / deepest surface |
| `--b1` | `rgba(255,255,255,0.07)` | Dividers |
| `--b2` | `rgba(255,255,255,0.12)` | Card borders |
| `--b3` | `rgba(255,255,255,0.16)` | Focus / hover borders |
| `--accent` | `#8b6fff` | Admin purple |
| `--text` | `rgba(255,255,255,0.85)` | Body text |
| `--muted` | `rgba(255,255,255,0.35)` | Subdued text |
| `--amber` | `#fbbf24` | Warning colour |
| `--red` | `#ef4444` | Error / critical colour |
| `--blue` | `#3b82f6` | Info / link colour |
| `--font-syne` | Syne | Headings, display text |
| `--font-dm-mono` | DM Mono | All data labels, metrics, eyebrows |

No Instrument Serif — serif is client portal only.
Topbar: 2px `--accent` top border identity stripe.

**Key file paths:**
- CSS modules: `apps/web/src/app/style/admin/*.module.css` (7 files)
- Admin primitives CSS: `apps/web/src/app/style/admin.module.css`
- Shared CSS: `apps/web/src/app/style/shared/maphari-dashboard-shared.module.css`
- Style util: `apps/web/src/components/admin/dashboard/style.ts`
- API clients: `apps/web/src/lib/api/admin/`
- Shared API util: `apps/web/src/lib/api/admin/_shared.ts`

---

## Executive Intelligence Visual Language

The admin dashboard uses a richer, more data-dense visual style than the staff dashboard. Key characteristics:

- **Purple gradient on primary KPI cards** — `linear-gradient(160deg, rgba(139,111,255,0.16), rgba(10,12,18,0.95))` with `border: 1px solid rgba(139,111,255,0.3)`
- **Amber/red tinted KPI cards** for alert-state metrics — same gradient pattern with amber/red colours
- **Left-border alert banners** — 3px left border in accent/amber/red, tinted background, monospace severity eyebrow
- **Expandable table rows** — click to reveal nested sub-rows (e.g. projects within a client)
- **Inline bar charts** — revenue bar groups or progress columns in KPI cards where relevant
- **Donut charts** for utilisation metrics (donut CSS classes already exist in `core.module.css`)
- **Health bars** — progress bars with numeric score; green ≥70, amber 50–69, red <50
- **Row-level severity highlighting** — critical rows get red left border + tinted background

---

## Track A — UI Elevation

### A0. Workspace-Context Pages (UI-only — do NOT add `useEffect`)

These 10 pages receive data via `useAdminWorkspaceContext()` and must NOT be converted to per-page `useEffect` + API call pattern. For these pages, Track B changes are limited to using `snapshot.loading` for skeleton state and `session` for any mutation calls. Apply full Track A UI elevation normally.

| Page file | Context fields used |
|-----------|-------------------|
| `admin-analytics-page-client.tsx` | `snapshot`, `loading` |
| `admin-audit-page-client.tsx` | `snapshot`, `loading`, `session` |
| `admin-automation-page-client.tsx` | `snapshot`, `session` |
| `admin-billing-page-client.tsx` | `snapshot`, `loading` |
| `admin-clients-page-client.tsx` | `snapshot`, `loading` |
| `admin-integrations-page-client.tsx` | `snapshot`, `session` |
| `admin-leads-page-client.tsx` | `snapshot`, `loading`, `moveLead`, `transitioningLeadId` |
| `admin-projects-page-client.tsx` | `snapshot`, `loading` |
| `admin-reports-page-client.tsx` | `snapshot`, `session` |
| `admin-settings-page-client.tsx` | context fields — check file |

### A1. Universal Audit Checklist (every page)

| Severity | Check | Rule |
|----------|-------|------|
| Critical | Missing CSS class referenced in JSX | Look up class name in all 7 admin CSS module files + shared + admin.module.css |
| Critical | `<select>` used as tab switcher | Replace with tab bar — but **only when the `<select>` drives `activeTab` state**. Selects that drive sort order, filter status, or form fields must remain as `<select>`. |
| Critical | No loading state on a page with API call | Must have skeleton returning from loading branch |
| Critical | No error state on a page with API call | Must show error card with message text + retry button |
| Warning | Bare empty state (text only) | Use existing `EmptyState` component — see A2 |
| Warning | NaN division — no zero guard | Three acceptable forms: `count > 0 ? Math.round(total / count) : 0`, `\|\| 0`, or `?? 1` denominator |
| Warning | Missing `key` prop in `.map()` | All `.map()` calls rendering JSX must have `key` on the outermost element |
| Warning | Skeleton doesn't approximate real page structure | Skeleton must mirror the KPI card count, table row count, and layout of the real page |
| Info | Unused CSS class in module | Flag for cleanup; do not delete during this pass |

### A2. Component Patterns

#### Tab Bar

`tabBar`, `tabItem`, and `tabItemActive` are **already defined in the shared CSS** (loaded via the style spread). No new CSS needed.

```tsx
// Use cx() with bare string names — they resolve via the shared spread
<div className={cx("tabBar")}>
  {tabs.map(t => (
    <button
      key={t}
      type="button"
      className={cx("tabItem", activeTab === t && "tabItemActive")}
      onClick={() => setActiveTab(t)}
    >
      {t}
    </button>
  ))}
</div>
```

**Note:** `admin.module.css` contains a legacy `.tabShell` / `.tabNav` / `.tabButton` system with lime colours — incorrect for admin. Do not use these classes. They will be cleaned up in a future pass.

#### KPI Card Variants

Three new variants must be added to **`admin.module.css`** adjacent to the existing `.kpiTeal`, `.kpiSlate`, `.kpiGold` definitions:

```css
/* Add after .kpiGold in admin.module.css */
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

Usage: `<div className={cx(styles.kpiCard, styles.kpiPurple)}>` — `kpiCard` is the base class, `kpiPurple/Amber/Red` is the modifier.

For alert-bordered KPI cards (amber/red tone), add an `alertBanner*` modifier alongside.

#### Alert Banners

Add to `admin/core.module.css`:

```css
.alertBanner {
  border-left: 3px solid;
  border-radius: 0 8px 8px 0;
  padding: 9px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.alertBannerInfo    { background: rgba(139, 111, 255, 0.08); border-color: var(--accent); }
.alertBannerWarning { background: rgba(251, 191, 36, 0.06);  border-color: var(--amber); }
.alertBannerCritical{ background: rgba(239, 68, 68, 0.06);   border-color: var(--red); }
```

Usage:
```tsx
{overdueCount > 0 && (
  <div className={cx(styles.alertBanner, styles.alertBannerWarning)}>
    <div>
      <div className={cx("fontMono", "text10", "uppercase", "tracking", "colorAmber")}>Warning</div>
      <div className={cx("text12")}>{overdueCount} invoices overdue</div>
    </div>
    <button type="button" className={cx("text10", "colorMuted")}>View →</button>
  </div>
)}
```

#### Skeleton Loading State

63 of 93 pages already have skeleton states. The remaining ~30 need new skeleton JSX. Skeleton must **approximate the real page structure** — mirror the KPI card count, table row count, and layout columns.

Add to `admin/core.module.css` (this file is already included in the style spread in `style.ts` — no import wiring needed after adding classes):
```css
@keyframes adminSkeletonPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
.skeletonBlock { background: rgba(255,255,255,0.06); border-radius: 4px; animation: adminSkeletonPulse 1.5s ease-in-out infinite; }
.skeletonCard  { animation: adminSkeletonPulse 1.5s ease-in-out infinite; }
```

Example skeleton for a 4-KPI + table page:
```tsx
if (loading) return (
  <div className={styles.pageBody}>
    <div className={styles.pageHeader}>
      <div className={cx("skeletonBlock")} style={{ width: 160, height: 10 }} />
      <div className={cx("skeletonBlock")} style={{ width: 240, height: 22, marginTop: 6 }} />
    </div>
    <div className={styles.kpiGrid}>
      {[0,1,2,3].map(i => (
        <div key={i} className={cx(styles.card, "skeletonCard")}>
          <div className="skeletonBlock" style={{ width: '60%', height: 9, marginBottom: 10 }} />
          <div className="skeletonBlock" style={{ width: '40%', height: 22 }} />
        </div>
      ))}
    </div>
    <div className={cx(styles.card, "skeletonCard")}>
      {[0,1,2,3,4].map(i => (
        <div key={i} className="skeletonBlock" style={{ height: 32, marginBottom: 8 }} />
      ))}
    </div>
  </div>
);
```

#### Empty State

Use the **existing** `EmptyState` component from `admin-page-utils.tsx`. Its CSS classes (`emptyState`, `emptyStateCompact`, `emptyIcon`, `emptyTitle`, `emptySub`) already exist in `admin/core.module.css`. Do not add new empty state CSS.

```tsx
import { EmptyState } from "./admin-page-utils";

{items.length === 0 ? (
  <EmptyState
    title="No records yet"
    subtitle="Data will appear here once records are created."
    variant="data"
  />
) : items.map(item => (
  <div key={item.id}>…</div>
))}
```

#### Health Bar

```tsx
function healthColor(score: number): string {
  if (score >= 70) return 'var(--green, #4ade80)';
  if (score >= 50) return 'var(--amber)';
  return 'var(--red)';
}

// Render:
<div className={cx("flexRow", "gap8", "alignCenter")}>
  <div className={styles.healthBarBg}>
    <div
      className={styles.healthBarFill}
      style={{ width: `${Math.min(100, score)}%`, background: healthColor(score) }}
    />
  </div>
  <span className={cx("fontMono", "text10", "fw700")} style={{ color: healthColor(score) }}>
    {score}
  </span>
</div>
```

Add to `admin/core.module.css`:
```css
.healthBarBg   { flex: 1; background: var(--b1); border-radius: 3px; height: 4px; }
.healthBarFill { height: 4px; border-radius: 3px; transition: width 0.3s; }
```

### A3. Page-Specific Layout Patterns

**Table-heavy pages** (Clients, Leads, Invoices, Payroll, Recruitment, Staff, etc.):
- KPI strip (4–5 cards) above the table
- Search input + filter chips row (filter chips drive a filter state, not tab state — keep as chips)
- Tab bar for view switching (All / Retainer / Project / etc.)
- Expandable rows for nested entities
- Row-level severity: red left border + `rgba(239,68,68,0.03)` background for critical rows
- Pagination row at bottom

**Dashboard / overview pages** (Executive, Owner, RevOps, etc.):
- KPI grid (4 cards) — primary card uses `kpiPurple`
- Alert banner section (conditionally rendered when alerts exist)
- Tab bar
- Main split: chart/primary content left + entity list right
- Bottom 3-card row: utilisation donut · pipeline funnel · activity feed

**Form / detail pages** (Settings, Onboarding, Brand Control, etc.):
- Tab bar to separate sections
- Section cards with `pageCardTitle` heading
- Form inputs use `--s3` background
- Submit button uses `var(--accent)` background

**Calendar / timeline pages** (Cash Flow Calendar, Timeline Gantt, Meeting Archive, Booking Appointments):
- Month navigation with prev/next arrow buttons
- Calendar grid with event chips using tone CSS classes
- List view toggle tab

---

## Track B — Functionality

### B1. API Wiring Pattern

Standard pattern for non-workspace-context pages:

```tsx
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadXWithRefresh } from "../../../../lib/api/admin/x";
import type { PageId } from "../config";

export function XPage({ session, onNavigate }: { session: AuthSession; onNavigate?: (page: PageId) => void }) {
  const [data, setData] = useState<XType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [session]);

  if (loading) return (/* skeleton JSX — mirrors real layout */);

  if (error) return (
    <div className={styles.pageBody}>
      <div className={cx(styles.card, "flexCol", "gap12", "p24")}>
        <div className={cx("text13", "fw700", "colorRed")}>Failed to load data</div>
        <div className={cx("text12", "colorMuted")}>{error}</div>
        <button
          type="button"
          className={cx("text11", "fw700")}
          onClick={() => setLoading(true)}
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (/* real page JSX */);
}
```

Key rules:
- Always set `cancelled = true` in the cleanup function
- Always call `saveSession(result.nextSession)` when non-null
- Always handle `result.error` before accessing `result.data`
- The retry button re-triggers by setting `loading(true)` — the effect re-fires because `loading` is not a dependency; use a separate `retryCount` state if needed: `const [retryCount, setRetryCount] = useState(0)` + `[session, retryCount]` in deps

### B2. `loadXWithRefresh` Convention

```ts
import { callGateway, isUnauthorized, toGatewayError, withAuthorizedSession } from "./_shared";
import type { AuthorizedResult } from "./_shared";
import type { AuthSession } from "../../auth/session";

export async function loadXWithRefresh(session: AuthSession): Promise<AuthorizedResult<XType[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<XType[]>("/admin/x", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return {
      unauthorized: false, data: null,
      error: toGatewayError(res.payload.error?.code ?? "FETCH_FAILED", res.payload.error?.message ?? "Request failed.")
    };
    return { unauthorized: false, data: res.payload.data, error: null };
  });
}
```

### B3. Existing API Functions (no new files or functions needed)

All API functions needed by admin pages already exist. Use the exact function names below — do not create duplicates:

| Function | File | Used by |
|----------|------|---------|
| `loadAnnouncementsWithRefresh` | `governance.ts` | announcements-manager-page |
| `loadKnowledgeArticlesWithRefresh` | `governance.ts` | knowledge-base-admin-page |
| `loadDecisionRecordsWithRefresh` | `governance.ts` | decision-registry-page |
| `loadHandoversWithRefresh` | `governance.ts` | handover-management-page |
| `loadDesignReviewsWithRefresh` | `governance.ts` | design-review-admin-page |
| `loadContentSubmissionsWithRefresh` | `governance.ts` | content-approval-page |
| `loadAllPortfolioRisksWithRefresh` | `governance.ts` | portfolio-risk-register-page |
| `loadAllHealthScoresWithRefresh` | `client-ops.ts` | client-health-scorecard-page, active-health-monitor-page, health-interventions-page |
| `loadAllSatisfactionSurveysWithRefresh` | `client-ops.ts` | client-satisfaction-page, staff-satisfaction-page |
| `loadAllCommLogsWithRefresh` | `client-ops.ts` | communication-audit-page |
| `loadAllAppointmentsWithRefresh` | `client-ops.ts` | booking-appointments-page |
| `loadClientBrandingWithRefresh` | `clients.ts` | brand-control-page |
| `loadAdminPeerReviewsWithRefresh` | `hr.ts` | peer-review-queue-page |
| `loadStandupFeedWithRefresh` | `hr.ts` | standup-feed-page |

If a page's data need is not covered by any function in the table above or in the existing API client files, add a new function to the appropriate existing file following the B2 convention. Note the addition in the implementation log. Do not create new client files.

### B4. Derived Metrics Rules

- Zero-division guard required on all computed averages: `count > 0 ? Math.round(total / count) : 0`
- Percentages must be clamped: `Math.min(100, Math.max(0, Math.round(pct)))`
- Currency (cents): `format-money.ts` already exists at `apps/web/src/lib/utils/format-money.ts` and exports `formatMoney(amountCents, currency)` for full currency strings (e.g. "R1,500.00"). For abbreviated KPI display (e.g. "R84k"), `centsToK()` is currently defined inline in `revenue-forecasting-page.tsx`. Extract it by adding `formatMoneyK` to `format-money.ts` and replace the inline definition:

```ts
// Add to apps/web/src/lib/utils/format-money.ts
/** Abbreviate cents to a compact KPI label — e.g. 8450000 → "R84k" */
export function formatMoneyK(cents: number): string {
  return `R${(cents / 100_000).toFixed(0)}k`;
}
```

Then in `revenue-forecasting-page.tsx` (and any other pages that need it): `import { formatMoneyK } from "@/lib/utils/format-money"` and rename `centsToK` to `formatMoneyK`.

---

## Page Batches

### Batch 1 — Command (6 pages)

| Page | Track A changes | Track B — API function |
|------|----------------|----------------------|
| `owners-workspace-page.tsx` | Replace select tabs; add skeleton; KPI cards (`kpiPurple`); alert banners | `loadDecisionRecordsWithRefresh` (governance.ts) for decision journal tab |
| `executive-dashboard-page.tsx` | Add alert banners; replace select with tab bar; upgrade KPI cards to `kpiPurple` | Already wired; ensure `saveSession` called |
| `business-development-page.tsx` | Replace select tabs; skeleton; KPI strip | `loadAdminSnapshotWithRefresh` (clients.ts) — derive from leads + pipeline |
| `ai-action-recommendations-page.tsx` | Skeleton; empty state | No API call needed — AI recommendations are computed client-side from snapshot |
| `decision-registry-page.tsx` | Replace select tabs; skeleton | `loadDecisionRecordsWithRefresh` (governance.ts) |
| `eod-digest-page.tsx` | Skeleton; empty state | `loadAnnouncementsWithRefresh` (governance.ts) + derive from snapshot |

### Batch 2 — Revenue (7 pages)

| Page | Track A changes | Track B — API function |
|------|----------------|----------------------|
| `leads-page.tsx` | Tab bar; expandable table; severity rows; skeleton | `admin-leads-page-client.tsx` uses context — UI-only |
| `prospecting-page.tsx` | KPI strip; table; skeleton | `loadProspectingDataWithRefresh` (prospecting.ts) |
| `pipeline-analytics-page.tsx` | Funnel bars; tab bar; skeleton | `loadPipelineSummaryWithRefresh` (pipeline.ts) |
| `revops-dashboard-page.tsx` | KPI grid (`kpiPurple`); tab bar; alert banners; skeleton | `loadBillingSnapshotWithRefresh` (billing.ts) + pipeline |
| `revenue-forecasting-page.tsx` | Already wired; replace select with tab bar; upgrade KPI cards | Already wired — ensure `centsToK` extracted to finance.ts |
| `referral-tracking-page.tsx` | KPI strip; table; skeleton | `loadReferralsWithRefresh` (clients.ts — check if exists, add if not) |
| `invoice-chasing-page.tsx` | Alert banners; severity table; filter chips; skeleton | `loadBillingSnapshotWithRefresh` (billing.ts) — filter for overdue |

### Batch 3 — Clients (8 pages)

| Page | Track A changes | Track B — API function |
|------|----------------|----------------------|
| `clients-projects-page.tsx` | Expandable table; KPI strip; health bars; filter chips; severity rows | `admin-clients-page-client.tsx` + `admin-projects-page-client.tsx` use context — UI-only |
| `client-journey-page.tsx` | Tab bar; timeline layout; skeleton | `loadClientJourneyWithRefresh` (client-ops.ts — check, add if missing) |
| `client-health-scorecard-page.tsx` | Health bars; KPI strip (`kpiPurple`); severity rows; skeleton | `loadAllHealthScoresWithRefresh` (client-ops.ts) |
| `client-satisfaction-page.tsx` | KPI strip; bar chart; skeleton | `loadAllSatisfactionSurveysWithRefresh` (client-ops.ts) |
| `lifecycle-dashboard-page.tsx` | Tab bar; stage funnel bars; skeleton | `loadClientLifecycleWithRefresh` (client-ops.ts — check, add if missing) |
| `client-onboarding-page.tsx` | Step progress; KPI strip; skeleton | `loadOnboardingStatusWithRefresh` (onboarding.ts) |
| `client-offboarding-page.tsx` | Step progress; alert banners; skeleton | `loadOffboardingStatusWithRefresh` (closeout.ts) |
| `loyalty-credits-page.tsx` | KPI strip; table; skeleton | `loadLoyaltyCreditsWithRefresh` (loyalty.ts) |
| `sla-tracker-page.tsx` | Alert banners; severity table; health bars; skeleton | `loadSLADataWithRefresh` (billing.ts — check, add if missing) |

### Batch 4 — Projects (9 pages)

| Page | Track A changes | Track B — API function |
|------|----------------|----------------------|
| `project-portfolio-page.tsx` | KPI strip; expandable table; health bars; skeleton | `admin-projects-page-client.tsx` uses context — UI-only |
| `project-operations-page.tsx` | Tab bar; board + list toggle; skeleton | `loadProjectOpsDataWithRefresh` (project-ops.ts) |
| `sprint-board-admin-page.tsx` | Kanban columns; KPI strip; skeleton | `loadSprintBoardWithRefresh` (project-ops.ts) |
| `timeline-gantt-page.tsx` | Gantt bars; month nav buttons; skeleton | `loadProjectTimelineWithRefresh` (project-layer.ts) |
| `capacity-forecast-page.tsx` | Donut chart; KPI strip (`kpiPurple`); skeleton | `loadCapacityForecastWithRefresh` (capacity.ts) |
| `resource-allocation-page.tsx` | Assignment table; progress bars; skeleton | `loadResourceAllocationWithRefresh` (capacity.ts) |
| `portfolio-risk-register-page.tsx` | Severity table; KPI strip; alert banners; skeleton | `loadAllPortfolioRisksWithRefresh` (governance.ts) |
| `change-request-manager-page.tsx` | Tab bar; severity table; skeleton | `loadChangeRequestsWithRefresh` (project-ops.ts — check, add if missing) |
| `quality-assurance-page.tsx` | Tab bar; score cards; skeleton | `loadQADataWithRefresh` (project-ops.ts — check, add if missing) |

### Batch 5 — Finance (8 pages)

| Page | Track A changes | Track B — API function |
|------|----------------|----------------------|
| `invoices-page.tsx` | KPI strip; severity table; filter chips; skeleton | `admin-billing-page-client.tsx` uses context — UI-only |
| `payroll-ledger-page.tsx` | KPI strip; table; skeleton | `loadPayrollWithRefresh` (expenses.ts) |
| `cash-flow-calendar-page.tsx` | Calendar grid; month nav; event chips; skeleton | `loadCashFlowWithRefresh` (billing.ts — check, add if missing) |
| `expense-tracker-page.tsx` | KPI strip; category bars; table; skeleton | `loadExpensesWithRefresh` (expenses.ts) |
| `profitability-per-client-page.tsx` | Replace select with tab bar; upgrade KPI cards | `loadProfitabilityByClientWithRefresh` (billing.ts — check if exists) |
| `profitability-per-project-page.tsx` | Replace select with tab bar; upgrade KPI cards | `loadProfitabilityByProjectWithRefresh` (billing.ts — check if exists) |
| `financial-year-closeout-page.tsx` | Step progress; KPI strip; alert banners; skeleton | `loadCloseoutDataWithRefresh` (closeout.ts) |
| `vendor-cost-control-page.tsx` | KPI strip; table; skeleton | `loadVendorCostsWithRefresh` (vendors.ts) |

### Batch 6 — People (13 pages)

| Page | Track A changes | Track B — API function |
|------|----------------|----------------------|
| `staff-access-page.tsx` | Table; role badges; skeleton | `loadAllStaffWithRefresh` (hr.ts) |
| `employment-records-page.tsx` | Tab bar; table; skeleton | `loadEmploymentRecordsWithRefresh` (hr.ts — check, add if missing) |
| `staff-satisfaction-page.tsx` | KPI strip; bar chart; skeleton | `loadAllSatisfactionSurveysWithRefresh` (client-ops.ts) — filter for staff type |
| `staff-utilisation-page.tsx` | Donut chart; bar chart; KPI strip (`kpiPurple`); skeleton | `loadUtilisationWithRefresh` (utilisation.ts) |
| `staff-transition-planner-page.tsx` | Tab bar; table; skeleton | `loadTransitionPlansWithRefresh` (hr.ts — check, add if missing) |
| `staff-onboarding-page.tsx` | Step progress; KPI strip; skeleton | `loadStaffOnboardingWithRefresh` (hr.ts) |
| `peer-review-queue-page.tsx` | Tab bar; severity table; skeleton | `loadAdminPeerReviewsWithRefresh` (hr.ts) |
| `recruitment-pipeline-page.tsx` | Kanban columns; KPI strip; skeleton | `loadRecruitmentPipelineWithRefresh` (hr.ts — check, add if missing) |
| `leave-absence-page.tsx` | Calendar grid; table; tab bar; skeleton | `loadLeaveRequestsWithRefresh` (hr.ts — check, add if missing) |
| `learning-development-page.tsx` | Progress bars; table; skeleton | `loadTrainingDataWithRefresh` (hr.ts — check, add if missing) |
| `team-structure-page.tsx` | KPI strip; table / org view; skeleton | `loadAllStaffWithRefresh` (hr.ts) |
| `team-performance-report-page.tsx` | Tab bar; score cards; skeleton | `loadUtilisationWithRefresh` (utilisation.ts) |
| `standup-feed-page.tsx` | Feed list; date nav buttons; skeleton | `loadStandupFeedWithRefresh` (hr.ts) |

### Batch 7 — Intelligence (10 pages)

| Page | Track A changes | Track B — API function |
|------|----------------|----------------------|
| `strategic-client-intelligence-page.tsx` | Tab bar; detail split; skeleton | `loadClientIntelligenceWithRefresh` (client-ops.ts — check, add if missing) |
| `competitor-market-intel-page.tsx` | Tab bar; card grid; skeleton | `loadMarketIntelWithRefresh` (prospecting.ts — check, add if missing) |
| `communication-audit-page.tsx` | KPI strip; table; skeleton | `loadAllCommLogsWithRefresh` (client-ops.ts) |
| `health-interventions-page.tsx` | Alert banners; severity table; skeleton | `loadAllHealthScoresWithRefresh` (client-ops.ts) — filter below threshold |
| `crisis-command-page.tsx` | Alert banners; severity rows; skeleton | `loadSupportTicketsWithRefresh` (support.ts) |
| `active-health-monitor-page.tsx` | KPI strip; health bars; live indicator chip; skeleton | `loadAllHealthScoresWithRefresh` (client-ops.ts) |
| `project-briefing-page.tsx` | Detail layout; tab bar; skeleton | `loadProjectBriefsWithRefresh` (project-layer.ts — check, add if missing) |
| `closeout-review-page.tsx` | Step progress; checklist; skeleton | `loadCloseoutReportsWithRefresh` (closeout.ts) |
| `booking-appointments-page.tsx` | Calendar grid; list view tab; skeleton | `loadAllAppointmentsWithRefresh` (client-ops.ts) |
| `meeting-archive-page.tsx` | Calendar grid; month nav; list toggle; skeleton | `loadMeetingArchiveWithRefresh` (support.ts — check, add if missing) |

### Batch 8 — Operations (17 pages)

| Page | Track A changes | Track B — API function |
|------|----------------|----------------------|
| `messages-page.tsx` | Inbox split; thread panel; skeleton | `loadSupportInboxWithRefresh` (support.ts) |
| `notifications-page.tsx` | Tab bar; feed list; skeleton | `loadNotificationsWithRefresh` (notifications.ts) |
| `announcements-manager-page.tsx` | Card list; create form section; skeleton | `loadAnnouncementsWithRefresh` (governance.ts) |
| `support-queue-page.tsx` | Severity table; KPI strip; skeleton | `loadSupportTicketsWithRefresh` (support.ts) |
| `content-approval-page.tsx` | Tab bar; card grid; skeleton | `loadContentSubmissionsWithRefresh` (governance.ts) |
| `design-review-admin-page.tsx` | Tab bar; card grid; skeleton | `loadDesignReviewsWithRefresh` (governance.ts) |
| `brand-control-page.tsx` | Tab bar; asset grid; skeleton | `loadClientBrandingWithRefresh` (clients.ts) |
| `knowledge-base-admin-page.tsx` | Search input; article list; skeleton | `loadKnowledgeArticlesWithRefresh` (governance.ts) |
| `document-vault-page.tsx` | Folder tree; file table; skeleton | `loadDocumentsWithRefresh` (documents.ts) |
| `automation-audit-trail-page.tsx` | Filter chips; event feed; skeleton | `loadAutomationLogsWithRefresh` (automation.ts) |
| `webhook-hub-page.tsx` | Table; status badges; skeleton | `loadWebhooksWithRefresh` (webhooks.ts) |
| `platform-infrastructure-page.tsx` | Status cards; KPI strip; skeleton | `loadPlatformStatusWithRefresh` (governance.ts — check, add if missing) |
| `access-control-page.tsx` | Role table; permission grid; skeleton | `admin-settings-page-client.tsx` uses context — UI-only for access tab |
| `legal-page.tsx` | Document list; tab bar; skeleton | `loadContractsWithRefresh` (contracts.ts) |
| `admin-settings-page-client.tsx` | Tab bar (replace select); form sections | Workspace context — UI-only |
| `admin-audit-page-client.tsx` | Filter chips; event feed; tab bar | Workspace context — UI-only |
| `admin-automation-page-client.tsx` | Tab bar; card grid; skeleton | Workspace context — UI-only |

---

## Structural Audit — Pre-Implementation Sweep

Before starting each batch, run a static scan of each file in scope:

1. `grep -n "<select" <file>` — identify tab-switcher selects vs filter selects
2. `grep -n "if (loading)" <file>` — confirm skeleton exists
3. `grep -n "error" <file>` — confirm error state exists
4. `grep -n "\.map(" <file>` — verify key props and empty state branches
5. `grep -n "/ " <file>` — spot bare division for NaN guard check

Log findings per-file before writing any code. Fix criticals first.

---

## Out of Scope

- No new pages or routes
- Prisma schema is frozen. Gateway routes may be added only if no existing route serves the data needed by a specific page; any such addition must be noted in the implementation log with the route path and controller file.
- No changes to admin shell (`sidebar.tsx`, `topbar.tsx`, `chrome.tsx`) beyond what a specific page requires
- No changes to client or staff dashboards
- No authentication or RBAC changes
- No deletion of the legacy `.tabShell`/`.tabNav`/`.tabButton` lime system in `admin.module.css` — that is a separate cleanup task

---

## Success Criteria

**Track A (UI) — verified by visual inspection and grep:**
- Zero `<select>` elements driving `activeTab` state across all 93 pages
- Every page that fetches data has a skeleton state approximating real layout
- Every page with API calls has an error state with visible message
- Every `.map()` over data has an empty-state branch using `EmptyState` component
- No bare division without zero-guard (`grep -n "/ " pages/` + review)
- `kpiPurple`, `kpiAmber`, `kpiRed` added to `admin.module.css`
- Alert banner CSS (`alertBanner*`) added to `admin/core.module.css`
- Skeleton CSS (`skeletonBlock`, `skeletonCard`) added to `admin/core.module.css`
- `healthBarBg`, `healthBarFill` added to `admin/core.module.css`

**Track B (Functionality) — verified by TypeScript and grep:**
- Zero static empty arrays as sole data source on any non-workspace-context page
- Every non-context page calls at least one API function via `withAuthorizedSession`
- Every non-context page calls `saveSession(result.nextSession)` when non-null
- `formatMoneyK` added to `apps/web/src/lib/utils/format-money.ts`; inline `centsToK` in `revenue-forecasting-page.tsx` replaced with import
- Any new API functions added to existing client files and exported from `apps/web/src/lib/api/admin/index.ts`
- `pnpm --filter @maphari/web exec tsc --noEmit` passes with zero errors
- After all changes: `grep -r 'cx("' apps/web/src/components/admin/dashboard/pages/` — verify all bare string class names resolve in the merged styles object
