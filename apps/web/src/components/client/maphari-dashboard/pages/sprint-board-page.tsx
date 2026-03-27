"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { loadPortalSprintsWithRefresh, loadPortalSprintTasksWithRefresh, loadPortalDeliverablesWithRefresh, type PortalSprint, type PortalSprintTask, type PortalDeliverable } from "../../../../lib/api/portal/project-layer";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ──────────────────────────────────────────────────────────────────────

type SPriority   = "P1" | "P2" | "P3";
type STaskStatus = "todo" | "inprogress" | "review" | "done";
type ViewMode    = "summary" | "board" | "velocity";

type STask = {
  id: string;
  title: string;
  priority: SPriority;
  initials: string;
  assigneeName: string | null;
  pts: number;
  status: STaskStatus;
  blocked: boolean;
  dueLabel: string;
};

const PRIORITY_COLOR: Record<SPriority, string> = {
  P1: "var(--red)",
  P2: "var(--amber)",
  P3: "var(--muted2)",
};


// ── API mapping ────────────────────────────────────────────────────────────────

function taskApiStatusToUi(status: string): STaskStatus {
  switch (status) {
    case "DONE":        return "done";
    case "IN_PROGRESS": return "inprogress";
    case "IN_REVIEW":   return "review";
    default:            return "todo";
  }
}
function taskApiPriorityToUi(priority: string): SPriority {
  if (priority === "HIGH")   return "P1";
  if (priority === "MEDIUM") return "P2";
  return "P3";
}

