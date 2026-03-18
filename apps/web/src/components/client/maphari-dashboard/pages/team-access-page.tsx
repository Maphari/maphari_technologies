"use client";
// ════════════════════════════════════════════════════════
// team-access-page.tsx — Client Team & Access Management
// Service : core  |  Endpoints: GET/POST /clients/:id/team
// Scope   : CLIENT sees own-tenant members only
// ════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  loadPortalTeamMembersWithRefresh,
  invitePortalTeamMemberWithRefresh,
  type PortalTeamMember,
} from "../../../../lib/api/portal/team";
import { saveSession } from "../../../../lib/auth/session";

// ── Local types ────────────────────────────────────────────────────────────
type Role = "Owner" | "Billing Contact" | "Viewer" | "Collaborator";
type TStatus = "Active" | "Pending" | "Deactivated";
type PageTab = "Members" | "Permissions" | "Heartbeat";

// ── Display maps ───────────────────────────────────────────────────────────
const ROLE_INFO: Record<Role, string> = {
  Owner:             "Full access — can manage team, approve milestones, and sign contracts.",
  "Billing Contact": "Access to Finance section and invoice downloads only.",
  Collaborator:      "Can view all sections and submit feedback and change requests.",
  Viewer:            "Read-only access to project pages. Cannot approve or submit.",
};

const ROLE_BADGE: Record<Role, string> = {
  Owner:             "badgeAccent",
  "Billing Contact": "badgeAmber",
  Collaborator:      "badgeGreen",
  Viewer:            "badgeMuted",
};

const ROLE_COLOR: Record<Role, string> = {
  Owner:             "var(--lime)",
  "Billing Contact": "var(--amber)",
  Collaborator:      "var(--green)",
  Viewer:            "var(--purple)",
};

const ROLE_CAPS: Record<Role, string[]> = {
  Owner:             ["Full portal access", "Manage team", "Sign contracts", "Approve milestones"],
  "Billing Contact": ["Finance section", "Invoice downloads", "Payment management"],
  Collaborator:      ["View all sections", "Submit feedback", "Change requests"],
  Viewer:            ["Read-only access", "No approvals", "No submissions"],
};

// ── Helpers ────────────────────────────────────────────────────────────────
function toRole(r: string): Role {
  if (r === "Owner" || r === "Billing Contact" || r === "Collaborator" || r === "Viewer") return r;
  return "Viewer";
}

function toStatus(s: string): TStatus {
  if (s === "Active"  || s === "ACTIVE")       return "Active";
  if (s === "Pending" || s === "PENDING")      return "Pending";
  if (s === "Deactivated" || s === "INACTIVE") return "Deactivated";
  return "Deactivated";
}

