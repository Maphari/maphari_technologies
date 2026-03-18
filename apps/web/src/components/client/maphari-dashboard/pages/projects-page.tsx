// ════════════════════════════════════════════════════════════════════════════
// projects-page.tsx — Client Portal Project Overview (9 tabs)
// Data: deliverables, risks, sign-offs, sprints, change-requests → API
//       decisions → /projects/:id/decisions (governance)
//       phases    → /projects/:id/phases    (project-layer)
//       milestones tab → reuses sign-offs data
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { cx, styles } from "../style";
import { Ic } from "../ui";
import { usePageToast } from "../hooks/use-page-toast";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalDeliverablesWithRefresh,
  loadPortalRisksWithRefresh,
  loadPortalSignOffsWithRefresh,
  signPortalSignOffWithRefresh,
  loadPortalSprintsWithRefresh,
  loadPortalSprintTasksWithRefresh,
  loadPortalChangeRequestsWithRefresh,
  createPortalChangeRequestWithRefresh,
  updatePortalChangeRequestWithRefresh,
  loadPortalDecisionsWithRefresh,
  loadPortalPhasesWithRefresh,
  updatePortalNotificationPrefsWithRefresh,
  createPortalSupportTicketWithRefresh,
  type PortalDeliverable,
  type PortalRisk,
  type PortalSignOff,
  type PortalSprint,
  type PortalSprintTask,
  type PortalProjectChangeRequest,
  type PortalDecision,
  type PortalPhase,
} from "../../../../lib/api/portal";

// ── Tab types ─────────────────────────────────────────────────────────────────

type OverviewTab =
  | "Project Pulse"
  | "Milestones"
  | "Deliverables"
  | "Timeline"
  | "Decisions"
  | "Scope Changes"
  | "Risks"
  | "Sign-off"
  | "Sprint";

type Mood = "😄" | "😊" | "😐" | "😟" | "😡";

const MOOD_LABELS: Record<Mood, string> = {
  "😄": "Very happy", "😊": "Happy", "😐": "Neutral", "😟": "Worried", "😡": "Very concerned",
};

const TABS: OverviewTab[] = [
  "Project Pulse", "Milestones", "Deliverables", "Timeline",
  "Decisions", "Scope Changes", "Risks", "Sign-off", "Sprint",
];

// ── Mapping helpers ───────────────────────────────────────────────────────────

function mapDeliverableStatus(raw: string): string {
  const s = raw.toUpperCase();
  if (s === "DELIVERED" || s === "APPROVED" || s === "COMPLETED") return "delivered";
  if (s === "IN_REVIEW" || s === "REVIEW")                        return "review";
  if (s === "IN_PROGRESS" || s === "ACTIVE")                      return "inprogress";
  return "notstarted";
}

type DeliverableStatus = "delivered" | "approved" | "review" | "inprogress" | "notstarted";
const STATUS_LABELS: Record<DeliverableStatus, string> = {
  delivered: "Delivered", approved: "Approved", review: "In Review", inprogress: "In Progress", notstarted: "Not Started",
};
const STATUS_BADGE: Record<DeliverableStatus, string> = {
  delivered: "badgeGreen", approved: "badgeAccent", review: "badgePurple", inprogress: "badgeAmber", notstarted: "badgeMuted",
};

function mapRiskLevel(raw: string | null): "High" | "Medium" | "Low" {
  const r = (raw ?? "").toUpperCase();
  if (r === "HIGH" || r === "CRITICAL")   return "High";
  if (r === "MEDIUM" || r === "MODERATE") return "Medium";
  return "Low";
}

function riskPillCls(lvl: "High" | "Medium" | "Low"): string {
  if (lvl === "High")   return styles.projOverviewRiskHigh;
  if (lvl === "Medium") return styles.projOverviewRiskMedium;
  return styles.projOverviewRiskLow;
}

function mapSignOffStatus(raw: string): "signed" | "pending" | "notready" {
  const s = raw.toUpperCase();
  if (s === "SIGNED" || s === "APPROVED") return "signed";
  if (s === "PENDING" || s === "READY")   return "pending";
  return "notready";
}

function signOffIcon(name: string): string {
  const n = name.toLowerCase();
  if (/mobile|phone|app/.test(n))      return "📱";
  if (/dashboard|data|analytic/.test(n)) return "📊";
  if (/screen|ui|design/.test(n))       return "🖥";
  return "📄";
}

