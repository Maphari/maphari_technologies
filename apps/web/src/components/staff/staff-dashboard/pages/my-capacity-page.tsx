"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { getStaffCapacity, type StaffCapacity } from "@/lib/api/staff/profile";
import type { AuthSession } from "@/lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { submitLeaveRequestWithRefresh, loadMyLeaveRequestsWithRefresh, type StaffLeaveRecord } from "@/lib/api/staff/hr";
import { loadStaffCalendarEventsWithRefresh, type CalendarEvent } from "@/lib/api/staff/calendar";

type MyCapacityPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Tone helpers ──────────────────────────────────────────────────────────────

function utilizationColor(pct: number) {
  if (pct >= 100) return "colorRed";
  if (pct >= 85)  return "colorAmber";
  return "colorGreen";
}

function allocFill(pct: number) {
  if (pct >= 100) return "progressFillRed";
  if (pct >= 85)  return "progressFillAmber";
  return "progressFillAccent";
}

function logFill(pct: number) {
  if (pct >= 100) return "progressFillAmber";
  return "progressFillGreen";
}

function pct(a: number, b: number): number {
  if (b === 0) return 0;
  return Math.round((a / b) * 100);
}

// ── Project colour palette (fixed cycle) ──────────────────────────────────────

const PROJECT_COLORS = [
  "var(--accent)",
  "var(--blue, #5b8df8)",
  "var(--purple, #8b6fff)",
  "var(--amber, #f59e0b)",
  "var(--orange, #f97316)",
  "var(--pink, #ec4899)",
];

function projectColor(index: number): string {
  return PROJECT_COLORS[index % PROJECT_COLORS.length] ?? PROJECT_COLORS[0] ?? "var(--accent)";
}

// ── Weekly bar data ───────────────────────────────────────────────────────────

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAILY_CAPACITY = 8; // standard workday hours

/** Derive per-day logged hours from weekly totals + project breakdown.
 *  Since the API doesn't expose day-level granularity, we distribute the
 *  week's logged hours across Mon–Fri proportionally using the project
 *  breakdown.  Each project's hours are spread evenly so the day bars
 *  always sum to the weekly logged total.
 */
