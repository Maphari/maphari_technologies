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

type Segment = "Champion" | "Growth" | "At Risk" | "New";

type Client = {
  id: number;
  name: string;
  avatar: string;
  color: string;
  segment: Segment;
  ltv: number;
  cac: number;
  mrr: number;
  tenure: number;
  health: number;
  churnRisk: number;
  upsellScore: number;
  retainerTier: "Core" | "Growth" | "Enterprise";
  industry: string;
  revenueGrowth: number;
  netMargin: number;
  touchpoints: number;
  lastUpsell: string;
};

const clients: Client[] = [
  {
    id: 1,
    name: "Volta Studios",
    avatar: "VS",
    color: C.lime,
    segment: "Champion",
    ltv: 412000,
    cac: 8200,
    mrr: 28000,
    tenure: 18,
    health: 91,
    churnRisk: 4,
    upsellScore: 82,
    retainerTier: "Growth",
    industry: "Creative Agency",
    revenueGrowth: +14,
    netMargin: 64,
    touchpoints: 12,
    lastUpsell: "Oct 2025"
  },
  {
    id: 2,
    name: "Kestrel Capital",
    avatar: "KC",
    color: C.purple,
    segment: "At Risk",
    ltv: 168000,
    cac: 12000,
    mrr: 21000,
    tenure: 9,
    health: 58,
    churnRisk: 71,
    upsellScore: 22,
    retainerTier: "Core",
    industry: "Finance",
    revenueGrowth: -8,
    netMargin: 52,
    touchpoints: 4,
    lastUpsell: "Never"
  },
  {
    id: 3,
    name: "Mira Health",
    avatar: "MH",
    color: C.blue,
    segment: "Growth",
    ltv: 258000,
    cac: 9400,
    mrr: 21600,
    tenure: 12,
    health: 74,
    churnRisk: 22,
    upsellScore: 61,
    retainerTier: "Core",
    industry: "Healthcare",
    revenueGrowth: +6,
    netMargin: 58,
    touchpoints: 8,
    lastUpsell: "Dec 2025"
  },
  {
    id: 4,
    name: "Dune Collective",
    avatar: "DC",
    color: C.amber,
    segment: "At Risk",
    ltv: 192000,
    cac: 6800,
    mrr: 16000,
    tenure: 7,
    health: 43,
    churnRisk: 64,
    upsellScore: 18,
    retainerTier: "Core",
    industry: "Media",
    revenueGrowth: -12,
    netMargin: 41,
    touchpoints: 3,
    lastUpsell: "Never"
  },
  {
    id: 5,
    name: "Okafor & Sons",
    avatar: "OS",
    color: C.orange,
    segment: "Champion",
    ltv: 288000,
    cac: 5200,
    mrr: 12000,
    tenure: 24,
    health: 96,
    churnRisk: 6,
    upsellScore: 74,
    retainerTier: "Core",
    industry: "Professional Services",
    revenueGrowth: +9,
    netMargin: 71,
    touchpoints: 10,
    lastUpsell: "Nov 2025"
  }
];

const segmentConfig: Record<Segment, { color: string; icon: string; desc: string }> = {
  Champion: { color: C.lime, icon: "★", desc: "High LTV, high health, low churn risk" },
  Growth: { color: C.blue, icon: "↑", desc: "Expanding engagement, strong potential" },
  "At Risk": { color: C.red, icon: "⚠", desc: "Declining health, high churn probability" },
  New: { color: C.purple, icon: "◈", desc: "Recent clients, establishing relationship" }
};

const cohorts = [
  { quarter: "Q1 2024", clients: 2, avgLTV: 280000, retentionRate: 100, churned: 0 },
  { quarter: "Q2 2024", clients: 1, avgLTV: 192000, retentionRate: 100, churned: 0 },
  { quarter: "Q3 2024", clients: 1, avgLTV: 258000, retentionRate: 100, churned: 0 },
  { quarter: "Q4 2024", clients: 0, avgLTV: 0, retentionRate: 0, churned: 0 },
  { quarter: "Q1 2025", clients: 2, avgLTV: 168000, retentionRate: 50, churned: 1 }
] as const;

const tabs = ["segmentation", "ltv & cac", "churn prediction", "cohort analysis", "upsell targets"] as const;

type Tab = (typeof tabs)[number];

