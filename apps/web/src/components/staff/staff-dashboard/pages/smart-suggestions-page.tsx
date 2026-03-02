"use client";

import { useState } from "react";
import { cx } from "../style";

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
};

type LaneKey = "urgent" | "followup" | "proactive" | "opportunity" | "admin";
type SignalType = "overdue" | "silence" | "pattern" | "financial" | "milestone" | "sentiment" | "system" | "portal";
type FeedbackValue = "yes" | "no" | null;

type SuggestionSignal = {
  type: SignalType;
  text: string;
};

type SuggestionItem = {
  id: number;
  clientId: number;
  lane: LaneKey;
  task: string;
  impact: "Critical" | "High" | "Medium" | "Low";
  cta: string;
  snoozed: boolean;
  done: boolean;
  dismissed: boolean;
  signals: SuggestionSignal[];
  why: string;
  feedback: FeedbackValue;
};

const clients: ClientRow[] = [
  { id: 0, name: "Internal", avatar: "IN" },
  { id: 1, name: "Volta Studios", avatar: "VS" },
  { id: 2, name: "Kestrel Capital", avatar: "KC" },
  { id: 3, name: "Mira Health", avatar: "MH" },
  { id: 4, name: "Dune Collective", avatar: "DC" },
  { id: 5, name: "Okafor & Sons", avatar: "OS" }
];

const laneConfig: Record<LaneKey, { label: string; icon: string; desc: string }> = {
  urgent: { label: "Urgent", icon: "⚑", desc: "Needs action today" },
  followup: { label: "Follow-up", icon: "↻", desc: "Awaiting a response" },
  proactive: { label: "Proactive", icon: "◉", desc: "Get ahead of problems" },
  opportunity: { label: "Opportunity", icon: "◈", desc: "Strategic upside" },
  admin: { label: "Admin", icon: "◌", desc: "Housekeeping" }
};

const signalIcons: Record<SignalType, string> = {
  overdue: "⚑",
  silence: "◎",
  pattern: "◉",
  financial: "₹",
  milestone: "◈",
  sentiment: "♡",
  system: "⊡",
  portal: "◌"
};

