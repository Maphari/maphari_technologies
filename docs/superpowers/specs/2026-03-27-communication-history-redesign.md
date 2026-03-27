# Communication History Page — Redesign Spec

**Date:** 2026-03-27
**Dashboard:** Staff Dashboard
**Section:** Client Intelligence
**Page:** Communication History (`activePage === "comms"`)
**Status:** Approved for implementation

---

## 1. Overview

Redesign the `CommunicationHistoryPage` from its current single-view timeline with five dropdowns into a **client swimlane layout with a view toggle**. The swimlane view groups all events by client (collapsible, sorted by most recent activity). A toggle switches to the existing date-grouped view. The dense filter bar is replaced by a search input, type pills, and a sort pill. No KPI strip. All data is live from the real API (`/staff/comms`). No hardcoded or dummy data.

---

## 2. Layout Structure

```
┌─ Topbar (orange stripe) ────────────────────────────────────────┐
├─ Rail │ Page content ───────────────────────────────────────────┤
│       │  Eyebrow / Title / Description                          │
│       │  ┌── Filter Bar ──────────────────────────────────────┐ │
│       │  │ [Search…] [All][Messages][Calls][Milestones]…      │ │
│       │  │ [Recent ↓]          [By Client ▮][By Date]  [↻]   │ │
│       │  └────────────────────────────────────────────────────┘ │
│       │  ┌── Content Body ────────────────────────────────────┐ │
│       │  │  (swimlane view OR date-grouped view)              │ │
│       │  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

No KPI strip. No right-side detail panel.

---

## 3. Filter Bar

Single row containing:

1. **Search input** — searches `title`, `excerpt`, `clientName`. Placeholder: "Search events, clients…"
2. **Type pills** — mutually exclusive: All / Messages / Calls / Milestones / Invoices / Files. Active pill uses `commsTypePillActive` (orange tint). Default: All.
3. **Sort pill** (rightmost before toggle) — cycles: Recent ↓ → Oldest ↑ → Client A–Z. Uses `commsTypePill` / `commsTypePillActive`.
4. **View toggle** — two-segment button: "By Client" | "By Date". Active segment uses `commsViewBtnActive`. Default: By Client.
5. **Refresh button** — icon-only (↻), ghost style, triggers background reload.

Removed from current design: client dropdown, direction dropdown, date range dropdown, text "Clear" button (type pill → All replaces Clear for type; search clears via input).

---

## 4. By Client View (default)

### Client Swimlanes

All filtered events are grouped by `clientId`. Clients are sorted by most recent event date (newest first). Each client gets a `commsClientLane` block:

**Lane header** (`commsLaneHeader`) — always visible, clickable to collapse/expand:
- Avatar circle (`commsLaneAvatar`) — initials (first letter of each word in `clientName`), background tinted by a stable colour derived from `clientId` (same palette as staff client avatar pattern)
- Client name (`commsLaneName`)
- Meta (`commsLaneMeta`) — "{N} events · last {dateLabel}" e.g. "5 events · last Mar 27"
- Chevron — ▲ when expanded, ▼ when collapsed

**Lane body** (`commsLaneBody`) — hidden when client is in `collapsedClients` set:
- All events for this client (already filtered by type + search + sort)
- Same event row structure as §5
- Clients with zero visible events after filtering are hidden entirely (no empty lane shown)

**Default state:** All clients expanded on initial load.

---

## 5. Event Rows

Each event row (`staffListRow`) in both views:

**Collapsed state** (`commsEventHeadRow`):
- Icon circle (`commsTimelineIcon` + type class) — 22px, coloured by type
- Title (`staffCommsTitle`) — flex:1
- Type chip (`staffChip` + tone class)
- Date · time (`staffCommsTimeCol`) — format: "Mar 27 · 14:32"

**Expanded state** (click row toggles `expandedId`; one open at a time):
- Collapsed header remains visible, left orange border, `commsExpandedBody` below:
  - Full excerpt (`staffCommsExcerpt`)
  - Footer (`commsExpandedMeta`): type chip + full date/time label + Copy button (`commsGhostBtn`)
  - Copy writes `[clientName] — {title} · {excerpt}` to clipboard

**Type → icon colour mapping:**
| Type | Background |
|------|-----------|
| message | `#3b82f6` (blue) |
| milestone | `#22c55e` (green) |
| invoice | `#eab308` (amber) |
| call | `#a855f7` (purple) |
| file | `#6b7280` (muted grey) |

**Direction chip:** shown only when `direction !== "outbound"` — green chip for inbound, purple for both. Outbound events show no direction chip (no empty chip).

---

## 6. By Date View

When `viewMode === "date"`: renders the current date-grouped layout. Events grouped by `dateLabel` (e.g. "Mar 27, 2026"), newest group first. Date header uses `staffCommsDateHd` / `staffCommsDateLabel` / `staffCommsDateLine`. Same event rows as §5. Filtered by the same `activeType`, `search`, `sortBy` state.

The `collapsedClients` state is irrelevant in this view (not applied).

---

## 7. State

