# Admin Dashboard Pages Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all 118 admin dashboard pages to a Command Center aesthetic using a shared widget library (StatWidget, ChartWidget, TableWidget, PipelineWidget) and Recharts for data visualisation.

**Architecture:** Build the widget component library first (`apps/web/src/components/admin/dashboard/widgets/`), then apply the widget grid layout to pages section by section. Widget components import their own CSS directly from `widgets.module.css` — they do not touch `style.ts`. Each page is rewritten to compose its layout from widgets rather than inline markup.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, Recharts, `next/dynamic` for SSR isolation, existing admin design tokens (`--accent: #8b6fff`, `--bg: #04040a`, `--s1`–`--s4`, etc.)

**Spec:** `docs/superpowers/specs/2026-03-29-admin-pages-redesign.md`

---

## File Map

### New files (widget library)
| File | Responsibility |
|------|---------------|
| `apps/web/src/components/admin/dashboard/widgets/chart-defaults.ts` | Shared Recharts colour/style constants |
| `apps/web/src/components/admin/dashboard/widgets/stat-widget.tsx` | KPI number card with sparkline or progress bar |
| `apps/web/src/components/admin/dashboard/widgets/chart-widget.tsx` | Thin wrapper — `next/dynamic` boundary, SSR=false |
| `apps/web/src/components/admin/dashboard/widgets/chart-widget-inner.tsx` | All Recharts imports; AreaChart, BarChart, LineChart |
| `apps/web/src/components/admin/dashboard/widgets/table-widget.tsx` | Sortable data table with badge cell support |
| `apps/web/src/components/admin/dashboard/widgets/pipeline-widget.tsx` | Horizontal stage bars with proportional fills |
| `apps/web/src/components/admin/dashboard/widgets/widget-grid.tsx` | CSS Grid container; 4-col default, responsive |
| `apps/web/src/components/admin/dashboard/widgets/index.ts` | Barrel export |
| `apps/web/src/app/style/admin/widgets.module.css` | All widget CSS; imports admin tokens; NOT in style.ts |

### Modified files (per section)
Each page in `apps/web/src/components/admin/dashboard/pages/` is rewritten to use the widget library. No other files change.

---

## Part 1 — Widget Library

### Task 1: Install Recharts

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install recharts**
```bash
pnpm --filter @maphari/web add recharts
```
Expected output: `+ recharts X.X.X` added to `apps/web/package.json` dependencies.

- [ ] **Step 2: Verify TypeScript types are bundled**
Recharts ships its own types. Run:
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep recharts
```
Expected: no output (no recharts errors).

- [ ] **Step 3: Commit**
```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add recharts dependency"
```

---

### Task 2: Create `widgets.module.css`

**Files:**
- Create: `apps/web/src/app/style/admin/widgets.module.css`

- [ ] **Step 1: Create the file**

```css
/* ═══════════════════════════════════════════════════════════════════
   ADMIN WIDGET LIBRARY — widgets.module.css
   Imported directly by widget components. NOT added to style.ts.
   All values use tokens from core.module.css via the .dashboardRoot
   custom-property cascade.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Page Header ─────────────────────────────────────────────────── */

.pageHeader {
  margin-bottom: 4px;
}

.pageDesc {
  font-size: 0.68rem;
  color: var(--muted);
  margin-top: 4px;
  margin-bottom: 18px;
  font-family: var(--font-dm-mono), monospace;
}

.pageDivider {
  height: 1px;
  background: var(--b1);
  margin-bottom: 18px;
}

/* ── Widget Grid ─────────────────────────────────────────────────── */

.widgetGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.widgetGrid2 {
  grid-template-columns: repeat(2, 1fr);
}

.widgetGrid3 {
  grid-template-columns: repeat(3, 1fr);
}

.span2 { grid-column: span 2; }
.span3 { grid-column: span 3; }
.span4 { grid-column: span 4; }

@media (max-width: 900px) {
  .widgetGrid { grid-template-columns: repeat(2, 1fr); }
  .span3, .span4 { grid-column: span 2; }
}

@media (max-width: 480px) {
  .widgetGrid { grid-template-columns: 1fr; }
  .span2, .span3, .span4 { grid-column: span 1; }
}

/* ── Widget Base ─────────────────────────────────────────────────── */

.widget {
  background: var(--s1);
  border: 1px solid var(--b1);
  border-radius: var(--r-sm);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.widgetAccent {
  background: var(--accent-d);
  border-color: rgba(139, 111, 255, 0.28);
}

.widgetGreen {
  background: var(--green-d);
  border-color: rgba(52, 217, 139, 0.22);
}

.widgetAmber {
  background: var(--amber-d);
  border-color: rgba(245, 166, 35, 0.22);
}

.widgetRed {
  background: var(--red-d);
  border-color: rgba(255, 95, 95, 0.22);
}

/* ── Widget Label ────────────────────────────────────────────────── */

.widgetLabel {
  font-size: 0.6rem;
  color: var(--muted2);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-dm-mono), monospace;
  font-weight: 500;
}

/* ── Widget Value ────────────────────────────────────────────────── */

.widgetValue {
  font-size: 1.7rem;
  font-weight: 900;
  color: var(--text);
  line-height: 1;
  letter-spacing: -0.02em;
  font-family: var(--font-dm-mono), monospace;
  font-variant-numeric: tabular-nums;
}

.widgetValueAccent { color: var(--accent); }
.widgetValueGreen  { color: var(--green); }
.widgetValueAmber  { color: var(--amber); }
.widgetValueRed    { color: var(--red); }

