"use client";

import { useMemo } from "react";
import type {
  ActionCenterItem,
  ActionItem,
  ActivityItem,
  ApprovalQueueItem,
  ConfidenceSummary,
  DashboardStat,
  DecisionLogItem,
  LoginDigestItem,
  OnboardingChecklistItem,
  RiskItem,
  ThreadPreview,
  TimelineItem
} from "../types";
import {
  formatDateLong,
  formatDateShort,
  formatMoney,
  formatRelative,
  formatStatus,
  getInitials,
  isPast
} from "../utils";
import type {
  PortalProjectDetail,
  PortalProjectCollaboration,
  PortalMilestoneApproval,
  PortalMessage,
  PortalProjectChangeRequest,
  PortalSnapshot
} from "../../../../lib/api/portal";

type Params = {
  sortedScopedProjects: PortalSnapshot["projects"];
  projectScopedProjects: PortalSnapshot["projects"];
  projectScopedConversations: PortalSnapshot["conversations"];
  scopedProjectDetails: PortalProjectDetail[];
  effectiveProjectDetails: PortalProjectDetail[];
  effectiveMessagePreviewMap: Record<string, PortalMessage | null>;
  projectCollaborationById: Record<string, PortalProjectCollaboration>;
  milestoneApprovals: Record<string, PortalMilestoneApproval>;
  dateScopedInvoices: PortalSnapshot["invoices"];
  scopedOutstandingInvoices: PortalSnapshot["invoices"];
  overdueInvoices: PortalSnapshot["invoices"];
  outstandingInvoices: PortalSnapshot["invoices"];
  scopedBlockers: Array<{ id: string; projectId: string; title: string; severity: string; status: string; etaAt: string | null }>;
  scopedTimelineEvents: Array<{ id: string; projectId: string | null; category: string; title: string; detail: string | null; createdAt: string }>;
  scopedChangeRequests: PortalProjectChangeRequest[];
  allMilestones: Array<{ milestone: PortalProjectDetail["milestones"][number]; projectId: string }>;
  scopedMilestones: Array<{ milestone: PortalProjectDetail["milestones"][number]; projectId: string }>;
  projects: PortalSnapshot["projects"];
  snapshot: PortalSnapshot;
  fileById: Map<string, PortalSnapshot["files"][number]>;
  nowTs: number;
  lastLoginAt: string | null;
  searchQuery: string;
  threadSearch: string;
  displayCurrency: string;
  convertMoney: (cents: number, currency: string) => number;
  activeInvoiceTab: "all" | "outstanding" | "paid";
  projectScopeId: string | null;
  openThreads: PortalSnapshot["conversations"];
  unreadByTab: { dashboard: number; projects: number; invoices: number; messages: number; operations: number; settings: number };
  defaultProjectName: string;
};

