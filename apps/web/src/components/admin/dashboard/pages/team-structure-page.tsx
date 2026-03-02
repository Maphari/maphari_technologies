"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

type OrgPerson = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  department: string;
  reports: OrgPerson[];
};

const org: OrgPerson = {
  id: "sipho",
  name: "Sipho Nkosi",
  role: "Founder & CEO",
  avatar: "SN",
  color: "var(--accent)",
  department: "Leadership",
  reports: [
    {
      id: "leilani",
      name: "Leilani Fotu",
      role: "Head of Operations",
      avatar: "LF",
      color: "var(--blue)",
      department: "Operations",
      reports: [
        { id: "nomsa", name: "Nomsa Dlamini", role: "Account Manager", avatar: "ND", color: "var(--purple)", department: "Client Success", reports: [] },
        { id: "tapiwa", name: "Tapiwa Moyo", role: "Copywriter", avatar: "TM", color: "var(--amber)", department: "Content", reports: [] }
      ]
    },
    {
      id: "renzo",
      name: "Renzo Fabbri",
      role: "Creative Director",
      avatar: "RF",
      color: "var(--amber)",
      department: "Design",
      reports: [{ id: "kira", name: "Kira Bosman", role: "UX Designer", avatar: "KB", color: "var(--red)", department: "Design", reports: [] }]
    }
  ]
};

const departments = [
  { name: "Leadership", headcount: 1, color: "var(--accent)", budget: 60000 },
  { name: "Operations", headcount: 1, color: "var(--blue)", budget: 44000 },
  { name: "Design", headcount: 2, color: "var(--amber)", budget: 73500 },
  { name: "Client Success", headcount: 1, color: "var(--purple)", budget: 42000 },
  { name: "Content", headcount: 1, color: "var(--amber)", budget: 31000 }
] as const;

const roles = [
  { title: "Founder & CEO", department: "Leadership", level: "C-Suite", permissions: ["all"], reportCount: 2 },
  { title: "Head of Operations", department: "Operations", level: "Head", permissions: ["staff", "clients", "reports", "scheduling"], reportCount: 2 },
  { title: "Creative Director", department: "Design", level: "Head", permissions: ["clients", "reports"], reportCount: 1 },
  { title: "Account Manager", department: "Client Success", level: "Senior", permissions: ["clients", "invoices"], reportCount: 0 },
  { title: "UX Designer", department: "Design", level: "Mid", permissions: ["clients"], reportCount: 0 },
  { title: "Copywriter", department: "Content", level: "Mid", permissions: ["clients"], reportCount: 0 }
] as const;

const headcountPlan = [
  { role: "Senior Designer", department: "Design", priority: "critical", targetDate: "Apr 2026", status: "interviewing", budget: 45000 },
  { role: "Marketing Manager", department: "Marketing", priority: "high", targetDate: "Jun 2026", status: "approved", budget: 38000 },
  { role: "Junior Copywriter", department: "Content", priority: "medium", targetDate: "Jul 2026", status: "planned", budget: 22000 }
] as const;

const tabs = ["org chart", "departments", "roles & permissions", "headcount plan"] as const;
type Tab = (typeof tabs)[number];

function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <div className={cx("fontMono", "flexCenter", "noShrink", "fw700", styles.teamAvatar, toneClass(color), size === 36 ? "teamAvatar36" : "teamAvatar40")}>
      {initials}
    </div>
  );
}

