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

function sentimentLabel(sentiment: SentimentType) {
  if (sentiment === "positive") return "Positive";
  if (sentiment === "neutral") return "Neutral";
  return "At Risk";
}

function sentimentClass(sentiment: SentimentType) {
  if (sentiment === "positive") return "chSentPositive";
  if (sentiment === "neutral") return "chSentNeutral";
  return "chSentRisk";
}

function signalClass(type: HealthSignalType) {
  if (type === "positive") return "chSignalPositive";
  if (type === "neutral") return "chSignalNeutral";
  return "chSignalNegative";
}

function scoreColor(score: number) {
  if (score >= 75) return "var(--accent)";
  if (score >= 50) return "var(--amber)";
  return "var(--red)";
}

function scoreToneClass(score: number) {
  if (score >= 75) return "colorAccent";
  if (score >= 50) return "colorAmber";
  return "colorRed";
}

function trendClass(trend: HealthClient["trend"]) {
  if (trend === "up") return "colorAccent";
  if (trend === "down") return "colorRed";
  return "colorMuted";
}

function metricToneClass(value: number) {
  if (value >= 70) return "chMeterGood";
  if (value >= 40) return "chMeterWarn";
  return "chMeterBad";
}

function invoiceValue(status: HealthClient["invoiceStatus"]) {
  if (status === "paid") return 100;
  if (status === "pending") return 70;
  return 20;
}

