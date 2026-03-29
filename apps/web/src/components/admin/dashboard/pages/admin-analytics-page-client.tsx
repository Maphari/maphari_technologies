"use client";

import { useMemo, useState } from "react";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { useCurrencyConverter } from "../../../../lib/i18n/exchange-rates";
import { formatMoneyCents } from "../../../../lib/i18n/currency";
import { styles, cx } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import widgetStyles from "@/app/style/admin/widgets.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DateRange = "3M" | "6M" | "12M" | "All";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMoney(cents: number, currency: string): string {
  return formatMoneyCents(cents, { currency: currency === "AUTO" ? null : currency });
}

function buildMonthlyRevenueSeries(
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"],
  months: number | null,
  convertMoney: (cents: number, currency: string) => number
): { labels: string[]; values: number[] } {
  const now = new Date();
  const labels: string[] = [];
  const values: number[] = [];

  let effectiveMonths = months;
  if (effectiveMonths === null) {
    // "All" — compute from earliest paid invoice
    const paidDates = snapshot.invoices
      .filter((inv) => inv.status === "PAID")
      .map((inv) => new Date(inv.paidAt ?? inv.updatedAt).getTime())
      .filter((t) => !Number.isNaN(t));
    if (paidDates.length === 0) {
      effectiveMonths = 12;
    } else {
      const earliest = Math.min(...paidDates);
      // Fix 5: calendar-accurate month count instead of 30-day approximation
      const earliestDate = new Date(earliest);
      const nowDate = new Date();
      effectiveMonths = Math.max(
        1,
        (nowDate.getFullYear() - earliestDate.getFullYear()) * 12 +
          (nowDate.getMonth() - earliestDate.getMonth()) + 1,
      );
    }
  }

  for (let i = effectiveMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString("default", { month: "short" }));
    const start = d.getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    const total = snapshot.invoices
      .filter((inv) => inv.status === "PAID")
      .filter((inv) => {
        const at = new Date(inv.paidAt ?? inv.updatedAt).getTime();
        return !Number.isNaN(at) && at >= start && at < end;
      })
      .reduce((sum, inv) => sum + convertMoney(inv.amountCents, inv.currency), 0);
    values.push(total);
  }
  return { labels, values };
}

