"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../style";
import type { ClientThread } from "../types";
import { formatRelative } from "../utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatarToneClass(color?: string) {
  if (color === "var(--amber)")  return "clientAvatarToneAmber";
  if (color === "var(--purple)") return "clientAvatarTonePurple";
  if (color === "var(--green)")  return "clientAvatarToneGreen";
  return "clientAvatarToneAccent";
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ClientMessage = {
  id: string;
  content: string;
  authorRole: string | null;
  authorId?: string | null;
  sentimentScore?: number | null;
  sentimentLabel?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
  deliveryStatus: "SENT" | "DELIVERED" | "READ";
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
};

type ConversationMeta = {
  id: string;
  subject?: string | null;
  projectId?: string | null;
  assigneeUserId?: string | null;
  updatedAt?: string;
};

type ClientsPageProps = {
  isActive: boolean;
  openConversationsCount: number;
  threadItems: ClientThread[];
  threadFilter: "all" | "open" | "unread" | "project" | "general" | "unassigned" | "sla_risk" | "escalated" | "awaiting_client" | "needs_callback";
  threadCounts: {
    all: number;
    open: number;
    unread: number;
    project: number;
    general: number;
  };
  queueCounts: {
    unassigned: number;
    sla_risk: number;
    escalated: number;
    awaiting_client: number;
    needs_callback: number;
  };
  onThreadFilterChange: (value: "all" | "open" | "unread" | "project" | "general" | "unassigned" | "sla_risk" | "escalated" | "awaiting_client" | "needs_callback") => void;
  threadSearch: string;
  onThreadSearchChange: (value: string) => void;
  newThreadSubject: string;
  onNewThreadSubjectChange: (value: string) => void;
  newThreadClientId: string;
  onNewThreadClientIdChange: (value: string) => void;
  newThreadClientOptions: Array<{ id: string; name: string }>;
  creatingThread: boolean;
  onCreateThread: () => Promise<boolean>;
  selectedConversationId: string | null;
  selectedThread: ClientThread | null;
  selectedConversation: ConversationMeta | null;
  conversationMessages: ClientMessage[];
  sentMessageIds: string[];
  conversationNotes: Array<{ id: string; content: string; authorRole: string | null; createdAt: string }>;
  conversationEscalations: Array<{
    id: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
    reason: string;
    createdAt: string;
    ownerAdminId?: string | null;
    resolvedAt?: string | null;
  }>;
  messagesLoading: boolean;
  composeMessage: string;
  sendingMessage: boolean;
  lastSendFailed: boolean;
  lastSendError: string | null;
  noteText: string;
  escalationReason: string;
  escalationSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  onComposeMessageChange: (value: string) => void;
  onNoteTextChange: (value: string) => void;
  onEscalationReasonChange: (value: string) => void;
  onEscalationSeverityChange: (value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => void;
  onSendMessage: () => void;
  onRetrySendMessage: () => void;
  onAddNote: () => void;
  onEscalate: () => void;
  onEscalationAcknowledge: (escalationId: string) => void;
  onEscalationResolve: (escalationId: string) => void;
  onEscalationReopen: (escalationId: string) => void;
  onEscalationAssignToMe: (escalationId: string) => void;
  onClientClick: (id: string) => void;
  onOpenThreadTask: () => void;
  onOpenThreadFiles: () => void;
  onCreateTaskFromThread: () => void;
  onPrefillFollowUpNote: () => void;
  onScheduleCallback: () => void;
  onComposeSubmitShortcut: () => void;
  staffInitials: string;
  viewerUserId: string | null;
  onAssignToMe: () => void;
  onUnassign: () => void;
};

// ─── Filter tabs ─────────────────────────────────────────────────────────────

const THREAD_FILTER_TABS = [
  { value: "all"     as const, label: "All"     },
  { value: "unread"  as const, label: "Unread"  },
] as const;
const QUEUE_FILTER_TABS = [
  { value: "unassigned" as const, label: "Unassigned" },
  { value: "sla_risk" as const, label: "SLA Risk" },
  { value: "escalated" as const, label: "Escalated" },
  { value: "awaiting_client" as const, label: "Awaiting Client" },
  { value: "needs_callback" as const, label: "Needs Callback" }
] as const;
const QUEUE_FILTER_DEFAULT = "unassigned";

const SEVERITY_OPTS = [
  { value: "LOW"      as const },
  { value: "MEDIUM"   as const },
  { value: "HIGH"     as const },
  { value: "CRITICAL" as const },
] as const;

// ─── SVG icons ───────────────────────────────────────────────────────────────

function IcoSearch() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IcoMsg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IcoAttach() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M12.5 7.5L7 13a4 4 0 0 1-5.657-5.657l6-6a2.5 2.5 0 0 1 3.535 3.535L5.12 10.635a1 1 0 0 1-1.414-1.414L9.293 3.636"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IcoPhone() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5.1 2.5c.3-.3.8-.4 1.2-.2l1.7.9c.5.3.7.8.5 1.3l-.5 1.4c-.1.3-.1.6.1.8l1.3 1.3c.2.2.5.3.8.1l1.4-.5c.5-.2 1 .1 1.3.5l.9 1.7c.2.4.1.9-.2 1.2l-1.1 1.1c-.7.7-1.8 1-2.8.7-1.8-.5-3.4-1.6-4.8-3-1.4-1.4-2.5-3-3-4.8-.3-1 .1-2.1.8-2.8L5.1 2.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IcoTask() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5 8l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IcoSend() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8l12-6-6 12-1.5-5.5L2 8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function IcoNote() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IcoEscalate() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2v8M8 2l-3 3M8 2l3 3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 13h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IcoPlus() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type CallEventPayload = {
  kind: "CALL_EVENT";
  title: string;
  summary: string;
  details: string;
  status: "MISSED" | "COMPLETED" | "CALLBACK_NEEDED" | "ESCALATED";
  duration: string | null;
};

