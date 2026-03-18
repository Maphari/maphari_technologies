"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";

type TeamTab = "Members" | "Permissions" | "Activity";
type TeamRole = "admin" | "editor" | "viewer";
type TeamStatus = "active" | "pending";

type RoleInfo = {
  label: string;
  desc: string;
};

type TeamMember = {
  id: number;
  av: string;
  color: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  lastSeen: string;
  perms: boolean[];
};

const ROLE_INFO: Record<TeamRole, RoleInfo> = {
  admin: {
    label: "Admin",
    desc: "Full access — can approve, pay, sign, and manage team",
  },
  editor: {
    label: "Editor",
    desc: "Can give feedback and upload files",
  },
  viewer: {
    label: "Viewer",
    desc: "Read-only access — can view but not interact",
  },
};

const PERMISSIONS = [
  "View project",
  "Give feedback",
  "Approve deliverables",
  "Download files",
  "View invoices",
  "Pay invoices",
  "Sign documents",
  "Manage team",
] as const;

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 1,
    av: "ND",
    color: "#c8f135",
    name: "Naledi Dlamini",
    email: "naledi@veldt.co.za",
    role: "admin",
    status: "active",
    lastSeen: "Now",
    perms: [true, true, true, true, true, true, true, true],
  },
  {
    id: 2,
    av: "TM",
    color: "#8b6fff",
    name: "Thabo Molefe",
    email: "thabo@veldt.co.za",
    role: "editor",
    status: "active",
    lastSeen: "2h ago",
    perms: [true, true, true, true, false, false, false, false],
  },
  {
    id: 3,
    av: "ZD",
    color: "#3dd9d6",
    name: "Zanele Dube",
    email: "zanele@veldt.co.za",
    role: "viewer",
    status: "pending",
    lastSeen: "Never",
    perms: [true, false, false, false, false, false, false, false],
  },
];

const ACTIVITY = [
  { dot: "var(--accent)", text: "Naledi Dlamini approved Homepage Design v2", time: "Today 11:32" },
  { dot: "var(--purple)", text: "Thabo Molefe uploaded 3 brand asset files", time: "Today 09:14" },
  { dot: "var(--accent)", text: "Naledi Dlamini submitted feedback on Mobile Navigation", time: "Yesterday 16:45" },
  { dot: "var(--blue)", text: "Zanele Dube joined the portal", time: "Feb 18" },
  { dot: "var(--purple)", text: "Thabo Molefe viewed the Project Brief", time: "Feb 17" },
  { dot: "var(--accent)", text: "Naledi Dlamini signed the project contract", time: "Jan 10" },
];

