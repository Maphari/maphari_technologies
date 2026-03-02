"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cx, styles } from "../style";

type AITab =
  | "AI Summary"
  | "Alerts"
  | "AI Chatbot"
  | "Smart FAQ"
  | "Meeting Notes"
  | "Invoice Anomalies"
  | "Burn Rate Forecast";

interface AlertItem {
  icon: string;
  tone: "critical" | "warning" | "info";
  title: string;
  body: string;
  dismissed: boolean;
}

interface NoteItem {
  title: string;
  date: string;
  body: string;
  actions: Array<{ text: string; done: boolean }>;
}

interface AnomalyItem {
  title: string;
  body: string;
  flagged: boolean;
}

interface ChatMessage {
  role: "bot" | "user";
  text: string;
}

interface ToastState {
  title: string;
  subtitle: string;
}

const BOT_REPLIES: Record<string, string> = {
  "What's the project status?":
    "Your project is 54% complete and on track for launch on March 28, 2026. UI/UX design is 72% done and the next key milestone is mobile responsive screens by February 28, 2026.",
  "When is the next invoice?":
    "The next invoice is expected around February 28, 2026 when the UI/UX design milestone is signed off. It is projected at approximately R 15,600 for completed design hours.",
  "Is the project on budget?":
    "Yes. Spend is R 32,800 out of R 80,000 (41%). Based on current burn rate, projected completion is around R 78,400.",
  "What do I need to approve?":
    "You currently have 3 pending actions: sign off Dashboard UI Design, decide on two scope change requests, and submit homepage copy.",
};

const DEFAULT_REPLY =
  "Current data shows progress is on schedule. Ask a specific question about status, budget, approvals, or timeline for a focused answer.";

const ALERTS: AlertItem[] = [
  {
    icon: "🚨",
    tone: "critical",
    title: "Scope creep detected",
    body:
      "Two scope change requests have been open for over 5 days. This may delay frontend kickoff by up to one week.",
    dismissed: false,
  },
  {
    icon: "⚠️",
    tone: "warning",
    title: "Predictive delay: Content delivery",
    body:
      "Model predicts a 68% chance homepage copy misses the March 1, 2026 deadline. This can impact frontend timeline.",
    dismissed: false,
  },
  {
    icon: "💡",
    tone: "info",
    title: "Design milestone approaching",
    body:
      "UI/UX design is 72% complete and tracking to close by February 28, 2026. Frontend starts after sign-off.",
    dismissed: false,
  },
];

const FAQS = [
  {
    question: "When will my project be complete?",
    answer:
      "Based on current progress and the committed plan, completion is tracking to March 28, 2026.",
  },
  {
    question: "Why haven’t I received an invoice yet?",
    answer:
      "Invoices are issued at milestone gates. The next invoice is expected when UI/UX design is approved.",
  },
  {
    question: "What happens if the project goes over budget?",
    answer:
      "Any overrun requires an explicit scope/budget approval before billing is adjusted.",
  },
  {
    question: "How do I give feedback on a design?",
    answer:
      "Open Deliverables and submit feedback on the item in review status. Team response SLA is within 24 hours.",
  },
  {
    question: "Who should I contact for an urgent issue?",
    answer:
      "Use Status Nudge from Notifications for urgent escalation to the project lead.",
  },
];

const NOTES: NoteItem[] = [
  {
    title: "Sprint Review Call",
    date: "Feb 19, 2026",
    body:
      "Discussed design progress and switched to mobile-first priority. Dark mode moved to phase two. Next review call set for Feb 26.",
    actions: [
      { text: "Client to submit homepage copy by Mar 1", done: false },
      { text: "Sipho to finalize dashboard design by Feb 25", done: true },
      { text: "Naledi to sign off homepage design", done: true },
    ],
  },
  {
    title: "Kickoff Meeting",
    date: "Jan 10, 2026",
    body:
      "Scope, timeline and budget were confirmed. Brand guidelines prioritized first in execution sequence.",
    actions: [
      { text: "Lerato to start brand discovery", done: true },
      { text: "Naledi to share inspiration references", done: true },
      { text: "Sipho to setup project portal", done: true },
    ],
  },
];

const ANOMALIES: AnomalyItem[] = [
  {
    title: "Duplicate line item on INV-2026-009",
    body: "Line item 'Strategy Session' appears twice. Estimated discrepancy: R 1,800.",
    flagged: true,
  },
  {
    title: "Invoices paid within terms",
    body: "INV-2026-006 through INV-2026-010 were paid on time.",
    flagged: false,
  },
  {
    title: "Invoice amount 12% above project average",
    body: "INV-2026-010 is above average due to brand finalization effort peak.",
    flagged: false,
  },
];

