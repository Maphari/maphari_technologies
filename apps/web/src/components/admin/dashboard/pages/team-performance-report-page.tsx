// ════════════════════════════════════════════════════════════════════════════
// team-performance-report-page.tsx — Admin Team Performance Report
// Data     : loadAllStaffWithRefresh      → GET /staff
//            loadStandupFeedWithRefresh   → GET /standup/feed
//            loadAdminPeerReviewsWithRefresh → GET /peer-reviews
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import { AdminTabs } from "./shared";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAllStaffWithRefresh,
  loadStandupFeedWithRefresh,
  loadAdminPeerReviewsWithRefresh,
  type AdminStaffProfile,
  type AdminStandupEntry,
  type AdminPeerReview,
} from "../../../../lib/api/admin";

// ── Types ─────────────────────────────────────────────────────────────────────
type StaffMember = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  department: string;
  isActive: boolean;
  standupCount: number;
  reviewScore: number | null;
  reviewCount: number;
};

const tabs = ["team overview", "individual profiles", "utilisation", "tasks & output"] as const;
type Tab = (typeof tabs)[number];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toneVarClass(value: string): string {
  if (value === "var(--red)") return styles.tprToneRed;
  if (value === "var(--blue)") return styles.tprToneBlue;
  if (value === "var(--amber)") return styles.tprToneAmber;
  if (value === "var(--purple)") return styles.tprTonePurple;
  if (value === "var(--muted)") return styles.tprToneMuted;
  if (value === "var(--border)") return styles.tprToneBorder;
  return styles.tprToneAccent;
}

function fillClass(value: string): string {
  if (value === "var(--red)") return styles.tprFillRed;
  if (value === "var(--blue)") return styles.tprFillBlue;
  if (value === "var(--amber)") return styles.tprFillAmber;
  if (value === "var(--purple)") return styles.tprFillPurple;
  if (value === "var(--muted)") return styles.tprFillMuted;
  return styles.tprFillAccent;
}

