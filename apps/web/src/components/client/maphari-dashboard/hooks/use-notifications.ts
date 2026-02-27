"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  loadPortalNotificationsWithRefresh,
  setPortalNotificationReadStateWithRefresh
} from "../../../../lib/api/portal";
import type { PageId } from "../config";
import { useMarkActiveTabNotificationsRead } from "../../../shared/use-mark-active-tab-notifications-read";

type NotificationJob = {
  id: string;
  status: string;
  tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
  readAt: string | null;
};

type Params = {
  session: AuthSession | null;
  activePage: PageId;
};

const markRead = (session: AuthSession, id: string, read: boolean) =>
  setPortalNotificationReadStateWithRefresh(session, id, read);

export function useNotifications({ session, activePage }: Params) {
  const [notificationJobs, setNotificationJobs] = useState<NotificationJob[]>([]);
  const [notificationsTrayOpen, setNotificationsTrayOpen] = useState(false);

  /* ── initial load ── */
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const result = await loadPortalNotificationsWithRefresh(session, { unreadOnly: false });
      if (cancelled || !result.nextSession) return;
      setNotificationJobs(result.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  /* ── auto mark active tab read (shared hook replaces inline effect) ── */
  const activeTab = activePage === "automations" ? "operations" : activePage;
  useMarkActiveTabNotificationsRead({
    session,
    activeTab,
    notificationJobs,
    setNotificationJobs,
    markNotificationRead: markRead
  });

  /* ── derived counts ── */
  const unreadByTab = useMemo(() => {
    const map = {
      dashboard: 0,
      projects: 0,
      invoices: 0,
      messages: 0,
      operations: 0,
      settings: 0
    };
    notificationJobs.forEach((job) => {
      if (job.readAt) return;
      if (job.tab in map) {
        map[job.tab as keyof typeof map] += 1;
      }
    });
    return map;
  }, [notificationJobs]);

  const totalUnreadNotifications = useMemo(
    () =>
      unreadByTab.dashboard +
      unreadByTab.projects +
      unreadByTab.invoices +
      unreadByTab.messages +
      unreadByTab.operations +
      unreadByTab.settings,
    [unreadByTab]
  );

  const toPageFromNotificationTab = useCallback(
    (tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations"): PageId => {
      return tab === "operations" ? "automations" : tab;
    },
    []
  );

  const handleMarkNotificationRead = useCallback(
    async (notificationId: string, nextRead: boolean) => {
      if (!session) return;
      const result = await setPortalNotificationReadStateWithRefresh(session, notificationId, nextRead);
      if (!result.data) return;
      setNotificationJobs((previous) =>
        previous.map((job) => (job.id === notificationId ? result.data! : job))
      );
    },
    [session]
  );

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (!session) return;
    const unread = notificationJobs.filter((job) => !job.readAt);
    if (unread.length === 0) return;
    const updates = await Promise.all(
      unread.map((job) => setPortalNotificationReadStateWithRefresh(session, job.id, true))
    );
    setNotificationJobs((previous) =>
      previous.map((job) => {
        const updated = updates.find((candidate) => candidate.data?.id === job.id)?.data;
        return updated ?? job;
      })
    );
  }, [notificationJobs, session]);

  const refreshNotifications = useCallback(async (currentSession: AuthSession) => {
    const result = await loadPortalNotificationsWithRefresh(currentSession, { unreadOnly: false });
    if (result.data) setNotificationJobs(result.data);
  }, []);

  return {
    notificationJobs,
    setNotificationJobs,
    notificationsTrayOpen,
    setNotificationsTrayOpen,
    unreadByTab,
    totalUnreadNotifications,
    toPageFromNotificationTab,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    refreshNotifications
  };
}
