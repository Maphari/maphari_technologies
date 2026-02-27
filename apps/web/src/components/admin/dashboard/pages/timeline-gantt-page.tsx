"use client";

import { useState } from "react";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  lime: "#a78bfa",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0",
};

const START = new Date("2026-02-01");
const END = new Date("2026-04-30");
const TOTAL_DAYS = Math.round((END.getTime() - START.getTime()) / 86400000);
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
    clientColor: C.lime,
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
    clientColor: C.purple,
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
    clientColor: C.blue,
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
    clientColor: C.amber,
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
    clientColor: C.orange,
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
  "on-track": C.lime,
  "at-risk": C.amber,
  "off-track": C.red,
};

function Avatar({ initials, color, size = 30 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function TimelineGanttPage() {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);
  const [showMilestones, setShowMilestones] = useState(true);

  const ROW_H = 64;
  const LABEL_W = 260;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / OPERATIONS</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Timeline &amp; Gantt</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Cross-portfolio project timelines - Phases - Milestones</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowMilestones(!showMilestones)} style={{ background: showMilestones ? `${C.lime}15` : C.surface, border: `1px solid ${showMilestones ? C.lime : C.border}`, color: showMilestones ? C.lime : C.muted, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>
            ◆ Milestones {showMilestones ? "On" : "Off"}
          </button>
          <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Export PDF</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Projects On-Track", value: projects.filter((p) => p.status === "on-track").length.toString(), color: C.lime, sub: `of ${projects.length} total` },
          { label: "At Risk", value: projects.filter((p) => p.status === "at-risk").length.toString(), color: C.amber, sub: "Review required" },
          { label: "Off Track", value: projects.filter((p) => p.status === "off-track").length.toString(), color: C.red, sub: "Immediate action" },
          {
            label: "Milestones Due (14d)",
            value: projects
              .flatMap((p) => p.milestones)
              .filter((m) => !m.done && dayOffset(m.date) >= 0 && dayOffset(m.date) <= 14).length.toString(),
            color: C.blue,
            sub: "Across all projects",
          },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: LABEL_W, flexShrink: 0, padding: "10px 20px", fontSize: 11, color: C.muted, borderRight: `1px solid ${C.border}` }}>Project</div>
          <div style={{ flex: 1, display: "flex", position: "relative" }}>
            {months.map((m) => (
              <div key={m.label} style={{ width: `${(m.days / TOTAL_DAYS) * 100}%`, padding: "10px 12px", fontSize: 11, fontWeight: 700, color: C.lime, borderRight: `1px solid ${C.border}`, textAlign: "center" }}>
                {m.label}
              </div>
            ))}
          </div>
        </div>

        {projects.map((project, pi) => (
          <div key={project.name} style={{ display: "flex", borderBottom: pi < projects.length - 1 ? `1px solid ${C.border}` : "none", minHeight: ROW_H + 16 }}>
            <div style={{ width: LABEL_W, flexShrink: 0, padding: "12px 20px", borderRight: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar initials={project.clientAvatar} color={project.clientColor} size={28} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.3 }}>{project.name}</div>
                <div style={{ fontSize: 10, color: project.clientColor, marginTop: 2 }}>{project.client}</div>
                <div style={{ fontSize: 9, color: statusColors[project.status], marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{project.status.replace("-", " ")}</div>
              </div>
            </div>

            <div style={{ flex: 1, position: "relative", padding: "16px 0" }}>
              <div style={{ position: "absolute", left: `${(todayOffset / TOTAL_DAYS) * 100}%`, top: 0, bottom: 0, width: 2, background: C.lime, opacity: 0.6, zIndex: 10 }} />

              {project.phases.map((phase, i) => {
                const pStart = Math.max(0, dayOffset(phase.start));
                const pEnd = Math.min(TOTAL_DAYS, dayOffset(phase.end));
                if (pEnd <= 0 || pStart >= TOTAL_DAYS) return null;
                const left = (pStart / TOTAL_DAYS) * 100;
                const width = ((pEnd - pStart) / TOTAL_DAYS) * 100;
                const bg = phase.done ? `${project.clientColor}55` : phase.current ? project.clientColor : `${project.clientColor}33`;
                const border = phase.overdue ? `2px solid ${C.red}` : phase.current ? `1px solid ${project.clientColor}` : "none";
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredPhase(`${project.name}-${i}`)}
                    onMouseLeave={() => setHoveredPhase(null)}
                    style={{ position: "absolute", left: `${left}%`, width: `${width}%`, height: 28, top: 10, borderRadius: 4, background: bg, border, display: "flex", alignItems: "center", paddingLeft: 8, cursor: "default", overflow: "hidden", transition: "opacity 0.2s", opacity: hoveredPhase && hoveredPhase !== `${project.name}-${i}` ? 0.5 : 1 }}
                  >
                    <span style={{ fontSize: 10, color: phase.done ? `${project.clientColor}99` : phase.current ? C.bg : project.clientColor, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden" }}>
                      {phase.done ? "✓ " : ""}
                      {phase.name}
                    </span>
                  </div>
                );
              })}

              {showMilestones
                ? project.milestones.map((ms, i) => {
                    const msOffset = dayOffset(ms.date);
                    if (msOffset < 0 || msOffset > TOTAL_DAYS) return null;
                    const left = (msOffset / TOTAL_DAYS) * 100;
                    return (
                      <div key={i} style={{ position: "absolute", left: `${left}%`, top: 44, transform: "translateX(-50%)", zIndex: 5 }}>
                        <div style={{ width: 10, height: 10, background: ms.done ? C.lime : ms.overdue ? C.red : project.clientColor, transform: "rotate(45deg)", border: `2px solid ${C.bg}` }} />
                        <div style={{ fontSize: 8, color: ms.done ? C.lime : ms.overdue ? C.red : project.clientColor, whiteSpace: "nowrap", marginTop: 4, textAlign: "center", transform: "translateX(-30%)" }}>{ms.name}</div>
                      </div>
                    );
                  })
                : null}

              {(() => {
                const dl = dayOffset(project.deadline);
                if (dl < 0 || dl > TOTAL_DAYS) return null;
                return (
                  <div style={{ position: "absolute", left: `${(dl / TOTAL_DAYS) * 100}%`, top: 0, bottom: 0, width: 1, background: statusColors[project.status], opacity: 0.8 }}>
                    <div style={{ position: "absolute", bottom: 4, left: 4, fontSize: 8, color: statusColors[project.status], whiteSpace: "nowrap" }}>deadline</div>
                  </div>
                );
              })()}
            </div>
          </div>
        ))}

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>Legend:</span>
          {[
            { label: "Completed phase", style: { background: `${C.lime}55`, border: "none" } },
            { label: "Active phase", style: { background: C.lime, border: "none" } },
            { label: "Upcoming phase", style: { background: `${C.lime}22`, border: `1px solid ${C.lime}33` } },
            { label: "Overdue", style: { background: `${C.red}33`, border: `2px solid ${C.red}` } },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 24, height: 12, borderRadius: 3, ...l.style }} />
              <span style={{ fontSize: 11, color: C.muted }}>{l.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 10, height: 10, background: C.lime, transform: "rotate(45deg)" }} />
            <span style={{ fontSize: 11, color: C.muted }}>Milestone</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 2, height: 16, background: C.lime, opacity: 0.6 }} />
            <span style={{ fontSize: 11, color: C.muted }}>Today</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Upcoming Milestones - Next 30 Days</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {projects
            .flatMap((p) => p.milestones.map((m) => ({ ...m, project: p.name, client: p.client, clientColor: p.clientColor, status: p.status })))
            .filter((m) => !m.done && dayOffset(m.date) >= 0 && dayOffset(m.date) <= 30)
            .sort((a, b) => dayOffset(a.date) - dayOffset(b.date))
            .map((m, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${m.overdue ? `${C.red}55` : C.border}`, borderRadius: 8, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, background: m.overdue ? C.red : m.clientColor, transform: "rotate(45deg)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: m.clientColor }}>
                      {m.project} - {m.client}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "DM Mono, monospace", color: m.overdue ? C.red : dayOffset(m.date) <= 7 ? C.amber : C.muted }}>{m.date}</div>
                  <div style={{ fontSize: 10, color: m.overdue ? C.red : C.muted }}>{m.overdue ? "OVERDUE" : `in ${dayOffset(m.date)}d`}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
