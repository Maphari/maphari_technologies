"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { getStaffAllHealthScores, type StaffHealthScoreEntry } from "@/lib/api/staff/clients";
import type { AuthSession } from "@/lib/auth/session";
import { saveSession } from "@/lib/auth/session";
import { createStaffInterventionWithRefresh } from "@/lib/api/staff/interventions";

type ClientHealthPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

type HealthSignalType = "positive" | "neutral" | "negative";
type SentimentType    = "positive" | "neutral" | "at_risk";

// ── Internal display type (maps 1-to-1 with API response) ────────────────────
type HealthClient = StaffHealthScoreEntry;

const SENTIMENT_FILTERS: Array<{ value: "all" | SentimentType; label: string }> = [
  { value: "all",      label: "All"      },
  { value: "positive", label: "Positive" },
  { value: "neutral",  label: "Neutral"  },
  { value: "at_risk",  label: "At Risk"  },
];

const SORT_OPTS: Array<{ value: "score" | "name" | "trend"; label: string }> = [
  { value: "score", label: "Score" },
  { value: "name",  label: "Name"  },
  { value: "trend", label: "Trend" },
];

function sentimentLabel(sentiment: SentimentType) {
  if (sentiment === "positive") return "Positive";
  if (sentiment === "neutral")  return "Neutral";
  return "At Risk";
}

function sentimentClass(sentiment: SentimentType) {
  if (sentiment === "positive") return "chSentPositive";
  if (sentiment === "neutral")  return "chSentNeutral";
  return "chSentRisk";
}

