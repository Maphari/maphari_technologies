// ════════════════════════════════════════════════════════════════════════════
// team-structure-page.tsx — Admin team structure wired to real API
// Data   : loadAllStaffWithRefresh → staff list with department/role info
//          Grouped by department; org chart built from real staff data.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminStaffProfile } from "../../../../lib/api/admin/hr";
import { loadAllStaffWithRefresh } from "../../../../lib/api/admin/hr";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEPT_COLORS: Record<string, string> = {
  Leadership:      "var(--accent)",
  Operations:      "var(--blue)",
  Design:          "var(--amber)",
  "Client Success":"var(--purple)",
  Content:         "var(--amber)",
  Engineering:     "var(--blue)",
  Marketing:       "var(--purple)",
  Finance:         "var(--accent)",
};

function deptColor(dept: string | null): string {
  if (!dept) return "var(--muted)";
  return DEPT_COLORS[dept] ?? "var(--accent)";
}

function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <div className={cx("fontMono", "flexCenter", "noShrink", "fw700", styles.teamAvatar, toneClass(color), size === 36 ? "teamAvatar36" : "teamAvatar40")}>
      {initials}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
  onNavigate?: (page: string) => void;
}

const tabs = ["org chart", "departments", "roles & permissions"] as const;
type Tab = (typeof tabs)[number];

// ── Component ─────────────────────────────────────────────────────────────────

