"use client";

import { useCallback, useEffect, useState } from "react";
import { loadSnapshotWithRefresh, login, logout, refresh, type Snapshot } from "../api/gateway";
import { clearSession, loadSession, saveSession, type AuthSession } from "./session";

function emptySnapshot(): Snapshot {
  return { clients: [], projects: [], leads: [] };
}

export interface AuthWorkspaceState {
  session: AuthSession | null;
  snapshot: Snapshot;
  loading: boolean;
  error: string | null;
}

/**
 * Shared auth/data lifecycle for protected web routes.
 * Keeps login, refresh, and snapshot loading behavior in one place.
 */
export function useAuthWorkspace() {
  const initialSession = loadSession();
  const [bootstrapAttempted, setBootstrapAttempted] = useState(Boolean(initialSession));
  const [state, setState] = useState<AuthWorkspaceState>({
    session: initialSession,
    snapshot: emptySnapshot(),
    loading: !initialSession,
    error: null
  });

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

  const refreshSnapshot = useCallback(async (sessionOverride?: AuthSession) => {
    const currentSession = sessionOverride ?? state.session;
    if (!currentSession) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));
    const result = await loadSnapshotWithRefresh(currentSession);

    if (!result.nextSession) {
      clearSession();
      setState({
        session: null,
        snapshot: emptySnapshot(),
        loading: false,
        error: result.error ?? "Session expired. Please sign in again."
      });
      return;
    }

    saveSession(result.nextSession);
    setState({
      session: result.nextSession,
      snapshot: result.snapshot ?? emptySnapshot(),
      loading: false,
      error: result.error ?? null
    });
  }, [state.session]);

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
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const response = await login(email);

    if (!response.success || !response.data) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: response.error?.message ?? "Login failed."
      }));
      return false;
    }

    const nextSession = response.data;
    saveSession(nextSession);
    setState((prev) => ({ ...prev, session: nextSession, loading: false }));
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    clearSession();
    setState({
      session: null,
      snapshot: emptySnapshot(),
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    signIn,
    signOut,
    refreshSnapshot
  };
}
