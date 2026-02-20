"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadAdminSnapshotWithRefresh,
  updateLeadStatusWithRefresh,
  type AdminSnapshot,
  type LeadPipelineStatus
} from "../api/admin";
import { login, logout, refresh } from "../api/gateway";
import { clearSession, loadSession, saveSession, type AuthSession } from "./session";
import { useRealtimeRefresh } from "./use-realtime-refresh";

function emptySnapshot(): AdminSnapshot {
  return { clients: [], projects: [], leads: [], invoices: [], payments: [] };
}

export interface AdminWorkspaceState {
  session: AuthSession | null;
  snapshot: AdminSnapshot;
  loading: boolean;
  transitioningLeadId: string | null;
  error: string | null;
}

/**
 * Admin-specific auth and data lifecycle. Keeps pipeline transitions and
 * admin data-fetch behavior isolated from marketing/portal workspaces.
 */
export function useAdminWorkspace() {
  const initialSession = useMemo(() => loadSession(), []);
  const [bootstrapAttempted, setBootstrapAttempted] = useState(Boolean(initialSession));
  const [state, setState] = useState<AdminWorkspaceState>({
    session: initialSession,
    snapshot: emptySnapshot(),
    loading: !initialSession,
    transitioningLeadId: null,
    error: null
  });

  const applySignedOutState = useCallback((message?: string) => {
    clearSession();
    setState({
      session: null,
      snapshot: emptySnapshot(),
      loading: false,
      transitioningLeadId: null,
      error: message ?? null
    });
  }, []);

  const refreshSnapshot = useCallback(async (
    sessionOverride?: AuthSession,
    options: { background?: boolean } = {}
  ) => {
    const currentSession = sessionOverride ?? loadSession();
    if (!currentSession) return;

    if (!options.background) {
      setState((previous) => ({ ...previous, loading: true, error: null }));
    } else {
      setState((previous) => ({ ...previous, error: null }));
    }
    const result = await loadAdminSnapshotWithRefresh(currentSession);

    if (!result.nextSession) {
      applySignedOutState(result.error?.message ?? "Session expired. Please sign in again.");
      return;
    }

    saveSession(result.nextSession);
    setState((previous) => ({
      ...previous,
      session: result.nextSession,
      snapshot: result.data ?? emptySnapshot(),
      loading: options.background ? previous.loading : false,
      error: result.error?.message ?? null
    }));
  }, [applySignedOutState]);

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

  const session = state.session;

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

  const moveLead = useCallback(async (leadId: string, status: LeadPipelineStatus, options: { lostReason?: string } = {}) => {
    const currentSession = state.session;
    if (!currentSession) return false;

    setState((previous) => ({ ...previous, transitioningLeadId: leadId, error: null }));
    const result = await updateLeadStatusWithRefresh(currentSession, leadId, status, options);

    if (!result.nextSession) {
      applySignedOutState(result.error?.message ?? "Session expired. Please sign in again.");
      return false;
    }

    saveSession(result.nextSession);
    if (!result.data) {
      setState((previous) => ({
        ...previous,
        session: result.nextSession,
        transitioningLeadId: null,
        error: result.error?.message ?? "Unable to move lead status."
      }));
      return false;
    }

    setState((previous) => ({
      ...previous,
      session: result.nextSession,
      snapshot: {
        ...previous.snapshot,
        leads: previous.snapshot.leads.map((lead) => (lead.id === result.data?.id ? result.data : lead))
      },
      transitioningLeadId: null,
      error: null
    }));
    return true;
  }, [applySignedOutState, state.session]);

  const handleRealtimeRefresh = useCallback(() => {
    if (!session) return;
    void refreshSnapshot(session, { background: true });
  }, [refreshSnapshot, session]);

  useRealtimeRefresh(session, handleRealtimeRefresh);

  return {
    ...state,
    signIn,
    signOut,
    refreshSnapshot,
    moveLead
  };
}
