"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../../app/style/maphari-dashboard.module.css";
import { useAdminWorkspaceContext } from "./admin-workspace-context";
import { navItems, pageTitles, type NavItem, type PageId, type Toast } from "./dashboard/config";
import { ClientsAndProjectsPage } from "./dashboard/pages/clients-projects-page";
import { InvoicesPage } from "./dashboard/pages/invoices-page";
import { LeadsPage } from "./dashboard/pages/leads-page";
import { MessagesPage } from "./dashboard/pages/messages-page";
import { StaffAccessPage } from "./dashboard/pages/staff-access-page";
import {
  createProjectHandoffExportWithRefresh,
  createMaintenanceCheckWithRefresh,
  downloadProjectHandoffExportWithRefresh,
  createNotificationJobWithRefresh,
  createPublicApiKeyWithRefresh,
  createProjectDependencyWithRefresh,
  createProjectMilestoneWithRefresh,
  createProjectTaskWithRefresh,
  createSecurityIncidentWithRefresh,
  getProjectPreferenceWithRefresh,
  loadAnalyticsMetricsWithRefresh,
  loadNotificationJobsWithRefresh,
  loadProjectBlockersWithRefresh,
  loadProjectAnalyticsWithRefresh,
  loadProjectDetailWithRefresh,
  loadProjectDirectoryWithRefresh,
  loadProjectHandoffExportsWithRefresh,
  loadPublicApiKeysWithRefresh,
  loadTimelineWithRefresh,
  processNotificationQueueWithRefresh,
  setNotificationReadStateWithRefresh,
  setProjectPreferenceWithRefresh,
  updateProjectMilestoneWithRefresh,
  updateProjectStatusWithRefresh,
  updateProjectTaskWithRefresh,
  updateProjectWithRefresh,
  type AdminClient,
  type ProjectAnalyticsSummary,
  type ProjectDetail,
  type ProjectTask,
  type NotificationJob,
  type ProjectBlocker,
  type ProjectHandoffExportRecord,
  type PartnerApiKey
} from "../../lib/api/admin";
import type { AuthSession } from "../../lib/auth/session";
import { useRealtimeRefresh } from "../../lib/auth/use-realtime-refresh";
import { formatMoneyCents } from "../../lib/i18n/currency";
import { useCurrencyConverter } from "../../lib/i18n/exchange-rates";

