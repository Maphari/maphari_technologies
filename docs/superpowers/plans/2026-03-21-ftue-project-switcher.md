# FTUE + Project Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give new clients a welcoming first-login experience, give multi-project clients a topbar project switcher, and surface contextual banners for clients in onboarding or project-complete states.

**Architecture:** FTUE state is detected in `maphari-client-dashboard.tsx` using the already-loaded `snapshot.projects` (type `ProjectCard[]`). Five new child components handle the four states and the welcome modal. The project switcher is prop-threaded from the root through `ClientTopbar` — no new context is needed because `selectedProjectId`/`setSelectedProjectId` already exist in the root.

**Tech Stack:** React 18, TypeScript, Next.js 16 (Turbopack), CSS Modules (no Tailwind), existing portal API client pattern (`withAuthorizedSession` + `callGateway`)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/web/src/lib/api/portal/settings.ts` | **Modify** | Add 3 new preference keys to both `get` and `set` key unions |
| `apps/web/src/lib/api/portal/types.ts` | **Modify** | Add same 3 keys to `PortalPreference.key` union |
| `apps/web/src/components/client/maphari-dashboard/pages/ftue-holding-page.tsx` | **Create** | State A: no-project landing page with pending proposals |
| `apps/web/src/components/client/maphari-dashboard/components/ftue-welcome-modal.tsx` | **Create** | One-time first-login overlay with 4 portal feature tiles |
| `apps/web/src/components/client/maphari-dashboard/components/onboarding-banner.tsx` | **Create** | State B: slim persistent setup banner above page content |
| `apps/web/src/components/client/maphari-dashboard/components/completion-banner.tsx` | **Create** | State D: project-complete prompt with service catalog CTA |
| `apps/web/src/components/client/maphari-dashboard/components/project-switcher.tsx` | **Create** | Topbar dropdown listing all client projects |
| `apps/web/src/app/style/client/pages-home.module.css` | **Modify** | Add FTUE holding page + banner CSS classes |
| `apps/web/src/app/style/client/core.module.css` | **Modify** | Add welcome modal + project switcher CSS classes |
| `apps/web/src/components/client/maphari-dashboard/topbar.tsx` | **Modify** | Accept `projects` + `setSelectedProjectId` props; mount `ProjectSwitcher` |
| `apps/web/src/components/client/maphari-client-dashboard.tsx` | **Modify** | Add FTUE state detection, welcome modal fetch, banner mounting |

---

## Task 1: Add preference keys to settings.ts and types.ts

**Files:**
- Modify: `apps/web/src/lib/api/portal/settings.ts`
- Modify: `apps/web/src/lib/api/portal/types.ts`

The three new keys must be added to **three** locations — the `get` key union, the `set` key union, and the `PortalPreference.key` union in `types.ts`. Missing any one location causes a TypeScript error.

- [ ] Open `apps/web/src/lib/api/portal/settings.ts`. The `getPortalPreferenceWithRefresh` key union is at lines 13–30. The `setPortalPreferenceWithRefresh` key union is at lines 51–68.

- [ ] Add `"portal_ftue_v1_seen"`, `"onboarding_banner_dismissed"`, and `"completion_banner_dismissed"` to the `getPortalPreferenceWithRefresh` key union (after `"notificationMutes"` on line 29):

```typescript
    | "notificationMutes"
    | "portal_ftue_v1_seen"
    | "onboarding_banner_dismissed"
    | "completion_banner_dismissed"
```

- [ ] Add the same three keys to the `setPortalPreferenceWithRefresh` key union (after `"notificationMutes"` on line 67, before the closing `";`):

```typescript
    | "notificationMutes"
    | "portal_ftue_v1_seen"
    | "onboarding_banner_dismissed"
    | "completion_banner_dismissed";
```

- [ ] Open `apps/web/src/lib/api/portal/types.ts`. Find the `PortalPreference` interface (around line 353). It has a `key:` field with a union of string literals. Add the same three keys to that union:

```typescript
  key:
    | "savedView"
    | /* ...existing keys... */
    | "notificationMutes"
    | "portal_ftue_v1_seen"
    | "onboarding_banner_dismissed"
    | "completion_banner_dismissed";
```

- [ ] Run TypeScript check:
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: zero errors.

