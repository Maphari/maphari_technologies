# Onboarding Hub Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the two onboarding pages into one unified Onboarding Hub wired to real API data, remove the separate Onboarding Status page.

**Architecture:** Rewrite `onboarding-page.tsx` to fetch project detail + onboarding records + offboarding tasks from existing portal API functions. Add a compact progress stepper header above the tabs (reusing `obs*` CSS from `pages-misc.module.css`). Remove `onboardingStatus` from nav config and the render switch, then delete `onboarding-status-page.tsx`.

**Tech Stack:** React 18, TypeScript, CSS Modules, Next.js 16. Portal API pattern: `loadPortalXxxWithRefresh(session, ...)` → `AuthorizedResult<T>`. Session from `useProjectLayer()`. All API functions re-exported from `apps/web/src/lib/api/portal/index.ts`.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx` | **Rewrite** | Unified hub — real data, progress stepper, 5 wired tabs |
| `apps/web/src/components/client/maphari-dashboard/pages/onboarding-status-page.tsx` | **Delete** | Absorbed into the hub |
| `apps/web/src/components/client/maphari-dashboard/config.ts` | **Modify** | Remove `onboardingStatus` PageId and nav item |
| `apps/web/src/components/client/maphari-client-dashboard.tsx` | **Modify** | Remove `onboardingStatus` render case and import |

---

## Key API Functions (all in `apps/web/src/lib/api/portal`)

```ts
// Project data for Welcome tab
loadPortalProjectDetailWithRefresh(session, projectId)
  → AuthorizedResult<PortalProjectDetail>
  // .name, .ownerName, .startAt, .dueAt, .budgetCents, .collaborators[]

// Onboarding stages for progress stepper + Checklist tab
loadPortalOnboardingWithRefresh(session, clientId)
  → AuthorizedResult<PortalOnboardingRecord[]>
  // .id, .stageLabel, .status ("COMPLETED"|"IN_PROGRESS"|"PENDING"), .sortOrder,
  // .completedAt, .estimatedAt, .notes

// Toggle a checklist item
patchPortalOnboardingRecordWithRefresh(session, clientId, recordId, { status })
  → AuthorizedResult<PortalOnboardingRecord>

// Offboarding tasks for Offboarding tab (lazy — fetched only when tab is visited)
loadPortalOffboardingWithRefresh(session, clientId)
  → AuthorizedResult<PortalOffboardingTask[]>
  // .id, .groupName, .label, .status, .actionLabel, .completedAt

// Toggle an offboarding task
patchPortalOffboardingTaskWithRefresh(session, clientId, taskId, { status, completedAt })
  → AuthorizedResult<PortalOffboardingTask>
```

`clientId` = `session.user.clientId ?? ""`. `projectId` from `useProjectLayer()`.

---

## CSS Classes

All CSS classes come from the existing split files loaded via the `styles` spread in `style.ts`. No new CSS needed.

**Progress stepper header** — reuse existing `obs*` classes from `pages-misc.module.css`:
- `obsKpiRow` / `obsKpiCard` / `obsKpiLabel` / `obsKpiValue` / `obsKpiMeta`
- `obsStepper` / `obsStepperTitle` / `obsStages` / `obsStage` / `obsStageDone` / `obsStageActive`
- `obsStageNode` / `obsConnector` / `obsConnectorDone` / `obsStageLabel` / `obsStageDate`

**Tab content** — reuse existing `onboardFlow*` classes from `pages-misc.module.css` and `pages-d.module.css`:
- All current `onboardFlow*` class names stay valid — just wire real data into the same JSX structure.

**Utility classes** (via `cx()`) — `card`, `badge`, `badgeGreen`, `badgeMuted`, `badgeAmber`, `pageBody`, `pageHeader`, `pageTitle`, `pageEyebrow`, `pageSub`, `pageActions`, `btnSm`, `btnGhost`, `btnAccent`, `skeletonBlock`, `skeleH68`, `skeleH80`, `flexCol`, `gap12`, `toastStack`, `toast`, `toastSuccess`

---

## Task 1: Rewrite `onboarding-page.tsx` — unified hub with real data

**Files:**
- Rewrite: `apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx`

This task replaces the entire file. The new component:
1. Imports `useProjectLayer` → gets `session` + `projectId`
2. Fetches project detail, onboarding records (on mount), offboarding tasks (lazy on tab visit)
3. Renders a compact progress header (KPI row + stepper) above the tabs
4. Renders 5 tabs: Welcome (real project data), Onboarding Checklist (real records + live toggle), How We Work (static), Offboarding (real tasks + live toggle), Testimonial (static)
5. Uses optimistic updates for toggles (rollback on error)

- [ ] **Step 1: Read current file to understand all CSS class references before overwriting**

```bash
# Already read above — no action needed, proceed to Step 2
```

- [ ] **Step 2: Rewrite `onboarding-page.tsx`**

Replace the entire file with:

```tsx
// ════════════════════════════════════════════════════════════════════════════
// onboarding-page.tsx — Unified Onboarding Hub
// Data     : loadPortalProjectDetailWithRefresh  → Welcome tab
//            loadPortalOnboardingWithRefresh     → Progress stepper + Checklist
//            loadPortalOffboardingWithRefresh    → Offboarding tab (lazy)
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalProjectDetailWithRefresh,
  loadPortalOnboardingWithRefresh,
  patchPortalOnboardingRecordWithRefresh,
  loadPortalOffboardingWithRefresh,
  patchPortalOffboardingTaskWithRefresh,
  type PortalProjectDetail,
  type PortalOnboardingRecord,
  type PortalOffboardingTask,
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────

