"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPortalMessageWithRefresh,
  loadConversationMessagesWithRefresh,
  loadPortalSnapshotWithRefresh,
  uploadPortalFileWithRefresh,
  type PortalMessage,
  type PortalSnapshot
} from "../api/portal";
import { login, logout, refresh } from "../api/gateway";
import { clearSession, loadSession, saveSession, type AuthSession } from "./session";
import { useRealtimeRefresh } from "./use-realtime-refresh";

function emptySnapshot(): PortalSnapshot {
  return { conversations: [], files: [], invoices: [], payments: [], projects: [] };
}

export interface PortalWorkspaceState {
  session: AuthSession | null;
  snapshot: PortalSnapshot;
  selectedConversationId: string | null;
  conversationMessages: PortalMessage[];
  loading: boolean;
  messagesLoading: boolean;
  uploadState: "idle" | "uploading" | "success" | "error";
  uploadMessage: string | null;
  error: string | null;
}

/**
 * Portal-specific auth and data lifecycle. Keeps chat/files/billing loading
 * behavior isolated from other workspace surfaces.
 */
export function usePortalWorkspace() {
  const initialSession = useMemo(() => loadSession(), []);
  const [bootstrapAttempted, setBootstrapAttempted] = useState(Boolean(initialSession));
  const [state, setState] = useState<PortalWorkspaceState>({
    session: initialSession,
    snapshot: emptySnapshot(),
    selectedConversationId: null,
    conversationMessages: [],
    loading: !initialSession,
    messagesLoading: false,
    uploadState: "idle",
    uploadMessage: null,
    error: null
  });

  const applySignedOutState = useCallback((message?: string) => {
    clearSession();
    setState({
      session: null,
      snapshot: emptySnapshot(),
      selectedConversationId: null,
      conversationMessages: [],
      loading: false,
      messagesLoading: false,
      uploadState: "idle",
      uploadMessage: null,
      error: message ?? null
    });
  }, []);

  const refreshSnapshot = useCallback(async (
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
    const result = await loadPortalSnapshotWithRefresh(currentSession);

    if (!result.nextSession) {
      applySignedOutState(result.error?.message ?? "Session expired. Please sign in again.");
      return;
    }

    saveSession(result.nextSession);
    const snapshot = result.data ?? emptySnapshot();
    const nextConversationId = snapshot.conversations[0]?.id ?? null;

    setState((previous) => ({
      ...previous,
      session: result.nextSession,
      snapshot,
      selectedConversationId: previous.selectedConversationId ?? nextConversationId,
      conversationMessages: previous.selectedConversationId ? previous.conversationMessages : [],
      loading: options.background ? previous.loading : false,
      uploadState: previous.uploadState,
      uploadMessage: previous.uploadMessage,
      error: result.error?.message ?? null
    }));
  }, [applySignedOutState, state.session]);

  const session = state.session;
  const selectedConversationId = state.selectedConversationId;

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
    const result = await loadConversationMessagesWithRefresh(currentSession, conversationId);

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
      uploadState: previous.uploadState,
      uploadMessage: previous.uploadMessage,
      error: result.error?.message ?? null
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
    if (!session) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void refreshSnapshot(session);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshSnapshot, session]);

  useEffect(() => {
    if (!session || !selectedConversationId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void refreshConversationMessages(selectedConversationId, session);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshConversationMessages, session, selectedConversationId]);

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
    setState((previous) => ({ ...previous, selectedConversationId: conversationId, conversationMessages: [] }));
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    const currentSession = state.session;
    if (!currentSession) return null;

    setState((previous) => ({
      ...previous,
      uploadState: "uploading",
      uploadMessage: null,
      error: null
    }));

    const result = await uploadPortalFileWithRefresh(currentSession, file);
    if (!result.nextSession) {
      applySignedOutState(result.error?.message ?? "Session expired. Please sign in again.");
      return null;
    }

    saveSession(result.nextSession);

    if (!result.data) {
      setState((previous) => ({
        ...previous,
        session: result.nextSession,
        uploadState: "error",
        uploadMessage: result.error?.message ?? "Upload failed"
      }));
      return null;
    }

    setState((previous) => ({
      ...previous,
      session: result.nextSession,
      uploadState: "success",
      uploadMessage: "Upload completed"
    }));
    await refreshSnapshot(result.nextSession, { background: true });
    return result.data;
  }, [applySignedOutState, refreshSnapshot, state.session]);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    const currentSession = state.session;
    if (!currentSession) return null;

    const result = await createPortalMessageWithRefresh(currentSession, { conversationId, content });
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

  const handleRealtimeRefresh = useCallback(() => {
    if (!session) return;
    void refreshSnapshot(session, { background: true });
    if (selectedConversationId) {
      void refreshConversationMessages(selectedConversationId, session, { background: true });
    }
  }, [refreshConversationMessages, refreshSnapshot, selectedConversationId, session]);

  useRealtimeRefresh(session, handleRealtimeRefresh);

  return {
    ...state,
    signIn,
    signOut,
    refreshSnapshot,
    selectConversation,
    uploadFile,
    sendMessage
  };
}
