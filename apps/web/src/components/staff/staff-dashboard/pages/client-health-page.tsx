"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type ClientHealthPageProps = {
  isActive: boolean;
};

type HealthSignalType = "positive" | "neutral" | "negative";
type SentimentType = "positive" | "neutral" | "at_risk";

type HealthClient = {
  id: number;
  name: string;
  avatar: string;
  score: number;
  trend: "up" | "down" | "stable";
  trendVal: string;
  sentiment: SentimentType;
  lastTouched: string;
  overdueTasks: number;
  unreadMessages: number;
  invoiceStatus: "paid" | "pending" | "overdue";
  milestoneDelay: number;
  retainerBurn: number;
  signals: Array<{ type: HealthSignalType; text: string }>;
  project: string;
  manager: string;
};

const healthData: HealthClient[] = [
  {
    id: 1,
    name: "Volta Studios",
    avatar: "VS",
    score: 87,
    trend: "up",
    trendVal: "+4",
    sentiment: "positive",
    lastTouched: "Today",
    overdueTasks: 0,
    unreadMessages: 1,
    invoiceStatus: "paid",
    milestoneDelay: 0,
    retainerBurn: 62,
    signals: [
      { type: "positive", text: "Approved milestone on time" },
      { type: "positive", text: "Invoice paid within 3 days" },
      { type: "neutral", text: "1 unread message (sent 2h ago)" }
    ],
    project: "Brand Identity System",
    manager: "You"
  },
  {
    id: 2,
    name: "Kestrel Capital",
    avatar: "KC",
    score: 54,
    trend: "down",
    trendVal: "-11",
    sentiment: "neutral",
    lastTouched: "3 days ago",
    overdueTasks: 2,
    unreadMessages: 4,
    invoiceStatus: "overdue",
    milestoneDelay: 5,
    retainerBurn: 91,
    signals: [
      { type: "negative", text: "Invoice 7 days overdue" },
      { type: "negative", text: "2 overdue tasks (5 days late)" },
      { type: "negative", text: "4 unread messages" },
      { type: "neutral", text: "Retainer 91% burned (8 days left)" }
    ],
    project: "Q1 Campaign Strategy",
    manager: "You"
  },
  {
    id: 3,
    name: "Mira Health",
    avatar: "MH",
    score: 73,
    trend: "stable",
    trendVal: "0",
    sentiment: "neutral",
    lastTouched: "Yesterday",
    overdueTasks: 1,
    unreadMessages: 0,
    invoiceStatus: "pending",
    milestoneDelay: 2,
    retainerBurn: 48,
    signals: [
      { type: "neutral", text: "Invoice pending (due in 4 days)" },
      { type: "negative", text: "1 task 2 days overdue" },
      { type: "positive", text: "Responded to all messages" }
    ],
    project: "Website Redesign",
    manager: "You"
  },
  {
    id: 4,
    name: "Dune Collective",
    avatar: "DC",
    score: 31,
    trend: "down",
    trendVal: "-19",
    sentiment: "at_risk",
    lastTouched: "6 days ago",
    overdueTasks: 4,
    unreadMessages: 7,
    invoiceStatus: "overdue",
    milestoneDelay: 12,
    retainerBurn: 103,
    signals: [
      { type: "negative", text: "Milestone 12 days delayed — no approval" },
      { type: "negative", text: "Invoice 18 days overdue" },
      { type: "negative", text: "7 unread messages — last contact 6 days ago" },
      { type: "negative", text: "Retainer exceeded by 3%" }
    ],
    project: "Editorial Design System",
    manager: "You"
  },
  {
    id: 5,
    name: "Okafor & Sons",
    avatar: "OS",
    score: 95,
    trend: "up",
    trendVal: "+7",
    sentiment: "positive",
    lastTouched: "Today",
    overdueTasks: 0,
    unreadMessages: 0,
    invoiceStatus: "paid",
    milestoneDelay: 0,
    retainerBurn: 34,
    signals: [
      { type: "positive", text: "All milestones on track" },
      { type: "positive", text: "Invoice paid 5 days early" },
      { type: "positive", text: "Responded to brief within 1 hour" }
    ],
    project: "Annual Report 2025",
    manager: "You"
  }
];

const sentimentConfig: Record<SentimentType, { label: string; color: string; bg: string }> = {
  positive: { label: "Positive", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 10%, transparent)" },
  neutral: { label: "Neutral", color: "#a0a0b0", bg: "rgba(160,160,176,0.1)" },
  at_risk: { label: "At Risk", color: "#ff4444", bg: "rgba(255,68,68,0.1)" }
};

const signalColor: Record<HealthSignalType, string> = {
  positive: "var(--accent)",
  neutral: "#a0a0b0",
  negative: "#ff4444"
};

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "var(--accent)" : score >= 50 ? "#f5c518" : "#ff4444";

  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text
        x="48"
        y="48"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontFamily="'DM Mono', monospace"
        fontSize="18"
        fontWeight="700"
      >
        {score}
      </text>
    </svg>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: color,
          borderRadius: 2,
          transition: "width 0.6s ease"
        }}
      />
    </div>
  );
}

