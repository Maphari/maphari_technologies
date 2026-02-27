"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  createConversationWithRefresh,
  createProjectBlockerWithRefresh,
  updateMessageDeliveryWithRefresh,
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
  threadFilter: "all" | "open" | "unread" | "project" | "general";
  setThreadFilter: React.Dispatch<React.SetStateAction<"all" | "open" | "unread" | "project" | "general">>;
  composeMessage: string;
  setComposeMessage: React.Dispatch<React.SetStateAction<string>>;
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
  visibleThreadItems: ClientThread[];
  conversationByProjectId: Map<string, string>;
  selectedConversation: AdminConversation | null;
  selectedThread: ClientThread | null;
  openConversations: AdminConversation[];
  handleClientClick: (id: string) => void;
  handleSendMessage: () => Promise<void>;
  handleCreateThread: () => Promise<void>;
  handleAddNote: () => Promise<void>;
  handleEscalate: () => Promise<void>;
  handleAssignConversationToMe: () => Promise<void>;
  handleUnassignConversation: () => Promise<void>;
  handleCreateTaskFromThread: () => void;
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
  const [threadFilter, setThreadFilter] = useState<"all" | "open" | "unread" | "project" | "general">("all");
  const [composeMessage, setComposeMessage] = useState("");
  const [noteText, setNoteText] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationSeverity, setEscalationSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [newThreadSubject, setNewThreadSubject] = useState("");
  const [newThreadClientId, setNewThreadClientId] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [sentMessageIds, setSentMessageIds] = useState<string[]>([]);

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
      const clientName = clientById.get(conversation.clientId)?.name ?? "Client";
      const projectName = conversation.projectId ? projectById.get(conversation.projectId)?.name : null;
      const paletteItem = palette[index % palette.length];
      const preview =
        conversation.id === selectedConversationId
          ? messagePreview || "No messages yet."
          : "No messages yet.";
      return {
        id: conversation.id,
        name: clientName,
        time: formatRelative(conversation.updatedAt),
        project: projectName ? `${projectName}` : "General",
        preview,
        avatar: { label: getInitials(clientName), bg: paletteItem.bg, color: paletteItem.color },
        unread: conversation.status === "OPEN" && conversation.id !== selectedConversationId
      };
    });
  }, [clientById, conversations, messagePreview, projectById, selectedConversationId]);

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
            : threadItems;
    return scoped;
  }, [threadFilter, threadItems]);

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
    selectConversation(id);
  }, [selectConversation]);

  const handleSendMessage = useCallback(async () => {
    if (!selectedConversationId || !composeMessage.trim()) return;
    const created = await sendMessage(selectedConversationId, composeMessage.trim());
    if (created?.id) {
      setSentMessageIds((prev) => [...prev, created.id]);
      setComposeMessage("");
    }
  }, [composeMessage, selectedConversationId, sendMessage]);

  const handleCreateThread = useCallback(async () => {
    if (!session || creatingThread) return;
    if (!effectiveNewThreadClientId || newThreadSubject.trim().length < 2) {
      setFeedback({ tone: "error", message: "Select a client and provide a thread subject." });
      return;
    }
    setCreatingThread(true);
    const result = await createConversationWithRefresh(session, {
      clientId: effectiveNewThreadClientId,
      subject: newThreadSubject.trim()
    });
    setCreatingThread(false);
    if (!result.data) {
      setFeedback({ tone: "error", message: result.error?.message ?? "Unable to create thread." });
      return;
    }
    setNewThreadSubject("");
    selectConversation(result.data.id);
    await refreshWorkspace(result.nextSession ?? session, { background: true });
    setFeedback({ tone: "success", message: "Thread created." });
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

  const handleAssignConversationToMe = useCallback(async () => {
    if (!selectedConversationId || !session?.user.id) return;
    const updated = await updateConversationAssignee(selectedConversationId, session.user.id);
    setFeedback({
      tone: updated ? "success" : "error",
      message: updated ? "Thread assigned to you." : "Unable to assign thread."
    });
  }, [selectedConversationId, session?.user.id, setFeedback, updateConversationAssignee]);

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
    visibleThreadItems,
    conversationByProjectId,
    selectedConversation,
    selectedThread,
    openConversations,
    handleClientClick,
    handleSendMessage,
    handleCreateThread,
    handleAddNote,
    handleEscalate,
    handleAssignConversationToMe,
    handleUnassignConversation,
    handleCreateTaskFromThread,
    handleOpenConversationTaskContext,
    handleOpenConversationFiles,
    handleOpenDashboardThread,
    handleOpenTaskThread
  };
}
