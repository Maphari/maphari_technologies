# Shell & Navigation Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all broken shell and navigation wiring across the three dashboards — dead buttons in the staff topbar, the broken admin help link, the dead admin `bizdev` page stub, the admin CMD+K conflict, the unthreaded staff `filterProjectId`, the client messages icon opening compose instead of inbox, the hardcoded plan tier badge, and the empty `onDisconnectIntegration`/`onRevokeSession` handlers.

**Architecture:** All fixes are in shell/orchestrator files and the three topbar components. No new CSS, no new pages, no backend changes. All navigation is handled by calling the existing `setActivePage` / `handlePageChange` / `handleNavigate` orchestrator functions that are already wired to every page.

**Tech Stack:** Next.js 16, React, TypeScript.

---

## File Map

| File | Change |
|------|--------|
| `apps/web/src/components/staff/staff-dashboard/topbar.tsx` | Add `onNavigateSettings` + `onNavigateProfile` props; wire in `handleProfileLink` |
| `apps/web/src/components/staff/maphari-staff-dashboard.tsx` | Pass new topbar props |
| `apps/web/src/components/admin/dashboard/topbar.tsx` | Add `onOpenHelp?: () => void` prop; replace `<Link>` with `<button onClick={onOpenHelp}>` |
| `apps/web/src/components/admin/maphari-dashboard.tsx` | Pass `onOpenHelp` to `AdminTopbar`; remove CMD+K listener from sidebar conflict |
| `apps/web/src/components/admin/dashboard/sidebar.tsx` | Remove CMD+K keydown listener (move ownership to orchestrator) |
| `apps/web/src/components/admin/dashboard/config.ts` | Remove dead `"bizdev"` PageId entry |
| `apps/web/src/components/admin/dashboard/constants.ts` | Remove `"bizdev"` from `pageTitles` |
| `apps/web/src/components/admin/dashboard/nav-icon.tsx` | Remove `"bizdev"` icon case |
| `apps/web/src/components/staff/staff-dashboard/pages/tasks-page.tsx` | Add `initialProjectFilter?: string` prop; filter project dropdown on mount |
| `apps/web/src/components/staff/maphari-staff-dashboard.tsx` | Pass `filterProjectId` as `initialProjectFilter` to `TasksPage`; reset after navigation |
| `apps/web/src/components/client/maphari-client-dashboard.tsx` | Change `onNewMessage` on topbar from `quickCompose.open()` to `handleNavigate("messages")`; implement real `onDisconnectIntegration` and `onRevokeSession` |
| `apps/web/src/components/client/maphari-dashboard/topbar.tsx` | Add `planLabel?: string` prop; use instead of hardcoded `"Retainer Pro"` |

---

