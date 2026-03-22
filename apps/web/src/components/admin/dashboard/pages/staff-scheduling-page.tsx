// ════════════════════════════════════════════════════════════════════════════
// staff-scheduling-page.tsx — Admin Staff Scheduling Timeline
// Data     : loadAdminStaffScheduleWithRefresh → GET /admin/staff-schedule
// ════════════════════════════════════════════════════════════════════════════
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "../style";
import {
  loadAdminStaffScheduleWithRefresh,
  type StaffScheduleEntry,
  type StaffScheduleWeek,
} from "@/lib/api/admin/staff-schedule";
import type { AuthSession } from "@/lib/auth/session";
import { saveSession } from "@/lib/auth/session";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get the Monday of the week containing the given date. */
function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Sunday → go back 6 days; others → go to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Add N weeks to a date. */
function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

/** Format ISO date string as "Mar 10" */
function fmtWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Format ISO date string as "Mon, 10 Mar" */
function fmtFull(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Add N days to an ISO date string and return ISO string */
function addDaysToIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0] as string;
}

/** Status label helpers */
function statusLabel(status: StaffScheduleWeek["status"]): string {
  if (status === "available") return "Available";
  if (status === "partial") return "Partial";
  return "On Leave";
}

function statusCellClass(status: StaffScheduleWeek["status"]): string {
  if (status === "available") return "schedAvailable";
  if (status === "partial") return "schedPartial";
  return "schedLeave";
}

