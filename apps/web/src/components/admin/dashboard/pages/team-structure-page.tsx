// ════════════════════════════════════════════════════════════════════════════
// team-structure-page.tsx — Admin team structure wired to real API
// Data   : loadAllStaffWithRefresh → staff list with department/role info
//          Grouped by department; org chart built from real staff data.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminStaffProfile } from "../../../../lib/api/admin/hr";
import { loadAllStaffWithRefresh } from "../../../../lib/api/admin/hr";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEPT_COLORS: Record<string, string> = {
  Leadership:      "var(--accent)",
  Operations:      "var(--blue)",
  Design:          "var(--amber)",
  "Client Success":"var(--purple)",
  Content:         "var(--amber)",
  Engineering:     "var(--blue)",
  Marketing:       "var(--purple)",
  Finance:         "var(--accent)",
};

function deptColor(dept: string | null): string {
  if (!dept) return "var(--muted)";
  return DEPT_COLORS[dept] ?? "var(--accent)";
}

function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <div className={cx("fontMono", "flexCenter", "noShrink", "fw700", styles.teamAvatar, toneClass(color), size === 36 ? "teamAvatar36" : "teamAvatar40")}>
      {initials}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
  onNavigate?: (page: string) => void;
}

const tabs = ["org chart", "departments", "roles & permissions"] as const;
type Tab = (typeof tabs)[number];

// ── Component ─────────────────────────────────────────────────────────────────

export function TeamStructurePage({ session, onNotify, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("org chart");
  const [staff, setStaff] = useState<AdminStaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const r = await loadAllStaffWithRefresh(session);
        if (cancelled) return;
        if (r.nextSession) saveSession(r.nextSession);
        if (r.error) { setError(r.error.message ?? "Failed to load."); return; }
        setStaff((r.data ?? []).filter((s) => s.isActive));
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  // Group staff by department
  const departments = useMemo(() => {
    const map: Record<string, AdminStaffProfile[]> = {};
    for (const s of staff) {
      const dept = s.department ?? "Unassigned";
      if (!map[dept]) map[dept] = [];
      map[dept].push(s);
    }
    return Object.entries(map).map(([name, members]) => ({
      name,
      members,
      headcount: members.length,
      color: deptColor(name),
      monthlyCents: members.reduce((s, m) => s + (m.grossSalaryCents ?? 0), 0),
    }));
  }, [staff]);

  // Unique roles
  const roles = useMemo(() => {
    const map: Record<string, { role: string; department: string; count: number }> = {};
    for (const s of staff) {
      const key = s.role;
      if (!map[key]) map[key] = { role: s.role, department: s.department ?? "Unassigned", count: 0 };
      map[key].count++;
    }
    return Object.values(map);
  }, [staff]);

  const totalHeadcount = staff.length;
  const totalPayrollCents = useMemo(() => staff.reduce((s, m) => s + (m.grossSalaryCents ?? 0), 0), [staff]);

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

  const deptChartData = departments.map(d => ({ label: d.name, count: d.headcount }));

  const tableRows = staff.map(s => ({
    name:       s.name,
    role:       s.role,
    department: s.department ?? "Unassigned",
    contract:   s.contractType ?? "—",
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / TEAM</div>
          <h1 className={styles.pageTitle}>Team Structure</h1>
          <div className={styles.pageSub}>Org chart · Departments · Roles</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Org Chart</button>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => onNavigate?.("recruitmentPipeline")}>+ Add Staff</button>
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Total Headcount" value={totalHeadcount} sub="Active staff" tone="accent" />
        <StatWidget label="Departments" value={departments.length} sub="Active teams" tone="default" />
        <StatWidget label="Monthly Payroll" value={`R${(totalPayrollCents / 100_000).toFixed(0)}k`} sub="Salaries only" tone="default" />
        <StatWidget label="Unique Roles" value={roles.length} sub="Across all depts" tone="default" />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Headcount by Department"
          data={deptChartData}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Team Composition"
          stages={departments.map(d => ({ label: d.name, count: d.headcount, total: Math.max(totalHeadcount, 1), color: "#8b6fff" }))}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Staff Directory"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "name",       header: "Name" },
            { key: "role",       header: "Role" },
            { key: "department", header: "Department" },
            { key: "contract",   header: "Contract", align: "right", render: (v) => (
              <span className={cx("badge", "badgeMuted")}>{v as string}</span>
            )},
          ]}
          emptyMessage="No active staff"
        />
      </WidgetGrid>
    </div>
  );
}
