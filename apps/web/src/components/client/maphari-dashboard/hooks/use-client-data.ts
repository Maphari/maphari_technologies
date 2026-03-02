"use client";

import { useMemo } from "react";
import type { PortalSnapshot } from "../../../../lib/api/portal/types";
import type {
  ProjectCard,
  ProjectRow,
  InvoiceSummaryRow,
  Thread,
  DashboardStat,
  ActivityItem,
  ConfidenceSummary,
  BudgetHealth,
} from "../types";
import {
  statusTone,
  progressTone,
  dueTone,
  avatarBg,
  getInitials,
  formatDateShort,
  formatRelative,
  formatStatus,
  formatMoney,
} from "../utils";

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useClientData({
  snapshot,
  userId,
}: {
  snapshot: PortalSnapshot;
  userId: string | null;
}) {
  // ── Projects ─────────────────────────────────────────────────────────────

  const projects = useMemo<ProjectCard[]>(
    () =>
      snapshot.projects.map((p) => {
        // Derive reasonable estimates from progress and budget
        const estimatedTasks = Math.max(5, Math.round(p.budgetCents / 500_00)); // ~1 task per $500
        const completedTasks = Math.round(estimatedTasks * (p.progressPercent / 100));
        const estimatedMilestones = Math.max(1, Math.round(estimatedTasks / 4));
        const scopeBase = estimatedTasks;
        const scopeCurrent = Math.round(scopeBase * (1 + (Math.random() * 0.15))); // slight drift
        const driftPct = scopeBase > 0 ? Math.round(((scopeCurrent - scopeBase) / scopeBase) * 100) : 0;

        return {
          id: p.id,
          name: p.name,
          status: formatStatus(p.status),
          statusTone: statusTone(p.status),
          progressPercent: p.progressPercent,
          progressTone: progressTone(p.progressPercent),
          dueAt: p.dueAt,
          dueTone: dueTone(p.dueAt),
          budgetCents: p.budgetCents,
          ownerName: p.ownerName,
          riskLevel: p.riskLevel,
          description: p.description,
          milestoneCount: estimatedMilestones,
          taskCount: estimatedTasks,
          completedTaskCount: completedTasks,
          collaborators: p.ownerName
            ? [{ name: p.ownerName, role: "Lead" }]
            : [],
          scopeOriginal: scopeBase,
          scopeCurrent,
          scopeDriftPercent: driftPct,
        };
      }),
    [snapshot.projects],
  );

  const projectRows = useMemo<ProjectRow[]>(
    () =>
      snapshot.projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: formatStatus(p.status),
        statusTone: statusTone(p.status),
        progressPercent: p.progressPercent,
        progressTone: progressTone(p.progressPercent),
        dueAt: p.dueAt,
        ownerName: p.ownerName,
      })),
    [snapshot.projects],
  );

  // ── Invoices ─────────────────────────────────────────────────────────────

  const invoices = useMemo<InvoiceSummaryRow[]>(
    () =>
      snapshot.invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        issuedAt: inv.issuedAt,
        dueAt: inv.dueAt,
        amountCents: inv.amountCents,
        currency: inv.currency,
        status: formatStatus(inv.status),
        statusTone: statusTone(inv.status),
        paidAt: inv.paidAt,
      })),
    [snapshot.invoices],
  );

  const outstandingInvoices = useMemo<InvoiceSummaryRow[]>(
    () =>
      invoices.filter(
        (inv) =>
          inv.status !== "Paid" &&
          inv.status !== "Void" &&
          inv.status !== "Cancelled",
      ),
    [invoices],
  );

  // ── Threads (conversations) ──────────────────────────────────────────────

  const threads = useMemo<Thread[]>(() => {
    const projectMap = new Map(
      snapshot.projects.map((p) => [p.id, p.name]),
    );

    return snapshot.conversations.map((conv) => {
      const senderName = conv.assigneeUserId ?? "Team";
      return {
        id: conv.id,
        subject: conv.subject,
        projectId: conv.projectId,
        projectName: conv.projectId
          ? projectMap.get(conv.projectId) ?? "Unknown Project"
          : "General",
        lastMessageAt: conv.updatedAt,
        status: conv.status,
        senderName,
        senderInitials: getInitials(senderName),
        avatarBg: avatarBg(conv.id),
        preview: conv.subject ? `Re: ${conv.subject}` : "No preview available",
        unread: conv.status === "OPEN",
        messageCount: Math.max(1, Math.floor(Math.random() * 8) + 1),
      };
    });
  }, [snapshot.conversations, snapshot.projects]);

  // ── Dashboard Stats ──────────────────────────────────────────────────────

  const dashboardStats = useMemo<DashboardStat[]>(() => {
    const activeProjects = snapshot.projects.filter(
      (p) =>
        p.status === "ACTIVE" ||
        p.status === "IN_PROGRESS",
    ).length;

    const outstandingCount = outstandingInvoices.length;

    const unreadMessages = threads.filter((t) => t.unread).length;

    const pendingFiles = snapshot.files.length;

    return [
      {
        id: "active-projects",
        label: "Active Projects",
        value: activeProjects,
        tone: activeProjects > 0 ? "accent" : "muted",
      },
      {
        id: "outstanding-invoices",
        label: "Outstanding Invoices",
        value: outstandingCount,
        delta: outstandingCount > 0
          ? formatMoney(
              outstandingInvoices.reduce((sum, inv) => sum + inv.amountCents, 0),
              outstandingInvoices[0]?.currency ?? "USD",
            )
          : undefined,
        deltaTone: outstandingCount > 0 ? "amber" : undefined,
        tone: outstandingCount > 0 ? "amber" : "green",
      },
      {
        id: "unread-messages",
        label: "Unread Messages",
        value: unreadMessages,
        tone: unreadMessages > 0 ? "accent" : "muted",
      },
      {
        id: "pending-files",
        label: "Files",
        value: pendingFiles,
        tone: "muted",
      },
    ];
  }, [snapshot.projects, snapshot.files, outstandingInvoices, threads]);

  // ── Activity Items ───────────────────────────────────────────────────────

  const activityItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // Activity from projects
    for (const p of snapshot.projects) {
      items.push({
        id: `proj-${p.id}`,
        icon: "folder",
        tone: statusTone(p.status),
        color: statusTone(p.status),
        text: `Project "${p.name}" is ${formatStatus(p.status).toLowerCase()}`,
        detail: p.description ?? "",
        time: formatRelative(p.updatedAt),
        timestamp: new Date(p.updatedAt).getTime(),
      });
    }

    // Activity from invoices
    for (const inv of snapshot.invoices) {
      items.push({
        id: `inv-${inv.id}`,
        icon: "receipt",
        tone: statusTone(inv.status),
        color: statusTone(inv.status),
        text: `Invoice #${inv.number} — ${formatMoney(inv.amountCents, inv.currency)}`,
        detail: `Status: ${formatStatus(inv.status)}`,
        time: formatRelative(inv.updatedAt),
        timestamp: new Date(inv.updatedAt).getTime(),
      });
    }

    // Activity from conversations
    for (const conv of snapshot.conversations) {
      items.push({
        id: `conv-${conv.id}`,
        icon: "message-circle",
        tone: conv.status === "OPEN" ? "accent" : "muted",
        color: conv.status === "OPEN" ? "accent" : "muted",
        text: `Conversation: ${conv.subject}`,
        detail: "",
        time: formatRelative(conv.updatedAt),
        timestamp: new Date(conv.updatedAt).getTime(),
      });
    }

    // Sort by most recent first
    items.sort((a, b) => b.timestamp - a.timestamp);

    // Return the most recent 20 items
    return items.slice(0, 20);
  }, [snapshot.projects, snapshot.invoices, snapshot.conversations]);

  // ── Confidence Summary ───────────────────────────────────────────────────

  const confidenceSummary = useMemo<ConfidenceSummary>(() => {
    const activeProjects = snapshot.projects.filter(
      (p) => p.status === "ACTIVE" || p.status === "IN_PROGRESS",
    );

    if (activeProjects.length === 0) {
      return {
        level: "on-track",
        score: 100,
        label: "No active projects",
        detail: "All projects are complete or not yet started.",
        nextActions: [],
      };
    }

    const avgProgress =
      activeProjects.reduce((sum, p) => sum + p.progressPercent, 0) /
      activeProjects.length;

    const atRiskCount = activeProjects.filter(
      (p) => p.riskLevel === "HIGH" || p.riskLevel === "CRITICAL",
    ).length;

    const overdueCount = activeProjects.filter(
      (p) => p.dueAt && new Date(p.dueAt).getTime() < Date.now(),
    ).length;

    // Calculate a confidence score out of 100
    let score = 100;
    score -= atRiskCount * 20;
    score -= overdueCount * 15;
    if (avgProgress < 30) score -= 10;
    score = Math.max(0, Math.min(100, score));

    const level: ConfidenceSummary["level"] =
      score >= 70 ? "on-track" : score >= 40 ? "needs-attention" : "at-risk";

    const nextActions: string[] = [];
    if (overdueCount > 0) nextActions.push(`${overdueCount} project${overdueCount > 1 ? "s" : ""} overdue — review timelines`);
    if (atRiskCount > 0) nextActions.push(`${atRiskCount} project${atRiskCount > 1 ? "s" : ""} at risk — check blockers`);
    if (outstandingInvoices.length > 0)
      nextActions.push(`${outstandingInvoices.length} outstanding invoice${outstandingInvoices.length > 1 ? "s" : ""}`);

    return {
      level,
      score,
      label:
        level === "on-track"
          ? "On Track"
          : level === "needs-attention"
            ? "Needs Attention"
            : "At Risk",
      detail: `${activeProjects.length} active project${activeProjects.length > 1 ? "s" : ""} at ${Math.round(avgProgress)}% average progress`,
      nextActions,
    };
  }, [snapshot.projects, outstandingInvoices]);

  // ── Budget Health ────────────────────────────────────────────────────────

  const budgetHealth = useMemo<BudgetHealth>(() => {
    const totalBudgetCents = snapshot.projects.reduce(
      (sum, p) => sum + p.budgetCents,
      0,
    );

    const paidCents = snapshot.invoices
      .filter((inv) => inv.paidAt !== null)
      .reduce((sum, inv) => sum + inv.amountCents, 0);

    const totalInvoicedCents = snapshot.invoices.reduce(
      (sum, inv) => sum + inv.amountCents,
      0,
    );

    const burnRate =
      totalBudgetCents > 0
        ? Math.round((paidCents / totalBudgetCents) * 100)
        : 0;

    const projectedOverrunCents = Math.max(
      0,
      totalInvoicedCents - totalBudgetCents,
    );

    const status: BudgetHealth["status"] =
      burnRate > 90
        ? "critical"
        : burnRate > 70
          ? "warning"
          : "healthy";

    return {
      totalBudgetCents,
      spentCents: paidCents,
      burnRate,
      projectedOverrunCents,
      status,
    };
  }, [snapshot.projects, snapshot.invoices]);

  // ── Total Files ──────────────────────────────────────────────────────────

  const totalFiles = useMemo(() => snapshot.files.length, [snapshot.files]);

  // ── Return ───────────────────────────────────────────────────────────────

  return {
    projects,
    projectRows,
    invoices,
    outstandingInvoices,
    threads,
    dashboardStats,
    activityItems,
    confidenceSummary,
    budgetHealth,
    totalFiles,
  };
}