export function useDashboardViews(params: Params) {
  const {
    sortedScopedProjects,
    projectScopedProjects,
    projectScopedConversations,
    scopedProjectDetails,
    effectiveProjectDetails,
    effectiveMessagePreviewMap,
    projectCollaborationById,
    milestoneApprovals,
    dateScopedInvoices,
    scopedOutstandingInvoices,
    overdueInvoices,
    outstandingInvoices,
    scopedBlockers,
    scopedTimelineEvents,
    scopedChangeRequests,
    allMilestones,
    scopedMilestones,
    projects,
    snapshot,
    fileById,
    nowTs,
    lastLoginAt,
    searchQuery,
    threadSearch,
    displayCurrency,
    convertMoney,
    activeInvoiceTab,
    projectScopeId,
    openThreads,
    unreadByTab,
    defaultProjectName
  } = params;

  const projectRows = useMemo(
    () =>
      sortedScopedProjects.slice(0, 3).map((project) => {
        const status = project.status;
        const statusTone =
          status === "IN_PROGRESS" || status === "COMPLETED"
            ? "bgGreen"
            : status === "REVIEW"
            ? "bgAmber"
            : status === "PLANNING"
            ? "bgPurple"
            : status === "ON_HOLD" || status === "CANCELLED"
            ? "bgRed"
            : "bgMuted";
        const progressTone =
          status === "IN_PROGRESS" || status === "COMPLETED"
            ? "pfGreen"
            : status === "REVIEW"
            ? "pfAmber"
            : status === "PLANNING"
            ? "pfPurple"
            : "pfGreen";
        return {
          id: project.id,
          name: project.name,
          subtitle: project.description ?? `${project.priority} priority`,
          status: formatStatus(status),
          statusTone,
          progress: project.progressPercent ?? 0,
          progressTone,
          due: project.dueAt ? formatDateShort(project.dueAt) : "TBD",
          dueTone: project.dueAt && isPast(project.dueAt) ? "var(--red)" : "var(--muted)"
        };
      }),
    [sortedScopedProjects]
  );

  const milestoneRows = useMemo(() => {
    return scopedMilestones
      .filter((entry) => entry.milestone.dueAt || entry.milestone.status !== "COMPLETED")
      .sort((a, b) => {
        const aTime = a.milestone.dueAt ? new Date(a.milestone.dueAt).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.milestone.dueAt ? new Date(b.milestone.dueAt).getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      })
      .slice(0, 6)
      .map((entry) => {
        const milestone = entry.milestone;
        const status: "" | "done" | "now" =
          milestone.status === "COMPLETED" ? "done" : milestone.status === "IN_PROGRESS" ? "now" : "";
        const dateLabel = milestone.dueAt ? `${isPast(milestone.dueAt) ? "Overdue" : "Due"} · ${formatDateShort(milestone.dueAt)}` : "Planned";
        const fileName = milestone.fileId ? fileById.get(milestone.fileId)?.fileName ?? null : null;
        return {
          id: milestone.id,
          title: milestone.title,
          date: dateLabel,
          status,
          highlight: milestone.status === "IN_PROGRESS" || isPast(milestone.dueAt ?? null),
          fileName,
          approval: milestoneApprovals[milestone.id]?.status ?? "PENDING"
        };
      });
  }, [fileById, milestoneApprovals, scopedMilestones]);

  const pendingApprovalCount = milestoneRows.filter((row) => row.approval === "PENDING").length;

  const clientAutomationRows = useMemo(
    () => [
      {
        id: "client-status-sync",
        name: "Project Status Sync",
        trigger: "Project and milestone updates",
        status: projectScopedProjects.length > 0 ? "active" as const : "draft" as const,
        impact: `${projectScopedProjects.length} project${projectScopedProjects.length === 1 ? "" : "s"} tracked`,
        lastEvent: scopedTimelineEvents[0] ? formatRelative(scopedTimelineEvents[0].createdAt) : "No events yet"
      },
      {
        id: "client-invoice-reminders",
        name: "Invoice Reminder Engine",
        trigger: "Invoice due and overdue dates",
        status: overdueInvoices.length > 0 ? "risk" as const : outstandingInvoices.length > 0 ? "watch" as const : "active" as const,
        impact: `${outstandingInvoices.length} outstanding invoice${outstandingInvoices.length === 1 ? "" : "s"}`,
        lastEvent: scopedTimelineEvents[1] ? formatRelative(scopedTimelineEvents[1].createdAt) : "No events yet"
      },
      {
        id: "client-approvals",
        name: "Milestone Approval Requests",
        trigger: "Milestones waiting on client decision",
        status: pendingApprovalCount > 0 ? "watch" as const : "active" as const,
        impact: `${pendingApprovalCount} pending approval${pendingApprovalCount === 1 ? "" : "s"}`,
        lastEvent: scopedTimelineEvents[2] ? formatRelative(scopedTimelineEvents[2].createdAt) : "No events yet"
      },
      {
        id: "client-thread-alerts",
        name: "Thread Response Alerts",
        trigger: "New messages and escalation notices",
        status: unreadByTab.messages > 0 ? "watch" as const : "active" as const,
        impact: `${openThreads.length} active thread${openThreads.length === 1 ? "" : "s"}`,
        lastEvent: scopedTimelineEvents[3] ? formatRelative(scopedTimelineEvents[3].createdAt) : "No events yet"
      }
    ],
    [openThreads.length, outstandingInvoices.length, overdueInvoices.length, pendingApprovalCount, projectScopedProjects.length, scopedTimelineEvents, unreadByTab.messages]
  );

  const projectCards = useMemo(() => {
    const source = effectiveProjectDetails.length
      ? scopedProjectDetails
      : projectScopedProjects.map((project) => ({
          ...project,
          milestones: [],
          tasks: [],
          dependencies: [],
          activities: []
        }));
    return source.map((project) => {
      const collaboration = projectCollaborationById[project.id];
      const collaborators = collaboration?.contributors ?? [];
      const activeSessions = collaboration?.sessions?.filter((s) => s.status === "ACTIVE").length ?? 0;
      const statusTone =
        project.status === "IN_PROGRESS" || project.status === "COMPLETED"
          ? "bgGreen"
          : project.status === "REVIEW"
          ? "bgAmber"
          : project.status === "PLANNING"
          ? "bgPurple"
          : project.status === "ON_HOLD" || project.status === "CANCELLED"
          ? "bgRed"
          : "bgMuted";
      const progressTone =
        project.status === "IN_PROGRESS" || project.status === "COMPLETED"
          ? "pfGreen"
          : project.status === "REVIEW"
          ? "pfAmber"
          : project.status === "PLANNING"
          ? "pfPurple"
          : "pfGreen";
      return {
        id: project.id,
        name: project.name,
        status: project.status,
        statusTone,
        progressTone,
        progressPercent: project.progressPercent ?? 0,
        dueAt: project.dueAt,
        description: project.description,
        priority: project.priority,
        ownerName: project.ownerName,
        budgetCents: project.budgetCents ?? 0,
        collaborators,
        activeSessions,
        milestones: project.milestones ?? []
      };
    });
  }, [effectiveProjectDetails.length, projectCollaborationById, projectScopedProjects, scopedProjectDetails]);

  const recentThreads = useMemo<ThreadPreview[]>(() => {
    const palette = ["var(--accent)", "var(--purple)", "var(--amber)"];
    return [...projectScopedConversations]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .map((conversation, index) => {
        const lastMessage = effectiveMessagePreviewMap[conversation.id];
        const projectName = projects.find((p) => p.id === conversation.projectId)?.name ?? "General";
        return {
          id: conversation.id,
          sender: conversation.subject,
          project: projectName,
          time: formatRelative(conversation.updatedAt),
          preview: lastMessage?.content ?? conversation.subject,
          avatar: {
            label: getInitials(conversation.subject),
            bg: palette[index % palette.length],
            color: index % palette.length === 1 ? "#fff" : "var(--on-accent)"
          },
          unread: conversation.status === "OPEN"
        };
      });
  }, [effectiveMessagePreviewMap, projectScopedConversations, projects]);

  const allMessageThreads = useMemo<ThreadPreview[]>(() => {
    const palette = ["var(--accent)", "var(--purple)", "var(--amber)", "var(--surface2)"];
    return [...projectScopedConversations]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((conversation, index) => {
        const lastMessage = effectiveMessagePreviewMap[conversation.id];
        const projectName = projects.find((p) => p.id === conversation.projectId)?.name ?? "General";
        return {
          id: conversation.id,
          sender: conversation.subject,
          project: projectName,
          time: formatRelative(conversation.updatedAt),
          preview: lastMessage?.content ?? conversation.subject,
          avatar: {
            label: getInitials(conversation.subject),
            bg: palette[index % palette.length],
            color: index % palette.length === 1 ? "#fff" : index % palette.length === 3 ? "var(--muted)" : "var(--on-accent)",
            bordered: index % palette.length === 3
          },
          unread: conversation.status === "OPEN"
        };
      });
  }, [effectiveMessagePreviewMap, projectScopedConversations, projects]);

  const messageThreads = useMemo<ThreadPreview[]>(() => {
    const q = [searchQuery, threadSearch.trim().toLowerCase()].filter(Boolean).join(" ");
    if (!q) return allMessageThreads;
    return allMessageThreads.filter((thread) => {
      return (
        thread.sender.toLowerCase().includes(q) ||
        thread.project.toLowerCase().includes(q) ||
        thread.preview.toLowerCase().includes(q)
      );
    });
  }, [allMessageThreads, searchQuery, threadSearch]);

  const invoiceRows = useMemo(() => {
    return dateScopedInvoices.map((invoice) => {
      const badgeTone =
        invoice.status === "OVERDUE"
          ? "red"
          : invoice.status === "PAID"
          ? "green"
          : invoice.status === "ISSUED"
          ? "amber"
          : "muted";
      return {
        id: invoice.number,
        sourceId: invoice.id,
        issued: invoice.issuedAt ? formatDateLong(invoice.issuedAt) : formatDateLong(invoice.createdAt),
        amount: formatMoney(convertMoney(invoice.amountCents, invoice.currency), displayCurrency),
        amountTone: invoice.status === "OVERDUE" ? "var(--red)" : undefined,
        badge: {
          label: invoice.status === "ISSUED" ? "Due Soon" : formatStatus(invoice.status),
          tone: badgeTone === "muted" ? "amber" : (badgeTone as "amber" | "red" | "green")
        },
        action: {
          label: invoice.status === "PAID" ? "PDF" : "Pay",
          tone: (invoice.status === "PAID" ? "ghost" : "accent") as "accent" | "ghost"
        }
      };
    });
  }, [convertMoney, dateScopedInvoices, displayCurrency]);

  const invoiceTableRows = useMemo(() => {
    return dateScopedInvoices.map((invoice) => {
      const badgeTone =
        invoice.status === "OVERDUE"
          ? "red"
          : invoice.status === "PAID"
          ? "green"
          : invoice.status === "ISSUED"
          ? "amber"
          : "muted";
      return {
        id: invoice.number,
        sourceId: invoice.id,
        status: invoice.status,
        project: defaultProjectName,
        issued: formatDateLong(invoice.issuedAt ?? invoice.createdAt),
        due: invoice.dueAt ? formatDateLong(invoice.dueAt) : "TBD",
        dueTone: invoice.dueAt && isPast(invoice.dueAt) ? "var(--red)" : "var(--muted)",
        amount: formatMoney(convertMoney(invoice.amountCents, invoice.currency), displayCurrency),
        amountTone: invoice.status === "OVERDUE" ? "var(--red)" : "var(--text)",
        badge: {
          label: invoice.status === "ISSUED" ? "Due Soon" : formatStatus(invoice.status),
          tone: badgeTone === "muted" ? "amber" : (badgeTone as "amber" | "red" | "green")
        },
        action: {
          label: invoice.status === "PAID" ? "Download PDF" : "Pay Now",
          tone: (invoice.status === "PAID" ? "ghost" : "accent") as "accent" | "ghost"
        }
      };
    });
  }, [convertMoney, dateScopedInvoices, defaultProjectName, displayCurrency]);

  const filteredInvoiceTable = useMemo(() => {
    if (activeInvoiceTab === "paid") {
      return invoiceTableRows.filter((row) => row.status === "PAID");
    }
    if (activeInvoiceTab === "outstanding") {
      return invoiceTableRows.filter((row) => row.status === "ISSUED" || row.status === "OVERDUE");
    }
    return invoiceTableRows;
  }, [activeInvoiceTab, invoiceTableRows]);

  const searchedProjectRows = useMemo(() => {
    if (!searchQuery) return projectRows;
    return projectRows.filter((row) => `${row.name} ${row.subtitle} ${row.status} ${row.due}`.toLowerCase().includes(searchQuery));
  }, [projectRows, searchQuery]);

  const searchedMilestoneRows = useMemo(() => {
    if (!searchQuery) return milestoneRows;
    return milestoneRows.filter((row) =>
      `${row.title} ${row.date} ${row.fileName ?? ""} ${row.approval}`.toLowerCase().includes(searchQuery)
    );
  }, [milestoneRows, searchQuery]);

  const searchedRecentThreads = useMemo(() => {
    if (!searchQuery) return recentThreads;
    return recentThreads.filter((row) =>
      `${row.sender} ${row.project} ${row.preview}`.toLowerCase().includes(searchQuery)
    );
  }, [recentThreads, searchQuery]);

  const searchedInvoiceRows = useMemo(() => {
    if (!searchQuery) return invoiceRows;
    return invoiceRows.filter((row) =>
      `${row.id} ${row.amount} ${row.badge.label}`.toLowerCase().includes(searchQuery)
    );
  }, [invoiceRows, searchQuery]);

  const searchedProjectCards = useMemo(() => {
    const scopedCards = projectScopeId ? projectCards.filter((row) => row.id === projectScopeId) : projectCards;
    if (!searchQuery) return scopedCards;
    return scopedCards.filter((row) =>
      `${row.name} ${row.description ?? ""} ${row.status} ${row.ownerName ?? ""}`.toLowerCase().includes(searchQuery)
    );
  }, [projectCards, projectScopeId, searchQuery]);

  const searchedFilteredInvoiceTable = useMemo(() => {
    if (!searchQuery) return filteredInvoiceTable;
    return filteredInvoiceTable.filter((row) =>
      `${row.id} ${row.project} ${row.amount} ${row.badge.label} ${row.status}`.toLowerCase().includes(searchQuery)
    );
  }, [filteredInvoiceTable, searchQuery]);

  const invoiceTabs = useMemo(
    () => [
      { id: "all" as const, label: `All (${invoiceTableRows.length})` },
      {
        id: "outstanding" as const,
        label: `Outstanding (${invoiceTableRows.filter((row) => row.status === "ISSUED" || row.status === "OVERDUE").length})`
      },
      { id: "paid" as const, label: `Paid (${invoiceTableRows.filter((row) => row.status === "PAID").length})` }
    ],
    [invoiceTableRows]
  );

  const invoiceSummaryStats = useMemo<DashboardStat[]>(() => {
    const outstandingTotal = scopedOutstandingInvoices.reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);
    const paidThisMonth = dateScopedInvoices.filter((invoice) => {
      if (!invoice.paidAt) return false;
      const paidDate = new Date(invoice.paidAt);
      const now = new Date();
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
    });
    const paidTotal = paidThisMonth.reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);
    const year = new Date().getFullYear();
    const billedYtd = dateScopedInvoices
      .filter((invoice) => {
        const created = new Date(invoice.createdAt);
        return created.getFullYear() === year;
      })
      .reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);

    return [
      {
        label: "Outstanding",
        value: formatMoney(outstandingTotal, displayCurrency),
        delta: `${scopedOutstandingInvoices.length} invoice${scopedOutstandingInvoices.length === 1 ? "" : "s"} due`,
        tone: "var(--amber)",
        deltaTone: scopedOutstandingInvoices.length > 0 ? "deltaWarn" : "deltaUp"
      },
      {
        label: "Paid This Month",
        value: formatMoney(paidTotal, displayCurrency),
        delta: `${paidThisMonth.length} invoice${paidThisMonth.length === 1 ? "" : "s"} settled`,
        tone: "var(--accent)",
        deltaTone: "deltaUp"
      },
      {
        label: "Total Billed (YTD)",
        value: formatMoney(billedYtd, displayCurrency),
        delta: `${projectScopedProjects.length} scoped project${projectScopedProjects.length === 1 ? "" : "s"}`,
        tone: "transparent",
        deltaTone: ""
      }
    ];
  }, [convertMoney, dateScopedInvoices, displayCurrency, projectScopedProjects.length, scopedOutstandingInvoices]);

  const dashboardStats = useMemo<DashboardStat[]>(() => {
    const activeProjects = projectScopedProjects.filter((project) => project.status !== "COMPLETED" && project.status !== "CANCELLED");
    const completedMilestones = scopedMilestones.filter((entry) => entry.milestone.status === "COMPLETED");
    const completedLast30 = completedMilestones.filter((entry) => {
      const date = new Date(entry.milestone.updatedAt);
      return nowTs - date.getTime() < 30 * 24 * 60 * 60 * 1000;
    });
    const updatedThreads = projectScopedConversations.filter((conversation) => {
      const date = new Date(conversation.updatedAt);
      return nowTs - date.getTime() < 7 * 24 * 60 * 60 * 1000;
    });

    return [
      {
        label: "Active Projects",
        value: String(activeProjects.length),
        delta: `${activeProjects.length} live engagement${activeProjects.length === 1 ? "" : "s"}`,
        tone: "var(--accent)",
        deltaTone: "deltaUp"
      },
      {
        label: "Milestones Done",
        value: String(completedMilestones.length),
        delta: `${completedLast30.length} completed in 30 days`,
        tone: "var(--purple)",
        deltaTone: completedLast30.length > 0 ? "deltaUp" : "deltaWarn"
      },
      {
        label: "Outstanding Balance",
        value: formatMoney(scopedOutstandingInvoices.reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0), displayCurrency),
        delta: `${scopedOutstandingInvoices.length} invoice${scopedOutstandingInvoices.length === 1 ? "" : "s"} due`,
        tone: "var(--amber)",
        deltaTone: scopedOutstandingInvoices.length > 0 ? "deltaWarn" : "deltaUp"
      },
      {
        label: "Unread Messages",
        value: String(updatedThreads.length),
        delta: `${updatedThreads.length} thread${updatedThreads.length === 1 ? "" : "s"} updated this week`,
        tone: "var(--purple)",
        deltaTone: "deltaUp"
      }
    ];
  }, [convertMoney, displayCurrency, nowTs, projectScopedConversations, projectScopedProjects, scopedMilestones, scopedOutstandingInvoices]);

  const nextActions = useMemo<ActionItem[]>(() => {
    const actions: ActionItem[] = [];
    const overdue = dateScopedInvoices.filter((invoice) => invoice.status === "OVERDUE");
    overdue.slice(0, 2).forEach((invoice) => {
      actions.push({ id: `invoice-${invoice.id}`, title: `Pay invoice ${invoice.number}`, meta: invoice.dueAt ? `Overdue · ${formatDateShort(invoice.dueAt)}` : "Overdue", tone: "red" });
    });
    const upcomingMilestones = allMilestones
      .filter((entry) => entry.milestone.status !== "COMPLETED")
      .filter((entry) => entry.milestone.dueAt && !isPast(entry.milestone.dueAt))
      .sort((a, b) => new Date(a.milestone.dueAt ?? 0).getTime() - new Date(b.milestone.dueAt ?? 0).getTime())
      .slice(0, 2);
    upcomingMilestones.forEach((entry) => {
      actions.push({ id: `milestone-${entry.milestone.id}`, title: `Review milestone: ${entry.milestone.title}`, meta: `Due · ${formatDateShort(entry.milestone.dueAt)}`, tone: "amber" });
    });
    const blockedTasks = scopedProjectDetails.flatMap((detail) => detail.tasks.filter((task) => task.status === "BLOCKED"));
    blockedTasks.slice(0, 2).forEach((task) => {
      actions.push({ id: `task-${task.id}`, title: `Unblock task: ${task.title}`, meta: task.dueAt ? `Due · ${formatDateShort(task.dueAt)}` : "Needs attention", tone: "purple" });
    });
    if (actions.length === 0) {
      actions.push({ id: "action-none", title: "All caught up", meta: "No urgent actions right now", tone: "accent" });
    }
    return actions.slice(0, 5);
  }, [allMilestones, dateScopedInvoices, scopedProjectDetails]);

  const slaAlerts = useMemo<RiskItem[]>(() => {
    const risks: RiskItem[] = [];
    const soonCutoff = nowTs + 1000 * 60 * 60 * 24 * 3;
    projectScopedProjects.filter((p) => p.riskLevel === "HIGH").forEach((p) => {
      risks.push({ id: `risk-${p.id}`, title: `${p.name} marked high risk`, meta: `Due ${p.dueAt ? formatDateShort(p.dueAt) : "TBD"}`, tone: "red" });
    });
    allMilestones.filter((e) => e.milestone.status !== "COMPLETED").filter((e) => e.milestone.dueAt && isPast(e.milestone.dueAt)).forEach((e) => {
      risks.push({ id: `milestone-risk-${e.milestone.id}`, title: `Milestone overdue: ${e.milestone.title}`, meta: `Due ${formatDateShort(e.milestone.dueAt)}`, tone: "amber" });
    });
    dateScopedInvoices.filter((inv) => inv.status === "OVERDUE").forEach((inv) => {
      risks.push({ id: `invoice-risk-${inv.id}`, title: `Invoice ${inv.number} overdue`, meta: inv.dueAt ? `Due ${formatDateShort(inv.dueAt)}` : "Overdue", tone: "red" });
    });
    scopedProjectDetails.flatMap((d) => d.tasks.filter((t) => t.status === "BLOCKED")).slice(0, 3).forEach((t) => {
      risks.push({ id: `task-blocked-${t.id}`, title: `Blocked task: ${t.title}`, meta: t.dueAt ? `Due ${formatDateShort(t.dueAt)}` : "No ETA yet", tone: "amber" });
    });
    allMilestones.filter((e) => e.milestone.status !== "COMPLETED").filter((e) => e.milestone.dueAt).filter((e) => new Date(e.milestone.dueAt ?? 0).getTime() <= soonCutoff).forEach((e) => {
      risks.push({ id: `milestone-soon-${e.milestone.id}`, title: `SLA window closing: ${e.milestone.title}`, meta: `Due ${formatDateShort(e.milestone.dueAt)}`, tone: "amber" });
    });
    scopedBlockers.filter((b) => b.status !== "RESOLVED").forEach((b) => {
      risks.push({ id: `blocker-${b.id}`, title: `Blocker: ${b.title}`, meta: b.etaAt ? `ETA ${formatDateShort(b.etaAt)}` : "No ETA set", tone: b.severity === "HIGH" || b.severity === "CRITICAL" ? "red" : "amber" });
    });
    return risks.slice(0, 5);
  }, [allMilestones, dateScopedInvoices, nowTs, projectScopedProjects, scopedBlockers, scopedProjectDetails]);

  const onboardingChecklist = useMemo<OnboardingChecklistItem[]>(() => {
    const firstProject = scopedProjectDetails[0];
    if (!firstProject) return [];
    const ownerAssigned = Boolean(firstProject.ownerName);
    const hasMilestones = firstProject.milestones.length > 0;
    const requiredFiles = snapshot.files.length > 0;
    const etaDefined = Boolean(firstProject.dueAt);
    return [
      { id: "owner", label: "Delivery owner assigned", status: ownerAssigned ? "done" : "pending", detail: ownerAssigned ? `Owner: ${firstProject.ownerName}` : "Assign an owner in project settings." },
      { id: "milestones", label: "Milestones mapped", status: hasMilestones ? "done" : "pending", detail: hasMilestones ? `${firstProject.milestones.length} milestones planned.` : "No milestones yet." },
      { id: "files", label: "Required files uploaded", status: requiredFiles ? "done" : "pending", detail: requiredFiles ? `${snapshot.files.length} file(s) on record.` : "Upload kickoff files." },
      { id: "eta", label: "Delivery ETA confirmed", status: etaDefined ? "done" : "pending", detail: etaDefined ? `ETA: ${formatDateShort(firstProject.dueAt)}` : "No delivery ETA set." }
    ];
  }, [scopedProjectDetails, snapshot.files]);

  const digestItems = useMemo<LoginDigestItem[]>(() => {
    if (!lastLoginAt) return [];
    const sinceTs = new Date(lastLoginAt).getTime();
    if (Number.isNaN(sinceTs)) return [];
    const digest: LoginDigestItem[] = [];
    projectScopedConversations.filter((c) => new Date(c.updatedAt).getTime() > sinceTs).slice(0, 2).forEach((c) => {
      digest.push({ id: `digest-thread-${c.id}`, change: `Thread updated: ${c.subject}`, impact: "Communication is active on this workstream", action: "Open messages to review and reply", time: formatRelative(c.updatedAt) });
    });
    dateScopedInvoices.filter((inv) => new Date(inv.updatedAt).getTime() > sinceTs).slice(0, 2).forEach((inv) => {
      digest.push({ id: `digest-invoice-${inv.id}`, change: `Invoice ${inv.number} changed to ${formatStatus(inv.status)}`, impact: formatMoney(convertMoney(inv.amountCents, inv.currency), displayCurrency), action: inv.status === "OVERDUE" ? "Review overdue balance in billing" : "Review billing updates", time: formatRelative(inv.updatedAt) });
    });
    allMilestones.filter((e) => new Date(e.milestone.updatedAt).getTime() > sinceTs).slice(0, 2).forEach((e) => {
      digest.push({ id: `digest-milestone-${e.milestone.id}`, change: `Milestone update: ${e.milestone.title}`, impact: `Status ${formatStatus(e.milestone.status)}`, action: (milestoneApprovals[e.milestone.id]?.status ?? "PENDING") === "PENDING" ? "Review pending milestone approval" : "Track delivery progress", time: formatRelative(e.milestone.updatedAt) });
    });
    return digest.slice(0, 6);
  }, [allMilestones, convertMoney, dateScopedInvoices, displayCurrency, lastLoginAt, milestoneApprovals, projectScopedConversations]);

  const actionCenter = useMemo<ActionCenterItem[]>(() => {
    const pendingApprovals = scopedMilestones.filter((e) => (milestoneApprovals[e.milestone.id]?.status ?? "PENDING") === "PENDING").length;
    const unreadMessages = projectScopedConversations.filter((c) => c.status === "OPEN").length;
    const overdueInvoicesCount = dateScopedInvoices.filter((inv) => inv.status === "OVERDUE").length;
    const checklistGaps = onboardingChecklist.filter((item) => item.status === "pending").length;
    return [
      { id: "center-approvals", label: "Pending approvals", value: pendingApprovals, detail: pendingApprovals > 0 ? "needs review" : "all clear", tone: pendingApprovals > 0 ? "amber" : "accent", target: "projects" },
      { id: "center-messages", label: "Unread messages", value: unreadMessages, detail: unreadMessages > 0 ? "inbox active" : "all clear", tone: unreadMessages > 0 ? "purple" : "accent", target: "messages" },
      { id: "center-overdue", label: "Overdue invoices", value: overdueInvoicesCount, detail: overdueInvoicesCount > 0 ? "payment risk" : "on track", tone: overdueInvoicesCount > 0 ? "red" : "accent", target: "invoices" },
      { id: "center-gaps", label: "Checklist gaps", value: checklistGaps, detail: checklistGaps > 0 ? "action needed" : "ready", tone: checklistGaps > 0 ? "amber" : "accent", target: "projects" }
    ];
  }, [dateScopedInvoices, milestoneApprovals, onboardingChecklist, projectScopedConversations, scopedMilestones]);

  const approvalQueue = useMemo<ApprovalQueueItem[]>(() => {
    const queue: ApprovalQueueItem[] = [];
    allMilestones.filter((e) => (milestoneApprovals[e.milestone.id]?.status ?? "PENDING") === "PENDING").slice(0, 4).forEach((e) => {
      queue.push({ id: `approval-milestone-${e.milestone.id}`, title: e.milestone.title, detail: e.milestone.dueAt ? `Milestone approval pending · Due ${formatDateShort(e.milestone.dueAt)}` : "Milestone approval pending", priority: e.milestone.dueAt && isPast(e.milestone.dueAt) ? "high" : "normal" });
    });
    scopedChangeRequests.filter((r) => r.status === "SUBMITTED" || r.status === "ESTIMATED" || r.status === "ADMIN_APPROVED").slice(0, 3).forEach((r) => {
      queue.push({ id: `approval-change-${r.id}`, title: r.title, detail: `Change request · ${formatStatus(r.status)}`, priority: r.status === "ADMIN_APPROVED" ? "high" : "normal" });
    });
    return queue.slice(0, 6);
  }, [allMilestones, milestoneApprovals, scopedChangeRequests]);

  const decisionLog = useMemo<DecisionLogItem[]>(() => {
    const entries: Array<DecisionLogItem & { ts: number }> = [];
    allMilestones.filter((e) => { const s = milestoneApprovals[e.milestone.id]?.status ?? "PENDING"; return s === "APPROVED" || s === "REJECTED"; }).forEach((e) => {
      const ts = new Date(e.milestone.updatedAt).getTime();
      const decision = milestoneApprovals[e.milestone.id]?.status ?? "PENDING";
      entries.push({ id: `decision-milestone-${e.milestone.id}`, title: `${e.milestone.title} ${decision === "APPROVED" ? "approved" : "rejected"}`, detail: `Milestone · ${formatStatus(e.milestone.status)}`, time: formatRelative(e.milestone.updatedAt), ts: Number.isNaN(ts) ? 0 : ts });
    });
    scopedChangeRequests.filter((r) => r.status === "ADMIN_REJECTED" || r.status === "CLIENT_APPROVED" || r.status === "CLIENT_REJECTED").forEach((r) => {
      const ts = new Date(r.updatedAt).getTime();
      entries.push({ id: `decision-change-${r.id}`, title: `${r.title} ${formatStatus(r.status).toLowerCase()}`, detail: "Change request decision", time: formatRelative(r.updatedAt), ts: Number.isNaN(ts) ? 0 : ts });
    });
    return entries.sort((a, b) => b.ts - a.ts).slice(0, 6).map((e) => ({ id: e.id, title: e.title, detail: e.detail, time: e.time }));
  }, [allMilestones, milestoneApprovals, scopedChangeRequests]);

  const confidenceSummary = useMemo<ConfidenceSummary>(() => {
    const overdueMilestones = allMilestones.filter((e) => e.milestone.dueAt && isPast(e.milestone.dueAt) && e.milestone.status !== "COMPLETED").length;
    const blockedTasks = scopedProjectDetails.flatMap((d) => d.tasks.filter((t) => t.status === "BLOCKED")).length;
    const highRiskProjects = projectScopedProjects.filter((p) => p.riskLevel === "HIGH").length;
    const totalSignals = Math.max(allMilestones.length + scopedProjectDetails.length, 1);
    const penalties = overdueMilestones * 16 + blockedTasks * 12 + highRiskProjects * 18;
    const score = Math.max(5, Math.min(97, 100 - Math.round((penalties / totalSignals) * 10)));
    const tone: ConfidenceSummary["tone"] = score < 45 ? "red" : score < 70 ? "amber" : "accent";
    const label: ConfidenceSummary["label"] = score < 45 ? "At Risk" : score < 70 ? "Needs Attention" : "On Track";
    return { score, tone, label, reasons: [`${overdueMilestones} overdue milestone${overdueMilestones === 1 ? "" : "s"}`, `${blockedTasks} blocked task${blockedTasks === 1 ? "" : "s"}`, `${highRiskProjects} high-risk project${highRiskProjects === 1 ? "" : "s"}`], nextActions: ["Prioritize blocked tasks with owner assignment", "Confirm near-term milestone approvals", "Resolve overdue invoices impacting delivery cadence"] };
  }, [allMilestones, projectScopedProjects, scopedProjectDetails]);

  const activityFeed = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    scopedProjectDetails.forEach((detail) => {
      detail.activities.slice(0, 10).forEach((activity) => {
        const timestamp = new Date(activity.createdAt).getTime();
        items.push({ id: activity.id, icon: "✓", title: activity.type.replace(/_/g, " ").toLowerCase(), detail: activity.details ?? detail.name, time: formatRelative(activity.createdAt), tone: "accent", timestamp: Number.isNaN(timestamp) ? 0 : timestamp });
      });
    });
    dateScopedInvoices.forEach((invoice) => {
      const timestamp = new Date(invoice.updatedAt).getTime();
      items.push({ id: `invoice-${invoice.id}`, icon: invoice.status === "PAID" ? "✓" : "🧾", title: `Invoice ${invoice.number}`, detail: `${invoice.status.toLowerCase()} · ${formatMoney(convertMoney(invoice.amountCents, invoice.currency), displayCurrency)}`, time: formatRelative(invoice.updatedAt), tone: invoice.status === "OVERDUE" ? "red" : invoice.status === "PAID" ? "accent" : "amber", timestamp: Number.isNaN(timestamp) ? 0 : timestamp });
    });
    snapshot.files.forEach((file) => {
      const timestamp = new Date(file.createdAt).getTime();
      items.push({ id: `file-${file.id}`, icon: "📄", title: file.fileName, detail: "File uploaded", time: formatRelative(file.createdAt), tone: "purple", timestamp: Number.isNaN(timestamp) ? 0 : timestamp });
    });
    projectScopedConversations.forEach((conversation) => {
      const timestamp = new Date(conversation.updatedAt).getTime();
      items.push({ id: `thread-${conversation.id}`, icon: "💬", title: conversation.subject, detail: "Thread updated", time: formatRelative(conversation.updatedAt), tone: "accent", timestamp: Number.isNaN(timestamp) ? 0 : timestamp });
    });
    scopedTimelineEvents.forEach((event) => {
      const timestamp = new Date(event.createdAt).getTime();
      items.push({ id: `timeline-${event.id}`, icon: event.category === "BLOCKER" ? "⚠" : event.category === "LEAD" ? "◎" : "✓", title: event.title, detail: event.detail ?? "Shared timeline update", time: formatRelative(event.createdAt), tone: event.category === "BLOCKER" ? "amber" : event.category === "LEAD" ? "purple" : "accent", timestamp: Number.isNaN(timestamp) ? 0 : timestamp });
    });
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
  }, [convertMoney, dateScopedInvoices, displayCurrency, projectScopedConversations, scopedProjectDetails, scopedTimelineEvents, snapshot.files]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    allMilestones.forEach((entry) => {
      if (!entry.milestone.dueAt) return;
      const timestamp = new Date(entry.milestone.dueAt).getTime();
      items.push({ id: entry.milestone.id, title: entry.milestone.title, meta: projectScopedProjects.find((p) => p.id === entry.projectId)?.name ?? "Project", dateLabel: formatDateShort(entry.milestone.dueAt), tone: entry.milestone.status === "COMPLETED" ? "muted" : "accent", timestamp: Number.isNaN(timestamp) ? 0 : timestamp });
    });
    dateScopedInvoices.forEach((invoice) => {
      if (!invoice.dueAt) return;
      const timestamp = new Date(invoice.dueAt).getTime();
      items.push({ id: `invoice-${invoice.id}`, title: `Invoice ${invoice.number} due`, meta: formatMoney(convertMoney(invoice.amountCents, invoice.currency), displayCurrency), dateLabel: formatDateShort(invoice.dueAt), tone: invoice.status === "OVERDUE" ? "amber" : "purple", timestamp: Number.isNaN(timestamp) ? 0 : timestamp });
    });
    return items.sort((a, b) => a.timestamp - b.timestamp).slice(0, 6);
  }, [allMilestones, convertMoney, dateScopedInvoices, displayCurrency, projectScopedProjects]);

  const lastUpdatedAt = useMemo(() => {
    const dates = [
      ...projectScopedProjects.map((p) => p.updatedAt),
      ...projectScopedConversations.map((c) => c.updatedAt),
      ...dateScopedInvoices.map((inv) => inv.updatedAt),
      ...snapshot.files.map((f) => f.updatedAt)
    ];
    const latest = dates.map((v) => new Date(v).getTime()).filter((v) => !Number.isNaN(v)).sort((a, b) => b - a)[0];
    return latest ? new Date(latest).toISOString() : null;
  }, [dateScopedInvoices, projectScopedConversations, projectScopedProjects, snapshot.files]);

  const lastSyncedLabel = lastUpdatedAt ? formatRelative(lastUpdatedAt) : "Awaiting data";

  return {
    projectRows,
    milestoneRows,
    pendingApprovalCount,
    clientAutomationRows,
    projectCards,
    recentThreads,
    allMessageThreads,
    messageThreads,
    invoiceRows,
    invoiceTableRows,
    filteredInvoiceTable,
    searchedProjectRows,
    searchedMilestoneRows,
    searchedRecentThreads,
    searchedInvoiceRows,
    searchedProjectCards,
    searchedFilteredInvoiceTable,
    invoiceTabs,
    invoiceSummaryStats,
    dashboardStats,
    nextActions,
    slaAlerts,
    onboardingChecklist,
    digestItems,
    actionCenter,
    approvalQueue,
    decisionLog,
    confidenceSummary,
    activityFeed,
    timelineItems,
    lastSyncedLabel
  };
}
