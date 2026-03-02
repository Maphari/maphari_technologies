"use client";

import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { useAdminSettings } from "../hooks/use-admin-settings";
import { cx, styles } from "../style";
import type { DashboardToast } from "../../../shared/dashboard-core";
import type { PageId } from "../config";
import type { NotificationJob, PartnerApiKey } from "../../../../lib/api/admin";
import { formatDate, formatDateTime } from "./admin-page-utils";

export function AdminSettingsPageClient({
  jobs,
  publicApiKeys,
  analyticsPoints,
  onNavigate,
  onNotify,
  currencyValue,
  onCurrencySaved,
}: {
  jobs: NotificationJob[];
  publicApiKeys: PartnerApiKey[];
  analyticsPoints: number;
  onNavigate: (page: PageId) => void;
  onNotify: (tone: DashboardToast["tone"], message: string) => void;
  currencyValue: string;
  onCurrencySaved: (currency: string) => void;
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
          <div className={styles.pageEyebrow}>Admin / Governance</div>
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

      <div className={cx("topCardsStack")}>
        {[
          {
            label: "Active Clients",
            value: activeClients.toString(),
            color: "var(--accent)",
            sub: "Current workspace footprint",
          },
          {
            label: "Queued Jobs",
            value: queuedJobs.toString(),
            color: "var(--amber)",
            sub: "Pending delivery pipeline",
          },
          {
            label: "Failed Jobs",
            value: failedJobs.toString(),
            color: failedJobs > 0 ? "var(--red)" : "var(--accent)",
            sub: "Retry and triage required",
          },
          {
            label: "Needs Attention",
            value: needsAttention.toString(),
            color: needsAttention > 0 ? "var(--amber)" : "var(--accent)",
            sub: "Policy and reliability flags",
          },
        ].map((item) => (
          <div key={item.label} className={styles.statCard}>
            <div className={styles.statLabel}>{item.label}</div>
            <div className={cx("statValue", statToneClass(item.color))}>
              {item.value}
            </div>
            <div className={cx("text11", "colorMuted")}>{item.sub}</div>
          </div>
        ))}
      </div>

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
                value={session?.user.email ?? "admin@maphari"}
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
                <option value="AUTO">Auto</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ZAR">ZAR</option>
                <option value="NGN">NGN</option>
                <option value="KES">KES</option>
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
      ) : null}

      {activeTab === "security" ? (
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
                    <th>Role</th>
                    <th>Seats</th>
                    <th>Permissions</th>
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
                  <th>Metric</th>
                  <th>Value</th>
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
                <th>Subsystem</th>
                <th>Status</th>
                <th>Signal</th>
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
    </div>
  );
}