function mapCRStatus(status: PortalProjectChangeRequest["status"]): "pending" | "approved" | "declined" {
  if (status === "CLIENT_APPROVED") return "approved";
  if (status === "CLIENT_REJECTED") return "declined";
  return "pending";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function sprintTaskStatusBadge(raw: string): string {
  const s = raw.toUpperCase();
  if (s === "DONE" || s === "COMPLETED") return "badgeGreen";
  if (s === "IN_PROGRESS" || s === "ACTIVE") return "badgeAccent";
  if (s === "BLOCKED") return "badgeRed";
  if (s === "IN_REVIEW") return "badgeAmber";
  return "badgeMuted";
}

function sprintTaskStatusLabel(raw: string): string {
  const s = raw.toUpperCase();
  if (s === "DONE" || s === "COMPLETED") return "Done";
  if (s === "IN_PROGRESS" || s === "ACTIVE") return "In Progress";
  if (s === "BLOCKED") return "Blocked";
  if (s === "IN_REVIEW") return "In Review";
  return "To Do";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectsPage() {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [tab,          setTab]          = useState<OverviewTab>("Project Pulse");
  const [scopeModal,   setScopeModal]   = useState(false);
  const [signoffModal, setSignoffModal] = useState<PortalSignOff | null>(null);
  const [moods,        setMoods]        = useState<Record<string, Mood>>({
    "This week": "😊", "Last week": "😐", "Week of Feb 7": "😊",
  });

  // ── Scope change modal fields ─────────────────────────────────────────────
  const [scopeTitle,      setScopeTitle]      = useState("");
  const [scopeBody,       setScopeBody]       = useState("");
  const [scopePriority,   setScopePriority]   = useState("Important");
  const [scopeSubmitting, setScopeSubmitting] = useState(false);

  // ── Sign-off modal fields ─────────────────────────────────────────────────
  const [signoffNotes, setSignoffNotes] = useState("");
  const [signing,      setSigning]      = useState(false);

  // ── Email Digest state ────────────────────────────────────────────────────
  const [digestBusy, setDigestBusy] = useState(false);

  // ── Ask Question modal state ──────────────────────────────────────────────
  const [questionModal, setQuestionModal] = useState(false);
  const [questionText,  setQuestionText]  = useState("");
  const [questionBusy,  setQuestionBusy]  = useState(false);

  // ── API data state ────────────────────────────────────────────────────────
  const [apiDeliverables, setApiDeliverables] = useState<PortalDeliverable[]>([]);
  const [apiRisks,        setApiRisks]        = useState<PortalRisk[]>([]);
  const [apiSignOffs,     setApiSignOffs]     = useState<PortalSignOff[]>([]);
  const [apiChangeReqs,   setApiChangeReqs]   = useState<PortalProjectChangeRequest[]>([]);
  const [activeSprint,    setActiveSprint]    = useState<PortalSprint | null>(null);
  const [sprintTasks,     setSprintTasks]     = useState<PortalSprintTask[]>([]);
  const [apiDecisions,    setApiDecisions]    = useState<PortalDecision[]>([]);
  const [apiPhases,       setApiPhases]       = useState<PortalPhase[]>([]);

  // ── Load all domain data on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!session || !projectId) return;

    void loadPortalDeliverablesWithRefresh(session, projectId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setApiDeliverables(r.data);
    });
    void loadPortalRisksWithRefresh(session, projectId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setApiRisks(r.data);
    });
    void loadPortalSignOffsWithRefresh(session, projectId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setApiSignOffs(r.data);
    });
    void loadPortalChangeRequestsWithRefresh(session, { projectId }).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setApiChangeReqs(r.data);
    });
    void loadPortalSprintsWithRefresh(session, projectId).then(async (r) => {
      if (r.nextSession) saveSession(r.nextSession);
      const list   = r.data ?? [];
      const active = list.find((s) => s.status.toUpperCase() === "ACTIVE") ?? list[0] ?? null;
      setActiveSprint(active);
      if (!active) return;
      const tr = await loadPortalSprintTasksWithRefresh(session, projectId, active.id);
      if (tr.nextSession) saveSession(tr.nextSession);
      if (!tr.error && tr.data) setSprintTasks(tr.data);
    });
    void loadPortalDecisionsWithRefresh(session, projectId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setApiDecisions(r.data);
    });
    void loadPortalPhasesWithRefresh(session, projectId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setApiPhases(r.data);
    });
  }, [session, projectId]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const pendingScopeCount = useMemo(
    () => apiChangeReqs.filter((cr) => mapCRStatus(cr.status) === "pending").length,
    [apiChangeReqs],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleScope(id: string, next: "approved" | "declined"): Promise<void> {
    if (!session) return;
    // Optimistic update
    setApiChangeReqs((prev) => prev.map((cr) =>
      cr.id === id ? { ...cr, status: next === "approved" ? "CLIENT_APPROVED" : "CLIENT_REJECTED" } : cr
    ));
    try {
      const r = await updatePortalChangeRequestWithRefresh(session, id, {
        status: next === "approved" ? "CLIENT_APPROVED" : "CLIENT_REJECTED",
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        // Revert on failure
        setApiChangeReqs((prev) => prev.map((cr) =>
          cr.id === id ? { ...cr, status: "SUBMITTED" } : cr
        ));
        notify("error", "Action failed", "Could not process your request. Please try again.");
      } else {
        notify("success", next === "approved" ? "Scope change approved" : "Scope change declined", "Team has been notified");
      }
    } catch {
      setApiChangeReqs((prev) => prev.map((cr) =>
        cr.id === id ? { ...cr, status: "SUBMITTED" } : cr
      ));
      notify("error", "Action failed", "Could not process your request. Please try again.");
    }
  }

  async function handleScopeSubmit(): Promise<void> {
    if (!session || !projectId || scopeSubmitting || !scopeTitle.trim()) return;
    setScopeSubmitting(true);
    try {
      const r = await createPortalChangeRequestWithRefresh(session, {
        projectId,
        title:       scopeTitle.trim(),
        description: scopeBody.trim() || undefined,
        reason:      scopePriority,
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        notify("error", "Submission failed", "Could not submit your request. Please try again.");
      } else {
        if (r.data) setApiChangeReqs((prev) => [...prev, r.data!]);
        setScopeModal(false);
        setScopeTitle(""); setScopeBody(""); setScopePriority("Important");
        notify("success", "Request submitted", "Team will respond within 24 hours");
      }
    } catch {
      notify("error", "Submission failed", "Could not submit your request. Please try again.");
    } finally {
      setScopeSubmitting(false);
    }
  }

  async function handleSignOff(): Promise<void> {
    if (!session || !projectId || !signoffModal || signing) return;
    setSigning(true);
    const targetId   = signoffModal.id;
    const targetName = signoffModal.name;
    try {
      const r = await signPortalSignOffWithRefresh(session, projectId, targetId);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        notify("error", "Sign-off failed", "Could not record your signature. Please try again.");
      } else {
        setApiSignOffs((prev) => prev.map((s) =>
          s.id === targetId ? { ...s, status: "SIGNED", signedAt: new Date().toISOString() } : s
        ));
        setSignoffModal(null);
        setSignoffNotes("");
        notify("success", "Signed off", `${targetName} approved and recorded`);
      }
    } catch {
      notify("error", "Sign-off failed", "Could not record your signature. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  // ── Email Digest handler ──────────────────────────────────────────────────
  const handleEmailDigest = useCallback(async () => {
    if (!session) return;
    setDigestBusy(true);
    const result = await updatePortalNotificationPrefsWithRefresh(session, { weeklyDigest: true });
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.error) {
      notify("success", "Digest requested", "Your project summary will be sent to your email shortly.");
    } else {
      notify("error", "Failed", "Could not request digest. Please try again.");
    }
    setDigestBusy(false);
  }, [session, notify]);

  // ── Ask Question handler ──────────────────────────────────────────────────
  const handleAskQuestion = useCallback(async () => {
    if (!session || !session.user.clientId || !questionText.trim()) return;
    setQuestionBusy(true);
    const result = await createPortalSupportTicketWithRefresh(session, {
      clientId: session.user.clientId,
      title: questionText.trim().slice(0, 100),
      description: projectId ? `Project: ${projectId}\n\n${questionText.trim()}` : questionText.trim(),
      category: "QUESTION",
      priority: "MEDIUM",
    });
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.error) {
      notify("success", "Question sent", "Your team will respond within 24 hours.");
      setQuestionModal(false);
      setQuestionText("");
    } else {
      notify("error", "Failed", "Could not send question. Please try again.");
    }
    setQuestionBusy(false);
  }, [session, projectId, questionText, notify]);

  // ── Sprint derived values ─────────────────────────────────────────────────
  const sprintDone    = sprintTasks.filter((t) => t.status.toUpperCase() === "DONE" || t.status.toUpperCase() === "COMPLETED").length;
  const sprintPct     = sprintTasks.length > 0 ? Math.round((sprintDone / sprintTasks.length) * 100) : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Overview</div>
          <h1 className={cx("pageTitle")}>Project Overview</h1>
          <p className={cx("pageSub")}>Everything happening on your project, in one place.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} disabled={digestBusy} onClick={() => void handleEmailDigest()}>
            {digestBusy ? "Sending…" : "Email Digest"}
          </button>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setScopeModal(true)}>Request Change</button>
        </div>
      </div>

      <div className={cx("pillTabs", "mb16")}>
        {TABS.map((item) => (
          <button key={item} type="button" className={cx("pillTab", tab === item && "pillTabActive")} onClick={() => setTab(item)}>
            {item}
            {item === "Scope Changes" && pendingScopeCount > 0 ? (
              <span className={cx("badge", "badgeAmber", "ml6")}>{pendingScopeCount}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Project Pulse tab ──────────────────────────────────────────────── */}
      {tab === "Project Pulse" ? (
        <>
          <div className={cx("topCardsStack", "mb16")}>
            {[
              { label: "Overall Progress", value: "54%",    sub: "On track for Mar 28 launch", barClass: "statBarAccent"  },
              { label: "Days Remaining",   value: "35",     sub: "Launch: Mar 28, 2026",         barClass: null             },
              { label: "Milestones Done",  value: "2/6",    sub: "Next: UI/UX (72% done)",       barClass: "statBarGreen"   },
              { label: "Pending Actions",  value: String(pendingScopeCount + apiSignOffs.filter((s) => mapSignOffStatus(s.status) === "pending").length), sub: "Need your response", barClass: "statBarAmber" },
              { label: "Budget Used",      value: "41%",    sub: "R 32,800 of R 80,000",         barClass: "statBarPurple"  },
            ].map((item) => (
              <div key={item.label} className={styles.projOverviewStat}>
                <div className={cx(styles.projOverviewStatBar, item.barClass ?? "")} />
                <div className={styles.projOverviewStatLabel}>{item.label}</div>
                <div className={styles.projOverviewStatValue}>{item.value}</div>
                <div className={styles.projOverviewStatSub}>{item.sub}</div>
              </div>
            ))}
          </div>

          <div className={styles.projOverviewContent}>
            <div>
              <div className={styles.projOverviewSectionTitle}>This Week&apos;s Project Pulse</div>
              <div className={styles.projOverviewPulseCard}>
                <div className={styles.projOverviewPulseEyebrow}><span className={styles.projOverviewPulseDot} /> Weekly Summary</div>
                <div className={styles.projOverviewPulseText}>
                  <strong>Good progress this week.</strong> Check the Deliverables and Sign-off tabs for items that need your attention.
                  {pendingScopeCount > 0 && <><br /><br /><strong>{pendingScopeCount} scope change{pendingScopeCount > 1 ? "s" : ""} await your decision</strong> — head to the Scope Changes tab to review them.</>}
                </div>
                <div className={styles.projOverviewPulseMeta}>
                  <div className={styles.projOverviewPulseMetaItem}>Health <strong className={cx("colorGreen")}>On Track</strong></div>
                </div>
              </div>
            </div>

            <div>
              <div className={styles.projOverviewSectionTitle}>Project Mood</div>
              <div className={cx("card")}>
                <div className={cx("cardHeader")}>
                  <div>
                    <div className={cx("cardTitle")}>How are you feeling?</div>
                    <div className={cx("cardMeta")}>Weekly confidence check-in</div>
                  </div>
                </div>
                {(["This week", "Last week", "Week of Feb 7"] as const).map((week) => (
                  <div key={week} className={styles.projOverviewMoodRow}>
                    <span className={styles.projOverviewMoodWeek}>{week}</span>
                    <div className={styles.projOverviewMoodEmojiRow}>
                      {(["😄", "😊", "😐", "😟", "😡"] as Mood[]).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={cx(styles.projOverviewMoodEmoji, moods[week] === emoji && styles.projOverviewMoodEmojiActive)}
                          aria-label={MOOD_LABELS[emoji]}
                          aria-pressed={moods[week] === emoji}
                          onClick={() => { setMoods((prev) => ({ ...prev, [week]: emoji })); notify("success", "Mood recorded", "Thanks for the check-in"); }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <span className={styles.projOverviewMoodCopy}>
                      {moods[week] === "😄" ? "Feeling great!" : moods[week] === "😊" ? "Going well" : moods[week] === "😐" ? "It is okay" : moods[week] === "😟" ? "A bit concerned" : "Very concerned"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* ── Milestones tab (API — sign-offs) ───────────────────────────────── */}
      {tab === "Milestones" ? (
        <div className={styles.projOverviewContent}>
          <div>
            <div className={styles.projOverviewSectionTitle}>Project Milestones</div>
            {apiSignOffs.length === 0 ? (
              <div className={cx("card")}>
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg></div>
                  <div className={cx("emptyStateTitle")}>No milestones yet</div>
                  <div className={cx("emptyStateSub")}>Milestone sign-offs will appear here once the team has added them.</div>
                </div>
              </div>
            ) : (
              <div className={cx("card")}>
                {apiSignOffs.map((item, index) => {
                  const soStatus = mapSignOffStatus(item.status);
                  return (
                    <div key={item.id} className={styles.projOverviewMilestoneRow}>
                      <div className={styles.projOverviewMilestoneLine}>
                        <div className={cx(
                          styles.projOverviewMilestoneCircle,
                          soStatus === "signed" ? styles.projOverviewMilestoneDone :
                          soStatus === "pending" ? styles.projOverviewMilestoneActive :
                          styles.projOverviewMilestonePending,
                        )}>
                          {soStatus === "signed" ? "✓" : soStatus === "pending" ? "●" : String(index + 1)}
                        </div>
                        {index < apiSignOffs.length - 1 ? <div className={styles.projOverviewMilestoneConnector} /> : null}
                      </div>
                      <div className={styles.projOverviewGrow}>
                        <div className={styles.projOverviewMilestoneTitle}>{item.name}</div>
                        <div className={styles.projOverviewMilestoneMeta}>
                          {soStatus === "signed" && item.signedAt
                            ? `Signed ${fmtDate(item.signedAt)}`
                            : soStatus === "pending"
                              ? "Awaiting your approval"
                              : "Not yet ready for review"}
                        </div>
                        <div className={styles.projOverviewTagRow}>
                          <span className={cx("badge", soStatus === "signed" ? "badgeGreen" : soStatus === "pending" ? "badgeAmber" : "badgeMuted")}>
                            {soStatus === "signed" ? "Signed" : soStatus === "pending" ? "Pending" : "Not Ready"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Deliverables tab (API) ──────────────────────────────────────────── */}
      {tab === "Deliverables" ? (
        <div className={styles.projOverviewContent}>
          <div>
            <div className={styles.projOverviewSectionTitle}>All Deliverables</div>
            {apiDeliverables.length === 0 ? (
              <div className={cx("card")}>
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="layers" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>No deliverables yet</div>
                  <div className={cx("emptyStateSub")}>Deliverables will appear here as work is scoped.</div>
                </div>
              </div>
            ) : (
              <div className={cx("card", styles.projOverviewTableCard)}>
                <div className={styles.projOverviewDeliverableHead}>
                  <span>Deliverable</span><span>Owner</span><span>Due</span><span>Status</span>
                </div>
                {apiDeliverables.map((item) => {
                  const ds = mapDeliverableStatus(item.status) as DeliverableStatus;
                  return (
                    <div key={item.id} className={styles.projOverviewDeliverableRow}>
                      <div>
                        <div className={styles.projOverviewDeliverableName}>{item.name}</div>
                      </div>
                      <div className={styles.projOverviewDeliverableOwner}>{item.ownerName ?? "—"}</div>
                      <div className={styles.projOverviewDeliverableDate}>{fmtDate(item.dueAt)}</div>
                      <div className={styles.projOverviewDeliverableStatus}>
                        <span className={cx("badge", STATUS_BADGE[ds])}>{STATUS_LABELS[ds]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Timeline tab (API — phases) ─────────────────────────────────────── */}
      {tab === "Timeline" ? (
        <div className={styles.projOverviewContent}>
          <div>
            <div className={styles.projOverviewSectionTitle}>Project Timeline</div>
            {apiPhases.length === 0 ? (
              <div className={cx("card")}>
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                  <div className={cx("emptyStateTitle")}>No phases yet</div>
                  <div className={cx("emptyStateSub")}>Project phases will appear here once the team has set them up.</div>
                </div>
              </div>
            ) : (
              <div className={cx("card")}>
                {[...apiPhases].sort((a, b) => a.sortOrder - b.sortOrder).map((phase, index) => {
                  const pct = phase.budgetedHours > 0
                    ? Math.min(100, Math.round((phase.loggedHours / phase.budgetedHours) * 100))
                    : 0;
                  const isOver = phase.loggedHours > phase.budgetedHours;
                  return (
                    <div key={phase.id} className={styles.projOverviewMilestoneRow}>
                      <div className={styles.projOverviewMilestoneLine}>
                        <div
                          className={cx(
                            styles.projOverviewMilestoneCircle,
                            pct >= 100 ? styles.projOverviewMilestoneDone : styles.projOverviewMilestoneActive,
                          )}
                          style={phase.color ? { '--bg-color': phase.color, '--border-color': phase.color } as React.CSSProperties : undefined}
                        >
                          {pct >= 100 ? "✓" : String(index + 1)}
                        </div>
                        {index < apiPhases.length - 1 ? <div className={styles.projOverviewMilestoneConnector} /> : null}
                      </div>
                      <div className={styles.projOverviewGrow}>
                        <div className={styles.projOverviewMilestoneTitle}>{phase.name}</div>
                        <div className={styles.projOverviewMilestoneMeta}>
                          {phase.loggedHours}h logged of {phase.budgetedHours}h budgeted
                          {isOver ? " · over budget" : ""}
                        </div>
                        {phase.budgetedHours > 0 ? (
                          <div className={styles.projOverviewMilestoneTrack}>
                            <div
                              className={cx(styles.projOverviewMilestoneFill, isOver ? "pfAmber" : pct >= 100 ? "pfGreen" : "pfAccent")} style={{ '--pct': `${pct}%` } as React.CSSProperties}
                            />
                          </div>
                        ) : null}
                        <div className={styles.projOverviewTagRow}>
                          <span className={cx("badge", isOver ? "badgeAmber" : pct >= 100 ? "badgeGreen" : "badgeMuted")}>
                            {isOver ? "Over Budget" : pct >= 100 ? "Complete" : `${pct}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Decisions tab (API) ─────────────────────────────────────────────── */}
      {tab === "Decisions" ? (
        <div className={styles.projOverviewContent}>
          <div>
            <div className={styles.projOverviewSectionTitle}>Decision Log</div>
            <div className={styles.projOverviewInfoStrip}>Every decision made on your project is logged here.</div>
            {apiDecisions.length === 0 ? (
              <div className={cx("card")}>
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></div>
                  <div className={cx("emptyStateTitle")}>No decisions logged</div>
                  <div className={cx("emptyStateSub")}>Project decisions will appear here once the team records them.</div>
                </div>
              </div>
            ) : apiDecisions.map((item) => (
              <div key={item.id} className={styles.projOverviewDecisionRow}>
                <div className={styles.projOverviewDecisionHead}>
                  <div className={styles.projOverviewDecisionTitle}>{item.title}</div>
                  <span className={cx("badge", "badgeAccent")}>{item.category ?? "Decision"}</span>
                </div>
                {item.rationale && (
                  <div className={styles.projOverviewDecisionMeta}>{item.rationale}</div>
                )}
                {item.detail && !item.rationale && (
                  <div className={styles.projOverviewDecisionMeta}>{item.detail}</div>
                )}
                <div className={styles.projOverviewDecisionBy}>
                  {item.decidedAt ? fmtDate(item.decidedAt) : "Date pending"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Scope Changes tab (API) ─────────────────────────────────────────── */}
      {tab === "Scope Changes" ? (
        <div className={styles.projOverviewContent}>
          <div>
            <div className={styles.projOverviewHeadInline}>
              <div className={styles.projOverviewHeadLineWrap}>
                <span className={styles.projOverviewSectionTitlePlain}>Scope Change Requests</span>
                <div className={styles.projOverviewHeadLine} />
              </div>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setScopeModal(true)}>Request Change</button>
            </div>
            {apiChangeReqs.length === 0 ? (
              <div className={cx("card")}>
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="edit" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>No change requests</div>
                  <div className={cx("emptyStateSub")}>Scope change requests submitted here will appear for review.</div>
                </div>
              </div>
            ) : apiChangeReqs.map((item) => {
              const displayStatus = mapCRStatus(item.status);
              return (
                <div key={item.id} className={cx(styles.projOverviewScopeRow, displayStatus === "pending" && styles.projOverviewScopePending)}>
                  <div className={styles.projOverviewScopeHead}>
                    <div className={styles.projOverviewScopeTitle}>{item.title}</div>
                    <span className={cx("badge", displayStatus === "pending" ? "badgeAmber" : displayStatus === "approved" ? "badgeGreen" : "badgeRed")}>
                      {displayStatus}
                    </span>
                  </div>
                  <div className={styles.projOverviewScopeBody}>{item.description ?? item.reason ?? "No description provided."}</div>
                  {item.estimatedCostCents != null && (
                    <div className={cx("text11", "colorMuted", "mt4")}>
                      Estimated cost: R {(item.estimatedCostCents / 100).toLocaleString("en-ZA")}
                      {item.estimatedHours != null && ` · ${item.estimatedHours}h estimated`}
                    </div>
                  )}
                  {displayStatus === "pending" ? (
                    <div className={styles.projOverviewScopeActions}>
                      <button type="button" className={styles.projOverviewApproveBtn} onClick={() => void handleScope(item.id, "approved")}>Approve</button>
                      <button type="button" className={styles.projOverviewDeclineBtn} onClick={() => void handleScope(item.id, "declined")}>Decline</button>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setQuestionModal(true)}>Ask Question</button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ── Risks tab (API) ────────────────────────────────────────────────── */}
      {tab === "Risks" ? (
        <div className={styles.projOverviewContent}>
          <div>
            <div className={styles.projOverviewSectionTitle}>Risk Register</div>
            <div className={styles.projOverviewInfoStrip}>Potential issues we are tracking and actively managing.</div>
            {apiRisks.length === 0 ? (
              <div className={cx("card")}>
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="alertTriangle" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>No risks logged</div>
                  <div className={cx("emptyStateSub")}>Risks identified during the project will be tracked here.</div>
                </div>
              </div>
            ) : (
              <div className={cx("card", styles.projOverviewTableCard)}>
                <div className={styles.projOverviewRiskHead}>
                  <span>Risk</span><span>Likelihood</span><span>Impact</span><span>Mitigation</span>
                </div>
                {apiRisks.map((item) => {
                  const lh = mapRiskLevel(item.likelihood);
                  const im = mapRiskLevel(item.impact);
                  return (
                    <div key={item.id} className={styles.projOverviewRiskRow}>
                      <div>
                        <div className={styles.projOverviewRiskName}>{item.name}</div>
                        {item.detail && <div className={styles.projOverviewRiskDetail}>{item.detail}</div>}
                      </div>
                      <div><span className={cx(styles.projOverviewRiskPill, riskPillCls(lh))}>{lh}</span></div>
                      <div><span className={cx(styles.projOverviewRiskPill, riskPillCls(im))}>{im}</span></div>
                      <div className={styles.projOverviewRiskMitigation}>{item.mitigation ?? "—"}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Sign-off tab (API) ──────────────────────────────────────────────── */}
      {tab === "Sign-off" ? (
        <div className={styles.projOverviewContent}>
          <div>
            <div className={styles.projOverviewSectionTitle}>Client Sign-off Portal</div>
            <div className={cx("card")}>
              <div className={cx("cardHeader")}>
                <div>
                  <div className={cx("cardTitle")}>Deliverable Approvals</div>
                  <div className={cx("cardMeta")}>Formal approvals are timestamped in the project log.</div>
                </div>
              </div>
              {apiSignOffs.length === 0 ? (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="checkCircle" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>No sign-offs required</div>
                  <div className={cx("emptyStateSub")}>Deliverable approvals will appear here when ready for your review.</div>
                </div>
              ) : apiSignOffs.map((item) => {
                const soStatus = mapSignOffStatus(item.status);
                const icon     = signOffIcon(item.name);
                const meta     = soStatus === "signed"
                  ? `Signed off ${item.signedAt ? fmtDate(item.signedAt) : ""} · ${item.signedByName ?? "Client"}`
                  : soStatus === "pending"
                    ? "Awaiting your review and approval"
                    : "Not yet ready for review";
                return (
                  <div key={item.id} className={styles.projOverviewSignoffRow}>
                    <div className={styles.projOverviewSignoffIcon}>{icon}</div>
                    <div className={styles.projOverviewGrow}>
                      <div className={styles.projOverviewSignoffName}>{item.name}</div>
                      <div className={styles.projOverviewSignoffMeta}>{meta}</div>
                    </div>
                    <div className={styles.projOverviewSignoffActions}>
                      {soStatus === "signed"   && <span className={cx("badge", "badgeGreen")}>Signed</span>}
                      {soStatus === "notready" && <span className={cx("badge", "badgeMuted")}>Not Ready</span>}
                      {soStatus === "pending"  && (
                        <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setSignoffModal(item)}>Review & Sign</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Sprint tab (API) ────────────────────────────────────────────────── */}
      {tab === "Sprint" ? (
        <div>
          {!activeSprint ? (
            <div className={cx("card", "emptyPad32x20", "textCenter")}>
              <div className={cx("text12", "colorMuted")}>No active sprint found for this project.</div>
            </div>
          ) : (
            <>
              <div className={cx("topCardsStack", "mb16")}>
                {[
                  { label: "Current Sprint", value: activeSprint.name,                         sub: `${fmtDate(activeSprint.startAt)} – ${fmtDate(activeSprint.endAt)}` },
                  { label: "Progress",       value: `${sprintPct}%`,                           sub: `${sprintDone} of ${sprintTasks.length} tasks complete`             },
                  { label: "Story Points",   value: `${activeSprint.completedTasks}/${activeSprint.totalTasks}`, sub: "Tasks completed"                               },
                  { label: "Overdue",        value: String(activeSprint.overdueTasks),          sub: activeSprint.overdueTasks > 0 ? "Needs attention" : "All on track" },
                ].map((s) => (
                  <div key={s.label} className={styles.projOverviewStat}>
                    <div className={styles.projOverviewStatLabel}>{s.label}</div>
                    <div className={styles.projOverviewStatValue}>{s.value}</div>
                    <div className={styles.projOverviewStatSub}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div className={cx("card")}>
                <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Sprint Tasks</span></div>
                {sprintTasks.length === 0 ? (
                  <div className={cx("emptyState")}>
                    <div className={cx("emptyStateIcon")}><Ic n="checkSquare" sz={22} c="var(--muted2)" /></div>
                    <div className={cx("emptyStateTitle")}>No sprint tasks</div>
                    <div className={cx("emptyStateSub")}>Tasks assigned to this sprint will appear here.</div>
                  </div>
                ) : (
                  <table className={cx("projTable")}>
                    <thead>
                      <tr>
                        <th scope="col">Task</th>
                        <th scope="col">Assignee</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sprintTasks.map((t) => (
                        <tr key={t.id}>
                          <td className={cx("fw600")}>{t.name}</td>
                          <td className={cx("text12", "colorMuted")}>{t.assigneeName ?? "—"}</td>
                          <td><span className={cx("badge", sprintTaskStatusBadge(t.status))}>{sprintTaskStatusLabel(t.status)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* ── Scope change modal ─────────────────────────────────────────────── */}
      {scopeModal ? (
        <div className={styles.projOverviewModalBackdrop} onClick={() => setScopeModal(false)}>
          <div className={styles.projOverviewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.projOverviewModalHeader}>
              <span className={styles.projOverviewModalTitle}>Request Scope Change</span>
              <button type="button" className={styles.projOverviewModalClose} aria-label="Close" onClick={() => setScopeModal(false)}>✕</button>
            </div>
            <div className={styles.projOverviewModalBody}>
              <label className={styles.projOverviewFieldLabel}>What would you like to change?</label>
              <input
                className={styles.projOverviewFieldInput}
                placeholder="Brief title for the change"
                value={scopeTitle}
                onChange={(e) => setScopeTitle(e.target.value)}
                disabled={scopeSubmitting}
              />
              <label className={styles.projOverviewFieldLabel}>Describe in detail</label>
              <textarea
                className={styles.projOverviewFieldArea}
                placeholder="The more detail, the faster we can assess it."
                value={scopeBody}
                onChange={(e) => setScopeBody(e.target.value)}
                disabled={scopeSubmitting}
              />
              <label className={styles.projOverviewFieldLabel}>Priority</label>
              <div className={styles.projOverviewPriorityGrid}>
                {["Nice to Have", "Important", "Urgent"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={styles.projOverviewPriorityButton}
                    style={{ '--op': scopePriority === option ? 1 : 0.55, '--outline': scopePriority === option ? "2px solid var(--lime)" : "none" } as React.CSSProperties}
                    onClick={() => setScopePriority(option)}
                    disabled={scopeSubmitting}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.projOverviewModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} disabled={scopeSubmitting} onClick={() => setScopeModal(false)}>Cancel</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                disabled={scopeSubmitting || !scopeTitle.trim()}
                onClick={() => void handleScopeSubmit()}
              >
                {scopeSubmitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Sign-off modal ─────────────────────────────────────────────────── */}
      {signoffModal ? (
        <div className={styles.projOverviewModalBackdrop} onClick={() => !signing && setSignoffModal(null)}>
          <div className={styles.projOverviewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.projOverviewModalHeader}>
              <span className={styles.projOverviewModalTitle}>Review & Sign Off</span>
              <button type="button" className={styles.projOverviewModalClose} aria-label="Close" disabled={signing} onClick={() => setSignoffModal(null)}>✕</button>
            </div>
            <div className={styles.projOverviewModalBody}>
              <div className={styles.projOverviewSignoffCard}>
                <div className={styles.projOverviewSignoffCardLabel}>Deliverable</div>
                <div className={styles.projOverviewSignoffCardName}>{signoffModal.name}</div>
                {signoffModal.description && <div className={cx("text11", "colorMuted", "mt6")}>{signoffModal.description}</div>}
              </div>
              <p className={styles.projOverviewSignoffCopy}>
                By signing off, you confirm this deliverable meets the agreed requirements. This creates a timestamped record in the project log.
              </p>
              <label className={styles.projOverviewFieldLabel}>Comments or notes?</label>
              <textarea
                className={styles.projOverviewFieldArea}
                placeholder="Optional notes before signing off..."
                value={signoffNotes}
                onChange={(e) => setSignoffNotes(e.target.value)}
                disabled={signing}
              />
            </div>
            <div className={styles.projOverviewModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} disabled={signing} onClick={() => setSignoffModal(null)}>Request Changes</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                disabled={signing}
                onClick={() => void handleSignOff()}
              >
                {signing ? "Signing…" : "Sign Off"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Ask Question modal ──────────────────────────────────────────────── */}
      {questionModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setQuestionModal(false)}>
          <div className={cx("card")} style={{ width: "100%", maxWidth: 480, margin: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className={cx("cardHd")}>
              <span className={cx("cardHdTitle")}>Ask a Question</span>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setQuestionModal(false)}>✕</button>
            </div>
            <div style={{ padding: "12px 16px 16px" }}>
              <div className={cx("text12", "colorMuted", "mb8")}>Send a question to your project team. We respond within 24 hours.</div>
              <textarea
                className={cx("profInput")}
                placeholder="What would you like to know?"
                rows={4}
                style={{ width: "100%", resize: "vertical" }}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                autoFocus
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setQuestionModal(false)}>Cancel</button>
                <button type="button" className={cx("btnSm", "btnAccent")} disabled={questionBusy || !questionText.trim()} onClick={() => void handleAskQuestion()}>
                  {questionBusy ? "Sending…" : "Send Question"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
