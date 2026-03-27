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

  // ── Render placeholder (full JSX in Task 5) ───────────────────────────────

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

  return (
    <section className={cx("page", "pageBody", "pageActive")} id="page-health">
      <div className={cx("emptyState")}>
        <div className={cx("emptyStateTitle")}>Redesign in progress</div>
      </div>
    </section>
  );
}
