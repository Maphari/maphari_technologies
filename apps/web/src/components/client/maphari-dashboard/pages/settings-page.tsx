"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { usePageToast } from "../hooks/use-page-toast";
import type { NotificationPreference, ConnectedIntegration, SessionInfo } from "../types";
import type { PageId } from "../config";
import { formatRelative } from "../utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession, clearSession } from "../../../../lib/auth/session";
import { setPortalPreferenceWithRefresh, getPortalPreferenceWithRefresh } from "../../../../lib/api/portal";
import { requestDataExportWithRefresh, requestAccountDeletionWithRefresh, revokeAllSessionsWithRefresh } from "../../../../lib/api/portal/profile";
import { callGateway, withAuthorizedSession } from "../../../../lib/api/portal/internal";
import { loadPortalNotificationPrefsWithRefresh, updatePortalNotificationPrefsWithRefresh, loadPortalNotifPrefsWithRefresh, updatePortalNotifPrefWithRefresh, type NotifPrefKey } from "../../../../lib/api/portal/notification-prefs";
import { invitePortalTeamMemberWithRefresh, loadPortalTeamMembersWithRefresh } from "../../../../lib/api/portal/team";
import { callPortalAiGenerateWithRefresh } from "../../../../lib/api/portal/ai";
import { disableClient2faWithRefresh, getClient2faStatusWithRefresh, setupClient2faWithRefresh, verifyClient2faWithRefresh } from "../../../../lib/api/portal/auth-2fa";
import { Ic } from "../ui";

export interface SettingsPageProps {
  notificationPrefs: NotificationPreference[];
  integrations: ConnectedIntegration[];
  sessions: SessionInfo[];
  onToggleNotification: (category: string, channel: "inApp" | "email" | "push", value: boolean) => void;
  onDisconnectIntegration: (id: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  mode?: "profile" | "security";
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
  clientName?: string;
  companyName?: string;
  clientEmail?: string;
  clientInitials?: string;
  onNavigate?: (page: PageId) => void;
  session?: AuthSession | null;
  onRestartTour?: () => void;
}

type SettingsTab = "profile" | "workspace" | "appearance" | "dashboard" | "notifications" | "language" | "security";
type SecurityTab = "Overview" | "Two-Factor Auth" | "Active Sessions" | "Access Control" | "Audit Log" | "GDPR & Privacy";
type RoleName = "Owner" | "Project Lead" | "Designer" | "Engineer" | "Viewer";
type AccessUser = {
  name: string;
  role: RoleName;
  view: boolean;
  comment: boolean;
  approve: boolean;
  download: boolean;
};

type AuditEntry = {
  time: string;
  event: string;
  detail: string;
  user: string;
  sev: "ok" | "info" | "warn" | "crit";
};

type GdprItem = {
  title: string;
  desc: string;
  status: string;
  tone: "green" | "amber" | "red" | "purple";
  action?: string;
  danger?: boolean;
};

type WorkspacePreferenceState = {
  language: string;
  timezone: string;
  dateFormat: string;
  portalToggles: Record<string, boolean>;
};

type SecurityPreferenceState = {
  securityToggles: Record<string, boolean>;
  timeoutValue: string;
  mfaMethod: string;
  phoneNumber: string;
  phoneVerified: boolean;
};

const SETTINGS_TABS: Array<{ value: SettingsTab; label: string }> = [
  { value: "profile", label: "Profile" },
  { value: "workspace", label: "Workspace" },
  { value: "notifications", label: "Notifications" },
  { value: "security", label: "Security & Access" },
];

const ACCENT_COLORS = [
  "#c8f135", "#8b6fff", "#ff5f5f", "#f5a623", "#4dde8f", "#38bdf8",
  "#f472b6", "#fb923c", "#a3e635", "#e879f9", "#67e8f9", "#fbbf24",
] as const;

const WIDGETS = [
  { icon: "📊", name: "Project Progress" },
  { icon: "💳", name: "Invoice Summary" },
  { icon: "📅", name: "Upcoming Events" },
  { icon: "🔔", name: "Notifications" },
  { icon: "📁", name: "Recent Files" },
  { icon: "💬", name: "Messages" },
  { icon: "⏱", name: "Time Logged" },
  { icon: "🎯", name: "Milestones" },
] as const;

const LANGUAGES = ["English", "Zulu", "Xhosa", "Afrikaans", "Sotho", "Français", "Português", "العربية"] as const;
const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;

const SECURITY_TABS: SecurityTab[] = [
  "Overview",
  "Two-Factor Auth",
  "Active Sessions",
  "Access Control",
  "Audit Log",
  "GDPR & Privacy",
];

const SECURITY_DEFAULTS: Record<string, boolean> = {
  "Two-Factor Authentication": true,
  "Login Notifications": true,
  "Suspicious IP Alerts": true,
  "Session Expiry": true,
  "Download Logging": false,
  "Single Sign-On (SSO)": false,
  "Magic Link Login": false,
  "Encrypted Storage": true,
};

const DEFAULT_ACCESS_USERS: AccessUser[] = [/* loaded from team API — Batch 5 */];

const SECURITY_AUDIT: AuditEntry[] = [/* loaded from audit-log API — Batch 5 */];

const GDPR_ITEMS: GdprItem[] = [
  {
    title: "Data Processing Agreement",
    desc: "Your data is processed under POPIA and GDPR. Never sold or shared without consent.",
    status: "Compliant",
    tone: "green",
  },
  {
    title: "Export Your Data",
    desc: "Download projects, messages, files, and account data as an archive.",
    status: "Available",
    tone: "purple",
    action: "Request Export",
  },
  {
    title: "Right to Erasure",
    desc: "Request permanent deletion of your account and associated data. Irreversible.",
    status: "On Request",
    tone: "red",
    action: "Request Deletion",
    danger: true,
  },
  {
    title: "Data Retention Policy",
    desc: "Active project data is retained for 7 years. Anonymized analytics up to 2 years.",
    status: "7-Year Policy",
    tone: "amber",
  },
  {
    title: "Cookie Preferences",
    desc: "Control non-essential cookies. Essential security cookies cannot be disabled.",
    status: "Managed",
    tone: "green",
    action: "Manage Cookies",
  },
];

const DEFAULT_PORTAL_TOGGLES: Record<string, boolean> = {

  "Weekly Digest": true,
  "Sound Alerts": false,
  "Desktop Notifications": true,
  "Compact Mode": false,
  "Show Team Avatars": true,
};

function toggleHelp(label: string): string {
  if (label === "Weekly Digest") return "Receive a Monday summary of all project activity.";
  if (label === "Sound Alerts") return "Play notification sounds for important events.";
  if (label === "Desktop Notifications") return "Show browser push notifications.";
  if (label === "Compact Mode") return "Reduce spacing for higher information density.";
  return "Show team member avatars in project views.";
}

// Currency code → option label map (mirroring CURRENCY_MAP in billing-page)
const CURRENCY_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "ZAR", label: "ZAR - South African Rand (R)" },
  { code: "USD", label: "USD - US Dollar ($)" },
  { code: "EUR", label: "EUR - Euro (€)" },
  { code: "GBP", label: "GBP - British Pound (£)" },
  { code: "NGN", label: "NGN - Nigerian Naira (₦)" },
];

function makeBackupCodes(count = 8): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const nextCode = () => {
    const left = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    const right = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    return `${left}-${right}`;
  };
  return Array.from({ length: count }, nextCode);
}

