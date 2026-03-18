"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffProjects } from "../../../../lib/api/staff/projects";
import { getStaffClients } from "../../../../lib/api/staff/clients";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "done" | "in-progress" | "upcoming";

type TimelineItem = {
  id: string;
  project: string;
  task: string;
  startWeek: number;
  durationWeeks: number;
  status: Status;
  client: string;
};

// ── Week helpers (computed once at module load) ────────────────────────────────

function getWeekNum(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.ceil((d.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

const CWN = getWeekNum(new Date());
const CURRENT_WEEK_IDX = 3; // 3 past weeks + current + 4 upcoming
const FIRST_WEEK_NUM = CWN - CURRENT_WEEK_IDX;
const WEEKS = Array.from({ length: 8 }, (_, i) => `W${FIRST_WEEK_NUM + i}`);
const COL_TPL = `200px repeat(8, minmax(40px, 1fr))`;

// ── Status helpers ─────────────────────────────────────────────────────────────

function mapStatus(status: string): Status {
  if (status === "COMPLETED" || status === "CANCELLED") return "done";
  if (status === "IN_PROGRESS" || status === "REVIEW")  return "in-progress";
  return "upcoming";
}

function barCls(s: Status) {
  if (s === "done")        return "tlBarDone";
  if (s === "in-progress") return "tlBarProgress";
  return "tlBarUpcoming";
}

function dotCls(s: Status) {
  if (s === "done")        return "tlDotDone";
  if (s === "in-progress") return "tlDotProgress";
  return "tlDotUpcoming";
}

function badgeCls(s: Status) {
  if (s === "done")        return "tlBadgeDone";
  if (s === "in-progress") return "tlBadgeProgress";
  return "tlBadgeUpcoming";
}

function badgeLabel(s: Status) {
  if (s === "done")        return "Done";
  if (s === "in-progress") return "In Progress";
  return "Upcoming";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MyTimelinePage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void Promise.all([
      getStaffProjects(session),
      getStaffClients(session),
    ]).then(([projRes, clientRes]) => {
      if (cancelled) return;
      if (projRes.nextSession) saveSession(projRes.nextSession);
      if (clientRes.nextSession) saveSession(clientRes.nextSession);

      const clientMap: Record<string, string> = {};
      for (const c of clientRes.data ?? []) clientMap[c.id] = c.name;

      const items: TimelineItem[] = (projRes.data ?? []).map((p) => {
        const startWn      = p.startAt ? getWeekNum(new Date(p.startAt)) : CWN;
        const endWn        = p.dueAt   ? getWeekNum(new Date(p.dueAt))   : CWN + 2;
        const startWeek    = Math.max(1, startWn - FIRST_WEEK_NUM + 1);
        const durationWeeks = Math.max(1, endWn - startWn + 1);
        return {
          id: p.id,
          project: p.name,
          task: p.description ?? p.name,
          startWeek,
          durationWeeks,
          status: mapStatus(p.status),
          client: clientMap[p.clientId] ?? "Unknown",
        };
      });

      setTimelineItems(items);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  const done       = timelineItems.filter((i) => i.status === "done").length;
  const inProgress = timelineItems.filter((i) => i.status === "in-progress").length;
  const upcoming   = timelineItems.filter((i) => i.status === "upcoming").length;

  const grouped = timelineItems.reduce<Record<string, TimelineItem[]>>((acc, item) => {
    if (!acc[item.project]) acc[item.project] = [];
    acc[item.project].push(item);
    return acc;
  }, {});

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-timeline">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Project Management</div>
        <h1 className={cx("pageTitleText")}>My Timeline</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal task timeline across all assigned projects</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("tlStatGrid")}>

        <div className={cx("tlStatCard")}>
          <div className={cx("tlStatCardTop")}>
            <div className={cx("tlStatLabel")}>Total Tasks</div>
            <div className={cx("tlStatValue")}>{loading ? "…" : timelineItems.length}</div>
          </div>
          <div className={cx("tlStatCardDivider")} />
          <div className={cx("tlStatCardBottom")}>
            <span className={cx("tlStatDot", "dotBgMuted2")} />
            <span className={cx("tlStatMeta")}>across all projects</span>
          </div>
        </div>

        <div className={cx("tlStatCard")}>
          <div className={cx("tlStatCardTop")}>
            <div className={cx("tlStatLabel")}>In Progress</div>
            <div className={cx("tlStatValue", "colorAmber")}>{loading ? "…" : inProgress}</div>
          </div>
          <div className={cx("tlStatCardDivider")} />
          <div className={cx("tlStatCardBottom")}>
            <span className={cx("tlStatDot", "dotBgAmber")} />
            <span className={cx("tlStatMeta")}>active tasks</span>
          </div>
        </div>

        <div className={cx("tlStatCard")}>
          <div className={cx("tlStatCardTop")}>
            <div className={cx("tlStatLabel")}>Completed</div>
            <div className={cx("tlStatValue", "colorGreen")}>{loading ? "…" : done}</div>
          </div>
          <div className={cx("tlStatCardDivider")} />
          <div className={cx("tlStatCardBottom")}>
            <span className={cx("tlStatDot", "dotBgGreen")} />
            <span className={cx("tlStatMeta")}>tasks done</span>
          </div>
        </div>

        <div className={cx("tlStatCard")}>
          <div className={cx("tlStatCardTop")}>
            <div className={cx("tlStatLabel")}>Upcoming</div>
            <div className={cx("tlStatValue", "colorAccent")}>{loading ? "…" : upcoming}</div>
          </div>
          <div className={cx("tlStatCardDivider")} />
          <div className={cx("tlStatCardBottom")}>
            <span className={cx("tlStatDot", "dotBgAccent")} />
            <span className={cx("tlStatMeta")}>not yet started</span>
          </div>
        </div>

      </div>

      {/* ── Project groups ───────────────────────────────────────────────── */}
      {loading ? (
        <div className={cx("colorMuted2", "text12", "mt16")}>Loading timeline…</div>
      ) : timelineItems.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <div className={cx("emptyStateTitle")}>No projects assigned</div>
          <p className={cx("emptyStateSub")}>Your project timeline will appear here once you are assigned to active projects.</p>
        </div>
      ) : Object.entries(grouped).map(([project, tasks]) => (
        <div key={project} className={cx("tlSection")}>

          {/* Section header */}
          <div className={cx("tlSectionHeader")}>
            <div className={cx("tlSectionLeft")}>
              <div className={cx("tlSectionTitle")}>{project}</div>
              <span className={cx("tlClientBadge")}>{tasks[0].client}</span>
            </div>
            <span className={cx("tlSectionMeta")}>{tasks.length} TASK{tasks.length !== 1 ? "S" : ""}</span>
          </div>

          {/* Gantt */}
          <div className={cx("tlGantt")}>

            {/* Week header row */}
            <div className={cx("tlWeekRow")} style={{ "--col-tpl": COL_TPL } as React.CSSProperties}>
              <div className={cx("tlWeekRowSpacer")} />
              {WEEKS.map((w, i) => (
                <div key={w} className={cx("tlWeekLabel", i === CURRENT_WEEK_IDX && "tlWeekLabelCurrent")}>
                  {w}
                </div>
              ))}
            </div>

            {/* Task rows */}
            {tasks.map((task, tIdx) => (
              <div
                key={task.id}
                className={cx("tlTaskRow", tIdx === tasks.length - 1 && "tlTaskRowLast")} style={{ "--col-tpl": COL_TPL } as React.CSSProperties}
              >
                {/* Task info */}
                <div className={cx("tlTaskInfo")}>
                  <span className={cx("tlTaskDot", dotCls(task.status))} />
                  <span className={cx("tlTaskName")} title={task.task}>{task.task}</span>
                  <span className={cx("tlTaskBadge", badgeCls(task.status))}>{badgeLabel(task.status)}</span>
                </div>

                {/* Week cells */}
                {WEEKS.map((_, i) => {
                  const wIdx    = i + 1;
                  const active  = wIdx >= task.startWeek && wIdx < task.startWeek + task.durationWeeks;
                  const isSolo  = task.durationWeeks === 1;
                  const isFirst = wIdx === task.startWeek;
                  const isLast  = wIdx === task.startWeek + task.durationWeeks - 1;

                  let radius = "0";
                  if (isSolo)       radius = "4px";
                  else if (isFirst) radius = "4px 0 0 4px";
                  else if (isLast)  radius = "0 4px 4px 0";

                  return (
                    <div key={i} className={cx("tlCell", i === CURRENT_WEEK_IDX && "tlCellCurrent")}>
                      {active && (
                        <div className={cx("tlBar", barCls(task.status))} style={{ "--radius": radius } as React.CSSProperties} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

          </div>
        </div>
      ))}

    </section>
  );
}
