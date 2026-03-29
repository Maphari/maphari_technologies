"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  getProjectPreferenceWithRefresh,
  setProjectPreferenceWithRefresh
} from "../../../../lib/api/admin";

export type UseStaffSettingsReturn = {
  settingsProfile: { fullName: string; email: string; avatarUrl: string; weeklyTargetHours: number };
  setSettingsProfile: React.Dispatch<React.SetStateAction<{ fullName: string; email: string; avatarUrl: string; weeklyTargetHours: number }>>;
  savedSettingsProfile: { fullName: string; email: string; avatarUrl: string; weeklyTargetHours: number };
  setSavedSettingsProfile: React.Dispatch<React.SetStateAction<{ fullName: string; email: string; avatarUrl: string; weeklyTargetHours: number }>>;
  settingsNotifications: { taskAssignments: boolean; clientMessages: boolean; deliverableReminders: boolean; standupReminders: boolean; weeklyTimeSummary: boolean };
  setSettingsNotifications: React.Dispatch<React.SetStateAction<{ taskAssignments: boolean; clientMessages: boolean; deliverableReminders: boolean; standupReminders: boolean; weeklyTimeSummary: boolean }>>;
  savedSettingsNotifications: { taskAssignments: boolean; clientMessages: boolean; deliverableReminders: boolean; standupReminders: boolean; weeklyTimeSummary: boolean };
  setSavedSettingsNotifications: React.Dispatch<React.SetStateAction<{ taskAssignments: boolean; clientMessages: boolean; deliverableReminders: boolean; standupReminders: boolean; weeklyTimeSummary: boolean }>>;
  settingsWorkspace: { timezone: string; workStart: string; workEnd: string; defaultStatus: "Available" | "Focused" | "In a meeting" };
  setSettingsWorkspace: React.Dispatch<React.SetStateAction<{ timezone: string; workStart: string; workEnd: string; defaultStatus: "Available" | "Focused" | "In a meeting" }>>;
  savedSettingsWorkspace: { timezone: string; workStart: string; workEnd: string; defaultStatus: "Available" | "Focused" | "In a meeting" };
  setSavedSettingsWorkspace: React.Dispatch<React.SetStateAction<{ timezone: string; workStart: string; workEnd: string; defaultStatus: "Available" | "Focused" | "In a meeting" }>>;
  hasProfileChanges: boolean;
  hasNotificationsChanges: boolean;
  hasWorkspaceChanges: boolean;
  timezoneOptions: string[];
  handleSaveStaffProfile: () => Promise<void>;
  handleResetStaffProfile: () => void;
  handleSaveStaffNotifications: () => Promise<void>;
  handleResetStaffNotifications: () => void;
  handleSaveStaffWorkspace: () => Promise<void>;
  handleResetStaffWorkspace: () => void;
  handleProfileAvatarChange: (file: File) => void;
  handleUseLocalTimezone: () => void;
};

type Params = {
  session: AuthSession | null;
  staffEmail: string;
  staffName: string;
  kanbanViewMode: "all" | "my_work" | "urgent" | "client_waiting" | "blocked";
  kanbanSwimlane: "status" | "project" | "client";
  setDashboardLastSeenAt: React.Dispatch<React.SetStateAction<string | null | undefined>>;
  setFeedback: (feedback: { tone: "success" | "error" | "warning" | "info"; message: string }) => void;
  setKanbanViewMode: React.Dispatch<React.SetStateAction<"all" | "my_work" | "urgent" | "client_waiting" | "blocked">>;
  setKanbanSwimlane: React.Dispatch<React.SetStateAction<"status" | "project" | "client">>;
};

