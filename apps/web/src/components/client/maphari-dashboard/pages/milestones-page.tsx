import { useMemo, useState } from "react";
import { cx, styles } from "../style";

type ClientMilestonesPageProps = {
  active: boolean;
  onApproveMilestone?: (milestoneId: string, rating: number, comment: string) => void;
  onRejectMilestone?: (milestoneId: string, reason: string) => void;
};

type MilestoneStatus = "done" | "review" | "progress" | "blocked" | "pending";
type MilestoneTab = "Milestones" | "Gantt" | "Blockers";

type MilestoneItem = {
  id: number;
  title: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  status: MilestoneStatus;
  pct: number;
  due: string;
  project: string;
  desc: string;
  changelog: Array<{ dot: string; text: string; time: string }>;
  actions: Array<{ label: string; cls?: "primary" | "danger" }>;
};

type GanttRow = {
  name: string;
  start: number;
  span: number;
  color: string;
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

const STATUS_BADGE: Record<MilestoneStatus, string> = {
  done: styles.badgeGreen,
  review: styles.badgeAccent,
  progress: styles.badgeAmber,
  blocked: styles.badgeRed,
  pending: styles.badgeMuted,
};

const STATUS_BORDER: Record<MilestoneStatus, string> = {
  done: "var(--green)",
  review: "var(--accent)",
  progress: "var(--amber)",
  blocked: "var(--red)",
  pending: "var(--muted2)",
};

const PROGRESS_COLOR: Record<MilestoneStatus, string> = {
  done: "var(--green)",
  review: "var(--accent)",
  progress: "var(--amber)",
  blocked: "var(--red)",
  pending: "var(--muted2)",
};

const PROJECTS = ["All Projects", "Client Portal v2", "Lead Pipeline", "Automation Suite"];

const MILESTONES: MilestoneItem[] = [
  {
    id: 1,
    title: "Discovery & Scoping",
    icon: "🔍",
    iconBg: "var(--purple-d)",
    iconColor: "var(--purple)",
    status: "done",
    pct: 100,
    due: "Jan 15",
    project: "Client Portal v2",
    desc: "Full discovery phase including stakeholder interviews, technical audit, and scope definition.",
    changelog: [{ dot: "var(--green)", text: "Scope document signed off", time: "Jan 15" }],
    actions: []
  },
  {
    id: 2,
    title: "UI/UX Design System",
    icon: "🎨",
    iconBg: "var(--purple-d)",
    iconColor: "var(--purple)",
    status: "review",
    pct: 95,
    due: "Feb 10",
    project: "Client Portal v2",
    desc: "Design system including components, typography, tokens, and responsive layouts.",
    changelog: [{ dot: "var(--accent)", text: "V3 screens uploaded", time: "Feb 09" }],
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
    iconBg: "var(--accent-d)",
    iconColor: "var(--accent)",
    status: "progress",
    pct: 72,
    due: "Mar 01",
    project: "Client Portal v2",
    desc: "Dashboard, auth, and invoice modules complete. Notifications and settings are in progress.",
    changelog: [{ dot: "var(--amber)", text: "Settings screen in progress", time: "Feb 20" }],
    actions: [{ label: "View Staging", cls: "primary" }, { label: "View Progress" }]
  },
  {
    id: 4,
    title: "Backend API",
    icon: "⚙",
    iconBg: "var(--amber-d)",
    iconColor: "var(--amber)",
    status: "review",
    pct: 100,
    due: "Feb 18",
    project: "Lead Pipeline",
    desc: "14 REST endpoints deployed to staging and waiting for production sign-off.",
    changelog: [{ dot: "var(--accent)", text: "Load testing passed", time: "Feb 18" }],
    actions: [{ label: "Approve for Production", cls: "primary" }, { label: "View Docs" }]
  },
  {
    id: 5,
    title: "UAT & Quality Assurance",
    icon: "✅",
    iconBg: "var(--green-d)",
    iconColor: "var(--green)",
    status: "blocked",
    pct: 30,
    due: "Feb 28",
    project: "Lead Pipeline",
    desc: "UAT blocked pending API milestone sign-off and checklist approval.",
    changelog: [{ dot: "var(--red)", text: "Blocked: awaiting API sign-off", time: "Feb 19" }],
    actions: [{ label: "View Checklist", cls: "primary" }, { label: "Unblock", cls: "danger" }]
  },
  {
    id: 6,
    title: "Workflow Automations",
    icon: "🤖",
    iconBg: "var(--accent-d)",
    iconColor: "var(--accent)",
    status: "pending",
    pct: 0,
    due: "Mar 20",
    project: "Automation Suite",
    desc: "Invoice reminders, milestone sync, and digest automations queued for implementation.",
    changelog: [{ dot: "var(--muted2)", text: "Scope approved, pending sprint allocation", time: "Feb 15" }],
    actions: [{ label: "View Scope" }, { label: "Submit Change Request" }]
  }
];

const BLOCKERS = [
  {
    icon: "⛔",
    title: "API Sign-off Blocking UAT",
    desc: "UAT cannot begin until client approves the Backend API milestone.",
    owner: "Owner: Delivery Team"
  },
  {
    icon: "⚠",
    title: "INV-011 Overdue Payment",
    desc: "Invoice overdue by 18 days. Delivery pacing could be impacted.",
    owner: "Owner: Billing"
  }
];

const GANTT_ROWS: GanttRow[] = [
  { name: "Discovery", start: 0, span: 2, color: "var(--green)", label: "Done", status: "done" },
  { name: "Design System", start: 2, span: 3, color: "var(--accent)", label: "Review", status: "review" },
  { name: "Frontend Dev", start: 3, span: 4, color: "var(--amber)", label: "72%", status: "progress" },
  { name: "Backend API", start: 2, span: 3, color: "var(--accent)", label: "Done", status: "review" },
  { name: "UAT / QA", start: 5, span: 2, color: "var(--red)", label: "Blocked", status: "blocked" },
  { name: "Go-Live", start: 7, span: 1, color: "var(--purple)", label: "Mar 14", status: "pending" }
];

const WEEKS = ["Jan W3", "Jan W4", "Feb W1", "Feb W2", "Feb W3", "Feb W4", "Mar W1", "Mar W2"];

const statusLabel: Record<MilestoneStatus, string> = {
  done: "Done",
  review: "In Review",
  progress: "In Progress",
  blocked: "Blocked",
  pending: "Not Started"
};

const STAR_LABEL = ["", "Needs work", "Fair", "Good", "Great", "Excellent! 🎉"];

export function ClientMilestonesPage({ active, onApproveMilestone, onRejectMilestone }: ClientMilestonesPageProps) {
  const [activeTab, setActiveTab] = useState<MilestoneTab>("Milestones");
  const [activeProject, setActiveProject] = useState("All Projects");
  const [expanded, setExpanded] = useState<Set<number>>(new Set([2]));
  const [scopeModal, setScopeModal] = useState(false);
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);

  // Feature 5 — approval flow state
  const [approveModal, setApproveModal] = useState<MilestoneItem | null>(null);
  const [rejectModal, setRejectModal] = useState<MilestoneItem | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [confetti, setConfetti] = useState<ConfettiDot[]>([]);
  const [localApprovals, setLocalApprovals] = useState<Record<number, "APPROVED" | "REJECTED">>({});

  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3200);
  };

  const fireConfetti = () => {
    const dots: ConfettiDot[] = Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      top: `${Math.random() * 45}%`,
      bg: ["var(--accent)", "var(--purple)", "var(--green)", "var(--amber)"][i % 4],
      delay: `${Math.random() * 0.5}s`,
      size: 4 + Math.random() * 7
    }));
    setConfetti(dots);
    window.setTimeout(() => setConfetti([]), 2600);
  };

  const handleConfirmApproval = () => {
    if (!approveModal) return;
    setLocalApprovals((prev) => ({ ...prev, [approveModal.id]: "APPROVED" }));
    onApproveMilestone?.(String(approveModal.id), rating, comment);
    const title = approveModal.title;
    setApproveModal(null);
    setRating(5);
    setComment("");
    fireConfetti();
    showToast(`${title} approved! 🎉`, `${rating} star${rating === 1 ? "" : "s"} — thank you for the feedback`);
  };

  const handleConfirmReject = () => {
    if (!rejectModal) return;
    setLocalApprovals((prev) => ({ ...prev, [rejectModal.id]: "REJECTED" }));
    onRejectMilestone?.(String(rejectModal.id), rejectReason);
    const title = rejectModal.title;
    setRejectModal(null);
    setRejectReason("");
    showToast("Revision requested", title);
  };

  const filteredMilestones = useMemo(
    () => MILESTONES.filter((item) => activeProject === "All Projects" || item.project === activeProject),
    [activeProject]
  );

  const stats = useMemo(() => {
    return {
      total: filteredMilestones.length,
      done: filteredMilestones.filter((item) => item.status === "done").length,
      inprogress: filteredMilestones.filter((item) => item.status === "progress" || item.status === "review").length,
      avg: Math.round(filteredMilestones.reduce((sum, item) => sum + item.pct, 0) / Math.max(filteredMilestones.length, 1))
    };
  }, [filteredMilestones]);

  const toggleExpanded = (id: number) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-milestones">
      <div className={styles.pageHeader} id="tour-page-milestones">
        <div>
          <div className={styles.eyebrow}>Work</div>
          <div className={styles.pageTitle}>Milestones</div>
          <div className={styles.pageSub}>Track phases, sign off deliverables, and resolve blockers fast.</div>
        </div>
        <div className={styles.headerRight}>
          <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={() => setScopeModal(true)}>
            + Scope Change
          </button>
          <button
            className={cx(styles.button, styles.buttonAccent)}
            type="button"
            onClick={() => showToast("Report generated", "PDF milestone report ready")}
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Project filter chips */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "14px 32px",
          borderBottom: "1px solid var(--border)",
          overflowX: "auto",
          flexShrink: 0
        }}
      >
        {PROJECTS.map((project) => (
          <button
            key={project}
            type="button"
            onClick={() => setActiveProject(project)}
            style={{
              padding: "6px 14px",
              background: activeProject === project ? "var(--accent-d)" : "transparent",
              border: activeProject === project ? "1px solid rgba(200,241,53,.3)" : "1px solid var(--border)",
              color: activeProject === project ? "var(--accent)" : "var(--muted)",
              fontSize: ".72rem",
              fontWeight: 600,
              transition: "all .15s",
              whiteSpace: "nowrap"
            }}
          >
            {project}
          </button>
        ))}
      </div>

      <div className={styles.statGrid}>
        {[
          { lbl: "Total Milestones", val: String(stats.total), sub: "This selection", bar: "var(--accent)" },
          { lbl: "Completed", val: String(stats.done), sub: "Signed off", bar: "var(--green)" },
          { lbl: "In Progress", val: String(stats.inprogress), sub: "Active work", bar: "var(--amber)" },
          { lbl: "Avg. Progress", val: `${stats.avg}%`, sub: "Across selection", bar: "var(--purple)" }
        ].map((item) => (
          <div key={item.lbl} className={styles.statCard}>
            <div className={styles.statBar} style={{ background: item.bar }} />
            <div className={styles.statLabel}>{item.lbl}</div>
            <div className={styles.statValue}>{item.val}</div>
            <div className={styles.statSub}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterBar} style={{ padding: "0 32px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {(["Milestones", "Gantt", "Blockers"] as const).map((tab) => (
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

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
        {activeTab === "Milestones" ? (
          <div style={{ padding: "20px 32px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredMilestones.map((milestone) => {
              const localStatus = localApprovals[milestone.id];
              const isApproved = localStatus === "APPROVED";
              const isRejected = localStatus === "REJECTED";
              const effectiveBorderColor = isApproved
                ? "var(--green)"
                : isRejected
                  ? "var(--red)"
                  : STATUS_BORDER[milestone.status];

              return (
                <div
                  key={milestone.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderLeft: `3px solid ${effectiveBorderColor}`,
                    opacity: milestone.status === "done" || isApproved ? 0.86 : 1,
                    overflow: "hidden",
                    transition: "all .18s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 7,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: ".85rem",
                        flexShrink: 0,
                        background: milestone.iconBg,
                        color: milestone.iconColor
                      }}
                    >
                      {milestone.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: ".82rem", fontWeight: 800, marginBottom: 2 }}>{milestone.title}</div>
                      <div style={{ fontSize: ".6rem", color: "var(--muted)" }}>
                        {milestone.project} · Due {milestone.due}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {isApproved ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 9px",
                            background: "rgba(52,217,139,.12)",
                            color: "var(--green)",
                            border: "1px solid rgba(52,217,139,.25)",
                            borderRadius: 4,
                            fontSize: ".62rem",
                            fontWeight: 700,
                            letterSpacing: ".04em"
                          }}
                        >
                          ✓ Approved
                        </span>
                      ) : isRejected ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 9px",
                            background: "rgba(255,95,95,.1)",
                            color: "var(--red)",
                            border: "1px solid rgba(255,95,95,.2)",
                            borderRadius: 4,
                            fontSize: ".62rem",
                            fontWeight: 700,
                            letterSpacing: ".04em"
                          }}
                        >
                          ✕ Revision Requested
                        </span>
                      ) : (
                        <span className={cx(styles.badge, STATUS_BADGE[milestone.status])}>
                          {statusLabel[milestone.status]}
                        </span>
                      )}
                      <span style={{ fontSize: ".72rem", fontWeight: 500 }}>{milestone.pct}%</span>
                      <button
                        className={cx(styles.button, styles.buttonGhost)}
                        type="button"
                        onClick={() => toggleExpanded(milestone.id)}
                      >
                        {expanded.has(milestone.id) ? "Hide" : "View"}
                      </button>
                    </div>
                  </div>

                  <div className={styles.progressTrack} style={{ margin: "0 18px", height: 3 }}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${milestone.pct}%`,
                        background: isApproved ? "var(--green)" : PROGRESS_COLOR[milestone.status],
                        transition: "width .6s cubic-bezier(.23,1,.32,1)"
                      }}
                    />
                  </div>

                  {expanded.has(milestone.id) ? (
                    <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)" }}>
                      <div style={{ fontSize: ".76rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>
                        {milestone.desc}
                      </div>
                      {/* Changelog entry */}
                      {milestone.changelog.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 14,
                            padding: "8px 12px",
                            background: "var(--s3)",
                            borderRadius: 6
                          }}
                        >
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: milestone.changelog[0].dot,
                              flexShrink: 0
                            }}
                          />
                          <span style={{ fontSize: ".7rem", color: "var(--muted)", flex: 1 }}>
                            {milestone.changelog[0].text}
                          </span>
                          <span style={{ fontSize: ".6rem", color: "var(--muted2)" }}>
                            {milestone.changelog[0].time}
                          </span>
                        </div>
                      ) : null}
                      {/* Action buttons — intercept approve/reject labels */}
                      {!isApproved && !isRejected && milestone.actions.length > 0 ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {milestone.actions.map((action) => (
                            <button
                              key={action.label}
                              className={cx(styles.button, action.cls === "primary" ? styles.buttonAccent : styles.buttonGhost)}
                              style={
                                action.cls === "danger"
                                  ? { color: "var(--red)", borderColor: "rgba(255,95,95,.35)" }
                                  : undefined
                              }
                              type="button"
                              onClick={() => {
                                if (action.label === "Sign Off" || action.label === "Approve for Production") {
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
                        <div style={{ fontSize: ".72rem", color: "var(--green)", fontWeight: 600 }}>
                          ✓ You approved this milestone
                        </div>
                      ) : isRejected ? (
                        <div style={{ fontSize: ".72rem", color: "var(--red)", fontWeight: 600 }}>
                          ✕ You requested a revision on this milestone
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "Gantt" ? (
          <div style={{ padding: "20px 32px 40px", overflowX: "auto" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "200px repeat(8,1fr)", marginBottom: 4 }}>
              <div
                style={{
                  fontSize: ".54rem",
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "var(--muted2)",
                  padding: "4px 12px"
                }}
              >
                Milestone
              </div>
              {WEEKS.map((week) => (
                <div
                  key={week}
                  style={{
                    fontSize: ".54rem",
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "var(--muted2)",
                    padding: "4px 8px",
                    textAlign: "center"
                  }}
                >
                  {week}
                </div>
              ))}
            </div>
            {/* Rows */}
            {GANTT_ROWS.map((row) => (
              <div
                key={row.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "200px repeat(8,1fr)",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                  minHeight: 44
                }}
              >
                <div style={{ padding: "8px 12px", borderRight: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, fontSize: ".72rem", marginBottom: 2 }}>{row.name}</div>
                  <span className={cx(styles.badge, STATUS_BADGE[row.status])} style={{ fontSize: ".52rem" }}>
                    {statusLabel[row.status]}
                  </span>
                </div>
                {Array.from({ length: 8 }, (_, columnIndex) => (
                  <div
                    key={columnIndex}
                    style={{
                      height: "100%",
                      position: "relative",
                      padding: "0 4px",
                      display: "flex",
                      alignItems: "center",
                      background: columnIndex % 2 === 0 ? "transparent" : "var(--tint-overlay)"
                    }}
                  >
                    {columnIndex === row.start ? (
                      <div
                        style={{
                          height: 18,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          padding: "0 6px",
                          fontSize: ".52rem",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          minWidth: 20,
                          background: row.color,
                          color: "var(--on-accent)",
                          width: `calc(${row.span * 100}% - 8px)`
                        }}
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

        {activeTab === "Blockers" ? (
          <div style={{ padding: "24px 32px 40px" }}>
            {BLOCKERS.map((blocker) => (
              <div
                key={blocker.title}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "14px 16px",
                  background: "rgba(255,95,95,.12)",
                  border: "1px solid rgba(255,95,95,.2)",
                  marginBottom: 8
                }}
              >
                <span>{blocker.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 800, color: "var(--red)", marginBottom: 3 }}>{blocker.title}</div>
                  <div style={{ fontSize: ".72rem", color: "var(--muted)", lineHeight: 1.5 }}>{blocker.desc}</div>
                  <div style={{ fontSize: ".6rem", color: "var(--muted2)", marginTop: 5 }}>{blocker.owner}</div>
                </div>
                <button
                  className={cx(styles.button, styles.buttonAccent)}
                  style={{ marginLeft: "auto", flexShrink: 0 }}
                  type="button"
                  onClick={() => showToast("Action taken", blocker.title)}
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* ── Approval Modal ──────────────────────────────────────── */}
      {approveModal ? (
        <div className={styles.overlay} onClick={() => setApproveModal(null)}>
          <div
            className={styles.modal}
            style={{ animation: "popIn 0.22s ease", maxWidth: 460 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Approve Milestone</span>
              <button className={styles.modalClose} type="button" onClick={() => setApproveModal(null)}>
                ✕
              </button>
            </div>
            <div style={{ padding: 24 }}>
              {/* Milestone identity card */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 14px",
                  background: "var(--s3)",
                  borderRadius: 10,
                  marginBottom: 22
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: ".9rem",
                    background: approveModal.iconBg,
                    color: approveModal.iconColor,
                    flexShrink: 0
                  }}
                >
                  {approveModal.icon}
                </div>
                <div>
                  <div style={{ fontSize: ".85rem", fontWeight: 700 }}>{approveModal.title}</div>
                  <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{approveModal.project}</div>
                </div>
              </div>

              {/* Star rating */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: ".7rem",
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    marginBottom: 4
                  }}
                >
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
                <div style={{ fontSize: ".72rem", color: "var(--muted)", height: 18 }}>
                  {STAR_LABEL[hoverRating || rating]}
                </div>
              </div>

              {/* Optional comment */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Feedback for the team (optional)</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="What stood out? Any notes or appreciation for the team?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end"
              }}
            >
              <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={() => setApproveModal(null)}>
                Cancel
              </button>
              <button className={cx(styles.button, styles.buttonAccent)} type="button" onClick={handleConfirmApproval}>
                ✓ Confirm Approval
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Rejection Modal ─────────────────────────────────────── */}
      {rejectModal ? (
        <div className={styles.overlay} onClick={() => setRejectModal(null)}>
          <div
            className={styles.modal}
            style={{ animation: "popIn 0.22s ease", maxWidth: 440 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Request Revision</span>
              <button className={styles.modalClose} type="button" onClick={() => setRejectModal(null)}>
                ✕
              </button>
            </div>
            <div style={{ padding: 24 }}>
              {/* Milestone identity card */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 14px",
                  background: "var(--s3)",
                  borderRadius: 10,
                  marginBottom: 22
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: ".9rem",
                    background: rejectModal.iconBg,
                    color: rejectModal.iconColor,
                    flexShrink: 0
                  }}
                >
                  {rejectModal.icon}
                </div>
                <div>
                  <div style={{ fontSize: ".85rem", fontWeight: 700 }}>{rejectModal.title}</div>
                  <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>{rejectModal.project}</div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>What needs to be revised?</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Describe what changes or corrections are needed before you can sign off…"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ minHeight: 100 }}
                />
              </div>
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  background: "rgba(255,95,95,.08)",
                  border: "1px solid rgba(255,95,95,.18)",
                  borderRadius: 8,
                  fontSize: ".7rem",
                  color: "var(--muted)",
                  lineHeight: 1.5
                }}
              >
                The team will be notified and work will resume once revisions are submitted for your review.
              </div>
            </div>
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end"
              }}
            >
              <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={() => setRejectModal(null)}>
                Cancel
              </button>
              <button
                className={cx(styles.button, styles.buttonGhost)}
                style={{ color: "var(--red)", borderColor: "rgba(255,95,95,.4)" }}
                type="button"
                onClick={handleConfirmReject}
              >
                Request Revision
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Scope change modal ──────────────────────────────────── */}
      {scopeModal ? (
        <div className={styles.overlay} onClick={() => setScopeModal(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Submit Scope Change Request</span>
              <button className={styles.modalClose} type="button" onClick={() => setScopeModal(false)}>
                ✕
              </button>
            </div>
            <div style={{ padding: 22 }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Related Project</label>
                <select className={styles.formInput}>
                  <option>Client Portal v2</option>
                  <option>Lead Pipeline</option>
                  <option>Automation Suite</option>
                </select>
              </div>
              <div className={styles.formGroup} style={{ marginTop: 14 }}>
                <label className={styles.formLabel}>Description of Change</label>
                <textarea className={styles.formTextarea} placeholder="Describe what you'd like to change and why..." />
              </div>
              <div className={styles.formGroup} style={{ marginTop: 14 }}>
                <label className={styles.formLabel}>Estimated Impact</label>
                <input className={styles.formInput} placeholder="e.g. +2 weeks, +R 15,000, or minimal" />
              </div>
            </div>
            <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={() => setScopeModal(false)}>
                Cancel
              </button>
              <button
                className={cx(styles.button, styles.buttonAccent)}
                type="button"
                onClick={() => {
                  setScopeModal(false);
                  showToast("Scope request submitted", "Team will respond within 2 business days");
                }}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Confetti burst ──────────────────────────────────────── */}
      {confetti.length > 0 ? (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 300, overflow: "hidden" }}>
          {confetti.map((dot) => (
            <div
              key={dot.id}
              style={{
                position: "absolute",
                width: dot.size,
                height: dot.size,
                borderRadius: dot.size * 0.35,
                left: dot.left,
                top: dot.top,
                background: dot.bg,
                animationDelay: dot.delay,
                animation: "cfall 1.8s cubic-bezier(.23,1,.32,1) forwards"
              }}
            />
          ))}
        </div>
      ) : null}

      {/* ── Toast ───────────────────────────────────────────────── */}
      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            background: "var(--surface)",
            border: "1px solid var(--accent)",
            padding: "14px 20px",
            zIndex: 400,
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderRadius: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,.5)"
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              background: "var(--accent)",
              color: "var(--on-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: ".7rem",
              fontWeight: 700,
              flexShrink: 0,
              borderRadius: "50%"
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontSize: ".76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: ".6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
