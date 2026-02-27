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

type Priority = "critical" | "high" | "medium" | "low";

const ownerOKRs = [
  {
    objective: "Scale to R500k MRR",
    keyResults: [
      { kr: "Close 5 new retainers", progress: 60, target: 5, current: 3 },
      { kr: "Upsell 3 existing clients to Growth tier", progress: 33, target: 3, current: 1 },
      { kr: "Zero churn Q1", progress: 100, target: 0, current: 0 },
    ],
  },
  {
    objective: "Build a high-performance team",
    keyResults: [
      { kr: "Hire Senior Designer by Apr 2026", progress: 50, target: 1, current: 0, note: "Interviewing" },
      { kr: "Avg staff delivery score >= 88", progress: 80, target: 88, current: 87.2 },
      { kr: "All staff complete Q1 L&D", progress: 40, target: 5, current: 2 },
    ],
  },
] as const;

const decisions = [
  {
    date: "Feb 22",
    title: "Approved Studio Outpost for Dune Collective scope extension",
    context: "Dune Collective project delayed due to scope creep. Approved additional R18k contractor budget to meet deadline.",
    tags: ["budget", "client"],
    outcome: "pending",
  },
  {
    date: "Feb 18",
    title: "Decided to pause Helios Digital pitch",
    context: "Prospect showed inconsistent buying signals across 4 touchpoints. Marketing team overstretched. Revisit Q3 2026.",
    tags: ["bd", "resourcing"],
    outcome: "implemented",
  },
  {
    date: "Feb 10",
    title: "Invested in Figma Enterprise upgrade",
    context: "Team of 6 regularly hitting file limits. Figma Enterprise solves collaboration issues and adds SSO. Annual cost R31,200.",
    tags: ["tooling", "budget"],
    outcome: "implemented",
  },
  {
    date: "Jan 28",
    title: "Approved Kira Bosman performance review plan",
    context: "Kira's utilisation at 65.5% and task completion rate below threshold. Agreed: bi-weekly 1:1s with Leilani, focused task assignments for 60 days.",
    tags: ["staff", "hr"],
    outcome: "in-progress",
  },
] as const;

const privateNotes: Array<{ client: string; note: string; priority: Priority; date: string }> = [
  {
    client: "Kestrel Capital",
    note: "CEO is under pressure from board. The dispute may be about cash flow, not the invoice itself. Consider offering a 30-day extension quietly before escalating.",
    priority: "high",
    date: "Feb 22",
  },
  {
    client: "Volta Studios",
    note: "Founder mentioned wanting to expand into events. Potential for a new project scope or retainer tier upgrade by mid-year.",
    priority: "medium",
    date: "Feb 15",
  },
  {
    client: "General",
    note: "Need to restructure BD process - currently too reactive. Target 2 proactive outreach per week from March.",
    priority: "medium",
    date: "Feb 10",
  },
];

const focusItems: Array<{ text: string; priority: Priority; done: boolean }> = [
  { text: "Call Kestrel Capital CEO re: invoice", priority: "critical", done: false },
  { text: "Review Kira performance plan with Leilani", priority: "high", done: false },
  { text: "Sign off Senior Designer job spec", priority: "high", done: false },
  { text: "Review Feb P&L with accountant", priority: "medium", done: true },
  { text: "Horizon Media proposal - review before sending", priority: "high", done: false },
];

const priorityColors: Record<Priority, string> = {
  critical: C.red,
  high: C.orange,
  medium: C.amber,
  low: C.muted,
};

const tabs = ["owner dashboard", "personal okrs", "decision journal", "private notes"] as const;
type Tab = (typeof tabs)[number];

