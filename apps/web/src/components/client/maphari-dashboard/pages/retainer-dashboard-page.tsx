"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import {
  loadPortalRetainerWithRefresh,
  loadPortalSlaWithRefresh,
  type PortalRetainerWeek,
  type PortalSlaRecord,
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

const CHART_H = 116;

type RetainerKey = "dev" | "design" | "pm" | "qa";

const SERVICES: { label: string; key: RetainerKey; color: string; icon: string }[] = [
  { label: "Development", key: "dev", color: "var(--lime)", icon: "code" },
  { label: "Design", key: "design", color: "var(--purple)", icon: "layers" },
  { label: "Project Management", key: "pm", color: "var(--green)", icon: "zap" },
  { label: "QA & Testing", key: "qa", color: "var(--amber)", icon: "check" },
];

function csvCell(value: string | number): string {
  const normalized = String(value).replace(/"/g, "\"\"");
  return "\"" + normalized + "\"";
}

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatHours(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "") + "h";
}

function getServiceHours(week: PortalRetainerWeek, key: RetainerKey): number {
  return week[key];
}

function getTopService(week: PortalRetainerWeek): { label: string; hours: number; color: string } | null {
  const ranked = SERVICES.map((service) => ({
    label: service.label,
    hours: getServiceHours(week, service.key),
    color: service.color,
  })).sort((left, right) => right.hours - left.hours);

  if (ranked.length === 0 || ranked[0].hours <= 0) return null;
  return ranked[0];
}

function resolveRetainerCapHours(slaRecords: PortalSlaRecord[]): number | null {
  const candidate = slaRecords.find((record) => {
    if (!record.targetHrs || record.targetHrs <= 0) return false;
    const haystack = (record.metric + " " + record.target + " " + record.tier).toLowerCase();
    return haystack.includes("retainer") || haystack.includes("hour") || haystack.includes("cap");
  });
  return candidate?.targetHrs ?? null;
}

function buildRetainerCsv(weeklyBurn: PortalRetainerWeek[], slaRecords: PortalSlaRecord[], retainerCapHours: number | null): string {
  const lines: string[] = [];
  lines.push([
    "week",
    "week_start",
    "development_hours",
    "design_hours",
    "pm_hours",
    "qa_hours",
    "total_hours",
    "cap_hours",
  ].map(csvCell).join(","));

  weeklyBurn.forEach((week) => {
    lines.push([
      week.week,
      week.weekStart,
      week.dev.toFixed(1),
      week.design.toFixed(1),
      week.pm.toFixed(1),
      week.qa.toFixed(1),
      week.total.toFixed(1),
      retainerCapHours ?? "",
    ].map(csvCell).join(","));
  });

  if (slaRecords.length > 0) {
    lines.push("");
    lines.push(["sla_metric", "tier", "target", "actual", "status", "period_start", "period_end"].map(csvCell).join(","));
    slaRecords.forEach((record) => {
      lines.push([
        record.metric,
        record.tier,
        record.target,
        record.actual,
        record.status,
        record.periodStart,
        record.periodEnd ?? "",
      ].map(csvCell).join(","));
    });
  }

  return lines.join("\n");
}

