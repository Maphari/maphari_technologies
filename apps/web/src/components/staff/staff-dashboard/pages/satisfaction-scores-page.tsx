"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type ClientRow = { id: number; name: string; avatar: string; color: string };
type Dimension = { axis: "Quality" | "Comms" | "Speed" | "Value" | "Proactivity"; value: number };
type TrendPoint = { month: "Oct" | "Nov" | "Dec" | "Jan" | "Feb"; score: number };
type Signal = { type: "positive" | "neutral" | "negative"; text: string };
type RiskLevel = "low" | "medium" | "high" | "critical";
type ScoreCard = {
  overall: number;
  dimensions: Dimension[];
  trend: TrendPoint[];
  signals: Signal[];
  risk: RiskLevel;
  lastReview: string;
};

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "#a78bfa" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "#f5c518" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00" }
];

const scores: Record<number, ScoreCard> = {
  1: {
    overall: 91,
    dimensions: [
      { axis: "Quality", value: 95 },
      { axis: "Comms", value: 88 },
      { axis: "Speed", value: 84 },
      { axis: "Value", value: 92 },
      { axis: "Proactivity", value: 97 }
    ],
    trend: [
      { month: "Oct", score: 80 },
      { month: "Nov", score: 83 },
      { month: "Dec", score: 86 },
      { month: "Jan", score: 89 },
      { month: "Feb", score: 91 }
    ],
    signals: [
      { type: "positive", text: "Approved milestone with no revisions (3×)" },
      { type: "positive", text: "Paid invoice 3 days early" },
      { type: "positive", text: "Sent unsolicited positive feedback" },
      { type: "neutral", text: "1 revision request this cycle" }
    ],
    risk: "low",
    lastReview: "Feb 22"
  },
  2: {
    overall: 58,
    dimensions: [
      { axis: "Quality", value: 75 },
      { axis: "Comms", value: 40 },
      { axis: "Speed", value: 50 },
      { axis: "Value", value: 65 },
      { axis: "Proactivity", value: 60 }
    ],
    trend: [
      { month: "Oct", score: 72 },
      { month: "Nov", score: 70 },
      { month: "Dec", score: 68 },
      { month: "Jan", score: 63 },
      { month: "Feb", score: 58 }
    ],
    signals: [
      { type: "negative", text: "Invoice 7 days overdue" },
      { type: "negative", text: "3 messages unanswered" },
      { type: "negative", text: "Milestone 5 days late to approve" },
      { type: "neutral", text: "Responsive on calls when available" }
    ],
    risk: "high",
    lastReview: "Feb 20"
  },
  3: {
    overall: 74,
    dimensions: [
      { axis: "Quality", value: 82 },
      { axis: "Comms", value: 78 },
      { axis: "Speed", value: 65 },
      { axis: "Value", value: 72 },
      { axis: "Proactivity", value: 73 }
    ],
    trend: [
      { month: "Oct", score: 70 },
      { month: "Nov", score: 71 },
      { month: "Dec", score: 73 },
      { month: "Jan", score: 74 },
      { month: "Feb", score: 74 }
    ],
    signals: [
      { type: "positive", text: "Engaged on UX review calls" },
      { type: "neutral", text: "Clinical review delays causing friction" },
      { type: "neutral", text: "1 revision request - reasonable scope" },
      { type: "neutral", text: "Consistent but slow to approve" }
    ],
    risk: "medium",
    lastReview: "Feb 21"
  },
  4: {
    overall: 43,
    dimensions: [
      { axis: "Quality", value: 70 },
      { axis: "Comms", value: 20 },
      { axis: "Speed", value: 30 },
      { axis: "Value", value: 55 },
      { axis: "Proactivity", value: 40 }
    ],
    trend: [
      { month: "Oct", score: 65 },
      { month: "Nov", score: 60 },
      { month: "Dec", score: 55 },
      { month: "Jan", score: 50 },
      { month: "Feb", score: 43 }
    ],
    signals: [
      { type: "negative", text: "6 days silent - no response to 3 follow-ups" },
      { type: "negative", text: "Milestone 12 days overdue" },
      { type: "negative", text: "Retainer exceeded - unacknowledged" },
      { type: "neutral", text: "Quality feedback was positive when received" }
    ],
    risk: "critical",
    lastReview: "Feb 22"
  },
  5: {
    overall: 96,
    dimensions: [
      { axis: "Quality", value: 98 },
      { axis: "Comms", value: 95 },
      { axis: "Speed", value: 94 },
      { axis: "Value", value: 97 },
      { axis: "Proactivity", value: 96 }
    ],
    trend: [
      { month: "Oct", score: 90 },
      { month: "Nov", score: 91 },
      { month: "Dec", score: 93 },
      { month: "Jan", score: 94 },
      { month: "Feb", score: 96 }
    ],
    signals: [
      { type: "positive", text: "Paid invoice 5 days early (every invoice)" },
      { type: "positive", text: "Zero revision requests this cycle" },
      { type: "positive", text: "Sent referral to another business" },
      { type: "positive", text: "Highly engaged on progress updates" }
    ],
    risk: "low",
    lastReview: "Feb 20"
  }
};

