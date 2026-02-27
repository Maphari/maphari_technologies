"use client";

import { useMemo, useState } from "react";
import { cx, styles } from "../style";
import { formatMoney } from "../utils";
import type { PortalInvoice, PortalProject } from "../../../../lib/api/portal";

type ClientReportsPageProps = {
  active: boolean;
  invoices?: PortalInvoice[];
  projects?: PortalProject[];
  allMilestones?: Array<{ milestone: { status: string; updatedAt: string }; projectId: string }>;
  convertMoney?: (cents: number, currency: string) => number;
  displayCurrency?: string;
};

type RangeLabel = "This Week" | "This Month" | "Last Month" | "Q1 2026" | "Custom";

const STATIC_BAR_DATA = [
  { lbl: "Oct", inv: 28000, hrs: 148, ms: 3 },
  { lbl: "Nov", inv: 35000, hrs: 162, ms: 4 },
  { lbl: "Dec", inv: 18000, hrs: 90,  ms: 2 },
  { lbl: "Jan", inv: 42000, hrs: 180, ms: 5 },
  { lbl: "Feb", inv: 61000, hrs: 210, ms: 6 }
] as const;

const STATIC_TIME_LOG = [
  { task: "Stripe Payment Integration",   project: "Client Portal v2", who: "Thabo K.",   hrs: 18.5, date: "Feb 19", pct: 74 },
  { task: "Figma Design — Screen 9–14",   project: "Client Portal v2", who: "Lerato M.",  hrs: 12,   date: "Feb 18", pct: 48 },
  { task: "API Endpoint Documentation",   project: "Lead Pipeline",    who: "Thabo K.",   hrs: 6,    date: "Feb 16", pct: 24 },
  { task: "UAT Checklist Preparation",    project: "Lead Pipeline",    who: "Nomsa D.",   hrs: 4.5,  date: "Feb 17", pct: 18 },
  { task: "Sprint Planning & Backlog",    project: "All Projects",     who: "Aisha P.",   hrs: 8,    date: "Feb 14", pct: 32 },
  { task: "Load Testing — Staging",       project: "Lead Pipeline",    who: "James M.",   hrs: 5,    date: "Feb 18", pct: 20 }
] as const;

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const DONUT_COLORS = ["var(--accent)", "var(--purple)", "var(--amber)", "var(--muted2)", "var(--green)"] as const;

function DonutChart({ data, size = 120 }: { data: ReadonlyArray<{ lbl: string; pct: number; color: string }>; size?: number }) {
  const r = 44;
  const cx2 = size / 2;
  const cy2 = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map((e) => {
    const dash = (e.pct / 100) * circ;
    const s = { ...e, dash, gap: circ - dash, offset };
    offset += dash;
    return s;
  });
  const totalPct = data.reduce((s, e) => s + e.pct, 0);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={cx2} cy={cy2} r={r} fill="none" stroke="var(--muted3)" strokeWidth="14" />
      {slices.map((s) => (
        <circle
          key={s.lbl}
          cx={cx2} cy={cy2} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="14"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset + circ / 4}
          style={{ transition: "stroke-dasharray .8s cubic-bezier(.23,1,.32,1)" }}
        />
      ))}
      <text x={cx2} y={cy2 - 4} textAnchor="middle" fill="var(--text)" fontSize="13" fontWeight="800" fontFamily="Syne">{totalPct}%</text>
      <text x={cx2} y={cy2 + 12} textAnchor="middle" fill="var(--muted)" fontSize="8" fontFamily="DM Mono">allocated</text>
    </svg>
  );
}

function BarChart({ children, height = 140 }: { children: React.ReactNode; height?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height }}>
      {children}
    </div>
  );
}

