# FTUE + Project Switcher — Design Spec
**Date:** 2026-03-21
**Status:** Approved
**Scope:** Client portal — first-time user experience and multi-project navigation

---

## Problem

1. New clients log in and see Mission Control with empty graphs — no guidance, no context.
2. Clients with multiple projects have no way to switch between them.
3. There is no "what happens next" signal for any client state (new, onboarding, active, complete).

---

## Types and Existing APIs

### Existing function (correct name)
`loadPortalProjectsWithRefresh(session)` — in `apps/web/src/lib/api/portal/projects.ts`.
Returns `AuthorizedResult<PortalProject[]>`.

`PortalProject.status` is typed as `string`. The spec uses a local type alias to narrow it safely:
```ts
type ProjectStatus = "SETUP" | "ONBOARDING" | "ACTIVE" | "COMPLETE" | "ARCHIVED";
const status = project.status as ProjectStatus;
```
This satisfies TypeScript without modifying the shared type.

### Preference keys (in `apps/web/src/lib/api/portal/settings.ts`)
Three new keys must be added to **both** the `getPortalPreferenceWithRefresh` and `setPortalPreferenceWithRefresh` key unions:
- `"portal_ftue_v1_seen"` — whether the welcome modal has been shown (value: `"true"`)
- `"onboarding_banner_dismissed"` — whether the onboarding banner has been dismissed (value: `"true"`)
- `"completion_banner_dismissed"` — JSON array of projectIds whose completion banner has been dismissed (value: `JSON.stringify(string[])`)

The dynamic-per-project banner is encoded as a JSON array stored under a single fixed key, avoiding a dynamic key union problem.

---

## Four Client States

### Loading state (applies to all)
While `loadPortalProjectsWithRefresh` is pending, render three `skeletonBlock` divs inside `pageBody`. On error, render a standard error card with a "Retry" button that re-calls the API.

### State A — No project yet (proposal/quote stage)
**Trigger:** `projects.length === 0`
**Render:** `FtueHoldingPage` (replaces Mission Control entirely)

`FtueHoldingPage` content:
- Agency welcome headline + sub-copy ("Your project is on its way")
- List of pending proposals from `loadPortalProposalsWithRefresh()` — each card: proposal title, created date, value, "Review Proposal →" button navigating to `PageId: "quoteAcceptance"`
- If no proposals: single "Get in touch" card linking to `PageId: "messages"`
- "Book an intro call" secondary button → `PageId: "bookCall"`

### State B — Project in SETUP or ONBOARDING
**Trigger:** `status === "SETUP" || status === "ONBOARDING"`
**Render:** Mission Control as normal + `OnboardingBanner` pinned above page content

`OnboardingBanner` rules:
- If onboarding completion < 50%: banner always shows, **no dismiss button** (it is intentionally persistent)
- If onboarding completion ≥ 50%: banner shows an X button; clicking it stores `"onboarding_banner_dismissed": "true"` and hides the banner permanently
- On load, check the stored preference AND the current completion %:
  - If dismissed preference is set AND completion ≥ 50%: hide banner
  - If dismissed preference is set BUT completion has dropped below 50%: show banner again (dismiss is only valid above 50%)
- Completion % is fetched by `OnboardingBanner` itself via `loadPortalOnboardingWithRefresh(session, clientId)` from `apps/web/src/lib/api/portal/client-cx.ts`. `clientId` comes from the session object. Calculation: `Math.round((records.filter(r => r.status === "COMPLETED").length / records.length) * 100)`. If the fetch fails or returns empty, treat completion as 0% (banner shows, not dismissible).

Banner content: `"Your project setup is underway"` + step count from onboarding + `"Continue Setup →"` button → `PageId: "onboarding"`

### State C — Active project (happy path)
**Trigger:** `status === "ACTIVE"` (or any status not matching A/B/D)
**Render:** Mission Control as normal — no banner

### State D — Project complete or archived
**Trigger:** `status === "COMPLETE" || status === "ARCHIVED"`
**Render:** Mission Control as normal + `CompletionBanner`

