// ════════════════════════════════════════════════════════════════════════════
// capacity-forecast-page.tsx — Admin Capacity Planning Forecast (30/60/90d)
// Data   : loadCapacityForecastWithRefresh → forecast periods + staff rows
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { CapacityForecast, ForecastPeriod, StaffForecast } from "../../../../lib/api/admin/capacity";
import { loadCapacityForecastWithRefresh } from "../../../../lib/api/admin/capacity";
import { Alert } from "@/components/shared/ui/alert";

// ── Helpers ───────────────────────────────────────────────────────────────────

function periodCardColorClass(utilizationRate: number): string {
  if (utilizationRate > 90) return styles.cfPeriodCardRed;
  if (utilizationRate > 75) return styles.cfPeriodCardAmber;
  return styles.cfPeriodCardGreen;
}

function periodUtilColor(utilizationRate: number): string {
  if (utilizationRate > 90) return "var(--red)";
  if (utilizationRate > 75) return "var(--amber)";
  return "var(--green, #24b8a8)";
}

function miniBarColor(utilPct: number): string {
  if (utilPct > 100) return "var(--red)";
  if (utilPct > 80)  return "var(--amber)";
  return "var(--green, #24b8a8)";
}

function hiringSignalBadge(signal: CapacityForecast["hiringSignal"]): { label: string; cls: string } {
  switch (signal) {
    case "CRITICAL":       return { label: "CRITICAL",        cls: "badgeRed" };
    case "UNDER_CAPACITY": return { label: "UNDER CAPACITY",  cls: "badgeAmber" };
    case "OVERSTAFFED":    return { label: "OVERSTAFFED",     cls: "badgeMuted" };
    default:               return { label: "BALANCED",        cls: "badgeGreen" };
  }
}

