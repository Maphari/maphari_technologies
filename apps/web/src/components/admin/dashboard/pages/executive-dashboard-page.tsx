// ════════════════════════════════════════════════════════════════════════════
// executive-dashboard-page.tsx — Admin executive dashboard wired to real API
// Data   : loadAdminSnapshotWithRefresh → clients, projects, invoices, payments
//          loadAllStaffWithRefresh       → staff headcount
// Layout : Command Brief — hero strip / KPI row / activity feed + tabbed detail
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";
import widgetStyles from "@/app/style/admin/widgets.module.css";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminClient, AdminProject, AdminInvoice } from "../../../../lib/api/admin/types";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import { loadAllStaffWithRefresh } from "../../../../lib/api/admin/hr";
import { loadAdminContractsWithRefresh, type LegalContract } from "../../../../lib/api/admin/contracts";
import { loadMrrHistoryWithRefresh, type MrrHistoryPoint } from "../../../../lib/api/admin/billing";
import type { PageId } from "../config";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_ABBREVS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function centsToK(cents: number): string {
  return `R${(cents / 100_000).toFixed(0)}k`;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function Sparkline({ data, color, height = 40, width = 100 }: { data: number[]; color: string; height?: number; width?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className={styles.exdSparkSvg}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return i === data.length - 1 ? <circle key={i} cx={x} cy={y} r="3.5" fill={color} /> : null;
      })}
    </svg>
  );
}

const tabs = ["overview", "financial", "clients", "team", "alerts"] as const;
type Tab = (typeof tabs)[number];

function healthClass(score: number): string {
  if (score >= 70) return "colorAccent";
  if (score >= 50) return "colorAmber";
  return "colorRed";
}

function dotClass(idx: number): string {
  const classes = [styles.exdDotAccent, styles.exdDotBlue, styles.exdDotPurple, styles.exdDotAmber, styles.exdDotRed];
  return classes[idx % classes.length];
}

function progressToneClass(idx: number): string {
  const classes = [styles.exdProgressAccent, styles.exdProgressBlue, styles.exdProgressPurple, styles.exdProgressAmber, styles.exdProgressRed];
  return classes[idx % classes.length];
}

