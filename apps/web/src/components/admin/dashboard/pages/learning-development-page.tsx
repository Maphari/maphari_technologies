"use client";

import { useMemo, useState } from "react";
import { AdminTabs } from "./shared";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  primary: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

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
    id: "EMP-001", name: "Sipho Nkosi", role: "Founder & CEO", avatar: "SN", color: C.primary,
    ldBudget: 12000, ldSpent: 4800, courses: [
      { name: "Strategic Leadership - Regenesys", type: "Course", status: "complete", cost: 4800, date: "Feb 2026", hours: 20, provider: "Regenesys" },
      { name: "Creative Business Summit", type: "Conference", status: "upcoming", cost: 0, date: "Apr 2026", hours: 8, provider: "ADCSA" }
    ]
  },
  {
    id: "EMP-002", name: "Leilani Fotu", role: "Head of Operations", avatar: "LF", color: C.blue,
    ldBudget: 8000, ldSpent: 3200, courses: [
      { name: "Project Management Fundamentals", type: "Course", status: "in-progress", cost: 2200, date: "Jan-Mar 2026", hours: 40, provider: "PMI Online" },
      { name: "Asana Advanced Workflow", type: "Short Course", status: "complete", cost: 1000, date: "Jan 2026", hours: 6, provider: "Asana Academy" }
    ]
  },
  {
    id: "EMP-003", name: "Renzo Fabbri", role: "Creative Director", avatar: "RF", color: C.orange,
    ldBudget: 10000, ldSpent: 5400, courses: [
      { name: "Motion Design Masterclass", type: "Course", status: "complete", cost: 3600, date: "Dec 2025", hours: 30, provider: "School of Motion" },
      { name: "Creative Direction - Portfolio Review", type: "Mentorship", status: "in-progress", cost: 1800, date: "Jan-Mar 2026", hours: 12, provider: "Industry mentor" }
    ]
  },
  {
    id: "EMP-004", name: "Nomsa Dlamini", role: "Account Manager", avatar: "ND", color: C.primary,
    ldBudget: 6000, ldSpent: 0, courses: [
      { name: "Client Success Certification", type: "Course", status: "planned", cost: 2800, date: "Apr 2026", hours: 20, provider: "Gainsight Academy" }
    ]
  },
  {
    id: "EMP-005", name: "Kira Bosman", role: "UX Designer", avatar: "KB", color: C.amber,
    ldBudget: 8000, ldSpent: 890, courses: [
      { name: "Figma Advanced - Components & Variables", type: "Short Course", status: "complete", cost: 890, date: "Feb 2026", hours: 8, provider: "Figma Community" },
      { name: "UX Research Methods", type: "Course", status: "planned", cost: 3200, date: "Mar 2026", hours: 24, provider: "Nielsen Norman Group" }
    ]
  },
  {
    id: "EMP-006", name: "Tapiwa Moyo", role: "Copywriter", avatar: "TM", color: C.blue,
    ldBudget: 5000, ldSpent: 0, courses: [
      { name: "Brand Storytelling - Masterclass", type: "Course", status: "planned", cost: 1200, date: "Mar 2026", hours: 16, provider: "Masterclass" }
    ]
  }
];

const statusConfig: Record<CourseStatus, { color: string; label: string }> = {
  complete: { color: C.primary, label: "Complete" },
  "in-progress": { color: C.blue, label: "In Progress" },
  planned: { color: C.muted, label: "Planned" },
  upcoming: { color: C.primary, label: "Upcoming" }
};

