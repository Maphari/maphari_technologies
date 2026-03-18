"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import type { PageId } from "../config";
import type { PortalNotificationJob } from "../../../../lib/api/portal/types";
import { useMarkActiveTabNotificationsRead } from "../../../shared/use-mark-active-tab-notifications-read";
import { CLIENT_PAGE_TO_NOTIFICATION_TAB } from "../../../shared/notification-routing";
import {
  loadPortalNotificationsWithRefresh,
  setPortalNotificationReadStateWithRefresh,
} from "../../../../lib/api/portal/notifications";

const POLL_INTERVAL_MS = 30_000;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNotifications({
  session,
  activePage,
}: {
  session: AuthSession | null;
  activePage: PageId;
}) {
  const [notifications, setNotifications] = useState<PortalNotificationJob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTab = CLIENT_PAGE_TO_NOTIFICATION_TAB[activePage] ?? "operations";

  // ── Fetch notifications ──────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!session) return;

    try {
      const result = await loadPortalNotificationsWithRefresh(session);
      if (!result.nextSession || result.error) return;
      if (result.data) {
        setNotifications(result.data);
      }
    } catch {
      // Swallow polling errors silently
    }
  }, [session]);

  // ── Poll on mount and interval ───────────────────────────────────────────

  useEffect(() => {
    const initialPoll = setTimeout(() => {
      void fetchNotifications();
    }, 0);

    intervalRef.current = setInterval(() => {
      void fetchNotifications();
    }, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(initialPoll);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchNotifications]);

  // ── Computed: unread count ───────────────────────────────────────────────

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.readAt === null).length,
    [notifications],
  );

  // ── Computed: unread by tab ──────────────────────────────────────────────

  const unreadByTab = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notifications) {
      if (n.readAt === null) {
        counts[n.tab] = (counts[n.tab] ?? 0) + 1;
      }
    }
    return counts;
  }, [notifications]);

  // Keep unread badges in sync with page navigation (same behavior as admin/staff).
  const markRead = (auth: AuthSession, id: string, read: boolean) =>
    setPortalNotificationReadStateWithRefresh(auth, id, read).then((result) => ({
      data: result.data,
      error: result.error,
    }));

  useMarkActiveTabNotificationsRead({
    session,
    activeTab,
    notificationJobs: notifications,
    setNotificationJobs: setNotifications,
    markNotificationRead: markRead,
  });

  // ── Mark as read ─────────────────────────────────────────────────────────

  const markAsRead = useCallback(
    async (id: string) => {
      if (!session) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );

      try {
        const result = await setPortalNotificationReadStateWithRefresh(session, id, true);
        if (!result.nextSession || result.error) {
          // Rollback optimistic update
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, readAt: null } : n)),
          );
        }
      } catch {
        // Rollback on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: null } : n)),
        );
      }
    },
    [session],
  );

  // ── Mark all as read ─────────────────────────────────────────────────────

  const markAllAsRead = useCallback(async () => {
    if (!session) return;

    const unreadIds = notifications
      .filter((n) => n.readAt === null)
      .map((n) => n.id);

    if (unreadIds.length === 0) return;

    // Optimistic update
    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) =>
        n.readAt === null ? { ...n, readAt: nowIso } : n,
      ),
    );

    // Fire all requests in parallel
    const results = await Promise.allSettled(
      unreadIds.map((id) =>
        setPortalNotificationReadStateWithRefresh(session, id, true),
      ),
    );

    // Rollback any that failed
    const failedIds = new Set<string>();
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        failedIds.add(unreadIds[i]);
      } else if (!r.value.nextSession || r.value.error) {
        failedIds.add(unreadIds[i]);
      }
    });

    if (failedIds.size > 0) {
      setNotifications((prev) =>
        prev.map((n) =>
          failedIds.has(n.id) ? { ...n, readAt: null } : n,
        ),
      );
    }
  }, [session, notifications]);

  return {
    notifications,
    unreadCount,
    unreadByTab,
    markAsRead,
    markAllAsRead,
  };
}
