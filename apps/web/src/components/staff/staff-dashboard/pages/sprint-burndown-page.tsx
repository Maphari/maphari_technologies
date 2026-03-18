// ════════════════════════════════════════════════════════════════════════════
// sprint-burndown-page.tsx — Sprint Velocity & Burn-Down Charts
// Data : GET /sprints/burn-down?projectId=X → BurnDownData
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { saveSession } from "../../../../lib/auth/session";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  loadSprintBurnDownWithRefresh,
  type BurnDownData,
  type DailyBurnPoint,
  type VelocityEntry,
} from "../../../../lib/api/staff/sprints";
import { getStaffProjects, type StaffProject } from "../../../../lib/api/staff/projects";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a list of DailyBurnPoints to SVG polyline points within a viewBox */
function toPolylinePoints(
  points: { x: number; y: number }[],
  viewW: number,
  viewH: number
): string {
  return points.map((p) => `${p.x * viewW},${p.y * viewH}`).join(" ");
}

function sprintHealth(
  completedPoints: number,
  totalPoints: number,
  dailyRemaining: DailyBurnPoint[]
): "green" | "amber" | "red" {
  if (totalPoints === 0) return "green";
  // Find today's actual vs ideal
  const today = dailyRemaining.find((d) => d.remaining >= 0);
  const last = [...dailyRemaining].reverse().find((d) => d.remaining >= 0);
  if (!last) return "green";
  const pct = completedPoints / totalPoints;
  if (pct >= 0.8) return "green";
  if (last.remaining > last.ideal * 1.25) return "red";
  if (last.remaining > last.ideal) return "amber";
  return "green";
}

function healthLabel(h: "green" | "amber" | "red"): string {
  if (h === "green") return "On Track";
  if (h === "amber") return "At Risk";
  return "Behind";
}

function healthCssClass(h: "green" | "amber" | "red"): string {
  if (h === "green") return "sbdHealthGreen";
  if (h === "amber") return "sbdHealthAmber";
  return "sbdHealthRed";
}

// ── Burn-Down SVG ─────────────────────────────────────────────────────────────

const SVG_W = 400;
const SVG_H = 200;
const PAD_L = 36;
const PAD_B = 24;
const PAD_T = 8;
const PAD_R = 8;