function statusChipClass(status: StaffScheduleWeek["status"]): string {
  if (status === "available") return "staffSchedStatusAvailable";
  if (status === "partial") return "staffSchedStatusPartial";
  return "staffSchedStatusLeave";
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SelectedCell {
  staffId: string;
  weekIdx: number;
}

interface StaffSchedulingPageProps {
  session: AuthSession | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StaffSchedulingPage({ session }: StaffSchedulingPageProps) {
  const [schedule, setSchedule] = useState<StaffScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const [selected, setSelected] = useState<SelectedCell | null>(null);

  const loadedRef = useRef(false);

  const loadSchedule = useCallback(
    async (ws: Date) => {
      if (!session) return;
      setLoading(true);
      const isoStart = ws.toISOString().split("T")[0] as string;
      const result = await loadAdminStaffScheduleWithRefresh(session, isoStart, 8);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.unauthorized) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }
      if (result.error) {
        const isAuthError = result.error.code === "SESSION_EXPIRED" || result.error.code === "SESSION_UNAUTHORIZED";
        setError(isAuthError ? "Session expired. Please log in again." : (result.error.message ?? "Failed to load schedule"));
        setLoading(false);
        return;
      }
      setError(null);
      if (result.data) setSchedule(result.data);
      setLoading(false);
    },
    [session]
  );

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    void loadSchedule(weekStart);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    if (!loadedRef.current) { loadedRef.current = true; return; }
    void loadSchedule(weekStart);
  }, [weekStart, loadSchedule]);

  function handlePrev() {
    setError(null);
    setWeekStart((prev) => getMondayOf(addWeeks(prev, -4)));
    setSelected(null);
  }

  function handleNext() {
    setError(null);
    setWeekStart((prev) => getMondayOf(addWeeks(prev, 4)));
    setSelected(null);
  }

  // Build week header labels from first schedule entry (if any), or derive from weekStart
  const weekHeaders: string[] = schedule[0]?.weeks.map((w) => fmtWeek(w.weekStart)) ?? Array.from({ length: 8 }, (_, i) => {
    const d = addWeeks(weekStart, i);
    return fmtWeek(d.toISOString().split("T")[0] as string);
  });

  // Side panel data
  const selectedEntry = selected
    ? schedule.find((e) => e.staffId === selected.staffId) ?? null
    : null;
  const selectedWeek: StaffScheduleWeek | null =
    selectedEntry && selected ? (selectedEntry.weeks[selected.weekIdx] ?? null) : null;

  return (
    <section className={cx("page", "pageBody", "pageActive")} id="page-staff-scheduling">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Communication / Staff</div>
        <h1 className={cx("pageTitleText")}>Staff Schedule</h1>
        <p className={cx("pageSubtitleText", "mb20")}>8-week scheduling timeline — availability, leave, and project assignments</p>
      </div>

      {/* Header with navigation */}
      <div className={cx("staffSchedHeader")}>
        <div className={cx("staffSchedTitle")}>
          Week of {fmtWeek(weekStart.toISOString().split("T")[0] as string)}
        </div>
        <div className={cx("staffSchedNav")}>
          <button type="button" className={cx("staffSchedNavBtn")} onClick={handlePrev}>
            ← Prev 4 weeks
          </button>
          <button type="button" className={cx("staffSchedNavBtn")} onClick={handleNext}>
            Next 4 weeks →
          </button>
        </div>
      </div>

      {error ? (
        <div className={cx("staffSchedError")}>{error}</div>
      ) : null}

      {loading ? (
        <div className={cx("staffSchedLoading")}>Loading schedule…</div>
      ) : schedule.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}>📅</div>
          <div className={cx("emptyStateTitle")}>No active staff found</div>
          <div className={cx("emptyStateSub")}>Staff members will appear here once their profiles are active.</div>
        </div>
      ) : (
        <div className={cx("staffSchedTable")}>
          <div className={cx("staffSchedGrid")}>
            {/* Header row */}
            <div className={cx("staffSchedHead")}>Staff Member</div>
            {weekHeaders.map((label, i) => (
              <div key={i} className={cx("staffSchedHead")}>{label}</div>
            ))}

            {/* Data rows */}
            {schedule.map((entry) => (
              <React.Fragment key={entry.staffId}>
                <div className={cx("staffSchedNameCell")}>
                  <span>{entry.staffName}</span>
                  <span className={cx("staffSchedRole")}>{entry.role}</span>
                </div>
                {entry.weeks.map((week, weekIdx) => (
                  <button
                    key={`${entry.staffId}-${weekIdx}`}
                    type="button"
                    className={cx("staffSchedCell", statusCellClass(week.status))}
                    onClick={() =>
                      setSelected(
                        selected?.staffId === entry.staffId && selected.weekIdx === weekIdx
                          ? null
                          : { staffId: entry.staffId, weekIdx }
                      )
                    }
                    title={`${entry.staffName} — ${statusLabel(week.status)}${week.leaveReason ? ` (${week.leaveReason})` : ""}`}
                  >
                    {statusLabel(week.status)}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Side panel */}
      {selected && selectedEntry && selectedWeek && (
        <div className={cx("staffSchedPanel")}>
          <button
            type="button"
            className={cx("staffSchedPanelClose")}
            onClick={() => setSelected(null)}
            aria-label="Close panel"
          >
            ✕
          </button>

          <div className={cx("staffSchedPanelTitle")}>{selectedEntry.staffName}</div>
          <div className={cx("staffSchedPanelSub")}>
            {fmtFull(selectedWeek.weekStart)} — {fmtFull(addDaysToIso(selectedWeek.weekStart, 6))}
          </div>

          <div className={cx("staffSchedPanelRow")}>
            <div className={cx("staffSchedPanelLabel")}>Role</div>
            <div className={cx("staffSchedPanelVal")}>{selectedEntry.role}</div>
          </div>

          <div className={cx("staffSchedPanelRow")}>
            <div className={cx("staffSchedPanelLabel")}>Status</div>
            <div className={cx("staffSchedPanelVal")}>
              <span className={cx("staffSchedStatusChip", statusChipClass(selectedWeek.status))}>
                {statusLabel(selectedWeek.status)}
              </span>
            </div>
          </div>

          {selectedWeek.leaveReason && (
            <div className={cx("staffSchedPanelRow")}>
              <div className={cx("staffSchedPanelLabel")}>Leave Type</div>
              <div className={cx("staffSchedPanelVal")}>{selectedWeek.leaveReason}</div>
            </div>
          )}

          <div className={cx("staffSchedPanelRow")}>
            <div className={cx("staffSchedPanelLabel")}>Weekly Capacity</div>
            <div className={cx("staffSchedPanelVal")}>{selectedEntry.weeklyCapacity}h</div>
          </div>

          <div className={cx("staffSchedPanelRow")}>
            <div className={cx("staffSchedPanelLabel")}>Project Assignments</div>
            {selectedWeek.projectAssignments.length > 0 ? (
              <div className={cx("flexCol", "gap6", "mt6")}>
                {selectedWeek.projectAssignments.map((proj) => (
                  <div key={proj.projectId} className={cx("staffSchedPanelVal")}>
                    {proj.projectName}
                  </div>
                ))}
              </div>
            ) : (
              <div className={cx("staffSchedEmptyAssign")}>
                {selectedWeek.status === "on-leave"
                  ? "Staff member is on leave this week."
                  : "No project assignments this week."}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
