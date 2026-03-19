# Refined Data Studio — Visual Elevation Design Spec

## Overview

A two-layer visual reskin of all 250 dashboard pages (96 admin / 82 staff / 72 client) using the "Refined Data Studio" aesthetic direction. No layout changes. No API changes. No new component logic. Pure CSS elevation.

**Direction:** Refined Data Studio — near-black surfaces, monospace data density, Bloomberg-terminal confidence, minimal chrome.

**Approach:** Token cascade (global lift for all 250 pages) + additive `rdStudio*` utility classes (targeted treatment for 15 hero pages).

---

## Layer 1 — Global Token Lift

Applied via `apps/web/src/app/style/dashboard-token-scale.css`. Cascades to all 250 pages automatically.

### Surface tokens

| Token | Current intent | Change |
|-------|---------------|--------|
| `--s1` | Card background | Shift 2–3% darker, add cool blue-black tint (`#0e0e14` base) |
| `--s2` | Hover state | Darker step, maintain contrast ratio |
| `--s3` | Input background | Tighter, cooler |
| `--s4` | Selected state | Cooler tint, same luminance |

Goal: clear surface stratification — cards sit above page, modals above cards.

### Border tokens

| Token | Change |
|-------|--------|
| `--b1` (dividers) | More visible — 8% white opacity vs near-invisible |
| `--b2` (card borders) | Crisper, colder hue |
| `--b3` (focus/hover) | Unchanged — lime accent already correct |

### Typography token

Add `--font-data: var(--font-dm-mono)` to `:root`. Applied globally to:
- All currency values
- Percentages
- Counts and totals
- Dates and timestamps
- Status codes

Numbers read as numbers — not body copy.

### Density

| Property | Before | After |
|----------|--------|-------|
| Card internal padding | 20px | 16px |
| Table row height | 52px | 44px |
| Section header margin-bottom | 24px | 16px |

Still breathable. More information per viewport.

---

## Layer 2 — Hero Page Additive Classes

Six utility classes added to `apps/web/src/app/style/shared/utilities.module.css`. Applied selectively to hero page elements via the existing `cx()` helper. No new imports required on any page.

### Class definitions

**`.rdStudioLabel`**
- Font: `var(--font-data)` (DM Mono)
- Size: 9px
- Case: uppercase
- Letter-spacing: 0.18em
- Color: `var(--muted)`
- Use: data field labels, section subtitles, column headers

**`.rdStudioMetric`**
- Font: `var(--font-data)`
- Size: contextual (2–3× surrounding text)
- Weight: 600
- Color: `var(--lime)` for positive / `var(--red)` for negative / `var(--amber)` for warning / `var(--text)` for neutral
- Use: KPI numbers, totals, percentages, key figures

**`.rdStudioCard`**
- Border: 1px cool-toned (colder than `--b2`)
- Border-radius: 0 on top corners, `var(--r-sm)` on bottom corners
- Top accent stripe: 1px `var(--lime)` top border
- Background: `var(--s1)` (inherits, no change)
- Use: primary data cards on hero pages

**`.rdStudioRow`**
- Border-bottom: 1px `var(--b1)` (replaces gap spacing)
- Row height: 40px
- Font-variant-numeric: tabular-nums
- All inline numbers: `var(--font-data)`
- Use: table rows, list rows on hero pages

**`.rdStudioSection`**
- Left border: 2px solid `var(--lime)`
- Padding-left: 12px
- Label child: `rdStudioLabel` treatment
- Title child: medium-weight DM Mono uppercase
- Use: section header wrappers on hero pages

**`.rdStudioPage`**
- Applied to the hero page root `div`
- Sets `font-variant-numeric: tabular-nums` page-scope
- Sets `letter-spacing: -0.01em` page-scope
- Effect: all data in the page inherits tabular number alignment

### Usage pattern

```tsx
// Example: Executive Dashboard KPI block
<div className={cx("pageSection", "rdStudioSection")}>
  <span className={cx("sectionLabel", "rdStudioLabel")}>Monthly Revenue</span>
  <span className={cx("kpiValue", "rdStudioMetric")}>R 248,500</span>
</div>
```

No existing class is removed or renamed. `rdStudio*` classes are purely additive.

---

## Hero Pages (15 total)

### Admin dashboard (5 pages)

