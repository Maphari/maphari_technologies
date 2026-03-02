"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type TabKey = "overview" | "by_client" | "log";
type Tier = "good" | "warn" | "bad";

type Client = { id: number; name: string; avatar: string };
type TrendPoint = { week: string; avg: number; best: number; worst: number };
type ClientMetric = {
  clientId: number;
  name: string;
  avg: number;
  responses: number;
  under2h: number;
  trend: "down" | "up";
  trendVal: number;
};
type ResponseLog = {
  id: number;
  clientId: number;
  client: string;
  messagePreview: string;
  sentAt: string;
  respondedAt: string;
  responseTime: number;
  onTarget: boolean;
};

const clients: Client[] = [
  { id: 1, name: "Volta Studios", avatar: "VS" },
  { id: 2, name: "Kestrel Capital", avatar: "KC" },
  { id: 3, name: "Mira Health", avatar: "MH" },
  { id: 4, name: "Dune Collective", avatar: "DC" },
  { id: 5, name: "Okafor & Sons", avatar: "OS" }
];

const target = 2.0;

const weeklyTrend: TrendPoint[] = [
  { week: "Jan W3", avg: 2.4, best: 0.5, worst: 6.2 },
  { week: "Jan W4", avg: 1.9, best: 0.3, worst: 4.8 },
  { week: "Feb W1", avg: 2.1, best: 0.4, worst: 5.1 },
  { week: "Feb W2", avg: 1.8, best: 0.3, worst: 3.9 },
  { week: "Feb W3", avg: 2.2, best: 0.5, worst: 5.6 },
  { week: "Feb W4", avg: 1.6, best: 0.2, worst: 3.2 }
];

const byClient: ClientMetric[] = [
  { clientId: 1, name: "Volta Studios", avg: 1.4, responses: 12, under2h: 9, trend: "down", trendVal: -0.4 },
  { clientId: 2, name: "Kestrel Capital", avg: 3.1, responses: 6, under2h: 2, trend: "up", trendVal: 0.8 },
  { clientId: 3, name: "Mira Health", avg: 1.7, responses: 9, under2h: 7, trend: "down", trendVal: -0.2 },
  { clientId: 4, name: "Dune Collective", avg: 2.8, responses: 4, under2h: 1, trend: "up", trendVal: 0.5 },
  { clientId: 5, name: "Okafor & Sons", avg: 0.9, responses: 8, under2h: 8, trend: "down", trendVal: -0.3 }
];

const recentResponses: ResponseLog[] = [
  { id: 1, clientId: 1, client: "Volta Studios", messagePreview: "Can we tweak the secondary colour warmer?", sentAt: "Feb 22 11:32 AM", respondedAt: "Feb 22 2:05 PM", responseTime: 2.55, onTarget: false },
  { id: 2, clientId: 3, client: "Mira Health", messagePreview: "Booking step 3 is confusing - can we simplify nav labels?", sentAt: "Feb 19 3:30 PM", respondedAt: "Feb 19 4:00 PM", responseTime: 0.5, onTarget: true },
  { id: 3, clientId: 2, client: "Kestrel Capital", messagePreview: "Sorry for the delay - AP department has been chaotic.", sentAt: "Feb 20 11:00 AM", respondedAt: "Feb 20 3:45 PM", responseTime: 4.75, onTarget: false },
  { id: 4, clientId: 5, client: "Okafor & Sons", messagePreview: "The charts look exceptional - thank you.", sentAt: "Feb 20 9:30 AM", respondedAt: "Feb 20 10:15 AM", responseTime: 0.75, onTarget: true },
  { id: 5, clientId: 1, client: "Volta Studios", messagePreview: "Perfect. Let's review properly on the call tomorrow.", sentAt: "Feb 22 3:40 PM", respondedAt: "Feb 23 9:00 AM", responseTime: 17.3, onTarget: false },
  { id: 6, clientId: 3, client: "Mira Health", messagePreview: "Can you confirm when the clinical review starts?", sentAt: "Feb 21 10:00 AM", respondedAt: "Feb 21 11:30 AM", responseTime: 1.5, onTarget: true },
  { id: 7, clientId: 5, client: "Okafor & Sons", messagePreview: "When can we expect the next set of charts?", sentAt: "Feb 16 2:00 PM", respondedAt: "Feb 16 2:45 PM", responseTime: 0.75, onTarget: true },
  { id: 8, clientId: 2, client: "Kestrel Capital", messagePreview: "Just confirming receipt of the strategy deck.", sentAt: "Feb 18 9:00 AM", respondedAt: "Feb 18 1:30 PM", responseTime: 4.5, onTarget: false }
];

