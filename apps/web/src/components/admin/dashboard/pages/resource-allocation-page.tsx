"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

const weeks = ["Feb 24", "Mar 3", "Mar 10", "Mar 17", "Mar 24"] as const;
const CAPACITY = 40;

const staff = [
  {
    id: "RF",
    name: "Renzo Fabbri",
    role: "Creative Director",
    color: "var(--amber)",
    avatar: "RF",
    allocations: [
      { project: "Volta Brand", client: "Volta Studios", clientColor: "var(--accent)", hours: [16, 12, 8, 8, 4] },
      { project: "Dune Editorial", client: "Dune Collective", clientColor: "var(--amber)", hours: [14, 18, 20, 12, 8] },
      { project: "Internal", client: "Internal", clientColor: "var(--muted)", hours: [4, 4, 4, 4, 4] },
    ],
  },
  {
    id: "KB",
    name: "Kira Bosman",
    role: "UX Designer",
    color: "var(--accent)",
    avatar: "KB",
    allocations: [
      { project: "Mira Website", client: "Mira Health", clientColor: "var(--blue)", hours: [24, 28, 32, 20, 16] },
      { project: "Internal", client: "Internal", clientColor: "var(--muted)", hours: [4, 4, 4, 4, 4] },
    ],
  },
  {
    id: "ND",
    name: "Nomsa Dlamini",
    role: "Account Manager",
    color: "var(--accent)",
    avatar: "ND",
    allocations: [
      { project: "Kestrel Campaign", client: "Kestrel Capital", clientColor: "var(--accent)", hours: [12, 10, 8, 6, 4] },
      { project: "Volta AM", client: "Volta Studios", clientColor: "var(--accent)", hours: [10, 10, 10, 10, 10] },
      { project: "Mira AM", client: "Mira Health", clientColor: "var(--blue)", hours: [8, 8, 8, 8, 8] },
      { project: "Internal", client: "Internal", clientColor: "var(--muted)", hours: [4, 4, 4, 4, 4] },
    ],
  },
  {
    id: "TM",
    name: "Tapiwa Moyo",
    role: "Copywriter",
    color: "var(--amber)",
    avatar: "TM",
    allocations: [
      { project: "Okafor Annual Report", client: "Okafor & Sons", clientColor: "var(--amber)", hours: [16, 12, 8, 4, 0] },
      { project: "Kestrel Copy", client: "Kestrel Capital", clientColor: "var(--accent)", hours: [10, 10, 8, 6, 4] },
      { project: "Internal", client: "Internal", clientColor: "var(--muted)", hours: [4, 4, 4, 4, 4] },
    ],
  },
  {
    id: "LF",
    name: "Leilani Fotu",
    role: "Project Manager",
    color: "var(--blue)",
    avatar: "LF",
    allocations: [
      { project: "Portfolio PM", client: "All Clients", clientColor: "var(--accent)", hours: [24, 24, 24, 24, 24] },
      { project: "Admin Ops", client: "Internal", clientColor: "var(--muted)", hours: [8, 8, 8, 8, 8] },
    ],
  },
] as const;

const projectColors: Record<string, string> = {
  "Volta Studios": "var(--accent)",
  "Kestrel Capital": "var(--accent)",
  "Mira Health": "var(--blue)",
  "Dune Collective": "var(--amber)",
  "Okafor & Sons": "var(--amber)",
  "All Clients": "var(--accent)",
  Internal: "var(--muted)",
};

function allocWidthClass(hours: number): string {
  if (hours >= 32) return styles.resAllocW80;
  if (hours >= 28) return styles.resAllocW70;
  if (hours >= 24) return styles.resAllocW60;
  if (hours >= 20) return styles.resAllocW50;
  if (hours >= 18) return styles.resAllocW45;
  if (hours >= 16) return styles.resAllocW40;
  if (hours >= 14) return styles.resAllocW35;
  if (hours >= 12) return styles.resAllocW30;
  if (hours >= 10) return styles.resAllocW25;
  if (hours >= 8) return styles.resAllocW20;
  if (hours >= 6) return styles.resAllocW15;
  return styles.resAllocW10;
}

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size <= 28 ? styles.resAllocAvatar28 : styles.resAllocAvatar36;
  return (
    <div className={cx("fontMono", "flexCenter", "noShrink", "fw700", styles.resAllocAvatar, sizeClass, toneClass(color))}>
      {initials}
    </div>
  );
}

type Tab = "weekly grid" | "capacity overview" | "by project";
const tabs: Tab[] = ["weekly grid", "capacity overview", "by project"];

