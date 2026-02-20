"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DM_Mono, Instrument_Serif, Syne } from "next/font/google";
import {
  createConversationWithRefresh,
  createProjectHandoffExportWithRefresh,
  downloadProjectHandoffExportWithRefresh,
  createProjectBlockerWithRefresh,
  createProjectMilestoneWithRefresh,
  createProjectTaskWithRefresh,
  createProjectWorkSessionWithRefresh,
  getProjectPreferenceWithRefresh,
  loadProjectCollaborationWithRefresh,
  loadProjectChangeRequestsWithRefresh,
  loadProjectHandoffExportsWithRefresh,
  loadNotificationJobsWithRefresh,
  processNotificationQueueWithRefresh,
  loadProjectBlockersWithRefresh,
  loadProjectDetailWithRefresh,
  loadTimelineWithRefresh,
  setNotificationReadStateWithRefresh,
  setProjectPreferenceWithRefresh,
  updateMessageDeliveryWithRefresh,
  updateProjectChangeRequestWithRefresh,
  updateProjectMilestoneWithRefresh,
  updateProjectWorkSessionWithRefresh,
  updateProjectTaskWithRefresh,
  type ProjectChangeRequest,
  type ProjectDetail,
  type ProjectCollaborationSnapshot,
  type ProjectHandoffExportRecord
} from "../../lib/api/admin";
import { useStaffWorkspace } from "../../lib/auth/use-staff-workspace";
import { useRealtimeRefresh } from "../../lib/auth/use-realtime-refresh";
import { useCursorTrail } from "../shared/use-cursor-trail";
import { useDelayedFlag } from "../shared/use-delayed-flag";
import { pageTitles } from "./staff-dashboard/constants";
import { StaffSidebar } from "./staff-dashboard/StaffSidebar";
import { StaffTopbar } from "./staff-dashboard/StaffTopbar";
import { ClientsPage } from "./staff-dashboard/pages/ClientsPage";
import { DashboardPage } from "./staff-dashboard/pages/DashboardPage";
import { DeliverablesPage } from "./staff-dashboard/pages/DeliverablesPage";
import { KanbanPage } from "./staff-dashboard/pages/KanbanPage";
import { AutomationsPage } from "./staff-dashboard/pages/AutomationsPage";
import { SettingsPage } from "./staff-dashboard/pages/SettingsPage";
import { TasksPage } from "./staff-dashboard/pages/TasksPage";
import { TimeLogPage } from "./staff-dashboard/pages/TimeLogPage";
import { styles } from "./staff-dashboard/style";
import type {
  ActivityItem,
  ClientThread,
  DashboardDigestItem,
  DashboardFocusItem,
  DashboardInboxItem,
  DeliverableGroup,
  KanbanColumn,
  NavItem,
  PageId,
  SlaWatchItem,
  TaskContext,
  TimeEntrySummary
} from "./staff-dashboard/types";
import {
  estimateMinutes,
  formatDateLong,
  formatDateShort,
  formatRelative,
  formatStatus,
  formatTimer,
  getInitials,
  startOfWeek
} from "./staff-dashboard/utils";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne"
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono"
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument"
});

