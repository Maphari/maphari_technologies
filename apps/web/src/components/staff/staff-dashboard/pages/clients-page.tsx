"use client";

import { cx, styles } from "../style";
import type { ClientThread } from "../types";
import { formatRelative } from "../utils";

function avatarToneClass(color?: string) {
  if (color === "var(--amber)") return "clientAvatarToneAmber";
  if (color === "var(--purple)") return "clientAvatarTonePurple";
  if (color === "var(--green)") return "clientAvatarToneGreen";
  return "clientAvatarToneAccent";
}

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
  onUnassign
}: ClientsPageProps) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-clients">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>Client Communication</div>
          <div className={styles.pageTitle}>Client Threads</div>
          <div className={styles.pageSub}>Messages from clients assigned to your projects.</div>
        </div>
        <div className={cx("flexRow", "gap8")}>
          <select
            className={cx("composeInput", "clClientSelect")}
            aria-label="Select client for new thread"
            value={newThreadClientId}
            onChange={(event) => onNewThreadClientIdChange(event.target.value)}
          >
            <option value="">Select client</option>
            {newThreadClientOptions.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <input
            className={cx("composeInput", "clSubjectInput")}
            value={newThreadSubject}
            onChange={(event) => onNewThreadSubjectChange(event.target.value)}
            placeholder="Thread subject"
          />
          <button
            className={cx("button", "buttonBlue")}
            type="button"
            onClick={onCreateThread}
            disabled={creatingThread || !newThreadClientId || newThreadSubject.trim().length < 2}
          >
            {creatingThread ? "Creating..." : "+ New Thread"}
          </button>
        </div>
      </div>

      <div className={styles.clientThread}>
        <div className={styles.clientThreadList}>
          <div className={styles.clientThreadListHeader}>
            <span className={styles.clientThreadListTitle}>Conversations</span>
            <span className={cx("badge", "badgeAmber")}>{openConversationsCount} unread</span>
          </div>
          <div className={styles.clSearchArea}>
            <input
              className={cx("composeInput", "wFull")}
              value={threadSearch}
              onChange={(event) => onThreadSearchChange(event.target.value)}
              placeholder="Search conversations..."
            />
          </div>
          <div className={cx("filterRow", "clThreadFilterArea")}>
            <select
              className={cx("filterSelect")}
              aria-label="Filter conversations"
              value={threadFilter}
              onChange={(event) =>
                onThreadFilterChange(event.target.value as "all" | "open" | "unread" | "project" | "general")
              }
            >
              <option value="all">All ({threadCounts.all})</option>
              <option value="unread">Unread ({threadCounts.unread})</option>
              <option value="project">Project ({threadCounts.project})</option>
              <option value="general">General ({threadCounts.general})</option>
            </select>
          </div>
          <div className={styles.clientThreadScroll}>
            {threadItems.length === 0 ? (
              <div className={styles.emptyState}>No conversations yet.</div>
            ) : (
              threadItems.map((thread) => (
                <div
                  key={thread.id}
                  className={cx("clientItem", selectedConversationId === thread.id && "clientItemActive")}
                  role="button"
                  tabIndex={0}
                  onClick={() => onClientClick(thread.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onClientClick(thread.id);
                    }
                  }}
                >
                  <div className={cx("clientAvatar", "clAvatarSm", avatarToneClass(thread.avatar.color))}>
                    {thread.avatar.label}
                  </div>
                  <div className={styles.clientBody}>
                    <div className={styles.clientMeta}>
                      <span className={cx("clientName", "colorText")}>{thread.name}</span>
                      <span className={styles.clientTime}>{thread.time}</span>
                    </div>
                    <div className={styles.clientProject}>{thread.project}</div>
                    <div className={styles.clientPreview}>{thread.preview}</div>
                  </div>
                  {thread.unread ? <div className={styles.clientUnread} /> : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.clientThreadMain}>
          <div className={styles.clientThreadHeader}>
            <div className={cx("clientThreadAvatar", avatarToneClass(selectedThread?.avatar.color))}>
              {selectedThread?.avatar.label ?? "CL"}
            </div>
            <div className={styles.clientThreadInfo}>
              <div className={styles.clientThreadName}>
                {selectedThread?.name ?? "Select a conversation"} {selectedThread ? `— ${selectedThread.project}` : ""}
              </div>
              <div className={styles.clientThreadRole}>
                {selectedConversation?.subject ?? "Client thread"}
              </div>
            </div>
            <div className={styles.clientThreadActions}>
              <span className={cx("badge", selectedConversation?.projectId ? "badgeGreen" : "badgeAmber")}>
                {selectedConversation?.projectId ? "Project Thread" : "General Thread"}
              </span>
              <span className={cx("badge", selectedConversation?.assigneeUserId ? "badgeBlue" : "badgeAmber")}>
                {selectedConversation?.assigneeUserId
                  ? selectedConversation.assigneeUserId === viewerUserId
                    ? "Assigned to you"
                    : "Assigned"
                  : "Unassigned"}
              </span>
              <button
                className={cx("btnAssign", "buttonGhost")}
                type="button"
                onClick={onAssignToMe}
                disabled={!selectedConversationId || !viewerUserId || selectedConversation?.assigneeUserId === viewerUserId}
              >
                Assign to me
              </button>
              <button
                className={cx("btnAssign", "buttonGhost")}
                type="button"
                onClick={onUnassign}
                disabled={!selectedConversationId || !selectedConversation?.assigneeUserId}
              >
                Unassign
              </button>
              <button className={cx("btnAssign", "buttonGhost")} type="button" onClick={onOpenThreadTask}>
                View Task
              </button>
            </div>
          </div>

          <div className={styles.clientThreadMessages}>
            {messagesLoading ? (
              <div className={styles.emptyState}>Loading messages...</div>
            ) : conversationMessages.length === 0 ? (
              <div className={styles.emptyState}>No messages yet.</div>
            ) : (
              conversationMessages.map((message) => {
                const isStaff = (message.authorRole ?? "").toUpperCase() === "STAFF" || sentMessageIds.includes(message.id);
                const deliveryLabel =
                  message.deliveryStatus === "READ"
                    ? "Read"
                    : message.deliveryStatus === "DELIVERED"
                    ? "Delivered"
                    : "Sent";
                return (
                  <div key={message.id} className={isStaff ? styles.messageStaff : styles.messageClient}>
                    <div className={cx("messageAvatar", isStaff ? "clAvatarStaff" : avatarToneClass(selectedThread?.avatar.color))}>
                      {isStaff ? staffInitials : selectedThread?.avatar.label ?? "CL"}
                    </div>
                    <div className={cx(styles.messageContent, isStaff && styles.messageContentStaff)}>
                      <div className={styles.messageTimestamp}>
                        {isStaff
                          ? `You · ${formatRelative(message.createdAt)} · ${deliveryLabel}`
                          : `${selectedThread?.name ?? "Client"} · ${formatRelative(message.createdAt)}`}
                      </div>
                      <div className={isStaff ? styles.messageBubbleStaff : styles.messageBubbleClient}>
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.clientThreadCompose}>
            <input
              className={styles.composeInput}
              placeholder={selectedThread ? `Reply to ${selectedThread.name}…` : "Select a conversation to reply…"}
              value={composeMessage}
              onChange={(event) => onComposeMessageChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onComposeSubmitShortcut();
                }
              }}
            />
            <button className={cx("btnComposeIcon", "buttonGhost")} type="button" onClick={onOpenThreadFiles}>📎</button>
            <button className={cx("btnComposeTask", "buttonGhost")} type="button" onClick={onCreateTaskFromThread}># Task</button>
            <button className={cx("btnComposeSend", "button", "buttonBlue")} type="button" onClick={onSendMessage} disabled={!selectedConversationId || !composeMessage.trim()}>
              Send
            </button>
          </div>

          <div className={cx("cardBody", "borderT")}>
            <div className={cx("cardHeader", "pl0", "pr0")}>
              <span className={styles.cardHeaderTitle}>Internal Notes</span>
            </div>
            <div className={styles.timeBars}>
              {conversationNotes.length === 0 ? (
                <div className={styles.emptyState}>No internal notes yet.</div>
              ) : (
                conversationNotes.slice(-4).map((note) => (
                  <div key={note.id} className={styles.timeRow}>
                    <span>{note.content}</span>
                    <span className={styles.timeRowValue}>{note.authorRole ?? "STAFF"}</span>
                  </div>
                ))
              )}
            </div>
            <div className={cx("clientThreadCompose", "mt10")}>
              <input
                className={styles.composeInput}
                placeholder="Add internal note..."
                value={noteText}
                onChange={(event) => onNoteTextChange(event.target.value)}
              />
              <button className={cx("button", "buttonGhost")} type="button" onClick={onAddNote} disabled={!selectedConversationId || !noteText.trim()}>
                Save Note
              </button>
            </div>
          </div>

          <div className={cx("cardBody", "borderT")}>
            <div className={cx("cardHeader", "pl0", "pr0")}>
              <span className={styles.cardHeaderTitle}>Escalations</span>
            </div>
            <div className={styles.timeBars}>
              {conversationEscalations.length === 0 ? (
                <div className={styles.emptyState}>No escalations on this thread.</div>
              ) : (
                conversationEscalations.slice(0, 4).map((item) => (
                  <div key={item.id}>
                    <div className={styles.timeRow}>
                      <span>{item.reason}</span>
                      <span className={styles.timeRowValue}>{item.status}</span>
                    </div>
                    <div className={cx("timeRow", "text11", "colorMuted")}>
                      <span>{item.severity}</span>
                      <span>{formatRelative(item.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={cx("clientThreadCompose", "mt10")}>
              <select
                aria-label="Escalation severity"
                className={cx("composeInput", "dlEscalationSelect")}
                value={escalationSeverity}
                onChange={(event) => onEscalationSeverityChange(event.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <input
                className={styles.composeInput}
                placeholder="Escalation reason..."
                value={escalationReason}
                onChange={(event) => onEscalationReasonChange(event.target.value)}
              />
              <button className={cx("button", "buttonBlue")} type="button" onClick={onEscalate} disabled={!selectedConversationId || !escalationReason.trim()}>
                Escalate
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
