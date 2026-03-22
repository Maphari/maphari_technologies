"use client";

// ════════════════════════════════════════════════════════════════════════════
// messages-page.tsx — Client Portal Messages & Updates (redesigned)
// Layout  : Left pane (thread list) + Right pane (horizontal pillTabs + content)
// Data    : threads from parent, messages per thread, deliverables & risks for
//           activity feed, support tickets via portal API
// ════════════════════════════════════════════════════════════════════════════

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Av, Ic } from "../ui";
import { cx } from "../style";
import { usePageToast } from "../hooks/use-page-toast";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadConversationMessagesWithRefresh,
  createPortalMessageWithRefresh,
  createPortalConversationWithRefresh,
  createPortalSupportTicketWithRefresh,
  loadPortalDeliverablesWithRefresh,
  loadPortalRisksWithRefresh,
  type PortalDeliverable,
  type PortalRisk,
} from "../../../../lib/api/portal";
import { createInstantVideoRoomWithRefresh } from "../../../../lib/api/portal/video";
import { VideoRoomModal } from "../components/video-room-modal";
import type { Thread as WorkspaceThread } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgTab = "Inbox" | "Activity" | "AI Assistant" | "Support";
type Priority = "Low" | "Medium" | "High";
type ActivityTone = "accent" | "amber" | "purple" | "red" | "green";
type ActivityFilter = "All" | "Deliverables" | "Risks";

type Thread = {
  id: string;
  conversationId: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  avatarInitials: string;
  avatarBg: string;
  projectName: string;
};

type ChatMessage = {
  id: string;
  content: string;
  mine: boolean;
  createdAt: string;
};

type ActivityItem = {
  id: string;
  icon: string;
  tone: ActivityTone;
  title: string;
  sub: string;
  time: string;
};

type AiMsg = { role: "ai" | "user"; text: string };

// ─── Static data ──────────────────────────────────────────────────────────────

const TABS: MsgTab[] = ["Inbox", "Activity", "AI Assistant", "Support"];

const ACTIVITY_FILTERS: ActivityFilter[] = ["All", "Deliverables", "Risks"];

const AI_PROMPTS = [
  "What's the current project status?",
  "Any blockers I should know about?",
  "When is the next milestone?",
  "How is budget tracking?",
];

const AI_INITIAL: AiMsg = {
  role: "ai",
  text: "Hi! I'm your AI project assistant. I have full context on your active projects, milestones, budget, and team activity. Ask me anything.",
};

const AI_REPLIES: Record<string, string> = {
  "What's the current project status?":
    "Your project is currently in active development. The team is on track with the current sprint and deliverables are progressing as planned.",
  "Any blockers I should know about?":
    "No critical blockers at the moment. Check the Risks page for any flagged concerns that the team is monitoring.",
  "When is the next milestone?":
    "Your next milestone is coming up at the end of this sprint. Visit the Milestones page for exact dates and deliverable details.",
  "How is budget tracking?":
    "Budget is on track. For a detailed breakdown visit the Billing page or ask your project manager for the latest forecast.",
};

