// ════════════════════════════════════════════════════════════════════════════
// team-performance-page.tsx — Staff Team Performance
// Data : GET /staff/team-performance → StaffTeamMember[]
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { getStaffTeamPerformance, type StaffTeamMember } from "../../../../lib/api/staff/performance";
import type { AuthSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type TeamPerformancePageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Sort types ────────────────────────────────────────────────────────────────

type SortKey = "util" | "name" | "tasks" | "csat";
type SortDir = "asc" | "desc";

const PILL_LABELS: Record<SortKey, string> = {
  util:  "Util",
  name:  "Name",
  tasks: "Tasks",
  csat:  "CSAT",
};

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  util:  "desc",
  name:  "asc",
  tasks: "desc",
  csat:  "desc",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "tpmAvatarAccent",
  "tpmAvatarBlue",
  "tpmAvatarGreen",
  "tpmAvatarAmber",
  "tpmAvatarPurple",
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function avatarCls(name: string): string {
  const hash = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function utilizationCls(u: number): string {
  if (u >= 85) return "colorGreen";
  if (u >= 60) return "colorAmber";
  return "colorRed";
}

function utilizationBgCls(u: number): string {
  if (u >= 85) return "bgGreen";
  if (u >= 60) return "bgAmber";
  return "bgRed";
}

function peerRatingCls(r: number | null): string {
  if (r === null) return "colorMuted2";
  if (r >= 4.5)   return "colorGreen";
  if (r >= 4.0)   return "colorAmber";
  return "colorRed";
}

function avgTaskTime(hoursThisWeek: number, tasksCompleted: number): string {
  if (tasksCompleted === 0) return "—";
  return `${Math.round((hoursThisWeek / tasksCompleted) * 10) / 10}h`;
}

function sortMembers(
  members: StaffTeamMember[],
  key: SortKey,
  dir: SortDir,
): StaffTeamMember[] {
  return [...members].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "util":  cmp = a.utilizationPct - b.utilizationPct; break;
      case "name":  cmp = a.name.localeCompare(b.name);        break;
      case "tasks": cmp = a.tasksCompleted - b.tasksCompleted; break;
      case "csat":  cmp = (a.peerRating ?? -1) - (b.peerRating ?? -1); break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

// ── Page component ────────────────────────────────────────────────────────────

export function TeamPerformancePage({ isActive, session }: TeamPerformancePageProps) {
  const [members,    setMembers]    = useState<StaffTeamMember[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sortKey,    setSortKey]    = useState<SortKey>("util");
  const [sortDir,    setSortDir]    = useState<SortDir>("desc");

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void getStaffTeamPerformance(session).then((result) => {
      if (cancelled) return;
      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (result.data) setMembers(result.data);
    }).catch((err) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive, retryCount]);

  function handlePillClick(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(DEFAULT_DIR[key]);
    }
  }

  // ── Derived data ────────────────────────────────────────────────────────────
  const ratedMembers      = members.filter((m) => m.peerRating !== null);
  const teamAvgPeerRating = ratedMembers.length > 0
    ? Math.round((ratedMembers.reduce((s, m) => s + (m.peerRating ?? 0), 0) / ratedMembers.length) * 10) / 10
    : null;
  const teamAvgUtil  = members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.utilizationPct, 0) / members.length)
    : 0;
  const teamAvgTasks = members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.tasksCompleted, 0) / members.length)
    : 0;

  const sorted = sortMembers(members, sortKey, sortDir);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-team-performance">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-team-performance">
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
          <button
            className={cx("emptyStateAction")}
            onClick={() => setRetryCount((c) => c + 1)}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-team-performance">
      {/* Page header */}
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>Team Performance</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Team benchmarks for this week</p>
      </div>

      {/* KPI stat grid */}
      <div className={cx("tpmStatGrid")}>
        <div className={cx("tpmStatCard")}>
          <div className={cx("tpmStatCardTop", "colorAccent")}>{members.length}</div>
          <div className={cx("tpmStatCardDivider")} />
          <div className={cx("tpmStatCardBottom")}>Team Size</div>
        </div>
        <div className={cx("tpmStatCard")}>
          <div className={cx("tpmStatCardTop", "colorAccent")}>{teamAvgTasks}</div>
          <div className={cx("tpmStatCardDivider")} />
          <div className={cx("tpmStatCardBottom")}>Avg Tasks / Member</div>
        </div>
        <div className={cx("tpmStatCard")}>
          <div className={cx("tpmStatCardTop", utilizationCls(teamAvgUtil))}>{teamAvgUtil}%</div>
          <div className={cx("tpmStatCardDivider")} />
          <div className={cx("tpmStatCardBottom")}>Avg Utilization</div>
        </div>
        <div className={cx("tpmStatCard")}>
          <div className={cx("tpmStatCardTop", peerRatingCls(teamAvgPeerRating))}>
            {teamAvgPeerRating !== null ? teamAvgPeerRating : "—"}
          </div>
          <div className={cx("tpmStatCardDivider")} />
          <div className={cx("tpmStatCardBottom")}>Avg CSAT</div>
        </div>
      </div>

      {/* Member table */}
      {members.length > 0 && (
        <div className={cx("tpmSection")}>
          {/* Section header + sort pills */}
          <div className={cx("tpmSectionHeader")}>
            <div className={cx("tpmSectionTitle")}>Team Members</div>
            <div className={cx("tpmSortPills")}>
              {(["util", "name", "tasks", "csat"] as SortKey[]).map((key) => {
                const active = sortKey === key;
                const arrow  = active ? (sortDir === "desc" ? " ↓" : " ↑") : "";
                return (
                  <button
                    key={key}
                    className={cx(active ? "tpmSortPillActive" : "tpmSortPill")}
                    onClick={() => handlePillClick(key)}
                  >
                    {PILL_LABELS[key]}{arrow}
                  </button>
                );
              })}
            </div>
          </div>

          <table className={cx("staffTable")}>
            <thead>
              <tr>
                <th>Member</th>
                <th className="numCol">Tasks</th>
                <th className="numCol">Avg Time</th>
                <th className="numCol">Utilization</th>
                <th>Dept</th>
                <th className="numCol">CSAT</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.id} className={m.isSelf ? cx("tpmSelfRow") : undefined}>
                  <td>
                    <div className={cx("tpmMemberHead")}>
                      <div className={cx("tpmAvatar", avatarCls(m.name))}>{initials(m.name)}</div>
                      <div>
                        <div className={cx("tpmMemberName")}>
                          {m.name}
                          {m.isSelf && <span className={cx("tpmSelfBadge")}>you</span>}
                        </div>
                        <div className={cx("tpmMemberRole")}>{m.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="numCol">
                    <span className={cx("colorAccent")}>{m.tasksCompleted}</span>
                  </td>
                  <td className="numCol">
                    <span className={cx("colorMuted2")}>{avgTaskTime(m.hoursThisWeek, m.tasksCompleted)}</span>
                  </td>
                  <td className="numCol">
                    <div className={cx("tpmUtilCell")}>
                      <div className={cx("tpmUtilTrack")}>
                        <div
                          className={cx("tpmUtilFill", utilizationBgCls(m.utilizationPct))}
                          style={{ width: `${Math.min(100, m.utilizationPct)}%` }}
                        />
                      </div>
                      <span className={cx(utilizationCls(m.utilizationPct))}>{m.utilizationPct}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={cx("colorMuted2")}>{m.department ?? "—"}</span>
                  </td>
                  <td className="numCol">
                    <span className={cx(peerRatingCls(m.peerRating))}>
                      {m.peerRating !== null
                        ? <>{m.peerRating}<span style={{ opacity: 0.5, fontSize: "0.8em" }}>/5</span></>
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {members.length === 0 && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div className={cx("emptyStateTitle")}>No team data available</div>
          <div className={cx("emptyStateSub")}>
            Team performance metrics will appear here once staff have logged time this week.
          </div>
        </div>
      )}
    </section>
  );
}