function triggerRetainerExport(weeklyBurn: PortalRetainerWeek[], slaRecords: PortalSlaRecord[], retainerCapHours: number | null): void {
  const csv = buildRetainerCsv(weeklyBurn, slaRecords, retainerCapHours);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "maphari-retainer-report.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function RetainerDashboardPage() {
  const { session } = useProjectLayer();
  const notify = usePageToast();
  const [weeklyBurn, setWeeklyBurn] = useState<PortalRetainerWeek[]>([]);
  const [slaRecords, setSlaRecords] = useState<PortalSlaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slaModalOpen, setSlaModalOpen] = useState(false);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    async function fetchPageData(): Promise<void> {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }

      const [retainerResult, slaResult] = await Promise.all([
        loadPortalRetainerWithRefresh(session),
        loadPortalSlaWithRefresh(session, session.user.clientId),
      ]);

      if (cancelled) return;

      if (retainerResult.nextSession) saveSession(retainerResult.nextSession);
      if (slaResult.nextSession) saveSession(slaResult.nextSession);

      if (retainerResult.error) {
        setError(retainerResult.error.message);
        notify("error", retainerResult.error.message);
      } else {
        setWeeklyBurn(retainerResult.data ?? []);
      }

      if (slaResult.error) {
        notify("error", "Unable to load SLA records", slaResult.error.message);
        setSlaRecords([]);
      } else {
        setSlaRecords(slaResult.data ?? []);
      }

      setLoading(false);
    }

    void fetchPageData();

    return () => {
      cancelled = true;
    };
  }, [notify, session]);

  async function handleRefresh(): Promise<void> {
    if (!session || refreshing) return;
    setRefreshing(true);
    setError(null);

    const [retainerResult, slaResult] = await Promise.all([
      loadPortalRetainerWithRefresh(session),
      loadPortalSlaWithRefresh(session, session.user.clientId),
    ]);

    if (retainerResult.nextSession) saveSession(retainerResult.nextSession);
    if (slaResult.nextSession) saveSession(slaResult.nextSession);

    if (retainerResult.error) {
      setError(retainerResult.error.message);
      notify("error", "Unable to refresh retainer data", retainerResult.error.message);
    } else {
      setWeeklyBurn(retainerResult.data ?? []);
    }

    if (slaResult.error) {
      notify("error", "Unable to refresh SLA records", slaResult.error.message);
    } else {
      setSlaRecords(slaResult.data ?? []);
    }

    setRefreshing(false);
  }

  const retainerCapHours = useMemo(() => resolveRetainerCapHours(slaRecords), [slaRecords]);
  const trackedWeeks = weeklyBurn.length;
  const weekTotals = useMemo(() => weeklyBurn.map((week) => week.total), [weeklyBurn]);
  const currentWeek = trackedWeeks > 0 ? weeklyBurn[trackedWeeks - 1] : null;
  const currentWeekTotal = currentWeek?.total ?? 0;
  const avgBurn = trackedWeeks > 0 ? Math.round((weekTotals.reduce((sum, value) => sum + value, 0) / trackedWeeks) * 10) / 10 : 0;
  const overBurnWeeks = retainerCapHours ? weeklyBurn.filter((week) => week.total > retainerCapHours).length : 0;
  const pacePct = retainerCapHours && retainerCapHours > 0 ? Math.round((avgBurn / retainerCapHours) * 100) : null;
  const isOverPace = retainerCapHours ? avgBurn > retainerCapHours : false;
  const paceColor = retainerCapHours ? (isOverPace ? "var(--amber)" : "var(--lime)") : "var(--cyan)";
  const latestSla = slaRecords[0] ?? null;

  const serviceData = useMemo(() => SERVICES.map((service) => ({
    ...service,
    total: weeklyBurn.reduce((sum, week) => sum + getServiceHours(week, service.key), 0),
  })), [weeklyBurn]);
  const grandTotal = serviceData.reduce((sum, service) => sum + service.total, 0);

  const recentWeeks = useMemo(() => weeklyBurn.slice().reverse().slice(0, 6), [weeklyBurn]);

  const isPageLoading = session ? loading : false;

  if (isPageLoading) {
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
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Retainer</div>
          <h1 className={cx("pageTitle")}>Retainer Dashboard</h1>
          <p className={cx("pageSub")}>
            Live weekly burn, service mix, and contract guardrails for your current retainer usage.
          </p>
        </div>
        <div className={cx("pageActions", "flexRow", "gap8", "flexWrap")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => { void handleRefresh(); }} disabled={refreshing}>
            <Ic n="refresh" sz={13} c="var(--muted)" /> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setSlaModalOpen(true)}>
            <Ic n="shieldCheck" sz={13} c="var(--muted)" /> View SLA
          </button>
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            onClick={() => {
              if (weeklyBurn.length === 0 && slaRecords.length === 0) {
                notify("error", "Nothing to export", "Retainer data will appear once time is logged or SLA records are available.");
                return;
              }
              triggerRetainerExport(weeklyBurn, slaRecords, retainerCapHours);
              notify("success", "Retainer report exported", "The current retainer report has been downloaded as CSV.");
            }}
          >
            <Ic n="download" sz={13} c="var(--bg)" /> Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      )}

      <div className={cx("topCardsStack")}>
        {[
          { label: "Tracked Weeks", value: String(trackedWeeks), color: "statCardAccent" },
          { label: "This Week", value: formatHours(currentWeekTotal), color: currentWeekTotal > avgBurn && trackedWeeks > 0 ? "statCardAmber" : "statCardGreen" },
          { label: "Average Burn", value: formatHours(avgBurn), color: retainerCapHours && isOverPace ? "statCardAmber" : "statCardGreen" },
          { label: retainerCapHours ? "Contract Cap" : "SLA Status", value: retainerCapHours ? formatHours(retainerCapHours) : (latestSla?.status ?? "Not configured"), color: retainerCapHours ? "statCardBlue" : "statCardMuted" },
        ].map((stat) => (
          <div key={stat.label} className={cx("statCard", stat.color)}>
            <div className={cx("statLabel")}>{stat.label}</div>
            <div className={cx("statValue")}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <div className={cx("flexRow", "flexCenter", "gap7")}>
            <Ic n="chart" sz={14} c="var(--lime)" />
            <span className={cx("cardHdTitle")}>Weekly Hours Burn</span>
          </div>
          <span className={cx("badge", retainerCapHours ? (isOverPace ? "badgeAmber" : "badgeGreen") : "badgeBlue", "mlAuto")}>
            {retainerCapHours ? ("Avg " + formatHours(avgBurn) + " of " + formatHours(retainerCapHours)) : ("Avg " + formatHours(avgBurn))}
          </span>
        </div>

        {weeklyBurn.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="trending" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No burn data yet</div>
            <div className={cx("emptyStateSub")}>Weekly hours burn will display here once your retainer engagement begins.</div>
          </div>
        ) : (
          <div className={cx("pCustom0161616")}>
            <div className={cx("relative")}>
              <div className={cx("absInset", "pointerNone", "pb28")}>
                {[75, 50, 25].map((pct) => (
                  <div key={pct} className={cx("rdGridLine")} style={{ "--pct": (pct / 100) * CHART_H } as React.CSSProperties} />
                ))}
                {retainerCapHours ? (
                  <div className={cx("rdCapLine")}>
                    <span className={cx("absLabelR")}>{formatHours(retainerCapHours)}</span>
                  </div>
                ) : null}
              </div>

              <div className={cx("rdBarsRow")}>
                {weeklyBurn.map((week, index) => {
                  const total = week.total;
                  const chartMax = retainerCapHours && retainerCapHours > 0 ? Math.max(retainerCapHours, total) : Math.max(...weekTotals, total, 1);
                  const barH = Math.min(Math.round((total / chartMax) * CHART_H), CHART_H + 12);
                  const isCurrent = index === weeklyBurn.length - 1;
                  const isOver = retainerCapHours ? total > retainerCapHours : false;

                  return (
                    <div key={week.weekStart} className={cx("rdWeekCol")}>
                      <span className={cx("rdHourLabel", "dynColor")} style={{ "--color": isOver ? "var(--red)" : isCurrent ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>
                        {formatHours(total)}
                      </span>
                      <div className={cx("rdStackedBar", isCurrent && "rdStackedBarCurr")} style={{ "--bar-h": barH + "px" } as React.CSSProperties}>
                        {SERVICES.map((service) => {
                          const serviceHours = getServiceHours(week, service.key);
                          const servicePct = total > 0 ? (serviceHours / total) * 100 : 0;
                          return (
                            <div
                              key={service.key}
                              className={cx("rdBarSeg", "dynBgColor")}
                              style={{ "--pct": servicePct + "%", "--bg-color": service.color } as React.CSSProperties}
                            />
                          );
                        })}
                      </div>
                      <div className={cx("dividerH1")} />
                      <div className={cx("mt5", "fs9", "textCenter", "dynColor", isCurrent && "fw700")} style={{ "--color": isCurrent ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>
                        {week.week}
                      </div>
                      {isCurrent ? <div className={cx("dot4Lime")} /> : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cx("flexRow", "gap14", "mt12", "flexWrap")}>
              {SERVICES.map((service) => (
                <div key={service.label} className={cx("flexRow", "gap5")}>
                  <div className={cx("dot8sq", "dynBgColor")} style={{ "--bg-color": service.color } as React.CSSProperties} />
                  <span className={cx("text10", "colorMuted")}>{service.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={cx("grid2")}>
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <div className={cx("flexRow", "flexCenter", "gap7")}>
              <Ic n="layers" sz={14} c="var(--purple)" />
              <span className={cx("cardHdTitle")}>Service Breakdown</span>
            </div>
          </div>
          <div className={cx("cardBodyPad")}>
            {grandTotal === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="chart" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No service data yet</div>
                <div className={cx("emptyStateSub")}>Service breakdown will populate once retainer hours are logged.</div>
              </div>
            ) : (
              <>
                {serviceData.map((service) => (
                  <div key={service.label} className={cx("mb16")}>
                    <div className={cx("flexBetween", "mb7")}>
                      <div className={cx("flexRow", "flexCenter", "gap9")}>
                        <div className={cx("rdSvcIconBox", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, " + service.color + " 12%, var(--s2))", "--color": "color-mix(in oklab, " + service.color + " 25%, transparent)" } as React.CSSProperties}>
                          <Ic n={service.icon} sz={13} c={service.color} />
                        </div>
                        <span className={cx("text12")}>{service.label}</span>
                      </div>
                      <div className={cx("flexRow", "gap8")}>
                        <span className={cx("fw700", "text12")}>{formatHours(service.total)}</span>
                        <span className={cx("rdSvcPctBadge", "dynBgColor", "dynColor")} style={{ "--bg-color": "color-mix(in oklab, " + service.color + " 10%, transparent)", "--color": service.color, "--border-color": "color-mix(in oklab, " + service.color + " 22%, transparent)" } as React.CSSProperties}>
                          {Math.round((service.total / grandTotal) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className={cx("progressTrack")}>
                      <div className={cx("pctFillRInherit", "dynBgColor")} style={{ "--pct": (service.total / grandTotal) * 100, "--bg-color": service.color } as React.CSSProperties} />
                    </div>
                    <div className={cx("text10", "colorMuted", "mt4")}>
                      avg {trackedWeeks > 0 ? formatHours(service.total / trackedWeeks) : "0h"} per week
                    </div>
                  </div>
                ))}

                <div className={cx("pt12", "borderT")}>
                  <div className={cx("text10", "colorMuted", "mb6")}>
                    Total {formatHours(grandTotal)} across {trackedWeeks} tracked weeks
                  </div>
                  <div className={cx("rdCompositionBar")}>
                    {serviceData.map((service) => (
                      <div
                        key={service.label}
                        title={service.label + ": " + formatHours(service.total)}
                        className={cx("rdBarSeg", "dynBgColor")}
                        style={{ "--pct": (service.total / grandTotal) * 100 + "%", "--bg-color": service.color } as React.CSSProperties}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={cx("card", "borderLeft3")} style={{ "--border-color": paceColor } as React.CSSProperties}>
          <div className={cx("cardHd")}>
            <div className={cx("flexRow", "flexCenter", "gap7")}>
              <Ic n={retainerCapHours ? (isOverPace ? "alert" : "check") : "chart"} sz={14} c={paceColor} />
              <span className={cx("cardHdTitle")}>{retainerCapHours ? "Burn Pace" : "Usage Trend"}</span>
            </div>
            <span className={cx("badge", retainerCapHours ? (isOverPace ? "badgeAmber" : "badgeGreen") : "badgeBlue", "mlAuto")}>
              {retainerCapHours ? (isOverPace ? "Over pace" : "On pace") : "No cap configured"}
            </span>
          </div>
          <div className={cx("cardBodyPad")}>
            <div className={cx("mb16")}>
              <div className={cx("flexBetween", "mb8")}>
                <span className={cx("text12", "colorMuted")}>{retainerCapHours ? "Average weekly burn rate" : "Recent weekly burn rate"}</span>
                <span className={cx("rdPacePct", "dynColor")} style={{ "--color": paceColor } as React.CSSProperties}>
                  {retainerCapHours ? (pacePct ?? 0) + "%" : formatHours(currentWeekTotal)}
                </span>
              </div>
              <div className={cx("rdPaceTrack")}>
                <div
                  className={cx("pctFillRInherit", "dynBgColor")}
                  style={{ "--pct": retainerCapHours ? Math.min(pacePct ?? 0, 100) : Math.min(Math.round((currentWeekTotal / Math.max(avgBurn || 1, currentWeekTotal || 1)) * 100), 100), "--bg-color": paceColor } as React.CSSProperties}
                />
              </div>
              <div className={cx("flexBetween")}>
                <span className={cx("text10", "colorMuted")}>0h</span>
                <span className={cx("text10", "colorMuted")}>{retainerCapHours ? (formatHours(retainerCapHours) + " cap") : ("avg " + formatHours(avgBurn))}</span>
              </div>
            </div>

            <div className={cx("rdPaceCallout", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, " + paceColor + " 8%, var(--s3))", "--border-color": "color-mix(in oklab, " + paceColor + " 20%, transparent)" } as React.CSSProperties}>
              <div className={cx("flexRow", "flexCenter", "gap6", "mb4")}>
                <Ic n={retainerCapHours ? (isOverPace ? "alert" : "check") : "info"} sz={12} c={paceColor} />
                <span className={cx("fw700", "text12", "dynColor")} style={{ "--color": paceColor } as React.CSSProperties}>
                  {retainerCapHours ? (isOverPace ? "Over-pace alert" : "Healthy usage") : "Contract cap unavailable"}
                </span>
              </div>
              <span className={cx("text11", "colorMuted")}>
                {retainerCapHours
                  ? (isOverPace
                    ? ("Average burn is " + formatHours(avgBurn - retainerCapHours) + " above the recorded weekly cap.")
                    : ("Average burn is " + formatHours(retainerCapHours - avgBurn) + " below the recorded weekly cap."))
                  : "No hourly cap was found in the available SLA records, so the dashboard is showing burn trend only."}
              </span>
            </div>

            {[
              { label: "Tracked weeks", value: String(trackedWeeks), icon: "calendar", color: "var(--muted2)" },
              { label: "Average burn", value: formatHours(avgBurn), icon: "chart", color: paceColor },
              { label: "Current week", value: formatHours(currentWeekTotal), icon: "zap", color: currentWeekTotal > avgBurn ? "var(--amber)" : "var(--muted2)" },
              { label: retainerCapHours ? "Over-cap weeks" : "Latest SLA", value: retainerCapHours ? String(overBurnWeeks) : (latestSla?.metric ?? "Not available"), icon: retainerCapHours ? "alert" : "shieldCheck", color: retainerCapHours && overBurnWeeks > 0 ? "var(--amber)" : "var(--muted2)" },
            ].map((item) => (
              <div key={item.label} className={cx("flexBetween", "py8_0", "borderB")}>
                <div className={cx("flexRow", "flexCenter", "gap7")}>
                  <Ic n={item.icon} sz={12} c={item.color} />
                  <span className={cx("text12", "colorMuted")}>{item.label}</span>
                </div>
                <span className={cx("fw700", "text12")}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={cx("grid2")}>
        <div className={cx("card", "p0", "overflowHidden")}>
          <div className={cx("cardHd", "pl18")}>
            <div className={cx("flexRow", "flexCenter", "gap7")}>
              <Ic n="calendar" sz={13} c="var(--muted)" />
              <span className={cx("cardHdTitle")}>Recent Weekly Ledger</span>
            </div>
            <span className={cx("text11", "colorMuted", "mlAuto")}>Latest tracked weeks</span>
          </div>

          {recentWeeks.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No weekly ledger yet</div>
              <div className={cx("emptyStateSub")}>Recent weekly usage will appear here once retainer hours are logged.</div>
            </div>
          ) : (
            recentWeeks.map((week, index) => {
              const topService = getTopService(week);
              const isOver = retainerCapHours ? week.total > retainerCapHours : false;
              const variance = retainerCapHours ? week.total - retainerCapHours : null;
              return (
                <div
                  key={week.weekStart}
                  className={cx("rdHistRow", index > 0 && "borderT")}
                >
                  <div className={cx("rdHistIconBox", "dynBgColor")} style={{ "--bg-color": isOver ? "color-mix(in oklab, var(--red) 10%, var(--s2))" : "color-mix(in oklab, var(--cyan) 10%, var(--s2))", "--color": isOver ? "color-mix(in oklab, var(--red) 22%, transparent)" : "color-mix(in oklab, var(--cyan) 22%, transparent)" } as React.CSSProperties}>
                    <Ic n={isOver ? "alert" : "clock"} sz={15} c={isOver ? "var(--red)" : "var(--cyan)"} />
                  </div>

                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("flexBetween", "mb7")}>
                      <div>
                        <div className={cx("fw600", "text12")}>{week.week}</div>
                        <div className={cx("text10", "colorMuted")}>{formatShortDate(week.weekStart)}</div>
                      </div>
                      <div className={cx("flexRow", "gap8", "flexCenter")}>
                        <span className={cx("fw700", "text12")}>{formatHours(week.total)}</span>
                        <span className={cx("badge", isOver ? "badgeRed" : "badgeBlue")}>
                          {retainerCapHours ? (isOver ? "Above cap" : "Within cap") : "Tracked"}
                        </span>
                      </div>
                    </div>

                    <div className={cx("progressTrack")}>
                      <div className={cx("pctFillRInherit", "dynBgColor")} style={{ "--pct": retainerCapHours ? Math.min(Math.round((week.total / retainerCapHours) * 100), 100) : 100, "--bg-color": topService?.color ?? "var(--cyan)" } as React.CSSProperties} />
                    </div>

                    <div className={cx("flexBetween", "mt5")}>
                      <div className={cx("text10", "colorMuted")}>
                        {topService ? ("Top service: " + topService.label + " · " + formatHours(topService.hours)) : "No service breakdown available"}
                      </div>
                      <div className={cx("text10", "colorMuted")}>
                        {variance !== null ? ((variance > 0 ? "+" : "") + formatHours(variance) + " vs cap") : "No cap on file"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <div className={cx("flexRow", "flexCenter", "gap7")}>
              <Ic n="shieldCheck" sz={14} c="var(--cyan)" />
              <span className={cx("cardHdTitle")}>SLA Snapshot</span>
            </div>
          </div>
          <div className={cx("cardBodyPad")}>
            {latestSla ? (
              <>
                <div className={cx("flexBetween", "mb12")}>
                  <div>
                    <div className={cx("text10", "colorMuted", "uppercase", "ls01")}>Current metric</div>
                    <div className={cx("fw700", "text14")}>{latestSla.metric}</div>
                  </div>
                  <span className={cx("badge", latestSla.status === "ON_TRACK" ? "badgeGreen" : latestSla.status === "BREACHED" ? "badgeRed" : "badgeAmber")}>
                    {latestSla.status}
                  </span>
                </div>

                {[
                  { label: "Tier", value: latestSla.tier },
                  { label: "Target", value: latestSla.target },
                  { label: "Actual", value: latestSla.actual },
                  { label: "Variance", value: latestSla.variance ?? "—" },
                  { label: "Period start", value: formatShortDate(latestSla.periodStart) },
                  { label: "Period end", value: latestSla.periodEnd ? formatShortDate(latestSla.periodEnd) : "Open-ended" },
                ].map((row) => (
                  <div key={row.label} className={cx("flexBetween", "py8_0", "borderB")}>
                    <span className={cx("text12", "colorMuted")}>{row.label}</span>
                    <span className={cx("fw700", "text12")}>{row.value}</span>
                  </div>
                ))}

                <button type="button" className={cx("btnSm", "btnGhost", "mt16")} onClick={() => setSlaModalOpen(true)}>
                  <Ic n="file" sz={13} c="var(--muted)" /> Open full SLA history
                </button>
              </>
            ) : (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="shieldCheck" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No SLA records yet</div>
                <div className={cx("emptyStateSub")}>SLA records will appear here once your support and response targets are configured.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {slaModalOpen ? (
        <div className={cx("modalOverlay", "fixedOverlay9999")} onClick={() => setSlaModalOpen(false)}>
          <div className={cx("pmModalInner")} onClick={(event) => event.stopPropagation()}>
            <div className={cx("pmModalHd")}>
              <div>
                <div className={cx("text10", "colorMuted", "uppercase", "ls01")}>Client SLA</div>
                <div className={cx("fw800", "text16")}>Service-level history</div>
              </div>
              <button type="button" className={cx("iconBtn")} onClick={() => setSlaModalOpen(false)} aria-label="Close SLA dialog">
                <Ic n="close" sz={14} c="var(--muted)" />
              </button>
            </div>

            <div className={cx("flexCol", "gap12")}>
              {slaRecords.length === 0 ? (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}><Ic n="shieldCheck" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("emptyStateTitle")}>No SLA records yet</div>
                  <div className={cx("emptyStateSub")}>There are no service-level records available for this client yet.</div>
                </div>
              ) : (
                slaRecords.map((record) => (
                  <div key={record.id} className={cx("cardBodyPad", "border", "rounded16")}>
                    <div className={cx("flexBetween", "mb10")}>
                      <div>
                        <div className={cx("fw700", "text13")}>{record.metric}</div>
                        <div className={cx("text10", "colorMuted")}>{record.tier} · {formatShortDate(record.periodStart)}</div>
                      </div>
                      <span className={cx("badge", record.status === "ON_TRACK" ? "badgeGreen" : record.status === "BREACHED" ? "badgeRed" : "badgeAmber")}>
                        {record.status}
                      </span>
                    </div>
                    <div className={cx("grid2", "gap12")}>
                      <div>
                        <div className={cx("text10", "colorMuted", "uppercase", "ls01")}>Target</div>
                        <div className={cx("fw700", "text12")}>{record.target}</div>
                      </div>
                      <div>
                        <div className={cx("text10", "colorMuted", "uppercase", "ls01")}>Actual</div>
                        <div className={cx("fw700", "text12")}>{record.actual}</div>
                      </div>
                      <div>
                        <div className={cx("text10", "colorMuted", "uppercase", "ls01")}>Variance</div>
                        <div className={cx("fw700", "text12")}>{record.variance ?? "—"}</div>
                      </div>
                      <div>
                        <div className={cx("text10", "colorMuted", "uppercase", "ls01")}>Period end</div>
                        <div className={cx("fw700", "text12")}>{record.periodEnd ? formatShortDate(record.periodEnd) : "Open-ended"}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
