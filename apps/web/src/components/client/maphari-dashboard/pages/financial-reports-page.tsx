"use client";
// ════════════════════════════════════════════════════════
// financial-reports-page.tsx — Client Financial Reports
// Service : billing  |  Source : snapshot.invoices (PortalInvoice[])
// Scope   : CLIENT own-tenant invoices, grouped by calendar year
// ════════════════════════════════════════════════════════
import { useState, useMemo } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import type { PortalInvoice } from "@/lib/api/portal/types";

// ── Local types ────────────────────────────────────────────────────────────
type Period = string;
type SummaryRow = {
  invoiced: number;
  paid: number;
  outstanding: number;
  hoursLogged: number;
  avgHourlyRate: string;
  growth: string | null;
};
type InvStatus = "Paid" | "Outstanding" | "Overdue";
type InvRow = { id: string; desc: string; amount: number; status: InvStatus; date: string; catColor: string; av: string };

// ── Display maps ───────────────────────────────────────────────────────────
const STATUS_BADGE:  Record<InvStatus, string> = { Paid: "badgeGreen", Outstanding: "badgeAmber", Overdue: "badgeRed"   };
const STATUS_ICON:   Record<InvStatus, string> = { Paid: "check",      Outstanding: "clock",       Overdue: "alert"      };
const STATUS_COLOR:  Record<InvStatus, string> = { Paid: "var(--green)", Outstanding: "var(--amber)", Overdue: "var(--red)" };

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CHART_H = 120; // px — bar max height

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) => `R ${n.toLocaleString("en-ZA")}`;