- [ ] Commit:
```bash
git add apps/web/src/lib/api/portal/settings.ts apps/web/src/lib/api/portal/types.ts
git commit -m "feat(portal): add FTUE preference keys to settings API + PortalPreference type"
```

---

## Task 2: Build FtueHoldingPage

**Files:**
- Create: `apps/web/src/components/client/maphari-dashboard/pages/ftue-holding-page.tsx`

This page is shown when a client has no projects yet. It loads their pending proposals and shows CTAs.

- [ ] Create the file:

```typescript
// ════════════════════════════════════════════════════════════════════════════
// ftue-holding-page.tsx — Client Portal: No-project holding page (State A)
// Shown when the client has no ProjectCard in their workspace snapshot.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { PageId } from "../config";
import type { AuthSession } from "@/lib/auth/session";
import { loadPortalProposalsWithRefresh, type PortalProposal } from "@/lib/api/portal/proposals";
import { saveSession } from "@/lib/auth/session";

type FtueHoldingPageProps = {
  session: AuthSession | null;
  navigateTo: (page: PageId) => void;
};

function formatCents(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
}

export function FtueHoldingPage({ session, navigateTo }: FtueHoldingPageProps) {
  const [proposals, setProposals] = useState<PortalProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    void loadPortalProposalsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setProposals(r.data.filter((p) => p.status === "PENDING" || p.status === "SENT"));
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  return (
    <div className={cx("pageBody")}>
      {/* ── Welcome header ──────────────────────────────────────────── */}
      <div className={cx("ftueHoldingHero")}>
        <div className={cx("ftuePulseDot")} />
        <div>
          <h1 className={cx("ftueHoldingTitle")}>Your project is on its way</h1>
          <p className={cx("ftueHoldingSub")}>
            We&apos;re setting things up on our end. You&apos;ll get full access to your project portal once your team has everything ready.
          </p>
        </div>
      </div>

      {/* ── Pending proposals ────────────────────────────────────────── */}
      {loading ? (
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      ) : proposals.length > 0 ? (
        <>
          <div className={cx("ftueProposalHeading")}>
            <Ic n="fileText" sz={13} c="var(--lime)" />
            <span>Your pending proposals</span>
          </div>
          <div className={cx("ftuePropList")}>
            {proposals.map((p) => (
              <div key={p.id} className={cx("ftuePropCard")}>
                <div className={cx("ftuePropCardLeft")}>
                  <div className={cx("fw700", "text14")}>{p.title}</div>
                  <div className={cx("text11", "colorMuted")}>
                    {p.amountCents ? formatCents(p.amountCents) : "—"} &middot;{" "}
                    {new Date(p.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  onClick={() => navigateTo("quoteAcceptance")}
                >
                  Review Proposal <Ic n="arrowRight" sz={11} c="var(--bg)" />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={cx("ftuePropCard", "ftueNoProposals")}>
          <Ic n="clock" sz={16} c="var(--muted2)" />
          <div>
            <div className={cx("fw600", "text13")}>Awaiting your proposal</div>
            <div className={cx("text11", "colorMuted")}>Your team will send over a proposal shortly. You&apos;ll be notified by email.</div>
          </div>
        </div>
      )}

      {/* ── CTA strip ───────────────────────────────────────────────── */}
      <div className={cx("ftueCtas")}>
        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => navigateTo("messages")}>
          <Ic n="message" sz={13} c="var(--muted)" /> Get in touch
        </button>
        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => navigateTo("bookCall")}>
          <Ic n="calendar" sz={13} c="var(--muted)" /> Book an intro call
        </button>
      </div>

      {/* ── What to expect ───────────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>What happens next</span>
        </div>
        <div className={cx("cardBodyPad")}>
          <div className={cx("ftueStepList")}>
            {[
              { n: "1", label: "Proposal review",  sub: "We'll walk you through scope, timeline, and investment." },
              { n: "2", label: "Contract signing",  sub: "Once approved, your contract is sent for e-signature."   },
              { n: "3", label: "Project kickoff",   sub: "Your dedicated team is assigned and your portal activates." },
            ].map((s) => (
              <div key={s.n} className={cx("ftueStep")}>
                <div className={cx("ftueStepNum")}>{s.n}</div>
                <div>
                  <div className={cx("fw600", "text13")}>{s.label}</div>
                  <div className={cx("text11", "colorMuted")}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] Run TypeScript check:
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: zero errors (the component uses existing types and API).

- [ ] Commit:
```bash
git add apps/web/src/components/client/maphari-dashboard/pages/ftue-holding-page.tsx
git commit -m "feat(portal): add FtueHoldingPage for no-project clients"
```

---

## Task 3: Add FTUE + banner CSS classes to pages-home.module.css

**Files:**
- Modify: `apps/web/src/app/style/client/pages-home.module.css`

Append at the very end of the file.

- [ ] Add the following CSS at the end of `pages-home.module.css`:

```css
/* ═══════════════════════════════════════════════════════════════════════ */
/* ── FTUE Holding Page (State A — no project) ──────────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════ */

