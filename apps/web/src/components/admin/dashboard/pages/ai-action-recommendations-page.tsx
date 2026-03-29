"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAiRecommendations, type AiRecommendation } from "../../../../lib/api/admin/ai";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";

export function AIActionRecommendationsPage() {
  const { session } = useAdminWorkspaceContext();

  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
          setRecommendations(result.data ?? []);
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
          <div className={styles.pageEyebrow}>AI / ML / AI ACTION RECOMMENDATIONS</div>
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