export function SettingsPage({
  notificationPrefs,
  integrations,
  sessions,
  onToggleNotification,
  onDisconnectIntegration,
  theme,
  onToggleTheme,
  mode = "security",
  currency = "ZAR",
  onCurrencyChange,
  clientName = "Client",
  companyName = "Company",
  clientEmail = "",
  clientInitials = "C",
  onNavigate,
  session,
  onRestartTour,
}: SettingsPageProps) {
  const initialTab: SettingsTab = mode === "profile" ? "profile" : "security";
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [, setHasChanges] = useState(false);

  const [accentColor, setAccentColor] = useState<string>("#c8f135");
  const [activeWidgets, setActiveWidgets] = useState<number[]>([0, 1, 2, 3]);
  const [portalToggles, setPortalToggles] = useState<Record<string, boolean>>(DEFAULT_PORTAL_TOGGLES);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [selectedDateFormat, setSelectedDateFormat] = useState<string>("DD/MM/YYYY");
  const [selectedTimezone, setSelectedTimezone] = useState<string>("Africa/Johannesburg (UTC+2)");
  const [savedWorkspaceState, setSavedWorkspaceState] = useState<WorkspacePreferenceState>({
    language: "English",
    timezone: "Africa/Johannesburg (UTC+2)",
    dateFormat: "DD/MM/YYYY",
    portalToggles: DEFAULT_PORTAL_TOGGLES,
  });
  const [saveBusy, setSaveBusy] = useState(false);
  // currency is controlled via prop + onCurrencyChange
  const [securityTab, setSecurityTab] = useState<SecurityTab>("Overview");
  const [securityToggles, setSecurityToggles] = useState<Record<string, boolean>>(SECURITY_DEFAULTS);
  const [mfaMethod, setMfaMethod] = useState("Authenticator App");
  const [timeoutValue, setTimeoutValue] = useState("30 min");
  const [inviteRole, setInviteRole] = useState<RoleName>("Viewer");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [auditFilter, setAuditFilter] = useState<"All" | "Ok" | "Info" | "Warn" | "Critical">("All");
  const [securitySessions, setSecuritySessions] = useState<SessionInfo[]>(sessions);
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>(DEFAULT_ACCESS_USERS);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [gdprTarget, setGdprTarget] = useState<GdprItem | null>(null);
  const [password, setPassword] = useState("");

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwChangeBusy, setPwChangeBusy] = useState(false);
  const [pwChangeError, setPwChangeError] = useState("");
  const [pwChangeSuccess, setPwChangeSuccess] = useState(false);

  // Phone OTP
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [phoneOtpBusy, setPhoneOtpBusy] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpQrUrl, setTotpQrUrl] = useState<string | null>(null);
  const [totpSetupBusy, setTotpSetupBusy] = useState(false);
  const [totpVerifyCode, setTotpVerifyCode] = useState("");
  const [totpVerifyBusy, setTotpVerifyBusy] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaEnabledAt, setTwoFaEnabledAt] = useState<string | null>(null);
  const [twoFaDisablePassword, setTwoFaDisablePassword] = useState("");
  const [twoFaDisableBusy, setTwoFaDisableBusy] = useState(false);
  const [securityPrefsLoaded, setSecurityPrefsLoaded] = useState(false);

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [installed, setInstalled] = useState(false);

  // ── Per-channel per-event notification prefs ──────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState<Record<NotifPrefKey, boolean> | null>(null);
  const [notifPrefsLoading, setNotifPrefsLoading] = useState(false);

  // ── AI Weekly Digest state ────────────────────────────────────────────────
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(false);
  const [digestLoading,       setDigestLoading]       = useState(false);
  const [digestPreviewOpen,   setDigestPreviewOpen]   = useState(false);
  const [digestPreviewText,   setDigestPreviewText]   = useState("");
  const [digestPreviewBusy,   setDigestPreviewBusy]   = useState(false);
  const [digestToggleBusy,    setDigestToggleBusy]    = useState(false);

  const securityEnabledCount = useMemo(
    () => Object.values(securityToggles).filter(Boolean).length,
    [securityToggles],
  );

  const securityScore = useMemo(
    () => Math.round((securityEnabledCount / Object.keys(securityToggles).length) * 100),
    [securityEnabledCount, securityToggles],
  );

  const workspaceDirty = useMemo(() => {
    if (selectedLanguage !== savedWorkspaceState.language) return true;
    if (selectedTimezone !== savedWorkspaceState.timezone) return true;
    if (selectedDateFormat !== savedWorkspaceState.dateFormat) return true;
    const currentToggles = Object.entries(portalToggles);
    const savedToggles = savedWorkspaceState.portalToggles;
    if (currentToggles.length !== Object.keys(savedToggles).length) return true;
    return currentToggles.some(([key, value]) => savedToggles[key] !== value);
  }, [
    portalToggles,
    savedWorkspaceState.language,
    savedWorkspaceState.portalToggles,
    savedWorkspaceState.timezone,
    savedWorkspaceState.dateFormat,
    selectedLanguage,
    selectedTimezone,
    selectedDateFormat,
  ]);

  const filteredAudit = useMemo(() => {
    if (auditFilter === "All") return SECURITY_AUDIT;
    if (auditFilter === "Critical") return SECURITY_AUDIT.filter((row) => row.sev === "crit");
    return SECURITY_AUDIT.filter((row) => row.sev === auditFilter.toLowerCase());
  }, [auditFilter]);
  const securityAlertCount = useMemo(
    () => SECURITY_AUDIT.filter((row) => row.sev === "warn" || row.sev === "crit").length,
    [],
  );

  const passwordScore = useMemo(() => {
    if (!password) return { w: 0, label: "", color: "var(--muted3)" };
    if (password.length < 6) return { w: 20, label: "Weak", color: "var(--red)" };
    if (password.length < 10) return { w: 45, label: "Fair", color: "var(--amber)" };
    if (password.length < 14) return { w: 70, label: "Good", color: "var(--accent)" };
    return { w: 100, label: "Strong", color: "var(--green)" };
  }, [password]);

  const securityTabBlurb = useMemo(() => {
    if (securityTab === "Overview") return "Review baseline controls and password security.";
    if (securityTab === "Two-Factor Auth") return "Set your preferred verification method and backup codes.";
    if (securityTab === "Active Sessions") return "Monitor devices and revoke sessions you do not recognize.";
    if (securityTab === "Access Control") return "Manage teammate permissions by role.";
    if (securityTab === "Audit Log") return "Track security-relevant activity and investigate anomalies.";
    return "Manage export, retention, and deletion requests.";
  }, [securityTab]);

  const notificationEventRows = useMemo(
    () => [
      { label: "Invoice updates",   emailKey: "notif_email_invoice" as NotifPrefKey, inAppKey: "notif_inapp_invoice" as NotifPrefKey },
      { label: "Milestone reached", emailKey: "notif_email_milestone" as NotifPrefKey, inAppKey: "notif_inapp_milestone" as NotifPrefKey },
      { label: "New message",       emailKey: "notif_email_message" as NotifPrefKey, inAppKey: "notif_inapp_message" as NotifPrefKey },
      { label: "Announcements",     emailKey: "notif_email_announcement" as NotifPrefKey, inAppKey: "notif_inapp_announcement" as NotifPrefKey },
    ] as const,
    [],
  );

  const preferenceChannelEnabledCount = useMemo(
    () => notificationPrefs.reduce((total, pref) => total + Number(pref.inApp) + Number(pref.email) + Number(pref.push), 0),
    [notificationPrefs],
  );

  const eventChannelEnabledCount = useMemo(
    () => (notifPrefs ? Object.values(notifPrefs).filter(Boolean).length : 0),
    [notifPrefs],
  );

  useEffect(() => {
    setSecuritySessions(sessions);
  }, [sessions]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // ── Escape key to close open modals ─────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (digestPreviewOpen) setDigestPreviewOpen(false);
        else if (inviteModalOpen) setInviteModalOpen(false);
        else if (gdprTarget !== null) setGdprTarget(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [digestPreviewOpen, inviteModalOpen, gdprTarget]);

  // PWA install prompt listener
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Load notification prefs to initialise weekly digest toggle
  useEffect(() => {
    if (!session) return;
    setDigestLoading(true);
    void loadPortalNotificationPrefsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setWeeklyDigestEnabled(r.data.weeklyDigest);
    }).finally(() => setDigestLoading(false));
  }, [session]);

  // Load per-channel per-event notification prefs
  useEffect(() => {
    if (!session) return;
    setNotifPrefsLoading(true);
    void loadPortalNotifPrefsWithRefresh(session)
      .then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (r.data) setNotifPrefs(r.data);
      })
      .finally(() => setNotifPrefsLoading(false));
  }, [session]);

  const handleNotifToggle = useCallback(async (key: NotifPrefKey, current: boolean) => {
    if (!session) return;
    const next = !current;
    setNotifPrefs((prev) => prev ? { ...prev, [key]: next } : prev);
    const result = await updatePortalNotifPrefWithRefresh(session, key, next);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error) setNotifPrefs((prev) => prev ? { ...prev, [key]: current } : prev);
  }, [session]);

  // Load team members for Access Control tab
  useEffect(() => {
    if (!session || !session.user.clientId) return;
    const clientId = session.user.clientId;
    void loadPortalTeamMembersWithRefresh(session, clientId).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data && r.data.length > 0) {
        setAccessUsers(
          r.data
            .filter((m) => m.status === "ACTIVE" || m.status === "PENDING")
            .map((m) => {
              const role = (m.role as RoleName) ?? "Viewer";
              const isOwnerOrLead = role === "Owner" || role === "Project Lead";
              return {
                name: m.name,
                role,
                view:     true,
                comment:  true,
                approve:  isOwnerOrLead,
                download: isOwnerOrLead,
              };
            })
        );
      }
    });
  }, [session]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    (installPrompt as any).prompt(); // eslint-disable-line @typescript-eslint/no-explicit-any
    const { outcome } = await (installPrompt as any).userChoice; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  };

  // Load persisted workspace preferences
  useEffect(() => {
    if (!session) return;
    void getPortalPreferenceWithRefresh(session, "settingsWorkspace").then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data?.value) {
        try {
          const saved = JSON.parse(r.data.value) as { language?: string; timezone?: string; dateFormat?: string; portalToggles?: Record<string, boolean> };
          const nextState: WorkspacePreferenceState = {
            language: saved.language ?? "English",
            timezone: saved.timezone ?? "Africa/Johannesburg (UTC+2)",
            dateFormat: saved.dateFormat ?? "DD/MM/YYYY",
            portalToggles: { ...DEFAULT_PORTAL_TOGGLES, ...(saved.portalToggles ?? {}) },
          };
          setSelectedLanguage(nextState.language);
          setSelectedTimezone(nextState.timezone);
          setSelectedDateFormat(nextState.dateFormat);
          setPortalToggles(nextState.portalToggles);
          setSavedWorkspaceState(nextState);
        } catch { /* ignore malformed */ }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  // Load persisted security preferences
  useEffect(() => {
    if (!session) {
      setSecurityPrefsLoaded(false);
      return;
    }
    void getPortalPreferenceWithRefresh(session, "settingsSecurity")
      .then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (r.data?.value) {
          try {
            const saved = JSON.parse(r.data.value) as Partial<SecurityPreferenceState>;
            if (saved.securityToggles) setSecurityToggles({ ...SECURITY_DEFAULTS, ...saved.securityToggles });
            if (saved.timeoutValue) setTimeoutValue(saved.timeoutValue);
            if (saved.mfaMethod) setMfaMethod(saved.mfaMethod);
            if (typeof saved.phoneNumber === "string") setPhoneNumber(saved.phoneNumber);
            if (typeof saved.phoneVerified === "boolean") setPhoneVerified(saved.phoneVerified);
          } catch {
            // Ignore malformed stored preference
          }
        }
      })
      .finally(() => setSecurityPrefsLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  // Persist security preferences (debounced)
  useEffect(() => {
    if (!session || !securityPrefsLoaded) return;
    const payload: SecurityPreferenceState = {
      securityToggles,
      timeoutValue,
      mfaMethod,
      phoneNumber,
      phoneVerified,
    };
    const timer = window.setTimeout(() => {
      void setPortalPreferenceWithRefresh(session, {
        key: "settingsSecurity",
        value: JSON.stringify(payload),
      }).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [
    session,
    securityPrefsLoaded,
    securityToggles,
    timeoutValue,
    mfaMethod,
    phoneNumber,
    phoneVerified,
  ]);

  useEffect(() => {
    if (!session) return;
    void getClient2faStatusWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        setTwoFaEnabled(r.data.enabled);
        setTwoFaEnabledAt(r.data.enabledAt);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const visibleTabs = useMemo(
    () => SETTINGS_TABS.filter((tab) => (mode === "profile"
      ? tab.value === "profile" || tab.value === "workspace"
      : tab.value === "security" || tab.value === "notifications" || tab.value === "workspace")),
    [mode],
  );

  const notify = usePageToast();

  const markChanged = () => setHasChanges(true);

  const resetLocalDefaults = () => {
    setActiveTab(initialTab);
    setAccentColor("#c8f135");
    setActiveWidgets([0, 1, 2, 3]);
    setPortalToggles(DEFAULT_PORTAL_TOGGLES);
    setSelectedLanguage("English");
    setSelectedDateFormat("DD/MM/YYYY");
    setSelectedTimezone("Africa/Johannesburg (UTC+2)");
    onCurrencyChange?.("ZAR");
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!session || saveBusy) return;
    setSaveBusy(true);
    const workspaceState: WorkspacePreferenceState = {
      language: selectedLanguage,
      timezone: selectedTimezone,
      dateFormat: selectedDateFormat,
      portalToggles,
    };
    const workspace = JSON.stringify(workspaceState);
    const result = await setPortalPreferenceWithRefresh(session, { key: "settingsWorkspace", value: workspace });
    if (result.nextSession) saveSession(result.nextSession);
    setSaveBusy(false);
    if (result.error) {
      notify("error", "Save failed", result.error.message ?? "Unable to save workspace settings.");
      return;
    }
    setSavedWorkspaceState(workspaceState);
    setHasChanges(false);
    notify("success", "Settings saved", "Workspace preferences updated successfully.");
  };

  const handleDiscard = () => {
    setSelectedLanguage(savedWorkspaceState.language);
    setSelectedTimezone(savedWorkspaceState.timezone);
    setSelectedDateFormat(savedWorkspaceState.dateFormat);
    setPortalToggles(savedWorkspaceState.portalToggles);
    setHasChanges(false);
    notify("success", "Changes discarded", "Workspace settings restored to last saved state.");
  };

  async function handleToggleWeeklyDigest(): Promise<void> {
    if (!session || digestToggleBusy) return;
    const next = !weeklyDigestEnabled;
    setWeeklyDigestEnabled(next); // optimistic
    setDigestToggleBusy(true);
    try {
      const r = await updatePortalNotificationPrefsWithRefresh(session, { weeklyDigest: next });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) setWeeklyDigestEnabled(!next); // rollback
    } finally {
      setDigestToggleBusy(false);
    }
  }

  async function handlePreviewDigest(): Promise<void> {
    if (!session || digestPreviewBusy) return;
    setDigestPreviewBusy(true);
    setDigestPreviewOpen(true);
    setDigestPreviewText("");
    try {
      const r = await callPortalAiGenerateWithRefresh(session, {
        type: "general",
        prompt: "Generate a professional weekly project digest email for a client. Include sections for: Project Health (overall status and score), Recent Progress (what was completed this week), Upcoming Milestones (next 2 weeks), Budget Status (brief), and Action Items (anything the client needs to review or approve). Keep it concise, positive, and professional. Format with clear section headers.",
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setDigestPreviewText(r.data.output);
      } else {
        setDigestPreviewText("Unable to generate preview. Please try again.");
      }
    } finally {
      setDigestPreviewBusy(false);
    }
  }

  const toggleAccessPermission = (
    userIndex: number,
    permission: "view" | "comment" | "approve" | "download",
  ) => {
    setAccessUsers((prev) =>
      prev.map((user, index) => {
        if (index !== userIndex || user.role === "Owner") return user;
        return { ...user, [permission]: !user[permission] };
      }),
    );
    markChanged();
  };

  async function handleSignOutAll(): Promise<void> {
    if (!session || signingOutAll) return;
    setSigningOutAll(true);
    const result = await revokeAllSessionsWithRefresh(session);
    if (result.nextSession) saveSession(result.nextSession);
    setSigningOutAll(false);
    if (result.error) {
      notify("error", "Sign-out failed", result.error.message ?? "Unable to sign out all devices.");
    } else {
      clearSession();
      window.location.href = "/login";
    }
  }

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Account · Settings</div>
          <h1 className={cx("pageTitle")}>{SETTINGS_TABS.find((tab) => tab.value === activeTab)?.label ?? "Settings"}</h1>
          <p className={cx("pageSub")}>Customise your portal experience, notifications, and security preferences.</p>
        </div>
        <div className={cx("pageActions")}>
          {activeTab === "security" ? (
            <div className={cx("flexRow", "gap8")}>
              <span className={cx("text11", "colorMuted")}>Score</span>
              <div className={cx("trackW64h4")}>
                <div className={cx("pctFillRInherit", "dynBgColor")} style={{ "--pct": `${securityScore}%`, "--bg-color": securityScore >= 80 ? "var(--lime)" : securityScore >= 60 ? "var(--amber)" : "var(--red)" } as React.CSSProperties} />
              </div>
              <span className={cx("fw700", "text12", "fontMono", "dynColor")} style={{ "--color": securityScore >= 80 ? "var(--lime)" : securityScore >= 60 ? "var(--amber)" : "var(--red)" } as React.CSSProperties}>{securityScore}%</span>
            </div>
          ) : null}
          {activeTab === "workspace" ? (
            <>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={handleDiscard}
                disabled={!workspaceDirty || saveBusy}
              >
                Discard
              </button>
              <button
                className={cx("btnSm", "btnGhost")}
                type="button"
                onClick={() => {
                  resetLocalDefaults();
                  notify("success", "Settings reset", "Workspace preferences restored to defaults.");
                }}
                disabled={saveBusy}
              >
                Reset
              </button>
              <button
                className={cx("btnSm", "btnAccent")}
                type="button"
                onClick={() => void handleSave()}
                disabled={!workspaceDirty || saveBusy}
              >
                {saveBusy ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* ── Main tab navigation ── */}
      <div className={cx("pillTabs", "mb4")}>
        {visibleTabs.map((tab) => (
          <button key={tab.value} type="button" className={cx("pillTab", activeTab === tab.value && "pillTabActive")} onClick={() => setActiveTab(tab.value)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* layout wrapper dissolved for profile mode — security mode still uses display:contents */}
      <div className={cx("profLayout", mode === "security" && "secuModeLayout", "dContents")}>

        <div className={cx("profMain", mode === "security" && "secuModeMain", mode === "security" && "dContents")}>
          {activeTab === "profile" ? (
            <div className={cx("profPageContent")}>

              {/* ── Identity hero band ── */}
              <div className={cx("profHeroBand", "card")}>
                <div className={cx("profHeroLeft")}>
                  <div className={cx("profHeroAv")}>{clientInitials}</div>
                  <div className={cx("profHeroMeta")}>
                    <div className={cx("profHeroName")}>{clientName}</div>
                    <div className={cx("profHeroRole")}>{companyName}</div>
                    {clientEmail && (
                      <div className={cx("profHeroCompany")}>
                        {clientEmail}
                      </div>
                    )}
                  </div>
                </div>
                <div className={cx("profHeroActions")}>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={() => {
                      onNavigate?.("profile");
                      notify("info", "Profile update", "Upload and logo changes are managed in Company Profile.");
                    }}
                  >
                    Upload Photo
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={() => {
                      onNavigate?.("profile");
                      notify("info", "Profile update", "Avatar and logo changes are managed in Company Profile.");
                    }}
                  >
                    Remove Photo
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={() => {
                      setActiveTab("security");
                      setSecurityTab("Overview");
                    }}
                  >
                    Change Password
                  </button>
                </div>
              </div>

              {/* ── Two-column content ── */}
              <div className={cx("profGrid")}>
                {/* Left: Personal Info + Account & Access */}
                <div className={cx("profCol")}>
                  <section className={cx("card", "profCard")}>
                    <div className={cx("profCardHeader")}>
                      <div>
                        <div className={cx("profCardTitle")}>Personal Information</div>
                        <div className={cx("profCardSub")}>Managed in Company Profile.</div>
                      </div>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => onNavigate?.("profile")}>
                        Edit Profile
                      </button>
                    </div>

                    <label className={cx("profLabel")}>Full Name</label>
                    <input className={cx("profInput")} value={clientName} readOnly />

                    <label className={cx("profLabel")}>Email Address</label>
                    <input className={cx("profInput")} value={clientEmail} readOnly />

                    <label className={cx("profLabel")}>Phone Number</label>
                    <input className={cx("profInput")} value="Managed in Company Profile" readOnly />

                    <label className={cx("profLabel")}>Company Name</label>
                    <input className={cx("profInput")} value={companyName} readOnly />

                    <label className={cx("profLabel")}>Role / Title</label>
                    <input className={cx("profInput")} value="Managed in Company Profile" readOnly />
                  </section>

                  <section className={cx("card", "profCard")}>
                    <div className={cx("profCardHeader")}>
                      <div>
                        <div className={cx("profCardTitle")}>Account & Access</div>
                        <div className={cx("profCardSub")}>Connected services and active sessions.</div>
                      </div>
                    </div>

                    <div className={cx("profMiniHeader")}>Integrations</div>
                    <div className={cx("profMiniList")}>
                      {integrations.length === 0 ? (
                        <div className={cx("profMiniRow")}>
                          <span className={cx("profMiniMeta")}>No integrations connected. Visit the Integrations page to connect available providers.</span>
                        </div>
                      ) : integrations.slice(0, 2).map((integration) => (
                        <div key={integration.id} className={cx("profMiniRow")}>
                          <span className={cx("profMiniName")}>{integration.name}</span>
                          <span className={cx(integration.status === "connected" ? "badge badgeGreen" : "badge badgeMuted")}>
                            {integration.status}
                          </span>
                          {integration.status === "connected" ? (
                            <button
                              type="button"
                              className={cx("btnSm", "btnGhost", "mlAuto")}
                              onClick={() => {
                                onDisconnectIntegration(integration.id);
                                markChanged();
                              }}
                            >
                              Disconnect
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div className={cx("profMiniHeader")}>Active Sessions</div>
                    <div className={cx("profMiniList")}>
                      {sessions.length === 0 ? (
                        <div className={cx("profMiniRow")}>
                          <span className={cx("profMiniMeta")}>No active session history available for this account yet.</span>
                        </div>
                      ) : sessions.slice(0, 2).map((session) => (
                        <div key={session.id} className={cx("profMiniRow")}>
                          <div className={cx("profMiniWrap")}>
                            <div className={cx("profMiniName")}>{session.device}</div>
                            <div className={cx("profMiniMeta")}>Last active {formatRelative(session.lastActiveAt)}</div>
                          </div>
                          {!session.current ? (
                            <span className={cx("badge", "badgeMuted")}>Other session</span>
                          ) : (
                            <span className={cx("badge", "badgeGreen")}>Current</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right: Portal Preferences */}
                <div className={cx("profCol")}>
                  <section className={cx("card", "profCard")}>
                    <div className={cx("profCardHeader")}>
                      <div>
                        <div className={cx("profCardTitle")}>Portal Preferences</div>
                        <div className={cx("profCardSub")}>Quick toggles for your portal experience.</div>
                      </div>
                    </div>

                    {Object.entries(portalToggles).map(([label, on]) => (
                      <div key={label} className={cx("profToggleRow")}>
                        <div className={cx("profToggleInfo")}>
                          <div className={cx("profToggleName")}>{label}</div>
                          <div className={cx("profToggleDesc")}>{toggleHelp(label)}</div>
                        </div>
                        <button
                          type="button"
                          className={cx("profToggle", on && "profToggleOn")}
                          onClick={() => {
                            setPortalToggles((prev) => ({ ...prev, [label]: !on }));
                            markChanged();
                          }}
                        >
                          <span className={cx("profToggleKnob", on && "profToggleKnobOn")} />
                        </button>
                      </div>
                    ))}
                  </section>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "appearance" ? (
            <div className={cx("profGrid")}>
              <div className={cx("profCol")}>
                <section className={cx("card", "profCard")}>
                  <div className={cx("profCardHeader")}>
                    <div>
                      <div className={cx("profCardTitle")}>Accent Colour</div>
                      <div className={cx("profCardSub")}>Choose your portal highlight colour.</div>
                    </div>
                  </div>

                  <div className={cx("profColorGrid")}>
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cx("profColorSwatch", accentColor === color && "profColorSwatchSelected", "dynBgColor")} style={{ "--bg-color": color } as React.CSSProperties}
                        onClick={() => {
                          setAccentColor(color);
                          markChanged();
                        }}
                      />
                    ))}
                  </div>

                  <label className={cx("profLabel")}>Custom Hex</label>
                  <div className={cx("profInputRow")}>
                    <span className={cx("profColorPreview", "dynBgColor")} style={{ "--bg-color": accentColor } as React.CSSProperties} />
                    <input
                      className={cx("profInput", "profInputNoMargin")}
                      value={accentColor}
                      onChange={(event) => {
                        setAccentColor(event.target.value);
                        markChanged();
                      }}
                    />
                  </div>
                </section>

                <section className={cx("card", "profCard")}>
                  <div className={cx("profCardHeader")}>
                    <div>
                      <div className={cx("profCardTitle")}>Theme Mode</div>
                      <div className={cx("profCardSub")}>Switch between dark and light mode.</div>
                    </div>
                  </div>
                  <div className={cx("profChoiceGrid2")}>
                    <button
                      type="button"
                      className={cx("profChoiceBtn", theme === "dark" && "profChoiceBtnActive")}
                      onClick={() => {
                        if (theme !== "dark") onToggleTheme();
                        markChanged();
                      }}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      className={cx("profChoiceBtn", theme === "light" && "profChoiceBtnActive")}
                      onClick={() => {
                        if (theme !== "light") onToggleTheme();
                        markChanged();
                      }}
                    >
                      Light
                    </button>
                  </div>
                </section>
              </div>

              <div className={cx("profCol")}>
                <section className={cx("card", "profCard")}>
                  <div className={cx("profCardHeader")}>
                    <div>
                      <div className={cx("profCardTitle")}>Live Preview</div>
                    </div>
                  </div>
                  <div className={cx("profPreview")}>
                    <div className={cx("profPreviewLabel")}>Preview</div>
                    <div className={cx("profPreviewTop")}> 
                      <span className={cx("profPreviewLogo", "dynColor")} style={{ "--color": accentColor } as React.CSSProperties}>Maphari</span>
                      <span className={cx("profPreviewSpacer")} />
                      <span className={cx("profPreviewDot", "dynBgColor")} style={{ "--bg-color": accentColor } as React.CSSProperties} />
                      <span className={cx("profPreviewDot", "profPreviewDotMuted")} />
                    </div>
                    <div className={cx("profPreviewBody")}>
                      <div className={cx("profPreviewSide")}>
                        <span className={cx("profPreviewSideItem", "profPreviewSideItemActive", "dynBgColor")} style={{ "--bg-color": accentColor } as React.CSSProperties} />
                        <span className={cx("profPreviewSideItem")} />
                        <span className={cx("profPreviewSideItem")} />
                        <span className={cx("profPreviewSideItem")} />
                      </div>
                      <div className={cx("profPreviewMain")}> 
                        <span className={cx("profPreviewCard")} style={{ "--border-color": accentColor } as React.CSSProperties} />
                        <span className={cx("profPreviewCard")} />
                        <span className={cx("profPreviewCard")} />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "dashboard" ? (
            <div className={cx("profGrid")}>
              <div className={cx("profCol")}>
                <section className={cx("card", "profCard")}>
                  <div className={cx("profCardHeader")}>
                    <div>
                      <div className={cx("profCardTitle")}>Dashboard Widgets</div>
                      <div className={cx("profCardSub")}>Choose what appears on your home screen.</div>
                    </div>
                  </div>

                  <div className={cx("profWidgetGrid")}>
                    {WIDGETS.map((widget, index) => {
                      const active = activeWidgets.includes(index);
                      return (
                        <button
                          key={widget.name}
                          type="button"
                          className={cx("profWidgetItem", active && "profWidgetItemActive")}
                          onClick={() => {
                            setActiveWidgets((prev) =>
                              prev.includes(index)
                                ? prev.filter((item) => item !== index)
                                : [...prev, index],
                            );
                            markChanged();
                          }}
                        >
                          <span className={cx("profWidgetCheck", active && "profWidgetCheckActive")}>{active ? "✓" : ""}</span>
                          <span className={cx("profWidgetIcon")}>{widget.icon}</span>
                          <span className={cx("profWidgetName")}>{widget.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className={cx("profCol")}>
                <section className={cx("card", "profCard")}>
                  <div className={cx("profCardHeader")}>
                    <div className={cx("profCardTitle")}>Active Widgets Preview</div>
                  </div>
                  {activeWidgets.length === 0 ? (
                    <div className={cx("emptyState")}> 
                      <div className={cx("emptyStateIcon")}>--</div>
                      <div className={cx("emptyStateTitle")}>No widgets selected</div>
                    </div>
                  ) : (
                    <div className={cx("profMiniList")}>
                      {activeWidgets.map((index) => (
                        <div key={WIDGETS[index].name} className={cx("profMiniRow", "profMiniRowCard")}>
                          <span>{WIDGETS[index].icon}</span>
                          <span className={cx("profMiniName")}>{WIDGETS[index].name}</span>
                          <span className={cx("badge", "badgeAccent")}>Active</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "workspace" ? (
            <div className={cx("profStack16")}>
              {/* ── Company info ── */}
              <section className={cx("card", "profCard")}>
                <div className={cx("profCardHeader")}>
                  <div>
                    <div className={cx("profCardTitle")}>Company Information</div>
                    <div className={cx("profCardSub")}>Manage your company details and contact information.</div>
                  </div>
                  <button type="button" className={cx("btnSm")} onClick={() => { onNavigate?.("profile"); notify("info", "Company Profile", "Edit full company details on your Company Profile page."); }}>
                    Edit Profile
                  </button>
                </div>
                <div className={cx("grid2Cols", "gap0x20")}>
                  <div>
                    <label className={cx("profLabel")}>Company Name</label>
                    <input className={cx("profInput")} value={companyName} readOnly />
                  </div>
                  <div>
                    <label className={cx("profLabel")}>Owner / Contact</label>
                    <input className={cx("profInput")} value={clientName} readOnly />
                  </div>
                </div>
              </section>

              {/* ── Regional settings ── */}
              <section className={cx("card", "profCard", "profCardNarrow")}>
                <div className={cx("profCardHeader")}>
                  <div>
                    <div className={cx("profCardTitle")}>Regional Settings</div>
                    <div className={cx("profCardSub")}>Set your language, timezone, currency and date preferences.</div>
                  </div>
                </div>

                <label className={cx("profLabel")}>Language</label>
                <select className={cx("profInput")} value={selectedLanguage} onChange={(e) => { setSelectedLanguage(e.target.value); markChanged(); }}>
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>

                <label className={cx("profLabel")}>Timezone</label>
                <select className={cx("profInput")} value={selectedTimezone} onChange={(e) => { setSelectedTimezone(e.target.value); markChanged(); }}>
                  <option>Africa/Johannesburg (UTC+2)</option>
                  <option>Africa/Lagos (UTC+1)</option>
                  <option>Europe/London (UTC+0)</option>
                  <option>America/New_York (UTC-5)</option>
                </select>

                <label className={cx("profLabel")}>Currency</label>
                <select className={cx("profInput")} value={currency} onChange={(e) => { onCurrencyChange?.(e.target.value); markChanged(); }}>
                  {CURRENCY_OPTIONS.map((opt) => <option key={opt.code} value={opt.code}>{opt.label}</option>)}
                </select>

                <label className={cx("profLabel")}>Date Format</label>
                <div className={cx("profChoiceGrid3")}>
                  {DATE_FORMATS.map((format) => (
                    <button key={format} type="button" className={cx("profChoiceBtn", selectedDateFormat === format && "profChoiceBtnActive")} onClick={() => { setSelectedDateFormat(format); markChanged(); }}>
                      {format}
                    </button>
                  ))}
                </div>
              </section>

              {/* ── Portal preferences ── */}
              <section className={cx("card", "profCard")}>
                <div className={cx("profCardHeader")}>
                  <div>
                    <div className={cx("profCardTitle")}>Portal Preferences</div>
                    <div className={cx("profCardSub")}>Control how your portal looks and behaves.</div>
                  </div>
                </div>
                <div className={cx("flexCol", "gap0")}>
                  {Object.entries(portalToggles).map(([label, on]) => (
                    <div key={label} className={cx("flexBetween", "py12_0", "borderB")}>
                      <div>
                        <div className={cx("text12", "fw600")}>{label}</div>
                        <div className={cx("text11", "colorMuted")}>{toggleHelp(label)}</div>
                      </div>
                      <button type="button" className={cx("profToggle", on && "profToggleOn")} onClick={() => setPortalToggles(prev => ({ ...prev, [label]: !on }))}>
                        <span className={cx("profToggleKnob", on && "profToggleKnobOn")} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Onboarding tour ── */}
              {onRestartTour && (
                <section className={cx("card", "profCard", "profCardNarrow")}>
                  <div className={cx("profCardHeader")}>
                    <div>
                      <div className={cx("profCardTitle")}>Onboarding Tour</div>
                      <div className={cx("profCardSub")}>Re-run the portal walkthrough to refresh your orientation.</div>
                    </div>
                    <button type="button" className={cx("btnSm")} onClick={onRestartTour}>
                      Restart Tour
                    </button>
                  </div>
                </section>
              )}

              {/* ── Install App ── */}
              {installPrompt && !installed && (
                <section className={cx("card", "profCard", "profCardNarrow")}>
                  <div className={cx("profCardHeader")}>
                    <div>
                      <div className={cx("profCardTitle")}>Install App</div>
                      <div className={cx("profCardSub")}>Install the Maphari portal as an app on your device for faster access.</div>
                    </div>
                    <button type="button" className={cx("btnSm", "btnAccent")} onClick={handleInstall}>
                      Install App
                    </button>
                  </div>
                </section>
              )}
            </div>
          ) : null}

          {activeTab === "notifications" ? (
            <div className={cx("grid2Cols", "gap16", "py20_0")}>
              <div className={cx("card")} style={{ gridColumn: "1 / -1" }}>
                <div className={cx("cardHd")}>
                  <span className={cx("cardHdTitle")}>Notification Center</span>
                  <span className={cx("text10", "colorMuted", "mlAuto")}>Delivery overview</span>
                </div>
                <div className={cx("p12161616", "grid3Cols8Gap")}>
                  <div className={cx("card", "p12x16x16")}>
                    <div className={cx("text10", "colorMuted")}>Preference toggles</div>
                    <div className={cx("text14", "fw700")}>{preferenceChannelEnabledCount}</div>
                  </div>
                  <div className={cx("card", "p12x16x16")}>
                    <div className={cx("text10", "colorMuted")}>Event channels enabled</div>
                    <div className={cx("text14", "fw700")}>{eventChannelEnabledCount}</div>
                  </div>
                  <div className={cx("card", "p12x16x16")}>
                    <div className={cx("text10", "colorMuted")}>AI weekly digest</div>
                    <div className={cx("text14", "fw700")}>{weeklyDigestEnabled ? "Active" : "Inactive"}</div>
                  </div>
                </div>
              </div>

              <div className={cx("card")}>
                <div className={cx("cardHd")}>
                  <span className={cx("cardHdTitle")}>Delivery Preferences</span>
                </div>
                <div className={cx("p12161616", "flexCol", "gap4")}>
                  <div className={cx("text11", "colorMuted", "mb8")}>Choose how each category reaches you.</div>
                  {notificationPrefs.map((pref) => (
                    <div key={pref.category} className={cx("borderB", "py12_0")}>
                      <div className={cx("fw600", "text12", "mb8")}>{pref.category}</div>
                      <div className={cx("flexRow", "gap12", "flexWrap")}>
                        {([
                          { channel: "inApp", label: "In-App", icon: "bell" },
                          { channel: "email", label: "Email", icon: "mail" },
                          { channel: "push", label: "Push", icon: "monitor" },
                        ] as const).map(({ channel, label, icon }) => (
                          <button
                            key={channel}
                            type="button"
                            aria-label={`Toggle ${channel} for ${pref.category}`}
                            onClick={() => onToggleNotification(pref.category, channel, !pref[channel])}
                            className={cx("flexRow", "gap8", "alignCenter")}
                            style={{ background: "transparent", border: "none", padding: 0 }}
                          >
                            <Ic n={icon} sz={13} c={pref[channel] ? "var(--lime)" : "var(--muted2)"} />
                            <span className={cx("text10", "colorMuted2")}>{label}</span>
                            <span className={cx("profMiniToggle", pref[channel] && "profMiniToggleOn")}>
                              <span className={cx("profMiniToggleKnob", pref[channel] && "profMiniToggleKnobOn")} />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cx("flexCol", "gap16")}>
                <div className={cx("card")}>
                  <div className={cx("cardHd")}>
                    <span className={cx("cardHdTitle")}>Event Channel Overrides</span>
                    <span className={cx("text10", "colorMuted", "mlAuto")}>Email &amp; In-App</span>
                  </div>
                  <div className={cx("p12161616")}>
                    {notifPrefsLoading ? (
                      <div className={cx("text12", "colorMuted")}>Loading…</div>
                    ) : notifPrefs === null ? (
                      <div className={cx("text12", "colorMuted2")}>Unable to load channel preferences.</div>
                    ) : (
                      <div className={cx("flexCol", "gap4")}>
                        {notificationEventRows.map(({ label, emailKey, inAppKey }) => (
                          <div key={label} className={cx("flexBetween", "gap10", "borderB", "py12_0")}>
                            <div className={cx("text12", "fw600")}>{label}</div>
                            <div className={cx("flexRow", "gap12")}>
                              <button
                                type="button"
                                aria-label={`Toggle email for ${label}`}
                                onClick={() => void handleNotifToggle(emailKey, notifPrefs[emailKey])}
                                className={cx("flexRow", "gap6", "alignCenter")}
                                style={{ background: "transparent", border: "none", padding: 0 }}
                              >
                                <Ic n="mail" sz={12} c={notifPrefs[emailKey] ? "var(--lime)" : "var(--muted2)"} />
                                <span className={cx("text10", "colorMuted2")}>Email</span>
                                <span className={cx("profMiniToggle", notifPrefs[emailKey] && "profMiniToggleOn")}>
                                  <span className={cx("profMiniToggleKnob", notifPrefs[emailKey] && "profMiniToggleKnobOn")} />
                                </span>
                              </button>
                              <button
                                type="button"
                                aria-label={`Toggle in-app for ${label}`}
                                onClick={() => void handleNotifToggle(inAppKey, notifPrefs[inAppKey])}
                                className={cx("flexRow", "gap6", "alignCenter")}
                                style={{ background: "transparent", border: "none", padding: 0 }}
                              >
                                <Ic n="bell" sz={12} c={notifPrefs[inAppKey] ? "var(--lime)" : "var(--muted2)"} />
                                <span className={cx("text10", "colorMuted2")}>In-App</span>
                                <span className={cx("profMiniToggle", notifPrefs[inAppKey] && "profMiniToggleOn")}>
                                  <span className={cx("profMiniToggleKnob", notifPrefs[inAppKey] && "profMiniToggleKnobOn")} />
                                </span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={cx("card")}>
                  <div className={cx("cardHd")}>
                    <Ic n="mail" sz={14} c="var(--accent)" />
                    <span className={cx("cardHdTitle", "ml8")}>AI Weekly Digest</span>
                    {weeklyDigestEnabled && <span className={cx("badge", "badgeAccent", "mlAuto")}>Active</span>}
                  </div>
                  <div className={cx("p12161616", "flexCol", "gap12")}>
                    <div className={cx("text12", "colorMuted", "lineH17")}>
                      Receive a concise AI-generated Monday summary with progress, milestones, budget status, and pending actions.
                    </div>
                    <div className={cx("flexBetween")}>
                      <div>
                        <div className={cx("fw600", "text12")}>Enable Weekly Digest</div>
                        <div className={cx("text11", "colorMuted2", "mt2")}>Delivered every Monday at 08:00</div>
                      </div>
                      <button
                        type="button"
                        aria-label="Toggle weekly digest"
                        onClick={() => void handleToggleWeeklyDigest()}
                        disabled={digestToggleBusy || digestLoading}
                        className={cx("profMiniToggle", weeklyDigestEnabled && "profMiniToggleOn")}
                        style={{ background: "transparent" }}
                      >
                        <span className={cx("profMiniToggleKnob", weeklyDigestEnabled && "profMiniToggleKnobOn")} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className={cx("btnSm", "btnGhost", "flexRow", "flexCenter", "gap6")}
                      onClick={() => void handlePreviewDigest()}
                      disabled={digestPreviewBusy || !session}
                    >
                      <Ic n="eye" sz={12} c="var(--muted)" />
                      {digestPreviewBusy ? "Generating…" : "Preview this week's digest"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "security" ? (
            <>
              {/* ── Stat cards ── */}
              <div className={cx("topCardsStack")}>
                <div className={cx("statCard", securityScore >= 80 ? "statCardGreen" : "statCardAmber")}>
                  <div className={cx("statLabel")}>Security Score</div>
                  <div className={cx("statValue", "fontMono")}>{securityScore}%</div>
                  <div className={cx("statSub")}>{securityEnabledCount}/{Object.keys(securityToggles).length} controls active</div>
                </div>
                <div className={cx("statCard", "statCardPurple")}>
                  <div className={cx("statLabel")}>Active Sessions</div>
                  <div className={cx("statValue", "fontMono")}>{securitySessions.length}</div>
                  <div className={cx("statSub")}>{securitySessions.length === 1 ? "1 device" : `${securitySessions.length} devices`}</div>
                </div>
                <div className={cx("statCard", "statCardAmber")}>
                  <div className={cx("statLabel")}>Team Access</div>
                  <div className={cx("statValue", "fontMono")}>{accessUsers.length}</div>
                  <div className={cx("statSub")}>{accessUsers.length === 1 ? "1 active member" : `${accessUsers.length} active members`}</div>
                </div>
                <div className={cx("statCard", securityAlertCount > 0 ? "statCardAmber" : "statCardGreen")}>
                  <div className={cx("statLabel")}>Alerts</div>
                  <div className={cx("statValue", "fontMono")}>{securityAlertCount}</div>
                  <div className={cx("statSub")}>{securityAlertCount > 0 ? "Review audit log" : "No flagged events"}</div>
                </div>
              </div>

              {/* ── Sub-tab navigation ── */}
              <div className={cx("pillTabs")}>
                {SECURITY_TABS.map((t) => (
                  <button key={t} type="button" className={cx("pillTab", securityTab === t && "pillTabActive")} onClick={() => setSecurityTab(t)}>{t}</button>
                ))}
              </div>
              <div className={cx("card", "p12161616")}>
                <div className={cx("fw600", "text12")}>{securityTab}</div>
                <div className={cx("text11", "colorMuted", "mt4")}>{securityTabBlurb}</div>
              </div>

              {/* ── Overview ── */}
              {securityTab === "Overview" ? (
                <div className={cx("grid2Cols", "gap16")}>
                  <div className={cx("card")}>
                    <div className={cx("cardHd")}>
                      <span className={cx("cardHdTitle")}>Quick Actions</span>
                    </div>
                    <div className={cx("p12161616", "flexRow", "gap8", "flexWrap")}>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setSecurityTab("Two-Factor Auth")}>Set up 2FA</button>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setSecurityTab("Active Sessions")}>Review sessions</button>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setSecurityTab("Access Control")}>Manage access</button>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setSecurityTab("GDPR & Privacy")}>Privacy requests</button>
                    </div>
                  </div>
                  {[
                    { title: "Authentication", sub: "Login & identity controls", keys: ["Two-Factor Authentication", "Login Notifications", "Suspicious IP Alerts", "Magic Link Login"] },
                    { title: "Data & Sessions", sub: "Access and data controls", keys: ["Session Expiry", "Download Logging", "Single Sign-On (SSO)", "Encrypted Storage"] },
                  ].map((grp) => (
                    <div key={grp.title} className={cx("card")}>
                      <div className={cx("cardHd")}>
                        <span className={cx("cardHdTitle")}>{grp.title}</span>
                        <span className={cx("text10", "colorMuted", "mlAuto")}>{grp.sub}</span>
                      </div>
                      <div className={cx("p0161612")}>
                        {grp.keys.map((label, idx) => {
                          const on = securityToggles[label];
                          return (
                            <div key={label} className={cx("settingsSecRow", idx < grp.keys.length - 1 && "borderB")}>
                              <span className={cx("text12")}>{label}</span>
                              <button type="button" className={cx("profToggle", on && "profToggleOn")} onClick={() => setSecurityToggles((prev) => ({ ...prev, [label]: !on }))}>
                                <span className={cx("profToggleKnob", on && "profToggleKnobOn")} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className={cx("card")}>
                    <div className={cx("cardHd")}>
                      <span className={cx("cardHdTitle")}>Session Timeout</span>
                      <span className={cx("text10", "colorMuted", "mlAuto")}>Auto-logout after inactivity</span>
                    </div>
                    <div className={cx("p12161616")}>
                      <div className={cx("grid4Cols", "gap6")}>
                        {["15 min", "30 min", "1 hour", "4 hours", "8 hours", "1 day", "1 week", "Never"].map((value) => (
                          <button key={value} type="button" className={cx("profChoiceBtn", timeoutValue === value && "profChoiceBtnActive")} onClick={() => { setTimeoutValue(value); notify("success", "Timeout updated", `Expires after ${value} of inactivity`); }}>{value}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={cx("card")}>
                    <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Change Password</span></div>
                    <div className={cx("p12x16x16", "flexCol", "gap10")}>
                      {pwChangeSuccess ? (
                        <div className={cx("text12", "colorGreen")}>Password updated successfully. Redirecting to login…</div>
                      ) : (
                        <>
                          <div>
                            <label className={cx("profLabel")}>Current Password</label>
                            <input className={cx("profInput")} type="password" placeholder="••••••••••" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setPwChangeError(""); }} />
                          </div>
                          <div>
                            <label className={cx("profLabel")}>New Password</label>
                            <input className={cx("profInput")} type="password" placeholder="New password" value={password} onChange={(e) => { setPassword(e.target.value); setNewPassword2(e.target.value); setPwChangeError(""); }} />
                            <div className={cx("settingsPwStrengthTrack")}>
                              <div className={cx("pctFillRInherit", "dynBgColor")} style={{ "--pct": `${passwordScore.w}%`, "--bg-color": passwordScore.color } as React.CSSProperties} />
                            </div>
                            {password && <div className={cx("text10", "dynColor", "mt4")} style={{ "--color": passwordScore.color } as React.CSSProperties}>{passwordScore.label}</div>}
                          </div>
                          <div>
                            <label className={cx("profLabel")}>Confirm Password</label>
                            <input className={cx("profInput")} type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPwChangeError(""); }} />
                          </div>
                          {pwChangeError && <div className={cx("text11", "colorRed")}>{pwChangeError}</div>}
                          <button
                            type="button"
                            className={cx("btnSm", "btnAccent", "mt4")}
                            disabled={pwChangeBusy}
                            onClick={async () => {
                              if (!newPassword2 || newPassword2.length < 8) { setPwChangeError("New password must be at least 8 characters."); return; }
                              if (newPassword2 !== confirmPassword) { setPwChangeError("Passwords do not match."); return; }
                              setPwChangeBusy(true);
                              setPwChangeError("");
                              try {
                                const result = await withAuthorizedSession(session!, async (accessToken) => {
                                  const res = await callGateway<{ message: string }>("/auth/password-change", accessToken, {
                                    method: "POST",
                                    body: { currentPassword, newPassword: newPassword2 }
                                  });
                                  if (res.status === 401) return { unauthorized: true, data: null, error: null };
                                  if (!res.payload.success) {
                                    return { unauthorized: false, data: null, error: { code: res.payload.error?.code ?? "ERROR", message: res.payload.error?.message ?? "Password change failed." } };
                                  }
                                  return { unauthorized: false, data: res.payload.data ?? null, error: null };
                                });
                                if (result.error) { setPwChangeError(result.error.message); return; }
                                setPwChangeSuccess(true);
                                setCurrentPassword(""); setNewPassword2(""); setConfirmPassword(""); setPassword("");
                                notify("success", "Password updated", "Your new password is active. Signing you out…");
                                setTimeout(() => { window.location.href = "/login"; }, 3000);
                              } catch {
                                setPwChangeError("An unexpected error occurred. Please try again.");
                              } finally {
                                setPwChangeBusy(false);
                              }
                            }}
                          >{pwChangeBusy ? "Updating…" : "Update Password"}</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── Two-Factor Auth ── */}
              {securityTab === "Two-Factor Auth" ? (
                <div className={cx("grid2Cols", "gap16", "py20_0")}>
                  <div className={cx("card")}>
                    <div className={cx("cardHd")}>
                      <span className={cx("cardHdTitle")}>Authentication Method</span>
                      <span className={cx("badge", "badgeAccent", "mlAuto")}>{mfaMethod}</span>
                    </div>
                    <div className={cx("p12161616", "flexCol", "gap12")}>
                      <div className={cx("text11", "colorMuted", "lineH16")}>
                        Choose your primary verification method. Authenticator apps are recommended for strongest account protection.
                      </div>
                      <div className={cx("flexCol", "gap8")}>
                        {[
                          { label: "Authenticator App", icon: "shieldCheck", sub: "Recommended · Google Authenticator / Authy" },
                          { label: "SMS One-Time Pin", icon: "phone", sub: phoneNumber ? `To ${phoneNumber}` : "Phone number required" },
                          { label: "Email OTP", icon: "mail", sub: clientEmail || "Email required" },
                        ].map((method) => {
                          const isActive = mfaMethod === method.label;
                          return (
                            <button
                              key={method.label}
                              type="button"
                              onClick={() => setMfaMethod(method.label)}
                              className={cx("settingsMfaBtn", "dynBgColor", isActive && "settingsMfaBtnActive")}
                              style={{
                                "--bg-color": isActive ? "color-mix(in oklab, var(--lime) 9%, transparent)" : "var(--s3)",
                                "--border-color": isActive ? "var(--lime)" : "var(--b2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "12px",
                                textAlign: "left",
                              } as React.CSSProperties}
                            >
                              <div className={cx("flexRow", "gap10", "alignCenter")}>
                                <div className={cx("settingsMfaIcon")}>
                                  <Ic n={method.icon} sz={16} c={isActive ? "var(--lime)" : "var(--muted2)"} />
                                </div>
                                <div>
                                  <div className={cx("settingsMfaLabel", "dynColor")} style={{ "--color": isActive ? "var(--lime)" : "inherit" } as React.CSSProperties}>{method.label}</div>
                                  <div className={cx("text10", "colorMuted2")}>{method.sub}</div>
                                </div>
                              </div>
                              <span className={cx("badge", isActive ? "badgeGreen" : "badgeMuted")}>{isActive ? "Selected" : "Available"}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className={cx("borderT", "pt12")}>
                        <div className={cx("text11", "fw600", "mb8")}>Setup</div>
                        <div className={cx("text10", "colorMuted", "mb10")}>Complete this step to finish enabling {mfaMethod}.</div>
                      </div>
                      {mfaMethod === "Authenticator App" && (
                        <div className={cx("secuQrWrap")}>
                          {totpQrUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={totpQrUrl} alt="Authenticator QR code" className={cx("secuQrBox")} />
                          ) : (
                            <div className={cx("secuQrBox", "flexCol", "flexCenter", "textCenter", "p12x16x16")}>
                              <Ic n="shieldCheck" sz={20} c="var(--muted2)" />
                              <div className={cx("text10", "colorMuted2", "mt8")}>Load setup secret to generate QR</div>
                            </div>
                          )}
                          <div className={cx("secuQrInfo")}>
                            <div className={cx("secuQrTitle")}>Scan with your authenticator</div>
                            <div className={cx("secuQrDesc")}>Use your authenticator app to scan this QR, then confirm with the 6-digit code below.</div>
                            <div className={cx("flexRow", "gap8", "mt8", "flexWrap")}>
                              <button
                                type="button"
                                className={cx("btnSm", "btnGhost")}
                                disabled={totpSetupBusy}
                                onClick={() => {
                                  if (!session) {
                                    notify("error", "Setup failed", "Please log in again.");
                                    return;
                                  }
                                  setTotpSetupBusy(true);
                                  void setupClient2faWithRefresh(session).then((result) => {
                                    if (result.nextSession) saveSession(result.nextSession);
                                    setTotpSetupBusy(false);
                                    if (result.error || !result.data) {
                                      notify("error", "Setup failed", result.error?.message ?? "Unable to retrieve authenticator secret.");
                                      return;
                                    }
                                    setTotpSecret(result.data.secret);
                                    setTotpQrUrl(result.data.qrCodeDataUrl);
                                    setBackupCodes(result.data.backupCodes);
                                    notify("success", "2FA setup ready", "Authenticator secret and backup codes loaded.");
                                  });
                                }}
                              >
                                {totpSetupBusy ? "Loading…" : "Load Setup Secret"}
                              </button>
                              {totpSecret ? (
                                <button
                                  type="button"
                                  className={cx("btnSm", "btnGhost")}
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(totpSecret);
                                      notify("success", "Copied", "Authenticator secret copied.");
                                    } catch {
                                      notify("error", "Copy failed", "Please copy the secret manually.");
                                    }
                                  }}
                                >
                                  Copy Setup Secret
                                </button>
                              ) : null}
                            </div>
                            {totpSecret ? (
                              <div className={cx("text10", "colorMuted2", "mt8")}>Setup secret: <span className={cx("fontMono")}>{totpSecret}</span></div>
                            ) : null}
                            <div className={cx("secuInlineRow", "mt8")}>
                              <input
                                className={cx("profInput")}
                                placeholder="Enter 6-digit authenticator code"
                                maxLength={6}
                                value={totpVerifyCode}
                                onChange={(e) => setTotpVerifyCode(e.target.value)}
                              />
                              {!twoFaEnabled ? (
                                <button
                                  type="button"
                                  className={cx("btnSm", "btnAccent")}
                                  disabled={totpVerifyBusy || !totpVerifyCode.trim() || !session}
                                  onClick={() => {
                                    if (!session) return;
                                    setTotpVerifyBusy(true);
                                    void verifyClient2faWithRefresh(session, totpVerifyCode.trim()).then((result) => {
                                      if (result.nextSession) saveSession(result.nextSession);
                                      setTotpVerifyBusy(false);
                                      if (result.error) {
                                        notify("error", "Verification failed", result.error.message ?? "Unable to verify authenticator code.");
                                        return;
                                      }
                                      setTwoFaEnabled(true);
                                      setTwoFaEnabledAt(new Date().toISOString());
                                      setTotpVerifyCode("");
                                      notify("success", "2FA enabled", "Authenticator-based 2FA is now active.");
                                    });
                                  }}
                                >
                                  {totpVerifyBusy ? "Verifying…" : "Enable 2FA"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className={cx("btnSm", "btnGhost")}
                                  disabled={twoFaDisableBusy || !session}
                                  onClick={() => {
                                    if (!session || !twoFaDisablePassword.trim()) {
                                      notify("error", "Disable failed", "Enter your account password to disable 2FA.");
                                      return;
                                    }
                                    setTwoFaDisableBusy(true);
                                    void disableClient2faWithRefresh(session, twoFaDisablePassword.trim()).then((result) => {
                                      if (result.nextSession) saveSession(result.nextSession);
                                      setTwoFaDisableBusy(false);
                                      if (result.error) {
                                        notify("error", "Disable failed", result.error.message ?? "Unable to disable 2FA.");
                                        return;
                                      }
                                      setTwoFaEnabled(false);
                                      setTwoFaEnabledAt(null);
                                      setTwoFaDisablePassword("");
                                      setTotpSecret(null);
                                      setTotpQrUrl(null);
                                      notify("success", "2FA disabled", "Authenticator-based 2FA has been disabled.");
                                    });
                                  }}
                                >
                                  {twoFaDisableBusy ? "Disabling…" : "Disable 2FA"}
                                </button>
                              )}
                            </div>
                            {twoFaEnabled ? (
                              <div className={cx("mt8")}>
                                <div className={cx("text10", "colorMuted2")}>2FA status: <span className={cx("colorGreen")}>Enabled</span>{twoFaEnabledAt ? ` · ${formatRelative(twoFaEnabledAt)}` : ""}</div>
                                <input
                                  className={cx("profInput", "mt8")}
                                  type="password"
                                  placeholder="Current password required to disable"
                                  value={twoFaDisablePassword}
                                  onChange={(e) => setTwoFaDisablePassword(e.target.value)}
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                      {mfaMethod === "SMS One-Time Pin" && (
                        <div className={cx("secuSmsVerify")}>
                          <label className={cx("profLabel")}>Verify Phone Number</label>
                          {phoneVerified ? (
                            <div className={cx("flexRow", "gap8", "alignCenter")}>
                              <span className={cx("text12", "colorGreen")}>Phone number verified ✓</span>
                              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => { setPhoneVerified(false); setPhoneOtpSent(false); setPhoneNumber(""); setPhoneOtpCode(""); setPhoneOtpError(""); }}>Change</button>
                            </div>
                          ) : !phoneOtpSent ? (
                            <>
                              <div className={cx("secuInlineRow")}>
                                <input className={cx("profInput")} placeholder="+27 82 345 6789" value={phoneNumber} onChange={(e) => { setPhoneNumber(e.target.value); setPhoneOtpError(""); }} />
                                <button
                                  type="button"
                                  className={cx("btnSm", "btnGhost")}
                                  disabled={phoneOtpBusy}
                                  onClick={async () => {
                                    if (!phoneNumber.trim()) { setPhoneOtpError("Enter a phone number first."); return; }
                                    setPhoneOtpBusy(true);
                                    setPhoneOtpError("");
                                    try {
                                      const result = await withAuthorizedSession(session!, async (accessToken) => {
                                        const res = await callGateway<{ message: string }>("/auth/phone/send-otp", accessToken, {
                                          method: "POST",
                                          body: { phone: phoneNumber.trim() }
                                        });
                                        if (res.status === 401) return { unauthorized: true, data: null, error: null };
                                        if (!res.payload.success) {
                                          return { unauthorized: false, data: null, error: { code: res.payload.error?.code ?? "ERROR", message: res.payload.error?.message ?? "Failed to send OTP." } };
                                        }
                                        return { unauthorized: false, data: res.payload.data ?? null, error: null };
                                      });
                                      if (result.error) { setPhoneOtpError(result.error.message); return; }
                                      setPhoneOtpSent(true);
                                      notify("success", "OTP sent", "Check your SMS messages");
                                    } catch {
                                      setPhoneOtpError("An unexpected error occurred. Please try again.");
                                    } finally {
                                      setPhoneOtpBusy(false);
                                    }
                                  }}
                                >{phoneOtpBusy ? "Sending…" : "Send OTP"}</button>
                              </div>
                              {phoneOtpError && <div className={cx("text11", "colorRed", "mt4")}>{phoneOtpError}</div>}
                            </>
                          ) : (
                            <>
                              <div className={cx("text11", "colorMuted", "mb6")}>OTP sent to {phoneNumber}</div>
                              <div className={cx("secuInlineRow")}>
                                <input className={cx("profInput")} placeholder="6-digit code" maxLength={6} value={phoneOtpCode} onChange={(e) => { setPhoneOtpCode(e.target.value); setPhoneOtpError(""); }} />
                                <button
                                  type="button"
                                  className={cx("btnSm", "btnAccent")}
                                  disabled={phoneOtpBusy}
                                  onClick={async () => {
                                    if (!phoneOtpCode.trim()) { setPhoneOtpError("Enter the 6-digit code."); return; }
                                    setPhoneOtpBusy(true);
                                    setPhoneOtpError("");
                                    try {
                                      const result = await withAuthorizedSession(session!, async (accessToken) => {
                                        const res = await callGateway<{ message: string }>("/auth/phone/verify-otp", accessToken, {
                                          method: "POST",
                                          body: { phone: phoneNumber.trim(), code: phoneOtpCode.trim() }
                                        });
                                        if (res.status === 401) return { unauthorized: true, data: null, error: null };
                                        if (!res.payload.success) {
                                          return { unauthorized: false, data: null, error: { code: res.payload.error?.code ?? "ERROR", message: res.payload.error?.message ?? "OTP verification failed." } };
                                        }
                                        return { unauthorized: false, data: res.payload.data ?? null, error: null };
                                      });
                                      if (result.error) { setPhoneOtpError(result.error.message); return; }
                                      setPhoneVerified(true);
                                      setPhoneOtpCode("");
                                      notify("success", "Phone verified", "Your phone number has been verified successfully.");
                                    } catch {
                                      setPhoneOtpError("An unexpected error occurred. Please try again.");
                                    } finally {
                                      setPhoneOtpBusy(false);
                                    }
                                  }}
                                >{phoneOtpBusy ? "Verifying…" : "Verify"}</button>
                              </div>
                              {phoneOtpError && <div className={cx("text11", "colorRed", "mt4")}>{phoneOtpError}</div>}
                              <button type="button" className={cx("btnSm", "btnGhost", "mt6")} onClick={() => { setPhoneOtpSent(false); setPhoneOtpCode(""); setPhoneOtpError(""); }}>Resend OTP</button>
                            </>
                          )}
                        </div>
                      )}
                      {mfaMethod === "Email OTP" && (
                        <div className={cx("secuSmsVerify")}>
                          <div className={cx("text12", "fw600")}>Email verification channel</div>
                          <div className={cx("text11", "colorMuted", "mt4")}>
                            Login codes will be sent to <span className={cx("fw600")}>{clientEmail || "your account email"}</span>.
                          </div>
                          <div className={cx("text10", "colorMuted2", "mt8")}>
                            Use this when authenticator app or phone-based verification is not available.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={cx("card")}>
                    <div className={cx("cardHd")}>
                      <span className={cx("cardHdTitle")}>Recovery & Backup</span>
                      <span className={cx("text10", "colorMuted", "mlAuto")}>Single-use codes</span>
                    </div>
                    <div className={cx("p12161616", "flexCol", "gap12")}>
                      <div className={cx("flexBetween", "gap10")}>
                        <div>
                          <div className={cx("text11", "fw600")}>Backup codes</div>
                          <div className={cx("text10", "colorMuted")}>{backupCodes.length > 0 ? `${backupCodes.length} codes ready` : "No codes generated"}</div>
                        </div>
                        <span className={cx("badge", backupCodes.length > 0 ? "badgeGreen" : "badgeAmber")}>{backupCodes.length > 0 ? "Ready" : "Pending"}</span>
                      </div>
                      <div className={cx("flexBetween", "gap10")}>
                        <div>
                          <div className={cx("text11", "fw600")}>Phone verification</div>
                          <div className={cx("text10", "colorMuted")}>{phoneVerified ? "Verified for SMS OTP" : "Not verified"}</div>
                        </div>
                        <span className={cx("badge", phoneVerified ? "badgeGreen" : "badgeMuted")}>{phoneVerified ? "Verified" : "Optional"}</span>
                      </div>
                      <div className={cx("borderT", "pt12")}>
                        <div className={cx("text11", "fw600", "mb8")}>Emergency Backup Codes</div>
                        <div className={cx("text10", "colorMuted", "mb10")}>Store these offline in a password manager. Each code can be used once.</div>
                      </div>
                      {backupCodes.length === 0 ? (
                        <div className={cx("text11", "colorMuted")}>No backup codes generated yet for this session.</div>
                      ) : (
                        <div className={cx("secuCodeGrid")}>
                          {backupCodes.map((code) => (
                            <span key={code} className={cx("secuCodeItem")}>{code}</span>
                          ))}
                        </div>
                      )}
                      <div className={cx("flexRow", "gap8", "mt14")}>
                        <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => {
                          setBackupCodes(makeBackupCodes());
                          notify("success", "Codes generated", "Store them in a secure password manager.");
                        }}>{backupCodes.length > 0 ? "Regenerate" : "Generate"}</button>
                        <button type="button" className={cx("btnSm", "btnGhost")} onClick={async () => {
                          const codes = backupCodes;
                          if (codes.length === 0) {
                            notify("info", "No codes", "Generate backup codes first.");
                            return;
                          }
                          try {
                            await navigator.clipboard.writeText(codes.join("\n"));
                            notify("success", "Backup codes copied", "Store them in a secure password manager.");
                          } catch {
                            notify("error", "Clipboard not available", "Copy the codes manually.");
                          }
                        }}>Copy Codes</button>
                        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => {
                          const codes = backupCodes;
                          if (codes.length === 0) {
                            notify("info", "No codes", "Generate backup codes first.");
                            return;
                          }
                          const text = "Maphari Emergency Backup Codes\n" + "=".repeat(30) + "\n\n" + codes.join("\n") + "\n\nStore these in a secure location. Each code can only be used once.";
                          const blob = new Blob([text], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "maphari-backup-codes.txt";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          notify("success", "Downloaded", "backup-codes.txt saved to your device.");
                        }}>Download</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── Active Sessions ── */}
              {securityTab === "Active Sessions" ? (
                <div className={cx("grid2Cols", "gap16")}>
                  <div className={cx("card")}>
                    <div className={cx("cardHd")}>
                      <span className={cx("cardHdTitle")}>Devices & Sessions</span>
                    </div>
                    <div className={cx("listGroup")}>
                      {securitySessions.length === 0 ? (
                        <div className={cx("emptyState", "py24")}>
                          <div className={cx("emptyStateTitle")}>No active sessions found</div>
                          <div className={cx("emptyStateSub")}>Session activity will appear here once devices authenticate.</div>
                        </div>
                      ) : (
                        securitySessions.map((session) => (
                          <div key={session.id} className={cx("listRow", "gap12", "flexAlignStart")}>
                            <div className={cx("emoji22noShrink")}>{session.icon ?? "💻"}</div>
                            <div className={cx("flex1")}>
                              <div className={cx("fw600", "text12")}>{session.device}</div>
                              <div className={cx("text10", "colorMuted")}>{session.location} · {session.ip}</div>
                              <div className={cx("text10", "colorMuted")}>Last active {formatRelative(session.lastActiveAt)}</div>
                              <span className={cx("badge", session.current ? "badgeGreen" : "badgeMuted", "mt6", "inlineBlock")}>
                                {session.current ? "Current session" : "Previously active"}
                              </span>
                            </div>
                            {!session.current ? <span className={cx("badge", "badgeMuted")}>Other session</span> : null}
                          </div>
                        ))
                      )}
                    </div>
                    <div className={cx("p12161616", "borderT")}>
                      <div className={cx("text10", "colorMuted", "mb8")}>This signs out every device including your current one.</div>
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost")}
                        disabled={signingOutAll}
                        onClick={() => { void handleSignOutAll(); }}
                      >
                        {signingOutAll ? "Signing out…" : "Sign out all devices"}
                      </button>
                    </div>
                  </div>

                  <div className={cx("card")}>
                    <div className={cx("cardHd")}>
                      <span className={cx("cardHdTitle")}>File Access Control</span>
                      <span className={cx("text10", "colorMuted", "mlAuto")}>Document-level permissions</span>
                    </div>
                    <div className={cx("emptyState", "py24")}>
                      <div className={cx("emptyStateTitle")}>No documents configured</div>
                      <div className={cx("emptyStateSub")}>Document-level permissions will appear here once files are shared.</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── Access Control ── */}
              {securityTab === "Access Control" ? (
                <div className={cx("card")}>
                  <div className={cx("cardHd")}>
                    <span className={cx("cardHdTitle")}>Role-Based Access</span>
                    <button type="button" className={cx("btnSm", "btnAccent", "mlAuto")} onClick={() => setInviteModalOpen(true)}>+ Invite User</button>
                  </div>
                  <div className={cx("pCustom0161616")}>
                  <div className={cx("secuRbacTableHead")}><span>User</span><span>View</span><span>Comment</span><span>Approve</span><span>Download</span></div>
                  <div className={cx("secuRbacRows")}>
                    {accessUsers.length === 0 ? (
                      <div className={cx("emptyState", "py24")}>
                        <div className={cx("emptyStateTitle")}>No team members yet</div>
                        <div className={cx("emptyStateSub")}>Invite users to grant them portal access.</div>
                      </div>
                    ) : accessUsers.map((user, userIndex) => (
                      <div key={user.name} className={cx("secuRbacRow")}>
                        <div>
                          <div className={cx("fw600", "text12")}>{user.name}</div>
                          <div className={cx("text10", "colorMuted")}>{user.role}</div>
                        </div>
                        {(["view", "comment", "approve", "download"] as const).map((permission) => (
                          <button key={`${user.name}-${permission}`} type="button" className={cx("secuPermBtn", user[permission] && "secuPermBtnOn")} onClick={() => toggleAccessPermission(userIndex, permission)}>
                            {user[permission] ? "✓" : "—"}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
              ) : null}

              {/* ── Audit Log ── */}
              {securityTab === "Audit Log" ? (
                <div className={cx("card")}>
                  <div className={cx("cardHd")}>
                    <span className={cx("cardHdTitle")}>Audit Log</span>
                    <div className={cx("pillTabs", "mlAuto", "gap4")}>
                      {(["All", "Ok", "Info", "Warn", "Critical"] as const).map((filter) => (
                        <button key={filter} type="button" className={cx("pillTab", auditFilter === filter && "pillTabActive", "p3x10", "fs11")} onClick={() => setAuditFilter(filter)}>{filter}</button>
                      ))}
                    </div>
                  </div>
                  <div className={cx("pCustom0161616")}>
                    <div className={cx("secuAuditTableHead")}><span>Timestamp</span><span>Event</span><span>User</span><span>Severity</span></div>
                    <div className={cx("secuAuditRows")}>
                      {filteredAudit.length === 0 ? (
                        <div className={cx("emptyState", "py24")}>
                          <div className={cx("emptyStateTitle")}>No audit events yet</div>
                          <div className={cx("emptyStateSub")}>Security events will appear here as they occur.</div>
                        </div>
                      ) : filteredAudit.map((event) => (
                        <div key={`${event.time}-${event.event}-${event.user}`} className={cx("flexBetween", "gap12", "py10", "borderB")}>
                          <span className={cx("fontMono", "text10", "flex1")}>{event.time}</span>
                          <span className={cx("text11", "flex1")}>{event.event}</span>
                          <span className={cx("text11", "colorMuted", "flex1")}>{event.user}</span>
                          <span className={cx("badge", event.sev === "crit" ? "badgeRed" : event.sev === "warn" ? "badgeAmber" : event.sev === "ok" ? "badgeGreen" : "badgeMuted")}>{event.sev.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── GDPR & Privacy ── */}
              {securityTab === "GDPR & Privacy" ? (
                <div className={cx("grid2Cols", "gap16", "py20_0")}>
                  <div className={cx("card")}>
                    <div className={cx("cardHd")}>
                      <span className={cx("cardHdTitle")}>Privacy Control Center</span>
                      <span className={cx("badge", "badgeGreen", "mlAuto")}>Compliant</span>
                    </div>
                    <div className={cx("p12161616", "flexCol", "gap12")}>
                      <div className={cx("text11", "colorMuted", "lineH16")}>
                        Manage your legal rights, data lifecycle, and export or deletion requests from one place.
                      </div>
                      <div className={cx("grid2Cols12Gap")}>
                        <div className={cx("card", "p12x16x16")}>
                          <div className={cx("text10", "colorMuted")}>Available Requests</div>
                          <div className={cx("text14", "fw700")}>{GDPR_ITEMS.filter((item) => Boolean(item.action)).length}</div>
                        </div>
                        <div className={cx("card", "p12x16x16")}>
                          <div className={cx("text10", "colorMuted")}>High-Risk Actions</div>
                          <div className={cx("text14", "fw700")}>{GDPR_ITEMS.filter((item) => item.danger).length}</div>
                        </div>
                      </div>
                      <div className={cx("borderT", "pt12", "flexCol", "gap8")}>
                        <div className={cx("text11", "fw600")}>Data Subject Requests</div>
                        {GDPR_ITEMS.filter((item) => Boolean(item.action)).map((item) => (
                          <div key={item.title} className={cx("flexBetween", "gap10", "py10", "borderB")}>
                            <div className={cx("flexRow", "gap10", "alignCenter")}>
                              <Ic n={item.danger ? "trash" : "download"} sz={16} c={item.danger ? "var(--red)" : "var(--accent)"} />
                              <div>
                                <div className={cx("text12", "fw600")}>{item.title}</div>
                                <div className={cx("text10", "colorMuted")}>{item.desc}</div>
                              </div>
                            </div>
                            <button type="button" className={cx("btnSm", item.danger ? "btnGhost" : "btnAccent")} onClick={() => setGdprTarget(item)}>
                              {item.action}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={cx("card")}>
                    <div className={cx("cardHd")}>
                      <span className={cx("cardHdTitle")}>Compliance & Retention</span>
                      <span className={cx("text10", "colorMuted", "mlAuto")}>Policy status</span>
                    </div>
                    <div className={cx("p12161616", "flexCol", "gap8")}>
                      {GDPR_ITEMS.filter((item) => !item.action).map((item) => (
                        <div key={item.title} className={cx("flexBetween", "gap10", "py12", "borderB")}>
                          <div className={cx("flexRow", "gap10", "alignCenter", "flex1")}>
                            <Ic
                              n={item.tone === "green" ? "shieldCheck" : item.tone === "amber" ? "clock" : item.tone === "red" ? "alert" : "settings"}
                              sz={16}
                              c={item.tone === "green" ? "var(--green)" : item.tone === "amber" ? "var(--amber)" : item.tone === "red" ? "var(--red)" : "var(--muted2)"}
                            />
                            <div>
                              <div className={cx("text12", "fw600")}>{item.title}</div>
                              <div className={cx("text10", "colorMuted")}>{item.desc}</div>
                            </div>
                          </div>
                          <span className={cx("badge", item.tone === "green" ? "badgeGreen" : item.tone === "amber" ? "badgeAmber" : item.tone === "red" ? "badgeRed" : "badgePurple")}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {activeTab === "language" ? (
            <div className={cx("profStack16")}>
              <section className={cx("card", "profCard", "profCardNarrow")}>
                <div className={cx("profCardHeader")}>
                  <div>
                    <div className={cx("profCardTitle")}>Language</div>
                    <div className={cx("profCardSub")}>Choose your preferred portal language.</div>
                  </div>
                </div>
                <div className={cx("profChoiceGrid2")}>
                  {LANGUAGES.map((language) => (
                    <button
                      key={language}
                      type="button"
                      className={cx("profChoiceBtn", selectedLanguage === language && "profChoiceBtnActive")}
                      onClick={() => {
                        setSelectedLanguage(language);
                        markChanged();
                      }}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </section>

              <section className={cx("card", "profCard", "profCardNarrow")}> 
                <div className={cx("profCardHeader")}>
                  <div className={cx("profCardTitle")}>Region & Currency</div>
                </div>

                <label className={cx("profLabel")}>Time Zone</label>
                <select
                  className={cx("profInput")}
                  value={selectedTimezone}
                  onChange={(event) => {
                    setSelectedTimezone(event.target.value);
                    markChanged();
                  }}
                >
                  <option>Africa/Johannesburg (UTC+2)</option>
                  <option>Africa/Lagos (UTC+1)</option>
                  <option>Europe/London (UTC+0)</option>
                  <option>America/New_York (UTC-5)</option>
                </select>

                <label className={cx("profLabel")}>Currency</label>
                <select
                  className={cx("profInput")}
                  value={currency}
                  onChange={(event) => {
                    onCurrencyChange?.(event.target.value);
                    markChanged();
                  }}
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>

                <label className={cx("profLabel")}>Date Format</label>
                <div className={cx("profChoiceGrid3")}>
                  {DATE_FORMATS.map((format) => (
                    <button
                      key={format}
                      type="button"
                      className={cx("profChoiceBtn", selectedDateFormat === format && "profChoiceBtnActive")}
                      onClick={() => {
                        setSelectedDateFormat(format);
                        markChanged();
                      }}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </div>

      {inviteModalOpen ? (
        <div className={cx("secuModalBackdrop")} onClick={() => setInviteModalOpen(false)}>
          <div className={cx("secuModal")} onClick={(event) => event.stopPropagation()}>
            <div className={cx("secuModalHeader")}>
              <div className={cx("secuModalTitle")}>Invite User</div>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setInviteModalOpen(false)}>Close</button>
            </div>
            <div className={cx("secuModalBody")}>
              <div>
                <div className={cx("text11", "fw600", "mb6")}>Email Address</div>
                <input className={cx("input")} placeholder="colleague@company.co.za" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
              <div>
                <div className={cx("text11", "fw600", "mb6")}>Full Name</div>
                <input className={cx("input")} placeholder="First and last name" value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} />
              </div>
              <div>
                <div className={cx("text11", "fw600", "mb8")}>Role</div>
                <div className={cx("flexRow", "gap6", "flexWrap")}>
                  {(["Owner", "Project Lead", "Designer", "Engineer", "Viewer"] as RoleName[]).map((role) => (
                    <button key={role} type="button" className={cx("btnSm", inviteRole === role ? "btnAccent" : "btnGhost")} onClick={() => setInviteRole(role)}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={cx("secuModalFooter")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setInviteModalOpen(false)}>Cancel</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                disabled={inviteBusy}
                onClick={() => {
                  if (!session || !session.user.clientId) {
                    notify("error", "Invite failed", "Missing client context.");
                    return;
                  }
                  if (!inviteEmail.trim()) {
                    notify("error", "Invite failed", "Email is required.");
                    return;
                  }
                  setInviteBusy(true);
                  void invitePortalTeamMemberWithRefresh(session, session.user.clientId, {
                    email: inviteEmail.trim(),
                    role: inviteRole,
                    name: inviteFullName.trim() || undefined,
                  }).then((result) => {
                    if (result.nextSession) saveSession(result.nextSession);
                    setInviteBusy(false);
                    if (result.error) {
                      notify("error", "Invite failed", result.error.message ?? "Unable to send invitation.");
                      return;
                    }
                    setInviteModalOpen(false);
                    setInviteEmail("");
                    setInviteFullName("");
                    notify("success", "Invite sent", `${inviteEmail.trim()} invited as ${inviteRole}.`);
                  });
                }}
              >
                {inviteBusy ? "Sending…" : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── AI Digest Preview Modal ─────────────────────────────────────── */}
      {digestPreviewOpen && (
        <div className={cx("modalOverlay")} onClick={() => setDigestPreviewOpen(false)}>
          <div className={cx("modalPanel", "w680")} onClick={(e) => e.stopPropagation()} style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <div className={cx("modalHd")}>
              <Ic n="mail" sz={15} c="var(--accent)" />
              <span className={cx("modalTitle", "ml8")}>AI Weekly Digest Preview</span>
              <button type="button" className={cx("modalClose")} onClick={() => setDigestPreviewOpen(false)}>
                <Ic n="close" sz={14} c="var(--muted)" />
              </button>
            </div>
            <div className={cx("modalBody", "p20")}>
              {digestPreviewBusy ? (
                <div className={cx("flexCol", "gap8")}>
                  <div className={cx("skeletonBlock", "skeleH80")} />
                  <div className={cx("skeletonBlock", "skeleH68")} />
                </div>
              ) : (
                <div className={cx("text12", "lineH17", "colorMuted")} style={{ whiteSpace: "pre-wrap" }}>
                  {digestPreviewText}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {gdprTarget ? (
        <div className={cx("secuModalBackdrop")} onClick={() => setGdprTarget(null)}>
          <div className={cx("secuModal")} onClick={(event) => event.stopPropagation()}>
            <div className={cx("secuModalHeader")}>
              <div className={cx("secuModalTitle")}>{gdprTarget.action}</div>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setGdprTarget(null)}>Close</button>
            </div>
            <div className={cx("secuModalBody")}>
              <p className={cx("text12", "colorMuted")}>{gdprTarget.desc}</p>
              {gdprTarget.danger ? <div className={cx("secuDangerBox")}>This action is permanent and irreversible.</div> : null}
            </div>
            <div className={cx("secuModalFooter")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setGdprTarget(null)}>Cancel</button>
              <button
                type="button"
                className={cx("btnSm", gdprTarget.danger ? "btnGhost" : "btnAccent")}
                onClick={async () => {
                  if (!session || !session.user.clientId) {
                    notify("error", "Not authenticated", "Please log in again.");
                    setGdprTarget(null);
                    return;
                  }
                  if (gdprTarget.danger) {
                    // Account deletion — use dedicated endpoint
                    const result = await requestAccountDeletionWithRefresh(session, {
                      confirmation: "DELETE",
                      reason: "User requested via portal",
                    });
                    if (result.nextSession) saveSession(result.nextSession);
                    if (result.error) {
                      notify("error", "Submission failed", result.error.message ?? "Please try again or contact support.");
                    } else {
                      notify("success", `${gdprTarget.action} submitted`, result.data?.message ?? "We will process your request within 5 business days.");
                    }
                  } else {
                    // Data export — use dedicated endpoint
                    const result = await requestDataExportWithRefresh(session, {
                      reason: "User requested via portal",
                    });
                    if (result.nextSession) saveSession(result.nextSession);
                    if (result.error) {
                      notify("error", "Submission failed", result.error.message ?? "Please try again or contact support.");
                    } else {
                      notify("success", `${gdprTarget.action} submitted`, result.data?.message ?? "We will process your request within 5 business days.");
                    }
                  }
                  setGdprTarget(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}


    </div>
  );
}
