// ════════════════════════════════════════════════════════════════════════════
// resource-allocation-page.tsx — Admin resource allocation wired to real API
// Data   : loadAllStaffWithRefresh     → staff list with department/role
//          loadTimeEntriesWithRefresh  → time entries to compute utilisation
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminStaffProfile } from "../../../../lib/api/admin/hr";
import { loadAllStaffWithRefresh } from "../../../../lib/api/admin/hr";
import type { ProjectTimeEntry } from "../../../../lib/api/admin/types";
import { loadTimeEntriesWithRefresh } from "../../../../lib/api/admin/tasks";

// ── Constants ─────────────────────────────────────────────────────────────────

const CAPACITY = 40; // hours per week

// ── Helpers ───────────────────────────────────────────────────────────────────

function weekStart(offset = 0): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function weekLabel(offset = 0): string {
  const d = new Date(weekStart(offset));
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function minutesToHours(minutes: number): number {
  return Math.round(minutes / 60);
}

function staffColor(idx: number): string {
  const colors = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--red)"];
  return colors[idx % colors.length];
}

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
  if (hours >= 8)  return styles.resAllocW20;
  if (hours >= 6)  return styles.resAllocW15;
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

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

type Tab = "weekly grid" | "capacity overview" | "by project";
const tabs: Tab[] = ["weekly grid", "capacity overview", "by project"];

const WEEK_OFFSETS = [0, 1, 2, 3, 4];

// ── Component ─────────────────────────────────────────────────────────────────

