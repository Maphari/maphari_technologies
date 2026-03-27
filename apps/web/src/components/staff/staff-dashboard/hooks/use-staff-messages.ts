"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  createConversationWithRefresh,
  createProjectBlockerWithRefresh,
  updateMessageDeliveryWithRefresh,
  updateConversationEscalationWithRefresh,
  type AdminConversation,
  type AdminMessage
} from "../../../../lib/api/admin";
import type { ClientThread } from "../types";
import type { PageId } from "../config";
import { formatRelative, getInitials } from "../utils";

type AdminClient = {
  id: string;
  name: string;
};

type AdminProject = {
  id: string;
  name: string;
};

export type UseStaffMessagesReturn = {
  threadSearch: string;
  setThreadSearch: React.Dispatch<React.SetStateAction<string>>;
  threadFilter: "all" | "open" | "unread" | "project" | "general" | "unassigned" | "sla_risk" | "escalated" | "awaiting_client" | "needs_callback";
  setThreadFilter: React.Dispatch<React.SetStateAction<"all" | "open" | "unread" | "project" | "general" | "unassigned" | "sla_risk" | "escalated" | "awaiting_client" | "needs_callback">>;
  composeMessage: string;
  setComposeMessage: React.Dispatch<React.SetStateAction<string>>;
  sendingMessage: boolean;
  lastSendFailed: boolean;
  lastSendError: string | null;
  noteText: string;
  setNoteText: React.Dispatch<React.SetStateAction<string>>;
  escalationReason: string;
  setEscalationReason: React.Dispatch<React.SetStateAction<string>>;
  escalationSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  setEscalationSeverity: React.Dispatch<React.SetStateAction<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">>;
  newThreadSubject: string;
  setNewThreadSubject: React.Dispatch<React.SetStateAction<string>>;
  newThreadClientId: string;
  setNewThreadClientId: React.Dispatch<React.SetStateAction<string>>;
  creatingThread: boolean;
  sentMessageIds: string[];
  effectiveNewThreadClientId: string;
  messagePreview: string;
  allThreadItems: ClientThread[];
  threadItems: ClientThread[];
  threadCounts: { all: number; open: number; unread: number; project: number; general: number };
  queueCounts: { unassigned: number; sla_risk: number; escalated: number; awaiting_client: number; needs_callback: number };
  visibleThreadItems: ClientThread[];
  conversationByProjectId: Map<string, string>;
  selectedConversation: AdminConversation | null;
  selectedThread: ClientThread | null;
  openConversations: AdminConversation[];
  handleClientClick: (id: string) => void;
  handleSendMessage: () => Promise<void>;
  handleRetrySendMessage: () => Promise<void>;
  handleCreateThread: () => Promise<boolean>;
  handleAddNote: () => Promise<void>;
  handleEscalate: () => Promise<void>;
  handleEscalationAcknowledge: (escalationId: string) => Promise<void>;
  handleEscalationResolve: (escalationId: string) => Promise<void>;
  handleEscalationReopen: (escalationId: string) => Promise<void>;
  handleEscalationAssignToMe: (escalationId: string) => Promise<void>;
  handleAssignConversationToMe: () => Promise<void>;
  handleUnassignConversation: () => Promise<void>;
  handleCreateTaskFromThread: () => void;
  handlePrefillFollowUpNote: () => void;
  handleScheduleCallback: () => void;
  handleAutoEscalateSlaBreach: () => Promise<void>;
  handleOpenConversationTaskContext: () => void;
  handleOpenConversationFiles: () => void;
  handleOpenDashboardThread: (threadId: string) => void;
  handleOpenTaskThread: (projectId: string) => void;
};

