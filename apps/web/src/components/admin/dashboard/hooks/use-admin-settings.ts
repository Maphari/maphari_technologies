"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getProjectPreferenceWithRefresh,
  setProjectPreferenceWithRefresh,
  loadStaffUsersWithRefresh,
  type PartnerApiKey
} from "../../../../lib/api/admin";
import type { AuthSession } from "../../../../lib/auth/session";
import type { DashboardToast } from "../../../shared/dashboard-core";
import type { PageId } from "../config";

export type UseAdminSettingsReturn = {
  company: string;
  setCompany: React.Dispatch<React.SetStateAction<string>>;
  displayName: string;
  setDisplayName: React.Dispatch<React.SetStateAction<string>>;
  timezone: string;
  setTimezone: React.Dispatch<React.SetStateAction<string>>;
  currency: string;
  setCurrency: React.Dispatch<React.SetStateAction<string>>;
  density: "Compact" | "Comfortable";
  setDensity: React.Dispatch<React.SetStateAction<"Compact" | "Comfortable">>;
  landingPage: PageId;
  setLandingPage: React.Dispatch<React.SetStateAction<PageId>>;
  projectRequestAssignmentMode: "AUTO" | "MANUAL";
  setProjectRequestAssignmentMode: React.Dispatch<React.SetStateAction<"AUTO" | "MANUAL">>;
  staffSkillProfiles: Record<string, string[]>;
  setStaffSkillProfiles: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  workspaceStaffUsers: Array<{ id: string; email: string }>;
  sessionMinutes: number;
  setSessionMinutes: React.Dispatch<React.SetStateAction<number>>;
  mfaRequired: boolean;
  setMfaRequired: React.Dispatch<React.SetStateAction<boolean>>;
  passwordPolicy: string;
  setPasswordPolicy: React.Dispatch<React.SetStateAction<string>>;
  invoiceAlerts: boolean;
  setInvoiceAlerts: React.Dispatch<React.SetStateAction<boolean>>;
  projectAlerts: boolean;
  setProjectAlerts: React.Dispatch<React.SetStateAction<boolean>>;
  messageDigest: boolean;
  setMessageDigest: React.Dispatch<React.SetStateAction<boolean>>;
  emailSender: string;
  setEmailSender: React.Dispatch<React.SetStateAction<string>>;
  smsSender: string;
  setSmsSender: React.Dispatch<React.SetStateAction<string>>;
  lastSavedProfile: string | null;
  lastSavedWorkspace: string | null;
  lastSavedSecurity: string | null;
  lastSavedNotifications: string | null;
  lastSavedApiAccess: string | null;
  settingsTabs: readonly ["profile", "workspace", "security", "notifications", "integrations", "system"];
  activeTab: "profile" | "workspace" | "security" | "notifications" | "integrations" | "system";
  setActiveTab: React.Dispatch<React.SetStateAction<"profile" | "workspace" | "security" | "notifications" | "integrations" | "system">>;
  logScope: "all" | "security" | "operations";
  setLogScope: React.Dispatch<React.SetStateAction<"all" | "security" | "operations">>;
  logQuery: string;
  setLogQuery: React.Dispatch<React.SetStateAction<string>>;
  settingsLog: Array<{ id: string; occurredAt: string; domain: "security" | "operations"; action: string; actor: string; severity: "low" | "medium" | "high"; summary: string }>;
  filteredSettingsLog: Array<{ id: string; occurredAt: string; domain: "security" | "operations"; action: string; actor: string; severity: "low" | "medium" | "high"; summary: string }>;
  saveProfileSettings: () => Promise<void>;
  saveWorkspaceSettings: () => Promise<void>;
  saveSecuritySettings: () => Promise<void>;
  saveNotificationSettings: () => Promise<void>;
  saveApiAccessSettings: () => Promise<void>;
};

type Params = {
  session: AuthSession | null;
  publicApiKeys: PartnerApiKey[];
  pushToast: (tone: DashboardToast["tone"], message: string) => void;
  setAdminDisplayCurrency: (currency: string) => void;
  currencyValue: string;
};

