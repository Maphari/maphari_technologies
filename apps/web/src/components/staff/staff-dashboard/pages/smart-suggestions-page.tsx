// ════════════════════════════════════════════════════════════════════════════
// smart-suggestions-page.tsx — Staff Smart Suggestions
// Data : getStaffAllHealthScores + getMyTasks → client-side derivation
//        of actionable suggestions from health signals and task state
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getStaffAllHealthScores,
  type StaffHealthScoreEntry,
} from "../../../../lib/api/staff/clients";
import {
  getMyTasks,
  type StaffTask,
} from "../../../../lib/api/staff/tasks";

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

const laneConfig: Record<LaneKey, { label: string; icon: string; desc: string }> = {
  urgent: { label: "Urgent", icon: "⚑", desc: "Needs action today" },
  followup: { label: "Follow-up", icon: "↻", desc: "Awaiting a response" },
  proactive: { label: "Proactive", icon: "◉", desc: "Get ahead of problems" },
  opportunity: { label: "Opportunity", icon: "◈", desc: "Strategic upside" },
  admin: { label: "Admin", icon: "◌", desc: "Housekeeping" }
};

const lanePillConfig: Record<LaneKey, { idleClass: string; activeClass: string }> = {
  urgent:      { idleClass: "ssLaneFilterPillIdleUrgent",      activeClass: "ssLaneFilterPillActiveUrgent"      },
  followup:    { idleClass: "ssLaneFilterPillIdleFollowup",    activeClass: "ssLaneFilterPillActiveFollowup"    },
  proactive:   { idleClass: "ssLaneFilterPillIdleProactive",   activeClass: "ssLaneFilterPillActiveProactive"   },
  opportunity: { idleClass: "ssLaneFilterPillIdleOpportunity", activeClass: "ssLaneFilterPillActiveOpportunity" },
  admin:       { idleClass: "ssLaneFilterPillIdleAdmin",       activeClass: "ssLaneFilterPillActiveAdmin"       },
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

// ── Client-side suggestion derivation ────────────────────────────────────

function deriveSuggestions(
  healthEntries: StaffHealthScoreEntry[],
  tasks: StaffTask[]
): { suggestions: SuggestionItem[]; clients: ClientRow[] } {
  const clientRows: ClientRow[] = healthEntries.map((entry, idx) => ({
    id: idx + 1,
    name: entry.name,
    avatar: entry.avatar || entry.name.charAt(0).toUpperCase(),
  }));

  const suggestions: SuggestionItem[] = [];
  let nextId = 1;
  const now = new Date();

  healthEntries.forEach((entry, idx) => {
    const clientId = idx + 1;

    // ── Urgent: low health score ──
    if (entry.score < 50) {
      suggestions.push({
        id: nextId++,
        clientId,
        lane: "urgent",
        task: `${entry.name} health score critically low (${entry.score}/100) — immediate attention needed`,
        impact: "Critical",
        cta: "Review health",
        snoozed: false,
        done: false,
        dismissed: false,
        signals: [
          { type: "sentiment", text: `Health score ${entry.score}/100` },
          ...(entry.overdueTasks > 0 ? [{ type: "overdue" as SignalType, text: `${entry.overdueTasks} overdue task${entry.overdueTasks > 1 ? "s" : ""}` }] : []),
          ...(entry.trend === "down" ? [{ type: "pattern" as SignalType, text: "Trending downward" }] : []),
        ],
        why: `${entry.name} has a health score of ${entry.score} with ${entry.signals.filter((s) => s.type === "negative").length} negative signals. ${entry.trend === "down" ? "The score is trending downward." : ""} ${entry.overdueTasks > 0 ? `There are ${entry.overdueTasks} overdue tasks.` : ""}`.trim(),
        feedback: null,
      });
    }

    // ── Urgent: overdue tasks ──
    if (entry.overdueTasks > 2) {
      suggestions.push({
        id: nextId++,
        clientId,
        lane: "urgent",
        task: `${entry.overdueTasks} overdue tasks for ${entry.name} — clear the backlog`,
        impact: "High",
        cta: "View tasks",
        snoozed: false,
        done: false,
        dismissed: false,
        signals: [
          { type: "overdue", text: `${entry.overdueTasks} tasks past due` },
          ...(entry.retainerBurn > 80 ? [{ type: "financial" as SignalType, text: `Retainer at ${entry.retainerBurn}%` }] : []),
        ],
        why: `${entry.name} has accumulated ${entry.overdueTasks} overdue tasks. Clearing these will improve the health score and client satisfaction.`,
        feedback: null,
      });
    }

    // ── Follow-up: unread messages ──
    if (entry.unreadMessages > 0) {
      suggestions.push({
        id: nextId++,
        clientId,
        lane: "followup",
        task: `${entry.unreadMessages} unread message${entry.unreadMessages > 1 ? "s" : ""} from ${entry.name}`,
        impact: entry.unreadMessages > 3 ? "High" : "Medium",
        cta: "Open messages",
        snoozed: false,
        done: false,
        dismissed: false,
        signals: [
          { type: "silence", text: `${entry.unreadMessages} unread` },
          ...(entry.sentiment === "at_risk" ? [{ type: "sentiment" as SignalType, text: "Client flagged at risk" }] : []),
        ],
        why: `${entry.name} has ${entry.unreadMessages} unread messages. Timely responses help maintain a strong client relationship.`,
        feedback: null,
      });
    }

    // ── Proactive: declining health trend ──
    if (entry.trend === "down" && entry.score >= 50 && entry.score < 80) {
      suggestions.push({
        id: nextId++,
        clientId,
        lane: "proactive",
        task: `${entry.name} health is declining (${entry.score}/100, ${entry.trendVal}) — intervene early`,
        impact: "Medium",
        cta: "Schedule check-in",
        snoozed: false,
        done: false,
        dismissed: false,
        signals: [
          { type: "pattern", text: `Score trending down (${entry.trendVal})` },
          ...(entry.milestoneDelay > 0 ? [{ type: "milestone" as SignalType, text: `${entry.milestoneDelay} day${entry.milestoneDelay > 1 ? "s" : ""} milestone delay` }] : []),
        ],
        why: `While ${entry.name}'s score (${entry.score}) is still moderate, it has been declining. Proactive outreach now can prevent further deterioration.`,
        feedback: null,
      });
    }

    // ── Proactive: high retainer burn ──
    if (entry.retainerBurn > 85) {
      suggestions.push({
        id: nextId++,
        clientId,
        lane: "proactive",
        task: `${entry.name} retainer burn at ${entry.retainerBurn}% — discuss scope or upsell`,
        impact: entry.retainerBurn > 95 ? "High" : "Medium",
        cta: "Review retainer",
        snoozed: false,
        done: false,
        dismissed: false,
        signals: [
          { type: "financial", text: `${entry.retainerBurn}% retainer consumed` },
        ],
        why: `${entry.name}'s retainer is ${entry.retainerBurn}% consumed. Discussing scope adjustments or an upsell opportunity before it runs out prevents service disruption.`,
        feedback: null,
      });
    }

    // ── Opportunity: healthy + positive sentiment ──
    if (entry.score >= 80 && entry.sentiment === "positive" && entry.trend === "up") {
      suggestions.push({
        id: nextId++,
        clientId,
        lane: "opportunity",
        task: `${entry.name} is thriving — great time to propose additional services`,
        impact: "Medium",
        cta: "Draft proposal",
        snoozed: false,
        done: false,
        dismissed: false,
        signals: [
          { type: "sentiment", text: "Positive sentiment" },
          { type: "pattern", text: `Score ${entry.score}, trending up` },
        ],
        why: `${entry.name} has a strong health score (${entry.score}), positive sentiment, and an upward trend. This is an ideal moment to propose additional services or renew contracts.`,
        feedback: null,
      });
    }

    // ── Admin: milestone delays ──
    if (entry.milestoneDelay > 3) {
      suggestions.push({
        id: nextId++,
        clientId,
        lane: "admin",
        task: `Update milestone timeline for ${entry.name} (${entry.milestoneDelay} days behind)`,
        impact: "Low",
        cta: "Update milestones",
        snoozed: false,
        done: false,
        dismissed: false,
        signals: [
          { type: "milestone", text: `${entry.milestoneDelay} day delay` },
        ],
        why: `The project timeline for ${entry.name} is ${entry.milestoneDelay} days behind schedule. Updating milestones keeps stakeholders informed and expectations aligned.`,
        feedback: null,
      });
    }

    // ── Admin: overdue invoice ──
    if (entry.invoiceStatus === "overdue") {
      suggestions.push({
        id: nextId++,
        clientId,
        lane: "admin",
        task: `Follow up on overdue invoice for ${entry.name}`,
        impact: "Medium",
        cta: "View invoice",
        snoozed: false,
        done: false,
        dismissed: false,
        signals: [
          { type: "financial", text: "Invoice overdue" },
        ],
        why: `${entry.name} has an overdue invoice. Timely follow-up ensures healthy cash flow and avoids escalation.`,
        feedback: null,
      });
    }
  });

  // ── Task-based suggestions (not tied to health entries) ──
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED");
  if (blockedTasks.length > 0) {
    suggestions.push({
      id: nextId++,
      clientId: 0,
      lane: "urgent",
      task: `${blockedTasks.length} blocked task${blockedTasks.length > 1 ? "s" : ""} need unblocking`,
      impact: blockedTasks.length > 2 ? "High" : "Medium",
      cta: "View blocked",
      snoozed: false,
      done: false,
      dismissed: false,
      signals: [
        { type: "system", text: `${blockedTasks.length} tasks in BLOCKED status` },
      ],
      why: `You have ${blockedTasks.length} tasks that are currently blocked. Resolving blockers prevents cascading delays across projects.`,
      feedback: null,
    });
  }

  const overdueTasks = tasks.filter((t) => t.dueAt && t.status !== "DONE" && new Date(t.dueAt).getTime() < now.getTime());
  if (overdueTasks.length > 0 && !suggestions.some((s) => s.task.includes("overdue task"))) {
    suggestions.push({
      id: nextId++,
      clientId: 0,
      lane: "followup",
      task: `${overdueTasks.length} personal task${overdueTasks.length > 1 ? "s" : ""} past due date`,
      impact: overdueTasks.length > 3 ? "High" : "Medium",
      cta: "Triage tasks",
      snoozed: false,
      done: false,
      dismissed: false,
      signals: [
        { type: "overdue", text: `${overdueTasks.length} tasks overdue` },
      ],
      why: `You have ${overdueTasks.length} tasks past their due date. Triaging and completing or rescheduling them improves delivery predictability.`,
      feedback: null,
    });
  }

  return { suggestions, clients: clientRows };
}

// ── Component ────────────────────────────────────────────────────────────

export function SmartSuggestionsPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [laneFilter, setLaneFilter] = useState<"all" | LaneKey>("all");
  const [showDismissed, setShowDismissed] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // ── Fetch data from API ───
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;

    void (async () => {
      const [healthResult, tasksResult] = await Promise.all([
        getStaffAllHealthScores(session),
        getMyTasks(session),
      ]);

      if (cancelled) return;

      if (healthResult.nextSession) saveSession(healthResult.nextSession);
      if (tasksResult.nextSession) saveSession(tasksResult.nextSession);

      const healthEntries = healthResult.data ?? [];
      const apiTasks = tasksResult.data ?? [];

      const { suggestions: derived, clients: derivedClients } = deriveSuggestions(healthEntries, apiTasks);
      setSuggestions(derived);
      setClients(derivedClients);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [session?.accessToken]);

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
          <button
            type="button"
            className={cx("ssLaneFilterPill", laneFilter === "all" ? "ssLaneFilterPillActive" : "")}
            onClick={() => setLaneFilter("all")}
          >
            All
            <span className={cx("ssLaneFilterCount")}>{active.length}</span>
          </button>
          {lanes.map((lane) => {
            const laneCfg = laneConfig[lane];
            const count = active.filter((item) => item.lane === lane).length;
            if (!count) return null;
            const isLaneActive = laneFilter === lane;
            const pillCfg = lanePillConfig[lane];
            return (
              <button
                key={lane}
                type="button"
                className={cx(
                  "ssLaneFilterPill",
                  isLaneActive ? "ssLaneFilterPillActive" : "",
                  isLaneActive ? pillCfg.activeClass : pillCfg.idleClass
                )}
                onClick={() => setLaneFilter(lane)}
              >
                <span className={cx("ssLaneFilterIcon")} data-lane={lane}>{laneCfg.icon}</span>
                {laneCfg.label}
                <span className={cx("ssLaneFilterCount")}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>


      {!loading ? (
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
                <div className={cx("text13")}>
                  {clients.length === 0
                    ? "No client data available yet. Suggestions will appear once health scores are computed."
                    : "No active suggestions. You\u0027re fully on top of things."}
                </div>
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
      ) : null}
    </section>
  );
}