function formatShortDate(value: string | null): string {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function mapApiTask(t: PortalSprintTask): STask {
  const initials = (t.assigneeName ?? "—")
    .split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "—";
  return {
    id: t.id,
    title: t.name,
    priority: taskApiPriorityToUi(t.priority),
    initials,
    assigneeName: t.assigneeName,
    pts: t.storyPoints ?? 1,
    status: taskApiStatusToUi(t.status),
    blocked: t.blockedAt !== null,
    dueLabel: formatShortDate(t.dueAt),
  };
}





type ColDef = { id: STaskStatus; title: string; barColor: string; badge: string };
const COLUMNS: ColDef[] = [
  { id: "todo",       title: "To Do",       barColor: "var(--b2)",    badge: "badgeMuted"  },
  { id: "inprogress", title: "In Progress", barColor: "var(--amber)", badge: "badgeAmber"  },
  { id: "review",     title: "In Review",   barColor: "var(--cyan)",  badge: "badgeCyan"   },
  { id: "done",       title: "Done",        barColor: "var(--lime)",  badge: "badgeAccent" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────


function velocityColor(delivered: number, planned: number): string {
  const ratio = delivered / planned;
  if (ratio >= 1)   return "var(--lime)";
  if (ratio >= 0.8) return "var(--amber)";
  return "var(--red)";
}

// ── Task Card ──────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: STask }) {
  const pColor = PRIORITY_COLOR[task.priority];
  return (
    <div className={cx("taskCardWrap", "dynBorderLeft3")} style={{ "--color": pColor } as React.CSSProperties}>
      <div className={cx("py10_px", "px12_px")}>
        {/* Priority + blocked */}
        <div className={cx("flexRow", "flexCenter", "gap5", "mb7")}>
          <span className={cx("badge", "badgeMuted", "fs06")}>Task</span>
          {task.blocked && (
            <span className={cx("badge", "badgeRed", "fs06")}>Blocked</span>
          )}
          <span className={cx("fontMono", "text10", "dynColor", "mlAuto")} style={{ "--color": pColor } as React.CSSProperties}>{task.priority}</span>
        </div>

        {/* Title */}
        <div className={cx("fw600", "text12", "lineH14", "mb8", "dynColor")} style={{ "--color": task.blocked ? "var(--muted2)" : "inherit" } as React.CSSProperties}>
          {task.title}
        </div>

        {/* Footer */}
        <div className={cx("flexBetween")}>
          <div className={cx("flexRow", "gap6")}>
            <Av initials={task.initials} size={22} />
            <span className={cx("text10", "colorMuted2")}>{task.assigneeName ?? task.initials}</span>
          </div>
          <div className={cx("flexRow", "gap5")}>
            <span className={cx("tagPillSm", "fontMono", "text10", "colorMuted2")}>{task.dueLabel}</span>
            <span className={cx("tagPillS3", "fontMono", "fw700", "text10", "colorMuted2")}>{task.pts}pt</span>
          </div>
        </div>
      </div>
    </div>);
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SprintBoardPage() {
  // ── Project layer: real API data ──────────────────────────────────────────
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();
  const [activeSprint,    setActiveSprint]    = useState<PortalSprint | null>(null);
  const [TASKS,           setTasks]           = useState<STask[]>([]);
  const [apiAllSprints,   setApiAllSprints]   = useState<PortalSprint[]>([]);
  const [apiDeliverables, setApiDeliverables] = useState<PortalDeliverable[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const loadSprintBoard = useCallback(async (mode: "initial" | "refresh" = "initial"): Promise<boolean> => {
    if (!session || !projectId) {
      setLoading(false);
      setRefreshing(false);
      setError(null);
      setActiveSprint(null);
      setTasks([]);
      setApiAllSprints([]);
      setApiDeliverables([]);
      return false;
    }

    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setError(null);
    try {
      const [sprintResult, delResult] = await Promise.all([
        loadPortalSprintsWithRefresh(session, projectId),
        loadPortalDeliverablesWithRefresh(session, projectId),
      ]);
      if (sprintResult.nextSession) saveSession(sprintResult.nextSession);
      if (delResult.nextSession) saveSession(delResult.nextSession);
      if (sprintResult.error) {
        setError(sprintResult.error.message ?? "Failed to load sprint board.");
        setActiveSprint(null);
        setTasks([]);
        setApiAllSprints([]);
        setApiDeliverables([]);
        return false;
      }
      const sprints = sprintResult.data ?? [];
      setApiAllSprints(sprints);
      const active = sprints.find((s) => s.status === "ACTIVE") ?? sprints[0] ?? null;
      setActiveSprint(active);
      if (delResult.data) setApiDeliverables(delResult.data);
      if (!active) {
        setTasks([]);
        return true;
      }

      const taskResult = await loadPortalSprintTasksWithRefresh(session, projectId, active.id);
      if (taskResult.nextSession) saveSession(taskResult.nextSession);
      if (taskResult.error) {
        setError(taskResult.error.message ?? "Unable to load sprint tasks.");
        setTasks([]);
        return false;
      }
      if (taskResult.data && taskResult.data.length > 0) {
        setTasks(taskResult.data.map(mapApiTask));
      } else {
        setTasks([]);
      }
      return true;
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "Failed to load sprint";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, session]);

  useEffect(() => {
    void loadSprintBoard("initial");
  }, [loadSprintBoard]);

  const SPRINT = activeSprint
    ? {
        name:          activeSprint.name,
        dates:         [activeSprint.startAt, activeSprint.endAt].filter(Boolean).map((d) => new Date(d!).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })).join(" – ") || "—",
        goal:          activeSprint.ownerName ? "Sprint owner: " + activeSprint.ownerName : "Live sprint progress for this project.",
        daysTotal:     activeSprint.startAt && activeSprint.endAt ? Math.max(1, Math.ceil((new Date(activeSprint.endAt).getTime() - new Date(activeSprint.startAt).getTime()) / 86400000)) : 14,
        daysRemaining: activeSprint.endAt ? Math.max(0, Math.ceil((new Date(activeSprint.endAt).getTime() - Date.now()) / 86400000)) : 0,
        status:        activeSprint.status,
      }
    : { name: "—", dates: "—", goal: "No sprint is currently attached to this project.", daysTotal: 14, daysRemaining: 0, status: "INACTIVE" };

  // ── UI state ──────────────────────────────────────────────────────────────
  const [view,        setView]        = useState<ViewMode>("summary");

  // Derived from tasks
  const todoTasks       = TASKS.filter(t => t.status === "todo");
  const inProgressTasks = TASKS.filter(t => t.status === "inprogress");
  const reviewTasks     = TASKS.filter(t => t.status === "review");
  const doneTasks       = TASKS.filter(t => t.status === "done");

  const totalPts       = TASKS.reduce((a, t) => a + t.pts, 0);
  const completedPts   = doneTasks.reduce((a, t) => a + t.pts, 0);
  const blockedCount   = TASKS.filter(t => t.blocked).length;
  const pctComplete    = totalPts > 0 ? Math.round((completedPts / totalPts) * 100) : (activeSprint?.progressPercent ?? 0);
  const sprintProgress = Math.round(((SPRINT.daysTotal - SPRINT.daysRemaining) / SPRINT.daysTotal) * 100);

  // ── Computed from API data ───────────────────────────────────────────────
  const displaySprints = apiAllSprints.map((s, i) => ({
    sprint:    `S${i + 1}`,
    planned:   s.totalTasks,
    delivered: s.completedTasks,
  }));
  const maxVelocity = displaySprints.length > 0
    ? Math.max(...displaySprints.flatMap(s => [s.planned, s.delivered]), 1)
    : 1;
  const avgVelocity = displaySprints.length > 0
    ? Math.round(displaySprints.reduce((a, s) => a + s.delivered, 0) / displaySprints.length)
    : 0;

  const uniqueAssignees = useMemo(() => {
    return [...new Set(TASKS.map((task) => task.assigneeName).filter((name): name is string => Boolean(name)))];
  }, [TASKS]);

  const DELIVERABLE_STATUS_MAP: Record<string, { status: string; pct: number; color: string; badge: string }> = {
    DONE:        { status: "Done",        pct: 100, color: "var(--lime)",   badge: "badgeAccent" },
    IN_REVIEW:   { status: "In Review",   pct: 90,  color: "var(--amber)",  badge: "badgeAmber"  },
    IN_PROGRESS: { status: "In Progress", pct: 65,  color: "var(--cyan)",   badge: "badgeCyan"   },
    TODO:        { status: "Planned",     pct: 10,  color: "var(--purple)", badge: "badgePurple" },
  };
  const displayDeliverables = apiDeliverables.map((d) => {
    const m = DELIVERABLE_STATUS_MAP[d.status] ?? { status: d.status, pct: 0, color: "var(--muted2)", badge: "badgeMuted" };
    return { id: d.id.slice(-6).toUpperCase(), title: d.name, ...m };
  });

  const tasksByCol: Record<STaskStatus, STask[]> = {
    todo:       todoTasks,
    inprogress: inProgressTasks,
    review:     reviewTasks,
    done:       doneTasks,
  };

  type StatusRow = [string, number, number, string]; // [label, count, pts, color]
  const statusBreakdown: StatusRow[] = [
    ["To Do",       todoTasks.length,       todoTasks.reduce((a, t)       => a + t.pts, 0), "var(--muted2)" ],
    ["In Progress", inProgressTasks.length, inProgressTasks.reduce((a, t) => a + t.pts, 0), "var(--amber)"  ],
    ["In Review",   reviewTasks.length,     reviewTasks.reduce((a, t)     => a + t.pts, 0), "var(--cyan)"   ],
    ["Done",        doneTasks.length,       doneTasks.reduce((a, t)       => a + t.pts, 0), "var(--lime)"   ],
  ];

  const totalTasks   = TASKS.length;
  const healthStatus = totalTasks === 0 ? "—" : pctComplete >= 70 ? "On Track" : pctComplete >= 40 ? "At Risk" : "Behind";
  const healthBadge  = totalTasks === 0 ? "badgeMuted" : pctComplete >= 70 ? "badgeAccent" : pctComplete >= 40 ? "badgeAmber" : "badgeRed";
  const velocityTrend = displaySprints.length >= 2
    ? displaySprints[displaySprints.length - 1].delivered >= displaySprints[displaySprints.length - 2].delivered
      ? `↑ Improving (${displaySprints[displaySprints.length - 2].sprint} → ${displaySprints[displaySprints.length - 1].sprint})`
      : `↓ Declining (${displaySprints[displaySprints.length - 2].sprint} → ${displaySprints[displaySprints.length - 1].sprint})`
    : "—";

  async function handleRefresh(): Promise<void> {
    const ok = await loadSprintBoard("refresh");
    if (ok) {
      notify("success", "Sprint board refreshed", "Latest sprint, task, and deliverable data has been loaded.");
    } else if (error) {
      notify("error", "Refresh failed", error);
    }
  }

  function handleExport(): void {
    if (!activeSprint) {
      notify("info", "Nothing to export", "There is no active sprint on this project yet.");
      return;
    }

    const rows = [
      ["Sprint", activeSprint.name],
      ["Sprint Status", activeSprint.status],
      ["Sprint Progress", String(activeSprint.progressPercent) + "%"],
      [""],
      ["Task", "Status", "Priority", "Story Points", "Assignee", "Due Date", "Blocked"],
      ...TASKS.map((task) => [
        task.title,
        task.status,
        task.priority,
        String(task.pts),
        task.assigneeName ?? "—",
        task.dueLabel,
        task.blocked ? "Yes" : "No",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, "\"\"")}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sprint-board.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("success", "Downloading", "Sprint board CSV is downloading.");
  }

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnGhost", "mt12")} onClick={() => void loadSprintBoard("refresh")}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Sprint</div>
          <h1 className={cx("pageTitle")}>Sprint Board</h1>
          <p className={cx("pageSub")}>Live sprint status, task board, delivery pace, and velocity history.</p>
        </div>
        <div className={cx("pageActions", "flexRow", "flexAlignStart", "gap8")}>
          <div className={cx("flexRow", "flexCenter", "gap8", "noShrink")}>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void handleRefresh()}>
              <Ic n="refresh" sz={13} /> {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={handleExport}>
              <Ic n="download" sz={13} /> Export CSV
            </button>
          </div>
          <div className={cx("flexRow", "noShrink")}>
            <div className={cx("pillTabs", "mb0")}>
              {(["summary", "board", "velocity"] as ViewMode[]).map(v => (
                <button key={v} type="button" className={cx("pillTab", view === v ? "pillTabActive" : "")} onClick={() => setView(v)}>
                  <span className={cx("flexRow", "gap5")}>
                    <Ic n={v === "summary" ? "layers" : v === "board" ? "grid" : "activity"} sz={11} />
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sprint banner ─────────────────────────────────────────────────────── */}
      <div className={cx("sprintBanner")}>
        <div className={cx("flexBetween", "flexAlignStart", "gap12", "mb10")}>
          <div>
            <div className={cx("flexRow", "flexCenter", "gap8", "mb4")}>
              <span className={cx("fw700", "text13")}>{SPRINT.name}</span>
              <span className={cx("fontMono", "text10", "colorMuted2")}>{SPRINT.dates}</span>
              <span className={cx("badge", SPRINT.status === "ACTIVE" ? "badgeAccent" : "badgeMuted", "flexRow", "flexCenter", "gap3")}>
                <Ic n="activity" sz={8} c="currentColor" /> {SPRINT.status === "ACTIVE" ? "Active" : SPRINT.status}
              </span>
            </div>
            <div className={cx("text11", "colorMuted", "lineH15")}>{SPRINT.goal}</div>
          </div>
          <div className={cx("textRight", "noShrink")}>
            <div className={cx("fontMono", "fw700", "text16", "colorAccent")}>{pctComplete}%</div>
            <div className={cx("fontMono", "text10", "colorMuted2")}>{completedPts}/{totalPts} pts</div>
          </div>
        </div>
        {/* Progress bar with sprint timeline marker */}
        <div className={cx("progressTrackBase", "mb8")}>
          <div style={{ '--pct': `${pctComplete}%` } as React.CSSProperties} />
          <div
            className={cx("sprintProgressDot")} style={{ "--left": `${sprintProgress}%` } as React.CSSProperties}
            title={`Sprint ${sprintProgress}% elapsed`}
          />
        </div>
        <div className={cx("flexRow", "gap16", "flexWrap", "flexCenter")}>
          <span className={cx("fontMono", "text10", "colorMuted2")}><span className={cx("colorAccent")}>●</span> {completedPts}pt done</span>
          <span className={cx("fontMono", "text10", "colorMuted2")}><span className={cx("colorAmber")}>●</span> {inProgressTasks.reduce((a, t) => a + t.pts, 0) + reviewTasks.reduce((a, t) => a + t.pts, 0)}pt active</span>
          <span className={cx("fontMono", "text10", "colorMuted2")}><span className={cx("colorMuted2")}>●</span> {todoTasks.reduce((a, t) => a + t.pts, 0)}pt to do</span>
          <span className={cx("fontMono", "text10", "colorMuted2", "mlAuto")}>
            {SPRINT.daysRemaining} days left · <span className={cx("colorAmber")}>timeline {sprintProgress}% elapsed</span>
          </span>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Tasks",  value: TASKS.length,           color: "statCard",      icon: "list",     ic: "var(--muted2)" },
          { label: "In Progress",  value: inProgressTasks.length, color: "statCardAmber", icon: "activity", ic: "var(--amber)"  },
          { label: "Completed",    value: doneTasks.length,        color: "statCardGreen", icon: "check",    ic: "var(--lime)"   },
          { label: "Blocked",      value: blockedCount,            color: "statCardRed",   icon: "alert",    ic: "var(--red)"    },
        ].map(s => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("flexBetween", "mb8")}>
              <div className={cx("statLabel")}>{s.label}</div>
              <Ic n={s.icon} sz={14} c={s.ic} />
            </div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ════════════════════ SUMMARY VIEW ════════════════════ */}
      {view === "summary" && (
        <>
          {/* Overview grid2 */}
          <div className={cx("grid2", "mb16")}>

            {/* Task Distribution */}
            <div className={cx("card", "p16x20")}>
              <div className={cx("cardHd", "mb14")}>
                <span className={cx("cardHdTitle")}>Task Distribution</span>
                <span className={cx("fontMono", "text10", "colorMuted2")}>{TASKS.length} tasks · {totalPts}pts</span>
              </div>
              <div className={cx("flexCol", "gap10", "mb14")}>
                {statusBreakdown.map(([label, count, pts, color]) => {
                  const pct = TASKS.length > 0 ? Math.round((count / TASKS.length) * 100) : 0;
                  return (
                    <div key={label} className={cx("flexRow", "gap10")}>
                      <div className={cx("wh10", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": color } as React.CSSProperties} />
                      <span className={cx("text11", "w88")}>{label}</span>
                      <div className={cx("progressTrack", "flex1")}>
                        <div className={cx("pctFillR99", "dynBgColor")} style={{ '--pct': pct, "--bg-color": color } as React.CSSProperties} />
                      </div>
                      <span className={cx("fontMono", "text10", "colorMuted2", "w58", "textRight", "noShrink")}>
                        {count} <span className={cx("fs058")}>({pts}pt)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Composition bar */}
              <div className={cx("progressTrackFlex")}>
                {statusBreakdown.filter(([, count]) => count > 0).map(([label, count,, color]) => (
                  <div key={label} className={cx("dynFlex", "dynBgColor")} style={{ "--flex": count, "--bg-color": color } as React.CSSProperties} />
                ))}
              </div>
            </div>

            {/* Sprint Health */}
            <div className={cx("card", "p16x20")}>
              <div className={cx("cardHd", "mb14")}>
                <span className={cx("cardHdTitle")}>Sprint Health</span>
                <span className={cx("badge", healthBadge)}>{healthStatus}</span>
              </div>
              <div className={cx("flexCol", "gap0")}>
                  {[
                    { label: "Points completed", value: `${completedPts} / ${totalPts} pts`, color: "var(--lime)"   },
                    { label: "Days remaining",    value: `${SPRINT.daysRemaining} of ${SPRINT.daysTotal}`, color: "var(--cyan)" },
                    { label: "Blocked tasks",     value: `${blockedCount} task${blockedCount !== 1 ? "s" : ""}`, color: blockedCount > 0 ? "var(--red)" : "var(--lime)" },
                  { label: "Assigned team",      value: uniqueAssignees.length > 0 ? `${uniqueAssignees.length} member${uniqueAssignees.length === 1 ? "" : "s"}` : "Unassigned",  color: uniqueAssignees.length > 0 ? "var(--muted2)" : "var(--amber)" },
                  { label: "Completion rate",   value: `${pctComplete}%`,                  color: pctComplete >= 70 ? "var(--lime)" : "var(--amber)" },
                  { label: "Velocity trend",    value: velocityTrend,                       color: velocityTrend.startsWith("↑") ? "var(--lime)" : velocityTrend === "—" ? "var(--muted2)" : "var(--red)" },
                ].map(m => (
                  <div key={m.label} className={cx("flexBetween", "py7_0", "borderB")}>
                    <span className={cx("text11", "colorMuted")}>{m.label}</span>
                    <span className={cx("fontMono", "fw700", "text11", "dynColor")} style={{ "--color": m.color } as React.CSSProperties}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sprint Deliverables */}
          <div className={cx("card", "overflowHidden", "mb16")}>
            <div className={cx("cardHd", "borderB")}>
              <span className={cx("cardHdTitle")}>Project Deliverables In Flight</span>
              <span className={cx("fontMono", "text10", "colorMuted2")}>
                {displayDeliverables.filter(d => d.pct === 100).length} of {displayDeliverables.length} complete
              </span>
            </div>
            {displayDeliverables.length === 0 && (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="package" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No deliverables yet</div>
                <div className={cx("emptyStateSub")}>Deliverables will appear here once the team starts publishing delivery items on this project.</div>
              </div>
            )}
            {displayDeliverables.map((d, idx) => (
              <div
                key={d.id}
                className={cx("sprintDelivRow", idx < displayDeliverables.length - 1 && "borderB")}
              >
                <span className={cx("badge", "badgeMuted", "justifyCenter", "textCenter")}>{d.id}</span>
                <div className={cx("minW0")}>
                  <div className={cx("fw600", "text12", "truncate", "mb5")}>{d.title}</div>
                  <div className={cx("progressTrack")}>
                    <div className={cx("pctFillR99", "dynBgColor")} style={{ '--pct': d.pct, "--bg-color": d.color } as React.CSSProperties} />
                  </div>
                </div>
                <span className={cx("fontMono", "fw700", "text11", "dynColor", "textRight")} style={{ "--color": d.color } as React.CSSProperties}>{d.pct}%</span>
                <span className={cx("badge", d.badge)}>{d.status}</span>
              </div>
            ))}
          </div>

          {/* Team */}
          <div className={cx("card", "overflowHidden")}>
            <div className={cx("cardHd", "borderB")}>
              <span className={cx("cardHdTitle")}>Team — {SPRINT.name}</span>
            </div>
            <div className={cx("p24x20", "textCenter")}>
              <span className={cx("text11", "colorMuted")}>
                {uniqueAssignees.length > 0
                  ? "Assigned sprint contributors: " + uniqueAssignees.join(", ")
                  : "No task assignees are attached to this sprint yet. Your project manager can assign owners as work is planned."}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════ BOARD VIEW ════════════════════ */}
      {view === "board" && (
        <div className={cx("grid4Cols", "gap12")}>
          {COLUMNS.map(col => {
            const colTasks = tasksByCol[col.id];
            const colPts   = colTasks.reduce((a, t) => a + t.pts, 0);
            return (
              <div key={col.id}>
                {/* Column header */}
                <div className={cx("kanbanColHd", "dynBorderLeft3")} style={{ "--color": col.barColor } as React.CSSProperties}>
                  <span className={cx("fw700", "text12")}>{col.title}</span>
                  <span className={cx("badge", col.badge)}>{colTasks.length}</span>
                  <span className={cx("fontMono", "text10", "colorMuted2", "mlAuto")}>{colPts}pt</span>
                </div>
                {/* Column body */}
                <div className={cx("kanbanColBody")}>
                  {colTasks.map(t => <TaskCard key={t.id} task={t} />)}
                  {colTasks.length === 0 && (
                    <div className={cx("emptyState")}>
                      <div className={cx("emptyStateIcon")}><Ic n="grid" sz={18} c="var(--muted2)" /></div>
                      <div className={cx("emptyStateTitle")}>No tasks</div>
                      <div className={cx("emptyStateSub")}>Tasks will appear here once added to this column.</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════ VELOCITY VIEW ════════════════════ */}
      {view === "velocity" && (
        <>
          {/* Task completion breakdown */}
          <div className={cx("card", "mb16", "p16x20")}>
            <div className={cx("cardHd", "mb14")}>
              <span className={cx("cardHdTitle")}>Task Completion by Status</span>
              <span className={cx("fontMono", "text10", "colorMuted2")}>{TASKS.length} tasks total</span>
            </div>
            {TASKS.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="activity" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No tasks in sprint</div>
                <div className={cx("emptyStateSub")}>Task activity will appear here once the sprint is underway.</div>
              </div>
            ) : (
              <div className={cx("flexCol", "gap10")}>
                {statusBreakdown.map(([label, count, pts, color]) => (
                  <div key={label} className={cx("flexRow", "flexCenter", "gap12")}>
                    <div className={cx("text11", "colorMuted")} style={{ minWidth: 80 }}>{label}</div>
                    <div className={cx("flex1", "progressTrack")}>
                      <div className={cx("progressFill")} style={{ '--pct': `${totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0}%`, background: color } as React.CSSProperties} />
                    </div>
                    <div className={cx("fontMono", "text11", "colorMuted2")} style={{ width: 72, minWidth: 72, flexShrink: 0, textAlign: "right" }}>{count} · {pts}pt</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Velocity Chart */}
          <div className={cx("card", "mb16", "p16x20")}>
            <div className={cx("cardHd", "mb20")}>
              <span className={cx("cardHdTitle")}>Sprint Velocity</span>
              <span className={cx("badge", "badgeBlue")}>avg {avgVelocity} pts/sprint</span>
            </div>
            {displaySprints.length === 0 && (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="activity" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No sprint history</div>
                <div className={cx("emptyStateSub")}>Velocity data will appear once sprints are completed.</div>
              </div>
            )}
            <div className={cx("actBarContainer")} style={{ "--chart-h": "120px" } as React.CSSProperties}>
              {displaySprints.map((s, i) => {
                const isLast     = i === displaySprints.length - 1;
                const plannedH   = (s.planned / maxVelocity) * 100;
                const deliveredH = (s.delivered / maxVelocity) * 100;
                const color      = velocityColor(s.delivered, s.planned);
                return (
                  <div key={s.sprint} className={cx("actMonthCol")}>
                    <div className={cx("flexRow", "flexAlignEnd", "gap3", "wFull", "hFull", "justifyCenter")}>
                      <div className={cx("sprintBarPlanned")} style={{ "--pct": `${plannedH}%` } as React.CSSProperties} title={`Planned: ${s.planned}pts`}>
                        <span className={cx("chartLabelTop")}>{s.planned}</span>
                      </div>
                      <div className={cx("sprintBarDelivered", "dynBgColor")} style={{ "--pct": `${deliveredH}%`, "--bg-color": color } as React.CSSProperties} title={`Delivered: ${s.delivered}pts`}>
                        <span className={cx("chartLabelTop", "dynColor")} style={{ "--color": color } as React.CSSProperties}>{s.delivered}</span>
                      </div>
                    </div>
                    <div className={cx("sprintBarLabel", "dynColor")} style={{ "--color": isLast ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>{s.sprint}</div>
                  </div>
                );
              })}
            </div>
            <div className={cx("flexRow", "gap16", "mt16", "flexWrap", "pt12", "borderT")}>
              {[
                { color: "var(--s3)",    border: "var(--b2)", label: "Planned"           },
                { color: "var(--lime)",  border: undefined,   label: "Delivered (≥100%)" },
                { color: "var(--amber)", border: undefined,   label: "Delivered (80–99%)" },
                { color: "var(--red)",   border: undefined,   label: "Delivered (<80%)"  },
              ].map(l => (
                <span key={l.label} className={cx("flexRow", "gap6")}>
                  <div className={cx("dot10sq", "dynBgColor")} style={{ "--bg-color": l.color } as React.CSSProperties} />
                  <span className={cx("text10", "colorMuted")}>{l.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Velocity stats */}
          <div className={cx("grid2")}>
            <div className={cx("card", "p16x20")}>
              <div className={cx("cardHd", "mb12")}>
                <span className={cx("cardHdTitle")}>Velocity Summary</span>
              </div>
              {[
                { label: "Average velocity", value: `${avgVelocity} pts/sprint`, color: "var(--lime)"   },
                { label: "Best sprint",       value: (() => { const best = displaySprints.reduce<typeof displaySprints[0] | null>((b, s) => (!b || s.delivered > b.delivered) ? s : b, null); return best && best.delivered > 0 ? `${best.sprint} — ${best.delivered} pts delivered` : "—"; })(), color: "var(--lime)" },
                { label: "Current sprint",    value: `${completedPts} / ${totalPts} pts (${pctComplete}%)`, color: pctComplete >= 80 ? "var(--lime)" : "var(--amber)" },
                { label: "Trend",             value: velocityTrend, color: velocityTrend.startsWith("↑") ? "var(--lime)" : velocityTrend === "—" ? "var(--muted2)" : "var(--red)" },
              ].map(m => (
                <div key={m.label} className={cx("flexBetween", "py7_0", "borderB")}>
                  <span className={cx("text11", "colorMuted")}>{m.label}</span>
                  <span className={cx("fontMono", "fw700", "text11", "dynColor")} style={{ "--color": m.color } as React.CSSProperties}>{m.value}</span>
                </div>
              ))}
            </div>
            <div className={cx("card", "p16x20")}>
              <div className={cx("cardHd", "mb12")}>
                <span className={cx("cardHdTitle")}>Sprint Tasks</span>
              </div>
              {[
                { label: "Total tasks",    value: String(TASKS.length),        color: "var(--lime)"    },
                { label: "Completed",      value: String(doneTasks.length),    color: "var(--lime)"    },
                { label: "In review",      value: String(reviewTasks.length),  color: "var(--amber)"   },
                { label: "Blocked",        value: String(blockedCount),        color: blockedCount > 0 ? "var(--red)" : "var(--muted2)" },
              ].map(m => (
                <div key={m.label} className={cx("flexBetween", "py7_0", "borderB")}>
                  <span className={cx("text11", "colorMuted")}>{m.label}</span>
                  <span className={cx("fontMono", "fw700", "text12", "dynColor")} style={{ "--color": m.color } as React.CSSProperties}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
