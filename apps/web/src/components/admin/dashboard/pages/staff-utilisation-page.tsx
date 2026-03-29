// ════════════════════════════════════════════════════════════════════════════
// staff-utilisation-page.tsx — Admin Staff Utilisation Rate Dashboard
// Data     : loadStaffUtilisationWithRefresh → GET /admin/staff-utilisation
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadStaffUtilisationWithRefresh,
  type UtilisationRow,
  type UtilisationSummary,
} from "../../../../lib/api/admin/utilisation";
import { Tooltip } from "@/components/shared/ui/tooltip";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

// ── Types ─────────────────────────────────────────────────────────────────────
type Period = "30d" | "90d" | "month";

// ── Helpers ───────────────────────────────────────────────────────────────────
function barToneClass(rate: number): string {
  if (rate >= 75) return styles.sutBarGreen;
  if (rate >= 60) return styles.sutBarAmber;
  return styles.sutBarRed;
}

function rateColorClass(rate: number): string {
  if (rate >= 75) return "colorAccent";
  if (rate >= 60) return "colorAmber";
  return "colorRed";
}

function vsDelta(rate: number, target: number): string {
  const diff = rate - target;
  if (diff === 0) return "on target";
  return diff > 0 ? `+${diff}pp` : `${diff}pp`;
}

function vsDeltaColorClass(rate: number, target: number): string {
  const diff = rate - target;
  if (diff >= 0) return "colorAccent";
  if (diff >= -10) return "colorAmber";
  return "colorRed";
}

const PERIOD_LABELS: Record<Period, string> = {
  "30d":   "Last 30 days",
  "90d":   "Last 90 days",
  "month": "This month",
};

const SKELETON_ROWS = 6;

