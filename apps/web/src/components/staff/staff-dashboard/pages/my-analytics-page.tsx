"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { getStaffAnalytics, type StaffAnalytics } from "@/lib/api/staff/profile";
import type { AuthSession } from "@/lib/auth/session";

type MyAnalyticsPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Dummy fallback (shown when no real activity exists) ───────────────────────

const DUMMY_ANALYTICS: StaffAnalytics = {
  hoursLogged:     34,
  hoursLastMonth:  28,
  hoursChange:     21,
  tasksCompleted:  12,
  tasksLastMonth:  9,
  tasksChange:     33,
  utilizationRate: 85,
  weeklyBreakdown: [
    { week: "Week 9",  hoursLogged: 28, tasksCompleted: 9,  utilization: 70 },
    { week: "Week 10", hoursLogged: 32, tasksCompleted: 11, utilization: 80 },
    { week: "Week 11", hoursLogged: 30, tasksCompleted: 10, utilization: 75 },
    { week: "Week 12", hoursLogged: 36, tasksCompleted: 13, utilization: 90 },
    { week: "Week 13", hoursLogged: 34, tasksCompleted: 12, utilization: 85 },
  ],
};

function isDummy(data: StaffAnalytics): boolean {
  return data.hoursLogged === 0 && data.tasksCompleted === 0 && data.weeklyBreakdown.length === 0;
}

type ChangeDir = "up" | "down";

interface MetricCard {
  label:     string;
  value:     string;
  change:    string;
  changeDir: ChangeDir;
}

function buildMetrics(data: StaffAnalytics): MetricCard[] {
  const hoursDir: ChangeDir   = data.hoursChange >= 0 ? "up" : "down";
  const tasksDir: ChangeDir   = data.tasksChange >= 0 ? "up" : "down";
  const utilDir:  ChangeDir   = data.utilizationRate >= 75 ? "up" : "down";

  return [
    {
      label:     `Tasks Completed`,
      value:     String(data.tasksCompleted),
      change:    `${data.tasksChange >= 0 ? "+" : ""}${data.tasksChange}%`,
      changeDir: tasksDir
    },
    {
      label:     "On-Time Delivery Rate",
      value:     "—",
      change:    "N/A",
      changeDir: "up" as const
    },
    {
      label:     "Utilization Rate",
      value:     `${data.utilizationRate}%`,
      change:    data.utilizationRate >= 75 ? "On target" : "Below target",
      changeDir: utilDir
    },
    {
      label:     "Hours Logged",
      value:     `${data.hoursLogged}h`,
      change:    `${data.hoursChange >= 0 ? "+" : ""}${data.hoursChange}%`,
      changeDir: hoursDir
    },
    {
      label:     "Last Month Hours",
      value:     `${data.hoursLastMonth}h`,
      change:    "vs this month",
      changeDir: "up" as const
    },
    {
      label:     "Client Satisfaction",
      value:     "—",
      change:    "Requires survey data",
      changeDir: "up" as const
    },
  ];
}

function changeDirCls(dir: ChangeDir): string {
  return dir === "up" ? "anlChangeUp" : "anlChangeDown";
}

function utilizationBarCls(u: number): string {
  return u >= 90 ? "anlBarFillGreen" : "anlBarFillAmber";
}

function utilizationValCls(u: number): string {
  return u >= 90 ? "colorGreen" : "colorAmber";
}

function SkeletonMetricCard() {
  return (
    <div className={cx("anlMetricCard", "opacity50")}>
      <div className={cx("anlMetricCardTop")}>
        <div className={cx("skeleBlock11x60p")} />
        <div className={cx("skeleBlock22x40p")} />
      </div>
      <div className={cx("anlMetricCardDivider")} />
      <div className={cx("skeleBlock10x50p")} />
    </div>
  );
}

export function MyAnalyticsPage({ isActive, session }: MyAnalyticsPageProps) {
  const [data, setData]       = useState<StaffAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void getStaffAnalytics(session).then((result) => {
      if (cancelled) return;
      if (result.error || !result.data) {
        setError(result.error?.message ?? "Failed to load data. Please try again.");
        return;
      }
      setData(result.data);
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load data.");
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  const displayData     = data && isDummy(data) ? DUMMY_ANALYTICS : data;
  const showingDummy    = data !== null && isDummy(data);

  const metrics = useMemo(
    () => (displayData ? buildMetrics(displayData) : []),
    [displayData]
  );

  const weeklyBreakdown = displayData?.weeklyBreakdown ?? [];
  const maxHours  = Math.max(...weeklyBreakdown.map((w) => w.hoursLogged), 1);

  function hourPct(n: number): number {
    return Math.round((n / maxHours) * 100);
  }

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-analytics">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-analytics">
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-analytics">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>My Analytics</h1>
        <p className={cx("pageSubtitleText", showingDummy ? "mb12" : "mb20")}>Personal performance analytics — derived from time entries &amp; task activity</p>
        {showingDummy && (
          <div className={cx("sampleDataBanner", "mb20")}>
            Sample data — log time entries to see your real analytics
          </div>
        )}
      </div>

      {/* ── Metric strip ──────────────────────────────────────────────────── */}
      <div className={cx("staffKpiStrip")}>
        {metrics.map((m) => (
          <div key={m.label} className={cx("staffKpiCell")}>
            <div className={cx("staffKpiLabel")}>{m.label}</div>
            <div className={cx("staffKpiValue", m.changeDir === "up" ? "colorAccent" : "colorRed")}>{m.value}</div>
            <div className={cx("staffKpiSub")}>
              <span className={cx(changeDirCls(m.changeDir))}>
                {m.changeDir === "up" ? "↑" : "↓"} {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Weekly breakdown ───────────────────────────────────────────────── */}
      {weeklyBreakdown.length > 0 && (
        <div className={cx("anlSection")}>
          <div className={cx("anlSectionHeader")}>
            <div className={cx("anlSectionTitle")}>Weekly Breakdown</div>
            <span className={cx("anlSectionMeta")}>{weeklyBreakdown.length} WEEKS</span>
          </div>

          <div className={cx("anlWeekList")}>
            {weeklyBreakdown.map((w, idx) => (
              <div
                key={w.week}
                className={cx("anlWeekRow", idx === weeklyBreakdown.length - 1 && "anlWeekRowLast")}
              >
                <span className={cx("anlWeekLabel")}>{w.week}</span>

                <div className={cx("anlBarsGroup")}>
                  <div className={cx("anlBarItem")}>
                    <span className={cx("anlBarLabel")}>Hours</span>
                    <div className={cx("anlBarTrack")}>
                      <div
                        className={cx("anlBarFill", "anlBarFillBlue")} style={{ '--pct': `${hourPct(w.hoursLogged)}%` } as React.CSSProperties}
                      />
                    </div>
                    <span className={cx("anlBarValue")}>{w.hoursLogged}h</span>
                  </div>

                  <div className={cx("anlBarItem")}>
                    <span className={cx("anlBarLabel")}>Util.</span>
                    <div className={cx("anlBarTrack")}>
                      <div
                        className={cx("anlBarFill", utilizationBarCls(w.utilization))}
                        style={{ '--pct': `${w.utilization}%` } as React.CSSProperties}
                      />
                    </div>
                    <span className={cx("anlBarValue", utilizationValCls(w.utilization))}>
                      {w.utilization}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}
