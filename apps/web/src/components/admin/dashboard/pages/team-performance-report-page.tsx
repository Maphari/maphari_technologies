"use client";

import { useState } from "react";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  lime: "#c8f135",
  primary: "#a78bfa",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

type StaffMember = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  utilisation: number;
  billableHours: number;
  targetHours: number;
  performanceScore: number | null;
  tasksCompleted: number;
  tasksOverdue: number;
  clientSatisfaction: number | null;
  revContribution: number | null;
  ldHours: number;
  sickDays: number;
  utilisationHistory: number[];
  strengths: string[];
  devAreas: string[];
};

const staff: StaffMember[] = [
  { id: "EMP-001", name: "Sipho Nkosi", role: "Founder & CEO", avatar: "SN", color: C.lime, utilisation: 72, billableHours: 86, targetHours: 120, performanceScore: null, tasksCompleted: 24, tasksOverdue: 1, clientSatisfaction: 9.2, revContribution: 380600, ldHours: 20, sickDays: 0, utilisationHistory: [68, 70, 72, 74, 71, 72], strengths: ["Strategic vision", "Client relationships", "Revenue growth"], devAreas: ["Delegation", "Process documentation"] },
  { id: "EMP-002", name: "Leilani Fotu", role: "Head of Operations", avatar: "LF", color: C.blue, utilisation: 89, billableHours: 148, targetHours: 168, performanceScore: 4.2, tasksCompleted: 62, tasksOverdue: 3, clientSatisfaction: null, revContribution: null, ldHours: 46, sickDays: 2, utilisationHistory: [82, 85, 87, 90, 88, 89], strengths: ["Process management", "Asana discipline", "Communication"], devAreas: ["Financial reporting ownership", "Hiring experience"] },
  { id: "EMP-003", name: "Renzo Fabbri", role: "Creative Director", avatar: "RF", color: C.orange, utilisation: 94, billableHours: 158, targetHours: 168, performanceScore: 4.6, tasksCompleted: 78, tasksOverdue: 2, clientSatisfaction: 8.4, revContribution: 65600, ldHours: 42, sickDays: 4, utilisationHistory: [88, 90, 92, 96, 93, 94], strengths: ["Creative quality", "Client trust", "Team mentoring"], devAreas: ["Scope management", "Freelancer briefing quality"] },
  { id: "EMP-004", name: "Nomsa Dlamini", role: "Account Manager", avatar: "ND", color: C.purple, utilisation: 78, billableHours: 131, targetHours: 168, performanceScore: 3.9, tasksCompleted: 44, tasksOverdue: 6, clientSatisfaction: 7.1, revContribution: 286600, ldHours: 0, sickDays: 0, utilisationHistory: [74, 75, 77, 80, 76, 78], strengths: ["Client responsiveness", "Relationship warmth"], devAreas: ["Escalation handling", "Communication clarity", "L&D engagement"] },
  { id: "EMP-005", name: "Kira Bosman", role: "UX Designer", avatar: "KB", color: C.amber, utilisation: 88, billableHours: 148, targetHours: 168, performanceScore: 4.4, tasksCompleted: 56, tasksOverdue: 1, clientSatisfaction: 8.1, revContribution: 43200, ldHours: 14, sickDays: 1, utilisationHistory: [80, 83, 86, 89, 87, 88], strengths: ["Figma craft", "Research quality", "Iteration speed"], devAreas: ["UX writing", "Stakeholder presentation skills"] },
  { id: "EMP-006", name: "Tapiwa Moyo", role: "Copywriter", avatar: "TM", color: C.blue, utilisation: 64, billableHours: 107, targetHours: 168, performanceScore: 3.7, tasksCompleted: 38, tasksOverdue: 4, clientSatisfaction: 7.8, revContribution: 28000, ldHours: 0, sickDays: 0, utilisationHistory: [58, 60, 62, 66, 63, 64], strengths: ["Brand voice", "Speed of first drafts"], devAreas: ["Output volume", "Brief interpretation", "L&D investment"] }
];

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

const tabs = ["team overview", "individual profiles", "utilisation", "tasks & output"] as const;
type Tab = (typeof tabs)[number];

