"use client";

import { useState } from "react";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  primary: "#a78bfa",
  lime: "#c8f135",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

type DimensionScore = {
  score: number;
  weight: number;
  prev: number;
  note: string;
};

type DimensionMap = Record<string, DimensionScore>;

type Trend = "stable" | "declining" | "improving";

type ScorecardClient = {
  client: string;
  color: string;
  avatar: string;
  tier: string;
  am: string;
  mrr: number;
  months: number;
  dimensions: DimensionMap;
  history: number[];
  churnRisk: number;
  renewalProbability: number;
  openIssues: number;
};

const scorecardData: ScorecardClient[] = [
  {
    client: "Volta Studios",
    color: C.lime,
    avatar: "VS",
    tier: "Growth",
    am: "Nomsa Dlamini",
    mrr: 28000,
    months: 14,
    dimensions: {
      "NPS / Satisfaction": { score: 9.2, weight: 20, prev: 9.0, note: "Consistently promoter" },
      "Invoice Payment": { score: 9.5, weight: 15, prev: 9.5, note: "Always on time" },
      "Communication Health": { score: 9.0, weight: 15, prev: 8.8, note: "Responsive, positive tone" },
      "Project Delivery": { score: 8.8, weight: 20, prev: 8.5, note: "On track, minimal revisions" },
      "Scope Stability": { score: 9.0, weight: 10, prev: 9.0, note: "No scope disputes" },
      "Growth Signal": { score: 9.5, weight: 10, prev: 9.0, note: "Verbal interest in expanding" },
      "Relationship Depth": { score: 9.0, weight: 10, prev: 8.8, note: "Multi-stakeholder access" }
    },
    history: [82, 86, 88, 91, 94, 94],
    churnRisk: 4,
    renewalProbability: 96,
    openIssues: 0
  },
  {
    client: "Kestrel Capital",
    color: C.purple,
    avatar: "KC",
    tier: "Core",
    am: "Nomsa Dlamini",
    mrr: 21000,
    months: 5,
    dimensions: {
      "NPS / Satisfaction": { score: 4.0, weight: 20, prev: 7.5, note: "Dropped significantly" },
      "Invoice Payment": { score: 2.0, weight: 15, prev: 9.0, note: "INV-0039 overdue 12 days" },
      "Communication Health": { score: 5.0, weight: 15, prev: 7.0, note: "Terse replies, slow response" },
      "Project Delivery": { score: 6.5, weight: 20, prev: 6.8, note: "Slight delays, client frustrated" },
      "Scope Stability": { score: 7.0, weight: 10, prev: 7.5, note: "No major disputes" },
      "Growth Signal": { score: 3.0, weight: 10, prev: 6.0, note: "No expansion signals" },
      "Relationship Depth": { score: 5.0, weight: 10, prev: 6.5, note: "Only one contact point" }
    },
    history: [74, 78, 72, 68, 55, 44],
    churnRisk: 62,
    renewalProbability: 38,
    openIssues: 2
  },
  {
    client: "Mira Health",
    color: C.blue,
    avatar: "MH",
    tier: "Core",
    am: "Nomsa Dlamini",
    mrr: 21600,
    months: 4,
    dimensions: {
      "NPS / Satisfaction": { score: 8.0, weight: 20, prev: 6.5, note: "Recovering well" },
      "Invoice Payment": { score: 9.5, weight: 15, prev: 9.5, note: "Always on time" },
      "Communication Health": { score: 8.2, weight: 15, prev: 7.0, note: "Improved significantly" },
      "Project Delivery": { score: 7.8, weight: 20, prev: 7.5, note: "Minor wireframe revisions" },
      "Scope Stability": { score: 8.5, weight: 10, prev: 8.5, note: "Stable" },
      "Growth Signal": { score: 7.5, weight: 10, prev: 6.0, note: "Mentioned phase 2 interest" },
      "Relationship Depth": { score: 7.0, weight: 10, prev: 6.5, note: "Dr. Obi very engaged" }
    },
    history: [61, 63, 66, 69, 72, 74],
    churnRisk: 22,
    renewalProbability: 78,
    openIssues: 0
  },
  {
    client: "Dune Collective",
    color: C.amber,
    avatar: "DC",
    tier: "Core",
    am: "Renzo Fabbri",
    mrr: 16000,
    months: 4,
    dimensions: {
      "NPS / Satisfaction": { score: 3.0, weight: 20, prev: 6.0, note: "Very unhappy with scope" },
      "Invoice Payment": { score: 2.5, weight: 15, prev: 8.5, note: "INV-0040 overdue" },
      "Communication Health": { score: 3.5, weight: 15, prev: 5.0, note: "No reply to emails" },
      "Project Delivery": { score: 5.5, weight: 20, prev: 5.5, note: "Template library rejected" },
      "Scope Stability": { score: 2.0, weight: 10, prev: 5.0, note: "Active scope dispute" },
      "Growth Signal": { score: 2.0, weight: 10, prev: 3.0, note: "No growth signals" },
      "Relationship Depth": { score: 3.0, weight: 10, prev: 4.0, note: "Relationship deteriorating" }
    },
    history: [71, 68, 60, 54, 46, 38],
    churnRisk: 74,
    renewalProbability: 18,
    openIssues: 3
  },
  {
    client: "Okafor & Sons",
    color: C.orange,
    avatar: "OS",
    tier: "Core",
    am: "Tapiwa Moyo",
    mrr: 12000,
    months: 18,
    dimensions: {
      "NPS / Satisfaction": { score: 10.0, weight: 20, prev: 9.8, note: "Absolute promoter" },
      "Invoice Payment": { score: 9.8, weight: 15, prev: 9.8, note: "Always early" },
      "Communication Health": { score: 9.5, weight: 15, prev: 9.2, note: "James always responsive" },
      "Project Delivery": { score: 9.8, weight: 20, prev: 9.5, note: "Annual report approved" },
      "Scope Stability": { score: 9.5, weight: 10, prev: 9.5, note: "Zero disputes ever" },
      "Growth Signal": { score: 8.5, weight: 10, prev: 8.0, note: "Asked about new services" },
      "Relationship Depth": { score: 9.8, weight: 10, prev: 9.5, note: "CEO direct relationship" }
    },
    history: [88, 90, 92, 93, 95, 96],
    churnRisk: 2,
    renewalProbability: 98,
    openIssues: 0
  }
];

