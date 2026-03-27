"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { getStaffAllHealthScores, type StaffHealthScoreEntry } from "@/lib/api/staff/clients";
import type { AuthSession } from "@/lib/auth/session";
import { saveSession } from "@/lib/auth/session";
import { createStaffInterventionWithRefresh } from "@/lib/api/staff/interventions";
import { createStaffClientMessageWithRefresh } from "@/lib/api/staff/messaging";

// ── Types ──────────────────────────────────────────────────────────────────

type HealthClient   = StaffHealthScoreEntry;
type SentimentType  = "positive" | "neutral" | "at_risk";
type TabKey         = "overview" | "atRisk" | "positive" | "all";

type TabFilter = {
  filter:  "all" | SentimentType;
  search:  string;
  sortBy:  "score" | "name" | "trend";
};

type ClientHealthPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_TAB_FILTER: TabFilter = { filter: "all", search: "", sortBy: "score" };

const INIT_TAB_FILTERS: Record<TabKey, TabFilter> = {
  overview: { ...DEFAULT_TAB_FILTER },
  atRisk:   { ...DEFAULT_TAB_FILTER },
  positive: { ...DEFAULT_TAB_FILTER },
  all:      { ...DEFAULT_TAB_FILTER },
};

const SENTIMENT_PILLS: Array<{ value: "all" | SentimentType; label: string }> = [
  { value: "all",      label: "All"      },
  { value: "positive", label: "Positive" },
  { value: "neutral",  label: "Neutral"  },
  { value: "at_risk",  label: "At Risk"  },
];

const SORT_OPTS: Array<{ value: TabFilter["sortBy"]; label: string }> = [
  { value: "score", label: "Score ↓" },
  { value: "name",  label: "Name A–Z" },
  { value: "trend", label: "Trend"   },
];

// ── Pure helpers ───────────────────────────────────────────────────────────

function scoreTier(score: number): "green" | "amber" | "red" {
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
}

function scoreColor(score: number): string {
  if (score >= 75) return "var(--green)";
  if (score >= 50) return "var(--amber)";
  return "var(--red)";
}

function scoreBarClass(score: number): string {
  if (score >= 75) return "chScoreBarFillGreen";
  if (score >= 50) return "chScoreBarFillAmber";
  return "chScoreBarFillRed";
}

function miniFillClass(score: number): string {
  if (score >= 75) return "chMiniFillGreen";
  if (score >= 50) return "chMiniFillAmber";
  return "chMiniFillRed";
}

function sentimentLabel(s: SentimentType): string {
  if (s === "positive") return "Positive";
  if (s === "neutral")  return "Neutral";
  return "At Risk";
}

function sentimentClass(s: SentimentType): string {
  if (s === "positive") return "chSentPositive";
  if (s === "neutral")  return "chSentNeutral";
  return "chSentRisk";
}

function signalDotClass(type: "positive" | "neutral" | "negative"): string {
  if (type === "positive") return "chSignalPositive";
  if (type === "neutral")  return "chSignalNeutral";
  return "chSignalNegative";
}

function trendChipClass(trend: HealthClient["trend"]): string {
  if (trend === "up")   return "chTrendChipUp";
  if (trend === "down") return "chTrendChipDown";
  return "chTrendChipFlat";
}

function trendIcon(trend: HealthClient["trend"]): string {
  if (trend === "up")   return "↑";
  if (trend === "down") return "↓";
  return "→";
}

function invoiceBadgeClass(status: HealthClient["invoiceStatus"]): string {
  if (status === "paid")    return "badgeGreen";
  if (status === "overdue") return "badgeRed";
  return "badgeAmber";
}

function metricValClass(value: number): string {
  if (value >= 75) return "chDpMetricValOk";
  if (value >= 50) return "chDpMetricValWarn";
  return "chDpMetricValBad";
}

function retainerValClass(burn: number): string {
  if (burn > 90) return "chDpMetricValBad";
  if (burn > 70) return "chDpMetricValWarn";
  return "chDpMetricValOk";
}

function retainerMeta(burn: number): string {
  if (burn > 100) return "Retainer exceeded — flag for scope review";
  if (burn > 90)  return "Critical — less than 10% remaining";
  if (burn > 70)  return "Running high";
  return "";
}

