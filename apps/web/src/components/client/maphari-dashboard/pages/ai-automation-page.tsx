"use client";

import { useEffect, useRef, useState } from "react";
import { cx, styles } from "../style";
import { formatMoney } from "../utils";
import type { PortalProject } from "../../../../lib/api/portal";

type AutomationRow = {
  id: string;
  name: string;
  trigger: string;
  status: "active" | "draft" | "risk" | "watch";
  impact: string;
  lastEvent: string;
};

type ClientAiAutomationPageProps = {
  active: boolean;
  automationRows?: AutomationRow[];
  projects?: PortalProject[];
  convertMoney?: (cents: number, currency: string) => number;
  displayCurrency?: string;
};

type ChatMessage = {
  role: "ai" | "user";
  text: string;
};

/* ── Static fallback data ─────────────────────────────────────── */

const STATIC_AUTOMATIONS = [
  { icon: "🧾", name: "Invoice Reminder Engine", desc: "Auto-sends payment reminders at 7 days before due, on due date, and 3 days after.", runs: "Ran 3× this week", on: true, glow: "var(--amber)", statusText: "Active" },
  { icon: "✅", name: "Milestone Status Sync", desc: "Pushes status updates when team marks a milestone complete or in review.", runs: "Ran 6× this month", on: true, glow: "var(--accent)", statusText: "Active" },
  { icon: "📊", name: "Weekly Digest Generator", desc: "Every Monday at 08:00, generates a project summary and emails it.", runs: "Ran 4× this month", on: true, glow: "var(--purple)", statusText: "Active" },
  { icon: "⚠", name: "SLA Breach Alerter", desc: "Monitors milestone due dates and warns when within 48 hours of breach.", runs: "Triggered Feb 18", on: true, glow: "var(--red)", statusText: "Monitoring" },
  { icon: "📝", name: "Meeting Notes Archiver", desc: "After every call, AI transcribes and attaches a summary to project thread.", runs: "Last run: Feb 19", on: false, glow: "var(--green)", statusText: "Paused" },
  { icon: "🔮", name: "Scope Creep Detector", desc: "Compares milestone descriptions against completed work and flags risk.", runs: "No triggers yet", on: false, glow: "var(--purple)", statusText: "Paused" }
] as const;

const STATIC_FORECASTS = [
  { label: "Client Portal v2 Retainer", used: 78, color: "var(--amber)", meta: "R 70,200 of R 90,000" },
  { label: "Lead Pipeline Retainer", used: 40, color: "var(--accent)", meta: "R 22,000 of R 55,000" },
  { label: "Automation Suite Budget", used: 24, color: "var(--purple)", meta: "R 8,400 of R 35,000" }
] as const;

const ALERTS = [
  { toneClass: "notifRowRed"    as const, icon: "⚠", title: "Late Payment Prediction — INV-011", desc: "There is an 87% probability this invoice will remain unpaid past Feb 25.", time: "Just now", actions: [{ label: "Call Client", primary: true }, { label: "Send Reminder", primary: false }] },
  { toneClass: "notifRowAmber"  as const, icon: "⏱", title: "Delivery Delay Risk — UAT Phase", desc: "Current UAT velocity suggests a 6-day delay vs the Mar 14 go-live.", time: "2h ago", actions: [{ label: "View Blocker", primary: true }, { label: "Adjust Timeline", primary: false }] },
  { toneClass: "notifRowGreen"  as const, icon: "🎉", title: "Milestone Completed — Backend API", desc: "All 14 endpoints confirmed live on staging. Ready for client sign-off.", time: "Feb 18", actions: [{ label: "Sign Off", primary: true }] },
  { toneClass: "notifRowPurple" as const, icon: "📊", title: "Retainer Burn Rate Alert", desc: "At current velocity, Lead Pipeline retainer will be exhausted by Mar 08.", time: "Feb 17", actions: [{ label: "Review Scope", primary: false }, { label: "Extend Retainer", primary: false }] }
] as const;

const MEETING_NOTES = [
  { title: "Sprint Review & Demo — Feb 21", date: "Today · 14:00", summary: "Stripe integration demoed successfully. Client approved staging build. UAT sign-off item raised.", tags: ["approved", "uat", "action items"] },
  { title: "Q1 Kickoff — All Projects", date: "Feb 12 · 10:00", summary: "Priorities confirmed: Client Portal first, then Lead Pipeline UAT.", tags: ["strategy", "q2 planning"] },
  { title: "Design Review — Screen v3", date: "Feb 09 · 11:00", summary: "Navigation spacing approved. 3 minor revisions requested.", tags: ["design", "approved"] },
  { title: "Invoice Dispute Resolution", date: "Feb 06 · 09:30", summary: "INV-009 dispute resolved with a credit applied to next invoice.", tags: ["finance", "resolved"] }
] as const;

