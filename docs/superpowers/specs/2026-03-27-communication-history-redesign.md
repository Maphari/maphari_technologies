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
5. **Refresh button** — icon-only (↻), ghost style (`commsGhostBtn`), triggers background reload.

Removed from current design: client dropdown, direction dropdown, date range dropdown, text "Clear" button (type pill → All replaces Clear for type; search clears via input).

---

## 4. By Client View (default)

### Client Swimlanes

All filtered events are grouped by `clientId`. Clients are sorted by most recent event `occurredAt` date (newest first) — this sort is always by raw `occurredAt` regardless of the active `sortBy` value, which only affects event ordering within each lane. Each client gets a `commsClientLane` block:

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

**Type → icon colour** — use the existing retained CSS classes; do NOT hardcode hex values:

| Type | CSS class | Colour (for reference only) |
|------|-----------|----------------------------|
| message | `commsTypeMessage` | accent (orange) |
| milestone | `commsTypeMilestone` | green |
| invoice | `commsTypeInvoice` | blue |
| call | `commsTypeCall` | purple |
| file | `commsTypeFile` | amber |

These classes are defined in `pages-b.module.css` and must not be changed. The component must apply them exactly as-is.

**Direction chip:** shown only when `direction !== "outbound"` — `staffChipGreen` for inbound, `staffChipPurple` for both. Outbound events show no direction chip (no empty chip). Do not use `commsDirectionInbound` / `commsDirectionBoth` CSS classes — these are unused label-colour helpers in CSS that are not applied to chip elements.

**Last row:** apply `commsRowLast` to the final row in each group to remove the bottom border. Do not use `staffCommsRowLast` (old name, remove from component).

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
// Note: the current component uses "newest" for what is now "recent" — rename on rewrite.
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

**Removed state:** `clientFilter`, `directionFilter`, `dateRange` (all replaced by swimlane structure + type pills). The old `sortBy` value `"newest"` is renamed to `"recent"`.

### Derived values (useMemo)

- `filteredEvents` — apply `activeType` + `search` filter + `sortBy` sort to `events`
- `clientGroups` — group `filteredEvents` by `clientId`; for each group compute `maxOccurredAt = max(group[i].occurredAt)`; sort groups by `maxOccurredAt` descending (most recent client first). This sort is independent of `sortBy` which only affects event order within each group. Skip clients whose group is empty after filtering.
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

Use the existing `<StaffEmptyState>` component for all empty/error states (do not render raw `emptyState` classes directly — the component wraps them).

| Condition | UI |
|-----------|----|
| Loading | Skeleton blocks: filter bar + 3 placeholder lane headers (`skeletonBlock`) |
| Error | `<StaffEmptyState>` with error message |
| No events at all | `<StaffEmptyState>` "No communication history yet" |
| No events match filter/search | `<StaffEmptyState>` "No events match" + "clear filters" link (resets `activeType` to `"all"`, clears `search`) |
| Client has 0 visible events after filter | Lane hidden entirely (not rendered) |

---

## 10. CSS

### File to modify
`apps/web/src/app/style/staff/pages-b.module.css`

### New classes to define

| Group | Classes |
|-------|---------|
| Filter bar | `commsFilterBar`, `commsTypePill`, `commsTypePillActive`, `commsViewToggle`, `commsViewBtn`, `commsViewBtnActive` |
| Swimlane | `commsSwimGrid`, `commsClientLane`, `commsLaneHeader`, `commsLaneAvatar`, `commsLaneName`, `commsLaneMeta`, `commsLaneBody` |
| Event rows (fix missing) | `commsGhostBtn`, `commsEventHeadRow`, `commsEventMeta`, `commsExpandedBody`, `commsExpandedMeta`, `commsRowLast` |

### Classes to retain (dynamic — never rename)
`commsTimelineIcon`, `commsTypeMessage`, `commsTypeMilestone`, `commsTypeInvoice`, `commsTypeCall`, `commsTypeFile`, `commsContent`, `commsEventRowUnread`, `commsTimelineIconUnread`

### Classes to remove from component JSX (not from CSS — they have no CSS definition)
`commsFiltersWrap` (replaced by `commsFilterBar`), `commsClientFilterBtn` (client filter removed — swimlane handles it), `staffCommsRowLast` (replaced by `commsRowLast`)

### Unused CSS to remove from pages-b.module.css
`commsDirectionLabel`, `commsDirectionOutbound`, `commsDirectionInbound`, `commsDirectionBoth` — defined in CSS but never applied to DOM elements in the component; safe to delete.

### Inline styles to remove
All inline `style={{}}` on event rows — move `flexDirection`, `alignItems`, `gap` to `commsEventHeadRow`; move conditional `borderBottom` to `commsRowLast`.

### Available without CSS additions (via style spread)
`staffListRow`, `staffCard`, `staffChip`, `staffChipAccent`, `staffChipGreen`, `staffChipAmber`, `staffChipPurple`, `staffCommsDateHd`, `staffCommsDateLabel`, `staffCommsDateLine`, `staffCommsTitle`, `staffCommsExcerpt`, `staffCommsTimeCol`, `staffRoleLabel`, `staffFilterInput`, `skeletonBlock`

---

## 11. Files to Change

| File | Change |
|------|--------|
| `apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.tsx` | Replace 3 dropdowns with `activeType` + `viewMode` state. Rename `"newest"` → `"recent"`. Add `collapsedClients` Set. Add swimlane grouping logic in `useMemo`. Rewrite JSX. Remove all inline styles. Remove `commsFiltersWrap`, `commsClientFilterBtn`, `staffCommsRowLast` class references. Delete `filterDir`, `filterClient`, `dateRange` `useState` declarations. Delete the `directionConfig` lookup object and the `Direction` type entirely — direction is no longer a filter axis and the direction chip reads `event.direction` directly using `staffChipGreen`/`staffChipPurple`. |
| `apps/web/src/app/style/staff/pages-b.module.css` | Add new `comms*` classes listed above. Fix 7 previously missing classes. Remove unused direction label classes. |

No changes to: `clients.ts`, `staff-analytics.ts`, gateway controller, topbar, shared CSS files, or any other page.

---

## 12. Out of Scope

- Pagination or virtual scrolling (all events loaded client-side as today)
- Read/unread event marking (CSS stubs exist but no API support)
- Per-event quick actions (message, call scheduling) — view only
- Date range filtering
- Direction filtering