export function ResourceAllocationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("weekly grid");
  const [selectedWeek, setSelectedWeek] = useState(0);

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / OPERATIONS</div>
          <h1 className={styles.pageTitle}>Resource Allocation</h1>
          <div className={styles.pageSub}>Staff capacity - Project assignments - Overallocation alerts</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Plan</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>Adjust Allocation</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {(() => {
          const weekTotals = staff.map((s) => ({
            name: s.name,
            color: s.color,
            total: s.allocations.reduce((sum, a) => sum + a.hours[selectedWeek], 0),
          }));
          const overallocated = weekTotals.filter((w) => w.total > CAPACITY).length;
          const underutilised = weekTotals.filter((w) => w.total < CAPACITY * 0.7).length;
          const teamUtil = Math.round((weekTotals.reduce((s, w) => s + w.total, 0) / (staff.length * CAPACITY)) * 100);
          return [
            { label: "Team Utilisation", value: `${teamUtil}%`, color: teamUtil >= 80 ? "var(--accent)" : "var(--amber)", sub: `Week of ${weeks[selectedWeek]}` },
            { label: "Overallocated", value: overallocated.toString(), color: overallocated > 0 ? "var(--red)" : "var(--accent)", sub: `> ${CAPACITY}h capacity` },
            { label: "Underutilised", value: underutilised.toString(), color: underutilised > 0 ? "var(--amber)" : "var(--accent)", sub: `< ${Math.round(CAPACITY * 0.7)}h this week` },
            { label: "Total Staff Hours", value: `${weekTotals.reduce((s, w) => s + w.total, 0)}h`, color: "var(--blue)", sub: `Cap: ${staff.length * CAPACITY}h` },
          ];
        })().map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, "resAllocToneText", toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="View" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {activeTab === "weekly grid" ? (
          <select title="Week" value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))} className={styles.filterSelect}>
            {weeks.map((w, i) => <option key={w} value={i}>w/c {w}</option>)}
          </select>
        ) : null}
      </div>

      {activeTab === "weekly grid" && (
        <div>
          <div className={cx("flexCol", "gap16")}>
            {staff.map((member) => {
              const weekTotal = member.allocations.reduce((s, a) => s + a.hours[selectedWeek], 0);
              const isOver = weekTotal > CAPACITY;
              const util = Math.round((weekTotal / CAPACITY) * 100);
              const utilColor = isOver ? "var(--red)" : util >= 80 ? "var(--accent)" : "var(--amber)";
              return (
                <div key={member.id} className={cx("card", "p24", isOver && styles.resAllocOverCard)}>
                  <div className={cx("flexRow", "gap16", "mb16")}>
                    <Avatar initials={member.avatar} color={member.color} />
                    <div className={styles.resAllocGrow}>
                      <div className={cx("fw700")}>{member.name}</div>
                      <div className={cx("text12", "colorMuted")}>{member.role}</div>
                    </div>
                    <div className={cx("textRight")}>
                      <div className={cx("fontMono", "fw800", styles.resAllocHourTotal, toneClass(utilColor))}>{weekTotal}h</div>
                      <div className={cx("text11", "colorMuted")}>
                        of {CAPACITY}h - {util}%
                      </div>
                    </div>
                  </div>

                  <div className={cx("flexRow", "overflowHidden", "mb12", styles.resAllocBar)}>
                    {member.allocations.map((alloc, i) => {
                      const hours = alloc.hours[selectedWeek];
                      if (hours === 0) return null;
                      return (
                        <div
                          key={i}
                          title={`${alloc.project}: ${hours}h`}
                          className={cx("flexCenter", "fw700", styles.resAllocBarSeg, allocWidthClass(hours), toneClass(projectColors[alloc.client] || "var(--muted)"))}
                        >
                          {hours >= 6 ? `${hours}h` : ""}
                        </div>
                      );
                    })}
                    {isOver ? <div className={cx("flexCenter", styles.resAllocBarOver, styles.resAllocWAuto)}>+{weekTotal - CAPACITY}h</div> : null}
                  </div>

                  <div className={cx("flexRow", "flexWrap", "gap10")}>
                    {member.allocations.map(
                      (alloc, i) =>
                        alloc.hours[selectedWeek] > 0 && (
                          <div key={i} className={cx("flexRow", "gap6", "text11")}>
                            <div className={cx(styles.resAllocLegendDot, toneClass(projectColors[alloc.client] || "var(--muted)"))} />
                            <span className={cx("colorMuted")}>{alloc.project}</span>
                            <span className={cx("fontMono", styles.resAllocToneText, toneClass(projectColors[alloc.client] || "var(--muted)"))}>{alloc.hours[selectedWeek]}h</span>
                          </div>
                        )
                    )}
                  </div>

                  {isOver ? <div className={styles.resAllocWarn}>&#x26A0; Overallocated by {weekTotal - CAPACITY}h - review assignments</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "capacity overview" && (
        <div className={cx("card", "overflowHidden", "p0")}>
          <div className={cx("resAllocCapGrid", "px20", "borderB", "text10", "colorMuted", "uppercase", "gap12", styles.resAllocCapHead)}>
            <span>Staff Member</span>
            {weeks.map((w) => (
              <span key={w} className={cx("textCenter")}>
                w/c {w}
              </span>
            ))}
          </div>
          {staff.map((member, ri) => (
            <div key={member.id} className={cx("resAllocCapGrid", "gap12", styles.resAllocCapRow, ri < staff.length - 1 && "borderB")}>
              <div className={cx("flexRow", "gap10")}>
                <Avatar initials={member.avatar} color={member.color} size={28} />
                <div>
                  <div className={cx("text13", "fw600")}>{member.name.split(" ")[0]}</div>
                  <div className={cx("text10", "colorMuted")}>{member.role}</div>
                </div>
              </div>
              {weeks.map((w, wi) => {
                const total = member.allocations.reduce((s, a) => s + a.hours[wi], 0);
                const pct = Math.round((total / CAPACITY) * 100);
                const color = total > CAPACITY ? "var(--red)" : pct >= 80 ? "var(--accent)" : pct >= 60 ? "var(--amber)" : "var(--muted)";
                return (
                  <div key={w} className={cx("textCenter")}>
                    <div className={cx("fontMono", "fw700", styles.resAllocCapValue, toneClass(color))}>{total}h</div>
                    <div className={cx("progressBar", styles.resAllocCapBar)}>
                      <progress className={cx("barFill", "uiProgress", toneClass(color))} max={100} value={Math.min(pct, 100)} />
                    </div>
                    <div className={cx(styles.resAllocPctText, "resAllocToneText", toneClass(color))}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          ))}
          <div className={cx("resAllocCapGrid", "gap12", "bgSurface", styles.resAllocCapFoot)}>
            <span className={cx("text12", "fw700", "colorAccent")}>Team Total</span>
            {weeks.map((w, wi) => {
              const total = staff.reduce((s, m) => s + m.allocations.reduce((s2, a) => s2 + a.hours[wi], 0), 0);
              const cap = staff.length * CAPACITY;
              const pct = Math.round((total / cap) * 100);
              return (
                <div key={w} className={cx("textCenter")}>
                  <div className={cx("fontMono", "fw800", styles.resAllocCapValue, pct >= 80 ? "toneAccent" : "toneAmber")}>{total}h</div>
                  <div className={cx("text10", "colorMuted")}>
                    {pct}% of {cap}h cap
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "by project" && (
        <div className={cx("flexCol", "gap16")}>
          {[
            { name: "Brand Identity System", client: "Volta Studios", color: "var(--accent)" },
            { name: "Q1 Campaign Strategy", client: "Kestrel Capital", color: "var(--accent)" },
            { name: "Website Redesign", client: "Mira Health", color: "var(--blue)" },
            { name: "Editorial Design System", client: "Dune Collective", color: "var(--amber)" },
            { name: "Annual Report 2025", client: "Okafor & Sons", color: "var(--amber)" },
          ].map((project) => {
            const assignedStaff = staff.filter((m) => m.allocations.some((a) => a.client === project.client));
            const weeklyHours = weeks.map((_, wi) => assignedStaff.reduce((s, m) => s + m.allocations.filter((a) => a.client === project.client).reduce((s2, a) => s2 + a.hours[wi], 0), 0));
            return (
              <div key={project.name} className={cx("card", "p24", styles.resAllocProjectCard, toneClass(project.color))}>
                <div className={cx("flexBetween", "mb16")}>
                  <div>
                    <div className={cx("fw700", styles.resAllocProjectName)}>{project.name}</div>
                    <div className={cx("text12", styles.resAllocToneText, toneClass(project.color))}>{project.client}</div>
                  </div>
                  <div className={cx("flexRow", "gap8")}>{assignedStaff.map((m) => <Avatar key={m.id} initials={m.avatar} color={m.color} size={28} />)}</div>
                </div>
                <div className={cx("resAllocWeekGrid", "gap8")}>
                  {weeks.map((w, wi) => (
                    <div key={w} className={cx("bgBg", "textCenter", "p12", styles.resAllocWeekCell)}>
                      <div className={cx("fontMono", "fw700", styles.resAllocWeekHours, styles.resAllocToneText, toneClass(project.color))}>{weeklyHours[wi]}h</div>
                      <div className={cx("colorMuted", "mt4", styles.resAllocWeekLabel)}>w/c {w}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
