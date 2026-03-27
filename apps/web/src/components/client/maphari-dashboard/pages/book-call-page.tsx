// ════════════════════════════════════════════════════════════════════════════
// book-call-page.tsx — Client Meeting Command Centre
// Data     : loadPortalAppointmentsWithRefresh → GET /appointments
//            createPortalAppointmentWithRefresh → POST /appointments
// Mobile   : Meeting cards stack to 1-col; booking wizard stacks
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalAppointmentsWithRefresh,
  loadPortalAvailabilityWithRefresh,
  bookPortalAvailabilitySlotWithRefresh,
  loadPortalMeetingsWithRefresh,
  type PortalAppointment,
  type PortalAvailabilitySlot,
  type PortalMeeting,
} from "../../../../lib/api/portal";
import {
  loadPortalCalendarEventsWithRefresh,
  type PortalCalendarEvent,
} from "../../../../lib/api/portal/meetings";
import { saveSession } from "../../../../lib/auth/session";
import { createInstantVideoRoomWithRefresh, type InstantVideoRoom } from "../../../../lib/api/portal/video";
import {
  createPortalConversationWithRefresh,
  createPortalMessageWithRefresh,
} from "../../../../lib/api/portal/messages";
import type { Thread as WorkspaceThread } from "../types";

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
    scheduledAt: a.scheduledAt,
    title: a.notes ?? uiType,
    type: uiType,
    host: a.ownerName ?? "Team",
    hostAv: toInitials(a.ownerName),
    date: fmtApptDate(a.scheduledAt),
    isLive: isLiveNow(a.scheduledAt, a.durationMins),
    videoRoomUrl: a.videoRoomUrl ?? null,
  };
}

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
  // Offset to next Monday (always next week, so all slots are in the future)
  const daysToNextMon = dow === 0 ? 1 : 8 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToNextMon);
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

function buildGoogleCalendarUrl(appt: PortalAppointment): string {
  const start = new Date(appt.scheduledAt);
  const end   = new Date(start.getTime() + appt.durationMins * 60_000);
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    text:    `Meeting with ${appt.ownerName ?? "Maphari"}`,
    dates:   `${fmt(start)}/${fmt(end)}`,
    details: appt.notes ?? "",
    sf:      "true",
    output:  "xml",
  });
  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
}

