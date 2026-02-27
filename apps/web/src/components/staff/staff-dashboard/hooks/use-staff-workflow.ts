"use client";

import { useMemo } from "react";
import { formatRelative, formatStatus } from "../utils";

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

type ProjectCollaborationSnapshot = {
  projectId: string;
  contributors: Array<{
    name: string;
    role: string;
    activeSessions: number;
    taskCount: number;
  }>;
};

type MilestoneStats = {
  overdue: number;
  dueThisWeek: number;
  deliveredThisMonth: number;
};

export type UseStaffWorkflowReturn = {
  staffWorkflowRows: Array<{ id: string; name: string; trigger: string; status: "active" | "draft" | "risk" | "watch"; coverage: string; lastRun: string }>;
  collaborationRows: Array<{ projectId: string; projectName: string; name: string; role: string; activeSessions: number; taskCount: number }>;
  averageProgress: number;
  nextDueDate: Date | null;
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
  projects: AdminProject[];
  projectById: Map<string, AdminProject>;
  projectBlockers: ProjectBlocker[];
  timelineEvents: TimelineEvent[];
  projectCollaboration: Record<string, ProjectCollaborationSnapshot>;
  milestoneStats: MilestoneStats;
  notificationJobs: Array<{ id: string; status: string; tab: string; readAt: string | null }>;
  openConversations: AdminConversation[];
};

export function useStaffWorkflow({
  projects,
  projectById,
  projectBlockers,
  timelineEvents,
  projectCollaboration,
  milestoneStats,
  notificationJobs,
  openConversations
}: Params): UseStaffWorkflowReturn {
  const staffWorkflowRows = useMemo(
    () => [
      {
        id: "staff-msg-routing",
        name: "Client Message Routing",
        trigger: "Conversation updates",
        status: openConversations.length > 0 ? "active" as const : "draft" as const,
        coverage: `${openConversations.length} open thread${openConversations.length === 1 ? "" : "s"}`,
        lastRun: timelineEvents[0] ? formatRelative(timelineEvents[0].createdAt) : "No events yet"
      },
      {
        id: "staff-deliverable-reminders",
        name: "Deliverable Reminder Engine",
        trigger: "Milestone due windows",
        status: milestoneStats.overdue > 0 ? "risk" as const : milestoneStats.dueThisWeek > 0 ? "watch" as const : "active" as const,
        coverage: `${milestoneStats.dueThisWeek} due this week`,
        lastRun: timelineEvents[1] ? formatRelative(timelineEvents[1].createdAt) : "No events yet"
      },
      {
        id: "staff-blocker-escalation",
        name: "Blocker Escalation",
        trigger: "Blocker severity + ETA",
        status: projectBlockers.some((blocker) => blocker.severity === "CRITICAL" && blocker.status !== "RESOLVED")
          ? "risk" as const
          : projectBlockers.some((blocker) => blocker.status !== "RESOLVED")
          ? "watch" as const
          : "active" as const,
        coverage: `${projectBlockers.filter((blocker) => blocker.status !== "RESOLVED").length} open blocker${projectBlockers.filter((blocker) => blocker.status !== "RESOLVED").length === 1 ? "" : "s"}`,
        lastRun: timelineEvents[2] ? formatRelative(timelineEvents[2].createdAt) : "No events yet"
      },
      {
        id: "staff-notification-delivery",
        name: "Notification Delivery",
        trigger: "Queue processing + retries",
        status: notificationJobs.some((job) => job.status === "FAILED")
          ? "risk" as const
          : notificationJobs.some((job) => job.readAt === null && job.tab === "operations")
          ? "watch" as const
          : "active" as const,
        coverage: `${notificationJobs.filter((job) => job.tab === "operations").length} operations alert${notificationJobs.filter((job) => job.tab === "operations").length === 1 ? "" : "s"}`,
        lastRun: timelineEvents[3] ? formatRelative(timelineEvents[3].createdAt) : "No events yet"
      }
    ],
    [milestoneStats.dueThisWeek, milestoneStats.overdue, notificationJobs, openConversations.length, projectBlockers, timelineEvents]
  );

  const collaborationRows = useMemo(() => {
    const rows = Object.values(projectCollaboration)
      .flatMap((entry) =>
        entry.contributors.map((member) => ({
          projectId: entry.projectId,
          projectName: projectById.get(entry.projectId)?.name ?? "Project",
          name: member.name,
          role: formatStatus(member.role),
          activeSessions: member.activeSessions,
          taskCount: member.taskCount
        }))
      )
      .sort((a, b) => b.activeSessions - a.activeSessions || b.taskCount - a.taskCount);
    return rows.slice(0, 6);
  }, [projectById, projectCollaboration]);

  const averageProgress = useMemo(() => {
    if (projects.length === 0) return 0;
    const total = projects.reduce((sum, project) => sum + project.progressPercent, 0);
    return Math.round(total / projects.length);
  }, [projects]);

  const nextDueDate = useMemo(() => {
    const dueDates = projects
      .map((project) => (project.dueAt ? new Date(project.dueAt).getTime() : null))
      .filter((value): value is number => value !== null);
    if (dueDates.length === 0) return null;
    return new Date(Math.min(...dueDates));
  }, [projects]);

  return {
    staffWorkflowRows,
    collaborationRows,
    averageProgress,
    nextDueDate
  };
}
