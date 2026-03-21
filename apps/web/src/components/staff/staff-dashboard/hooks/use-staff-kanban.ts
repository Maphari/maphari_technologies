"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  createProjectBlockerWithRefresh,
  updateProjectTaskWithRefresh
} from "../../../../lib/api/admin";
import type { KanbanColumn, TaskContext } from "../types";
import { formatDateShort, formatStatus } from "../utils";

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

type AdminConversation = {
  id: string;
  clientId: string;
  projectId: string | null;
  subject: string;
  status: string;
  updatedAt: string;
};

export type UseStaffKanbanReturn = {
  kanbanViewMode: "all" | "my_work" | "urgent" | "client_waiting" | "blocked";
  setKanbanViewMode: React.Dispatch<React.SetStateAction<"all" | "my_work" | "urgent" | "client_waiting" | "blocked">>;
  kanbanSwimlane: "status" | "project" | "client";
  setKanbanSwimlane: React.Dispatch<React.SetStateAction<"status" | "project" | "client">>;
  kanbanAnnouncement: string;
  setKanbanAnnouncement: React.Dispatch<React.SetStateAction<string>>;
  kanbanBlockDraft: { taskId: string; projectId: string; title: string } | null;
  setKanbanBlockDraft: React.Dispatch<React.SetStateAction<{ taskId: string; projectId: string; title: string } | null>>;
  kanbanBlockReason: string;
  setKanbanBlockReason: React.Dispatch<React.SetStateAction<string>>;
  kanbanBlockSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  setKanbanBlockSeverity: React.Dispatch<React.SetStateAction<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">>;
  kanbanBlockEta: string;
  setKanbanBlockEta: React.Dispatch<React.SetStateAction<string>>;
  creatingKanbanBlocker: boolean;
  filteredKanbanTasks: TaskContext[];
  kanbanColumns: KanbanColumn[];
  kanbanFlowMetrics: { points: Array<{ label: string; created: number; completed: number; blocked: number }>; throughput7d: number; throughputPrev7d: number; cycleDays: number };
  kanbanHealth: { wipBreach: boolean; agingTasks: number; blockedTasks: number; clientWaiting: number };
  inProgressLimit: number;
  blockedTasksCount: number;
  handleSubmitKanbanBlock: () => Promise<void>;
};

type Params = {
  session: AuthSession | null;
  taskContexts: TaskContext[];
  unreadProjectIds: Set<string>;
  inProgressCount: number;
  inProgressLimit: number;
  nowTs: number;
  topbarSearch: string;
  setProjectDetails: React.Dispatch<React.SetStateAction<import("../../../../lib/api/admin").ProjectDetail[]>>;
  setFeedback: (feedback: { tone: "success" | "error" | "warning" | "info"; message: string }) => void;
  refreshWorkspace: (session: AuthSession, opts?: { background?: boolean }) => Promise<void>;
  staffName: string;
};

