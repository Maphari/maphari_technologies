"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  getPortalPreferenceWithRefresh,
  setPortalPreferenceWithRefresh
} from "../../../../lib/api/portal";
import type { PageId } from "../config";

type TopbarDateRange = "7d" | "30d" | "90d" | "all";

type SettingsProfile = {
  fullName: string;
  email: string;
  company: string;
  phone: string;
  currency: string;
};

type SettingsNotifications = {
  projectUpdates: boolean;
  invoiceReminders: boolean;
  newMessages: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
};

type Params = {
  session: AuthSession | null;
  activePage: PageId;
  topbarDateRange: TopbarDateRange;
  projectScopeId: string | null;
  topbarSearch: string;
  userEmail: string;
  userGreetingName: string;
  clientBadge: string;
  setActivePage: Dispatch<SetStateAction<PageId>>;
  setTopbarSearch: (value: string) => void;
  setTopbarDateRange: Dispatch<SetStateAction<TopbarDateRange>>;
  setTopbarProjectId: Dispatch<SetStateAction<string | null>>;
  setSelectedProjectId: Dispatch<SetStateAction<string | null>>;
  setFeedback: (feedback: { tone: "success" | "error"; message: string }) => void;
};

export function useSettings({
  session,
  activePage,
  topbarDateRange,
  projectScopeId,
  topbarSearch,
  userEmail,
  userGreetingName,
  clientBadge,
  setActivePage,
  setTopbarSearch,
  setTopbarDateRange,
  setTopbarProjectId,
  setSelectedProjectId,
  setFeedback
}: Params) {
  const [settingsProfile, setSettingsProfile] = useState<SettingsProfile>({
    fullName: "there",
    email: "",
    company: "Client",
    phone: "",
    currency: "AUTO"
  });
  const [settingsNotifications, setSettingsNotifications] = useState<SettingsNotifications>({
    projectUpdates: true,
    invoiceReminders: true,
    newMessages: true,
    weeklyDigest: false,
    marketingEmails: false
  });
  const savedViewBaseRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const [profilePref, notificationsPref, savedViewPref] = await Promise.all([
        getPortalPreferenceWithRefresh(session, "settingsProfile"),
        getPortalPreferenceWithRefresh(session, "settingsNotifications"),
        getPortalPreferenceWithRefresh(session, "savedView")
      ]);
      if (cancelled) return;

      const parse = (value?: string | null): Record<string, unknown> | null => {
        if (!value) return null;
        try {
          const parsed = JSON.parse(value);
          return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
        } catch {
          return null;
        }
      };

      const profile = parse(profilePref.data?.value);
      if (profile) {
        setSettingsProfile({
          fullName: typeof profile.fullName === "string" ? profile.fullName : userGreetingName,
          email: typeof profile.email === "string" ? profile.email : userEmail,
          company: typeof profile.company === "string" ? profile.company : clientBadge,
          phone: typeof profile.phone === "string" ? profile.phone : "",
          currency: typeof profile.currency === "string" ? profile.currency : "AUTO"
        });
      } else {
        setSettingsProfile((previous) => ({
          fullName: previous.fullName === "there" ? userGreetingName : previous.fullName,
          email: previous.email || userEmail,
          company: previous.company === "Client" ? clientBadge : previous.company,
          phone: previous.phone,
          currency: previous.currency || "AUTO"
        }));
      }

      const notifications = parse(notificationsPref.data?.value);
      if (notifications) {
        setSettingsNotifications({
          projectUpdates: Boolean(notifications.projectUpdates),
          invoiceReminders: Boolean(notifications.invoiceReminders),
          newMessages: Boolean(notifications.newMessages),
          weeklyDigest: Boolean(notifications.weeklyDigest),
          marketingEmails: Boolean(notifications.marketingEmails)
        });
      }

      const savedView = parse(savedViewPref.data?.value);
      if (savedView) {
        savedViewBaseRef.current = savedView;
      }
      const topbar = savedView?.clientDashboardTopbar;
      if (topbar && typeof topbar === "object") {
        const topbarRecord = topbar as Record<string, unknown>;
        if (typeof topbarRecord.search === "string") {
          setTopbarSearch(topbarRecord.search);
        }
        if (
          topbarRecord.dateRange === "7d" ||
          topbarRecord.dateRange === "30d" ||
          topbarRecord.dateRange === "90d" ||
          topbarRecord.dateRange === "all"
        ) {
          setTopbarDateRange(topbarRecord.dateRange);
        }
        if (typeof topbarRecord.projectId === "string" || topbarRecord.projectId === null) {
          const nextProjectId = (topbarRecord.projectId as string | null) ?? null;
          setTopbarProjectId(nextProjectId);
          setSelectedProjectId(nextProjectId);
        }
        if (
          topbarRecord.activePage === "dashboard" ||
          topbarRecord.activePage === "reports" ||
          topbarRecord.activePage === "ai" ||
          topbarRecord.activePage === "onboarding" ||
          topbarRecord.activePage === "projects" ||
          topbarRecord.activePage === "milestones" ||
          topbarRecord.activePage === "invoices" ||
          topbarRecord.activePage === "messages" ||
          topbarRecord.activePage === "automations" ||
          topbarRecord.activePage === "settings" ||
          topbarRecord.activePage === "notifications"
        ) {
          setActivePage(topbarRecord.activePage);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientBadge, session, setActivePage, setSelectedProjectId, setTopbarDateRange, setTopbarProjectId, setTopbarSearch, userEmail, userGreetingName]);

  useEffect(() => {
    if (!session) return;
    const timeoutId = window.setTimeout(() => {
      const nextSavedView = {
        ...savedViewBaseRef.current,
        clientDashboardTopbar: {
          activePage,
          search: topbarSearch,
          dateRange: topbarDateRange,
          projectId: projectScopeId
        }
      };
      savedViewBaseRef.current = nextSavedView;
      void setPortalPreferenceWithRefresh(session, {
        key: "savedView",
        value: JSON.stringify(nextSavedView)
      });
    }, 450);
    return () => window.clearTimeout(timeoutId);
  }, [activePage, projectScopeId, session, topbarDateRange, topbarSearch]);

  const handleSaveClientProfile = useCallback(async () => {
    if (!session) return;
    const result = await setPortalPreferenceWithRefresh(session, {
      key: "settingsProfile",
      value: JSON.stringify(settingsProfile)
    });
    setFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Profile settings saved." : result.error?.message ?? "Unable to save profile settings."
    });
  }, [session, setFeedback, settingsProfile]);

  const handleSaveClientNotifications = useCallback(async () => {
    if (!session) return;
    const result = await setPortalPreferenceWithRefresh(session, {
      key: "settingsNotifications",
      value: JSON.stringify(settingsNotifications)
    });
    setFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Notification settings saved." : result.error?.message ?? "Unable to save notification settings."
    });
  }, [session, setFeedback, settingsNotifications]);

  return {
    settingsProfile,
    setSettingsProfile,
    settingsNotifications,
    setSettingsNotifications,
    handleSaveClientProfile,
    handleSaveClientNotifications
  };
}