export function TeamPerformanceReportPage() {
  const [activeTab, setActiveTab] = useState<Tab>("team overview");
  const [selected, setSelected] = useState<StaffMember>(staff[2]);

  const avgUtil = Math.round(staff.reduce((s, m) => s + m.utilisation, 0) / staff.length);
  const totalOverdue = staff.reduce((s, m) => s + m.tasksOverdue, 0);
  const avgPerf = (
    staff.filter((m) => m.performanceScore !== null).reduce((s, m) => s + (m.performanceScore ?? 0), 0) /
    staff.filter((m) => m.performanceScore !== null).length
  ).toFixed(1);
  const lowUtil = staff.filter((m) => m.utilisation < 70).length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / REPORTING & INTELLIGENCE</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Team Performance Report</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Utilisation · Output · Scores · Development · Feb 2026</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Export Report</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Avg Utilisation", value: `${avgUtil}%`, color: avgUtil >= 80 ? C.lime : C.amber, sub: "Target: 80%" },
          { label: "Avg Performance Score", value: `${avgPerf}/5`, color: Number.parseFloat(avgPerf) >= 4 ? C.lime : C.amber, sub: "Scored staff only" },
          { label: "Overdue Tasks (Feb)", value: totalOverdue.toString(), color: totalOverdue > 5 ? C.red : C.amber, sub: "Across all staff" },
          { label: "Low Utilisation Staff", value: lowUtil.toString(), color: lowUtil > 0 ? C.amber : C.lime, sub: "Below 70%" }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === t ? C.primary : C.muted,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: `2px solid ${activeTab === t ? C.primary : "transparent"}`,
              marginBottom: -1
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "team overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...staff].sort((a, b) => b.utilisation - a.utilisation).map((member) => {
            const utilColor = member.utilisation >= 85 ? C.lime : member.utilisation >= 70 ? C.blue : member.utilisation >= 60 ? C.amber : C.red;
            const perfColor = member.performanceScore ? (member.performanceScore >= 4.5 ? C.lime : member.performanceScore >= 3.5 ? C.blue : C.amber) : C.muted;
            return (
              <div key={member.id} onClick={() => { setSelected(member); setActiveTab("individual profiles"); }} style={{ background: C.surface, border: `1px solid ${member.utilisation < 70 ? C.amber + "44" : C.border}`, borderRadius: 10, padding: 20, display: "grid", gridTemplateColumns: "220px 1fr 80px 80px 80px 80px 80px auto", alignItems: "center", gap: 16, cursor: "pointer" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Avatar initials={member.avatar} color={member.color} size={30} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{member.name.split(" ")[0]}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{member.role}</div>
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: C.muted }}>{member.billableHours}h / {member.targetHours}h</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: utilColor, fontWeight: 700 }}>{member.utilisation}%</span>
                  </div>
                  <div style={{ height: 6, background: C.border, borderRadius: 3 }}><div style={{ height: "100%", width: `${member.utilisation}%`, background: utilColor, borderRadius: 3 }} /></div>
                </div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: C.muted }}>Score</div><div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: perfColor }}>{member.performanceScore ? `${member.performanceScore}` : "—"}</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: C.muted }}>Done</div><div style={{ fontFamily: "DM Mono, monospace", color: C.lime }}>{member.tasksCompleted}</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: C.muted }}>Overdue</div><div style={{ fontFamily: "DM Mono, monospace", color: member.tasksOverdue > 3 ? C.red : member.tasksOverdue > 0 ? C.amber : C.lime }}>{member.tasksOverdue}</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: C.muted }}>L&D Hrs</div><div style={{ fontFamily: "DM Mono, monospace", color: member.ldHours === 0 ? C.red : C.blue }}>{member.ldHours}h</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: C.muted }}>Sick Days</div><div style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{member.sickDays}</div></div>
                <span style={{ color: C.muted, fontSize: 12 }}>▶</span>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "individual profiles" && (
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {staff.map((m) => (
              <div key={m.id} onClick={() => setSelected(m)} style={{ padding: "12px 16px", background: selected.id === m.id ? `${m.color}15` : C.surface, border: `1px solid ${selected.id === m.id ? m.color + "55" : C.border}`, borderRadius: 8, cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}>
                <Avatar initials={m.avatar} color={m.color} size={24} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: selected.id === m.id ? m.color : C.text }}>{m.name.split(" ")[0]}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: m.utilisation >= 80 ? C.lime : C.amber }}>{m.utilisation}%</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${selected.color}33`, borderRadius: 12, padding: 28 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 28 }}>
              <Avatar initials={selected.avatar} color={selected.color} size={52} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 22 }}>{selected.name}</div>
                <div style={{ color: selected.color, fontSize: 14 }}>{selected.role}</div>
              </div>
              {selected.performanceScore && (
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 36, color: selected.performanceScore >= 4 ? C.lime : C.amber }}>{selected.performanceScore}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Performance / 5</div>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Utilisation", value: `${selected.utilisation}%`, color: selected.utilisation >= 80 ? C.lime : C.amber },
                { label: "Billable Hours", value: `${selected.billableHours}h`, color: C.blue },
                { label: "Tasks Completed", value: selected.tasksCompleted.toString(), color: C.lime },
                { label: "Tasks Overdue", value: selected.tasksOverdue.toString(), color: selected.tasksOverdue > 0 ? C.red : C.lime },
                { label: "L&D Hours", value: `${selected.ldHours}h`, color: selected.ldHours === 0 ? C.red : C.blue },
                { label: "Client Satisfaction", value: selected.clientSatisfaction ? `${selected.clientSatisfaction}/10` : "N/A", color: selected.clientSatisfaction ? (selected.clientSatisfaction >= 8 ? C.lime : C.amber) : C.muted }
              ].map((m) => (
                <div key={m.label} style={{ padding: 14, background: C.bg, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 22, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Utilisation Trend (6mo)</div>
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60 }}>
                {selected.utilisationHistory.map((v, i) => {
                  const isLast = i === selected.utilisationHistory.length - 1;
                  const color = v >= 85 ? C.lime : v >= 70 ? C.blue : C.amber;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ height: (v / 100) * 60, background: isLast ? color : `${color}55`, borderRadius: "3px 3px 0 0", width: "100%" }} />
                      <span style={{ fontSize: 9, color: C.muted }}>{months[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{ padding: 16, background: `${C.lime}08`, border: `1px solid ${C.lime}22`, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: C.lime, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>✦ Strengths</div>
                {selected.strengths.map((s, i) => (<div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12 }}><span style={{ color: C.lime }}>·</span><span>{s}</span></div>))}
              </div>
              <div style={{ padding: 16, background: `${C.amber}08`, border: `1px solid ${C.amber}22`, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: C.amber, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>↑ Development Areas</div>
                {selected.devAreas.map((d, i) => (<div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12 }}><span style={{ color: C.amber }}>·</span><span>{d}</span></div>))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ background: C.primary, color: C.bg, border: "none", padding: "10px 20px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View Full Record</button>
              <button style={{ background: C.border, border: "none", color: C.text, padding: "10px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Schedule Review</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "utilisation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Team Utilisation — Feb 2026</div>
            {[...staff].sort((a, b) => b.utilisation - a.utilisation).map((m) => {
              const color = m.utilisation >= 85 ? C.lime : m.utilisation >= 70 ? C.blue : m.utilisation >= 60 ? C.amber : C.red;
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <Avatar initials={m.avatar} color={m.color} size={26} />
                  <span style={{ fontSize: 12, width: 100 }}>{m.name.split(" ")[0]}</span>
                  <div style={{ flex: 1, height: 16, background: C.border, borderRadius: 4, overflow: "hidden", position: "relative" }}>
                    <div style={{ height: "100%", width: `${m.utilisation}%`, background: color, borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 8 }}>
                      <span style={{ fontSize: 10, color: C.bg, fontWeight: 700 }}>{m.billableHours}h billable</span>
                    </div>
                    <div style={{ position: "absolute", top: 0, bottom: 0, left: "80%", width: 1, background: C.text, opacity: 0.3 }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 16, color, width: 44, textAlign: "right" }}>{m.utilisation}%</span>
                  {m.utilisation < 70 ? <span style={{ fontSize: 9, color: C.red, background: `${C.red}15`, padding: "2px 6px", borderRadius: 4 }}>Low</span> : null}
                </div>
              );
            })}
            <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>Vertical line = 80% target. Total team: {Math.round(staff.reduce((s, m) => s + m.billableHours, 0))}h billable of {staff.reduce((s, m) => s + m.targetHours, 0)}h capacity.</div>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Utilisation Trend — All Staff (6mo)</div>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
              {months.map((month, mi) => {
                const avgU = Math.round(staff.reduce((s, m) => s + m.utilisationHistory[mi], 0) / staff.length);
                const h = (avgU / 100) * 80;
                const isLast = mi === months.length - 1;
                return (
                  <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: isLast ? C.lime : C.muted }}>{avgU}%</span>
                    <div style={{ height: h, background: isLast ? C.lime : `${C.lime}44`, borderRadius: "4px 4px 0 0", width: "100%" }} />
                    <span style={{ fontSize: 9, color: C.muted }}>{month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "tasks & output" && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px 100px 100px 100px 80px 80px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", gap: 16 }}>
            {["Employee", "Completed", "Overdue", "Completion %", "L&D Hrs", "Sick Days"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {[...staff].sort((a, b) => b.tasksCompleted - a.tasksCompleted).map((m, i) => {
            const completionRate = Math.round((m.tasksCompleted / (m.tasksCompleted + m.tasksOverdue)) * 100);
            return (
              <div key={m.id} style={{ display: "grid", gridTemplateColumns: "200px 100px 100px 100px 80px 80px", padding: "14px 24px", borderBottom: i < staff.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Avatar initials={m.avatar} color={m.color} size={26} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{m.name.split(" ")[0]}</div>
                    <div style={{ fontSize: 9, color: C.muted }}>{m.role}</div>
                  </div>
                </div>
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.lime, fontSize: 16 }}>{m.tasksCompleted}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: m.tasksOverdue > 3 ? C.red : m.tasksOverdue > 0 ? C.amber : C.lime }}>{m.tasksOverdue}</span>
                <div>
                  <div style={{ height: 6, background: C.border, borderRadius: 3, marginBottom: 3 }}>
                    <div style={{ height: "100%", width: `${completionRate}%`, background: completionRate >= 90 ? C.lime : C.amber, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: completionRate >= 90 ? C.lime : C.amber }}>{completionRate}%</span>
                </div>
                <span style={{ fontFamily: "DM Mono, monospace", color: m.ldHours === 0 ? C.red : C.blue }}>{m.ldHours}h</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{m.sickDays}d</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
