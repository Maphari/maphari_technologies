"use client";

import { useMemo } from "react";
import type {
  ActivityItem,
  DashboardDigestItem,
  DashboardFocusItem,
  DashboardInboxItem,
  TaskContext,
  ClientThread
} from "../types";
import { formatDateLong, formatStatus } from "../utils";

type AdminClient = {
  id: string;
  name: string;
};

type AdminConversation = {
  id: string;
  clientId: string;
  projectId: string | null;
  subject: string;
  status: string;
  updatedAt: string;
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

type TimelineEvent = {
  id: string;
  category: "PROJECT" | "LEAD" | "BLOCKER";
  title: string;
  detail: string | null;
  createdAt: string;
};

type ProjectChangeRequest = {
  id: string;
  projectId: string;
  status: string;
  title: string;
};

export type UseStaffActivityReturn = {
  activityFeed: ActivityItem[];
  focusQueue: DashboardFocusItem[];
  actionInbox: DashboardInboxItem[];
  digestItems: DashboardDigestItem[];
};

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

type Params = {
  conversations: AdminConversation[];
  clientById: Map<string, AdminClient>;
  projectById: Map<string, AdminProject>;
  nowTs: number;
  effectiveProjectDetails: Array<{
    id: string;
    clientId: string;
    name: string;
    riskLevel?: string;
    activities: Array<{
      id: string;
      type: string;
      details: string | null;
      createdAt: string;
    }>;
    milestones: Array<{
      id: string;
      title: string;
      status: string;
      dueAt: string | null;
      updatedAt: string;
      fileId: string | null;
    }>;
    tasks: Array<{
      id: string;
      status: string;
      dueAt: string | null;
      updatedAt: string;
      createdAt: string;
    }>;
    progressPercent: number;
  }>;
  taskContexts: TaskContext[];
  threadItems: ClientThread[];
  projectBlockers: ProjectBlocker[];
  timelineEvents: TimelineEvent[];
  changeRequests: ProjectChangeRequest[];
  notificationJobs: Array<{ id: string; status: string; tab: string; readAt: string | null }>;
  dashboardLastSeenAt: string | null | undefined;
  searchQuery: string;
};

function summarizeStructuredDetails(value: string | null, type: string): string {
  if (!value) return formatStatus(type);
  const trimmed = value.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return value;

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return value;

    const selectedServices = Array.isArray(parsed.selectedServices)
      ? parsed.selectedServices.filter((item): item is string => typeof item === "string")
      : [];
    const depositStatus = typeof parsed.depositPaymentStatus === "string" ? parsed.depositPaymentStatus : null;
    const buildMode = typeof parsed.buildMode === "string" ? parsed.buildMode : null;
    const serviceType = typeof parsed.serviceType === "string" ? parsed.serviceType : null;
    const scopePrompt = typeof parsed.scopePrompt === "string" ? parsed.scopePrompt : null;

    const parts: string[] = [];
    if (serviceType) parts.push(formatStatus(serviceType));
    if (buildMode) parts.push(`Build ${formatStatus(buildMode)}`);
    if (selectedServices.length > 0) parts.push(selectedServices.map((item) => formatStatus(item)).join(", "));
    if (depositStatus) parts.push(`Deposit ${formatStatus(depositStatus)}`);

    if (parts.length > 0) return parts.join(" · ");
    if (scopePrompt && scopePrompt.trim().length > 0) return "Scope prompt submitted";
    return formatStatus(type);
  } catch {
    return value;
  }
}

function formatEventTitle(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Activity";
  // Normalize machine event codes like PROJECT_REQUESTED
  return formatStatus(trimmed);
}