function targetHireDate(daysOut: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOut);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CapacityForecastPage({ session, onNotify }: Props) {
  const [forecast, setForecast] = useState<CapacityForecast | null>(null);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void (async () => {
      const r = await loadCapacityForecastWithRefresh(session);
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) {
        setLoadError(r.error?.message ?? "Failed to load capacity forecast. Please try again.");
        onNotify("error", r.error?.message ?? "Failed to load capacity forecast.");
        setLoading(false);
        return;
      }
      setLoadError(null);
      setForecast(r.data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

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

  // Fallback empty state
  if (!forecast) {
    return (
      <div className={styles.pageBody}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageEyebrow}>GOVERNANCE / CAPACITY PLANNING FORECAST</div>
            <h1 className={styles.pageTitle}>Capacity Forecast</h1>
          </div>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>No forecast data</div>
          <div className={styles.emptySub}>Add staff profiles and active projects to generate a capacity forecast.</div>
        </div>
      </div>
    );
  }

  const signal = hiringSignalBadge(forecast.hiringSignal);
  const hiresNeeded = forecast.recommendedHires;
  const period90 = forecast.periods[2] ?? forecast.periods[forecast.periods.length - 1];

  return (
    <div className={styles.pageBody}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / CAPACITY PLANNING FORECAST</div>
          <h1 className={styles.pageTitle}>Capacity Forecast</h1>
          <div className={styles.pageSub}>30 / 60 / 90-day staffing projection based on active projects and pipeline</div>
        </div>
        <div className={styles.pageActions}>
          <span className={cx("badge", signal.cls)}>{signal.label}</span>
          {(forecast.hiringSignal === "CRITICAL" || forecast.hiringSignal === "UNDER_CAPACITY") && hiresNeeded > 0 && (
            <span className={cx("badge", "badgeAmber")}>
              Consider {hiresNeeded} hire{hiresNeeded !== 1 ? "s" : ""}
            </span>
          )}
          <button type="button" className={cx("btnSm", "btnGhost")}>Export</button>
        </div>
      </div>

      {loadError && (
        <Alert
          variant="error"
          message={loadError}
          onRetry={() => { setLoadError(null); }}
        />
      )}

      {/* ── 3-period summary cards ── */}
      <div className={styles.cfPeriodGrid}>
        {forecast.periods.map((p: ForecastPeriod) => {
          const cardColor = periodCardColorClass(p.utilizationRate);
          const utilColor = periodUtilColor(p.utilizationRate);
          const isSurplus = p.surplus >= 0;
          return (
            <div key={p.label} className={cx(styles.cfPeriodCard, cardColor)}>
              <div className={cx("text11", "colorMuted", "uppercase", "fw700")}>{p.label}</div>
              <div className={cx(styles.cfUtil, toneClass(utilColor))}>{p.utilizationRate}%</div>
              <div className={cx("text12", "colorMuted")}>utilisation</div>
              <div className={cx("flexBetween", "mt12", "text12")}>
                <span className={cx("colorMuted")}>Capacity</span>
                <span className={cx("fontMono", "fw700")}>{p.totalCapacityHours}h</span>
              </div>
              <div className={cx("flexBetween", "text12")}>
                <span className={cx("colorMuted")}>Demand</span>
                <span className={cx("fontMono", "fw700", toneClass(utilColor))}>{p.projectedDemandHours}h</span>
              </div>
              <div className={cx(styles.cfSurplus, isSurplus ? styles.cfSurplusPos : styles.cfSurplusNeg)}>
                {isSurplus
                  ? `+${p.surplus}h surplus`
                  : `${Math.abs(p.surplus)}h deficit`}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Staff allocation table ── */}
      <div className={cx("card", "overflowHidden", "p0")}>
        {/* Table header */}
        <div className={cx("px20", "py12", "borderB", "flexRow", "gap12", styles.sutCell)}>
          <span className={cx("text10", "colorMuted", "uppercase", "fw700", styles.sutCell)} style={{ flex: "2" }}>
            Staff Member
          </span>
          {(["Next 30 days", "31-60 days", "61-90 days"] as const).map((label) => (
            <span key={label} className={cx("text10", "colorMuted", "uppercase", "fw700", "textCenter")} style={{ flex: "1" }}>
              {label}
            </span>
          ))}
        </div>

        {forecast.staffForecast.length === 0 && (
          <div className={cx("p20", "text13", "colorMuted")}>No active staff found.</div>
        )}

        {forecast.staffForecast.map((s: StaffForecast, idx) => {
          const periods30 = s.availableHours30d > 0 ? Math.round((s.allocatedHours30d / s.availableHours30d) * 100) : 0;
          const periods60 = s.availableHours30d > 0 ? Math.round((s.allocatedHours60d / s.availableHours30d) * 100) : 0;
          const periods90 = s.availableHours30d > 0 ? Math.round((s.allocatedHours90d / s.availableHours30d) * 100) : 0;
          const isLast = idx === forecast.staffForecast.length - 1;

          return (
            <div
              key={s.staffId}
              className={cx(styles.tableRow, "flexRow", "gap12", "px20", "py14", !isLast && "borderB")}
              style={{ alignItems: "center" }}
            >
              {/* Name + role */}
              <div style={{ flex: "2" }}>
                <div className={cx("fw600", "text13")}>{s.name}</div>
                <div className={cx("text11", "colorMuted")}>{s.role}</div>
              </div>

              {/* 30d mini bar */}
              <div style={{ flex: "1" }}>
                <div className={cx("flexBetween", "text11", "mb4")}>
                  <span className={cx("fontMono", "fw700", toneClass(miniBarColor(periods30)))}>{periods30}%</span>
                  <span className={cx("colorMuted")}>{s.allocatedHours30d}h</span>
                </div>
                <div className={styles.cfMiniBar}>
                  <div
                    className={styles.cfMiniBarFill}
                    style={{ "--bar-w": `${Math.min(periods30, 100)}%`, background: miniBarColor(periods30) } as CSSProperties}
                  />
                </div>
                {s.status30d !== "OK" && (
                  <div className={cx("text10", "mt2", s.status30d === "OVER" ? "colorRed" : "colorAmber")}>
                    {s.status30d === "OVER" ? "Overallocated" : "Near capacity"}
                  </div>
                )}
              </div>

              {/* 60d mini bar */}
              <div style={{ flex: "1" }}>
                <div className={cx("flexBetween", "text11", "mb4")}>
                  <span className={cx("fontMono", "fw700", toneClass(miniBarColor(periods60)))}>{periods60}%</span>
                  <span className={cx("colorMuted")}>{s.allocatedHours60d}h</span>
                </div>
                <div className={styles.cfMiniBar}>
                  <div
                    className={styles.cfMiniBarFill}
                    style={{ "--bar-w": `${Math.min(periods60, 100)}%`, background: miniBarColor(periods60) } as CSSProperties}
                  />
                </div>
              </div>

              {/* 90d mini bar */}
              <div style={{ flex: "1" }}>
                <div className={cx("flexBetween", "text11", "mb4")}>
                  <span className={cx("fontMono", "fw700", toneClass(miniBarColor(periods90)))}>{periods90}%</span>
                  <span className={cx("colorMuted")}>{s.allocatedHours90d}h</span>
                </div>
                <div className={styles.cfMiniBar}>
                  <div
                    className={styles.cfMiniBarFill}
                    style={{ "--bar-w": `${Math.min(periods90, 100)}%`, background: miniBarColor(periods90) } as CSSProperties}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Recommendations panel ── */}
      <div className={styles.cfRecommendBox}>
        <div className={cx("fw700", "mb8")}>Hiring Recommendation</div>
        {forecast.hiringSignal === "CRITICAL" && (
          <div className={cx("text13", "colorMuted")}>
            Team is projected to be critically overloaded by {period90.label.toLowerCase()}&nbsp;
            ({period90.utilizationRate}% utilisation). Recommend hiring&nbsp;
            <strong>{hiresNeeded}</strong> additional staff member{hiresNeeded !== 1 ? "s" : ""}&nbsp;
            by <strong>{targetHireDate(60)}</strong> to avoid delivery risk.
          </div>
        )}
        {forecast.hiringSignal === "UNDER_CAPACITY" && (
          <div className={cx("text13", "colorMuted")}>
            At current growth rate, the team will exceed 75% utilisation within 90 days. Consider&nbsp;
            <strong>{hiresNeeded}</strong> hire{hiresNeeded !== 1 ? "s" : ""}&nbsp;
            by <strong>{targetHireDate(90)}</strong> to maintain sustainable delivery pace.
          </div>
        )}
        {forecast.hiringSignal === "BALANCED" && (
          <div className={cx("text13", "colorMuted")}>
            Team capacity is well-balanced across the 90-day forecast window ({period90.utilizationRate}% utilisation).
            No immediate hiring action required.
          </div>
        )}
        {forecast.hiringSignal === "OVERSTAFFED" && (
          <div className={cx("text13", "colorMuted")}>
            Team utilisation is projected below 40% in the 90-day window. Consider deferring any open
            hiring requisitions and reviewing current project pipeline.
          </div>
        )}
      </div>
    </div>
  );
}
