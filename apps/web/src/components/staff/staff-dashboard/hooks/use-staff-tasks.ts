"use client";

import { useCallback, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  updateProjectTaskWithRefresh,
  createProjectTaskWithRefresh,
  type ProjectDetail
} from "../../../../lib/api/admin";
import type { TaskContext } from "../types";
import {
  estimateMinutes,
  formatDateShort,
  formatStatus,
  getInitials
} from "../utils";

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

export type UseStaffTasksReturn = {
  activeTaskTab: "all" | "in_progress" | "todo" | "blocked" | "done";
  setActiveTaskTab: React.Dispatch<React.SetStateAction<"all" | "in_progress" | "todo" | "blocked" | "done">>;
  highPriorityOnly: boolean;
  setHighPriorityOnly: React.Dispatch<React.SetStateAction<boolean>>;
  showTaskComposer: boolean;
  setShowTaskComposer: React.Dispatch<React.SetStateAction<boolean>>;
  creatingTask: boolean;
  newTaskDraft: { projectId: string; title: string; assigneeName: string; dueAt: string };
  setNewTaskDraft: React.Dispatch<React.SetStateAction<{ projectId: string; title: string; assigneeName: string; dueAt: string }>>;
  taskContexts: TaskContext[];
  taskCounts: { all: number; in_progress: number; todo: number; blocked: number; done: number };
  taskTabs: Array<{ id: string; label: string }>;
  filteredTasks: TaskContext[];
  priorityTasks: TaskContext[];
  unreadProjectIds: Set<string>;
  inProgressCount: number;
  overdueTasksCount: number;
  highPriorityTasks: TaskContext[];
  highPriorityClients: string[];
  handleTaskAction: (taskId: string, projectId: string, status: TaskContext["status"]) => Promise<void>;
  handleMoveTask: (taskId: string, projectId: string, currentStatus: TaskContext["status"], nextStatus: TaskContext["status"]) => Promise<void>;
  handleCreateTask: (projects: Array<{ id: string; name: string }>) => Promise<void>;
};

type Params = {
  session: AuthSession | null;
  projectDetails: ProjectDetail[];
  setProjectDetails: React.Dispatch<React.SetStateAction<ProjectDetail[]>>;
  topbarSearch: string;
  clientById: Map<string, AdminClient>;
  nowTs: number;
  effectiveProjectDetails: ProjectDetail[];
  setFeedback: (feedback: { tone: "success" | "error" | "warning" | "info"; message: string }) => void;
  conversations: AdminConversation[];
  selectedConversationId: string | null;
  refreshWorkspace: (session: AuthSession, opts?: { background?: boolean }) => Promise<void>;
  inProgressLimit: number;
};