| Page | File | Key elements to elevate |
|------|------|------------------------|
| Executive Dashboard | `pages/executive-dashboard-page.tsx` | KPI numbers → `rdStudioMetric`, section headers → `rdStudioSection`, stat cards → `rdStudioCard` |
| Revenue Forecasting | `pages/revenue-forecasting-page.tsx` | Forecast figures → `rdStudioMetric`, scenario rows → `rdStudioRow`, section labels → `rdStudioLabel` |
| RevOps Dashboard | `pages/revops-dashboard-page.tsx` | Pipeline metrics → `rdStudioMetric`, conversion labels → `rdStudioLabel`, data cards → `rdStudioCard` |
| Cash Flow Calendar | `pages/cash-flow-calendar-page.tsx` | Cashflow amounts → `rdStudioMetric`, calendar labels → `rdStudioLabel`, period cards → `rdStudioCard` |
| Business Development | `pages/business-development-page.tsx` | Lead counts/values → `rdStudioMetric`, stage labels → `rdStudioLabel`, pipeline rows → `rdStudioRow` |

### Staff dashboard (5 pages)

| Page | File | Key elements to elevate |
|------|------|------------------------|
| My Dashboard | `pages/dashboard-page.tsx` | Today's task count → `rdStudioMetric`, priority labels → `rdStudioLabel`, task cards → `rdStudioCard` |
| Kanban Board | `pages/kanban-page.tsx` | Column counts → `rdStudioMetric`, column headers → `rdStudioSection`, card labels → `rdStudioLabel` |
| Sprint Planning | `pages/sprint-planning-page.tsx` | Velocity figures → `rdStudioMetric`, sprint labels → `rdStudioLabel`, task rows → `rdStudioRow` |
| Daily Standup | `pages/daily-standup-page.tsx` | Team member sections → `rdStudioSection`, status labels → `rdStudioLabel` |
| Deliverables | `pages/deliverables-page.tsx` | Deliverable rows → `rdStudioRow`, status labels → `rdStudioLabel`, count badges treated as metrics |

### Client portal (5 pages)

| Page | File | Key elements to elevate |
|------|------|------------------------|
| Home / Overview | `pages/home-page.tsx` | Active project count → `rdStudioMetric`, section headers → `rdStudioSection`, summary cards → `rdStudioCard` |
| My Projects | `pages/my-projects-page.tsx` | Progress % → `rdStudioMetric`, project labels → `rdStudioLabel`, project cards → `rdStudioCard` |
| Billing & Payments | `pages/billing-page.tsx` | Invoice totals → `rdStudioMetric`, invoice rows → `rdStudioRow`, balance labels → `rdStudioLabel` |
| Messages | `pages/messages-page.tsx` | Message count → `rdStudioMetric`, thread labels → `rdStudioLabel`, thread rows → `rdStudioRow` |
| Onboarding Hub | `pages/onboarding-page.tsx` | Progress % → `rdStudioMetric`, step labels → `rdStudioLabel`, step cards → `rdStudioCard` |

All 15 hero pages also receive `.rdStudioPage` on their root wrapper.

---

## File Inventory

| File | Change type |
|------|-------------|
| `apps/web/src/app/style/dashboard-token-scale.css` | Modify — update 8 token values |
| `apps/web/src/app/style/shared/utilities.module.css` | Modify — append 6 `rdStudio*` classes (~80 lines) |
| `apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/admin/dashboard/pages/revenue-forecasting-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/admin/dashboard/pages/revops-dashboard-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/admin/dashboard/pages/cash-flow-calendar-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/admin/dashboard/pages/business-development-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/staff/staff-dashboard/pages/dashboard-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/staff/staff-dashboard/pages/kanban-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/staff/staff-dashboard/pages/sprint-planning-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/staff/staff-dashboard/pages/daily-standup-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/client/maphari-dashboard/pages/home-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/client/maphari-dashboard/pages/my-projects-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/client/maphari-dashboard/pages/billing-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/client/maphari-dashboard/pages/messages-page.tsx` | Modify — apply `rdStudio*` classes |
| `apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx` | Modify — apply `rdStudio*` classes |

**Total: 17 files modified. 0 files created.**

---

## Constraints

- No layout changes — same component structure, same grid, same responsive breakpoints
- No API changes — no new data fetching, no new props
- No new shared component files
- No existing class names renamed or removed
- `rdStudio*` classes are purely additive — zero regression risk on non-hero pages
- TypeScript verification (`pnpm --filter @maphari/web exec tsc --noEmit`) must pass after each task

---

## Success Criteria

1. All 250 pages render with tighter, darker, more data-dense surface treatment (global token lift)
2. All 15 hero pages show monospace metrics, terminal-style section labels, and `rdStudioCard` treatment on primary cards
3. No TypeScript errors introduced
4. No visual regressions on responsive breakpoints
5. Dynamic CSS class names (badge tones, progress fills, etc.) remain unaffected
