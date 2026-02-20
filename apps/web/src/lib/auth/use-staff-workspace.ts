"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createConversationEscalationWithRefresh,
  createConversationNoteWithRefresh,
  createMessageWithRefresh,
  createTimeEntryWithRefresh,
  loadConversationEscalationsWithRefresh,
  loadConversationNotesWithRefresh,
  loadAdminSnapshotWithRefresh,
  loadConversationsWithRefresh,
  loadFilesWithRefresh,
  loadMessagesWithRefresh,
  loadTimeEntriesWithRefresh,
  updateConversationAssigneeWithRefresh,
  type AdminConversation,
  type ConversationEscalation,
  type ConversationNote,
  type AdminFileRecord,
  type AdminMessage,
  type AdminSnapshot,
  type ProjectTimeEntry
} from "../api/admin";
import { login, logout, refresh } from "../api/gateway";
import { clearSession, loadSession, saveSession, type AuthSession } from "./session";
import { useRealtimeRefresh } from "./use-realtime-refresh";

function emptySnapshot(): AdminSnapshot {
  return { clients: [], projects: [], leads: [], invoices: [], payments: [] };
}

export interface StaffWorkspaceState {
  session: AuthSession | null;
  snapshot: AdminSnapshot;
  conversations: AdminConversation[];
  conversationNotes: ConversationNote[];
  conversationEscalations: ConversationEscalation[];
  files: AdminFileRecord[];
  timeEntries: ProjectTimeEntry[];
  selectedConversationId: string | null;
  conversationMessages: AdminMessage[];
  loading: boolean;
  messagesLoading: boolean;
  error: string | null;
}

/**
 * Staff-specific auth + data lifecycle. Keeps staff workloads, client threads,
 * and project context isolated from admin-only workflows.
 */
