// ════════════════════════════════════════════════════════════════════════════
// project-roadmap-page.tsx — Client Portal: Project Roadmap
// Shows all active/upcoming projects grouped with a proportional horizontal
// milestone timeline, a "Today" marker, and an upcoming milestone list.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useMemo } from "react";
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

/** Returns left% (0-100) for today's marker on the project track. */
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

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    loadProjectRoadmapWithRefresh(session)
      .then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (r.error || !r.data) {
          setLoadError(r.error?.message ?? "Failed to load project roadmap. Please try again.");
          return;
        }
        setLoadError(null);
        setProjects(r.data.projects);
      })
      .finally(() => setLoading(false));
  }, [session]);

  // All upcoming milestones sorted by dueAt across all projects
  const upcomingMilestones = useMemo(() => {
    const now = Date.now();
    const list: Array<{ project: RoadmapProject; milestone: RoadmapMilestone }> = [];
    for (const p of projects) {
      for (const m of p.milestones) {
        const st = resolveMStatus(m);
        if (st !== "completed") {
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
      return ts === null || ts >= now - 1000 * 60 * 60 * 24 * 7; // include up to 1 week overdue
    }).slice(0, 20);
  }, [projects]);

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
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Projects · Roadmap</div>
          <h1 className={cx("pageTitle")}>Project Roadmap</h1>
          <p className={cx("pageSub")}>Your projects and milestones at a glance.</p>
        </div>
      </div>

      {loadError && (
        <Alert
          variant="error"
          message={loadError}
          onRetry={() => { setLoadError(null); }}
        />
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && projects.length === 0 && (
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

      {/* ── Main content ──────────────────────────────────────────────────── */}
      {!loading && projects.length > 0 && (
        <div className={cx("rdmWrap")}>

          {/* ── Per-project timeline blocks ─────────────────────────────── */}
          {projects.map((project) => {
            const todayPct = todayLeftPct(project.startAt, project.endAt);
            const todayLeft = todayPct !== null ? Math.min(100, Math.max(0, todayPct)) : null;

            return (
              <div key={project.id} className={cx("rdmProjectBlock")}>

                {/* Project header */}
                <div className={cx("rdmProjectHeader")}>
                  <Ic n="briefcase" sz={14} c="var(--accent)" />
                  <span className={cx("fw700", "text14")}>{project.name}</span>
                  <span className={cx("badge", projectBadge(project.status))}>
                    {project.status}
                  </span>
                  <span className={cx("text11", "colorMuted", "mlAuto")}>
                    {fmtDate(project.startAt)} → {fmtDate(project.endAt)}
                  </span>
                </div>

                {/* Horizontal track */}
                <div className={cx("rdmProjectWrap")}>
                <div className={cx("rdmTrackOuter")}>
                  {/* Background span bar */}
                  <div
                    className={cx("rdmTrackBar")}
                    style={{ left: "2%", width: "96%" }}
                  />

                  {/* Today line */}
                  {todayLeft !== null && (
                    <div
                      className={cx("rdmTodayLine")}
                      style={{ left: `${todayLeft}%` }}
                      title="Today"
                    />
                  )}

                  {/* Milestone markers */}
                  {project.milestones.map((m) => {
                    const rawLeftPct = milestoneLeftPct(m.dueAt, project.startAt, project.endAt);
                    const milestoneLeft = Math.min(96, Math.max(2, rawLeftPct));
                    const mStatus = resolveMStatus(m);
                    return (
                      <div
                        key={m.id}
                        className={cx(
                          "rdmMilestone",
                          mStatus === "completed" ? "rdmMilestoneCompleted" :
                          mStatus === "in-progress" ? "rdmMilestoneInProgress" : ""
                        )}
                        style={{ left: `${milestoneLeft}%` }}
                        title={`${m.title} · ${fmtDate(m.dueAt)}`}
                      >
                        <div
                          className={cx("rdmMilestoneDot")}
                        />
                        <div className={cx("rdmMilestoneLabel")}>
                          {m.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>

                {/* Legend row */}
                <div className={cx("flexRow", "gap16", "flexWrap")}>
                  {(["completed", "in-progress", "upcoming"] as MStatus[]).map((st) => {
                    const count = project.milestones.filter((m) => resolveMStatus(m) === st).length;
                    if (count === 0) return null;
                    return (
                      <div key={st} className={cx("flexRow", "flexCenter", "gap6")}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: M_DOT_COLOR[st], flexShrink: 0 }} />
                        <span className={cx("text11", "colorMuted")}>{count} {M_BADGE_LABEL[st]}</span>
                      </div>
                    );
                  })}
                  {project.milestones.length === 0 && (
                    <span className={cx("text11", "colorMuted")}>No milestones defined</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Upcoming milestones list ─────────────────────────────────── */}
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
                    const mStatus = resolveMStatus(milestone);
                    const isOverdue = toTs(milestone.dueAt) !== null && (toTs(milestone.dueAt) as number) < Date.now();
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
      )}
    </div>
  );
}
