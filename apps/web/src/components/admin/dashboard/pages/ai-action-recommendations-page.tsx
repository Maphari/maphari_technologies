"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAiRecommendations, type AiRecommendation } from "../../../../lib/api/admin/ai";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";

/** Derive operational signal recommendations from the admin snapshot. */
function deriveSignalRecommendations(snapshot: {
  clients: { id: string; name: string; priority: string }[];
  invoices: { id: string; status: string; daysOverdue?: number }[];
  projects: { id: string; name: string; status: string; riskLevel: string }[];
}): AiRecommendation[] {
  const recs: AiRecommendation[] = [];

  const overdueInvoices = snapshot.invoices.filter((i) => i.status === "OVERDUE");
  if (overdueInvoices.length > 0) {
    recs.push({
      id: "signal-overdue-invoices",
      type: "Risk",
      title: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? "s" : ""} require attention`,
      confidence: 95,
      estimatedValue: "—",
      reasoning: "Overdue invoices directly impact cash flow. Chase and escalate each outstanding invoice to avoid further delay.",
      action: "View Invoices",
    });
  }

  const highPriorityClients = snapshot.clients.filter((c) => c.priority === "HIGH");
  if (highPriorityClients.length > 0) {
    recs.push({
      id: "signal-high-priority-clients",
      type: "Risk",
      title: `${highPriorityClients.length} high-priority client${highPriorityClients.length > 1 ? "s" : ""} flagged`,
      confidence: 88,
      estimatedValue: "—",
      reasoning: `Clients marked HIGH priority: ${highPriorityClients.slice(0, 3).map((c) => c.name).join(", ")}${highPriorityClients.length > 3 ? " and others" : ""}. Review their account health and ensure adequate support.`,
      action: "Review Clients",
    });
  }

  const blockedProjects = snapshot.projects.filter(
    (p) => ["BLOCKED", "DELAYED", "ON_HOLD"].includes(p.status.toUpperCase())
  );
  if (blockedProjects.length > 0) {
    recs.push({
      id: "signal-blocked-projects",
      type: "Efficiency",
      title: `${blockedProjects.length} project${blockedProjects.length > 1 ? "s" : ""} blocked or stalled`,
      confidence: 90,
      estimatedValue: "—",
      reasoning: `Projects currently blocked/stalled: ${blockedProjects.slice(0, 3).map((p) => p.name).join(", ")}${blockedProjects.length > 3 ? " and others" : ""}. Unblock these to restore delivery momentum.`,
      action: "View Projects",
    });
  }

  const highRiskProjects = snapshot.projects.filter((p) => p.riskLevel === "HIGH");
  if (highRiskProjects.length > 0) {
    recs.push({
      id: "signal-high-risk-projects",
      type: "Risk",
      title: `${highRiskProjects.length} project${highRiskProjects.length > 1 ? "s" : ""} at high delivery risk`,
      confidence: 85,
      estimatedValue: "—",
      reasoning: `High-risk projects: ${highRiskProjects.slice(0, 3).map((p) => p.name).join(", ")}${highRiskProjects.length > 3 ? " and others" : ""}. Consider resource reallocation or scope adjustment.`,
      action: "View Projects",
    });
  }

  return recs;
}

export function AIActionRecommendationsPage() {
  const { session, snapshot } = useAdminWorkspaceContext();

  const [apiRecommendations, setApiRecommendations] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Derive signal-based recommendations from the snapshot
  const signalRecommendations = useMemo(
    () => deriveSignalRecommendations(snapshot),
    [snapshot]
  );

  // Merge API recs + local signal recs, deduplicating by id
  const recommendations = useMemo<AiRecommendation[]>(() => {
    const merged = [...apiRecommendations];
    for (const sig of signalRecommendations) {
      if (!merged.some((r) => r.id === sig.id)) merged.push(sig);
    }
    return merged;
  }, [apiRecommendations, signalRecommendations]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!session) { setLoading(false); setRefreshing(false); return; }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const result = await fetchAiRecommendations(session);

        if (result.error) {
          setError(result.error.message);
        } else {
          setApiRecommendations(result.data ?? []);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session]
  );

  useEffect(() => {
    void load();
  }, [load]);

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
          <div className={styles.pageEyebrow}>AI/ML / AI ACTION RECOMMENDATIONS</div>
          <h1 className={styles.pageTitle}>AI Action Recommendations</h1>
          <div className={styles.pageSub}>
            Organization-wide suggestions derived from health scores, overdue invoices, and delivery risk signals
          </div>
        </div>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={() => void load(true)}
            disabled={refreshing || loading}
          >
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* ── Loading skeleton ───────────────────────────────────────────── */}
      {loading && (
        <div className={cx("flexCol", "gap16")}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={cx(styles.card, "minH96")} />
          ))}
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className={cx(styles.card, styles.cardInner)}>
          <div className={cx("text13", "colorRed", "mb8")}>Failed to load recommendations</div>
          <div className={cx("text12", "colorMuted", "mb16")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {!loading && !error && recommendations.length === 0 && (
        <div className={cx(styles.card, styles.cardInner, "textCenter")}>
          <div className={cx("text13", "mb4")}>No recommendations at this time</div>
          <div className={cx("text12", "colorMuted")}>
            All client health scores, invoices, and delivery signals look healthy.
          </div>
        </div>
      )}

      {/* ── Recommendation cards ───────────────────────────────────────── */}
      {!loading && !error && recommendations.length > 0 && (
        <div className={cx("flexCol", "gap16")}>
          {recommendations.map((r) => (
            <article key={r.id} className={styles.card}>
              <div className={cx(styles.cardHd)}>
                <span className={styles.cardHdTitle}>{r.title}</span>
                <span
                  className={cx(
                    "badge",
                    r.type === "Risk"
                      ? "badgeRed"
                      : r.type === "Revenue"
                        ? "badgeGreen"
                        : "badgeAmber"
                  )}
                >
                  {r.type}
                </span>
              </div>
              <div className={styles.cardInner}>
                <div className={cx("text12", "colorMuted", "mb12")}>{r.reasoning}</div>
                <div className={cx("flexBetween")}>
                  <div className={cx("flex", "gap16", "text11")}>
                    <span>
                      Confidence:{" "}
                      <strong
                        className={cx("fontMono", r.confidence >= 80 ? "colorGreen" : "colorAmber")}
                      >
                        {r.confidence}%
                      </strong>
                    </span>
                    {r.estimatedValue !== "—" && (
                      <span>
                        Est. Value: <strong className={cx("fontMono")}>{r.estimatedValue}</strong>
                      </span>
                    )}
                  </div>
                  <button type="button" className={cx("btnSm", "btnAccent")}>
                    {r.action}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