const TONE_DOT: Record<ActivityTone, string> = {
  accent: "msguDotAccent",
  amber: "msguDotAmber",
  purple: "msguDotPurple",
  red: "msguDotRed",
  green: "msguDotGreen",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function isoToDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function deliverableToActivity(d: PortalDeliverable): ActivityItem {
  return {
    id: `del-${d.id}`,
    icon: "package",
    tone: d.status === "DONE" ? "accent" : d.status === "IN_REVIEW" ? "purple" : "amber",
    title: d.name,
    sub: `Status: ${d.status.replace(/_/g, " ")}`,
    time: fmtAgo(d.updatedAt),
  };
}

function riskToActivity(r: PortalRisk): ActivityItem {
  return {
    id: `risk-${r.id}`,
    icon: "alert",
    tone: r.impact === "HIGH" || r.impact === "CRITICAL" ? "red" : "amber",
    title: r.name,
    sub: `Impact: ${r.impact} · Likelihood: ${r.likelihood}`,
    time: fmtAgo(r.updatedAt),
  };
}

function mapThread(t: WorkspaceThread): Thread {
  return {
    id: t.id,
    conversationId: t.id,
    subject: t.subject,
    preview: t.preview,
    time: fmtAgo(t.lastMessageAt),
    unread: t.unread,
    avatarInitials: t.senderInitials,
    avatarBg: t.avatarBg,
    projectName: t.projectName,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MessagesPage({ threads: apiThreads = [] }: { threads?: WorkspaceThread[] }) {
  const { session, projectId } = useProjectLayer();
  const showToast = usePageToast();

  // ── Core state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<MsgTab>("Inbox");
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [threadSearch, setThreadSearch] = useState("");

  // ── Inbox ─────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [compose, setCompose] = useState("");
  const [sending, setSending] = useState(false);
  const msgBodyRef = useRef<HTMLDivElement>(null);

  // ── New thread modal ──────────────────────────────────────────────────────
  const [showNewThread, setShowNewThread] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);

  // ── Activity ──────────────────────────────────────────────────────────────
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [actFilter, setActFilter] = useState<ActivityFilter>("All");

  // ── AI Assistant ──────────────────────────────────────────────────────────
  const [aiChat, setAiChat] = useState<AiMsg[]>([AI_INITIAL]);
  const [aiInput, setAiInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const aiBodyRef = useRef<HTMLDivElement>(null);

  // ── Support ───────────────────────────────────────────────────────────────
  const [supTitle, setSupTitle] = useState("");
  const [supDesc, setSupDesc] = useState("");
  const [supCategory, setSupCategory] = useState("GENERAL");
  const [supPriority, setSupPriority] = useState<Priority>("Medium");
  const [supSending, setSupSending] = useState(false);
  const [supDone, setSupDone] = useState(false);

  // ── Video room ────────────────────────────────────────────────────────────
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoRoomUrl, setVideoRoomUrl] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const threads = useMemo(() => apiThreads.map(mapThread), [apiThreads]);

  const filteredThreads = useMemo(
    () =>
      threads.filter(
        (t) =>
          threadSearch === "" ||
          t.subject.toLowerCase().includes(threadSearch.toLowerCase()) ||
          t.projectName.toLowerCase().includes(threadSearch.toLowerCase()),
      ),
    [threads, threadSearch],
  );

  const filteredActivity = useMemo(() => {
    if (actFilter === "All") return activityItems;
    if (actFilter === "Deliverables") return activityItems.filter((a) => a.id.startsWith("del-"));
    return activityItems.filter((a) => a.id.startsWith("risk-"));
  }, [activityItems, actFilter]);

  // ── Load messages on thread change ────────────────────────────────────────
  useEffect(() => {
    if (!session || !activeThread) {
      setMessages([]);
      return;
    }
    setLoadingMsgs(true);
    void loadConversationMessagesWithRefresh(session, activeThread.conversationId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setMessages(
          r.data.map((m) => ({
            id: m.id,
            content: m.content,
            mine: m.authorRole === "CLIENT",
            createdAt: m.createdAt,
          })),
        );
      }
      setLoadingMsgs(false);
    });
  }, [activeThread?.conversationId, session?.accessToken]);

  // ── Load activity feed (lazy — first time Activity tab opens) ─────────────
  useEffect(() => {
    if (activeTab !== "Activity" || activityLoaded || !session || !projectId) return;
    void Promise.all([
      loadPortalDeliverablesWithRefresh(session, projectId),
      loadPortalRisksWithRefresh(session, projectId),
    ]).then(([dr, rr]) => {
      if (dr.nextSession) saveSession(dr.nextSession);
      if (rr.nextSession) saveSession(rr.nextSession);
      const items: ActivityItem[] = [
        ...(dr.data ?? []).map(deliverableToActivity),
        ...(rr.data ?? []).map(riskToActivity),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivityItems(items);
      setActivityLoaded(true);
    });
  }, [activeTab, activityLoaded, session?.accessToken, projectId]);

  // ── Scroll to bottom on new messages ──────────────────────────────────────
  useEffect(() => {
    if (msgBodyRef.current) {
      msgBodyRef.current.scrollTop = msgBodyRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (aiBodyRef.current) {
      aiBodyRef.current.scrollTop = aiBodyRef.current.scrollHeight;
    }
  }, [aiChat]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function selectThread(thread: Thread) {
    setActiveThread(thread);
    setActiveTab("Inbox");
  }

  async function handleSend() {
    if (!compose.trim() || !session || !activeThread) return;
    setSending(true);
    const content = compose.trim();
    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`,
      content,
      mine: true,
      createdAt: new Date().toISOString(),
    };
    setCompose("");
    setMessages((prev) => [...prev, optimistic]);
    const r = await createPortalMessageWithRefresh(session, {
      conversationId: activeThread.conversationId,
      content,
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) showToast("error", "Failed to send message");
    setSending(false);
  }

  function handleComposeKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSend();
    }
  }

  async function handleCreateThread() {
    if (!newSubject.trim() || !session) return;
    setCreatingThread(true);
    const r = await createPortalConversationWithRefresh(session, {
      subject: newSubject.trim(),
      projectId: projectId ?? undefined,
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) showToast("error", "Failed to create conversation");
    else showToast("success", "Conversation started");
    setCreatingThread(false);
    setNewSubject("");
    setShowNewThread(false);
  }

  function handleAiPrompt(prompt: string) {
    setAiInput(prompt);
  }

  function handleSendAi() {
    const q = aiInput.trim();
    if (!q) return;
    setAiInput("");
    setAiChat((prev) => [...prev, { role: "user", text: q }]);
    setAiTyping(true);
    setTimeout(() => {
      const reply =
        AI_REPLIES[q] ??
        "I don't have specific data on that right now. Your project manager can give you an accurate answer.";
      setAiChat((prev) => [...prev, { role: "ai", text: reply }]);
      setAiTyping(false);
    }, 900);
  }

  function handleAiKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendAi();
    }
  }

  async function handleSupportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !supTitle.trim() || !supDesc.trim()) return;
    setSupSending(true);
    const r = await createPortalSupportTicketWithRefresh(session, {
      clientId: session.user?.clientId ?? "",
      title: supTitle.trim(),
      description: supDesc.trim(),
      category: supCategory,
      priority: supPriority.toUpperCase(),
    });
    if (r.nextSession) saveSession(r.nextSession);
    setSupSending(false);
    if (r.error) {
      showToast("error", "Failed to submit ticket");
    } else {
      setSupDone(true);
      setSupTitle("");
      setSupDesc("");
      showToast("success", "Support ticket submitted");
    }
  }

  async function handleStartVideoCall() {
    if (!session) return;
    setVideoLoading(true);
    setVideoModalOpen(true);
    setVideoRoomUrl("");
    const r = await createInstantVideoRoomWithRefresh(session);
    if (r.nextSession) saveSession(r.nextSession);
    setVideoLoading(false);
    if (r.error || !r.data) {
      showToast("error", r.error?.message ?? "Failed to start video call");
      setVideoModalOpen(false);
      return;
    }
    setVideoRoomUrl(r.data.joinUrl);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={cx("msguPageRoot", "rdStudioPage")}>
      <div className={cx("msguSplit")}>
        {/* ── LEFT: Thread list ─────────────────────────────────────────── */}
        <aside className={cx("msguLeftPane")}>
          {/* Search + new thread */}
          <div className={cx("msguSearchZone")}>
            <div className={cx("msguThreadSearch")}>
              <Ic n="search" sz={14} c="var(--muted2)" />
              <input
                placeholder="Search conversations…"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                title="Search conversations"
              />
            </div>
            <button
              type="button"
              className={cx("msguIconBtn")}
              onClick={() => setShowNewThread(true)}
              title="New conversation"
            >
              +
            </button>
          </div>

          {/* Thread list */}
          <div className={cx("msguThreadList")}>
            {filteredThreads.length === 0 ? (
              <div className={cx("msguThreadEmpty")}>
                <span>No conversations yet</span>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className={cx(
                    "msguThreadItem",
                    "rdStudioRow",
                    activeThread?.id === thread.id ? "msguThreadItemActive" : "",
                    thread.unread ? "msguThreadItemUnread" : "",
                  )}
                  onClick={() => selectThread(thread)}
                >
                  <div className={cx("msguAvatarWrap")}>
                    <Av initials={thread.avatarInitials} size={34} />
                    {thread.unread && <span className={cx("msguUnreadDot")} />}
                  </div>
                  <div className={cx("msguThreadBody")}>
                    <div className={cx("msguThreadTop")}>
                      <span className={cx("msguThreadName")}>{thread.subject}</span>
                      <span className={cx("msguThreadTime", "fontMono", "rdStudioLabel")}>{thread.time}</span>
                    </div>
                    <div className={cx("msguThreadPreview")}>{thread.preview}</div>
                    {thread.projectName && (
                      <div className={cx("msguProjectTag")}>{thread.projectName}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── RIGHT: Tabs + content ─────────────────────────────────────── */}
        <div className={cx("msguRightPane")}>
          {/* Tab bar */}
          <div className={cx("msguTopBar")}>
            <div className={cx("pillTabs")}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={cx("pillTab", activeTab === tab ? "pillTabActive" : "")}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={cx("btnSm", "btnGhost", "mlAuto")}
              onClick={() => void handleStartVideoCall()}
              disabled={videoLoading || !session}
              title="Start an instant video call"
            >
              <Ic n="video" sz={13} c="var(--text)" />
              {videoLoading ? "Starting…" : "Start Call"}
            </button>
          </div>

          {/* ── INBOX ───────────────────────────────────────────────────── */}
          {activeTab === "Inbox" && (
            <div className={cx("msguChatLayout")}>
              {activeThread ? (
                <>
                  {/* Thread header */}
                  <div className={cx("msguThreadHeader")}>
                    <div className={cx("msguThreadHeaderLeft")}>
                      <Av initials={activeThread.avatarInitials} size={32} />
                      <div>
                        <div className={cx("msguThreadHeaderTitle")}>{activeThread.subject}</div>
                        {activeThread.projectName && (
                          <div className={cx("msguThreadHeaderSub")}>{activeThread.projectName}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className={cx("msguMsgBody")} ref={msgBodyRef}>
                    {loadingMsgs ? (
                      <div className={cx("emptyState")}>
                        <div className={cx("emptyStateTitle", "colorMuted")}>Loading…</div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className={cx("emptyState")}>
                        <div className={cx("emptyStateIcon")}>
                          <Ic n="message" sz={22} c="var(--muted2)" />
                        </div>
                        <div className={cx("emptyStateTitle")}>No messages yet</div>
                        <div className={cx("emptyStateSub")}>
                          Send a message below to start the conversation.
                        </div>
                      </div>
                    ) : (
                      (() => {
                        let lastDay = "";
                        return messages.map((msg) => {
                          const day = isoToDay(msg.createdAt);
                          const showSep = day !== lastDay;
                          lastDay = day;
                          return (
                            <div key={msg.id}>
                              {showSep && (
                                <div className={cx("msguDateSep")}>
                                  <span>{day}</span>
                                </div>
                              )}
                              <div
                                className={cx(
                                  "msguBubbleRow",
                                  msg.mine ? "msguBubbleRowMine" : "",
                                )}
                              >
                                <div className={cx("msguBubbleContent")}>
                                  <div
                                    className={cx(
                                      "msguBubble",
                                      msg.mine ? "msguBubbleMine" : "msguBubbleTheirs",
                                    )}
                                  >
                                    {msg.content}
                                  </div>
                                  <div
                                    className={cx(
                                      "msguBubbleTime",
                                      msg.mine ? "msguBubbleTimeRight" : "",
                                      "fontMono",
                                    )}
                                  >
                                    {fmtAgo(msg.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>

                  {/* Compose */}
                  <div className={cx("msguComposeWrap")}>
                    <div className={cx("msguComposeBar")}>
                      <textarea
                        className={cx("msguComposeInput")}
                        placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                        value={compose}
                        onChange={(e) => setCompose(e.target.value)}
                        onKeyDown={handleComposeKey}
                        rows={1}
                        title="Compose message"
                      />
                      <button
                        type="button"
                        className={cx("msguSendBtn")}
                        onClick={() => void handleSend()}
                        disabled={sending || !compose.trim()}
                        title="Send message"
                      >
                        <Ic n="send" sz={16} c="var(--dark)" />
                      </button>
                    </div>
                    <div className={cx("msguComposeHint")}>
                      <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line · <kbd>Cmd+Enter</kbd> to send
                    </div>
                  </div>
                </>
              ) : (
                <div className={cx("msguRightEmpty")}>
                  <div className={cx("emptyStateIcon")}>
                    <Ic n="message" sz={28} c="var(--muted2)" />
                  </div>
                  <div className={cx("emptyStateTitle")}>Select a conversation</div>
                  <div className={cx("emptyStateSub")}>
                    Choose a conversation from the left panel to view messages.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY ────────────────────────────────────────────────── */}
          {activeTab === "Activity" && (
            <div className={cx("msguActivityPage")}>
              <div className={cx("msguActivityHeader", "rdStudioSection")}>
                <div className={cx("pillTabs")}>
                  {ACTIVITY_FILTERS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={cx("pillTab", actFilter === f ? "pillTabActive" : "")}
                      onClick={() => setActFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className={cx("msguActivityFeed")}>
                {filteredActivity.length === 0 ? (
                  <div className={cx("emptyState")}>
                    <div className={cx("emptyStateIcon")}>
                      <Ic n="activity" sz={22} c="var(--muted2)" />
                    </div>
                    <div className={cx("emptyStateTitle")}>No activity yet</div>
                    <div className={cx("emptyStateSub")}>
                      Project events will appear here as work progresses.
                    </div>
                  </div>
                ) : (
                  <div className={cx("msguTimeline")}>
                    <div className={cx("msguTimelineRail")} />
                    {filteredActivity.map((item) => (
                      <div key={item.id} className={cx("msguTimelineItem", "rdStudioRow")}>
                        <div className={cx("msguTimelineDot", TONE_DOT[item.tone])}>
                          <Ic n={item.icon as "activity"} sz={11} c="var(--dark)" />
                        </div>
                        <div className={cx("msguTimelineBody")}>
                          <div className={cx("text13", "fw600")}>{item.title}</div>
                          <div className={cx("text11", "colorMuted")}>{item.sub}</div>
                        </div>
                        <span className={cx("text11", "colorMuted", "fontMono", "rdStudioLabel")}>{item.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AI ASSISTANT ────────────────────────────────────────────── */}
          {activeTab === "AI Assistant" && (
            <div className={cx("msguAiPage")}>
              {/* Header */}
              <div className={cx("msguAiHeader")}>
                <div className={cx("msguAiAvatar")}>
                  <Ic n="sparkle" sz={16} c="var(--lime)" />
                </div>
                <div>
                  <div className={cx("text13", "fw700")}>
                    Maphari AI
                  </div>
                  <div className={cx("text11", "colorMuted")}>Project intelligence assistant</div>
                </div>
              </div>

              {/* Chat feed */}
              <div className={cx("msguAiFeed")} ref={aiBodyRef}>
                {aiChat.map((msg, i) => (
                  <div
                    key={i}
                    className={cx(
                      "msguAiBubbleRow",
                      msg.role === "user" ? "msguAiBubbleRowUser" : "",
                    )}
                  >
                    {msg.role === "ai" && (
                      <div className={cx("msguAiAvatar", "noShrink")}>
                        <Ic n="sparkle" sz={13} c="var(--lime)" />
                      </div>
                    )}
                    <div
                      className={cx(
                        "msguAiBubble",
                        msg.role === "ai" ? "msguAiBubbleAi" : "msguAiBubbleUser",
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {aiTyping && (
                  <div className={cx("msguAiBubbleRow")}>
                    <div className={cx("msguAiAvatar", "noShrink")}>
                      <Ic n="sparkle" sz={13} c="var(--lime)" />
                    </div>
                    <div className={cx("msguAiBubble", "msguAiBubbleAi", "colorMuted")}>
                      Thinking…
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested prompts */}
              <div className={cx("msguAiPrompts")}>
                {AI_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={() => handleAiPrompt(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* AI compose */}
              <div className={cx("msguComposeWrap")}>
                <div className={cx("msguComposeBar")}>
                  <input
                    className={cx("msguComposeInput")}
                    placeholder="Ask me anything about your project…"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={handleAiKey}
                    title="AI assistant input"
                  />
                  <button
                    type="button"
                    className={cx("msguSendBtn")}
                    onClick={handleSendAi}
                    disabled={!aiInput.trim() || aiTyping}
                    title="Send to AI"
                  >
                    <Ic n="send" sz={16} c="var(--dark)" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SUPPORT ─────────────────────────────────────────────────── */}
          {activeTab === "Support" && (
            <div className={cx("msguSupportPage")}>
              <div className={cx("msguSupportHeader")}>
                <div className={cx("text14", "fw700")}>
                  Submit a Support Ticket
                </div>
                <div className={cx("text12", "colorMuted")}>
                  Our team will respond within your SLA window.
                </div>
              </div>

              {supDone ? (
                <div className={cx("emptyState")}>
                  <div className={cx("emptyStateIcon")}>
                    <Ic n="check" sz={22} c="var(--lime)" />
                  </div>
                  <div className={cx("emptyStateTitle")}>Ticket submitted</div>
                  <div className={cx("emptyStateSub")}>
                    We've received your request and will be in touch shortly.
                  </div>
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent", "mt16")}
                    onClick={() => setSupDone(false)}
                  >
                    Submit another
                  </button>
                </div>
              ) : (
                <form className={cx("msguSupportForm")} onSubmit={(e) => void handleSupportSubmit(e)}>
                  <div className={cx("msguFieldGroup")}>
                    <label className={cx("msguFieldLabel")} htmlFor="sup-title">
                      Subject
                    </label>
                    <input
                      id="sup-title"
                      className={cx("msguFieldInput")}
                      placeholder="Brief description of the issue"
                      value={supTitle}
                      onChange={(e) => setSupTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className={cx("msguFieldGroup")}>
                    <label className={cx("msguFieldLabel")} htmlFor="sup-desc">
                      Description
                    </label>
                    <textarea
                      id="sup-desc"
                      className={cx("msguFieldTextarea")}
                      placeholder="Describe the issue in detail…"
                      value={supDesc}
                      onChange={(e) => setSupDesc(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  <div className={cx("msguSupportRow")}>
                    <div className={cx("msguFieldGroup")}>
                      <label className={cx("msguFieldLabel")} htmlFor="sup-cat">
                        Category
                      </label>
                      <select
                        id="sup-cat"
                        className={cx("msguFieldInput")}
                        value={supCategory}
                        onChange={(e) => setSupCategory(e.target.value)}
                      >
                        <option value="GENERAL">General</option>
                        <option value="BILLING">Billing</option>
                        <option value="TECHNICAL">Technical</option>
                        <option value="PROJECT">Project</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className={cx("msguFieldGroup")}>
                      <label className={cx("msguFieldLabel")}>Priority</label>
                      <div className={cx("msguPriorityGrid")}>
                        {(["Low", "Medium", "High"] as Priority[]).map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={cx(
                              "msguPriorityBtn",
                              p === "Low" ? "msguPriorityLow" : p === "Medium" ? "msguPriorityMed" : "msguPriorityHigh",
                              supPriority === p ? "msguPriorityBtnActive" : "",
                            )}
                            onClick={() => setSupPriority(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={cx("msguSubmitBtn")}
                    disabled={supSending || !supTitle.trim() || !supDesc.trim()}
                  >
                    {supSending ? "Submitting…" : "Submit ticket"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Video Room Modal ─────────────────────────────────────────────── */}
      <VideoRoomModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        roomUrl={videoRoomUrl}
        isLoading={videoLoading}
      />

      {/* ── New Thread Modal ─────────────────────────────────────────────── */}
      {showNewThread && (
        <div
          className={cx("modalBackdrop")}
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewThread(false); }}
        >
          <div className={cx("modal")}>
            <div className={cx("modalHeader")}>
              <span className={cx("modalTitle")}>New Conversation</span>
              <button
                type="button"
                className={cx("modalClose")}
                onClick={() => setShowNewThread(false)}
                title="Close"
              >
                <Ic n="x" sz={15} c="var(--text)" />
              </button>
            </div>
            <div className={cx("modalBody")}>
              <div className={cx("msguFieldGroup")}>
                <label className={cx("msguFieldLabel")} htmlFor="new-subject">
                  Subject
                </label>
                <input
                  id="new-subject"
                  className={cx("msguFieldInput")}
                  placeholder="What is this conversation about?"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleCreateThread(); }}}
                  autoFocus
                />
              </div>
              <div className={cx("modalFooter")}>
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost")}
                  onClick={() => setShowNewThread(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  disabled={creatingThread || !newSubject.trim()}
                  onClick={() => void handleCreateThread()}
                >
                  {creatingThread ? "Creating…" : "Start conversation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
