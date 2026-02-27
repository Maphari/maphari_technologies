"use client";

import { useState } from "react";
import { cx } from "../style";

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  color: string;
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
  { id: 0, name: "Internal", avatar: "IN", color: "#a0a0b0" },
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "#a78bfa" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "#f5c518" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00" }
];

const laneConfig: Record<LaneKey, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  urgent: { label: "Urgent", color: "#ff4444", bg: "rgba(255,68,68,0.07)", icon: "⚑", desc: "Needs action today" },
  followup: { label: "Follow-up", color: "#f5c518", bg: "rgba(245,197,24,0.07)", icon: "↻", desc: "Awaiting a response" },
  proactive: { label: "Proactive", color: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 7%, transparent)", icon: "◉", desc: "Get ahead of problems" },
  opportunity: { label: "Opportunity", color: "#a78bfa", bg: "rgba(167,139,250,0.07)", icon: "◈", desc: "Strategic upside" },
  admin: { label: "Admin", color: "#a0a0b0", bg: "rgba(160,160,176,0.05)", icon: "◌", desc: "Housekeeping" }
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

  const markDone = (id: number) => setSuggestions((previous) => previous.map((item) => (item.id === id ? { ...item, done: true } : item)));
  const dismiss = (id: number) => setSuggestions((previous) => previous.map((item) => (item.id === id ? { ...item, dismissed: true } : item)));
  const snooze = (id: number) => setSuggestions((previous) => previous.map((item) => (item.id === id ? { ...item, snoozed: true } : item)));
  const restore = (id: number) => setSuggestions((previous) => previous.map((item) => (item.id === id ? { ...item, dismissed: false, snoozed: false } : item)));
  const sendFeedback = (id: number, feedback: Exclude<FeedbackValue, null>) =>
    setSuggestions((previous) => previous.map((item) => (item.id === id ? { ...item, feedback } : item)));

  const visibleActive = active
    .filter((item) => laneFilter === "all" || item.lane === laneFilter)
    .sort((a, b) => {
      const order: LaneKey[] = ["urgent", "followup", "proactive", "opportunity", "admin"];
      return order.indexOf(a.lane) - order.indexOf(b.lane);
    });

  const lanes: LaneKey[] = ["urgent", "followup", "proactive", "opportunity", "admin"];

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-smart-suggestions">
      <style>{`
        .card{transition:all 0.15s ease;}
        .card:hover{transform:translateY(-1px);}
        .lane-btn{transition:all 0.12s ease;cursor:pointer;border:none;font-family:'DM Mono',monospace;}
        .action-btn{transition:all 0.15s ease;cursor:pointer;font-family:'DM Mono',monospace;border:none;}
        .action-btn:hover{opacity:0.8;transform:scale(1.02);}
        .icon-btn{transition:all 0.12s ease;cursor:pointer;background:none;border:none;font-family:'DM Mono',monospace;}
        .icon-btn:hover{opacity:0.65;}
        .why-toggle{transition:all 0.12s ease;cursor:pointer;background:none;border:none;font-family:'DM Mono',monospace;}
        .why-toggle:hover{color:#a0a0b0!important;}
        @keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        .slide-down{animation:slideDown 0.18s ease forwards;}
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Staff Dashboard / Intelligence</div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Smart Suggestions</h1>
            <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 6 }}>Auto-generated from client signals, patterns, and system activity</div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "Active", value: active.length, color: "var(--text)" },
              { label: "Urgent", value: active.filter((item) => item.lane === "urgent").length, color: active.filter((item) => item.lane === "urgent").length > 0 ? "#ff4444" : "var(--muted2)" },
              { label: "Completed", value: completed.length, color: "var(--accent)" }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 0 }}>
          <button
            className="lane-btn"
            onClick={() => setLaneFilter("all")}
            style={{ padding: "10px 18px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", background: "transparent", color: laneFilter === "all" ? "var(--text)" : "var(--muted2)", borderBottom: `2px solid ${laneFilter === "all" ? "var(--text)" : "transparent"}`, marginBottom: -1 }}
          >
            All ({active.length})
          </button>
          {lanes.map((lane) => {
            const laneCfg = laneConfig[lane];
            const count = active.filter((item) => item.lane === lane).length;
            if (!count) return null;
            return (
              <button
                key={lane}
                className="lane-btn"
                onClick={() => setLaneFilter(laneFilter === lane ? "all" : lane)}
                style={{ padding: "10px 18px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", background: "transparent", color: laneFilter === lane ? laneCfg.color : "var(--muted2)", borderBottom: `2px solid ${laneFilter === lane ? laneCfg.color : "transparent"}`, marginBottom: -1 }}
              >
                {laneCfg.icon} {laneCfg.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", minHeight: "calc(100vh - 185px)" }}>
        <div style={{ padding: "24px 0", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          {(laneFilter === "all" ? lanes : [laneFilter]).map((lane) => {
            const cards = visibleActive.filter((item) => item.lane === lane);
            if (!cards.length) return null;
            const laneCfg = laneConfig[lane];
            return (
              <div key={lane} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: laneCfg.color }}>{laneCfg.icon}</span>
                  <span style={{ fontSize: 11, color: laneCfg.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{laneCfg.label}</span>
                  <span style={{ fontSize: 10, color: "var(--muted2)" }}>— {laneCfg.desc}</span>
                  <div style={{ flex: 1, height: 1, background: `${laneCfg.color}20` }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {cards.map((item) => {
                    const client = clients.find((row) => row.id === item.clientId);
                    const laneCfgInner = laneConfig[item.lane];
                    const isOpen = expanded === item.id;
                    return (
                      <div key={item.id} className="card" style={{ border: `1px solid ${laneCfgInner.color}25`, borderLeft: `3px solid ${laneCfgInner.color}`, borderRadius: "0 4px 4px 0", background: laneCfgInner.bg, overflow: "hidden" }}>
                        <div style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {client ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                                  <div style={{ width: 16, height: 16, borderRadius: 2, background: `${client.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: client.color, flexShrink: 0 }}>{client.avatar}</div>
                                  <span style={{ fontSize: 10, color: client.color }}>{client.name}</span>
                                  <span style={{ fontSize: 9, padding: "1px 5px", background: "rgba(255,255,255,0.06)", color: item.impact === "High" || item.impact === "Critical" ? laneCfgInner.color : "#a0a0b0", borderRadius: 2, letterSpacing: "0.06em" }}>{item.impact} impact</span>
                                </div>
                              ) : null}
                              <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.4, marginBottom: 10 }}>{item.task}</div>

                              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                                {item.signals.map((signal, index) => (
                                  <div key={index} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "rgba(0,0,0,0.25)", borderRadius: 2, fontSize: 10, color: "#a0a0b0" }}>
                                    <span style={{ color: laneCfgInner.color, fontSize: 9 }}>{signalIcons[signal.type]}</span>
                                    {signal.text}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <button className="action-btn" onClick={() => markDone(item.id)} style={{ padding: "7px 16px", background: laneCfgInner.color, color: "#050508", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                              {item.cta}
                            </button>
                            <button className="why-toggle" onClick={() => setExpanded(isOpen ? null : item.id)} style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.06em" }}>
                              {isOpen ? "↑ Hide why" : "↓ Why this?"}
                            </button>
                            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                              <button className="icon-btn" onClick={() => snooze(item.id)} style={{ fontSize: 10, color: "var(--muted2)", padding: "4px 8px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, letterSpacing: "0.06em" }}>
                                Snooze
                              </button>
                              <button className="icon-btn" onClick={() => dismiss(item.id)} style={{ fontSize: 13, color: "var(--muted2)", padding: "0 6px" }}>
                                ×
                              </button>
                            </div>
                          </div>
                        </div>

                        {isOpen ? (
                          <div className="slide-down" style={{ padding: "12px 16px 14px", borderTop: `1px solid ${laneCfgInner.color}20`, background: "rgba(0,0,0,0.2)" }}>
                            <div style={{ fontSize: 9, color: laneCfgInner.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Why this suggestion?</div>
                            <div style={{ fontSize: 12, color: "#a0a0b0", lineHeight: 1.8, marginBottom: 12 }}>{item.why}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 10, color: "var(--muted2)" }}>Was this useful?</span>
                              {[{ value: "yes", label: "✓ Yes" }, { value: "no", label: "✗ No" }].map((fb) => (
                                <button
                                  key={fb.value}
                                  className="icon-btn"
                                  onClick={() => sendFeedback(item.id, fb.value as "yes" | "no")}
                                  style={{ fontSize: 10, padding: "3px 10px", borderRadius: 2, border: `1px solid ${item.feedback === fb.value ? (fb.value === "yes" ? "color-mix(in srgb, var(--accent) 40%, transparent)" : "rgba(255,68,68,0.4)") : "rgba(255,255,255,0.08)"}`, color: item.feedback === fb.value ? (fb.value === "yes" ? "var(--accent)" : "#ff4444") : "var(--muted2)", background: item.feedback === fb.value ? (fb.value === "yes" ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "rgba(255,68,68,0.08)") : "transparent" }}
                                >
                                  {fb.label}
                                </button>
                              ))}
                              {item.feedback ? <span style={{ fontSize: 10, color: "var(--muted2)" }}>Thanks - this improves future suggestions.</span> : null}
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
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted2)" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>◎</div>
              <div style={{ fontSize: 13 }}>No active suggestions. You're fully on top of things.</div>
            </div>
          ) : null}

          {snoozed.length > 0 ? (
            <div style={{ marginTop: 8, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Snoozed ({snoozed.length})</div>
              {snoozed.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 11, color: "var(--muted2)", flex: 1 }}>{item.task}</span>
                  <button className="icon-btn" onClick={() => restore(item.id)} style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.06em" }}>Restore</button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ padding: "14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3 }}>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>How this works</div>
            {[
              { icon: "◎", label: "Silence detection", desc: "Flags clients who haven't responded in 3+ days" },
              { icon: "⚑", label: "Overdue tracking", desc: "Surfaces milestones and invoices past their due date" },
              { icon: "◉", label: "Pattern recognition", desc: "Learns from your project history and timing" },
              { icon: "◈", label: "Milestone signals", desc: "Monitors portal activity and approval states" },
              { icon: "♡", label: "Sentiment scoring", desc: "Tracks satisfaction trends and relationship health" },
              { icon: "⊡", label: "System reminders", desc: "Pulls from standup logs, time entries, retainer burn" }
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 11, color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>{row.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text)" }}>{row.label}</div>
                  <div style={{ fontSize: 10, color: "var(--muted2)", lineHeight: 1.5 }}>{row.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Completed</div>
              <button className="icon-btn" onClick={() => setShowCompleted((previous) => !previous)} style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.06em" }}>
                {showCompleted ? "Hide" : "Show"}
              </button>
            </div>
            {showCompleted ? completed.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 11, color: "var(--accent)", flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 11, color: "var(--muted2)", lineHeight: 1.4 }}>{item.task}</span>
              </div>
            )) : null}
            {completed.length === 0 ? <div style={{ fontSize: 11, color: "var(--muted2)" }}>None completed yet.</div> : null}
          </div>

          {dismissed.length > 0 ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Dismissed ({dismissed.length})</div>
                <button className="icon-btn" onClick={() => setShowDismissed((previous) => !previous)} style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.06em" }}>
                  {showDismissed ? "Hide" : "Show"}
                </button>
              </div>
              {showDismissed ? dismissed.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 11, color: "var(--muted2)", flex: 1, lineHeight: 1.4 }}>{item.task}</span>
                  <button className="icon-btn" onClick={() => restore(item.id)} style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.06em", flexShrink: 0 }}>Restore</button>
                </div>
              )) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
