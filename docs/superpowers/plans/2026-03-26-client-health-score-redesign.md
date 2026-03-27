# Client Health Score Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `ClientHealthPage` from a split list/detail layout into a tabbed overview (Overview / At Risk / Positive / All Clients) with a persistent right-side detail panel, using only live API data.

**Architecture:** The component is a full rewrite of the JSX and state shape; the data layer (`getStaffAllHealthScores`, intervention/message APIs) is unchanged. State splits into a `tabFilters` Record map (one filter/search/sort slice per tab) replacing the previous flat state. CSS is additive first — new classes are added to `pages-b.module.css`, old unused classes are removed in the final task.

**Tech Stack:** Next.js 15 (App Router), React 18, TypeScript, CSS Modules (`pages-b.module.css`), `@testing-library/react`, existing staff API client functions.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/web/src/app/style/staff/pages-b.module.css` | Modify (add + later remove) | All visual styles for the redesigned page |
| `apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx` | Full rewrite | Page component — state, derived data, JSX |
| `apps/web/src/components/staff/staff-dashboard/pages/client-health-page.test.tsx` | Rewrite tests | Behaviour tests for the new component structure |

**Do NOT modify:**
- `apps/web/src/lib/api/staff/clients.ts` — data layer is unchanged
- `apps/web/src/lib/api/staff/interventions.ts`
- `apps/web/src/lib/api/staff/messaging.ts`
- `apps/web/src/components/staff/staff-dashboard/pages/client-health-summary-page.tsx` — separate page
- `apps/web/src/app/style/staff/core.module.css` — shared staff tokens
- Any shared CSS — new classes go in `pages-b.module.css` only

**CSS classes to NEVER rename (dynamic, used at runtime):**
`chSentPositive`, `chSentNeutral`, `chSentRisk`, `chSignalPositive`, `chSignalNeutral`, `chSignalNegative`
(These are at lines 1756–1761 in `pages-b.module.css`, inside the Communication History section — leave them exactly as-is.)

**CSS classes already available via the style spread in `apps/web/src/components/staff/staff-dashboard/style.ts`** (no new CSS needed for these):
`staffClientAvatar`, `staffSegBtn`, `staffSegBtnActive`, `staffFilterInput`, `chSortPill`, `chSortPillActive`, `chSortPillIdle`, `chSortGroup`, `chSortLabel`, `modalBackdrop`, `modal`, `modalHeader`, `modalTitle`, `modalClose`, `modalBody`, `staffToast`, `staffToastSuccess`, `staffToastError`, `emptyState`, `emptyStateTitle`, `emptyStateSub`, `emptyStateIcon`, `skeletonBlock`

---

## Task 1: Add CSS — KPI strip, tab bar, tab body

**Files:**
- Modify: `apps/web/src/app/style/staff/pages-b.module.css` (append after last line)

- [ ] **Step 1: Append new CSS section header and KPI strip classes**

Open `pages-b.module.css` and append at the very end:

```css
/* ═══════════════════════════════════════════════════════════════════════════
   CLIENT HEALTH SCORE — REDESIGN (tabbed layout)
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── KPI Strip ───────────────────────────────────────────────────────────── */

.chKpiStrip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.chKpiCard {
  background: var(--s1);
  border: 1px solid var(--b1);
  border-radius: var(--r-xs);
  padding: 10px 14px;
}

.chKpiCardAccent {
  background: rgba(249, 115, 22, 0.10);
  border-color: rgba(249, 115, 22, 0.22);
}

.chKpiCardRed {
  background: rgba(239, 68, 68, 0.10);
  border-color: rgba(239, 68, 68, 0.22);
}

.chKpiCardGreen {
  background: rgba(34, 197, 94, 0.10);
  border-color: rgba(34, 197, 94, 0.22);
}

.chKpiCardPurple {
  background: rgba(168, 85, 247, 0.10);
  border-color: rgba(168, 85, 247, 0.22);
}

.chKpiLabel {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted2);
  margin-bottom: 4px;
}

.chKpiVal {
  font-family: var(--font-syne), system-ui, sans-serif;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 2px;
}

.chKpiMeta {
  font-size: 9px;
  color: var(--muted2);
}

/* ── Tab bar row ─────────────────────────────────────────────────────────── */

.chTabBarRow {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--b1);
  gap: 0;
}

.chTab {
  height: 36px;
  padding: 0 14px;
  font-size: 12px;
  color: var(--muted2);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 120ms;
  white-space: nowrap;
}

.chTab:hover {
  color: var(--muted);
}

.chTabActive {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 600;
}

.chTabBadgeRed {
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(239, 68, 68, 0.12);
  color: var(--red);
}

.chTabBadgeGreen {
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(34, 197, 94, 0.12);
  color: var(--green);
}

.chTabBadgeMuted {
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--s2);
  color: var(--muted);
}

.chTabClearBtn {
  margin-left: auto;
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  background: var(--s2);
  border: 1px solid var(--b2);
  font-size: 10px;
  color: var(--muted);
  cursor: pointer;
  transition: color 120ms, background 120ms;
}

.chTabClearBtn:hover {
  color: var(--text);
  background: var(--s3);
}

/* ── Tab body split ──────────────────────────────────────────────────────── */

.chTabBody {
  display: grid;
  grid-template-columns: 1fr 260px;
  min-height: 360px;
  border: 1px solid var(--b1);
  border-top: none;
  border-radius: 0 0 var(--r-xs) var(--r-xs);
  overflow: hidden;
}

.chTabContent {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-right: 1px solid var(--b1);
  overflow: hidden;
  min-width: 0;
}

.chTabDetail {
  background: var(--s1);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  min-width: 0;
}

