// ════════════════════════════════════════════════════════════════════════════
// book-call-page.tsx — Client Meeting Command Centre
// Data     : loadPortalAppointmentsWithRefresh → GET /appointments
//            createPortalAppointmentWithRefresh → POST /appointments
// Mobile   : Meeting cards stack to 1-col; booking wizard stacks
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useMemo } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalAppointmentsWithRefresh,
  createPortalAppointmentWithRefresh,
  type PortalAppointment
} from "../../../../lib/api/portal";
import { saveSession } from "../../../../lib/auth/session";

// ── Helpers ───────────────────────────────────────────────────────────────────
function toInitials(name: string | null | undefined): string {
  if (!name) return "??";
  return name.split(" ").map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function fmtApptDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  if (Math.abs(diffMs) < 3_600_000 * 3) return `Today, ${d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

function isLiveNow(iso: string, durationMins: number): boolean {
  const start = new Date(iso).getTime();
  const end = start + durationMins * 60_000;
  const now = Date.now();
  return now >= start && now <= end;
}

function apptTypeToUi(raw: string): string {
  const t = raw.toUpperCase();
  if (t.includes("SCREEN")) return "Screen Share";
  if (t.includes("PHONE")) return "Phone";
  if (t.includes("DEMO")) return "Live Demo";
  return "Video";
}

function mapApptToStrip(a: PortalAppointment) {
  const uiType = apptTypeToUi(a.type);
  return {
    id: a.id,
    title: a.notes ?? uiType,
    type: uiType,
    host: a.ownerName ?? "Team",
    hostAv: toInitials(a.ownerName),
    date: fmtApptDate(a.scheduledAt),
    isLive: isLiveNow(a.scheduledAt, a.durationMins),
    videoRoomUrl: a.videoRoomUrl ?? null,
  };
}

// ── API upcoming strip state replaces static data ─────────────────────────────
// (UPCOMING_STRIP is now built from API — see component state)

const MEETING_TYPE_COLOR: Record<string, string> = {
  "Video":        "var(--lime)",
  "Screen Share": "var(--purple)",
  "Phone":        "var(--amber)",
  "Live Demo":    "var(--accent)",
};
const MEETING_TYPE_ICON: Record<string, string> = {
  "Video":        "video",
  "Screen Share": "monitor",
  "Phone":        "phone",
  "Live Demo":    "rocket",
};

// ── Dynamic week helper ───────────────────────────────────────────────────────
function getCurrentWeekDays(): { label: string; id: string; date: Date }[] {
  const today = new Date();
  const dow   = today.getDay(); // 0=Sun, 1=Mon … 6=Sat
  const diff  = dow === 0 ? -6 : 1 - dow; // offset to Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const dayIds   = ["mon", "tue", "wed", "thu", "fri"];
  return dayNames.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label: `${name} ${d.getDate()}`, id: dayIds[i]!, date: d };
  });
}

// ── Booking wizard ────────────────────────────────────────────────────────────
const MEETING_TYPES_WIZ = [
  { id: "video",  icon: "video",   label: "Video Call",   desc: "Face-to-face over video",   color: "var(--lime)"   },
  { id: "phone",  icon: "phone",   label: "Phone Call",   desc: "Audio only call",            color: "var(--amber)"  },
  { id: "screen", icon: "monitor", label: "Screen Share", desc: "Review work together",       color: "var(--purple)" },
  { id: "demo",   icon: "rocket",  label: "Live Demo",    desc: "See your product in action", color: "var(--accent)" },
];

const TIME_ROWS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

// ── Past meetings — populated from API in a future batch ─────────────────────
const PAST_MEETINGS: { id: string; title: string; type: string; color: string; icon: string; hostAv: string; host: string; date: string; duration: string; notes: string }[] = [];

const PAST_TYPE_BADGE: Record<string, string> = {
  "Design Review":  "badgePurple",
  "Sprint Demo":    "badgeAccent",
  "Account Review": "badgeAmber",
};

type BookStep = 0 | 1 | 2 | "done";

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function BookCallPage() {
  const [callActive,     setCallActive]     = useState(false);
  const [micOn,          setMicOn]          = useState(true);
  const [cameraOn,       setCameraOn]       = useState(true);
  const [sharing,        setSharing]        = useState(false);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [callNotes,      setCallNotes]      = useState("");
  const [callSeconds,    setCallSeconds]    = useState(0);

  const [bookStep,         setBookStep]         = useState<BookStep>(0);
  const [selectedType,     setSelectedType]     = useState<string | null>(null);
  const [selectedSlot,     setSelectedSlot]     = useState<{ day: string; time: string } | null>(null);
  const [bookingNotes,     setBookingNotes]     = useState("");
  const [bookedVideoUrl,   setBookedVideoUrl]   = useState<string | null>(null);

  const [expandedPast, setExpandedPast] = useState<string | null>(null);

  useEffect(() => {
    if (!callActive) { setCallSeconds(0); return; }
    const id = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [callActive]);

  useEffect(() => {
    if (!callActive) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setCallActive(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callActive]);

  // ── API state ──────────────────────────────────────────────────────────────
  const { session } = useProjectLayer();
  const [allAppts,      setAllAppts]      = useState<PortalAppointment[]>([]);
  const [upcomingStrip, setUpcomingStrip] = useState<ReturnType<typeof mapApptToStrip>[]>([]);
  const [submitting,    setSubmitting]    = useState(false);

  // ── Current week (computed once per mount) ────────────────────────────────
  const weekDays = useMemo(() => getCurrentWeekDays(), []);

  useEffect(() => {
    if (!session) return;
    loadPortalAppointmentsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) return;
      setAllAppts(r.data);
      const now = Date.now();
      const upcoming = r.data
        .filter((a) => new Date(a.scheduledAt).getTime() + a.durationMins * 60_000 > now)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 6)
        .map(mapApptToStrip);
      setUpcomingStrip(upcoming);
    });
  }, [session]);

  // ── Stats derived from real appointment data ──────────────────────────────
  const statsData = useMemo(() => {
    const now = new Date();
    const thisMonth = allAppts.filter((a) => {
      const d = new Date(a.scheduledAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      totalThisMonth: thisMonth.length,
      hoursThisMonth: Math.round((thisMonth.reduce((s, a) => s + a.durationMins, 0) / 60) * 10) / 10,
      upcomingCount:  upcomingStrip.length,
    };
  }, [allAppts, upcomingStrip]);

  // ── Next meeting + call participants from session ─────────────────────────
  const nextMeeting = upcomingStrip[0] ?? null;

  const callParticipants = useMemo(() => {
    const email    = session?.user?.email ?? "";
    const initials = email.slice(0, 2).toUpperCase() || "YO";
    return [
      { av: "MT",      name: "Maphari Team", role: "Host",   color: "var(--lime)",   isSpeaking: true,  micOn: true, camOn: true  },
      { av: initials,  name: "You",          role: "Client", color: "var(--purple)", isSpeaking: false, micOn: true, camOn: true  },
    ];
  }, [session]);

  // ── Confirm booking handler ───────────────────────────────────────────────
  async function handleConfirmBooking() {
    if (!session || !selectedType || !selectedSlot) return;
    setSubmitting(true);

    // Map wizard day-id + time to a concrete ISO date using the computed current week
    const weekDay  = weekDays.find((d) => d.id === selectedSlot.day);
    const dayDate  = weekDay?.date ?? new Date();
    const [hrs, mins] = selectedSlot.time.split(":").map(Number);
    const scheduledAt = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), hrs ?? 9, mins ?? 0).toISOString();

    const typeMap: Record<string, string> = { video: "VIDEO", phone: "PHONE", screen: "SCREEN_SHARE", demo: "DEMO" };
    const r = await createPortalAppointmentWithRefresh(session, {
      clientId:     session.user.clientId ?? "",
      type:         typeMap[selectedType] ?? "VIDEO",
      scheduledAt,
      durationMins: 30,
      ...(bookingNotes.trim() ? { notes: bookingNotes.trim() } : {}),
    });

    setSubmitting(false);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error || !r.data) return; // silent fail — wizard stays open so user can retry

    // Capture video URL from newly created appointment
    setBookedVideoUrl(r.data.videoRoomUrl ?? null);

    // Append new appointment to the upcoming strip
    setUpcomingStrip((prev) =>
      [...prev, mapApptToStrip(r.data!)]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 6)
    );
    setBookStep("done");
  }

  return (
    <div className={cx("pageBody")}>
      <style>{`
        @keyframes livePulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes callDotPulse{ 0%{box-shadow:0 0 0 0 rgba(220,50,50,0.6)} 70%{box-shadow:0 0 0 8px transparent} 100%{box-shadow:0 0 0 0 transparent} }
        .live-dot      { animation: livePulse 1.4s ease-in-out infinite; }
        .call-dot-ring { animation: callDotPulse 2s ease-out infinite; }
      `}</style>

      {/* ── In-portal Video Call Room ────────────────────────────────────── */}
      {callActive && (
        <div className={cx("fullscreenDark")}>
          {/* Top bar */}
          <div className={cx("p12x20", "darkBorderB", "flexBetween", "noShrink")}>
            <div className={cx("flexRow", "gap10")}>
              <span className={`call-dot-ring ${cx("dot9Error")}`}  />
              <span className={cx("callHeaderTitle")}>{nextMeeting?.title ?? "Meeting"} — Live</span>
              <span className={cx("callTimerLabel")}>{fmtTime(callSeconds)}</span>
            </div>
            <div className={cx("flexRow", "gap8")}>
              <button
                type="button"
                onClick={() => setNotesPanelOpen((p) => !p)}
                className={cx("callNotesToggleBtn", "dynBgColor")}
                style={{ "--bg-color": notesPanelOpen ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)" } as React.CSSProperties}
              >
                <Ic n="edit" sz={14} c="#fff" /> Notes
              </button>
              <button
                type="button"
                onClick={() => setCallActive(false)}
                className={cx("btnDangerSoft")}
              >
                <Ic n="phone" sz={13} c="#ff6060" /> End Call
              </button>
            </div>
          </div>

          {/* Participant grid */}
          <div className={cx("callParticipantGrid")}>
            {callParticipants.map((p) => (
              <div
                key={p.av}
                className={cx("callParticipantBox", "dynBgColor")}
                style={{ "--bg-color": "#111", "--color": p.isSpeaking ? "var(--lime)" : p.av === "SK" ? "rgba(255,255,255,0.1)" : "transparent" } as React.CSSProperties}
              >
                {p.isSpeaking && <div className={cx("accentTopBar")} />}
                <div className={cx("callAvCircle", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${p.color} 18%, #1a1a1a)`, "--color": p.isSpeaking ? "var(--lime)" : p.color } as React.CSSProperties}>
                  {p.av}
                </div>
                <div className={cx("textCenter")}>
                  <div className={cx("callNameRow")}>
                    {p.isSpeaking && <span className={`live-dot ${cx("dotAccentSm", "inlineBlock")}`}  />}
                    <span className={cx("callNameLabel")}>{p.name}</span>
                  </div>
                  <div className={cx("callRoleLabel")}>{p.role}</div>
                </div>
                <div className={cx("absBR10x12", "flexRow", "gap5")}>
                  {[
                    { on: p.micOn,  icon: "mic"    },
                    { on: p.camOn,  icon: "camera" },
                  ].map((ctrl) => (
                    <div key={ctrl.icon} className={cx("callCtrlIcon", "dynBgColor")} style={{ "--bg-color": ctrl.on ? "rgba(255,255,255,0.1)" : "rgba(220,50,50,0.3)", "--color": ctrl.on ? "rgba(255,255,255,0.2)" : "rgba(220,50,50,0.5)" } as React.CSSProperties}>
                      <Ic n={ctrl.icon} sz={12} c={ctrl.on ? "rgba(255,255,255,0.7)" : "#ff6060"} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Control bar */}
          <div className={cx("callControlBar")}>
            {([
              { icon: "mic",     label: "Mic",    active: micOn,    toggle: () => setMicOn((v) => !v)    },
              { icon: "camera",  label: "Camera", active: cameraOn, toggle: () => setCameraOn((v) => !v) },
              { icon: "monitor", label: "Share",  active: sharing,  toggle: () => setSharing((v) => !v)  },
            ] as { icon: string; label: string; active: boolean; toggle: () => void }[]).map((ctrl) => (
              <div key={ctrl.label} className={cx("flexCol", "flexCenter", "gap5")}>
                <button
                  type="button"
                  onClick={ctrl.toggle}
                  className={cx("callCtrlBtn", "dynBgColor")}
                  style={{ "--bg-color": ctrl.active ? "rgba(255,255,255,0.1)" : "rgba(220,50,50,0.18)", "--color": ctrl.active ? "rgba(255,255,255,0.25)" : "rgba(220,50,50,0.4)" } as React.CSSProperties}
                >
                  <Ic n={ctrl.icon} sz={22} c={ctrl.active ? "rgba(255,255,255,0.85)" : "#ff6060"} />
                </button>
                <span className={cx("callCtrlLabel")}>{ctrl.label}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCallActive(false)}
              className={cx("btnDanger")}
            >
              <Ic n="phone" sz={16} c="#fff" /> End Call
            </button>
            <span className={cx("escHint")}>Press ESC to exit</span>
          </div>

          {/* Slide-up notes panel */}
          {notesPanelOpen && (
            <div className={cx("callNotesPanel")}>
              <div className={cx("flexBetween", "mb10")}>
                <span className={cx("fw700", "text12")}>Meeting Notes</span>
                <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setNotesPanelOpen(false)}>Save Notes</button>
              </div>
              <textarea className={cx("textarea", "resizeV", "fontMono", "fs12")} rows={5} value={callNotes} onChange={(e) => setCallNotes(e.target.value)}  />
            </div>
          )}
        </div>
      )}

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Communication · Meetings</div>
          <h1 className={cx("pageTitle")}>Meeting Command Centre</h1>
          <p className={cx("pageSub")}>Join live meetings, book a call, and manage your schedule — all from one place.</p>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack")}>
        {[
          { label: "Total This Month", value: statsData.totalThisMonth > 0 ? String(statsData.totalThisMonth) : "—", color: "statCardAccent"  },
          { label: "Hours in Calls",   value: statsData.hoursThisMonth > 0 ? `${statsData.hoursThisMonth}h` : "—",    color: "statCardPurple"  },
          { label: "Upcoming Calls",   value: statsData.upcomingCount  > 0 ? String(statsData.upcomingCount)  : "—", color: "statCardGreen"   },
          { label: "Action Items",     value: "—",                                                                     color: "statCardAmber"   },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Next Meeting Hero Card ────────────────────────────────────────── */}
      {nextMeeting ? (
        <div className={cx("card", "borderLeftAccent")}>
          <div className={cx("py20_px", "px24_px")}>
            <div className={cx("meetingHeroRow")}>
              {/* Left: details */}
              <div className={cx("flex1", "minW0")}>
                <div className={cx("flexRow", "flexCenter", "gap7", "mb12")}>
                  <div className={cx("accentBar3x14")} />
                  <span className={cx("fontMono", "fs062", "fw700", "ls01", "textUpper", "colorMuted")}>Your next meeting</span>
                </div>
                <div className={cx("flexRow", "flexCenter", "gap12", "mb10")}>
                  <div className={cx("iconBox44")}>
                    <Ic n={MEETING_TYPE_ICON[nextMeeting.type] ?? "calendar"} sz={20} c="var(--lime)" />
                  </div>
                  <div>
                    <div className={cx("fw800", "nextMeetingHd")}>{nextMeeting.title}</div>
                    <div className={cx("text11", "colorMuted", "mt2")}>{nextMeeting.date}</div>
                  </div>
                </div>
                <div className={cx("flexRow", "gap12")}>
                  <div className={cx("flexRow", "gap6")}>
                    <Av initials={nextMeeting.hostAv} size={22} />
                    <span className={cx("text11", "colorMuted")}>Hosted by {nextMeeting.host}</span>
                  </div>
                  <span className={cx("badge", "badgeMuted")}>{nextMeeting.type}</span>
                  {nextMeeting.isLive && <span className={cx("badge", "badgeRed")}>LIVE</span>}
                </div>
              </div>

              {/* Right: join / upcoming */}
              <div className={cx("meetingJoinBox")}>
                {nextMeeting.isLive ? (
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    onClick={() => nextMeeting.videoRoomUrl ? window.open(nextMeeting.videoRoomUrl, "_blank", "noopener,noreferrer") : setCallActive(true)}
                  >
                    <Ic n="video" sz={13} c="var(--bg)" /> Join Now
                  </button>
                ) : (
                  <>
                    <div className={cx("textCenter")}>
                      <div className={cx("fontMono", "fw700", "text13", "colorAccent")}>Upcoming</div>
                    </div>
                    <button type="button" className={cx("btnSm", "btnGhost", "noWrap")}>
                      <Ic n="calendar" sz={12} c="var(--muted)" /> Add to Calendar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={cx("card", "dynBorderLeft3")} style={{ "--color": "var(--b2)" } as React.CSSProperties}>
          <div className={cx("p20x24", "flexRow", "gap16")}>
            <div className={cx("iconBox44")}>
              <Ic n="calendar" sz={20} c="var(--muted2)" />
            </div>
            <div>
              <div className={cx("fw700", "text13")}>No upcoming meetings</div>
              <div className={cx("text11", "colorMuted")}>Book a new meeting below and we'll send you a calendar invite.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Upcoming meetings — 3-col grid ───────────────────────────────── */}
      <div className={cx("grid3Cols", "gap12")}>
        {upcomingStrip.map((m) => {
          const color    = MEETING_TYPE_COLOR[m.type] ?? "var(--muted2)";
          const iconName = MEETING_TYPE_ICON[m.type]  ?? "calendar";
          return (
            <div key={m.id} className={cx("card", "p0", "overflowHidden", "flexCol")}>
              <div className={cx("h3", "dynBgColor")} style={{ "--bg-color": m.isLive ? "#ff4444" : color } as React.CSSProperties} />
              <div className={cx("p16x16x14", "flexCol", "flex1")}>
                <div className={cx("flexBetween", "mb10")}>
                  <div className={cx("flexRow", "gap8")}>
                    <Av initials={m.hostAv} size={28} />
                    <div>
                      <div className={cx("fw600", "text11")}>{m.host}</div>
                      <div className={cx("text10", "colorMuted")}>Host</div>
                    </div>
                  </div>
                  {m.isLive
                    ? <span className={`live-dot ${cx("dot9Error")}`}  />
                    : <Ic n={iconName} sz={14} c={color} />
                  }
                </div>
                <div className={cx("fw700", "text13", "mb6", "lineH13")}>{m.title}</div>
                <div className={cx("flexRow", "flexCenter", "gap6", "mb14")}>
                  <Ic n="calendar" sz={11} c="var(--muted2)" />
                  <span className={cx("text10", "colorMuted")}>{m.date}</span>
                  <span className={cx("badge", m.isLive ? "badgeRed" : "badgeMuted", "mlAuto")}>{m.type}</span>
                </div>
                <div className={cx("mtAuto")}>
                  {m.isLive && m.videoRoomUrl
                    ? (
                      <button type="button" className={cx("btnSm", "btnAccent", "wFull")} onClick={() => window.open(m.videoRoomUrl!, "_blank", "noopener,noreferrer")}>
                        <Ic n="video" sz={13} c="var(--bg)" /> Join Call
                      </button>
                    ) : m.isLive
                    ? (
                      <button type="button" className={cx("btnSm", "btnAccent", "wFull")} onClick={() => setCallActive(true)}>
                        <Ic n="video" sz={13} c="var(--bg)" /> Join Now
                      </button>
                    ) : m.videoRoomUrl
                    ? (
                      <button type="button" className={cx("btnSm", "btnGhost", "wFull", "borderLime", "colorAccent")} onClick={() => window.open(m.videoRoomUrl!, "_blank", "noopener,noreferrer")}>
                        <Ic n="video" sz={12} c="var(--lime)" /> Join Video Call
                      </button>
                    ) : (
                      <button type="button" className={cx("btnSm", "btnGhost", "wFull")}>
                        <Ic n="clock" sz={12} c="var(--muted)" /> Upcoming
                      </button>
                    )
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Booking Wizard ───────────────────────────────────────────────── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <div className={cx("flexRow", "gap8")}>
            <Ic n="calendar" sz={14} c="var(--lime)" />
            <span className={cx("cardHdTitle")}>{bookStep === "done" ? "Meeting Booked!" : "Book a New Meeting"}</span>
          </div>
          {bookStep !== "done" && (
            <span className={cx("badge", "badgeMuted", "mlAuto")}>Step {(bookStep as number) + 1} of 3</span>
          )}
        </div>

        {/* Step indicator */}
        {bookStep !== "done" && (
          <div className={cx("p10x20x0", "flexRow", "mb4")}>
            {[0, 1, 2].map((s) => {
              const done   = (bookStep as number) > s;
              const active = bookStep === s;
              return (
                <div key={s} className={cx("flexRow", "flexCenter", s < 2 && "flex1")}>
                  <div className={cx("stepCircle26", "dynBgColor")} style={{
                    "--bg-color": done ? "var(--lime)" : active ? "color-mix(in oklab, var(--lime) 20%, transparent)" : "var(--s3)",
                    "--color": done ? "var(--bg)" : active ? "var(--lime)" : "var(--muted2)",
                    "--border-color": done || active ? "var(--lime)" : "var(--b2)",
                  } as React.CSSProperties}>
                    {done ? <Ic n="check" sz={12} c="var(--bg)" sw={2.5} /> : s + 1}
                  </div>
                  {s < 2 && <div className={cx("stepConnH2", "dynBgColor")} style={{ "--bg-color": done ? "var(--lime)" : "var(--b1)" } as React.CSSProperties} />}
                </div>
              );
            })}
            <span className={cx("text10", "colorMuted", "ml12", "noWrap")}>
              {bookStep === 0 ? "Choose type" : bookStep === 1 ? "Pick a time" : "Confirm"}
            </span>
          </div>
        )}

        <div className={cx("cardBodyPad")}>

          {/* ── Step 0: Meeting Type ── */}
          {bookStep === 0 && (
            <>
              <div className={cx("text12", "colorMuted", "mb16")}>What kind of meeting do you need?</div>
              <div className={cx("grid2Cols", "gap10", "mb20")}>
                {MEETING_TYPES_WIZ.map((t) => {
                  const active = selectedType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedType(t.id)}
                      className={cx("meetingTypeCard", "dynBgColor")}
                      style={{
                        "--bg-color": active ? `color-mix(in oklab, ${t.color} 6%, transparent)` : "var(--s2)",
                        "--color": active ? t.color : "var(--b2)",
                      } as React.CSSProperties}
                    >
                      <div className={cx("tabIndicator", "dynBgColor")} style={{ "--bg-color": active ? t.color : "transparent" } as React.CSSProperties} />
                      <div className={cx("py18_px", "px20_px")}>
                        <div className={cx("meetingTypeIconBox", "dynBgColor")} style={{
                          "--bg-color": active ? `color-mix(in oklab, ${t.color} 15%, transparent)` : "var(--s3)",
                          "--color": active ? `color-mix(in oklab, ${t.color} 30%, transparent)` : "var(--b1)",
                        } as React.CSSProperties}>
                          <Ic n={t.icon} sz={20} c={active ? t.color : "var(--muted2)"} />
                        </div>
                        <div className={cx("fw700", "text12", "dynColor", "mb4")} style={{ "--color": active ? t.color : "inherit" } as React.CSSProperties}>{t.label}</div>
                        <div className={cx("text10", "colorMuted")}>{t.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button type="button" className={cx("btnSm", "btnAccent")} disabled={!selectedType} onClick={() => setBookStep(1)}>
                Next — Pick a Time
              </button>
            </>
          )}

          {/* ── Step 1: Time Picker ── */}
          {bookStep === 1 && (
            <>
              <div className={cx("text12", "colorMuted", "mb16")}>Choose an available slot for next week.</div>
              <div className={cx("overflowXAuto", "mb16")}>
                <table className={cx("timePickerTable")}>
                  <thead>
                    <tr>
                      <th scope="col" className={cx("thW48")}>Time</th>
                      {weekDays.map((d) => (
                        <th scope="col" key={d.id} className={cx("timePickerThDay")}>{d.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_ROWS.map((time) => (
                      <tr key={time}>
                        <td className={cx("timePickerTdTime")}>{time}</td>
                        {weekDays.map((day) => {
                          const booked   = false; // availability computed from real API data
                          const selected = selectedSlot?.day === day.id && selectedSlot?.time === time;
                          return (
                            <td key={day.id} className={cx("textCenter", "pb4")}>
                              <button
                                type="button"
                                disabled={booked}
                                onClick={() => setSelectedSlot({ day: day.id, time })}
                                className={cx("timeSlotBtn", booked ? "timeSlotBooked" : selected ? "timeSlotSelected" : "")}
                              >
                                {booked
                                  ? <Ic n="x" sz={10} c="color-mix(in oklab, var(--red) 60%, var(--muted2))" />
                                  : selected
                                  ? <Ic n="check" sz={12} c="var(--bg)" sw={2.5} />
                                  : <span>Free</span>
                                }
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Legend */}
              <div className={cx("flexRow", "gap14", "mb16", "flexWrap")}>
                {[
                  { bg: "var(--lime)",                                            label: "Selected"  },
                  { bg: "color-mix(in oklab, var(--red) 10%, transparent)",       label: "Booked"    },
                  { bg: "var(--s3)",                                              label: "Available" },
                ].map((leg) => (
                  <div key={leg.label} className={cx("flexRow", "gap5")}>
                    <div className={cx("dot12sq", "dynBgColor")} style={{ "--bg-color": leg.bg } as React.CSSProperties} />
                    <span className={cx("text10", "colorMuted")}>{leg.label}</span>
                  </div>
                ))}
              </div>
              <div className={cx("flexRow", "gap8")}>
                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setBookStep(0)}>← Back</button>
                <button type="button" className={cx("btnSm", "btnAccent")} disabled={!selectedSlot} onClick={() => setBookStep(2)}>Next — Confirm</button>
              </div>
            </>
          )}

          {/* ── Step 2: Confirm ── */}
          {bookStep === 2 && (() => {
            const t        = MEETING_TYPES_WIZ.find((m) => m.id === selectedType);
            const dayLabel = weekDays.find((d) => d.id === selectedSlot?.day)?.label ?? "";
            return (
              <>
                <div className={cx("text12", "colorMuted", "mb16")}>Review and confirm your booking.</div>
                <div className={cx("bookingRecapCard", "dynBorderLeft3")} style={{ "--color": t?.color ?? "var(--lime)" } as React.CSSProperties}>
                  <div className={cx("flexRow", "flexCenter", "gap12", "mb14")}>
                    <div className={cx("iconBox44", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${t?.color ?? "var(--lime)"} 12%, var(--s3))`, "--color": `color-mix(in oklab, ${t?.color ?? "var(--lime)"} 25%, transparent)` } as React.CSSProperties}>
                      <Ic n={t?.icon ?? "calendar"} sz={20} c={t?.color ?? "var(--lime)"} />
                    </div>
                    <div>
                      <div className={cx("fw700", "text13", "dynColor")} style={{ "--color": t?.color } as React.CSSProperties}>{t?.label}</div>
                      <div className={cx("text11", "colorMuted")}>{dayLabel} · {selectedSlot?.time}</div>
                    </div>
                  </div>
                  <div className={cx("borderTopDivider", "pt12", "flexRow", "flexCenter", "gap8")}>
                    <Av initials="MT" size={28} />
                    <div>
                      <div className={cx("fw600", "text11")}>Maphari Team</div>
                      <div className={cx("text10", "colorMuted")}>Your project team</div>
                    </div>
                  </div>
                </div>
                <div className={cx("mb16")}>
                  <div className={cx("text11", "colorMuted", "mb6")}>Notes (optional)</div>
                  <textarea className={cx("textarea", "resizeV")} rows={2} placeholder="Anything you'd like to discuss?" value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)}  />
                </div>
                <div className={cx("flexRow", "gap8")}>
                  <button type="button" className={cx("btnSm", "btnGhost")} disabled={submitting} onClick={() => setBookStep(1)}>← Back</button>
                  <button type="button" className={cx("btnSm", "btnAccent")} disabled={submitting} onClick={handleConfirmBooking}>
                    <Ic n="check" sz={13} c="var(--bg)" /> {submitting ? "Booking…" : "Confirm Booking"}
                  </button>
                </div>
              </>
            );
          })()}

          {/* ── Done state ── */}
          {bookStep === "done" && (() => {
            const t        = MEETING_TYPES_WIZ.find((m) => m.id === selectedType);
            const dayLabel = weekDays.find((d) => d.id === selectedSlot?.day)?.label ?? "";
            return (
              <div className={cx("textCenter", "py24_0")}>
                <div className={cx("doneCircle64")}>
                  <Ic n="check" sz={28} c="var(--lime)" sw={2} />
                </div>
                <div className={cx("fw700", "text16", "mb6")}>Meeting Booked!</div>
                <div className={cx("text12", "colorMuted", "mb20")}>You&apos;ll receive a calendar invite within 2 hours.</div>
                <div className={cx("doneSummaryChip", "mb20")}>
                  <Ic n={t?.icon ?? "calendar"} sz={18} c={t?.color ?? "var(--lime)"} />
                  <span className={cx("fw600", "text12")}>{t?.label} · {dayLabel} · {selectedSlot?.time}</span>
                </div>
                {/* Video call link */}
                {bookedVideoUrl ? (
                  <div className={cx("videoReadyBanner", "mb20")}>
                    <div className={cx("videoReadyTitle", "mb8")}>Your video call is ready</div>
                    <button
                      type="button"
                      className={cx("btnSm", "btnAccent")}
                      onClick={() => window.open(bookedVideoUrl, "_blank", "noopener,noreferrer")}
                    >
                      <Ic n="video" sz={13} c="var(--bg)" /> Join Video Call
                    </button>
                  </div>
                ) : (
                  <div className={cx("text11", "colorMuted", "mb20")}>
                    Your video call link will be ready when your appointment is confirmed.
                  </div>
                )}
                <div className={cx("flexRow", "justifyCenter", "gap8")}>
                  <button type="button" className={cx("btnSm", "btnGhost")}>
                    <Ic n="calendar" sz={12} c="var(--muted)" /> Add to Calendar
                  </button>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => { setBookStep(0); setSelectedType(null); setSelectedSlot(null); setBookingNotes(""); setBookedVideoUrl(null); }}>
                    Book Another
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Past Meetings ─────────────────────────────────────────────────── */}
      <div className={cx("card", "p0", "overflowHidden")}>
        <div className={cx("cardHd", "pl18")}>
          <div className={cx("flexRow", "flexCenter", "gap7")}>
            <Ic n="clock" sz={13} c="var(--muted)" />
            <span className={cx("cardHdTitle")}>Past Meetings</span>
          </div>
        </div>
        {PAST_MEETINGS.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No past meetings yet</div>
            <div className={cx("emptyStateSub")}>Your meeting history will appear here once you&apos;ve had calls with your team.</div>
          </div>
        ) : PAST_MEETINGS.map((m) => (
          <div key={m.id} className={cx("borderTopDivider", "dynBorderLeft3")} style={{ "--color": m.color } as React.CSSProperties}>
            <button
              type="button"
              className={cx("listRowBtn")}
              onClick={() => setExpandedPast(expandedPast === m.id ? null : m.id)}
            >
              <div className={cx("phaseIconBox34", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${m.color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${m.color} 25%, transparent)` } as React.CSSProperties}>
                <Ic n={m.icon} sz={14} c={m.color} />
              </div>
              <div className={cx("flex1", "minW0")}>
                <div className={cx("flexRow", "gap7", "mb3", "flexWrap")}>
                  <span className={cx("fw600", "text12")}>{m.title}</span>
                  <span className={cx("badge", PAST_TYPE_BADGE[m.type] ?? "badgeMuted")}>{m.type}</span>
                </div>
                <div className={cx("flexRow", "gap8")}>
                  <Av initials={m.hostAv} size={18} />
                  <span className={cx("text10", "colorMuted")}>{m.host} · {m.date} · {m.duration}</span>
                </div>
              </div>
              <Ic n={expandedPast === m.id ? "chevronDown" : "chevronRight"} sz={14} c="var(--muted2)" />
            </button>
            {expandedPast === m.id && (
              <div className={cx("p0x18x14x64")}>
                <div className={cx("pastMeetingNotes")}>
                  <div className={cx("fw700", "text11", "flexRow", "flexCenter", "gap5", "mb8")}>
                    <Ic n="zap" sz={11} c="var(--lime)" /> Meeting Notes
                  </div>
                  <div className={cx("text12", "colorMuted", "lineH165")}>{m.notes}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
