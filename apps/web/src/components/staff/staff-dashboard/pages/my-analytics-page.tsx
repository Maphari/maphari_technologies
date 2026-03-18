"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { getStaffAnalytics, type StaffAnalytics } from "@/lib/api/staff/profile";
import type { AuthSession } from "@/lib/auth/session";

type MyAnalyticsPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

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

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;

    setLoading(true);
    void getStaffAnalytics(session).then((result) => {
      if (cancelled) return;
      if (result.data) setData(result.data);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session, isActive]);

  const metrics = useMemo(
    () => (data ? buildMetrics(data) : []),
    [data]
  );

  const weeklyBreakdown = data?.weeklyBreakdown ?? [];
  const maxHours  = Math.max(...weeklyBreakdown.map((w) => w.hoursLogged), 1);

  function hourPct(n: number): number {
    return Math.round((n / maxHours) * 100);
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-analytics">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>My Analytics</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal performance analytics — derived from time entries &amp; task activity</p>
      </div>

      {/* ── Metric cards ──────────────────────────────────────────────────── */}
      <div className={cx("anlMetricGrid")}>
        {loading
          ? [1, 2, 3, 4, 5, 6].map((n) => <SkeletonMetricCard key={n} />)
          : metrics.map((m) => (
              <div key={m.label} className={cx("anlMetricCard")}>
                <div className={cx("anlMetricCardTop")}>
                  <div className={cx("anlMetricLabel")}>{m.label}</div>
                  <div className={cx("anlMetricValue", "colorAccent")}>{m.value}</div>
                </div>
                <div className={cx("anlMetricCardDivider")} />
                <div className={cx("anlMetricCardBottom")}>
                  <span className={cx("anlChangeChip", changeDirCls(m.changeDir))}>
                    {m.changeDir === "up" ? "↑" : "↓"} {m.change}
                  </span>
                  <span className={cx("anlChangeSuffix")}>vs last month</span>
                </div>
              </div>
            ))
        }
      </div>

      {/* ── Weekly breakdown ───────────────────────────────────────────────── */}
      {!loading && weeklyBreakdown.length > 0 && (
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

      {/* ── Empty state — no time entries yet ──────────────────────────────── */}
      {!loading && weeklyBreakdown.length === 0 && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="trending-up" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No activity this period</div>
          <div className={cx("emptyStateSub")}>Log time entries to see your weekly breakdown here.</div>
        </div>
      )}
    </section>
  );
}