.ftueHoldingHero {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 28px 32px;
  background: color-mix(in oklab, var(--s1) 92%, var(--lime) 8%);
  border: 1px solid color-mix(in oklab, var(--lime) 20%, var(--b2));
  border-radius: var(--r-lg);
  position: relative;
  overflow: clip;
}

.ftueHoldingHero::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--lime);
  border-radius: var(--r-lg) 0 0 var(--r-lg);
}

.ftuePulseDot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--lime);
  flex-shrink: 0;
  margin-top: 6px;
  animation: livePulse 2s infinite;
}

.ftueHoldingTitle {
  font-family: var(--font-syne), sans-serif;
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin-bottom: 8px;
}

.ftueHoldingSub {
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.6;
  max-width: 56ch;
}

.ftueProposalHeading {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-dm-mono), monospace;
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--lime);
  font-weight: 600;
}

.ftuePropList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ftuePropCard {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: var(--s1);
  border: 1px solid var(--b2);
  border-radius: var(--r-md);
}

.ftuePropCardLeft { flex: 1; min-width: 0; }

.ftueNoProposals {
  gap: 14px;
  color: var(--muted);
}

.ftueCtas {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.ftueStepList {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ftueStep {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.ftueStepNum {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: color-mix(in oklab, var(--lime) 14%, var(--s2));
  border: 1px solid color-mix(in oklab, var(--lime) 25%, var(--b2));
  color: var(--lime);
  font-family: var(--font-dm-mono), monospace;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

/* ── Onboarding Banner (State B) ────────────────────────────────────────── */

.onboardingBanner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  background: color-mix(in oklab, var(--s1) 90%, var(--lime) 10%);
  border: 1px solid color-mix(in oklab, var(--lime) 22%, var(--b2));
  border-radius: var(--r-md);
  flex-wrap: wrap;
}

.onboardingBannerDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--lime);
  flex-shrink: 0;
  animation: livePulse 2s infinite;
}

.onboardingBannerBody { flex: 1; min-width: 0; }

.onboardingBannerTrack {
  height: 4px;
  border-radius: 2px;
  background: var(--b1);
  overflow: hidden;
  margin-top: 6px;
  max-width: 180px;
}

.onboardingBannerFill {
  height: 100%;
  border-radius: inherit;
  background: var(--lime);
  transition: width 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.onboardingBannerDismiss {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted2);
  padding: 4px;
  border-radius: var(--r-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.onboardingBannerDismiss:hover { color: var(--text); background: var(--s2); }

/* ── Completion Banner (State D) ────────────────────────────────────────── */

.completionBanner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  background: var(--s1);
  border: 1px solid var(--b2);
  border-radius: var(--r-md);
  flex-wrap: wrap;
}

.completionBannerIcon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--green) 14%, var(--s2));
  border: 1px solid color-mix(in oklab, var(--green) 25%, var(--b2));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.completionBannerBody { flex: 1; min-width: 0; }
```

- [ ] Run TypeScript check:
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: zero errors (CSS modules don't affect TypeScript).

- [ ] Commit:
```bash
git add apps/web/src/app/style/client/pages-home.module.css
git commit -m "feat(portal): add FTUE holding page + banner CSS classes"
```

---

## Task 4: Build FtueWelcomeModal

**Files:**
- Create: `apps/web/src/components/client/maphari-dashboard/components/ftue-welcome-modal.tsx`

- [ ] Create the file:

```typescript
// ════════════════════════════════════════════════════════════════════════════
// ftue-welcome-modal.tsx — One-time welcome overlay shown on first login
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";

type FtueWelcomeModalProps = {
  onDismiss: () => void;
};

