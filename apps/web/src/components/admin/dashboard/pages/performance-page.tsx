"use client";

import { useMemo, useState } from "react";
import { AdminFilterBar } from "./shared";
import { cx, styles } from "../style";

type StaffMember = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  color: string;
  deliveryScore: number;
  onTimeRate: number;
  clientSat: number;
  billableHours: number;
  totalHours: number;
  billablePct: number;
  retainersManaged: number;
  tasksCompleted: number;
  tasksMissed: number;
  bonusEligible: boolean;
  bonusAmount: number;
  salary: number;
  notes: string;
};

const staff: StaffMember[] = [
  { id: 1, name: "Nomsa Dlamini", role: "Account Manager", avatar: "ND", color: "var(--accent)", deliveryScore: 91, onTimeRate: 88, clientSat: 9.1, billableHours: 142, totalHours: 168, billablePct: 84.5, retainersManaged: 8, tasksCompleted: 47, tasksMissed: 2, bonusEligible: true, bonusAmount: 8500, salary: 42000, notes: "Exceptional retainer health. Minor delay on Kestrel campaign." },
  { id: 2, name: "Renzo Fabbri", role: "Senior Designer", avatar: "RF", color: "var(--blue)", deliveryScore: 86, onTimeRate: 94, clientSat: 8.7, billableHours: 158, totalHours: 168, billablePct: 94.0, retainersManaged: 5, tasksCompleted: 63, tasksMissed: 1, bonusEligible: true, bonusAmount: 6200, salary: 38500, notes: "High output. Slightly below CSAT target due to Dune revisions." },
  { id: 3, name: "Kira Bosman", role: "UX Designer", avatar: "KB", color: "var(--amber)", deliveryScore: 74, onTimeRate: 71, clientSat: 7.8, billableHours: 110, totalHours: 168, billablePct: 65.5, retainersManaged: 3, tasksCompleted: 38, tasksMissed: 7, bonusEligible: false, bonusAmount: 0, salary: 35000, notes: "Missed milestones on Mira Health. Needs performance check-in." },
  { id: 4, name: "Tapiwa Moyo", role: "Copywriter", avatar: "TM", color: "var(--blue)", deliveryScore: 89, onTimeRate: 91, clientSat: 8.9, billableHours: 136, totalHours: 160, billablePct: 85.0, retainersManaged: 4, tasksCompleted: 52, tasksMissed: 3, bonusEligible: true, bonusAmount: 5000, salary: 31000, notes: "Consistent output across all clients. Strong CSAT score." },
  { id: 5, name: "Leilani Fotu", role: "Project Manager", avatar: "LF", color: "var(--accent)", deliveryScore: 95, onTimeRate: 96, clientSat: 9.4, billableHours: 148, totalHours: 168, billablePct: 88.1, retainersManaged: 9, tasksCompleted: 71, tasksMissed: 0, bonusEligible: true, bonusAmount: 10000, salary: 44000, notes: "Top performer. Zero missed tasks. Leads cross-team coordination." }
];

const tabs = ["scoreboard", "delivery & quality", "utilization", "incentive planner"] as const;
type Tab = (typeof tabs)[number];
type RoleFilter = "all" | "account" | "creative" | "ops";
type BandFilter = "all" | "top" | "watch";

function toneClass(color: string): string {
  if (color === "var(--red)") return styles.perfToneRed;
  if (color === "var(--blue)") return styles.perfToneBlue;
  if (color === "var(--amber)") return styles.perfToneAmber;
  if (color === "var(--purple)") return styles.perfTonePurple;
  if (color === "var(--muted)") return styles.perfToneMuted;
  return styles.perfToneAccent;
}

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size <= 28 ? styles.perfAvatar28 : styles.perfAvatar32;
  return (
    <div className={cx("flexCenter", "fontMono", "fw700", "noShrink", styles.perfAvatar, sizeClass, toneClass(color))}>
      {initials}
    </div>
  );
}

function barColor(value: number, good = 85, warn = 70): string {
  if (value >= good) return "var(--accent)";
  if (value >= warn) return "var(--amber)";
  return "var(--red)";
}

