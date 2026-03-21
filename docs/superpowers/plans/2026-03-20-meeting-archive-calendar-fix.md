# Meeting Archive Calendar Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the completely broken calendar grid on the Meeting Intelligence Hub page by adding the missing CSS classes that the component already references but that were never defined in any stylesheet.

**Architecture:** The meeting-archive-page component references six CSS class names (`calGrid`, `calWeekHd`, `calDayCell`, `calDayCellToday`, `calDayCellEmpty`, `calDayCellSelected`) that do not exist in any of the 7 client CSS modules. CSS modules are spread into the `styles` object in `style.ts` (core → pagesA–D → pagesHome → pagesMisc → shared). The new classes will be added to `core.module.css` alongside the existing (orphaned) old `calendarGrid` classes. No component changes needed — the CSS is all that's missing.

**Tech Stack:** Next.js 16, CSS Modules, TypeScript.

---

## File Map

| File | Change |
|------|--------|
| `apps/web/src/app/style/client/core.module.css` | Add missing calendar CSS classes; remove orphaned old ones |

---

## Task 1: Add Missing Calendar CSS Classes

**Files:**
- Modify: `apps/web/src/app/style/client/core.module.css`

**Context:** The component `meeting-archive-page.tsx` uses these classes (lines 475, 481, 492):
- `calWeekHd` — the 7-column header row showing "Sun Mon Tue Wed Thu Fri Sat"
- `calGrid` — the 7-column grid holding all day cells
- `calDayCell` — individual day cell
- `calDayCellToday` — today modifier
- `calDayCellEmpty` — empty/padding cell (before month starts)
- `calDayCellSelected` — clicked day that has meetings

Design tokens available on `.clientRoot`:
- `--s1` (#0d0d14 background), `--s2` (#13131e hover), `--s3` (#171726 selected)
- `--b2` (rgba 12% border), `--b3` (rgba 16%)
- `--lime` (#c8f135 accent), `--lime-d` (16% lime fill), `--lime-g` (8% lime glow)
- `--r-xs` (6px radius)

- [ ] **Step 1: Find and read the existing orphaned calendar block in `core.module.css`**

  ```bash
  grep -n "calendarGrid\|calendarDay\|Calendar\|calendar" apps/web/src/app/style/client/core.module.css
  ```

  You should see the old `.calendarGrid`, `.calendarDay`, `.calendarDayActive`, `.calendarDayToday` classes that are not used anywhere.

- [ ] **Step 2: Verify the old classes are truly unused**

  ```bash
  grep -rn "calendarGrid\|calendarDay\|calendarDayActive\|calendarDayToday" apps/web/src/components/ | head -5
  ```

  Expected: no output (zero matches). If there are matches, do NOT remove the old classes yet.

- [ ] **Step 3: Replace the orphaned block with the correct calendar CSS**

  Find the `/* ─── Calendar ─────` block in `core.module.css` (lines ~72–101). Replace the entire block with:

  ```css
  /* ─── Calendar ──────────────────────────────────────────────────────── */

  .calWeekHd {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: 4px;
  }

  .calGrid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  .calDayCell {
    min-height: 38px;
    padding: 5px 4px;
    border-radius: var(--r-xs);
    transition: background 0.12s ease;
    position: relative;
  }

  .calDayCell:hover {
    background: var(--s2);
  }

  .calDayCellEmpty {
    pointer-events: none;
    opacity: 0;
  }

  .calDayCellToday {
    border: 1px solid var(--lime);
  }

  .calDayCellSelected {
    background: var(--lime-d);
  }

  .calDayCellSelected:hover {
    background: var(--lime-d);
  }
  ```

- [ ] **Step 4: Verify TypeScript and CSS compile**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

  Expected: no output.

- [ ] **Step 5: Verify the classes appear in the compiled module**

  ```bash
  grep -n "calGrid\|calWeekHd\|calDayCell" apps/web/src/app/style/client/core.module.css
  ```

  Expected: all 6 class names present.

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/app/style/client/core.module.css
  git commit -m "fix(client): add missing calGrid/calWeekHd/calDayCell CSS — meeting archive calendar was completely broken"
  ```

---

## Final Verification

- [ ] Open `localhost:3000/client` → navigate to Meeting Archive
- [ ] Calendar shows 7 columns with Sun/Mon/Tue/Wed/Thu/Fri/Sat header across the top (not stacked)
- [ ] Day cells are arranged in a proper monthly grid
- [ ] Today's date has a lime border
- [ ] Empty cells before month starts are invisible
- [ ] Clicking a day with meetings highlights it