const TILES = [
  { icon: "zap",         label: "Mission Control", sub: "Your project at a glance"   },
  { icon: "message",     label: "Messages",         sub: "Talk directly with your team" },
  { icon: "checkSquare", label: "Deliverables",     sub: "Review and approve work"    },
  { icon: "fileText",    label: "Invoices",          sub: "Track payments and budget"  },
] as const;

export function FtueWelcomeModal({ onDismiss }: FtueWelcomeModalProps) {
  // Close on Escape
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
        aria-labelledby="ftue-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cx("welcomeModalHeader")}>
          <div className={cx("welcomeModalLogo")}>
            <Ic n="zap" sz={18} c="var(--lime)" />
          </div>
          <h2 id="ftue-modal-title" className={cx("welcomeModalTitle")}>
            Welcome to your Maphari portal
          </h2>
          <p className={cx("welcomeModalSub")}>
            Here&apos;s everything you can do from here.
          </p>
        </div>

        <div className={cx("welcomeModalGrid")}>
          {TILES.map((t) => (
            <div key={t.label} className={cx("welcomeModalTile")}>
              <div className={cx("welcomeModalTileIcon")}>
                <Ic n={t.icon} sz={16} c="var(--lime)" />
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

- [ ] Add CSS for the welcome modal to `apps/web/src/app/style/client/core.module.css` (append at end):

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
  background: color-mix(in oklab, var(--lime) 12%, var(--s2));
  border: 1px solid color-mix(in oklab, var(--lime) 25%, var(--b2));
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
  background: color-mix(in oklab, var(--lime) 12%, var(--s2));
  border: 1px solid color-mix(in oklab, var(--lime) 22%, var(--b2));
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

- [ ] Run TypeScript check:
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: zero errors.

- [ ] Commit:
```bash
git add apps/web/src/components/client/maphari-dashboard/components/ftue-welcome-modal.tsx
git add apps/web/src/app/style/client/core.module.css
git commit -m "feat(portal): add FtueWelcomeModal component + CSS"
```

---

## Task 5: Build OnboardingBanner

**Files:**
- Create: `apps/web/src/components/client/maphari-dashboard/components/onboarding-banner.tsx`

- [ ] Create the file:

```typescript
// ════════════════════════════════════════════════════════════════════════════
// onboarding-banner.tsx — Slim setup banner for SETUP/ONBOARDING projects
// Fetches onboarding records internally. Non-dismissible below 50%.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { PageId } from "../config";
import type { AuthSession } from "@/lib/auth/session";
import { loadPortalOnboardingWithRefresh } from "@/lib/api/portal/client-cx";
import { getPortalPreferenceWithRefresh, setPortalPreferenceWithRefresh } from "@/lib/api/portal/settings";
import { saveSession } from "@/lib/auth/session";

type OnboardingBannerProps = {
  session: AuthSession | null;
  navigateTo: (page: PageId) => void;
};

export function OnboardingBanner({ session, navigateTo }: OnboardingBannerProps) {
  const [completionPct, setCompletionPct] = useState(0);
  const [totalSteps, setTotalSteps]       = useState(0);
  const [doneSteps, setDoneSteps]         = useState(0);
  const [dismissed, setDismissed]         = useState(false);
  const [ready, setReady]                 = useState(false);

  useEffect(() => {
    if (!session) return;

    const clientId = session.user.clientId ?? "";
    if (!clientId) return;

    // Load onboarding records and dismiss preference in parallel
    Promise.all([
      loadPortalOnboardingWithRefresh(session, clientId),
      getPortalPreferenceWithRefresh(session, "onboarding_banner_dismissed"),
    ]).then(([onbRes, prefRes]) => {
      if (onbRes.nextSession) saveSession(onbRes.nextSession);
      if (prefRes.nextSession) saveSession(prefRes.nextSession);

      const records = onbRes.data ?? [];
      const total   = records.length;
      const done    = records.filter((r) => r.status === "COMPLETED").length;
      const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

      setTotalSteps(total);
      setDoneSteps(done);
      setCompletionPct(pct);

      // Respect dismiss only if completion is ≥50%
      const isDismissed = prefRes.data?.value === "true" && pct >= 50;
      setDismissed(isDismissed);
      setReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  if (!ready || dismissed) return null;

  function handleDismiss() {
    if (!session || completionPct < 50) return;
    setDismissed(true);
    void setPortalPreferenceWithRefresh(session, {
      key: "onboarding_banner_dismissed",
      value: "true",
    }).then((r) => { if (r.nextSession) saveSession(r.nextSession); });
  }

  return (
    <div className={cx("onboardingBanner")}>
      <div className={cx("onboardingBannerDot")} />
      <div className={cx("onboardingBannerBody")}>
        <div className={cx("flex", "gap6", "flexCenter")}>
          <span className={cx("fw600", "text13")}>Your project setup is underway</span>
          {totalSteps > 0 && (
            <span className={cx("text11", "colorMuted")}>
              — {doneSteps} of {totalSteps} steps complete
            </span>
          )}
        </div>
        {totalSteps > 0 && (
          <div className={cx("onboardingBannerTrack")}>
            <div
              className={cx("onboardingBannerFill")}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        )}
      </div>
      <button
        type="button"
        className={cx("btnSm", "btnAccent")}
        onClick={() => navigateTo("onboarding")}
      >
        Continue Setup <Ic n="arrowRight" sz={11} c="var(--bg)" />
      </button>
      {completionPct >= 50 && (
        <button
          type="button"
          className={cx("onboardingBannerDismiss")}
          onClick={handleDismiss}
          aria-label="Dismiss banner"
        >
          <Ic n="x" sz={13} c="currentColor" />
        </button>
      )}
    </div>
  );
}
```

- [ ] Run TypeScript check:
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: zero errors. If `session.user.clientId` does not exist on the type, inspect `AuthSession` type and use the correct field name. The field may be `session.user.id` or require fetching clientId from the profile — adjust accordingly.

- [ ] Commit:
```bash
git add apps/web/src/components/client/maphari-dashboard/components/onboarding-banner.tsx
git commit -m "feat(portal): add OnboardingBanner for SETUP/ONBOARDING projects"
```

---

## Task 6: Build CompletionBanner

**Files:**
- Create: `apps/web/src/components/client/maphari-dashboard/components/completion-banner.tsx`

- [ ] Create the file:

```typescript
// ════════════════════════════════════════════════════════════════════════════
// completion-banner.tsx — Slim banner for COMPLETE / ARCHIVED projects
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { PageId } from "../config";
import type { AuthSession } from "@/lib/auth/session";
import { getPortalPreferenceWithRefresh, setPortalPreferenceWithRefresh } from "@/lib/api/portal/settings";
import { saveSession } from "@/lib/auth/session";

type CompletionBannerProps = {
  projectId: string;
  session: AuthSession | null;
  navigateTo: (page: PageId) => void;
};

export function CompletionBanner({ projectId, session, navigateTo }: CompletionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady]         = useState(false);

  useEffect(() => {
    if (!session) return;
    void getPortalPreferenceWithRefresh(session, "completion_banner_dismissed").then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      try {
        const ids: string[] = r.data?.value ? JSON.parse(r.data.value) as string[] : [];
        setDismissed(ids.includes(projectId));
      } catch {
        setDismissed(false);
      }
      setReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, projectId]);

  if (!ready || dismissed) return null;

  function handleDismiss() {
    if (!session) return;
    setDismissed(true);
    // Read current list, append this projectId, save
    void getPortalPreferenceWithRefresh(session, "completion_banner_dismissed").then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      let ids: string[] = [];
      try { ids = r.data?.value ? JSON.parse(r.data.value) as string[] : []; } catch { ids = []; }
      if (!ids.includes(projectId)) ids.push(projectId);
      void setPortalPreferenceWithRefresh(session, {
        key: "completion_banner_dismissed",
        value: JSON.stringify(ids),
      }).then((s) => { if (s.nextSession) saveSession(s.nextSession); });
    });
  }

  return (
    <div className={cx("completionBanner")}>
      <div className={cx("completionBannerIcon")}>
        <Ic n="check" sz={15} c="var(--green)" />
      </div>
      <div className={cx("completionBannerBody")}>
        <span className={cx("fw600", "text13")}>This project is complete.</span>{" "}
        <span className={cx("text12", "colorMuted")}>Ready for your next engagement?</span>
      </div>
      <button
        type="button"
        className={cx("btnSm", "btnAccent")}
        onClick={() => navigateTo("serviceCatalog")}
      >
        Explore Services <Ic n="arrowRight" sz={11} c="var(--bg)" />
      </button>
      <button
        type="button"
        className={cx("onboardingBannerDismiss")}
        onClick={handleDismiss}
        aria-label="Dismiss banner"
      >
        <Ic n="x" sz={13} c="currentColor" />
      </button>
    </div>
  );
}
```

- [ ] Run TypeScript check:
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: zero errors.

- [ ] Commit:
```bash
git add apps/web/src/components/client/maphari-dashboard/components/completion-banner.tsx
git commit -m "feat(portal): add CompletionBanner for COMPLETE/ARCHIVED projects"
```

---

## Task 7: Build ProjectSwitcher + add its CSS

**Files:**
- Create: `apps/web/src/components/client/maphari-dashboard/components/project-switcher.tsx`
- Modify: `apps/web/src/app/style/client/core.module.css`

- [ ] Create `project-switcher.tsx`:

```typescript
// ════════════════════════════════════════════════════════════════════════════
// project-switcher.tsx — Topbar project dropdown for multi-project clients
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";

type ProjectOption = {
  id: string;
  name: string;
  status: string;
};

type ProjectSwitcherProps = {
  projects: ProjectOption[];
  selectedProjectId: string | null;
  onSelect: (id: string) => void;
  onViewAll: () => void;
};

type ProjectStatus = "SETUP" | "ONBOARDING" | "ACTIVE" | "COMPLETE" | "ARCHIVED";

function statusBadgeClass(status: string): string {
  const s = status as ProjectStatus;
  if (s === "ACTIVE")                        return "badgeGreen";
  if (s === "SETUP" || s === "ONBOARDING")   return "badgeAmber";
  if (s === "COMPLETE" || s === "ARCHIVED")  return "badgeMuted";
  return "badgeMuted";
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

export function ProjectSwitcher({ projects, selectedProjectId, onSelect, onViewAll }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const selected = projects.find((p) => p.id === selectedProjectId) ?? projects[0];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!selected) return null;

  // Single project: render non-interactive label
  if (projects.length === 1) {
    return (
      <div className={cx("projectSwitcherLabel")}>
        <span className={cx("projectSwitcherName")}>{truncate(selected.name, 28)}</span>
        <span className={cx("badge", statusBadgeClass(selected.status))}>{selected.status}</span>
      </div>
    );
  }

  return (
    <div className={cx("projectSwitcherWrap")} ref={ref}>
      <button
        type="button"
        className={cx("projectSwitcherBtn")}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={cx("projectSwitcherName")}>{truncate(selected.name, 28)}</span>
        <span className={cx("badge", statusBadgeClass(selected.status))}>{selected.status}</span>
        <Ic n="chevronDown" sz={12} c="var(--muted2)" />
      </button>

      {open && (
        <div className={cx("projectSwitcherDropdown")} role="listbox">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={p.id === selectedProjectId}
              className={cx("projectSwitcherRow", p.id === selectedProjectId && "projectSwitcherRowActive")}
              onClick={() => { onSelect(p.id); setOpen(false); }}
            >
              <span className={cx("projectSwitcherRowDot", p.id === selectedProjectId && "projectSwitcherRowDotActive")} />
              <span className={cx("projectSwitcherRowName")}>{truncate(p.name, 28)}</span>
              <span className={cx("badge", statusBadgeClass(p.status))}>{p.status}</span>
            </button>
          ))}
          <div className={cx("projectSwitcherDivider")} />
          <button
            type="button"
            className={cx("projectSwitcherViewAll")}
            onClick={() => { onViewAll(); setOpen(false); }}
          >
            View all projects <Ic n="arrowRight" sz={11} c="var(--muted)" />
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] Append the following to `apps/web/src/app/style/client/core.module.css`:

```css
/* ─── Project Switcher ─────────────────────────────────────────────────── */

.projectSwitcherWrap { position: relative; }

.projectSwitcherLabel {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
}

.projectSwitcherName {
  font-size: 0.8rem;
  font-weight: 600;
  font-family: var(--font-syne), sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.projectSwitcherBtn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border: 1px solid var(--b2);
  border-radius: var(--r-sm);
  background: var(--s2);
  cursor: pointer;
  color: var(--text);
  transition: background 0.15s;
}

.projectSwitcherBtn:hover { background: var(--s3); }

.projectSwitcherDropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 260px;
  background: var(--s1);
  border: 1px solid var(--b2);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-modal);
  z-index: 200;
  overflow: hidden;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.projectSwitcherRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--r-sm);
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text);
  font-size: 0.82rem;
}

