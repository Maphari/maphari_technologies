# Admin Dashboard Revamp — UI Elevation & Functionality

**Date:** 2026-03-20
**Scope:** Admin dashboard — all 95 pages
**Goal:** Two parallel tracks: (A) Executive Intelligence UI elevation across every page, (B) API wiring to replace all static placeholder data with real data.

---

## Background

The admin dashboard has ~95 pages. Most pages currently:
- Use `<select>` dropdowns for tabs instead of proper tab bars
- Hold static empty arrays as placeholder data with no API calls
- Lack skeleton loading states that mirror real page structure
- Have bare empty states (plain text, no icon or context)
- Miss NaN division guards on derived metrics

This spec covers both a uniform design elevation pass (Track A) and a full data wiring pass (Track B). Both tracks run in parallel using `superpowers:subagent-driven-development`, working through the same 8 domain batches simultaneously. Track A touches CSS/layout/JSX structure. Track B touches `useEffect`, state, and API imports.

Predecessor: `2026-03-20-staff-dashboard-ui-audit-elevation-design.md` (staff dashboard equivalent, already complete).

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
| `--font-syne` | Syne | Headings, display text |
| `--font-dm-mono` | DM Mono | All data labels, metrics, eyebrows |

No Instrument Serif — serif is client portal only.
Topbar: 2px `--accent` top border identity stripe (per spec section 5.5).

CSS modules: `apps/web/src/app/style/admin/*.module.css` (7 files)
Style util: `apps/web/src/components/admin/dashboard/style.ts`
API clients: `apps/web/src/lib/api/admin/`
Shared util: `apps/web/src/lib/api/admin/_shared.ts`

---

## Executive Intelligence Visual Language

The admin dashboard uses a richer, more data-dense visual style than the staff dashboard ("Precision Industrial"). The key differences:

- **Purple gradient on primary KPI cards** — `linear-gradient(135deg, rgba(139,111,255,0.18), rgba(139,111,255,0.06))` with `border: 1px solid rgba(139,111,255,0.3)`
- **Amber/red tinted KPI cards** for alert-state metrics — same pattern with amber/red colours
- **Left-border alert banners** — 3px left border in accent/amber/red, tinted background, severity eyebrow label
- **Expandable table rows** — click to reveal nested sub-rows (e.g. projects within a client)
- **Inline sparklines / bar charts** — revenue trends in KPI cards where relevant
- **Donut charts** for utilisation metrics
- **Health bars** — coloured progress bars with numeric score; green ≥70, amber 50–69, red <50
- **Row-level severity highlighting** — critical rows get red left border + tinted background

---

## Track A — UI Elevation

### A1. Universal Audit Checklist (every page)

| Check | What to look for |
|-------|-----------------|
| Select-based tabs | Replace every `<select>` used as a tab switcher with a proper `.tabBar` pill component |
| Missing skeleton | Pages that have `if (loading) return …` but the returned JSX does not approximate real page structure |
| Missing error state | Pages with no user-visible error message — must show error card with retry option |
| Bare empty states | Empty renders with only plain text — replace with `EmptyState` component (icon + title + subtitle) |
| NaN display values | Bare division (e.g. `total / count`) with no zero-guard — all three forms acceptable: `count > 0 ? Math.round(total / count) : 0`, `Math.round(total / count) || 0`, `Math.round(total / (count ?? 1))` |
| Missing `key` props | `.map()` calls rendering JSX elements without a `key` prop |
| Missing CSS classes | Component references a class name not in any admin CSS module |

### A2. Component Patterns

#### Tab Bar (replaces all `<select>` tab switchers)