type TimelineItem =
  | { id: string; createdAt: string; type: "message"; message: ClientMessage; actor: string; callEvent: null }
  | { id: string; createdAt: string; type: "call"; message: ClientMessage; actor: string; callEvent: CallEventPayload }
  | {
    id: string;
    createdAt: string;
    type: "note";
    note: { id: string; content: string; authorRole: string | null; createdAt: string };
    actor: string;
    visibility: "private" | "team" | "leadership";
    pinned: boolean;
  }
  | {
    id: string;
    createdAt: string;
    type: "escalation";
    escalation: {
      id: string;
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
      reason: string;
      createdAt: string;
      ownerAdminId?: string | null;
      resolvedAt?: string | null;
    };
    actor: string;
  };

function shortenUrlDisplay(rawUrl: string, maxLength = 52): string {
  try {
    const parsed = new URL(rawUrl);
    const displayBase = `${parsed.hostname}${parsed.pathname === "/" ? "" : parsed.pathname}`;
    return displayBase.length > maxLength ? `${displayBase.slice(0, maxLength - 1)}…` : displayBase;
  } catch {
    return rawUrl.length > maxLength ? `${rawUrl.slice(0, maxLength - 1)}…` : rawUrl;
  }
}

function renderTextWithLinks(content: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const parts = content.split(urlRegex);
  return parts.map((part, index) => {
    if (/^https?:\/\/[^\s]+$/i.test(part)) {
      const safeUrl = part.replace(/[),.;!?]+$/, "");
      return (
        <a
          key={`url-${index}`}
          href={safeUrl}
          target="_blank"
          rel="noreferrer"
          className={cx("clv2InlineLink")}
          title={safeUrl}
        >
          {shortenUrlDisplay(safeUrl)}
        </a>
      );
    }
    return <span key={`txt-${index}`}>{part}</span>;
  });
}

function parseCallEventPayload(content: string, authorRole: string | null): CallEventPayload | null {
  const normalizedRole = (authorRole ?? "").toUpperCase();
  const looksCallText = /\b(call|voicemail|callback|missed call|inbound call)\b/i.test(content);
  const status: CallEventPayload["status"] =
    /\bmissed\b/i.test(content)
      ? "MISSED"
      : /\bcallback\b/i.test(content)
        ? "CALLBACK_NEEDED"
        : /\bescalat/i.test(content)
          ? "ESCALATED"
          : "COMPLETED";
  const durationMatch = content.match(/\b(\d{1,2}m(?:\s*\d{1,2}s)?|\d{1,3}s)\b/i);
  const duration = durationMatch ? durationMatch[1] : null;

  if (content.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(content) as Record<string, unknown>;
      const kind = String(parsed.kind ?? parsed.type ?? "").toUpperCase();
      if (kind === "CALL_EVENT" || kind === "CALL") {
        const summary = String(parsed.summary ?? parsed.note ?? parsed.description ?? "Call event");
        const details = String(parsed.transcript ?? parsed.details ?? summary);
        const parsedStatus = String(parsed.status ?? "").toUpperCase();
        const parsedDuration = parsed.duration ? String(parsed.duration) : null;
        return {
          kind: "CALL_EVENT",
          title: String(parsed.title ?? "Call Inbox"),
          summary,
          details,
          status: (parsedStatus === "MISSED" || parsedStatus === "CALLBACK_NEEDED" || parsedStatus === "ESCALATED" ? parsedStatus : status),
          duration: parsedDuration ?? duration
        };
      }
    } catch {
      // non-JSON call-like text handled below
    }
  }

  if (normalizedRole === "SYSTEM" && looksCallText) {
    return {
      kind: "CALL_EVENT",
      title: "Call Inbox",
      summary: content.slice(0, 220),
      details: content,
      status,
      duration
    };
  }
  if (looksCallText && (normalizedRole === "STAFF" || normalizedRole === "CLIENT")) {
    return {
      kind: "CALL_EVENT",
      title: "Call Event",
      summary: content.slice(0, 220),
      details: content,
      status,
      duration
    };
  }
  return null;
}

function statusChipClass(status: CallEventPayload["status"]): string {
  if (status === "MISSED") return "clv2StatusMissed";
  if (status === "CALLBACK_NEEDED") return "clv2StatusCallback";
  if (status === "ESCALATED") return "clv2StatusEscalated";
  return "clv2StatusCompleted";
}

function parseNoteVisibility(content: string): "private" | "team" | "leadership" {
  const normalized = content.trim().toUpperCase();
  if (normalized.startsWith("[PRIVATE]")) return "private";
  if (normalized.startsWith("[LEADERSHIP]")) return "leadership";
  return "team";
}