export function useStaffSettings({
  session,
  staffEmail,
  staffName,
  kanbanViewMode,
  kanbanSwimlane,
  setDashboardLastSeenAt,
  setFeedback,
  setKanbanViewMode,
  setKanbanSwimlane
}: Params): UseStaffSettingsReturn {
  const [settingsProfile, setSettingsProfile] = useState({
    fullName: staffName,
    email: staffEmail,
    avatarUrl: "",
    weeklyTargetHours: 40
  });
  const [savedSettingsProfile, setSavedSettingsProfile] = useState({
    fullName: staffName,
    email: staffEmail,
    avatarUrl: "",
    weeklyTargetHours: 40
  });
  const [settingsNotifications, setSettingsNotifications] = useState({
    taskAssignments: true,
    clientMessages: true,
    deliverableReminders: true,
    standupReminders: false,
    weeklyTimeSummary: true
  });
  const [savedSettingsNotifications, setSavedSettingsNotifications] = useState({
    taskAssignments: true,
    clientMessages: true,
    deliverableReminders: true,
    standupReminders: false,
    weeklyTimeSummary: true
  });
  const [settingsWorkspace, setSettingsWorkspace] = useState({
    timezone: "Africa/Johannesburg",
    workStart: "08:00",
    workEnd: "17:00",
    defaultStatus: "Available" as "Available" | "Focused" | "In a meeting"
  });
  const [savedSettingsWorkspace, setSavedSettingsWorkspace] = useState({
    timezone: "Africa/Johannesburg",
    workStart: "08:00",
    workEnd: "17:00",
    defaultStatus: "Available" as "Available" | "Focused" | "In a meeting"
  });

  // ─── Load preferences ───
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const [profilePref, workspacePref, notificationsPref, dashboardSeenPref, kanbanPrefs] = await Promise.all([
        getProjectPreferenceWithRefresh(session, "settingsProfile"),
        getProjectPreferenceWithRefresh(session, "settingsWorkspace"),
        getProjectPreferenceWithRefresh(session, "settingsNotifications"),
        getProjectPreferenceWithRefresh(session, "dashboardLastSeenAt"),
        getProjectPreferenceWithRefresh(session, "kanbanBoardPrefs")
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
        const nextProfile = {
          fullName: typeof profile.fullName === "string" ? profile.fullName : staffName,
          email: typeof profile.email === "string" ? profile.email : staffEmail,
          avatarUrl: typeof profile.avatarUrl === "string" ? profile.avatarUrl : "",
          weeklyTargetHours:
            typeof profile.weeklyTargetHours === "number"
              ? profile.weeklyTargetHours
              : 40
        };
        setSettingsProfile(nextProfile);
        setSavedSettingsProfile(nextProfile);
      } else {
        // No saved profile pref — keep the live state (already initialised with staffName/staffEmail),
        // just sync savedSettingsProfile so hasProfileChanges starts false.
        setSavedSettingsProfile({
          fullName: staffName,
          email: staffEmail,
          avatarUrl: "",
          weeklyTargetHours: 40
        });
      }

      const workspace = parse(workspacePref.data?.value);
      if (workspace) {
        const nextWorkspace: {
          timezone: string;
          workStart: string;
          workEnd: string;
          defaultStatus: "Available" | "Focused" | "In a meeting";
        } = {
          timezone: typeof workspace.timezone === "string" ? workspace.timezone : "Africa/Johannesburg",
          workStart: typeof workspace.workStart === "string" ? workspace.workStart : "08:00",
          workEnd: typeof workspace.workEnd === "string" ? workspace.workEnd : "17:00",
          defaultStatus:
            workspace.defaultStatus === "Focused" || workspace.defaultStatus === "In a meeting"
              ? workspace.defaultStatus
              : "Available"
        };
        setSettingsWorkspace(nextWorkspace);
        setSavedSettingsWorkspace(nextWorkspace);
      } else {
        setSavedSettingsWorkspace({
          timezone: "Africa/Johannesburg",
          workStart: "08:00",
          workEnd: "17:00",
          defaultStatus: "Available"
        });
      }

      const notifications = parse(notificationsPref.data?.value);
      if (notifications) {
        const nextNotifications = {
          taskAssignments: Boolean(notifications.taskAssignments),
          clientMessages: Boolean(notifications.clientMessages),
          deliverableReminders: Boolean(notifications.deliverableReminders),
          standupReminders: Boolean(notifications.standupReminders),
          weeklyTimeSummary: Boolean(notifications.weeklyTimeSummary)
        };
        setSettingsNotifications(nextNotifications);
        setSavedSettingsNotifications(nextNotifications);
      } else {
        setSavedSettingsNotifications({
          taskAssignments: true,
          clientMessages: true,
          deliverableReminders: true,
          standupReminders: false,
          weeklyTimeSummary: true
        });
      }

      const dashboardSeen = parse(dashboardSeenPref.data?.value);
      setDashboardLastSeenAt(
        dashboardSeen && typeof dashboardSeen.seenAt === "string" ? dashboardSeen.seenAt : null
      );

      const kanban = parse(kanbanPrefs.data?.value);
      if (kanban) {
        if (
          kanban.viewMode === "all" ||
          kanban.viewMode === "my_work" ||
          kanban.viewMode === "urgent" ||
          kanban.viewMode === "client_waiting" ||
          kanban.viewMode === "blocked"
        ) {
          setKanbanViewMode(kanban.viewMode);
        }
        if (kanban.swimlane === "status" || kanban.swimlane === "project" || kanban.swimlane === "client") {
          setKanbanSwimlane(kanban.swimlane);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, staffEmail, staffName, setDashboardLastSeenAt, setKanbanSwimlane, setKanbanViewMode]);

  // ─── Auto-save kanban prefs when viewMode/swimlane change ───
  useEffect(() => {
    if (!session) return;
    void setProjectPreferenceWithRefresh(session, {
      key: "kanbanBoardPrefs",
      value: JSON.stringify({ viewMode: kanbanViewMode, swimlane: kanbanSwimlane })
    });
  }, [kanbanSwimlane, kanbanViewMode, session]);

  const hasProfileChanges = useMemo(
    () => JSON.stringify(settingsProfile) !== JSON.stringify(savedSettingsProfile),
    [savedSettingsProfile, settingsProfile]
  );
  const hasNotificationsChanges = useMemo(
    () => JSON.stringify(settingsNotifications) !== JSON.stringify(savedSettingsNotifications),
    [savedSettingsNotifications, settingsNotifications]
  );
  const hasWorkspaceChanges = useMemo(
    () => JSON.stringify(settingsWorkspace) !== JSON.stringify(savedSettingsWorkspace),
    [savedSettingsWorkspace, settingsWorkspace]
  );

  const timezoneOptions = useMemo(() => {
    const defaults = [
      "Africa/Johannesburg",
      "UTC",
      "Europe/London",
      "America/New_York",
      "America/Los_Angeles"
    ];
    const available = typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : defaults;
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const merged = new Set<string>([localTz, ...defaults, ...available]);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, []);

  // ─── Handlers ───

  const handleSaveStaffProfile = async () => {
    if (!session) return;
    const result = await setProjectPreferenceWithRefresh(session, {
      key: "settingsProfile",
      value: JSON.stringify(settingsProfile)
    });
    if (result.data) {
      setSavedSettingsProfile(settingsProfile);
    }
    setFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Profile settings saved." : result.error?.message ?? "Unable to save profile settings."
    });
  };

  const handleResetStaffProfile = () => {
    setSettingsProfile(savedSettingsProfile);
    setFeedback({ tone: "success", message: "Profile changes reverted." });
  };

  const handleSaveStaffNotifications = async () => {
    if (!session) return;
    const result = await setProjectPreferenceWithRefresh(session, {
      key: "settingsNotifications",
      value: JSON.stringify(settingsNotifications)
    });
    if (result.data) {
      setSavedSettingsNotifications(settingsNotifications);
    }
    setFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Notification settings saved." : result.error?.message ?? "Unable to save notification settings."
    });
  };

  const handleResetStaffNotifications = () => {
    setSettingsNotifications(savedSettingsNotifications);
    setFeedback({ tone: "success", message: "Notification changes reverted." });
  };

  const handleSaveStaffWorkspace = async () => {
    if (!session) return;
    const result = await setProjectPreferenceWithRefresh(session, {
      key: "settingsWorkspace",
      value: JSON.stringify(settingsWorkspace)
    });
    if (result.data) {
      setSavedSettingsWorkspace(settingsWorkspace);
    }
    setFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Workspace settings saved." : result.error?.message ?? "Unable to save workspace settings."
    });
  };

  const handleResetStaffWorkspace = () => {
    setSettingsWorkspace(savedSettingsWorkspace);
    setFeedback({ tone: "success", message: "Workspace changes reverted." });
  };

  const handleProfileAvatarChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      setSettingsProfile((previous) => ({ ...previous, avatarUrl: result }));
      setFeedback({ tone: "success", message: "Profile photo updated. Save changes to persist it." });
    };
    reader.onerror = () => {
      setFeedback({ tone: "error", message: "Unable to load selected image." });
    };
    reader.readAsDataURL(file);
  };

  const handleUseLocalTimezone = () => {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setSettingsWorkspace((previous) => ({ ...previous, timezone: localTz }));
  };

  return {
    settingsProfile,
    setSettingsProfile,
    savedSettingsProfile,
    setSavedSettingsProfile,
    settingsNotifications,
    setSettingsNotifications,
    savedSettingsNotifications,
    setSavedSettingsNotifications,
    settingsWorkspace,
    setSettingsWorkspace,
    savedSettingsWorkspace,
    setSavedSettingsWorkspace,
    hasProfileChanges,
    hasNotificationsChanges,
    hasWorkspaceChanges,
    timezoneOptions,
    handleSaveStaffProfile,
    handleResetStaffProfile,
    handleSaveStaffNotifications,
    handleResetStaffNotifications,
    handleSaveStaffWorkspace,
    handleResetStaffWorkspace,
    handleProfileAvatarChange,
    handleUseLocalTimezone
  };
}
