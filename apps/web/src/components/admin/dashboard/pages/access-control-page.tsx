"use client";

import { Fragment, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

type PermissionModuleId =
  | "clients"
  | "staff"
  | "billing"
  | "invoices"
  | "reports"
  | "scheduling"
  | "automation"
  | "security"
  | "api"
  | "compliance"
  | "pricing"
  | "all";

type Admin = {
  id: number;
  name: string;
  avatar: string;
  color: string;
  role: "Super Admin" | "Operations Admin" | "Account Admin";
  email: string;
  since: string;
  lastActive: string;
  mfaEnabled: boolean;
  apiAccess: boolean;
  permissions: PermissionModuleId[];
  sessionCount: number;
  status: "active" | "inactive";
};

const admins: Admin[] = [
  {
    id: 1,
    name: "Sipho Nkosi",
    avatar: "SN",
    color: "var(--accent)",
    role: "Super Admin",
    email: "sipho@maphari.co.za",
    since: "2023-01-01",
    lastActive: "2026-02-23 09:14",
    mfaEnabled: true,
    apiAccess: true,
    permissions: ["all"],
    sessionCount: 3,
    status: "active",
  },
  {
    id: 2,
    name: "Leilani Fotu",
    avatar: "LF",
    color: "var(--blue)",
    role: "Operations Admin",
    email: "leilani@maphari.co.za",
    since: "2024-06-01",
    lastActive: "2026-02-23 08:55",
    mfaEnabled: true,
    apiAccess: false,
    permissions: ["staff", "clients", "reports", "scheduling"],
    sessionCount: 1,
    status: "active",
  },
  {
    id: 3,
    name: "Nomsa Dlamini",
    avatar: "ND",
    color: "var(--purple)",
    role: "Account Admin",
    email: "nomsa@maphari.co.za",
    since: "2024-11-01",
    lastActive: "2026-02-22 16:30",
    mfaEnabled: false,
    apiAccess: false,
    permissions: ["clients", "invoices", "reports"],
    sessionCount: 0,
    status: "inactive",
  },
];

const permissionModules: Array<{ id: PermissionModuleId; label: string; icon: string }> = [
  { id: "clients", label: "Clients & Projects", icon: "◉" },
  { id: "staff", label: "Staff Management", icon: "◎" },
  { id: "billing", label: "Billing & Finance", icon: "◈" },
  { id: "invoices", label: "Invoices", icon: "⊟" },
  { id: "reports", label: "Reports & Analytics", icon: "⊡" },
  { id: "scheduling", label: "Scheduling", icon: "◌" },
  { id: "automation", label: "Automation", icon: "↻" },
  { id: "security", label: "Security Settings", icon: "⊞" },
  { id: "api", label: "API & Integrations", icon: "◈" },
  { id: "compliance", label: "Compliance & Legal", icon: "⊠" },
  { id: "pricing", label: "Pricing & Quotes", icon: "◉" },
  { id: "all", label: "Full Admin Access", icon: "★" },
];

type AuditType = "permission" | "create" | "revoke" | "export" | "security" | "access";

const auditLog: Array<{ id: string; admin: string; action: string; time: string; type: AuditType }> = [
  { id: "ACT-091", admin: "Sipho Nkosi", action: "Granted invoices permission to Nomsa Dlamini", time: "2026-02-22 11:30", type: "permission" },
  { id: "ACT-090", admin: "Sipho Nkosi", action: "Created admin account for Nomsa Dlamini", time: "2026-11-01 09:00", type: "create" },
  { id: "ACT-089", admin: "Sipho Nkosi", action: "Revoked API access for Leilani Fotu", time: "2026-01-15 14:22", type: "revoke" },
  { id: "ACT-088", admin: "Leilani Fotu", action: "Exported staff performance report", time: "2026-02-18 10:05", type: "export" },
  { id: "ACT-087", admin: "Sipho Nkosi", action: "Rotated master API key", time: "2026-02-01 08:00", type: "security" },
  { id: "ACT-086", admin: "Nomsa Dlamini", action: "Accessed client billing for Kestrel Capital", time: "2026-01-30 15:44", type: "access" },
];

const delegations = [
  { from: "Sipho Nkosi", to: "Leilani Fotu", scope: "Operations oversight", expires: "2026-03-01", status: "active" },
] as const;

const actionColors: Record<AuditType, string> = {
  permission: "var(--blue)",
  create: "var(--accent)",
  revoke: "var(--red)",
  export: "var(--muted)",
  security: "var(--amber)",
  access: "var(--purple)",
};

const tabs = ["admins", "permissions", "audit log", "delegations", "api keys"] as const;
type Tab = (typeof tabs)[number];

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div className={cx(styles.accessAvatar, toneClass(color), size === 24 ? "accessAvatar24" : "accessAvatar36")}>
      {initials}
    </div>
  );
}

