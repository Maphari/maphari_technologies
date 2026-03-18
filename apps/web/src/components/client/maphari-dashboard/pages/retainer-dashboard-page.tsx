// ════════════════════════════════════════════════════════════════════════════
// retainer-dashboard-page.tsx — Client Portal Retainer Dashboard
// Data : GET /retainer → PortalRetainerWeek[]  (core service, CLIENT scoped)
// ════════════════════════════════════════════════════════════════════════════
"use client";
import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { loadPortalRetainerWithRefresh, type PortalRetainerWeek } from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

const RETAINER_MAX = 30;
const CHART_H      = 116; // px, max bar height

type RetainerKey = "dev" | "design" | "pm" | "qa";

const SERVICES: { label: string; key: RetainerKey; color: string; icon: string }[] = [
  { label: "Development",        key: "dev",    color: "var(--lime)",   icon: "code"    },
  { label: "Design",             key: "design", color: "var(--purple)", icon: "layers"  },
  { label: "Project Management", key: "pm",     color: "var(--green)",  icon: "zap"     },
  { label: "QA & Testing",       key: "qa",     color: "var(--amber)",  icon: "check"   },
];

type MStatus = "Settled" | "Overdue" | "Upcoming";
const MONTHS: { month: string; hours: number; cap: number; cost: string; status: MStatus }[] = [];

const MSTATUS_COLOR: Record<MStatus, string> = { Settled: "var(--lime)", Overdue: "var(--red)", Upcoming: "var(--b3)" };
const MSTATUS_BADGE: Record<MStatus, string> = { Settled: "badgeGreen",  Overdue: "badgeRed",   Upcoming: "badgeMuted" };
const MSTATUS_ICON:  Record<MStatus, string> = { Settled: "check",       Overdue: "alert",      Upcoming: "clock"      };