export function TeamPage() {
  const [tab, setTab] = useState<TeamTab>("Members");
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [inviteModal, setInviteModal] = useState(false);
  const [permModalIndex, setPermModalIndex] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("viewer");
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const seatUsagePct = useMemo(() => Math.min((members.length / 5) * 100, 100), [members.length]);
  const currentPermMember = permModalIndex !== null ? members[permModalIndex] : null;

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  function removeMember(id: number): void {
    const member = members.find((item) => item.id === id);
    setMembers((prev) => prev.filter((item) => item.id !== id));
    if (member) notify("Member removed", `${member.name} has been removed`);
  }

  function togglePermission(memberIndex: number, permIndex: number): void {
    setMembers((prev) =>
      prev.map((member, idx) =>
        idx === memberIndex
          ? {
              ...member,
              perms: member.perms.map((value, valueIdx) => (valueIdx === permIndex ? !value : value)),
            }
          : member,
      ),
    );
  }

  return (
    <div className={cx("pageBody", styles.teamMgmtRoot)}>
      <div className={styles.teamMgmtLayout}>
        <aside className={styles.teamMgmtSidebar}>
          <div className={styles.teamMgmtSection}>Team</div>
          {(["Members", "Permissions", "Activity"] as const).map((item, idx) => (
            <button
              key={item}
              type="button"
              className={cx(styles.teamMgmtSideItem, tab === item && styles.teamMgmtSideItemActive)}
              onClick={() => setTab(item)}
            >
              <span
                className={styles.teamMgmtDot}
                style={{ '--bg-color': idx === 0 ? "var(--accent)" : idx === 1 ? "var(--purple)" : "var(--blue)" } as React.CSSProperties}
              />
              <span>{item}</span>
              {item === "Members" ? <span className={styles.teamMgmtBadge}>{members.length}</span> : null}
            </button>
          ))}

          <div className={styles.teamMgmtDivider} />
          <div className={styles.teamMgmtUsageCard}>
            <div className={styles.teamMgmtUsageTitle}>Seat Usage</div>
            <div className={styles.teamMgmtTrack}>
              <div className={styles.teamMgmtFill} style={{ '--pct': `${seatUsagePct}%` } as React.CSSProperties} />
            </div>
            <div className={styles.teamMgmtUsageMeta}>{members.length}/5 seats used</div>
          </div>
        </aside>

        <section className={styles.teamMgmtMain}>
          <div className={cx("pageHeader", "mb0")}>
            <div>
              <div className={cx("pageEyebrow")}>Veldt Finance · Team</div>
              <h1 className={cx("pageTitle")}>Team Management</h1>
              <p className={cx("pageSub")}>
                Control who can see your project, what they can do, and who gets notified.
              </p>
            </div>
            <div className={cx("pageActions")}>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setInviteModal(true)}>
                Invite Member
              </button>
            </div>
          </div>

          <div className={styles.teamMgmtTabs}>
            {(["Members", "Permissions", "Activity"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={cx(styles.teamMgmtTab, tab === item && styles.teamMgmtTabActive)}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === "Members" ? (
            <div className={styles.teamMgmtContent}>
              <div className={styles.teamMgmtSectionTitle}>Active Members</div>
              <div className={cx("card", styles.teamMgmtCardPadZero)}>
                {members.map((member) => (
                  <div key={member.id} className={styles.teamMgmtMemberRow}>
                    <div className={styles.teamMgmtAvatar} style={{ '--bg-color': member.color } as React.CSSProperties}>
                      {member.av}
                    </div>
                    <div className={styles.teamMgmtGrow}>
                      <div className={styles.teamMgmtName}>
                        {member.name}
                        {member.id === 1 ? (
                          <span className={cx("badge", "badgeAccent", styles.teamMgmtYou)}>You</span>
                        ) : null}
                      </div>
                      <div className={styles.teamMgmtMeta}>
                        {member.email} · Last seen {member.lastSeen}
                      </div>
                    </div>
                    <span className={cx("badge", member.role === "admin" ? "badgeAccent" : member.role === "editor" ? "badgePurple" : "badgeMuted")}>
                      {ROLE_INFO[member.role].label}
                    </span>
                    <span className={cx("badge", member.status === "active" ? "badgeGreen" : "badgeAmber")}>
                      {member.status}
                    </span>
                    <div className={styles.teamMgmtActions}>
                      <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setPermModalIndex(members.findIndex((m) => m.id === member.id))}>
                        Permissions
                      </button>
                      {member.id !== 1 ? (
                        <button
                          type="button"
                          className={cx("btnSm", "btnGhost", styles.teamMgmtDangerBtn)}
                          onClick={() => removeMember(member.id)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className={styles.teamMgmtSectionTitle}>Role Definitions</div>
                <div className={styles.teamMgmtRoleGrid}>
                  {(Object.keys(ROLE_INFO) as TeamRole[]).map((role) => (
                    <div key={role} className={cx("card", styles.teamMgmtRoleCard)}>
                      <div className={styles.teamMgmtRoleTitle}>{ROLE_INFO[role].label}</div>
                      <div className={styles.teamMgmtRoleDesc}>{ROLE_INFO[role].desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Permissions" ? (
            <div className={styles.teamMgmtContent}>
              <div className={styles.teamMgmtSectionTitle}>Permission Matrix</div>
              <div className={styles.teamMgmtTableWrap}>
                <table className={styles.teamMgmtTable}>
                  <thead>
                    <tr>
                      <th scope="col" className={styles.teamMgmtHeadCellLeft}>Permission</th>
                      {members.map((member) => (
                        <th scope="col" key={member.id} className={styles.teamMgmtHeadCellCenter}>
                          {member.av}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSIONS.map((permission, permIdx) => (
                      <tr key={permission}>
                        <td className={styles.teamMgmtPermCell}>{permission}</td>
                        {members.map((member, memberIdx) => (
                          <td key={`${member.id}-${permission}`} className={styles.teamMgmtDotCell}>
                            <button
                              type="button"
                              className={cx(
                                styles.teamMgmtPermDot,
                                member.perms[permIdx] && styles.teamMgmtPermDotOn,
                              )}
                              disabled={member.id === 1}
                              onClick={() => togglePermission(memberIdx, permIdx)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {tab === "Activity" ? (
            <div className={styles.teamMgmtContent}>
              <div className={styles.teamMgmtSectionTitle}>Team Activity Log</div>
              <div className={cx("card", styles.teamMgmtCardPadZero)}>
                {ACTIVITY.map((entry) => (
                  <div key={`${entry.text}-${entry.time}`} className={styles.teamMgmtActivityRow}>
                    <span className={styles.teamMgmtActivityDot} style={{ '--bg-color': entry.dot } as React.CSSProperties} />
                    <span className={styles.teamMgmtActivityText}>{entry.text}</span>
                    <span className={styles.teamMgmtActivityTime}>{entry.time}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {inviteModal ? (
        <div className={styles.teamMgmtModalBackdrop} onClick={() => setInviteModal(false)}>
          <div className={styles.teamMgmtModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.teamMgmtModalHeader}>
              <span className={styles.teamMgmtModalTitle}>Invite Team Member</span>
              <button type="button" className={styles.teamMgmtModalClose} onClick={() => setInviteModal(false)}>
                ✕
              </button>
            </div>
            <div className={styles.teamMgmtModalBody}>
              <div className={styles.teamMgmtFieldLabel}>Email Address</div>
              <input
                className={styles.teamMgmtInput}
                placeholder="colleague@yourcompany.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
              <div className={styles.teamMgmtFieldLabel}>Role</div>
              <select
                className={styles.teamMgmtSelect}
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as TeamRole)}
              >
                <option value="viewer">Viewer — read only</option>
                <option value="editor">Editor — can give feedback</option>
                <option value="admin">Admin — full access</option>
              </select>
              <div className={styles.teamMgmtModalInfo}>
                They will receive an email invitation to join your Veldt Finance portal. They can accept within 7
                days.
              </div>
            </div>
            <div className={styles.teamMgmtModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setInviteModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => {
                  setInviteModal(false);
                  notify("Invite sent", `${inviteEmail || "Team member"} has been invited`);
                  setInviteEmail("");
                  setInviteRole("viewer");
                }}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {currentPermMember ? (
        <div className={styles.teamMgmtModalBackdrop} onClick={() => setPermModalIndex(null)}>
          <div className={styles.teamMgmtModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.teamMgmtModalHeader}>
              <span className={styles.teamMgmtModalTitle}>Permissions: {currentPermMember.name}</span>
              <button type="button" className={styles.teamMgmtModalClose} onClick={() => setPermModalIndex(null)}>
                ✕
              </button>
            </div>
            <div className={styles.teamMgmtModalBody}>
              <div className={styles.teamMgmtPermGrid}>
                {PERMISSIONS.map((permission, permIdx) => (
                  <div key={permission} className={styles.teamMgmtPermItem}>
                    <button
                      type="button"
                      className={cx(styles.teamMgmtPermToggle, currentPermMember.perms[permIdx] && styles.teamMgmtPermToggleOn)}
                      onClick={() => {
                        if (permModalIndex === null) return;
                        togglePermission(permModalIndex, permIdx);
                      }}
                    />
                    <span className={styles.teamMgmtPermLabel}>{permission}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.teamMgmtModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setPermModalIndex(null)}>
                Close
              </button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => {
                  setPermModalIndex(null);
                  notify("Permissions saved", "Changes applied immediately");
                }}
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={cx("toastStack")}>
          <div className={cx("toast", "toastSuccess")}>
            <strong>{toast.title}</strong>
            <div>{toast.subtitle}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