const initialSuggestions: SuggestionItem[] = [
  {
    id: 1,
    clientId: 4,
    lane: "urgent",
    task: "Escalate Dune Collective silence to account manager",
    impact: "Critical",
    cta: "Escalate now",
    snoozed: false,
    done: false,
    dismissed: false,
    signals: [
      { type: "silence", text: "6 days without client response to 3 follow-ups" },
      { type: "overdue", text: "Milestone 12 days past the agreed delivery date" },
      { type: "financial", text: "Retainer exceeded by 4.5h - unbilled exposure" }
    ],
    why: "Dune Collective has been unresponsive for 6 days following 3 unanswered follow-up messages. The Type & Grid System milestone is 12 days overdue, and the retainer has been exceeded by 4.5 hours. The combination of silence, deadline breach, and financial overrun warrants escalation before more work is logged.",
    feedback: null
  },
  {
    id: 2,
    clientId: 2,
    lane: "urgent",
    task: "Chase Kestrel Capital invoice - 7 days overdue",
    impact: "High",
    cta: "Send chase",
    snoozed: false,
    done: false,
    dismissed: false,
    signals: [
      { type: "financial", text: "INV-0038 (R21,000) 7 days past due date" },
      { type: "pattern", text: "Marcus mentioned AP delays in last call" },
      { type: "silence", text: "No payment confirmation received" }
    ],
    why: "INV-0038 for R21,000 is now 7 days overdue. Marcus Rehn mentioned internal AP pressures on the last call, which may explain the delay - but without confirmation, this needs a gentle chase. Pattern data shows Kestrel has paid on time in previous cycles, so this is likely an oversight rather than a relationship risk.",
    feedback: null
  },
  {
    id: 3,
    clientId: 3,
    lane: "followup",
    task: "Follow up with Mira Health - wireframe approval pending 4 days",
    impact: "Medium",
    cta: "Send reminder",
    snoozed: false,
    done: false,
    dismissed: false,
    signals: [
      { type: "milestone", text: "Mobile wireframes sent for approval 4 days ago" },
      { type: "portal", text: "Amara viewed the milestone page twice" },
      { type: "silence", text: "No approval or feedback submitted" }
    ],
    why: "The revised mobile wireframes were sent to Mira Health 4 days ago. Portal data shows Amara Nkosi viewed the milestone page twice, suggesting she's reviewed them. The lack of response is likely due to the clinical review bottleneck - a gentle follow-up prompt may help unblock this.",
    feedback: null
  },
  {
    id: 4,
    clientId: 1,
    lane: "followup",
    task: "Confirm animation brief scope with Lena before starting",
    impact: "Medium",
    cta: "Send message",
    snoozed: false,
    done: false,
    dismissed: false,
    signals: [
      { type: "milestone", text: "Animation Direction milestone starts in 3 days" },
      { type: "pattern", text: "Scope gaps caused 2.5h overrun on Logo milestone" },
      { type: "system", text: "No motion brief document exists in Drive" }
    ],
    why: "The Animation Direction milestone is scheduled to start in 3 days, but no motion brief exists yet. The Logo milestone ran 2.5h over estimate due to scope gaps identified mid-project. Confirming animation scope (formats, contexts, duration guidelines) before starting will prevent a repeat.",
    feedback: null
  },
  {
    id: 5,
    clientId: 5,
    lane: "proactive",
    task: "Propose 2026 Annual Report retainer to Okafor & Sons",
    impact: "High",
    cta: "Draft proposal",
    snoozed: false,
    done: false,
    dismissed: false,
    signals: [
      { type: "milestone", text: "Project closes in 5 days - all milestones approved" },
      { type: "sentiment", text: "Satisfaction score 96/100 - highest in portfolio" },
      { type: "financial", text: "Paid every invoice early, zero disputes" },
      { type: "pattern", text: "Annual reporting is likely recurring work" }
    ],
    why: "The Okafor & Sons project is closing in 5 days with a 96/100 satisfaction score - the highest in the portfolio. Chidi pays early, raises no disputes, and annual reporting is by nature recurring. This is the ideal window to propose a 2026 retainer before the engagement momentum fades.",
    feedback: null
  },
  {
    id: 6,
    clientId: 1,
    lane: "proactive",
    task: "Send Volta Studios a retainer burn update - 78% used, 8 days left",
    impact: "Low",
    cta: "Send update",
    snoozed: false,
    done: false,
    dismissed: false,
    signals: [
      { type: "financial", text: "Retainer at 78% with 8 days remaining in cycle" },
      { type: "milestone", text: "Brand Guidelines milestone still in progress" },
      { type: "pattern", text: "Transparent burn reporting strengthens retention" }
    ],
    why: "Volta Studios's retainer is at 78% with 8 days left and the Brand Guidelines milestone still in progress. Proactively sharing this context - rather than waiting for the client to ask - demonstrates transparency and helps Lena plan. Historical data shows clients who receive proactive burn updates have higher renewal rates.",
    feedback: null
  },
  {
    id: 7,
    clientId: 2,
    lane: "opportunity",
    task: "Upsell content execution to Kestrel Capital post-strategy",
    impact: "High",
    cta: "Prepare pitch",
    snoozed: false,
    done: false,
    dismissed: false,
    signals: [
      { type: "milestone", text: "Campaign Strategy approved - implementation phase logical next step" },
      { type: "pattern", text: "LinkedIn brief and content calendar already in scope" },
      { type: "sentiment", text: "Marcus responded positively to the strategy deck" }
    ],
    why: "The Campaign Strategy has been approved and the LinkedIn channel brief is underway. The natural next step - which Marcus hasn't explicitly asked for yet - is content execution: writing, scheduling, and reporting. Pitching now while momentum is high and the strategy is fresh increases the conversion likelihood.",
    feedback: null
  },
  {
    id: 8,
    clientId: 0,
    lane: "admin",
    task: "Submit today's standup log before 6 PM",
    impact: "Low",
    cta: "Open standup",
    snoozed: false,
    done: false,
    dismissed: false,
    signals: [
      { type: "system", text: "No standup submitted yet today" },
      { type: "pattern", text: "You typically submit between 4-5 PM" }
    ],
    why: "Your standup log for today hasn't been submitted. Based on your pattern, you usually complete this between 4-5 PM. Leaving it incomplete breaks the async update chain for the team.",
    feedback: null
  },
  {
    id: 9,
    clientId: 0,
    lane: "admin",
    task: "Reconcile time logs - 3 tasks missing hour entries",
    impact: "Low",
    cta: "Open time log",
    snoozed: false,
    done: false,
    dismissed: false,
    signals: [
      { type: "system", text: "3 completed tasks have no hours logged" },
      { type: "financial", text: "Unlogged hours affect retainer burn accuracy" }
    ],
    why: "Three recently completed tasks - Kestrel invoice follow-up, Mira meeting prep, and Volta logo chase - have no hours logged. This gaps the retainer burn report and may cause discrepancies at cycle close.",
    feedback: null
  }
];