```typescript
type ViewMode   = "client" | "date";
type EventType  = "message" | "milestone" | "invoice" | "call" | "file";
type SortBy     = "recent" | "oldest" | "client";
```

| State | Type | Default |
|-------|------|---------|
| `viewMode` | `ViewMode` | `"client"` |
| `activeType` | `EventType \| "all"` | `"all"` |
| `search` | `string` | `""` |
| `sortBy` | `SortBy` | `"recent"` |
| `collapsedClients` | `Set<string>` | `new Set()` (all expanded) |
| `expandedId` | `string \| null` | `null` |
| `loading` | `boolean` | `true` |
| `refreshing` | `boolean` | `false` |
| `error` | `string \| null` | `null` |

**Removed state:** `clientFilter`, `directionFilter`, `dateRange` (all replaced by swimlane structure + type pills).

### Derived values (useMemo)

- `filteredEvents` — apply `activeType` + `search` filter + `sortBy` sort to `events`
- `clientGroups` — group `filteredEvents` by `clientId`; sort groups by most recent event date; skip clients whose group is empty
- `dateGroups` — group `filteredEvents` by `dateLabel`; order newest first

---

## 8. Interaction Rules

- **Type pill click** — sets `activeType`. Clicking the active pill again resets to `"all"`.
- **Sort pill click** — cycles: `"recent"` → `"oldest"` → `"client"` → `"recent"`
- **View toggle** — sets `viewMode`. Switching view does not reset filters or collapse state.
- **Lane header click** — toggles `clientId` in `collapsedClients`.
- **Event row click** — if `expandedId === event.id`, set to `null` (collapse). Otherwise set to `event.id` (expand, closing any previously open row).
- **Search input** — filters as-you-type (no debounce needed; all data is in memory).
- **Refresh button** — sets `refreshing: true`, re-calls `getStaffAllComms`, clears on complete.

---

## 9. Empty & Loading States

| Condition | UI |
|-----------|----|
| Loading | Skeleton blocks: filter bar + 3 placeholder lane headers (`skeletonBlock`) |
| Error | `emptyState` block with error message |
| No events at all | "No communication history yet" |
| No events match filter/search | "No events match" + "clear filters" link (resets `activeType` to `"all"`, clears `search`) |
| Client has 0 visible events after filter | Lane hidden entirely (not rendered) |

---

## 10. CSS

### File to modify
`apps/web/src/app/style/staff/pages-b.module.css`

### New classes to define

| Group | Classes |
|-------|---------|
| Filter bar | `commsFilterBar`, `commsTypePill`, `commsTypePillActive`, `commsViewToggle`, `commsViewBtn`, `commsViewBtnActive` |
| Swimlane | `commsSwimGrid`, `commsClientLane`, `commsLaneHeader`, `commsLaneAvatar`, `commsLaneMeta`, `commsLaneBody` |
| Event rows (fix missing) | `commsGhostBtn`, `commsEventHeadRow`, `commsEventMeta`, `commsExpandedBody`, `commsExpandedMeta`, `commsRowLast` |

### Classes to retain (dynamic — never rename)
`commsTimelineIcon`, `commsTypeMessage`, `commsTypeMilestone`, `commsTypeInvoice`, `commsTypeCall`, `commsTypeFile`, `commsContent`, `commsEventRowUnread`, `commsTimelineIconUnread`

### Classes to remove
`commsFiltersWrap` (replaced by `commsFilterBar`), `commsClientFilterBtn` (client filter removed — swimlane handles it)

### Inline styles to remove
All inline `style={{}}` on event rows — move `flexDirection`, `alignItems`, `gap` to `commsEventHeadRow`; move conditional `borderBottom` to `commsRowLast`.

### Available without CSS additions (via style spread)
`staffListRow`, `staffCard`, `staffChip`, `staffChipAccent`, `staffChipGreen`, `staffChipAmber`, `staffChipPurple`, `staffCommsDateHd`, `staffCommsDateLabel`, `staffCommsDateLine`, `staffCommsTitle`, `staffCommsExcerpt`, `staffCommsTimeCol`, `staffRoleLabel`, `staffFilterInput`, `emptyState`, `emptyStateTitle`, `emptyStateSub`, `skeletonBlock`

---

## 11. Files to Change

| File | Change |
|------|--------|
| `apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.tsx` | Replace 3 dropdowns with `activeType` + `viewMode` state. Add `collapsedClients` Set. Add swimlane grouping logic in `useMemo`. Rewrite JSX. Remove all inline styles. |
| `apps/web/src/app/style/staff/pages-b.module.css` | Add new `comms*` classes listed above. Fix 7 previously missing classes. Remove `commsFiltersWrap` and `commsClientFilterBtn`. |

No changes to: `clients.ts`, `staff-analytics.ts`, gateway controller, topbar, shared CSS files, or any other page.

---

## 12. Out of Scope

- Pagination or virtual scrolling (all events loaded client-side as today)
- Read/unread event marking (CSS stubs exist but no API support)
- Per-event quick actions (message, call scheduling) — view only
- Date range filtering
- Direction filtering