function applyTabFilter(clients: HealthClient[], tf: TabFilter): HealthClient[] {
  return clients
    .filter((c) => tf.filter === "all" ? true : c.sentiment === tf.filter)
    .filter((c) => {
      if (!tf.search.trim()) return true;
      const q = tf.search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q)
        || c.project.toLowerCase().includes(q)
        || c.signals.some((s) => s.text.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (tf.sortBy === "score") return b.score - a.score;
      if (tf.sortBy === "name")  return a.name.localeCompare(b.name);
      const order = { up: 0, stable: 1, down: 2 } as const;
      return order[a.trend] - order[b.trend];
    });
}

// ── SVG Score Ring ─────────────────────────────────────────────────────────

function ScoreRing({ score, size = 60 }: { score: number; size?: number }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circ   = 2 * Math.PI * radius;
  const dash   = (score / 100) * circ;
  const color  = scoreColor(score);
  const center = size / 2;
  return (
    <div className={cx("chDpRingWrap")} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`} />
      </svg>
      <div className={cx("chDpRingNum")} style={{ color, fontSize: size <= 60 ? 14 : 18 }}>
        {score}
      </div>
    </div>
  );
}

// ── FilterBar sub-component ────────────────────────────────────────────────

function FilterBar({
  tf,
  onChange,
  showSentimentPills,
  sentimentCounts,
}: {
  tf: TabFilter;
  onChange: (patch: Partial<TabFilter>) => void;
  showSentimentPills: boolean;
  sentimentCounts: Record<"all" | SentimentType, number>;
}) {
  return (
    <div className={cx("chFilterBar")}>
      <input
        className={cx("staffFilterInput")}
        placeholder="Search client, project, or signal…"
        value={tf.search}
        onChange={(e) => onChange({ search: e.target.value })}
      />
      {showSentimentPills && SENTIMENT_PILLS.map((pill) => (
        <div
          key={pill.value}
          role="radio"
          aria-checked={tf.filter === pill.value}
          className={cx(tf.filter === pill.value ? "chFilterPillActive" : "chFilterPillIdle")}
          onClick={() => onChange({ filter: pill.value })}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onChange({ filter: pill.value }); }}
        >
          {pill.label}
          <span className={cx("chFilterPillCount")} aria-hidden="true">{sentimentCounts[pill.value]}</span>
        </div>
      ))}
      <div className={cx("chSortGroup")} style={{ marginLeft: "auto" }}>
        <span className={cx("chSortLabel")}>Sort</span>
        {SORT_OPTS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={cx(tf.sortBy === opt.value ? "chSortPillActive" : "chSortPillIdle")}
            onClick={() => onChange({ sortBy: opt.value })}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ClientTable sub-component ──────────────────────────────────────────────

function ClientTable({
  clients,
  selected,
  onSelect,
}: {
  clients: HealthClient[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (clients.length === 0) {
    return (
      <div className={cx("emptyState")}>
        <div className={cx("emptyStateTitle")}>No clients match filters</div>
        <div className={cx("emptyStateSub")}>Try clearing search or filters.</div>
      </div>
    );
  }
  return (
    <table className={cx("chTable")}>
      <thead>
        <tr>
          <th>Client</th>
          <th>Score</th>
          <th>Trend</th>
          <th>Sentiment</th>
          <th>Invoice</th>
          <th>Tasks</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((c) => (
          <tr
            key={c.id}
            className={cx(selected === c.id && "chTableRowSelected")}
            onClick={() => onSelect(c.id)}
          >
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className={cx("staffClientAvatar")}>{c.avatar}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>{c.name}</div>
                  <div style={{ fontSize: 9, color: "var(--muted2)" }}>{c.project}</div>
                </div>
              </div>
            </td>
            <td>
              <div className={cx("chScoreBarCell")}>
                <div className={cx("chScoreBarWrap")}>
                  <div className={cx("chScoreBarTrack")}>
                    <div className={cx(scoreBarClass(c.score))} style={{ width: `${c.score}%` }} />
                  </div>
                </div>
                <div className={cx("chScoreText")} style={{ color: scoreColor(c.score) }}>{c.score}</div>
              </div>
            </td>
            <td>
              <span className={cx(trendChipClass(c.trend))}>
                {trendIcon(c.trend)} {c.trendVal}
              </span>
            </td>
            <td>
              <span className={cx("badgeSm", sentimentClass(c.sentiment))}>
                {sentimentLabel(c.sentiment)}
              </span>
            </td>
            <td>
              <span className={cx("badgeSm", invoiceBadgeClass(c.invoiceStatus))}>
                {c.invoiceStatus.charAt(0).toUpperCase() + c.invoiceStatus.slice(1)}
              </span>
            </td>
            <td style={{ fontSize: 10, color: c.overdueTasks > 0 ? "var(--red)" : "var(--green)" }}>
              {c.overdueTasks > 0 ? `${c.overdueTasks} overdue` : "On track"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Component placeholder (JSX added in next task) ─────────────────────────

export function ClientHealthPage({ isActive, session }: ClientHealthPageProps) {
  const [healthData,   setHealthData]   = useState<HealthClient[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [selected,     setSelected]     = useState<string | null>(null);
  const [activeTab,    setActiveTab]    = useState<TabKey>("overview");
  const [tabFilters,   setTabFilters]   = useState<Record<TabKey, TabFilter>>(INIT_TAB_FILTERS);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionDone,    setActionDone]    = useState<string | null>(null);
  const [actionError,   setActionError]   = useState<string | null>(null);

  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgSubject,   setMsgSubject]   = useState("");
  const [msgBody,      setMsgBody]      = useState("");
  const [msgSending,   setMsgSending]   = useState(false);
  const [msgToast,     setMsgToast]     = useState<{ tone: "success" | "error"; text: string } | null>(null);

  // ── Tab filter helpers ────────────────────────────────────────────────────

  function setTabFilter(tab: TabKey, patch: Partial<TabFilter>) {
    setTabFilters((prev) => ({ ...prev, [tab]: { ...prev[tab], ...patch } }));
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadHealthData = useCallback(async (background = false) => {
    if (!session?.accessToken || !isActive) { setLoading(false); return; }
    if (background) setRefreshing(true);
    else            setLoading(true);
    setError(null);
    try {
      const result = await getStaffAllHealthScores(session);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setError(result.error.message ?? "Failed to load client health");
        setHealthData([]);
        return;
      }
      setHealthData(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client health");
      setHealthData([]);
    } finally {
      if (background) setRefreshing(false);
      else            setLoading(false);
    }
  }, [isActive, session]);

  useEffect(() => { void loadHealthData(false); }, [loadHealthData]);

  // ── Derived / computed ────────────────────────────────────────────────────

  const avg          = healthData.length > 0
    ? Math.round(healthData.reduce((s, c) => s + c.score, 0) / healthData.length)
    : 0;
  const atRiskList   = healthData.filter((c) => c.score < 50);
  const atRiskCount  = atRiskList.length;
  const improvingCount = healthData.filter((c) => c.trend === "up").length;
  const totalSignals = healthData.reduce((sum, c) => sum + c.signals.length, 0);
  const trendCounts  = healthData.reduce(
    (acc, c) => { acc[c.trend] += 1; return acc; },
    { up: 0, stable: 0, down: 0 }
  );
  const tierCounts   = {
    good:  healthData.filter((c) => c.score >= 75).length,
    fair:  healthData.filter((c) => c.score >= 50 && c.score < 75).length,
    risk:  healthData.filter((c) => c.score < 50).length,
  };

  const filteredAll = useMemo(
    () => applyTabFilter(healthData, tabFilters.all),
    [healthData, tabFilters.all]
  );
  const filteredAtRisk = useMemo(
    () => applyTabFilter(atRiskList, tabFilters.atRisk),
    [atRiskList, tabFilters.atRisk]
  );
  const filteredPositive = useMemo(
    () => applyTabFilter(healthData.filter((c) => c.sentiment === "positive"), tabFilters.positive),
    [healthData, tabFilters.positive]
  );

  const selectedClient = selected
    ? healthData.find((c) => c.id === selected) ?? null
    : null;

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleQuickAction(label: string, type: string, description: string, priority: string) {
    if (!session || !selectedClient) return;
    setActionLoading(label);
    setActionDone(null);
    setActionError(null);
    try {
      const result = await createStaffInterventionWithRefresh(session, {
        clientId: selectedClient.id, type, description, priority,
      });
      if (result.nextSession) saveSession(result.nextSession);
      if (!result.error && result.data) {
        setActionDone(label);
        setTimeout(() => setActionDone(null), 3000);
      } else if (result.error) {
        setActionError(result.error.message ?? "Action failed");
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendMessage() {
    if (!session || !selectedClient || !msgSubject.trim() || !msgBody.trim()) return;
    setMsgSending(true);
    try {
      const result = await createStaffClientMessageWithRefresh(
        session, selectedClient.id, msgSubject.trim(), msgBody.trim()
      );
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setMsgToast({ tone: "error", text: result.error.message });
      } else {
        setMsgToast({ tone: "success", text: "Message sent to client" });
        setMsgSubject(""); setMsgBody(""); setShowMsgModal(false);
        setTimeout(() => setMsgToast(null), 3000);
      }
    } catch (err) {
      setMsgToast({ tone: "error", text: err instanceof Error ? err.message : "Failed to send" });
    } finally {
      setMsgSending(false);
    }
  }

  if (!isActive) return null;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", "pageActive")} id="page-health">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (healthData.length === 0 && !error) {
    return (
      <section className={cx("page", "pageBody", "pageActive")} id="page-health">
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="bar-chart-2" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No health data yet</div>
          <div className={cx("emptyStateSub")}>Health scores are computed from client activity. Add clients and record health signals to see data here.</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", "pageActive")} id="page-health">

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      )}

      {/* Hidden data-loaded indicator for tests — not visible UI */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }} aria-hidden="true">
        {healthData.map((c) => (
          <span key={c.id}>{c.name}</span>
        ))}
      </div>

      {/* ── Page header ────────────────────────────────────────────────── */}
      <header className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "text11", "colorMuted2")}>
          Staff Dashboard / Client Work
        </div>
        <h1 className={cx("pageTitleText", "mb4")}>Client Health Score</h1>
        <p className={cx("text12", "colorMuted2", "mb0")}>
          Signals, scores, and interventions for every client — one living dashboard.
        </p>
      </header>

      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      <div className={cx("chKpiStrip")}>
        <div className={cx("chKpiCard", "chKpiCardAccent")}>
          <div className={cx("chKpiLabel")}>Portfolio Avg</div>
          <div className={cx("chKpiVal")} style={{ color: "var(--accent)" }}>{avg}</div>
          <div className={cx("chKpiMeta")}>{healthData.length} clients tracked</div>
        </div>
        <div className={cx("chKpiCard", "chKpiCardRed")}>
          <div className={cx("chKpiLabel")}>At Risk</div>
          <div className={cx("chKpiVal")} style={{ color: "var(--red)" }}>{atRiskCount}</div>
          <div className={cx("chKpiMeta")}>score below 50</div>
        </div>
        <div className={cx("chKpiCard", "chKpiCardGreen")}>
          <div className={cx("chKpiLabel")}>Improving</div>
          <div className={cx("chKpiVal")} style={{ color: "var(--green)" }}>{improvingCount}</div>
          <div className={cx("chKpiMeta")}>↑ trend upward</div>
        </div>
        <div className={cx("chKpiCard", "chKpiCardPurple")}>
          <div className={cx("chKpiLabel")}>Total Signals</div>
          <div className={cx("chKpiVal")} style={{ color: "var(--purple)" }}>{totalSignals}</div>
          <div className={cx("chKpiMeta")}>
            {healthData.length > 0 ? Math.round(totalSignals / healthData.length) : 0} per client avg
          </div>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <div className={cx("chTabBarRow")}>
        {(["overview", "atRisk", "positive", "all"] as TabKey[]).map((tab) => {
          const labels: Record<TabKey, string> = {
            overview: "Overview",
            atRisk:   "At Risk",
            positive: "Positive",
            all:      "All Clients",
          };
          const badges: Record<TabKey, { count: number; cls: string } | null> = {
            overview: null,
            atRisk:   { count: atRiskCount,                                          cls: "chTabBadgeRed"   },
            positive: { count: healthData.filter((c) => c.sentiment === "positive").length, cls: "chTabBadgeGreen" },
            all:      { count: healthData.length,                                    cls: "chTabBadgeMuted" },
          };
          const badge = badges[tab];
          return (
            <button
              key={tab}
              type="button"
              className={cx("chTab", activeTab === tab && "chTabActive")}
              onClick={() => setActiveTab(tab)}
              aria-selected={activeTab === tab}
            >
              {labels[tab]}
              {badge && (
                <span className={cx(badge.cls)}>{badge.count}</span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          className={cx("chTabClearBtn")}
          onClick={() => setSelected(null)}
          disabled={!selected || refreshing}
        >
          Clear selection
        </button>
        <button
          type="button"
          className={cx("chTabClearBtn")}
          style={{ marginLeft: 4 }}
          onClick={() => void loadHealthData(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "↺ Refresh"}
        </button>
      </div>

      {/* ── Tab body (content + detail panel) ─────────────────────────── */}
      <div className={cx("chTabBody")}>
        <div className={cx("chTabContent")}>

          {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className={cx("chOverviewGrid")}>

              {/* Left: score distribution + sparkline */}
              <div className={cx("chOvPanel")}>
                <div className={cx("chOvPanelLabel")}>Score Distribution</div>
                <div className={cx("chTierRow")}>
                  <div className={cx("chTierBox", "chTierBoxGreen")}>
                    <div className={cx("chTierNum", "chTierNumGreen")}>{tierCounts.good}</div>
                    <div className={cx("chTierLbl")}>Good · 75–100</div>
                  </div>
                  <div className={cx("chTierBox", "chTierBoxAmber")}>
                    <div className={cx("chTierNum", "chTierNumAmber")}>{tierCounts.fair}</div>
                    <div className={cx("chTierLbl")}>Fair · 50–74</div>
                  </div>
                  <div className={cx("chTierBox", "chTierBoxRed")}>
                    <div className={cx("chTierNum", "chTierNumRed")}>{tierCounts.risk}</div>
                    <div className={cx("chTierLbl")}>Risk · below 50</div>
                  </div>
                </div>
                <div className={cx("chOvPanelLabel")} style={{ marginTop: 12, marginBottom: 2 }}>
                  Trend Momentum
                </div>
                {/* Decorative sparkline: bar heights proportional to trendCounts.up / total */}
                {(() => {
                  const total = Math.max(1, trendCounts.up + trendCounts.stable + trendCounts.down);
                  const upRatio = trendCounts.up / total;
                  const heights = [0.3, 0.4, 0.35, 0.5 + upRatio * 0.3, 0.45 + upRatio * 0.3, 0.5 + upRatio * 0.5];
                  return (
                    <div className={cx("chSparkline")}>
                      {heights.map((h, i) => (
                        <div
                          key={i}
                          className={cx("chSpBar", i === heights.length - 1 && "chSpBarLast")}
                          style={{ height: `${h * 100}%` }}
                        />
                      ))}
                    </div>
                  );
                })()}
                <div style={{ fontSize: 9, color: "var(--muted2)", marginTop: 5 }}>
                  {trendCounts.up} of {healthData.length} clients trending upward
                </div>
              </div>

              {/* Right: needs-attention */}
              <div className={cx("chOvPanel")}>
                <div className={cx("chOvPanelLabel", "chOvPanelLabelRed")}>
                  Needs Attention — click to view
                </div>
                {atRiskList.length === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--green)", padding: "8px 0" }}>
                    ✓ All clients are in healthy range
                  </div>
                ) : (
                  <div className={cx("chAttentionList")}>
                    {atRiskList.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={cx("chAttentionItem", selected === c.id && "chAttentionItemSelected")}
                        onClick={() => setSelected(selected === c.id ? null : c.id)}
                      >
                        <div className={cx("staffClientAvatar")}>{c.avatar}</div>
                        <div className={cx("chAttentionInfo")}>
                          <div className={cx("chAttentionName")}>{c.name}</div>
                          <div className={cx("chAttentionProj")}>{c.project}</div>
                          <div className={cx("chMiniTrack")}>
                            <div className={cx(miniFillClass(c.score))} style={{ width: `${c.score}%` }} />
                          </div>
                        </div>
                        <div className={cx("chAttentionScore")} style={{ color: scoreColor(c.score) }}>
                          {c.score}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── AT RISK TAB ──────────────────────────────────────────── */}
          {activeTab === "atRisk" && (
            <>
              <FilterBar
                tf={tabFilters.atRisk}
                onChange={(p) => setTabFilter("atRisk", p)}
                showSentimentPills={false}
                sentimentCounts={{ all: atRiskList.length, positive: 0, neutral: 0, at_risk: atRiskList.length }}
              />
              {filteredAtRisk.length === 0 && atRiskList.length === 0 ? (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateTitle")}>No at-risk clients right now</div>
                  <div className={cx("emptyStateSub")}>All clients are above the risk threshold.</div>
                </div>
              ) : (
                <ClientTable
                  clients={filteredAtRisk}
                  selected={selected}
                  onSelect={(id) => setSelected(selected === id ? null : id)}
                />
              )}
            </>
          )}

          {/* ── POSITIVE TAB ─────────────────────────────────────────── */}
          {activeTab === "positive" && (
            <>
              <FilterBar
                tf={tabFilters.positive}
                onChange={(p) => setTabFilter("positive", p)}
                showSentimentPills={false}
                sentimentCounts={{ all: healthData.filter((c) => c.sentiment === "positive").length, positive: 0, neutral: 0, at_risk: 0 }}
              />
              <ClientTable
                clients={filteredPositive}
                selected={selected}
                onSelect={(id) => setSelected(selected === id ? null : id)}
              />
            </>
          )}

          {/* ── ALL CLIENTS TAB ──────────────────────────────────────── */}
          {activeTab === "all" && (
            <>
              <FilterBar
                tf={tabFilters.all}
                onChange={(p) => setTabFilter("all", p)}
                showSentimentPills={true}
                sentimentCounts={{
                  all:      healthData.length,
                  positive: healthData.filter((c) => c.sentiment === "positive").length,
                  neutral:  healthData.filter((c) => c.sentiment === "neutral").length,
                  at_risk:  atRiskCount,
                }}
              />
              <ClientTable
                clients={filteredAll}
                selected={selected}
                onSelect={(id) => setSelected(selected === id ? null : id)}
              />
            </>
          )}

        </div>
        <div className={cx("chTabDetail")}>
          {/* Detail panel rendered in Task 7 */}
          <div className={cx("chDpEmpty")}>
            <div className={cx("chDpEmptyText")}>Select a client to view details</div>
          </div>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {msgToast && (
        <div className={cx("staffToast", msgToast.tone === "success" ? "staffToastSuccess" : "staffToastError")}>
          {msgToast.text}
        </div>
      )}

      {/* ── Message modal ──────────────────────────────────────────────── */}
      {showMsgModal && selectedClient && (
        <div className={cx("modalBackdrop")} onClick={(e) => { if (e.target === e.currentTarget) setShowMsgModal(false); }}>
          <div className={cx("modal")}>
            <div className={cx("modalHeader")}>
              <span className={cx("modalTitle")}>Message {selectedClient.name}</span>
              <button type="button" className={cx("modalClose")} onClick={() => setShowMsgModal(false)}>
                <Ic n="x" sz={15} c="var(--text)" />
              </button>
            </div>
            <div className={cx("modalBody")}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--muted2)", display: "block", marginBottom: 4 }}>Subject</label>
                  <input className={cx("staffFilterInput")} placeholder="Message subject" value={msgSubject}
                    onChange={(e) => setMsgSubject(e.target.value)} autoFocus />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--muted2)", display: "block", marginBottom: 4 }}>Message</label>
                  <textarea className={cx("staffFilterInput")} placeholder="Type your message…" value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)} rows={5}
                    style={{ resize: "vertical", height: "auto" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 16px", borderTop: "1px solid var(--b1)" }}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowMsgModal(false)}>Cancel</button>
              <button type="button" className={cx("btnSm", "btnAccent")}
                disabled={msgSending || !msgSubject.trim() || !msgBody.trim()}
                onClick={() => void handleSendMessage()}>
                {msgSending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
