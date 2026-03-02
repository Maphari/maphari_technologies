"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";

const START = new Date("2026-02-01");
const END = new Date("2026-04-30");
const TOTAL_DAYS = Math.round((END.getTime() - START.getTime()) / 86400000);
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 72;
const TODAY = new Date("2026-02-23");
const todayOffset = Math.round((TODAY.getTime() - START.getTime()) / 86400000);

function dayOffset(dateStr: string) {
  return Math.round((new Date(dateStr).getTime() - START.getTime()) / 86400000);
}

type ProjectStatus = "on-track" | "at-risk" | "off-track";

type Phase = {
  name: string;
  start: string;
  end: string;
  done: boolean;
  current?: boolean;
  overdue?: boolean;
};

type Milestone = {
  name: string;
  date: string;
  done: boolean;
  overdue?: boolean;
};

const projects: Array<{
  client: string;
  clientColor: string;
  clientAvatar: string;
  name: string;
  phases: Phase[];
  milestones: Milestone[];
  deadline: string;
  status: ProjectStatus;
}> = [
  {
    client: "Volta Studios",
    clientColor: "var(--accent)",
    clientAvatar: "VS",
    name: "Brand Identity System",
    phases: [
      { name: "Discovery", start: "2026-01-06", end: "2026-01-20", done: true },
      { name: "Strategy", start: "2026-01-20", end: "2026-02-03", done: true },
      { name: "Design", start: "2026-02-03", end: "2026-03-10", done: false, current: true },
      { name: "Execution", start: "2026-03-10", end: "2026-03-25", done: false },
      { name: "Final Review", start: "2026-03-25", end: "2026-03-28", done: false },
    ],
    milestones: [
      { name: "Brand guidelines approved", date: "2026-02-03", done: true },
      { name: "Design system handoff", date: "2026-03-25", done: false },
    ],
    deadline: "2026-03-28",
    status: "on-track",
  },
  {
    client: "Kestrel Capital",
    clientColor: "var(--purple)",
    clientAvatar: "KC",
    name: "Q1 Campaign Strategy",
    phases: [
      { name: "Discovery", start: "2026-01-20", end: "2026-01-27", done: true },
      { name: "Strategy", start: "2026-01-27", end: "2026-02-10", done: true },
      { name: "Execution", start: "2026-02-10", end: "2026-02-24", done: false, current: true },
      { name: "Review", start: "2026-02-24", end: "2026-02-28", done: false },
    ],
    milestones: [
      { name: "Campaign brief approved", date: "2026-02-10", done: false, overdue: true },
      { name: "Campaign live", date: "2026-02-28", done: false },
    ],
    deadline: "2026-02-28",
    status: "at-risk",
  },
  {
    client: "Mira Health",
    clientColor: "var(--blue)",
    clientAvatar: "MH",
    name: "Website Redesign",
    phases: [
      { name: "Discovery", start: "2026-02-03", end: "2026-02-10", done: true },
      { name: "Wireframes", start: "2026-02-10", end: "2026-02-28", done: false, current: true },
      { name: "Design", start: "2026-02-28", end: "2026-03-28", done: false },
      { name: "Dev Handoff", start: "2026-03-28", end: "2026-04-11", done: false },
      { name: "QA & Launch", start: "2026-04-11", end: "2026-04-18", done: false },
    ],
    milestones: [
      { name: "Wireframe sign-off", date: "2026-02-28", done: false },
      { name: "Design approved", date: "2026-03-28", done: false },
      { name: "Launch", date: "2026-04-18", done: false },
    ],
    deadline: "2026-04-18",
    status: "on-track",
  },
  {
    client: "Dune Collective",
    clientColor: "var(--amber)",
    clientAvatar: "DC",
    name: "Editorial Design System",
    phases: [
      { name: "Discovery", start: "2025-12-01", end: "2025-12-15", done: true },
      { name: "Design", start: "2025-12-15", end: "2026-02-01", done: true },
      { name: "Execution", start: "2026-02-01", end: "2026-02-28", done: false, current: true, overdue: true },
      { name: "Delivery", start: "2026-02-28", end: "2026-03-01", done: false },
    ],
    milestones: [
      { name: "Scope locked", date: "2025-12-15", done: true },
      { name: "Final delivery", date: "2026-03-01", done: false },
    ],
    deadline: "2026-03-01",
    status: "off-track",
  },
  {
    client: "Okafor & Sons",
    clientColor: "var(--amber)",
    clientAvatar: "OS",
    name: "Annual Report 2025",
    phases: [
      { name: "Content", start: "2026-01-13", end: "2026-01-27", done: true },
      { name: "Design", start: "2026-01-27", end: "2026-02-17", done: true },
      { name: "Final Review", start: "2026-02-17", end: "2026-03-03", done: false, current: true },
      { name: "Print & Delivery", start: "2026-03-03", end: "2026-03-07", done: false },
    ],
    milestones: [
      { name: "Client sign-off", date: "2026-03-03", done: false },
      { name: "Delivered", date: "2026-03-07", done: false },
    ],
    deadline: "2026-03-07",
    status: "on-track",
  },
];

