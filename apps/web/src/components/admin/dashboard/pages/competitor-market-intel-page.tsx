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

type CompetitorType = "Direct" | "Adjacent" | "Indirect";
type CompetitorTier = "Same tier" | "Below us" | "Above us";
type Outcome = "won" | "lost" | "pending";
type Tab = "competitors" | "win/loss analysis" | "market rates" | "positioning";

const competitors: Array<{
  id: number;
  name: string;
  type: CompetitorType;
  tier: CompetitorTier;
  color: string;
  avgRetainer: number;
  services: string[];
  strengths: string[];
  weaknesses: string[];
  pricing: string;
  positioning: string;
  lastUpdated: string;
  winLoss: { won: number; lost: number };
}> = [
  {
    id: 1,
    name: "Lemon & Clay",
    type: "Direct",
    tier: "Same tier",
    color: C.red,
    avgRetainer: 32000,
    services: ["Branding", "Web", "Social"],
    strengths: ["Strong portfolio", "Award-winning", "Faster turnaround"],
    weaknesses: ["No strategy", "Less personal AM", "Higher churn"],
    pricing: "R28k-R45k/mo",
    positioning: "Premium creative studio",
    lastUpdated: "Feb 2026",
    winLoss: { won: 3, lost: 5 },
  },
  {
    id: 2,
    name: "Brandcraft SA",
    type: "Direct",
    tier: "Below us",
    color: C.orange,
    avgRetainer: 18000,
    services: ["Branding", "Social"],
    strengths: ["Price competitive", "Fast delivery"],
    weaknesses: ["Limited strategy", "No UX", "Junior team"],
    pricing: "R12k-R22k/mo",
    positioning: "Affordable creative",
    lastUpdated: "Jan 2026",
    winLoss: { won: 6, lost: 2 },
  },
  {
    id: 3,
    name: "The Collective JHB",
    type: "Adjacent",
    tier: "Above us",
    color: C.purple,
    avgRetainer: 85000,
    services: ["Strategy", "Branding", "Dev", "PR"],
    strengths: ["Full-service", "Enterprise clients", "PR network"],
    weaknesses: ["Expensive", "Slow", "Bureaucratic"],
    pricing: "R60k-R120k/mo",
    positioning: "Full-service agency",
    lastUpdated: "Jan 2026",
    winLoss: { won: 1, lost: 3 },
  },
  {
    id: 4,
    name: "Freelance Aggregators",
    type: "Indirect",
    tier: "Below us",
    color: C.amber,
    avgRetainer: 8000,
    services: ["Design", "Copy"],
    strengths: ["Very cheap", "Flexible"],
    weaknesses: ["No AM", "Inconsistent", "No strategy"],
    pricing: "R3k-R12k/mo",
    positioning: "Cost-first buyers",
    lastUpdated: "Dec 2025",
    winLoss: { won: 4, lost: 1 },
  },
];

const winLossLog: Array<{
  date: string;
  prospect: string;
  outcome: Outcome;
  competitorLost: string | null;
  reason: string;
}> = [
  { date: "Feb 2026", prospect: "Horizon Media", outcome: "pending", competitorLost: null, reason: "Proposal sent, awaiting response" },
  { date: "Jan 2026", prospect: "Helios Digital", outcome: "lost", competitorLost: "Lemon & Clay", reason: "Chose competitor for faster onboarding" },
  { date: "Jan 2026", prospect: "Vivid Commerce", outcome: "won", competitorLost: "Brandcraft SA", reason: "Won on strategy depth + AM experience" },
  { date: "Dec 2025", prospect: "Urban Co-op", outcome: "lost", competitorLost: "The Collective JHB", reason: "Budget expanded, went full-service" },
  { date: "Dec 2025", prospect: "Solar Sense", outcome: "won", competitorLost: "Brandcraft SA", reason: "Client valued long-term partnership over price" },
];

const marketRates = [
  { service: "Brand Identity", maphari: 22000, marketLow: 8000, marketMid: 18000, marketHigh: 45000 },
  { service: "Retainer - Core", maphari: 28000, marketLow: 12000, marketMid: 22000, marketHigh: 65000 },
  { service: "Website Design & Dev", maphari: 42000, marketLow: 15000, marketMid: 38000, marketHigh: 95000 },
  { service: "Social Media Mgmt", maphari: 12000, marketLow: 4000, marketMid: 9000, marketHigh: 22000 },
];

const tabs: Tab[] = ["competitors", "win/loss analysis", "market rates", "positioning"];

