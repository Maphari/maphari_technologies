# Time Log Page Redesign — Design Spec

## Goal

Redesign the staff Time Log page so the live timer is the undisputed hero of the page. Shift from the current flat layout (timer strip, chart, stats, entries all at the same visual weight) to a sticky-timer + scrollable-content model that keeps clock controls visible at all times.

---

## Design Decisions

### Primary use-case
Staff open Time Log primarily to **start or check the running timer**. Every layout decision follows from this.

### Layout: Sticky Focus Strip
- A **sticky timer card** is pinned just below the page header. It never leaves the viewport while scrolling.
- All other content (chart, breakdown, entries) scrolls underneath it.
- Running state: orange pulse dot · project + task label · elapsed clock · Pause + Stop buttons.
- Idle state: project select · task input · Start button.

### Content below the strip (two-column)
- **Main column** (wider): weekly bar chart → log entries list.
- **Side column** (280 px): week progress card → project breakdown card.

### Colors
Strict use of the staff design token palette:

| Token | Value | Used for |
|-------|-------|----------|
| `--bg` | `#04040a` | Page background |
| `--accent` | `#f97316` | Timer clock, running card border, pulse dot, active pills, progress fill, today bar |
| `--accent-d` | `rgba(249,115,22,0.14)` | Running card background, Pause + Submit button fill |
| `--text` | `#ede9e3` | Primary text |
| `--muted` | `rgba(237,233,227,0.50)` | Secondary labels |
| `--muted2` | `rgba(237,233,227,0.28)` | Tertiary / disabled |
| `--s1` – `--s4` | glass surfaces | Card backgrounds |
| `--b1` – `--b3` | glass borders | Card borders, dividers |
| `--blue` `--amber` `--purple` `--green` | semantic | Per-project entry dots + duration text |

---

## Components

### 1. Page Header (unchanged structure, new button styles)
- Title: "Time Log" · sub-label: "Week N · date range"
- Right side: Export CSV button · Export JSON button · Submit Week button
- Submit Week uses `--accent-d` fill + `--accent` border (matches running card style)
- All buttons: `display:flex; align-items:center; justify-content:center` (no misaligned text)

### 2. Sticky Timer Strip

**Container:**
- `position: sticky; top: 0; z-index: 10`
- Background: `--bg` (opaque — covers scrolling content cleanly)
- Bottom border: `1px solid var(--b1)`
- Padding: `14px 0`

**Running card** (`tlv2Strip` + `tlv2StripActive`):
- Background: `rgba(249,115,22,0.06)` · Border: `rgba(249,115,22,0.22)`
- Border-radius: `var(--r-sm)` (12 px)
- Grid: `auto 1fr auto auto` · gap: 20 px · align-items: center
- Col 1 — **Pulse dot**: 10 px circle, `--accent`, keyframe `pulse-ring` glow animation
- Col 2 — **Meta**: muted label ("Running · {projectName}") + bold context line ({taskLabel})
- Col 3 — **Clock**: `font-size: 26px; font-weight: 700; color: var(--accent); font-variant-numeric: tabular-nums`
- Col 4 — **Buttons**: Pause (accent ghost) + Stop (neutral icon square)

**Idle card** (`tlv2Strip` + `tlv2StripIdle`):
- Background: `var(--s1)` · Border: `var(--b2)`
- Col 1 — Dim dot (no animation)
- Col 2 — Project `<select>` + task `<input>` inline
- Col 3 — Clock: `00:00:00` in `--muted2`
- Col 4 — Start button: solid `--accent` background, white text, `font-weight: 700`

### 3. Weekly Bar Chart Card

- Header: "This Week" label + badge showing `{weekHours}h · {pct}% of target`
- 5 bars (M–F), height proportional to `dailyMinutes / weekMax`
- Today's bar: `--accent` fill; past days: `rgba(255,255,255,0.09)`
- Value label above each bar; day label below
- Today's labels use `--accent`

### 4. Log Entries Card

- Sub-header bar: filter pills (All / Today / Last 7 Days) + search input
- Active pill: `--accent-d` fill + `--accent` border + `--accent` text
- Idle pill: transparent + `--b2` border + `--muted` text
- Each entry row: 4-column grid — color dot · info · date · duration
- **Color dot** (6 px circle): rotated through `--accent → --blue → --amber → --purple → --green` by entry index
- **Duration text**: same color as dot
- Row hover: `rgba(255,255,255,0.04)` background

### 5. Week Progress Card (side column)

- Large logged hours + "/ {target}h target" sub-label
- 5 px progress track: `--accent` fill at `(weekMinutes / weekTargetMinutes * 100)%`
- Day row: M T W T F — done days in faded orange, today in full `--accent`
- Two stats below track: Today hours (in `--accent`) + Remaining hours

### 6. Project Breakdown Card (side column)

- List of up to 4 projects
- Each row: project name · "{Xh Ym} · {pct}%" · thin progress bar
- Bar colors follow the same rotation as entry dots: accent → blue → amber → purple
- Remaining time grouped as "Other" in `rgba(255,255,255,0.18)`

---

## Behaviour

### Timer states
| State | Card style | Clock | Buttons |
|-------|-----------|-------|---------|
| Idle | Neutral (`--s1`) | `00:00:00` dim | Start (solid orange) |
| Running | Orange glow | Elapsed in orange | Pause + Stop |
| Paused | Neutral (`--s1`) | Paused time in muted | Resume + Stop |

### Submit Week button
- Disabled when `weekAlreadySubmitted === true` or `submittingWeek === true`
- Label: "Submit Week →" → "Submitting…" during call → "Submitted ✓" when done
- Submitted state: green tint (`--green-d` fill, `--green` border)

### Entry color rotation
```ts
const ENTRY_TONES = ["--accent", "--blue", "--amber", "--purple", "--green"];
// assign by: ENTRY_TONES[index % ENTRY_TONES.length]
```
Replaces the current hardcoded `color: "var(--accent)"` on all entries.

### Accessibility
- Search input: `aria-label="Search entries by project or task"`
- Filter pills: `role="tablist"` on container, `role="tab"` + `aria-selected` on each pill
- Timer buttons retain existing `aria-label` attributes
- Pulse dot: `aria-hidden="true"`

---

## Files

| File | What changes |
|------|-------------|
| `apps/web/src/components/staff/staff-dashboard/pages/time-log-page.tsx` | New JSX structure: sticky strip + two-column grid. Entry color rotation. Aria improvements. Submit button states. |
| `apps/web/src/app/style/staff/pages-a.module.css` | Replace all `tlv2*` CSS rules with new design. Class names stay the same where reused; new classes added for sticky strip, two-column grid, week progress card. |

No hook changes. No API changes. No new props — all existing props cover the new design.

---

## Constraints

- Keep all existing prop names and types — the hook (`use-staff-timer.ts`) and dashboard parent do not change.
- Keep all existing `tlv2*` class name references that are still used; add new classes for new elements.
- No inline styles in the final component (all via CSS module classes).
- Mobile (≤900 px): single column; timer strip stays sticky; selects stay visible (not hidden like the current bug).