.projectSwitcherRow:hover { background: var(--s2); }

.projectSwitcherRowActive { background: color-mix(in oklab, var(--lime) 8%, var(--s2)); }

.projectSwitcherRowDot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--b3);
  flex-shrink: 0;
}

.projectSwitcherRowDotActive { background: var(--lime); }

.projectSwitcherRowName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.projectSwitcherDivider {
  height: 1px;
  background: var(--b1);
  margin: 4px 0;
}

.projectSwitcherViewAll {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--r-sm);
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  font-size: 0.78rem;
}

.projectSwitcherViewAll:hover { background: var(--s2); color: var(--text); }
```

- [ ] Run TypeScript check:
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: zero errors.

- [ ] Commit:
```bash
git add apps/web/src/components/client/maphari-dashboard/components/project-switcher.tsx
git add apps/web/src/app/style/client/core.module.css
git commit -m "feat(portal): add ProjectSwitcher component + CSS"
```

---

## Task 8: Wire topbar to mount ProjectSwitcher

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/topbar.tsx`

- [ ] Add new optional props to `ClientTopbarProps` (after line 30, before the closing `};`):

```typescript
  /** List of projects for the switcher (shown if length > 1) */
  projects?: Array<{ id: string; name: string; status: string }>;
  /** Currently selected project id */
  selectedProjectId?: string | null;
  /** Called when user selects a different project */
  onProjectSelect?: (id: string) => void;
  /** Called when user clicks "View all projects" in switcher */
  onViewAllProjects?: () => void;
```

