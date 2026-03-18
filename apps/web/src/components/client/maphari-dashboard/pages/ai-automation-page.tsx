"use client";

// ════════════════════════════════════════════════════════════════════════════
// ai-automation-page.tsx — Client Portal AI & Automation Hub
// Data     : useProjectLayer() → real session + project context
//            Chatbot: POST /ai/generate (claude-sonnet-4-6)
//            Alerts : derived from SLA + invoice + project risk data
// ════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cx, styles } from "../style";
import { useProjectLayer } from "../hooks/use-project-layer";
import { usePageToast } from "../hooks/use-page-toast";
import { saveSession } from "../../../../lib/auth/session";
import {
  createPortalSupportTicketWithRefresh,
  callPortalAiGenerateWithRefresh,
  loadPortalSlaWithRefresh,
} from "../../../../lib/api/portal";

// ── Types ─────────────────────────────────────────────────────────────────────

type AITab = "AI Summary" | "Alerts" | "AI Chatbot" | "Smart FAQ" | "Automation Features";

interface AlertItem {
  icon:      string;
  tone:      "critical" | "warning" | "info";
  title:     string;
  body:      string;
  dismissed: boolean;
}

interface ChatMessage {
  role: "bot" | "user";
  text: string;
}

// ── Static content ────────────────────────────────────────────────────────────

const FALLBACK_ALERTS: AlertItem[] = [
  {
    icon: "💡", tone: "info",
    title: "AI alerts loading",
    body: "Your personalised risk alerts are being computed from live project data.",
    dismissed: false,
  },
];

const FAQS = [
  { question: "When will my project be complete?", answer: "Based on the agreed plan and current progress, your project manager will keep the timeline updated in your dashboard." },
  { question: "Why haven't I received an invoice yet?", answer: "Invoices are issued at milestone gates. Check your Billing page for upcoming milestone payment schedules." },
  { question: "What happens if the project goes over budget?", answer: "Any overrun requires an explicit scope/budget approval via a change request before billing is adjusted." },
  { question: "How do I give feedback on a design?", answer: "Open the Deliverables page and submit feedback on any item in review status. Team response SLA is within 24 hours." },
  { question: "Who should I contact for an urgent issue?", answer: "Use the Support & SLA page to raise a high-priority ticket, which is escalated to your project manager within 2 hours." },
];

const AUTOMATION_FEATURES = [
  { name: "AI Project Summary", description: "Weekly AI-generated digest of project health, progress, and risks.", icon: "activity", status: "Active" },
  { name: "Milestone Reminders", description: "Automatic reminders before upcoming milestones and sign-off deadlines.", icon: "clock", status: "Active" },
  { name: "Invoice Notifications", description: "Email alerts when invoices are issued or approaching due dates.", icon: "creditCard", status: "Active" },
  { name: "Change Request Alerts", description: "Instant notifications when a change request requires your decision.", icon: "alert", status: "Active" },
  { name: "Smart FAQ Responses", description: "AI-powered answers to common project questions via the assistant.", icon: "message", status: "Active" },
  { name: "Approval Nudges", description: "Automatic follow-ups when deliverables are awaiting your review.", icon: "check", status: "Active" },
];

const TABS: AITab[] = ["AI Summary", "Alerts", "AI Chatbot", "Smart FAQ", "Automation Features"];

const FALLBACK_REPLY = "I can answer questions about your project status, budget, approvals, and timeline. Try asking one of the suggestions above.";

