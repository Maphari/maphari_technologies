"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminFilterBar } from "./shared";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAdminStaffPerformanceWithRefresh, type AdminStaffPerformance } from "../../../../lib/api/admin";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

type StaffMember = AdminStaffPerformance & { id: number; avatar: string; color: string; notes: string };

const AVATAR_COLORS = [
  "var(--accent)", "var(--blue)", "var(--purple)", "var(--amber)", "var(--red)"
];
function pickColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function noteForMember(m: AdminStaffPerformance): string {
  if (m.deliveryScore === 0 && m.billableHours === 0) {
    return "No time entries or task activity recorded yet for this period.";
  }
  if (m.tasksMissed > 3) return `${m.tasksMissed} overdue tasks — review workload and capacity.`;
  if (m.billablePct < 50) return "Low utilization this month — check availability and task assignment.";
  if (m.bonusEligible) return "All thresholds met — bonus eligible this period.";
  return `Delivery ${m.deliveryScore}/100 · On-time ${m.onTimeRate}% · Util ${m.billablePct}%`;
}

const tabs = ["scoreboard", "delivery & quality", "utilization", "incentive planner"] as const;
type Tab = (typeof tabs)[number];
type RoleFilter = "all" | "account" | "creative" | "ops";
type BandFilter = "all" | "top" | "watch";

function toneClass(color: string): string {
  if (color === "var(--red)") return styles.perfToneRed;
  if (color === "var(--blue)") return styles.perfToneBlue;
  if (color === "var(--amber)") return styles.perfToneAmber;
  if (color === "var(--purple)") return styles.perfTonePurple;
  if (color === "var(--muted)") return styles.perfToneMuted;
  return styles.perfToneAccent;
}

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size <= 28 ? styles.perfAvatar28 : styles.perfAvatar32;
  return (
    <div className={cx("flexCenter", "fontMono", "fw700", "noShrink", styles.perfAvatar, sizeClass, toneClass(color))}>
      {initials}
    </div>
  );
}

function barColor(value: number, good = 85, warn = 70): string {
  if (value >= good) return "var(--accent)";
  if (value >= warn) return "var(--amber)";
  return "var(--red)";
}

export function PerformancePage({ session }: { session: AuthSession | null }) {
  const [activeTab, setActiveTab] = useState<Tab>("scoreboard");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [bandFilter, setBandFilter] = useState<BandFilter>("all");
  const [query, setQuery] = useState("");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const r = await loadAdminStaffPerformanceWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        setError(r.error.message ?? "Failed to load.");
      } else if (r.data && r.data.length > 0) {
        setStaff(
          r.data.map((m, idx) => ({
            ...m,
            id:     idx + 1,
            avatar: m.avatarInitials,
            color:  m.avatarColor ?? pickColor(m.userId),
            notes:  noteForMember(m),
          }))
        );
      }
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { void loadStaff(); }, [loadStaff]);

  const totalBillable = staff.reduce((s, m) => s + m.billableHours, 0);
  const avgDelivery   = staff.length > 0 ? Math.round(staff.reduce((s, m) => s + m.deliveryScore, 0) / staff.length) : 0;
  const avgOnTime     = staff.length > 0 ? Math.round(staff.reduce((s, m) => s + m.onTimeRate,    0) / staff.length) : 0;
  const totalBonus    = staff.reduce((s, m) => s + m.bonusAmount, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff
      .filter((m) => {
        if (roleFilter === "all") return true;
        if (roleFilter === "account") return m.role.toLowerCase().includes("account");
        if (roleFilter === "creative") return m.role.toLowerCase().includes("design") || m.role.toLowerCase().includes("copy");
        if (roleFilter === "ops") return m.role.toLowerCase().includes("manager") || m.role.toLowerCase().includes("ops");
        return true;
      })
      .filter((m) => {
        if (bandFilter === "all") return true;
        const isTop = m.deliveryScore >= 90 && m.onTimeRate >= 90 && m.clientSat >= 8.5;
        return bandFilter === "top" ? isTop : !isTop;
      })
      .filter((m) => (q ? m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) : true));
  }, [bandFilter, query, roleFilter, staff]);

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

  const deliveryData = filtered.map(m => ({ label: m.name.split(" ")[0], count: m.deliveryScore }));

  const tableRows = filtered.map(m => ({
    name:     m.name,
    role:     m.role,
    delivery: m.deliveryScore,
    onTime:   `${m.onTimeRate}%`,
    util:     `${m.billablePct}%`,
    bonus:    m.bonusEligible ? `R${m.bonusAmount.toLocaleString()}` : "Not eligible",
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / PERFORMANCE</div>
          <h1 className={styles.pageTitle}>Performance Overview</h1>
          <div className={styles.pageSub}>Delivery scores · Utilisation · Incentive readiness</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Report</button>
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Avg Delivery Score" value={`${avgDelivery}/100`} sub="Current month" tone={avgDelivery >= 85 ? "green" : avgDelivery >= 70 ? "amber" : "red"} />
        <StatWidget label="Avg On-Time Rate" value={`${avgOnTime}%`} sub="Across active staff" tone={avgOnTime >= 90 ? "green" : avgOnTime >= 75 ? "amber" : "red"} />
        <StatWidget label="Team Billable Hours" value={`${Math.round(totalBillable)}h`} sub="Target: 800h" tone="default" />
        <StatWidget label="Bonus Pool" value={`R${(totalBonus / 1000).toFixed(1)}k`} sub={`${staff.filter(s => s.bonusEligible).length} eligible`} subTone="up" tone="accent" />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Delivery Scores"
          data={deliveryData}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Performance Bands"
          stages={[
            { label: "Top performers", count: staff.filter(m => m.deliveryScore >= 90 && m.onTimeRate >= 90).length, total: Math.max(staff.length, 1), color: "#34d98b" },
            { label: "On track",       count: staff.filter(m => m.deliveryScore >= 70 && m.deliveryScore < 90).length, total: Math.max(staff.length, 1), color: "#8b6fff" },
            { label: "Watchlist",      count: staff.filter(m => m.deliveryScore < 70).length, total: Math.max(staff.length, 1), color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Scoreboard"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "name",     header: "Staff" },
            { key: "role",     header: "Role" },
            { key: "delivery", header: "Delivery",   align: "right" },
            { key: "onTime",   header: "On-Time",    align: "right" },
            { key: "util",     header: "Utilisation", align: "right" },
            { key: "bonus",    header: "Bonus",       align: "right", render: (v) => {
              const val = v as string;
              const cls = val.startsWith("R") ? cx("badge", "badgeGreen") : cx("badge", "badgeMuted");
              return <span className={cls}>{val}</span>;
            }},
          ]}
          emptyMessage="No performance data yet"
        />
      </WidgetGrid>
    </div>
  );
}