type OnboardTab = "Welcome" | "Onboarding Checklist" | "How We Work" | "Offboarding" | "Testimonial";
type StageStatus = "done" | "active" | "pending";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toStageStatus(s: string): StageStatus {
  if (s === "COMPLETED") return "done";
  if (s === "IN_PROGRESS") return "active";
  return "pending";
}

function fmt(raw: string | null | undefined): string {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function fmtCurrency(cents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency", currency: "ZAR", maximumFractionDigits: 0,
  }).format(cents / 100);
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: OnboardTab[] = ["Welcome", "Onboarding Checklist", "How We Work", "Offboarding", "Testimonial"];

const HOW_WE_WORK_STEPS = [
  { title: "Discovery & Kickoff", desc: "Understanding your business, goals, and project requirements." },
  { title: "Strategy & Planning", desc: "Defining the project roadmap, milestones, and success criteria together." },
  { title: "Design & Development", desc: "The core build phase. You review and approve deliverables at each stage." },
  { title: "Review & Testing", desc: "Quality assurance, client feedback, and refinement before launch." },
  { title: "Launch & Handover", desc: "Going live, knowledge transfer, and ensuring your team is fully equipped." },
  { title: "Post-Launch Support", desc: "30-day support window for any issues or tweaks after launch." },
];

