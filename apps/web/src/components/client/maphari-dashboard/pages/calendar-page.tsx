"use client";
import { useState, useMemo } from "react";
import { cx, styles } from "../style";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────────── */
type CalTab = "Calendar" | "Upcoming" | "Past";
type EventType = "meeting" | "deadline" | "milestone" | "call";

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  type: EventType;
  time?: string;
  project: string;
  attendees?: string[];
  agenda?: string;
  notes?: string;
  completed?: boolean;
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  initials: string;
  online: boolean;
};

type BookingStep = 1 | 2 | 3;

type Props = { active: boolean };

/* ─────────────────────────────────────────────────────────────────────────────
   Constants & seed data
   ───────────────────────────────────────────────────────────────────────────── */
const ICON_BOX_CLASS: Record<EventType, string> = {
  meeting: styles.eventIconBoxPurple,
  deadline: styles.eventIconBoxRed,
  milestone: styles.eventIconBoxAccent,
  call: styles.eventIconBoxAmber,
};

const EVENT_ICON: Record<EventType, string> = {
  meeting: "\u{1F4C5}",
  deadline: "\u23F0",
  milestone: "\u{1F3C1}",
  call: "\u{1F4DE}",
};

const PILL_CLASS: Record<EventType, string> = {
  meeting: styles.calEventPillMeeting,
  deadline: styles.calEventPillDeadline,
  milestone: styles.calEventPillMilestone,
  call: styles.calEventPillCall,
};

const LEGEND_DOT_CLASS: Record<EventType, string> = {
  meeting: styles.calLegendDotMeeting,
  deadline: styles.calLegendDotDeadline,
  milestone: styles.calLegendDotMilestone,
  call: styles.calLegendDotCall,
};

const BADGE_CLASS: Record<EventType, string> = {
  meeting: styles.badgePurple,
  deadline: styles.badgeRed,
  milestone: styles.badgeGreen,
  call: styles.badgeAmber,
};

