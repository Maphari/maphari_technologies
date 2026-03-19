# Refined Data Studio — Visual Elevation Design Spec

## Overview

A two-layer visual reskin of all 250 dashboard pages (96 admin / 82 staff / 72 client) using the "Refined Data Studio" aesthetic direction. No layout changes. No API changes. No new component logic. Pure CSS elevation.

**Direction:** Refined Data Studio — near-black surfaces, monospace data density, Bloomberg-terminal confidence, minimal chrome.

**Approach:** Token cascade (global lift for all 250 pages) + additive `rdStudio*` utility classes (15 hero pages).

---

## Layer 1 — Global Token Lift

Applied via `apps/web/src/app/style/dashboard-token-scale.css`. Cascades to all 250 pages automatically. Only the `[data-theme="dark"]` block is modified — light mode is out of scope for this spec.

### Surface token changes (dark mode)

| Token | Current | New | Effect |
|-------|---------|-----|--------|
| `--bg-page` | `#0d0d0f` | `#0a0a0d` | Page background slightly deeper |
| `--s1` | `#161618` | `#11111c` | Card bg — darker, cool blue-black tint |
| `--s2` | `#1e1e22` | `#18182a` | Hover — cooler step |
| `--s3` | `#262628` | `#1f1f2e` | Input bg — cooler |
| `--s4` | `#2e2e32` | `#272738` | Selected — cooler tint |

### Border token changes (dark mode)

| Token | Current | New | Effect |
|-------|---------|-----|--------|
| `--b1` | `#2a2a2e` | `#222230` | Dividers — slightly cooler, maintain low contrast |
| `--b2` | `#323238` | `#2a2a42` | Card borders — colder, more defined |
| `--b3` | `#3e3e46` | unchanged | Focus/hover — keep as-is |

### Typography token (`:root` block)

Add one line to the existing `:root` block (line 20–23 region, after `--font-serif`):

```css
--font-data: var(--font-mono);
```

`--font-mono` is already defined in `:root` as `var(--font-dm-mono), monospace`. Using `--font-mono` (not `--font-dm-mono` directly) maintains the established font alias chain. Once added, `--font-data` is used by the `rdStudio*` classes below.

### Density (descoped from global layer)

Card padding and table row height density changes are **not** applied globally — hardcoded values are spread across too many split CSS files to change safely at global scope. Density is applied only via `rdStudioCard` and `rdStudioRow` on the 15 hero pages where the effect has been reviewed.

---

## Layer 2 — Hero Page Additive Classes

Seven utility classes added to `apps/web/src/app/style/shared/maphari-dashboard-shared.module.css`. This file IS already included in all three `style.ts` spreads (admin, staff, client), so no new imports are needed on any hero page.

The classes are appended to the end of `maphari-dashboard-shared.module.css`.

### Class definitions

---

**`.rdStudioPage`**
Applied to the hero page root `div`. Page-scope typographic defaults.

```css
.rdStudioPage {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
```

---

**`.rdStudioLabel`**
Data field labels, column headers, section subtitles.

```css
.rdStudioLabel {
  font-family: var(--font-data);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--text-muted);
}
```

---

**`.rdStudioMetric`**
Typography and size only. Compose with a color variant class (below) for semantic color.

```css
.rdStudioMetric {
  font-family: var(--font-data);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
```

**Color variant classes** — compose with `.rdStudioMetric`:

```css
.rdStudioMetricPos  { color: var(--green);  }   /* positive / achieved — semantic green, works across all dashboards */
.rdStudioMetricNeg  { color: var(--red);    }   /* negative / over-budget */
.rdStudioMetricWarn { color: var(--amber);  }   /* warning / at-risk */
/* neutral: use default --text, no modifier needed */
```

Usage: `cx("kpiValue", "rdStudioMetric", "rdStudioMetricPos")`

---

**`.rdStudioCard`**
Applied alongside existing card classes. Tightens chrome and adds terminal identity stripe.

```css
.rdStudioCard {
  border: 1px solid #2a2a42;            /* colder than --b2 (#323238) */
  border-top: 1px solid var(--accent);  /* 1px accent identity stripe — uses each dashboard's own accent (admin: purple, staff: teal, client: lime) */
  border-radius: 0 0 var(--r-sm) var(--r-sm); /* squared top, rounded bottom */
  padding: 16px;                         /* density: tighter than default 20px */
}
```

---

**`.rdStudioRow`**
Applied to table rows and list rows on hero pages.

```css
.rdStudioRow {
  border-bottom: 1px solid var(--b1);
  height: 40px;
  display: flex;
  align-items: center;
  font-variant-numeric: tabular-nums;
}

.rdStudioRow span,
.rdStudioRow td {
  font-family: var(--font-data);
}
```

---

**`.rdStudioSection`**
Applied to section header wrapper `div`. Developer manually places `.rdStudioLabel` on the label element inside.

```css
.rdStudioSection {
  border-left: 2px solid var(--accent); /* dashboard-specific accent — admin: purple, staff: teal, client: lime */
  padding-left: 12px;
  margin-bottom: 16px;
}
```

No child selectors. The label element inside gets `cx("sectionLabel", "rdStudioLabel")` applied independently by the developer.

---

### Usage pattern

```tsx
// Section header
<div className={cx("pageSection", "rdStudioSection")}>
  <span className={cx("sectionLabel", "rdStudioLabel")}>Monthly Revenue</span>
  <span className={cx("kpiValue", "rdStudioMetric", "rdStudioMetricPos")}>
    R 248,500
  </span>
</div>

// Table row
<div className={cx("tableRow", "rdStudioRow")}>
  <span>Invoice #4821</span>
  <span className={cx("rdStudioMetric", "rdStudioMetricNeg")}>-R 12,000</span>
</div>

// Card
<div className={cx("card", "rdStudioCard")}>...</div>
```

