"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
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

  const trendData = clients.flatMap(c => c.history).reduce((acc, h) => {
    const existing = acc.find(d => d.label === h.month);
    if (existing) {
      existing.nps = ((existing.nps as number) + (h.nps ?? 0)) / 2;
    } else {
      acc.push({ label: h.month, nps: h.nps ?? 0, csat: h.csat ?? 0 });
    }
    return acc;
  }, [] as { label: string; nps: number; csat: number | null }[]);

  const tableRows = clients.map(c => ({
    client: c.name,
    score: c.nps,
    sentiment: c.trend,
    date: c.latestSurvey,
    comment: c.feedback || "—",
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>EXPERIENCE / SATISFACTION</div>
          <h1 className={styles.pageTitle}>Client Satisfaction</h1>
          <div className={styles.pageSub}>CSAT · NPS · Feedback trends</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Send Survey Now</button>
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Avg CSAT" value={`${avgCSAT}/10`} sub="Portfolio average" tone={parseFloat(avgCSAT) >= 8 ? "green" : "amber"} />
        <StatWidget label="NPS Score" value={avgNPS} sub={`${promoters} promoters`} subTone="up" tone={parseFloat(avgNPS) >= 7 ? "accent" : "amber"} />
        <StatWidget label="Responses This Month" value={clients.length} sub="Survey submissions" tone="default" />
        <StatWidget label="Detractors Count" value={detractors} sub="NPS score ≤ 6" tone={detractors > 0 ? "red" : "default"} />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="CSAT / NPS Trend"
          data={trendData.length > 0 ? trendData : [{ label: "No data", nps: 0, csat: 0 }]}
          dataKey={["nps", "csat"]}
          type="line"
          xKey="label"
          color={["#8b6fff", "#34d98b"]}
          legend={[{ key: "nps", label: "NPS" }, { key: "csat", label: "CSAT" }]}
        />
        <PipelineWidget
          label="NPS Segments"
          stages={[
            { label: "Promoter (9-10)", count: promoters, total: Math.max(clients.length, 1), color: "#34d98b" },
            { label: "Passive (7-8)", count: clients.filter(c => c.nps >= 7 && c.nps < 9).length, total: Math.max(clients.length, 1), color: "#f5a623" },
            { label: "Detractor (≤6)", count: detractors, total: Math.max(clients.length, 1), color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Feedback Log"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "client", header: "Client" },
            { key: "score", header: "Score", align: "right" },
            { key: "sentiment", header: "Sentiment", align: "right", render: (v) => {
              const val = v as string;
              const cls = val === "improving" ? cx("badge", "badgeGreen") : val === "declining" ? cx("badge", "badgeRed") : cx("badge", "badgeMuted");
              return <span className={cls}>{val}</span>;
            }},
            { key: "date", header: "Date", align: "right" },
            { key: "comment", header: "Comment" },
          ]}
          emptyMessage="No feedback data"
        />
      </WidgetGrid>
    </div>
  );
}