const TABS: AITab[] = [
  "AI Summary",
  "Alerts",
  "AI Chatbot",
  "Smart FAQ",
  "Meeting Notes",
  "Invoice Anomalies",
  "Burn Rate Forecast",
];

function alertToneClass(tone: AlertItem["tone"]): string {
  if (tone === "critical") return styles.aiAutoAlertCritical;
  if (tone === "warning") return styles.aiAutoAlertWarning;
  return styles.aiAutoAlertInfo;
}

export function AIAutomationPage() {
  const [tab, setTab] = useState<AITab>("AI Summary");
  const [alerts, setAlerts] = useState<AlertItem[]>(ALERTS);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hi Naledi. I can answer questions about project status, budget, approvals, and timeline.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const unresolvedAlertCount = useMemo(() => alerts.filter((alert) => !alert.dismissed).length, [alerts]);

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  function sendMessage(value?: string): void {
    const text = (value ?? chatInput).trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");
    setTyping(true);

    window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: BOT_REPLIES[text] ?? DEFAULT_REPLY },
      ]);
    }, 1000);
  }

  return (
    <div className={styles.pageBody}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Veldt Finance · Intelligence</div>
          <h1 className={cx("pageTitle")}>AI &amp; Automation</h1>
          <p className={cx("pageSub")}>AI insights, risk alerts, assistant chat, and predictive budget analysis.</p>
        </div>
        <div className={cx("pageActions")}>
          <div className={styles.aiAutoBadge}>
            <span className={styles.aiAutoBadgeDot} />
            <span>AI Active</span>
          </div>
          <button className={cx("btnSm", "btnGhost")} type="button" onClick={() => notify("Digest sent", "AI weekly summary emailed")}>Send Digest</button>
        </div>
      </div>

      <div className={styles.aiAutoLayout}>
        <aside className={styles.aiAutoSidebar}>
          <div className={styles.aiAutoSidebarSection}>AI Features</div>
          {[
            { label: "AI Summary", tone: styles.aiAutoTonePurple },
            { label: "Alerts", tone: styles.aiAutoToneRed, badge: unresolvedAlertCount },
            { label: "AI Chatbot", tone: styles.aiAutoToneBlue },
            { label: "Smart FAQ", tone: styles.aiAutoToneAccent },
            { label: "Meeting Notes", tone: styles.aiAutoToneMuted },
            { label: "Invoice Anomalies", tone: styles.aiAutoToneAmber, badge: ANOMALIES.filter((a) => a.flagged).length },
            { label: "Burn Rate Forecast", tone: styles.aiAutoToneGreen },
          ].map((item) => {
            const isActive = tab === item.label;
            return (
              <button
                key={item.label}
                type="button"
                className={cx(styles.aiAutoSidebarItem, isActive && styles.aiAutoSidebarItemActive)}
                onClick={() => setTab(item.label as AITab)}
              >
                <span className={cx(styles.aiAutoDot, item.tone)} />
                <span>{item.label}</span>
                {item.badge ? <span className={styles.aiAutoSideBadge}>{item.badge}</span> : null}
              </button>
            );
          })}

          <div className={styles.aiAutoSidebarDivider} />
          <div className={styles.aiAutoModelCard}>
            <div className={styles.aiAutoModelLabel}>AI Model</div>
            <div className={styles.aiAutoModelName}>Claude Sonnet</div>
            <div className={styles.aiAutoModelDesc}>Analyzing project signals in real time for risk and progress insights.</div>
          </div>
        </aside>

        <section className={styles.aiAutoMain}>
          <div className={styles.aiAutoTabs}>
            {TABS.map((item) => (
              <button key={item} type="button" className={cx(styles.aiAutoTab, tab === item && styles.aiAutoTabActive)} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
          </div>

          {tab === "AI Summary" ? (
            <div className={styles.aiAutoBody}>
              <div className={styles.aiAutoSectionTitle}>AI-Generated Project Summary</div>
              <div className={styles.aiAutoSummaryCard}>
                <div className={styles.aiAutoSummaryEyebrow}>AI Summary · Updated Feb 21, 2026 at 14:32</div>
                <p className={styles.aiAutoSummaryText}>
                  Project health is stable and currently on track. Overall completion is at 54%, with design at 72%.
                  Immediate focus is required on pending design sign-off and scope-change decisions to prevent frontend start delay.
                </p>
                <p className={styles.aiAutoSummaryText}>
                  Budget remains healthy at R 32,800 of R 80,000 (41%), with forecasted completion below budget if current scope remains unchanged.
                </p>
                <div className={styles.aiAutoSummaryFooter}>
                  <span>Model: <strong>Claude Sonnet</strong></span>
                  <span>Confidence: <strong className={styles.aiAutoTextGreen}>High</strong></span>
                  <span>Next update: <strong>Mon 07:00</strong></span>
                </div>
              </div>

              <div className={styles.aiAutoGrid2}>
                <div>
                  <div className={styles.aiAutoSectionTitle}>Active Alerts</div>
                  {alerts.filter((a) => !a.dismissed).slice(0, 2).map((alert) => (
                    <div key={alert.title} className={cx(styles.aiAutoAlert, alertToneClass(alert.tone))}>
                      <span className={styles.aiAutoAlertIcon}>{alert.icon}</span>
                      <div>
                        <div className={styles.aiAutoAlertTitle}>{alert.title}</div>
                        <div className={styles.aiAutoAlertBody}>{alert.body}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className={styles.aiAutoSectionTitle}>Ask AI</div>
                  <div className={styles.aiAutoQuickCard}>
                    {Object.keys(BOT_REPLIES).map((question) => (
                      <button key={question} type="button" className={styles.aiAutoQuickBtn} onClick={() => { setTab("AI Chatbot"); sendMessage(question); }}>
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Alerts" ? (
            <div className={styles.aiAutoBody}>
              <div className={styles.aiAutoSectionTitle}>AI-Powered Alerts</div>
              {alerts.map((alert, index) => (
                <div key={alert.title} className={cx(styles.aiAutoAlert, alertToneClass(alert.tone), alert.dismissed && styles.aiAutoAlertDim)}>
                  <span className={styles.aiAutoAlertIcon}>{alert.icon}</span>
                  <div className={styles.aiAutoGrow}>
                    <div className={styles.aiAutoAlertTitle}>{alert.title}</div>
                    <div className={styles.aiAutoAlertBody}>{alert.body}</div>
                    {!alert.dismissed ? (
                      <div className={styles.aiAutoAlertActions}>
                        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Noted", "The team has been notified")}>Notify Team</button>
                        <button
                          type="button"
                          className={cx("btnSm", "btnGhost")}
                          onClick={() => setAlerts((prev) => prev.map((item, i) => i === index ? { ...item, dismissed: true } : item))}
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <span className={cx("badge", "badgeMuted")}>Dismissed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "AI Chatbot" ? (
            <div className={styles.aiAutoBody}>
              <div className={styles.aiAutoSectionTitle}>AI Project Assistant</div>
              <div className={styles.aiAutoChatShell}>
                <div className={styles.aiAutoSuggestionRow}>
                  {Object.keys(BOT_REPLIES).map((question) => (
                    <button key={question} type="button" className={styles.aiAutoSuggestionBtn} onClick={() => sendMessage(question)}>
                      {question}
                    </button>
                  ))}
                </div>
                <div className={styles.aiAutoChatMessages}>
                  {messages.map((message, idx) => (
                    <div key={`${message.role}-${idx}`} className={cx(styles.aiAutoMsg, message.role === "bot" ? styles.aiAutoMsgBot : styles.aiAutoMsgUser)}>
                      {message.text}
                    </div>
                  ))}
                  {typing ? (
                    <div className={styles.aiAutoTyping}>
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : null}
                  <div ref={messageEndRef} />
                </div>
                <div className={styles.aiAutoChatInputRow}>
                  <input
                    className={styles.aiAutoChatInput}
                    placeholder="Ask anything about your project..."
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") sendMessage();
                    }}
                  />
                  <button className={cx("btnSm", "btnAccent")} type="button" onClick={() => sendMessage()}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Smart FAQ" ? (
            <div className={styles.aiAutoBody}>
              <div className={styles.aiAutoSectionTitle}>Smart FAQ</div>
              {FAQS.map((faq, i) => (
                <div key={faq.question} className={styles.aiAutoFaqItem}>
                  <button type="button" className={styles.aiAutoFaqQ} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                    <span>{faq.question}</span>
                    <span className={cx(styles.aiAutoFaqArrow, faqOpen === i && styles.aiAutoFaqArrowOpen)}>›</span>
                  </button>
                  {faqOpen === i ? <div className={styles.aiAutoFaqA}>{faq.answer}</div> : null}
                </div>
              ))}
            </div>
          ) : null}

          {tab === "Meeting Notes" ? (
            <div className={styles.aiAutoBody}>
              <div className={styles.aiAutoSectionTitle}>AI Meeting Summaries</div>
              {NOTES.map((note) => (
                <div key={note.title} className={styles.aiAutoNoteCard}>
                  <div className={styles.aiAutoNoteHead}>
                    <div className={styles.aiAutoNoteTitle}>{note.title}</div>
                    <div className={styles.aiAutoNoteDate}>{note.date}</div>
                  </div>
                  <div className={styles.aiAutoNoteBody}>{note.body}</div>
                  <div className={styles.aiAutoNoteActionLabel}>Action Items</div>
                  <div className={styles.aiAutoNoteActions}>
                    {note.actions.map((action) => (
                      <div key={action.text} className={styles.aiAutoNoteActionRow}>
                        <span className={cx(styles.aiAutoNoteCheck, action.done && styles.aiAutoNoteCheckDone)} />
                        <span className={cx(styles.aiAutoNoteActionText, action.done && styles.aiAutoNoteActionTextDone)}>{action.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "Invoice Anomalies" ? (
            <div className={styles.aiAutoBody}>
              <div className={styles.aiAutoSectionTitle}>Invoice Anomaly Detection</div>
              {ANOMALIES.map((anomaly) => (
                <div key={anomaly.title} className={cx(styles.aiAutoAnomaly, anomaly.flagged && styles.aiAutoAnomalyFlag)}>
                  <div className={styles.aiAutoAnomalyHead}>
                    <div className={styles.aiAutoAnomalyTitle}>{anomaly.title}</div>
                    <span className={cx("badge", anomaly.flagged ? "badgeRed" : "badgeGreen")}>{anomaly.flagged ? "Flagged" : "Clean"}</span>
                  </div>
                  <div className={styles.aiAutoAnomalyBody}>{anomaly.body}</div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "Burn Rate Forecast" ? (
            <div className={styles.aiAutoBody}>
              <div className={styles.aiAutoSectionTitle}>Retainer &amp; Budget Burn Forecast</div>
              <div className={styles.aiAutoBurnCard}>
                {[
                  { label: "Discovery", used: 100, forecast: 100, value: "R 8,000", tone: styles.aiAutoToneGreen },
                  { label: "Brand Identity", used: 100, forecast: 100, value: "R 18,000", tone: styles.aiAutoToneGreen },
                  { label: "UI/UX Design", used: 31, forecast: 85, value: "R 6,800 / R 22,000", tone: styles.aiAutoToneAccent },
                  { label: "Frontend Dev", used: 0, forecast: 95, value: "R 0 / R 24,000", tone: styles.aiAutoTonePurple },
                  { label: "QA & Testing", used: 0, forecast: 90, value: "R 0 / R 5,000", tone: styles.aiAutoToneBlue },
                ].map((row) => (
                  <div key={row.label} className={styles.aiAutoBurnRow}>
                    <div className={styles.aiAutoBurnLabel}>{row.label}</div>
                    <div className={styles.aiAutoBurnTrack}>
                      <span className={styles.aiAutoBurnForecast} style={{ width: `${row.forecast}%` }} />
                      <span className={cx(styles.aiAutoBurnUsed, row.tone)} style={{ width: `${row.used}%` }} />
                    </div>
                    <div className={styles.aiAutoBurnPct}>{row.used}%</div>
                    <div className={styles.aiAutoBurnVal}>{row.value}</div>
                  </div>
                ))}
              </div>

              <div className={styles.aiAutoGrid2}>
                <div className={cx("card")}> 
                  <div className={cx("cardHeader")}>
                    <div>
                      <div className={cx("cardTitle")}>AI Forecast</div>
                      <div className={cx("cardSubtitle")}>Confidence: High</div>
                    </div>
                    <span className={cx("badge", "badgeGreen")}>On Budget</span>
                  </div>
                  <div className={cx("cardBody", styles.aiAutoMonoText)}>
                    Projected completion remains around R 78,400 with current scope.
                    Approving both open scope changes increases projected total to R 101,900.
                  </div>
                </div>

                <div className={cx("card")}> 
                  <div className={cx("cardHeader")}>
                    <div>
                      <div className={cx("cardTitle")}>Budget Alerts</div>
                      <div className={cx("cardSubtitle")}>Automated thresholds</div>
                    </div>
                  </div>
                  <div className={cx("cardBody", styles.aiAutoStack10)}>
                    {[
                      ["50% budget reached", "Feb 28 (estimated)"],
                      ["75% budget reached", "Mar 14 (estimated)"],
                      ["90% budget reached", "Mar 21 (estimated)"],
                    ].map(([label, eta]) => (
                      <div key={label} className={styles.aiAutoBudgetAlertRow}>
                        <div>
                          <div className={styles.aiAutoBudgetAlertTitle}>{label}</div>
                          <div className={styles.aiAutoBudgetAlertEta}>{eta}</div>
                        </div>
                        <span className={cx("badge", "badgeMuted")}>Upcoming</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {toast ? (
        <div className={cx("toastStack")}>
          <div className={cx("toast", "toastSuccess")}>
            <strong>{toast.title}</strong>
            <div>{toast.subtitle}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
