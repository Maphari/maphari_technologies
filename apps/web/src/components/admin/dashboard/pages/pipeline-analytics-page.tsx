// ════════════════════════════════════════════════════════════════════════════
// pipeline-analytics-page.tsx — Pipeline-to-Revenue Conversion Analytics
// Data   : GET /admin/pipeline/conversion-analytics
// Shows  : Lead-to-revenue funnel · KPI row · Monthly trend · Loss reasons
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cx, styles } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
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
      try {
        const r = await loadPipelineAnalyticsWithRefresh(session);
        if (cancelled) return;
        if (r.nextSession) saveSession(r.nextSession);
        if (r.error || !r.data) {
          setLoadError(r.error?.message ?? "Failed to load pipeline analytics. Please try again.");
          onNotify("error", r.error?.message ?? "Failed to load pipeline analytics.");
          return;
        }
        setLoadError(null);
        setData(r.data);
      } catch (err: unknown) {
        if (!cancelled) setLoadError((err as Error)?.message ?? "Failed to load pipeline analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
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
          <div className={styles.pageEyebrow}>FINANCE / PIPELINE ANALYTICS</div>
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
          <WidgetGrid columns={4}>
            <StatWidget label="Pipeline Value" value={formatZAR(data.forecastNextMonth)} tone="accent" sub="Forecast next month" />
            <StatWidget label="Total Deals" value={String(data.funnel.reduce((s, f) => s + f.count, 0))} sub="Across all stages" />
            <StatWidget label="Win Rate" value={`${data.wonThisMonth > 0 ? Math.round((data.wonThisMonth / Math.max(data.wonThisMonth + data.lostThisMonth, 1)) * 100) : 0}%`} tone="green" />
            <StatWidget label="Avg Deal Size" value={formatZAR(data.avgDealSizeZAR)} sub="Won leads" />
          </WidgetGrid>

          {/* ── Charts & Pipeline ───────────────────────────────────────── */}
          <WidgetGrid columns={2}>
            <ChartWidget
              label="Pipeline by Stage"
              data={data.funnel.map((s) => ({ stage: stageLabel(s.stage), count: s.count }))}
              dataKey="count"
              xKey="stage"
              type="bar"
              color="#8b6fff"
            />
            <PipelineWidget
              label="Pipeline Stages"
              stages={[
                { label: "Prospect", count: data.funnel.find((s) => s.stage === "NEW")?.count ?? 0, total: Math.max(maxCount, 1), color: "#8b6fff" },
                { label: "Qualified", count: data.funnel.find((s) => s.stage === "QUALIFIED")?.count ?? 0, total: Math.max(maxCount, 1), color: "#f5a623" },
                { label: "Proposal", count: data.funnel.find((s) => s.stage === "PROPOSAL")?.count ?? 0, total: Math.max(maxCount, 1), color: "#f5a623" },
                { label: "Won", count: data.funnel.find((s) => s.stage === "WON")?.count ?? 0, total: Math.max(maxCount, 1), color: "#34d98b" },
                { label: "Lost", count: data.funnel.find((s) => s.stage === "LOST")?.count ?? 0, total: Math.max(maxCount, 1), color: "#ff5f5f" },
              ]}
            />
          </WidgetGrid>

          {/* ── Deals Table ──────────────────────────────────────────────── */}
          <TableWidget
            label="Deal Pipeline"
            rows={data.funnel}
            rowKey="stage"
            emptyMessage="No pipeline data available."
            columns={[
              { key: "name", header: "Stage", render: (_, row) => stageLabel(row.stage) },
              { key: "count", header: "Count", align: "right", render: (_, row) => String(row.count) },
              { key: "conversion", header: "Conversion Rate", align: "right", render: (_, row) => `${row.conversionRate}%` },
            ]}
          />

          {/* ── Monthly Trend ──────────────────────────────────────────── */}
          <WidgetGrid columns={2}>
            <ChartWidget
              label="Monthly Trend — Last 6 Months"
              data={data.monthlyTrend.map((m) => ({ month: m.month, won: m.won, lost: m.lost }))}
              dataKey="won"
              xKey="month"
              type="bar"
              color="#34d98b"
            />
            <TableWidget
              label="Top Loss Reasons"
              rows={data.topLossReasons}
              rowKey="reason"
              emptyMessage="No lost leads recorded yet."
              columns={[
                { key: "reason", header: "Reason", render: (_, row) => row.reason },
                { key: "count", header: "Count", align: "right", render: (_, row) => String(row.count) },
              ]}
            />
          </WidgetGrid>
        </>
      )}
    </div>
  );
}