const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  low: { label: "Low risk", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "color-mix(in srgb, var(--accent) 20%, transparent)" },
  medium: { label: "Medium risk", color: "#f5c518", bg: "rgba(245,197,24,0.08)", border: "rgba(245,197,24,0.2)" },
  high: { label: "High risk", color: "#ff8c00", bg: "rgba(255,140,0,0.08)", border: "rgba(255,140,0,0.2)" },
  critical: { label: "Critical", color: "#ff4444", bg: "rgba(255,68,68,0.08)", border: "rgba(255,68,68,0.2)" }
};

const signalColors: Record<Signal["type"], string> = {
  positive: "var(--accent)",
  neutral: "#a0a0b0",
  negative: "#ff4444"
};

function ScoreRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.07} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.07}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        style={{ fontSize: size * 0.22, fontFamily: "'Syne', sans-serif", fontWeight: 800, fill: color }}
      >
        {score}
      </text>
    </svg>
  );
}

function TrendLine({ points, color }: { points: TrendPoint[]; color: string }) {
  const max = 100;
  const min = 30;
  const range = max - min;
  const xStep = 100 / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * xStep;
      const y = 100 - ((p.score - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={path} />
      {points.map((p, i) => {
        const x = i * xStep;
        const y = 100 - ((p.score - min) / range) * 100;
        return <circle key={p.month} cx={x} cy={y} r="2.2" fill={color} />;
      })}
    </svg>
  );
}

export function SatisfactionScoresPage({ isActive }: { isActive: boolean }) {
  const [selected, setSelected] = useState(1);
  const current = scores[selected];
  const client = clients.find((c) => c.id === selected) ?? clients[0];
  const risk = riskConfig[current.risk];
  const trendDelta = current.trend[current.trend.length - 1].score - current.trend[0].score;

  const avgScore = useMemo(
    () =>
      Math.round(
        Object.values(scores).reduce((sum, score) => sum + score.overall, 0) /
          Object.keys(scores).length
      ),
    []
  );

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-satisfaction-scores">
      <style>{`
        .ss-client-card { transition: all 0.15s ease; cursor: pointer; }
        .ss-client-card:hover { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; transform: translateY(-1px); }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Client Intelligence
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Satisfaction Scores
            </h1>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Portfolio avg", value: avgScore, color: avgScore >= 75 ? "var(--accent)" : avgScore >= 60 ? "#f5c518" : "#ff4444" },
              { label: "Critical", value: Object.values(scores).filter((s) => s.risk === "critical").length, color: "#ff4444" },
              { label: "At risk", value: Object.values(scores).filter((s) => s.risk === "high").length, color: "#ff8c00" }
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {clients.map((c) => {
            const sc = scores[c.id];
            const r = riskConfig[sc.risk];
            const isSelected = selected === c.id;
            return (
              <div
                key={c.id}
                className="ss-client-card"
                onClick={() => setSelected(c.id)}
                style={{
                  flex: 1,
                  padding: "14px 14px",
                  border: `1px solid ${isSelected ? `${c.color}40` : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 4,
                  background: isSelected ? `${c.color}06` : "rgba(255,255,255,0.01)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 2, background: `${c.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: c.color }}>
                    {c.avatar}
                  </div>
                  <span style={{ fontSize: 10, color: isSelected ? "#fff" : "#a0a0b0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name.split(" ")[0]}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: c.color, lineHeight: 1 }}>{sc.overall}</div>
                  <div style={{ fontSize: 9, padding: "2px 6px", borderRadius: 2, background: r.bg, color: r.color, letterSpacing: "0.06em", textTransform: "uppercase", border: `1px solid ${r.border}` }}>
                    {r.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", minHeight: "calc(100vh - 260px)" }}>
        <div style={{ padding: "28px 28px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <ScoreRing score={current.overall} color={client.color} size={100} />
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{client.name}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {risk.label}
                </div>
              </div>
              <div style={{ fontSize: 11, color: trendDelta > 0 ? "var(--accent)" : "#ff4444" }}>
                {trendDelta > 0 ? "↑" : "↓"} {Math.abs(trendDelta)} pts since Oct
              </div>
            </div>
          </div>

          <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Score breakdown
          </div>
          {current.dimensions.map((d) => (
            <div key={d.axis} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#a0a0b0", width: 80, flexShrink: 0 }}>{d.axis}</span>
              <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${d.value}%`, background: d.value >= 80 ? "var(--accent)" : d.value >= 60 ? "#f5c518" : "#ff4444", borderRadius: 3, transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: 11, color: d.value >= 80 ? "var(--accent)" : d.value >= 60 ? "#f5c518" : "#ff4444", width: 28, textAlign: "right", flexShrink: 0 }}>{d.value}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "28px 28px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
            Score trend · last 5 months
          </div>
          <div style={{ height: 160, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)", padding: 12 }}>
            <TrendLine points={current.trend} color={client.color} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginTop: 8 }}>
            {current.trend.map((p) => (
              <div key={p.month} style={{ fontSize: 10, color: "var(--muted2)", textAlign: "center" }}>
                {p.month}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Signals driving score
            </div>
            {current.signals.map((sig, i) => (
              <div key={String(i)} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: signalColors[sig.type], flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.5 }}>{sig.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "28px 28px" }}>
          <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
            Recommended actions
          </div>
          {current.risk === "critical" ? (
            <div style={{ padding: "12px 14px", border: "1px solid rgba(255,68,68,0.25)", borderRadius: 3, background: "rgba(255,68,68,0.06)", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#ff4444", marginBottom: 4 }}>⚑ Immediate attention needed</div>
              <div style={{ fontSize: 11, color: "#a0a0b0" }}>Score declining rapidly. Escalate to account manager before client initiates conversation.</div>
            </div>
          ) : null}

          {[
            current.overall < 60 ? { action: "Schedule a relationship call this week", priority: "urgent" as const } : null,
            current.dimensions.find((d) => d.axis === "Comms" && d.value < 60) ? { action: "Improve response time - comms score low", priority: "high" as const } : null,
            current.dimensions.find((d) => d.axis === "Speed" && d.value < 65) ? { action: "Review delivery pace - speed score lagging", priority: "medium" as const } : null,
            trendDelta < -5 ? { action: "Score declining - identify root cause", priority: "high" as const } : null,
            current.risk === "low" ? { action: "Consider upsell conversation - satisfaction high", priority: "opportunity" as const } : null
          ]
            .filter(Boolean)
            .map((a, i) => {
              const item = a as { action: string; priority: "urgent" | "high" | "medium" | "opportunity" };
              const colors = { urgent: "#ff4444", high: "#f5c518", medium: "#60a5fa", opportunity: "#a78bfa" };
              return (
                <div key={String(i)} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 12px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 3, marginBottom: 8, background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors[item.priority], flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.4 }}>{item.action}</div>
                    <div style={{ fontSize: 9, color: colors[item.priority], letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 3 }}>{item.priority}</div>
                  </div>
                </div>
              );
            })}

          <div style={{ marginTop: 20, fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Last reviewed
          </div>
          <div style={{ fontSize: 12, color: "#a0a0b0" }}>{current.lastReview} · Auto-calculated from portal signals</div>
        </div>
      </div>
    </section>
  );
}
