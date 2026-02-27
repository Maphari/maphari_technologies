"use client";

import { useState } from "react";
import { AdminFilterBar, AdminTabs } from "./shared";

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

type ProjectStatus = "on-track" | "at-risk" | "off-track" | "complete";
type Tab = "board" | "list" | "health map";
type StatusFilter = "All" | "on-track" | "at-risk" | "off-track";

const projects: Array<{
  id: string;
  client: string;
  clientColor: string;
  clientAvatar: string;
  name: string;
  type: string;
  status: ProjectStatus;
  phase: string;
  completion: number;
  owner: string;
  ownerAvatar: string;
  startDate: string;
  dueDate: string;
  daysLeft: number;
  budget: number;
  spent: number;
  spentPct: number;
  blockers: string[];
  tasksTotal: number;
  tasksDone: number;
  tasksOverdue: number;
  health: number;
  lastUpdate: string;
}> = [
  {
    id: "PRJ-001",
    client: "Volta Studios",
    clientColor: C.lime,
    clientAvatar: "VS",
    name: "Brand Identity System",
    type: "Retainer",
    status: "on-track",
    phase: "Execution",
    completion: 68,
    owner: "Renzo Fabbri",
    ownerAvatar: "RF",
    startDate: "Jan 6",
    dueDate: "Mar 28",
    daysLeft: 33,
    budget: 22000,
    spent: 14800,
    spentPct: 67,
    blockers: [],
    tasksTotal: 42,
    tasksDone: 28,
    tasksOverdue: 0,
    health: 91,
    lastUpdate: "Feb 22",
  },
  {
    id: "PRJ-002",
    client: "Kestrel Capital",
    clientColor: C.purple,
    clientAvatar: "KC",
    name: "Q1 Campaign Strategy",
    type: "Project",
    status: "at-risk",
    phase: "Review",
    completion: 54,
    owner: "Nomsa Dlamini",
    ownerAvatar: "ND",
    startDate: "Jan 20",
    dueDate: "Feb 28",
    daysLeft: 5,
    budget: 42000,
    spent: 38200,
    spentPct: 91,
    blockers: ["Client hasn't approved campaign brief", "Invoice overdue blocking AM attention"],
    tasksTotal: 31,
    tasksDone: 17,
    tasksOverdue: 4,
    health: 44,
    lastUpdate: "Feb 20",
  },
  {
    id: "PRJ-003",
    client: "Mira Health",
    clientColor: C.blue,
    clientAvatar: "MH",
    name: "Website Redesign",
    type: "Project",
    status: "on-track",
    phase: "Design",
    completion: 40,
    owner: "Kira Bosman",
    ownerAvatar: "KB",
    startDate: "Feb 3",
    dueDate: "Apr 18",
    daysLeft: 54,
    budget: 42000,
    spent: 16400,
    spentPct: 39,
    blockers: ["Wireframe approval pending 4 days"],
    tasksTotal: 58,
    tasksDone: 23,
    tasksOverdue: 1,
    health: 74,
    lastUpdate: "Feb 21",
  },
  {
    id: "PRJ-004",
    client: "Dune Collective",
    clientColor: C.amber,
    clientAvatar: "DC",
    name: "Editorial Design System",
    type: "Retainer",
    status: "off-track",
    phase: "Execution",
    completion: 29,
    owner: "Renzo Fabbri",
    ownerAvatar: "RF",
    startDate: "Dec 1",
    dueDate: "Mar 1",
    daysLeft: 6,
    budget: 48000,
    spent: 51200,
    spentPct: 107,
    blockers: ["Scope creep - 3 unapproved revisions", "Budget exceeded by 7%", "Client communication breakdown"],
    tasksTotal: 44,
    tasksDone: 13,
    tasksOverdue: 7,
    health: 31,
    lastUpdate: "Feb 19",
  },
  {
    id: "PRJ-005",
    client: "Okafor & Sons",
    clientColor: C.orange,
    clientAvatar: "OS",
    name: "Annual Report 2025",
    type: "Project",
    status: "on-track",
    phase: "Final Review",
    completion: 88,
    owner: "Tapiwa Moyo",
    ownerAvatar: "TM",
    startDate: "Jan 13",
    dueDate: "Mar 7",
    daysLeft: 12,
    budget: 12000,
    spent: 10100,
    spentPct: 84,
    blockers: [],
    tasksTotal: 24,
    tasksDone: 21,
    tasksOverdue: 0,
    health: 96,
    lastUpdate: "Feb 23",
  },
];

const statusConfig: Record<ProjectStatus, { color: string; label: string; bg: string }> = {
  "on-track": { color: C.lime, label: "On Track", bg: `${C.lime}15` },
  "at-risk": { color: C.amber, label: "At Risk", bg: `${C.amber}15` },
  "off-track": { color: C.red, label: "Off Track", bg: `${C.red}15` },
  complete: { color: C.blue, label: "Complete", bg: `${C.blue}15` },
};

