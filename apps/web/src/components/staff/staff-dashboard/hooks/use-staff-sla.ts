"use client";

import { useMemo } from "react";
import type { SlaWatchItem, TaskContext } from "../types";
import { formatStatus } from "../utils";

type AdminProject = {
  id: string;
  clientId: string;
  name: string;
  status: string;
  progressPercent: number;
  dueAt?: string | null;
  slaDueAt?: string | null;
  updatedAt: string;
};

type AdminClient = {
  id: string;
  name: string;
};

type ProjectBlocker = {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  etaAt: string | null;
  ownerName: string | null;
  updatedAt: string;
};

type MilestoneStats = {
  overdue: number;
  dueThisWeek: number;
  deliveredThisMonth: number;
};

export type UseStaffSlaReturn = {
  slaWatchlist: SlaWatchItem[];
  slaBurn: { tone: "red" | "amber" | "green"; statusLabel: string; detail: string; riskCount: number; watchCount: number };
  flowHealth: { wipCount: number; blockedPercent: number; throughput7d: number; avgCycleDays: number };
};

type Params = {
  projects: AdminProject[];
  clientById: Map<string, AdminClient>;
  projectBlockers: ProjectBlocker[];
  taskContexts: TaskContext[];
  milestoneStats: MilestoneStats;
  nowTs: number;
  searchQuery: string;
};

export function useStaffSla({
  projects,
  clientById,
  projectBlockers,
  taskContexts,
  milestoneStats,
  nowTs,
  searchQuery
}: Params): UseStaffSlaReturn {
  const slaWatchlist = useMemo<SlaWatchItem[]>(() => {
    const now = nowTs;
    const weekAhead = now + 1000 * 60 * 60 * 24 * 7;
    const upcomingSla = projects
      .filter((project) => project.slaDueAt)
      .map((project) => ({
        ...project,
        slaTs: project.slaDueAt ? new Date(project.slaDueAt).getTime() : null
      }))
      .filter((project) => project.slaTs !== null && project.slaTs <= weekAhead)
      .sort((a, b) => (a.slaTs ?? 0) - (b.slaTs ?? 0))
      .slice(0, 4)
      .map((project) => ({
        id: project.id,
        name: project.name,
        clientName: clientById.get(project.clientId)?.name ?? "Client",
        statusLabel: formatStatus(project.status),
        slaDueAt: project.slaDueAt ?? null
      }));

    const blockerRows = projectBlockers
      .filter((blocker) => blocker.status !== "RESOLVED")
      .slice(0, 4)
      .map((blocker) => ({
        id: `blocker-${blocker.id}`,
        name: blocker.title,
        clientName: clientById.get(blocker.clientId)?.name ?? "Client",
        statusLabel: `Blocker · ${formatStatus(blocker.severity)}`,
        slaDueAt: blocker.etaAt
      }));

    const rows = [...blockerRows, ...upcomingSla];
    if (!searchQuery) return rows.slice(0, 4);
    return rows
      .filter((item) => `${item.name} ${item.clientName} ${item.statusLabel}`.toLowerCase().includes(searchQuery))
      .slice(0, 4);
  }, [clientById, nowTs, projectBlockers, projects, searchQuery]);

  const slaBurn = useMemo(() => {
    const now = nowTs;
    const dayMs = 1000 * 60 * 60 * 24;
    const horizon = now + dayMs * 7;
    const openCriticalBlockers = projectBlockers.filter(
      (blocker) =>
        blocker.status !== "RESOLVED" &&
        (blocker.severity === "CRITICAL" || blocker.severity === "HIGH")
    ).length;
    const upcomingSla = projects.filter((project) => {
      if (!project.slaDueAt) return false;
      const ts = new Date(project.slaDueAt).getTime();
      return ts >= now && ts <= horizon;
    }).length;
    const overdueMilestones = milestoneStats.overdue;
    const riskCount = openCriticalBlockers + overdueMilestones;
    const watchCount = upcomingSla;
    const tone: "red" | "amber" | "green" =
      riskCount > 0 ? "red" : watchCount > 0 ? "amber" : "green";
    const statusLabel =
      tone === "red" ? "Fast burn risk" : tone === "amber" ? "Watch burn" : "On track";
    const detail =
      tone === "red"
        ? `${openCriticalBlockers} critical blocker${openCriticalBlockers === 1 ? "" : "s"} · ${overdueMilestones} overdue deliverable${overdueMilestones === 1 ? "" : "s"}`
        : tone === "amber"
          ? `${upcomingSla} SLA deadline${upcomingSla === 1 ? "" : "s"} in next 7 days`
          : "No immediate SLA pressure";
    return { tone, statusLabel, detail, riskCount, watchCount };
  }, [milestoneStats.overdue, nowTs, projectBlockers, projects]);

  const flowHealth = useMemo(() => {
    const now = nowTs;
    const sevenDaysAgo = now - 1000 * 60 * 60 * 24 * 7;
    const open = taskContexts.filter((task) => task.status !== "DONE");
    const blocked = taskContexts.filter((task) => task.status === "BLOCKED");
    const completedRecent = taskContexts.filter(
      (task) => task.status === "DONE" && new Date(task.updatedAt).getTime() >= sevenDaysAgo
    );
    const completedDurations = taskContexts
      .filter((task) => task.status === "DONE")
      .map((task) => Math.max(0, new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime()));
    const avgCycleDays =
      completedDurations.length === 0
        ? 0
        : Math.round(
            (completedDurations.reduce((sum, duration) => sum + duration, 0) /
              completedDurations.length /
              (1000 * 60 * 60 * 24)) *
              10
          ) / 10;
    const blockedPercent = open.length === 0 ? 0 : Math.round((blocked.length / open.length) * 100);
    return {
      wipCount: open.length,
      blockedPercent,
      throughput7d: completedRecent.length,
      avgCycleDays
    };
  }, [nowTs, taskContexts]);

  return {
    slaWatchlist,
    slaBurn,
    flowHealth
  };
}
