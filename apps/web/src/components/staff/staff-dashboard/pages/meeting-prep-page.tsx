"use client";

import { useState } from "react";
import { cx } from "../style";

type Priority = "high" | "medium" | "low";
type MilestoneStatus = "awaiting_approval" | "in_progress" | "not_started" | "overdue" | "approved";
type MessageFrom = "client" | "staff";
type MainTab = "brief" | "agenda" | "thread" | "notes";

type Meeting = {
  id: number;
  client: string;
  avatar: string;
  contact: string;
  contactRole: string;
  type: string;
  time: string;
  duration: string;
  platform: string;
  link: string;
  project: string;
  urgent: boolean;
  prep: {
    lastMessages: Array<{ from: MessageFrom; text: string; time: string }>;
    openItems: Array<{ text: string; priority: Priority }>;
    upcomingMilestones: Array<{ name: string; due: string; status: MilestoneStatus }>;
    blockers: string[];
    context: string;
    hoursThisMonth: number;
    retainerPct: number;
  };
};

const meetings: Meeting[] = [
  {
    id: 1,
    client: "Volta Studios",
    avatar: "VS",
    contact: "Lena Muller",
    contactRole: "Creative Director",
    type: "Milestone Review",
    time: "Today - 2:00 PM",
    duration: "45 min",
    platform: "Google Meet",
    link: "meet.google.com/volta-review",
    project: "Brand Identity System",
    urgent: true,
    prep: {
      lastMessages: [
        { from: "client", text: "Really love the direction on B. Can we tweak the secondary colour slightly warmer?", time: "Yesterday 11:32 AM" },
        { from: "staff", text: "Absolutely - updated version attached. The amber is warmer as discussed.", time: "Yesterday 2:05 PM" },
        { from: "client", text: "Perfect. Let's review properly on the call tomorrow.", time: "Yesterday 3:40 PM" }
      ],
      openItems: [
        { text: "Logo suite awaiting formal sign-off - present updated version B", priority: "high" },
        { text: "Confirm brand guidelines scope and delivery timeline", priority: "medium" },
        { text: "Animation direction: in scope or addendum?", priority: "medium" }
      ],
      upcomingMilestones: [
        { name: "Logo & Visual Direction", due: "Feb 22", status: "awaiting_approval" },
        { name: "Brand Guidelines Doc", due: "Mar 3", status: "in_progress" },
        { name: "Animation Direction Deck", due: "Mar 10", status: "not_started" }
      ],
      blockers: ["Client sign-off on logo is 2 days overdue - primary goal of this call"],
      context:
        "Lena prefers visual references. Arrive with the updated Concept B on screen. She's the decision-maker - no need to wait for CEO input unless she brings Tobias.",
      hoursThisMonth: 49.5,
      retainerPct: 62
    }
  },
  {
    id: 2,
    client: "Mira Health",
    avatar: "MH",
    contact: "Dr. Amara Nkosi",
    contactRole: "Chief Digital Officer",
    type: "UX Review",
    time: "Tomorrow - 9:00 AM",
    duration: "60 min",
    platform: "Zoom",
    link: "zoom.us/j/mira-ux",
    project: "Website Redesign",
    urgent: false,
    prep: {
      lastMessages: [
        { from: "client", text: "Great work overall! Two things: the booking step 3 is a bit confusing, and can we simplify the nav labels?", time: "Tue 3:30 PM" },
        { from: "staff", text: "On it - revisions underway. Will have updates by Thursday.", time: "Tue 4:00 PM" },
        { from: "staff", text: "Revisions attached - booking flow simplified, nav labels updated to patient-friendly language.", time: "Thu 10:00 AM" }
      ],
      openItems: [
        { text: "Walk through revised booking flow (4-step wizard)", priority: "high" },
        { text: "Review updated navigation labels", priority: "high" },
        { text: "Confirm clinical copy review timeline for patient-facing text", priority: "medium" },
        { text: "Desktop wireframe scope - start date and delivery", priority: "low" }
      ],
      upcomingMilestones: [
        { name: "Mobile Wireframes (revised)", due: "Feb 24", status: "awaiting_approval" },
        { name: "Desktop Wireframes", due: "Feb 28", status: "not_started" },
        { name: "Component Library", due: "Mar 7", status: "not_started" }
      ],
      blockers: ["Clinical review adds 5-7 business days - get confirmation of review start date on this call"],
      context:
        "Dr. Nkosi responds fastest before 10 AM - this call is well-timed. Keep the brief under 1 page. She needs to see the revised wireframes shared screen, not a PDF.",
      hoursThisMonth: 61,
      retainerPct: 61
    }
  },
  {
    id: 3,
    client: "Kestrel Capital",
    avatar: "KC",
    contact: "Marcus Rehn",
    contactRole: "Head of Marketing",
    type: "Strategy Approval",
    time: "Thu, Feb 26 - 3:00 PM",
    duration: "30 min",
    platform: "Teams",
    link: "teams.microsoft.com/kestrel",
    project: "Q1 Campaign Strategy",
    urgent: true,
    prep: {
      lastMessages: [
        { from: "staff", text: "Strategy deck is live - all 4 deliverables completed. Please review and approve when ready.", time: "Mon 10:00 AM" },
        { from: "staff", text: "Following up - have you had a chance to review the deck?", time: "Wed 9:00 AM" },
        { from: "client", text: "Sorry for the delay - AP department has been chaotic. Reviewing now.", time: "Thu 11:00 AM" }
      ],
      openItems: [
        { text: "Get verbal approval on strategy deck - currently 5 days overdue", priority: "high" },
        { text: "Invoice status - overdue 7 days, raise gently", priority: "high" },
        { text: "Confirm channel brief delivery date (Feb 26)", priority: "medium" }
      ],
      upcomingMilestones: [
        { name: "Campaign Strategy Deck", due: "Feb 17", status: "overdue" },
        { name: "Channel Brief", due: "Feb 26", status: "in_progress" },
        { name: "Paid Media Plan", due: "Mar 5", status: "not_started" }
      ],
      blockers: [
        "Invoice 7 days overdue - escalate to account manager if not resolved on call",
        "Strategy approval blocking downstream deliverables"
      ],
      context:
        "Marcus is slow to respond but reliable when he shows up. Don't ambush him on the invoice - mention it briefly at the end. Data-first: lead with KPI framework numbers if he questions the strategy.",
      hoursThisMonth: 58.5,
      retainerPct: 97
    }
  }
];