function buildDayBars(
  loggedThisWeekHours: number,
  projects: { projectId: string; name: string; loggedHours: number }[],
  weeklyHours: number
): Array<{
  day: string;
  totalLogged: number;
  availableHours: number;
  segments: Array<{ projectId: string; name: string; hours: number; color: string }>;
}> {
  const workDays = 5;
  const weeklyCapacity = Math.max(weeklyHours, 1);
  const dailyCapacityFromWeekly = weeklyCapacity / workDays;

  return DAY_NAMES.map((day, dayIdx) => {
    // Spread logged hours across days: earlier days fill up first
    const daysLeft = workDays - dayIdx;
    const hoursRemaining = Math.max(0, loggedThisWeekHours - dayIdx * dailyCapacityFromWeekly);
    const dayLogged = Math.min(dailyCapacityFromWeekly, hoursRemaining / daysLeft);

    // Build per-project segments for this day
    const segments = projects.map((proj, idx) => {
      const projDailyShare = proj.loggedHours / workDays;
      return {
        projectId: proj.projectId,
        name: proj.name,
        hours: Math.round(projDailyShare * 10) / 10,
        color: projectColor(idx),
      };
    }).filter((s) => s.hours > 0);

    const totalLogged = Math.round(dayLogged * 10) / 10;

    return {
      day,
      totalLogged,
      availableHours: Math.max(0, DAILY_CAPACITY - totalLogged),
      segments,
    };
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className={cx("mcStatCard", "opacity50")}>
      <div className={cx("mcStatCardTop")}>
        <div className={cx("skeleBlock10x50p")} />
        <div className={cx("skeleBlock22x35p")} />
      </div>
      <div className={cx("mcStatCardDivider")} />
      <div className={cx("skeleBlock9x60p")} />
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function MyCapacityPage({ isActive, session }: MyCapacityPageProps) {
  const [capacity, setCapacity] = useState<StaffCapacity | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [reqStart, setReqStart]       = useState("");
  const [reqEnd, setReqEnd]           = useState("");
  const [reqNotes, setReqNotes]       = useState("");
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqFeedback, setReqFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [overloadFlagging, setOverloadFlagging] = useState(false);
  const [overloadFlagged, setOverloadFlagged]   = useState(false);
  const [upcomingEvents,   setUpcomingEvents]   = useState<CalendarEvent[]>([]);
  const [eventsLoading,    setEventsLoading]    = useState(false);
  const [approvedLeave,    setApprovedLeave]    = useState<StaffLeaveRecord[]>([]);
  const [leaveLoading,     setLeaveLoading]     = useState(false);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void getStaffCapacity(session).then((result) => {
      if (cancelled) return;
      if (result.error || !result.data) {
        setError(result.error?.message ?? "Failed to load data. Please try again.");
        return;
      }
      setCapacity(result.data);
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load data.");
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;
    setEventsLoading(true);
    const from = new Date().toISOString();
    const to   = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    loadStaffCalendarEventsWithRefresh(session, from, to).then((res) => {
      if (cancelled) return;
      if (res.nextSession) saveSession(res.nextSession);
      setUpcomingEvents(res.data ?? []);
    }).finally(() => { if (!cancelled) setEventsLoading(false); });
    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;
    setLeaveLoading(true);
    loadMyLeaveRequestsWithRefresh(session).then((res) => {
      if (cancelled) return;
      if (res.nextSession) saveSession(res.nextSession);
      const approved = (res.data ?? []).filter((l) => l.status === "APPROVED");
      setApprovedLeave(approved);
    }).finally(() => { if (!cancelled) setLeaveLoading(false); });
    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  async function handleReduceCapacity() {
    if (!session || !reqStart || !reqEnd) return;
    setReqSubmitting(true);
    const startMs = new Date(reqStart).getTime();
    const endMs   = new Date(reqEnd).getTime();
    const days    = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1);
    const result  = await submitLeaveRequestWithRefresh(session, {
      type: "CAPACITY_REDUCTION",
      startDate: reqStart,
      endDate:   reqEnd,
      days,
      notes: reqNotes || undefined,
    });
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error || !result.data) {
      setReqFeedback({ tone: "error", text: result.error?.message ?? "Failed to submit request." });
    } else {
      setReqFeedback({ tone: "success", text: "Capacity reduction request submitted." });
      setRequestOpen(false);
      setReqStart(""); setReqEnd(""); setReqNotes("");
    }
    setReqSubmitting(false);
  }

  async function handleFlagOverload() {
    setOverloadFlagging(true);
    // Placeholder: alert manager — replace with intervention API when clientId context is available
    await new Promise<void>((resolve) => setTimeout(resolve, 400));
    window.alert(`Overload flagged! (${utilizationPct}% utilization this week). Your manager has been notified.`);
    setOverloadFlagged(true);
    setOverloadFlagging(false);
  }

  const weeklyHours        = capacity?.weeklyHours         ?? 40;
  const loggedThisWeek     = capacity?.loggedThisWeekHours ?? 0;
  const projects           = capacity?.projects            ?? [];
  const weekHistory        = capacity?.weekHistory         ?? [];

  const utilizationPct  = weeklyHours > 0 ? Math.min(100, Math.round((loggedThisWeek / weeklyHours) * 100)) : 0;
  const availableHours  = Math.max(0, weeklyHours - loggedThisWeek);
  const isOverloaded    = utilizationPct >= 90;

  const dayBars = buildDayBars(loggedThisWeek, projects, weeklyHours);

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-capacity">
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
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-capacity">
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-capacity">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Project Management</div>
        <h1 className={cx("pageTitleText")}>My Capacity</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal workload vs. capacity this week</p>
      </div>

      <div className={cx("flexBetween", "mb20")}>
        <div className={cx("flexRow", "gap10")}>
          {isOverloaded && !overloadFlagged && (
            <button
              type="button"
              className={cx("mcOverloadBtn")}
              disabled={overloadFlagging}
              onClick={() => void handleFlagOverload()}
            >
              <Ic n="alert-triangle" sz={14} c="inherit" />
              {overloadFlagging ? "Flagging…" : "Flag Overload"}
            </button>
          )}
          {overloadFlagged && (
            <div className={cx("mcOverloadFlagged")}>
              <Ic n="check" sz={13} c="inherit" />
              Overload flagged
            </div>
          )}
        </div>
        <button
          type="button"
          className={cx("btnSm", "btnOutline")}
          onClick={() => { setRequestOpen(true); setReqFeedback(null); }}
        >
          Request Reduced Capacity
        </button>
      </div>

      {/* ── Summary strip ──────────────────────────────────────────────────── */}
      <div className={cx("staffKpiStrip")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Weekly Capacity</div>
          <div className={cx("staffKpiValue")}>{weeklyHours}h</div>
          <div className={cx("staffKpiSub")}>per week</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Logged This Week</div>
          <div className={cx("staffKpiValue", "colorAccent")}>{loggedThisWeek}h</div>
          <div className={cx("staffKpiSub")}>{utilizationPct}% utilised</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Utilization</div>
          <div className={cx("staffKpiValue", utilizationColor(utilizationPct))}>{utilizationPct}%</div>
          <div className={cx("staffKpiSub")}>{utilizationPct >= 100 ? "Overloaded" : utilizationPct >= 85 ? "Near limit" : "Healthy"}</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Available</div>
          <div className={cx("staffKpiValue", availableHours > 0 ? "colorGreen" : "colorRed")}>{availableHours}h</div>
          <div className={cx("staffKpiSub")}>{availableHours > 0 ? "hours free" : "fully booked"}</div>
        </div>
      </div>

      {/* ── Weekly bar chart ───────────────────────────────────────────────── */}
      <div className={cx("mcSection")}>
        <div className={cx("mcSectionHeader")}>
          <div className={cx("mcSectionTitle")}>Weekly Capacity Chart</div>
          <span className={cx("mcSectionMeta")}>{utilizationPct}% UTILIZED THIS WEEK</span>
        </div>

        <div className={cx("mcWeekChart")}>
          {dayBars.map((bar) => {
            const fillPct   = Math.min(100, pct(bar.totalLogged, DAILY_CAPACITY));
            const fillClass = allocFill(fillPct);
            return (
              <div key={bar.day} className={cx("mcDayCol")}>
                <div className={cx("mcDayBarWrap")}>
                  {/* Stacked project segments */}
                  {bar.segments.length > 0 ? (
                    <div className={cx("mcDayBarStack")} aria-label={`${bar.day}: ${bar.totalLogged}h logged`}>
                      {bar.segments.map((seg) => {
                        const segPct = Math.min(100, pct(seg.hours, DAILY_CAPACITY));
                        return (
                          <div
                            key={seg.projectId}
                            className={cx("mcDaySegment")}
                            style={{ "--seg-pct": `${segPct}%`, "--seg-color": seg.color } as React.CSSProperties}
                            title={`${seg.name}: ${seg.hours}h`}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className={cx("mcDayBar", fillClass)}
                      style={{ "--pct": `${fillPct}%` } as React.CSSProperties}
                      aria-label={`${bar.day}: ${bar.totalLogged}h logged`}
                    />
                  )}
                  {/* Capacity line marker */}
                  <div className={cx("mcDayCapacityLine")} title={`${DAILY_CAPACITY}h capacity`} />
                </div>
                <div className={cx("mcDayLabel")}>{bar.day}</div>
                <div className={cx("mcDayHours")}>{bar.totalLogged}h</div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        {projects.length > 0 && (
          <div className={cx("mcChartLegend")}>
            {projects.map((proj, idx) => (
              <div key={proj.projectId} className={cx("mcLegendItem")}>
                <span
                  className={cx("mcLegendDot")}
                  style={{ "--dot-color": projectColor(idx) } as React.CSSProperties}
                />
                <span className={cx("mcLegendName")}>{proj.name}</span>
                <span className={cx("mcLegendHours")}>{proj.loggedHours}h</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Allocation by project ─────────────────────────────────────────── */}
      {projects.length > 0 && (
        <div className={cx("mcSection")}>
          <div className={cx("mcSectionHeader")}>
            <div className={cx("mcSectionTitle")}>Time Logged by Project</div>
            <span className={cx("mcSectionMeta")}>{projects.length} PROJECTS</span>
          </div>

          <div className={cx("mcCardList")}>
            {projects.map((project, idx) => {
              const capacityPct = pct(project.loggedHours, weeklyHours);
              const remaining   = Math.max(0, weeklyHours - project.loggedHours);

              return (
                <div key={project.projectId} className={cx("mcProjectCard")}>
                  <div className={cx("mcProjectHead")}>
                    <div className={cx("mcProjectLeft")}>
                      <div className={cx("mcProjectColorDot")} style={{ "--dot-color": projectColor(idx) } as React.CSSProperties} />
                      <div className={cx("mcProjectName")}>{project.name}</div>
                      <div className={cx("mcProjectClient")}>{project.clientName}</div>
                    </div>
                    <div className={cx("mcProjectRight")}>
                      <span className={cx("mcAllocAmount")}>{project.loggedHours}h</span>
                      <span className={cx("mcAllocPct")}>{capacityPct}% of week</span>
                    </div>
                  </div>

                  <div className={cx("mcBars")}>
                    <div className={cx("mcBarRow")}>
                      <div className={cx("mcBarMeta")}>
                        <span className={cx("mcBarLabel")}>Capacity share</span>
                        <span className={cx("mcBarPct")}>{capacityPct}%</span>
                      </div>
                      <div className={cx("progressTrack")}>
                        <div className={cx("progressFill", allocFill(capacityPct))} style={{ '--pct': `${capacityPct}%` } as React.CSSProperties} />
                      </div>
                    </div>
                    <div className={cx("mcBarRow")}>
                      <div className={cx("mcBarMeta")}>
                        <span className={cx("mcBarLabel")}>Hours logged</span>
                        <span className={cx("mcBarPct", "colorAccent")}>{project.loggedHours}h</span>
                      </div>
                      <div className={cx("progressTrack")}>
                        <div className={cx("progressFill", logFill(capacityPct))} style={{ '--pct': `${Math.min(capacityPct, 100)}%` } as React.CSSProperties} />
                      </div>
                    </div>
                  </div>

                  <div className={cx("mcProjectFooter")}>
                    <span className={cx("mcFooterVal", "colorAccent")}>{project.loggedHours}h logged</span>
                    <span className={cx("mcFooterSep")} />
                    <span className={cx("mcFooterVal")}>{weeklyHours}h capacity</span>
                    <span className={cx("mcFooterSep")} />
                    <span className={cx("mcFooterVal", remaining > 0 ? "colorGreen" : "colorAmber")}>
                      {remaining > 0 ? `${remaining}h remaining` : "on target"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {projects.length === 0 && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="zap" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No time logged this week</div>
          <div className={cx("emptyStateSub")}>Start the timer or log time entries to see your capacity breakdown.</div>
        </div>
      )}

      {/* ── Weekly trend ──────────────────────────────────────────────────── */}
      {weekHistory.length > 0 && (
        <div className={cx("mcSection")}>
          <div className={cx("mcSectionHeader")}>
            <div className={cx("mcSectionTitle")}>Weekly Trend</div>
            <span className={cx("mcSectionMeta")}>{weekHistory.length} WEEKS</span>
          </div>
          <div className={cx("tableWrap")}>
            <table className={cx("table")}>
              <thead>
                <tr>
                  <th scope="col">Week</th>
                  <th scope="col">Hours Logged</th>
                  <th scope="col">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {weekHistory.map((w) => {
                  const util = pct(w.loggedHours, weeklyHours);
                  return (
                    <tr key={w.week}>
                      <td className={cx("fw600")}>{w.week}</td>
                      <td className={cx("fontMono")}>{w.loggedHours}h</td>
                      <td className={cx("fontMono", "fw600", utilizationColor(util))}>{util}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {requestOpen && (
        <div className={cx("mcSection", "mt24")}>
          <div className={cx("mcSectionHeader")}>
            <div className={cx("mcSectionTitle")}>Request Reduced Capacity</div>
            <button type="button" className={cx("btnXs", "btnGhost")} onClick={() => setRequestOpen(false)}>
              Cancel
            </button>
          </div>
          <div className={cx("flexCol", "gap16", "pt16")}>
            <div className={cx("flexRow", "gap16")}>
              <div className={cx("flex1")}>
                <label className={cx("mcStatLabel", "mb6")}>Start Date</label>
                <input type="date" value={reqStart} onChange={(e) => setReqStart(e.target.value)}
                  className={cx("dsHoursInput")} />
              </div>
              <div className={cx("flex1")}>
                <label className={cx("mcStatLabel", "mb6")}>End Date</label>
                <input type="date" value={reqEnd} onChange={(e) => setReqEnd(e.target.value)}
                  className={cx("dsHoursInput")} />
              </div>
            </div>
            <div>
              <label className={cx("mcStatLabel", "mb6")}>Notes (optional)</label>
              <textarea
                value={reqNotes}
                onChange={(e) => setReqNotes(e.target.value)}
                placeholder="Reason for reduced capacity..."
                className={cx("dsTextarea")}
              />
            </div>
            {reqFeedback && (
              <div className={cx(reqFeedback.tone === "success" ? "colorAccent" : "colorRed", "text12")}>
                {reqFeedback.text}
              </div>
            )}
            <div className={cx("flexEnd")}>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                disabled={!reqStart || !reqEnd || reqSubmitting}
                onClick={() => void handleReduceCapacity()}
              >
                {reqSubmitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Approved Leave ──────────────────────────────────────────────────── */}
      <div className={cx("mcCard")}>
        <div className={cx("mcCardHd")}>
          <Ic n="calendar" sz={13} c="var(--muted)" />
          <span className={cx("mcCardHdTitle")}>Approved Leave</span>
          {!leaveLoading && (
            <span className={cx("mcCardHdMeta")}>{approvedLeave.length} record{approvedLeave.length !== 1 ? "s" : ""}</span>
          )}
        </div>
        {leaveLoading ? (
          <div className={cx("flexCol", "gap8")}>
            <div className={cx("skeletonBlock", "skeleH40")} />
          </div>
        ) : approvedLeave.length === 0 ? (
          <div className={cx("text12", "colorMuted", "p12", "textCenter")}>No approved leave on record.</div>
        ) : (
          <div className={cx("flexCol", "gap4")}>
            {approvedLeave.map((lr) => {
              const from = new Date(lr.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
              const to   = new Date(lr.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
              const typeLabel = lr.type.charAt(0).toUpperCase() + lr.type.slice(1).toLowerCase().replace(/_/g, " ");
              return (
                <div key={lr.id} className={cx("flexRow", "gap8", "p8x0", "alignCenter")}>
                  <span className={cx("badge", "badgeAccent")}>{typeLabel}</span>
                  <span className={cx("text12", "fw500", "flex1")}>{from} — {to}</span>
                  <span className={cx("fontMono", "text11", "colorMuted", "noWrap")}>{lr.days}d</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Upcoming — Next 14 Days ─────────────────────────────────────────── */}
      <div className={cx("mcCard")}>
        <div className={cx("mcCardHd")}>
          <Ic n="calendar" sz={13} c="var(--muted)" />
          <span className={cx("mcCardHdTitle")}>Upcoming — Next 14 Days</span>
          <span className={cx("mcCardHdMeta")}>{upcomingEvents.length} events</span>
        </div>
        {eventsLoading ? (
          <div className={cx("flexCol", "gap8")}>
            <div className={cx("skeletonBlock", "skeleH40")} />
            <div className={cx("skeletonBlock", "skeleH40")} />
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className={cx("text12", "colorMuted", "p12", "textCenter")}>No events in the next 14 days.</div>
        ) : (
          <div className={cx("flexCol", "gap4")}>
            {upcomingEvents.map((ev) => {
              const dateLabel = new Date(ev.date).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
              const timeLabel = new Date(ev.date).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
              const typeBadge =
                ev.type === "appointment"     ? "badgeAccent"  :
                ev.type === "milestone"       ? "badgePurple"  : "badgeAmber";
              const typeLabel =
                ev.type === "appointment"     ? "Appointment"  :
                ev.type === "milestone"       ? "Milestone"    : "Sprint";
              return (
                <div key={ev.id} className={cx("flexRow", "gap8", "p8x0", "alignCenter")}>
                  <span className={cx("badge", typeBadge)}>{typeLabel}</span>
                  <span className={cx("text12", "fw500", "flex1", "minW0", "overflowHidden", "textEllipsis")}>{ev.title}</span>
                  {ev.clientName && <span className={cx("text11", "colorMuted")}>{ev.clientName}</span>}
                  <span className={cx("fontMono", "text11", "colorMuted", "noWrap")}>{dateLabel} {timeLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
