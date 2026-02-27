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

type Stage = "Discovery" | "Proposal Sent" | "Negotiation" | "Contract Sent";

const prospects: Array<{
  id: string;
  name: string;
  industry: string;
  stage: Stage;
  value: number;
  probability: number;
  contact: string;
  touchpoints: number;
  lastContact: string;
  source: string;
  daysInStage: number;
}> = [
  { id: "PRO-012", name: "Horizon Media", industry: "Media & Publishing", stage: "Discovery", value: 28000, probability: 40, contact: "Aisha Okafor", touchpoints: 3, lastContact: "Feb 20", source: "Referral", daysInStage: 5 },
  { id: "PRO-013", name: "Apex Financial", industry: "Finance", stage: "Proposal Sent", value: 45000, probability: 60, contact: "David Nkosi", touchpoints: 7, lastContact: "Feb 22", source: "LinkedIn", daysInStage: 12 },
  { id: "PRO-014", name: "Bloom Wellness", industry: "Health & Wellness", stage: "Negotiation", value: 22000, probability: 75, contact: "Priya Singh", touchpoints: 11, lastContact: "Feb 21", source: "Conference", daysInStage: 19 },
  { id: "PRO-015", name: "Craft & Co", industry: "Retail", stage: "Contract Sent", value: 18000, probability: 90, contact: "Marco Russo", touchpoints: 14, lastContact: "Feb 23", source: "Referral", daysInStage: 4 },
  { id: "PRO-016", name: "Stellenbosch Wines", industry: "FMCG", stage: "Discovery", value: 55000, probability: 25, contact: "Elise van der Berg", touchpoints: 2, lastContact: "Feb 18", source: "Cold Outreach", daysInStage: 8 },
];

const partnerships = [
  { partner: "Studio Outpost", type: "Production Partner", status: "active", dealsReferred: 3, revenueGenerated: 142000, since: "Jan 2025" },
  { partner: "Figma Community SA", type: "Community Partner", status: "active", dealsReferred: 1, revenueGenerated: 28000, since: "Jun 2025" },
  { partner: "Cape Design Week", type: "Sponsorship", status: "exploring", dealsReferred: 0, revenueGenerated: 0, since: "Feb 2026" },
];

const segments = [
  { name: "Finance & Legal", clients: 2, avgMRR: 24500, winRate: 44, color: C.purple },
  { name: "Creative & Media", clients: 2, avgMRR: 22000, winRate: 58, color: C.lime },
  { name: "Healthcare", clients: 1, avgMRR: 21600, winRate: 62, color: C.blue },
  { name: "Professional Services", clients: 1, avgMRR: 12000, winRate: 71, color: C.orange },
];

const stageOrder: Stage[] = ["Discovery", "Proposal Sent", "Negotiation", "Contract Sent"];
const stageColors: Record<Stage, string> = {
  Discovery: C.blue,
  "Proposal Sent": C.purple,
  Negotiation: C.amber,
  "Contract Sent": C.lime,
};

const tabs = ["pipeline", "partnerships", "market segments", "targets"] as const;
type Tab = (typeof tabs)[number];
type ViewMode = "list" | "kanban";

