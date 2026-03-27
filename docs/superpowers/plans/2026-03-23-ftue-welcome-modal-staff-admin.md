# FTUE Welcome Modal — Staff & Admin Portals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the old client onboarding wizard and add first-time-login welcome modals to the staff and admin dashboards, matching the client FTUE modal pattern.

**Architecture:** Each portal gets a self-contained `FtueWelcomeModal` component that reads/writes `localStorage` to persist seen state, and is wired into its dashboard's root component alongside the existing session-timeout overlay pattern. The admin portal gets a new `ui.tsx` with an `Ic` SVG renderer matching the client/staff pattern.

**Tech Stack:** React 19, Next.js 16, TypeScript, CSS Modules, localStorage

**Spec:** `docs/superpowers/specs/2026-03-23-ftue-welcome-modal-staff-admin-design.md`

---

## File Map

| Action | Path |
|--------|------|
| **Modify** | `apps/web/src/components/staff/staff-dashboard/ui.tsx` — add `arrowRight` to IC_PATHS |
| **Create** | `apps/web/src/components/admin/dashboard/ui.tsx` — new `Ic` component with required icons |
| **Delete** | `apps/web/src/components/client/maphari-dashboard/components/onboarding-wizard.tsx` |
| **Modify** | `apps/web/src/components/client/maphari-client-dashboard.tsx` — remove wizard state/effect/render |
| **Create** | `apps/web/src/components/staff/staff-dashboard/components/ftue-welcome-modal.tsx` |
| **Modify** | `apps/web/src/app/style/staff/core.module.css` — add welcomeModal* classes |
| **Modify** | `apps/web/src/components/staff/maphari-staff-dashboard.tsx` — wire modal |
| **Create** | `apps/web/src/components/admin/dashboard/components/ftue-welcome-modal.tsx` |
| **Modify** | `apps/web/src/app/style/admin/core.module.css` — add welcomeModal* classes |
| **Modify** | `apps/web/src/components/admin/maphari-dashboard.tsx` — wire modal |

---

