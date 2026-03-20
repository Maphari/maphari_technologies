// ════════════════════════════════════════════════════════════════════════════
// response-time-page.tsx — Staff Response Time SLA
// Data : GET /staff/me/response-times → StaffResponseTimes
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import {
  getStaffResponseTimes,
  type StaffResponseTimeRecord,
  type StaffResponseTimes,
} from "../../../../lib/api/staff/performance";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type ResponseTimePageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

type TabKey = "overview" | "by_client" | "log";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatHours(h: number | null): string {
  if (h === null) return "—";
  if (h < 1)  return `${Math.round(h * 60)}m`;
  if (h >= 24) return `${Math.round(h / 24)}d`;
  return `${h.toFixed(1)}h`;
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

function statusCls(s: string): string {
  if (s === "MET")    return "rtStatusMet";
  if (s === "MISSED") return "rtStatusMissed";
  return "rtStatusPending";
}

function statusLabel(s: string): string {
  if (s === "MET")    return "Met";
  if (s === "MISSED") return "Missed";
  return "Pending";
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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className={cx("rtStatCard", "opacity50")}>
      <div className={cx("rtStatCardTop")}>
        <div className={cx("skeleBlock10x50p")} />
        <div className={cx("skeleBlock22x35p")} />
      </div>
      <div className={cx("rtStatCardDivider")} />
      <div className={cx("skeleBlock9x60p")} />
    </div>
  );
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
  }, [session?.accessToken]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const slaRate = (data && data.totalCount > 0)
    ? Math.round((data.metCount / data.totalCount) * 100)
    : 0;

  const byClient = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, StaffResponseTimeRecord[]>();
    for (const r of data.records) {
      if (!map.has(r.clientName)) map.set(r.clientName, []);
      map.get(r.clientName)!.push(r);
    }
    return Array.from(map.entries()).map(([name, records]) => ({ name, records }));
  }, [data]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: "overview",  label: "Overview"  },
    { key: "by_client", label: "By Client" },
    { key: "log",       label: "SLA Log"   },
  ];

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

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-response-time">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>Response Times</h1>
        <p className={cx("pageSubtitleText", "mb20")}>SLA tracking for client communications</p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className={cx("rtTabBar")}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={cx("rtTab", tab === t.key && "rtTabActive")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ─────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <>
          <div className={cx("rtStatGrid")}>
            {loading ? (
              [1, 2, 3, 4].map((n) => <SkeletonStat key={n} />)
            ) : (
              <>
                <div className={cx("rtStatCard")}>
                  <div className={cx("rtStatCardTop")}>
                    <div className={cx("rtStatLabel")}>Avg Response</div>
                    <div className={cx("rtStatValue")}>{formatHours(data?.avgActual ?? null)}</div>
                  </div>
                  <div className={cx("rtStatCardDivider")} />
                  <div className={cx("rtStatCardBottom")}>
                    <span className={cx("rtStatDot", "dotBgAccent")} />
                    <span className={cx("rtStatMeta")}>actual average</span>
                  </div>
                </div>

                <div className={cx("rtStatCard")}>
                  <div className={cx("rtStatCardTop")}>
                    <div className={cx("rtStatLabel")}>SLA Target</div>
                    <div className={cx("rtStatValue")}>{formatHours(data?.avgTarget ?? null)}</div>
                  </div>
                  <div className={cx("rtStatCardDivider")} />
                  <div className={cx("rtStatCardBottom")}>
                    <span className={cx("rtStatDot", "dotBgMuted2")} />
                    <span className={cx("rtStatMeta")}>target average</span>
                  </div>
                </div>

                <div className={cx("rtStatCard")}>
                  <div className={cx("rtStatCardTop")}>
                    <div className={cx("rtStatLabel")}>SLA Met</div>
                    <div className={cx("rtStatValue", slaRateCls(slaRate))}>{slaRate}%</div>
                  </div>
                  <div className={cx("rtStatCardDivider")} />
                  <div className={cx("rtStatCardBottom")}>
                    <span className={cx("rtStatDot", "dynBgColor")} style={{ "--bg-color": slaRate >= 80 ? "var(--green)" : "var(--red)" } as React.CSSProperties} />
                    <span className={cx("rtStatMeta")}>{data?.metCount ?? 0} of {data?.totalCount ?? 0} records</span>
                  </div>
                </div>

                <div className={cx("rtStatCard")}>
                  <div className={cx("rtStatCardTop")}>
                    <div className={cx("rtStatLabel")}>Records</div>
                    <div className={cx("rtStatValue")}>{data?.totalCount ?? 0}</div>
                  </div>
                  <div className={cx("rtStatCardDivider")} />
                  <div className={cx("rtStatCardBottom")}>
                    <span className={cx("rtStatDot", "dotBgMuted2")} />
                    <span className={cx("rtStatMeta")}>this period</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {!loading && data && (
            <div className={cx("rtProgressSection")}>
              <div className={cx("rtProgressHeader")}>
                <span className={cx("rtProgressLabel")}>SLA Compliance Rate</span>
                <span className={cx("rtProgressPct", slaRateCls(slaRate))}>{slaRate}%</span>
              </div>
              <div className={cx("progressTrack")}>
                <div
                  className={cx("progressFill", slaFillCls(slaRate))}
                  style={{ '--pct': `${slaRate}%` } as React.CSSProperties}
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
              <div className={cx("emptyStateSub")}>SLA records per client will appear here.</div>
            </div>
          ) : (
            byClient.map(({ name, records }) => {
              const met    = records.filter((r) => r.status === "MET").length;
              const rate   = records.length > 0 ? Math.round((met / records.length) * 100) : 0;
              const sumAct = records.reduce((s, r) => s + (r.actualHours ?? 0), 0);
              const avgAct = records.length > 0 ? sumAct / records.length : 0;
              return (
                <div key={name} className={cx("rtClientCard")}>
                  <div className={cx("rtClientCardHead")}>
                    <span className={cx("rtClientName")}>{name}</span>
                    <span className={cx("rtSlaRate", slaRateCls(rate))}>{rate}% SLA</span>
                  </div>
                  <div className={cx("rtClientMeta")}>
                    <span>{records.length} record{records.length !== 1 ? "s" : ""}</span>
                    <span className={cx("rtMetSep")}>·</span>
                    <span>avg {formatHours(avgAct)}</span>
                    <span className={cx("rtMetSep")}>·</span>
                    <span>{met} met</span>
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

      {/* ── SLA Log tab ──────────────────────────────────────────────────── */}
      {tab === "log" && (
        <div className={cx("rtSection")}>
          {loading ? (
            <div className={cx("colorMuted2", "text12", "mt16")}>Loading…</div>
          ) : !data || data.records.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="file-text" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No SLA records</div>
              <div className={cx("emptyStateSub")}>Records appear once response times are logged.</div>
            </div>
          ) : (
            <div className={cx("rtLogList")}>
              {data.records.map((r, idx) => (
                <div
                  key={r.id}
                  className={cx("rtLogRow", idx === data.records.length - 1 && "rtLogRowLast")}
                >
                  <div className={cx("rtLogLeft")}>
                    <span className={cx("rtStatusBadge", statusCls(r.status))}>{statusLabel(r.status)}</span>
                    <div>
                      <div className={cx("rtLogClient")}>{r.clientName}</div>
                      <div className={cx("rtLogMetric")}>{r.metric}</div>
                    </div>
                  </div>
                  <div className={cx("rtLogRight")}>
                    <div className={cx("rtLogTimes")}>
                      <span className={cx("rtLogActual")}>{formatHours(r.actualHours)}</span>
                      <span className={cx("rtLogOf")}>/ {formatHours(r.targetHours)}</span>
                    </div>
                    <div className={cx("rtLogPeriod")}>
                      {fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}
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
