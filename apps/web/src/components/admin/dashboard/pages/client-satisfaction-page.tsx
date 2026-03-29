"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAllSatisfactionSurveysWithRefresh, type AdminSatisfactionSurvey } from "../../../../lib/api/admin/client-ops";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import type { AdminClient } from "../../../../lib/api/admin";

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

type SurveyScheduleRow = { client: string; color: string; type: string; due: string; status: SurveyStatus };

const CLIENT_COLORS = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--red)", "var(--green)"];

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
  if (color === "var(--red)")    return styles.csatToneRed;
  if (color === "var(--blue)")   return styles.csatToneBlue;
  if (color === "var(--amber)")  return styles.csatToneAmber;
  if (color === "var(--purple)") return styles.csatTonePurple;
  if (color === "var(--muted)")  return styles.csatToneMuted;
  if (color === "var(--border)") return styles.csatToneBorder;
  return styles.csatToneAccent;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function fmtMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { month: "short" });
}

function buildClientRecords(
  surveys: AdminSatisfactionSurvey[],
  clients: AdminClient[]
): { records: ClientRecord[]; schedules: SurveyScheduleRow[] } {
  // Group surveys by clientId
  const grouped = new Map<string, AdminSatisfactionSurvey[]>();
  for (const s of surveys) {
    const arr = grouped.get(s.clientId) ?? [];
    arr.push(s);
    grouped.set(s.clientId, arr);
  }
  // Sort each group ascending by periodStart
  for (const arr of grouped.values()) {
    arr.sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime());
  }

  const records: ClientRecord[] = [];
  const schedules: SurveyScheduleRow[] = [];
  let colorIdx = 0;
  const now = Date.now();

  for (const client of clients) {
    const clientSurveys = grouped.get(client.id);
    if (!clientSurveys || clientSurveys.length === 0) continue;

    const color = CLIENT_COLORS[colorIdx++ % CLIENT_COLORS.length];

    // Completed surveys (have scores)
    const completed = clientSurveys.filter(s => s.status === "COMPLETED" && s.npsScore !== null);
    const latest = completed.length > 0 ? completed[completed.length - 1] : null;

    const nps  = latest?.npsScore  ?? 0;
    const csat = latest?.csatScore ?? 0;
    const latestSurvey = latest?.completedAt
      ? fmtDate(latest.completedAt)
      : latest?.periodStart ? fmtDate(latest.periodStart) : "\u2014";

    // History: last 5 completed surveys → HistoryPoint[]
    const history: HistoryPoint[] = completed.slice(-5).map(s => ({
      month: fmtMonth(s.periodStart),
      nps:   s.npsScore,
      csat:  s.csatScore,
    }));

    // Trend: compare first vs last NPS
    let trend: Trend = "stable";
    if (completed.length >= 2) {
      const first = completed[0].npsScore ?? 0;
      const last  = completed[completed.length - 1].npsScore ?? 0;
      if (last > first + 0.5)      trend = "improving";
      else if (last < first - 0.5) trend = "declining";
    }

    // Pending surveys
    const pending = clientSurveys.filter(s => s.status === "PENDING" || s.status === "SENT");
    const surveysDue = pending.length > 0;

    records.push({
      name:        client.name,
      color,
      avatar:      client.name.charAt(0).toUpperCase(),
      am:          client.ownerName ?? "\u2014",
      nps,
      csat,
      latestSurvey,
      trend,
      history,
      feedback:    "",
      surveysDue,
    });

    // Build schedule rows for pending/overdue surveys
    for (const s of pending) {
      const periodEndMs = s.periodEnd ? new Date(s.periodEnd).getTime() : null;
      const diffDays    = periodEndMs !== null ? Math.floor((periodEndMs - now) / (1000 * 60 * 60 * 24)) : 999;
      const status: SurveyStatus =
        diffDays < 0    ? "overdue"
        : diffDays <= 7 ? "due"
        : "upcoming";
      schedules.push({
        client: client.name,
        color,
        type:   "Satisfaction Survey",
        due:    s.periodEnd ? fmtDate(s.periodEnd) : "\u2014",
        status,
      });
    }
  }

  return { records, schedules };
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

