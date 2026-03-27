"use client";
// ════════════════════════════════════════════════════════
// performance-dashboard-page.tsx — Client Performance KPIs
// Source  : snapshot.invoices + snapshot.projects (passed as props)
// Scope   : CLIENT own-tenant; KPIs derived from billing + project data
// ════════════════════════════════════════════════════════
import { useMemo } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { PortalInvoice, PortalProject } from "../../../../lib/api/portal/types";

// ── Local types ────────────────────────────────────────────────────────────
interface KpiItem {
  label: string; value: string; sub: string; display: string;
  trend: string; positive: boolean; color: string; sparkline: number[];
}

function exportPerformanceCsv(kpis: KpiItem[]): void {
  const header = ["Metric", "Value", "Summary"];
  const rows = kpis.map((kpi) => [kpi.label, kpi.display, kpi.sub]);
  const escape = (value: string) => "\"" + value.replace(/"/g, "\"\"") + "\"";
  const csv = [header, ...rows].map((row) => row.map((cell) => escape(cell)).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "performance-dashboard.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Sparkline subcomponent ─────────────────────────────────────────────────
function Sparkline({ data, height = 28 }: { data: number[]; height?: number }) {
  if (data.length === 0) return null;
  const max = Math.max(...data);
  return (
    <div className={cx("pdSparklineWrap")} style={{ "--spark-h": `${height}px` } as React.CSSProperties}>
      {data.map((v, i) => {
        const pct    = max > 0 ? (v / max) * 100 : 0;
        const isLast = i === data.length - 1;
        return (
          <div
            key={i}
            className={cx("pdSparkBar")}
            style={{
              "--bar-h": `${pct}%`,
              "--bar-opacity": isLast ? 1 : 0.25 + (i / data.length) * 0.55,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

// ── KPI derivation ─────────────────────────────────────────────────────────
function buildKpiData(invoices: PortalInvoice[], projects: PortalProject[]): KpiItem[] {
  if (invoices.length === 0 && projects.length === 0) return [];

  const totalInvoices = invoices.length;
  const paidInvoices  = invoices.filter(i => i.status === "PAID").length;
  const payRate       = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 100;

  const totalCents = invoices.reduce((s, i) => s + i.amountCents, 0);
  const paidCents  = invoices.filter(i => i.status === "PAID").reduce((s, i) => s + i.amountCents, 0);

  const activeProjects   = projects.filter(p => p.status === "ACTIVE" || p.status === "IN_PROGRESS").length;
  const overdueProjects  = projects.filter(p => p.riskLevel === "CRITICAL" || p.riskLevel === "HIGH").length;
  const healthPct        = activeProjects > 0 ? Math.round(((activeProjects - overdueProjects) / activeProjects) * 100) : 100;

  // Build monthly sparklines from invoice issuedAt dates (last 6 months)
  const now = new Date();
  const monthlyPaid: number[] = Array(6).fill(0);
  const monthlyTotal: number[] = Array(6).fill(0);
  invoices.forEach(inv => {
    const d = new Date(inv.issuedAt ?? inv.createdAt);
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (monthsAgo >= 0 && monthsAgo < 6) {
      const idx = 5 - monthsAgo;
      monthlyTotal[idx] += inv.amountCents / 100;
      if (inv.status === "PAID") monthlyPaid[idx] += inv.amountCents / 100;
    }
  });

  const fmt = (cents: number) => `R ${Math.round(cents / 100).toLocaleString("en-ZA")}`;

  return [
    {
      label:    "Payment Rate",
      value:    `${payRate}`,
      sub:      `${paidInvoices}/${totalInvoices} invoices paid`,
      display:  `${payRate}%`,
      trend:    payRate >= 90 ? "↑ Excellent" : payRate >= 70 ? "→ Moderate" : "↓ Review needed",
      positive: payRate >= 70,
      color:    payRate >= 90 ? "statCardGreen" : payRate >= 70 ? "statCardAmber" : "statCardRed",
      sparkline: monthlyPaid.map((v, i) => monthlyTotal[i] > 0 ? Math.round((v / monthlyTotal[i]) * 100) : 100),
    },
    {
      label:    "Total Invoiced",
      value:    fmt(totalCents),
      sub:      `${fmt(paidCents)} paid`,
      display:  fmt(totalCents),
      trend:    `${fmt(paidCents)} received`,
      positive: paidCents >= totalCents * 0.8,
      color:    "statCardBlue",
      sparkline: monthlyTotal,
    },
    {
      label:    "Active Projects",
      value:    `${activeProjects}`,
      sub:      overdueProjects > 0 ? `${overdueProjects} high-risk` : "All on track",
      display:  `${activeProjects}`,
      trend:    overdueProjects > 0 ? `${overdueProjects} need attention` : "Running smoothly",
      positive: overdueProjects === 0,
      color:    overdueProjects > 0 ? "statCardAmber" : "statCardGreen",
      sparkline: [activeProjects, activeProjects, activeProjects, activeProjects, activeProjects, activeProjects],
    },
    {
      label:    "Project Health",
      value:    `${healthPct}`,
      sub:      `${overdueProjects} high-risk projects`,
      display:  `${healthPct}%`,
      trend:    healthPct >= 80 ? "↑ Strong" : healthPct >= 60 ? "→ Moderate" : "↓ Needs review",
      positive: healthPct >= 70,
      color:    healthPct >= 80 ? "statCardAccent" : "statCardAmber",
      sparkline: [healthPct, healthPct, healthPct, healthPct, healthPct, healthPct],
    },
  ];
}

// ── Component ──────────────────────────────────────────────────────────────
export function PerformanceDashboardPage({
  invoices,
  projects,
}: {
  invoices: PortalInvoice[];
  projects: PortalProject[];
}) {
  const KPI_DATA = useMemo(
    () => buildKpiData(invoices, projects),
    [invoices, projects],
  );

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Reporting · Performance</div>
          <h1 className={cx("pageTitle")}>Performance Dashboard</h1>
          <p className={cx("pageSub")}>Core payment and portfolio performance metrics derived from your invoices and active project status.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => exportPerformanceCsv(KPI_DATA)} disabled={KPI_DATA.length === 0}>
            Export CSV
          </button>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => window.print()}>
            Download PDF
          </button>
        </div>
      </div>

      {/* ── KPI tiles with sparklines ─────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb20")}>
        {KPI_DATA.length === 0 ? (
          <div className={cx("emptyState", "wFull", "gridColSpanAll")}>
            <div className={cx("emptyStateIcon")}><Ic n="trending" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No performance data yet</div>
            <div className={cx("emptyStateSub")}>Performance data will appear here once your project is underway.</div>
          </div>
        ) : KPI_DATA.map(k => (
          <div key={k.label} className={cx("statCard", k.color)}>
            <div className={cx("statLabel")}>{k.label}</div>
            <div className={cx("statValue", "mb4")}>{k.display}</div>
            <div className={cx("text10", "dynColor", "mb8")} style={{ "--color": k.positive ? "var(--lime)" : "var(--red)" } as React.CSSProperties}>{k.trend}</div>
            <Sparkline data={k.sparkline} height={28} />
          </div>
        ))}
      </div>

      <div className={cx("card", "mb16")}>
        <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>What this dashboard covers</span></div>
        <div className={cx("cardBodyPad")}>
          <div className={cx("grid2Cols12Gap")}>
            <div className={cx("cardS1v2", "p14", "flexCol", "gap6")}>
              <div className={cx("text11", "fw600", "colorText")}>Included now</div>
              <div className={cx("text11", "colorMuted", "lineH15")}>
                Payment rate, invoiced value, active-project stability, and portfolio health derived from your current invoices and project statuses.
              </div>
            </div>
            <div className={cx("cardS1v2", "p14", "flexCol", "gap6")}>
              <div className={cx("text11", "fw600", "colorText")}>Not included yet</div>
              <div className={cx("text11", "colorMuted", "lineH15")}>
                Team utilization, milestone-by-milestone delivery timing, and quality scoring are not shown here until those signals are exposed by real client-facing data.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cx("card")}>
        <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Metric Detail</span></div>
        <div className={cx("listGroup")}>
          {KPI_DATA.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="chart" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No performance data yet</div>
              <div className={cx("emptyStateSub")}>Once invoices and projects are active, this panel will summarize the live KPI detail for your account.</div>
            </div>
          ) : KPI_DATA.map((kpi) => (
            <div key={kpi.label} className={cx("listRow")}>
              <div className={cx("flexRow", "gap14", "flexAlignCenter", "flexWrap")}>
                <div className={cx("flex1", "minW160")}>
                  <div className={cx("fw600", "text12", "mb2")}>{kpi.label}</div>
                  <div className={cx("text11", "colorMuted")}>{kpi.sub}</div>
                </div>
                <div className={cx("text12", "fw700", "noShrink")}>{kpi.display}</div>
                <div className={cx("wMin120x60p", "noShrink")}><Sparkline data={kpi.sparkline} height={28} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
