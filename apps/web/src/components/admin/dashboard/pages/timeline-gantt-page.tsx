"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import type { AdminSnapshot, AdminProject, AdminClient } from "../../../../lib/api/admin";
import { saveSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";

// ── Dynamic date window: today → +90 days ────────────────────────────────────
const TODAY_DATE = new Date();
TODAY_DATE.setHours(0, 0, 0, 0);
const START = new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth(), 1);
const END = new Date(START.getTime() + 90 * 24 * 60 * 60 * 1000);
const TOTAL_DAYS = Math.round((END.getTime() - START.getTime()) / 86400000);
const todayOffset = Math.round((TODAY_DATE.getTime() - START.getTime()) / 86400000);

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 72;

function dayOffset(dateStr: string) {
  return Math.round((new Date(dateStr).getTime() - START.getTime()) / 86400000);
}

// ── Dynamic 3-month labels ────────────────────────────────────────────────────
function getMonthLabel(offset: number): string {
  const d = new Date(START.getFullYear(), START.getMonth() + offset, 1);
  return d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

function getMonthStartDay(offset: number): number {
  const d = new Date(START.getFullYear(), START.getMonth() + offset, 1);
  return Math.round((d.getTime() - START.getTime()) / 86400000);
}

const months = [
  { label: getMonthLabel(0), startDay: getMonthStartDay(0) },
  { label: getMonthLabel(1), startDay: getMonthStartDay(1) },
  { label: getMonthLabel(2), startDay: getMonthStartDay(2) },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type ProjectStatus = "on-track" | "at-risk" | "off-track";

type GanttProject = {
  client: string;
  clientColor: string;
  clientAvatar: string;
  name: string;
  start: string;
  end: string;
  deadline: string;
  status: ProjectStatus;
};

// ── Color palette for clients ─────────────────────────────────────────────────
const CLIENT_COLORS = [
  "var(--accent)",
  "var(--purple)",
  "var(--blue)",
  "var(--amber)",
  "var(--red)",
];

const statusColors: Record<ProjectStatus, string> = {
  "on-track": "var(--accent)",
  "at-risk": "var(--amber)",
  "off-track": "var(--red)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function toneVarClass(color: string): string {
  switch (color) {
    case "var(--accent)": return styles.timelineToneAccent;
    case "var(--red)":    return styles.timelineToneRed;
    case "var(--amber)":  return styles.timelineToneAmber;
    case "var(--blue)":   return styles.timelineToneBlue;
    case "var(--purple)": return styles.timelineTonePurple;
    default:              return styles.timelineToneMuted;
  }
}

function fillClass(color: string): string {
  switch (color) {
    case "var(--accent)": return styles.timelineFillAccent;
    case "var(--red)":    return styles.timelineFillRed;
    case "var(--amber)":  return styles.timelineFillAmber;
    case "var(--blue)":   return styles.timelineFillBlue;
    case "var(--purple)": return styles.timelineFillPurple;
    default:              return styles.timelineFillMuted;
  }
}

function monthCellClass(index: number): string {
  if (index === 0) return styles.timelineMonthCellFeb;
  if (index === 1) return styles.timelineMonthCellMar;
  return styles.timelineMonthCellApr;
}

function Avatar({ initials, color, size = 30 }: { initials: string; color: string; size?: number }) {
  return (
    <div className={cx("fontMono", "fw700", "timelineAvatar", toneVarClass(color), size === 28 ? "timelineAvatar28" : "timelineAvatar30")}>
      {initials}
    </div>
  );
}

function mapStatus(riskLevel: string, status: string, dueAt: string | null): ProjectStatus {
  if (riskLevel === "HIGH") return "at-risk";
  if (status === "ARCHIVED") return "off-track";
  if (dueAt && new Date(dueAt) < TODAY_DATE && status !== "COMPLETED") return "off-track";
  return "on-track";
}

function snapshotToGantt(snapshot: AdminSnapshot): GanttProject[] {
  const clientColorMap = new Map<string, string>();
  let colorIdx = 0;
  return snapshot.projects
    .filter((p: AdminProject) => p.status !== "ARCHIVED")
    .map((p: AdminProject): GanttProject => {
      if (!clientColorMap.has(p.clientId)) {
        clientColorMap.set(p.clientId, CLIENT_COLORS[colorIdx % CLIENT_COLORS.length] ?? "var(--accent)");
        colorIdx++;
      }
      const client = snapshot.clients.find((c: AdminClient) => c.id === p.clientId);
      const clientName = client?.name ?? "Unknown Client";
      const clientColor = clientColorMap.get(p.clientId) ?? "var(--accent)";
      const initials = clientName.split(" ").map((w: string) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
      const startStr = p.startAt ?? p.createdAt;
      const endStr = p.dueAt ?? new Date(END.getTime() - 86400000).toISOString().slice(0, 10);
      const deadlineStr = p.dueAt ?? endStr;
      return {
        client: clientName,
        clientColor,
        clientAvatar: initials,
        name: p.name,
        start: startStr,
        end: endStr,
        deadline: deadlineStr,
        status: mapStatus(p.riskLevel, p.status, p.dueAt),
      };
    });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TimelineGanttPage() {
  const { session } = useAdminWorkspaceContext();
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const result = await loadAdminSnapshotWithRefresh(session);
    if (result.nextSession) saveSession(result.nextSession);
    setSnapshot(result.data ?? null);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const projects = useMemo(() => (snapshot ? snapshotToGantt(snapshot) : []), [snapshot]);

  const onTrack = projects.filter((p) => p.status === "on-track").length;
  const atRisk   = projects.filter((p) => p.status === "at-risk").length;
  const offTrack = projects.filter((p) => p.status === "off-track").length;

  // Upcoming deadlines in next 30 days
  const upcomingDeadlines = projects
    .filter((p) => {
      const d = dayOffset(p.deadline);
      return d >= 0 && d <= 30;
    })
    .sort((a, b) => dayOffset(a.deadline) - dayOffset(b.deadline));

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
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / OPERATIONS</div>
          <h1 className={styles.pageTitle}>Timeline &amp; Gantt</h1>
          <div className={styles.pageSub}>Cross-portfolio project timelines · 90-day view</div>
        </div>
        <div className={cx("flexRow", "gap8")}>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={cx("btnSm", "btnGhost")}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className={cx("topCardsStack")}>
        {[
          { label: "Projects On-Track", value: onTrack.toString(), color: "var(--accent)", sub: `of ${projects.length} total` },
          { label: "At Risk",    value: atRisk.toString(),   color: "var(--amber)", sub: "Review required" },
          { label: "Off Track",  value: offTrack.toString(), color: "var(--red)",   sub: "Immediate action" },
          { label: "Deadlines (30d)", value: upcomingDeadlines.length.toString(), color: "var(--blue)", sub: "Across all projects" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className={cx(styles.card, styles.cardInner, "textCenter")}>
          <div className={cx("text13", "mb4")}>No active projects</div>
          <div className={cx("text12", "colorMuted")}>Projects will appear here once created and scheduled.</div>
        </div>
      )}

      {/* Gantt chart */}
      {projects.length > 0 && (
        <div className={cx("card", styles.timelineScrollShell)}>
          <div className={styles.timelineScrollInner}>
            {/* Month header */}
            <div className={cx("flexRow", "borderB")}>
              <div className={cx("text11", "colorMuted", "timelineProjectHead")}>Project</div>
              <div className={styles.timelineMonthsRow}>
                {months.map((m, index) => (
                  <div key={m.label} className={cx("text11", "fw700", "colorAccent", "textCenter", "timelineMonthCell", monthCellClass(index))}>
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Project rows */}
            {projects.map((project, pi) => {
              const pStart = Math.max(0, dayOffset(project.start));
              const pEnd = Math.min(TOTAL_DAYS, dayOffset(project.end));
              const left = (Math.max(0, pStart) / TOTAL_DAYS) * SVG_WIDTH;
              const width = Math.max(((Math.max(1, pEnd - pStart)) / TOTAL_DAYS) * SVG_WIDTH, 8);
              const dimmed = Boolean(hoveredProject && hoveredProject !== project.name);
              const projectKey = project.name;

              return (
                <div key={projectKey} className={cx("flexRow", "timelineProjectRow", pi < projects.length - 1 && "borderB")}>
                  <div className={styles.timelineProjectCell}>
                    <Avatar initials={project.clientAvatar} color={project.clientColor} size={28} />
                    <div>
                      <div className={cx("fw600", "text12", "timelineLine13")}>{project.name}</div>
                      <div className={cx("text10", "mt4", colorClass(project.clientColor))}>{project.client}</div>
                      <div className={cx("uppercase", "mt4", "timelineStatusText", colorClass(statusColors[project.status]))}>
                        {project.status.replace("-", " ")}
                      </div>
                    </div>
                  </div>

                  <div className={styles.timelineTrackCell}>
                    <svg
                      className={styles.timelineTrackSvg}
                      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      focusable="false"
                      onMouseEnter={() => setHoveredProject(projectKey)}
                      onMouseLeave={() => setHoveredProject(null)}
                    >
                      {/* Today line */}
                      <line
                        className={styles.timelineTodayMarkerLine}
                        x1={(todayOffset / TOTAL_DAYS) * SVG_WIDTH}
                        x2={(todayOffset / TOTAL_DAYS) * SVG_WIDTH}
                        y1={0}
                        y2={SVG_HEIGHT}
                      />

                      {/* Project bar */}
                      {pEnd > 0 && pStart < TOTAL_DAYS && (
                        <g>
                          <rect
                            x={left} y={10} width={width} height={28} rx={2.2} ry={2.2}
                            fill={project.clientColor}
                            opacity={dimmed ? 0.35 : 0.85}
                          />
                          <text x={left + 10} y={26.4} className={styles.timelinePhaseLabelSvg} fill="var(--bg)" opacity={dimmed ? 0.5 : 1}>
                            {project.name}
                          </text>
                        </g>
                      )}

                      {/* Deadline marker */}
                      {(() => {
                        const dl = dayOffset(project.deadline);
                        if (dl < 0 || dl > TOTAL_DAYS) return null;
                        const dlLeft = (dl / TOTAL_DAYS) * SVG_WIDTH;
                        const deadlineColor = statusColors[project.status];
                        return (
                          <g>
                            <line x1={dlLeft} x2={dlLeft} y1={0} y2={SVG_HEIGHT} className={styles.timelineDeadlineLineSvg} stroke={deadlineColor} />
                            <text x={dlLeft + 4} y={68} className={styles.timelineDeadlineLabelSvg} fill={deadlineColor}>deadline</text>
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className={cx("flexRow", "gap20", "flexWrap", "timelineLegendWrap")}>
              <span className={cx("text11", "colorMuted", "fw700")}>Legend:</span>
              {[
                { label: "On Track",  cls: fillClass("var(--accent)") },
                { label: "At Risk",   cls: fillClass("var(--amber)") },
                { label: "Off Track", cls: fillClass("var(--red)") },
              ].map((l) => (
                <div key={l.label} className={cx("flexRow", "gap8")}>
                  <div className={cx("timelineLegendSwatch", l.cls)} />
                  <span className={cx("text11", "colorMuted")}>{l.label}</span>
                </div>
              ))}
              <div className={cx("flexRow", "gap8")}>
                <div className={styles.timelineLegendToday} />
                <span className={cx("text11", "colorMuted")}>Today</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className={cx("mt24")}>
          <div className={cx("text13", "fw700", "mb16", "uppercase", "timelineTracking")}>Upcoming Deadlines — Next 30 Days</div>
          <div className={cx("flexCol", "gap10")}>
            {upcomingDeadlines.map((p, i) => {
              const daysLeft = dayOffset(p.deadline);
              return (
                <div key={i} className={cx("card", "flexBetween", "timelineMilestoneItem")}>
                  <div className={cx("flexRow", "gap12")}>
                    <div className={cx(styles.timelineMilestoneDot, fillClass(p.clientColor))} />
                    <div>
                      <div className={cx("fw600", "text13")}>{p.name}</div>
                      <div className={cx("text11", colorClass(p.clientColor))}>{p.client}</div>
                    </div>
                  </div>
                  <div className={styles.timelineTextRight}>
                    <div className={cx("fontMono", daysLeft <= 7 ? "colorAmber" : "colorMuted")}>{p.deadline.slice(0, 10)}</div>
                    <div className={cx("text10", daysLeft <= 7 ? "colorAmber" : "colorMuted")}>{daysLeft === 0 ? "TODAY" : `in ${daysLeft}d`}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