export function useStaffKanban({
  session,
  taskContexts,
  unreadProjectIds,
  inProgressCount,
  inProgressLimit,
  nowTs,
  topbarSearch,
  setProjectDetails,
  setFeedback,
  refreshWorkspace,
  staffName
}: Params): UseStaffKanbanReturn {
  const AGING_THRESHOLD_DAYS = 5;
  const BACKLOG_WIP_LIMIT = 12;
  const BLOCKED_WIP_LIMIT = 6;

  const [kanbanViewMode, setKanbanViewMode] = useState<"all" | "my_work" | "urgent" | "client_waiting" | "blocked">("all");
  const [kanbanSwimlane, setKanbanSwimlane] = useState<"status" | "project" | "client">("status");
  const [kanbanAnnouncement, setKanbanAnnouncement] = useState("");
  const [kanbanBlockDraft, setKanbanBlockDraft] = useState<{ taskId: string; projectId: string; title: string } | null>(null);
  const [kanbanBlockReason, setKanbanBlockReason] = useState("");
  const [kanbanBlockSeverity, setKanbanBlockSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [kanbanBlockEta, setKanbanBlockEta] = useState("");
  const [creatingKanbanBlocker, setCreatingKanbanBlocker] = useState(false);
  const movingRef = useRef(false);

  const searchQuery = topbarSearch.trim().toLowerCase();

  const filteredKanbanTasks = useMemo(() => {
    const currentStaffName = (session?.user.email ?? "")
      .split("@")[0]
      ?.replace(/\./g, " ")
      .toLowerCase();
    const scoped =
      kanbanViewMode === "my_work"
        ? taskContexts.filter((task) => !currentStaffName || task.subtitle.toLowerCase().includes(currentStaffName))
        : kanbanViewMode === "urgent"
          ? taskContexts.filter((task) => task.priority === "high" || task.dueTone === "var(--red)")
          : kanbanViewMode === "client_waiting"
            ? taskContexts.filter((task) => unreadProjectIds.has(task.projectId))
            : kanbanViewMode === "blocked"
              ? taskContexts.filter((task) => task.status === "BLOCKED")
              : taskContexts;
    if (!searchQuery) return scoped;
    return scoped.filter((task) =>
      `${task.title} ${task.projectName} ${task.clientName} ${task.statusLabel}`.toLowerCase().includes(searchQuery)
    );
  }, [kanbanViewMode, searchQuery, session?.user.email, taskContexts, unreadProjectIds]);

  const kanbanFlowMetrics = useMemo(() => {
    const now = new Date();
    const dayMs = 1000 * 60 * 60 * 24;
    const start = new Date(now.getTime() - dayMs * 13);
    const points = Array.from({ length: 14 }, (_, index) => {
      const dayStart = new Date(start.getTime() + dayMs * index);
      const dayEnd = new Date(dayStart.getTime() + dayMs);
      const created = taskContexts.filter((task) => {
        const ts = new Date(task.createdAt).getTime();
        return ts >= dayStart.getTime() && ts < dayEnd.getTime();
      }).length;
      const completed = taskContexts.filter((task) => {
        if (task.status !== "DONE") return false;
        const ts = new Date(task.updatedAt).getTime();
        return ts >= dayStart.getTime() && ts < dayEnd.getTime();
      }).length;
      const blocked = taskContexts.filter((task) => {
        if (task.status !== "BLOCKED") return false;
        const ts = new Date(task.updatedAt).getTime();
        return ts >= dayStart.getTime() && ts < dayEnd.getTime();
      }).length;
      return { label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(dayStart), created, completed, blocked };
    });
    const recent = points.slice(7);
    const previous = points.slice(0, 7);
    const throughput7d = recent.reduce((sum, point) => sum + point.completed, 0);
    const throughputPrev7d = previous.reduce((sum, point) => sum + point.completed, 0);
    const completedDurations = taskContexts
      .filter((task) => task.status === "DONE")
      .map((task) => Math.max(0, new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime()));
    const cycleDays =
      completedDurations.length === 0
        ? 0
        : Math.round(
            (completedDurations.reduce((sum, duration) => sum + duration, 0) /
              completedDurations.length /
              dayMs) *
              10
          ) / 10;
    return { points: recent, throughput7d, throughputPrev7d, cycleDays };
  }, [taskContexts]);

  const kanbanColumns = useMemo<KanbanColumn[]>(() => {
    const nowTsCurrent = nowTs;
    const dayMs = 1000 * 60 * 60 * 24;
    const getAgeDays = (task: TaskContext) =>
      Math.max(0, Math.floor((nowTsCurrent - new Date(task.createdAt).getTime()) / dayMs));
    const getAgingCount = (items: typeof taskContexts) =>
      items.filter((task) => task.status !== "DONE" && getAgeDays(task) >= AGING_THRESHOLD_DAYS).length;

    const toKanbanTasks = (
      items: typeof taskContexts,
      variant: "progress" | "blocked" | "done" | "default",
      tagResolver?: (task: TaskContext) => string
    ): KanbanColumn["tasks"] =>
      items.map((task) => {
        const ageDays = getAgeDays(task);
        const ageTone: "muted" | "amber" | "red" =
          ageDays >= 7 ? "red" : ageDays >= 3 ? "amber" : "muted";
        const serviceClass: "expedite" | "standard" =
          task.priority === "high" || task.dueTone === "var(--red)"
            ? "expedite"
            : "standard";
        const needsAssignee = !task.assigneeInitials?.trim();
        const needsDue = !task.dueAt;
        const needsPrep = task.status === "TODO" && (needsAssignee || needsDue);
        const needsPrepReason = needsPrep
          ? [needsAssignee ? "Missing assignee" : null, needsDue ? "Missing due date" : null]
            .filter((value): value is string => Boolean(value))
            .join(" · ")
          : undefined;
        return {
          id: task.id,
          projectId: task.projectId,
          clientName: task.clientName,
          status: task.status,
          tag: tagResolver ? tagResolver(task) : `${task.projectName}`,
          title: task.title,
          priority: task.priority,
          due: task.status === "DONE" ? `${formatDateShort(task.dueAt)} ✓` : task.dueAt ? formatDateShort(task.dueAt) : "TBD",
          dueAt: task.dueAt,
          createdAt: task.createdAt,
          dueTone: task.dueAt && task.dueTone === "var(--red)" ? "today" : undefined,
          ageDays,
          ageTone,
          progress: variant === "progress" ? { value: task.progress ?? 0, tone: "blue" } : undefined,
          meta: { avatar: task.assigneeInitials },
          faded: variant === "done",
          blocked: variant === "blocked",
          serviceClass,
          needsPrep,
          needsPrepReason
        };
      });

    if (kanbanSwimlane === "project") {
      const groups = new Map<string, typeof filteredKanbanTasks>();
      filteredKanbanTasks.forEach((task) => {
        const key = task.projectName;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)?.push(task);
      });
      return Array.from(groups.entries())
        .map(([projectName, items]) => ({
          id: `project-${projectName}`,
          title: projectName,
          count: String(items.length),
          policyHint: "Keep at most 2 active cards per project stream",
          tasks: toKanbanTasks(items, "default", () => "Project lane")
        }))
        .slice(0, 6);
    }

    if (kanbanSwimlane === "client") {
      const groups = new Map<string, typeof filteredKanbanTasks>();
      filteredKanbanTasks.forEach((task) => {
        const key = task.clientName;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)?.push(task);
      });
      return Array.from(groups.entries())
        .map(([clientName, items]) => ({
          id: `client-${clientName}`,
          title: clientName,
          count: String(items.length),
          policyHint: "Resolve client blockers before adding new in-progress work",
          tasks: toKanbanTasks(items, "default", () => "Client lane")
        }))
        .slice(0, 6);
    }

    const backlog = filteredKanbanTasks.filter((task) => task.status === "TODO");
    const inProgress = filteredKanbanTasks.filter((task) => task.status === "IN_PROGRESS");
    const blocked = filteredKanbanTasks.filter((task) => task.status === "BLOCKED");
    const done = filteredKanbanTasks.filter((task) => task.status === "DONE");

    return [
      {
        id: "todo",
        title: "Backlog",
        count: String(backlog.length),
        wipLimit: BACKLOG_WIP_LIMIT,
        wipCount: backlog.length,
        agingCount: getAgingCount(backlog),
        policyHint: "Ready: clear title, assignee, and due date",
        tasks: toKanbanTasks(backlog, "default")
      },
      {
        id: "in_progress",
        title: "In Progress",
        count: String(inProgress.length),
        tone: "var(--accent)",
        countTone: "var(--accent)",
        countBg: "var(--accent-d)",
        border: "var(--accent)",
        wipLimit: inProgressLimit,
        wipCount: inProgress.length,
        agingCount: getAgingCount(inProgress),
        policyHint: "Limit WIP and keep client-visible updates frequent",
        tasks: toKanbanTasks(inProgress, "progress")
      },
      {
        id: "blocked",
        title: "In Review",
        count: String(blocked.length),
        tone: "var(--amber)",
        countTone: "var(--amber)",
        countBg: "var(--amber-d)",
        border: "var(--amber)",
        wipLimit: BLOCKED_WIP_LIMIT,
        wipCount: blocked.length,
        agingCount: getAgingCount(blocked),
        policyHint: "Blocked work must include owner, reason, and ETA",
        tasks: toKanbanTasks(blocked, "blocked")
      },
      {
        id: "done",
        title: "Done",
        count: String(done.length),
        tone: "var(--green)",
        countTone: "var(--green)",
        countBg: "var(--green-d)",
        border: "var(--green)",
        policyHint: "Done: QA complete and client/admin update posted",
        tasks: toKanbanTasks(done, "done")
      }
    ];
  }, [filteredKanbanTasks, kanbanSwimlane, nowTs]);

  const kanbanHealth = useMemo(
    () => ({
      wipBreach: inProgressCount >= inProgressLimit,
      agingTasks: filteredKanbanTasks.filter((task) => {
        if (task.status === "DONE") return false;
        const ageDays = Math.floor((nowTs - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return ageDays >= 3;
      }).length,
      blockedTasks: filteredKanbanTasks.filter((task) => task.status === "BLOCKED").length,
      clientWaiting: filteredKanbanTasks.filter((task) => unreadProjectIds.has(task.projectId)).length
    }),
    [filteredKanbanTasks, inProgressCount, inProgressLimit, nowTs, unreadProjectIds]
  );

  const blockedTasksCount = useMemo(
    () => taskContexts.filter((task) => task.status === "BLOCKED").length,
    [taskContexts]
  );

  const handleSubmitKanbanBlock = useCallback(async () => {
    if (!session || !kanbanBlockDraft || creatingKanbanBlocker) return;
    if (movingRef.current) return;
    if (kanbanBlockReason.trim().length < 4) {
      setFeedback({ tone: "error", message: "Provide a clear blocker reason." });
      return;
    }
    movingRef.current = true;
    try {
      setCreatingKanbanBlocker(true);
      const blockerResult = await createProjectBlockerWithRefresh(session, {
        projectId: kanbanBlockDraft.projectId,
        title: `Task blocked: ${kanbanBlockDraft.title}`,
        description: kanbanBlockReason.trim(),
        severity: kanbanBlockSeverity,
        status: "OPEN",
        ownerRole: "STAFF",
        ownerName: staffName,
        etaAt: kanbanBlockEta || undefined
      });
      if (!blockerResult.data) {
        setCreatingKanbanBlocker(false);
        setFeedback({ tone: "error", message: blockerResult.error?.message ?? "Unable to create blocker." });
        return;
      }
      const taskResult = await updateProjectTaskWithRefresh(session, kanbanBlockDraft.projectId, kanbanBlockDraft.taskId, { status: "BLOCKED" });
      setCreatingKanbanBlocker(false);
      setKanbanBlockDraft(null);
      setKanbanBlockReason("");
      setKanbanBlockSeverity("MEDIUM");
      setKanbanBlockEta("");
      setFeedback({ tone: "success", message: "Task marked blocked and escalated." });
      await refreshWorkspace(taskResult.nextSession ?? blockerResult.nextSession ?? session);
    } finally {
      movingRef.current = false;
    }
  }, [creatingKanbanBlocker, kanbanBlockDraft, kanbanBlockEta, kanbanBlockReason, kanbanBlockSeverity, refreshWorkspace, session?.accessToken, setFeedback, staffName]);

  return {
    kanbanViewMode,
    setKanbanViewMode,
    kanbanSwimlane,
    setKanbanSwimlane,
    kanbanAnnouncement,
    setKanbanAnnouncement,
    kanbanBlockDraft,
    setKanbanBlockDraft,
    kanbanBlockReason,
    setKanbanBlockReason,
    kanbanBlockSeverity,
    setKanbanBlockSeverity,
    kanbanBlockEta,
    setKanbanBlockEta,
    creatingKanbanBlocker,
    filteredKanbanTasks,
    kanbanColumns,
    kanbanFlowMetrics,
    kanbanHealth,
    inProgressLimit,
    blockedTasksCount,
    handleSubmitKanbanBlock
  };
}
