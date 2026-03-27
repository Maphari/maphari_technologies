// ════════════════════════════════════════════════════════════════════════════
// personal-performance-page.tsx — Staff Personal Performance
// Data : GET /staff/me/performance    → StaffPerformance
//        GET /staff/me/response-times → StaffResponseTimes
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import {
  getStaffMyPerformance,
  getStaffResponseTimes,
  type StaffPerformance,
  type StaffResponseTimes,
} from "../../../../lib/api/staff/performance";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type PersonalPerformancePageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

type TabKey = "overview" | "time" | "clients" | "milestones";

// ── Constants ─────────────────────────────────────────────────────────────────

const HOURS_TARGET = 40;
const TASKS_TARGET = 16;

const CLIENT_TONES = ["colorAccent", "colorMuted2", "colorGreen", "colorAmber", "colorMuted2"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function milestoneStatusCls(s: string): string {
  if (s === "APPROVED" || s === "approved") return "ppDotApproved";
  if (s === "REJECTED" || s === "rejected") return "ppDotRejected";
  return "ppDotPending";
}

function milestoneLabel(s: string): string {
  if (s === "APPROVED" || s === "approved") return "Approved";
  if (s === "REJECTED" || s === "rejected") return "Rejected";
  return "Pending";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

function pctOf(value: number, target: number): number {
  return target > 0 ? Math.round(Math.min((value / target) * 100, 100)) : 0;
}

function pctCls(pct: number): string {
  if (pct >= 90) return "colorGreen";
  if (pct >= 60) return "colorAmber";
  return "colorRed";
}

// ── SVG: Mini line chart ──────────────────────────────────────────────────────

function MiniLineChart({ data, field }: { data: Record<string, unknown>[]; field: string }) {
  if (data.length < 2) return <svg width="100%" height="32" />;
  const vals  = data.map((d) => (d[field] as number) ?? 0);
  const max   = Math.max(...vals, 1);
  const W = 200, H = 32, pad = 2;
  const pts = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v / max) * (H - pad * 2));
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  pct,
  trend,
  delta,
}: {
  label:   string;
  value:   string;
  sub:     string;
  pct?:    number;
  trend?:  "up" | "down" | "flat";
  delta?:  number;
}) {
  return (
    <div className={cx("ppStatCard")}>
      <div className={cx("ppStatCardTop")}>
        <div className={cx("ppStatLabel")}>{label}</div>
        <div className={cx("ppStatValue")}>{value}</div>
      </div>
      {pct !== undefined && (
        <div
          className={cx("ppStatProgressBar")}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cx("ppStatProgressFill", pctCls(pct) === "colorGreen" ? "ppProgressGreen" : pctCls(pct) === "colorAmber" ? "ppProgressAmber" : "ppProgressRed")}
            style={{ "--pct": `${pct}%` } as React.CSSProperties}
          />
        </div>
      )}
      <div className={cx("ppStatCardDivider")} />
      <div className={cx("ppStatCardBottom")}>
        <span className={cx("ppStatMeta")}>{sub}</span>
        <div className={cx("ppStatBottomRight")}>
          {trend && trend !== "flat" && delta !== undefined && delta !== 0 && (
            <span className={cx("ppStatTrend", trend === "up" ? "ppTrendUp" : "ppTrendDown")}>
              {trend === "up" ? "▲" : "▼"} {Math.abs(delta)}
            </span>
          )}
          {pct !== undefined && (
            <span className={cx("ppStatPct", pctCls(pct))}>{pct}%</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className={cx("ppStatCard", "opacity50")}>
      <div className={cx("ppStatCardTop")}>
        <div className={cx("skeleBlock10x50p")} />
        <div className={cx("skeleBlock22x35p")} />
      </div>
      <div className={cx("ppStatCardDivider")} />
      <div className={cx("skeleBlock9x60p")} />
    </div>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cx("ppWeekRow", "opacity40")}>
          <div className={cx("skeleBlock11x30p")} />
          <div className={cx("skeleBlock9x50p")} />
        </div>
      ))}
    </>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function PersonalPerformancePage({ isActive, session }: PersonalPerformancePageProps) {
  const [perf, setPerf]               = useState<StaffPerformance | null>(null);
  const [responseTimes, setResponseTimes] = useState<StaffResponseTimes | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [tab, setTab]                 = useState<TabKey>("overview");

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void Promise.all([
      getStaffMyPerformance(session),
      getStaffResponseTimes(session),
    ]).then(([perfResult, rtResult]) => {
      if (cancelled) return;
      if (perfResult.nextSession) saveSession(perfResult.nextSession);
      if (rtResult.nextSession)   saveSession(rtResult.nextSession);
      if (perfResult.data)  setPerf(perfResult.data);
      if (rtResult.data)    setResponseTimes(rtResult.data);
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load data.");
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const weeks         = perf?.weeklyData       ?? [];
  const clients       = perf?.clientBreakdown  ?? [];
  const milestones    = perf?.milestoneHistory  ?? [];
  const lastWeek      = weeks[weeks.length - 1]       ?? null;
  const prevWeek      = weeks[weeks.length - 2]       ?? null;
  const totalHours    = weeks.reduce((s, w) => s + (w.hoursLogged ?? 0), 0);
  const totalTasks    = weeks.reduce((s, w) => s + (w.tasksCompleted ?? 0), 0);
  const hoursThisWeek = lastWeek?.hoursLogged    ?? 0;
  const tasksThisWeek = lastWeek?.tasksCompleted ?? 0;

  // Trend vs previous week
  const hoursDelta = prevWeek ? hoursThisWeek - prevWeek.hoursLogged : 0;
  const tasksDelta = prevWeek ? tasksThisWeek - prevWeek.tasksCompleted : 0;
  const hoursTrend: "up" | "down" | "flat" = hoursDelta > 0 ? "up" : hoursDelta < 0 ? "down" : "flat";
  const tasksTrend: "up" | "down" | "flat" = tasksDelta > 0 ? "up" : tasksDelta < 0 ? "down" : "flat";

  // Response rate
  const responseAvg      = responseTimes?.overallAvg ?? null;
  const responseTarget   = responseTimes?.target ?? 2.0;
  const responseOnTarget = responseAvg !== null && responseAvg <= responseTarget;

  const rtChartData = (responseTimes?.weeklyTrend ?? []).map((w) => ({
    week: w.week,
    avg:  w.avg,
  }));

  const TABS: { key: TabKey; label: string }[] = [
    { key: "overview",   label: "Overview"  },
    { key: "time",       label: "Time"       },
    { key: "clients",    label: "Clients"    },
    { key: "milestones", label: "Milestones" },
  ];

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-personal-performance">
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
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-personal-performance">
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-personal-performance">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>My Performance</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal metrics and weekly activity</p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className={cx("staffSegControl")}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={cx("staffSegBtn", tab === t.key && "staffSegBtnActive")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ─────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <>
          <div className={cx("ppStatGrid5")}>
            {(
              <>
                <StatCard
                  label="Hours This Week"
                  value={`${hoursThisWeek}h`}
                  sub={`target: ${HOURS_TARGET}h`}
                  pct={pctOf(hoursThisWeek, HOURS_TARGET)}
                  trend={hoursTrend}
                  delta={Math.abs(hoursDelta)}
                />
                <StatCard
                  label="Tasks This Week"
                  value={`${tasksThisWeek}`}
                  sub={`target: ${TASKS_TARGET}`}
                  pct={pctOf(tasksThisWeek, TASKS_TARGET)}
                  trend={tasksTrend}
                  delta={Math.abs(tasksDelta)}
                />
                <StatCard
                  label="Total Hours"
                  value={`${totalHours}h`}
                  sub={`across ${weeks.length} week${weeks.length !== 1 ? "s" : ""}`}
                />
                <StatCard
                  label="Total Tasks"
                  value={`${totalTasks}`}
                  sub={`across ${weeks.length} week${weeks.length !== 1 ? "s" : ""}`}
                />
                <StatCard
                  label="Response Rate"
                  value={responseAvg !== null ? `${responseAvg.toFixed(1)}h avg` : "—"}
                  sub={`target: ${responseTarget}h`}
                  pct={responseAvg !== null
                    ? Math.min(100, Math.round((responseTarget / Math.max(0.1, responseAvg)) * 100))
                    : undefined
                  }
                />
              </>
            )}
          </div>

          {weeks.length > 1 && (
            <div className={cx("ppChartCard")}>
              <div className={cx("ppChartLabel")}>Weekly Hours Logged</div>
              <MiniLineChart data={weeks as unknown as Record<string, unknown>[]} field="hoursLogged" />
            </div>
          )}

          {rtChartData.length > 1 && (
            <div className={cx("ppChartCard")}>
              <div className={cx("ppChartLabel")}>
                Response Time
                <span className={cx("ppChartLabelMeta", responseOnTarget ? "colorGreen" : "colorAccent")}>
                  {responseAvg !== null ? `${responseAvg.toFixed(1)}h avg` : "—"}
                  {" · "}target: {responseTarget}h
                </span>
              </div>
              <MiniLineChart data={rtChartData} field="avg" />
            </div>
          )}

          {!perf && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="trending-up" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No performance data</div>
              <div className={cx("emptyStateSub")}>Log time and complete tasks to see your metrics here.</div>
            </div>
          )}
        </>
      )}

      {/* ── Time tab ─────────────────────────────────────────────────────── */}
      {tab === "time" && (
        <div className={cx("ppSection")}>
          {weeks.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="clock" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No time data</div>
              <div className={cx("emptyStateSub")}>Weekly time logs will appear here.</div>
            </div>
          ) : (
            <>
              <div className={cx("ppChartCard", "mb16")}>
                <div className={cx("ppChartLabel")}>Tasks Completed per Week</div>
                <MiniLineChart data={weeks as unknown as Record<string, unknown>[]} field="tasksCompleted" />
              </div>
              <div className={cx("ppWeekList")}>
                {[...weeks].reverse().map((w, idx) => {
                  const hPct = pctOf(w.hoursLogged, HOURS_TARGET);
                  const tPct = pctOf(w.tasksCompleted, TASKS_TARGET);
                  return (
                    <div key={w.week} className={cx("ppWeekRow", idx === weeks.length - 1 && "ppWeekRowLast")}>
                      <div className={cx("ppWeekLabel")}>{w.week}</div>
                      <div className={cx("ppWeekMetrics")}>
                        <div className={cx("ppWeekMetric")}>
                          <span className={cx("ppWeekMetricLabel")}>Hours</span>
                          <span className={cx("ppWeekMetricValue", pctCls(hPct))}>{w.hoursLogged}h</span>
                        </div>
                        <div className={cx("ppWeekSep")} />
                        <div className={cx("ppWeekMetric")}>
                          <span className={cx("ppWeekMetricLabel")}>Tasks</span>
                          <span className={cx("ppWeekMetricValue", pctCls(tPct))}>{w.tasksCompleted}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Clients tab ──────────────────────────────────────────────────── */}
      {tab === "clients" && (
        <div className={cx("ppSection")}>
          {clients.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="users" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No client breakdown</div>
              <div className={cx("emptyStateSub")}>Client hours will appear once time is logged against projects.</div>
            </div>
          ) : (
            <div className={cx("ppClientList")}>
              {clients.map((c, idx) => {
                const tone    = CLIENT_TONES[idx % CLIENT_TONES.length];
                const maxH    = Math.max(...clients.map((cl) => cl.hoursLogged), 1);
                const fillPct = Math.round((c.hoursLogged / maxH) * 100);
                const rt = responseTimes?.byClient.find((r) => r.name === c.clientName) ?? null;
                return (
                  <div key={c.clientId} className={cx("ppClientRow")}>
                    <div className={cx("ppClientName")}>{c.clientName}</div>
                    <div className={cx("ppClientBarWrap")}>
                      <div
                        className={cx("ppClientBar", "dotBgAccent")}
                        style={{ "--pct": `${fillPct}%` } as React.CSSProperties}
                      />
                    </div>
                    <div className={cx("ppClientHours", tone)}>{c.hoursLogged}h</div>
                    <div className={cx("ppClientHours", "ppClientHoursWide", "colorMuted2")}>
                      {rt ? `${rt.avg.toFixed(1)}h` : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Milestones tab ───────────────────────────────────────────────── */}
      {tab === "milestones" && (
        <div className={cx("ppSection")}>
          {milestones.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="flag" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No milestone history</div>
              <div className={cx("emptyStateSub")}>Milestones you&apos;ve contributed to will appear here.</div>
            </div>
          ) : (
            <div className={cx("ppMilestoneList")}>
              {milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className={cx("ppMilestoneRow", idx === milestones.length - 1 && "ppMilestoneRowLast")}
                >
                  <div className={cx("ppMilestoneDot", milestoneStatusCls(m.status))} />
                  <div className={cx("ppMilestoneInfo")}>
                    <div className={cx("ppMilestoneTitle")}>{m.title}</div>
                    <div className={cx("ppMilestoneMeta")}>
                      <span className={cx("ppMilestoneStatus")}>{milestoneLabel(m.status)}</span>
                      {m.approvedAt && (
                        <>
                          <span className={cx("ppMilestoneSep")}>·</span>
                          <span>{fmtDate(m.approvedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
