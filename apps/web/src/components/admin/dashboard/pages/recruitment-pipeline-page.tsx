"use client";

import { useMemo, useState } from "react";
import { AdminTabs } from "./shared";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  primary: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

type Candidate = {
  name: string;
  stage: string;
  score: number;
  source: string;
  flag: string | null;
};

type Role = {
  id: string;
  title: string;
  department: string;
  priority: "high" | "medium" | "low";
  status: "active" | "on-hold" | "filled" | "closed";
  postedDate: string;
  targetDate: string;
  hiringManager: string;
  salaryBand: string;
  applications: number;
  interviewed: number;
  offered: number;
  candidates: Candidate[];
};

const roles: Role[] = [
  {
    id: "REC-003", title: "Senior Brand Designer", department: "Creative", priority: "high",
    status: "active", postedDate: "Feb 5", targetDate: "Mar 15", hiringManager: "Renzo Fabbri",
    salaryBand: "R38k-R46k", applications: 14, interviewed: 4, offered: 0,
    candidates: [
      { name: "Amara Osei", stage: "2nd Interview", score: 88, source: "LinkedIn", flag: null },
      { name: "James Liu", stage: "2nd Interview", score: 81, source: "Referral", flag: null },
      { name: "Priya Sharma", stage: "1st Interview", score: 74, source: "Pnet", flag: "Portfolio weak" },
      { name: "Ben Kruger", stage: "Offer", score: 91, source: "Referral", flag: null }
    ]
  },
  {
    id: "REC-002", title: "Junior Copywriter", department: "Content", priority: "medium",
    status: "active", postedDate: "Jan 22", targetDate: "Mar 1", hiringManager: "Tapiwa Moyo",
    salaryBand: "R18k-R24k", applications: 31, interviewed: 6, offered: 1,
    candidates: [
      { name: "Zoe Hendricks", stage: "Offer Accepted", score: 84, source: "LinkedIn", flag: null },
      { name: "Sipho Zulu", stage: "Offer Declined", score: 79, source: "CareerJet", flag: "Accepted competitor offer" }
    ]
  },
  {
    id: "REC-001", title: "Motion Designer", department: "Creative", priority: "low",
    status: "on-hold", postedDate: "Dec 10", targetDate: "Apr 30", hiringManager: "Renzo Fabbri",
    salaryBand: "R28k-R36k", applications: 8, interviewed: 2, offered: 0,
    candidates: [
      { name: "Lara Venter", stage: "Screen", score: 68, source: "Portfolio site", flag: null },
      { name: "Kwame Asante", stage: "Screen", score: 72, source: "LinkedIn", flag: null }
    ]
  }
];

const stages = ["Applied", "Screen", "1st Interview", "2nd Interview", "Offer", "Offer Accepted", "Offer Declined"] as const;

const stageColors: Record<string, string> = {
  Applied: C.muted,
  Screen: C.blue,
  "1st Interview": C.primary,
  "2nd Interview": C.amber,
  Offer: C.orange,
  "Offer Accepted": C.primary,
  "Offer Declined": C.red
};

const priorityConfig = {
  high: { color: C.red, label: "High" },
  medium: { color: C.amber, label: "Medium" },
  low: { color: C.muted, label: "Low" }
} as const;

const statusConfig = {
  active: { color: C.primary, label: "Active" },
  "on-hold": { color: C.amber, label: "On Hold" },
  filled: { color: C.blue, label: "Filled" },
  closed: { color: C.muted, label: "Closed" }
} as const;

const tabs = ["pipeline", "kanban", "candidates", "analytics"] as const;
type Tab = (typeof tabs)[number];

