"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";

const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

type StaffMember = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  utilisation: number;
  billableHours: number;
  targetHours: number;
  performanceScore: number | null;
  tasksCompleted: number;
  tasksOverdue: number;
  clientSatisfaction: number | null;
  revContribution: number | null;
  ldHours: number;
  sickDays: number;
  utilisationHistory: number[];
  strengths: string[];
  devAreas: string[];
};

const staff: StaffMember[] = [
  { id: "EMP-001", name: "Sipho Nkosi", role: "Founder & CEO", avatar: "SN", color: "var(--accent)", utilisation: 72, billableHours: 86, targetHours: 120, performanceScore: null, tasksCompleted: 24, tasksOverdue: 1, clientSatisfaction: 9.2, revContribution: 380600, ldHours: 20, sickDays: 0, utilisationHistory: [68, 70, 72, 74, 71, 72], strengths: ["Strategic vision", "Client relationships", "Revenue growth"], devAreas: ["Delegation", "Process documentation"] },
  { id: "EMP-002", name: "Leilani Fotu", role: "Head of Operations", avatar: "LF", color: "var(--blue)", utilisation: 89, billableHours: 148, targetHours: 168, performanceScore: 4.2, tasksCompleted: 62, tasksOverdue: 3, clientSatisfaction: null, revContribution: null, ldHours: 46, sickDays: 2, utilisationHistory: [82, 85, 87, 90, 88, 89], strengths: ["Process management", "Asana discipline", "Communication"], devAreas: ["Financial reporting ownership", "Hiring experience"] },
  { id: "EMP-003", name: "Renzo Fabbri", role: "Creative Director", avatar: "RF", color: "var(--amber)", utilisation: 94, billableHours: 158, targetHours: 168, performanceScore: 4.6, tasksCompleted: 78, tasksOverdue: 2, clientSatisfaction: 8.4, revContribution: 65600, ldHours: 42, sickDays: 4, utilisationHistory: [88, 90, 92, 96, 93, 94], strengths: ["Creative quality", "Client trust", "Team mentoring"], devAreas: ["Scope management", "Freelancer briefing quality"] },
  { id: "EMP-004", name: "Nomsa Dlamini", role: "Account Manager", avatar: "ND", color: "var(--purple)", utilisation: 78, billableHours: 131, targetHours: 168, performanceScore: 3.9, tasksCompleted: 44, tasksOverdue: 6, clientSatisfaction: 7.1, revContribution: 286600, ldHours: 0, sickDays: 0, utilisationHistory: [74, 75, 77, 80, 76, 78], strengths: ["Client responsiveness", "Relationship warmth"], devAreas: ["Escalation handling", "Communication clarity", "L&D engagement"] },
  { id: "EMP-005", name: "Kira Bosman", role: "UX Designer", avatar: "KB", color: "var(--amber)", utilisation: 88, billableHours: 148, targetHours: 168, performanceScore: 4.4, tasksCompleted: 56, tasksOverdue: 1, clientSatisfaction: 8.1, revContribution: 43200, ldHours: 14, sickDays: 1, utilisationHistory: [80, 83, 86, 89, 87, 88], strengths: ["Figma craft", "Research quality", "Iteration speed"], devAreas: ["UX writing", "Stakeholder presentation skills"] },
  { id: "EMP-006", name: "Tapiwa Moyo", role: "Copywriter", avatar: "TM", color: "var(--blue)", utilisation: 64, billableHours: 107, targetHours: 168, performanceScore: 3.7, tasksCompleted: 38, tasksOverdue: 4, clientSatisfaction: 7.8, revContribution: 28000, ldHours: 0, sickDays: 0, utilisationHistory: [58, 60, 62, 66, 63, 64], strengths: ["Brand voice", "Speed of first drafts"], devAreas: ["Output volume", "Brief interpretation", "L&D investment"] }
];

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size === 24 ? "tprAvatar24" : size === 26 ? "tprAvatar26" : size === 30 ? "tprAvatar30" : size === 52 ? "tprAvatar52" : "tprAvatar32";
  return (
    <div className={cx(styles.tprAvatar, toneVarClass(color), sizeClass)}>
      {initials}
    </div>
  );
}

