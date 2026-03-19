"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAllAppointmentsWithRefresh, type AdminAppointment } from "../../../../lib/api/admin/client-ops";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";

type MeetingType = "Consultation" | "Kickoff" | "Review" | "Check-in";
type MeetingStatus = "confirmed" | "pending" | "rescheduled";
type Tab = "upcoming" | "pending" | "past" | "settings";

type Meeting = {
  id: string;
  client: string;
  type: MeetingType;
  date: string;
  time: string;
  scheduledMs: number;
  owner: string;
  duration: string;
  status: MeetingStatus;
  videoRoomUrl: string | null;
};

const tabs: Tab[] = ["upcoming", "pending", "past", "settings"];
const NOW = Date.now();

function mapStatus(s: string): MeetingStatus {
  if (s === "SCHEDULED" || s === "CONFIRMED") return "confirmed";
  if (s === "PENDING") return "pending";
  return "rescheduled";
}

function mapType(t: string): MeetingType {
  const l = t.toLowerCase();
  if (l.includes("kickoff") || l.includes("kick-off")) return "Kickoff";
  if (l.includes("review"))                              return "Review";
  if (l.includes("check"))                               return "Check-in";
  return "Consultation";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

function mapAppt(a: AdminAppointment, clientName: string): Meeting {
  return {
    id:           a.id,
    client:       clientName,
    type:         mapType(a.type),
    date:         fmtDate(a.scheduledAt),
    time:         fmtTime(a.scheduledAt),
    scheduledMs:  new Date(a.scheduledAt).getTime(),
    owner:        a.ownerName ?? "—",
    duration:     `${a.durationMins} min`,
    status:       mapStatus(a.status),
    videoRoomUrl: a.videoRoomUrl ?? null,
  };
}

function statusBadge(status: MeetingStatus): string {
  if (status === "confirmed") return "badgeGreen";
  if (status === "pending")   return "badgeAmber";
  return "badgeMuted";
}

export function BookingAppointmentsPage({ session }: { session: AuthSession | null }) {
  const [meetings, setMeetings]   = useState<Meeting[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const [apptRes, snapRes] = await Promise.all([
        loadAllAppointmentsWithRefresh(session),
        loadAdminSnapshotWithRefresh(session),
      ]);
      if (cancelled) return;
      if (apptRes.nextSession)      saveSession(apptRes.nextSession);
      else if (snapRes.nextSession) saveSession(snapRes.nextSession);
      const clientMap = new Map<string, string>(
        (snapRes.data?.clients ?? []).map(c => [c.id, c.name])
      );
      setMeetings((apptRes.data ?? []).map(a => mapAppt(a, clientMap.get(a.clientId) ?? "Client")));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session]);

  const todayStr      = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  const todayCount    = meetings.filter(m => m.date === todayStr && m.status === "confirmed").length;
  const weekCount     = meetings.length;
  const pendingCount  = meetings.filter(m => m.status === "pending").length;
  const cancelledCount = meetings.filter(m => m.status === "rescheduled").length;

  const filtered =
    activeTab === "upcoming" ? meetings.filter(m => m.status !== "rescheduled" && m.scheduledMs >= NOW - 86_400_000)
    : activeTab === "pending" ? meetings.filter(m => m.status === "pending")
    : activeTab === "past"   ? meetings.filter(m => m.scheduledMs < NOW - 86_400_000)
    : [];

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

  return (
    <div className={cx(styles.pageBody)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / OPERATIONS</div>
          <h1 className={styles.pageTitle}>Booking &amp; Appointments</h1>
          <div className={styles.pageSub}>Manage client meetings, consultations, and scheduled calls</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Schedule</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Book Appointment</button>
        </div>
      </div>

      <div className={styles.cjKpiGrid}>
        {[
          { label: "Today",                value: String(todayCount),    sub: "Meetings today",    color: "var(--accent)" },
          { label: "This Week",            value: String(weekCount),     sub: "Scheduled",         color: "var(--blue)"   },
          { label: "Pending Confirmation", value: String(pendingCount),  sub: "Awaiting response", color: "var(--amber)"  },
          { label: "Cancelled",            value: String(cancelledCount), sub: "Rescheduled",      color: "var(--red)"    },
        ].map(k => (
          <div key={k.label} className={cx(styles.cjKpiCard, toneClass(k.color))}>
            <div className={styles.cjKpiLabel}>{k.label}</div>
            <div className={cx(styles.cjKpiValue, toneClass(k.color))}>{k.value}</div>
            <div className={styles.cjKpiMeta}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.teamFilters}>
        {tabs.map(t => (
          <button
            key={t}
            type="button"
            className={cx("btnSm", activeTab === t ? "btnAccent" : "btnGhost")}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.teamSection}>
        <div className={styles.teamSectionHeader}>
          <span className={styles.teamSectionTitle}>
            {activeTab === "upcoming" ? "Upcoming Appointments"
              : activeTab === "pending" ? "Pending Confirmation"
              : activeTab === "past"    ? "Past Meetings"
              : "Settings"}
          </span>
          <span className={styles.teamSectionMeta}>{filtered.length} MEETINGS</span>
        </div>

        {loading ? (
          <div className={cx("p24", "colorMuted", "text12", "textCenter")}>Loading appointments…</div>
        ) : activeTab === "settings" ? (
          <div className={cx("p24", "colorMuted", "text12", "textCenter")}>
            Booking settings are managed in the platform configuration.
          </div>
        ) : (
          <>
            <div className={styles.bkngHead}>
              {["Client", "Type", "Date", "Time", "Owner", "Duration", "Status", "Actions"].map(h => (
                <span key={h}>{h}</span>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No meetings in this view.</div>
            ) : (
              filtered.map(m => (
                <div key={m.id} className={styles.bkngRow}>
                  <span className={cx("fw600", "text13")}>{m.client}</span>
                  <span className={cx("text12", "colorMuted")}>{m.type}</span>
                  <span className={cx("fontMono", "text12")}>{m.date}</span>
                  <span className={cx("fontMono", "text12")}>{m.time}</span>
                  <span className={cx("text12", "colorMuted")}>{m.owner}</span>
                  <span className={cx("text12", "colorMuted")}>{m.duration}</span>
                  <span className={cx("badge", statusBadge(m.status))}>{m.status}</span>
                  <div className={cx("flexRow", "gap6")}>
                    {m.status === "pending" && (
                      <button type="button" className={cx("btnSm", "btnAccent")}>Confirm</button>
                    )}
                    {m.videoRoomUrl ? (
                      <button
                        type="button"
                        className={cx("btnSm", styles.btnJoinCall)}
                        onClick={() => window.open(m.videoRoomUrl!, "_blank", "noopener,noreferrer")}
                      >
                        Join Call
                      </button>
                    ) : (
                      <span className={cx("badge", "badgeMuted")}>No video room</span>
                    )}
                    <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