const QUICK_QUESTIONS = [
  "Where is my invoice?",
  "What stage is Client Portal v2?",
  "When is the next milestone due?",
  "How many hours were logged this week?",
  "Is the project on track for go-live?",
  "What is my outstanding balance?",
  "When was the last payment made?",
  "Who is working on my project?"
] as const;

const AI_RESPONSES: Record<string, string> = {
  "Where is my invoice?": "INV-2026-011 is currently <strong>overdue</strong> by 18 days. You can pay directly from the Invoices screen.",
  "What stage is Client Portal v2?": "Client Portal v2 is <strong>72% complete</strong>. The Design System is in review and UAT is pending API sign-off.",
  "When is the next milestone due?": "The next milestone deadline is <strong>UAT Sign-off on Feb 28</strong>. This is currently blocked.",
  "How many hours were logged this week?": "<strong>54 hours</strong> were logged this week across all projects.",
  "Is the project on track for go-live?": "<strong>At risk.</strong> Current UAT delay may move go-live from Mar 14 to Mar 20.",
  "What is my outstanding balance?": "Outstanding balance is <strong>R 38,000 total</strong>.",
  "When was the last payment made?": "Last payment: <strong>R 22,000</strong> received Feb 15.",
  "Who is working on my project?": "Your team: <strong>Sipho N.</strong>, <strong>Lerato M.</strong>, <strong>Thabo K.</strong>, <strong>Nomsa D.</strong>, <strong>James M.</strong>"
};

/* ── Icon + color maps for real automation rows ─────────────── */

const ROW_ICONS: Record<string, string> = {
  "client-status-sync": "✅",
  "client-invoice-reminders": "🧾",
  "client-approvals": "📝",
  "client-thread-alerts": "⚠"
};

const STATUS_GLOW: Record<AutomationRow["status"], string> = {
  active: "var(--accent)",
  watch:  "var(--amber)",
  risk:   "var(--red)",
  draft:  "var(--muted3)"
};

const STATUS_TEXT: Record<AutomationRow["status"], string> = {
  active: "Active",
  watch:  "Monitoring",
  risk:   "At Risk",
  draft:  "Inactive"
};

