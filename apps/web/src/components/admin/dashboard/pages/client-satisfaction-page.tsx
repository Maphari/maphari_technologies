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

type Trend = "stable" | "improving" | "declining";
type SurveyStatus = "overdue" | "due" | "upcoming";
type Tab = "satisfaction scores" | "survey schedule" | "feedback log" | "trends";

type HistoryPoint = { month: string; nps: number | null; csat: number | null };
type ClientRecord = {
  name: string;
  color: string;
  avatar: string;
  am: string;
  nps: number;
  csat: number;
  latestSurvey: string;
  trend: Trend;
  history: HistoryPoint[];
  feedback: string;
  surveysDue: boolean;
};

const clients: ClientRecord[] = [
  {
    name: "Volta Studios",
    color: C.lime,
    avatar: "VS",
    am: "Nomsa Dlamini",
    nps: 9,
    csat: 9.1,
    latestSurvey: "Feb 10",
    trend: "stable",
    history: [
      { month: "Oct", nps: 8, csat: 8.8 },
      { month: "Nov", nps: 9, csat: 9.0 },
      { month: "Dec", nps: 9, csat: 9.1 },
      { month: "Jan", nps: 9, csat: 9.1 },
      { month: "Feb", nps: 9, csat: 9.1 },
    ],
    feedback: "Really happy with how the brand direction is coming together. Nomsa is a pleasure to work with.",
    surveysDue: false,
  },
  {
    name: "Kestrel Capital",
    color: C.purple,
    avatar: "KC",
    am: "Nomsa Dlamini",
    nps: 4,
    csat: 6.2,
    latestSurvey: "Jan 15",
    trend: "declining",
    history: [
      { month: "Oct", nps: 8, csat: 8.1 },
      { month: "Nov", nps: 7, csat: 7.5 },
      { month: "Dec", nps: 6, csat: 6.8 },
      { month: "Jan", nps: 4, csat: 6.2 },
      { month: "Feb", nps: null, csat: null },
    ],
    feedback: "Turnaround times have been slower than expected. Invoice dispute has created friction.",
    surveysDue: true,
  },
  {
    name: "Mira Health",
    color: C.blue,
    avatar: "MH",
    am: "Nomsa Dlamini",
    nps: 8,
    csat: 8.4,
    latestSurvey: "Feb 5",
    trend: "improving",
    history: [
      { month: "Oct", nps: 6, csat: 7.2 },
      { month: "Nov", nps: 7, csat: 7.8 },
      { month: "Dec", nps: 7, csat: 8.0 },
      { month: "Jan", nps: 8, csat: 8.3 },
      { month: "Feb", nps: 8, csat: 8.4 },
    ],
    feedback: "Great improvement since the new project structure. Kira has been responsive.",
    surveysDue: false,
  },
  {
    name: "Dune Collective",
    color: C.amber,
    avatar: "DC",
    am: "Renzo Fabbri",
    nps: 3,
    csat: 5.8,
    latestSurvey: "Jan 20",
    trend: "declining",
    history: [
      { month: "Oct", nps: 7, csat: 7.5 },
      { month: "Nov", nps: 6, csat: 7.0 },
      { month: "Dec", nps: 5, csat: 6.2 },
      { month: "Jan", nps: 3, csat: 5.8 },
      { month: "Feb", nps: null, csat: null },
    ],
    feedback: "Scope creep has caused significant delays. We're frustrated with communication.",
    surveysDue: true,
  },
  {
    name: "Okafor & Sons",
    color: C.orange,
    avatar: "OS",
    am: "Tapiwa Moyo",
    nps: 10,
    csat: 9.6,
    latestSurvey: "Feb 18",
    trend: "stable",
    history: [
      { month: "Oct", nps: 9, csat: 9.3 },
      { month: "Nov", nps: 10, csat: 9.5 },
      { month: "Dec", nps: 10, csat: 9.4 },
      { month: "Jan", nps: 10, csat: 9.5 },
      { month: "Feb", nps: 10, csat: 9.6 },
    ],
    feedback: "Outstanding service. The annual report exceeded all expectations.",
    surveysDue: false,
  },
];