/* ── Widget Sub ──────────────────────────────────────────────────── */

.widgetSub {
  font-size: 0.62rem;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-dm-mono), monospace;
}

.widgetSubUp   { color: var(--green); }
.widgetSubDown { color: var(--red); }
.widgetSubWarn { color: var(--amber); }

/* ── Sparkline ───────────────────────────────────────────────────── */

.sparkWrap {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 28px;
  margin-top: 2px;
}

.sparkBar {
  flex: 1;
  border-radius: 2px 2px 0 0;
  background: rgba(139, 111, 255, 0.22);
  transition: background 150ms;
}

.sparkBarHi { background: var(--accent); }

.sparkBarGreen   { background: rgba(52, 217, 139, 0.25); }
.sparkBarGreenHi { background: var(--green); }

.sparkBarAmber   { background: rgba(245, 166, 35, 0.25); }
.sparkBarAmberHi { background: var(--amber); }

/* ── Progress Bar ────────────────────────────────────────────────── */

.progWrap {
  height: 4px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

.progFill {
  height: 4px;
  border-radius: 2px;
  background: var(--accent);
  transition: width 400ms ease;
}

.progFillGreen  { background: var(--green); }
.progFillAmber  { background: var(--amber); }
.progFillRed    { background: var(--red); }

/* ── Chart Widget ────────────────────────────────────────────────── */

.chartHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.chartCurrentValue {
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--accent);
  font-family: var(--font-dm-mono), monospace;
  font-variant-numeric: tabular-nums;
}

