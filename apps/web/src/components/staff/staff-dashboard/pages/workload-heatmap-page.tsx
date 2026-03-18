// ════════════════════════════════════════════════════════════════════════════
// workload-heatmap-page.tsx — Staff Workload Capacity Heatmap
// Data : GET /staff/workload-heatmap?weeks=4 → WorkloadHeatmap
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { getWorkloadHeatmap, type StaffWorkloadRow } from "../../../../lib/api/staff/workload";
import type { AuthSession } from "../../../../lib/auth/session";
import { SkeletonTable } from "@/components/shared/ui/page-skeleton";
import { Alert } from "@/components/shared/ui/alert";

// ── Props ─────────────────────────────────────────────────────────────────────

type WorkloadHeatmapPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function utilPct(allocated: number, available: number): number {
  if (available === 0) return 100;
  return Math.round((allocated / available) * 100);
}

function cellTone(pct: number): "wlhGreen" | "wlhAmber" | "wlhRed" {
  if (pct > 90) return "wlhRed";
  if (pct > 70) return "wlhAmber";
  return "wlhGreen";
}

// ── Page component ────────────────────────────────────────────────────────────

export function WorkloadHeatmapPage({ isActive, session }: WorkloadHeatmapPageProps) {
  const [rows, setRows]       = useState<StaffWorkloadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;

    setLoading(true);
    void getWorkloadHeatmap(session, 4).then((result) => {
      if (cancelled) return;
      if (result.error || !result.data) {
        setLoadError(result.error?.message ?? "Failed to load workload data. Please try again.");
        setLoading(false);
        return;
      }
      setLoadError(null);
      setRows(result.data.staff);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session, isActive]);

  const weekLabels = rows[0]?.weeks.map((w) => w.weekLabel) ?? ["Week 1", "Week 2", "Week 3", "Week 4"];

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-workload-heatmap">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>Workload Capacity Heatmap</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Allocated vs. available hours per team member — next 4 weeks</p>
      </div>

      {loadError && (
        <Alert
          variant="error"
          message={loadError}
          onRetry={() => { setLoadError(null); }}
        />
      )}

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className={cx("wlhLegend")}>
        <span className={cx("wlhLegendDot", "wlhLegendGreen")} />
        <span className={cx("wlhLegendLabel")}>≤ 70% utilised</span>
        <span className={cx("wlhLegendDot", "wlhLegendAmber")} />
        <span className={cx("wlhLegendLabel")}>71 – 90%</span>
        <span className={cx("wlhLegendDot", "wlhLegendRed")} />
        <span className={cx("wlhLegendLabel")}>{"> 90%"}</span>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {(!loading && rows.length === 0) ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <div className={cx("emptyStateTitle")}>No team data available</div>
          <div className={cx("emptyStateSub")}>Workload heatmap will appear once staff profiles and tasks are configured.</div>
        </div>
      ) : (
        <div className={cx("tableWrap", "wlhTableWrap")}>
          {loading ? (
            <SkeletonTable rows={5} cols={5} />
          ) : (
            <table className={cx("wlhTable")}>
              <thead>
                <tr>
                  <th scope="col" className={cx("wlhCell", "wlhNameCell", "wlhHeaderCell")}>
                    Team Member
                  </th>
                  {weekLabels.map((label) => (
                    <th key={label} scope="col" className={cx("wlhCell", "wlhHeaderCell")}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.staffId} className={cx("staffTableRow")}>
                    <td className={cx("wlhCell", "wlhNameCell")}>
                      <span className={cx("wlhStaffName")}>{row.name}</span>
                      <span className={cx("wlhStaffRole")}>{row.role}</span>
                    </td>
                    {row.weeks.map((week) => {
                      const pct  = utilPct(week.allocatedHours, week.availableHours);
                      const tone = cellTone(pct);
                      return (
                        <td
                          key={week.weekLabel}
                          className={cx("wlhCell", tone)}
                          title={`${week.allocatedHours}h allocated of ${week.availableHours}h available`}
                        >
                          <span className={cx("wlhHours")}>
                            {week.allocatedHours}h / {week.availableHours}h
                          </span>
                          <span className={cx("wlhPct")}>{pct}%</span>
                          <span className={cx("wlhCellTip")}>{pct}% utilised</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
