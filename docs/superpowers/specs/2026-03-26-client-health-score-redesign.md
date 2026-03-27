# Client Health Score Page — Redesign Spec

**Date:** 2026-03-26
**Dashboard:** Staff Dashboard
**Section:** Client Work
**Page:** Client Health Score (`activePage === "health"`)
**Status:** Approved for implementation

---

## 1. Overview

Redesign the `ClientHealthPage` component from its current split list/detail layout into a **tabbed overview with persistent side panel**. All data is live from the real API (`/staff/health-scores`). No hardcoded or dummy data. The page is view + action only — no signal recording.

---

## 2. Layout Structure

```
┌─ Topbar (orange stripe) ──────────────────────────────────────────┐
├─ Rail │ Page content ─────────────────────────────────────────────┤
│       │  Eyebrow / Title / Description                            │
│       │  ┌── KPI Strip (4 cards, always visible) ──────────────┐  │
│       │  └──────────────────────────────────────────────────────┘  │
│       │  ┌── Tab Bar + Clear button ──────────────────────────────┐│
│       │  │ Overview │ At Risk [n] │ Positive [n] │ All Clients [n]││
│       │  └────────────────────────────────────────────────────────┘│
│       │  ┌── Tab Body ─────────────────────────┬── Detail Panel ─┐ │
│       │  │  (tab content)                      │  (right panel)  │ │
│       │  └─────────────────────────────────────┴─────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### KPI Strip (always visible above tabs)

Four cards. All tinted backgrounds are **new CSS classes** to be defined in `pages-b.module.css` (not pre-existing utilities):

| Card | Value | CSS class |
|------|-------|-----------|
| Portfolio Avg | `avg` computed from all scores | `chKpiCardAccent` (orange tint) |
| At Risk | count of clients with score < 50 | `chKpiCardRed` (red tint) |
| Improving | count with `trend === "up"` — labelled "↑ trend upward" in sub-text to distinguish from Positive sentiment | `chKpiCardGreen` (green tint) |
| Total Signals | sum of all signal array lengths | `chKpiCardPurple` (purple tint, uses `--purple: #a855f7`) |

### Tab Bar

Rendered **inside the page content area** (not in the shared topbar shell). The tab bar row also contains a "Clear selection" button at the far right — this is a page-level element, not part of the shared topbar component. No changes to topbar component needed.

Four tabs, each with a count badge:

- **Overview** — default active tab
- **At Risk** — red badge, count of `score < 50`
- **Positive** — green badge, count of `sentiment === "positive"`
- **All Clients** — muted badge, total count

### Detail Panel (right, 260px wide)

Persistent across all tabs. Shows when a client is selected anywhere. Empty state ("Select a client to view details") when nothing is selected. Contains:

1. Header — client name, project, last touched
2. Score ring (SVG) + score number + sentiment badge + trend value
3. Risk banner (only when `score < 50`) — red tinted, escalation message
4. 2×2 metric grid — overdue tasks, unread messages, invoice status, retainer burn %
5. Signals list — dot (pos/neg/neu) + signal text + type label. If no signals: "No signals recorded yet."
6. Quick actions (4 buttons) — see §5
7. Retainer burn: progress bar showing `retainerBurn` % with colour (green/amber/red). No days-remaining estimate — only `retainerBurn` is available from the API. Show contextual copy: >90% → "Critical — less than 10% remaining", >70% → "Running high", else → blank.

---

## 3. Tab Content

### Overview Tab

Two equal-width panels side by side:

**Left — Score Distribution + Trend Momentum**
- Three tier boxes: Good (75–100), Fair (50–74), Risk (<50) — each shows client count, tinted background matching tier
- Sparkline bar chart (6 bars) — **always decorative**. `trendVal` on `StaffHealthScoreEntry` is a string label (e.g. "+3"), not historical data. Render 6 bars with heights proportional to `trendCounts.up / total` to give a sense of direction. No axis labels.
- Subtitle: computed from `trendCounts`: e.g. "7 of 12 clients trending upward"

**Right — Needs Attention**
- Section label in red: "Needs Attention — click to view"
- Lists all clients with `score < 50`, each row: avatar, name, project, mini progress bar, score number
- Each row is clickable → selects that client (opens detail panel)
- If no at-risk clients: empty state "All clients are in healthy range ✓" (green tint)

