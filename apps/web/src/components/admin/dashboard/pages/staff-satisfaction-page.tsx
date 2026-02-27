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

type Sentiment = "positive" | "neutral" | "negative";

type PulseResult = {
  month: string;
  enps: number;
  responses: number;
  total: number;
  scores: Record<string, number>;
  openFeedback: Array<{ theme: string; sentiment: Sentiment; note: string }>;
};

const pulseResults: PulseResult[] = [
  {
    month: "Feb 2026",
    enps: 42,
    responses: 5,
    total: 6,
    scores: {
      "Overall Satisfaction": 7.8,
      "Workload Balance": 6.2,
      "Management Support": 8.1,
      "Career Growth": 7.0,
      "Team Culture": 8.6,
      "Compensation & Benefits": 6.8,
      "Tools & Resources": 7.4
    },
    openFeedback: [
      { theme: "Workload", sentiment: "negative", note: "Feeling stretched thin. Would appreciate clearer capacity limits." },
      { theme: "Culture", sentiment: "positive", note: "Love the team energy. Client wins feel genuinely celebrated." },
      { theme: "Growth", sentiment: "neutral", note: "Interested in more senior-level projects. When is the next review?" },
      { theme: "Tools", sentiment: "positive", note: "The new project management setup is much better than before." }
    ]
  },
  {
    month: "Jan 2026",
    enps: 38,
    responses: 6,
    total: 6,
    scores: {
      "Overall Satisfaction": 7.4,
      "Workload Balance": 5.9,
      "Management Support": 7.9,
      "Career Growth": 6.8,
      "Team Culture": 8.2,
      "Compensation & Benefits": 6.6,
      "Tools & Resources": 7.0
    },
    openFeedback: []
  },
  {
    month: "Dec 2025",
    enps: 51,
    responses: 5,
    total: 6,
    scores: {
      "Overall Satisfaction": 8.2,
      "Workload Balance": 7.1,
      "Management Support": 8.3,
      "Career Growth": 7.2,
      "Team Culture": 9.0,
      "Compensation & Benefits": 7.0,
      "Tools & Resources": 7.6
    },
    openFeedback: []
  }
];

const sentimentConfig: Record<Sentiment, { color: string; icon: string }> = {
  positive: { color: C.primary, icon: "▲" },
  neutral: { color: C.muted, icon: "→" },
  negative: { color: C.red, icon: "▼" }
};

const tabs = ["latest pulse", "trends", "feedback themes", "survey settings"] as const;
type Tab = (typeof tabs)[number];

function scoreColor(score: number): string {
  return score >= 8 ? C.primary : score >= 7 ? C.blue : score >= 6 ? C.amber : C.red;
}

function eNPSColor(score: number): string {
  return score >= 50 ? C.primary : score >= 30 ? C.blue : score >= 10 ? C.amber : C.red;
}

