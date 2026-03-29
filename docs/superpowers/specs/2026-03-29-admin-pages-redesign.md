# Admin Dashboard Pages Redesign — Design Spec

**Date:** 2026-03-29
**Scope:** All 118 admin dashboard pages
**Approach:** Section-by-section, starting with Operations

---

## 1. Design Direction

**Command Center** — data-dense, high-information, power-user aesthetic. Maximum useful data visible at a glance. Every page should feel like a professional operator's console, not a marketing dashboard.

- Dark background (`#04040a`), purple accent (`#8b6fff`), semantic colours (green/amber/red) for status
- Monospace typography (`DM Mono`) for numbers and labels
- Dense but not cluttered — clear visual hierarchy through size and colour, not whitespace
- No decorative elements; every pixel earns its place

---

## 2. Chart Library

**Recharts** — added as a dependency to `apps/web/package.json`.

Used for: AreaChart (trends), BarChart (comparisons), LineChart (multi-series), RadialBarChart (scores/percentages). All charts are responsive (`ResponsiveContainer`), lazy-loaded, and use the design token colours.

---

## 3. Layout Pattern — Widget Grid

Each page is composed from a grid of purpose-built widgets. The grid uses CSS Grid with a base of 4 columns; widgets span 1–4 columns depending on content type.

**Standard page structure:**

```
┌─────────────────────────────────────────────┐
│  EYEBROW / PAGE TITLE / DESCRIPTION         │
│  ─────────────────────────────────────────  │
│  [StatWidget] [StatWidget] [StatWidget] [StatWidget]   │  row 1: 4-col KPI strip
│  [ChartWidget (span 2–3)]  [PipelineWidget] │  row 2: chart + supporting viz
│  [TableWidget (span 4)]                     │  row 3: full-width data table
└─────────────────────────────────────────────┘
```

Pages with less data use fewer rows. Pages with more complexity add additional rows. Tab navigation (existing) stays above the grid for sub-views.

---

## 4. Shared Widget Components

Located at `apps/web/src/components/admin/dashboard/widgets/`.

### 4.1 StatWidget
```
Props: label, value, sub?, trend?, toneVariant?, sparkData?, progressValue?
```
- Large number (1.5–2rem, `font-weight: 900`)
- Optional sparkline (8-bar mini bar chart) or progress bar (4px)
- Tone variants: `default` (neutral border), `accent` (purple fill), `green`, `amber`, `red`
- Trend indicator: `▲ X%` in green or `▼ X%` in red

### 4.2 ChartWidget
```
Props: label, currentValue?, data, dataKey, type ('area'|'bar'|'line'), color?, legend?
```
- Wraps Recharts `AreaChart` / `BarChart` / `LineChart` in a `ResponsiveContainer`
- Header row: label left, current value + optional legend right
- Grid lines: subtle `rgba(255,255,255,0.04)` horizontal rules
- Default colour: `#8b6fff`; override per-series with `color` prop
- Height: 120px default, configurable

### 4.3 TableWidget
```
Props: label, rows, columns, rowCount?, emptyMessage?
```
- Column definition: `{ key, header, align?, render? }`
- `render` function handles badge cells, formatted numbers, truncated text
- Empty state: muted "No data" message with icon
- Header row: `0.58rem` uppercase labels, `rgba(255,255,255,0.25)` colour
- Row dividers: `rgba(255,255,255,0.04)`

### 4.4 PipelineWidget
```
Props: label, stages: { label, count, total, color? }[]
```
- Horizontal bar per stage, proportional fill
- Stage label left (72px fixed), fill bar flex, count right
- Colours: auto-assigned based on stage position or explicit `color` prop (accent → green → amber → red)

### 4.5 WidgetGrid (layout container)
```
Props: children, columns?: 2|3|4 (default 4)
```
- CSS Grid with `gap: 10px`
- Responsive: 2-col at ≤900px, 1-col at ≤480px
- Each child widget declares its own `gridColumn: span N`

---

## 5. Widget CSS

New CSS file: `apps/web/src/app/style/admin/widgets.module.css`

