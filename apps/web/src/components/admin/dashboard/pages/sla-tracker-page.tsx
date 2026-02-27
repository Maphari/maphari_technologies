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
type Tab = "client sla scores" | "sla matrix" | "breach log" | "sla definitions";
type SlaDataKey = "firstResponse" | "substantive" | "milestoneUpdate" | "deliverableReview" | "invoiceAck" | "escalation";

const slaDefinitions = [
  { id: "SLA-01", name: "First Response Time", tier: "All", target: "4 hours", targetHrs: 4, description: "Time from client message to first acknowledgement" },
  { id: "SLA-02", name: "Substantive Response Time", tier: "All", target: "24 hours", targetHrs: 24, description: "Time to meaningful reply or resolution" },
  { id: "SLA-03", name: "Milestone Update Frequency", tier: "Core", target: "Weekly", targetHrs: 168, description: "Minimum project status updates to client" },
  { id: "SLA-04", name: "Milestone Update Frequency", tier: "Growth / Enterprise", target: "Bi-weekly", targetHrs: 84, description: "Minimum project status updates to client" },
  { id: "SLA-05", name: "Deliverable Review Turnaround", tier: "All", target: "48 hours", targetHrs: 48, description: "Time from client feedback to revised deliverable" },
  { id: "SLA-06", name: "Invoice Acknowledgement", tier: "All", target: "Same day", targetHrs: 8, description: "Invoice confirmed received and correct" },
  { id: "SLA-07", name: "Emergency Escalation Response", tier: "Growth / Enterprise", target: "2 hours", targetHrs: 2, description: "Critical issues or client escalations" },
] as const;

type SlaPoint = { avg: number; breaches30d: number; lastBreached: string | null; unit?: "days" };
type SlaDataMap = {
  firstResponse: SlaPoint;
  substantive: SlaPoint;
  milestoneUpdate: SlaPoint;
  deliverableReview: SlaPoint;
  invoiceAck: SlaPoint;
  escalation: SlaPoint | null;
};

const clients: Array<{
  name: string;
  color: string;
  tier: string;
  am: string;
  slaData: SlaDataMap;
  overallScore: number;
  trend: Trend;
}> = [
  {
    name: "Volta Studios",
    color: C.lime,
    tier: "Growth",
    am: "Nomsa Dlamini",
    slaData: {
      firstResponse: { avg: 2.1, breaches30d: 0, lastBreached: null },
      substantive: { avg: 18.4, breaches30d: 0, lastBreached: null },
      milestoneUpdate: { avg: 5.2, breaches30d: 0, lastBreached: null, unit: "days" },
      deliverableReview: { avg: 31.2, breaches30d: 1, lastBreached: "Feb 14" },
      invoiceAck: { avg: 3.1, breaches30d: 0, lastBreached: null },
      escalation: { avg: 1.4, breaches30d: 0, lastBreached: null },
    },
    overallScore: 97,
    trend: "stable",
  },
  {
    name: "Kestrel Capital",
    color: C.purple,
    tier: "Core",
    am: "Nomsa Dlamini",
    slaData: {
      firstResponse: { avg: 5.8, breaches30d: 3, lastBreached: "Feb 20" },
      substantive: { avg: 29.1, breaches30d: 2, lastBreached: "Feb 19" },
      milestoneUpdate: { avg: 8.1, breaches30d: 1, lastBreached: "Feb 12" },
      deliverableReview: { avg: 52.4, breaches30d: 2, lastBreached: "Feb 18" },
      invoiceAck: { avg: 12.4, breaches30d: 1, lastBreached: "Feb 17" },
      escalation: null,
    },
    overallScore: 52,
    trend: "declining",
  },
  {
    name: "Mira Health",
    color: C.blue,
    tier: "Core",
    am: "Nomsa Dlamini",
    slaData: {
      firstResponse: { avg: 3.2, breaches30d: 0, lastBreached: null },
      substantive: { avg: 21.0, breaches30d: 1, lastBreached: "Feb 10" },
      milestoneUpdate: { avg: 6.4, breaches30d: 0, lastBreached: null },
      deliverableReview: { avg: 44.8, breaches30d: 1, lastBreached: "Feb 16" },
      invoiceAck: { avg: 5.2, breaches30d: 0, lastBreached: null },
      escalation: null,
    },
    overallScore: 81,
    trend: "improving",
  },
  {
    name: "Dune Collective",
    color: C.amber,
    tier: "Core",
    am: "Renzo Fabbri",
    slaData: {
      firstResponse: { avg: 6.2, breaches30d: 4, lastBreached: "Feb 22" },
      substantive: { avg: 31.8, breaches30d: 3, lastBreached: "Feb 21" },
      milestoneUpdate: { avg: 9.8, breaches30d: 2, lastBreached: "Feb 15" },
      deliverableReview: { avg: 61.2, breaches30d: 3, lastBreached: "Feb 20" },
      invoiceAck: { avg: 8.9, breaches30d: 0, lastBreached: null },
      escalation: null,
    },
    overallScore: 38,
    trend: "declining",
  },
  {
    name: "Okafor & Sons",
    color: C.orange,
    tier: "Core",
    am: "Tapiwa Moyo",
    slaData: {
      firstResponse: { avg: 2.8, breaches30d: 0, lastBreached: null },
      substantive: { avg: 16.2, breaches30d: 0, lastBreached: null },
      milestoneUpdate: { avg: 5.9, breaches30d: 0, lastBreached: null },
      deliverableReview: { avg: 38.4, breaches30d: 0, lastBreached: null },
      invoiceAck: { avg: 4.1, breaches30d: 0, lastBreached: null },
      escalation: null,
    },
    overallScore: 98,
    trend: "stable",
  },
];

