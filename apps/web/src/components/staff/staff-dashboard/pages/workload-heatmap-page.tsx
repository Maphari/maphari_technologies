// ════════════════════════════════════════════════════════════════════════════
// workload-heatmap-page.tsx — Staff Workload Capacity Heatmap
// Data : GET /staff/workload-heatmap?weeks=4 → WorkloadHeatmap
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { getWorkloadHeatmap, type StaffWorkloadRow } from "../../../../lib/api/staff/workload";
import type { AuthSession } from "../../../../lib/auth/session";
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
  const [weeks, setWeeks]             = useState<4 | 8 | 12>(4);
  const [retryCount, setRetryCount]   = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setLoadError(null);
    setLastUpdated(null);
    setRows([]);
    void getWorkloadHeatmap(session, weeks).then((result) => {
      if (cancelled) return;
      if (result.error || !result.data) {
        setLoadError(result.error?.message ?? "Failed to load workload data. Please try again.");
        return;
      }
      setLoadError(null);
      setRows(result.data.staff);
      setLastUpdated(new Date());
    }).catch((err: unknown) => {
      if (!cancelled) setLoadError((err as Error)?.message ?? "Failed to load workload data. Please try again.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive, weeks, retryCount]);

  const weekLabels = rows[0]?.weeks.map((w) => w.weekLabel) ?? ["Week 1", "Week 2", "Week 3", "Week 4"];

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-workload-heatmap">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-workload-heatmap">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>Workload Capacity Heatmap</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Allocated vs. available hours per team member — next {weeks} weeks</p>
      </div>

      {loadError && (
        <Alert
          variant="error"
          message={loadError}
          onRetry={() => { setLoadError(null); setRetryCount((c) => c + 1); }}
        />
      )}

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className={cx("wlhToolbar")}>
        <div className={cx("wlhSegBar")}>
          {([4, 8, 12] as const).map((w) => (
            <button
              key={w}
              className={cx("wlhSegBtn", weeks === w && "wlhSegBtnActive")}
              onClick={() => setWeeks(w)}
              disabled={loading}
            >
              {w} weeks
            </button>
          ))}
        </div>
        {lastUpdated && (
          <span className={cx("wlhTimestamp")}>
            Last updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      {rows.length > 0 && (() => {
        const totalStaff = rows.length;
        const allCells   = rows.flatMap((r) => r.weeks.map((w) => utilPct(w.allocatedHours, w.availableHours)));
        const avgUtil    = allCells.length > 0 ? Math.round(allCells.reduce((s, v) => s + v, 0) / allCells.length) : 0;
        const overloaded = rows.filter((r) => r.weeks.some((w) => utilPct(w.allocatedHours, w.availableHours) > 90)).length;
        const available  = rows.filter((r) => r.weeks.every((w) => utilPct(w.allocatedHours, w.availableHours) <= 70)).length;
        return (
          <div className={cx("staffKpiStripFour")}>
            <div className={cx("staffKpiCell")}>
              <div className={cx("staffKpiLabel")}>Team Members</div>
              <div className={cx("staffKpiValue", "colorAccent")}>{totalStaff}</div>
              <div className={cx("staffKpiSub")}>tracked</div>
            </div>
            <div className={cx("staffKpiCell")}>
              <div className={cx("staffKpiLabel")}>Avg Utilization</div>
              <div className={cx("staffKpiValue", avgUtil > 90 ? "colorRed" : avgUtil > 70 ? "colorAmber" : "colorGreen")}>{avgUtil}%</div>
              <div className={cx("staffKpiSub")}>across all weeks</div>
            </div>
            <div className={cx("staffKpiCell")}>
              <div className={cx("staffKpiLabel")}>Overloaded</div>
              <div className={cx("staffKpiValue", overloaded > 0 ? "colorRed" : "colorGreen")}>{overloaded}</div>
              <div className={cx("staffKpiSub")}>{overloaded > 0 ? "above 90%" : "none above 90%"}</div>
            </div>
            <div className={cx("staffKpiCell")}>
              <div className={cx("staffKpiLabel")}>Available</div>
              <div className={cx("staffKpiValue", available > 0 ? "colorGreen" : "colorAmber")}>{available}</div>
              <div className={cx("staffKpiSub")}>under 70% all weeks</div>
            </div>
          </div>
        );
      })()}

      {/* ── Empty state / Table ──────────────────────────────────────────── */}
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
        <>
          {/* ── Legend (only when data) ──────────────────────────────────── */}
          <div className={cx("wlhLegend")}>
            <span className={cx("wlhLegendDot", "wlhLegendGreen")} />
            <span className={cx("wlhLegendLabel")}>≤ 70% utilised</span>
            <span className={cx("wlhLegendDot", "wlhLegendAmber")} />
            <span className={cx("wlhLegendLabel")}>71 – 90%</span>
            <span className={cx("wlhLegendDot", "wlhLegendRed")} />
            <span className={cx("wlhLegendLabel")}>{"> 90%"}</span>
          </div>

          {/* ── Table ────────────────────────────────────────────────────── */}
          <div className={cx("tableWrap", "wlhTableWrap")}>
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
          </div>
        </>
      )}
    </section>
  );
}