### At Risk Tab

- Filter bar: **search input + sort pill only** — sentiment filter pills are **omitted** (all items already filtered to `score < 50`; showing sentiment pills would be contradictory)
- Same table structure as All Clients, pre-filtered to `score < 50`
- Clicking a row → selects that client

### Positive Tab

- Filter bar: **search input + sort pill only** — sentiment filter pills omitted (pre-filtered to `sentiment === "positive"`)
- Same table, pre-filtered to `sentiment === "positive"`

### All Clients Tab

**Filter bar:**
- Text search input (searches name, project, signal text)
- Sentiment filter pills: All / Positive / Neutral / At Risk — each with count badge. These are **only shown on All Clients tab**.
- Sort pill (rightmost): cycles Score ↓ / Name A–Z / Trend

**Table columns:**
1. Client — avatar circle (initials, tinted by score tone) + name + project
2. Score — mini progress bar (`chScoreBarTrack` / `chScoreBarFill`) + score number (coloured green/amber/red by tier)
3. Trend — trend chip (↑ up / ↓ down / → stable) with `trendVal`
4. Sentiment — badge (Positive / Neutral / At Risk)
5. Invoice — badge (Paid / Pending / Overdue)
6. Tasks — plain text ("On track" or "N overdue")

Selected row: left orange border + `chKpiCardAccent` background. Clicking a row selects it and opens the detail panel. Clicking the same row again deselects (clears panel to empty state).

---

## 4. Interaction Rules

- **Clicking any client** anywhere (overview needs-attention list, At Risk tab row, Positive tab row, All Clients table row) selects that client and opens the detail panel
- **Selected client persists as tabs change** — the panel stays open with the same client even if that client is not visible in the new tab's list (no row will be highlighted in that case, which is intentional). Do NOT clear `selected` when the client disappears from a filtered list — this is a deliberate change from the current implementation which clears selection on filter change
- **"Clear selection"** button (in the tab bar row, far right) clears `selected` state, closing the detail panel
- **Deselect**: clicking the same row/item again sets `selected` to null
- **Per-tab filter state**: use a single `Record<TabKey, { filter: SentimentType | "all"; search: string; sortBy: "score" | "name" | "trend" }>` state map, where `TabKey = "overview" | "atRisk" | "positive" | "all"`. Each tab reads and writes only its own slice. This replaces the current flat `filter`, `search`, `sortBy` state.

---

## 5. Quick Actions (Detail Panel)

All four actions use existing API integrations — no new endpoints needed. `saveSession(result.nextSession)` is called after each action result as per existing pattern (the `withAuthorizedSession` wrapper may or may not populate `nextSession`; the call is a no-op if it does not).

| Button | API Call | Type | Priority |
|--------|----------|------|----------|
| Send client update | `createStaffInterventionWithRefresh` | `CLIENT_UPDATE` | `MEDIUM` |
| Schedule check-in call | `createStaffInterventionWithRefresh` | `SCHEDULE_CALL` | `MEDIUM` |
| Flag for admin review | `createStaffInterventionWithRefresh` | `ADMIN_FLAG` | `HIGH` |
| Message client | Opens inline modal → `createStaffClientMessageWithRefresh` | — | — |

Action states: idle → loading (disabled, "Processing…") → done ("Done ✓", 3s auto-reset) → idle. Error message shown below action list, cleared on next action. All four share `actionLoading: string | null` / `actionDone: string | null` / `actionError: string | null` state keyed by button label.

Message client modal: subject field + body textarea + Send button. Reuses existing `showMsgModal` / `msgSubject` / `msgBody` / `msgSending` / `msgToast` state pattern.

---

## 6. Data Flow

No changes to the data layer. The page continues to:

1. Call `getStaffAllHealthScores(session)` on mount and on refresh
2. Save refreshed session via `saveSession(result.nextSession)`
3. Derive all computed values (avg, atRiskCount, trendCounts, tier counts, signal totals) from the returned `StaffHealthScoreEntry[]` array
4. Apply per-tab filtering and search/sort in `useMemo` using the `tabFilters` state map

---

