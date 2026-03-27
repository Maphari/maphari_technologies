# Time Log Page Redesign — Design Spec

## Goal

Redesign the staff Time Log page so the live timer is the undisputed hero of the page. Shift from the current flat layout (timer strip, chart, stats, entries all at the same visual weight) to a sticky-timer + scrollable-content model that keeps clock controls visible at all times.

---

## Design Decisions

### Primary use-case
Staff open Time Log primarily to **start or check the running timer**. Every layout decision follows from this.

### Layout: Sticky Focus Strip
- A **sticky timer shell** (`tlv2StickyShell`) is pinned just below the page header. It never leaves the viewport while scrolling.
- The shell is full-bleed with an opaque background — it covers scrolling content cleanly.
- Inside the shell sits the **timer card** (`tlv2Strip`), which is the visually rounded card.
- All other content (chart, breakdown, entries) scrolls underneath the sticky shell.

### Content below the strip (two-column)
- **Main column** (wider): weekly bar chart → log entries list.
- **Side column** (fixed 280 px): week progress card → project breakdown card.
- `tlv2ContentGrid` changes from `1fr 1fr` to `1fr 280px`.

### Colors
Strict use of the staff design token palette (all tokens already defined in `core.module.css`):

| Token | Value | Used for |
|-------|-------|----------|
| `--bg` | `#04040a` | Page background, sticky shell background |
| `--accent` | `#f97316` | Timer clock, running card border, pulse dot, active pills, progress fill, today bar |
| `--accent-d` | `rgba(249,115,22,0.14)` | Running card border, Pause + Submit button fill |
| `--accent-g` | `rgba(249,115,22,0.07)` | Running card background |
| `--green` | `#22c55e` | Submitted week button border |
| `--green-d` | `rgba(34,197,94,0.12)` | Submitted week button background |
| `--text` | `#ede9e3` | Primary text |
| `--muted` | `rgba(237,233,227,0.50)` | Secondary labels |
| `--muted2` | `rgba(237,233,227,0.28)` | Tertiary / disabled |
| `--s1` – `--s4` | glass surfaces | Card backgrounds |
| `--b1` – `--b3` | glass borders | Card borders, dividers |
| `--blue` `--amber` `--purple` `--green` | semantic | Per-project entry dots + duration text |

---

## Components

### 1. Page Header

- Title: "Time Log" · sub-label: "Week N · date range" from `currentWeek`
- Right side: Export CSV · Export JSON · Submit Week
- Export buttons: ghost style (`--s1` background, `--b2` border, `--muted` text)
- Submit Week button states:
  - Default: `--accent-d` fill + `--accent` border, label "Submit Week →"
  - Submitting (`submittingWeek`): same style, label "Submitting…", disabled
  - Submitted (`weekAlreadySubmitted`): `--green-d` fill + `--green` border, label "Submitted", disabled
- All buttons: `display: flex; align-items: center; justify-content: center`
- `AutomationBanner` (when `todayMinutes === 0 && !timerRunning && !!onQuickLog8h`) renders **between the page header and the sticky shell**, outside the sticky shell so it scrolls away normally.

### 2. Sticky Timer Shell + Card

**Shell** (`tlv2StickyShell`):
```css
.tlv2StickyShell {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg);
  padding: 14px 0;
  border-bottom: 1px solid var(--b1);
}
```

**Timer card** (`tlv2Strip`) inside the shell — retains `border-radius: var(--r-sm)`:

The existing `tlv2StripLeft / tlv2StripCenter / tlv2StripRight` flex sections are **replaced** by a single 4-column CSS grid on `tlv2Strip`:

```css
.tlv2Strip {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  border-radius: var(--r-sm);
}
```

The four grid columns are:
- **Col 1** — Pulse dot (`tlv2Pulse`)
- **Col 2** — Meta text or idle inputs
- **Col 3** — Clock display (`tlv2TimeDisplay`)
- **Col 4** — Button group (`tlv2TimerBtns`)

**Running state** (`tlv2Strip` + `tlv2StripActive`):
```css
.tlv2StripActive {
  background: var(--accent-g);
  border: 1px solid var(--accent-d);
}
```
- Col 1: `tlv2Pulse` — 10 px orange circle, `pulse-ring` keyframe glow animation, `aria-hidden="true"`
- Col 2: `tlv2StripMeta` — muted label "Running · {timerProjectName}" + bold `timerTaskName`
- Col 3: `tlv2TimeDisplay` — `26px 700 var(--accent) tabular-nums`
- Col 4: Pause button (`tlv2PlayBtn tlv2PlayBtnRunning`) + Stop button (`tlv2StopBtn`)