export function PerformancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("scoreboard");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [bandFilter, setBandFilter] = useState<BandFilter>("all");
  const [query, setQuery] = useState("");

  const totalBillable = staff.reduce((s, m) => s + m.billableHours, 0);
  const avgDelivery = Math.round(staff.reduce((s, m) => s + m.deliveryScore, 0) / staff.length);
  const avgOnTime = Math.round(staff.reduce((s, m) => s + m.onTimeRate, 0) / staff.length);
  const totalBonus = staff.reduce((s, m) => s + m.bonusAmount, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff
      .filter((m) => {
        if (roleFilter === "all") return true;
        if (roleFilter === "account") return m.role.includes("Account");
        if (roleFilter === "creative") return m.role.includes("Designer") || m.role.includes("Copywriter");
        if (roleFilter === "ops") return m.role.includes("Manager");
        return true;
      })
      .filter((m) => {
        if (bandFilter === "all") return true;
        const isTop = m.deliveryScore >= 90 && m.onTimeRate >= 90 && m.clientSat >= 8.5;
        return bandFilter === "top" ? isTop : !isTop;
      })
      .filter((m) => (q ? m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) : true));
  }, [bandFilter, query, roleFilter]);

  return (
    <div className={cx(styles.pageBody, styles.perfRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / STAFF PERFORMANCE</div>
          <h1 className={styles.pageTitle}>Performance Overview</h1>
          <div className={styles.pageSub}>Delivery, quality, utilization, and incentive readiness across the team.</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Report</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Avg Delivery Score", value: `${avgDelivery}/100`, color: barColor(avgDelivery), sub: "Current month" },
          { label: "Avg On-Time Rate", value: `${avgOnTime}%`, color: barColor(avgOnTime, 90, 75), sub: "Across active staff" },
          { label: "Team Billable Hours", value: `${totalBillable}h`, color: "var(--blue)", sub: "Target: 800h" },
          { label: "Bonus Pool", value: `R${(totalBonus / 1000).toFixed(1)}k`, color: "var(--accent)", sub: `${staff.filter((s) => s.bonusEligible).length} eligible staff` }
        ].map((kpi) => (
          <div key={kpi.label} className={styles.statCard}>
            <div className={styles.statLabel}>{kpi.label}</div>
            <div className={cx(styles.statValue, "mb4", styles.perfToneText, toneClass(kpi.color))}>{kpi.value}</div>
            <div className={cx("text11", "colorMuted")}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className={cx("overflowAuto", "minH0")}>
        <AdminFilterBar panelColor="var(--surface)" borderColor="var(--border)">
          <select title="Select tab" value={activeTab} onChange={(e) => setActiveTab(e.target.value as Tab)} className={styles.formInput}>
            {tabs.map((tab) => (
              <option key={tab} value={tab}>{tab}</option>
            ))}
          </select>
          <select title="Filter by role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} className={styles.formInput}>
            <option value="all">Role: All</option>
            <option value="account">Role: Account</option>
            <option value="creative">Role: Creative</option>
            <option value="ops">Role: Ops</option>
          </select>
          <select title="Filter by band" value={bandFilter} onChange={(e) => setBandFilter(e.target.value as BandFilter)} className={styles.formInput}>
            <option value="all">Band: All</option>
            <option value="top">Band: Top performers</option>
            <option value="watch">Band: Watchlist</option>
          </select>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff" className={cx("formInput", styles.perfSearchInput)} />
        </AdminFilterBar>

        {activeTab === "scoreboard" ? (
          <div className={cx("card", "overflowHidden")}>
            <div className={cx("perfScoreHead", "text10", "colorMuted", "uppercase", "fontMono")}>
              {[
                "Staff",
                "Delivery",
                "On-time",
                "CSAT",
                "Utilization",
                "Tasks (done/missed)",
                "Bonus"
              ].map((h) => <span key={h}>{h}</span>)}
            </div>
            {filtered.map((m) => (
              <div key={m.id} className={cx(styles.perfScoreRow, (m.deliveryScore < 80 || m.onTimeRate < 75) && styles.perfScoreWarn)}>
                <div className={cx("flexRow", "gap10")}>
                  <Avatar initials={m.avatar} color={m.color} size={28} />
                  <div>
                    <div className={cx("fw600", "text13")}>{m.name}</div>
                    <div className={cx("text10", "colorMuted")}>{m.role}</div>
                  </div>
                </div>
                <span className={cx("fontMono", "fw700", styles.perfToneText, toneClass(barColor(m.deliveryScore)))}>{m.deliveryScore}</span>
                <span className={cx("fontMono", "fw700", styles.perfToneText, toneClass(barColor(m.onTimeRate, 90, 75)))}>{m.onTimeRate}%</span>
                <span className={cx("fontMono", "fw700", styles.perfToneText, toneClass(m.clientSat >= 8.5 ? "var(--accent)" : m.clientSat >= 7.5 ? "var(--amber)" : "var(--red)"))}>{m.clientSat}/10</span>
                <span className={cx("fontMono", "fw700", styles.perfToneText, toneClass(m.billablePct >= 80 ? "var(--accent)" : m.billablePct >= 70 ? "var(--amber)" : "var(--red)"))}>{m.billablePct}%</span>
                <span className={cx("fontMono", "colorMuted")}>{m.tasksCompleted}/{m.tasksMissed}</span>
                <span className={cx("fontMono", "fw700", styles.perfToneText, toneClass(m.bonusEligible ? "var(--accent)" : "var(--red)"))}>{m.bonusEligible ? `R${m.bonusAmount.toLocaleString()}` : "Not eligible"}</span>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "delivery & quality" ? (
          <div className={cx("grid2")}>
            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12", "uppercase")}>Delivery Ranking</div>
              {filtered.slice().sort((a, b) => b.deliveryScore - a.deliveryScore).map((m) => (
                <div key={m.id} className={cx("mb12")}>
                  <div className={cx("flexBetween", "mb4")}>
                    <span className={cx("text12")}>{m.name}</span>
                    <span className={cx("fontMono", "fw700", styles.perfToneText, toneClass(barColor(m.deliveryScore)))}>{m.deliveryScore}</span>
                  </div>
                  <div className={cx("h6", styles.perfBarTrack)}>
                    <progress className={cx(styles.perfBarFill, toneClass(barColor(m.deliveryScore)))} max={100} value={m.deliveryScore} aria-label={`${m.name} delivery score ${m.deliveryScore}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12", "uppercase")}>Quality Notes</div>
              {filtered.map((m) => (
                <div key={m.id} className={cx("py10", "borderB")}>
                  <div className={cx("flexBetween", "mb4")}>
                    <span className={cx("text12", "fw600")}>{m.name}</span>
                    <span className={cx("text10", "fontMono", styles.perfToneTag, toneClass(m.tasksMissed > 3 ? "var(--red)" : "var(--accent)"))}>{m.tasksMissed > 3 ? "watch" : "stable"}</span>
                  </div>
                  <div className={cx("text11", "colorMuted", styles.perfLine16)}>{m.notes}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "utilization" ? (
          <div className={cx("card", "overflowHidden")}>
            <div className={cx("perfUtilHead", "text10", "colorMuted", "uppercase", "fontMono")}>
              {["Staff", "Billable", "Non-bill", "Total", "Util %", "Revenue gen"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {filtered.map((m) => {
              const nonBill = m.totalHours - m.billableHours;
              const revenue = Math.round(m.billableHours * (m.salary / 168) * 2.8);
              return (
                <div key={m.id} className={styles.perfUtilRow}>
                  <div className={cx("flexRow", "gap10")}>
                    <Avatar initials={m.avatar} color={m.color} size={28} />
                    <span className={cx("fw600", "text13")}>{m.name}</span>
                  </div>
                  <span className={cx("fontMono", "fw700", "colorAccent")}>{m.billableHours}h</span>
                  <span className={cx("fontMono", "colorMuted")}>{nonBill}h</span>
                  <span className={cx("fontMono", "colorMuted")}>{m.totalHours}h</span>
                  <span className={cx("fontMono", "fw700", styles.perfToneText, toneClass(m.billablePct >= 80 ? "var(--accent)" : m.billablePct >= 70 ? "var(--amber)" : "var(--red)"))}>{m.billablePct}%</span>
                  <span className={cx("fontMono", "fw700", "colorBlue")}>R{(revenue / 1000).toFixed(0)}k</span>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "incentive planner" ? (
          <div className={styles.perfIncentiveSplit}>
            <div className={cx("card", "overflowHidden")}>
              <div className={cx("perfIncentiveHead", "text10", "colorMuted", "uppercase", "fontMono")}>
                {["Staff", "Delivery", "Util %", "CSAT", "Current bonus"].map((h) => <span key={h}>{h}</span>)}
              </div>
              {filtered.map((m) => (
                <div key={m.id} className={styles.perfIncentiveRow}>
                  <div className={cx("flexRow", "gap10")}>
                    <Avatar initials={m.avatar} color={m.color} size={28} />
                    <span className={cx("fw600", "text13")}>{m.name}</span>
                  </div>
                  <span className={cx("fontMono", "fw700", styles.perfToneText, toneClass(barColor(m.deliveryScore)))}>{m.deliveryScore}</span>
                  <span className={cx("fontMono", "fw700", styles.perfToneText, toneClass(m.billablePct >= 80 ? "var(--accent)" : m.billablePct >= 70 ? "var(--amber)" : "var(--red)"))}>{m.billablePct}%</span>
                  <span className={cx("fontMono", "fw700", styles.perfToneText, toneClass(m.clientSat >= 8.5 ? "var(--accent)" : "var(--amber)"))}>{m.clientSat}</span>
                  <span className={cx("fontMono", "fw700", styles.perfToneText, toneClass(m.bonusEligible ? "var(--accent)" : "var(--red)"))}>{m.bonusEligible ? `R${m.bonusAmount.toLocaleString()}` : "Not eligible"}</span>
                </div>
              ))}
            </div>

            <div className={cx("card", "p20")}>
              <div className={cx("text12", "fw700", "mb12", "uppercase")}>Incentive Policy</div>
              <div className={cx("text12", "colorMuted", "mb12", styles.perfLine17)}>
                Bonus eligibility should combine output and behavior signals. Do not tie payout to a single metric.
              </div>
              {[
                "Delivery score >= 80",
                "On-time rate >= 75%",
                "Billable utilization >= 70%",
                "Client satisfaction >= 8.0"
              ].map((rule) => (
                <div key={rule} className={cx("text12", "py10", "borderB")}>
                  {rule}
                </div>
              ))}
              <div className={cx("flexBetween", "mt14")}>
                <span className={cx("fw700")}>Total bonus pool</span>
                <span className={cx("fontMono", "fw800", "colorAccent")}>R{totalBonus.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