export function TeamStructurePage({ session, onNotify, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("org chart");
  const [staff, setStaff] = useState<AdminStaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const r = await loadAllStaffWithRefresh(session);
        if (cancelled) return;
        if (r.nextSession) saveSession(r.nextSession);
        if (r.error) { setError(r.error.message ?? "Failed to load."); return; }
        setStaff((r.data ?? []).filter((s) => s.isActive));
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  // Group staff by department
  const departments = useMemo(() => {
    const map: Record<string, AdminStaffProfile[]> = {};
    for (const s of staff) {
      const dept = s.department ?? "Unassigned";
      if (!map[dept]) map[dept] = [];
      map[dept].push(s);
    }
    return Object.entries(map).map(([name, members]) => ({
      name,
      members,
      headcount: members.length,
      color: deptColor(name),
      monthlyCents: members.reduce((s, m) => s + (m.grossSalaryCents ?? 0), 0),
    }));
  }, [staff]);

  // Unique roles
  const roles = useMemo(() => {
    const map: Record<string, { role: string; department: string; count: number }> = {};
    for (const s of staff) {
      const key = s.role;
      if (!map[key]) map[key] = { role: s.role, department: s.department ?? "Unassigned", count: 0 };
      map[key].count++;
    }
    return Object.values(map);
  }, [staff]);

  const totalHeadcount = staff.length;
  const totalPayrollCents = useMemo(() => staff.reduce((s, m) => s + (m.grossSalaryCents ?? 0), 0), [staff]);

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
    <div className={cx(styles.pageBody, styles.teamRoot)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / ORGANIZATIONAL STRUCTURE</div>
          <h1 className={styles.pageTitle}>Team Structure</h1>
          <div className={styles.pageSub}>Org chart &middot; Departments &middot; Roles</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Org Chart</button>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => onNavigate?.("recruitmentPipeline")}>+ Add Staff</button>
        </div>
      </div>

      {/* ── KPI grid ── */}
      <div className={styles.teamKpiGrid}>
        {[
          { label: "Total Headcount",  value: String(totalHeadcount),             color: "var(--accent)", sub: "Active staff" },
          { label: "Departments",      value: String(departments.length),          color: "var(--blue)",   sub: "Active teams" },
          { label: "Monthly Payroll",  value: `R${(totalPayrollCents / 100_000).toFixed(0)}k`, color: "var(--red)", sub: "Salaries only" },
          { label: "Unique Roles",     value: String(roles.length),               color: "var(--amber)",  sub: "Across all depts" }
        ].map((s) => (
          <div key={s.label} className={cx(styles.teamKpiCard, toneClass(s.color))}>
            <div className={styles.teamKpiLabel}>{s.label}</div>
            <div className={cx(styles.teamKpiValue, toneClass(s.color))}>{s.value}</div>
            <div className={styles.teamKpiMeta}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filter toolbar ── */}
      <div className={styles.teamFilters}>
        <select title="View" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* ── Org chart tab ── */}
      {activeTab === "org chart" ? (
        <div className={styles.teamSection}>
          <div className={styles.teamSectionHeader}>
            <span className={styles.teamSectionTitle}>All Staff</span>
            <span className={styles.teamSectionMeta}>{totalHeadcount} PEOPLE</span>
          </div>
          {staff.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.emptyTitle}>No active staff yet</div>
              <div className={styles.emptySub}>Add team members via the Recruitment Pipeline to populate the org chart and department structure.</div>
            </div>
          )}
          <div className={cx("flexRow", "flexWrap", "gap16", "p20")}>
            {staff.map((s) => {
              const color = deptColor(s.department);
              const initials = s.avatarInitials ?? s.name.slice(0, 2).toUpperCase();
              return (
                <div key={s.id} className={cx(styles.card, styles.teamOrgCard, toneClass(color))}>
                  <div className={styles.cardInner}>
                    <Avatar initials={initials} color={color} size={36} />
                    <div className={cx("fw700", "text13", "mt8")}>{s.name}</div>
                    <div className={cx("text11", "colorMuted", "mt4")}>{s.role}</div>
                    <div className={cx("text10", "fontMono", "mt4", styles.teamToneText, toneClass(color))}>{s.department ?? "—"}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Department legend */}
          <div className={cx("flexRow", "gap20", "flexWrap", "mt32", "px20", styles.teamDeptLegend)}>
            {departments.map((d) => (
              <div key={d.name} className={cx("flexRow", "gap6", "text12")}>
                <div className={cx(styles.teamDot, toneClass(d.color))} />
                <span className={cx("colorMuted")}>{d.name}</span>
                <span className={cx("fontMono", styles.teamToneText, toneClass(d.color))}>({d.headcount})</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Departments tab ── */}
      {activeTab === "departments" ? (
        <div className={cx("grid3")}>
          {departments.map((d) => (
            <div key={d.name} className={cx(styles.card, styles.teamDeptCard, toneClass(d.color))}>
              <div className={styles.cardInner}>
                <div className={cx("flexBetween", "mb16")}>
                  <div>
                    <div className={cx("fw700", "mb4", styles.teamTitle16, styles.teamToneText, toneClass(d.color))}>{d.name}</div>
                    <div className={cx("text12", "colorMuted")}>
                      {d.headcount} staff member{d.headcount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <div className={cx("grid2", "gap12")}>
                  <div className={cx("bgBg", "p12", styles.teamRounded8)}>
                    <div className={cx("text10", "colorMuted", "mb4")}>Monthly Budget</div>
                    <div className={cx("fontMono", "fw700", "colorRed")}>
                      {d.monthlyCents > 0 ? `R${(d.monthlyCents / 100).toLocaleString()}` : "—"}
                    </div>
                  </div>
                  <div className={cx("bgBg", "p12", styles.teamRounded8)}>
                    <div className={cx("text10", "colorMuted", "mb4")}>Cost per Head</div>
                    <div className={cx("fontMono", "fw700")}>
                      {d.headcount > 0 && d.monthlyCents > 0 ? `R${Math.round(d.monthlyCents / d.headcount / 100).toLocaleString()}` : "—"}
                    </div>
                  </div>
                </div>
                {/* Staff list */}
                <div className={cx("flexCol", "gap8", "mt16")}>
                  {d.members.map((m) => (
                    <div key={m.id} className={cx("flexRow", "gap8", "text12")}>
                      <div className={cx(styles.teamDot, toneClass(d.color))} />
                      <span className={cx("fw600")}>{m.name}</span>
                      <span className={cx("colorMuted")}>{m.role}</span>
                    </div>
                  ))}
                </div>
                <div className={cx("flexRow", "gap8", "mt16")}>
                  <button type="button" className={cx("btnSm", "btnGhost", styles.teamFlex1)}>View Team</button>
                </div>
              </div>
            </div>
          ))}
          {departments.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.emptyTitle}>No departments found</div>
              <div className={styles.emptySub}>Departments are created automatically as staff members are added with department assignments.</div>
            </div>
          )}
          <div className={cx("flexCenter", "colorMuted", "text13", "pointerCursor", styles.teamAddCard)}>
            + Add Department
          </div>
        </div>
      ) : null}

      {/* ── Roles & permissions tab ── */}
      {activeTab === "roles & permissions" ? (
        <div className={styles.teamSection}>
          <div className={styles.teamSectionHeader}>
            <span className={styles.teamSectionTitle}>Roles</span>
            <span className={styles.teamSectionMeta}>{roles.length} ROLES</span>
          </div>
          <div className={styles.teamRolesHead}>
            {["Role Title", "Department", "Headcount", "Contract"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {roles.map((r) => {
            const members = staff.filter((s) => s.role === r.role);
            const contractType = members[0]?.contractType ?? "—";
            return (
              <div key={r.role} className={cx(styles.teamRolesRow, styles.teamRolesRowPad)}>
                <span className={cx("fw600", "text13")}>{r.role}</span>
                <span className={cx("text12", "colorMuted")}>{r.department}</span>
                <span className={cx("fontMono", "colorMuted")}>{r.count}</span>
                <span className={cx("badge", "badgeMuted")}>{contractType}</span>
              </div>
            );
          })}
          {roles.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className={styles.emptyTitle}>No roles found</div>
              <div className={styles.emptySub}>Roles are derived from active staff profiles. Add team members with assigned roles to populate this list.</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
