// ════════════════════════════════════════════════════════════════════════════
// pipeline-analytics-page.tsx — Pipeline-to-Revenue Conversion Analytics
// Data   : GET /admin/pipeline/conversion-analytics
// Shows  : Lead-to-revenue funnel · KPI row · Monthly trend · Loss reasons
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadPipelineAnalyticsWithRefresh, type PipelineAnalytics, type FunnelStage } from "../../../../lib/api/admin/pipeline";
import { SkeletonCard } from "@/components/shared/ui/page-skeleton";
import { Tooltip } from "@/components/shared/ui/tooltip";
import { Alert } from "@/components/shared/ui/alert";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatZAR(n: number): string {
  if (n === 0) return "R0";
  if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `R${(n / 1_000).toFixed(0)}k`;
  return `R${n}`;
}

const STAGE_ORDER: FunnelStage["stage"][] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

function stageToneCls(stage: FunnelStage["stage"]): string {
  const map: Record<FunnelStage["stage"], string> = {
    NEW:        styles.paStageNew,
    CONTACTED:  styles.paStageContacted,
    QUALIFIED:  styles.paStageQualified,
    PROPOSAL:   styles.paStageProposal,
    WON:        styles.paStageWon,
    LOST:       styles.paStageLost,
  };
  return map[stage] ?? "";
}

