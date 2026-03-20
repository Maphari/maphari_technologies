"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { getStaffTeamPerformance, type StaffTeamMember } from "../../../../lib/api/staff/performance";
import { saveSession, type AuthSession } from "../../../../lib/auth/session";

// ── Local types ───────────────────────────────────────────────────────────────

type TeamMemberRow = {
  id: string;
  name: string;
  role: string;
  department: string;
  reportsTo: string;
  status: "Active" | "On Leave";
};

type EscalationRow = {
  level: number;
  role: string;
  contact: string;
  method: string;
};

// ── Props ─────────────────────────────────────────────────────────────────────

type MyTeamPageProps = {
  isActive: boolean;
  session: AuthSession | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const CONTACT_AVATAR_COLORS = [
  "mteAvatarAccent",
  "mteAvatarBlue",
  "mteAvatarGreen",
  "mteAvatarAmber",
  "mteAvatarPurple",
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function memberAvatarCls(name: string): string {
  const hash = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return CONTACT_AVATAR_COLORS[hash % CONTACT_AVATAR_COLORS.length];
}

function deptCls(dept: string): string {
  if (dept === "Leadership")  return "mteDeptLeadership";
  if (dept === "Creative")    return "mteDeptCreative";
  if (dept === "Engineering") return "mteDeptEngineering";
  if (dept === "Operations")  return "mteDeptOperations";
  return "";
}

function statusCls(s: "Active" | "On Leave"): string {
  return s === "Active" ? "mteStatusActive" : "mteStatusOnLeave";
}

function escalationLevelCls(level: number): string {
  if (level === 3) return "mteLevelRed";
  if (level === 2) return "mteLevelAmber";
  return "mteLevelMuted";
}

function methodCls(method: string): string {
  if (method === "Emergency Line") return "mteMethodEmergency";
  if (method === "Direct Call")    return "mteMethodCall";
  return "mteMethodDefault";
}

/** Map API StaffTeamMember → local row. Utilization 0 → On Leave heuristic. */
function toTeamRow(m: StaffTeamMember): TeamMemberRow {
  return {
    id: m.id,
    name: m.name,
    role: m.role,
    department: m.department ?? "General",
    reportsTo: "—",
    status: m.utilizationPct === 0 && m.hoursThisWeek === 0 && m.tasksCompleted === 0 ? "On Leave" : "Active",
  };
}

/** Build escalation chain from team data: highest-role members sorted by seniority heuristic. */
function buildEscalation(members: TeamMemberRow[]): EscalationRow[] {
  const ROLE_WEIGHT: Record<string, number> = {
    "CEO": 100, "CTO": 95, "COO": 95, "CFO": 95,
    "Director": 80, "Creative Director": 80,
    "VP": 75,
    "Manager": 60, "Project Manager": 60,
    "Lead": 50, "Team Lead": 50,
    "Senior": 40,
  };
  function weight(role: string): number {
    for (const [key, w] of Object.entries(ROLE_WEIGHT)) {
      if (role.toLowerCase().includes(key.toLowerCase())) return w;
    }
    return 10;
  }
  const sorted = [...members].sort((a, b) => weight(b.role) - weight(a.role));
  const top = sorted.slice(0, 3);
  const methods = ["Slack / Email", "Direct Call", "Emergency Line"];
  return top.map((m, i) => ({
    level: i + 1,
    role: m.role,
    contact: m.name,
    method: methods[i] ?? "Slack / Email",
  }));
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className={cx("mteStatCard", "opacity50")}>
      <div className={cx("mteStatCardTop")}>
        <div className={cx("skeleBlock10x50p")} />
        <div className={cx("skeleBlock22x35p")} />
      </div>
      <div className={cx("mteStatCardDivider")} />
      <div className={cx("skeleBlock9x60p")} />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className={cx("mteMemberRow", "opacity45")}>
      <div className={cx("skeleCircle36")} />
      <div className={cx("flex1", "flexCol", "gap6")}>
        <div className={cx("skeleBlock12x40p")} />
        <div className={cx("skeleBlock10x25p")} />
      </div>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function MyTeamPage({ isActive, session }: MyTeamPageProps) {
  const [team, setTeam] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void getStaffTeamPerformance(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) {
        setError(r.error?.message ?? "Failed to load data. Please try again.");
        return;
      }
      setTeam(r.data.map(toTeamRow));
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load data.");
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalMembers = team.length;
  const activeCount  = team.filter((m) => m.status === "Active").length;
  const onLeaveCount = team.filter((m) => m.status === "On Leave").length;
  const deptCount    = new Set(team.map((m) => m.department)).size;
  const escalation   = buildEscalation(team);

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
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-team">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Governance</div>
        <h1 className={cx("pageTitleText")}>My Team</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Team hierarchy and escalation paths</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("mteStatGrid")}>
        {(
          <>
            <div className={cx("mteStatCard")}>
              <div className={cx("mteStatCardTop")}>
                <div className={cx("mteStatLabel")}>Team Size</div>
                <div className={cx("mteStatValue", "colorAccent")}>{totalMembers}</div>
              </div>
              <div className={cx("mteStatCardDivider")} />
              <div className={cx("mteStatCardBottom")}>
                <span className={cx("mteStatDot", "dotBgAccent")} />
                <span className={cx("mteStatMeta")}>total members</span>
              </div>
            </div>

            <div className={cx("mteStatCard")}>
              <div className={cx("mteStatCardTop")}>
                <div className={cx("mteStatLabel")}>Active</div>
                <div className={cx("mteStatValue", "colorGreen")}>{activeCount}</div>
              </div>
              <div className={cx("mteStatCardDivider")} />
              <div className={cx("mteStatCardBottom")}>
                <span className={cx("mteStatDot", "dotBgGreen")} />
                <span className={cx("mteStatMeta")}>in office</span>
              </div>
            </div>

            <div className={cx("mteStatCard")}>
              <div className={cx("mteStatCardTop")}>
                <div className={cx("mteStatLabel")}>On Leave</div>
                <div className={cx("mteStatValue", onLeaveCount > 0 ? "colorAmber" : "colorGreen")}>{onLeaveCount}</div>
              </div>
              <div className={cx("mteStatCardDivider")} />
              <div className={cx("mteStatCardBottom")}>
                <span className={cx("mteStatDot", "dynBgColor")} style={{ "--bg-color": onLeaveCount > 0 ? "var(--amber)" : "var(--green)" } as React.CSSProperties} />
                <span className={cx("mteStatMeta")}>{onLeaveCount > 0 ? "currently away" : "all present"}</span>
              </div>
            </div>

            <div className={cx("mteStatCard")}>
              <div className={cx("mteStatCardTop")}>
                <div className={cx("mteStatLabel")}>Departments</div>
                <div className={cx("mteStatValue", "colorMuted2")}>{deptCount}</div>
              </div>
              <div className={cx("mteStatCardDivider")} />
              <div className={cx("mteStatCardBottom")}>
                <span className={cx("mteStatDot", "dotBgMuted2")} />
                <span className={cx("mteStatMeta")}>across org</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Team members ──────────────────────────────────────────────────── */}
      <div className={cx("mteSection")}>

        <div className={cx("mteSectionHeader")}>
          <div className={cx("mteSectionTitle")}>Team Members</div>
          <span className={cx("mteSectionMeta")}>{`${team.length} MEMBERS`}</span>
        </div>

        <div className={cx("mteMemberList")}>
          {team.length === 0 ? (
            <div className={cx("mteMemberRow", "justifyCenter", "opacity55", "py32_0")} >
              No team members found
            </div>
          ) : (
            team.map((m, idx) => (
              <div
                key={m.id}
                className={cx(
                  "mteMemberRow",
                  idx === team.length - 1 && "mteMemberRowLast",
                )}
              >
                {/* Initials avatar */}
                <div className={cx("mteMemberAvatar", memberAvatarCls(m.name))}>
                  {initials(m.name)}
                </div>

                {/* Name + role */}
                <div className={cx("mteMemberInfo")}>
                  <span className={cx("mteMemberName")}>{m.name}</span>
                  <span className={cx("mteMemberRole")}>{m.role}</span>
                </div>

                {/* Department badge */}
                <span className={cx("mteDeptBadge", deptCls(m.department))}>{m.department}</span>

                {/* Reports to */}
                <div className={cx("mteReportsTo")}>
                  <span className={cx("mteReportsToLabel")}>Reports to</span>
                  <span className={cx("mteReportsToValue")}>{m.reportsTo}</span>
                </div>

                {/* Status badge */}
                <span className={cx("mteStatusBadge", statusCls(m.status))}>{m.status}</span>

              </div>
            ))
          )}
        </div>

      </div>

      {/* ── Escalation path ───────────────────────────────────────────────── */}
      <div className={cx("mteSection", "mteSectionLast")}>

        <div className={cx("mteSectionHeader")}>
          <div className={cx("mteSectionTitle")}>Escalation Path</div>
          <span className={cx("mteSectionMeta")}>{`${escalation.length} LEVELS`}</span>
        </div>

        <div className={cx("mteEscalationList")}>
          {escalation.length === 0 ? (
            <div className={cx("mteEscalationRow", "justifyCenter", "opacity55", "py32_0")} >
              No escalation path available
            </div>
          ) : (
            escalation.map((e, idx) => (
              <div
                key={e.level}
                className={cx(
                  "mteEscalationRow",
                  idx === escalation.length - 1 && "mteEscalationRowLast",
                )}
              >
                {/* Level badge */}
                <span className={cx("mteLevelBadge", escalationLevelCls(e.level))}>L{e.level}</span>

                {/* Role + contact */}
                <div className={cx("mteEscalationInfo")}>
                  <span className={cx("mteEscalationRole")}>{e.role}</span>
                  <span className={cx("mteEscalationContact")}>{e.contact}</span>
                </div>

                {/* Method chip */}
                <span className={cx("mteMethodChip", methodCls(e.method))}>{e.method}</span>

              </div>
            ))
          )}
        </div>

      </div>

    </section>
  );
}