function healthToneClass(score: number): string {
  if (score >= 70) return styles.exdProgressAccent;
  if (score >= 50) return styles.exdProgressAmber;
  return styles.exdProgressRed;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
  onNavigate?: (page: PageId) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExecutiveDashboardPage({ session, onNotify, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [contracts, setContracts] = useState<LegalContract[]>([]);
  const [mrrData, setMrrData] = useState<MrrHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void (async () => {
      try {
        const [snap, staff, contractsResult, mrrResult] = await Promise.all([
          loadAdminSnapshotWithRefresh(session),
          loadAllStaffWithRefresh(session),
          loadAdminContractsWithRefresh(session),
          loadMrrHistoryWithRefresh(session, 6)
        ]);
        if (cancelled) return;
        if (snap.nextSession) saveSession(snap.nextSession);
        if (staff.nextSession) saveSession(staff.nextSession);
        if (snap.error) onNotify("error", snap.error.message);
        setClients(snap.data?.clients ?? []);
        setProjects(snap.data?.projects ?? []);
        setInvoices(snap.data?.invoices ?? []);
        setStaffCount((staff.data ?? []).filter((s) => s.isActive).length);
        setContracts(contractsResult.data ?? []);
        setMrrData(mrrResult.data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  // ── Derived KPIs ─────────────────────────────────────────────────────────────
  const activeClients = useMemo(() => clients.filter((c) => c.status === "ACTIVE").length, [clients]);
  const activeProjects = useMemo(() => projects.filter((p) => p.status === "IN_PROGRESS").length, [projects]);

  const monthlyRevenue = useMemo(() => {
    const key = currentMonthKey();
    return invoices
      .filter((inv) => inv.status === "PAID" && inv.paidAt?.startsWith(key))
      .reduce((s, inv) => s + inv.amountCents, 0);
  }, [invoices]);

  const outstanding = useMemo(
    () => invoices.filter((inv) => inv.status === "ISSUED" || inv.status === "OVERDUE").reduce((s, inv) => s + inv.amountCents, 0),
    [invoices]
  );

  const overdueInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === "OVERDUE"),
    [invoices]
  );

  const atRiskClients = useMemo(() => clients.filter((c) => c.status === "AT_RISK" || c.status === "CHURNED").length, [clients]);

  const contractsExpiringSoon = useMemo(() => {
    const now = Date.now();
    const in30Days = now + 30 * 24 * 60 * 60 * 1000;
    return contracts.filter((c) => {
      if (!c.expiresAt) return false;
      const exp = new Date(c.expiresAt).getTime();
      return exp <= in30Days;
    }).length;
  }, [contracts]);

  const kpis = useMemo(() => [
    { label: "Monthly Revenue", value: centsToK(monthlyRevenue), prev: "—", change: "—", color: "var(--accent)", up: null as boolean | null },
    { label: "Active Projects",  value: String(activeProjects),   prev: "—", change: "—", color: "var(--blue)",   up: null },
    { label: "Active Clients",   value: String(activeClients),    prev: "—", change: "—", color: "var(--accent)", up: null },
    { label: "Staff Headcount",  value: String(staffCount),       prev: "—", change: "—", color: "var(--purple)", up: null },
    { label: "Outstanding",      value: centsToK(outstanding),    prev: "—", change: outstanding > 0 ? "+R" + (outstanding / 100_000).toFixed(0) + "k" : "—", color: outstanding > 0 ? "var(--red)" : "var(--accent)", up: outstanding > 0 ? false : null },
    { label: "Overdue Invoices", value: String(overdueInvoices.length), prev: "—", change: overdueInvoices.length > 0 ? `+${overdueInvoices.length}` : "—", color: overdueInvoices.length > 0 ? "var(--red)" : "var(--accent)", up: overdueInvoices.length > 0 ? (false as boolean | null) : null },
    { label: "Clients at Risk",  value: String(atRiskClients),   prev: "—", change: atRiskClients > 0 ? `+${atRiskClients}` : "—", color: atRiskClients > 0 ? "var(--red)" : "var(--accent)", up: atRiskClients > 0 ? (false as boolean | null) : null },
    { label: "Avg Progress",     value: projects.length ? Math.round(projects.reduce((s, p) => s + p.progressPercent, 0) / projects.length) + "%" : "—", prev: "—", change: "—", color: "var(--accent)", up: null },
  ], [monthlyRevenue, activeProjects, activeClients, staffCount, outstanding, overdueInvoices, atRiskClients, projects]);

  // MRR sparkline from real invoice history
  const mrrHistory = useMemo(() => {
    if (mrrData.length > 0) {
      // total is in cents — convert to whole rand units for the sparkline
      return mrrData.map((p) => Math.round(p.total / 100));
    }
    // Fall back to zeros while loading or if no data
    return [0, 0, 0, 0, 0, 0];
  }, [mrrData]);

  const mrrMonthLabels = useMemo(() => {
    if (mrrData.length > 0) {
      return mrrData.map((p) => {
        const monthNum = parseInt(p.month.slice(5, 7), 10) - 1;
        return MONTH_ABBREVS[monthNum] ?? p.month.slice(5, 7);
      });
    }
    // Fall-back labels matching the 6-slot zeroed array
    const labels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      labels.push(MONTH_ABBREVS[d.getMonth()]!);
    }
    return labels;
  }, [mrrData]);

  const totalMRR = useMemo(() => clients.reduce((s) => s + 1, 0), [clients]);
  const _ = totalMRR; // suppress unused

  // ── Alert feed items derived from real data ───────────────────────────────
  const alertFeedItems = useMemo(() => {
    const items: { iconClass: string; text: string }[] = [];
    if (overdueInvoices.length > 0) {
      items.push({ iconClass: styles.execAlertIconRed, text: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? "s" : ""}` });
    }
    if (atRiskClients > 0) {
      items.push({ iconClass: styles.execAlertIconAmber, text: `${atRiskClients} client${atRiskClients > 1 ? "s" : ""} at risk` });
    }
    if (items.length === 0) {
      items.push({ iconClass: styles.execAlertIconGreen, text: "No critical alerts" });
    }
    return items;
  }, [overdueInvoices, atRiskClients]);

  // ── Recent activity from clients + projects ───────────────────────────────
  const recentActivity = useMemo(() => {
    const items: { colorClass: string; desc: string; time: string }[] = [];
    clients.slice(0, 3).forEach((c) => {
      const cc = c.status === "ACTIVE" ? "colorAccent" : c.status === "AT_RISK" ? "colorAmber" : "colorMuted";
      items.push({ colorClass: cc, desc: `Client ${c.name} — ${c.status}`, time: "—" });
    });
    projects.slice(0, 3).forEach((p) => {
      items.push({ colorClass: "colorAccent", desc: `Project "${p.name}" — ${p.status}`, time: `${p.progressPercent}%` });
    });
    if (items.length === 0) {
      items.push({ colorClass: "colorMuted", desc: "No recent activity", time: "—" });
    }
    return items.slice(0, 6);
  }, [clients, projects]);

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

  return (
    <div className={cx(styles.pageBody)}>
      {/* Page header */}
      <div className={widgetStyles.pageHeader}>
        <div className={styles.pageEyebrow}>OPERATIONS / EXECUTIVE DASHBOARD</div>
        <h1 className={styles.pageTitle}>Executive Dashboard</h1>
        <p className={widgetStyles.pageDesc}>Business pulse · Portfolio health · Revenue snapshot</p>
      </div>
      <div className={widgetStyles.pageDivider} />

      {/* Row 1: KPI strip */}
      <WidgetGrid>
        <StatWidget
          tone="accent"
          label="Monthly Revenue"
          value={centsToK(monthlyRevenue)}
          sub={outstanding > 0 ? `${centsToK(outstanding)} outstanding` : "On track"}
          subTone={outstanding > 0 ? "warn" : "neutral"}
          sparkData={mrrHistory.length > 0 ? mrrHistory.map(v => (v / Math.max(...mrrHistory, 1)) * 100) : []}
        />
        <StatWidget
          label="Active Clients"
          value={activeClients}
          sub={atRiskClients > 0 ? `${atRiskClients} at risk` : "All healthy"}
          subTone={atRiskClients > 0 ? "warn" : "neutral"}
          progressValue={clients.length > 0 ? (activeClients / clients.length) * 100 : 0}
        />
        <StatWidget
          label="Active Projects"
          value={activeProjects}
          sub={projects.filter(p => p.status === "ON_HOLD").length > 0 ? `${projects.filter(p => p.status === "ON_HOLD").length} on hold` : "In progress"}
          subTone={projects.filter(p => p.status === "ON_HOLD").length > 0 ? "warn" : "neutral"}
          progressValue={projects.length > 0 ? (activeProjects / projects.length) * 100 : 0}
        />
        <StatWidget
          label="Staff Headcount"
          value={staffCount}
          sub="Active members"
        />
      </WidgetGrid>

      {/* Row 2: Revenue chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Revenue Trend — 6 months"
          currentValue={centsToK(monthlyRevenue)}
          data={mrrData.map((p, i) => ({ label: mrrMonthLabels[i] ?? p.month, actual: Math.round(p.total / 100) }))}
          dataKey="actual"
          type="area"
          height={130}
          xKey="label"
        />
        <PipelineWidget
          label="Project Status"
          className={widgetStyles.span2}
          stages={[
            { label: "In Progress", count: activeProjects, total: projects.length || 1 },
            { label: "Planning",    count: projects.filter(p => p.status === "PLANNING").length, total: projects.length || 1 },
            { label: "On Hold",     count: projects.filter(p => p.status === "ON_HOLD").length,  total: projects.length || 1, color: "#f5a623" },
            { label: "Completed",   count: projects.filter(p => p.status === "COMPLETED").length, total: projects.length || 1, color: "#34d98b" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3: Clients table */}
      <WidgetGrid>
        <TableWidget
          label="Client Pipeline"
          rows={clients.map(c => ({
            name:    c.name,
            status:  c.status as unknown,
            tier:    c.tier as unknown,
            health:  (c.status === "ACTIVE" ? "94" : c.status === "AT_RISK" ? "52" : "70") as unknown,
          }))}
          columns={[
            { key: "name",   header: "Client" },
            { key: "tier",   header: "Tier",   align: "right" as const },
            { key: "health", header: "Health", align: "right" as const },
            {
              key: "status",
              header: "Status",
              align: "right" as const,
              render: (val) => {
                const v = String(val);
                const cls = v === "ACTIVE" ? cx("badgeGreen") : v === "AT_RISK" ? cx("badgeAmber") : cx("badgeRed");
                return <span className={cls}>{v}</span>;
              },
            },
          ]}
          emptyMessage="No clients yet"
        />
      </WidgetGrid>
    </div>
  );
}