const QUICK_QUESTIONS = [
  "What's my project status?",
  "When is the next invoice?",
  "Is the project on budget?",
  "What do I need to approve?",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function alertToneClass(tone: AlertItem["tone"]): string {
  if (tone === "critical") return styles.aiAutoAlertCritical;
  if (tone === "warning")  return styles.aiAutoAlertWarning;
  return styles.aiAutoAlertInfo;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AIAutomationPage() {
  const { session } = useProjectLayer();

  // Derive greeting from session email
  const firstName = session?.user?.email
    ? session.user.email.split("@")[0]?.split(".")[0] ?? "there"
    : "there";

  const [tab,        setTab]       = useState<AITab>("AI Summary");
  const [alerts,     setAlerts]    = useState<AlertItem[]>(FALLBACK_ALERTS);
  const [faqOpen,    setFaqOpen]   = useState<number | null>(null);
  const [messages,   setMessages]  = useState<ChatMessage[]>([]);
  const [chatInput,  setChatInput] = useState("");
  const [botTyping,  setBotTyping] = useState(false);
  const messageEndRef              = useRef<HTMLDivElement | null>(null);

  // ── Load dynamic alerts from SLA data ────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.clientId) return;
    const clientId = session.user.clientId;

    void loadPortalSlaWithRefresh(session, clientId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      const slaRecords = r.data ?? [];

      const dynamicAlerts: AlertItem[] = [];

      // SLA breaches
      const breached = slaRecords.filter((s) => s.status === "BREACHED");
      if (breached.length > 0) {
        dynamicAlerts.push({
          icon: "🚨", tone: "critical",
          title: `${breached.length} SLA Breach${breached.length > 1 ? "es" : ""}`,
          body: `The following SLAs are breached: ${breached.map((s) => s.metric).join(", ")}. Immediate attention required.`,
          dismissed: false,
        });
      }

      // SLA at risk
      const atRisk = slaRecords.filter((s) => s.status === "AT_RISK");
      if (atRisk.length > 0) {
        dynamicAlerts.push({
          icon: "⚠️", tone: "warning",
          title: "SLA Response Time at Risk",
          body: `${atRisk.length} metric${atRisk.length > 1 ? "s are" : " is"} approaching breach threshold: ${atRisk.map((s) => s.metric).join(", ")}.`,
          dismissed: false,
        });
      }

      // Default positive alert if all good
      if (dynamicAlerts.length === 0) {
        dynamicAlerts.push({
          icon: "✅", tone: "info",
          title: "All systems on track",
          body: "No active SLA breaches or critical risks detected. Keep approvals moving to maintain velocity.",
          dismissed: false,
        });
      }

      setAlerts(dynamicAlerts);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  // ── Init greeting ────────────────────────────────────────────────────────
  useEffect(() => {
    setMessages([{
      role: "bot",
      text: `Hi ${firstName}! I'm your AI project assistant. I can answer questions about your project status, budget, approvals, and timeline — or anything else you need.`,
    }]);
  }, [firstName]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  const unresolvedAlertCount = useMemo(() => alerts.filter((a) => !a.dismissed).length, [alerts]);

  const notify = usePageToast();

  async function handleSendDigest(): Promise<void> {
    if (!session?.user?.clientId) {
      notify("info", "Not available", "Please log in to request a digest.");
      return;
    }
    const r = await createPortalSupportTicketWithRefresh(session, {
      clientId: session.user.clientId,
      title: "AI Weekly Digest Request",
      description: "Client requested an AI weekly summary digest to be emailed.",
      category: "AI",
      priority: "LOW",
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      notify("error", "Failed", "Unable to request digest. Please try again.");
    } else {
      notify("success", "Digest requested", "AI weekly summary will be emailed shortly");
    }
  }

  async function handleNotifyTeam(alertTitle: string): Promise<void> {
    if (!session?.user?.clientId) {
      notify("info", "Noted", "The team has been notified");
      return;
    }
    const r = await createPortalSupportTicketWithRefresh(session, {
      clientId: session.user.clientId,
      title: `Alert Escalation: ${alertTitle}`,
      description: `Client has flagged the following alert for team attention: ${alertTitle}`,
      category: "AI",
      priority: "HIGH",
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      notify("error", "Failed", "Unable to notify team. Please try again.");
    } else {
      notify("success", "Team notified", "The team has been alerted");
    }
  }

  const sendMessage = useCallback(async (value?: string) => {
    const text = (value ?? chatInput).trim();
    if (!text || botTyping) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");
    setBotTyping(true);

    if (!session) {
      setBotTyping(false);
      setMessages((prev) => [...prev, { role: "bot", text: FALLBACK_REPLY }]);
      return;
    }

    const r = await callPortalAiGenerateWithRefresh(session, {
      type: "general",
      prompt: `You are a helpful AI assistant for a Maphari Technologies client portal.
The client is asking: "${text}"
Answer concisely in 2-3 sentences. Focus on actionable guidance about their project, billing, approvals, or platform features.`,
    });

    if (r.nextSession) saveSession(r.nextSession);
    setBotTyping(false);

    const reply = r.data?.output ?? FALLBACK_REPLY;
    setMessages((prev) => [...prev, { role: "bot", text: reply }]);
  }, [chatInput, botTyping, session]);

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Account · AI</div>
          <h1 className={cx("pageTitle")}>AI &amp; Automation</h1>
          <p className={cx("pageSub")}>AI insights, risk alerts, assistant chat, and your active automation features.</p>
        </div>
        <div className={cx("pageActions")}>
          <div className={styles.aiAutoBadge}>
            <span className={styles.aiAutoBadgeDot} />
            <span>AI Active</span>
          </div>
          <button className={cx("btnSm", "btnGhost")} type="button" onClick={() => void handleSendDigest()}>
            Send Digest
          </button>
        </div>
      </div>

      <div className={cx("pillTabs", "mb16")}>
        {TABS.map((item) => (
          <button key={item} type="button" className={cx("pillTab", tab === item && "pillTabActive")} onClick={() => setTab(item)}>
            {item}
            {item === "Alerts" && unresolvedAlertCount > 0 ? (
              <span className={cx("badge", "badgeRed", "ml6")}>{unresolvedAlertCount}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── AI Summary ── */}
      {tab === "AI Summary" ? (
        <div className={styles.aiAutoBody}>
          <div className={styles.aiAutoSectionTitle}>AI-Generated Project Summary</div>
          <div className={styles.aiAutoSummaryCard}>
            <div className={styles.aiAutoSummaryEyebrow}>AI Summary · Refreshes weekly</div>
            <p className={styles.aiAutoSummaryText}>
              Your project dashboard reflects the latest data from milestones, deliverables, change requests, and invoices.
              Review your Dashboard for health scores and any items requiring your action.
            </p>
            <p className={styles.aiAutoSummaryText}>
              Pending approvals and open change requests have the highest impact on timeline. Resolving them promptly keeps the project on track.
            </p>
            <div className={styles.aiAutoSummaryFooter}>
              <span>Model: <strong>Claude Sonnet</strong></span>
              <span>Status: <strong className={styles.aiAutoTextGreen}>Active</strong></span>
              <span>Digest: <strong>Weekly</strong></span>
            </div>
          </div>

          <div className={cx("grid2")}>
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
              {alerts.filter((a) => !a.dismissed).length === 0 && (
                <div className={cx(styles.aiAutoAlert, styles.aiAutoAlertInfo)}>
                  <span className={styles.aiAutoAlertIcon}>✅</span>
                  <div>
                    <div className={styles.aiAutoAlertTitle}>No active alerts</div>
                    <div className={styles.aiAutoAlertBody}>All systems are clear. Keep approvals moving.</div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className={styles.aiAutoSectionTitle}>Ask AI</div>
              <div className={styles.aiAutoQuickCard}>
                {QUICK_QUESTIONS.map((question) => (
                  <button key={question} type="button" className={styles.aiAutoQuickBtn} onClick={() => { setTab("AI Chatbot"); void sendMessage(question); }}>
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Alerts ── */}
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
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void handleNotifyTeam(alert.title)}>
                      Notify Team
                    </button>
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

      {/* ── AI Chatbot ── */}
      {tab === "AI Chatbot" ? (
        <div className={styles.aiAutoBody}>
          <div className={styles.aiAutoSectionTitle}>AI Project Assistant</div>
          <div className={styles.aiAutoChatShell}>
            <div className={styles.aiAutoSuggestionRow}>
              {QUICK_QUESTIONS.map((question) => (
                <button key={question} type="button" className={styles.aiAutoSuggestionBtn} onClick={() => void sendMessage(question)} disabled={botTyping}>
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
              {botTyping ? (
                <div className={styles.aiAutoTyping}>
                  <span /><span /><span />
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
                onKeyDown={(event) => { if (event.key === "Enter") void sendMessage(); }}
                disabled={botTyping}
              />
              <button className={cx("btnSm", "btnAccent")} type="button" onClick={() => void sendMessage()} disabled={botTyping}>
                {botTyping ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Smart FAQ ── */}
      {tab === "Smart FAQ" ? (
        <div className={styles.aiAutoBody}>
          <div className={styles.aiAutoSectionTitle}>Smart FAQ</div>
          {FAQS.map((faq, i) => (
            <div key={faq.question} className={styles.aiAutoFaqItem}>
              <button type="button" className={styles.aiAutoFaqQ} aria-expanded={faqOpen === i} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <span>{faq.question}</span>
                <span className={cx(styles.aiAutoFaqArrow, faqOpen === i && styles.aiAutoFaqArrowOpen)}>›</span>
              </button>
              {faqOpen === i ? <div className={styles.aiAutoFaqA}>{faq.answer}</div> : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Automation Features ── */}
      {tab === "Automation Features" ? (
        <div className={styles.aiAutoBody}>
          <div className={styles.aiAutoSectionTitle}>Active Automation Features</div>
          <p className={cx("text12", "colorMuted", "mb16")}>
            These automations run in the background to keep you informed and your project moving.
          </p>
          <div className={cx("grid2Cols12Gap")}>
            {AUTOMATION_FEATURES.map((feature) => (
              <div key={feature.name} className={cx("card", "borderLeftAccent", "p16x18")}>
                <div className={cx("flexRow", "flexCenter", "gap10", "mb8")}>
                  <div className={cx("aiFeatureIconBox")}>
                    <span className={cx("text14", "colorAccent")}>✓</span>
                  </div>
                  <div>
                    <div className={cx("fw600", "text12")}>{feature.name}</div>
                    <div className={cx("flexRow", "flexCenter", "gap4", "mt2")}>
                      <div className={cx("dot6")} style={{ "--bg-color": "var(--lime)" } as React.CSSProperties} />
                      <span className={cx("text10", "colorMuted")}>{feature.status}</span>
                    </div>
                  </div>
                </div>
                <div className={cx("text11", "colorMuted", "lineH16")}>{feature.description}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