- [ ] Add the import for `ProjectSwitcher` at the top of `topbar.tsx` (after existing imports):

```typescript
import { ProjectSwitcher } from "./components/project-switcher";
```

- [ ] Update the function signature to destructure the new props (after `planLabel` on line 57):

```typescript
  projects,
  selectedProjectId,
  onProjectSelect,
  onViewAllProjects,
```

- [ ] Mount `ProjectSwitcher` in the topbar JSX, inside `<header>` after the `topbarTitle` div and before the `topbarActions` div (after line 120):

```tsx
      {/* ── Project switcher (multi-project clients) ─────────────────── */}
      {projects && projects.length > 0 && onProjectSelect && onViewAllProjects ? (
        <ProjectSwitcher
          projects={projects}
          selectedProjectId={selectedProjectId ?? null}
          onSelect={onProjectSelect}
          onViewAll={onViewAllProjects}
        />
      ) : null}
```

- [ ] Run TypeScript check:
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: zero errors.

- [ ] Commit:
```bash
git add apps/web/src/components/client/maphari-dashboard/topbar.tsx
git commit -m "feat(portal): mount ProjectSwitcher in ClientTopbar"
```

---

## Task 9: Wire maphari-client-dashboard.tsx — FTUE state + banners + welcome modal

**Files:**
- Modify: `apps/web/src/components/client/maphari-client-dashboard.tsx`

