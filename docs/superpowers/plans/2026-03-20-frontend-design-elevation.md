# Frontend Design Elevation — All 3 Dashboards

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the visual design of all three dashboards (client, staff, admin) from functional-but-flat to precision-industrial — meticulous data presentation, strong typographic hierarchy, atmospheric card surfaces, and cohesive micro-detail across every component.

**Architecture:** No new pages, no new routes, no backend changes. All work is CSS + JSX. Each dashboard has its own CSS modules (client: 7 files under `apps/web/src/app/style/client/`; staff: `maphari-staff-dashboard.module.css`; admin: 7 files under `apps/web/src/app/style/admin/`). The shared `rdStudio*` class library already provides consistent card borders, label sizing, and metric fonts — elevation means building on top of this. Design aesthetic: **Precision Industrial** — dark substrate (#0d0d14), neon-sharp accent stripe (lime for client, teal for staff, purple for admin), tabular-number metrics, DM Mono for all data labels.

**Tech Stack:** Next.js 16, React, CSS Modules, CSS custom properties.

---

## Design Token Reference (DO NOT CHANGE THESE)

| Token | Value | Use |
|-------|-------|-----|
| `--s1` | #0d0d14 | Default background |
| `--s2` | #13131e | Hover / elevated surface |
| `--s3` | #171726 | Input / deepest surface |
| `--b1` | rgba(255,255,255,0.07) | Dividers |
| `--b2` | rgba(255,255,255,0.12) | Card borders |
| `--b3` | rgba(255,255,255,0.16) | Focus/hover borders |
| `--lime` | #c8f135 | Client accent |
| `--lime-d` | 16% lime fill | Client selected/hover |
| `--accent` | dashboard-specific | Admin=#8b6fff, Staff=#24b8a8, Client=#c8f135 |
| `--font-syne` | Syne | Headings, display |
| `--font-dm-mono` | DM Mono | All data labels, metrics |

---

## File Map

| File | Change |
|------|--------|
| `apps/web/src/app/style/client/core.module.css` | Add missing calGrid CSS (Task 1); Hero stat card glassmorphism (Task 2) |
| `apps/web/src/app/style/client/pages-misc.module.css` | Meeting Intelligence Hub redesign CSS (Task 3) |
| `apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx` | Meeting archive UI improvements (Task 3) |
| `apps/web/src/components/client/maphari-dashboard/pages/meeting-booker-page.tsx` | Meeting booker visual redesign (Task 4) |
| `apps/web/src/app/style/shared/maphari-dashboard-shared.module.css` | Shared elevation classes (emptyStateGlow, kpiGlow, accentGradient, etc.) (Task 5) |
| `apps/web/src/app/style/admin/core.module.css` | Admin KPI card elevation (Task 6) |
| `apps/web/src/app/style/staff/maphari-staff-dashboard.module.css` | Staff hero card elevation (Task 7) |
| `apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx` | Admin KPI visual improvements (Task 6) |
| `apps/web/src/components/staff/staff-dashboard/pages/dashboard-page.tsx` | Staff home visual improvements (Task 7) |

---

## Task 1: Fix Meeting Archive Calendar — Add Missing CSS Classes

**Files:**
- Modify: `apps/web/src/app/style/client/core.module.css`

**Context:** This is the critical bug from the screenshot. The component references `calGrid`, `calWeekHd`, `calDayCell`, `calDayCellToday`, `calDayCellEmpty`, `calDayCellSelected` — none exist in any CSS file. Old orphaned classes `calendarGrid`, `calendarDay` etc. exist but are unused (verify before removing).

- [ ] **Step 1: Verify old classes are unused**

  ```bash
  grep -rn "calendarGrid\|calendarDay\|calendarDayActive\|calendarDayToday" apps/web/src/components/ | head -5
  ```
  Expected: zero results. If any results, DO NOT remove the old classes.

- [ ] **Step 2: Find the orphaned calendar block in `core.module.css`**

  ```bash
  grep -n "calendarGrid\|Calendar\|calendar" apps/web/src/app/style/client/core.module.css
  ```

- [ ] **Step 3: Replace the orphaned block with working calendar CSS**

  Find the `/* ─── Calendar ─────` comment block (around lines 72–101). Replace the ENTIRE block:

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
    min-height: 40px;
    padding: 5px 4px;
    border-radius: var(--r-xs);
    transition: background 0.12s ease;
    cursor: default;
  }

  .calDayCellEmpty {
    pointer-events: none;
    visibility: hidden;
  }

  .calDayCell:not(.calDayCellEmpty):hover {
    background: var(--s2);
  }

  .calDayCellToday {
    outline: 1px solid var(--lime);
    outline-offset: -1px;
    border-radius: var(--r-xs);
  }

  .calDayCellSelected {
    background: var(--lime-d) !important;
  }
  ```

- [ ] **Step 4: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no output.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/app/style/client/core.module.css
  git commit -m "fix(client): add missing calGrid/calWeekHd/calDayCell CSS — meeting archive calendar was completely broken"
  ```