type BookStep = 0 | 1 | 2 | "done";
type CallStage = "prejoin" | "live" | "wrap";
type CallWorkspaceTab = "notes" | "agenda" | "files" | "actions" | "chat";

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function BookCallPage({ onSnapshotRefresh, onJoinCall, threads = [] }: { onSnapshotRefresh?: () => void; onJoinCall?: (url: string) => void; threads?: WorkspaceThread[] } = {}) {
  const [callActive,     setCallActive]     = useState(false);
  const [callStage,      setCallStage]      = useState<CallStage>("prejoin");
  const [micOn,          setMicOn]          = useState(true);
  const [cameraOn,       setCameraOn]       = useState(true);
  const [sharing,        setSharing]        = useState(false);
  const [callNotes,      setCallNotes]      = useState("");
  const [callSeconds,    setCallSeconds]    = useState(0);
  const [activeCallTitle, setActiveCallTitle] = useState<string | null>(null);
  const [activeCallJoinUrl, setActiveCallJoinUrl] = useState<string | null>(null);
  const [callWorkspaceTab, setCallWorkspaceTab] = useState<CallWorkspaceTab>("notes");
  const [recordingOn,    setRecordingOn]    = useState(false);
  const [connectionState, setConnectionState] = useState<"Checking devices" | "Connected" | "Reconnecting">("Checking devices");
  const [joinMuted,      setJoinMuted]      = useState(false);
  const [joinCameraOff,  setJoinCameraOff]  = useState(false);
  const [selectedMic,    setSelectedMic]    = useState("Default microphone");
  const [selectedCamera, setSelectedCamera] = useState("FaceTime HD Camera");
  const [selectedSpeaker, setSelectedSpeaker] = useState("MacBook Speakers");
  const [callChatInput,  setCallChatInput]  = useState("");
  const [callChat,       setCallChat]       = useState<Array<{ id: string; author: string; role: string; message: string }>>([
    { id: "intro", author: "Maphari Team", role: "Host", message: "We’ll keep notes and follow-ups on the right while the call is in progress." },
  ]);
  const [callActionDraft, setCallActionDraft] = useState("");
  const [callActionItems, setCallActionItems] = useState<Array<{ id: string; text: string; done: boolean }>>([
    { id: "prep-1", text: "Confirm current priorities for the next delivery cycle", done: false },
    { id: "prep-2", text: "Capture any blockers that need follow-up after the call", done: false },
  ]);
  const [followUpSummary, setFollowUpSummary] = useState("");
  const [wrapupSaved,     setWrapupSaved]     = useState(false);

  const [bookStep,         setBookStep]         = useState<BookStep>(0);
  const [selectedType,     setSelectedType]     = useState<string | null>(null);
  const [selectedSlot,     setSelectedSlot]     = useState<{ slotId: string; day: string; time: string; startsAt: string; endsAt: string } | null>(null);
  const [selectedBookingDay, setSelectedBookingDay] = useState<string | null>(null);
  const [bookingNotes,     setBookingNotes]     = useState("");
  const [bookedVideoUrl,   setBookedVideoUrl]   = useState<string | null>(null);

  const [expandedPast, setExpandedPast] = useState<string | null>(null);

  useEffect(() => {
    if (!callActive || callStage !== "live") { setCallSeconds(0); return; }
    const id = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [callActive, callStage]);

  useEffect(() => {
    if (!callActive) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeCallExperience(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callActive]);

  // ── API state ──────────────────────────────────────────────────────────────
  const { session, projectId } = useProjectLayer();
  const [allAppts,      setAllAppts]      = useState<PortalAppointment[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<PortalAvailabilitySlot[]>([]);
  const [upcomingStrip, setUpcomingStrip] = useState<ReturnType<typeof mapApptToStrip>[]>([]);
  const [submitting,    setSubmitting]    = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [instantRoom, setInstantRoom] = useState<InstantVideoRoom | null>(() => {
    try {
      const stored = sessionStorage.getItem("instantRoom");
      if (!stored) return null;
      const parsed = JSON.parse(stored) as InstantVideoRoom;
      // Discard if already expired
      if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
        sessionStorage.removeItem("instantRoom");
        return null;
      }
      return parsed;
    } catch { return null; }
  });

  // Persisted conversation ID so all instant calls post into the same thread
  // Use localStorage (not sessionStorage) so the ID survives tab close / refresh
  const instantConvIdRef = useRef<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("instantCallConvId") : null
  );
  const [instantLoading,     setInstantLoading]     = useState(false);
  const [instantError,       setInstantError]       = useState<string | null>(null);
  const [meetings,           setMeetings]           = useState<PortalMeeting[] | null>(null);
  const [calendarEvents,     setCalendarEvents]     = useState<PortalCalendarEvent[]>([]);
  const [calendarLoading,    setCalendarLoading]    = useState(false);
  const [bookedAppt,         setBookedAppt]         = useState<PortalAppointment | null>(null);

  // ── Persist instant room to sessionStorage so it survives page refresh ────
  useEffect(() => {
    if (instantRoom) sessionStorage.setItem("instantRoom", JSON.stringify(instantRoom));
    else sessionStorage.removeItem("instantRoom");
  }, [instantRoom]);

  // ── Current week (computed once per mount) ────────────────────────────────
  const weekDays = useMemo(() => getCurrentWeekDays(), []);

  useEffect(() => {
    async function loadInitialSchedulingData(): Promise<void> {
      if (!session) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [apptRes, meetRes, availRes] = await Promise.all([
          loadPortalAppointmentsWithRefresh(session),
          loadPortalMeetingsWithRefresh(session),
          loadPortalAvailabilityWithRefresh(session),
        ]);
        if (apptRes.nextSession) saveSession(apptRes.nextSession);
        if (meetRes.nextSession) saveSession(meetRes.nextSession);
        if (availRes.nextSession) saveSession(availRes.nextSession);
        if (apptRes.error) {
          setError("We couldn't connect to the scheduling service. Please try again later.");
          return;
        }
        if (availRes.error) {
          setError("We couldn't load live meeting availability right now. Please try again later.");
          return;
        }
        if (apptRes.data) {
          setAllAppts(apptRes.data);
          const now = Date.now();
          const upcoming = apptRes.data
            .filter((a) => new Date(a.scheduledAt).getTime() + a.durationMins * 60_000 > now)
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
            .slice(0, 6)
            .map(mapApptToStrip);
          setUpcomingStrip(upcoming);
        }
        if (meetRes.data) {
          setMeetings([...meetRes.data].sort((a, b) => new Date(b.meetingAt).getTime() - new Date(a.meetingAt).getTime()));
        }
        setAvailabilitySlots(availRes.data ?? []);
      } catch {
        setError("We couldn't connect to the scheduling service. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    void loadInitialSchedulingData();
  }, [session]);

  // ── Load calendar events (next 30 days) ──────────────────────────────────
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setCalendarLoading(true);
    const from = new Date().toISOString();
    const to   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    loadPortalCalendarEventsWithRefresh(session, from, to).then((res) => {
      if (cancelled) return;
      if (res.nextSession) saveSession(res.nextSession);
      setCalendarEvents(res.data ?? []);
    }).finally(() => { if (!cancelled) setCalendarLoading(false); });
    return () => { cancelled = true; };
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

  const pendingActionItems = useMemo(
    () => meetings?.filter((m) => m.actionItemStatus === "PENDING").length ?? 0,
    [meetings]
  );

  const nextApptRaw = useMemo(
    () => allAppts
      .filter((a) => new Date(a.scheduledAt).getTime() + a.durationMins * 60_000 > Date.now())
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ?? null,
    [allAppts]
  );

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

  const activeSpeaker = callParticipants[0];
  const sideParticipants = callParticipants.slice(1);
  const callTitle = activeCallTitle ?? nextMeeting?.title ?? "Client Meeting";
  const callAgenda = useMemo(() => {
    const meetingType = selectedType ? MEETING_TYPES_WIZ.find((item) => item.id === selectedType)?.label : nextMeeting?.type;
    return [
      "Align on current priorities and urgent blockers",
      meetingType ? "Review context for this " + meetingType.toLowerCase() : "Review the current meeting scope",
      "Capture action items and next owners before leaving the call",
    ];
  }, [nextMeeting?.type, selectedType]);
  const callFiles = useMemo(() => {
    return [
      { id: "brief", label: "Meeting brief", meta: nextMeeting?.date ?? "Current session context" },
      { id: "notes", label: "Shared notes", meta: callNotes.trim() ? "Updated in this session" : "Ready for live note-taking" },
    ];
  }, [callNotes, nextMeeting?.date]);

  function openCallExperience(context?: { title?: string | null; joinUrl?: string | null }): void {
    setJoinMuted(false);
    setJoinCameraOff(false);
    setSelectedMic("Default microphone");
    setSelectedCamera("FaceTime HD Camera");
    setSelectedSpeaker("MacBook Speakers");
    setCallWorkspaceTab("notes");
    setConnectionState("Checking devices");
    setCallStage("prejoin");
    setActiveCallTitle(context?.title ?? nextMeeting?.title ?? "Client Meeting");
    setActiveCallJoinUrl(context?.joinUrl ?? nextMeeting?.videoRoomUrl ?? null);
    setCallActive(true);
    setWrapupSaved(false);
  }

  function joinCallExperience(): void {
    setMicOn(!joinMuted);
    setCameraOn(!joinCameraOff);
    setConnectionState("Connected");
    setCallStage("live");
  }

  function leaveCallExperience(): void {
    setCallStage("wrap");
    setConnectionState("Connected");
  }

  function closeCallExperience(): void {
    setCallActive(false);
    setCallStage("prejoin");
    setRecordingOn(false);
    setSharing(false);
    setCallWorkspaceTab("notes");
    setCallSeconds(0);
    setConnectionState("Checking devices");
    setActiveCallTitle(null);
    setActiveCallJoinUrl(null);
  }

  function handleSendChatMessage(): void {
    const message = callChatInput.trim();
    if (!message) return;
    setCallChat((prev) => [...prev, { id: "msg-" + Date.now(), author: "You", role: "Client", message }]);
    setCallChatInput("");
  }

  function addCallActionItem(): void {
    const text = callActionDraft.trim();
    if (!text) return;
    setCallActionItems((prev) => [...prev, { id: "ai-" + Date.now(), text, done: false }]);
    setCallActionDraft("");
  }

  // ── Confirm booking handler ───────────────────────────────────────────────
  async function handleConfirmBooking() {
    if (!session || !selectedType || !selectedSlot) return;
    setSubmitting(true);
    const meetingLabel = MEETING_TYPES_WIZ.find((item) => item.id === selectedType)?.label ?? "Client Call";
    const topic = bookingNotes.trim() || meetingLabel;
    const r = await bookPortalAvailabilitySlotWithRefresh(session, {
      slotId: selectedSlot.slotId,
      topic,
      ...(projectId ? { projectId } : {}),
    });

    setSubmitting(false);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error || !r.data) return; // silent fail — wizard stays open so user can retry

    // Capture video URL and appointment from newly created booking
    setBookedVideoUrl(r.data.videoRoomUrl ?? null);
    setBookedAppt(r.data.appointment);

    setAllAppts((prev) => {
      const next = [...prev, r.data.appointment].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      const now = Date.now();
      setUpcomingStrip(
        next
          .filter((a) => new Date(a.scheduledAt).getTime() + a.durationMins * 60_000 > now)
          .slice(0, 6)
          .map(mapApptToStrip)
      );
      return next;
    });
    setAvailabilitySlots((prev) => prev.filter((slot) => slot.id !== selectedSlot.slotId));
    onSnapshotRefresh?.();
    setBookStep("done");
  }

  async function handleRefresh(): Promise<void> {
    if (!session) return;
    setRefreshing(true);
    setError(null);
    try {
      const [apptRes, meetRes, availRes] = await Promise.all([
        loadPortalAppointmentsWithRefresh(session),
        loadPortalMeetingsWithRefresh(session),
        loadPortalAvailabilityWithRefresh(session),
      ]);
      if (apptRes.nextSession) saveSession(apptRes.nextSession);
      if (meetRes.nextSession) saveSession(meetRes.nextSession);
      if (availRes.nextSession) saveSession(availRes.nextSession);
      if (apptRes.error) {
        setError("We couldn't connect to the scheduling service. Please try again later.");
        return;
      }
      if (availRes.error) {
        setError("We couldn't load live meeting availability right now. Please try again later.");
        return;
      }
      if (apptRes.data) {
        setAllAppts(apptRes.data);
        const now = Date.now();
        const upcoming = apptRes.data
          .filter((a) => new Date(a.scheduledAt).getTime() + a.durationMins * 60_000 > now)
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
          .slice(0, 6)
          .map(mapApptToStrip);
        setUpcomingStrip(upcoming);
      }
      if (meetRes.data) {
        setMeetings([...meetRes.data].sort((a, b) => new Date(b.meetingAt).getTime() - new Date(a.meetingAt).getTime()));
      }
      setAvailabilitySlots(availRes.data ?? []);
    } catch {
      setError("We couldn't connect to the scheduling service. Please try again later.");
    } finally {
      setRefreshing(false);
    }
  }

  function handleExportCsv(): void {
    const rows = [
      ["section", "id", "title", "type", "date", "duration_mins", "status", "owner", "notes"],
      ...allAppts.map((appt) => [
        "appointment",
        appt.id,
        appt.notes ?? apptTypeToUi(appt.type),
        appt.type,
        appt.scheduledAt,
        String(appt.durationMins),
        appt.status,
        appt.ownerName ?? "",
        (appt.notes ?? "").replace(/\s+/g, " ").trim(),
      ]),
      ...((meetings ?? []).map((meeting) => [
        "meeting",
        meeting.id,
        meeting.title,
        "MEETING",
        meeting.meetingAt,
        String(meeting.durationMins),
        meeting.actionItemStatus,
        "",
        (meeting.notes ?? "").replace(/\s+/g, " ").trim(),
      ])),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, "\"\"")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "book-call-schedule.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const availableSlotsByKey = useMemo(() => {
    const map = new Map<string, PortalAvailabilitySlot>();
    availabilitySlots.forEach((slot) => {
      const start = new Date(slot.startsAt);
      const day = weekDays.find((weekDay) => weekDay.date.toDateString() === start.toDateString());
      if (!day) return;
      const time = start.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
      map.set(day.id + "|" + time, slot);
    });
    return map;
  }, [availabilitySlots, weekDays]);

  const availableDays = useMemo(() => {
    return weekDays
      .map((day) => {
        const slots = availabilitySlots
          .filter((slot) => {
            const start = new Date(slot.startsAt);
            return start.toDateString() === day.date.toDateString();
          })
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
          .map((slot) => {
            const start = new Date(slot.startsAt);
            const end = new Date(slot.endsAt);
            const label = start.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
            const duration = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60_000));
            return { slot, label, duration };
          });
        return {
          ...day,
          slots,
        };
      })
      .filter((day) => day.slots.length > 0);
  }, [availabilitySlots, weekDays]);

  useEffect(() => {
    if (bookStep !== 1) return;
    if (!availableDays.length) {
      setSelectedBookingDay(null);
      return;
    }
    if (!selectedBookingDay || !availableDays.some((day) => day.id === selectedBookingDay)) {
      setSelectedBookingDay(availableDays[0]?.id ?? null);
    }
  }, [availableDays, bookStep, selectedBookingDay]);

  async function handleInstantCall(): Promise<void> {
    if (!session || instantLoading) return;
    setInstantLoading(true);
    setInstantError(null);
    setInstantRoom(null);
    try {
      const result = await createInstantVideoRoomWithRefresh(session);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setInstantError(result.error.message ?? "Failed to create video room.");
        return;
      }
      if (result.data) {
        setInstantRoom(result.data);
        // Fire-and-forget — post the link to the client's Messages inbox
        void postInstantCallToInbox(result.data);
      }
    } finally {
      setInstantLoading(false);
    }
  }

  async function postInstantCallToInbox(room: InstantVideoRoom): Promise<void> {
    if (!session) return;
    const timeLabel = new Date().toLocaleTimeString("en-ZA", {
      hour: "2-digit", minute: "2-digit",
    });
    const dateLabel = new Date().toLocaleString("en-ZA", {
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit",
    });

    // Reuse the same conversation thread for all instant calls
    // Priority: in-memory ref → localStorage → existing thread in snapshot → create new
    let convId = instantConvIdRef.current;
    if (!convId) {
      // Check if an "Instant Calls" thread already exists in the snapshot
      // Also match older threads that start with "Instant Call"
      const existing = threads.find((t) => t.subject === "Instant Calls" || t.subject.startsWith("Instant Call"));
      if (existing) {
        convId = existing.id;
      } else {
        const convRes = await createPortalConversationWithRefresh(session, {
          subject: "Instant Calls",
        });
        if (convRes.nextSession) saveSession(convRes.nextSession);
        if (!convRes.data) return;
        convId = convRes.data.id;
      }
      instantConvIdRef.current = convId;
      localStorage.setItem("instantCallConvId", convId);
    }

    // Post structured call-room card message (CALL_ROOM:: prefix triggers rich rendering)
    await createPortalMessageWithRefresh(session, {
      conversationId: convId,
      content: `CALL_ROOM::${room.joinUrl}::${room.expiresAt}::${timeLabel} · ${dateLabel.split(",")[0] ?? dateLabel}`,
    });

    // Trigger a snapshot refresh so the new thread appears in Messages inbox immediately
    onSnapshotRefresh?.();
  }

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
  if (!session) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>Sign in to manage meetings</div>
          <div className={cx("emptyStateSub")}>Your upcoming calls, meeting history, and booking options appear once your client session is active.</div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}><Ic n="alert" sz={24} /></div>
          <div className={cx("errorStateTitle")}>Scheduling unavailable</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
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
        <div className={cx("fullscreenDark", "callExperienceShell")}>
          {callStage === "prejoin" && (
            <div className={cx("callPrejoinWrap")}>
              <div className={cx("callPrejoinCard")}>
                <div className={cx("flexBetween", "gap12", "mb16")}>
                  <div>
                    <div className={cx("pageEyebrow")}>Pre-Join Check</div>
                    <div className={cx("fw800", "text18", "mt4")}>{callTitle}</div>
                    <div className={cx("text12", "colorMuted", "mt6")}>Check devices, confirm your setup, and join when you are ready.</div>
                  </div>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={closeCallExperience}>Close</button>
                </div>
                <div className={cx("grid2Cols", "gap12")}>
                  <div className={cx("card", "callPrejoinPreview")}>
                    <div className={cx("callPreviewStage")}>
                      <div className={cx("callAvCircle", "callPreviewAvatar", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, var(--purple) 16%, #131822)", "--color": "var(--purple)" } as React.CSSProperties}>
                        {callParticipants[1]?.av ?? "YO"}
                      </div>
                      <div className={cx("textCenter")}>
                        <div className={cx("fw700", "text13")}>Camera preview</div>
                        <div className={cx("text11", "colorMuted", "mt4")}>{joinCameraOff ? "Camera will join off" : "You are ready to join on camera"}</div>
                      </div>
                    </div>
                    <div className={cx("callPreviewToggleRow")}>
                      <button type="button" className={cx("btnSm", joinMuted ? "btnGhost" : "btnAccent")} onClick={() => setJoinMuted((v) => !v)}>
                        <Ic n="mic" sz={12} /> {joinMuted ? "Join muted" : "Mic on"}
                      </button>
                      <button type="button" className={cx("btnSm", joinCameraOff ? "btnGhost" : "btnAccent")} onClick={() => setJoinCameraOff((v) => !v)}>
                        <Ic n="camera" sz={12} /> {joinCameraOff ? "Camera off" : "Camera on"}
                      </button>
                    </div>
                  </div>
                  <div className={cx("card")}>
                    <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Device Check</span></div>
                    <div className={cx("cardBodyPad", "flexCol", "gap12")}>
                      <label className={cx("flexCol", "gap6")}>
                        <span className={cx("text11", "colorMuted")}>Microphone</span>
                        <select className={cx("input")} value={selectedMic} onChange={(e) => setSelectedMic(e.target.value)}>
                          <option>Default microphone</option>
                          <option>AirPods microphone</option>
                          <option>USB conference mic</option>
                        </select>
                      </label>
                      <label className={cx("flexCol", "gap6")}>
                        <span className={cx("text11", "colorMuted")}>Camera</span>
                        <select className={cx("input")} value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)}>
                          <option>FaceTime HD Camera</option>
                          <option>External USB Camera</option>
                        </select>
                      </label>
                      <label className={cx("flexCol", "gap6")}>
                        <span className={cx("text11", "colorMuted")}>Speaker</span>
                        <select className={cx("input")} value={selectedSpeaker} onChange={(e) => setSelectedSpeaker(e.target.value)}>
                          <option>MacBook Speakers</option>
                          <option>AirPods Output</option>
                        </select>
                      </label>
                      <div className={cx("bookingFlowNote")}>
                        <div className={cx("fw700", "text12", "mb4")}>Privacy and recording</div>
                        <div className={cx("text11", "colorMuted")}>Recording is off by default. A visible indicator appears for everyone before recording starts.</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={cx("flexBetween", "gap12", "mt16", "flexWrap")}>
                  <div className={cx("text11", "colorMuted")}>Connection status: <span className={cx("fw700", "colorBody")}>{connectionState}</span></div>
                  <div className={cx("flexRow", "gap8", "flexWrap")}>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setConnectionState("Checking devices")}>Run Check Again</button>
                  {activeCallJoinUrl && (
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => onJoinCall?.(activeCallJoinUrl)}>
                      <Ic n="monitor" sz={12} /> Open Live Room
                    </button>
                  )}
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={joinCallExperience}>
                    <Ic n="video" sz={13} c="var(--bg)" /> Join Meeting
                  </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {callStage === "live" && (
            <>
              <div className={cx("callTopBar")}>
                <div>
                  <div className={cx("flexRow", "gap8", "mb6", "flexWrap")}>
                    <span className={cx("badge", "badgeAccent")}>Live meeting</span>
                    <span className={cx("badge", "badgeMuted")}>{callParticipants.length} participants</span>
                    <span className={cx("badge", recordingOn ? "badgeRed" : "badgeMuted")}>{recordingOn ? "Recording" : "Recording off"}</span>
                    <span className={cx("badge", connectionState === "Connected" ? "badgeGreen" : "badgeAmber")}>{connectionState}</span>
                  </div>
                  <div className={cx("callHeaderTitleLarge")}>{callTitle}</div>
                  <div className={cx("text11", "colorMuted", "mt4")}>Elapsed time {fmtTime(callSeconds)} · Press ESC to leave the call workspace</div>
                </div>
                <div className={cx("flexRow", "gap8", "flexWrap")}>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setRecordingOn((v) => !v)}>
                    <Ic n="video" sz={12} /> {recordingOn ? "Stop Recording" : "Start Recording"}
                  </button>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setConnectionState(connectionState === "Connected" ? "Reconnecting" : "Connected")}>
                    <Ic n="refresh" sz={12} /> Network
                  </button>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => activeCallJoinUrl && navigator.clipboard.writeText(activeCallJoinUrl)}>
                    <Ic n="copy" sz={12} /> Copy Invite
                  </button>
                  {activeCallJoinUrl && (
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => onJoinCall?.(activeCallJoinUrl)}>
                      <Ic n="monitor" sz={12} /> Open Live Room
                    </button>
                  )}
                  <button type="button" className={cx("btnSm", "btnDangerSoft")} onClick={leaveCallExperience}>
                    <Ic n="phone" sz={12} c="#ff6060" /> Leave Call
                  </button>
                </div>
              </div>

              <div className={cx("callMainLayout")}>
                <div className={cx("callStageArea")}>
                  <div className={cx("callStageHero")}>
                    <div className={cx("callStageStatusRow")}>
                      <div className={cx("flexRow", "gap8", "flexCenter")}>
                        <span className={`live-dot ${cx("dotAccentSm", "inlineBlock")}`} />
                        <span className={cx("text11", "fw700", "colorAccent")}>Primary speaker</span>
                      </div>
                      <div className={cx("text11", "colorMuted")}>{activeSpeaker.name} · {activeSpeaker.role}</div>
                    </div>
                    <div className={cx("callStageAvatarWrap")}>
                      <div className={cx("callAvCircle", "callStageAvatar", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${activeSpeaker.color} 14%, #151a23)`, "--color": activeSpeaker.color } as React.CSSProperties}>
                        {activeSpeaker.av}
                      </div>
                    </div>
                    <div className={cx("textCenter")}>
                      <div className={cx("fw800", "text18")}>{activeSpeaker.name}</div>
                      <div className={cx("text11", "colorMuted", "mt4")}>Host · {recordingOn ? "Recording in progress" : "Meeting in progress"}</div>
                    </div>
                  </div>

                  <div className={cx("callParticipantRail")}>
                    {sideParticipants.map((p) => (
                      <div key={p.av} className={cx("callParticipantMini")}>
                        <div className={cx("callAvCircle", "callMiniAvatar", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${p.color} 14%, #151a23)`, "--color": p.color } as React.CSSProperties}>{p.av}</div>
                        <div className={cx("flex1", "minW0")}>
                          <div className={cx("fw700", "text12")}>{p.name}</div>
                          <div className={cx("text10", "colorMuted")}>{p.role}</div>
                        </div>
                        <div className={cx("flexRow", "gap5")}>
                          <span className={cx("callCtrlIcon", "dynBgColor")} style={{ "--bg-color": p.micOn ? "rgba(255,255,255,0.08)" : "rgba(220,50,50,0.25)" } as React.CSSProperties}><Ic n="mic" sz={11} c={p.micOn ? "#fff" : "#ff6060"} /></span>
                          <span className={cx("callCtrlIcon", "dynBgColor")} style={{ "--bg-color": p.camOn ? "rgba(255,255,255,0.08)" : "rgba(220,50,50,0.25)" } as React.CSSProperties}><Ic n="camera" sz={11} c={p.camOn ? "#fff" : "#ff6060"} /></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className={cx("callWorkspacePanel")}>
                  <div className={cx("callWorkspaceTabs")}>
                    {([
                      ["notes", "Notes"],
                      ["agenda", "Agenda"],
                      ["files", "Files"],
                      ["actions", "Actions"],
                      ["chat", "Chat"],
                    ] as Array<[CallWorkspaceTab, string]>).map(([id, label]) => (
                      <button key={id} type="button" className={cx("btnSm", callWorkspaceTab === id ? "btnAccent" : "btnGhost")} onClick={() => setCallWorkspaceTab(id)}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {callWorkspaceTab === "notes" && (
                    <div className={cx("callWorkspaceSection")}>
                      <div className={cx("fw700", "text13", "mb8")}>Live notes</div>
                      <textarea className={cx("textarea", "resizeV", "fontMono", "fs12")} rows={10} value={callNotes} onChange={(e) => setCallNotes(e.target.value)} placeholder="Capture decisions, questions, and follow-up points here..." />
                    </div>
                  )}

                  {callWorkspaceTab === "agenda" && (
                    <div className={cx("callWorkspaceSection", "flexCol", "gap8")}>
                      <div className={cx("fw700", "text13", "mb4")}>Agenda</div>
                      {callAgenda.map((item) => (
                        <div key={item} className={cx("callAgendaItem")}>
                          <span className={cx("dot8", "bgAccent")} />
                          <span className={cx("text12")}>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {callWorkspaceTab === "files" && (
                    <div className={cx("callWorkspaceSection", "flexCol", "gap8")}>
                      <div className={cx("fw700", "text13", "mb4")}>Meeting assets</div>
                      {callFiles.map((file) => (
                        <div key={file.id} className={cx("callAssetRow")}>
                          <div className={cx("iconBox34")}><Ic n="calendar" sz={13} c="var(--muted2)" /></div>
                          <div className={cx("flex1", "minW0")}>
                            <div className={cx("fw600", "text12")}>{file.label}</div>
                            <div className={cx("text10", "colorMuted")}>{file.meta}</div>
                          </div>
                          <button type="button" className={cx("btnSm", "btnGhost")}>Open</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {callWorkspaceTab === "actions" && (
                    <div className={cx("callWorkspaceSection", "flexCol", "gap10")}>
                      <div className={cx("fw700", "text13")}>Action items</div>
                      <div className={cx("flexRow", "gap8")}>
                        <input className={cx("input", "flex1")} value={callActionDraft} onChange={(e) => setCallActionDraft(e.target.value)} placeholder="Add follow-up task..." />
                        <button type="button" className={cx("btnSm", "btnAccent")} onClick={addCallActionItem}>Add</button>
                      </div>
                      {callActionItems.map((item) => (
                        <button key={item.id} type="button" className={cx("callActionRow")} onClick={() => setCallActionItems((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))}>
                          <span className={cx("badge", item.done ? "badgeGreen" : "badgeMuted")}>{item.done ? "Done" : "Open"}</span>
                          <span className={cx("text12", "flex1", "textLeft")}>{item.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {callWorkspaceTab === "chat" && (
                    <div className={cx("callWorkspaceSection", "flexCol", "gap10")}>
                      <div className={cx("fw700", "text13")}>In-call chat</div>
                      <div className={cx("callChatLog")}>
                        {callChat.map((entry) => (
                          <div key={entry.id} className={cx("callChatBubble")}>
                            <div className={cx("text10", "colorMuted", "mb4")}>{entry.author} · {entry.role}</div>
                            <div className={cx("text12")}>{entry.message}</div>
                          </div>
                        ))}
                      </div>
                      <div className={cx("flexRow", "gap8")}>
                        <input className={cx("input", "flex1")} value={callChatInput} onChange={(e) => setCallChatInput(e.target.value)} placeholder="Send a quick message..." onKeyDown={(e) => { if (e.key === "Enter") handleSendChatMessage(); }} />
                        <button type="button" className={cx("btnSm", "btnAccent")} onClick={handleSendChatMessage}>Send</button>
                      </div>
                    </div>
                  )}
                </aside>
              </div>

              <div className={cx("callControlBar", "callControlBarWide")}>
                {([
                  { icon: "mic", label: micOn ? "Mic on" : "Mic off", active: micOn, toggle: () => setMicOn((v) => !v) },
                  { icon: "camera", label: cameraOn ? "Camera on" : "Camera off", active: cameraOn, toggle: () => setCameraOn((v) => !v) },
                  { icon: "monitor", label: sharing ? "Sharing" : "Share", active: sharing, toggle: () => setSharing((v) => !v) },
                ] as { icon: string; label: string; active: boolean; toggle: () => void }[]).map((ctrl) => (
                  <div key={ctrl.label} className={cx("flexCol", "flexCenter", "gap5")}>
                    <button type="button" onClick={ctrl.toggle} className={cx("callCtrlBtn", "dynBgColor")} style={{ "--bg-color": ctrl.active ? "rgba(255,255,255,0.1)" : "rgba(220,50,50,0.18)", "--color": ctrl.active ? "rgba(255,255,255,0.25)" : "rgba(220,50,50,0.4)" } as React.CSSProperties}>
                      <Ic n={ctrl.icon} sz={20} c={ctrl.active ? "rgba(255,255,255,0.88)" : "#ff6060"} />
                    </button>
                    <span className={cx("callCtrlLabel")}>{ctrl.label}</span>
                  </div>
                ))}
                <button type="button" className={cx("btnSm", callWorkspaceTab === "chat" ? "btnAccent" : "btnGhost")} onClick={() => setCallWorkspaceTab("chat")}>Chat</button>
                <button type="button" className={cx("btnSm", callWorkspaceTab === "notes" ? "btnAccent" : "btnGhost")} onClick={() => setCallWorkspaceTab("notes")}>Notes</button>
                <button type="button" className={cx("btnSm", "btnDanger")} onClick={leaveCallExperience}>
                  <Ic n="phone" sz={14} c="#fff" /> Leave Meeting
                </button>
              </div>
            </>
          )}

          {callStage === "wrap" && (
            <div className={cx("callWrapupWrap")}>
              <div className={cx("callWrapupCard")}>
                <div className={cx("doneCircle64")}><Ic n="check" sz={26} c="var(--lime)" /></div>
                <div className={cx("fw800", "text18", "textCenter", "mb6")}>Call wrap-up</div>
                <div className={cx("text12", "colorMuted", "textCenter", "mb20")}>Save the notes, confirm follow-ups, and decide what should happen next.</div>

                <div className={cx("grid2Cols", "gap12", "mb16")}>
                  <div className={cx("card")}>
                    <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Summary</span></div>
                    <div className={cx("cardBodyPad")}>
                      <textarea className={cx("textarea", "resizeV")} rows={6} value={followUpSummary} onChange={(e) => setFollowUpSummary(e.target.value)} placeholder="Write a short client-facing summary of what happened in the call..." />
                    </div>
                  </div>
                  <div className={cx("card")}>
                    <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Follow-ups</span></div>
                    <div className={cx("cardBodyPad", "flexCol", "gap8")}>
                      {callActionItems.map((item) => (
                        <div key={item.id} className={cx("callActionRowStatic")}>
                          <span className={cx("badge", item.done ? "badgeGreen" : "badgeAmber")}>{item.done ? "Done" : "Open"}</span>
                          <span className={cx("text12", "flex1")}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {wrapupSaved && (
                  <div className={cx("videoReadyBanner", "mb16")}>
                    <div className={cx("videoReadyTitle", "mb6")}>Wrap-up saved</div>
                    <div className={cx("text11", "colorMuted")}>Your notes and action list are ready for the next meeting or follow-up update.</div>
                  </div>
                )}

                <div className={cx("flexRow", "justifyCenter", "gap8", "flexWrap")}>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setWrapupSaved(true)}>Save Notes</button>
                  <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => { setBookStep(0); closeCallExperience(); }}>Book Follow-up</button>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={closeCallExperience}>Done</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Communication · Meetings</div>
          <h1 className={cx("pageTitle")}>Book a Call</h1>
          <p className={cx("pageSub")}>Schedule client calls, launch instant rooms, and review your recent meeting timeline from one place.</p>
        </div>
        <div className={cx("pageActions", "flexWrap")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void handleRefresh()}>
            <Ic n="refresh" sz={13} /> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={handleExportCsv}>
            <Ic n="download" sz={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className={cx("grid2Cols", "gap12", "mb12")}>
        <div className={cx("card", "borderLeftAccent", "bookingIntroCard")}>
          <div className={cx("cardBodyPad", "pt16")}>
            <div className={cx("flexRow", "gap8", "mb8")}>
              <Ic n="video" sz={15} c="var(--lime)" />
              <span className={cx("fw700", "text13")}>Need help right now?</span>
            </div>
            <div className={cx("text12", "colorMuted", "lineH17", "mb14")}>
              Launch an instant room for urgent issues or quick clarification with the team.
            </div>
            {!instantRoom ? (
              <button
                type="button"
                className={cx("btnSm", "btnAccent", "flexRow", "flexCenter", "gap8")}
                onClick={() => void handleInstantCall()}
                disabled={instantLoading || !session}
              >
                <Ic n="video" sz={13} c="var(--bg)" />
                {instantLoading ? "Creating room..." : "Start Instant Call"}
              </button>
            ) : (
              <div className={cx("flexRow", "gap8", "flexWrap")}>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent", "flexRow", "flexCenter", "gap6")}
                  onClick={() => onJoinCall?.(instantRoom.joinUrl)}
                >
                  <Ic n="video" sz={13} c="var(--bg)" /> Join Room
                </button>
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost", "flexRow", "flexCenter", "gap6")}
                  onClick={() => { setInstantRoom(null); setInstantError(null); }}
                >
                  Close Room
                </button>
              </div>
            )}
            {instantError && <div className={cx("text11", "colorRed", "mt8")}>{instantError}</div>}
          </div>
        </div>
        <div className={cx("card", "bookingIntroCard")}>
          <div className={cx("cardBodyPad", "pt16")}>
            <div className={cx("flexRow", "gap8", "mb8")}>
              <Ic n="calendar" sz={15} c="var(--accent)" />
              <span className={cx("fw700", "text13")}>Scheduled calls</span>
            </div>
            <div className={cx("text12", "colorMuted", "lineH17", "mb10")}>
              Use scheduled calls for reviews, demos, planning, and check-ins. Only live published team slots are shown below.
            </div>
            <div className={cx("bookingIntroMetricRow")}>
              <div className={cx("text11", "colorMuted")}><span className={cx("fw700", "colorBody")}>{availableSlotsByKey.size}</span> open slot{availableSlotsByKey.size === 1 ? "" : "s"} this cycle</div>
              <div className={cx("text11", "colorMuted")}><span className={cx("fw700", "colorBody")}>{nextMeeting ? "1" : "0"}</span> next confirmed meeting</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack")}>
        {[
          { label: "Total This Month", value: statsData.totalThisMonth > 0 ? String(statsData.totalThisMonth) : "—", color: "statCardAccent"  },
          { label: "Hours in Calls",   value: statsData.hoursThisMonth > 0 ? `${statsData.hoursThisMonth}h` : "—",    color: "statCardPurple"  },
          { label: "Upcoming Calls",   value: statsData.upcomingCount  > 0 ? String(statsData.upcomingCount)  : "—", color: "statCardGreen"   },
          { label: "Action Items",     value: String(pendingActionItems),                                               color: "statCardAmber"   },
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
                <div className={cx("flexRow", "gap7", "mb12")}>
                  <div className={cx("accentBar3x14")} />
                  <span className={cx("fontMono", "fs062", "fw700", "ls01", "textUpper", "colorMuted")}>Your next meeting</span>
                </div>
                <div className={cx("flexRow", "gap12", "mb10")}>
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
                    onClick={() => openCallExperience({ title: nextMeeting.title, joinUrl: nextMeeting.videoRoomUrl })}
                  >
                    <Ic n="video" sz={13} c="var(--bg)" /> Join Now
                  </button>
                ) : (
                  <>
                    <div className={cx("fontMono", "fw700", "text13", "colorAccent")}>Upcoming</div>
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost", "noWrap")}
                      disabled={!nextApptRaw}
                      onClick={() => nextApptRaw && window.open(buildGoogleCalendarUrl(nextApptRaw), "_blank", "noopener,noreferrer")}
                    >
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
              <div className={cx("text11", "colorMuted")}>Use the scheduler below to add your next client call to the shared calendar.</div>
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
                      <button type="button" className={cx("btnSm", "btnAccent", "wFull")} onClick={() => openCallExperience({ title: m.title, joinUrl: m.videoRoomUrl })}>
                        <Ic n="video" sz={13} c="var(--bg)" /> Join Call
                      </button>
                    ) : m.isLive
                    ? (
                      <button type="button" className={cx("btnSm", "btnAccent", "wFull")} onClick={() => openCallExperience({ title: m.title, joinUrl: m.videoRoomUrl })}>
                        <Ic n="video" sz={13} c="var(--bg)" /> Join Now
                      </button>
                    ) : m.videoRoomUrl
                    ? (
                      <button type="button" className={cx("btnSm", "btnGhost", "wFull", "borderLime", "colorAccent")} onClick={() => openCallExperience({ title: m.title, joinUrl: m.videoRoomUrl })}>
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
            <span className={cx("cardHdTitle")}>{bookStep === "done" ? "Meeting Booked!" : "Schedule a Call"}</span>
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
              <div className={cx("text12", "colorMuted", "mb16")}>Choose the kind of call you want to schedule.</div>
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
                        "--bg-color": active ? `color-mix(in oklab, ${t.color} 8%, transparent)` : "var(--s2)",
                        "--color": active ? t.color : "var(--b2)",
                      } as React.CSSProperties}
                    >
                      <div className={cx("tabIndicator", "dynBgColor")} style={{ "--bg-color": active ? t.color : "transparent" } as React.CSSProperties} />
                      <div className={cx("py14_px", "px18_px")}>
                        <div className={cx("meetingTypeIconBox", "dynBgColor")} style={{
                          "--bg-color": active ? `color-mix(in oklab, ${t.color} 15%, transparent)` : "var(--s3)",
                          "--color": active ? `color-mix(in oklab, ${t.color} 30%, transparent)` : "var(--b1)",
                        } as React.CSSProperties}>
                          <Ic n={t.icon} sz={18} c={active ? t.color : "var(--muted2)"} />
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
              <div className={cx("text12", "colorMuted", "mb16")}>Choose a day first, then pick one of the live slots your team has published.</div>
              {availableDays.length > 0 ? (
                <>
                  <div className={cx("bookingSlotDayRow")}>
                    {availableDays.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        className={cx("btnSm", selectedBookingDay === day.id ? "btnAccent" : "btnGhost")}
                        onClick={() => setSelectedBookingDay(day.id)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <div className={cx("bookingSlotGrid")}>
                    {(availableDays.find((day) => day.id === selectedBookingDay)?.slots ?? []).map(({ slot, label, duration }) => {
                      const active = selectedSlot?.slotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot({ slotId: slot.id, day: selectedBookingDay ?? "", time: label, startsAt: slot.startsAt, endsAt: slot.endsAt })}
                          className={cx("bookingSlotCard", active && "bookingSlotCardActive")}
                        >
                          <div className={cx("flexBetween", "gap10", "mb6")}>
                            <span className={cx("fw700", "text13")}>{label}</span>
                            {active ? <span className={cx("badge", "badgeAccent")}>Selected</span> : <span className={cx("badge", "badgeMuted")}>Open</span>}
                          </div>
                          <div className={cx("bookingSlotMeta")}>
                            <Ic n="clock" sz={11} c="var(--muted2)" />
                            <span>{duration} min slot</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className={cx("bookingFlowNote", "mb16")}>
                  <div className={cx("fw700", "text13", "mb6")}>No open slots have been published yet</div>
                  <div className={cx("text11", "colorMuted", "lineH17")}>Use an instant call for urgent help, or check back when your team publishes the next set of booking slots.</div>
                </div>
              )}
              <div className={cx("flexRow", "gap14", "mb16", "flexWrap")}>
                {[
                  { bg: "var(--lime)", label: "Selected" },
                  { bg: "var(--s3)", label: "Live availability" },
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
            const durationMins = selectedSlot ? Math.max(15, Math.round((new Date(selectedSlot.endsAt).getTime() - new Date(selectedSlot.startsAt).getTime()) / 60_000)) : 0;
            return (
              <>
                <div className={cx("text12", "colorMuted", "mb16")}>Review the live slot and submit the booking.</div>
                <div className={cx("bookingRecapCard", "dynBorderLeft3")} style={{ "--color": t?.color ?? "var(--lime)" } as React.CSSProperties}>
                  <div className={cx("flexRow", "flexCenter", "gap12", "mb14")}>
                    <div className={cx("iconBox44", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${t?.color ?? "var(--lime)"} 12%, var(--s3))`, "--color": `color-mix(in oklab, ${t?.color ?? "var(--lime)"} 25%, transparent)` } as React.CSSProperties}>
                      <Ic n={t?.icon ?? "calendar"} sz={20} c={t?.color ?? "var(--lime)"} />
                    </div>
                    <div>
                      <div className={cx("fw700", "text13", "dynColor")} style={{ "--color": t?.color } as React.CSSProperties}>{t?.label}</div>
                      <div className={cx("text11", "colorMuted")}>{dayLabel} · {selectedSlot?.time} · {durationMins} min</div>
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
                <div className={cx("text12", "colorMuted", "mb20")}>Your appointment has been added to the portal schedule.</div>
                <div className={cx("doneSummaryChip", "mb20")}>
                  <Ic n={t?.icon ?? "calendar"} sz={18} c={t?.color ?? "var(--lime)"} />
                  <span className={cx("fw600", "text12")}>{t?.label} · {dayLabel} · {selectedSlot?.time}</span>
                </div>
                <div className={cx("text11", "colorMuted", "mb20")}>
                  We&apos;ll keep the join details and timeline in your dashboard so you can return here without hunting through email.
                </div>
                {/* Video call link */}
                {bookedVideoUrl ? (
                  <div className={cx("videoReadyBanner", "mb20")}>
                    <div className={cx("videoReadyTitle", "mb8")}>Your video call is ready</div>
                    <button
                      type="button"
                      className={cx("btnSm", "btnAccent")}
                      onClick={() => openCallExperience({ title: t?.label ?? "Booked meeting", joinUrl: bookedVideoUrl })}
                    >
                      <Ic n="video" sz={13} c="var(--bg)" /> Join Video Call
                    </button>
                  </div>
                ) : (
                  <div className={cx("text11", "colorMuted", "mb20")}>
                    A join link will appear here as soon as the meeting room is provisioned for this appointment.
                  </div>
                )}
                <div className={cx("flexRow", "justifyCenter", "gap8")}>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    disabled={!bookedAppt}
                    onClick={() => bookedAppt && window.open(buildGoogleCalendarUrl(bookedAppt), "_blank", "noopener,noreferrer")}
                  >
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
        {(!meetings || meetings.length === 0) ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No past meetings yet</div>
            <div className={cx("emptyStateSub")}>Your meeting history will appear here once you&apos;ve had calls with your team.</div>
          </div>
        ) : meetings.map((m) => {
          const actionBadge =
            m.actionItemStatus === "PENDING"     ? "badgeAmber"  :
            m.actionItemStatus === "IN_PROGRESS" ? "badgePurple" : "badgeGreen";
          const actionLabel =
            m.actionItemStatus === "PENDING"     ? "Action needed" :
            m.actionItemStatus === "IN_PROGRESS" ? "In progress"   : "Done";
          const dateLabel = new Date(m.meetingAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
          const durLabel  = `${m.durationMins} min`;
          return (
            <div key={m.id} className={cx("borderTopDivider")}>
              <button
                type="button"
                className={cx("listRowBtn")}
                onClick={() => setExpandedPast(expandedPast === m.id ? null : m.id)}
              >
                <div className={cx("iconBox34")}>
                  <Ic n="calendar" sz={14} c="var(--muted2)" />
                </div>
                <div className={cx("flex1", "minW0")}>
                  <div className={cx("flexRow", "gap7", "mb3", "flexWrap")}>
                    <span className={cx("fw600", "text12")}>{m.title}</span>
                    <span className={cx("badge", actionBadge)}>{actionLabel}</span>
                  </div>
                  <div className={cx("text10", "colorMuted")}>
                    {dateLabel} · {durLabel} · {m.attendeeCount} attendee{m.attendeeCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <Ic n={expandedPast === m.id ? "chevronDown" : "chevronRight"} sz={14} c="var(--muted2)" />
              </button>
              {expandedPast === m.id && m.notes && (
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
          );
        })}
      </div>

      {/* ── Upcoming Calendar Events ──────────────────────────────────────── */}
      <div className={cx("card", "p0", "overflowHidden")}>
        <div className={cx("cardHd", "pl18")}>
          <div className={cx("flexRow", "flexCenter", "gap7")}>
            <Ic n="calendar" sz={13} c="var(--muted)" />
            <span className={cx("cardHdTitle")}>Upcoming — Next 30 Days</span>
          </div>
        </div>
        {calendarLoading ? (
          <div className={cx("p24", "colorMuted", "text12", "textCenter")}>Loading calendar…</div>
        ) : calendarEvents.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No upcoming events</div>
            <div className={cx("emptyStateSub")}>Appointments, project milestones, and deadlines will appear here.</div>
          </div>
        ) : (
          calendarEvents.map((ev) => {
            const dateLabel = new Date(ev.date).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
            const timeLabel = new Date(ev.date).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
            const typeBadge =
              ev.type === "appointment"     ? "badgeAccent"  :
              ev.type === "milestone"       ? "badgePurple"  : "badgeAmber";
            const typeLabel =
              ev.type === "appointment"     ? "Appointment"  :
              ev.type === "milestone"       ? "Milestone"    : "Sprint End";
            return (
              <div key={ev.id} className={cx("borderTopDivider")}>
                <div className={cx("listRowBtn")}>
                  <div className={cx("iconBox34")}>
                    <Ic n="calendar" sz={14} c="var(--muted2)" />
                  </div>
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("flexRow", "gap7", "mb3", "flexWrap")}>
                      <span className={cx("fw600", "text12")}>{ev.title}</span>
                      <span className={cx("badge", typeBadge)}>{typeLabel}</span>
                    </div>
                    <div className={cx("text10", "colorMuted")}>
                      {dateLabel} · {timeLabel}
                      {ev.projectName ? ` · ${ev.projectName}` : ""}
                    </div>
                  </div>
                  {ev.status && (
                    <span className={cx("badge", "badgeMuted")}>{ev.status}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
