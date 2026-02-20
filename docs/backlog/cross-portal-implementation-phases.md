# Cross-Portal Implementation Phases (Admin + Staff + Client)

Prioritized by business impact: reliability and trust first, then execution velocity, then advanced optimization.

## Phase 1 · Dashboard Stability and UX Continuity (highest impact)
- Goal:
  - Remove reload flicker/glitch across Admin, Staff, and Client dashboards.
  - Keep data fresh without jarring full-screen loading transitions.
- Scope:
  - Background refresh strategy for workspace polling and realtime-triggered refreshes.
  - Preserve existing rendered state while silent refresh runs.
  - Keep explicit loading indicators only for first paint or direct user-triggered refresh actions.
- Delivered in this pass:
  - `useAdminWorkspace` now supports silent background refresh and uses it for interval + realtime refresh.
  - `useStaffWorkspace` now supports silent background refresh for workspace, messages, and conversation context polling/realtime.
  - Admin dashboard only shows full-page loading spinner on true cold start (no data).
  - Admin Messages page no longer toggles loading states during background polling.
- Files:
  - `apps/web/src/lib/auth/use-admin-workspace.ts`
  - `apps/web/src/lib/auth/use-staff-workspace.ts`
  - `apps/web/src/components/admin/maphari-dashboard.tsx`
  - `apps/web/src/components/admin/dashboard/pages/messages-page.tsx`

## Phase 2 · Complete UI-to-Backend Wiring
- Goal:
  - Remove all UI-only actions in critical workflow screens.
- Scope:
  - Wire `+ New Thread` for Staff and Client message pages.
  - Wire client/staff topbar search to actual scoped queries.
  - Wire Client and Staff settings actions to persisted backend preferences/profile endpoints.
  - Wire project export/handoff actions to generated server artifacts.

## Phase 3 · Operational Bridge (Admin -> Staff -> Client)
- Goal:
  - Make work assignment and ownership explicit and traceable.
- Scope:
  - Move from name-based assignment to user-based assignment (`assigneeUserId` + role).
  - Add staff workload/capacity views and overload alerts in Admin.
  - Add ownership-linked SLA watchlists shared across all portals.

## Phase 4 · Realtime Consistency and Resilience
- Goal:
  - Minimize stale windows and prevent silent realtime disconnect drift.
- Scope:
  - Add reconnect/backoff/jitter strategy for SSE stream.
  - Add event sequencing/idempotency guards in clients.
  - Reduce polling dependency where realtime stream already covers updates.

## Phase 5 · Client Readiness and Transparency
- Goal:
  - Improve client confidence and reduce delivery ambiguity.
- Scope:
  - Persisted onboarding checklist model (owners, ETA, completion evidence).
  - Server-driven "changes since last login" digest (audit-backed, not localStorage-only).
  - Versioned handoff package generation with downloadable artifacts and history.