export function OwnersWorkspacePage() {
  const [activeTab, setActiveTab] = useState<Tab>("owner dashboard");
  const [todos, setTodos] = useState(focusItems);

  const toggleTodo = (idx: number) => {
    setTodos((prev) => prev.map((t, i) => (i === idx ? { ...t, done: !t.done } : t)));
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / PERSONAL WORKSPACE</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Owner&apos;s Workspace</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Private - Only visible to you</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: C.surface, border: `1px solid ${C.lime}33`, borderRadius: 8 }}>
          <span style={{ fontSize: 14 }}>🔒</span>
          <span style={{ fontSize: 12, color: C.lime, fontFamily: "DM Mono, monospace" }}>Admin-only - Not visible to staff</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === t ? C.lime : C.muted,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: `2px solid ${activeTab === t ? C.lime : "transparent"}`,
              marginBottom: -1,
              transition: "all 0.2s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "owner dashboard" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Today&apos;s Focus - Mon 23 Feb</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {todos.map((item, i) => (
                  <div key={item.text} onClick={() => toggleTodo(i)} style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", opacity: item.done ? 0.5 : 1, padding: "10px 12px", borderRadius: 8, background: item.done ? C.bg : "transparent", border: `1px solid ${item.done ? C.border : "transparent"}`, transition: "all 0.2s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${item.done ? C.lime : priorityColors[item.priority]}`, background: item.done ? C.lime : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{item.done && <span style={{ fontSize: 10, color: C.bg, fontWeight: 800 }}>✓</span>}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, textDecoration: item.done ? "line-through" : "none", color: item.done ? C.muted : C.text }}>{item.text}</div>
                    </div>
                    <span style={{ fontSize: 10, color: priorityColors[item.priority], fontFamily: "DM Mono, monospace", textTransform: "uppercase", flexShrink: 0 }}>{item.priority}</span>
                  </div>
                ))}
                <button style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.muted, fontSize: 12, cursor: "pointer", textAlign: "left" }}>+ Add focus item</button>
              </div>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Business Pulse</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "MRR", value: "R398.6k", sub: "▲ 5.4% MoM", color: C.lime },
                  { label: "Team Util.", value: "81%", sub: "Target: 85%", color: C.amber },
                  { label: "Client Health", value: "74/100", sub: "2 at risk", color: C.amber },
                  { label: "Pipeline", value: "R168k", sub: "5 prospects", color: C.blue },
                  { label: "Overdue Inv.", value: "R21k", sub: "1 invoice", color: C.red },
                  { label: "Runway", value: "3.9mo", sub: "Cash reserves", color: C.purple },
                ].map((s) => (
                  <div key={s.label} style={{ padding: 14, background: C.bg, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 18, color: s.color, marginBottom: 2 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>OKR Snapshot</div>
              {ownerOKRs.map((okr) => {
                const avgProgress = Math.round(okr.keyResults.reduce((s, kr) => s + kr.progress, 0) / okr.keyResults.length);
                return (
                  <div key={okr.objective} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{okr.objective}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: avgProgress >= 75 ? C.lime : avgProgress >= 50 ? C.amber : C.red, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{avgProgress}%</span>
                    </div>
                    <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${avgProgress}%`, background: avgProgress >= 75 ? C.lime : avgProgress >= 50 ? C.amber : C.red, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
              <button style={{ width: "100%", background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer", marginTop: 4 }}>View Full OKRs -&gt;</button>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recent Decisions</div>
              {decisions.slice(0, 2).map((d) => (
                <div key={d.title} style={{ padding: 12, background: C.bg, borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontFamily: "DM Mono, monospace" }}>{d.date}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{d.title}</div>
                </div>
              ))}
              <button style={{ width: "100%", background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer", marginTop: 4 }}>View Decision Journal -&gt;</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "personal okrs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {ownerOKRs.map((okr) => (
            <div key={okr.objective} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: C.lime }}>◎ {okr.objective}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {okr.keyResults.map((kr, i) => (
                  <div key={kr.kr} style={{ padding: 16, background: C.bg, borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        KR{i + 1}: {kr.kr}
                      </span>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {"note" in kr && kr.note ? <span style={{ fontSize: 11, color: C.amber, fontFamily: "DM Mono, monospace" }}>{kr.note}</span> : null}
                        <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: kr.progress >= 75 ? C.lime : kr.progress >= 50 ? C.amber : C.red }}>{kr.progress}%</span>
                      </div>
                    </div>
                    <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
                      <div style={{ height: "100%", width: `${kr.progress}%`, background: kr.progress >= 75 ? C.lime : kr.progress >= 50 ? C.amber : C.red, borderRadius: 4, transition: "width 0.8s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 6, fontFamily: "DM Mono, monospace" }}>
                      Current: {kr.current} / Target: {kr.target}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "decision journal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
            <button style={{ background: C.lime, color: C.bg, border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>+ Log Decision</button>
          </div>
          {decisions.map((d) => (
            <div key={d.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted, marginBottom: 6 }}>{d.date}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{d.title}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {d.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: 10, color: C.blue, background: `${C.blue}15`, padding: "2px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: d.outcome === "implemented" ? C.lime : d.outcome === "in-progress" ? C.amber : C.muted, background: `${d.outcome === "implemented" ? C.lime : d.outcome === "in-progress" ? C.amber : C.muted}15`, padding: "3px 10px", borderRadius: 4, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>{d.outcome}</span>
              </div>
              <div style={{ padding: 14, background: C.bg, borderRadius: 8, fontSize: 13, color: C.text, lineHeight: 1.6, borderLeft: `3px solid ${C.lime}` }}>{d.context}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "private notes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.amber}33`, borderRadius: 10, padding: 14, fontSize: 12, color: C.muted }}>🔒 These notes are private and only visible to you. They are not logged in the audit trail and not accessible to other admins.</div>
          {privateNotes.map((note) => (
            <div key={note.client + note.date} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.lime }}>{note.client}</span>
                  <span style={{ fontSize: 10, color: priorityColors[note.priority], background: `${priorityColors[note.priority]}18`, padding: "2px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace", textTransform: "uppercase" }}>{note.priority}</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: "DM Mono, monospace" }}>{note.date}</span>
                  <button style={{ background: C.border, border: "none", color: C.text, padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Edit</button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, padding: 14, background: C.bg, borderRadius: 8, borderLeft: `3px solid ${priorityColors[note.priority]}` }}>{note.note}</div>
            </div>
          ))}
          <button style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10, padding: 20, color: C.muted, fontSize: 13, cursor: "pointer", textAlign: "center" }}>+ Add Private Note</button>
        </div>
      )}
    </div>
  );
}
