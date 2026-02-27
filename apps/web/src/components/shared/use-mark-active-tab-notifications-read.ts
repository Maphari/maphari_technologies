"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { AuthSession } from "../../lib/auth/session";

type NotificationLike = { id: string; tab?: string | null; readAt?: string | null };

type Params<T extends NotificationLike> = {
  session: AuthSession | null;
  activeTab: string;
  notificationJobs: T[];
  setNotificationJobs: Dispatch<SetStateAction<T[]>>;
  markNotificationRead: (
    session: AuthSession,
    id: string,
    read: boolean
  ) => Promise<{ data: T | null; error: { message: string } | null } | void>;
};

export function useMarkActiveTabNotificationsRead<T extends NotificationLike>({
  session,
  activeTab,
  notificationJobs,
  setNotificationJobs,
  markNotificationRead
}: Params<T>) {
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!session) return;

    const pending = notificationJobs.filter(
      (job) => job.readAt == null && job.tab === activeTab && !inFlightRef.current.has(job.id)
    );

    pending.forEach((job) => {
      inFlightRef.current.add(job.id);
      Promise.resolve(markNotificationRead(session, job.id, true))
        .then((result) => {
          const next = result && typeof result === "object" && "data" in result ? result.data : null;
          if (!next) return;
          setNotificationJobs((current) => current.map((item) => (item.id === job.id ? { ...item, ...next } : item)));
        })
        .finally(() => {
          inFlightRef.current.delete(job.id);
        });
    });
  }, [session, activeTab, notificationJobs, setNotificationJobs, markNotificationRead]);
}
