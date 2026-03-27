// ════════════════════════════════════════════════════════════════════════════
// response-time-page.tsx — Staff Response Time SLA
// Data : GET /staff/me/response-times → StaffResponseTimes
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import {
  getStaffResponseTimes,
  type StaffResponseTimes,
} from "../../../../lib/api/staff/performance";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type ResponseTimePageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

type TabKey = "overview" | "by_client" | "trend";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatHours(h: number | null): string {
  if (h === null) return "—";
  if (h < 1)  return `${Math.round(h * 60)}m`;
  if (h >= 24) return `${Math.round(h / 24)}d`;
  return `${h.toFixed(1)}h`;
}

function onTargetCls(avg: number, target: number): string {
  if (avg <= target)          return "colorGreen";
  if (avg <= target * 1.5)    return "colorAmber";
  return "colorRed";
}

function onTargetFillCls(avg: number, target: number): string {
  if (avg <= target)          return "progressFillGreen";
  if (avg <= target * 1.5)    return "progressFillAmber";
  return "progressFillRed";
}

function slaRateCls(rate: number): string {
  if (rate >= 80) return "colorGreen";
  if (rate >= 60) return "colorAmber";
  return "colorRed";
}

function slaFillCls(rate: number): string {
  if (rate >= 80) return "progressFillGreen";
  if (rate >= 60) return "progressFillAmber";
  return "progressFillRed";
}

// ── Page component ────────────────────────────────────────────────────────────

export function ResponseTimePage({ isActive, session }: ResponseTimePageProps) {
  const [data, setData]       = useState<StaffResponseTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<TabKey>("overview");

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    void getStaffResponseTimes(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setData(result.data);
    }).catch(() => {
      // ignore
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const overallAvg   = data?.overallAvg ?? null;
  const target       = data?.target ?? 2.0;
  const weeklyTrend  = data?.weeklyTrend ?? [];
  const byClient     = data?.byClient ?? [];

  // Compute a "compliance rate" from byClient: % of clients on target
  const onTargetCount  = byClient.filter((c) => c.avg <= target).length;
  const complianceRate = byClient.length > 0
    ? Math.round((onTargetCount / byClient.length) * 100)
    : 0;

  const TABS: { key: TabKey; label: string }[] = [
    { key: "overview",  label: "Overview"  },
    { key: "by_client", label: "By Client" },
    { key: "trend",     label: "Weekly Trend" },
  ];

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-response-time">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-response-time">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>Response Times</h1>
        <p className={cx("pageSubtitleText", "mb20")}>SLA tracking for client communications</p>
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
          <div className={cx("staffKpiStrip")}>
            <div className={cx("staffKpiCell")}>
              <div className={cx("staffKpiLabel")}>Avg Response</div>
              <div className={cx("staffKpiValue", overallAvg !== null ? onTargetCls(overallAvg, target) : "")}>
                {formatHours(overallAvg)}
              </div>
              <div className={cx("staffKpiSub")}>overall average</div>
            </div>
            <div className={cx("staffKpiCell")}>
              <div className={cx("staffKpiLabel")}>SLA Target</div>
              <div className={cx("staffKpiValue")}>{formatHours(target)}</div>
              <div className={cx("staffKpiSub")}>target hours</div>
            </div>
            <div className={cx("staffKpiCell")}>
              <div className={cx("staffKpiLabel")}>On Target</div>
              <div className={cx("staffKpiValue", slaRateCls(complianceRate))}>{complianceRate}%</div>
              <div className={cx("staffKpiSub")}>{onTargetCount} of {byClient.length} clients</div>
            </div>
            <div className={cx("staffKpiCell")}>
              <div className={cx("staffKpiLabel")}>Clients</div>
              <div className={cx("staffKpiValue")}>{byClient.length}</div>
              <div className={cx("staffKpiSub")}>with data</div>
            </div>
          </div>

          {!loading && data && overallAvg !== null && (
            <div className={cx("rtProgressSection")}>
              <div className={cx("rtProgressHeader")}>
                <span className={cx("rtProgressLabel")}>Response vs Target</span>
                <span className={cx("rtProgressPct", onTargetCls(overallAvg, target))}>
                  {overallAvg.toFixed(1)}h / {target}h target
                </span>
              </div>
              <div className={cx("progressTrack")}>
                <div
                  className={cx("progressFill", onTargetFillCls(overallAvg, target))}
                  style={{ '--pct': `${Math.min(100, Math.round((target / Math.max(0.1, overallAvg)) * 100))}%` } as React.CSSProperties}
                />
              </div>
            </div>
          )}

          {!loading && !data && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="clock" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No response time data</div>
              <div className={cx("emptyStateSub")}>SLA records will appear here once response times are logged.</div>
            </div>
          )}
        </>
      )}

      {/* ── By Client tab ────────────────────────────────────────────────── */}
      {tab === "by_client" && (
        <div className={cx("rtSection")}>
          {loading ? (
            <div className={cx("colorMuted2", "text12", "mt16")}>Loading…</div>
          ) : byClient.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="bar-chart-2" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No client data</div>
              <div className={cx("emptyStateSub")}>Response time data per client will appear here.</div>
            </div>
          ) : (
            byClient.map((c) => {
              const rate = Math.min(100, Math.round((target / Math.max(0.1, c.avg)) * 100));
              return (
                <div key={c.clientId} className={cx("rtClientCard")}>
                  <div className={cx("rtClientCardHead")}>
                    <span className={cx("rtClientName")}>{c.name}</span>
                    <span className={cx("rtSlaRate", onTargetCls(c.avg, target))}>
                      {c.avg.toFixed(1)}h avg
                    </span>
                  </div>
                  <div className={cx("rtClientMeta")}>
                    <span>avg {formatHours(c.avg)}</span>
                    <span className={cx("rtMetSep")}>·</span>
                    <span>target: {formatHours(target)}</span>
                  </div>
                  <div className={cx("progressTrack", "mt8")}>
                    <div className={cx("progressFill", slaFillCls(rate))} style={{ '--pct': `${rate}%` } as React.CSSProperties} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Weekly Trend tab ─────────────────────────────────────────────── */}
      {tab === "trend" && (
        <div className={cx("rtSection")}>
          {loading ? (
            <div className={cx("colorMuted2", "text12", "mt16")}>Loading…</div>
          ) : weeklyTrend.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="trending-up" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No trend data</div>
              <div className={cx("emptyStateSub")}>Weekly response time trend will appear here.</div>
            </div>
          ) : (
            <div className={cx("rtLogList")}>
              {[...weeklyTrend].reverse().map((w, idx) => {
                const rate = Math.min(100, Math.round((target / Math.max(0.1, w.avg)) * 100));
                return (
                  <div
                    key={w.week}
                    className={cx("rtLogRow", idx === weeklyTrend.length - 1 && "rtLogRowLast")}
                  >
                    <div className={cx("rtLogLeft")}>
                      <span className={cx("rtStatusBadge", w.avg <= target ? "rtStatusMet" : "rtStatusMissed")}>
                        {w.avg <= target ? "On target" : "Over"}
                      </span>
                      <div>
                        <div className={cx("rtLogClient")}>{w.week}</div>
                      </div>
                    </div>
                    <div className={cx("rtLogRight")}>
                      <div className={cx("rtLogTimes")}>
                        <span className={cx("rtLogActual", onTargetCls(w.avg, target))}>{formatHours(w.avg)}</span>
                        <span className={cx("rtLogOf")}>/ {formatHours(target)}</span>
                      </div>
                      <div className={cx("rtLogPeriod")}>{rate}% on target</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