@media (max-width: 900px) {
  .chTabBody {
    grid-template-columns: 1fr;
  }
  .chTabDetail {
    border-top: 1px solid var(--b1);
  }
  .chKpiStrip {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
cd /Users/maphari/Projects/maphari_technologies
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors (we only added CSS, no TS changes yet).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/style/staff/pages-b.module.css
git commit -m "style(staff): add ch kpi strip, tab bar, tab body classes"
```

---

## Task 2: Add CSS — Overview panels, table, detail panel

**Files:**
- Modify: `apps/web/src/app/style/staff/pages-b.module.css` (append)

- [ ] **Step 1: Append overview panel classes**

```css
/* ── Overview panels ─────────────────────────────────────────────────────── */

.chOverviewGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.chOvPanel {
  background: var(--s1);
  border: 1px solid var(--b1);
  border-radius: var(--r-xs);
  padding: 12px;
}

.chOvPanelLabel {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted2);
  margin-bottom: 8px;
}

.chOvPanelLabelRed {
  color: var(--red);
}

.chTierRow {
  display: flex;
  gap: 6px;
}

.chTierBox {
  flex: 1;
  border-radius: 6px;
  padding: 8px;
  text-align: center;
}

.chTierBoxGreen {
  background: rgba(34, 197, 94, 0.10);
  border: 1px solid rgba(34, 197, 94, 0.18);
}

.chTierBoxAmber {
  background: rgba(234, 179, 8, 0.10);
  border: 1px solid rgba(234, 179, 8, 0.18);
}

.chTierBoxRed {
  background: rgba(239, 68, 68, 0.10);
  border: 1px solid rgba(239, 68, 68, 0.18);
}

.chTierNum {
  font-family: var(--font-syne), system-ui, sans-serif;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.chTierNumGreen { color: var(--green); }
.chTierNumAmber { color: var(--amber); }
.chTierNumRed   { color: var(--red);   }

.chTierLbl {
  font-size: 8px;
  color: var(--muted2);
  margin-top: 2px;
}

.chSparkline {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 28px;
  margin-top: 8px;
}

.chSpBar {
  flex: 1;
  border-radius: 2px 2px 0 0;
  background: rgba(249, 115, 22, 0.35);
}

.chSpBarLast {
  background: var(--accent);
}

/* Needs-attention list */

.chAttentionList {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chAttentionItem {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  background: none;
  text-align: left;
  width: 100%;
  transition: background 120ms;
}

.chAttentionItem:hover {
  background: var(--s2);
  border-color: var(--b2);
}

.chAttentionItemSelected {
  background: rgba(249, 115, 22, 0.10);
  border-color: rgba(249, 115, 22, 0.22);
}

.chAttentionInfo {
  flex: 1;
  min-width: 0;
}

.chAttentionName {
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
}

.chAttentionProj {
  font-size: 9px;
  color: var(--muted2);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.chAttentionScore {
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
}

/* Small progress bar (reused in attention list and detail panel) */

.chMiniTrack {
  height: 3px;
  background: var(--b1);
  border-radius: 99px;
  overflow: hidden;
  margin-top: 4px;
}

.chMiniFillGreen { height: 100%; border-radius: 99px; background: var(--green); }
.chMiniFillAmber { height: 100%; border-radius: 99px; background: var(--amber); }
.chMiniFillRed   { height: 100%; border-radius: 99px; background: var(--red);   }

@media (max-width: 900px) {
  .chOverviewGrid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Append table classes**

```css
/* ── All-clients table ───────────────────────────────────────────────────── */

.chTable {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.chTable th {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--muted2);
  padding: 6px 10px;
  text-align: left;
  border-bottom: 1px solid var(--b1);
}

.chTable td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--b1);
  vertical-align: middle;
  color: var(--muted);
}

.chTable tbody tr {
  cursor: pointer;
  transition: background 100ms;
}

.chTable tbody tr:hover td {
  background: var(--s2);
}

.chTable tbody tr:last-child td {
  border-bottom: none;
}

.chTableRowSelected td {
  background: rgba(249, 115, 22, 0.08) !important;
}

.chTableRowSelected td:first-child {
  border-left: 2px solid var(--accent);
  padding-left: 8px;
}

.chScoreBarCell {
  display: flex;
  align-items: center;
  gap: 7px;
}

.chScoreBarWrap {
  flex: 1;
  min-width: 48px;
}

.chScoreBarTrack {
  height: 4px;
  background: var(--b1);
  border-radius: 99px;
  overflow: hidden;
}

.chScoreBarFillGreen { height: 100%; border-radius: 99px; background: var(--green); }
.chScoreBarFillAmber { height: 100%; border-radius: 99px; background: var(--amber); }
.chScoreBarFillRed   { height: 100%; border-radius: 99px; background: var(--red);   }

.chScoreText {
  font-size: 12px;
  font-weight: 800;
  width: 24px;
  text-align: right;
  flex-shrink: 0;
}

/* Trend chips (table + detail) */

.chTrendChipUp   { display: inline-flex; align-items: center; gap: 3px; font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 4px; color: var(--green); background: rgba(34,197,94,0.12); }
.chTrendChipDown { display: inline-flex; align-items: center; gap: 3px; font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 4px; color: var(--red);   background: rgba(239,68,68,0.12); }
.chTrendChipFlat { display: inline-flex; align-items: center; gap: 3px; font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 4px; color: var(--muted); background: var(--s2); }

/* Filter bar (tab content) */

.chFilterBar {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.chFilterPillActive {
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  background: rgba(249, 115, 22, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.25);
  color: var(--accent);
}

.chFilterPillIdle {
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  background: var(--s1);
  border: 1px solid var(--b1);
  color: var(--muted);
}

.chFilterPillCount {
  font-size: 8px;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--b2);
}

.chFilterPillActive .chFilterPillCount {
  background: rgba(249, 115, 22, 0.2);
}
```

- [ ] **Step 3: Append detail panel classes**

```css
/* ── Detail panel ────────────────────────────────────────────────────────── */

.chDpHeader {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--b1);
}

.chDpName {
  font-family: var(--font-syne), system-ui, sans-serif;
  font-size: 14px;
  font-weight: 800;
  color: var(--text);
}

.chDpProj {
  font-size: 10px;
  color: var(--muted2);
  margin-top: 2px;
}

.chDpScoreRow {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* SVG score ring wrapper */
.chDpRingWrap {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.chDpRingNum {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
}

.chDpScoreBig {
  font-family: var(--font-syne), system-ui, sans-serif;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
}

.chDpScoreMeta {
  font-size: 10px;
  color: var(--muted2);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Risk banner */

.chDpRiskBanner {
  background: rgba(239, 68, 68, 0.10);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 7px;
  padding: 8px 10px;
  display: flex;
  gap: 7px;
  align-items: flex-start;
}

.chDpRiskMsg {
  font-size: 10px;
  color: var(--red);
  line-height: 1.4;
}

/* 2x2 metrics */

.chDpMetrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}

.chDpMetric {
  background: var(--s2);
  border-radius: 6px;
  padding: 7px 9px;
}

.chDpMetricLabel {
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted2);
  margin-bottom: 2px;
}

.chDpMetricVal {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
}

.chDpMetricValOk   { color: var(--green); font-size: 11px; font-weight: 700; }
.chDpMetricValWarn { color: var(--amber); font-size: 11px; font-weight: 700; }
.chDpMetricValBad  { color: var(--red);   font-size: 11px; font-weight: 700; }

/* Signals */

.chDpSignalList {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chDpSignalRow {
  display: flex;
  gap: 7px;
  align-items: flex-start;
}

.chDpSignalDot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;
}

.chDpSignalText {
  font-size: 10px;
  color: var(--muted);
  line-height: 1.4;
}

.chDpSignalType {
  font-size: 8px;
  color: var(--muted2);
  margin-top: 1px;
}

/* Action buttons */

.chDpActionList {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.chDpActionBtn {
  height: 30px;
  border-radius: 7px;
  border: 1px solid var(--b2);
  background: var(--s2);
  font-size: 10px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 120ms, color 120ms;
}

.chDpActionBtn:hover {
  background: var(--s3);
  color: var(--text);
}

.chDpActionBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chDpActionBtnPrimary {
  background: rgba(249, 115, 22, 0.12);
  border-color: rgba(249, 115, 22, 0.25);
  color: var(--accent);
}

.chDpActionBtnDanger {
  background: rgba(239, 68, 68, 0.10);
  border-color: rgba(239, 68, 68, 0.22);
  color: var(--red);
}

.chDpActionIco {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: var(--b1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  flex-shrink: 0;
}

/* Retainer bar */

.chDpRetainerBar {
  background: var(--s2);
  border-radius: 7px;
  padding: 9px 10px;
}

.chDpRetainerHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.chDpRetainerLabel {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted2);
}

.chDpRetainerPct {
  font-size: 11px;
  font-weight: 700;
}

.chDpRetainerTrack {
  height: 5px;
  background: var(--b1);
  border-radius: 99px;
  overflow: hidden;
}

.chDpRetainerMeta {
  font-size: 9px;
  color: var(--muted2);
  margin-top: 5px;
}

/* Detail panel empty state */

.chDpEmpty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 6px;
  padding: 20px;
  text-align: center;
  min-height: 120px;
}

.chDpEmptyText {
  font-size: 11px;
  color: var(--muted2);
}

/* Section label (detail panel) */
.chDpSecLabel {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted2);
  margin-bottom: 6px;
}
```

- [ ] **Step 4: Verify TypeScript still compiles**

```bash
cd /Users/maphari/Projects/maphari_technologies
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/style/staff/pages-b.module.css
git commit -m "style(staff): add ch overview, table, detail panel classes"
```

---

## Task 3: Write failing tests for the new component behaviour

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/client-health-page.test.tsx`

Context: The test file currently uses `jest` + `@testing-library/react`. Check the existing test file structure with `head -30 apps/web/src/components/staff/staff-dashboard/pages/client-health-page.test.tsx` before writing.

- [ ] **Step 1: Replace test file with tests for the new structure**

```typescript
// apps/web/src/components/staff/staff-dashboard/pages/client-health-page.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ClientHealthPage } from "./client-health-page";
import { getStaffAllHealthScores } from "@/lib/api/staff/clients";
import { createStaffInterventionWithRefresh } from "@/lib/api/staff/interventions";

jest.mock("@/lib/api/staff/clients");
jest.mock("@/lib/api/staff/interventions");
jest.mock("@/lib/api/staff/messaging");
jest.mock("@/lib/auth/session", () => ({ saveSession: jest.fn() }));

const mockSession = { accessToken: "tok", userId: "u1" } as any;

const mockData = [
  {
    id: "client-acme",
    name: "Acme Ltd",
    avatar: "AL",
    project: "Platform Upgrade",
    score: 82,
    trend: "up" as const,
    trendVal: "+6",
    sentiment: "positive" as const,
    lastTouched: "2h ago",
    overdueTasks: 0,
    unreadMessages: 0,
    milestoneDelay: 0,
    retainerBurn: 42,
    invoiceStatus: "paid" as const,
    signals: [{ type: "positive" as const, text: "Milestone approved" }],
  },
  {
    id: "client-beta",
    name: "Beta Co",
    avatar: "BC",
    project: "Ops Rescue",
    score: 44,
    trend: "down" as const,
    trendVal: "-8",
    sentiment: "at_risk" as const,
    lastTouched: "1d ago",
    overdueTasks: 2,
    unreadMessages: 3,
    milestoneDelay: 5,
    retainerBurn: 85,
    invoiceStatus: "overdue" as const,
    signals: [{ type: "negative" as const, text: "Missed checkpoint" }],
  },
  {
    id: "client-gamma",
    name: "Gamma Inc",
    avatar: "GI",
    project: "Brand Refresh",
    score: 63,
    trend: "stable" as const,
    trendVal: "0",
    sentiment: "neutral" as const,
    lastTouched: "3d ago",
    overdueTasks: 0,
    unreadMessages: 1,
    milestoneDelay: 0,
    retainerBurn: 55,
    invoiceStatus: "pending" as const,
    signals: [],
  },
];

beforeEach(() => {
  (getStaffAllHealthScores as jest.Mock).mockResolvedValue({
    data: mockData,
    error: null,
    unauthorized: false,
    nextSession: null,
  });
  (createStaffInterventionWithRefresh as jest.Mock).mockResolvedValue({
    data: { id: "int-1" },
    error: null,
    nextSession: null,
  });
});

afterEach(() => jest.clearAllMocks());

describe("ClientHealthPage — KPI strip", () => {
  it("shows 4 KPI cards with computed values", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText("Acme Ltd")).toBeInTheDocument());

    // Portfolio avg: (82 + 44 + 63) / 3 = 63
    expect(screen.getByText("63")).toBeInTheDocument();
    // At risk: 1 (Beta Co score 44 < 50)
    expect(screen.getByText("1")).toBeInTheDocument();
    // Improving: 1 (Acme trend up)
    // Total signals: 1 + 1 + 0 = 2
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("ClientHealthPage — tab navigation", () => {
  it("renders Overview tab by default", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText("Acme Ltd")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /overview/i })).toHaveClass(/chTabActive/);
  });

  it("switches to All Clients tab on click", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Acme Ltd"));
    fireEvent.click(screen.getByRole("button", { name: /all clients/i }));
    // Table should appear
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("switches to At Risk tab and shows only at-risk clients", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Acme Ltd"));
    fireEvent.click(screen.getByRole("button", { name: /at risk/i }));
    expect(screen.getByText("Beta Co")).toBeInTheDocument();
    expect(screen.queryByText("Acme Ltd")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma Inc")).not.toBeInTheDocument();
  });

  it("switches to Positive tab and shows only positive clients", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Acme Ltd"));
    fireEvent.click(screen.getByRole("button", { name: /positive/i }));
    expect(screen.getByText("Acme Ltd")).toBeInTheDocument();
    expect(screen.queryByText("Beta Co")).not.toBeInTheDocument();
  });
});

describe("ClientHealthPage — client selection", () => {
  it("opens detail panel when a client is clicked in the overview needs-attention list", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Beta Co"));
    // Beta Co appears in needs-attention (score 44)
    const attentionItem = screen.getByRole("button", { name: /beta co/i });
    fireEvent.click(attentionItem);
    expect(screen.getByText("Ops Rescue")).toBeInTheDocument(); // detail header
    expect(screen.getByText("Send client update")).toBeInTheDocument();
  });

  it("shows risk banner in detail panel for client with score < 50", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Beta Co"));
    fireEvent.click(screen.getByRole("button", { name: /beta co/i }));
    expect(screen.getByText(/below threshold/i)).toBeInTheDocument();
  });

  it("does NOT show risk banner for client with score >= 50", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Acme Ltd"));
    fireEvent.click(screen.getByRole("button", { name: /all clients/i }));
    fireEvent.click(screen.getByRole("row", { name: /acme ltd/i }));
    expect(screen.queryByText(/below threshold/i)).not.toBeInTheDocument();
  });

  it("clears selection when Clear selection is clicked", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Beta Co"));
    fireEvent.click(screen.getByRole("button", { name: /beta co/i }));
    expect(screen.getByText("Send client update")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear selection/i }));
    expect(screen.queryByText("Send client update")).not.toBeInTheDocument();
  });

  it("persists selected client when switching tabs", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Beta Co"));
    fireEvent.click(screen.getByRole("button", { name: /beta co/i }));
    // Switch to All Clients tab
    fireEvent.click(screen.getByRole("button", { name: /all clients/i }));
    // Detail panel still shows Beta Co
    expect(screen.getByText("Send client update")).toBeInTheDocument();
  });
});

