# Delivery Status UI Revamp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat-list Delivery Status layout with expandable rows that show a colored left-border accent per health status and reveal a progress + stats + action-buttons detail tray on click.

**Architecture:** Pure frontend change — no backend, no new API calls. Three files change: CSS gets new expandable-row classes, the page component gets new state/helpers/markup, and the parent dashboard wires the new `onGoDeliverables` prop. One row may be open at a time; the detail tray is conditionally rendered (not hidden via CSS) so it adds no DOM cost when collapsed.

**Tech Stack:** React 18, TypeScript, CSS Modules (`cx()` helper), Next.js 16

**Spec:** `docs/superpowers/specs/2026-03-27-delivery-status-revamp-design.md`

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/app/style/staff/pages-c.module.css` | Append new `dsv*` expandable-row classes after line 964 |
| `apps/web/src/components/staff/staff-dashboard/pages/delivery-status-page.tsx` | Update type, state, helpers, row markup |
| `apps/web/src/components/staff/maphari-staff-dashboard.tsx` | Wire `onGoDeliverables` prop |

---

## Task 1: CSS — Add expandable-row styles

**Files:**
- Modify: `apps/web/src/app/style/staff/pages-c.module.css:964`

---

- [ ] **Step 1: Open the CSS file and locate the insertion point**

  Open `apps/web/src/app/style/staff/pages-c.module.css`. Find line 964:
  ```
  .dsvViewTasksBtn:hover { color: var(--accent); border-color: rgba(249,115,22,0.3); }
  ```
  The new classes go immediately after this line (before the `/* EVALUATION / ANALYTICS */` comment block at line 966).

- [ ] **Step 2: Insert the new CSS block**

  Insert the following after line 964:

  ```css
  /* ── Expandable row ──────────────────────────────────────────── */
  .dsvExpandRow {
    border-radius: var(--r-sm);
    border: 1px solid var(--b1);
    overflow: hidden;
    background: var(--s1);
    border-left: 3px solid var(--b2);
    transition: border-color 0.15s;
  }

  /* Status accent left borders — always solid */
  .dsvAccentRed   { border-left-color: var(--red);   }
  .dsvAccentAmber { border-left-color: var(--amber);  }
  .dsvAccentGreen { border-left-color: var(--green);  }

  /* When open: top/right/bottom become translucent; left stays solid */
  .dsvExpandRowOpen.dsvAccentRed   { border-top-color: rgba(239,68,68,.2); border-right-color: rgba(239,68,68,.2); border-bottom-color: rgba(239,68,68,.2); }
  .dsvExpandRowOpen.dsvAccentAmber { border-top-color: rgba(245,166,35,.2); border-right-color: rgba(245,166,35,.2); border-bottom-color: rgba(245,166,35,.2); }
  .dsvExpandRowOpen.dsvAccentGreen { border-top-color: rgba(52,217,139,.2); border-right-color: rgba(52,217,139,.2); border-bottom-color: rgba(52,217,139,.2); }

  /* Collapsed header */
  .dsvExpandHeader {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    cursor: pointer;
    user-select: none;
    outline: none;
  }
  .dsvExpandHeader:focus-visible { box-shadow: inset 0 0 0 2px var(--accent); }

  /* Right meta cluster (chip + % + chevron) */
  .dsvExpandMeta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  /* Chevron */
  .dsvChevron { color: var(--muted); transition: transform 0.2s; flex-shrink: 0; }
  .dsvChevronOpen { transform: rotate(180deg); }

  /* Expanded detail tray */
  .dsvExpandDetail {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 12px;
    align-items: start;
    background: var(--s2);
    border-top: 1px solid var(--b1);
    padding: 12px 14px;
  }

  /* Left: progress + stats */
  .dsvExpandLeft { display: flex; flex-direction: column; gap: 10px; min-width: 0; }

  .dsvExpandProgress { display: flex; flex-direction: column; gap: 4px; }
  .dsvExpandProgressLabel {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    font-family: var(--font-dm-mono);
    color: var(--muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .dsvExpandStats { display: flex; gap: 20px; }
  .dsvExpandStat  { display: flex; flex-direction: column; gap: 2px; }
  .dsvExpandStatLabel {
    font-size: 8px;
    font-family: var(--font-dm-mono);
    color: var(--muted2);
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }
  .dsvExpandStatValue { font-size: 11px; font-weight: 600; color: var(--text); }

  /* Right: action buttons */
  .dsvExpandRight { display: flex; flex-direction: column; gap: 6px; min-width: 130px; }
  .dsvExpandActionBtn {
    background: var(--s1);
    border: 1px solid var(--b2);
    color: var(--muted);
    font-size: 10px;
    font-family: var(--font-dm-mono);
    padding: 7px 12px;
    border-radius: var(--r-xs);
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.15s, border-color 0.15s;
  }
  .dsvExpandActionBtn:hover { color: var(--text); border-color: var(--b3); }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/app/style/staff/pages-c.module.css
  git commit -m "style(staff): add dsvExpand* CSS classes for expandable delivery status rows"
  ```

---

## Task 2: Component — Update type, state, and helpers

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/delivery-status-page.tsx:24-42,55-98,103`

Context: This file is a self-contained page component. The `DeliveryItem` type (lines 33–42) holds the derived data per project. The helper functions (lines 45–98) derive status/phase/CSS classes from raw API data. The component function starts at line 102.

---

- [ ] **Step 1: Add `deliverablesDone` and `deliverablesTotal` to `DeliveryItem`**

  Current type (lines 33–42):
  ```typescript
  type DeliveryItem = {
    projectId: string;
    project: string;
    client: string;
    phase: string;
    readiness: number;
    blockers: number;
    launchDate: string;
    status: DeliveryStatus;
  };
  ```

  Replace with:
  ```typescript
  type DeliveryItem = {
    projectId:        string;
    project:          string;
    client:           string;
    phase:            string;
    readiness:        number;
    blockers:         number;
    launchDate:       string;
    status:           DeliveryStatus;
    deliverablesDone:  number;
    deliverablesTotal: number;
  };
  ```

- [ ] **Step 2: Run TypeScript — expect failure**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep "delivery-status"
  ```
  Expected: error about `deliverablesDone` / `deliverablesTotal` not present in return object inside the `built` map. This confirms the type change propagated.

- [ ] **Step 3: Update the `built` map return object (lines ~142–168)**

  Find the `return {` inside the `.map((p, i) => {` block (currently around line 154). Replace the entire `return { … }` with:

  ```typescript
  return {
    projectId:        p.id,
    project:          p.name,
    client:           clientMap.get(p.clientId)?.name ?? p.clientId,
    phase,
    readiness,
    blockers:         inReview,
    launchDate:       p.dueAt
      ? new Date(p.dueAt).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric",
        })
      : "TBD",
    status,
    deliverablesDone:  deliverables.filter((d) => DONE_STATUSES.has(d.status.toUpperCase())).length,
    deliverablesTotal: deliverables.length,
  };
  ```

- [ ] **Step 4: Add `onGoDeliverables` to `PageProps`**

  Current `PageProps` (lines 24–29):
  ```typescript
  type PageProps = {
    isActive: boolean;
    session: AuthSession | null;
    onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
    onGoTasks?: (projectId: string) => void;
  };
  ```

  Replace with:
  ```typescript
  type PageProps = {
    isActive: boolean;
    session: AuthSession | null;
    onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
    onGoTasks?: (projectId: string) => void;
    onGoDeliverables?: () => void;
  };
  ```

- [ ] **Step 5: Destructure the new prop in the component signature**

  Line 102 currently:
  ```typescript
  export function DeliveryStatusPage({ isActive, session, onNotify, onGoTasks }: PageProps) {
  ```

  Replace with:
  ```typescript
  export function DeliveryStatusPage({ isActive, session, onNotify, onGoTasks, onGoDeliverables }: PageProps) {
  ```

- [ ] **Step 6: Add `expandedId` state**

  After the existing state declarations (lines 103–105):
  ```typescript
  const [items, setItems]     = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  ```

  Add one more line:
  ```typescript
  const [expandedId, setExpandedId] = useState<string | null>(null);
  ```

- [ ] **Step 7: Add `accentCls` and `toggleExpand` helpers**

  After the existing helper functions block (after `statusDotCls`, `readinessFillCls`, `readinessPctCls`, `STATUS_ORDER` — around line 98), add:

  ```typescript
  function accentCls(s: DeliveryStatus): string {
    if (s === "On Track") return "dsvAccentGreen";
    if (s === "At Risk")  return "dsvAccentRed";
    return "dsvAccentAmber";
  }
  ```

  And inside the component function body (after the `expandedId` state, before the `useEffect`), add:

  ```typescript
  function toggleExpand(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
  }
  ```

- [ ] **Step 8: Run TypeScript — expect pass**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep "delivery-status"
  ```
  Expected: no output (no errors in this file).

- [ ] **Step 9: Commit**

  ```bash
  git add apps/web/src/components/staff/staff-dashboard/pages/delivery-status-page.tsx
  git commit -m "feat(staff): add expandedId state, accentCls helper, deliverables count to DeliveryItem"
  ```

---

## Task 3: Component — Replace row markup

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/delivery-status-page.tsx:270-308`

Context: The current row JSX lives inside `sorted.map((d) => ( <div key={d.projectId} className={cx("staffListRow", "dsvProjectRow")}> … </div> ))` (around lines 270–308). Replace the entire `.map()` callback body with the new expandable structure.

---

- [ ] **Step 1: Locate the row map block**

  Find this opening in the JSX (around line 270):
  ```tsx
  sorted.map((d) => (
    <div key={d.projectId} className={cx("staffListRow", "dsvProjectRow")}>
  ```
  The matching closing `</div> ))` is around line 308. This entire block is what we're replacing.

- [ ] **Step 2: Replace the entire `sorted.map(...)` block**

  Remove everything from `sorted.map((d) => (` through its closing `))` and replace with:

  ```tsx
  sorted.map((d) => {
    const isOpen = expandedId === d.projectId;
    return (
      <div
        key={d.projectId}
        className={cx("dsvExpandRow", accentCls(d.status), isOpen && "dsvExpandRowOpen")}
      >
        {/* ── Collapsed header ── */}
        <div
          className={cx("dsvExpandHeader")}
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          onClick={() => toggleExpand(d.projectId)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExpand(d.projectId); }
          }}
        >
          <span className={cx("staffDot", statusDotCls(d.status))} />
          <div className={cx("dsvProjectMain")}>
            <div className={cx("dsvProjectName")}>{d.project}</div>
            <div className={cx("dsvProjectMeta")}>{d.client}<span className={cx("dsvPhaseSep")}> · </span>{d.phase}</div>
          </div>
          <div className={cx("dsvExpandMeta")}>
            <span className={cx("staffChip", statusChipCls(d.status))}>{d.status}</span>
            <span className={cx("dsvReadinessPct", readinessPctCls(d.readiness))}>{d.readiness}%</span>
            <svg className={cx("dsvChevron", isOpen && "dsvChevronOpen")} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* ── Expanded detail ── */}
        {isOpen && (
          <div className={cx("dsvExpandDetail")}>
            <div className={cx("dsvExpandLeft")}>
              <div className={cx("dsvExpandProgress")}>
                <div className={cx("dsvExpandProgressLabel")}>
                  <span>Readiness</span>
                  <span>{d.deliverablesDone} / {d.deliverablesTotal} deliverables done</span>
                </div>
                <div className={cx("staffBar")}>
                  <div
                    className={cx("staffBarFill", readinessFillCls(d.readiness))}
                    style={{ "--fill-pct": `${d.readiness}%` } as React.CSSProperties}
                  />
                </div>
              </div>
              <div className={cx("dsvExpandStats")}>
                <div className={cx("dsvExpandStat")}>
                  <div className={cx("dsvExpandStatLabel")}>Phase</div>
                  <div className={cx("dsvExpandStatValue")}>{d.phase}</div>
                </div>
                <div className={cx("dsvExpandStat")}>
                  <div className={cx("dsvExpandStatLabel")}>Due Date</div>
                  <div className={cx("dsvExpandStatValue")}>{d.launchDate}</div>
                </div>
                <div className={cx("dsvExpandStat")}>
                  <div className={cx("dsvExpandStatLabel")}>In Review</div>
                  <div className={cx("dsvExpandStatValue", d.blockers > 0 ? "colorAmber" : "")}>{d.blockers}</div>
                </div>
              </div>
            </div>
            <div className={cx("dsvExpandRight")}>
              {onGoTasks && (
                <button type="button" className={cx("dsvExpandActionBtn")} onClick={() => onGoTasks(d.projectId)}>
                  Tasks →
                </button>
              )}
              {onGoDeliverables && (
                <button type="button" className={cx("dsvExpandActionBtn")} onClick={() => onGoDeliverables()}>
                  Deliverables →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  })
  ```

- [ ] **Step 3: Run TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | grep "delivery-status"
  ```
  Expected: no output.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/components/staff/staff-dashboard/pages/delivery-status-page.tsx
  git commit -m "feat(staff): replace flat delivery status rows with expandable row design"
  ```

---

## Task 4: Parent wiring + final TypeScript check

**Files:**
- Modify: `apps/web/src/components/staff/maphari-staff-dashboard.tsx:1473-1480`

Context: `DeliveryStatusPage` is rendered around line 1473–1480. The existing call has `onGoTasks`. Add `onGoDeliverables`.

---

- [ ] **Step 1: Update the `<DeliveryStatusPage>` call**

  Find (around line 1473):
  ```tsx
  <DeliveryStatusPage
    isActive={activePage === "deliverystatus"}
    session={session ?? null}
    onGoTasks={(projectId) => {
      setFilterProjectId(projectId);
      setActivePage("tasks");
    }}
  />
  ```

  Replace with:
  ```tsx
  <DeliveryStatusPage
    isActive={activePage === "deliverystatus"}
    session={session ?? null}
    onGoTasks={(projectId) => {
      setFilterProjectId(projectId);
      setActivePage("tasks");
    }}
    onGoDeliverables={() => {
      setActivePage("deliverables");
    }}
  />
  ```

- [ ] **Step 2: Run full TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/components/staff/maphari-staff-dashboard.tsx
  git commit -m "feat(staff): wire onGoDeliverables on DeliveryStatusPage"
  ```

---

## Verification

After all tasks complete:

1. Navigate to **Client Lifecycle › Delivery Status** in the staff dashboard
2. Confirm collapsed rows show: colored left border, status dot, project name + client·phase, status chip, readiness %, chevron — **no progress bar**
3. Click a row — confirm it expands to show: readiness label + bar, phase/due/in-review stats, Tasks → and Deliverables → buttons
4. Click a second row — confirm the first row collapses
5. Tab to a row, press Enter — confirm keyboard expand/collapse works
6. Click Tasks → — confirm navigation to Tasks page
7. Click Deliverables → — confirm navigation to Deliverables page