function BurnDownSvg({
  dailyRemaining,
  totalPoints,
}: {
  dailyRemaining: DailyBurnPoint[];
  totalPoints: number;
}) {
  if (dailyRemaining.length === 0) {
    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className={cx("sbdChartSvg")} aria-label="Burn-down chart (no data)">
        <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" className={cx("sbdAxisLabel")}>
          No sprint data
        </text>
      </svg>
    );
  }

  const days = dailyRemaining.length;
  const chartW = SVG_W - PAD_L - PAD_R;
  const chartH = SVG_H - PAD_T - PAD_B;
  const maxY = Math.max(1, totalPoints);
  const today = new Date().toISOString().slice(0, 10);

  // Scale helpers
  const xAt = (i: number) => PAD_L + (i / Math.max(days - 1, 1)) * chartW;
  const yAt = (v: number) => PAD_T + chartH - (v / maxY) * chartH;

  // Build ideal polyline points
  const idealPoints = dailyRemaining
    .map((d, i) => `${xAt(i)},${yAt(d.ideal)}`)
    .join(" ");

  // Build actual polyline points (only for days with real data, i.e. remaining >= 0)
  const actualPts = dailyRemaining
    .filter((d) => d.remaining >= 0)
    .map((d, i, arr) => {
      const origIdx = dailyRemaining.findIndex((x) => x === d);
      return { x: xAt(origIdx), y: yAt(d.remaining) };
    });
  const actualPoints = actualPts.map((p) => `${p.x},${p.y}`).join(" ");

  // At-risk zone: polygon between ideal and actual where actual > ideal
  const atRiskPts: string[] = [];
  const actualArr = dailyRemaining.filter((d) => d.remaining >= 0);
  actualArr.forEach((d, i) => {
    if (d.remaining > d.ideal) {
      const origIdx = dailyRemaining.findIndex((x) => x === d);
      atRiskPts.push(`${xAt(origIdx)},${yAt(d.remaining)}`);
    }
  });
  // Close the zone along ideal
  if (atRiskPts.length > 0) {
    const reverseIdeal = actualArr
      .filter((d) => d.remaining > d.ideal)
      .map((d) => {
        const origIdx = dailyRemaining.findIndex((x) => x === d);
        return `${xAt(origIdx)},${yAt(d.ideal)}`;
      })
      .reverse();
    atRiskPts.push(...reverseIdeal);
  }

  // Today marker
  const todayIdx = dailyRemaining.findIndex((d) => d.date === today);
  const todayX = todayIdx >= 0 ? xAt(todayIdx) : null;

  // X-axis tick labels (show first, middle, last)
  const tickIndices = [0, Math.floor((days - 1) / 2), days - 1];

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className={cx("sbdChartSvg")}
      aria-label={`Burn-down chart for sprint`}
    >
      {/* Y-axis grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = yAt(frac * totalPoints);
        return (
          <g key={frac}>
            <line
              x1={PAD_L} y1={y} x2={SVG_W - PAD_R} y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth={1}
            />
            <text x={PAD_L - 3} y={y + 3} textAnchor="end" className={cx("sbdAxisLabel")}>
              {Math.round(frac * totalPoints)}
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {tickIndices.map((idx) => {
        if (idx >= days) return null;
        const d = dailyRemaining[idx];
        if (!d) return null;
        return (
          <text key={idx} x={xAt(idx)} y={SVG_H - 4} textAnchor="middle" className={cx("sbdAxisLabel")}>
            {d.date.slice(5)} {/* MM-DD */}
          </text>
        );
      })}

      {/* At-risk fill */}
      {atRiskPts.length > 2 && (
        <polygon points={atRiskPts.join(" ")} className={cx("sbdAtRiskFill")} />
      )}

      {/* Today marker */}
      {todayX !== null && (
        <line
          x1={todayX} y1={PAD_T} x2={todayX} y2={SVG_H - PAD_B}
          className={cx("sbdTodayLine")}
        />
      )}

      {/* Ideal line */}
      {idealPoints && (
        <polyline points={idealPoints} className={cx("sbdIdealLine")} />
      )}

      {/* Actual line */}
      {actualPoints && actualPoints.length > 0 && (
        <polyline points={actualPoints} className={cx("sbdActualLine")} />
      )}
    </svg>
  );
}

// ── Velocity bar chart ────────────────────────────────────────────────────────