## Task 1: Fix Staff Topbar — "Settings" and "My Profile" Dead Buttons

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/topbar.tsx`
- Modify: `apps/web/src/components/staff/maphari-staff-dashboard.tsx`

**Context:** `StaffTopbarProps` has `PROFILE_LINKS = ["Settings", "My Profile", "Help"]`. `handleProfileLink` only handles `"Help"`. Clicking the other two closes the menu silently.

- [ ] **Step 1: Add two optional props to `StaffTopbarProps`**

  In `apps/web/src/components/staff/staff-dashboard/topbar.tsx`, find `type StaffTopbarProps` (around line 9). After the existing `onOpenHelp?: () => void;` line add:

  ```tsx
  onNavigateSettings?: () => void;
  onNavigateProfile?: () => void;
  ```

- [ ] **Step 2: Destructure the new props**

  In `export function StaffTopbar({`, find the destructured props (around line 42). After `onOpenHelp,` add:

  ```tsx
  onNavigateSettings,
  onNavigateProfile,
  ```

- [ ] **Step 3: Wire them in `handleProfileLink`**

  Find `handleProfileLink` (lines 99–102):
  ```tsx
  function handleProfileLink(label: string): void {
    setProfileMenuOpen(false);
    if (label === "Help") { onOpenHelp?.(); return; }
  }
  ```
  Replace with:
  ```tsx
  function handleProfileLink(label: string): void {
    setProfileMenuOpen(false);
    if (label === "Settings")   { onNavigateSettings?.(); return; }
    if (label === "My Profile") { onNavigateProfile?.();  return; }
    if (label === "Help")       { onOpenHelp?.();         return; }
  }
  ```

- [ ] **Step 4: Pass props from the orchestrator**

  In `apps/web/src/components/staff/maphari-staff-dashboard.tsx`, find `<StaffTopbar` (line 897). After `onOpenHelp={() => setActivePage("knowledge")}` add:

  ```tsx
  onNavigateSettings={() => { setActivePage("settings"); setSidebarOpen(false); }}
  onNavigateProfile={() => { setActivePage("myemployment"); setSidebarOpen(false); }}
  ```

  (`"settings"` is the settings page; `"myemployment"` is the My Employment / profile page.)

- [ ] **Step 5: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no output.

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/components/staff/staff-dashboard/topbar.tsx \
          apps/web/src/components/staff/maphari-staff-dashboard.tsx
  git commit -m "fix(staff): wire Settings and My Profile topbar dropdown buttons to correct pages"
  ```

---

## Task 2: Fix Admin Topbar — Replace Broken External Help Link

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/topbar.tsx`
- Modify: `apps/web/src/components/admin/maphari-dashboard.tsx`

**Context:** The admin topbar renders a `<Link href="https://designsystem.digital.gov/...">` for the Help button — a hardcoded external URL with no relation to this product. Staff and client topbars both call `onOpenHelp?.()`. Admin should do the same.

- [ ] **Step 1: Add `onOpenHelp` to `AdminTopbar` props**

  In `apps/web/src/components/admin/dashboard/topbar.tsx`, find the props interface (around line 18):
  ```tsx
  export function AdminTopbar({
    title,
    unreadNotificationsCount,
    email,
    loggingOut,
    onOpenNotifications,
    onOpenMessages,
    onLogout,
    onMenuToggle,
  }: {
    ...
    onMenuToggle?: () => void;
  }) {
  ```
  Add to the type object:
  ```tsx
  onOpenHelp?: () => void;
  ```
  And to the destructured params:
  ```tsx
  onOpenHelp,
  ```

- [ ] **Step 2: Replace `<Link>` with `<button>`**

  Find the help link (lines 100–108):
  ```tsx
  <Link
    href="https://designsystem.digital.gov/components/header/"
    target="_blank"
    rel="noreferrer"
    className={`${styles.iconBtn} ${styles.topbarHelpBtn}`}
    aria-label="Open help docs"
  >
    <DashboardUtilityIcon kind="help" className={styles.topbarIcon} />
  </Link>
  ```
  Replace with:
  ```tsx
  <button
    type="button"
    className={`${styles.iconBtn} ${styles.topbarHelpBtn}`}
    aria-label="Open help center"
    onClick={onOpenHelp}
  >
    <DashboardUtilityIcon kind="help" className={styles.topbarIcon} />
  </button>
  ```

  Also remove the `Link` import from `next/link` at the top if it's no longer used anywhere in the file:
  ```bash
  grep -n "Link\|next/link" apps/web/src/components/admin/dashboard/topbar.tsx
  ```
  If the only usage was this help link, remove `import Link from "next/link";`.

- [ ] **Step 3: Pass `onOpenHelp` from the orchestrator**

  In `apps/web/src/components/admin/maphari-dashboard.tsx`, find `<AdminTopbar` (line 444). Add:
  ```tsx
  onOpenHelp={() => handlePageChange("knowledgeBaseAdmin")}
  ```

- [ ] **Step 4: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no output.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/admin/dashboard/topbar.tsx \
          apps/web/src/components/admin/maphari-dashboard.tsx
  git commit -m "fix(admin): replace broken external help link with internal knowledge base navigation"
  ```

---

## Task 3: Remove Dead `bizdev` PageId Stub

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/config.ts`
- Modify: `apps/web/src/components/admin/dashboard/constants.ts`
- Modify: `apps/web/src/components/admin/dashboard/nav-icon.tsx`

**Context:** `"bizdev"` is declared as a `PageId` type value but has no nav entry, no render branch, and is unreachable. It is dead code.

- [ ] **Step 1: Remove from `config.ts` PageId type**

  ```bash
  grep -n "bizdev" apps/web/src/components/admin/dashboard/config.ts
  ```
  Find the `PageId` union type (e.g. `export type PageId = "dashboard" | "bizdev" | ...`). Remove `"bizdev"` from the union.

- [ ] **Step 2: Remove from `constants.ts` pageTitles**

  ```bash
  grep -n "bizdev" apps/web/src/components/admin/dashboard/constants.ts
  ```
  Remove the `bizdev: "..."` entry from `pageTitles`.

- [ ] **Step 3: Remove icon case from `nav-icon.tsx`**

  ```bash
  grep -n "bizdev" apps/web/src/components/admin/dashboard/nav-icon.tsx
  ```
  Remove the `case "bizdev":` block.

- [ ] **Step 4: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no output.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/admin/dashboard/config.ts \
          apps/web/src/components/admin/dashboard/constants.ts \
          apps/web/src/components/admin/dashboard/nav-icon.tsx
  git commit -m "fix(admin): remove dead bizdev PageId stub — unreachable from any nav or render branch"
  ```

---

## Task 4: Fix Admin CMD+K Conflict — Sidebar vs Orchestrator

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/sidebar.tsx`

**Context:** The sidebar registers a `keydown` listener on lines ~186–198 that intercepts `⌘K` and opens the All Pages overlay. The orchestrator's `useCommandSearch` / `useKeyboardShortcuts` also registers `⌘K`. The sidebar fires first, consuming the event, so command search is never reachable via keyboard. Fix: remove the `⌘K` listener from the sidebar. The All Pages overlay can still be opened by the Apps Grid button in the topbar.

- [ ] **Step 1: Find the sidebar CMD+K listener**

  ```bash
  grep -n "metaKey\|ctrlKey\|KeyK\|keydown\|open-app-grid" apps/web/src/components/admin/dashboard/sidebar.tsx | head -20
  ```

- [ ] **Step 2: Remove the `⌘K` case from the keydown listener**

  Find the keydown handler in the sidebar. It likely looks like:
  ```tsx
  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setAppGridOpen(true);  // or similar
    }
  }
  ```
  Remove only the `if ((e.metaKey || e.ctrlKey) && e.key === "k")` branch. Keep any other key handling intact.

  If the keydown listener only handled `⌘K`, remove the entire listener and its `addEventListener`/`removeEventListener` cleanup in the `useEffect`.

- [ ] **Step 3: Verify the All Pages overlay is still reachable**

  The topbar Apps Grid button (`openAppGrid()` → `window.dispatchEvent(new CustomEvent("admin:open-app-grid"))`) should still open the overlay. Confirm this event listener in the sidebar is still intact — don't remove it.

- [ ] **Step 4: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no output.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/admin/dashboard/sidebar.tsx
  git commit -m "fix(admin): remove sidebar CMD+K listener — was intercepting before orchestrator command search"
  ```

---

## Task 5: Thread `filterProjectId` to TasksPage in Staff Dashboard

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/tasks-page.tsx`
- Modify: `apps/web/src/components/staff/maphari-staff-dashboard.tsx`

**Context:** `DeliveryStatusPage.onGoTasks(projectId)` sets `filterProjectId` state in the orchestrator and navigates to the tasks page, but `filterProjectId` is never passed to `TasksPage`. The project filter is silently lost.

- [ ] **Step 1: Read TasksPage props interface**

  ```bash
  grep -n "type TasksPageProps\|interface TasksPage\|isActive\|session\|filterProject\|selectedProject" apps/web/src/components/staff/staff-dashboard/pages/tasks-page.tsx | head -15
  ```

- [ ] **Step 2: Add `initialProjectFilter?: string` prop to TasksPage**

  Find the props type/interface for `TasksPage`. Add:
  ```tsx
  initialProjectFilter?: string;
  ```
  Destructure it in the function signature.

- [ ] **Step 3: Apply the filter on mount and when prop changes**

  In `TasksPage`, find where the project filter is stored (likely a `selectedProjectId` or `filterProject` state). Add a `useEffect` that applies the initial filter:

  ```tsx
  useEffect(() => {
    if (initialProjectFilter) {
      setSelectedProjectId(initialProjectFilter);  // use the actual state setter name
    }
  }, [initialProjectFilter]);
  ```

  Read the file to find the exact state variable name before implementing.

- [ ] **Step 4: Pass `filterProjectId` from orchestrator**

  In `apps/web/src/components/staff/maphari-staff-dashboard.tsx`, find `<TasksPage` (around line 988). Add:
  ```tsx
  initialProjectFilter={filterProjectId}
  ```

- [ ] **Step 5: Reset `filterProjectId` after navigation**

  In the orchestrator, find the `DeliveryStatusPage.onGoTasks` handler:
  ```tsx
  onGoTasks={(projectId) => {
    setFilterProjectId(projectId);
    setActivePage("tasks");
  }}
  ```
  This is correct as-is. Now add a reset so the filter clears if the user navigates away and back:

  Find where `activePage` changes (the `setActivePage` calls or a `useEffect` on `activePage`). When `activePage` changes away from `"tasks"` and back, the filter should clear. The simplest fix: in the `TasksPage` `useEffect`, also call `setSelectedProjectId(undefined)` when `initialProjectFilter` is undefined (i.e., the prop was cleared).

  Actually — since we reset `filterProjectId` in orchestrator state only when navigating away: add to the `onGoTasks` call site:
  ```tsx
  onGoTasks={(projectId) => {
    setFilterProjectId(projectId);
    setActivePage("tasks");
    setSidebarOpen(false);
    // filterProjectId will be reset to undefined in TasksPage when the prop changes back
  }}
  ```
  And separately, when any other nav item sets activePage away from "tasks", reset filterProjectId:
  ```tsx
  // In the orchestrator's setActivePage calls, or add a useEffect:
  useEffect(() => {
    if (activePage !== "tasks") setFilterProjectId(undefined);
  }, [activePage]);
  ```

- [ ] **Step 6: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no output.

- [ ] **Step 7: Commit**

  ```bash
  git add apps/web/src/components/staff/staff-dashboard/pages/tasks-page.tsx \
          apps/web/src/components/staff/maphari-staff-dashboard.tsx
  git commit -m "fix(staff): thread filterProjectId from DeliveryStatus to TasksPage — project filter was silently dropped"
  ```

---

## Task 6: Fix Client Messages Topbar Icon — Open Inbox Not Compose

**Files:**
- Modify: `apps/web/src/components/client/maphari-client-dashboard.tsx`

**Context:** The topbar messages (envelope) icon calls `onNewMessage={() => quickCompose.open()}`, opening the compose overlay. This is confusing — an envelope icon should open the inbox. The floating "Quick Ask" button (bottom-right, already exists) handles new message composition. Fix: change the topbar envelope to navigate to the messages page.

- [ ] **Step 1: Find the topbar `onNewMessage` prop**

  In `apps/web/src/components/client/maphari-client-dashboard.tsx`, find line 457:
  ```tsx
  onNewMessage={() => quickCompose.open()}
  ```

- [ ] **Step 2: Change it to navigate to the messages page**

  Replace with:
  ```tsx
  onNewMessage={() => handleNavigate("messages")}
  ```

- [ ] **Step 3: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no output.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-client-dashboard.tsx
  git commit -m "fix(client): topbar messages icon navigates to inbox instead of opening compose overlay"
  ```

---

## Task 7: Fix Client Plan Tier Badge — Read from Profile API

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/topbar.tsx`

**Context:** The profile dropdown shows a hardcoded badge `<span className={cx("badge", "badgeAccent")}>Retainer Pro</span>`. The orchestrator at line 418 already computes `planLabel` from `profile?.tier` and passes it as a prop, but `ClientTopbarProps` does not declare it and the topbar doesn't use it.

- [ ] **Step 1: Add `planLabel` prop to `ClientTopbarProps`**

  In `apps/web/src/components/client/maphari-dashboard/topbar.tsx`, find `type ClientTopbarProps` (line 9). Add:
  ```tsx
  planLabel?: string | null;
  ```

- [ ] **Step 2: Destructure it in the function**

  In `export function ClientTopbar({...}`, find the destructured props (around line 37). Add after `brandLogoUrl,`:
  ```tsx
  planLabel,
  ```

- [ ] **Step 3: Use it in the dropdown**

  Find line 199:
  ```tsx
  <span className={cx("badge", "badgeAccent")}>Retainer Pro</span>
  ```
  Replace with:
  ```tsx
  {planLabel ? (
    <span className={cx("badge", "badgeAccent")}>{planLabel}</span>
  ) : null}
  ```
  This hides the badge entirely if no tier is set, rather than showing a lie.

- [ ] **Step 4: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no output.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/topbar.tsx
  git commit -m "fix(client): read plan tier badge from profile API instead of hardcoding 'Retainer Pro'"
  ```

---

## Task 8: Fix Client Shell — Implement `onDisconnectIntegration` and `onRevokeSession`

**Files:**
- Modify: `apps/web/src/components/client/maphari-client-dashboard.tsx`

**Context:** `SettingsPage` is passed `onDisconnectIntegration={() => {}}` and `onRevokeSession={() => {}}` — both empty. The `disconnectGoogleCalendarWithRefresh` API function already exists in `apps/web/src/lib/api/portal/integrations.ts`. For session revocation, check if a portal auth API exists.

- [ ] **Step 1: Find the integrations API import path**

  ```bash
  grep -rn "disconnectGoogle\|disconnectIntegration\|revokeSession" apps/web/src/lib/api/portal/ | head -10
  ```

- [ ] **Step 2: Check if a session revoke API exists**

  ```bash
  grep -rn "revokeSession\|revoke.*session\|DELETE.*session" apps/web/src/lib/api/portal/ | head -10
  ```

  If no session revoke API exists, add a toast notification explaining the limitation instead of a silent no-op.

- [ ] **Step 3: Import the integrations API function**

  In `apps/web/src/components/client/maphari-client-dashboard.tsx`, find the existing imports from `"@/lib/api/portal/..."`. Add:
  ```tsx
  import { disconnectGoogleCalendarWithRefresh } from "@/lib/api/portal/integrations";
  ```

- [ ] **Step 4: Implement `onDisconnectIntegration`**

  Find the `<SettingsPage` render (around line 559). Replace:
  ```tsx
  onDisconnectIntegration={() => {}}
  ```
  With a real handler. Integration IDs in the settings page are string IDs (e.g. `"google-calendar"`). Map them to the appropriate API call:
  ```tsx
  onDisconnectIntegration={(id) => {
    if (!session) return;
    if (id === "google-calendar") {
      void disconnectGoogleCalendarWithRefresh(session).then((result) => {
        if (result.nextSession) saveSession(result.nextSession);
        if (result.data?.disconnected) {
          pushToast({ type: "success", message: "Google Calendar disconnected." });
        } else {
          pushToast({ type: "error", message: result.data?.error?.message ?? "Failed to disconnect." });
        }
      });
    }
  }}
  ```

- [ ] **Step 5: Implement `onRevokeSession`**

  If a session revoke API exists, implement it similarly. If not, replace the empty handler with a toast:
  ```tsx
  onRevokeSession={(_id) => {
    pushToast({ type: "info", message: "Session management is handled via your admin. Contact support to revoke a session." });
  }}
  ```

- [ ] **Step 6: Verify TypeScript**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no output.

- [ ] **Step 7: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-client-dashboard.tsx
  git commit -m "fix(client): implement real onDisconnectIntegration and onRevokeSession handlers in shell"
  ```

---

## Final Verification

- [ ] **Step 1: Run TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no output.

- [ ] **Step 2: Manually verify all 8 fixes**

  - [ ] Staff topbar → click avatar → "Settings" navigates to settings page ✓
  - [ ] Staff topbar → click avatar → "My Profile" navigates to My Employment page ✓
  - [ ] Admin topbar → click help (?) icon → navigates to Knowledge Base Admin page ✓
  - [ ] Admin CMD+K → opens command search overlay, not All Pages overlay ✓
  - [ ] Staff: go to Delivery Status → click "Go to Tasks" on a project → Tasks page shows that project selected ✓
  - [ ] Client topbar → click envelope icon → navigates to Messages inbox (not compose) ✓
  - [ ] Client topbar profile dropdown → badge shows real tier from profile (or hidden if no tier) ✓
  - [ ] Client Settings → disconnect Google Calendar → shows success/error toast (not silent) ✓