function RevenueBars({ id, labels, values }: { id: string; labels: string[]; values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className={styles.analyticsBarsWrap}>
      {labels.map((label, idx) => (
        <div key={`${id}-${label}`} className={styles.analyticsBarCol}>
          <svg className={styles.analyticsBarSvg} viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true">
            <rect
              x="0"
              y={100 - Math.max(4, (values[idx] / max) * 100)}
              width="10"
              height={Math.max(4, (values[idx] / max) * 100)}
              fill="var(--accent)"
              opacity={0.7 + 0.3 * (values[idx] / max)}
            />
          </svg>
          <span className={styles.analyticsBarLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LEAD_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON"] as const;
const LEAD_STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  WON: "Won",
};

const DATE_RANGE_MONTHS: Record<DateRange, number | null> = {
  "3M": 3,
  "6M": 6,
  "12M": 12,
  "All": null,
};

export function AdminAnalyticsPageClient({ currency }: { currency: string }) {
  const { snapshot } = useAdminWorkspaceContext();
  const { convert: convertMoney } = useCurrencyConverter(currency);
  const [dateRange, setDateRange] = useState<DateRange>("12M");

  // Fix 2: wrap YTD revenue computations in useMemo so they don't re-run on every render
  const { revenueYtd, revenuePrevYtd, revenueDeltaPct } = useMemo(() => {
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
    const prevYearStart = new Date(new Date().getFullYear() - 1, 0, 1).getTime();
    const prevYearEnd = yearStart; // same timestamp as yearStart

    const revenueYtd = snapshot.invoices
      .filter((invoice) => invoice.status === "PAID")
      .filter((invoice) => {
        const at = new Date(invoice.paidAt ?? invoice.updatedAt).getTime();
        return !Number.isNaN(at) && at >= yearStart;
      })
      .reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);

    const revenuePrevYtd = snapshot.invoices
      .filter((invoice) => invoice.status === "PAID")
      .filter((invoice) => {
        const at = new Date(invoice.paidAt ?? invoice.updatedAt).getTime();
        return !Number.isNaN(at) && at >= prevYearStart && at < prevYearEnd;
      })
      .reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);

    const revenueDeltaPct = revenuePrevYtd > 0
      ? Math.round(((revenueYtd - revenuePrevYtd) / revenuePrevYtd) * 100)
      : 0;

    return { revenueYtd, revenuePrevYtd, revenueDeltaPct };
  }, [snapshot.invoices, convertMoney]);

  const completedProjects = snapshot.projects.filter((p) => p.status === "COMPLETED");
  const projectsDelivered = completedProjects.length;
  const avgProjectDurationWeeks = completedProjects.length > 0
    ? completedProjects.reduce((sum, project) => {
        const start = project.startAt ? new Date(project.startAt).getTime() : NaN;
        const end = project.completedAt
          ? new Date(project.completedAt).getTime()
          : new Date(project.updatedAt).getTime();
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) return sum;
        return sum + (end - start) / (1000 * 60 * 60 * 24 * 7);
      }, 0) / completedProjects.length
    : 0;

  const won = snapshot.leads.filter((l) => l.status === "WON").length;
  const lost = snapshot.leads.filter((l) => l.status === "LOST").length;
  const closed = won + lost;
  const clientNpsProxy = closed > 0 ? Math.round((won / closed) * 100) : 0;

  // Fix 2: memoize revenueSeries — avoids re-building the series on unrelated renders
  const revenueSeries = useMemo(
    () => buildMonthlyRevenueSeries(snapshot, DATE_RANGE_MONTHS[dateRange], convertMoney),
    [snapshot, dateRange, convertMoney],
  );

  const tierRevenue = useMemo(() => {
    const clientTierById = new Map(snapshot.clients.map((c) => [c.id, c.tier ?? "STARTER"]));
    const sums = { ENTERPRISE: 0, GROWTH: 0, STARTER: 0 };
    snapshot.invoices
      .filter((inv) => inv.status === "PAID")
      .forEach((inv) => {
        const tier = (clientTierById.get(inv.clientId) ?? "STARTER").toUpperCase();
        const converted = convertMoney(inv.amountCents, inv.currency);
        if (tier === "ENTERPRISE") sums.ENTERPRISE += converted;
        else if (tier === "GROWTH") sums.GROWTH += converted;
        else sums.STARTER += converted;
      });
    const total = Math.max(1, sums.ENTERPRISE + sums.GROWTH + sums.STARTER);
    return {
      total,
      enterprise: sums.ENTERPRISE,
      growth: sums.GROWTH,
      starter: sums.STARTER,
      // Rounded percentages — used in the legend text only
      enterprisePct: Math.round((sums.ENTERPRISE / total) * 100),
      growthPct: Math.round((sums.GROWTH / total) * 100),
      starterPct: Math.round((sums.STARTER / total) * 100),
      // Fix 3: raw (unrounded) values for SVG strokeDasharray / strokeDashoffset
      // to prevent visible gaps caused by accumulated rounding errors
      enterpriseRaw: (sums.ENTERPRISE / total) * 100,
      growthRaw: (sums.GROWTH / total) * 100,
      starterRaw: (sums.STARTER / total) * 100,
    };
  }, [convertMoney, snapshot.clients, snapshot.invoices]);

  // ── Section B: Lead funnel ──────────────────────────────────────────────
  const leadFunnel = useMemo(() => {
    const stageCounts = LEAD_STAGES.reduce<Record<string, number>>((acc, s) => {
      acc[s] = snapshot.leads.filter((l) => l.status === s).length;
      return acc;
    }, {});
    const lostCount = snapshot.leads.filter((l) => l.status === "LOST").length;
    const maxCount = Math.max(...Object.values(stageCounts), 1);
    const activeLeadCount = snapshot.leads.filter((l) => l.status !== "LOST").length;
    const winRate = closed > 0 ? Math.round((won / closed) * 100) : 0;
    return { stageCounts, lostCount, maxCount, activeLeadCount, winRate };
  }, [snapshot.leads, won, closed]);

  // ── Section C: Project status breakdown ────────────────────────────────
  const projectBreakdown = useMemo(() => {
    // Fix 1: compute nowMs locally so `now` is not in the dep array
    const nowMs = Date.now();
    let active = 0, completed = 0, onHold = 0, overdue = 0;
    for (const p of snapshot.projects) {
      const st = p.status.toUpperCase();
      if (st === "COMPLETED") {
        completed++;
      } else if (st === "ON_HOLD" || st === "PAUSED" || st === "HOLD") {
        onHold++;
      } else {
        // Active / In Progress — check if overdue
        const due = p.dueAt ? new Date(p.dueAt).getTime() : NaN;
        if (!Number.isNaN(due) && due < nowMs) {
          overdue++;
        } else {
          active++;
        }
      }
    }
    const total = Math.max(1, active + completed + onHold + overdue);
    return {
      total: snapshot.projects.length,
      active,
      completed,
      onHold,
      overdue,
      activePct: Math.round((active / total) * 100),
      completedPct: Math.round((completed / total) * 100),
      onHoldPct: Math.round((onHold / total) * 100),
      overduePct: Math.round((overdue / total) * 100),
    };
  }, [snapshot.projects]);

  // ── Section D: Top clients by revenue ─────────────────────────────────
  const topClients = useMemo(() => {
    const clientNameById = new Map(snapshot.clients.map((c) => [c.id, c.name]));
    const revenueByClient = new Map<string, number>();
    snapshot.invoices
      .filter((inv) => inv.status === "PAID")
      .forEach((inv) => {
        const converted = convertMoney(inv.amountCents, inv.currency);
        revenueByClient.set(inv.clientId, (revenueByClient.get(inv.clientId) ?? 0) + converted);
      });
    const sorted = Array.from(revenueByClient.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    const grandTotal = Math.max(1, Array.from(revenueByClient.values()).reduce((s, v) => s + v, 0));
    // Fix 4: include clientId so we can use it as a stable React key
    return sorted.map(([clientId, rev], i) => ({
      clientId,
      rank: i + 1,
      name: clientNameById.get(clientId) ?? "Unknown",
      revenue: rev,
      sharePct: Math.round((rev / grandTotal) * 100),
    }));
  }, [snapshot.clients, snapshot.invoices, convertMoney]);

  // ── Section E: Invoice health ──────────────────────────────────────────
  const invoiceHealth = useMemo(() => {
    const total = snapshot.invoices.length;
    const paidInvoices = snapshot.invoices.filter((inv) => inv.status === "PAID");
    const collectionRate = total > 0 ? Math.round((paidInvoices.length / total) * 100) : 0;

    const daysToPay = paidInvoices
      .map((inv) => {
        const paid = inv.paidAt ? new Date(inv.paidAt).getTime() : NaN;
        const created = new Date(inv.createdAt).getTime();
        if (Number.isNaN(paid) || Number.isNaN(created) || paid < created) return NaN;
        return (paid - created) / (1000 * 60 * 60 * 24);
      })
      .filter((d) => !Number.isNaN(d));
    const avgDaysToPay = daysToPay.length > 0
      ? Math.round(daysToPay.reduce((s, d) => s + d, 0) / daysToPay.length)
      : 0;

    // Fix 1: compute nowMs locally so `now` is not in the dep array
    const nowMs = Date.now();
    const overdueAmount = snapshot.invoices
      .filter((inv) => inv.status !== "PAID" && inv.status !== "VOID" && inv.status !== "CANCELLED")
      .filter((inv) => {
        const due = inv.dueAt ? new Date(inv.dueAt).getTime() : NaN;
        return !Number.isNaN(due) && due < nowMs;
      })
      .reduce((sum, inv) => sum + convertMoney(inv.amountCents, inv.currency), 0);

    return { collectionRate, avgDaysToPay, overdueAmount };
  }, [snapshot.invoices, convertMoney]);

  // ── Widget data ────────────────────────────────────────────────────────────
  const revenueChartData = revenueSeries.labels.map((label, i) => ({
    label,
    value: Math.round(revenueSeries.values[i] / 100),
  }));

  const leadFunnelStages = LEAD_STAGES.map((stage) => ({
    label: LEAD_STAGE_LABELS[stage],
    count: leadFunnel.stageCounts[stage] ?? 0,
    total: snapshot.leads.length || 1,
    color: stage === "WON" ? "#34d98b" : stage === "QUALIFIED" ? "#8b6fff" : stage === "PROPOSAL" ? "#f5a623" : "#8b6fff",
  }));

  const projectStagesPipeline = [
    { label: "Active", count: projectBreakdown.active, total: projectBreakdown.total || 1, color: "#8b6fff" },
    { label: "Completed", count: projectBreakdown.completed, total: projectBreakdown.total || 1, color: "#34d98b" },
    { label: "On Hold", count: projectBreakdown.onHold, total: projectBreakdown.total || 1, color: "#f5a623" },
    { label: "Overdue", count: projectBreakdown.overdue, total: projectBreakdown.total || 1, color: "#ff5f5f" },
  ];

  const topClientsRows: Record<string, unknown>[] = topClients.map((c) => ({
    rank: `#${c.rank}`,
    client: c.name,
    revenue: formatMoney(c.revenue, currency),
    share: `${c.sharePct}%`,
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / ANALYTICS</div>
          <h1 className={styles.pageTitle}>Performance Overview</h1>
          <div className={styles.pageSub}>Year-to-date metrics across all clients</div>
        </div>
        <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`}>Export Report</button>
      </div>

      <WidgetGrid>
        <StatWidget
          label="Revenue YTD"
          value={formatMoney(revenueYtd, currency)}
          sub={`${revenueDeltaPct >= 0 ? "↑" : "↓"} ${Math.abs(revenueDeltaPct)}% vs last year`}
          subTone={revenueDeltaPct >= 0 ? "up" : "down"}
          tone="green"
        />
        <StatWidget
          label="Projects Delivered"
          value={projectsDelivered}
          sub="Completed projects"
          tone="accent"
        />
        <StatWidget
          label="Avg. Project Duration"
          value={`${avgProjectDurationWeeks.toFixed(1)}w`}
          sub="Completed-project average"
        />
        <StatWidget
          label="Client Win Rate"
          value={`${clientNpsProxy}%`}
          sub="Based on lead outcomes"
          tone={clientNpsProxy >= 60 ? "green" : clientNpsProxy >= 30 ? "amber" : "red"}
        />
      </WidgetGrid>

      <div className={styles.analyticsTabRow}>
        {(["3M", "6M", "12M", "All"] as DateRange[]).map((r) => (
          <button
            key={r}
            type="button"
            className={cx("analyticsTab", dateRange === r && "analyticsTabActive")}
            onClick={() => setDateRange(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <WidgetGrid columns={2}>
        <ChartWidget
          label="Revenue by Month"
          type="bar"
          dataKey="value"
          data={revenueChartData}
          color="#8b6fff"
        />
        <PipelineWidget
          label="Lead Conversion Funnel"
          stages={leadFunnelStages}
        />
      </WidgetGrid>

      <WidgetGrid columns={2}>
        <PipelineWidget
          label="Project Status Breakdown"
          stages={projectStagesPipeline}
        />
        <TableWidget
          label="Top Clients by Revenue"
          columns={[
            { key: "rank", header: "#" },
            { key: "client", header: "Client" },
            { key: "revenue", header: "Revenue" },
            { key: "share", header: "Share" },
          ]}
          rows={topClientsRows}
          emptyMessage="No paid invoices yet"
        />
      </WidgetGrid>

      <WidgetGrid>
        <StatWidget
          label="Collection Rate"
          value={`${invoiceHealth.collectionRate}%`}
          sub="Paid invoices / total"
          tone={invoiceHealth.collectionRate >= 80 ? "green" : "amber"}
        />
        <StatWidget
          label="Avg. Days to Payment"
          value={`${invoiceHealth.avgDaysToPay}d`}
          sub="From issued to paid"
          tone={invoiceHealth.avgDaysToPay <= 14 ? "green" : invoiceHealth.avgDaysToPay <= 30 ? "amber" : "red"}
        />
        <StatWidget
          label="Overdue Amount"
          value={formatMoney(invoiceHealth.overdueAmount, currency)}
          sub="Outstanding past due date"
          tone={invoiceHealth.overdueAmount > 0 ? "red" : "green"}
        />
        <StatWidget
          label="Win Rate"
          value={`${leadFunnel.winRate}%`}
          sub={`${leadFunnel.activeLeadCount} active leads`}
          tone={leadFunnel.winRate >= 50 ? "green" : "amber"}
        />
      </WidgetGrid>

    </div>
  );
}
