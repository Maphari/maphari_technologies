# Delivery Status Page — UI Revamp Design Spec

## Goal

Replace the current flat-list row layout with an expandable-row design that eliminates the inline progress bar from the collapsed state, gives each project a colored left-border accent indicating health, and reveals a detail drawer (progress + stats + action buttons) on row click.

---

## Problems Being Addressed

| # | Problem | Current |
|---|---------|---------|
| 1 | Progress bar clutters collapsed rows | Full-width bar in every row even when 0% |
| 2 | No way to jump to deliverables from this page | Only Tasks → button exists |
| 3 | No visual hierarchy between At Risk / Minor Delay / On Track | Everything looks identical except the chip |
| 4 | No expand/collapse — all detail always visible | Flat list with no density control |

---

## Design

### Collapsed Row

```
[accent border] [dot] Project Name          [STATUS CHIP]  [readiness%]  [chevron ▼]
               Client Name · Phase
```

- **Left border**: 3px solid — red (`var(--red)`) for At Risk, amber (`var(--amber)`) for Minor Delay, green (`var(--green)`) for On Track
- **Status dot**: 7px circle, same colour as border
- **Project name** (12px bold) + client·phase meta (10px muted mono) on left
- **Status chip** + **readiness %** (13px bold, coloured) + **chevron** on right — no progress bar
- Chevron rotates 180° when open

### Expanded Detail (below the header, inline)

Two-column layout inside a slightly darker `#0d1017` tray:

**Left column** (flex-grow):
- Progress bar: 4px height, coloured fill; label row above shows "Readiness" (left) and "X / Y deliverables done" (right)
- Stats row below bar: Phase · Due Date · In Review — each as a small label + value pair

**Right column** (fixed width, ~130px):
- "Tasks →" button (navigates to tasks page with project filter)
- "Deliverables →" button (navigates to deliverables page)

### Interaction

- One row open at a time — opening a new row closes any currently open row
- Keyboard accessible: `role="button"`, `tabIndex={0}`, responds to Enter/Space
- Border of the row card transitions from `var(--b1)` (collapsed) to a translucent status colour (expanded)

---

## Files Changed

| File | What changes |
|------|-------------|
| `apps/web/src/components/staff/staff-dashboard/pages/delivery-status-page.tsx` | Add `expandedId` state, add `onGoDeliverables` prop, replace row markup with expandable structure |
| `apps/web/src/app/style/staff/pages-c.module.css` | Add new `dsv*` expandable-row CSS classes |
| `apps/web/src/components/staff/maphari-staff-dashboard.tsx` | Wire `onGoDeliverables` prop to navigate to deliverables page |

No backend changes. No schema changes. No new API calls.

---

## Component Changes

### `delivery-status-page.tsx`

**Props — add:**
```typescript
onGoDeliverables?: (projectId: string) => void;
```

**State — add:**
```typescript
const [expandedId, setExpandedId] = useState<string | null>(null);
```

**Toggle helper:**
```typescript
function toggleExpand(id: string) {
  setExpandedId(prev => (prev === id ? null : id));
}
```

**Row markup (replace `staffListRow dsvProjectRow` block):**

```tsx
{sorted.map((d) => {
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
              <button type="button" className={cx("dsvExpandActionBtn")} onClick={() => onGoDeliverables(d.projectId)}>
                Deliverables →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
})}
```

**Add `deliverablesDone` and `deliverablesTotal` to `DeliveryItem` type:**
```typescript
type DeliveryItem = {
  // ... existing fields ...
  deliverablesDone:  number;
  deliverablesTotal: number;
};
```

**Update `built` map to populate them:**
```typescript
deliverablesDone:  deliverables.filter((d) => DONE_STATUSES.has(d.status.toUpperCase())).length,
deliverablesTotal: deliverables.length,
```

**Add `accentCls` helper:**
```typescript
function accentCls(s: DeliveryStatus): string {
  if (s === "On Track")    return "dsvAccentGreen";
  if (s === "At Risk")     return "dsvAccentRed";
  return "dsvAccentAmber";
}
```

---

## CSS Changes (`pages-c.module.css`)

Append after the existing `.dsv*` block:

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
.dsvExpandRowOpen { border-color: var(--b2); }

/* Status accent left borders */
.dsvAccentRed   { border-left-color: var(--red);   }
.dsvAccentAmber { border-left-color: var(--amber);  }
.dsvAccentGreen { border-left-color: var(--green);  }
.dsvExpandRowOpen.dsvAccentRed   { border-color: rgba(239,68,68,.2);   }
.dsvExpandRowOpen.dsvAccentAmber { border-color: rgba(245,166,35,.2);  }
.dsvExpandRowOpen.dsvAccentGreen { border-color: rgba(52,217,139,.2);  }

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
  background: var(--s0, #0d1017);
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
.dsvExpandStatValue { font-size: 11px; font-weight: 600; color: var(--text2); }

/* Right: action buttons */
.dsvExpandRight { display: flex; flex-direction: column; gap: 6px; min-width: 130px; }
.dsvExpandActionBtn {
  background: var(--s2);
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

---

## Parent Wiring (`maphari-staff-dashboard.tsx`)

Update the `<DeliveryStatusPage>` call to add `onGoDeliverables`:

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

Note: `DeliverablesPage` does not accept a project filter prop, so `onGoDeliverables` navigates to the deliverables page without pre-filtering.

---

## Constraints

- No backend changes, no new API calls — same `getStaffProjects` + `getStaffDeliverables` + `getStaffClients` fetches
- Only one row may be open at a time
- TypeScript must pass: `pnpm --filter @maphari/web exec tsc --noEmit`
- Existing `dsvFillGreen/Amber/Red`, `staffBar`, `staffBarFill`, `staffDot`, `staffChip`, `staffChipGreen/Amber/Red` classes are reused unchanged
