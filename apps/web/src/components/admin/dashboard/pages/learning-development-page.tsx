// ════════════════════════════════════════════════════════════════════════════
// learning-development-page.tsx — Admin Learning & Development
// Data     : loadAllTrainingWithRefresh → GET /training
//            loadAllStaffWithRefresh    → GET /staff
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import { StatWidget, PipelineWidget, WidgetGrid } from "../widgets";
import { AdminTabs } from "./shared";
import type { AuthSession } from "../../../../lib/auth/session";
import { loadAllTrainingWithRefresh, loadAllStaffWithRefresh, type AdminTrainingRecord, type AdminStaffProfile } from "../../../../lib/api/admin";
import { loadLearningBudgetsWithRefresh, loadSkillProficiencyWithRefresh, type AdminLearningBudget, type AdminSkillProficiency } from "../../../../lib/api/admin/hr";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────
type CourseStatus = "complete" | "in-progress" | "planned" | "upcoming";
type CourseType = "Course" | "Short Course" | "Conference" | "Mentorship" | "Workshop";

type Course = {
  name: string;
  type: CourseType;
  status: CourseStatus;
  cost: number;
  date: string;
  hours: number;
  provider: string;
};

type StaffMember = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  ldBudget: number;
  ldSpent: number;
  courses: Course[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusConfig: Record<CourseStatus, { color: string; label: string }> = {
  complete: { color: "var(--accent)", label: "Complete" },
  "in-progress": { color: "var(--blue)", label: "In Progress" },
  planned: { color: "var(--muted)", label: "Planned" },
  upcoming: { color: "var(--accent)", label: "Upcoming" }
};

const typeColors: Record<CourseType, string> = {
  Course: "var(--blue)",
  "Short Course": "var(--accent)",
  Conference: "var(--accent)",
  Mentorship: "var(--amber)",
  Workshop: "var(--amber)"
};

const skills = ["Brand Strategy", "Visual Design", "UX / Product", "Motion Design", "Copywriting", "Account Management", "Operations", "Leadership"] as const;
type Skill = (typeof skills)[number];

const tabs = ["by staff", "all courses", "budget", "skills matrix"] as const;
type Tab = (typeof tabs)[number];

function mapApiStatus(status: string): CourseStatus {
  const s = status.toUpperCase();
  if (s === "COMPLETED") return "complete";
  if (s === "IN_PROGRESS" || s === "IN-PROGRESS") return "in-progress";
  if (s === "UPCOMING") return "upcoming";
  return "planned";
}

function mapApiCourse(t: AdminTrainingRecord): Course {
  const validTypes: CourseType[] = ["Course", "Short Course", "Conference", "Mentorship", "Workshop"];
  const courseType: CourseType = validTypes.includes(t.category as CourseType) ? (t.category as CourseType) : "Course";
  const dateStr = t.completedAt
    ? new Date(t.completedAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })
    : new Date(t.createdAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
  return {
    name: t.courseName,
    type: courseType,
    status: mapApiStatus(t.status),
    cost: 0,
    date: dateStr,
    hours: 0,
    provider: t.provider ?? "—",
  };
}

function buildStaffMembers(staff: AdminStaffProfile[], training: AdminTrainingRecord[], budgets: AdminLearningBudget[]): StaffMember[] {
  const budgetByStaffId = new Map(budgets.map((b) => [b.staffId, b]));
  return staff.map((s) => {
    const initials = s.avatarInitials ?? s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    const color = s.avatarColor ?? "var(--accent)";
    const staffCourses = training.filter((t) => t.staffId === s.id).map(mapApiCourse);
    const budget = budgetByStaffId.get(s.id);
    return {
      id: s.id,
      name: s.name,
      role: s.role,
      avatar: initials,
      color,
      ldBudget: budget?.budgetZAR ?? 0,
      ldSpent: budget?.spentZAR ?? 0,
      courses: staffCourses,
    };
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size === 22 ? "lndAvatar22" : size === 28 ? "lndAvatar28" : "lndAvatar32";
  return (
    <div className={cx(styles.lndAvatar, toneVarClass(color), sizeClass)}>
      {initials}
    </div>
  );
}

function toneVarClass(color: string): string {
  switch (color) {
    case "var(--accent)": return styles.lndToneAccent;
    case "var(--red)": return styles.lndToneRed;
    case "var(--amber)": return styles.lndToneAmber;
    case "var(--blue)": return styles.lndToneBlue;
    case "var(--purple)": return styles.lndTonePurple;
    default: return styles.lndToneMuted;
  }
}

function fillClass(color: string): string {
  switch (color) {
    case "var(--accent)": return styles.lndFillAccent;
    case "var(--amber)": return styles.lndFillAmber;
    case "var(--blue)": return styles.lndFillBlue;
    default: return styles.lndFillMuted;
  }
}

function planFillClass(color: string): string {
  switch (color) {
    case "var(--accent)": return styles.lndPlanFillAccent;
    case "var(--amber)": return styles.lndPlanFillAmber;
    case "var(--blue)": return styles.lndPlanFillBlue;
    default: return styles.lndPlanFillMuted;
  }
}

function skillToneClass(level: number): string {
  if (level <= 0) return styles.lndSkillTone0;
  if (level === 1) return styles.lndSkillTone1;
  if (level === 2) return styles.lndSkillTone2;
  if (level === 3) return styles.lndSkillTone3;
  if (level === 4) return styles.lndSkillTone4;
  return styles.lndSkillTone5;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function LearningDevelopmentPage({ session }: { session: AuthSession | null }) {
  const [activeTab, setActiveTab] = useState<Tab>("by staff");
  const [expanded, setExpanded] = useState<string>("");
  const [apiStaff, setApiStaff] = useState<AdminStaffProfile[]>([]);
  const [apiTraining, setApiTraining] = useState<AdminTrainingRecord[]>([]);
  const [apiBudgets, setApiBudgets] = useState<AdminLearningBudget[]>([]);
  const [apiSkills, setApiSkills] = useState<AdminSkillProficiency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void Promise.all([
      loadAllStaffWithRefresh(session),
      loadAllTrainingWithRefresh(session),
      loadLearningBudgetsWithRefresh(session),
      loadSkillProficiencyWithRefresh(session),
    ]).then(([sr, tr, br, skillr]) => {
      if (sr.nextSession) saveSession(sr.nextSession);
      else if (tr.nextSession) saveSession(tr.nextSession);
      else if (br.nextSession) saveSession(br.nextSession);
      if (sr.error) setError(sr.error.message ?? "Failed to load.");
      else if (sr.data) {
        setApiStaff(sr.data);
        setExpanded(sr.data[0]?.id ?? "");
      }
      if (!tr.error && tr.data) setApiTraining(tr.data);
      if (!br.error && br.data) setApiBudgets(br.data);
      if (!skillr.error && skillr.data) setApiSkills(skillr.data);
      setLoading(false);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load.");
      setLoading(false);
    });
  }, [session]);

  const staff = useMemo<StaffMember[]>(
    () => buildStaffMembers(apiStaff, apiTraining, apiBudgets),
    [apiStaff, apiTraining, apiBudgets]
  );

  const totalBudget = staff.reduce((s, m) => s + m.ldBudget, 0);
  const totalSpent = staff.reduce((s, m) => s + m.ldSpent, 0);
  const allCourses = useMemo(
    () => staff.flatMap((m) => m.courses.map((c) => ({ ...c, staffName: m.name, staffColor: m.color, staffAvatar: m.avatar }))),
    [staff]
  );
  const inProgress = allCourses.filter((c) => c.status === "in-progress").length;
  const completed = allCourses.filter((c) => c.status === "complete").length;

  // Build skill map from API proficiency data, falling back to 0 where not set
  const skillMap: Record<string, Record<Skill, number>> = useMemo(() => {
    const profByStaffId = new Map<string, Map<string, number>>();
    for (const p of apiSkills) {
      if (!profByStaffId.has(p.staffId)) profByStaffId.set(p.staffId, new Map());
      profByStaffId.get(p.staffId)!.set(p.skill, p.level);
    }
    return Object.fromEntries(staff.map((m) => {
      const profMap = profByStaffId.get(m.id) ?? new Map<string, number>();
      return [m.name, Object.fromEntries(skills.map((s) => [s, profMap.get(s) ?? 0])) as Record<Skill, number>];
    }));
  }, [staff, apiSkills]);

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
    <div className={cx(styles.pageBody, styles.lndRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>COMMUNICATION / LEARNING & DEVELOPMENT</div>
          <h1 className={styles.pageTitle}>Learning & Development</h1>
          <div className={styles.pageSub}>Courses, budget, skills matrix, and progress tracking</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Log Course</button>
        </div>
      </div>

      <WidgetGrid>
        <StatWidget label="L&D Budget (FY2026)" value={`R${(totalBudget / 1000).toFixed(0)}k`} sub={`R${(totalSpent / 1000).toFixed(1)}k spent`} tone="accent" />
        <StatWidget label="Budget Utilisation"  value={`${Math.round((totalSpent / Math.max(totalBudget, 1)) * 100)}%`} sub={`R${((totalBudget - totalSpent) / 1000).toFixed(1)}k remaining`} tone="accent" />
        <StatWidget label="Courses In Progress" value={inProgress} sub={`${completed} completed`} tone="accent" />
        <StatWidget label="Zero L&D Spend"      value={staff.filter((m) => m.ldSpent === 0).length} sub="Budget not yet used" tone={staff.filter((m) => m.ldSpent === 0).length > 0 ? "amber" : "green"} />
      </WidgetGrid>

      <WidgetGrid columns={1}>
        <PipelineWidget
          title="Course Status Breakdown"
          stages={[
            { label: "Completed",   count: completed,  total: allCourses.length || 1, color: "#34d98b" },
            { label: "In Progress", count: inProgress, total: allCourses.length || 1, color: "#8b6fff" },
            { label: "Planned",     count: allCourses.filter((c) => c.status === "planned").length, total: allCourses.length || 1, color: "#f5a623" },
          ]}
        />
      </WidgetGrid>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor={"var(--accent)"}
        mutedColor={"var(--muted)"}
        panelColor={"var(--surface)"}
        borderColor={"var(--border)"}
      />

      <div className={cx("overflowAuto", "minH0")}>
        {activeTab === "by staff" ? (
          <div className={styles.lndStack12}>
            {staff.length === 0 ? (
              <div className={cx("colorMuted", "text13", "py24", "textCenter")}>No staff records found.</div>
            ) : null}
            {staff.map((member) => {
              const isExp = expanded === member.id;
              const budgetPct = Math.round((member.ldSpent / Math.max(member.ldBudget, 1)) * 100);
              const totalHours = member.courses.filter((c) => c.status === "complete" || c.status === "in-progress").reduce((s, c) => s + c.hours, 0);
              return (
                <div key={member.id} className={styles.lndCard}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={styles.lndCardHead}
                    onClick={() => setExpanded(isExp ? "" : member.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setExpanded(isExp ? "" : member.id);
                      }
                    }}
                  >
                    <div className={styles.lndHeadGrid}>
                      <div className={styles.lndNameCell}>
                        <Avatar initials={member.avatar} color={member.color} />
                        <div>
                          <div className={styles.lndName}>{member.name}</div>
                          <div className={styles.lndRole}>{member.role}</div>
                        </div>
                      </div>
                      <div>
                        <div className={styles.lndBarHead}>
                          <span className={styles.lndMini}>Budget: R{(member.ldSpent / 1000).toFixed(1)}k / R{(member.ldBudget / 1000).toFixed(0)}k</span>
                          <span className={cx(styles.lndMono11, budgetPct >= 80 ? "colorAmber" : "colorAccent")}>{budgetPct}%</span>
                        </div>
                        <progress
                          className={cx(styles.lndTrack6, budgetPct >= 80 ? styles.lndFillAmber : fillClass(member.color))}
                          max={100}
                          value={budgetPct}
                          aria-label={`${member.name} learning budget used ${budgetPct}%`}
                        />
                      </div>
                      <div className={styles.lndKpiCol}><div className={styles.lndMini}>Courses</div><div className={cx("fontMono", "fw700", "colorBlue")}>{member.courses.length}</div></div>
                      <div className={styles.lndKpiCol}><div className={styles.lndMini}>Hours</div><div className={cx("fontMono", "fw700", "colorAccent")}>{totalHours}h</div></div>
                      <span className={styles.lndChevron}>{isExp ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isExp ? (
                    <div className={styles.lndExpandWrap}>
                      <div className={styles.lndCourseList}>
                        {member.courses.length === 0 ? (
                          <div className={cx("colorMuted", "text12", "py12")}>No courses logged.</div>
                        ) : null}
                        {member.courses.map((course, i) => {
                          const sc = statusConfig[course.status];
                          const tc = typeColors[course.type] || "var(--muted)";
                          return (
                            <div key={i} className={cx(styles.lndCourseRow, toneVarClass(sc.color))}>
                              <div>
                                <div className={styles.lndCourseName}>{course.name}</div>
                                <div className={styles.lndCourseMeta}>{course.provider} · {course.date}</div>
                              </div>
                              <span className={cx(styles.lndTypeTag, toneVarClass(tc))}>{course.type}</span>
                              <span className={cx(styles.lndStatusTag, toneVarClass(sc.color))}>{sc.label}</span>
                              <span className={styles.lndMoney}>{course.cost > 0 ? `R${(course.cost / 1000).toFixed(1)}k` : "Free"}</span>
                              <span className={styles.lndHours}>{course.hours > 0 ? `${course.hours}h` : "—"}</span>
                              {course.status === "complete" ? <span className={styles.lndCheck}>✓</span> : <button type="button" className={cx("btnSm", "btnGhost")}>Update</button>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "all courses" ? (
          <div className={styles.lndTableCard}>
            <div className={styles.lndCourseHead}>
              {["Staff", "Course", "Provider", "Type", "Status", "Cost", "Hours"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {allCourses.length === 0 ? (
              <div className={cx("colorMuted", "text13", "py24", "textCenter")}>No courses logged.</div>
            ) : null}
            {allCourses.map((c, i) => {
              const sc = statusConfig[c.status];
              const tc = typeColors[c.type] || "var(--muted)";
              return (
                <div key={`${c.staffName}-${c.name}`} className={cx(styles.lndCourseGrid, i < allCourses.length - 1 && "borderB")}>
                  <div className={styles.lndStaffCell}>
                    <Avatar initials={c.staffAvatar} color={c.staffColor} size={22} />
                    <span className={styles.text11}>{c.staffName.split(" ")[0]}</span>
                  </div>
                  <div>
                    <div className={styles.text12 + " " + styles.fw600}>{c.name}</div>
                    <div className={styles.lndCourseMeta}>{c.date}</div>
                  </div>
                  <span className={styles.lndProvider}>{c.provider}</span>
                  <span className={cx(styles.lndTypeTag, toneVarClass(tc))}>{c.type}</span>
                  <span className={cx(styles.lndStatusTag, toneVarClass(sc.color))}>{sc.label}</span>
                  <span className={styles.lndMoney}>{c.cost > 0 ? `R${(c.cost / 1000).toFixed(1)}k` : "Free"}</span>
                  <span className={styles.lndHours}>{c.hours > 0 ? `${c.hours}h` : "—"}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "budget" ? (
          <div className={styles.lndStack14}>
            {staff.map((member) => {
              const pct = Math.round((member.ldSpent / Math.max(member.ldBudget, 1)) * 100);
              const remaining = member.ldBudget - member.ldSpent;
              const planned = member.courses.filter((c) => c.status === "planned" || c.status === "upcoming").reduce((s, c) => s + c.cost, 0);
              return (
                <div key={member.id} className={styles.lndBudgetRow}>
                  <div className={styles.lndNameCellSm}>
                    <Avatar initials={member.avatar} color={member.color} size={28} />
                    <div>
                      <div className={styles.lndNameSm}>{member.name.split(" ")[0]}</div>
                      <div className={styles.lndRoleSm}>{member.role}</div>
                    </div>
                  </div>
                    <div>
                      <div className={styles.lndBarHead}>
                        <span className={styles.lndMini}>R{(member.ldSpent / 1000).toFixed(1)}k spent</span>
                        <span className={cx(styles.lndMono11, pct >= 80 ? "colorAmber" : "colorAccent")}>{pct}%</span>
                      </div>
                    <div className={styles.lndBudgetTrack}>
                      <svg className={styles.lndBudgetSvg} viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                        <rect
                          className={cx(styles.lndFill, pct >= 80 ? styles.lndFillAmber : fillClass(member.color))}
                          x="0"
                          y="0"
                          width={pct}
                          height="8"
                        />
                        <rect
                          className={cx(styles.lndPlanFill, planFillClass(member.color))}
                          x={pct}
                          y="0"
                          width={Math.min((planned / Math.max(member.ldBudget, 1)) * 100, Math.max(0, 100 - pct))}
                          height="8"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.lndKpiCol}><div className={styles.lndMini}>Budget</div><div className={styles.lndBudgetAccent}>R{(member.ldBudget / 1000).toFixed(0)}k</div></div>
                  <div className={styles.lndKpiCol}><div className={styles.lndMini}>Spent</div><div className={styles.lndBudgetAmber}>R{(member.ldSpent / 1000).toFixed(1)}k</div></div>
                  <div className={styles.lndKpiCol}><div className={styles.lndMini}>Planned</div><div className={styles.lndBudgetPlanned}>{planned > 0 ? `R${(planned / 1000).toFixed(1)}k` : "—"}</div></div>
                  <div className={styles.lndKpiCol}><div className={styles.lndMini}>Remaining</div><div className={cx(styles.lndBudgetRemain, remaining > 0 ? "colorAccent" : "colorRed")}>R{(remaining / 1000).toFixed(1)}k</div></div>
                </div>
              );
            })}
            <div className={styles.lndPortfolioRow}>
              <span className={styles.fw700}>Portfolio Total</span>
              <div className={styles.lndPortfolioStats}>
                <div className={styles.lndPortfolioItem}><div className={styles.lndMini}>Total Budget</div><div className={styles.lndBudgetAccent}>R{(totalBudget / 1000).toFixed(0)}k</div></div>
                <div className={styles.lndPortfolioItem}><div className={styles.lndMini}>Total Spent</div><div className={styles.lndBudgetAmber}>R{(totalSpent / 1000).toFixed(1)}k</div></div>
                <div className={styles.lndPortfolioItem}><div className={styles.lndMini}>Remaining</div><div className={styles.lndBudgetRemain}>R{((totalBudget - totalSpent) / 1000).toFixed(1)}k</div></div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "skills matrix" ? (
          <div className={styles.lndTableCard + " " + styles.overflowAuto}>
            <div className={cx(styles.lndSkillsGrid, styles.lndSkillsGrid8)}>
              <div className={styles.lndSkillsCellHead} />
              {skills.map((s) => (
                <div key={s} className={styles.lndSkillsHeaderCell}>{s}</div>
              ))}
              {staff.map((member, mi) => (
                <div key={member.id} className={styles.lndSkillsContents}>
                  <div className={cx(styles.lndSkillsStaffCell, mi < staff.length - 1 && "borderB")}>
                    <Avatar initials={member.avatar} color={member.color} size={22} />
                    <span className={cx(styles.lndSkillsStaffName, colorClass(member.color))}>{member.name.split(" ")[0]}</span>
                  </div>
                  {skills.map((skill) => {
                    const level = skillMap[member.name]?.[skill] || 0;
                    return (
                      <div key={`${member.id}-${skill}`} className={cx(styles.lndSkillsLevelCell, mi < staff.length - 1 && "borderB")}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className={cx(styles.lndSkillSquare, skillToneClass(i < level ? level : 0))} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className={styles.lndLegendRow}>
              {[1, 2, 3, 4, 5].map((l) => (
                <div key={l} className={styles.lndLegendItem}>
                  <div className={styles.lndLegendSquares}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className={cx(styles.lndLegendSquare, skillToneClass(i < l ? l : 0))} />
                    ))}
                  </div>
                  <span className={styles.lndLegendLabel}>{["Novice", "Basic", "Competent", "Proficient", "Expert"][l - 1]}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
