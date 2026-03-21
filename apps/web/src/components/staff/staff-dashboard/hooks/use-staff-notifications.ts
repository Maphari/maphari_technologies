"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  loadNotificationJobsWithRefresh,
  setNotificationReadStateWithRefresh
} from "../../../../lib/api/admin";
import type { PageId } from "../config";
import { useMarkActiveTabNotificationsRead } from "../../../shared/use-mark-active-tab-notifications-read";
import { STAFF_PAGE_TO_NOTIFICATION_TAB } from "../../../shared/notification-routing";

type NotificationJob = {
  id: string;
  status: string;
  tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
  readAt: string | null;
};

export type UseStaffNotificationsReturn = {
  notificationJobs: NotificationJob[];
  setNotificationJobs: React.Dispatch<React.SetStateAction<NotificationJob[]>>;
  unreadByTab: { dashboard: number; projects: number; invoices: number; messages: number; settings: number; operations: number };
  totalUnreadNotifications: number;
  handleMarkNotificationRead: (jobId: string) => Promise<void>;
  handleMarkAllNotificationsRead: () => Promise<void>;
};

type Params = {
  session: AuthSession | null;
  activePage: PageId;
};

export function useStaffNotifications({ session, activePage }: Params): UseStaffNotificationsReturn {
  const [notificationJobs, setNotificationJobs] = useState<NotificationJob[]>([]);

  // ─── Initial load ───
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const result = await loadNotificationJobsWithRefresh(session);
      if (cancelled || !result.nextSession) return;
      setNotificationJobs((result.data ?? []).map((job) => ({ id: job.id, status: job.status, tab: job.tab, readAt: job.readAt })));
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  // ─── Auto-mark notifications read for active tab ───
  const markRead = (session: AuthSession, id: string, read: boolean) =>
    setNotificationReadStateWithRefresh(session, id, read);
  const activeTab = STAFF_PAGE_TO_NOTIFICATION_TAB[activePage] ?? "operations";
  useMarkActiveTabNotificationsRead({
    session,
    activeTab,
    notificationJobs,
    setNotificationJobs,
    markNotificationRead: markRead
  });

  const unreadByTab = useMemo(() => {
    const counts = {
      dashboard: 0,
      projects: 0,
      invoices: 0,
      messages: 0,
      settings: 0,
      operations: 0
    };
    notificationJobs.forEach((job) => {
      if (job.readAt) return;
      counts[job.tab] += 1;
    });
    return counts;
  }, [notificationJobs]);

  const totalUnreadNotifications = useMemo(
    () =>
      unreadByTab.dashboard +
      unreadByTab.projects +
      unreadByTab.invoices +
      unreadByTab.messages +
      unreadByTab.settings +
      unreadByTab.operations,
    [unreadByTab]
  );

  const handleMarkNotificationRead = useCallback(async (jobId: string) => {
    if (!session) return;
    // Optimistic update
    setNotificationJobs((previous) =>
      previous.map((job) =>
        job.id === jobId ? { ...job, readAt: new Date().toISOString() } : job
      )
    );
    try {
      await setNotificationReadStateWithRefresh(session, jobId, true);
    } catch {
      // Roll back optimistic update on failure
      setNotificationJobs((previous) =>
        previous.map((job) =>
          job.id === jobId ? { ...job, readAt: null } : job
        )
      );
    }
  }, [session?.accessToken]);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (!session) return;
    const unread = notificationJobs.filter((job) => !job.readAt);
    if (unread.length === 0) return;
    const now = new Date().toISOString();
    // Optimistic update
    setNotificationJobs((previous) =>
      previous.map((job) => ({ ...job, readAt: job.readAt ?? now }))
    );
    try {
      await Promise.all(unread.map((job) => setNotificationReadStateWithRefresh(session, job.id, true)));
    } catch {
      // Roll back optimistic update on failure
      const unreadIds = new Set(unread.map((job) => job.id));
      setNotificationJobs((previous) =>
        previous.map((job) =>
          unreadIds.has(job.id) ? { ...job, readAt: null } : job
        )
      );
    }
  }, [notificationJobs, session?.accessToken]);

  return {
    notificationJobs,
    setNotificationJobs,
    unreadByTab,
    totalUnreadNotifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead
  };
}
