"use client";

import { useState } from "react";
import { cx, styles } from "../style";

type Trend = "stable" | "improving" | "declining";
type SurveyStatus = "overdue" | "due" | "upcoming";
type Tab = "satisfaction scores" | "survey schedule" | "feedback log" | "trends";

type HistoryPoint = { month: string; nps: number | null; csat: number | null };
type ClientRecord = {
  name: string;
  color: string;
  avatar: string;
  am: string;
  nps: number;
  csat: number;
  latestSurvey: string;
  trend: Trend;
  history: HistoryPoint[];
  feedback: string;
  surveysDue: boolean;
};

const clients: ClientRecord[] = [
  {
    name: "Volta Studios",
    color: "var(--accent)",
    avatar: "VS",
    am: "Nomsa Dlamini",
    nps: 9,
    csat: 9.1,
    latestSurvey: "Feb 10",
    trend: "stable",
    history: [
      { month: "Oct", nps: 8, csat: 8.8 },
      { month: "Nov", nps: 9, csat: 9.0 },
      { month: "Dec", nps: 9, csat: 9.1 },
      { month: "Jan", nps: 9, csat: 9.1 },
      { month: "Feb", nps: 9, csat: 9.1 },
    ],
    feedback: "Really happy with how the brand direction is coming together. Nomsa is a pleasure to work with.",
    surveysDue: false,
  },
  {
    name: "Kestrel Capital",
    color: "var(--purple)",
    avatar: "KC",
    am: "Nomsa Dlamini",
    nps: 4,
    csat: 6.2,
    latestSurvey: "Jan 15",
    trend: "declining",
    history: [
      { month: "Oct", nps: 8, csat: 8.1 },
      { month: "Nov", nps: 7, csat: 7.5 },
      { month: "Dec", nps: 6, csat: 6.8 },
      { month: "Jan", nps: 4, csat: 6.2 },
      { month: "Feb", nps: null, csat: null },
    ],
    feedback: "Turnaround times have been slower than expected. Invoice dispute has created friction.",
    surveysDue: true,
  },
  {
    name: "Mira Health",
    color: "var(--blue)",
    avatar: "MH",
    am: "Nomsa Dlamini",
    nps: 8,
    csat: 8.4,
    latestSurvey: "Feb 5",
    trend: "improving",
    history: [
      { month: "Oct", nps: 6, csat: 7.2 },
      { month: "Nov", nps: 7, csat: 7.8 },
      { month: "Dec", nps: 7, csat: 8.0 },
      { month: "Jan", nps: 8, csat: 8.3 },
      { month: "Feb", nps: 8, csat: 8.4 },
    ],
    feedback: "Great improvement since the new project structure. Kira has been responsive.",
    surveysDue: false,
  },
  {
    name: "Dune Collective",
    color: "var(--amber)",
    avatar: "DC",
    am: "Renzo Fabbri",
    nps: 3,
    csat: 5.8,
    latestSurvey: "Jan 20",
    trend: "declining",
    history: [
      { month: "Oct", nps: 7, csat: 7.5 },
      { month: "Nov", nps: 6, csat: 7.0 },
      { month: "Dec", nps: 5, csat: 6.2 },
      { month: "Jan", nps: 3, csat: 5.8 },
      { month: "Feb", nps: null, csat: null },
    ],
    feedback: "Scope creep has caused significant delays. We're frustrated with communication.",
    surveysDue: true,
  },
  {
    name: "Okafor & Sons",
    color: "var(--amber)",
    avatar: "OS",
    am: "Tapiwa Moyo",
    nps: 10,
    csat: 9.6,
    latestSurvey: "Feb 18",
    trend: "stable",
    history: [
      { month: "Oct", nps: 9, csat: 9.3 },
      { month: "Nov", nps: 10, csat: 9.5 },
      { month: "Dec", nps: 10, csat: 9.4 },
      { month: "Jan", nps: 10, csat: 9.5 },
      { month: "Feb", nps: 10, csat: 9.6 },
    ],
    feedback: "Outstanding service. The annual report exceeded all expectations.",
    surveysDue: false,
  },
];

const surveySchedules: Array<{ client: string; color: string; type: string; due: string; status: SurveyStatus }> = [
  { client: "Kestrel Capital", color: "var(--purple)", type: "Monthly CSAT", due: "Feb 28", status: "overdue" },
  { client: "Dune Collective", color: "var(--amber)", type: "Monthly CSAT", due: "Feb 28", status: "due" },
  { client: "Mira Health", color: "var(--blue)", type: "Quarterly NPS", due: "Mar 15", status: "upcoming" },
  { client: "Volta Studios", color: "var(--accent)", type: "Quarterly NPS", due: "Mar 20", status: "upcoming" },
];

