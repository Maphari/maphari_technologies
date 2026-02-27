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
  text: "#e8e8f0"
} as const;

const mrrHistory = [
  { month: "Aug", mrr: 298000, churn: 0, expansion: 0, new: 28000 },
  { month: "Sep", mrr: 326000, churn: 0, expansion: 28000, new: 0 },
  { month: "Oct", mrr: 354000, churn: 0, expansion: 0, new: 28000 },
  { month: "Nov", mrr: 370000, churn: 12000, expansion: 16000, new: 12000 },
  { month: "Dec", mrr: 356000, churn: 28000, expansion: 14000, new: 0 },
  { month: "Jan", mrr: 378000, churn: 0, expansion: 22000, new: 0 },
  { month: "Feb", mrr: 398600, churn: 0, expansion: 16000, new: 4600 }
] as const;

const pipeline = [
  { stage: "Discovery", leads: 4, value: 148000, avgDays: 8 },
  { stage: "Proposal Sent", leads: 2, value: 84000, avgDays: 14 },
  { stage: "Negotiation", leads: 1, value: 42000, avgDays: 21 },
  { stage: "Contract Sent", leads: 1, value: 28000, avgDays: 7 }
] as const;

const revenueConcentration = [
  { client: "Volta Studios", mrr: 28000, pct: 7.0, color: C.lime },
  { client: "Kestrel Capital", mrr: 21000, pct: 5.3, color: C.purple },
  { client: "Mira Health", mrr: 21600, pct: 5.4, color: C.blue },
  { client: "Dune Collective", mrr: 16000, pct: 4.0, color: C.amber },
  { client: "Okafor & Sons", mrr: 12000, pct: 3.0, color: C.orange }
] as const;

const forecastData = [
  { month: "Mar 2026", forecast: 420000, low: 395000, high: 450000 },
  { month: "Apr 2026", forecast: 440000, low: 408000, high: 475000 },
  { month: "May 2026", forecast: 458000, low: 418000, high: 500000 }
] as const;

const tabs = ["mrr tracking", "pipeline", "concentration risk", "forecast", "sales velocity"] as const;
type Tab = (typeof tabs)[number];