const milestoneStatusConfig: Record<MilestoneStatus, { label: string; color: string }> = {
  awaiting_approval: { label: "Awaiting Approval", color: "#f5c518" },
  in_progress: { label: "In Progress", color: "#60a5fa" },
  not_started: { label: "Not Started", color: "var(--muted2)" },
  overdue: { label: "Overdue", color: "#ff4444" },
  approved: { label: "Approved", color: "var(--accent)" }
};

const priorityColors: Record<Priority, string> = {
  high: "#ff4444",
  medium: "#f5c518",
  low: "var(--muted2)"
};

export function MeetingPrepPage({ isActive }: { isActive: boolean }) {
  const [selected, setSelected] = useState(meetings[0].id);
  const [activeTab, setActiveTab] = useState<MainTab>("brief");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [noteText, setNoteText] = useState("");

  const meeting = meetings.find((item) => item.id === selected) ?? meetings[0];
  const { prep } = meeting;

  const toggleCheck = (key: string) => {
    setChecked((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-meeting-prep">
      <style>{`
        .meeting-item { transition: all 0.12s ease; cursor: pointer; }
        .meeting-item:hover { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; background: color-mix(in srgb, var(--accent) 3%, transparent) !important; }
        .meeting-tab-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .meeting-check-item { transition: all 0.12s ease; cursor: pointer; }
        .meeting-check-item:hover { background: rgba(255,255,255,0.02) !important; }
        .meeting-check-box { transition: all 0.12s ease; cursor: pointer; }
        .meeting-check-box:hover { border-color: var(--accent) !important; }
        .meeting-join-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .meeting-join-btn:hover { background: #a8d420 !important; }
        .meeting-bubble-client { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 4px 4px 0 4px; }
        .meeting-bubble-staff { background: color-mix(in srgb, var(--accent) 6%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 12%, transparent); border-radius: 4px 4px 4px 0; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 16 }}>
        <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
          Staff Dashboard / Communication
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
          Meeting Prep
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "calc(100vh - 160px)" }}>
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 9, color: "#333344", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4, paddingLeft: 4 }}>Upcoming</div>
          {meetings.map((item) => {
            const isSelected = selected === item.id;
            return (
              <div
                key={item.id}
                className="meeting-item"
                onClick={() => {
                  setSelected(item.id);
                  setActiveTab("brief");
                  setChecked({});
                }}
                style={{
                  padding: "12px 14px",
                  borderRadius: 3,
                  border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "rgba(255,255,255,0.06)"}`,
                  background: isSelected ? "color-mix(in srgb, var(--accent) 4%, transparent)" : "rgba(255,255,255,0.01)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 2,
                      flexShrink: 0,
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      color: "#a0a0b0"
                    }}
                  >
                    {item.avatar}
                  </div>
                  <span style={{ fontSize: 12, color: isSelected ? "#fff" : "#a0a0b0", fontWeight: isSelected ? 500 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.client}
                  </span>
                  {item.urgent ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4444", flexShrink: 0 }} /> : null}
                </div>
                <div style={{ fontSize: 10, color: "var(--muted2)", marginBottom: 3 }}>{item.type}</div>
                <div style={{ fontSize: 10, color: isSelected ? "var(--accent)" : "#333344" }}>
                  {item.time} - {item.duration}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: "#a0a0b0"
                    }}
                  >
                    {meeting.avatar}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>{meeting.client}</div>
                    <div style={{ fontSize: 11, color: "var(--muted2)" }}>
                      {meeting.contact} - {meeting.contactRole}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  {[meeting.type, meeting.time, meeting.duration, meeting.platform].map((label) => (
                    <span key={label} style={{ fontSize: 11, color: "var(--muted2)", padding: "3px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="meeting-join-btn"
                style={{
                  padding: "10px 20px",
                  background: "var(--accent)",
                  color: "#050508",
                  border: "none",
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  flexShrink: 0
                }}
              >
                Join call -
              </button>
            </div>

            <div style={{ display: "flex", gap: 0, marginTop: 16, marginBottom: -20, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 14 }}>
              {[
                { key: "brief", label: "One-page brief" },
                { key: "agenda", label: "Agenda" },
                { key: "thread", label: "Last messages" },
                { key: "notes", label: "Call notes" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  className="meeting-tab-btn"
                  onClick={() => setActiveTab(tab.key as MainTab)}
                  style={{
                    padding: "8px 16px",
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    background: "transparent",
                    color: activeTab === tab.key ? "var(--accent)" : "var(--muted2)",
                    borderBottom: `2px solid ${activeTab === tab.key ? "var(--accent)" : "transparent"}`,
                    marginBottom: -1
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: 28, flex: 1, overflowY: "auto" }}>
            {activeTab === "brief" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, maxWidth: 920 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ padding: "14px 16px", background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 3 }}>
                    <div style={{ fontSize: 9, color: "#a78bfa", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Know before you join</div>
                    <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.7 }}>{prep.context}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Open Items to Address</div>
                    {prep.openItems.map((item, index) => (
                      <div
                        key={`${item.text}-${index}`}
                        className="meeting-check-item"
                        onClick={() => toggleCheck(`open-${index}`)}
                        style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", borderRadius: 3, marginBottom: 6, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", opacity: checked[`open-${index}`] ? 0.4 : 1 }}
                      >
                        <div
                          className="meeting-check-box"
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 2,
                            flexShrink: 0,
                            marginTop: 1,
                            border: `1px solid ${checked[`open-${index}`] ? "var(--accent)" : priorityColors[item.priority]}`,
                            background: checked[`open-${index}`] ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            color: "var(--accent)"
                          }}
                        >
                          {checked[`open-${index}`] ? "✓" : ""}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "var(--text)", textDecoration: checked[`open-${index}`] ? "line-through" : "none", lineHeight: 1.4 }}>{item.text}</div>
                        </div>
                        <span style={{ fontSize: 9, color: priorityColors[item.priority], letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0, marginTop: 3 }}>{item.priority}</span>
                      </div>
                    ))}
                  </div>

                  {prep.blockers.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Blockers</div>
                      {prep.blockers.map((blocker) => (
                        <div key={blocker} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 3, background: "rgba(255,68,68,0.04)", marginBottom: 6 }}>
                          <span style={{ color: "#ff4444", fontSize: 12, flexShrink: 0 }}>⚑</span>
                          <span style={{ fontSize: 12, color: "#ff4444", lineHeight: 1.5 }}>{blocker}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ padding: 16, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Milestone Status</div>
                    {prep.upcomingMilestones.map((milestone, index) => {
                      const status = milestoneStatusConfig[milestone.status];
                      return (
                        <div key={`${milestone.name}-${index}`} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: index < prep.upcomingMilestones.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <div style={{ fontSize: 11, color: "var(--text)", marginBottom: 3, lineHeight: 1.3 }}>{milestone.name}</div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 10, color: status.color }}>{status.label}</span>
                            <span style={{ fontSize: 10, color: "var(--muted2)" }}>{milestone.due}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ padding: 14, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Account snapshot</div>
                    {[
                      { label: "Hours this month", value: `${prep.hoursThisMonth}h` },
                      { label: "Retainer burn", value: `${prep.retainerPct}%`, color: prep.retainerPct > 90 ? "#ff4444" : prep.retainerPct > 70 ? "#f5c518" : "var(--accent)" },
                      { label: "Open items", value: prep.openItems.length.toString() }
                    ].map((item) => (
                      <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ fontSize: 11, color: "var(--muted2)" }}>{item.label}</span>
                        <span style={{ fontSize: 11, color: item.color ?? "#a0a0b0" }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "agenda" ? (
              <div style={{ maxWidth: 560 }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
                  Suggested Agenda - {meeting.duration}
                </div>
                {prep.openItems.map((item, index) => {
                  const timeSlot = Math.floor(parseInt(meeting.duration, 10) / prep.openItems.length);
                  return (
                    <div
                      key={`${item.text}-${index}`}
                      className="meeting-check-item"
                      onClick={() => toggleCheck(`agenda-${index}`)}
                      style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", marginBottom: 8, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)", opacity: checked[`agenda-${index}`] ? 0.4 : 1 }}
                    >
                      <div
                        className="meeting-check-box"
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 2,
                          flexShrink: 0,
                          marginTop: 1,
                          border: `1px solid ${checked[`agenda-${index}`] ? "var(--accent)" : "rgba(255,255,255,0.15)"}`,
                          background: checked[`agenda-${index}`] ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          color: "var(--accent)"
                        }}
                      >
                        {checked[`agenda-${index}`] ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "var(--text)", textDecoration: checked[`agenda-${index}`] ? "line-through" : "none" }}>{item.text}</span>
                          <span style={{ fontSize: 10, color: "var(--muted2)", flexShrink: 0, marginLeft: 12 }}>{timeSlot} min</span>
                        </div>
                        <span style={{ fontSize: 9, color: priorityColors[item.priority], letterSpacing: "0.1em", textTransform: "uppercase" }}>{item.priority} priority</span>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 16, padding: "12px 16px", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 3, fontSize: 11, color: "#333344", textAlign: "center", cursor: "pointer" }}>
                  + Add agenda item
                </div>
              </div>
            ) : null}

            {activeTab === "thread" ? (
              <div style={{ maxWidth: 540 }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Last 3 Messages</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {prep.lastMessages.map((message, index) => (
                    <div key={`${message.time}-${index}`} style={{ display: "flex", flexDirection: "column", alignItems: message.from === "staff" ? "flex-start" : "flex-end" }}>
                      <div className={message.from === "staff" ? "meeting-bubble-staff" : "meeting-bubble-client"} style={{ maxWidth: "85%", padding: "10px 14px" }}>
                        <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>{message.text}</div>
                      </div>
                      <div style={{ fontSize: 9, color: "var(--muted2)", marginTop: 4, paddingLeft: 4, paddingRight: 4 }}>
                        {message.from === "staff" ? "You" : meeting.contact} - {message.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "notes" ? (
              <div style={{ maxWidth: 640 }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                  Call Notes - {meeting.client} - {meeting.time}
                </div>
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  placeholder={`Notes from the ${meeting.type} call...\n\n- Decisions made\n- Actions agreed\n- Follow-ups`}
                  style={{
                    width: "100%",
                    minHeight: 320,
                    padding: 16,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 3,
                    color: "var(--text)",
                    fontSize: 13,
                    lineHeight: 1.8
                  }}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button type="button" style={{ padding: "10px 20px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
                    Save to decision log
                  </button>
                  <button type="button" style={{ padding: "10px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, color: "var(--muted2)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
                    Copy notes
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
