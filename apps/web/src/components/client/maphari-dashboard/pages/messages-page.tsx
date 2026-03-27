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
import type { Thread as WorkspaceThread } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgTab = "Inbox" | "Activity";
type Priority = "Low" | "Medium" | "High";
type ActivityTone = "accent" | "amber" | "purple" | "red" | "green";
type ActivityFilter = "All" | "Deliverables" | "Risks";
type ThreadListFilter = "All" | "Messages" | "Calls";

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
  timestamp: number;
};

type AiMsg = { role: "ai" | "user"; text: string };

// ─── Static data ──────────────────────────────────────────────────────────────

const TABS: MsgTab[] = ["Inbox", "Activity"];

const ACTIVITY_FILTERS: ActivityFilter[] = ["All", "Deliverables", "Risks"];
const THREAD_FILTERS: ThreadListFilter[] = ["All", "Messages", "Calls"];

const AI_PROMPTS = [
  "Summarise recent delivery activity",
  "Any high-impact risks open?",
  "What should I follow up on next?",
  "Can you help with budget questions?",
];

const AI_INITIAL: AiMsg = {
  role: "ai",
  text: "Hi! I can summarise the live deliverables and risks loaded in this workspace. I do not invent milestone or budget answers if that data is not available here.",
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
    timestamp: new Date(d.updatedAt).getTime(),
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
    timestamp: new Date(r.updatedAt).getTime(),
  };
}

function buildAssistantReply(question: string, deliverables: PortalDeliverable[], risks: PortalRisk[]): string {
  const q = question.toLowerCase();
  const openHighRisks = risks.filter((risk) => (risk.impact === "HIGH" || risk.impact === "CRITICAL") && risk.status !== "MITIGATED");
  const inReviewDeliverables = deliverables.filter((item) => item.status === "IN_REVIEW");
  const doneDeliverables = deliverables.filter((item) => item.status === "DONE");
  const nextDueDeliverable = [...deliverables]
    .filter((item) => item.dueAt)
    .sort((left, right) => new Date(left.dueAt as string).getTime() - new Date(right.dueAt as string).getTime())[0];

  if (q.includes("summarise") || q.includes("recent delivery") || q.includes("status")) {
    return "I can see " + deliverables.length + " deliverable" + (deliverables.length === 1 ? "" : "s") +
      ", with " + doneDeliverables.length + " marked done and " + inReviewDeliverables.length +
      " currently in review. There are " + risks.length + " logged risk" + (risks.length === 1 ? "" : "s") +
      ", including " + openHighRisks.length + " high-impact item" + (openHighRisks.length === 1 ? "" : "s") + " still open or under monitoring.";
  }

  if (q.includes("risk") || q.includes("blocker")) {
    if (openHighRisks.length === 0) {
      return "There are no open high-impact risks in the live register from this page. For the full picture, cross-check the Risk Register.";
    }
    const first = openHighRisks[0];
    return "Yes. " + openHighRisks.length + " high-impact risk" + (openHighRisks.length === 1 ? "" : "s") +
      " remain open or under monitoring. The most urgent visible item is \"" + first.name + "\" with likelihood " +
      first.likelihood + " and impact " + first.impact + ".";
  }

  if (q.includes("follow up") || q.includes("next")) {
    if (inReviewDeliverables.length > 0) {
      return "The clearest follow-up is content or deliverables currently in review. I can see " +
        inReviewDeliverables.length + " item" + (inReviewDeliverables.length === 1 ? "" : "s") +
        " awaiting movement, so reviewing those first would unblock the team fastest.";
    }
    if (nextDueDeliverable?.name) {
      return "The next visible item to watch is \"" + nextDueDeliverable.name + "\" due on " +
        isoToDay(nextDueDeliverable.dueAt as string) + ".";
    }
    return "I do not see a clear immediate follow-up in the live data here. The next best step is checking Messages or Support for any team requests.";
  }

  if (q.includes("budget") || q.includes("invoice") || q.includes("financial")) {
    return "I cannot answer budget or invoice questions from the Messages page alone. Use Financial Reports, Invoice History, or Budget Tracker for real finance data.";
  }

  return "I can help with live delivery and risk context from this page. Try asking about recent activity, open risks, or what needs follow-up next.";
}

