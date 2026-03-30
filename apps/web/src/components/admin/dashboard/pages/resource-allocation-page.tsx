// ════════════════════════════════════════════════════════════════════════════
// resource-allocation-page.tsx — Admin resource allocation wired to real API
// Data   : loadAllStaffWithRefresh     → staff list with department/role
//          loadTimeEntriesWithRefresh  → time entries to compute utilisation
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminStaffProfile } from "../../../../lib/api/admin/hr";
import { loadAllStaffWithRefresh } from "../../../../lib/api/admin/hr";
import type { ProjectTimeEntry } from "../../../../lib/api/admin/types";
import { loadTimeEntriesWithRefresh } from "../../../../lib/api/admin/tasks";

// ── Constants ─────────────────────────────────────────────────────────────────

const CAPACITY = 40; // hours per week

// ── Helpers ───────────────────────────────────────────────────────────────────

function weekStart(offset = 0): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function weekLabel(offset = 0): string {
  const d = new Date(weekStart(offset));
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function minutesToHours(minutes: number): number {
  return Math.round(minutes / 60);
}

function staffColor(idx: number): string {
  const colors = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--red)"];
  return colors[idx % colors.length];
}

function allocWidthClass(hours: number): string {
  if (hours >= 32) return styles.resAllocW80;
  if (hours >= 28) return styles.resAllocW70;
  if (hours >= 24) return styles.resAllocW60;
  if (hours >= 20) return styles.resAllocW50;
  if (hours >= 18) return styles.resAllocW45;
  if (hours >= 16) return styles.resAllocW40;
  if (hours >= 14) return styles.resAllocW35;
  if (hours >= 12) return styles.resAllocW30;
  if (hours >= 10) return styles.resAllocW25;
  if (hours >= 8)  return styles.resAllocW20;
  if (hours >= 6)  return styles.resAllocW15;
  return styles.resAllocW10;
}

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size <= 28 ? styles.resAllocAvatar28 : styles.resAllocAvatar36;
  return (
    <div className={cx("fontMono", "flexCenter", "noShrink", "fw700", styles.resAllocAvatar, sizeClass, toneClass(color))}>
      {initials}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

const WEEK_OFFSETS = [0, 1, 2, 3, 4];

// ── Component ─────────────────────────────────────────────────────────────────

export function ResourceAllocationPage({ session, onNotify }: Props) {
  const [selectedWeek] = useState(0);
  const [staff, setStaff] = useState<AdminStaffProfile[]>([]);
  const [timeEntries, setTimeEntries] = useState<ProjectTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weeks = useMemo(() => WEEK_OFFSETS.map((o) => weekLabel(o)), []);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const from = weekStart(0);
        const [staffRes, timeRes] = await Promise.all([
          loadAllStaffWithRefresh(session),
          loadTimeEntriesWithRefresh(session, { from, limit: 500 })
        ]);
        if (cancelled) return;
        if (staffRes.nextSession) saveSession(staffRes.nextSession);
        if (timeRes.nextSession) saveSession(timeRes.nextSession);
        if (staffRes.error) { setError(staffRes.error.message ?? "Failed to load."); return; }
        if (timeRes.error) onNotify("warning", "Could not load time entries.");
        setStaff((staffRes.data ?? []).filter((s) => s.isActive));
        setTimeEntries(timeRes.data ?? []);
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  // Compute hours logged per staff member (this week = offset 0)
  const hoursPerStaff = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of timeEntries) {
      const uid = entry.staffUserId ?? entry.staffName ?? "unknown";
      map[uid] = (map[uid] ?? 0) + minutesToHours(entry.minutes);
    }
    return map;
  }, [timeEntries]);

  // Build a per-staff allocation row for the weekly grid
  const staffRows = useMemo(() => staff.map((s, idx) => {
    const uid = s.userId;
    const loggedHours = hoursPerStaff[uid] ?? 0;
    const color = staffColor(idx);
    return {
      id: s.id,
      name: s.name,
      role: s.role,
      avatar: s.avatarInitials ?? s.name.slice(0, 2).toUpperCase(),
      color,
      loggedHours,
    };
  }), [staff, hoursPerStaff]);

  // Summary stats for the selected week
  const weekStats = useMemo(() => {
    const totalLogged = selectedWeek === 0
      ? staffRows.reduce((s, m) => s + m.loggedHours, 0)
      : 0; // no historical data for future weeks
    const overallocated = staffRows.filter((m) => m.loggedHours > CAPACITY).length;
    const underutilised = staffRows.filter((m) => m.loggedHours < CAPACITY * 0.7).length;
    const teamUtil = staff.length > 0
      ? Math.round((staffRows.reduce((s, m) => s + Math.min(m.loggedHours, CAPACITY), 0) / (staff.length * CAPACITY)) * 100)
      : 0;
    return { totalLogged, overallocated, underutilised, teamUtil };
  }, [staffRows, selectedWeek, staff.length]);

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

  // ── Widget data ────────────────────────────────────────────────────────────
  const utilChartData = staffRows.map((member) => ({
    label: member.name.split(" ")[0],
    hours: member.loggedHours,
  }));

  const optimal = staffRows.filter((m) => {
    const pct = Math.round((m.loggedHours / CAPACITY) * 100);
    return pct >= 70 && m.loggedHours <= CAPACITY;
  }).length;

  const tableRows = staffRows.map((member) => {
    const hours = member.loggedHours;
    const pct = Math.round((hours / CAPACITY) * 100);
    return {
      id: member.id,
      name: member.name,
      role: member.role,
      allocation: `${pct}%`,
      hours: `${hours}h`,
      _pct: pct,
    };
  });

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>OPERATIONS / RESOURCES</div>
          <h1 className={styles.pageTitle}>Resource Allocation</h1>
          <div className={styles.pageSub}>Staff utilisation · Capacity planning · Allocation health</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Plan</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>Adjust Allocation</button>
        </div>
      </div>

      {/* Row 1 — 4 stat widgets */}
      <WidgetGrid>
        <StatWidget
          label="Total Staff"
          value={staff.length}
          sub={`${weekStats.teamUtil}% team utilisation`}
          tone="accent"
        />
        <StatWidget
          label="Fully Allocated"
          value={optimal}
          sub="70–100% capacity"
          tone={optimal > 0 ? "green" : "default"}
        />
        <StatWidget
          label="Under-utilized"
          value={weekStats.underutilised}
          sub={`< ${Math.round(CAPACITY * 0.7)}h this week`}
          tone={weekStats.underutilised > 0 ? "amber" : "default"}
        />
        <StatWidget
          label="Overloaded"
          value={weekStats.overallocated}
          sub={`> ${CAPACITY}h capacity`}
          tone={weekStats.overallocated > 0 ? "red" : "default"}
        />
      </WidgetGrid>

      {/* Row 2 — bar chart + pipeline allocation tiers */}
      <WidgetGrid>
        <ChartWidget
          label="Utilisation by Staff Member"
          data={utilChartData}
          dataKey="hours"
          type="bar"
          color="#8b6fff"
          xKey="label"
        />
        <PipelineWidget
          label="Allocation Tiers"
          stages={[
            { label: "Optimal (70–100%)", count: optimal || 0, total: staff.length || 1, color: "#34d98b" },
            { label: "Under (<70%)", count: weekStats.underutilised || 0, total: staff.length || 1, color: "#f5a623" },
            { label: "Over (>100%)", count: weekStats.overallocated || 0, total: staff.length || 1, color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — staff allocation table */}
      <WidgetGrid>
        <TableWidget
          label="Staff Allocation"
          rows={tableRows as Record<string, unknown>[]}
          rowKey="id"
          emptyMessage="No active staff found."
          columns={[
            { key: "name", header: "Staff Member", align: "left" },
            { key: "role", header: "Role", align: "left" },
            {
              key: "allocation",
              header: "Allocation",
              align: "right",
              render: (_v, row) => {
                const pct = (row as { _pct: number })._pct;
                const badgeCls =
                  pct > 100 ? cx("badgeRed")
                  : pct >= 70 ? cx("badgeGreen")
                  : cx("badgeAmber");
                return <span className={badgeCls}>{String(_v)}</span>;
              },
            },
            { key: "hours", header: "Hours (this week)", align: "right" },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}