Extends the existing admin token system. No new tokens introduced — all values reference existing `--accent`, `--s1`, `--b1`, `--text`, `--muted`, etc.

Key classes:
- `.widget` — base card (border, radius, padding)
- `.widgetAccent` / `.widgetGreen` / `.widgetAmber` / `.widgetRed` — tone modifiers
- `.widgetLabel` — small uppercase label
- `.widgetValue` — big number
- `.widgetSub` — secondary line
- `.sparkBar` / `.sparkBarHi` — sparkline bars
- `.progWrap` / `.progFill` — progress bar
- `.pipelineRow` / `.pipelineTrack` / `.pipelineFill` — pipeline bars
- `.widgetTable` / `.widgetTableHead` / `.widgetTableRow` — table internals

---

## 6. Page Header

Each page gets a consistent header above the widget grid:

```tsx
<div className={styles.pageHeader}>
  <div className={styles.pageEyebrow}>{section} / {title}</div>
  <h1 className={styles.pageTitle}>{title}</h1>
  <p className={styles.pageDesc}>{description}</p>
</div>
<div className={styles.pageDivider} />
```

Existing `pageEyebrow` + breadcrumb pattern already in place — this formalises it as a consistent component within the page body.

---

## 7. Recharts Integration

Install: `pnpm --filter @maphari/web add recharts`

All Recharts components used with `"use client"` directive. Chart data comes from the page's existing API hooks — no new API calls needed for the widget redesign itself.

Chart defaults applied globally via a `CHART_DEFAULTS` constant:
```ts
export const CHART_DEFAULTS = {
  stroke: '#8b6fff',
  fill: 'url(#adminGradient)',
  gridStroke: 'rgba(255,255,255,0.04)',
  tickStyle: { fill: 'rgba(240,237,232,0.25)', fontSize: 10, fontFamily: 'var(--font-dm-mono)' },
}
```

A shared `<AdminAreaGradient />` SVG `<defs>` component provides the purple gradient fill used across all area charts.

---

## 8. Implementation Order

Pages are redesigned section by section. Within each section, all pages get the widget grid treatment in a single implementation batch.

| Order | Section | Pages |
|-------|---------|-------|
| 1 | Operations | Executive, Business Dev, Leads, Clients, Projects, Portfolio, Resources, Gantt, QA, SLA |
| 2 | Finance | Billing, RevOps, Forecasting, Profitability ×2, Cash Flow, FY Closeout, Expenses, Payroll, Proposals, Pricing, Vendors |
| 3 | Experience | Onboarding, Offboarding, Satisfaction, Comms Audit, Vault, Referrals, Health Interventions, Journey, Loyalty, Bookings |
| 4 | Governance | Team, Platform, Brand, Workspace, Market Intel, Crisis, Performance, Access, Staff ×4 |
| 5 | Knowledge | Knowledge Base, Decisions, Handovers, Closeout, Transitions, Catalog |
| 6 | Lifecycle | Lifecycle, Stakeholders, AI Recs, Updates, Standup, EOD, Peer Review |
| 7 | Communication | Messages, Notifications, Announcements, Content |
| 8 | AI/ML | Automation, AI Actions, Webhook Hub, Proposed Actions |
| 9 | Remaining | All remaining pages not covered above |

---

## 9. What Does NOT Change

- Routing, page IDs, and navigation — untouched
- API hooks and data fetching — untouched
- Existing CSS tokens and the 7-file CSS split — widgets.module.css is additive
- TypeScript types and Prisma schema — untouched
- Tabs within pages — kept, widget grid applies within each tab view

---

## 10. Success Criteria

- All 118 pages use the widget grid layout
- All stat numbers have sparklines or progress indicators where data supports it
- All trend data (time-series) has a Recharts area or bar chart
- All tabular data uses `TableWidget` with badge cells
- Zero raw `Math.random()`, hardcoded dates, or `undefined` renders
- TypeScript clean (`pnpm --filter @maphari/web exec tsc --noEmit` passes)
- Visually consistent across all pages — same grid, same widget shapes, same token usage
