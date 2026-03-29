"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
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
import { createAdHocVideoRoom } from "../../../../lib/api/staff/governance";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { toneClass } from "./admin-page-utils";

type MessagesPageProps = {
  snapshot: { clients: AdminClient[] };
  session: AuthSession | null;
  onNotify: (tone: "success" | "error", message: string) => void;
};

type Tab = "inbox" | "escalations";

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

function clientName(clients: AdminClient[], clientId: string): string {
  return clients.find((client) => client.id === clientId)?.name ?? "Unknown client";
}

function toneForEscalationStatus(status: string): string {
  if (status === "RESOLVED") return "var(--accent)";
  if (status === "ACKNOWLEDGED") return "var(--blue)";
  return "var(--red)";
}

function toneForSeverity(severity: string): string {
  if (severity === "CRITICAL") return "var(--red)";
  if (severity === "HIGH") return "var(--amber)";
  if (severity === "MEDIUM") return "var(--blue)";
  return "var(--muted)";
}

export function MessagesPage({ snapshot, session, onNotify }: MessagesPageProps) {
  const canEdit = session?.user.role === "ADMIN" || session?.user.role === "STAFF";
  const viewerUserId = session?.user.id ?? null;

  const [activeTab, setActiveTab] = useState<Tab>("inbox");
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
  const [startingCall, setStartingCall] = useState(false);

  const loadConversations = useCallback(
    async (notifyErrors = true) => {
      if (!session) return;
      if (notifyErrors) setLoadingConversations(true);
      const result = await loadConversationsWithRefresh(session);
      if (!result.nextSession) {
        if (notifyErrors) onNotify("error", result.error?.message ?? "Session expired.");
        if (notifyErrors) setLoadingConversations(false);
        return;
      }
      if (result.error && notifyErrors) onNotify("error", result.error.message);
      const rows = result.data ?? [];
      setConversations(rows);
      setSelectedConversationId((current) => current ?? rows[0]?.id ?? null);
      if (notifyErrors) setLoadingConversations(false);
    },
    [onNotify, session]
  );

  const loadMessages = useCallback(
    async (notifyErrors = true) => {
      if (!session || !selectedConversationId) {
        setMessages([]);
        setLoadingMessages(false);
        return;
      }
      if (notifyErrors) setLoadingMessages(true);
      const result = await loadMessagesWithRefresh(session, selectedConversationId);
      if (!result.nextSession) {
        if (notifyErrors) onNotify("error", result.error?.message ?? "Session expired.");
        if (notifyErrors) setLoadingMessages(false);
        return;
      }
      if (result.error && notifyErrors) onNotify("error", result.error.message);
      setMessages(result.data ?? []);
      if (notifyErrors) setLoadingMessages(false);
    },
    [onNotify, selectedConversationId, session]
  );

  const loadContext = useCallback(
    async (notifyErrors = true) => {
      if (!session || !selectedConversationId) {
        setNotes([]);
        setEscalations([]);
        setLoadingContext(false);
        return;
      }
      if (notifyErrors) setLoadingContext(true);
      const [notesResult, escalationsResult] = await Promise.all([
        loadConversationNotesWithRefresh(session, selectedConversationId),
        loadConversationEscalationsWithRefresh(session, { conversationId: selectedConversationId })
      ]);
      if (!notesResult.nextSession || !escalationsResult.nextSession) {
        if (notifyErrors) onNotify("error", notesResult.error?.message ?? escalationsResult.error?.message ?? "Session expired.");
        if (notifyErrors) setLoadingContext(false);
        return;
      }
      if (notesResult.error && notifyErrors) onNotify("error", notesResult.error.message);
      if (escalationsResult.error && notifyErrors) onNotify("error", escalationsResult.error.message);
      setNotes(notesResult.data ?? []);
      setEscalations(escalationsResult.data ?? []);
      if (notifyErrors) setLoadingContext(false);
    },
    [onNotify, selectedConversationId, session]
  );

  useEffect(() => {
    if (!session) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadConversations(true);
  }, [loadConversations, session]);

  useEffect(() => {
    if (!session) return;
    const interval = window.setInterval(() => {
      void loadConversations(false);
    }, 12000);
    return () => window.clearInterval(interval);
  }, [loadConversations, session]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMessages(true);
  }, [loadMessages]);

  useEffect(() => {
    if (!session || !selectedConversationId) return;
    const interval = window.setInterval(() => {
      void loadMessages(false);
    }, 8000);
    return () => window.clearInterval(interval);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadContext(true);
  }, [loadContext]);

  useEffect(() => {
    if (!session || !selectedConversationId) return;
    const interval = window.setInterval(() => {
      void loadContext(false);
    }, 10000);
    return () => window.clearInterval(interval);
  }, [loadContext, selectedConversationId, session]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations
      .filter((item) => {
        if (!q) return true;
        const cName = clientName(snapshot.clients, item.clientId);
        return item.subject.toLowerCase().includes(q) || cName.toLowerCase().includes(q);
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [conversations, search, snapshot.clients]);

  const selectedConversation =
    filteredConversations.find((item) => item.id === selectedConversationId) ??
    conversations.find((item) => item.id === selectedConversationId) ??
    null;

  const openEscalationsCount = escalations.filter((e) => e.status !== "RESOLVED").length;
  const unreadClientCount = messages.filter((m) => (m.authorRole ?? "").toUpperCase() === "CLIENT" && m.deliveryStatus !== "READ").length;

  if (loadingConversations) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

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
      onNotify("error", updated.error?.message ?? "Unable to update assignment.");
      return;
    }
    setConversations((prev) => prev.map((conversation) => (conversation.id === selectedConversationId ? (updated.data as AdminConversation) : conversation)));
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
      onNotify("error", created.error?.message ?? "Unable to create escalation.");
      return;
    }
    setEscalations((prev) => [created.data as ConversationEscalation, ...prev]);
    setEscalationReason("");
    setEscalationSeverity("MEDIUM");
    setActiveTab("escalations");
    onNotify("success", "Escalation opened.");
  }

  async function handleStartCall(): Promise<void> {
    if (!session || !canEdit) return;
    setStartingCall(true);
    const cName = selectedConversation
      ? clientName(snapshot.clients, selectedConversation.clientId)
      : "Ad-hoc Meeting";
    const result = await createAdHocVideoRoom(session, cName);
    setStartingCall(false);
    if (result.error || !result.data) {
      onNotify("error", result.error?.message ?? "Unable to create video room.");
      return;
    }
    window.open(result.data.roomUrl, "_blank", "noopener,noreferrer");
  }

  async function handleEscalationStatus(escalationId: string, status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED"): Promise<void> {
    if (!session) return;
    const updated = await updateConversationEscalationWithRefresh(session, escalationId, {
      status,
      ...(status === "RESOLVED" ? { resolvedAt: new Date().toISOString() } : {})
    });
    if (updated.nextSession) saveSession(updated.nextSession);
    if (updated.error || !updated.data) {
      onNotify("error", updated.error?.message ?? "Unable to update escalation.");
      return;
    }
    setEscalations((prev) => prev.map((item) => (item.id === escalationId ? (updated.data as ConversationEscalation) : item)));
    onNotify(
      "success",
      status === "RESOLVED"
        ? "Escalation resolved."
        : status === "ACKNOWLEDGED"
        ? "Escalation acknowledged."
        : "Escalation re-opened."
    );
  }

  return (
    <div className={cx(styles.pageBody, styles.msgRoot)}>
      <div className={cx("flexBetween", "mb28")}>
        <div>
          <div className={cx("pageEyebrow")}>COMMUNICATION / MESSAGES</div>
          <h1 className={cx("pageTitle")}>Messages</h1>
          <div className={cx("pageSub")}>Thread ownership &middot; Reply execution &middot; Escalation control</div>
        </div>
        <button type="button" onClick={() => void handleCreateConversation()} disabled={!canEdit} className={cx("btnSm", "btnAccent", "fontMono", !canEdit && "opacity60")}>
          + New Thread
        </button>
      </div>

      <div className={styles.msgKpiGrid}>
        {[
          { label: "Active Threads", value: filteredConversations.length.toString(), sub: "Sorted by latest activity", color: "var(--accent)" },
          { label: "Unread Client Messages", value: unreadClientCount.toString(), sub: "Pending review in selected thread", color: unreadClientCount > 0 ? "var(--amber)" : "var(--accent)" },
          { label: "Open Escalations", value: openEscalationsCount.toString(), sub: "Needs owner action", color: openEscalationsCount > 0 ? "var(--red)" : "var(--accent)" },
          { label: "Assigned Threads", value: conversations.filter((c) => Boolean(c.assigneeUserId)).length.toString(), sub: "Ownership coverage", color: "var(--blue)" }
        ].map((k) => (
          <div key={k.label} className={cx(styles.msgKpiCard, toneClass(k.color))}>
            <div className={styles.msgKpiLabel}>{k.label}</div>
            <div className={cx(styles.msgKpiValue, styles.msgToneText, toneClass(k.color))}>{k.value}</div>
            <div className={styles.msgKpiMeta}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.msgToolbar}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search thread or client" className={cx("formInput", "fontMono", "text12", styles.msgSearchInput)} />
        <div className={styles.msgToolbarDivider} />
        <span className={styles.msgToolbarLabel}>New Thread</span>
        <select title="Select client" value={newConversationClientId} onChange={(e) => setNewConversationClientId(e.target.value)} className={cx("formInput", "fontMono", "text12")}>
          <option value="">Select client</option>
          {snapshot.clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
        <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Thread subject" className={cx("formInput", "fontMono", "text12", styles.msgSubjectInput)} />
        <div className={styles.msgToolbarDivider} />
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={cx(styles.filterSelect)}>
          {(["inbox", "escalations"] as Tab[]).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "inbox" ? (
        <div className={styles.msgInboxSplit}>
          <div className={cx("card", "overflowAuto", "minH0")}>
            {loadingConversations ? (
              <div className={cx("p20", "colorMuted", "text12")}>Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className={styles.emptyTitle}>No conversations yet</div>
                  <div className={styles.emptySub}>Start a new thread to communicate with a client. Select a client and subject above, then click &quot;+ New Thread&quot;.</div>
                </div>
            ) : (
              filteredConversations.map((conversation) => {
                const selected = selectedConversationId === conversation.id;
                const cName = clientName(snapshot.clients, conversation.clientId);
                const assigneeTone = conversation.assigneeUserId ? "toneAccent" : "toneAmber";
                return (
                  <button type="button" key={conversation.id} onClick={() => setSelectedConversationId(conversation.id)} className={cx("wFull", "borderB", "pointerCursor", styles.msgThreadBtn, selected && styles.msgThreadBtnSelected)}>
                    <div className={cx("flexBetween", "mb4")}>
                      <span className={cx("text12", "fw700")}>{cName}</span>
                      <span className={cx("fontMono", "text10", "colorMuted")}>{formatDate(conversation.updatedAt)}</span>
                    </div>
                    <div className={cx("text11", "colorMuted", "mb3")}>{conversation.subject}</div>
                    <div className={cx("flexRow", "gap6")}>
                      <span className={cx("fontMono", styles.msgToneTag, styles.msgTag9, "toneBlue")}>{conversation.status}</span>
                      <span className={cx("fontMono", styles.msgToneTag, styles.msgTag9, assigneeTone)}>
                        {conversation.assigneeUserId ? "Assigned" : "Unassigned"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className={cx("card")}>
            {selectedConversation ? (
              <div className={styles.msgThreadPanel}>
                <div className={cx("borderB", "flexRow", "gap12", styles.msgPad14, styles.msgAlignCenter)}>
                  <div>
                    <div className={cx("text14", "fw700")}>{clientName(snapshot.clients, selectedConversation.clientId)} &middot; Maphari</div>
                    <div className={cx("text11", "colorMuted")}>{selectedConversation.subject}</div>
                  </div>
                  <div className={cx("mlAuto", "flexRow", "gap6")}>
                    <span className={cx("fontMono", styles.msgToneTag, styles.msgTag9Header, "toneBlue")}>{selectedConversation.status}</span>
                    <span className={cx("fontMono", styles.msgToneTag, styles.msgTag9Header, selectedConversation.assigneeUserId ? "toneAccent" : "toneAmber")}>
                      {selectedConversation.assigneeUserId ? "Assigned" : "Unassigned"}
                    </span>
                    {canEdit ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleStartCall()}
                          disabled={startingCall}
                          className={cx("btnSm", "fontMono", "text10", startingCall ? styles.btnCallPending : styles.btnCallActive)}
                        >
                          {startingCall ? "Creating…" : "Start Call"}
                        </button>
                        <button type="button" onClick={() => void handleAssignConversation(viewerUserId)} disabled={!viewerUserId || selectedConversation.assigneeUserId === viewerUserId} className={cx("btnSm", "btnGhost", "fontMono", "text10")}>Assign to me</button>
                        <button type="button" onClick={() => void handleAssignConversation(null)} disabled={!selectedConversation.assigneeUserId} className={cx("btnSm", "btnGhost", "fontMono", "text10")}>Unassign</button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className={cx("overflowAuto", "minH0", styles.msgPad14)}>
                  {loadingMessages ? (
                    <div className={cx("colorMuted", "text12")}>Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className={cx("colorMuted", "text12")}>No messages yet.</div>
                  ) : (
                    messages.map((message) => {
                      const authorRole = (message.authorRole ?? "").toUpperCase();
                      const isOwn = authorRole === "ADMIN" || authorRole === "STAFF";
                      const deliveryLabel = message.deliveryStatus === "READ" ? "Read" : message.deliveryStatus === "DELIVERED" ? "Delivered" : "Sent";
                      const sentiment = !isOwn ? message.sentimentLabel : null;
                      return (
                        <div key={message.id} className={cx("mb10", styles.msgBubbleRow, isOwn ? styles.msgBubbleRowOwn : styles.msgBubbleRowClient)}>
                          <div className={cx("borderDefault", styles.msgBubble, isOwn && styles.msgBubbleOwn)}>
                            <div className={cx("text10", "colorMuted", "mb4", "flexRow", "gap6")}>
                              <span>{isOwn ? "You" : "Client"} &middot; {formatDate(message.createdAt)} &middot; {deliveryLabel}</span>
                              {sentiment === "POSITIVE" && <span className={cx(styles.sentimentPill, styles.sentimentPositive)}>Positive</span>}
                              {sentiment === "NEGATIVE" && <span className={cx(styles.sentimentPill, styles.sentimentNegative)}>Negative</span>}
                            </div>
                            <div className={cx("text12", styles.msgLine15)}>{message.content}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className={cx("borderB", "flexRow", "gap8", styles.msgComposeRow)}>
                  <input value={composeText} onChange={(e) => setComposeText(e.target.value)} placeholder="Write a reply..." className={cx("formInput", "fontMono", "text12", styles.msgFlex1)} />
                  <button type="button" onClick={() => void handleSendMessage()} disabled={!composeText.trim()} className={cx("btnSm", "btnAccent", "fontMono", !composeText.trim() && "opacity60")}>Send</button>
                </div>

                <div className={cx("grid2", "gap12", styles.msgMetaRow)}>
                  <div className={cx("bgBg", "borderDefault", styles.msgPad10)}>
                    <div className={cx("text11", "fw700", "mb8")}>Internal Notes</div>
                    <div className={cx("overflowAuto", "mb8", styles.msgNotesList)}>
                      {loadingContext ? (
                        <div className={cx("colorMuted", "text11")}>Loading notes...</div>
                      ) : notes.length === 0 ? (
                        <div className={cx("colorMuted", "text11")}>No notes yet.</div>
                      ) : (
                        notes.slice(-4).map((note) => (
                          <div key={note.id} className={cx("mb8")}>
                            <div className={cx("text11")}>{note.content}</div>
                            <div className={cx("text10", "colorMuted")}>{note.authorRole ?? "STAFF"} &middot; {formatDate(note.createdAt)}</div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className={cx("flexRow", "gap6")}>
                      <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add note" className={cx("formInput", "fontMono", "text11", styles.msgFlex1)} />
                      <button type="button" onClick={() => void handleAddNote()} disabled={!noteText.trim()} className={cx("btnSm", "btnGhost", "fontMono", "text11", !noteText.trim() && "opacity60")}>Save</button>
                    </div>
                  </div>

                  <div className={cx("bgBg", "borderDefault", styles.msgPad10)}>
                    <div className={cx("text11", "fw700", "mb8")}>Escalate Thread</div>
                    <div className={styles.msgEscalateForm}>
                      <select title="Escalation severity" value={escalationSeverity} onChange={(e) => setEscalationSeverity(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")} className={cx("formInput", "fontMono", "text11")}>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                      <input value={escalationReason} onChange={(e) => setEscalationReason(e.target.value)} placeholder="Reason" className={cx("formInput", "fontMono", "text11")} />
                      <button type="button" onClick={() => void handleEscalate()} disabled={!escalationReason.trim()} className={cx("btnSm", "btnAccent", "fontMono", "text11", !escalationReason.trim() && "opacity60")}>Create</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={cx("p20", "colorMuted", "text12")}>Select a conversation to load thread details.</div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "escalations" ? (
        <div className={cx("card", "overflowHidden", "minH0")}>
          <div className={styles.msgEscRoot}>
            <div className={cx("msgEscHead", "fontMono", "text10", "colorMuted", "uppercase")}>
              {["Conversation", "Severity", "Status", "Created", "Reason", "Action"].map((h) => <span key={h}>{h}</span>)}
            </div>
            <div className={cx("overflowAuto", "minH0")}>
              {loadingContext ? (
                <div className={cx("p20", "colorMuted", "text12")}>Loading escalations...</div>
              ) : escalations.length === 0 ? (
                <div className={cx("p20", "colorMuted", "text12")}>No escalations recorded for the selected thread.</div>
              ) : (
                escalations.map((item) => (
                  <div key={item.id} className={styles.msgEscRow}>
                    <div className={cx("text12")}>{selectedConversation?.subject ?? "Conversation"}</div>
                    <span className={cx("fontMono", styles.msgToneText, toneClass(toneForSeverity(item.severity)))}>{item.severity}</span>
                    <span className={cx("text10", "fontMono", "wFit", styles.msgToneTag, styles.msgTagStatus, toneClass(toneForEscalationStatus(item.status)))}>{item.status}</span>
                    <span className={cx("fontMono", "colorMuted")}>{formatDate(item.createdAt)}</span>
                    <span className={cx("text11", "colorMuted")}>{item.reason}</span>
                    <div className={cx("flexRow", "gap6")}>
                      {item.status === "OPEN" ? (
                        <button type="button" onClick={() => void handleEscalationStatus(item.id, "ACKNOWLEDGED")} className={cx("btnSm", "btnGhost", "fontMono", "text10")}>Acknowledge</button>
                      ) : null}
                      {item.status !== "RESOLVED" ? (
                        <button type="button" onClick={() => void handleEscalationStatus(item.id, "RESOLVED")} className={cx("btnSm", "btnAccent", "fontMono", "text10")}>Resolve</button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
