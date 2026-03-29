// ════════════════════════════════════════════════════════════════════════════
// access-control-page.tsx — Admin Access Control page
// Data sources: loadStaffUsersWithRefresh (staff user accounts)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadStaffUsersWithRefresh, loadAuditEventsWithRefresh, lockdownSessionsWithRefresh } from "../../../../lib/api/admin";
import type { StaffAccessUser, AdminAuditEvent } from "../../../../lib/api/admin";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "users" | "audit log";
const tabs: Tab[] = ["users", "audit log"];

type AuditType = "access" | "revoke" | "security";

const actionColors: Record<AuditType, string> = {
  access: "var(--blue)",
  revoke: "var(--red)",
  security: "var(--amber)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(email: string): string {
  const parts = email.split("@")[0].split(/[._-]/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

const avatarColors = [
  "var(--accent)", "var(--blue)", "var(--purple)", "var(--amber)", "var(--red)"
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ user }: { user: StaffAccessUser }) {
  const color = avatarColor(user.id);
  return (
    <div className={cx(styles.accessAvatar, toneClass(color))}>
      {initials(user.email)}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AccessControlPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "info" | "warning", message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [users, setUsers] = useState<StaffAccessUser[]>([]);
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [lockdownPending, setLockdownPending] = useState(false);
  const [selected, setSelected] = useState<StaffAccessUser | null>(null);

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const r = await loadStaffUsersWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        const msg = r.error.message;
        setError(msg);
        onNotify("error", msg);
      } else if (r.data) {
        setUsers(r.data);
      }
    } finally {
      setLoading(false);
    }
  }, [session, onNotify]);

  const loadAudit = useCallback(async () => {
    if (!session) return;
    setAuditLoading(true);
    const r = await loadAuditEventsWithRefresh(session, { limit: 50 });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) setAuditEvents(r.data);
    setAuditLoading(false);
  }, [session]);

  const handleLockdown = useCallback(async () => {
    if (!session) return;
    const confirmed = window.confirm(
      "⚠️ EMERGENCY LOCKDOWN\n\nThis will immediately terminate ALL active sessions across the entire platform — including your own.\n\nAll users will be signed out instantly. You will need to sign back in after this.\n\nAre you absolutely sure?"
    );
    if (!confirmed) return;

    setLockdownPending(true);
    const r = await lockdownSessionsWithRefresh(session);
    setLockdownPending(false);

    if (r.error) {
      onNotify("error", r.error.message);
    } else if (r.data) {
      onNotify("warning", `Emergency lockdown complete. ${r.data.revokedSessions} sessions terminated. You will be signed out.`);
      // Give the user 3s to read the message, then clear local session
      window.setTimeout(() => {
        window.location.href = "/internal-login";
      }, 3000);
    }
  }, [session, onNotify]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (activeTab === "audit log" && auditEvents.length === 0) {
      void loadAudit();
    }
  }, [activeTab, auditEvents.length, loadAudit]);

  const active = users.filter((u) => u.isActive);

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / ACCESS CONTROL</div>
          <h1 className={styles.pageTitle}>Access Control</h1>
          <div className={styles.pageSub}>Staff accounts · Roles · Access audit</div>
        </div>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost", styles.accessDangerBtn)}
            onClick={() => { void handleLockdown(); }}
            disabled={lockdownPending}
            style={lockdownPending ? { opacity: 0.5, pointerEvents: "none" } : undefined}
          >
            {lockdownPending ? "Locking down…" : "Emergency Lockdown"}
          </button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Active Users", value: active.length.toString(), color: "var(--accent)", sub: `${users.length} total accounts` },
          { label: "Inactive Users", value: (users.length - active.length).toString(), color: users.length - active.length > 0 ? "var(--amber)" : "var(--accent)", sub: "Revoked or disabled" },
          { label: "Total Accounts", value: users.length.toString(), color: "var(--blue)", sub: "All staff" },
          { label: "Session Status", value: session ? "Connected" : "No session", color: session ? "var(--accent)" : "var(--red)", sub: "Gateway auth" },
        ].map((stat) => (
          <div key={stat.label} className={cx(styles.statCard, toneClass(stat.color))}>
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={cx(styles.statValue, styles.accessToneText)}>{stat.value}</div>
            <div className={cx("text11", "colorMuted")}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select
          title="Select tab"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as Tab)}
          className={styles.filterSelect}
        >
          {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "users" && (
        users.length === 0 ? (
          <div className={cx("card", "p24", "text13", "colorMuted")}>No staff users found.</div>
        ) : (
          <div className={cx("flexCol", "gap12")}>
            {users.map((user) => {
              const color = avatarColor(user.id);
              const isSel = selected?.id === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => setSelected(isSel ? null : user)}
                  className={cx(styles.accessAdminCard, isSel ? toneClass(color) : "toneBorder")}
                >
                  <div className={styles.accessAdminGrid}>
                    <div className={styles.accessIdentityCell}>
                      <Avatar user={user} />
                      <div>
                        <div className={cx("fw700")}>{user.email.split("@")[0]}</div>
                        <div className={cx("text11", "colorMuted")}>{user.email}</div>
                      </div>
                    </div>
                    <div>
                      <div className={cx("text11", "colorMuted", "mb3")}>Role</div>
                      <div className={cx("text13", "fw600", user.role === "ADMIN" && "colorAccent")}>{user.role}</div>
                    </div>
                    <div>
                      <div className={cx("text11", "colorMuted", "mb3")}>Last Seen</div>
                      <div className={cx("text11", "fontMono", "colorMuted")}>{fmtDate(user.updatedAt)}</div>
                    </div>
                    <div>
                      <div className={cx("text11", "colorMuted", "mb3")}>Created</div>
                      <div className={cx("text11", "fontMono", "colorMuted")}>{fmtDate(user.createdAt)}</div>
                    </div>
                    <span className={cx(styles.accessStatusChip, user.isActive ? styles.accessChipActive : styles.accessChipMuted)}>
                      {user.isActive ? "active" : "inactive"}
                    </span>
                    <div className={cx("flexRow", "gap6")}>
                      <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
                    </div>
                  </div>

                  {isSel && (
                    <div className={styles.accessExpanded}>
                      <div className={styles.accessExpandedLabel}>Account Details</div>
                      <div className={cx("flexRow", "gap8", "flexWrap")}>
                        <span className={cx("badge", user.role === "ADMIN" ? "badgeAccent" : "badgeBlue")}>
                          {user.role}
                        </span>
                        <span className={cx("badge", user.isActive ? "badgeAccent" : "badgeMuted")}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {activeTab === "audit log" && (
        <div className={cx("card", "p24")}>
          <div className={styles.accessSectionTitle}>Audit Log</div>
          {auditLoading && (
            <div className={cx("text12", "colorMuted", "mb12")}>Loading audit events…</div>
          )}
          {!auditLoading && auditEvents.length === 0 && (
            <div className={cx("text12", "colorMuted")}>No audit events recorded yet.</div>
          )}
          {!auditLoading && auditEvents.length > 0 && (
            <div className={cx("flexCol", "gap12")}>
              {auditEvents.map((entry, idx) => {
                const auditType: AuditType =
                  /revoke|disable|delete|remove/i.test(entry.action) ? "revoke"
                  : /security|incident|lockdown|breach/i.test(entry.action) ? "security"
                  : "access";
                return (
                  <Fragment key={entry.id}>
                    <div className={cx(styles.accessAuditRow, idx === auditEvents.length - 1 && styles.accessAuditRowLast)}>
                      <span className={cx("fontMono", "text11", "colorMuted")}>{entry.id.slice(0, 8)}</span>
                      <span className={cx("text13", "fw600")}>{entry.actorName ?? entry.actorRole ?? "System"}</span>
                      <span className={cx("text12", "colorMuted")}>{entry.action} {entry.resourceType && `· ${entry.resourceType}`}</span>
                      <span className={cx(styles.accessAuditType, toneClass(actionColors[auditType]))}>{auditType}</span>
                      <span className={cx("text11", "fontMono", "colorMuted")}>{fmtDate(entry.createdAt)}</span>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
