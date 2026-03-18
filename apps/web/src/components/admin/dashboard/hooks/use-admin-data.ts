"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadNotificationJobsWithRefresh,
  loadProjectBlockersWithRefresh,
  loadTimelineWithRefresh,
  loadPublicApiKeysWithRefresh,
  loadAnalyticsMetricsWithRefresh,
  getProjectPreferenceWithRefresh,
  type NotificationJob,
  type ProjectBlocker,
  type PartnerApiKey
} from "../../../../lib/api/admin";
import { useRealtimeRefresh } from "../../../../lib/auth/use-realtime-refresh";
import { inferCountryFromLocale, currencyFromCountry } from "../../../../lib/i18n/currency";
import type { AuthSession } from "../../../../lib/auth/session";
import type { DashboardToast } from "../../../shared/dashboard-core";
import type { PageId } from "../config";

export type UseAdminDataReturn = {
  notificationJobs: NotificationJob[];
  setNotificationJobs: React.Dispatch<React.SetStateAction<NotificationJob[]>>;
  projectBlockers: ProjectBlocker[];
  setProjectBlockers: React.Dispatch<React.SetStateAction<ProjectBlocker[]>>;
  publicApiKeys: PartnerApiKey[];
  setPublicApiKeys: React.Dispatch<React.SetStateAction<PartnerApiKey[]>>;
  analyticsMetricsRows: number;
  setAnalyticsMetricsRows: React.Dispatch<React.SetStateAction<number>>;
  adminDisplayCurrency: string;
  setAdminDisplayCurrency: React.Dispatch<React.SetStateAction<string>>;
  handleRealtimeRefresh: () => void;
};

type Params = {
  session: AuthSession | null;
  activePage: PageId;
  pushToast: (tone: DashboardToast["tone"], message: string) => void;
};

export function useAdminData({ session, activePage, pushToast }: Params): UseAdminDataReturn {
  const [notificationJobs, setNotificationJobs] = useState<NotificationJob[]>([]);
  const [projectBlockers, setProjectBlockers] = useState<ProjectBlocker[]>([]);
  const [publicApiKeys, setPublicApiKeys] = useState<PartnerApiKey[]>([]);
  const [analyticsMetricsRows, setAnalyticsMetricsRows] = useState(0);
  const [adminDisplayCurrency, setAdminDisplayCurrency] = useState<string>(() => {
    if (typeof navigator === "undefined") return "USD";
    const country = inferCountryFromLocale(navigator.language);
    return currencyFromCountry(country) ?? "USD";
  });

  // Load currency preference + notification jobs on session load
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const pref = await getProjectPreferenceWithRefresh(session, "settingsProfile");
      if (cancelled || !pref.data?.value) return;
      try {
        const parsed = JSON.parse(pref.data.value) as { currency?: unknown };
        if (typeof parsed.currency === "string") {
          setAdminDisplayCurrency(parsed.currency);
        }
      } catch {
        // Ignore malformed saved preference and keep default.
      }
    })();
    void (async () => {
      const jobsResult = await loadNotificationJobsWithRefresh(session);
      if (jobsResult.nextSession && jobsResult.data) {
        setNotificationJobs(jobsResult.data);
      } else if (jobsResult.error?.message) {
        pushToast("error", jobsResult.error.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, pushToast]);

  // Load blockers + timeline on session load
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const loadShared = async () => {
      const [blockersResult] = await Promise.all([
        loadProjectBlockersWithRefresh(session, { limit: 120 }),
        loadTimelineWithRefresh(session, { limit: 80 })
      ]);
      if (cancelled) return;
      setProjectBlockers(blockersResult.data ?? []);
    };
    void loadShared();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Page-specific lazy data loading
  useEffect(() => {
    if (!session) return;
    if (activePage === "notifications" || activePage === "automation") {
      void (async () => {
        const jobsResult = await loadNotificationJobsWithRefresh(session);
        if (jobsResult.nextSession && jobsResult.data) {
          setNotificationJobs(jobsResult.data);
          if (jobsResult.error?.message) pushToast("error", jobsResult.error.message);
        } else if (jobsResult.error?.message) {
          pushToast("error", jobsResult.error.message);
        }
      })();
    }
    if (activePage === "integrations") {
      void (async () => {
        const keysResult = await loadPublicApiKeysWithRefresh(session);
        if (keysResult.nextSession && keysResult.data) {
          setPublicApiKeys(keysResult.data);
          if (keysResult.error?.message) pushToast("error", keysResult.error.message);
        } else if (keysResult.error?.message) {
          pushToast("error", keysResult.error.message);
        }
      })();
    }
    if (activePage === "automation") {
      void (async () => {
        const metricsResult = await loadAnalyticsMetricsWithRefresh(session);
        if (metricsResult.nextSession && metricsResult.data) {
          setAnalyticsMetricsRows(metricsResult.data.length);
          if (metricsResult.error?.message) pushToast("error", metricsResult.error.message);
        } else if (metricsResult.error?.message) {
          pushToast("error", metricsResult.error.message);
        }
      })();
    }
  }, [activePage, session, pushToast]);

  const handleRealtimeRefresh = useCallback(() => {
    if (!session) return;
    void (async () => {
      const [jobsResult, blockersResult] = await Promise.all([
        loadNotificationJobsWithRefresh(session),
        loadProjectBlockersWithRefresh(session, { limit: 120 })
      ]);
      if (jobsResult.data) setNotificationJobs(jobsResult.data);
      if (blockersResult.data) setProjectBlockers(blockersResult.data);

      if (activePage === "integrations") {
        const keysResult = await loadPublicApiKeysWithRefresh(session);
        if (keysResult.data) setPublicApiKeys(keysResult.data);
      }
      if (activePage === "automation") {
        const metricsResult = await loadAnalyticsMetricsWithRefresh(session);
        if (metricsResult.data) setAnalyticsMetricsRows(metricsResult.data.length);
      }
    })();
  }, [activePage, session]);

  useRealtimeRefresh(session, handleRealtimeRefresh);

  return {
    notificationJobs,
    setNotificationJobs,
    projectBlockers,
    setProjectBlockers,
    publicApiKeys,
    setPublicApiKeys,
    analyticsMetricsRows,
    setAnalyticsMetricsRows,
    adminDisplayCurrency,
    setAdminDisplayCurrency,
    handleRealtimeRefresh
  };
}