const COMMS_NORMS = [
  { icon: "📧", title: "Weekly Digest", desc: "Every Monday at 07:00 with summary + next steps." },
  { icon: "💬", title: "Slack for Quick Queries", desc: "Fast questions answered during business hours." },
  { icon: "📋", title: "Portal for Approvals", desc: "Formal sign-off and scope decisions happen here." },
  { icon: "📞", title: "Fortnightly Check-ins", desc: "30-minute call every two weeks." },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function OnboardingPage() {
  const { session, projectId } = useProjectLayer();
  const clientId = session?.user.clientId ?? "";

  const [tab, setTab] = useState<OnboardTab>("Welcome");

  // Remote data
  const [project, setProject]           = useState<PortalProjectDetail | null>(null);
  const [onboarding, setOnboarding]     = useState<PortalOnboardingRecord[]>([]);
  const [offboarding, setOffboarding]   = useState<PortalOffboardingTask[]>([]);

  // Loading flags
  const [loadingProject,    setLoadingProject]    = useState(true);
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);
  const [loadingOffboarding, setLoadingOffboarding] = useState(false);
  const [offboardingLoaded, setOffboardingLoaded] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ title: string; sub: string } | null>(null);

  // Testimonial state
  const [stars, setStars]                       = useState(0);
  const [testimonialModal, setTestimonialModal] = useState(false);
  const [testimonialText, setTestimonialText]   = useState("");
  const [testimonialConsent, setTestimonialConsent] = useState("Yes — with my name and company");

  // ── Fetch project detail ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !projectId) { setLoadingProject(false); return; }
    setLoadingProject(true);
    void loadPortalProjectDetailWithRefresh(session, projectId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setProject(r.data);
    }).finally(() => setLoadingProject(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, projectId]);

  // ── Fetch onboarding records ─────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !clientId) { setLoadingOnboarding(false); return; }
    setLoadingOnboarding(true);
    void loadPortalOnboardingWithRefresh(session, clientId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setOnboarding(r.data.slice().sort((a, b) => a.sortOrder - b.sortOrder));
    }).finally(() => setLoadingOnboarding(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, clientId]);

  // ── Lazy-fetch offboarding when tab is first visited ────────────────────────
  useEffect(() => {
    if (tab !== "Offboarding" || !session || !clientId || offboardingLoaded) return;
    setLoadingOffboarding(true);
    void loadPortalOffboardingWithRefresh(session, clientId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setOffboarding(r.data.slice().sort((a, b) => a.sortOrder - b.sortOrder));
      setOffboardingLoaded(true);
    }).finally(() => setLoadingOffboarding(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, session?.accessToken, clientId]);

  // ── Toast auto-dismiss ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  function notify(title: string, sub: string) { setToast({ title, sub }); }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const stages = useMemo(() => onboarding.map((r) => ({
    id: r.id,
    label: r.stageLabel,
    status: toStageStatus(r.status),
    date: r.status === "COMPLETED"
      ? fmt(r.completedAt)
      : r.estimatedAt ? `Est. ${fmt(r.estimatedAt)}` : undefined,
    record: r,
  })), [onboarding]);

  const donePct = useMemo(() => {
    if (!onboarding.length) return 0;
    return Math.round((onboarding.filter((r) => r.status === "COMPLETED").length / onboarding.length) * 100);
  }, [onboarding]);

  const completedCount = onboarding.filter((r) => r.status === "COMPLETED").length;
  const activeStage = stages.find((s) => s.status === "active");

  const offboardGroups = useMemo(
    () => groupBy(offboarding, (t) => t.groupName),
    [offboarding]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleToggleOnboarding(record: PortalOnboardingRecord) {
    if (!session || !clientId) return;
    const next = record.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    setOnboarding((prev) => prev.map((r) => r.id === record.id ? { ...r, status: next } : r));
    const result = await patchPortalOnboardingRecordWithRefresh(session, clientId, record.id, { status: next });
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error) {
      setOnboarding((prev) => prev.map((r) => r.id === record.id ? { ...r, status: record.status } : r));
      notify("Update failed", result.error.message ?? "Could not update step.");
    }
  }

  async function handleToggleOffboarding(task: PortalOffboardingTask) {
    if (!session || !clientId) return;
    const next = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    setOffboarding((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next } : t));
    const result = await patchPortalOffboardingTaskWithRefresh(session, clientId, task.id, {
      status: next,
      completedAt: next === "COMPLETED" ? new Date().toISOString() : undefined,
    });
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error) {
      setOffboarding((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
      notify("Update failed", result.error.message ?? "Could not update task.");
    }
  }

  function handleSubmitTestimonial() {
    if (!testimonialText.trim()) { notify("Missing testimonial", "Please write your testimonial first."); return; }
    notify("Thank you", "Your testimonial has been submitted.");
    setTestimonialText("");
    setTestimonialConsent("Yes — with my name and company");
    setTestimonialModal(false);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={cx("pageBody", styles.onboardFlowRoot, "rdStudioPage")}>
      <section className={styles.onboardFlowMain}>

        {/* ── Page header ── */}
        <div className={cx("pageHeader", "mb0")}>
          <div>
            <div className={cx("pageEyebrow")}>Onboarding &amp; Offboarding</div>
            <h1 className={cx("pageTitle")}>Onboarding Hub</h1>
            <p className={cx("pageSub")}>Track setup progress and manage your project wrap-up in one place.</p>
          </div>
        </div>

        {/* ── Progress KPI row ── */}
        {loadingOnboarding ? (
          <div className={cx("flexCol", "gap12")}>
            <div className={cx("skeletonBlock", "skeleH68")} />
          </div>
        ) : onboarding.length > 0 ? (
          <div className={cx("obsKpiRow")}>
            {[
              { label: "Steps Completed", value: `${completedCount} / ${onboarding.length}`, sub: "Onboarding stages" },
              { label: "Progress", value: `${donePct}%`, sub: "Overall completion" },
              { label: "Current Stage", value: activeStage?.label ?? (donePct === 100 ? "Complete" : "—"), sub: "Active step" },
            ].map((k) => (
              <div key={k.label} className={cx("obsKpiCard")}>
                <div className={cx("obsKpiLabel")}>{k.label}</div>
                <div className={cx("obsKpiValue")}>{k.value}</div>
                <div className={cx("obsKpiMeta")}>{k.sub}</div>
              </div>
            ))}
          </div>
        ) : null}

        {/* ── Progress stepper ── */}
        {!loadingOnboarding && stages.length > 0 && (
          <div className={cx("card", "obsStepper")}>
            <div className={cx("obsStepperTitle")}>Your Onboarding Journey</div>
            <div className={cx("obsStages")}>
              {stages.map((stage, i) => (
                <div
                  key={stage.id}
                  className={cx(
                    "obsStage",
                    stage.status === "done" && "obsStageDone",
                    stage.status === "active" && "obsStageActive",
                  )}
                >
                  <div className={cx("obsStageNode")}>
                    {stage.status === "done" ? "✓" : stage.status === "active" ? `${i + 1}` : "○"}
                  </div>
                  {i < stages.length - 1 && (
                    <div className={cx("obsConnector", stage.status === "done" && "obsConnectorDone")} />
                  )}
                  <div className={cx("obsStageLabel")}>{stage.label}</div>
                  {stage.date && <div className={cx("obsStageDate")}>{stage.date}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className={styles.onboardFlowTabs}>
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              className={cx(styles.onboardFlowTab, tab === item && styles.onboardFlowTabActive)}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* ═══════════════════ WELCOME TAB ═══════════════════ */}
        {tab === "Welcome" && (
          <div className={styles.onboardFlowContent}>
            <div className={styles.onboardFlowWelcomeCard}>
              <div className={styles.onboardFlowWelcomeEyebrow}>Welcome to Maphari</div>
              <div className={styles.onboardFlowWelcomeTitle}>
                {loadingProject ? "Loading your project…" : `${project?.name ?? "Your Project"} — let's build something great.`}
              </div>
              <div className={styles.onboardFlowWelcomeBody}>
                {loadingProject ? "Please wait while we fetch your project details." : (
                  <>
                    We are excited to work with you. This portal is your source of truth — project progress, approvals, files, and next actions all in one place.
                    {project?.startAt && (
                      <><br /><br />Your project kicked off on {fmt(project.startAt)}.{project.dueAt ? ` Estimated completion: ${fmt(project.dueAt)}.` : ""}</>
                    )}
                  </>
                )}
              </div>

              {/* Team row */}
              {!loadingProject && project?.collaborators && project.collaborators.length > 0 && (
                <div className={styles.onboardFlowTeamRow}>
                  {project.collaborators.filter((c) => c.active).map((member) => (
                    <div key={member.id} className={styles.onboardFlowTeamCard}>
                      <div className={styles.onboardFlowAvatar}>{member.staffName.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div className={styles.onboardFlowTeamName}>{member.staffName}</div>
                        <div className={styles.onboardFlowTeamRole}>{member.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Project at a glance */}
            {!loadingProject && project && (
              <div className={styles.onboardFlowGrid2}>
                <div>
                  <div className={styles.onboardFlowSectionTitle}>Project at a Glance</div>
                  <div className={cx("card")}>
                    {([
                      ["Project", project.name],
                      ["Start date", fmt(project.startAt)],
                      ["Target date", fmt(project.dueAt)],
                      ["Budget", project.budgetCents ? fmtCurrency(project.budgetCents) : "—"],
                      ["Project Lead", project.ownerName ?? "—"],
                      ["Status", project.status],
                    ] as [string, string][]).map(([key, value]) => (
                      <div key={key} className={styles.onboardFlowMetaRow}>
                        <span>{key}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className={styles.onboardFlowSectionTitle}>Quick Start</div>
                  <div className={cx("card")}>
                    {[
                      { icon: "📊", title: "Check your project status", desc: "See done, in progress, and next milestones." },
                      { icon: "✅", title: "Review pending approvals", desc: "Approve deliverables and milestones." },
                      { icon: "📁", title: "Access your files", desc: "All documents and deliverables in one place." },
                      { icon: "💬", title: "Send a message", desc: "Reach your team directly from the portal." },
                    ].map((item) => (
                      <div key={item.title} className={styles.onboardFlowQuickRow}>
                        <span className={styles.onboardFlowQuickIcon}>{item.icon}</span>
                        <div className={styles.onboardFlowGrow}>
                          <div className={styles.onboardFlowQuickTitle}>{item.title}</div>
                          <div className={styles.onboardFlowQuickDesc}>{item.desc}</div>
                        </div>
                        <span className={styles.onboardFlowQuickArrow}>→</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ CHECKLIST TAB ═══════════════════ */}
        {tab === "Onboarding Checklist" && (
          <div className={styles.onboardFlowContent}>
            {loadingOnboarding ? (
              <div className={cx("flexCol", "gap12")}>
                <div className={cx("skeletonBlock", "skeleH68")} />
                <div className={cx("skeletonBlock", "skeleH80")} />
                <div className={cx("skeletonBlock", "skeleH68")} />
              </div>
            ) : onboarding.length === 0 ? (
              <div className={cx("card")}>
                <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>No checklist items yet</span></div>
                <div className={cx("cardInner")}><p className={cx("text13", "colorMuted")}>Your account manager will configure your onboarding checklist shortly.</p></div>
              </div>
            ) : (
              <div>
                <div className={cx(styles.onboardFlowHeadInline, "rdStudioSection")}>
                  <div className={styles.onboardFlowHeadLineWrap}>
                    <span className={styles.onboardFlowSectionTitlePlain}>Onboarding Checklist</span>
                    <div className={styles.onboardFlowHeadLine} />
                  </div>
                  <span className={cx("badge", donePct === 100 ? "badgeGreen" : "badgeAmber")}>{donePct}% complete</span>
                </div>

                <div className={cx("card", styles.onboardFlowCheckCard, "rdStudioCard")}>
                  {onboarding.map((record) => {
                    const done = record.status === "COMPLETED";
                    return (
                      <div key={record.id} className={styles.onboardFlowCheckRow}>
                        <button
                          type="button"
                          className={cx(styles.onboardFlowCheckBox, done && styles.onboardFlowCheckDone)}
                          onClick={() => void handleToggleOnboarding(record)}
                          aria-label={done ? "Mark incomplete" : "Mark complete"}
                        >
                          {done ? "✓" : ""}
                        </button>
                        <div className={styles.onboardFlowGrow}>
                          <div className={cx(styles.onboardFlowCheckTitle, done && styles.onboardFlowStrike)}>
                            {record.stageLabel}
                          </div>
                          {record.notes && (
                            <div className={styles.onboardFlowCheckDesc}>{record.notes}</div>
                          )}
                          {done && record.completedAt && (
                            <div className={styles.onboardFlowCheckMeta}>Completed {fmt(record.completedAt)}</div>
                          )}
                          {!done && record.estimatedAt && (
                            <div className={styles.onboardFlowCheckMeta}>Est. {fmt(record.estimatedAt)}</div>
                          )}
                        </div>
                        {done
                          ? <span className={cx("badge", "badgeGreen")}>Done</span>
                          : record.status === "IN_PROGRESS"
                            ? <span className={cx("badge", "badgeAmber")}>Active</span>
                            : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ HOW WE WORK TAB ═══════════════════ */}
        {tab === "How We Work" && (
          <div className={styles.onboardFlowContent}>
            <div>
              <div className={styles.onboardFlowSectionTitle}>Our Process</div>
              <div className={cx("card", styles.onboardFlowStepCard, "rdStudioCard")}>
                {HOW_WE_WORK_STEPS.map((step, i) => (
                  <div key={step.title} className={styles.onboardFlowStepRow}>
                    <div className={cx(styles.onboardFlowStepNum, styles.onboardFlowStepPending)}>
                      {i + 1}
                    </div>
                    <div className={styles.onboardFlowGrow}>
                      <div className={styles.onboardFlowStepTitleRow}>
                        <div className={cx(styles.onboardFlowStepTitle, "rdStudioLabel")}>{step.title}</div>
                      </div>
                      <div className={styles.onboardFlowStepDesc}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className={styles.onboardFlowSectionTitle}>Communication Norms</div>
              <div className={styles.onboardFlowGrid2}>
                {COMMS_NORMS.map((item) => (
                  <div key={item.title} className={cx("card", styles.onboardFlowCommsCard)}>
                    <div className={styles.onboardFlowCommsIcon}>{item.icon}</div>
                    <div className={styles.onboardFlowCommsTitle}>{item.title}</div>
                    <div className={styles.onboardFlowCommsDesc}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ OFFBOARDING TAB ═══════════════════ */}
        {tab === "Offboarding" && (
          <div className={styles.onboardFlowContent}>
            {loadingOffboarding ? (
              <div className={cx("flexCol", "gap12")}>
                <div className={cx("skeletonBlock", "skeleH68")} />
                <div className={cx("skeletonBlock", "skeleH80")} />
              </div>
            ) : offboarding.length === 0 ? (
              <div className={cx("card")}>
                <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Offboarding not yet active</span></div>
                <div className={cx("cardInner")}>
                  <p className={cx("text13", "colorMuted")}>Offboarding steps unlock near the final project phase. Check back as your project nears completion.</p>
                </div>
              </div>
            ) : (
              Object.entries(offboardGroups).map(([group, tasks]) => (
                <div key={group}>
                  <div className={styles.onboardFlowSectionTitle}>{group}</div>
                  <div className={cx("card", styles.onboardFlowWrapCard)}>
                    {tasks.map((task) => {
                      const done = task.status === "COMPLETED";
                      return (
                        <div key={task.id} className={styles.onboardFlowWrapRow}>
                          <div className={styles.onboardFlowGrow}>
                            <div className={styles.onboardFlowWrapName}>{task.label}</div>
                            {task.actionLabel && (
                              <div className={styles.onboardFlowWrapMeta}>{task.actionLabel}</div>
                            )}
                            {done && task.completedAt && (
                              <div className={styles.onboardFlowWrapMeta}>Completed {fmt(task.completedAt)}</div>
                            )}
                          </div>
                          {done ? (
                            <span className={cx("badge", "badgeGreen")}>Done</span>
                          ) : (
                            <button
                              type="button"
                              className={cx("btnSm", "btnGhost")}
                              onClick={() => void handleToggleOffboarding(task)}
                            >
                              Mark done
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ═══════════════════ TESTIMONIAL TAB ═══════════════════ */}
        {tab === "Testimonial" && (
          <div className={styles.onboardFlowContent}>
            <div>
              <div className={styles.onboardFlowSectionTitle}>Share Your Experience</div>
              <div className={cx("card", styles.onboardFlowTestimonialPrompt)}>
                <div className={styles.onboardFlowPromptIcon}>⭐</div>
                <div className={styles.onboardFlowPromptTitle}>How has working with Maphari been so far?</div>
                <div className={styles.onboardFlowPromptBody}>
                  Honest feedback helps us improve and helps other businesses decide if we are the right fit.
                </div>
                <div className={styles.onboardFlowStarRow}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={styles.onboardFlowStarBtn}
                      style={{
                        "--filter": stars >= value ? "none" : "grayscale(1) opacity(.42)",
                        "--transform": stars >= value ? "scale(1.13)" : "scale(1)",
                      } as React.CSSProperties}
                      onClick={() => setStars(value)}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setTestimonialModal(true)}>
                  Write a Testimonial
                </button>
              </div>
            </div>

            <div>
              <div className={styles.onboardFlowSectionTitle}>What Others Say</div>
              <div className={styles.onboardFlowGrid2}>
                {[
                  { text: "Maphari transformed how we think about our product. The portal kept us informed and in control throughout.", from: "Thandi M. · Founder, Umvelo Media" },
                  { text: "The transparency stands out. I always knew where we were, what was next, and what I needed to do.", from: "Kabelo R. · COO, Kasi Digital" },
                ].map((item) => (
                  <div key={item.from} className={styles.onboardFlowTestiCard}>
                    <div className={styles.onboardFlowTestiStars}>⭐⭐⭐⭐⭐</div>
                    <div className={styles.onboardFlowTestiText}>"{item.text}"</div>
                    <div className={styles.onboardFlowTestiFrom}>— {item.from}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </section>

      {/* ── Testimonial modal ── */}
      {testimonialModal && (
        <div className={styles.onboardFlowModalBackdrop} onClick={() => setTestimonialModal(false)}>
          <div className={styles.onboardFlowModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.onboardFlowModalHeader}>
              <span className={styles.onboardFlowModalTitle}>Write a Testimonial</span>
              <button type="button" className={styles.onboardFlowModalClose} onClick={() => setTestimonialModal(false)}>✕</button>
            </div>
            <div className={styles.onboardFlowModalBody}>
              <div className={styles.onboardFlowFieldBlock}>
                <label className={styles.onboardFlowFieldLabel}>Your experience</label>
                <textarea
                  className={styles.onboardFlowFieldAreaLg}
                  placeholder="Tell us about working with Maphari…"
                  value={testimonialText}
                  onChange={(e) => setTestimonialText(e.target.value)}
                />
              </div>
              <div className={styles.onboardFlowFieldBlock}>
                <label className={styles.onboardFlowFieldLabel}>Can we use this on our website?</label>
                <select
                  className={styles.onboardFlowFieldSelect}
                  value={testimonialConsent}
                  onChange={(e) => setTestimonialConsent(e.target.value)}
                >
                  <option>Yes — with my name and company</option>
                  <option>Yes — anonymously</option>
                  <option>No — internal use only</option>
                </select>
              </div>
            </div>
            <div className={styles.onboardFlowModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setTestimonialModal(false)}>Cancel</button>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={handleSubmitTestimonial}>Submit Testimonial</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={cx("toastStack")}>
          <div className={cx("toast", "toastSuccess")}>
            <strong>{toast.title}</strong>
            <div>{toast.sub}</div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/maphari/Projects/maphari_technologies
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

Expected: 0 errors. If errors appear, fix them before committing.

- [ ] **Step 4: Commit**

```bash
cd /Users/maphari/Projects/maphari_technologies
git add apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx
git commit -m "feat(client-portal): wire OnboardingPage to real API — project detail, onboarding records, offboarding tasks"
```

---

## Task 2: Remove `onboardingStatus` from nav + render switch + delete old page

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/config.ts` (remove `"onboardingStatus"` from PageId union and nav array)
- Modify: `apps/web/src/components/client/maphari-client-dashboard.tsx` (remove `onboardingStatus` render case and `OnboardingStatusPage` import)
- Delete: `apps/web/src/components/client/maphari-dashboard/pages/onboarding-status-page.tsx`

### 2a — config.ts: remove `onboardingStatus`

- [ ] **Step 1: Read config.ts lines 55–85**

```bash
sed -n '55,85p' apps/web/src/components/client/maphari-dashboard/config.ts
```

- [ ] **Step 2: Remove `"onboardingStatus"` from PageId union**

In `apps/web/src/components/client/maphari-dashboard/config.ts`, find the line:
```
  | "onboardingStatus"
```
Delete it entirely.

- [ ] **Step 3: Remove `{ id: "onboardingStatus", label: "Onboarding Status" }` from navSections**

In `config.ts`, find:
```ts
      { id: "onboardingStatus", label: "Onboarding Status" },
```
Delete it entirely.

### 2b — maphari-client-dashboard.tsx: remove import + render case

- [ ] **Step 4: Remove the `OnboardingStatusPage` import**

In `apps/web/src/components/client/maphari-client-dashboard.tsx`, find and remove the line that imports `OnboardingStatusPage`. It will look like:
```ts
import { OnboardingStatusPage } from "./maphari-dashboard/pages/onboarding-status-page";
```

- [ ] **Step 5: Remove the render case**

Find and remove:
```tsx
            {nav.activePage === "onboardingStatus" && <OnboardingStatusPage />}
```

### 2c — Delete the file

- [ ] **Step 6: Delete the retired page**

```bash
rm apps/web/src/components/client/maphari-dashboard/pages/onboarding-status-page.tsx
```

### 2d — TypeScript check

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/maphari/Projects/maphari_technologies
pnpm --filter @maphari/web exec tsc --noEmit 2>&1 | head -40
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/maphari/Projects/maphari_technologies
git add apps/web/src/components/client/maphari-dashboard/config.ts
git add apps/web/src/components/client/maphari-client-dashboard.tsx
git rm apps/web/src/components/client/maphari-dashboard/pages/onboarding-status-page.tsx
git commit -m "refactor(client-portal): remove onboardingStatus nav item and page — absorbed into OnboardingHub"
```

---

## Verification

After both tasks complete:

1. `pnpm --filter @maphari/web exec tsc --noEmit` → 0 errors
2. Navigate to Onboarding Hub in Account section → page renders (not blank)
3. Progress KPI row and stepper appear above tabs (even if empty in dev mock — no crash)
4. Switching to Onboarding Checklist tab → checklist renders (skeleton if loading, empty state if no records, items if data)
5. Switching to Offboarding tab → triggers lazy fetch (skeleton briefly, then content or empty state)
6. Switching to Welcome tab → project name and dates show (or loading state, not hardcoded seed values)
7. "Onboarding Status" nav item is gone from the Overview section
8. Navigating to `onboardingStatus` page ID (e.g. by pasting into nav state) → renders nothing (case removed)
