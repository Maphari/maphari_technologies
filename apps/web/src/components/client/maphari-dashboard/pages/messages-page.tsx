import { useMemo, useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import type { PortalConversation, PortalMessage } from "../../../../lib/api/portal";
import { cx, styles } from "../style";
import type { ThreadPreview } from "../types";

type MessagesPageProps = {
  active: boolean;
  openThreadsCount: number;
  messageThreads: ThreadPreview[];
  threadSearch: string;
  onThreadSearchChange: (value: string) => void;
  newThreadSubject: string;
  onNewThreadSubjectChange: (value: string) => void;
  creatingThread: boolean;
  onCreateThread: () => void;
  selectedConversationId: string | null;
  onThreadClick: (id: string) => void;
  selectedConversation: PortalConversation | null;
  selectedProjectName: string;
  messagesLoading: boolean;
  conversationMessages: PortalMessage[];
  composeMessage: string;
  setComposeMessage: Dispatch<SetStateAction<string>>;
  onSendMessage: () => void;
  onAttachFile: (event: ChangeEvent<HTMLInputElement>) => void;
  attachingFile: boolean;
};

type MessageTab = "Messages" | "Activity" | "Support Ticket";
type TicketPriority = "Low" | "Medium" | "High";
type ChipTone = "green" | "purple" | "amber" | "red" | "muted";

type ThreadSeed = {
  id: number;
  name: string;
  avatar: string;
  avatarBg: string;
  avatarColor: string;
  title: string;
  preview: string;
  time: string;
  tags: Array<{ tone: ChipTone; label: string }>;
  unread: boolean;
  project: string;
};

type MessageSeed = {
  id: number;
  from: string;
  fromName: string;
  text: string;
  time: string;
  mine: boolean;
  reactions: string[];
  avatarBg: string;
  avatarColor: string;
  file?: {
    name: string;
    size: string;
  };
};

type ActivitySeed = {
  dot: string;
  actor: string;
  action: string;
  time: string;
};

/* ─── Chip tone → CSS module badge mapping ─────────────────────────────── */
const CHIP_CLASS: Record<ChipTone, string> = {
  green:  styles.badgeAccent,
  purple: styles.badgePurple,
  amber:  styles.badgeAmber,
  muted:  styles.badgeMuted,
  red:    styles.badgeRed,
};

/* ─── Seed data ─────────────────────────────────────────────────────────── */

export const CLIENT_MESSAGES_UPDATES_THREADS: ThreadSeed[] = [
  {
    id: 1,
    name: "Thabo Khumalo",
    avatar: "TK",
    avatarBg: "var(--amber-d)",
    avatarColor: "var(--amber)",
    title: "Stripe Integration — Staging Live",
    preview: "All endpoints confirmed. Ready for your go-ahead on production deploy.",
    time: "Now",
    tags: [{ tone: "green", label: "projects" }],
    unread: true,
    project: "Client Portal v2"
  },
  {
    id: 2,
    name: "James Mahlangu",
    avatar: "JM",
    avatarBg: "rgba(255,95,95,0.1)",
    avatarColor: "var(--red)",
    title: "UAT Checklist — Items 1–7",
    preview: "Checklist shared. 7 items need your sign-off before Friday's window.",
    time: "2h",
    tags: [{ tone: "amber", label: "milestone" }],
    unread: true,
    project: "Lead Pipeline"
  },
  {
    id: 3,
    name: "Lerato Mokoena",
    avatar: "LM",
    avatarBg: "var(--purple-d)",
    avatarColor: "var(--purple)",
    title: "Updated Figma Screens v3",
    preview: "14 screens exported. Handoff doc attached in this thread.",
    time: "Yesterday",
    tags: [{ tone: "purple", label: "design" }],
    unread: false,
    project: "Automation Suite"
  },
  {
    id: 4,
    name: "Sipho Ndlovu",
    avatar: "SN",
    avatarBg: "var(--accent-d)",
    avatarColor: "var(--accent)",
    title: "Q1 Kickoff — Action Items",
    preview: "Meeting notes attached. Your approvals needed on 3 items.",
    time: "Feb 18",
    tags: [{ tone: "muted", label: "general" }],
    unread: false,
    project: "All Projects"
  },
  {
    id: 5,
    name: "Nomsa Dlamini",
    avatar: "ND",
    avatarBg: "rgba(52,217,139,0.1)",
    avatarColor: "var(--green)",
    title: "QA Report — Sprint 4",
    preview: "All tests passing. Zero critical issues found in staging.",
    time: "Feb 17",
    tags: [{ tone: "green", label: "qa" }],
    unread: false,
    project: "Client Portal v2"
  }
];

export const CLIENT_MESSAGES_UPDATES_MESSAGES: MessageSeed[] = [
  {
    id: 1,
    from: "TK",
    fromName: "Thabo K.",
    text: "Hey! Just confirmed the Stripe integration is live on staging. All 14 endpoints returning correct responses.",
    time: "09:12",
    mine: false,
    reactions: ["👍", "✅"],
    avatarBg: "var(--amber-d)",
    avatarColor: "var(--amber)"
  },
  {
    id: 2,
    from: "TK",
    fromName: "Thabo K.",
    text: "I've attached the deployment checklist below. Once you give the green light, we can push to production within the hour.",
    time: "09:13",
    mine: false,
    reactions: [],
    avatarBg: "var(--amber-d)",
    avatarColor: "var(--amber)",
    file: { name: "Deployment-Checklist-v2.pdf", size: "124 KB" }
  },
  {
    id: 3,
    from: "me",
    fromName: "You",
    text: "Amazing work. Give me 20 mins to review the checklist and I'll confirm.",
    time: "09:31",
    mine: true,
    reactions: ["🔥"],
    avatarBg: "var(--accent-d)",
    avatarColor: "var(--accent)"
  },
  {
    id: 4,
    from: "TK",
    fromName: "Thabo K.",
    text: "No rush! Load test results are clean — p95 latency under 180ms. Everything looks solid.",
    time: "09:33",
    mine: false,
    reactions: ["💪"],
    avatarBg: "var(--amber-d)",
    avatarColor: "var(--amber)"
  },
  {
    id: 5,
    from: "me",
    fromName: "You",
    text: "Reviewed. All items checked out. Go ahead and push to production. Excellent work by the whole team!",
    time: "09:52",
    mine: true,
    reactions: ["✅", "🎉"],
    avatarBg: "var(--accent-d)",
    avatarColor: "var(--accent)"
  }
];

export const CLIENT_MESSAGES_UPDATES_ACTIVITY: ActivitySeed[] = [
  { dot: "var(--accent)", actor: "Thabo K.",  action: "sent a message in Stripe Integration",                   time: "Just now"  },
  { dot: "var(--amber)", actor: "James M.",   action: "shared the UAT checklist — 7 items pending your approval", time: "2h ago"    },
  { dot: "var(--purple)",actor: "Lerato M.",  action: "uploaded 14 Figma screens to Design thread",              time: "Yesterday" },
  { dot: "var(--red)",   actor: "System",     action: "flagged INV-011 as overdue — 18 days past due date",      time: "Feb 19"    },
  { dot: "var(--green)", actor: "Nomsa D.",   action: "closed all QA issues in Sprint 4 report",                 time: "Feb 17"    }
];

export const CLIENT_MESSAGES_UPDATES_TICKET_CATEGORIES = [
  "Project / Milestone Issue",
  "Invoice / Billing Query",
  "Technical Problem",
  "Communication Issue",
  "File / Document Access",
  "Other"
] as const;

export const CLIENT_MESSAGES_UPDATES_PROJECTS = [
  "Client Portal v2",
  "Lead Pipeline Rebuild",
  "Automation Suite",
  "Not project-specific"
] as const;

/* ─── Component ─────────────────────────────────────────────────────────── */

export function ClientMessagesPage({ active }: MessagesPageProps) {
  const [activeTab, setActiveTab]           = useState<MessageTab>("Messages");
  const [activeThreadId, setActiveThreadId] = useState<number>(CLIENT_MESSAGES_UPDATES_THREADS[0]?.id ?? 0);
  const [messages, setMessages]             = useState<MessageSeed[]>(CLIENT_MESSAGES_UPDATES_MESSAGES);
  const [compose, setCompose]               = useState("");
  const [threads, setThreads]               = useState<ThreadSeed[]>(CLIENT_MESSAGES_UPDATES_THREADS);
  const [searchThread, setSearchThread]     = useState("");
  const [priority, setPriority]             = useState<TicketPriority>("Medium");
  const [toast, setToast]                   = useState<{ text: string; sub: string } | null>(null);
  const msgBodyRef                          = useRef<HTMLDivElement>(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? threads[0],
    [activeThreadId, threads]
  );

  /* ── Read receipt: find last outgoing message index ── */
  const lastMineIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].mine) return i;
    }
    return -1;
  }, [messages]);

  const filteredThreads = useMemo(
    () =>
      threads.filter(
        (t) =>
          t.title.toLowerCase().includes(searchThread.toLowerCase()) ||
          t.preview.toLowerCase().includes(searchThread.toLowerCase())
      ),
    [threads, searchThread]
  );

  const unreadCount = useMemo(() => threads.filter((t) => t.unread).length, [threads]);

  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3200);
  };

  const sendMessage = () => {
    if (!compose.trim()) return;
    const next: MessageSeed = {
      id: Date.now(),
      from: "me",
      fromName: "You",
      text: compose.trim(),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      mine: true,
      reactions: [],
      avatarBg: "var(--accent-d)",
      avatarColor: "var(--accent)"
    };
    setMessages((prev) => [...prev, next]);
    setCompose("");
    window.requestAnimationFrame(() => {
      if (msgBodyRef.current) msgBodyRef.current.scrollTop = msgBodyRef.current.scrollHeight;
    });
  };

  const selectThread = (thread: ThreadSeed) => {
    setActiveThreadId(thread.id);
    setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, unread: false } : t)));
  };

  const addReaction = (msgId: number, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        return {
          ...m,
          reactions: m.reactions.includes(emoji)
            ? m.reactions.filter((r) => r !== emoji)
            : [...m.reactions, emoji]
        };
      })
    );
  };

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-messages">

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Work</div>
          <div className={styles.pageTitle}>Messages</div>
          <p className={styles.pageSub}>
            Real-time threads with your project team. All updates, approvals and file handoffs in one place.
          </p>
        </div>
        <div className={styles.headerRight}>
          {unreadCount > 0 ? (
            <span className={cx(styles.badge, styles.badgeAmber)}>
              {unreadCount} unread
            </span>
          ) : (
            <span className={cx(styles.badge, styles.badgeMuted)}>All read</span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className={styles.filterBar} style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {(["Messages", "Activity", "Support Ticket"] as const).map((tab) => (
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

      {/* ── Messages tab ──────────────────────────────────────── */}
      {activeTab === "Messages" ? (
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

          {/* Thread list */}
          <div className={styles.threadList} style={{ width: 320, flexShrink: 0 }}>
            {/* Search */}
            <div className={styles.threadSearch}>
              <input
                className={styles.convInput}
                style={{ fontSize: "0.72rem", padding: "7px 10px" }}
                placeholder="Search threads…"
                value={searchThread}
                onChange={(e) => setSearchThread(e.target.value)}
              />
            </div>

            {/* Category chips */}
            <div style={{
              display: "flex", gap: 6, padding: "10px 14px", borderBottom: "1px solid var(--border)",
              overflowX: "auto", flexShrink: 0, background: "var(--surface2)"
            }}>
              {[
                { label: "All",      dot: "var(--accent)", badge: unreadCount },
                { label: "Projects", dot: "var(--green)",  badge: 0 },
                { label: "Design",   dot: "var(--purple)", badge: 0 },
                { label: "Finance",  dot: "var(--red)",    badge: 0 },
              ].map((f, i) => (
                <button
                  key={f.label}
                  type="button"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 9px",
                    border: `1px solid ${i === 0 ? "rgba(200,241,53,0.3)" : "var(--border)"}`,
                    background: i === 0 ? "var(--accent-d)" : "transparent",
                    color: i === 0 ? "var(--accent)" : "var(--muted)",
                    fontSize: "0.62rem", whiteSpace: "nowrap", flexShrink: 0
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: f.dot, flexShrink: 0 }} />
                  {f.label}
                  {f.badge > 0 ? (
                    <span style={{
                      fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", borderRadius: 99,
                      background: "var(--accent)", color: "var(--on-accent)"
                    }}>
                      {f.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Thread items */}
            {filteredThreads.length === 0 ? (
              <div className={styles.threadEmptyState}>
                <div className={styles.threadEmptyIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className={styles.threadEmptyTitle}>No threads found</div>
                <div className={styles.threadEmptySub}>Try a different search term</div>
              </div>
            ) : null}
            {filteredThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={cx(styles.threadItem, activeThread?.id === thread.id && styles.threadItemActive)}
                onClick={() => selectThread(thread)}
                style={{ display: "flex", gap: 10, padding: "14px 16px", textAlign: "left", width: "100%", background: "transparent", border: "none", position: "relative" }}
              >
                <div
                  className={styles.threadAvatar}
                  style={{ background: thread.avatarBg, color: thread.avatarColor }}
                >
                  {thread.avatar}
                </div>
                <div className={styles.threadContent}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span className={styles.threadSender}
                      style={{ fontWeight: thread.unread ? 800 : 600, color: thread.unread ? "var(--text)" : "var(--muted)" }}>
                      {thread.title}
                    </span>
                    <span className={styles.threadTime}>{thread.time}</span>
                  </div>
                  <div className={styles.threadPreview}>{thread.preview}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                    {thread.tags.map((tag) => (
                      <span key={`${thread.id}-${tag.label}`} className={cx(styles.badge, CHIP_CLASS[tag.tone])}>
                        {tag.label}
                      </span>
                    ))}
                    <span style={{ fontSize: "0.52rem", color: "var(--muted2)", marginLeft: "auto", alignSelf: "center" }}>
                      {thread.project}
                    </span>
                  </div>
                </div>
                {thread.unread ? (
                  <div className={styles.threadUnread} style={{ position: "absolute", top: 16, right: 14 }} />
                ) : null}
              </button>
            ))}
          </div>

          {/* Conversation panel */}
          <div className={styles.convPanel} key={`conv-${activeThreadId}`}>
            {/* Conversation header */}
            <div className={styles.convHeader} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className={styles.convTitle}>{activeThread?.title ?? "Select a thread"}</div>
                <div className={styles.convSub}>
                  {activeThread?.project ?? "No project"} · {activeThread?.name ?? "No contact"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["📌", "🔍", "⋯"] as const).map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    style={{
                      width: 30, height: 30, background: "transparent", border: "1px solid var(--border)",
                      color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", transition: "all 0.15s"
                    }}
                    onClick={() => showToast("Action triggered", icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className={styles.convMessages} ref={msgBodyRef}>
              {messages.map((msg, msgIdx) => (
                <div
                  key={msg.id}
                  className={cx(styles.msgBubble, msg.mine && styles.msgBubbleRight)}
                >
                  {!msg.mine ? (
                    <div
                      className={styles.msgAvatar}
                      style={{ background: msg.avatarBg, color: msg.avatarColor }}
                    >
                      {msg.from}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", flexDirection: "column", maxWidth: "70%" }}>
                    <div style={{
                      fontSize: "0.56rem", color: "var(--muted2)", marginBottom: 4,
                      textAlign: msg.mine ? "right" : "left"
                    }}>
                      {msg.fromName}
                    </div>
                    <div className={cx(styles.msgContent, msg.mine ? styles.msgContentRight : styles.msgContentLeft)}>
                      {msg.text}
                      {msg.file ? (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                          background: "var(--surface2)", border: "1px solid var(--border)", marginTop: 8, borderRadius: 4
                        }}>
                          <div style={{
                            width: 28, height: 28, background: "var(--accent-d)", color: "var(--accent)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", flexShrink: 0
                          }}>
                            📄
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700 }}>{msg.file.name}</div>
                            <div style={{ fontSize: "0.58rem", color: "var(--muted)" }}>{msg.file.size}</div>
                          </div>
                          <button
                            type="button"
                            style={{ fontSize: "0.58rem", color: "var(--accent)", background: "transparent", border: "none", textDecoration: "underline" }}
                            onClick={() => showToast("Downloading…", msg.file?.name ?? "Attachment")}
                          >
                            ↓ Download
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div style={{
                      fontSize: "0.52rem", color: "var(--muted2)", marginTop: 4,
                      textAlign: msg.mine ? "right" : "left"
                    }}>
                      {msg.time}
                    </div>
                    {/* Read receipt — only on the last outgoing message */}
                    {msg.mine && msgIdx === lastMineIndex ? (
                      <div className={styles.msgReadReceipt}>Seen by team</div>
                    ) : null}
                    {msg.reactions.length > 0 ? (
                      <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap", justifyContent: msg.mine ? "flex-end" : "flex-start" }}>
                        {msg.reactions.map((r) => (
                          <button
                            key={`${msg.id}-${r}`}
                            type="button"
                            style={{
                              padding: "2px 8px", background: msg.mine ? "var(--accent-d)" : "var(--tint-overlay)",
                              border: `1px solid ${msg.mine ? "rgba(200,241,53,0.3)" : "var(--border)"}`,
                              borderRadius: 99, fontSize: "0.68rem", transition: "all 0.15s"
                            }}
                            onClick={() => addReaction(msg.id, r)}
                          >
                            {r}
                          </button>
                        ))}
                        <button
                          type="button"
                          style={{
                            padding: "2px 8px", background: "var(--tint-overlay)", border: "1px solid var(--border)",
                            borderRadius: 99, fontSize: "0.68rem", color: "var(--muted)", transition: "all 0.15s"
                          }}
                          onClick={() => addReaction(msg.id, "👍")}
                        >
                          +
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {msg.mine ? (
                    <div className={styles.msgAvatar} style={{ background: "var(--accent-d)", color: "var(--accent)" }}>
                      Me
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Compose */}
            <div className={styles.convCompose} style={{ flexDirection: "column", gap: 8 }}>
              {/* Mention row */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.54rem", color: "var(--muted2)" }}>@ Mention:</span>
                {CLIENT_MESSAGES_UPDATES_THREADS.slice(0, 4).map((t) => (
                  <button
                    key={`mention-${t.id}`}
                    type="button"
                    style={{
                      fontSize: "0.54rem", padding: "3px 8px", borderRadius: 99,
                      background: "var(--tint-overlay)", border: "1px solid var(--border)",
                      color: "var(--muted)", transition: "all 0.15s"
                    }}
                    onClick={() => setCompose((prev) => `${prev} @${t.name.split(" ")[0]}`)}
                  >
                    {t.name.split(" ")[0]}
                  </button>
                ))}
              </div>
              {/* Input row */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <textarea
                  className={styles.convInput}
                  style={{ resize: "none", minHeight: 38, maxHeight: 120, lineHeight: 1.5 }}
                  placeholder="Type a message… use @ to mention someone"
                  rows={1}
                  value={compose}
                  onChange={(e) => setCompose(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                  <button
                    type="button"
                    style={{
                      width: 32, height: 32, background: "transparent", border: "1px solid var(--border)",
                      color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem"
                    }}
                    onClick={() => showToast("File picker", "Choose a file to attach")}
                  >
                    📎
                  </button>
                  <button
                    type="button"
                    style={{
                      width: 32, height: 32, background: "transparent", border: "1px solid var(--border)",
                      color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem"
                    }}
                    onClick={() => showToast("Voice note", "Recording — speak now")}
                  >
                    🎙
                  </button>
                  <button type="button" className={styles.convSend} onClick={sendMessage}>
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div style={{
            width: 280, flexShrink: 0, borderLeft: "1px solid var(--border)",
            overflowY: "auto", display: "flex", flexDirection: "column", background: "var(--surface)"
          }}>
            {/* Nudge card */}
            <div className={styles.card} style={{ margin: 14, marginBottom: 0 }}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>Request an Update</div>
              </div>
              <div className={styles.cardBody}>
                <p style={{ fontSize: "0.7rem", color: "var(--muted)", lineHeight: 1.55, marginBottom: 10 }}>
                  Send a gentle nudge to the team without messaging directly.
                </p>
                <button
                  type="button"
                  style={{
                    width: "100%", background: "var(--accent-d)", border: "1px solid rgba(200,241,53,0.2)",
                    color: "var(--accent)", fontSize: "0.6rem", letterSpacing: "0.1em",
                    textTransform: "uppercase", padding: 8, fontWeight: 700, transition: "all 0.15s"
                  }}
                  onClick={() => showToast("Status nudge sent", "Team has been notified you're waiting on an update")}
                >
                  Send Nudge
                </button>
              </div>
            </div>

            {/* Recent activity */}
            <div style={{ padding: "16px 14px 0" }}>
              <div style={{ fontSize: "0.56rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 10 }}>
                Recent Activity
              </div>
              {CLIENT_MESSAGES_UPDATES_ACTIVITY.map((item) => (
                <div
                  key={`${item.actor}-${item.time}`}
                  style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.dot, flexShrink: 0, marginTop: 4 }} />
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.5 }}>
                      <strong style={{ color: "var(--text)", fontWeight: 700 }}>{item.actor}</strong> {item.action}
                    </div>
                    <div style={{ fontSize: "0.54rem", color: "var(--muted2)", marginTop: 2 }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Activity tab ──────────────────────────────────────── */}
      {activeTab === "Activity" ? (
        <div className={styles.pageBody}>
          <div>
            <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>All Project Activity</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 720 }}>
              {[
                ...CLIENT_MESSAGES_UPDATES_ACTIVITY,
                ...CLIENT_MESSAGES_UPDATES_ACTIVITY.map((item, i) => ({ ...item, time: `${i + 1} weeks ago` }))
              ].map((item) => (
                <div
                  key={`${item.actor}-${item.action}-${item.time}`}
                  className={styles.card}
                  style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px" }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.dot, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.76rem", color: "var(--muted)", lineHeight: 1.5 }}>
                      <strong style={{ color: "var(--text)", fontWeight: 700 }}>{item.actor}</strong> {item.action}
                    </div>
                    <div style={{ fontSize: "0.54rem", color: "var(--muted2)", marginTop: 4 }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Support Ticket tab ────────────────────────────────── */}
      {activeTab === "Support Ticket" ? (
        <div className={styles.pageBody}>
          <div style={{ maxWidth: 640 }}>
            {/* Callout */}
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderLeft: "2px solid var(--accent)", padding: "14px 18px", marginBottom: 24
            }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: 4 }}>Submit a Support Ticket</div>
              <div style={{ fontSize: "0.62rem", color: "var(--muted)", lineHeight: 1.6 }}>
                Use this form to log an issue, ask a question, or flag something that needs attention.
                We'll respond within 1 business day.
              </div>
            </div>

            {/* Form */}
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Subject</label>
                <input className={styles.formInput} placeholder="Brief description of the issue" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <select title="category" className={styles.formSelect}>
                  {CLIENT_MESSAGES_UPDATES_TICKET_CATEGORIES.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Priority selector */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Priority</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {(["Low", "Medium", "High"] as const).map((item) => {
                    const selected = priority === item;
                    const colors: Record<TicketPriority, string> = {
                      Low: "var(--green)", Medium: "var(--amber)", High: "var(--red)"
                    };
                    return (
                      <button
                        key={item}
                        type="button"
                        style={{
                          padding: "9px 8px", background: selected ? `color-mix(in srgb, ${colors[item]} 10%, transparent)` : "var(--bg)",
                          border: `1px solid ${selected ? colors[item] : "var(--border)"}`,
                          color: selected ? colors[item] : "var(--muted)",
                          fontSize: "0.68rem", fontWeight: 700, transition: "all 0.15s", textAlign: "center"
                        }}
                        onClick={() => setPriority(item)}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Project (if applicable)</label>
                <select title="project" className={styles.formSelect}>
                  <option value="">Select a project…</option>
                  {CLIENT_MESSAGES_UPDATES_PROJECTS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  rows={5}
                  placeholder="Describe the issue in detail. Include steps to reproduce if it's a technical problem."
                />
              </div>

              {/* Upload dropzone */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Attachments (optional)</label>
                <div style={{
                  border: "1px dashed var(--border2)", padding: 18, textAlign: "center",
                  fontSize: "0.62rem", color: "var(--muted2)", letterSpacing: "0.08em"
                }}>
                  Drop files here or click to upload · Max 10 MB per file
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className={cx(styles.button, styles.buttonAccent)}
                  onClick={() => showToast("Ticket submitted", "We'll respond within 1 business day")}
                >
                  Submit Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Local toast */}
      {toast ? (
        <div style={{
          position: "fixed", bottom: 28, right: 28, background: "var(--surface)",
          border: "1px solid var(--accent)", padding: "14px 20px", zIndex: 200,
          display: "flex", alignItems: "center", gap: 12,
          animation: "slideUp var(--dur-normal, 250ms) var(--ease-out, cubic-bezier(0.23,1,0.32,1))"
        }}>
          <div style={{
            width: 24, height: 24, background: "var(--accent)", color: "var(--on-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.7rem", fontWeight: 700, flexShrink: 0, borderRadius: "50%"
          }}>
            ✓
          </div>
          <div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