function stageLabel(stage: string): string {
  return stage.replace("_", " ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PipelineAnalyticsPage({ session, onNotify }: Props) {
  const [data, setData] = useState<PipelineAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void (async () => {
      const r = await loadPipelineAnalyticsWithRefresh(session);
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) {
        setLoadError(r.error?.message ?? "Failed to load pipeline analytics. Please try again.");
        onNotify("error", r.error?.message ?? "Failed to load pipeline analytics.");
        setLoading(false);
        return;
      }
      setLoadError(null);
      setData(r.data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  // Derived: max count for bar sizing
  const maxCount = data ? Math.max(...data.funnel.map((s) => s.count), 1) : 1;
  const maxTrend = data
    ? Math.max(...data.monthlyTrend.flatMap((m) => [m.won, m.lost]), 1)
    : 1;

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

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / FINANCE</div>
          <h1 className={styles.pageTitle}>Pipeline Analytics</h1>
          <div className={styles.pageSub}>Lead-to-revenue conversion funnel</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => {
            if (!session) return;
            setLoading(true);
            void loadPipelineAnalyticsWithRefresh(session).then((r) => {
              if (r.nextSession) saveSession(r.nextSession);
              if (r.error || !r.data) {
                setLoadError(r.error?.message ?? "Failed to load pipeline analytics. Please try again.");
                onNotify("error", r.error?.message ?? "Failed to load pipeline analytics.");
                return;
              }
              setLoadError(null);
              setData(r.data);
            }).catch((err: unknown) => {
              setLoadError((err as Error)?.message ?? "Failed to load pipeline analytics.");
            }).finally(() => {
              setLoading(false);
            });
          }}>
            Refresh
          </button>
        </div>
      </div>

      {loadError && (
        <Alert
          variant="error"
          message={loadError}
          onRetry={() => { setLoadError(null); }}
        />
      )}

      {!data && (
        <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No pipeline data available.</div>
      )}

      {data && (
        <>
          {/* ── KPI Row ────────────────────────────────────────────────── */}
          <div className={styles.paKpiRow}>
            {[
              {
                label: "Avg Deal Size",
                value: formatZAR(data.avgDealSizeZAR),
                sub: "Won leads",
                color: "var(--accent)"
              },
              {
                label: "Avg Sales Cycle",
                value: `${data.avgSalesCycleDays}d`,
                sub: "Lead → Won",
                color: "var(--blue)"
              },
              {
                label: "Won This Month",
                value: String(data.wonThisMonth),
                sub: "Closed deals",
                color: "var(--green)"
              },
              {
                label: "Lost This Month",
                value: String(data.lostThisMonth),
                sub: "Churned leads",
                color: data.lostThisMonth > 0 ? "var(--red)" : "var(--muted)"
              },
              {
                label: "Forecast Next Month",
                value: formatZAR(data.forecastNextMonth),
                sub: "Pipeline × avg size",
                color: "var(--purple)"
              }
            ].map((kpi) => (
              <div key={kpi.label} className={styles.paKpiCard}>
                <div className={cx("text11", "colorMuted")}>{kpi.label}</div>
                <div className={cx(styles.statValue, colorClass(kpi.color))}>{kpi.value}</div>
                <div className={cx("text10", "colorMuted", "mt4")}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Funnel ─────────────────────────────────────────────────── */}
          <div className={cx(styles.sectionCard, "mb20")}>
            <div className={cx(styles.revfSectionTitle, "mb4")}>Conversion Funnel</div>
            <div className={cx("text11", "colorMuted", "mb12")}>
              Stage-by-stage lead progression · Counts · Conversion rates
            </div>
            <div className={styles.paFunnel}>
              {data.funnel.map((stage, i) => {
                const widthPct = maxCount > 0 ? Math.max(20, Math.round((stage.count / maxCount) * 100)) : 20;
                return (
                  <div
                    key={stage.stage}
                    className={`${styles.paFunnelStage} ${stageToneCls(stage.stage)} ${styles.pfStageBar}`}
                    style={{ "--stage-w": `${widthPct}%` } as CSSProperties}
                  >
                    <div className={styles.paFunnelCount}>{stage.count}</div>
                    <div className={styles.paFunnelLabel}>{stageLabel(stage.stage)}</div>
                    <div className={styles.paFunnelRate}>
                      {i === 0
                        ? "Entry"
                        : (
                          <Tooltip label="Conversion rate from previous stage">
                            {`${stage.conversionRate}% conv.`}
                          </Tooltip>
                        )}
                    </div>
                    {i < data.funnel.length - 1 && (
                      <span className={styles.paFunnelArrow} aria-hidden="true">›</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Bottom grid: trend + loss reasons ──────────────────────── */}
          <div className={cx(styles.revfStack20)}>
            <div className={cx(styles.revfChartCard)}>
              <div className={cx(styles.revfSectionTitle, "mb4")}>Monthly Trend — Last 6 Months</div>
              <div className={cx("text11", "colorMuted", "mb12")}>
                <span className={cx("colorAccent")}>■</span> Won &nbsp;
                <span className={cx("colorRed")}>■</span> Lost
              </div>
              <div className={styles.paTrendBars}>
                {data.monthlyTrend.map((m) => {
                  const wonH = Math.max(4, Math.round((m.won / maxTrend) * 110));
                  const lostH = Math.max(4, Math.round((m.lost / maxTrend) * 110));
                  return (
                    <div key={m.month} className={styles.paTrendGroup}>
                      <div
                        className={`${styles.paTrendWon} ${styles.pfTrendBar}`}
                        style={{ "--bar-h": `${wonH}px` } as CSSProperties}
                        title={`Won: ${m.won}`}
                      />
                      <div
                        className={`${styles.paTrendLost} ${styles.pfTrendBar}`}
                        style={{ "--bar-h": `${lostH}px` } as CSSProperties}
                        title={`Lost: ${m.lost}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className={styles.paTrendMonthRow}>
                {data.monthlyTrend.map((m) => (
                  <div key={m.month} className={styles.paTrendMonthLabel}>{m.month}</div>
                ))}
              </div>
            </div>

            {/* ── Top Loss Reasons ──────────────────────────────────── */}
            <div className={cx(styles.revfTableCard)}>
              <div className={cx(styles.revfSectionTitle, "mb12")}>Top Loss Reasons</div>
              {data.topLossReasons.length === 0 ? (
                <div className={cx("p16", "colorMuted", "text12", "textCenter")}>No lost leads recorded yet.</div>
              ) : (
                <div className={cx("stackGap8")}>
                  {data.topLossReasons.map((item, i) => (
                    <div key={item.reason} className={styles.paLossItem}>
                      <div className={cx("flexRow", "gap8", "alignCenter")}>
                        <span className={cx("fontMono", "text10", "colorMuted")}>#{i + 1}</span>
                        <span className={styles.paLossReason}>{item.reason}</span>
                      </div>
                      <span className={styles.paLossBadge}>{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
