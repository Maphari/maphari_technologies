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
  return u >= 85 ? "colorGreen" : "colorAmber";
}

function peerRatingCls(r: number | null): string {
  if (r === null) return "colorMuted2";
  if (r >= 4.5)   return "colorGreen";
  if (r >= 4.0)   return "colorAmber";
  return "colorRed";
}

function avgTaskTime(hoursThisWeek: number, tasksCompleted: number): string {
  if (tasksCompleted === 0) return "—";
  return `${(Math.round((hoursThisWeek / tasksCompleted) * 10) / 10)}h`;
}

// ── Page component ────────────────────────────────────────────────────────────

export function TeamPerformancePage({ isActive, session }: TeamPerformancePageProps) {
  const [members, setMembers] = useState<StaffTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void getStaffTeamPerformance(session).then((result) => {
      if (cancelled) return;
      if (result.data) setMembers(result.data);
    }).catch((err) => {
      const msg = (err as Error)?.message ?? "Failed to load";
      setError(msg);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const ratedMembers = members.filter((m) => m.peerRating !== null);
  const teamAvgPeerRating = ratedMembers.length > 0
    ? Math.round((ratedMembers.reduce((s, m) => s + (m.peerRating ?? 0), 0) / ratedMembers.length) * 10) / 10
    : null;
  const teamAvgUtil = members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.utilizationPct, 0) / members.length)
    : 0;
  const teamAvgTasks = members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.tasksCompleted, 0) / members.length)
    : 0;

  const sorted = [...members].sort((a, b) => b.utilizationPct - a.utilizationPct);

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

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-team-performance">
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-team-performance">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>Team Performance</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Team benchmarks for this week</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("tpmStatGrid")}>
        <div className={cx("tpmStatCard")}>
          <div className={cx("tpmStatCardTop")}>
            <div className={cx("tpmStatLabel")}>Team Size</div>
            <div className={cx("tpmStatValue", "colorAccent")}>{members.length}</div>
          </div>
          <div className={cx("tpmStatCardDivider")} />
          <div className={cx("tpmStatCardBottom")}>
            <span className={cx("tpmStatDot", "dotBgAccent")} />
            <span className={cx("tpmStatMeta")}>members</span>
          </div>
        </div>

        <div className={cx("tpmStatCard")}>
          <div className={cx("tpmStatCardTop")}>
            <div className={cx("tpmStatLabel")}>Avg Tasks</div>
            <div className={cx("tpmStatValue", "colorAccent")}>{teamAvgTasks}</div>
          </div>
          <div className={cx("tpmStatCardDivider")} />
          <div className={cx("tpmStatCardBottom")}>
            <span className={cx("tpmStatDot", "dotBgAccent")} />
            <span className={cx("tpmStatMeta")}>per member this week</span>
          </div>
        </div>

        <div className={cx("tpmStatCard")}>
          <div className={cx("tpmStatCardTop")}>
            <div className={cx("tpmStatLabel")}>Avg Utilization</div>
            <div className={cx("tpmStatValue", teamAvgUtil >= 85 ? "colorGreen" : "colorAmber")}>
              {teamAvgUtil}%
            </div>
          </div>
          <div className={cx("tpmStatCardDivider")} />
          <div className={cx("tpmStatCardBottom")}>
            <span className={cx("tpmStatDot", "dotBgGreen")} />
            <span className={cx("tpmStatMeta")}>team average</span>
          </div>
        </div>

        <div className={cx("tpmStatCard")}>
          <div className={cx("tpmStatCardTop")}>
            <div className={cx("tpmStatLabel")}>Avg CSAT</div>
            <div className={cx("tpmStatValue", peerRatingCls(teamAvgPeerRating))}>
              {teamAvgPeerRating !== null ? teamAvgPeerRating : "—"}
            </div>
          </div>
          <div className={cx("tpmStatCardDivider")} />
          <div className={cx("tpmStatCardBottom")}>
            <span className={cx("tpmStatDot", "dotBgGreen")} />
            <span className={cx("tpmStatMeta")}>peer rating avg</span>
          </div>
        </div>
      </div>

      {/* ── Member cards ──────────────────────────────────────────────────── */}
      {members.length > 0 && (
        <div className={cx("tpmSection")}>
          <div className={cx("tpmSectionHeader")}>
            <div className={cx("tpmSectionTitle")}>Team Members</div>
            <span className={cx("tpmSectionMeta")}>{members.length} MEMBERS</span>
          </div>

          <div className={cx("tpmMemberList")}>
            {sorted.map((m, idx) => (
              <div
                key={m.id}
                className={cx("tpmMemberRow", idx === sorted.length - 1 && "tpmMemberRowLast")}
              >
                {/* Avatar */}
                <div className={cx("tpmAvatar", avatarCls(m.name))}>
                  {initials(m.name)}
                </div>

                {/* Name + role */}
                <div className={cx("tpmMemberHead")}>
                  <div className={cx("tpmNameRow")}>
                    <span className={cx("tpmMemberName")}>{m.name}</span>
                  </div>
                  <span className={cx("tpmMemberRole")}>{m.role}</span>
                </div>

                {/* Metrics strip */}
                <div className={cx("tpmMetricsStrip")}>
                  <div className={cx("tpmMetricCell")}>
                    <span className={cx("tpmMetricLabel")}>Tasks</span>
                    <span className={cx("tpmMetricValue", "colorAccent")}>{m.tasksCompleted}</span>
                  </div>

                  <div className={cx("tpmMetricSep")} />

                  <div className={cx("tpmMetricCell")}>
                    <span className={cx("tpmMetricLabel")}>Avg Time</span>
                    <span className={cx("tpmMetricValue", "colorMuted2")}>{avgTaskTime(m.hoursThisWeek, m.tasksCompleted)}</span>
                  </div>

                  <div className={cx("tpmMetricSep")} />

                  <div className={cx("tpmMetricCell")}>
                    <span className={cx("tpmMetricLabel")}>Utilization</span>
                    <span className={cx("tpmMetricValue", utilizationCls(m.utilizationPct))}>{m.utilizationPct}%</span>
                  </div>

                  <div className={cx("tpmMetricSep")} />

                  <div className={cx("tpmMetricCell")}>
                    <span className={cx("tpmMetricLabel")}>Dept</span>
                    <span className={cx("tpmMetricValue", "colorMuted2")}>{m.department ?? "—"}</span>
                  </div>

                  <div className={cx("tpmMetricSep")} />

                  <div className={cx("tpmMetricCell")}>
                    <span className={cx("tpmMetricLabel")}>CSAT</span>
                    <span className={cx("tpmMetricValue", peerRatingCls(m.peerRating))}>
                      {m.peerRating !== null
                        ? <>{m.peerRating}<span className={cx("tpmMetricSuffix")}>/5</span></>
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {members.length === 0 && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div>
          <div className={cx("emptyStateTitle")}>No team data available</div>
          <div className={cx("emptyStateSub")}>Team performance metrics will appear here once staff have logged time this week.</div>
        </div>
      )}
    </section>
  );
}