This is the main wiring task. All new imports go at the top; all logic goes in the component body.

- [ ] Add imports at the top of `maphari-client-dashboard.tsx` (after existing page imports):

```typescript
// ── FTUE components
import { FtueHoldingPage } from "./maphari-dashboard/pages/ftue-holding-page";
import { FtueWelcomeModal } from "./maphari-dashboard/components/ftue-welcome-modal";
import { OnboardingBanner } from "./maphari-dashboard/components/onboarding-banner";
import { CompletionBanner } from "./maphari-dashboard/components/completion-banner";
```

- [ ] Add FTUE state variables in the component body, after the existing `[selectedProjectId, setSelectedProjectId]` state (around line 278):

```typescript
  // ── FTUE: welcome modal ─────────────────────────────────────────────────
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (!session) return;
    void getPortalPreferenceWithRefresh(session, "portal_ftue_v1_seen").then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.data?.value) setShowWelcomeModal(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  function handleWelcomeModalDismiss() {
    setShowWelcomeModal(false);
    if (!session) return;
    void setPortalPreferenceWithRefresh(session, {
      key: "portal_ftue_v1_seen",
      value: "true",
    }).then((r) => { if (r.nextSession) saveSession(r.nextSession); });
  }

  // ── FTUE: project state detection ──────────────────────────────────────
  type ProjectStatus = "SETUP" | "ONBOARDING" | "ACTIVE" | "COMPLETE" | "ARCHIVED";
  const activeProject = snapshot.projects.find((p) => p.id === selectedProjectId) ?? snapshot.projects[0] ?? null;
  const activeStatus  = (activeProject?.status ?? "") as ProjectStatus;
  const hasNoProjects = !loading && snapshot.projects.length === 0;
  const isOnboarding  = activeStatus === "SETUP" || activeStatus === "ONBOARDING";
  const isComplete    = activeStatus === "COMPLETE" || activeStatus === "ARCHIVED";
```

