"use client";

import { useMemo } from "react";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import type { AdminProject, AdminClient } from "../../../../lib/api/admin/types";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import widgetStyles from "@/app/style/admin/widgets.module.css";

type ProjectStatus = "on-track" | "at-risk" | "off-track" | "complete";

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


export function ProjectPortfolioPage() {
  const { snapshot } = useAdminWorkspaceContext();

  const projects = useMemo<PortfolioProject[]>(() => {
    return snapshot.projects.map((p) => {
      const client = snapshot.clients.find((c) => c.id === p.clientId);
      return mapToPortfolio(p, client);
    });
  }, [snapshot.projects, snapshot.clients]);

  const filtered = projects;
  const atRisk = projects.filter((p) => p.status === "at-risk" || p.status === "off-track").length;
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const avgCompletion = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.completion, 0) / projects.length) : 0;

  // ── Widget data ────────────────────────────────────────────────────────────
  const portfolioChartData = [
    { label: "On Track", count: projects.filter((p) => p.status === "on-track").length },
    { label: "At Risk", count: projects.filter((p) => p.status === "at-risk").length },
    { label: "Off Track", count: projects.filter((p) => p.status === "off-track").length },
    { label: "Complete", count: projects.filter((p) => p.status === "complete").length },
  ];

  const onTrackCount = projects.filter((p) => p.status === "on-track").length;
  const onTimePct = projects.length > 0 ? Math.round((onTrackCount / projects.length) * 100) : 0;

  const tableRows = filtered.map((p) => ({
    id: p.id,
    name: p.name,
    client: p.client,
    status: statusConfig[p.status].label,
    _statusRaw: p.status,
    health: p.health,
    value: `R${(p.budget / 1000).toFixed(0)}k`,
  }));

  return (
    <div className={cx(styles.pageBody, styles.pportRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>OPERATIONS / PORTFOLIO</div>
          <h1 className={styles.pageTitle}>Project Portfolio</h1>
          <div className={styles.pageSub}>Portfolio valuation · Health distribution · Risk overview</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ New Project</button>
        </div>
      </div>

      {/* Row 1 — 4 stat widgets */}
      <WidgetGrid>
        <StatWidget
          label="Total Projects"
          value={projects.length}
          sub={`Across ${new Set(projects.map((p) => p.client)).size} clients`}
          tone="accent"
        />
        <StatWidget
          label="Portfolio Value"
          value={`R${(totalBudget / 1000).toFixed(0)}k`}
          sub={`R${(totalSpent / 1000).toFixed(0)}k spent`}
          tone="default"
        />
        <StatWidget
          label="Avg Health"
          value={`${avgCompletion}%`}
          sub="Average completion"
          tone={avgCompletion >= 60 ? "accent" : "amber"}
          progressValue={avgCompletion}
        />
        <StatWidget
          label="At Risk Count"
          value={atRisk}
          sub="Need attention"
          tone={atRisk > 0 ? "red" : "default"}
        />
      </WidgetGrid>

      {/* Row 2 — area chart + on-time stat */}
      <WidgetGrid>
        <ChartWidget
          label="Portfolio Distribution"
          data={portfolioChartData}
          dataKey="count"
          type="area"
          color="#8b6fff"
          xKey="label"
          className={widgetStyles.span3}
        />
        <StatWidget
          label="On-Time Rate"
          value={`${onTimePct}%`}
          sub={`${onTrackCount} of ${projects.length} on track`}
          tone={onTimePct >= 70 ? "accent" : onTimePct >= 50 ? "amber" : "red"}
          progressValue={onTimePct}
        />
      </WidgetGrid>

      {/* Row 3 — projects table */}
      <WidgetGrid>
        <TableWidget
          label="Portfolio Projects"
          rows={tableRows as Record<string, unknown>[]}
          rowKey="id"
          emptyMessage="No projects found."
          columns={[
            { key: "name", header: "Project", align: "left" },
            { key: "client", header: "Client", align: "left" },
            {
              key: "status",
              header: "Status",
              align: "left",
              render: (_v, row) => {
                const raw = (row as { _statusRaw: string })._statusRaw;
                const badgeCls =
                  raw === "on-track" ? cx("badgeGreen")
                  : raw === "at-risk" ? cx("badgeAmber")
                  : raw === "off-track" ? cx("badgeRed")
                  : cx("badgeAccent");
                return <span className={badgeCls}>{String(_v)}</span>;
              },
            },
            { key: "health", header: "Health", align: "right" },
            { key: "value", header: "Value", align: "right" },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}