export function useAdminSettings({ session, publicApiKeys, pushToast, setAdminDisplayCurrency, currencyValue }: Params): UseAdminSettingsReturn {
  const [company, setCompany] = useState("Maphari Technologies");
  const [displayName, setDisplayName] = useState(session?.user.email?.split("@")[0] ?? "Admin User");
  const [timezone, setTimezone] = useState("Africa/Johannesburg");
  const [currency, setCurrency] = useState(currencyValue);
  const [density, setDensity] = useState<"Compact" | "Comfortable">("Comfortable");
  const [landingPage, setLandingPage] = useState<PageId>("dashboard");
  const [projectRequestAssignmentMode, setProjectRequestAssignmentMode] = useState<"AUTO" | "MANUAL">("MANUAL");
  const [staffSkillProfiles, setStaffSkillProfiles] = useState<Record<string, string[]>>({});
  const [workspaceStaffUsers, setWorkspaceStaffUsers] = useState<Array<{ id: string; email: string }>>([]);
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [mfaRequired, setMfaRequired] = useState(true);
  const [passwordPolicy, setPasswordPolicy] = useState("Strong");
  const [invoiceAlerts, setInvoiceAlerts] = useState(true);
  const [projectAlerts, setProjectAlerts] = useState(true);
  const [messageDigest, setMessageDigest] = useState(false);
  const [emailSender, setEmailSender] = useState("ops@mapharitechnologies.com");
  const [smsSender, setSmsSender] = useState("Maphari");
  const [lastSavedProfile, setLastSavedProfile] = useState<string | null>(null);
  const [lastSavedWorkspace, setLastSavedWorkspace] = useState<string | null>(null);
  const [lastSavedSecurity, setLastSavedSecurity] = useState<string | null>(null);
  const [lastSavedNotifications, setLastSavedNotifications] = useState<string | null>(null);
  const [lastSavedApiAccess, setLastSavedApiAccess] = useState<string | null>(null);
  const settingsTabs = ["profile", "workspace", "security", "notifications", "integrations", "system"] as const;
  type SettingsTab = (typeof settingsTabs)[number];
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [logScope, setLogScope] = useState<"all" | "security" | "operations">("all");
  const [logQuery, setLogQuery] = useState("");

  const settingsLog = useMemo(() => {
    const rows: Array<{
      id: string;
      occurredAt: string;
      domain: "security" | "operations";
      action: string;
      actor: string;
      severity: "low" | "medium" | "high";
      summary: string;
    }> = [];
    const failedJobs = 0; // Derived from jobs in parent; kept as local fallback

    if (lastSavedProfile) {
      rows.push({
        id: "settings-profile-saved",
        occurredAt: lastSavedProfile,
        domain: "operations",
        action: "profile.updated",
        actor: displayName || "Admin",
        severity: "low",
        summary: "Organization profile fields updated."
      });
    }
    if (lastSavedWorkspace) {
      rows.push({
        id: "settings-workspace-saved",
        occurredAt: lastSavedWorkspace,
        domain: "operations",
        action: "workspace.preferences.updated",
        actor: displayName || "Admin",
        severity: "medium",
        summary: "Workspace defaults and assignment mode changed."
      });
    }
    if (lastSavedSecurity) {
      rows.push({
        id: "settings-security-saved",
        occurredAt: lastSavedSecurity,
        domain: "security",
        action: "security.baseline.updated",
        actor: displayName || "Admin",
        severity: "high",
        summary: "Security policy (MFA/session/password) adjusted."
      });
    }
    if (lastSavedNotifications) {
      rows.push({
        id: "settings-notifications-saved",
        occurredAt: lastSavedNotifications,
        domain: "operations",
        action: "notifications.routing.updated",
        actor: displayName || "Admin",
        severity: "low",
        summary: "Notification channels and sender metadata updated."
      });
    }
    if (lastSavedApiAccess) {
      rows.push({
        id: "settings-api-saved",
        occurredAt: lastSavedApiAccess,
        domain: "security",
        action: "integrations.api.policy.updated",
        actor: displayName || "Admin",
        severity: "medium",
        summary: "API key access policy snapshot saved."
      });
    }
    if (failedJobs > 0) {
      rows.push({
        id: "settings-system-failed-jobs",
        occurredAt: new Date().toISOString(),
        domain: "operations",
        action: "system.jobs.failed.detected",
        actor: "System",
        severity: "high",
        summary: `${failedJobs} failed automation job(s) require retry review.`
      });
    }
    if (!mfaRequired) {
      rows.push({
        id: "settings-mfa-disabled",
        occurredAt: new Date().toISOString(),
        domain: "security",
        action: "security.mfa.disabled",
        actor: "System",
        severity: "high",
        summary: "MFA requirement for admins is currently disabled."
      });
    }
    return rows.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }, [displayName, lastSavedApiAccess, lastSavedNotifications, lastSavedProfile, lastSavedSecurity, lastSavedWorkspace, mfaRequired]);

  const filteredSettingsLog = useMemo(
    () =>
      settingsLog.filter((entry) => {
        const scopeMatch = logScope === "all" ? true : entry.domain === logScope;
        const q = logQuery.trim().toLowerCase();
        const searchMatch = q
          ? `${entry.action} ${entry.summary} ${entry.actor}`.toLowerCase().includes(q)
          : true;
        return scopeMatch && searchMatch;
      }),
    [logQuery, logScope, settingsLog]
  );

  function readJsonObject(value: string | null | undefined): Record<string, unknown> | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  // Update currency when changed externally
  useEffect(() => {
    setCurrency(currencyValue);
  }, [currencyValue]);

  // Load all preferences from storage
  useEffect(() => {
    if (!session) return;
    void (async () => {
      const [profilePref, workspacePref, securityPref, notificationsPref] = await Promise.all([
        getProjectPreferenceWithRefresh(session, "settingsProfile"),
        getProjectPreferenceWithRefresh(session, "settingsWorkspace"),
        getProjectPreferenceWithRefresh(session, "settingsSecurity"),
        getProjectPreferenceWithRefresh(session, "settingsNotifications")
      ]);

      if (profilePref.data?.value) {
        const profile = readJsonObject(profilePref.data.value);
        if (profile) {
          if (typeof profile.displayName === "string") setDisplayName(profile.displayName);
          if (typeof profile.company === "string") setCompany(profile.company);
          if (typeof profile.timezone === "string") setTimezone(profile.timezone);
          if (typeof profile.currency === "string") setCurrency(profile.currency);
          if (typeof profile.savedAt === "string") setLastSavedProfile(profile.savedAt);
        }
      }

      if (workspacePref.data?.value) {
        const workspace = readJsonObject(workspacePref.data.value);
        if (workspace) {
          if (workspace.density === "Compact" || workspace.density === "Comfortable") setDensity(workspace.density);
          if (typeof workspace.landingPage === "string") {
            const pageValue = workspace.landingPage as PageId;
            if (["dashboard", "leads", "clients", "projects", "invoices"].includes(pageValue)) {
              setLandingPage(pageValue);
            }
          }
          if (workspace.projectRequestAssignmentMode === "AUTO" || workspace.projectRequestAssignmentMode === "MANUAL") {
            setProjectRequestAssignmentMode(workspace.projectRequestAssignmentMode);
          }
          if (workspace.staffSkillProfiles && typeof workspace.staffSkillProfiles === "object" && !Array.isArray(workspace.staffSkillProfiles)) {
            const parsedProfiles = Object.entries(workspace.staffSkillProfiles as Record<string, unknown>).reduce<Record<string, string[]>>((acc, [staffId, value]) => {
              if (Array.isArray(value)) {
                acc[staffId] = value.filter((item): item is string => typeof item === "string");
              }
              return acc;
            }, {});
            setStaffSkillProfiles(parsedProfiles);
          }
          if (typeof workspace.savedAt === "string") setLastSavedWorkspace(workspace.savedAt);
        }
      }

      if (securityPref.data?.value) {
        const security = readJsonObject(securityPref.data.value);
        if (security) {
          if (typeof security.sessionMinutes === "number") setSessionMinutes(security.sessionMinutes);
          if (typeof security.passwordPolicy === "string") setPasswordPolicy(security.passwordPolicy);
          if (typeof security.mfaRequired === "boolean") setMfaRequired(security.mfaRequired);
          if (typeof security.savedAt === "string") setLastSavedSecurity(security.savedAt);
        }
      }

      if (notificationsPref.data?.value) {
        const notifications = readJsonObject(notificationsPref.data.value);
        if (notifications) {
          if (typeof notifications.projectAlerts === "boolean") setProjectAlerts(notifications.projectAlerts);
          if (typeof notifications.invoiceAlerts === "boolean") setInvoiceAlerts(notifications.invoiceAlerts);
          if (typeof notifications.messageDigest === "boolean") setMessageDigest(notifications.messageDigest);
          if (typeof notifications.emailSender === "string") setEmailSender(notifications.emailSender);
          if (typeof notifications.smsSender === "string") setSmsSender(notifications.smsSender);
          if (typeof notifications.savedAt === "string") setLastSavedNotifications(notifications.savedAt);
        }
      }

      const apiAccessPref = await getProjectPreferenceWithRefresh(session, "settingsApiAccess");
      if (apiAccessPref.data?.value) {
        const apiAccess = readJsonObject(apiAccessPref.data.value);
        if (apiAccess && typeof apiAccess.savedAt === "string") setLastSavedApiAccess(apiAccess.savedAt);
      }
    })();
  }, [session]);

  // Load staff users list
  useEffect(() => {
    if (!session) return;
    void (async () => {
      const users = await loadStaffUsersWithRefresh(session);
      if (!users.nextSession || users.error) return;
      setWorkspaceStaffUsers(
        (users.data ?? [])
          .filter((item) => item.isActive && item.role === "STAFF")
          .map((item) => ({ id: item.id, email: item.email }))
      );
    })();
  }, [session]);

  async function savePreference(scope: string, key: "settingsProfile" | "settingsWorkspace" | "settingsSecurity" | "settingsNotifications" | "settingsApiAccess", value: Record<string, unknown>): Promise<void> {
    if (!session) {
      pushToast("error", "Session required to save settings.");
      return;
    }
    const result = await setProjectPreferenceWithRefresh(session, { key, value: JSON.stringify(value) });
    if (!result.nextSession || result.error) {
      pushToast("error", result.error?.message ?? `Unable to save ${scope.toLowerCase()}.`);
      return;
    }
    pushToast("success", `${scope} settings saved.`);
  }

  async function saveProfileSettings(): Promise<void> {
    const savedAt = new Date().toISOString();
    await savePreference("Organization profile", "settingsProfile", { displayName, company, timezone, currency, savedAt });
    setLastSavedProfile(savedAt);
    setAdminDisplayCurrency(currency);
  }

  async function saveWorkspaceSettings(): Promise<void> {
    const savedAt = new Date().toISOString();
    await savePreference("Workspace", "settingsWorkspace", {
      density,
      landingPage,
      projectRequestAssignmentMode,
      staffSkillProfiles,
      savedAt
    });
    setLastSavedWorkspace(savedAt);
  }

  async function saveSecuritySettings(): Promise<void> {
    const savedAt = new Date().toISOString();
    await savePreference("Security", "settingsSecurity", { sessionMinutes, passwordPolicy, mfaRequired, savedAt });
    setLastSavedSecurity(savedAt);
  }

  async function saveNotificationSettings(): Promise<void> {
    const savedAt = new Date().toISOString();
    await savePreference("Notification", "settingsNotifications", {
      projectAlerts,
      invoiceAlerts,
      messageDigest,
      emailSender,
      smsSender,
      savedAt
    });
    setLastSavedNotifications(savedAt);
  }

  async function saveApiAccessSettings(): Promise<void> {
    const savedAt = new Date().toISOString();
    await savePreference("API access", "settingsApiAccess", {
      totalKeys: publicApiKeys.length,
      clientsWithKeys: new Set(publicApiKeys.map((key) => key.clientId)).size,
      savedAt
    });
    setLastSavedApiAccess(savedAt);
  }

  return {
    company,
    setCompany,
    displayName,
    setDisplayName,
    timezone,
    setTimezone,
    currency,
    setCurrency,
    density,
    setDensity,
    landingPage,
    setLandingPage,
    projectRequestAssignmentMode,
    setProjectRequestAssignmentMode,
    staffSkillProfiles,
    setStaffSkillProfiles,
    workspaceStaffUsers,
    sessionMinutes,
    setSessionMinutes,
    mfaRequired,
    setMfaRequired,
    passwordPolicy,
    setPasswordPolicy,
    invoiceAlerts,
    setInvoiceAlerts,
    projectAlerts,
    setProjectAlerts,
    messageDigest,
    setMessageDigest,
    emailSender,
    setEmailSender,
    smsSender,
    setSmsSender,
    lastSavedProfile,
    lastSavedWorkspace,
    lastSavedSecurity,
    lastSavedNotifications,
    lastSavedApiAccess,
    settingsTabs,
    activeTab,
    setActiveTab,
    logScope,
    setLogScope,
    logQuery,
    setLogQuery,
    settingsLog,
    filteredSettingsLog,
    saveProfileSettings,
    saveWorkspaceSettings,
    saveSecuritySettings,
    saveNotificationSettings,
    saveApiAccessSettings
  };
}