**Idle state** (`tlv2Strip` + `tlv2StripIdle`):
```css
.tlv2StripIdle {
  background: var(--s1);
  border: 1px solid var(--b2);
}
```
- Col 1: `tlv2Pulse tlv2PulseOff` — dim dot, no animation
- Col 2: `tlv2StripInputs` — project `<select>` (`tlv2ProjectSelect`) + task `<input>` (`tlv2TaskInput`) side by side
- Col 3: `tlv2TimeDisplay` — "00:00:00" in `--muted2`, `20px`
- Col 4: Start button (`tlv2PlayBtn tlv2PlayBtnIdle`) — solid `--accent` background, white text

> **Note:** There is no "Paused" state — `timerRunning: boolean` is the only timer state prop. When the user clicks Pause, `onTimerToggle()` is called and `timerRunning` becomes `false`, which renders the idle card with the accumulated time shown in the clock via `timerDisplay`. No `tlv2StripPaused` class is needed.

### 3. Weekly Bar Chart Card

**Classes:** `tlv2ChartCard` (new), `tlv2ChartHead`, `tlv2WeekBadge`, `tlv2ChartArea`, `tlv2BarCol`, `tlv2BarValue`, `tlv2Bar`, `tlv2BarToday`, `tlv2BarBase`, `tlv2BarLabel`, `tlv2BarLabelToday`

> Class names match existing ones in `pages-a.module.css` — no rename needed.

- Header: "This Week" label + `tlv2WeekBadge` showing `{(weekMinutes/60).toFixed(1)}h · {pct}% of target`
- 5 columns from `weekData.days`, each with `weekData.dailyMinutes[i]`
- Bar height: `(dailyMinutes[i] / weekMax) * 100%` (min 4 px)
- Today bar: `tlv2BarToday` — `--accent` fill
- Past bars: `tlv2BarBase` — `rgba(255,255,255,0.09)` (**update** existing `--blue` fill → white tint)
- Value label above bar: `tlv2BarValue` — `--muted2`; today: `tlv2BarValue tlv2BarValToday` — `--accent`
- Day label below bar: `tlv2BarLabel` — `--muted2`; today: `tlv2BarLabelToday` — `--accent`, `font-weight: 600`

### 4. Log Entries Card

**Classes:** `tlv2EntriesCard` (new), `tlv2EntriesBar`, `tlv2FilterPills`, `tlv2FilterPill`, `tlv2FilterPillActive`, `tlv2FilterPillIdle`, `tlv2SearchWrap`, `tlv2SearchIco`, `tlv2SearchInput`, `tlv2EntryList`, `tlv2EntryRow`, `tlv2EntryDot`, `tlv2EntryInfo`, `tlv2EntryProject`, `tlv2EntryTask`, `tlv2EntryDate`, `tlv2EntryDur`

Filter pills:
- `.tlv2FilterPillActive` **updated** to: `--accent-d` background, `1px solid rgba(249,115,22,0.28)` border, `--accent` color
- `.tlv2FilterPillIdle`: transparent background, `--b2` border, `--muted` color

Search input:
- `aria-label="Search entries by project or task"` — no placeholder label conflict; keep `placeholder="Search…"`

Filter pill container:
- `role="tablist"` on the wrapping div
- Each pill: `role="tab"` + `aria-selected={filter === pill.value}`

Entry rows — 4-column grid: `8px 1fr auto auto`:
- `tlv2EntryDot`: 6 px circle, color assigned by index rotation (see below)
- `tlv2EntryProject`: `12px 600 --text` (project name)
- `tlv2EntryTask`: `11px --muted2` (task label)
- `tlv2EntryDate`: `10px --muted2` (formatted date)
- `tlv2EntryDur`: `12px 600`, same color as dot
- Row hover: `rgba(255,255,255,0.04)` background

**Entry color rotation** — the component **ignores `entry.color`** from the hook and overrides with index-based rotation in the JSX. `entry.color` becomes unused but is not removed from the type (no type change needed):
```tsx
const ENTRY_TONES = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--green)"];
// usage: style={{ background: ENTRY_TONES[index % ENTRY_TONES.length] }}
```

### 5. Week Progress Card (side column)

**New card. All classes are new.**

```
tlv2WeekCard        — card wrapper
tlv2WeekCardHead    — card header (reuses tlv2CardHead pattern)
tlv2WeekProgress    — inner padding container
tlv2WeekNums        — flex row: logged + target
tlv2WeekLogged      — "26h logged" large text (22px 700 --text)
tlv2WeekTarget      — "/ 40h target" (12px --muted2)
tlv2WeekTrack       — 5px progress track (--s3 background)
tlv2WeekFill        — fill bar (--accent, width = pct%)
tlv2WeekDays        — M T W T F day row
tlv2WeekDay         — individual day label (10px --muted2)
tlv2WeekDayDone     — completed day (rgba(249,115,22,0.55))
tlv2WeekDayToday    — current day (--accent, font-weight 600)
tlv2WeekStats       — two-stat row below track
tlv2WeekStat        — individual stat cell
tlv2WeekStatVal     — stat value (18px 700)
tlv2WeekStatValAccent — today's hours value (--accent)
tlv2WeekStatLbl     — stat label (10px --muted2)
```

