# FTUE Welcome Modal — Staff & Admin Portals

**Date:** 2026-03-23
**Status:** Approved

---

## Context

The client portal already has a working FTUE (first-time user experience) welcome modal (`ftue-welcome-modal.tsx`) that shows a 4-tile grid of key features on first login. The old multi-step `onboarding-wizard.tsx` is redundant and should be removed.

Staff and admin portals currently show nothing on first login. This spec covers:
1. Removing the old client onboarding wizard
2. Adding equivalent FTUE welcome modals for staff and admin, styled with their respective accent colours

---

## Design

### What's being removed

- `apps/web/src/components/client/maphari-dashboard/components/onboarding-wizard.tsx` — deleted entirely
- All references in `maphari-client-dashboard.tsx`:
  - `import { OnboardingWizard }` line
  - `showWizard` state (`useState(false)`)
  - The `useEffect` that calls `getPortalPreferenceWithRefresh(session, "onboarding_wizard_seen")` — remove the entire effect including the API call
  - The render block `{showWizard && !showWelcomeModal && <OnboardingWizard … />}`
  - The `!showWelcomeModal` guard on the FTUE modal render block (no longer needed once wizard is gone)

### Staff FTUE modal

**File:** `apps/web/src/components/staff/staff-dashboard/components/ftue-welcome-modal.tsx`
**Accent:** `#f97316` (ember orange)
**Headline:** "Welcome to your Staff Workspace"
**Subline:** "Here's where your work lives."
**CTA:** "Got it, let's go →"

| Icon (from `ui.tsx`) | Label | Subtitle |
|---|---|---|
| `zap` | My Tasks | Today's work, organised |
| `message` | Messages | Talk to clients & team |
| `package` | Deliverables | What's due and when |
| `clock` | Time Log | Track hours per project |

**Persistence:** `localStorage` key `staff_ftue_v1_seen`

### Admin FTUE modal

**File:** `apps/web/src/components/admin/dashboard/components/ftue-welcome-modal.tsx`
**Accent:** `#8b6fff` (royal purple)
**Headline:** "Welcome to your Admin Console"
**Subline:** "Your full-picture operations hub."
**CTA:** "Got it, let's go →"

| Icon (from `ui.tsx`) | Label | Subtitle |
|---|---|---|
| `users` | Clients | Manage accounts & health |
| `briefcase` | Projects | Portfolio & operations |
| `dollar` | Revenue | Invoices & cash flow |
| `activity` | Team | Staff access & performance |

**Persistence:** `localStorage` key `admin_ftue_v1_seen`

---

## Component Structure

Both modals follow the exact same pattern as the client `ftue-welcome-modal.tsx`:
- `TILES` const array (icon, label, sub)
- Single `useEffect` for Escape key
- `onDismiss` prop called on CTA click or Escape
- Uses local `Ic` component from respective dashboard's `ui.tsx`

### Staff `Ic` component
The staff dashboard has its own `ui.tsx` at:
`apps/web/src/components/staff/staff-dashboard/ui.tsx` — use its `Ic` component (same shape: `n`, `sz`, `c` props).

**Note:** `arrowRight` is missing from the staff `IC_PATHS`. Add it as part of this task:
```ts
arrowRight: "M14 5l7 7m0 0l-7 7m7-7H3",
```

### Admin `Ic` component
The admin dashboard has **no `ui.tsx`** today. As part of this task, create:
`apps/web/src/components/admin/dashboard/ui.tsx`

It must export an `Ic` function with the same signature as the client/staff versions (`n`, `sz`, `c`, `sw`) and include at minimum: `users`, `briefcase`, `dollar`, `activity`, `arrowRight`.

---

## CSS

### Staff
Add `.welcomeModalOverlay`, `.welcomeModal`, `.welcomeModalHeader`, `.welcomeModalLogo`, `.welcomeModalTitle`, `.welcomeModalSub`, `.welcomeModalGrid`, `.welcomeModalTile`, `.welcomeModalTileIcon`, `.welcomeModalCta` to:
`apps/web/src/app/style/staff/core.module.css`

Identical structure to client CSS but accent references use `var(--accent)` (orange for staff).

### Admin
Same classes added to:
`apps/web/src/app/style/admin/core.module.css`

Accent references use `var(--accent)` (purple for admin).

---

## Wiring

### Staff (`maphari-staff-dashboard.tsx`)
- Add `showWelcomeModal` state (default `false`) — **must default to `false`, not initialised from `localStorage` directly, to avoid SSR hydration mismatch**
- On mount (`useEffect` with empty deps): check `localStorage.getItem("staff_ftue_v1_seen")` — if falsy, set `showWelcomeModal(true)`
- Dismiss handler: `setShowWelcomeModal(false)` + `localStorage.setItem("staff_ftue_v1_seen", "true")`
- Render: `{showWelcomeModal && <FtueWelcomeModal onDismiss={handleWelcomeModalDismiss} />}` at the root

### Admin (`maphari-dashboard.tsx`)
- Same pattern, key `admin_ftue_v1_seen`

---

## Verification

1. Log in as a staff user → staff welcome modal appears with orange accent and 4 tiles (My Tasks, Messages, Deliverables, Time Log)
2. Click "Got it, let's go" → modal dismisses, `staff_ftue_v1_seen` set in localStorage
3. Reload → modal does not reappear
4. Log in as admin → admin welcome modal appears with purple accent and 4 tiles (Clients, Projects, Revenue, Team)
5. Same dismiss & persist behaviour
6. Client login → only FtueWelcomeModal shows; old wizard is gone, no JS errors
