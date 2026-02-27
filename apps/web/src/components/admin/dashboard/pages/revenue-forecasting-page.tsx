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

const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"] as const;
const currentMRR = 380600;

type Scenario = "best" | "base" | "worst";

type ClientRow = {
  name: string;
  color: string;
  mrr: number;
  retentionProb: number;
  expansionPotential: number;
  churnRisk: number;
};

const clients: ClientRow[] = [
  { name: "Volta Studios", color: C.lime, mrr: 28000, retentionProb: 97, expansionPotential: 8000, churnRisk: 4 },
  { name: "Kestrel Capital", color: C.purple, mrr: 21000, retentionProb: 38, expansionPotential: 0, churnRisk: 62 },
  { name: "Mira Health", color: C.blue, mrr: 21600, retentionProb: 78, expansionPotential: 10000, churnRisk: 22 },
  { name: "Dune Collective", color: C.amber, mrr: 16000, retentionProb: 18, expansionPotential: 0, churnRisk: 74 },
  { name: "Okafor & Sons", color: C.orange, mrr: 12000, retentionProb: 98, expansionPotential: 4000, churnRisk: 2 }
];

type PipelineRow = {
  name: string;
  source: string;
  stage: string;
  potential: number;
  probability: number;
  color: string;
  expectedClose: (typeof months)[number];
};

const pipeline: PipelineRow[] = [
  { name: "Horizon Media", source: "Volta referral", stage: "Proposal Sent", potential: 28000, probability: 55, color: C.lime, expectedClose: "Mar" },
  { name: "Apex Financial", source: "Okafor referral", stage: "Negotiation", potential: 45000, probability: 70, color: C.blue, expectedClose: "Mar" },
  { name: "SolarSense", source: "LinkedIn", stage: "Discovery", potential: 18000, probability: 30, color: C.purple, expectedClose: "Apr" },
  { name: "Pulse Clinics", source: "Mira referral", stage: "Discovery", potential: 22000, probability: 25, color: C.orange, expectedClose: "May" }
];

type ForecastMonth = {
  month: (typeof months)[number];
  mrr: number;
  retained: number;
  expansion: number;
  newBiz: number;
};

function buildForecast(scenario: Scenario): ForecastMonth[] {
  const retentionMultiplier = scenario === "best" ? 1.1 : scenario === "worst" ? 0.6 : 1.0;
  const expansionMultiplier = scenario === "best" ? 1.2 : scenario === "worst" ? 0 : 0.5;
  const pipelineMultiplier = scenario === "best" ? 1.3 : scenario === "worst" ? 0.5 : 1.0;

  return months.map((month, i) => {
    const retainedMRR = clients.reduce((s, c) => {
      const effectiveRetention = Math.min(c.retentionProb * retentionMultiplier, 99) / 100;
      return s + c.mrr * effectiveRetention;
    }, 0);

    const expansionMRR = clients.reduce((s, c) => s + c.expansionPotential * expansionMultiplier * (i >= 2 ? 1 : 0), 0);

    const newMRR = pipeline.reduce((s, p) => {
      const prob = (p.probability * pipelineMultiplier) / 100;
      return s + (p.expectedClose === month ? p.potential * prob : 0);
    }, 0);

    const monthMRR = Math.round(retainedMRR + expansionMRR + newMRR);
    return {
      month,
      mrr: monthMRR,
      retained: Math.round(retainedMRR),
      expansion: Math.round(expansionMRR),
      newBiz: Math.round(newMRR)
    };
  });
}

const scenarios: Record<Scenario, ForecastMonth[]> = {
  best: buildForecast("best"),
  base: buildForecast("base"),
  worst: buildForecast("worst")
};

const tabs = ["6-month forecast", "pipeline impact", "scenario planner", "assumptions"] as const;
type Tab = (typeof tabs)[number];

