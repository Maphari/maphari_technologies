// ─── Re-exports for backward compatibility ───
export type { PageId, NavItem } from "./config";

export type TaskContext = {
  id: string;
  projectId: string;
  title: string;
  subtitle: string;
  projectName: string;
  clientName: string;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  statusLabel: string;
  statusTone: "blue" | "green" | "amber" | "red" | "purple" | "muted";
  badgeTone: "blue" | "green" | "amber" | "red" | "purple" | "muted";
  dueAt: string | null;
  dueLabel: string;
  dueTone: string;
  priority: "high" | "med" | "low";
  estimateMinutes: number;
  updatedAt: string;
  createdAt: string;
  progress: number | null;
  assigneeInitials: string;
};

export type KanbanColumn = {
  id?: string;
  title: string;
  count: string;
  tone?: string;
  countTone?: string;
  countBg?: string;
  border?: string;
  policyHint?: string;
  tasks: Array<{
    id: string;
    projectId: string;
    clientName?: string;
    status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
    tag: string;
    title: string;
    priority: "high" | "med" | "low";
    due: string;
    dueAt?: string | null;
    createdAt?: string;
    dueTone?: string;
    ageDays?: number;
    ageTone?: "muted" | "amber" | "red";
    progress?: { value: number; tone: "blue" | "green" | "amber" | "purple" };
    meta?: { comments?: string; avatar: string };
    faded?: boolean;
    blocked?: boolean;
  }>;
};

export type ClientThread = {
  id: string;
  name: string;
  time: string;
  project: string;
  preview: string;
  avatar: { label: string; bg: string; color: string };
  unread?: boolean;
};

export type DeliverableGroup = {
  title: string;
  clientId: string;
  badge: { label: string; tone: "green" | "amber" | "purple" | "blue" };
  items: Array<{
    status: "done" | "doing" | "";
    milestoneStatus?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    dueAt?: string | null;
    title: string;
    meta: string;
    titleTone?: string;
    metaTone?: string;
    fileId?: string | null;
    fileName?: string | null;
    projectId?: string;
    milestoneId?: string;
  }>;
};

export type ActivityItem = {
  id: string;
  icon: string;
  tone: string;
  color: string;
  text: string;
  detail: string;
  time: string;
  timestamp: number;
};

export type TimeEntrySummary = {
  id: string;
  project: string;
  task: string;
  minutes: number;
  loggedAt: string;
  color: string;
};

export type SlaWatchItem = {
  id: string;
  name: string;
  clientName: string;
  statusLabel: string;
  slaDueAt: string | null;
};

export type DashboardFocusItem = {
  id: string;
  title: string;
  detail: string;
  urgency: "high" | "med" | "low";
  actionLabel: string;
  action: "tasks" | "clients" | "deliverables" | "timelog";
  threadId?: string;
};

export type DashboardInboxItem = {
  id: string;
  label: string;
  detail: string;
  count: number;
  tone: "blue" | "amber" | "red" | "green";
  actionLabel: string;
  action: "tasks" | "clients" | "deliverables" | "timelog";
};

export type DashboardDigestItem = {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
};