export function AccessControlPage() {
  const [activeTab, setActiveTab] = useState<Tab>("admins");
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const permGridColsClass = admins.length >= 5 ? styles.accessPermGrid5 : admins.length === 4 ? styles.accessPermGrid4 : styles.accessPermGrid3;

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / ACCESS & DELEGATION</div>
          <h1 className={styles.pageTitle}>Access Control</h1>
          <div className={styles.pageSub}>Admin accounts · Permissions · Delegations · API keys</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost", styles.accessDangerBtn)}>Emergency Lockdown</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ New Admin</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Active Admins", value: admins.filter((a) => a.status === "active").length.toString(), color: "var(--accent)", sub: `${admins.length} total accounts` },
          { label: "MFA Coverage", value: `${Math.round((admins.filter((a) => a.mfaEnabled).length / admins.length) * 100)}%`, color: admins.some((a) => !a.mfaEnabled) ? "var(--amber)" : "var(--accent)", sub: admins.filter((a) => !a.mfaEnabled).length > 0 ? "1 admin without MFA" : "All admins secured" },
          { label: "Active Sessions", value: admins.reduce((s, a) => s + a.sessionCount, 0).toString(), color: "var(--blue)", sub: "Across all admins" },
          { label: "API Keys", value: "3", color: "var(--purple)", sub: "2 active · 1 rotated" },
        ].map((stat) => (
          <div key={stat.label} className={cx(styles.statCard, toneClass(stat.color))}>
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={cx(styles.statValue, styles.accessToneText)}>{stat.value}</div>
            <div className={cx("text11", "colorMuted")}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {admins.some((a) => !a.mfaEnabled) ? (
        <div className={styles.accessWarnBar}>
          <div className={styles.accessWarnText}>⚠ {admins.filter((a) => !a.mfaEnabled).map((a) => a.name).join(", ")} — MFA not enabled.</div>
          <button type="button" className={cx("btnSm", styles.accessAmberBtn)}>Enforce MFA</button>
        </div>
      ) : null}

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "admins" ? (
        <div className={cx("flexCol", "gap12")}>
          {admins.map((admin) => (
            <div
              key={admin.id}
              onClick={() => setSelectedAdmin(selectedAdmin?.id === admin.id ? null : admin)}
              className={cx(styles.accessAdminCard, selectedAdmin?.id === admin.id ? toneClass(admin.color) : "toneBorder")}
            >
              <div className={styles.accessAdminGrid}>
                <div className={styles.accessIdentityCell}>
                  <Avatar initials={admin.avatar} color={admin.color} />
                  <div>
                    <div className={cx("fw700")}>{admin.name}</div>
                    <div className={cx("text11", "colorMuted")}>{admin.email}</div>
                  </div>
                </div>
                <div>
                  <div className={cx("text11", "colorMuted", "mb3")}>Role</div>
                  <div className={cx("text13", "fw600", admin.role === "Super Admin" && "colorAccent")}>{admin.role}</div>
                </div>
                <div>
                  <div className={cx("text11", "colorMuted", "mb3")}>Last Active</div>
                  <div className={cx("text11", "fontMono", "colorMuted")}>{admin.lastActive.split(" ")[1]}</div>
                  <div className={cx("text10", "colorMuted")}>{admin.lastActive.split(" ")[0]}</div>
                </div>
                <div className={cx("flexCol", "gap4")}>
                  <div className={styles.accessFlagRow}><span className={admin.mfaEnabled ? styles.accessToneAccent : styles.accessToneRed}>{admin.mfaEnabled ? "✓" : "✗"}</span><span className="colorMuted">MFA</span></div>
                  <div className={styles.accessFlagRow}><span className={admin.apiAccess ? styles.accessToneAccent : styles.accessToneMuted}>{admin.apiAccess ? "✓" : "✗"}</span><span className="colorMuted">API</span></div>
                </div>
                <div>
                  <div className={cx("text11", "colorMuted", "mb3")}>Sessions</div>
                  <div className={cx("fontMono", admin.sessionCount > 0 ? "colorBlue" : "colorMuted")}>{admin.sessionCount}</div>
                </div>
                <span className={cx(styles.accessStatusChip, admin.status === "active" ? styles.accessChipActive : styles.accessChipMuted)}>{admin.status}</span>
                <div className={cx("flexRow", "gap6")}>
                  <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
                  {admin.role !== "Super Admin" ? <button type="button" className={cx("btnSm", styles.accessDangerBtn)}>Revoke</button> : null}
                </div>
              </div>

              {selectedAdmin?.id === admin.id ? (
                <div className={styles.accessExpanded}>
                  <div className={styles.accessExpandedLabel}>Permissions</div>
                  <div className={cx("flexRow", "gap8", "flexWrap")}>
                    {admin.permissions.includes("all") ? (
                      <span className={cx("badge", "badgeAccent")}>★ Full Access</span>
                    ) : (
                      permissionModules
                        .filter((module) => admin.permissions.includes(module.id))
                        .map((module) => (
                          <span key={module.id} className={cx("badge", "badgeBlue")}>{module.icon} {module.label}</span>
                        ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "permissions" ? (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.accessSectionTitle}>Permission Matrix</div>
            <div className={cx(styles.accessPermGrid, permGridColsClass)}>
              <div />
              {admins.map((admin) => (
                <div key={admin.id} className={styles.accessPermHeadCell}>
                  <Avatar initials={admin.avatar} color={admin.color} size={24} />
                  <div className={styles.accessPermHeadName}>{admin.name.split(" ")[0]}</div>
                </div>
              ))}
              {permissionModules.map((module) => (
                <Fragment key={module.id}>
                  <div className={styles.accessPermLabelCell}>{module.icon} {module.label}</div>
                  {admins.map((admin) => {
                    const hasPermission = admin.permissions.includes("all") || admin.permissions.includes(module.id);
                    return (
                      <div key={`${admin.id}-${module.id}`} className={styles.accessPermValCell}>
                        <span className={hasPermission ? styles.accessToneAccent : styles.accessToneBorder}>{hasPermission ? "✓" : "·"}</span>
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          <div className={cx("card", "p24")}>
            <div className={styles.accessSectionTitle}>Edit Permissions — Nomsa Dlamini</div>
            <div className={cx("flexCol", "gap10")}>
              {permissionModules
                .filter((module) => module.id !== "all")
                .map((module) => {
                  const nomsa = admins.find((admin) => admin.name.includes("Nomsa"));
                  const hasPermission = Boolean(nomsa?.permissions.includes(module.id));
                  return (
                    <div key={module.id} className={styles.accessToggleRow}>
                      <span className={cx("text13")}>{module.icon} {module.label}</span>
                      <span className={cx(styles.accessToggle, hasPermission && styles.accessToggleOn)}>
                        <span className={cx(styles.accessToggleKnob, hasPermission && styles.accessToggleKnobOn)} />
                      </span>
                    </div>
                  );
                })}
            </div>
            <button type="button" className={cx("btnSm", "btnAccent", styles.accessSaveBtn)}>Save Permissions</button>
          </div>
        </div>
      ) : null}

      {activeTab === "audit log" ? (
        <div className={cx("card", "overflowHidden", "p0")}>
          <div className={styles.accessAuditHead}>
            {[
              "ID",
              "Admin",
              "Action",
              "Type",
              "Timestamp",
            ].map((heading) => <span key={heading}>{heading}</span>)}
          </div>
          {auditLog.map((log, index) => (
            <div key={log.id} className={cx(styles.accessAuditRow, index === auditLog.length - 1 && styles.accessAuditRowLast)}>
              <span className={cx("fontMono", "text11", "colorMuted")}>{log.id}</span>
              <span className={cx("text13", "fw600")}>{log.admin.split(" ")[0]}</span>
              <span className={cx("text12", "colorMuted")}>{log.action}</span>
              <span className={cx(styles.accessAuditType, toneClass(actionColors[log.type]))}>{log.type}</span>
              <span className={cx("text11", "fontMono", "colorMuted")}>{log.time}</span>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "delegations" ? (
        <div className={cx("flexCol", "gap16")}>
          <div className={styles.accessInfoCard}>Admin delegation allows a Super Admin to temporarily grant elevated permissions to another admin for a defined scope and time period.</div>
          {delegations.map((delegation, index) => (
            <div key={index} className={styles.accessDelegationCard}>
              <div className={styles.accessDelegationGrid}>
                <div>
                  <div className={cx("text11", "colorMuted", "mb4")}>Delegated By</div>
                  <div className={cx("fw700")}>{delegation.from}</div>
                </div>
                <div>
                  <div className={cx("text11", "colorMuted", "mb4")}>Delegated To</div>
                  <div className={cx("fw700", "colorBlue")}>{delegation.to}</div>
                </div>
                <div>
                  <div className={cx("text11", "colorMuted", "mb4")}>Scope</div>
                  <div className={cx("text13")}>{delegation.scope}</div>
                </div>
                <div>
                  <div className={cx("text11", "colorMuted", "mb4")}>Expires</div>
                  <div className={cx("fontMono", "text12")}>{delegation.expires}</div>
                </div>
                <button type="button" className={cx("btnSm", styles.accessDangerBtn)}>Revoke</button>
              </div>
            </div>
          ))}
          <button type="button" className={styles.accessCreateCard}>+ Create New Delegation</button>
        </div>
      ) : null}

      {activeTab === "api keys" ? (
        <div className={cx("flexCol", "gap16")}>
          <div className={styles.accessInfoCard}>API keys grant programmatic access to Maphari data. Rotate keys regularly and never share them publicly.</div>
          {[
            { name: "Master API Key", key: "mk_live_••••••••••••••••", scope: "Full access", created: "2026-02-01", lastUsed: "2026-02-23", status: "active" },
            { name: "Reporting Webhook", key: "wh_live_••••••••••••••••", scope: "Read-only analytics", created: "2025-11-15", lastUsed: "2026-02-22", status: "active" },
            { name: "Old Integration Key", key: "ik_live_••••••••••••••••", scope: "Billing read", created: "2025-01-01", lastUsed: "2025-09-01", status: "rotated" },
          ].map((keyItem, index) => (
            <div key={index} className={cx(styles.accessKeyCard, keyItem.status === "rotated" && styles.accessKeyCardRotated)}>
              <div className={styles.accessKeyGrid}>
                <div>
                  <div className={cx("fw700", "mb4")}>{keyItem.name}</div>
                  <div className={cx("fontMono", "text12", "colorMuted")}>{keyItem.key}</div>
                </div>
                <div>
                  <div className={cx("text11", "colorMuted", "mb4")}>Scope</div>
                  <div className={cx("text12")}>{keyItem.scope}</div>
                </div>
                <div>
                  <div className={cx("text11", "colorMuted", "mb4")}>Created</div>
                  <div className={cx("fontMono", "text12")}>{keyItem.created}</div>
                </div>
                <div>
                  <div className={cx("text11", "colorMuted", "mb4")}>Last Used</div>
                  <div className={cx("fontMono", "text12")}>{keyItem.lastUsed}</div>
                </div>
                <span className={cx(styles.accessStatusChip, keyItem.status === "active" ? styles.accessChipActive : styles.accessChipMuted)}>{keyItem.status}</span>
                {keyItem.status === "active" ? (
                  <div className={cx("flexRow", "gap6")}>
                    <button type="button" className={cx("btnSm", "btnGhost")}>Copy</button>
                    <button type="button" className={cx("btnSm", styles.accessAmberBtn)}>Rotate</button>
                  </div>
                ) : (
                  <button type="button" className={cx("btnSm", "btnGhost")}>Delete</button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className={styles.accessCreateAccentCard}>+ Generate New API Key</button>
        </div>
      ) : null}
    </div>
  );
}
