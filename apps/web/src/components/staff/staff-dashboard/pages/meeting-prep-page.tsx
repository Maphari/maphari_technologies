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

const milestoneStatusConfig: Record<MilestoneStatus, { label: string; toneClass: string }> = {
  awaiting_approval: { label: "Awaiting Approval", toneClass: "mpToneAmber" },
  in_progress: { label: "In Progress", toneClass: "mpToneBlue" },
  not_started: { label: "Not Started", toneClass: "mpToneMuted2" },
  overdue: { label: "Overdue", toneClass: "mpToneRed" },
  approved: { label: "Approved", toneClass: "mpToneAccent" }
};

const priorityConfig: Record<Priority, { toneClass: string; boxClass: string }> = {
  high: { toneClass: "mpToneRed", boxClass: "mpCheckBoxHigh" },
  medium: { toneClass: "mpToneAmber", boxClass: "mpCheckBoxMedium" },
  low: { toneClass: "mpToneMuted2", boxClass: "mpCheckBoxLow" }
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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-meeting-prep">
      <div className={cx("pageHeaderBar", "borderB", "pb16")}>
        <div className={cx("pageEyebrow")}>
          Staff Dashboard / Communication
        </div>
        <h1 className={cx("pageTitle")}>
          Meeting Prep
        </h1>
      </div>

      <div className={cx("mpLayout")}>
        <div className={cx("mpSidebar")}>
          <div className={cx("mpSidebarLabel")}>Upcoming</div>
          {meetings.map((item) => {
            const isSelected = selected === item.id;
            return (
              <div
                key={item.id}
                className={cx("mpMeetingItem", isSelected && "mpMeetingItemActive")}
                onClick={() => {
                  setSelected(item.id);
                  setActiveTab("brief");
                  setChecked({});
                }}
              >
                <div className={cx("flexRow", "gap8", "mb6")}>
                  <div className={cx("mpAvatar24")}>
                    {item.avatar}
                  </div>
                  <span className={cx("mpMeetingClient", isSelected && "mpMeetingClientActive")}>
                    {item.client}
                  </span>
                  {item.urgent ? <div className={cx("mpUrgentDot")} /> : null}
                </div>
                <div className={cx("text10", "colorMuted2", "mb4")}>{item.type}</div>
                <div className={cx("text10", isSelected ? "mpToneAccent" : "mpToneMuted2")}>
                  {item.time} - {item.duration}
                </div>
              </div>
            );
          })}
        </div>

        <div className={cx("flexCol")}>
          <div className={cx("mpDetailHeader")}>
            <div className={cx("mpDetailHeaderTop")}>
              <div>
                <div className={cx("flexRow", "gap10", "mb6")}>
                  <div className={cx("mpAvatar32")}>
                    {meeting.avatar}
                  </div>
                  <div>
                    <div className={cx("fontDisplay", "fw800", "colorText", "mpClientName")}>{meeting.client}</div>
                    <div className={cx("text11", "colorMuted2")}>
                      {meeting.contact} - {meeting.contactRole}
                    </div>
                  </div>
                </div>
                <div className={cx("flexRow", "gap16", "mt8")}>
                  {[meeting.type, meeting.time, meeting.duration, meeting.platform].map((label) => (
                    <span key={label} className={cx("mpMetaBadge")}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className={cx("mpJoinBtn")}
              >
                Join call -
              </button>
            </div>

            <div className={cx("mpTabBar")}>
              {[
                { key: "brief", label: "One-page brief" },
                { key: "agenda", label: "Agenda" },
                { key: "thread", label: "Last messages" },
                { key: "notes", label: "Call notes" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={cx("mpTabBtn", activeTab === tab.key && "mpTabBtnActive")}
                  onClick={() => setActiveTab(tab.key as MainTab)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className={cx("mpTabContent")}>
            {activeTab === "brief" ? (
              <div className={cx("mpBriefGrid")}>
                <div className={cx("flexCol", "gap20")}>
                  <div className={cx("mpContextBox")}>
                    <div className={cx("mpContextLabel")}>Know before you join</div>
                    <div className={cx("text12", "colorMuted", "mpContextText")}>{prep.context}</div>
                  </div>

                  <div>
                    <div className={cx("mpSectionLabel", "mb12")}>Open Items to Address</div>
                    {prep.openItems.map((item, index) => (
                      <div key={`${item.text}-${index}`} className={cx("mpCheckItem", checked[`open-${index}`] ? "mpRowDone" : "mpRowActive")} onClick={() => toggleCheck(`open-${index}`)}>
                        <div
                          className={cx("mpCheckBox", checked[`open-${index}`] ? "mpCheckBoxChecked" : priorityConfig[item.priority].boxClass)}
                        >
                          {checked[`open-${index}`] ? "\u2713" : ""}
                        </div>
                        <div className={cx("flex1")}>
                          <div className={cx("text12", "colorText", "mpItemText", checked[`open-${index}`] && "mpItemTextDone")}>{item.text}</div>
                        </div>
                        <span className={cx("mpPriorityLabel", priorityConfig[item.priority].toneClass)}>{item.priority}</span>
                      </div>
                    ))}
                  </div>

                  {prep.blockers.length > 0 ? (
                    <div>
                      <div className={cx("mpSectionLabel", "mb10")}>Blockers</div>
                      {prep.blockers.map((blocker) => (
                        <div key={blocker} className={cx("mpBlocker")}>
                          <span className={cx("colorRed", "text12", "noShrink")}>&#9873;</span>
                          <span className={cx("text12", "colorRed", "mpBlockerText")}>{blocker}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className={cx("flexCol", "gap16")}>
                  <div className={cx("mpSideCard")}>
                    <div className={cx("mpSectionLabel", "mb12")}>Milestone Status</div>
                    {prep.upcomingMilestones.map((milestone, index) => {
                      const status = milestoneStatusConfig[milestone.status];
                      const isLast = index === prep.upcomingMilestones.length - 1;
                      return (
                        <div key={`${milestone.name}-${index}`} className={cx("mpMilestoneRow", !isLast && "mpMilestoneRowBorder")}>
                          <div className={cx("text11", "colorText", "mb4", "mpMilestoneName")}>{milestone.name}</div>
                          <div className={cx("flexBetween")}>
                            <span className={cx("text10", status.toneClass)}>{status.label}</span>
                            <span className={cx("text10", "colorMuted2")}>{milestone.due}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={cx("mpSideCard")}>
                    <div className={cx("mpSectionLabel", "mb12")}>Account snapshot</div>
                    {[
                      { label: "Hours this month", value: `${prep.hoursThisMonth}h` },
                      { label: "Retainer burn", value: `${prep.retainerPct}%`, toneClass: prep.retainerPct > 90 ? "mpToneRed" : prep.retainerPct > 70 ? "mpToneAmber" : "mpToneAccent" },
                      { label: "Open items", value: prep.openItems.length.toString() }
                    ].map((item) => (
                      <div key={item.label} className={cx("mpSnapshotRow")}>
                        <span className={cx("text11", "colorMuted2")}>{item.label}</span>
                        <span className={cx("text11", item.toneClass ?? "colorMuted")}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "agenda" ? (
              <div className={cx("mpAgendaWrap")}>
                <div className={cx("mpSectionLabel", "mb16")}>
                  Suggested Agenda - {meeting.duration}
                </div>
                {prep.openItems.map((item, index) => {
                  const timeSlot = Math.floor(parseInt(meeting.duration, 10) / prep.openItems.length);
                  return (
                    <div key={`${item.text}-${index}`} className={cx("mpAgendaItem", checked[`agenda-${index}`] ? "mpRowDone" : "mpRowActive")} onClick={() => toggleCheck(`agenda-${index}`)}>
                      <div
                        className={cx("mpCheckBox", checked[`agenda-${index}`] ? "mpCheckBoxChecked" : "mpCheckBoxNeutral")}
                      >
                        {checked[`agenda-${index}`] ? "\u2713" : ""}
                      </div>
                      <div className={cx("flex1")}>
                        <div className={cx("flexBetween", "mb4")}>
                          <span className={cx("text12", "colorText", checked[`agenda-${index}`] && "mpItemTextDone")}>{item.text}</span>
                          <span className={cx("text10", "colorMuted2", "noShrink", "mpTimeSlot")}>{timeSlot} min</span>
                        </div>
                        <span className={cx("mpPriorityLabel", priorityConfig[item.priority].toneClass)}>{item.priority} priority</span>
                      </div>
                    </div>
                  );
                })}
                <div className={cx("mpAddAgendaBtn")}>
                  + Add agenda item
                </div>
              </div>
            ) : null}

            {activeTab === "thread" ? (
              <div className={cx("mpThreadWrap")}>
                <div className={cx("mpSectionLabel", "mb16")}>Last 3 Messages</div>
                <div className={cx("flexCol", "gap10")}>
                  {prep.lastMessages.map((message, index) => (
                    <div key={`${message.time}-${index}`} className={cx("flexCol", message.from === "staff" ? "mpMsgLeft" : "mpMsgRight")}>
                      <div className={cx("mpBubble", message.from === "staff" ? "mpBubbleStaff" : "mpBubbleClient")}>
                        <div className={cx("text12", "colorText", "mpBubbleText")}>{message.text}</div>
                      </div>
                      <div className={cx("mpBubbleMeta")}>
                        {message.from === "staff" ? "You" : meeting.contact} - {message.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "notes" ? (
              <div className={cx("mpNotesWrap")}>
                <div className={cx("mpSectionLabel", "mb14")}>
                  Call Notes - {meeting.client} - {meeting.time}
                </div>
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  placeholder={`Notes from the ${meeting.type} call...\n\n- Decisions made\n- Actions agreed\n- Follow-ups`}
                  className={cx("mpNoteInput")}
                />
                <div className={cx("flexRow", "gap10", "mt12")}>
                  <button type="button" className={cx("mpSaveBtn")}>
                    Save to decision log
                  </button>
                  <button type="button" className={cx("mpCopyBtn")}>
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