const surveySchedules: Array<{ client: string; color: string; type: string; due: string; status: SurveyStatus }> = [
  { client: "Kestrel Capital", color: C.purple, type: "Monthly CSAT", due: "Feb 28", status: "overdue" },
  { client: "Dune Collective", color: C.amber, type: "Monthly CSAT", due: "Feb 28", status: "due" },
  { client: "Mira Health", color: C.blue, type: "Quarterly NPS", due: "Mar 15", status: "upcoming" },
  { client: "Volta Studios", color: C.lime, type: "Quarterly NPS", due: "Mar 20", status: "upcoming" },
];

const tabs: Tab[] = ["satisfaction scores", "survey schedule", "feedback log", "trends"];

function MiniChart({ history }: { history: HistoryPoint[] }) {
  const validData = history.filter((h): h is { month: string; nps: number; csat: number | null } => h.nps !== null);
  const max = 10;
  const min = 0;
  const h = 40;
  const w = 120;
  const pts = validData
    .map((d, i) => {
      const x = (i / Math.max(history.length - 1, 1)) * w;
      const y = h - ((d.nps - min) / (max - min)) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={C.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {validData.map((d, i) => {
        const x = (i / Math.max(history.length - 1, 1)) * w;
        const y = h - ((d.nps - min) / (max - min)) * h;
        return <circle key={i} cx={x} cy={y} r="3" fill={C.lime} />;
      })}
    </svg>
  );
}

function NPSGauge({ score }: { score: number }) {
  const color = score >= 8 ? C.lime : score >= 6 ? C.amber : C.red;
  const pct = (score / 10) * 100;
  return (
    <div style={{ position: "relative", width: 80, height: 80 }}>
      <svg width={80} height={80} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={40} cy={40} r={32} fill="none" stroke={C.border} strokeWidth={8} />
        <circle cx={40} cy={40} r={32} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${(pct / 100) * 201} 201`} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 20, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 8, color: C.muted }}>NPS</div>
      </div>
    </div>
  );
}

export function ClientSatisfactionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("satisfaction scores");

  const avgNPS = (clients.reduce((s, c) => s + c.nps, 0) / clients.length).toFixed(1);
  const avgCSAT = (clients.reduce((s, c) => s + c.csat, 0) / clients.length).toFixed(1);
  const promoters = clients.filter((c) => c.nps >= 9).length;
  const detractors = clients.filter((c) => c.nps <= 6).length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Client Satisfaction</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>NPS - CSAT - Trends - Survey scheduling</div>
        </div>
        <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Send Survey Now</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Portfolio NPS", value: avgNPS, color: parseFloat(avgNPS) >= 7 ? C.lime : C.amber, sub: `${promoters} promoters - ${detractors} detractors` },
          { label: "Portfolio CSAT", value: `${avgCSAT}/10`, color: parseFloat(avgCSAT) >= 8 ? C.lime : C.amber, sub: "Avg client satisfaction" },
          { label: "Surveys Due", value: surveySchedules.filter((s) => s.status !== "upcoming").length.toString(), color: C.amber, sub: "Overdue or due this week" },
          { label: "Declining Clients", value: clients.filter((c) => c.trend === "declining").length.toString(), color: C.red, sub: "Negative NPS trend" },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ background: "none", border: "none", color: activeTab === t ? C.lime : C.muted, padding: "8px 16px", cursor: "pointer", fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `2px solid ${activeTab === t ? C.lime : "transparent"}`, marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "satisfaction scores" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...clients].sort((a, b) => a.nps - b.nps).map((c) => (
            <div key={c.name} style={{ background: C.surface, border: `1px solid ${c.nps <= 6 ? `${C.red}44` : C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "180px 80px 200px 1fr 120px 100px auto", alignItems: "center", gap: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, color: c.color, fontSize: 15 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{c.am}</div>
                </div>
                <NPSGauge score={c.nps} />
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>CSAT Score</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 24, color: c.csat >= 8 ? C.lime : c.csat >= 7 ? C.amber : C.red }}>{c.csat}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>out of 10</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>NPS Trend (5 months)</div>
                  <MiniChart history={c.history} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{c.trend === "improving" ? "▲" : c.trend === "declining" ? "▼" : "→"}</span>
                  <span style={{ fontSize: 12, color: c.trend === "improving" ? C.lime : c.trend === "declining" ? C.red : C.muted }}>{c.trend}</span>
                </div>
                <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: C.muted }}>Survey: {c.latestSurvey}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>View</button>
                  {c.surveysDue ? <button style={{ background: C.amber, color: C.bg, border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Send</button> : null}
                </div>
              </div>
              {c.feedback ? (
                <div style={{ marginTop: 16, padding: 12, background: C.bg, borderRadius: 8, borderLeft: `3px solid ${c.color}`, fontSize: 12, color: C.muted, fontStyle: "italic" }}>
                  "{c.feedback}"
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {activeTab === "survey schedule" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {surveySchedules.map((s) => (
            <div key={s.client + s.type} style={{ background: C.surface, border: `1px solid ${s.status === "overdue" ? `${C.red}44` : C.border}`, borderRadius: 10, padding: 20, display: "grid", gridTemplateColumns: "180px 180px 120px 100px auto", alignItems: "center", gap: 20 }}>
              <div style={{ fontWeight: 700, color: s.color }}>{s.client}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{s.type}</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: s.status === "overdue" ? C.red : s.status === "due" ? C.amber : C.muted }}>{s.due}</div>
              <span style={{ fontSize: 10, color: s.status === "overdue" ? C.red : s.status === "due" ? C.amber : C.muted, background: `${s.status === "overdue" ? C.red : s.status === "due" ? C.amber : C.muted}15`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{s.status}</span>
              <button style={{ background: s.status !== "upcoming" ? C.amber : C.border, color: s.status !== "upcoming" ? C.bg : C.text, border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: s.status !== "upcoming" ? 700 : 400, cursor: "pointer" }}>{s.status !== "upcoming" ? "Send Now" : "Schedule"}</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "feedback log" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {clients
            .filter((c) => c.feedback)
            .map((c) => (
              <div key={c.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 700, color: c.color }}>{c.name}</div>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.nps >= 8 ? C.lime : c.nps >= 6 ? C.amber : C.red }}>NPS {c.nps}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: C.muted }}>CSAT {c.csat}</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: "DM Mono, monospace" }}>{c.latestSurvey}</span>
                </div>
                <div style={{ padding: 14, background: C.bg, borderRadius: 8, borderLeft: `3px solid ${c.color}`, fontSize: 13, color: C.text, lineHeight: 1.6, fontStyle: "italic" }}>
                  "{c.feedback}"
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === "trends" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {clients.map((c) => (
            <div key={c.name} style={{ background: C.surface, border: `1px solid ${c.color}33`, borderRadius: 10, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: c.color }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: c.trend === "improving" ? C.lime : c.trend === "declining" ? C.red : C.muted }}>{c.trend === "improving" ? "▲ Improving" : c.trend === "declining" ? "▼ Declining" : "→ Stable"}</div>
                </div>
                <NPSGauge score={c.nps} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {c.history.map((h, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 16, color: h.nps !== null ? (h.nps >= 8 ? C.lime : h.nps >= 6 ? C.amber : C.red) : C.border }}>{h.nps ?? "—"}</div>
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{h.month}</div>
                    <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 4 }}>{h.nps !== null ? <div style={{ height: "100%", width: `${(h.nps / 10) * 100}%`, background: h.nps >= 8 ? C.lime : h.nps >= 6 ? C.amber : C.red, borderRadius: 2 }} /> : null}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