function mapStaff(
  profile: AdminStaffProfile,
  standups: AdminStandupEntry[],
  reviews: AdminPeerReview[]
): StaffMember {
  const initials =
    profile.avatarInitials ??
    profile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const color = profile.avatarColor ?? "var(--accent)";
  const memberStandups = standups.filter((s) => s.staffId === profile.id);
  const memberReviews = reviews.filter(
    (r) => r.revieweeId === profile.userId && r.status === "SUBMITTED" && r.score !== null
  );
  const avgReviewScore =
    memberReviews.length > 0
      ? memberReviews.reduce((sum, r) => sum + (r.score ?? 0), 0) / memberReviews.length
      : null;
  return {
    id: profile.id.slice(0, 8).toUpperCase(),
    name: profile.name,
    role: profile.role,
    avatar: initials,
    color,
    department: profile.department ?? "—",
    isActive: profile.isActive,
    standupCount: memberStandups.length,
    reviewScore: avgReviewScore !== null ? Math.round(avgReviewScore * 10) / 10 : null,
    reviewCount: memberReviews.length,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  const sizeClass =
    size === 24
      ? "tprAvatar24"
      : size === 26
        ? "tprAvatar26"
        : size === 30
          ? "tprAvatar30"
          : size === 52
            ? "tprAvatar52"
            : "tprAvatar32";
  return (
    <div className={cx(styles.tprAvatar, toneVarClass(color), sizeClass)}>
      {initials}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TeamPerformanceReportPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error", msg: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("team overview");
  const [apiStaff, setApiStaff] = useState<AdminStaffProfile[]>([]);
  const [apiStandups, setApiStandups] = useState<AdminStandupEntry[]>([]);
  const [apiReviews, setApiReviews] = useState<AdminPeerReview[]>([]);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    Promise.all([
      loadAllStaffWithRefresh(session),
      loadStandupFeedWithRefresh(session),
      loadAdminPeerReviewsWithRefresh(session),
    ]).then(([sr, standup, reviews]) => {
      if (sr.nextSession) saveSession(sr.nextSession);
      if (standup.nextSession) saveSession(standup.nextSession);
      if (reviews.nextSession) saveSession(reviews.nextSession);
      if (sr.error) onNotify("error", sr.error.message);
      if (!sr.error && sr.data) setApiStaff(sr.data);
      if (!standup.error && standup.data) setApiStandups(standup.data);
      if (!reviews.error && reviews.data) setApiReviews(reviews.data);
      setLoading(false);
    });
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const staff = useMemo<StaffMember[]>(
    () => apiStaff.filter((s) => s.isActive).map((s) => mapStaff(s, apiStandups, apiReviews)),
    [apiStaff, apiStandups, apiReviews]
  );

  useEffect(() => {
    if (staff.length > 0 && selected === null) setSelected(staff[0]);
  }, [staff, selected]);

  const activeCount = staff.length;
  const deptSet = new Set(apiStaff.map((s) => s.department ?? "Unknown"));
  const deptCount = deptSet.size;
  const avgReview = useMemo(() => {
    const scored = staff.filter((m) => m.reviewScore !== null);
    if (scored.length === 0) return null;
    return (scored.reduce((s, m) => s + (m.reviewScore ?? 0), 0) / scored.length).toFixed(1);
  }, [staff]);
  const lowEngagement = staff.filter((m) => m.standupCount === 0).length;

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / REPORTING & INTELLIGENCE</div>
          <h1 className={styles.pageTitle}>Team Performance Report</h1>
          <div className={styles.pageSub}>Active Staff · Departments · Peer Reviews · Standup Activity</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Report</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          { label: "Active Staff", value: activeCount.toString(), color: "var(--accent)", sub: "Currently active" },
          { label: "Avg Peer Score", value: avgReview ? `${avgReview}/5` : "—", color: avgReview && Number.parseFloat(avgReview) >= 4 ? "var(--accent)" : "var(--amber)", sub: "From submitted reviews" },
          { label: "Departments", value: deptCount.toString(), color: "var(--blue)", sub: "Distinct departments" },
          { label: "Low Engagement", value: lowEngagement.toString(), color: lowEngagement > 0 ? "var(--amber)" : "var(--accent)", sub: "No standup activity" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor="var(--accent)"
        mutedColor="var(--muted)"
        panelColor="var(--surface)"
        borderColor="var(--border)"
      />

      <div className={cx("overflowAuto", "minH0")}>
        {loading ? (
          <div className={cx("colorMuted", "text13", "py32", "textCenter")}>
            Loading team data…
          </div>
        ) : null}

        {!loading && activeTab === "team overview" ? (
          <div className={styles.tprList10}>
            {staff.length === 0 ? (
              <div className={cx("colorMuted", "text13", "py24", "textCenter")}>No active staff found.</div>
            ) : null}
            {[...staff].sort((a, b) => b.standupCount - a.standupCount).map((member) => {
              const scoreColor = member.reviewScore
                ? member.reviewScore >= 4.5 ? "var(--accent)" : member.reviewScore >= 3.5 ? "var(--blue)" : "var(--amber)"
                : "var(--muted)";
              const engagementColor = member.standupCount > 10 ? "var(--accent)" : member.standupCount > 4 ? "var(--blue)" : member.standupCount > 0 ? "var(--amber)" : "var(--red)";
              const engagementPct = Math.min((member.standupCount / 20) * 100, 100);
              return (
                <div
                  key={member.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setSelected(member); setActiveTab("individual profiles"); }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(member);
                      setActiveTab("individual profiles");
                    }
                  }}
                  className={cx(styles.tprOverviewRow, member.standupCount === 0 ? styles.tprToneAmber : styles.tprToneBorder)}
                >
                  <div className={styles.tprNameCol}>
                    <Avatar initials={member.avatar} color={member.color} size={30} />
                    <div>
                      <div className={styles.tprName}>{member.name.split(" ")[0]}</div>
                      <div className={styles.tprRole}>{member.role}</div>
                    </div>
                  </div>
                  <div>
                    <div className={styles.tprBarHead}>
                      <span className={styles.tprMini}>{member.standupCount} standups logged</span>
                      <span className={cx(styles.tprMono11, colorClass(engagementColor))}>{Math.round(engagementPct)}%</span>
                    </div>
                    <progress className={cx(styles.tprTrack6, fillClass(engagementColor))} max={100} value={engagementPct} aria-label={`${member.name} standup engagement`} />
                  </div>
                  <div className={styles.tprKpiCol}><div className={styles.tprMini}>Score</div><div className={cx(styles.tprMono700, colorClass(scoreColor))}>{member.reviewScore ?? "—"}</div></div>
                  <div className={styles.tprKpiCol}><div className={styles.tprMini}>Reviews</div><div className={cx("fontMono", "colorBlue")}>{member.reviewCount}</div></div>
                  <div className={styles.tprKpiCol}><div className={styles.tprMini}>Dept</div><div className={cx("text11", "colorMuted")}>{member.department.split(" ")[0]}</div></div>
                  <span className={styles.tprChevron}>▶</span>
                </div>
              );
            })}
          </div>
        ) : null}

        {!loading && activeTab === "individual profiles" && selected ? (
          <div className={styles.tprProfileSplit}>
            <div className={styles.tprProfileNav}>
              {staff.map((m) => (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(m)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(m);
                    }
                  }}
                  className={cx(styles.tprProfileNavItem, toneVarClass(m.color), selected.id === m.id && styles.tprProfileNavItemActive)}
                >
                  <Avatar initials={m.avatar} color={m.color} size={24} />
                  <div>
                    <div className={styles.tprProfileNavName}>{m.name.split(" ")[0]}</div>
                    <div className={cx("fontMono", "text11", m.standupCount > 0 ? "colorAccent" : "colorAmber")}>{m.standupCount}s</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={cx(styles.tprProfileCard, toneVarClass(selected.color))}>
              <div className={styles.tprProfileHead}>
                <Avatar initials={selected.avatar} color={selected.color} size={52} />
                <div>
                  <div className={styles.tprProfileName}>{selected.name}</div>
                  <div className={styles.tprProfileRole}>{selected.role}</div>
                </div>
                {selected.reviewScore !== null ? (
                  <div className={styles.tprPerfBox}>
                    <div className={cx(styles.tprPerfValue, selected.reviewScore >= 4 ? "colorAccent" : "colorAmber")}>{selected.reviewScore}</div>
                    <div className={styles.tprMini}>Avg Peer Score / 5</div>
                  </div>
                ) : null}
              </div>

              <div className={styles.tprMetricGrid}>
                {[
                  { label: "Department", value: selected.department, color: "var(--blue)" },
                  { label: "Standup Count", value: `${selected.standupCount}`, color: selected.standupCount > 0 ? "var(--accent)" : "var(--amber)" },
                  { label: "Peer Reviews", value: `${selected.reviewCount}`, color: "var(--blue)" },
                  { label: "Avg Peer Score", value: selected.reviewScore !== null ? `${selected.reviewScore}/5` : "N/A", color: selected.reviewScore !== null ? (selected.reviewScore >= 4 ? "var(--accent)" : "var(--amber)") : "var(--muted)" },
                  { label: "Status", value: selected.isActive ? "Active" : "Inactive", color: selected.isActive ? "var(--accent)" : "var(--red)" },
                  { label: "Staff ID", value: selected.id, color: "var(--muted)" },
                ].map((m) => (
                  <div key={m.label} className={styles.tprMetricTile}>
                    <div className={cx(styles.tprMetricValue, colorClass(m.color))}>{m.value}</div>
                    <div className={styles.tprMetricLabel}>{m.label}</div>
                  </div>
                ))}
              </div>

              <div className={styles.tprActionRow}>
                <button type="button" className={cx("btnSm", "btnAccent")}>View Full Record</button>
                <button type="button" className={cx("btnSm", "btnGhost")}>Schedule Review</button>
              </div>
            </div>
          </div>
        ) : null}

        {!loading && activeTab === "utilisation" ? (
          <div className={styles.tprList14}>
            <div className={styles.tprUtilCard}>
              <div className={styles.tprSecTitle}>Team Standup Engagement</div>
              {[...staff].sort((a, b) => b.standupCount - a.standupCount).map((m) => {
                const pct = Math.min((m.standupCount / 20) * 100, 100);
                const color = pct >= 75 ? "var(--accent)" : pct >= 40 ? "var(--blue)" : pct > 0 ? "var(--amber)" : "var(--red)";
                return (
                  <div key={m.id} className={styles.tprUtilRow}>
                    <Avatar initials={m.avatar} color={m.color} size={26} />
                    <span className={styles.tprUtilName}>{m.name.split(" ")[0]}</span>
                    <div className={styles.tprUtilTrackWrap}>
                      <progress className={cx(styles.tprUtilFill, fillClass(color))} max={100} value={pct} aria-label={`${m.name} standup engagement`} />
                      <span className={styles.tprUtilFillLabel}>{m.standupCount} standups</span>
                    </div>
                    <span className={cx(styles.tprUtilPct, colorClass(color))}>{Math.round(pct)}%</span>
                    {m.standupCount === 0 ? <span className={styles.tprLowTag}>Low</span> : null}
                  </div>
                );
              })}
              <div className={styles.tprUtilFoot}>
                Active staff: {activeCount} | Depts: {deptCount}
              </div>
            </div>

            <div className={styles.tprUtilCard}>
              <div className={styles.tprSecTitle}>Department Breakdown</div>
              {Array.from(deptSet).map((dept) => {
                const count = apiStaff.filter((s) => (s.department ?? "Unknown") === dept && s.isActive).length;
                const pct = Math.round((count / Math.max(activeCount, 1)) * 100);
                return (
                  <div key={dept} className={styles.tprUtilRow}>
                    <span className={styles.tprUtilName}>{dept}</span>
                    <div className={styles.tprUtilTrackWrap}>
                      <progress className={cx(styles.tprUtilFill, fillClass("var(--blue)"))} max={100} value={pct} aria-label={`${dept} headcount`} />
                    </div>
                    <span className={cx(styles.tprUtilPct, "colorBlue")}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {!loading && activeTab === "tasks & output" ? (
          <div className={styles.tprTableCard}>
            <div className={styles.tprOutputHead}>
              {["Employee", "Department", "Standups", "Peer Reviews", "Avg Score", "Status"].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
            {staff.length === 0 ? (
              <div className={cx("colorMuted", "text13", "py24", "textCenter")}>No active staff found.</div>
            ) : null}
            {[...staff].sort((a, b) => b.standupCount - a.standupCount).map((m, i) => (
              <div key={m.id} className={cx(styles.tprOutputRow, i < staff.length - 1 && "borderB")}>
                <div className={styles.tprEmpCell}>
                  <Avatar initials={m.avatar} color={m.color} size={26} />
                  <div>
                    <div className={styles.tprEmpName}>{m.name.split(" ")[0]}</div>
                    <div className={styles.tprEmpRole}>{m.role}</div>
                  </div>
                </div>
                <span className={cx("text12", "colorMuted")}>{m.department}</span>
                <span className={cx(styles.tprOutputDone, m.standupCount === 0 ? "colorRed" : "colorAccent")}>{m.standupCount}</span>
                <span className={cx(styles.tprOutputOverdue, "colorBlue")}>{m.reviewCount}</span>
                <span className={cx(styles.tprOutputPct, m.reviewScore !== null ? (m.reviewScore >= 4 ? "colorAccent" : "colorAmber") : "colorMuted")}>
                  {m.reviewScore !== null ? `${m.reviewScore}/5` : "—"}
                </span>
                <span className={cx("text11", m.isActive ? "colorAccent" : "colorRed")}>{m.isActive ? "Active" : "Inactive"}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