No existing class is removed or renamed. All `rdStudio*` classes are purely additive.

---

## Hero Pages (15 total)

All 15 hero pages receive `.rdStudioPage` on their root wrapper `div`. The table below lists which additional classes each page applies and where.

### Admin dashboard (5 pages)

| Page | File | `rdStudioSection` | `rdStudioMetric` | `rdStudioCard` | `rdStudioRow` | `rdStudioLabel` |
|------|------|:-:|:-:|:-:|:-:|:-:|
| Executive Dashboard | `pages/executive-dashboard-page.tsx` | Section wrappers | KPI numbers, revenue totals | Stat cards | — | Field labels, column headers |
| Revenue Forecasting | `pages/revenue-forecasting-page.tsx` | Scenario sections | Forecast figures, ARR values | Scenario cards | Scenario comparison rows | Period labels |
| RevOps Dashboard | `pages/revops-dashboard-page.tsx` | Metric sections | Pipeline value, conversion % | Metric cards | Funnel rows | Stage labels |
| Cash Flow Calendar | `pages/cash-flow-calendar-page.tsx` | Period sections | Cashflow amounts, balances | Period summary cards | — | Month/period labels |
| Business Development | `pages/business-development-page.tsx` | Pipeline sections | Lead values, win rate % | Stage cards | Lead rows | Stage/source labels |

### Staff dashboard (5 pages)

| Page | File | `rdStudioSection` | `rdStudioMetric` | `rdStudioCard` | `rdStudioRow` | `rdStudioLabel` |
|------|------|:-:|:-:|:-:|:-:|:-:|
| My Dashboard | `pages/dashboard-page.tsx` | Priority sections | Task counts, completion % | Summary cards | — | Section labels |
| Kanban Board | `pages/kanban-page.tsx` | Column headers | Column task counts | — | — | Column labels |
| Sprint Planning | `pages/sprint-planning-page.tsx` | Sprint sections | Velocity, story points | Sprint card | Task rows | Sprint labels |
| Daily Standup | `pages/daily-standup-page.tsx` | Team member sections | — | — | — | Status labels |
| Deliverables | `pages/deliverables-page.tsx` | Status sections | — | — | Deliverable rows | Status/due labels |

### Client portal (5 pages)

| Page | File | `rdStudioSection` | `rdStudioMetric` | `rdStudioCard` | `rdStudioRow` | `rdStudioLabel` |
|------|------|:-:|:-:|:-:|:-:|:-:|
| Home / Overview | `pages/home-page.tsx` | Summary sections | Active project count, open items | Summary cards | — | Section labels |
| My Projects | `pages/my-projects-page.tsx` | — | Progress %, milestone count | Project cards | — | Stage labels |
| Billing & Payments | `pages/billing-page.tsx` | Invoice sections | Invoice totals, balance due | — | Invoice rows | Date/status labels |
| Messages | `pages/messages-page.tsx` | — | Unread count | — | Thread rows | Timestamp labels |
| Onboarding Hub | `pages/onboarding-page.tsx` | Step sections | Completion % | Step cards | — | Step labels |

---

## File Inventory

| File | Change | Notes |
|------|--------|-------|
| `apps/web/src/app/style/dashboard-token-scale.css` | Modify | Update 7 token values in `[data-theme="dark"]` block; add `--font-data` to `:root` block |
| `apps/web/src/app/style/shared/maphari-dashboard-shared.module.css` | Modify | Append 7 `rdStudio*` classes + 3 color variant classes (~90 lines) |
| `apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/admin/dashboard/pages/revenue-forecasting-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/admin/dashboard/pages/revops-dashboard-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/admin/dashboard/pages/cash-flow-calendar-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/admin/dashboard/pages/business-development-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/staff/staff-dashboard/pages/dashboard-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/staff/staff-dashboard/pages/kanban-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/staff/staff-dashboard/pages/sprint-planning-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/staff/staff-dashboard/pages/daily-standup-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/client/maphari-dashboard/pages/home-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/client/maphari-dashboard/pages/my-projects-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/client/maphari-dashboard/pages/billing-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/client/maphari-dashboard/pages/messages-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |
| `apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx` | Modify | Apply `rdStudio*` classes via existing `cx()` |

**Total: 17 files modified. 0 files created.**

---

## Constraints

- No layout changes — same component structure, same grid, same responsive breakpoints
- No API changes — no new data fetching, no new props
- No new shared component files
- No new imports on hero page files — `rdStudio*` classes come from `maphari-dashboard-shared.module.css` which is already in all `style.ts` spreads
- No existing class names renamed or removed — `rdStudio*` classes are purely additive
- Only `[data-theme="dark"]` token values are modified — light mode is out of scope
- Dynamic CSS class names (badge tones: `badgeGreen`/`badgeRed` etc., progress fills, stat bars) must remain unaffected
- TypeScript verification (`pnpm --filter @maphari/web exec tsc --noEmit`) must pass after each task

---

## Success Criteria

1. All 250 pages render with tighter, darker, cooler surface treatment from the token lift
2. All 15 hero pages show monospace metrics, terminal-style section labels, and identity-stripe `rdStudioCard` treatment on primary cards
3. No TypeScript errors introduced
4. No visual regressions on responsive breakpoints (≤900px, ≤480px)
5. Dynamic CSS class names remain fully functional
