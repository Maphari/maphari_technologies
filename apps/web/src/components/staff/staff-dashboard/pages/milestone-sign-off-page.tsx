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
        text: "Hi team - the visual direction package is ready for your review. Attached are 3 concepts; we recommend Concept B based on your brand brief.",
        time: "9:14 AM"
      },
      {
        from: "client",
        text: "Just had a look - really love the direction on B. Can we tweak the secondary colour slightly warmer?",
        time: "11:32 AM"
      },
      {
        from: "staff",
        text: "Absolutely - updated version attached. The amber is warmer as discussed.",
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
        text: "Strategy deck is live - all 4 deliverables completed. Please review and approve when ready.",
        time: "Mon 10:00 AM"
      },
      { from: "staff", text: "Following up - have you had a chance to review the deck?", time: "Wed 9:00 AM" },
      {
        from: "staff",
        text: "Hi Marcus - wanted to check in one more time before escalating to the account manager.",
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
    title: "UX Wireframes - Mobile",
    deliverables: ["Home screen wireframe", "Patient dashboard", "Booking flow", "Navigation system"],
    status: "in_revision",
    submittedAt: "3 days ago",
    dueDate: "Feb 24",
    value: 4100,
    notes: "Client requested changes to booking flow step 3 and navigation labels.",
    thread: [
      { from: "staff", text: "Mobile wireframes ready for review - all 4 screens covered.", time: "Tue 11:00 AM" },
      {
        from: "client",
        text: "Great work overall! Two things: the booking step 3 is a bit confusing, and can we simplify the nav labels?",
        time: "Tue 3:30 PM"
      },
      { from: "staff", text: "On it - revisions underway. Will have updates by Thursday.", time: "Tue 4:00 PM" }
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
        text: "Data visualisation suite complete - all charts match your brand guidelines.",
        time: "Yesterday 2:00 PM"
      },
      {
        from: "client",
        text: "These look excellent. Approving all - please proceed to the next milestone.",
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
      { from: "staff", text: "Hi - just checking in on the approval for the grid system.", time: "Feb 12 9:00 AM" },
      { from: "staff", text: "Following up again. Happy to hop on a call if that would help.", time: "Feb 14 11:00 AM" },
      { from: "staff", text: "Last follow-up before I loop in the account manager.", time: "Feb 17 2:00 PM" }
    ],
    clientRead: false,
    priority: "critical"
  }
];

const statusConfig: Record<MilestoneStatus, { label: string; icon: string }> = {
  awaiting_approval: { label: "Awaiting Approval", icon: "◷" },
  overdue: { label: "Overdue", icon: "⚠" },
  in_revision: { label: "In Revision", icon: "↺" },
  approved: { label: "Approved", icon: "✓" }
};

const priorityConfig: Record<MilestonePriority, { label: string }> = {
  critical: { label: "Critical" },
  high: { label: "High" },
  medium: { label: "Medium" },
  low: { label: "Low" }
};

