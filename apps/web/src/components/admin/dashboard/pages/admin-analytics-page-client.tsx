"use client";

import { useMemo } from "react";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { useCurrencyConverter } from "../../../../lib/i18n/exchange-rates";
import { formatMoneyCents } from "../../../../lib/i18n/currency";
import { styles } from "../style";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMoney(cents: number, currency: string): string {
  return formatMoneyCents(cents, { currency: currency === "AUTO" ? null : currency });
}

function buildMonthlyRevenueSeries(
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"],
  months: number,
  convertMoney: (cents: number, currency: string) => number
): { labels: string[]; values: number[] } {
  const now = new Date();
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = months - 1; i >= 0; i--) {
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
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
      {labels.map((label, idx) => (
        <div key={`${id}-${label}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", background: "var(--accent)", opacity: 0.7 + 0.3 * (values[idx] / max), height: `${Math.max(4, (values[idx] / max) * 100)}%`, borderRadius: "2px 2px 0 0", minHeight: 4 }} />
          <span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "DM Mono, monospace" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminAnalyticsPageClient({ currency }: { currency: string }) {
  const { snapshot } = useAdminWorkspaceContext();
  const { convert: convertMoney } = useCurrencyConverter(currency);

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
  const prevYearStart = new Date(now.getFullYear() - 1, 0, 1).getTime();
  const prevYearEnd = new Date(now.getFullYear(), 0, 1).getTime();

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

  const revenueSeries = buildMonthlyRevenueSeries(snapshot, 7, convertMoney);

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
      enterprisePct: Math.round((sums.ENTERPRISE / total) * 100),
      growthPct: Math.round((sums.GROWTH / total) * 100),
      starterPct: Math.round((sums.STARTER / total) * 100)
    };
  }, [convertMoney, snapshot.clients, snapshot.invoices]);

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

      <div className={`${styles.statsRow} ${styles.statsRowCols4}`}>
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
          <div className={`${styles.statDelta} ${styles.deltaUp}`}>Closed lead win rate</div>
        </div>
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
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#a78bfa" strokeWidth="3.8"
                strokeDasharray={`${tierRevenue.enterprisePct} ${100 - tierRevenue.enterprisePct}`}
                strokeDashoffset="25" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7b61ff" strokeWidth="3.8"
                strokeDasharray={`${tierRevenue.growthPct} ${100 - tierRevenue.growthPct}`}
                strokeDashoffset={25 - tierRevenue.enterprisePct} />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f5a623" strokeWidth="3.8"
                strokeDasharray={`${tierRevenue.starterPct} ${100 - tierRevenue.starterPct}`}
                strokeDashoffset={25 - tierRevenue.enterprisePct - tierRevenue.growthPct} />
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
    </div>
  );
}