function cleanPreview(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("CALL_ROOM::")) return "Video call link";
  return raw;
}

function formatLegacyCallPreview(raw: string): string {
  const parts = raw.split(/\s*,\s*/).filter(Boolean);
  if (parts.length < 2) return raw;
  const trailing = parts.pop();
  return trailing ? `${parts.join(", ")} · ${trailing}` : raw;
}

function isCallThread(t: { subject: string; preview: string }): boolean {
  return t.subject === "Instant Calls" || t.subject.startsWith("Instant Call") || t.preview?.startsWith("CALL_ROOM::");
}

function mapThread(t: WorkspaceThread): Thread {
  // For call threads with a date embedded in the subject ("Instant Call — Tue, 24 Mar, 14:16"),
  // surface the date/time as the preview so each call is distinguishable in the list.
  let subject = t.subject;
  let preview = cleanPreview(t.preview);
  const callDateMatch = t.subject.match(/^Instant Call\s+[—–-]\s+(.+)$/);
  if (callDateMatch?.[1]) {
    subject = "Instant Call";
    preview = formatLegacyCallPreview(callDateMatch[1]);
  } else if (subject === "Instant Calls" && (!preview || preview === `Re: ${subject}` || preview.startsWith("Re: Instant Call"))) {
    preview = "Latest room link and follow-ups";
  }
  return {
    id: t.id,
    conversationId: t.id,
    subject,
    preview,
    time: fmtAgo(t.lastMessageAt),
    unread: t.unread,
    avatarInitials: t.senderInitials,
    avatarBg: t.avatarBg,
    projectName: t.projectName,
  };
}

const EXTRA_THREADS_KEY = "msgu_extra_threads";

// ─── Call-room card renderer ──────────────────────────────────────────────────

function CallRoomCard({ url, expiresAt, dateLabel, onJoin }: { url: string; expiresAt: string; dateLabel: string; onJoin?: (url: string) => void }) {
  const expiresMs = new Date(expiresAt).getTime();
  const expired = Number.isNaN(expiresMs);
  const expiresLabel = new Date(expiresAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={cx("msguCallCard")}>
      <div className={cx("msguCallCardTop")}>
        <div className={cx("msguCallCardTitle")}>
          <Ic n="video" sz={14} c="var(--lime)" />
          Instant Video Call
        </div>
        <div className={cx("msguCallCardMeta")}>
          Started {dateLabel}
        </div>
      </div>
      <div className={cx("msguCallCardDivider")} />
      <div className={cx("msguCallCardActions")}>
        <span className={cx("msguCallCardExpiry")}>
          {expired ? "Room expired" : `Expires at ${expiresLabel}`}
        </span>
        {!expired && (
          <button
            type="button"
            className={cx("msguCallCardJoin")}
            onClick={() => onJoin?.(url)}
          >
            <Ic n="video" sz={11} c="#0d0d14" />
            Join Call
          </button>
        )}
      </div>
      <div className={cx("msguCallCardFooter")}>
        Use this thread for notes, questions and follow-ups during or after the call.
      </div>
    </div>
  );
}