describe("ClientHealthPage — All Clients tab filtering", () => {
  it("filters by search query", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Acme Ltd"));
    fireEvent.click(screen.getByRole("button", { name: /all clients/i }));
    const search = screen.getByPlaceholderText(/search/i);
    fireEvent.change(search, { target: { value: "beta" } });
    expect(screen.getByText("Beta Co")).toBeInTheDocument();
    expect(screen.queryByText("Acme Ltd")).not.toBeInTheDocument();
  });

  it("filters by At Risk sentiment pill", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Acme Ltd"));
    fireEvent.click(screen.getByRole("button", { name: /all clients/i }));
    fireEvent.click(screen.getByRole("button", { name: /at risk/i }));
    expect(screen.getByText("Beta Co")).toBeInTheDocument();
    expect(screen.queryByText("Acme Ltd")).not.toBeInTheDocument();
  });
});

describe("ClientHealthPage — quick actions", () => {
  it("calls createStaffInterventionWithRefresh when Flag for admin review is clicked", async () => {
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Beta Co"));
    fireEvent.click(screen.getByRole("button", { name: /beta co/i }));
    fireEvent.click(screen.getByRole("button", { name: /flag for admin review/i }));
    await waitFor(() =>
      expect(createStaffInterventionWithRefresh).toHaveBeenCalledWith(
        mockSession,
        expect.objectContaining({ clientId: "client-beta", type: "ADMIN_FLAG" })
      )
    );
  });
});