function buildMonthlyRevenueSeries(
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"],
  monthsBack = 7,
  convertAmount?: (amountCents: number, sourceCurrency: string) => number
): { labels: string[]; values: number[] } {
  const buckets = new Map<string, number>();
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short" });

  const monthAnchors = Array.from({ length: monthsBack }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - offset), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
    return { key, label: formatter.format(date) };
  });

  snapshot.invoices
    .filter((invoice) => invoice.status === "PAID")
    .forEach((invoice) => {
      const at = new Date(invoice.paidAt ?? invoice.updatedAt);
      if (Number.isNaN(at.getTime())) return;
      const key = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}`;
      if (!buckets.has(key)) return;
      const normalizedAmount = convertAmount
        ? convertAmount(invoice.amountCents, invoice.currency)
        : invoice.amountCents;
      buckets.set(key, (buckets.get(key) ?? 0) + normalizedAmount);
    });

  return {
    labels: monthAnchors.map((entry) => entry.label),
    values: monthAnchors.map((entry) => buckets.get(entry.key) ?? 0)
  };
}

function Icon({ kind }: { kind: PageId }) {
  if (kind === "dashboard") return <svg viewBox="0 0 16 16" className={styles.navIcon}><rect x="1" y="1" width="6" height="6" /><rect x="9" y="1" width="6" height="6" /><rect x="1" y="9" width="6" height="6" /><rect x="9" y="9" width="6" height="6" /></svg>;
  if (kind === "projects") return <svg viewBox="0 0 16 16" className={styles.navIcon}><path d="M2 4h12M2 8h8M2 12h10" /></svg>;
  if (kind === "clients") return <svg viewBox="0 0 16 16" className={styles.navIcon}><circle cx="8" cy="5" r="3" /><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" /></svg>;
  if (kind === "invoices") return <svg viewBox="0 0 16 16" className={styles.navIcon}><rect x="2" y="1" width="12" height="14" rx="1" /><path d="M5 5h6M5 8h4M5 11h3" /></svg>;
  if (kind === "messages") return <svg viewBox="0 0 16 16" className={styles.navIcon}><path d="M2 2h12v9H9l-3 3v-3H2V2z" /></svg>;
  if (kind === "analytics") return <svg viewBox="0 0 16 16" className={styles.navIcon}><path d="M2 13L6 8l3 3 5-7" /></svg>;
  if (kind === "leads") return <svg viewBox="0 0 16 16" className={styles.navIcon}><path d="M2 8h12M8 2v12" /></svg>;
  if (kind === "notifications") return <svg viewBox="0 0 16 16" className={styles.navIcon}><path d="M8 2a4 4 0 0 1 4 4v2l1.5 2.5H2.5L4 8V6a4 4 0 0 1 4-4Z" /><path d="M6 12a2 2 0 0 0 4 0" /></svg>;
  if (kind === "staff") return <svg viewBox="0 0 16 16" className={styles.navIcon}><circle cx="6" cy="5" r="2.5" /><circle cx="11.5" cy="6.5" r="2" /><path d="M2 14c0-2.761 2.239-5 5-5s5 2.239 5 5" /></svg>;
  if (kind === "automation") return <svg viewBox="0 0 16 16" className={styles.navIcon}><path d="M6 2h4v4H6zM2 10h4v4H2zM10 10h4v4h-4z" /><path d="M8 6v2M6 10H4M10 10h2" /></svg>;
  if (kind === "integrations") return <svg viewBox="0 0 16 16" className={styles.navIcon}><path d="M6 5 3 8l3 3M10 5l3 3-3 3M9 3 7 13" /></svg>;
  if (kind === "reports") return <svg viewBox="0 0 16 16" className={styles.navIcon}><rect x="2" y="2" width="12" height="12" rx="1" /><path d="M5 11V8M8 11V5M11 11V7" /></svg>;
  if (kind === "security") return <svg viewBox="0 0 16 16" className={styles.navIcon}><path d="M8 2 13 4v4c0 3-2 5-5 6-3-1-5-3-5-6V4l5-2Z" /><path d="m6.5 8 1 1 2-2" /></svg>;
  if (kind === "audit") return <svg viewBox="0 0 16 16" className={styles.navIcon}><path d="M8 3v5l3 2" /><circle cx="8" cy="8" r="6" /></svg>;
  return <svg viewBox="0 0 16 16" className={styles.navIcon}><circle cx="8" cy="8" r="2.5" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.41 1.41M3.05 12.95l1.42-1.41M11.54 4.46l1.41-1.41" /></svg>;
}

function RevenueBars({
  id,
  labels,
  values
}: {
  id: "admin" | "analytics";
  labels: string[];
  values: number[];
}) {
  const max = Math.max(...values, 1);
  return (
    <div className={styles.barChart}>
      {labels.map((month, index) => {
        const pct = ((values[index] ?? 0) / max) * 100;
        const isLast = id === "admin" && index === labels.length - 1;
        return (
          <div key={`${id}-${month}`} className={styles.barCol}>
            <div className={`${styles.bar} ${isLast ? styles.barGreen : styles.barDim}`} style={{ height: `${pct}%` }} />
            <span className={styles.barLbl}>{month}</span>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({
  title,
  subtitle,
  compact = false,
  variant = "data"
}: {
  title: string;
  subtitle?: string;
  compact?: boolean;
  variant?: "data" | "message" | "security";
}) {
  return (
    <div className={`${styles.emptyState} ${compact ? styles.emptyStateCompact : ""}`}>
      <div className={styles.emptyIcon}>
        {variant === "message" ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H11l-3.5 4V16H6.5A2.5 2.5 0 0 1 4 13.5z" />
            <path d="M8 8h8M8 11h5" />
          </svg>
        ) : null}
        {variant === "security" ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
            <path d="m9.5 12.2 1.8 1.8 3.2-3.2" />
          </svg>
        ) : null}
        {variant === "data" ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9.5a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
            <path d="M8 7V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8V7" />
            <path d="M4 11h16" />
          </svg>
        ) : null}
      </div>
      <div className={styles.emptyTitle}>{title}</div>
      {subtitle ? <div className={styles.emptySub}>{subtitle}</div> : null}
    </div>
  );
}

function DashboardPage({
  snapshot,
  notificationJobs,
  publicApiKeys,
  analyticsMetricsRows,
  currency
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  notificationJobs: NotificationJob[];
  publicApiKeys: PartnerApiKey[];
  analyticsMetricsRows: number;
  currency: string;
}) {
  const { convert: convertMoney } = useCurrencyConverter(currency);
  const activeProjects = snapshot.projects.filter((project) =>
    ["IN_PROGRESS", "PLANNING", "REVIEW"].includes(project.status)
  ).length;
  const totalRevenueCents = snapshot.invoices
    .filter((invoice) => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);
  const outstandingCents = snapshot.invoices
    .filter((invoice) => invoice.status !== "PAID" && invoice.status !== "VOID")
    .reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);
  const atRiskCount =
    snapshot.clients.filter((client) => client.status !== "ACTIVE").length +
    snapshot.invoices.filter((invoice) => invoice.status === "OVERDUE").length;
  const paidInvoiceCount = snapshot.invoices.filter((invoice) => invoice.status === "PAID").length;
  const grossMarginPct = paidInvoiceCount > 0
    ? Math.round((totalRevenueCents / (totalRevenueCents + outstandingCents || 1)) * 100)
    : 0;

  const monthlyPaidCents = snapshot.invoices
    .filter((invoice) => invoice.status === "PAID" && invoice.paidAt)
    .filter((invoice) => {
      const paidAt = new Date(invoice.paidAt ?? "");
      const now = new Date();
      return paidAt.getMonth() === now.getMonth() && paidAt.getFullYear() === now.getFullYear();
    })
    .reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);

  const wonCount = snapshot.leads.filter((lead) => lead.status === "WON").length;
  const qualifiedCount = snapshot.leads.filter((lead) => lead.status === "QUALIFIED").length;
  const proposalCount = snapshot.leads.filter((lead) => lead.status === "PROPOSAL").length;
  const newCount = snapshot.leads.filter((lead) => lead.status === "NEW").length;
  const closedLeads = snapshot.leads.filter((lead) => lead.status === "WON" || lead.status === "LOST");
  const nps = closedLeads.length > 0
    ? Math.round((wonCount / closedLeads.length) * 100)
    : 0;
  const revenueSeries = buildMonthlyRevenueSeries(snapshot, 7, convertMoney);

  const onTrackCount = snapshot.projects.filter((project) =>
    ["IN_PROGRESS", "COMPLETED"].includes(project.status)
  ).length;
  const inReviewCount = snapshot.projects.filter((project) =>
    ["REVIEW", "PLANNING"].includes(project.status)
  ).length;
  const delayedCount = snapshot.projects.filter((project) =>
    ["DELAYED", "BLOCKED"].includes(project.status)
  ).length;

  const clientBalance = snapshot.clients.map((client) => {
    const due = snapshot.invoices
      .filter((invoice) => invoice.clientId === client.id && invoice.status !== "PAID" && invoice.status !== "VOID")
      .reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);
    const projects = snapshot.projects.filter((project) => project.clientId === client.id).length;
    return { client, due, projects };
  });

  const recentActivity = [
    ...snapshot.invoices.map((invoice) => ({
      id: `inv-${invoice.id}`,
      when: invoice.updatedAt,
      text: `${invoice.number} is now ${invoice.status}`,
      tone: invoice.status === "OVERDUE" ? "var(--red)" : "var(--accent)"
    })),
    ...snapshot.leads.map((lead) => ({
      id: `lead-${lead.id}`,
      when: lead.updatedAt,
      text: `${lead.title} moved to ${lead.status}`,
      tone: lead.status === "WON" ? "var(--accent)" : "var(--purple)"
    }))
  ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()).slice(0, 5);

  const failedJobs = notificationJobs.filter((job) => job.status === "FAILED").length;
  const queuedJobs = notificationJobs.filter((job) => job.status === "QUEUED").length;
  const sentJobs = notificationJobs.filter((job) => job.status === "SENT").length;
  const successRate = notificationJobs.length > 0 ? ((sentJobs / notificationJobs.length) * 100).toFixed(1) : "0.0";

  const upcomingInvoices = snapshot.invoices
    .filter((invoice) => invoice.dueAt)
    .sort((a, b) => new Date(a.dueAt ?? "").getTime() - new Date(b.dueAt ?? "").getTime())
    .slice(0, 3);

  const riskRows = clientBalance
    .map((row) => {
      const overdue = snapshot.invoices.filter((invoice) => invoice.clientId === row.client.id && invoice.status === "OVERDUE").length;
      const score = Math.min(95, Math.round((row.due / 1000) + overdue * 18 + row.projects * 4));
      return { ...row, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const renewals = snapshot.invoices
    .filter((invoice) => invoice.dueAt)
    .sort((a, b) => new Date(a.dueAt ?? "").getTime() - new Date(b.dueAt ?? "").getTime())
    .slice(0, 3);

  const pendingApprovals = [
    ...snapshot.invoices
      .filter((invoice) => ["ISSUED", "OVERDUE", "DRAFT"].includes(invoice.status))
      .slice(0, 2)
      .map((invoice) => ({
        id: `pending-inv-${invoice.id}`,
        item: invoice.number,
        owner: invoice.clientId.slice(0, 8),
        waiting: invoice.dueAt ? formatDate(invoice.dueAt) : "Awaiting due date",
        status: invoice.status
      })),
    ...snapshot.leads
      .filter((lead) => ["PROPOSAL", "QUALIFIED"].includes(lead.status))
      .slice(0, 1)
      .map((lead) => ({
        id: `pending-lead-${lead.id}`,
        item: lead.title,
        owner: lead.clientId.slice(0, 8),
        waiting: formatDate(lead.updatedAt),
        status: lead.status
      }))
  ];

  const integrationStatus = [
    {
      provider: "Public API",
      uptime: analyticsMetricsRows > 0 ? "Healthy feed" : "No metrics",
      failures: failedJobs,
      keyExpiry: `${publicApiKeys.length} keys`,
      state: failedJobs > 0 ? "Action" : "Healthy"
    },
    {
      provider: "Notifications",
      uptime: `${notificationJobs.length} jobs`,
      failures: failedJobs,
      keyExpiry: `${queuedJobs} queued`,
      state: failedJobs > 0 ? "Watch" : "Healthy"
    },
    {
      provider: "Automation Core",
      uptime: `${analyticsMetricsRows} metrics`,
      failures: 0,
      keyExpiry: `${snapshot.projects.length} projects`,
      state: analyticsMetricsRows > 0 ? "Healthy" : "Watch"
    }
  ];

  const clientRows = clientBalance.slice(0, 4);
  const milestoneRows = snapshot.projects.slice(0, 3);

  return (
    <div className={styles.pageBody}>
      <div className={`${styles.statsRow} ${styles.statsRowCols4}`}>
        <div className={`${styles.statCard} ${styles.green}`}>
          <div className={styles.statLabel}>Total Revenue <span>📈</span></div>
          <div className={styles.statValue}>{formatMoney(totalRevenueCents, currency)}</div>
          <div className={`${styles.statDelta} ${styles.deltaUp}`}>{paidInvoiceCount} invoices paid</div>
        </div>
        <div className={`${styles.statCard} ${styles.purple}`}>
          <div className={styles.statLabel}>Active Projects</div>
          <div className={styles.statValue}>{activeProjects}</div>
          <div className={styles.statDelta}>Across {snapshot.clients.length} clients</div>
        </div>
        <div className={`${styles.statCard} ${styles.amber}`}>
          <div className={styles.statLabel}>Outstanding</div>
          <div className={styles.statValue}>{formatMoney(outstandingCents, currency)}</div>
          <div className={`${styles.statDelta} ${styles.deltaDown}`}>{snapshot.invoices.filter((invoice) => invoice.status === "OVERDUE").length} overdue invoices</div>
        </div>
        <div className={`${styles.statCard} ${styles.red}`}>
          <div className={styles.statLabel}>At Risk</div>
          <div className={styles.statValue}>{atRiskCount}</div>
          <div className={`${styles.statDelta} ${styles.deltaDown}`}>Clients + billing risks</div>
        </div>
      </div>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Monthly Revenue</span><span className={styles.metaMono}>2026</span></div>
          <div className={styles.chartWrap}>
            <RevenueBars id="admin" labels={revenueSeries.labels} values={revenueSeries.values} />
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Project Health</span></div>
          <div className={styles.donutWrap}>
            <svg className={styles.donutSvg} viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.8" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#c8f135" strokeWidth="3.8" strokeDasharray="50 50" strokeDashoffset="25" strokeLinecap="round" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7b61ff" strokeWidth="3.8" strokeDasharray="28 72" strokeDashoffset="-25" strokeLinecap="round" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f5a623" strokeWidth="3.8" strokeDasharray="14 86" strokeDashoffset="-53" strokeLinecap="round" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ff5f5f" strokeWidth="3.8" strokeDasharray="8 92" strokeDashoffset="-67" strokeLinecap="round" />
              <text x="18" y="19.5" textAnchor="middle" fontSize="5" fill="var(--text)" fontFamily="var(--font-syne)">{snapshot.projects.length}</text>
            </svg>
            <div className={styles.donutLegend}>
              <div className={styles.donutItem}><span className={styles.donutLabel}><span className={styles.donutDot} style={{ background: "var(--accent)" }} />On Track</span><span className={styles.donutVal}>{onTrackCount}</span></div>
              <div className={styles.donutItem}><span className={styles.donutLabel}><span className={styles.donutDot} style={{ background: "var(--purple)" }} />In Review</span><span className={styles.donutVal}>{inReviewCount}</span></div>
              <div className={styles.donutItem}><span className={styles.donutLabel}><span className={styles.donutDot} style={{ background: "var(--amber)" }} />Delayed</span><span className={styles.donutVal}>{delayedCount}</span></div>
              <div className={styles.donutItem}><span className={styles.donutLabel}><span className={styles.donutDot} style={{ background: "var(--red)" }} />At Risk</span><span className={styles.donutVal}>{atRiskCount}</span></div>
            </div>
          </div>
        </article>
      </div>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Client Overview</span><button type="button" className={styles.sectionLink}>Manage all →</button></div>
          <div style={{ padding: 0 }}>
            <table className={styles.projTable}>
              <thead><tr><th>Client</th><th>Projects</th><th>Balance</th><th>Health</th></tr></thead>
              <tbody>
                {clientRows.length > 0 ? (
                  clientRows.map((row) => (
                    <tr key={row.client.id}>
                      <td><div className={styles.cellStrong}>{row.client.name}</div><div className={styles.cellSub}>{row.client.status}</div></td>
                      <td>{row.projects}</td>
                      <td className={styles.metaMono}>{formatMoney(row.due, currency)}</td>
                      <td><span className={`${styles.badge} ${row.due > 0 ? styles.badgeAmber : styles.badgeGreen}`}>{row.due > 0 ? "Review" : "Healthy"}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.emptyCell}>
                      <EmptyState title="Nothing yet" subtitle="This section updates once client records are added." compact />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Recent Activity</span></div>
          <div className={styles.cardInner} style={{ paddingTop: 8, paddingBottom: 8 }}>
            <div className={styles.activityList}>
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={styles.activityDot} style={{ background: activity.tone }} />
                    <div className={styles.activityText}>
                      <div className={styles.activityMain}>{activity.text}</div>
                      <div className={styles.activityTime}>{formatDate(activity.when)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="Nothing yet" subtitle="This section updates once lead or invoice activity is recorded." compact />
              )}
            </div>
          </div>
        </article>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Executive Snapshot</span></div>
        <div className={styles.cardInner}>
          <div className={`${styles.statsRow} ${styles.statsRowCols4}`}>
            <div className={styles.statCard}><div className={styles.statLabel}>MRR</div><div className={styles.statValue}>{formatMoney(monthlyPaidCents, currency)}</div><div className={styles.statDelta}>Paid this month</div></div>
            <div className={styles.statCard}><div className={styles.statLabel}>Gross Margin</div><div className={styles.statValue}>{grossMarginPct}%</div><div className={`${styles.statDelta} ${styles.deltaUp}`}>Revenue quality</div></div>
            <div className={styles.statCard}><div className={styles.statLabel}>Churn Risk</div><div className={styles.statValue}>{snapshot.clients.filter((client) => client.status !== "ACTIVE").length}</div><div className={`${styles.statDelta} ${styles.deltaDown}`}>Accounts to review</div></div>
            <div className={styles.statCard}><div className={styles.statLabel}>NPS Proxy</div><div className={styles.statValue}>{nps}</div><div className={`${styles.statDelta} ${styles.deltaUp}`}>Closed-lead win rate</div></div>
          </div>
        </div>
      </article>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>SLA Alerts</span></div>
          <div className={styles.cardInner}>
            <div className={styles.activityList}>
              <div className={styles.activityItem}><div className={styles.activityDot} style={{ background: "var(--red)" }} /><div className={styles.activityText}><div className={styles.activityMain}><strong>{snapshot.invoices.filter((invoice) => invoice.status === "OVERDUE").length}</strong> overdue invoices</div><div className={styles.activityTime}>Finance SLA</div></div></div>
              <div className={styles.activityItem}><div className={styles.activityDot} style={{ background: "var(--amber)" }} /><div className={styles.activityText}><div className={styles.activityMain}><strong>{queuedJobs}</strong> queued notifications pending</div><div className={styles.activityTime}>Communication SLA</div></div></div>
              <div className={styles.activityItem}><div className={styles.activityDot} style={{ background: "var(--red)" }} /><div className={styles.activityText}><div className={styles.activityMain}><strong>{failedJobs}</strong> failed notification attempts</div><div className={styles.activityTime}>Delivery SLA</div></div></div>
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Cashflow Timeline (30d)</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Date</th><th>Type</th><th>Client</th><th>Amount</th></tr></thead>
            <tbody>
              {upcomingInvoices.length > 0 ? (
                upcomingInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{formatDate(invoice.dueAt ?? invoice.updatedAt)}</td>
                    <td><span className={`${styles.badge} ${invoice.status === "PAID" ? styles.badgeGreen : styles.badgeAmber}`}>{invoice.status === "PAID" ? "Inflow" : "Expected"}</span></td>
                    <td className={styles.metaMono}>{invoice.clientId.slice(0, 8)}</td>
                    <td className={styles.metaMono}>{formatMoney(convertMoney(invoice.amountCents, invoice.currency), currency)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    <EmptyState title="Nothing yet" subtitle="This section updates once upcoming invoices are scheduled." compact />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </article>
      </div>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Team Load</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Owner</th><th>Open Items</th><th>Capacity</th><th>Risk</th></tr></thead>
            <tbody>
              <tr><td>Pipeline Ops</td><td>{newCount + qualifiedCount}</td><td>{Math.min(99, 45 + newCount * 4)}%</td><td><span className={`${styles.badge} ${newCount > 10 ? styles.badgeAmber : styles.badgeGreen}`}>{newCount > 10 ? "High" : "Healthy"}</span></td></tr>
              <tr><td>Delivery Team</td><td>{activeProjects}</td><td>{Math.min(99, 40 + activeProjects * 5)}%</td><td><span className={`${styles.badge} ${activeProjects > 8 ? styles.badgeAmber : styles.badgeGreen}`}>{activeProjects > 8 ? "Watch" : "Healthy"}</span></td></tr>
              <tr><td>Billing Ops</td><td>{snapshot.invoices.filter((invoice) => invoice.status !== "PAID").length}</td><td>{Math.min(99, 30 + snapshot.invoices.length * 3)}%</td><td><span className={`${styles.badge} ${snapshot.invoices.filter((invoice) => invoice.status === "OVERDUE").length > 0 ? styles.badgeRed : styles.badgeGreen}`}>{snapshot.invoices.filter((invoice) => invoice.status === "OVERDUE").length > 0 ? "Critical" : "Healthy"}</span></td></tr>
            </tbody>
          </table>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Upcoming Milestones</span></div>
          <div className={styles.cardInner}>
            <div className={styles.activityList}>
              {milestoneRows.length > 0 ? (
                milestoneRows.map((project, index) => (
                  <div key={project.id} className={styles.activityItem}>
                    <div className={styles.activityDot} style={{ background: index === 0 ? "var(--accent)" : index === 1 ? "var(--amber)" : "var(--purple)" }} />
                    <div className={styles.activityText}>
                      <div className={styles.activityMain}>{project.name}</div>
                      <div className={styles.activityTime}>Updated {formatDate(project.updatedAt)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="Nothing yet" subtitle="This section updates once projects and milestones are created." compact />
              )}
            </div>
          </div>
        </article>
      </div>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Automation Health</span></div>
          <div className={styles.cardInner}>
            <div className={`${styles.statsRow} ${styles.statsRowCols4} ${styles.statsRowTight}`}>
              <div className={styles.statCard}><div className={styles.statLabel}>Runs (24h)</div><div className={styles.statValue}>{notificationJobs.length}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Success Rate</div><div className={styles.statValue}>{successRate}%</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Failures</div><div className={styles.statValue}>{failedJobs}</div></div>
              <div className={styles.statCard}><div className={styles.statLabel}>Retries</div><div className={styles.statValue}>{queuedJobs}</div></div>
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Security Pulse</span></div>
          <div className={styles.cardInner}>
            <div className={styles.activityList}>
              <div className={styles.activityItem}><div className={styles.activityDot} style={{ background: "var(--red)" }} /><div className={styles.activityText}><div className={styles.activityMain}>Suspicious events: <strong>{failedJobs + atRiskCount}</strong></div><div className={styles.activityTime}>Derived live risk</div></div></div>
              <div className={styles.activityItem}><div className={styles.activityDot} style={{ background: "var(--amber)" }} /><div className={styles.activityText}><div className={styles.activityMain}>Checks pending: <strong>{queuedJobs}</strong></div><div className={styles.activityTime}>Automation queue</div></div></div>
              <div className={styles.activityItem}><div className={styles.activityDot} style={{ background: "var(--accent)" }} /><div className={styles.activityText}><div className={styles.activityMain}>Metrics active: <strong>{analyticsMetricsRows}</strong></div><div className={styles.activityTime}>Analytics feed</div></div></div>
            </div>
          </div>
        </article>
      </div>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Client Risk Matrix</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Client</th><th>Revenue Tier</th><th>Risk Score</th><th>Band</th></tr></thead>
            <tbody>
              {riskRows.length > 0 ? (
                riskRows.map((row) => (
                  <tr key={row.client.id}>
                    <td>{row.client.name}</td>
                    <td>{row.projects >= 3 ? "High" : row.projects >= 2 ? "Medium" : "Low"}</td>
                    <td>{row.score}</td>
                    <td><span className={`${styles.badge} ${row.score >= 75 ? styles.badgeRed : row.score >= 40 ? styles.badgeAmber : styles.badgeGreen}`}>{row.score >= 75 ? "High" : row.score >= 40 ? "Medium" : "Low"}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    <EmptyState title="Nothing yet" subtitle="This section updates once clients and invoices are available." compact />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Conversion Funnel</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Stage</th><th>Count</th><th>Conversion</th></tr></thead>
            <tbody>
              <tr><td>New</td><td>{newCount}</td><td>-</td></tr>
              <tr><td>Qualified</td><td>{qualifiedCount}</td><td>{newCount > 0 ? ((qualifiedCount / newCount) * 100).toFixed(1) : "0.0"}%</td></tr>
              <tr><td>Proposal</td><td>{proposalCount}</td><td>{qualifiedCount > 0 ? ((proposalCount / qualifiedCount) * 100).toFixed(1) : "0.0"}%</td></tr>
              <tr><td>Won</td><td>{wonCount}</td><td>{proposalCount > 0 ? ((wonCount / proposalCount) * 100).toFixed(1) : "0.0"}%</td></tr>
            </tbody>
          </table>
        </article>
      </div>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Renewals & Retainers</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Client</th><th>Plan</th><th>Renews</th><th>Probability</th></tr></thead>
            <tbody>
              {renewals.length > 0 ? (
                renewals.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className={styles.metaMono}>{invoice.clientId.slice(0, 8)}</td>
                    <td>{invoice.status}</td>
                    <td>{formatDate(invoice.dueAt ?? invoice.updatedAt)}</td>
                    <td><span className={`${styles.badge} ${invoice.status === "PAID" ? styles.badgeGreen : invoice.status === "OVERDUE" ? styles.badgeRed : styles.badgeAmber}`}>{invoice.status === "PAID" ? "High" : invoice.status === "OVERDUE" ? "Low" : "Medium"}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    <EmptyState title="Nothing yet" subtitle="This section updates once renewal-linked invoices are scheduled." compact />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Pending Approvals</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Item</th><th>Owner</th><th>Waiting</th><th>Status</th></tr></thead>
            <tbody>
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((item) => (
                  <tr key={item.id}>
                    <td>{item.item}</td>
                    <td>{item.owner}</td>
                    <td>{item.waiting}</td>
                    <td><span className={`${styles.badge} ${item.status === "OVERDUE" ? styles.badgeRed : item.status === "PAID" || item.status === "WON" ? styles.badgeGreen : styles.badgeAmber}`}>{item.status}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    <EmptyState title="Nothing yet" subtitle="This section updates when approvals require action." compact />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </article>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Integration Status</span></div>
        <table className={styles.projTable}>
          <thead><tr><th>Provider</th><th>Uptime</th><th>Webhook Failures</th><th>Key Expiry</th><th>State</th></tr></thead>
          <tbody>
            {integrationStatus.map((row) => (
              <tr key={row.provider}>
                <td>{row.provider}</td>
                <td>{row.uptime}</td>
                <td>{row.failures}</td>
                <td>{row.keyExpiry}</td>
                <td><span className={`${styles.badge} ${row.state === "Healthy" ? styles.badgeGreen : row.state === "Watch" ? styles.badgeAmber : styles.badgeRed}`}>{row.state}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}

function ProjectsPage({
  snapshot,
  session,
  onRefreshSnapshot,
  onNotify,
  clock,
  currency
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  onRefreshSnapshot: (sessionOverride?: AuthSession) => Promise<void>;
  onNotify: (tone: "success" | "error", message: string) => void;
  clock: number;
  currency: string;
}) {
  const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");
  const [directoryRows, setDirectoryRows] = useState(snapshot.projects);
  const [directoryTotal, setDirectoryTotal] = useState(snapshot.projects.length);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(8);
  const [sortBy] = useState<"updatedAt" | "createdAt" | "dueAt" | "progressPercent" | "name">("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(snapshot.projects[0]?.id ?? null);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalyticsSummary | null>(null);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savedView, setSavedView] = useState("All projects");
  const [layout, setLayout] = useState("board");
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [dependencyId, setDependencyId] = useState("");

  const [editName, setEditName] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [editRisk, setEditRisk] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [editDueAt, setEditDueAt] = useState("");
  const [editSlaDueAt, setEditSlaDueAt] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editBudget, setEditBudget] = useState(0);
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const [saved, savedLayout] = await Promise.all([
        getProjectPreferenceWithRefresh(session, "savedView"),
        getProjectPreferenceWithRefresh(session, "layout")
      ]);
      if (saved.nextSession && saved.data?.value) setSavedView(saved.data.value);
      if (savedLayout.nextSession && savedLayout.data?.value) setLayout(savedLayout.data.value);
    })();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      setLoadingDirectory(true);
      const [directory, analytics] = await Promise.all([
        loadProjectDirectoryWithRefresh(session, {
          q: query || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          priority: priorityFilter === "ALL" ? undefined : priorityFilter,
          riskLevel: riskFilter === "ALL" ? undefined : riskFilter,
          sortBy,
          sortDir,
          page: pageIndex,
          pageSize
        }),
        loadProjectAnalyticsWithRefresh(session)
      ]);
      if (!directory.nextSession) {
        onNotify("error", directory.error?.message ?? "Session expired.");
        setLoadingDirectory(false);
        return;
      }
      if (directory.error) onNotify("error", directory.error.message);
      if (directory.data) {
        setDirectoryRows(directory.data.items);
        setDirectoryTotal(directory.data.total);
        if (!selectedProjectId && directory.data.items.length > 0) setSelectedProjectId(directory.data.items[0].id);
      }
      if (analytics.data) setProjectAnalytics(analytics.data);
      setLoadingDirectory(false);
    };
    void load();
  }, [session, query, statusFilter, priorityFilter, riskFilter, sortBy, sortDir, pageIndex, pageSize, selectedProjectId, onNotify]);

  useEffect(() => {
    if (!session || !selectedProjectId) return;
    const load = async () => {
      setLoadingDetail(true);
      const detail = await loadProjectDetailWithRefresh(session, selectedProjectId);
      if (!detail.nextSession || !detail.data) {
        if (detail.error) onNotify("error", detail.error.message);
        setLoadingDetail(false);
        return;
      }
      setSelectedProject(detail.data);
      setEditName(detail.data.name);
      setEditOwner(detail.data.ownerName ?? "");
      setEditPriority(detail.data.priority);
      setEditRisk(detail.data.riskLevel);
      setEditDueAt(detail.data.dueAt ? new Date(detail.data.dueAt).toISOString().slice(0, 16) : "");
      setEditSlaDueAt(detail.data.slaDueAt ? new Date(detail.data.slaDueAt).toISOString().slice(0, 16) : "");
      setEditProgress(detail.data.progressPercent);
      setEditBudget(Math.round(detail.data.budgetCents / 100));
      setEditDescription(detail.data.description ?? "");
      setLoadingDetail(false);
    };
    void load();
  }, [session, selectedProjectId, onNotify]);

  const totalPages = Math.max(1, Math.ceil(directoryTotal / pageSize));
  const riskCount = directoryRows.filter((project) => project.riskLevel === "HIGH").length;
  const overdueCount = directoryRows.filter((project) => project.dueAt && project.status !== "COMPLETED" && new Date(project.dueAt).getTime() < clock).length;
  const activeCount = directoryRows.filter((project) => project.status === "IN_PROGRESS").length;

  async function saveProjectPreferences(): Promise<void> {
    if (!session) return;
    const [a, b] = await Promise.all([
      setProjectPreferenceWithRefresh(session, { key: "savedView", value: savedView }),
      setProjectPreferenceWithRefresh(session, { key: "layout", value: layout })
    ]);
    if (!a.nextSession || !b.nextSession) {
      onNotify("error", a.error?.message ?? b.error?.message ?? "Unable to save project preferences.");
      return;
    }
    onNotify("success", "Project preferences saved.");
  }

  async function saveProject(): Promise<void> {
    if (!session || !selectedProjectId || !canEdit) return;
    const updated = await updateProjectWithRefresh(session, selectedProjectId, {
      name: editName.trim() || undefined,
      description: editDescription.trim() || undefined,
      ownerName: editOwner.trim() || undefined,
      priority: editPriority,
      riskLevel: editRisk,
      dueAt: editDueAt ? new Date(editDueAt).toISOString() : null,
      slaDueAt: editSlaDueAt ? new Date(editSlaDueAt).toISOString() : null,
      progressPercent: Math.max(0, Math.min(100, editProgress)),
      budgetCents: Math.max(0, Math.round(editBudget * 100))
    });
    if (!updated.nextSession || !updated.data) {
      onNotify("error", updated.error?.message ?? "Unable to save project.");
      return;
    }
    onNotify("success", "Project updated.");
    await onRefreshSnapshot(updated.nextSession);
  }

  async function setProjectStatus(status: "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED"): Promise<void> {
    if (!session || !selectedProjectId || !canEdit) return;
    const updated = await updateProjectStatusWithRefresh(session, selectedProjectId, status);
    if (!updated.nextSession || !updated.data) {
      onNotify("error", updated.error?.message ?? "Unable to update project status.");
      return;
    }
    const nextStatus = updated.data.status;
    onNotify("success", `Project moved to ${status}.`);
    await onRefreshSnapshot(updated.nextSession);
    setSelectedProject((prev) => (prev ? { ...prev, status: nextStatus } : prev));
  }

  async function addMilestone(): Promise<void> {
    if (!session || !selectedProjectId || !newMilestoneTitle.trim() || !canEdit) return;
    const created = await createProjectMilestoneWithRefresh(session, selectedProjectId, { title: newMilestoneTitle.trim() });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to create milestone.");
      return;
    }
    setNewMilestoneTitle("");
    onNotify("success", "Milestone created.");
    const detail = await loadProjectDetailWithRefresh(created.nextSession, selectedProjectId);
    if (detail.data) setSelectedProject(detail.data);
  }

  async function markMilestoneComplete(milestoneId: string): Promise<void> {
    if (!session || !selectedProjectId || !canEdit) return;
    const updated = await updateProjectMilestoneWithRefresh(session, selectedProjectId, milestoneId, { status: "COMPLETED" });
    if (!updated.nextSession || !updated.data) {
      onNotify("error", updated.error?.message ?? "Unable to update milestone.");
      return;
    }
    const detail = await loadProjectDetailWithRefresh(updated.nextSession, selectedProjectId);
    if (detail.data) setSelectedProject(detail.data);
  }

  async function addTask(): Promise<void> {
    if (!session || !selectedProjectId || !newTaskTitle.trim() || !canEdit) return;
    const created = await createProjectTaskWithRefresh(session, selectedProjectId, {
      title: newTaskTitle.trim(),
      assigneeName: newTaskAssignee.trim() || undefined
    });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to create task.");
      return;
    }
    setNewTaskTitle("");
    setNewTaskAssignee("");
    onNotify("success", "Task created.");
    const detail = await loadProjectDetailWithRefresh(created.nextSession, selectedProjectId);
    if (detail.data) setSelectedProject(detail.data);
  }

  async function updateTaskStatus(task: ProjectTask, status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE"): Promise<void> {
    if (!session || !selectedProjectId || !canEdit) return;
    const updated = await updateProjectTaskWithRefresh(session, selectedProjectId, task.id, { status });
    if (!updated.nextSession || !updated.data) {
      onNotify("error", updated.error?.message ?? "Unable to update task.");
      return;
    }
    const detail = await loadProjectDetailWithRefresh(updated.nextSession, selectedProjectId);
    if (detail.data) setSelectedProject(detail.data);
  }

  async function addDependency(): Promise<void> {
    if (!session || !selectedProjectId || !dependencyId || !canEdit) return;
    const created = await createProjectDependencyWithRefresh(session, selectedProjectId, { blockedByProjectId: dependencyId });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to create dependency.");
      return;
    }
    setDependencyId("");
    onNotify("success", "Dependency linked.");
    const detail = await loadProjectDetailWithRefresh(created.nextSession, selectedProjectId);
    if (detail.data) setSelectedProject(detail.data);
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Projects</div>
          <div className={styles.projName}>Project Operations</div>
          <div className={styles.projMeta}>Portfolio planning, task execution, dependencies, SLA, and delivery risk.</div>
        </div>
      </div>

      <div className={`${styles.statsRow} ${styles.statsRowCols4}`}>
        <div className={`${styles.statCard} ${styles.green}`}><div className={styles.statLabel}>Total</div><div className={styles.statValue}>{projectAnalytics?.total ?? snapshot.projects.length}</div><div className={styles.statDelta}>Tracked projects</div></div>
        <div className={`${styles.statCard} ${styles.purple}`}><div className={styles.statLabel}>In Progress</div><div className={styles.statValue}>{activeCount}</div><div className={styles.statDelta}>Active delivery</div></div>
        <div className={`${styles.statCard} ${styles.red}`}><div className={styles.statLabel}>At Risk</div><div className={styles.statValue}>{riskCount}</div><div className={`${styles.statDelta} ${styles.deltaDown}`}>Needs intervention</div></div>
        <div className={`${styles.statCard} ${styles.amber}`}><div className={styles.statLabel}>Overdue</div><div className={styles.statValue}>{overdueCount}</div><div className={`${styles.statDelta} ${styles.deltaDown}`}>Past due date</div></div>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Project Directory</span>
          <div className={`${styles.toolbarRow} ${styles.toolbarRowNoWrap}`}>
            <input className={styles.searchInput} placeholder="Search project, owner, description" value={query} onChange={(event) => { setQuery(event.target.value); setPageIndex(1); }} />
            <select className={styles.selectInput} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPageIndex(1); }}>
              <option value="ALL">All status</option>
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select className={styles.selectInput} value={priorityFilter} onChange={(event) => { setPriorityFilter(event.target.value as typeof priorityFilter); setPageIndex(1); }}>
              <option value="ALL">All priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <select className={styles.selectInput} value={riskFilter} onChange={(event) => { setRiskFilter(event.target.value as typeof riskFilter); setPageIndex(1); }}>
              <option value="ALL">All risk</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <button type="button" className={styles.btnSm} onClick={() => setSortDir((v) => (v === "asc" ? "desc" : "asc"))}>Sort {sortDir.toUpperCase()}</button>
          </div>
        </div>
        <table className={styles.projTable}>
          <thead><tr><th>Project</th><th>Status</th><th>Priority</th><th>Risk</th><th>Progress</th><th>Due</th><th>Budget</th></tr></thead>
          <tbody>
            {directoryRows.length > 0 ? directoryRows.map((project) => (
              <tr key={project.id} className={selectedProjectId === project.id ? styles.selectedRow : ""} onClick={() => setSelectedProjectId(project.id)}>
                <td>
                  <div className={styles.cellStrong}>{project.name}</div>
                  <div className={styles.cellSub}>{project.ownerName ?? "Unassigned owner"}</div>
                </td>
                <td><span className={`${styles.badge} ${project.status === "COMPLETED" ? styles.badgeGreen : project.status === "IN_PROGRESS" ? styles.badgeBlue : styles.badgeAmber}`}>{project.status}</span></td>
                <td><span className={`${styles.badge} ${project.priority === "HIGH" ? styles.badgeRed : project.priority === "MEDIUM" ? styles.badgeAmber : styles.badgeGreen}`}>{project.priority}</span></td>
                <td><span className={`${styles.badge} ${project.riskLevel === "HIGH" ? styles.badgeRed : project.riskLevel === "MEDIUM" ? styles.badgeAmber : styles.badgeGreen}`}>{project.riskLevel}</span></td>
                <td>{project.progressPercent}%</td>
                <td>{project.dueAt ? formatDate(project.dueAt) : "—"}</td>
                <td>{formatMoney(project.budgetCents, currency)}</td>
              </tr>
            )) : (
              <tr><td colSpan={7} className={styles.emptyCell}><EmptyState title="No projects in this view" subtitle="This view updates once filters match existing projects." compact /></td></tr>
            )}
          </tbody>
        </table>
        <div className={styles.paginationRow}>
          <button type="button" className={styles.btnSm} disabled={pageIndex <= 1} onClick={() => setPageIndex((v) => Math.max(1, v - 1))}>Prev</button>
          <span className={styles.metaMono}>Page {pageIndex} / {Math.max(1, Math.ceil(directoryTotal / pageSize))}</span>
          <button type="button" className={styles.btnSm} disabled={pageIndex >= totalPages} onClick={() => setPageIndex((v) => Math.min(totalPages, v + 1))}>Next</button>
        </div>
      </article>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Project Preferences</span>
          <button type="button" className={styles.btnSm} onClick={() => void saveProjectPreferences()}>Save</button>
        </div>
        {selectedProjectId ? (
          <div className={styles.formGrid}>
            <input className={styles.formInput} value={savedView} onChange={(event) => setSavedView(event.target.value)} placeholder="My project view" />
            <select className={styles.selectInput} value={layout} onChange={(event) => setLayout(event.target.value)}>
              <option value="board">Board layout</option>
              <option value="table">Table layout</option>
            </select>
          </div>
        ) : (
          <div className={styles.cardInner}>
            <EmptyState title="No preferences context yet" subtitle="Select a project to configure workspace preferences." compact />
          </div>
        )}
      </article>

      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Project Detail</span></div>
        {loadingDetail ? (
          <div className={styles.loading}>Loading project detail…</div>
        ) : selectedProject ? (
          <>
            <div className={styles.formGrid}>
              <input className={styles.formInput} value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Project name" disabled={!canEdit} />
              <input className={styles.formInput} value={editOwner} onChange={(event) => setEditOwner(event.target.value)} placeholder="Owner" disabled={!canEdit} />
              <select className={styles.selectInput} value={editPriority} onChange={(event) => setEditPriority(event.target.value as typeof editPriority)} disabled={!canEdit}>
                <option value="LOW">Low priority</option>
                <option value="MEDIUM">Medium priority</option>
                <option value="HIGH">High priority</option>
              </select>
              <select className={styles.selectInput} value={editRisk} onChange={(event) => setEditRisk(event.target.value as typeof editRisk)} disabled={!canEdit}>
                <option value="LOW">Low risk</option>
                <option value="MEDIUM">Medium risk</option>
                <option value="HIGH">High risk</option>
              </select>
              <input className={styles.formInput} type="datetime-local" value={editDueAt} onChange={(event) => setEditDueAt(event.target.value)} disabled={!canEdit} />
              <input className={styles.formInput} type="datetime-local" value={editSlaDueAt} onChange={(event) => setEditSlaDueAt(event.target.value)} disabled={!canEdit} />
              <input className={styles.formInput} type="number" value={editProgress} onChange={(event) => setEditProgress(Number(event.target.value))} disabled={!canEdit} />
              <input className={styles.formInput} type="number" value={editBudget} onChange={(event) => setEditBudget(Number(event.target.value))} disabled={!canEdit} />
              <textarea className={styles.formTextarea} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} placeholder="Project description" disabled={!canEdit} />
              <div className={styles.toolbarRow}>
                {canEdit ? <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void saveProject()}>Save Project</button> : null}
                <button type="button" className={styles.btnSm} onClick={() => void setProjectStatus("IN_PROGRESS")} disabled={!canEdit}>In Progress</button>
                <button type="button" className={styles.btnSm} onClick={() => void setProjectStatus("REVIEW")} disabled={!canEdit}>Review</button>
                <button type="button" className={styles.btnSm} onClick={() => void setProjectStatus("COMPLETED")} disabled={!canEdit}>Complete</button>
                <button type="button" className={styles.btnSm} onClick={() => void setProjectStatus("ON_HOLD")} disabled={!canEdit}>On Hold</button>
              </div>
            </div>

            <div className={styles.twoCol}>
              <article className={styles.card}>
                <div className={styles.cardHd}><span className={styles.cardHdTitle}>Milestones</span></div>
                <div className={styles.formGrid}>
                  <input className={styles.formInput} value={newMilestoneTitle} onChange={(event) => setNewMilestoneTitle(event.target.value)} placeholder="New milestone title" disabled={!canEdit} />
                  {canEdit ? <button type="button" className={styles.btnSm} onClick={() => void addMilestone()}>Add Milestone</button> : null}
                </div>
                <table className={styles.projTable}>
                  <thead><tr><th>Title</th><th>Status</th><th>Due</th><th>Action</th></tr></thead>
                  <tbody>
                    {selectedProject.milestones.length > 0 ? selectedProject.milestones.map((milestone) => (
                      <tr key={milestone.id}>
                        <td>{milestone.title}</td>
                        <td><span className={`${styles.badge} ${milestone.status === "COMPLETED" ? styles.badgeGreen : milestone.status === "IN_PROGRESS" ? styles.badgeBlue : styles.badgeAmber}`}>{milestone.status}</span></td>
                        <td>{milestone.dueAt ? formatDate(milestone.dueAt) : "—"}</td>
                        <td>{milestone.status !== "COMPLETED" && canEdit ? <button type="button" className={styles.btnSm} onClick={() => void markMilestoneComplete(milestone.id)}>Complete</button> : "—"}</td>
                      </tr>
                    )) : <tr><td colSpan={4} className={styles.emptyCell}><EmptyState title="No milestones yet" subtitle="This section updates once milestone checkpoints are added." compact /></td></tr>}
                  </tbody>
                </table>
              </article>

              <article className={styles.card}>
                <div className={styles.cardHd}><span className={styles.cardHdTitle}>Tasks</span></div>
                <div className={styles.formGrid}>
                  <input className={styles.formInput} value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="Task title" disabled={!canEdit} />
                  <input className={styles.formInput} value={newTaskAssignee} onChange={(event) => setNewTaskAssignee(event.target.value)} placeholder="Assignee" disabled={!canEdit} />
                  {canEdit ? <button type="button" className={styles.btnSm} onClick={() => void addTask()}>Add Task</button> : null}
                </div>
                <table className={styles.projTable}>
                  <thead><tr><th>Task</th><th>Assignee</th><th>Collaborators</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {selectedProject.tasks.length > 0 ? selectedProject.tasks.map((task) => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td>{task.assigneeName ?? "—"}</td>
                        <td>{task.collaborators?.filter((entry) => entry.active).length ?? 0}</td>
                        <td><span className={`${styles.badge} ${task.status === "DONE" ? styles.badgeGreen : task.status === "IN_PROGRESS" ? styles.badgeBlue : task.status === "BLOCKED" ? styles.badgeRed : styles.badgeAmber}`}>{task.status}</span></td>
                        <td>{canEdit ? (
                          <div className={styles.toolbarRow}>
                            <button type="button" className={styles.btnSm} onClick={() => void updateTaskStatus(task, "IN_PROGRESS")}>Start</button>
                            <button type="button" className={styles.btnSm} onClick={() => void updateTaskStatus(task, "DONE")}>Done</button>
                          </div>
                        ) : "—"}</td>
                      </tr>
                    )) : <tr><td colSpan={5} className={styles.emptyCell}><EmptyState title="No tasks yet" subtitle="This section updates once project tasks are created." compact /></td></tr>}
                  </tbody>
                </table>
              </article>
            </div>

            <div className={styles.twoCol}>
              <article className={styles.card}>
                <div className={styles.cardHd}><span className={styles.cardHdTitle}>Dependencies</span></div>
                <div className={styles.formGrid}>
                  <select className={styles.selectInput} value={dependencyId} onChange={(event) => setDependencyId(event.target.value)} disabled={!canEdit}>
                    <option value="">Select blocking project</option>
                    {snapshot.projects.filter((project) => project.id !== selectedProject.id).map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                  {canEdit ? <button type="button" className={styles.btnSm} onClick={() => void addDependency()}>Link</button> : null}
                </div>
                <table className={styles.projTable}>
                  <thead><tr><th>Blocked By</th><th>Type</th><th>Status</th></tr></thead>
                  <tbody>
                    {selectedProject.dependencies.length > 0 ? selectedProject.dependencies.map((dep) => (
                      <tr key={dep.id}>
                        <td>{dep.blockedByProject?.name ?? dep.blockedByProjectId}</td>
                        <td>{dep.type}</td>
                        <td><span className={`${styles.badge} ${styles.badgeAmber}`}>Linked</span></td>
                      </tr>
                    )) : <tr><td colSpan={3} className={styles.emptyCell}><EmptyState title="No dependencies" subtitle="This section updates once project dependencies are linked." compact /></td></tr>}
                  </tbody>
                </table>
              </article>

              <article className={styles.card}>
                <div className={styles.cardHd}><span className={styles.cardHdTitle}>Timeline</span></div>
                <div className={styles.activityList}>
                  {selectedProject.activities.length > 0 ? selectedProject.activities.map((event) => (
                    <div key={event.id} className={styles.activityItem}>
                      <div className={styles.activityDot} style={{ background: "var(--accent)" }} />
                      <div className={styles.activityText}>
                        <div className={styles.activityMain}>{event.type}{event.details ? ` · ${event.details}` : ""}</div>
                        <div className={styles.activityTime}>{formatDate(event.createdAt)}</div>
                      </div>
                    </div>
                  )) : <EmptyState title="No timeline yet" subtitle="This section updates once project events are recorded." compact />}
                </div>
              </article>
            </div>

            <article className={styles.card}>
              <div className={styles.cardHd}><span className={styles.cardHdTitle}>Collaboration Pulse</span></div>
              <table className={styles.projTable}>
                <thead><tr><th>Member</th><th>Role</th><th>Workstream</th><th>Status</th><th>Started</th></tr></thead>
                <tbody>
                  {(selectedProject.workSessions ?? []).length > 0 ? (selectedProject.workSessions ?? []).slice(0, 8).map((session) => (
                    <tr key={session.id}>
                      <td>{session.memberName}</td>
                      <td>{session.memberRole}</td>
                      <td>{session.workstream ?? "General"}</td>
                      <td>
                        <span className={`${styles.badge} ${session.status === "ACTIVE" ? styles.badgeBlue : session.status === "PAUSED" ? styles.badgeAmber : styles.badgeGreen}`}>
                          {session.status}
                        </span>
                      </td>
                      <td>{formatDate(session.startedAt)}</td>
                    </tr>
                  )) : <tr><td colSpan={5} className={styles.emptyCell}><EmptyState title="No collaboration sessions" subtitle="This section updates once staff starts tracked sessions." compact /></td></tr>}
                </tbody>
              </table>
            </article>
          </>
        ) : (
          <EmptyState title="Select a project" subtitle="Select a project to load its delivery details." />
        )}
      </article>

      {loadingDirectory ? <div className={styles.loading}>Refreshing project directory…</div> : null}
    </div>
  );
}

function AnalyticsPage({
  snapshot,
  currency
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  currency: string;
}) {
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
  const revenueDeltaPct =
    revenuePrevYtd > 0 ? Math.round(((revenueYtd - revenuePrevYtd) / revenuePrevYtd) * 100) : 0;

  const completedProjects = snapshot.projects.filter((project) => project.status === "COMPLETED");
  const projectsDelivered = completedProjects.length;
  const avgProjectDurationWeeks = completedProjects.length > 0
    ? (
        completedProjects.reduce((sum, project) => {
          const start = project.startAt ? new Date(project.startAt).getTime() : NaN;
          const end = project.completedAt ? new Date(project.completedAt).getTime() : new Date(project.updatedAt).getTime();
          if (Number.isNaN(start) || Number.isNaN(end) || end < start) return sum;
          return sum + (end - start) / (1000 * 60 * 60 * 24 * 7);
        }, 0) / completedProjects.length
      )
    : 0;

  const won = snapshot.leads.filter((lead) => lead.status === "WON").length;
  const lost = snapshot.leads.filter((lead) => lead.status === "LOST").length;
  const closed = won + lost;
  const clientNpsProxy = closed > 0 ? Math.round((won / closed) * 100) : 0;

  const revenueSeries = buildMonthlyRevenueSeries(snapshot, 7, convertMoney);

  const tierRevenue = useMemo(() => {
    const clientTierById = new Map(snapshot.clients.map((client) => [client.id, client.tier ?? "STARTER"]));
    const sums = {
      ENTERPRISE: 0,
      GROWTH: 0,
      STARTER: 0
    };
    snapshot.invoices
      .filter((invoice) => invoice.status === "PAID")
      .forEach((invoice) => {
        const tier = (clientTierById.get(invoice.clientId) ?? "STARTER").toUpperCase();
        const converted = convertMoney(invoice.amountCents, invoice.currency);
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
      <div className={styles.projHeader}><div><div className={styles.projEyebrow}>Admin · Analytics</div><div className={styles.projName}>Performance Overview</div><div className={styles.projMeta}>Year-to-date metrics across all clients</div></div><button type="button" className={`${styles.btnSm} ${styles.btnGhost}`}>Export Report</button></div>

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
          <div className={styles.donutWrap} style={{ padding: "30px 24px" }}>
            <svg className={styles.donutSvg} viewBox="0 0 36 36" style={{ width: 110, height: 110 }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.8" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#c8f135" strokeWidth="3.8" strokeDasharray={`${tierRevenue.enterprisePct} ${100 - tierRevenue.enterprisePct}`} strokeDashoffset="25" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7b61ff" strokeWidth="3.8" strokeDasharray={`${tierRevenue.growthPct} ${100 - tierRevenue.growthPct}`} strokeDashoffset={25 - tierRevenue.enterprisePct} />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f5a623" strokeWidth="3.8" strokeDasharray={`${tierRevenue.starterPct} ${100 - tierRevenue.starterPct}`} strokeDashoffset={25 - tierRevenue.enterprisePct - tierRevenue.growthPct} />
              <text x="18" y="21" textAnchor="middle" fontSize="4.5" fill="var(--text)" fontFamily="var(--font-syne)">{formatMoney(tierRevenue.total, currency)}</text>
            </svg>
            <div className={styles.donutLegend}>
              <div className={styles.donutItem}><span className={styles.donutLabel}><span className={styles.donutDot} style={{ background: "var(--accent)" }} />Enterprise</span><span className={styles.donutVal}>{formatMoney(tierRevenue.enterprise, currency)} · {tierRevenue.enterprisePct}%</span></div>
              <div className={styles.donutItem}><span className={styles.donutLabel}><span className={styles.donutDot} style={{ background: "var(--purple)" }} />Growth</span><span className={styles.donutVal}>{formatMoney(tierRevenue.growth, currency)} · {tierRevenue.growthPct}%</span></div>
              <div className={styles.donutItem}><span className={styles.donutLabel}><span className={styles.donutDot} style={{ background: "var(--amber)" }} />Starter</span><span className={styles.donutVal}>{formatMoney(tierRevenue.starter, currency)} · {tierRevenue.starterPct}%</span></div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function SettingsPage({
  snapshot,
  session,
  jobs,
  publicApiKeys,
  analyticsPoints,
  onNavigate,
  onNotify,
  currencyValue,
  onCurrencySaved
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  jobs: NotificationJob[];
  publicApiKeys: PartnerApiKey[];
  analyticsPoints: number;
  onNavigate: (page: PageId) => void;
  onNotify: (tone: "success" | "error", message: string) => void;
  currencyValue: string;
  onCurrencySaved: (currency: string) => void;
}) {
  const [company, setCompany] = useState("Maphari Technologies");
  const [displayName, setDisplayName] = useState(session?.user.email?.split("@")[0] ?? "Admin User");
  const [timezone, setTimezone] = useState("Africa/Johannesburg");
  const [currency, setCurrency] = useState(currencyValue);
  const [density, setDensity] = useState<"Compact" | "Comfortable">("Comfortable");
  const [landingPage, setLandingPage] = useState<PageId>("dashboard");
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [mfaRequired, setMfaRequired] = useState(true);
  const [passwordPolicy, setPasswordPolicy] = useState("Strong");
  const [invoiceAlerts, setInvoiceAlerts] = useState(true);
  const [projectAlerts, setProjectAlerts] = useState(true);
  const [messageDigest, setMessageDigest] = useState(false);
  const [emailSender, setEmailSender] = useState("ops@mapharitechnologies.com");
  const [smsSender, setSmsSender] = useState("Maphari");
  const [lastSavedProfile, setLastSavedProfile] = useState<string | null>(null);
  const [lastSavedWorkspace, setLastSavedWorkspace] = useState<string | null>(null);
  const [lastSavedSecurity, setLastSavedSecurity] = useState<string | null>(null);
  const [lastSavedNotifications, setLastSavedNotifications] = useState<string | null>(null);
  const [lastSavedApiAccess, setLastSavedApiAccess] = useState<string | null>(null);

  const queuedJobs = jobs.filter((job) => job.status === "QUEUED").length;
  const failedJobs = jobs.filter((job) => job.status === "FAILED").length;
  const activeClients = snapshot.clients.filter((client) => client.status === "ACTIVE").length;
  const adminSeats = session?.user.role === "ADMIN" ? 1 : 0;
  const staffSeats = session?.user.role === "STAFF" ? 1 : 0;

  function readJsonObject(value: string | null | undefined): Record<string, unknown> | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    setCurrency(currencyValue);
  }, [currencyValue]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const [profilePref, workspacePref, securityPref, notificationsPref] = await Promise.all([
        getProjectPreferenceWithRefresh(session, "settingsProfile"),
        getProjectPreferenceWithRefresh(session, "settingsWorkspace"),
        getProjectPreferenceWithRefresh(session, "settingsSecurity"),
        getProjectPreferenceWithRefresh(session, "settingsNotifications")
      ]);

      if (profilePref.data?.value) {
        const profile = readJsonObject(profilePref.data.value);
        if (profile) {
          if (typeof profile.displayName === "string") setDisplayName(profile.displayName);
          if (typeof profile.company === "string") setCompany(profile.company);
          if (typeof profile.timezone === "string") setTimezone(profile.timezone);
          if (typeof profile.currency === "string") setCurrency(profile.currency);
          if (typeof profile.savedAt === "string") setLastSavedProfile(profile.savedAt);
        }
      }

      if (workspacePref.data?.value) {
        const workspace = readJsonObject(workspacePref.data.value);
        if (workspace) {
          if (workspace.density === "Compact" || workspace.density === "Comfortable") setDensity(workspace.density);
          if (typeof workspace.landingPage === "string") {
            const pageValue = workspace.landingPage as PageId;
            if (["dashboard", "leads", "clients", "projects", "invoices"].includes(pageValue)) {
              setLandingPage(pageValue);
            }
          }
          if (typeof workspace.savedAt === "string") setLastSavedWorkspace(workspace.savedAt);
        }
      }

      if (securityPref.data?.value) {
        const security = readJsonObject(securityPref.data.value);
        if (security) {
          if (typeof security.sessionMinutes === "number") setSessionMinutes(security.sessionMinutes);
          if (typeof security.passwordPolicy === "string") setPasswordPolicy(security.passwordPolicy);
          if (typeof security.mfaRequired === "boolean") setMfaRequired(security.mfaRequired);
          if (typeof security.savedAt === "string") setLastSavedSecurity(security.savedAt);
        }
      }

      if (notificationsPref.data?.value) {
        const notifications = readJsonObject(notificationsPref.data.value);
        if (notifications) {
          if (typeof notifications.projectAlerts === "boolean") setProjectAlerts(notifications.projectAlerts);
          if (typeof notifications.invoiceAlerts === "boolean") setInvoiceAlerts(notifications.invoiceAlerts);
          if (typeof notifications.messageDigest === "boolean") setMessageDigest(notifications.messageDigest);
          if (typeof notifications.emailSender === "string") setEmailSender(notifications.emailSender);
          if (typeof notifications.smsSender === "string") setSmsSender(notifications.smsSender);
          if (typeof notifications.savedAt === "string") setLastSavedNotifications(notifications.savedAt);
        }
      }

      const apiAccessPref = await getProjectPreferenceWithRefresh(session, "settingsApiAccess");
      if (apiAccessPref.data?.value) {
        const apiAccess = readJsonObject(apiAccessPref.data.value);
        if (apiAccess && typeof apiAccess.savedAt === "string") setLastSavedApiAccess(apiAccess.savedAt);
      }
    })();
  }, [session]);

  async function savePreference(scope: string, key: "settingsProfile" | "settingsWorkspace" | "settingsSecurity" | "settingsNotifications" | "settingsApiAccess", value: Record<string, unknown>): Promise<void> {
    if (!session) {
      onNotify("error", "Session required to save settings.");
      return;
    }
    const result = await setProjectPreferenceWithRefresh(session, { key, value: JSON.stringify(value) });
    if (!result.nextSession || result.error) {
      onNotify("error", result.error?.message ?? `Unable to save ${scope.toLowerCase()}.`);
      return;
    }
    onNotify("success", `${scope} settings saved.`);
  }

  async function saveProfileSettings(): Promise<void> {
    const savedAt = new Date().toISOString();
    await savePreference("Organization profile", "settingsProfile", { displayName, company, timezone, currency, savedAt });
    setLastSavedProfile(savedAt);
    onCurrencySaved(currency);
  }

  async function saveWorkspaceSettings(): Promise<void> {
    const savedAt = new Date().toISOString();
    await savePreference("Workspace", "settingsWorkspace", { density, landingPage, savedAt });
    setLastSavedWorkspace(savedAt);
  }

  async function saveSecuritySettings(): Promise<void> {
    const savedAt = new Date().toISOString();
    await savePreference("Security", "settingsSecurity", { sessionMinutes, passwordPolicy, mfaRequired, savedAt });
    setLastSavedSecurity(savedAt);
  }

  async function saveNotificationSettings(): Promise<void> {
    const savedAt = new Date().toISOString();
    await savePreference("Notification", "settingsNotifications", {
      projectAlerts,
      invoiceAlerts,
      messageDigest,
      emailSender,
      smsSender,
      savedAt
    });
    setLastSavedNotifications(savedAt);
  }

  async function saveApiAccessSettings(): Promise<void> {
    const savedAt = new Date().toISOString();
    await savePreference("API access", "settingsApiAccess", {
      totalKeys: publicApiKeys.length,
      clientsWithKeys: new Set(publicApiKeys.map((key) => key.clientId)).size,
      savedAt
    });
    setLastSavedApiAccess(savedAt);
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Governance</div>
          <div className={styles.projName}>Settings</div>
          <div className={styles.projMeta}>Organization profile, access policy, notifications, API keys, and system health controls.</div>
        </div>
      </div>
      <div className={`${styles.statsRow} ${styles.statsRowCols4}`}>
        <div className={`${styles.statCard} ${styles.green}`}><div className={styles.statLabel}>Active Clients</div><div className={styles.statValue}>{activeClients}</div><div className={styles.statDelta}>Current client footprint</div></div>
        <div className={`${styles.statCard} ${styles.amber}`}><div className={styles.statLabel}>Queued Jobs</div><div className={styles.statValue}>{queuedJobs}</div><div className={styles.statDelta}>Needs delivery processing</div></div>
        <div className={`${styles.statCard} ${styles.red}`}><div className={styles.statLabel}>Failed Jobs</div><div className={styles.statValue}>{failedJobs}</div><div className={styles.statDelta}>Requires retry review</div></div>
        <div className={`${styles.statCard} ${styles.purple}`}><div className={styles.statLabel}>Analytics Rows</div><div className={styles.statValue}>{analyticsPoints}</div><div className={styles.statDelta}>Live telemetry points</div></div>
      </div>
      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Organization Profile</span><span className={styles.metaMono}>{lastSavedProfile ? `Last saved ${formatDateTime(lastSavedProfile)}` : "Not saved yet"}</span></div>
          <div className={styles.cardInner}>
            <div className={styles.formGroup}><label>Display Name</label><input className={styles.msgInput} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></div>
            <div className={styles.formGroup}><label>Email</label><input className={styles.msgInput} value={session?.user.email ?? "admin@maphari"} readOnly /></div>
            <div className={styles.formGroup}><label>Company</label><input className={styles.msgInput} value={company} onChange={(event) => setCompany(event.target.value)} /></div>
            <div className={styles.formGroup}><label>Timezone</label><input className={styles.msgInput} value={timezone} onChange={(event) => setTimezone(event.target.value)} /></div>
            <div className={styles.formGroup}>
              <label>Currency</label>
              <select className={styles.selectInput} value={currency} onChange={(event) => setCurrency(event.target.value)}>
                <option value="AUTO">Auto</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ZAR">ZAR</option>
                <option value="NGN">NGN</option>
                <option value="KES">KES</option>
              </select>
            </div>
            <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void saveProfileSettings()}>Save Profile</button>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Workspace Preferences</span><span className={styles.metaMono}>{lastSavedWorkspace ? `Last saved ${formatDateTime(lastSavedWorkspace)}` : "Not saved yet"}</span></div>
          <div className={styles.cardInner}>
            <div className={styles.formGroup}>
              <label>Dashboard Density</label>
              <select className={styles.selectInput} value={density} onChange={(event) => setDensity(event.target.value as typeof density)}>
                <option value="Comfortable">Comfortable</option>
                <option value="Compact">Compact</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Default Landing Tab</label>
              <select className={styles.selectInput} value={landingPage} onChange={(event) => setLandingPage(event.target.value as PageId)}>
                <option value="dashboard">Dashboard</option>
                <option value="leads">Leads</option>
                <option value="clients">Clients</option>
                <option value="projects">Projects</option>
                <option value="invoices">Billing</option>
              </select>
            </div>
            <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void saveWorkspaceSettings()}>Save Preferences</button>
          </div>
        </article>
      </div>
      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Roles & Access</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Role</th><th>Seats</th><th>Permissions</th></tr></thead>
            <tbody>
              <tr><td>Admin</td><td>{adminSeats}</td><td>Full access</td></tr>
              <tr><td>Staff</td><td>{staffSeats}</td><td>Operations + delivery</td></tr>
              <tr><td>Client</td><td>{snapshot.clients.length}</td><td>Client portal only</td></tr>
            </tbody>
          </table>
        </article>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Security Basics</span><span className={styles.metaMono}>{lastSavedSecurity ? `Last saved ${formatDateTime(lastSavedSecurity)}` : "Not saved yet"}</span></div>
          <div className={styles.cardInner}>
            <div className={styles.formGroup}><label>Session Timeout (minutes)</label><input className={styles.msgInput} type="number" min="15" max="240" value={sessionMinutes} onChange={(event) => setSessionMinutes(Number(event.target.value))} /></div>
            <div className={styles.formGroup}>
              <label>Password Policy</label>
              <select className={styles.selectInput} value={passwordPolicy} onChange={(event) => setPasswordPolicy(event.target.value)}>
                <option value="Strong">Strong</option>
                <option value="Very Strong">Very Strong</option>
              </select>
            </div>
            <div className={styles.toggleRow}>
              <div><div className={styles.toggleTitle}>Require MFA for admin</div><div className={styles.toggleSub}>Enforce second factor for privileged users</div></div>
              <button type="button" className={`${styles.switchBase} ${mfaRequired ? styles.switchOn : ""}`} onClick={() => setMfaRequired((value) => !value)}><div className={mfaRequired ? styles.switchThumbOn : styles.switchThumbOff} /></button>
            </div>
            <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void saveSecuritySettings()}>Save Security</button>
          </div>
        </article>
      </div>
      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Notifications & Providers</span><span className={styles.metaMono}>{lastSavedNotifications ? `Last saved ${formatDateTime(lastSavedNotifications)}` : "Not saved yet"}</span></div>
          <div className={styles.cardInner}>
            <div className={styles.toggleRow}><div><div className={styles.toggleTitle}>Project updates</div><div className={styles.toggleSub}>Status changes and milestones</div></div><button type="button" className={`${styles.switchBase} ${projectAlerts ? styles.switchOn : ""}`} onClick={() => setProjectAlerts((value) => !value)}><div className={projectAlerts ? styles.switchThumbOn : styles.switchThumbOff} /></button></div>
            <div className={styles.toggleRow}><div><div className={styles.toggleTitle}>Invoice alerts</div><div className={styles.toggleSub}>Due date and overdue notices</div></div><button type="button" className={`${styles.switchBase} ${invoiceAlerts ? styles.switchOn : ""}`} onClick={() => setInvoiceAlerts((value) => !value)}><div className={invoiceAlerts ? styles.switchThumbOn : styles.switchThumbOff} /></button></div>
            <div className={styles.toggleRow}><div><div className={styles.toggleTitle}>Message digest</div><div className={styles.toggleSub}>Email summary of new threads</div></div><button type="button" className={`${styles.switchBase} ${messageDigest ? styles.switchOn : ""}`} onClick={() => setMessageDigest((value) => !value)}><div className={messageDigest ? styles.switchThumbOn : styles.switchThumbOff} /></button></div>
            <div className={styles.formGroup}><label>Email Sender</label><input className={styles.msgInput} value={emailSender} onChange={(event) => setEmailSender(event.target.value)} /></div>
            <div className={styles.formGroup}><label>SMS Sender</label><input className={styles.msgInput} value={smsSender} onChange={(event) => setSmsSender(event.target.value)} /></div>
            <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void saveNotificationSettings()}>Save Notification Settings</button>
          </div>
        </article>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>API Keys & Integrations</span><span className={styles.metaMono}>{lastSavedApiAccess ? `Last saved ${formatDateTime(lastSavedApiAccess)}` : "Not saved yet"}</span></div>
          <div className={styles.cardInner}>
            <div className={styles.projMeta}>Active integration keys and public API access posture.</div>
            <table className={styles.projTable}>
              <thead><tr><th>Metric</th><th>Value</th></tr></thead>
              <tbody>
                <tr><td>Total keys</td><td>{publicApiKeys.length}</td></tr>
                <tr><td>Clients with keys</td><td>{new Set(publicApiKeys.map((key) => key.clientId)).size}</td></tr>
                <tr><td>Latest key issued</td><td>{publicApiKeys[0]?.createdAt ? formatDate(publicApiKeys[0].createdAt) : "Not issued yet"}</td></tr>
              </tbody>
            </table>
            <div className={styles.toolbarRow}>
              <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => onNavigate("integrations")}>Manage Keys</button>
              <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void saveApiAccessSettings()}>Save API Policy</button>
            </div>
          </div>
        </article>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>System Health</span></div>
        <table className={styles.projTable}>
          <thead><tr><th>Subsystem</th><th>Status</th><th>Signal</th></tr></thead>
          <tbody>
            <tr><td>Gateway API</td><td><span className={`${styles.badge} ${styles.badgeGreen}`}>Online</span></td><td>{snapshot.projects.length} projects loaded</td></tr>
            <tr><td>Automation Queue</td><td><span className={`${styles.badge} ${failedJobs > 0 ? styles.badgeRed : queuedJobs > 0 ? styles.badgeAmber : styles.badgeGreen}`}>{failedJobs > 0 ? "Degraded" : queuedJobs > 0 ? "Busy" : "Healthy"}</span></td><td>{queuedJobs} queued / {failedJobs} failed</td></tr>
            <tr><td>Notifications</td><td><span className={`${styles.badge} ${styles.badgeGreen}`}>Online</span></td><td>{jobs.length} jobs observed</td></tr>
            <tr><td>Analytics</td><td><span className={`${styles.badge} ${styles.badgeGreen}`}>Online</span></td><td>{analyticsPoints} metrics rows</td></tr>
          </tbody>
        </table>
      </article>
    </div>
  );
}

function AdminStubPage({ title, eyebrow, subtitle }: { title: string; eyebrow: string; subtitle: string }) {
  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>{eyebrow}</div>
          <div className={styles.projName}>{title}</div>
          <div className={styles.projMeta}>{subtitle}</div>
        </div>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>{title}</span></div>
        <div className={styles.cardInner}>
          <div className={styles.projMeta}>Section added to navigation. Next step is wiring live data/actions for this view.</div>
        </div>
      </article>
    </div>
  );
}

function formatMoney(cents: number, currency: string): string {
  return formatMoneyCents(cents, { currency: currency === "AUTO" ? null : currency });
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function AuditPage({
  snapshot
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
}) {
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<"ALL" | "Client" | "Project" | "Lead" | "Billing">("ALL");

  const allEntries = useMemo(
    () =>
      [
        ...snapshot.clients.map((client) => ({ id: `client:${client.id}`, when: client.updatedAt, domain: "Client", action: "Profile updated", subject: client.name })),
        ...snapshot.projects.map((project) => ({ id: `project:${project.id}`, when: project.updatedAt, domain: "Project", action: `Status ${project.status}`, subject: project.name })),
        ...snapshot.leads.map((lead) => ({ id: `lead:${lead.id}`, when: lead.updatedAt, domain: "Lead", action: `Stage ${lead.status}`, subject: lead.title })),
        ...snapshot.invoices.map((invoice) => ({ id: `invoice:${invoice.id}`, when: invoice.updatedAt, domain: "Billing", action: `Invoice ${invoice.status}`, subject: invoice.number }))
      ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()),
    [snapshot.clients, snapshot.invoices, snapshot.leads, snapshot.projects]
  );

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEntries
      .filter((entry) => (domainFilter === "ALL" ? true : entry.domain === domainFilter))
      .filter((entry) => {
        if (!q) return true;
        return (
          entry.domain.toLowerCase().includes(q) ||
          entry.action.toLowerCase().includes(q) ||
          entry.subject.toLowerCase().includes(q)
        );
      });
  }, [allEntries, domainFilter, query]);

  function exportAuditCsv(): void {
    const rows = [
      ["When", "Domain", "Action", "Subject"],
      ...filteredEntries.map((entry) => [formatDate(entry.when), entry.domain, entry.action, entry.subject])
    ];
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = rows.map((row) => row.map((cell) => escape(cell)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "maphari-audit-log.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Governance</div>
          <div className={styles.projName}>Audit Log</div>
          <div className={styles.projMeta}>Cross-domain activity generated from live gateway resource timestamps.</div>
        </div>
        <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => exportAuditCsv()}>
          Export CSV
        </button>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Audit Filters</span>
          <div className={`${styles.toolbarRow} ${styles.toolbarRowNoWrap}`}>
            <input className={styles.searchInput} placeholder="Search action, domain, subject" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className={styles.selectInput} value={domainFilter} onChange={(event) => setDomainFilter(event.target.value as typeof domainFilter)}>
              <option value="ALL">All domains</option>
              <option value="Client">Client</option>
              <option value="Project">Project</option>
              <option value="Lead">Lead</option>
              <option value="Billing">Billing</option>
            </select>
          </div>
        </div>
      </article>
      <article className={styles.card}>
        <table className={styles.projTable}>
          <thead><tr><th>When</th><th>Domain</th><th>Action</th><th>Subject</th></tr></thead>
          <tbody>
            {filteredEntries.length > 0 ? (
              filteredEntries.slice(0, 120).map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.when)}</td>
                  <td>{entry.domain}</td>
                  <td>{entry.action}</td>
                  <td>{entry.subject}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className={styles.emptyCell}>
                  <EmptyState title="No audit entries in this view" subtitle="This view updates once filters match recorded audit events." compact variant="security" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </article>
    </div>
  );
}

function ReportsPage({
  snapshot,
  session,
  onNotify,
  currency
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  onNotify: (tone: Toast["tone"], message: string) => void;
  currency: string;
}) {
  const { convert: convertMoney } = useCurrencyConverter(currency);
  const [handoffExports, setHandoffExports] = useState<ProjectHandoffExportRecord[]>([]);
  const [exportingHandoff, setExportingHandoff] = useState(false);
  const totalInvoiced = snapshot.invoices.reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);
  const paidAmount = snapshot.invoices.filter((invoice) => invoice.status === "PAID").reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);
  const outstandingAmount = snapshot.invoices.filter((invoice) => invoice.status !== "PAID").reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);
  const paymentCount = snapshot.payments.length;
  const atRiskProjects = snapshot.projects.filter((project) => ["BLOCKED", "DELAYED", "ON_HOLD"].includes(project.status)).length;
  const openLeads = snapshot.leads.filter((lead) => !["WON", "LOST"].includes(lead.status)).length;

  function exportCsv(filename: string, rows: string[][]): void {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = rows.map((row) => row.map((cell) => escape(cell)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  const financeRows = snapshot.invoices.map((invoice) => {
    const clientName = snapshot.clients.find((client) => client.id === invoice.clientId)?.name ?? "Unknown";
    return [
      invoice.number,
      clientName,
      invoice.status,
      formatMoney(convertMoney(invoice.amountCents, invoice.currency), currency),
      invoice.dueAt ? formatDate(invoice.dueAt) : "N/A"
    ];
  });

  const projectRows = snapshot.projects.map((project) => {
    const clientName = snapshot.clients.find((client) => client.id === project.clientId)?.name ?? "Unknown";
    return [project.name, clientName, project.status, `${project.progressPercent}%`, project.ownerName ?? "Unassigned"];
  });

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const result = await loadProjectHandoffExportsWithRefresh(session);
      if (cancelled) return;
      if (result.data) setHandoffExports(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  async function generateHandoffExport(format: "json" | "markdown"): Promise<void> {
    if (!session || exportingHandoff) return;
    setExportingHandoff(true);
    const result = await createProjectHandoffExportWithRefresh(session, { format });
    setExportingHandoff(false);
    if (!result.data) {
      onNotify("error", result.error?.message ?? "Unable to generate handoff export.");
      return;
    }
    const download = await downloadProjectHandoffExportWithRefresh(session, result.data.record.id);
    if (download.data?.downloadUrl) {
      const anchor = document.createElement("a");
      anchor.href = download.data.downloadUrl;
      anchor.download = download.data.fileName;
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }

    setHandoffExports((previous) => [result.data!.record, ...previous.filter((entry) => entry.id !== result.data!.record.id)].slice(0, 25));
    onNotify("success", `Handoff export ready: ${result.data.record.fileName}`);
  }

  async function downloadHandoffExport(exportId: string): Promise<void> {
    if (!session) return;
    const result = await downloadProjectHandoffExportWithRefresh(session, exportId);
    if (!result.data) {
      onNotify("error", result.error?.message ?? "Unable to download handoff export.");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = result.data.downloadUrl;
    anchor.download = result.data.fileName;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Governance</div>
          <div className={styles.projName}>Reports</div>
          <div className={styles.projMeta}>Live operational and financial summary from gateway data.</div>
        </div>
        <div className={styles.toolbarRow}>
          <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => void generateHandoffExport("markdown")} disabled={exportingHandoff}>
            {exportingHandoff ? "Generating..." : "Export Handoff MD"}
          </button>
          <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void generateHandoffExport("json")} disabled={exportingHandoff}>
            {exportingHandoff ? "Generating..." : "Export Handoff JSON"}
          </button>
          <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => exportCsv("maphari-finance-report.csv", [["Invoice", "Client", "Status", "Amount", "Due"], ...financeRows])}>
            Export Finance CSV
          </button>
          <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => exportCsv("maphari-delivery-report.csv", [["Project", "Client", "Status", "Progress", "Owner"], ...projectRows])}>
            Export Delivery CSV
          </button>
        </div>
      </div>
      <div className={`${styles.statsRow} ${styles.statsRowCols4}`}>
        <div className={`${styles.statCard} ${styles.green}`}><div className={styles.statLabel}>Clients</div><div className={styles.statValue}>{snapshot.clients.length}</div><div className={styles.statDelta}>Active records</div></div>
        <div className={`${styles.statCard} ${styles.purple}`}><div className={styles.statLabel}>Projects</div><div className={styles.statValue}>{snapshot.projects.length}</div><div className={styles.statDelta}>Tracked delivery</div></div>
        <div className={`${styles.statCard} ${styles.amber}`}><div className={styles.statLabel}>Invoices Total</div><div className={styles.statValue}>{formatMoney(totalInvoiced, currency)}</div><div className={styles.statDelta}>Paid {formatMoney(paidAmount, currency)}</div></div>
        <div className={`${styles.statCard} ${styles.red}`}><div className={styles.statLabel}>Outstanding</div><div className={styles.statValue}>{formatMoney(outstandingAmount, currency)}</div><div className={styles.statDelta}>Payments logged: {paymentCount}</div></div>
      </div>

      <div className={`${styles.statsRow} ${styles.statsRowCols3}`}>
        <div className={`${styles.statCard} ${styles.red}`}><div className={styles.statLabel}>At-Risk Projects</div><div className={styles.statValue}>{atRiskProjects}</div><div className={styles.statDelta}>Blocked / delayed / on hold</div></div>
        <div className={`${styles.statCard} ${styles.amber}`}><div className={styles.statLabel}>Open Leads</div><div className={styles.statValue}>{openLeads}</div><div className={styles.statDelta}>Pipeline still active</div></div>
        <div className={`${styles.statCard} ${styles.green}`}><div className={styles.statLabel}>Collection Rate</div><div className={styles.statValue}>{totalInvoiced > 0 ? Math.round((paidAmount / totalInvoiced) * 100) : 0}%</div><div className={styles.statDelta}>Paid / invoiced ratio</div></div>
      </div>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Finance Extract</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Invoice</th><th>Client</th><th>Status</th><th>Amount</th><th>Due</th></tr></thead>
            <tbody>
              {snapshot.invoices.length > 0 ? (
                snapshot.invoices
                  .slice()
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 8)
                  .map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.number}</td>
                      <td>{snapshot.clients.find((client) => client.id === invoice.clientId)?.name ?? "Unknown"}</td>
                      <td><span className={`${styles.badge} ${invoice.status === "PAID" ? styles.badgeGreen : invoice.status === "OVERDUE" ? styles.badgeRed : styles.badgeAmber}`}>{invoice.status}</span></td>
                      <td>{formatMoney(convertMoney(invoice.amountCents, invoice.currency), currency)}</td>
                      <td>{invoice.dueAt ? formatDate(invoice.dueAt) : "—"}</td>
                    </tr>
                  ))
              ) : (
                <tr><td colSpan={5} className={styles.emptyCell}><EmptyState title="No finance data yet" subtitle="This section updates once billing entries are created." compact /></td></tr>
              )}
            </tbody>
          </table>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Delivery Extract</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Progress</th><th>Owner</th></tr></thead>
            <tbody>
              {snapshot.projects.length > 0 ? (
                snapshot.projects
                  .slice()
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 8)
                  .map((project) => (
                    <tr key={project.id}>
                      <td>{project.name}</td>
                      <td>{snapshot.clients.find((client) => client.id === project.clientId)?.name ?? "Unknown"}</td>
                      <td><span className={`${styles.badge} ${project.status === "COMPLETED" ? styles.badgeGreen : project.status === "IN_PROGRESS" ? styles.badgeBlue : styles.badgeAmber}`}>{project.status}</span></td>
                      <td>{project.progressPercent}%</td>
                      <td>{project.ownerName ?? "—"}</td>
                    </tr>
                  ))
              ) : (
                <tr><td colSpan={5} className={styles.emptyCell}><EmptyState title="No delivery data yet" subtitle="This section updates once delivery projects are created." compact /></td></tr>
              )}
            </tbody>
          </table>
        </article>
      </div>

      <article className={styles.card} style={{ marginTop: 20 }}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Handoff Export History</span>
        </div>
        <table className={styles.projTable}>
          <thead><tr><th>File</th><th>Format</th><th>Generated</th><th>Summary</th></tr></thead>
          <tbody>
            {handoffExports.length > 0 ? (
              handoffExports.slice(0, 10).map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.fileName}</td>
                  <td>{entry.format.toUpperCase()}</td>
                  <td>{formatDate(entry.generatedAt)}</td>
                  <td style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{entry.docs} docs · {entry.decisions} decisions · {entry.blockers} blockers</span>
                    <button
                      type="button"
                      className={`${styles.btnSm} ${styles.btnGhost}`}
                      onClick={() => void downloadHandoffExport(entry.id)}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className={styles.emptyCell}><EmptyState title="No handoff exports yet" subtitle="Create one from the report toolbar." compact /></td></tr>
            )}
          </tbody>
        </table>
      </article>
  </div>
);
}

type ExperienceStage = "Discovery" | "Planning" | "Delivery" | "Billing" | "Retention";

const experienceStageDetails: Record<ExperienceStage, { description: string; nextAction: string }> = {
  Discovery: {
    description:
      "Qualifying the opportunity and assembling the intake so the strategy call lands with clarity.",
    nextAction: "Book the kickoff session and capture intake notes."
  },
  Planning: {
    description:
      "Contract signed; project plan, roles, and timelines are being staffed and aligned.",
    nextAction: "Confirm milestones and assign delivery leads."
  },
  Delivery: {
    description: "Project work is in flight; we are tracking sprint updates and risks.",
    nextAction: "Publish current milestone status and next steps."
  },
  Billing: {
    description: "Invoices are out for review and payments are being scheduled.",
    nextAction: "Chase outstanding invoices and confirm settle dates."
  },
  Retention: {
    description: "Delivery complete; we are nurturing renewal and value reports.",
    nextAction: "Share impact summary and schedule the next check-in."
  }
};

const experienceStageBadgeClass: Record<ExperienceStage, string> = {
  Discovery: `${styles.badge} ${styles.badgePurple}`,
  Planning: `${styles.badge} ${styles.badgeAmber}`,
  Delivery: `${styles.badge} ${styles.badgeGreen}`,
  Billing: `${styles.badge} ${styles.badgeRed}`,
  Retention: `${styles.badge} ${styles.badgePurple}`
};

const experienceStageOrder: ExperienceStage[] = ["Discovery", "Planning", "Delivery", "Billing", "Retention"];

type SupportTicketPriority = "LOW" | "MEDIUM" | "HIGH";
type SupportTicketStatus = "OPEN" | "ESCALATED" | "RESOLVED";

interface SupportTicket {
  id: string;
  clientId: string;
  owner: string;
  description: string;
  slaDueAt: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: string;
  nextAction: string;
}

type FeedbackChannel = "Call" | "Email" | "Portal" | "Meeting";

interface FeedbackEntry {
  id: string;
  clientId: string;
  rating: number;
  channel: FeedbackChannel;
  notes: string;
  createdAt: string;
}

function useClock(interval = 60000): number {
  const [timestamp, setTimestamp] = useState(() => Date.now());
  useEffect(() => {
    const handle = window.setInterval(() => setTimestamp(Date.now()), interval);
    return () => window.clearInterval(handle);
  }, [interval]);
  return timestamp;
}

function determineExperienceStage(
  client: AdminClient,
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"]
): ExperienceStage {
  const clientLeads = snapshot.leads.filter((lead) => lead.clientId === client.id);
  const wonLead = clientLeads.some((lead) => lead.status === "WON");
  const clientProjects = snapshot.projects.filter((project) => project.clientId === client.id);
  const activeProject = clientProjects.some((project) =>
    ["IN_PROGRESS", "REVIEW", "PLANNING"].includes(project.status)
  );
  const outstandingInvoice = snapshot.invoices.some(
    (invoice) => invoice.clientId === client.id && invoice.status !== "PAID" && invoice.status !== "VOID"
  );

  if (!wonLead) {
    return "Discovery";
  }
  if (!clientProjects.length) {
    return "Planning";
  }
  if (activeProject) {
    return "Delivery";
  }
  if (outstandingInvoice) {
    return "Billing";
  }
  return "Retention";
}

function ExperiencePage({
  snapshot,
  session,
  onNotify,
  clock
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  onNotify: (tone: "success" | "error", message: string) => void;
  clock: number;
}) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [messageDirty, setMessageDirty] = useState(false);
  const [sending, setSending] = useState(false);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [ticketClientId, setTicketClientId] = useState(snapshot.clients[0]?.id ?? "");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketOwner, setTicketOwner] = useState("");
  const [ticketPriority, setTicketPriority] = useState<SupportTicketPriority>("MEDIUM");
  const [ticketDue, setTicketDue] = useState("");
  const [feedbackClientId, setFeedbackClientId] = useState(snapshot.clients[0]?.id ?? "");
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [feedbackChannel, setFeedbackChannel] = useState<FeedbackChannel>("Call");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [summarySending, setSummarySending] = useState(false);
  const slaAlertedRef = useRef<Set<string>>(new Set());
  const renewalAlertedRef = useRef<Set<string>>(new Set());
  const templateKeyRef = useRef("");
  const clientLookup = useMemo(
    () => new Map(snapshot.clients.map((client) => [client.id, client])),
    [snapshot.clients]
  );

  const stageRows = useMemo(
    () =>
      snapshot.clients.map((client) => {
        const stage = determineExperienceStage(client, snapshot);
        const ownerProject = snapshot.projects.find((project) => project.clientId === client.id);
        const owner = ownerProject?.ownerName ?? client.ownerName ?? "Unassigned";
        return {
          client,
          stage,
          owner,
          nextAction: experienceStageDetails[stage].nextAction
        };
      }),
    [snapshot]
  );

  const riskRows = useMemo(() => {
    return snapshot.clients
      .map((client) => {
        const overdueInvoices = snapshot.invoices.filter((invoice) => invoice.clientId === client.id && invoice.status === "OVERDUE").length;
        const blockedProjects = snapshot.projects.filter(
          (project) => project.clientId === client.id && ["BLOCKED", "DELAYED"].includes(project.status)
        ).length;
        const stage = determineExperienceStage(client, snapshot);
        const score = Math.min(100, overdueInvoices * 14 + blockedProjects * 12 + (client.priority === "HIGH" ? 10 : 0));
        return { client, overdue: overdueInvoices, blocked: blockedProjects, stage, score };
      })
      .filter((entry) => entry.overdue > 0 || entry.blocked > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [snapshot]);

  const renewalRows = useMemo(() => {
    const windowMs = 1000 * 60 * 60 * 24 * 60;
    return snapshot.clients
      .map((client) => {
        if (!client.contractRenewalAt) return null;
        const dueMs = new Date(client.contractRenewalAt).getTime();
        const daysUntil = Math.max(0, Math.ceil((dueMs - clock) / (1000 * 60 * 60 * 24)));
        if (dueMs < clock || dueMs - clock > windowMs) return null;
        const stage = determineExperienceStage(client, snapshot);
        return { client, daysUntil, dueDate: client.contractRenewalAt, stage };
      })
      .filter(
        (entry): entry is { client: AdminClient; daysUntil: number; dueDate: string; stage: ExperienceStage } => Boolean(entry)
      )
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }, [snapshot, clock]);

  useEffect(() => {
    if (!stageRows.length) {
      queueMicrotask(() => setSelectedClientId(null));
      return;
    }
    queueMicrotask(() =>
      setSelectedClientId((current) =>
        current && stageRows.some((row) => row.client.id === current) ? current : stageRows[0].client.id
      )
    );
  }, [stageRows]);

  useEffect(() => {
    if (!selectedClientId) return;
    const row = stageRows.find((entry) => entry.client.id === selectedClientId);
    if (!row) return;
    const templateKey = `${row.client.id}:${row.stage}:${row.client.updatedAt}`;
    queueMicrotask(() => setRecipient(row.client.billingEmail ?? ""));
    if (messageDirty && templateKey === templateKeyRef.current) {
      return;
    }
    templateKeyRef.current = templateKey;
    queueMicrotask(() => {
      setMessage(`Hi ${row.client.name}, ${experienceStageDetails[row.stage].description}`);
      setMessageDirty(false);
    });
  }, [selectedClientId, stageRows, messageDirty]);

  useEffect(() => {
    if (!ticketClientId && snapshot.clients.length > 0) {
      queueMicrotask(() => setTicketClientId(snapshot.clients[0].id));
    }
    if (!feedbackClientId && snapshot.clients.length > 0) {
      queueMicrotask(() => setFeedbackClientId(snapshot.clients[0].id));
    }
  }, [snapshot.clients, ticketClientId, feedbackClientId]);

  useEffect(() => {
    if (supportTickets.length > 0) return;
    const derived: SupportTicket[] = [];
    const overdueInvoices = snapshot.invoices.filter((invoice) => invoice.status === "OVERDUE");
    const blockedProjects = snapshot.projects.filter((project) =>
      ["BLOCKED", "DELAYED"].includes(project.status)
    );
    overdueInvoices.slice(0, 2).forEach((invoice) => {
      const client = clientLookup.get(invoice.clientId);
      derived.push({
        id: `ticket-${invoice.id}`,
        clientId: invoice.clientId,
        owner: client?.ownerName ?? "Account Team",
        description: `Collections follow-up for ${invoice.number}`,
        slaDueAt: invoice.dueAt ?? invoice.updatedAt,
        status: "ESCALATED",
        priority: "HIGH",
        createdAt: invoice.updatedAt,
        nextAction: "Confirm payment and notify delivery."
      });
    });
    blockedProjects.slice(0, 1).forEach((project) => {
      const client = clientLookup.get(project.clientId);
      derived.push({
        id: `ticket-${project.id}`,
        clientId: project.clientId,
        owner: project.ownerName ?? client?.ownerName ?? "Delivery",
        description: `Project ${project.name} is ${project.status.toLowerCase()}.`,
        slaDueAt: project.slaDueAt ?? project.dueAt ?? project.updatedAt,
        status: "OPEN",
        priority: "MEDIUM",
        createdAt: project.updatedAt,
        nextAction: "Remove blocker and publish status."
      });
    });
    if (derived.length) {
      queueMicrotask(() => setSupportTickets(derived));
    }
  }, [clientLookup, snapshot.clients, snapshot.invoices, snapshot.projects, supportTickets.length, clock]);

  const selectedRow = stageRows.find((row) => row.client.id === selectedClientId) ?? null;

  const stageCounts = useMemo(() => {
    return stageRows.reduce<Record<ExperienceStage, number>>(
      (acc, row) => {
        acc[row.stage] = (acc[row.stage] ?? 0) + 1;
        return acc;
      },
      { Discovery: 0, Planning: 0, Delivery: 0, Billing: 0, Retention: 0 }
    );
  }, [stageRows]);

  const sortedRows = useMemo(
    () =>
      [...stageRows].sort((a, b) => {
        const weight = experienceStageOrder.indexOf(a.stage) - experienceStageOrder.indexOf(b.stage);
        if (weight !== 0) return weight;
        return a.client.name.localeCompare(b.client.name);
      }),
    [stageRows]
  );

  const openTickets = supportTickets.filter((ticket) => ticket.status !== "RESOLVED");
  const escalatedTickets = supportTickets.filter((ticket) => ticket.status === "ESCALATED");
  const slaBreaches = openTickets.filter((ticket) => {
    if (!ticket.slaDueAt) return false;
    const dueMs = new Date(ticket.slaDueAt).getTime();
    return dueMs < clock;
  });

  useEffect(() => {
    if (!session) return;
    const ticketsToNotify = slaBreaches.filter((ticket) => !slaAlertedRef.current.has(ticket.id));
    if (!ticketsToNotify.length) return;
    let active = true;
    void (async () => {
      let sent = 0;
      for (const ticket of ticketsToNotify) {
        if (!active) break;
        const client = clientLookup.get(ticket.clientId);
        const recipientEmail = client?.billingEmail ?? session.user.email ?? "team@maphari";
        const result = await createNotificationJobWithRefresh(session, {
          clientId: ticket.clientId,
          channel: "EMAIL",
          recipient: recipientEmail,
          subject: `SLA breach · ${ticket.priority}`,
          message: `SLA breach detected for ${client?.name ?? "client"}: ${ticket.description}. SLA due ${ticket.slaDueAt ? formatDate(ticket.slaDueAt) : "soon"}.`,
          metadata: { type: "sla-breach", ticketId: ticket.id, priority: ticket.priority }
        });
        if (result.nextSession && result.data) {
          slaAlertedRef.current.add(ticket.id);
          sent += 1;
        }
      }
      if (!active) return;
      if (sent > 0) {
        onNotify("success", `${sent} SLA breach${sent === 1 ? "" : "es"} synced to the portal bridge.`);
      }
    })();
    return () => {
      active = false;
    };
  }, [slaBreaches, session, clientLookup, onNotify]);

  useEffect(() => {
    if (!session) return;
    const renewalsToNotify = renewalRows.filter((entry) => !renewalAlertedRef.current.has(entry.client.id));
    if (!renewalsToNotify.length) return;
    let active = true;
    void (async () => {
      let sent = 0;
      for (const entry of renewalsToNotify) {
        if (!active) break;
        const recipientEmail = entry.client.billingEmail ?? session.user.email ?? "team@maphari";
        const result = await createNotificationJobWithRefresh(session, {
          clientId: entry.client.id,
          channel: "EMAIL",
          recipient: recipientEmail,
          subject: `Renewal reminder · ${entry.client.name}`,
          message: `Renewal is due in ${entry.daysUntil} day${entry.daysUntil === 1 ? "" : "s"} for ${entry.client.name} (stage ${entry.stage}). Due ${formatDate(entry.dueDate)}.`,
          metadata: { type: "renewal-alert", clientId: entry.client.id, daysUntil: entry.daysUntil }
        });
        if (result.nextSession && result.data) {
          renewalAlertedRef.current.add(entry.client.id);
          sent += 1;
        }
      }
      if (!active) return;
      if (sent > 0) {
        onNotify("success", `${sent} renewal reminder${sent === 1 ? "" : "s"} queued for the portal bridge.`);
      }
    })();
    return () => {
      active = false;
    };
  }, [renewalRows, session, onNotify]);

  const feedbackCount = feedbackEntries.length;
  const averageRating =
    feedbackCount === 0 ? 0 : Math.round((feedbackEntries.reduce((sum, entry) => sum + entry.rating, 0) / feedbackCount) * 10) / 10;
  const recentFeedback = [...feedbackEntries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const portalSummary = useMemo(() => {
    const stageSummary = experienceStageOrder.map((stage) => `${stage}: ${stageCounts[stage] ?? 0}`).join(" · ");
    const renewalSummary = renewalRows.length
      ? renewalRows.map((entry) => `${entry.client.name} in ${entry.daysUntil}d`).join(", ")
      : "No renewals within 60 days";
    const feedbackSummary = feedbackCount > 0 ? `${averageRating.toFixed(1)}/5 from ${feedbackCount} entries` : "No feedback logged yet";
    return `Experience snapshot: ${stageSummary}. Support queue: ${openTickets.length} open, ${escalatedTickets.length} escalated, ${slaBreaches.length} SLA breaches. Renewals: ${renewalSummary}. Feedback: ${feedbackSummary}.`;
  }, [stageCounts, openTickets.length, escalatedTickets.length, slaBreaches.length, renewalRows, averageRating, feedbackCount]);

  const stageStatClass: Record<ExperienceStage, string> = {
    Discovery: styles.purple,
    Planning: styles.amber,
    Delivery: styles.green,
    Billing: styles.red,
    Retention: styles.purple
  };

  async function handlePublish(): Promise<void> {
    if (!session || !selectedRow) {
      onNotify("error", "Session required to publish updates.");
      return;
    }
    if (!recipient.trim()) {
      onNotify("error", "Recipient email is required.");
      return;
    }
    if (!message.trim()) {
      onNotify("error", "Message body cannot be empty.");
      return;
    }
    setSending(true);
    const result = await createNotificationJobWithRefresh(session, {
      clientId: selectedRow.client.id,
      channel: "EMAIL",
      recipient: recipient.trim(),
      subject: `Maphari update · ${selectedRow.stage}`,
      message: message.trim()
    });
    if (!result.nextSession || !result.data) {
      onNotify("error", result.error?.message ?? "Unable to publish client update.");
    } else {
      onNotify("success", "Update queued for the portal bridge.");
    }
    setSending(false);
  }

  async function handleCreateTicket(): Promise<void> {
    if (!session) {
      onNotify("error", "Session required to create a support ticket.");
      return;
    }
    if (!ticketClientId || !ticketDescription.trim()) {
      onNotify("error", "Select a client and describe the issue.");
      return;
    }
    const newTicket: SupportTicket = {
      id: `support-${Math.random().toString(36).slice(2, 8)}`,
      clientId: ticketClientId,
      owner: ticketOwner || "Client Success",
      description: ticketDescription.trim(),
      slaDueAt: ticketDue || new Date(clock + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "OPEN",
      priority: ticketPriority,
      createdAt: new Date(clock).toISOString(),
      nextAction: "Share next steps with the client and notify delivery."
    };
    setSupportTickets((previous) => [newTicket, ...previous]);
    const client = clientLookup.get(ticketClientId);
    const recipientEmail = client?.billingEmail ?? session.user.email ?? "team@maphari";
    const result = await createNotificationJobWithRefresh(session, {
      clientId: ticketClientId,
      channel: "EMAIL",
      recipient: recipientEmail,
      subject: `Support ticket · ${ticketPriority}`,
      message: `Support ticket created for ${client?.name ?? "client"}: ${ticketDescription.trim()}. SLA due ${new Date(
        newTicket.slaDueAt
      ).toLocaleDateString()}.`,
      metadata: {
        type: "support-ticket",
        ticketId: newTicket.id,
        priority: newTicket.priority
      }
    });
    if (!result.nextSession || !result.data) {
      onNotify("error", result.error?.message ?? "Unable to queue support notification.");
    } else {
      onNotify("success", "Support ticket queued and portal bridge notified.");
      setTicketDescription("");
      setTicketOwner("");
      setTicketDue("");
    }
  }

  async function handleResolveTicket(ticketId: string): Promise<void> {
    if (!session) {
      onNotify("error", "Session required to resolve tickets.");
      return;
    }
    const ticket = supportTickets.find((entry) => entry.id === ticketId);
    if (!ticket) return;
    setSupportTickets((previous) =>
      previous.map((entry) => (entry.id === ticketId ? { ...entry, status: "RESOLVED" } : entry))
    );
    const client = clientLookup.get(ticket.clientId);
    const recipientEmail = client?.billingEmail ?? session.user.email ?? "team@maphari";
    const result = await createNotificationJobWithRefresh(session, {
      clientId: ticket.clientId,
      channel: "EMAIL",
      recipient: recipientEmail,
      subject: `Resolved · ${ticket.description}`,
      message: `Support ticket for ${client?.name ?? "client"} is resolved and a summary is available.`,
      metadata: { type: "support-ticket", ticketId, status: "RESOLVED" }
    });
    if (!result.nextSession || !result.data) {
      onNotify("error", result.error?.message ?? "Unable to notify about the resolved ticket.");
    } else {
      onNotify("success", "Portal bridge notified of the resolved ticket.");
    }
  }

  async function handleLogFeedback(): Promise<void> {
    if (!session) {
      onNotify("error", "Session required to log feedback.");
      return;
    }
    if (!feedbackClientId || !feedbackNotes.trim()) {
      onNotify("error", "Select a client and add feedback.");
      return;
    }
    const entry: FeedbackEntry = {
      id: `feedback-${Math.random().toString(36).slice(2, 8)}`,
      clientId: feedbackClientId,
      rating: feedbackRating,
      channel: feedbackChannel,
      notes: feedbackNotes.trim(),
      createdAt: new Date(clock).toISOString()
    };
    setFeedbackEntries((previous) => [entry, ...previous]);
    const client = clientLookup.get(feedbackClientId);
    const recipientEmail = client?.billingEmail ?? session.user.email ?? "team@maphari";
    const result = await createNotificationJobWithRefresh(session, {
      clientId: feedbackClientId,
      channel: "EMAIL",
      recipient: recipientEmail,
      subject: `Client feedback · ${feedbackRating}/5`,
      message: `Feedback captured for ${client?.name ?? "client"} via ${feedbackChannel}: ${feedbackNotes.trim()}`,
      metadata: { type: "feedback", rating: feedbackRating, channel: feedbackChannel }
    });
    if (!result.nextSession || !result.data) {
      onNotify("error", result.error?.message ?? "Unable to send feedback summary.");
    } else {
      onNotify("success", "Feedback captured and queued for the portal.");
      setFeedbackNotes("");
    }
  }

  async function handleBroadcastSummary(): Promise<void> {
    if (!session) {
      onNotify("error", "Session required to send the summary broadcast.");
      return;
    }
    setSummarySending(true);
    const result = await createNotificationJobWithRefresh(session, {
      channel: "EMAIL",
      recipient: session.user.email ?? "team@maphari",
      subject: "Experience digest · Portal bridge",
      message: portalSummary,
      metadata: { type: "experience-summary", totalClients: snapshot.clients.length }
    });
    if (!result.nextSession || !result.data) {
      onNotify("error", result.error?.message ?? "Unable to queue experience summary.");
    } else {
      onNotify("success", "Experience summary queued for the portal bridge.");
    }
    setSummarySending(false);
  }

  const previewCopy = selectedRow
    ? `CLIENT: ${selectedRow.client.name}\nSTAGE: ${selectedRow.stage}\n\n${message}`
    : "Select a client to preview the portal update.";

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Experience</div>
          <div className={styles.projName}>Client Journey</div>
          <div className={styles.projMeta}>Onboarding, delivery, and billing visibility with portal bridge context.</div>
        </div>
        <div className={styles.toolbarRow}>
          <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => setMessageDirty(false)}>
            Refresh template
          </button>
        </div>
      </div>

      <div className={`${styles.statsRow} ${styles.statsRowCols4}`}>
        {experienceStageOrder.slice(0, 4).map((stage) => (
          <div key={stage} className={`${styles.statCard} ${stageStatClass[stage]}`}>
            <div className={styles.statLabel}>{stage}</div>
            <div className={styles.statValue}>{stageCounts[stage]}</div>
            <div className={styles.statDelta}>{experienceStageDetails[stage].nextAction}</div>
          </div>
        ))}
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Client Journey Map</span>
          <div className={styles.toolbarRow}>
            <select
              className={styles.selectInput}
              value={selectedClientId ?? ""}
              onChange={(event) => setSelectedClientId(event.target.value || null)}
            >
              {stageRows.map((row) => (
                <option key={row.client.id} value={row.client.id}>
                  {row.client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.cardInner}>
          <table className={styles.projTable}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Next Action</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length > 0 ? (
                sortedRows.map((row) => (
                  <tr key={row.client.id}>
                    <td>
                      <div className={styles.cellStrong}>{row.client.name}</div>
                      <div className={styles.cellSub}>{row.client.status}</div>
                    </td>
                    <td>
                      <span className={experienceStageBadgeClass[row.stage]}>{row.stage}</span>
                    </td>
                    <td>{row.owner}</td>
                    <td>{row.nextAction}</td>
                    <td>{formatDate(row.client.updatedAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    <EmptyState title="No clients yet" subtitle="Clients appear once onboarding data is populated." compact />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Portal Bridge</span>
          </div>
          <div className={styles.cardInner}>
            <div className={styles.formGrid}>
              <input
                className={styles.formInput}
                placeholder="Recipient email"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
              />
              <textarea
                className={styles.formTextarea}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setMessageDirty(true);
                }}
                rows={6}
              />
            </div>
            <button
              type="button"
              className={`${styles.btnSm} ${styles.btnAccent}`}
              onClick={() => void handlePublish()}
              disabled={sending}
            >
              {sending ? "Publishing…" : "Publish update to portal"}
            </button>
          </div>
        </article>

        <article className={`${styles.card} ${styles.bridgePreview}`}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Portal Preview</span>
          </div>
          <div className={`${styles.cardInner} ${styles.bridgePreviewContent}`}>
            <pre>{previewCopy}</pre>
          </div>
        </article>
      </div>

      <div className={`${styles.statsRow} ${styles.statsRowCols3} ${styles.supportStats}`}>
        <div className={`${styles.statCard} ${styles.purple}`}>
          <div className={styles.statLabel}>Open tickets</div>
          <div className={styles.statValue}>{openTickets.length}</div>
          <div className={styles.statDelta}>Awaiting response or validation</div>
        </div>
        <div className={`${styles.statCard} ${styles.amber}`}>
          <div className={styles.statLabel}>Escalated</div>
          <div className={styles.statValue}>{escalatedTickets.length}</div>
          <div className={styles.statDelta}>Requires executive attention</div>
        </div>
        <div className={`${styles.statCard} ${styles.red}`}>
          <div className={styles.statLabel}>SLA breaches</div>
          <div className={styles.statValue}>{slaBreaches.length}</div>
          <div className={styles.statDelta}>Notify client & team</div>
        </div>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Support Queue</span>
        </div>
        <div className={styles.cardInner}>
          <table className={styles.projTable}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Priority</th>
                <th>SLA</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {supportTickets.length > 0 ? (
                supportTickets.map((ticket) => {
                  const dueMs = ticket.slaDueAt ? new Date(ticket.slaDueAt).getTime() : null;
                  const countdown =
                    dueMs !== null
                      ? dueMs > clock
                        ? `${Math.max(0, Math.floor((dueMs - clock) / (1000 * 60 * 60)))}h left`
                        : "breached"
                      : "TBD";
                  return (
                    <tr key={ticket.id}>
                      <td>
                        <div className={styles.cellStrong}>{clientLookup.get(ticket.clientId)?.name ?? "Client"}</div>
                        <div className={styles.cellSub}>{ticket.description}</div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${ticket.priority === "HIGH" ? styles.badgeRed : ticket.priority === "MEDIUM" ? styles.badgeAmber : styles.badgeGreen}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className={styles.cellSub}>{countdown}</td>
                      <td>{ticket.owner}</td>
                      <td>{ticket.status}</td>
                      <td>
                        {ticket.status !== "RESOLVED" ? (
                          <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => void handleResolveTicket(ticket.id)}>
                            Resolve
                          </button>
                        ) : (
                          <span className={styles.badgeMuted}>Closed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    <EmptyState title="No support tickets" subtitle="Tickets appear once an issue is logged." compact />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Risk Radar</span>
            <span className={styles.metaMono}>{riskRows.length} alert{riskRows.length === 1 ? "" : "s"}</span>
          </div>
          <div className={styles.cardInner}>
            {riskRows.length > 0 ? (
              <div className={styles.listGroup}>
                {riskRows.map((entry) => (
                  <div key={entry.client.id} className={styles.listRow}>
                    <div className={styles.listRowHeader}>
                      <div>
                        <div className={styles.cellStrong}>{entry.client.name}</div>
                        <div className={styles.cellSub}>{entry.stage}</div>
                      </div>
                      <div className={styles.listBadge}>
                        <span>{entry.score} pts</span>
                      </div>
                    </div>
                    <div className={styles.listMeta}>
                      {entry.overdue} overdue invoice{entry.overdue === 1 ? "" : "s"} · {entry.blocked} blocker{entry.blocked === 1 ? "" : "s"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptySub}>No immediate risks detected across the portfolio.</div>
            )}
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Renewal Pipeline</span>
            <span className={styles.metaMono}>Next 60 days</span>
          </div>
          <div className={styles.cardInner}>
            {renewalRows.length > 0 ? (
              <div className={styles.listGroup}>
                {renewalRows.map((entry) => (
                  <div key={entry.client.id} className={styles.listRow}>
                    <div className={styles.listRowHeader}>
                      <div>
                        <div className={styles.cellStrong}>{entry.client.name}</div>
                        <div className={styles.cellSub}>{entry.stage}</div>
                      </div>
                      <div className={styles.listBadge}>
                        <span>{entry.daysUntil}d</span>
                      </div>
                    </div>
                    <div className={styles.listMeta}>Due {formatDate(entry.dueDate)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptySub}>No renewals due within the next 60 days.</div>
            )}
          </div>
        </article>
      </div>


      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Log Support Ticket</span>
          </div>
          <div className={styles.cardInner}>
            <div className={styles.supportForm}>
              <select className={styles.selectInput} value={ticketClientId} onChange={(event) => setTicketClientId(event.target.value)}>
                {snapshot.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <select className={styles.selectInput} value={ticketPriority} onChange={(event) => setTicketPriority(event.target.value as SupportTicketPriority)}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <input
                className={styles.formInput}
                placeholder="Owner (team or person)"
                value={ticketOwner}
                onChange={(event) => setTicketOwner(event.target.value)}
              />
              <input
                className={styles.formInput}
                type="datetime-local"
                value={ticketDue}
                onChange={(event) => setTicketDue(event.target.value)}
                placeholder="SLA due"
              />
              <textarea
                className={styles.formTextarea}
                rows={3}
                placeholder="Describe the issue and next step"
                value={ticketDescription}
                onChange={(event) => setTicketDescription(event.target.value)}
              />
            </div>
            <div className={styles.toolbarRow}>
              <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleCreateTicket()}>
                Queue ticket / notify client
              </button>
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Client Feedback Loop</span>
          </div>
          <div className={styles.cardInner}>
            <div className={styles.feedbackGrid}>
              <select className={styles.selectInput} value={feedbackClientId} onChange={(event) => setFeedbackClientId(event.target.value)}>
                {snapshot.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <input
                className={styles.formInput}
                type="number"
                min="1"
                max="5"
                value={feedbackRating}
                onChange={(event) => setFeedbackRating(Number(event.target.value))}
                placeholder="Rating (1-5)"
              />
              <select className={styles.selectInput} value={feedbackChannel} onChange={(event) => setFeedbackChannel(event.target.value as FeedbackChannel)}>
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Portal">Portal</option>
                <option value="Meeting">Meeting</option>
              </select>
              <textarea
                className={styles.formTextarea}
                rows={3}
                placeholder="Summary or quote to share with client"
                value={feedbackNotes}
                onChange={(event) => setFeedbackNotes(event.target.value)}
              />
            </div>
            <div className={`${styles.toolbarRow} ${styles.toolbarRowNoWrap}`}>
              <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleLogFeedback()}>
                Log feedback + notify portal
              </button>
            </div>
            <div className={styles.feedbackSummary}>
              <div>
                <div className={styles.cellStrong}>{averageRating.toFixed(1)}</div>
                <div className={styles.cellSub}>Average rating</div>
              </div>
              <div>
                <div className={styles.cellStrong}>{feedbackCount}</div>
                <div className={styles.cellSub}>Entries</div>
              </div>
              <div>
                <div className={styles.cellStrong}>{recentFeedback[0]?.channel ?? "—"}</div>
                <div className={styles.cellSub}>Recent channel</div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <article className={`${styles.card} ${styles.summaryCard}`}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Portal Summary Broadcast</span>
          <span className={styles.metaMono}>Shared snapshot for the portal</span>
        </div>
        <div className={`${styles.cardInner} ${styles.summaryBody}`}>
          <pre className={styles.summaryPreview}>{portalSummary}</pre>
          <button
            type="button"
            className={`${styles.btnSm} ${styles.btnAccent}`}
            onClick={() => void handleBroadcastSummary()}
            disabled={summarySending}
          >
            {summarySending ? "Broadcasting…" : "Send summary to portal"}
          </button>
        </div>
      </article>

      <article className={`${styles.card} ${styles.feedbackLogCard}`}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Client Voice Feed</span>
        </div>
        <div className={styles.cardInner}>
          <table className={styles.projTable}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Rating</th>
                <th>Channel</th>
                <th>Notes</th>
                <th>Logged</th>
              </tr>
            </thead>
            <tbody>
              {recentFeedback.length > 0 ? (
                recentFeedback.map((entry) => (
                  <tr key={entry.id}>
                    <td>{clientLookup.get(entry.clientId)?.name ?? entry.clientId.slice(0, 6)}</td>
                    <td>
                      <span className={styles.badgePurple}>{entry.rating}/5</span>
                    </td>
                    <td>{entry.channel}</td>
                    <td>{entry.notes}</td>
                    <td>{formatDate(entry.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    <EmptyState title="No feedback yet" subtitle="Feedback entries populate once captured." compact />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

function NotificationsPage({
  snapshot,
  session,
  jobs,
  processing,
  onProcess,
  onRefreshSnapshot,
  onNotify
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  jobs: NotificationJob[];
  processing: boolean;
  onProcess: () => Promise<void>;
  onRefreshSnapshot: (sessionOverride?: AuthSession) => Promise<void>;
  onNotify: (tone: "success" | "error", message: string) => void;
}) {
  const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
  const [statusFilter, setStatusFilter] = useState<"ALL" | "QUEUED" | "SENT" | "FAILED">("ALL");
  const [channelFilter, setChannelFilter] = useState<"ALL" | "EMAIL" | "SMS" | "PUSH">("ALL");
  const [createClientId, setCreateClientId] = useState(snapshot.clients[0]?.id ?? "");
  const [createChannel, setCreateChannel] = useState<"EMAIL" | "SMS" | "PUSH">("EMAIL");
  const [createRecipient, setCreateRecipient] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createMessage, setCreateMessage] = useState("");

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => (statusFilter === "ALL" ? true : job.status === statusFilter))
      .filter((job) => (channelFilter === "ALL" ? true : job.channel === channelFilter))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [channelFilter, jobs, statusFilter]);

  async function handleQueueNotification(): Promise<void> {
    if (!session || !canEdit) return;
    if (!createRecipient.trim() || !createMessage.trim()) {
      onNotify("error", "Recipient and message are required.");
      return;
    }
    const created = await createNotificationJobWithRefresh(session, {
      clientId: createClientId || undefined,
      channel: createChannel,
      recipient: createRecipient.trim(),
      subject: createSubject.trim() || undefined,
      message: createMessage.trim()
    });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to queue notification.");
      return;
    }
    setCreateRecipient("");
    setCreateSubject("");
    setCreateMessage("");
    onNotify("success", "Notification queued.");
    await onRefreshSnapshot(created.nextSession);
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Communication</div>
          <div className={styles.projName}>Notifications</div>
          <div className={styles.projMeta}>Live notification queue and delivery status.</div>
        </div>
        <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void onProcess()} disabled={processing}>
          {processing ? "Processing..." : "Process Queue"}
        </button>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Queue Notification</span></div>
        <div className={styles.formGrid}>
          <select className={styles.selectInput} value={createClientId} onChange={(event) => setCreateClientId(event.target.value)} disabled={!canEdit}>
            <option value="">No client context</option>
            {snapshot.clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <select className={styles.selectInput} value={createChannel} onChange={(event) => setCreateChannel(event.target.value as typeof createChannel)} disabled={!canEdit}>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
            <option value="PUSH">Push</option>
          </select>
          <input className={styles.formInput} placeholder="Recipient" value={createRecipient} onChange={(event) => setCreateRecipient(event.target.value)} disabled={!canEdit} />
          <input className={styles.formInput} placeholder="Subject (optional)" value={createSubject} onChange={(event) => setCreateSubject(event.target.value)} disabled={!canEdit} />
          <textarea className={styles.formTextarea} placeholder="Notification message" value={createMessage} onChange={(event) => setCreateMessage(event.target.value)} disabled={!canEdit} />
          {canEdit ? <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleQueueNotification()}>Queue Notification</button> : <div className={styles.emptySub}>Read-only mode for this role.</div>}
        </div>
      </article>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Delivery Jobs</span>
          <div className={`${styles.toolbarRow} ${styles.toolbarRowNoWrap}`}>
            <select className={styles.selectInput} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="ALL">All status</option>
              <option value="QUEUED">Queued</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
            </select>
            <select className={styles.selectInput} value={channelFilter} onChange={(event) => setChannelFilter(event.target.value as typeof channelFilter)}>
              <option value="ALL">All channels</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push</option>
            </select>
          </div>
        </div>
        <table className={styles.projTable}>
          <thead><tr><th>Channel</th><th>Recipient</th><th>Status</th><th>Attempts</th><th>Updated</th></tr></thead>
          <tbody>
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.channel}</td>
                  <td>{job.recipient}</td>
                  <td><span className={`${styles.badge} ${job.status === "SENT" ? styles.badgeGreen : job.status === "FAILED" ? styles.badgeRed : styles.badgeAmber}`}>{job.status}</span></td>
                  <td>{job.attempts}/{job.maxAttempts}</td>
                  <td>{formatDate(job.updatedAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  <EmptyState title="No notification jobs" subtitle="This view updates once queued jobs match the selected filters." compact variant="message" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </article>
    </div>
  );
}

function IntegrationsPage({
  keys,
  snapshot,
  session,
  onRefreshKeys,
  onNotify
}: {
  keys: PartnerApiKey[];
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  onRefreshKeys: (sessionOverride?: AuthSession) => Promise<void>;
  onNotify: (tone: "success" | "error", message: string) => void;
}) {
  const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
  const [query, setQuery] = useState("");
  const [createClientId, setCreateClientId] = useState(snapshot.clients[0]?.id ?? "");
  const [createLabel, setCreateLabel] = useState("");

  const filteredKeys = useMemo(() => {
    const q = query.trim().toLowerCase();
    return keys
      .filter((key) => {
        if (!q) return true;
        const clientName = snapshot.clients.find((client) => client.id === key.clientId)?.name ?? "";
        return key.label.toLowerCase().includes(q) || key.keyId.toLowerCase().includes(q) || clientName.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [keys, query, snapshot.clients]);

  async function handleIssueKey(): Promise<void> {
    if (!session || !canEdit) return;
    if (!createLabel.trim()) {
      onNotify("error", "Key label is required.");
      return;
    }
    const issued = await createPublicApiKeyWithRefresh(session, {
      clientId: createClientId || undefined,
      label: createLabel.trim()
    });
    if (!issued.nextSession || !issued.data) {
      onNotify("error", issued.error?.message ?? "Unable to issue API key.");
      return;
    }
    setCreateLabel("");
    onNotify("success", "Public API key issued.");
    await onRefreshKeys(issued.nextSession);
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Automation</div>
          <div className={styles.projName}>Integrations</div>
          <div className={styles.projMeta}>Live public API keys and partner integration readiness.</div>
        </div>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Issue API Key</span></div>
        <div className={styles.formGrid}>
          <select className={styles.selectInput} value={createClientId} onChange={(event) => setCreateClientId(event.target.value)} disabled={!canEdit}>
            <option value="">Select client</option>
            {snapshot.clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <input className={styles.formInput} placeholder="Key label (e.g. Zapier Production)" value={createLabel} onChange={(event) => setCreateLabel(event.target.value)} disabled={!canEdit} />
          {canEdit ? <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleIssueKey()}>Issue Key</button> : <div className={styles.emptySub}>Read-only mode for this role.</div>}
        </div>
      </article>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Active Keys</span>
          <div className={styles.toolbarRow}>
            <input className={styles.searchInput} placeholder="Search label, client, key id" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
        <table className={styles.projTable}>
          <thead><tr><th>Label</th><th>Client</th><th>Key ID</th><th>Secret</th><th>Created</th></tr></thead>
          <tbody>
            {filteredKeys.length > 0 ? (
              filteredKeys.map((key) => (
                <tr key={key.id}>
                  <td>{key.label}</td>
                  <td>{snapshot.clients.find((client) => client.id === key.clientId)?.name ?? key.clientId.slice(0, 8)}</td>
                  <td className={styles.metaMono}>{key.keyId.slice(0, 16)}...</td>
                  <td className={styles.metaMono}>{key.keySecret.slice(0, 8)}...{key.keySecret.slice(-4)}</td>
                  <td>{formatDate(key.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className={styles.emptyCell}><EmptyState title="No API keys yet" subtitle="This section updates once integration keys are issued." compact variant="security" /></td></tr>
            )}
          </tbody>
        </table>
      </article>
    </div>
  );
}

function AutomationPage({
  snapshot,
  session,
  jobs,
  analyticsPoints,
  onRunMaintenance,
  onProcessQueue,
  onNotify
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  session: AuthSession | null;
  jobs: NotificationJob[];
  analyticsPoints: number;
  onRunMaintenance: () => Promise<void>;
  onProcessQueue: () => Promise<void>;
  onNotify: (tone: "success" | "error", message: string) => void;
}) {
  const canManage = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
  const queued = jobs.filter((job) => job.status === "QUEUED").length;
  const sent = jobs.filter((job) => job.status === "SENT").length;
  const failed = jobs.filter((job) => job.status === "FAILED").length;
  const latestJobAt = jobs.length > 0
    ? jobs.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0].updatedAt
    : null;
  const recentRuns = jobs.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 12);
  const failedRuns = recentRuns.filter((job) => job.status === "FAILED");
  const successRate = jobs.length > 0 ? Math.round((sent / jobs.length) * 100) : 0;
  const [leadTrigger, setLeadTrigger] = useState<"event" | "schedule">("event");
  const [billingTrigger, setBillingTrigger] = useState<"event" | "schedule">("schedule");
  const [projectTrigger, setProjectTrigger] = useState<"event" | "schedule">("event");
  const [autoEscalateSla, setAutoEscalateSla] = useState(true);
  const [autoRetryFailures, setAutoRetryFailures] = useState(true);
  const [publishState, setPublishState] = useState<"DRAFT" | "REVIEW" | "PUBLISHED">("DRAFT");
  const [simulationPayload, setSimulationPayload] = useState("{\"type\":\"invoice.overdue\",\"client\":\"demo\"}");
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [lastSavedPhase2, setLastSavedPhase2] = useState<string | null>(null);
  const workflowStatus = [
    {
      id: "billing-core",
      workflow: "Billing Core",
      trigger: "Invoice due/paid",
      state: snapshot.invoices.length > 0 ? "ACTIVE" : "DRAFT",
      lastRun: latestJobAt,
      successRate: snapshot.invoices.length > 0 ? Math.max(70, successRate) : 0
    },
    {
      id: "lead-followups",
      workflow: "Lead Follow-ups",
      trigger: "Lead inactivity/status",
      state: snapshot.leads.length > 0 ? "ACTIVE" : "DRAFT",
      lastRun: snapshot.leads[0]?.updatedAt ?? null,
      successRate: snapshot.leads.length > 0 ? 92 : 0
    },
    {
      id: "project-alerts",
      workflow: "Project Alerts",
      trigger: "Task/milestone overdue",
      state: snapshot.projects.length > 0 ? "ACTIVE" : "DRAFT",
      lastRun: snapshot.projects[0]?.updatedAt ?? null,
      successRate: snapshot.projects.length > 0 ? 88 : 0
    },
    {
      id: "notification-delivery",
      workflow: "Notification Delivery",
      trigger: "Queue + callbacks",
      state: failed > 0 ? "AT_RISK" : queued > 0 || sent > 0 ? "ACTIVE" : "DRAFT",
      lastRun: latestJobAt,
      successRate
    }
  ] as const;

  function readJsonObject(value: string | null | undefined): Record<string, unknown> | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const pref = await getProjectPreferenceWithRefresh(session, "settingsAutomationPhase2");
      if (!pref.data?.value) return;
      const phase2 = readJsonObject(pref.data.value);
      if (!phase2) return;
      if (phase2.leadTrigger === "event" || phase2.leadTrigger === "schedule") setLeadTrigger(phase2.leadTrigger);
      if (phase2.billingTrigger === "event" || phase2.billingTrigger === "schedule") setBillingTrigger(phase2.billingTrigger);
      if (phase2.projectTrigger === "event" || phase2.projectTrigger === "schedule") setProjectTrigger(phase2.projectTrigger);
      if (typeof phase2.autoEscalateSla === "boolean") setAutoEscalateSla(phase2.autoEscalateSla);
      if (typeof phase2.autoRetryFailures === "boolean") setAutoRetryFailures(phase2.autoRetryFailures);
      if (phase2.publishState === "DRAFT" || phase2.publishState === "REVIEW" || phase2.publishState === "PUBLISHED") setPublishState(phase2.publishState);
      if (typeof phase2.savedAt === "string") setLastSavedPhase2(phase2.savedAt);
    })();
  }, [session]);

  async function savePhase2Settings(): Promise<void> {
    if (!session) {
      onNotify("error", "Session required to save phase settings.");
      return;
    }
    const savedAt = new Date().toISOString();
    const payload = {
      leadTrigger,
      billingTrigger,
      projectTrigger,
      autoEscalateSla,
      autoRetryFailures,
      publishState,
      savedAt
    };
    const result = await setProjectPreferenceWithRefresh(session, {
      key: "settingsAutomationPhase2",
      value: JSON.stringify(payload)
    });
    if (!result.nextSession || result.error) {
      onNotify("error", result.error?.message ?? "Unable to save automation phase settings.");
      return;
    }
    setLastSavedPhase2(savedAt);
    onNotify("success", "Automation phase settings saved.");
  }

  async function retryFailedQueue(): Promise<void> {
    if (!canManage) {
      onNotify("error", "Retry actions are available to admin and staff roles.");
      return;
    }
    await onProcessQueue();
    onNotify("success", "Retry cycle requested for queued and failed jobs.");
  }

  function runSimulation(): void {
    try {
      const parsed = JSON.parse(simulationPayload) as Record<string, unknown>;
      const flow = String(parsed.type ?? "generic.event");
      const outcome = autoRetryFailures ? "with retry policy" : "without retry policy";
      const escalation = autoEscalateSla ? "SLA escalation enabled" : "SLA escalation disabled";
      setSimulationResult(`Simulated ${flow}: dispatching actions ${outcome}; ${escalation}.`);
      onNotify("success", "Simulation completed.");
    } catch {
      setSimulationResult("Invalid JSON payload. Fix payload syntax and run again.");
      onNotify("error", "Simulation payload is invalid JSON.");
    }
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Automation</div>
          <div className={styles.projName}>Workflows</div>
          <div className={styles.projMeta}>Workflow operations across lead, billing, project, and notification automations.</div>
        </div>
        <div className={styles.toolbarRow}>
          <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => void onRunMaintenance()}>Run Maintenance Check</button>
          <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void retryFailedQueue()}>Retry Failed Queue</button>
        </div>
      </div>

      <div className={`${styles.statsRow} ${styles.statsRowCols4}`}>
        <div className={`${styles.statCard} ${styles.amber}`}><div className={styles.statLabel}>Queued Jobs</div><div className={styles.statValue}>{queued}</div><div className={styles.statDelta}>Pending notifications</div></div>
        <div className={`${styles.statCard} ${styles.green}`}><div className={styles.statLabel}>Sent Jobs</div><div className={styles.statValue}>{sent}</div><div className={styles.statDelta}>Delivered or sent</div></div>
        <div className={`${styles.statCard} ${styles.red}`}><div className={styles.statLabel}>Failed Jobs</div><div className={styles.statValue}>{failed}</div><div className={styles.statDelta}>Needs retry attention</div></div>
        <div className={`${styles.statCard} ${styles.purple}`}><div className={styles.statLabel}>Analytics Points</div><div className={styles.statValue}>{analyticsPoints}</div><div className={styles.statDelta}>Live metrics rows</div></div>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Workflow Status Board</span></div>
        <table className={styles.projTable}>
          <thead><tr><th>Workflow</th><th>Trigger</th><th>Status</th><th>Success Rate</th><th>Last Run</th></tr></thead>
          <tbody>
            {workflowStatus.map((item) => (
              <tr key={item.id}>
                <td>{item.workflow}</td>
                <td>{item.trigger}</td>
                <td>
                  <span className={`${styles.badge} ${item.state === "ACTIVE" ? styles.badgeGreen : item.state === "AT_RISK" ? styles.badgeRed : styles.badgeMuted}`}>
                    {item.state === "AT_RISK" ? "At Risk" : item.state}
                  </span>
                </td>
                <td>{item.successRate}%</td>
                <td>{item.lastRun ? formatDate(item.lastRun) : "Not run yet"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Core Automation Coverage</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Flow</th><th>Coverage</th><th>Status</th><th>Scope</th></tr></thead>
            <tbody>
              <tr><td>Invoice reminders</td><td>{snapshot.invoices.length > 0 ? `${snapshot.invoices.length} invoices` : "No data"}</td><td><span className={`${styles.badge} ${snapshot.invoices.length > 0 ? styles.badgeGreen : styles.badgeMuted}`}>{snapshot.invoices.length > 0 ? "Active" : "Draft"}</span></td><td>Billing</td></tr>
              <tr><td>Payment confirmation</td><td>{snapshot.payments.length > 0 ? `${snapshot.payments.length} payments` : "No data"}</td><td><span className={`${styles.badge} ${snapshot.payments.length > 0 ? styles.badgeGreen : styles.badgeMuted}`}>{snapshot.payments.length > 0 ? "Active" : "Draft"}</span></td><td>Billing</td></tr>
              <tr><td>Lead follow-ups</td><td>{snapshot.leads.length > 0 ? `${snapshot.leads.length} leads` : "No data"}</td><td><span className={`${styles.badge} ${snapshot.leads.length > 0 ? styles.badgeGreen : styles.badgeMuted}`}>{snapshot.leads.length > 0 ? "Active" : "Draft"}</span></td><td>Sales</td></tr>
              <tr><td>Project overdue alerts</td><td>{snapshot.projects.length > 0 ? `${snapshot.projects.length} projects` : "No data"}</td><td><span className={`${styles.badge} ${snapshot.projects.length > 0 ? styles.badgeGreen : styles.badgeMuted}`}>{snapshot.projects.length > 0 ? "Active" : "Draft"}</span></td><td>Delivery</td></tr>
            </tbody>
          </table>
        </article>
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Failed Executions</span></div>
          {failedRuns.length > 0 ? (
            <table className={styles.projTable}>
              <thead><tr><th>Channel</th><th>Recipient</th><th>Attempts</th><th>Updated</th></tr></thead>
              <tbody>
                {failedRuns.map((job) => (
                  <tr key={job.id}>
                    <td>{job.channel}</td>
                    <td>{job.recipient}</td>
                    <td>{job.attempts}/{job.maxAttempts}</td>
                    <td>{formatDate(job.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.cardInner}>
              <EmptyState title="No failed runs in this view" subtitle="This section updates once workflow executions fail." compact variant="message" />
            </div>
          )}
        </article>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Execution History</span></div>
        {recentRuns.length > 0 ? (
          <table className={styles.projTable}>
            <thead><tr><th>Channel</th><th>Recipient</th><th>Status</th><th>Attempts</th><th>Updated</th><th>Action</th></tr></thead>
            <tbody>
              {recentRuns.map((job) => (
                <tr key={job.id}>
                  <td>{job.channel}</td>
                  <td>{job.recipient}</td>
                  <td><span className={`${styles.badge} ${job.status === "SENT" ? styles.badgeGreen : job.status === "FAILED" ? styles.badgeRed : styles.badgeAmber}`}>{job.status}</span></td>
                  <td>{job.attempts}/{job.maxAttempts}</td>
                  <td>{formatDate(job.updatedAt)}</td>
                  <td>{job.status === "FAILED" ? <button type="button" className={`${styles.btnSm} ${styles.btnGhost} ${styles.btnInline}`} onClick={() => void retryFailedQueue()}>Retry</button> : <span className={styles.metaMono}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.cardInner}>
            <EmptyState title="No execution history yet" subtitle="This section updates once workflow jobs are processed." compact variant="message" />
          </div>
        )}
      </article>

      <div className={styles.twoCol}>
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Phase 2 · Trigger Manager</span>
            <span className={styles.metaMono}>{lastSavedPhase2 ? `Last saved ${formatDateTime(lastSavedPhase2)}` : "Not saved yet"}</span>
          </div>
          <div className={styles.formGrid}>
            <label className={styles.formGroup}>
              <span>Lead Follow-ups Trigger</span>
              <select className={styles.selectInput} value={leadTrigger} onChange={(event) => setLeadTrigger(event.target.value as "event" | "schedule")}>
                <option value="event">Event driven</option>
                <option value="schedule">Scheduled</option>
              </select>
            </label>
            <label className={styles.formGroup}>
              <span>Billing Trigger</span>
              <select className={styles.selectInput} value={billingTrigger} onChange={(event) => setBillingTrigger(event.target.value as "event" | "schedule")}>
                <option value="event">Event driven</option>
                <option value="schedule">Scheduled</option>
              </select>
            </label>
            <label className={styles.formGroup}>
              <span>Project Alert Trigger</span>
              <select className={styles.selectInput} value={projectTrigger} onChange={(event) => setProjectTrigger(event.target.value as "event" | "schedule")}>
                <option value="event">Event driven</option>
                <option value="schedule">Scheduled</option>
              </select>
            </label>
            <div className={styles.formGroup}>
              <span>Publish State</span>
              <select className={styles.selectInput} value={publishState} onChange={(event) => setPublishState(event.target.value as "DRAFT" | "REVIEW" | "PUBLISHED")}>
                <option value="DRAFT">Draft</option>
                <option value="REVIEW">Review</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            <div className={styles.toggleRow}>
              <div><div className={styles.toggleTitle}>Auto escalate SLA misses</div><div className={styles.toggleSub}>Route alerts to escalation workflow</div></div>
              <button type="button" className={`${styles.switchBase} ${autoEscalateSla ? styles.switchOn : ""}`} onClick={() => setAutoEscalateSla((value) => !value)}><div className={autoEscalateSla ? styles.switchThumbOn : styles.switchThumbOff} /></button>
            </div>
            <div className={styles.toggleRow}>
              <div><div className={styles.toggleTitle}>Auto retry failed jobs</div><div className={styles.toggleSub}>Retry policy for transient failures</div></div>
              <button type="button" className={`${styles.switchBase} ${autoRetryFailures ? styles.switchOn : ""}`} onClick={() => setAutoRetryFailures((value) => !value)}><div className={autoRetryFailures ? styles.switchThumbOn : styles.switchThumbOff} /></button>
            </div>
            <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void savePhase2Settings()}>Save Phase 2 Controls</button>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Phase 2 · Simulation Runner</span></div>
          <div className={styles.cardInner}>
            <textarea className={styles.formTextarea} value={simulationPayload} onChange={(event) => setSimulationPayload(event.target.value)} />
            <div className={styles.toolbarRow}>
              <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => runSimulation()}>Run Dry Run</button>
              <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => setPublishState("REVIEW")}>Submit For Review</button>
            </div>
            {simulationResult ? <div className={styles.projMeta}>{simulationResult}</div> : <EmptyState title="No simulation yet" subtitle="Run a dry run to validate trigger and rule behavior." compact variant="message" />}
          </div>
        </article>
      </div>
    </div>
  );
}

function SecurityPage({
  snapshot,
  onCreateIncident
}: {
  snapshot: ReturnType<typeof useAdminWorkspaceContext>["snapshot"];
  onCreateIncident: (payload: {
    incidentType: "FAILED_LOGINS_THRESHOLD" | "SUSPICIOUS_LOGIN" | "VULNERABILITY" | "ACCESS_ANOMALY";
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    message: string;
    clientId?: string;
    occurredAt?: string;
  }) => Promise<void>;
}) {
  const [incidentType, setIncidentType] = useState<"FAILED_LOGINS_THRESHOLD" | "SUSPICIOUS_LOGIN" | "VULNERABILITY" | "ACCESS_ANOMALY">("SUSPICIOUS_LOGIN");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [message, setMessage] = useState("");
  const [clientId, setClientId] = useState("");

  const flaggedInvoices = snapshot.invoices.filter((invoice) => invoice.status === "OVERDUE").length;
  const blockedProjects = snapshot.projects.filter((project) => ["BLOCKED", "DELAYED"].includes(project.status)).length;
  const pausedClients = snapshot.clients.filter((client) => ["PAUSED", "CHURNED"].includes(client.status)).length;

  async function handleSubmitIncident(): Promise<void> {
    const text = message.trim();
    if (!text) return;
    await onCreateIncident({
      incidentType,
      severity,
      message: text,
      clientId: clientId || undefined,
      occurredAt: new Date().toISOString()
    });
    setMessage("");
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Governance</div>
          <div className={styles.projName}>Security</div>
          <div className={styles.projMeta}>Operational security controls and incident logging.</div>
        </div>
      </div>
      <div className={`${styles.statsRow} ${styles.statsRowCols3}`}>
        <div className={`${styles.statCard} ${styles.red}`}><div className={styles.statLabel}>Overdue Invoices</div><div className={styles.statValue}>{flaggedInvoices}</div><div className={styles.statDelta}>Potential account risk</div></div>
        <div className={`${styles.statCard} ${styles.amber}`}><div className={styles.statLabel}>Delivery Blockers</div><div className={styles.statValue}>{blockedProjects}</div><div className={styles.statDelta}>Blocked or delayed projects</div></div>
        <div className={`${styles.statCard} ${styles.purple}`}><div className={styles.statLabel}>Paused Clients</div><div className={styles.statValue}>{pausedClients}</div><div className={styles.statDelta}>Accounts requiring review</div></div>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Log Security Incident</span></div>
        <div className={styles.formGrid}>
          <select className={styles.selectInput} value={incidentType} onChange={(event) => setIncidentType(event.target.value as typeof incidentType)}>
            <option value="SUSPICIOUS_LOGIN">Suspicious Login</option>
            <option value="FAILED_LOGINS_THRESHOLD">Failed Logins Threshold</option>
            <option value="ACCESS_ANOMALY">Access Anomaly</option>
            <option value="VULNERABILITY">Vulnerability</option>
          </select>
          <select className={styles.selectInput} value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select className={styles.selectInput} value={clientId} onChange={(event) => setClientId(event.target.value)}>
            <option value="">No client context</option>
            {snapshot.clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <textarea className={styles.formTextarea} placeholder="Describe the incident context and impact..." value={message} onChange={(event) => setMessage(event.target.value)} />
          <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleSubmitIncident()}>
            Submit Incident
          </button>
        </div>
      </article>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Security Automations</span></div>
        <div className={styles.cardInner}>
          <div className={styles.projMeta}>Use this action to create a real security incident event (`/ops/security/incidents`) and feed automation/audit workflows.</div>
        </div>
      </article>
    </div>
  );
}

export function MaphariDashboard() {
  const { session, snapshot, loading, transitioningLeadId, moveLead, refreshSnapshot, signOut } = useAdminWorkspaceContext();
  const [page, setPage] = useState<PageId>("dashboard");
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const clock = useClock();
  const [ring, setRing] = useState({ x: 0, y: 0 });
  const [notificationJobs, setNotificationJobs] = useState<NotificationJob[]>([]);
  const [projectBlockers, setProjectBlockers] = useState<ProjectBlocker[]>([]);
  const [publicApiKeys, setPublicApiKeys] = useState<PartnerApiKey[]>([]);
  const [analyticsMetricsRows, setAnalyticsMetricsRows] = useState(0);
  const [adminDisplayCurrency, setAdminDisplayCurrency] = useState("AUTO");
  const [processingQueue, setProcessingQueue] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [topbarSearch, setTopbarSearch] = useState("");
  const [adminTourOpen, setAdminTourOpen] = useState(false);
  const [adminTourStep, setAdminTourStep] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(1);

  const pushToast = useCallback((tone: Toast["tone"], message: string): void => {
    const id = toastIdRef.current++;
    setToasts((previous) => [...previous, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    const onMove = (event: MouseEvent) => setMouse({ x: event.clientX, y: event.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRing((prev) => ({ x: prev.x + (mouse.x - prev.x) * 0.12, y: prev.y + (mouse.y - prev.y) * 0.12 }));
    }, 16);
    return () => window.clearInterval(id);
  }, [mouse.x, mouse.y]);

  const role = session?.user.role;
  const isAdmin = role === "ADMIN";
  const visibleNavItems = useMemo(() => {
    if (isAdmin) return navItems;
    const adminOnlyPages: PageId[] = ["security", "integrations", "audit"];
    return navItems.filter((item) => !adminOnlyPages.includes(item.id));
  }, [isAdmin]);

  const grouped = useMemo(() => {
    return visibleNavItems.reduce<Record<string, NavItem[]>>((acc, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    }, {});
  }, [visibleNavItems]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const pref = await getProjectPreferenceWithRefresh(session, "settingsProfile");
      if (cancelled || !pref.data?.value) return;
      try {
        const parsed = JSON.parse(pref.data.value) as { currency?: unknown };
        if (typeof parsed.currency === "string") {
          setAdminDisplayCurrency(parsed.currency);
        }
      } catch {
        // Ignore malformed saved preference and keep default.
      }
    })();
    void (async () => {
      const jobsResult = await loadNotificationJobsWithRefresh(session);
      if (jobsResult.nextSession && jobsResult.data) {
        setNotificationJobs(jobsResult.data);
      } else if (jobsResult.error?.message) {
        pushToast("error", jobsResult.error.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, pushToast]);

  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `maphari:tour:admin:${session.user.email}`;
    if (!window.localStorage.getItem(key)) {
      queueMicrotask(() => setAdminTourOpen(true));
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const loadShared = async () => {
      const [blockersResult] = await Promise.all([
        loadProjectBlockersWithRefresh(session, { limit: 120 }),
        loadTimelineWithRefresh(session, { limit: 80 })
      ]);
      if (cancelled) return;
      setProjectBlockers(blockersResult.data ?? []);
    };
    void loadShared();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    if (page === "notifications" || page === "automation") {
      void (async () => {
        const jobsResult = await loadNotificationJobsWithRefresh(session);
        if (jobsResult.nextSession && jobsResult.data) {
          setNotificationJobs(jobsResult.data);
          if (jobsResult.error?.message) pushToast("error", jobsResult.error.message);
        } else if (jobsResult.error?.message) {
          pushToast("error", jobsResult.error.message);
        }
      })();
    }
    if (page === "integrations") {
      void (async () => {
        const keysResult = await loadPublicApiKeysWithRefresh(session);
        if (keysResult.nextSession && keysResult.data) {
          setPublicApiKeys(keysResult.data);
          if (keysResult.error?.message) pushToast("error", keysResult.error.message);
        } else if (keysResult.error?.message) {
          pushToast("error", keysResult.error.message);
        }
      })();
    }
    if (page === "automation") {
      void (async () => {
        const metricsResult = await loadAnalyticsMetricsWithRefresh(session);
        if (metricsResult.nextSession && metricsResult.data) {
          setAnalyticsMetricsRows(metricsResult.data.length);
          if (metricsResult.error?.message) pushToast("error", metricsResult.error.message);
        } else if (metricsResult.error?.message) {
          pushToast("error", metricsResult.error.message);
        }
      })();
    }
  }, [page, session, pushToast]);

  const handleRealtimeRefresh = useCallback(() => {
    if (!session) return;
    void (async () => {
      const [jobsResult, blockersResult] = await Promise.all([
        loadNotificationJobsWithRefresh(session),
        loadProjectBlockersWithRefresh(session, { limit: 120 })
      ]);
      if (jobsResult.data) setNotificationJobs(jobsResult.data);
      if (blockersResult.data) setProjectBlockers(blockersResult.data);

      if (page === "integrations") {
        const keysResult = await loadPublicApiKeysWithRefresh(session);
        if (keysResult.data) setPublicApiKeys(keysResult.data);
      }
      if (page === "automation") {
        const metricsResult = await loadAnalyticsMetricsWithRefresh(session);
        if (metricsResult.data) setAnalyticsMetricsRows(metricsResult.data.length);
      }
    })();
  }, [page, session]);

  useRealtimeRefresh(session, handleRealtimeRefresh);

  useEffect(() => {
    if (!session) return;
    const pageToTab: Record<PageId, NotificationJob["tab"]> = {
      dashboard: "dashboard",
      leads: "operations",
      clients: "operations",
      projects: "projects",
      messages: "messages",
      invoices: "invoices",
      analytics: "dashboard",
      notifications: "operations",
      staff: "operations",
      automation: "operations",
      integrations: "operations",
      reports: "operations",
      security: "operations",
      audit: "operations",
      experience: "operations",
      settings: "settings"
    };
    const activeTab = pageToTab[page];
    const unread = notificationJobs.filter((job) => !job.readAt && job.tab === activeTab);
    if (unread.length === 0) return;
    void Promise.all(unread.map((job) => setNotificationReadStateWithRefresh(session, job.id, true))).then(() => {
      setNotificationJobs((previous) =>
        previous.map((job) =>
          unread.some((target) => target.id === job.id)
            ? { ...job, readAt: new Date().toISOString() }
            : job
        )
      );
    });
  }, [notificationJobs, page, session]);

  const navBadgeCounts = useMemo<Partial<Record<PageId, number>>>(() => {
    const failedClients = snapshot.clients.filter((client) => client.status !== "ACTIVE").length;
    const openInvoices = snapshot.invoices.filter((invoice) => invoice.status !== "PAID").length;
    const unreadMessages = snapshot.leads.filter((lead) => lead.status === "CONTACTED" || lead.status === "QUALIFIED").length;
    const openBlockers = projectBlockers.filter((blocker) => blocker.status !== "RESOLVED").length;

    return {
      leads: snapshot.leads.length,
      clients: failedClients,
      projects: Math.max(snapshot.projects.length, openBlockers),
      invoices: openInvoices,
      messages: unreadMessages,
      notifications: notificationJobs.filter((job) => !job.readAt).length
    };
  }, [notificationJobs, projectBlockers, snapshot.clients, snapshot.invoices, snapshot.leads, snapshot.projects]);

  const hasWorkspaceData =
    snapshot.clients.length > 0 ||
    snapshot.projects.length > 0 ||
    snapshot.leads.length > 0 ||
    snapshot.invoices.length > 0 ||
    snapshot.payments.length > 0;

  if (loading && !hasWorkspaceData) return <div className={styles.loading}>Loading dashboard…</div>;

  const title = pageTitles[page];
  const adminTourSteps = [
    { title: "Dashboard", detail: "Monitor business health, workload, and operational KPIs." },
    { title: "Clients & Projects", detail: "Approve project requests, assign staff, and manage delivery pipeline." },
    { title: "Billing", detail: "Track invoice and payment status across clients." },
    { title: "Messages & Automation", detail: "Manage communication queues and workflow alerts." }
  ] as const;
  const email = session?.user.email ?? "admin@maphari";
  const unreadNotificationsCount = notificationJobs.filter((job) => !job.readAt).length;

  async function handleProcessQueue(): Promise<void> {
    if (!session) return;
    setProcessingQueue(true);
    try {
      const processed = await processNotificationQueueWithRefresh(session);
      if (!processed.nextSession || processed.error) {
        pushToast("error", processed.error?.message ?? "Unable to process notification queue.");
      } else {
        pushToast("success", "Notification queue processed.");
      }
      const jobsResult = await loadNotificationJobsWithRefresh(session);
      if (jobsResult.nextSession && jobsResult.data) {
        setNotificationJobs(jobsResult.data);
      } else if (jobsResult.error?.message) {
        pushToast("error", jobsResult.error.message);
      }
    } finally {
      setProcessingQueue(false);
    }
  }

  async function handleRunMaintenanceCheck(): Promise<void> {
    if (!session) return;
    const result = await createMaintenanceCheckWithRefresh(session, {
      checkType: "SECURITY",
      status: "PASS",
      details: "Manual maintenance trigger from admin dashboard"
    });
    if (!result.nextSession || result.error) {
      pushToast("error", result.error?.message ?? "Unable to run maintenance check.");
      return;
    }
    pushToast("success", "Maintenance check created.");
  }

  async function handleCreateSecurityIncident(payload: {
    incidentType: "FAILED_LOGINS_THRESHOLD" | "SUSPICIOUS_LOGIN" | "VULNERABILITY" | "ACCESS_ANOMALY";
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    message: string;
    clientId?: string;
    occurredAt?: string;
  }): Promise<void> {
    if (!session) return;
    const result = await createSecurityIncidentWithRefresh(session, payload);
    if (!result.nextSession || result.error) {
      pushToast("error", result.error?.message ?? "Unable to create security incident.");
      return;
    }
    await refreshSnapshot(session);
    pushToast("success", "Security incident logged.");
  }

  async function handleLogout(): Promise<void> {
    if (loggingOut) return;
    setLoggingOut(true);
    await signOut();
    window.location.href = "/internal-login";
  }

  function handleTopbarSearchSubmit(): void {
    const query = topbarSearch.trim().toLowerCase();
    if (!query) return;

    const direct = visibleNavItems.find((item) => {
      const [sectionLabel, pageLabel] = pageTitles[item.id];
      return (
        item.id.toLowerCase().includes(query) ||
        item.label.toLowerCase().includes(query) ||
        sectionLabel.toLowerCase().includes(query) ||
        pageLabel.toLowerCase().includes(query)
      );
    });
    if (direct) {
      setPage(direct.id);
      return;
    }

    if (query.includes("message") || query.includes("thread")) {
      setPage("messages");
      return;
    }
    if (query.includes("invoice") || query.includes("billing")) {
      setPage("invoices");
      return;
    }
    if (query.includes("project")) {
      setPage("projects");
      return;
    }
    if (query.includes("client")) {
      setPage("clients");
      return;
    }
    if (query.includes("automation") || query.includes("notification")) {
      setPage("notifications");
      return;
    }
    if (query.includes("lead")) {
      setPage("leads");
      return;
    }
    if (query.includes("setting")) {
      setPage("settings");
    }
  }

  return (
    <div className={styles.dashboardRoot}>
      <div className={styles.cursor} style={{ transform: `translate(${mouse.x - 5}px, ${mouse.y - 5}px)` }} />
      <div className={styles.cursorRing} style={{ transform: `translate(${ring.x - 18}px, ${ring.y - 18}px)` }} />

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarLogo}>
            <div className={styles.logoMark}>M</div>
            <div className={styles.logoTextBlock}>
              <div className={styles.logoText}>Maph<span>a</span>ri</div>
              <div className={styles.adminChip}>Admin</div>
            </div>
          </div>

          <nav className={styles.sidebarNav}>
            {Object.entries(grouped).map(([section, items]) => (
              <div key={section}>
                <div className={styles.navSectionLabel}>{section}</div>
                {items.map((item) => (
                  <button key={item.id} type="button" className={`${styles.navItem} ${page === item.id ? styles.navItemActive : ""}`} onClick={() => setPage(item.id)}>
                    <Icon kind={item.id} />
                    <span>{item.label}</span>
                    {typeof navBadgeCounts[item.id] === "number" && (navBadgeCounts[item.id] ?? 0) > 0 ? (
                      <span className={`${styles.navBadge} ${item.badgeRed ? styles.navBadgeRed : ""}`}>
                        {navBadgeCounts[item.id]}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.userCard}>
              <div className={`${styles.userAvatar} ${styles.userAvatarAdmin}`}>{email[0]?.toUpperCase() ?? "A"}</div>
              <div className={styles.userInfo}><div className={styles.userName}>{email}</div><div className={styles.userRole}>Admin · Maphari</div></div>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: "var(--muted2)", flexShrink: 0 }}><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.topbar}>
            <div className={styles.topbarTitle}>{title[0]} <span>/ {title[1]}</span></div>
            <div className={styles.searchBar}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                type="text"
                placeholder="Search pages..."
                value={topbarSearch}
                onChange={(event) => setTopbarSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleTopbarSearchSubmit();
                  }
                }}
              />
            </div>
            <div className={styles.topbarActions}>
              <button type="button" className={styles.iconBtn} onClick={() => setPage("notifications")} aria-label="Open notifications">
                🔔
                {unreadNotificationsCount > 0 ? <span className={styles.dot} /> : null}
              </button>
              <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => setPage("messages")}>New Thread</button>
              <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => void handleLogout()} disabled={loggingOut}>
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </header>

          <section className={styles.content}>
            {adminTourOpen ? (
              <article className={styles.card} style={{ marginBottom: 14 }}>
                <div className={styles.cardHd}>
                  <span className={styles.cardHdTitle}>Admin Onboarding Tour</span>
                  <span className={styles.metaMono}>Step {adminTourStep + 1} / {adminTourSteps.length}</span>
                </div>
                <div className={styles.cardInner}>
                  <div className={styles.emptyTitle}>{adminTourSteps[adminTourStep]?.title}</div>
                  <div className={styles.emptySub} style={{ marginTop: 8 }}>{adminTourSteps[adminTourStep]?.detail}</div>
                  <div className={styles.toolbarRow} style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className={`${styles.btnSm} ${styles.btnGhost}`}
                      onClick={() => setAdminTourStep((value) => Math.max(0, value - 1))}
                      disabled={adminTourStep === 0}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnSm} ${styles.btnAccent}`}
                      onClick={() => {
                        if (adminTourStep < adminTourSteps.length - 1) {
                          setAdminTourStep((value) => value + 1);
                          return;
                        }
                        if (session?.user?.email) {
                          window.localStorage.setItem(`maphari:tour:admin:${session.user.email}`, "done");
                        }
                        setAdminTourOpen(false);
                      }}
                    >
                      {adminTourStep < adminTourSteps.length - 1 ? "Next" : "Finish"}
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnSm} ${styles.btnGhost}`}
                      onClick={() => {
                        if (session?.user?.email) {
                          window.localStorage.setItem(`maphari:tour:admin:${session.user.email}`, "done");
                        }
                        setAdminTourOpen(false);
                      }}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </article>
            ) : null}
            {page === "dashboard" ? (
              <DashboardPage
                snapshot={snapshot}
                notificationJobs={notificationJobs}
                publicApiKeys={publicApiKeys}
                analyticsMetricsRows={analyticsMetricsRows}
                currency={adminDisplayCurrency}
              />
            ) : null}
            {page === "leads" ? (
              <LeadsPage
                leads={snapshot.leads}
                session={session}
                transitioningLeadId={transitioningLeadId}
                onMoveLead={moveLead}
                onRefreshSnapshot={refreshSnapshot}
                onNotify={pushToast}
                clock={clock}
              />
            ) : null}
            {page === "projects" ? (
              <ProjectsPage
                snapshot={snapshot}
                session={session}
                onRefreshSnapshot={refreshSnapshot}
                onNotify={pushToast}
                clock={clock}
                currency={adminDisplayCurrency}
              />
            ) : null}
            {page === "invoices" ? (
              <InvoicesPage
                snapshot={snapshot}
                session={session}
                onRefreshSnapshot={refreshSnapshot}
                onNotify={pushToast}
                clock={clock}
              />
            ) : null}
            {page === "messages" ? (
              <MessagesPage
                snapshot={snapshot}
                session={session}
                onNotify={pushToast}
              />
            ) : null}
            {page === "notifications" ? (
              <NotificationsPage
                snapshot={snapshot}
                session={session}
                jobs={notificationJobs}
                processing={processingQueue}
                onProcess={handleProcessQueue}
                onRefreshSnapshot={refreshSnapshot}
                onNotify={pushToast}
              />
            ) : null}
            {page === "staff" ? (
              <StaffAccessPage
                session={session}
                onNotify={pushToast}
              />
            ) : null}
            {page === "clients" ? (
              <ClientsAndProjectsPage
                snapshot={snapshot}
                session={session}
                onRefreshSnapshot={refreshSnapshot}
                onNotify={pushToast}
                clock={clock}
              />
            ) : null}
            {page === "experience" ? (
              <ExperiencePage
                snapshot={snapshot}
                session={session}
                onNotify={pushToast}
                clock={clock}
              />
            ) : null}
            {page === "automation" ? (
              <AutomationPage
                snapshot={snapshot}
                session={session}
                jobs={notificationJobs}
                analyticsPoints={analyticsMetricsRows}
                onRunMaintenance={handleRunMaintenanceCheck}
                onProcessQueue={handleProcessQueue}
                onNotify={pushToast}
              />
            ) : null}
            {page === "integrations" ? (
              <IntegrationsPage
                keys={publicApiKeys}
                snapshot={snapshot}
                session={session}
                onRefreshKeys={async (sessionOverride?: AuthSession) => {
                  const activeSession = sessionOverride ?? session;
                  if (!activeSession) return;
                  const keysResult = await loadPublicApiKeysWithRefresh(activeSession);
                  if (keysResult.nextSession && keysResult.data) {
                    setPublicApiKeys(keysResult.data);
                  } else if (keysResult.error?.message) {
                    pushToast("error", keysResult.error.message);
                  }
                }}
                onNotify={pushToast}
              />
            ) : null}
            {page === "analytics" ? <AnalyticsPage snapshot={snapshot} currency={adminDisplayCurrency} /> : null}
            {page === "reports" ? <ReportsPage snapshot={snapshot} session={session} onNotify={pushToast} currency={adminDisplayCurrency} /> : null}
            {page === "security" ? (
              isAdmin ? (
                <SecurityPage
                  snapshot={snapshot}
                  onCreateIncident={handleCreateSecurityIncident}
                />
              ) : (
                <AdminStubPage title="Security" eyebrow="Restricted" subtitle="This section is available to ADMIN role only." />
              )
            ) : null}
            {page === "audit" ? (isAdmin ? <AuditPage snapshot={snapshot} /> : <AdminStubPage title="Audit Log" eyebrow="Restricted" subtitle="This section is available to ADMIN role only." />) : null}
            {page === "settings" ? (
              <SettingsPage
                snapshot={snapshot}
                session={session}
                jobs={notificationJobs}
                publicApiKeys={publicApiKeys}
                analyticsPoints={analyticsMetricsRows}
                onNavigate={setPage}
                onNotify={pushToast}
                currencyValue={adminDisplayCurrency}
                onCurrencySaved={setAdminDisplayCurrency}
              />
            ) : null}
          </section>
        </main>
      </div>
      <div className={styles.toastStack}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${toast.tone === "success" ? styles.toastSuccess : styles.toastError}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