const months = [
  { label: "February 2026", days: 28, startDay: 0 },
  { label: "March 2026", days: 31, startDay: 27 },
  { label: "April 2026", days: 30, startDay: 58 },
];

const statusColors: Record<ProjectStatus, string> = {
  "on-track": "var(--accent)",
  "at-risk": "var(--amber)",
  "off-track": "var(--red)",
};

function toneVarClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.timelineToneAccent;
    case "var(--red)":
      return styles.timelineToneRed;
    case "var(--amber)":
      return styles.timelineToneAmber;
    case "var(--blue)":
      return styles.timelineToneBlue;
    case "var(--purple)":
      return styles.timelineTonePurple;
    default:
      return styles.timelineToneMuted;
  }
}

function fillClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.timelineFillAccent;
    case "var(--red)":
      return styles.timelineFillRed;
    case "var(--amber)":
      return styles.timelineFillAmber;
    case "var(--blue)":
      return styles.timelineFillBlue;
    case "var(--purple)":
      return styles.timelineFillPurple;
    default:
      return styles.timelineFillMuted;
  }
}

function monthCellClass(index: number): string {
  if (index === 0) return styles.timelineMonthCellFeb;
  if (index === 1) return styles.timelineMonthCellMar;
  return styles.timelineMonthCellApr;
}

function Avatar({ initials, color, size = 30 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      className={cx("fontMono", "fw700", "timelineAvatar", toneVarClass(color), size === 28 ? "timelineAvatar28" : "timelineAvatar30")}
    >
      {initials}
    </div>
  );
}