export function StaffSatisfactionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("latest pulse");

  const latest = pulseResults[0];
  const prev = pulseResults[1];
  const categories = useMemo(() => Object.keys(latest.scores), [latest.scores]);

  const responseRate = Math.round((latest.responses / latest.total) * 100);
  const avgScore = (Object.values(latest.scores).reduce((s, v) => s + v, 0) / categories.length).toFixed(1);
  const lowestCategory = categories.reduce((a, b) => (latest.scores[a] < latest.scores[b] ? a : b));
  const highestCategory = categories.reduce((a, b) => (latest.scores[a] > latest.scores[b] ? a : b));

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
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Staff Satisfaction</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Monthly pulse surveys, eNPS, trends, and anonymous feedback</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>View Results</button>
          <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Send Pulse Survey</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "eNPS (Feb 2026)", value: latest.enps.toString(), color: eNPSColor(latest.enps), sub: `${latest.enps > prev.enps ? "▲" : "▼"} ${Math.abs(latest.enps - prev.enps)} vs Jan` },
          { label: "Response Rate", value: `${responseRate}%`, color: responseRate >= 80 ? C.primary : C.amber, sub: `${latest.responses}/${latest.total} staff responded` },
          { label: "Avg Score (Feb)", value: `${avgScore}/10`, color: parseFloat(avgScore) >= 7.5 ? C.primary : C.amber, sub: "Across all categories" },
          { label: "Lowest Category", value: lowestCategory.split(" ")[0], color: C.red, sub: `${latest.scores[lowestCategory]}/10 - needs attention` }
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
        {activeTab === "latest pulse" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>February 2026 - Category Scores</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {categories.map((cat) => {
                  const score = latest.scores[cat];
                  const prevScore = prev.scores[cat];
                  const delta = Number((score - prevScore).toFixed(1));
                  const color = scoreColor(score);
                  return (
                    <div key={cat} style={{ background: C.surface, border: `1px solid ${score < 7 ? `${C.amber}44` : C.border}`, padding: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 70px 70px", alignItems: "center", gap: 16 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{cat}</span>
                        <div style={{ height: 8, background: C.border }}>
                          <div style={{ height: "100%", width: `${(score / 10) * 100}%`, background: color }} />
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 20, color }}>{score}</div>
                          <div style={{ fontSize: 9, color: C.muted }}>out of 10</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 12, color: delta > 0 ? C.primary : delta < 0 ? C.red : C.muted }}>
                            {delta > 0 ? "▲" : delta < 0 ? "▼" : "→"} {Math.abs(delta)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>eNPS Score</div>
                <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 16px" }}>
                  <svg width={120} height={120} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={60} cy={60} r={50} fill="none" stroke={C.border} strokeWidth={10} />
                    <circle cx={60} cy={60} r={50} fill="none" stroke={eNPSColor(latest.enps)} strokeWidth={10} strokeDasharray={`${((latest.enps + 100) / 200) * 314} 314`} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 32, color: eNPSColor(latest.enps), lineHeight: 1 }}>{latest.enps}</div>
                    <div style={{ fontSize: 9, color: C.muted }}>eNPS</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>Range: -100 to +100</div>
                <div style={{ fontSize: 12, color: eNPSColor(latest.enps), fontWeight: 600, marginTop: 4 }}>
                  {latest.enps >= 50 ? "Excellent" : latest.enps >= 30 ? "Good" : latest.enps >= 10 ? "Needs Improvement" : "Critical"}
                </div>
              </div>

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: C.primary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Strongest</div>
                  <div style={{ fontWeight: 600 }}>{highestCategory}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: C.primary, fontSize: 22 }}>{latest.scores[highestCategory]}/10</div>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 10, color: C.red, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Weakest</div>
                  <div style={{ fontWeight: 600 }}>{lowestCategory}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: C.red, fontSize: 22 }}>{latest.scores[lowestCategory]}/10</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "trends" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {categories.map((cat) => {
              const dataPoints = pulseResults.map((r) => ({ month: r.month.slice(0, 3), score: r.scores[cat] })).reverse();
              return (
                <div key={cat} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20, display: "grid", gridTemplateColumns: "220px 1fr 60px", alignItems: "center", gap: 20 }}>
                  <span style={{ fontWeight: 600 }}>{cat}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 40 }}>
                    {dataPoints.map((dp, i) => {
                      const h = (dp.score / 10) * 40;
                      const color = scoreColor(dp.score);
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                          <div style={{ height: h, background: color, width: "100%", opacity: i === dataPoints.length - 1 ? 1 : 0.5 }} />
                          <span style={{ fontSize: 9, color: C.muted }}>{dp.month}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 20, color: scoreColor(latest.scores[cat]) }}>{latest.scores[cat]}</div>
                    <div style={{ fontSize: 9, color: C.muted }}>Feb</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "feedback themes" ? (
          <div>
            <div style={{ padding: 14, background: "#0a0f1a", border: `1px solid ${C.blue}22`, marginBottom: 20, fontSize: 12, color: C.muted }}>
              All responses are anonymous. Themes are synthesized by category. Individual responses cannot be attributed.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {latest.openFeedback.map((item, i) => {
                const sc = sentimentConfig[item.sentiment];
                return (
                  <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20, borderLeft: `4px solid ${sc.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Theme</span>
                        <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{item.theme}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 14, color: sc.color }}>{sc.icon}</span>
                        <span style={{ fontSize: 11, color: sc.color, textTransform: "capitalize" }}>{item.sentiment}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, fontStyle: "italic", padding: "10px 14px", background: C.bg }}>
                      "{item.note}"
                    </div>
                  </div>
                );
              })}
              {latest.openFeedback.length === 0 ? (
                <div style={{ padding: 24, background: C.surface, border: `1px solid ${C.border}`, textAlign: "center", fontSize: 13, color: C.muted }}>
                  No open feedback this month
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "survey settings" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Survey Schedule</div>
              {[
                { label: "Frequency", value: "Monthly (1st of each month)" },
                { label: "Response Window", value: "7 days" },
                { label: "Anonymity", value: "Full - responses not attributable" },
                { label: "Reminder", value: "3 days before close" },
                { label: "Next Survey", value: "1 Mar 2026" },
                { label: "Report Recipients", value: "Sipho Nkosi, Leilani Fotu" }
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                  <span style={{ color: C.muted }}>{s.label}</span>
                  <span style={{ fontWeight: 600 }}>{s.value}</span>
                </div>
              ))}
              <button style={{ marginTop: 20, background: C.primary, color: C.bg, border: "none", padding: "10px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Edit Settings</button>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Survey Questions</div>
              {categories.map((cat, i) => (
                <div key={cat} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, width: 20 }}>Q{i + 1}</span>
                  <span style={{ fontSize: 12, flex: 1 }}>Rate: {cat}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>1-10 scale</span>
                </div>
              ))}
              <div style={{ padding: "10px 0", fontSize: 12 }}>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, marginRight: 10 }}>Q8</span>
                <span>Open feedback (optional)</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