export function RetainerDashboardPage() {
  const { session } = useProjectLayer();
  const [weeklyBurn, setWeeklyBurn] = useState<PortalRetainerWeek[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    void loadPortalRetainerWithRefresh(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) setWeeklyBurn(result.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  const todayWeek        = weeklyBurn.length;
  const weekTotals       = weeklyBurn.map((w) => w.dev + w.design + w.pm + w.qa);
  const avgBurn          = weekTotals.length > 0 ? Math.round(weekTotals.reduce((a, v) => a + v, 0) / weekTotals.length) : 0;
  const currentWeekTotal = weekTotals[todayWeek - 1] ?? 0;
  const overBurnWeeks    = weekTotals.filter((t) => t > RETAINER_MAX).length;
  const isOverPace       = avgBurn > RETAINER_MAX * 0.93;
  const paceColor        = isOverPace ? "var(--amber)" : "var(--lime)";
  const pacePct          = Math.round((avgBurn / RETAINER_MAX) * 100);

  const serviceData = SERVICES.map((s) => ({
    ...s,
    total: weeklyBurn.reduce((a, w) => a + (w[s.key] as number), 0),
  }));
  const grandTotal = serviceData.reduce((a, s) => a + s.total, 0);

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Retainer</div>
          <h1 className={cx("pageTitle")}>Retainer Dashboard</h1>
          <p className={cx("pageSub")}>8-week hours burn, service breakdown, and pace analysis for your monthly retainer.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")}>
            <Ic n="file" sz={13} c="var(--muted)" /> View SLA
          </button>
          <button type="button" className={cx("btnSm", "btnAccent")}>
            <Ic n="download" sz={13} c="var(--bg)" /> Export Report
          </button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack")}>
        {[
          { label: "Monthly Cap",     value: `${RETAINER_MAX}h/wk`,  color: "statCardAccent"                                                            },
          { label: "This Week",       value: `${currentWeekTotal}h`, color: currentWeekTotal > 28 ? "statCardRed" : currentWeekTotal > 20 ? "statCardAmber" : "statCardGreen" },
          { label: "Avg Burn",        value: `${avgBurn}h/wk`,       color: isOverPace ? "statCardAmber" : "statCardGreen"                              },
          { label: "Over-burn Weeks", value: `${overBurnWeeks} of 8`,color: overBurnWeeks > 0 ? "statCardRed" : "statCardGreen"                        },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Stacked burn chart ───────────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <div className={cx("flexRow", "flexCenter", "gap7")}>
            <Ic n="chart" sz={14} c="var(--lime)" />
            <span className={cx("cardHdTitle")}>8-Week Hours Burn</span>
          </div>
          <span className={cx("badge", isOverPace ? "badgeAmber" : "badgeGreen", "mlAuto")}>
            Avg {avgBurn}h/wk — {isOverPace ? "over pace" : "on pace"}
          </span>
        </div>

        {weeklyBurn.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="trending" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>{loading ? "Loading burn data…" : "No burn data yet"}</div>
            <div className={cx("emptyStateSub")}>{loading ? "" : "Weekly hours burn will display here once your retainer engagement begins."}</div>
          </div>
        ) : (
        <div className={cx("pCustom0161616")}>
          <div className={cx("relative")}>

            {/* Gridlines + 30h dashed cap line */}
            <div className={cx("absInset", "pointerNone", "pb28")}>
              {[75, 50, 25].map((pct) => (
                <div key={pct} className={cx("rdGridLine")} style={{ "--pct": `${(pct / 100) * CHART_H}` } as React.CSSProperties} />
              ))}
              {/* Cap line */}
              <div className={cx("rdCapLine")}>
                <span className={cx("absLabelR")}>{RETAINER_MAX}h</span>
              </div>
            </div>

            {/* Bars */}
            <div className={cx("rdBarsRow")}>
              {weeklyBurn.map((w, i) => {
                const total   = weekTotals[i];
                const barH    = Math.min(Math.round((total / RETAINER_MAX) * CHART_H), CHART_H + 12);
                const isCurr  = i + 1 === todayWeek;
                const isOver  = total > RETAINER_MAX;
                return (
                  <div key={w.week} className={cx("rdWeekCol")}>
                    {/* Hour label */}
                    <span className={cx("rdHourLabel", "dynColor")} style={{ "--color": isOver ? "var(--red)" : isCurr ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>
                      {total}h
                    </span>
                    {/* Stacked bar segments */}
                    <div className={cx("rdStackedBar", isCurr && "rdStackedBarCurr")} style={{ "--bar-h": `${barH}px` } as React.CSSProperties}>
                      {SERVICES.map((s) => (
                        <div
                          key={s.key}
                          className={cx("rdBarSeg", "dynBgColor")}
                          style={{ "--pct": `${((w[s.key] as number) / total) * 100}%`, "--bg-color": s.color } as React.CSSProperties}
                        />
                      ))}
                    </div>
                    {/* Baseline */}
                    <div className={cx("dividerH1")} />
                    {/* Week label */}
                    <div className={cx("mt5", "fs9", "textCenter", "dynColor", isCurr && "fw700")} style={{ "--color": isCurr ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>
                      {w.week}
                    </div>
                    {isCurr && <div className={cx("dot4Lime")} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className={cx("flexRow", "gap14", "mt12", "flexWrap")}>
            {SERVICES.map((s) => (
              <div key={s.label} className={cx("flexRow", "gap5")}>
                <div className={cx("dot8sq", "dynBgColor")} style={{ "--bg-color": s.color } as React.CSSProperties} />
                <span className={cx("text10", "colorMuted")}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* ── Service breakdown + Burn pace ────────────────────────────────── */}
      <div className={cx("grid2")}>

        {/* Service breakdown */}
        <div className={cx("card")}>
          <div className={cx("cardHd")}>
            <div className={cx("flexRow", "flexCenter", "gap7")}>
              <Ic n="layers" sz={14} c="var(--purple)" />
              <span className={cx("cardHdTitle")}>Service Breakdown (8 weeks)</span>
            </div>
          </div>
          <div className={cx("cardBodyPad")}>
            {grandTotal === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="chart" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>No service data yet</div>
                <div className={cx("emptyStateSub")}>Service breakdown will populate once retainer hours are logged.</div>
              </div>
            ) : serviceData.map((s) => (
              <div key={s.label} className={cx("mb16")}>
                <div className={cx("flexBetween", "mb7")}>
                  <div className={cx("flexRow", "flexCenter", "gap9")}>
                    <div className={cx("rdSvcIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${s.color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${s.color} 25%, transparent)` } as React.CSSProperties}>
                      <Ic n={s.icon} sz={13} c={s.color} />
                    </div>
                    <span className={cx("text12")}>{s.label}</span>
                  </div>
                  <div className={cx("flexRow", "gap8")}>
                    <span className={cx("fw700", "text12")}>{s.total}h</span>
                    <span className={cx("rdSvcPctBadge", "dynBgColor", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${s.color} 10%, transparent)`, "--color": s.color, "--border-color": `color-mix(in oklab, ${s.color} 22%, transparent)` } as React.CSSProperties}>
                      {Math.round((s.total / grandTotal) * 100)}%
                    </span>
                  </div>
                </div>
                <div className={cx("progressTrack")}>
                  <div className={cx("pctFillRInherit", "dynBgColor")} style={{ '--pct': (s.total / grandTotal) * 100, "--bg-color": s.color } as React.CSSProperties} />
                </div>
                <div className={cx("text10", "colorMuted", "mt4")}>
                  avg {weeklyBurn.length > 0 ? (s.total / weeklyBurn.length).toFixed(1) : "0.0"}h/wk
                </div>
              </div>
            ))}

            {/* Stacked composition bar */}
            {grandTotal > 0 && (
              <div className={cx("pt12", "borderT")}>
                <div className={cx("text10", "colorMuted", "mb6")}>
                  Total {grandTotal}h across {weeklyBurn.length} weeks
                </div>
                <div className={cx("rdCompositionBar")}>
                  {serviceData.map((s) => (
                    <div
                      key={s.label}
                      title={`${s.label}: ${s.total}h`}
                      className={cx("rdBarSeg", "dynBgColor")}
                      style={{ "--pct": `${(s.total / grandTotal) * 100}%`, "--bg-color": s.color } as React.CSSProperties}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Burn Pace */}
        <div className={cx("card", "borderLeft3")} style={{ "--border-color": paceColor } as React.CSSProperties}>
          <div className={cx("cardHd")}>
            <div className={cx("flexRow", "flexCenter", "gap7")}>
              <Ic n={isOverPace ? "alert" : "check"} sz={14} c={paceColor} />
              <span className={cx("cardHdTitle")}>Burn Pace</span>
            </div>
            <span className={cx("badge", isOverPace ? "badgeAmber" : "badgeGreen", "mlAuto")}>
              {isOverPace ? "Over pace" : "On pace"}
            </span>
          </div>
          <div className={cx("cardBodyPad")}>

            {/* Pace gauge */}
            <div className={cx("mb16")}>
              <div className={cx("flexBetween", "mb8")}>
                <span className={cx("text12", "colorMuted")}>Avg weekly burn rate</span>
                <span className={cx("rdPacePct", "dynColor")} style={{ "--color": paceColor } as React.CSSProperties}>
                  {pacePct}%
                </span>
              </div>
              <div className={cx("rdPaceTrack")}>
                <div className={cx("pctFillRInherit", "dynBgColor")} style={{ '--pct': Math.min(pacePct, 100), "--bg-color": paceColor } as React.CSSProperties} />
              </div>
              <div className={cx("flexBetween")}>
                <span className={cx("text10", "colorMuted")}>0h</span>
                <span className={cx("text10", "colorMuted")}>{RETAINER_MAX}h cap</span>
              </div>
            </div>

            {/* Status callout */}
            <div className={cx("rdPaceCallout", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${paceColor} 8%, var(--s3))`, "--border-color": `color-mix(in oklab, ${paceColor} 20%, transparent)` } as React.CSSProperties}>
              <div className={cx("flexRow", "flexCenter", "gap6", "mb4")}>
                <Ic n={isOverPace ? "alert" : "check"} sz={12} c={paceColor} />
                <span className={cx("fw700", "text12", "dynColor")} style={{ "--color": paceColor } as React.CSSProperties}>
                  {isOverPace ? "Over-pace alert" : "On pace"}
                </span>
              </div>
              <span className={cx("text11", "colorMuted")}>
                {isOverPace
                  ? `At ${avgBurn}h/week average, the retainer will be exhausted ~2 days early each month.`
                  : `At ${avgBurn}h/week, there is an estimated 8h surplus remaining this month.`}
              </span>
            </div>

            {/* Metrics table */}
            {([
              { k: "Retainer cap",    v: `${RETAINER_MAX}h/week`,  ic: "clock", c: "var(--muted2)"                                   },
              { k: "Average burn",    v: `${avgBurn}h/week`,        ic: "chart", c: paceColor                                          },
              { k: "Current week",    v: `${currentWeekTotal}h`,    ic: "zap",   c: currentWeekTotal > 28 ? "var(--red)" : "var(--muted2)" },
              { k: "Over-burn weeks", v: `${overBurnWeeks} of 8`,   ic: "alert", c: overBurnWeeks > 0 ? "var(--amber)" : "var(--muted2)"   },
            ] as { k: string; v: string; ic: string; c: string }[]).map(({ k, v, ic, c }) => (
              <div key={k} className={cx("flexBetween", "py8_0", "borderB")}>
                <div className={cx("flexRow", "flexCenter", "gap7")}>
                  <Ic n={ic} sz={12} c={c} />
                  <span className={cx("text12", "colorMuted")}>{k}</span>
                </div>
                <span className={cx("fw700", "text12", "dynColor")} style={{ "--color": k === "Average burn" ? paceColor : "inherit" } as React.CSSProperties}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Retainer history ─────────────────────────────────────────────── */}
      <div className={cx("card", "p0", "overflowHidden")}>
        <div className={cx("cardHd", "pl18")}>
          <div className={cx("flexRow", "flexCenter", "gap7")}>
            <Ic n="calendar" sz={13} c="var(--muted)" />
            <span className={cx("cardHdTitle")}>Retainer History</span>
          </div>
          <span className={cx("text11", "colorMuted", "mlAuto")}>Monthly billing history</span>
        </div>

        {MONTHS.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No retainer history yet</div>
            <div className={cx("emptyStateSub")}>Monthly retainer records will appear here once billing cycles begin.</div>
          </div>
        ) : MONTHS.map((m, idx) => {
          const fillPct = m.hours > 0 ? Math.min(Math.round((m.hours / m.cap) * 100), 100) : 0;
          const sc = MSTATUS_COLOR[m.status];
          return (
            <div
              key={m.month}
              className={cx("rdHistRow", "dynBorderLeft3", idx > 0 && "borderT")}
              style={{ "--color": sc } as React.CSSProperties}
            >
              {/* Status icon box */}
              <div className={cx("rdHistIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${sc} 10%, var(--s2))`, "--color": `color-mix(in oklab, ${sc} 22%, transparent)` } as React.CSSProperties}>
                <Ic n={MSTATUS_ICON[m.status]} sz={15} c={sc} />
              </div>

              {/* Content */}
              <div className={cx("flex1", "minW0")}>
                <div className={cx("flexBetween", "mb7")}>
                  <span className={cx("fw600", "text12")}>{m.month}</span>
                  <div className={cx("flexRow", "gap8")}>
                    <span className={cx("fw700", "text12")}>{m.cost}</span>
                    <span className={cx("badge", MSTATUS_BADGE[m.status])}>{m.status}</span>
                  </div>
                </div>
                <div className={cx("progressTrack")}>
                  {m.hours > 0 && (
                    <div className={cx("pctFillRInherit", "dynBgColor")} style={{ '--pct': fillPct, "--bg-color": sc } as React.CSSProperties} />
                  )}
                </div>
                <div className={cx("text10", "colorMuted", "mt5")}>
                  {m.hours > 0
                    ? `${m.hours} / ${m.cap} hrs used — ${fillPct}% of cap`
                    : `Upcoming — ${m.cap}h cap available`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
