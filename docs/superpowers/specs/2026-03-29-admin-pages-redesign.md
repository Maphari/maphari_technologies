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

Used for: AreaChart (trends), BarChart (comparisons), LineChart (multi-series), RadialBarChart (scores/percentages). All charts are responsive (`ResponsiveContainer`) and use the design token colours.

**Lazy loading:** `ChartWidget` uses `next/dynamic` internally with `ssr: false` for the Recharts import. The dynamic boundary lives inside `ChartWidget` itself — callers import `ChartWidget` normally and get lazy-loading for free without adding `dynamic()` at every callsite.

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

Each widget component imports `widgets.module.css` **directly** — they do not go through `style.ts`. This keeps widget components self-contained and avoids class-name collisions in the merged `style.ts` namespace. Pages that use widgets do not need to import `widgets.module.css` themselves.

**Column span:** widgets use CSS utility classes (`.span2`, `.span3`, `.span4`) defined in `widgets.module.css`. Callers apply these classes on the widget element via `className`. This is consistent with the existing CSS-module-only pattern throughout this codebase.

```tsx
// Example callsite
<StatWidget className={widgetStyles.span2} label="MRR" value="R84,000" />
```

### 4.1 StatWidget
```
Props: label, value, sub?, toneVariant?, sparkData?, progressValue?, className?
toneVariant: 'default' | 'accent' | 'green' | 'amber' | 'red'
sparkData: number[]   (8 values, normalised 0–100)
progressValue: number (0–100)
```
- Large number (1.5–2rem, `font-weight: 900`)
- Optional sparkline (8-bar mini bar chart) or progress bar (4px) — mutually exclusive; sparkData takes precedence
- Tone variants: `default` (neutral border), `accent` (purple fill), `green`, `amber`, `red`
- Value colour follows `toneVariant` automatically

### 4.2 ChartWidget
```
Props: label, currentValue?, data, dataKey, type, color?, legend?, height?, className?
dataKey: string | string[]          // single key or array for multi-series
color?: string | string[]           // matches length of dataKey array
type: 'area' | 'bar' | 'line'
height?: number                     // default 120
legend?: { key: string; label: string }[]
```
- Wraps Recharts chart types in `ResponsiveContainer`
- When `dataKey` is an array, renders one `<Line>` / `<Bar>` / `<Area>` per key, each with its corresponding `color`
- Header row: label left, `currentValue` + optional legend right
- Grid lines: `rgba(255,255,255,0.04)` horizontal rules via Recharts `<CartesianGrid>`
- Default colour: `#8b6fff`
- The purple area gradient (`#adminGradient`) is defined inline inside `ChartWidget`'s own `<defs>` block rendered as a Recharts `customized` child — self-contained, no external SVG required

### 4.3 TableWidget
```
Props: label, rows, columns, rowCount?, emptyMessage?, className?
columns: { key: string; header: string; align?: 'left'|'right'; render?: (val, row) => ReactNode }[]
```
- `render` function handles badge cells, formatted numbers, truncated text
- Empty state: muted "No data" message with icon
- Header row: `0.58rem` uppercase labels, `rgba(255,255,255,0.25)` colour
- Row dividers: `rgba(255,255,255,0.04)`

### 4.4 PipelineWidget
```
Props: label, stages: { label: string; count: number; total: number; color?: string }[], className?
```
- Horizontal bar per stage, width = `(count / total) * 100%`
- Stage label left (72px fixed), fill bar flex, count right
- If no `color` given, auto-sequence: accent → green → amber → red

### 4.5 WidgetGrid (layout container)
```
Props: children, columns?: 2|3|4 (default 4), className?
```
- CSS Grid with `gap: 10px`
- Responsive: 2-col at ≤900px, 1-col at ≤480px
- Children use `.span2` / `.span3` / `.span4` utility classes from `widgets.module.css` to declare their column span

---

## 5. Widget CSS

New file: `apps/web/src/app/style/admin/widgets.module.css`

Imported directly by widget components — **not** added to `style.ts`. No new design tokens; all values reference existing `--accent`, `--s1`, `--b1`, `--text`, `--muted`, etc. from the admin root.

