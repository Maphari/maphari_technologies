"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useDashboardToasts, DashboardToastStack } from "../shared/dashboard-core";
import {
  loadNotificationJobsWithRefresh,
  processNotificationQueueWithRefresh,
  setNotificationReadStateWithRefresh,
  type ProjectChangeRequest,
  type ProjectHandoffExportRecord
} from "../../lib/api/admin";
import { useStaffWorkspace } from "../../lib/auth/use-staff-workspace";
import { useRealtimeRefresh } from "../../lib/auth/use-realtime-refresh";
import { useCursorTrail } from "../shared/use-cursor-trail";
import { useDelayedFlag } from "../shared/use-delayed-flag";
import { useCommandSearch } from "../shared/use-command-search";
import { useKeyboardShortcuts } from "../shared/use-keyboard-shortcuts";
import { useSessionTimeout } from "../shared/use-session-timeout";
import { useTheme } from "../shared/use-theme";
import { useQuickCompose } from "../shared/use-quick-compose";
import { createPortalConversationWithRefresh } from "../../lib/api/portal/messages";
import { pageTitles } from "./staff-dashboard/constants";
import { StaffSidebar } from "./staff-dashboard/sidebar";
import { StaffTopbar } from "./staff-dashboard/topbar";
import { ClientsPage } from "./staff-dashboard/pages/clients-page";
import { ClientHealthPage } from "./staff-dashboard/pages/client-health-page";
import { DashboardPage } from "./staff-dashboard/pages/dashboard-page";
import { NotificationsPage } from "./staff-dashboard/pages/notifications-page";
import { DailyStandupPage } from "./staff-dashboard/pages/daily-standup-page";
import { DeliverablesPage } from "./staff-dashboard/pages/deliverables-page";
import { EndOfDayWrapPage } from "./staff-dashboard/pages/end-of-day-wrap-page";
import { MilestoneSignOffPage } from "./staff-dashboard/pages/milestone-sign-off-page";
import { MeetingPrepPage } from "./staff-dashboard/pages/meeting-prep-page";
import { CommunicationHistoryPage } from "./staff-dashboard/pages/communication-history-page";
import { ClientOnboardingPage } from "./staff-dashboard/pages/client-onboarding-page";
import { ResponseTimePage } from "./staff-dashboard/pages/response-time-page";
import { SentimentFlagsPage } from "./staff-dashboard/pages/sentiment-flags-page";
import { LastTouchedPage } from "./staff-dashboard/pages/last-touched-page";
import { PortalActivityPage } from "./staff-dashboard/pages/portal-activity-page";
import { SmartSuggestionsPage } from "./staff-dashboard/pages/smart-suggestions-page";
import { SprintPlanningPage } from "./staff-dashboard/pages/sprint-planning-page";
import { TaskDependenciesPage } from "./staff-dashboard/pages/task-dependencies-page";
import { RecurringTasksPage } from "./staff-dashboard/pages/recurring-tasks-page";
import { FocusModePage } from "./staff-dashboard/pages/focus-mode-page";
import { PeerRequestsPage } from "./staff-dashboard/pages/peer-requests-page";
import { TriggerLogPage } from "./staff-dashboard/pages/trigger-log-page";
import { PrivateNotesPage } from "./staff-dashboard/pages/private-notes-page";
import { KeyboardShortcutsPage } from "./staff-dashboard/pages/keyboard-shortcuts-page";
import { EstimatesVsActualsPage } from "./staff-dashboard/pages/estimates-vs-actuals-page";
import { SatisfactionScoresPage } from "./staff-dashboard/pages/satisfaction-scores-page";
import { KnowledgeBasePage } from "./staff-dashboard/pages/knowledge-base-page";
import { DecisionLogPage } from "./staff-dashboard/pages/decision-log-page";
import { HandoverChecklistPage } from "./staff-dashboard/pages/handover-checklist-page";
import { CloseOutReportPage } from "./staff-dashboard/pages/close-out-report-page";
import { StaffHandoversPage } from "./staff-dashboard/pages/staff-handovers-page";
import { PersonalPerformancePage } from "./staff-dashboard/pages/personal-performance-page";
import { ProjectContextPage } from "./staff-dashboard/pages/project-context-page";
import { RetainerBurnPage } from "./staff-dashboard/pages/retainer-burn-page";
import { InvoiceViewerPage } from "./staff-dashboard/pages/invoice-viewer-page";
import { ProjectBudgetPage } from "./staff-dashboard/pages/project-budget-page";
import { ClientBudgetPage } from "./staff-dashboard/pages/client-budget-page";
import { ExpenseSubmitPage } from "./staff-dashboard/pages/expense-submit-page";
import { PayStubPage } from "./staff-dashboard/pages/pay-stub-page";
import { RateCardPage } from "./staff-dashboard/pages/rate-card-page";
import { VendorDirectoryPage } from "./staff-dashboard/pages/vendor-directory-page";
import { MyPortfolioPage } from "./staff-dashboard/pages/my-portfolio-page";
import { MyCapacityPage } from "./staff-dashboard/pages/my-capacity-page";
import { MyTimelinePage } from "./staff-dashboard/pages/my-timeline-page";
import { QAChecklistPage } from "./staff-dashboard/pages/qa-checklist-page";
import { ApprovalQueuePage } from "./staff-dashboard/pages/approval-queue-page";
import { ClientHealthSummaryPage } from "./staff-dashboard/pages/client-health-summary-page";
import { FeedbackInboxPage } from "./staff-dashboard/pages/feedback-inbox-page";
import { MyOnboardingPage } from "./staff-dashboard/pages/my-onboarding-page";
import { MyLeavePage } from "./staff-dashboard/pages/my-leave-page";
import { MyLearningPage } from "./staff-dashboard/pages/my-learning-page";
import { MyEnpsPage } from "./staff-dashboard/pages/my-enps-page";
import { MyEmploymentPage } from "./staff-dashboard/pages/my-employment-page";
import { BrandKitPage } from "./staff-dashboard/pages/brand-kit-page";
import { ContractViewerPage } from "./staff-dashboard/pages/contract-viewer-page";
import { ServiceCatalogPage } from "./staff-dashboard/pages/service-catalog-page";
import { ProjectDocumentsPage } from "./staff-dashboard/pages/project-documents-page";
import { RequestViewerPage } from "./staff-dashboard/pages/request-viewer-page";
import { ClientJourneyPage } from "./staff-dashboard/pages/client-journey-page";
import { OffboardingTasksPage } from "./staff-dashboard/pages/offboarding-tasks-page";
import { InterventionActionsPage } from "./staff-dashboard/pages/intervention-actions-page";
import { ClientTeamPage } from "./staff-dashboard/pages/client-team-page";
import { DeliveryStatusPage } from "./staff-dashboard/pages/delivery-status-page";
import { MyTeamPage } from "./staff-dashboard/pages/my-team-page";
import { MyRisksPage } from "./staff-dashboard/pages/my-risks-page";
import { SystemStatusPage } from "./staff-dashboard/pages/system-status-page";
import { IncidentAlertsPage } from "./staff-dashboard/pages/incident-alerts-page";
import { MyAnalyticsPage } from "./staff-dashboard/pages/my-analytics-page";
import { MyReportsPage } from "./staff-dashboard/pages/my-reports-page";
import { TeamPerformancePage } from "./staff-dashboard/pages/team-performance-page";
import { MyIntegrationsPage } from "./staff-dashboard/pages/my-integrations-page";
import { KanbanPage } from "./staff-dashboard/pages/kanban-page";
import { AutomationsPage } from "./staff-dashboard/pages/automations-page";
import { AutoDraftUpdatesPage } from "./staff-dashboard/pages/auto-draft-updates-page";
import { SettingsPage } from "./staff-dashboard/pages/settings-page";
import { TasksPage } from "./staff-dashboard/pages/tasks-page";
import { TimeLogPage } from "./staff-dashboard/pages/time-log-page";
import { styles, cx } from "./staff-dashboard/style";
import type { NavItem, PageId } from "./staff-dashboard/types";
import { formatDateLong, getInitials } from "./staff-dashboard/utils";
import { useStaffData } from "./staff-dashboard/hooks/use-staff-data";
import { useStaffTasks } from "./staff-dashboard/hooks/use-staff-tasks";
import { useStaffKanban } from "./staff-dashboard/hooks/use-staff-kanban";
import { useStaffDeliverables } from "./staff-dashboard/hooks/use-staff-deliverables";
import { useStaffMessages } from "./staff-dashboard/hooks/use-staff-messages";
import { useStaffTimer } from "./staff-dashboard/hooks/use-staff-timer";
import { useStaffNotifications } from "./staff-dashboard/hooks/use-staff-notifications";
import { useStaffSettings } from "./staff-dashboard/hooks/use-staff-settings";
import { useStaffActivity } from "./staff-dashboard/hooks/use-staff-activity";
import { useStaffWorkflow } from "./staff-dashboard/hooks/use-staff-workflow";
import { useStaffSla } from "./staff-dashboard/hooks/use-staff-sla";