function OrgNode({ person, depth = 0 }: { person: OrgPerson; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={cx("flexCol", styles.teamCenterCol)}>
      <div
        className={cx(styles.card, styles.teamOrgCard, toneClass(person.color))}
        role={person.reports.length > 0 ? "button" : undefined}
        tabIndex={person.reports.length > 0 ? 0 : undefined}
        onClick={() => person.reports.length > 0 && setCollapsed(!collapsed)}
        onKeyDown={(event) => {
          if (person.reports.length === 0) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setCollapsed((value) => !value);
          }
        }}
      >
        <Avatar initials={person.avatar} color={person.color} size={36} />
        <div className={cx("fw700", "text13", "mt8")}>{person.name}</div>
        <div className={cx("text11", "colorMuted", "mt4")}>{person.role}</div>
        <div className={cx("text10", "fontMono", "mt4", styles.teamToneText, toneClass(person.color))}>{person.department}</div>
        {person.reports.length > 0 ? (
          <div className={cx("colorMuted", "text12", styles.teamCollapseIcon)}>{collapsed ? "+" : "\u2212"}</div>
        ) : null}
      </div>

      {!collapsed && person.reports.length > 0 ? (
        <div className={cx("flexCol", styles.teamCenterCol)}>
          <div className={styles.teamConnV24} />
          {person.reports.length > 1 ? (
            <div className={styles.teamBranchWrap}>
              <div className={cx(styles.teamBranchLine, styles.teamBranchLine220)} />
            </div>
          ) : null}
          <div className={cx("flexRow", "gap20", styles.teamAlignStart)}>
            {person.reports.map((report) => (
              <div key={report.id} className={cx("flexCol", styles.teamCenterCol)}>
                <div className={styles.teamConnV24} />
                <OrgNode person={report} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TeamStructurePage() {
  const [activeTab, setActiveTab] = useState<Tab>("org chart");

  const totalHeadcount = departments.reduce((s, d) => s + d.headcount, 0);
  const totalPayroll = departments.reduce((s, d) => s + d.budget, 0);

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / ORGANIZATIONAL STRUCTURE</div>
          <h1 className={styles.pageTitle}>Team Structure</h1>
          <div className={styles.pageSub}>Org chart &middot; Departments &middot; Roles &middot; Headcount planning</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Org Chart</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Add Staff</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Total Headcount", value: totalHeadcount.toString(), color: "var(--accent)", sub: "Full-time staff" },
          { label: "Departments", value: departments.length.toString(), color: "var(--blue)", sub: "Active teams" },
          { label: "Monthly Payroll", value: `R${(totalPayroll / 1000).toFixed(0)}k`, color: "var(--red)", sub: "Salaries only" },
          { label: "Open Positions", value: headcountPlan.length.toString(), color: "var(--amber)", sub: "Planned hires" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, "mb4", styles.teamToneText, toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="View" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "org chart" ? (
        <div className={cx(styles.card, styles.teamOrgWrap)}>
          <div className={cx("flexCenter", styles.teamOrgMin)}>
            <OrgNode person={org} />
          </div>
          <div className={cx("flexRow", "gap20", "flexWrap", "mt32", styles.teamDeptLegend)}>
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

      {activeTab === "departments" ? (
        <div className={cx("grid3")}>
          {departments.map((d) => (
            <div key={d.name} className={cx(styles.card, styles.teamDeptCard, toneClass(d.color))}>
              <div className={cx("flexBetween", "mb20")}>
                <div>
                  <div className={cx("fw700", "mb4", styles.teamTitle16)}>{d.name}</div>
                  <div className={cx("text12", "colorMuted")}>
                    {d.headcount} staff member{d.headcount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className={cx(styles.teamDotLg, toneClass(d.color))} />
              </div>
              <div className={cx("grid2", "gap12")}>
                <div className={cx("bgBg", "p12", styles.teamRounded8)}>
                  <div className={cx("text10", "colorMuted", "mb4")}>Monthly Budget</div>
                  <div className={cx("fontMono", "fw700", "colorRed")}>R{d.budget.toLocaleString()}</div>
                </div>
                <div className={cx("bgBg", "p12", styles.teamRounded8)}>
                  <div className={cx("text10", "colorMuted", "mb4")}>Cost per Head</div>
                  <div className={cx("fontMono", "fw700")}>R{Math.round(d.budget / d.headcount).toLocaleString()}</div>
                </div>
              </div>
              <div className={cx("flexRow", "gap8", "mt16")}>
                <button type="button" className={cx("btnSm", "btnGhost", styles.teamFlex1)}>View Team</button>
                <button type="button" className={cx("btnSm", styles.teamToneBtn, styles.teamFlex1, toneClass(d.color))}>Edit</button>
              </div>
            </div>
          ))}
          <div className={cx("flexCenter", "colorMuted", "text13", "pointerCursor", styles.teamAddCard)}>
            + Add Department
          </div>
        </div>
      ) : null}

      {activeTab === "roles & permissions" ? (
        <div className={cx("card", "overflowHidden")}>
          <div className={styles.teamRolesHead}>
            {["Role Title", "Department", "Level", "Reports", "Dashboard Permissions"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {roles.map((r) => (
            <div key={r.title} className={cx(styles.teamRolesRow, styles.teamRolesRowPad)}>
              <span className={cx("fw600", "text13")}>{r.title}</span>
              <span className={cx("text12", "colorMuted")}>{r.department}</span>
              <span className={cx("badge", r.level === "C-Suite" ? "badgeGreen" : r.level === "Head" ? "badgeBlue" : "badgeMuted")}>{r.level}</span>
              <span className={cx("fontMono", "colorMuted")}>{r.reportCount}</span>
              <div className={cx("flexRow", "flexWrap", "gap4")}>
                {r.permissions.some((p) => p === "all") ? (
                  <span className={cx("badge", "badgeGreen")}>&#9733; Full Access</span>
                ) : (
                  r.permissions.map((p) => (
                    <span key={p} className={cx("badge", "badgeBlue")}>
                      {p}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "headcount plan" ? (
        <div className={cx("flexCol", "gap16")}>
          <div className={cx(styles.card, styles.teamInfoCard)}>
            <span className={cx("text12", "colorMuted")}>Planned hires for 2026. Approved positions have budget allocated. Planned positions require finance sign-off before posting.</span>
          </div>
          {headcountPlan.map((h) => (
            <div key={h.role} className={cx(styles.card, styles.teamHireCard)}>
              <div className={styles.teamHeadcountRow}>
                <div>
                  <div className={cx("fw700", "mb4")}>{h.role}</div>
                  <div className={cx("text12", "colorMuted")}>{h.department}</div>
                </div>
                <span className={cx("badge", h.priority === "critical" ? "badgeRed" : h.priority === "high" ? "badgeAmber" : "badgeAmber")}>{h.priority}</span>
                <div>
                  <div className={cx("text10", "colorMuted", "mb3")}>Target</div>
                  <div className={cx("text12", "fontMono")}>{h.targetDate}</div>
                </div>
                <div>
                  <div className={cx("text10", "colorMuted", "mb3")}>Monthly Budget</div>
                  <div className={cx("fontMono", "colorAccent", "fw700")}>R{h.budget.toLocaleString()}</div>
                </div>
                <span className={cx("badge", h.status === "interviewing" ? "badgeBlue" : h.status === "approved" ? "badgeGreen" : "badgeMuted")}>{h.status}</span>
                <div className={cx("flexRow", "gap8")}>
                  <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
                  {h.status === "planned" ? <button type="button" className={cx("btnSm", "btnAccent")}>Approve</button> : null}
                </div>
              </div>
            </div>
          ))}
          <button type="button" className={cx("btnSm", "btnGhost", "textCenter", styles.teamAddHireBtn)}>+ Add Planned Hire</button>
        </div>
      ) : null}
    </div>
  );
}
