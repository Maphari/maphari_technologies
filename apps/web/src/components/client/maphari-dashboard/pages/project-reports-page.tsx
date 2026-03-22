// ════════════════════════════════════════════════════════════════════════════
// project-reports-page.tsx — Client Portal: Project Reports
// Data      : GET  /projects/:id/deliverables  → Value Realized tab
//             GET  /projects/:id/sprints        → sprint tabs
//             GET  /projects/:id/sprints/:sid/tasks → per-sprint detail (lazy)
// ════════════════════════════════════════════════════════════════════════════
"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalDeliverablesWithRefresh,
  loadPortalSprintsWithRefresh,
  loadPortalSprintTasksWithRefresh,
  type PortalDeliverable,
  type PortalSprint,
  type PortalSprintTask,
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────

type ReportTab = string; // sprint name or "Value Realized"

type ReportData = {
  completed: string[];
  inProgress: string[];
  blockers: string[];
  highlight: string;
  sprintPts: { done: number; total: number };
  progressPercent: number;
};

type ValueRow = {
  id: string;
  milestone: string;
  type: string;
  status: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const BENCHMARK_ROI = 2.1;
const PROJECTED_ROI = 2.3;

// ── Helpers ───────────────────────────────────────────────────────────────────

function deliverableStatusLabel(apiStatus: string): string {
  if (apiStatus === "APPROVED")                                   return "Completed";
  if (apiStatus === "IN_PROGRESS" || apiStatus === "SUBMITTED")  return "In Progress";
  return "Upcoming";
}

function sprintToReport(sprint: PortalSprint, tasks: PortalSprintTask[]): ReportData {
  const completed  = tasks.filter(t => t.status === "COMPLETED" || t.status === "DONE").map(t => t.name);
  const inProgress = tasks.filter(t => t.status === "IN_PROGRESS" && !t.blockedAt).map(t => t.name);
  const blockers   = tasks.filter(t => t.blockedAt != null).map(t => t.name);

  const highlight =
    sprint.status === "COMPLETED"
      ? `Sprint completed — ${sprint.completedTasks} of ${sprint.totalTasks} tasks done.`
      : `Sprint in progress — ${sprint.progressPercent}% complete with ${sprint.overdueTasks} overdue task${sprint.overdueTasks !== 1 ? "s" : ""}.`;

  return {
    completed,
    inProgress,
    blockers,
    highlight,
    sprintPts:       { done: sprint.completedTasks, total: Math.max(sprint.totalTasks, 1) },
    progressPercent: sprint.progressPercent,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectReportsPage() {
  const { session, projectId } = useProjectLayer();

  const [deliverables,  setDeliverables]  = useState<PortalDeliverable[]>([]);
  const [sprints,       setSprints]       = useState<PortalSprint[]>([]);
  const [sprintTasks,   setSprintTasks]   = useState<Record<string, PortalSprintTask[]>>({});
  const [activeTab,     setActiveTab]     = useState<ReportTab>("Value Realized");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [loadingTasks,  setLoadingTasks]  = useState(false);

  // Track which sprint IDs we've already started loading (avoids duplicate fetches)
  const loadingSprintIds = useRef(new Set<string>());

  // ── Load deliverables + sprints on mount ────────────────────────────────────
  useEffect(() => {
    if (!session || !projectId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    Promise.all([
      loadPortalDeliverablesWithRefresh(session, projectId),
      loadPortalSprintsWithRefresh(session, projectId),
    ]).then(([delivRes, sprintRes]) => {
      if (delivRes.nextSession)  saveSession(delivRes.nextSession);
      if (sprintRes.nextSession) saveSession(sprintRes.nextSession);
      setDeliverables(delivRes.data  ?? []);
      setSprints(sprintRes.data      ?? []);
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load");
    }).finally(() => setLoading(false));
  }, [session, projectId]);

  // ── Lazy-load tasks when a sprint tab is selected ───────────────────────────
  const isValueTab = activeTab === "Value Realized";

  useEffect(() => {
    if (!session || !projectId || isValueTab) return;
    const sprint = sprints.find(s => s.name === activeTab);
    if (!sprint) return;

    // Skip if already loaded or currently loading
    if (sprint.id in sprintTasks || loadingSprintIds.current.has(sprint.id)) return;

    loadingSprintIds.current.add(sprint.id);
    setLoadingTasks(true);

    loadPortalSprintTasksWithRefresh(session, projectId, sprint.id).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      setSprintTasks(prev => ({ ...prev, [sprint.id]: r.data ?? [] }));
      loadingSprintIds.current.delete(sprint.id);
      setLoadingTasks(false);
    }).catch(() => {
      loadingSprintIds.current.delete(sprint.id);
      setLoadingTasks(false);
    });
  }, [session, projectId, activeTab, sprints, isValueTab, sprintTasks]);

  // ── Derived data ────────────────────────────────────────────────────────────

  const valueTable = useMemo<ValueRow[]>(
    () => deliverables.map(d => ({
      id:        d.id,
      milestone: d.name,
      type:      "Deliverable",
      status:    deliverableStatusLabel(d.status),
    })),
    [deliverables]
  );

  const completedCount  = valueTable.filter(r => r.status === "Completed").length;
  const inProgressCount = valueTable.filter(r => r.status === "In Progress").length;

  const currentSprint = isValueTab ? null : sprints.find(s => s.name === activeTab) ?? null;
  const currentTasks  = currentSprint ? sprintTasks[currentSprint.id] : undefined;
  // undefined = not yet loaded, [] = loaded and empty, [...] = has tasks
  const report: ReportData | null = (currentSprint && currentTasks !== undefined)
    ? sprintToReport(currentSprint, currentTasks)
    : null;

  const isSprintLoading = !isValueTab && (loadingTasks || (currentSprint !== null && currentTasks === undefined));

  // ── Render ──────────────────────────────────────────────────────────────────

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
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Reporting · Weekly</div>
          <h1 className={cx("pageTitle")}>Project Reports</h1>
          <p className={cx("pageSub")}>Weekly progress reports from your project team — what was done, what&apos;s next, and any blockers.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => window.print()}>Download PDF</button>
        </div>
      </div>

      {/* Tab bar — "Value Realized" first, then one tab per sprint */}
      <div className={cx("pillTabs", "mb16")}>
        {(["Value Realized", ...sprints.map(s => s.name)] as ReportTab[]).map((p) => (
          <button
            key={p}
            type="button"
            className={cx("pillTab", activeTab === p && "pillTabActive")}
            onClick={() => setActiveTab(p)}
          >
            {p === "Value Realized" ? "✦ Value Realized" : p}
          </button>
        ))}
      </div>

      {/* ── Value Realized tab ─────────────────────────────────────────────── */}
      {isValueTab ? (
        valueTable.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg></div>
            <div className={cx("emptyStateTitle")}>Value report not yet available</div>
            <div className={cx("emptyStateSub")}>
              ROI and milestone value data will appear here once your project has active milestones and deliverables.
            </div>
          </div>
        ) : (
          <>
            {/* Summary hero */}
            <div className={cx("card", "borderLeftAccent", "mb20", "p24x28")}>
              <div className={cx("prHeroRow")}>
                <div>
                  <div className={cx("text11", "colorMuted", "mb4")}>Deliverables Completed</div>
                  <div className={cx("prHeroCount")}>
                    {completedCount}<span className={cx("prHeroTotal")}>/{valueTable.length}</span>
                  </div>
                  <div className={cx("text12", "mt8")}>
                    {inProgressCount} deliverable{inProgressCount !== 1 ? "s" : ""} currently in progress
                  </div>
                  <div className={cx("text10", "colorMuted", "mt4")}>Monetary ROI available once billing milestones are finalised</div>
                </div>
                <div className={cx("prHeroProgress")}>
                  <div className={cx("flexBetween", "mb6")}>
                    <span className={cx("text11", "colorMuted")}>Completion progress</span>
                    <span className={cx("text11", "fw700", "colorAccent")}>
                      {valueTable.length > 0 ? Math.round((completedCount / valueTable.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className={cx("progressTrackB1")}>
                    <div className={cx("prProgressFill")} style={{ '--pct': `${valueTable.length > 0 ? Math.round((completedCount / valueTable.length) * 100) : 0}%` } as React.CSSProperties} />
                    <div className={cx("prBenchmarkLine")} style={{ '--left': `${(BENCHMARK_ROI / PROJECTED_ROI) * 100}%` } as React.CSSProperties} />
                  </div>
                  <div className={cx("flexBetween", "mt6")}>
                    <span className={cx("text10", "colorMuted")}>{completedCount} done</span>
                    <span className={cx("text10", "colorAmber")}>{BENCHMARK_ROI}× benchmark ROI</span>
                    <span className={cx("text10", "colorMuted")}>{PROJECTED_ROI}× projected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deliverable breakdown table */}
            <div className={cx("card", "mb16")}>
              <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Milestone &amp; Deliverable Breakdown</span></div>
              <div className={cx("listGroup")}>
                <div className={cx("listRow", "pt4", "pb4")}>
                  <div className={cx("prTableHead")}>
                    <span className={cx("text10", "colorMuted", "fw700")}>DELIVERABLE</span>
                    <span className={cx("text10", "colorMuted", "fw700")}>TYPE</span>
                    <span className={cx("text10", "colorMuted", "fw700")}>STATUS</span>
                  </div>
                </div>
                {valueTable.map((row) => (
                  <div key={row.id} className={cx("listRow")}>
                    <div className={cx("tableRowGrid3col")}>
                      <span className={cx("fw600", "text12")}>{row.milestone}</span>
                      <span className={cx("text11", "colorMuted")}>{row.type}</span>
                      <span className={cx(
                        "badge",
                        row.status === "Completed" ? "badgeGreen" :
                        row.status === "In Progress" ? "badgeAmber" :
                        "badgeMuted"
                      )}>
                        {row.status}
                      </span>
                    </div>
                  </div>
                ))}
                <div className={cx("listRow", "dynBgColor", "rounded6")} style={{ "--bg-color": "var(--s2)" } as React.CSSProperties}>
                  <div className={cx("tableRowGrid3col")}>
                    <span className={cx("fw700", "text12")}>
                      Total: {valueTable.length} deliverable{valueTable.length !== 1 ? "s" : ""}
                    </span>
                    <span />
                    <span className={cx("text11", "colorMuted")}>{completedCount} completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benchmark card */}
            <div className={cx("card", "borderLeftAmber")}>
              <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Industry Benchmark</span></div>
              <div className={cx("cardBodyPad")}>
                <p className={cx("text12", "mb12")}>
                  Maphari clients average <span className={cx("fw700")}>{BENCHMARK_ROI}×</span> ROI. Your detailed monetary value report
                  will be available once project billing milestones are finalised. Projected ROI:{" "}
                  <span className={cx("fw700", "colorAmber")}>{PROJECTED_ROI}×</span> by project end.
                </p>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => window.print()}>
                  Download Deliverables Report →
                </button>
              </div>
            </div>
          </>
        )

      /* ── Sprint report tabs ──────────────────────────────────────────────── */
      ) : isSprintLoading ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="loader" sz={20} c="var(--muted2)" /></div>
          <div className={cx("emptyStateSub")}>Loading sprint data…</div>
        </div>

      ) : report ? (
        <>
          <div className={cx("card", "borderLeftAccent", "mb16")}>
            <div className={cx("cardBodyPad")}>
              <div className={cx("fw700", "text12", "mb4")}>Sprint Summary</div>
              <div className={cx("text12")}>{report.highlight}</div>
            </div>
          </div>

          <div className={cx("topCardsStack", "mb20")}>
            {[
              { label: "Tasks Done",        value: `${report.sprintPts.done}/${report.sprintPts.total}`, color: "statCardAccent" },
              { label: "Completion Rate",   value: `${Math.round((report.sprintPts.done / report.sprintPts.total) * 100)}%`, color: "statCardGreen" },
              { label: "Progress",          value: `${report.progressPercent}%`,  color: "statCardAmber" },
              { label: "Blockers",          value: `${report.blockers.length}`,   color: "statCardRed" },
            ].map((s) => (
              <div key={s.label} className={cx("statCard", s.color)}>
                <div className={cx("statLabel")}>{s.label}</div>
                <div className={cx("statValue")}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className={cx("grid2")}>
            <div className={cx("card")}>
              <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Completed</span></div>
              <div className={cx("cardBodyPad")}>
                {report.completed.length === 0 ? (
                  <span className={cx("text12", "colorMuted")}>No completed tasks yet.</span>
                ) : report.completed.map((item, i) => (
                  <div key={i} className={cx("flexRow", "gap8", "mb6")}>
                    <span className={cx("colorAccent")}>✓</span>
                    <span className={cx("text12")}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={cx("card")}>
              <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>In Progress</span></div>
              <div className={cx("cardBodyPad")}>
                {report.inProgress.length === 0 ? (
                  <span className={cx("text12", "colorMuted")}>No tasks currently in progress.</span>
                ) : report.inProgress.map((item, i) => (
                  <div key={i} className={cx("flexRow", "gap8", "mb6")}>
                    <span className={cx("colorAmber")}>◉</span>
                    <span className={cx("text12")}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {report.blockers.length > 0 && (
            <div className={cx("card", "borderLeftRed", "mt16")}>
              <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Blockers</span></div>
              <div className={cx("cardBodyPad")}>
                {report.blockers.map((b, i) => (
                  <div key={i} className={cx("flexRow", "gap8")}>
                    <span className={cx("colorRed")}>!</span>
                    <span className={cx("text12")}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>

      ) : (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="file" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No sprint data yet</div>
          <div className={cx("emptyStateSub")}>Task-level data for this sprint will appear here once the team starts logging progress.</div>
        </div>
      )}
    </div>
  );
}