const overallAvg = Math.round((byClient.reduce((sum, client) => sum + client.avg, 0) / byClient.length) * 10) / 10;
const under2hRate = Math.round((recentResponses.filter((response) => response.onTarget).length / recentResponses.length) * 100);
const fastestResponse = Math.min(...recentResponses.map((response) => response.responseTime));
const slowestResponse = Math.max(...recentResponses.map((response) => response.responseTime));

const tierToneClass: Record<Tier, string> = {
  good: "rspToneGood",
  warn: "rspToneWarn",
  bad: "rspToneBad"
};

const tierMeterClass: Record<Tier, string> = {
  good: "rspMeterGood",
  warn: "rspMeterWarn",
  bad: "rspMeterBad"
};

const tierBadgeClass: Record<Tier, string> = {
  good: "rspTimeBadgeGood",
  warn: "rspTimeBadgeWarn",
  bad: "rspTimeBadgeBad"
};

function formatHours(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
  return `${Math.round((hours / 24) * 10) / 10}d`;
}

function clientTier(value: number): Tier {
  if (value <= target) return "good";
  if (value <= target * 1.5) return "warn";
  return "bad";
}

function logTier(value: number): Tier {
  if (value <= target) return "good";
  if (value <= target * 2) return "warn";
  return "bad";
}

function ResponseBar({ value, max = 20, tier }: { value: number; max?: number; tier: Tier }) {
  return (
    <progress className={cx("rspBar", tierMeterClass[tier])} max={max} value={Math.min(value, max)} />
  );
}