export function CompetitorMarketIntelPage() {
  const [activeTab, setActiveTab] = useState<Tab>("competitors");
  const [selectedComp, setSelectedComp] = useState(1);

  const totalWon = winLossLog.filter((w) => w.outcome === "won").length;
  const totalLost = winLossLog.filter((w) => w.outcome === "lost").length;
  const winRate = totalWon + totalLost > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : 0;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / MARKET INTELLIGENCE</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Competitor &amp; Market Intel</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Competitor tracking - Win/loss - Market rates - Positioning</div>
        </div>
        <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Add Competitor</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Win Rate (6mo)", value: `${winRate}%`, color: winRate >= 50 ? C.lime : C.amber, sub: `${totalWon} won - ${totalLost} lost` },
          { label: "Tracked Competitors", value: competitors.length.toString(), color: C.blue, sub: `${competitors.filter((c) => c.type === "Direct").length} direct` },
          { label: "Most Common Rival", value: "Lemon & Clay", color: C.red, sub: "Lost to 2x in 90d" },
          { label: "Market Position", value: "Mid-Premium", color: C.purple, sub: "Between Brandcraft & Collective" },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: s.label === "Most Common Rival" ? 18 : 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
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

      {activeTab === "competitors" && (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {competitors.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedComp(c.id)}
                style={{
                  background: selectedComp === c.id ? `${c.color}15` : C.surface,
                  border: `1px solid ${selectedComp === c.id ? `${c.color}66` : C.border}`,
                  borderRadius: 10,
                  padding: 16,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4, color: selectedComp === c.id ? c.color : C.text }}>{c.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>
                  {c.type} - {c.tier}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: C.lime, fontFamily: "DM Mono, monospace" }}>W:{c.winLoss.won}</span>
                  <span style={{ color: C.red, fontFamily: "DM Mono, monospace" }}>L:{c.winLoss.lost}</span>
                </div>
              </div>
            ))}
          </div>

          {(() => {
            const comp = competitors.find((c) => c.id === selectedComp);
            if (!comp) return null;
            return (
              <div style={{ background: C.surface, border: `1px solid ${comp.color}44`, borderRadius: 10, padding: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: comp.color, marginBottom: 4 }}>{comp.name}</div>
                    <div style={{ fontSize: 13, color: C.muted }}>{comp.positioning}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Win/Loss vs them</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 20, fontWeight: 800 }}>
                      <span style={{ color: C.lime }}>{comp.winLoss.won}W</span>
                      <span style={{ color: C.muted }}> / </span>
                      <span style={{ color: C.red }}>{comp.winLoss.lost}L</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
                  <div style={{ padding: 14, background: C.bg, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Type</div>
                    <div style={{ fontWeight: 600 }}>{comp.type}</div>
                  </div>
                  <div style={{ padding: 14, background: C.bg, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Pricing Range</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{comp.pricing}</div>
                  </div>
                  <div style={{ padding: 14, background: C.bg, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Services</div>
                    <div style={{ fontSize: 12 }}>{comp.services.join(", ")}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Their Strengths</div>
                    {comp.strengths.map((s) => (
                      <div key={s} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13 }}>
                        <span style={{ color: C.red }}>▲</span> {s}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.lime, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Their Weaknesses</div>
                    {comp.weaknesses.map((w) => (
                      <div key={w} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13 }}>
                        <span style={{ color: C.lime }}>✓</span> {w}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 20, padding: 16, background: C.surface, borderRadius: 8, borderLeft: `3px solid ${C.lime}` }}>
                  <div style={{ fontSize: 11, color: C.lime, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>How to Beat Them</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                    {comp.name === "Lemon & Clay" && "Emphasise our strategic depth, personal AM relationship, and retainer flexibility. Lead with client retention stats."}
                    {comp.name === "Brandcraft SA" && "Win on quality, strategy, and AM attentiveness. Don't compete on price - anchor on outcomes."}
                    {comp.name === "The Collective JHB" && "Position as a boutique alternative - faster decisions, closer relationships, 70% of the output at 40% of the cost."}
                    {comp.name === "Freelance Aggregators" && "Sell consistency, accountability, and a single point of contact. Show cost of coordination overhead."}
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 10, color: C.muted, textAlign: "right" }}>Last updated: {comp.lastUpdated}</div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "win/loss analysis" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 160px 1fr", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {["Date", "Prospect", "Outcome", "Lost To", "Key Reason"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {winLossLog.map((w, i) => (
              <div key={w.date + w.prospect} style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 160px 1fr", padding: "14px 24px", borderBottom: i < winLossLog.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", background: w.outcome === "won" ? C.surface : w.outcome === "lost" ? C.surface : "transparent" }}>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{w.date}</span>
                <span style={{ fontWeight: 600 }}>{w.prospect}</span>
                <span style={{ fontSize: 10, color: w.outcome === "won" ? C.lime : w.outcome === "lost" ? C.red : C.amber, fontFamily: "DM Mono, monospace", textTransform: "uppercase" }}>{w.outcome}</span>
                <span style={{ fontSize: 12, color: w.competitorLost ? C.red : C.muted }}>{w.competitorLost || "-"}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{w.reason}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Summary</div>
              <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1, padding: 16, background: C.surface, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: C.lime, fontFamily: "DM Mono, monospace" }}>{totalWon}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Won</div>
                </div>
                <div style={{ flex: 1, padding: 16, background: C.surface, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: C.red, fontFamily: "DM Mono, monospace" }}>{totalLost}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Lost</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Win Rate</div>
              <div style={{ height: 12, background: C.border, borderRadius: 6, marginBottom: 6 }}>
                <div style={{ height: "100%", width: `${winRate}%`, background: winRate >= 50 ? C.lime : C.amber, borderRadius: 6 }} />
              </div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 28, fontWeight: 800, color: winRate >= 50 ? C.lime : C.amber, textAlign: "center", marginTop: 8 }}>{winRate}%</div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Lost To (count)</div>
              {competitors
                .filter((c) => c.type === "Direct")
                .map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                    <span style={{ fontSize: 13 }}>{c.name}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", color: C.red, fontWeight: 700 }}>{c.winLoss.lost}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "market rates" && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 20, fontSize: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: C.lime }}>■</span> Maphari
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: C.blue }}>■</span> Market Mid
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: C.muted }}>◁▷</span> Market Range
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 1fr", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {["Service", "Maphari", "Mkt Low", "Mkt Mid", "Position"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {marketRates.map((rate, i) => {
            const range = rate.marketHigh - rate.marketLow;
            const maphariFraction = (rate.maphari - rate.marketLow) / range;
            const midFraction = (rate.marketMid - rate.marketLow) / range;
            const vsMarket = Math.round(((rate.maphari - rate.marketMid) / rate.marketMid) * 100);
            return (
              <div key={rate.service} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 1fr", padding: "18px 24px", borderBottom: i < marketRates.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>{rate.service}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{(rate.maphari / 1000).toFixed(0)}k</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>R{(rate.marketLow / 1000).toFixed(0)}k</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.blue }}>R{(rate.marketMid / 1000).toFixed(0)}k</span>
                <div>
                  <div style={{ position: "relative", height: 12, background: C.border, borderRadius: 6, marginBottom: 4 }}>
                    <div style={{ position: "absolute", left: 0, right: 0, height: "100%", background: `${C.blue}20`, borderRadius: 6 }} />
                    <div style={{ position: "absolute", left: `${midFraction * 100}%`, top: 0, bottom: 0, width: 2, background: C.blue }} />
                    <div style={{ position: "absolute", left: `${Math.min(maphariFraction * 100, 95)}%`, top: -2, width: 6, height: 16, borderRadius: 3, background: C.lime }} />
                  </div>
                  <div style={{ fontSize: 11, color: vsMarket > 0 ? C.amber : C.lime }}>{vsMarket > 0 ? `+${vsMarket}%` : `${vsMarket}%`} vs market mid</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "positioning" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Positioning Map</div>
            <div style={{ position: "relative", width: "100%", paddingBottom: "100%", background: C.bg, borderRadius: 8 }}>
              <div style={{ position: "absolute", inset: 0 }}>
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: C.border }} />
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: C.border }} />
                <span style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: C.muted }}>High Specialisation</span>
                <span style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: C.muted }}>Generalised</span>
                <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%) rotate(-90deg)", fontSize: 10, color: C.muted }}>Low Price</span>
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%) rotate(90deg)", fontSize: 10, color: C.muted }}>High Price</span>
                {[
                  { name: "Maphari", x: 72, y: 38, color: C.lime, isUs: true },
                  { name: "Lemon & Clay", x: 68, y: 55, color: C.red },
                  { name: "Brandcraft SA", x: 40, y: 25, color: C.orange },
                  { name: "The Collective", x: 55, y: 80, color: C.purple },
                  { name: "Freelancers", x: 25, y: 15, color: C.amber },
                ].map((dot) => (
                  <div key={dot.name} style={{ position: "absolute", left: `${dot.x}%`, top: `${100 - dot.y}%`, transform: "translate(-50%, -50%)" }}>
                    <div style={{ width: dot.isUs ? 16 : 12, height: dot.isUs ? 16 : 12, borderRadius: "50%", background: dot.color, border: dot.isUs ? "2px solid #fff" : "none", boxShadow: dot.isUs ? `0 0 12px ${dot.color}` : "none" }} />
                    <div style={{ fontSize: dot.isUs ? 11 : 9, color: dot.color, fontWeight: dot.isUs ? 700 : 400, whiteSpace: "nowrap", marginTop: 4, textAlign: "center", transform: "translateX(-30%)" }}>{dot.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.lime}33`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em", color: C.lime }}>Maphari&apos;s Positioning</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>Mid-premium creative agency for ambitious South African brands. We offer specialist strategy + design with personal account management - at a price point between boutique freelancers and full-service agencies.</div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Key Differentiators</div>
              {[
                { label: "Strategic AM model", desc: "Every client has a dedicated AM - not just a designer" },
                { label: "Retainer clarity", desc: "Transparent hour tracking with monthly burn reports" },
                { label: "Mid-market pricing", desc: "Premium quality without full-service price tag" },
                { label: "Client portal", desc: "Self-service visibility into projects, invoices, and reports" },
              ].map((d) => (
                <div key={d.label} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.lime, fontSize: 14, flexShrink: 0 }}>◎</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{d.label}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