## 7. Empty & Loading States

- **Loading**: skeleton blocks for KPI strip + tab body (existing skeleton classes)
- **Error**: `emptyState` block with error message
- **No clients**: empty state "No health data yet" with descriptor
- **No matches (search/filter on All Clients tab)**: "No clients match filters" with reset link
- **Detail panel unselected**: centered empty state "Select a client to view details"
- **No signals on selected client**: "No signals recorded yet."
- **No at-risk clients (overview right panel)**: "All clients are in healthy range ✓"
- **At Risk tab with no at-risk clients**: empty state "No at-risk clients right now"

---

## 8. CSS

### Files to modify
- `apps/web/src/app/style/staff/pages-b.module.css` — replace all existing `ch*` layout classes with new classes below. Dynamic classes listed under "Retain" must not be renamed.

### New classes to define

| Group | Classes |
|-------|---------|
| Page layout | `chTabBar`, `chTabBarRow`, `chTab`, `chTabActive`, `chTabBadge`, `chTabBody`, `chTabContent`, `chTabDetail` |
| KPI strip | `chKpiStrip`, `chKpiCard`, `chKpiCardAccent`, `chKpiCardRed`, `chKpiCardGreen`, `chKpiCardPurple`, `chKpiVal`, `chKpiMeta` |
| Overview panels | `chOverviewGrid`, `chOvPanel`, `chTierRow`, `chTierBox`, `chTierBoxGreen`, `chTierBoxAmber`, `chTierBoxRed`, `chSparkline`, `chSpBar`, `chAttentionList`, `chAttentionItem`, `chAttentionItemSelected` |
| Table | `chTable`, `chTableRowSelected`, `chScoreBarCell`, `chScoreBarWrap`, `chScoreBarTrack`, `chScoreBarFillGreen`, `chScoreBarFillAmber`, `chScoreBarFillRed` |
| Detail panel | `chDpShell`, `chDpHeader`, `chDpScoreRow`, `chDpScoreRing`, `chDpScoreRingNum`, `chDpMetrics`, `chDpMetric`, `chDpMetricLabel`, `chDpMetricVal`, `chDpRiskBanner`, `chDpSignalList`, `chDpSignalRow`, `chDpSignalDot`, `chDpRetainerBar`, `chDpEmpty` |
| Filter bar | `chFilterBar` (new, replaces `chToolbarBar`) |

### Classes accessible via existing style spread (no CSS additions needed)
The style utility at `apps/web/src/components/staff/staff-dashboard/style.ts` already includes all staff CSS files. These classes are available via `cx()` without adding CSS:
`staffClientAvatar`, `staffSegBtn`, `staffSegBtnActive`, `staffFilterInput`, `chSortPill`, `chSortPillActive`, `chSortPillIdle`, `chSortGroup`, `chSortLabel`, `modalBackdrop`, `modal`, `modalHeader`, `modalTitle`, `modalClose`, `modalBody`, `staffToast`, `staffToastSuccess`, `staffToastError`, `emptyState`, `emptyStateTitle`, `emptyStateSub`, `emptyStateIcon`, `skeletonBlock`

### Retain — NEVER rename
`chSentPositive`, `chSentNeutral`, `chSentRisk`, `chSignalPositive`, `chSignalNeutral`, `chSignalNegative`, `badgeGreen`, `badgeRed`, `badgeAmber`, `badgePurple`, `badgeMuted`, `badgeAccent`

---

## 9. Files to Change

| File | Change |
|------|--------|
| `apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx` | Full rewrite of JSX. State: add `tabFilters` Record map, replace flat filter/search/sortBy. Retain all action state, modal state, and API call logic. |
| `apps/web/src/app/style/staff/pages-b.module.css` | Add new `ch*` classes listed above. Remove old layout classes that are no longer referenced. |

No changes to: `clients.ts`, `interventions.ts`, `messaging.ts`, `staff-analytics.ts`, gateway controller, topbar component, shared CSS files.

---

## 10. Out of Scope

- Recording new health signals or scores (view + action only)
- Historical per-client score chart
- Bulk actions across multiple clients
- `client-health-summary-page.tsx` (separate page, not touched)
- Days-remaining estimate on retainer (field not available in API response)