export function useStaffTasks({
  session,
  projectDetails,
  setProjectDetails,
  topbarSearch,
  clientById,
  nowTs,
  effectiveProjectDetails,
  setFeedback,
  conversations,
  selectedConversationId,
  refreshWorkspace,
  inProgressLimit
}: Params): UseStaffTasksReturn {
  const [activeTaskTab, setActiveTaskTab] = useState<"all" | "in_progress" | "todo" | "blocked" | "done">("all");
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [showTaskComposer, setShowTaskComposer] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [newTaskDraft, setNewTaskDraft] = useState({
    projectId: "",
    title: "",
    assigneeName: "",
    dueAt: ""
  });

  const searchQuery = topbarSearch.trim().toLowerCase();

  const taskContexts = useMemo<TaskContext[]>(() => {
    const now = nowTs;
    const soonThreshold = 1000 * 60 * 60 * 24 * 3;
    const mediumThreshold = 1000 * 60 * 60 * 24 * 7;

    return effectiveProjectDetails.flatMap((project) => {
      const clientName = clientById.get(project.clientId)?.name ?? "Client";
      return project.tasks.map((task) => {
        const dueTs = task.dueAt ? new Date(task.dueAt).getTime() : null;
        const isOverdue = Boolean(dueTs && dueTs < now && task.status !== "DONE");
        const dueSoon = Boolean(dueTs && dueTs < now + soonThreshold);
        const dueMedium = Boolean(dueTs && dueTs < now + mediumThreshold);
        const priority: TaskContext["priority"] = task.status === "BLOCKED" || isOverdue ? "high" : dueSoon ? "med" : dueMedium ? "med" : "low";
        const statusTone =
          task.status === "DONE"
            ? "green"
            : task.status === "IN_PROGRESS"
              ? "blue"
              : task.status === "BLOCKED"
                ? "red"
                : "muted";
        const badgeTone = statusTone === "muted" ? "blue" : statusTone;

        return {
          id: task.id,
          projectId: project.id,
          title: task.title,
          subtitle: task.assigneeName ? `${project.name} · ${task.assigneeName}` : `${project.name} · Unassigned`,
          projectName: project.name,
          clientName,
          status: task.status,
          statusLabel: formatStatus(task.status),
          statusTone,
          badgeTone,
          dueAt: task.dueAt ?? null,
          dueLabel: task.dueAt ? formatDateShort(task.dueAt) : "TBD",
          dueTone: isOverdue ? "var(--red)" : dueSoon ? "var(--amber)" : "var(--muted)",
          priority,
          estimateMinutes: estimateMinutes(task.createdAt, task.updatedAt),
          updatedAt: task.updatedAt,
          createdAt: task.createdAt,
          progress: project.progressPercent,
          assigneeInitials: getInitials(task.assigneeName ?? "Maphari Staff")
        };
      });
    });
  }, [clientById, effectiveProjectDetails, nowTs]);

  const taskCounts = useMemo(() => ({
    all: taskContexts.length,
    in_progress: taskContexts.filter((task) => task.status === "IN_PROGRESS").length,
    todo: taskContexts.filter((task) => task.status === "TODO").length,
    blocked: taskContexts.filter((task) => task.status === "BLOCKED").length,
    done: taskContexts.filter((task) => task.status === "DONE").length
  }), [taskContexts]);

  const taskTabs = useMemo(
    () => ([
      { id: "all", label: `All (${taskCounts.all})` },
      { id: "in_progress", label: `In Progress (${taskCounts.in_progress})` },
      { id: "todo", label: `To Do (${taskCounts.todo})` },
      { id: "blocked", label: `Blocked (${taskCounts.blocked})` },
      { id: "done", label: "Done" }
    ]) as Array<{ id: string; label: string }>,
    [taskCounts]
  );

  const filteredTasks = useMemo(() => {
    const scoped =
      activeTaskTab === "in_progress"
        ? taskContexts.filter((task) => task.status === "IN_PROGRESS")
        : activeTaskTab === "todo"
        ? taskContexts.filter((task) => task.status === "TODO")
        : activeTaskTab === "blocked"
        ? taskContexts.filter((task) => task.status === "BLOCKED")
        : activeTaskTab === "done"
        ? taskContexts.filter((task) => task.status === "DONE")
        : taskContexts;
    const priorityScoped = highPriorityOnly ? scoped.filter((task) => task.priority === "high") : scoped;
    if (!searchQuery) return priorityScoped;
    return priorityScoped.filter((task) => {
      const haystack = `${task.title} ${task.subtitle} ${task.projectName} ${task.clientName} ${task.statusLabel}`.toLowerCase();
      return haystack.includes(searchQuery);
    });
  }, [activeTaskTab, highPriorityOnly, searchQuery, taskContexts]);

  const priorityTasks = useMemo(() => {
    const order = { high: 3, med: 2, low: 1 } as const;
    const scoped = searchQuery
      ? taskContexts.filter((task) => {
          const haystack = `${task.title} ${task.subtitle} ${task.projectName} ${task.clientName}`.toLowerCase();
          return haystack.includes(searchQuery);
        })
      : taskContexts;
    return [...scoped]
      .sort((a, b) => {
        if (order[b.priority] !== order[a.priority]) return order[b.priority] - order[a.priority];
        if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        if (a.dueAt) return -1;
        if (b.dueAt) return 1;
        return 0;
      })
      .slice(0, 5);
  }, [searchQuery, taskContexts]);

  const unreadProjectIds = useMemo(() => {
    const ids = new Set<string>();
    conversations.forEach((conversation) => {
      if (!conversation.projectId || conversation.status !== "OPEN") return;
      if (conversation.id === selectedConversationId) return;
      ids.add(conversation.projectId);
    });
    return ids;
  }, [conversations, selectedConversationId]);

  const highPriorityTasks = useMemo(() => taskContexts.filter((task) => task.priority === "high"), [taskContexts]);

  const inProgressCount = useMemo(
    () => taskContexts.filter((task) => task.status === "IN_PROGRESS").length,
    [taskContexts]
  );

  const overdueTasksCount = useMemo(() => {
    const now = nowTs;
    return taskContexts.filter(
      (task) => task.status !== "DONE" && task.dueAt && new Date(task.dueAt).getTime() < now
    ).length;
  }, [nowTs, taskContexts]);

  const highPriorityClients = useMemo(() => {
    const clientsSet = new Set<string>();
    highPriorityTasks.forEach((task) => {
      clientsSet.add(task.clientName);
    });
    return Array.from(clientsSet);
  }, [highPriorityTasks]);

  // ─── Handlers ───

  const handleTaskAction = useCallback(async (taskId: string, projectId: string, status: TaskContext["status"]) => {
    if (!session) return;
    const nextStatus =
      status === "TODO"
        ? "IN_PROGRESS"
        : status === "IN_PROGRESS"
          ? "DONE"
        : status === "BLOCKED"
            ? "IN_PROGRESS"
            : "DONE";
    if (
      nextStatus === "IN_PROGRESS" &&
      status !== "IN_PROGRESS" &&
      inProgressCount >= inProgressLimit
    ) {
      setFeedback({
        tone: "error",
        message: `In Progress WIP limit reached (${inProgressCount}/${inProgressLimit}). Complete or unblock work first.`
      });
      return;
    }
    const result = await updateProjectTaskWithRefresh(session, projectId, taskId, { status: nextStatus });
    if (result.data) {
      setProjectDetails((prev) =>
        prev.map((project) =>
          project.id !== projectId
            ? project
            : {
                ...project,
                tasks: project.tasks.map((task) => (task.id === taskId ? result.data! : task))
              }
        )
      );
    }
    await refreshWorkspace(result.nextSession ?? session);
  }, [inProgressCount, inProgressLimit, refreshWorkspace, session, setFeedback, setProjectDetails]);

  const handleMoveTask = useCallback(async (
    taskId: string,
    projectId: string,
    currentStatus: TaskContext["status"],
    nextStatus: TaskContext["status"]
  ) => {
    if (!session || nextStatus === currentStatus) return;
    if (nextStatus === "IN_PROGRESS" && currentStatus !== "IN_PROGRESS" && inProgressCount >= inProgressLimit) {
      setFeedback({
        tone: "error",
        message: `In Progress WIP limit reached (${inProgressCount}/${inProgressLimit}).`
      });
      return;
    }
    const result = await updateProjectTaskWithRefresh(session, projectId, taskId, { status: nextStatus });
    if (result.data) {
      setProjectDetails((prev) =>
        prev.map((project) =>
          project.id !== projectId
            ? project
            : {
                ...project,
                tasks: project.tasks.map((task) => (task.id === taskId ? result.data! : task))
              }
        )
      );
    }
    await refreshWorkspace(result.nextSession ?? session);
  }, [inProgressCount, inProgressLimit, refreshWorkspace, session, setFeedback, setProjectDetails]);

  const handleCreateTask = useCallback(async (projects: Array<{ id: string; name: string }>) => {
    if (!session) return;
    const effectiveTaskDraftProjectId = newTaskDraft.projectId || projects[0]?.id || "";
    const projectId = effectiveTaskDraftProjectId;
    if (!projectId || newTaskDraft.title.trim().length < 3) {
      setFeedback({ tone: "error", message: "Select a project and enter a task title." });
      return;
    }
    setCreatingTask(true);
    const result = await createProjectTaskWithRefresh(session, projectId, {
      title: newTaskDraft.title.trim(),
      assigneeName: newTaskDraft.assigneeName.trim() || undefined,
      dueAt: newTaskDraft.dueAt || undefined
    });
    setCreatingTask(false);
    if (!result.data) {
      setFeedback({ tone: "error", message: result.error?.message ?? "Unable to create task." });
      return;
    }
    setProjectDetails((previous) =>
      previous.map((project) =>
        project.id === projectId
          ? { ...project, tasks: [result.data!, ...project.tasks] }
          : project
      )
    );
    setNewTaskDraft({
      projectId,
      title: "",
      assigneeName: "",
      dueAt: ""
    });
    setShowTaskComposer(false);
    setFeedback({ tone: "success", message: "Task created." });
    await refreshWorkspace(result.nextSession ?? session, { background: true });
  }, [newTaskDraft, refreshWorkspace, session, setFeedback, setProjectDetails]);

  return {
    activeTaskTab,
    setActiveTaskTab,
    highPriorityOnly,
    setHighPriorityOnly,
    showTaskComposer,
    setShowTaskComposer,
    creatingTask,
    newTaskDraft,
    setNewTaskDraft,
    taskContexts,
    taskCounts,
    taskTabs,
    filteredTasks,
    priorityTasks,
    unreadProjectIds,
    inProgressCount,
    overdueTasksCount,
    highPriorityTasks,
    highPriorityClients,
    handleTaskAction,
    handleMoveTask,
    handleCreateTask
  };
}
