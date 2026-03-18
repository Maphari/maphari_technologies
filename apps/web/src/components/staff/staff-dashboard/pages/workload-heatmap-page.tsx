// ════════════════════════════════════════════════════════════════════════════
// workload-heatmap-page.tsx — Staff Workload Capacity Heatmap
// Data : GET /staff/workload-heatmap?weeks=4 → WorkloadHeatmap
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { getWorkloadHeatmap, type StaffWorkloadRow } from "../../../../lib/api/staff/workload";
import type { AuthSession } from "../../../../lib/auth/session";

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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className={cx("opacity50")}>
      <td className={cx("wlhCell", "wlhNameCell")}>
        <div className={cx("skeleBlock10x50p")} style={{ marginBottom: 4 }} />
        <div className={cx("skeleBlock9x60p")} />
      </td>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className={cx("wlhCell")}>
          <div className={cx("skeleBlock22x35p")} style={{ margin: "0 auto" }} />
        </td>
      ))}
    </tr>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function WorkloadHeatmapPage({ isActive, session }: WorkloadHeatmapPageProps) {
  const [rows, setRows]       = useState<StaffWorkloadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;

    setLoading(true);
    void getWorkloadHeatmap(session, 4).then((result) => {
      if (cancelled) return;
      if (result.data) setRows(result.data.staff);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session, isActive]);

  const weekLabels = rows[0]?.weeks.map((w) => w.weekLabel) ?? ["Week 1", "Week 2", "Week 3", "Week 4"];
  const numCols    = weekLabels.length;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-workload-heatmap">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>Workload Capacity Heatmap</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Allocated vs. available hours per team member — next 4 weeks</p>
      </div>

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
        <div className={cx("tableWrap")}>
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
              {loading
                ? [1, 2, 3, 4, 5].map((n) => <SkeletonRow key={n} cols={numCols} />)
                : rows.map((row) => (
                  <tr key={row.staffId}>
                    <td className={cx("wlhCell", "wlhNameCell")}>
                      <span className={cx("wlhStaffName")}>{row.name}</span>
                      <span className={cx("wlhStaffRole")}>{row.role}</span>
                    </td>
                    {row.weeks.map((week) => {
                      const pct  = utilPct(week.allocatedHours, week.availableHours);
                      const tone = cellTone(pct);
                      return (
                        <td key={week.weekLabel} className={cx("wlhCell", tone)}>
                          <span className={cx("wlhHours")}>
                            {week.allocatedHours}h / {week.availableHours}h
                          </span>
                          <span className={cx("wlhPct")}>{pct}%</span>
                        </td>
                      );
                    })}
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
