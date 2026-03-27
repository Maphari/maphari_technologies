"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  invitePortalTeamMemberWithRefresh,
  loadPortalTeamMembersWithRefresh,
  type PortalTeamInvite,
  type PortalTeamMember,
} from "../../../../lib/api/portal/team";
import { saveSession } from "../../../../lib/auth/session";

type Role = "Owner" | "Billing Contact" | "Viewer" | "Collaborator";
type TStatus = "Active" | "Pending" | "Deactivated";
type PageTab = "Members" | "Permissions";
type TeamRow = PortalTeamMember & { uiStatus: TStatus };

const ROLE_INFO: Record<Role, string> = {
  Owner: "Full access to the portal, including approvals and account-critical actions.",
  "Billing Contact": "Focused access to finance, invoices, and billing-related files.",
  Collaborator: "Can view delivery areas and contribute feedback or requests where supported.",
  Viewer: "Read-only access for stakeholders who only need visibility.",
};

const ROLE_BADGE: Record<Role, string> = {
  Owner: "badgeAccent",
  "Billing Contact": "badgeAmber",
  Collaborator: "badgeGreen",
  Viewer: "badgeMuted",
};

const ROLE_COLOR: Record<Role, string> = {
  Owner: "var(--lime)",
  "Billing Contact": "var(--amber)",
  Collaborator: "var(--green)",
  Viewer: "var(--purple)",
};

const ROLE_CAPS: Record<Role, string[]> = {
  Owner: ["Portal-wide visibility", "Approvals", "Contracts", "Team oversight"],
  "Billing Contact": ["Finance pages", "Invoice downloads", "Billing visibility"],
  Collaborator: ["Project visibility", "Feedback input", "Request collaboration"],
  Viewer: ["Read-only visibility", "No approvals", "No submissions"],
};

function toRole(input: string): Role {
  if (input === "Owner" || input === "Billing Contact" || input === "Collaborator" || input === "Viewer") return input;
  return "Viewer";
}

function toStatus(input: string): TStatus {
  if (input === "Active" || input === "ACTIVE") return "Active";
  if (input === "Pending" || input === "PENDING") return "Pending";
  if (input === "Deactivated" || input === "INACTIVE") return "Deactivated";
  return "Deactivated";
}

function initials(name: string): string {
  return name.split(" ").map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function fmtRelativeDate(iso: string | null): string {
  if (!iso) return "No recent activity";
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays <= 0) return "Active today";
  if (diffDays === 1) return "Active yesterday";
  return `Active ${date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`;
}

