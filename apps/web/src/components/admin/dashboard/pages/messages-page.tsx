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

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  primary: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

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
  if (status === "RESOLVED") return C.primary;
  if (status === "ACKNOWLEDGED") return C.blue;
  return C.red;
}

function toneForSeverity(severity: string): string {
  if (severity === "CRITICAL") return C.red;
  if (severity === "HIGH") return C.amber;
  if (severity === "MEDIUM") return C.blue;
  return C.muted;
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
    <div
      style={{
        background: C.bg,
        height: "100%",
        color: C.text,
        fontFamily: "Syne, sans-serif",
        padding: 0,
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "auto auto auto 1fr",
        minHeight: 0
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Messages</h1>
          <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>Thread ownership · Reply execution · Escalation control</div>
        </div>
        <button onClick={() => void handleCreateConversation()} disabled={!canEdit} style={{ background: C.primary, color: C.bg, border: "none", padding: "8px 16px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: canEdit ? 1 : 0.6 }}>
          + New Thread
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Active Threads", value: filteredConversations.length.toString(), sub: "Sorted by latest activity", color: C.primary },
          { label: "Unread Client Messages", value: unreadClientCount.toString(), sub: "Pending review in selected thread", color: unreadClientCount > 0 ? C.amber : C.primary },
          { label: "Open Escalations", value: openEscalationsCount.toString(), sub: "Needs owner action", color: openEscalationsCount > 0 ? C.red : C.primary },
          { label: "Assigned Threads", value: conversations.filter((c) => Boolean(c.assigneeUserId)).length.toString(), sub: "Ownership coverage", color: C.blue }
        ].map((k) => (
          <div key={k.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 24, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search thread or client" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", minWidth: 260, fontFamily: "DM Mono, monospace", fontSize: 12 }} />
          <select value={newConversationClientId} onChange={(e) => setNewConversationClientId(e.target.value)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            <option value="">Select client</option>
            {snapshot.clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="New thread subject" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", minWidth: 260, fontFamily: "DM Mono, monospace", fontSize: 12 }} />
          <button onClick={() => { setSearch(""); setNewSubject(""); }} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>Reset</button>

          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {(["inbox", "escalations"] as Tab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: "none", border: "none", borderBottom: activeTab === tab ? `2px solid ${C.primary}` : "none", color: activeTab === tab ? C.primary : C.muted, padding: "8px 12px", fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 600, textTransform: "capitalize", letterSpacing: "0.06em", cursor: "pointer" }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "inbox" ? (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, minHeight: 0 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "auto", minHeight: 0 }}>
            {loadingConversations ? (
              <div style={{ padding: 20, color: C.muted, fontSize: 12 }}>Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: 20, color: C.muted, fontSize: 12 }}>No conversations found.</div>
            ) : (
              filteredConversations.map((conversation) => {
                const selected = selectedConversationId === conversation.id;
                const cName = clientName(snapshot.clients, conversation.clientId);
                return (
                  <button key={conversation.id} onClick={() => setSelectedConversationId(conversation.id)} style={{ width: "100%", textAlign: "left", background: selected ? `${C.primary}10` : "transparent", border: "none", borderBottom: `1px solid ${C.border}`, padding: 12, cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{cName}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{formatDate(conversation.updatedAt)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{conversation.subject}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ fontSize: 9, color: C.blue, background: `${C.blue}15`, padding: "2px 6px", fontFamily: "DM Mono, monospace" }}>{conversation.status}</span>
                      <span style={{ fontSize: 9, color: conversation.assigneeUserId ? C.primary : C.amber, background: `${conversation.assigneeUserId ? C.primary : C.amber}15`, padding: "2px 6px", fontFamily: "DM Mono, monospace" }}>
                        {conversation.assigneeUserId ? "Assigned" : "Unassigned"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, display: "grid", gridTemplateRows: "auto 1fr auto auto", minHeight: 0, overflow: "hidden" }}>
            {selectedConversation ? (
              <>
                <div style={{ padding: 14, borderBottom: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{clientName(snapshot.clients, selectedConversation.clientId)} · Maphari</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{selectedConversation.subject}</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 9, color: C.blue, background: `${C.blue}15`, padding: "3px 7px", fontFamily: "DM Mono, monospace" }}>{selectedConversation.status}</span>
                    <span style={{ fontSize: 9, color: selectedConversation.assigneeUserId ? C.primary : C.amber, background: `${selectedConversation.assigneeUserId ? C.primary : C.amber}15`, padding: "3px 7px", fontFamily: "DM Mono, monospace" }}>
                      {selectedConversation.assigneeUserId ? "Assigned" : "Unassigned"}
                    </span>
                    {canEdit ? (
                      <>
                        <button onClick={() => void handleAssignConversation(viewerUserId)} disabled={!viewerUserId || selectedConversation.assigneeUserId === viewerUserId} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 10, cursor: "pointer" }}>Assign to me</button>
                        <button onClick={() => void handleAssignConversation(null)} disabled={!selectedConversation.assigneeUserId} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 10, cursor: "pointer" }}>Unassign</button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div style={{ padding: 14, overflow: "auto", minHeight: 0 }}>
                  {loadingMessages ? (
                    <div style={{ color: C.muted, fontSize: 12 }}>Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div style={{ color: C.muted, fontSize: 12 }}>No messages yet.</div>
                  ) : (
                    messages.map((message) => {
                      const authorRole = (message.authorRole ?? "").toUpperCase();
                      const isOwn = authorRole === "ADMIN" || authorRole === "STAFF";
                      const deliveryLabel = message.deliveryStatus === "READ" ? "Read" : message.deliveryStatus === "DELIVERED" ? "Delivered" : "Sent";
                      return (
                        <div key={message.id} style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", marginBottom: 10 }}>
                          <div style={{ maxWidth: "72%", background: isOwn ? `${C.primary}22` : C.bg, border: `1px solid ${isOwn ? `${C.primary}66` : C.border}`, padding: 10 }}>
                            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{isOwn ? "You" : "Client"} · {formatDate(message.createdAt)} · {deliveryLabel}</div>
                            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{message.content}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ padding: 12, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
                  <input value={composeText} onChange={(e) => setComposeText(e.target.value)} placeholder="Write a reply..." style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 10px", fontFamily: "DM Mono, monospace", fontSize: 12 }} />
                  <button onClick={() => void handleSendMessage()} disabled={!composeText.trim()} style={{ background: C.primary, color: C.bg, border: "none", padding: "8px 14px", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: composeText.trim() ? 1 : 0.6 }}>Send</button>
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Internal Notes</div>
                    <div style={{ maxHeight: 120, overflow: "auto", marginBottom: 8 }}>
                      {loadingContext ? (
                        <div style={{ color: C.muted, fontSize: 11 }}>Loading notes...</div>
                      ) : notes.length === 0 ? (
                        <div style={{ color: C.muted, fontSize: 11 }}>No notes yet.</div>
                      ) : (
                        notes.slice(-4).map((note) => (
                          <div key={note.id} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 11, color: C.text }}>{note.content}</div>
                            <div style={{ fontSize: 10, color: C.muted }}>{note.authorRole ?? "STAFF"} · {formatDate(note.createdAt)}</div>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add note" style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "6px 8px", fontFamily: "DM Mono, monospace", fontSize: 11 }} />
                      <button onClick={() => void handleAddNote()} disabled={!noteText.trim()} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer", opacity: noteText.trim() ? 1 : 0.6 }}>Save</button>
                    </div>
                  </div>

                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, padding: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Escalate Thread</div>
                    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 6 }}>
                      <select value={escalationSeverity} onChange={(e) => setEscalationSeverity(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "6px 8px", fontFamily: "DM Mono, monospace", fontSize: 11 }}>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                      <input value={escalationReason} onChange={(e) => setEscalationReason(e.target.value)} placeholder="Reason" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "6px 8px", fontFamily: "DM Mono, monospace", fontSize: 11 }} />
                      <button onClick={() => void handleEscalate()} disabled={!escalationReason.trim()} style={{ background: C.primary, color: C.bg, border: "none", padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: escalationReason.trim() ? 1 : 0.6 }}>Create</button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: 20, color: C.muted, fontSize: 12 }}>Select a conversation to load thread details.</div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "escalations" ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden", minHeight: 0, display: "grid", gridTemplateRows: "auto 1fr" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 100px 110px 140px 1fr auto", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {["Conversation", "Severity", "Status", "Created", "Reason", "Action"].map((h) => <span key={h}>{h}</span>)}
          </div>
          <div style={{ overflow: "auto", minHeight: 0 }}>
            {loadingContext ? (
              <div style={{ padding: 20, color: C.muted, fontSize: 12 }}>Loading escalations...</div>
            ) : escalations.length === 0 ? (
              <div style={{ padding: 20, color: C.muted, fontSize: 12 }}>No escalations recorded for the selected thread.</div>
            ) : (
              escalations.map((item, i) => (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 100px 110px 140px 1fr auto", padding: "12px 20px", borderBottom: i < escalations.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: C.text }}>{selectedConversation?.subject ?? "Conversation"}</div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: toneForSeverity(item.severity) }}>{item.severity}</span>
                  <span style={{ fontSize: 10, color: toneForEscalationStatus(item.status), background: `${toneForEscalationStatus(item.status)}15`, padding: "3px 8px", fontFamily: "DM Mono, monospace", width: "fit-content" }}>{item.status}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{formatDate(item.createdAt)}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{item.reason}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {item.status === "OPEN" ? (
                      <button onClick={() => void handleEscalationStatus(item.id, "ACKNOWLEDGED")} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "6px 8px", fontFamily: "DM Mono, monospace", fontSize: 10, cursor: "pointer" }}>Acknowledge</button>
                    ) : null}
                    {item.status !== "RESOLVED" ? (
                      <button onClick={() => void handleEscalationStatus(item.id, "RESOLVED")} style={{ background: C.primary, color: C.bg, border: "none", padding: "6px 8px", fontFamily: "DM Mono, monospace", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Resolve</button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
