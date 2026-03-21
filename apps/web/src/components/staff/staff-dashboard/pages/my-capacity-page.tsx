"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { getStaffCapacity, type StaffCapacity } from "@/lib/api/staff/profile";
import type { AuthSession } from "@/lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { submitLeaveRequestWithRefresh } from "@/lib/api/staff/hr";

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

  const weeklyHours        = capacity?.weeklyHours         ?? 40;
  const loggedThisWeek     = capacity?.loggedThisWeekHours ?? 0;
  const projects           = capacity?.projects            ?? [];
  const weekHistory        = capacity?.weekHistory         ?? [];

  const utilizationPct  = weeklyHours > 0 ? Math.min(100, Math.round((loggedThisWeek / weeklyHours) * 100)) : 0;
  const availableHours  = Math.max(0, weeklyHours - loggedThisWeek);

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

      <div className={cx("flexEnd", "mb20")}>
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

      {/* ── Allocation by project ─────────────────────────────────────────── */}
      {projects.length > 0 && (
        <div className={cx("mcSection")}>
          <div className={cx("mcSectionHeader")}>
            <div className={cx("mcSectionTitle")}>Time Logged by Project</div>
            <span className={cx("mcSectionMeta")}>{projects.length} PROJECTS</span>
          </div>

          <div className={cx("mcCardList")}>
            {projects.map((project) => {
              const capacityPct = pct(project.loggedHours, weeklyHours);
              const remaining   = Math.max(0, weeklyHours - project.loggedHours);

              return (
                <div key={project.projectId} className={cx("mcProjectCard")}>
                  <div className={cx("mcProjectHead")}>
                    <div className={cx("mcProjectLeft")}>
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
    </section>
  );
}
