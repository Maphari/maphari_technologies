"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ToggleRow } from "../ui";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  getStaff2faStatusWithRefresh,
  setupStaff2faWithRefresh,
  verifyStaff2faWithRefresh,
  disableStaff2faWithRefresh,
} from "../../../../lib/api/staff/auth-2fa";

type ProjectOption = { id: string; name: string };

type SettingsTab = "profile" | "notifications" | "workspace" | "appearance" | "kanban" | "focus" | "security";

type SettingsPageProps = {
  isActive: boolean;
  session?: AuthSession | null;
  staffInitials: string;
  staffName: string;
  staffEmail: string;
  staffRole: string;
  profileName: string;
  profileEmail: string;
  profileAvatarUrl: string;
  weeklyTargetHours: number;
  onProfileNameChange: (value: string) => void;
  onProfileEmailChange: (value: string) => void;
  onProfileAvatarChange: (file: File) => void;
  onWeeklyTargetHoursChange: (value: number) => void;
  onSaveProfile: () => void;
  onResetProfile: () => void;
  hasProfileChanges: boolean;
  notifications: {
    taskAssignments: boolean;
    clientMessages: boolean;
    deliverableReminders: boolean;
    standupReminders: boolean;
    weeklyTimeSummary: boolean;
  };
  onNotificationChange: (
    key: "taskAssignments" | "clientMessages" | "deliverableReminders" | "standupReminders" | "weeklyTimeSummary",
    value: boolean
  ) => void;
  onSaveNotifications: () => void;
  onResetNotifications: () => void;
  hasNotificationsChanges: boolean;
  workspace: {
    timezone: string;
    workStart: string;
    workEnd: string;
    defaultStatus: "Available" | "Focused" | "In a meeting";
  };
  timezoneOptions: string[];
  onWorkspaceChange: (
    key: "timezone" | "workStart" | "workEnd" | "defaultStatus",
    value: string
  ) => void;
  onSaveWorkspace: () => void;
  onResetWorkspace: () => void;
  onUseLocalTimezone: () => void;
  hasWorkspaceChanges: boolean;
  projects: ProjectOption[];
  highPriorityClients: string[];
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
  kanbanViewMode: "all" | "my_work" | "urgent" | "client_waiting" | "blocked";
  onKanbanViewModeChange: (mode: "all" | "my_work" | "urgent" | "client_waiting" | "blocked") => void;
  kanbanSwimlane: "status" | "project" | "client";
  onKanbanSwimlaneChange: (mode: "status" | "project" | "client") => void;
  onRestartTour?: () => void;
};

const STATUS_OPTS = ["Available", "Focused", "In a meeting"] as const;

