"use client";

import { useState, useMemo } from "react";
import { cx, styles } from "../style";

/* ═══════════════════════════════════════════════════════════════════════════
   Client Analytics Page
   Intelligence > Analytics — Core Web Vitals, SEO rankings, uptime monitoring
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Types ──────────────────────────────────────────────────────────────── */
type VitalScore = "good" | "needs-improvement" | "poor";

type WebVital = {
  name: string;
  value: string;
  unit: string;
  score: VitalScore;
  target: string;
  trend: "up" | "down" | "stable";
};

type PageSpeedScore = {
  url: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
};

type KeywordRanking = {
  keyword: string;
  position: number;
  change: number;
  volume: string;
  difficulty: string;
};

type UptimeEntry = {
  service: string;
  status: "operational" | "degraded" | "outage";
  uptime: string;
  responseTime: string;
  lastIncident: string;
};

type MonthlyTraffic = {
  month: string;
  organic: number;
  direct: number;
  referral: number;
};

type IncidentEntry = {
  id: string;
  timestamp: string;
  service: string;
  duration: string;
  resolution: string;
};

/* ── Seed Data ──────────────────────────────────────────────────────────── */
const WEB_VITALS: WebVital[] = [
  { name: "LCP", value: "1.8", unit: "s", score: "good", target: "< 2.5s", trend: "down" },
  { name: "FID", value: "45", unit: "ms", score: "good", target: "< 100ms", trend: "stable" },
  { name: "CLS", value: "0.08", unit: "", score: "good", target: "< 0.1", trend: "down" },
  { name: "TTFB", value: "380", unit: "ms", score: "needs-improvement", target: "< 200ms", trend: "up" },
  { name: "INP", value: "165", unit: "ms", score: "needs-improvement", target: "< 200ms", trend: "down" }
];

const PAGE_SPEED_SCORES: PageSpeedScore[] = [
  { url: "maphari.co.za", performance: 92, accessibility: 97, bestPractices: 95, seo: 100 },
  { url: "portal.maphari.co.za", performance: 87, accessibility: 94, bestPractices: 91, seo: 98 }
];

const KEYWORD_RANKINGS: KeywordRanking[] = [
  { keyword: "web development south africa", position: 3, change: 2, volume: "2,400", difficulty: "Medium" },
  { keyword: "custom software development", position: 7, change: -1, volume: "1,800", difficulty: "High" },
  { keyword: "maphari technologies", position: 1, change: 0, volume: "720", difficulty: "Low" },
  { keyword: "react development agency", position: 5, change: 3, volume: "1,200", difficulty: "Medium" },
  { keyword: "next.js development company", position: 4, change: 1, volume: "980", difficulty: "Medium" },
  { keyword: "saas development south africa", position: 11, change: -2, volume: "640", difficulty: "High" },
  { keyword: "enterprise software solutions", position: 18, change: 4, volume: "3,100", difficulty: "High" },
  { keyword: "client portal development", position: 2, change: 1, volume: "520", difficulty: "Low" }
];

const UPTIME_ENTRIES: UptimeEntry[] = [
  { service: "Web Application", status: "operational", uptime: "99.99%", responseTime: "142ms", lastIncident: "42 days ago" },
  { service: "API Gateway", status: "operational", uptime: "99.97%", responseTime: "89ms", lastIncident: "18 days ago" },
  { service: "Database Cluster", status: "operational", uptime: "99.99%", responseTime: "12ms", lastIncident: "67 days ago" },
  { service: "CDN / Static Assets", status: "degraded", uptime: "99.91%", responseTime: "38ms", lastIncident: "2 hours ago" },
  { service: "Email & Notifications", status: "operational", uptime: "99.95%", responseTime: "210ms", lastIncident: "9 days ago" }
];

const MONTHLY_TRAFFIC: MonthlyTraffic[] = [
  { month: "Sep", organic: 4200, direct: 1800, referral: 620 },
  { month: "Oct", organic: 4800, direct: 2100, referral: 740 },
  { month: "Nov", organic: 5300, direct: 2400, referral: 810 },
  { month: "Dec", organic: 3900, direct: 1600, referral: 550 },
  { month: "Jan", organic: 6100, direct: 2800, referral: 920 },
  { month: "Feb", organic: 6800, direct: 3200, referral: 1050 }
];

