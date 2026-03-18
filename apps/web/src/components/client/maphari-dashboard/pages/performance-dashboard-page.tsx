"use client";
// ════════════════════════════════════════════════════════
// performance-dashboard-page.tsx — Client Performance KPIs
// Source  : snapshot.invoices + snapshot.projects (passed as props)
// Scope   : CLIENT own-tenant; KPIs derived from billing + project data
// ════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { PortalInvoice, PortalProject } from "../../../../lib/api/portal/types";

// ── Local types ────────────────────────────────────────────────────────────
interface KpiItem {
  label: string; value: string; sub: string; display: string;
  trend: string; positive: boolean; color: string; sparkline: number[];
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
  const [missionControl, setMissionControl] = useState(false);

  useEffect(() => {
    if (!missionControl) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMissionControl(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [missionControl]);

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
          <p className={cx("pageSub")}>Key performance indicators, team delivery metrics, and quality benchmarks across your project.</p>
        </div>
        <div className={cx("pageActions")}>
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            onClick={() => setMissionControl(true)}
          >
            ⊕ Mission Control
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

      {/* ── Team Performance ─────────────────────────────────────────────── */}
      <div className={cx("card", "mb16")}>
        <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Team Performance</span></div>
        <div className={cx("listGroup")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="users" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No team data yet</div>
            <div className={cx("emptyStateSub")}>Team performance data not yet available.</div>
          </div>
        </div>
      </div>

      {/* ── Milestone Delivery History ───────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Milestone Delivery History</span></div>
        <div className={cx("listGroup")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="flag" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No milestones completed</div>
            <div className={cx("emptyStateSub")}>Delivery history will appear once milestones are completed.</div>
          </div>
        </div>
      </div>

      {/* ── Mission Control Overlay ──────────────────────────────────────── */}
      {missionControl && (
        <div className={cx("fullscreenPanel")}>
          <div className={cx("p14x24", "borderB", "flexBetween", "noShrink")}>
            <div>
              <span className={cx("fw700", "text13")}>Mission Control</span>
              <span className={cx("text11", "colorMuted", "ml12")}>Performance · Live</span>
            </div>
            <div className={cx("flexRow", "gap12")}>
              <span className={cx("pdLiveIndicator")}>
                <span className={cx("dotAccentSm", "inlineBlock")} />
                Live
              </span>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setMissionControl(false)}>✕ Exit</button>
            </div>
          </div>
          <div className={cx("pdMcGrid")}>
            {KPI_DATA.map((k, i) => (
              <div
                key={k.label}
                className={cx("pdMcCell", i % 2 === 0 && "pdMcCellBorderR", i < 2 && "pdMcCellBorderB")}
              >
                <div className={cx("text11", "colorMuted", "ls008", "textUpper")}>{k.label}</div>
                <div className={cx("pdMcValue")}>{k.display}</div>
                <div className={cx("text11", "colorAccent", "opacity70")}>{k.trend}</div>
                <div className={cx("wMin200x60p")}><Sparkline data={k.sparkline} height={48} /></div>
              </div>
            ))}
          </div>
          <div className={cx("p8x24", "borderT", "textCenter")}>
            <span className={cx("text10", "colorMuted")}>Press ESC or click ✕ Exit to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