const slaMetrics: Array<{ key: Exclude<SlaDataKey, "escalation">; name: string; targetHrs: number; unit: string; divisor?: number }> = [
  { key: "firstResponse", name: "First Response", targetHrs: 4, unit: "h" },
  { key: "substantive", name: "Substantive Reply", targetHrs: 24, unit: "h" },
  { key: "milestoneUpdate", name: "Milestone Update", targetHrs: 168, unit: "d", divisor: 24 },
  { key: "deliverableReview", name: "Deliverable Review", targetHrs: 48, unit: "h" },
  { key: "invoiceAck", name: "Invoice Ack.", targetHrs: 8, unit: "h" },
];

const tabs: Tab[] = ["client sla scores", "sla matrix", "breach log", "sla definitions"];

export function SlaTrackerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("client sla scores");

  const totalBreaches = clients.reduce(
    (s, c) =>
      s +
      Object.values(c.slaData)
        .filter((m): m is SlaPoint => Boolean(m))
        .reduce((s2, m) => s2 + m.breaches30d, 0),
    0
  );
  const atRisk = clients.filter((c) => c.overallScore < 70).length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / OPERATIONS</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>SLA Tracker</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Response times - Breach alerts - Client service level compliance</div>
        </div>
        <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Export SLA Report</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Avg SLA Score", value: `${Math.round(clients.reduce((s, c) => s + c.overallScore, 0) / clients.length)}%`, color: C.lime, sub: "Across all clients" },
          { label: "Clients At Risk", value: atRisk.toString(), color: atRisk > 0 ? C.red : C.lime, sub: "Score < 70%" },
          { label: "Breaches (30d)", value: totalBreaches.toString(), color: totalBreaches > 5 ? C.red : C.amber, sub: "Across all SLAs" },
          { label: "SLA Compliance", value: `${Math.round((1 - totalBreaches / 150) * 100)}%`, color: C.blue, sub: "~150 SLA events / month" },
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

      {activeTab === "client sla scores" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...clients].sort((a, b) => a.overallScore - b.overallScore).map((c) => {
            const scoreColor = c.overallScore >= 85 ? C.lime : c.overallScore >= 65 ? C.amber : C.red;
            const totalBreachesClient = Object.values(c.slaData)
              .filter((m): m is SlaPoint => Boolean(m))
              .reduce((s, m) => s + m.breaches30d, 0);
            return (
              <div key={c.name} style={{ background: C.surface, border: `1px solid ${c.overallScore < 70 ? `${C.red}55` : C.border}`, borderRadius: 10, padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 80px 80px 100px auto", alignItems: "center", gap: 20 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: c.color }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {c.tier} tier - {c.am}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>SLA Compliance Score</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: scoreColor }}>{c.overallScore}%</span>
                    </div>
                    <div style={{ height: 10, background: C.border, borderRadius: 5 }}>
                      <div style={{ height: "100%", width: `${c.overallScore}%`, background: scoreColor, borderRadius: 5, transition: "width 0.8s" }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>Breaches</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: totalBreachesClient > 0 ? C.red : C.lime, fontSize: 18 }}>{totalBreachesClient}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{c.trend === "improving" ? "▲" : c.trend === "declining" ? "▼" : "→"}</span>
                    <span style={{ fontSize: 11, color: c.trend === "improving" ? C.lime : c.trend === "declining" ? C.red : C.muted }}>{c.trend}</span>
                  </div>
                  {c.overallScore < 70 ? <button style={{ background: C.red, color: "#fff", border: "none", padding: "8px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Action Required</button> : <button style={{ background: C.border, border: "none", color: C.text, padding: "8px 14px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>View Detail</button>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 16 }}>
                  {slaMetrics.map((m) => {
                    const data = c.slaData[m.key];
                    const val = m.divisor ? (data.avg / m.divisor).toFixed(1) : data.avg.toFixed(1);
                    const overTarget = data.avg > m.targetHrs;
                    return (
                      <div key={m.key} style={{ padding: 10, background: C.bg, borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontFamily: "DM Mono, monospace", fontSize: 16, fontWeight: 700, color: overTarget ? C.red : C.lime }}>{val}{m.unit}</div>
                        <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{m.name}</div>
                        {data.breaches30d > 0 ? <div style={{ fontSize: 8, color: C.red, marginTop: 2 }}>{data.breaches30d} breach{data.breaches30d !== 1 ? "es" : ""}</div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "sla matrix" && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: `160px ${clients.map(() => "1fr").join(" ")}`, padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", gap: 8 }}>
            <span>SLA Metric</span>
            {clients.map((c) => (
              <span key={c.name} style={{ color: c.color, textAlign: "center" }}>
                {c.name.split(" ")[0]}
              </span>
            ))}
          </div>
          {slaMetrics.map((m, ri) => (
            <div key={m.key} style={{ display: "grid", gridTemplateColumns: `160px ${clients.map(() => "1fr").join(" ")}`, padding: "14px 24px", borderBottom: ri < slaMetrics.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>
                  Target: {m.targetHrs}
                  {m.unit}
                </div>
              </div>
              {clients.map((c) => {
                const data = c.slaData[m.key];
                const val = m.divisor ? (data.avg / m.divisor).toFixed(1) : data.avg.toFixed(1);
                const ok = data.avg <= m.targetHrs;
                return (
                  <div key={c.name} style={{ textAlign: "center", padding: 8, background: ok ? `${C.lime}08` : `${C.red}10`, borderRadius: 6 }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: ok ? C.lime : C.red, fontSize: 14 }}>
                      {val}
                      {m.unit}
                    </div>
                    {data.breaches30d > 0 ? <div style={{ fontSize: 9, color: C.red }}>×{data.breaches30d}</div> : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {activeTab === "breach log" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {clients
            .flatMap((c) =>
              slaMetrics
                .map((m) => {
                  const data = c.slaData[m.key];
                  if (data.breaches30d === 0) return null;
                  return {
                    client: c.name,
                    clientColor: c.color,
                    am: c.am,
                    metric: m.name,
                    breaches: data.breaches30d,
                    lastBreached: data.lastBreached,
                    avg: data.avg,
                    target: m.targetHrs,
                    unit: m.unit,
                  };
                })
                .filter((x): x is NonNullable<typeof x> => Boolean(x))
            )
            .sort((a, b) => b.breaches - a.breaches)
            .map((breach, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.red}33`, borderRadius: 10, padding: 20, display: "grid", gridTemplateColumns: "160px 1fr 100px 100px 120px 80px", alignItems: "center", gap: 16 }}>
                <div style={{ fontWeight: 700, color: breach.clientColor }}>{breach.client}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{breach.metric}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>AM: {breach.am}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Avg Time</div>
                  <div style={{ fontFamily: "DM Mono, monospace", color: C.red, fontWeight: 700 }}>
                    {breach.avg.toFixed(1)}
                    {breach.unit}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Target</div>
                  <div style={{ fontFamily: "DM Mono, monospace", color: C.lime }}>
                    {breach.target}
                    {breach.unit}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Last Breach</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{breach.lastBreached}</div>
                </div>
                <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}44`, borderRadius: 6, padding: "6px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "DM Mono, monospace", color: C.red, fontWeight: 800 }}>{breach.breaches}</div>
                  <div style={{ fontSize: 9, color: C.red }}>breaches</div>
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === "sla definitions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {slaDefinitions.map((sla) => (
            <div key={sla.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, display: "grid", gridTemplateColumns: "80px 1fr 100px 160px auto", alignItems: "center", gap: 20 }}>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{sla.id}</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{sla.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{sla.description}</div>
              </div>
              <span style={{ fontSize: 10, color: C.blue, background: `${C.blue}15`, padding: "3px 8px", borderRadius: 4 }}>{sla.tier}</span>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 14, fontWeight: 700, color: C.lime }}>Target: {sla.target}</div>
              <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Edit</button>
            </div>
          ))}
          <button style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10, padding: 20, color: C.muted, fontSize: 13, cursor: "pointer", textAlign: "center" }}>+ Add SLA Definition</button>
        </div>
      )}
    </div>
  );
}