export function RevOpsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("mrr tracking");

  const currentMRR = mrrHistory[mrrHistory.length - 1].mrr;
  const prevMRR = mrrHistory[mrrHistory.length - 2].mrr;
  const mrrGrowth = (((currentMRR - prevMRR) / prevMRR) * 100).toFixed(1);
  const arr = currentMRR * 12;
  const pipelineValue = pipeline.reduce((s, p) => s + p.value, 0);

  const maxMRR = Math.max(...mrrHistory.map((m) => m.mrr));

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / REVENUE OPERATIONS</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>RevOps Dashboard</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>MRR · ARR · Pipeline velocity · Revenue concentration · Forecasting</div>
        </div>
        <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Export RevOps Report</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "MRR (Feb 2026)", value: `R${(currentMRR / 1000).toFixed(1)}k`, color: C.lime, sub: `${Number(mrrGrowth) > 0 ? "▲" : "▼"} ${Math.abs(Number(mrrGrowth))}% MoM`, subColor: Number(mrrGrowth) > 0 ? C.lime : C.red },
          { label: "ARR (Annualised)", value: `R${(arr / 1000000).toFixed(2)}M`, color: C.blue, sub: "Based on Feb MRR", subColor: C.muted },
          { label: "Pipeline Value", value: `R${(pipelineValue / 1000).toFixed(0)}k`, color: C.purple, sub: `${pipeline.reduce((s, p) => s + p.leads, 0)} active leads`, subColor: C.muted },
          { label: "Net MRR Growth", value: `+R${((currentMRR - prevMRR) / 1000).toFixed(1)}k`, color: C.lime, sub: "Expansion + New - Churn", subColor: C.muted }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.subColor || C.muted }}>{s.sub}</div>
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
              transition: "all 0.2s"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "mrr tracking" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>MRR Movement — 7 Months</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 140, marginBottom: 12 }}>
              {mrrHistory.map((m, i) => {
                const h = (m.mrr / maxMRR) * 120;
                const isLast = i === mrrHistory.length - 1;
                return (
                  <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ fontSize: 9, color: isLast ? C.lime : C.muted, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>
                      R{(m.mrr / 1000).toFixed(0)}k
                    </div>
                    <div style={{ width: "100%", height: h, background: isLast ? C.lime : `${C.lime}33`, borderRadius: "3px 3px 0 0", transition: "height 0.6s" }} />
                    <div style={{ fontSize: 10, color: isLast ? C.lime : C.muted, marginTop: 6 }}>{m.month}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, background: C.bg, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 1fr", padding: "10px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {["Month", "MRR", "New", "Expansion", "Churn"].map((h) => <span key={h}>{h}</span>)}
              </div>
              {mrrHistory.map((m, i) => (
                <div key={m.month} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 1fr", padding: "10px 16px", borderBottom: i < mrrHistory.length - 1 ? `1px solid ${C.border}` : "none", fontSize: 12 }}>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{m.month}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{(m.mrr / 1000).toFixed(0)}k</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: m.new > 0 ? C.blue : C.muted }}>{m.new > 0 ? `+R${(m.new / 1000).toFixed(0)}k` : "—"}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: m.expansion > 0 ? C.purple : C.muted }}>{m.expansion > 0 ? `+R${(m.expansion / 1000).toFixed(0)}k` : "—"}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: m.churn > 0 ? C.red : C.muted }}>{m.churn > 0 ? `-R${(m.churn / 1000).toFixed(0)}k` : "—"}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "New MRR (Feb)", value: `+R${(mrrHistory[6].new / 1000).toFixed(1)}k`, color: C.blue, desc: "New client revenue" },
              { label: "Expansion MRR (Feb)", value: `+R${(mrrHistory[6].expansion / 1000).toFixed(0)}k`, color: C.purple, desc: "Upsell & tier upgrades" },
              { label: "Churned MRR (Feb)", value: `R${mrrHistory[6].churn}`, color: C.lime, desc: "No churn this month" }
            ].map((s) => (
              <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "pipeline" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          <div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sales Pipeline</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pipeline.map((stage, i) => {
                  const maxLeads = pipeline[0].leads;
                  const widthPct = (stage.leads / maxLeads) * 100;
                  const colors = [C.lime, C.blue, C.purple, C.amber] as const;
                  return (
                    <div key={stage.stage}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{stage.stage}</span>
                        <div style={{ display: "flex", gap: 16, fontSize: 12, fontFamily: "DM Mono, monospace" }}>
                          <span style={{ color: C.muted }}>{stage.leads} leads</span>
                          <span style={{ color: colors[i] }}>R{(stage.value / 1000).toFixed(0)}k</span>
                          <span style={{ color: C.muted }}>{stage.avgDays}d avg</span>
                        </div>
                      </div>
                      <div style={{ height: 28, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${widthPct}%`, background: colors[i], borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 10, transition: "width 0.8s" }}>
                          <span style={{ fontSize: 11, color: C.bg, fontWeight: 700, fontFamily: "DM Mono, monospace" }}>{stage.leads}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pipeline Summary</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Total Pipeline Value</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: C.lime, fontFamily: "DM Mono, monospace" }}>R{(pipelineValue / 1000).toFixed(0)}k</div>
                </div>
                <div style={{ height: 1, background: C.border }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Total Leads</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 700 }}>{pipeline.reduce((s, p) => s + p.leads, 0)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Win Rate (90d)</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 700, color: C.lime }}>42%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Avg Deal Size</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 700 }}>R{Math.round(pipelineValue / pipeline.reduce((s, p) => s + p.leads, 0) / 1000)}k</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Sales Cycle</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 700 }}>38d</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "concentration risk" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Revenue Concentration</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>Top 2 clients = {revenueConcentration.slice(0, 2).reduce((s, c) => s + c.pct, 0).toFixed(1)}% of MRR</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {revenueConcentration.map((c) => (
                <div key={c.client}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c.client}</span>
                    <div style={{ display: "flex", gap: 12, fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                      <span style={{ color: c.color }}>R{(c.mrr / 1000).toFixed(0)}k</span>
                      <span style={{ color: C.muted }}>{c.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${c.pct * 10}%`, background: c.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Concentration Risk Score</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: C.amber, fontFamily: "DM Mono, monospace", marginBottom: 8 }}>Medium</div>
              <div style={{ height: 8, background: C.border, borderRadius: 4, marginBottom: 12 }}>
                <div style={{ height: "100%", width: "52%", background: C.amber, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
                No single client exceeds 10% of MRR — within acceptable range. Target: no client above 20%. Current highest: Volta Studios at 7.0%.
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.amber}33`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, color: C.amber, marginBottom: 8 }}>⚠ Concentration Guidance</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
                To reduce risk, target 3–4 new clients at R10k–R20k MRR each. This would dilute top client concentration below 5%.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "forecast" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>3-Month MRR Forecast</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {forecastData.map((f) => (
                <div key={f.month}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{f.month}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 18, color: C.lime, fontWeight: 800 }}>R{(f.forecast / 1000).toFixed(0)}k</span>
                  </div>
                  <div style={{ position: "relative", height: 12, background: C.border, borderRadius: 6 }}>
                    <div style={{ position: "absolute", left: `${(f.low / f.high) * 100}%`, right: 0, height: "100%", background: `${C.lime}33`, borderRadius: 6 }} />
                    <div style={{ position: "absolute", left: `${(f.forecast / f.high) * 100 - 2}%`, top: 0, width: 4, height: "100%", background: C.lime, borderRadius: 2 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: C.muted, fontFamily: "DM Mono, monospace" }}>
                    <span>Low: R{(f.low / 1000).toFixed(0)}k</span>
                    <span>High: R{(f.high / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Forecast Assumptions</div>
              {[
                { assumption: "Zero churn over 3 months", confidence: "High", color: C.lime },
                { assumption: "2 upsells (Mira + Okafor)", confidence: "Medium", color: C.amber },
                { assumption: "1 new client at R12k MRR", confidence: "Medium", color: C.amber },
                { assumption: "No rate changes", confidence: "High", color: C.lime }
              ].map((a) => (
                <div key={a.assumption} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                  <span style={{ fontSize: 12 }}>{a.assumption}</span>
                  <span style={{ fontSize: 10, color: a.color, fontFamily: "DM Mono, monospace" }}>{a.confidence}</span>
                </div>
              ))}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Forecast Accuracy</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: C.lime, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>87%</div>
              <div style={{ fontSize: 12, color: C.muted }}>Avg accuracy over last 6 forecasts. Industry benchmark: 80%.</div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "sales velocity" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sales Velocity Formula</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 24 }}>Revenue generated per day from the pipeline</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[
                { label: "# Opportunities", value: "8", color: C.blue },
                { label: "Avg Deal Value", value: "R37.5k", color: C.purple },
                { label: "Win Rate", value: "42%", color: C.lime },
                { label: "Sales Cycle (days)", value: "38", color: C.amber }
              ].map((s) => (
                <div key={s.label} style={{ padding: 16, background: C.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 20, background: C.surface, borderRadius: 12, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Sales Velocity</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 40, fontWeight: 800, color: C.lime }}>R3,289</div>
              <div style={{ fontSize: 12, color: C.muted }}>per day</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Velocity Trend</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { period: "Nov 2025", velocity: 2800, change: 0 },
                  { period: "Dec 2025", velocity: 2400, change: -14.3 },
                  { period: "Jan 2026", velocity: 3100, change: +29.2 },
                  { period: "Feb 2026", velocity: 3289, change: +6.1 }
                ].map((v) => (
                  <div key={v.period} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: C.muted, fontFamily: "DM Mono, monospace", width: 70 }}>{v.period}</span>
                    <div style={{ flex: 1, height: 8, background: C.border, borderRadius: 4 }}>
                      <div style={{ height: "100%", width: `${(v.velocity / 3500) * 100}%`, background: C.lime, borderRadius: 4 }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, minWidth: 100 }}>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>R{v.velocity.toLocaleString()}</span>
                      {v.change !== 0 ? <span style={{ fontSize: 11, color: v.change > 0 ? C.lime : C.red }}>{v.change > 0 ? "▲" : "▼"} {Math.abs(v.change)}%</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>How to Improve</div>
              {[
                { action: "Reduce sales cycle by 5 days", impact: "+R433/day" },
                { action: "Increase win rate to 50%", impact: "+R782/day" },
                { action: "Add 2 more opportunities", impact: "+R821/day" }
              ].map((item) => (
                <div key={item.action} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                  <span style={{ fontSize: 12 }}>{item.action}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>{item.impact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