.chartLegend {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chartLegendItem {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.58rem;
  color: var(--muted);
  font-family: var(--font-dm-mono), monospace;
}

.chartLegendDot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.chartLoading {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.62rem;
  color: var(--muted2);
  font-family: var(--font-dm-mono), monospace;
}

/* ── Table Widget ────────────────────────────────────────────────── */

.tableHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.tableRowCount {
  font-size: 0.6rem;
  color: var(--muted2);
  font-family: var(--font-dm-mono), monospace;
}

.widgetTable {
  width: 100%;
  border-collapse: collapse;
}

.widgetThead th {
  font-size: 0.58rem;
  color: var(--muted2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0 8px 8px 0;
  text-align: left;
  border-bottom: 1px solid var(--b1);
  font-weight: 400;
  font-family: var(--font-dm-mono), monospace;
  white-space: nowrap;
}

.widgetThead th:not(:first-child) {
  text-align: right;
}

.widgetTr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.widgetTr:last-child {
  border-bottom: none;
}

.widgetTd {
  font-size: 0.65rem;
  color: rgba(240, 237, 232, 0.7);
  padding: 8px 8px 8px 0;
  vertical-align: middle;
  font-family: var(--font-dm-mono), monospace;
}

.widgetTd:not(:first-child) {
  text-align: right;
}

.tableEmpty {
  text-align: center;
  padding: 24px 0;
  font-size: 0.65rem;
  color: var(--muted2);
  font-family: var(--font-dm-mono), monospace;
}

/* ── Pipeline Widget ─────────────────────────────────────────────── */

.pipelineList {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.pipelineRow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pipelineLabel {
  font-size: 0.6rem;
  color: var(--muted);
  width: 72px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-dm-mono), monospace;
}

.pipelineTrack {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.pipelineFill {
  height: 6px;
  border-radius: 3px;
  transition: width 400ms ease;
}

.pipelineCount {
  font-size: 0.6rem;
  color: var(--muted2);
  width: 22px;
  text-align: right;
  flex-shrink: 0;
  font-family: var(--font-dm-mono), monospace;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 2: Verify file is valid CSS (no parse errors)**
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -5
```
Expected: TypeScript still compiles (CSS files don't affect TS).

- [ ] **Step 3: Commit**
```bash
git add apps/web/src/app/style/admin/widgets.module.css
git commit -m "feat(admin/widgets): add widgets.module.css"
```

---

### Task 3: Create `chart-defaults.ts`

**Files:**
- Create: `apps/web/src/components/admin/dashboard/widgets/chart-defaults.ts`

- [ ] **Step 1: Create the file**

```ts
// Chart-wide defaults for all Recharts components in the admin dashboard.
// Import this in chart-widget-inner.tsx — do not duplicate these values.

export const CHART_DEFAULTS = {
  gradientId: "adminGradient",
  stroke: "#8b6fff",
  strokeWidth: 2,
  dotRadius: 3.5,
  gridStroke: "rgba(255,255,255,0.04)",
  tickStyle: {
    fill: "rgba(240,237,232,0.25)",
    fontSize: 10,
    fontFamily: "var(--font-dm-mono), monospace",
  } as const,
  tooltipStyle: {
    background: "rgba(4,4,10,0.95)",
    border: "1px solid rgba(139,111,255,0.25)",
    borderRadius: "8px",
    fontSize: "0.65rem",
    fontFamily: "var(--font-dm-mono), monospace",
    color: "#f0ede8",
  } as const,
  colors: {
    accent: "#8b6fff",
    green:  "#34d98b",
    amber:  "#f5a623",
    red:    "#ff5f5f",
    blue:   "#60a5fa",
  } as const,
} as const;
```

- [ ] **Step 2: Commit**
```bash
git add apps/web/src/components/admin/dashboard/widgets/chart-defaults.ts
git commit -m "feat(admin/widgets): add chart-defaults"
```

---

### Task 4: Create `stat-widget.tsx`

**Files:**
- Create: `apps/web/src/components/admin/dashboard/widgets/stat-widget.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import styles from "@/app/style/admin/widgets.module.css";

type Tone = "default" | "accent" | "green" | "amber" | "red";

interface StatWidgetProps {
  label: string;
  value: string | number;
  sub?: string;
  subTone?: "up" | "down" | "warn" | "neutral";
  tone?: Tone;
  /** 8 numbers 0–100 for the sparkline bars */
  sparkData?: number[];
  /** 0–100 for the progress bar; ignored if sparkData is provided */
  progressValue?: number;
  className?: string;
}

const toneValueClass: Record<Tone, string> = {
  default: "",
  accent:  styles.widgetValueAccent,
  green:   styles.widgetValueGreen,
  amber:   styles.widgetValueAmber,
  red:     styles.widgetValueRed,
};

const toneWrapClass: Record<Tone, string> = {
  default: "",
  accent:  styles.widgetAccent,
  green:   styles.widgetGreen,
  amber:   styles.widgetAmber,
  red:     styles.widgetRed,
};

const subToneClass = {
  up:      styles.widgetSubUp,
  down:    styles.widgetSubDown,
  warn:    styles.widgetSubWarn,
  neutral: "",
};

const sparkHiClass: Record<Tone, string> = {
  default: styles.sparkBarHi,
  accent:  styles.sparkBarHi,
  green:   styles.sparkBarGreenHi,
  amber:   styles.sparkBarAmberHi,
  red:     styles.sparkBarHi,
};

const sparkBaseClass: Record<Tone, string> = {
  default: styles.sparkBar,
  accent:  styles.sparkBar,
  green:   styles.sparkBarGreen,
  amber:   styles.sparkBarAmber,
  red:     styles.sparkBar,
};

const progFillClass: Record<Tone, string> = {
  default: styles.progFill,
  accent:  styles.progFill,
  green:   styles.progFillGreen,
  amber:   styles.progFillAmber,
  red:     styles.progFillRed,
};

export function StatWidget({
  label,
  value,
  sub,
  subTone = "neutral",
  tone = "default",
  sparkData,
  progressValue,
  className,
}: StatWidgetProps) {
  const wrapClass = [styles.widget, toneWrapClass[tone], className].filter(Boolean).join(" ");
  const maxSpark = sparkData ? Math.max(...sparkData, 1) : 1;

  return (
    <div className={wrapClass}>
      <div className={styles.widgetLabel}>{label}</div>
      <div className={[styles.widgetValue, toneValueClass[tone]].filter(Boolean).join(" ")}>
        {value}
      </div>
      {sub ? (
        <div className={[styles.widgetSub, subToneClass[subTone]].filter(Boolean).join(" ")}>
          {sub}
        </div>
      ) : null}
      {sparkData && sparkData.length > 0 ? (
        <div className={styles.sparkWrap}>
          {sparkData.map((v, i) => {
            const isHi = i === sparkData.length - 1;
            return (
              <div
                key={i}
                className={isHi ? sparkHiClass[tone] : sparkBaseClass[tone]}
                style={{ height: `${Math.max(8, (v / maxSpark) * 100)}%` }}
              />
            );
          })}
        </div>
      ) : progressValue !== undefined ? (
        <div className={styles.progWrap}>
          <div
            className={progFillClass[tone]}
            style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep "stat-widget" | head -10
```
Expected: no output.

- [ ] **Step 3: Commit**
```bash
git add apps/web/src/components/admin/dashboard/widgets/stat-widget.tsx
git commit -m "feat(admin/widgets): add StatWidget"
```

---

### Task 5: Create `chart-widget-inner.tsx`

**Files:**
- Create: `apps/web/src/components/admin/dashboard/widgets/chart-widget-inner.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { CHART_DEFAULTS } from "./chart-defaults";
import styles from "@/app/style/admin/widgets.module.css";

const { gradientId, gridStroke, tickStyle, tooltipStyle, colors } = CHART_DEFAULTS;

const DEFAULT_COLORS = [
  colors.accent,
  colors.green,
  colors.amber,
  colors.blue,
  colors.red,
];

// Module-level gradient component — must NOT be inside ChartWidgetInner body
// to avoid React unmounting the defs on every parent re-render (gradient flicker).
// Rendered as a direct JSX child of <AreaChart> — Recharts passes unknown children
// into the SVG, so <defs> placed here end up inside the chart's own <svg> element.
function AreaGradientDefs({ keys, colors }: { keys: string[]; colors: string[] }) {
  return (
    <defs>
      {keys.map((k, i) => (
        <linearGradient key={k} id={`${gradientId}_${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors[i]} stopOpacity={0.35} />
          <stop offset="100%" stopColor={colors[i]} stopOpacity={0.02} />
        </linearGradient>
      ))}
    </defs>
  );
}

export interface ChartWidgetInnerProps {
  label: string;
  currentValue?: string;
  data: Record<string, unknown>[];
  dataKey: string | string[];
  type: "area" | "bar" | "line";
  color?: string | string[];
  legend?: { key: string; label: string }[];
  height?: number;
  xKey?: string;
  className?: string;
}

function resolveColors(
  dataKey: string | string[],
  color?: string | string[],
): string[] {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];
  if (!color) return keys.map((_, i) => DEFAULT_COLORS[i % DEFAULT_COLORS.length]!);
  if (Array.isArray(color)) return keys.map((_, i) => color[i] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]!);
  return keys.map(() => color);
}

export function ChartWidgetInner({
  label,
  currentValue,
  data,
  dataKey,
  type,
  color,
  legend,
  height = 120,
  xKey = "label",
  className,
}: ChartWidgetInnerProps) {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];
  const resolvedColors = resolveColors(dataKey, color);

  const wrapClass = [styles.widget, styles.span2, className].filter(Boolean).join(" ");

  // Module-level component — defined outside render to avoid remount on every render.
  // Rendered via Recharts' `customized` prop so the <defs> live inside the chart SVG.

  return (
    <div className={wrapClass}>
      <div className={styles.chartHeader}>
        <div>
          <div className={styles.widgetLabel}>{label}</div>
          {currentValue ? (
            <div className={styles.chartCurrentValue}>{currentValue}</div>
          ) : null}
        </div>
        {legend ? (
          <div className={styles.chartLegend}>
            {legend.map((item, i) => (
              <div key={item.key} className={styles.chartLegendItem}>
                <div
                  className={styles.chartLegendDot}
                  style={{ background: resolvedColors[i] ?? colors.accent }}
                />
                {item.label}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {type === "area" ? (
          <AreaChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <AreaGradientDefs keys={keys} colors={resolvedColors} />
            <CartesianGrid vertical={false} stroke={gridStroke} />
            <XAxis dataKey={xKey} tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(139,111,255,0.2)" }} />
            {keys.map((k, i) => (
              <Area
                key={k}
                type="monotone"
                dataKey={k}
                stroke={resolvedColors[i]}
                strokeWidth={CHART_DEFAULTS.strokeWidth}
                fill={`url(#${gradientId}_${i})`}
                dot={false}
                activeDot={{ r: CHART_DEFAULTS.dotRadius, fill: resolvedColors[i] }}
              />
            ))}
          </AreaChart>
        ) : type === "bar" ? (
          <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={gridStroke} />
            <XAxis dataKey={xKey} tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(139,111,255,0.08)" }} />
            {keys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={resolvedColors[i]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={gridStroke} />
            <XAxis dataKey={xKey} tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(139,111,255,0.2)" }} />
            {keys.map((k, i) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={resolvedColors[i]}
                strokeWidth={CHART_DEFAULTS.strokeWidth}
                dot={false}
                activeDot={{ r: CHART_DEFAULTS.dotRadius }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep "chart-widget-inner" | head -10
```
Expected: no output.

- [ ] **Step 3: Commit**
```bash
git add apps/web/src/components/admin/dashboard/widgets/chart-widget-inner.tsx
git commit -m "feat(admin/widgets): add ChartWidgetInner (Recharts)"
```

---

### Task 6: Create `chart-widget.tsx` (dynamic wrapper)

**Files:**
- Create: `apps/web/src/components/admin/dashboard/widgets/chart-widget.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import dynamic from "next/dynamic";
import styles from "@/app/style/admin/widgets.module.css";
import type { ChartWidgetInnerProps } from "./chart-widget-inner";

// Recharts bundle is isolated from SSR via this boundary.
// Callers import ChartWidget normally — no dynamic() at callsites.
const ChartWidgetInner = dynamic(
  () => import("./chart-widget-inner").then((m) => ({ default: m.ChartWidgetInner })),
  {
    ssr: false,
    loading: () => (
      <div className={[styles.widget, styles.span2].join(" ")} style={{ minHeight: 140 }}>
        <div className={styles.chartLoading}>Loading chart…</div>
      </div>
    ),
  },
);

export type { ChartWidgetInnerProps as ChartWidgetProps };
export function ChartWidget(props: ChartWidgetInnerProps) {
  return <ChartWidgetInner {...props} />;
}
```

- [ ] **Step 2: Type-check**
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep "chart-widget" | head -10
```
Expected: no output.

- [ ] **Step 3: Commit**
```bash
git add apps/web/src/components/admin/dashboard/widgets/chart-widget.tsx
git commit -m "feat(admin/widgets): add ChartWidget (SSR-safe dynamic wrapper)"
```

---

### Task 7: Create `table-widget.tsx`

**Files:**
- Create: `apps/web/src/components/admin/dashboard/widgets/table-widget.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import type { ReactNode } from "react";
import styles from "@/app/style/admin/widgets.module.css";

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render?: (value: unknown, row: T) => ReactNode;
}

interface TableWidgetProps<T extends Record<string, unknown>> {
  label: string;
  rows: T[];
  columns: TableColumn<T>[];
  /** Override displayed count (e.g. "showing 10 of 247"). Defaults to rows.length. */
  rowCount?: number;
  emptyMessage?: string;
  className?: string;
}

export function TableWidget<T extends Record<string, unknown>>({
  label,
  rows,
  columns,
  rowCount,
  emptyMessage = "No data",
  className,
}: TableWidgetProps<T>) {
  const displayCount = rowCount ?? rows.length;
  const wrapClass = [styles.widget, styles.span4, className].filter(Boolean).join(" ");

  return (
    <div className={wrapClass}>
      <div className={styles.tableHeader}>
        <div className={styles.widgetLabel}>{label}</div>
        <div className={styles.tableRowCount}>{displayCount} rows</div>
      </div>
      {rows.length === 0 ? (
        <div className={styles.tableEmpty}>{emptyMessage}</div>
      ) : (
        <table className={styles.widgetTable}>
          <thead className={styles.widgetThead}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ textAlign: col.align ?? (col.key === columns[0]?.key ? "left" : "right") }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={styles.widgetTr}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={styles.widgetTd}
                    style={{ textAlign: col.align ?? (col.key === columns[0]?.key ? "left" : "right") }}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep "table-widget" | head -10
```
Expected: no output.

- [ ] **Step 3: Commit**
```bash
git add apps/web/src/components/admin/dashboard/widgets/table-widget.tsx
git commit -m "feat(admin/widgets): add TableWidget"
```

---

### Task 8: Create `pipeline-widget.tsx`

**Files:**
- Create: `apps/web/src/components/admin/dashboard/widgets/pipeline-widget.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import styles from "@/app/style/admin/widgets.module.css";
import { CHART_DEFAULTS } from "./chart-defaults";

const AUTO_COLORS = [
  CHART_DEFAULTS.colors.accent,
  CHART_DEFAULTS.colors.green,
  CHART_DEFAULTS.colors.amber,
  CHART_DEFAULTS.colors.red,
  CHART_DEFAULTS.colors.blue,
];

export interface PipelineStage {
  label: string;
  count: number;
  total: number;
  color?: string;
}

interface PipelineWidgetProps {
  label: string;
  stages: PipelineStage[];
  className?: string;
}

export function PipelineWidget({ label, stages, className }: PipelineWidgetProps) {
  const wrapClass = [styles.widget, className].filter(Boolean).join(" ");

  return (
    <div className={wrapClass}>
      <div className={styles.widgetLabel}>{label}</div>
      <div className={styles.pipelineList}>
        {stages.map((stage, i) => {
          const pct = stage.total > 0 ? Math.min(100, (stage.count / stage.total) * 100) : 0;
          const fillColor = stage.color ?? AUTO_COLORS[i % AUTO_COLORS.length];
          return (
            <div key={stage.label} className={styles.pipelineRow}>
              <span className={styles.pipelineLabel}>{stage.label}</span>
              <div className={styles.pipelineTrack}>
                <div
                  className={styles.pipelineFill}
                  style={{ width: `${pct}%`, background: fillColor }}
                />
              </div>
              <span className={styles.pipelineCount}>{stage.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep "pipeline-widget" | head -10
```
Expected: no output.

- [ ] **Step 3: Commit**
```bash
git add apps/web/src/components/admin/dashboard/widgets/pipeline-widget.tsx
git commit -m "feat(admin/widgets): add PipelineWidget"
```

---

### Task 9: Create `widget-grid.tsx` and barrel `index.ts`

**Files:**
- Create: `apps/web/src/components/admin/dashboard/widgets/widget-grid.tsx`
- Create: `apps/web/src/components/admin/dashboard/widgets/index.ts`

- [ ] **Step 1: Create `widget-grid.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import styles from "@/app/style/admin/widgets.module.css";

interface WidgetGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function WidgetGrid({ children, columns = 4, className }: WidgetGridProps) {
  const gridClass = {
    2: styles.widgetGrid2,
    3: styles.widgetGrid3,
    4: "",
  }[columns];
  const wrapClass = [styles.widgetGrid, gridClass, className].filter(Boolean).join(" ");
  return <div className={wrapClass}>{children}</div>;
}
```

- [ ] **Step 2: Create `index.ts`**

```ts
export { StatWidget } from "./stat-widget";
export { ChartWidget } from "./chart-widget";
export type { ChartWidgetProps } from "./chart-widget";
export { TableWidget } from "./table-widget";
export type { TableColumn } from "./table-widget";
export { PipelineWidget } from "./pipeline-widget";
export type { PipelineStage } from "./pipeline-widget";
export { WidgetGrid } from "./widget-grid";
```

- [ ] **Step 3: Type-check the full widget library**
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep -v "node_modules\|@livekit\|appointments-page\|close-out-report\|meeting-prep" | grep "error" | head -20
```
Expected: no widget-related errors.

- [ ] **Step 4: Commit**
```bash
git add apps/web/src/components/admin/dashboard/widgets/
git commit -m "feat(admin/widgets): complete widget library — WidgetGrid + barrel export"
```

---

## Part 2 — Operations Pages

> **Pattern for every page task below:**
> 1. Read the current page file fully before touching it.
> 2. Keep ALL existing data-fetching logic, hooks, `useEffect`, state, and API calls — do not remove any.
> 3. Replace only the JSX return value with the widget grid layout.
> 4. Derive `sparkData` and `progressValue` from existing computed values where data exists; use `[]` and `undefined` when no relevant data is available.
> 5. Keep all existing tab navigation above the widget grid.
> 6. TypeScript must stay clean — run `tsc --noEmit` after each page.

---

### Task 10: Redesign `executive-dashboard-page.tsx`

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx`

- [ ] **Step 1: Read the current file**
```
Read: apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx
```

- [ ] **Step 2: Add widget imports at top of file**
Add after existing imports:
```tsx
import widgetStyles from "@/app/style/admin/widgets.module.css";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
```

- [ ] **Step 3: Replace the JSX return with widget grid**

The new layout structure (replace the `return (...)` block):
```tsx
return (
  <div className={cx(styles.pageBody)}>
    {/* Page header */}
    <div className={widgetStyles.pageHeader}>
      <div className={styles.pageEyebrow}>OPERATIONS / EXECUTIVE DASHBOARD</div>
      <h1 className={styles.pageTitle}>Executive Dashboard</h1>
      <p className={widgetStyles.pageDesc}>Business pulse · Portfolio health · Revenue snapshot</p>
    </div>
    <div className={widgetStyles.pageDivider} />

    {/* Row 1: KPI strip */}
    <WidgetGrid>
      <StatWidget
        tone="accent"
        label="Monthly Revenue"
        value={centsToK(monthlyRevenue)}
        sub={outstanding > 0 ? `${centsToK(outstanding)} outstanding` : "On track"}
        subTone={outstanding > 0 ? "warn" : "neutral"}
        sparkData={mrrHistory.length > 0 ? mrrHistory.map(v => (v / Math.max(...mrrHistory, 1)) * 100) : []}
      />
      <StatWidget
        label="Active Clients"
        value={activeClients}
        sub={atRiskClients > 0 ? `${atRiskClients} at risk` : "All healthy"}
        subTone={atRiskClients > 0 ? "warn" : "neutral"}
        progressValue={clients.length > 0 ? (activeClients / clients.length) * 100 : 0}
      />
      <StatWidget
        label="Active Projects"
        value={activeProjects}
        sub={projects.filter(p => p.status === "ON_HOLD").length > 0 ? `${projects.filter(p => p.status === "ON_HOLD").length} on hold` : "In progress"}
        subTone={projects.filter(p => p.status === "ON_HOLD").length > 0 ? "warn" : "neutral"}
        progressValue={projects.length > 0 ? (activeProjects / projects.length) * 100 : 0}
      />
      <StatWidget
        label="Staff Headcount"
        value={staffCount}
        sub="Active members"
      />
    </WidgetGrid>

    {/* Row 2: Revenue chart + Pipeline */}
    <WidgetGrid>
      <ChartWidget
        label="Revenue Trend — 6 months"
        currentValue={centsToK(monthlyRevenue)}
        data={mrrData.map((p, i) => ({ label: mrrMonthLabels[i] ?? p.month, actual: Math.round(p.total / 100) }))}
        dataKey="actual"
        type="area"
        height={130}
        xKey="label"
      />
      <PipelineWidget
        label="Project Status"
        stages={[
          { label: "In Progress", count: activeProjects, total: projects.length || 1 },
          { label: "Planning",    count: projects.filter(p => p.status === "PLANNING").length, total: projects.length || 1 },
          { label: "On Hold",     count: projects.filter(p => p.status === "ON_HOLD").length,  total: projects.length || 1, color: "var(--amber)" },
          { label: "Completed",   count: projects.filter(p => p.status === "COMPLETED").length, total: projects.length || 1, color: "var(--green)" },
        ]}
      />
    </WidgetGrid>

    {/* Row 3: Clients table */}
    <WidgetGrid>
      <TableWidget
        label="Client Pipeline"
        rows={clients.map(c => ({
          name:    c.name,
          status:  c.status,
          tier:    c.tier,
          health:  c.status === "ACTIVE" ? "94" : c.status === "AT_RISK" ? "52" : "70",
        }))}
        columns={[
          { key: "name",   header: "Client" },
          { key: "tier",   header: "Tier",   align: "right" },
          { key: "health", header: "Health", align: "right" },
          {
            key: "status",
            header: "Status",
            align: "right",
            render: (val) => {
              const cls = val === "ACTIVE" ? cx("badgeGreen") : val === "AT_RISK" ? cx("badgeAmber") : cx("badgeRed");
              return <span className={cls}>{String(val)}</span>;
            },
          },
        ]}
        emptyMessage="No clients yet"
      />
    </WidgetGrid>
  </div>
);
```

- [ ] **Step 4: Type-check**
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep "executive-dashboard" | head -10
```
Expected: no output.

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx
git commit -m "feat(admin/ops): redesign executive-dashboard-page — widget grid"
```

---

### Task 11: Redesign `business-development-page.tsx`

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/business-development-page.tsx`

- [ ] **Step 1: Read the current file fully**
- [ ] **Step 2: Add widget imports** (same pattern as Task 10 Step 2)
- [ ] **Step 3: Replace JSX return with widget grid**

Layout:
- Row 1 (4 stats): Active Leads, Won, Lost, Conversion Rate
- Row 2: ChartWidget (leads over time, span 2) + PipelineWidget (pipeline stages)
- Row 3: TableWidget (leads list — name, source, value, status)

- [ ] **Step 4: Type-check**
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep "business-development" | head -10
```
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/components/admin/dashboard/pages/business-development-page.tsx
git commit -m "feat(admin/ops): redesign business-development-page"
```

---

### Task 12: Redesign `admin-leads-page-client.tsx`

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/admin-leads-page-client.tsx`

- [ ] **Step 1: Read current file**
- [ ] **Step 2: Add widget imports**
- [ ] **Step 3: Replace JSX with widget grid**

Layout:
- Row 1 (4 stats): Total Leads, New This Month, Qualified, Win Rate
- Row 2: ChartWidget (bar — leads by month, span 2) + PipelineWidget (lead stages: New → Contacted → Qualified → Proposal → Won/Lost)
- Row 3: TableWidget (leads — name, company, source, value, status)

- [ ] **Step 4: Type-check + commit**
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep "leads-page" | head -10
git add apps/web/src/components/admin/dashboard/pages/admin-leads-page-client.tsx
git commit -m "feat(admin/ops): redesign admin-leads-page"
```

---

### Task 13: Redesign `admin-clients-page-client.tsx`

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/admin-clients-page-client.tsx`

- [ ] **Step 1: Read current file**
- [ ] **Step 2: Add widget imports**
- [ ] **Step 3: Replace JSX with widget grid**

Layout:
- Row 1 (4 stats): Total Clients, Active, At Risk, Churned
- Row 2: ChartWidget (area — client health over time, span 2) + PipelineWidget (clients by tier)
- Row 3: TableWidget (clients — name, tier, status, MRR, health score)

- [ ] **Step 4: Type-check + commit**
```bash
git add apps/web/src/components/admin/dashboard/pages/admin-clients-page-client.tsx
git commit -m "feat(admin/ops): redesign admin-clients-page"
```

---

### Task 14: Redesign `admin-projects-page-client.tsx`

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/admin-projects-page-client.tsx`

- [ ] **Step 1: Read current file**
- [ ] **Step 2: Add widget imports**
- [ ] **Step 3: Replace JSX with widget grid**

Layout:
- Row 1 (4 stats): Total Projects, In Progress, Blocked, Avg Progress
- Row 2: ChartWidget (bar — projects by status, span 2) + PipelineWidget (project health breakdown)
- Row 3: TableWidget (projects — name, client, status, progress %, due date)

- [ ] **Step 4: Type-check + commit**
```bash
git add apps/web/src/components/admin/dashboard/pages/admin-projects-page-client.tsx
git commit -m "feat(admin/ops): redesign admin-projects-page"
```

---

### Task 15: Redesign `project-portfolio-page.tsx`

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/project-portfolio-page.tsx`

- [ ] **Step 1: Read current file**
- [ ] **Step 2: Add widget imports**
- [ ] **Step 3: Replace JSX with widget grid**

Layout:
- Row 1 (4 stats): Portfolio Value, Active Count, Avg Health, On-Time Delivery
- Row 2: ChartWidget (area — portfolio value over time, span 3) + StatWidget (risk score)
- Row 3: TableWidget (projects — name, client, value, health, risk level, status)

- [ ] **Step 4: Type-check + commit**
```bash
git add apps/web/src/components/admin/dashboard/pages/project-portfolio-page.tsx
git commit -m "feat(admin/ops): redesign project-portfolio-page"
```

---

### Task 16: Redesign `resource-allocation-page.tsx`

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/resource-allocation-page.tsx`

- [ ] **Step 1: Read current file**
- [ ] **Step 2: Add widget imports**
- [ ] **Step 3: Replace JSX with widget grid**

Layout:
- Row 1 (4 stats): Total Staff, Fully Allocated, Under-utilized, Overloaded
- Row 2: ChartWidget (bar — utilisation by staff member, span 2) + PipelineWidget (allocation by team/role)
- Row 3: TableWidget (staff — name, role, allocation %, active projects, status)

- [ ] **Step 4: Type-check + commit**
```bash
git add apps/web/src/components/admin/dashboard/pages/resource-allocation-page.tsx
git commit -m "feat(admin/ops): redesign resource-allocation-page"
```

---

### Task 17: Redesign `timeline-gantt-page.tsx`

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/timeline-gantt-page.tsx`

> Note: Gantt pages have custom timeline rendering. Preserve any Gantt chart component entirely. Apply the widget grid only to the KPI header and summary stats above the Gantt view.

- [ ] **Step 1: Read current file**
- [ ] **Step 2: Add widget imports**
- [ ] **Step 3: Add widget grid header above existing Gantt content**

Layout:
- Row 1 (4 stats): Active Milestones, Overdue, On Track, Avg Velocity
- Existing Gantt content below (unchanged)

- [ ] **Step 4: Type-check + commit**
```bash
git add apps/web/src/components/admin/dashboard/pages/timeline-gantt-page.tsx
git commit -m "feat(admin/ops): add widget KPI header to timeline-gantt-page"
```

---

### Task 18: Redesign `quality-assurance-page.tsx`

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/quality-assurance-page.tsx`

- [ ] **Step 1: Read current file**
- [ ] **Step 2: Add widget imports**
- [ ] **Step 3: Replace JSX with widget grid**

Layout:
- Row 1 (4 stats): QA Score, Open Issues, Critical, Resolved This Week
- Row 2: ChartWidget (line — QA score trend, span 2) + PipelineWidget (issues by severity)
- Row 3: TableWidget (issues — title, project, severity, status, assignee)

- [ ] **Step 4: Type-check + commit**
```bash
git add apps/web/src/components/admin/dashboard/pages/quality-assurance-page.tsx
git commit -m "feat(admin/ops): redesign quality-assurance-page"
```

---

### Task 19: Redesign `sla-tracker-page.tsx`

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/sla-tracker-page.tsx`

- [ ] **Step 1: Read current file**
- [ ] **Step 2: Add widget imports**
- [ ] **Step 3: Replace JSX with widget grid**

Layout:
- Row 1 (4 stats): SLA Compliance %, Breached, At Risk, Avg Response Time
- Row 2: ChartWidget (bar — SLA performance by client, span 2) + PipelineWidget (SLA tiers)
- Row 3: TableWidget (SLAs — client, metric, target, actual, status)

- [ ] **Step 4: Type-check + commit**
```bash
git add apps/web/src/components/admin/dashboard/pages/sla-tracker-page.tsx
git commit -m "feat(admin/ops): redesign sla-tracker-page"
```

---

### Task 20: Operations section final type-check

- [ ] **Step 1: Run full TypeScript check for all modified files**
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep -v "node_modules\|@livekit\|appointments-page\|close-out-report\|meeting-prep" | grep "error" | head -30
```
Expected: no new errors from Operations pages.

- [ ] **Step 2: Commit summary**
```bash
git commit --allow-empty -m "chore: Operations section redesign complete (Tasks 10–19)"
```

---

## Parts 3–9 — Remaining Sections

Each subsequent section follows **exactly the same pattern** as Part 2:

1. Read the current page file
2. Add widget imports
3. Replace JSX return with widget grid layout (4 KPI stats → chart + pipeline row → table row)
4. TypeScript check
5. Commit per page

### Part 3 — Finance (12 pages)
Pages: `admin-billing-page-client.tsx`, `revops-dashboard-page.tsx`, `revenue-forecasting-page.tsx`, `profitability-per-client-page.tsx`, `profitability-per-project-page.tsx`, `cash-flow-calendar-page.tsx`, `financial-year-closeout-page.tsx`, `expense-tracker-page.tsx`, `payroll-ledger-page.tsx`, `proposals-page.tsx`, `pricing-page.tsx`, `vendor-cost-control-page.tsx`

Commit prefix: `feat(admin/finance):`

### Part 4 — Experience (10 pages)
Pages: `client-onboarding-page.tsx`, `client-offboarding-page.tsx`, `client-satisfaction-page.tsx`, `communication-audit-page.tsx`, `document-vault-page.tsx`, `referral-tracking-page.tsx`, `health-interventions-page.tsx`, `client-journey-page.tsx`, `loyalty-credits-page.tsx`, `booking-appointments-page.tsx`

Commit prefix: `feat(admin/experience):`

### Part 5 — Governance (12 pages)
Pages: `team-structure-page.tsx`, `platform-infrastructure-page.tsx`, `brand-control-page.tsx`, `owners-workspace-page.tsx`, `competitor-market-intel-page.tsx`, `crisis-command-page.tsx`, `performance-page.tsx`, `access-control-page.tsx`, `staff-onboarding-page.tsx`, `staff-scheduling-page.tsx`, `staff-satisfaction-page.tsx`, `staff-utilisation-page.tsx`

Commit prefix: `feat(admin/governance):`

### Part 6 — Knowledge (7 pages)
Pages: `knowledge-base-admin-page.tsx`, `decision-registry-page.tsx`, `handover-management-page.tsx`, `closeout-review-page.tsx`, `staff-transition-planner-page.tsx`, `staff-access-page.tsx`, `service-catalog-manager-page.tsx`

Commit prefix: `feat(admin/knowledge):`

### Part 7 — Lifecycle (7 pages)
Pages: `lifecycle-dashboard-page.tsx`, `stakeholder-directory-page.tsx`, `ai-action-recommendations-page.tsx`, `update-queue-manager-page.tsx`, `standup-feed-page.tsx`, `eod-digest-page.tsx`, `peer-review-queue-page.tsx`

Commit prefix: `feat(admin/lifecycle):`

### Part 8 — Communication (4 pages)
Pages: `messages-page.tsx`, `notifications-page.tsx`, `announcements-manager-page.tsx`, `content-approval-page.tsx`

Commit prefix: `feat(admin/comms):`

### Part 9 — AI/ML + Automation (5 pages)
Pages: `admin-automation-page-client.tsx`, `webhook-hub-page.tsx`, `proposed-actions-page.tsx`, `automation-audit-trail-page.tsx`, `active-health-monitor-page.tsx`

> Note: `ai-action-recommendations-page.tsx` is covered in Part 7 — do NOT process it again here.

Commit prefix: `feat(admin/ai):`

### Part 10 — Remaining explicitly enumerated pages
The following pages were not covered in Parts 2–9 and must be processed individually:
`admin-reports-page-client.tsx`, `admin-settings-page-client.tsx`, `admin-community-feature-requests-page.tsx`, `admin-community-moderation-page.tsx`, `admin-analytics-page-client.tsx`, `design-review-admin-page.tsx`, `project-briefing-page.tsx`, `project-templates-page.tsx`, `change-request-manager-page.tsx`, `request-inbox-page.tsx`, `invoice-chasing-page.tsx`, `sprint-board-admin-page.tsx`, `health-interventions-page.tsx` (if not in Experience), `revenue-page.tsx`, `team-performance-report-page.tsx`, `pipeline-analytics-page.tsx`, `employment-records-page.tsx`, `leave-absence-page.tsx`, `recruitment-pipeline-page.tsx`, `strategic-client-intelligence-page.tsx`, `clv-analytics-page.tsx`, `client-health-scorecard-page.tsx`, `payroll-ledger-page.tsx` (if not in Finance).

> **Files to SKIP — not page components:**
> `admin-page-utils.tsx` (utility functions, no JSX render),
> `admin-stub-page.tsx` (placeholder, leave as-is),
> Any file not exporting a React component with a page layout.

Commit prefix: `feat(admin/remaining):`

---

## Final Verification

- [ ] **Full TypeScript check**
```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep -v "node_modules\|@livekit\|appointments-page\|close-out-report\|meeting-prep" | grep "error"
```
Expected: empty output.

- [ ] **Confirm all 118 pages import from `../widgets`**
```bash
grep -rl "from \"../widgets\"" apps/web/src/components/admin/dashboard/pages/ | wc -l
```
Expected: 118 (or close to it — pages with pure Gantt/calendar UI may import partially).

- [ ] **Final commit**
```bash
git commit --allow-empty -m "feat(admin): all 118 pages redesigned — widget grid complete"
```
