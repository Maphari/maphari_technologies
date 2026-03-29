"use client";

import { useMemo, useState } from "react";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { AdminFilterBar } from "./shared";
import { colorClass } from "./admin-page-utils";
import type { AdminProject, AdminClient } from "../../../../lib/api/admin/types";

type ProjectStatus = "on-track" | "at-risk" | "off-track" | "complete";
type Tab = "board" | "list" | "health map";
type StatusFilter = "All" | "on-track" | "at-risk" | "off-track";

interface PortfolioProject {
  id: string;
  client: string;
  clientColor: string;
  clientAvatar: string;
  name: string;
  type: string;
  status: ProjectStatus;
  phase: string;
  completion: number;
  owner: string;
  ownerAvatar: string;
  startDate: string;
  dueDate: string;
  daysLeft: number;
  budget: number;
  spent: number;
  spentPct: number;
  blockers: string[];
  tasksTotal: number;
  tasksDone: number;
  tasksOverdue: number;
  health: number;
  lastUpdate: string;
}

function clientColorForId(id: string): string {
  const palette = [
    "var(--accent)", "var(--blue)", "var(--purple)",
    "var(--amber)", "var(--muted)", "var(--red)"
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function deriveStatus(project: AdminProject): ProjectStatus {
  const s = project.status.toUpperCase();
  if (["COMPLETED", "DONE"].includes(s)) return "complete";
  if (["BLOCKED", "DELAYED", "CANCELLED", "ON_HOLD"].includes(s)) return "off-track";
  if (project.riskLevel === "HIGH" || s === "REVIEW") return "at-risk";
  return "on-track";
}

function deriveDaysLeft(dueAt: string | null): number {
  if (!dueAt) return 99;
  return Math.ceil((new Date(dueAt).getTime() - Date.now()) / 86400000);
}

function deriveHealth(project: AdminProject): number {
  const daysLeft = deriveDaysLeft(project.dueAt);
  let score = 70 + Math.min(20, Math.round(project.progressPercent / 5));
  if (project.riskLevel === "HIGH") score -= 24;
  else if (project.riskLevel === "MEDIUM") score -= 10;
  if (daysLeft < 0) score -= 15;
  else if (daysLeft < 7) score -= 8;
  return Math.max(0, Math.min(100, score));
}

function derivePhase(progressPercent: number): string {
  if (progressPercent < 15) return "Discovery";
  if (progressPercent < 30) return "Strategy";
  if (progressPercent < 50) return "Design";
  if (progressPercent < 70) return "Execution";
  if (progressPercent < 85) return "Review";
  if (progressPercent < 100) return "Final Review";
  return "Complete";
}

function mapToPortfolio(project: AdminProject, client: AdminClient | undefined): PortfolioProject {
  const status = deriveStatus(project);
  const daysLeft = deriveDaysLeft(project.dueAt);
  const budgetCents = project.budgetCents;
  // Estimate spend from progress (no spend field in AdminProject)
  const spentCents = Math.round(budgetCents * project.progressPercent / 100);
  const spentPct = budgetCents > 0 ? Math.round((spentCents / budgetCents) * 100) : 0;
  const clientColor = clientColorForId(client?.id ?? project.clientId);
  const clientName = client?.name ?? "Unknown";
  const initials = clientName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const ownerName = project.ownerName ?? "Unassigned";
  const ownerInitials = ownerName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const fmtDate = (v: string | null) => {
    if (!v) return "—";
    return new Intl.DateTimeFormat("en-ZA", { month: "short", day: "2-digit" }).format(new Date(v));
  };
  return {
    id: project.id,
    client: clientName,
    clientColor,
    clientAvatar: initials,
    name: project.name,
    type: project.description ? project.description.split(" ").slice(0, 3).join(" ") : "Project",
    status,
    phase: derivePhase(project.progressPercent),
    completion: project.progressPercent,
    owner: ownerName,
    ownerAvatar: ownerInitials,
    startDate: fmtDate(project.startAt),
    dueDate: fmtDate(project.dueAt),
    daysLeft,
    budget: Math.round(budgetCents / 100),
    spent: Math.round(spentCents / 100),
    spentPct,
    blockers: project.riskLevel === "HIGH" ? ["High risk flag"] : [],
    tasksTotal: 0,
    tasksDone: Math.round(project.progressPercent / 10),
    tasksOverdue: 0,
    health: deriveHealth(project),
    lastUpdate: fmtDate(project.updatedAt),
  };
}

const statusConfig: Record<ProjectStatus, { color: string; label: string }> = {
  "on-track": { color: "var(--accent)", label: "On Track" },
  "at-risk": { color: "var(--amber)", label: "At Risk" },
  "off-track": { color: "var(--red)", label: "Off Track" },
  complete: { color: "var(--blue)", label: "Complete" }
};

const phases = ["Discovery", "Strategy", "Design", "Execution", "Review", "Final Review", "Complete"];

function completionClass(value: number): string {
  if (value >= 75) return "colorAccent";
  if (value >= 40) return "colorBlue";
  return "colorMuted";
}

function spentClass(value: number): string {
  if (value > 100) return "colorRed";
  if (value > 85) return "colorAmber";
  return "colorAccent";
}

function dueClass(daysLeft: number): string {
  if (daysLeft <= 7) return "colorRed";
  if (daysLeft <= 21) return "colorAmber";
  return "colorMuted";
}

function healthClass(value: number): string {
  if (value >= 80) return "colorAccent";
  if (value >= 60) return "colorAmber";
  return "colorRed";
}

function toneVarClass(value: string): string {
  if (value === "var(--red)") return styles.pportToneRed;
  if (value === "var(--blue)") return styles.pportToneBlue;
  if (value === "var(--amber)") return styles.pportToneAmber;
  if (value === "var(--purple)") return styles.pportTonePurple;
  if (value === "var(--muted)") return styles.pportToneMuted;
  if (value === "var(--border)") return styles.pportToneBorder;
  return styles.pportToneAccent;
}

function fillClass(value: string): string {
  if (value === "var(--red)") return styles.pportFillRed;
  if (value === "var(--blue)") return styles.pportFillBlue;
  if (value === "var(--amber)") return styles.pportFillAmber;
  if (value === "var(--purple)") return styles.pportFillPurple;
  if (value === "var(--muted)") return styles.pportFillMuted;
  if (value === "var(--border)") return styles.pportFillBorder;
  return styles.pportFillAccent;
}

function statusClass(value: string): string {
  if (value === "var(--red)") return styles.pportStatusRed;
  if (value === "var(--blue)") return styles.pportStatusBlue;
  if (value === "var(--amber)") return styles.pportStatusAmber;
  if (value === "var(--purple)") return styles.pportStatusPurple;
  if (value === "var(--muted)") return styles.pportStatusMuted;
  return styles.pportStatusAccent;
}

function cardClass(value: string): string {
  if (value === "var(--red)") return styles.pportCardRed;
  if (value === "var(--amber)") return styles.pportCardAmber;
  if (value === "var(--blue)") return styles.pportCardBlue;
  return "";
}

function healthCardClass(value: string): string {
  if (value === "var(--red)") return styles.pportHealthCardRed;
  if (value === "var(--amber)") return styles.pportHealthCardAmber;
  if (value === "var(--blue)") return styles.pportHealthCardBlue;
  return styles.pportHealthCardAccent;
}

function Avatar({ initials, color, size = 30 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size === 22 ? "pportAvatar22" : size === 28 ? "pportAvatar28" : size === 36 ? "pportAvatar36" : "pportAvatar30";
  return (
    <div className={cx(styles.pportAvatar, toneVarClass(color), sizeClass)}>
      {initials}
    </div>
  );
}

const tabs: Tab[] = ["board", "list", "health map"];

export function ProjectPortfolioPage() {
  const { snapshot } = useAdminWorkspaceContext();
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const projects = useMemo<PortfolioProject[]>(() => {
    return snapshot.projects.map((p) => {
      const client = snapshot.clients.find((c) => c.id === p.clientId);
      return mapToPortfolio(p, client);
    });
  }, [snapshot.projects, snapshot.clients]);

  const filtered = filterStatus === "All" ? projects : projects.filter((p) => p.status === filterStatus);
  const atRisk = projects.filter((p) => p.status === "at-risk" || p.status === "off-track").length;
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const avgCompletion = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.completion, 0) / projects.length) : 0;

  return (
    <div className={cx(styles.pageBody, styles.pportRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>OPERATIONS / PROJECT PORTFOLIO</div>
          <h1 className={styles.pageTitle}>Project Portfolio</h1>
          <div className={styles.pageSub}>All active projects - Status - Budget - Blockers</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ New Project</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Active Projects", value: projects.length.toString(), color: "var(--accent)", sub: `Across ${new Set(projects.map((p) => p.client)).size} clients` },
          { label: "Projects At Risk", value: atRisk.toString(), color: atRisk > 0 ? "var(--red)" : "var(--accent)", sub: "Need attention" },
          { label: "Avg Completion", value: `${avgCompletion}%`, color: "var(--blue)", sub: "Portfolio progress" },
          { label: "Budget Utilisation", value: `${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%`, color: "var(--amber)", sub: `R${(totalSpent / 1000).toFixed(0)}k of R${(totalBudget / 1000).toFixed(0)}k` }
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.label === "Projects At Risk" && atRisk > 0 && styles.pportRiskStat)}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      {projects.some((p) => p.blockers.length > 0) && (
        <div className={styles.pportBlockersWrap}>
          <span className={styles.pportWarnIcon}>!</span>
          <div>
            <div className={styles.pportWarnTitle}>Active Blockers</div>
            <div className={styles.pportWarnList}>
              {projects
                .filter((p) => p.blockers.length > 0)
                .map((p) =>
                  p.blockers.map((b, i) => (
                    <div key={`${p.id}-${i}`} className={cx("text12", "colorMuted")}>
                      <span className={cx(styles.pportClientTone, colorClass(p.clientColor))}>{p.client}</span> - {b}
                    </div>
                  ))
                )}
            </div>
          </div>
        </div>
      )}

      <AdminFilterBar panelColor="var(--surface)" borderColor="var(--border)">
        <div className={styles.pportFilterLabel}>Filters</div>
        <div className={cx("flexRow", "gap8")}>
          <select title="Select view" value={activeTab} onChange={(e) => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
            {tabs.map((tab) => (
              <option key={tab} value={tab}>
                View: {tab === "health map" ? "Health Map" : `${tab.charAt(0).toUpperCase()}${tab.slice(1)}`}
              </option>
            ))}
          </select>
          <select title="Filter by project status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusFilter)} className={styles.filterSelect}>
            <option value="All">Status: All</option>
            <option value="on-track">Status: On Track</option>
            <option value="at-risk">Status: At Risk</option>
            <option value="off-track">Status: Off Track</option>
          </select>
        </div>
      </AdminFilterBar>

      {activeTab === "board" && (
        <div className={styles.pportBoardList}>
          {filtered.map((p) => {
            const sc = statusConfig[p.status];
            const isExpanded = expanded === p.id;
            return (
              <div key={p.id} className={cx(styles.pportCard, p.status !== "on-track" && cardClass(sc.color))}>
                <div
                  role="button"
                  tabIndex={0}
                  className={styles.pportCardToggle}
                  onClick={() => setExpanded(isExpanded ? null : p.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setExpanded(isExpanded ? null : p.id);
                    }
                  }}
                >
                  <div className={styles.pportMainGrid}>
                    <div className={styles.pportEntityCell}>
                      <Avatar initials={p.clientAvatar} color={p.clientColor} size={36} />
                      <div>
                        <div className={styles.pportProjName}>{p.name}</div>
                        <div className={cx(styles.pportClientMeta, colorClass(p.clientColor))}>{p.client} - {p.type}</div>
                      </div>
                    </div>

                    <div>
                      <div className={styles.pportProgressHead}>
                        <span className={cx("text11", "colorMuted")}>{p.phase}</span>
                        <span className={cx("fontMono", "text12", completionClass(p.completion))}>{p.completion}%</span>
                      </div>
                      <div className={styles.pportTrack6}>
                        <progress
                          className={cx("barFill", "uiProgress", p.status === "off-track" ? styles.pportFillRed : p.status === "at-risk" ? styles.pportFillAmber : styles.pportFillAccent)}
                          max={100}
                          value={p.completion}
                        />
                      </div>
                      <div className={cx("text10", "colorMuted", "mt4")}>
                        {p.tasksDone}/{p.tasksTotal} tasks{p.tasksOverdue > 0 ? <span className={styles.pportOverdueText}> - {p.tasksOverdue} overdue</span> : null}
                      </div>
                    </div>

                    <div>
                      <div className={styles.pportMiniLabel}>Budget</div>
                      <div className={cx("fontMono", "text13", "fw700", spentClass(p.spentPct))}>{p.spentPct}%</div>
                      <div className={cx("text10", "colorMuted")}>R{(p.spent / 1000).toFixed(0)}k / R{(p.budget / 1000).toFixed(0)}k</div>
                    </div>

                    <div>
                      <div className={styles.pportMiniLabel}>Due</div>
                      <div className={cx("fontMono", "text12", dueClass(p.daysLeft))}>{p.dueDate}</div>
                      <div className={cx("text10", p.daysLeft <= 7 ? "colorRed" : "colorMuted")}>{p.daysLeft}d left</div>
                    </div>

                    <div className={styles.pportOwnerCell}>
                      <Avatar initials={p.ownerAvatar} color="var(--muted)" size={28} />
                      <div className={styles.pportOwnerName}>{p.owner.split(" ")[0]}</div>
                    </div>

                    <span className={cx(styles.pportStatusTag, statusClass(sc.color))}>{sc.label}</span>

                    {p.blockers.length > 0 ? (
                      <div className={styles.pportBlockerChip}>! {p.blockers.length}</div>
                    ) : (
                      <div className={styles.pportClearChip}>Clear</div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.pportExpanded}>
                    <div className={styles.pportExpandGrid}>
                      <div>
                        <div className={styles.pportSectionTitle}>Phase Progress</div>
                        <div className={styles.pportPhaseList}>
                          {phases.map((phase, i) => {
                            const phaseIndex = phases.indexOf(p.phase);
                            const isDone = i < phaseIndex;
                            const isCurrent = i === phaseIndex;
                            return (
                              <div key={phase} className={styles.pportPhaseRow}>
                                <div className={cx(styles.pportPhaseDot, isDone ? styles.pportFillAccent : isCurrent ? fillClass(sc.color) : styles.pportFillBorder)} />
                                <span className={cx(styles.pportPhaseText, isDone ? "colorAccent" : isCurrent ? colorClass(sc.color) : "colorMuted", isCurrent && "fw700")}>{phase}</span>
                                {isCurrent ? <span className={cx(styles.pportCurrentTag, colorClass(sc.color))}>(current)</span> : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className={styles.pportSectionTitle}>Blockers</div>
                        {p.blockers.length === 0
                          ? <div className={styles.pportNoBlockers}>No active blockers</div>
                          : p.blockers.map((b, i) => (
                              <div key={i} className={styles.pportBlockerRow}>{b}</div>
                            ))}
                      </div>

                      <div>
                        <div className={styles.pportSectionTitle}>Quick Actions</div>
                        <div className={styles.pportActionsCol}>
                          <button type="button" className={cx("btnSm", "btnGhost", styles.pportActionBtn)}>View Full Project</button>
                          <button type="button" className={cx("btnSm", "btnGhost", styles.pportActionBtn)}>Message Client</button>
                          <button type="button" className={cx("btnSm", "btnGhost", styles.pportActionBtn)}>Open Reports</button>
                          {p.blockers.length > 0 ? <button type="button" className={cx("btnSm", "btnGhost", styles.pportEscalateBtn)}>Log Escalation</button> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "list" && (
        <div className={styles.pportListCard}>
          <div className={cx(styles.pportListHead, "fontMono", "text10", "colorMuted", "uppercase")}>
            {"ID|Project|Client|Phase|Progress|Budget|Due|Status|Health".split("|").map((h) => <span key={h}>{h}</span>)}
          </div>
          {filtered.map((p, i) => (
            <div key={p.id} className={cx(styles.pportListRow, i < filtered.length - 1 && "borderB")}>
              <span className={cx("fontMono", "text10", "colorMuted")}>{p.id}</span>
              <span className={styles.pportListProject}>{p.name}</span>
              <div className={styles.pportListClientCell}>
                <Avatar initials={p.clientAvatar} color={p.clientColor} size={22} />
                <span className={cx(styles.pportListClient, colorClass(p.clientColor))}>{p.client}</span>
              </div>
              <span className={cx("text11", "colorMuted")}>{p.phase}</span>
              <div>
                <div className={styles.pportListTrack}>
                  <progress className={cx("barFill", "uiProgress", p.status === "off-track" ? styles.pportFillRed : styles.pportFillAccent)} max={100} value={p.completion} />
                </div>
                <span className={cx("fontMono", "text10", "colorMuted")}>{p.completion}%</span>
              </div>
              <span className={cx("fontMono", "text11", spentClass(p.spentPct))}>{p.spentPct}%</span>
              <span className={cx("fontMono", "text11", p.daysLeft <= 7 ? "colorRed" : "colorMuted")}>{p.daysLeft}d</span>
              <span className={cx(styles.pportListStatus, statusClass(statusConfig[p.status].color))}>{statusConfig[p.status].label}</span>
              <span className={cx("fontMono", "fw700", healthClass(p.health))}>{p.health}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "health map" && (
        <div className={styles.pportHealthGrid}>
          {filtered.map((p) => {
            const sc = statusConfig[p.status];
            return (
              <div key={p.id} className={cx(styles.pportHealthCard, healthCardClass(sc.color))}>
                <div className={styles.pportHealthTop}>
                  <div className={styles.pportEntityCell}>
                    <Avatar initials={p.clientAvatar} color={p.clientColor} />
                    <div>
                      <div className={styles.pportHealthName}>{p.name}</div>
                      <div className={cx(styles.pportHealthClient, colorClass(p.clientColor))}>{p.client}</div>
                    </div>
                  </div>
                  <div className={styles.pportHealthScoreWrap}>
                    <div className={cx(styles.pportHealthScore, healthClass(p.health))}>{p.health}</div>
                    <div className={styles.pportHealthLabel}>Health Score</div>
                  </div>
                </div>
                <div className={styles.pportMetricGrid}>
                  {[
                    { label: "Progress", value: `${p.completion}%`, color: p.completion >= 70 ? "var(--accent)" : "var(--amber)" },
                    { label: "Budget", value: `${p.spentPct}%`, color: p.spentPct > 100 ? "var(--red)" : p.spentPct > 85 ? "var(--amber)" : "var(--accent)" },
                    { label: "Tasks Done", value: `${p.tasksDone}/${p.tasksTotal}`, color: "var(--blue)" },
                    { label: "Blockers", value: p.blockers.length.toString(), color: p.blockers.length > 0 ? "var(--red)" : "var(--accent)" }
                  ].map((m) => (
                    <div key={m.label} className={styles.pportMetricCard}>
                      <div className={cx(styles.pportMetricValue, colorClass(m.color))}>{m.value}</div>
                      <div className={styles.pportMetricLabel}>{m.label}</div>
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