function initials(name: string): string {
  return name.split(" ").map(p => p[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function fmtLastActive(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ──────────────────────────────────────────────────────────────
export function TeamAccessPage() {
  const { session } = useProjectLayer();

  const [tab, setTab] = useState<PageTab>("Members");

  // ── Members state ──────────────────────────────────────────────────────
  const [members, setMembers] = useState<PortalTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Invite state ───────────────────────────────────────────────────────
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState<Role>("Viewer");
  const [inviting, setInviting]       = useState(false);

  // ── Load team members on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const clientId = session.user.clientId ?? session.user.id;
    if (!clientId) { setLoading(false); return; }
    loadPortalTeamMembersWithRefresh(session, clientId).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setMembers(r.data);
    }).finally(() => setLoading(false));
  }, [session]);

  // ── Send invite ────────────────────────────────────────────────────────
  async function handleSendInvite() {
    if (!session || !inviteEmail.trim()) return;
    const clientId = session.user.clientId ?? session.user.id;
    if (!clientId) return;
    setInviting(true);
    const r = await invitePortalTeamMemberWithRefresh(session, clientId, { email: inviteEmail.trim(), role: inviteRole });
    if (r.nextSession) saveSession(r.nextSession);
    setInviting(false);
    setShowInvite(false);
    setInviteEmail("");
    // Reload to include the new pending invite
    const reload = await loadPortalTeamMembersWithRefresh(r.nextSession ?? session, clientId);
    if (reload.data) setMembers(reload.data);
  }

  // ── Derived stats ──────────────────────────────────────────────────────
  const activeCount  = members.filter(m => ["Active", "ACTIVE"].includes(m.status)).length;
  const pendingCount = members.filter(m => ["Pending", "PENDING"].includes(m.status)).length;
  const ownerMember  = members.find(m => m.role === "Owner");
  const ownerName    = ownerMember ? ownerMember.name.split(" ")[0] : "—";

  return (
    <div className={cx("pageBody")}>

      {/* ── Invite modal ──────────────────────────────────────────────────────── */}
      {showInvite && (
        <div className={cx("modalOverlayBlur")}>
          <div className={cx("card", "w460", "p0", "overflowHidden")}>
            <div className={cx("modalHd")}>
              <div>
                <div className={cx("fw700", "text13")}>Invite Team Member</div>
                <div className={cx("text11", "colorMuted")}>They&apos;ll receive an email with a portal access link.</div>
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
                onChange={e => setInviteEmail(e.target.value)}
              />
              <div className={cx("text11", "colorMuted", "mb8")}>Access role</div>
              <div className={cx("flexCol", "gap8")}>
                {(["Viewer", "Collaborator", "Billing Contact"] as Role[]).map(r => {
                  const active = inviteRole === r;
                  const c = ROLE_COLOR[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className={cx("selectorBtn")}
                      style={{
                        "--bg-color": active ? `color-mix(in oklab, ${c} 8%, var(--s2))` : "var(--s2)",
                        "--color": active ? `color-mix(in oklab, ${c} 35%, transparent)` : "var(--b1)",
                      } as React.CSSProperties}
                    >
                      <div className={cx("wh8", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": active ? c : "var(--b3)" } as React.CSSProperties} />
                      <div className={cx("flex1", "minW0")}>
                        <div className={cx("fw600", "text12", "dynColor")} style={{ "--color": active ? c : "inherit" } as React.CSSProperties}>{r}</div>
                        <div className={cx("text10", "colorMuted")}>{ROLE_INFO[r]}</div>
                      </div>
                      {active && <Ic n="check" sz={13} c={c} />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={cx("flexRow", "gap8", "p14x20", "borderTop")}>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => { void handleSendInvite(); }}
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? "Sending…" : "Send Invite"}
              </button>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setShowInvite(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Account · Team</div>
          <h1 className={cx("pageTitle")}>Team Access</h1>
          <p className={cx("pageSub")}>Manage who on your team has access to this portal — and see your Maphari team live in action.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setShowInvite(true)}>+ Invite Member</button>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack")}>
        {([
          { label: "Active Members",  value: String(activeCount),    color: "statCardGreen"  },
          { label: "Pending Invites", value: String(pendingCount),   color: "statCardAmber"  },
          { label: "Total Members",   value: String(members.length), color: "statCardBlue"   },
          { label: "Owner",           value: ownerName,              color: "statCardAccent" },
        ] as { label: string; value: string; color: string }[]).map(s => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className={cx("pillTabs", "mb16")}>
        {(["Members", "Permissions", "Heartbeat"] as PageTab[]).map(t => (
          <button key={t} type="button" className={cx("pillTab", tab === t && "pillTabActive")} onClick={() => setTab(t)}>
            {t === "Heartbeat" ? <><Ic n="activity" sz={13} />{" "}</> : null}{t}
          </button>
        ))}
      </div>

      {/* ── Members tab ───────────────────────────────────────────────────────── */}
      {tab === "Members" && (
        <div className={cx("flexCol", "gap10")}>
          {loading && [1, 2, 3].map(i => (
            <div key={i} className={cx("card", "skeletonBlock", "h72")} />
          ))}
          {!loading && members.length === 0 && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="users" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No team members yet</div>
              <div className={cx("emptyStateSub")}>Invite your team to collaborate on this project.</div>
            </div>
          )}
          {!loading && members.map(m => {
            const role   = toRole(m.role);
            const status = toStatus(m.status);
            const color  = ROLE_COLOR[role];
            const av     = initials(m.name);
            return (
              <div
                key={m.id}
                className={cx("card", "flexRow", "gap14", "p14x18", "dynBorderLeft3")}
                style={{ "--color": color } as React.CSSProperties}
              >
                <div className={cx("dynAvatar", "dynAvatar42", "dynColor", "dynAvatarBorder")}
                  style={{
                    "--bg-color": `color-mix(in oklab, ${color} 12%, var(--s2))`,
                    "--color": `color-mix(in oklab, ${color} 30%, transparent)`,
                  } as React.CSSProperties}>
                  {av}
                </div>
                <div className={cx("flex1", "minW0")}>
                  <div className={cx("flexRow", "gap8", "mb3")}>
                    <span className={cx("fw700", "text13")}>{m.name}</span>
                    <span className={cx("badge", ROLE_BADGE[role])}>{role}</span>
                  </div>
                  <div className={cx("text10", "colorMuted", "flexRow", "gap6")}>
                    <span>{m.email}</span>
                    <span className={cx("opacity30")}>·</span>
                    <span className={cx("flexRow", "gap4")}>
                      {status === "Active" && (
                        <span className={cx("dot6", "inlineBlock", "noShrink")} style={{ "--bg-color": "var(--lime)" } as React.CSSProperties} />
                      )}
                      Last active {fmtLastActive(m.lastActiveAt)}
                    </span>
                  </div>
                </div>
                <div className={cx("flexRow", "gap8", "noShrink")}>
                  <span className={cx("badge", status === "Active" ? "badgeGreen" : status === "Pending" ? "badgeAmber" : "badgeMuted")}>
                    {status}
                  </span>
                  {role !== "Owner" && (
                    <button type="button" className={cx("btnSm", "btnGhost")}>Manage</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Permissions tab ───────────────────────────────────────────────────── */}
      {tab === "Permissions" && (
        <div className={cx("grid2Cols14Gap")}>
          {(Object.entries(ROLE_INFO) as [Role, string][]).map(([role, desc]) => {
            const color = ROLE_COLOR[role];
            const caps  = ROLE_CAPS[role];
            return (
              <div key={role} className={cx("card", "p0", "overflowHidden")}>
                <div className={cx("h3", "dynBgColor")} style={{ "--bg-color": color } as React.CSSProperties} />
                <div className={cx("p18")}>
                  <span className={cx("badge", ROLE_BADGE[role], "block", "mb10")}>{role}</span>
                  <div className={cx("text12", "colorMuted", "lineH16", "mb14")}>{desc}</div>
                  <div className={cx("flexRow", "flexWrap", "gap5")}>
                    {caps.map(cap => (
                      <span key={cap} className={cx("capPill")}
                        style={{
                          "--bg-color": `color-mix(in oklab, ${color} 8%, var(--s3))`,
                          "--color": `color-mix(in oklab, ${color} 22%, var(--b1))`,
                        } as React.CSSProperties}>
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Heartbeat tab ─────────────────────────────────────────────────────── */}
      {tab === "Heartbeat" && (
        <div className={cx("card")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}>
              <Ic n="activity" sz={22} c="var(--muted2)" />
            </div>
            <div className={cx("emptyStateTitle")}>Team activity not available</div>
            <p className={cx("emptyStateSub")}>
              Maphari team activity will appear here once the live heartbeat feature is enabled.
              Your dedicated team is working on your project — reach them via Messages.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