const tabs: Tab[] = ["satisfaction scores", "survey schedule", "feedback log", "trends"];

function npsColor(score: number | null): string {
  if (score === null) return "var(--border)";
  if (score >= 8) return "var(--accent)";
  if (score >= 6) return "var(--amber)";
  return "var(--red)";
}

function trendColor(trend: Trend): string {
  if (trend === "improving") return "var(--accent)";
  if (trend === "declining") return "var(--red)";
  return "var(--muted)";
}

function surveyStatusColor(status: SurveyStatus): string {
  if (status === "overdue") return "var(--red)";
  if (status === "due") return "var(--amber)";
  return "var(--muted)";
}

function toneClass(color: string): string {
  if (color === "var(--red)") return styles.csatToneRed;
  if (color === "var(--blue)") return styles.csatToneBlue;
  if (color === "var(--amber)") return styles.csatToneAmber;
  if (color === "var(--purple)") return styles.csatTonePurple;
  if (color === "var(--muted)") return styles.csatToneMuted;
  if (color === "var(--border)") return styles.csatToneBorder;
  return styles.csatToneAccent;
}

function MiniChart({ history }: { history: HistoryPoint[] }) {
  const validData = history.filter((h): h is { month: string; nps: number; csat: number | null } => h.nps !== null);
  const max = 10;
  const min = 0;
  const h = 40;
  const w = 120;
  const pts = validData
    .map((d, i) => {
      const x = (i / Math.max(history.length - 1, 1)) * w;
      const y = h - ((d.nps - min) / (max - min)) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className={styles.csatMiniChartSvg}>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {validData.map((d, i) => {
        const x = (i / Math.max(history.length - 1, 1)) * w;
        const y = h - ((d.nps - min) / (max - min)) * h;
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />;
      })}
    </svg>
  );
}

function NPSGauge({ score }: { score: number }) {
  const color = npsColor(score);
  const pct = (score / 10) * 100;
  return (
    <div className={styles.csatGauge}>
      <svg width={80} height={80} className={styles.csatGaugeSvg}>
        <circle cx={40} cy={40} r={32} fill="none" stroke="var(--border)" strokeWidth={8} />
        <circle cx={40} cy={40} r={32} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${(pct / 100) * 201} 201`} strokeLinecap="round" />
      </svg>
      <div className={styles.csatGaugeInner}>
        <div className={cx(styles.csatGaugeScore, toneClass(color))}>{score}</div>
        <div className={cx("textXs", "colorMuted")}>NPS</div>
      </div>
    </div>
  );
}

export function ClientSatisfactionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("satisfaction scores");

  const avgNPS = (clients.reduce((s, c) => s + c.nps, 0) / clients.length).toFixed(1);
  const avgCSAT = (clients.reduce((s, c) => s + c.csat, 0) / clients.length).toFixed(1);
  const promoters = clients.filter((c) => c.nps >= 9).length;
  const detractors = clients.filter((c) => c.nps <= 6).length;

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 className={styles.pageTitle}>Client Satisfaction</h1>
          <div className={styles.pageSub}>NPS - CSAT - Trends - Survey scheduling</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Send Survey Now</button>
        </div>
      </div>

      <div className={cx("topCardsStack")}>
        {[
          { label: "Portfolio NPS", value: avgNPS, color: parseFloat(avgNPS) >= 7 ? "var(--accent)" : "var(--amber)", sub: `${promoters} promoters - ${detractors} detractors` },
          { label: "Portfolio CSAT", value: `${avgCSAT}/10`, color: parseFloat(avgCSAT) >= 8 ? "var(--accent)" : "var(--amber)", sub: "Avg client satisfaction" },
          { label: "Surveys Due", value: surveySchedules.filter((s) => s.status !== "upcoming").length.toString(), color: "var(--amber)", sub: "Overdue or due this week" },
          { label: "Declining Clients", value: clients.filter((c) => c.trend === "declining").length.toString(), color: "var(--red)", sub: "Negative NPS trend" },
        ].map((s) => (
          <div key={s.label} className={cx(styles.statCard, toneClass(s.color))}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx("statValue", "csatDynColor")}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "satisfaction scores" && (
        <div className={cx("flexCol", "gap12")}>
          {[...clients].sort((a, b) => a.nps - b.nps).map((c) => (
            <div key={c.name} className={cx("csatScoreCard", toneClass(c.color), c.nps <= 6 && "csatScoreCardDanger")}>
              <div className={styles.csatScoreGrid}>
                <div>
                  <div className={styles.csatClientName}>{c.name}</div>
                  <div className={cx("text11", "colorMuted")}>{c.am}</div>
                </div>
                <NPSGauge score={c.nps} />
                <div>
                  <div className={cx("text11", "colorMuted", "mb4")}>CSAT Score</div>
                  <div className={cx(styles.csatBigScore, toneClass(npsColor(c.csat)))}>{c.csat}</div>
                  <div className={cx("text10", "colorMuted")}>out of 10</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted", "mb8")}>NPS Trend (5 months)</div>
                  <MiniChart history={c.history} />
                </div>
                <div className={cx("flexRow", "gap6")}>
                  <span className={styles.csatTrendIcon}>{c.trend === "improving" ? "\u25B2" : c.trend === "declining" ? "\u25BC" : "\u2192"}</span>
                  <span className={cx(styles.csatTrendLabel, toneClass(trendColor(c.trend)))}>{c.trend}</span>
                </div>
                <div className={cx("text11", "fontMono", "colorMuted")}>Survey: {c.latestSurvey}</div>
                <div className={cx("flexCol", "gap6")}>
                  <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
                  {c.surveysDue ? <button type="button" className={cx("btnSm", "btnAccent")}>Send</button> : null}
                </div>
              </div>
              {c.feedback ? (
                <div className={styles.csatFeedbackQuote}>
                  &ldquo;{c.feedback}&rdquo;
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {activeTab === "survey schedule" && (
        <div className={cx("flexCol", "gap10")}>
          {surveySchedules.map((s) => (
            <div key={s.client + s.type} className={cx("csatSurveyRow", toneClass(s.color), s.status === "overdue" && "csatScoreCardDanger")}>
              <div className={styles.csatClientName}>{s.client}</div>
              <div className={cx("text12", "colorMuted")}>{s.type}</div>
              <div className={cx("fontMono", "text12", "csatDynColor", toneClass(surveyStatusColor(s.status)))}>{s.due}</div>
              <span className={cx("badge", s.status === "overdue" ? "badgeRed" : s.status === "due" ? "badgeAmber" : "badgeMuted")}>{s.status}</span>
              <button type="button" className={cx("btnSm", s.status !== "upcoming" ? "btnAccent" : "btnGhost")}>{s.status !== "upcoming" ? "Send Now" : "Schedule"}</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "feedback log" && (
        <div className={cx("flexCol", "gap10")}>
          {clients
            .filter((c) => c.feedback)
            .map((c) => (
              <article key={c.name} className={cx("card", "p24", toneClass(c.color))}>
                <div className={cx("flexBetween", "mb12")}>
                  <div className={cx("flexRow", "gap12")}>
                    <div className={styles.csatClientName}>{c.name}</div>
                    <span className={cx("fontMono", "text12", "csatDynColor", toneClass(npsColor(c.nps)))}>NPS {c.nps}</span>
                    <span className={cx("fontMono", "text12", "colorMuted")}>CSAT {c.csat}</span>
                  </div>
                  <span className={cx("text11", "colorMuted", "fontMono")}>{c.latestSurvey}</span>
                </div>
                <div className={styles.csatFeedbackQuote}>
                  &ldquo;{c.feedback}&rdquo;
                </div>
              </article>
            ))}
        </div>
      )}

      {activeTab === "trends" && (
        <div className={styles.grid2}>
          {clients.map((c) => (
            <div key={c.name} className={cx("card", "p24", "csatTrendCard", toneClass(c.color))}>
              <div className={cx("flexBetween", "mb20")}>
                <div>
                  <div className={styles.csatClientName}>{c.name}</div>
                  <div className={cx(styles.csatTrendLabel, toneClass(trendColor(c.trend)))}>{c.trend === "improving" ? "\u25B2 Improving" : c.trend === "declining" ? "\u25BC Declining" : "\u2192 Stable"}</div>
                </div>
                <NPSGauge score={c.nps} />
              </div>
              <div className={styles.csatTrendGrid}>
                {c.history.map((h, i) => (
                  <div key={i} className={cx("textCenter", toneClass(npsColor(h.nps)))}>
                    <div className={styles.csatTrendScore}>{h.nps ?? "\u2014"}</div>
                    <div className={styles.csatTrendMonth}>{h.month}</div>
                    <progress className={cx(styles.csatTrendTrack, "mt4")} max={10} value={h.nps ?? 0} aria-label={`${c.name} ${h.month} NPS ${h.nps ?? 0}`} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