export function MaphariStaffDashboard() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");
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
  const [showDeliverableComposer, setShowDeliverableComposer] = useState(false);
  const [creatingDeliverable, setCreatingDeliverable] = useState(false);
  const [newDeliverableDraft, setNewDeliverableDraft] = useState({
    projectId: "",
    title: "",
    dueAt: ""
  });
  const [projectDetails, setProjectDetails] = useState<ProjectDetail[]>([]);
  const [projectCollaboration, setProjectCollaboration] = useState<Record<string, ProjectCollaborationSnapshot>>({});
  const [activeWorkSessionId, setActiveWorkSessionId] = useState<string | null>(null);
  const [composeMessage, setComposeMessage] = useState("");
  const [noteText, setNoteText] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationSeverity, setEscalationSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [sentMessageIds, setSentMessageIds] = useState<string[]>([]);
  const [selectedTimerProjectId, setSelectedTimerProjectId] = useState<string>("");
  const [timerTaskLabel, setTimerTaskLabel] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [threadSearch, setThreadSearch] = useState("");
  const [threadFilter, setThreadFilter] = useState<"all" | "open" | "unread" | "project" | "general">("all");
  const [topbarSearch, setTopbarSearch] = useState("");
  const [newThreadSubject, setNewThreadSubject] = useState("");
  const [newThreadClientId, setNewThreadClientId] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [settingsProfile, setSettingsProfile] = useState({
    fullName: "Staff",
    email: "",
    avatarUrl: "",
    weeklyTargetHours: 40
  });
  const [savedSettingsProfile, setSavedSettingsProfile] = useState({
    fullName: "Staff",
    email: "",
    avatarUrl: "",
    weeklyTargetHours: 40
  });
  const [settingsNotifications, setSettingsNotifications] = useState({
    taskAssignments: true,
    clientMessages: true,
    deliverableReminders: true,
    standupReminders: false,
    weeklyTimeSummary: true
  });
  const [savedSettingsNotifications, setSavedSettingsNotifications] = useState({
    taskAssignments: true,
    clientMessages: true,
    deliverableReminders: true,
    standupReminders: false,
    weeklyTimeSummary: true
  });
  const [settingsWorkspace, setSettingsWorkspace] = useState({
    timezone: "Africa/Johannesburg",
    workStart: "08:00",
    workEnd: "17:00",
    defaultStatus: "Available" as "Available" | "Focused" | "In a meeting"
  });
  const [savedSettingsWorkspace, setSavedSettingsWorkspace] = useState({
    timezone: "Africa/Johannesburg",
    workStart: "08:00",
    workEnd: "17:00",
    defaultStatus: "Available" as "Available" | "Focused" | "In a meeting"
  });
  const [dashboardLastSeenAt, setDashboardLastSeenAt] = useState<string | null | undefined>(undefined);
  const [kanbanBlockDraft, setKanbanBlockDraft] = useState<{ taskId: string; projectId: string; title: string } | null>(null);
  const [kanbanBlockReason, setKanbanBlockReason] = useState("");
  const [kanbanBlockSeverity, setKanbanBlockSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [kanbanBlockEta, setKanbanBlockEta] = useState("");
  const [creatingKanbanBlocker, setCreatingKanbanBlocker] = useState(false);
  const [processingAutomationQueue, setProcessingAutomationQueue] = useState(false);
  const [acknowledgingAutomationFailures, setAcknowledgingAutomationFailures] = useState(false);
  const [kanbanViewMode, setKanbanViewMode] = useState<"all" | "my_work" | "urgent" | "client_waiting" | "blocked">("all");
  const [kanbanSwimlane, setKanbanSwimlane] = useState<"status" | "project" | "client">("status");
  const [kanbanAnnouncement, setKanbanAnnouncement] = useState("");
  const [notificationJobs, setNotificationJobs] = useState<Array<{
    id: string;
    status: string;
    tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
    readAt: string | null;
  }>>([]);
  const [projectBlockers, setProjectBlockers] = useState<Array<{
    id: string;
    projectId: string;
    clientId: string;
    title: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
    etaAt: string | null;
    ownerName: string | null;
    updatedAt: string;
  }>>([]);
  const [timelineEvents, setTimelineEvents] = useState<Array<{
    id: string;
    category: "PROJECT" | "LEAD" | "BLOCKER";
    title: string;
    detail: string | null;
    createdAt: string;
  }>>([]);
  const [changeRequests, setChangeRequests] = useState<ProjectChangeRequest[]>([]);
  const [estimateDrafts, setEstimateDrafts] = useState<Record<string, { hours: string; costCents: string; assessment: string }>>({});
  const [handoffExports, setHandoffExports] = useState<ProjectHandoffExportRecord[]>([]);
  const [generatingHandoffExport, setGeneratingHandoffExport] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [staffTourOpen, setStaffTourOpen] = useState(false);
  const [staffTourStep, setStaffTourStep] = useState(0);
  const timerRef = useRef<number | null>(null);
  const timerStartRef = useRef<string | null>(null);
  const dashboardSeenMarkedRef = useRef(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const {
    session,
    snapshot,
    conversations,
    files,
    timeEntries,
    selectedConversationId,
    conversationMessages,
    conversationNotes,
    conversationEscalations,
    loading,
    messagesLoading,
    refreshWorkspace,
    signOut,
    selectConversation,
    sendMessage,
    addTimeEntry,
    addConversationNote,
    escalateConversation,
    updateConversationAssignee
  } = useStaffWorkspace();

  useCursorTrail(cursorRef, ringRef, { cursorOffset: 4, ringOffset: 15, easing: 0.1 });
  const animateProgress = useDelayedFlag(activePage, 200);

  useEffect(() => {
    if (!timerRunning) return;
    timerRef.current = window.setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [timerRunning]);

  useEffect(() => {
    if (!actionFeedback) return;
    const timeoutId = window.setTimeout(() => setActionFeedback(null), 4200);
    return () => window.clearTimeout(timeoutId);
  }, [actionFeedback]);

  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `maphari:tour:staff:${session.user.email}`;
    if (!window.localStorage.getItem(key)) {
      queueMicrotask(() => setStaffTourOpen(true));
    }
  }, [session?.user?.email]);

  useEffect(() => {
    dashboardSeenMarkedRef.current = false;
  }, [session?.user.id]);

  const projects = useMemo(() => snapshot.projects ?? [], [snapshot.projects]);
  const clients = useMemo(() => snapshot.clients ?? [], [snapshot.clients]);

  const effectiveNewThreadClientId = newThreadClientId || clients[0]?.id || "";

  useEffect(() => {
    if (!session || projects.length === 0) return;
    let cancelled = false;
    void (async () => {
      const results = await Promise.all(
        projects.map((project) => loadProjectDetailWithRefresh(session, project.id))
      );
      if (cancelled) return;
      const details = results
        .map((result) => result.data)
        .filter((detail): detail is ProjectDetail => Boolean(detail));
      setProjectDetails(details);
    })();
    return () => {
      cancelled = true;
    };
  }, [projects, session]);

  useEffect(() => {
    if (!session || projects.length === 0) return;
    let cancelled = false;
    void (async () => {
      const results = await Promise.all(
        projects.map((project) => loadProjectCollaborationWithRefresh(session, project.id))
      );
      if (cancelled) return;
      const next: Record<string, ProjectCollaborationSnapshot> = {};
      results.forEach((result) => {
        if (result.data) next[result.data.projectId] = result.data;
      });
      setProjectCollaboration(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [projects, session]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const result = await loadNotificationJobsWithRefresh(session);
      if (cancelled || !result.nextSession) return;
      setNotificationJobs((result.data ?? []).map((job) => ({ id: job.id, status: job.status, tab: job.tab, readAt: job.readAt })));
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const handleRealtimeRefresh = useCallback(() => {
    if (!session) return;
    void (async () => {
      const [jobsResult, blockersResult, timelineResult, changeRequestsResult, exportsResult] = await Promise.all([
        loadNotificationJobsWithRefresh(session),
        loadProjectBlockersWithRefresh(session, { limit: 80 }),
        loadTimelineWithRefresh(session, { limit: 80 }),
        loadProjectChangeRequestsWithRefresh(session, { limit: 80 }),
        loadProjectHandoffExportsWithRefresh(session)
      ]);
      if (jobsResult.data) {
        setNotificationJobs(jobsResult.data.map((job) => ({
          id: job.id,
          status: job.status,
          tab: job.tab,
          readAt: job.readAt
        })));
      }
      if (blockersResult.data) setProjectBlockers(blockersResult.data);
      if (timelineResult.data) setTimelineEvents(timelineResult.data);
      if (changeRequestsResult.data) setChangeRequests(changeRequestsResult.data);
      if (exportsResult.data) setHandoffExports(exportsResult.data);
      if (projects.length > 0) {
        const collaborationResults = await Promise.all(
          projects.map((project) => loadProjectCollaborationWithRefresh(session, project.id))
        );
        const next: Record<string, ProjectCollaborationSnapshot> = {};
        collaborationResults.forEach((result) => {
          if (result.data) next[result.data.projectId] = result.data;
        });
        setProjectCollaboration(next);
      }
    })();
  }, [projects, session]);

  useRealtimeRefresh(session, handleRealtimeRefresh);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const [blockersResult, timelineResult, changeRequestsResult, exportsResult] = await Promise.all([
        loadProjectBlockersWithRefresh(session, { limit: 80 }),
        loadTimelineWithRefresh(session, { limit: 80 }),
        loadProjectChangeRequestsWithRefresh(session, { limit: 80 }),
        loadProjectHandoffExportsWithRefresh(session)
      ]);
      if (cancelled) return;
      setProjectBlockers(blockersResult.data ?? []);
      setTimelineEvents(timelineResult.data ?? []);
      setChangeRequests(changeRequestsResult.data ?? []);
      setHandoffExports(exportsResult.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const pageToTab: Record<PageId, "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations"> = {
      dashboard: "dashboard",
      tasks: "operations",
      kanban: "operations",
      clients: "messages",
      deliverables: "projects",
      timelog: "operations",
      automations: "operations",
      settings: "settings"
    };
    const activeTab = pageToTab[activePage];
    const unread = notificationJobs.filter((job) => !job.readAt && job.tab === activeTab);
    if (unread.length === 0) return;
    void Promise.all(unread.map((job) => setNotificationReadStateWithRefresh(session, job.id, true))).then(() => {
      setNotificationJobs((previous) =>
        previous.map((job) =>
          unread.some((target) => target.id === job.id)
            ? { ...job, readAt: new Date().toISOString() }
            : job
        )
      );
    });
  }, [activePage, notificationJobs, session]);

  const effectiveProjectDetails = useMemo(
    () => (projects.length === 0 ? [] : projectDetails),
    [projectDetails, projects.length]
  );

  const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const fileById = useMemo(() => new Map(files.map((file) => [file.id, file])), [files]);
  const nowTs = useMemo(() => new Date().getTime(), []);
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
    const toKanbanTasks = (
      items: typeof taskContexts,
      variant: "progress" | "blocked" | "done" | "default",
      tagResolver?: (task: TaskContext) => string
    ): KanbanColumn["tasks"] =>
      items.map((task) => {
        const ageDays = Math.max(0, Math.floor((nowTsCurrent - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
        const ageTone: "muted" | "amber" | "red" =
          ageDays >= 7 ? "red" : ageDays >= 3 ? "amber" : "muted";
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
          blocked: variant === "blocked"
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

  const messagePreview = useMemo(() => {
    if (!selectedConversationId) return "";
    const last = conversationMessages[conversationMessages.length - 1];
    return last?.content ?? "";
  }, [conversationMessages, selectedConversationId]);

  const allThreadItems = useMemo<ClientThread[]>(() => {
    const palette = [
      { bg: "rgba(200,241,53,0.15)", color: "#c8f135" },
      { bg: "rgba(245,166,35,0.15)", color: "var(--amber)" },
      { bg: "rgba(167,139,250,0.15)", color: "var(--purple)" },
      { bg: "rgba(52,217,139,0.12)", color: "var(--green)" }
    ];
    return conversations.map((conversation, index) => {
      const clientName = clientById.get(conversation.clientId)?.name ?? "Client";
      const projectName = conversation.projectId ? projectById.get(conversation.projectId)?.name : null;
      const paletteItem = palette[index % palette.length];
      const preview =
        conversation.id === selectedConversationId
          ? messagePreview || "No messages yet."
          : "No messages yet.";
      return {
        id: conversation.id,
        name: clientName,
        time: formatRelative(conversation.updatedAt),
        project: projectName ? `${projectName}` : "General",
        preview,
        avatar: { label: getInitials(clientName), bg: paletteItem.bg, color: paletteItem.color },
        unread: conversation.status === "OPEN" && conversation.id !== selectedConversationId
      };
    });
  }, [clientById, conversations, messagePreview, projectById, selectedConversationId]);

  const threadItems = useMemo<ClientThread[]>(() => {
    const q = [searchQuery, threadSearch.trim().toLowerCase()].filter(Boolean).join(" ");
    if (!q) return allThreadItems;
    return allThreadItems.filter((thread) => {
      return (
        thread.name.toLowerCase().includes(q) ||
        thread.project.toLowerCase().includes(q) ||
        thread.preview.toLowerCase().includes(q)
      );
    });
  }, [allThreadItems, searchQuery, threadSearch]);

  const threadCounts = useMemo(
    () => ({
      all: allThreadItems.length,
      open: allThreadItems.filter((thread) => thread.unread).length,
      unread: allThreadItems.filter((thread) => thread.unread).length,
      project: allThreadItems.filter((thread) => thread.project !== "General").length,
      general: allThreadItems.filter((thread) => thread.project === "General").length
    }),
    [allThreadItems]
  );

  const visibleThreadItems = useMemo(() => {
    const scoped =
      threadFilter === "open" || threadFilter === "unread"
        ? threadItems.filter((thread) => thread.unread)
        : threadFilter === "project"
          ? threadItems.filter((thread) => thread.project !== "General")
          : threadFilter === "general"
            ? threadItems.filter((thread) => thread.project === "General")
            : threadItems;
    return scoped;
  }, [threadFilter, threadItems]);

  const conversationByProjectId = useMemo(() => {
    const map = new Map<string, string>();
    conversations.forEach((conversation) => {
      if (!conversation.projectId) return;
      if (!map.has(conversation.projectId)) {
        map.set(conversation.projectId, conversation.id);
      }
    });
    return map;
  }, [conversations]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const selectedThread = useMemo(
    () => allThreadItems.find((thread) => thread.id === selectedConversationId) ?? null,
    [allThreadItems, selectedConversationId]
  );

  const deliverableGroups = useMemo<DeliverableGroup[]>(() => {
    const groups = effectiveProjectDetails.map((project) => {
      const clientName = clientById.get(project.clientId)?.name ?? "Client";
      const tone: DeliverableGroup["badge"]["tone"] =
        project.riskLevel === "HIGH"
          ? "amber"
          : project.riskLevel === "MEDIUM"
            ? "purple"
            : "green";
      const items = project.milestones.map((milestone) => {
        const status: DeliverableGroup["items"][number]["status"] =
          milestone.status === "COMPLETED" ? "done" : milestone.status === "IN_PROGRESS" ? "doing" : "";
        const dueLabel = milestone.dueAt ? formatDateShort(milestone.dueAt) : "TBD";
        const meta =
          milestone.status === "COMPLETED"
            ? `Delivered · ${dueLabel}`
            : milestone.dueAt
              ? `Due ${dueLabel} · ${formatStatus(milestone.status)}`
              : "Not scheduled";
        const metaTone = milestone.status === "IN_PROGRESS" ? "var(--accent)" : milestone.status === "COMPLETED" ? "var(--muted)" : undefined;
        const fileName = milestone.fileId ? fileById.get(milestone.fileId)?.fileName ?? null : null;
        return {
          status,
          milestoneStatus:
            milestone.status === "COMPLETED"
              ? "COMPLETED"
              : milestone.status === "IN_PROGRESS"
                ? "IN_PROGRESS"
                : "PENDING",
          dueAt: milestone.dueAt ?? null,
          title: milestone.title,
          meta,
          titleTone: milestone.status === "COMPLETED" ? "var(--muted)" : undefined,
          metaTone,
          fileId: milestone.fileId,
          fileName,
          projectId: project.id,
          milestoneId: milestone.id
        };
      });
      return { title: project.name, clientId: project.clientId, badge: { label: clientName, tone }, items };
    });
    if (!searchQuery) return groups;
    return groups
      .map((group) => {
        const filteredItems = group.items.filter((item) => {
          const haystack = `${item.title} ${item.meta} ${item.fileName ?? ""}`.toLowerCase();
          return haystack.includes(searchQuery);
        });
        if (group.title.toLowerCase().includes(searchQuery)) {
          return group;
        }
        return { ...group, items: filteredItems };
      })
      .filter((group) => group.items.length > 0 || group.title.toLowerCase().includes(searchQuery));
  }, [clientById, effectiveProjectDetails, fileById, searchQuery]);

  const milestoneStats = useMemo(() => {
    const now = nowTs;
    const weekAhead = now + 1000 * 60 * 60 * 24 * 7;
    let overdue = 0;
    let dueThisWeek = 0;
    let deliveredThisMonth = 0;
    const currentMonth = new Date().getMonth();
    effectiveProjectDetails.forEach((project) => {
      project.milestones.forEach((milestone) => {
        const dueTs = milestone.dueAt ? new Date(milestone.dueAt).getTime() : null;
        if (milestone.status === "COMPLETED") {
          const completedAt = milestone.updatedAt ? new Date(milestone.updatedAt).getMonth() : null;
          if (completedAt === currentMonth) deliveredThisMonth += 1;
          return;
        }
        if (dueTs && dueTs < now) overdue += 1;
        if (dueTs && dueTs >= now && dueTs <= weekAhead) dueThisWeek += 1;
      });
    });
    return { overdue, dueThisWeek, deliveredThisMonth };
  }, [effectiveProjectDetails, nowTs]);

  const timeEntrySource = useMemo<TimeEntrySummary[]>(() => {
    return timeEntries.map((entry) => {
      const projectName = projectById.get(entry.projectId)?.name ?? "Project";
      return {
        id: entry.id,
        project: projectName,
        task: entry.taskLabel,
        minutes: entry.minutes,
        loggedAt: entry.endedAt ?? entry.createdAt,
        color: "var(--accent)"
      };
    });
  }, [projectById, timeEntries]);

  const recentTimeEntries = useMemo(() => {
    return [...timeEntrySource]
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .slice(0, 6);
  }, [timeEntrySource]);

  const weekData = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    const days = Array.from({ length: 5 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return { date, label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date) };
    });
    const dailyMinutes = new Array(5).fill(0);
    timeEntrySource.forEach((entry) => {
      const date = new Date(entry.loggedAt);
      const dayIndex = Math.floor((date.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 5) {
        dailyMinutes[dayIndex] += entry.minutes;
      }
    });
    return { days, dailyMinutes };
  }, [timeEntrySource]);

  const todayMinutes = useMemo(() => {
    const today = new Date();
    return timeEntrySource.reduce((sum, entry) => {
      const date = new Date(entry.loggedAt);
      if (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      ) {
        return sum + entry.minutes;
      }
      return sum;
    }, 0);
  }, [timeEntrySource]);

  const weekMinutes = useMemo(() => weekData.dailyMinutes.reduce((sum, value) => sum + value, 0), [weekData]);
  const weekMax = Math.max(...weekData.dailyMinutes, 0);
  const weeklyTargetHours = projects.length > 0 ? 40 : 0;
  const timezoneOptions = useMemo(() => {
    const defaults = [
      "Africa/Johannesburg",
      "UTC",
      "Europe/London",
      "America/New_York",
      "America/Los_Angeles"
    ];
    const available = typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : defaults;
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const merged = new Set<string>([localTz, ...defaults, ...available]);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, []);
  const hasProfileChanges = useMemo(
    () => JSON.stringify(settingsProfile) !== JSON.stringify(savedSettingsProfile),
    [savedSettingsProfile, settingsProfile]
  );
  const hasNotificationsChanges = useMemo(
    () => JSON.stringify(settingsNotifications) !== JSON.stringify(savedSettingsNotifications),
    [savedSettingsNotifications, settingsNotifications]
  );
  const hasWorkspaceChanges = useMemo(
    () => JSON.stringify(settingsWorkspace) !== JSON.stringify(savedSettingsWorkspace),
    [savedSettingsWorkspace, settingsWorkspace]
  );

  const projectTimeBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    timeEntrySource.forEach((entry) => {
      totals.set(entry.project, (totals.get(entry.project) ?? 0) + entry.minutes);
    });
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [timeEntrySource]);

  const maxProjectMinutes = useMemo(
    () => Math.max(...projectTimeBreakdown.map((entry) => entry[1]), 0),
    [projectTimeBreakdown]
  );

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
          text: activity.details ?? formatStatus(activity.type),
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
        text: event.title,
        detail: event.detail ?? "Shared timeline event",
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

  const openConversations = useMemo(() => conversations.filter((thread) => thread.status === "OPEN"), [conversations]);
  const openTasks = useMemo(() => taskContexts.filter((task) => task.status !== "DONE"), [taskContexts]);
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
          title: event.title,
          detail: event.detail ?? formatStatus(event.category),
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
  const highPriorityTasks = useMemo(() => taskContexts.filter((task) => task.priority === "high"), [taskContexts]);
  const blockedTasksCount = useMemo(
    () => taskContexts.filter((task) => task.status === "BLOCKED").length,
    [taskContexts]
  );
  const inProgressCount = useMemo(
    () => taskContexts.filter((task) => task.status === "IN_PROGRESS").length,
    [taskContexts]
  );
  const inProgressLimit = useMemo(
    () => Math.max(3, Math.ceil(Math.max(taskContexts.length, 1) / 3)),
    [taskContexts.length]
  );
  const overdueTasksCount = useMemo(() => {
    const now = nowTs;
    return taskContexts.filter(
      (task) => task.status !== "DONE" && task.dueAt && new Date(task.dueAt).getTime() < now
    ).length;
  }, [nowTs, taskContexts]);
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
  const highPriorityClients = useMemo(() => {
    const clientsSet = new Set<string>();
    highPriorityTasks.forEach((task) => {
      clientsSet.add(task.clientName);
    });
    return Array.from(clientsSet);
  }, [highPriorityTasks]);

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

  const nextDueLabel = nextDueDate ? formatDateLong(nextDueDate.toISOString()) : "No upcoming due dates";
  const daysLeft = nextDueDate ? Math.max(0, Math.ceil((nextDueDate.getTime() - nowTs) / 86400000)) : null;

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

  const unreadByTab = useMemo(() => {
    const counts = {
      dashboard: 0,
      projects: 0,
      invoices: 0,
      messages: 0,
      settings: 0,
      operations: 0
    };
    notificationJobs.forEach((job) => {
      if (job.readAt) return;
      counts[job.tab] += 1;
    });
    return counts;
  }, [notificationJobs]);
  const totalUnreadNotifications = useMemo(
    () =>
      unreadByTab.dashboard +
      unreadByTab.projects +
      unreadByTab.invoices +
      unreadByTab.messages +
      unreadByTab.settings +
      unreadByTab.operations,
    [unreadByTab]
  );

  const navSections = useMemo(() => {
    const taskCount = openTasks.length;
    const threadCount = openConversations.length;
    const overdueDeliverables = milestoneStats.overdue;
    const openBlockersCount = projectBlockers.filter((blocker) => blocker.status !== "RESOLVED").length;
    const items: NavItem[] = [
      {
        id: "dashboard",
        label: "My Dashboard",
        section: "Workspace",
        badge: unreadByTab.dashboard > 0 ? { value: String(unreadByTab.dashboard), tone: "blue" } : undefined
      },
      {
        id: "tasks",
        label: "My Tasks",
        section: "Workspace",
        badge: Math.max(taskCount, unreadByTab.operations) > 0 ? { value: String(Math.max(taskCount, unreadByTab.operations)), tone: "blue" } : undefined
      },
      {
        id: "kanban",
        label: "Kanban Board",
        section: "Workspace",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "clients",
        label: "Client Threads",
        section: "Client Work",
        badge: Math.max(threadCount, unreadByTab.messages) > 0 ? { value: String(Math.max(threadCount, unreadByTab.messages)), tone: "amber" } : undefined
      },
      {
        id: "deliverables",
        label: "Deliverables",
        section: "Client Work",
        badge:
          Math.max(overdueDeliverables, unreadByTab.projects, openBlockersCount) > 0
            ? { value: String(Math.max(overdueDeliverables, unreadByTab.projects, openBlockersCount)), tone: "red" }
            : undefined
      },
      {
        id: "timelog",
        label: "Time Log",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "automations",
        label: "Automations",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "amber" } : undefined
      },
      {
        id: "settings",
        label: "Settings",
        section: "Account",
        badge: unreadByTab.settings > 0 ? { value: String(unreadByTab.settings), tone: "amber" } : undefined
      }
    ];
    const sections = new Map<string, NavItem[]>();
    items.forEach((item) => {
      if (!sections.has(item.section)) sections.set(item.section, []);
      sections.get(item.section)?.push(item);
    });
    return Array.from(sections.entries());
  }, [milestoneStats.overdue, openConversations.length, openTasks.length, projectBlockers, unreadByTab]);

  const staffEmail = session?.user.email ?? "staff@maphari.co.za";
  const staffName = staffEmail.split("@")[0]?.replace(/\./g, " ") ?? "Staff";
  const staffInitials = getInitials(staffName);
  const staffRole = session?.user.role ?? "STAFF";
  const today = new Date();
  const todayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(today);
  const weekNumber = Math.ceil(
    ((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(today.getFullYear(), 0, 1).getDay() + 1) / 7
  );
  const effectiveSelectedTimerProjectId =
    selectedTimerProjectId && projects.some((project) => project.id === selectedTimerProjectId)
      ? selectedTimerProjectId
      : projects[0]?.id ?? "";
  const timerProjectName =
    (effectiveSelectedTimerProjectId && projectById.get(effectiveSelectedTimerProjectId)?.name) ||
    "Select a project";
  const timerTaskName = timerTaskLabel || "No active session";

  const [topbarEyebrow, topbarTitle] = pageTitles[activePage];
  const topbarSearchPlaceholder: Record<PageId, string> = {
    dashboard: "Search tasks, messages, alerts…",
    tasks: "Search tasks, clients…",
    kanban: "Search kanban cards…",
    clients: "Search conversations, projects…",
    deliverables: "Search milestones, attachments…",
    timelog: "Search time entries, projects…",
    automations: "Search workflows, retries, escalations…",
    settings: "Search settings…"
  };
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
  const timerDisplay = formatTimer(timerSeconds);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const [profilePref, workspacePref, notificationsPref, dashboardSeenPref, kanbanPrefs] = await Promise.all([
        getProjectPreferenceWithRefresh(session, "settingsProfile"),
        getProjectPreferenceWithRefresh(session, "settingsWorkspace"),
        getProjectPreferenceWithRefresh(session, "settingsNotifications"),
        getProjectPreferenceWithRefresh(session, "dashboardLastSeenAt"),
        getProjectPreferenceWithRefresh(session, "kanbanBoardPrefs")
      ]);
      if (cancelled) return;

      const parse = (value?: string | null): Record<string, unknown> | null => {
        if (!value) return null;
        try {
          const parsed = JSON.parse(value);
          return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
        } catch {
          return null;
        }
      };

      const profile = parse(profilePref.data?.value);
      if (profile) {
        const nextProfile = {
          fullName: typeof profile.fullName === "string" ? profile.fullName : staffName,
          email: typeof profile.email === "string" ? profile.email : staffEmail,
          avatarUrl: typeof profile.avatarUrl === "string" ? profile.avatarUrl : "",
          weeklyTargetHours:
            typeof profile.weeklyTargetHours === "number"
              ? profile.weeklyTargetHours
              : 40
        };
        setSettingsProfile(nextProfile);
        setSavedSettingsProfile(nextProfile);
      } else {
        const nextProfile = {
          fullName: staffName,
          email: staffEmail,
          avatarUrl: "",
          weeklyTargetHours: 40
        };
        setSettingsProfile((previous) => ({
          fullName: previous.fullName === "Staff" ? staffName : previous.fullName,
          email: previous.email || staffEmail,
          avatarUrl: previous.avatarUrl || "",
          weeklyTargetHours: previous.weeklyTargetHours
        }));
        setSavedSettingsProfile(nextProfile);
      }

      const workspace = parse(workspacePref.data?.value);
      if (workspace) {
        const nextWorkspace = {
          timezone: typeof workspace.timezone === "string" ? workspace.timezone : "Africa/Johannesburg",
          workStart: typeof workspace.workStart === "string" ? workspace.workStart : "08:00",
          workEnd: typeof workspace.workEnd === "string" ? workspace.workEnd : "17:00",
          defaultStatus:
            workspace.defaultStatus === "Focused" || workspace.defaultStatus === "In a meeting"
              ? workspace.defaultStatus
              : "Available"
        };
        setSettingsWorkspace(nextWorkspace);
        setSavedSettingsWorkspace(nextWorkspace);
      } else {
        setSavedSettingsWorkspace({
          timezone: "Africa/Johannesburg",
          workStart: "08:00",
          workEnd: "17:00",
          defaultStatus: "Available"
        });
      }

      const notifications = parse(notificationsPref.data?.value);
      if (notifications) {
        const nextNotifications = {
          taskAssignments: Boolean(notifications.taskAssignments),
          clientMessages: Boolean(notifications.clientMessages),
          deliverableReminders: Boolean(notifications.deliverableReminders),
          standupReminders: Boolean(notifications.standupReminders),
          weeklyTimeSummary: Boolean(notifications.weeklyTimeSummary)
        };
        setSettingsNotifications(nextNotifications);
        setSavedSettingsNotifications(nextNotifications);
      } else {
        setSavedSettingsNotifications({
          taskAssignments: true,
          clientMessages: true,
          deliverableReminders: true,
          standupReminders: false,
          weeklyTimeSummary: true
        });
      }

      const dashboardSeen = parse(dashboardSeenPref.data?.value);
      setDashboardLastSeenAt(
        dashboardSeen && typeof dashboardSeen.seenAt === "string" ? dashboardSeen.seenAt : null
      );

      const kanban = parse(kanbanPrefs.data?.value);
      if (kanban) {
        if (
          kanban.viewMode === "all" ||
          kanban.viewMode === "my_work" ||
          kanban.viewMode === "urgent" ||
          kanban.viewMode === "client_waiting" ||
          kanban.viewMode === "blocked"
        ) {
          setKanbanViewMode(kanban.viewMode);
        }
        if (kanban.swimlane === "status" || kanban.swimlane === "project" || kanban.swimlane === "client") {
          setKanbanSwimlane(kanban.swimlane);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, staffEmail, staffName]);

  useEffect(() => {
    if (!session) return;
    void setProjectPreferenceWithRefresh(session, {
      key: "kanbanBoardPrefs",
      value: JSON.stringify({ viewMode: kanbanViewMode, swimlane: kanbanSwimlane })
    });
  }, [kanbanSwimlane, kanbanViewMode, session]);

  useEffect(() => {
    if (!session || !selectedConversationId || conversationMessages.length === 0) return;
    const inbound = conversationMessages
      .filter((message) => (message.authorRole ?? "").toUpperCase() === "CLIENT")
      .filter((message) => message.deliveryStatus !== "READ")
      .slice(-8);
    if (inbound.length === 0) return;
    void Promise.all(
      inbound.map((message) =>
        updateMessageDeliveryWithRefresh(session, message.id, {
          status: "READ",
          deliveredAt: message.deliveredAt ?? new Date().toISOString(),
          readAt: new Date().toISOString()
        })
      )
    );
  }, [conversationMessages, selectedConversationId, session]);

  useEffect(() => {
    if (!session || loading || activePage !== "dashboard" || dashboardLastSeenAt === undefined) return;
    if (dashboardSeenMarkedRef.current) return;
    dashboardSeenMarkedRef.current = true;
    const seenAt = new Date().toISOString();
    void setProjectPreferenceWithRefresh(session, {
      key: "dashboardLastSeenAt",
      value: JSON.stringify({ seenAt })
    });
  }, [activePage, dashboardLastSeenAt, loading, session]);

  const handleTimerToggle = () => {
    if (!effectiveSelectedTimerProjectId) {
      setActionFeedback({ tone: "error", message: "Select a project before starting the timer." });
      return;
    }
    if (timerRunning) {
      setTimerRunning(false);
      if (session && effectiveSelectedTimerProjectId && activeWorkSessionId) {
        void updateProjectWorkSessionWithRefresh(session, effectiveSelectedTimerProjectId, activeWorkSessionId, {
          status: "PAUSED"
        });
      }
      return;
    }
    timerStartRef.current = new Date().toISOString();
    setTimerRunning(true);
    if (session && effectiveSelectedTimerProjectId) {
      void (async () => {
        const created = await createProjectWorkSessionWithRefresh(session, effectiveSelectedTimerProjectId, {
          taskId: null,
          memberName: staffName,
          memberRole: "STAFF",
          workstream: timerTaskLabel || "Execution",
          status: "ACTIVE"
        });
        if (created.data) {
          setActiveWorkSessionId(created.data.id);
        }
      })();
    }
  };

  const handleTimerStop = async () => {
    setTimerRunning(false);
    if (session && effectiveSelectedTimerProjectId && activeWorkSessionId) {
      await updateProjectWorkSessionWithRefresh(session, effectiveSelectedTimerProjectId, activeWorkSessionId, {
        status: "DONE",
        endedAt: new Date().toISOString()
      });
      setActiveWorkSessionId(null);
    }
    if (effectiveSelectedTimerProjectId && timerSeconds > 0) {
      const minutes = Math.max(1, Math.round(timerSeconds / 60));
      await addTimeEntry({
        projectId: effectiveSelectedTimerProjectId,
        taskLabel: timerTaskLabel || "General work",
        minutes,
        startedAt: timerStartRef.current ?? undefined,
        endedAt: new Date().toISOString(),
        staffName
      });
    }
    timerStartRef.current = null;
    setTimerSeconds(0);
  };

  const handleClientClick = (id: string) => {
    selectConversation(id);
  };

  const handleOpenConversationTaskContext = () => {
    const conversation = conversations.find((item) => item.id === selectedConversationId);
    if (!conversation?.projectId) {
      setActionFeedback({ tone: "error", message: "This thread is not linked to a project yet." });
      return;
    }
    setActivePage("tasks");
    setShowTaskComposer(true);
    setNewTaskDraft((previous) => ({
      ...previous,
      projectId: conversation.projectId ?? previous.projectId,
      title: previous.title || `Follow-up: ${conversation.subject}`
    }));
  };

  const handleOpenConversationFiles = () => {
    const conversation = conversations.find((item) => item.id === selectedConversationId);
    if (!conversation?.projectId) {
      setActionFeedback({ tone: "error", message: "Link this thread to a project before adding files." });
      return;
    }
    setActivePage("deliverables");
    setActionFeedback({ tone: "success", message: "Open Deliverables to attach files to this project." });
  };

  const handleCreateTaskFromThread = () => {
    const conversation = conversations.find((item) => item.id === selectedConversationId);
    if (!conversation?.projectId) {
      setActionFeedback({ tone: "error", message: "This thread is not linked to a project yet." });
      return;
    }
    setActivePage("tasks");
    setShowTaskComposer(true);
    setNewTaskDraft((previous) => ({
      ...previous,
      projectId: conversation.projectId ?? previous.projectId,
      title: `Thread action: ${conversation.subject}`
    }));
  };

  const handleOpenDashboardThread = (threadId: string) => {
    setActivePage("clients");
    selectConversation(threadId);
  };

  const handleOpenTaskThread = (projectId: string) => {
    const conversationId = conversationByProjectId.get(projectId);
    if (!conversationId) {
      setActionFeedback({ tone: "error", message: "No client thread is linked to this project yet." });
      return;
    }
    setActivePage("clients");
    selectConversation(conversationId);
  };

  const handleRunDashboardAction = (action: "tasks" | "clients" | "deliverables" | "timelog", threadId?: string) => {
    if (action === "clients") {
      setActivePage("clients");
      if (threadId) {
        selectConversation(threadId);
      }
      return;
    }
    if (action === "tasks") {
      setActivePage("tasks");
      return;
    }
    if (action === "deliverables") {
      setActivePage("deliverables");
      return;
    }
    setActivePage("timelog");
  };

  const handleSendMessage = async () => {
    if (!selectedConversationId || !composeMessage.trim()) return;
    const created = await sendMessage(selectedConversationId, composeMessage.trim());
    if (created?.id) {
      setSentMessageIds((prev) => [...prev, created.id]);
      setComposeMessage("");
    }
  };

  const handleCreateThread = async () => {
    if (!session || creatingThread) return;
    if (!effectiveNewThreadClientId || newThreadSubject.trim().length < 2) {
      setActionFeedback({ tone: "error", message: "Select a client and provide a thread subject." });
      return;
    }
    setCreatingThread(true);
    const result = await createConversationWithRefresh(session, {
      clientId: effectiveNewThreadClientId,
      subject: newThreadSubject.trim()
    });
    setCreatingThread(false);
    if (!result.data) {
      setActionFeedback({ tone: "error", message: result.error?.message ?? "Unable to create thread." });
      return;
    }
    setNewThreadSubject("");
    selectConversation(result.data.id);
    await refreshWorkspace(result.nextSession ?? session, { background: true });
    setActionFeedback({ tone: "success", message: "Thread created." });
  };

  const handleAddNote = async () => {
    if (!selectedConversationId || !noteText.trim()) return;
    const created = await addConversationNote(selectedConversationId, noteText.trim());
    if (created?.id) {
      setNoteText("");
    }
  };

  const handleEscalate = async () => {
    if (!selectedConversationId || !escalationReason.trim()) return;
    const latestMessageId = conversationMessages[conversationMessages.length - 1]?.id;
    const reason = escalationReason.trim();
    const created = await escalateConversation({
      conversationId: selectedConversationId,
      messageId: latestMessageId,
      severity: escalationSeverity,
      reason
    });
    if (created?.id) {
      const conversationProjectId =
        conversations.find((conversation) => conversation.id === selectedConversationId)?.projectId ?? null;
      if (session && conversationProjectId) {
        await createProjectBlockerWithRefresh(session, {
          projectId: conversationProjectId,
          title: reason,
          description: `Auto-created from conversation escalation (${escalationSeverity})`,
          severity: escalationSeverity,
          status: "OPEN",
          ownerRole: "STAFF",
          ownerName: staffName
        });
      }
      setEscalationReason("");
      setEscalationSeverity("MEDIUM");
    }
  };

  const handleAssignConversationToMe = async () => {
    if (!selectedConversationId || !session?.user.id) return;
    const updated = await updateConversationAssignee(selectedConversationId, session.user.id);
    setActionFeedback({
      tone: updated ? "success" : "error",
      message: updated ? "Thread assigned to you." : "Unable to assign thread."
    });
  };

  const handleUnassignConversation = async () => {
    if (!selectedConversationId) return;
    const updated = await updateConversationAssignee(selectedConversationId, null);
    setActionFeedback({
      tone: updated ? "success" : "error",
      message: updated ? "Thread unassigned." : "Unable to unassign thread."
    });
  };

  const handleTaskAction = async (taskId: string, projectId: string, status: TaskContext["status"]) => {
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
      setActionFeedback({
        tone: "error",
        message: `In Progress WIP limit reached (${inProgressCount}/${inProgressLimit}). Complete or unblock work first.`
      });
      return;
    }
    const result = await updateProjectTaskWithRefresh(session, projectId, taskId, { status: nextStatus });
    if (result.data) {
      const taskName = taskContexts.find((task) => task.id === taskId)?.title ?? "Task";
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
      setKanbanAnnouncement(`${taskName} moved to ${formatStatus(nextStatus)}.`);
    }
    await refreshWorkspace(result.nextSession ?? session);
  };

  const handleMoveTask = async (
    taskId: string,
    projectId: string,
    currentStatus: TaskContext["status"],
    nextStatus: TaskContext["status"]
  ) => {
    if (!session || nextStatus === currentStatus) return;
    if (nextStatus === "IN_PROGRESS" && currentStatus !== "IN_PROGRESS" && inProgressCount >= inProgressLimit) {
      setActionFeedback({
        tone: "error",
        message: `In Progress WIP limit reached (${inProgressCount}/${inProgressLimit}).`
      });
      return;
    }
    const result = await updateProjectTaskWithRefresh(session, projectId, taskId, { status: nextStatus });
    if (result.data) {
      const taskName = taskContexts.find((task) => task.id === taskId)?.title ?? "Task";
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
      setKanbanAnnouncement(`${taskName} moved to ${formatStatus(nextStatus)}.`);
    }
    await refreshWorkspace(result.nextSession ?? session);
  };

  const handleSubmitKanbanBlock = async () => {
    if (!session || !kanbanBlockDraft || creatingKanbanBlocker) return;
    if (kanbanBlockReason.trim().length < 4) {
      setActionFeedback({ tone: "error", message: "Provide a clear blocker reason." });
      return;
    }
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
      setActionFeedback({ tone: "error", message: blockerResult.error?.message ?? "Unable to create blocker." });
      return;
    }
    const taskResult = await updateProjectTaskWithRefresh(session, kanbanBlockDraft.projectId, kanbanBlockDraft.taskId, { status: "BLOCKED" });
    setCreatingKanbanBlocker(false);
    setKanbanBlockDraft(null);
    setKanbanBlockReason("");
    setKanbanBlockSeverity("MEDIUM");
    setKanbanBlockEta("");
    setActionFeedback({ tone: "success", message: "Task marked blocked and escalated." });
    await refreshWorkspace(taskResult.nextSession ?? blockerResult.nextSession ?? session);
  };

  const effectiveTaskDraftProjectId = newTaskDraft.projectId || projects[0]?.id || "";
  const effectiveDeliverableDraftProjectId = newDeliverableDraft.projectId || projects[0]?.id || "";

  const handleCreateTask = async () => {
    if (!session) return;
    const projectId = effectiveTaskDraftProjectId;
    if (!projectId || newTaskDraft.title.trim().length < 3) {
      setActionFeedback({ tone: "error", message: "Select a project and enter a task title." });
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
      setActionFeedback({ tone: "error", message: result.error?.message ?? "Unable to create task." });
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
    setActionFeedback({ tone: "success", message: "Task created." });
    await refreshWorkspace(result.nextSession ?? session, { background: true });
  };

  const handleCreateDeliverable = async () => {
    if (!session) return;
    const projectId = effectiveDeliverableDraftProjectId;
    if (!projectId || newDeliverableDraft.title.trim().length < 3) {
      setActionFeedback({ tone: "error", message: "Select a project and enter a deliverable title." });
      return;
    }
    setCreatingDeliverable(true);
    const result = await createProjectMilestoneWithRefresh(session, projectId, {
      title: newDeliverableDraft.title.trim(),
      dueAt: newDeliverableDraft.dueAt || undefined
    });
    setCreatingDeliverable(false);
    if (!result.data) {
      setActionFeedback({ tone: "error", message: result.error?.message ?? "Unable to create deliverable." });
      return;
    }
    setProjectDetails((previous) =>
      previous.map((project) =>
        project.id === projectId
          ? { ...project, milestones: [result.data!, ...project.milestones] }
          : project
      )
    );
    setNewDeliverableDraft({
      projectId,
      title: "",
      dueAt: ""
    });
    setShowDeliverableComposer(false);
    setActionFeedback({ tone: "success", message: "Deliverable created." });
    await refreshWorkspace(result.nextSession ?? session, { background: true });
  };

  const handleMilestoneAttachment = async (projectId: string, milestoneId: string, fileId: string | null) => {
    if (!session) return;
    const result = await updateProjectMilestoneWithRefresh(session, projectId, milestoneId, { fileId });
    if (result.data) {
      setProjectDetails((prev) =>
        prev.map((project) =>
          project.id !== projectId
            ? project
            : {
                ...project,
                milestones: project.milestones.map((milestone) => (milestone.id === milestoneId ? result.data! : milestone))
              }
        )
      );
    }
    await refreshWorkspace(result.nextSession ?? session);
  };

  const handleMilestoneStatusUpdate = async (
    projectId: string,
    milestoneId: string,
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  ) => {
    if (!session) return;
    const result = await updateProjectMilestoneWithRefresh(session, projectId, milestoneId, { status });
    if (result.data) {
      setProjectDetails((prev) =>
        prev.map((project) =>
          project.id !== projectId
            ? project
            : {
                ...project,
                milestones: project.milestones.map((milestone) => (milestone.id === milestoneId ? result.data! : milestone))
              }
        )
      );
      setActionFeedback({ tone: "success", message: `Deliverable moved to ${formatStatus(status)}.` });
    }
    await refreshWorkspace(result.nextSession ?? session);
  };

  const handleEstimateDraftChange = (
    changeRequestId: string,
    field: "hours" | "costCents" | "assessment",
    value: string
  ) => {
    setEstimateDrafts((previous) => ({
      ...previous,
      [changeRequestId]: {
        hours: previous[changeRequestId]?.hours ?? "",
        costCents: previous[changeRequestId]?.costCents ?? "",
        assessment: previous[changeRequestId]?.assessment ?? "",
        [field]: value
      }
    }));
  };

  const handleEstimateChangeRequest = async (changeRequestId: string) => {
    if (!session) return;
    const draft = estimateDrafts[changeRequestId] ?? { hours: "", costCents: "", assessment: "" };
    const estimatedHours = Number(draft.hours);
    const estimatedCostCents = Number(draft.costCents);
    const result = await updateProjectChangeRequestWithRefresh(session, changeRequestId, {
      status: "ESTIMATED",
      estimatedHours: Number.isFinite(estimatedHours) && estimatedHours > 0 ? estimatedHours : undefined,
      estimatedCostCents: Number.isFinite(estimatedCostCents) && estimatedCostCents > 0 ? estimatedCostCents : undefined,
      staffAssessment: draft.assessment.trim() || undefined
    });
    if (!result.data) {
      setActionFeedback({ tone: "error", message: result.error?.message ?? "Unable to submit estimate." });
      return;
    }
    setChangeRequests((previous) =>
      previous.map((item) => (item.id === changeRequestId ? result.data! : item))
    );
    setActionFeedback({ tone: "success", message: "Estimate submitted for admin review." });
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await signOut();
    window.location.href = "/internal-login";
  };

  const handleSaveStaffProfile = async () => {
    if (!session) return;
    const result = await setProjectPreferenceWithRefresh(session, {
      key: "settingsProfile",
      value: JSON.stringify(settingsProfile)
    });
    if (result.data) {
      setSavedSettingsProfile(settingsProfile);
    }
    setActionFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Profile settings saved." : result.error?.message ?? "Unable to save profile settings."
    });
  };

  const handleProfileAvatarChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      setSettingsProfile((previous) => ({ ...previous, avatarUrl: result }));
      setActionFeedback({ tone: "success", message: "Profile photo updated. Save changes to persist it." });
    };
    reader.onerror = () => {
      setActionFeedback({ tone: "error", message: "Unable to load selected image." });
    };
    reader.readAsDataURL(file);
  };

  const handleResetStaffProfile = () => {
    setSettingsProfile(savedSettingsProfile);
    setActionFeedback({ tone: "success", message: "Profile changes reverted." });
  };

  const handleResetStaffNotifications = () => {
    setSettingsNotifications(savedSettingsNotifications);
    setActionFeedback({ tone: "success", message: "Notification changes reverted." });
  };

  const handleResetStaffWorkspace = () => {
    setSettingsWorkspace(savedSettingsWorkspace);
    setActionFeedback({ tone: "success", message: "Workspace changes reverted." });
  };

  const handleUseLocalTimezone = () => {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setSettingsWorkspace((previous) => ({ ...previous, timezone: localTz }));
  };

  const handleSaveStaffNotifications = async () => {
    if (!session) return;
    const result = await setProjectPreferenceWithRefresh(session, {
      key: "settingsNotifications",
      value: JSON.stringify(settingsNotifications)
    });
    if (result.data) {
      setSavedSettingsNotifications(settingsNotifications);
    }
    setActionFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Notification settings saved." : result.error?.message ?? "Unable to save notification settings."
    });
  };

  const handleSaveStaffWorkspace = async () => {
    if (!session) return;
    const result = await setProjectPreferenceWithRefresh(session, {
      key: "settingsWorkspace",
      value: JSON.stringify(settingsWorkspace)
    });
    if (result.data) {
      setSavedSettingsWorkspace(settingsWorkspace);
    }
    setActionFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Workspace settings saved." : result.error?.message ?? "Unable to save workspace settings."
    });
  };

  const handleGenerateHandoffExport = async (format: "json" | "markdown") => {
    if (!session || generatingHandoffExport) return;
    setGeneratingHandoffExport(true);
    const result = await createProjectHandoffExportWithRefresh(session, { format });
    setGeneratingHandoffExport(false);
    if (!result.data) {
      setActionFeedback({ tone: "error", message: result.error?.message ?? "Unable to create handoff export." });
      return;
    }
    const download = await downloadProjectHandoffExportWithRefresh(session, result.data.record.id);
    if (download.data?.downloadUrl) {
      const anchor = document.createElement("a");
      anchor.href = download.data.downloadUrl;
      anchor.download = download.data.fileName;
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
    setHandoffExports((previous) => [result.data!.record, ...previous.filter((entry) => entry.id !== result.data!.record.id)].slice(0, 25));
    setActionFeedback({ tone: "success", message: `Handoff export ready: ${result.data.record.fileName}` });
  };

  const handleExportTimeLog = () => {
    if (timeEntrySource.length === 0) {
      setActionFeedback({ tone: "error", message: "No time entries to export yet." });
      return;
    }

    const escapeCsv = (value: string) => `"${value.replace(/"/g, "\"\"")}"`;
    const header = ["Entry ID", "Project", "Task", "Minutes", "Duration", "Logged At"];
    const rows = timeEntrySource
      .slice()
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .map((entry) => [
        entry.id,
        entry.project,
        entry.task,
        String(entry.minutes),
        formatDuration(entry.minutes),
        new Date(entry.loggedAt).toISOString()
      ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `staff-time-log-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setActionFeedback({ tone: "success", message: "Time log exported." });
  };

  const handleExportTimeLogJson = () => {
    if (timeEntrySource.length === 0) {
      setActionFeedback({ tone: "error", message: "No time entries to export yet." });
      return;
    }
    const payload = {
      generatedAt: new Date().toISOString(),
      entries: timeEntrySource
        .slice()
        .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
        .map((entry) => ({
          id: entry.id,
          project: entry.project,
          task: entry.task,
          minutes: entry.minutes,
          duration: formatDuration(entry.minutes),
          loggedAt: new Date(entry.loggedAt).toISOString()
        }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `staff-time-log-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setActionFeedback({ tone: "success", message: "Time log JSON exported." });
  };

  const handleDownloadHandoffExport = async (exportId: string) => {
    if (!session) return;
    const result = await downloadProjectHandoffExportWithRefresh(session, exportId);
    if (!result.data) {
      setActionFeedback({ tone: "error", message: result.error?.message ?? "Unable to download handoff export." });
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = result.data.downloadUrl;
    anchor.download = result.data.fileName;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleProcessAutomationQueue = async () => {
    if (!session || processingAutomationQueue) return;
    setProcessingAutomationQueue(true);
    let processedCount = 0;
    for (let index = 0; index < 6; index += 1) {
      const result = await processNotificationQueueWithRefresh(session);
      if (!result.data?.processed) break;
      processedCount += 1;
    }
    const jobsResult = await loadNotificationJobsWithRefresh(session);
    if (jobsResult.data) {
      setNotificationJobs(
        jobsResult.data.map((job) => ({ id: job.id, status: job.status, tab: job.tab, readAt: job.readAt }))
      );
    }
    setProcessingAutomationQueue(false);
    setActionFeedback({
      tone: "success",
      message: processedCount > 0 ? `Processed ${processedCount} queued notification job${processedCount === 1 ? "" : "s"}.` : "Queue already clear."
    });
  };

  const handleAcknowledgeAutomationFailures = async () => {
    if (!session || acknowledgingAutomationFailures) return;
    const failedUnread = notificationJobs.filter((job) => job.status === "FAILED" && !job.readAt);
    if (failedUnread.length === 0) {
      setActionFeedback({ tone: "success", message: "No failed alerts to acknowledge." });
      return;
    }
    setAcknowledgingAutomationFailures(true);
    await Promise.all(failedUnread.map((job) => setNotificationReadStateWithRefresh(session, job.id, true)));
    setNotificationJobs((previous) =>
      previous.map((job) =>
        failedUnread.some((target) => target.id === job.id)
          ? { ...job, readAt: new Date().toISOString() }
          : job
      )
    );
    setAcknowledgingAutomationFailures(false);
    setActionFeedback({ tone: "success", message: `${failedUnread.length} failed alert${failedUnread.length === 1 ? "" : "s"} acknowledged.` });
  };

  const staffTourSteps = [
    { title: "Dashboard", detail: "Check priorities, workload distribution, and SLA health." },
    { title: "Tasks + Kanban", detail: "Plan delivery work, move status, and escalate blockers." },
    { title: "Clients + Threads", detail: "Handle client communication with clear ownership." },
    { title: "Deliverables + Time", detail: "Manage milestones, change estimates, and time logs." }
  ] as const;

  return (
    <div className={`${styles.staffRoot} ${syne.variable} ${dmMono.variable} ${instrument.variable}`}>
      <div className={styles.cursor} ref={cursorRef} />
      <div className={styles.cursorRing} ref={ringRef} />

      <div className={styles.shell}>
        <StaffSidebar
          navSections={navSections}
          activePage={activePage}
          onNavigate={setActivePage}
          staffInitials={staffInitials}
          staffName={staffName}
          staffRole={staffRole}
        />

        <div className={styles.main}>
          <StaffTopbar
            eyebrow={topbarEyebrow}
            title={topbarTitle}
            searchValue={topbarSearch}
            searchPlaceholder={topbarSearchPlaceholder[activePage]}
            onSearchChange={setTopbarSearch}
            notificationCount={totalUnreadNotifications}
            onOpenNotifications={() => setActivePage("automations")}
            onNewTask={() => setActivePage("tasks")}
            onQuickTime={() => setActivePage("timelog")}
            onLogout={() => void handleLogout()}
            isLoggingOut={loggingOut}
          />

          <div className={styles.content}>
            {actionFeedback ? (
              <div
                className={styles.card}
                style={{
                  marginBottom: 12,
                  borderColor: actionFeedback.tone === "error" ? "rgba(255,95,124,0.4)" : "rgba(77,155,255,0.4)",
                  background: actionFeedback.tone === "error" ? "rgba(255,95,124,0.08)" : "rgba(77,155,255,0.1)"
                }}
              >
                <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
                  <div className={styles.pageSub} style={{ color: actionFeedback.tone === "error" ? "var(--red)" : "var(--accent)" }}>
                    {actionFeedback.message}
                  </div>
                </div>
              </div>
            ) : null}
            {staffTourOpen ? (
              <div className={styles.card} style={{ marginBottom: 12 }}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardHeaderTitle}>Staff Onboarding Tour</span>
                  <span className={styles.pageSub} style={{ marginTop: 0 }}>Step {staffTourStep + 1} / {staffTourSteps.length}</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardHeaderTitle}>{staffTourSteps[staffTourStep]?.title}</div>
                  <div className={styles.pageSub} style={{ marginTop: 6 }}>{staffTourSteps[staffTourStep]?.detail}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonGhost}`}
                      onClick={() => setStaffTourStep((value) => Math.max(0, value - 1))}
                      disabled={staffTourStep === 0}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonAccent}`}
                      onClick={() => {
                        if (staffTourStep < staffTourSteps.length - 1) {
                          setStaffTourStep((value) => value + 1);
                          return;
                        }
                        if (session?.user?.email) {
                          window.localStorage.setItem(`maphari:tour:staff:${session.user.email}`, "done");
                        }
                        setStaffTourOpen(false);
                      }}
                    >
                      {staffTourStep < staffTourSteps.length - 1 ? "Next" : "Finish"}
                    </button>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonGhost}`}
                      onClick={() => {
                        if (session?.user?.email) {
                          window.localStorage.setItem(`maphari:tour:staff:${session.user.email}`, "done");
                        }
                        setStaffTourOpen(false);
                      }}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            <DashboardPage
              isActive={activePage === "dashboard"}
              todayLabel={todayLabel}
              weekNumber={weekNumber}
              staffName={staffName}
              openTasksCount={openTasks.length}
              openConversationsCount={openConversations.length}
              overdueCount={milestoneStats.overdue}
              onGoTimeLog={() => setActivePage("timelog")}
              onGoKanban={() => setActivePage("kanban")}
              onGoTasks={() => setActivePage("tasks")}
              onGoClients={() => setActivePage("clients")}
              onGoDeliverables={() => setActivePage("deliverables")}
              onRunDashboardAction={handleRunDashboardAction}
              timerDisplay={timerDisplay}
              timerRunning={timerRunning}
              timerProjectName={timerProjectName}
              timerTaskName={timerTaskName}
              selectedTimerProjectId={effectiveSelectedTimerProjectId}
              onTimerProjectChange={setSelectedTimerProjectId}
              timerTaskLabel={timerTaskLabel}
              onTimerTaskLabelChange={setTimerTaskLabel}
              projects={projects.map((project) => ({ id: project.id, name: project.name }))}
              onTimerToggle={handleTimerToggle}
              onTimerStop={handleTimerStop}
              todayMinutes={todayMinutes}
              weekMinutes={weekMinutes}
              averageProgress={averageProgress}
              daysLeft={daysLeft}
              nextDueLabel={nextDueLabel}
              projectsCount={projects.length}
              highPriorityTasksCount={highPriorityTasks.length}
              priorityTasks={priorityTasks}
              threadItems={threadItems}
              onOpenThread={handleOpenDashboardThread}
              collaborationRows={collaborationRows}
              projectTimeBreakdown={projectTimeBreakdown}
              maxProjectMinutes={maxProjectMinutes}
              slaWatchlist={slaWatchlist}
              activityFeed={activityFeed}
              focusQueue={focusQueue}
              actionInbox={actionInbox}
              digestItems={digestItems}
              dashboardLastSeenAt={dashboardLastSeenAt ?? null}
              slaBurn={slaBurn}
              flowHealth={flowHealth}
            />

            <TasksPage
              isActive={activePage === "tasks"}
              openTasksCount={openTasks.length}
              projectsCount={projects.length}
              projects={projects.map((project) => ({ id: project.id, name: project.name }))}
              taskTabs={taskTabs}
              activeTaskTab={activeTaskTab}
              onTaskTabChange={setActiveTaskTab}
              highPriorityOnly={highPriorityOnly}
              onToggleHighPriority={() => setHighPriorityOnly((value) => !value)}
              showComposer={showTaskComposer}
              onToggleComposer={() => {
                setShowTaskComposer((value) => !value);
                setNewTaskDraft((previous) => ({
                  ...previous,
                  projectId: previous.projectId || projects[0]?.id || ""
                }));
              }}
              newTask={{
                ...newTaskDraft,
                projectId: effectiveTaskDraftProjectId
              }}
              onNewTaskChange={(patch) =>
                setNewTaskDraft((previous) => ({
                  ...previous,
                  ...patch
                }))
              }
              creatingTask={creatingTask}
              onCreateTask={() => void handleCreateTask()}
              filteredTasks={filteredTasks}
              onTaskAction={handleTaskAction}
              onOpenTaskThread={handleOpenTaskThread}
              hasProjectThread={(projectId) => conversationByProjectId.has(projectId)}
            />

            <KanbanPage
              isActive={activePage === "kanban"}
              taskCount={taskContexts.length}
              openTasksCount={openTasks.length}
              blockedTasksCount={blockedTasksCount}
              overdueTasksCount={overdueTasksCount}
              inProgressCount={inProgressCount}
              inProgressLimit={inProgressLimit}
              kanbanColumns={kanbanColumns}
              animateProgress={animateProgress}
              kanbanViewMode={kanbanViewMode}
              onKanbanViewModeChange={setKanbanViewMode}
              kanbanSwimlane={kanbanSwimlane}
              onKanbanSwimlaneChange={setKanbanSwimlane}
              flowMetrics={kanbanFlowMetrics}
              kanbanHealth={kanbanHealth}
              onOpenTaskFilters={() => {
                setActivePage("tasks");
              }}
              onOpenTaskComposer={() => {
                setActivePage("tasks");
                setShowTaskComposer(true);
                setNewTaskDraft((previous) => ({
                  ...previous,
                  projectId: previous.projectId || projects[0]?.id || ""
                }));
              }}
              onOpenBlockedQueue={() => {
                setActivePage("tasks");
                setActiveTaskTab("blocked");
              }}
              onOpenOverdueQueue={() => {
                setActivePage("tasks");
                setHighPriorityOnly(true);
              }}
              onTaskAction={handleTaskAction}
              onOpenTaskThread={handleOpenTaskThread}
              hasProjectThread={(projectId) => conversationByProjectId.has(projectId)}
              blockDraft={kanbanBlockDraft}
              blockReason={kanbanBlockReason}
              blockSeverity={kanbanBlockSeverity}
              blockEta={kanbanBlockEta}
              creatingBlocker={creatingKanbanBlocker}
              onOpenBlockDraft={(taskId, projectId, title) => {
                setKanbanBlockDraft({ taskId, projectId, title });
                setKanbanBlockReason("");
                setKanbanBlockSeverity("MEDIUM");
                setKanbanBlockEta("");
              }}
              onCancelBlockDraft={() => {
                setKanbanBlockDraft(null);
                setKanbanBlockReason("");
                setKanbanBlockSeverity("MEDIUM");
                setKanbanBlockEta("");
              }}
              onBlockReasonChange={setKanbanBlockReason}
              onBlockSeverityChange={setKanbanBlockSeverity}
              onBlockEtaChange={setKanbanBlockEta}
              onSubmitBlockDraft={() => void handleSubmitKanbanBlock()}
              onMoveTask={(taskId, projectId, currentStatus, nextStatus) =>
                void handleMoveTask(taskId, projectId, currentStatus, nextStatus)
              }
              announcement={kanbanAnnouncement}
            />

            <ClientsPage
              isActive={activePage === "clients"}
              openConversationsCount={openConversations.length}
              threadItems={visibleThreadItems}
              threadFilter={threadFilter}
              threadCounts={threadCounts}
              onThreadFilterChange={setThreadFilter}
              threadSearch={threadSearch}
              onThreadSearchChange={setThreadSearch}
              newThreadSubject={newThreadSubject}
              onNewThreadSubjectChange={setNewThreadSubject}
              newThreadClientId={effectiveNewThreadClientId}
              onNewThreadClientIdChange={setNewThreadClientId}
              newThreadClientOptions={clients.map((client) => ({ id: client.id, name: client.name }))}
              creatingThread={creatingThread}
              onCreateThread={handleCreateThread}
              selectedConversationId={selectedConversationId}
              selectedThread={selectedThread}
              selectedConversation={selectedConversation}
              conversationMessages={conversationMessages}
              sentMessageIds={sentMessageIds}
              conversationNotes={conversationNotes}
              conversationEscalations={conversationEscalations}
              messagesLoading={messagesLoading}
              composeMessage={composeMessage}
              noteText={noteText}
              escalationReason={escalationReason}
              escalationSeverity={escalationSeverity}
              onComposeMessageChange={setComposeMessage}
              onNoteTextChange={setNoteText}
              onEscalationReasonChange={setEscalationReason}
              onEscalationSeverityChange={setEscalationSeverity}
              onSendMessage={handleSendMessage}
              onAddNote={handleAddNote}
              onEscalate={handleEscalate}
              onClientClick={handleClientClick}
              onOpenThreadTask={handleOpenConversationTaskContext}
              onOpenThreadFiles={handleOpenConversationFiles}
              onCreateTaskFromThread={handleCreateTaskFromThread}
              onComposeSubmitShortcut={() => void handleSendMessage()}
              staffInitials={staffInitials}
              viewerUserId={session?.user.id ?? null}
              onAssignToMe={() => void handleAssignConversationToMe()}
              onUnassign={() => void handleUnassignConversation()}
            />

            <DeliverablesPage
              isActive={activePage === "deliverables"}
              nowTs={nowTs}
              milestoneStats={milestoneStats}
              projects={projects.map((project) => ({ id: project.id, name: project.name }))}
              showComposer={showDeliverableComposer}
              onToggleComposer={() => {
                setShowDeliverableComposer((value) => !value);
                setNewDeliverableDraft((previous) => ({
                  ...previous,
                  projectId: previous.projectId || projects[0]?.id || ""
                }));
              }}
              newDeliverable={{
                ...newDeliverableDraft,
                projectId: effectiveDeliverableDraftProjectId
              }}
              onNewDeliverableChange={(patch) =>
                setNewDeliverableDraft((previous) => ({
                  ...previous,
                  ...patch
                }))
              }
              creatingDeliverable={creatingDeliverable}
              onCreateDeliverable={() => void handleCreateDeliverable()}
              deliverableGroups={deliverableGroups}
              files={files}
              onMilestoneAttachment={handleMilestoneAttachment}
              onMilestoneStatusUpdate={(projectId, milestoneId, status) =>
                void handleMilestoneStatusUpdate(projectId, milestoneId, status)
              }
              changeRequests={changeRequests}
              estimateDrafts={estimateDrafts}
              onEstimateDraftChange={handleEstimateDraftChange}
              onEstimateChangeRequest={(changeRequestId) => void handleEstimateChangeRequest(changeRequestId)}
              handoffExports={handoffExports}
              generatingHandoffExport={generatingHandoffExport}
              onGenerateHandoffExport={(format) => void handleGenerateHandoffExport(format)}
              onDownloadHandoffExport={(exportId) => void handleDownloadHandoffExport(exportId)}
            />

            <TimeLogPage
              isActive={activePage === "timelog"}
              timerDisplay={timerDisplay}
              timerRunning={timerRunning}
              timerProjectName={timerProjectName}
              timerTaskName={timerTaskName}
              onTimerToggle={handleTimerToggle}
              onTimerStop={handleTimerStop}
              selectedTimerProjectId={effectiveSelectedTimerProjectId}
              onTimerProjectChange={setSelectedTimerProjectId}
              timerTaskLabel={timerTaskLabel}
              onTimerTaskLabelChange={setTimerTaskLabel}
              projects={projects}
              weekMinutes={weekMinutes}
              weekData={weekData}
              weekMax={weekMax}
              projectTimeBreakdown={projectTimeBreakdown}
              recentTimeEntries={recentTimeEntries}
              todayMinutes={todayMinutes}
              weeklyTargetHours={settingsProfile.weeklyTargetHours || weeklyTargetHours}
              onExportCsv={handleExportTimeLog}
              onExportJson={handleExportTimeLogJson}
            />

            <AutomationsPage
              isActive={activePage === "automations"}
              queuedNotifications={notificationJobs.filter((job) => job.status === "QUEUED").length}
              failedNotifications={notificationJobs.filter((job) => job.status === "FAILED").length}
              openBlockers={projectBlockers.filter((blocker) => blocker.status !== "RESOLVED").length}
              overdueMilestones={milestoneStats.overdue}
              openThreads={openConversations.length}
              workflowRows={staffWorkflowRows}
              jobs={notificationJobs}
              processingQueue={processingAutomationQueue}
              acknowledgingFailures={acknowledgingAutomationFailures}
              onProcessQueue={() => void handleProcessAutomationQueue()}
              onAcknowledgeFailures={() => void handleAcknowledgeAutomationFailures()}
              onOpenDeliverables={() => setActivePage("deliverables")}
              onOpenClients={() => setActivePage("clients")}
            />

            <SettingsPage
              isActive={activePage === "settings"}
              staffInitials={staffInitials}
              staffName={staffName}
              staffEmail={staffEmail}
              staffRole={staffRole}
              profileName={settingsProfile.fullName}
              profileEmail={settingsProfile.email}
              profileAvatarUrl={settingsProfile.avatarUrl}
              weeklyTargetHours={settingsProfile.weeklyTargetHours || weeklyTargetHours}
              onProfileNameChange={(value) => setSettingsProfile((previous) => ({ ...previous, fullName: value }))}
              onProfileEmailChange={(value) => setSettingsProfile((previous) => ({ ...previous, email: value }))}
              onProfileAvatarChange={handleProfileAvatarChange}
              onWeeklyTargetHoursChange={(value) => setSettingsProfile((previous) => ({ ...previous, weeklyTargetHours: value }))}
              onSaveProfile={() => void handleSaveStaffProfile()}
              onResetProfile={handleResetStaffProfile}
              hasProfileChanges={hasProfileChanges}
              notifications={settingsNotifications}
              onNotificationChange={(key, value) =>
                setSettingsNotifications((previous) => ({ ...previous, [key]: value }))
              }
              onSaveNotifications={() => void handleSaveStaffNotifications()}
              onResetNotifications={handleResetStaffNotifications}
              hasNotificationsChanges={hasNotificationsChanges}
              workspace={settingsWorkspace}
              timezoneOptions={timezoneOptions}
              onWorkspaceChange={(key, value) =>
                setSettingsWorkspace((previous) => ({
                  ...previous,
                  [key]:
                    key === "defaultStatus"
                      ? (value as "Available" | "Focused" | "In a meeting")
                      : value
                }))
              }
              onSaveWorkspace={() => void handleSaveStaffWorkspace()}
              onResetWorkspace={handleResetStaffWorkspace}
              onUseLocalTimezone={handleUseLocalTimezone}
              hasWorkspaceChanges={hasWorkspaceChanges}
              projects={projects}
              highPriorityClients={highPriorityClients}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
