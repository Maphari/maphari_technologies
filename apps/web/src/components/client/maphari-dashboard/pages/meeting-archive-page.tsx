"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { saveSession } from "../../../../lib/auth/session";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  createPortalSupportTicketWithRefresh,
  getPortalFileDownloadUrlWithRefresh,
  loadPortalAppointmentsWithRefresh,
  loadPortalMeetingsWithRefresh,
  ratePortalMeetingWithRefresh,
  type PortalAppointment,
  type PortalMeeting,
} from "../../../../lib/api/portal";
import { usePageToast } from "../hooks/use-page-toast";

const MOODS = ["😞", "😐", "🙂", "😊", "🤩"] as const;
type ViewTab = "Upcoming" | "Archive";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number) {
  return minutes + " min";
}

function exportMeetingsCsv(appointments: PortalAppointment[], meetings: PortalMeeting[]) {
  const header = ["Kind", "Title", "Status", "When", "Duration", "Owner", "Action status", "Recording"];
  const appointmentRows = appointments.map((item) => [
    "Appointment",
    item.type.replace(/_/g, " "),
    item.status,
    item.scheduledAt,
    String(item.durationMins),
    item.ownerName ?? "",
    "",
    item.videoRoomUrl ? "Live room" : "",
  ]);
  const meetingRows = meetings.map((item) => [
    "Meeting",
    item.title,
    item.clientMoodRating ? "Rated" : "Recorded",
    item.meetingAt,
    String(item.durationMins),
    "",
    item.actionItemStatus,
    item.hasRecording ? "Yes" : "No",
  ]);
  const escape = (value: string) => `"${value.replace(/"/g, "\"\"")}"`;
  const csv = [header, ...appointmentRows, ...meetingRows]
    .map((line) => line.map((cell) => escape(String(cell))).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "meeting-intelligence-hub.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function MeetingArchivePage() {
  const { session } = useProjectLayer();
  const notify = usePageToast();

  const [tab, setTab] = useState<ViewTab>("Upcoming");
  const [appointments, setAppointments] = useState<PortalAppointment[]>([]);
  const [meetings, setMeetings] = useState<PortalMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingFollowUp, setBookingFollowUp] = useState(false);
  const [downloadingRecordingId, setDownloadingRecordingId] = useState<string | null>(null);
  const [ratingMeetingId, setRatingMeetingId] = useState<string | null>(null);

  function loadData() {
    if (!session) {
      setAppointments([]);
      setMeetings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    void Promise.all([
      loadPortalAppointmentsWithRefresh(session),
      loadPortalMeetingsWithRefresh(session),
    ])
      .then(([appointmentsResult, meetingsResult]) => {
        if (appointmentsResult.nextSession) saveSession(appointmentsResult.nextSession);
        if (meetingsResult.nextSession) saveSession(meetingsResult.nextSession);

        if (appointmentsResult.error) {
          setError(appointmentsResult.error.message ?? "Unable to load meetings.");
          setAppointments([]);
          setMeetings([]);
          return;
        }

        if (meetingsResult.error) {
          setError(meetingsResult.error.message ?? "Unable to load meetings.");
          setAppointments([]);
          setMeetings([]);
          return;
        }

        setAppointments(appointmentsResult.data ?? []);
        setMeetings(meetingsResult.data ?? []);
      })
      .catch((err: unknown) => {
        setError((err as Error)?.message ?? "Unable to load meetings.");
        setAppointments([]);
        setMeetings([]);
      })
      .finally(() => setLoading(false));
  }

  const loadDataEffect = useEffectEvent(() => {
    loadData();
  });

  useEffect(() => {
    loadDataEffect();
  }, [session]);

  async function handleBookFollowUp() {
    if (!session || bookingFollowUp) return;
    setBookingFollowUp(true);
    try {
      const result = await createPortalSupportTicketWithRefresh(session, {
        clientId: session.user.clientId ?? "",
        title: "Follow-up Meeting Request",
        description: "The client requested a follow-up meeting from the Meeting Intelligence Hub.",
        category: "MEETING_REQUEST",
        priority: "MEDIUM",
      });
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        notify("error", "Request failed", "Could not send your meeting request.");
        return;
      }
      notify("success", "Request sent", "Your follow-up meeting request has been sent.");
    } catch {
      notify("error", "Request failed", "Could not send your meeting request.");
    } finally {
      setBookingFollowUp(false);
    }
  }

  async function handleWatchRecording(meetingId: string, fileId: string) {
    if (!session) return;
    setDownloadingRecordingId(meetingId);
    try {
      const result = await getPortalFileDownloadUrlWithRefresh(session, fileId);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data?.downloadUrl) {
        window.open(result.data.downloadUrl, "_blank", "noopener,noreferrer");
      } else {
        notify("error", "Recording unavailable", "This recording is not ready yet.");
      }
    } finally {
      setDownloadingRecordingId(null);
    }
  }

  async function handleRateMeeting(meetingId: string, rating: number) {
    if (!session || ratingMeetingId) return;
    setRatingMeetingId(meetingId);
    try {
      const result = await ratePortalMeetingWithRefresh(session, meetingId, rating);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error || !result.data) {
        notify("error", "Rating failed", result.error?.message ?? "Unable to save your meeting rating.");
        return;
      }
      setMeetings((current) => current.map((item) => item.id === meetingId ? result.data! : item));
    } finally {
      setRatingMeetingId(null);
    }
  }

  const now = Date.now();
  const upcomingAppointments = useMemo(
    () => appointments.filter((item) => new Date(item.scheduledAt).getTime() >= now).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    [appointments, now]
  );
  const archivedMeetings = useMemo(
    () => meetings.slice().sort((a, b) => b.meetingAt.localeCompare(a.meetingAt)),
    [meetings]
  );
  const recordingsCount = meetings.filter((item) => item.hasRecording).length;
  const pendingActions = meetings.filter((item) => item.actionItemStatus === "PENDING" || item.actionItemStatus === "IN_PROGRESS").length;
  const averageMood = meetings.filter((item) => item.clientMoodRating).length > 0
    ? (meetings.reduce((sum, item) => sum + (item.clientMoodRating ?? 0), 0) / meetings.filter((item) => item.clientMoodRating).length).toFixed(1)
    : "—";

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
          <div className={cx("errorStateTitle")}>Unable to load meetings</div>
          <div className={cx("errorStateSub")}>{error}</div>
          <button type="button" className={cx("btn", "btnPrimary", "mt12")} onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Communication · Meetings</div>
          <h1 className={cx("pageTitle")}>Meeting Intelligence Hub</h1>
          <p className={cx("pageSub")}>Track upcoming calls, revisit recorded meetings, and keep follow-up actions moving from one place.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={loadData}>
            Refresh
          </button>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => exportMeetingsCsv(appointments, meetings)}>
            Export CSV
          </button>
          <button type="button" className={cx("btnSm", "btnGhost")} disabled={bookingFollowUp || !session} onClick={() => void handleBookFollowUp()}>
            {bookingFollowUp ? "Requesting…" : "Book Follow-up"}
          </button>
        </div>
      </div>

      <div className={cx("grid4", "gap12", "mb20")}>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Upcoming calls</div>
          <div className={cx("text22", "fw800", "colorBlue")}>{upcomingAppointments.length}</div>
          <div className={cx("text12", "colorMuted")}>Scheduled appointments still ahead of you</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Recorded meetings</div>
          <div className={cx("text22", "fw800", "colorAccent")}>{meetings.length}</div>
          <div className={cx("text12", "colorMuted")}>Meeting records already captured in the portal</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Recordings</div>
          <div className={cx("text22", "fw800", "colorSuccess")}>{recordingsCount}</div>
          <div className={cx("text12", "colorMuted")}>Meetings with a recording attached</div>
        </div>
        <div className={cx("cardS1v2", "p16", "flexCol", "gap6")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Pending actions</div>
          <div className={cx("text22", "fw800", "colorAmber")}>{pendingActions}</div>
          <div className={cx("text12", "colorMuted")}>Meetings still carrying open action items</div>
        </div>
      </div>

      <div className={cx("cardS1v2", "p16", "mb20", "flexRow", "gap16", "alignCenter", "flexWrap")}>
        <div className={cx("flex1", "minW220")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2", "mb4")}>Client pulse</div>
          <div className={cx("text14", "fw700")}>Average meeting rating: {averageMood}</div>
          <div className={cx("text12", "colorMuted")}>Based only on meetings you have already rated in the portal.</div>
        </div>
        <div className={cx("flex1", "minW220")}>
          <div className={cx("text10", "uppercase", "ls01", "colorMuted2", "mb4")}>What this page covers</div>
          <div className={cx("text12", "colorMuted", "lineH15")}>Upcoming appointments come from the scheduling system. Archive entries come from recorded meeting records, including notes, mood ratings, recordings, and action-item status.</div>
        </div>
      </div>

      <div className={cx("pillTabs", "mb12")}>
        {(["Upcoming", "Archive"] as ViewTab[]).map((item) => (
          <button
            key={item}
            type="button"
            className={cx("pillTab", tab === item && "pillTabActive")}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Upcoming" && (
        upcomingAppointments.length === 0 ? (
          <div className={cx("emptyState", "mt32")}>
            <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No upcoming calls</div>
            <div className={cx("emptyStateSub")}>When your team books the next meeting, it will appear here with timing and join details.</div>
          </div>
        ) : (
          <div className={cx("flexCol", "gap12")}>
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className={cx("cardS1v2", "p16", "flexCol", "gap12")}>
                <div className={cx("flexBetween", "gap12", "flexWrap")}>
                  <div className={cx("flexCol", "gap6", "minW0")}>
                    <div className={cx("flexRow", "gap8", "alignCenter", "flexWrap")}>
                      <span className={cx("badge", "badgeMuted")}>{appointment.type.replace(/_/g, " ")}</span>
                      <span className={cx("badge", "badgeAccent")}>{appointment.status}</span>
                    </div>
                    <div className={cx("text16", "fw800", "lineH13")}>{formatDateTime(appointment.scheduledAt)}</div>
                    <div className={cx("text12", "colorMuted")}>
                      {formatDuration(appointment.durationMins)} · {appointment.ownerName ?? "Maphari"} · {appointment.videoProvider ?? "Meeting link pending"}
                    </div>
                  </div>
                  <div className={cx("flexRow", "gap8", "flexWrap")}>
                    {appointment.videoRoomUrl ? (
                      <a href={appointment.videoRoomUrl} target="_blank" rel="noopener noreferrer" className={cx("btnSm", "btnGhost", "noUnderline")}>
                        Join call
                      </a>
                    ) : (
                      <button type="button" className={cx("btnSm", "btnGhost")} disabled>
                        Join link pending
                      </button>
                    )}
                  </div>
                </div>
                {appointment.notes && (
                  <div className={cx("cardS2", "p12", "text12", "colorMuted", "lineH15")}>{appointment.notes}</div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === "Archive" && (
        archivedMeetings.length === 0 ? (
          <div className={cx("emptyState", "mt32")}>
            <div className={cx("emptyStateIcon")}><Ic n="video" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No archived meetings yet</div>
            <div className={cx("emptyStateSub")}>Recorded meetings will appear here once your sessions have been captured in the portal.</div>
          </div>
        ) : (
          <div className={cx("flexCol", "gap12")}>
            {archivedMeetings.map((meeting) => (
              <div key={meeting.id} className={cx("cardS1v2", "p16", "flexCol", "gap12")}>
                <div className={cx("flexBetween", "gap12", "flexWrap")}>
                  <div className={cx("flexCol", "gap6", "minW0")}>
                    <div className={cx("flexRow", "gap8", "alignCenter", "flexWrap")}>
                      <span className={cx("badge", "badgeMuted")}>{meeting.actionItemStatus}</span>
                      {meeting.hasRecording && <span className={cx("badge", "badgeGreen")}>Recording ready</span>}
                    </div>
                    <div className={cx("text16", "fw800", "lineH13")}>{meeting.title}</div>
                    <div className={cx("text12", "colorMuted")}>
                      {formatDateTime(meeting.meetingAt)} · {formatDuration(meeting.durationMins)} · {meeting.attendeeCount} attendee{meeting.attendeeCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className={cx("flexRow", "gap8", "flexWrap")}>
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost")}
                      disabled={!meeting.recordingFileId || downloadingRecordingId === meeting.id}
                      onClick={() => meeting.recordingFileId && void handleWatchRecording(meeting.id, meeting.recordingFileId)}
                    >
                      {downloadingRecordingId === meeting.id ? "Opening…" : "Watch recording"}
                    </button>
                  </div>
                </div>

                {meeting.notes && (
                  <div className={cx("cardS2", "p12", "text12", "colorMuted", "lineH15")}>{meeting.notes}</div>
                )}

                <div className={cx("grid3Cols12Gap")}>
                  <div className={cx("cardS2", "p12", "flexCol", "gap4")}>
                    <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Action items</div>
                    <div className={cx("text13", "fw700")}>{meeting.actionItemStatus}</div>
                    <div className={cx("text11", "colorMuted")}>Current action item completion state</div>
                  </div>
                  <div className={cx("cardS2", "p12", "flexCol", "gap4")}>
                    <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Recording</div>
                    <div className={cx("text13", "fw700")}>{meeting.hasRecording ? "Available" : "Not attached"}</div>
                    <div className={cx("text11", "colorMuted")}>Whether a watchable recording is attached</div>
                  </div>
                  <div className={cx("cardS2", "p12", "flexCol", "gap4")}>
                    <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Mood rating</div>
                    <div className={cx("text13", "fw700")}>{meeting.clientMoodRating ?? "Not rated"}</div>
                    <div className={cx("text11", "colorMuted")}>Your recorded client rating for this meeting</div>
                  </div>
                </div>

                <div className={cx("flexCol", "gap8")}>
                  <div className={cx("text10", "uppercase", "ls01", "colorMuted2")}>Rate this meeting</div>
                  <div className={cx("flexRow", "gap6", "flexWrap")}>
                    {MOODS.map((emoji, index) => {
                      const rating = index + 1;
                      const active = meeting.clientMoodRating === rating;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          className={cx("maMoodBtn", active && "maMoodBtnActive")}
                          onClick={() => void handleRateMeeting(meeting.id, rating)}
                          disabled={ratingMeetingId === meeting.id}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