function SegmentBadge({ segment }: { segment: Segment }) {
  const cfg = segmentConfig[segment];
  return (
    <span style={{ fontSize: 10, color: cfg.color, background: `${cfg.color}18`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {cfg.icon} {segment}
    </span>
  );
}

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 700, color, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function StrategicClientIntelligencePage() {
  const [activeTab, setActiveTab] = useState<Tab>("segmentation");
  const [selectedSegment, setSelectedSegment] = useState<"All" | Segment>("All");

  const filtered = selectedSegment === "All" ? clients : clients.filter((c) => c.segment === selectedSegment);
  const totalLTV = clients.reduce((s, c) => s + c.ltv, 0);
  const avgCAC = Math.round(clients.reduce((s, c) => s + c.cac, 0) / clients.length);
  const atRisk = clients.filter((c) => c.churnRisk > 50).length;
  const upsellReady = clients.filter((c) => c.upsellScore > 60).length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / CLIENT SEGMENTATION</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Strategic Client Intelligence</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>LTV · CAC · Churn risk · Cohort analysis · Upsell scoring</div>
        </div>
        <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Export Segment Report</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Portfolio LTV", value: `R${(totalLTV / 1000).toFixed(0)}k`, color: C.lime, sub: "Across 5 clients" },
          { label: "Avg CAC", value: `R${(avgCAC / 1000).toFixed(1)}k`, color: C.blue, sub: "Cost per acquisition" },
          { label: "At-Risk Clients", value: atRisk.toString(), color: C.red, sub: "Churn risk > 50%" },
          { label: "Upsell Ready", value: upsellReady.toString(), color: C.purple, sub: "Score > 60" }
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
              transition: "all 0.2s"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "segmentation" ? (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["All", ...Object.keys(segmentConfig)] as Array<"All" | Segment>).map((seg) => (
              <button
                key={seg}
                onClick={() => setSelectedSegment(seg)}
                style={{
                  background: selectedSegment === seg ? segmentConfig[seg as Segment]?.color || C.lime : C.surface,
                  color: selectedSegment === seg ? C.bg : C.muted,
                  border: `1px solid ${selectedSegment === seg ? segmentConfig[seg as Segment]?.color || C.lime : C.border}`,
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "DM Mono, monospace"
                }}
              >
                {seg}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {filtered.map((c) => (
              <div key={c.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <Avatar initials={c.avatar} color={c.color} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{c.industry} · {c.tenure} months</div>
                  </div>
                  <div style={{ marginLeft: "auto" }}><SegmentBadge segment={c.segment} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { label: "LTV", value: `R${(c.ltv / 1000).toFixed(0)}k`, color: C.lime },
                    { label: "MRR", value: `R${(c.mrr / 1000).toFixed(0)}k`, color: C.blue },
                    { label: "Health", value: `${c.health}`, color: c.health >= 80 ? C.lime : c.health >= 60 ? C.amber : C.red },
                    { label: "Churn Risk", value: `${c.churnRisk}%`, color: c.churnRisk > 50 ? C.red : c.churnRisk > 25 ? C.amber : C.lime },
                    { label: "Net Margin", value: `${c.netMargin}%`, color: C.purple },
                    { label: "Upsell Score", value: `${c.upsellScore}`, color: c.upsellScore > 60 ? C.lime : C.muted }
                  ].map((stat) => (
                    <div key={stat.label} style={{ padding: 12, background: C.bg, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{stat.label}</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 16, color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "ltv & cac" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>LTV Ranking</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[...clients].sort((a, b) => b.ltv - a.ltv).map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 11, color: C.muted, width: 16, fontFamily: "DM Mono, monospace" }}>#{i + 1}</div>
                  <Avatar initials={c.avatar} color={c.color} size={30} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{(c.ltv / 1000).toFixed(0)}k</span>
                    </div>
                    <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${(c.ltv / clients[0].ltv) * 100}%`, background: c.color, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>CAC: R{c.cac.toLocaleString()} · LTV:CAC = {(c.ltv / c.cac).toFixed(1)}x</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {clients.map((c) => {
              const ratio = Number((c.ltv / c.cac).toFixed(1));
              const ratioColor = ratio >= 5 ? C.lime : ratio >= 3 ? C.amber : C.red;
              return (
                <div key={c.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar initials={c.avatar} color={c.color} size={28} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>CAC: R{c.cac.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: C.muted }}>LTV:CAC</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 20, fontWeight: 800, color: ratioColor }}>{ratio.toFixed(1)}x</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "churn prediction" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...clients].sort((a, b) => b.churnRisk - a.churnRisk).map((c) => (
              <div key={c.id} style={{ background: C.surface, border: `1px solid ${c.churnRisk > 50 ? `${C.red}55` : C.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 80px 80px 80px auto", alignItems: "center", gap: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar initials={c.avatar} color={c.color} size={32} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{c.segment}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>Churn Risk</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, fontWeight: 800, color: c.churnRisk > 50 ? C.red : c.churnRisk > 25 ? C.amber : C.lime }}>{c.churnRisk}%</span>
                    </div>
                    <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
                      <div style={{ height: "100%", width: `${c.churnRisk}%`, background: c.churnRisk > 50 ? C.red : c.churnRisk > 25 ? C.amber : C.lime, borderRadius: 4, transition: "width 0.8s" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Health</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: c.health >= 80 ? C.lime : c.health >= 60 ? C.amber : C.red }}>{c.health}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Growth</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: c.revenueGrowth > 0 ? C.lime : C.red }}>{c.revenueGrowth > 0 ? "+" : ""}{c.revenueGrowth}%</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Touches</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700 }}>{c.touchpoints}</div>
                  </div>
                  {c.churnRisk > 50 ? (
                    <button style={{ background: C.red, color: "#fff", border: "none", padding: "8px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Recovery Plan</button>
                  ) : (
                    <button style={{ background: C.border, border: "none", color: C.text, padding: "8px 14px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Monitor</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.red}33`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 12, textTransform: "uppercase" }}>⚠ Churn Risk Summary</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
                <div><span style={{ color: C.red }}>2 clients</span> above 50% churn risk</div>
                <div>Estimated revenue at risk: <span style={{ color: C.red }}>R37,000/mo</span></div>
                <div>Recovery window: <span style={{ color: C.amber }}>30–45 days</span></div>
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Churn Signals</div>
              {[
                "Silent 6+ days",
                "Overdue invoice",
                "Retainer above 90%",
                "Health drop > 10pts",
                "Missed milestone",
                "Reduced touchpoints"
              ].map((signal) => (
                <div key={signal} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, flexShrink: 0 }} />
                  {signal}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "cohort analysis" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Acquisition Cohorts</div>
            <div style={{ display: "grid", gridTemplateColumns: "100px 80px 100px 100px 80px", padding: "10px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {["Quarter", "Clients", "Avg LTV", "Retention", "Churned"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {cohorts.map((c, i) => (
              <div key={c.quarter} style={{ display: "grid", gridTemplateColumns: "100px 80px 100px 100px 80px", padding: "14px 24px", borderBottom: i < cohorts.length - 1 ? `1px solid ${C.border}` : "none", fontSize: 13, alignItems: "center" }}>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{c.quarter}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.blue }}>{c.clients}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.lime }}>{c.avgLTV > 0 ? `R${(c.avgLTV / 1000).toFixed(0)}k` : "—"}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: c.retentionRate === 100 ? C.lime : c.retentionRate >= 75 ? C.amber : C.red }}>{c.retentionRate > 0 ? `${c.retentionRate}%` : "—"}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: c.churned > 0 ? C.red : C.muted }}>{c.churned}</span>
              </div>
            ))}
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Overall Retention</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ textAlign: "center", padding: 32, background: C.bg, borderRadius: 12 }}>
                <div style={{ fontSize: 56, fontWeight: 800, color: C.lime, fontFamily: "DM Mono, monospace" }}>80%</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>12-month client retention</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Total Acquired", value: "6", color: C.blue },
                  { label: "Currently Active", value: "5", color: C.lime },
                  { label: "Churned", value: "1", color: C.red },
                  { label: "Avg Tenure", value: "14mo", color: C.amber }
                ].map((s) => (
                  <div key={s.label} style={{ padding: 16, background: C.bg, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "upsell targets" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.lime}22`, borderRadius: 10, padding: 16, fontSize: 13, color: C.muted }}>
            Upsell score is calculated from: retainer headroom, health score, tenure, recent NPS, and engagement frequency.
          </div>
          {[...clients].sort((a, b) => b.upsellScore - a.upsellScore).map((c) => (
            <div key={c.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 140px 160px auto", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar initials={c.avatar} color={c.color} size={32} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{c.retainerTier} tier</div>
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: C.muted }}>Upsell Score</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: c.upsellScore > 60 ? C.lime : c.upsellScore > 35 ? C.amber : C.muted }}>{c.upsellScore}/100</span>
                  </div>
                  <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${c.upsellScore}%`, background: c.upsellScore > 60 ? C.lime : c.upsellScore > 35 ? C.amber : C.muted, borderRadius: 4, transition: "width 0.8s" }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Last Upsell</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.lastUpsell === "Never" ? C.red : C.muted }}>{c.lastUpsell}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Suggested Move</div>
                  <div style={{ fontSize: 12, color: C.lime, fontWeight: 600 }}>
                    {c.retainerTier === "Core" && c.upsellScore > 60
                      ? "→ Growth Tier"
                      : c.retainerTier === "Growth" && c.upsellScore > 60
                        ? "→ Enterprise Tier"
                        : c.upsellScore > 35
                          ? "Add-on services"
                          : "Retain & stabilise"}
                  </div>
                </div>
                <button
                  style={{
                    background: c.upsellScore > 60 ? C.lime : C.border,
                    color: c.upsellScore > 60 ? C.bg : C.muted,
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {c.upsellScore > 60 ? "Create Proposal" : "Not Ready"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
