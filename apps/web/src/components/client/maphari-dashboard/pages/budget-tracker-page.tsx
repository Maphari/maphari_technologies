"use client";

import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalPhasesWithRefresh,
  loadPortalChangeRequestsWithRefresh,
  type PortalPhase,
  type PortalProjectChangeRequest,
  type PortalInvoice,
} from "../../../../lib/api/portal";
import {
  loadPortalWeeklySpendWithRefresh,
  type PortalWeeklySpendWeek,
} from "../../../../lib/api/portal/projects";
import { saveSession } from "../../../../lib/auth/session";
import { formatMoneyCents } from "../../../../lib/i18n/currency";

// ── Weekly chart constants ─────────────────────────────────────────────────
const CHART_H = 120;

// ── Change request risk colour map ────────────────────────────────────────
const CR_RISK_COLOR = { green: "var(--green)", amber: "var(--amber)", red: "var(--red)" } as const;

// ── API mapper ─────────────────────────────────────────────────────────────────
interface BudgetPhaseRow { name: string; budget: number; spent: number; color: string; icon: string }
const HOURLY_RATE_ZAR = 1000; // R 1 000 / hr — estimated — used to convert hours → cost
const BP_COLORS = ["var(--amber)", "var(--purple)", "var(--lime)", "var(--green)", "var(--muted2)"] as const;
const BP_ICONS  = ["target", "layers", "code", "check", "rocket"] as const;

function apiToPhaseRow(p: PortalPhase, idx: number): BudgetPhaseRow {
  const budget = Math.max(p.budgetedHours * HOURLY_RATE_ZAR, 1);
  const spent  = Math.min(p.loggedHours   * HOURLY_RATE_ZAR, budget);
  return {
    name:   p.name,
    budget,
    spent,
    color: p.color ?? BP_COLORS[idx % BP_COLORS.length],
    icon:  BP_ICONS[idx % BP_ICONS.length],
  };
}

// ── CR mapper ─────────────────────────────────────────────────────────────
type CrRow = { id: string; label: string; cost: number; icon: string; risk: "amber" | "green" | "red" };

function crToRow(cr: PortalProjectChangeRequest): CrRow {
  const costCents =
    cr.estimatedCostCents !== null ? cr.estimatedCostCents :
    cr.estimatedHours    !== null ? cr.estimatedHours * HOURLY_RATE_ZAR * 100 : 0;
  const cost = costCents / 100;
  const risk: CrRow["risk"] = cost > 50_000 ? "red" : cost > 20_000 ? "amber" : "green";
  return { id: cr.id, label: cr.title, cost, icon: "zap", risk };
}

// ── Monthly spend computer — derives from portal invoices ─────────────────
type MonthRow = { month: string; actual: number; status: "done" | "current" | "forecast" };
const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

function computeMonthlySpend(invoices: PortalInvoice[]): MonthRow[] {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const byMonth = new Map<string, number>();
  for (const inv of invoices) {
    const raw = inv.issuedAt ?? inv.createdAt;
    if (!raw) continue;
    const d = new Date(raw);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + inv.amountCents / 100);
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, actual]) => {
      const [yr, mo] = key.split("-");
      const label = `${MONTH_ABBR[parseInt(mo, 10) - 1]} ${yr}`;
      const status: MonthRow["status"] = key > currentKey ? "forecast" : key === currentKey ? "current" : "done";
      return { month: label, actual, status };
    });
}

// ── Props ─────────────────────────────────────────────────────────────────
export interface BudgetTrackerPageProps {
  invoices?: PortalInvoice[]
  currency?: string
}