const INCIDENTS: IncidentEntry[] = [
  {
    id: "inc-1",
    timestamp: "Feb 27, 2026 — 10:14 AM",
    service: "CDN / Static Assets",
    duration: "Ongoing",
    resolution: "Investigating elevated latency on edge nodes in JNB region. Static asset delivery degraded for ~12% of requests."
  },
  {
    id: "inc-2",
    timestamp: "Feb 18, 2026 — 03:42 AM",
    service: "API Gateway",
    duration: "18 min",
    resolution: "Rate limiter misconfiguration caused 429 responses for authenticated endpoints. Config rollback applied."
  },
  {
    id: "inc-3",
    timestamp: "Feb 9, 2026 — 11:08 PM",
    service: "Email & Notifications",
    duration: "34 min",
    resolution: "SMTP relay queue backlog due to spike in transactional emails. Queue flushed; retry logic confirmed."
  },
  {
    id: "inc-4",
    timestamp: "Jan 16, 2026 — 07:21 AM",
    service: "Web Application",
    duration: "6 min",
    resolution: "Deploy pipeline timeout caused brief 502 on staging that propagated to production canary. Auto-healed."
  },
  {
    id: "inc-5",
    timestamp: "Dec 22, 2025 — 02:55 PM",
    service: "Database Cluster",
    duration: "3 min",
    resolution: "Primary node failover triggered during scheduled maintenance window. Replica promoted seamlessly."
  }
];

/* ── Badge / dot lookup maps ────────────────────────────────────────────── */
const SCORE_BADGE: Record<VitalScore, string> = {
  good: styles.badgeGreen,
  "needs-improvement": styles.badgeAmber,
  poor: styles.badgeRed
};

const UPTIME_DOT: Record<string, string> = {
  operational: styles.uptimeStatusDotGreen,
  degraded: styles.uptimeStatusDotAmber,
  outage: styles.uptimeStatusDotRed
};

const UPTIME_BADGE: Record<string, string> = {
  operational: styles.badgeGreen,
  degraded: styles.badgeAmber,
  outage: styles.badgeRed
};

/* ── Helper: SVG score ring ─────────────────────────────────────────────── */
function ScoreRing({ value, size = 80, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * (value / 100);
  const color = value >= 90 ? "var(--green)" : value >= 70 ? "var(--amber)" : "var(--red)";
  return (
    <div className={styles.scoreRing} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--b1)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - fill}
          style={{
            transformOrigin: "50% 50%",
            transform: "rotate(-90deg)",
            transition: "stroke-dashoffset 1.2s cubic-bezier(.23,1,.32,1)"
          }}
        />
      </svg>
      <span className={styles.scoreRingValue}>{value}</span>
    </div>
  );
}

