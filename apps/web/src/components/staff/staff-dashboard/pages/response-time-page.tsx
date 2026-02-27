"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type TabKey = "overview" | "by_client" | "log";

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

function formatHours(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
  return `${Math.round((hours / 24) * 10) / 10}d`;
}

function ResponseBar({ value, max = 20 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value <= target ? "var(--accent)" : value <= target * 2 ? "#f5c518" : "#ff4444";
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
    </div>
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
        <line x1={xPad} x2={width - xPad} y1={targetY} y2={targetY} stroke="rgba(255,68,68,0.4)" strokeDasharray="4 4" />
        <polyline points={polyline} fill="none" stroke="var(--accent)" strokeWidth="2" />
        {coords.map((coord) => (
          <circle key={coord.point.week} cx={coord.x} cy={coord.y} r="3" fill="var(--accent)" />
        ))}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`, gap: 8, marginTop: 6 }}>
        {points.map((point) => (
          <div key={point.week} style={{ fontSize: 10, color: "var(--muted2)", textAlign: "center" }}>
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
    <section className={cx("page", isActive && "pageActive")} id="page-response-time">
      <style>{`
        .rt-tab-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .rt-filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .rt-filter-btn:hover { opacity: 0.8; }
        .rt-response-row { transition: background 0.1s ease; }
        .rt-response-row:hover { background: rgba(255,255,255,0.02) !important; }
        .rt-client-row { transition: all 0.12s ease; cursor: pointer; }
        .rt-client-row:hover { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Client Intelligence
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Response Time
            </h1>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Portfolio avg", value: `${overallAvg}h`, color: overallAvg <= target ? "var(--accent)" : "#f5c518" },
              { label: "Under 2h rate", value: `${under2hRate}%`, color: under2hRate >= 70 ? "var(--accent)" : "#f5c518" },
              { label: "Target", value: `<${target}h`, color: "var(--muted2)" }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 0 }}>
          {[
            { key: "overview", label: "Overview" },
            { key: "by_client", label: "By Client" },
            { key: "log", label: "Response Log" }
          ].map((entry) => (
            <button
              key={entry.key}
              type="button"
              className="rt-tab-btn"
              onClick={() => setTab(entry.key as TabKey)}
              style={{
                padding: "10px 20px",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: "transparent",
                color: tab === entry.key ? "var(--accent)" : "var(--muted2)",
                borderBottom: `2px solid ${tab === entry.key ? "var(--accent)" : "transparent"}`,
                marginBottom: -1
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 12px 8px 0" }}>
        {tab === "overview" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
              {[
                { label: "Overall avg", value: `${overallAvg}h`, color: overallAvg <= target ? "var(--accent)" : "#f5c518", sub: overallAvg <= target ? "On target" : "Above target" },
                { label: "Fastest (4w)", value: formatHours(fastestResponse), color: "var(--accent)", sub: "Best response" },
                { label: "Slowest (4w)", value: formatHours(slowestResponse), color: slowestResponse > 8 ? "#ff4444" : "#f5c518", sub: "Needs attention" },
                { label: "Under 2h rate", value: `${under2hRate}%`, color: under2hRate >= 70 ? "var(--accent)" : "#f5c518", sub: `${recentResponses.filter((r) => r.onTarget).length} of ${recentResponses.length} responses` }
              ].map((stat) => (
                <div key={stat.label} style={{ padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{stat.label}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: "var(--muted2)" }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Weekly Avg Response Time</div>
                <div style={{ fontSize: 10, color: "var(--muted2)" }}>Target ({target}h)</div>
              </div>
              <MiniLineChart points={weeklyTrend} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Response Distribution</div>
                {[
                  { label: "Under 1h", count: recentResponses.filter((r) => r.responseTime < 1).length, color: "var(--accent)" },
                  { label: "1-2h", count: recentResponses.filter((r) => r.responseTime >= 1 && r.responseTime < 2).length, color: "#a0c840" },
                  { label: "2-4h", count: recentResponses.filter((r) => r.responseTime >= 2 && r.responseTime < 4).length, color: "#f5c518" },
                  { label: "4-8h", count: recentResponses.filter((r) => r.responseTime >= 4 && r.responseTime < 8).length, color: "#ff8c00" },
                  { label: "8h+", count: recentResponses.filter((r) => r.responseTime >= 8).length, color: "#ff4444" }
                ].map((bucket) => (
                  <div key={bucket.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--muted2)", minWidth: 50 }}>{bucket.label}</span>
                    <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(bucket.count / recentResponses.length) * 100}%`, background: bucket.color, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, color: bucket.color, minWidth: 16, textAlign: "right" }}>{bucket.count}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: 20, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Quick Insights</div>
                {[
                  { icon: overallAvg <= target ? "↓" : "↑", text: `Portfolio avg ${overallAvg}h - ${overallAvg <= target ? "on" : "above"} target`, color: overallAvg <= target ? "var(--accent)" : "#f5c518" },
                  { icon: "⚡", text: "Fastest client: Okafor & Sons (avg 0.9h)", color: "var(--accent)" },
                  { icon: "⚑", text: "Kestrel Capital slowest at 3.1h - above target", color: "#ff4444" },
                  { icon: "↑", text: "Response time improving - down 0.6h vs last month", color: "var(--accent)" }
                ].map((item) => (
                  <div key={item.text} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ color: item.color, fontSize: 12, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "by_client" ? (
          <div style={{ maxWidth: 760 }}>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
              Average response time per client - Target &lt;{target}h
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sortedByClient.map((clientMetric) => {
                const client = clients.find((row) => row.id === clientMetric.clientId);
                const color = clientMetric.avg <= target ? "var(--accent)" : clientMetric.avg <= target * 1.5 ? "#f5c518" : "#ff4444";
                const hitRate = Math.round((clientMetric.under2h / clientMetric.responses) * 100);
                return (
                  <div key={clientMetric.clientId} className="rt-client-row" style={{ padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 2, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#a0a0b0", flexShrink: 0 }}>{client?.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 13, color: "#fff" }}>{clientMetric.name}</span>
                          <span style={{ fontSize: 10, color: clientMetric.trend === "down" ? "var(--accent)" : "#ff4444" }}>
                            {clientMetric.trend === "down" ? "↓" : "↑"} {Math.abs(clientMetric.trendVal)}h vs last month
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>{clientMetric.responses} responses - {hitRate}% under 2h</div>
                      </div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color, textAlign: "right" }}>{clientMetric.avg}h</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <ResponseBar value={clientMetric.avg} max={Math.max(maxClientAvg, 4)} />
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                        <span style={{ fontSize: 10, color: clientMetric.avg <= target ? "var(--accent)" : "#f5c518" }}>
                          {clientMetric.avg <= target ? "On target" : "Above target"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 24, padding: 20, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Response Time by Client</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {byClient.map((clientMetric) => {
                  const color = clientMetric.avg <= target ? "var(--accent)" : clientMetric.avg <= target * 1.5 ? "#f5c518" : "#ff4444";
                  return (
                    <div key={`bar-${clientMetric.clientId}`} style={{ display: "grid", gridTemplateColumns: "120px 1fr 60px", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "var(--muted2)" }}>{clientMetric.name.split(" ")[0]}</span>
                      <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(clientMetric.avg / Math.max(maxClientAvg, 4)) * 100}%`, background: color }} />
                      </div>
                      <span style={{ fontSize: 10, color, textAlign: "right" }}>{clientMetric.avg}h</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, fontSize: 10, color: "var(--muted2)" }}>Dashed threshold (conceptual): target &lt; {target}h</div>
            </div>
          </div>
        ) : null}

        {tab === "log" ? (
          <div style={{ maxWidth: 780 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={clientFilter}
                onChange={(event) => setClientFilter(event.target.value)}
                style={{ padding: "7px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "var(--text)", fontSize: 11, fontFamily: "'DM Mono', monospace", outline: "none" }}
              >
                <option value="all">All clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 4 }}>
                {(["time", "fastest", "slowest"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className="rt-filter-btn"
                    onClick={() => setSortBy(mode)}
                    style={{ padding: "6px 12px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 2, background: sortBy === mode ? "rgba(255,255,255,0.08)" : "transparent", color: sortBy === mode ? "var(--text)" : "var(--muted2)" }}
                  >
                    {mode === "time" ? "Most recent" : mode === "fastest" ? "Fastest first" : "Slowest first"}
                  </button>
                ))}
              </div>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted2)" }}>{filteredResponses.length} responses</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {filteredResponses.map((response) => {
                const color = response.responseTime <= target ? "var(--accent)" : response.responseTime <= target * 2 ? "#f5c518" : "#ff4444";
                return (
                  <div key={response.id} className="rt-response-row" style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ minWidth: 56, padding: "6px 0", textAlign: "center", border: `1px solid ${color}30`, borderRadius: 3, background: `${color}08`, flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>
                        {formatHours(response.responseTime)}
                      </div>
                      <div style={{ fontSize: 8, color, marginTop: 2, letterSpacing: "0.06em" }}>{response.onTarget ? "OK" : "SLOW"}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#a0a0b0", fontWeight: 500 }}>{response.client}</span>
                        <span style={{ fontSize: 10, color: "#333344" }}>·</span>
                        <span style={{ fontSize: 10, color: "var(--muted2)" }}>Received {response.sentAt}</span>
                        <span style={{ fontSize: 10, color: "#333344" }}>→</span>
                        <span style={{ fontSize: 10, color: "var(--muted2)" }}>Replied {response.respondedAt}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted2)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        "{response.messagePreview}"
                      </div>
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