const typeColors: Record<CourseType, string> = {
  Course: C.blue,
  "Short Course": C.primary,
  Conference: C.primary,
  Mentorship: C.orange,
  Workshop: C.amber
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
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
      {initials}
    </div>
  );
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
    <div
      style={{
        background: C.bg,
        height: "100%",
        fontFamily: "Syne, sans-serif",
        color: C.text,
        padding: 0,
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "auto auto auto 1fr",
        minHeight: 0
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / STAFF</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Learning & Development</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Courses, budget, skills matrix, and progress tracking</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Log Course</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "L&D Budget (FY2026)", value: `R${(totalBudget / 1000).toFixed(0)}k`, color: C.primary, sub: `R${(totalSpent / 1000).toFixed(1)}k spent` },
          { label: "Budget Utilisation", value: `${Math.round((totalSpent / Math.max(totalBudget, 1)) * 100)}%`, color: C.blue, sub: `R${((totalBudget - totalSpent) / 1000).toFixed(1)}k remaining` },
          { label: "Courses In Progress", value: inProgress.toString(), color: C.blue, sub: `${completed} completed FY2026` },
          { label: "Staff with 0 L&D Spend", value: staff.filter((m) => m.ldSpent === 0).length.toString(), color: C.amber, sub: "Budget not yet used" }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor={C.primary}
        mutedColor={C.muted}
        panelColor={C.surface}
        borderColor={C.border}
      />

      <div style={{ overflow: "auto", minHeight: 0 }}>
        {activeTab === "by staff" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {staff.map((member) => {
              const isExp = expanded === member.id;
              const budgetPct = Math.round((member.ldSpent / Math.max(member.ldBudget, 1)) * 100);
              const totalHours = member.courses.filter((c) => c.status === "complete" || c.status === "in-progress").reduce((s, c) => s + c.hours, 0);
              return (
                <div key={member.id} style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div style={{ padding: 20, cursor: "pointer" }} onClick={() => setExpanded(isExp ? "" : member.id)}>
                    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 120px 100px 80px auto", alignItems: "center", gap: 20 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Avatar initials={member.avatar} color={member.color} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{member.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{member.role}</div>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: C.muted }}>Budget: R{(member.ldSpent / 1000).toFixed(1)}k / R{(member.ldBudget / 1000).toFixed(0)}k</span>
                          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: budgetPct >= 80 ? C.amber : C.primary }}>{budgetPct}%</span>
                        </div>
                        <div style={{ height: 6, background: C.border }}>
                          <div style={{ height: "100%", width: `${budgetPct}%`, background: budgetPct >= 80 ? C.amber : member.color }} />
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Courses</div>
                        <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.blue }}>{member.courses.length}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Hours</div>
                        <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.primary }}>{totalHours}h</div>
                      </div>
                      <span style={{ fontSize: 12, color: isExp ? C.primary : C.muted }}>{isExp ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isExp ? (
                    <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${C.border}` }}>
                      <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                        {member.courses.map((course, i) => {
                          const sc = statusConfig[course.status];
                          const tc = typeColors[course.type] || C.muted;
                          return (
                            <div key={i} style={{ padding: 14, background: C.bg, display: "grid", gridTemplateColumns: "1fr 120px 100px 100px 60px auto", alignItems: "center", gap: 12, borderLeft: `3px solid ${sc.color}` }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{course.name}</div>
                                <div style={{ fontSize: 10, color: C.muted }}>{course.provider} · {course.date}</div>
                              </div>
                              <span style={{ fontSize: 10, color: tc, background: `${tc}15`, padding: "2px 8px" }}>{course.type}</span>
                              <span style={{ fontSize: 10, color: sc.color, background: `${sc.color}15`, padding: "2px 8px", fontFamily: "DM Mono, monospace" }}>{sc.label}</span>
                              <span style={{ fontFamily: "DM Mono, monospace", color: C.amber }}>{course.cost > 0 ? `R${(course.cost / 1000).toFixed(1)}k` : "Free"}</span>
                              <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{course.hours}h</span>
                              {course.status === "complete" ? <span style={{ color: C.primary, fontSize: 16, textAlign: "center" }}>✓</span> : <button style={{ background: C.border, border: "none", color: C.text, padding: "4px 8px", fontSize: 10, cursor: "pointer" }}>Update</button>}
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
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 140px 120px 100px 80px 80px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", gap: 16 }}>
              {["Staff", "Course", "Provider", "Type", "Status", "Cost", "Hours"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {allCourses.map((c, i) => {
              const sc = statusConfig[c.status];
              const tc = typeColors[c.type] || C.muted;
              return (
                <div key={`${c.staffName}-${c.name}`} style={{ display: "grid", gridTemplateColumns: "140px 1fr 140px 120px 100px 80px 80px", padding: "13px 24px", borderBottom: i < allCourses.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Avatar initials={c.staffAvatar} color={c.staffColor} size={22} />
                    <span style={{ fontSize: 11 }}>{c.staffName.split(" ")[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{c.date}</div>
                  </div>
                  <span style={{ fontSize: 11, color: C.muted }}>{c.provider}</span>
                  <span style={{ fontSize: 10, color: tc, background: `${tc}15`, padding: "2px 8px" }}>{c.type}</span>
                  <span style={{ fontSize: 10, color: sc.color, background: `${sc.color}15`, padding: "2px 8px", fontFamily: "DM Mono, monospace" }}>{sc.label}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.amber }}>{c.cost > 0 ? `R${(c.cost / 1000).toFixed(1)}k` : "Free"}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{c.hours}h</span>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "budget" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {staff.map((member) => {
              const pct = Math.round((member.ldSpent / Math.max(member.ldBudget, 1)) * 100);
              const remaining = member.ldBudget - member.ldSpent;
              const planned = member.courses.filter((c) => c.status === "planned" || c.status === "upcoming").reduce((s, c) => s + c.cost, 0);
              return (
                <div key={member.id} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20, display: "grid", gridTemplateColumns: "200px 1fr 100px 100px 100px 100px", alignItems: "center", gap: 20 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Avatar initials={member.avatar} color={member.color} size={28} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{member.name.split(" ")[0]}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{member.role}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>R{(member.ldSpent / 1000).toFixed(1)}k spent</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: pct >= 80 ? C.amber : C.primary }}>{pct}%</span>
                    </div>
                    <div style={{ height: 8, background: C.border, overflow: "hidden", display: "flex" }}>
                      <div style={{ width: `${pct}%`, background: pct >= 80 ? C.amber : member.color }} />
                      <div style={{ width: `${Math.min((planned / Math.max(member.ldBudget, 1)) * 100, Math.max(0, 100 - pct))}%`, background: `${member.color}44` }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.muted }}>Budget</div>
                    <div style={{ fontFamily: "DM Mono, monospace", color: C.primary, fontWeight: 700 }}>R{(member.ldBudget / 1000).toFixed(0)}k</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.muted }}>Spent</div>
                    <div style={{ fontFamily: "DM Mono, monospace", color: C.amber, fontWeight: 700 }}>R{(member.ldSpent / 1000).toFixed(1)}k</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.muted }}>Planned</div>
                    <div style={{ fontFamily: "DM Mono, monospace", color: C.primary }}>{planned > 0 ? `R${(planned / 1000).toFixed(1)}k` : "—"}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.muted }}>Remaining</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: remaining > 0 ? C.primary : C.red }}>R{(remaining / 1000).toFixed(1)}k</div>
                  </div>
                </div>
              );
            })}
            <div style={{ padding: 16, background: C.surface, border: `1px solid ${C.primary}22`, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700 }}>Portfolio Total</span>
              <div style={{ display: "flex", gap: 40 }}>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: C.muted }}>Total Budget</div><div style={{ fontFamily: "DM Mono, monospace", color: C.primary, fontWeight: 700 }}>R{(totalBudget / 1000).toFixed(0)}k</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: C.muted }}>Total Spent</div><div style={{ fontFamily: "DM Mono, monospace", color: C.amber, fontWeight: 700 }}>R{(totalSpent / 1000).toFixed(1)}k</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: C.muted }}>Remaining</div><div style={{ fontFamily: "DM Mono, monospace", color: C.primary, fontWeight: 700 }}>R{((totalBudget - totalSpent) / 1000).toFixed(1)}k</div></div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "skills matrix" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: `170px repeat(${skills.length}, 100px)`, minWidth: "max-content" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted }} />
              {skills.map((s) => (
                <div key={s} style={{ padding: "12px 8px", borderBottom: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textAlign: "center", letterSpacing: "0.04em" }}>{s}</div>
              ))}
              {staff.map((member, mi) => (
                <div key={member.id} style={{ display: "contents" }}>
                  <div style={{ padding: "12px 16px", borderBottom: mi < staff.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", gap: 8, alignItems: "center" }}>
                    <Avatar initials={member.avatar} color={member.color} size={22} />
                    <span style={{ fontSize: 11, color: member.color, fontWeight: 600 }}>{member.name.split(" ")[0]}</span>
                  </div>
                  {skills.map((skill) => {
                    const level = skillMap[member.name]?.[skill] || 0;
                    const colors = [C.border, `${C.red}88`, `${C.amber}88`, `${C.blue}88`, `${C.primary}88`, C.primary];
                    return (
                      <div key={`${member.id}-${skill}`} style={{ padding: "10px 8px", borderBottom: mi < staff.length - 1 ? `1px solid ${C.border}` : "none", borderLeft: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} style={{ width: 10, height: 10, background: i < level ? colors[level] : C.border }} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, padding: 16, borderTop: `1px solid ${C.border}` }}>
              {[1, 2, 3, 4, 5].map((l) => (
                <div key={l} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {Array.from({ length: 5 }, (_, i) => <div key={i} style={{ width: 8, height: 8, background: i < l ? (l <= 1 ? `${C.red}88` : l <= 2 ? `${C.amber}88` : l <= 3 ? `${C.blue}88` : l <= 4 ? `${C.primary}88` : C.primary) : C.border }} />)}
                  </div>
                  <span style={{ fontSize: 10, color: C.muted }}>{["Novice", "Basic", "Competent", "Proficient", "Expert"][l - 1]}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
