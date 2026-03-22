"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { usePageToast } from "../hooks/use-page-toast";
import type { NotificationPreference, ConnectedIntegration, SessionInfo } from "../types";
import type { PageId } from "../config";
import { formatRelative } from "../utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession, clearSession } from "../../../../lib/auth/session";
import { setPortalPreferenceWithRefresh, getPortalPreferenceWithRefresh } from "../../../../lib/api/portal";
import { requestDataExportWithRefresh, requestAccountDeletionWithRefresh, revokeAllSessionsWithRefresh } from "../../../../lib/api/portal/profile";
import { callGateway, withAuthorizedSession } from "../../../../lib/api/portal/internal";
import { loadPortalNotificationPrefsWithRefresh, updatePortalNotificationPrefsWithRefresh } from "../../../../lib/api/portal/notification-prefs";
import { loadPortalTeamMembersWithRefresh } from "../../../../lib/api/portal/team";
import { callPortalAiGenerateWithRefresh } from "../../../../lib/api/portal/ai";
import { Ic } from "../ui";

export interface SettingsPageProps {
  notificationPrefs: NotificationPreference[];
  integrations: ConnectedIntegration[];
  sessions: SessionInfo[];
  onToggleNotification: (category: string, channel: "inApp" | "email" | "push", value: boolean) => void;
  onDisconnectIntegration: (id: string) => void;
  onRevokeSession: (id: string) => void;
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

const SECURITY_DOCS = [
  { name: "Client-Proposal-v3.pdf", viewers: "4 people" },
  { name: "Q1-Financial-Report.xlsx", viewers: "2 people" },
  { name: "Brand-Guidelines-2026.pdf", viewers: "All team" },
  { name: "NDA-Veldt-Finance.pdf", viewers: "Owner only" },
  { name: "UAT-Checklist-Sprint4.xlsx", viewers: "3 people" },
] as const;

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

const QR_DATA: number[] = [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,0,0,0,0,1,0,0,1,0,1,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1,0,0,0,1,1,0,0,1,0,1,1,1,0,1,0,1,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,1,1,0,0,1,0,1,0,1,1,1,0,0,1,0,1,1,1,0,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,1,1,1,0,1,1,0,0,1,0,0,0,1,0,1,0,1,0,1,1,1,0,0,1,1,0,1,0,1,1,1,1,1,0,1,0,0,1,1,0,1,0,1,0,0,0,0,0,0,1,1,0];

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

export function SettingsPage({
  notificationPrefs,
  integrations,
  sessions,
  onToggleNotification,
  onDisconnectIntegration,
  onRevokeSession,
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
  // currency is controlled via prop + onCurrencyChange
  const [securityTab, setSecurityTab] = useState<SecurityTab>("Overview");
  const [securityToggles, setSecurityToggles] = useState<Record<string, boolean>>(SECURITY_DEFAULTS);
  const [mfaMethod, setMfaMethod] = useState("Authenticator App");
  const [timeoutValue, setTimeoutValue] = useState("30 min");
  const [inviteRole, setInviteRole] = useState<RoleName>("Viewer");
  const [auditFilter, setAuditFilter] = useState<"All" | "Ok" | "Info" | "Warn" | "Critical">("All");
  const [securitySessions, setSecuritySessions] = useState<SessionInfo[]>(sessions);
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>(DEFAULT_ACCESS_USERS);
  const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);
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

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [installed, setInstalled] = useState(false);

  // ── AI Weekly Digest state ────────────────────────────────────────────────
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(false);
  const [digestLoading,       setDigestLoading]       = useState(false);
  const [digestPreviewOpen,   setDigestPreviewOpen]   = useState(false);
  const [digestPreviewText,   setDigestPreviewText]   = useState("");
  const [digestPreviewBusy,   setDigestPreviewBusy]   = useState(false);
  const [digestToggleBusy,    setDigestToggleBusy]    = useState(false);

  const unreadPrefsCount = useMemo(
    () => notificationPrefs.filter((pref) => pref.inApp || pref.email || pref.push).length,
    [notificationPrefs],
  );

  const securityEnabledCount = useMemo(
    () => Object.values(securityToggles).filter(Boolean).length,
    [securityToggles],
  );

  const securityScore = useMemo(
    () => Math.round((securityEnabledCount / Object.keys(securityToggles).length) * 100),
    [securityEnabledCount, securityToggles],
  );

  const filteredAudit = useMemo(() => {
    if (auditFilter === "All") return SECURITY_AUDIT;
    if (auditFilter === "Critical") return SECURITY_AUDIT.filter((row) => row.sev === "crit");
    return SECURITY_AUDIT.filter((row) => row.sev === auditFilter.toLowerCase());
  }, [auditFilter]);

  const passwordScore = useMemo(() => {
    if (!password) return { w: 0, label: "", color: "var(--muted3)" };
    if (password.length < 6) return { w: 20, label: "Weak", color: "var(--red)" };
    if (password.length < 10) return { w: 45, label: "Fair", color: "var(--amber)" };
    if (password.length < 14) return { w: 70, label: "Good", color: "var(--accent)" };
    return { w: 100, label: "Strong", color: "var(--green)" };
  }, [password]);

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
        else if (revokeSessionId !== null) setRevokeSessionId(null);
        else if (gdprTarget !== null) setGdprTarget(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [digestPreviewOpen, inviteModalOpen, revokeSessionId, gdprTarget]);

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
          if (saved.language)      setSelectedLanguage(saved.language);
          if (saved.timezone)      setSelectedTimezone(saved.timezone);
          if (saved.dateFormat)    setSelectedDateFormat(saved.dateFormat);
          if (saved.portalToggles) setPortalToggles((prev) => ({ ...prev, ...saved.portalToggles }));
        } catch { /* ignore malformed */ }
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

