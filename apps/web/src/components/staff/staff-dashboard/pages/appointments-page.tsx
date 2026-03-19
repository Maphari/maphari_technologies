// ════════════════════════════════════════════════════════════════════════════
// appointments-page.tsx — Staff Appointments
// Data : loadPortalAppointmentsWithRefresh → GET /appointments
//         updatePortalAppointmentWithRefresh → PATCH /appointments/:id
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadPortalAppointmentsWithRefresh,
  updatePortalAppointmentWithRefresh,
  type PortalAppointment,
} from "../../../../lib/api/portal/client-cx";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
  });
}

function statusCls(status: string): string {
  const s = status.toUpperCase();
  if (s === "CONFIRMED") return "apptStatusConfirmed";
  if (s === "PENDING")   return "apptStatusPending";
  if (s === "CANCELLED") return "apptStatusCancelled";
  return "apptStatusMuted";
}

function isUpcoming(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppointmentsPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [appointments, setAppointments] = useState<PortalAppointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [confirming, setConfirming]     = useState<string | null>(null);
  const [filter, setFilter]             = useState<"all" | "upcoming" | "pending" | "confirmed">("all");

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    const r = await loadPortalAppointmentsWithRefresh(session);
    setLoading(false);
    if (r.nextSession) saveSession(r.nextSession);
    if (!r.error && r.data) setAppointments(r.data);
  }, [session]);

  useEffect(() => {
    if (isActive) void load();
  }, [isActive, load]);

  const handleConfirm = useCallback(async (appt: PortalAppointment) => {
    if (!session) return;
    setConfirming(appt.id);
    const r = await updatePortalAppointmentWithRefresh(session, appt.id, { status: "CONFIRMED" });
    setConfirming(null);
    if (r.nextSession) saveSession(r.nextSession);
    if (!r.error) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, status: "CONFIRMED" } : a))
      );
    }
  }, [session]);

  const filtered = useMemo(() => {
    let list = [...appointments].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
    if (filter === "upcoming")  list = list.filter((a) => isUpcoming(a.scheduledAt));
    if (filter === "pending")   list = list.filter((a) => a.status.toUpperCase() === "PENDING");
    if (filter === "confirmed") list = list.filter((a) => a.status.toUpperCase() === "CONFIRMED");
    return list;
  }, [appointments, filter]);

  const upcomingCount  = appointments.filter((a) => isUpcoming(a.scheduledAt)).length;
  const pendingCount   = appointments.filter((a) => a.status.toUpperCase() === "PENDING").length;
  const confirmedCount = appointments.filter((a) => a.status.toUpperCase() === "CONFIRMED" && isUpcoming(a.scheduledAt)).length;
  const videoCount     = appointments.filter((a) => !!a.videoRoomUrl && isUpcoming(a.scheduledAt)).length;

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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-appointments">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Scheduling</div>
        <h1 className={cx("pageTitleText")}>Appointments</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Upcoming client-booked calls and meetings</p>
      </div>

      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      <div className={cx("apptKpiGrid")}>
        {[
          { label: "Upcoming",  value: upcomingCount,  color: "colorAccent" },
          { label: "Pending",   value: pendingCount,   color: pendingCount > 0 ? "colorAmber" : "colorGreen" },
          { label: "Confirmed", value: confirmedCount, color: "colorGreen" },
          { label: "Video Calls", value: videoCount,   color: "colorBlue" },
        ].map((k) => (
          <div key={k.label} className={cx("apptKpiCard")}>
            <div className={cx("apptKpiLabel")}>{k.label}</div>
            <div className={cx("apptKpiValue", k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filter row ─────────────────────────────────────────────────────── */}
      <div className={cx("apptFilterRow")}>
        {(["all", "upcoming", "pending", "confirmed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={cx("apptFilterBtn", filter === f && "apptFilterBtnActive")}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button
          type="button"
          className={cx("apptFilterBtn", "mlAuto")}
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* ── Appointment list ────────────────────────────────────────────────── */}
      <div className={cx("apptList")}>
        {filtered.length === 0 && (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No appointments</div>
            <div className={cx("emptyStateSub")}>
              {filter === "all"
                ? "No client appointments have been booked yet. Appointments appear here when clients schedule calls via the portal."
                : `No ${filter} appointments found.`}
            </div>
          </div>
        )}
        {filtered.map((appt) => {
          const upcoming = isUpcoming(appt.scheduledAt);
          const isPending = appt.status.toUpperCase() === "PENDING";
          return (
            <div
              key={appt.id}
              className={cx("apptRow", !upcoming && "apptRowPast")}
            >
              <div className={cx("apptRowLeft")}>
                <div className={cx("apptType")}>{appt.type}</div>
                <div className={cx("apptDateTime")}>{fmtDateTime(appt.scheduledAt)}</div>
                {appt.durationMins && (
                  <div className={cx("apptMeta")}>{appt.durationMins} min</div>
                )}
                {appt.ownerName && (
                  <div className={cx("apptMeta")}>Client: {appt.ownerName}</div>
                )}
                {appt.notes && (
                  <div className={cx("apptNotes")}>{appt.notes}</div>
                )}
              </div>
              <div className={cx("apptRowRight")}>
                <span className={cx("apptStatusBadge", statusCls(appt.status))}>
                  {appt.status}
                </span>
                <div className={cx("apptRowActions")}>
                  {isPending && upcoming && (
                    <button
                      type="button"
                      className={cx("apptBtn", "apptBtnAccent")}
                      onClick={() => void handleConfirm(appt)}
                      disabled={confirming === appt.id}
                    >
                      {confirming === appt.id ? "Confirming…" : "Confirm"}
                    </button>
                  )}
                  {appt.videoRoomUrl && upcoming && (
                    <a
                      href={appt.videoRoomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cx("apptBtn", "apptBtnBlue")}
                    >
                      Join Call
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