export function BusinessDevelopmentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const weightedPipeline = prospects.reduce((s, p) => s + (p.value * p.probability) / 100, 0);
  const totalPipeline = prospects.reduce((s, p) => s + p.value, 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / BUSINESS DEVELOPMENT</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Business Development</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Prospects - Partnerships - Market segments - Growth targets</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Export Pipeline</button>
          <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Add Prospect</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Pipeline", value: `R${(totalPipeline / 1000).toFixed(0)}k`, color: C.lime, sub: `${prospects.length} prospects` },
          { label: "Weighted Pipeline", value: `R${(weightedPipeline / 1000).toFixed(0)}k`, color: C.blue, sub: "Probability-adjusted" },
          { label: "Avg Deal Size", value: `R${Math.round(totalPipeline / prospects.length / 1000).toFixed(0)}k`, color: C.purple, sub: "Target: R35k" },
          { label: "Close Rate (90d)", value: "42%", color: C.amber, sub: "3 won - 4 lost" },
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

      {activeTab === "pipeline" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["list", "kanban"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  background: viewMode === m ? C.lime : C.surface,
                  color: viewMode === m ? C.bg : C.muted,
                  border: `1px solid ${viewMode === m ? C.lime : C.border}`,
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {viewMode === "list" && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 100px 80px 80px 120px 100px auto", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {["ID", "Company", "Stage", "Value", "Prob.", "Touches", "Last Contact", "Source", ""].map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
              {prospects.map((p, i) => (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 100px 80px 80px 120px 100px auto", padding: "14px 24px", borderBottom: i < prospects.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{p.id}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {p.industry} - {p.contact}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: stageColors[p.stage], background: `${stageColors[p.stage]}18`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{p.stage}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{(p.value / 1000).toFixed(0)}k</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: p.probability >= 75 ? C.lime : p.probability >= 50 ? C.amber : C.muted }}>{p.probability}%</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.blue }}>{p.touchpoints}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>{p.lastContact}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{p.source}</span>
                  <button style={{ background: C.border, border: "none", color: C.text, padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Open</button>
                </div>
              ))}
            </div>
          )}

          {viewMode === "kanban" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {stageOrder.map((stage) => {
                const stageProspects = prospects.filter((p) => p.stage === stage);
                const stageValue = stageProspects.reduce((s, p) => s + p.value, 0);
                return (
                  <div key={stage}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: stageColors[stage], textTransform: "uppercase", letterSpacing: "0.06em" }}>{stage}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>R{(stageValue / 1000).toFixed(0)}k</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {stageProspects.map((p) => (
                        <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>{p.industry}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                            <span style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{(p.value / 1000).toFixed(0)}k</span>
                            <span style={{ color: C.muted }}>{p.probability}% win</span>
                          </div>
                          <div style={{ marginTop: 8, height: 3, background: C.border, borderRadius: 2 }}>
                            <div style={{ height: "100%", width: `${p.probability}%`, background: stageColors[stage], borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                            {p.daysInStage}d in stage - {p.touchpoints} touches
                          </div>
                        </div>
                      ))}
                      {stageProspects.length === 0 && <div style={{ padding: 20, border: `1px dashed ${C.border}`, borderRadius: 8, textAlign: "center", color: C.muted, fontSize: 12 }}>No prospects</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "partnerships" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {partnerships.map((p) => (
            <div key={p.partner} style={{ background: C.surface, border: `1px solid ${p.status === "exploring" ? `${C.amber}44` : C.border}`, borderRadius: 10, padding: 24, display: "grid", gridTemplateColumns: "1fr 140px 100px 120px 120px auto", alignItems: "center", gap: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.partner}</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {p.type} - Since {p.since}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Deals Referred</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.blue }}>{p.dealsReferred}</div>
              </div>
              <span style={{ fontSize: 10, color: p.status === "active" ? C.lime : C.amber, background: `${p.status === "active" ? C.lime : C.amber}15`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{p.status}</span>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Revenue Generated</div>
                <div style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>{p.revenueGenerated > 0 ? `R${(p.revenueGenerated / 1000).toFixed(0)}k` : "-"}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>View</button>
                <button style={{ background: `${C.lime}15`, border: `1px solid ${C.lime}44`, color: C.lime, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Contact</button>
              </div>
            </div>
          ))}
          <button style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10, padding: 20, color: C.muted, fontSize: 13, cursor: "pointer", textAlign: "center" }}>+ Add Partnership</button>
        </div>
      )}

      {activeTab === "market segments" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {segments.map((seg) => (
            <div key={seg.name} style={{ background: C.surface, border: `1px solid ${seg.color}44`, borderRadius: 10, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{seg.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {seg.clients} active client{seg.clients !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: seg.color, marginTop: 4 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: 14, background: C.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Avg MRR</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: seg.color, fontSize: 18 }}>R{(seg.avgMRR / 1000).toFixed(1)}k</div>
                </div>
                <div style={{ padding: 14, background: C.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Win Rate</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: seg.winRate > 60 ? C.lime : C.amber, fontSize: 18 }}>{seg.winRate}%</div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Win rate vs avg (42%)</span>
                  <span style={{ fontSize: 12, color: seg.winRate > 42 ? C.lime : C.red }}>{seg.winRate > 42 ? "+" : ""}{seg.winRate - 42}pp</span>
                </div>
                <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${seg.winRate}%`, background: seg.color, borderRadius: 3 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "targets" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Q1 2026 BD Targets</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { target: "New clients won", goal: 4, current: 3, color: C.lime },
                { target: "MRR from new biz", goal: 80000, current: 57000, color: C.blue, format: "R" },
                { target: "Proposals sent", goal: 12, current: 9, color: C.purple },
                { target: "Discovery calls", goal: 20, current: 14, color: C.amber },
              ].map((t) => {
                const pct = Math.min((t.current / t.goal) * 100, 100);
                return (
                  <div key={t.target}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13 }}>{t.target}</span>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                        <span style={{ color: t.color, fontWeight: 700 }}>{t.format}{typeof t.current === "number" && t.format === "R" ? `${(t.current / 1000).toFixed(0)}k` : t.current}</span>
                        <span style={{ color: C.muted }}>
                          {" "}/ {t.format}
                          {typeof t.goal === "number" && t.format === "R" ? `${(t.goal / 1000).toFixed(0)}k` : t.goal}
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: t.color, borderRadius: 4, transition: "width 0.8s" }} />
                    </div>
                    <div style={{ fontSize: 10, color: pct >= 75 ? C.lime : pct >= 50 ? C.amber : C.red, marginTop: 3, textAlign: "right" }}>{pct.toFixed(0)}% of target</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Lead Sources</div>
              {[
                { source: "Referral", count: 3, pct: 60, color: C.lime },
                { source: "LinkedIn", count: 1, pct: 20, color: C.blue },
                { source: "Conference", count: 1, pct: 20, color: C.purple },
                { source: "Cold Outreach", count: 1, pct: 20, color: C.muted },
              ].map((s) => (
                <div key={s.source} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: C.muted, width: 110 }}>{s.source}</span>
                  <div style={{ flex: 1, height: 8, background: C.border, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: s.color, width: 20 }}>{s.count}</span>
                </div>
              ))}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.lime}22`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: C.lime, textTransform: "uppercase" }}>2026 Annual Target</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 40, fontWeight: 800, color: C.lime, marginBottom: 4 }}>R500k</div>
              <div style={{ fontSize: 12, color: C.muted }}>
                MRR by Dec 2026. Currently at R398.6k - <span style={{ color: C.lime }}>79.7%</span> of target with 10 months remaining.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
