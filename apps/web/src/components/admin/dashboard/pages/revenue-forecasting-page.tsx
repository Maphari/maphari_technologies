// ════════════════════════════════════════════════════════════════════════════
// revenue-forecasting-page.tsx — Admin revenue forecasting wired to real API
// Data   : GET /invoices  (via loadAdminSnapshotWithRefresh)
//          Paid invoices  → actual monthly revenue grouped by paidAt month
//          Pending/Draft  → projected revenue grouped by dueAt month
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { formatMoneyK } from "@/lib/utils/format-money";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminInvoice } from "../../../../lib/api/admin/types";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "6-month forecast" | "monthly breakdown" | "outstanding";
const tabs: Tab[] = ["6-month forecast", "monthly breakdown", "outstanding"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function monthKey(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  if (!key) return "";
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}


function buildMonthBuckets(invoices: AdminInvoice[]) {
  const actual: Record<string, number> = {};   // paid invoices by paidAt month
  const projected: Record<string, number> = {}; // open/draft by dueAt month

  for (const inv of invoices) {
    if (inv.status === "PAID" && inv.paidAt) {
      const key = monthKey(inv.paidAt);
      if (key) actual[key] = (actual[key] ?? 0) + inv.amountCents;
    }
    if ((inv.status === "ISSUED" || inv.status === "DRAFT" || inv.status === "OVERDUE") && inv.dueAt) {
      const key = monthKey(inv.dueAt);
      if (key) projected[key] = (projected[key] ?? 0) + inv.amountCents;
    }
  }

  // Build a sorted month list spanning last 3 months + next 5 months from today
  const now = new Date();
  const keys = new Set<string>();
  for (let offset = -3; offset <= 5; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    keys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  // Also include any key from real data
  [...Object.keys(actual), ...Object.keys(projected)].forEach((k) => keys.add(k));

  return [...keys]
    .sort()
    .map((key) => ({
      key,
      label: monthLabel(key),
      actual: actual[key] ?? 0,
      projected: projected[key] ?? 0
    }));
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function RevenueForecastingPage({ session, onNotify }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("6-month forecast");
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const r = await loadAdminSnapshotWithRefresh(session);
        if (cancelled) return;
        if (r.nextSession) saveSession(r.nextSession);
        if (r.error) { setError(r.error.message ?? "Failed to load."); return; }
        setInvoices(r.data?.invoices ?? []);
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  const months = useMemo(() => buildMonthBuckets(invoices), [invoices]);

  // KPI summary
  const totalPaid = useMemo(() => invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amountCents, 0), [invoices]);
  const totalOutstanding = useMemo(
    () => invoices.filter((i) => i.status === "ISSUED" || i.status === "OVERDUE").reduce((s, i) => s + i.amountCents, 0),
    [invoices]
  );
  const totalDraft = useMemo(() => invoices.filter((i) => i.status === "DRAFT").reduce((s, i) => s + i.amountCents, 0), [invoices]);
  const overdueInvoices = useMemo(() => invoices.filter((i) => i.status === "OVERDUE"), [invoices]);

  // Future 6-month projection window
  const now = new Date();
  const futureKeys = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const forecastMonths = months.filter((m) => futureKeys.includes(m.key));

  const outstandingInvoices = invoices.filter((i) => i.status === "ISSUED" || i.status === "OVERDUE");

  // ── Forecast accuracy: pct of previous months that were fully collected ─────
  const historicMonths = months.filter((m) => !futureKeys.includes(m.key) && (m.actual + m.projected) > 0);
  const accuracyPct = historicMonths.length > 0
    ? Math.round(historicMonths.reduce((s, m) => {
        const total = m.actual + m.projected;
        return s + (total > 0 ? m.actual / total : 0);
      }, 0) / historicMonths.length * 100)
    : 0;

  // ── Best / worst case for next 6 months ───────────────────────────────────
  const bestCase  = forecastMonths.reduce((s, m) => s + m.actual + m.projected, 0);
  const worstCase = Math.round(bestCase * 0.7);

  // ── Chart: actual vs forecast ─────────────────────────────────────────────
  const chartData = forecastMonths.map((m) => ({
    label:     m.label,
    actual:    Math.round(m.actual / 100),
    forecast:  Math.round(m.projected / 100),
  }));

  // ── Forecast scenarios pipeline ───────────────────────────────────────────
  const maxScenario = Math.max(bestCase, 1);
  const scenarioStages = [
    { label: "Best Case",  count: Math.round(bestCase / 100),  total: Math.round(maxScenario / 100), color: "#34d98b" },
    { label: "Base Case",  count: Math.round(bestCase * 0.85 / 100), total: Math.round(maxScenario / 100), color: "#8b6fff" },
    { label: "Worst Case", count: Math.round(worstCase / 100), total: Math.round(maxScenario / 100), color: "#ff5f5f" },
  ];

  // ── Table rows ─────────────────────────────────────────────────────────────
  const tableRows = forecastMonths.map((m) => {
    const totalCents = m.actual + m.projected;
    const invoiceCount = invoices.filter((inv) => {
      const dateField = inv.status === "PAID" ? inv.paidAt : inv.dueAt;
      return monthKey(dateField) === m.key;
    }).length;
    const variance = m.actual > 0 && m.projected > 0
      ? `${Math.round(((m.actual - m.projected) / m.projected) * 100)}%`
      : "—";
    return {
      period:    m.label,
      projected: m.projected > 0 ? formatMoneyK(m.projected) : "—",
      actual:    m.actual > 0 ? formatMoneyK(m.actual) : "—",
      variance,
      invoices:  invoiceCount,
      total:     totalCents > 0 ? formatMoneyK(totalCents) : "—",
    };
  }) as Record<string, unknown>[];

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

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.pageBody)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>FINANCE / FORECASTING</div>
          <h1 className={styles.pageTitle}>Revenue Forecasting</h1>
          <div className={styles.pageSub}>Revenue projections · Scenario analysis · Forecast accuracy</div>
        </div>
        <div className={styles.pageActions}>
          <select
            title="View"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as Tab)}
            className={styles.filterSelect}
          >
            {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Forecast</button>
        </div>
      </div>

      {/* ── Row 1: KPI stats ── */}
      <WidgetGrid>
        <StatWidget
          label="Projected Revenue"
          value={formatMoneyK(bestCase)}
          sub="Next 6 months (best case)"
          tone="accent"
        />
        <StatWidget
          label="Forecast Accuracy"
          value={`${accuracyPct}%`}
          sub="Historical collection rate"
          tone={accuracyPct >= 80 ? "green" : accuracyPct >= 60 ? "amber" : "red"}
          progressValue={accuracyPct}
        />
        <StatWidget
          label="Best Case"
          value={formatMoneyK(bestCase)}
          sub="100% collection on projected"
          tone="green"
        />
        <StatWidget
          label="Worst Case"
          value={formatMoneyK(worstCase)}
          sub="70% collection scenario"
          tone="red"
        />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Actual vs Forecast"
          data={chartData.length > 0 ? chartData : [{ label: "No data", actual: 0, forecast: 0 }]}
          dataKey={["actual", "forecast"]}
          type="line"
          color={["#8b6fff", "#34d98b"]}
          legend={[
            { key: "actual",   label: "Collected" },
            { key: "forecast", label: "Projected" },
          ]}
          xKey="label"
        />
        <PipelineWidget
          label="Forecast Scenarios"
          stages={scenarioStages}
        />
      </WidgetGrid>

      {/* ── Row 3: Forecast table ── */}
      <WidgetGrid>
        <TableWidget
          label="Forecast Items"
          rows={tableRows}
          rowKey="period"
          emptyMessage="No forecast data available."
          columns={[
            { key: "period",    header: "Period",    align: "left" },
            { key: "projected", header: "Projected", align: "right" },
            { key: "actual",    header: "Collected", align: "right" },
            { key: "variance",  header: "Variance",  align: "right" },
            { key: "total",     header: "Total",     align: "right" },
          ]}
        />
      </WidgetGrid>

      {/* ── Outstanding sub-view ── */}
      {activeTab === "outstanding" && outstandingInvoices.length > 0 ? (
        <div className={cx("card", "p24", "mt16")}>
          <div className={cx("text13", "fw700", "mb16")}>Outstanding Receivables — {formatMoneyK(totalOutstanding)}</div>
          <div className={cx("flexCol", "gap10")}>
            {outstandingInvoices.slice(0, 10).map((inv) => (
              <div key={inv.id} className={cx("flexBetween", "borderB", "py8")}>
                <div>
                  <div className={cx("text12", "fw600")}>{inv.number}</div>
                  <div className={cx("text11", "colorMuted")}>Due {inv.dueAt ? new Date(inv.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—"}</div>
                </div>
                <span className={cx(inv.status === "OVERDUE" ? "badgeRed" : "badgeAmber")}>{inv.status}</span>
                <span className={cx("fontMono", "fw700", "colorAccent")}>{formatMoneyK(inv.amountCents)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── KPI sub-summary for monthly breakdown ── */}
      {activeTab !== "outstanding" ? (
        <div className={cx("card", "p24", "mt16")}>
          <div className={cx("flexBetween")}>
            <div>
              <div className={cx("text12", "colorMuted")}>Total Collected</div>
              <div className={cx("fontMono", "fw700", "colorAccent")}>{formatMoneyK(totalPaid)}</div>
            </div>
            <div>
              <div className={cx("text12", "colorMuted")}>Outstanding</div>
              <div className={cx("fontMono", "fw700", totalOutstanding > 0 ? "colorAmber" : "colorAccent")}>{formatMoneyK(totalOutstanding)}</div>
            </div>
            <div>
              <div className={cx("text12", "colorMuted")}>Draft Pipeline</div>
              <div className={cx("fontMono", "fw700", "colorBlue")}>{formatMoneyK(totalDraft)}</div>
            </div>
            <div>
              <div className={cx("text12", "colorMuted")}>Overdue</div>
              <div className={cx("fontMono", "fw700", overdueInvoices.length > 0 ? "colorRed" : "colorAccent")}>{overdueInvoices.length}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
