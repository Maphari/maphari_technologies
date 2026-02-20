"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createConversationEscalationWithRefresh,
  createConversationNoteWithRefresh,
  createConversationWithRefresh,
  createMessageWithRefresh,
  loadConversationsWithRefresh,
  loadConversationEscalationsWithRefresh,
  loadConversationNotesWithRefresh,
  loadMessagesWithRefresh,
  updateConversationAssigneeWithRefresh,
  updateMessageDeliveryWithRefresh,
  updateConversationEscalationWithRefresh,
  type AdminClient,
  type AdminConversation,
  type AdminMessage,
  type ConversationEscalation,
  type ConversationNote
} from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import styles from "../../../../app/style/maphari-dashboard.module.css";

type MessagesPageProps = {
  snapshot: { clients: AdminClient[] };
  session: AuthSession | null;
  onNotify: (tone: "success" | "error", message: string) => void;
};

function formatDate(value: string): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function EmptyState({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyTitle}>{title}</div>
      {subtitle ? <div className={styles.emptySub}>{subtitle}</div> : null}
    </div>
  );
}

export function MessagesPage({ snapshot, session, onNotify }: MessagesPageProps) {
  const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
  const viewerUserId = session?.user.id ?? null;
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [escalations, setEscalations] = useState<ConversationEscalation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newConversationClientId, setNewConversationClientId] = useState(snapshot.clients[0]?.id ?? "");
  const [composeText, setComposeText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationSeverity, setEscalationSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");

  const loadConversations = useCallback(async (notifyErrors = true) => {
    if (!session) return;
    if (notifyErrors) {
      setLoadingConversations(true);
    }
    const result = await loadConversationsWithRefresh(session);
    if (!result.nextSession) {
      if (notifyErrors) onNotify("error", result.error?.message ?? "Session expired.");
      if (notifyErrors) {
        setLoadingConversations(false);
      }
      return;
    }
    if (result.error && notifyErrors) onNotify("error", result.error.message);
    const rows = result.data ?? [];
    setConversations(rows);
    setSelectedConversationId((current) => current ?? rows[0]?.id ?? null);
    if (notifyErrors) {
      setLoadingConversations(false);
    }
  }, [onNotify, session]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void loadConversations(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loadConversations, session]);

  useEffect(() => {
    if (!session) return;
    const interval = window.setInterval(() => {
      void loadConversations(false);
    }, 12_000);
    return () => {
      window.clearInterval(interval);
    };
  }, [loadConversations, session]);

  const loadMessages = useCallback(async (notifyErrors = true) => {
    if (!session || !selectedConversationId) {
      queueMicrotask(() => {
        setMessages([]);
        setLoadingMessages(false);
      });
      return;
    }
    if (notifyErrors) {
      setLoadingMessages(true);
    }
    const result = await loadMessagesWithRefresh(session, selectedConversationId);
    if (!result.nextSession) {
      if (notifyErrors) onNotify("error", result.error?.message ?? "Session expired.");
      if (notifyErrors) {
        setLoadingMessages(false);
      }
      return;
    }
    if (result.error && notifyErrors) onNotify("error", result.error.message);
    setMessages(result.data ?? []);
    if (notifyErrors) {
      setLoadingMessages(false);
    }
  }, [onNotify, selectedConversationId, session]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void loadMessages(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loadMessages]);

  useEffect(() => {
    if (!session || !selectedConversationId) return;
    const interval = window.setInterval(() => {
      void loadMessages(false);
    }, 8_000);
    return () => {
      window.clearInterval(interval);
    };
  }, [loadMessages, selectedConversationId, session]);

  useEffect(() => {
    if (!session || !selectedConversationId || messages.length === 0) return;
    const inbound = messages
      .filter((message) => (message.authorRole ?? "").toUpperCase() === "CLIENT")
      .filter((message) => message.deliveryStatus !== "READ")
      .slice(-8);
    if (inbound.length === 0) return;
    void Promise.all(
      inbound.map((message) =>
        updateMessageDeliveryWithRefresh(session, message.id, {
          status: "READ",
          deliveredAt: message.deliveredAt ?? new Date().toISOString(),
          readAt: new Date().toISOString()
        })
      )
    );
  }, [messages, selectedConversationId, session]);

  const loadContext = useCallback(async (notifyErrors = true) => {
    if (!session || !selectedConversationId) {
      queueMicrotask(() => {
        setNotes([]);
        setEscalations([]);
        setLoadingContext(false);
      });
      return;
    }
    if (notifyErrors) {
      setLoadingContext(true);
    }
    const [notesResult, escalationsResult] = await Promise.all([
      loadConversationNotesWithRefresh(session, selectedConversationId),
      loadConversationEscalationsWithRefresh(session, { conversationId: selectedConversationId })
    ]);
    if (!notesResult.nextSession || !escalationsResult.nextSession) {
      if (notifyErrors) {
        onNotify("error", notesResult.error?.message ?? escalationsResult.error?.message ?? "Session expired.");
      }
      if (notifyErrors) {
        setLoadingContext(false);
      }
      return;
    }
    if (notesResult.error && notifyErrors) onNotify("error", notesResult.error.message);
    if (escalationsResult.error && notifyErrors) onNotify("error", escalationsResult.error.message);
    setNotes(notesResult.data ?? []);
    setEscalations(escalationsResult.data ?? []);
    if (notifyErrors) {
      setLoadingContext(false);
    }
  }, [onNotify, selectedConversationId, session]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void loadContext(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loadContext]);

  useEffect(() => {
    if (!session || !selectedConversationId) return;
    const interval = window.setInterval(() => {
      void loadContext(false);
    }, 10_000);
    return () => {
      window.clearInterval(interval);
    };
  }, [loadContext, selectedConversationId, session]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations
      .filter((item) => {
        if (!q) return true;
        const clientName = snapshot.clients.find((client) => client.id === item.clientId)?.name ?? "";
        return item.subject.toLowerCase().includes(q) || clientName.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [conversations, search, snapshot.clients]);

  const selectedConversation =
    filteredConversations.find((item) => item.id === selectedConversationId) ??
    conversations.find((item) => item.id === selectedConversationId) ??
    null;

  async function handleCreateConversation(): Promise<void> {
    if (!session || !canEdit) return;
    if (!newConversationClientId || !newSubject.trim()) {
      onNotify("error", "Client and subject are required.");
      return;
    }
    const created = await createConversationWithRefresh(session, {
      clientId: newConversationClientId,
      subject: newSubject.trim()
    });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to create conversation.");
      return;
    }
    setConversations((prev) => [created.data as AdminConversation, ...prev]);
    setSelectedConversationId(created.data.id);
    setNewSubject("");
    onNotify("success", "Conversation created.");
  }

  async function handleSendMessage(): Promise<void> {
    if (!session || !selectedConversationId || !composeText.trim()) return;
    const created = await createMessageWithRefresh(session, {
      conversationId: selectedConversationId,
      content: composeText.trim()
    });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to send message.");
      return;
    }
    setMessages((prev) => [...prev, created.data as AdminMessage]);
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === selectedConversationId
          ? {
              ...conversation,
              updatedAt: created.data?.createdAt ?? conversation.updatedAt,
              assigneeUserId: conversation.assigneeUserId ?? viewerUserId
            }
          : conversation
      )
    );
    setComposeText("");
    onNotify("success", "Message sent.");
  }

  async function handleAssignConversation(assigneeUserId: string | null): Promise<void> {
    if (!session || !selectedConversationId || !canEdit) return;
    const updated = await updateConversationAssigneeWithRefresh(session, selectedConversationId, { assigneeUserId });
    if (!updated.nextSession || !updated.data) {
      onNotify("error", updated.error?.message ?? "Unable to update conversation assignment.");
      return;
    }
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === selectedConversationId ? (updated.data as AdminConversation) : conversation
      )
    );
    onNotify("success", assigneeUserId ? "Conversation assigned." : "Conversation unassigned.");
  }

  async function handleAddNote(): Promise<void> {
    if (!session || !selectedConversationId || !noteText.trim()) return;
    const created = await createConversationNoteWithRefresh(session, {
      conversationId: selectedConversationId,
      content: noteText.trim()
    });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to save note.");
      return;
    }
    setNotes((prev) => [...prev, created.data as ConversationNote]);
    setNoteText("");
    onNotify("success", "Internal note saved.");
  }

  async function handleEscalate(): Promise<void> {
    if (!session || !selectedConversationId || !escalationReason.trim()) return;
    const latestMessageId = messages[messages.length - 1]?.id;
    const created = await createConversationEscalationWithRefresh(session, {
      conversationId: selectedConversationId,
      messageId: latestMessageId,
      severity: escalationSeverity,
      reason: escalationReason.trim()
    });
    if (!created.nextSession || !created.data) {
      onNotify("error", created.error?.message ?? "Unable to escalate conversation.");
      return;
    }
    setEscalations((prev) => [created.data as ConversationEscalation, ...prev]);
    setEscalationReason("");
    setEscalationSeverity("MEDIUM");
    onNotify("success", "Escalation opened.");
  }

  async function handleEscalationStatus(escalationId: string, status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED"): Promise<void> {
    if (!session) return;
    const updated = await updateConversationEscalationWithRefresh(session, escalationId, {
      status,
      ...(status === "RESOLVED" ? { resolvedAt: new Date().toISOString() } : {})
    });
    if (!updated.nextSession || !updated.data) {
      onNotify("error", updated.error?.message ?? "Unable to update escalation.");
      return;
    }
    setEscalations((prev) => prev.map((item) => (item.id === escalationId ? (updated.data as ConversationEscalation) : item)));
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.projHeader}>
        <div>
          <div className={styles.projEyebrow}>Communication</div>
          <div className={styles.projName}>Messages</div>
          <div className={styles.projMeta}>Live conversation threads across clients and projects.</div>
        </div>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Start Conversation</span>
          {canEdit ? <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleCreateConversation()}>Create Thread</button> : null}
        </div>
        <div className={styles.formGrid}>
          <select className={styles.selectInput} value={newConversationClientId} onChange={(event) => setNewConversationClientId(event.target.value)} disabled={!canEdit}>
            <option value="">Select client</option>
            {snapshot.clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <input className={styles.formInput} placeholder="Conversation subject" value={newSubject} onChange={(event) => setNewSubject(event.target.value)} disabled={!canEdit} />
        </div>
      </article>

      <div className={styles.messagesSplit}>
        <div className={styles.messagesListPanel}>
          <div className={styles.messagesSearch}><input className={styles.msgInput} placeholder="Search conversations..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          {loadingConversations ? (
            <div className={styles.cardInner}><EmptyState title="Loading conversations" subtitle="Fetching chat threads..." /></div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => {
              const clientName = snapshot.clients.find((client) => client.id === conversation.clientId)?.name ?? "Unknown client";
              const latest = messages.filter((item) => item.conversationId === conversation.id).slice(-1)[0];
              return (
                <button key={conversation.id} type="button" className={`${styles.msgItem} ${selectedConversationId === conversation.id ? styles.msgSelected : ""}`} onClick={() => setSelectedConversationId(conversation.id)}>
                  <div className={styles.msgAv} style={{ background: "var(--accent)", color: "#050508" }}>{clientName.slice(0, 2).toUpperCase()}</div>
                  <div className={styles.msgBody}>
                    <div className={styles.msgMeta}><span className={styles.msgSender}>{clientName}</span><span className={styles.msgTime}>{formatDate(conversation.updatedAt)}</span></div>
                    <div className={styles.threadMeta}>{conversation.subject}</div>
                    <div className={styles.msgPreview}>{latest?.content ?? "No messages yet"}</div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className={styles.cardInner}><EmptyState title="No conversations yet" subtitle="Create a thread to get started." /></div>
          )}
        </div>

        <div className={styles.threadPanel}>
          {selectedConversation ? (
            <>
              <div className={styles.threadHeader}>
                <div className={styles.msgAv} style={{ background: "var(--accent)", color: "#050508" }}>
                  {(snapshot.clients.find((client) => client.id === selectedConversation.clientId)?.name ?? "CL").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className={styles.threadTitle}>{snapshot.clients.find((client) => client.id === selectedConversation.clientId)?.name ?? "Client"} · Maphari</div>
                  <div className={styles.threadMeta}>{selectedConversation.subject}</div>
                </div>
                <span className={`${styles.badge} ${styles.badgeGreen}`} style={{ marginLeft: "auto" }}>{selectedConversation.status}</span>
                <span className={`${styles.badge} ${selectedConversation.assigneeUserId ? styles.badgeBlue : styles.badgeAmber}`}>
                  {selectedConversation.assigneeUserId ? (selectedConversation.assigneeUserId === viewerUserId ? "Assigned to you" : "Assigned") : "Unassigned"}
                </span>
                {canEdit ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className={`${styles.btnSm} ${styles.btnGhost}`}
                      onClick={() => void handleAssignConversation(viewerUserId)}
                      disabled={!viewerUserId || selectedConversation.assigneeUserId === viewerUserId}
                    >
                      Assign to me
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnSm} ${styles.btnGhost}`}
                      onClick={() => void handleAssignConversation(null)}
                      disabled={!selectedConversation.assigneeUserId}
                    >
                      Unassign
                    </button>
                  </div>
                ) : null}
              </div>
              <div className={styles.threadBody}>
                {loadingMessages ? (
                  <EmptyState title="Loading messages" subtitle="Fetching conversation history..." />
                ) : messages.length > 0 ? (
                  messages.map((message) => {
                    const authorRole = (message.authorRole ?? "").toUpperCase();
                    const isOwn = authorRole === "ADMIN" || authorRole === "STAFF";
                    const senderLabel = isOwn ? "You" : "Client";
                    const deliveryLabel =
                      message.deliveryStatus === "READ"
                        ? "Read"
                        : message.deliveryStatus === "DELIVERED"
                        ? "Delivered"
                        : "Sent";
                    return (
                      <div key={message.id} className={`${styles.chatRow} ${isOwn ? styles.chatRowRight : ""}`}>
                        <div className={styles.msgAvSmall} style={{ background: isOwn ? "var(--purple)" : "var(--accent)", color: isOwn ? "#fff" : "#050508" }}>
                          {isOwn ? "YO" : "CL"}
                        </div>
                        <div>
                          <div className={styles.chatMeta}>
                            {senderLabel} · {formatDate(message.createdAt)} · {deliveryLabel}
                          </div>
                          <div className={isOwn ? styles.chatBubbleAlt : styles.chatBubble}>{message.content}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState title="No messages yet" subtitle="This thread updates after the first message." />
                )}
              </div>
              <div className={styles.msgCompose}>
                <input className={styles.msgInput} placeholder="Write a reply..." value={composeText} onChange={(event) => setComposeText(event.target.value)} />
                <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleSendMessage()}>Send</button>
              </div>
              <div className={styles.grid2} style={{ padding: 14, borderTop: "1px solid var(--border)" }}>
                <article className={styles.card} style={{ margin: 0 }}>
                  <div className={styles.cardHd}><span className={styles.cardHdTitle}>Internal Notes</span></div>
                  <div className={styles.cardInner}>
                    {loadingContext ? (
                      <EmptyState title="Loading notes" />
                    ) : notes.length === 0 ? (
                      <EmptyState title="No internal notes" subtitle="Add internal context for this thread." />
                    ) : (
                      notes.slice(-4).map((note) => (
                        <div key={note.id} className={styles.timelineItem}>
                          <div className={styles.timelineDot} />
                          <div>
                            <div className={styles.timelineTitle}>{note.content}</div>
                            <div className={styles.timelineMeta}>{note.authorRole ?? "STAFF"} · {formatDate(note.createdAt)}</div>
                          </div>
                        </div>
                      ))
                    )}
                    <div className={styles.msgCompose} style={{ marginTop: 8 }}>
                      <input className={styles.msgInput} placeholder="Add internal note..." value={noteText} onChange={(event) => setNoteText(event.target.value)} />
                      <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => void handleAddNote()} disabled={!noteText.trim()}>Save</button>
                    </div>
                  </div>
                </article>

                <article className={styles.card} style={{ margin: 0 }}>
                  <div className={styles.cardHd}><span className={styles.cardHdTitle}>Escalations</span></div>
                  <div className={styles.cardInner}>
                    {loadingContext ? (
                      <EmptyState title="Loading escalations" />
                    ) : escalations.length === 0 ? (
                      <EmptyState title="No escalations" subtitle="Escalate this thread if attention is needed." />
                    ) : (
                      escalations.slice(0, 4).map((item) => (
                        <div key={item.id} className={styles.timelineItem}>
                          <div className={styles.timelineDot} style={{ background: item.status === "RESOLVED" ? "var(--green)" : "var(--amber)" }} />
                          <div style={{ flex: 1 }}>
                            <div className={styles.timelineTitle}>{item.reason}</div>
                            <div className={styles.timelineMeta}>{item.severity} · {item.status}</div>
                          </div>
                          {item.status !== "RESOLVED" ? (
                            <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => void handleEscalationStatus(item.id, "RESOLVED")}>Resolve</button>
                          ) : null}
                        </div>
                      ))
                    )}
                    <div className={styles.formGrid} style={{ marginTop: 8 }}>
                      <select className={styles.selectInput} value={escalationSeverity} onChange={(event) => setEscalationSeverity(event.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                      <input className={styles.formInput} placeholder="Escalation reason" value={escalationReason} onChange={(event) => setEscalationReason(event.target.value)} />
                    </div>
                    <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void handleEscalate()} disabled={!escalationReason.trim()}>Create Escalation</button>
                  </div>
                </article>
              </div>
            </>
          ) : (
            <div className={styles.cardInner}><EmptyState title="Select a conversation" subtitle="Select a thread to load message history." /></div>
          )}
        </div>
      </div>
    </div>
  );
}
