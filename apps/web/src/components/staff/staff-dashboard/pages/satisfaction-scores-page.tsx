"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type ClientRow = { id: number; name: string; avatar: string; toneClass: string; surfaceClass: string; selectedClass: string };
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
  { id: 1, name: "Volta Studios", avatar: "VS", toneClass: "ssToneAccent", surfaceClass: "ssSurfaceAccent", selectedClass: "ssClientCardActiveAccent" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", toneClass: "ssTonePurple", surfaceClass: "ssSurfacePurple", selectedClass: "ssClientCardActivePurple" },
  { id: 3, name: "Mira Health", avatar: "MH", toneClass: "ssToneBlue", surfaceClass: "ssSurfaceBlue", selectedClass: "ssClientCardActiveBlue" },
  { id: 4, name: "Dune Collective", avatar: "DC", toneClass: "ssToneAmber", surfaceClass: "ssSurfaceAmber", selectedClass: "ssClientCardActiveAmber" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", toneClass: "ssToneOrange", surfaceClass: "ssSurfaceOrange", selectedClass: "ssClientCardActiveOrange" }
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

const riskConfig: Record<RiskLevel, { label: string; badgeClass: string }> = {
  low: { label: "Low risk", badgeClass: "ssRiskLow" },
  medium: { label: "Medium risk", badgeClass: "ssRiskMedium" },
  high: { label: "High risk", badgeClass: "ssRiskHigh" },
  critical: { label: "Critical", badgeClass: "ssRiskCritical" }
};

const signalColors: Record<Signal["type"], string> = {
  positive: "ssSignalPositive",
  neutral: "ssSignalNeutral",
  negative: "ssSignalNegative"
};

function dimensionTone(value: number): string {
  if (value >= 80) return "ssMeterGood";
  if (value >= 60) return "ssMeterWarn";
  return "ssMeterBad";
}

function ScoreRing({ score, clientId, size = 80 }: { score: number; clientId: number; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cx("ssRing")} data-client-id={clientId}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className={cx("ssRingTrack")} strokeWidth={size * 0.07} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className={cx("ssRingValue")}
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
        className={cx("ssRingText")}
      >
        {score}
      </text>
    </svg>
  );
}

function TrendLine({ points, clientId }: { points: TrendPoint[]; clientId: number }) {
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
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cx("ssTrendSvg")} data-client-id={clientId}>
      <polyline fill="none" className={cx("ssTrendLine")} strokeWidth="2.5" points={path} />
      {points.map((p, i) => {
        const x = i * xStep;
        const y = 100 - ((p.score - min) / range) * 100;
        return <circle key={p.month} cx={x} cy={y} r="2.2" className={cx("ssTrendDot")} />;
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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-satisfaction-scores">
      <div className={cx("pageHeaderBar", "borderB", "ssHeaderWrap")}>
        <div className={cx("flexBetween", "mb20", "itemsStart")}>
          <div>
            <div className={cx("pageEyebrow", "mb8")}>
              Staff Dashboard / Client Intelligence
            </div>
            <h1 className={cx("pageTitle")}>
              Satisfaction Scores
            </h1>
          </div>
          <div className={cx("flexRow", "gap24")}>
            {[
              { label: "Portfolio avg", value: avgScore, toneClass: avgScore >= 75 ? "ssToneAccent" : avgScore >= 60 ? "ssToneAmber" : "ssToneRisk" },
              { label: "Critical", value: Object.values(scores).filter((s) => s.risk === "critical").length, toneClass: "ssToneRisk" },
              { label: "At risk", value: Object.values(scores).filter((s) => s.risk === "high").length, toneClass: "ssToneOrange" }
            ].map((s) => (
              <div key={s.label} className={cx("textRight")}>
                <div className={cx("pageEyebrow", "mb4", "trackingWide10")}>{s.label}</div>
                <div className={cx("fontDisplay", "fw800", "ssStatValue", s.toneClass)}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("flexRow", "gap10")}>
          {clients.map((c) => {
            const sc = scores[c.id];
            const r = riskConfig[sc.risk];
            const isSelected = selected === c.id;
            return (
              <div
                key={c.id}
                className={cx("ssClientCard", "flex1", isSelected ? c.selectedClass : "ssClientCardIdle")}
                onClick={() => setSelected(c.id)}
              >
                <div className={cx("flexRow", "gap8", "mb8")}>
                  <div className={cx("flexCenter", "ssScoreClientAvatar", c.surfaceClass, c.toneClass)}>
                    {c.avatar}
                  </div>
                  <span className={cx("text10", "truncate", isSelected ? "colorText" : "colorMuted")}>
                    {c.name.split(" ")[0]}
                  </span>
                </div>
                <div className={cx("flexBetween", "itemsEnd")}>
                  <div className={cx("fontDisplay", "fw800", "ssClientScore", c.toneClass)}>{sc.overall}</div>
                  <div className={cx("textXs", "uppercase", "ssRiskBadge", r.badgeClass)}>
                    {r.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={cx("ssMainGrid")}>
        <div className={cx("ssPane", "ssPaneRightBorder")}>
          <div className={cx("flexRow", "gap16", "mb24")}>
            <ScoreRing score={current.overall} clientId={client.id} size={100} />
            <div>
              <div className={cx("fontDisplay", "fw800", "colorText", "mb4", "ssClientName")}>{client.name}</div>
              <div className={cx("flexRow", "gap8", "mb6")}>
                <div className={cx("text10", "uppercase", "ssRiskChip", risk.badgeClass)}>
                  {risk.label}
                </div>
              </div>
              <div className={cx("text11", trendDelta > 0 ? "ssToneAccent" : "ssToneRisk")}>
                {trendDelta > 0 ? "↑" : "↓"} {Math.abs(trendDelta)} pts since Oct
              </div>
            </div>
          </div>

          <div className={cx("text10", "colorMuted2", "uppercase", "mb12", "trackingWide10")}>
            Score breakdown
          </div>
          {current.dimensions.map((d) => (
            <div key={d.axis} className={cx("flexRow", "gap12", "mb8")}>
              <span className={cx("text11", "colorMuted", "noShrink", "ssAxisLabel")}>{d.axis}</span>
              <progress max={100} value={d.value} className={cx("ssDimensionMeter", dimensionTone(d.value))} />
              <span className={cx("text11", "textRight", "noShrink", "ssAxisValue", dimensionTone(d.value))}>{d.value}</span>
            </div>
          ))}
        </div>

        <div className={cx("ssPane", "ssPaneRightBorder")}>
          <div className={cx("text10", "colorMuted2", "uppercase", "mb14", "trackingWide10")}>
            Score trend · last 5 months
          </div>
          <div className={cx("ssTrendWrap")}>
            <TrendLine points={current.trend} clientId={client.id} />
          </div>
          <div className={cx("mt8", "ssMonthsGrid")}>
            {current.trend.map((p) => (
              <div key={p.month} className={cx("text10", "colorMuted2", "textCenter")}>
                {p.month}
              </div>
            ))}
          </div>

          <div className={cx("mt20")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "mb12", "trackingWide10")}>
              Signals driving score
            </div>
            {current.signals.map((sig, i) => (
              <div key={String(i)} className={cx("flexRow", "gap10", "ssSignalRow")}>
                <div className={cx("noShrink", "ssSignalDot", signalColors[sig.type])} />
                <span className={cx("text12", "colorMuted", "lh15")}>{sig.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("ssPane")}>
          <div className={cx("text10", "colorMuted2", "uppercase", "mb14", "trackingWide10")}>
            Recommended actions
          </div>
          {current.risk === "critical" ? (
            <div className={cx("mb16", "ssCriticalAlert")}>
              <div className={cx("text11", "mb4", "ssToneRisk")}>⚑ Immediate attention needed</div>
              <div className={cx("text11", "colorMuted")}>Score declining rapidly. Escalate to account manager before client initiates conversation.</div>
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
              const colors = { urgent: "ssToneRisk", high: "ssToneAmber", medium: "ssToneBlue", opportunity: "ssTonePurple" };
              const dots = { urgent: "ssSignalNegative", high: "ssSignalAmber", medium: "ssSignalBlue", opportunity: "ssSignalPurple" };
              return (
                <div key={String(i)} className={cx("flexRow", "gap10", "mb8", "ssActionRow")}>
                  <div className={cx("noShrink", "ssSignalDot", dots[item.priority])} />
                  <div className={cx("flex1")}>
                    <div className={cx("text12", "colorMuted", "lh14")}>{item.action}</div>
                    <div className={cx("textXs", "uppercase", "mt3", "trackingWide6", colors[item.priority])}>{item.priority}</div>
                  </div>
                </div>
              );
            })}

          <div className={cx("mt20", "mb8")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "trackingWide10")}>
              Last reviewed
            </div>
          </div>
          <div className={cx("text12", "colorMuted")}>{current.lastReview} · Auto-calculated from portal signals</div>
        </div>
      </div>
    </section>
  );
}
