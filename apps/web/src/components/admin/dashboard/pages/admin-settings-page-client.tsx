"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { useAdminSettings } from "../hooks/use-admin-settings";
import { cx, styles } from "../style";
import type { DashboardToast } from "../../../shared/dashboard-core";
import type { PageId } from "../config";
import type { NotificationJob, PartnerApiKey } from "../../../../lib/api/admin";
import type { TotpSetupData, LoginSessionEvent } from "../../../../lib/api/admin/auth-2fa";
import {
  get2faStatusWithRefresh,
  setup2faWithRefresh,
  verify2faWithRefresh,
  disable2faWithRefresh,
  getMySessionsWithRefresh,
  signOutAllSessionsWithRefresh,
} from "../../../../lib/api/admin/auth-2fa";
import { saveSession } from "../../../../lib/auth/session";
import { formatDate, formatDateTime } from "./admin-page-utils";
import { ThemeToggle } from "@/components/shared/ui/theme-toggle";
import { StatWidget, WidgetGrid } from "../widgets";

export function AdminSettingsPageClient({
  jobs,
  publicApiKeys,
  analyticsPoints,
  onNavigate,
  onNotify,
  currencyValue,
  onCurrencySaved,
  onRestartTour,
}: {
  jobs: NotificationJob[];
  publicApiKeys: PartnerApiKey[];
  analyticsPoints: number;
  onNavigate: (page: PageId) => void;
  onNotify: (tone: DashboardToast["tone"], message: string) => void;
  currencyValue: string;
  onCurrencySaved: (currency: string) => void;
  onRestartTour?: () => void;
}) {
  const { snapshot, session } = useAdminWorkspaceContext();

  const {
    displayName,
    setDisplayName,
    company,
    setCompany,
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
    projectAlerts,
    setProjectAlerts,
    invoiceAlerts,
    setInvoiceAlerts,
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
    filteredSettingsLog,
    saveProfileSettings,
    saveWorkspaceSettings,
    saveSecuritySettings,
    saveNotificationSettings,
    saveApiAccessSettings,
  } = useAdminSettings({
    session,
    publicApiKeys,
    pushToast: onNotify,
    setAdminDisplayCurrency: onCurrencySaved,
    currencyValue,
  });

  // ── 2FA / TOTP state ──────────────────────────────────────────────────────
  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null);
  const [totpEnabledAt, setTotpEnabledAt] = useState<string | null>(null);
  const [totpSetupData, setTotpSetupData] = useState<TotpSetupData | null>(null);
  const [totpModalOpen, setTotpModalOpen] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [totpCodeError, setTotpCodeError] = useState("");
  const [totpVerifying, setTotpVerifying] = useState(false);
  const [totpSettingUp, setTotpSettingUp] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableError, setDisableError] = useState("");
  const [disabling, setDisabling] = useState(false);

  // ── Active Sessions state ─────────────────────────────────────────────────
  const [sessions, setSessions] = useState<LoginSessionEvent[]>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [signOutAllBusy, setSignOutAllBusy] = useState(false);

  // Load 2FA status + sessions when security tab is active
  const didLoad2fa = useRef(false);
  useEffect(() => {
    if (activeTab !== "security") return;
    if (didLoad2fa.current) return;
    if (!session) return;
    didLoad2fa.current = true;
    void (async () => {
      const [statusResult, sessionsResult] = await Promise.all([
        get2faStatusWithRefresh(session),
        getMySessionsWithRefresh(session),
      ]);
      if (statusResult.nextSession) saveSession(statusResult.nextSession);
      if (statusResult.data) {
        setTotpEnabled(statusResult.data.enabled);
        setTotpEnabledAt(statusResult.data.enabledAt);
      }
      if (sessionsResult.nextSession) saveSession(sessionsResult.nextSession);
      if (!sessionsResult.error && sessionsResult.data) setSessions(sessionsResult.data);
      setSessionsLoaded(true);
    })();
  }, [activeTab, session]);

  const handleSetup2fa = useCallback(async () => {
    if (!session) return;
    setTotpSettingUp(true);
    setTotpCode("");
    setTotpCodeError("");
    const result = await setup2faWithRefresh(session);
    setTotpSettingUp(false);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error || !result.data) {
      onNotify("error", result.error?.message ?? "Failed to initiate 2FA setup.");
      return;
    }
    setTotpSetupData(result.data);
    setTotpModalOpen(true);
  }, [session, onNotify]);

  const handleVerify2fa = useCallback(async () => {
    if (!session) return;
    if (!/^\d{6}$/.test(totpCode.replace(/\s/g, ""))) {
      setTotpCodeError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setTotpVerifying(true);
    setTotpCodeError("");
    const result = await verify2faWithRefresh(session, totpCode.trim());
    setTotpVerifying(false);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error || !result.data) {
      setTotpCodeError(result.error?.message ?? "Invalid code. Please try again.");
      return;
    }
    setTotpEnabled(true);
    setTotpEnabledAt(new Date().toISOString());
    setTotpModalOpen(false);
    setTotpSetupData(null);
    setTotpCode("");
    onNotify("success", "Two-factor authentication is now active on your account.");
  }, [session, totpCode, onNotify]);

  const handleDisable2fa = useCallback(async () => {
    if (!session) return;
    if (!disablePassword) { setDisableError("Password is required."); return; }
    setDisabling(true);
    setDisableError("");
    const result = await disable2faWithRefresh(session, disablePassword);
    setDisabling(false);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error || !result.data) {
      setDisableError(result.error?.message ?? "Failed to disable 2FA.");
      return;
    }
    setTotpEnabled(false);
    setTotpEnabledAt(null);
    setDisableModalOpen(false);
    setDisablePassword("");
    onNotify("warning", "Two-factor authentication has been disabled.");
  }, [session, disablePassword, onNotify]);

  const handleSignOutAll = useCallback(async () => {
    if (!session) return;
    setSignOutAllBusy(true);
    const result = await signOutAllSessionsWithRefresh(session);
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.error) {
      setSessions([]);
      onNotify("success", "All other devices have been signed out.");
    } else {
      onNotify("error", "Failed to sign out devices.");
    }
    setSignOutAllBusy(false);
  }, [session, onNotify]);

  const queuedJobs = jobs.filter((j) => j.status === "QUEUED").length;
  const failedJobs = jobs.filter((j) => j.status === "FAILED").length;
  const activeClients = snapshot.clients.filter(
    (c) => c.status === "ACTIVE",
  ).length;
  const adminSeats = 1;
  const staffSeats = 0;
  const needsAttention = (mfaRequired ? 0 : 1) + (failedJobs > 0 ? 1 : 0);

  const statToneClass = (color: string): string => {
    if (color === "var(--red)") return "colorRed";
    if (color === "var(--amber)") return "colorAmber";
    if (color === "var(--blue)") return "colorBlue";
    if (color === "var(--purple)") return "colorPurple";
    if (color === "var(--muted)") return "colorMuted";
    return "colorAccent";
  };

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ACCOUNT / SETTINGS</div>
          <h1 className={styles.pageTitle}>Settings</h1>
          <div className={styles.pageSub}>
            Configuration controls only. Detailed access changes remain in Staff
            Access and global events remain in Audit Log.
          </div>
        </div>
        <div className={styles.pageActions}>
          <button
            type="button"
            onClick={() => onNavigate("staff")}
            className={cx("btnSm", "btnGhost")}
          >
            Staff Access
          </button>
          <button
            type="button"
            onClick={() => onNavigate("audit")}
            className={cx("btnSm", "btnAccent")}
          >
            Open Audit Log
          </button>
        </div>
      </div>

      <WidgetGrid>
        <StatWidget label="Active Clients"   value={activeClients}   sub="Current workspace footprint"   tone="accent" />
        <StatWidget label="Queued Jobs"      value={queuedJobs}      sub="Pending delivery pipeline"     tone={queuedJobs > 0 ? "amber" : "default"} />
        <StatWidget label="Failed Jobs"      value={failedJobs}      sub="Retry and triage required"     tone={failedJobs > 0 ? "red" : "green"} />
        <StatWidget label="Needs Attention"  value={needsAttention}  sub="Policy and reliability flags"  tone={needsAttention > 0 ? "amber" : "green"} />
      </WidgetGrid>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as typeof activeTab)} className={styles.filterSelect}>
          {settingsTabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "profile" ? (
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Organization Profile</span>
            <span className={styles.metaMono}>
              {lastSavedProfile
                ? `Last saved ${formatDateTime(lastSavedProfile)}`
                : "Not saved yet"}
            </span>
          </div>
          <div className={styles.cardInner}>
            <div className={styles.formGroup}>
              <label htmlFor="admin-settings-display-name">Display Name</label>
              <input
                id="admin-settings-display-name"
                className={styles.msgInput}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="admin-settings-email">Email</label>
              <input
                id="admin-settings-email"
                className={styles.msgInput}
                value={session?.user.email ?? ""}
                readOnly
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="admin-settings-company">Company</label>
              <input
                id="admin-settings-company"
                className={styles.msgInput}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="admin-settings-timezone">Timezone</label>
              <input
                id="admin-settings-timezone"
                className={styles.msgInput}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="admin-settings-currency">Currency</label>
              <select
                id="admin-settings-currency"
                title="Select currency"
                className={styles.selectInput}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="AUTO">Auto-detect from browser locale</option>
                <option value="ZAR">ZAR — South African Rand</option>
                <option value="USD">USD — US Dollar</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="EUR">EUR — Euro</option>
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="AED">AED — UAE Dirham</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="AUD">AUD — Australian Dollar</option>
                <option value="INR">INR — Indian Rupee</option>
                <option value="SGD">SGD — Singapore Dollar</option>
              </select>
            </div>
            <button
              type="button"
              className={cx("btnSm", "btnAccent")}
              onClick={() => void saveProfileSettings()}
            >
              Save Profile
            </button>
          </div>
        </article>
      ) : null}

      {activeTab === "workspace" ? (
        <>
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Workspace Preferences</span>
            <span className={styles.metaMono}>
              {lastSavedWorkspace
                ? `Last saved ${formatDateTime(lastSavedWorkspace)}`
                : "Not saved yet"}
            </span>
          </div>
          <div className={styles.cardInner}>
            <div className={styles.formGroup}>
              <label htmlFor="admin-settings-density">Dashboard Density</label>
              <select
                id="admin-settings-density"
                title="Select dashboard density"
                className={styles.selectInput}
                value={density}
                onChange={(e) => setDensity(e.target.value as typeof density)}
              >
                <option value="Comfortable">Comfortable</option>
                <option value="Compact">Compact</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="admin-settings-landing-page">
                Default Landing Tab
              </label>
              <select
                id="admin-settings-landing-page"
                title="Select default landing tab"
                className={styles.selectInput}
                value={landingPage}
                onChange={(e) => setLandingPage(e.target.value as PageId)}
              >
                <option value="dashboard">Dashboard</option>
                <option value="leads">Leads</option>
                <option value="clients">Clients</option>
                <option value="projects">Projects</option>
                <option value="invoices">Billing</option>
              </select>
            </div>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleTitle}>
                  Project Request Assignment
                </div>
                <div className={styles.toggleSub}>
                  {projectRequestAssignmentMode === "AUTO"
                    ? "Automatic assignment by availability + skill profile"
                    : "Manual assignment by admin selection"}
                </div>
              </div>
              <button
                title="Toggle automatic project request assignment"
                type="button"
                className={`${styles.switchBase} ${projectRequestAssignmentMode === "AUTO" ? styles.switchOn : ""}`}
                onClick={() =>
                  setProjectRequestAssignmentMode((curr) =>
                    curr === "AUTO" ? "MANUAL" : "AUTO",
                  )
                }
                aria-pressed={projectRequestAssignmentMode === "AUTO" ? "true" : "false"}
                aria-label="Toggle automatic project request assignment"
              >
                <span
                  className={
                    projectRequestAssignmentMode === "AUTO"
                      ? styles.switchThumbOn
                      : styles.switchThumbOff
                  }
                />
              </button>
            </div>
            {workspaceStaffUsers.length > 0 ? (
              <div className={styles.formGroup}>
                <label>Staff Skill Profiles</label>
                <div className={cx("emptySub", "mb8")}>
                  Used by auto-assignment to match service type.
                </div>
                {workspaceStaffUsers.map((staff) => (
                  <div key={staff.id} className={cx("formGroup", "mb8")}>
                    <div className={styles.metaMono}>{staff.email}</div>
                    <div className={styles.toolbarRow}>
                      {[
                        "WEBSITE",
                        "MOBILE_APP",
                        "AUTOMATION",
                        "UI_UX_DESIGN",
                        "OTHER",
                      ].map((skill) => {
                        const selected = (
                          staffSkillProfiles[staff.id] ?? []
                        ).includes(skill);
                        return (
                          <label
                            key={`${staff.id}-${skill}`}
                            className={styles.checkboxRow}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => {
                                setStaffSkillProfiles((prev) => {
                                  const current = prev[staff.id] ?? [];
                                  const next = e.target.checked
                                    ? [...new Set([...current, skill])]
                                    : current.filter((s) => s !== skill);
                                  return { ...prev, [staff.id]: next };
                                });
                              }}
                            />
                            {skill}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              className={cx("btnSm", "btnAccent")}
              onClick={() => void saveWorkspaceSettings()}
            >
              Save Preferences
            </button>
          </div>
        </article>

        {onRestartTour && (
          <article className={styles.card}>
            <div className={styles.cardHd}>
              <span className={styles.cardHdTitle}>Onboarding Tour</span>
            </div>
            <div className={styles.cardInner}>
              <div className={styles.emptySub}>Re-run the admin dashboard walkthrough to refresh your orientation.</div>
              <div className={`${styles.toolbarRow} ${styles.toolbarRowTop12}`}>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  onClick={onRestartTour}
                >
                  Restart Tour
                </button>
              </div>
            </div>
          </article>
        )}
        </>
      ) : null}

      {activeTab === "security" ? (
        <>
        <div className={styles.twoCol}>
          <article className={styles.card}>
            <div className={styles.cardHd}>
              <span className={styles.cardHdTitle}>Security Basics</span>
              <span className={styles.metaMono}>
                {lastSavedSecurity
                  ? `Last saved ${formatDateTime(lastSavedSecurity)}`
                  : "Not saved yet"}
              </span>
            </div>
            <div className={styles.cardInner}>
              <div className={styles.formGroup}>
                <label htmlFor="admin-settings-session-timeout">
                  Session Timeout (minutes)
                </label>
                <input
                  id="admin-settings-session-timeout"
                  className={styles.msgInput}
                  type="number"
                  min="15"
                  max="240"
                  value={sessionMinutes}
                  onChange={(e) => setSessionMinutes(Number(e.target.value))}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="admin-settings-password-policy">
                  Password Policy
                </label>
                <select
                  id="admin-settings-password-policy"
                  title="Select password policy"
                  className={styles.selectInput}
                  value={passwordPolicy}
                  onChange={(e) => setPasswordPolicy(e.target.value)}
                >
                  <option value="Strong">Strong</option>
                  <option value="Very Strong">Very Strong</option>
                </select>
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleTitle}>
                    Require MFA for admin
                  </div>
                  <div className={styles.toggleSub}>
                    Enforce second factor for privileged users
                  </div>
                </div>
                <button
                  title="Toggle MFA requirement"
                  type="button"
                  className={`${styles.switchBase} ${mfaRequired ? styles.switchOn : ""}`}
                  onClick={() => setMfaRequired((v) => !v)}
                >
                  <div
                    className={
                      mfaRequired ? styles.switchThumbOn : styles.switchThumbOff
                    }
                  />
                </button>
              </div>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => void saveSecuritySettings()}
              >
                Save Security
              </button>
            </div>
          </article>
          <article className={styles.card}>
            <div className={styles.cardHd}>
              <span className={styles.cardHdTitle}>Roles & Access Summary</span>
            </div>
            <div className={styles.cardInner}>
              <table className={styles.projTable}>
                <thead>
                  <tr>
                    <th scope="col">Role</th>
                    <th scope="col">Seats</th>
                    <th scope="col">Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Admin</td>
                    <td>{adminSeats}</td>
                    <td>Full access</td>
                  </tr>
                  <tr>
                    <td>Staff</td>
                    <td>{staffSeats}</td>
                    <td>Operations + delivery</td>
                  </tr>
                  <tr>
                    <td>Client</td>
                    <td>{snapshot.clients.length}</td>
                    <td>Client portal only</td>
                  </tr>
                </tbody>
              </table>
              <div className={cx("pageSub", "mt10")}>
                Detailed role grants, API key permissions, and admin action
                history live in Staff Access.
              </div>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => onNavigate("staff")}
              >
                Open Staff Access
              </button>
            </div>
          </article>
        </div>

        {/* ── Two-Factor Authentication card (full-width below the two-col) ── */}
        <article className={cx(styles.card, "mt16")}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Two-Factor Authentication (TOTP)</span>
            <span className={styles.metaMono}>
              {totpEnabled === null
                ? "Checking status…"
                : totpEnabled
                ? `Enabled${totpEnabledAt ? ` · ${formatDate(totpEnabledAt)}` : ""}`
                : "Not enabled"}
            </span>
          </div>
          <div className={styles.cardInner}>
            <div className={cx(styles.pageSub, "mb16")}>
              Protect your admin account with a time-based one-time password (TOTP).
              Works with Google Authenticator, Authy, 1Password, and any RFC 6238-compatible app.
            </div>

            {totpEnabled === false && (
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => void handleSetup2fa()}
                disabled={totpSettingUp}
              >
                {totpSettingUp ? "Generating…" : "Set Up 2FA"}
              </button>
            )}
            {totpEnabled === true && (
              <div className={cx(styles.totpBtnRow)}>
                <span className={cx(styles.totpStatusActive)}>
                  ✓ Active
                </span>
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost")}
                  onClick={() => { setDisableModalOpen(true); setDisablePassword(""); setDisableError(""); }}
                >
                  Disable 2FA
                </button>
              </div>
            )}
          </div>
        </article>

        {/* ── Active Sessions card ── */}
        <article className={cx(styles.card, "mt16")}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Active Sessions</span>
            <button
              type="button"
              className={cx("btnSm", "btnDanger")}
              onClick={() => void handleSignOutAll()}
              disabled={signOutAllBusy || sessions.length === 0}
            >
              {signOutAllBusy ? "Signing out…" : "Sign out all devices"}
            </button>
          </div>
          <div className={styles.cardInner}>
            {!sessionsLoaded ? (
              <div className={cx("colorMuted2", "text12")}>Loading sessions…</div>
            ) : sessions.length === 0 ? (
              <div className={cx("colorMuted", "text12")}>No recent login sessions found.</div>
            ) : (
              <table className={styles.projTable}>
                <thead>
                  <tr>
                    <th scope="col">IP Address</th>
                    <th scope="col">Device / Browser</th>
                    <th scope="col">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td className={cx("fontMono", "text12")}>{s.ipAddress ?? "Unknown"}</td>
                      <td className={cx("colorMuted", "text12")}>{s.userAgent ? s.userAgent.slice(0, 60) : "Unknown"}</td>
                      <td className={cx("fontMono", "text12")}>{formatDateTime(s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>

        {/* ── Setup Modal: QR code + backup codes + code input ── */}
        {totpModalOpen && totpSetupData && (
          <div className={styles.totpModalOverlay}>
            <div className={styles.totpModalBox}>
              <div>
                <div className={styles.totpModalTitle}>
                  Scan QR Code
                </div>
                <div className={styles.pageSub}>
                  Open your authenticator app and scan the code below, then enter the
                  6-digit verification code to activate 2FA.
                </div>
              </div>

              {/* QR code */}
              <div className={styles.totpQrCenter}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={totpSetupData.qrCodeDataUrl}
                  alt="TOTP QR code"
                  width={200}
                  height={200}
                  className={styles.totpQrImg}
                />
              </div>

              {/* Manual entry key */}
              <div>
                <div className={styles.totpManualKeyLabel}>
                  Or enter this key manually in your app:
                </div>
                <div className={styles.totpManualKeyVal}>
                  {totpSetupData.secret}
                </div>
              </div>

              {/* Backup codes */}
              <div>
                <div className={styles.totpBackupTitle}>
                  Backup Codes — save these somewhere safe
                </div>
                <div className={styles.totpBackupGrid}>
                  {totpSetupData.backupCodes.map((c) => (
                    <span key={c} className={styles.totpBackupCode}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* 6-digit code input */}
              <div>
                <label
                  htmlFor="totp-code-input"
                  className={styles.totpInputLabel}
                >
                  Enter the 6-digit code from your authenticator app:
                </label>
                <input
                  id="totp-code-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  className={styles.msgInput}
                  placeholder="123456"
                  value={totpCode}
                  onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, "")); setTotpCodeError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleVerify2fa(); }}
                />
                {totpCodeError && (
                  <div className={styles.totpErrorText}>
                    {totpCodeError}
                  </div>
                )}
              </div>

              <div className={styles.totpBtnRow}>
                <button
                  type="button"
                  className={cx("btnSm", "btnAccent")}
                  onClick={() => void handleVerify2fa()}
                  disabled={totpVerifying || totpCode.length < 6}
                >
                  {totpVerifying ? "Verifying…" : "Activate 2FA"}
                </button>
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost")}
                  onClick={() => { setTotpModalOpen(false); setTotpSetupData(null); setTotpCode(""); setTotpCodeError(""); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Disable 2FA Modal ── */}
        {disableModalOpen && (
          <div className={styles.totpModalOverlay}>
            <div className={styles.totpModalBoxSm}>
              <div>
                <div className={styles.totpModalTitle}>
                  Disable Two-Factor Authentication
                </div>
                <div className={styles.pageSub}>
                  Enter your account password to confirm removing 2FA from your account.
                </div>
              </div>
              <div>
                <label
                  htmlFor="disable-2fa-password"
                  className={styles.totpInputLabel}
                >
                  Current password:
                </label>
                <input
                  id="disable-2fa-password"
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  className={styles.msgInput}
                  placeholder="Enter your password"
                  value={disablePassword}
                  onChange={(e) => { setDisablePassword(e.target.value); setDisableError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleDisable2fa(); }}
                />
                {disableError && (
                  <div className={styles.totpErrorText}>
                    {disableError}
                  </div>
                )}
              </div>
              <div className={styles.totpBtnRow}>
                <button
                  type="button"
                  className={cx("btnSm", styles.btnDanger2fa)}
                  onClick={() => void handleDisable2fa()}
                  disabled={disabling}
                >
                  {disabling ? "Disabling…" : "Disable 2FA"}
                </button>
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost")}
                  onClick={() => { setDisableModalOpen(false); setDisablePassword(""); setDisableError(""); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        </>
      ) : null}

      {activeTab === "notifications" ? (
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>
              Notifications & Providers
            </span>
            <span className={styles.metaMono}>
              {lastSavedNotifications
                ? `Last saved ${formatDateTime(lastSavedNotifications)}`
                : "Not saved yet"}
            </span>
          </div>
          <div className={styles.cardInner}>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleTitle}>Project updates</div>
                <div className={styles.toggleSub}>
                  Status changes and milestones
                </div>
              </div>
              <button
                title="project updates"
                type="button"
                className={`${styles.switchBase} ${projectAlerts ? styles.switchOn : ""}`}
                onClick={() => setProjectAlerts((v) => !v)}
              >
                <div
                  className={
                    projectAlerts ? styles.switchThumbOn : styles.switchThumbOff
                  }
                />
              </button>
            </div>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleTitle}>Invoice alerts</div>
                <div className={styles.toggleSub}>
                  Due date and overdue notices
                </div>
              </div>
              <button
                title="invoice alerts"
                type="button"
                className={`${styles.switchBase} ${invoiceAlerts ? styles.switchOn : ""}`}
                onClick={() => setInvoiceAlerts((v) => !v)}
              >
                <div
                  className={
                    invoiceAlerts ? styles.switchThumbOn : styles.switchThumbOff
                  }
                />
              </button>
            </div>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleTitle}>Message digest</div>
                <div className={styles.toggleSub}>
                  Email summary of new threads
                </div>
              </div>
              <button
                title="message digest"
                type="button"
                className={`${styles.switchBase} ${messageDigest ? styles.switchOn : ""}`}
                onClick={() => setMessageDigest((v) => !v)}
              >
                <div
                  className={
                    messageDigest ? styles.switchThumbOn : styles.switchThumbOff
                  }
                />
              </button>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="admin-settings-email-sender">Email Sender</label>
              <input
                id="admin-settings-email-sender"
                className={styles.msgInput}
                value={emailSender}
                onChange={(e) => setEmailSender(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="admin-settings-sms-sender">SMS Sender</label>
              <input
                id="admin-settings-sms-sender"
                className={styles.msgInput}
                value={smsSender}
                onChange={(e) => setSmsSender(e.target.value)}
              />
            </div>
            <button
              type="button"
              className={cx("btnSm", "btnAccent")}
              onClick={() => void saveNotificationSettings()}
            >
              Save Notification Settings
            </button>
          </div>
        </article>
      ) : null}

      {activeTab === "integrations" ? (
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>API Keys & Integrations</span>
            <span className={styles.metaMono}>
              {lastSavedApiAccess
                ? `Last saved ${formatDateTime(lastSavedApiAccess)}`
                : "Not saved yet"}
            </span>
          </div>
          <div className={styles.cardInner}>
            <div className={styles.projMeta}>
              Scope limited to integration policy and API key posture. Provider
              setup stays in Integrations.
            </div>
            <table className={styles.projTable}>
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total keys</td>
                  <td>{publicApiKeys.length}</td>
                </tr>
                <tr>
                  <td>Clients with keys</td>
                  <td>{new Set(publicApiKeys.map((k) => k.clientId)).size}</td>
                </tr>
                <tr>
                  <td>Latest key issued</td>
                  <td>
                    {publicApiKeys[0]?.createdAt
                      ? formatDate(publicApiKeys[0].createdAt)
                      : "Not issued yet"}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className={styles.toolbarRow}>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => onNavigate("integrations")}
              >
                Manage Keys
              </button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => void saveApiAccessSettings()}
              >
                Save API Policy
              </button>
            </div>
          </div>
        </article>
      ) : null}

      {activeTab === "system" ? (
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>System Health</span>
          </div>
          <table className={styles.projTable}>
            <thead>
              <tr>
                <th scope="col">Subsystem</th>
                <th scope="col">Status</th>
                <th scope="col">Signal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gateway API</td>
                <td>
                  <span className={cx("badge", "badgeGreen")}>Online</span>
                </td>
                <td>{snapshot.projects.length} projects loaded</td>
              </tr>
              <tr>
                <td>Automation Queue</td>
                <td>
                  <span
                    className={cx(
                      "badge",
                      failedJobs > 0
                        ? "badgeRed"
                        : queuedJobs > 0
                          ? "badgeAmber"
                          : "badgeGreen",
                    )}
                  >
                    {failedJobs > 0
                      ? "Degraded"
                      : queuedJobs > 0
                        ? "Busy"
                        : "Healthy"}
                  </span>
                </td>
                <td>
                  {queuedJobs} queued / {failedJobs} failed
                </td>
              </tr>
              <tr>
                <td>Notifications</td>
                <td>
                  <span className={cx("badge", "badgeGreen")}>Online</span>
                </td>
                <td>{jobs.length} jobs observed</td>
              </tr>
              <tr>
                <td>Analytics</td>
                <td>
                  <span className={cx("badge", "badgeGreen")}>Online</span>
                </td>
                <td>{analyticsPoints} metrics rows</td>
              </tr>
            </tbody>
          </table>
        </article>
      ) : null}

      <article className={cx("card", "mt16")}>
        <div className={cx("cardHd")}>
          <div>
            <span className={styles.cardHdTitle}>Settings Change Monitor</span>
            <div className={cx("text11", "colorMuted", "mt4")}>
              Focused on settings writes and configuration risk signals. Use
              Audit Log for full event history.
            </div>
          </div>
          <div className={cx("flexRow", "gap8")}>
            <select title="Filter log scope" value={logScope} onChange={e => setLogScope(e.target.value as typeof logScope)} className={styles.filterSelect}>
              <option value="all">all</option>
              <option value="security">security</option>
              <option value="operations">operations</option>
            </select>
          </div>
        </div>
        <div className={styles.cardInner}>
          <input
            value={logQuery}
            onChange={(e) => setLogQuery(e.target.value)}
            placeholder="Filter actions, actor, or summary"
            className={cx("formInput", "wFull", "mb12")}
          />
          <div className={cx("flexCol", "gap8")}>
            {filteredSettingsLog.map((entry) => (
              <div key={entry.id} className={styles.settingsLogRow}>
                <span className={cx("text11", "colorMuted", "fontMono")}>
                  {formatDateTime(entry.occurredAt)}
                </span>
                <span
                  className={cx(
                    "text10",
                    "uppercase",
                    "tracking",
                    entry.domain === "security" ? "colorAmber" : "colorAccent",
                  )}
                >
                  {entry.action}
                </span>
                <div>
                  <div className={cx("text12")}>{entry.summary}</div>
                  <div className={cx("text10", "colorMuted")}>
                    Actor: {entry.actor}
                  </div>
                </div>
                <span
                  className={cx(
                    "badge",
                    entry.severity === "high"
                      ? "badgeRed"
                      : entry.severity === "medium"
                        ? "badgeAmber"
                        : "badgeGreen",
                  )}
                >
                  {entry.severity}
                </span>
              </div>
            ))}
            {filteredSettingsLog.length === 0 ? (
              <div className={styles.emptySub}>No entries in this filter.</div>
            ) : null}
          </div>
        </div>
      </article>

      {activeTab === "appearance" ? (
        <article className={styles.card}>
          <div className={styles.cardHd}>
            <span className={styles.cardHdTitle}>Appearance</span>
          </div>
          <div className={styles.cardInner}>
            <p className={cx("text13", "colorMuted")}>Choose your preferred colour scheme.</p>
            <ThemeToggle />
          </div>
        </article>
      ) : null}
    </div>
  );
}
