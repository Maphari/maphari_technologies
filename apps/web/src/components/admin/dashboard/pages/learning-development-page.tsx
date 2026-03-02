"use client";

import { useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import { AdminTabs } from "./shared";

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

const staff: StaffMember[] = [
  {
    id: "EMP-001", name: "Sipho Nkosi", role: "Founder & CEO", avatar: "SN", color: "var(--accent)",
    ldBudget: 12000, ldSpent: 4800, courses: [
      { name: "Strategic Leadership - Regenesys", type: "Course", status: "complete", cost: 4800, date: "Feb 2026", hours: 20, provider: "Regenesys" },
      { name: "Creative Business Summit", type: "Conference", status: "upcoming", cost: 0, date: "Apr 2026", hours: 8, provider: "ADCSA" }
    ]
  },
  {
    id: "EMP-002", name: "Leilani Fotu", role: "Head of Operations", avatar: "LF", color: "var(--blue)",
    ldBudget: 8000, ldSpent: 3200, courses: [
      { name: "Project Management Fundamentals", type: "Course", status: "in-progress", cost: 2200, date: "Jan-Mar 2026", hours: 40, provider: "PMI Online" },
      { name: "Asana Advanced Workflow", type: "Short Course", status: "complete", cost: 1000, date: "Jan 2026", hours: 6, provider: "Asana Academy" }
    ]
  },
  {
    id: "EMP-003", name: "Renzo Fabbri", role: "Creative Director", avatar: "RF", color: "var(--amber)",
    ldBudget: 10000, ldSpent: 5400, courses: [
      { name: "Motion Design Masterclass", type: "Course", status: "complete", cost: 3600, date: "Dec 2025", hours: 30, provider: "School of Motion" },
      { name: "Creative Direction - Portfolio Review", type: "Mentorship", status: "in-progress", cost: 1800, date: "Jan-Mar 2026", hours: 12, provider: "Industry mentor" }
    ]
  },
  {
    id: "EMP-004", name: "Nomsa Dlamini", role: "Account Manager", avatar: "ND", color: "var(--accent)",
    ldBudget: 6000, ldSpent: 0, courses: [
      { name: "Client Success Certification", type: "Course", status: "planned", cost: 2800, date: "Apr 2026", hours: 20, provider: "Gainsight Academy" }
    ]
  },
  {
    id: "EMP-005", name: "Kira Bosman", role: "UX Designer", avatar: "KB", color: "var(--amber)",
    ldBudget: 8000, ldSpent: 890, courses: [
      { name: "Figma Advanced - Components & Variables", type: "Short Course", status: "complete", cost: 890, date: "Feb 2026", hours: 8, provider: "Figma Community" },
      { name: "UX Research Methods", type: "Course", status: "planned", cost: 3200, date: "Mar 2026", hours: 24, provider: "Nielsen Norman Group" }
    ]
  },
  {
    id: "EMP-006", name: "Tapiwa Moyo", role: "Copywriter", avatar: "TM", color: "var(--blue)",
    ldBudget: 5000, ldSpent: 0, courses: [
      { name: "Brand Storytelling - Masterclass", type: "Course", status: "planned", cost: 1200, date: "Mar 2026", hours: 16, provider: "Masterclass" }
    ]
  }
];

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

const tabs = ["by staff", "all courses", "budget", "skills matrix"] as const;
type Tab = (typeof tabs)[number];

const skills = ["Brand Strategy", "Visual Design", "UX / Product", "Motion Design", "Copywriting", "Account Management", "Operations", "Leadership"] as const;
type Skill = (typeof skills)[number];

const skillMap: Record<string, Record<Skill, number>> = {
  "Sipho Nkosi": { "Brand Strategy": 5, "Visual Design": 3, "UX / Product": 2, "Motion Design": 2, Copywriting: 3, "Account Management": 4, Operations: 4, Leadership: 5 },
  "Leilani Fotu": { "Brand Strategy": 3, "Visual Design": 2, "UX / Product": 3, "Motion Design": 1, Copywriting: 2, "Account Management": 3, Operations: 5, Leadership: 4 },
  "Renzo Fabbri": { "Brand Strategy": 5, "Visual Design": 5, "UX / Product": 3, "Motion Design": 5, Copywriting: 3, "Account Management": 2, Operations: 2, Leadership: 4 },
  "Nomsa Dlamini": { "Brand Strategy": 4, "Visual Design": 2, "UX / Product": 2, "Motion Design": 1, Copywriting: 3, "Account Management": 5, Operations: 3, Leadership: 3 },
  "Kira Bosman": { "Brand Strategy": 3, "Visual Design": 4, "UX / Product": 5, "Motion Design": 2, Copywriting: 2, "Account Management": 2, Operations: 2, Leadership: 2 },
  "Tapiwa Moyo": { "Brand Strategy": 3, "Visual Design": 2, "UX / Product": 2, "Motion Design": 1, Copywriting: 5, "Account Management": 2, Operations: 2, Leadership: 2 }
};

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
    case "var(--accent)":
      return styles.lndToneAccent;
    case "var(--red)":
      return styles.lndToneRed;
    case "var(--amber)":
      return styles.lndToneAmber;
    case "var(--blue)":
      return styles.lndToneBlue;
    case "var(--purple)":
      return styles.lndTonePurple;
    default:
      return styles.lndToneMuted;
  }
}

function fillClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.lndFillAccent;
    case "var(--amber)":
      return styles.lndFillAmber;
    case "var(--blue)":
      return styles.lndFillBlue;
    default:
      return styles.lndFillMuted;
  }
}

function planFillClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.lndPlanFillAccent;
    case "var(--amber)":
      return styles.lndPlanFillAmber;
    case "var(--blue)":
      return styles.lndPlanFillBlue;
    default:
      return styles.lndPlanFillMuted;
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

export function LearningDevelopmentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("by staff");
  const [expanded, setExpanded] = useState<string>("EMP-003");

  const totalBudget = staff.reduce((s, m) => s + m.ldBudget, 0);
  const totalSpent = staff.reduce((s, m) => s + m.ldSpent, 0);
  const allCourses = useMemo(
    () => staff.flatMap((m) => m.courses.map((c) => ({ ...c, staffName: m.name, staffColor: m.color, staffAvatar: m.avatar }))),
    []
  );
  const inProgress = allCourses.filter((c) => c.status === "in-progress").length;
  const completed = allCourses.filter((c) => c.status === "complete").length;

  return (
    <div className={cx(styles.pageBody, styles.lndRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / STAFF</div>
          <h1 className={styles.pageTitle}>Learning & Development</h1>
          <div className={styles.pageSub}>Courses, budget, skills matrix, and progress tracking</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Log Course</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb16")}>
        {[
          { label: "L&D Budget (FY2026)", value: `R${(totalBudget / 1000).toFixed(0)}k`, color: "var(--accent)", sub: `R${(totalSpent / 1000).toFixed(1)}k spent` },
          { label: "Budget Utilisation", value: `${Math.round((totalSpent / Math.max(totalBudget, 1)) * 100)}%`, color: "var(--blue)", sub: `R${((totalBudget - totalSpent) / 1000).toFixed(1)}k remaining` },
          { label: "Courses In Progress", value: inProgress.toString(), color: "var(--blue)", sub: `${completed} completed FY2026` },
          { label: "Staff with 0 L&D Spend", value: staff.filter((m) => m.ldSpent === 0).length.toString(), color: "var(--amber)", sub: "Budget not yet used" }
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
        primaryColor={"var(--accent)"}
        mutedColor={"var(--muted)"}
        panelColor={"var(--surface)"}
        borderColor={"var(--border)"}
      />

      <div className={cx("overflowAuto", "minH0")}>
        {activeTab === "by staff" ? (
          <div className={styles.lndStack12}>
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
                              <span className={styles.lndHours}>{course.hours}h</span>
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
                  <span className={styles.lndHours}>{c.hours}h</span>
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