export function TimelineGanttPage() {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);
  const [showMilestones, setShowMilestones] = useState(true);

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / OPERATIONS</div>
          <h1 className={styles.pageTitle}>Timeline &amp; Gantt</h1>
          <div className={styles.pageSub}>Cross-portfolio project timelines - Phases - Milestones</div>
        </div>
        <div className={cx("flexRow", "gap8")}>
          <button
            type="button"
            onClick={() => setShowMilestones(!showMilestones)}
            className={cx("btnSm", showMilestones ? "btnAccent" : "btnGhost")}
          >
            ◆ Milestones {showMilestones ? "On" : "Off"}
          </button>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export PDF</button>
        </div>
      </div>

      <div className={cx("topCardsStack")}>
        {[
          { label: "Projects On-Track", value: projects.filter((p) => p.status === "on-track").length.toString(), color: "var(--accent)", sub: `of ${projects.length} total` },
          { label: "At Risk", value: projects.filter((p) => p.status === "at-risk").length.toString(), color: "var(--amber)", sub: "Review required" },
          { label: "Off Track", value: projects.filter((p) => p.status === "off-track").length.toString(), color: "var(--red)", sub: "Immediate action" },
          {
            label: "Milestones Due (14d)",
            value: projects
              .flatMap((p) => p.milestones)
              .filter((m) => !m.done && dayOffset(m.date) >= 0 && dayOffset(m.date) <= 14).length.toString(),
            color: "var(--blue)",
            sub: "Across all projects",
          },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={cx("card", styles.timelineScrollShell)}>
        <div className={styles.timelineScrollInner}>
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

          {projects.map((project, pi) => (
            <div key={project.name} className={cx("flexRow", "timelineProjectRow", pi < projects.length - 1 && "borderB")}>
              <div className={styles.timelineProjectCell}>
                <Avatar initials={project.clientAvatar} color={project.clientColor} size={28} />
                <div>
                  <div className={cx("fw600", "text12", "timelineLine13")}>{project.name}</div>
                  <div className={cx("text10", "mt4", colorClass(project.clientColor))}>{project.client}</div>
                  <div className={cx("uppercase", "mt4", "timelineStatusText", colorClass(statusColors[project.status]))}>{project.status.replace("-", " ")}</div>
                </div>
              </div>

              <div className={styles.timelineTrackCell}>
                <svg
                  className={styles.timelineTrackSvg}
                  viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <line
                    className={styles.timelineTodayMarkerLine}
                    x1={(todayOffset / TOTAL_DAYS) * SVG_WIDTH}
                    x2={(todayOffset / TOTAL_DAYS) * SVG_WIDTH}
                    y1={0}
                    y2={SVG_HEIGHT}
                  />

                  {project.phases.map((phase, i) => {
                    const pStart = Math.max(0, dayOffset(phase.start));
                    const pEnd = Math.min(TOTAL_DAYS, dayOffset(phase.end));
                    if (pEnd <= 0 || pStart >= TOTAL_DAYS) return null;
                    const left = (pStart / TOTAL_DAYS) * SVG_WIDTH;
                    const width = Math.max(((pEnd - pStart) / TOTAL_DAYS) * SVG_WIDTH, 8);
                    const phaseKey = `${project.name}-${i}`;
                    const dimmed = Boolean(hoveredPhase && hoveredPhase !== phaseKey);
                    const fill = phase.done
                      ? `color-mix(in oklab, ${project.clientColor} 33%, transparent)`
                      : phase.current
                        ? project.clientColor
                        : `color-mix(in oklab, ${project.clientColor} 20%, transparent)`;
                    const stroke = phase.overdue ? "var(--red)" : phase.current ? project.clientColor : "none";
                    const strokeWidth = phase.overdue ? 0.7 : phase.current ? 0.35 : 0;
                    const labelColor = phase.current
                      ? "var(--bg)"
                      : phase.done
                        ? "rgba(240, 237, 232, 0.76)"
                        : "rgba(240, 237, 232, 0.9)";
                    return (
                      <g key={phaseKey} onMouseEnter={() => setHoveredPhase(phaseKey)} onMouseLeave={() => setHoveredPhase(null)}>
                        <rect x={left} y={10} width={width} height={28} rx={2.2} ry={2.2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={dimmed ? 0.5 : 1} />
                        <text x={left + 14} y={26.4} className={styles.timelinePhaseLabelSvg} fill={labelColor} opacity={dimmed ? 0.5 : 1}>
                          {phase.done ? "\u2713 " : ""}
                          {phase.name}
                        </text>
                      </g>
                    );
                  })}

                  {showMilestones
                    ? project.milestones.map((ms, i) => {
                        const msOffset = dayOffset(ms.date);
                        if (msOffset < 0 || msOffset > TOTAL_DAYS) return null;
                        const left = (msOffset / TOTAL_DAYS) * SVG_WIDTH;
                        const milestoneColor = ms.done ? "var(--accent)" : ms.overdue ? "var(--red)" : project.clientColor;
                        return (
                          <g key={`${project.name}-ms-${i}`} transform={`translate(${left} 49)`}>
                            <rect x={-9} y={-9} width={18} height={18} transform="rotate(45)" fill={milestoneColor} stroke="var(--bg)" strokeWidth={3} />
                          <text x={7} y={16.5} className={styles.timelineMilestoneLabelSvg} fill={ms.overdue ? "var(--red)" : "rgba(240, 237, 232, 0.94)"}>
                            {ms.name}
                          </text>
                          </g>
                        );
                      })
                    : null}

                  {(() => {
                    const dl = dayOffset(project.deadline);
                    if (dl < 0 || dl > TOTAL_DAYS) return null;
                    const deadlineLeft = (dl / TOTAL_DAYS) * SVG_WIDTH;
                    const deadlineColor = statusColors[project.status];
                    return (
                      <g>
                        <line x1={deadlineLeft} x2={deadlineLeft} y1={0} y2={SVG_HEIGHT} className={styles.timelineDeadlineLineSvg} stroke={deadlineColor} />
                        <text x={deadlineLeft + 8} y={68} className={styles.timelineDeadlineLabelSvg} fill={deadlineColor}>deadline</text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>
          ))}

          <div className={cx("flexRow", "gap20", "flexWrap", "timelineLegendWrap")}>
            <span className={cx("text11", "colorMuted", "fw700")}>Legend:</span>
            {[
              { label: "Completed phase", cls: "timelineLegendCompleted" },
              { label: "Active phase", cls: "timelineLegendActive" },
              { label: "Upcoming phase", cls: "timelineLegendUpcoming" },
              { label: "Overdue", cls: "timelineLegendOverdue" },
            ].map((l) => (
              <div key={l.label} className={cx("flexRow", "gap8")}>
                <div className={cx("timelineLegendSwatch", l.cls)} />
                <span className={cx("text11", "colorMuted")}>{l.label}</span>
              </div>
            ))}
            <div className={cx("flexRow", "gap8")}>
              <div className={styles.timelineLegendDiamond} />
              <span className={cx("text11", "colorMuted")}>Milestone</span>
            </div>
            <div className={cx("flexRow", "gap8")}>
              <div className={styles.timelineLegendToday} />
              <span className={cx("text11", "colorMuted")}>Today</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cx("mt24")}>
        <div className={cx("text13", "fw700", "mb16", "uppercase", "timelineTracking")}>Upcoming Milestones - Next 30 Days</div>
        <div className={cx("flexCol", "gap10")}>
          {projects
            .flatMap((p) => p.milestones.map((m) => ({ ...m, project: p.name, client: p.client, clientColor: p.clientColor, status: p.status })))
            .filter((m) => !m.done && dayOffset(m.date) >= 0 && dayOffset(m.date) <= 30)
            .sort((a, b) => dayOffset(a.date) - dayOffset(b.date))
            .map((m, i) => (
              <div key={i} className={cx("card", "flexBetween", "timelineMilestoneItem", m.overdue && "timelineMilestoneOverdue")}>
                <div className={cx("flexRow", "gap12")}>
                  <div className={cx(styles.timelineMilestoneDot, m.overdue ? styles.timelineFillRed : fillClass(m.clientColor))} />
                  <div>
                    <div className={cx("fw600", "text13")}>{m.name}</div>
                    <div className={cx("text11", colorClass(m.clientColor))}>
                      {m.project} - {m.client}
                    </div>
                  </div>
                </div>
                <div className={styles.timelineTextRight}>
                  <div className={cx("fontMono", m.overdue ? "colorRed" : dayOffset(m.date) <= 7 ? "colorAmber" : "colorMuted")}>{m.date}</div>
                  <div className={cx("text10", m.overdue ? "colorRed" : "colorMuted")}>{m.overdue ? "OVERDUE" : `in ${dayOffset(m.date)}d`}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