`CompletionBanner` rules:
- On load, read `"completion_banner_dismissed"` preference (JSON array of projectIds)
- If current `projectId` is in the array: do not show banner
- If not in the array: show banner
- Dismiss: add `projectId` to the array, save preference, hide banner

Banner content: `"This project is complete. Ready for your next engagement?"` + `"Explore Services →"` → `PageId: "serviceCatalog"` + dismiss X button

---

## Project Switcher

### Location
Topbar. The topbar currently renders a static project name from the `useProjectLayer` hook. The switcher replaces this with a `ProjectSwitcher` component.

### Project context switching (architecture)
Project switching requires changing the selected `projectId` in the dashboard root state. The existing `useProjectLayer` hook reads `projectId` from state managed in `maphari-client-dashboard.tsx` (the root). The root must:
1. Receive the full `PortalProject[]` list (already fetched for state detection in `dashboard-core.tsx`)
2. Expose a `setSelectedProjectId(id: string)` setter alongside the current `projectId`
3. Pass both `projects` and `setSelectedProjectId` down to `topbar.tsx` via props
4. `ProjectSwitcher` calls `setSelectedProjectId(id)` when a row is clicked

This is prop threading — no new context or hook needed. The `projectId` already flows as a prop through the existing component tree.

### Behaviour
- **Single project:** renders as a non-interactive label — project name + status chip. No dropdown.
- **Multiple projects:** renders as a button — project name + status chip + `chevronDown` icon. Click opens dropdown.

### Dropdown anatomy
```
┌─────────────────────────────────────┐
│  ● Acme Brand Rebrand    ACTIVE     │  ← current project (lime dot + highlight row)
│    Acme Phase 2          SETUP      │
│  ─────────────────────────────────  │
│    View all projects  →             │  ← navigateTo("myProjects")
└─────────────────────────────────────┘
```
- Project name truncated at 28 chars with ellipsis if longer
- Status badge uses existing `badge` + `badgeGreen`/`badgeAmber`/`badgeMuted` classes
- Clicking a row: `setSelectedProjectId(project.id)`, close dropdown
- Clicking "View all projects": `navigateTo("myProjects")`, close dropdown
- `navigateTo` comes from `useClientNavigation()` (already available in topbar)
- Closes on outside click (standard `useClickOutside` pattern or equivalent ref+blur)
- Closes on Escape key

---

## First-Login Welcome Modal

### Trigger
On every render of `dashboard-core.tsx`, after the FTUE state is resolved:
1. Read `"portal_ftue_v1_seen"` preference
2. If not set: set local state `showWelcomeModal = true`
3. This is checked only once (on mount, guarded by `useEffect`)

### Content
Title: `"Welcome to your Maphari portal"`
Sub: `"Here's everything you can do from here."`

Four icon + label tiles in a 2×2 grid (CSS: `grid2x2` class):
1. `zap` icon — Mission Control — Your project at a glance
2. `message` icon — Messages — Talk directly with your team
3. `checkSquare` icon — Deliverables — Review and approve work
4. `fileText` icon — Invoices — Track payments and budget

Single CTA: `"Got it, let's go →"`

### Dismiss behaviour
Clicking CTA or pressing Escape: call `setPortalPreferenceWithRefresh` with `"portal_ftue_v1_seen": "true"`, set `showWelcomeModal = false`. Modal is never shown again.

Clicking outside the modal card also dismisses (same handler). Does not block navigation.

---

## Architecture

### New files
| File | Purpose |
|------|---------|
| `apps/web/src/components/client/maphari-dashboard/pages/ftue-holding-page.tsx` | State A — no project |
| `apps/web/src/components/client/maphari-dashboard/components/ftue-welcome-modal.tsx` | First-login overlay |
| `apps/web/src/components/client/maphari-dashboard/components/onboarding-banner.tsx` | State B banner |
| `apps/web/src/components/client/maphari-dashboard/components/completion-banner.tsx` | State D banner |
| `apps/web/src/components/client/maphari-dashboard/components/project-switcher.tsx` | Topbar dropdown |