export function BudgetTrackerPage({ invoices = [], currency = "ZAR" }: BudgetTrackerPageProps) {
  const { session, projectId } = useProjectLayer();
  const [loading, setLoading]           = useState(true);
  const [error,   setError]             = useState<string | null>(null);
  const [phaseRows, setPhaseRows]       = useState<BudgetPhaseRow[]>([]);
  const [pendingCRs, setPendingCRs]     = useState<CrRow[]>([]);
  const [activeCRs, setActiveCRs]       = useState<Set<string>>(new Set());
  const [weeklySpend, setWeeklySpend]   = useState<PortalWeeklySpendWeek[]>([]);
  const [weeklyBudgetCap, setWeeklyBudgetCap] = useState(0); // ZAR
  const [todayWeekLabel, setTodayWeekLabel]   = useState("");

  const fmt = (v: number) => formatMoneyCents(Math.round(v) * 100, { currency: "ZAR", maximumFractionDigits: 0 });
  const fmtk = (v: number) => formatMoneyCents(Math.round(v) * 100, { currency: "ZAR", maximumFractionDigits: 0 });

  useEffect(() => {
    if (!session || !projectId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    Promise.all([
      loadPortalPhasesWithRefresh(session, projectId),
      loadPortalChangeRequestsWithRefresh(session, { projectId, status: "ESTIMATED" }),
      loadPortalWeeklySpendWithRefresh(session, projectId),
    ]).then(([phaseR, crR, weeklyR]) => {
      if (phaseR.nextSession) saveSession(phaseR.nextSession);
      if (crR.nextSession) saveSession(crR.nextSession);
      if (weeklyR.nextSession) saveSession(weeklyR.nextSession);
      if (phaseR.error) { setError(phaseR.error.message ?? "Failed to load."); return; }
      if (phaseR.data) setPhaseRows(phaseR.data.map(apiToPhaseRow));
      if (crR.data) setPendingCRs(crR.data.map(crToRow));
      if (weeklyR.data) {
        setWeeklySpend(weeklyR.data.weeks.map((w) => ({
          week: w.week,
          amountCents: w.amountCents,
          forecast: w.forecast,
        })));
        setWeeklyBudgetCap(weeklyR.data.weeklyBudgetCapCents / 100);
        setTodayWeekLabel(weeklyR.data.currentWeekLabel);
      }
    }).finally(() => setLoading(false));
  }, [session, projectId]);

  const toggleCR = (id: string) =>
    setActiveCRs((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── Budget totals derived from API phase data ─────────────────────────────
  const totalBudget    = useMemo(() => phaseRows.reduce((a, p) => a + p.budget, 0), [phaseRows]);
  const spentToDate    = useMemo(() => phaseRows.reduce((a, p) => a + p.spent,  0), [phaseRows]);
  const baseForecast      = totalBudget;
  const forecastRemaining = baseForecast - spentToDate;
  const headroom          = 0; // no headroom buffer (forecast == budget)

  // ── Monthly burn from real invoice data ───────────────────────────────────
  const monthlySpend   = useMemo(() => computeMonthlySpend(invoices), [invoices]);
  const monthlyBudget  = useMemo(
    () => totalBudget > 0 && monthlySpend.length > 0 ? Math.round(totalBudget / monthlySpend.length) : totalBudget,
    [totalBudget, monthlySpend]
  );
  const maxMonthly     = useMemo(
    () => monthlySpend.length > 0 ? Math.max(...monthlySpend.map((m) => m.actual), monthlyBudget) : monthlyBudget || 1,
    [monthlySpend, monthlyBudget]
  );

  const crTotal = useMemo(
    () => pendingCRs.filter((c) => activeCRs.has(c.id)).reduce((a, c) => a + c.cost, 0),
    [activeCRs, pendingCRs]
  );
  const adjustedForecast = baseForecast + crTotal;
  const adjustedHeadroom = totalBudget - adjustedForecast;
  const utilizationPct   = totalBudget > 0 ? Math.round((spentToDate       / totalBudget) * 100) : 0;
  const forecastPct      = totalBudget > 0 ? Math.round((forecastRemaining / totalBudget) * 100) : 0;
  const headroomPct      = totalBudget > 0 ? Math.round((headroom          / totalBudget) * 100) : 0;
  const crImpactPct      = totalBudget > 0 ? Math.round((crTotal           / totalBudget) * 100) : 0;
  const isOverBudget     = adjustedForecast > totalBudget;

  // ── Weekly chart derived values ───────────────────────────────────────────
  const weeklySpendZar = useMemo(
    () => weeklySpend.map((w) => ({ week: w.week, spend: w.amountCents / 100, forecast: w.forecast })),
    [weeklySpend]
  );
  const maxWeekSpend = weeklySpendZar.length > 0 ? Math.max(...weeklySpendZar.map((w) => w.spend)) : 0;
  const chartMax     = Math.max(maxWeekSpend, weeklyBudgetCap) * 1.15 || 1;

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
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "flexCenter", "gap6")}>
            <Ic n="download" sz={13} c="var(--muted2)" /> Export
          </button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Total Budget",    value: totalBudget > 0 ? fmt(totalBudget)  : "—", color: "statCardBlue"   },
          { label: "Spent to Date",   value: totalBudget > 0 ? fmt(spentToDate)  : "—", color: "statCardAccent" },
          { label: "Base Forecast",   value: totalBudget > 0 ? fmt(baseForecast) : "—", color: "statCardAmber"  },
          { label: "Budget Headroom", value: totalBudget > 0 ? fmt(headroom)     : "—", color: "statCardGreen"  },
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
            {/* Spent */}
            <div
              title={`Spent: ${fmt(spentToDate)}`}
              className={cx("animBarLime")} style={{ '--pct': `${utilizationPct}%` } as React.CSSProperties}
            />
            {/* Forecast remaining */}
            <div
              title={`Forecast remaining: ${fmt(forecastRemaining)}`}
              className={cx("budgetBarForecast")} style={{ '--pct': `${forecastPct}%` } as React.CSSProperties}
            />
            {/* CR impact */}
            {crImpactPct > 0 && (
              <div
                title={`CR impact: +${fmt(crTotal)}`}
                className={cx("budgetBarCR")} style={{ '--pct': `${crImpactPct}%` } as React.CSSProperties}
              />
            )}
            {/* Headroom */}
            <div
              title={`Headroom: ${fmt(adjustedHeadroom)}`}
              className={cx("flex1")}
            />
          </div>

          {/* Legend row */}
          <div className={cx("budgetLegendRow")}>
            {[
              { color: "var(--lime)",                                              label: "Spent to date",       value: fmt(spentToDate)        },
              { color: "color-mix(in oklab, var(--amber) 55%, transparent)",       label: "Forecast remaining",  value: fmt(forecastRemaining)   },
              ...(crTotal > 0 ? [{ color: "color-mix(in oklab, var(--red) 55%, transparent)", label: "CR impact", value: `+${fmt(crTotal)}` }] : []),
              { color: "var(--s3)",                                                label: isOverBudget ? "OVER BUDGET" : "Headroom", value: isOverBudget ? `-${fmt(-adjustedHeadroom)}` : fmt(adjustedHeadroom) },
            ].map((l) => (
              <div key={l.label} className={cx("flexRow", "flexCenter", "gap7")}>
                <div className={cx("dot10sq", "noShrink", "dynBgColor")} style={{ "--bg-color": l.color } as React.CSSProperties} />
                <span className={cx("text10", "colorMuted")}>{l.label}</span>
                <span className={cx("text10", "fw700", "dynColor")} style={{ "--color": l.label === "OVER BUDGET" ? "var(--red)" : "inherit" } as React.CSSProperties}>{l.value}</span>
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
                    {fmtk(v)}
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
                          {fmtk(w.spend)}
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
            <span className={cx("text10", "colorMuted", "mlAuto")}>Budget vs Spent</span>
          </div>

          {/* Composition bar */}
          <div className={cx("phasedBudgetTrack")}>
            {phaseRows.map((p) => (
              <div key={p.name} className={cx("phasedBudgetSegment", "dynBgColor")} style={{ "--flex": String(p.budget), "--bg-color": p.color } as React.CSSProperties} title={p.name} />
            ))}
          </div>

          <div className={cx("pb4")}>
            {phaseRows.map((p, i) => {
              const spentPct = Math.round((p.spent / p.budget) * 100);
              return (
                <div key={p.name} className={cx("budgetProjectRow", i > 0 && "borderTopDivider")}>
                  <div className={cx("budgetProjectIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${p.color} 12%, var(--s2))` } as React.CSSProperties}>
                    <Ic n={p.icon} sz={13} c={p.color} />
                  </div>
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("budgetProjectMetaRow")}>
                      <span className={cx("text12", "fw600", "truncate")}>{p.name}</span>
                      <div className={cx("budgetProjectBadgePill")}>
                        <span className={cx("text10", "colorMuted")}>{fmt(p.spent)}</span>
                        <span className={cx("text10", "colorMuted")}>/</span>
                        <span className={cx("text10", "fw600")}>{fmt(p.budget)}</span>
                        <span className={cx("budgetStatusPill", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${p.color} 14%, var(--s3))`, "--color": p.color } as React.CSSProperties}>
                          {spentPct}%
                        </span>
                      </div>
                    </div>
                    {/* Dual bar: grey budget track, colored spent fill */}
                    <div className={cx("trackH5")}>
                      <div className={cx("pctFillRInherit", "dynBgColor")} style={{ '--pct': `${spentPct}%`, "--bg-color": p.color } as React.CSSProperties} />
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
            Base forecast <span className={cx("fw700", "colorText")}>{totalBudget > 0 ? fmt(baseForecast) : "—"}</span> — toggle pending CRs to model budget impact.
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
                      +{fmt(cr.cost)}
                    </div>
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
              {/* base forecast fill */}
              <div className={cx("pctFillRInherit", "dynBgColor")} style={{ '--pct': `${totalBudget > 0 ? Math.min((adjustedForecast / totalBudget) * 100, 100) : 0}%`, "--bg-color": isOverBudget ? "var(--red)" : "var(--amber)" } as React.CSSProperties} />
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
              <button type="button" className={cx("btnSm", isOverBudget ? "btnGhost" : "btnAccent", "mlAuto")}>
                Request {activeCRs.size} CR{activeCRs.size !== 1 ? "s" : ""} →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Monthly burn ────────────────────────────────────────────────── */}
      <div className={cx("card", "p0", "overflowHidden")}>
        <div className={cx("cardHd")}>
          <div className={cx("flexRow", "gap8")}>
            <Ic n="calendar" sz={14} c="var(--muted2)" />
            <span className={cx("cardHdTitle")}>Monthly Burn</span>
          </div>
          <span className={cx("text10", "colorMuted", "mlAuto")}>vs {fmt(monthlyBudget)}/mo budget</span>
        </div>

        {monthlySpend.length === 0 && (
          <p className={cx("text11", "colorMuted", "py16_px", "px18_px")}>
            No invoice data yet for this project.
          </p>
        )}
        {monthlySpend.map((m, i) => {
          const barW = Math.round((m.actual / maxMonthly) * 100);
          const budgetW = Math.round((monthlyBudget / maxMonthly) * 100);
          const isOver = m.actual > monthlyBudget && m.status !== "forecast";
          const isCurrent = m.status === "current";
          const isForecast = m.status === "forecast";
          const barColor = isOver ? "var(--red)" : isCurrent ? "var(--lime)" : isForecast ? "color-mix(in oklab, var(--lime) 30%, transparent)" : "var(--lime)";
          const statusColor = isOver ? "var(--red)" : isCurrent ? "var(--lime)" : isForecast ? "var(--muted2)" : "var(--green)";

          return (
            <div key={m.month} className={cx("budgetMonthRow", i > 0 && "borderTopDivider")}>
              {/* Status dot / icon */}
              <div className={cx("budgetMonthIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${statusColor} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${statusColor} 25%, transparent)` } as React.CSSProperties}>
                <Ic n={isOver ? "alert" : isCurrent ? "activity" : isForecast ? "clock" : "check"} sz={13} c={statusColor} />
              </div>

              {/* Month + bar */}
              <div className={cx("flex1", "minW0")}>
                <div className={cx("budgetMonthMetaRow")}>
                  <div className={cx("flexRow", "gap8")}>
                    <span className={cx("fw600", "text12")}>{m.month}</span>
                    {isForecast && <span className={cx("badge", "badgeMuted", "fs9")}>est.</span>}
                    {isCurrent && <span className={cx("badge", "badgeAccent", "fs9")}>current</span>}
                  </div>
                  <div className={cx("flexRow", "flexCenter", "gap8")}>
                    <span className={cx("fw700", "text12", "dynColor")} style={{ "--color": isOver ? "var(--red)" : "inherit" } as React.CSSProperties}>{fmt(m.actual)}</span>
                    <span className={cx("text10", "colorMuted")}>{totalBudget > 0 ? Math.round((m.actual / totalBudget) * 100) : 0}% of budget</span>
                  </div>
                </div>
                {/* Bar track with budget marker */}
                <div className={cx("progressTrackBase")}>
                  {/* Actual/forecast bar */}
                  <div className={cx("absBarFill", "dynBgColor")} style={{ '--pct': `${barW}%`, "--bg-color": barColor } as React.CSSProperties} />
                  {/* Budget cap tick */}
                  <div className={cx("budgetBudgetMarker")} style={{ "--left": `${budgetW}%` } as React.CSSProperties} />
                </div>
              </div>
            </div>
          );
        })}

        {/* Monthly total footer */}
        <div className={cx("p12x18", "borderT", "flexRow", "gap20", "flexWrap")}>
          {[
            { label: "Total actual", value: fmt(monthlySpend.filter(m => m.status !== "forecast").reduce((a, m) => a + m.actual, 0)), color: "var(--lime)" },
            { label: "Total all months", value: fmt(monthlySpend.reduce((a, m) => a + m.actual, 0)), color: "var(--amber)" },
            { label: "Budget envelope", value: totalBudget > 0 ? fmt(totalBudget) : "—", color: "var(--muted2)" },
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
