"use client";

import { useState } from "react";
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
};

type ClientsPageProps = {
  isActive: boolean;
  openConversationsCount: number;
  threadItems: ClientThread[];
  threadFilter: "all" | "open" | "unread" | "project" | "general";
  threadCounts: {
    all: number;
    open: number;
    unread: number;
    project: number;
    general: number;
  };
  onThreadFilterChange: (value: "all" | "open" | "unread" | "project" | "general") => void;
  threadSearch: string;
  onThreadSearchChange: (value: string) => void;
  newThreadSubject: string;
  onNewThreadSubjectChange: (value: string) => void;
  newThreadClientId: string;
  onNewThreadClientIdChange: (value: string) => void;
  newThreadClientOptions: Array<{ id: string; name: string }>;
  creatingThread: boolean;
  onCreateThread: () => void;
  selectedConversationId: string | null;
  selectedThread: ClientThread | null;
  selectedConversation: ConversationMeta | null;
  conversationMessages: ClientMessage[];
  sentMessageIds: string[];
  conversationNotes: Array<{ id: string; content: string; authorRole: string | null; createdAt: string }>;
  conversationEscalations: Array<{ id: string; severity: string; status: string; reason: string; createdAt: string }>;
  messagesLoading: boolean;
  composeMessage: string;
  noteText: string;
  escalationReason: string;
  escalationSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  onComposeMessageChange: (value: string) => void;
  onNoteTextChange: (value: string) => void;
  onEscalationReasonChange: (value: string) => void;
  onEscalationSeverityChange: (value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => void;
  onSendMessage: () => void;
  onAddNote: () => void;
  onEscalate: () => void;
  onClientClick: (id: string) => void;
  onOpenThreadTask: () => void;
  onOpenThreadFiles: () => void;
  onCreateTaskFromThread: () => void;
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
  { value: "project" as const, label: "Project" },
  { value: "general" as const, label: "General" },
] as const;

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
  noteText,
  escalationReason,
  escalationSeverity,
  onComposeMessageChange,
  onNoteTextChange,
  onEscalationReasonChange,
  onEscalationSeverityChange,
  onSendMessage,
  onAddNote,
  onEscalate,
  onClientClick,
  onOpenThreadTask,
  onOpenThreadFiles,
  onCreateTaskFromThread,
  onComposeSubmitShortcut,
  staffInitials,
  viewerUserId,
  onAssignToMe,
  onUnassign,
}: ClientsPageProps) {
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <section
      className={cx("page", "pageBody", isActive && "pageActive")}
      id="page-clients"
      style={isActive ? { height: "100%", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" } : undefined}
    >
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Communication</div>
        <h1 className={cx("pageTitleText")}>Client Threads</h1>
        <p className={cx("pageSubtitleText", "mb20")}>
          {threadCounts.all} thread{threadCounts.all !== 1 ? "s" : ""} &middot;{" "}
          {threadCounts.unread} unread &middot; {openConversationsCount} open
        </p>
      </div>

      {/* ── Two-panel shell ─────────────────────────────────────── */}
      <div className={cx("clv2Shell")}>

        {/* ─ Left rail — thread list ─ */}
        <div className={cx("clv2Rail")}>
          <div className={cx("clv2RailTop")}>
            {/* Rail header */}
            <div className={cx("clv2RailHeader")}>
              <span className={cx("clv2RailTitle")}>Conversations</span>
              {openConversationsCount > 0 ? (
                <span className={cx("clv2UnreadBadge")}>
                  {openConversationsCount} unread
                </span>
              ) : (
                <span className={cx("clv2AllReadBadge")}>All read</span>
              )}
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
                    onClick={() => {
                      setComposerOpen(false);
                      onCreateThread();
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
                      <div className={cx("clv2ItemPreview")}>{thread.preview}</div>
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
          <div className={cx("clv2Messages")}>
            {messagesLoading ? (
              <div className={cx("clv2MsgEmpty")}>
                <div className={cx("clv2MsgEmptyIcon")}>
                  <IcoMsg />
                </div>
                <div className={cx("clv2MsgEmptyTitle")}>Loading…</div>
                <div className={cx("clv2MsgEmptyBody")}>Fetching messages</div>
              </div>
            ) : conversationMessages.length === 0 ? (
              <div className={cx("clv2MsgEmpty")}>
                <div className={cx("clv2MsgEmptyIcon")}>
                  <IcoMsg />
                </div>
                <div className={cx("clv2MsgEmptyTitle")}>No messages yet</div>
                <div className={cx("clv2MsgEmptyBody")}>
                  {selectedThread
                    ? "Start the conversation below."
                    : "Select a thread from the left to begin."}
                </div>
              </div>
            ) : (
              conversationMessages.map((msg) => {
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
                    key={msg.id}
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
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Compose bar */}
          <div className={cx("clv2ComposeWrap")}>
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
                >
                  <IcoAttach />
                </button>
                <button
                  type="button"
                  className={cx("clv2ComposeIconBtn")}
                  title="Create task from thread"
                  onClick={onCreateTaskFromThread}
                >
                  <IcoTask />
                  Task
                </button>
                <button
                  type="button"
                  className={cx("clv2SendBtn")}
                  onClick={onSendMessage}
                  disabled={!selectedConversationId || !composeMessage.trim()}
                >
                  <IcoSend />
                  Send
                </button>
              </div>
            </div>
            <div className={cx("clv2ComposeMeta")}>
              <span>↵ Enter to send</span>
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
            <div className={cx("clv2NoteList")}>
              {conversationNotes.length === 0 ? (
                <div className={cx("clv2PanelEmpty")}>
                  <div className={cx("emptyState")}>
                    <div className={cx("emptyStateSub")}>No notes on this thread.</div>
                  </div>
                </div>
              ) : (
                conversationNotes.slice(-4).map((note) => (
                  <div key={note.id} className={cx("clv2NoteRow")}>
                    <span className={cx("clv2NoteText")}>{note.content}</span>
                    <span className={cx("clv2NoteAuthor")}>
                      {note.authorRole ?? "STAFF"}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className={cx("clv2PanelCompose")}>
              <input
                className={cx("clv2PanelInput")}
                placeholder="Add internal note…"
                value={noteText}
                onChange={(e) => onNoteTextChange(e.target.value)}
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
                conversationEscalations.slice(0, 4).map((item) => (
                  <div key={item.id} className={cx("clv2EscRow")}>
                    <span className={cx("clv2EscReason")}>{item.reason}</span>
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