### Task 1: Add `arrowRight` to staff `IC_PATHS`

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/ui.tsx:71`

- [ ] **Step 1: Add the missing path**

  In `apps/web/src/components/staff/staff-dashboard/ui.tsx`, the `IC_PATHS` record ends at line 71 with `arrowUp`. Add `arrowRight` immediately after it:

  ```ts
  arrowUp: "M5 10l7-7m0 0l7 7m-7-7v18",
  arrowRight: "M14 5l7 7m0 0l-7 7m7-7H3",
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no new errors related to `ui.tsx`.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/components/staff/staff-dashboard/ui.tsx
  git commit -m "fix(staff): add arrowRight to staff IC_PATHS"
  ```

---

### Task 2: Create admin `ui.tsx` with `Ic` component

**Files:**
- Create: `apps/web/src/components/admin/dashboard/ui.tsx`

- [ ] **Step 1: Create the file**

  Create `apps/web/src/components/admin/dashboard/ui.tsx` with this exact content:

  ```tsx
  "use client";

  // ── Ic — SVG icon component (admin dashboard) ──────────────────────────────
  // Mirrors the pattern in client/maphari-dashboard/ui.tsx and
  // staff/staff-dashboard/ui.tsx. Add icons here as needed.

  const IC_PATHS: Record<string, string> = {
    users:     "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    briefcase: "M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM10 5h4v2h-4V5z",
    dollar:    "M12 2v2m0 16v2M6 12H4m16 0h-2m-4-5.196l-1.5-.866M7.5 17.062l-1.5-.866m11.5-7.196l-1.5.866M7.5 6.938L6 7.804M17 12a5 5 0 11-10 0 5 5 0 0110 0z",
    activity:  "M22 12h-4l-3 9L9 3l-3 9H2",
    sparkle:   "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z",
    arrowRight:"M14 5l7 7m0 0l-7 7m7-7H3",
  };

  export function Ic({
    n,
    sz = 16,
    c = "currentColor",
    sw = 1.75,
  }: {
    n: string;
    sz?: number;
    c?: string;
    sw?: number;
  }) {
    return (
      <svg
        width={sz}
        height={sz}
        viewBox="0 0 24 24"
        fill="none"
        stroke={c}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={IC_PATHS[n] ?? ""} />
      </svg>
    );
  }
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/components/admin/dashboard/ui.tsx
  git commit -m "feat(admin): add Ic SVG component to admin dashboard"
  ```

---

### Task 3: Remove old client onboarding wizard

**Files:**
- Delete: `apps/web/src/components/client/maphari-dashboard/components/onboarding-wizard.tsx`
- Modify: `apps/web/src/components/client/maphari-client-dashboard.tsx`

- [ ] **Step 1: Delete the wizard file**

  ```bash
  rm apps/web/src/components/client/maphari-dashboard/components/onboarding-wizard.tsx
  ```

- [ ] **Step 2: Remove the import from `maphari-client-dashboard.tsx`**

  Remove line 109 exactly:
  ```ts
  // DELETE this line:
  import { OnboardingWizard } from "./maphari-dashboard/components/onboarding-wizard";
  ```

- [ ] **Step 3: Remove `showWizard` state and its `useEffect`**

  Remove lines 321–331 (the entire block below):
  ```ts
  // DELETE these lines:
  // ── Onboarding wizard (self-service setup, shown once per client) ────────
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!session) return;
    void getPortalPreferenceWithRefresh(session, "onboarding_wizard_seen").then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data?.value !== "true") setShowWizard(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);
  ```

- [ ] **Step 4: Remove the wizard render block**

  Around lines 1014–1022, remove only the wizard block. The FTUE modal block does **not** carry a `!showWelcomeModal` guard in the current source — the spec mentions removing it as a precaution, but it is not present, so nothing needs changing on the FTUE render line itself.

  Remove this block entirely:
  ```tsx
  {/* ── Onboarding Wizard (first-login self-service setup) ───────────── */}
  {showWizard && !showWelcomeModal && (
    <OnboardingWizard session={session ?? null} onClose={() => setShowWizard(false)} />
  )}
  ```

  The FTUE modal block stays exactly as-is:
  ```tsx
  {/* ── FTUE Welcome Modal ──────────────────────────────────────────── */}
  {showWelcomeModal && (
    <FtueWelcomeModal onDismiss={handleWelcomeModalDismiss} />
  )}
  ```

  > Note: Steps 2 and 3 above will shift line numbers in this file. Locate the wizard block by its comment text, not its line number.

- [ ] **Step 5: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no errors (all `showWizard` / `OnboardingWizard` references gone).

- [ ] **Step 6: Commit**

  ```bash
  git add -A apps/web/src/components/client/
  git commit -m "feat(client): remove onboarding wizard — superseded by FTUE welcome modal"
  ```

---

### Task 4: Create staff FTUE welcome modal component

**Files:**
- Create: `apps/web/src/components/staff/staff-dashboard/components/ftue-welcome-modal.tsx`

- [ ] **Step 1: Create the `components/` directory**

  ```bash
  mkdir -p apps/web/src/components/staff/staff-dashboard/components
  ```

- [ ] **Step 2: Create the component**

  ```tsx
  // ════════════════════════════════════════════════════════════════════════════
  // ftue-welcome-modal.tsx — One-time welcome overlay shown on staff first login
  // ════════════════════════════════════════════════════════════════════════════
  "use client";

  import { useEffect } from "react";
  import { cx } from "../style";
  import { Ic } from "../ui";

  type FtueWelcomeModalProps = {
    onDismiss: () => void;
  };

  const TILES = [
    { icon: "zap",     label: "My Tasks",     sub: "Today's work, organised"   },
    { icon: "message", label: "Messages",      sub: "Talk to clients & team"    },
    { icon: "package", label: "Deliverables",  sub: "What's due and when"       },
    { icon: "clock",   label: "Time Log",      sub: "Track hours per project"   },
  ] as const;

  export function FtueWelcomeModal({ onDismiss }: FtueWelcomeModalProps) {
    useEffect(() => {
      function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") onDismiss();
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [onDismiss]);

    return (
      <div className={cx("welcomeModalOverlay")} onClick={onDismiss}>
        <div
          className={cx("welcomeModal")}
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-ftue-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={cx("welcomeModalHeader")}>
            <div className={cx("welcomeModalLogo")}>
              <Ic n="zap" sz={18} c="var(--accent)" />
            </div>
            <h2 id="staff-ftue-modal-title" className={cx("welcomeModalTitle")}>
              Welcome to your Staff Workspace
            </h2>
            <p className={cx("welcomeModalSub")}>
              Here&apos;s where your work lives.
            </p>
          </div>

          <div className={cx("welcomeModalGrid")}>
            {TILES.map((t) => (
              <div key={t.label} className={cx("welcomeModalTile")}>
                <div className={cx("welcomeModalTileIcon")}>
                  <Ic n={t.icon} sz={16} c="var(--accent)" />
                </div>
                <div className={cx("fw600", "text13")}>{t.label}</div>
                <div className={cx("text11", "colorMuted")}>{t.sub}</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={cx("btnAccent", "welcomeModalCta")}
            onClick={onDismiss}
          >
            Got it, let&apos;s go <Ic n="arrowRight" sz={13} c="var(--bg)" />
          </button>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/components/staff/staff-dashboard/components/ftue-welcome-modal.tsx
  git commit -m "feat(staff): add FTUE welcome modal component"
  ```

---

### Task 5: Add staff welcome modal CSS

**Files:**
- Modify: `apps/web/src/app/style/staff/core.module.css`

- [ ] **Step 1: Append CSS at end of `core.module.css`**

  Add the following block at the very end of `apps/web/src/app/style/staff/core.module.css`.
  Note: unlike the client CSS which uses `var(--lime)` for accent colour, here `var(--accent)` is used — it resolves to `#f97316` (ember orange) on `.staffRoot`. The `color-mix` tints are against the same token.

  ```css
  /* ─── FTUE Welcome Modal ───────────────────────────────────────────────── */

  .welcomeModalOverlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .welcomeModal {
    background: var(--s1);
    border: 1px solid var(--b2);
    border-radius: var(--r-lg);
    padding: 32px;
    max-width: 480px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
    box-shadow: var(--shadow-modal);
  }

  .welcomeModalHeader { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }

  .welcomeModalLogo {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: color-mix(in oklab, var(--accent) 12%, var(--s2));
    border: 1px solid color-mix(in oklab, var(--accent) 25%, var(--b2));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .welcomeModalTitle {
    font-family: var(--font-syne), sans-serif;
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .welcomeModalSub { font-size: 0.8rem; color: var(--muted); }

  .welcomeModalGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .welcomeModalTile {
    background: var(--s2);
    border: 1px solid var(--b2);
    border-radius: var(--r-md);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .welcomeModalTileIcon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: color-mix(in oklab, var(--accent) 12%, var(--s2));
    border: 1px solid color-mix(in oklab, var(--accent) 22%, var(--b2));
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2px;
  }

  .welcomeModalCta {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    border-radius: var(--r-md);
    font-size: 0.85rem;
    font-weight: 700;
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add apps/web/src/app/style/staff/core.module.css
  git commit -m "feat(staff): add FTUE welcome modal CSS"
  ```

---

### Task 6: Wire staff FTUE modal into `maphari-staff-dashboard.tsx`

**Files:**
- Modify: `apps/web/src/components/staff/maphari-staff-dashboard.tsx`

- [ ] **Step 1: Add the import** (after the last existing import, e.g. after line ~160)

  ```ts
  import { FtueWelcomeModal } from "./staff-dashboard/components/ftue-welcome-modal";
  ```

- [ ] **Step 2: Add state and effect** (after the existing state block near line 168)

  ```ts
  // ── FTUE: welcome modal ─────────────────────────────────────────────────
  // Default false to avoid SSR hydration mismatch; localStorage read in effect.
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("staff_ftue_v1_seen")) setShowWelcomeModal(true);
  }, []);

  function handleWelcomeModalDismiss() {
    setShowWelcomeModal(false);
    localStorage.setItem("staff_ftue_v1_seen", "true");
  }
  ```

- [ ] **Step 3: Add render block** (before `<DashboardToastStack …/>` near line 1712)

  ```tsx
  {/* ── FTUE Welcome Modal ──────────────────────────────────────────── */}
  {showWelcomeModal && (
    <FtueWelcomeModal onDismiss={handleWelcomeModalDismiss} />
  )}
  ```

- [ ] **Step 4: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/staff/maphari-staff-dashboard.tsx
  git commit -m "feat(staff): wire FTUE welcome modal into staff dashboard"
  ```

---

### Task 7: Create admin FTUE welcome modal component

**Files:**
- Create: `apps/web/src/components/admin/dashboard/components/ftue-welcome-modal.tsx`

- [ ] **Step 1: Create the `components/` directory**

  ```bash
  mkdir -p apps/web/src/components/admin/dashboard/components
  ```

- [ ] **Step 2: Create the component**

  ```tsx
  // ════════════════════════════════════════════════════════════════════════════
  // ftue-welcome-modal.tsx — One-time welcome overlay shown on admin first login
  // ════════════════════════════════════════════════════════════════════════════
  "use client";

  import { useEffect } from "react";
  import { cx } from "../style";
  import { Ic } from "../ui";

  type FtueWelcomeModalProps = {
    onDismiss: () => void;
  };

  const TILES = [
    { icon: "users",     label: "Clients",  sub: "Manage accounts & health"   },
    { icon: "briefcase", label: "Projects", sub: "Portfolio & operations"      },
    { icon: "dollar",    label: "Revenue",  sub: "Invoices & cash flow"        },
    { icon: "activity",  label: "Team",     sub: "Staff access & performance"  },
  ] as const;

  export function FtueWelcomeModal({ onDismiss }: FtueWelcomeModalProps) {
    useEffect(() => {
      function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") onDismiss();
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [onDismiss]);

    return (
      <div className={cx("welcomeModalOverlay")} onClick={onDismiss}>
        <div
          className={cx("welcomeModal")}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-ftue-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={cx("welcomeModalHeader")}>
            <div className={cx("welcomeModalLogo")}>
              <Ic n="sparkle" sz={18} c="var(--accent)" />
            </div>
            <h2 id="admin-ftue-modal-title" className={cx("welcomeModalTitle")}>
              Welcome to your Admin Console
            </h2>
            <p className={cx("welcomeModalSub")}>
              Your full-picture operations hub.
            </p>
          </div>

          <div className={cx("welcomeModalGrid")}>
            {TILES.map((t) => (
              <div key={t.label} className={cx("welcomeModalTile")}>
                <div className={cx("welcomeModalTileIcon")}>
                  <Ic n={t.icon} sz={16} c="var(--accent)" />
                </div>
                <div className={cx("fw600", "text13")}>{t.label}</div>
                <div className={cx("text11", "colorMuted")}>{t.sub}</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={cx("btnAccent", "welcomeModalCta")}
            onClick={onDismiss}
          >
            Got it, let&apos;s go <Ic n="arrowRight" sz={13} c="var(--bg)" />
          </button>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/components/admin/dashboard/components/ftue-welcome-modal.tsx
  git commit -m "feat(admin): add FTUE welcome modal component"
  ```

---

### Task 8: Add admin welcome modal CSS

**Files:**
- Modify: `apps/web/src/app/style/admin/core.module.css`

- [ ] **Step 1: Append CSS at end of `core.module.css`**

  Add the following block at the very end of `apps/web/src/app/style/admin/core.module.css`.
  `var(--accent)` resolves to `#8b6fff` (royal purple) on `.dashboardRoot`.

  ```css
  /* ─── FTUE Welcome Modal ───────────────────────────────────────────────── */

  .welcomeModalOverlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .welcomeModal {
    background: var(--s1);
    border: 1px solid var(--b2);
    border-radius: var(--r-lg);
    padding: 32px;
    max-width: 480px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
    box-shadow: var(--shadow-modal);
  }

  .welcomeModalHeader { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }

  .welcomeModalLogo {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: color-mix(in oklab, var(--accent) 12%, var(--s2));
    border: 1px solid color-mix(in oklab, var(--accent) 25%, var(--b2));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .welcomeModalTitle {
    font-family: var(--font-syne), sans-serif;
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .welcomeModalSub { font-size: 0.8rem; color: var(--muted); }

  .welcomeModalGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .welcomeModalTile {
    background: var(--s2);
    border: 1px solid var(--b2);
    border-radius: var(--r-md);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .welcomeModalTileIcon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: color-mix(in oklab, var(--accent) 12%, var(--s2));
    border: 1px solid color-mix(in oklab, var(--accent) 22%, var(--b2));
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2px;
  }

  .welcomeModalCta {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    border-radius: var(--r-md);
    font-size: 0.85rem;
    font-weight: 700;
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add apps/web/src/app/style/admin/core.module.css
  git commit -m "feat(admin): add FTUE welcome modal CSS"
  ```

---

### Task 9: Wire admin FTUE modal into `maphari-dashboard.tsx`

**Files:**
- Modify: `apps/web/src/components/admin/maphari-dashboard.tsx`

- [ ] **Step 1: Add the import** (after the last existing import)

  ```ts
  import { FtueWelcomeModal } from "./dashboard/components/ftue-welcome-modal";
  ```

- [ ] **Step 2: Add state and effect** (after the existing state block near line 204)

  ```ts
  // ── FTUE: welcome modal ─────────────────────────────────────────────────
  // Default false to avoid SSR hydration mismatch; localStorage read in effect.
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("admin_ftue_v1_seen")) setShowWelcomeModal(true);
  }, []);

  function handleWelcomeModalDismiss() {
    setShowWelcomeModal(false);
    localStorage.setItem("admin_ftue_v1_seen", "true");
  }
  ```

- [ ] **Step 3: Add render block** (immediately before the closing `</div>` of the root render wrapper, after the session-timeout block's closing `})`)

  ```tsx
  {/* ── FTUE Welcome Modal ──────────────────────────────────────────── */}
  {showWelcomeModal && (
    <FtueWelcomeModal onDismiss={handleWelcomeModalDismiss} />
  )}
  ```

- [ ] **Step 4: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/admin/maphari-dashboard.tsx
  git commit -m "feat(admin): wire FTUE welcome modal into admin dashboard"
  ```

---

### Task 10: Final verification

- [ ] **Step 1: Full TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: zero errors.

- [ ] **Step 2: Smoke-test client portal**

  - Clear `portal_ftue_v1_seen` from portal preferences (or use a fresh test user)
  - Log in as a client → FTUE welcome modal appears (lime accent, 4 tiles)
  - Dismiss → modal gone, reload → modal does not reappear
  - Confirm no console errors about `OnboardingWizard`

- [ ] **Step 3: Smoke-test staff portal**

  - Clear `localStorage.removeItem("staff_ftue_v1_seen")` in browser console
  - Log in as staff (or reload) → orange welcome modal appears with: My Tasks, Messages, Deliverables, Time Log
  - All 4 tiles show orange icons
  - Click "Got it, let's go" → modal dismisses
  - Reload → modal does not reappear

- [ ] **Step 4: Smoke-test admin portal**

  - Clear `localStorage.removeItem("admin_ftue_v1_seen")` in browser console
  - Log in as admin (or reload) → purple welcome modal appears with: Clients, Projects, Revenue, Team
  - All 4 tiles show purple icons
  - Click "Got it, let's go" → modal dismisses
  - Reload → modal does not reappear