export function RevenueForecastingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("6-month forecast");
  const [activeScenario, setActiveScenario] = useState<Scenario>("base");

  const forecast = scenarios[activeScenario];
  const forecastEndMRR = forecast[forecast.length - 1].mrr;
  const mrrGrowth = Math.round(((forecastEndMRR - currentMRR) / currentMRR) * 100);
  const weightedPipelineMRR = Math.round(pipeline.reduce((s, p) => s + p.potential * (p.probability / 100), 0));
  const maxBar = Math.max(...Object.values(scenarios).flatMap((s) => s.map((m) => m.mrr)));

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / REPORTING & INTELLIGENCE</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Revenue Forecasting</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>6-month MRR projection · Pipeline impact · Retention-weighted scenarios</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Export Forecast</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Current MRR", value: `R${(currentMRR / 1000).toFixed(0)}k`, color: C.lime, sub: "Feb 2026 baseline" },
          { label: "Forecast MRR (Aug)", value: `R${(forecastEndMRR / 1000).toFixed(0)}k`, color: forecastEndMRR > currentMRR ? C.lime : C.red, sub: `${mrrGrowth >= 0 ? "+" : ""}${mrrGrowth}% — ${activeScenario} case` },
          { label: "Weighted Pipeline", value: `R${(weightedPipelineMRR / 1000).toFixed(0)}k`, color: C.blue, sub: "Probability-adjusted new MRR" },
          {
            label: "MRR at Churn Risk",
            value: `R${(clients.filter((c) => c.churnRisk >= 50).reduce((s, c) => s + c.mrr, 0) / 1000).toFixed(0)}k`,
            color: C.red,
            sub: "From clients at risk"
          }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 4 }}>
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
        {(activeTab === "6-month forecast" || activeTab === "scenario planner") && (
          <div style={{ display: "flex", gap: 6, paddingBottom: 8 }}>
            {(["best", "base", "worst"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActiveScenario(s)}
                style={{
                  background: activeScenario === s ? (s === "best" ? C.lime : s === "base" ? C.blue : C.red) : C.surface,
                  color: activeScenario === s ? C.bg : C.muted,
                  border: `1px solid ${activeScenario === s ? (s === "best" ? C.lime : s === "base" ? C.blue : C.red) : C.border}`,
                  padding: "4px 14px",
                  borderRadius: 20,
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "DM Mono, monospace",
                  textTransform: "capitalize"
                }}
              >
                {s} case
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === "6-month forecast" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>MRR Forecast — {activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1)} Case</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 24 }}>Stacked: retained (lime) + expansion (blue) + new business (purple)</div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 160 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>R{(currentMRR / 1000).toFixed(0)}k</div>
                <div style={{ height: (currentMRR / maxBar) * 140, background: `${C.lime}55`, borderRadius: "4px 4px 0 0", width: "100%", border: `1px dashed ${C.lime}44` }} />
                <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>NOW</span>
              </div>
              {forecast.map((m) => {
                const totalH = (m.mrr / maxBar) * 140;
                const retH = (m.retained / m.mrr) * totalH;
                const expH = (m.expansion / m.mrr) * totalH;
                const newH = totalH - retH - expH;
                const scenColor = activeScenario === "best" ? C.lime : activeScenario === "base" ? C.blue : C.red;
                return (
                  <div key={m.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: scenColor }}>R{(m.mrr / 1000).toFixed(0)}k</div>
                    <div style={{ height: totalH, width: "100%", display: "flex", flexDirection: "column-reverse", borderRadius: "4px 4px 0 0", overflow: "hidden" }}>
                      <div style={{ height: retH, background: `${C.lime}88`, flexShrink: 0 }} />
                      {expH > 0 && <div style={{ height: expH, background: `${C.blue}88`, flexShrink: 0 }} />}
                      {newH > 0 && <div style={{ height: newH, background: `${C.purple}88`, flexShrink: 0 }} />}
                    </div>
                    <span style={{ fontSize: 10, color: C.muted }}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 120px 120px 120px 120px 100px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", gap: 16 }}>
              {["Month", "Total MRR", "Retained", "Expansion", "New Biz", "Growth"].map((h) => <span key={h}>{h}</span>)}
            </div>
            <div style={{ padding: "10px 24px", borderBottom: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "80px 120px 120px 120px 120px 100px", gap: 16, background: "#0a0f05" }}>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>NOW</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.lime }}>R{(currentMRR / 1000).toFixed(0)}k</span>
              <span style={{ color: C.muted, fontSize: 11 }}>—</span>
              <span style={{ color: C.muted, fontSize: 11 }}>—</span>
              <span style={{ color: C.muted, fontSize: 11 }}>—</span>
              <span style={{ color: C.muted, fontSize: 11 }}>Baseline</span>
            </div>
            {forecast.map((m, i) => {
              const prevMRR = i === 0 ? currentMRR : forecast[i - 1].mrr;
              const growth = Math.round(((m.mrr - prevMRR) / prevMRR) * 100);
              const scenColor = activeScenario === "best" ? C.lime : activeScenario === "base" ? C.blue : C.red;
              return (
                <div key={m.month} style={{ display: "grid", gridTemplateColumns: "80px 120px 120px 120px 120px 100px", padding: "12px 24px", borderBottom: i < forecast.length - 1 ? `1px solid ${C.border}` : "none", gap: 16, alignItems: "center" }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700 }}>{m.month}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: scenColor, fontSize: 15 }}>R{(m.mrr / 1000).toFixed(0)}k</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>R{(m.retained / 1000).toFixed(0)}k</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.blue }}>{m.expansion > 0 ? `+R${(m.expansion / 1000).toFixed(0)}k` : "—"}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.purple }}>{m.newBiz > 0 ? `+R${(m.newBiz / 1000).toFixed(0)}k` : "—"}</span>
                  <span style={{ fontSize: 12, color: growth >= 0 ? C.lime : C.red }}>{growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "pipeline impact" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: 16, background: C.surface, border: `1px solid ${C.lime}22`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Total Pipeline Value</div>
              <div style={{ fontSize: 11, color: C.muted }}>Probability-weighted new MRR</div>
            </div>
            <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 28, color: C.lime }}>R{(weightedPipelineMRR / 1000).toFixed(0)}k</div>
          </div>

          {pipeline.map((p) => {
            const weighted = Math.round(p.potential * (p.probability / 100));
            return (
              <div key={p.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 22 }}>
                <div style={{ display: "grid", gridTemplateColumns: "160px 120px 1fr 100px 100px 120px 80px", alignItems: "center", gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: p.color }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{p.source}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>Stage</div>
                    <span style={{ fontSize: 11, color: p.stage === "Negotiation" ? C.amber : C.blue, background: p.stage === "Negotiation" ? `${C.amber}15` : `${C.blue}15`, padding: "2px 8px", borderRadius: 4 }}>{p.stage}</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>Close probability</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: p.probability >= 60 ? C.lime : C.amber }}>{p.probability}%</span>
                    </div>
                    <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${p.probability}%`, background: p.probability >= 60 ? C.lime : C.amber, borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.muted }}>Potential MRR</div>
                    <div style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{(p.potential / 1000).toFixed(0)}k</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.muted }}>Weighted</div>
                    <div style={{ fontFamily: "DM Mono, monospace", color: C.blue, fontWeight: 700 }}>R{(weighted / 1000).toFixed(0)}k</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.muted }}>Expected Close</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700 }}>{p.expectedClose} 2026</div>
                  </div>
                  <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>View</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "scenario planner" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {(["best", "base", "worst"] as const).map((scenario) => {
            const sc = scenarios[scenario];
            const endMRR = sc[sc.length - 1].mrr;
            const growth = Math.round(((endMRR - currentMRR) / currentMRR) * 100);
            const color = scenario === "best" ? C.lime : scenario === "base" ? C.blue : C.red;
            const desc = {
              best: "Retain all clients, expand Mira/Volta, close top 2 deals",
              base: "Kestrel/Dune churn handled, close Apex on schedule",
              worst: "Both at-risk clients churn, pipeline delays, no expansion"
            }[scenario];
            const revenue = sc.reduce((s, m) => s + m.mrr, 0);
            return (
              <div key={scenario} style={{ background: C.surface, border: `2px solid ${activeScenario === scenario ? color : C.border}`, borderRadius: 12, padding: 24, cursor: "pointer" }} onClick={() => setActiveScenario(scenario)}>
                <div style={{ fontSize: 14, fontWeight: 800, color, textTransform: "capitalize", marginBottom: 8 }}>{scenario} Case</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>{desc}</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 32, color, marginBottom: 4 }}>R{(endMRR / 1000).toFixed(0)}k</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>MRR by Aug 2026 · {growth >= 0 ? "+" : ""}{growth}% vs today</div>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 60, marginBottom: 12 }}>
                  {sc.map((m, i) => (
                    <div key={i} style={{ flex: 1, height: (m.mrr / endMRR) * 60, background: `${color}${activeScenario === scenario ? "cc" : "44"}`, borderRadius: "3px 3px 0 0" }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted }}>
                  <span>6-month revenue</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color, fontWeight: 700 }}>R{(revenue / 1000000).toFixed(2)}m</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "assumptions" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Retention Assumptions</div>
            {clients.map((c) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />
                <span style={{ fontSize: 12, flex: 1, color: c.color }}>{c.name.split(" ")[0]}</span>
                <div style={{ width: 80, height: 8, background: C.border, borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${c.retentionProb}%`, background: c.retentionProb >= 70 ? C.lime : c.retentionProb >= 40 ? C.amber : C.red, borderRadius: 4 }} />
                </div>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.retentionProb >= 70 ? C.lime : c.retentionProb >= 40 ? C.amber : C.red, width: 36, textAlign: "right" }}>{c.retentionProb}%</span>
              </div>
            ))}
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Expansion Potential</div>
            {clients.map((c) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 12, flex: 1, color: c.color }}>{c.name.split(" ")[0]}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: c.expansionPotential > 0 ? C.lime : C.muted }}>{c.expansionPotential > 0 ? `+R${(c.expansionPotential / 1000).toFixed(0)}k/mo` : "—"}</span>
              </div>
            ))}
            <div style={{ marginTop: 20, padding: 14, background: C.bg, borderRadius: 8, borderLeft: `3px solid ${C.blue}` }}>
              <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, marginBottom: 6 }}>Model Notes</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>Retention probability derived from client health scorecard churn risk. Expansion revenue modelled from AM notes and growth signals. Pipeline probability from CRM stage data.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