```tsx
// CSS class: .tabBar (pill container), .tabItem, .tabItemActive
<div className={styles.tabBar}>
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

CSS to add to `admin/core.module.css`:
```css
.tabBar { display:flex; gap:2px; background:var(--s3); border:1px solid var(--b1); border-radius:8px; padding:3px; width:fit-content; margin-bottom:16px; }
.tabItem { padding:6px 14px; border-radius:6px; font-size:0.72rem; font-family:var(--font-syne); font-weight:600; color:var(--muted); background:transparent; border:none; cursor:pointer; transition:all 0.15s; }
.tabItemActive { background:var(--accent); color:#fff; }
```

#### KPI Card Variants

Three variants added to admin CSS:
- `.kpiCardPrimary` — purple gradient, accent-tinted label
- `.kpiCardNeutral` — `--s2` surface, muted label
- `.kpiCardAmber` — amber-tinted background/border, amber label
- `.kpiCardRed` — red-tinted background/border, red label

#### Alert Banner

```tsx
// CSS classes: .alertBanner, .alertBannerInfo, .alertBannerWarning, .alertBannerCritical
<div className={cx("alertBanner", "alertBannerWarning")}>
  <div>
    <div className={cx("fontMono", "text10", "uppercase", "tracking", "colorAmber")}>Warning</div>
    <div className={cx("text12")}>3 invoices overdue — oldest 21 days</div>
  </div>
  <button type="button" className={cx("text10", "colorMuted")}>View →</button>
</div>
```

CSS:
```css
.alertBanner { border-left:3px solid; border-radius:0 8px 8px 0; padding:9px 14px; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.alertBannerInfo { background:rgba(139,111,255,0.08); border-color:var(--accent); }
.alertBannerWarning { background:rgba(251,191,36,0.06); border-color:var(--amber); }
.alertBannerCritical { background:rgba(239,68,68,0.06); border-color:var(--red); }
```

#### Skeleton Loading State

Skeleton JSX must **approximate the real page structure** — not a full-page spinner. For a page with 4 KPI cards + a table:

```tsx
if (loading) return (
  <div className={styles.pageBody}>
    <div className={styles.pageHeader}>
      <div className={cx("skeletonBlock")} style={{ width: 160, height: 12 }} />
      <div className={cx("skeletonBlock")} style={{ width: 240, height: 22, marginTop: 6 }} />
    </div>
    <div className={styles.kpiGrid}>
      {[0,1,2,3].map(i => (
        <div key={i} className={cx(styles.card, "skeletonCard")}>
          <div className="skeletonBlock" style={{ width: '60%', height: 9 }} />
          <div className="skeletonBlock" style={{ width: '40%', height: 22, marginTop: 10 }} />
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

CSS skeleton utilities (add to `admin/core.module.css`):
```css
@keyframes adminSkeletonPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
.skeletonBlock { background:rgba(255,255,255,0.06); border-radius:4px; animation:adminSkeletonPulse 1.5s ease-in-out infinite; }
.skeletonCard { animation:adminSkeletonPulse 1.5s ease-in-out infinite; }
```

#### Empty State

Use the existing `EmptyState` component from `admin-page-utils.tsx` — it already supports `title`, `subtitle`, `variant`, and `action`. Ensure every `.map()` over data arrays has an empty-state branch:

```tsx
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
// CSS: .healthBarWrap, .healthBarBg, .healthBarFill (dynamic width via style)
function healthColor(score: number) {
  if (score >= 70) return 'var(--accent-green, #4ade80)';
  if (score >= 50) return 'var(--amber)';
  return 'var(--red)';
}
```

### A3. Page-Specific Patterns by Batch

#### Table-heavy pages (Clients, Leads, Invoices, Payroll, Recruitment, Staff, etc.)
- 5-column KPI strip above the table
- Search input + filter chips row
- Tab bar above the table
- Expandable rows for nested entities (projects under clients, line items under invoices)
- Row-level severity highlighting (red left border for critical rows)
- Pagination row at bottom

#### Dashboard / overview pages (Executive, Owner, RevOps, etc.)
- Full-width KPI grid (4 cards)
- Alert banner section (conditionally rendered when alerts exist)
- Tab bar
- Main split layout: chart/primary content left, entity list right
- Bottom row of 3 cards: utilisation donut · pipeline funnel · activity feed

#### Form / detail pages (Settings, Onboarding, Brand Control, etc.)
- Tab bar to separate sections
- Section cards with clear headings
- Form inputs styled to `--s3` background
- Save/submit button in accent purple

#### Calendar / timeline pages (Cash Flow Calendar, Timeline Gantt, Meeting Archive)
- Month navigation with prev/next arrows
- Calendar grid with event chips using tone colours
- List view toggle

---

## Track B — Functionality

### B1. API Wiring Pattern

All admin pages follow this pattern (mirrors `executive-dashboard-page.tsx`):

```tsx
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadXWithRefresh } from "../../../../lib/api/admin/x";
import type { PageId } from "../config";

export function XPage({ session, onNavigate }: { session: AuthSession; onNavigate: (page: PageId) => void }) {
  const [data, setData] = useState<XType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadXWithRefresh(session).then(result => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) { setError(result.error.message); setLoading(false); return; }
      setData(result.data ?? []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  if (loading) return (/* skeleton JSX */);
  if (error) return (/* error card JSX */);

  return (/* real page JSX using data */);
}
```

Key rules:
- Always use `cancelled` flag to prevent state updates after unmount
- Always call `saveSession(result.nextSession)` when `nextSession` is non-null
- Always handle `result.error` before accessing `result.data`
- Skeleton JSX must approximate the real page layout
- Error card must show the error message + a retry button that re-sets `loading(true)` to re-trigger the effect

### B2. `loadXWithRefresh` Convention

Every API client function follows this signature:

```ts
export async function loadXWithRefresh(session: AuthSession): Promise<AuthorizedResult<XType[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const res = await callGateway<XType[]>("/admin/x", accessToken);
    if (isUnauthorized(res)) return { unauthorized: true, data: null, error: null };
    if (!res.payload.success) return { unauthorized: false, data: null, error: toGatewayError(res.payload.error.code, res.payload.error.message) };
    return { unauthorized: false, data: res.payload.data, error: null };
  });
}
```

For mutation endpoints (POST/PATCH/DELETE), add separate `createX`, `updateX`, `deleteX` functions using `callGateway` with `{ method: "POST", body: payload }`.

### B3. Missing API Clients to Build

Pages that reference data domains not yet covered by an existing admin API client file:

| Missing Client | File to create | Gateway routes to call |
|---------------|---------------|----------------------|
| `bookings.ts` | `apps/web/src/lib/api/admin/bookings.ts` | `/admin/bookings`, `/admin/appointments` |
| `health.ts` | `apps/web/src/lib/api/admin/health.ts` | `/admin/health-scores`, `/admin/interventions` |
| `satisfaction.ts` | `apps/web/src/lib/api/admin/satisfaction.ts` | `/admin/satisfaction`, `/admin/feedback` |
| `communications.ts` | `apps/web/src/lib/api/admin/communications.ts` | `/admin/communication-logs` |
| `brand.ts` | `apps/web/src/lib/api/admin/brand.ts` | `/admin/brand-assets`, `/admin/content-submissions` |
| `knowledge.ts` | `apps/web/src/lib/api/admin/knowledge.ts` | `/admin/knowledge-articles` |
| `handovers.ts` | `apps/web/src/lib/api/admin/handovers.ts` | `/admin/handovers` |
| `decisions.ts` | `apps/web/src/lib/api/admin/decisions.ts` | `/admin/decisions`, `/admin/decision-records` |
| `announcements.ts` | `apps/web/src/lib/api/admin/announcements.ts` | `/admin/announcements` |
| `design-reviews.ts` | `apps/web/src/lib/api/admin/design-reviews.ts` | `/admin/design-reviews` |
| `peer-reviews.ts` | `apps/web/src/lib/api/admin/peer-reviews.ts` | `/admin/peer-reviews` |
| `standup.ts` | `apps/web/src/lib/api/admin/standup.ts` | `/admin/standup` |
| `risks.ts` | `apps/web/src/lib/api/admin/risks.ts` | `/admin/risks` |

If a gateway route doesn't exist either, add it to `services/core/src/routes/` following the existing pattern (Prisma query → `ApiResponse<T>` shape) and register it in the gateway controller.

### B4. Derived Metrics Rules

All computed metrics displayed in the UI must have zero-division guards:
- `count > 0 ? Math.round(total / count) : 0` — preferred form (explicit intent)
- `Math.round(total / count) || 0` — acceptable
- `Math.round(total / (count ?? 1))` — acceptable

Percentages must be clamped: `Math.min(100, Math.max(0, pct))`.

Currency values (cents) must use the existing `centsToK()` helper or `Intl.NumberFormat`.

---

## Page Batches

### Batch 1 — Command (6 pages)
| Page file | UI changes | API client |
|-----------|-----------|-----------|
| `owners-workspace-page.tsx` | Replace select tabs; skeleton; KPI cards; alert banners | `governance.ts` (decisions, notes) |
| `executive-dashboard-page.tsx` | Already wired; add tab bar; add alert banners; add health list | Already wired via `clients.ts`, `hr.ts` |
| `business-development-page.tsx` | Replace select tabs; skeleton; KPI strip | `pipeline.ts` |
| `ai-action-recommendations-page.tsx` | Skeleton; empty state | `ai.ts` |
| `decision-registry-page.tsx` | Replace select tabs; skeleton | `decisions.ts` (new) |
| `eod-digest-page.tsx` | Skeleton; empty state | `governance.ts` |

### Batch 2 — Revenue (7 pages)
| Page file | UI changes | API client |
|-----------|-----------|-----------|
| `leads-page.tsx` | Tab bar; table with severity rows; skeleton | `clients.ts` (leads) |
| `prospecting-page.tsx` | KPI strip; table; skeleton | `prospecting.ts` |
| `pipeline-analytics-page.tsx` | Funnel bars; tab bar; skeleton | `pipeline.ts` |
| `revops-dashboard-page.tsx` | KPI grid; sparklines; tab bar; skeleton | `billing.ts` + `pipeline.ts` |
| `revenue-forecasting-page.tsx` | Bar chart; KPI strip; skeleton | `billing.ts` |
| `referral-tracking-page.tsx` | Table; KPI strip; skeleton | `clients.ts` (referrals) |
| `invoice-chasing-page.tsx` | Alert banners; severity table; skeleton | `billing.ts` |

### Batch 3 — Clients (9 pages)
| Page file | UI changes | API client |
|-----------|-----------|-----------|
| `clients-projects-page.tsx` | Expandable table; KPI strip; health bars; filter chips | `clients.ts` + `project-layer.ts` |
| `client-journey-page.tsx` | Tab bar; timeline layout; skeleton | `client-ops.ts` |
| `client-health-scorecard-page.tsx` | Health bars; KPI strip; severity rows; skeleton | `health.ts` (new) |
| `client-satisfaction-page.tsx` | KPI strip; chart; skeleton | `satisfaction.ts` (new) |
| `lifecycle-dashboard-page.tsx` | Tab bar; stage funnel; skeleton | `client-ops.ts` |
| `client-onboarding-page.tsx` | Step progress; KPI strip; skeleton | `onboarding.ts` |
| `client-offboarding-page.tsx` | Step progress; skeleton | `closeout.ts` |
| `loyalty-credits-page.tsx` | KPI strip; table; skeleton | `loyalty.ts` |
| `sla-tracker-page.tsx` | Alert banners; severity table; skeleton | `billing.ts` (SLA data) |

### Batch 4 — Projects (9 pages)
| Page file | UI changes | API client |
|-----------|-----------|-----------|
| `project-portfolio-page.tsx` | KPI strip; expandable table; health bars; skeleton | `project-layer.ts` |
| `project-operations-page.tsx` | Tab bar; board + list toggle; skeleton | `project-ops.ts` |
| `sprint-board-admin-page.tsx` | Kanban columns; skeleton | `project-ops.ts` |
| `timeline-gantt-page.tsx` | Gantt bars; month nav; skeleton | `project-layer.ts` |
| `capacity-forecast-page.tsx` | Utilisation donut; KPI strip; skeleton | `capacity.ts` |
| `resource-allocation-page.tsx` | Assignment table; progress bars; skeleton | `capacity.ts` |
| `portfolio-risk-register-page.tsx` | Severity table; KPI strip; skeleton | `risks.ts` (new) |
| `change-request-manager-page.tsx` | Tab bar; table; skeleton | `project-ops.ts` |
| `quality-assurance-page.tsx` | Tab bar; score cards; skeleton | `project-ops.ts` |

### Batch 5 — Finance (9 pages)
| Page file | UI changes | API client |
|-----------|-----------|-----------|
| `invoices-page.tsx` | KPI strip; severity table; filter chips; skeleton | `billing.ts` |
| `payroll-ledger-page.tsx` | KPI strip; table; skeleton | `expenses.ts` |
| `cash-flow-calendar-page.tsx` | Calendar grid; month nav; event chips; skeleton | `billing.ts` |
| `expense-tracker-page.tsx` | KPI strip; table; category bars; skeleton | `expenses.ts` |
| `profitability-per-client-page.tsx` | Already partially wired; add tab bar; skeleton | `billing.ts` + `clients.ts` |
| `profitability-per-project-page.tsx` | Already partially wired; add tab bar; skeleton | `billing.ts` + `project-layer.ts` |
| `financial-year-closeout-page.tsx` | Step progress; KPI strip; skeleton | `closeout.ts` |
| `vendor-cost-control-page.tsx` | KPI strip; table; skeleton | `vendors.ts` |
| `invoice-chasing-page.tsx` | (see Batch 2) | |

### Batch 6 — People (13 pages)
| Page file | UI changes | API client |
|-----------|-----------|-----------|
| `staff-access-page.tsx` | Table; role badges; skeleton | `staff.ts` |
| `employment-records-page.tsx` | Tab bar; table; skeleton | `hr.ts` |
| `staff-satisfaction-page.tsx` | KPI strip; chart; skeleton | `satisfaction.ts` (new) |
| `staff-utilisation-page.tsx` | Donut chart; bar chart; KPI strip; skeleton | `utilisation.ts` |
| `staff-transition-planner-page.tsx` | Tab bar; table; skeleton | `hr.ts` |
| `staff-onboarding-page.tsx` | Step progress; KPI strip; skeleton | `hr.ts` |
| `peer-review-queue-page.tsx` | Tab bar; table; skeleton | `peer-reviews.ts` (new) |
| `recruitment-pipeline-page.tsx` | Kanban columns; KPI strip; skeleton | `hr.ts` |
| `leave-absence-page.tsx` | Calendar grid; table; skeleton | `hr.ts` |
| `learning-development-page.tsx` | Progress bars; table; skeleton | `hr.ts` |
| `team-structure-page.tsx` | Org chart or table; KPI strip; skeleton | `hr.ts` |
| `team-performance-report-page.tsx` | Tab bar; score cards; skeleton | `utilisation.ts` |
| `standup-feed-page.tsx` | Feed list; date nav; skeleton | `standup.ts` (new) |

### Batch 7 — Intelligence (9 pages)
| Page file | UI changes | API client |
|-----------|-----------|-----------|
| `strategic-client-intelligence-page.tsx` | Tab bar; detail split; skeleton | `client-ops.ts` |
| `competitor-market-intel-page.tsx` | Tab bar; card grid; skeleton | `prospecting.ts` |
| `communication-audit-page.tsx` | KPI strip; table; skeleton | `communications.ts` (new) |
| `health-interventions-page.tsx` | Alert banners; severity table; skeleton | `health.ts` (new) |
| `crisis-command-page.tsx` | Alert banners; severity rows; skeleton | `support.ts` |
| `active-health-monitor-page.tsx` | KPI strip; health bars; live indicator; skeleton | `health.ts` (new) |
| `project-briefing-page.tsx` | Detail layout; tab bar; skeleton | `project-layer.ts` |
| `closeout-review-page.tsx` | Step progress; checklist; skeleton | `closeout.ts` |
| `booking-appointments-page.tsx` | Calendar grid; list view; skeleton | `bookings.ts` (new) |

### Batch 8 — Operations (16 pages)
| Page file | UI changes | API client |
|-----------|-----------|-----------|
| `messages-page.tsx` | Inbox split; thread panel; skeleton | `support.ts` |
| `notifications-page.tsx` | Tab bar; feed list; skeleton | `notifications.ts` |
| `announcements-manager-page.tsx` | Card list; create form; skeleton | `announcements.ts` (new) |
| `support-queue-page.tsx` | Severity table; KPI strip; skeleton | `support.ts` |
| `content-approval-page.tsx` | Tab bar; card grid; skeleton | `brand.ts` (new) |
| `design-review-admin-page.tsx` | Tab bar; card grid; skeleton | `design-reviews.ts` (new) |
| `brand-control-page.tsx` | Tab bar; asset grid; skeleton | `brand.ts` (new) |
| `knowledge-base-admin-page.tsx` | Search; article list; skeleton | `knowledge.ts` (new) |
| `document-vault-page.tsx` | Folder tree; file table; skeleton | `documents.ts` |
| `automation-audit-trail-page.tsx` | Filter chips; event feed; skeleton | `automation.ts` |
| `webhook-hub-page.tsx` | Table; status badges; skeleton | `webhooks.ts` |
| `platform-infrastructure-page.tsx` | Status cards; KPI strip; skeleton | `governance.ts` |
| `access-control-page.tsx` | Role table; permission grid; skeleton | `auth-2fa.ts` + `staff.ts` |
| `legal-page.tsx` | Document list; skeleton | `contracts.ts` |
| `admin-settings-page-client.tsx` | Tab bar; form sections; skeleton | `settings.ts` |
| `admin-audit-page-client.tsx` | Filter chips; event feed; skeleton | `governance.ts` |

---

## Structural Audit Checklist (both tracks verify)

| Severity | Check |
|----------|-------|
| Critical | Missing CSS class referenced in JSX |
| Critical | `<select>` used as tab switcher |
| Critical | No loading state on a page with API call |
| Critical | No error state on a page with API call |
| Warning | Bare empty state (text only) |
| Warning | NaN division — no zero guard |
| Warning | Missing `key` prop in `.map()` |
| Warning | Skeleton doesn't approximate real page structure |
| Info | Unused CSS class |

---

## Out of Scope

- No new pages or routes
- No changes to `services/core` Prisma schema (only new routes if API client needs them)
- No changes to admin shell (sidebar, topbar, `chrome.tsx`) beyond what's required for a specific page
- No changes to client or staff dashboards
- No backend performance work
- No authentication or RBAC changes

---

## Success Criteria

**Track A (UI):**
- Zero `<select>` tab switchers remaining across all 95 pages
- Every page has a skeleton state that mirrors its real layout
- Every page has an error state with a visible message
- Every `.map()` over data has a populated empty state (icon + title + subtitle)
- No bare division without zero-guard
- Executive Intelligence visual system applied uniformly (KPI cards, alert banners, health bars)

**Track B (Functionality):**
- Zero static empty arrays remain as the sole data source on any page
- Every page calls at least one API client function via `withAuthorizedSession`
- Every page saves `nextSession` when returned
- All 13 missing API clients created and exported from `apps/web/src/lib/api/admin/index.ts`
- TypeScript compiles with `pnpm --filter @maphari/web exec tsc --noEmit`
