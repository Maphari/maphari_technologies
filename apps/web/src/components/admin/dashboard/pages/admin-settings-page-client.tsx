"use client";

import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { useAdminSettings } from "../hooks/use-admin-settings";
import { styles } from "../style";
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
  onCurrencySaved
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
    saveApiAccessSettings
  } = useAdminSettings({ session, publicApiKeys, pushToast: onNotify, setAdminDisplayCurrency: onCurrencySaved, currencyValue });

  const queuedJobs = jobs.filter((j) => j.status === "QUEUED").length;
  const failedJobs = jobs.filter((j) => j.status === "FAILED").length;
  const activeClients = snapshot.clients.filter((c) => c.status === "ACTIVE").length;
  const adminSeats = 1;
  const staffSeats = 0;
  const needsAttention = (mfaRequired ? 0 : 1) + (failedJobs > 0 ? 1 : 0);

  return (
    <div className={styles.pageBody} style={{ color: "var(--text)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "DM Mono, monospace", marginBottom: 6 }}>Admin / Governance</div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, fontFamily: "Syne, sans-serif" }}>Settings</h1>
          <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>Configuration controls only. Detailed access changes remain in Staff Access and global events remain in Audit Log.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => onNavigate("staff")} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 12px", borderRadius: 8, fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Staff Access</button>
          <button type="button" onClick={() => onNavigate("audit")} style={{ background: "var(--accent)", border: "none", color: "#050508", padding: "8px 12px", borderRadius: 8, fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Open Audit Log</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Active Clients", value: activeClients.toString(), color: "var(--accent)", sub: "Current workspace footprint" },
          { label: "Queued Jobs", value: queuedJobs.toString(), color: "var(--amber)", sub: "Pending delivery pipeline" },
          { label: "Failed Jobs", value: failedJobs.toString(), color: failedJobs > 0 ? "var(--red)" : "var(--accent)", sub: "Retry and triage required" },
          { label: "Needs Attention", value: needsAttention.toString(), color: needsAttention > 0 ? "var(--amber)" : "var(--accent)", sub: "Policy and reliability flags" }
        ].map((item) => (
          <div key={item.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: item.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{item.value}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {settingsTabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{ background: "none", border: "none", color: activeTab === tab ? "var(--accent)" : "var(--muted)", padding: "9px 14px", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.07em", fontWeight: 700, cursor: "pointer", borderBottom: `2px solid ${activeTab === tab ? "var(--accent)" : "transparent"}` }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "profile" ? (
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Organization Profile</span><span className={styles.metaMono}>{lastSavedProfile ? `Last saved ${formatDateTime(lastSavedProfile)}` : "Not saved yet"}</span></div>
          <div className={styles.cardInner}>
            <div className={styles.formGroup}><label>Display Name</label><input className={styles.msgInput} value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
            <div className={styles.formGroup}><label>Email</label><input className={styles.msgInput} value={session?.user.email ?? "admin@maphari"} readOnly /></div>
            <div className={styles.formGroup}><label>Company</label><input className={styles.msgInput} value={company} onChange={(e) => setCompany(e.target.value)} /></div>
            <div className={styles.formGroup}><label>Timezone</label><input className={styles.msgInput} value={timezone} onChange={(e) => setTimezone(e.target.value)} /></div>
            <div className={styles.formGroup}>
              <label>Currency</label>
              <select className={styles.selectInput} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="AUTO">Auto</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ZAR">ZAR</option>
                <option value="NGN">NGN</option>
                <option value="KES">KES</option>
              </select>
            </div>
            <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void saveProfileSettings()}>Save Profile</button>
          </div>
        </article>
      ) : null}

      {activeTab === "workspace" ? (
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Workspace Preferences</span><span className={styles.metaMono}>{lastSavedWorkspace ? `Last saved ${formatDateTime(lastSavedWorkspace)}` : "Not saved yet"}</span></div>
          <div className={styles.cardInner}>
            <div className={styles.formGroup}>
              <label>Dashboard Density</label>
              <select className={styles.selectInput} value={density} onChange={(e) => setDensity(e.target.value as typeof density)}>
                <option value="Comfortable">Comfortable</option>
                <option value="Compact">Compact</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Default Landing Tab</label>
              <select className={styles.selectInput} value={landingPage} onChange={(e) => setLandingPage(e.target.value as PageId)}>
                <option value="dashboard">Dashboard</option>
                <option value="leads">Leads</option>
                <option value="clients">Clients</option>
                <option value="projects">Projects</option>
                <option value="invoices">Billing</option>
              </select>
            </div>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleTitle}>Project Request Assignment</div>
                <div className={styles.toggleSub}>{projectRequestAssignmentMode === "AUTO" ? "Automatic assignment by availability + skill profile" : "Manual assignment by admin selection"}</div>
              </div>
              <button type="button" className={`${styles.switchBase} ${projectRequestAssignmentMode === "AUTO" ? styles.switchOn : ""}`} onClick={() => setProjectRequestAssignmentMode((curr) => (curr === "AUTO" ? "MANUAL" : "AUTO"))} aria-pressed={projectRequestAssignmentMode === "AUTO"} aria-label="Toggle automatic project request assignment">
                <span className={projectRequestAssignmentMode === "AUTO" ? styles.switchThumbOn : styles.switchThumbOff} />
              </button>
            </div>
            {workspaceStaffUsers.length > 0 ? (
              <div className={styles.formGroup}>
                <label>Staff Skill Profiles</label>
                <div className={`${styles.emptySub} ${styles.marginBottom8}`}>Used by auto-assignment to match service type.</div>
                {workspaceStaffUsers.map((staff) => (
                  <div key={staff.id} className={`${styles.formGroup} ${styles.formGroupCompact}`}>
                    <div className={styles.metaMono}>{staff.email}</div>
                    <div className={styles.toolbarRow}>
                      {["WEBSITE", "MOBILE_APP", "AUTOMATION", "UI_UX_DESIGN", "OTHER"].map((skill) => {
                        const selected = (staffSkillProfiles[staff.id] ?? []).includes(skill);
                        return (
                          <label key={`${staff.id}-${skill}`} className={styles.checkboxRow}>
                            <input type="checkbox" checked={selected} onChange={(e) => {
                              setStaffSkillProfiles((prev) => {
                                const current = prev[staff.id] ?? [];
                                const next = e.target.checked ? [...new Set([...current, skill])] : current.filter((s) => s !== skill);
                                return { ...prev, [staff.id]: next };
                              });
                            }} />
                            {skill}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void saveWorkspaceSettings()}>Save Preferences</button>
          </div>
        </article>
      ) : null}

      {activeTab === "security" ? (
        <div className={styles.twoCol}>
          <article className={styles.card}>
            <div className={styles.cardHd}><span className={styles.cardHdTitle}>Security Basics</span><span className={styles.metaMono}>{lastSavedSecurity ? `Last saved ${formatDateTime(lastSavedSecurity)}` : "Not saved yet"}</span></div>
            <div className={styles.cardInner}>
              <div className={styles.formGroup}><label>Session Timeout (minutes)</label><input className={styles.msgInput} type="number" min="15" max="240" value={sessionMinutes} onChange={(e) => setSessionMinutes(Number(e.target.value))} /></div>
              <div className={styles.formGroup}>
                <label>Password Policy</label>
                <select className={styles.selectInput} value={passwordPolicy} onChange={(e) => setPasswordPolicy(e.target.value)}>
                  <option value="Strong">Strong</option>
                  <option value="Very Strong">Very Strong</option>
                </select>
              </div>
              <div className={styles.toggleRow}>
                <div><div className={styles.toggleTitle}>Require MFA for admin</div><div className={styles.toggleSub}>Enforce second factor for privileged users</div></div>
                <button type="button" className={`${styles.switchBase} ${mfaRequired ? styles.switchOn : ""}`} onClick={() => setMfaRequired((v) => !v)}><div className={mfaRequired ? styles.switchThumbOn : styles.switchThumbOff} /></button>
              </div>
              <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void saveSecuritySettings()}>Save Security</button>
            </div>
          </article>
          <article className={styles.card}>
            <div className={styles.cardHd}><span className={styles.cardHdTitle}>Roles & Access Summary</span></div>
            <div className={styles.cardInner}>
              <table className={styles.projTable}>
                <thead><tr><th>Role</th><th>Seats</th><th>Permissions</th></tr></thead>
                <tbody>
                  <tr><td>Admin</td><td>{adminSeats}</td><td>Full access</td></tr>
                  <tr><td>Staff</td><td>{staffSeats}</td><td>Operations + delivery</td></tr>
                  <tr><td>Client</td><td>{snapshot.clients.length}</td><td>Client portal only</td></tr>
                </tbody>
              </table>
              <div className={styles.projMeta} style={{ marginTop: 10 }}>Detailed role grants, API key permissions, and admin action history live in Staff Access.</div>
              <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => onNavigate("staff")}>Open Staff Access</button>
            </div>
          </article>
        </div>
      ) : null}

      {activeTab === "notifications" ? (
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>Notifications & Providers</span><span className={styles.metaMono}>{lastSavedNotifications ? `Last saved ${formatDateTime(lastSavedNotifications)}` : "Not saved yet"}</span></div>
          <div className={styles.cardInner}>
            <div className={styles.toggleRow}><div><div className={styles.toggleTitle}>Project updates</div><div className={styles.toggleSub}>Status changes and milestones</div></div><button type="button" className={`${styles.switchBase} ${projectAlerts ? styles.switchOn : ""}`} onClick={() => setProjectAlerts((v) => !v)}><div className={projectAlerts ? styles.switchThumbOn : styles.switchThumbOff} /></button></div>
            <div className={styles.toggleRow}><div><div className={styles.toggleTitle}>Invoice alerts</div><div className={styles.toggleSub}>Due date and overdue notices</div></div><button type="button" className={`${styles.switchBase} ${invoiceAlerts ? styles.switchOn : ""}`} onClick={() => setInvoiceAlerts((v) => !v)}><div className={invoiceAlerts ? styles.switchThumbOn : styles.switchThumbOff} /></button></div>
            <div className={styles.toggleRow}><div><div className={styles.toggleTitle}>Message digest</div><div className={styles.toggleSub}>Email summary of new threads</div></div><button type="button" className={`${styles.switchBase} ${messageDigest ? styles.switchOn : ""}`} onClick={() => setMessageDigest((v) => !v)}><div className={messageDigest ? styles.switchThumbOn : styles.switchThumbOff} /></button></div>
            <div className={styles.formGroup}><label>Email Sender</label><input className={styles.msgInput} value={emailSender} onChange={(e) => setEmailSender(e.target.value)} /></div>
            <div className={styles.formGroup}><label>SMS Sender</label><input className={styles.msgInput} value={smsSender} onChange={(e) => setSmsSender(e.target.value)} /></div>
            <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void saveNotificationSettings()}>Save Notification Settings</button>
          </div>
        </article>
      ) : null}

      {activeTab === "integrations" ? (
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>API Keys & Integrations</span><span className={styles.metaMono}>{lastSavedApiAccess ? `Last saved ${formatDateTime(lastSavedApiAccess)}` : "Not saved yet"}</span></div>
          <div className={styles.cardInner}>
            <div className={styles.projMeta}>Scope limited to integration policy and API key posture. Provider setup stays in Integrations.</div>
            <table className={styles.projTable}>
              <thead><tr><th>Metric</th><th>Value</th></tr></thead>
              <tbody>
                <tr><td>Total keys</td><td>{publicApiKeys.length}</td></tr>
                <tr><td>Clients with keys</td><td>{new Set(publicApiKeys.map((k) => k.clientId)).size}</td></tr>
                <tr><td>Latest key issued</td><td>{publicApiKeys[0]?.createdAt ? formatDate(publicApiKeys[0].createdAt) : "Not issued yet"}</td></tr>
              </tbody>
            </table>
            <div className={styles.toolbarRow}>
              <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={() => onNavigate("integrations")}>Manage Keys</button>
              <button type="button" className={`${styles.btnSm} ${styles.btnAccent}`} onClick={() => void saveApiAccessSettings()}>Save API Policy</button>
            </div>
          </div>
        </article>
      ) : null}

      {activeTab === "system" ? (
        <article className={styles.card}>
          <div className={styles.cardHd}><span className={styles.cardHdTitle}>System Health</span></div>
          <table className={styles.projTable}>
            <thead><tr><th>Subsystem</th><th>Status</th><th>Signal</th></tr></thead>
            <tbody>
              <tr><td>Gateway API</td><td><span className={`${styles.badge} ${styles.badgeGreen}`}>Online</span></td><td>{snapshot.projects.length} projects loaded</td></tr>
              <tr><td>Automation Queue</td><td><span className={`${styles.badge} ${failedJobs > 0 ? styles.badgeRed : queuedJobs > 0 ? styles.badgeAmber : styles.badgeGreen}`}>{failedJobs > 0 ? "Degraded" : queuedJobs > 0 ? "Busy" : "Healthy"}</span></td><td>{queuedJobs} queued / {failedJobs} failed</td></tr>
              <tr><td>Notifications</td><td><span className={`${styles.badge} ${styles.badgeGreen}`}>Online</span></td><td>{jobs.length} jobs observed</td></tr>
              <tr><td>Analytics</td><td><span className={`${styles.badge} ${styles.badgeGreen}`}>Online</span></td><td>{analyticsPoints} metrics rows</td></tr>
            </tbody>
          </table>
        </article>
      ) : null}

      <article style={{ marginTop: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Settings Change Monitor</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Focused on settings writes and configuration risk signals. Use Audit Log for full event history.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["all", "security", "operations"] as const).map((scope) => (
              <button key={scope} type="button" onClick={() => setLogScope(scope)} style={{ background: logScope === scope ? "var(--accent)" : "var(--bg)", border: `1px solid ${logScope === scope ? "var(--accent)" : "var(--border)"}`, color: logScope === scope ? "#050508" : "var(--muted)", borderRadius: 16, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 10px", cursor: "pointer", fontFamily: "DM Mono, monospace" }}>
                {scope}
              </button>
            ))}
          </div>
        </div>
        <input value={logQuery} onChange={(e) => setLogQuery(e.target.value)} placeholder="Filter actions, actor, or summary" style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", padding: "8px 10px", marginBottom: 12 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredSettingsLog.map((entry) => (
            <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "180px 120px 1fr 70px", gap: 10, alignItems: "center", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 10px" }}>
              <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "DM Mono, monospace" }}>{formatDateTime(entry.occurredAt)}</span>
              <span style={{ fontSize: 10, color: entry.domain === "security" ? "var(--amber)" : "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{entry.action}</span>
              <div>
                <div style={{ fontSize: 12 }}>{entry.summary}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>Actor: {entry.actor}</div>
              </div>
              <span style={{ fontSize: 10, textAlign: "center", textTransform: "uppercase", color: entry.severity === "high" ? "var(--red)" : entry.severity === "medium" ? "var(--amber)" : "var(--accent)", background: entry.severity === "high" ? "var(--red-dim)" : entry.severity === "medium" ? "var(--amber-dim)" : "var(--accent-dim)", padding: "3px 6px", borderRadius: 12, fontFamily: "DM Mono, monospace" }}>
                {entry.severity}
              </span>
            </div>
          ))}
          {filteredSettingsLog.length === 0 ? <div className={styles.emptySub}>No entries in this filter.</div> : null}
        </div>
      </article>
    </div>
  );
}