function MiniLineChart({ points }: { points: TrendPoint[] }) {
  const width = 760;
  const height = 180;
  const xPad = 14;
  const yPad = 12;
  const maxY = 7;
  const minY = 0;

  const coords = points.map((point, index) => {
    const x = xPad + (index / Math.max(1, points.length - 1)) * (width - xPad * 2);
    const y = yPad + (1 - (point.avg - minY) / (maxY - minY)) * (height - yPad * 2);
    return { x, y, point };
  });

  const polyline = coords.map((coord) => `${coord.x},${coord.y}`).join(" ");
  const targetY = yPad + (1 - (target - minY) / (maxY - minY)) * (height - yPad * 2);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="180">
        <line x1={xPad} x2={width - xPad} y1={targetY} y2={targetY} stroke="color-mix(in srgb, var(--red) 40%, transparent)" strokeDasharray="4 4" />
        <polyline points={polyline} fill="none" stroke="var(--accent)" strokeWidth="2" />
        {coords.map((coord) => (
          <circle key={coord.point.week} cx={coord.x} cy={coord.y} r="3" fill="var(--accent)" />
        ))}
      </svg>
      <div className={cx("rspChartLabels")}>
        {points.map((point) => (
          <div key={point.week} className={cx("text10", "colorMuted2", "textCenter", "rspChartLabel")}>
            {point.week}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResponseTimePage({ isActive }: { isActive: boolean }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"time" | "fastest" | "slowest">("time");

  const filteredResponses = useMemo(() => {
    return recentResponses
      .filter((response) => clientFilter === "all" || response.clientId === Number.parseInt(clientFilter, 10))
      .sort((a, b) => {
        if (sortBy === "fastest") return a.responseTime - b.responseTime;
        if (sortBy === "slowest") return b.responseTime - a.responseTime;
        return b.id - a.id;
      });
  }, [clientFilter, sortBy]);

  const sortedByClient = useMemo(() => [...byClient].sort((a, b) => a.avg - b.avg), []);
  const maxClientAvg = Math.max(...byClient.map((client) => client.avg), target);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-response-time">
      <div className={cx("pageHeaderBar", "borderB", "pb0")}>
        <div className={cx("flexBetween", "mb20")}>
          <div>
            <div className={cx("pageEyebrow")}>Staff Dashboard / Client Intelligence</div>
            <h1 className={cx("pageTitle")}>Response Time</h1>
          </div>
          <div className={cx("flexRow", "gap24")}>
            {[
              { label: "Portfolio avg", value: `${overallAvg}h`, colorClass: overallAvg <= target ? "rspToneGood" : "rspToneWarn" },
              { label: "Under 2h rate", value: `${under2hRate}%`, colorClass: under2hRate >= 70 ? "rspToneGood" : "rspToneWarn" },
              { label: "Target", value: `<${target}h`, colorClass: "rspToneMuted" }
            ].map((stat) => (
              <div key={stat.label} className={cx("textRight")}>
                <div className={cx("rspStatLabel")}>{stat.label}</div>
                <div className={cx("fontDisplay", "fw800", "rspStatValue", stat.colorClass)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("flexRow")}>
          {[
            { key: "overview", label: "Overview" },
            { key: "by_client", label: "By Client" },
            { key: "log", label: "Response Log" }
          ].map((entry) => (
            <button
              key={entry.key}
              type="button"
              className={cx("rspTabBtn", tab === entry.key && "rspTabBtnActive")}
              onClick={() => setTab(entry.key as TabKey)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cx("rspContent")}>
        {tab === "overview" ? (
          <div className={cx("flexCol", "gap24")}>
            <div className={cx("rspStatsGrid")}>
              {[
                {
                  label: "Overall avg",
                  value: `${overallAvg}h`,
                  colorClass: overallAvg <= target ? "rspToneGood" : "rspToneWarn",
                  sub: overallAvg <= target ? "On target" : "Above target"
                },
                { label: "Fastest (4w)", value: formatHours(fastestResponse), colorClass: "rspToneGood", sub: "Best response" },
                {
                  label: "Slowest (4w)",
                  value: formatHours(slowestResponse),
                  colorClass: slowestResponse > 8 ? "rspToneBad" : "rspToneWarn",
                  sub: "Needs attention"
                },
                {
                  label: "Under 2h rate",
                  value: `${under2hRate}%`,
                  colorClass: under2hRate >= 70 ? "rspToneGood" : "rspToneWarn",
                  sub: `${recentResponses.filter((response) => response.onTarget).length} of ${recentResponses.length} responses`
                }
              ].map((stat) => (
                <div key={stat.label} className={cx("rspStatCard")}>
                  <div className={cx("rspCardLabel")}>{stat.label}</div>
                  <div className={cx("fontDisplay", "fw800", "mb4", "rspCardValue", stat.colorClass)}>{stat.value}</div>
                  <div className={cx("text10", "colorMuted2")}>{stat.sub}</div>
                </div>
              ))}
            </div>

            <div className={cx("rspChartCard")}>
              <div className={cx("flexBetween", "mb16")}>
                <div className={cx("rspCardLabel")}>Weekly Avg Response Time</div>
                <div className={cx("text10", "colorMuted2")}>Target ({target}h)</div>
              </div>
              <MiniLineChart points={weeklyTrend} />
            </div>

            <div className={cx("grid2", "gap20")}>
              <div className={cx("rspChartCard")}>
                <div className={cx("rspCardLabel", "mb16")}>Response Distribution</div>
                {[
                  { label: "Under 1h", count: recentResponses.filter((response) => response.responseTime < 1).length, meterClass: "rspMeterGood", toneClass: "rspToneGood" },
                  { label: "1-2h", count: recentResponses.filter((response) => response.responseTime >= 1 && response.responseTime < 2).length, meterClass: "rspMeterGreen", toneClass: "rspToneGreen" },
                  { label: "2-4h", count: recentResponses.filter((response) => response.responseTime >= 2 && response.responseTime < 4).length, meterClass: "rspMeterWarn", toneClass: "rspToneWarn" },
                  { label: "4-8h", count: recentResponses.filter((response) => response.responseTime >= 4 && response.responseTime < 8).length, meterClass: "rspMeterOrange", toneClass: "rspToneOrange" },
                  { label: "8h+", count: recentResponses.filter((response) => response.responseTime >= 8).length, meterClass: "rspMeterBad", toneClass: "rspToneBad" }
                ].map((bucket) => (
                  <div key={bucket.label} className={cx("flexRow", "gap10", "mb8")}>
                    <span className={cx("text11", "colorMuted2", "rspDistLabel")}>{bucket.label}</span>
                    <progress
                      className={cx("rspDistBar", bucket.meterClass)}
                      max={recentResponses.length}
                      value={bucket.count}
                    />
                    <span className={cx("text11", "rspDistCount", bucket.toneClass)}>{bucket.count}</span>
                  </div>
                ))}
              </div>

              <div className={cx("rspChartCard")}>
                <div className={cx("rspCardLabel", "mb16")}>Quick Insights</div>
                {[
                  {
                    icon: overallAvg <= target ? "\u2193" : "\u2191",
                    text: `Portfolio avg ${overallAvg}h - ${overallAvg <= target ? "on" : "above"} target`,
                    toneClass: overallAvg <= target ? "rspToneGood" : "rspToneWarn"
                  },
                  { icon: "\u26A1", text: "Fastest client: Okafor & Sons (avg 0.9h)", toneClass: "rspToneGood" },
                  { icon: "\u2691", text: "Kestrel Capital slowest at 3.1h - above target", toneClass: "rspToneBad" },
                  { icon: "\u2191", text: "Response time improving - down 0.6h vs last month", toneClass: "rspToneGood" }
                ].map((item) => (
                  <div key={item.text} className={cx("rspInsightRow")}>
                    <span className={cx("text12", "noShrink", item.toneClass)}>{item.icon}</span>
                    <span className={cx("text12", "colorMuted", "rspInsightText")}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "by_client" ? (
          <div className={cx("rspClientWrap")}>
            <div className={cx("rspCardLabel", "mb16")}>Average response time per client - Target &lt;{target}h</div>
            <div className={cx("flexCol", "gap10")}>
              {sortedByClient.map((clientMetric) => {
                const client = clients.find((row) => row.id === clientMetric.clientId);
                const tier = clientTier(clientMetric.avg);
                const hitRate = Math.round((clientMetric.under2h / clientMetric.responses) * 100);
                return (
                  <div key={clientMetric.clientId} className={cx("rspClientRow")}>
                    <div className={cx("flexRow", "gap14", "mb10")}>
                      <div className={cx("rspClientAvatar")}>{client?.avatar}</div>
                      <div className={cx("flex1")}>
                        <div className={cx("flexRow", "gap10")}>
                          <span className={cx("text13", "colorText")}>{clientMetric.name}</span>
                          <span className={cx("text10", clientMetric.trend === "down" ? "rspToneGood" : "rspToneBad")}>
                            {clientMetric.trend === "down" ? "\u2193" : "\u2191"} {Math.abs(clientMetric.trendVal)}h vs last month
                          </span>
                        </div>
                        <div className={cx("text10", "colorMuted2", "mt4")}>
                          {clientMetric.responses} responses - {hitRate}% under 2h
                        </div>
                      </div>
                      <div className={cx("fontDisplay", "fw800", "textRight", "rspClientAvg", tierToneClass[tier])}>{clientMetric.avg}h</div>
                    </div>
                    <div className={cx("flexRow", "gap8")}>
                      <ResponseBar value={clientMetric.avg} max={Math.max(maxClientAvg, 4)} tier={tier} />
                      <div className={cx("flexRow", "gap4", "noShrink")}>
                        <div className={cx("rspStatusDot", tierToneClass[tier])} />
                        <span className={cx("text10", clientMetric.avg <= target ? "rspToneGood" : "rspToneWarn")}>
                          {clientMetric.avg <= target ? "On target" : "Above target"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={cx("rspChartCard", "mt24")}>
              <div className={cx("rspCardLabel", "mb16")}>Response Time by Client</div>
              <div className={cx("flexCol", "gap8")}>
                {byClient.map((clientMetric) => {
                  const tier = clientTier(clientMetric.avg);
                  return (
                    <div key={`bar-${clientMetric.clientId}`} className={cx("rspBarRow")}>
                      <span className={cx("text10", "colorMuted2")}>{clientMetric.name.split(" ")[0]}</span>
                      <progress
                        className={cx("rspBarRowMeter", tierMeterClass[tier])}
                        max={Math.max(maxClientAvg, 4)}
                        value={clientMetric.avg}
                      />
                      <span className={cx("text10", "textRight", tierToneClass[tier])}>{clientMetric.avg}h</span>
                    </div>
                  );
                })}
              </div>
              <div className={cx("text10", "colorMuted2", "mt10")}>Dashed threshold (conceptual): target &lt; {target}h</div>
            </div>
          </div>
        ) : null}

        {tab === "log" ? (
          <div className={cx("rspLogWrap")}>
            <div className={cx("flexRow", "gap10", "mb20", "flexWrap")}>
              <select aria-label="Filter response log by client" value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} className={cx("rspSelect")}>
                <option value="all">All clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <select
                className={cx("filterSelect")}
                aria-label="Sort response log"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as "time" | "fastest" | "slowest")}
              >
                <option value="time">Most recent</option>
                <option value="fastest">Fastest first</option>
                <option value="slowest">Slowest first</option>
              </select>
              <span className={cx("text11", "colorMuted2", "rspCountMeta")}>{filteredResponses.length} responses</span>
            </div>

            <div className={cx("flexCol")}>
              {filteredResponses.map((response) => {
                const tier = logTier(response.responseTime);
                return (
                  <div key={response.id} className={cx("rspResponseRow")}>
                    <div className={cx("rspTimeBadge", tierBadgeClass[tier])}>
                      <div className={cx("fontDisplay", "fw800", "rspTimeBadgeValue", tierToneClass[tier])}>{formatHours(response.responseTime)}</div>
                      <div className={cx("rspTimeBadgeLabel", tierToneClass[tier])}>{response.onTarget ? "OK" : "SLOW"}</div>
                    </div>
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("flexRow", "gap10", "mb4")}>
                        <span className={cx("text11", "colorMuted", "fw600")}>{response.client}</span>
                        <span className={cx("text10", "colorMuted2")}>&middot;</span>
                        <span className={cx("text10", "colorMuted2")}>Received {response.sentAt}</span>
                        <span className={cx("text10", "colorMuted2")}>&rarr;</span>
                        <span className={cx("text10", "colorMuted2")}>Replied {response.respondedAt}</span>
                      </div>
                      <div className={cx("text12", "colorMuted2", "truncate", "rspPreview")}>&ldquo;{response.messagePreview}&rdquo;</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