export function ClientHealthPage({ isActive }: ClientHealthPageProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | SentimentType>("all");
  const [sortBy, setSortBy] = useState<"score" | "name">("score");

  const filtered = useMemo(
    () =>
      healthData
        .filter((client) => (filter === "all" ? true : client.sentiment === filter))
        .sort((a, b) => (sortBy === "score" ? b.score - a.score : a.name.localeCompare(b.name))),
    [filter, sortBy]
  );

  const selectedClient = selected ? healthData.find((client) => client.id === selected) ?? null : null;
  const avg = Math.round(healthData.reduce((sum, client) => sum + client.score, 0) / healthData.length);
  const atRisk = healthData.filter((client) => client.score < 50).length;

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-health">
      <style>{`
        .staff-health-row { transition: background 0.15s ease, border-color 0.15s ease; cursor: pointer; }
        .staff-health-row:hover { background: color-mix(in srgb, var(--accent) 4%, transparent) !important; border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; }
        .staff-health-btn { transition: all 0.15s ease; cursor: pointer; border: none; }
        .staff-health-btn:hover { opacity: 0.82; }
        .staff-health-signal-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
        .staff-health-action-btn { transition: all 0.15s ease; cursor: pointer; }
        .staff-health-action-btn:hover { background: color-mix(in srgb, var(--accent) 15%, transparent) !important; }
        @keyframes staffHealthFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .staff-health-fade-in { animation: staffHealthFadeIn 0.25s ease forwards; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--muted2)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 8
              }}
            >
              Staff Dashboard / Client Intelligence
            </div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 28,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em"
              }}
            >
              Client Health Score
            </h1>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Portfolio avg", value: avg, unit: "/100", color: avg >= 70 ? "var(--accent)" : "#f5c518" },
              { label: "At risk", value: atRisk, unit: " clients", color: atRisk > 0 ? "#ff4444" : "var(--accent)" },
              { label: "Total clients", value: healthData.length, unit: "", color: "#a0a0b0" }
            ].map((summary) => (
              <div key={summary.label} style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted2)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 4
                  }}
                >
                  {summary.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: summary.color
                  }}
                >
                  {summary.value}
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 400,
                      color: "var(--muted2)"
                    }}
                  >
                    {summary.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 24, alignItems: "center" }}>
          {[
            { key: "all", label: "All clients" },
            { key: "positive", label: "Positive" },
            { key: "neutral", label: "Neutral" },
            { key: "at_risk", label: "At risk" }
          ].map((option) => (
            <button
              key={option.key}
              className="staff-health-btn"
              onClick={() => setFilter(option.key as "all" | SentimentType)}
              style={{
                padding: "6px 14px",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                borderRadius: 2,
                background: filter === option.key ? "var(--accent)" : "rgba(255,255,255,0.04)",
                color: filter === option.key ? "#050508" : "#a0a0b0",
                fontFamily: "'DM Mono', monospace",
                fontWeight: filter === option.key ? 500 : 400
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.08em" }}>SORT</span>
            {(["score", "name"] as const).map((option) => (
              <button
                key={option}
                className="staff-health-btn"
                onClick={() => setSortBy(option)}
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderRadius: 2,
                  background: sortBy === option ? "rgba(255,255,255,0.08)" : "transparent",
                  color: sortBy === option ? "var(--text)" : "var(--muted2)",
                  fontFamily: "'DM Mono', monospace"
                }}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedClient ? "1fr 380px" : "1fr",
          minHeight: "calc(100vh - 250px)"
        }}
      >
        <div style={{ padding: "4px 0 0", borderRight: selectedClient ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((client) => {
              const cfg = sentimentConfig[client.sentiment];
              const isSelected = selected === client.id;
              return (
                <div
                  key={client.id}
                  className="staff-health-row"
                  onClick={() => setSelected(isSelected ? null : client.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "96px 1fr auto",
                    gap: 24,
                    alignItems: "center",
                    padding: "20px 24px",
                    border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 4,
                    background: isSelected ? "color-mix(in srgb, var(--accent) 4%, transparent)" : "rgba(255,255,255,0.01)"
                  }}
                >
                  <ScoreRing score={client.score} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 2,
                          background: "rgba(255,255,255,0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          letterSpacing: "0.05em",
                          color: "#a0a0b0",
                          fontWeight: 500
                        }}
                      >
                        {client.avatar}
                      </div>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>
                        {client.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 2,
                          background: cfg.bg,
                          color: cfg.color,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase"
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 4 }}>
                      {client.project} · Manager: {client.manager}
                    </div>
                    {client.milestoneDelay > 0 ? (
                      <div style={{ fontSize: 10, color: "#ff4444", marginBottom: 10 }}>
                        Milestone delay: {client.milestoneDelay} day{client.milestoneDelay === 1 ? "" : "s"}
                      </div>
                    ) : (
                      <div style={{ height: 14, marginBottom: 10 }} />
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                      {[
                        {
                          label: "Tasks",
                          val: Math.max(0, 100 - client.overdueTasks * 25),
                          raw: client.overdueTasks > 0 ? `${client.overdueTasks} overdue` : "On track"
                        },
                        {
                          label: "Messages",
                          val: Math.max(0, 100 - client.unreadMessages * 15),
                          raw: client.unreadMessages > 0 ? `${client.unreadMessages} unread` : "Clear"
                        },
                        {
                          label: "Invoice",
                          val: client.invoiceStatus === "paid" ? 100 : client.invoiceStatus === "pending" ? 70 : 20,
                          raw: client.invoiceStatus
                        },
                        {
                          label: "Retainer",
                          val: Math.max(0, 100 - client.retainerBurn),
                          raw: `${client.retainerBurn}% used`
                        }
                      ].map((bar) => {
                        const color = bar.val >= 70 ? "var(--accent)" : bar.val >= 40 ? "#f5c518" : "#ff4444";
                        return (
                          <div key={bar.label}>
                            <div
                              style={{
                                fontSize: 9,
                                color: "var(--muted2)",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                marginBottom: 4
                              }}
                            >
                              {bar.label}
                            </div>
                            <MiniBar value={bar.val} color={color} />
                            <div style={{ fontSize: 10, color, marginTop: 3 }}>{bar.raw}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", minWidth: 100 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        marginBottom: 8,
                        color:
                          client.trend === "up"
                            ? "var(--accent)"
                            : client.trend === "down"
                            ? "#ff4444"
                            : "#a0a0b0"
                      }}
                    >
                      {client.trend === "up" ? "↑" : client.trend === "down" ? "↓" : "→"} {client.trendVal} wk
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted2)" }}>Last touched</div>
                    <div style={{ fontSize: 11, color: "#a0a0b0" }}>{client.lastTouched}</div>
                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 10,
                        color: "var(--accent)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        opacity: isSelected ? 1 : 0.5
                      }}
                    >
                      {isSelected ? "▲ Close" : "▼ Details"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedClient ? (
          <div className="staff-health-fade-in" style={{ padding: "24px 28px" }}>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--muted2)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 8
                }}
              >
                Client Detail
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>
                {selectedClient.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 4 }}>
                {selectedClient.project} · {selectedClient.manager}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                marginBottom: 28,
                padding: 20,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 4
              }}
            >
              <ScoreRing score={selectedClient.score} />
              <div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 36,
                    fontWeight: 800,
                    color: selectedClient.score >= 75 ? "var(--accent)" : selectedClient.score >= 50 ? "#f5c518" : "#ff4444"
                  }}
                >
                  {selectedClient.score}
                  <span style={{ fontSize: 16, color: "var(--muted2)", fontFamily: "'DM Mono', monospace" }}>/100</span>
                </div>
                <div style={{ fontSize: 11, color: "#a0a0b0", marginTop: 4 }}>
                  {sentimentConfig[selectedClient.sentiment].label} · {selectedClient.trendVal} this week
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--muted2)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 12
                }}
              >
                Health Signals
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedClient.signals.map((signal, index) => (
                  <div key={index} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div className="staff-health-signal-dot" style={{ background: signalColor[signal.type] }} />
                    <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.5 }}>{signal.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--muted2)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 12
                }}
              >
                Manual Sentiment
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(sentimentConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    className="staff-health-btn"
                    type="button"
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      border: `1px solid ${selectedClient.sentiment === key ? cfg.color : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 2,
                      background: selectedClient.sentiment === key ? cfg.bg : "transparent",
                      color: selectedClient.sentiment === key ? cfg.color : "var(--muted2)",
                      fontFamily: "'DM Mono', monospace"
                    }}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--muted2)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 12
                }}
              >
                Quick Actions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: "✉", label: "Send client update", sub: "Auto-draft from recent activity" },
                  { icon: "◎", label: "Schedule check-in call", sub: "Opens scheduling panel" },
                  { icon: "⚑", label: "Flag for admin review", sub: "Notifies account manager" }
                ].map((action) => (
                  <button
                    key={action.label}
                    className="staff-health-action-btn"
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.01)",
                      textAlign: "left",
                      width: "100%"
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{action.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text)", fontFamily: "'DM Mono', monospace" }}>{action.label}</div>
                      <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>{action.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: 16,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 4
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Retainer burn
                </div>
                <div style={{ fontSize: 12, color: selectedClient.retainerBurn > 90 ? "#ff4444" : "#a0a0b0" }}>
                  {selectedClient.retainerBurn}%
                </div>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(selectedClient.retainerBurn, 100)}%`,
                    background:
                      selectedClient.retainerBurn > 90 ? "#ff4444" : selectedClient.retainerBurn > 70 ? "#f5c518" : "var(--accent)",
                    borderRadius: 2
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 6 }}>
                {selectedClient.retainerBurn > 100
                  ? "Retainer exceeded — flag for scope review"
                  : selectedClient.retainerBurn > 90
                  ? "Critical — less than 10% remaining"
                  : `Approx. ${Math.round((100 - selectedClient.retainerBurn) / 10)} days remaining`}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
