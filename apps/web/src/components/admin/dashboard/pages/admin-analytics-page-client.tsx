"use client";

import { useMemo, useState } from "react";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { useCurrencyConverter } from "../../../../lib/i18n/exchange-rates";
import { formatMoneyCents } from "../../../../lib/i18n/currency";
import { styles, cx } from "../style";

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

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Admin · Analytics</div>
          <div className={styles.projName}>Performance Overview</div>
          <div className={styles.projMeta}>Year-to-date metrics across all clients</div>
        </div>
        <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`}>Export Report</button>
      </div>

      <div className={styles.topCardsStack}>
        <div className={`${styles.statCard} ${styles.green}`}>
          <div className={styles.statLabel}>Revenue YTD</div>
          <div className={styles.statValue}>{formatMoney(revenueYtd, currency)}</div>
          <div className={`${styles.statDelta} ${revenueDeltaPct >= 0 ? styles.deltaUp : styles.deltaDown}`}>
            {revenueDeltaPct >= 0 ? "↑" : "↓"} {Math.abs(revenueDeltaPct)}% vs last year
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.purple}`}>
          <div className={styles.statLabel}>Projects Delivered</div>
          <div className={styles.statValue}>{projectsDelivered}</div>
          <div className={`${styles.statDelta} ${styles.deltaUp}`}>Completed projects</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Avg. Project Duration</div>
          <div className={styles.statValue}>{avgProjectDurationWeeks.toFixed(1)}w</div>
          <div className={`${styles.statDelta} ${styles.deltaUp}`}>Completed-project average</div>
        </div>
        <div className={`${styles.statCard} ${styles.amber}`}>
          <div className={styles.statLabel}>Client NPS Proxy</div>
          <div className={styles.statValue}>{clientNpsProxy}</div>
          <div className={`${styles.statDelta} ${styles.deltaUp}`}>Based on engagement signals</div>
        </div>
      </div>

      {/* Section A — Date range filter */}
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

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Revenue by Month</span></div>
          <div className={styles.chartWrap}>
            <RevenueBars id="analytics" labels={revenueSeries.labels} values={revenueSeries.values} />
          </div>
        </article>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Revenue by Tier</span></div>
          <div className={`${styles.donutWrap} ${styles.donutWrapLg}`}>
            <svg className={`${styles.donutSvg} ${styles.donutSvgLg}`} viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.8" />
              {/* Fix 3: use raw (unrounded) values for strokeDasharray/strokeDashoffset
                  to prevent visible gaps from accumulated rounding errors.
                  Pct variants are kept only for the legend labels below. */}
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--accent)" strokeWidth="3.8"
                strokeDasharray={`${tierRevenue.enterpriseRaw} ${100 - tierRevenue.enterpriseRaw}`}
                strokeDashoffset="25" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--purple)" strokeWidth="3.8"
                strokeDasharray={`${tierRevenue.growthRaw} ${100 - tierRevenue.growthRaw}`}
                strokeDashoffset={25 - tierRevenue.enterpriseRaw} />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--amber)" strokeWidth="3.8"
                strokeDasharray={`${tierRevenue.starterRaw} ${100 - tierRevenue.starterRaw}`}
                strokeDashoffset={25 - tierRevenue.enterpriseRaw - tierRevenue.growthRaw} />
              <text x="18" y="21" textAnchor="middle" fontSize="4.5" fill="var(--text)" fontFamily="var(--font-syne)">
                {formatMoney(tierRevenue.total, currency)}
              </text>
            </svg>
            <div className={styles.donutLegend}>
              <div className={styles.donutItem}>
                <span className={styles.donutLabel}><span className={`${styles.donutDot} ${styles.dotAccent}`} />Enterprise</span>
                <span className={styles.donutVal}>{formatMoney(tierRevenue.enterprise, currency)} · {tierRevenue.enterprisePct}%</span>
              </div>
              <div className={styles.donutItem}>
                <span className={styles.donutLabel}><span className={`${styles.donutDot} ${styles.dotPurple}`} />Growth</span>
                <span className={styles.donutVal}>{formatMoney(tierRevenue.growth, currency)} · {tierRevenue.growthPct}%</span>
              </div>
              <div className={styles.donutItem}>
                <span className={styles.donutLabel}><span className={`${styles.donutDot} ${styles.dotAmber}`} />Starter</span>
                <span className={styles.donutVal}>{formatMoney(tierRevenue.starter, currency)} · {tierRevenue.starterPct}%</span>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Section B — Lead conversion funnel */}
      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Lead Conversion Funnel</span>
          <div className={styles.analyticsMetaPair}>
            <span className={styles.analyticsMetaItem}>
              Active: <strong>{leadFunnel.activeLeadCount}</strong>
            </span>
            <span className={styles.analyticsMetaItem}>
              Win rate: <strong className={styles.analyticsAccentText}>{leadFunnel.winRate}%</strong>
            </span>
            <span className={styles.analyticsMetaItem}>
              Lost: <strong className={styles.analyticsRedText}>{leadFunnel.lostCount}</strong>
            </span>
          </div>
        </div>
        <div className={styles.analyticsFunnelWrap}>
          {LEAD_STAGES.map((stage) => {
            const count = leadFunnel.stageCounts[stage] ?? 0;
            const pct = Math.round((count / leadFunnel.maxCount) * 100);
            return (
              <div key={stage} className={styles.analyticsFunnelRow}>
                <span className={styles.analyticsFunnelLabel}>{LEAD_STAGE_LABELS[stage]}</span>
                <div className={styles.analyticsFunnelTrack}>
                  <div
                    className={cx("analyticsFunnelFill", stage === "WON" && "analyticsFunnelFillWon")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={styles.analyticsFunnelCount}>{count}</span>
              </div>
            );
          })}
        </div>
      </article>

      {/* Section C — Project status breakdown */}
      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Project Status Breakdown</span>
          <span className={styles.analyticsMetaItem}>{projectBreakdown.total} total</span>
        </div>
        <div className={styles.analyticsStripWrap}>
          <div className={styles.analyticsStrip}>
            {projectBreakdown.activePct > 0 && (
              <div
                className={cx("analyticsStripSeg", "analyticsStripAccent")}
                style={{ width: `${projectBreakdown.activePct}%` }}
                title={`Active: ${projectBreakdown.activePct}%`}
              />
            )}
            {projectBreakdown.completedPct > 0 && (
              <div
                className={cx("analyticsStripSeg", "analyticsStripGreen")}
                style={{ width: `${projectBreakdown.completedPct}%` }}
                title={`Completed: ${projectBreakdown.completedPct}%`}
              />
            )}
            {projectBreakdown.onHoldPct > 0 && (
              <div
                className={cx("analyticsStripSeg", "analyticsStripAmber")}
                style={{ width: `${projectBreakdown.onHoldPct}%` }}
                title={`On Hold: ${projectBreakdown.onHoldPct}%`}
              />
            )}
            {projectBreakdown.overduePct > 0 && (
              <div
                className={cx("analyticsStripSeg", "analyticsStripRed")}
                style={{ width: `${projectBreakdown.overduePct}%` }}
                title={`Overdue: ${projectBreakdown.overduePct}%`}
              />
            )}
          </div>
        </div>
        <div className={styles.analyticsStripLegend}>
          <div className={styles.analyticsStripLegendItem}>
            <span className={cx("analyticsStripDot", "analyticsStripDotAccent")} />
            <span>Active</span>
            <span className={styles.analyticsStripLegendCount}>{projectBreakdown.active} · {projectBreakdown.activePct}%</span>
          </div>
          <div className={styles.analyticsStripLegendItem}>
            <span className={cx("analyticsStripDot", "analyticsStripDotGreen")} />
            <span>Completed</span>
            <span className={styles.analyticsStripLegendCount}>{projectBreakdown.completed} · {projectBreakdown.completedPct}%</span>
          </div>
          <div className={styles.analyticsStripLegendItem}>
            <span className={cx("analyticsStripDot", "analyticsStripDotAmber")} />
            <span>On Hold</span>
            <span className={styles.analyticsStripLegendCount}>{projectBreakdown.onHold} · {projectBreakdown.onHoldPct}%</span>
          </div>
          <div className={styles.analyticsStripLegendItem}>
            <span className={cx("analyticsStripDot", "analyticsStripDotRed")} />
            <span>Overdue</span>
            <span className={styles.analyticsStripLegendCount}>{projectBreakdown.overdue} · {projectBreakdown.overduePct}%</span>
          </div>
        </div>
      </article>

      {/* Section D — Top clients by revenue */}
      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Top Clients by Revenue</span>
          <span className={styles.analyticsMetaItem}>All time · top 5</span>
        </div>
        <div className={styles.analyticsRankList}>
          {topClients.length === 0 && (
            <div className={styles.analyticsEmpty}>No paid invoices yet.</div>
          )}
          {/* Fix 4: key on clientId (stable unique id) instead of rank (positional) */}
          {topClients.map((client) => (
            <div key={client.clientId} className={styles.analyticsRankRow}>
              <span className={styles.analyticsRankNum}>{client.rank}</span>
              <div className={styles.analyticsRankInfo}>
                <span className={styles.analyticsRankName}>{client.name}</span>
                <div className={styles.analyticsRankBarTrack}>
                  <div
                    className={styles.analyticsRankBarFill}
                    style={{ width: `${client.sharePct}%` }}
                  />
                </div>
              </div>
              <div className={styles.analyticsRankMeta}>
                <span className={styles.analyticsRankRev}>{formatMoney(client.revenue, currency)}</span>
                <span className={styles.analyticsRankShare}>{client.sharePct}%</span>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Section E — Invoice health summary */}
      <div className={styles.analyticsHealthGrid}>
        <article className={styles.card}>
          <div className={styles.analyticsHealthLabel}>Collection Rate</div>
          <div className={styles.analyticsHealthValue}>{invoiceHealth.collectionRate}%</div>
          <div className={styles.analyticsHealthSub}>Paid invoices / total</div>
        </article>
        <article className={styles.card}>
          <div className={styles.analyticsHealthLabel}>Avg. Days to Payment</div>
          <div className={styles.analyticsHealthValue}>{invoiceHealth.avgDaysToPay}d</div>
          <div className={styles.analyticsHealthSub}>From issued to paid</div>
        </article>
        <article className={styles.card}>
          <div className={styles.analyticsHealthLabel}>Overdue Amount</div>
          <div className={cx("analyticsHealthValue", invoiceHealth.overdueAmount > 0 && "analyticsHealthValueRed")}>
            {formatMoney(invoiceHealth.overdueAmount, currency)}
          </div>
          <div className={styles.analyticsHealthSub}>Outstanding past due date</div>
        </article>
      </div>
    </div>
  );
}