// ── Component ─────────────────────────────────────────────────────────────────
export function StaffUtilisationPage({ session }: { session: AuthSession | null }) {
  const [period, setPeriod]   = useState<Period>("30d");
  const [staff, setStaff]     = useState<UtilisationRow[]>([]);
  const [summary, setSummary] = useState<UtilisationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: Period) => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await loadStaffUtilisationWithRefresh(session, p);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setError(result.error.message ?? "Failed to load.");
      } else if (result.data) {
        setStaff(result.data.staff);
        setSummary(result.data.summary);
      }
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { void load(period); }, [load, period]);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const sorted = [...staff].sort((a, b) => b.utilisationRate - a.utilisationRate);
  const atTarget  = staff.filter((r) => r.utilisationRate >= r.target).length;
  const watchlist = staff.filter((r) => r.utilisationRate < 60).length;

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

  const utilisationChartData = sorted.map(r => ({ label: r.name.split(" ")[0] ?? r.name, count: r.utilisationRate }));

  const tableRows = sorted.map(r => ({
    name:     r.name,
    role:     r.role,
    billable: `${r.billableHours}h`,
    util:     `${r.utilisationRate}%`,
    vsTarget: vsDelta(r.utilisationRate, r.target),
  }));

  return (
    <div className={styles.pageBody}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / STAFF UTILISATION</div>
          <h1 className={styles.pageTitle}>Staff Utilisation Rate</h1>
          <div className={styles.pageSub}>Billable hours · Availability · Target tracking</div>
        </div>
        <div className={styles.pageActions}>
          <select
            title="Select period"
            className={styles.formInput}
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as Period)}
          >
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
            ))}
          </select>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export</button>
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Avg Billable Rate" value={`${summary?.avgBillableRate ?? 0}%`} sub="Target: 75%" tone={(summary?.avgBillableRate ?? 0) >= 75 ? "green" : (summary?.avgBillableRate ?? 0) >= 60 ? "amber" : "red"} />
        <StatWidget label="Total Billable Hours" value={`${summary?.totalBillableHours ?? 0}h`} sub={PERIOD_LABELS[period]} tone="default" />
        <StatWidget label="At or Above Target" value={`${atTarget}/${staff.length}`} sub="≥ 75% utilisation" tone={atTarget === staff.length && staff.length > 0 ? "green" : "amber"} />
        <StatWidget label="Watchlist" value={watchlist} sub="Below 60% utilisation" tone={watchlist > 0 ? "red" : "default"} />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Utilisation by Staff"
          data={utilisationChartData.length > 0 ? utilisationChartData : [{ label: "No data", count: 0 }]}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Utilisation Bands"
          stages={[
            { label: "On target (≥75%)", count: atTarget,                                             total: Math.max(staff.length, 1), color: "#34d98b" },
            { label: "Below target",     count: staff.filter(r => r.utilisationRate >= 60 && r.utilisationRate < 75).length, total: Math.max(staff.length, 1), color: "#f5a623" },
            { label: "Watchlist (<60%)", count: watchlist,                                            total: Math.max(staff.length, 1), color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Staff Utilisation"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "name",     header: "Name" },
            { key: "role",     header: "Role" },
            { key: "billable", header: "Billable", align: "right" },
            { key: "util",     header: "Util %",   align: "right", render: (v) => {
              const val = v as string;
              const num = parseInt(val);
              const cls = num >= 75 ? cx("badge", "badgeGreen") : num >= 60 ? cx("badge", "badgeAmber") : cx("badge", "badgeRed");
              return <span className={cls}>{val}</span>;
            }},
            { key: "vsTarget", header: "vs Target", align: "right" },
          ]}
          emptyMessage="No utilisation data yet"
        />
      </WidgetGrid>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className={cx("card", "overflowHidden")}>

        {/* Table head */}
        <div className={cx("text10", "colorMuted", "uppercase", "fontMono", styles.sutCell)}
          style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 80px 80px 90px 100px 1fr", gap: 0 }}
        >
          {["Name", "Role", "Billable", "Available", "Util %"].map((h) => (
            <span key={h} className={styles.sutCell}>{h}</span>
          ))}
          <span className={styles.sutCell}>
            <Tooltip label="Percentage points above/below 75% target">vs Target</Tooltip>
          </span>
          <span className={styles.sutCell}>Trend bar</span>
        </div>

        {/* Empty state */}
        {staff.length === 0 && (
          <div className={cx("p24", "textCenter", "colorMuted", "text13")}>
            <div className={cx("fw700", "text14", "mb8")}>No utilisation data yet</div>
            <div>Utilisation data will populate here once staff complete time entries on client projects.</div>
          </div>
        )}

        {/* Data rows */}
        {sorted.map((row) => (
          <div
            key={row.staffId}
            className={styles.tableRow}
            style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 80px 80px 90px 100px 1fr", gap: 0, borderBottom: "1px solid var(--border, rgba(255,255,255,0.08))" }}
          >
            {/* Name */}
            <div className={cx(styles.sutCell, "flexRow", "gap10")}>
              <div
                className={cx(styles.sutAvatar, "flexCenter", "fontMono", "fw700")}
                style={{
                  fontSize: 10,
                  background: row.avatarColor ?? "var(--accent)",
                  color: "#000",
                }}
              >
                {row.avatarInitials}
              </div>
              <span className={cx("fw600", "text13")}>{row.name}</span>
            </div>

            {/* Role */}
            <div className={cx(styles.sutCell, "text12", "colorMuted")}>{row.role}</div>

            {/* Billable hrs */}
            <div className={cx(styles.sutCell, "fontMono", "fw700", "colorAccent")}>{row.billableHours}h</div>

            {/* Total hrs */}
            <div className={cx(styles.sutCell, "fontMono", "colorMuted")}>{row.totalHours}h</div>

            {/* Utilisation % */}
            <div className={cx(styles.sutCell, "fontMono", "fw700", rateColorClass(row.utilisationRate))}>
              {row.utilisationRate}%
            </div>

            {/* vs Target */}
            <div className={cx(styles.sutCell, "fontMono", "text12", vsDeltaColorClass(row.utilisationRate, row.target))}>
              {vsDelta(row.utilisationRate, row.target)}
            </div>

            {/* Trend bar */}
            <div className={cx(styles.sutCell)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className={styles.sutBar} style={{ flex: 1 }}>
                <div
                  className={cx(styles.sutBarFill, barToneClass(row.utilisationRate))}
                  style={{ width: `${row.utilisationRate}%` }}
                />
              </div>
              {/* Target marker at 75% */}
              <span className={cx("text10", "colorMuted", "fontMono")}>{row.target}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
