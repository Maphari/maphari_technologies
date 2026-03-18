"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useDashboardToasts, DashboardToastStack, DashboardLoadingFallback } from "../shared/dashboard-core";
import {
  loadNotificationJobsWithRefresh,
  processNotificationQueueWithRefresh,
  setNotificationReadStateWithRefresh,
  type ProjectChangeRequest,
  type ProjectHandoffExportRecord
} from "../../lib/api/admin";
import { useStaffWorkspace } from "../../lib/auth/use-staff-workspace";
import { DashboardErrorBoundary } from "./staff-dashboard/error-boundary";
import { useRealtimeRefresh } from "../../lib/auth/use-realtime-refresh";
import { useCursorTrail } from "../shared/use-cursor-trail";
import { useDelayedFlag } from "../shared/use-delayed-flag";
import { useCommandSearch } from "../shared/use-command-search";
import { useKeyboardShortcuts } from "../shared/use-keyboard-shortcuts";
import { useSessionTimeout } from "../shared/use-session-timeout";
import { useTheme } from "../shared/use-theme";
import { useQuickCompose } from "../shared/use-quick-compose";
import { createPortalConversationWithRefresh } from "../../lib/api/portal/messages";
import { getStaffApprovals, type StaffApprovalItem } from "../../lib/api/staff/approvals";
import { searchGlobal } from "../../lib/api/shared/search";
import { getStaffAllHealthScores, type StaffHealthScoreEntry } from "../../lib/api/staff/clients";
import { getMyProfile } from "../../lib/api/staff/profile";
import { saveSession } from "../../lib/auth/session";
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
import { AppointmentsPage } from "./staff-dashboard/pages/appointments-page";
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
import { ChangeRequestsPage } from "./staff-dashboard/pages/change-requests-page";
import { SlaTrackerPage } from "./staff-dashboard/pages/sla-tracker-page";
import { WorkloadHeatmapPage } from "./staff-dashboard/pages/workload-heatmap-page";
import { styles, cx } from "./staff-dashboard/style";
import { Ic } from "./staff-dashboard/ui";
import { inferCountryFromLocale, currencyFromCountry } from "../../lib/i18n/currency";
import type { PageId } from "./staff-dashboard/types";
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
import { useStaffNav } from "./staff-dashboard/hooks/use-staff-nav";
import { useStaffTour, STAFF_TOUR_STEPS } from "./staff-dashboard/hooks/use-staff-tour";
import { DashboardTour } from "../shared/dashboard-tour";

// ── CMD+K search type → icon name ────────────────────────────────────────────
const STAFF_CMD_TYPE_ICON: Record<string, string> = {
  Page:    "file",
  Project: "briefcase",
  Thread:  "message",
  Client:  "users",
  Task:    "check",
  Ticket:  "receipt",
  Lead:    "star",
};

const STAFF_CMD_TYPE_COLOR: Record<string, string> = {
  Page:    "var(--blue, #5b8df8)",
  Project: "var(--accent)",
  Thread:  "var(--lime, var(--accent))",
  Client:  "var(--purple, #8b6fff)",
  Task:    "var(--green, #4ade80)",
  Ticket:  "var(--amber, #f59e0b)",
  Lead:    "var(--amber, #f59e0b)",
};

const STAFF_CMD_TYPE_BG: Record<string, string> = {
  Page:    "color-mix(in oklab, var(--blue, #5b8df8)  10%, var(--s2))",
  Project: "color-mix(in oklab, var(--accent)          10%, var(--s2))",
  Thread:  "color-mix(in oklab, var(--lime, var(--accent)) 10%, var(--s2))",
  Client:  "color-mix(in oklab, var(--purple, #8b6fff) 10%, var(--s2))",
  Task:    "color-mix(in oklab, var(--green, #4ade80)  10%, var(--s2))",
  Ticket:  "color-mix(in oklab, var(--amber, #f59e0b)  10%, var(--s2))",
  Lead:    "color-mix(in oklab, var(--amber, #f59e0b)  10%, var(--s2))",
};

