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
import { SkeletonTable } from "@/components/shared/ui/page-skeleton";
import { Tooltip } from "@/components/shared/ui/tooltip";

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

  const load = useCallback(async (p: Period) => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    const result = await loadStaffUtilisationWithRefresh(session, p);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.data) {
      setStaff(result.data.staff);
      setSummary(result.data.summary);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { void load(period); }, [load, period]);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const sorted = [...staff].sort((a, b) => b.utilisationRate - a.utilisationRate);
  const atTarget  = staff.filter((r) => r.utilisationRate >= r.target).length;
  const watchlist = staff.filter((r) => r.utilisationRate < 60).length;

  return (
    <div className={styles.pageBody}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / PERFORMANCE</div>
          <h1 className={styles.pageTitle}>Staff Utilisation Rate</h1>
          <div className={styles.pageSub}>
            Billable hours vs. available hours per staff member. Target: 75% utilisation.
          </div>
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

      {/* ── Summary KPI bar ─────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb24")}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Avg Billable Rate</div>
          <div className={cx(styles.statValue, summary && summary.avgBillableRate >= 75 ? "colorAccent" : summary && summary.avgBillableRate >= 60 ? "colorAmber" : "colorRed")}>
            {loading ? "—" : `${summary?.avgBillableRate ?? 0}%`}
          </div>
          <div className={cx("text11", "colorMuted")}>Team average · Target: 75%</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Billable Hours</div>
          <div className={cx(styles.statValue, "colorBlue")}>
            {loading ? "—" : `${summary?.totalBillableHours ?? 0}h`}
          </div>
          <div className={cx("text11", "colorMuted")}>{PERIOD_LABELS[period]}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Team Size</div>
          <div className={cx(styles.statValue, "colorAccent")}>
            {loading ? "—" : `${summary?.teamSize ?? 0}`}
          </div>
          <div className={cx("text11", "colorMuted")}>Active staff</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>At or Above Target</div>
          <div className={cx(styles.statValue, atTarget === staff.length && staff.length > 0 ? "colorAccent" : "colorAmber")}>
            {loading ? "—" : `${atTarget} / ${staff.length}`}
          </div>
          <div className={cx("text11", "colorMuted")}>≥ 75% utilisation</div>
        </div>

        {watchlist > 0 && (
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Watchlist</div>
            <div className={cx(styles.statValue, "colorRed")}>{watchlist}</div>
            <div className={cx("text11", "colorMuted")}>Below 60% utilisation</div>
          </div>
        )}
      </div>

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

        {/* Loading skeleton */}
        {loading && <SkeletonTable rows={5} cols={6} />}

        {/* Empty state */}
        {!loading && staff.length === 0 && (
          <div className={cx("p24", "textCenter", "colorMuted", "text13")}>
            <div className={cx("fw700", "text14", "mb8")}>No utilisation data yet</div>
            <div>Utilisation data will populate here once staff complete time entries on client projects.</div>
          </div>
        )}

        {/* Data rows */}
        {!loading && sorted.map((row) => (
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
