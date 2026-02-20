import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { PortalConversation, PortalMessage } from "../../../../lib/api/portal";
import { cx, styles } from "../style";
import { formatDateShort, getInitials } from "../utils";
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

export function ClientMessagesPage({
  active,
  openThreadsCount,
  messageThreads,
  threadSearch,
  onThreadSearchChange,
  newThreadSubject,
  onNewThreadSubjectChange,
  creatingThread,
  onCreateThread,
  selectedConversationId,
  onThreadClick,
  selectedConversation,
  selectedProjectName,
  messagesLoading,
  conversationMessages,
  composeMessage,
  setComposeMessage,
  onSendMessage,
  onAttachFile,
  attachingFile
}: MessagesPageProps) {
  return (
    <section className={cx("page", active && "pageActive")} id="page-messages">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>Communication</div>
          <div className={styles.pageTitle}>Messages</div>
          <div className={styles.pageSub}>{openThreadsCount} open thread{openThreadsCount === 1 ? "" : "s"} from your team.</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className={styles.composeInput}
            style={{ width: 250 }}
            value={newThreadSubject}
            onChange={(event) => onNewThreadSubjectChange(event.target.value)}
            placeholder="Thread subject"
          />
          <button
            className={cx("button", "buttonAccent")}
            type="button"
            onClick={onCreateThread}
            disabled={creatingThread || newThreadSubject.trim().length < 2}
          >
            {creatingThread ? "Creating..." : "+ New Thread"}
          </button>
        </div>
      </div>

      <div className={styles.threadPane}>
        <div className={styles.threadList}>
          <div className={styles.threadSearch}>
            <input
              type="text"
              placeholder="Search messages…"
              value={threadSearch}
              onChange={(event) => onThreadSearchChange(event.target.value)}
            />
          </div>
          <div className={styles.threadScroll}>
            {messageThreads.length === 0 ? (
              <div
                className={styles.emptyState}
                style={{
                  minHeight: "100%",
                  display: "grid",
                  placeItems: "center",
                  padding: "24px",
                  textAlign: "center"
                }}
              >
                No threads yet.
              </div>
            ) : (
              messageThreads.map((thread) => (
                <button
                  key={thread.id}
                  className={cx("threadItem", selectedConversationId === thread.id && "threadItemActive")}
                  type="button"
                  onClick={() => onThreadClick(thread.id)}
                  style={{ width: "100%", textAlign: "left" }}
                >
                  <div
                    className={styles.threadAvatar}
                    style={{
                      background: thread.avatar.bg,
                      color: thread.avatar.color,
                      border: thread.avatar.bordered ? "1px solid var(--border)" : "none",
                      width: 36,
                      height: 36
                    }}
                  >
                    {thread.avatar.label}
                  </div>
                  <div className={styles.threadBody}>
                    <div className={styles.threadMeta}>
                      <span className={styles.threadSender} style={{ color: "var(--text)" }}>{thread.sender}</span>
                      <span className={styles.threadTime}>{thread.time}</span>
                    </div>
                    <div className={styles.threadProject}>{thread.project}</div>
                    <div className={styles.threadPreview}>{thread.preview}</div>
                  </div>
                  {thread.unread ? <div className={styles.unreadDot} /> : null}
                </button>
              ))
            )}
          </div>
        </div>

        <div className={styles.threadMain}>
          <div className={styles.threadHeader}>
            <div
              className={styles.threadAvatar}
              style={{ background: "var(--accent)", color: "#050508", width: 34, height: 34, fontSize: "0.68rem" }}
            >
              {selectedConversation ? getInitials(selectedConversation.subject) : "—"}
            </div>
            <div className={styles.threadHeaderInfo}>
              <div className={styles.threadHeaderName}>{selectedConversation?.subject ?? "Select a thread"}</div>
              <div className={styles.threadHeaderProject}>{selectedProjectName}</div>
            </div>
            <span className={cx("badge", selectedConversation?.status === "OPEN" ? "bgGreen" : "bgMuted")}>
              {selectedConversation?.status ?? "Idle"}
            </span>
          </div>

          <div className={styles.threadMessages}>
            {messagesLoading ? (
              <div className={styles.emptyState}>Loading messages…</div>
            ) : conversationMessages.length === 0 ? (
              <div className={styles.emptyState}>No messages yet.</div>
            ) : (
              conversationMessages.map((message) => {
                const isClient = (message.authorRole ?? "").toUpperCase() === "CLIENT";
                const deliveryState = message.deliveryStatus === "READ" ? "Read" : message.deliveryStatus === "DELIVERED" ? "Delivered" : "Sent";
                return (
                  <div key={message.id} className={isClient ? styles.messageOut : styles.messageIn}>
                    <div
                      className={styles.messageAvatar}
                      style={isClient ? { background: "var(--accent2)", color: "#050508" } : { background: "var(--accent)", color: "#050508" }}
                    >
                      {isClient ? "YO" : "M"}
                    </div>
                    <div>
                      <div className={styles.messageTimestamp}>
                        {isClient ? "You" : "Maphari"} · {formatDateShort(message.createdAt)}{isClient ? ` · ${deliveryState}` : ""}
                      </div>
                      <div className={isClient ? styles.messageBubbleOut : styles.messageBubbleIn}>{message.content}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.compose}>
            <input
              className={styles.composeInput}
              placeholder="Send a message…"
              value={composeMessage}
              onChange={(event) => setComposeMessage(event.target.value)}
            />
            <label
              className={cx("button", "buttonGhost")}
              style={{
                padding: "8px 12px",
                flexShrink: 0,
                opacity: selectedConversationId ? 1 : 0.45,
                pointerEvents: selectedConversationId ? "auto" : "none"
              }}
              aria-label={attachingFile ? "Uploading attachment" : "Attach file"}
            >
              {attachingFile ? "Uploading..." : "📎"}
              <input type="file" style={{ display: "none" }} onChange={onAttachFile} disabled={!selectedConversationId || attachingFile} />
            </label>
            <button
              className={cx("button", "buttonAccent")}
              type="button"
              style={{ flexShrink: 0 }}
              onClick={onSendMessage}
              disabled={!selectedConversationId || !composeMessage.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
