"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
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

  // Placeholder weekly data for chart
  const weeklyData = [
    { week: "W1", meetings: 0 },
    { week: "W2", meetings: 0 },
    { week: "W3", meetings: 0 },
    { week: "W4", meetings: 0 },
  ];

  return (
    <div className={cx(styles.pageBody)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>COMMUNICATION / MEETING ARCHIVE</div>
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

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <WidgetGrid columns={4}>
        <StatWidget label="Total Meetings" value={String(totalArchived)} sub="All time" />
        <StatWidget label="This Month" value={String(thisMonth)} tone="accent" sub="Recent meetings" />
        <StatWidget label="Avg Duration" value="—" sub="Minutes per meeting" />
        <StatWidget label="Follow-ups Pending" value={String(openActionItems)} tone={openActionItems > 0 ? "amber" : "accent"} sub="Action items open" subTone={openActionItems > 0 ? "amber" : undefined} />
      </WidgetGrid>

      {/* ── Charts & Pipeline ───────────────────────────────────────────── */}
      <WidgetGrid columns={2}>
        <ChartWidget
          label="Meetings by Week"
          data={weeklyData}
          dataKey="meetings"
          xKey="week"
          type="bar"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Meeting Types"
          stages={[
            { label: "Internal", count: 0, total: 1, color: "#8b6fff" },
            { label: "Client", count: 0, total: 1, color: "#34d98b" },
            { label: "Review", count: 0, total: 1, color: "#f5a623" },
          ]}
        />
      </WidgetGrid>

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
      <TableWidget
        label="Meeting Archive"
        rows={filtered}
        rowKey="id"
        emptyMessage="No meetings recorded yet. Historical meetings will appear here once recording is enabled."
        columns={[
          { key: "title", header: "Title", render: (_, row) => row.title },
          { key: "type", header: "Type", render: () => "—" },
          { key: "date", header: "Date", render: (_, row) => row.date },
          { key: "attendees", header: "Attendees", align: "right", render: (_, row) => String(row.attendees) },
          { key: "recording", header: "Recording", render: (_, row) => (
            <span className={cx("badge", row.recording ? "badgeGreen" : "badgeMuted")}>
              {row.recording ? "Available" : "None"}
            </span>
          )},
        ]}
      />
    </div>
  );
}
