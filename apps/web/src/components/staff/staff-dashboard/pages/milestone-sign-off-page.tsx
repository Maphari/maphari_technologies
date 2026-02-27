"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type MilestoneStatus = "awaiting_approval" | "overdue" | "in_revision" | "approved";
type MilestonePriority = "critical" | "high" | "medium" | "low";

type MilestoneItem = {
  id: number;
  project: string;
  client: string;
  title: string;
  deliverables: string[];
  status: MilestoneStatus;
  submittedAt: string;
  dueDate: string;
  value: number;
  notes: string;
  thread: Array<{ from: "staff" | "client"; text: string; time: string }>;
  clientRead: boolean;
  priority: MilestonePriority;
};

const milestones: MilestoneItem[] = [
  {
    id: 1,
    project: "Brand Identity System",
    client: "Volta Studios",
    title: "Logo & Visual Direction",
    deliverables: ["Primary logo suite", "Color palette", "Typography system", "Brand mood board"],
    status: "awaiting_approval",
    submittedAt: "2 hours ago",
    dueDate: "Feb 22",
    value: 3200,
    notes: "Presented 3 concepts. Client indicated direction B was strongest in last call.",
    thread: [
      {
        from: "staff",
        text: "Hi team — the visual direction package is ready for your review. Attached are 3 concepts; we recommend Concept B based on your brand brief.",
        time: "9:14 AM"
      },
      {
        from: "client",
        text: "Just had a look — really love the direction on B. Can we tweak the secondary colour slightly warmer?",
        time: "11:32 AM"
      },
      {
        from: "staff",
        text: "Absolutely — updated version attached. The amber is warmer as discussed.",
        time: "2:05 PM"
      }
    ],
    clientRead: true,
    priority: "high"
  },
  {
    id: 2,
    project: "Q1 Campaign Strategy",
    client: "Kestrel Capital",
    title: "Campaign Strategy Deck",
    deliverables: ["Audience segmentation", "Channel strategy", "Content calendar", "KPI framework"],
    status: "overdue",
    submittedAt: "5 days ago",
    dueDate: "Feb 16",
    value: 5800,
    notes: "Client hasn't responded to 3 follow-up messages. May need escalation.",
    thread: [
      {
        from: "staff",
        text: "Strategy deck is live — all 4 deliverables completed. Please review and approve when ready.",
        time: "Mon 10:00 AM"
      },
      { from: "staff", text: "Following up — have you had a chance to review the deck?", time: "Wed 9:00 AM" },
      {
        from: "staff",
        text: "Hi Marcus — wanted to check in one more time before escalating to the account manager.",
        time: "Fri 2:00 PM"
      }
    ],
    clientRead: false,
    priority: "critical"
  },
  {
    id: 3,
    project: "Website Redesign",
    client: "Mira Health",
    title: "UX Wireframes — Mobile",
    deliverables: ["Home screen wireframe", "Patient dashboard", "Booking flow", "Navigation system"],
    status: "in_revision",
    submittedAt: "3 days ago",
    dueDate: "Feb 24",
    value: 4100,
    notes: "Client requested changes to booking flow step 3 and navigation labels.",
    thread: [
      { from: "staff", text: "Mobile wireframes ready for review — all 4 screens covered.", time: "Tue 11:00 AM" },
      {
        from: "client",
        text: "Great work overall! Two things: the booking step 3 is a bit confusing, and can we simplify the nav labels?",
        time: "Tue 3:30 PM"
      },
      { from: "staff", text: "On it — revisions underway. Will have updates by Thursday.", time: "Tue 4:00 PM" }
    ],
    clientRead: true,
    priority: "medium"
  },
  {
    id: 4,
    project: "Annual Report 2025",
    client: "Okafor & Sons",
    title: "Data Visualisation Suite",
    deliverables: ["Revenue charts", "Regional breakdown", "Growth timeline", "Executive summary page"],
    status: "approved",
    submittedAt: "1 day ago",
    dueDate: "Feb 20",
    value: 2900,
    notes: "Approved with no changes. Client left a positive note.",
    thread: [
      {
        from: "staff",
        text: "Data visualisation suite complete — all charts match your brand guidelines.",
        time: "Yesterday 2:00 PM"
      },
      {
        from: "client",
        text: "These look excellent. Approving all — please proceed to the next milestone.",
        time: "Yesterday 4:45 PM"
      }
    ],
    clientRead: true,
    priority: "low"
  },
  {
    id: 5,
    project: "Editorial Design System",
    client: "Dune Collective",
    title: "Type & Grid System",
    deliverables: ["Type scale", "Grid specification", "Component spacing rules", "Usage documentation"],
    status: "awaiting_approval",
    submittedAt: "12 days ago",
    dueDate: "Feb 10",
    value: 6200,
    notes: "Significantly overdue for approval. No client activity in portal for 6 days.",
    thread: [
      { from: "staff", text: "Type and grid system is complete. Full documentation attached.", time: "Feb 9 10:00 AM" },
      { from: "staff", text: "Hi — just checking in on the approval for the grid system.", time: "Feb 12 9:00 AM" },
      { from: "staff", text: "Following up again. Happy to hop on a call if that would help.", time: "Feb 14 11:00 AM" },
      { from: "staff", text: "Last follow-up before I loop in the account manager.", time: "Feb 17 2:00 PM" }
    ],
    clientRead: false,
    priority: "critical"
  }
];