export function useStaffActivity({
  conversations,
  clientById,
  projectById,
  effectiveProjectDetails,
  taskContexts,
  threadItems,
  projectBlockers,
  timelineEvents,
  changeRequests,
  notificationJobs,
  dashboardLastSeenAt,
  searchQuery,
  nowTs
}: Params): UseStaffActivityReturn {
  const activityFeed = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    effectiveProjectDetails.forEach((project) => {
      const clientName = clientById.get(project.clientId)?.name ?? "Client";
      project.activities.forEach((activity) => {
        const icon = activity.type.includes("COMPLETE") ? "✓" : activity.type.includes("BLOCK") ? "⚑" : "•";
        const tone = activity.type.includes("BLOCK") ? "var(--red-d)" : activity.type.includes("COMPLETE") ? "var(--green-d)" : "var(--accent-d)";
        const color = activity.type.includes("BLOCK") ? "var(--red)" : activity.type.includes("COMPLETE") ? "var(--green)" : "var(--accent)";
        items.push({
          id: activity.id,
          icon,
          tone,
          color,
          text: summarizeStructuredDetails(activity.details, activity.type),
          detail: `${project.name} · ${clientName}`,
          time: formatDateLong(activity.createdAt),
          timestamp: new Date(activity.createdAt).getTime()
        });
      });
    });

    taskContexts
      .filter((task) => task.status === "DONE")
      .forEach((task) => {
        items.push({
          id: `task-${task.id}`,
          icon: "✓",
          tone: "var(--green-d)",
          color: "var(--green)",
          text: task.title,
          detail: `${task.projectName} · Marked complete`,
          time: formatDateLong(task.updatedAt),
          timestamp: new Date(task.updatedAt).getTime()
        });
      });

    timelineEvents.forEach((event) => {
      const tone =
        event.category === "BLOCKER"
          ? "var(--amber-d)"
          : event.category === "LEAD"
          ? "var(--purple-d)"
          : "var(--accent-d)";
      const color =
        event.category === "BLOCKER"
          ? "var(--amber)"
          : event.category === "LEAD"
          ? "var(--purple)"
          : "var(--accent)";
      items.push({
        id: `timeline-${event.id}`,
        icon: event.category === "BLOCKER" ? "⚠" : event.category === "LEAD" ? "◎" : "•",
        tone,
        color,
        text: formatEventTitle(event.title),
        detail: summarizeStructuredDetails(event.detail, event.title),
        time: formatDateLong(event.createdAt),
        timestamp: new Date(event.createdAt).getTime()
      });
    });

    const sorted = items.sort((a, b) => b.timestamp - a.timestamp);
    if (!searchQuery) return sorted.slice(0, 6);
    return sorted
      .filter((item) => `${item.text} ${item.detail}`.toLowerCase().includes(searchQuery))
      .slice(0, 6);
  }, [clientById, effectiveProjectDetails, searchQuery, taskContexts, timelineEvents]);

  const focusQueue = useMemo<DashboardFocusItem[]>(() => {
    const scored: Array<DashboardFocusItem & { score: number }> = [];
    const now = nowTs;

    taskContexts
      .filter((task) => task.status !== "DONE")
      .forEach((task) => {
        const dueTs = task.dueAt ? new Date(task.dueAt).getTime() : null;
        const isOverdue = Boolean(dueTs && dueTs < now);
        if (!(task.priority === "high" || isOverdue)) return;
        scored.push({
          id: `task-${task.id}`,
          title: task.title,
          detail: `${task.projectName} · ${task.clientName} · ${task.dueLabel}`,
          urgency: isOverdue || task.priority === "high" ? "high" : task.priority,
          actionLabel: "Open Task",
          action: "tasks",
          score: isOverdue ? 100 : 80
        });
      });

    threadItems
      .filter((thread) => thread.unread)
      .forEach((thread) => {
        scored.push({
          id: `thread-${thread.id}`,
          title: `Reply needed: ${thread.name}`,
          detail: `${thread.project} · ${thread.preview}`,
          urgency: "med",
          actionLabel: "Reply",
          action: "clients",
          threadId: thread.id,
          score: 70
        });
      });

    projectBlockers
      .filter((blocker) => blocker.status !== "RESOLVED")
      .forEach((blocker) => {
        const clientName = clientById.get(blocker.clientId)?.name ?? "Client";
        const severity = blocker.severity === "CRITICAL" || blocker.severity === "HIGH" ? "high" : "med";
        scored.push({
          id: `blocker-${blocker.id}`,
          title: blocker.title,
          detail: `${clientName} · ${formatStatus(blocker.severity)} blocker`,
          urgency: severity,
          actionLabel: "Resolve",
          action: "deliverables",
          score: blocker.severity === "CRITICAL" ? 95 : blocker.severity === "HIGH" ? 85 : 60
        });
      });

    changeRequests
      .filter((request) => request.status === "SUBMITTED")
      .forEach((request) => {
        const projectName = projectById.get(request.projectId)?.name ?? "Project";
        scored.push({
          id: `change-${request.id}`,
          title: request.title,
          detail: `${projectName} · Estimate pending`,
          urgency: "med",
          actionLabel: "Estimate",
          action: "deliverables",
          score: 65
        });
      });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        detail: item.detail,
        urgency: item.urgency,
        actionLabel: item.actionLabel,
        action: item.action,
        threadId: item.threadId
      }));
  }, [changeRequests, clientById, nowTs, projectBlockers, projectById, taskContexts, threadItems]);

  const actionInbox = useMemo<DashboardInboxItem[]>(() => {
    const failedNotifications = notificationJobs.filter((job) => job.status === "FAILED").length;
    const submittedChangeRequests = changeRequests.filter((request) => request.status === "SUBMITTED").length;
    const unreadThreads = threadItems.filter((thread) => thread.unread).length;
    const openCriticalBlockers = projectBlockers.filter(
      (blocker) =>
        blocker.status !== "RESOLVED" &&
        (blocker.severity === "CRITICAL" || blocker.severity === "HIGH")
    ).length;

    const items: DashboardInboxItem[] = [
      {
        id: "inbox-unread-client",
        label: "Client replies waiting",
        detail: "Unanswered client threads across active projects",
        count: unreadThreads,
        tone: unreadThreads > 0 ? "amber" : "green",
        actionLabel: "Open Threads",
        action: "clients"
      },
      {
        id: "inbox-critical-blockers",
        label: "Critical blockers",
        detail: "Issues that can delay delivery if not handled now",
        count: openCriticalBlockers,
        tone: openCriticalBlockers > 0 ? "red" : "green",
        actionLabel: "Open Blockers",
        action: "deliverables"
      },
      {
        id: "inbox-change-requests",
        label: "Change requests pending estimate",
        detail: "Client scope updates requiring staff estimates",
        count: submittedChangeRequests,
        tone: submittedChangeRequests > 0 ? "blue" : "green",
        actionLabel: "Review",
        action: "deliverables"
      },
      {
        id: "inbox-notification-failures",
        label: "Notification delivery failures",
        detail: "Cross-portal alerts that need retry attention",
        count: failedNotifications,
        tone: failedNotifications > 0 ? "red" : "green",
        actionLabel: "Check Ops",
        action: "timelog"
      }
    ];

    return items.filter((item) => item.count > 0);
  }, [changeRequests, notificationJobs, projectBlockers, threadItems]);

  const digestItems = useMemo<DashboardDigestItem[]>(() => {
    if (!dashboardLastSeenAt) return [];
    const sinceTs = new Date(dashboardLastSeenAt).getTime();
    if (!Number.isFinite(sinceTs)) return [];

    const digest: DashboardDigestItem[] = [];

    timelineEvents
      .filter((event) => new Date(event.createdAt).getTime() > sinceTs)
      .forEach((event) => {
        digest.push({
          id: `timeline-${event.id}`,
          title: formatEventTitle(event.title),
          detail: summarizeStructuredDetails(event.detail, event.title),
          occurredAt: event.createdAt
        });
      });

    conversations
      .filter((conversation) => new Date(conversation.updatedAt).getTime() > sinceTs)
      .forEach((conversation) => {
        const clientName = clientById.get(conversation.clientId)?.name ?? "Client";
        digest.push({
          id: `conversation-${conversation.id}`,
          title: `Thread updated: ${conversation.subject}`,
          detail: `${clientName} · ${formatStatus(conversation.status)}`,
          occurredAt: conversation.updatedAt
        });
      });

    taskContexts
      .filter((task) => new Date(task.updatedAt).getTime() > sinceTs)
      .forEach((task) => {
        digest.push({
          id: `task-${task.id}`,
          title: `Task update: ${task.title}`,
          detail: `${task.projectName} · ${task.statusLabel}`,
          occurredAt: task.updatedAt
        });
      });

    projectBlockers
      .filter((blocker) => new Date(blocker.updatedAt).getTime() > sinceTs)
      .forEach((blocker) => {
        const clientName = clientById.get(blocker.clientId)?.name ?? "Client";
        digest.push({
          id: `blocker-${blocker.id}`,
          title: `Blocker update: ${blocker.title}`,
          detail: `${clientName} · ${formatStatus(blocker.status)}`,
          occurredAt: blocker.updatedAt
        });
      });

    return digest
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 8);
  }, [clientById, conversations, dashboardLastSeenAt, projectBlockers, taskContexts, timelineEvents]);

  return {
    activityFeed,
    focusQueue,
    actionInbox,
    digestItems
  };
}
