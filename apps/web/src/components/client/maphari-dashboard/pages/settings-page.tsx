"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import type { NotificationPreference, ConnectedIntegration, SessionInfo } from "../types";
import { formatRelative } from "../utils";

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
}

type SettingsTab = "profile" | "appearance" | "dashboard" | "notifications" | "language" | "security";
type SecurityTab = "Overview" | "Two-Factor Auth" | "Active Sessions" | "Access Control" | "Audit Log" | "GDPR & Privacy";
type RoleName = "Owner" | "Project Lead" | "Designer" | "Engineer" | "Viewer";
type ToastState = { text: string; sub: string } | null;

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

const DEFAULT_ACCESS_USERS: AccessUser[] = [
  { name: "Naledi Dlamini", role: "Owner", view: true, comment: true, approve: true, download: true },
  { name: "Sipho Ndlovu", role: "Project Lead", view: true, comment: true, approve: true, download: true },
  { name: "Lerato Mokoena", role: "Designer", view: true, comment: true, approve: false, download: true },
  { name: "James Mahlangu", role: "Engineer", view: true, comment: false, approve: false, download: false },
  { name: "Thabo Khumalo", role: "Engineer", view: true, comment: true, approve: false, download: true },
];

const SECURITY_AUDIT: AuditEntry[] = [
  { time: "Today 14:32", event: "Login successful", detail: "Chrome · macOS · Johannesburg", user: "naledi@veldt.co.za", sev: "ok" },
  { time: "Today 11:08", event: "Document downloaded", detail: "Proposal-v3.pdf", user: "naledi@veldt.co.za", sev: "info" },
  { time: "Today 09:15", event: "Invoice approved", detail: "INV-2026-010 · R 22,000", user: "naledi@veldt.co.za", sev: "info" },
  { time: "Feb 20 16:44", event: "Failed login attempt", detail: "Unknown device · Firefox · Cape Town", user: "naledi@veldt.co.za", sev: "warn" },
  { time: "Feb 20 16:42", event: "Failed login attempt", detail: "Unknown device · Firefox · Cape Town", user: "naledi@veldt.co.za", sev: "warn" },
  { time: "Feb 19 13:21", event: "Password changed", detail: "Via settings page", user: "naledi@veldt.co.za", sev: "info" },
  { time: "Feb 18 09:41", event: "New session opened", detail: "Chrome · Windows · Cape Town", user: "naledi@veldt.co.za", sev: "info" },
  { time: "Feb 15 22:03", event: "Suspicious IP flagged", detail: "185.220.101.3 - Tor exit node", user: "system", sev: "crit" },
  { time: "Feb 12 14:22", event: "Session revoked", detail: "Firefox · Ubuntu · Unknown IP", user: "system", sev: "warn" },
  { time: "Feb 10 08:00", event: "2FA enabled", detail: "Authenticator app configured", user: "naledi@veldt.co.za", sev: "ok" },
];

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
}: SettingsPageProps) {
  const initialTab: SettingsTab = mode === "profile" ? "profile" : "security";
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [, setHasChanges] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const [accentColor, setAccentColor] = useState<string>("#c8f135");
  const [activeWidgets, setActiveWidgets] = useState<number[]>([0, 1, 2, 3]);
  const [portalToggles, setPortalToggles] = useState<Record<string, boolean>>(DEFAULT_PORTAL_TOGGLES);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [selectedDateFormat, setSelectedDateFormat] = useState<string>("DD/MM/YYYY");
  const [selectedTimezone, setSelectedTimezone] = useState<string>("Africa/Johannesburg (UTC+2)");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("ZAR - South African Rand (R)");
  const [securityTab, setSecurityTab] = useState<SecurityTab>("Overview");
  const [securityToggles, setSecurityToggles] = useState<Record<string, boolean>>(SECURITY_DEFAULTS);
  const [mfaMethod, setMfaMethod] = useState("Authenticator App");
  const [timeoutValue, setTimeoutValue] = useState("30 min");
  const [inviteRole, setInviteRole] = useState<RoleName>("Viewer");
  const [auditFilter, setAuditFilter] = useState<"All" | "Ok" | "Info" | "Warn" | "Critical">("All");
  const [securitySessions, setSecuritySessions] = useState<SessionInfo[]>(sessions);
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>(DEFAULT_ACCESS_USERS);
  const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [gdprTarget, setGdprTarget] = useState<GdprItem | null>(null);
  const [password, setPassword] = useState("");

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

  const visibleTabs = useMemo(
    () => SETTINGS_TABS.filter((tab) => (mode === "profile" ? tab.value === "profile" : tab.value === "security")),
    [mode],
  );

  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3000);
  };

  const markChanged = () => setHasChanges(true);

  const resetLocalDefaults = () => {
    setActiveTab(initialTab);
    setAccentColor("#c8f135");
    setActiveWidgets([0, 1, 2, 3]);
    setPortalToggles(DEFAULT_PORTAL_TOGGLES);
    setSelectedLanguage("English");
    setSelectedDateFormat("DD/MM/YYYY");
    setSelectedTimezone("Africa/Johannesburg (UTC+2)");
    setSelectedCurrency("ZAR - South African Rand (R)");
    setHasChanges(false);
  };

  const handleSave = () => {
    setHasChanges(false);
    showToast("Settings saved", "All preferences updated successfully.");
  };

  const handleDiscard = () => {
    setHasChanges(false);
    showToast("Changes discarded", "Settings restored to last saved state.");
  };

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
    showToast("Session revoked", "Device signed out successfully.");
  };

  return (
    <div className={styles.pageBody}>
      {mode === "profile" ? (
        <div className={cx("pageHeader")}>
          <div>
            <div className={cx("pageEyebrow")}>Settings · Personalisation</div>
            <h1 className={cx("pageTitle")}>{SETTINGS_TABS.find((tab) => tab.value === activeTab)?.label ?? "Profile"}</h1>
            <p className={cx("pageSub")}>Customise your portal experience, notifications, and branding preferences.</p>
          </div>
          <div className={cx("pageActions")}>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={handleDiscard}>
              Discard
            </button>
            <button
              className={cx("btnSm", "btnGhost")}
              type="button"
              onClick={() => {
                resetLocalDefaults();
                showToast("Settings reset", "Local preferences restored to defaults.");
              }}
            >
              Reset to Defaults
            </button>
            <button className={cx("btnSm", "btnAccent")} type="button" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      ) : null}

      <div className={cx("profLayout", mode === "security" && "secuModeLayout")}>
        {mode === "profile" ? (
          <aside className={cx("card", "profSidebar")}>
          <div className={cx("profSideSection")}>Settings</div>
          {visibleTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={cx("profSideButton", activeTab === tab.value && "profSideButtonActive")}
              onClick={() => setActiveTab(tab.value)}
            >
              <span className={cx("profSideDot", activeTab === tab.value ? "profDotAccent" : "profDotMuted")} />
              {tab.label}
            </button>
          ))}

          {activeTab === "security" ? (
            <>
              <div className={cx("profSideDivider")} />
              <div className={cx("profSideSection")}>Security</div>
              {SECURITY_TABS.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  className={cx("profSideButton", securityTab === entry && "profSideButtonActive")}
                  onClick={() => setSecurityTab(entry)}
                >
                  <span className={cx("profSideDot", securityTab === entry ? "profDotAccent" : "profDotMuted")} />
                  {entry}
                </button>
              ))}

              <div className={cx("profSideDivider")} />
              <div className={cx("secxThreatBox")}>
                <div className={cx("secxThreatTitle")}>Threat Summary</div>
                <div className={cx("secxThreatRow")}><span>Login attempts</span><span className={cx("badge", "badgeGreen")}>Clean</span></div>
                <div className={cx("secxThreatRow")}><span>Suspicious IPs</span><span className={cx("badge", "badgeRed")}>1 flagged</span></div>
                <div className={cx("secxThreatRow")}><span>2FA status</span><span className={cx("badge", "badgeGreen")}>Active</span></div>
                <div className={cx("secxThreatRow")}><span>Open sessions</span><span className={cx("badge", securitySessions.length > 2 ? "badgeAmber" : "badgeGreen")}>{securitySessions.length}</span></div>
              </div>

              <div className={cx("profSideDivider")} />
              <div className={cx("profSideSection")}>Quick Actions</div>
              {["Lock Account", "Sign Out All Devices", "Change Password", "Download Audit Log"].map((action) => (
                <button
                  key={action}
                  type="button"
                  className={cx("profSideButton", "profSideButtonSmall")}
                  onClick={() => showToast(action, "Action initiated.")}
                >
                  {action}
                </button>
              ))}
            </>
          ) : null}
          </aside>
        ) : null}

        <div className={cx("profMain", mode === "security" && "secuModeMain")}>
          {activeTab === "profile" ? (
            <div className={cx("profGrid")}>
              <div className={cx("profCol")}>
                <section className={cx("card", "profCard")}>
                  <div className={cx("profCardHeader")}>
                    <div>
                      <div className={cx("profCardTitle")}>Personal Information</div>
                      <div className={cx("profCardSub")}>Update your name, contact, and company details.</div>
                    </div>
                  </div>

                  <label className={cx("profLabel")}>Full Name</label>
                  <input className={cx("profInput")} defaultValue="Naledi Dlamini" onChange={markChanged} />

                  <label className={cx("profLabel")}>Email Address</label>
                  <input className={cx("profInput")} defaultValue="naledi@veldtfinance.co.za" onChange={markChanged} />

                  <label className={cx("profLabel")}>Phone Number</label>
                  <input className={cx("profInput")} defaultValue="+27 82 345 6789" onChange={markChanged} />

                  <label className={cx("profLabel")}>Company Name</label>
                  <input className={cx("profInput")} defaultValue="Veldt Finance (Pty) Ltd" onChange={markChanged} />

                  <label className={cx("profLabel")}>Role / Title</label>
                  <input className={cx("profInput")} defaultValue="Chief Product Officer" onChange={markChanged} />
                </section>

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

              <div className={cx("profCol")}>
                <section className={cx("card", "profCard")}>
                  <div className={cx("profCardHeader")}>
                    <div className={cx("profCardTitle")}>Profile Photo</div>
                  </div>
                  <div className={cx("profAvatar")}>ND</div>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost", "profBlockBtn")}
                    onClick={() => showToast("Upload ready", "Choose a photo from your device.")}
                  >
                    Upload Photo
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost", "profBlockBtn")}
                    onClick={() => showToast("Photo removed", "Initials will be shown instead.")}
                  >
                    Remove
                  </button>
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
                    {integrations.slice(0, 2).map((integration) => (
                      <div key={integration.id} className={cx("profMiniRow")}>
                        <span className={cx("profMiniName")}>{integration.name}</span>
                        <span className={cx(integration.status === "connected" ? "badge badgeGreen" : "badge badgeMuted")}>
                          {integration.status}
                        </span>
                        {integration.status === "connected" ? (
                          <button
                            type="button"
                            className={cx("btnSm", "btnGhost")}
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

                  <div className={cx("profMiniHeader")}>Sessions</div>
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
                        className={cx("profColorSwatch", accentColor === color && "profColorSwatchSelected")}
                        style={{ background: color }}
                        onClick={() => {
                          setAccentColor(color);
                          markChanged();
                        }}
                      />
                    ))}
                  </div>

                  <label className={cx("profLabel")}>Custom Hex</label>
                  <div className={cx("profInputRow")}>
                    <span className={cx("profColorPreview")} style={{ background: accentColor }} />
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
                      <span className={cx("profPreviewLogo")} style={{ color: accentColor }}>Maphari</span>
                      <span className={cx("profPreviewSpacer")} />
                      <span className={cx("profPreviewDot")} style={{ background: accentColor }} />
                      <span className={cx("profPreviewDot", "profPreviewDotMuted")} />
                    </div>
                    <div className={cx("profPreviewBody")}>
                      <div className={cx("profPreviewSide")}>
                        <span className={cx("profPreviewSideItem", "profPreviewSideItemActive")} style={{ background: accentColor }} />
                        <span className={cx("profPreviewSideItem")} />
                        <span className={cx("profPreviewSideItem")} />
                        <span className={cx("profPreviewSideItem")} />
                      </div>
                      <div className={cx("profPreviewMain")}> 
                        <span className={cx("profPreviewCard")} style={{ borderLeftColor: accentColor }} />
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

          {activeTab === "security" ? (
            <div className={cx("secxPage")}>
              <aside className={cx("secxSidebar")}>
                <div className={cx("secxSideSection")}>Security</div>
                {[
                  { label: "Overview" as SecurityTab, dot: "secxDotAccent" },
                  { label: "Two-Factor Auth" as SecurityTab, dot: "secxDotGreen" },
                  { label: "Active Sessions" as SecurityTab, dot: "secxDotAmber", badge: securitySessions.filter(s => !s.current).length, bc: "secxBadgeAmber" },
                  { label: "Access Control" as SecurityTab, dot: "secxDotPurple" },
                  { label: "Audit Log" as SecurityTab, dot: "secxDotMuted", badge: SECURITY_AUDIT.filter(a => a.sev === "crit").length, bc: "secxBadgeRed" },
                  { label: "GDPR & Privacy" as SecurityTab, dot: "secxDotMuted" },
                ].map((item) => (
                  <button key={item.label} type="button" className={cx("secxSideItem", securityTab === item.label && "secxSideItemActive")} onClick={() => setSecurityTab(item.label)}>
                    <span className={cx("secxSideDot", securityTab === item.label ? "secxDotAccent" : item.dot)} />
                    {item.label}
                    {item.badge != null && item.badge > 0 && <span className={cx("secxSideBadge", item.bc)}>{item.badge}</span>}
                  </button>
                ))}
                <div className={cx("secxSideDivider")} />
                <div className={cx("secxThreatBox")}>
                  <div className={cx("secxThreatTitle")}>Threat Summary</div>
                  <div className={cx("secxThreatRow")}><span>Login attempts</span><span className={cx("badge", "badgeGreen")}>Clean</span></div>
                  <div className={cx("secxThreatRow")}><span>Suspicious IPs</span><span className={cx("badge", "badgeRed")}>1 flagged</span></div>
                  <div className={cx("secxThreatRow")}><span>2FA status</span><span className={cx("badge", "badgeGreen")}>Active</span></div>
                  <div className={cx("secxThreatRow")}><span>Open sessions</span><span className={cx("badge", securitySessions.length > 2 ? "badgeAmber" : "badgeGreen")}>{securitySessions.length}</span></div>
                </div>
                <div className={cx("secxSideDivider")} />
                <div className={cx("secxSideSection")}>Quick Actions</div>
                {["Lock Account", "Sign Out All Devices", "Change Password", "Download Audit Log"].map((action) => (
                  <button key={action} type="button" className={cx("secxSideItem", "secxSideItemSmall")} onClick={() => showToast(action, "Action initiated.")}>
                    {action}
                  </button>
                ))}
              </aside>

              <div className={cx("secxMain")}>
                <div className={cx("secxHeader")}>
                  <div>
                    <div className={cx("pageEyebrow")}>Settings · Security</div>
                    <div className={cx("secxTitle")}>Security & Access</div>
                    <div className={cx("secxSub")}>Manage 2FA, active sessions, role permissions, audit logs, and data privacy.</div>
                  </div>
                  <div className={cx("secxHeaderActions")}>
                    <div className={cx("secxScore")}>
                      <span className={cx("secxScoreLabel")}>Security Score</span>
                      <div className={cx("secxScoreTrack")}><div className={cx("secxScoreFill")} style={{ width: `${securityScore}%` }} /></div>
                      <span className={cx("secxScoreNum")}>{securityScore}%</span>
                    </div>
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => showToast("Report downloaded", "Security audit PDF exported")}>📄 Export</button>
                    <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => showToast("Signed out", "All other devices have been signed out.")}>
                      Sign Out All Devices
                    </button>
                  </div>
                </div>


                {securityTab === "Overview" ? (
                  <>
                    <div className={cx("secxStatStrip")}>
                      <div className={cx("secxStat", "secxStatPos")}>
                        <div className={cx("secxStatBar", securityScore >= 80 ? "secxStatBarGreen" : "secxStatBarAmber")} />
                        <div className={cx("secxStatLabel")}>Security Score</div><div className={cx("secxStatValue")}>{securityScore}%</div><div className={cx("secxStatSub")}>{securityEnabledCount}/{Object.keys(securityToggles).length} controls on</div>
                      </div>
                      <div className={cx("secxStat", "secxStatPos")}>
                        <div className={cx("secxStatBar", "secxStatBarPurple")} />
                        <div className={cx("secxStatLabel")}>Active Sessions</div><div className={cx("secxStatValue")}>{securitySessions.length}</div><div className={cx("secxStatSub")}>1 current device</div>
                      </div>
                      <div className={cx("secxStat", "secxStatPos")}>
                        <div className={cx("secxStatBar", "secxStatBarAmber")} />
                        <div className={cx("secxStatLabel")}>Failed Logins</div><div className={cx("secxStatValue")}>2</div><div className={cx("secxStatSub")}>Last 30 days</div>
                      </div>
                      <div className={cx("secxStat", "secxStatPos")}>
                        <div className={cx("secxStatBar", "secxStatBarRed")} />
                        <div className={cx("secxStatLabel")}>Flagged Events</div><div className={cx("secxStatValue")}>1</div><div className={cx("secxStatSub")}>Suspicious IP detected</div>
                      </div>
                    </div>

                    <div className={cx("secxContent")}>
                      <div className={cx("secuThreeStack")}>
                        <div>
                          <div className={cx("secuSectionTitle")}>Security Controls</div>
                          <div className={cx("secxTwoCol")}>
                            {[
                              { title: "Authentication", sub: "Login & identity controls", keys: ["Two-Factor Authentication", "Login Notifications", "Suspicious IP Alerts", "Magic Link Login"] },
                              { title: "Data & Sessions", sub: "Access and data controls", keys: ["Session Expiry", "Download Logging", "Single Sign-On (SSO)", "Encrypted Storage"] },
                            ].map((grp) => (
                              <section key={grp.title} className={cx("card", "secxCard")}>
                                <div className={cx("secxCardTitle")}>{grp.title}</div>
                                <div className={cx("profMiniMeta", "mb8")}>{grp.sub}</div>
                                {grp.keys.map((label) => {
                                  const on = securityToggles[label];
                                  return (
                                    <div key={label} className={cx("secxToggleRow")}>
                                      <span>{label}</span>
                                      <button type="button" className={cx("profToggle", on && "profToggleOn")} onClick={() => setSecurityToggles((prev) => ({ ...prev, [label]: !on }))}>
                                        <span className={cx("profToggleKnob", on && "profToggleKnobOn")} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </section>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className={cx("secuSectionTitle")}>Auto-Logout Timer</div>
                          <section className={cx("card", "secxCard")}>
                            <div className={cx("secxCardTitle")}>Session Timeout</div>
                            <div className={cx("profMiniMeta", "mb12")}>Sign out automatically after inactivity period</div>
                            <div className={cx("secuChoiceGrid4")}>
                              {["15 min", "30 min", "1 hour", "4 hours", "8 hours", "1 day", "1 week", "Never"].map((value) => (
                                <button key={value} type="button" className={cx("profChoiceBtn", timeoutValue === value && "profChoiceBtnActive")} onClick={() => { setTimeoutValue(value); showToast("Timeout updated", `Expires after ${value} of inactivity`); }}>{value}</button>
                              ))}
                            </div>
                          </section>
                        </div>

                        <div>
                          <div className={cx("secuSectionTitle")}>Change Password</div>
                          <section className={cx("card", "secxCard", "secuPwdCard")}>
                            <label className={cx("profLabel")}>Current Password</label>
                            <input className={cx("profInput")} type="password" placeholder="••••••••••" />
                            <label className={cx("profLabel")}>New Password</label>
                            <input className={cx("profInput")} type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <div className={cx("secuPwdBar")}><div className={cx("secuPwdFill")} style={{ width: `${passwordScore.w}%`, background: passwordScore.color }} /></div>
                            {password && <div className={cx("secuPwdStrengthLabel")} style={{ color: passwordScore.color }}>{passwordScore.label}</div>}
                            <label className={cx("profLabel")}>Confirm Password</label>
                            <input className={cx("profInput")} type="password" placeholder="Confirm new password" />
                            <button type="button" className={cx("btnSm", "btnAccent", "w100", "mt16")} onClick={() => showToast("Password updated", "Your new password is active.")}>Update Password</button>
                          </section>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                {securityTab === "Two-Factor Auth" ? (
                  <div className={cx("secxContent")}>
                    <div className={cx("secuThreeStack")}>
                      <div>
                        <div className={cx("secuSectionTitle")}>Authentication Method</div>
                        <section className={cx("card", "secxCard")}>
                          <div className={cx("secuMfaGrid")}>
                            {[
                              { label: "Authenticator App", icon: "📱", sub: "Google Authenticator / Authy" },
                              { label: "SMS One-Time Pin", icon: "💬", sub: "To +27 82 *** 6789" },
                              { label: "Email OTP", icon: "📧", sub: "naledi@veldt.co.za" },
                            ].map((method) => (
                              <button key={method.label} type="button" className={cx("secuMfaOption", mfaMethod === method.label && "secuMfaOptionActive")} onClick={() => setMfaMethod(method.label)}>
                                <div className={cx("secuMfaEmoji")}>{method.icon}</div>
                                <div className={cx("secuMfaLabel")}>{method.label}</div>
                                <div className={cx("secuMfaSub")}>{method.sub}</div>
                              </button>
                            ))}
                          </div>
                          {mfaMethod === "Authenticator App" && (
                            <div className={cx("secuQrWrap")}>
                              <div className={cx("secuQrBox")}>
                                {QR_DATA.map((cell, i) => <div key={i} className={cx(cell === 0 ? "secuQrCellW" : "secuQrCell")} />)}
                              </div>
                              <div className={cx("secuQrInfo")}>
                                <div className={cx("secuQrTitle")}>Scan with your authenticator</div>
                                <div className={cx("secuQrDesc")}>Open Google Authenticator, Authy, or 1Password and scan. You&apos;ll need a 6-digit code on each login.</div>
                                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => showToast("Key copied", "JBSWY3DPEHPK3PXP")}>Copy Secret Key</button>
                              </div>
                            </div>
                          )}
                          {mfaMethod === "SMS One-Time Pin" && (
                            <div className={cx("secuSmsVerify")}>
                              <label className={cx("profLabel")}>Verify Phone Number</label>
                              <div className={cx("secuInlineRow")}>
                                <input className={cx("profInput")} placeholder="+27 82 345 6789" />
                                <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => showToast("OTP sent", "Check your SMS messages")}>Send OTP</button>
                              </div>
                            </div>
                          )}
                        </section>
                      </div>

                      <div>
                        <div className={cx("secuSectionTitle")}>Backup Codes</div>
                        <section className={cx("card", "secxCard")}>
                          <div className={cx("secxCardTitle")}>Emergency Access Codes</div>
                          <div className={cx("profMiniMeta", "mb12")}>Each code can only be used once — store safely</div>
                          <div className={cx("secuCodeGrid")}>
                            {["K9X2-MNPL", "7YQR-4TBV", "FZAC-8WDE", "P3LN-XKGM", "HJ6T-RVWY", "2QSB-ZDCU", "MTFA-9XPL", "CNRV-4YHB"].map((code) => (
                              <span key={code} className={cx("secuCodeItem")}>{code}</span>
                            ))}
                          </div>
                          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => showToast("Codes regenerated", "Previous codes are now invalid")}>Regenerate</button>
                          <button type="button" className={cx("btnSm", "btnGhost", "w100", "mt8")} onClick={() => showToast("Downloaded", "backup-codes.txt saved")}>↓ Download Backup Codes</button>
                        </section>
                      </div>
                    </div>
                  </div>
                ) : null}

                {securityTab === "Active Sessions" ? (
                  <div className={cx("secxContent")}>
                    <div className={cx("secuThreeStack")}>
                      <div>
                        <div className={cx("secuSectionTitle")}>Devices & Sessions</div>
                        <section className={cx("card", "secxCard")}>
                          {securitySessions.map((session) => (
                            <div key={session.id} className={cx("secuSessRowFull")}>
                              <div className={cx("secuSessIcon")}>{session.icon ?? "💻"}</div>
                              <div className={cx("secuSessionMain")}>
                                <div className={cx("profMiniName")}>{session.device}</div>
                                <div className={cx("profMiniMeta")}>{session.location} · {session.ip}</div>
                                <div className={cx("profMiniMeta")}>Last active {formatRelative(session.lastActiveAt)}</div>
                                <span className={cx("secuSessBadge", session.current ? "secuSessBadgeCurrent" : "secuSessBadgeOld")}>
                                  {session.current && <span className={cx("secuSessBadgeDot")} />}
                                  {session.current ? "Current session" : "Previously active"}
                                </span>
                              </div>
                              {!session.current && (
                                <button type="button" className={cx("secuRevokeBtn")} onClick={() => setRevokeSessionId(session.id)}>Revoke</button>
                              )}
                            </div>
                          ))}
                        </section>
                      </div>

                      <div>
                        <div className={cx("secuSectionTitle")}>Document-Level Permissions</div>
                        <section className={cx("card", "secxCard")}>
                          <div className={cx("secxCardTitle")}>File Access Control</div>
                          <div className={cx("profMiniMeta", "mb12")}>Who can view, comment, or download each file</div>
                          {SECURITY_DOCS.map((doc) => (
                            <div key={doc.name} className={cx("secuDocRowFull")}>
                              <span className={cx("secuDocIcon")}>📄</span>
                              <span className={cx("secuDocName")}>{doc.name}</span>
                              <span className={cx("secuDocViewers")}>{doc.viewers}</span>
                              <select className={cx("secuPermSel")} onChange={() => showToast("Permission updated", doc.name)}>
                                <option>View only</option>
                                <option>Can comment</option>
                                <option>Can download</option>
                                <option>Full access</option>
                              </select>
                            </div>
                          ))}
                        </section>
                      </div>
                    </div>
                  </div>
                ) : null}

                {securityTab === "Access Control" ? (
                  <div className={cx("secxContent")}>
                    <section className={cx("card", "secxCard")}>
                      <div className={cx("secuRbacHeader")}>
                        <div className={cx("secxCardTitle")}>Role-Based Access</div>
                        <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setInviteModalOpen(true)}>+ Invite User</button>
                      </div>
                      <div className={cx("secuRbacTableHead")}><span>User</span><span>View</span><span>Comment</span><span>Approve</span><span>Download</span></div>
                      <div className={cx("secuRbacRows")}>
                        {accessUsers.map((user, userIndex) => (
                          <div key={user.name} className={cx("secuRbacRow")}>
                            <div><div className={cx("profMiniName")}>{user.name}</div><div className={cx("profMiniMeta")}>{user.role}</div></div>
                            {(["view", "comment", "approve", "download"] as const).map((permission) => (
                              <button key={`${user.name}-${permission}`} type="button" className={cx("secuPermBtn", user[permission] && "secuPermBtnOn")} onClick={() => toggleAccessPermission(userIndex, permission)}>
                                {user[permission] ? "✓" : "—"}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : null}

                {securityTab === "Audit Log" ? (
                  <div className={cx("secxContent")}>
                    <section className={cx("card", "secxCard")}>
                      <div className={cx("secuAuditTop")}>
                        <div className={cx("secuFilterRow")}>
                          <span className={cx("profMiniMeta")}>Filter:</span>
                          {(["All", "Ok", "Info", "Warn", "Critical"] as const).map((filter) => (
                            <button key={filter} type="button" className={cx("profChoiceBtn", auditFilter === filter && "profChoiceBtnActive")} onClick={() => setAuditFilter(filter)}>{filter}</button>
                          ))}
                        </div>
                        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => showToast("Exported", "audit-log.csv downloaded.")}>↓ Export CSV</button>
                      </div>
                      <div className={cx("secuAuditTableHead")}><span>Timestamp</span><span>Event</span><span>User</span><span>Severity</span></div>
                      <div className={cx("secuAuditRows")}>
                        {filteredAudit.map((entry, index) => (
                          <div key={`${entry.time}-${index}`} className={cx("secuAuditRow")}>
                            <div className={cx("profMiniMeta")}>{entry.time}</div>
                            <div><div className={cx("profMiniName")}>{entry.event}</div><div className={cx("profMiniMeta")}>{entry.detail}</div></div>
                            <div className={cx("profMiniMeta")}>{entry.user}</div>
                            <div><span className={cx("badge", entry.sev === "ok" ? "badgeGreen" : entry.sev === "info" ? "badgeAccent" : entry.sev === "warn" ? "badgeAmber" : "badgeRed")}>{entry.sev === "crit" ? "critical" : entry.sev}</span></div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : null}

                {securityTab === "GDPR & Privacy" ? (
                  <div className={cx("secxContent")}>
                    <section className={cx("card", "secxCard")}>
                      <div className={cx("secxCardTitle")}>Data & Privacy Controls</div>
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
                                {item.action ? <button type="button" className={cx("btnSm", item.danger ? "btnGhost" : "btnGhost")} onClick={() => setGdprTarget(item)}>{item.action}</button> : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : null}
              </div>
            </div>
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
                  value={selectedCurrency}
                  onChange={(event) => {
                    setSelectedCurrency(event.target.value);
                    markChanged();
                  }}
                >
                  <option>ZAR - South African Rand (R)</option>
                  <option>USD - US Dollar ($)</option>
                  <option>EUR - Euro (€)</option>
                  <option>GBP - British Pound (£)</option>
                  <option>NGN - Nigerian Naira (₦)</option>
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
              <p className={cx("profMiniMeta")}>This will immediately sign out the selected device session.</p>
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
              <label className={cx("profLabel")}>Email Address</label>
              <input className={cx("profInput")} placeholder="colleague@company.co.za" />
              <label className={cx("profLabel")}>Full Name</label>
              <input className={cx("profInput")} placeholder="First and last name" />
              <label className={cx("profLabel")}>Role</label>
              <div className={cx("profChoiceGrid3")}>
                {(["Owner", "Project Lead", "Designer", "Engineer", "Viewer"] as RoleName[]).map((role) => (
                  <button key={role} type="button" className={cx("profChoiceBtn", inviteRole === role && "profChoiceBtnActive")} onClick={() => setInviteRole(role)}>
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className={cx("secuModalFooter")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setInviteModalOpen(false)}>Cancel</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => {
                  setInviteModalOpen(false);
                  showToast("Invite sent", `Dispatched · Role: ${inviteRole}`);
                }}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {gdprTarget ? (
        <div className={cx("secuModalBackdrop")} onClick={() => setGdprTarget(null)}>
          <div className={cx("secuModal")} onClick={(event) => event.stopPropagation()}>
            <div className={cx("secuModalHeader")}>
              <div className={cx("secuModalTitle")}>{gdprTarget.action}</div>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setGdprTarget(null)}>Close</button>
            </div>
            <div className={cx("secuModalBody")}>
              <p className={cx("profMiniMeta")}>{gdprTarget.desc}</p>
              {gdprTarget.danger ? <div className={cx("secuDangerBox")}>This action is permanent and irreversible.</div> : null}
            </div>
            <div className={cx("secuModalFooter")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setGdprTarget(null)}>Cancel</button>
              <button
                type="button"
                className={cx("btnSm", gdprTarget.danger ? "btnGhost" : "btnAccent")}
                onClick={() => {
                  showToast(`${gdprTarget.action} submitted`, "We will process your request within 5 business days.");
                  setGdprTarget(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={cx("profToast")}>
          <div className={cx("profToastIcon")}>✓</div>
          <div>
            <div className={cx("profToastText")}>{toast.text}</div>
            <div className={cx("profToastSub")}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