export function ResourceAllocationPage({ session, onNotify }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("weekly grid");
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [staff, setStaff] = useState<AdminStaffProfile[]>([]);
  const [timeEntries, setTimeEntries] = useState<ProjectTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const weeks = useMemo(() => WEEK_OFFSETS.map((o) => weekLabel(o)), []);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void (async () => {
      const from = weekStart(0);
      const [staffRes, timeRes] = await Promise.all([
        loadAllStaffWithRefresh(session),
        loadTimeEntriesWithRefresh(session, { from, limit: 500 })
      ]);
      if (cancelled) return;
      if (staffRes.nextSession) saveSession(staffRes.nextSession);
      if (timeRes.nextSession) saveSession(timeRes.nextSession);
      if (staffRes.error) onNotify("error", staffRes.error.message);
      if (timeRes.error) onNotify("warning", "Could not load time entries.");
      setStaff((staffRes.data ?? []).filter((s) => s.isActive));
      setTimeEntries(timeRes.data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  // Compute hours logged per staff member (this week = offset 0)
  const hoursPerStaff = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of timeEntries) {
      const uid = entry.staffUserId ?? entry.staffName ?? "unknown";
      map[uid] = (map[uid] ?? 0) + minutesToHours(entry.minutes);
    }
    return map;
  }, [timeEntries]);

  // Build a per-staff allocation row for the weekly grid
  const staffRows = useMemo(() => staff.map((s, idx) => {
    const uid = s.userId;
    const loggedHours = hoursPerStaff[uid] ?? 0;
    const color = staffColor(idx);
    return {
      id: s.id,
      name: s.name,
      role: s.role,
      avatar: s.avatarInitials ?? s.name.slice(0, 2).toUpperCase(),
      color,
      loggedHours,
    };
  }), [staff, hoursPerStaff]);

  // Summary stats for the selected week
  const weekStats = useMemo(() => {
    const totalLogged = selectedWeek === 0
      ? staffRows.reduce((s, m) => s + m.loggedHours, 0)
      : 0; // no historical data for future weeks
    const overallocated = staffRows.filter((m) => m.loggedHours > CAPACITY).length;
    const underutilised = staffRows.filter((m) => m.loggedHours < CAPACITY * 0.7).length;
    const teamUtil = staff.length > 0
      ? Math.round((staffRows.reduce((s, m) => s + Math.min(m.loggedHours, CAPACITY), 0) / (staff.length * CAPACITY)) * 100)
      : 0;
    return { totalLogged, overallocated, underutilised, teamUtil };
  }, [staffRows, selectedWeek, staff.length]);

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
        {[
          { label: "Team Utilisation",  value: `${weekStats.teamUtil}%`,    color: weekStats.teamUtil >= 80 ? "var(--accent)" : "var(--amber)", sub: `Week of ${weeks[selectedWeek]}` },
          { label: "Overallocated",     value: String(weekStats.overallocated), color: weekStats.overallocated > 0 ? "var(--red)" : "var(--accent)", sub: `> ${CAPACITY}h capacity` },
          { label: "Underutilised",     value: String(weekStats.underutilised), color: weekStats.underutilised > 0 ? "var(--amber)" : "var(--accent)", sub: `< ${Math.round(CAPACITY * 0.7)}h this week` },
          { label: "Total Staff Hours", value: `${weekStats.totalLogged}h`, color: "var(--blue)",   sub: `Cap: ${staff.length * CAPACITY}h` },
        ].map((s) => (
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
          {staff.length === 0 && <div className={cx("text13", "colorMuted")}>No active staff members found.</div>}
          <div className={cx("flexCol", "gap16")}>
            {staffRows.map((member) => {
              const hours = selectedWeek === 0 ? member.loggedHours : 0;
              const isOver = hours > CAPACITY;
              const util = Math.round((hours / CAPACITY) * 100);
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
                      <div className={cx("fontMono", "fw800", styles.resAllocHourTotal, toneClass(utilColor))}>{hours}h</div>
                      <div className={cx("text11", "colorMuted")}>of {CAPACITY}h - {util}%</div>
                    </div>
                  </div>

                  <div className={cx("flexRow", "overflowHidden", "mb12", styles.resAllocBar)}>
                    {hours > 0 && (
                      <div
                        title={`${member.name}: ${hours}h`}
                        className={cx("flexCenter", "fw700", styles.resAllocBarSeg, allocWidthClass(hours), toneClass(member.color))}
                      >
                        {hours >= 6 ? `${hours}h` : ""}
                      </div>
                    )}
                    {isOver && <div className={cx("flexCenter", styles.resAllocBarOver, styles.resAllocWAuto)}>+{hours - CAPACITY}h</div>}
                  </div>

                  <div className={cx("flexRow", "flexWrap", "gap10")}>
                    <div className={cx("flexRow", "gap6", "text11")}>
                      <div className={cx(styles.resAllocLegendDot, toneClass(member.color))} />
                      <span className={cx("colorMuted")}>{member.role}</span>
                      <span className={cx("fontMono", styles.resAllocToneText, toneClass(member.color))}>{hours}h logged</span>
                    </div>
                  </div>

                  {isOver ? <div className={styles.resAllocWarn}>&#x26A0; Overallocated by {hours - CAPACITY}h - review assignments</div> : null}
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
              <span key={w} className={cx("textCenter")}>w/c {w}</span>
            ))}
          </div>
          {staffRows.map((member, ri) => (
            <div key={member.id} className={cx("resAllocCapGrid", "gap12", styles.resAllocCapRow, ri < staffRows.length - 1 && "borderB")}>
              <div className={cx("flexRow", "gap10")}>
                <Avatar initials={member.avatar} color={member.color} size={28} />
                <div>
                  <div className={cx("text13", "fw600")}>{member.name.split(" ")[0]}</div>
                  <div className={cx("text10", "colorMuted")}>{member.role}</div>
                </div>
              </div>
              {weeks.map((w, wi) => {
                const total = wi === 0 ? member.loggedHours : 0;
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
          {staffRows.length === 0 && (
            <div className={cx("p20", "text13", "colorMuted")}>No active staff found.</div>
          )}
          <div className={cx("resAllocCapGrid", "gap12", "bgSurface", styles.resAllocCapFoot)}>
            <span className={cx("text12", "fw700", "colorAccent")}>Team Total</span>
            {weeks.map((w, wi) => {
              const total = wi === 0 ? staffRows.reduce((s, m) => s + m.loggedHours, 0) : 0;
              const cap = staff.length * CAPACITY;
              const pct = cap > 0 ? Math.round((total / cap) * 100) : 0;
              return (
                <div key={w} className={cx("textCenter")}>
                  <div className={cx("fontMono", "fw800", styles.resAllocCapValue, pct >= 80 ? "toneAccent" : "toneAmber")}>{total}h</div>
                  <div className={cx("text10", "colorMuted")}>{pct}% of {cap}h cap</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "by project" && (
        <div className={cx("flexCol", "gap16")}>
          {staff.length === 0 && <div className={cx("text13", "colorMuted")}>No active staff found.</div>}
          {staffRows.map((member, idx) => {
            const color = staffColor(idx);
            return (
              <div key={member.id} className={cx("card", "p24", styles.resAllocProjectCard, toneClass(color))}>
                <div className={cx("flexBetween", "mb16")}>
                  <div>
                    <div className={cx("fw700", styles.resAllocProjectName)}>{member.name}</div>
                    <div className={cx("text12", styles.resAllocToneText, toneClass(color))}>{member.role}</div>
                  </div>
                  <Avatar initials={member.avatar} color={color} size={28} />
                </div>
                <div className={cx("resAllocWeekGrid", "gap8")}>
                  {weeks.map((w, wi) => {
                    const hrs = wi === 0 ? member.loggedHours : 0;
                    return (
                      <div key={w} className={cx("bgBg", "textCenter", "p12", styles.resAllocWeekCell)}>
                        <div className={cx("fontMono", "fw700", styles.resAllocWeekHours, styles.resAllocToneText, toneClass(color))}>{hrs}h</div>
                        <div className={cx("colorMuted", "mt4", styles.resAllocWeekLabel)}>w/c {w}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