function MessageContent({ content, onJoin }: { content: string; onJoin?: (url: string) => void }) {
  // Detect structured call-room messages: CALL_ROOM::url::expiresISO::dateLabel
  if (content.startsWith("CALL_ROOM::")) {
    const parts = content.slice("CALL_ROOM::".length).split("::");
    const url = parts[0] ?? "";
    const expiresAt = parts[1] ?? "";
    const dateLabel = parts[2] ?? "";
    return <CallRoomCard url={url} expiresAt={expiresAt} dateLabel={dateLabel} onJoin={onJoin} />;
  }

  // Normal text: preserve line breaks and linkify URLs
  const lines = content.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        // Detect bare URL lines
        const urlMatch = line.match(/^(https?:\/\/\S+)$/);
        if (urlMatch) {
          return (
            <span key={i}>
              <a href={urlMatch[1]} target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--lime)", wordBreak: "break-all" }}>
                {urlMatch[1]}
              </a>
              {i < lines.length - 1 && <br />}
            </span>
          );
        }
        return (
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MessagesPage({ threads: apiThreads = [], onJoinCall }: { threads?: WorkspaceThread[]; onJoinCall?: (url: string) => void }) {
  const { session, projectId } = useProjectLayer();
  const showToast = usePageToast();

  // ── Core state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<MsgTab>("Inbox");
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showSupportPanel, setShowSupportPanel] = useState(false);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [threadSearch, setThreadSearch] = useState("");
  const [threadFilter, setThreadFilter] = useState<ThreadListFilter>("All");

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

  // ── Optimistic threads (locally created, persist across navigation) ─────
  const [extraThreads, setExtraThreads] = useState<Thread[]>(() => {
    try {
      const raw = sessionStorage.getItem(EXTRA_THREADS_KEY);
      return raw ? (JSON.parse(raw) as Thread[]) : [];
    } catch {
      return [];
    }
  });

  // ── Activity ──────────────────────────────────────────────────────────────
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [actFilter, setActFilter] = useState<ActivityFilter>("All");
  const [activityDeliverables, setActivityDeliverables] = useState<PortalDeliverable[]>([]);
  const [activityRisks, setActivityRisks] = useState<PortalRisk[]>([]);

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

  // ── Video call ────────────────────────────────────────────────────────────
  const [videoLoading, setVideoLoading] = useState(false);

  // Persist extra threads to sessionStorage whenever they change
  useEffect(() => {
    try { sessionStorage.setItem(EXTRA_THREADS_KEY, JSON.stringify(extraThreads)); } catch { /* ignore */ }
  }, [extraThreads]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const threads = useMemo(() => {
    const apiMapped = apiThreads.map(mapThread);
    const apiIds = new Set(apiMapped.map((t) => t.id));
    // extraThreads that haven't landed in the API yet come first (optimistic)
    const dedupedExtra = extraThreads.filter((t) => !apiIds.has(t.id));
    return [...dedupedExtra, ...apiMapped];
  }, [extraThreads, apiThreads]);

  const filteredThreads = useMemo(
    () =>
      threads.filter(
        (t) => {
          const matchesFilter =
            threadFilter === "All" ||
            (threadFilter === "Calls" ? isCallThread(t) : !isCallThread(t));
          const matchesSearch =
            threadSearch === "" ||
            t.subject.toLowerCase().includes(threadSearch.toLowerCase()) ||
            t.projectName.toLowerCase().includes(threadSearch.toLowerCase());
          return matchesFilter && matchesSearch;
        },
      ),
    [threads, threadFilter, threadSearch],
  );

  const filteredActivity = useMemo(() => {
    if (actFilter === "All") return activityItems;
    if (actFilter === "Deliverables") return activityItems.filter((a) => a.id.startsWith("del-"));
    return activityItems.filter((a) => a.id.startsWith("risk-"));
  }, [activityItems, actFilter]);

  const emptyThreadLabel =
    threadFilter === "Calls"
      ? "No call threads yet"
      : threadFilter === "Messages"
        ? "No message threads yet"
        : "No conversations yet";

  // ── Load messages on thread change ────────────────────────────────────────
  useEffect(() => {
    if (!session || !activeThread) {
      return;
    }
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
  }, [activeThread, session]);

  // ── Load activity feed (lazy — first time Activity tab opens) ─────────────
  useEffect(() => {
    if ((activeTab !== "Activity" && activeTab !== "AI Assistant") || activityLoaded || !session || !projectId) return;
    void Promise.all([
      loadPortalDeliverablesWithRefresh(session, projectId),
      loadPortalRisksWithRefresh(session, projectId),
    ]).then(([dr, rr]) => {
      if (dr.nextSession) saveSession(dr.nextSession);
      if (rr.nextSession) saveSession(rr.nextSession);
      setActivityDeliverables(dr.data ?? []);
      setActivityRisks(rr.data ?? []);
      const items: ActivityItem[] = [
        ...(dr.data ?? []).map(deliverableToActivity),
        ...(rr.data ?? []).map(riskToActivity),
      ].sort((a, b) => b.timestamp - a.timestamp);
      setActivityItems(items);
      setActivityLoaded(true);
    });
  }, [activeTab, activityLoaded, session, projectId]);

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
    setMessages([]);
    setLoadingMsgs(true);
    setActiveThread(thread);
    setActiveTab("Inbox");
  }

  async function handleSend() {
    if (!compose.trim() || !session || !activeThread) return;
    setSending(true);
    const content = compose.trim();
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
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
    if (r.error || !r.data) {
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
      setCompose(content);
      showToast("error", "Failed to send message");
    } else {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticId
            ? {
                id: r.data!.id,
                content: r.data!.content,
                mine: r.data!.authorRole === "CLIENT",
                createdAt: r.data!.createdAt,
              }
            : msg
        )
      );
    }
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
    if (!newSubject.trim()) return;
    if (!session) {
      showToast("error", "You must be signed in to create a conversation");
      return;
    }
    setCreatingThread(true);
    const subject = newSubject.trim();
    const r = await createPortalConversationWithRefresh(session, {
      subject,
      projectId: projectId ?? undefined,
    });
    if (r.nextSession) saveSession(r.nextSession);
    setCreatingThread(false);
    setNewSubject("");
    setShowNewThread(false);
    if (r.error) {
      showToast("error", "Failed to create conversation");
    } else {
      // Optimistically add to thread list and navigate to it
      const newThread: Thread = {
        id: r.data?.id ?? `opt-${Date.now()}`,
        conversationId: r.data?.id ?? `opt-${Date.now()}`,
        subject,
        preview: "No messages yet",
        time: "just now",
        unread: false,
        avatarInitials: "T",
        avatarBg: "#1e2a1e",
        projectName: projectId ? "Project" : "General",
      };
      setExtraThreads((prev) => [newThread, ...prev]);
      setLoadingMsgs(true);
      setActiveThread(newThread);
      setActiveTab("Inbox");
      showToast("success", "Conversation started");
    }
  }

  function handleSendAi(overrideText?: string) {
    const q = (overrideText ?? aiInput).trim();
    if (!q || aiTyping) return;
    setAiInput("");
    setAiChat((prev) => [...prev, { role: "user", text: q }]);
    setAiTyping(true);
    setTimeout(() => {
      const reply = buildAssistantReply(q, activityDeliverables, activityRisks);
      setAiChat((prev) => [...prev, { role: "ai", text: reply }]);
      setAiTyping(false);
    }, 900);
  }

  function handleAiPrompt(prompt: string) {
    handleSendAi(prompt);
  }

  function handleAiKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendAi();
    }
  }

  async function handleSupportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supTitle.trim() || !supDesc.trim()) return;
    if (!session) {
      showToast("error", "You must be signed in to submit a ticket");
      return;
    }
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
      setShowSupportPanel(true);
      showToast("success", "Support ticket submitted");
    }
  }

  async function handleStartVideoCall() {
    if (!session) return;
    setVideoLoading(true);
    const r = await createInstantVideoRoomWithRefresh(session);
    if (r.nextSession) saveSession(r.nextSession);
    setVideoLoading(false);
    if (r.error || !r.data) {
      showToast("error", r.error?.message ?? "Failed to start video call");
      return;
    }
    onJoinCall?.(r.data.joinUrl);
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

          <div className={cx("msguThreadFilters", "filterBar")}>
            {THREAD_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={cx("filterChip", threadFilter === filter ? "filterChipActive" : "")}
                onClick={() => setThreadFilter(filter)}
                aria-pressed={threadFilter === filter}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Thread list */}
          <div className={cx("msguThreadList")}>
            {filteredThreads.length === 0 ? (
              <div className={cx("msguThreadEmpty")}>
                <span>{emptyThreadLabel}</span>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className={cx(
                    "msguThreadItem",
                    activeThread?.id === thread.id ? "msguThreadItemActive" : "",
                    thread.unread ? "msguThreadItemUnread" : "",
                    isCallThread(thread) ? "msguThreadItemCall" : "",
                  )}
                  onClick={() => selectThread(thread)}
                >
                  <div className={cx("msguAvatarWrap")}>
                    <Av initials={thread.avatarInitials} size={34} />
                    {thread.unread && <span className={cx("msguUnreadDot")} />}
                  </div>
                  <div className={cx("msguThreadBody")}>
                    <div className={cx("msguThreadTop")}>
                      <span className={cx("msguThreadNameGroup")}>
                        {isCallThread(thread) && <Ic n="video" sz={11} c="var(--lime)" />}
                        <span className={cx("msguThreadName")}>{thread.subject}</span>
                      </span>
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
            <div className={cx("pillTabs")} style={{ marginBottom: 0, flexWrap: "nowrap", gap: "4px" }}>
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
            <div className={cx("flexRow", "gap8", "flexCenter")}>
              <button
                type="button"
                className={cx("btnSm", "btnGhost", "flexRow", "gap5")}
                onClick={() => setShowAiAssistant(true)}
                title="Open AI assistant"
              >
                <Ic n="sparkle" sz={12} c="var(--lime)" />
                AI Assistant
              </button>
              <button
                type="button"
                className={cx("btnSm", "btnGhost", "flexRow", "gap5")}
                onClick={() => setShowSupportPanel(true)}
                title="Open support form"
              >
                <Ic n="alert" sz={12} c="var(--amber)" />
                Support
              </button>
              <button
                type="button"
                className={cx("msguCallBtn")}
                onClick={() => void handleStartVideoCall()}
                disabled={videoLoading || !session}
                title="Start an instant video call"
              >
                <Ic n="video" sz={13} c="currentColor" />
                {videoLoading ? "Starting…" : "Start Call"}
              </button>
            </div>
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
                                      msg.content.startsWith("CALL_ROOM::") ? "" : "msguBubble",
                                      msg.content.startsWith("CALL_ROOM::") ? "" : (msg.mine ? "msguBubbleMine" : "msguBubbleTheirs"),
                                    )}
                                  >
                                    <MessageContent content={msg.content} onJoin={onJoinCall} />
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
                        placeholder="Type a message…"
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
                        <Ic n="send" sz={16} c="currentColor" />
                      </button>
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

        </div>
      </div>

      {showAiAssistant && (
        <div
          className={cx("modalOverlay")}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAiAssistant(false); }}
        >
          <div className={cx("pmModalInner")} style={{ width: "min(680px, 95vw)" } as React.CSSProperties}>
            <div className={cx("pmModalHd")}>
              <span className={cx("modalTitle")}>AI Assistant</span>
              <button type="button" className={cx("iconBtn40x34")} onClick={() => setShowAiAssistant(false)} title="Close">
                <Ic n="x" sz={16} sw={2.5} c="var(--muted2)" />
              </button>
            </div>
            <div className={cx("modalBody", "p20", "cardS1")}>
              <div className={cx("msguAiPage")}>
                <div className={cx("msguAiHeader", "cardS1v2")}>
                  <div className={cx("msguAiAvatar")}>
                    <Ic n="sparkle" sz={16} c="var(--lime)" />
                  </div>
                  <div>
                    <div className={cx("text13", "fw700")}>Maphari AI</div>
                    <div className={cx("text11", "colorMuted")}>Live workspace assistant</div>
                  </div>
                </div>

                <div className={cx("msguAiFeed")} ref={aiBodyRef}>
                  {aiChat.map((msg, i) => (
                    <div key={i} className={cx("msguAiBubbleRow", msg.role === "user" ? "msguAiBubbleRowUser" : "")}>
                      {msg.role === "ai" && (
                        <div className={cx("msguAiAvatar", "noShrink")}>
                          <Ic n="sparkle" sz={13} c="var(--lime)" />
                        </div>
                      )}
                      <div className={cx("msguAiBubble", msg.role === "ai" ? "msguAiBubbleAi" : "msguAiBubbleUser")}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {aiTyping && (
                    <div className={cx("msguAiBubbleRow")}>
                      <div className={cx("msguAiAvatar", "noShrink")}>
                        <Ic n="sparkle" sz={13} c="var(--lime)" />
                      </div>
                      <div className={cx("msguAiBubble", "msguAiBubbleAi", "colorMuted")}>Thinking…</div>
                    </div>
                  )}
                </div>

                <div className={cx("msguAiPrompts", "cardS1v2")}>
                  {AI_PROMPTS.map((p) => (
                    <button key={p} type="button" className={cx("btnSm", "btnGhost")} onClick={() => handleAiPrompt(p)}>
                      {p}
                    </button>
                  ))}
                </div>

                <div className={cx("msguComposeWrap", "cardS1v2")}>
                  <div className={cx("msguComposeBar")}>
                    <input
                      className={cx("msguComposeInput")}
                      placeholder="Ask about delivery or risk activity…"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={handleAiKey}
                      title="AI assistant input"
                    />
                    <button
                      type="button"
                      className={cx("msguSendBtn")}
                      onClick={() => handleSendAi()}
                      disabled={!aiInput.trim() || aiTyping}
                      title="Send to AI"
                    >
                      <Ic n="send" sz={16} c="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSupportPanel && (
        <div
          className={cx("modalOverlay")}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSupportPanel(false); }}
        >
          <div className={cx("pmModalInner", "supportModalWide")}>
            <div className={cx("pmModalHd")}>
              <span className={cx("modalTitle")}>Support</span>
              <button type="button" className={cx("iconBtn40x34")} onClick={() => setShowSupportPanel(false)} title="Close">
                <Ic n="x" sz={16} sw={2.5} c="var(--muted2)" />
              </button>
            </div>
            <div className={cx("supportModalBody", "cardS1")}>
              <div className={cx("msguSupportPage")}>
                <div className={cx("cardS1v2", "p16x20", "mb12")}>
                  <div className={cx("flexRow", "gap12", "flexAlignStart")}>
                    <div className={cx("iconBox44")}>
                      <Ic n="alert" sz={18} c="var(--amber)" />
                    </div>
                    <div className={cx("flex1")}>
                      <div className={cx("text14", "fw700", "mb4")}>Client Support Desk</div>
                      <div className={cx("text12", "colorMuted", "lineH16")}>
                        Use this form for billing, technical, or delivery issues that need a tracked response from the team.
                      </div>
                    </div>
                    <span className={cx("badge", "badgeAccent", "noShrink")}>SLA-backed</span>
                  </div>
                </div>

                <div className={cx("grid3Cols", "gap8", "mb12")}>
                  {[
                    {
                      title: "Be specific",
                      detail: "Mention the screen, file, invoice, or project item involved.",
                      icon: "edit",
                    },
                    {
                      title: "Set the right priority",
                      detail: "Use high only when delivery or access is blocked.",
                      icon: "flag",
                    },
                    {
                      title: "Expect follow-up",
                      detail: "The team may reply in Messages if clarification is needed.",
                      icon: "message",
                    },
                  ].map((item) => (
                    <div key={item.title} className={cx("cardS1v2", "p12x14")}>
                      <div className={cx("flexRow", "flexCenter", "gap6", "mb6")}>
                        <Ic n={item.icon as "edit"} sz={12} c="var(--cyan)" />
                        <span className={cx("fw700", "text11")}>{item.title}</span>
                      </div>
                      <div className={cx("text11", "colorMuted", "lineH16")}>{item.detail}</div>
                    </div>
                  ))}
                </div>

                {supDone ? (
                  <div className={cx("cardS1v2", "p20", "textCenter")}>
                    <div className={cx("pmSuccessCircle")}>
                      <Ic n="check" sz={22} c="var(--lime)" />
                    </div>
                    <div className={cx("text14", "fw700", "mb4")}>Ticket submitted</div>
                    <div className={cx("text12", "colorMuted", "lineH16", "mb16")}>
                      We&apos;ve received your request and will be in touch shortly.
                    </div>
                    <div className={cx("flexRow", "gap8", "justifyCenter")}>
                      <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setSupDone(false)}>
                        Submit another
                      </button>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowSupportPanel(false)}>
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className={cx("msguSupportForm")} onSubmit={(e) => void handleSupportSubmit(e)}>
                    <div className={cx("cardS1v2", "p16x20", "mb12")}>
                      <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb10")}>Issue Summary</div>
                      <div className={cx("msguFieldGroup")}>
                        <label className={cx("msguFieldLabel")} htmlFor="sup-title">Subject</label>
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
                        <label className={cx("msguFieldLabel")} htmlFor="sup-desc">Description</label>
                        <textarea
                          id="sup-desc"
                          className={cx("msguFieldTextarea")}
                          placeholder="Describe the issue in detail, including what you expected and what happened instead…"
                          value={supDesc}
                          onChange={(e) => setSupDesc(e.target.value)}
                          rows={5}
                          required
                        />
                      </div>
                    </div>

                    <div className={cx("cardS1v2", "p16x20", "mb12")}>
                      <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb10")}>Routing</div>
                      <div className={cx("msguFieldGroup", "mb12")}>
                        <label className={cx("msguFieldLabel")} htmlFor="sup-cat">Category</label>
                        <select id="sup-cat" className={cx("msguFieldInput")} value={supCategory} onChange={(e) => setSupCategory(e.target.value)}>
                          <option value="GENERAL">General</option>
                          <option value="BILLING">Billing</option>
                          <option value="TECHNICAL">Technical</option>
                          <option value="PROJECT">Project</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className={cx("msguFieldGroup")}>
                        <label className={cx("msguFieldLabel")}>Priority</label>
                        <div className={cx("supportPriorityGrid")}>
                          {([
                            { level: "Low", hint: "Routine request" },
                            { level: "Medium", hint: "Needs timely attention" },
                            { level: "High", hint: "Work blocked or urgent" },
                          ] as Array<{ level: Priority; hint: string }>).map((p) => (
                            <button
                              key={p.level}
                              type="button"
                              className={cx(
                                "msguPriorityBtn",
                                "supportPriorityBtn",
                                p.level === "Low" ? "msguPriorityLow" : p.level === "Medium" ? "msguPriorityMed" : "msguPriorityHigh",
                                supPriority === p.level ? "msguPriorityBtnActive" : "",
                              )}
                              onClick={() => setSupPriority(p.level)}
                            >
                              <span>{p.level}</span>
                              <span className={cx("supportPriorityHint")}>{p.hint}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={cx("cardS1v2", "p16x20")}>
                      <div className={cx("flexBetween", "gap12", "flexWrap")}>
                        <div>
                          <div className={cx("fw700", "text12", "mb4")}>Ready to submit</div>
                          <div className={cx("text11", "colorMuted", "lineH16")}>
                            Your ticket will be routed to the right team and tracked through your support workflow.
                          </div>
                        </div>
                        <div className={cx("flexRow", "gap8", "noShrink")}>
                          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowSupportPanel(false)}>
                            Cancel
                          </button>
                          <button type="submit" className={cx("btnSm", "btnAccent")} disabled={supSending || !supTitle.trim() || !supDesc.trim()}>
                            {supSending ? "Submitting…" : "Submit ticket"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


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
                <Ic n="x" sz={17} sw={2.5} c="var(--text)" />
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