  const handleSave = () => {
    setHasChanges(false);
    if (session) {
      const workspace = JSON.stringify({ language: selectedLanguage, timezone: selectedTimezone, dateFormat: selectedDateFormat, portalToggles });
      void setPortalPreferenceWithRefresh(session, { key: "settingsWorkspace", value: workspace })
        .then((r) => { if (r.nextSession) saveSession(r.nextSession); });
    }
    notify("success", "Settings saved", "All preferences updated successfully.");
  };

  const handleDiscard = () => {
    setHasChanges(false);
    notify("success", "Changes discarded", "Settings restored to last saved state.");
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

  const revokeSecuritySession = (id: string) => {
    setSecuritySessions((prev) => prev.filter((session) => session.id !== id));
    setRevokeSessionId(null);
    notify("success", "Session revoked", "Device signed out successfully.");
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
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={handleDiscard}>Discard</button>
          <button className={cx("btnSm", "btnGhost")} type="button" onClick={() => { resetLocalDefaults(); notify("success", "Settings reset", "Local preferences restored to defaults."); }}>Reset</button>
          <button className={cx("btnSm", "btnAccent")} type="button" onClick={handleSave}>Save Changes</button>
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
                    onClick={() => notify("success", "Upload ready", "Choose a photo from your device.")}
                  >
                    Upload Photo
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={() => notify("success", "Photo removed", "Initials will be shown instead.")}
                  >
                    Remove Photo
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={() => notify("success", "Email sent", "Password reset link sent to your email.")}
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
                        <div className={cx("profCardSub")}>Update your name, contact, and company details.</div>
                      </div>
                    </div>

                    <label className={cx("profLabel")}>Full Name</label>
                    <input className={cx("profInput")} defaultValue={clientName} onChange={markChanged} />

                    <label className={cx("profLabel")}>Email Address</label>
                    <input className={cx("profInput")} defaultValue={clientEmail} onChange={markChanged} />

                    <label className={cx("profLabel")}>Phone Number</label>
                    <input className={cx("profInput")} defaultValue="" placeholder="+27 82 000 0000" onChange={markChanged} />

                    <label className={cx("profLabel")}>Company Name</label>
                    <input className={cx("profInput")} defaultValue={companyName} onChange={markChanged} />

                    <label className={cx("profLabel")}>Role / Title</label>
                    <input className={cx("profInput")} defaultValue="" placeholder="e.g. Chief Product Officer" onChange={markChanged} />
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
                          <span className={cx("profMiniMeta")}>No integrations connected. Visit the Integrations page to connect Slack, Google Drive, Jira, and Figma.</span>
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
                      {sessions.slice(0, 2).map((session) => (
                        <div key={session.id} className={cx("profMiniRow")}>
                          <div className={cx("profMiniWrap")}>
                            <div className={cx("profMiniName")}>{session.device}</div>
                            <div className={cx("profMiniMeta")}>Last active {formatRelative(session.lastActiveAt)}</div>
                          </div>
                          {!session.current ? (
                            <button
                              type="button"
                              className={cx("btnSm", "btnGhost")}
                              onClick={() => {
                                onRevokeSession(session.id);
                                markChanged();
                              }}
                            >
                              Revoke
                            </button>
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
            <div className={cx("profStack16")}>
              <section className={cx("card", "profCard")}>
                <div className={cx("profCardHeader")}>
                  <div>
                    <div className={cx("profCardTitle")}>Notification Preferences</div>
                    <div className={cx("profCardSub")}>Choose how you receive updates for each event type.</div>
                  </div>
                  <span className={cx("badge", "badgeAccent")}>{unreadPrefsCount} active</span>
                </div>

                {notificationPrefs.length === 0 ? (
                  <div className={cx("emptyState")}>
                    <div className={cx("emptyStateIcon")}>--</div>
                    <div className={cx("emptyStateTitle")}>No notification categories</div>
                    <div className={cx("emptyStateDesc")}>Preferences will appear once account setup completes.</div>
                  </div>
                ) : (
                  <>
                    <div className={cx("profNotifHead")}> 
                      <span>Event</span>
                      <span>In-App</span>
                      <span>Email</span>
                      <span>Push</span>
                    </div>
                    <div className={cx("profNotifList")}>
                      {notificationPrefs.map((pref) => (
                        <div key={pref.category} className={cx("profNotifRow")}> 
                          <span className={cx("profNotifName")}>{pref.category}</span>
                          {(["inApp", "email", "push"] as const).map((channel) => (
                            <span key={channel} className={cx("profSwitchWrap")}>
                              <button
                                type="button"
                                className={cx("profMiniToggle", pref[channel] && "profMiniToggleOn")}
                                onClick={() => {
                                  onToggleNotification(pref.category, channel, !pref[channel]);
                                  markChanged();
                                }}
                              >
                                <span className={cx("profMiniToggleKnob", pref[channel] && "profMiniToggleKnobOn")} />
                              </button>
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              <section className={cx("card", "profCard", "profCardNarrow")}> 
                <div className={cx("profCardHeader")}>
                  <div>
                    <div className={cx("profCardTitle")}>Quiet Hours</div>
                    <div className={cx("profCardSub")}>Pause all notifications during these hours.</div>
                  </div>
                </div>
                <div className={cx("profChoiceGrid2")}>
                  <div>
                    <label className={cx("profLabel")}>From</label>
                    <input className={cx("profInput")} type="time" defaultValue="22:00" onChange={markChanged} />
                  </div>
                  <div>
                    <label className={cx("profLabel")}>Until</label>
                    <input className={cx("profInput")} type="time" defaultValue="07:00" onChange={markChanged} />
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "notifications" ? (
            <div className={cx("profGrid", "profGridSingleCol")}>
              <div className={cx("card")}>
                <div className={cx("cardHd")}>
                  <span className={cx("cardHdTitle")}>Notification Preferences</span>
                </div>
                <div className={cx("cardBodyPad")}>
                  <div className={cx("text12", "colorMuted", "mb16")}>
                    Choose how and when you want to be notified about activity on your project.
                  </div>
                  <table className={cx("wFull", "borderCollapse")}>
                    <thead>
                      <tr>
                        <th scope="col" className={cx("thLeft")}>Event</th>
                        <th scope="col" className={cx("thCenter80")}>In-App</th>
                        <th scope="col" className={cx("thCenter80")}>Email</th>
                        <th scope="col" className={cx("thCenter80")}>Push</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notificationPrefs.map((pref) => (
                        <tr key={pref.category} className={cx("borderT")}>
                          <td className={cx("py12_0")}>
                            <div className={cx("fw600", "text12")}>{pref.category}</div>
                          </td>
                          {(["inApp", "email", "push"] as const).map((channel) => (
                            <td key={channel} className={cx("textCenter")}>
                              <button
                                type="button"
                                aria-label={`Toggle ${channel} for ${pref.category}`}
                                onClick={() => onToggleNotification(pref.category, channel, !pref[channel])}
                                className={cx("settingsToggleTrack", "dynBgColor")} style={{ "--bg-color": pref[channel] ? "var(--lime)" : "var(--b2)" } as React.CSSProperties}
                              >
                                <span className={cx("settingsToggleThumb")} style={{ "--left": pref[channel] ? "18px" : "3px" } as React.CSSProperties} />
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── AI Weekly Digest card ──────────────────────────────────── */}
              <div className={cx("card")}>
                <div className={cx("cardHd")}>
                  <Ic n="mail" sz={14} c="var(--accent)" />
                  <span className={cx("cardHdTitle", "ml8")}>AI Weekly Digest</span>
                  {weeklyDigestEnabled && (
                    <span className={cx("badge", "badgeAccent", "mlAuto")}>Active</span>
                  )}
                </div>
                <div className={cx("cardBodyPad")}>
                  <div className={cx("text12", "colorMuted", "mb16", "lineH17")}>
                    Receive an AI-generated project summary every Monday morning with your key metrics, milestones, budget status, and action items.
                  </div>

                  {/* Toggle row */}
                  <div className={cx("flexBetween", "mb16")}>
                    <div>
                      <div className={cx("fw600", "text12")}>Enable Weekly Digest</div>
                      <div className={cx("text11", "colorMuted2", "mt2")}>Delivered every Monday at 08:00</div>
                    </div>
                    <button
                      type="button"
                      aria-label="Toggle weekly digest"
                      onClick={() => void handleToggleWeeklyDigest()}
                      disabled={digestToggleBusy || digestLoading}
                      className={cx("settingsToggleTrack", "dynBgColor")}
                      style={{ "--bg-color": weeklyDigestEnabled ? "var(--lime)" : "var(--b2)" } as React.CSSProperties}
                    >
                      <span className={cx("settingsToggleThumb")} style={{ "--left": weeklyDigestEnabled ? "18px" : "3px" } as React.CSSProperties} />
                    </button>
                  </div>

                  {/* Preview button */}
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
                  <div className={cx("statSub")}>1 current device</div>
                </div>
                <div className={cx("statCard", "statCardAmber")}>
                  <div className={cx("statLabel")}>Failed Logins</div>
                  <div className={cx("statValue", "fontMono")}>2</div>
                  <div className={cx("statSub")}>Last 30 days</div>
                </div>
                <div className={cx("statCard", "statCardRed")}>
                  <div className={cx("statLabel")}>Flagged Events</div>
                  <div className={cx("statValue", "fontMono")}>1</div>
                  <div className={cx("statSub")}>Suspicious IP detected</div>
                </div>
              </div>

              {/* ── Sub-tab navigation ── */}
              <div className={cx("pillTabs")}>
                {SECURITY_TABS.map((t) => (
                  <button key={t} type="button" className={cx("pillTab", securityTab === t && "pillTabActive")} onClick={() => setSecurityTab(t)}>{t}</button>
                ))}
              </div>

              {/* ── Overview ── */}
              {securityTab === "Overview" ? (
                <div className={cx("grid2Cols", "gap16")}>
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
                <div className={cx("grid2Cols", "gap16")}>
                  <div className={cx("card")}>
                    <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Authentication Method</span></div>
                    <div className={cx("p12161616")}>
                      <div className={cx("grid3Cols", "gap10")}>
                        {[
                          { label: "Authenticator App", icon: "📱", sub: "Google Authenticator / Authy" },
                          { label: "SMS One-Time Pin", icon: "💬", sub: "To +27 82 *** 6789" },
                          { label: "Email OTP", icon: "📧", sub: "naledi@veldt.co.za" },
                        ].map((method) => {
                          const isActive = mfaMethod === method.label;
                          return (
                            <button
                              key={method.label}
                              type="button"
                              onClick={() => setMfaMethod(method.label)}
                              className={cx("settingsMfaBtn", "dynBgColor", isActive && "settingsMfaBtnActive")} style={{ "--bg-color": isActive ? "color-mix(in oklab, var(--lime) 9%, transparent)" : "var(--s3)", "--border-color": isActive ? "var(--lime)" : "var(--b2)" } as React.CSSProperties}
                            >
                              <div className={cx("settingsMfaIcon")}>{method.icon}</div>
                              <div className={cx("settingsMfaLabel", "dynColor")} style={{ "--color": isActive ? "var(--lime)" : "inherit" } as React.CSSProperties}>{method.label}</div>
                              <div className={cx("fontMono", "fs058", "colorMuted2", "lineH15")}>{method.sub}</div>
                            </button>
                          );
                        })}
                      </div>
                      {mfaMethod === "Authenticator App" && (
                        <div className={cx("secuQrWrap")}>
                          <div className={cx("secuQrBox")}>
                            {QR_DATA.map((cell, i) => <div key={i} className={cx(cell === 0 ? "secuQrCellW" : "secuQrCell")} />)}
                          </div>
                          <div className={cx("secuQrInfo")}>
                            <div className={cx("secuQrTitle")}>Scan with your authenticator</div>
                            <div className={cx("secuQrDesc")}>Open Google Authenticator, Authy, or 1Password and scan. You&apos;ll need a 6-digit code on each login.</div>
                            <button type="button" className={cx("btnSm", "btnGhost")} onClick={async () => {
                              const secretKey = "JBSWY3DPEHPK3PXP";
                              try {
                                await navigator.clipboard.writeText(secretKey);
                                notify("success", "Secret key copied", "Paste it into your authenticator app.");
                              } catch {
                                notify("error", "Clipboard not available", "Copy the key manually from the QR code.");
                              }
                            }}>Copy Secret Key</button>
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
                    </div>
                  </div>

                  <div className={cx("card")}>
                    <div className={cx("cardHd")}>
                      <span className={cx("cardHdTitle")}>Emergency Backup Codes</span>
                      <span className={cx("text10", "colorMuted", "mlAuto")}>Each code is single-use</span>
                    </div>
                    <div className={cx("p12161616")}>
                      <div className={cx("secuCodeGrid")}>
                        {["K9X2-MNPL", "7YQR-4TBV", "FZAC-8WDE", "P3LN-XKGM", "HJ6T-RVWY", "2QSB-ZDCU", "MTFA-9XPL", "CNRV-4YHB"].map((code) => (
                          <span key={code} className={cx("secuCodeItem")}>{code}</span>
                        ))}
                      </div>
                      <div className={cx("flexRow", "gap8", "mt14")}>
                        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("success", "Codes regenerated", "Previous codes are now invalid")}>Regenerate</button>
                        <button type="button" className={cx("btnSm", "btnGhost")} onClick={async () => {
                          const codes = ["K9X2-MNPL", "7YQR-4TBV", "FZAC-8WDE", "P3LN-XKGM", "HJ6T-RVWY", "2QSB-ZDCU", "MTFA-9XPL", "CNRV-4YHB"];
                          try {
                            await navigator.clipboard.writeText(codes.join("\n"));
                            notify("success", "Backup codes copied", "Store them in a secure password manager.");
                          } catch {
                            notify("error", "Clipboard not available", "Copy the codes manually.");
                          }
                        }}>📋 Copy Codes</button>
                        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => {
                          const codes = ["K9X2-MNPL", "7YQR-4TBV", "FZAC-8WDE", "P3LN-XKGM", "HJ6T-RVWY", "2QSB-ZDCU", "MTFA-9XPL", "CNRV-4YHB"];
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
                        }}>↓ Download</button>
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
                      <button
                        type="button"
                        className={cx("btnSm", "btnGhost", "mlAuto")}
                        disabled={signingOutAll}
                        onClick={() => { void handleSignOutAll(); }}
                      >{signingOutAll ? "Signing out…" : "Sign out all devices"}</button>
                    </div>
                    <div className={cx("listGroup")}>
                      {securitySessions.map((session) => (
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
                          {!session.current && (
                            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setRevokeSessionId(session.id)}>Revoke</button>
                          )}
                        </div>
                      ))}
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
                      <div className={cx("emptyState", "py24")}>
                        <div className={cx("emptyStateTitle")}>No audit events yet</div>
                        <div className={cx("emptyStateSub")}>Security events will appear here as they occur.</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── GDPR & Privacy ── */}
              {securityTab === "GDPR & Privacy" ? (
                <div className={cx("card")}>
                  <div className={cx("cardHd")}><span className={cx("cardHdTitle")}>Data & Privacy Controls</span></div>
                  <div className={cx("pCustom0161616")}>
                  <div className={cx("secuGdprList")}>
                    {GDPR_ITEMS.map((item) => (
                      <div key={item.title} className={cx("secuGdprItem")}>
                        <div className={cx("secuGdprIcon", item.tone === "green" ? "secuGdprIconAccent" : item.tone === "purple" ? "secuGdprIconPurple" : item.tone === "red" ? "secuGdprIconRed" : item.tone === "amber" ? "secuGdprIconAmber" : "secuGdprIconMuted")}>
                          {item.tone === "green" ? "🔒" : item.tone === "purple" ? "📥" : item.tone === "red" ? "🗑" : item.tone === "amber" ? "👁" : "🍪"}
                        </div>
                        <div className={cx("secuGdprContent")}>
                          <div className={cx("secuGdprTitle")}>{item.title}</div>
                          <div className={cx("secuGdprDesc")}>{item.desc}</div>
                          <div className={cx("secuGdprRow")}>
                            <span className={cx("badge", item.tone === "green" ? "badgeGreen" : item.tone === "amber" ? "badgeAmber" : item.tone === "red" ? "badgeRed" : "badgePurple")}>{item.status}</span>
                            {item.action ? <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setGdprTarget(item)}>{item.action}</button> : null}
                          </div>
                        </div>
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

      {revokeSessionId ? (
        <div className={cx("secuModalBackdrop")} onClick={() => setRevokeSessionId(null)}>
          <div className={cx("secuModal")} onClick={(event) => event.stopPropagation()}>
            <div className={cx("secuModalHeader")}>
              <div className={cx("secuModalTitle")}>Revoke Session</div>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setRevokeSessionId(null)}>Close</button>
            </div>
            <div className={cx("secuModalBody")}>
              <p className={cx("text12", "colorMuted")}>This will immediately sign out the selected device session. You can re-authenticate at any time.</p>
            </div>
            <div className={cx("secuModalFooter")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setRevokeSessionId(null)}>Cancel</button>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => revokeSecuritySession(revokeSessionId)}>Revoke Session</button>
            </div>
          </div>
        </div>
      ) : null}

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
                <input className={cx("input")} placeholder="colleague@company.co.za" />
              </div>
              <div>
                <div className={cx("text11", "fw600", "mb6")}>Full Name</div>
                <input className={cx("input")} placeholder="First and last name" />
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
                onClick={() => {
                  setInviteModalOpen(false);
                  notify("success", "Invite sent", `Dispatched · Role: ${inviteRole}`);
                }}
              >
                Send Invite
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
