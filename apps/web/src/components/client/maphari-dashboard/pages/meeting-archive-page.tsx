"use client";
import { useState, useEffect, useMemo } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { saveSession } from "../../../../lib/auth/session";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalAppointmentsWithRefresh,
  loadPortalMeetingsWithRefresh,
  ratePortalMeetingWithRefresh,
  createPortalSupportTicketWithRefresh,
  type PortalAppointment,
  type PortalMeeting,
} from "../../../../lib/api/portal";
import {
  getGoogleCalendarStatusWithRefresh,
  syncMeetingToGoogleWithRefresh,
} from "../../../../lib/api/portal/integrations";
import { usePageToast } from "../hooks/use-page-toast";

// ── Archive list data ─────────────────────────────────────────────────────────
type MType = "Sprint Demo" | "Design Review" | "Project Catch-up" | "Account Review";

const ARCHIVE_MEETINGS: {
  id: string; title: string; date: string; duration: string; type: MType;
  host: string; attendees: string[]; keyPoints: string[]; actions: string[];
}[] = [];

const TYPE_BADGE: Record<MType, string> = {
  "Sprint Demo":      "badgeAccent",
  "Design Review":    "badgePurple",
  "Project Catch-up": "badgeMuted",
  "Account Review":   "badgeAmber",
};

const TYPE_COLOR_ARCH: Record<MType, string> = {
  "Sprint Demo":      "var(--lime)",
  "Design Review":    "var(--purple)",
  "Project Catch-up": "var(--muted2)",
  "Account Review":   "var(--amber)",
};

const TYPE_ICON_ARCH: Record<MType, string> = {
  "Sprint Demo":      "zap",
  "Design Review":    "layers",
  "Project Catch-up": "message",
  "Account Review":   "chart",
};

// ── Calendar data (March 2026) ────────────────────────────────────────────────
type CalMeetingType = "Video" | "Screen Share" | "Phone";

type CalMeeting = {
  day: number; title: string; type: CalMeetingType;
  host: string; hostAv: string; duration: string;
  keyPoints: string[]; actions: string[];
};

const CAL_MEETINGS: CalMeeting[] = [];

const TYPE_COLOR: Record<CalMeetingType, string> = {
  Video:          "var(--lime)",
  "Screen Share": "var(--purple)",
  Phone:          "var(--amber)",
};

const TYPE_ICON_CAL: Record<CalMeetingType, string> = {
  Video:          "video",
  "Screen Share": "monitor",
  Phone:          "phone",
};

const MOODS_ARCH = ["😞", "😐", "🙂", "😊", "🤩"] as const;
const TODAY = new Date().getDate();

// Calendar is computed dynamically at render time from the current date
const _NOW_MONTH = new Date();
const CAL_YEAR   = _NOW_MONTH.getFullYear();
const CAL_MONTH  = _NOW_MONTH.getMonth();
const CAL_MONTH_LABEL = _NOW_MONTH.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
const CAL_MONTH_ABR   = _NOW_MONTH.toLocaleDateString("en-ZA", { month: "short" }).toUpperCase().slice(0, 3);
const _CAL_DAYS_IN_MONTH = new Date(CAL_YEAR, CAL_MONTH + 1, 0).getDate();
const _CAL_FIRST_DOW     = new Date(CAL_YEAR, CAL_MONTH, 1).getDay(); // 0=Sun
const CAL_CELLS: number[] = [
  ...Array.from({ length: _CAL_FIRST_DOW }, () => 0),
  ...Array.from({ length: _CAL_DAYS_IN_MONTH }, (_, i) => i + 1),
];

// INSIGHTS are now computed dynamically from real meeting data (see computeInsights)

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function apptToCalMeeting(a: PortalAppointment): CalMeeting {
  const TYPE_MAP: Record<string, CalMeetingType> = {
    PHONE: "Phone", VIDEO: "Video", SCREEN_SHARE: "Screen Share",
  };
  return {
    day:       new Date(a.scheduledAt).getDate(),
    title:     a.type.replace(/_/g, " "),
    type:      TYPE_MAP[a.type.toUpperCase()] ?? "Video",
    host:      a.ownerName ?? "Maphari",
    hostAv:    getInitials(a.ownerName ?? "M"),
    duration:  `${a.durationMins} min`,
    keyPoints: a.notes ? [a.notes] : [],
    actions:   [],
  };
}