- [ ] Update the `<ClientTopbar>` call to pass project switcher props (add after the existing `planLabel` prop in the `<ClientTopbar />` call):

```tsx
            projects={snapshot.projects.map((p) => ({ id: p.id, name: p.name, status: p.status }))}
            selectedProjectId={selectedProjectId}
            onProjectSelect={setSelectedProjectId}
            onViewAllProjects={() => handleNavigate("myProjects")}
```

- [ ] In the render, replace the content area section (`<div className={styles.content}>`) to wrap the existing content and insert FTUE conditionals. Find this block:

```tsx
          <div className={styles.content} style={contentStyle}>
            <DashboardErrorBoundary>
            {/* ── Overview ────────────────────────────────────────────── */}
            {nav.activePage === "home" && (
```

And replace it with:

```tsx
          <div className={styles.content} style={contentStyle}>
            <DashboardErrorBoundary>
            {/* ── FTUE: No-project holding page ───────────────────────── */}
            {hasNoProjects ? (
              <FtueHoldingPage session={session} navigateTo={handleNavigate} />
            ) : (
              <>
                {/* ── Contextual banners ──────────────────────────────── */}
                {isOnboarding && (
                  <OnboardingBanner session={session} navigateTo={handleNavigate} />
                )}
                {isComplete && activeProject && (
                  <CompletionBanner projectId={activeProject.id} session={session} navigateTo={handleNavigate} />
                )}

                {/* ── Overview ──────────────────────────────────────────── */}
                {nav.activePage === "home" && (
```

- [ ] Close the new fragment `</>` and `)}` **after** the last existing `nav.activePage` block (before the closing `</DashboardErrorBoundary>`):

Find:
```tsx
            </DashboardErrorBoundary>
```

And make sure the structure is:
```tsx
              </>
            )}
            </DashboardErrorBoundary>
```

- [ ] Mount the welcome modal just before `</DashboardToastCtx.Provider>` (in the return, after the Quick Ask button and before the toast stack):

```tsx
      {/* ── FTUE Welcome Modal ──────────────────────────────────────────── */}
      {showWelcomeModal && (
        <FtueWelcomeModal onDismiss={handleWelcomeModalDismiss} />
      )}
```

- [ ] Run TypeScript check:
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: zero errors. Fix any prop type mismatches reported.

- [ ] Commit:
```bash
git add apps/web/src/components/client/maphari-client-dashboard.tsx
git commit -m "feat(portal): wire FTUE state detection, banners, welcome modal, project switcher"
```

---

## Task 10: Final verification

- [ ] Run the full TypeScript check one more time:
```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: zero errors.

- [ ] Start the dev server and navigate to `/client` (or local equivalent):
```bash
# Server should already be running via preview_start
# Navigate to the client dashboard
```

- [ ] Verify success criteria:
  - [ ] **SC1:** With a logged-in client who has no projects → `FtueHoldingPage` renders (not an empty Mission Control)
  - [ ] **SC2:** Topbar shows `ProjectSwitcher` button when `snapshot.projects.length > 1`; label only when 1 project
  - [ ] **SC3:** First-ever login → welcome modal appears; clicking "Got it" closes it; reload → does not reappear
  - [ ] **SC4:** Project in `SETUP` status → `OnboardingBanner` appears above page content
  - [ ] **SC5:** Project in `COMPLETE` status → `CompletionBanner` appears; dismiss → gone permanently

- [ ] Commit any final fixes, then done.