describe("ClientHealthPage — loading and error states", () => {
  it("shows skeleton while loading", () => {
    (getStaffAllHealthScores as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<ClientHealthPage isActive session={mockSession} />);
    expect(document.querySelector(".skeletonBlock")).toBeTruthy();
  });

  it("shows error message on API failure", async () => {
    (getStaffAllHealthScores as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: "Server error", code: "ERR" },
      unauthorized: false,
    });
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText("Server error")).toBeInTheDocument());
  });

  it("shows empty state when no clients", async () => {
    (getStaffAllHealthScores as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
      unauthorized: false,
    });
    render(<ClientHealthPage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText(/no health data/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run tests — expect them to fail**

```bash
cd /Users/maphari/Projects/maphari_technologies
pnpm --filter @maphari/web exec jest apps/web/src/components/staff/staff-dashboard/pages/client-health-page.test.tsx --no-coverage 2>&1 | tail -30
```

Expected: most tests FAIL — the component still has the old structure.

- [ ] **Step 3: Commit failing tests**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/client-health-page.test.tsx
git commit -m "test(staff): write failing tests for health score redesign"
```

---

## Task 4: Rewrite component — state, derived data, helpers

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx`

This task replaces the entire file. Start from scratch — do not try to patch the existing component.

- [ ] **Step 1: Write the new component file (state + helpers, no JSX yet)**

```typescript
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { getStaffAllHealthScores, type StaffHealthScoreEntry } from "@/lib/api/staff/clients";
import type { AuthSession } from "@/lib/auth/session";
import { saveSession } from "@/lib/auth/session";
import { createStaffInterventionWithRefresh } from "@/lib/api/staff/interventions";
import { createStaffClientMessageWithRefresh } from "@/lib/api/staff/messaging";

// ── Types ──────────────────────────────────────────────────────────────────

type HealthClient   = StaffHealthScoreEntry;
type SentimentType  = "positive" | "neutral" | "at_risk";
type TabKey         = "overview" | "atRisk" | "positive" | "all";

type TabFilter = {
  filter:  "all" | SentimentType;
  search:  string;
  sortBy:  "score" | "name" | "trend";
};

type ClientHealthPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_TAB_FILTER: TabFilter = { filter: "all", search: "", sortBy: "score" };

const INIT_TAB_FILTERS: Record<TabKey, TabFilter> = {
  overview: { ...DEFAULT_TAB_FILTER },
  atRisk:   { ...DEFAULT_TAB_FILTER },
  positive: { ...DEFAULT_TAB_FILTER },
  all:      { ...DEFAULT_TAB_FILTER },
};

const SENTIMENT_PILLS: Array<{ value: "all" | SentimentType; label: string }> = [
  { value: "all",      label: "All"      },
  { value: "positive", label: "Positive" },
  { value: "neutral",  label: "Neutral"  },
  { value: "at_risk",  label: "At Risk"  },
];

const SORT_OPTS: Array<{ value: TabFilter["sortBy"]; label: string }> = [
  { value: "score", label: "Score ↓" },
  { value: "name",  label: "Name A–Z" },
  { value: "trend", label: "Trend"   },
];

// ── Pure helpers ───────────────────────────────────────────────────────────

function scoreTier(score: number): "green" | "amber" | "red" {
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
}

function scoreColor(score: number): string {
  if (score >= 75) return "var(--green)";
  if (score >= 50) return "var(--amber)";
  return "var(--red)";
}

function scoreBarClass(score: number): string {
  if (score >= 75) return "chScoreBarFillGreen";
  if (score >= 50) return "chScoreBarFillAmber";
  return "chScoreBarFillRed";
}

function miniFillClass(score: number): string {
  if (score >= 75) return "chMiniFillGreen";
  if (score >= 50) return "chMiniFillAmber";
  return "chMiniFillRed";
}

function sentimentLabel(s: SentimentType): string {
  if (s === "positive") return "Positive";
  if (s === "neutral")  return "Neutral";
  return "At Risk";
}

function sentimentClass(s: SentimentType): string {
  if (s === "positive") return "chSentPositive";
  if (s === "neutral")  return "chSentNeutral";
  return "chSentRisk";
}

function signalDotClass(type: "positive" | "neutral" | "negative"): string {
  if (type === "positive") return "chSignalPositive";
  if (type === "neutral")  return "chSignalNeutral";
  return "chSignalNegative";
}

function trendChipClass(trend: HealthClient["trend"]): string {
  if (trend === "up")   return "chTrendChipUp";
  if (trend === "down") return "chTrendChipDown";
  return "chTrendChipFlat";
}

function trendIcon(trend: HealthClient["trend"]): string {
  if (trend === "up")   return "↑";
  if (trend === "down") return "↓";
  return "→";
}

function invoiceBadgeClass(status: HealthClient["invoiceStatus"]): string {
  if (status === "paid")    return "badgeGreen";
  if (status === "overdue") return "badgeRed";
  return "badgeAmber";
}

function metricValClass(value: number): string {
  if (value >= 75) return "chDpMetricValOk";
  if (value >= 50) return "chDpMetricValWarn";
  return "chDpMetricValBad";
}

function retainerValClass(burn: number): string {
  if (burn > 90) return "chDpMetricValBad";
  if (burn > 70) return "chDpMetricValWarn";
  return "chDpMetricValOk";
}

function retainerMeta(burn: number): string {
  if (burn > 100) return "Retainer exceeded — flag for scope review";
  if (burn > 90)  return "Critical — less than 10% remaining";
  if (burn > 70)  return "Running high";
  return "";
}

function applyTabFilter(clients: HealthClient[], tf: TabFilter): HealthClient[] {
  return clients
    .filter((c) => tf.filter === "all" ? true : c.sentiment === tf.filter)
    .filter((c) => {
      if (!tf.search.trim()) return true;
      const q = tf.search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q)
        || c.project.toLowerCase().includes(q)
        || c.signals.some((s) => s.text.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (tf.sortBy === "score") return b.score - a.score;
      if (tf.sortBy === "name")  return a.name.localeCompare(b.name);
      const order = { up: 0, stable: 1, down: 2 } as const;
      return order[a.trend] - order[b.trend];
    });
}

// ── SVG Score Ring ─────────────────────────────────────────────────────────

function ScoreRing({ score, size = 60 }: { score: number; size?: number }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circ   = 2 * Math.PI * radius;
  const dash   = (score / 100) * circ;
  const color  = scoreColor(score);
  const center = size / 2;
  return (
    <div className={cx("chDpRingWrap")} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`} />
      </svg>
      <div className={cx("chDpRingNum")} style={{ color, fontSize: size <= 60 ? 14 : 18 }}>
        {score}
      </div>
    </div>
  );
}

// ── Component placeholder (JSX added in next task) ─────────────────────────