type Params = {
  session: AuthSession | null;
  conversations: AdminConversation[];
  conversationMessages: AdminMessage[];
  selectedConversationId: string | null;
  topbarSearch: string;
  clients: AdminClient[];
  clientById: Map<string, AdminClient>;
  projectById: Map<string, AdminProject>;
  setFeedback: (feedback: { tone: "success" | "error" | "warning" | "info"; message: string }) => void;
  setActivePage: React.Dispatch<React.SetStateAction<PageId>>;
  setShowTaskComposer: React.Dispatch<React.SetStateAction<boolean>>;
  setNewTaskDraft: React.Dispatch<React.SetStateAction<{ projectId: string; title: string; assigneeName: string; dueAt: string }>>;
  selectConversation: (id: string) => void;
  sendMessage: (conversationId: string, content: string) => Promise<{ id: string } | null>;
  addConversationNote: (conversationId: string, content: string) => Promise<{ id: string } | null>;
  escalateConversation: (params: {
    conversationId: string;
    messageId?: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reason: string;
  }) => Promise<{ id: string } | null>;
  updateConversationAssignee: (conversationId: string, userId: string | null) => Promise<boolean>;
  refreshWorkspace: (session: AuthSession, opts?: { background?: boolean }) => Promise<void>;
  staffName: string;
};