const tabs = ["team overview", "individual profiles", "utilisation", "tasks & output"] as const;
type Tab = (typeof tabs)[number];

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

function trendFillColor(value: string, isLast: boolean): string {
  if (value === "var(--blue)") return isLast ? "var(--blue)" : "color-mix(in srgb, var(--blue) 45%, transparent)";
  if (value === "var(--amber)") return isLast ? "var(--amber)" : "color-mix(in srgb, var(--amber) 45%, transparent)";
  return isLast ? "var(--accent)" : "color-mix(in srgb, var(--accent) 45%, transparent)";
}

export function TeamPerformanceReportPage() {
  const [activeTab, setActiveTab] = useState<Tab>("team overview");
  const [selected, setSelected] = useState<StaffMember>(staff[2]);

  const avgUtil = Math.round(staff.reduce((s, m) => s + m.utilisation, 0) / staff.length);
  const totalOverdue = staff.reduce((s, m) => s + m.tasksOverdue, 0);
  const avgPerf = (
    staff.filter((m) => m.performanceScore !== null).reduce((s, m) => s + (m.performanceScore ?? 0), 0) /
    staff.filter((m) => m.performanceScore !== null).length
  ).toFixed(1);
  const lowUtil = staff.filter((m) => m.utilisation < 70).length;

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / REPORTING & INTELLIGENCE</div>
          <h1 className={styles.pageTitle}>Team Performance Report</h1>
          <div className={styles.pageSub}>Utilisation · Output · Scores · Development · Feb 2026</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Report</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          { label: "Avg Utilisation", value: `${avgUtil}%`, color: avgUtil >= 80 ? "var(--accent)" : "var(--amber)", sub: "Target: 80%" },
          { label: "Avg Performance Score", value: `${avgPerf}/5`, color: Number.parseFloat(avgPerf) >= 4 ? "var(--accent)" : "var(--amber)", sub: "Scored staff only" },
          { label: "Overdue Tasks (Feb)", value: totalOverdue.toString(), color: totalOverdue > 5 ? "var(--red)" : "var(--amber)", sub: "Across all staff" },
          { label: "Low Utilisation Staff", value: lowUtil.toString(), color: lowUtil > 0 ? "var(--amber)" : "var(--accent)", sub: "Below 70%" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="View" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "team overview" ? (
        <div className={styles.tprList10}>
          {[...staff].sort((a, b) => b.utilisation - a.utilisation).map((member) => {
            const utilColor = member.utilisation >= 85 ? "var(--accent)" : member.utilisation >= 70 ? "var(--blue)" : member.utilisation >= 60 ? "var(--amber)" : "var(--red)";
            const perfColor = member.performanceScore ? (member.performanceScore >= 4.5 ? "var(--accent)" : member.performanceScore >= 3.5 ? "var(--blue)" : "var(--amber)") : "var(--muted)";
            return (
              <div
                key={member.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelected(member);
                  setActiveTab("individual profiles");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(member);
                    setActiveTab("individual profiles");
                  }
                }}
                className={cx(styles.tprOverviewRow, member.utilisation < 70 ? styles.tprToneAmber : styles.tprToneBorder)}
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
                    <span className={styles.tprMini}>{member.billableHours}h / {member.targetHours}h</span>
                    <span className={cx(styles.tprMono11, colorClass(utilColor))}>{member.utilisation}%</span>
                  </div>
                  <progress className={cx(styles.tprTrack6, fillClass(utilColor))} max={100} value={member.utilisation} aria-label={`${member.name} utilisation ${member.utilisation}%`} />
                </div>
                <div className={styles.tprKpiCol}><div className={styles.tprMini}>Score</div><div className={cx(styles.tprMono700, colorClass(perfColor))}>{member.performanceScore ? `${member.performanceScore}` : "—"}</div></div>
                <div className={styles.tprKpiCol}><div className={styles.tprMini}>Done</div><div className={cx("fontMono", "colorAccent")}>{member.tasksCompleted}</div></div>
                <div className={styles.tprKpiCol}><div className={styles.tprMini}>Overdue</div><div className={cx("fontMono", member.tasksOverdue > 3 ? "colorRed" : member.tasksOverdue > 0 ? "colorAmber" : "colorAccent")}>{member.tasksOverdue}</div></div>
                <div className={styles.tprKpiCol}><div className={styles.tprMini}>L&D Hrs</div><div className={cx("fontMono", member.ldHours === 0 ? "colorRed" : "colorBlue")}>{member.ldHours}h</div></div>
                <div className={styles.tprKpiCol}><div className={styles.tprMini}>Sick Days</div><div className={cx("fontMono", "colorMuted")}>{member.sickDays}</div></div>
                <span className={styles.tprChevron}>▶</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {activeTab === "individual profiles" ? (
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
                  <div className={cx("fontMono", "text11", m.utilisation >= 80 ? "colorAccent" : "colorAmber")}>{m.utilisation}%</div>
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
              {selected.performanceScore ? (
                <div className={styles.tprPerfBox}>
                  <div className={cx(styles.tprPerfValue, selected.performanceScore >= 4 ? "colorAccent" : "colorAmber")}>{selected.performanceScore}</div>
                  <div className={styles.tprMini}>Performance / 5</div>
                </div>
              ) : null}
            </div>

            <div className={styles.tprMetricGrid}>
              {[
                { label: "Utilisation", value: `${selected.utilisation}%`, color: selected.utilisation >= 80 ? "var(--accent)" : "var(--amber)" },
                { label: "Billable Hours", value: `${selected.billableHours}h`, color: "var(--blue)" },
                { label: "Tasks Completed", value: selected.tasksCompleted.toString(), color: "var(--accent)" },
                { label: "Tasks Overdue", value: selected.tasksOverdue.toString(), color: selected.tasksOverdue > 0 ? "var(--red)" : "var(--accent)" },
                { label: "L&D Hours", value: `${selected.ldHours}h`, color: selected.ldHours === 0 ? "var(--red)" : "var(--blue)" },
                { label: "Client Satisfaction", value: selected.clientSatisfaction ? `${selected.clientSatisfaction}/10` : "N/A", color: selected.clientSatisfaction ? (selected.clientSatisfaction >= 8 ? "var(--accent)" : "var(--amber)") : "var(--muted)" }
              ].map((m) => (
                <div key={m.label} className={styles.tprMetricTile}>
                  <div className={cx(styles.tprMetricValue, colorClass(m.color))}>{m.value}</div>
                  <div className={styles.tprMetricLabel}>{m.label}</div>
                </div>
              ))}
            </div>

            <div className={styles.tprTrendBlock}>
              <div className={styles.tprTrendTitle}>Utilisation Trend (6mo)</div>
              <div className={styles.tprTrendBars}>
                {selected.utilisationHistory.map((v, i) => {
                  const isLast = i === selected.utilisationHistory.length - 1;
                  const color = v >= 85 ? "var(--accent)" : v >= 70 ? "var(--blue)" : "var(--amber)";
                  return (
                    <div key={i} className={styles.tprTrendBarCol}>
                      <svg className={styles.tprTrendBar} viewBox="0 0 10 60" preserveAspectRatio="none" aria-hidden="true">
                        <rect x="0" y={60 - (v / 100) * 60} width="10" height={(v / 100) * 60} fill={trendFillColor(color, isLast)} />
                      </svg>
                      <span className={styles.tprMiniMonth}>{months[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.tprStrengthSplit}>
              <div className={styles.tprStrengthCard}>
                <div className={styles.tprStrengthHd}>✦ Strengths</div>
                {selected.strengths.map((s, i) => (
                  <div key={i} className={styles.tprBulletRow}><span className={styles.tprDotAccent}>·</span><span>{s}</span></div>
                ))}
              </div>
              <div className={styles.tprDevCard}>
                <div className={styles.tprDevHd}>↑ Development Areas</div>
                {selected.devAreas.map((d, i) => (
                  <div key={i} className={styles.tprBulletRow}><span className={styles.tprDotAmber}>·</span><span>{d}</span></div>
                ))}
              </div>
            </div>
            <div className={styles.tprActionRow}>
              <button type="button" className={cx("btnSm", "btnAccent")}>View Full Record</button>
              <button type="button" className={cx("btnSm", "btnGhost")}>Schedule Review</button>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "utilisation" ? (
        <div className={styles.tprList14}>
          <div className={styles.tprUtilCard}>
            <div className={styles.tprSecTitle}>Team Utilisation — Feb 2026</div>
            {[...staff].sort((a, b) => b.utilisation - a.utilisation).map((m) => {
              const color = m.utilisation >= 85 ? "var(--accent)" : m.utilisation >= 70 ? "var(--blue)" : m.utilisation >= 60 ? "var(--amber)" : "var(--red)";
              return (
                <div key={m.id} className={styles.tprUtilRow}>
                  <Avatar initials={m.avatar} color={m.color} size={26} />
                  <span className={styles.tprUtilName}>{m.name.split(" ")[0]}</span>
                  <div className={styles.tprUtilTrackWrap}>
                    <progress className={cx(styles.tprUtilFill, fillClass(color))} max={100} value={m.utilisation} aria-label={`${m.name} utilisation ${m.utilisation}%`} />
                    <span className={styles.tprUtilFillLabel}>{m.billableHours}h billable</span>
                    <div className={styles.tprTargetLine} />
                  </div>
                  <span className={cx(styles.tprUtilPct, colorClass(color))}>{m.utilisation}%</span>
                  {m.utilisation < 70 ? <span className={styles.tprLowTag}>Low</span> : null}
                </div>
              );
            })}
            <div className={styles.tprUtilFoot}>Vertical line = 80% target. Total team: {Math.round(staff.reduce((s, m) => s + m.billableHours, 0))}h billable of {staff.reduce((s, m) => s + m.targetHours, 0)}h capacity.</div>
          </div>
          <div className={styles.tprUtilCard}>
            <div className={styles.tprSecTitle}>Utilisation Trend — All Staff (6mo)</div>
            <div className={styles.tprBigTrendBars}>
              {months.map((month, mi) => {
                const avgU = Math.round(staff.reduce((s, m) => s + m.utilisationHistory[mi], 0) / staff.length);
                const h = (avgU / 100) * 80;
                const isLast = mi === months.length - 1;
                return (
                  <div key={month} className={styles.tprBigTrendCol}>
                    <span className={cx("text10", isLast ? "colorAccent" : "colorMuted")}>{avgU}%</span>
                    <svg className={styles.tprBigTrendBar} viewBox="0 0 10 80" preserveAspectRatio="none" aria-hidden="true">
                      <rect x="0" y={80 - h} width="10" height={h} fill={isLast ? "var(--accent)" : "var(--accent-d)"} />
                    </svg>
                    <span className={styles.tprMiniMonth}>{month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "tasks & output" ? (
        <div className={styles.tprTableCard}>
          <div className={styles.tprOutputHead}>
            {["Employee", "Completed", "Overdue", "Completion %", "L&D Hrs", "Sick Days"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {[...staff].sort((a, b) => b.tasksCompleted - a.tasksCompleted).map((m, i) => {
            const completionRate = Math.round((m.tasksCompleted / (m.tasksCompleted + m.tasksOverdue)) * 100);
            return (
              <div key={m.id} className={cx(styles.tprOutputRow, i < staff.length - 1 && "borderB")}>
                <div className={styles.tprEmpCell}>
                  <Avatar initials={m.avatar} color={m.color} size={26} />
                  <div>
                    <div className={styles.tprEmpName}>{m.name.split(" ")[0]}</div>
                    <div className={styles.tprEmpRole}>{m.role}</div>
                  </div>
                </div>
                <span className={styles.tprOutputDone}>{m.tasksCompleted}</span>
                <span className={cx(styles.tprOutputOverdue, m.tasksOverdue > 3 ? "colorRed" : m.tasksOverdue > 0 ? "colorAmber" : "colorAccent")}>{m.tasksOverdue}</span>
                <div>
                  <progress className={cx(styles.tprTrack6Mb, completionRate >= 90 ? styles.tprFillAccent : styles.tprFillAmber)} max={100} value={completionRate} aria-label={`${m.name} completion ${completionRate}%`} />
                  <span className={cx(styles.tprOutputPct, completionRate >= 90 ? "colorAccent" : "colorAmber")}>{completionRate}%</span>
                </div>
                <span className={cx(styles.tprOutputLd, m.ldHours === 0 ? "colorRed" : "colorBlue")}>{m.ldHours}h</span>
                <span className={styles.tprOutputSick}>{m.sickDays}d</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