export function SmartSuggestionsPage({ isActive }: { isActive: boolean }) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>(initialSuggestions);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [laneFilter, setLaneFilter] = useState<"all" | LaneKey>("all");
  const [showDismissed, setShowDismissed] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const active = suggestions.filter((item) => !item.done && !item.dismissed && !item.snoozed);
  const snoozed = suggestions.filter((item) => item.snoozed && !item.done && !item.dismissed);
  const dismissed = suggestions.filter((item) => item.dismissed && !item.done);
  const completed = suggestions.filter((item) => item.done);

  const markDone = (id: number) =>
    setSuggestions((previous) => previous.map((item) => (item.id === id ? { ...item, done: true } : item)));

  const dismiss = (id: number) =>
    setSuggestions((previous) => previous.map((item) => (item.id === id ? { ...item, dismissed: true } : item)));

  const snooze = (id: number) =>
    setSuggestions((previous) => previous.map((item) => (item.id === id ? { ...item, snoozed: true } : item)));

  const restore = (id: number) =>
    setSuggestions((previous) => previous.map((item) => (item.id === id ? { ...item, dismissed: false, snoozed: false } : item)));

  const sendFeedback = (id: number, feedback: Exclude<FeedbackValue, null>) =>
    setSuggestions((previous) => previous.map((item) => (item.id === id ? { ...item, feedback } : item)));

  const visibleActive = active
    .filter((item) => laneFilter === "all" || item.lane === laneFilter)
    .sort((a, b) => {
      const order: LaneKey[] = ["urgent", "followup", "proactive", "opportunity", "admin"];
      return order.indexOf(a.lane) - order.indexOf(b.lane);
    });

  const lanes: LaneKey[] = ["urgent", "followup", "proactive", "opportunity", "admin"];
  const urgentCount = active.filter((item) => item.lane === "urgent").length;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-smart-suggestions">
      <div className={cx("pageHeaderBar", "pb0")}>
        <div className={cx("flexBetween", "mb20", "ssHeaderTop")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Intelligence</div>
            <h1 className={cx("pageTitleText")}>Smart Suggestions</h1>
            <div className={cx("text12", "colorMuted2", "mt6")}>Auto-generated from client signals, patterns, and system activity</div>
          </div>

          <div className={cx("ssTopStats")}>
            {[
              { label: "Active", value: active.length, toneClass: "colorText" },
              { label: "Urgent", value: urgentCount, toneClass: urgentCount > 0 ? "colorRed" : "colorMuted2" },
              { label: "Completed", value: completed.length, toneClass: "colorAccent" }
            ].map((stat) => (
              <div key={stat.label} className={cx("ssStatCard")}>
                <div className={cx("statLabelNew")}>{stat.label}</div>
                <div className={cx("statValueNew", stat.toneClass)}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("ssLaneTabs", "filterRow")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter suggestion lane"
            value={laneFilter}
            onChange={(event) => setLaneFilter(event.target.value as "all" | LaneKey)}
          >
            <option value="all">All ({active.length})</option>
            {lanes.map((lane) => {
              const laneCfg = laneConfig[lane];
              const count = active.filter((item) => item.lane === lane).length;
              if (!count) return null;
              return (
                <option key={lane} value={lane}>
                  {laneCfg.label} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className={cx("ssLayout")}>
        <div className={cx("ssMainPane")}>
          {(laneFilter === "all" ? lanes : [laneFilter]).map((lane) => {
            const cards = visibleActive.filter((item) => item.lane === lane);
            if (!cards.length) return null;
            const laneCfg = laneConfig[lane];

            return (
              <div key={lane} className={cx("mb28")}>
                <div className={cx("ssLaneHead")}>
                  <span className={cx("text13", "ssLaneTone")} data-lane={lane}>{laneCfg.icon}</span>
                  <span className={cx("text11", "uppercase", "ssLaneTone")} data-lane={lane}>{laneCfg.label}</span>
                  <span className={cx("text10", "colorMuted2")}>- {laneCfg.desc}</span>
                  <div className={cx("flex1", "ssLaneLine")} data-lane={lane} />
                </div>

                <div className={cx("flexCol", "gap8")}>
                  {cards.map((item) => {
                    const client = clients.find((row) => row.id === item.clientId);
                    const isOpen = expanded === item.id;
                    const isHighImpact = item.impact === "High" || item.impact === "Critical";

                    return (
                      <div key={item.id} className={cx("ssSuggCard", "ssSuggCardShell")} data-lane={item.lane}>
                        <div className={cx("ssCardInner")}>
                          <div className={cx("flexRow", "gap12", "ssCardTop")}>
                            <div className={cx("flex1", "minW0")}>
                              {client ? (
                                <div className={cx("ssClientRow")}>
                                  <div className={cx("avatarXs", "ssClientAvatar")} data-client-id={String(client.id)}>{client.avatar}</div>
                                  <span className={cx("text10", "ssClientName")} data-client-id={String(client.id)}>{client.name}</span>
                                  <span
                                    className={cx(
                                      "text10",
                                      "ssImpactBadge",
                                      isHighImpact ? "ssImpactBadgeStrong" : "ssImpactBadgeSoft"
                                    )}
                                    data-lane={item.lane}
                                  >
                                    {item.impact} impact
                                  </span>
                                </div>
                              ) : null}

                              <div className={cx("text13", "colorText", "mb10", "ssTaskText")}>{item.task}</div>

                              <div className={cx("ssSignalWrap")}>
                                {item.signals.map((signal, index) => (
                                  <div key={index} className={cx("ssSignalChip")}>
                                    <span className={cx("ssSignalIcon")} data-lane={item.lane}>{signalIcons[signal.type]}</span>
                                    {signal.text}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className={cx("ssActionRow")}>
                            <button type="button" className={cx("ssActionBtn", "ssActionPrimary")} data-lane={item.lane} onClick={() => markDone(item.id)}>
                              {item.cta}
                            </button>

                            <button type="button" className={cx("ssWhyToggle", "ssWhyBtn")} onClick={() => setExpanded(isOpen ? null : item.id)}>
                              {isOpen ? "Hide why" : "Why this?"}
                            </button>

                            <div className={cx("ssActionTail")}>
                              <button type="button" className={cx("ssIconBtn", "ssSnoozeBtn")} onClick={() => snooze(item.id)}>
                                Snooze
                              </button>
                              <button type="button" className={cx("ssIconBtn", "ssDismissBtn")} onClick={() => dismiss(item.id)}>
                                ×
                              </button>
                            </div>
                          </div>
                        </div>

                        {isOpen ? (
                          <div className={cx("ssSlideDown", "ssWhyPanel")} data-lane={item.lane}>
                            <div className={cx("uppercase", "mb8", "ssWhyTitle")} data-lane={item.lane}>Why this suggestion?</div>
                            <div className={cx("text12", "colorMuted", "mb12", "ssWhyBody")}>{item.why}</div>

                            <div className={cx("flexRow", "gap10", "flexWrap")}>
                              <span className={cx("text10", "colorMuted2")}>Was this useful?</span>
                              {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }].map((fb) => (
                                <button
                                  key={fb.value}
                                  type="button"
                                  className={cx(
                                    "ssIconBtn",
                                    "ssFeedbackBtn",
                                    item.feedback === fb.value && (fb.value === "yes" ? "ssFeedbackYes" : "ssFeedbackNo")
                                  )}
                                  onClick={() => sendFeedback(item.id, fb.value as "yes" | "no")}
                                >
                                  {fb.label}
                                </button>
                              ))}
                              {item.feedback ? <span className={cx("text10", "colorMuted2")}>Thanks - this improves future suggestions.</span> : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {visibleActive.length === 0 ? (
            <div className={cx("textCenter", "colorMuted2", "ssEmptyState")}>
              <div className={cx("mb10", "ssEmptyIcon")}>◎</div>
              <div className={cx("text13")}>No active suggestions. You&apos;re fully on top of things.</div>
            </div>
          ) : null}

          {snoozed.length > 0 ? (
            <div className={cx("cardSurface", "mt8")}>
              <div className={cx("sectionLabel", "mb8")}>Snoozed ({snoozed.length})</div>
              {snoozed.map((item) => (
                <div key={item.id} className={cx("ssMiniRow")}>
                  <span className={cx("text11", "colorMuted2", "flex1")}>{item.task}</span>
                  <button type="button" className={cx("ssIconBtn", "ssMiniAction")} onClick={() => restore(item.id)}>
                    Restore
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className={cx("flexCol", "gap20", "ssSidePane")}>
          <div className={cx("cardSurface")}>
            <div className={cx("sectionLabel", "mb12")}>How this works</div>
            {[
              { icon: "◎", label: "Silence detection", desc: "Flags clients who haven't responded in 3+ days" },
              { icon: "⚑", label: "Overdue tracking", desc: "Surfaces milestones and invoices past their due date" },
              { icon: "◉", label: "Pattern recognition", desc: "Learns from your project history and timing" },
              { icon: "◈", label: "Milestone signals", desc: "Monitors portal activity and approval states" },
              { icon: "♡", label: "Sentiment scoring", desc: "Tracks satisfaction trends and relationship health" },
              { icon: "⊡", label: "System reminders", desc: "Pulls from standup logs, time entries, retainer burn" }
            ].map((row) => (
              <div key={row.label} className={cx("ssHowRow")}>
                <span className={cx("text11", "colorAccent", "noShrink", "ssHowIcon")}>{row.icon}</span>
                <div>
                  <div className={cx("text11", "colorText")}>{row.label}</div>
                  <div className={cx("text10", "colorMuted2", "ssHowDesc")}>{row.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className={cx("flexBetween", "mb10")}>
              <div className={cx("sectionLabel")}>Completed</div>
              <button type="button" className={cx("ssIconBtn", "ssToggleBtn")} onClick={() => setShowCompleted((previous) => !previous)}>
                {showCompleted ? "Hide" : "Show"}
              </button>
            </div>

            {showCompleted
              ? completed.map((item) => (
                  <div key={item.id} className={cx("ssMiniRow", "ssMiniRowTop")}>
                    <span className={cx("text11", "colorAccent", "noShrink")}>✓</span>
                    <span className={cx("text11", "colorMuted2", "ssMiniText")}>{item.task}</span>
                  </div>
                ))
              : null}
            {completed.length === 0 ? <div className={cx("text11", "colorMuted2")}>None completed yet.</div> : null}
          </div>

          {dismissed.length > 0 ? (
            <div>
              <div className={cx("flexBetween", "mb10")}>
                <div className={cx("sectionLabel")}>Dismissed ({dismissed.length})</div>
                <button type="button" className={cx("ssIconBtn", "ssToggleBtn")} onClick={() => setShowDismissed((previous) => !previous)}>
                  {showDismissed ? "Hide" : "Show"}
                </button>
              </div>

              {showDismissed
                ? dismissed.map((item) => (
                    <div key={item.id} className={cx("ssMiniRow")}> 
                      <span className={cx("text11", "colorMuted2", "flex1", "ssMiniText")}>{item.task}</span>
                      <button type="button" className={cx("ssIconBtn", "ssMiniAction") } onClick={() => restore(item.id)}>
                        Restore
                      </button>
                    </div>
                  ))
                : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