function retentionToneClass(burn: number) {
  if (burn > 90) return "chMeterBad";
  if (burn > 70) return "chMeterWarn";
  return "chMeterGood";
}

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className={cx("chScoreRing")}>
      <circle cx="48" cy="48" r={r} fill="none" className={cx("chScoreRingTrack")} strokeWidth="6" />
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke={color}
        className={cx("chScoreRingArc")}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="48" textAnchor="middle" dominantBaseline="central" fill={color} className={cx("chScoreRingText")}>
        {score}
      </text>
    </svg>
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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-health">
      <div className={cx("pageHeaderBar", "chHeaderBar")}>
        <div className={cx("flexBetween", "gap24")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
            <h1 className={cx("pageTitleText")}>Client Health Score</h1>
          </div>

          <div className={cx("chTopStats")}>
            {[
              { label: "Portfolio avg", value: avg, unit: "/100", className: avg >= 70 ? "colorAccent" : "colorAmber" },
              { label: "At risk", value: atRisk, unit: " clients", className: atRisk > 0 ? "colorRed" : "colorAccent" },
              { label: "Total clients", value: healthData.length, unit: "", className: "colorMuted" }
            ].map((summary) => (
              <div key={summary.label} className={cx("textRight")}>
                <div className={cx("statLabelNew")}>{summary.label}</div>
                <div className={cx("statValueNew", summary.className)}>
                  {summary.value}
                  <span className={cx("text12", "fontMono", "colorMuted2", "fw400")}>{summary.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("chFilterRow", "filterRow")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter clients by sentiment"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | SentimentType)}
          >
            <option value="all">All clients</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="at_risk">At risk</option>
          </select>
          <select
            className={cx("filterSelect")}
            aria-label="Sort clients"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "score" | "name")}
          >
            <option value="score">Sort: score</option>
            <option value="name">Sort: name</option>
          </select>
        </div>
      </div>

      <div className={cx("chLayout", selectedClient && "chLayoutWithDetail")}>
        <div className={cx("chListPane", selectedClient && "chListPaneWithDetail")}>
          <div className={cx("flexCol", "gap12")}>
            {filtered.map((client) => {
              const isSelected = selected === client.id;

              const metrics = [
                {
                  label: "Tasks",
                  value: Math.max(0, 100 - client.overdueTasks * 25),
                  raw: client.overdueTasks > 0 ? `${client.overdueTasks} overdue` : "On track"
                },
                {
                  label: "Messages",
                  value: Math.max(0, 100 - client.unreadMessages * 15),
                  raw: client.unreadMessages > 0 ? `${client.unreadMessages} unread` : "Clear"
                },
                {
                  label: "Invoice",
                  value: invoiceValue(client.invoiceStatus),
                  raw: client.invoiceStatus
                },
                {
                  label: "Retainer",
                  value: Math.max(0, 100 - client.retainerBurn),
                  raw: `${client.retainerBurn}% used`
                }
              ];

              return (
                <div
                  key={client.id}
                  className={cx("chHealthRow", "chRowCard", isSelected && "chRowCardSelected")}
                  onClick={() => setSelected(isSelected ? null : client.id)}
                >
                  <ScoreRing score={client.score} />
                  <div className={cx("minW0")}>
                    <div className={cx("chNameRow")}>
                      <div className={cx("chAvatar")}>{client.avatar}</div>
                      <span className={cx("chClientName")}>{client.name}</span>
                      <span className={cx("chSentimentBadge", sentimentClass(client.sentiment))}>{sentimentLabel(client.sentiment)}</span>
                    </div>
                    <div className={cx("text11", "colorMuted2", "mb4")}>{client.project} · Manager: {client.manager}</div>
                    {client.milestoneDelay > 0 ? (
                      <div className={cx("text10", "colorRed", "mb10")}>
                        Milestone delay: {client.milestoneDelay} day{client.milestoneDelay === 1 ? "" : "s"}
                      </div>
                    ) : (
                      <div className={cx("mb10", "chSpacer14")} />
                    )}

                    <div className={cx("chMetricGrid")}>
                      {metrics.map((metric) => {
                        const tone = metricToneClass(metric.value);
                        return (
                          <div key={metric.label}>
                            <div className={cx("chMetricLabel")}>{metric.label}</div>
                            <progress className={cx("progressMeter", "chMiniBar", tone)} max={100} value={metric.value} />
                            <div className={cx("text10", "mt3", tone)}>{metric.raw}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={cx("chSideMeta")}>
                    <div className={cx("chTrend", trendClass(client.trend))}>
                      {client.trend === "up" ? "↑" : client.trend === "down" ? "↓" : "→"} {client.trendVal} wk
                    </div>
                    <div className={cx("text10", "colorMuted2")}>Last touched</div>
                    <div className={cx("text11", "colorMuted")}>{client.lastTouched}</div>
                    <div className={cx("chDetailsToggle", isSelected && "chDetailsToggleOpen")}>{isSelected ? "▲ Close" : "▼ Details"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedClient ? (
          <div className={cx("chFadeIn", "chDetailPane")}>
            <div className={cx("mb24")}>
              <div className={cx("sectionLabel", "mb8")}>Client Detail</div>
              <div className={cx("fontDisplay", "fw800", "text20", "colorText")}>{selectedClient.name}</div>
              <div className={cx("text11", "colorMuted2", "mt4")}>
                {selectedClient.project} · {selectedClient.manager}
              </div>
            </div>

            <div className={cx("chScoreCard", "mb28")}>
              <ScoreRing score={selectedClient.score} />
              <div>
                <div className={cx("fontDisplay", "fw800", "text36", scoreToneClass(selectedClient.score))}>
                  {selectedClient.score}
                  <span className={cx("text16", "colorMuted2", "fontMono", "fw400")}>/100</span>
                </div>
                <div className={cx("text11", "colorMuted", "mt4")}>
                  {sentimentLabel(selectedClient.sentiment)} · {selectedClient.trendVal} this week
                </div>
              </div>
            </div>

            <div className={cx("mb24")}>
              <div className={cx("sectionLabel", "mb12")}>Health Signals</div>
              <div className={cx("flexCol", "gap8")}>
                {selectedClient.signals.map((signal, index) => (
                  <div key={index} className={cx("chSignalRow")}>
                    <div className={cx("chSignalDot", signalClass(signal.type))} />
                    <div className={cx("text12", "colorMuted", "lh15")}>{signal.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={cx("mb24")}>
              <div className={cx("sectionLabel", "mb12")}>Manual Sentiment</div>
              <div className={cx("chSentimentButtons")}>
                {(["positive", "neutral", "at_risk"] as const).map((sentiment) => (
                  <button
                    key={sentiment}
                    className={cx(
                      "chBtn",
                      "chSentBtn",
                      selectedClient.sentiment === sentiment ? "chSentBtnActive" : "chSentBtnIdle",
                      selectedClient.sentiment === sentiment && sentimentClass(sentiment)
                    )}
                    type="button"
                  >
                    {sentimentLabel(sentiment)}
                  </button>
                ))}
              </div>
            </div>

            <div className={cx("mb24")}>
              <div className={cx("sectionLabel", "mb12")}>Quick Actions</div>
              <div className={cx("flexCol", "gap8")}>
                {[
                  { icon: "✉", label: "Send client update", sub: "Auto-draft from recent activity" },
                  { icon: "◎", label: "Schedule check-in call", sub: "Opens scheduling panel" },
                  { icon: "⚑", label: "Flag for admin review", sub: "Notifies account manager" }
                ].map((action) => (
                  <button key={action.label} className={cx("chActionBtn", "chActionCard")} type="button">
                    <span className={cx("text16")}>{action.icon}</span>
                    <div>
                      <div className={cx("text12", "colorText", "fontMono")}>{action.label}</div>
                      <div className={cx("text10", "colorMuted2", "mt2")}>{action.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={cx("chRetainerCard")}>
              <div className={cx("chRetainerHead")}>
                <div className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Retainer burn</div>
                <div className={cx("text12", selectedClient.retainerBurn > 90 ? "colorRed" : "colorMuted")}>
                  {selectedClient.retainerBurn}%
                </div>
              </div>
              <progress className={cx("progressMeter", "chRetainerBar", retentionToneClass(selectedClient.retainerBurn))} max={100} value={Math.min(selectedClient.retainerBurn, 100)} />
              <div className={cx("text10", "colorMuted2", "mt6")}>
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