function toInvStatus(s: string): InvStatus {
  if (s === "PAID")    return "Paid";
  if (s === "OVERDUE") return "Overdue";
  return "Outstanding";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function pickYear(inv: PortalInvoice): number {
  return new Date(inv.issuedAt ?? inv.createdAt).getFullYear();
}

// ── Derived data computation ───────────────────────────────────────────────
function buildFinancialData(allInvoices: PortalInvoice[]) {
  const yearSet = new Set<number>();
  allInvoices.forEach(inv => yearSet.add(pickYear(inv)));

  const periods: Period[] = Array.from(yearSet)
    .sort((a, b) => b - a) // most recent first
    .map(String);

  const summary:     Record<string, SummaryRow>                                    = {};
  const monthly:     Record<string, { month: string; invoiced: number; paid: number }[]> = {};
  const invoicesMap: Record<string, InvRow[]>                                      = {};

  for (const yr of periods) {
    const filtered = allInvoices.filter(inv => String(pickYear(inv)) === yr);

    const invoiced    = filtered.reduce((s, i) => s + i.amountCents, 0) / 100;
    const paid        = filtered.filter(i => i.status === "PAID").reduce((s, i) => s + i.amountCents, 0) / 100;
    const outstanding = Math.max(0, invoiced - paid);

    summary[yr] = { invoiced, paid, outstanding, hoursLogged: 0, avgHourlyRate: "—", growth: null };

    // ── Monthly bar chart data ─────────────────────────────────────────────
    const monthMap: Record<number, { invoiced: number; paid: number }> = {};
    filtered.forEach(inv => {
      const m = new Date(inv.issuedAt ?? inv.createdAt).getMonth();
      if (!monthMap[m]) monthMap[m] = { invoiced: 0, paid: 0 };
      monthMap[m].invoiced += inv.amountCents / 100;
      if (inv.status === "PAID") monthMap[m].paid += inv.amountCents / 100;
    });
    monthly[yr] = Object.entries(monthMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([m, v]) => ({ month: MONTH_LABELS[Number(m)] ?? m, ...v }));

    // ── Invoice rows ───────────────────────────────────────────────────────
    invoicesMap[yr] = filtered
      .slice()
      .sort((a, b) => new Date(b.issuedAt ?? b.createdAt).getTime() - new Date(a.issuedAt ?? a.createdAt).getTime())
      .map(inv => {
        const st = toInvStatus(inv.status);
        return {
          id:       inv.number,
          desc:     `Invoice ${inv.number}`,
          amount:   inv.amountCents / 100,
          status:   st,
          date:     fmtDate(inv.issuedAt),
          catColor: STATUS_COLOR[st],
          av:       inv.number.slice(-2).toUpperCase(),
        };
      });
  }

  return { periods, summary, monthly, invoicesMap };
}

// ── Component ──────────────────────────────────────────────────────────────
export function FinancialReportsPage({ invoices: allInvoices }: { invoices: PortalInvoice[] }) {

  const { periods, summary, monthly, invoicesMap } = useMemo(
    () => buildFinancialData(allInvoices),
    [allInvoices],
  );

  const [selectedPeriod, setSelectedPeriod] = useState<Period>("");

  // Resolve which period is active; fall back to most recent when state is stale
  const period = periods.includes(selectedPeriod) ? selectedPeriod : (periods[0] ?? "");

  const summaryData    = summary[period]      ?? { invoiced: 0, paid: 0, outstanding: 0, hoursLogged: 0, avgHourlyRate: "—", growth: null };
  const months         = monthly[period]      ?? [];
  const invoices       = invoicesMap[period]  ?? [];

  // ── Derived display values ─────────────────────────────────────────────
  const payRate  = summaryData.invoiced > 0 ? Math.round((summaryData.paid / summaryData.invoiced) * 100) : 100;
  const payColor = payRate >= 90 ? "var(--lime)" : payRate >= 70 ? "var(--amber)" : "var(--red)";
  const payLabel = payRate >= 90 ? "Excellent payment rate" : payRate >= 70 ? "Moderate — outstanding balance" : "Low — review overdue invoices";
  const payIc    = payRate >= 90 ? "check" : "clock";

  const maxVal   = months.length > 0 ? Math.max(...months.flatMap(m => [m.invoiced, m.paid])) : 1;
  const barH     = (v: number) => Math.max(4, Math.round((v / maxVal) * CHART_H));
  const yLabels  = [100, 75, 50, 25].map(p => ({
    pct:   p,
    label: `R ${Math.round((maxVal * p) / 100 / 1000)}k`,
  }));

  const paidInvoices      = invoices.filter(i => i.status === "Paid").length;
  const outstandingAmount = invoices.filter(i => i.status !== "Paid").reduce((s, i) => s + i.amount, 0);

  // ── In-browser export helpers ────────────────────────────────────────────
  const handleExportCsv = () => {
    if (invoices.length === 0) return;
    const header = "Invoice Number,Description,Amount (ZAR),Status,Issue Date";
    const rows = invoices.map(r =>
      `${r.id},"${r.desc}",${r.amount},${r.status},${r.date}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `maphari-financial-report-${period || "all"}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => window.print();

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Reports</div>
          <h1 className={cx("pageTitle")}>Financial Reports</h1>
          <p className={cx("pageSub")}>Quarterly summaries, spend breakdowns, and invoices — all in one place.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={handleExportCsv} disabled={invoices.length === 0}>
            <Ic n="download" sz={13} c="var(--muted)" /> Export CSV
          </button>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={handleExportPdf}>
            <Ic n="file" sz={13} c="var(--bg)" /> Download PDF
          </button>
        </div>
      </div>

      {/* ── Period tabs ──────────────────────────────────────────────────── */}
      {periods.length > 0 && (
        <div className={cx("pillTabs", "mt16")}>
          {periods.map(p => (
            <button
              key={p}
              type="button"
              className={cx("pillTab", period === p && "pillTabActive")}
              onClick={() => setSelectedPeriod(p)}
            >
              {p}
              {summary[p]?.growth && (
                <span className={cx("ml6", "fs9", "fw700", "ls002", "dynColor")} style={{ "--color": period === p ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>
                  {summary[p]?.growth}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Empty state when no invoices at all ──────────────────────────── */}
      {allInvoices.length === 0 && (
        <div className={cx("emptyState", "mt32")}>
          <div className={cx("emptyStateIcon")}><Ic n="chart" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No financial data yet</div>
          <div className={cx("emptyStateSub")}>Financial report data will appear once invoices are issued for your account.</div>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      {periods.length > 0 && (
        <div className={cx("topCardsStack")}>
          {([
            { label: "Total Invoiced", value: fmt(summaryData.invoiced),         color: "statCardBlue"   },
            { label: "Total Paid",     value: fmt(summaryData.paid),             color: "statCardGreen"  },
            { label: "Outstanding",    value: fmt(summaryData.outstanding),      color: "statCardAmber"  },
            { label: "Hours Logged",   value: `${summaryData.hoursLogged} hrs`,  color: "statCardPurple" },
          ] as { label: string; value: string; color: string }[]).map(s => (
            <div key={s.label} className={cx("statCard", s.color)}>
              <div className={cx("statLabel")}>{s.label}</div>
              <div className={cx("statValue")}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Revenue chart ────────────────────────────────────────────────── */}
      {periods.length > 0 && (
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <div className={cx("flexRow", "flexCenter", "gap7")}>
              <Ic n="chart" sz={14} c="var(--lime)" />
              <span className={cx("cardHdTitle")}>Monthly Revenue — {period}</span>
            </div>
            {summaryData.growth && (
              <span className={cx("mlAuto", "frGrowthBadge")}>
                {summaryData.growth} vs prior year
              </span>
            )}
          </div>
          <div className={cx("cardBodyPad")}>
            {months.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="chart" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No monthly data</div>
                <div className={cx("emptyStateSub")}>Monthly revenue data will appear once invoices are issued.</div>
              </div>
            ) : (
              <>
                <div className={cx("flexRow", "gap0")}>

                  {/* Y-axis labels */}
                  <div className={cx("frYAxis")}>
                    {yLabels.map(({ pct, label }) => (
                      <span key={pct} className={cx("frYLabel")}>{label}</span>
                    ))}
                    <span className={cx("frYLabel")}>0</span>
                  </div>

                  {/* Chart area */}
                  <div className={cx("flex1", "relative")}>

                    {/* Horizontal gridlines */}
                    <div className={cx("absInset", "pb28", "pointerNone")}>
                      {yLabels.map(({ pct }) => (
                        <div key={pct} className={cx("frGridLine")} style={{ "--pct": `${pct}` } as React.CSSProperties} />
                      ))}
                      <div className={cx("chartBaselineB2")} />
                    </div>

                    {/* Bar groups */}
                    <div className={cx("frBarArea")}>
                      {months.map(m => (
                        <div key={m.month} className={cx("frMonthCol")}>
                          <div className={cx("frBarPair")}>
                            <div
                              title={`Invoiced: ${fmt(m.invoiced)}`}
                              className={cx("frBarInvoiced")}
                              style={{ "--pct": `${barH(m.invoiced)}px` } as React.CSSProperties}
                            />
                            <div
                              title={`Paid: ${fmt(m.paid)}`}
                              className={cx("frBarPaid")}
                              style={{ "--pct": `${barH(m.paid)}px` } as React.CSSProperties}
                            />
                          </div>
                          {/* Baseline + month label */}
                          <div className={cx("dividerH1")} />
                          <div className={cx("frMonthLabel")}>{m.month}</div>
                          <div className={cx("frMonthAmt")}>{fmt(m.invoiced)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className={cx("frLegendRow")}>
                  {[
                    { color: "var(--blue, #4f9cf9)", label: "Invoiced", opacity: "0.6" },
                    { color: "var(--lime)",           label: "Paid",     opacity: "1"   },
                  ].map(l => (
                    <div key={l.label} className={cx("flexRow", "gap5")}>
                      <div className={cx("dot10sq", "dynBgColor")} style={{ "--bg-color": l.color, "--opacity": l.opacity } as React.CSSProperties} />
                      <span className={cx("text10", "colorMuted")}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Key Metrics ──────────────────────────────────────────────────── */}
      {periods.length > 0 && (
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <div className={cx("flexRow", "flexCenter", "gap7")}>
              <Ic n="chart" sz={14} c="var(--amber)" />
              <span className={cx("cardHdTitle")}>Key Metrics — {period}</span>
            </div>
          </div>
          <div className={cx("cardBodyPad")}>
            {([
              { k: "Total Invoiced",      v: fmt(summaryData.invoiced),        ic: "file",  c: "var(--blue, #4f9cf9)" },
              { k: "Total Paid",          v: fmt(summaryData.paid),            ic: "check", c: "var(--green)"          },
              { k: "Outstanding Balance", v: fmt(summaryData.outstanding),     ic: "clock", c: summaryData.outstanding > 0 ? "var(--amber)" : "var(--muted2)" },
              { k: "Hours Logged",        v: `${summaryData.hoursLogged} hrs`, ic: "clock", c: "var(--purple)"         },
              { k: "Avg Hourly Rate",     v: summaryData.avgHourlyRate,        ic: "zap",   c: "var(--lime)"           },
            ] as { k: string; v: string; ic: string; c: string }[]).map(({ k, v, ic, c }) => (
              <div key={k} className={cx("flexBetween", "py9_0", "borderB")}>
                <div className={cx("flexRow", "flexCenter", "gap7")}>
                  <Ic n={ic} sz={12} c={c} />
                  <span className={cx("text12", "colorMuted")}>{k}</span>
                </div>
                <span className={cx("fw700", "text12", "dynColor")} style={{ "--color": k === "Outstanding Balance" && summaryData.outstanding > 0 ? "var(--amber)" : "inherit" } as React.CSSProperties}>
                  {v}
                </span>
              </div>
            ))}

            {/* Payment rate */}
            <div className={cx("mt16", "pt14", "borderT")}>
              <div className={cx("flexBetween", "mb8")}>
                <span className={cx("text12", "colorMuted")}>Payment Rate</span>
                <span className={cx("fw800", "text14", "dynColor")} style={{ "--color": payColor } as React.CSSProperties}>{payRate}%</span>
              </div>
              <div className={cx("frPayTrack")}>
                <div className={cx("frPayFill", "dynBgColor")} style={{ "--pct": `${payRate}%`, "--bg-color": payColor } as React.CSSProperties} />
              </div>
              <div className={cx("flexRow", "gap5")}>
                <Ic n={payIc} sz={11} c={payColor} />
                <span className={cx("text10", "dynColor")} style={{ "--color": payColor } as React.CSSProperties}>{payLabel}</span>
              </div>
            </div>

            {/* Paid vs Outstanding mini cards */}
            <div className={cx("flexRow", "gap8", "mt14")}>
              <div className={cx("frPaidCard")} style={{ "--flex": Math.max(summaryData.paid, 1) } as React.CSSProperties}>
                <div className={cx("text10", "colorMuted", "mb3")}>Paid</div>
                <div className={cx("fw700", "text11", "colorAccent")}>{fmt(summaryData.paid)}</div>
              </div>
              {summaryData.outstanding > 0 && (
                <div className={cx("frOutstandingCard")} style={{ "--flex": summaryData.outstanding } as React.CSSProperties}>
                  <div className={cx("text10", "colorMuted", "mb3")}>Outstanding</div>
                  <div className={cx("fw700", "text11", "colorAmber")}>{fmt(summaryData.outstanding)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice list ─────────────────────────────────────────────────── */}
      {periods.length > 0 && (
        <div className={cx("card", "p0", "overflowHidden")}>
          <div className={cx("cardHd", "pl18")}>
            <div className={cx("flexRow", "flexCenter", "gap7")}>
              <Ic n="file" sz={13} c="var(--muted)" />
              <span className={cx("cardHdTitle")}>Invoices — {period}</span>
            </div>
            <div className={cx("mlAuto", "flexRow", "flexCenter", "gap10")}>
              {outstandingAmount > 0 && (
                <span className={cx("text10", "fw700", "colorAmber")}>
                  {fmt(outstandingAmount)} outstanding
                </span>
              )}
              <span className={cx("text11", "colorMuted")}>
                {paidInvoices} / {invoices.length} paid
              </span>
            </div>
          </div>

          {invoices.length === 0 && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="file" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No invoice history</div>
              <div className={cx("emptyStateSub")}>Invoice history will appear here once financial records are available.</div>
            </div>
          )}
          {invoices.map((inv, idx) => (
            <div
              key={inv.id}
              className={cx("frInvRow", "dynBorderLeft3", idx > 0 && "borderT")}
              style={{ "--color": STATUS_COLOR[inv.status] } as React.CSSProperties}
            >
              {/* Status icon box */}
              <div
                className={cx("pmIconBox36", "dynBgColor")}
                style={{ "--bg-color": `color-mix(in oklab, ${STATUS_COLOR[inv.status]} 10%, var(--s2))`, "--color": `color-mix(in oklab, ${STATUS_COLOR[inv.status]} 22%, transparent)` } as React.CSSProperties}
              >
                <Ic n={STATUS_ICON[inv.status]} sz={14} c={STATUS_COLOR[inv.status]} />
              </div>

              {/* Invoice info */}
              <div className={cx("flex1", "minW0")}>
                <div className={cx("flexRow", "gap7", "mb3", "flexWrap")}>
                  <span className={cx("badge", "badgeMuted")}>{inv.id}</span>
                  <span className={cx("fw600", "text12", "truncate")}>{inv.desc}</span>
                </div>
                <div className={cx("flexRow", "gap6")}>
                  <Av initials={inv.av} size={16} />
                  <Ic n="calendar" sz={10} c="var(--muted2)" />
                  <span className={cx("text10", "colorMuted")}>{inv.date}</span>
                </div>
              </div>

              {/* Amount + status + action */}
              <div className={cx("flexRow", "flexCenter", "gap10", "noShrink")}>
                <span className={cx("fw700", "text13")}>{fmt(inv.amount)}</span>
                <span className={cx("badge", STATUS_BADGE[inv.status])}>{inv.status}</span>
                <button type="button" className={cx("btnSm", "btnGhost", "py5_px", "px10_px")}>
                  <Ic n="download" sz={12} c="var(--muted)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
