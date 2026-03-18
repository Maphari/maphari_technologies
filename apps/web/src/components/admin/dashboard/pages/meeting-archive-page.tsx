"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

type Tab = "all meetings" | "with recording" | "action items";

const archiveMeetings: Array<{
  id: string;
  title: string;
  client: string;
  date: string;
  duration: string;
  attendees: number;
  recording: boolean;
  actionItems: "open" | "resolved" | "none";
}> = [];

const tabs: Tab[] = ["all meetings", "with recording", "action items"];

// Meeting archive: backend implementation is pending (Batch 6).
// The session prop is accepted for future wiring; no API call is made yet.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MeetingArchivePage({ session: _session }: { session?: import("../../../../lib/auth/session").AuthSession | null }) {
  const [activeTab, setActiveTab] = useState<Tab>("all meetings");

  const totalArchived = archiveMeetings.length;
  const thisMonth = archiveMeetings.filter((m) => m.date.includes("Feb 2026") || m.date.includes("Mar 2026")).length;
  const withRecording = archiveMeetings.filter((m) => m.recording).length;
  const openActionItems = archiveMeetings.filter((m) => m.actionItems === "open").length;

  const filtered =
    activeTab === "all meetings"
      ? archiveMeetings
      : activeTab === "with recording"
      ? archiveMeetings.filter((m) => m.recording)
      : archiveMeetings.filter((m) => m.actionItems === "open");

  function exportCsv(): void {
    const rows = [
      ["Meeting", "Client", "Date", "Duration", "Attendees", "Recording", "Action Items"].join(","),
      ...filtered.map((m) =>
        [m.title, m.client, m.date, m.duration, String(m.attendees), m.recording ? "Yes" : "No", m.actionItems]
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-archive-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={cx(styles.pageBody)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / COMMUNICATION</div>
          <h1 className={styles.pageTitle}>Meeting Archive</h1>
          <div className={styles.pageSub}>Browse past meetings, recordings, and outstanding action items</div>
        </div>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            disabled={filtered.length === 0}
            title={filtered.length > 0 ? "Export current view as CSV" : "No meetings to export"}
            onClick={exportCsv}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className={styles.cjKpiGrid}>
        {[
          { label: "Total Archived", value: String(totalArchived), sub: "All time", color: "var(--blue)" },
          { label: "This Month", value: String(thisMonth), sub: "Recent meetings", color: "var(--accent)" },
          { label: "With Recording", value: String(withRecording), sub: "Available to replay", color: "var(--amber)" },
          { label: "Action Items Open", value: String(openActionItems), sub: "Unresolved", color: "var(--red)" },
        ].map((k) => (
          <div key={k.label} className={cx(styles.cjKpiCard, toneClass(k.color))}>
            <div className={styles.cjKpiLabel}>{k.label}</div>
            <div className={cx(styles.cjKpiValue, toneClass(k.color))}>{k.value}</div>
            <div className={styles.cjKpiMeta}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className={styles.teamFilters}>
        {tabs.map((t) => (
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

      {/* ── Table ── */}
      <div className={styles.teamSection}>
        <div className={styles.teamSectionHeader}>
          <span className={styles.teamSectionTitle}>Meeting Archive</span>
          <span className={styles.teamSectionMeta}>{filtered.length} MEETINGS</span>
        </div>
        <div className={styles.mtaHead}>
          {["Meeting", "Client", "Date", "Duration", "Attendees", "Recording", "Action Items"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className={cx("p24", "colorMuted", "text12", "textCenter")}>
            No meetings recorded yet. Historical meetings will appear here once recording is enabled.
          </div>
        ) : filtered.map((m) => (
          <div key={m.id} className={styles.mtaRow}>
            <span className={cx("fw600", "text13")}>{m.title}</span>
            <span className={cx("text12", "colorMuted")}>{m.client}</span>
            <span className={cx("fontMono", "text12")}>{m.date}</span>
            <span className={cx("text12", "colorMuted")}>{m.duration}</span>
            <span className={cx("fontMono", "text12")}>{m.attendees}</span>
            <span className={cx("badge", m.recording ? "badgeBlue" : "badgeMuted")}>
              {m.recording ? "Available" : "None"}
            </span>
            <span className={cx("badge", m.actionItems === "open" ? "badgeAmber" : m.actionItems === "resolved" ? "badgeGreen" : "badgeMuted")}>
              {m.actionItems}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
