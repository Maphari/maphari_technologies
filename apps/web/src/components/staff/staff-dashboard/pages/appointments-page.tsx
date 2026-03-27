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

type AppointmentLifecycle =
  | "PENDING"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "CANCELLED"
  | "NO_SHOW"
  | "COMPLETED"
  | "UNKNOWN";

function normalizeStatus(status: string): AppointmentLifecycle {
  const s = status.trim().toUpperCase();
  if (s === "PENDING") return "PENDING";
  if (s === "CONFIRMED") return "CONFIRMED";
  if (s === "RESCHEDULED") return "RESCHEDULED";
  if (s === "CANCELLED") return "CANCELLED";
  if (s === "NO_SHOW") return "NO_SHOW";
  if (s === "COMPLETED") return "COMPLETED";
  return "UNKNOWN";
}

function fmtDateTime(iso: string, timezone: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
    timeZone: timezone,
  });
}

function statusCls(status: string): string {
  const s = normalizeStatus(status);
  if (s === "CONFIRMED")  return "apptStatusConfirmed";
  if (s === "PENDING")    return "apptStatusPending";
  if (s === "RESCHEDULED") return "apptStatusRescheduled";
  if (s === "COMPLETED")  return "apptStatusCompleted";
  if (s === "NO_SHOW")    return "apptStatusNoShow";
  if (s === "CANCELLED")  return "apptStatusCancelled";
  return "apptStatusMuted";
}

function isUpcoming(iso: string, nowMs: number): boolean {
  return new Date(iso).getTime() > nowMs;
}