function VelocityBars({ history }: { history: VelocityEntry[] }) {
  const maxVal = Math.max(1, ...history.map((h) => Math.max(h.planned, h.completed)));

  return (
    <div className={cx("sbdVelBars")}>
      {history.map((entry) => {
        const plannedH = Math.max(4, Math.round((entry.planned / maxVal) * 130));
        const doneH = Math.max(4, Math.round((entry.completed / maxVal) * 130));
        return (
          <div key={entry.sprintName} className={cx("sbdVelGroup")}>
            <div
              className={cx("sbdVelBarPlanned")}
              style={{ height: plannedH }}
              title={`Planned: ${entry.planned}`}
            />
            <div
              className={cx("sbdVelBarDone")}
              style={{ height: doneH }}
              title={`Completed: ${entry.completed}`}
            />
            <div className={cx("sbdVelLabel")} title={entry.sprintName}>
              {entry.sprintName.replace(/sprint\s*/i, "S").slice(0, 8)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SprintBurndownPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [projects, setProjects] = useState<StaffProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [data, setData] = useState<BurnDownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects for selector
  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;
    void getStaffProjects(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data && r.data.length > 0) {
        setProjects(r.data);
        setSelectedProjectId((prev) => prev || r.data![0]!.id);
      }
    });
    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  // Load burn-down data whenever project changes
  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void loadSprintBurnDownWithRefresh(session, selectedProjectId || undefined).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        setError(r.error.message);
        setLoading(false);
        return;
      }
      setData(r.data ?? null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken, selectedProjectId, isActive]);

  const health = useMemo(() => {
    if (!data) return "green" as const;
    return sprintHealth(data.completedPoints, data.totalPoints, data.dailyRemaining);
  }, [data]);

  const avgVelocity = useMemo(() => {
    if (!data || data.velocityHistory.length === 0) return 0;
    const total = data.velocityHistory.reduce((s, v) => s + v.completed, 0);
    return Math.round(total / data.velocityHistory.length);
  }, [data]);

  const completionPct = data && data.totalPoints > 0
    ? Math.round((data.completedPoints / data.totalPoints) * 100)
    : 0;

  return (
    <section
      className={cx("page", "pageBody", isActive && "pageActive")}
      id="page-sprint-burndown"
    >
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>Sprint Burn-Down</h1>
        <p className={cx("pageSubtitleText")}>
          Velocity &amp; burn-down charts — track completion against plan across sprints.
        </p>
      </div>

      <div className={cx("spSectionPad", "sbdWrap")}>
        {/* Project selector */}
        {projects.length > 1 && (
          <div className={cx("sbdFilterRow")}>
            <span className={cx("sbdSelectLabel")}>Project</span>
            <select
              className={cx("filterSelect")}
              aria-label="Select project for burn-down"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {loading && (
          <div className={cx("emptyState")}>
            <div className={cx("text12", "colorMuted2")}>Loading sprint data…</div>
          </div>
        )}

        {!loading && error && (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateTitle")}>Unable to load burn-down</div>
            <div className={cx("emptyStateSub")}>{error}</div>
          </div>
        )}

        {!loading && !error && !data && (
          <div className={cx("sbdGrid")}>
            <div className={cx("sbdEmptyState")}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 17l4-8 4 4 4-6 4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 21h18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <div className={cx("sbdEmptyTitle")}>No active sprint</div>
              <div className={cx("sbdEmptySub")}>
                Create a sprint in the Sprint Planning page to see burn-down charts here.
              </div>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <div className={cx("sbdGrid")}>
            {/* ── Left: Burn-Down Chart ─────────────────────────────── */}
            <div className={cx("sbdPanel")}>
              <div className={cx("sbdPanelTitle")}>{data.sprintName} — Burn-Down</div>
              <div className={cx("sbdPanelSub")}>
                {new Date(data.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                {" – "}
                {new Date(data.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                {" · "}
                {data.totalPoints} point{data.totalPoints !== 1 ? "s" : ""} total
              </div>

              <BurnDownSvg
                dailyRemaining={data.dailyRemaining}
                totalPoints={data.totalPoints}
              />

              {/* Legend */}
              <div className={cx("sbdLegend")}>
                <div className={cx("sbdLegendItem")}>
                  <div className={cx("sbdLegendLine", "sbdLegendLineIdeal")} />
                  Ideal
                </div>
                <div className={cx("sbdLegendItem")}>
                  <div className={cx("sbdLegendLine", "sbdLegendLineActual")} />
                  Actual
                </div>
                <div className={cx("sbdLegendItem")}>
                  <div className={cx("sbdLegendLine", "sbdLegendLineToday")} />
                  Today
                </div>
              </div>
            </div>

            {/* ── Right: Velocity + Stats ───────────────────────────── */}
            <div className={cx("sbdPanel")}>
              <div className={cx("sbdPanelTitle")}>Velocity History</div>
              <div className={cx("sbdPanelSub")}>
                Last {data.velocityHistory.length} sprint{data.velocityHistory.length !== 1 ? "s" : ""}
                {" — "}
                <span className={cx("colorMuted2")}>planned</span>
                {" vs "}
                <span className={cx("colorAccent")}>completed</span>
              </div>

              <div className={cx("sbdVelWrap")}>
                {data.velocityHistory.length > 0 ? (
                  <VelocityBars history={data.velocityHistory} />
                ) : (
                  <div className={cx("text12", "colorMuted2", "pb16")}>
                    No velocity history available.
                  </div>
                )}

                {/* Stats strip */}
                <div className={cx("sbdStatsStrip")}>
                  <div className={cx("sbdStat")}>
                    <div className={cx("sbdStatLabel")}>Avg Velocity</div>
                    <div className={cx("sbdStatValue")}>{avgVelocity}</div>
                  </div>
                  <div className={cx("sbdStat")}>
                    <div className={cx("sbdStatLabel")}>Completed</div>
                    <div className={cx("sbdStatValue")}>{completionPct}%</div>
                  </div>
                  <div className={cx("sbdStat")}>
                    <div className={cx("sbdStatLabel")}>Remaining</div>
                    <div className={cx("sbdStatValue")}>
                      {data.totalPoints - data.completedPoints}
                    </div>
                  </div>
                  <div className={cx("sbdStat")}>
                    <div className={cx("sbdStatLabel")}>Sprint Health</div>
                    <div className={cx("sbdStatValue")}>
                      <span className={cx("sbdHealthChip", healthCssClass(health))}>
                        {healthLabel(health)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