function invitedName(email: string): string {
  const prefix = email.split("@")[0] ?? email;
  return prefix
    .replace(/[._\-+]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TeamAccessPage() {
  const { session } = useProjectLayer();

  const [tab, setTab] = useState<PageTab>("Members");
  const [members, setMembers] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  async function loadMembers(sourceSession = session) {
    if (!sourceSession) {
      setLoading(false);
      return;
    }

    const clientId = sourceSession.user.clientId ?? sourceSession.user.id;
    if (!clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await loadPortalTeamMembersWithRefresh(sourceSession, clientId);
    if (result.nextSession) saveSession(result.nextSession);

    if (result.error) {
      setError(result.error.message ?? "Unable to load team members.");
      setLoading(false);
      return;
    }

    setMembers((current) => {
      const pendingRows = current.filter((member) => member.uiStatus === "Pending");
      const activeRows = (result.data ?? []).map((member) => ({
        ...member,
        uiStatus: toStatus(member.status),
      }));
      const dedupedPending = pendingRows.filter((pending) => !activeRows.some((member) => member.email.toLowerCase() === pending.email.toLowerCase()));
      return [...activeRows, ...dedupedPending];
    });
    setLoading(false);
  }

  useEffect(() => {
    void loadMembers();
  }, [session]);

  async function handleSendInvite() {
    if (!session || !inviteEmail.trim()) return;
    const clientId = session.user.clientId ?? session.user.id;
    if (!clientId) return;

    setInviting(true);
    setInviteError(null);

    const result = await invitePortalTeamMemberWithRefresh(session, clientId, {
      email: inviteEmail.trim(),
      role: inviteRole,
    });

    if (result.nextSession) saveSession(result.nextSession);

    if (result.error || !result.data) {
      setInviteError(result.error?.message ?? "Unable to send invitation.");
      setInviting(false);
      return;
    }

    const invite = result.data as PortalTeamInvite;
    setMembers((current) => {
      const withoutSameEmail = current.filter((member) => member.email.toLowerCase() !== invite.email.toLowerCase());
      return [
        ...withoutSameEmail,
        {
          id: invite.id,
          clientId,
          name: invitedName(invite.email),
          email: invite.email,
          role: invite.role,
          canManageAccess: invite.canManageAccess,
          status: invite.status,
          lastActiveAt: null,
          createdAt: invite.createdAt,
          uiStatus: "Pending",
        },
      ];
    });

    setInviting(false);
    setShowInvite(false);
    setInviteEmail("");
    setInviteRole("Viewer");
  }

  const activeMembers = useMemo(() => members.filter((member) => member.uiStatus === "Active"), [members]);
  const pendingMembers = useMemo(() => members.filter((member) => member.uiStatus === "Pending"), [members]);
  const ownerMember = useMemo(
    () => members.find((member) => member.canManageAccess) ?? members.find((member) => toRole(member.role) === "Owner"),
    [members]
  );
  const canManageTeamAccess = useMemo(() => {
    if (!session) return false;
    if (session.user.role === "ADMIN" || session.user.role === "STAFF") return true;
    if (session.user.role !== "CLIENT") return false;
    return members.some((member) => member.canManageAccess && member.email.trim().toLowerCase() === session.user.email.trim().toLowerCase());
  }, [members, session]);
  const roleCoverage = useMemo(() => {
    const populatedRoles = (Object.keys(ROLE_INFO) as Role[]).filter((role) => members.some((member) => toRole(member.role) === role)).length;
    return Math.round((populatedRoles / Object.keys(ROLE_INFO).length) * 100);
  }, [members]);
  const roleBreakdown = useMemo(() => {
    return (Object.keys(ROLE_INFO) as Role[]).map((role) => ({
      role,
      count: members.filter((member) => toRole(member.role) === role).length,
    }));
  }, [members]);

  return (
    <div className={cx("pageBody")}>
      {showInvite && canManageTeamAccess && (
        <div className={cx("modalOverlayBlur")}>
          <div className={cx("card", "w460", "p0", "overflowHidden", "teamAccessModal")}>
            <div className={cx("modalHd")}>
              <div>
                <div className={cx("fw700", "text13")}>Invite Team Member</div>
                <div className={cx("text11", "colorMuted")}>This creates a real tenant contact and sends a pending invite.</div>
              </div>
              <button type="button" onClick={() => setShowInvite(false)} className={cx("iconCloseBtn")}>
                <Ic n="x" sz={16} />
              </button>
            </div>
            <div className={cx("py18_px", "px20_px")}>
              <div className={cx("text11", "colorMuted", "mb6")}>Email address</div>
              <input
                className={cx("input", "mb16")}
                placeholder="colleague@company.co.za"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <div className={cx("text11", "colorMuted", "mb8")}>Access role</div>
              <div className={cx("flexCol", "gap8")}>
                {(["Viewer", "Collaborator", "Billing Contact"] as Role[]).map((role) => {
                  const active = inviteRole === role;
                  const color = ROLE_COLOR[role];
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setInviteRole(role)}
                      className={cx("selectorBtn", "teamAccessInviteOption")}
                      style={{
                        "--bg-color": active ? `color-mix(in oklab, ${color} 8%, var(--s2))` : "var(--s2)",
                        "--color": active ? `color-mix(in oklab, ${color} 35%, transparent)` : "var(--b1)",
                      } as React.CSSProperties}
                    >
                      <div className={cx("wh8", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": active ? color : "var(--b3)" } as React.CSSProperties} />
                      <div className={cx("flex1", "minW0")}>
                        <div className={cx("fw600", "text12", "dynColor")} style={{ "--color": active ? color : "inherit" } as React.CSSProperties}>{role}</div>
                        <div className={cx("text10", "colorMuted")}>{ROLE_INFO[role]}</div>
                      </div>
                      {active && <Ic n="check" sz={13} c={color} />}
                    </button>
                  );
                })}
              </div>
              {inviteError && (
                <div className={cx("alert", "alertError", "mt12")}>{inviteError}</div>
              )}
            </div>
            <div className={cx("flexRow", "gap8", "p14x20", "borderTop")}>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => { void handleSendInvite(); }}
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowInvite(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <section className={cx("teamAccessShell", "mb16")}>
        <div className={cx("teamAccessHeroRow")}>
          <div>
            <div className={cx("pageEyebrow")}>Account · Team</div>
            <h1 className={cx("pageTitle")}>Team Access</h1>
            <p className={cx("pageSub", "mb16")}>Manage real portal access for your client-side contacts and review what each role is allowed to see.</p>
          </div>
          <div className={cx("pageActions")}>
            <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void loadMembers()} disabled={loading}>
              Refresh
            </button>
            {canManageTeamAccess ? (
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowInvite(true)}>Invite Member</button>
            ) : null}
          </div>
        </div>

        <div className={cx("teamAccessStatsGrid")}>
          {[
            { label: "Active Members", value: String(activeMembers.length), meta: "Live contact records", color: "statCardGreen" },
            { label: "Pending Invites", value: String(pendingMembers.length), meta: "Awaiting acceptance", color: "statCardAmber" },
            { label: "Role Coverage", value: `${roleCoverage}%`, meta: `${roleBreakdown.filter((item) => item.count > 0).length} of ${roleBreakdown.length} roles in use`, color: "statCardBlue" },
            { label: "Primary Owner", value: ownerMember ? ownerMember.name.split(" ")[0] : "—", meta: ownerMember ? ownerMember.email : "No owner assigned yet", color: "statCardAccent" },
          ].map((stat) => (
            <div key={stat.label} className={cx("statCard", stat.color, "teamAccessStatCard")}>
              <div className={cx("statLabel")}>{stat.label}</div>
              <div className={cx("statValue")}>{stat.value}</div>
              <div className={cx("statMeta")}>{stat.meta}</div>
            </div>
          ))}
        </div>

        <div className={cx("teamAccessTabRail")}>
          <div className={cx("pillTabs", "mb0")}>
            {(["Members", "Permissions"] as PageTab[]).map((item) => (
              <button key={item} type="button" className={cx("pillTab", tab === item && "pillTabActive")} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!canManageTeamAccess && !loading ? (
        <div className={cx("teamAccessReadOnlyBanner", "mb16")}>
          <div className={cx("teamAccessReadOnlyTitle")}>Access management is limited to the assigned client access admin.</div>
          <div className={cx("teamAccessReadOnlyCopy")}>You can review who has access, but only the account access owner or internal Maphari staff can invite or manage team members.</div>
        </div>
      ) : null}

      {error ? (
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Unable to load team access</div>
          <div className={cx("errorStateSub")}>{error}</div>
          <button type="button" className={cx("btn", "btnPrimary", "mt12")} onClick={() => void loadMembers()}>
            Retry
          </button>
        </div>
      ) : null}

      {!error && tab === "Members" && (
        <div className={cx("teamAccessMembersLayout")}>
          <aside className={cx("teamAccessSideCol")}>
            <div className={cx("teamAccessPanel")}>
              <div className={cx("teamAccessPanelEyebrow")}>Access Snapshot</div>
              <div className={cx("teamAccessSnapshotValue")}>{members.length}</div>
              <div className={cx("teamAccessPanelCopy")}>Real client contact records currently tied to this account workspace.</div>
              <div className={cx("teamAccessMiniStatList")}>
                <div className={cx("teamAccessMiniStat")}>
                  <span className={cx("teamAccessMiniLabel")}>Owner</span>
                  <span className={cx("teamAccessMiniValue")}>{ownerMember?.name ?? "Unassigned"}</span>
                </div>
                <div className={cx("teamAccessMiniStat")}>
                  <span className={cx("teamAccessMiniLabel")}>Pending</span>
                  <span className={cx("teamAccessMiniValue")}>{pendingMembers.length}</span>
                </div>
              </div>
              <div className={cx("teamAccessProgressMeta")}>
                <span>Role mix</span>
                <span>{roleCoverage}%</span>
              </div>
              <div className={cx("progressTrack", "teamAccessProgressTrack")}>
                <div className={cx("progressFill")} style={{ "--pct": `${roleCoverage}%` } as React.CSSProperties} />
              </div>
            </div>

            <div className={cx("teamAccessPanel")}>
              <div className={cx("teamAccessPanelEyebrow")}>Invite Guidance</div>
              <div className={cx("teamAccessPanelTitle")}>Use the narrowest role that still lets the contact do their job.</div>
              <div className={cx("teamAccessPanelCopy")}>Owners should stay limited. Billing Contacts and Collaborators cover most non-owner access patterns.</div>
              <div className={cx("teamAccessRoleList")}>
                {(Object.keys(ROLE_INFO) as Role[]).map((role) => (
                  <div key={role} className={cx("teamAccessRoleRow")}>
                    <div className={cx("teamAccessRoleDot")} style={{ "--bg-color": ROLE_COLOR[role] } as React.CSSProperties} />
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("text11", "fw700")}>{role}</div>
                      <div className={cx("text10", "colorMuted")}>{ROLE_INFO[role]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className={cx("teamAccessMainCol")}>
            <section className={cx("teamAccessListShell")}>
              <div className={cx("teamAccessSectionHead")}>
                <div>
                  <div className={cx("teamAccessSectionEyebrow")}>Directory</div>
                  <h2 className={cx("teamAccessSectionTitle")}>Team Members</h2>
                </div>
                <div className={cx("teamAccessSectionMeta")}>{loading ? "Syncing access records..." : `${members.length} contacts`}</div>
              </div>

              {loading && [1, 2, 3].map((index) => (
                <div key={index} className={cx("teamAccessSkeleton")} />
              ))}

              {!loading && members.length === 0 && (
                <div className={cx("teamAccessEmptyState")}>
                  <div className={cx("teamAccessEmptyIcon")}><Ic n="users" sz={22} c="var(--muted2)" /></div>
                  <div className={cx("teamAccessEmptyTitle")}>No client contacts added yet</div>
                  <div className={cx("teamAccessEmptyCopy")}>
                    {canManageTeamAccess
                      ? "Invite teammates to create actual portal access records for this account."
                      : "No additional team members have access yet. The primary client contact or internal staff can add them when needed."}
                  </div>
                  {canManageTeamAccess ? (
                    <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowInvite(true)}>Invite First Member</button>
                  ) : null}
                </div>
              )}

              {!loading && members.map((member) => {
                const role = toRole(member.role);
                const status = member.uiStatus;
                const color = ROLE_COLOR[role];
                return (
                  <article
                    key={member.id}
                    className={cx("teamAccessMemberCard")}
                    style={{ "--team-tone": color } as React.CSSProperties}
                  >
                    <div
                      className={cx("teamAccessAvatar")}
                      style={{
                        "--bg-color": `color-mix(in oklab, ${color} 12%, var(--s2))`,
                        "--color": `color-mix(in oklab, ${color} 30%, white)`,
                      } as React.CSSProperties}
                    >
                      {initials(member.name)}
                    </div>
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("teamAccessMemberTop")}>
                        <span className={cx("teamAccessMemberName")}>{member.name}</span>
                        <span className={cx("badge", ROLE_BADGE[role])}>{role}</span>
                        <span className={cx("badge", status === "Active" ? "badgeGreen" : status === "Pending" ? "badgeAmber" : "badgeMuted")}>
                          {status}
                        </span>
                      </div>
                      <div className={cx("teamAccessMemberEmail")}>{member.email}</div>
                      <div className={cx("teamAccessMemberMetaRow")}>
                        <span>{status === "Pending" ? `Invited ${new Date(member.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}` : fmtRelativeDate(member.lastActiveAt)}</span>
                        <span>{status === "Pending" ? "Awaiting acceptance" : "Access granted"}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
        </div>
      )}

      {!error && tab === "Permissions" && (
        <div className={cx("teamAccessPermGrid")}>
          {(Object.entries(ROLE_INFO) as [Role, string][]).map(([role, description]) => {
            const color = ROLE_COLOR[role];
            const caps = ROLE_CAPS[role];
            const count = roleBreakdown.find((item) => item.role === role)?.count ?? 0;
            return (
              <div key={role} className={cx("teamAccessPermCard")}>
                <div className={cx("teamAccessPermGlow")} style={{ "--bg-color": color } as React.CSSProperties} />
                <div className={cx("p18")}>
                  <div className={cx("flexBetween", "gap8", "mb10", "flexWrap")}>
                    <span className={cx("badge", ROLE_BADGE[role])}>{role}</span>
                    <span className={cx("teamAccessAssigned")}>{count} assigned</span>
                  </div>
                  <div className={cx("teamAccessPermDesc")}>{description}</div>
                  <div className={cx("flexRow", "flexWrap", "gap5")}>
                    {caps.map((capability) => (
                      <span
                        key={capability}
                        className={cx("capPill", "teamAccessCapPill")}
                        style={{
                          "--bg-color": `color-mix(in oklab, ${color} 8%, var(--s3))`,
                          "--color": `color-mix(in oklab, ${color} 22%, var(--b1))`,
                        } as React.CSSProperties}
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