const phases = ["Discovery", "Strategy", "Design", "Execution", "Review", "Final Review", "Complete"];

function Avatar({ initials, color, size = 30 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}22`,
        border: `2px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.32,
        fontWeight: 700,
        color,
        fontFamily: "DM Mono, monospace",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

const tabs: Tab[] = ["board", "list", "health map"];

export function ProjectPortfolioPage() {
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filterStatus === "All" ? projects : projects.filter((p) => p.status === filterStatus);
  const atRisk = projects.filter((p) => p.status === "at-risk" || p.status === "off-track").length;
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const avgCompletion = Math.round(projects.reduce((s, p) => s + p.completion, 0) / projects.length);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / OPERATIONS</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Project Portfolio</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>All active projects - Status - Budget - Blockers</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Export</button>
          <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ New Project</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Active Projects", value: projects.length.toString(), color: C.lime, sub: "Across 5 clients" },
          { label: "Projects At Risk", value: atRisk.toString(), color: atRisk > 0 ? C.red : C.lime, sub: "Need attention" },
          { label: "Avg Completion", value: `${avgCompletion}%`, color: C.blue, sub: "Portfolio progress" },
          { label: "Budget Utilisation", value: `${Math.round((totalSpent / totalBudget) * 100)}%`, color: C.amber, sub: `R${(totalSpent / 1000).toFixed(0)}k of R${(totalBudget / 1000).toFixed(0)}k` },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${s.label === "Projects At Risk" && atRisk > 0 ? `${C.red}55` : C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {projects.some((p) => p.blockers.length > 0) && (
        <div style={{ background: C.surface, border: `1px solid ${C.red}44`, borderRadius: 10, padding: 16, marginBottom: 24, display: "flex", gap: 16, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🚧</span>
          <div>
            <div style={{ fontWeight: 700, color: C.red, marginBottom: 6 }}>Active Blockers</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {projects
                .filter((p) => p.blockers.length > 0)
                .map((p) =>
                  p.blockers.map((b, i) => (
                    <div key={`${p.id}-${i}`} style={{ fontSize: 12, color: C.muted }}>
                      <span style={{ color: p.clientColor, fontWeight: 600 }}>{p.client}</span> - {b}
                    </div>
                  ))
                )}
            </div>
          </div>
        </div>
      )}

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor={C.lime}
        mutedColor={C.muted}
        panelColor={C.surface}
        borderColor={C.border}
      />
      <AdminFilterBar panelColor={C.surface} borderColor={C.border}>
        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "DM Mono, monospace" }}>Filters</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            <option value="All">Status: All</option>
            <option value="on-track">Status: On Track</option>
            <option value="at-risk">Status: At Risk</option>
            <option value="off-track">Status: Off Track</option>
          </select>
          {filterStatus !== "All" ? (
            <button onClick={() => setFilterStatus("All")} style={{ background: C.border, border: "none", color: C.text, padding: "8px 10px", fontSize: 11, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Clear</button>
          ) : null}
        </div>
      </AdminFilterBar>

      {activeTab === "board" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((p) => {
            const sc = statusConfig[p.status];
            const isExpanded = expanded === p.id;
            return (
              <div key={p.id} style={{ background: C.surface, border: `1px solid ${p.status !== "on-track" ? `${sc.color}55` : C.border}`, borderRadius: 12 }}>
                <div style={{ padding: 24, cursor: "pointer" }} onClick={() => setExpanded(isExpanded ? null : p.id)}>
                  <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 140px 120px 80px 80px auto", alignItems: "center", gap: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar initials={p.clientAvatar} color={p.clientColor} size={36} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: p.clientColor }}>
                          {p.client} - {p.type}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: C.muted }}>{p.phase}</span>
                        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: p.completion >= 75 ? C.lime : p.completion >= 40 ? C.blue : C.muted }}>{p.completion}%</span>
                      </div>
                      <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${p.completion}%`, background: p.status === "off-track" ? C.red : p.status === "at-risk" ? C.amber : C.lime, borderRadius: 3, transition: "width 0.8s" }} />
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                        {p.tasksDone}/{p.tasksTotal} tasks{p.tasksOverdue > 0 ? <span style={{ color: C.red }}> - {p.tasksOverdue} overdue</span> : null}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Budget</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: p.spentPct > 100 ? C.red : p.spentPct > 85 ? C.amber : C.lime, fontWeight: 700 }}>{p.spentPct}%</div>
                      <div style={{ fontSize: 10, color: C.muted }}>
                        R{(p.spent / 1000).toFixed(0)}k / R{(p.budget / 1000).toFixed(0)}k
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Due</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: p.daysLeft <= 7 ? C.red : p.daysLeft <= 21 ? C.amber : C.muted }}>{p.dueDate}</div>
                      <div style={{ fontSize: 10, color: p.daysLeft <= 7 ? C.red : C.muted }}>{p.daysLeft}d left</div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <Avatar initials={p.ownerAvatar} color={C.muted} size={28} />
                      <div style={{ fontSize: 9, color: C.muted, textAlign: "center" }}>{p.owner.split(" ")[0]}</div>
                    </div>

                    <span style={{ fontSize: 10, color: sc.color, background: sc.bg, padding: "4px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace", textAlign: "center" }}>{sc.label}</span>

                    {p.blockers.length > 0 ? (
                      <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}44`, borderRadius: 6, padding: "4px 10px", fontSize: 11, color: C.red, textAlign: "center" }}>🚧 {p.blockers.length}</div>
                    ) : (
                      <div style={{ fontSize: 11, color: C.lime, textAlign: "center" }}>✓ Clear</div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${C.border}` }}>
                    <div style={{ paddingTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Phase Progress</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {phases.map((phase, i) => {
                            const phaseIndex = phases.indexOf(p.phase);
                            const isDone = i < phaseIndex;
                            const isCurrent = i === phaseIndex;
                            return (
                              <div key={phase} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: isDone ? C.lime : isCurrent ? sc.color : C.border, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: isDone ? C.lime : isCurrent ? sc.color : C.muted, fontWeight: isCurrent ? 700 : 400 }}>{phase}</span>
                                {isCurrent ? <span style={{ fontSize: 10, color: sc.color }}>(current)</span> : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Blockers</div>
                        {p.blockers.length === 0
                          ? <div style={{ fontSize: 12, color: C.lime }}>✓ No active blockers</div>
                          : p.blockers.map((b, i) => (
                              <div key={i} style={{ padding: 10, background: C.surface, borderRadius: 6, fontSize: 12, color: C.text, borderLeft: `3px solid ${C.red}`, marginBottom: 8 }}>
                                {b}
                              </div>
                            ))}
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Quick Actions</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <button style={{ background: C.border, border: "none", color: C.text, padding: "8px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", textAlign: "left" }}>📋 View Full Project →</button>
                          <button style={{ background: C.border, border: "none", color: C.text, padding: "8px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", textAlign: "left" }}>💬 Message Client →</button>
                          <button style={{ background: C.border, border: "none", color: C.text, padding: "8px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", textAlign: "left" }}>📊 Open Reports →</button>
                          {p.blockers.length > 0 ? <button style={{ background: `${C.red}15`, border: `1px solid ${C.red}44`, color: C.red, padding: "8px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", textAlign: "left" }}>🚨 Log Escalation →</button> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "list" && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 80px 100px 80px 80px 80px 80px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {["ID", "Project", "Client", "Phase", "Progress", "Budget", "Due", "Status", "Health"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {filtered.map((p, i) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 80px 100px 80px 80px 80px 80px", padding: "14px 24px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{p.id}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar initials={p.clientAvatar} color={p.clientColor} size={22} />
                <span style={{ fontSize: 12, color: p.clientColor }}>{p.client}</span>
              </div>
              <span style={{ fontSize: 11, color: C.muted }}>{p.phase}</span>
              <div>
                <div style={{ height: 5, background: C.border, borderRadius: 3, marginBottom: 3 }}>
                  <div style={{ height: "100%", width: `${p.completion}%`, background: p.status === "off-track" ? C.red : C.lime, borderRadius: 3 }} />
                </div>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{p.completion}%</span>
              </div>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: p.spentPct > 100 ? C.red : p.spentPct > 85 ? C.amber : C.lime }}>{p.spentPct}%</span>
              <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: p.daysLeft <= 7 ? C.red : C.muted }}>{p.daysLeft}d</span>
              <span style={{ fontSize: 10, color: statusConfig[p.status].color, background: statusConfig[p.status].bg, padding: "2px 6px", borderRadius: 4 }}>{statusConfig[p.status].label}</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: p.health >= 80 ? C.lime : p.health >= 60 ? C.amber : C.red }}>{p.health}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "health map" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {filtered.map((p) => {
            const sc = statusConfig[p.status];
            return (
              <div key={p.id} style={{ background: C.surface, border: `2px solid ${sc.color}44`, borderRadius: 12, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Avatar initials={p.clientAvatar} color={p.clientColor} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: p.clientColor }}>{p.client}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: p.health >= 80 ? C.lime : p.health >= 60 ? C.amber : C.red, fontFamily: "DM Mono, monospace" }}>{p.health}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>Health Score</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {[
                    { label: "Progress", value: `${p.completion}%`, color: p.completion >= 70 ? C.lime : C.amber },
                    { label: "Budget", value: `${p.spentPct}%`, color: p.spentPct > 100 ? C.red : p.spentPct > 85 ? C.amber : C.lime },
                    { label: "Tasks Done", value: `${p.tasksDone}/${p.tasksTotal}`, color: C.blue },
                    { label: "Blockers", value: p.blockers.length.toString(), color: p.blockers.length > 0 ? C.red : C.lime },
                  ].map((m) => (
                    <div key={m.label} style={{ padding: 10, background: C.bg, borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 16, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