export function MaphariStaffDashboard() {
  // ─── Navigation + UI state kept in orchestrator ───
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [loggingOut, setLoggingOut] = useState(false);
  const [staffTourOpen, setStaffTourOpen] = useState(false);
  const [staffTourStep, setStaffTourStep] = useState(0);
  const [topbarSearch] = useState("");
  const { toasts, setFeedback } = useDashboardToasts({ dismissMs: 4200 });

  // ─── Automations page state (not extracted into a hook yet) ───
  const [processingAutomationQueue, setProcessingAutomationQueue] = useState(false);
  const [acknowledgingAutomationFailures, setAcknowledgingAutomationFailures] = useState(false);

  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // ─── Workspace ───
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

  // ─── Derived workspace values ───
  const projects = useMemo(() => snapshot.projects ?? [], [snapshot.projects]);
  const clients = useMemo(() => snapshot.clients ?? [], [snapshot.clients]);

  const staffEmail = session?.user.email ?? "staff@maphari.co.za";
  const staffName = staffEmail.split("@")[0]?.replace(/\./g, " ") ?? "Staff";
  const staffInitials = getInitials(staffName);
  const staffRole = session?.user.role ?? "STAFF";

  const searchQuery = topbarSearch.trim().toLowerCase();

  // ─── Tour auto-open ───
  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `maphari:tour:staff:${session.user.email}`;
    if (!window.localStorage.getItem(key)) {
      queueMicrotask(() => setStaffTourOpen(true));
    }
  }, [session?.user?.email]);

  // ─── UX hooks: Theme ───
  const themeHook = useTheme({ storageKey: "maphari_staff_theme" });

  // ─── UX hooks: Session Timeout ───
  const sessionTimeout = useSessionTimeout({
    onTimeout: () => void signOut(),
    idleDurationMs: 30 * 60 * 1000, // 30 minutes
  });

  // ─── Hook 1: Notifications ───
  const {
    notificationJobs,
    setNotificationJobs,
    unreadByTab,
    totalUnreadNotifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead
  } = useStaffNotifications({ session, activePage });

  // ─── Hook 2: Data ───
  const {
    projectDetails,
    setProjectDetails,
    projectCollaboration,
    projectBlockers,
    timelineEvents,
    changeRequests,
    setChangeRequests,
    estimateDrafts,
    setEstimateDrafts,
    handoffExports,
    setHandoffExports,
    generatingHandoffExport,
    setGeneratingHandoffExport,
    dashboardLastSeenAt,
    setDashboardLastSeenAt,
    effectiveProjectDetails,
    clientById,
    projectById,
    fileById,
    nowTs,
    handleRealtimeRefresh
  } = useStaffData({
    session,
    snapshot,
    projects,
    clients,
    files,
    activePage,
    loading,
    setNotificationJobs
  });

  useRealtimeRefresh(session, handleRealtimeRefresh);

  // ─── Hook 3a: Tasks ───
  const {
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
  } = useStaffTasks({
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
    inProgressLimit: 3
  });

  const inProgressLimit = useMemo(
    () => Math.max(3, Math.ceil(Math.max(taskContexts.length, 1) / 3)),
    [taskContexts.length]
  );

  // ─── Hook 3b: Kanban ───
  const {
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
    blockedTasksCount,
    handleSubmitKanbanBlock
  } = useStaffKanban({
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
  });

  // ─── Hook 3c: Deliverables ───
  const {
    showDeliverableComposer,
    setShowDeliverableComposer,
    creatingDeliverable,
    newDeliverableDraft,
    setNewDeliverableDraft,
    deliverableGroups,
    milestoneStats,
    handleCreateDeliverable,
    handleMilestoneAttachment,
    handleMilestoneStatusUpdate,
    handleEstimateDraftChange,
    handleEstimateChangeRequest,
    handleGenerateHandoffExport,
    handleDownloadHandoffExport
  } = useStaffDeliverables({
    session,
    projectDetails,
    setProjectDetails,
    changeRequests,
    setChangeRequests,
    clientById,
    fileById,
    nowTs,
    effectiveProjectDetails,
    topbarSearch,
    estimateDrafts,
    setEstimateDrafts,
    handoffExports,
    setHandoffExports,
    generatingHandoffExport,
    setGeneratingHandoffExport,
    setFeedback,
    refreshWorkspace
  });

  // ─── Hook 4: Messages ───
  const {
    threadSearch,
    setThreadSearch,
    threadFilter,
    setThreadFilter,
    composeMessage,
    setComposeMessage,
    noteText,
    setNoteText,
    escalationReason,
    setEscalationReason,
    escalationSeverity,
    setEscalationSeverity,
    newThreadSubject,
    setNewThreadSubject,
    newThreadClientId,
    setNewThreadClientId,
    creatingThread,
    sentMessageIds,
    effectiveNewThreadClientId,
    threadItems,
    threadCounts,
    visibleThreadItems,
    conversationByProjectId,
    selectedConversation,
    selectedThread,
    openConversations,
    handleClientClick,
    handleSendMessage,
    handleCreateThread,
    handleAddNote,
    handleEscalate,
    handleAssignConversationToMe,
    handleUnassignConversation,
    handleCreateTaskFromThread,
    handleOpenConversationTaskContext,
    handleOpenConversationFiles,
    handleOpenDashboardThread,
    handleOpenTaskThread
  } = useStaffMessages({
    session,
    conversations,
    conversationMessages,
    selectedConversationId,
    topbarSearch,
    clients,
    clientById,
    projectById,
    setFeedback,
    setActivePage,
    setShowTaskComposer,
    setNewTaskDraft,
    selectConversation,
    sendMessage,
    addConversationNote,
    escalateConversation,
    updateConversationAssignee: async (conversationId: string, userId: string | null) => {
      const result = await updateConversationAssignee(conversationId, userId);
      return result !== null;
    },
    refreshWorkspace,
    staffName
  });

  // ─── Hook 5: Timer ───
  const {
    selectedTimerProjectId,
    setSelectedTimerProjectId,
    timerTaskLabel,
    setTimerTaskLabel,
    timerRunning,
    effectiveSelectedTimerProjectId,
    timerDisplay,
    timeEntrySource,
    recentTimeEntries,
    weekData,
    todayMinutes,
    weekMinutes,
    projectTimeBreakdown,
    maxProjectMinutes,
    handleTimerToggle,
    handleTimerStop,
    handleExportTimeLog,
    handleExportTimeLogJson
  } = useStaffTimer({
    session,
    snapshot,
    timeEntries,
    projects,
    projectById,
    clientById,
    addTimeEntry,
    setFeedback,
    staffName
  });

  // ─── Hook 6: Settings ───
  const {
    settingsProfile,
    setSettingsProfile,
    settingsNotifications,
    setSettingsNotifications,
    settingsWorkspace,
    setSettingsWorkspace,
    hasProfileChanges,
    hasNotificationsChanges,
    hasWorkspaceChanges,
    timezoneOptions,
    handleSaveStaffProfile,
    handleResetStaffProfile,
    handleSaveStaffNotifications,
    handleResetStaffNotifications,
    handleSaveStaffWorkspace,
    handleResetStaffWorkspace,
    handleProfileAvatarChange,
    handleUseLocalTimezone
  } = useStaffSettings({
    session,
    staffEmail,
    staffName,
    kanbanViewMode,
    kanbanSwimlane,
    setDashboardLastSeenAt,
    setFeedback,
    setKanbanViewMode,
    setKanbanSwimlane
  });

  // ─── Hook 7a: Activity views ───
  const {
    activityFeed,
    focusQueue,
    actionInbox,
    digestItems
  } = useStaffActivity({
    conversations,
    clientById,
    projectById,
    nowTs,
    effectiveProjectDetails,
    taskContexts,
    threadItems,
    projectBlockers,
    timelineEvents,
    changeRequests,
    notificationJobs,
    dashboardLastSeenAt,
    searchQuery
  });

  // ─── Hook 7b: Workflow / team views ───
  const {
    staffWorkflowRows,
    collaborationRows,
    averageProgress,
    nextDueDate
  } = useStaffWorkflow({
    projects,
    projectById,
    projectBlockers,
    timelineEvents,
    projectCollaboration,
    milestoneStats,
    notificationJobs,
    openConversations
  });

  // ─── Hook 7c: SLA and health metrics ───
  const {
    slaWatchlist,
    slaBurn,
    flowHealth
  } = useStaffSla({
    projects,
    clientById,
    projectBlockers,
    taskContexts,
    milestoneStats,
    nowTs,
    searchQuery
  });

  // ─── Computed values for the render tree ───
  const openTasks = useMemo(() => taskContexts.filter((task) => task.status !== "DONE"), [taskContexts]);

  const effectiveTaskDraftProjectId = newTaskDraft.projectId || projects[0]?.id || "";
  const effectiveDeliverableDraftProjectId = newDeliverableDraft.projectId || projects[0]?.id || "";

  const timerProjectName =
    (effectiveSelectedTimerProjectId && projectById.get(effectiveSelectedTimerProjectId)?.name) ||
    "Select a project";
  const timerTaskName = timerTaskLabel || "No active session";

  const weekMax = Math.max(...weekData.dailyMinutes, 0);
  const weeklyTargetHours = projects.length > 0 ? 40 : 0;

  const nextDueLabel = nextDueDate ? formatDateLong(nextDueDate.toISOString()) : "No upcoming due dates";
  const daysLeft = nextDueDate ? Math.max(0, Math.ceil((nextDueDate.getTime() - nowTs) / 86400000)) : null;

  const today = new Date();
  const todayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(today);
  const weekNumber = Math.ceil(
    ((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(today.getFullYear(), 0, 1).getDay() + 1) / 7
  );

  // ─── Navigation sections ───
  const allNavSections = useMemo(() => {
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
        id: "notifications",
        label: "Notifications",
        section: "Workspace",
        badge: totalUnreadNotifications > 0 ? { value: String(totalUnreadNotifications), tone: "amber" } : undefined
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
        id: "autodraft",
        label: "Auto-draft Updates",
        section: "Client Work",
        badge: unreadByTab.messages > 0 ? { value: String(unreadByTab.messages), tone: "amber" } : undefined
      },
      {
        id: "meetingprep",
        label: "Meeting Prep",
        section: "Client Work",
        badge: unreadByTab.messages > 0 ? { value: String(unreadByTab.messages), tone: "amber" } : undefined
      },
      {
        id: "comms",
        label: "Communication History",
        section: "Client Work",
        badge: unreadByTab.messages > 0 ? { value: String(unreadByTab.messages), tone: "amber" } : undefined
      },
      {
        id: "onboarding",
        label: "Client Onboarding",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "health",
        label: "Client Health",
        section: "Client Work",
        badge:
          Math.max(openBlockersCount, milestoneStats.overdue) > 0
            ? { value: String(Math.max(openBlockersCount, milestoneStats.overdue)), tone: "red" }
            : undefined
      },
      {
        id: "response",
        label: "Response Time",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "sentiment",
        label: "Sentiment Flags",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "lasttouched",
        label: "Last Touched",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "portal",
        label: "Portal Activity",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "smartsuggestions",
        label: "Smart Suggestions",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "sprintplanning",
        label: "Sprint Planning",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "taskdependencies",
        label: "Task Dependencies",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "recurringtasks",
        label: "Recurring Tasks",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "focusmode",
        label: "Focus Mode",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "peerrequests",
        label: "Peer Requests",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "triggerlog",
        label: "Trigger Log",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "amber" } : undefined
      },
      {
        id: "privatenotes",
        label: "Private Notes",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "keyboardshortcuts",
        label: "Keyboard Shortcuts",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "estimatesactuals",
        label: "Estimates vs Actuals",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "satisfactionscores",
        label: "Satisfaction Scores",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "knowledge",
        label: "Knowledge Base",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "decisionlog",
        label: "Decision Log",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "handoverchecklist",
        label: "Handover Checklist",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "closeoutreport",
        label: "Close-out Report",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "staffhandovers",
        label: "Staff Handovers",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "context",
        label: "Project Context",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "signoff",
        label: "Milestone Sign-off",
        section: "Client Work",
        badge:
          Math.max(milestoneStats.overdue, unreadByTab.projects) > 0
            ? { value: String(Math.max(milestoneStats.overdue, unreadByTab.projects)), tone: "red" }
            : undefined
      },
      {
        id: "standup",
        label: "Daily Standup",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "retainer",
        label: "Retainer Burn",
        section: "Client Work",
        badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects), tone: "amber" } : undefined
      },
      {
        id: "invoiceviewer",
        label: "Invoice Viewer",
        section: "Client Finance",
      },
      {
        id: "projectbudget",
        label: "Project Budget",
        section: "Client Finance",
      },
      {
        id: "clientbudget",
        label: "Client Budget",
        section: "Client Finance",
      },
      {
        id: "expensesubmit",
        label: "Expense Submission",
        section: "Client Finance",
      },
      {
        id: "paystub",
        label: "Pay Stubs",
        section: "Personal Finance",
      },
      {
        id: "ratecard",
        label: "Rate Card",
        section: "Client Finance",
      },
      {
        id: "vendordirectory",
        label: "Vendor Directory",
        section: "Client Finance",
      },
      {
        id: "myportfolio",
        label: "My Portfolio",
        section: "Project Management",
      },
      {
        id: "mycapacity",
        label: "My Capacity",
        section: "Project Management",
      },
      {
        id: "mytimeline",
        label: "My Timeline",
        section: "Project Management",
      },
      {
        id: "qachecklist",
        label: "QA Checklist",
        section: "Quality",
      },
      {
        id: "approvalqueue",
        label: "Approval Queue",
        section: "Workflow",
      },
      {
        id: "clienthealthsummary",
        label: "Health Summary",
        section: "Client Intelligence",
      },
      {
        id: "feedbackinbox",
        label: "Feedback Inbox",
        section: "Client Intelligence",
      },
      {
        id: "myonboarding",
        label: "My Onboarding",
        section: "HR",
      },
      {
        id: "myleave",
        label: "My Leave",
        section: "HR",
      },
      {
        id: "mylearning",
        label: "My Learning",
        section: "HR",
      },
      {
        id: "myenps",
        label: "My Feedback (eNPS)",
        section: "HR",
      },
      {
        id: "myemployment",
        label: "My Employment",
        section: "HR",
      },
      {
        id: "brandkit",
        label: "Brand Kit",
        section: "Knowledge",
      },
      {
        id: "contractviewer",
        label: "Contract Viewer",
        section: "Knowledge",
      },
      {
        id: "servicecatalog",
        label: "Service Catalog",
        section: "Knowledge",
      },
      {
        id: "projectdocuments",
        label: "Project Documents",
        section: "Knowledge",
      },
      {
        id: "requestviewer",
        label: "Request Viewer",
        section: "Client Lifecycle",
      },
      {
        id: "clientjourney",
        label: "Client Journey",
        section: "Client Lifecycle",
      },
      {
        id: "offboardingtasks",
        label: "Offboarding Tasks",
        section: "Client Lifecycle",
      },
      {
        id: "interventionactions",
        label: "Intervention Actions",
        section: "Client Lifecycle",
      },
      {
        id: "clientteam",
        label: "Client Team",
        section: "Client Lifecycle",
      },
      {
        id: "deliverystatus",
        label: "Delivery Status",
        section: "Client Lifecycle",
      },
      {
        id: "myteam",
        label: "My Team",
        section: "Governance",
      },
      {
        id: "myrisks",
        label: "My Risks",
        section: "Governance",
      },
      {
        id: "systemstatus",
        label: "System Status",
        section: "Governance",
      },
      {
        id: "incidentalerts",
        label: "Incident Alerts",
        section: "Governance",
      },
      {
        id: "myanalytics",
        label: "My Analytics",
        section: "Analytics",
      },
      {
        id: "myreports",
        label: "My Reports",
        section: "Analytics",
      },
      {
        id: "teamperformance",
        label: "Team Performance",
        section: "Analytics",
      },
      {
        id: "myintegrations",
        label: "My Integrations",
        section: "Settings",
      },
      {
        id: "performance",
        label: "My Performance",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
      },
      {
        id: "eodwrap",
        label: "End-of-day Wrap",
        section: "Tracking",
        badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "blue" } : undefined
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
  }, [milestoneStats.overdue, openConversations.length, openTasks.length, projectBlockers, totalUnreadNotifications, unreadByTab]);

  const navSections = useMemo(() => {
    const primarySidebarIds = new Set<PageId>([
      "dashboard",
      "notifications",
      "tasks",
      "kanban",
      "clients",
      "meetingprep",
      "health",
      "deliverables",
      "timelog",
      "settings"
    ]);

    return allNavSections
      .map(([section, items]) => [section, items.filter((item) => primarySidebarIds.has(item.id))] as [string, NavItem[]])
      .filter(([, items]) => items.length > 0);
  }, [allNavSections]);

  // ─── Handlers that stay in the orchestrator ───

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await signOut();
    window.location.href = "/internal-login";
  }, [loggingOut, signOut]);

  const handleRunDashboardAction = useCallback((action: "tasks" | "clients" | "deliverables" | "timelog", threadId?: string) => {
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
  }, [selectConversation]);

  const handleProcessAutomationQueue = useCallback(async () => {
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
    setFeedback({
      tone: "success",
      message: processedCount > 0 ? `Processed ${processedCount} queued notification job${processedCount === 1 ? "" : "s"}.` : "Queue already clear."
    });
  }, [processingAutomationQueue, session, setNotificationJobs]);

  const handleAcknowledgeAutomationFailures = useCallback(async () => {
    if (!session || acknowledgingAutomationFailures) return;
    const failedUnread = notificationJobs.filter((job) => job.status === "FAILED" && !job.readAt);
    if (failedUnread.length === 0) {
      setFeedback({ tone: "success", message: "No failed alerts to acknowledge." });
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
    setFeedback({ tone: "success", message: `${failedUnread.length} failed alert${failedUnread.length === 1 ? "" : "s"} acknowledged.` });
  }, [acknowledgingAutomationFailures, notificationJobs, session, setNotificationJobs]);

  // ─── Topbar / page titles ───
  const [topbarEyebrow, topbarTitle] = pageTitles[activePage];

  // ─── UX hooks: Command Search ───
  const commandSearchSources = useMemo(() => {
    const sources: Array<{ id: string; type: string; label: string; meta: string; action: () => void }> = [];

    // Nav items
    const flatNav = allNavSections.flatMap(([, items]) => items);
    for (const nav of flatNav) {
      sources.push({
        id: `nav-${nav.id}`,
        type: "Page",
        label: nav.label,
        meta: nav.section,
        action: () => setActivePage(nav.id),
      });
    }

    // Projects
    for (const project of projects) {
      sources.push({
        id: `project-${project.id}`,
        type: "Project",
        label: project.name,
        meta: project.status ?? "",
        action: () => setActivePage("context"),
      });
    }

    // Client threads
    for (const thread of threadItems) {
      sources.push({
        id: `thread-${thread.id}`,
        type: "Thread",
        label: thread.name,
        meta: thread.project,
        action: () => {
          selectConversation(thread.id);
          setActivePage("clients");
        },
      });
    }

    return sources;
  }, [allNavSections, projects, threadItems, setActivePage, selectConversation]);

  const commandSearch = useCommandSearch({ sources: commandSearchSources });

  // ─── UX hooks: Keyboard Shortcuts ───
  const staffChordMap: Record<string, PageId> = useMemo(() => ({
    d: "dashboard",
    n: "notifications",
    t: "tasks",
    k: "kanban",
    c: "clients",
    h: "health",
    l: "deliverables",
    g: "timelog",
    s: "settings",
    p: "sprintplanning",
    a: "automations",
    r: "retainer",
    m: "comms",
    e: "eodwrap",
    u: "standup",
  }), []);

  const shortcuts = useKeyboardShortcuts({
    chordMap: staffChordMap,
    onNavigate: setActivePage,
    onOpenSearch: commandSearch.open,
    isSearchOpen: commandSearch.isOpen,
  });

  // ─── UX hooks: Quick Compose ───
  const quickCompose = useQuickCompose({
    session: session ?? null,
    projects: projects.map((p) => ({ id: p.id, name: p.name })),
    createConversation: async (sess, payload) => {
      const result = await createPortalConversationWithRefresh(sess, payload);
      return { nextSession: result.nextSession, error: result.error };
    },
    refreshSnapshot: refreshWorkspace,
    setFeedback,
  });

  // ─── Tour steps ───
  const staffTourSteps = [
    { title: "Dashboard", detail: "Check priorities, workload distribution, and SLA health." },
    { title: "Tasks + Kanban", detail: "Plan delivery work, move status, and escalate blockers." },
    { title: "Clients + Threads", detail: "Handle client communication with clear ownership." },
    { title: "Deliverables + Time", detail: "Manage milestones, change estimates, and time logs." }
  ] as const;

  // ─── Render ───
  return (
    <div className={`${styles.staffRoot} ${styles.root} dashboardScale dashboardBlendAdmin dashboardThemeStaff`}>
      <div className={styles.cursor} ref={cursorRef} />
      <div className={styles.cursorRing} ref={ringRef} />

      <div className={styles.shell}>
        <StaffSidebar
          navSections={navSections}
          allPagesSections={allNavSections}
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
            onOpenApps={() => window.dispatchEvent(new CustomEvent("staff:open-app-grid"))}
            onOpenNotifications={() => setActivePage("notifications")}
            onOpenMessages={() => setActivePage("comms")}
            unreadNotificationsCount={totalUnreadNotifications}
            onLogout={() => void handleLogout()}
            staffInitials={staffInitials}
            staffEmail={staffEmail}
            staffRole={staffRole}
            isLoggingOut={loggingOut}
          />

          <div className={styles.content}>
            <DashboardToastStack toasts={toasts} />
            {staffTourOpen ? (
              <div className={`${styles.card} ${styles.tourCardWrap}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardHeaderTitle}>Staff Onboarding Tour</span>
                  <span className={`${styles.pageSub} ${styles.pageSubNoTop}`}>Step {staffTourStep + 1} / {staffTourSteps.length}</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardHeaderTitle}>{staffTourSteps[staffTourStep]?.title}</div>
                  <div className={`${styles.pageSub} ${styles.pageSubTightTop}`}>{staffTourSteps[staffTourStep]?.detail}</div>
                  <div className={styles.tourActionsRow}>
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

            <NotificationsPage isActive={activePage === "notifications"} />

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
              onCreateTask={() => void handleCreateTask(projects)}
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

            <AutoDraftUpdatesPage isActive={activePage === "autodraft"} />

            <MeetingPrepPage isActive={activePage === "meetingprep"} />

            <CommunicationHistoryPage isActive={activePage === "comms"} />

            <ClientOnboardingPage isActive={activePage === "onboarding"} />

            <ClientHealthPage isActive={activePage === "health"} />

            <ResponseTimePage isActive={activePage === "response"} />

            <SentimentFlagsPage isActive={activePage === "sentiment"} />

            <LastTouchedPage isActive={activePage === "lasttouched"} />

            <PortalActivityPage isActive={activePage === "portal"} />

            <SmartSuggestionsPage isActive={activePage === "smartsuggestions"} />

            <SprintPlanningPage isActive={activePage === "sprintplanning"} />

            <TaskDependenciesPage isActive={activePage === "taskdependencies"} />

            <RecurringTasksPage isActive={activePage === "recurringtasks"} />

            <FocusModePage isActive={activePage === "focusmode"} />

            <PeerRequestsPage isActive={activePage === "peerrequests"} />

            <TriggerLogPage isActive={activePage === "triggerlog"} />

            <PrivateNotesPage isActive={activePage === "privatenotes"} />

            <KeyboardShortcutsPage isActive={activePage === "keyboardshortcuts"} />

            <EstimatesVsActualsPage isActive={activePage === "estimatesactuals"} />

            <SatisfactionScoresPage isActive={activePage === "satisfactionscores"} />

            <KnowledgeBasePage isActive={activePage === "knowledge"} />

            <DecisionLogPage isActive={activePage === "decisionlog"} />

            <HandoverChecklistPage isActive={activePage === "handoverchecklist"} />

            <CloseOutReportPage isActive={activePage === "closeoutreport"} />

            <StaffHandoversPage isActive={activePage === "staffhandovers"} />

            <ProjectContextPage isActive={activePage === "context"} />

            <MilestoneSignOffPage isActive={activePage === "signoff"} />

            <DailyStandupPage isActive={activePage === "standup"} />

            <RetainerBurnPage isActive={activePage === "retainer"} />

            <InvoiceViewerPage isActive={activePage === "invoiceviewer"} />

            <ProjectBudgetPage isActive={activePage === "projectbudget"} />

            <ClientBudgetPage isActive={activePage === "clientbudget"} />

            <ExpenseSubmitPage isActive={activePage === "expensesubmit"} />

            <PayStubPage isActive={activePage === "paystub"} />

            <RateCardPage isActive={activePage === "ratecard"} />

            <VendorDirectoryPage isActive={activePage === "vendordirectory"} />

            <MyPortfolioPage isActive={activePage === "myportfolio"} />

            <MyCapacityPage isActive={activePage === "mycapacity"} />

            <MyTimelinePage isActive={activePage === "mytimeline"} />

            <QAChecklistPage isActive={activePage === "qachecklist"} />

            <ApprovalQueuePage isActive={activePage === "approvalqueue"} />

            <ClientHealthSummaryPage isActive={activePage === "clienthealthsummary"} />

            <FeedbackInboxPage isActive={activePage === "feedbackinbox"} />

            <MyOnboardingPage isActive={activePage === "myonboarding"} />

            <MyLeavePage isActive={activePage === "myleave"} />

            <MyLearningPage isActive={activePage === "mylearning"} />

            <MyEnpsPage isActive={activePage === "myenps"} />

            <MyEmploymentPage isActive={activePage === "myemployment"} />

            <BrandKitPage isActive={activePage === "brandkit"} />

            <ContractViewerPage isActive={activePage === "contractviewer"} />

            <ServiceCatalogPage isActive={activePage === "servicecatalog"} />

            <ProjectDocumentsPage isActive={activePage === "projectdocuments"} />

            <RequestViewerPage isActive={activePage === "requestviewer"} />

            <ClientJourneyPage isActive={activePage === "clientjourney"} />

            <OffboardingTasksPage isActive={activePage === "offboardingtasks"} />

            <InterventionActionsPage isActive={activePage === "interventionactions"} />

            <ClientTeamPage isActive={activePage === "clientteam"} />

            <DeliveryStatusPage isActive={activePage === "deliverystatus"} />

            <MyTeamPage isActive={activePage === "myteam"} />

            <MyRisksPage isActive={activePage === "myrisks"} />

            <SystemStatusPage isActive={activePage === "systemstatus"} />

            <IncidentAlertsPage isActive={activePage === "incidentalerts"} />

            <MyAnalyticsPage isActive={activePage === "myanalytics"} />

            <MyReportsPage isActive={activePage === "myreports"} />

            <TeamPerformancePage isActive={activePage === "teamperformance"} />

            <MyIntegrationsPage isActive={activePage === "myintegrations"} />

            <PersonalPerformancePage isActive={activePage === "performance"} />

            <EndOfDayWrapPage isActive={activePage === "eodwrap"} />

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
              onCreateDeliverable={() => void handleCreateDeliverable(projects)}
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

      {/* ── Command search overlay ──────────────────────────────────────── */}
      {commandSearch.isOpen && (
        <div className={styles.cmdOverlay} onClick={commandSearch.close}>
          <div
            className={styles.cmdPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Command search"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              className={styles.cmdInput}
              type="text"
              placeholder="Search pages, projects, threads..."
              value={commandSearch.query}
              onChange={(e) => commandSearch.setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") commandSearch.close();
                if (e.key === "Enter") commandSearch.executeActive();
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  commandSearch.moveUp();
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  commandSearch.moveDown();
                }
              }}
              autoFocus
            />
            <div className={styles.cmdResults}>
              {commandSearch.results.map((result, i) => (
                <button
                  key={result.id}
                  type="button"
                  className={cx(
                    "cmdItem",
                    i === commandSearch.activeIndex && "cmdItemActive",
                  )}
                  onClick={() => result.action()}
                >
                  <span className={styles.cmdItemLabel}>{result.label}</span>
                  <span className={styles.cmdItemMeta}>{result.meta}</span>
                </button>
              ))}
              {commandSearch.query && commandSearch.results.length === 0 && (
                <div className={styles.cmdEmpty}>No results found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Keyboard shortcuts panel ────────────────────────────────────── */}
      {shortcuts.shortcutsVisible && (
        <div className={styles.shortcutsPanel}>
          <div className={styles.shortcutsPanelTitle}>Keyboard Shortcuts</div>
          {(
            [
              ["G → D", "Dashboard"],
              ["G → N", "Notifications"],
              ["G → T", "My Tasks"],
              ["G → K", "Kanban Board"],
              ["G → C", "Client Threads"],
              ["G → H", "Client Health"],
              ["G → L", "Deliverables"],
              ["G → G", "Time Log"],
              ["G → P", "Sprint Planning"],
              ["G → M", "Messages"],
              ["G → A", "Automations"],
              ["G → R", "Retainer Burn"],
              ["G → U", "Daily Standup"],
              ["G → E", "EOD Wrap"],
              ["G → S", "Settings"],
              ["⌘K", "Search"],
              ["?", "Toggle shortcuts"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className={styles.shortcutRow}>
              <span>{label}</span>
              <span className={styles.shortcutKey}>{key}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Quick compose modal ─────────────────────────────────────────── */}
      {quickCompose.isOpen && (
        <div className={styles.cmdOverlay} onClick={quickCompose.close}>
          <div
            className={`${styles.cmdPanel} ${styles.composePanel}`}
            role="dialog"
            aria-modal="true"
            aria-label="New message composer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.composeBody}>
              <div className={styles.composeHeading}>New Message</div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="staff-compose-subject">Subject</label>
                <input
                  id="staff-compose-subject"
                  className={styles.input}
                  type="text"
                  value={quickCompose.subject}
                  onChange={(e) => quickCompose.setSubject(e.target.value)}
                  placeholder="Message subject"
                />
              </div>
              <div className={`${styles.inputGroup} ${styles.mt12}`}>
                <label className={styles.inputLabel} htmlFor="staff-compose-project">Project</label>
                <select
                  id="staff-compose-project"
                  className={styles.select}
                  value={quickCompose.selectedProjectId}
                  onChange={(e) => quickCompose.setSelectedProjectId(e.target.value)}
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.composeFooter}>
              <button
                type="button"
                className={cx("button", "buttonGhost")}
                onClick={quickCompose.close}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cx("button", "buttonAccent")}
                onClick={quickCompose.send}
                disabled={quickCompose.sending || !quickCompose.subject.trim()}
              >
                {quickCompose.sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Session timeout warning ─────────────────────────────────────── */}
      {sessionTimeout.showWarning && (
        <div className={styles.sessionWarning}>
          <div className={styles.sessionCard} role="alertdialog" aria-modal="true" aria-labelledby="staff-session-warning">
            <div id="staff-session-warning" className={styles.sessionTitle}>Session Expiring</div>
            <div className={styles.sessionDesc}>
              Your session will expire in {sessionTimeout.remainingSeconds}{" "}
              seconds due to inactivity.
            </div>
            <button
              type="button"
              className={cx("button", "buttonAccent")}
              onClick={sessionTimeout.extendSession}
            >
              Stay Logged In
            </button>
          </div>
        </div>
      )}

      {/* ── Toast stack ─────────────────────────────────────────────────── */}
      <DashboardToastStack toasts={toasts} />
    </div>
  );
}