export function useStaffMessages({
  session,
  conversations,
  conversationMessages,
  selectedConversationId,
  topbarSearch,
  clients,
  clientById,
  projectById,
  setFeedback,
  setActivePage,
  setShowTaskComposer,
  setNewTaskDraft,
  selectConversation,
  sendMessage,
  addConversationNote,
  escalateConversation,
  updateConversationAssignee,
  refreshWorkspace,
  staffName
}: Params): UseStaffMessagesReturn {
  const [threadSearch, setThreadSearch] = useState("");
  const [threadFilter, setThreadFilter] = useState<"all" | "open" | "unread" | "project" | "general" | "unassigned" | "sla_risk" | "escalated" | "awaiting_client" | "needs_callback">("all");
  const [composeMessage, setComposeMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [lastSendFailed, setLastSendFailed] = useState(false);
  const [lastSendError, setLastSendError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationSeverity, setEscalationSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [newThreadSubject, setNewThreadSubject] = useState("");
  const [newThreadClientId, setNewThreadClientId] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [sentMessageIds, setSentMessageIds] = useState<string[]>([]);
  const [nowMs, setNowMs] = useState(() => new Date().getTime());
  const draftKey = selectedConversationId ? `staff.thread.compose.${selectedConversationId}` : null;

  const searchQuery = topbarSearch.trim().toLowerCase();
  const effectiveNewThreadClientId = newThreadClientId || clients[0]?.id || "";

  // ─── Auto-mark inbound CLIENT messages read ───
  useEffect(() => {
    if (!session || !selectedConversationId || conversationMessages.length === 0) return;
    const inbound = conversationMessages
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
  }, [conversationMessages, selectedConversationId, session]);

  const messagePreview = useMemo(() => {
    if (!selectedConversationId) return "";
    const last = conversationMessages[conversationMessages.length - 1];
    return last?.content ?? "";
  }, [conversationMessages, selectedConversationId]);

  const allThreadItems = useMemo<ClientThread[]>(() => {
    const palette = [
      { bg: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" },
      { bg: "rgba(245,166,35,0.15)", color: "var(--amber)" },
      { bg: "rgba(167,139,250,0.15)", color: "var(--purple)" },
      { bg: "rgba(52,217,139,0.12)", color: "var(--green)" }
    ];
    return conversations.map((conversation, index) => {
      const subjectLower = (conversation.subject ?? "").toLowerCase();
      const activityType: ClientThread["activityType"] =
        subjectLower.includes("call") || subjectLower.includes("voicemail")
          ? "call"
          : subjectLower.includes("escalat")
            ? "escalation"
            : subjectLower.includes("note")
              ? "note"
              : "message";
      const activityStatus: ClientThread["activityStatus"] =
        subjectLower.includes("missed")
          ? "MISSED"
          : subjectLower.includes("callback")
            ? "CALLBACK_NEEDED"
            : subjectLower.includes("escalat")
              ? "ESCALATED"
              : activityType === "call"
                ? "COMPLETED"
                : null;
      const clientName = clientById.get(conversation.clientId)?.name ?? "Client";
      const projectName = conversation.projectId ? projectById.get(conversation.projectId)?.name : null;
      const paletteItem = palette[index % palette.length];
      const preview = conversation.id === selectedConversationId
        ? (messagePreview || conversation.subject || "No messages yet.")
        : (conversation.subject || "No subject");
      return {
        id: conversation.id,
        name: clientName,
        time: formatRelative(conversation.updatedAt),
        project: projectName ? `${projectName}` : "General",
        preview,
        activityType,
        activityStatus,
        avatar: { label: getInitials(clientName), bg: paletteItem.bg, color: paletteItem.color },
        unread: conversation.status === "OPEN" && conversation.id !== selectedConversationId
      };
    });
  }, [clientById, conversations, messagePreview, projectById, selectedConversationId]);

  const conversationById = useMemo(() => {
    const map = new Map<string, AdminConversation>();
    conversations.forEach((conversation) => map.set(conversation.id, conversation));
    return map;
  }, [conversations]);

  const threadItems = useMemo<ClientThread[]>(() => {
    const q = [searchQuery, threadSearch.trim().toLowerCase()].filter(Boolean).join(" ");
    if (!q) return allThreadItems;
    return allThreadItems.filter((thread) => {
      return (
        thread.name.toLowerCase().includes(q) ||
        thread.project.toLowerCase().includes(q) ||
        thread.preview.toLowerCase().includes(q)
      );
    });
  }, [allThreadItems, searchQuery, threadSearch]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(new Date().getTime()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const queueFlagsByThreadId = useMemo(() => {
    const flags = new Map<string, {
      unassigned: boolean;
      sla_risk: boolean;
      escalated: boolean;
      awaiting_client: boolean;
      needs_callback: boolean;
    }>();
    allThreadItems.forEach((thread) => {
      const conversation = conversationById.get(thread.id);
      const subject = (conversation?.subject ?? "").toLowerCase();
      const updatedAtMs = conversation ? new Date(conversation.updatedAt).getTime() : nowMs;
      const ageHours = Number.isFinite(updatedAtMs) ? Math.max(0, (nowMs - updatedAtMs) / 3_600_000) : 0;
      const unassigned = !conversation?.assigneeUserId;
      const needsCallback = /\b(callback|missed call|return call)\b/i.test(subject);
      const escalated = /\bescalat/i.test(subject) || thread.activityStatus === "ESCALATED";
      const slaRisk = ageHours > 24 && (conversation?.status ?? "").toUpperCase() === "OPEN";
      const awaitingClient = !unassigned && !slaRisk && !needsCallback && (conversation?.status ?? "").toUpperCase() === "OPEN";
      flags.set(thread.id, {
        unassigned,
        sla_risk: slaRisk,
        escalated,
        awaiting_client: awaitingClient,
        needs_callback: needsCallback
      });
    });
    return flags;
  }, [allThreadItems, conversationById, nowMs]);

  const queueCounts = useMemo(() => {
    const counts = { unassigned: 0, sla_risk: 0, escalated: 0, awaiting_client: 0, needs_callback: 0 };
    queueFlagsByThreadId.forEach((flag) => {
      if (flag.unassigned) counts.unassigned += 1;
      if (flag.sla_risk) counts.sla_risk += 1;
      if (flag.escalated) counts.escalated += 1;
      if (flag.awaiting_client) counts.awaiting_client += 1;
      if (flag.needs_callback) counts.needs_callback += 1;
    });
    return counts;
  }, [queueFlagsByThreadId]);

  const threadCounts = useMemo(
    () => ({
      all: allThreadItems.length,
      open: allThreadItems.filter((thread) => thread.unread).length,
      unread: allThreadItems.filter((thread) => thread.unread).length,
      project: allThreadItems.filter((thread) => thread.project !== "General").length,
      general: allThreadItems.filter((thread) => thread.project === "General").length
    }),
    [allThreadItems]
  );

  const visibleThreadItems = useMemo(() => {
    const scoped =
      threadFilter === "open" || threadFilter === "unread"
        ? threadItems.filter((thread) => thread.unread)
        : threadFilter === "project"
          ? threadItems.filter((thread) => thread.project !== "General")
          : threadFilter === "general"
            ? threadItems.filter((thread) => thread.project === "General")
            : threadFilter === "unassigned"
              ? threadItems.filter((thread) => queueFlagsByThreadId.get(thread.id)?.unassigned)
              : threadFilter === "sla_risk"
                ? threadItems.filter((thread) => queueFlagsByThreadId.get(thread.id)?.sla_risk)
                : threadFilter === "escalated"
                  ? threadItems.filter((thread) => queueFlagsByThreadId.get(thread.id)?.escalated)
                  : threadFilter === "awaiting_client"
                    ? threadItems.filter((thread) => queueFlagsByThreadId.get(thread.id)?.awaiting_client)
                    : threadFilter === "needs_callback"
                      ? threadItems.filter((thread) => queueFlagsByThreadId.get(thread.id)?.needs_callback)
            : threadItems;
    return scoped;
  }, [queueFlagsByThreadId, threadFilter, threadItems]);

  const conversationByProjectId = useMemo(() => {
    const map = new Map<string, string>();
    conversations.forEach((conversation) => {
      if (!conversation.projectId) return;
      if (!map.has(conversation.projectId)) {
        map.set(conversation.projectId, conversation.id);
      }
    });
    return map;
  }, [conversations]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const selectedThread = useMemo(
    () => allThreadItems.find((thread) => thread.id === selectedConversationId) ?? null,
    [allThreadItems, selectedConversationId]
  );

  const openConversations = useMemo(() => conversations.filter((thread) => thread.status === "OPEN"), [conversations]);

  // ─── Handlers ───

  const handleClientClick = useCallback((id: string) => {
    try {
      const saved = localStorage.getItem(`staff.thread.compose.${id}`);
      setComposeMessage(saved ?? "");
    } catch {
      setComposeMessage("");
    }
    selectConversation(id);
  }, [selectConversation]);

  const handleSendMessage = useCallback(async () => {
    if (!selectedConversationId || !composeMessage.trim()) return;
    setSendingMessage(true);
    setLastSendFailed(false);
    setLastSendError(null);
    const created = await sendMessage(selectedConversationId, composeMessage.trim());
    if (created?.id) {
      setSentMessageIds((prev) => [...prev, created.id]);
      setComposeMessage("");
      if (draftKey) {
        try { localStorage.removeItem(draftKey); } catch { /* noop */ }
      }
    } else {
      setLastSendFailed(true);
      setLastSendError("Message failed to send. Check connection and retry.");
    }
    setSendingMessage(false);
  }, [composeMessage, draftKey, selectedConversationId, sendMessage]);

  const handleRetrySendMessage = useCallback(async () => {
    await handleSendMessage();
  }, [handleSendMessage]);

  const handleCreateThread = useCallback(async () => {
    if (!session || creatingThread) return false;
    if (!effectiveNewThreadClientId || newThreadSubject.trim().length < 2) {
      setFeedback({ tone: "error", message: "Select a client and provide a thread subject." });
      return false;
    }
    setCreatingThread(true);
    const result = await createConversationWithRefresh(session, {
      clientId: effectiveNewThreadClientId,
      subject: newThreadSubject.trim()
    });
    setCreatingThread(false);
    if (!result.data) {
      setFeedback({ tone: "error", message: result.error?.message ?? "Unable to create thread." });
      return false;
    }
    setNewThreadSubject("");
    selectConversation(result.data.id);
    await refreshWorkspace(result.nextSession ?? session, { background: true });
    setFeedback({ tone: "success", message: "Thread created." });
    return true;
  }, [creatingThread, effectiveNewThreadClientId, newThreadSubject, refreshWorkspace, selectConversation, session, setFeedback]);

  const handleAddNote = useCallback(async () => {
    if (!selectedConversationId || !noteText.trim()) return;
    const created = await addConversationNote(selectedConversationId, noteText.trim());
    if (created?.id) {
      setNoteText("");
    }
  }, [addConversationNote, noteText, selectedConversationId]);

  const handleEscalate = useCallback(async () => {
    if (!selectedConversationId || !escalationReason.trim()) return;
    const latestMessageId = conversationMessages[conversationMessages.length - 1]?.id;
    const reason = escalationReason.trim();
    const created = await escalateConversation({
      conversationId: selectedConversationId,
      messageId: latestMessageId,
      severity: escalationSeverity,
      reason
    });
    if (created?.id) {
      const conversationProjectId =
        conversations.find((conversation) => conversation.id === selectedConversationId)?.projectId ?? null;
      if (session && conversationProjectId) {
        await createProjectBlockerWithRefresh(session, {
          projectId: conversationProjectId,
          title: reason,
          description: `Auto-created from conversation escalation (${escalationSeverity})`,
          severity: escalationSeverity,
          status: "OPEN",
          ownerRole: "STAFF",
          ownerName: staffName
        });
      }
      setEscalationReason("");
      setEscalationSeverity("MEDIUM");
    }
  }, [conversationMessages, conversations, escalateConversation, escalationReason, escalationSeverity, selectedConversationId, session, staffName]);

  const handleEscalationAcknowledge = useCallback(async (escalationId: string) => {
    if (!session || !escalationId) return;
    const result = await updateConversationEscalationWithRefresh(session, escalationId, {
      status: "ACKNOWLEDGED",
      ownerAdminId: session.user.id
    });
    if (result.nextSession) {
      await refreshWorkspace(result.nextSession, { background: true });
    }
    setFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Escalation acknowledged." : result.error?.message ?? "Unable to acknowledge escalation."
    });
  }, [refreshWorkspace, session, setFeedback]);

  const handleEscalationResolve = useCallback(async (escalationId: string) => {
    if (!session || !escalationId) return;
    const result = await updateConversationEscalationWithRefresh(session, escalationId, {
      status: "RESOLVED",
      ownerAdminId: session.user.id,
      resolvedAt: new Date().toISOString()
    });
    if (result.nextSession) {
      await refreshWorkspace(result.nextSession, { background: true });
    }
    setFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Escalation resolved." : result.error?.message ?? "Unable to resolve escalation."
    });
  }, [refreshWorkspace, session, setFeedback]);

  const handleEscalationReopen = useCallback(async (escalationId: string) => {
    if (!session || !escalationId) return;
    const result = await updateConversationEscalationWithRefresh(session, escalationId, {
      status: "OPEN"
    });
    if (result.nextSession) {
      await refreshWorkspace(result.nextSession, { background: true });
    }
    setFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Escalation reopened." : result.error?.message ?? "Unable to reopen escalation."
    });
  }, [refreshWorkspace, session, setFeedback]);

  const handleEscalationAssignToMe = useCallback(async (escalationId: string) => {
    if (!session || !escalationId) return;
    const result = await updateConversationEscalationWithRefresh(session, escalationId, {
      ownerAdminId: session.user.id
    });
    if (result.nextSession) {
      await refreshWorkspace(result.nextSession, { background: true });
    }
    setFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Escalation assigned to you." : result.error?.message ?? "Unable to assign escalation."
    });
  }, [refreshWorkspace, session, setFeedback]);

  const handleAssignConversationToMe = useCallback(async () => {
    if (!selectedConversationId || !session?.user.id) return;
    const updated = await updateConversationAssignee(selectedConversationId, session.user.id);
    setFeedback({
      tone: updated ? "success" : "error",
      message: updated ? "Thread assigned to you." : "Unable to assign thread."
    });
  }, [selectedConversationId, session, setFeedback, updateConversationAssignee]);

  const handleUnassignConversation = useCallback(async () => {
    if (!selectedConversationId) return;
    const updated = await updateConversationAssignee(selectedConversationId, null);
    setFeedback({
      tone: updated ? "success" : "error",
      message: updated ? "Thread unassigned." : "Unable to unassign thread."
    });
  }, [selectedConversationId, setFeedback, updateConversationAssignee]);

  const handleCreateTaskFromThread = useCallback(() => {
    const conversation = conversations.find((item) => item.id === selectedConversationId);
    if (!conversation?.projectId) {
      setFeedback({ tone: "error", message: "This thread is not linked to a project yet." });
      return;
    }
    setActivePage("tasks");
    setShowTaskComposer(true);
    setNewTaskDraft((previous) => ({
      ...previous,
      projectId: conversation.projectId ?? previous.projectId,
      title: `Thread action: ${conversation.subject}`
    }));
  }, [conversations, selectedConversationId, setFeedback, setActivePage, setNewTaskDraft, setShowTaskComposer]);

  const handlePrefillFollowUpNote = useCallback(() => {
    if (!selectedConversationId) return;
    const conversation = conversations.find((item) => item.id === selectedConversationId);
    const subject = conversation?.subject ? ` (${conversation.subject})` : "";
    setNoteText(`Follow-up required${subject}: `);
    setFeedback({ tone: "info", message: "Follow-up note template added in Internal Notes." });
  }, [conversations, selectedConversationId, setFeedback, setNoteText]);

  const handleScheduleCallback = useCallback(() => {
    if (!selectedConversationId) return;
    setActivePage("appointments");
    setFeedback({ tone: "info", message: "Open Appointments to schedule callback." });
  }, [selectedConversationId, setActivePage, setFeedback]);

  const handleAutoEscalateSlaBreach = useCallback(async () => {
    if (!selectedConversationId) return;
    const latestMessageId = conversationMessages[conversationMessages.length - 1]?.id;
    const reason = "Automatic escalation: SLA breach detected on thread response workflow.";
    const created = await escalateConversation({
      conversationId: selectedConversationId,
      messageId: latestMessageId,
      severity: "HIGH",
      reason
    });
    setFeedback({
      tone: created?.id ? "warning" : "error",
      message: created?.id ? "SLA breach escalation created." : "Unable to auto-escalate SLA breach."
    });
  }, [conversationMessages, escalateConversation, selectedConversationId, setFeedback]);

  useEffect(() => {
    if (!draftKey) return;
    try {
      if (composeMessage.trim().length === 0) {
        localStorage.removeItem(draftKey);
      } else {
        localStorage.setItem(draftKey, composeMessage);
      }
    } catch {
      // ignore storage errors
    }
  }, [composeMessage, draftKey]);

  const handleOpenConversationTaskContext = useCallback(() => {
    const conversation = conversations.find((item) => item.id === selectedConversationId);
    if (!conversation?.projectId) {
      setFeedback({ tone: "error", message: "This thread is not linked to a project yet." });
      return;
    }
    setActivePage("tasks");
    setShowTaskComposer(true);
    setNewTaskDraft((previous) => ({
      ...previous,
      projectId: conversation.projectId ?? previous.projectId,
      title: previous.title || `Follow-up: ${conversation.subject}`
    }));
  }, [conversations, selectedConversationId, setFeedback, setActivePage, setNewTaskDraft, setShowTaskComposer]);

  const handleOpenConversationFiles = useCallback(() => {
    const conversation = conversations.find((item) => item.id === selectedConversationId);
    if (!conversation?.projectId) {
      setFeedback({ tone: "error", message: "Link this thread to a project before adding files." });
      return;
    }
    setActivePage("deliverables");
    setFeedback({ tone: "success", message: "Open Deliverables to attach files to this project." });
  }, [conversations, selectedConversationId, setFeedback, setActivePage]);

  const handleOpenDashboardThread = useCallback((threadId: string) => {
    setActivePage("clients");
    selectConversation(threadId);
  }, [selectConversation, setActivePage]);

  const handleOpenTaskThread = useCallback((projectId: string) => {
    const conversationId = conversationByProjectId.get(projectId);
    if (!conversationId) {
      setFeedback({ tone: "error", message: "No client thread is linked to this project yet." });
      return;
    }
    setActivePage("clients");
    selectConversation(conversationId);
  }, [conversationByProjectId, selectConversation, setFeedback, setActivePage]);

  return {
    threadSearch,
    setThreadSearch,
    threadFilter,
    setThreadFilter,
    composeMessage,
    setComposeMessage,
    sendingMessage,
    lastSendFailed,
    lastSendError,
    noteText,
    setNoteText,
    escalationReason,
    setEscalationReason,
    escalationSeverity,
    setEscalationSeverity,
    newThreadSubject,
    setNewThreadSubject,
    newThreadClientId,
    setNewThreadClientId,
    creatingThread,
    sentMessageIds,
    effectiveNewThreadClientId,
    messagePreview,
    allThreadItems,
    threadItems,
    threadCounts,
    queueCounts,
    visibleThreadItems,
    conversationByProjectId,
    selectedConversation,
    selectedThread,
    openConversations,
    handleClientClick,
    handleSendMessage,
    handleRetrySendMessage,
    handleCreateThread,
    handleAddNote,
    handleEscalate,
    handleEscalationAcknowledge,
    handleEscalationResolve,
    handleEscalationReopen,
    handleEscalationAssignToMe,
    handleAssignConversationToMe,
    handleUnassignConversation,
    handleCreateTaskFromThread,
    handlePrefillFollowUpNote,
    handleScheduleCallback,
    handleAutoEscalateSlaBreach,
    handleOpenConversationTaskContext,
    handleOpenConversationFiles,
    handleOpenDashboardThread,
    handleOpenTaskThread
  };
}
