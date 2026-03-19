// ════════════════════════════════════════════════════════════════════════════
// meeting-booker-page.tsx — Client Portal: Book a Call
// Data      : GET /meetings (past meetings archive)
// Note      : No POST /meetings/book endpoint yet — submit shows confirmation
//             toast and resets form. Wire to real API when endpoint is added.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx } from "../style";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { saveSession, clearSession } from "../../../../lib/auth/session";
import {
  loadPortalMeetingsWithRefresh,
  type PortalMeeting,
} from "../../../../lib/api/portal";

const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00"];

export function MeetingBookerPage() {
  const { session } = useProjectLayer();
  const notify = usePageToast();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [meetingType,   setMeetingType]   = useState("Project Check-in");
  const [teamMemberId,  setTeamMemberId]  = useState("");
  const [date,          setDate]          = useState("");
  const [selectedSlot,  setSelectedSlot]  = useState<string | null>(null);
  const [notes,         setNotes]         = useState("");
  const [submitting,    setSubmitting]    = useState(false);

  // ── Past meetings state ────────────────────────────────────────────────────
  const [pastMeetings, setPastMeetings] = useState<PortalMeeting[]>([]);
  const [loading,      setLoading]      = useState(true);

  // ── Load past meetings from API ────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    loadPortalMeetingsWithRefresh(session).then((result) => {
      if (result.nextSession) saveSession(result.nextSession);
      else if (!result.data) { clearSession(); return; }
      if (result.data) setPastMeetings(result.data);
    }).finally(() => setLoading(false));
  }, [session]);

  // ── Upcoming: meetings scheduled in the future ─────────────────────────────
  const now = new Date();
  const upcomingMeetings = pastMeetings.filter(
    (m) => new Date(m.meetingAt) >= now
  );
  const historyMeetings = pastMeetings.filter(
    (m) => new Date(m.meetingAt) < now
  );

  // ── Submit handler ─────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!meetingType || !date) {
      notify("error", "Please select a meeting type and date.");
      return;
    }
    if (!selectedSlot) {
      notify("error", "Please select a time slot.");
      return;
    }
    setSubmitting(true);
    // TODO: replace with real API call when POST /meetings/book endpoint is available
    await new Promise<void>((r) => setTimeout(r, 600));
    notify("success", "Meeting request submitted. Confirmation will be emailed.");
    setSubmitting(false);
    setMeetingType("Project Check-in");
    setTeamMemberId("");
    setDate("");
    setSelectedSlot(null);
    setNotes("");
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function formatMeetingDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  function formatMeetingTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-ZA", {
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Communication · Meetings</div>
          <h1 className={cx("pageTitle")}>Book a Call</h1>
          <p className={cx("pageSub")}>
            Schedule a meeting with your project team or account manager.
          </p>
        </div>
      </div>

      <div className={cx("grid2", "mb16")}>
        {/* ── Booking form ── */}
        <div className={cx("card", "p20")}>
          <div className={cx("fw700", "mb12")}>Schedule a Meeting</div>
          <div className={cx("flexCol", "gap12")}>
            <div>
              <div className={cx("text11", "colorMuted", "mb4")}>Meeting Type</div>
              <select
                className={cx("input", "wFull")}
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
              >
                <option>Project Check-in</option>
                <option>Feedback Session</option>
                <option>Strategy Call</option>
                <option>Emergency Escalation</option>
              </select>
            </div>

            <div>
              <div className={cx("text11", "colorMuted", "mb4")}>Team Member</div>
              <select
                className={cx("input", "wFull")}
                value={teamMemberId}
                onChange={(e) => setTeamMemberId(e.target.value)}
              >
                <option value="">— Select team member —</option>
                <option value="account-manager">Account Manager</option>
                <option value="lead-designer">Lead Designer</option>
                <option value="lead-developer">Lead Developer</option>
              </select>
            </div>

            <div>
              <div className={cx("text11", "colorMuted", "mb4")}>Date</div>
              <input
                type="date"
                className={cx("input", "wFull")}
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <div className={cx("text11", "colorMuted", "mb4")}>Time Slot</div>
              <div className={cx("flexRow", "flexWrap", "gap6", "mb12")}>
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={cx("btnSm", selectedSlot === slot ? "btnAccent" : "btnGhost")}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className={cx("text11", "colorMuted", "mb4")}>Notes</div>
              <textarea
                rows={2}
                placeholder="Any specific topics to discuss..."
                className={cx("input", "wFull", "resizeV")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              type="button"
              className={cx("btnSm", "btnAccent", "wFull")}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting…" : "Request Meeting"}
            </button>
          </div>
        </div>

        {/* ── Upcoming meetings ── */}
        <div className={cx("card", "p20")}>
          <div className={cx("fw700", "mb12")}>Upcoming Meetings</div>
          <div className={cx("listGroup")}>
            {loading ? (
              <div className={cx("text11", "colorMuted")}>Loading…</div>
            ) : upcomingMeetings.length === 0 ? (
              <div className={cx("text11", "colorMuted")}>No upcoming meetings scheduled.</div>
            ) : (
              upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className={cx("listRow")}>
                  <div>
                    <div className={cx("fw600")}>{meeting.title}</div>
                    <div className={cx("text11", "colorMuted")}>
                      {formatMeetingDate(meeting.meetingAt)} · {formatMeetingTime(meeting.meetingAt)}
                    </div>
                    <div className={cx("text11", "colorMuted")}>{meeting.durationMins} min</div>
                  </div>
                  <button
                    type="button"
                    className={cx("btnGhost")}
                    onClick={() => notify("info", "Contact your account manager to reschedule.")}
                  >
                    Reschedule
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Past meetings ── */}
      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>Past Meetings</span>
        </div>
        <div className={cx("listGroup")}>
          {loading ? (
            <div className={cx("text11", "colorMuted", "p12")}>Loading…</div>
          ) : historyMeetings.length === 0 ? (
            <div className={cx("text11", "colorMuted", "p12")}>No past meetings on record.</div>
          ) : (
            historyMeetings.map((meeting) => (
              <div key={meeting.id} className={cx("listRow")}>
                <div>
                  <div className={cx("fw600")}>{meeting.title}</div>
                  <div className={cx("text11", "colorMuted")}>
                    {formatMeetingDate(meeting.meetingAt)} · {meeting.durationMins} min
                  </div>
                </div>
                <span className={cx("text11", "colorAccent")}>
                  {meeting.notes ? "View Notes →" : "No notes"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
