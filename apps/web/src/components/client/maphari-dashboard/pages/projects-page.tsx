import { useMemo, useState } from "react";
import { cx, styles } from "../style";
import { formatDateShort } from "../utils";
import type { ProjectCard } from "./types";
import type { PortalFile, PortalProjectChangeRequest } from "../../../../lib/api/portal";

/* ─────────────────────────────────────────────────────────────────────────────
   Project countdown helpers
   ───────────────────────────────────────────────────────────────────────────── */
function daysUntil(dueAt: string | null | undefined): number | null {
  if (!dueAt) return null;
  const diff = new Date(dueAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

type ChipTone = "green" | "amber" | "red";

function countdownChipTone(days: number): { label: string; tone: ChipTone; pulse: boolean } {
  if (days < 0)   return { label: `${Math.abs(days)}d overdue`, tone: "red",   pulse: true  };
  if (days === 0) return { label: "Due today!",                  tone: "red",   pulse: true  };
  if (days <= 7)  return { label: `${days}d left`,              tone: "red",   pulse: false };
  if (days <= 30) return { label: `${days}d left`,              tone: "amber", pulse: false };
  return             { label: `${days}d left`,                   tone: "green", pulse: false };
}

const CHIP_TONE_CLASS: Record<ChipTone, string> = {
  green: styles.countdownChipGreen,
  amber: styles.countdownChipAmber,
  red:   styles.countdownChipRed
};

/* ─────────────────────────────────────────────────────────────────────────────
   Milestone types & seed data
   ───────────────────────────────────────────────────────────────────────────── */
type MilestoneStatus = "done" | "review" | "progress" | "blocked" | "pending";

/* Icon tone drives which CSS class is applied to .msIcon and .msModalIcon */
type MilestoneIconTone = "purple" | "accent" | "amber" | "green";

type MilestoneItem = {
  id: number;
  title: string;
  icon: string;
  iconTone: MilestoneIconTone;
  status: MilestoneStatus;
  pct: number;
  due: string;
  project: string;
  desc: string;
  changelog: Array<{ dotTone: "green" | "accent" | "amber" | "red" | "muted"; text: string; time: string }>;
  actions: Array<{ label: string; cls?: "primary" | "danger" }>;
};

type GanttRow = {
  name: string;
  start: number;
  span: number;
  barTone: "green" | "accent" | "amber" | "red" | "purple";
  label: string;
  status: MilestoneStatus;
};

type ConfettiDot = {
  id: number;
  left: string;
  top: string;
  bg: string;
  delay: string;
  size: number;
};

/* ── CSS class lookup maps ── */
const MILESTONE_STATUS_BADGE: Record<MilestoneStatus, string> = {
  done:     styles.badgeGreen,
  review:   styles.badgeAccent,
  progress: styles.badgeAmber,
  blocked:  styles.badgeRed,
  pending:  styles.badgeMuted
};

const MILESTONE_CARD_BORDER: Record<MilestoneStatus, string> = {
  done:     styles.msCardBorderGreen,
  review:   styles.msCardBorderAccent,
  progress: styles.msCardBorderAmber,
  blocked:  styles.msCardBorderRed,
  pending:  styles.msCardBorderMuted
};

const MILESTONE_PROGRESS_FILL: Record<MilestoneStatus, string> = {
  done:     styles.progressFillGreen,
  review:   styles.progressFillAccent,
  progress: styles.progressFillAmber,
  blocked:  styles.progressFillRed,
  pending:  styles.progressFillMuted
};

const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  done:     "Done",
  review:   "In Review",
  progress: "In Progress",
  blocked:  "Blocked",
  pending:  "Not Started"
};

const MS_ICON_CLASS: Record<MilestoneIconTone, string> = {
  purple: styles.msIconPurple,
  accent: styles.msIconAccent,
  amber:  styles.msIconAmber,
  green:  styles.msIconGreen
};

const MS_MODAL_ICON_CLASS: Record<MilestoneIconTone, string> = {
  purple: styles.msModalIconPurple,
  accent: styles.msModalIconAccent,
  amber:  styles.msModalIconAmber,
  green:  styles.msModalIconGreen
};

const CHANGELOG_DOT_CLASS: Record<"green" | "accent" | "amber" | "red" | "muted", string> = {
  green:  styles.msChangelogDotGreen,
  accent: styles.msChangelogDotAccent,
  amber:  styles.msChangelogDotAmber,
  red:    styles.msChangelogDotRed,
  muted:  styles.msChangelogDotMuted
};

const GANTT_BAR_CLASS: Record<"green" | "accent" | "amber" | "red" | "purple", string> = {
  green:  styles.ganttBarGreen,
  accent: styles.ganttBarAccent,
  amber:  styles.ganttBarAmber,
  red:    styles.ganttBarRed,
  purple: styles.ganttBarPurple
};

const MILESTONE_PROJECTS = ["All Projects", "Client Portal v2", "Lead Pipeline", "Automation Suite"];

const STAR_LABEL = ["", "Needs work", "Fair", "Good", "Great", "Excellent!"];

const MILESTONES: MilestoneItem[] = [
  {
    id: 1,
    title: "Discovery & Scoping",
    icon: "🔍",
    iconTone: "purple",
    status: "done",
    pct: 100,
    due: "Jan 15",
    project: "Client Portal v2",
    desc: "Full discovery phase including stakeholder interviews, technical audit, and scope definition.",
    changelog: [{ dotTone: "green", text: "Scope document signed off", time: "Jan 15" }],
    actions: []
  },
  {
    id: 2,
    title: "UI/UX Design System",
    icon: "🎨",
    iconTone: "purple",
    status: "review",
    pct: 95,
    due: "Feb 10",
    project: "Client Portal v2",
    desc: "Design system including components, typography, tokens, and responsive layouts.",
    changelog: [{ dotTone: "accent", text: "V3 screens uploaded", time: "Feb 09" }],
    actions: [
      { label: "Sign Off", cls: "primary" },
      { label: "Request Revision" },
      { label: "Download Figma" }
    ]
  },
  {
    id: 3,
    title: "Frontend Development",
    icon: "💻",
    iconTone: "accent",
    status: "progress",
    pct: 72,
    due: "Mar 01",
    project: "Client Portal v2",
    desc: "Dashboard, auth, and invoice modules complete. Notifications and settings are in progress.",
    changelog: [{ dotTone: "amber", text: "Settings screen in progress", time: "Feb 20" }],
    actions: [{ label: "View Staging", cls: "primary" }, { label: "View Progress" }]
  },
  {
    id: 4,
    title: "Backend API",
    icon: "⚙",
    iconTone: "amber",
    status: "review",
    pct: 100,
    due: "Feb 18",
    project: "Lead Pipeline",
    desc: "14 REST endpoints deployed to staging and waiting for production sign-off.",
    changelog: [{ dotTone: "accent", text: "Load testing passed", time: "Feb 18" }],
    actions: [{ label: "Approve for Production", cls: "primary" }, { label: "View Docs" }]
  },
  {
    id: 5,
    title: "UAT & Quality Assurance",
    icon: "✅",
    iconTone: "green",
    status: "blocked",
    pct: 30,
    due: "Feb 28",
    project: "Lead Pipeline",
    desc: "UAT blocked pending API milestone sign-off and checklist approval.",
    changelog: [{ dotTone: "red", text: "Blocked: awaiting API sign-off", time: "Feb 19" }],
    actions: [{ label: "View Checklist", cls: "primary" }, { label: "Unblock", cls: "danger" }]
  },
  {
    id: 6,
    title: "Workflow Automations",
    icon: "🤖",
    iconTone: "accent",
    status: "pending",
    pct: 0,
    due: "Mar 20",
    project: "Automation Suite",
    desc: "Invoice reminders, milestone sync, and digest automations queued for implementation.",
    changelog: [{ dotTone: "muted", text: "Scope approved, pending sprint allocation", time: "Feb 15" }],
    actions: [{ label: "View Scope" }, { label: "Submit Change Request" }]
  }
];

const GANTT_ROWS: GanttRow[] = [
  { name: "Discovery",     start: 0, span: 2, barTone: "green",  label: "Done",    status: "done"     },
  { name: "Design System", start: 2, span: 3, barTone: "accent", label: "Review",  status: "review"   },
  { name: "Frontend Dev",  start: 3, span: 4, barTone: "amber",  label: "72%",     status: "progress" },
  { name: "Backend API",   start: 2, span: 3, barTone: "accent", label: "Done",    status: "review"   },
  { name: "UAT / QA",      start: 5, span: 2, barTone: "red",    label: "Blocked", status: "blocked"  },
  { name: "Go-Live",       start: 7, span: 1, barTone: "purple", label: "Mar 14",  status: "pending"  }
];

const WEEKS = ["Jan W3", "Jan W4", "Feb W1", "Feb W2", "Feb W3", "Feb W4", "Mar W1", "Mar W2"];

/* ─────────────────────────────────────────────────────────────────────────────
   Props & helper maps
   ───────────────────────────────────────────────────────────────────────────── */
type ProjectTab = "Overview" | "Milestones" | "Gantt" | "Change Requests" | "Notes";

type ProjectsPageProps = {
  active: boolean;
  projectsCount: number;
  projectCards: ProjectCard[];
  animateProgress: boolean;
  milestoneApprovals: Record<string, { status: "PENDING" | "APPROVED" | "REJECTED" }>;
  onApproveMilestone: (milestoneId: string) => void;
  onRejectMilestone: (milestoneId: string) => void;
  onExportProjects: () => void;
  currency: string;
  files: PortalFile[];
  changeRequests: PortalProjectChangeRequest[];
  changeRequestForm: {
    projectId: string;
    title: string;
    description: string;
    reason: string;
    impactSummary: string;
  };
  onChangeRequestFormChange: (next: ProjectsPageProps["changeRequestForm"]) => void;
  onSubmitChangeRequest: () => void;
  submittingChangeRequest: boolean;
  onClientDecision: (
    changeRequestId: string,
    status: "CLIENT_APPROVED" | "CLIENT_REJECTED",
    metadata?: { addendumFileId?: string; additionalPaymentInvoiceId?: string; additionalPaymentId?: string }
  ) => void;
};

const CHANGE_STATUS_LABEL: Record<PortalProjectChangeRequest["status"], string> = {
  DRAFT:          "Draft",
  SUBMITTED:      "Submitted",
  ESTIMATED:      "Estimated",
  CLIENT_APPROVED: "Approved",
  CLIENT_REJECTED: "Rejected",
  ADMIN_APPROVED:  "Approved (Admin)",
  ADMIN_REJECTED:  "Rejected (Admin)"
};

function toneForProjectStatus(status: string): string {
  if (status === "COMPLETED") return "bgGreen";
  if (status === "REVIEW") return "bgAmber";
  if (status === "IN_PROGRESS" || status === "PLANNING") return "bgPurple";
  if (status === "BLOCKED" || status === "AT_RISK" || status === "ON_HOLD" || status === "CANCELLED") return "bgRed";
  return "bgAmber";
}

/* ─────────────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────────────── */
export function ClientProjectsPage({
  active,
  projectsCount,
  projectCards,
  animateProgress,
  onApproveMilestone,
  onRejectMilestone,
  onExportProjects,
  changeRequests,
  changeRequestForm,
  onChangeRequestFormChange,
  onSubmitChangeRequest,
  submittingChangeRequest,
  onClientDecision,
  currency
}: ProjectsPageProps) {
  /* ── Tab state ── */
  const [activeTab, setActiveTab] = useState<ProjectTab>("Overview");

  /* ── Notes state ── */
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteProject, setNoteProject] = useState("");
  const [noteText, setNoteText] = useState("");

  /* ── Change request state ── */
  const [feedback, setFeedback] = useState<string | null>(null);

  /* ── Milestone state ── */
  const [activeProject, setActiveProject] = useState("All Projects");
  const [expanded, setExpanded] = useState<Set<number>>(new Set([2]));
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);
  const [approveModal, setApproveModal] = useState<MilestoneItem | null>(null);
  const [rejectModal, setRejectModal] = useState<MilestoneItem | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [confetti, setConfetti] = useState<ConfettiDot[]>([]);
  const [localApprovals, setLocalApprovals] = useState<Record<number, "APPROVED" | "REJECTED">>({});

  /* ── Derived — projects ── */
  const projectStats = useMemo(() => {
    const activeCount = projectCards.filter(
      (p) => p.status !== "COMPLETED" && p.status !== "CANCELLED"
    ).length;
    const atRiskCount = projectCards.filter((p) =>
      ["AT_RISK", "BLOCKED", "ON_HOLD"].includes(p.status)
    ).length;
    const avgProgress = Math.round(
      projectCards.reduce((sum, p) => sum + p.progressPercent, 0) / Math.max(projectCards.length, 1)
    );
    return { total: projectsCount, activeCount, atRiskCount, avgProgress };
  }, [projectCards, projectsCount]);

  const visibleChangeRequests = useMemo(
    () => (changeRequests.length > 0 ? changeRequests.slice(0, 6) : []),
    [changeRequests]
  );

  const requestByProject = useMemo(() => {
    const map = new Map<string, number>();
    changeRequests.forEach((item) => {
      map.set(item.projectId, (map.get(item.projectId) ?? 0) + 1);
    });
    return map;
  }, [changeRequests]);

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    projectCards.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [projectCards]);

  /* ── Derived — milestones ── */
  const filteredMilestones = useMemo(
    () => MILESTONES.filter((m) => activeProject === "All Projects" || m.project === activeProject),
    [activeProject]
  );

  const milestoneStats = useMemo(() => ({
    total:      filteredMilestones.length,
    done:       filteredMilestones.filter((m) => m.status === "done").length,
    inprogress: filteredMilestones.filter((m) => m.status === "progress" || m.status === "review").length,
    avg:        Math.round(
      filteredMilestones.reduce((sum, m) => sum + m.pct, 0) / Math.max(filteredMilestones.length, 1)
    )
  }), [filteredMilestones]);

  /* ── Handlers — change requests ── */
  const canSubmitChange =
    Boolean(changeRequestForm.projectId) &&
    changeRequestForm.title.trim().length >= 3 &&
    !submittingChangeRequest;

  const handleSubmitChange = () => {
    if (!canSubmitChange) return;
    onSubmitChangeRequest();
    setFeedback("Change request submitted.");
    window.setTimeout(() => setFeedback(null), 2600);
  };

  /* ── Handlers — milestones ── */
  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3200);
  };

  const fireConfetti = () => {
    const dots: ConfettiDot[] = Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left:  `${5 + Math.random() * 90}%`,
      top:   `${Math.random() * 45}%`,
      bg:    ["var(--accent)", "var(--purple)", "var(--green)", "var(--amber)"][i % 4],
      delay: `${Math.random() * 0.5}s`,
      size:  4 + Math.random() * 7
    }));
    setConfetti(dots);
    window.setTimeout(() => setConfetti([]), 2600);
  };

  const handleConfirmApproval = () => {
    if (!approveModal) return;
    setLocalApprovals((prev) => ({ ...prev, [approveModal.id]: "APPROVED" }));
    onApproveMilestone(String(approveModal.id));
    const title = approveModal.title;
    setApproveModal(null);
    setRating(5);
    setComment("");
    fireConfetti();
    showToast(`${title} approved!`, `${rating} star${rating === 1 ? "" : "s"} — thank you for the feedback`);
  };

  const handleConfirmReject = () => {
    if (!rejectModal) return;
    setLocalApprovals((prev) => ({ ...prev, [rejectModal.id]: "REJECTED" }));
    onRejectMilestone(String(rejectModal.id));
    const title = rejectModal.title;
    setRejectModal(null);
    setRejectReason("");
    showToast("Revision requested", title);
  };

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  /* ─────────────────────────────────────────────────────────────────────────
     Render
     ───────────────────────────────────────────────────────────────────────── */
  return (
    <section className={cx("page", active && "pageActive")} id="page-projects">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className={styles.pageHeader} id="tour-page-projects">
        <div>
          <div className={styles.eyebrow}>Work</div>
          <div className={styles.pageTitle}>Projects</div>
          <div className={styles.pageSub}>
            Portfolio view across {projectsCount} project{projectsCount === 1 ? "" : "s"} with milestones,
            timeline, and change control.
          </div>
        </div>
        <div className={styles.pageHeaderActions}>
          <button className={cx("button", "buttonAccent")} type="button" onClick={onExportProjects}>
            Export Projects
          </button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className={styles.statGrid}>
        {[
          { lbl: "Total Projects", val: String(projectStats.total),      sub: "All scoped workstreams",     bar: styles.statBarAccent  },
          { lbl: "Active",         val: String(projectStats.activeCount), sub: "Currently in delivery",      bar: styles.statBarGreen   },
          { lbl: "At Risk",        val: String(projectStats.atRiskCount), sub: "Need escalation or unblock", bar: styles.statBarRed     },
          { lbl: "Avg. Progress",  val: `${projectStats.avgProgress}%`,  sub: "Across all projects",        bar: styles.statBarPurple  }
        ].map((item) => (
          <div key={item.lbl} className={styles.statCard}>
            <div className={cx(styles.statBar, item.bar)} />
            <div className={styles.statLabel}>{item.lbl}</div>
            <div className={styles.statValue}>{item.val}</div>
            <div className={styles.statSub}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className={cx(styles.filterBar, styles.filterBarWide)}>
        {(["Overview", "Milestones", "Gantt", "Change Requests", "Notes"] as const).map((tab) => (
          <button
            key={tab}
            className={cx(styles.filterTab, activeTab === tab && styles.filterTabActive)}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div className={styles.tabScroll}>

        {/* ════ OVERVIEW TAB ════════════════════════════════════════════ */}
        {activeTab === "Overview" ? (
          <div className={styles.tabPanel}>
            <div className={styles.grid2}>
              {/* Project portfolio table */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardHeaderTitle}>Project Portfolio</span>
                  <span className={styles.cardLink}>{projectCards.length} rows</span>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectCards.length === 0 ? (
                        <tr>
                          <td colSpan={4} className={styles.emptyState}>
                            No projects available yet.
                          </td>
                        </tr>
                      ) : (
                        projectCards.map((project) => (
                          <tr key={project.id}>
                            <td>
                              <div className={styles.tableName}>{project.name}</div>
                              <div className={styles.tableSub}>
                                {project.ownerName ? `Owner: ${project.ownerName}` : "Owner unassigned"}
                                {` · ${requestByProject.get(project.id) ?? 0} change request(s)`}
                              </div>
                            </td>
                            <td>
                              <span
                                className={cx(
                                  "badge",
                                  styles[toneForProjectStatus(project.status) as keyof typeof styles]
                                )}
                              >
                                {project.status.replaceAll("_", " ")}
                              </span>
                            </td>
                            <td>
                              <div className={styles.progressRow}>
                                <div className={styles.progressBar}>
                                  <div
                                    className={cx(
                                      styles.progressFill,
                                      !animateProgress && styles.progressFillInstant,
                                      styles[(project.progressTone || "pfPurple") as keyof typeof styles]
                                    )}
                                    style={{ "--fill-w": `${project.progressPercent}%` } as React.CSSProperties}
                                  />
                                </div>
                                <span className={styles.progressPct}>{project.progressPercent}%</span>
                              </div>
                              {project.budgetCents > 0 ? (
                                <div className={styles.budgetHint}>
                                  Budget: {currency} {(project.budgetCents / 100).toLocaleString()}
                                </div>
                              ) : null}
                            </td>
                            <td>
                              <div className={styles.tableSub}>
                                {project.dueAt ? formatDateShort(project.dueAt) : "TBD"}
                              </div>
                              {(() => {
                                const days = daysUntil(project.dueAt);
                                if (days === null) return null;
                                const chip = countdownChipTone(days);
                                return (
                                  <div
                                    className={cx(
                                      styles.countdownChip,
                                      CHIP_TONE_CLASS[chip.tone],
                                      chip.pulse && styles.countdownChipPulse
                                    )}
                                  >
                                    {chip.label}
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent change requests summary */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardHeaderTitle}>Recent Change Requests</span>
                  <button
                    type="button"
                    className={cx("button", "buttonGhost", styles.btnViewAll)}
                    onClick={() => setActiveTab("Change Requests")}
                  >
                    View all
                  </button>
                </div>
                <div className={cx(styles.cardBody, styles.cardBodySnug)}>
                  {visibleChangeRequests.length === 0 ? (
                    <div className={styles.emptyState}>No change requests yet.</div>
                  ) : (
                    <div className={styles.actionList}>
                      {visibleChangeRequests.map((request) => (
                        <div key={request.id} className={styles.actionItem}>
                          <div className={cx(styles.actionDot, styles.actionDotPurple)} />
                          <div className={styles.actionBody}>
                            <div className={styles.actionTitle}>{request.title}</div>
                            <div className={styles.actionMeta}>
                              {CHANGE_STATUS_LABEL[request.status]} ·{" "}
                              {projectNameById.get(request.projectId) ?? "Unknown project"}
                            </div>
                          </div>
                          {request.status === "ESTIMATED" ? (
                            <div className={styles.btnPair}>
                              <button
                                type="button"
                                className={cx("button", "buttonGhost")}
                                onClick={() => onClientDecision(request.id, "CLIENT_REJECTED")}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className={cx("button", "buttonAccent")}
                                onClick={() => onClientDecision(request.id, "CLIENT_APPROVED")}
                              >
                                Approve
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ════ MILESTONES TAB ══════════════════════════════════════════ */}
        {activeTab === "Milestones" ? (
          <div>
            {/* Project filter chips */}
            <div className={styles.projectFilterBar}>
              {MILESTONE_PROJECTS.map((project) => (
                <button
                  key={project}
                  type="button"
                  className={cx(styles.projectChip, activeProject === project && styles.projectChipActive)}
                  onClick={() => setActiveProject(project)}
                >
                  {project}
                </button>
              ))}
            </div>

            {/* Milestone stat row */}
            <div className={styles.statGrid}>
              {[
                { lbl: "Total Milestones", val: String(milestoneStats.total),     sub: "This selection",   bar: styles.statBarAccent },
                { lbl: "Completed",        val: String(milestoneStats.done),       sub: "Signed off",       bar: styles.statBarGreen  },
                { lbl: "In Progress",      val: String(milestoneStats.inprogress), sub: "Active work",      bar: styles.statBarAmber  },
                { lbl: "Avg. Progress",    val: `${milestoneStats.avg}%`,          sub: "Across selection", bar: styles.statBarPurple }
              ].map((item) => (
                <div key={item.lbl} className={styles.statCard}>
                  <div className={cx(styles.statBar, item.bar)} />
                  <div className={styles.statLabel}>{item.lbl}</div>
                  <div className={styles.statValue}>{item.val}</div>
                  <div className={styles.statSub}>{item.sub}</div>
                </div>
              ))}
            </div>

            {/* Milestone cards */}
            <div className={cx(styles.tabPanel, styles.milestoneStack)}>
              {filteredMilestones.map((milestone) => {
                const localStatus = localApprovals[milestone.id];
                const isApproved = localStatus === "APPROVED";
                const isRejected = localStatus === "REJECTED";
                const borderClass = isApproved
                  ? styles.msCardBorderGreen
                  : isRejected
                    ? styles.msCardBorderRed
                    : MILESTONE_CARD_BORDER[milestone.status];
                const fillClass = isApproved
                  ? styles.progressFillGreen
                  : MILESTONE_PROGRESS_FILL[milestone.status];

                return (
                  <div
                    key={milestone.id}
                    className={cx(
                      styles.msCard,
                      borderClass,
                      (milestone.status === "done" || isApproved) && styles.msCardDimmed
                    )}
                  >
                    {/* Header row */}
                    <div className={styles.msCardHead}>
                      <div className={cx(styles.msIcon, MS_ICON_CLASS[milestone.iconTone])}>
                        {milestone.icon}
                      </div>
                      <div className={styles.msInfo}>
                        <div className={styles.msTitle}>{milestone.title}</div>
                        <div className={styles.msMeta}>
                          {milestone.project} · Due {milestone.due}
                        </div>
                      </div>
                      <div className={styles.msControls}>
                        {isApproved ? (
                          <span className={styles.msApprovedChip}>Approved</span>
                        ) : isRejected ? (
                          <span className={styles.msRejectedChip}>Revision Requested</span>
                        ) : (
                          <span className={cx(styles.badge, MILESTONE_STATUS_BADGE[milestone.status])}>
                            {MILESTONE_STATUS_LABEL[milestone.status]}
                          </span>
                        )}
                        <span className={styles.msPct}>{milestone.pct}%</span>
                        <button
                          className={cx("button", "buttonGhost")}
                          type="button"
                          onClick={() => toggleExpanded(milestone.id)}
                        >
                          {expanded.has(milestone.id) ? "Hide" : "View"}
                        </button>
                      </div>
                    </div>

                    <div className={cx(styles.progressTrack, styles.msProgressTrack)}>
                      <div
                        className={cx(styles.progressFill, fillClass)}
                        style={{ "--fill-w": `${milestone.pct}%` } as React.CSSProperties}
                      />
                    </div>

                    {/* Expanded detail */}
                    {expanded.has(milestone.id) ? (
                      <div className={styles.msBody}>
                        <div className={styles.msDesc}>{milestone.desc}</div>

                        {/* Changelog entry */}
                        {milestone.changelog.length > 0 ? (
                          <div className={styles.msChangelog}>
                            <div
                              className={cx(
                                styles.msChangelogDot,
                                CHANGELOG_DOT_CLASS[milestone.changelog[0].dotTone]
                              )}
                            />
                            <span className={styles.msChangelogText}>
                              {milestone.changelog[0].text}
                            </span>
                            <span className={styles.msChangelogTime}>
                              {milestone.changelog[0].time}
                            </span>
                          </div>
                        ) : null}

                        {/* Action buttons */}
                        {!isApproved && !isRejected && milestone.actions.length > 0 ? (
                          <div className={styles.msActions}>
                            {milestone.actions.map((action) => (
                              <button
                                key={action.label}
                                className={cx(
                                  "button",
                                  action.cls === "primary" ? "buttonAccent" : "buttonGhost",
                                  action.cls === "danger" && styles.btnDanger
                                )}
                                type="button"
                                onClick={() => {
                                  if (
                                    action.label === "Sign Off" ||
                                    action.label === "Approve for Production"
                                  ) {
                                    setApproveModal(milestone);
                                  } else if (action.label === "Request Revision") {
                                    setRejectModal(milestone);
                                  } else {
                                    showToast(action.label, milestone.title);
                                  }
                                }}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        ) : isApproved ? (
                          <div className={styles.msOutcomeApproved}>
                            You approved this milestone
                          </div>
                        ) : isRejected ? (
                          <div className={styles.msOutcomeRejected}>
                            You requested a revision on this milestone
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* ════ GANTT TAB ═══════════════════════════════════════════════ */}
        {activeTab === "Gantt" ? (
          <div className={styles.tabPanelGantt}>
            <div className={cx(styles.sectionTitle, styles.sectionTitleGantt)}>
              Project Timeline
            </div>

            {/* Column headers */}
            <div className={styles.ganttGrid}>
              <div className={styles.ganttColHeadFirst}>Milestone</div>
              {WEEKS.map((week) => (
                <div key={week} className={styles.ganttColHead}>{week}</div>
              ))}
            </div>

            {/* Gantt rows */}
            {GANTT_ROWS.map((row) => (
              <div key={row.name} className={styles.ganttRow}>
                <div className={styles.ganttRowLabel}>
                  <div className={styles.ganttRowName}>{row.name}</div>
                  <span className={cx(styles.badge, styles.ganttBadgeSmall, MILESTONE_STATUS_BADGE[row.status])}>
                    {MILESTONE_STATUS_LABEL[row.status]}
                  </span>
                </div>
                {Array.from({ length: 8 }, (_, colIndex) => (
                  <div
                    key={colIndex}
                    className={cx(styles.ganttCell, colIndex % 2 !== 0 && styles.ganttCellAlt)}
                  >
                    {colIndex === row.start ? (
                      <div
                        className={cx(styles.ganttBar, GANTT_BAR_CLASS[row.barTone])}
                        style={{ "--bar-w": `calc(${row.span * 100}% - 8px)` } as React.CSSProperties}
                      >
                        {row.label}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}

        {/* ════ CHANGE REQUESTS TAB ═════════════════════════════════════ */}
        {activeTab === "Change Requests" ? (
          <div className={styles.tabPanel}>
            <div className={styles.grid2}>
              {/* Open change requests list */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardHeaderTitle}>Open Change Requests</span>
                  <span className={styles.cardLink}>Recent</span>
                </div>
                <div className={cx(styles.cardBody, styles.cardBodySnug)}>
                  {visibleChangeRequests.length === 0 ? (
                    <div className={styles.emptyState}>No change requests yet.</div>
                  ) : (
                    <div className={styles.actionList}>
                      {visibleChangeRequests.map((request) => (
                        <div key={request.id} className={styles.actionItem}>
                          <div className={cx(styles.actionDot, styles.actionDotPurple)} />
                          <div className={styles.actionBody}>
                            <div className={styles.actionTitle}>{request.title}</div>
                            <div className={styles.actionMeta}>
                              {CHANGE_STATUS_LABEL[request.status]} ·{" "}
                              {projectNameById.get(request.projectId) ?? "Unknown project"}
                            </div>
                          </div>
                          {request.status === "ESTIMATED" ? (
                            <div className={styles.btnPair}>
                              <button
                                type="button"
                                className={cx("button", "buttonGhost")}
                                onClick={() => onClientDecision(request.id, "CLIENT_REJECTED")}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className={cx("button", "buttonAccent")}
                                onClick={() => onClientDecision(request.id, "CLIENT_APPROVED")}
                              >
                                Approve
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Create change request form */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardHeaderTitle}>Create Scope / Change Request</span>
                  <span className={styles.cardLink}>Client input</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.grid2}>
                    <div className={styles.field}>
                      <label htmlFor="cr-project" className={styles.fieldLabel}>Project</label>
                      <select
                        id="cr-project"
                        className={styles.fieldInput}
                        value={changeRequestForm.projectId}
                        onChange={(event) =>
                          onChangeRequestFormChange({
                            ...changeRequestForm,
                            projectId: event.target.value
                          })
                        }
                      >
                        <option value="">Select project</option>
                        {projectCards.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="cr-title" className={styles.fieldLabel}>Request Title</label>
                      <input
                        id="cr-title"
                        className={styles.fieldInput}
                        placeholder="Short title"
                        value={changeRequestForm.title}
                        onChange={(event) =>
                          onChangeRequestFormChange({ ...changeRequestForm, title: event.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="cr-description" className={styles.fieldLabel}>Description</label>
                    <textarea
                      id="cr-description"
                      className={cx(styles.fieldInput, styles.textareaDesc)}
                      placeholder="Describe what should change"
                      value={changeRequestForm.description}
                      onChange={(event) =>
                        onChangeRequestFormChange({ ...changeRequestForm, description: event.target.value })
                      }
                    />
                  </div>

                  <div className={styles.grid2}>
                    <div className={styles.field}>
                      <label htmlFor="cr-reason" className={styles.fieldLabel}>Reason</label>
                      <input
                        id="cr-reason"
                        className={styles.fieldInput}
                        placeholder="Business reason"
                        value={changeRequestForm.reason}
                        onChange={(event) =>
                          onChangeRequestFormChange({ ...changeRequestForm, reason: event.target.value })
                        }
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="cr-impact" className={styles.fieldLabel}>Estimated Impact</label>
                      <input
                        id="cr-impact"
                        className={styles.fieldInput}
                        placeholder="e.g. +2 weeks or +R 15,000"
                        value={changeRequestForm.impactSummary}
                        onChange={(event) =>
                          onChangeRequestFormChange({
                            ...changeRequestForm,
                            impactSummary: event.target.value
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className={styles.inlineActions}>
                    <button
                      type="button"
                      className={cx("button", "buttonAccent")}
                      disabled={!canSubmitChange}
                      onClick={handleSubmitChange}
                    >
                      {submittingChangeRequest ? "Submitting..." : "Submit Change Request"}
                    </button>
                    {feedback ? <span className={styles.pageSub}>{feedback}</span> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ════ NOTES TAB ════════════════════════════════════════════ */}
        {activeTab === "Notes" ? (
          <div className={styles.tabPanel}>
            <div className={styles.card} style={{ maxWidth: 720 }}>
              <div className={styles.cardHeader}>
                <span className={styles.cardHeaderTitle}>Quick Notes</span>
                <span className={styles.cardLink}>{Object.keys(notes).length} saved</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGroup} style={{ marginBottom: 12 }}>
                  <label className={styles.formLabel}>Project</label>
                  <select
                    title="Note project"
                    className={styles.formSelect}
                    value={noteProject}
                    onChange={(e) => setNoteProject(e.target.value)}
                  >
                    <option value="">Select a project...</option>
                    {projectCards.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  className={styles.noteTextarea}
                  placeholder="Write a note about this project..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  <button
                    className={cx("button", "buttonAccent")}
                    type="button"
                    disabled={!noteProject || !noteText.trim()}
                    onClick={() => {
                      if (!noteProject || !noteText.trim()) return;
                      const key = `${noteProject}-${Date.now()}`;
                      setNotes((prev) => ({ ...prev, [key]: noteText.trim() }));
                      setNoteText("");
                      showToast("Note saved", "Your note has been recorded");
                    }}
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>

            {/* Saved notes */}
            {Object.keys(notes).length > 0 ? (
              <div style={{ maxWidth: 720, marginTop: 16 }}>
                <div className={styles.sectionTitle} style={{ marginBottom: 10 }}>Saved Notes</div>
                {Object.entries(notes).reverse().map(([key, text]) => {
                  const projectId = key.split("-").slice(0, -1).join("-");
                  const projectName = projectCards.find((p) => p.id === projectId)?.name ?? projectId;
                  return (
                    <div key={key} className={styles.noteItem}>
                      <div className={styles.noteItemProject}>{projectName}</div>
                      <div className={styles.noteItemText}>{text}</div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ── Approval Modal ──────────────────────────────────────────────── */}
      {approveModal ? (
        <div className={styles.overlay} onClick={() => setApproveModal(null)}>
          <div
            className={cx(styles.modal, styles.modalMd)}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Approve Milestone</span>
              <button className={styles.modalClose} type="button" onClick={() => setApproveModal(null)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.msModalIdentity}>
                <div className={cx(styles.msModalIcon, MS_MODAL_ICON_CLASS[approveModal.iconTone])}>
                  {approveModal.icon}
                </div>
                <div>
                  <div className={styles.msModalTitle}>{approveModal.title}</div>
                  <div className={styles.msModalProject}>{approveModal.project}</div>
                </div>
              </div>

              <div className={styles.ratingSection}>
                <div className={styles.ratingLabel}>
                  How satisfied are you with this deliverable?
                </div>
                <div className={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={cx(styles.star, (hoverRating || rating) >= star ? styles.starActive : undefined)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div className={styles.ratingHint}>{STAR_LABEL[hoverRating || rating]}</div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Feedback for the team (optional)</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="What stood out? Any notes or appreciation for the team?"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={cx("button", "buttonGhost")}
                type="button"
                onClick={() => setApproveModal(null)}
              >
                Cancel
              </button>
              <button
                className={cx("button", "buttonAccent")}
                type="button"
                onClick={handleConfirmApproval}
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Rejection Modal ─────────────────────────────────────────────── */}
      {rejectModal ? (
        <div className={styles.overlay} onClick={() => setRejectModal(null)}>
          <div
            className={cx(styles.modal, styles.modalSm)}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Request Revision</span>
              <button className={styles.modalClose} type="button" onClick={() => setRejectModal(null)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.msModalIdentity}>
                <div className={cx(styles.msModalIcon, MS_MODAL_ICON_CLASS[rejectModal.iconTone])}>
                  {rejectModal.icon}
                </div>
                <div>
                  <div className={styles.msModalTitle}>{rejectModal.title}</div>
                  <div className={styles.msModalProject}>{rejectModal.project}</div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>What needs to be revised?</label>
                <textarea
                  className={cx(styles.formTextarea, styles.textareaRevise)}
                  placeholder="Describe what changes or corrections are needed before you can sign off..."
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                />
              </div>
              <div className={styles.rejectNotice}>
                The team will be notified and work will resume once revisions are submitted for your review.
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={cx("button", "buttonGhost")}
                type="button"
                onClick={() => setRejectModal(null)}
              >
                Cancel
              </button>
              <button
                className={cx("button", "buttonGhost", styles.btnRejectConfirm)}
                type="button"
                onClick={handleConfirmReject}
              >
                Request Revision
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Confetti burst ──────────────────────────────────────────────── */}
      {confetti.length > 0 ? (
        <div className={styles.confettiLayer}>
          {confetti.map((dot) => (
            <div
              key={dot.id}
              className={styles.confettiDot}
              style={{
                "--c-left":   dot.left,
                "--c-top":    dot.top,
                "--c-size":   `${dot.size}px`,
                "--c-radius": `${dot.size * 0.35}px`,
                "--c-bg":     dot.bg,
                "--c-delay":  dot.delay
              } as React.CSSProperties}
            />
          ))}
        </div>
      ) : null}

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast ? (
        <div className={styles.toast}>
          <div className={styles.toastIcon}>✓</div>
          <div>
            <div className={styles.toastText}>{toast.text}</div>
            <div className={styles.toastSub}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