function apptToArchiveMeeting(a: PortalAppointment) {
  return {
    id:         a.id,
    title:      a.type.replace(/_/g, " "),
    date:       new Date(a.scheduledAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
    duration:   `${a.durationMins} min`,
    type:       "Project Catch-up" as MType,
    host:       a.ownerName ?? "Maphari",
    attendees:  ["Client", a.ownerName ?? "Maphari"],
    keyPoints:  a.notes ? [a.notes] : [],
    actions:    [],
  };
}

function computeInsights(meetings: PortalMeeting[], total: number): Array<{ dot: string; text: string }> {
  if (meetings.length === 0 && total === 0) return [];
  const avgDuration = meetings.length > 0 ? Math.round(meetings.reduce((s, m) => s + m.durationMins, 0) / meetings.length) : 0;
  const pendingActions = meetings.filter(m => m.actionItemStatus === "PENDING" || m.actionItemStatus === "IN_PROGRESS").length;
  const results: Array<{ dot: string; text: string }> = [];
  if (total > 0)        results.push({ dot: "var(--lime)",   text: `${total} meeting${total !== 1 ? "s" : ""} recorded — your team is staying in sync.` });
  if (avgDuration > 0)  results.push({ dot: "var(--amber)",  text: `Average meeting duration: ${avgDuration} min${avgDuration > 60 ? " — consider shorter focused sessions." : "."}` });
  if (pendingActions > 0) results.push({ dot: "var(--purple)", text: `${pendingActions} action item${pendingActions !== 1 ? "s" : ""} pending from recent meetings.` });
  return results;
}

export function MeetingArchivePage() {
  const { session } = useProjectLayer();
  const [calMeetings,    setCalMeetings]    = useState<CalMeeting[]>([]);
  const [archiveMeetings, setArchiveMeetings] = useState<typeof ARCHIVE_MEETINGS>([]);
  const [portalMeetings, setPortalMeetings] = useState<PortalMeeting[]>([]);
  const [tab,         setTab]         = useState<"calendar" | "list">("calendar");
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [actionsDone, setActionsDone] = useState<Record<number, Set<number>>>({});
  const [listActions, setListActions] = useState<Record<string, Set<number>>>({});
  const [bookingFollowUp, setBookingFollowUp] = useState(false);
  const [meetingMoods,    setMeetingMoods]    = useState<Record<number, string>>({});
  const notify = usePageToast();

  // Google Calendar sync state
  const [gcalConnected,  setGcalConnected]  = useState(false);
  const [syncingId,      setSyncingId]      = useState<string | null>(null);
  const [syncedIds,      setSyncedIds]      = useState<Set<string>>(new Set());
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  // ── Derived stat counts from real meeting data ───────────────────────────
  const totalMeetings  = calMeetings.length + archiveMeetings.length;
  const sprintDemos    = useMemo(() =>
    archiveMeetings.filter(m => m.type === "Sprint Demo").length +
    calMeetings.filter(m => m.title.toLowerCase().includes("sprint") || m.title.toLowerCase().includes("demo")).length,
  [calMeetings, archiveMeetings]);
  const designReviews  = useMemo(() =>
    archiveMeetings.filter(m => m.type === "Design Review").length +
    calMeetings.filter(m => m.title.toLowerCase().includes("design")).length,
  [calMeetings, archiveMeetings]);
  async function handleBookFollowUp(): Promise<void> {
    if (!session || bookingFollowUp) return;
    setBookingFollowUp(true);
    try {
      const r = await createPortalSupportTicketWithRefresh(session, {
        clientId:    session.user.clientId ?? "",
        title:       "Follow-up Meeting Request",
        description: "The client has requested a follow-up meeting via the Meeting Archive page.",
        category:    "MEETING_REQUEST",
        priority:    "MEDIUM",
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        notify("error", "Request failed", "Could not send your meeting request. Please try again.");
      } else {
        notify("success", "Request sent", "Your follow-up meeting request has been sent to your project manager.");
      }
    } catch {
      notify("error", "Request failed", "Could not send your meeting request. Please try again.");
    } finally {
      setBookingFollowUp(false);
    }
  }

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const now = new Date();
    void Promise.all([
      loadPortalAppointmentsWithRefresh(session),
      loadPortalMeetingsWithRefresh(session),
      getGoogleCalendarStatusWithRefresh(session),
    ]).then(([apptR, meetR, gcalR]) => {
      if (apptR.nextSession) saveSession(apptR.nextSession);
      if (meetR.nextSession) saveSession(meetR.nextSession);
      if (gcalR.nextSession) saveSession(gcalR.nextSession);
      if (apptR.error) { setError(apptR.error.message ?? "Failed to load."); setLoading(false); return; }
      if (!apptR.error && apptR.data) {
        const future = apptR.data.filter(a => new Date(a.scheduledAt) >= now);
        const past   = apptR.data.filter(a => new Date(a.scheduledAt) < now);
        setCalMeetings(future.map(apptToCalMeeting));
        setArchiveMeetings(past.map(apptToArchiveMeeting) as typeof ARCHIVE_MEETINGS);
      }
      if (!meetR.error && meetR.data) {
        setPortalMeetings(meetR.data);
        // Pre-populate mood ratings from API data
        const moods: Record<number, string> = {};
        const MOOD_EMOJIS = ["😞", "😐", "🙂", "😊", "🤩"] as const;
        meetR.data.forEach(m => {
          if (m.clientMoodRating && m.clientMoodRating >= 1 && m.clientMoodRating <= 5) {
            const day = new Date(m.meetingAt).getDate();
            moods[day] = MOOD_EMOJIS[m.clientMoodRating - 1];
          }
        });
        setMeetingMoods(moods);
      }
      if (gcalR.data?.connected) setGcalConnected(true);
      setLoading(false);
    });
  }, [session]);

  async function handleSyncMeeting(meetingId: string): Promise<void> {
    if (!session || syncingId === meetingId) return;
    setSyncingId(meetingId);
    try {
      const r = await syncMeetingToGoogleWithRefresh(session, meetingId);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data?.synced) {
        setSyncedIds((prev) => new Set([...prev, meetingId]));
        notify("success", "Synced to Google Calendar", "Meeting added to your calendar.");
      } else {
        notify("error", "Sync failed", r.error?.message ?? "Unable to sync meeting.");
      }
    } catch {
      notify("error", "Sync failed", "Please try again.");
    } finally {
      setSyncingId(null);
    }
  }

  function toggleAction(day: number, idx: number) {
    setActionsDone((prev) => {
      const set = new Set<number>(prev[day] ?? []);
      if (set.has(idx)) set.delete(idx); else set.add(idx);
      return { ...prev, [day]: set };
    });
  }

  function toggleListAction(id: string, idx: number) {
    setListActions((prev) => {
      const set = new Set<number>(prev[id] ?? []);
      if (set.has(idx)) set.delete(idx); else set.add(idx);
      return { ...prev, [id]: set };
    });
  }

  const panelMeeting = selectedDay !== null
    ? calMeetings.find((m) => m.day === selectedDay) ?? null
    : null;

  const UPCOMING = calMeetings.filter((m) => m.day > TODAY).slice(0, 3);

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
  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Communication · Archive</div>
          <h1 className={cx("pageTitle")}>Meeting Intelligence Hub</h1>
          <p className={cx("pageSub")}>Your full meeting calendar, action item tracker, and AI-powered meeting insights.</p>
        </div>
      </div>

      {/* ── KPI cards — derived from real appointment data ──────────────── */}
      <div className={cx("maKpiGrid")}>
        <div className={cx("maKpiCard", "maKpiAccent")}>
          <div className={cx("maKpiLabel")}>Total Meetings</div>
          <div className={cx("maKpiValue")}>{totalMeetings}</div>
          <div className={cx("maKpiSub")}>this month</div>
        </div>
        <div className={cx("maKpiCard", "maKpiTeal")}>
          <div className={cx("maKpiLabel")}>Sprint Demos</div>
          <div className={cx("maKpiValue")}>{sprintDemos}</div>
          <div className={cx("maKpiSub")}>this month</div>
        </div>
        <div className={cx("maKpiCard", "maKpiPurple")}>
          <div className={cx("maKpiLabel")}>Design Reviews</div>
          <div className={cx("maKpiValue")}>{designReviews}</div>
          <div className={cx("maKpiSub")}>this month</div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className={cx("pillTabs")}>
        {(["calendar", "list"] as const).map((t) => (
          <button key={t} type="button" className={cx("pillTab", tab === t && "pillTabActive")} onClick={() => setTab(t)}>
            {t === "calendar"
              ? <><Ic n="calendar" sz={13} /> Calendar</>
              : <><Ic n="list" sz={13} /> Archive List</>}
          </button>
        ))}
      </div>

      {/* ── Calendar Tab ─────────────────────────────────────────────────── */}
      {tab === "calendar" && (
        <>
          {/* Backdrop */}
          {selectedDay !== null && (
            <div
              className={cx("modalOverlay49")}
              onClick={() => setSelectedDay(null)}
            />
          )}

          {/* Slide-in detail panel */}
          <div className={cx("slidePanel", "z50", selectedDay === null && "translateX100")}>
            {panelMeeting && selectedDay !== null && (
              <div className={cx("p20")}>

                {/* Panel header */}
                <div className={cx("flexBetween", "flexAlignStart", "mb16")}>
                  <div>
                    <div className={cx("text11", "colorMuted", "mb2")}>{selectedDay !== null ? new Date(CAL_YEAR, CAL_MONTH, selectedDay).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : ""}</div>
                    <div className={cx("fw700", "text16")}>{panelMeeting.title}</div>
                  </div>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setSelectedDay(null)}>
                    <Ic n="x" sz={13} c="var(--muted)" />
                  </button>
                </div>

                {/* Meeting meta */}
                <div className={cx("maMetaCard")}>
                  <div className={cx("flexRow", "gap10")}>
                    <div className={cx("maHostAv", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${TYPE_COLOR[panelMeeting.type]} 20%, var(--s3))`, "--color": TYPE_COLOR[panelMeeting.type] } as React.CSSProperties}>
                      {panelMeeting.hostAv}
                    </div>
                    <div className={cx("flex1")}>
                      <div className={cx("fw600", "text12")}>{panelMeeting.host}</div>
                      <div className={cx("text10", "colorMuted")}>{panelMeeting.duration}</div>
                    </div>
                    <div className={cx("flexRow", "gap6")}>
                      <Ic n={TYPE_ICON_CAL[panelMeeting.type]} sz={13} c={TYPE_COLOR[panelMeeting.type]} />
                      <span className={cx("badge", "dynBgColor", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${TYPE_COLOR[panelMeeting.type]} 15%, transparent)`, "--color": TYPE_COLOR[panelMeeting.type] } as React.CSSProperties}>{panelMeeting.type}</span>
                    </div>
                  </div>
                </div>

                {/* Key discussion points */}
                <div className={cx("mb16")}>
                  <div className={cx("fw700", "text11", "flexRow", "gap6", "mb10")}>
                    <Ic n="zap" sz={12} c="var(--lime)" /> Key Discussion Points
                  </div>
                  <div className={cx("flexCol", "gap7")}>
                    {panelMeeting.keyPoints.map((kp, i) => (
                      <div key={i} className={cx("flexRow", "flexAlignStart", "gap10")}>
                        <div className={cx("dot6", "noShrink", "mt5")} style={{ "--bg-color": "var(--lime)" } as React.CSSProperties} />
                        <span className={cx("text12")}>{kp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action items — interactive */}
                <div className={cx("mb16")}>
                  <div className={cx("fw700", "text11", "flexRow", "gap6", "mb10")}>
                    <Ic n="check" sz={12} c="var(--amber)" /> Action Items
                  </div>
                  <div className={cx("flexCol", "gap8")}>
                    {panelMeeting.actions.map((a, i) => {
                      const done = actionsDone[selectedDay]?.has(i) ?? false;
                      return (
                        <div
                          key={i}
                          className={cx("maActionRow")}
                          onClick={() => toggleAction(selectedDay, i)}
                        >
                          <div className={cx("maCheckbox", "dynBgColor")} style={{ "--bg-color": done ? "var(--lime)" : "transparent", "--border-color": done ? "transparent" : "var(--b3)" } as React.CSSProperties}>
                            {done && <Ic n="check" sz={11} c="var(--bg)" sw={2.5} />}
                          </div>
                          <span className={cx("text12", "transAll15", done && "lineThroughOpacity45")}>{a}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mood rating — past meetings only */}
                {selectedDay <= TODAY && (
                  <div className={cx("mb20")}>
                    <div className={cx("fw700", "text11", "mb10")}>Rate this meeting</div>
                    <div className={cx("flexRow", "gap6", "flexWrap")}>
                      {MOODS_ARCH.map((emoji, emojiIdx) => {
                        const active = meetingMoods[selectedDay] === emoji;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setMeetingMoods((p) => ({ ...p, [selectedDay]: emoji }));
                              // Persist to API: find the matching portal meeting by day-of-month
                              if (session) {
                                const rating = emojiIdx + 1; // 1–5
                                const match = portalMeetings.find(
                                  (m) => new Date(m.meetingAt).getDate() === selectedDay
                                );
                                if (match) {
                                  void ratePortalMeetingWithRefresh(session, match.id, rating)
                                    .then((r) => { if (r.nextSession) saveSession(r.nextSession); });
                                }
                              }
                            }}
                            className={cx("maMoodBtn", "dynBgColor", "dynBorderLeft3", active && "maMoodBtnActive")} style={{ "--bg-color": active ? "color-mix(in oklab, var(--lime) 8%, transparent)" : "var(--s2)", "--color": active ? "var(--lime)" : "var(--b2)" } as React.CSSProperties}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className={cx("btnSm", "btnGhost", "wFull")}
                  disabled={bookingFollowUp || !session}
                  onClick={() => void handleBookFollowUp()}
                >
                  <Ic n="calendar" sz={13} c="var(--muted)" />
                  {bookingFollowUp ? "Requesting…" : "Book a Follow-up Meeting"}
                </button>
              </div>
            )}
          </div>

          {/* Month calendar card */}
          <div className={cx("card", "mb16")}>
            <div className={cx("cardHd")}>
              <span className={cx("cardHdTitle")}>{CAL_MONTH_LABEL}</span>
              <span className={cx("badge", "badgeAccent", "mlAuto")}>{calMeetings.length} meeting{calMeetings.length !== 1 ? "s" : ""}</span>
            </div>
            <div className={cx("pCustom0161616")}>
              {/* Day-of-week header */}
              <div className={cx("calWeekHd")}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className={cx("fw600", "text10", "colorMuted", "textCenter", "py4_0")}>{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div className={cx("calGrid")}>
                {CAL_CELLS.map((day, idx) => {
                  const isToday    = day === TODAY;
                  const isEmpty    = day === 0;
                  const meetings   = isEmpty ? [] : calMeetings.filter((m) => m.day === day);
                  const hasMeeting = meetings.length > 0;
                  const isSelected = selectedDay === day;
                  return (
                    <div
                      key={idx}
                      onClick={() => { if (!isEmpty && hasMeeting) setSelectedDay(day === selectedDay ? null : day); }}
                      className={cx("calDayCell", isToday && "calDayCellToday", isEmpty && "calDayCellEmpty", isSelected && "calDayCellSelected", !isEmpty && hasMeeting && "cursorPointer")}
                    >
                      {!isEmpty && (
                        <>
                          <div className={cx("text11", "mb4", "dynColor")} style={{ "--color": isToday ? "var(--lime)" : "inherit" } as React.CSSProperties}>{day}</div>
                          <div className={cx("flexRow", "gap2", "flexWrap")}>
                            {meetings.map((m, i) => (
                              <div key={i} className={cx("dot8")} style={{ "--bg-color": TYPE_COLOR[m.type] } as React.CSSProperties} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className={cx("flexRow", "gap16", "mt12", "flexWrap")}>
                {(Object.entries(TYPE_COLOR) as [CalMeetingType, string][]).map(([type, color]) => (
                  <div key={type} className={cx("flexRow", "gap5")}>
                    <div className={cx("dot8")} style={{ "--bg-color": color } as React.CSSProperties} />
                    <span className={cx("text10", "colorMuted")}>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Upcoming meetings strip ──────────────────────────────────── */}
          <div className={cx("mb16")}>
            <div className={cx("flexRow", "gap8", "mb10")}>
              <div className={cx("accentBar3x14")} />
              <span className={cx("fontMono", "fs063", "fw700", "ls01", "textUpper", "colorMuted")}>
                Upcoming in {CAL_MONTH_LABEL.split(" ")[0]}
              </span>
            </div>
            <div className={cx("grid3Cols", "gap12")}>
              {UPCOMING.map((m) => {
                const color = TYPE_COLOR[m.type];
                return (
                  <div
                    key={m.day}
                    className={cx("card", "p0", "overflowHidden", "cursorPointer")}
                    onClick={() => setSelectedDay(m.day)}
                  >
                    <div className={cx("h3", "dynBgColor")} style={{ "--bg-color": color } as React.CSSProperties} />
                    <div className={cx("py14_px", "px16_px")}>
                      {/* Date box + type pill */}
                      <div className={cx("flexBetween", "mb10")}>
                        <div className={cx("maDateBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${color} 25%, transparent)` } as React.CSSProperties}>
                          <span className={cx("fw800", "lineH1", "dynColor")} style={{ "--color": color } as React.CSSProperties}>{m.day}</span>
                          <span className={cx("fs08", "fw600", "opacity70", "lineH1", "dynColor")} style={{ "--color": color } as React.CSSProperties}>{CAL_MONTH_ABR}</span>
                        </div>
                        <div className={cx("flexRow", "gap4")}>
                          <Ic n={TYPE_ICON_CAL[m.type]} sz={11} c={color} />
                          <span className={cx("maTypePill", "dynBgColor", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${color} 12%, transparent)`, "--color": color } as React.CSSProperties}>{m.type}</span>
                        </div>
                      </div>
                      {/* Title */}
                      <div className={cx("fw700", "text12", "mb6", "lineH135")}>{m.title}</div>
                      {/* Host + duration */}
                      <div className={cx("flexBetween")}>
                        <div className={cx("flexRow", "gap5")}>
                          <Av initials={m.hostAv} size={18} />
                          <span className={cx("text10", "colorMuted")}>{m.host}</span>
                        </div>
                        <span className={cx("text10", "colorMuted")}>{m.duration}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Smart insights card ──────────────────────────────────────── */}
          {(() => {
            const insights = computeInsights(portalMeetings, totalMeetings);
            if (insights.length === 0) return null;
            return (
              <div className={cx("card", "borderLeftAmber")}>
                <div className={cx("cardHd")}>
                  <span className={cx("cardHdTitle", "flexRow", "gap6")}>
                    <Ic n="sparkle" sz={14} c="var(--amber)" /> Meeting Insights
                  </span>
                </div>
                <div className={cx("p0x20x16", "flexCol", "gap10")}>
                  {insights.map((insight, i) => (
                    <div key={i} className={cx("flexRow", "flexAlignStart", "gap10")}>
                      <div className={cx("dot7", "noShrink", "mt4")} style={{ "--bg-color": insight.dot } as React.CSSProperties} />
                      <span className={cx("text11", "colorMuted")}>{insight.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* ── Archive List Tab ─────────────────────────────────────────────── */}
      {tab === "list" && (
        <div className={cx("card", "p0", "overflowHidden")}>
          {archiveMeetings.length === 0 && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No past meetings</div>
              <div className={cx("emptyStateSub")}>Completed meetings will appear here once they have taken place.</div>
            </div>
          )}
          {archiveMeetings.map((m, idx) => {
            const color      = TYPE_COLOR_ARCH[m.type];
            const isExpanded = expanded === m.id;
            return (
              <div
                key={m.id}
                className={cx("dynBorderLeft3", idx < archiveMeetings.length - 1 && "borderB")}
                style={{ "--color": color } as React.CSSProperties}
              >
                {/* Row button */}
                <button
                  type="button"
                  className={cx("maArchiveRowBtn")}
                  onClick={() => setExpanded(isExpanded ? null : m.id)}
                >
                  {/* Icon box */}
                  <div
                    className={cx("pmIconBox36", "dynBgColor")}
                    style={{ "--bg-color": `color-mix(in oklab, ${color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${color} 25%, transparent)` } as React.CSSProperties}
                  >
                    <Ic n={TYPE_ICON_ARCH[m.type]} sz={15} c={color} />
                  </div>

                  {/* Center: ID + title + meta */}
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("flexRow", "gap7", "mb4", "flexWrap")}>
                      <span className={cx("badge", "badgeMuted")}>{m.id}</span>
                      <span className={cx("fw600", "text13")}>{m.title}</span>
                    </div>
                    <div className={cx("flexRow", "gap8")}>
                      <Av initials={getInitials(m.host)} size={18} />
                      <span className={cx("text10", "colorMuted")}>{m.host} · {m.attendees.length} attendees · {m.date}</span>
                    </div>
                  </div>

                  {/* Right: type badge + duration + chevron */}
                  <div className={cx("flexRow", "gap8", "noShrink")}>
                    <span className={cx("badge", TYPE_BADGE[m.type])}>{m.type}</span>
                    <span className={cx("text10", "colorMuted")}>{m.duration}</span>
                    <Ic n={isExpanded ? "chevronDown" : "chevronRight"} sz={14} c="var(--muted2)" />
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className={cx("p0x18x16x66")}>
                    <div className={cx("maMetaCard")}>

                      {/* Attendees */}
                      <div className={cx("flexRow", "gap8", "mb14", "flexWrap")}>
                        <span className={cx("text10", "colorMuted")}>Attendees:</span>
                        {m.attendees.map((att) => (
                          <div key={att} className={cx("flexRow", "gap5")}>
                            <Av initials={getInitials(att)} size={20} />
                            <span className={cx("text10")}>{att}</span>
                          </div>
                        ))}
                      </div>

                      {/* Key points */}
                      <div className={cx("fw700", "text11", "flexRow", "gap5", "mb8")}>
                        <Ic n="zap" sz={11} c="var(--lime)" /> Key Points
                      </div>
                      <div className={cx("flexCol", "gap5", "mb14")}>
                        {m.keyPoints.map((kp, i) => (
                          <div key={i} className={cx("flexRow", "flexAlignStart", "gap8")}>
                            <div className={cx("dot5", "noShrink", "mt5")} style={{ "--bg-color": color } as React.CSSProperties} />
                            <span className={cx("text12")}>{kp}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action items — interactive */}
                      <div className={cx("fw700", "text11", "flexRow", "gap5", "mb8")}>
                        <Ic n="check" sz={11} c="var(--amber)" /> Action Items
                      </div>
                      <div className={cx("flexCol", "gap7")}>
                        {m.actions.map((a, i) => {
                          const done = listActions[m.id]?.has(i) ?? false;
                          return (
                            <div
                              key={i}
                              className={cx("maActionRow")}
                              onClick={() => toggleListAction(m.id, i)}
                            >
                              <div className={cx("maCheckbox", "dynBgColor")} style={{ "--bg-color": done ? "var(--lime)" : "transparent", "--border-color": done ? "transparent" : "var(--b3)" } as React.CSSProperties}>
                                {done && <Ic n="check" sz={10} c="var(--bg)" sw={2.5} />}
                              </div>
                              <span className={cx("text12", "transAll15", done && "lineThroughOpacity45")}>{a}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Google Calendar sync */}
                      {gcalConnected && (
                        <div className={cx("flexRow", "gap8", "mt12")}>
                          {syncedIds.has(m.id) ? (
                            <span className={cx("gcSyncedBadge")}>
                              <Ic n="check" sz={11} c="var(--green)" /> Synced to Google Calendar
                            </span>
                          ) : (
                            <button
                              type="button"
                              className={cx("gcSyncBtn")}
                              disabled={syncingId === m.id}
                              onClick={(e) => { e.stopPropagation(); void handleSyncMeeting(m.id); }}
                            >
                              {syncingId === m.id ? "Syncing…" : "Sync to Calendar"}
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