function StatusBadge({ status }: { status: MilestoneStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cx("msStatusBadge")} data-status={status}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

function rowToneClass(milestone: MilestoneItem): string {
  if (milestone.status === "approved") return "msRowToneApproved";
  if (milestone.status === "in_revision") return "msRowToneRevision";
  if (milestone.status === "overdue") return "msRowToneOverdue";
  if (milestone.status === "awaiting_approval" && milestone.priority === "critical") return "msRowToneCriticalAwaiting";
  return "msRowToneAwaiting";
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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-signoff">
      <div className={cx("pageHeaderBar", "borderB", "mb20", "msHeaderBar")}> 
        <div className={cx("flexBetween", "gap24")}> 
          <div>
            <div className={cx("pageEyebrowText")}>Staff Dashboard / Project Management</div>
            <h1 className={cx("pageTitleText")}>Milestone Sign-off</h1>
          </div>

          <div className={cx("msTopStats")}>
            {[
              { label: "Awaiting client", value: counts.awaiting_approval, toneClass: "msToneAmber" },
              { label: "Overdue", value: counts.overdue, toneClass: "msToneRed" },
              { label: "Value pending", value: `$${(totalPending / 1000).toFixed(1)}k`, toneClass: "msToneAccent" }
            ].map((summary) => (
              <div key={summary.label} className={cx("msStatCard")}>
                <div className={cx("statLabelNew")}>{summary.label}</div>
                <div className={cx("statValueNew", summary.toneClass)}>{summary.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("filterRow", "mt24", "borderB", "msFilterTabs")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter milestones"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | MilestoneStatus)}
          >
            {filters.map((entry) => {
              const count = entry.key !== "all" ? counts[entry.key] : milestones.length;
              return (
                <option key={entry.key} value={entry.key}>
                  {entry.label} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className={cx("msLayout", selectedMilestone && "msLayoutWithPanel")}> 
        <div className={cx("msListPane", selectedMilestone && "msListPaneWithPanel")}>
          <div className={cx("flexCol", "gap10")}>
            {filtered.map((milestone) => {
              const priority = priorityConfig[milestone.priority];
              const isSelected = selected === milestone.id;
              return (
                <div
                  key={milestone.id}
                  className={cx("msRow", "msRowCard", rowToneClass(milestone), isSelected && "msRowCardSelected")}
                  onClick={() => setSelected(isSelected ? null : milestone.id)}
                >
                  <div className={cx("flexBetween", "gap16", "msRowHead")}> 
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("flexRow", "gap10", "mb6", "flexWrap")}>
                        <StatusBadge status={milestone.status} />
                        <span className={cx("text10", "uppercase", "msPriorityText")} data-priority={milestone.priority}>{priority.label}</span>
                        {!milestone.clientRead && milestone.status !== "approved" ? <span className={cx("text10", "msUnreadText")}>● Unread</span> : null}
                      </div>
                      <div className={cx("fontDisplay", "fw700", "mb4", "msMilestoneTitle")}>{milestone.title}</div>
                      <div className={cx("text11", "colorMuted2")}>{milestone.client} · {milestone.project}</div>
                    </div>

                    <div className={cx("textRight", "noShrink")}> 
                      <div className={cx("fontDisplay", "fw700", "colorAccent", "mb4", "msValueText")}>${milestone.value.toLocaleString()}</div>
                      <div className={cx("text10", "colorMuted2")}>Due {milestone.dueDate}</div>
                      <div className={cx("text10", "colorMuted2", "mt4")}>Sent {milestone.submittedAt}</div>
                    </div>
                  </div>

                  <div className={cx("flexRow", "gap6", "mt12", "flexWrap")}>
                    {milestone.deliverables.map((deliverable, index) => (
                      <span key={index} className={cx("msDeliverableTag")}>{deliverable}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedMilestone ? (
          <div className={cx("flexCol", "gap20", "msPanel")}>
            <div>
              <StatusBadge status={selectedMilestone.status} />
              <div className={cx("fontDisplay", "fw800", "mt10", "mb4", "msPanelTitle")}>{selectedMilestone.title}</div>
              <div className={cx("text11", "colorMuted2")}>{selectedMilestone.client} · {selectedMilestone.project}</div>
            </div>

            <div className={cx("msInfoGrid")}>
              {[
                { label: "Value", value: `$${selectedMilestone.value.toLocaleString()}`, toneClass: "msToneAccent" },
                {
                  label: "Due Date",
                  value: selectedMilestone.dueDate,
                  toneClass: selectedMilestone.status === "overdue" ? "msToneRed" : "colorMuted"
                },
                { label: "Submitted", value: selectedMilestone.submittedAt, toneClass: "colorMuted" },
                { label: "Client Read", value: selectedMilestone.clientRead ? "Yes" : "Not yet", toneClass: selectedMilestone.clientRead ? "msToneAccent" : "msToneRed" }
              ].map((item) => (
                <div key={item.label} className={cx("paStatCard")}> 
                  <div className={cx("uppercase", "mb4", "msTinyUpper")}>{item.label}</div>
                  <div className={cx("text13", "fw600", item.toneClass)}>{item.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb10", "msTinyUpper")}>Deliverables</div>
              <div className={cx("flexCol", "gap6")}>
                {selectedMilestone.deliverables.map((deliverable, index) => (
                  <div key={index} className={cx("flexRow", "gap10", "msDeliverableRow")}>
                    <div className={cx("msCheckbox", selectedMilestone.status === "approved" && "msCheckboxDone")}>
                      {selectedMilestone.status === "approved" ? "✓" : ""}
                    </div>
                    <span className={cx("text12", selectedMilestone.status === "approved" ? "colorMuted" : "colorText")}>{deliverable}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cx("msNotesBox")}>
              <div className={cx("uppercase", "mb6", "msNotesTitle")}>Your Notes</div>
              <div className={cx("text12", "colorMuted", "msNotesText")}>{selectedMilestone.notes}</div>
            </div>

            <div>
              <div className={cx("text10", "colorMuted2", "uppercase", "mb10", "msTinyUpper")}>Message Thread</div>
              <div className={cx("flexCol", "gap8")}>
                {selectedMilestone.thread.map((message, index) => (
                  <div key={index} className={cx("flexCol", message.from === "staff" ? "msThreadStaff" : "msThreadClient")}>
                    <div className={cx(message.from === "staff" ? "msBubbleStaff" : "msBubbleClient", "msThreadBubble")}>
                      <div className={cx("text11", "colorText", "msThreadText")}>{message.text}</div>
                    </div>
                    <div className={cx("mt4", "msThreadMeta")}>{message.from === "staff" ? "You" : selectedMilestone.client} · {message.time}</div>
                  </div>
                ))}
              </div>

              {!composing ? (
                <button type="button"
                  className={cx("msBtn", "wFull", "mt12", "msFollowupBtn")}
                  onClick={() => {
                    setComposing(true);
                    setDraftMsg("");
                  }}
                >
                  + Follow up with client
                </button>
              ) : (
                <div className={cx("mt12")}>
                  <textarea value={draftMsg} onChange={(event) => setDraftMsg(event.target.value)} placeholder="Write your message..." className={cx("msFormTextarea")} />
                  <div className={cx("flexRow", "gap8", "mt8")}>
                    <button
                      className={cx("msBtn", "msApproveBtn", "flex1", "uppercase", "msSendBtn")}
                      type="button"
                      onClick={() => {
                        setComposing(false);
                        setDraftMsg("");
                      }}
                    >
                      Send
                    </button>
                    <button type="button" className={cx("msBtn", "msCancelBtn")} onClick={() => setComposing(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedMilestone.status !== "approved" ? (
              <div className={cx("flexCol", "gap8")}>
                <div className={cx("text10", "colorMuted2", "uppercase", "mb4", "msTinyUpper")}>Actions</div>

                {selectedMilestone.status === "awaiting_approval" ? (
                  <div className={cx("msInfoNotice", "msInfoAwaiting")}> 
                    <div className={cx("text11", "colorAccent", "mb4")}>Awaiting client sign-off</div>
                    <div className={cx("text10", "colorMuted2")}>
                      Client {selectedMilestone.clientRead ? "has read" : "has not opened"} the submission.
                    </div>
                  </div>
                ) : null}

                {selectedMilestone.status === "overdue" ? (
                  <div className={cx("msInfoNotice", "msInfoOverdue")}>
                    <div className={cx("text11", "mb4", "msToneRed")}>Approval overdue by {selectedMilestone.submittedAt}</div>
                    <div className={cx("text10", "colorMuted2")}>Consider escalating to account manager after the next follow-up.</div>
                  </div>
                ) : null}

                {[
                  selectedMilestone.status === "in_revision"
                    ? { label: "Mark Revision Complete - Resubmit", tone: "accent" }
                    : { label: "Mark as Internally Approved", tone: "revision" },
                  { label: "Escalate to Admin", tone: "danger" }
                ].map((action) => (
                  <button key={action.label} className={cx("msBtn", "uppercase", "msActionOption", `msActionTone${action.tone[0].toUpperCase()}${action.tone.slice(1)}`)} type="button">
                    {action.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className={cx("textCenter", "msApprovedCard")}>
                <div className={cx("mb8", "msApprovedIcon")}>✓</div>
                <div className={cx("text13", "colorAccent", "fw600")}>Milestone Approved</div>
                <div className={cx("text10", "colorMuted2", "mt4")}>Payment of ${selectedMilestone.value.toLocaleString()} can be scheduled.</div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
