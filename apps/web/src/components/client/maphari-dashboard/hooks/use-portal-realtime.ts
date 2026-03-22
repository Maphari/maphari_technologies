"use client";

/**
 * use-portal-realtime — polling-based real-time project status feed.
 *
 * Ably is not installed in this project, so this hook falls back to the
 * minimum-viable approach: re-fetching the portal snapshot every 60 s and
 * diffing the result against the previous snapshot to surface specific events
 * as dashboard toasts.
 *
 * Detectable events (derived from snapshot diff):
 *   • project.milestone.completed  — toast "A milestone has been completed"
 *   • invoice.created              — badge increment via onInvoiceCreated cb
 *   • project.updated              — snapshot refresh (silent)
 *
 * Design reviews approved are not exposed in the lightweight snapshot; the
 * hook fires the snapshot refresh so any page that loads design-review data
 * will pick up the change on next render.
 *
 * Returns { isConnected } — true once the first successful poll has completed;
 * false while the initial fetch is still in flight or when there is no session.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import type { PortalSnapshot } from "../../../../lib/api/portal/types";
import { loadPortalSnapshotWithRefresh } from "../../../../lib/api/portal/projects";
import { saveSession } from "../../../../lib/auth/session";

const POLL_INTERVAL_MS = 60_000;

export type RealtimeToastFn = (
  tone: "success" | "info" | "warning" | "error",
  message: string
) => void;

export interface UsePortalRealtimeOptions {
  session: AuthSession | null;
  /** Called to push a toast into the dashboard toast stack. */
  onToast: RealtimeToastFn;
  /** Called when a new invoice is detected — lets the caller increment the notification badge. */
  onInvoiceCreated?: () => void;
  /** Called when a project milestone is completed — lets the caller trigger a full snapshot refresh. */
  onMilestoneCompleted?: () => void;
}

export function usePortalRealtime({
  session,
  onToast,
  onInvoiceCreated,
  onMilestoneCompleted,
}: UsePortalRealtimeOptions): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(false);

  // Store previous snapshot ids so we can diff without keeping the full object.
  const prevInvoiceIdsRef = useRef<Set<string>>(new Set());
  const prevMilestoneCompletedIdsRef = useRef<Set<string>>(new Set());

  // Stable refs for callbacks — avoids re-creating the poll effect when
  // the parent re-renders with new function references.
  const onToastRef = useRef(onToast);
  const onInvoiceCreatedRef = useRef(onInvoiceCreated);
  const onMilestoneCompletedRef = useRef(onMilestoneCompleted);

  useEffect(() => { onToastRef.current = onToast; }, [onToast]);
  useEffect(() => { onInvoiceCreatedRef.current = onInvoiceCreated; }, [onInvoiceCreated]);
  useEffect(() => { onMilestoneCompletedRef.current = onMilestoneCompleted; }, [onMilestoneCompleted]);

  const diff = useCallback((prev: { invoiceIds: Set<string>; milestoneCompletedIds: Set<string> }, next: PortalSnapshot) => {
    // ── Invoice created ─────────────────────────────────────────────────────
    const newInvoices = next.invoices.filter((inv) => !prev.invoiceIds.has(inv.id));
    if (newInvoices.length > 0) {
      onToastRef.current("info", "A new invoice has been issued");
      onInvoiceCreatedRef.current?.();
    }

    // ── Milestone completed ─────────────────────────────────────────────────
    // Milestones are not in the lightweight PortalSnapshot; detect project
    // progress jumps as a proxy. A project whose progressPercent has reached
    // 100 and whose id was not already known as complete is treated as having
    // completed its final milestone.
    //
    // Note: the snapshot does not carry per-milestone status, so we use the
    // project-level progressPercent >= 100 heuristic to avoid false positives.
    const completedProjects = next.projects.filter(
      (p) =>
        p.progressPercent >= 100 &&
        !prev.milestoneCompletedIds.has(p.id) &&
        p.status !== "CANCELLED"
    );
    if (completedProjects.length > 0) {
      onToastRef.current("success", "A milestone has been completed");
      onMilestoneCompletedRef.current?.();
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setIsConnected(false);
      prevInvoiceIdsRef.current = new Set();
      prevMilestoneCompletedIdsRef.current = new Set();
      return;
    }

    let cancelled = false;

    const poll = async (isFirstPoll: boolean) => {
      if (cancelled) return;

      try {
        const result = await loadPortalSnapshotWithRefresh(session);
        if (cancelled) return;

        if (result.nextSession) saveSession(result.nextSession);

        if (result.error || !result.data) return;

        const snapshot = result.data;

        if (!isFirstPoll) {
          // Diff against previous state
          diff(
            {
              invoiceIds: prevInvoiceIdsRef.current,
              milestoneCompletedIds: prevMilestoneCompletedIdsRef.current,
            },
            snapshot
          );
        }

        // Update tracked ids
        prevInvoiceIdsRef.current = new Set(snapshot.invoices.map((inv) => inv.id));
        prevMilestoneCompletedIdsRef.current = new Set(
          snapshot.projects
            .filter((p) => p.progressPercent >= 100 && p.status !== "CANCELLED")
            .map((p) => p.id)
        );

        if (isFirstPoll) setIsConnected(true);
      } catch {
        // Swallow polling errors silently — the SSE hook handles background refreshes
      }
    };

    // Initial poll (no diff, just seed previous state)
    void poll(true);

    const handle = window.setInterval(() => {
      void poll(false);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(handle);
      setIsConnected(false);
    };
  // session identity is stable enough — only re-subscribe when the token changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, diff]);

  return { isConnected };
}