/* ── Helper: sparkline SVG ──────────────────────────────────────────────── */
function Sparkline({ data, color, width = 80, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className={styles.sparkline} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Tab type ───────────────────────────────────────────────────────────── */
type AnalyticsTab = "Performance" | "SEO" | "Uptime";
const TABS: AnalyticsTab[] = ["Performance", "SEO", "Uptime"];

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */
export function ClientAnalyticsPage({ active }: { active: boolean }) {
  const [tab, setTab] = useState<AnalyticsTab>("Performance");

  /* ── Derived data ──────────────────────────────────────────────────────── */
  const sortedKeywords = useMemo(
    () => [...KEYWORD_RANKINGS].sort((a, b) => a.position - b.position),
    []
  );

  const trafficAverages = useMemo(() => {
    const len = MONTHLY_TRAFFIC.length;
    const organic = Math.round(MONTHLY_TRAFFIC.reduce((s, m) => s + m.organic, 0) / len);
    const direct = Math.round(MONTHLY_TRAFFIC.reduce((s, m) => s + m.direct, 0) / len);
    const referral = Math.round(MONTHLY_TRAFFIC.reduce((s, m) => s + m.referral, 0) / len);
    return { organic, direct, referral };
  }, []);

  const overallUptime = useMemo(() => {
    const values = UPTIME_ENTRIES.map((e) => parseFloat(e.uptime));
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    return avg.toFixed(2) + "%";
  }, []);

  /* ── Load time bar data (derived from LCP-like measurements per month) ── */
  const loadTimeData = useMemo(() => {
    return [
      { month: "Sep", ms: 2100 },
      { month: "Oct", ms: 1950 },
      { month: "Nov", ms: 1870 },
      { month: "Dec", ms: 2040 },
      { month: "Jan", ms: 1820 },
      { month: "Feb", ms: 1760 }
    ];
  }, []);

  const maxLoadTime = useMemo(() => Math.max(...loadTimeData.map((d) => d.ms)), [loadTimeData]);

  /* ── Trend arrows ──────────────────────────────────────────────────────── */
  const trendArrow = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return "\u2191";
    if (trend === "down") return "\u2193";
    return "\u2192";
  };

  const trendClass = (trend: "up" | "down" | "stable", invertGood = false) => {
    if (trend === "stable") return styles.changeStable;
    if (invertGood) {
      return trend === "down" ? styles.changeUp : styles.changeDown;
    }
    return trend === "up" ? styles.changeUp : styles.changeDown;
  };

  return (
    <section className={cx("page", active && "pageActive")} id="page-analytics">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Intelligence</div>
          <div className={styles.pageTitle}>Analytics</div>
          <div className={styles.pageSub}>
            Performance metrics, search engine rankings, and infrastructure uptime at a glance.
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={cx("filterTab", tab === t && "filterTabActive")}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
         Performance Tab
         ════════════════════════════════════════════════════════════════════ */}
      {tab === "Performance" && (
        <>
          {/* ── Section label ────────────────────────────────────────────── */}
          <div className={styles.sectionLabel} style={{ padding: "16px 32px 8px" }}>
            Core Web Vitals
          </div>

          {/* ── Web Vitals Grid ──────────────────────────────────────────── */}
          <div className={styles.vitalGrid}>
            {WEB_VITALS.map((vital, i) => (
              <div
                key={vital.name}
                className={styles.vitalCard}
                style={{ "--i": i } as React.CSSProperties}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text)", letterSpacing: "0.04em" }}>
                    {vital.name}
                  </span>
                  <span className={cx("badge", SCORE_BADGE[vital.score])}>
                    {vital.score === "needs-improvement" ? "Needs Work" : vital.score === "good" ? "Good" : "Poor"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                  <span className={styles.vitalValue}>{vital.value}</span>
                  <span className={styles.vitalUnit}>{vital.unit}</span>
                  <span className={trendClass(vital.trend, true)} style={{ fontSize: "0.72rem", marginLeft: 6 }}>
                    {trendArrow(vital.trend)}
                  </span>
                </div>
                <div className={styles.vitalTarget}>Target: {vital.target}</div>
              </div>
            ))}
          </div>

          {/* ── Section label ────────────────────────────────────────────── */}
          <div className={styles.sectionLabel} style={{ padding: "16px 32px 8px" }}>
            PageSpeed Scores
          </div>

          {/* ── PageSpeed Score Cards ────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14, padding: "0 32px 20px" }}>
            {PAGE_SPEED_SCORES.map((page, i) => (
              <div
                key={page.url}
                className={styles.scoreCard}
                style={{ "--i": i } as React.CSSProperties}
              >
                <div className={styles.scoreCardUrl}>{page.url}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <ScoreRing value={page.performance} size={90} stroke={7} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.74rem", fontWeight: 700, marginBottom: 4 }}>
                      Performance
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>
                      Lighthouse audit score
                    </div>
                  </div>
                </div>
                <div className={styles.scoreCardGrid}>
                  {([
                    ["Performance", page.performance],
                    ["Accessibility", page.accessibility],
                    ["Best Practices", page.bestPractices],
                    ["SEO", page.seo]
                  ] as const).map(([label, value]) => {
                    const barColor = value >= 90 ? "var(--green)" : value >= 70 ? "var(--amber)" : "var(--red)";
                    return (
                      <div key={label} className={styles.scoreCardItem}>
                        <div className={styles.scoreCardItemLabel}>{label}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 700, fontFamily: "var(--font-dm-mono)", fontSize: "0.72rem" }}>
                            {value}
                          </span>
                        </div>
                        <div className={styles.scoreCardItemBar}>
                          <div
                            className={styles.scoreCardItemFill}
                            style={{ width: `${value}%`, background: barColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ── Section label ────────────────────────────────────────────── */}
          <div className={styles.sectionLabel} style={{ padding: "16px 32px 8px" }}>
            Load Time Trend
          </div>

          {/* ── Load Time Bar Chart ──────────────────────────────────────── */}
          <div className={styles.chartsGrid} style={{ gridTemplateColumns: "1fr" }}>
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Average Page Load (ms)</div>
              <div className={styles.barChart}>
                {loadTimeData.map((d, i) => {
                  const pct = (d.ms / maxLoadTime) * 100;
                  const color = d.ms <= 1800 ? "var(--green)" : d.ms <= 2000 ? "var(--accent)" : "var(--amber)";
                  return (
                    <div
                      key={d.month}
                      className={styles.barCol}
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <div className={styles.barFill} style={{ height: `${pct}%`, background: color }} />
                      <div className={styles.barLabel}>{d.month}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
         SEO Tab
         ════════════════════════════════════════════════════════════════════ */}
      {tab === "SEO" && (
        <>
          {/* ── Traffic overview stat cards ──────────────────────────────── */}
          <div className={styles.sectionLabel} style={{ padding: "16px 32px 8px" }}>
            Traffic Overview (Monthly Average)
          </div>

          <div className={styles.statGrid}>
            {([
              { label: "Organic", value: trafficAverages.organic.toLocaleString(), tone: "statBarGreen" as const },
              { label: "Direct", value: trafficAverages.direct.toLocaleString(), tone: "statBarAccent" as const },
              { label: "Referral", value: trafficAverages.referral.toLocaleString(), tone: "statBarAmber" as const }
            ]).map((stat, i) => (
              <div
                key={stat.label}
                className={styles.statCard}
                style={{ "--i": i } as React.CSSProperties}
              >
                <div className={cx("statBar", stat.tone)} />
                <div style={{ fontSize: "0.64rem", color: "var(--muted)", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "var(--font-syne)" }}>{stat.value}</div>
                <div style={{ marginTop: 8 }}>
                  <Sparkline
                    data={MONTHLY_TRAFFIC.map((m) =>
                      stat.label === "Organic" ? m.organic : stat.label === "Direct" ? m.direct : m.referral
                    )}
                    color={
                      stat.label === "Organic" ? "var(--green)"
                        : stat.label === "Direct" ? "var(--accent)"
                        : "var(--amber)"
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ── Keyword Rankings Table ───────────────────────────────────── */}
          <div className={styles.sectionLabel} style={{ padding: "16px 32px 8px" }}>
            Keyword Rankings
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Position</th>
                  <th>Change</th>
                  <th>Monthly Volume</th>
                  <th>Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {sortedKeywords.map((kw) => (
                  <tr key={kw.keyword}>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: "0.74rem" }}>{kw.keyword}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 700 }}>
                        #{kw.position}
                      </span>
                    </td>
                    <td>
                      <span className={kw.change > 0 ? styles.changeUp : kw.change < 0 ? styles.changeDown : styles.changeStable}>
                        {kw.change > 0 ? `\u2191 ${kw.change}` : kw.change < 0 ? `\u2193 ${Math.abs(kw.change)}` : "\u2192 0"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "0.72rem" }}>{kw.volume}</span>
                    </td>
                    <td>
                      <span className={cx("badge", kw.difficulty === "Low" ? "badgeGreen" : kw.difficulty === "Medium" ? "badgeAmber" : "badgeRed")}>
                        {kw.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Traffic Sparklines ───────────────────────────────────────── */}
          <div className={styles.sectionLabel} style={{ padding: "16px 32px 8px" }}>
            Traffic Channels (6-month trend)
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, padding: "0 32px 24px" }}>
            {([
              { label: "Organic Search", color: "var(--green)", key: "organic" as const },
              { label: "Direct Traffic", color: "var(--accent)", key: "direct" as const },
              { label: "Referral Traffic", color: "var(--amber)", key: "referral" as const }
            ]).map((channel, i) => (
              <div
                key={channel.label}
                className={styles.scoreCard}
                style={{ "--i": i } as React.CSSProperties}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700 }}>{channel.label}</span>
                  <span style={{ fontSize: "0.62rem", color: "var(--muted)", fontFamily: "var(--font-dm-mono)" }}>
                    6 months
                  </span>
                </div>
                <Sparkline
                  data={MONTHLY_TRAFFIC.map((m) => m[channel.key])}
                  color={channel.color}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  {MONTHLY_TRAFFIC.map((m) => (
                    <span key={m.month} style={{ fontSize: "0.48rem", color: "var(--muted)", fontFamily: "var(--font-dm-mono)" }}>
                      {m.month}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
         Uptime Tab
         ════════════════════════════════════════════════════════════════════ */}
      {tab === "Uptime" && (
        <>
          {/* ── Overall uptime stat ──────────────────────────────────────── */}
          <div className={styles.sectionLabel} style={{ padding: "16px 32px 8px" }}>
            Overall Uptime
          </div>

          <div className={styles.statGrid} style={{ maxWidth: 360 }}>
            <div className={styles.statCard}>
              <div className={cx("statBar", "statBarGreen")} />
              <div style={{ fontSize: "0.64rem", color: "var(--muted)", marginBottom: 4 }}>
                Avg. Service Uptime
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-syne)" }}>
                {overallUptime}
              </div>
              <div style={{ fontSize: "0.58rem", color: "var(--muted)", marginTop: 4, fontFamily: "var(--font-dm-mono)" }}>
                Across {UPTIME_ENTRIES.length} monitored services
              </div>
            </div>
          </div>

          {/* ── Service Status Cards ─────────────────────────────────────── */}
          <div className={styles.sectionLabel} style={{ padding: "16px 32px 8px" }}>
            Service Status
          </div>

          <div className={styles.uptimeGrid}>
            {UPTIME_ENTRIES.map((entry, i) => (
              <div
                key={entry.service}
                className={styles.uptimeCard}
                style={{ "--i": i } as React.CSSProperties}
              >
                <div className={styles.uptimeCardHeader}>
                  <span className={styles.uptimeCardService}>{entry.service}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className={cx("uptimeStatusDot", UPTIME_DOT[entry.status])} />
                    <span className={cx("badge", UPTIME_BADGE[entry.status])}>
                      {entry.status === "operational" ? "Operational" : entry.status === "degraded" ? "Degraded" : "Outage"}
                    </span>
                  </div>
                </div>
                <div className={styles.uptimeCardStats}>
                  <div className={styles.uptimeCardStat}>
                    <span className={styles.uptimeCardStatValue}>{entry.uptime}</span>
                    Uptime
                  </div>
                  <div className={styles.uptimeCardStat}>
                    <span className={styles.uptimeCardStatValue}>{entry.responseTime}</span>
                    Response Time
                  </div>
                  <div className={styles.uptimeCardStat}>
                    <span className={styles.uptimeCardStatValue}>{entry.lastIncident}</span>
                    Last Incident
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Incident Timeline ────────────────────────────────────────── */}
          <div className={styles.sectionLabel} style={{ padding: "16px 32px 8px" }}>
            Recent Incidents
          </div>

          <div className={styles.incidentTimeline}>
            {INCIDENTS.map((incident) => {
              const isOngoing = incident.duration === "Ongoing";
              return (
                <div key={incident.id} className={styles.incidentItem}>
                  <div
                    className={styles.incidentDot}
                    style={{ background: isOngoing ? "var(--amber)" : "var(--muted2)" }}
                  />
                  <div className={styles.incidentBody}>
                    <div className={styles.incidentTitle}>
                      {incident.service}
                      {isOngoing && (
                        <span className={cx("badge", "badgeAmber")} style={{ marginLeft: 8, fontSize: "0.52rem" }}>
                          Ongoing
                        </span>
                      )}
                    </div>
                    <div className={styles.incidentMeta}>
                      {incident.timestamp} &middot; Duration: {incident.duration}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text)", marginTop: 4, lineHeight: 1.5 }}>
                      {incident.resolution}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