export function ClientAiAutomationPage({
  active,
  automationRows,
  projects,
  convertMoney,
  displayCurrency = "ZAR"
}: ClientAiAutomationPageProps) {
  const [activeTab, setActiveTab] = useState("AI Assistant");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Hi! I'm your Maphari AI assistant. Ask me anything about your projects, invoices, milestones, or team." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [autoToggles, setAutoToggles] = useState<boolean[]>(() =>
    automationRows
      ? automationRows.map((r) => r.status !== "draft")
      : STATIC_AUTOMATIONS.map((a) => a.on)
  );
  const chatRef = useRef<HTMLDivElement | null>(null);

  /* Keep toggle state in sync if automationRows length changes */
  const prevRowCount = useRef(automationRows?.length ?? STATIC_AUTOMATIONS.length);
  if ((automationRows?.length ?? STATIC_AUTOMATIONS.length) !== prevRowCount.current) {
    prevRowCount.current = automationRows?.length ?? STATIC_AUTOMATIONS.length;
    setAutoToggles(
      automationRows
        ? automationRows.map((r) => r.status !== "draft")
        : STATIC_AUTOMATIONS.map((a) => a.on)
    );
  }

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const sendChat = (message?: string) => {
    const text = message ?? chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");
    setIsTyping(true);
    window.setTimeout(() => {
      const reply = AI_RESPONSES[text] ?? "Great question! Based on your current project status, everything is moving forward — though API sign-off remains the key blocker this week.";
      setIsTyping(false);
      setChatMessages((prev) => [...prev, { role: "ai", text: reply }]);
    }, 1200);
  };

  const toggleAuto = (index: number) => {
    setAutoToggles((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  /* ── Derive display data ──────────────────────────────────── */

  const displayAutomations = automationRows?.length
    ? automationRows.map((row, i) => ({
        icon: ROW_ICONS[row.id] ?? "⚙",
        name: row.name,
        desc: row.trigger,
        runs: row.impact,
        glow: STATUS_GLOW[row.status],
        statusText: STATUS_TEXT[row.status],
        lastEvent: row.lastEvent,
        on: autoToggles[i] ?? row.status !== "draft"
      }))
    : STATIC_AUTOMATIONS.map((a, i) => ({ ...a, on: autoToggles[i] ?? a.on, lastEvent: "" }));

  const activeCount = autoToggles.filter(Boolean).length;

  const forecastData = (() => {
    if (!projects?.length) return STATIC_FORECASTS.map((f) => ({ ...f }));
    const COLORS = ["var(--amber)", "var(--accent)", "var(--purple)", "var(--green)"] as const;
    return projects.slice(0, 4).map((p, i) => {
      const budget = convertMoney ? convertMoney(p.budgetCents, "ZAR") : p.budgetCents / 100;
      const used = p.progressPercent ?? 0;
      const usedAmt = Math.round(budget * used / 100);
      return {
        label: p.name,
        used,
        color: COLORS[i % COLORS.length] as string,
        meta: `${formatMoney(usedAmt, displayCurrency)} of ${formatMoney(budget, displayCurrency)}`
      };
    });
  })();

  const tabs = ["AI Assistant", "Smart Alerts", "Automations", "Meeting Notes", "Retainer Forecast"] as const;

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-ai">
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Intelligence</div>
          <div className={styles.pageTitle}>AI & Automation</div>
          <p className={styles.pageSub}>
            Ask anything, get smart alerts, auto-transcribed meeting notes, and retainer forecasts.
          </p>
        </div>
        <div className={styles.headerRight}>
          <span className={cx(styles.badge, styles.badgeGreen)}>
            ● {activeCount} automation{activeCount === 1 ? "" : "s"} running
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={cx(styles.filterTab, activeTab === tab && styles.filterTabActive)}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Page body */}
      <div className={styles.pageBody}>

        {/* ── AI Assistant ── */}
        {activeTab === "AI Assistant" ? (
          <div className={styles.chatLayout}>
            <div className={styles.chatPanel}>
              <div className={styles.chatHead}>
                <div className={styles.aiAvatar}>AI</div>
                <div className={styles.chatHeadTitle}>Maphari AI</div>
                <div className={styles.chatHeadOnline}>Online · Knows your projects</div>
              </div>
              <div className={styles.chatBody} ref={chatRef}>
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cx(styles.chatMsg, msg.role === "user" && styles.chatMsgUser)}
                  >
                    {msg.role === "ai" ? (
                      <div className={styles.aiAvatar} style={{ width: 22, height: 22, fontSize: "0.52rem", flexShrink: 0 }}>AI</div>
                    ) : null}
                    <div
                      className={cx(
                        styles.chatBubble,
                        msg.role === "ai" ? styles.chatBubbleAi : styles.chatBubbleUser
                      )}
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />
                  </div>
                ))}
                {isTyping ? (
                  <div className={styles.chatMsg}>
                    <div className={styles.aiAvatar} style={{ width: 22, height: 22, fontSize: "0.52rem", flexShrink: 0 }}>AI</div>
                    <div className={cx(styles.chatBubble, styles.chatBubbleAi)}>
                      <div className={styles.chatTyping}>
                        <div className={styles.typingDot} />
                        <div className={styles.typingDot} />
                        <div className={styles.typingDot} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className={styles.chatInputRow}>
                <input
                  className={styles.chatInput}
                  placeholder="Ask anything about your projects…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
                />
                <button className={styles.chatSend} type="button" onClick={() => sendChat()}>→</button>
              </div>
            </div>

            <div className={styles.quickQuestions}>
              <div className={styles.qqTitle}>Quick Questions</div>
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} type="button" className={styles.qqBtn} onClick={() => sendChat(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Smart Alerts ── */}
        {activeTab === "Smart Alerts" ? (
          <div>
            <div className={styles.sectionTitle}>AI-Generated Alerts</div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
              {ALERTS.map((alert) => (
                <div
                  key={alert.title}
                  className={cx(styles.notifRow, styles[alert.toneClass])}
                >
                  <div className={styles.notifIcon}>{alert.icon}</div>
                  <div className={styles.notifBody}>
                    <div className={styles.notifTitle}>{alert.title}</div>
                    <div className={styles.notifDetail}>{alert.desc}</div>
                    <div className={styles.notifActions}>
                      {alert.actions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          className={cx(
                            styles.button,
                            styles.buttonSm,
                            action.primary ? styles.buttonAccent : styles.buttonGhost
                          )}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.notifTime}>{alert.time}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Automations ── */}
        {activeTab === "Automations" ? (
          <div>
            <div className={styles.sectionTitle}>
              {automationRows?.length ? "Live Automation Status" : "Active & Paused Automations"}
            </div>
            <div className={styles.autoGrid} style={{ marginTop: 12 }}>
              {displayAutomations.map((automation, idx) => (
                <div key={automation.name} className={styles.autoCard}>
                  <div className={styles.autoGlow} style={{ background: automation.glow }} />
                  <div className={styles.autoIcon}>{automation.icon}</div>
                  <div className={styles.autoName}>{automation.name}</div>
                  <div className={styles.autoDesc}>{automation.desc}</div>
                  <div className={styles.autoFooter}>
                    <div>
                      <div className={styles.autoRuns}>{automation.runs}</div>
                      {automation.lastEvent ? (
                        <div className={styles.autoRuns} style={{ marginTop: 2, opacity: 0.7 }}>
                          {automation.lastEvent}
                        </div>
                      ) : null}
                      <div
                        className={cx(
                          styles.autoStatus,
                          autoToggles[idx] ? styles.autoStatusActive : styles.autoStatusIdle
                        )}
                      >
                        {autoToggles[idx] ? automation.statusText : "Paused"}
                      </div>
                    </div>
                    {/* Toggle switch */}
                    <button
                      type="button"
                      aria-label={`Toggle ${automation.name}`}
                      onClick={() => toggleAuto(idx)}
                      style={{
                        width: 38,
                        height: 22,
                        borderRadius: 99,
                        background: autoToggles[idx] ? "var(--accent)" : "var(--muted3)",
                        border: autoToggles[idx] ? "1px solid var(--accent)" : "1px solid var(--border)",
                        position: "relative",
                        transition: "all 0.2s",
                        flexShrink: 0
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 3,
                          left: 3,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "var(--on-accent)",
                          transition: "transform 0.2s",
                          transform: autoToggles[idx] ? "translateX(16px)" : "none",
                          display: "block"
                        }}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Meeting Notes ── */}
        {activeTab === "Meeting Notes" ? (
          <div>
            <div className={styles.sectionTitle}>AI-Transcribed Meeting Summaries</div>
            <div className={styles.cols2} style={{ marginTop: 12 }}>
              {MEETING_NOTES.map((note) => (
                <div key={note.title} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardTitle}>{note.title}</div>
                      <div className={styles.cardSub}>{note.date}</div>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.pageSub} style={{ marginTop: 0 }}>{note.summary}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                      {note.tags.map((tag) => (
                        <span key={tag} className={cx(styles.badge, styles.badgeMuted)}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}>Full Notes</button>
                    <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}>↓ PDF</button>
                    <button type="button" className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}>Attach</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Retainer Forecast ── */}
        {activeTab === "Retainer Forecast" ? (
          <div>
            <div className={styles.sectionTitle}>
              {projects?.length ? "Project Budget Burn Rate" : "AI Retainer Burn Rate Forecast"}
            </div>
            <div className={styles.card} style={{ marginTop: 12 }}>
              <div className={styles.cardBody}>
                {projects?.length ? (
                  <div
                    className={styles.pageSub}
                    style={{
                      marginTop: 0,
                      padding: "12px 14px",
                      background: "var(--accent-g)",
                      border: "1px solid rgba(200,241,53,0.15)",
                      marginBottom: 20
                    }}
                  >
                    <strong style={{ color: "var(--accent)" }}>Live data:</strong>{" "}
                    Showing current budget allocation across {projects.length} active project{projects.length === 1 ? "" : "s"}.
                  </div>
                ) : (
                  <div
                    className={styles.pageSub}
                    style={{
                      marginTop: 0,
                      padding: "12px 14px",
                      background: "var(--accent-g)",
                      border: "1px solid rgba(200,241,53,0.15)",
                      marginBottom: 20
                    }}
                  >
                    <strong style={{ color: "var(--accent)" }}>AI Forecast:</strong> At current velocity,{" "}
                    <strong>Client Portal v2</strong> retainer will be exhausted by{" "}
                    <strong style={{ color: "var(--amber)" }}>Mar 02</strong>.
                  </div>
                )}

                {forecastData.map((fc, idx) => (
                  <div
                    key={fc.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      marginBottom: idx < forecastData.length - 1 ? 24 : 0
                    }}
                  >
                    <div style={{ width: 200, flexShrink: 0 }}>
                      <div className={styles.cardTitle} style={{ fontSize: "0.78rem" }}>{fc.label}</div>
                      <div className={styles.cardSub}>{fc.meta}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className={styles.progressTrack}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${fc.used}%`, background: fc.color }}
                        />
                      </div>
                      <div className={styles.tableMonospace} style={{ marginTop: 4 }}>
                        {fc.used}% used · {100 - fc.used}% remaining
                      </div>
                    </div>
                    <button
                      type="button"
                      className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}
                    >
                      Top Up
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </section>
  );
}