function stripNoteVisibilityPrefix(content: string): string {
  return content.replace(/^\[(PRIVATE|TEAM|LEADERSHIP)\]\s*/i, "");
}

function mentionize(content: string) {
  const parts = content.split(/(@[a-z0-9._-]+)/gi);
  return parts.map((part, index) => {
    if (/^@[a-z0-9._-]+$/i.test(part)) {
      return <span key={`m-${index}`} className={cx("clv2Mention")}>{part}</span>;
    }
    return <span key={`t-${index}`}>{part}</span>;
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ClientsPage({
  isActive,
  openConversationsCount,
  threadItems,
  threadFilter,
  threadCounts,
  onThreadFilterChange,
  threadSearch,
  onThreadSearchChange,
  newThreadSubject,
  onNewThreadSubjectChange,
  newThreadClientId,
  onNewThreadClientIdChange,
  newThreadClientOptions,
  creatingThread,
  onCreateThread,
  selectedConversationId,
  selectedThread,
  selectedConversation,
  conversationMessages,
  sentMessageIds,
  conversationNotes,
  conversationEscalations,
  messagesLoading,
  composeMessage,
  sendingMessage,
  lastSendFailed,
  lastSendError,
  noteText,
  escalationReason,
  escalationSeverity,
  onComposeMessageChange,
  onNoteTextChange,
  onEscalationReasonChange,
  onEscalationSeverityChange,
  onSendMessage,
  onRetrySendMessage,
  onAddNote,
  onEscalate,
  onEscalationAcknowledge,
  onEscalationResolve,
  onEscalationReopen,
  onEscalationAssignToMe,
  onClientClick,
  onOpenThreadTask,
  onOpenThreadFiles,
  onCreateTaskFromThread,
  onPrefillFollowUpNote,
  onScheduleCallback,
  onComposeSubmitShortcut,
  staffInitials,
  viewerUserId,
  onAssignToMe,
  onUnassign,
  queueCounts,
}: ClientsPageProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [expandedCallMessageIds, setExpandedCallMessageIds] = useState<Record<string, boolean>>({});
  const [noteSearch, setNoteSearch] = useState("");
  const [noteVisibility, setNoteVisibility] = useState<"private" | "team" | "leadership">("team");
  const [queueFilterValue, setQueueFilterValue] = useState<(typeof QUEUE_FILTER_TABS)[number]["value"]>(QUEUE_FILTER_DEFAULT);
  const [pinnedNotesByConversation, setPinnedNotesByConversation] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem("staff.thread.pinned-notes");
      return raw ? JSON.parse(raw) as Record<string, string[]> : {};
    } catch {
      return {};
    }
  });
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const firstDraftForSelectedThread = selectedConversationId ? `staff.thread.compose.${selectedConversationId}` : null;

  const renderedMessages = useMemo<Array<{ message: ClientMessage; callEvent: CallEventPayload | null }>>(() => {
    return conversationMessages.map((message) => ({
      message,
      callEvent: parseCallEventPayload(message.content, message.authorRole)
    }));
  }, [conversationMessages]);
  const visibleNotes = useMemo(() => {
    return [...conversationNotes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [conversationNotes]);
  const visibleEscalations = useMemo(() => {
    return [...conversationEscalations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [conversationEscalations]);
  const notePinnedIds = useMemo(() => {
    if (!selectedConversationId) return [];
    return pinnedNotesByConversation[selectedConversationId] ?? [];
  }, [pinnedNotesByConversation, selectedConversationId]);
  const filteredNotes = useMemo(() => {
    const q = noteSearch.trim().toLowerCase();
    const pool = visibleNotes.filter((note) => parseNoteVisibility(note.content) === noteVisibility);
    if (!q) return pool;
    return pool.filter((note) => note.content.toLowerCase().includes(q));
  }, [noteSearch, noteVisibility, visibleNotes]);
  const timelineItems = useMemo<TimelineItem[]>(() => {
    const notePins = new Set(notePinnedIds);
    const messageItems: TimelineItem[] = renderedMessages.map(({ message, callEvent }) => {
      const actor = (message.authorRole ?? "SYSTEM").toUpperCase();
      if (callEvent) {
        return { id: `call-${message.id}`, createdAt: message.createdAt, type: "call", message, actor, callEvent };
      }
      return { id: `msg-${message.id}`, createdAt: message.createdAt, type: "message", message, actor, callEvent: null };
    });
    const noteItems: TimelineItem[] = conversationNotes.map((note) => ({
      id: `note-${note.id}`,
      createdAt: note.createdAt,
      type: "note",
      note,
      actor: (note.authorRole ?? "STAFF").toUpperCase(),
      visibility: parseNoteVisibility(note.content),
      pinned: notePins.has(note.id)
    }));
    const escalationItems: TimelineItem[] = conversationEscalations.map((escalation) => ({
      id: `esc-${escalation.id}`,
      createdAt: escalation.createdAt,
      type: "escalation",
      escalation,
      actor: escalation.ownerAdminId ? "STAFF" : "SYSTEM"
    }));
    return [...messageItems, ...noteItems, ...escalationItems].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [conversationEscalations, conversationNotes, notePinnedIds, renderedMessages]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const shouldStickToBottom = distanceFromBottom < 120;
    if (shouldStickToBottom && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [renderedMessages.length]);

  function threadActivityIcon(type?: ClientThread["activityType"]) {
    if (type === "call") return <IcoPhone />;
    if (type === "note") return <IcoNote />;
    if (type === "escalation") return <IcoEscalate />;
    return <IcoMsg />;
  }

  return (
    <section
      className={cx("page", "pageBody", isActive && "pageActive")}
      id="page-clients"
      style={isActive ? { height: "100%", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" } : undefined}
    >
      {/* ── Two-panel shell ─────────────────────────────────────── */}
      <div className={cx("clv2Shell")}>

        {/* ─ Left rail — thread list ─ */}
        <div className={cx("clv2Rail")}>
          <div className={cx("clv2RailTop")}>
            {/* Rail header */}
            <div className={cx("clv2RailHeader")}>
              <span className={cx("clv2RailTitle")}>Conversations</span>
              {threadCounts.unread > 0 ? (
                <span className={cx("clv2UnreadBadge")}>
                  {threadCounts.unread} unread
                </span>
              ) : (
                <span className={cx("clv2AllReadBadge")}>All read</span>
              )}
            </div>
            <div className={cx("clv2RailMeta")}>
              {threadCounts.all} total · {openConversationsCount} open
            </div>

            {/* Search */}
            <div className={cx("clv2SearchWrap")}>
              <span className={cx("clv2SearchIco")}>
                <IcoSearch />
              </span>
              <input
                className={cx("clv2SearchInput")}
                value={threadSearch}
                onChange={(e) => onThreadSearchChange(e.target.value)}
                placeholder="Search threads…"
              />
            </div>

            {/* Filter pills */}
            <div className={cx("clv2FilterPills")}>
              {THREAD_FILTER_TABS.map((tab) => {
                const count = threadCounts[tab.value];
                const active = threadFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    className={cx(
                      cx("clv2FilterPill"),
                      active ? cx("clv2FilterPillActive") : cx("clv2FilterPillIdle")
                    )}
                    onClick={() => onThreadFilterChange(tab.value)}
                  >
                    {tab.label}
                    {count > 0 ? (
                      <span className={cx("clv2FilterPillCount")}>{count}</span>
                    ) : null}
                  </button>
                );
              })}
              <button
                type="button"
                className={cx(
                  cx("clv2FilterPill"),
                  (threadFilter === "unassigned" || threadFilter === "sla_risk" || threadFilter === "escalated" || threadFilter === "awaiting_client" || threadFilter === "needs_callback")
                    ? cx("clv2FilterPillActive")
                    : cx("clv2FilterPillIdle")
                )}
                onClick={() => onThreadFilterChange(queueFilterValue)}
              >
                Queue
              </button>
            </div>
            <div className={cx("clv2QueueRow")}>
              <label className={cx("clv2QueueLabel")} htmlFor="clv2-queue-filter">Queue type</label>
              <select
                id="clv2-queue-filter"
                className={cx("clv2QueueSelect")}
                value={queueFilterValue}
                onChange={(event) => {
                  const value = event.target.value as (typeof QUEUE_FILTER_TABS)[number]["value"];
                  setQueueFilterValue(value);
                  if (
                    threadFilter === "unassigned" ||
                    threadFilter === "sla_risk" ||
                    threadFilter === "escalated" ||
                    threadFilter === "awaiting_client" ||
                    threadFilter === "needs_callback"
                  ) {
                    onThreadFilterChange(value);
                  }
                }}
              >
                {QUEUE_FILTER_TABS.map((tab) => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label} ({queueCounts[tab.value]})
                  </option>
                ))}
              </select>
            </div>

            {/* New thread composer — collapsed trigger or expanded inline form */}
            {!composerOpen ? (
              <button
                type="button"
                className={cx("clv2NewToggleBtn")}
                onClick={() => {
                  onNewThreadSubjectChange("");
                  onNewThreadClientIdChange("");
                  setComposerOpen(true);
                }}
              >
                <IcoPlus />
                New Thread
              </button>
            ) : (
              <div className={cx("clv2NewThreadWrap")}>
                <select
                  className={cx("clv2NewSelect")}
                  aria-label="Select client for new thread"
                  value={newThreadClientId}
                  onChange={(e) => onNewThreadClientIdChange(e.target.value)}
                >
                  <option value="">Select client…</option>
                  {newThreadClientOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  className={cx("clv2NewInput")}
                  value={newThreadSubject}
                  onChange={(e) => onNewThreadSubjectChange(e.target.value)}
                  placeholder="Thread subject…"
                  autoFocus
                />
                <div className={cx("clv2NewBtnRow")}>
                  <button
                    type="button"
                    className={cx("clv2NewCancelBtn")}
                    onClick={() => setComposerOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={cx("clv2NewBtn")}
                    onClick={async () => {
                      const created = await onCreateThread();
                      if (created) setComposerOpen(false);
                    }}
                    disabled={
                      creatingThread || !newThreadClientId || newThreadSubject.trim().length < 2
                    }
                  >
                    <IcoPlus />
                    {creatingThread ? "Creating…" : "Create"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Thread items */}
          <div className={cx("clv2ThreadScroll")}>
            {threadItems.length === 0 ? (
              <div className={cx("clv2ListEmpty")}>
                <div className={cx("clv2MsgEmptyIcon")}>
                  <IcoMsg />
                </div>
                <div className={cx("clv2ListEmptyText")}>No conversations yet</div>
              </div>
            ) : (
              threadItems.map((thread) => {
                const isActive = selectedConversationId === thread.id;
                return (
                  <div
                    key={thread.id}
                    className={cx(
                      cx("clv2ThreadItem"),
                      isActive && cx("clv2ThreadItemActive"),
                      !isActive && thread.unread && cx("clv2ThreadItemUnread")
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={() => onClientClick(thread.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onClientClick(thread.id);
                      }
                    }}
                  >
                    <div
                      className={cx(
                        cx("clv2ItemAvatar"),
                        avatarToneClass(thread.avatar.color)
                      )}
                    >
                      {thread.avatar.label}
                    </div>
                    <div className={cx("clv2ItemBody")}>
                      <div className={cx("clv2ItemTopRow")}>
                        <span className={cx("clv2ItemName")}>{thread.name}</span>
                        <span className={cx("clv2ItemTime")}>{thread.time}</span>
                      </div>
                      <div className={cx("clv2ItemProject")}>{thread.project}</div>
                      <div className={cx("clv2ItemPreviewRow")}>
                        <span className={cx("clv2ItemTypeIco")}>{threadActivityIcon(thread.activityType)}</span>
                        <div className={cx("clv2ItemPreview", thread.unread && "clv2ItemPreviewUnread")}>{thread.preview}</div>
                        {thread.activityStatus ? (
                          <span className={cx("clv2ThreadStatusChip", statusChipClass(thread.activityStatus))}>
                            {thread.activityStatus === "CALLBACK_NEEDED" ? "Callback needed" : thread.activityStatus.toLowerCase()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {thread.unread && !isActive ? (
                      <div className={cx("clv2UnreadPip")} />
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─ Main content ─ */}
        <div className={cx("clv2Main")}>

          {/* Thread header */}
          <div className={cx("clv2ThreadHeader")} aria-label="Thread header">
            <div
              className={cx(
                cx("clv2ThreadAvatar"),
                avatarToneClass(selectedThread?.avatar.color)
              )}
            >
              {selectedThread?.avatar.label ?? "CL"}
            </div>
            <div className={cx("clv2ThreadInfo")}>
              <div className={cx("clv2ThreadName")}>
                {selectedThread?.name ?? "Select a conversation"}
                {selectedThread && (
                  <span
                    className={cx(
                      cx("clv2ThreadBadge"),
                      selectedConversation?.projectId
                        ? cx("clv2BadgeGreen")
                        : cx("clv2BadgeAmber")
                    )}
                  >
                    {selectedConversation?.projectId ? "Project" : "General"}
                  </span>
                )}
                {selectedThread && (
                  <span
                    className={cx(
                      cx("clv2ThreadBadge"),
                      selectedConversation?.assigneeUserId
                        ? cx("clv2BadgeBlue")
                        : cx("clv2BadgeMuted")
                    )}
                  >
                    {selectedConversation?.assigneeUserId
                      ? selectedConversation.assigneeUserId === viewerUserId
                        ? "Assigned to you"
                        : "Assigned"
                      : "Unassigned"}
                  </span>
                )}
              </div>
              <div className={cx("clv2ThreadSub")}>
                {selectedConversation?.subject ?? (selectedThread ? "No subject" : "Client thread")}
                {selectedThread?.project
                  ? ` · ${selectedThread.project}`
                  : ""}
              </div>
            </div>
            <div className={cx("clv2HeaderActions")}>
              <button
                type="button"
                className={cx("clv2ActionBtn")}
                onClick={onAssignToMe}
                disabled={
                  !selectedConversationId ||
                  !viewerUserId ||
                  selectedConversation?.assigneeUserId === viewerUserId
                }
              >
                Assign to me
              </button>
              <button
                type="button"
                className={cx("clv2ActionBtn")}
                onClick={onUnassign}
                disabled={!selectedConversationId || !selectedConversation?.assigneeUserId}
              >
                Unassign
              </button>
              <button
                type="button"
                className={cx("clv2ActionBtn", cx("clv2ActionBtnAccent"))}
                onClick={onOpenThreadTask}
                disabled={!selectedConversationId}
              >
                <IcoTask />
                View Task
              </button>
            </div>
          </div>
          {/* Content zone: messages+compose (left) | notes+escalations (right rail) */}
          <div className={cx("clv2ContentZone")}>
          <div className={cx("clv2MsgZone")}>

          {/* Messages */}
          <div className={cx("clv2Messages")} ref={messagesRef}>
            {messagesLoading ? (
              <div className={cx("clv2MsgEmpty")}>
                <div className={cx("clv2MsgEmptyIcon")}>
                  <IcoMsg />
                </div>
                <div className={cx("clv2MsgEmptyTitle")}>Loading…</div>
                <div className={cx("clv2MsgEmptyBody")}>Fetching messages</div>
              </div>
            ) : timelineItems.length === 0 ? (
              <div className={cx("clv2MsgEmpty")}>
                <div className={cx("clv2MsgEmptyIcon")}>
                  <IcoMsg />
                </div>
                <div className={cx("clv2MsgEmptyTitle")}>No activity yet</div>
                <div className={cx("clv2MsgEmptyBody")}>
                  {selectedThread
                    ? "Start the conversation below."
                    : "Select a thread from the left to begin."}
                </div>
              </div>
            ) : (
              timelineItems.map((item) => {
                if (item.type === "call") {
                  const msg = item.message;
                  const callEvent = item.callEvent;
                  const longDetails = callEvent.details.length > 220;
                  const expandedKey = `${selectedConversationId ?? "none"}:${msg.id}`;
                  const expanded = Boolean(expandedCallMessageIds[expandedKey]);
                  return (
                    <div key={item.id} className={cx("clv2SystemEventRow")}>
                      <div className={cx("clv2SystemEventCard")}>
                        <div className={cx("clv2SystemEventTop")}>
                          <span className={cx("clv2SystemEventTitle")}><IcoPhone /> {callEvent.title}</span>
                          <span className={cx("clv2SystemEventMeta")}>
                            {formatRelative(msg.createdAt)}{callEvent.duration ? ` · ${callEvent.duration}` : ""}
                          </span>
                        </div>
                        <div className={cx("clv2SystemEventSummary")}>{renderTextWithLinks(callEvent.summary)}</div>
                        <div className={cx("clv2SystemEventStatusRow")}>
                          <span className={cx("clv2ThreadStatusChip", statusChipClass(callEvent.status))}>
                            {callEvent.status === "CALLBACK_NEEDED" ? "Callback needed" : callEvent.status.toLowerCase()}
                          </span>
                          {longDetails ? (
                            <button
                              type="button"
                              className={cx("clv2SystemDetailsBtn")}
                              onClick={() => setExpandedCallMessageIds((prev) => ({ ...prev, [expandedKey]: !expanded }))}
                            >
                              {expanded ? "Hide details" : "Show details"}
                            </button>
                          ) : null}
                        </div>
                        {expanded || !longDetails ? (
                          <div className={cx("clv2SystemEventDetails")}>{renderTextWithLinks(callEvent.details)}</div>
                        ) : null}
                        <div className={cx("clv2SystemActions")}>
                          <button type="button" className={cx("clv2SystemActionBtn")} onClick={onCreateTaskFromThread}>
                            <IcoTask /> Create task
                          </button>
                          <button type="button" className={cx("clv2SystemActionBtn")} onClick={onPrefillFollowUpNote}>
                            <IcoNote /> Add follow-up note
                          </button>
                          <button type="button" className={cx("clv2SystemActionBtn")} onClick={onScheduleCallback}>
                            <IcoPhone /> Schedule callback
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
                if (item.type === "note") {
                  const note = item.note;
                  return (
                    <div key={item.id} className={cx("clv2SystemEventRow")}>
                      <div className={cx("clv2SystemEventCard")}>
                        <div className={cx("clv2SystemEventTop")}>
                          <span className={cx("clv2SystemEventTitle")}><IcoNote /> Internal note</span>
                          <span className={cx("clv2SystemEventMeta")}>{item.actor} · {formatRelative(note.createdAt)}</span>
                        </div>
                        <div className={cx("clv2SystemEventStatusRow")}>
                          <span className={cx("clv2ThreadBadge", item.visibility === "leadership" ? "clv2BadgeBlue" : item.visibility === "private" ? "clv2BadgeAmber" : "clv2BadgeMuted")}>
                            {item.visibility}
                          </span>
                          <button
                            type="button"
                            className={cx("clv2SystemDetailsBtn")}
                            onClick={() => {
                              if (!selectedConversationId) return;
                              const existing = pinnedNotesByConversation[selectedConversationId] ?? [];
                              const next = existing.includes(note.id)
                                ? existing.filter((id) => id !== note.id)
                                : [note.id, ...existing];
                              const merged = { ...pinnedNotesByConversation, [selectedConversationId]: next };
                              setPinnedNotesByConversation(merged);
                              try { localStorage.setItem("staff.thread.pinned-notes", JSON.stringify(merged)); } catch { /* ignore */ }
                            }}
                          >
                            {item.pinned ? "Unpin" : "Pin"}
                          </button>
                        </div>
                        <div className={cx("clv2SystemEventDetails")}>{mentionize(stripNoteVisibilityPrefix(note.content))}</div>
                      </div>
                    </div>
                  );
                }
                if (item.type === "escalation") {
                  const esc = item.escalation;
                  return (
                    <div key={item.id} className={cx("clv2SystemEventRow")}>
                      <div className={cx("clv2SystemEventCard")}>
                        <div className={cx("clv2SystemEventTop")}>
                          <span className={cx("clv2SystemEventTitle")}><IcoEscalate /> Escalation</span>
                          <span className={cx("clv2SystemEventMeta")}>{formatRelative(esc.createdAt)}</span>
                        </div>
                        <div className={cx("clv2SystemEventSummary")}>{esc.reason}</div>
                        <div className={cx("clv2SystemEventStatusRow")}>
                          <span className={cx("clv2EscSev", `clv2EscSev${esc.severity}`)}>{esc.severity}</span>
                          <span className={cx("clv2EscStatus")}>{esc.status}</span>
                        </div>
                        <div className={cx("clv2SystemActions")}>
                          <button type="button" className={cx("clv2SystemActionBtn")} onClick={() => onEscalationAssignToMe(esc.id)}>
                            Assign to me
                          </button>
                          {esc.status === "OPEN" ? (
                            <button type="button" className={cx("clv2SystemActionBtn")} onClick={() => onEscalationAcknowledge(esc.id)}>
                              Acknowledge
                            </button>
                          ) : null}
                          {esc.status !== "RESOLVED" ? (
                            <button type="button" className={cx("clv2SystemActionBtn")} onClick={() => onEscalationResolve(esc.id)}>
                              Resolve
                            </button>
                          ) : (
                            <button type="button" className={cx("clv2SystemActionBtn")} onClick={() => onEscalationReopen(esc.id)}>
                              Reopen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                const msg = item.message;
                const isStaff =
                  (msg.authorRole ?? "").toUpperCase() === "STAFF" ||
                  sentMessageIds.includes(msg.id);
                const deliveryLabel =
                  msg.deliveryStatus === "READ"
                    ? "Read"
                    : msg.deliveryStatus === "DELIVERED"
                      ? "Delivered"
                      : "Sent";
                return (
                  <div
                    key={item.id}
                    className={isStaff ? cx("messageStaff") : cx("messageClient")}
                  >
                    <div
                      className={cx(
                        "messageAvatar",
                        isStaff ? "clAvatarStaff" : avatarToneClass(selectedThread?.avatar.color)
                      )}
                    >
                      {isStaff ? staffInitials : selectedThread?.avatar.label ?? "CL"}
                    </div>
                    <div
                      className={cx(
                        cx("messageContent"),
                        isStaff && cx("messageContentStaff")
                      )}
                    >
                      <div className={cx("messageTimestamp")}>
                        {isStaff
                          ? `You · ${formatRelative(msg.createdAt)} · ${deliveryLabel}`
                          : `${selectedThread?.name ?? "Client"} · ${formatRelative(msg.createdAt)}`}
                      </div>
                      <div
                        className={
                          isStaff ? cx("messageBubbleStaff") : cx("messageBubbleClient")
                        }
                      >
                        {renderTextWithLinks(msg.content)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Compose bar */}
          <div className={cx("clv2ComposeWrap")}>
            {lastSendFailed ? (
              <div className={cx("clv2SendError")}>
                <span>{lastSendError ?? "Message failed to send."}</span>
                <button type="button" className={cx("clv2SystemDetailsBtn")} onClick={onRetrySendMessage}>
                  Retry
                </button>
              </div>
            ) : null}
            <div className={cx("clv2ComposeInner")}>
              <input
                className={cx("clv2ComposeInput")}
                placeholder={
                  selectedThread
                    ? `Reply to ${selectedThread.name}…`
                    : "Select a conversation to reply…"
                }
                value={composeMessage}
                onChange={(e) => onComposeMessageChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onComposeSubmitShortcut();
                  }
                }}
              />
              <div className={cx("clv2ComposeActions")}>
                <button
                  type="button"
                  className={cx("clv2ComposeIconBtn")}
                  title="Attach file"
                  onClick={onOpenThreadFiles}
                  disabled={!selectedConversationId}
                >
                  <IcoAttach />
                </button>
                <button
                  type="button"
                  className={cx("clv2ComposeIconBtn")}
                  title="Create task from thread"
                  onClick={onCreateTaskFromThread}
                  disabled={!selectedConversationId}
                >
                  <IcoTask />
                  Task
                </button>
                <button
                  type="button"
                  className={cx("clv2SendBtn")}
                  onClick={onSendMessage}
                  disabled={!selectedConversationId || !composeMessage.trim() || sendingMessage}
                >
                  <IcoSend />
                  {sendingMessage ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
            <div className={cx("clv2ComposeMeta")}>
              <span>↵ Enter to send</span>
              {firstDraftForSelectedThread && composeMessage.trim().length > 0 ? (
                <span className={cx("clv2DraftSaved")}>Draft saved locally</span>
              ) : null}
            </div>
          </div>

          </div>{/* end clv2MsgZone */}

          {/* Right rail: Internal Notes + Escalations */}
          <div className={cx("clv2RailZone")}>

          {/* Internal Notes */}
          <div className={cx("clv2SidePanel")}>
            <div className={cx("clv2SidePanelHeader")}>
              <span className={cx("clv2SidePanelIco", cx("clv2SidePanelIcoNote"))}>
                <IcoNote />
              </span>
              <span className={cx("clv2SidePanelTitle")}>Internal Notes</span>
              <span className={cx("clv2SidePanelCount")}>{conversationNotes.length}</span>
            </div>
            <div className={cx("clv2NoteTools")}>
              <input
                className={cx("clv2PanelInput")}
                placeholder="Search notes…"
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
              />
              <div className={cx("clv2SevPills")}>
                {(["team", "private", "leadership"] as const).map((visibility) => (
                  <button
                    key={visibility}
                    type="button"
                    className={cx("clv2SevPill", noteVisibility === visibility && "clv2SevActiveLOW")}
                    onClick={() => setNoteVisibility(visibility)}
                  >
                    {visibility}
                  </button>
                ))}
              </div>
            </div>
            <div className={cx("clv2NoteList")}>
              {filteredNotes.length === 0 ? (
                <div className={cx("clv2PanelEmpty")}>
                  <div className={cx("emptyState")}>
                    <div className={cx("emptyStateSub")}>No notes on this thread.</div>
                  </div>
                </div>
              ) : (
                [...filteredNotes].sort((a, b) => {
                  const aPinned = notePinnedIds.includes(a.id) ? 1 : 0;
                  const bPinned = notePinnedIds.includes(b.id) ? 1 : 0;
                  if (aPinned !== bPinned) return bPinned - aPinned;
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }).map((note) => (
                  <div key={note.id} className={cx("clv2NoteRow")}>
                    <div className={cx("clv2NoteText")}>{mentionize(stripNoteVisibilityPrefix(note.content))}</div>
                    <div className={cx("clv2NoteMeta")}>
                      <span className={cx("clv2NoteAuthor")}>{note.authorRole ?? "STAFF"}</span>
                      <span className={cx("clv2NoteTime")}>{formatRelative(note.createdAt)}</span>
                      {notePinnedIds.includes(note.id) ? <span className={cx("clv2ThreadBadge", "clv2BadgeBlue")}>Pinned</span> : null}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={cx("clv2PanelCompose")}>
              <textarea
                className={cx("clv2PanelInput")}
                placeholder="Add internal note… supports @mentions and rich formatting"
                value={`${noteVisibility === "team" ? "[TEAM]" : noteVisibility === "private" ? "[PRIVATE]" : "[LEADERSHIP]"} ${noteText.replace(/^\[(PRIVATE|TEAM|LEADERSHIP)\]\s*/i, "")}`}
                onChange={(e) => onNoteTextChange(e.target.value)}
                rows={3}
              />
              <button
                type="button"
                className={cx("clv2PanelSaveBtn")}
                onClick={onAddNote}
                disabled={!selectedConversationId || !noteText.trim()}
              >
                Save Note
              </button>
            </div>
          </div>

          {/* Escalations */}
          <div className={cx("clv2SidePanel")}>
            <div className={cx("clv2SidePanelHeader")}>
              <span className={cx("clv2SidePanelIco", cx("clv2SidePanelIcoEsc"))}>
                <IcoEscalate />
              </span>
              <span className={cx("clv2SidePanelTitle")}>Escalations</span>
              <span className={cx("clv2SidePanelCount")}>{conversationEscalations.length}</span>
            </div>
            <div className={cx("clv2EscList")}>
              {conversationEscalations.length === 0 ? (
                <div className={cx("clv2PanelEmpty")}>
                  <div className={cx("emptyState")}>
                    <div className={cx("emptyStateSub")}>No escalations on this thread.</div>
                  </div>
                </div>
              ) : (
                visibleEscalations.map((item) => (
                  <div key={item.id} className={cx("clv2EscRow")}>
                    <div className={cx("clv2EscReason")}>{item.reason}</div>
                    <div className={cx("clv2EscRight")}>
                      <span
                        className={cx(
                          "clv2EscSev",
                          `clv2EscSev${item.severity}`
                        )}
                      >
                        {item.severity}
                      </span>
                      <span className={cx("clv2EscStatus")}>{item.status}</span>
                      <span className={cx("clv2EscTime")}>{formatRelative(item.createdAt)}</span>
                    </div>
                    <div className={cx("clv2EscActions")}>
                      <button type="button" className={cx("clv2SystemActionBtn")} onClick={() => onEscalationAssignToMe(item.id)}>Assign</button>
                      {item.status === "OPEN" ? (
                        <button type="button" className={cx("clv2SystemActionBtn")} onClick={() => onEscalationAcknowledge(item.id)}>ACK</button>
                      ) : null}
                      {item.status !== "RESOLVED" ? (
                        <button type="button" className={cx("clv2SystemActionBtn")} onClick={() => onEscalationResolve(item.id)}>Resolve</button>
                      ) : (
                        <button type="button" className={cx("clv2SystemActionBtn")} onClick={() => onEscalationReopen(item.id)}>Reopen</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={cx("clv2EscCompose")}>
              <div className={cx("clv2SevPills")}>
                {SEVERITY_OPTS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={cx(
                      "clv2SevPill",
                      escalationSeverity === opt.value && `clv2SevActive${opt.value}`
                    )}
                    onClick={() => onEscalationSeverityChange(opt.value)}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
              <div className={cx("clv2EscInputRow")}>
                <input
                  className={cx("clv2PanelInput")}
                  placeholder="Escalation reason…"
                  value={escalationReason}
                  onChange={(e) => onEscalationReasonChange(e.target.value)}
                />
                <button
                  type="button"
                  className={cx("clv2EscalateBtn")}
                  onClick={onEscalate}
                  disabled={!selectedConversationId || !escalationReason.trim()}
                >
                  <IcoEscalate />
                  Escalate
                </button>
              </div>
            </div>
          </div>

          </div>{/* end clv2RailZone */}
          </div>{/* end clv2ContentZone */}

        </div>
      </div>
    </section>
  );
}