const TEAM_MEMBERS: TeamMember[] = [
  { id: "tm-1", name: "Thabo Khumalo", role: "Lead Developer", initials: "TK", online: true },
  { id: "tm-2", name: "Lerato Mokoena", role: "UI/UX Designer", initials: "LM", online: true },
  { id: "tm-3", name: "James Mahlangu", role: "Project Manager", initials: "JM", online: false },
  { id: "tm-4", name: "Nomsa Dlamini", role: "QA Engineer", initials: "ND", online: true },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "13:00", "13:30", "14:00",
  "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];

const UNAVAILABLE_SLOTS = new Set(["08:00", "12:00", "13:00", "15:30"]);

const SEED_EVENTS: CalendarEvent[] = [
  { id: "ev-01", date: "2026-02-02", title: "Sprint Planning — Portal v2", type: "meeting", time: "09:00", project: "Client Portal v2", attendees: ["Thabo K.", "Lerato M.", "James M."], agenda: "Define sprint backlog for v2 milestone 3. Review velocity from last sprint." },
  { id: "ev-02", date: "2026-02-05", title: "Design Review — Dashboard Screens", type: "meeting", time: "10:30", project: "Client Portal v2", attendees: ["Lerato M.", "Nomsa D."], agenda: "Walk through 14 updated Figma screens. Collect feedback." },
  { id: "ev-03", date: "2026-02-07", title: "API Integration Deadline", type: "deadline", time: "17:00", project: "Lead Pipeline", attendees: ["Thabo K."], notes: "All 14 Stripe endpoints must be live on staging by EOD." },
  { id: "ev-04", date: "2026-02-10", title: "Client Onboarding Call — Ngozi Ltd", type: "call", time: "11:00", project: "Automation Suite", attendees: ["James M.", "Nomsa D."], agenda: "Introduce team. Walk through timeline and deliverables." },
  { id: "ev-05", date: "2026-02-12", title: "UAT Sign-off Milestone", type: "milestone", project: "Client Portal v2", attendees: ["Thabo K.", "Lerato M.", "James M.", "Nomsa D."], notes: "7 UAT items must be signed off." },
  { id: "ev-06", date: "2026-02-14", title: "Weekly Status Call", type: "call", time: "14:00", project: "All Projects", attendees: ["James M."], agenda: "Review progress across all active projects." },
  { id: "ev-07", date: "2026-02-17", title: "QA Report Deadline — Sprint 4", type: "deadline", time: "12:00", project: "Client Portal v2", attendees: ["Nomsa D."], notes: "Comprehensive test report due." },
  { id: "ev-08", date: "2026-02-19", title: "Budget Review Meeting", type: "meeting", time: "09:30", project: "All Projects", attendees: ["James M.", "Thabo K."], agenda: "Review Q1 spend vs budget. Forecast Q2 requirements." },
  { id: "ev-09", date: "2026-02-21", title: "Automation Suite — Phase 1 Complete", type: "milestone", project: "Automation Suite", attendees: ["Thabo K.", "Lerato M."], notes: "Phase 1 scope delivered." },
  { id: "ev-10", date: "2026-02-24", title: "Stakeholder Presentation", type: "meeting", time: "15:00", project: "Lead Pipeline", attendees: ["James M.", "Lerato M."], agenda: "Present pipeline rebuild progress to stakeholders." },
  { id: "ev-11", date: "2026-02-27", title: "Invoice Follow-up Call", type: "call", time: "10:00", project: "Client Portal v2", attendees: ["James M."], agenda: "Follow up on INV-011 overdue payment." },
  { id: "ev-12", date: "2026-02-27", title: "Mid-Sprint Check-in", type: "meeting", time: "14:30", project: "Client Portal v2", attendees: ["Thabo K.", "Nomsa D."], agenda: "Review sprint progress. Identify blockers." },
  { id: "ev-13", date: "2026-02-28", title: "Lead Pipeline — Backend Deadline", type: "deadline", time: "17:00", project: "Lead Pipeline", attendees: ["Thabo K."], notes: "Backend API must be complete for milestone 2 payment." },
  { id: "ev-14", date: "2026-03-03", title: "Sprint Retrospective", type: "meeting", time: "09:00", project: "Client Portal v2", attendees: ["Thabo K.", "Lerato M.", "Nomsa D.", "James M."], agenda: "Reflect on sprint. Identify improvements." },
  { id: "ev-15", date: "2026-03-05", title: "Client Portal v2 — Beta Launch", type: "milestone", project: "Client Portal v2", attendees: ["Thabo K.", "Lerato M.", "Nomsa D.", "James M."], notes: "Beta environment goes live for client testing." },
  { id: "ev-16", date: "2026-03-10", title: "Automation Suite — Phase 1 Invoice Due", type: "deadline", time: "17:00", project: "Automation Suite", notes: "INV-009 payment of R8,500 due." },
  { id: "ev-17", date: "2026-03-12", title: "Design System Sync", type: "call", time: "11:30", project: "All Projects", attendees: ["Lerato M."], agenda: "Align component library across all active projects." },
  { id: "ev-18", date: "2026-03-18", title: "Quarterly Business Review", type: "meeting", time: "10:00", project: "All Projects", attendees: ["James M.", "Thabo K.", "Lerato M."], agenda: "Q1 review. Client satisfaction scores. Revenue targets." },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────────────────── */
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatMonthYear(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatShortDate(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
}

function isPast(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDate(dateStr) < today;
}

function isFutureOrToday(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDate(dateStr) >= today;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────────────── */
export function ClientCalendarPage({ active }: Props) {
  /* ── State ───────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<CalTab>("Calendar");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewEvent, setViewEvent] = useState<CalendarEvent | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>(1);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingAgenda, setBookingAgenda] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);

  const today = useMemo(() => new Date(), []);

  /* ── Derived ─────────────────────────────────────── */
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of SEED_EVENTS) {
      const existing = map.get(ev.date) ?? [];
      existing.push(ev);
      map.set(ev.date, existing);
    }
    return map;
  }, []);

  const upcomingEvents = useMemo(
    () => SEED_EVENTS.filter((ev) => isFutureOrToday(ev.date)).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()),
    []
  );

  const pastEvents = useMemo(
    () => SEED_EVENTS.filter((ev) => isPast(ev.date)).sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()),
    []
  );

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return eventsByDate.get(selectedDay) ?? [];
  }, [selectedDay, eventsByDate]);

  /* ── Calendar grid cells ─────────────────────────── */
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const cells: Array<{ date: Date; inMonth: boolean }> = [];

    // Previous month filler days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevDays = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ date: new Date(prevYear, prevMonth, prevDays - i), inMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }

    // Next month filler — pad to complete row (multiple of 7)
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      for (let d = 1; d <= remaining; d++) {
        cells.push({ date: new Date(nextYear, nextMonth, d), inMonth: false });
      }
    }

    return cells;
  }, [currentMonth]);

  /* ── Handlers ────────────────────────────────────── */
  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3200);
  };

  const prevMonth = () => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const goToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(toDateKey(today));
  };

  const openBooking = () => {
    setBookingOpen(true);
    setBookingStep(1);
    setSelectedMember(null);
    setSelectedSlot(null);
    setBookingAgenda("");
  };

  const closeBooking = () => {
    setBookingOpen(false);
  };

  const confirmBooking = () => {
    const member = TEAM_MEMBERS.find((m) => m.id === selectedMember);
    closeBooking();
    showToast("Meeting booked", `${selectedSlot} with ${member?.name ?? "team member"}`);
  };

  const openEventDetail = (ev: CalendarEvent) => {
    setViewEvent(ev);
    setEventNotes(ev.notes ?? "");
  };

  const closeEventDetail = () => {
    setViewEvent(null);
    setEventNotes("");
  };

  const bookingDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  const stepLabels = ["Select Team Member", "Pick Time Slot", "Confirm"] as const;

  /* ── Render ──────────────────────────────────────── */
  return (
    <section className={cx("page", active && "pageActive")} id="page-calendar">

      {/* ── Page header ─────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Work</div>
          <div className={styles.pageTitle}>Calendar</div>
          <p className={styles.pageSub}>
            Meetings, deadlines, milestones and calls — everything that matters, in one view.
          </p>
        </div>
        <div className={styles.headerRight}>
          <span className={cx(styles.badge, styles.badgePurple)}>
            {upcomingEvents.length} upcoming
          </span>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────── */}
      <div className={styles.filterBar} style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {(["Calendar", "Upcoming", "Past"] as CalTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={cx("filterTab", activeTab === tab && "filterTabActive")}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════
         Calendar tab
         ═══════════════════════════════════════════════ */}
      {activeTab === "Calendar" ? (
        <div className={styles.pageBody}>
          {/* Month navigation */}
          <div className={styles.calMonthNav}>
            <div className={styles.calMonthLabel}>{formatMonthYear(currentMonth)}</div>
            <div className={styles.calNavBtns}>
              <button type="button" className={styles.calNavBtn} onClick={goToday}>
                Today
              </button>
              <button type="button" className={styles.calNavBtn} onClick={prevMonth}>
                &#8249;
              </button>
              <button type="button" className={styles.calNavBtn} onClick={nextMonth}>
                &#8250;
              </button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className={styles.calGrid}>
            {/* Day headers */}
            {DAY_NAMES.map((day) => (
              <div key={day} className={styles.calDayHeader}>{day}</div>
            ))}

            {/* Day cells */}
            {calendarCells.map((cell, i) => {
              const key = toDateKey(cell.date);
              const isToday = isSameDay(cell.date, today);
              const isSelected = selectedDay === key;
              const dayEvents = eventsByDate.get(key) ?? [];
              const visibleEvents = dayEvents.slice(0, 2);
              const overflow = dayEvents.length - 2;

              return (
                <button
                  key={`${key}-${i}`}
                  type="button"
                  className={cx(
                    "calCell",
                    isToday && "calCellToday",
                    isSelected && "calDaySelected"
                  )}
                  onClick={() => setSelectedDay(isSelected ? null : key)}
                  style={{ textAlign: "left", cursor: "pointer" }}
                >
                  <div className={cell.inMonth ? styles.calDayNum : cx("calDayNum", "calDayNumOther")}>
                    {cell.date.getDate()}
                  </div>
                  {dayEvents.length > 0 ? (
                    <div className={styles.calDayEvents}>
                      {visibleEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className={cx("calEventPill", PILL_CLASS[ev.type])}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {overflow > 0 ? (
                        <div className={styles.calDayMore}>+{overflow} more</div>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className={styles.calLegendRow}>
            {(["meeting", "deadline", "milestone", "call"] as EventType[]).map((type) => (
              <div key={type} className={styles.calLegendItem}>
                <div className={cx("calLegendDot", LEGEND_DOT_CLASS[type])} />
                <div className={styles.calLegendLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</div>
              </div>
            ))}
          </div>

          {/* Selected day detail panel */}
          {selectedDay ? (
            <div className={styles.calDayDetail}>
              <div className={styles.calDayDetailTitle}>
                {formatShortDate(parseDate(selectedDay))} &mdash; {selectedDayEvents.length === 0 ? "No events" : `${selectedDayEvents.length} event${selectedDayEvents.length > 1 ? "s" : ""}`}
              </div>
              {selectedDayEvents.length === 0 ? (
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                  No events scheduled for this day. Click &ldquo;Upcoming&rdquo; to see all future events.
                </div>
              ) : (
                <div className={styles.upcomingList}>
                  {selectedDayEvents.map((ev, i) => (
                    <button
                      key={ev.id}
                      type="button"
                      className={styles.eventCard}
                      style={{ "--i": i } as React.CSSProperties}
                      onClick={() => openEventDetail(ev)}
                    >
                      <div className={styles.eventDateCol}>
                        <div className={styles.eventDayNum}>{parseDate(ev.date).getDate()}</div>
                        <div className={styles.eventMonthLabel}>{MONTH_NAMES[parseDate(ev.date).getMonth()].slice(0, 3)}</div>
                      </div>
                      <div className={cx("eventIconBox", ICON_BOX_CLASS[ev.type])}>
                        {EVENT_ICON[ev.type]}
                      </div>
                      <div className={styles.eventBody}>
                        <div className={styles.eventTitle}>{ev.title}</div>
                        <div className={styles.eventMetaRow}>
                          <span>{ev.project}</span>
                          {ev.time ? <span>{ev.time}</span> : null}
                          {ev.attendees ? <span>{ev.attendees.length} attendee{ev.attendees.length > 1 ? "s" : ""}</span> : null}
                        </div>
                      </div>
                      <div className={styles.eventActionsCol}>
                        <span className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}>View</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════════
         Upcoming tab
         ═══════════════════════════════════════════════ */}
      {activeTab === "Upcoming" ? (
        <div className={styles.pageBody}>
          {/* Header actions row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div className={styles.sectionTitle}>
              Upcoming Events ({upcomingEvents.length})
            </div>
            <button
              type="button"
              className={cx(styles.button, styles.buttonAccent)}
              onClick={openBooking}
            >
              Book Meeting
            </button>
          </div>

          <div className={styles.upcomingList}>
            {upcomingEvents.map((ev, i) => {
              const d = parseDate(ev.date);
              return (
                <button
                  key={ev.id}
                  type="button"
                  className={styles.eventCard}
                  style={{ "--i": i } as React.CSSProperties}
                  onClick={() => openEventDetail(ev)}
                >
                  <div className={styles.eventDateCol}>
                    <div className={styles.eventDayNum}>{d.getDate()}</div>
                    <div className={styles.eventMonthLabel}>{MONTH_NAMES[d.getMonth()].slice(0, 3)}</div>
                  </div>
                  <div className={cx("eventIconBox", ICON_BOX_CLASS[ev.type])}>
                    {EVENT_ICON[ev.type]}
                  </div>
                  <div className={styles.eventBody}>
                    <div className={styles.eventTitle}>{ev.title}</div>
                    <div className={styles.eventMetaRow}>
                      <span>{ev.project}</span>
                      {ev.time ? <span>{ev.time}</span> : null}
                      {ev.attendees ? <span>{ev.attendees.length} attendee{ev.attendees.length > 1 ? "s" : ""}</span> : null}
                    </div>
                    <div className={styles.eventTagsRow}>
                      <span className={cx(styles.badge, BADGE_CLASS[ev.type])}>
                        {ev.type}
                      </span>
                    </div>
                  </div>
                  <div className={styles.eventActionsCol}>
                    <span className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}>View</span>
                    {ev.type === "meeting" || ev.type === "call" ? (
                      <span
                        className={cx(styles.button, styles.buttonAccent, styles.buttonSm)}
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast("Joining call", ev.title);
                        }}
                      >
                        Join
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════════
         Past tab
         ═══════════════════════════════════════════════ */}
      {activeTab === "Past" ? (
        <div className={styles.pageBody}>
          <div className={styles.sectionTitle} style={{ marginBottom: 20 }}>
            Past Events ({pastEvents.length})
          </div>

          {pastEvents.length === 0 ? (
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", padding: "32px 0", textAlign: "center" }}>
              No past events found.
            </div>
          ) : (
            <div className={styles.upcomingList}>
              {pastEvents.map((ev, i) => {
                const d = parseDate(ev.date);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    className={styles.eventCard}
                    style={{ "--i": i, opacity: 0.7 } as React.CSSProperties}
                    onClick={() => openEventDetail(ev)}
                  >
                    <div className={styles.eventDateCol}>
                      <div className={styles.eventDayNum}>{d.getDate()}</div>
                      <div className={styles.eventMonthLabel}>{MONTH_NAMES[d.getMonth()].slice(0, 3)}</div>
                    </div>
                    <div className={cx("eventIconBox", ICON_BOX_CLASS[ev.type])}>
                      {EVENT_ICON[ev.type]}
                    </div>
                    <div className={styles.eventBody}>
                      <div className={styles.eventTitle}>{ev.title}</div>
                      <div className={styles.eventMetaRow}>
                        <span>{ev.project}</span>
                        {ev.time ? <span>{ev.time}</span> : null}
                        {ev.attendees ? <span>{ev.attendees.length} attendee{ev.attendees.length > 1 ? "s" : ""}</span> : null}
                      </div>
                      <div className={styles.eventTagsRow}>
                        <span className={cx(styles.badge, BADGE_CLASS[ev.type])}>
                          {ev.type}
                        </span>
                        <span className={cx(styles.badge, styles.badgeMuted)}>completed</span>
                      </div>
                    </div>
                    <div className={styles.eventActionsCol}>
                      <span className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}>View Notes</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════════
         Book Meeting Modal (3 steps)
         ═══════════════════════════════════════════════ */}
      {bookingOpen ? (
        <div className={styles.overlay} onClick={closeBooking}>
          <div className={styles.modal} style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>Book a Meeting</div>
                <div style={{ fontSize: "0.64rem", color: "var(--muted)", marginTop: 4 }}>
                  {stepLabels[bookingStep - 1]}
                </div>
              </div>
              <button type="button" className={styles.modalClose} onClick={closeBooking}>
                &times;
              </button>
            </div>

            {/* Step progress bar */}
            <div className={styles.payStepBar}>
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={styles.payStepSeg}
                  style={{ background: step <= bookingStep ? "var(--accent)" : "var(--border)" }}
                />
              ))}
            </div>

            {/* Step label */}
            <div className={styles.bookingStepLabel}>
              Step {bookingStep} of 3
            </div>

            {/* ── Step 1: Select Team Member ────────── */}
            {bookingStep === 1 ? (
              <div style={{ padding: "0 24px 24px" }}>
                <div className={styles.formChipGrid2}>
                  {TEAM_MEMBERS.map((member) => {
                    const selected = selectedMember === member.id;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        className={cx("formChipBtn", selected && "formChipBtnSelected")}
                        onClick={() => setSelectedMember(member.id)}
                        style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 6, padding: 14 }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%", background: "var(--s3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.58rem", fontWeight: 800, color: selected ? "var(--accent)" : "var(--muted)",
                            border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                            flexShrink: 0,
                          }}>
                            {member.initials}
                          </div>
                          <div>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700 }}>{member.name}</div>
                            <div style={{ fontSize: "0.58rem", color: "var(--muted)" }}>{member.role}</div>
                          </div>
                        </div>
                        <div className={styles.memberStatusRow}>
                          <div className={cx(
                            "memberStatusDot",
                            member.online ? "memberStatusDotOnline" : "memberStatusDotOffline"
                          )} />
                          <span style={{ fontSize: "0.56rem", color: "var(--muted)" }}>
                            {member.online ? "Online" : "Offline"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className={styles.formFooter} style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    className={cx(styles.button, styles.buttonAccent)}
                    disabled={!selectedMember}
                    onClick={() => setBookingStep(2)}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}

            {/* ── Step 2: Pick Time Slot ─────────────── */}
            {bookingStep === 2 ? (
              <div style={{ padding: "0 24px 24px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: 14 }}>
                  {formatShortDate(bookingDate)} &mdash; Available time slots
                </div>

                <div className={styles.formChipGrid4}>
                  {TIME_SLOTS.map((slot) => {
                    const unavailable = UNAVAILABLE_SLOTS.has(slot);
                    const selected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        className={cx(
                          "formChipBtn",
                          selected && "formChipBtnSelected",
                          unavailable && "formChipBtnUnavailable"
                        )}
                        onClick={() => {
                          if (!unavailable) setSelectedSlot(slot);
                        }}
                        style={{ textAlign: "center" }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                <div className={styles.formFooter} style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    className={cx(styles.button, styles.buttonGhost)}
                    onClick={() => setBookingStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className={cx(styles.button, styles.buttonAccent)}
                    disabled={!selectedSlot}
                    onClick={() => setBookingStep(3)}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}

            {/* ── Step 3: Confirm ────────────────────── */}
            {bookingStep === 3 ? (
              <div style={{ padding: "0 24px 24px" }}>
                {/* Summary card */}
                <div className={styles.card} style={{ marginBottom: 18 }}>
                  <div className={styles.cardBody}>
                    <div className={styles.eventDetailRow}>
                      <div className={styles.eventDetailLabel}>With</div>
                      <div>{TEAM_MEMBERS.find((m) => m.id === selectedMember)?.name ?? "---"}</div>
                    </div>
                    <div className={styles.eventDetailRow}>
                      <div className={styles.eventDetailLabel}>Date</div>
                      <div>{formatShortDate(bookingDate)}</div>
                    </div>
                    <div className={styles.eventDetailRow}>
                      <div className={styles.eventDetailLabel}>Time</div>
                      <div>{selectedSlot ?? "---"}</div>
                    </div>
                    <div className={styles.eventDetailRow}>
                      <div className={styles.eventDetailLabel}>Type</div>
                      <span className={cx(styles.badge, styles.badgePurple)}>meeting</span>
                    </div>
                  </div>
                </div>

                {/* Agenda textarea */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Agenda (optional)</label>
                  <textarea
                    className={styles.eventNotes}
                    placeholder="Describe the agenda for this meeting..."
                    value={bookingAgenda}
                    onChange={(e) => setBookingAgenda(e.target.value)}
                  />
                </div>

                <div className={styles.formFooter} style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    className={cx(styles.button, styles.buttonGhost)}
                    onClick={() => setBookingStep(2)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className={cx(styles.button, styles.buttonAccent)}
                    onClick={confirmBooking}
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════════
         Event Detail Modal
         ═══════════════════════════════════════════════ */}
      {viewEvent ? (
        <div className={styles.overlay} onClick={closeEventDetail}>
          <div className={styles.modal} style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div style={{ flex: 1 }}>
                <div className={styles.modalTitle}>{viewEvent.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <span className={cx(styles.badge, BADGE_CLASS[viewEvent.type])}>
                    {viewEvent.type}
                  </span>
                  {isPast(viewEvent.date) ? (
                    <span className={cx(styles.badge, styles.badgeMuted)}>completed</span>
                  ) : null}
                </div>
              </div>
              <button type="button" className={styles.modalClose} onClick={closeEventDetail}>
                &times;
              </button>
            </div>

            {/* Detail rows */}
            <div style={{ padding: "0 4px" }}>
              <div className={styles.eventDetailRow}>
                <div className={styles.eventDetailLabel}>Project</div>
                <div>{viewEvent.project}</div>
              </div>

              <div className={styles.eventDetailRow}>
                <div className={styles.eventDetailLabel}>Date</div>
                <div>{formatShortDate(parseDate(viewEvent.date))}</div>
              </div>

              {viewEvent.time ? (
                <div className={styles.eventDetailRow}>
                  <div className={styles.eventDetailLabel}>Time</div>
                  <div>{viewEvent.time}</div>
                </div>
              ) : null}

              {viewEvent.attendees && viewEvent.attendees.length > 0 ? (
                <div className={styles.eventDetailRow} style={{ alignItems: "flex-start" }}>
                  <div className={styles.eventDetailLabel} style={{ paddingTop: 3 }}>Attendees</div>
                  <div className={styles.attendeeList}>
                    {viewEvent.attendees.map((name) => (
                      <span key={name} className={styles.attendeeChip}>{name}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              {viewEvent.agenda ? (
                <div className={styles.eventDetailRow} style={{ alignItems: "flex-start" }}>
                  <div className={styles.eventDetailLabel} style={{ paddingTop: 2 }}>Agenda</div>
                  <div style={{ fontSize: "0.72rem", lineHeight: 1.6, color: "var(--muted)" }}>
                    {viewEvent.agenda}
                  </div>
                </div>
              ) : null}

              {/* Notes section */}
              <div style={{ marginTop: 18, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {isPast(viewEvent.date) ? "Post-Meeting Notes" : "Notes"}
                  </label>
                  <textarea
                    className={styles.eventNotes}
                    placeholder={isPast(viewEvent.date) ? "Add your post-meeting notes here..." : "Add notes for this event..."}
                    value={eventNotes}
                    onChange={(e) => setEventNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className={styles.formFooter} style={{ marginTop: 16 }}>
              <button
                type="button"
                className={cx(styles.button, styles.buttonGhost)}
                onClick={closeEventDetail}
              >
                Close
              </button>
              {eventNotes.trim() ? (
                <button
                  type="button"
                  className={cx(styles.button, styles.buttonAccent)}
                  onClick={() => {
                    closeEventDetail();
                    showToast("Notes saved", viewEvent.title);
                  }}
                >
                  Save Notes
                </button>
              ) : null}
              {!isPast(viewEvent.date) && (viewEvent.type === "meeting" || viewEvent.type === "call") ? (
                <button
                  type="button"
                  className={cx(styles.button, styles.buttonAccent)}
                  onClick={() => {
                    closeEventDetail();
                    showToast("Joining call", viewEvent.title);
                  }}
                >
                  Join Call
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Toast ───────────────────────────────────── */}
      {toast ? (
        <div style={{
          position: "fixed", bottom: 28, right: 28, background: "var(--surface)",
          border: "1px solid var(--accent)", padding: "14px 20px", zIndex: 200,
          display: "flex", alignItems: "center", gap: 12,
          animation: "slideUp var(--dur-normal, 250ms) var(--ease-out, cubic-bezier(0.23,1,0.32,1))"
        }}>
          <div style={{
            width: 24, height: 24, background: "var(--accent)", color: "var(--on-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.7rem", fontWeight: 700, flexShrink: 0, borderRadius: "50%"
          }}>
            &#10003;
          </div>
          <div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}

    </section>
  );
}