function calcHealthScore(dimensions: DimensionMap): number {
  const rows = Object.values(dimensions);
  const totalWeight = rows.reduce((s, d) => s + d.weight, 0);
  return Math.round((rows.reduce((s, d) => s + (d.score / 10) * d.weight, 0) / totalWeight) * 100);
}

const tabs = ["scorecard grid", "deep dive", "risk summary"] as const;
type Tab = (typeof tabs)[number];

export function ClientHealthScorecardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("scorecard grid");
  const [selected, setSelected] = useState<ScorecardClient>(scorecardData[0]);

  const atRisk = scorecardData.filter((c) => c.churnRisk >= 50).length;
  const avgHealth = Math.round(scorecardData.reduce((s, c) => s + calcHealthScore(c.dimensions), 0) / scorecardData.length);
  const totalMRRAtRisk = scorecardData.filter((c) => c.churnRisk >= 50).reduce((s, c) => s + c.mrr, 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / REPORTING & INTELLIGENCE</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Client Health Scorecard</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>7-dimension weighted health model · Churn risk · Renewal probability</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Export Scorecard</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Portfolio Avg Health", value: avgHealth.toString(), color: avgHealth >= 70 ? C.lime : C.amber, sub: "Weighted score" },
          { label: "Clients at Risk", value: atRisk.toString(), color: atRisk > 0 ? C.red : C.lime, sub: "Churn risk >= 50%" },
          { label: "MRR at Risk", value: `R${(totalMRRAtRisk / 1000).toFixed(0)}k`, color: C.red, sub: "From at-risk clients" },
          { label: "Renewal Probability", value: `${Math.round(scorecardData.reduce((s, c) => s + c.renewalProbability, 0) / scorecardData.length)}%`, color: C.blue, sub: "Portfolio average" }
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

      {activeTab === "scorecard grid" && (
        <div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "auto", marginBottom: 20 }}>
            <div style={{ minWidth: 900 }}>
              <div style={{ display: "grid", gridTemplateColumns: "180px repeat(7, 1fr) 80px 80px 60px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, gap: 8 }}>
                <span style={{ fontSize: 10, color: C.muted }}>Client</span>
                {Object.keys(scorecardData[0].dimensions).map((d) => (
                  <span key={d} style={{ fontSize: 9, color: C.muted, textAlign: "center" }}>{d.split(" ")[0]}</span>
                ))}
                <span style={{ fontSize: 10, color: C.muted, textAlign: "center" }}>Score</span>
                <span style={{ fontSize: 10, color: C.muted, textAlign: "center" }}>Churn%</span>
                <span style={{ fontSize: 10, color: C.muted, textAlign: "center" }}>Issues</span>
              </div>

              {[...scorecardData]
                .sort((a, b) => calcHealthScore(a.dimensions) - calcHealthScore(b.dimensions))
                .map((c, i) => {
                  const health = calcHealthScore(c.dimensions);
                  return (
                    <div
                      key={c.client}
                      onClick={() => {
                        setSelected(c);
                        setActiveTab("deep dive");
                      }}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "180px repeat(7, 1fr) 80px 80px 60px",
                        padding: "14px 20px",
                        borderBottom: i < scorecardData.length - 1 ? `1px solid ${C.border}` : "none",
                        gap: 8,
                        alignItems: "center",
                        cursor: "pointer",
                        background: c.churnRisk >= 50 ? "#0f0505" : "transparent"
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />
                        <span style={{ fontWeight: 600, fontSize: 13, color: c.color }}>{c.client.split(" ")[0]}</span>
                      </div>

                      {Object.values(c.dimensions).map((d, di) => {
                        const score = d.score;
                        const color = score >= 8 ? C.lime : score >= 6 ? C.blue : score >= 4 ? C.amber : C.red;
                        return (
                          <div key={`${c.client}-${di}`} style={{ textAlign: "center" }}>
                            <div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 2 }}>
                              <div style={{ height: "100%", width: `${(score / 10) * 100}%`, background: color, borderRadius: 2 }} />
                            </div>
                            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color }}>{score.toFixed(1)}</span>
                          </div>
                        );
                      })}

                      <div style={{ textAlign: "center", fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 18, color: health >= 70 ? C.lime : health >= 50 ? C.amber : C.red }}>{health}</div>
                      <div style={{ textAlign: "center", fontFamily: "DM Mono, monospace", color: c.churnRisk >= 50 ? C.red : C.muted }}>{c.churnRisk}%</div>
                      <div style={{ textAlign: "center", color: c.openIssues > 0 ? C.red : C.muted }}>{c.openIssues > 0 ? `! ${c.openIssues}` : "—"}</div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div style={{ fontSize: 11, color: C.muted, display: "flex", gap: 4 }}>
            <span>Click any row to open deep dive.</span>
            <span>Dimension weights: NPS 20%, Invoice 15%, Comms 15%, Delivery 20%, Scope 10%, Growth 10%, Relationship 10%</span>
          </div>
        </div>
      )}

      {activeTab === "deep dive" && (
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scorecardData.map((c) => {
              const h = calcHealthScore(c.dimensions);
              return (
                <div
                  key={c.client}
                  onClick={() => setSelected(c)}
                  style={{
                    padding: "12px 16px",
                    background: selected.client === c.client ? `${c.color}15` : C.surface,
                    border: `1px solid ${selected.client === c.client ? c.color + "55" : C.border}`,
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 12, color: selected.client === c.client ? c.color : C.text }}>{c.client.split(" ")[0]}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 16, color: h >= 70 ? C.lime : h >= 50 ? C.amber : C.red }}>{h}</div>
                </div>
              );
            })}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${selected.color}33`, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 22, color: selected.color }}>{selected.client}</div>
                <div style={{ color: C.muted, fontSize: 13 }}>{selected.tier} · {selected.am} · {selected.months} months</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 40, color: selected.churnRisk >= 50 ? C.red : C.lime }}>{calcHealthScore(selected.dimensions)}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Health Score</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {Object.entries(selected.dimensions).map(([dim, data]) => {
                const color = data.score >= 8 ? C.lime : data.score >= 6 ? C.blue : data.score >= 4 ? C.amber : C.red;
                const delta = (data.score - data.prev).toFixed(1);
                return (
                  <div key={dim} style={{ padding: 14, background: C.bg, display: "grid", gridTemplateColumns: "180px 1fr 60px 40px 60px", alignItems: "center", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{dim}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>Weight: {data.weight}%</div>
                    </div>
                    <div>
                      <div style={{ height: 8, background: C.border }}>
                        <div style={{ height: "100%", width: `${(data.score / 10) * 100}%`, background: color }} />
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{data.note}</div>
                    </div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 18, color, textAlign: "center" }}>{data.score.toFixed(1)}</div>
                    <span style={{ fontSize: 12, color: Number.parseFloat(delta) > 0 ? C.lime : Number.parseFloat(delta) < 0 ? C.red : C.muted, textAlign: "center" }}>
                      {Number.parseFloat(delta) > 0 ? "▲" : Number.parseFloat(delta) < 0 ? "▼" : "→"}
                    </span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, textAlign: "center" }}>prev {data.prev.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Churn Risk", value: `${selected.churnRisk}%`, color: selected.churnRisk >= 50 ? C.red : selected.churnRisk >= 25 ? C.amber : C.lime },
                { label: "Renewal Probability", value: `${selected.renewalProbability}%`, color: selected.renewalProbability >= 75 ? C.lime : C.amber },
                { label: "MRR at Stake", value: `R${(selected.mrr / 1000).toFixed(0)}k`, color: C.blue }
              ].map((m) => (
                <div key={m.label} style={{ padding: 14, background: C.bg, textAlign: "center" }}>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 24, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {selected.churnRisk >= 50 ? <button style={{ background: C.red, color: "#fff", border: "none", padding: "10px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Log Intervention</button> : null}
              <button style={{ background: C.primary, color: C.bg, border: "none", padding: "10px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View Client</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "risk summary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[...scorecardData].sort((a, b) => b.churnRisk - a.churnRisk).map((c) => {
            const health = calcHealthScore(c.dimensions);
            const worstDim = Object.entries(c.dimensions).reduce<[string, DimensionScore]>((a, [k, v]) => (v.score < a[1].score ? [k, v] : a), Object.entries(c.dimensions)[0]);
            return (
              <div key={c.client} style={{ background: C.surface, border: `1px solid ${c.churnRisk >= 50 ? C.red + "44" : C.border}`, padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "180px 80px 1fr 120px 140px 100px", alignItems: "center", gap: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: c.color }}>{c.client}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 24, color: health >= 70 ? C.lime : health >= 50 ? C.amber : C.red }}>{health}</div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Weakest dimension: {worstDim[0]}</div>
                    <div style={{ fontSize: 12, color: worstDim[1].score < 5 ? C.red : C.amber }}>{worstDim[1].note}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Churn Risk</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 20, color: c.churnRisk >= 50 ? C.red : c.churnRisk >= 25 ? C.amber : C.lime }}>{c.churnRisk}%</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Renewal Probability</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 20, color: c.renewalProbability >= 75 ? C.lime : C.amber }}>{c.renewalProbability}%</div>
                  </div>
                  {c.churnRisk >= 50 ? <button style={{ background: C.red, color: "#fff", border: "none", padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Intervene</button> : <span style={{ fontSize: 11, color: C.lime, textAlign: "center" }}>Healthy</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
