// ════════════════════════════════════════════════════════════════════════════
// retainer-usage-page.tsx — Client Portal Retainer Usage
// Data : GET /retainer → PortalRetainerWeek[]  (core service, CLIENT scoped)
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import { loadPortalRetainerWithRefresh, type PortalRetainerWeek } from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

const RETAINER_MAX = 30;

const SERVICE_BREAKDOWN = [
  { label: "Development", key: "dev" as const, color: "var(--lime)", badgeClass: "badgeAccent" },
  { label: "Design", key: "design" as const, color: "var(--purple)", badgeClass: "badgePurple" },
  { label: "Project Management", key: "pm" as const, color: "var(--green, var(--lime))", badgeClass: "badgeGreen" },
  { label: "QA & Testing", key: "qa" as const, color: "var(--amber)", badgeClass: "badgeAmber" },
];

function barColor(total: number): string {
  if (total > 28) return "var(--red)";
  if (total > 20) return "var(--amber)";
  return "var(--lime)";
}

export function RetainerUsagePage() {
  const { session } = useProjectLayer();
  const [weeklyBurn, setWeeklyBurn] = useState<PortalRetainerWeek[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
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

  const todayWeek = weeklyBurn.length;
  const avgBurn = weeklyBurn.length > 0
    ? Math.round(weeklyBurn.reduce((a, w) => a + w.dev + w.design + w.pm + w.qa, 0) / weeklyBurn.length)
    : 0;
  const currentWeek = weeklyBurn[todayWeek - 1];
  const currentWeekTotal = currentWeek ? currentWeek.dev + currentWeek.design + currentWeek.pm + currentWeek.qa : 0;
  const isOverPace = avgBurn > RETAINER_MAX * 0.93;

  const totalByService = SERVICE_BREAKDOWN.map((s) => ({
    ...s,
    total: weeklyBurn.reduce((a, w) => a + w[s.key], 0),
  }));
  const grandTotal = totalByService.reduce((a, s) => a + s.total, 0);

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
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Retainer</div>
          <h1 className={cx("pageTitle")}>Retainer Usage</h1>
          <p className={cx("pageSub")}>Week-by-week hours burn, service breakdown, and pace analysis for your monthly retainer.</p>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Monthly Allowance", value: "30h/wk", color: "statCardAccent" },
          { label: "This Week", value: `${currentWeekTotal}h`, color: currentWeekTotal > 28 ? "statCardRed" : currentWeekTotal > 20 ? "statCardAmber" : "statCardGreen" },
          { label: "Avg Burn", value: `${avgBurn}h/wk`, color: "statCardBlue" },
          { label: "Over-burn Weeks", value: `${weeklyBurn.filter((w) => w.dev + w.design + w.pm + w.qa > RETAINER_MAX).length}`, color: "statCardRed" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 8-week burn chart */}
      <div className={cx("card", "mb16")}>
        <div className={cx("cardHd", "mb16")}>
          <span className={cx("cardHdTitle")}>8-Week Hours Burn</span>
          {weeklyBurn.length > 0 && (
            <span className={cx("badge", isOverPace ? "badgeRed" : "badgeGreen", "ml8")}>
              {isOverPace ? `↑ Avg ${avgBurn}h/wk — over pace` : `✓ Avg ${avgBurn}h/wk — on pace`}
            </span>
          )}
        </div>

        {weeklyBurn.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="trending" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No burn data yet</div>
            <div className={cx("emptyStateSub")}>Weekly hours will appear here once your retainer engagement starts.</div>
          </div>
        ) : (
        <div className={cx("relative")}>
          {/* Y-axis max label */}
          <div className={cx("absTR", "fs9", "colorMuted2", "fw600")}>
            {RETAINER_MAX}h max
          </div>

          <div className={cx("ruBarsRow")}>
            {weeklyBurn.map((w, i) => {
              const total = w.dev + w.design + w.pm + w.qa;
              const heightPct = Math.min((total / RETAINER_MAX) * 100, 110);
              const isCurrent = i + 1 === todayWeek;
              return (
                <div key={w.week} className={cx("flex1", "flexColEndCenter", "h100pct", "relative")}>
                  {/* Hours label above bar */}
                  <span className={cx("ruBarLabel", "dynColor")} style={{ "--color": barColor(total) } as React.CSSProperties}>{total}h</span>
                  {/* Bar */}
                  <div
                    className={cx("ruBar", "dynBgColor", isCurrent && "ruBarCurrent")}
                    style={{ "--bar-h": `${heightPct}%`, "--bg-color": barColor(total) } as React.CSSProperties}
                  />
                </div>
              );
            })}
          </div>

          {/* Dashed 30h max line */}
          <div className={cx("ruMaxLine")} />

          {/* Week labels */}
          <div className={cx("ruWeekLabels")}>
            {weeklyBurn.map((w, i) => (
              <div key={w.week} className={cx("ruWeekLabel", "dynColor", i + 1 === todayWeek ? "fw700" : "fw400")} style={{ "--color": i + 1 === todayWeek ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>
                {w.week}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className={cx("flexRow", "gap16", "mt12", "flexWrap")}>
            {[
              { color: "var(--lime)", label: "On pace (≤20h)" },
              { color: "var(--amber)", label: "Moderate (21–28h)" },
              { color: "var(--red)", label: "Over-burn (>28h)" },
            ].map((l) => (
              <div key={l.label} className={cx("flexRow", "gap6")}>
                <div className={cx("dot10sq", "dynBgColor")} style={{ "--bg-color": l.color } as React.CSSProperties} />
                <span className={cx("text10", "colorMuted")}>{l.label}</span>
              </div>
            ))}
            <div className={cx("flexRow", "gap6")}>
              <div className={cx("ruLegendDash")} />
              <span className={cx("text10", "colorMuted")}>30h retainer cap</span>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Service breakdown + Burn pace */}
      <div className={cx("grid2")}>
        <div className={cx("card")}>
          <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Service Breakdown (8 weeks)</span></div>
          {grandTotal === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="chart" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No usage data yet</div>
              <div className={cx("emptyStateSub")}>Service breakdown will populate once retainer hours are logged.</div>
            </div>
          ) : (
            <div className={cx("listGroup")}>
              {totalByService.map((s) => (
                <div key={s.label} className={cx("listRow")}>
                  <div className={cx("flex1")}>
                    <div className={cx("flexBetween", "mb6")}>
                      <div className={cx("flexRow", "gap8")}>
                        <div className={cx("wh8", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": s.color } as React.CSSProperties} />
                        <span className={cx("fw600", "text12")}>{s.label}</span>
                      </div>
                      <span className={cx("fw700", "text12")}>{s.total}h</span>
                    </div>
                    <div className={cx("progressTrackSm")}>
                      <div className={cx("pctFillRInherit", "dynBgColor")} style={{ '--pct': (s.total / grandTotal) * 100, "--bg-color": s.color } as React.CSSProperties} />
                    </div>
                    <div className={cx("text10", "colorMuted", "mt4")}>
                      {Math.round((s.total / grandTotal) * 100)}% of total · avg {weeklyBurn.length > 0 ? (s.total / weeklyBurn.length).toFixed(1) : "0.0"}h/wk
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cx("card", "dynBorderLeft3")} style={{ "--color": isOverPace ? "var(--amber)" : "var(--lime)" } as React.CSSProperties}>
          <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Burn Pace Analysis</span></div>
          <div className={cx("cardBodyPad")}>
            <div className={cx("mb16")}>
              {isOverPace ? (
                <>
                  <div className={cx("flexRow", "gap8", "mb8")}>
                    <span className={cx("colorAmber", "ruPaceIcon")}>⚠</span>
                    <span className={cx("fw700", "text13")}>Retainer over-pace alert</span>
                  </div>
                  <p className={cx("text12", "colorMuted")}>
                    At <span className={cx("fw700", "colorAmber")}>{avgBurn}h/week</span> average, the retainer will be exhausted approximately 2 days early this month.
                  </p>
                </>
              ) : (
                <>
                  <div className={cx("flexRow", "gap8", "mb8")}>
                    <span className={cx("colorAccent", "ruPaceIcon")}>✓</span>
                    <span className={cx("fw700", "text13")}>On pace</span>
                  </div>
                  <p className={cx("text12", "colorMuted")}>
                    At <span className={cx("fw700", "colorAccent")}>{avgBurn}h/week</span> average, you have an estimated 8h surplus remaining this month.
                  </p>
                </>
              )}
            </div>

            <div className={cx("borderT", "pt12")}>
              {[
                ["Retainer cap", `${RETAINER_MAX}h/week`],
                ["Average burn", `${avgBurn}h/week`],
                ["Current week (W8)", `${currentWeekTotal}h`],
                ["Over-burn weeks", `${weeklyBurn.filter((w) => w.dev + w.design + w.pm + w.qa > RETAINER_MAX).length} of 8`],
              ].map(([k, v]) => (
                <div key={k} className={cx("flexBetween", "py6_0", "borderB")}>
                  <span className={cx("text12", "colorMuted")}>{k}</span>
                  <span className={cx("text12", "fw600")}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