Data bindings:
- `weekLogged`: `(weekMinutes / 60).toFixed(1)` + "h"
- `weekTarget`: `weeklyTargetHours` prop
- `weekFill` width: `Math.min(100, Math.round(weekMinutes / (weeklyTargetHours * 60) * 100))` + "%"
- `weekDays`: from `weekData.days` — a day is "done" if its index < today's weekday index; "today" if equal
- `today stat`: `(todayMinutes / 60).toFixed(1)` + "h"
- `remaining stat`: `Math.max(0, weeklyTargetHours - weekMinutes / 60).toFixed(1)` + "h"

### 6. Project Breakdown Card (side column)

**Classes** (existing, no changes needed): `tlv2Breakdown`, `tlv2BrkRow`, `tlv2BrkName`, `tlv2BrkTime`, `tlv2BrkPct`, `tlv2BrkFill`, `tlv2ToneAccent`, `tlv2ToneBlue`, `tlv2ToneAmber`, `tlv2TonePurple`

- Up to 4 projects from `projectTimeBreakdown` prop
- Bar fill colors: index 0 → `tlv2ToneAccent`, 1 → `tlv2ToneBlue`, 2 → `tlv2ToneAmber`, 3 → `tlv2TonePurple`
- Any remainder not shown in top 4 is not displayed (current behaviour kept)

---

## Content Grid

```css
/* replaces existing tlv2ContentGrid definition */
.tlv2ContentGrid {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 16px;
  margin-top: 20px;
}

/* new classes for the two column containers */
.tlv2MainCol { display: flex; flex-direction: column; gap: 16px; }
.tlv2SideCol { display: flex; flex-direction: column; gap: 16px; }

/* mobile */
@media (max-width: 900px) {
  .tlv2ContentGrid { grid-template-columns: 1fr; }
}
```

---

## Mobile (≤ 900 px)

- `tlv2ContentGrid` → `1fr` (single column, side cards stack below main)
- `tlv2StickyShell` stays sticky
- `tlv2Strip` grid collapses: `grid-template-columns: auto 1fr auto` (clock moves into meta column on very small screens if needed)
- Project select + task input remain visible (fixes the current `tlv2StripCenter { display: none }` bug)
- No content is hidden — everything stacks

---

## Files

| File | What changes |
|------|-------------|
| `apps/web/src/app/style/staff/pages-a.module.css` | (1) Add `tlv2StickyShell`. (2) Replace `tlv2Strip` flex sections with 4-col grid; **delete** `.tlv2StripLeft`, `.tlv2StripCenter`, `.tlv2StripRight` definitions. (3) Update `tlv2StripActive` to use `var(--accent-g)` background + `var(--accent-d)` border. (4) Update `tlv2BarBase` fill from `var(--blue)` to `rgba(255,255,255,0.09)`. (5) Update `tlv2FilterPillActive` to `--accent-d` background + `--accent` border + `--accent` text. (6) Update `tlv2ContentGrid` to `grid-template-columns: 1fr 280px`. (7) Add `tlv2MainCol`, `tlv2SideCol`. (8) Add all `tlv2WeekCard*` classes. (9) Add `tlv2ChartCard`, `tlv2EntriesCard`, `tlv2WeekBadge`, `tlv2ChartHead`. (10) Fix mobile: remove `tlv2StripCenter { display: none }`; add `tlv2ContentGrid` single-column override. (11) Update `tlv2SubmitWeekBtnIdle` from solid `--accent` fill to `--accent-d` fill + `--accent` border + `--accent` text. |
| `apps/web/src/components/staff/staff-dashboard/pages/time-log-page.tsx` | (1) Wrap strip in `tlv2StickyShell`. (2) Replace `StripLeft/Center/Right` JSX with 4-col grid children. (3) Add Week Progress Card JSX. (4) Replace `tlv2StatGrid` with `tlv2WeekCard` in side column. (5) Add entry color rotation. (6) Add aria attributes to search + filter pills. (7) Update Submit Week button states. (8) Keep `AutomationBanner` above the sticky shell. |

No hook changes. No new props. No API changes.

---

## Constraints

- All 26 existing props are used; none are removed or renamed.
- `entry.color` field is ignored in the JSX (overridden by index rotation) but the `TimeEntrySummary` type is unchanged.
- No inline styles in the final component — use CSS module classes for all styling.
- The `tlv2StatGrid` (4-stat row) is **removed** from the layout; its data is absorbed into the new Week Progress Card (`tlv2WeekCard`).