function BarCol({ label, value, height, color }: { label: string; value: string; height: string; color: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
      <div style={{ fontFamily: "var(--font-dm-sans), monospace", fontSize: "0.54rem", color: "var(--muted)" }}>{value}</div>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
        <div style={{ width: "100%", background: color, borderRadius: "2px 2px 0 0", minHeight: 2, height, transition: "height 0.6s" }} />
      </div>
      <div style={{ fontFamily: "var(--font-dm-sans), monospace", fontSize: "0.52rem", color: "var(--muted2)", whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
}

export function ClientReportsPage({
  active,
  invoices,
  projects,
  allMilestones,
  convertMoney,
  displayCurrency = "ZAR"
}: ClientReportsPageProps) {
  const [activeRange, setActiveRange] = useState<RangeLabel>("This Month");

  /* ── Dynamic bar data from real invoices (last 5 months) ── */
  const barData = useMemo(() => {
    if (!invoices?.length) return STATIC_BAR_DATA.map((b) => ({ lbl: b.lbl, inv: b.inv, ms: b.ms }));
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthInv = invoices
        .filter((inv) => {
          const issued = new Date(inv.issuedAt ?? inv.createdAt);
          return issued.getMonth() === month && issued.getFullYear() === year;
        })
        .reduce(
          (sum, inv) => sum + (convertMoney ? convertMoney(inv.amountCents, inv.currency) : inv.amountCents / 100),
          0
        );
      const monthMs = (allMilestones ?? []).filter((e) => {
        if (e.milestone.status !== "COMPLETED") return false;
        const completed = new Date(e.milestone.updatedAt);
        return completed.getMonth() === month && completed.getFullYear() === year;
      }).length;
      return { lbl: MONTH_NAMES[month], inv: monthInv, ms: monthMs };
    });
  }, [invoices, allMilestones, convertMoney]);

  const maxInv = Math.max(...barData.map((r) => r.inv), 1);
  const maxMs = Math.max(...barData.map((r) => r.ms), 1);

  /* ── Donut data from real project budget allocation ── */
  const donutData = useMemo(() => {
    if (!projects?.length) {
      return [
        { lbl: "Client Portal v2",  pct: 48, color: "var(--accent)" as const },
        { lbl: "Lead Pipeline",     pct: 32, color: "var(--purple)" as const },
        { lbl: "Automation Suite",  pct: 12, color: "var(--amber)" as const },
        { lbl: "Admin & Misc",      pct: 8,  color: "var(--muted2)" as const }
      ];
    }
    const totalBudget = projects.reduce((sum, p) => sum + p.budgetCents, 0);
    if (totalBudget === 0) return [{ lbl: "No budget data", pct: 100, color: "var(--muted3)" as const }];
    const top = projects.slice(0, 4);
    const slices = top.map((p, i) => ({
      lbl: p.name,
      pct: Math.round((p.budgetCents / totalBudget) * 100),
      color: DONUT_COLORS[i % DONUT_COLORS.length] as string
    }));
    // ensure percentages sum to 100
    const assigned = slices.reduce((s, e) => s + e.pct, 0);
    if (slices.length > 0 && assigned < 100) slices[0].pct += 100 - assigned;
    return slices;
  }, [projects]);

  /* ── KPI stats from real data ── */
  const kpiStats = useMemo(() => {
    const hasRealData = Boolean(invoices?.length ?? projects?.length);
    if (!hasRealData) {
      return [
        { label: "Invoiced",          value: "R 61,000",  delta: "↑ 18% vs last month", bar: styles.statBarAccent, deltaClass: styles.statDeltaUp },
        { label: "Hours Logged",      value: "54h",        delta: "↑ 14% vs last month", bar: styles.statBarPurple, deltaClass: styles.statDeltaUp },
        { label: "Milestones Closed", value: "3",          delta: "Same as last month",  bar: styles.statBarGreen,  deltaClass: "" },
        { label: "Delivery Velocity", value: "+14%",       delta: "On track for Mar 14", bar: styles.statBarAmber,  deltaClass: styles.statDeltaUp }
      ];
    }
    const totalInvoiced = (invoices ?? []).reduce(
      (sum, inv) => sum + (convertMoney ? convertMoney(inv.amountCents, inv.currency) : inv.amountCents / 100),
      0
    );
    const completedMs = (allMilestones ?? []).filter((e) => e.milestone.status === "COMPLETED").length;
    const activeProjects = (projects ?? []).filter((p) => p.status === "IN_PROGRESS").length;
    const avgProgress = projects?.length
      ? Math.round(projects.reduce((s, p) => s + (p.progressPercent ?? 0), 0) / projects.length)
      : 0;
    return [
      { label: "Total Invoiced",     value: formatMoney(totalInvoiced, displayCurrency),  delta: `${(invoices ?? []).length} invoice${(invoices ?? []).length === 1 ? "" : "s"}`, bar: styles.statBarAccent, deltaClass: styles.statDeltaUp },
      { label: "Active Projects",    value: String(activeProjects),                         delta: `${(projects ?? []).length} total`,                                              bar: styles.statBarPurple, deltaClass: "" },
      { label: "Milestones Closed",  value: String(completedMs),                            delta: "Total completed",                                                              bar: styles.statBarGreen,  deltaClass: completedMs > 0 ? styles.statDeltaUp : "" },
      { label: "Avg. Progress",      value: `${avgProgress}%`,                              delta: "Across all projects",                                                          bar: styles.statBarAmber,  deltaClass: avgProgress >= 70 ? styles.statDeltaUp : "" }
    ];
  }, [invoices, projects, allMilestones, convertMoney, displayCurrency]);

  /* ── ROI cards ── */
  const roiCards = useMemo(() => {
    const hasRealData = Boolean(invoices?.length);
    const totalInvoiced = hasRealData
      ? (invoices ?? []).reduce(
          (sum, inv) => sum + (convertMoney ? convertMoney(inv.amountCents, inv.currency) : inv.amountCents / 100),
          0
        )
      : 184000;
    return [
      { label: "Total Investment",          value: formatMoney(totalInvoiced, displayCurrency),   desc: `Invoiced across ${(projects ?? []).length || 3} project${(projects ?? []).length === 1 ? "" : "s"}. Payments tracked in the invoices section.`, bar: styles.statBarAccent },
      { label: "Estimated Value Delivered", value: "2.1×",    desc: "Projected impact from portal launch, pipeline automation, and operational improvements.", bar: styles.statBarGreen },
      { label: "ROI Multiple",              value: "Pending",  desc: "ROI analysis will be generated once milestone delivery data is available.", bar: styles.statBarPurple }
    ];
  }, [invoices, projects, convertMoney, displayCurrency]);

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-reports">
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Intelligence</div>
          <div className={styles.pageTitle}>Reports</div>
          <div className={styles.pageSub}>
            Project performance, time logs, ROI, and milestone KPIs — all in one view.
          </div>
        </div>
        <div className={styles.headerRight}>
          <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}>
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Date range filter bar */}
      <div className={styles.filterBar}>
        {(["This Week", "This Month", "Last Month", "Q1 2026", "Custom"] as const).map((range) => (
          <button
            key={range}
            type="button"
            className={cx(styles.filterTab, activeRange === range && styles.filterTabActive)}
            onClick={() => setActiveRange(range)}
          >
            {range}
          </button>
        ))}
        {activeRange === "Custom" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8 }}>
            <input type="date" title="start date" className={styles.topbarSelect} defaultValue="2026-01-01" />
            <span className={styles.tableMuted}>→</span>
            <input type="date" title="end date" className={styles.topbarSelect} defaultValue="2026-02-21" />
          </div>
        ) : null}
      </div>

      {/* KPI stat grid */}
      <div className={styles.statGrid}>
        {kpiStats.map((stat, i) => (
          <div key={stat.label} className={styles.statCard} style={{ "--i": i } as React.CSSProperties}>
            <div className={cx(styles.statBar, stat.bar)} />
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={cx(styles.statDelta, stat.deltaClass)}>{stat.delta}</div>
          </div>
        ))}
      </div>

      {/* Page body */}
      <div className={styles.pageBody}>

        {/* Charts */}
        <div className={styles.cols2Main}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Invoice Revenue Trend</div>
                <div className={styles.cardSub}>Monthly invoiced amounts across all projects</div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <BarChart height={140}>
                {barData.map((bar, i) => (
                  <BarCol
                    key={bar.lbl}
                    label={bar.lbl}
                    value={bar.inv >= 1000 ? `${displayCurrency === "ZAR" ? "R" : displayCurrency} ${(bar.inv / 1000).toFixed(0)}k` : bar.inv > 0 ? formatMoney(bar.inv, displayCurrency) : "–"}
                    height={`${(bar.inv / maxInv) * 100}%`}
                    color={i === barData.length - 1 ? "var(--accent)" : "var(--muted3)"}
                  />
                ))}
              </BarChart>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Budget by Project</div>
                <div className={styles.cardSub}>{projects?.length ? "Project budget allocation" : "Hours distribution this month"}</div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <DonutChart data={donutData} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {donutData.map((item) => (
                    <div key={item.lbl} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                      <div className={styles.tableMonospace} style={{ flex: 1, color: "var(--text)", fontSize: "0.72rem" }}>{item.lbl}</div>
                      <div className={styles.tableMonospace}>{item.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary charts */}
        <div className={styles.cols2}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Milestone Velocity</div>
                <div className={styles.cardSub}>Milestones completed per month</div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <BarChart height={100}>
                {barData.map((bar, i) => (
                  <BarCol
                    key={`${bar.lbl}-ms`}
                    label={bar.lbl}
                    value={bar.ms > 0 ? String(bar.ms) : "–"}
                    height={`${(bar.ms / maxMs) * 100}%`}
                    color={i === barData.length - 1 ? "var(--purple)" : "var(--muted3)"}
                  />
                ))}
              </BarChart>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Project Progress</div>
                <div className={styles.cardSub}>Completion % per active project</div>
              </div>
            </div>
            <div className={styles.cardBody}>
              {projects?.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {projects.slice(0, 5).map((p) => (
                    <div key={p.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span className={styles.tableMonospace} style={{ fontSize: "0.72rem", color: "var(--text)" }}>{p.name}</span>
                        <span className={styles.tableMonospace}>{p.progressPercent ?? 0}%</span>
                      </div>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${p.progressPercent ?? 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <BarChart height={100}>
                  {STATIC_BAR_DATA.map((bar, i) => (
                    <BarCol
                      key={`${bar.lbl}-hrs`}
                      label={bar.lbl}
                      value={`${bar.hrs}h`}
                      height={`${(bar.hrs / 210) * 100}%`}
                      color={i === STATIC_BAR_DATA.length - 1 ? "var(--green)" : "var(--muted3)"}
                    />
                  ))}
                </BarChart>
              )}
            </div>
          </div>
        </div>

        {/* ROI cards */}
        <div>
          <div className={styles.sectionTitle}>ROI & Value Delivered</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 12 }}>
            {roiCards.map((roi) => (
              <div key={roi.label} className={styles.card} style={{ position: "relative", overflow: "hidden" }}>
                <div className={cx(styles.statBar, roi.bar)} />
                <div className={styles.cardBody} style={{ paddingTop: 20 }}>
                  <div className={styles.statLabel}>{roi.label}</div>
                  <div className={styles.statValue} style={{ fontSize: "1.4rem" }}>{roi.value}</div>
                  <p className={styles.pageSub} style={{ marginTop: 6 }}>{roi.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time log table */}
        <div>
          <div className={styles.sectionTitle}>Time Log — This Month</div>
          <div className={styles.tableWrap} style={{ marginTop: 12 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Who</th>
                  <th>Hours</th>
                  <th>Date</th>
                  <th>% of Month</th>
                </tr>
              </thead>
              <tbody>
                {STATIC_TIME_LOG.map((row) => (
                  <tr key={row.task}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{row.task}</div>
                      <div className={styles.tableMonospace}>{row.project}</div>
                    </td>
                    <td className={styles.tableMonospace}>{row.who}</td>
                    <td className={styles.tableMonospace}>{row.hrs}h</td>
                    <td className={styles.tableMonospace}>{row.date}</td>
                    <td>
                      <div className={styles.progressTrack} style={{ marginBottom: 3 }}>
                        <div className={styles.progressFill} style={{ width: `${row.pct}%` }} />
                      </div>
                      <div className={styles.tableMonospace} style={{ fontSize: "0.56rem" }}>{row.pct}%</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
              <span style={{ fontFamily: "var(--font-dm-sans), monospace", fontSize: "0.72rem", color: "var(--accent)", fontWeight: 700 }}>
                {STATIC_TIME_LOG.reduce((s, r) => s + r.hrs, 0).toFixed(1)}h logged this month
              </span>
            </div>
          </div>
        </div>

        {/* Export row */}
        <div>
          <div className={styles.sectionTitle}>Export & Share</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            {[
              { icon: "📄", label: "Export PDF Report" },
              { icon: "📊", label: "Export CSV Data" },
              { icon: "📧", label: "Email to Stakeholders" },
              { icon: "🔗", label: "Shareable Link" },
              { icon: "📅", label: "Schedule Weekly Digest" }
            ].map((item) => (
              <button key={item.label} type="button" className={cx(styles.button, styles.buttonGhost)}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