function signalClass(type: HealthSignalType) {
  if (type === "positive") return "chSignalPositive";
  if (type === "neutral")  return "chSignalNeutral";
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

function metricToneClass(value: number) {
  if (value >= 70) return "chMeterGood";
  if (value >= 40) return "chMeterWarn";
  return "chMeterBad";
}

function invoiceValue(status: HealthClient["invoiceStatus"]) {
  if (status === "paid")    return 100;
  if (status === "pending") return 70;
  return 20;
}

function retentionToneClass(burn: number) {
  if (burn > 90) return "chMeterBad";
  if (burn > 70) return "chMeterWarn";
  return "chMeterGood";
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IcoTrendUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 9L6 4L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 4H10V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoTrendDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 4L6 9L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 9H10V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoTrendStable() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 3.5L10 6L7.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoChevronUp() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoMail() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 5.5L8 9.5L14 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IcoCalendar() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 2V5M11 2V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M2 7H14" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function IcoFlag() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 2V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 3H12L10 7H4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function IcoWarning() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2L14.5 13H1.5L8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 7V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r    = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className={cx("chScoreRing")}>
      <circle cx="48" cy="48" r={r} fill="none" className={cx("chScoreRingTrack")} strokeWidth="6" />
      <circle
        cx="48" cy="48" r={r} fill="none"
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

function TrendIcon({ trend }: { trend: HealthClient["trend"] }) {
  if (trend === "up")   return <IcoTrendUp />;
  if (trend === "down") return <IcoTrendDown />;
  return <IcoTrendStable />;
}

function trendClass(trend: HealthClient["trend"]) {
  if (trend === "up")   return "colorAccent";
  if (trend === "down") return "colorRed";
  return "colorMuted";
}

// ── Empty + skeleton helpers ───────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className={cx("chHealthRow", "chRowCard", "gap16")} >
      <div className={cx("skeleCircle96", "noShrink")} />
      <div className={cx("flex1", "flexCol", "gap8")}>
        <div className={cx("skeleBlock14x40p")} />
        <div className={cx("skeleBlock10x60p")} />
        <div className={cx("skeleBlock8x80p")} />
      </div>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function ClientHealthPage({ isActive, session }: ClientHealthPageProps) {
  const [healthData, setHealthData]   = useState<HealthClient[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [selected, setSelected]       = useState<string | null>(null);
  const [filter, setFilter]           = useState<"all" | SentimentType>("all");
  const [sortBy, setSortBy]           = useState<"score" | "name" | "trend">("score");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionDone,    setActionDone]    = useState<string | null>(null);

  // ── Load health scores on mount / session change ──────────────────────────
  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void getStaffAllHealthScores(session).then((result) => {
      if (cancelled) return;
      if (result.data) setHealthData(result.data);
    }).catch((err) => {
      const msg = err?.message ?? "Failed to load client health";
      setError(msg);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session, isActive]);

  const filtered = useMemo(
    () =>
      healthData
        .filter((client) => filter === "all" ? true : client.sentiment === filter)
        .sort((a, b) => {
          if (sortBy === "score") return b.score - a.score;
          if (sortBy === "name")  return a.name.localeCompare(b.name);
          const order = { up: 0, stable: 1, down: 2 } as const;
          return order[a.trend] - order[b.trend];
        }),
    [filter, sortBy, healthData]
  );

  const selectedClient = selected
    ? healthData.find((c) => c.id === selected) ?? null
    : null;

  async function handleQuickAction(label: string, type: string, description: string, priority: string) {
    if (!session || !selectedClient) return;
    setActionLoading(label);
    setActionDone(null);
    const result = await createStaffInterventionWithRefresh(session, {
      clientId:    selectedClient.id,
      type,
      description,
      priority,
    });
    if (result.nextSession) saveSession(result.nextSession);
    setActionLoading(null);
    if (!result.error && result.data) {
      setActionDone(label);
      setTimeout(() => setActionDone(null), 3000);
    }
  }

  const avg        = healthData.length > 0
    ? Math.round(healthData.reduce((s, c) => s + c.score, 0) / healthData.length)
    : 0;
  const atRisk     = healthData.filter((c) => c.score < 50);
  const atRiskCount = atRisk.length;

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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-health">
      {error && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      )}
      <div className={cx("pageHeaderBar", "chHeaderBar")}>
        <div className={cx("flexBetween", "gap24")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
            <h1 className={cx("pageTitleText")}>Client Health Score</h1>
          </div>

          {!loading && (
            <div className={cx("chTopStats")}>
              {[
                { label: "Portfolio avg",  value: avg,         unit: "/100",     className: avg >= 70 ? "colorAccent" : "colorAmber" },
                { label: "At risk",        value: atRiskCount, unit: " clients",  className: atRiskCount > 0 ? "colorRed" : "colorAccent" },
                { label: "Total clients",  value: healthData.length, unit: "",   className: "colorMuted" }
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
          )}
        </div>

        {/* ── At-risk alert banner ── */}
        {!loading && atRiskCount > 0 && (
          <div className={cx("chAtRiskBanner")}>
            <span className={cx("chAtRiskIco")}><IcoWarning /></span>
            <span className={cx("chAtRiskMsg")}>
              {atRiskCount === 1
                ? `${atRisk[0]!.name} is at risk`
                : `${atRiskCount} clients are at risk`}
              {" — "}immediate attention required.
            </span>
            <div className={cx("chAtRiskNames")}>
              {atRisk.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={cx("chAtRiskChip")}
                  onClick={() => { setFilter("all"); setSelected(c.id); }}
                >
                  {c.avatar} · {c.score}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Filter + sort pills ── */}
        <div className={cx("chFilterRow")}>
          <div className={cx("chFilterPills")}>
            {SENTIMENT_FILTERS.map((opt) => {
              const count = opt.value === "all"
                ? healthData.length
                : healthData.filter((c) => c.sentiment === opt.value).length;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={cx("chFilterPill", filter === opt.value ? "chFilterPillActive" : "chFilterPillIdle")}
                  onClick={() => setFilter(opt.value)}
                  aria-pressed={filter === opt.value}
                >
                  {opt.label}
                  <span className={cx("chFilterCount")}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className={cx("chSortPills")}>
            <span className={cx("chSortLabel")}>Sort:</span>
            {SORT_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cx("chSortPill", sortBy === opt.value ? "chSortPillActive" : "chSortPillIdle")}
                onClick={() => setSortBy(opt.value)}
                aria-pressed={sortBy === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className={cx("chLayout", selectedClient && "chLayoutWithDetail")}>
        <div className={cx("chListPane", selectedClient && "chListPaneWithDetail")}>

          {/* Loading skeletons */}
          {loading && (
            <div className={cx("flexCol", "gap12")}>
              {[1, 2, 3].map((n) => <SkeletonRow key={n} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && healthData.length === 0 && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="bar-chart-2" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No health data yet</div>
              <div className={cx("emptyStateSub")}>Health scores are computed from client activity. Add clients and record health signals to see data here.</div>
            </div>
          )}

          {/* Client rows */}
          {!loading && (
            <div className={cx("flexCol", "gap12")}>
              {filtered.map((client) => {
                const isSelected = selected === client.id;

                const metrics = [
                  {
                    label: "Tasks",
                    value: Math.max(0, 100 - client.overdueTasks * 25),
                    raw:   client.overdueTasks > 0 ? `${client.overdueTasks} overdue` : "On track"
                  },
                  {
                    label: "Messages",
                    value: Math.max(0, 100 - client.unreadMessages * 15),
                    raw:   client.unreadMessages > 0 ? `${client.unreadMessages} unread` : "Clear"
                  },
                  {
                    label: "Invoice",
                    value: invoiceValue(client.invoiceStatus),
                    raw:   client.invoiceStatus
                  },
                  {
                    label: "Retainer",
                    value: Math.max(0, 100 - client.retainerBurn),
                    raw:   `${client.retainerBurn}% used`
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
                      <div className={cx("text11", "colorMuted2", "mb4")}>{client.project} · No assigned manager</div>
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
                        <span className={cx("chTrendIco")}><TrendIcon trend={client.trend} /></span>
                        <span className={cx("chTrendVal")}>{client.trendVal} wk</span>
                      </div>
                      <div className={cx("text10", "colorMuted2", "mt8")}>Last touched</div>
                      <div className={cx("text11", "colorMuted")}>{client.lastTouched}</div>
                      <div className={cx("chDetailsToggle", isSelected ? "chDetailsToggleOpen" : "chDetailsToggleClosed")}>
                        {isSelected ? <IcoChevronUp /> : <IcoChevronDown />}
                        <span>{isSelected ? "Close" : "Details"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedClient ? (
          <div className={cx("chFadeIn", "chDetailPane")}>
            <div className={cx("mb24")}>
              <div className={cx("sectionLabel", "mb8")}>Client Detail</div>
              <div className={cx("fontDisplay", "fw800", "text20", "colorText")}>{selectedClient.name}</div>
              <div className={cx("text11", "colorMuted2", "mt4")}>{selectedClient.project}</div>
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

            {selectedClient.signals.length > 0 && (
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
            )}

            <div className={cx("mb24")}>
              <div className={cx("sectionLabel", "mb12")}>Quick Actions</div>
              <div className={cx("flexCol", "gap8")}>
                {[
                  { Ico: IcoMail,     label: "Send client update",     sub: "Auto-draft from recent activity", cls: "chActionIcoMail",  type: "CLIENT_UPDATE",  priority: "MEDIUM", desc: "Auto-draft client update from recent activity" },
                  { Ico: IcoCalendar, label: "Schedule check-in call", sub: "Opens scheduling panel",          cls: "chActionIcoCal",   type: "SCHEDULE_CALL",  priority: "MEDIUM", desc: "Schedule a check-in call with client" },
                  { Ico: IcoFlag,     label: "Flag for admin review",  sub: "Notifies account manager",        cls: "chActionIcoFlag",  type: "ADMIN_FLAG",     priority: "HIGH",   desc: "Flagged for admin review by staff member" },
                ].map(({ Ico, label, sub, cls, type, priority, desc }) => (
                  <button
                    key={label}
                    className={cx("chActionBtn", "chActionCard")}
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={() => void handleQuickAction(label, type, desc, priority)}
                  >
                    <span className={cx("chActionIcoBox", cls)}><Ico /></span>
                    <div>
                      <div className={cx("text12", "colorText", "fontMono")}>
                        {actionLoading === label ? "Processing…" : actionDone === label ? "Done ✓" : label}
                      </div>
                      <div className={cx("text10", "colorMuted2", "mt2")}>{sub}</div>
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
              <progress
                className={cx("progressMeter", "chRetainerBar", retentionToneClass(selectedClient.retainerBurn))}
                max={100}
                value={Math.min(selectedClient.retainerBurn, 100)}
              />
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
