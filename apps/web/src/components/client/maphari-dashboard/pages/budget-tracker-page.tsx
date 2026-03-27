"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import {
  loadPortalPhasesWithRefresh,
  loadPortalChangeRequestsWithRefresh,
  type PortalPhase,
  type PortalProjectChangeRequest,
} from "../../../../lib/api/portal";
import {
  loadPortalWeeklySpendWithRefresh,
  loadBudgetBurnWithRefresh,
  type PortalWeeklySpendWeek,
  type PortalBudgetBurn,
} from "../../../../lib/api/portal/projects";
import { saveSession } from "../../../../lib/auth/session";
import { formatMoneyCents } from "../../../../lib/i18n/currency";

// ── Weekly chart constants ─────────────────────────────────────────────────
const CHART_H = 120;

// ── Change request risk colour map ────────────────────────────────────────
const CR_RISK_COLOR = { green: "var(--green)", amber: "var(--amber)", red: "var(--red)" } as const;

function csvCell(value: string | number): string {
  return "\"" + String(value).replace(/"/g, "\"\"") + "\"";
}

function triggerBudgetExportDownload(input: {
  totalBudget: number;
  billedToDate: number;
  paidToDate: number;
  remainingBudget: number;
  totalBudgetHours: number;
  spentToDateHours: number;
  remainingHours: number;
  weeklySpend: Array<{ week: string; spend: number; forecast: boolean }>;
  pendingCRs: Array<{ id: string; label: string; costCents: number | null; estimatedHours: number | null; risk: "amber" | "green" | "red" }>;
  phaseRows: Array<{ name: string; budgetHours: number; loggedHours: number }>;
}): void {
  const summaryRows = [
    ["Metric", "Value"],
    ["Total Budget (ZAR)", input.totalBudget.toFixed(2)],
    ["Billed To Date (ZAR)", input.billedToDate.toFixed(2)],
    ["Paid To Date (ZAR)", input.paidToDate.toFixed(2)],
    ["Remaining Budget (ZAR)", input.remainingBudget.toFixed(2)],
    ["Budgeted Hours", input.totalBudgetHours.toFixed(1)],
    ["Logged Hours", input.spentToDateHours.toFixed(1)],
    ["Remaining Hours", input.remainingHours.toFixed(1)],
  ].map((row) => row.map(csvCell).join(","));

  const phaseRows = [
    "",
    "Phase Breakdown",
    ["Phase", "Budget Hours", "Logged Hours"].map(csvCell).join(","),
    ...input.phaseRows.map((phase) =>
      [phase.name, phase.budgetHours.toFixed(1), phase.loggedHours.toFixed(1)].map(csvCell).join(",")
    ),
  ];

  const weeklyRows = [
    "",
    "Weekly Spend",
    ["Week", "Spend (ZAR)", "Forecast"].map(csvCell).join(","),
    ...input.weeklySpend.map((week) =>
      [week.week, week.spend.toFixed(2), week.forecast ? "Yes" : "No"].map(csvCell).join(",")
    ),
  ];

  const crRows = [
    "",
    "Pending Change Requests",
    ["ID", "Title", "Estimated Cost (ZAR)", "Estimated Hours", "Risk"].map(csvCell).join(","),
    ...input.pendingCRs.map((cr) =>
      [
        cr.id,
        cr.label,
        cr.costCents === null ? "Pending estimate" : (cr.costCents / 100).toFixed(2),
        cr.estimatedHours === null ? "Pending estimate" : cr.estimatedHours.toFixed(1),
        cr.risk,
      ].map(csvCell).join(",")
    ),
  ];

  const csv = [...summaryRows, ...phaseRows, ...weeklyRows, ...crRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "maphari-budget-tracker.csv";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ── API mapper ─────────────────────────────────────────────────────────────────
interface BudgetPhaseRow { name: string; budgetHours: number; loggedHours: number; color: string; icon: string }
const BP_COLORS = ["var(--amber)", "var(--purple)", "var(--lime)", "var(--green)", "var(--muted2)"] as const;
const BP_ICONS  = ["target", "layers", "code", "check", "rocket"] as const;

function apiToPhaseRow(p: PortalPhase, idx: number): BudgetPhaseRow {
  return {
    name:   p.name,
    budgetHours: Math.max(p.budgetedHours, 0),
    loggedHours: Math.max(p.loggedHours, 0),
    color: p.color ?? BP_COLORS[idx % BP_COLORS.length],
    icon:  BP_ICONS[idx % BP_ICONS.length],
  };
}

// ── CR mapper ─────────────────────────────────────────────────────────────
type CrRow = { id: string; label: string; costCents: number | null; estimatedHours: number | null; icon: string; risk: "amber" | "green" | "red" };

function crToRow(cr: PortalProjectChangeRequest): CrRow {
  const costCents = cr.estimatedCostCents ?? null;
  const costRand = costCents !== null ? costCents / 100 : 0;
  const risk: CrRow["risk"] = costCents === null ? "amber" : costRand > 50_000 ? "red" : costRand > 20_000 ? "amber" : "green";
  return { id: cr.id, label: cr.title, costCents, estimatedHours: cr.estimatedHours ?? null, icon: "zap", risk };
}

// ── BudgetBurnGauge ───────────────────────────────────────────────────────
interface BudgetBurnGaugeProps {
  projectId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

function BudgetBurnGauge({ projectId, session }: BudgetBurnGaugeProps) {
  const [data, setData]       = useState<PortalBudgetBurn | null>(null);
  const [loading, setLoading] = useState(true);
  const accessToken: string | undefined = session?.accessToken;

  const fetchBurn = useCallback(() => {
    if (!projectId || !session) { setLoading(false); return; }
    setLoading(true);
    loadBudgetBurnWithRefresh(session, projectId).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setData(result.data);
    }).finally(() => setLoading(false));
  // stable deps: projectId string + accessToken string (not session object)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, accessToken]);

  useEffect(() => { fetchBurn(); }, [fetchBurn]);

  if (loading || !data) return null;

  const pct        = Math.min(data.burnPercent, 100);
  const fillClass  = pct >= 90 ? "budgetBurnFillRed" : pct >= 70 ? "budgetBurnFillAmber" : "budgetBurnFillGreen";
  const fmtR       = (v: number) => `R${v.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;

  return (
    <div className={cx("budgetBurnCard")}>
      <div className={cx("budgetBurnHeader")}>
        <span className={cx("budgetBurnLabel")}>Budget Burn</span>
        <span className={cx("budgetBurnValues")}>
          {fmtR(data.billedRand)} / {fmtR(data.budgetRand)}
        </span>
      </div>
      <div className={cx("budgetBurnTrack")}>
        <div className={cx(fillClass)} style={{ width: `${pct}%` }} />
      </div>
      <div className={cx("budgetBurnFooter")}>
        <span className={cx("budgetBurnPct")}>{pct}% used</span>
        <span className={cx("budgetBurnEst")}>
          {data.projectedEndDate
            ? `Est. end: ${data.projectedEndDate}`
            : data.dueAt
            ? `Due: ${data.dueAt}`
            : "No projection available"}
        </span>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────
export interface BudgetTrackerPageProps {
  currency?: string
}

export function BudgetTrackerPage({ currency = "ZAR" }: BudgetTrackerPageProps) {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error,   setError]             = useState<string | null>(null);
  const [phaseRows, setPhaseRows]       = useState<BudgetPhaseRow[]>([]);
  const [pendingCRs, setPendingCRs]     = useState<CrRow[]>([]);
  const [activeCRs, setActiveCRs]       = useState<Set<string>>(new Set());
  const [weeklySpend, setWeeklySpend]   = useState<PortalWeeklySpendWeek[]>([]);
  const [weeklyBudgetCap, setWeeklyBudgetCap] = useState(0); // ZAR
  const [todayWeekLabel, setTodayWeekLabel]   = useState("");
  const [burnData, setBurnData]         = useState<PortalBudgetBurn | null>(null);

  const fmt = (v: number) => formatMoneyCents(Math.round(v) * 100, { currency, maximumFractionDigits: 0 });
  const fmtHours = (v: number) => v.toLocaleString("en-ZA", { maximumFractionDigits: 1 }) + " hrs";

  const fetchBudgetTrackerData = useCallback(async (): Promise<boolean> => {
    if (!session || !projectId) {
      setLoading(false);
      return false;
    }

    setLoading(true);
    setError(null);

    const [phaseR, crR, weeklyR, burnR] = await Promise.all([
      loadPortalPhasesWithRefresh(session, projectId),
      loadPortalChangeRequestsWithRefresh(session, { projectId, status: "ESTIMATED" }),
      loadPortalWeeklySpendWithRefresh(session, projectId),
      loadBudgetBurnWithRefresh(session, projectId),
    ]);

    if (phaseR.nextSession) saveSession(phaseR.nextSession);
    if (crR.nextSession) saveSession(crR.nextSession);
    if (weeklyR.nextSession) saveSession(weeklyR.nextSession);
    if (burnR.nextSession) saveSession(burnR.nextSession);

    const firstError = phaseR.error ?? crR.error ?? weeklyR.error ?? burnR.error;
    if (firstError) {
      setError(firstError.message ?? "Failed to load budget tracker.");
      setLoading(false);
      return false;
    }

    setPhaseRows((phaseR.data ?? []).map(apiToPhaseRow));
    setPendingCRs((crR.data ?? []).map(crToRow));
    setBurnData(burnR.data ?? null);

    if (weeklyR.data) {
      setWeeklySpend(weeklyR.data.weeks.map((w) => ({
        week: w.week,
        amountCents: w.amountCents,
        forecast: w.forecast,
      })));
      setWeeklyBudgetCap(weeklyR.data.weeklyBudgetCapCents / 100);
      setTodayWeekLabel(weeklyR.data.currentWeekLabel);
    } else {
      setWeeklySpend([]);
      setWeeklyBudgetCap(0);
      setTodayWeekLabel("");
    }

    setLoading(false);
    return true;
  }, [projectId, session]);

  useEffect(() => {
    const frame = window.setTimeout(() => {
      void fetchBudgetTrackerData();
    }, 0);
    return () => window.clearTimeout(frame);
  }, [fetchBudgetTrackerData]);

  const toggleCR = (id: string) =>
    setActiveCRs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  // ── Real totals ────────────────────────────────────────────────────────────
  const totalBudget = burnData?.budgetRand ?? 0;
  const billedToDate = burnData?.billedRand ?? 0;
  const paidToDate = burnData?.paidRand ?? 0;
  const remainingBudget = burnData?.remainingRand ?? 0;
  const uncollectedBilled = Math.max(billedToDate - paidToDate, 0);
  const utilizationPct = totalBudget > 0 ? Math.round((billedToDate / totalBudget) * 100) : 0;

  const totalBudgetHours = useMemo(() => phaseRows.reduce((a, p) => a + p.budgetHours, 0), [phaseRows]);
  const spentToDateHours = useMemo(() => phaseRows.reduce((a, p) => a + p.loggedHours, 0), [phaseRows]);
  const remainingHours = Math.max(totalBudgetHours - spentToDateHours, 0);

  const crTotal = useMemo(
    () => pendingCRs.filter((c) => activeCRs.has(c.id)).reduce((a, c) => a + ((c.costCents ?? 0) / 100), 0),
    [activeCRs, pendingCRs]
  );
  const adjustedForecast = billedToDate + crTotal;
  const adjustedHeadroom = totalBudget - adjustedForecast;
  const crImpactPct      = totalBudget > 0 ? Math.round((crTotal           / totalBudget) * 100) : 0;
  const isOverBudget     = adjustedForecast > totalBudget;

  // ── Weekly chart derived values ───────────────────────────────────────────
  const weeklySpendZar = useMemo(
    () => weeklySpend.map((w) => ({ week: w.week, spend: w.amountCents / 100, forecast: w.forecast })),
    [weeklySpend]
  );
  const maxWeekSpend = weeklySpendZar.length > 0 ? Math.max(...weeklySpendZar.map((w) => w.spend)) : 0;
  const chartMax     = Math.max(maxWeekSpend, weeklyBudgetCap) * 1.15 || 1;
  const paidPct = totalBudget > 0 ? Math.round((paidToDate / totalBudget) * 100) : 0;
  const awaitingCollectionPct = totalBudget > 0 ? Math.round((uncollectedBilled / totalBudget) * 100) : 0;
  const handleRefresh = async () => {
    setRefreshing(true);
    const ok = await fetchBudgetTrackerData();
    setRefreshing(false);
    if (ok) {
      notify("success", "Budget tracker refreshed", "Latest project budget figures have been loaded.");
    }
  };

  const handleExport = () => {
    triggerBudgetExportDownload({
      totalBudget,
      billedToDate,
      paidToDate,
      remainingBudget,
      totalBudgetHours,
      spentToDateHours,
      remainingHours,
      weeklySpend: weeklySpendZar,
      pendingCRs,
      phaseRows,
    });
    notify("success", "Downloading", "Budget tracker CSV is downloading.");
  };

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
    <div className={cx("pageBody")}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Budget</div>
          <h1 className={cx("pageTitle")}>Budget Tracker</h1>
          <p className={cx("pageSub")}>Track project spend, burn rate, and model the impact of pending change requests.</p>
        </div>
        <div className={cx("pageActions", "flexRow", "gap8", "flexWrap")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost", "flexRow", "flexCenter", "gap6")}
            onClick={() => void handleRefresh()}
            disabled={refreshing}
          >
            <Ic n="refresh" sz={13} c="var(--muted2)" /> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            className={cx("btnSm", "btnGhost", "flexRow", "flexCenter", "gap6")}
            onClick={handleExport}
            disabled={phaseRows.length === 0 && weeklySpendZar.length === 0 && pendingCRs.length === 0}
          >
            <Ic n="download" sz={13} c="var(--muted2)" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Budget Burn Gauge ────────────────────────────────────────────── */}
      {projectId && <BudgetBurnGauge projectId={projectId} session={session} />}

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Total Budget", value: totalBudget > 0 ? fmt(totalBudget) : "—", color: "statCardBlue" },
          { label: "Billed To Date", value: billedToDate > 0 ? fmt(billedToDate) : "—", color: "statCardAccent" },
          { label: "Paid To Date", value: paidToDate > 0 ? fmt(paidToDate) : "—", color: "statCardAmber" },
          { label: "Remaining Budget", value: totalBudget > 0 ? fmt(remainingBudget) : "—", color: "statCardGreen" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Budget overview stacked bar ──────────────────────────────────── */}
      <div className={cx("card", "mb16", "p0", "overflowHidden")}>
        <div className={cx("h3", "dotBgAccent")} />
        <div className={cx("p16x18x18")}>
          <div className={cx("flexRow", "flexCenter", "gap8", "mb14")}>
            <Ic n="chart" sz={14} c="var(--lime)" />
            <span className={cx("cardHdTitle")}>Budget Overview</span>
            <span className={cx("badge", "badgeGreen", "mlAuto")}>
              {utilizationPct}% utilised
            </span>
          </div>

          {/* Stacked horizontal bar */}
          <div className={cx("budgetTrackerBar")}>
            <div
              title={"Paid: " + fmt(paidToDate)}
              className={cx("animBarLime")}
              style={{ "--pct": paidPct + "%" } as React.CSSProperties}
            />
            <div
              title={"Awaiting collection: " + fmt(uncollectedBilled)}
              className={cx("budgetBarForecast")}
              style={{ "--pct": awaitingCollectionPct + "%" } as React.CSSProperties}
            />
            {crImpactPct > 0 && (
              <div
                title={"Selected CR impact: +" + fmt(crTotal)}
                className={cx("budgetBarCR")}
                style={{ "--pct": Math.min(crImpactPct, 100) + "%" } as React.CSSProperties}
              />
            )}
            <div title={"Remaining budget: " + fmt(remainingBudget)} className={cx("flex1")} />
          </div>

          {/* Legend row */}
          <div className={cx("budgetLegendRow")}>
            {[
              { color: "var(--lime)", label: "Paid", value: fmt(paidToDate) },
              { color: "color-mix(in oklab, var(--amber) 55%, transparent)", label: "Awaiting collection", value: fmt(uncollectedBilled) },
              ...(crTotal > 0 ? [{ color: "color-mix(in oklab, var(--red) 55%, transparent)", label: "Selected CR impact", value: "+" + fmt(crTotal) }] : []),
              { color: "var(--s3)", label: isOverBudget ? "Over budget" : "Remaining", value: isOverBudget ? "-" + fmt(Math.abs(adjustedHeadroom)) : fmt(remainingBudget) },
            ].map((l) => (
              <div key={l.label} className={cx("flexRow", "flexCenter", "gap7")}>
                <div className={cx("dot10sq", "noShrink", "dynBgColor")} style={{ "--bg-color": l.color } as React.CSSProperties} />
                <span className={cx("text10", "colorMuted")}>{l.label}</span>
                <span className={cx("text10", "fw700", "dynColor")} style={{ "--color": l.label === "Over budget" ? "var(--red)" : "inherit" } as React.CSSProperties}>{l.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Weekly chart + Phase breakdown ──────────────────────────────── */}
      <div className={cx("grid2", "mb16", "gap16")}>

        {/* Weekly spend chart */}
        <div className={cx("card", "p0", "overflowHidden")}>
          <div className={cx("cardHd")}>
            <span className={cx("cardHdTitle")}>Weekly Spend</span>
            <span className={cx("badge", "badgeAccent", "mlAuto")}>{todayWeekLabel || "—"} · live</span>
          </div>
          <div className={cx("p0x16x16", "relative")}>

            {weeklySpendZar.length === 0 ? (
              <p className={cx("text11", "colorMuted", "py16_px")}>No time log data yet for this project.</p>
            ) : (
            /* Y-axis + gridlines */
            <div className={cx("flexRow", "gap8")}>
              {/* Y labels */}
              <div className={cx("chartYAxis")} style={{ "--chart-h": `${CHART_H}px` } as React.CSSProperties}>
                {[chartMax, chartMax * 0.75, chartMax * 0.5, chartMax * 0.25].map((v) => (
                  <span key={v} className={cx("chartYLabel")}>
                    {fmt(v)}
                  </span>
                ))}
              </div>

              {/* Chart area */}
              <div className={cx("flex1", "relative")}>
                {/* Gridlines */}
                {[0.75, 0.5, 0.25].map((f) => (
                  <div key={f} className={cx("chartGridLine")} style={{ "--top": `${(1 - f) * CHART_H}px` } as React.CSSProperties} />
                ))}
                {/* Weekly budget cap dashed line */}
                {weeklyBudgetCap > 0 && (
                  <div className={cx("absWkBudgetLine")} style={{ "--top": `${(1 - weeklyBudgetCap / chartMax) * CHART_H}px` } as React.CSSProperties}>
                    <span className={cx("absLabelAmber")}>Budget</span>
                  </div>
                )}

                {/* Bars */}
                <div className={cx("chartBarArea")} style={{ "--chart-area-h": `${CHART_H}px` } as React.CSSProperties}>
                  {weeklySpendZar.map((w) => {
                    const barH = Math.round((w.spend / chartMax) * CHART_H);
                    const isToday = w.week === todayWeekLabel;
                    const isOver = weeklyBudgetCap > 0 && w.spend > weeklyBudgetCap && !w.forecast;
                    const barBg = isOver ? "var(--red)" : w.forecast ? "color-mix(in oklab, var(--lime) 25%, transparent)" : "var(--lime)";
                    const labelColor = isOver ? "var(--red)" : w.forecast ? "var(--muted2)" : "var(--lime)";
                    return (
                      <div
                        key={w.week}
                        className={cx("flex1", "flexColEndCenter", "h100pct", "relative")}
                      >
                        {isToday && (
                          <div className={cx("chartMidline")} />
                        )}
                        <span className={cx("chartBarLabel", "dynColor")} style={{ "--color": labelColor } as React.CSSProperties}>
                          {fmt(w.spend)}
                        </span>
                        <div className={cx("chartBarBlock", "dynBgColor")} style={{ "--bar-h": `${barH}px`, "--bg-color": barBg, "--outline": isToday ? "1.5px solid var(--lime)" : "none", "--border-top": w.forecast ? "1.5px dashed color-mix(in oklab, var(--lime) 50%, transparent)" : "none" } as React.CSSProperties} />
                      </div>
                    );
                  })}
                </div>

                {/* Week labels */}
                <div className={cx("flexRow", "gap4", "mt4")}>
                  {weeklySpendZar.map((w) => (
                    <div key={w.week} className={cx("chartWeekLabel", "dynColor")} style={{ "--color": w.week === todayWeekLabel ? "var(--lime)" : "var(--muted2)", "--fw": w.week === todayWeekLabel ? "700" : "400" } as React.CSSProperties}>
                      {w.week}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}

            {/* Legend */}
            <div className={cx("flexRow", "gap14", "mt12", "flexWrap")}>
              {[
                { color: "var(--lime)",   label: "Actual",       dashed: false },
                { color: "color-mix(in oklab, var(--lime) 25%, transparent)", label: "Forecast", dashed: true },
                { color: "var(--red)",    label: "Over budget",  dashed: false },
              ].map((l) => (
                <div key={l.label} className={cx("flexRow", "gap5")}>
                  <div className={cx("legendSwatchRect", "dynBgColor")} style={{ "--bg-color": l.color } as React.CSSProperties} />
                  <span className={cx("text10", "colorMuted")}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase breakdown */}
        <div className={cx("card", "p0", "overflowHidden")}>
          <div className={cx("cardHd")}>
            <span className={cx("cardHdTitle")}>Phase Breakdown</span>
            <span className={cx("text10", "colorMuted", "mlAuto")}>Budgeted vs logged hours</span>
          </div>

          {/* Composition bar */}
          <div className={cx("phasedBudgetTrack")}>
            {phaseRows.map((p) => (
              <div key={p.name} className={cx("phasedBudgetSegment", "dynBgColor")} style={{ "--flex": String(Math.max(p.budgetHours, 1)), "--bg-color": p.color } as React.CSSProperties} title={p.name} />
            ))}
          </div>

          <div className={cx("pb4")}>
            {phaseRows.map((p, i) => {
              const spentPct = p.budgetHours > 0 ? Math.round((p.loggedHours / p.budgetHours) * 100) : 0;
              return (
                <div key={p.name} className={cx("budgetProjectRow", i > 0 && "borderTopDivider")}>
                  <div className={cx("budgetProjectIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${p.color} 12%, var(--s2))` } as React.CSSProperties}>
                    <Ic n={p.icon} sz={13} c={p.color} />
                  </div>
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("budgetProjectMetaRow")}>
                      <span className={cx("text12", "fw600", "truncate")}>{p.name}</span>
                      <div className={cx("budgetProjectBadgePill")}>
                        <span className={cx("text10", "colorMuted")}>{fmtHours(p.loggedHours)}</span>
                        <span className={cx("text10", "colorMuted")}>/</span>
                        <span className={cx("text10", "fw600")}>{fmtHours(p.budgetHours)}</span>
                        <span className={cx("budgetStatusPill", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${p.color} 14%, var(--s3))`, "--color": p.color } as React.CSSProperties}>
                          {spentPct}%
                        </span>
                      </div>
                    </div>
                    {/* Dual bar: grey budget track, colored spent fill */}
                    <div className={cx("trackH5")}>
                      <div className={cx("pctFillRInherit", "dynBgColor")} style={{ "--pct": spentPct + "%", "--bg-color": p.color } as React.CSSProperties} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CR Scenario Planner ──────────────────────────────────────────── */}
      <div
        className={cx("card", "crSimCard")}
        style={{ "--border-l": activeCRs.size > 0 ? `3px solid ${isOverBudget ? "var(--red)" : "var(--amber)"}` : "none" } as React.CSSProperties}
      >
        <div className={cx("crSimCardTopBar")} style={{ "--h": activeCRs.size > 0 ? "0px" : "3px", "--bg-color": "var(--b2)" } as React.CSSProperties} />
        <div className={cx("cardHd", "p16x18x0")}>
          <div className={cx("flexRow", "gap8")}>
            <Ic n="zap" sz={14} c="var(--amber)" />
            <span className={cx("cardHdTitle")}>Change Request Scenario Planner</span>
          </div>
          {activeCRs.size > 0 && (
            <span className={cx("badge", isOverBudget ? "badgeRed" : "badgeAmber", "mlAuto")}>
              {isOverBudget ? "Over budget" : `+${fmt(crTotal)}`}
            </span>
          )}
        </div>

        <div className={cx("p14x18x0")}>
          <p className={cx("text12", "colorMuted", "mb14")}>
            Current billed position <span className={cx("fw700", "colorText")}>{totalBudget > 0 ? fmt(billedToDate) : "—"}</span> — toggle pending CRs to model budget impact using actual stored estimates only.
          </p>

          {/* CR toggle cards */}
          <div className={cx("grid2Cols", "gap8", "mb16")}>
            {pendingCRs.length === 0 && (
              <p className={cx("text11", "colorMuted", "crSimCardGrid")}>
                No pending change requests awaiting your decision.
              </p>
            )}
            {pendingCRs.map((cr) => {
              const active = activeCRs.has(cr.id);
              const rc = CR_RISK_COLOR[cr.risk];
              return (
                <button
                  key={cr.id}
                  type="button"
                  onClick={() => toggleCR(cr.id)}
                  className={cx("crItemRow", "dynBgColor")}
                  style={{
                    "--bg-color": active ? `color-mix(in oklab, ${rc} 8%, var(--s2))` : "var(--s2)",
                    "--color": active ? `color-mix(in oklab, ${rc} 35%, transparent)` : "var(--b2)",
                    "--cols": "auto 1fr auto"
                  } as React.CSSProperties}
                >
                  <div className={cx("budgetProjectIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${rc} 14%, var(--s3))` } as React.CSSProperties}>
                    <Ic n={cr.icon} sz={14} c={active ? rc : "var(--muted2)"} />
                  </div>
                  <div className={cx("flex1", "minW0", "ml12")}>
                    <div className={cx("flexRow", "flexCenter", "gap6", "mb2")}>
                      <span className={cx("text11", "fw700")}>{cr.label}</span>
                      {active && <Ic n="check" sz={10} c={rc} />}
                    </div>
                    <div className={cx("text10", "colorMuted")}>{cr.id}</div>
                  </div>
                  <div className={cx("textRight", "noShrink")}>
                    <div className={cx("fw700", "text12", "dynColor")} style={{ "--color": active ? rc : "var(--muted2)" } as React.CSSProperties}>
                      {cr.costCents === null ? "Estimate pending" : "+" + fmt(cr.costCents / 100)}
                    </div>
                    {cr.estimatedHours !== null && (
                      <div className={cx("text10", "colorMuted")}>{fmtHours(cr.estimatedHours)}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Impact bar + result */}
        <div className={cx("p0x18x18")}>
          {/* Visual budget bar */}
          <div className={cx("mb12")}>
            <div className={cx("flexRow", "flexBetween", "mb5")}>
              <span className={cx("text10", "colorMuted")}>Budget utilisation with selected CRs</span>
              <span className={cx("text10", "fw700", "dynColor")} style={{ "--color": isOverBudget ? "var(--red)" : "var(--amber)" } as React.CSSProperties}>
                {totalBudget > 0 ? Math.round((adjustedForecast / totalBudget) * 100) : 0}%
              </span>
            </div>
            <div className={cx("trackH8")}>
              <div className={cx("pctFillRInherit", "dynBgColor")} style={{ "--pct": (totalBudget > 0 ? Math.min((adjustedForecast / totalBudget) * 100, 100) : 0) + "%", "--bg-color": isOverBudget ? "var(--red)" : "var(--amber)" } as React.CSSProperties} />
            </div>
            <div className={cx("flexRow", "flexBetween", "mt4")}>
              <span className={cx("text9", "colorMuted")}>0</span>
              <span className={cx("text9", "colorMuted")}>{totalBudget > 0 ? fmt(totalBudget) : "—"} budget cap</span>
            </div>
          </div>

          {/* Result panel */}
          <div className={cx("crResultPanel", "dynBgColor")} style={{
            "--bg-color": activeCRs.size > 0
              ? `color-mix(in oklab, ${isOverBudget ? "var(--red)" : "var(--amber)"} 8%, var(--s3))`
              : "var(--s2)",
            "--color": activeCRs.size > 0
              ? `color-mix(in oklab, ${isOverBudget ? "var(--red)" : "var(--amber)"} 28%, transparent)`
              : "var(--b2)",
          } as React.CSSProperties}>
            <div>
              <div className={cx("text10", "colorMuted", "mb2")}>Adjusted forecast</div>
              <div className={cx("budgetBigVal", "dynColor")} style={{ "--color": activeCRs.size > 0 ? (isOverBudget ? "var(--red)" : "var(--amber)") : "var(--lime)" } as React.CSSProperties}>
                {fmt(adjustedForecast)}
              </div>
              {crTotal > 0 && (
                <div className={cx("text11", "dynColor", "mt4")} style={{ "--color": isOverBudget ? "var(--red)" : "var(--amber)" } as React.CSSProperties}>
                  +{fmt(crTotal)} from {activeCRs.size} CR{activeCRs.size !== 1 ? "s" : ""}
                  {" · "}
                  {isOverBudget ? `${fmt(-adjustedHeadroom)} over budget` : `${fmt(adjustedHeadroom)} headroom remaining`}
                </div>
              )}
            </div>
            {activeCRs.size > 0 && (
              <div className={cx("mlAuto", "textRight")}>
                <div className={cx("text10", "colorMuted")}>Scenario only</div>
                <div className={cx("text11", "fw700", "dynColor")} style={{ "--color": isOverBudget ? "var(--red)" : "var(--amber)" } as React.CSSProperties}>
                  Review selections in Change Requests
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Weekly burn signals ─────────────────────────────────────────── */}
      <div className={cx("card", "p0", "overflowHidden")}>
        <div className={cx("cardHd")}>
          <div className={cx("flexRow", "gap8")}>
            <Ic n="calendar" sz={14} c="var(--muted2)" />
            <span className={cx("cardHdTitle")}>Weekly Burn Signals</span>
          </div>
          <span className={cx("text10", "colorMuted", "mlAuto")}>
            {weeklyBudgetCap > 0 ? "vs " + fmt(weeklyBudgetCap) + " / week cap" : "Live project spend"}
          </span>
        </div>

        {weeklySpendZar.length === 0 && (
          <p className={cx("text11", "colorMuted", "py16_px", "px18_px")}>
            No weekly spend data yet for this project.
          </p>
        )}
        {weeklySpendZar.map((m, i) => {
          const barW = Math.round((m.spend / chartMax) * 100);
          const budgetW = chartMax > 0 ? Math.round((weeklyBudgetCap / chartMax) * 100) : 0;
          const isOver = weeklyBudgetCap > 0 && m.spend > weeklyBudgetCap && !m.forecast;
          const isCurrent = m.week === todayWeekLabel;
          const isForecast = m.forecast;
          const barColor = isOver ? "var(--red)" : isCurrent ? "var(--lime)" : isForecast ? "color-mix(in oklab, var(--lime) 30%, transparent)" : "var(--lime)";
          const statusColor = isOver ? "var(--red)" : isCurrent ? "var(--lime)" : isForecast ? "var(--muted2)" : "var(--green)";

          return (
            <div key={m.week} className={cx("budgetMonthRow", i > 0 && "borderTopDivider")}>
              <div className={cx("budgetMonthIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${statusColor} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${statusColor} 25%, transparent)` } as React.CSSProperties}>
                <Ic n={isOver ? "alert" : isCurrent ? "activity" : isForecast ? "clock" : "check"} sz={13} c={statusColor} />
              </div>

              <div className={cx("flex1", "minW0")}>
                <div className={cx("budgetMonthMetaRow")}>
                  <div className={cx("flexRow", "gap8")}>
                    <span className={cx("fw600", "text12")}>{m.week}</span>
                    {isForecast && <span className={cx("badge", "badgeMuted", "fs9")}>est.</span>}
                    {isCurrent && <span className={cx("badge", "badgeAccent", "fs9")}>current</span>}
                  </div>
                  <div className={cx("flexRow", "flexCenter", "gap8")}>
                    <span className={cx("fw700", "text12", "dynColor")} style={{ "--color": isOver ? "var(--red)" : "inherit" } as React.CSSProperties}>{fmt(m.spend)}</span>
                    <span className={cx("text10", "colorMuted")}>
                      {weeklyBudgetCap > 0 ? Math.round((m.spend / weeklyBudgetCap) * 100) : 0}% of weekly cap
                    </span>
                  </div>
                </div>
                <div className={cx("progressTrackBase")}>
                  <div className={cx("absBarFill", "dynBgColor")} style={{ "--pct": barW + "%", "--bg-color": barColor } as React.CSSProperties} />
                  {weeklyBudgetCap > 0 && (
                    <div className={cx("budgetBudgetMarker")} style={{ "--left": budgetW + "%" } as React.CSSProperties} />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className={cx("p12x18", "borderT", "flexRow", "gap20", "flexWrap")}>
          {[
            { label: "Actual weeks", value: fmt(weeklySpendZar.filter((m) => !m.forecast).reduce((a, m) => a + m.spend, 0)), color: "var(--lime)" },
            { label: "Including forecasts", value: fmt(weeklySpendZar.reduce((a, m) => a + m.spend, 0)), color: "var(--amber)" },
            { label: "Weekly cap", value: weeklyBudgetCap > 0 ? fmt(weeklyBudgetCap) : "—", color: "var(--muted2)" },
          ].map((s) => (
            <div key={s.label} className={cx("catSummaryCol")}>
              <span className={cx("text10", "colorMuted", "mb2")}>{s.label}</span>
              <span className={cx("fw700", "text13", "dynColor")} style={{ "--color": s.color } as React.CSSProperties}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