const TABS: Array<{ id: SettingsTab; label: string; icon: React.ReactNode; desc: string }> = [
  {
    id: "profile",
    label: "Profile",
    desc: "Name, email, avatar, weekly target",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    desc: "Alerts, reminders, digests",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2A4 4 0 0 0 4 6v3.5L2.5 11h11L12 9.5V6A4 4 0 0 0 8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M6.5 11a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: "workspace",
    label: "Workspace",
    desc: "Timezone, hours, status",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 2c-2.5 2-2.5 10 0 12M8 2c2.5 2 2.5 10 0 12" stroke="currentColor" strokeWidth="1.1" />
        <path d="M2 8h12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "appearance",
    label: "Appearance",
    desc: "Theme, density, language",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "kanban",
    label: "Kanban",
    desc: "View mode, swimlane layout",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="2" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="6.25" y="2" width="3.5" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="11" y="2" width="3.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: "focus",
    label: "Focus Areas",
    desc: "Active projects and clients",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2L2 5v4c0 3 2.5 5 6 6 3.5-1 6-3 6-6V5L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M5.5 8.5l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "security",
    label: "Security",
    desc: "Two-factor authentication",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.5L2.5 4v4c0 3.3 2.4 6.4 5.5 7 3.1-.6 5.5-3.7 5.5-7V4L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

/* ── Icons ── */
function IcoCamera() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1.5 5C1.5 4.5 2 4 2.5 4h.8L4.5 2.5h5L10.7 4h.8c.5 0 1 .5 1 1v6c0 .5-.5 1-1 1h-9c-.5 0-1-.5-1-1V5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="7" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function IcoSave() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 2h8.5L12 3.5V12a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 2 12V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="4.5" y="2" width="5" height="3.5" rx=".5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="3.5" y="8" width="7" height="4.5" rx=".5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}
function IcoReset() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M11.5 7A4.5 4.5 0 1 1 7 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7 2.5l2-2M7 2.5L9 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IcoGlobe() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 1.5c-2 1.5-2 9 0 11M7 1.5c2 1.5 2 9 0 11" stroke="currentColor" strokeWidth="1.1" />
      <path d="M1.5 7h11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IcoClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IcoTask() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IcoMsg() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 12l2-1.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IcoDeliverable() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1.5l5 2.5v5L7 12.5 2 9V4L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7 1.5v11M2 4l5 2.5L12 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IcoStandup() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 4v3l2 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IcoDigest() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 3.5C2 3 2.5 2.5 3 2.5h8c.5 0 1 .5 1 1v7c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-7z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 5.5h5M4.5 7.5h5M4.5 9.5h2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsPage({
  isActive,
  session,
  staffInitials,
  staffName,
  staffEmail,
  staffRole,
  profileName,
  profileEmail,
  profileAvatarUrl,
  weeklyTargetHours,
  onProfileNameChange,
  onProfileEmailChange,
  onProfileAvatarChange,
  onWeeklyTargetHoursChange,
  onSaveProfile,
  onResetProfile,
  hasProfileChanges,
  notifications,
  onNotificationChange,
  onSaveNotifications,
  onResetNotifications,
  hasNotificationsChanges,
  workspace,
  timezoneOptions,
  onWorkspaceChange,
  onSaveWorkspace,
  onResetWorkspace,
  onUseLocalTimezone,
  hasWorkspaceChanges,
  projects,
  highPriorityClients,
  theme,
  onThemeChange,
  kanbanViewMode,
  onKanbanViewModeChange,
  kanbanSwimlane,
  onKanbanSwimlaneChange,
  onRestartTour,
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ── 2FA state ──────────────────────────────────────────────────────────────
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaSetupOpen, setTwoFaSetupOpen] = useState(false);
  const [twoFaQrUrl, setTwoFaQrUrl] = useState("");
  const [twoFaSecret, setTwoFaSecret] = useState("");
  const [twoFaBackupCodes, setTwoFaBackupCodes] = useState<string[]>([]);
  const [twoFaVerifyCode, setTwoFaVerifyCode] = useState("");
  const [twoFaVerifyBusy, setTwoFaVerifyBusy] = useState(false);
  const [twoFaVerifyError, setTwoFaVerifyError] = useState("");
  const [twoFaDisableOpen, setTwoFaDisableOpen] = useState(false);
  const [twoFaDisablePassword, setTwoFaDisablePassword] = useState("");
  const [twoFaDisableBusy, setTwoFaDisableBusy] = useState(false);
  const [twoFaDisableError, setTwoFaDisableError] = useState("");
  const [twoFaSetupStep, setTwoFaSetupStep] = useState<"qr" | "verify" | "codes">("qr");

  // Load 2FA status on mount
  useEffect(() => {
    if (!session) return;
    setTwoFaLoading(true);
    void getStaff2faStatusWithRefresh(session)
      .then((r) => { if (r.data) setTwoFaEnabled(r.data.enabled); })
      .finally(() => setTwoFaLoading(false));
  }, [session?.accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetup2fa = useCallback(async () => {
    if (!session) return;
    setTwoFaSetupStep("qr");
    const r = await setupStaff2faWithRefresh(session);
    if (r.data) {
      setTwoFaSecret(r.data.secret);
      setTwoFaQrUrl(r.data.qrCodeDataUrl);
      setTwoFaBackupCodes(r.data.backupCodes);
      setTwoFaSetupOpen(true);
    }
  }, [session?.accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerify2fa = useCallback(async () => {
    if (!session || !twoFaVerifyCode.trim()) return;
    setTwoFaVerifyBusy(true);
    setTwoFaVerifyError("");
    const r = await verifyStaff2faWithRefresh(session, twoFaVerifyCode.trim());
    if (r.data?.enabled) {
      setTwoFaEnabled(true);
      setTwoFaSetupStep("codes");
    } else {
      setTwoFaVerifyError(r.error?.message ?? "Invalid code");
    }
    setTwoFaVerifyBusy(false);
  }, [session?.accessToken, twoFaVerifyCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDisable2fa = useCallback(async () => {
    if (!session || !twoFaDisablePassword.trim()) return;
    setTwoFaDisableBusy(true);
    setTwoFaDisableError("");
    const r = await disableStaff2faWithRefresh(session, twoFaDisablePassword.trim());
    if (r.data?.disabled) {
      setTwoFaEnabled(false);
      setTwoFaDisableOpen(false);
      setTwoFaDisablePassword("");
    } else {
      setTwoFaDisableError(r.error?.message ?? "Failed to disable 2FA");
    }
    setTwoFaDisableBusy(false);
  }, [session?.accessToken, twoFaDisablePassword]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayName = profileName.trim() || staffName;
  const displayEmail = profileEmail.trim() || staffEmail;
  const displayInitials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || staffInitials;

  const enabledCount = Object.values(notifications).filter(Boolean).length;
  const totalCount   = Object.keys(notifications).length;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-settings">

      {/* ── Page header ── */}
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Account</div>
        <h1 className={cx("pageTitleText")}>Settings</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Manage your profile, preferences, and workspace configuration.</p>
      </div>

      {/* ── Settings shell: tab rail + content ── */}
      <div className={cx("stgv2Shell")}>

        {/* LEFT — vertical tab rail */}
        <div className={cx("stgv2Rail")}>

          {/* Identity summary */}
          <div className={cx("stgv2Identity")}>
            <div className={cx("stgv2AvatarMini")}>
              {profileAvatarUrl ? (
                <Image src={profileAvatarUrl} alt={displayName} width={36} height={36} unoptimized className={cx("stgv2AvatarMiniImg")} />
              ) : (
                <span className={cx("stgv2AvatarMiniText")}>{displayInitials}</span>
              )}
            </div>
            <div className={cx("stgv2IdentityInfo")}>
              <div className={cx("stgv2IdentityName")}>{displayName}</div>
              <div className={cx("stgv2IdentityRole")}>{staffRole}</div>
            </div>
          </div>

          <div className={cx("stgv2RailDivider")} />

          {/* Tab buttons */}
          <nav className={cx("stgv2TabList")} aria-label="Settings sections">
            {TABS.map((tab) => {
              const isActive2 = activeTab === tab.id;
              const hasDot =
                (tab.id === "notifications" && hasNotificationsChanges) ||
                (tab.id === "profile" && hasProfileChanges) ||
                (tab.id === "workspace" && hasWorkspaceChanges);
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive2}
                  className={cx("stgv2TabBtn", isActive2 ? "stgv2TabBtnActive" : "stgv2TabBtnIdle")}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={cx("stgv2TabIco")}>{tab.icon}</span>
                  <div className={cx("stgv2TabText")}>
                    <span className={cx("stgv2TabLabel")}>{tab.label}</span>
                    <span className={cx("stgv2TabDesc")}>{tab.desc}</span>
                  </div>
                  {hasDot && <span className={cx("stgv2UnsavedDot")} aria-label="Unsaved changes" />}
                </button>
              );
            })}
          </nav>

          <div className={cx("stgv2RailDivider", "stgv2RailDividerPush")} />

          {/* Quick stats */}
          <div className={cx("stgv2RailStats")}>
            <div className={cx("stgv2RailStat")}>
              <span className={cx("stgv2RailStatLabel")}>Notifications</span>
              <span className={cx("stgv2RailStatVal")}>{enabledCount}/{totalCount} on</span>
            </div>
            <div className={cx("stgv2RailStat")}>
              <span className={cx("stgv2RailStatLabel")}>Weekly target</span>
              <span className={cx("stgv2RailStatVal")}>{weeklyTargetHours}h</span>
            </div>
            <div className={cx("stgv2RailStat")}>
              <span className={cx("stgv2RailStatLabel")}>Status</span>
              <span className={cx("stgv2RailStatVal", "stgv2RailStatOnline")}>Online</span>
            </div>
          </div>
        </div>

        {/* RIGHT — content panel */}
        <div className={cx("stgv2Content")}>

          {/* ═══ PROFILE TAB ═══ */}
          {activeTab === "profile" && (
            <div className={cx("stgv2Panel")}>

              {/* Avatar hero */}
              <div className={cx("stgv2AvatarHero")}>
                <div className={cx("stgv2AvatarCircle")}>
                  {profileAvatarUrl ? (
                    <Image src={profileAvatarUrl} alt={displayName} width={72} height={72} unoptimized className={cx("stgv2AvatarImg")} />
                  ) : (
                    <span className={cx("stgv2AvatarInitials")}>{displayInitials}</span>
                  )}
                  <button
                    type="button"
                    className={cx("stgv2AvatarOverlay")}
                    onClick={() => photoInputRef.current?.click()}
                    aria-label="Change photo"
                  >
                    <IcoCamera />
                  </button>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className={cx("hidden")}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    onProfileAvatarChange(file);
                    e.target.value = "";
                  }}
                />
                <div className={cx("stgv2HeroInfo")}>
                  <div className={cx("stgv2HeroName")}>{displayName}</div>
                  <div className={cx("stgv2HeroEmail")}>{displayEmail}</div>
                  <div className={cx("stgv2HeroBadges")}>
                    <span className={cx("stgv2RoleBadge")}>{staffRole}</span>
                    <span className={cx("stgv2OnlinePill")}>
                      <span className={cx("stgv2OnlineDot")} />Online
                    </span>
                  </div>
                </div>
                {hasProfileChanges && (
                  <span className={cx("badge", "badgeAmber", "stgv2HeroBadge")}>Unsaved changes</span>
                )}
              </div>

              <div className={cx("stgv2RailDivider", "stgv2DividerH")} />

              {/* Fields */}
              <div className={cx("stgv2FieldGrid")}>
                <div className={cx("field")}>
                  <label className={cx("fieldLabel")} htmlFor="stgv2-name">Full Name</label>
                  <input
                    id="stgv2-name"
                    className={cx("fieldInput")}
                    value={profileName}
                    onChange={(e) => onProfileNameChange(e.target.value)}
                    placeholder={staffName}
                  />
                </div>
                <div className={cx("field")}>
                  <label className={cx("fieldLabel")} htmlFor="stgv2-email">Email Address</label>
                  <input
                    id="stgv2-email"
                    className={cx("fieldInput")}
                    value={profileEmail}
                    onChange={(e) => onProfileEmailChange(e.target.value)}
                    placeholder={staffEmail}
                    type="email"
                  />
                </div>
                <div className={cx("field")}>
                  <label className={cx("fieldLabel")} htmlFor="stgv2-role">Role</label>
                  <input
                    id="stgv2-role"
                    className={cx("fieldInput", "colorMuted")}
                    value={staffRole}
                    readOnly
                    tabIndex={-1}
                  />
                </div>
                <div className={cx("field")}>
                  <label className={cx("fieldLabel")} htmlFor="stgv2-hours">
                    Weekly Hour Target
                    <span className={cx("stgv2FieldHint")}>{weeklyTargetHours}h / week</span>
                  </label>
                  <input
                    id="stgv2-hours"
                    className={cx("fieldInput")}
                    value={String(weeklyTargetHours)}
                    onChange={(e) => onWeeklyTargetHoursChange(Math.max(1, Number(e.target.value) || 0))}
                    type="number"
                    min={1}
                    max={80}
                  />
                  {/* Mini target bar */}
                  <div className={cx("stgv2TargetBar")}>
                    <div
                      className={cx("stgv2TargetFill")} style={{ '--pct': `${Math.min(100, Math.round((weeklyTargetHours / 60) * 100))}%` } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>

              <div className={cx("stgv2Actions")}>
                <button
                  type="button"
                  className={cx("stgv2BtnGhost")}
                  onClick={onResetProfile}
                  disabled={!hasProfileChanges}
                >
                  <IcoReset /> Reset
                </button>
                <button
                  type="button"
                  className={cx("stgv2BtnPrimary")}
                  onClick={onSaveProfile}
                  disabled={!hasProfileChanges}
                >
                  <IcoSave /> Save Profile
                </button>
              </div>
            </div>
          )}

          {/* ═══ NOTIFICATIONS TAB ═══ */}
          {activeTab === "notifications" && (
            <div className={cx("stgv2Panel")}>
              <div className={cx("stgv2PanelHead")}>
                <div className={cx("stgv2PanelTitle")}>Notification Preferences</div>
                <div className={cx("stgv2PanelSub")}>Choose which events trigger alerts and reminders.</div>
              </div>

              {hasNotificationsChanges && (
                <div className={cx("stgv2UnsavedBanner")}>
                  <span className={cx("stgv2UnsavedDot")} /> Unsaved changes
                </div>
              )}

              <div className={cx("stgv2NotifList")}>
                {[
                  { key: "taskAssignments"      as const, icon: <IcoTask />,        label: "Task Assignments",       desc: "When a new task is assigned to you",                tone: "accent"  },
                  { key: "clientMessages"        as const, icon: <IcoMsg />,         label: "Client Messages",        desc: "New messages from clients on your projects",        tone: "blue"    },
                  { key: "deliverableReminders"  as const, icon: <IcoDeliverable />, label: "Deliverable Reminders",  desc: "24 hours before a deliverable is due",             tone: "amber"   },
                  { key: "standupReminders"      as const, icon: <IcoStandup />,     label: "Standup Reminders",      desc: "Daily 9 AM check-in prompt",                       tone: "green"   },
                  { key: "weeklyTimeSummary"     as const, icon: <IcoDigest />,      label: "Weekly Time Summary",    desc: "Friday PM digest of your logged hours",            tone: "purple"  },
                ].map(({ key, icon, label, desc, tone }) => (
                  <div key={key} className={cx("stgv2NotifRow")}>
                    <div className={cx("stgv2NotifIcoWrap", `stgv2NotifTone${tone.charAt(0).toUpperCase() + tone.slice(1)}`)}>
                      {icon}
                    </div>
                    <div className={cx("stgv2NotifBody")}>
                      <div className={cx("stgv2NotifLabel")}>{label}</div>
                      <div className={cx("stgv2NotifDesc")}>{desc}</div>
                    </div>
                    <div className={cx("stgv2NotifToggle")}>
                      <ToggleRow
                        label=""
                        desc=""
                        enabled={notifications[key]}
                        onToggle={(next) => onNotificationChange(key, next)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className={cx("stgv2Actions")}>
                <span className={cx("stgv2NotifCount")}>{enabledCount} of {totalCount} enabled</span>
                <button
                  type="button"
                  className={cx("stgv2BtnGhost")}
                  onClick={onResetNotifications}
                  disabled={!hasNotificationsChanges}
                >
                  <IcoReset /> Reset
                </button>
                <button
                  type="button"
                  className={cx("stgv2BtnPrimary")}
                  onClick={onSaveNotifications}
                  disabled={!hasNotificationsChanges}
                >
                  <IcoSave /> Save
                </button>
              </div>
            </div>
          )}

          {/* ═══ WORKSPACE TAB ═══ */}
          {activeTab === "workspace" && (
            <div className={cx("stgv2Panel")}>
              <div className={cx("stgv2PanelHead")}>
                <div className={cx("stgv2PanelTitle")}>Work Preferences</div>
                <div className={cx("stgv2PanelSub")}>Configure your timezone, working hours, and default status.</div>
              </div>

              {hasWorkspaceChanges && (
                <div className={cx("stgv2UnsavedBanner")}>
                  <span className={cx("stgv2UnsavedDot")} /> Unsaved changes
                </div>
              )}

              {/* Timezone */}
              <div className={cx("stgv2Section")}>
                <div className={cx("stgv2SectionLabel")}>
                  <IcoGlobe /> Timezone
                </div>
                <select
                  id="stgv2-timezone"
                  className={cx("fieldInput", "fieldSelect")}
                  value={workspace.timezone}
                  onChange={(e) => onWorkspaceChange("timezone", e.target.value)}
                >
                  {timezoneOptions.slice(0, 200).map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={cx("stgv2LocalBtn")}
                  onClick={onUseLocalTimezone}
                >
                  <IcoGlobe /> Detect my timezone
                </button>
              </div>

              {/* Working hours */}
              <div className={cx("stgv2Section")}>
                <div className={cx("stgv2SectionLabel")}>
                  <IcoClock /> Working Hours
                </div>
                <div className={cx("stgv2HoursWrap")}>
                  <div className={cx("stgv2HoursField")}>
                    <label className={cx("stgv2HoursLbl")} htmlFor="stgv2-start">From</label>
                    <input
                      id="stgv2-start"
                      aria-label="Work start time"
                      className={cx("fieldInput")}
                      value={workspace.workStart}
                      type="time"
                      onChange={(e) => onWorkspaceChange("workStart", e.target.value)}
                    />
                  </div>
                  <div className={cx("stgv2HoursSep")}>
                    <IcoClock />
                  </div>
                  <div className={cx("stgv2HoursField")}>
                    <label className={cx("stgv2HoursLbl")} htmlFor="stgv2-end">To</label>
                    <input
                      id="stgv2-end"
                      aria-label="Work end time"
                      className={cx("fieldInput")}
                      value={workspace.workEnd}
                      type="time"
                      onChange={(e) => onWorkspaceChange("workEnd", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Default status */}
              <div className={cx("stgv2Section")}>
                <div className={cx("stgv2SectionLabel")}>Default Status on Login</div>
                <div className={cx("stgv2StatusGrid")}>
                  {STATUS_OPTS.map((opt) => {
                    const isSelected = workspace.defaultStatus === opt;
                    const dotCls = opt === "Available" ? "stgv2DotGreen" : opt === "Focused" ? "stgv2DotAccent" : "stgv2DotAmber";
                    return (
                      <button
                        key={opt}
                        type="button"
                        className={cx("stgv2StatusCard", isSelected ? "stgv2StatusCardActive" : "stgv2StatusCardIdle")}
                        onClick={() => onWorkspaceChange("defaultStatus", opt)}
                      >
                        <span className={cx("stgv2StatusDot2", dotCls)} />
                        <span className={cx("stgv2StatusOpt")}>{opt}</span>
                        {isSelected && <span className={cx("stgv2StatusCheck")}><IcoCheck /></span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={cx("stgv2Actions")}>
                <button
                  type="button"
                  className={cx("stgv2BtnGhost")}
                  onClick={onResetWorkspace}
                  disabled={!hasWorkspaceChanges}
                >
                  <IcoReset /> Reset
                </button>
                <button
                  type="button"
                  className={cx("stgv2BtnPrimary")}
                  onClick={onSaveWorkspace}
                  disabled={!hasWorkspaceChanges}
                >
                  <IcoSave /> Save Preferences
                </button>
              </div>

              {/* ── Onboarding tour ── */}
              {onRestartTour && (
                <div className={cx("stgv2Section")}>
                  <div className={cx("stgv2SectionLabel")}>Onboarding Tour</div>
                  <div className={cx("stgv2SectionDesc")}>Re-run the staff dashboard walkthrough to refresh your orientation.</div>
                  <button
                    type="button"
                    className={cx("stgv2BtnPrimary")}
                    onClick={onRestartTour}
                  >
                    Restart Tour
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══ APPEARANCE TAB ═══ */}
          {activeTab === "appearance" && (
            <div className={cx("stgv2Panel")}>
              <div className={cx("stgv2PanelHead")}>
                <div className={cx("stgv2PanelTitle")}>Appearance</div>
                <div className={cx("stgv2PanelSub")}>Customize how the dashboard looks and feels.</div>
              </div>

              {/* Theme */}
              <div className={cx("stgv2Section")}>
                <div className={cx("stgv2SectionLabel")}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.8 2.8l1 1M10.2 10.2l1 1M2.8 11.2l1-1M10.2 3.8l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Color Theme
                </div>
                <div className={cx("stgv2ThemeGrid")}>
                  {(["dark", "light"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={cx("stgv2ThemeCard", theme === t ? "stgv2ThemeCardActive" : "stgv2ThemeCardIdle")}
                      onClick={() => onThemeChange(t)}
                    >
                      <div className={cx("stgv2ThemePreview", t === "dark" ? "stgv2ThemePreviewDark" : "stgv2ThemePreviewLight")}>
                        <div className={cx("stgv2ThemePreviewSidebar")} />
                        <div className={cx("stgv2ThemePreviewContent")}>
                          <div className={cx("stgv2ThemePreviewBar")} />
                          <div className={cx("stgv2ThemePreviewCard")} />
                          <div className={cx("stgv2ThemePreviewCard")} />
                        </div>
                      </div>
                      <div className={cx("stgv2ThemeLabel")}>
                        <span className={cx("stgv2ThemeName")}>{t === "dark" ? "Dark" : "Light"}</span>
                        {theme === t && <span className={cx("stgv2StatusCheck")}><IcoCheck /></span>}
                      </div>
                    </button>
                  ))}
                </div>
                <div className={cx("stgv2FocusNote")}>
                  Theme is stored locally in your browser and doesn't affect other team members.
                </div>
              </div>
            </div>
          )}

          {/* ═══ KANBAN TAB ═══ */}
          {activeTab === "kanban" && (
            <div className={cx("stgv2Panel")}>
              <div className={cx("stgv2PanelHead")}>
                <div className={cx("stgv2PanelTitle")}>Kanban Preferences</div>
                <div className={cx("stgv2PanelSub")}>Set your default view mode and board organisation. Changes apply immediately.</div>
              </div>

              {/* View mode */}
              <div className={cx("stgv2Section")}>
                <div className={cx("stgv2SectionLabel")}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Default View Mode
                </div>
                <div className={cx("stgv2KanbanOptGrid")}>
                  {([
                    { value: "all",            label: "All Tasks",       desc: "See every task across all projects"       },
                    { value: "my_work",        label: "My Work",         desc: "Only tasks assigned to you"               },
                    { value: "urgent",         label: "Urgent",          desc: "High priority and overdue items"          },
                    { value: "client_waiting", label: "Client Waiting",  desc: "Tasks awaiting client input or approval"  },
                    { value: "blocked",        label: "Blocked",         desc: "Tasks with active blockers"               },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={cx("stgv2KanbanOptCard", kanbanViewMode === opt.value ? "stgv2KanbanOptActive" : "stgv2KanbanOptIdle")}
                      onClick={() => onKanbanViewModeChange(opt.value)}
                    >
                      <div className={cx("stgv2KanbanOptTop")}>
                        <span className={cx("stgv2KanbanOptLabel")}>{opt.label}</span>
                        {kanbanViewMode === opt.value && <span className={cx("stgv2StatusCheck")}><IcoCheck /></span>}
                      </div>
                      <div className={cx("stgv2KanbanOptDesc")}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={cx("stgv2RailDivider", "stgv2DividerH")} />

              {/* Swimlane */}
              <div className={cx("stgv2Section")}>
                <div className={cx("stgv2SectionLabel")}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <rect x="1.5" y="1.5" width="11" height="3" rx="1" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="1.5" y="5.5" width="11" height="3" rx="1" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="1.5" y="9.5" width="11" height="3" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                  Board Organisation (Swimlanes)
                </div>
                <div className={cx("stgv2StatusGrid")}>
                  {([
                    { value: "status",  label: "By Status",  dot: "stgv2DotAccent", desc: "To-Do → In Progress → Done" },
                    { value: "project", label: "By Project",  dot: "stgv2DotBlue",   desc: "One lane per project"       },
                    { value: "client",  label: "By Client",   dot: "stgv2DotAmber",  desc: "One lane per client"        },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={cx("stgv2StatusCard", kanbanSwimlane === opt.value ? "stgv2StatusCardActive" : "stgv2StatusCardIdle")}
                      onClick={() => onKanbanSwimlaneChange(opt.value)}
                    >
                      <span className={cx("stgv2StatusDot2", opt.dot)} />
                      <div className={cx("flexCol", "gap1", "flex1")}>
                        <span className={cx("stgv2StatusOpt")}>{opt.label}</span>
                        <span className={cx("fontMono", "text11", "colorMuted2", "lineH13")}>{opt.desc}</span>
                      </div>
                      {kanbanSwimlane === opt.value && <span className={cx("stgv2StatusCheck")}><IcoCheck /></span>}
                    </button>
                  ))}
                </div>
                <div className={cx("stgv2FocusNote")}>
                  View mode and swimlane are saved automatically and persist across sessions.
                </div>
              </div>
            </div>
          )}

          {/* ═══ FOCUS AREAS TAB ═══ */}
          {activeTab === "focus" && (
            <div className={cx("stgv2Panel")}>
              <div className={cx("stgv2PanelHead")}>
                <div className={cx("stgv2PanelTitle")}>Focus Areas</div>
                <div className={cx("stgv2PanelSub")}>Your active projects and high-priority clients. Managed by your team lead.</div>
              </div>

              <div className={cx("stgv2FocusSection")}>
                <div className={cx("stgv2FocusLabel")}>
                  Active Projects
                  <span className={cx("stgv2FocusCount")}>{projects.length}</span>
                </div>
                <div className={cx("stgv2TagCloud")}>
                  {projects.length === 0 ? (
                    <span className={cx("colorMuted", "text12")}>No active projects assigned yet.</span>
                  ) : (
                    projects.slice(0, 8).map((p) => (
                      <span key={p.id} className={cx("stgv2Tag", "stgv2TagAccent")}>{p.name}</span>
                    ))
                  )}
                </div>
              </div>

              <div className={cx("stgv2RailDivider", "stgv2DividerH")} />

              <div className={cx("stgv2FocusSection")}>
                <div className={cx("stgv2FocusLabel")}>
                  High-Priority Clients
                  <span className={cx("stgv2FocusCount")}>{highPriorityClients.length}</span>
                </div>
                <div className={cx("stgv2TagCloud")}>
                  {highPriorityClients.length === 0 ? (
                    <span className={cx("colorMuted", "text12")}>No high-priority clients assigned yet.</span>
                  ) : (
                    highPriorityClients.slice(0, 8).map((client) => (
                      <span key={client} className={cx("stgv2Tag", "stgv2TagAmber")}>{client}</span>
                    ))
                  )}
                </div>
              </div>

              <div className={cx("stgv2FocusNote")}>
                Focus areas are managed by your team lead and reflect your current assignments.
              </div>
            </div>
          )}

          {/* ═══ SECURITY TAB ═══ */}
          {activeTab === "security" && (
            <div className={cx("stgv2Panel")}>
              <div className={cx("stgv2PanelHead")}>
                <div className={cx("stgv2PanelTitle")}>Two-Factor Authentication</div>
                <div className={cx("stgv2PanelSub")}>Add an extra layer of security to your account using an authenticator app.</div>
              </div>

              {twoFaLoading ? (
                <div className={cx("stgv2SecurityRow")}>
                  <span className={cx("colorMuted")}>Loading...</span>
                </div>
              ) : twoFaEnabled ? (
                <div className={cx("stgv2SecurityRow")}>
                  <div className={cx("stgv2SecurityRowInfo")}>
                    <div className={cx("stgv2SecurityRowLabel")}>Status</div>
                    <div className={cx("stgv2SecurityRowSub")}>Two-factor authentication is active on this account.</div>
                  </div>
                  <button type="button" className={cx("stgv2BtnDanger")} onClick={() => setTwoFaDisableOpen(true)}>
                    Disable 2FA
                  </button>
                </div>
              ) : (
                <div className={cx("stgv2SecurityRow")}>
                  <div className={cx("stgv2SecurityRowInfo")}>
                    <div className={cx("stgv2SecurityRowLabel")}>Status</div>
                    <div className={cx("stgv2SecurityRowSub")}>Two-factor authentication is not enabled.</div>
                  </div>
                  <button type="button" className={cx("stgv2BtnPrimary")} onClick={() => void handleSetup2fa()}>
                    Enable 2FA
                  </button>
                </div>
              )}

              {/* Setup modal */}
              {twoFaSetupOpen ? (
                <div className={cx("stgv2ModalBackdrop")} onClick={() => setTwoFaSetupOpen(false)}>
                  <div className={cx("stgv2Modal")} onClick={(e) => e.stopPropagation()}>
                    {twoFaSetupStep === "qr" ? (
                      <>
                        <div className={cx("stgv2ModalTitle")}>Set Up Two-Factor Authentication</div>
                        <p className={cx("colorMuted")}>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                        {twoFaQrUrl ? (
                          <img src={twoFaQrUrl} alt="QR Code" className={cx("stgv2QrImg")} />
                        ) : null}
                        <p className={cx("colorMuted")}>
                          Or enter this secret manually:{" "}
                          <code className={cx("stgv2InlineCode")}>{twoFaSecret}</code>
                        </p>
                        <button type="button" className={cx("stgv2BtnPrimary")} onClick={() => setTwoFaSetupStep("verify")}>
                          Next: Verify Code
                        </button>
                      </>
                    ) : twoFaSetupStep === "verify" ? (
                      <>
                        <div className={cx("stgv2ModalTitle")}>Verify Setup</div>
                        <p className={cx("colorMuted")}>Enter the 6-digit code from your authenticator app to activate 2FA.</p>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={cx("stgv2OtpInput")}
                          placeholder="000000"
                          maxLength={6}
                          value={twoFaVerifyCode}
                          onChange={(e) => setTwoFaVerifyCode(e.target.value.replace(/\D/g, ""))}
                        />
                        {twoFaVerifyError ? <p className={cx("stgv2ErrMsg")}>{twoFaVerifyError}</p> : null}
                        <button
                          type="button"
                          className={cx("stgv2BtnPrimary")}
                          onClick={() => void handleVerify2fa()}
                          disabled={twoFaVerifyBusy || twoFaVerifyCode.length !== 6}
                        >
                          {twoFaVerifyBusy ? "Verifying..." : "Verify & Activate"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className={cx("stgv2ModalTitle")}>Save Your Backup Codes</div>
                        <p className={cx("colorMuted")}>Store these codes safely. Each can only be used once.</p>
                        <div className={cx("stgv2BackupGrid")}>
                          {twoFaBackupCodes.map((code) => (
                            <code key={code} className={cx("stgv2BackupItem")}>{code}</code>
                          ))}
                        </div>
                        <div className={cx("stgv2ModalActions")}>
                          <button
                            type="button"
                            className={cx("stgv2BtnSecondary")}
                            onClick={() => {
                              const blob = new Blob([twoFaBackupCodes.join("\n")], { type: "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "maphari-backup-codes.txt";
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            Download Codes
                          </button>
                          <button
                            type="button"
                            className={cx("stgv2BtnPrimary")}
                            onClick={() => { setTwoFaSetupOpen(false); setTwoFaVerifyCode(""); }}
                          >
                            Done
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Disable modal */}
              {twoFaDisableOpen ? (
                <div className={cx("stgv2ModalBackdrop")} onClick={() => setTwoFaDisableOpen(false)}>
                  <div className={cx("stgv2Modal")} onClick={(e) => e.stopPropagation()}>
                    <div className={cx("stgv2ModalTitle")}>Disable Two-Factor Authentication</div>
                    <p className={cx("colorMuted")}>Enter your password to confirm you want to remove 2FA protection.</p>
                    <input
                      type="password"
                      className={cx("stgv2PasswordInput")}
                      placeholder="Current password"
                      value={twoFaDisablePassword}
                      onChange={(e) => setTwoFaDisablePassword(e.target.value)}
                    />
                    {twoFaDisableError ? <p className={cx("stgv2ErrMsg")}>{twoFaDisableError}</p> : null}
                    <div className={cx("stgv2ModalActions")}>
                      <button
                        type="button"
                        className={cx("stgv2BtnSecondary")}
                        onClick={() => { setTwoFaDisableOpen(false); setTwoFaDisablePassword(""); setTwoFaDisableError(""); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={cx("stgv2BtnDanger")}
                        onClick={() => void handleDisable2fa()}
                        disabled={twoFaDisableBusy || !twoFaDisablePassword.trim()}
                      >
                        {twoFaDisableBusy ? "Disabling..." : "Disable 2FA"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