export function RecruitmentPipelinePage() {
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");
  const [expanded, setExpanded] = useState<string>("REC-003");

  const totalActive = roles.filter((r) => r.status === "active").length;
  const totalApplications = roles.reduce((s, r) => s + r.applications, 0);
  const totalInterviewed = roles.reduce((s, r) => s + r.interviewed, 0);
  const conversionRate = Math.round((totalInterviewed / Math.max(totalApplications, 1)) * 100);

  const candidatesFlat = useMemo(
    () => roles.flatMap((r) => r.candidates.map((c) => ({ ...c, roleName: r.title, roleId: r.id }))),
    []
  );

  return (
    <div
      style={{
        background: C.bg,
        height: "100%",
        fontFamily: "Syne, sans-serif",
        color: C.text,
        padding: 0,
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "auto auto auto 1fr",
        minHeight: 0
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / STAFF</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Recruitment Pipeline</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Open roles, candidates, interview stages, and offer tracking</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>
          + Open Role
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Open Roles", value: totalActive.toString(), color: C.primary, sub: `${roles.filter((r) => r.status === "on-hold").length} on hold` },
          { label: "Total Applications", value: totalApplications.toString(), color: C.blue, sub: "Across all roles" },
          { label: "Interview Conversion", value: `${conversionRate}%`, color: C.primary, sub: `${totalInterviewed} interviewed` },
          { label: "Offers Outstanding", value: roles.flatMap((r) => r.candidates.filter((c) => c.stage === "Offer")).length.toString(), color: C.amber, sub: "Awaiting candidate response" }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor={C.primary}
        mutedColor={C.muted}
        panelColor={C.surface}
        borderColor={C.border}
      />

      <div style={{ overflow: "auto", minHeight: 0 }}>
        {activeTab === "pipeline" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {roles.map((role) => {
              const sc = statusConfig[role.status];
              const pc = priorityConfig[role.priority];
              const isExp = expanded === role.id;
              return (
                <div key={role.id} style={{ background: C.surface, border: `1px solid ${role.priority === "high" ? C.red + "33" : C.border}` }}>
                  <div style={{ padding: 24, cursor: "pointer" }} onClick={() => setExpanded(isExp ? "" : role.id)}>
                    <div style={{ display: "grid", gridTemplateColumns: "260px 120px 100px 80px 80px 80px 100px auto", alignItems: "center", gap: 16 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{role.title}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{role.department} · {role.hiringManager} · {role.salaryBand}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Posted</div>
                        <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11 }}>{role.postedDate}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Applied</div>
                        <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.blue, fontSize: 18 }}>{role.applications}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Interviewed</div>
                        <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.primary }}>{role.interviewed}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Offered</div>
                        <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.amber }}>{role.offered}</div>
                      </div>
                      <span style={{ fontSize: 10, color: pc.color, background: `${pc.color}15`, padding: "3px 8px", textAlign: "center", fontFamily: "DM Mono, monospace" }}>{pc.label}</span>
                      <span style={{ fontSize: 10, color: sc.color, background: `${sc.color}15`, padding: "3px 8px", textAlign: "center", fontFamily: "DM Mono, monospace" }}>{sc.label}</span>
                      <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>{isExp ? "▲" : "▼"}</button>
                    </div>
                  </div>

                  {isExp ? (
                    <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${C.border}` }}>
                      <div style={{ paddingTop: 20 }}>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Candidate Shortlist</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {role.candidates.map((c, i) => (
                            <div key={i} style={{ padding: 14, background: C.bg, display: "grid", gridTemplateColumns: "1fr 160px 80px 130px auto", alignItems: "center", gap: 12 }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                                <div style={{ fontSize: 10, color: C.muted }}>Source: {c.source}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Stage</div>
                                <span style={{ fontSize: 10, color: stageColors[c.stage], background: `${stageColors[c.stage]}15`, padding: "2px 8px", fontFamily: "DM Mono, monospace" }}>{c.stage}</span>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Score</div>
                                <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: c.score >= 85 ? C.primary : c.score >= 70 ? C.amber : C.muted }}>{c.score}</div>
                              </div>
                              {c.flag ? <div style={{ fontSize: 10, color: C.red, background: `${C.red}10`, padding: "4px 8px" }}>⚑ {c.flag}</div> : <div />}
                              <div style={{ display: "flex", gap: 6 }}>
                                <button style={{ background: C.primary, color: C.bg, border: "none", padding: "5px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Advance</button>
                                <button style={{ background: C.border, border: "none", color: C.text, padding: "5px 8px", fontSize: 10, cursor: "pointer" }}>Notes</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "kanban" ? (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {stages.map((stage) => {
              const stageCandidates = roles.flatMap((r) =>
                r.candidates
                  .filter((c) => c.stage === stage)
                  .map((c) => ({ ...c, role: r.title }))
              );
              const stageColor = stageColors[stage];
              return (
                <div key={stage} style={{ minWidth: 220, background: C.surface, border: `1px solid ${C.border}`, padding: 16, flexShrink: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: stageColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stage}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: stageColor, background: `${stageColor}15`, padding: "2px 8px" }}>{stageCandidates.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {stageCandidates.map((c, i) => (
                      <div key={i} style={{ padding: 12, background: C.bg, borderLeft: `3px solid ${stageColor}` }}>
                        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>{c.role}</div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 10, color: C.muted }}>{c.source}</span>
                          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.score >= 85 ? C.primary : c.score >= 70 ? C.amber : C.muted, fontWeight: 700 }}>{c.score}</span>
                        </div>
                        {c.flag ? <div style={{ fontSize: 9, color: C.red, marginTop: 4 }}>⚑ {c.flag}</div> : null}
                      </div>
                    ))}
                    {stageCandidates.length === 0 ? <div style={{ fontSize: 11, color: C.muted, textAlign: "center", padding: 12 }}>Empty</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "candidates" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 120px 150px 80px 60px auto", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", gap: 16 }}>
              {["Candidate", "Role", "Source", "Stage", "Score", "Flag", ""].map((h) => <span key={h}>{h}</span>)}
            </div>
            {candidatesFlat.map((c, i) => (
              <div key={`${c.roleId}-${c.name}`} style={{ display: "grid", gridTemplateColumns: "1fr 180px 120px 150px 80px 60px auto", padding: "13px 24px", borderBottom: i < candidatesFlat.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{c.roleName}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{c.source}</span>
                <span style={{ fontSize: 10, color: stageColors[c.stage], background: `${stageColors[c.stage]}15`, padding: "3px 8px", fontFamily: "DM Mono, monospace" }}>{c.stage}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: c.score >= 85 ? C.primary : c.score >= 70 ? C.amber : C.muted }}>{c.score}</span>
                <span style={{ fontSize: 12, color: c.flag ? C.red : C.muted }}>{c.flag ? "⚑" : "-"}</span>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "4px 10px", fontSize: 10, cursor: "pointer" }}>View</button>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "analytics" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Application Sources</div>
              {[
                { source: "LinkedIn", count: roles.flatMap((r) => r.candidates.filter((c) => c.source === "LinkedIn")).length, color: C.blue },
                { source: "Referral", count: roles.flatMap((r) => r.candidates.filter((c) => c.source === "Referral")).length, color: C.primary },
                { source: "Pnet", count: roles.flatMap((r) => r.candidates.filter((c) => c.source === "Pnet")).length, color: C.primary },
                { source: "Portfolio site", count: roles.flatMap((r) => r.candidates.filter((c) => c.source === "Portfolio site")).length, color: C.orange },
                { source: "CareerJet", count: roles.flatMap((r) => r.candidates.filter((c) => c.source === "CareerJet")).length, color: C.muted }
              ].map((s) => (
                <div key={s.source} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, flex: 1 }}>{s.source}</span>
                  <div style={{ width: 80, height: 8, background: C.border }}>
                    <div style={{ height: "100%", width: `${(s.count / 8) * 100}%`, background: s.color }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: s.color, fontWeight: 700, width: 20 }}>{s.count}</span>
                </div>
              ))}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recruitment Funnel</div>
              {[
                { stage: "Applications", count: totalApplications, color: C.muted },
                { stage: "Screened", count: 18, color: C.blue },
                { stage: "Interviewed", count: totalInterviewed, color: C.primary },
                { stage: "Offered", count: 2, color: C.amber },
                { stage: "Accepted", count: 1, color: C.primary }
              ].map((f) => (
                <div key={f.stage} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, flex: 1 }}>{f.stage}</span>
                  <div style={{ width: 120, height: 10, background: C.border }}>
                    <div style={{ height: "100%", width: `${(f.count / Math.max(totalApplications, 1)) * 100}%`, background: f.color }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: f.color, fontWeight: 700, width: 28, textAlign: "right" }}>{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