### Modified files
| File | Change |
|------|--------|
| `apps/web/src/components/client/maphari-client-dashboard.tsx` | All FTUE state logic lives here (the dashboard root). Load projects list, detect state, render correct root view, mount banners and welcome modal. `selectedProjectId` state already exists (line 277) — wire it to accept project list and expose setter to topbar. `dashboard-core.tsx` is a shared utility module (toasts, loading fallback) and must NOT receive client-specific logic. |
| `apps/web/src/components/client/maphari-dashboard/topbar.tsx` | Accept `projects` + `setSelectedProjectId` props; mount `ProjectSwitcher` |
| `apps/web/src/lib/api/portal/settings.ts` | Add three new keys to both key unions: `"portal_ftue_v1_seen"`, `"onboarding_banner_dismissed"`, `"completion_banner_dismissed"` |

### Backend — no new routes needed
All data from existing endpoints:
- `GET /portal/projects` → project list (via `loadPortalProjectsWithRefresh`)
- `GET /portal/proposals` → pending proposals for State A holding page
- `POST /portal/preferences` → store FTUE and banner dismiss preferences

---

## CSS

**New classes in `pages-home.module.css`:** `ftueHoldingPage`, `ftuePropList`, `ftuePropCard`, `ftueProposalCta`, `onboardingBanner`, `completionBanner`, `bannerDismissBtn`

**New classes in `core.module.css`:** `welcomeModal`, `welcomeModalOverlay`, `welcomeModalGrid`, `welcomeModalTile`, `projectSwitcherBtn`, `projectSwitcherDropdown`, `projectSwitcherRow`, `projectSwitcherRowActive`, `projectSwitcherDivider`

Tokens: `--lime`, `--s1`, `--s2`, `--b1`, `--b2`, `--r-md`, `--r-lg`, `--font-syne`, `--font-dm-mono`

---

## State Detection Logic (pseudocode for `dashboard-core.tsx`)

All logic lives in `maphari-client-dashboard.tsx` (the client dashboard root). `dashboard-core.tsx` is shared utility only — do not modify it.

```
// In maphari-client-dashboard.tsx

// 1. Fetch projects (async, loading skeleton while pending)
result = await loadPortalProjectsWithRefresh(session)
if result.unauthorized → redirect to login
if result.error → show error card with retry button
projects: PortalProject[] = result.data

// 2. Route to correct view
if projects.length === 0:
  render <FtueHoldingPage session={session} navigateTo={navigateTo} />

else:
  project = projects.find(p => p.id === selectedProjectId) ?? projects[0]
  status = project.status as ProjectStatus

  render existing page switch (Mission Control + all pages)

  if status === "SETUP" || status === "ONBOARDING":
    render <OnboardingBanner session={session} navigateTo={navigateTo} />
    // OnboardingBanner fetches its own onboarding data internally

  if status === "COMPLETE" || status === "ARCHIVED":
    render <CompletionBanner projectId={project.id} session={session} navigateTo={navigateTo} />

// 3. Welcome modal (independent of state, checked on mount via useEffect)
ftueSeenPref = await getPortalPreferenceWithRefresh(session, "portal_ftue_v1_seen")
if ftueSeenPref.data === null:
  showWelcomeModal = true
```

---

## Success Criteria

1. New client (no projects) → sees `FtueHoldingPage` with their pending proposals (or "Get in touch" if none), not an empty Mission Control
2. Client in SETUP with <50% onboarding → sees Mission Control + persistent non-dismissible onboarding banner
3. Client in SETUP with ≥50% onboarding → sees Mission Control + dismissible onboarding banner; dismissal is permanent
4. Client in ACTIVE with 2 projects → sees project switcher button in topbar; clicking shows dropdown; selecting a row switches project context
5. Client in ACTIVE with 1 project → sees non-interactive project label in topbar (no dropdown)
6. First login ever → welcome modal appears on top of whatever state view; dismissed → never appears again
7. Completed project → completion banner shows with dismiss X; dismiss → never shows again for that projectId
8. Loading: while project list is fetching → three skeleton blocks shown
9. Error: if project list fetch fails → error card with retry button
10. `pnpm --filter @maphari/web exec tsc --noEmit` → zero errors