export function ClientSatisfactionPage({ session }: { session: AuthSession | null }) {
  const [clients, setClients]               = useState<ClientRecord[]>([]);
  const [surveySchedules, setSurveySchedules] = useState<SurveyScheduleRow[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeTab, setActiveTab]           = useState<Tab>("satisfaction scores");

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [survRes, snapRes] = await Promise.all([
          loadAllSatisfactionSurveysWithRefresh(session),
          loadAdminSnapshotWithRefresh(session),
        ]);
        if (cancelled) return;
        if (survRes.nextSession)      saveSession(survRes.nextSession);
        else if (snapRes.nextSession) saveSession(snapRes.nextSession);
        const snapClients = snapRes.data?.clients ?? [];
        const { records, schedules } = buildClientRecords(survRes.data ?? [], snapClients);
        setClients(records);
        setSurveySchedules(schedules);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const avgNPS = clients.length > 0
    ? (clients.reduce((s, c) => s + c.nps, 0) / clients.length).toFixed(1)
    : "0.0";
  const avgCSAT = clients.length > 0
    ? (clients.reduce((s, c) => s + c.csat, 0) / clients.length).toFixed(1)
    : "0.0";
  const promoters  = clients.filter((c) => c.nps >= 9).length;
  const detractors = clients.filter((c) => c.nps <= 6).length;

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>EXPERIENCE / CLIENT SATISFACTION</div>
          <h1 className={styles.pageTitle}>Client Satisfaction</h1>
          <div className={styles.pageSub}>NPS · CSAT · Trends · Survey scheduling</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Send Survey Now</button>
        </div>
      </div>

      <div className={cx("topCardsStack")}>
        {[
          { label: "Portfolio NPS",    value: avgNPS,           color: parseFloat(avgNPS)  >= 7 ? "var(--accent)" : "var(--amber)", sub: `${promoters} promoters · ${detractors} detractors` },
          { label: "Portfolio CSAT",   value: `${avgCSAT}/10`,  color: parseFloat(avgCSAT) >= 8 ? "var(--accent)" : "var(--amber)", sub: "Avg client satisfaction" },
          { label: "Surveys Due",      value: surveySchedules.filter((s) => s.status !== "upcoming").length.toString(), color: "var(--amber)", sub: "Overdue or due this week" },
          { label: "Declining Clients",value: clients.filter((c) => c.trend === "declining").length.toString(), color: "var(--red)", sub: "Negative NPS trend" },
        ].map((s) => (
          <div key={s.label} className={cx(styles.statCard, toneClass(s.color))}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx("statValue", "csatDynColor")}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select
          title="Select tab"
          value={activeTab}
          onChange={e => setActiveTab(e.target.value as Tab)}
          className={styles.filterSelect}
        >
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <>
          {activeTab === "satisfaction scores" && (
            clients.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateTitle")}>No survey data yet</div>
                <p className={cx("emptyStateSub")}>Satisfaction surveys will appear here once clients have completed them.</p>
              </div>
            ) : (
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
                        <span className={styles.csatTrendIcon}>
                          {c.trend === "improving" ? "\u25B2" : c.trend === "declining" ? "\u25BC" : "\u2192"}
                        </span>
                        <span className={cx(styles.csatTrendLabel, toneClass(trendColor(c.trend)))}>{c.trend}</span>
                      </div>
                      <div className={cx("text11", "fontMono", "colorMuted")}>Survey: {c.latestSurvey}</div>
                      <div className={cx("flexCol", "gap6")}>
                        <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
                        {c.surveysDue ? <button type="button" className={cx("btnSm", "btnAccent")}>Send</button> : null}
                      </div>
                    </div>
                    {c.feedback ? (
                      <div className={styles.csatFeedbackQuote}>&ldquo;{c.feedback}&rdquo;</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "survey schedule" && (
            surveySchedules.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateTitle")}>No surveys scheduled</div>
                <p className={cx("emptyStateSub")}>Pending survey schedules will appear here.</p>
              </div>
            ) : (
              <div className={cx("flexCol", "gap10")}>
                {surveySchedules.map((s, idx) => (
                  <div key={`${s.client}-${idx}`} className={cx("csatSurveyRow", toneClass(s.color), s.status === "overdue" && "csatScoreCardDanger")}>
                    <div className={styles.csatClientName}>{s.client}</div>
                    <div className={cx("text12", "colorMuted")}>{s.type}</div>
                    <div className={cx("fontMono", "text12", "csatDynColor", toneClass(surveyStatusColor(s.status)))}>{s.due}</div>
                    <span className={cx("badge", s.status === "overdue" ? "badgeRed" : s.status === "due" ? "badgeAmber" : "badgeMuted")}>{s.status}</span>
                    <button type="button" className={cx("btnSm", s.status !== "upcoming" ? "btnAccent" : "btnGhost")}>
                      {s.status !== "upcoming" ? "Send Now" : "Schedule"}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "feedback log" && (
            clients.filter((c) => c.feedback).length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateTitle")}>No feedback collected</div>
                <p className={cx("emptyStateSub")}>Qualitative feedback from surveys will appear here once submitted.</p>
              </div>
            ) : (
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
                      <div className={styles.csatFeedbackQuote}>&ldquo;{c.feedback}&rdquo;</div>
                    </article>
                  ))}
              </div>
            )
          )}

          {activeTab === "trends" && (
            clients.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateTitle")}>No trend data</div>
                <p className={cx("emptyStateSub")}>NPS trends will appear once clients have completed multiple surveys.</p>
              </div>
            ) : (
              <div className={styles.grid2}>
                {clients.map((c) => (
                  <div key={c.name} className={cx("card", "p24", "csatTrendCard", toneClass(c.color))}>
                    <div className={cx("flexBetween", "mb20")}>
                      <div>
                        <div className={styles.csatClientName}>{c.name}</div>
                        <div className={cx(styles.csatTrendLabel, toneClass(trendColor(c.trend)))}>
                          {c.trend === "improving" ? "\u25B2 Improving" : c.trend === "declining" ? "\u25BC Declining" : "\u2192 Stable"}
                        </div>
                      </div>
                      <NPSGauge score={c.nps} />
                    </div>
                    <div className={styles.csatTrendGrid}>
                      {c.history.map((h, i) => (
                        <div key={i} className={cx("textCenter", toneClass(npsColor(h.nps)))}>
                          <div className={styles.csatTrendScore}>{h.nps ?? "\u2014"}</div>
                          <div className={styles.csatTrendMonth}>{h.month}</div>
                          <progress
                            className={cx(styles.csatTrendTrack, "mt4")}
                            max={10}
                            value={h.nps ?? 0}
                            aria-label={`${c.name} ${h.month} NPS ${h.nps ?? 0}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
    </div>
  );
}