const statusConfig: Record<MilestoneStatus, { label: string; color: string; bg: string; icon: string }> = {
  awaiting_approval: { label: "Awaiting Approval", color: "#f5c518", bg: "rgba(245,197,24,0.1)", icon: "◷" },
  overdue: { label: "Overdue", color: "#ff4444", bg: "rgba(255,68,68,0.1)", icon: "⚠" },
  in_revision: { label: "In Revision", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: "↺" },
  approved: { label: "Approved", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 10%, transparent)", icon: "✓" }
};

const priorityConfig: Record<MilestonePriority, { label: string; color: string }> = {
  critical: { label: "Critical", color: "#ff4444" },
  high: { label: "High", color: "#f5c518" },
  medium: { label: "Medium", color: "#a0a0b0" },
  low: { label: "Low", color: "var(--muted2)" }
};

function StatusBadge({ status }: { status: MilestoneStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 2,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: "'DM Mono', monospace"
      }}
    >
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

export function MilestoneSignOffPage({ isActive }: { isActive: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | MilestoneStatus>("all");
  const [composing, setComposing] = useState(false);
  const [draftMsg, setDraftMsg] = useState("");

  const filters: Array<{ key: "all" | MilestoneStatus; label: string }> = [
    { key: "all", label: "All" },
    { key: "awaiting_approval", label: "Awaiting" },
    { key: "overdue", label: "Overdue" },
    { key: "in_revision", label: "In Revision" },
    { key: "approved", label: "Approved" }
  ];

  const filtered = useMemo(
    () => milestones.filter((milestone) => (filter === "all" ? true : milestone.status === filter)),
    [filter]
  );
  const selectedMilestone = selected ? milestones.find((milestone) => milestone.id === selected) ?? null : null;

  const counts = useMemo(
    () => ({
      awaiting_approval: milestones.filter((milestone) => milestone.status === "awaiting_approval").length,
      overdue: milestones.filter((milestone) => milestone.status === "overdue").length,
      in_revision: milestones.filter((milestone) => milestone.status === "in_revision").length,
      approved: milestones.filter((milestone) => milestone.status === "approved").length
    }),
    []
  );

  const totalPending = useMemo(
    () =>
      milestones
        .filter((milestone) => ["awaiting_approval", "overdue"].includes(milestone.status))
        .reduce((sum, milestone) => sum + milestone.value, 0),
    []
  );

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-signoff">
      <style>{`
        .ms-row { transition: all 0.15s ease; cursor: pointer; }
        .ms-row:hover { background: color-mix(in srgb, var(--accent) 3%, transparent) !important; border-color: color-mix(in srgb, var(--accent) 15%, transparent) !important; }
        .ms-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .ms-btn:hover { opacity: 0.8; }
        .ms-approve-btn:hover { background: #a8d420 !important; }
        .ms-action-btn { transition: all 0.15s ease; cursor: pointer; }
        .ms-action-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .ms-bubble-staff { background: color-mix(in srgb, var(--accent) 8%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 15%, transparent); border-radius: 4px 4px 4px 0; }
        .ms-bubble-client { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 4px 4px 0 4px; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Project Management
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Milestone Sign-off
            </h1>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Awaiting client", value: counts.awaiting_approval, color: "#f5c518" },
              { label: "Overdue", value: counts.overdue, color: "#ff4444" },
              { label: "Value pending", value: `$${(totalPending / 1000).toFixed(1)}k`, color: "var(--accent)" }
            ].map((summary) => (
              <div key={summary.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                  {summary.label}
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: summary.color }}>
                  {summary.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 0, marginTop: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {filters.map((entry) => {
            const count = entry.key !== "all" ? counts[entry.key] : milestones.length;
            const isActive = filter === entry.key;
            return (
              <button
                key={entry.key}
                className="ms-btn"
                onClick={() => setFilter(entry.key)}
                type="button"
                style={{
                  padding: "10px 20px",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  border: "none",
                  borderBottom: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                  background: "transparent",
                  color: isActive ? "var(--accent)" : "var(--muted2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: -1
                }}
              >
                {entry.label}
                {count > 0 ? (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 6px",
                      borderRadius: 10,
                      background: isActive ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "rgba(255,255,255,0.06)",
                      color: isActive ? "var(--accent)" : "var(--muted2)"
                    }}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedMilestone ? "1fr 420px" : "1fr", minHeight: "calc(100vh - 250px)" }}>
        <div style={{ padding: "0 0 8px", borderRight: selectedMilestone ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((milestone) => {
              const priority = priorityConfig[milestone.priority];
              const isSelected = selected === milestone.id;
              return (
                <div
                  key={milestone.id}
                  className="ms-row"
                  onClick={() => setSelected(isSelected ? null : milestone.id)}
                  style={{
                    padding: "18px 20px",
                    border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "rgba(255,255,255,0.06)"}`,
                    borderLeft: `3px solid ${
                      milestone.status === "overdue" || (milestone.status === "awaiting_approval" && milestone.priority === "critical")
                        ? "#ff4444"
                        : milestone.status === "approved"
                        ? "var(--accent)"
                        : milestone.status === "in_revision"
                        ? "#a78bfa"
                        : "rgba(245,197,24,0.5)"
                    }`,
                    borderRadius: "0 4px 4px 0",
                    background: isSelected ? "color-mix(in srgb, var(--accent) 2%, transparent)" : "rgba(255,255,255,0.01)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <StatusBadge status={milestone.status} />
                        <span style={{ fontSize: 10, color: priority.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          {priority.label}
                        </span>
                        {!milestone.clientRead && milestone.status !== "approved" ? (
                          <span style={{ fontSize: 10, color: "#ff4444", letterSpacing: "0.08em" }}>● Unread</span>
                        ) : null}
                      </div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                        {milestone.title}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted2)" }}>
                        {milestone.client} · {milestone.project}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>
                        ${milestone.value.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted2)" }}>Due {milestone.dueDate}</div>
                      <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>Sent {milestone.submittedAt}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                    {milestone.deliverables.map((deliverable, index) => (
                      <span
                        key={index}
                        style={{
                          fontSize: 10,
                          padding: "3px 8px",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 2,
                          color: "var(--muted2)"
                        }}
                      >
                        {deliverable}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedMilestone ? (
          <div style={{ padding: "0 0 0 28px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
            <div>
              <StatusBadge status={selectedMilestone.status} />
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginTop: 10, marginBottom: 4 }}>
                {selectedMilestone.title}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted2)" }}>
                {selectedMilestone.client} · {selectedMilestone.project}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Value", value: `$${selectedMilestone.value.toLocaleString()}`, color: "var(--accent)" },
                {
                  label: "Due Date",
                  value: selectedMilestone.dueDate,
                  color: selectedMilestone.status === "overdue" ? "#ff4444" : "#a0a0b0"
                },
                { label: "Submitted", value: selectedMilestone.submittedAt, color: "#a0a0b0" },
                { label: "Client Read", value: selectedMilestone.clientRead ? "Yes" : "Not yet", color: selectedMilestone.clientRead ? "var(--accent)" : "#ff4444" }
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 3
                  }}
                >
                  <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 13, color: item.color, fontWeight: 500 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                Deliverables
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selectedMilestone.deliverables.map((deliverable, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.01)"
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 2,
                        border: `1px solid ${selectedMilestone.status === "approved" ? "var(--accent)" : "rgba(255,255,255,0.2)"}`,
                        background: selectedMilestone.status === "approved" ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "var(--accent)",
                        flexShrink: 0
                      }}
                    >
                      {selectedMilestone.status === "approved" ? "✓" : ""}
                    </div>
                    <span style={{ fontSize: 12, color: selectedMilestone.status === "approved" ? "#a0a0b0" : "var(--text)" }}>{deliverable}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "12px 14px", background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 3 }}>
              <div style={{ fontSize: 9, color: "#a78bfa", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                Your Notes
              </div>
              <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.6 }}>{selectedMilestone.notes}</div>
            </div>

            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                Message Thread
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedMilestone.thread.map((message, index) => (
                  <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: message.from === "staff" ? "flex-start" : "flex-end" }}>
                    <div className={message.from === "staff" ? "ms-bubble-staff" : "ms-bubble-client"} style={{ maxWidth: "88%", padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.5 }}>{message.text}</div>
                    </div>
                    <div style={{ fontSize: 9, color: "var(--muted2)", marginTop: 3, padding: "0 4px" }}>
                      {message.from === "staff" ? "You" : selectedMilestone.client} · {message.time}
                    </div>
                  </div>
                ))}
              </div>

              {!composing ? (
                <button
                  className="ms-btn"
                  onClick={() => {
                    setComposing(true);
                    setDraftMsg("");
                  }}
                  type="button"
                  style={{
                    marginTop: 12,
                    width: "100%",
                    padding: "10px",
                    border: "1px dashed rgba(255,255,255,0.12)",
                    borderRadius: 3,
                    background: "transparent",
                    color: "var(--muted2)",
                    fontSize: 11,
                    letterSpacing: "0.06em"
                  }}
                >
                  + Follow up with client
                </button>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    value={draftMsg}
                    onChange={(event) => setDraftMsg(event.target.value)}
                    placeholder="Write your message..."
                    style={{
                      width: "100%",
                      padding: 12,
                      minHeight: 80,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                      borderRadius: 3,
                      color: "var(--text)",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      className="ms-btn ms-approve-btn"
                      type="button"
                      onClick={() => {
                        setComposing(false);
                        setDraftMsg("");
                      }}
                      style={{
                        flex: 1,
                        padding: "9px",
                        background: "var(--accent)",
                        color: "#050508",
                        border: "none",
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase"
                      }}
                    >
                      Send
                    </button>
                    <button
                      className="ms-btn"
                      onClick={() => setComposing(false)}
                      type="button"
                      style={{
                        padding: "9px 16px",
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 3,
                        color: "var(--muted2)",
                        fontSize: 11,
                        letterSpacing: "0.06em"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedMilestone.status !== "approved" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                  Actions
                </div>
                {selectedMilestone.status === "awaiting_approval" ? (
                  <div style={{ padding: "12px 14px", border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)", borderRadius: 3, background: "color-mix(in srgb, var(--accent) 4%, transparent)" }}>
                    <div style={{ fontSize: 11, color: "var(--accent)", marginBottom: 4 }}>Awaiting client sign-off</div>
                    <div style={{ fontSize: 10, color: "var(--muted2)" }}>
                      Client {selectedMilestone.clientRead ? "has read" : "has not opened"} the submission.
                    </div>
                  </div>
                ) : null}
                {selectedMilestone.status === "overdue" ? (
                  <div style={{ padding: "12px 14px", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 3, background: "rgba(255,68,68,0.04)" }}>
                    <div style={{ fontSize: 11, color: "#ff4444", marginBottom: 4 }}>Approval overdue by {selectedMilestone.submittedAt}</div>
                    <div style={{ fontSize: 10, color: "var(--muted2)" }}>Consider escalating to account manager after the next follow-up.</div>
                  </div>
                ) : null}
                {[
                  selectedMilestone.status === "in_revision"
                    ? {
                        label: "Mark Revision Complete — Resubmit",
                        color: "var(--accent)",
                        bg: "color-mix(in srgb, var(--accent) 10%, transparent)",
                        border: "color-mix(in srgb, var(--accent) 20%, transparent)"
                      }
                    : {
                        label: "Mark as Internally Approved",
                        color: "#a78bfa",
                        bg: "rgba(167,139,250,0.08)",
                        border: "rgba(167,139,250,0.2)"
                      },
                  { label: "Escalate to Admin", color: "#ff4444", bg: "rgba(255,68,68,0.06)", border: "rgba(255,68,68,0.2)" }
                ].map((action) => (
                  <button
                    key={action.label}
                    className="ms-btn"
                    type="button"
                    style={{
                      padding: "11px 16px",
                      border: `1px solid ${action.border}`,
                      borderRadius: 3,
                      background: action.bg,
                      color: action.color,
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      textAlign: "left"
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ padding: 16, border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 3, background: "color-mix(in srgb, var(--accent) 6%, transparent)", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>Milestone Approved</div>
                <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 4 }}>
                  Payment of ${selectedMilestone.value.toLocaleString()} can be scheduled.
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