function intersects(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function buildIcs(title: string, startsAtIso: string, durationMins: number, description: string): string {
  const start = new Date(startsAtIso);
  const end = new Date(start.getTime() + durationMins * 60_000);
  const toIcs = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const dtStamp = toIcs(new Date());
  const dtStart = toIcs(start);
  const dtEnd = toIcs(end);
  const safeTitle = title.replace(/\n/g, " ");
  const safeDescription = description.replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Maphari//StaffAppointments//EN",
    "BEGIN:VEVENT",
    `UID:${dtStamp}-maphari-appointment`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${safeTitle}`,
    `DESCRIPTION:${safeDescription}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
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
  const [error, setError]               = useState<string | null>(null);
  const [rowBusy, setRowBusy]           = useState<Record<string, string>>({});
  const [rowError, setRowError]         = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts]     = useState<Record<string, string>>({});
  const [query, setQuery]               = useState("");
  const [filter, setFilter]             = useState<"all" | "upcoming" | "today" | "pending" | "needs_attention" | "completed" | "cancelled">("all");
  const [sortBy, setSortBy]             = useState<"time_asc" | "time_desc">("time_asc");
  const [nowMs, setNowMs]               = useState(() => new Date().getTime());
  const timezone                        = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const r = await loadPortalAppointmentsWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        setAppointments(r.data);
      } else if (r.error) {
        setError(r.error.message ?? "Failed to load appointments");
      }
    } catch (err) {
      const msg = (err as Error)?.message ?? "Failed to load appointments";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (isActive) void load();
  }, [isActive, load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(new Date().getTime()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const updateAppointment = useCallback(async (
    appt: PortalAppointment,
    patch: { status?: string; notes?: string },
    busyLabel: string,
  ) => {
    if (!session) return;
    setRowBusy((prev) => ({ ...prev, [appt.id]: busyLabel }));
    setRowError((prev) => ({ ...prev, [appt.id]: "" }));
    const r = await updatePortalAppointmentWithRefresh(session, appt.id, patch);
    setRowBusy((prev) => {
      const next = { ...prev };
      delete next[appt.id];
      return next;
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (!r.error && r.data) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? r.data : a))
      );
      setNoteDrafts((prev) => ({ ...prev, [appt.id]: r.data.notes ?? "" }));
      return;
    }
    setRowError((prev) => ({
      ...prev,
      [appt.id]: r.error?.message ?? "Update failed."
    }));
  }, [session]);

  const handleCopyInvite = useCallback(async (appt: PortalAppointment) => {
    const title = `${appt.type} with ${appt.ownerName ?? "Client"}`;
    const details = `${appt.notes ?? "Client appointment"}${appt.videoRoomUrl ? `\nJoin: ${appt.videoRoomUrl}` : ""}`;
    const ics = buildIcs(title, appt.scheduledAt, appt.durationMins, details);
    try {
      await navigator.clipboard.writeText(ics);
      setRowError((prev) => ({ ...prev, [appt.id]: "Invite copied (.ics content)." }));
    } catch {
      setRowError((prev) => ({ ...prev, [appt.id]: "Copy failed. Browser blocked clipboard." }));
    }
  }, []);

  const appointmentsWithConflicts = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    return sorted.map((appt, index) => {
      const start = new Date(appt.scheduledAt).getTime();
      const end = start + appt.durationMins * 60_000;
      const hasConflict = sorted.some((other, otherIndex) => {
        if (index === otherIndex) return false;
        const otherStatus = normalizeStatus(other.status);
        if (otherStatus === "CANCELLED" || otherStatus === "COMPLETED" || otherStatus === "NO_SHOW") return false;
        const otherStart = new Date(other.scheduledAt).getTime();
        const otherEnd = otherStart + other.durationMins * 60_000;
        const sameOwner = (other.ownerName ?? "").trim().toLowerCase() === (appt.ownerName ?? "").trim().toLowerCase();
        return sameOwner && intersects(start, end, otherStart, otherEnd);
      });
      return { appt, hasConflict };
    });
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today = new Date(nowMs);
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();
    let list = [...appointmentsWithConflicts];

    if (q) {
      list = list.filter(({ appt }) => {
        const blob = `${appt.type} ${appt.ownerName ?? ""} ${appt.notes ?? ""} ${appt.status}`.toLowerCase();
        return blob.includes(q);
      });
    }

    if (filter === "upcoming") list = list.filter(({ appt }) => isUpcoming(appt.scheduledAt, nowMs));
    if (filter === "today") {
      list = list.filter(({ appt }) => {
        const d = new Date(appt.scheduledAt);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === date;
      });
    }
    if (filter === "pending") list = list.filter(({ appt }) => normalizeStatus(appt.status) === "PENDING");
    if (filter === "needs_attention") {
      list = list.filter(({ appt, hasConflict }) => {
        const status = normalizeStatus(appt.status);
        return hasConflict || status === "PENDING" || status === "RESCHEDULED";
      });
    }
    if (filter === "completed") list = list.filter(({ appt }) => normalizeStatus(appt.status) === "COMPLETED");
    if (filter === "cancelled") list = list.filter(({ appt }) => normalizeStatus(appt.status) === "CANCELLED" || normalizeStatus(appt.status) === "NO_SHOW");

    return list.sort((a, b) => {
      const delta = new Date(a.appt.scheduledAt).getTime() - new Date(b.appt.scheduledAt).getTime();
      return sortBy === "time_asc" ? delta : -delta;
    });
  }, [appointmentsWithConflicts, filter, nowMs, query, sortBy]);

  const upcomingCount = appointments.filter((a) => isUpcoming(a.scheduledAt, nowMs)).length;
  const pendingCount = appointments.filter((a) => normalizeStatus(a.status) === "PENDING").length;
  const confirmedCount = appointments.filter((a) => normalizeStatus(a.status) === "CONFIRMED" && isUpcoming(a.scheduledAt, nowMs)).length;
  const riskCount = appointmentsWithConflicts.filter(({ appt, hasConflict }) => hasConflict || normalizeStatus(appt.status) === "PENDING").length;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-appointments">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-appointments">
      {error && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      )}
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Scheduling</div>
        <h1 className={cx("pageTitleText")}>Appointments</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Operational scheduling with lifecycle, conflict checks, and timezone-safe display.</p>
      </div>

      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      <div className={cx("apptKpiGrid")}>
        {[
          { label: "Upcoming",  value: upcomingCount,  color: "colorAccent" },
          { label: "Pending",   value: pendingCount,   color: pendingCount > 0 ? "colorAmber" : "colorGreen" },
          { label: "Confirmed", value: confirmedCount, color: "colorGreen" },
          { label: "Needs Attention", value: riskCount, color: riskCount > 0 ? "colorRed" : "colorBlue" },
        ].map((k) => (
          <div key={k.label} className={cx("apptKpiCard")}>
            <div className={cx("apptKpiLabel")}>{k.label}</div>
            <div className={cx("apptKpiValue", k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filter row ─────────────────────────────────────────────────────── */}
      <div className={cx("apptFilterRow")}>
        {(["all", "upcoming", "today", "pending", "needs_attention", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={cx("apptFilterBtn", filter === f && "apptFilterBtnActive")}
            onClick={() => setFilter(f)}
          >
            {f.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
          </button>
        ))}
        <input
          className={cx("apptSearchInput")}
          placeholder="Search by client, type, notes, status…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className={cx("apptSortSelect")}
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as "time_asc" | "time_desc")}
          aria-label="Sort appointments"
        >
          <option value="time_asc">Time: earliest first</option>
          <option value="time_desc">Time: latest first</option>
        </select>
        <button
          type="button"
          className={cx("apptFilterBtn", "mlAuto")}
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>
      <div className={cx("apptTzMeta")}>Timezone: {timezone}. Appointment timestamps are rendered in local timezone from UTC source.</div>

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
        {filtered.map(({ appt, hasConflict }) => {
          const upcoming = isUpcoming(appt.scheduledAt, nowMs);
          const status = normalizeStatus(appt.status);
          const busyLabel = rowBusy[appt.id] ?? null;
          const noteDraft = noteDrafts[appt.id] ?? appt.notes ?? "";
          return (
            <div
              key={appt.id}
              className={cx("apptRow", !upcoming && "apptRowPast", hasConflict && "apptRowRisk")}
            >
              <div className={cx("apptRowLeft")}>
                <div className={cx("apptType")}>{appt.type}</div>
                <div className={cx("apptDateTime")}>{fmtDateTime(appt.scheduledAt, timezone)}</div>
                {appt.durationMins && (
                  <div className={cx("apptMeta")}>{formatDuration(appt.durationMins)}</div>
                )}
                {appt.ownerName && (
                  <div className={cx("apptMeta")}>Client: {appt.ownerName}</div>
                )}
                {hasConflict ? <div className={cx("apptWarnText")}>Schedule conflict detected for this client time window.</div> : null}
              </div>
              <div className={cx("apptRowRight")}>
                <span className={cx("apptStatusBadge", statusCls(appt.status))}>
                  {status}
                </span>
                <div className={cx("apptRowActions")}>
                  {status === "PENDING" && upcoming && (
                    <button
                      type="button"
                      className={cx("apptBtn", "apptBtnAccent")}
                      onClick={() => void updateAppointment(appt, { status: "CONFIRMED" }, "Confirming")}
                      disabled={Boolean(busyLabel)}
                    >
                      {busyLabel === "Confirming" ? "Confirming…" : "Confirm"}
                    </button>
                  )}
                  {(status === "CONFIRMED" || status === "PENDING" || status === "RESCHEDULED") && upcoming && (
                    <button
                      type="button"
                      className={cx("apptBtn")}
                      onClick={() => void updateAppointment(appt, { status: "CANCELLED" }, "Cancelling")}
                      disabled={Boolean(busyLabel)}
                    >
                      {busyLabel === "Cancelling" ? "Cancelling…" : "Cancel"}
                    </button>
                  )}
                  {(status === "CONFIRMED" || status === "PENDING" || status === "RESCHEDULED") && !upcoming && (
                    <>
                      <button
                        type="button"
                        className={cx("apptBtn")}
                        onClick={() => void updateAppointment(appt, { status: "COMPLETED" }, "Completing")}
                        disabled={Boolean(busyLabel)}
                      >
                        {busyLabel === "Completing" ? "Completing…" : "Complete"}
                      </button>
                      <button
                        type="button"
                        className={cx("apptBtn")}
                        onClick={() => void updateAppointment(appt, { status: "NO_SHOW" }, "Updating")}
                        disabled={Boolean(busyLabel)}
                      >
                        {busyLabel === "Updating" ? "Updating…" : "No-show"}
                      </button>
                    </>
                  )}
                  {(status === "CANCELLED" || status === "NO_SHOW") && (
                    <button
                      type="button"
                      className={cx("apptBtn")}
                      onClick={() => void updateAppointment(appt, { status: "CONFIRMED" }, "Reopening")}
                      disabled={Boolean(busyLabel)}
                    >
                      {busyLabel === "Reopening" ? "Reopening…" : "Reopen"}
                    </button>
                  )}
                  {noteDraft !== (appt.notes ?? "") && (
                    <button
                      type="button"
                      className={cx("apptBtn")}
                      onClick={() => void updateAppointment(appt, { notes: noteDraft }, "Saving note")}
                      disabled={Boolean(busyLabel)}
                    >
                      {busyLabel === "Saving note" ? "Saving…" : "Save note"}
                    </button>
                  )}
                  <button
                    type="button"
                    className={cx("apptBtn")}
                    onClick={() => void handleCopyInvite(appt)}
                    disabled={Boolean(busyLabel)}
                  >
                    Copy invite
                  </button>
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
              <div className={cx("apptRowBottom")}>
                <textarea
                  className={cx("apptNotesInput", "apptNotesInputFull")}
                  value={noteDraft}
                  placeholder="Internal appointment notes…"
                  onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [appt.id]: event.target.value }))}
                />
                {rowError[appt.id] ? <div className={cx("apptWarnText")}>{rowError[appt.id]}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