export function MaphariStaffDashboard() {
  // ─── Navigation + UI state kept in orchestrator ───
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [topbarSearch] = useState("");
  const [filterProjectId, setFilterProjectId] = useState<string | undefined>(undefined);
  const { toasts, setFeedback } = useDashboardToasts({ dismissMs: 4200 });

  // ─── Currency (browser locale detection) ───
  const staffCurrency = useMemo(() => {
    if (typeof navigator === "undefined") return "USD";
    const country = inferCountryFromLocale(navigator.language);
    return currencyFromCountry(country) ?? "USD";
  }, []);

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
  const staffEmailFallbackName = staffEmail.split("@")[0]?.replace(/\./g, " ") ?? "Staff";

  // Load real display name from profile API
  const [staffProfileName, setStaffProfileName] = useState<string | null>(null);
  useEffect(() => {
    if (!session) return;
    void getMyProfile(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        const full = [r.data.firstName, r.data.lastName].filter(Boolean).join(" ").trim();
        if (full) setStaffProfileName(full);
      }
    });
  }, [session?.accessToken]);

  const staffName = staffProfileName ?? staffEmailFallbackName;
  const staffInitials = getInitials(staffName);
  const staffRole = session?.user.role ?? "STAFF";

  const searchQuery = topbarSearch.trim().toLowerCase();

  // ─── Tour ───
  const {
    staffTourOpen,
    staffTourStep,
    handleStaffTourNext,
    handleStaffTourBack,
    completeStaffTour,
    resetStaffTour
  } = useStaffTour({ session, onNavigate: setActivePage });

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

  // ─── Approvals: count for sidebar badge + dashboard brief ───
  const [approvalItems, setApprovalItems] = useState<StaffApprovalItem[]>([]);
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void getStaffApprovals(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      setApprovalItems(result.data ?? []);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken]);
  const pendingApprovals = useMemo(() => approvalItems.filter((a) => a.status === "Pending"), [approvalItems]);
  const pendingApprovalsCount = pendingApprovals.length;

  // ─── Health scores: at-risk count for dashboard brief ───
  const [healthEntries, setHealthEntries] = useState<StaffHealthScoreEntry[]>([]);
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void getStaffAllHealthScores(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      setHealthEntries(result.data ?? []);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken]);
  const atRiskClients = useMemo(() => healthEntries.filter((e) => e.score < 65).sort((a, b) => a.score - b.score), [healthEntries]);
  const atRiskClientsCount = atRiskClients.length;

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

  // ─── Navigation sections (extracted into useStaffNav hook) ───
  const { allNavSections, navSections } = useStaffNav({
    openTasksCount:          openTasks.length,
    openConversationsCount:  openConversations.length,
    overdueDeliverables:     milestoneStats.overdue,
    openBlockersCount:       projectBlockers.filter((b) => b.status !== "RESOLVED").length,
    totalUnreadNotifications,
    pendingApprovalsCount,
    unreadByTab,
  });

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

  const staffAsyncSearch = useCallback(async (q: string) => {
    if (!session) return [];
    const res = await searchGlobal(q, session);
    const hits = res.data?.results ?? [];
    return hits.map((hit) => ({
      id: `search-${hit.id}`,
      type: hit.type.charAt(0).toUpperCase() + hit.type.slice(1),
      label: hit.title,
      meta: hit.subtitle ?? hit.status ?? "",
      action: () => {
        if (hit.type === "project" || hit.type === "task") setActivePage("context");
        else if (hit.type === "client") setActivePage("clients");
        else if (hit.type === "lead") setActivePage("dashboard");
        else if (hit.type === "ticket") setActivePage("comms");
        else setActivePage("dashboard");
      }
    }));
  }, [session, setActivePage]);

  const commandSearch = useCommandSearch({ sources: commandSearchSources, asyncSearch: staffAsyncSearch });

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

  // ─── Render ───
  if (loading && !snapshot.clients?.length && !snapshot.projects?.length) {
    return <DashboardLoadingFallback variant="staff" />;
  }

  return (
    <div className={`${styles.staffRoot} ${styles.root} dashboardScale dashboardBlendAdmin dashboardThemeStaff`}>
      <div className={styles.cursor} ref={cursorRef} />
      <div className={styles.cursorRing} ref={ringRef} />

      <div className={styles.shell}>
        <StaffSidebar
          navSections={navSections}
          allPagesSections={allNavSections}
          activePage={activePage}
          onNavigate={(p) => { setActivePage(p); setSidebarOpen(false); }}
          staffInitials={staffInitials}
          staffName={staffName}
          staffRole={staffRole}
          mobileOpen={sidebarOpen}
          quickActionProjects={projects.map((p) => ({ id: p.id, name: p.name }))}
          onQuickAddTask={() => {
            setActivePage("tasks");
            setSidebarOpen(false);
            setShowTaskComposer(true);
          }}
          onQuickLogTime={async (projectId, minutes, label) => {
            await addTimeEntry({ projectId, minutes, taskLabel: label, staffName });
            setFeedback({ tone: "success", message: `${minutes}m logged to ${projectById.get(projectId)?.name ?? "project"}.` });
          }}
        />
        {sidebarOpen && (
          <div className={styles.mobileOverlay} onClick={() => setSidebarOpen(false)} />
        )}
        <button
          type="button"
          className={styles.hamburgerBtn}
          aria-label="Toggle navigation"
          onClick={() => setSidebarOpen((prev) => !prev)}
        >
          {sidebarOpen
            ? <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            : <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="1" y="4"    width="16" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="1" y="8.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="1" y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
              </svg>
          }
        </button>

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
            staffName={staffName}
            staffEmail={staffEmail}
            staffRole={staffRole}
            isLoggingOut={loggingOut}
            onOpenHelp={() => setActivePage("knowledge")}
            onMenuToggle={() => setSidebarOpen((prev) => !prev)}
            onNewTask={() => {
              setActivePage("tasks");
              setSidebarOpen(false);
              setShowTaskComposer(true);
            }}
            onStartTimer={() => {
              setActivePage("timelog");
              setSidebarOpen(false);
            }}
            onOpenFiles={() => {
              setActivePage("projectdocuments");
              setSidebarOpen(false);
            }}
          />

          <div className={styles.content}>
            <DashboardToastStack toasts={toasts} />
            <DashboardErrorBoundary>
            <DashboardTour
              open={staffTourOpen}
              step={staffTourStep}
              steps={STAFF_TOUR_STEPS}
              onBack={handleStaffTourBack}
              onNext={handleStaffTourNext}
              onSkip={completeStaffTour}
            />
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

            <NotificationsPage isActive={activePage === "notifications"} session={session ?? null} />

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
              onAutoEscalateBlocked={async () => {
                await new Promise((r) => setTimeout(r, 800));
                setFeedback({ tone: "success", message: `Blocked & aging tasks escalated — project managers notified.` });
              }}
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

            <AutoDraftUpdatesPage isActive={activePage === "autodraft"} session={session ?? null} />

            <MeetingPrepPage isActive={activePage === "meetingprep"} session={session ?? null} />

            <CommunicationHistoryPage isActive={activePage === "comms"} />

            <ClientOnboardingPage isActive={activePage === "onboarding"} session={session ?? null} onNavigate={setActivePage} />

            <ClientHealthPage isActive={activePage === "health"} session={session ?? null} />

            <ResponseTimePage isActive={activePage === "response"} session={session ?? null} />

            <SentimentFlagsPage isActive={activePage === "sentiment"} session={session ?? null} />

            <LastTouchedPage isActive={activePage === "lasttouched"} session={session ?? null} />

            <PortalActivityPage isActive={activePage === "portal"} session={session ?? null} />

            <SmartSuggestionsPage isActive={activePage === "smartsuggestions"} session={session ?? null} />

            <SprintPlanningPage isActive={activePage === "sprintplanning"} session={session ?? null} />

            <TaskDependenciesPage isActive={activePage === "taskdependencies"} session={session ?? null} />

            <RecurringTasksPage isActive={activePage === "recurringtasks"} session={session ?? null} />

            <FocusModePage isActive={activePage === "focusmode"} session={session ?? null} />

            <PeerRequestsPage isActive={activePage === "peerrequests"} session={session ?? null} />

            <TriggerLogPage isActive={activePage === "triggerlog"} session={session ?? null} />

            <PrivateNotesPage isActive={activePage === "privatenotes"} session={session ?? null} />

            <KeyboardShortcutsPage isActive={activePage === "keyboardshortcuts"} session={session ?? null} />

            <EstimatesVsActualsPage isActive={activePage === "estimatesactuals"} session={session ?? null} />

            <SatisfactionScoresPage isActive={activePage === "satisfactionscores"} session={session ?? null} />

            <KnowledgeBasePage isActive={activePage === "knowledge"} session={session} />

            <DecisionLogPage isActive={activePage === "decisionlog"} session={session ?? null} />

            <HandoverChecklistPage isActive={activePage === "handoverchecklist"} session={session ?? null} />

            <CloseOutReportPage isActive={activePage === "closeoutreport"} session={session ?? null} />

            <StaffHandoversPage isActive={activePage === "staffhandovers"} session={session} />

            <ProjectContextPage isActive={activePage === "context"} session={session ?? null} />

            <MilestoneSignOffPage isActive={activePage === "signoff"} session={session ?? null} />

            <DailyStandupPage isActive={activePage === "standup"} session={session} />

            <RetainerBurnPage isActive={activePage === "retainer"} session={session ?? null} />

            <InvoiceViewerPage isActive={activePage === "invoiceviewer"} session={session ?? null} />

            <ProjectBudgetPage isActive={activePage === "projectbudget"} session={session ?? null} />

            <ClientBudgetPage isActive={activePage === "clientbudget"} session={session ?? null} />

            <ExpenseSubmitPage isActive={activePage === "expensesubmit"} session={session} onFeedback={(tone, message) => setFeedback({ tone, message })} />

            <PayStubPage isActive={activePage === "paystub"} session={session} />

            <RateCardPage isActive={activePage === "ratecard"} session={session ?? null} />

            <VendorDirectoryPage isActive={activePage === "vendordirectory"} session={session ?? null} />

            <MyPortfolioPage isActive={activePage === "myportfolio"} session={session ?? null} />

            <MyCapacityPage isActive={activePage === "mycapacity"} session={session ?? null} />

            <MyTimelinePage isActive={activePage === "mytimeline"} session={session ?? null} />

            <QAChecklistPage isActive={activePage === "qachecklist"} session={session ?? null} />

            <ApprovalQueuePage
              isActive={activePage === "approvalqueue"}
              session={session ?? null}
              onFeedback={(tone, message) => setFeedback({ tone, message })}
            />

            <ClientHealthSummaryPage isActive={activePage === "clienthealthsummary"} session={session ?? null} />

            <FeedbackInboxPage isActive={activePage === "feedbackinbox"} session={session ?? null} />

            <MyOnboardingPage isActive={activePage === "myonboarding"} session={session} />

            <MyLeavePage isActive={activePage === "myleave"} session={session} />

            <AppointmentsPage isActive={activePage === "appointments"} session={session ?? null} />

            <MyLearningPage isActive={activePage === "mylearning"} session={session} />

            <MyEnpsPage isActive={activePage === "myenps"} session={session ?? null} />

            <MyEmploymentPage isActive={activePage === "myemployment"} session={session ?? null} />

            <BrandKitPage isActive={activePage === "brandkit"} session={session ?? null} />

            <ContractViewerPage isActive={activePage === "contractviewer"} session={session ?? null} />

            <ServiceCatalogPage isActive={activePage === "servicecatalog"} session={session ?? null} />

            <ProjectDocumentsPage isActive={activePage === "projectdocuments"} session={session ?? null} />

            <RequestViewerPage isActive={activePage === "requestviewer"} session={session ?? null} />

            <ClientJourneyPage isActive={activePage === "clientjourney"} session={session ?? null} />

            <OffboardingTasksPage isActive={activePage === "offboardingtasks"} session={session ?? null} />

            <InterventionActionsPage isActive={activePage === "interventionactions"} session={session ?? null} />

            <ClientTeamPage isActive={activePage === "clientteam"} session={session ?? null} />

            <DeliveryStatusPage
              isActive={activePage === "deliverystatus"}
              session={session ?? null}
              onGoTasks={(projectId) => {
                setFilterProjectId(projectId);
                setActivePage("tasks");
              }}
            />

            <MyTeamPage isActive={activePage === "myteam"} session={session ?? null} />

            <MyRisksPage isActive={activePage === "myrisks"} session={session ?? null} />

            <SystemStatusPage isActive={activePage === "systemstatus"} session={session ?? null} />

            <IncidentAlertsPage isActive={activePage === "incidentalerts"} session={session ?? null} />

            <MyAnalyticsPage isActive={activePage === "myanalytics"} session={session ?? null} />

            <MyReportsPage isActive={activePage === "myreports"} session={session ?? null} />

            <TeamPerformancePage isActive={activePage === "teamperformance"} session={session ?? null} />

            <MyIntegrationsPage isActive={activePage === "myintegrations"} session={session ?? null} />

            <ChangeRequestsPage isActive={activePage === "changeRequests"} session={session ?? null} />

            <SlaTrackerPage isActive={activePage === "slaTracker"} session={session ?? null} />

            <WorkloadHeatmapPage isActive={activePage === "workloadheatmap"} session={session ?? null} />

            <PersonalPerformancePage isActive={activePage === "performance"} session={session ?? null} />

            <EndOfDayWrapPage isActive={activePage === "eodwrap"} session={session ?? null} />

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
              onQuickLog8h={async () => {
                const primaryProjectId = effectiveSelectedTimerProjectId || projects[0]?.id;
                if (!primaryProjectId) return;
                await addTimeEntry({ projectId: primaryProjectId, minutes: 480, taskLabel: "Quick-log (8h)", staffName });
                setFeedback({ tone: "success", message: `8h logged to ${projectById.get(primaryProjectId)?.name ?? "project"}.` });
              }}
            />

            <AutomationsPage
              isActive={activePage === "automations"}
              session={session ?? null}
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
              theme={themeHook.theme}
              onThemeChange={themeHook.setTheme}
              kanbanViewMode={kanbanViewMode}
              onKanbanViewModeChange={setKanbanViewMode}
              kanbanSwimlane={kanbanSwimlane}
              onKanbanSwimlaneChange={setKanbanSwimlane}
              onRestartTour={resetStaffTour}
            />
            </DashboardErrorBoundary>
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
                  onClick={() => { result.action(); commandSearch.close(); }}
                >
                  {/* Colored icon chip */}
                  <span
                    className={styles.cmdTypeIcon}
                    style={{ "--cmd-ic-bg": STAFF_CMD_TYPE_BG[result.type] ?? "var(--s2)" } as React.CSSProperties}
                  >
                    <Ic
                      n={STAFF_CMD_TYPE_ICON[result.type] ?? "file"}
                      sz={14}
                      c={STAFF_CMD_TYPE_COLOR[result.type] ?? "var(--muted2)"}
                    />
                  </span>
                  <span className={styles.cmdItemLabel}>{result.label}</span>
                  {result.meta ? (
                    <span className={styles.cmdItemMeta}>{result.meta}</span>
                  ) : null}
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