---

## Task 2: Elevate Meeting Booker Page — Visual Redesign

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/meeting-booker-page.tsx`
- Modify: `apps/web/src/app/style/client/core.module.css` (add new meeting booker CSS)

**Context:** The current meeting booker looks flat and generic. The redesign should use the established design system while adding:
- Better time slot picker (pill buttons with accent when selected)
- Glassmorphism accent glow on the hero form card
- Numbered step indicator above the form (Step 1: Type → Step 2: Date → Step 3: Confirm)
- Better upcoming meetings list with accent left-border

- [ ] **Step 1: Read the current meeting-booker-page.tsx structure**

  ```bash
  cat -n apps/web/src/components/client/maphari-dashboard/pages/meeting-booker-page.tsx
  ```

- [ ] **Step 2: Add CSS for the new meeting booker components**

  Append to `apps/web/src/app/style/client/core.module.css`:

  ```css
  /* ─── Meeting Booker ─────────────────────────────────────────────── */

  .mbFormCard {
    position: relative;
    overflow: hidden;
    background: var(--s1);
    border: 1px solid var(--b2);
    border-radius: var(--r-lg);
    padding: 24px;
  }

  .mbFormCard::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% -10%, var(--lime-g), transparent);
    pointer-events: none;
  }

  .mbStepRow {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 24px;
  }

  .mbStep {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted);
    flex: 1;
  }

  .mbStepNum {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1px solid var(--b3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.55rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .mbStepActive {
    color: var(--lime);
  }

  .mbStepActive .mbStepNum {
    background: var(--lime-d);
    border-color: var(--lime);
    color: var(--lime);
  }

  .mbStepConnector {
    flex: 1;
    height: 1px;
    background: var(--b2);
    margin: 0 8px;
  }

  .mbSlotGrid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-top: 8px;
  }

  .mbSlotBtn {
    padding: 8px 4px;
    border: 1px solid var(--b2);
    border-radius: var(--r-sm);
    background: var(--s2);
    color: var(--text);
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.65rem;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
  }

  .mbSlotBtn:hover {
    border-color: var(--b3);
    background: var(--s3);
  }

  .mbSlotBtnSelected {
    border-color: var(--lime);
    background: var(--lime-d);
    color: var(--lime);
  }

  .mbMeetingRow {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--b1);
  }

  .mbMeetingRow:last-child {
    border-bottom: none;
  }

  .mbMeetingDot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--lime);
    flex-shrink: 0;
  }

  .mbMeetingMeta {
    flex: 1;
    min-width: 0;
  }

  .mbMeetingTitle {
    font-family: var(--font-syne), sans-serif;
    font-weight: 600;
    font-size: 0.75rem;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mbMeetingDate {
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.58rem;
    color: var(--muted);
  }

  .mbEmptySlate {
    padding: 32px 24px;
    text-align: center;
    color: var(--muted);
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  ```

- [ ] **Step 3: Update the meeting-booker-page.tsx to use new classes**

  Read the current file structure. Apply these changes:

  **3a.** Replace the outer left card `<div className={cx("card", "p20")}>` with:
  ```tsx
  <div className={cx("mbFormCard")}>
  ```

  **3b.** Add a step indicator above the form fields (after the opening `mbFormCard` div):
  ```tsx
  <div className={cx("mbStepRow")}>
    <div className={cx("mbStep", "mbStepActive")}>
      <span className={cx("mbStepNum")}>1</span>
      Type
    </div>
    <div className={cx("mbStepConnector")} />
    <div className={cx("mbStep", date ? "mbStepActive" : "")}>
      <span className={cx("mbStepNum")}>2</span>
      Date
    </div>
    <div className={cx("mbStepConnector")} />
    <div className={cx("mbStep", selectedSlot ? "mbStepActive" : "")}>
      <span className={cx("mbStepNum")}>3</span>
      Confirm
    </div>
  </div>
  ```

  **3c.** Replace the time slot buttons grid. Find where time slots are rendered and replace with:
  ```tsx
  <div className={cx("mbSlotGrid")}>
    {TIME_SLOTS.map((slot) => (
      <button
        key={slot}
        type="button"
        className={cx("mbSlotBtn", selectedSlot === slot && "mbSlotBtnSelected")}
        onClick={() => setSelectedSlot(slot === selectedSlot ? "" : slot)}
      >
        {slot}
      </button>
    ))}
  </div>
  ```

  Where `TIME_SLOTS` = `["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]` (check what array exists in the file).

  **3d.** Replace the upcoming meetings list rows with `mbMeetingRow` styling:
  ```tsx
  {upcomingMeetings.length === 0 ? (
    <div className={cx("mbEmptySlate")}>No upcoming meetings</div>
  ) : (
    upcomingMeetings.map((m) => (
      <div key={m.id} className={cx("mbMeetingRow")}>
        <div className={cx("mbMeetingDot")} />
        <div className={cx("mbMeetingMeta")}>
          <div className={cx("mbMeetingTitle")}>{m.title}</div>
          <div className={cx("mbMeetingDate")}>{/* format date */}</div>
        </div>
        <button type="button" className={cx("btnGhost", "text11")} onClick={() => notify("info", "Contact your account manager to reschedule.")}>
          Reschedule
        </button>
      </div>
    ))
  )}
  ```

- [ ] **Step 4: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/app/style/client/core.module.css \
          apps/web/src/components/client/maphari-dashboard/pages/meeting-booker-page.tsx
  git commit -m "design(client): redesign meeting booker with step indicator, accent glow, and improved slot picker"
  ```

---

## Task 3: Redesign Meeting Archive Page — Header and KPI Cards

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx`
- Modify: `apps/web/src/app/style/client/pages-misc.module.css`

**Context:** The KPI cards on the Meeting Intelligence Hub show only "—" dashes. Even when data is present, the cards look flat. This task redesigns them into data-rich stat tiles with accent left borders and DM Mono metrics. The page hero title also needs better visual hierarchy.

- [ ] **Step 1: Read the current KPI card section**

  ```bash
  sed -n '1,50p' apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx
  grep -n "TOTAL MEETINGS\|SPRINT DEMOS\|DESIGN REVIEWS\|statCard\|kpiGrid\|rdStudio" apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx | head -20
  ```

- [ ] **Step 2: Add CSS for meeting archive KPI cards**

  Append to `apps/web/src/app/style/client/pages-misc.module.css`:

  ```css
  /* ─── Meeting Archive ─────────────────────────────────────────────── */

  .maKpiGrid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  @media (max-width: 640px) {
    .maKpiGrid { grid-template-columns: 1fr; }
  }

  .maKpiCard {
    background: var(--s1);
    border: 1px solid var(--b2);
    border-left: 3px solid var(--lime);
    border-radius: var(--r-md);
    padding: 16px 18px;
    position: relative;
    overflow: hidden;
  }

  .maKpiCard::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, var(--lime-g), transparent);
    pointer-events: none;
  }

  .maKpiLabel {
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted);
    margin-bottom: 10px;
  }

  .maKpiValue {
    font-family: var(--font-syne), sans-serif;
    font-size: 2rem;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    margin-bottom: 4px;
    color: var(--text);
  }

  .maKpiSub {
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.58rem;
    color: var(--muted);
  }

  .maKpiAccent {
    border-left-color: var(--lime);
  }

  .maKpiTeal {
    border-left-color: var(--cyan, #3dd9d6);
  }

  .maKpiPurple {
    border-left-color: var(--purple, #8b6fff);
  }

  .maArchiveRow {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 700px) {
    .maArchiveRow { grid-template-columns: 1fr; }
  }
  ```

- [ ] **Step 3: Replace the KPI cards in the JSX**

  Find the current 3-card KPI grid (showing "TOTAL MEETINGS", "SPRINT DEMOS", "DESIGN REVIEWS"). Replace with:

  ```tsx
  <div className={cx("maKpiGrid")}>
    <div className={cx("maKpiCard", "maKpiAccent")}>
      <div className={cx("maKpiLabel")}>Total Meetings</div>
      <div className={cx("maKpiValue")}>{calMeetings.length || 0}</div>
      <div className={cx("maKpiSub")}>this month</div>
    </div>
    <div className={cx("maKpiCard", "maKpiTeal")}>
      <div className={cx("maKpiLabel")}>Sprint Demos</div>
      <div className={cx("maKpiValue")}>
        {calMeetings.filter((m) => m.type === "Sprint Demo").length || 0}
      </div>
      <div className={cx("maKpiSub")}>this month</div>
    </div>
    <div className={cx("maKpiCard", "maKpiPurple")}>
      <div className={cx("maKpiLabel")}>Design Reviews</div>
      <div className={cx("maKpiValue")}>
        {calMeetings.filter((m) => m.type === "Design Review").length || 0}
      </div>
      <div className={cx("maKpiSub")}>this month</div>
    </div>
  </div>
  ```

  Note: Replace `"Sprint Demo"` and `"Design Review"` with the actual `CalMeetingType` string values — check the type definition in the file.

- [ ] **Step 4: Improve the empty state for the archive list**

  Find where the Archive List tab renders meetings. If the list is empty, show a styled empty state:
  ```tsx
  {archiveMeetings.length === 0 && (
    <div className={cx("emptyState")}>
      <div className={cx("emptyStateTitle")}>No past meetings</div>
      <div className={cx("emptyStateSub")}>Completed meetings will appear here</div>
    </div>
  )}
  ```

- [ ] **Step 5: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/app/style/client/pages-misc.module.css \
          apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx
  git commit -m "design(client): redesign meeting archive KPI cards with accent borders and real counters"
  ```

---

## Task 4: Shared Elevation — Empty States, Glow Cards, and Data Rows

**Files:**
- Modify: `apps/web/src/app/style/shared/maphari-dashboard-shared.module.css`

**Context:** The current empty states across all dashboards are bare (`emptyState` class shows centered text). Loading states lack visual interest. This task adds shared elevation utilities usable across all 3 dashboards.

- [ ] **Step 1: Find existing emptyState, kpi, and glow classes**

  ```bash
  grep -n "emptyState\|kpiGlow\|accentGlow\|glassCard\|shimmer" apps/web/src/app/style/shared/maphari-dashboard-shared.module.css | head -20
  ```

- [ ] **Step 2: Append shared elevation utilities to the shared CSS file**

  Find the end of the shared CSS file and append:

  ```css
  /* ─── Elevation Utilities (shared across all dashboards) ─────────── */

  /* Better empty states */
  .emptyStateGlow {
    text-align: center;
    padding: 40px 24px;
    position: relative;
  }

  .emptyStateGlow::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--accent-g, rgba(200,241,53,0.06)), transparent 70%);
    pointer-events: none;
  }

  .emptyStateGlowIcon {
    font-size: 1.4rem;
    opacity: 0.3;
    margin-bottom: 10px;
  }

  .emptyStateGlowTitle {
    font-family: var(--font-syne), sans-serif;
    font-weight: 700;
    font-size: 0.8rem;
    color: var(--text);
    margin-bottom: 4px;
  }

  .emptyStateGlowSub {
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
  }

  /* Glass hero card — accent glow from top */
  .glassHeroCard {
    position: relative;
    overflow: hidden;
    background: var(--s1);
    border: 1px solid var(--b2);
    border-radius: var(--r-lg);
  }

  .glassHeroCard::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: radial-gradient(ellipse 100% 100% at 50% 0%, var(--accent-g, rgba(200,241,53,0.08)), transparent);
    pointer-events: none;
  }

  /* Inline number counter with accent color */
  .accentCounter {
    font-family: var(--font-dm-mono), monospace;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    color: var(--accent);
  }

  /* Narrow data row for compact lists */
  .dataRow {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--b1);
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.65rem;
    color: var(--text);
  }

  .dataRow:last-child {
    border-bottom: none;
  }

  .dataRowLabel {
    flex: 1;
    min-width: 0;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dataRowValue {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  /* Pulsing status dot */
  .pulseDot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulseDotAnim 2s ease-in-out infinite;
  }

  @keyframes pulseDotAnim {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }
  ```

- [ ] **Step 3: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/app/style/shared/maphari-dashboard-shared.module.css
  git commit -m "design(shared): add elevation utilities — emptyStateGlow, glassHeroCard, dataRow, pulseDot"
  ```

---

## Task 5: Admin Executive Dashboard — KPI Card Elevation

**Files:**
- Modify: `apps/web/src/app/style/admin/core.module.css`
- Modify: `apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx`

**Context:** Admin accent is `#8b6fff` (purple). The `exdKpiCard` class already exists and uses `rdStudioCard` for the top border. Elevation adds: subtle gradient overlay on each card, better label/metric hierarchy, accent glow on the hero revenue card.

- [ ] **Step 1: Read existing exdKpiGrid and exdKpiCard CSS**

  ```bash
  grep -n "exdKpiGrid\|exdKpiCard\|exdAlertStrip\|exdKpi" apps/web/src/app/style/admin/pages-a.module.css | head -20
  grep -n "exdKpiGrid\|exdKpiCard" apps/web/src/app/style/admin/core.module.css | head -10
  ```

- [ ] **Step 2: Find where exdKpiCard is defined and enhance it**

  Read the current `exdKpiCard` CSS. Append these enhancement classes to `apps/web/src/app/style/admin/core.module.css`:

  ```css
  /* ─── Admin KPI Card Elevation ───────────────────────────────────── */

  .exdKpiHero {
    position: relative;
    overflow: hidden;
  }

  .exdKpiHero::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 80%;
    background: radial-gradient(ellipse 120% 80% at 20% 0%, rgba(139,111,255,0.1), transparent);
    pointer-events: none;
  }

  .exdKpiChangePos {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.58rem;
    font-weight: 600;
    color: var(--green, #34d98b);
    background: rgba(52, 217, 139, 0.1);
    padding: 2px 5px;
    border-radius: 3px;
  }

  .exdKpiChangeNeg {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.58rem;
    font-weight: 600;
    color: var(--red, #ff5f5f);
    background: rgba(255, 95, 95, 0.1);
    padding: 2px 5px;
    border-radius: 3px;
  }

  .exdAlertStripElevated {
    border-left: 3px solid var(--red, #ff5f5f);
    background: rgba(255, 95, 95, 0.06);
    border-radius: var(--r-sm);
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.65rem;
  }
  ```

- [ ] **Step 3: Apply hero class to the first (revenue) KPI card**

  In `executive-dashboard-page.tsx`, find the first `exdKpiCard` (the Monthly Revenue card). Add `exdKpiHero` class:

  ```tsx
  <div className={cx("exdKpiCard", "rdStudioCard", "exdKpiHero")}>
    {/* existing content */}
  </div>
  ```

- [ ] **Step 4: Wrap the alert strip with the elevated style**

  Find the alert strip render (shows overdue invoices). Wrap or replace with:
  ```tsx
  {overdueInvoices > 0 && (
    <div className={cx("exdAlertStripElevated")}>
      <span style={{ color: "var(--red)" }}>⚠</span>
      <span>{overdueInvoices} overdue invoice{overdueInvoices > 1 ? "s" : ""} require attention</span>
      <button type="button" className={cx("btnGhost", "mlAuto", "text11")} onClick={() => onNavigate?.("invoices")}>
        View →
      </button>
    </div>
  )}
  ```

- [ ] **Step 5: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/app/style/admin/core.module.css \
          apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx
  git commit -m "design(admin): elevate executive dashboard KPI cards with hero glow and improved alert strip"
  ```

---

## Task 6: Staff Dashboard Home — Hero KPI Card Elevation

**Files:**
- Modify: `apps/web/src/app/style/staff/maphari-staff-dashboard.module.css` (or the relevant admin CSS file for staff)
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/dashboard-page.tsx`

**Context:** Staff accent is `#24b8a8` (teal/cyan). The `staffDashSummaryGrid` has 4 KPI cards. Elevation adds: accent gradient overlay on each card, better empty state for the priority tasks table, and a live pulsing status indicator on the "Online" topbar pill.

- [ ] **Step 1: Find the staff dashboard CSS files**

  ```bash
  ls apps/web/src/app/style/staff/
  grep -n "staffDashSummaryGrid\|statCard\|rdStudio" apps/web/src/app/style/staff/maphari-staff-dashboard.module.css | head -20
  ```

- [ ] **Step 2: Add elevation CSS for staff hero cards**

  Append to the staff CSS module:

  ```css
  /* ─── Staff Dashboard Elevation ──────────────────────────────────── */

  .staffKpiGlow {
    position: relative;
    overflow: hidden;
  }

  .staffKpiGlow::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 100% 80% at 50% 0%, rgba(36,184,168,0.07), transparent);
    pointer-events: none;
    border-radius: inherit;
  }

  .staffKpiDeliveryRisk::before {
    background: radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255,95,95,0.08), transparent);
  }

  .staffPriorityEmpty {
    padding: 32px 16px;
    text-align: center;
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted, rgba(255,255,255,0.35));
  }

  .staffPriorityEmpty::before {
    content: "✓";
    display: block;
    font-size: 1.2rem;
    margin-bottom: 8px;
    opacity: 0.3;
  }
  ```

- [ ] **Step 3: Apply glow classes to staff KPI cards**

  In `dashboard-page.tsx`, find the `staffDashSummaryGrid`. Apply `staffKpiGlow` to each `statCard`/`rdStudioCard`. For the Delivery Risk card (the one with `rdStudioMetricNeg`), also add `staffKpiDeliveryRisk`:

  ```tsx
  {/* Hours This Week card */}
  <div className={cx("statCard", "rdStudioCard", "staffKpiGlow")}>
    {/* existing content */}
  </div>

  {/* Delivery Risk card */}
  <div className={cx("statCard", "rdStudioCard", "staffKpiGlow", "staffKpiDeliveryRisk")}>
    {/* existing content */}
  </div>
  ```

- [ ] **Step 4: Improve the priority tasks empty state**

  Find where priority tasks are rendered. If the list is empty, replace the current empty state (if any) with:
  ```tsx
  {priorityTasks.length === 0 && (
    <div className={cx("staffPriorityEmpty")}>
      All tasks on track
    </div>
  )}
  ```

- [ ] **Step 5: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/app/style/staff/maphari-staff-dashboard.module.css \
          apps/web/src/components/staff/staff-dashboard/pages/dashboard-page.tsx
  git commit -m "design(staff): elevate staff dashboard hero KPI cards with teal glow and improved empty states"
  ```

---

## Task 7: UI Consistency Audit — Cross-Dashboard Topbar and Sidebar

**Files:**
- Modify: `apps/web/src/app/style/shared/maphari-dashboard-shared.module.css`

**Context:** The screenshot shows the topbar breadcrumb "Communication / Meeting Archive" without any visual weight. All 3 dashboards should have consistent topbar breadcrumb rendering, consistent icon button sizing, and a unified separator between the breadcrumb area and the action strip. Also: the sidebar PROJECT dropdown (seen in screenshot) should have a proper accent indicator.

- [ ] **Step 1: Audit current topbar styles**

  ```bash
  grep -n "topbarTitle\|topbarLabel\|topbarSep\|topbarActions\|topbarHamburger\|topbarUserBtn" apps/web/src/app/style/shared/maphari-dashboard-shared.module.css | head -20
  ```

- [ ] **Step 2: Enhance topbar breadcrumb legibility**

  Find `.topbarTitle` in the shared CSS. Add a visual separator character style:

  ```css
  /* Enhanced topbar breadcrumb separator */
  .topbarLabel + .topbarLabel::before {
    content: " ";
  }
  ```

  Also ensure `.topbarLabel:first-child` is muted and `.topbarLabel:last-child` is full text color:

  ```css
  .topbarLabelEyebrow {
    color: var(--text-muted, rgba(255,255,255,0.4));
    font-size: 0.68rem;
  }

  .topbarLabelPage {
    color: var(--text, rgba(255,255,255,0.9));
    font-size: 0.72rem;
    font-weight: 600;
  }
  ```

- [ ] **Step 3: Check if client topbar.tsx uses these classes**

  ```bash
  grep -n "topbarLabel\|topbarLabelEyebrow\|topbarLabelPage" apps/web/src/components/client/maphari-dashboard/topbar.tsx
  ```

  If the topbar uses a generic `topbarLabel` class for both eyebrow and page title, add the `topbarLabelEyebrow` class to the first span and `topbarLabelPage` to the second.

  In `apps/web/src/components/client/maphari-dashboard/topbar.tsx`, find:
  ```tsx
  <div className={styles.topbarTitle}>
    <span className={styles.topbarLabel}>{eyebrow}</span>{" "}
    <span className={styles.topbarLabel}>/ {title}</span>
  </div>
  ```

  Change to use contextual classes — since `styles` is from the spread `cx()`, check if these classes will resolve. If not, use inline style for differentiation:
  ```tsx
  <div className={styles.topbarTitle}>
    <span className={styles.topbarLabel} style={{ opacity: 0.45, fontSize: "0.65rem" }}>{eyebrow}</span>
    <span style={{ opacity: 0.25, margin: "0 5px", fontSize: "0.65rem" }}>/</span>
    <span className={styles.topbarLabel} style={{ fontWeight: 600 }}>{title}</span>
  </div>
  ```

  Apply the same pattern to staff and admin topbars.

- [ ] **Step 4: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/app/style/shared/maphari-dashboard-shared.module.css \
          apps/web/src/components/client/maphari-dashboard/topbar.tsx \
          apps/web/src/components/staff/staff-dashboard/topbar.tsx \
          apps/web/src/components/admin/dashboard/topbar.tsx
  git commit -m "design(shared): improve topbar breadcrumb visual hierarchy across all 3 dashboards"
  ```

---

## Final Verification

- [ ] TypeScript: `pnpm --filter @maphari/web exec tsc --noEmit` — zero errors
- [ ] Client → Meeting Archive: calendar renders as 7-column grid with proper headers ✓
- [ ] Client → Meeting Archive: KPI cards show numbers (0 if no data) not "—" dashes ✓
- [ ] Client → Meeting Booker: step indicator visible above form; slot buttons in 4-column grid ✓
- [ ] Admin → Executive Dashboard: first KPI card has subtle purple glow overlay ✓
- [ ] Admin → Executive Dashboard: alert strip has red left-border elevation ✓
- [ ] Staff → Home: KPI cards have teal glow overlay ✓
- [ ] All dashboards: topbar breadcrumb has muted eyebrow + bold page name ✓
