// ════════════════════════════════════════════════════════════════════════════
// project-roadmap-page.tsx — Client Portal: Project Roadmap
// Shows all active/upcoming projects with a slim elapsed-time bar, milestone
// dots on the track, and a milestone row list per project.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { loadProjectRoadmapWithRefresh, type RoadmapProject, type RoadmapMilestone } from "../../../../lib/api/portal/project-layer";
import { saveSession } from "../../../../lib/auth/session";
import { Alert } from "@/components/shared/ui/alert";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toTs(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const ts = new Date(dateStr).getTime();
  return isNaN(ts) ? null : ts;
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

/** Returns left% (0-100) for a milestone on the project track. */
function milestoneLeftPct(mDue: string | null, projStart: string | null, projEnd: string | null): number {
  const mTs  = toTs(mDue);
  const sTs  = toTs(projStart);
  const eTs  = toTs(projEnd);
  if (mTs === null || sTs === null || eTs === null || eTs <= sTs) return 50;
  const pct  = ((mTs - sTs) / (eTs - sTs)) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** Returns left% (0-100) for today's marker, or null if outside range. */
function todayLeftPct(projStart: string | null, projEnd: string | null): number | null {
  const now  = Date.now();
  const sTs  = toTs(projStart);
  const eTs  = toTs(projEnd);
  if (sTs === null || eTs === null || eTs <= sTs) return null;
  const pct  = ((now - sTs) / (eTs - sTs)) * 100;
  if (pct < 0 || pct > 100) return null;
  return pct;
}

// ── Status helpers ────────────────────────────────────────────────────────────

type MStatus = "completed" | "in-progress" | "upcoming";

function resolveMStatus(m: RoadmapMilestone): MStatus {
  const s = (m.status ?? "").toUpperCase();
  if (s === "DONE" || s === "COMPLETED" || s === "SIGNED" || s === "APPROVED") return "completed";
  if (s === "IN_PROGRESS" || s === "ACTIVE" || s === "PENDING_APPROVAL") return "in-progress";
  return "upcoming";
}

const M_DOT_COLOR: Record<MStatus, string> = {
  "completed":   "var(--lime)",
  "in-progress": "var(--amber)",
  "upcoming":    "var(--muted2)",
};

const M_BADGE: Record<MStatus, string> = {
  "completed":   "badgeGreen",
  "in-progress": "badgeAmber",
  "upcoming":    "badgeMuted",
};

const M_BADGE_LABEL: Record<MStatus, string> = {
  "completed":   "Done",
  "in-progress": "In Progress",
  "upcoming":    "Upcoming",
};

const PROJECT_STATUS_BADGE: Record<string, string> = {
  ACTIVE:    "badgeGreen",
  PLANNING:  "badgeAmber",
  ON_HOLD:   "badgeMuted",
  COMPLETED: "badgeGreen",
};

function projectBadge(status: string): string {
  return PROJECT_STATUS_BADGE[status?.toUpperCase()] ?? "badgeMuted";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectRoadmapPage() {
  const { session } = useProjectLayer();
  const [projects, setProjects] = useState<RoadmapProject[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const loadRoadmap = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (!session) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    const r = await loadProjectRoadmapWithRefresh(session);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error || !r.data) {
      setLoadError(r.error?.message ?? "Failed to load project roadmap. Please try again.");
    } else {
      setLoadError(null);
      setNowTs(Date.now());
      setProjects(r.data.projects);
    }
    setLoading(false);
    setRefreshing(false);
  }, [session]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRoadmap("initial");
  }, [loadRoadmap]);

  // KPI counts
  const kpis = useMemo(() => {
    const allMilestones = projects.flatMap((p) => p.milestones);
    const completed = allMilestones.filter((m) => resolveMStatus(m) === "completed").length;
    const upcoming  = allMilestones.filter((m) => resolveMStatus(m) !== "completed").length;
    return { total: projects.length, milestones: allMilestones.length, completed, upcoming };
  }, [projects]);

  // Upcoming milestones across all projects, sorted by due date
  const upcomingMilestones = useMemo(() => {
    const list: Array<{ project: RoadmapProject; milestone: RoadmapMilestone }> = [];
    for (const p of projects) {
      for (const m of p.milestones) {
        if (resolveMStatus(m) !== "completed") {
          list.push({ project: p, milestone: m });
        }
      }
    }
    list.sort((a, b) => {
      const aTs = toTs(a.milestone.dueAt) ?? Infinity;
      const bTs = toTs(b.milestone.dueAt) ?? Infinity;
      return aTs - bTs;
    });
    return list.filter(({ milestone }) => {
      const ts = toTs(milestone.dueAt);
      return ts === null || ts >= nowTs - 1000 * 60 * 60 * 24 * 7;
    }).slice(0, 20);
  }, [projects, nowTs]);

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

  return (
    <div className={cx("pageBody")}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Roadmap</div>
          <h1 className={cx("pageTitle")}>Project Roadmap</h1>
          <p className={cx("pageSub")}>Your projects and milestones at a glance.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void loadRoadmap("refresh")} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loadError && (
        <Alert variant="error" message={loadError} onRetry={() => void loadRoadmap("refresh")} />
      )}

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {projects.length === 0 && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}>
            <Ic n="calendar" sz={22} c="var(--muted2)" />
          </div>
          <div className={cx("emptyStateTitle")}>No active projects</div>
          <div className={cx("emptyStateSub")}>
            Your project roadmap will appear here once a project has been started.
          </div>
        </div>
      )}

      {/* ── KPI strip ────────────────────────────────────────────────────────── */}
      {projects.length > 0 && (
        <>
          <div className={cx("topCardsStack", "mb20")}>
            {[
              { label: "Projects",         value: String(kpis.total),      color: "statCardAccent" },
              { label: "Total Milestones", value: String(kpis.milestones), color: "statCardBlue"   },
              { label: "Completed",        value: String(kpis.completed),  color: "statCardGreen"  },
              { label: "Upcoming",         value: String(kpis.upcoming),   color: "statCardAmber"  },
            ].map((s) => (
              <div key={s.label} className={cx("statCard", s.color)}>
                <div className={cx("statLabel")}>{s.label}</div>
                <div className={cx("statValue")}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* ── Project cards ─────────────────────────────────────────────────── */}
          <div className={cx("rdmWrap")}>
            {projects.map((project) => {
              const todayPct  = todayLeftPct(project.startAt, project.endAt);
              const todayLeft = todayPct !== null ? Math.min(100, Math.max(0, todayPct)) : null;
              const hasDates  = project.startAt !== null && project.endAt !== null;
              const sortedMilestones = [...project.milestones].sort((a, b) => {
                const aTs = toTs(a.dueAt) ?? Number.MAX_SAFE_INTEGER;
                const bTs = toTs(b.dueAt) ?? Number.MAX_SAFE_INTEGER;
                return aTs - bTs;
              });
              const nextMilestone = sortedMilestones.find((milestone) => resolveMStatus(milestone) !== "completed") ?? null;
              const completedMilestones = sortedMilestones.filter((milestone) => resolveMStatus(milestone) === "completed");
              const openMilestones = sortedMilestones.filter((milestone) => resolveMStatus(milestone) !== "completed");
              const overdueCount = openMilestones.filter((milestone) => {
                const dueTs = toTs(milestone.dueAt);
                return dueTs !== null && dueTs < nowTs;
              }).length;
              const completedPct = sortedMilestones.length > 0
                ? Math.round((completedMilestones.length / sortedMilestones.length) * 100)
                : 0;

              return (
                <div key={project.id} className={cx("rdmCard")}>

                  {/* Card header */}
                  <div className={cx("rdmCardHd")}>
                    <div className={cx("flexRow", "flexCenter", "gap10")}>
                      <Ic n="briefcase" sz={14} c="var(--accent)" />
                      <span className={cx("fw700", "text14")}>{project.name}</span>
                      <span className={cx("badge", projectBadge(project.status))}>{project.status}</span>
                    </div>
                    <span className={cx("rdmCardDates")}>
                      {fmtDate(project.startAt)} → {fmtDate(project.endAt)}
                    </span>
                  </div>

                  <div className={cx("grid2", "gap12", "mb14")}>
                    <div className={cx("card", "p12")}>
                      <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb6")}>Next milestone</div>
                      {nextMilestone ? (
                        <>
                          <div className={cx("fw700", "text13", "mb4")}>{nextMilestone.title}</div>
                          <div className={cx("text11", "colorMuted", "mb8")}>
                            Due {fmtDate(nextMilestone.dueAt)}
                          </div>
                          <div className={cx("flexRow", "gap6", "flexWrap")}>
                            <span className={cx("badge", overdueCount > 0 && nextMilestone.dueAt && (toTs(nextMilestone.dueAt) ?? 0) < nowTs ? "badgeRed" : M_BADGE[resolveMStatus(nextMilestone)])}>
                              {overdueCount > 0 && nextMilestone.dueAt && (toTs(nextMilestone.dueAt) ?? 0) < nowTs ? "Overdue" : M_BADGE_LABEL[resolveMStatus(nextMilestone)]}
                            </span>
                            {nextMilestone.paymentStage && (
                              <span className={cx("badge", "badgePurple")}>{nextMilestone.paymentStage}</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={cx("fw700", "text13", "mb4")}>Delivery complete</div>
                          <div className={cx("text11", "colorMuted")}>All currently published milestones are complete.</div>
                        </>
                      )}
                    </div>

                    <div className={cx("card", "p12")}>
                      <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb6")}>Progress snapshot</div>
                      <div className={cx("fw700", "text13", "mb4")}>{completedPct}% milestone completion</div>
                      <div className={cx("text11", "colorMuted", "mb8")}>
                        {completedMilestones.length} of {sortedMilestones.length} milestones complete
                      </div>
                      <div className={cx("flexRow", "gap6", "flexWrap")}>
                        <span className={cx("badge", overdueCount > 0 ? "badgeRed" : "badgeGreen")}>
                          {overdueCount > 0 ? String(overdueCount) + " overdue" : "On pace"}
                        </span>
                        <span className={cx("badge", "badgeMuted")}>{openMilestones.length} open</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline track */}
                  {hasDates && (
                    <div className={cx("rdmTimelineWrap")}>
                      <div className={cx("rdmTimelineBar")}>
                        {todayLeft !== null && (
                          <div className={cx("rdmTimelineFill")} style={{ width: `${todayLeft}%` }} />
                        )}
                        {todayLeft !== null && (
                          <div className={cx("rdmTodayPin")} style={{ left: `${todayLeft}%` }}>
                            <span className={cx("rdmTodayTag")}>Today</span>
                          </div>
                        )}
                        {project.milestones.map((m) => {
                          const leftPct = Math.min(96, Math.max(2, milestoneLeftPct(m.dueAt, project.startAt, project.endAt)));
                          const mSt = resolveMStatus(m);
                          return (
                            <div
                              key={m.id}
                              className={cx("rdmMPin")}
                              style={{ left: `${leftPct}%`, "--pin-c": M_DOT_COLOR[mSt] } as React.CSSProperties}
                              title={`${m.title} · ${fmtDate(m.dueAt)}`}
                            />
                          );
                        })}
                      </div>
                      <div className={cx("rdmTimelineDates")}>
                        <span className={cx("text10", "colorMuted2")}>{fmtDate(project.startAt)}</span>
                        <span className={cx("text10", "colorMuted2")}>{fmtDate(project.endAt)}</span>
                      </div>
                    </div>
                  )}

                  {/* Milestone rows */}
                  {sortedMilestones.length > 0 ? (
                    <>
                      {openMilestones.length > 0 && (
                        <div className={cx("mb12")}>
                          <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb8")}>Open milestones</div>
                          <div className={cx("rdmMRows")}>
                            {openMilestones.map((m) => {
                              const mSt    = resolveMStatus(m);
                              const dueTs = toTs(m.dueAt);
                              const overdue = dueTs !== null && dueTs < nowTs && mSt !== "completed";
                              return (
                                <div key={m.id} className={cx("rdmMRow")}>
                                  <div className={cx("rdmMDot")} style={{ background: overdue ? "var(--red)" : M_DOT_COLOR[mSt] }} />
                                  <span className={cx("fw600", "text12", "flex1")}>{m.title}</span>
                                  {m.paymentStage && (
                                    <span className={cx("badge", "badgePurple")}>{m.paymentStage}</span>
                                  )}
                                  <span className={cx("badge", overdue ? "badgeRed" : M_BADGE[mSt])}>
                                    {overdue ? "Overdue" : M_BADGE_LABEL[mSt]}
                                  </span>
                                  <span className={cx("text11", "colorMuted", "noShrink", "fontMono")}>
                                    {fmtDate(m.dueAt)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {completedMilestones.length > 0 && (
                        <div>
                          <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb8")}>Completed milestones</div>
                          <div className={cx("rdmMRows")}>
                            {completedMilestones.map((m) => {
                              const mSt = resolveMStatus(m);
                              return (
                                <div key={m.id} className={cx("rdmMRow")}>
                                  <div className={cx("rdmMDot")} style={{ background: M_DOT_COLOR[mSt] }} />
                                  <span className={cx("fw600", "text12", "flex1")}>{m.title}</span>
                                  <span className={cx("badge", M_BADGE[mSt])}>{M_BADGE_LABEL[mSt]}</span>
                                  <span className={cx("text11", "colorMuted", "noShrink", "fontMono")}>
                                    {m.completedAt ? "Completed " + fmtDate(m.completedAt) : fmtDate(m.dueAt)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={cx("rdmNoMilestones")}>
                      <Ic n="flag" sz={13} c="var(--muted2)" />
                      <span className={cx("text12", "colorMuted")}>No milestones defined yet</span>
                    </div>
                  )}

                </div>
              );
            })}

            {/* ── Upcoming milestones panel ──────────────────────────────────── */}
            {upcomingMilestones.length > 0 && (
              <div className={cx("card", "mt8")}>
                <div className={cx("cardHd")}>
                  <Ic n="flag" sz={14} c="var(--accent)" />
                  <span className={cx("cardHdTitle", "ml8")}>Upcoming Milestones</span>
                  <span className={cx("badge", "badgeMuted", "mlAuto")}>{upcomingMilestones.length}</span>
                </div>
                <div className={cx("cardBodyPad")}>
                  <div className={cx("rdmUpcomingList")}>
                    {upcomingMilestones.map(({ project, milestone }) => {
                      const mStatus  = resolveMStatus(milestone);
                      const dueTs = toTs(milestone.dueAt);
                      const isOverdue = dueTs !== null && dueTs < nowTs;
                      return (
                        <div key={milestone.id} className={cx("rdmUpcomingRow")}>
                          <div
                            style={{
                              width: 8, height: 8, borderRadius: "50%",
                              background: isOverdue ? "var(--red)" : M_DOT_COLOR[mStatus],
                              flexShrink: 0,
                            }}
                          />
                          <div className={cx("flex1")}>
                            <span className={cx("fw600", "text12")}>{milestone.title}</span>
                            <span className={cx("text11", "colorMuted")}> · {project.name}</span>
                          </div>
                          <span className={cx("badge", isOverdue ? "badgeRed" : M_BADGE[mStatus])}>
                            {isOverdue ? "Overdue" : M_BADGE_LABEL[mStatus]}
                          </span>
                          <span className={cx("text11", "colorMuted", "noShrink")}>
                            {fmtDate(milestone.dueAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