Key classes:
- `.widget` — base card (border, radius, padding, flex column)
- `.widgetAccent` / `.widgetGreen` / `.widgetAmber` / `.widgetRed` — tone modifiers
- `.widgetLabel` — `0.6rem` uppercase, `--muted2`
- `.widgetValue` — big number, `font-weight: 900`
- `.widgetValueAccent` / `.widgetValueGreen` / `.widgetValueAmber` / `.widgetValueRed` — value colour variants
- `.widgetSub` — secondary descriptor line
- `.sparkWrap` / `.sparkBar` / `.sparkBarHi` — sparkline bars
- `.progWrap` / `.progFill` — progress bar
- `.pipelineRow` / `.pipelineLabel` / `.pipelineTrack` / `.pipelineFill` / `.pipelineCount` — pipeline bars
- `.widgetTable` / `.widgetThead` / `.widgetTh` / `.widgetTr` / `.widgetTd` — table internals
- `.widgetGrid` / `.widgetGrid2` / `.widgetGrid3` — grid containers
- `.span2` / `.span3` / `.span4` — column span utilities

---

## 6. Page Header

Each page gets a consistent header above the widget grid. `pageDesc` and `pageDivider` are new classes added to `widgets.module.css`:

```tsx
<div className={widgetStyles.pageHeader}>
  <div className={styles.pageEyebrow}>{section} / {title}</div>  {/* existing class */}
  <h1 className={styles.pageTitle}>{title}</h1>                   {/* existing class */}
  <p className={widgetStyles.pageDesc}>{description}</p>          {/* new in widgets.module.css */}
</div>
<div className={widgetStyles.pageDivider} />                      {/* new in widgets.module.css */}
```

- `pageDesc`: `0.68rem`, `--muted`, `margin-bottom: 18px`
- `pageDivider`: `1px solid var(--b1)`, `margin-bottom: 18px`
- `pageHeader`: `margin-bottom: 4px` wrapper div

Existing `pageEyebrow` and `pageTitle` classes (already in `core.module.css`) are reused unchanged.

---

## 7. Recharts Integration

Install: `pnpm --filter @maphari/web add recharts`

All Recharts components used within `"use client"` components. Chart data comes from each page's existing API hooks — no new API calls for the redesign.

**Dynamic import (inside ChartWidget):**
```tsx
// apps/web/src/components/admin/dashboard/widgets/chart-widget.tsx
"use client";
import dynamic from "next/dynamic";
const ChartWidgetInner = dynamic(() => import("./chart-widget-inner"), { ssr: false });
export function ChartWidget(props) { return <ChartWidgetInner {...props} />; }
```

`chart-widget-inner.tsx` contains all Recharts imports. This isolates the Recharts bundle from SSR and from the outer component tree.

**Chart defaults constant** (`widgets/chart-defaults.ts`):
```ts
export const CHART_DEFAULTS = {
  stroke: '#8b6fff',
  gradientId: 'adminGradient',
  gridStroke: 'rgba(255,255,255,0.04)',
  tickStyle: { fill: 'rgba(240,237,232,0.25)', fontSize: 10, fontFamily: 'var(--font-dm-mono)' },
}
```

**Gradient:** Defined inline inside `ChartWidgetInner` as a Recharts `customized` child:
```tsx
<defs>
  <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#8b6fff" stopOpacity={0.35} />
    <stop offset="100%" stopColor="#8b6fff" stopOpacity={0.02} />
  </linearGradient>
</defs>
```
Rendered once inside each chart's own SVG via Recharts' `customized` prop — self-contained, no page-level SVG required.

---

## 8. Implementation Order

Pages redesigned section by section. Within each section, all pages are done in one batch.

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
| 9 | Remaining | All remaining pages not covered in sections 1–8 |

---

## 9. What Does NOT Change

- Routing, page IDs, and navigation — untouched
- API hooks and data fetching — untouched
- Existing CSS tokens and the 7-file CSS split — `widgets.module.css` is purely additive
- TypeScript types and Prisma schema — untouched
- Tabs within pages — kept; widget grid applies within each tab view
- `style.ts` — not modified; widget components import their CSS directly

---

## 10. Success Criteria

- All 118 pages use the widget grid layout
- All stat numbers have sparklines or progress indicators where data supports it
- All trend data (time-series) has a Recharts area or bar chart
- Multi-series charts use `dataKey: string[]` with matching `color` arrays
- All tabular data uses `TableWidget` with badge cells
- TypeScript clean (`pnpm --filter @maphari/web exec tsc --noEmit` passes)
- Visually consistent across all pages — same grid, same widget shapes, same token usage