export function useStaffWorkspace() {
  const initialSession = useMemo(() => loadSession(), []);
  const [bootstrapAttempted, setBootstrapAttempted] = useState(Boolean(initialSession));
  const [state, setState] = useState<StaffWorkspaceState>({
    session: initialSession,
    snapshot: emptySnapshot(),
    conversations: [],
    conversationNotes: [],
    conversationEscalations: [],
    files: [],
    timeEntries: [],
    selectedConversationId: null,
    conversationMessages: [],
    loading: !initialSession,
    messagesLoading: false,
    error: null
  });

  const applySignedOutState = useCallback((message?: string) => {
    clearSession();
    setState({
      session: null,
      snapshot: emptySnapshot(),
      conversations: [],
      conversationNotes: [],
      conversationEscalations: [],
      files: [],
      timeEntries: [],
      selectedConversationId: null,
      conversationMessages: [],
      loading: false,
      messagesLoading: false,
      error: message ?? null
    });
  }, []);

  const refreshWorkspace = useCallback(async (
    sessionOverride?: AuthSession,
    options: { background?: boolean } = {}
  ) => {
    const currentSession = sessionOverride ?? state.session;
    if (!currentSession) return;

    if (!options.background) {
      setState((previous) => ({ ...previous, loading: true, error: null }));
    } else {
      setState((previous) => ({ ...previous, error: null }));
    }

    const snapshotResult = await loadAdminSnapshotWithRefresh(currentSession);
    if (!snapshotResult.nextSession) {
      applySignedOutState(snapshotResult.error?.message ?? "Session expired. Please sign in again.");
      return;
    }

    let activeSession = snapshotResult.nextSession;
    saveSession(activeSession);

    const conversationResult = await loadConversationsWithRefresh(activeSession);
    if (!conversationResult.nextSession) {
      applySignedOutState(conversationResult.error?.message ?? "Session expired. Please sign in again.");
      return;
    }
    activeSession = conversationResult.nextSession;
    saveSession(activeSession);

    const filesResult = await loadFilesWithRefresh(activeSession);
    if (!filesResult.nextSession) {
      applySignedOutState(filesResult.error?.message ?? "Session expired. Please sign in again.");
      return;
    }
    activeSession = filesResult.nextSession;
    saveSession(activeSession);

    const timeEntriesResult = await loadTimeEntriesWithRefresh(activeSession);
    if (!timeEntriesResult.nextSession) {
      applySignedOutState(timeEntriesResult.error?.message ?? "Session expired. Please sign in again.");
      return;
    }
    activeSession = timeEntriesResult.nextSession;
    saveSession(activeSession);

    const snapshot = snapshotResult.data ?? emptySnapshot();
    const conversations = conversationResult.data ?? [];
    const files = filesResult.data ?? [];
    const timeEntries = timeEntriesResult.data ?? [];
    const nextConversationId = conversations[0]?.id ?? null;

    setState((previous) => ({
      ...previous,
      session: activeSession,
      snapshot,
      conversations,
      files,
      timeEntries,
      selectedConversationId: previous.selectedConversationId ?? nextConversationId,
      conversationMessages: previous.selectedConversationId ? previous.conversationMessages : [],
      loading: options.background ? previous.loading : false,
      error:
        snapshotResult.error?.message ??
        conversationResult.error?.message ??
        filesResult.error?.message ??
        timeEntriesResult.error?.message ??
        null
    }));
  }, [applySignedOutState, state.session]);

  const refreshConversationMessages = useCallback(async (
    conversationId: string,
    sessionOverride?: AuthSession,
    options: { background?: boolean } = {}
  ) => {
    const currentSession = sessionOverride ?? state.session;
    if (!currentSession) return;

    if (!options.background) {
      setState((previous) => ({ ...previous, messagesLoading: true, error: null }));
    } else {
      setState((previous) => ({ ...previous, error: null }));
    }
    const result = await loadMessagesWithRefresh(currentSession, conversationId);

    if (!result.nextSession) {
      applySignedOutState(result.error?.message ?? "Session expired. Please sign in again.");
      return;
    }

    saveSession(result.nextSession);
    setState((previous) => ({
      ...previous,
      session: result.nextSession,
      conversationMessages: result.data ?? [],
      messagesLoading: options.background ? previous.messagesLoading : false,
      error: result.error?.message ?? null
    }));
  }, [applySignedOutState, state.session]);

  const refreshConversationContext = useCallback(async (
    conversationId: string,
    sessionOverride?: AuthSession,
    options: { background?: boolean } = {}
  ) => {
    const currentSession = sessionOverride ?? state.session;
    if (!currentSession) return;
    if (!options.background) {
      setState((previous) => ({ ...previous, error: null }));
    }
    const [notesResult, escalationsResult] = await Promise.all([
      loadConversationNotesWithRefresh(currentSession, conversationId),
      loadConversationEscalationsWithRefresh(currentSession, { conversationId })
    ]);
    const nextSession = notesResult.nextSession ?? escalationsResult.nextSession;
    if (!nextSession) {
      applySignedOutState(notesResult.error?.message ?? escalationsResult.error?.message ?? "Session expired. Please sign in again.");
      return;
    }
    saveSession(nextSession);
    setState((previous) => ({
      ...previous,
      session: nextSession,
      conversationNotes: notesResult.data ?? [],
      conversationEscalations: escalationsResult.data ?? [],
      error: notesResult.error?.message ?? escalationsResult.error?.message ?? null
    }));
  }, [applySignedOutState, state.session]);

  useEffect(() => {
    if (state.session || bootstrapAttempted) return;
    void (async () => {
      setBootstrapAttempted(true);
      setState((previous) => ({ ...previous, loading: true }));
      const refreshed = await refresh();
      if (!refreshed.success || !refreshed.data) {
        setState((previous) => ({ ...previous, loading: false }));
        return;
      }

      const nextSession = refreshed.data as AuthSession;
      saveSession(nextSession);
      setState((previous) => ({
        ...previous,
        session: nextSession,
        loading: false,
        error: null
      }));
    })();
  }, [bootstrapAttempted, state.session]);

  useEffect(() => {
    if (!state.session) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void refreshWorkspace(state.session ?? undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshWorkspace, state.session]);

  useEffect(() => {
    if (!state.session || !state.selectedConversationId) return;
    const conversationId = state.selectedConversationId;
    const currentSession = state.session;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void refreshConversationMessages(conversationId, currentSession);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshConversationMessages, state.selectedConversationId, state.session]);

  useEffect(() => {
    if (!state.session || !state.selectedConversationId) return;
    const conversationId = state.selectedConversationId;
    const currentSession = state.session;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void refreshConversationContext(conversationId, currentSession);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshConversationContext, state.selectedConversationId, state.session]);

  const signIn = useCallback(async (email: string) => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    const response = await login(email);

    if (!response.success || !response.data) {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: response.error?.message ?? "Login failed."
      }));
      return false;
    }

    const nextSession = response.data;
    saveSession(nextSession);
    setState((previous) => ({
      ...previous,
      session: nextSession,
      loading: false,
      error: null
    }));
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    applySignedOutState();
  }, [applySignedOutState]);

  const selectConversation = useCallback((conversationId: string) => {
    setState((previous) => ({
      ...previous,
      selectedConversationId: conversationId,
      conversationMessages: [],
      conversationNotes: [],
      conversationEscalations: []
    }));
  }, []);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    const currentSession = state.session;
    if (!currentSession) return null;

    const result = await createMessageWithRefresh(currentSession, { conversationId, content });
    if (!result.nextSession) {
      applySignedOutState(result.error?.message ?? "Session expired. Please sign in again.");
      return null;
    }

    saveSession(result.nextSession);
    if (!result.data) {
      setState((previous) => ({
        ...previous,
        session: result.nextSession,
        error: result.error?.message ?? "Unable to send message."
      }));
      return null;
    }

    const message = result.data;
    setState((previous) => ({
      ...previous,
      session: result.nextSession,
      conversationMessages: [...previous.conversationMessages, message]
    }));

    return message;
  }, [applySignedOutState, state.session]);

  const addTimeEntry = useCallback(async (input: {
    projectId: string;
    taskLabel: string;
    minutes: number;
    startedAt?: string;
    endedAt?: string;
    staffName?: string;
  }) => {
    const currentSession = state.session;
    if (!currentSession) return null;

    const result = await createTimeEntryWithRefresh(currentSession, input);
    if (!result.nextSession) {
      applySignedOutState(result.error?.message ?? "Session expired. Please sign in again.");
      return null;
    }

    saveSession(result.nextSession);
    if (!result.data) {
      setState((previous) => ({
        ...previous,
        session: result.nextSession,
        error: result.error?.message ?? "Unable to create time entry."
      }));
      return null;
    }

    const createdEntry = result.data;
    setState((previous) => ({
      ...previous,
      session: result.nextSession,
      timeEntries: [createdEntry, ...previous.timeEntries]
    }));

    return createdEntry;
  }, [applySignedOutState, state.session]);

  const addConversationNote = useCallback(async (conversationId: string, content: string) => {
    const currentSession = state.session;
    if (!currentSession) return null;

    const result = await createConversationNoteWithRefresh(currentSession, { conversationId, content });
    if (!result.nextSession) {
      applySignedOutState(result.error?.message ?? "Session expired. Please sign in again.");
      return null;
    }
    saveSession(result.nextSession);
    if (!result.data) {
      setState((previous) => ({ ...previous, session: result.nextSession, error: result.error?.message ?? "Unable to create note." }));
      return null;
    }
    const note = result.data;
    setState((previous) => ({
      ...previous,
      session: result.nextSession,
      conversationNotes: [...previous.conversationNotes, note]
    }));
    return note;
  }, [applySignedOutState, state.session]);

  const escalateConversation = useCallback(async (input: {
    conversationId: string;
    messageId?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reason: string;
  }) => {
    const currentSession = state.session;
    if (!currentSession) return null;

    const result = await createConversationEscalationWithRefresh(currentSession, input);
    if (!result.nextSession) {
      applySignedOutState(result.error?.message ?? "Session expired. Please sign in again.");
      return null;
    }
    saveSession(result.nextSession);
    if (!result.data) {
      setState((previous) => ({ ...previous, session: result.nextSession, error: result.error?.message ?? "Unable to escalate conversation." }));
      return null;
    }
    const escalation = result.data;
    setState((previous) => ({
      ...previous,
      session: result.nextSession,
      conversationEscalations: [escalation, ...previous.conversationEscalations]
    }));
    return escalation;
  }, [applySignedOutState, state.session]);

  const updateConversationAssignee = useCallback(async (conversationId: string, assigneeUserId: string | null) => {
    const currentSession = state.session;
    if (!currentSession) return null;
    const result = await updateConversationAssigneeWithRefresh(currentSession, conversationId, { assigneeUserId });
    if (!result.nextSession) {
      applySignedOutState(result.error?.message ?? "Session expired. Please sign in again.");
      return null;
    }
    saveSession(result.nextSession);
    if (!result.data) {
      setState((previous) => ({
        ...previous,
        session: result.nextSession,
        error: result.error?.message ?? "Unable to update conversation assignment."
      }));
      return null;
    }
    const updatedConversation = result.data;
    setState((previous) => ({
      ...previous,
      session: result.nextSession,
      conversations: previous.conversations.map((conversation) =>
        conversation.id === conversationId ? updatedConversation : conversation
      )
    }));
    return updatedConversation;
  }, [applySignedOutState, state.session]);

  const handleRealtimeRefresh = useCallback(() => {
    if (!state.session) return;
    void refreshWorkspace(state.session, { background: true });
    if (state.selectedConversationId) {
      void refreshConversationMessages(state.selectedConversationId, state.session, { background: true });
      void refreshConversationContext(state.selectedConversationId, state.session, { background: true });
    }
  }, [
    refreshConversationContext,
    refreshConversationMessages,
    refreshWorkspace,
    state.selectedConversationId,
    state.session
  ]);

  useRealtimeRefresh(state.session, handleRealtimeRefresh);

  return {
    ...state,
    signIn,
    signOut,
    refreshWorkspace,
    refreshConversationMessages,
    refreshConversationContext,
    selectConversation,
    sendMessage,
    addTimeEntry,
    addConversationNote,
    escalateConversation,
    updateConversationAssignee
  };
}