export function ClientHealthPage({ isActive, session }: ClientHealthPageProps) {
  const [healthData,   setHealthData]   = useState<HealthClient[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [selected,     setSelected]     = useState<string | null>(null);
  const [activeTab,    setActiveTab]    = useState<TabKey>("overview");
  const [tabFilters,   setTabFilters]   = useState<Record<TabKey, TabFilter>>(INIT_TAB_FILTERS);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionDone,    setActionDone]    = useState<string | null>(null);
  const [actionError,   setActionError]   = useState<string | null>(null);

  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgSubject,   setMsgSubject]   = useState("");
  const [msgBody,      setMsgBody]      = useState("");
  const [msgSending,   setMsgSending]   = useState(false);
  const [msgToast,     setMsgToast]     = useState<{ tone: "success" | "error"; text: string } | null>(null);

  // ── Tab filter helpers ────────────────────────────────────────────────────

  function setTabFilter(tab: TabKey, patch: Partial<TabFilter>) {
    setTabFilters((prev) => ({ ...prev, [tab]: { ...prev[tab], ...patch } }));
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadHealthData = useCallback(async (background = false) => {
    if (!session?.accessToken || !isActive) { setLoading(false); return; }
    if (background) setRefreshing(true);
    else            setLoading(true);
    setError(null);
    try {
      const result = await getStaffAllHealthScores(session);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setError(result.error.message ?? "Failed to load client health");
        setHealthData([]);
        return;
      }
      setHealthData(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client health");
      setHealthData([]);
    } finally {
      if (background) setRefreshing(false);
      else            setLoading(false);
    }
  }, [isActive, session]);

  useEffect(() => { void loadHealthData(false); }, [loadHealthData]);

  // ── Derived / computed ────────────────────────────────────────────────────

  const avg          = healthData.length > 0
    ? Math.round(healthData.reduce((s, c) => s + c.score, 0) / healthData.length)
    : 0;
  const atRiskList   = healthData.filter((c) => c.score < 50);
  const atRiskCount  = atRiskList.length;
  const improvingCount = healthData.filter((c) => c.trend === "up").length;
  const totalSignals = healthData.reduce((sum, c) => sum + c.signals.length, 0);
  const trendCounts  = healthData.reduce(
    (acc, c) => { acc[c.trend] += 1; return acc; },
    { up: 0, stable: 0, down: 0 }
  );
  const tierCounts   = {
    good:  healthData.filter((c) => c.score >= 75).length,
    fair:  healthData.filter((c) => c.score >= 50 && c.score < 75).length,
    risk:  healthData.filter((c) => c.score < 50).length,
  };

  const filteredAll = useMemo(
    () => applyTabFilter(healthData, tabFilters.all),
    [healthData, tabFilters.all]
  );
  const filteredAtRisk = useMemo(
    () => applyTabFilter(atRiskList, tabFilters.atRisk),
    [atRiskList, tabFilters.atRisk]
  );
  const filteredPositive = useMemo(
    () => applyTabFilter(healthData.filter((c) => c.sentiment === "positive"), tabFilters.positive),
    [healthData, tabFilters.positive]
  );

  const selectedClient = selected
    ? healthData.find((c) => c.id === selected) ?? null
    : null;

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleQuickAction(label: string, type: string, description: string, priority: string) {
    if (!session || !selectedClient) return;
    setActionLoading(label);
    setActionDone(null);
    setActionError(null);
    try {
      const result = await createStaffInterventionWithRefresh(session, {
        clientId: selectedClient.id, type, description, priority,
      });
      if (result.nextSession) saveSession(result.nextSession);
      if (!result.error && result.data) {
        setActionDone(label);
        setTimeout(() => setActionDone(null), 3000);
      } else if (result.error) {
        setActionError(result.error.message ?? "Action failed");
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendMessage() {
    if (!session || !selectedClient || !msgSubject.trim() || !msgBody.trim()) return;
    setMsgSending(true);
    try {
      const result = await createStaffClientMessageWithRefresh(
        session, selectedClient.id, msgSubject.trim(), msgBody.trim()
      );
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setMsgToast({ tone: "error", text: result.error.message });
      } else {
        setMsgToast({ tone: "success", text: "Message sent to client" });
        setMsgSubject(""); setMsgBody(""); setShowMsgModal(false);
        setTimeout(() => setMsgToast(null), 3000);
      }
    } catch (err) {
      setMsgToast({ tone: "error", text: err instanceof Error ? err.message : "Failed to send" });
    } finally {
      setMsgSending(false);
    }
  }

  // ── Render placeholder (full JSX in Task 5) ───────────────────────────────

  if (!isActive) return null;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", "pageActive")} id="page-health">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", "pageActive")} id="page-health">
      <div className={cx("emptyState")}>
        <div className={cx("emptyStateTitle")}>Redesign in progress</div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/maphari/Projects/maphari_technologies
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx
git commit -m "refactor(staff): rewrite health page state and helpers (no JSX yet)"
```

---

## Task 5: Implement JSX — page shell, KPI strip, tab bar

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx`

- [ ] **Step 1: Replace the `return` block with the full page shell + KPI strip + tab bar**

Replace everything from `if (!isActive) return null;` down to the closing `}` of the component with:

```tsx
  if (!isActive) return null;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", "pageActive")} id="page-health">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (healthData.length === 0 && !error) {
    return (
      <section className={cx("page", "pageBody", "pageActive")} id="page-health">
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="bar-chart-2" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No health data yet</div>
          <div className={cx("emptyStateSub")}>Health scores are computed from client activity. Add clients and record health signals to see data here.</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", "pageActive")} id="page-health">

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      )}

      {/* ── Page header ────────────────────────────────────────────────── */}
      <header className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "text11", "colorMuted2")}>
          Staff Dashboard / Client Work
        </div>
        <h1 className={cx("pageTitleText", "mb4")}>Client Health Score</h1>
        <p className={cx("text12", "colorMuted2", "mb0")}>
          Signals, scores, and interventions for every client — one living dashboard.
        </p>
      </header>

      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      <div className={cx("chKpiStrip")}>
        <div className={cx("chKpiCard", "chKpiCardAccent")}>
          <div className={cx("chKpiLabel")}>Portfolio Avg</div>
          <div className={cx("chKpiVal")} style={{ color: "var(--accent)" }}>{avg}</div>
          <div className={cx("chKpiMeta")}>{healthData.length} clients tracked</div>
        </div>
        <div className={cx("chKpiCard", "chKpiCardRed")}>
          <div className={cx("chKpiLabel")}>At Risk</div>
          <div className={cx("chKpiVal")} style={{ color: "var(--red)" }}>{atRiskCount}</div>
          <div className={cx("chKpiMeta")}>score below 50</div>
        </div>
        <div className={cx("chKpiCard", "chKpiCardGreen")}>
          <div className={cx("chKpiLabel")}>Improving</div>
          <div className={cx("chKpiVal")} style={{ color: "var(--green)" }}>{improvingCount}</div>
          <div className={cx("chKpiMeta")}>↑ trend upward</div>
        </div>
        <div className={cx("chKpiCard", "chKpiCardPurple")}>
          <div className={cx("chKpiLabel")}>Total Signals</div>
          <div className={cx("chKpiVal")} style={{ color: "var(--purple)" }}>{totalSignals}</div>
          <div className={cx("chKpiMeta")}>
            {healthData.length > 0 ? Math.round(totalSignals / healthData.length) : 0} per client avg
          </div>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <div className={cx("chTabBarRow")}>
        {(["overview", "atRisk", "positive", "all"] as TabKey[]).map((tab) => {
          const labels: Record<TabKey, string> = {
            overview: "Overview",
            atRisk:   "At Risk",
            positive: "Positive",
            all:      "All Clients",
          };
          const badges: Record<TabKey, { count: number; cls: string } | null> = {
            overview: null,
            atRisk:   { count: atRiskCount,                                          cls: "chTabBadgeRed"   },
            positive: { count: healthData.filter((c) => c.sentiment === "positive").length, cls: "chTabBadgeGreen" },
            all:      { count: healthData.length,                                    cls: "chTabBadgeMuted" },
          };
          const badge = badges[tab];
          return (
            <button
              key={tab}
              type="button"
              className={cx("chTab", activeTab === tab && "chTabActive")}
              onClick={() => setActiveTab(tab)}
              aria-selected={activeTab === tab}
            >
              {labels[tab]}
              {badge && (
                <span className={cx(badge.cls)}>{badge.count}</span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          className={cx("chTabClearBtn")}
          onClick={() => setSelected(null)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : selected ? "Clear selection" : "Refresh"}
        </button>
        <button
          type="button"
          className={cx("chTabClearBtn")}
          style={{ marginLeft: 4 }}
          onClick={() => void loadHealthData(true)}
          disabled={refreshing}
        >
          ↺ Refresh
        </button>
      </div>

      {/* ── Tab body (content + detail panel) ─────────────────────────── */}
      <div className={cx("chTabBody")}>
        <div className={cx("chTabContent")}>
          {/* Tab content rendered in Task 6 & 7 */}
          <div className={cx("emptyStateSub")}>Tab: {activeTab}</div>
        </div>
        <div className={cx("chTabDetail")}>
          {/* Detail panel rendered in Task 8 */}
          <div className={cx("chDpEmpty")}>
            <div className={cx("chDpEmptyText")}>Select a client to view details</div>
          </div>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {msgToast && (
        <div className={cx("staffToast", msgToast.tone === "success" ? "staffToastSuccess" : "staffToastError")}>
          {msgToast.text}
        </div>
      )}

      {/* ── Message modal ──────────────────────────────────────────────── */}
      {showMsgModal && selectedClient && (
        <div className={cx("modalBackdrop")} onClick={(e) => { if (e.target === e.currentTarget) setShowMsgModal(false); }}>
          <div className={cx("modal")}>
            <div className={cx("modalHeader")}>
              <span className={cx("modalTitle")}>Message {selectedClient.name}</span>
              <button type="button" className={cx("modalClose")} onClick={() => setShowMsgModal(false)}>
                <Ic n="x" sz={15} c="var(--text)" />
              </button>
            </div>
            <div className={cx("modalBody")}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--muted2)", display: "block", marginBottom: 4 }}>Subject</label>
                  <input className={cx("staffFilterInput")} placeholder="Message subject" value={msgSubject}
                    onChange={(e) => setMsgSubject(e.target.value)} autoFocus />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--muted2)", display: "block", marginBottom: 4 }}>Message</label>
                  <textarea className={cx("staffFilterInput")} placeholder="Type your message…" value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)} rows={5}
                    style={{ resize: "vertical", height: "auto" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 16px", borderTop: "1px solid var(--b1)" }}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowMsgModal(false)}>Cancel</button>
              <button type="button" className={cx("btnSm", "btnAccent")}
                disabled={msgSending || !msgSubject.trim() || !msgBody.trim()}
                onClick={() => void handleSendMessage()}>
                {msgSending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Run tests — some should pass now**

```bash
pnpm --filter @maphari/web exec jest apps/web/src/components/staff/staff-dashboard/pages/client-health-page.test.tsx --no-coverage 2>&1 | tail -20
```

Expected: loading/error/empty-state tests pass; tab/selection tests still fail (tab content not rendered yet).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx
git commit -m "feat(staff): add health page shell, kpi strip, tab bar"
```

---

## Task 6: Implement Overview tab + At Risk / Positive tabs

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx`

- [ ] **Step 1: Extract a `ClientTable` sub-component and add it before the main component**

Add this function before `export function ClientHealthPage`:

```tsx
function FilterBar({
  tf,
  onChange,
  showSentimentPills,
  sentimentCounts,
}: {
  tf: TabFilter;
  onChange: (patch: Partial<TabFilter>) => void;
  showSentimentPills: boolean;
  sentimentCounts: Record<"all" | SentimentType, number>;
}) {
  return (
    <div className={cx("chFilterBar")}>
      <input
        className={cx("staffFilterInput")}
        placeholder="Search client, project, or signal…"
        value={tf.search}
        onChange={(e) => onChange({ search: e.target.value })}
      />
      {showSentimentPills && SENTIMENT_PILLS.map((pill) => (
        <button
          key={pill.value}
          type="button"
          className={cx(tf.filter === pill.value ? "chFilterPillActive" : "chFilterPillIdle")}
          onClick={() => onChange({ filter: pill.value })}
          aria-pressed={tf.filter === pill.value}
        >
          {pill.label}
          <span className={cx("chFilterPillCount")}>{sentimentCounts[pill.value]}</span>
        </button>
      ))}
      <div className={cx("chSortGroup")} style={{ marginLeft: "auto" }}>
        <span className={cx("chSortLabel")}>Sort</span>
        {SORT_OPTS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={cx(tf.sortBy === opt.value ? "chSortPillActive" : "chSortPillIdle")}
            onClick={() => onChange({ sortBy: opt.value })}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ClientTable({
  clients,
  selected,
  onSelect,
}: {
  clients: HealthClient[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (clients.length === 0) {
    return (
      <div className={cx("emptyState")}>
        <div className={cx("emptyStateTitle")}>No clients match filters</div>
        <div className={cx("emptyStateSub")}>Try clearing search or filters.</div>
      </div>
    );
  }
  return (
    <table className={cx("chTable")}>
      <thead>
        <tr>
          <th>Client</th>
          <th>Score</th>
          <th>Trend</th>
          <th>Sentiment</th>
          <th>Invoice</th>
          <th>Tasks</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((c) => (
          <tr
            key={c.id}
            className={cx(selected === c.id && "chTableRowSelected")}
            onClick={() => onSelect(c.id)}
          >
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className={cx("staffClientAvatar")}>{c.avatar}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>{c.name}</div>
                  <div style={{ fontSize: 9, color: "var(--muted2)" }}>{c.project}</div>
                </div>
              </div>
            </td>
            <td>
              <div className={cx("chScoreBarCell")}>
                <div className={cx("chScoreBarWrap")}>
                  <div className={cx("chScoreBarTrack")}>
                    <div className={cx(scoreBarClass(c.score))} style={{ width: `${c.score}%` }} />
                  </div>
                </div>
                <div className={cx("chScoreText")} style={{ color: scoreColor(c.score) }}>{c.score}</div>
              </div>
            </td>
            <td>
              <span className={cx(trendChipClass(c.trend))}>
                {trendIcon(c.trend)} {c.trendVal}
              </span>
            </td>
            <td>
              <span className={cx("badgeSm", sentimentClass(c.sentiment))}>
                {sentimentLabel(c.sentiment)}
              </span>
            </td>
            <td>
              <span className={cx("badgeSm", invoiceBadgeClass(c.invoiceStatus))}>
                {c.invoiceStatus.charAt(0).toUpperCase() + c.invoiceStatus.slice(1)}
              </span>
            </td>
            <td style={{ fontSize: 10, color: c.overdueTasks > 0 ? "var(--red)" : "var(--green)" }}>
              {c.overdueTasks > 0 ? `${c.overdueTasks} overdue` : "On track"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: Replace the tab content placeholder with real tab rendering**

In the return block, find:
```tsx
        <div className={cx("chTabContent")}>
          {/* Tab content rendered in Task 6 & 7 */}
          <div className={cx("emptyStateSub")}>Tab: {activeTab}</div>
        </div>
```

Replace with:

```tsx
        <div className={cx("chTabContent")}>

          {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className={cx("chOverviewGrid")}>

              {/* Left: score distribution + sparkline */}
              <div className={cx("chOvPanel")}>
                <div className={cx("chOvPanelLabel")}>Score Distribution</div>
                <div className={cx("chTierRow")}>
                  <div className={cx("chTierBox", "chTierBoxGreen")}>
                    <div className={cx("chTierNum", "chTierNumGreen")}>{tierCounts.good}</div>
                    <div className={cx("chTierLbl")}>Good · 75–100</div>
                  </div>
                  <div className={cx("chTierBox", "chTierBoxAmber")}>
                    <div className={cx("chTierNum", "chTierNumAmber")}>{tierCounts.fair}</div>
                    <div className={cx("chTierLbl")}>Fair · 50–74</div>
                  </div>
                  <div className={cx("chTierBox", "chTierBoxRed")}>
                    <div className={cx("chTierNum", "chTierNumRed")}>{tierCounts.risk}</div>
                    <div className={cx("chTierLbl")}>Risk · below 50</div>
                  </div>
                </div>
                <div className={cx("chOvPanelLabel")} style={{ marginTop: 12, marginBottom: 2 }}>
                  Trend Momentum
                </div>
                {/* Decorative sparkline: bar heights proportional to trendCounts.up / total */}
                {(() => {
                  const total = Math.max(1, trendCounts.up + trendCounts.stable + trendCounts.down);
                  const upRatio = trendCounts.up / total;
                  const heights = [0.3, 0.4, 0.35, 0.5 + upRatio * 0.3, 0.45 + upRatio * 0.3, 0.5 + upRatio * 0.5];
                  return (
                    <div className={cx("chSparkline")}>
                      {heights.map((h, i) => (
                        <div
                          key={i}
                          className={cx("chSpBar", i === heights.length - 1 && "chSpBarLast")}
                          style={{ height: `${h * 100}%` }}
                        />
                      ))}
                    </div>
                  );
                })()}
                <div style={{ fontSize: 9, color: "var(--muted2)", marginTop: 5 }}>
                  {trendCounts.up} of {healthData.length} clients trending upward
                </div>
              </div>

              {/* Right: needs-attention */}
              <div className={cx("chOvPanel")}>
                <div className={cx("chOvPanelLabel", "chOvPanelLabelRed")}>
                  Needs Attention — click to view
                </div>
                {atRiskList.length === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--green)", padding: "8px 0" }}>
                    ✓ All clients are in healthy range
                  </div>
                ) : (
                  <div className={cx("chAttentionList")}>
                    {atRiskList.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={cx("chAttentionItem", selected === c.id && "chAttentionItemSelected")}
                        onClick={() => setSelected(selected === c.id ? null : c.id)}
                      >
                        <div className={cx("staffClientAvatar")}>{c.avatar}</div>
                        <div className={cx("chAttentionInfo")}>
                          <div className={cx("chAttentionName")}>{c.name}</div>
                          <div className={cx("chAttentionProj")}>{c.project}</div>
                          <div className={cx("chMiniTrack")}>
                            <div className={cx(miniFillClass(c.score))} style={{ width: `${c.score}%` }} />
                          </div>
                        </div>
                        <div className={cx("chAttentionScore")} style={{ color: scoreColor(c.score) }}>
                          {c.score}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── AT RISK TAB ──────────────────────────────────────────── */}
          {activeTab === "atRisk" && (
            <>
              <FilterBar
                tf={tabFilters.atRisk}
                onChange={(p) => setTabFilter("atRisk", p)}
                showSentimentPills={false}
                sentimentCounts={{ all: atRiskList.length, positive: 0, neutral: 0, at_risk: atRiskList.length }}
              />
              {filteredAtRisk.length === 0 && atRiskList.length === 0 ? (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateTitle")}>No at-risk clients right now</div>
                  <div className={cx("emptyStateSub")}>All clients are above the risk threshold.</div>
                </div>
              ) : (
                <ClientTable
                  clients={filteredAtRisk}
                  selected={selected}
                  onSelect={(id) => setSelected(selected === id ? null : id)}
                />
              )}
            </>
          )}

          {/* ── POSITIVE TAB ─────────────────────────────────────────── */}
          {activeTab === "positive" && (
            <>
              <FilterBar
                tf={tabFilters.positive}
                onChange={(p) => setTabFilter("positive", p)}
                showSentimentPills={false}
                sentimentCounts={{ all: healthData.filter((c) => c.sentiment === "positive").length, positive: 0, neutral: 0, at_risk: 0 }}
              />
              <ClientTable
                clients={filteredPositive}
                selected={selected}
                onSelect={(id) => setSelected(selected === id ? null : id)}
              />
            </>
          )}

          {/* ── ALL CLIENTS TAB ──────────────────────────────────────── */}
          {activeTab === "all" && (
            <>
              <FilterBar
                tf={tabFilters.all}
                onChange={(p) => setTabFilter("all", p)}
                showSentimentPills={true}
                sentimentCounts={{
                  all:      healthData.length,
                  positive: healthData.filter((c) => c.sentiment === "positive").length,
                  neutral:  healthData.filter((c) => c.sentiment === "neutral").length,
                  at_risk:  atRiskCount,
                }}
              />
              <ClientTable
                clients={filteredAll}
                selected={selected}
                onSelect={(id) => setSelected(selected === id ? null : id)}
              />
            </>
          )}

        </div>
```

- [ ] **Step 3: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Run tests — more should pass now**

```bash
pnpm --filter @maphari/web exec jest apps/web/src/components/staff/staff-dashboard/pages/client-health-page.test.tsx --no-coverage 2>&1 | tail -20
```

Expected: tab navigation tests pass; detail panel / action tests still fail.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx
git commit -m "feat(staff): add overview, at-risk, positive, all-clients tab content"
```

---

## Task 7: Implement the detail panel

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx`

- [ ] **Step 1: Replace the detail panel placeholder**

In the return block, find:
```tsx
        <div className={cx("chTabDetail")}>
          {/* Detail panel rendered in Task 8 */}
          <div className={cx("chDpEmpty")}>
            <div className={cx("chDpEmptyText")}>Select a client to view details</div>
          </div>
        </div>
```

Replace with:

```tsx
        <div className={cx("chTabDetail")}>
          {!selectedClient ? (
            <div className={cx("chDpEmpty")}>
              <Ic n="bar-chart-2" sz={22} c="var(--muted2)" />
              <div className={cx("chDpEmptyText")}>Select a client to view details</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className={cx("chDpHeader")}>
                <div className={cx("chDpName")}>{selectedClient.name}</div>
                <div className={cx("chDpProj")}>{selectedClient.project} · Last touched {selectedClient.lastTouched}</div>
              </div>

              {/* Score ring + score */}
              <div className={cx("chDpScoreRow")}>
                <ScoreRing score={selectedClient.score} size={60} />
                <div>
                  <div className={cx("chDpScoreBig")} style={{ color: scoreColor(selectedClient.score) }}>
                    {selectedClient.score}
                    <span style={{ fontSize: 12, color: "var(--muted2)", fontWeight: 400 }}>/100</span>
                  </div>
                  <div className={cx("chDpScoreMeta")}>
                    <span className={cx(sentimentClass(selectedClient.sentiment))}>
                      {sentimentLabel(selectedClient.sentiment)}
                    </span>
                    <span>{trendIcon(selectedClient.trend)} {selectedClient.trendVal} this week</span>
                  </div>
                </div>
              </div>

              {/* Risk banner */}
              {selectedClient.score < 50 && (
                <div className={cx("chDpRiskBanner")}>
                  <Ic n="alert-circle" sz={14} c="var(--red)" />
                  <div className={cx("chDpRiskMsg")}>
                    Below threshold. Schedule a check-in or escalate to account manager.
                  </div>
                </div>
              )}

              {/* 2x2 metrics */}
              <div className={cx("chDpMetrics")}>
                <div className={cx("chDpMetric")}>
                  <div className={cx("chDpMetricLabel")}>Overdue Tasks</div>
                  <div className={cx(selectedClient.overdueTasks > 0 ? "chDpMetricValBad" : "chDpMetricValOk")}>
                    {selectedClient.overdueTasks > 0 ? `${selectedClient.overdueTasks} overdue` : "On track"}
                  </div>
                </div>
                <div className={cx("chDpMetric")}>
                  <div className={cx("chDpMetricLabel")}>Unread Msgs</div>
                  <div className={cx(selectedClient.unreadMessages > 0 ? "chDpMetricValWarn" : "chDpMetricValOk")}>
                    {selectedClient.unreadMessages > 0 ? `${selectedClient.unreadMessages} unread` : "Clear"}
                  </div>
                </div>
                <div className={cx("chDpMetric")}>
                  <div className={cx("chDpMetricLabel")}>Invoice</div>
                  <div className={cx(
                    selectedClient.invoiceStatus === "paid"    ? "chDpMetricValOk"  :
                    selectedClient.invoiceStatus === "pending" ? "chDpMetricValWarn" : "chDpMetricValBad"
                  )}>
                    {selectedClient.invoiceStatus.charAt(0).toUpperCase() + selectedClient.invoiceStatus.slice(1)}
                  </div>
                </div>
                <div className={cx("chDpMetric")}>
                  <div className={cx("chDpMetricLabel")}>Retainer</div>
                  <div className={cx(retainerValClass(selectedClient.retainerBurn))}>
                    {selectedClient.retainerBurn}% used
                  </div>
                </div>
              </div>

              {/* Signals */}
              <div>
                <div className={cx("chDpSecLabel")}>Health Signals</div>
                {selectedClient.signals.length === 0 ? (
                  <div style={{ fontSize: 10, color: "var(--muted2)" }}>No signals recorded yet.</div>
                ) : (
                  <div className={cx("chDpSignalList")}>
                    {selectedClient.signals.map((signal, i) => (
                      <div key={i} className={cx("chDpSignalRow")}>
                        <div className={cx("chDpSignalDot", signalDotClass(signal.type))} />
                        <div>
                          <div className={cx("chDpSignalText")}>{signal.text}</div>
                          <div className={cx("chDpSignalType")}>{signal.type.toUpperCase()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div>
                <div className={cx("chDpSecLabel")}>Quick Actions</div>
                {actionError && (
                  <div style={{ fontSize: 10, color: "var(--red)", marginBottom: 6 }}>{actionError}</div>
                )}
                <div className={cx("chDpActionList")}>
                  {[
                    { label: "Send client update",     type: "CLIENT_UPDATE",  priority: "MEDIUM", desc: "Auto-draft client update from recent activity", cls: "chDpActionBtnPrimary", ico: "✉" },
                    { label: "Schedule check-in call", type: "SCHEDULE_CALL",  priority: "MEDIUM", desc: "Schedule a check-in call with client",           cls: "",                    ico: "📅" },
                    { label: "Flag for admin review",  type: "ADMIN_FLAG",     priority: "HIGH",   desc: "Flagged for admin review by staff member",       cls: "chDpActionBtnDanger", ico: "⚑" },
                  ].map(({ label, type, priority, desc, cls, ico }) => (
                    <button
                      key={label}
                      type="button"
                      className={cx("chDpActionBtn", cls)}
                      disabled={actionLoading !== null}
                      onClick={() => void handleQuickAction(label, type, desc, priority)}
                    >
                      <span className={cx("chDpActionIco")}>{ico}</span>
                      {actionLoading === label ? "Processing…" : actionDone === label ? "Done ✓" : label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={cx("chDpActionBtn")}
                    onClick={() => { setMsgSubject(""); setMsgBody(""); setShowMsgModal(true); }}
                  >
                    <span className={cx("chDpActionIco")}>💬</span>
                    Message client
                  </button>
                </div>
              </div>

              {/* Retainer burn */}
              <div className={cx("chDpRetainerBar")}>
                <div className={cx("chDpRetainerHead")}>
                  <div className={cx("chDpRetainerLabel")}>Retainer Burn</div>
                  <div className={cx("chDpRetainerPct")} style={{ color: scoreColor(100 - selectedClient.retainerBurn) }}>
                    {selectedClient.retainerBurn}%
                  </div>
                </div>
                <div className={cx("chDpRetainerTrack")}>
                  <div
                    className={cx(selectedClient.retainerBurn > 90 ? "chMiniFillRed" : selectedClient.retainerBurn > 70 ? "chMiniFillAmber" : "chMiniFillGreen")}
                    style={{ width: `${Math.min(selectedClient.retainerBurn, 100)}%`, height: "100%", borderRadius: "99px" }}
                  />
                </div>
                {retainerMeta(selectedClient.retainerBurn) && (
                  <div className={cx("chDpRetainerMeta")}>{retainerMeta(selectedClient.retainerBurn)}</div>
                )}
              </div>
            </>
          )}
        </div>
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Run all tests — all should pass**

```bash
pnpm --filter @maphari/web exec jest apps/web/src/components/staff/staff-dashboard/pages/client-health-page.test.tsx --no-coverage 2>&1 | tail -30
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx
git commit -m "feat(staff): implement detail panel with score ring, metrics, signals, actions"
```

---

## Task 8: Remove old unused CSS classes

**Files:**
- Modify: `apps/web/src/app/style/staff/pages-b.module.css`

Old client-health layout classes (the "CLIENT HEALTH EXTENDED" section at lines ~3611–4010 and additional classes at ~4664–4919) are no longer referenced by the rewritten component. The Communication History `ch*` classes (lines 1651–1761) and the Health Summary `chs*` classes must NOT be touched.

- [ ] **Step 1: Verify which old classes are unreferenced**

```bash
cd /Users/maphari/Projects/maphari_technologies
# Check if any old hero/layout classes are still used in TSX files
grep -r "chHeroBanner\|chHeroLayout\|chHeroPanel\|chMainShell\|chClientGrid\|chClientCard\|chDetailShell\|chDetailGrid\|chActionPanel\|chSignalPanel\|chToolbarBar\|chSearchGroup\|chHeroBtn\|chRetainerCard\|chRowCard\|chLayoutWithDetail\|chListPaneWithDetail" apps/web/src --include="*.tsx" 2>&1 | grep -v "test\." | head -20
```

Expected: no matches from `client-health-page.tsx`. If any other `.tsx` file references them, do NOT remove that class.

- [ ] **Step 2: Delete only the old health layout block from pages-b.module.css**

The block to remove is the comment-delimited section for the old health layout. It starts at approximately:
```css
/* ── client health page ── */
.chLayout {
```
and ends just before the `/* ═══` separator for the next section.

Use the IDE to locate the exact start/end lines, then delete the block. Be careful NOT to delete:
- The Communication History `ch*` classes (lines 1651–1761 — they start with `.chShell`, `.chClientList`, etc.)
- Any `chs*` classes
- The new classes you added in Tasks 1 & 2

- [ ] **Step 3: TypeScript check + tests**

```bash
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -20
pnpm --filter @maphari/web exec jest apps/web/src/components/staff/staff-dashboard/pages/client-health-page.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: no TypeScript errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/style/staff/pages-b.module.css
git commit -m "style(staff): remove old client health layout css (replaced by redesign)"
```

---

## Task 9: End-to-end smoke test

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/maphari/Projects/maphari_technologies
pnpm dev 2>&1 &
# Wait for "Ready" message
```

- [ ] **Step 2: Navigate to staff dashboard health page**

Open `http://localhost:3000` (staff subdomain or with `NEXT_PUBLIC_APP_TYPE=both`).
Navigate to Client Work → Client Health Score.

Verify visually:
- [ ] KPI strip shows 4 cards with orange/red/green/purple tints
- [ ] Tab bar shows Overview (active), At Risk, Positive, All Clients
- [ ] Overview: score distribution boxes + sparkline + needs-attention list (if any at-risk clients)
- [ ] Clicking a client in needs-attention opens the detail panel on the right
- [ ] Switching tabs keeps the detail panel open with the same client
- [ ] All Clients tab: table with search + filter pills + sort
- [ ] Clicking a table row selects it (left orange border + tinted background) and opens panel
- [ ] Detail panel: score ring, risk banner (for score < 50), metrics, signals, actions
- [ ] "Send client update" → calls intervention API → shows "Done ✓"
- [ ] "Message client" → opens modal → sends message → shows toast
- [ ] Clear selection button closes the panel
- [ ] Refresh button reloads data without full page reload
- [ ] Responsive at ≤900px: tabs stack, detail panel goes below content

- [ ] **Step 3: Stop dev server**

```bash
kill %1
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git status  # verify only expected files changed
git commit -m "feat(staff): complete client health score page redesign

Tabbed overview (Overview/At Risk/Positive/All Clients) with persistent
right-side detail panel. Real API data only. Per-tab filter state.
All quick actions and message modal wired and working.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
