"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboardToasts, DashboardToastStack, DashboardLoadingFallback } from "../shared/dashboard-core";
import {
  loadNotificationJobsWithRefresh,
  processNotificationQueueWithRefresh,
  setNotificationReadStateWithRefresh,
  updateProjectBlockerWithRefresh,
  loadAdminIntegrationRequestsWithRefresh,
  loadAdminTaskIntegrationSyncEventsWithRefresh,
  updateAdminIntegrationRequestWithRefresh,
  type AdminIntegrationRequestItem,
  type AdminTaskIntegrationSyncEvent,
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
import { submitWeekTimesheetWithRefresh, getIsoWeekString, getIsoWeekNumber } from "../../lib/api/staff/time";
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
import { MyGoalsPage } from "./staff-dashboard/pages/my-goals-page";
import { PeerReviewPage } from "./staff-dashboard/pages/peer-review-page";
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
import { FtueWelcomeModal } from "./staff-dashboard/components/ftue-welcome-modal";

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
  const router = useRouter();

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

  // ─── Timesheet submit state ───
  const [submittingWeek, setSubmittingWeek] = useState(false);
  const currentWeek = getIsoWeekString(new Date());
  const currentWeekNumber = getIsoWeekNumber(new Date());
  void currentWeekNumber; // used via currentWeek string

  // ─── Automations page state (not extracted into a hook yet) ───
  const [processingAutomationQueue, setProcessingAutomationQueue] = useState(false);
  const [acknowledgingAutomationFailures, setAcknowledgingAutomationFailures] = useState(false);

  // ─── FTUE Welcome Modal state ───
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

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

  // ─── Session expiry redirect ───
  useEffect(() => {
    if (session || loading) return;
    router.replace("/staff/login?next=/staff");
  }, [session, loading, router]);

  useCursorTrail(cursorRef, ringRef, { cursorOffset: 4, ringOffset: 15, easing: 0.1 });
  const animateProgress = useDelayedFlag(activePage, 200);

  // ─── Derived workspace values ───
  const projects = useMemo(() => snapshot.projects ?? [], [snapshot.projects]);
  const clients = useMemo(() => snapshot.clients ?? [], [snapshot.clients]);

  // ─── Timesheet: does current week have any DRAFT entries? ───
  const weekAlreadySubmitted = useMemo(() => {
    const entries = timeEntries ?? [];
    const thisWeekEntries = entries.filter((e) => e.submittedWeek === currentWeek);
    if (thisWeekEntries.length === 0) return false;
    return thisWeekEntries.every((e) => e.status !== "DRAFT" && e.status !== undefined);
  }, [timeEntries, currentWeek]);

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

  useEffect(() => {
    if (activePage !== "tasks") setFilterProjectId(undefined);
  }, [activePage]);

  useEffect(() => {
    if (!localStorage.getItem("staff_ftue_v1_seen")) {
      setShowWelcomeModal(true);
    }
  }, []);

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
    handleCreateTask,
    handleAddTaskExternalLink,
    handleRemoveTaskExternalLink,
    handleCreateExternalTask,
    creatingExternalTaskId
  } = useStaffTasks({
    session,
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
    sendingMessage,
    lastSendFailed,
    lastSendError,
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
    queueCounts,
    visibleThreadItems,
    conversationByProjectId,
    selectedConversation,
    selectedThread,
    openConversations,
    handleClientClick,
    handleSendMessage,
    handleRetrySendMessage,
    handleCreateThread,
    handleAddNote,
    handleEscalate,
    handleEscalationAcknowledge,
    handleEscalationResolve,
    handleEscalationReopen,
    handleEscalationAssignToMe,
    handleAssignConversationToMe,
    handleUnassignConversation,
    handleCreateTaskFromThread,
    handlePrefillFollowUpNote,
    handleScheduleCallback,
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

  // ─── Integrations ops queue (roadmap: staff lifecycle controls) ───
  const [integrationQueue, setIntegrationQueue] = useState<AdminIntegrationRequestItem[]>([]);
  const [integrationQueueBusyId, setIntegrationQueueBusyId] = useState<string | null>(null);
  const [taskSyncEventsByTaskId, setTaskSyncEventsByTaskId] = useState<Record<string, AdminTaskIntegrationSyncEvent[]>>({});
  const [taskSyncEventsLoadingId, setTaskSyncEventsLoadingId] = useState<string | null>(null);

  const refreshIntegrationQueue = useCallback(async () => {
    if (!session) return;
    const result = await loadAdminIntegrationRequestsWithRefresh(session);
    if (result.nextSession) saveSession(result.nextSession);
    if (result.error) {
      setFeedback({ tone: "error", message: result.error.message ?? "Unable to load integration request queue." });
      return;
    }
    setIntegrationQueue((result.data ?? []).filter((item) => item.status === "REQUESTED" || item.status === "IN_PROGRESS"));
  }, [session, setFeedback]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void loadAdminIntegrationRequestsWithRefresh(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      setIntegrationQueue((result.data ?? []).filter((item) => item.status === "REQUESTED" || item.status === "IN_PROGRESS"));
    });
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  const handleIntegrationQueueAction = useCallback(async (
    requestId: string,
    action: "claim" | "start" | "complete"
  ) => {
    if (!session || integrationQueueBusyId) return;
    const me = session.user.id;
    const payload =
      action === "claim"
        ? { assignedToUserId: me, status: "IN_PROGRESS" as const }
        : action === "start"
          ? { status: "IN_PROGRESS" as const, assignedToUserId: me }
          : { status: "COMPLETED" as const, assignedToUserId: me };
    setIntegrationQueueBusyId(requestId);
    try {
      const result = await updateAdminIntegrationRequestWithRefresh(session, requestId, payload);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setFeedback({ tone: "error", message: result.error.message ?? "Unable to update integration request." });
        return;
      }
      await refreshIntegrationQueue();
      setFeedback({
        tone: "success",
        message: action === "complete" ? "Integration request marked completed." : "Integration request updated."
      });
    } finally {
      setIntegrationQueueBusyId(null);
    }
  }, [integrationQueueBusyId, refreshIntegrationQueue, session, setFeedback]);

  const integrationProvidersByClientId = useMemo<Record<string, string[]>>(() => {
    const byClient = new Map<string, Set<string>>();
    integrationQueue.forEach((item) => {
      if (item.status !== "COMPLETED") return;
      const current = byClient.get(item.clientId) ?? new Set<string>();
      current.add(item.providerKey.toLowerCase());
      byClient.set(item.clientId, current);
    });
    const output: Record<string, string[]> = {};
    byClient.forEach((providers, clientId) => {
      output[clientId] = Array.from(providers.values()).sort();
    });
    return output;
  }, [integrationQueue]);

  const handleLoadTaskIntegrationSyncEvents = useCallback(async (taskId: string) => {
    if (!session || !taskId) return;
    setTaskSyncEventsLoadingId(taskId);
    try {
      const result = await loadAdminTaskIntegrationSyncEventsWithRefresh(session, taskId);
      if (result.nextSession) saveSession(result.nextSession);
      if (result.error) {
        setFeedback({ tone: "error", message: result.error.message ?? "Unable to load integration sync events." });
        return;
      }
      setTaskSyncEventsByTaskId((prev) => ({ ...prev, [taskId]: result.data ?? [] }));
    } finally {
      setTaskSyncEventsLoadingId((current) => (current === taskId ? null : current));
    }
  }, [session, setFeedback]);
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

  const handleSubmitWeek = useCallback(async () => {
    if (!session || submittingWeek) return;
    setSubmittingWeek(true);
    try {
      const result = await submitWeekTimesheetWithRefresh(session, currentWeek);
      if (!result.data && !result.error) { setSubmittingWeek(false); return; }
      if (result.error) {
        setFeedback({ tone: "error", message: result.error.message ?? "Unable to submit timesheet." });
      } else {
        const count = result.data?.count ?? 0;
        setFeedback({ tone: "success", message: count > 0 ? `Week ${currentWeek} submitted — ${count} entr${count === 1 ? "y" : "ies"} sent for approval.` : "No DRAFT entries to submit for this week." });
      }
    } finally {
      setSubmittingWeek(false);
    }
  }, [session, submittingWeek, currentWeek, setFeedback]);

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

  const handleAutoEscalateKanbanBlocked = useCallback(async () => {
    if (!session) return;
    const actionable = projectBlockers.filter((blocker) => blocker.status !== "RESOLVED");
    if (actionable.length === 0) {
      setFeedback({ tone: "success", message: "No active blockers to escalate." });
      return;
    }
    const fallbackEta = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const updates = await Promise.all(
      actionable.map(async (blocker) => {
        const result = await updateProjectBlockerWithRefresh(session, blocker.id, {
          severity: "CRITICAL",
          status: blocker.status === "OPEN" ? "IN_PROGRESS" : blocker.status,
          ownerRole: "STAFF",
          ownerName: blocker.ownerName ?? staffName,
          etaAt: blocker.etaAt ?? fallbackEta
        });
        if (result.nextSession) saveSession(result.nextSession);
        return result;
      })
    );
    const failed = updates.filter((result) => !!result.error).length;
    const succeeded = updates.length - failed;
    await refreshWorkspace(session, { background: true });
    setFeedback({
      tone: failed > 0 ? "warning" : "success",
      message:
        failed > 0
          ? `Escalated ${succeeded}/${updates.length} blockers. ${failed} update${failed === 1 ? "" : "s"} failed.`
          : `Escalated ${succeeded} blocker${succeeded === 1 ? "" : "s"} to CRITICAL with 24h ETA.`
    });
  }, [projectBlockers, refreshWorkspace, session, setFeedback, staffName]);

  function handleWelcomeModalDismiss() {
    setShowWelcomeModal(false);
    localStorage.setItem("staff_ftue_v1_seen", "true");
  }

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
        if (hit.type === "project" || hit.type === "task" || hit.type === "deliverable") setActivePage("context");
        else if (hit.type === "client")  setActivePage("clients");
        else if (hit.type === "lead")    setActivePage("dashboard");
        else if (hit.type === "ticket")  setActivePage("comms");
        else if (hit.type === "article") setActivePage("knowledge" as Parameters<typeof setActivePage>[0]);
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
    <div className={cx("staffRoot")}>
      <div className={styles.cursor} ref={cursorRef} />
      <div className={styles.cursorRing} ref={ringRef} />

      <div className={cx("shell")}>
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
          onNavigateSettings={() => { setActivePage("settings"); setSidebarOpen(false); }}
          onNavigateProfile={() => { setActivePage("myemployment"); setSidebarOpen(false); }}
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

        <div className={cx("body")}>
          <StaffSidebar
            navSections={navSections}
            allPagesSections={allNavSections}
            activePage={activePage}
            onNavigate={(p) => { setActivePage(p); setSidebarOpen(false); }}
            staffInitials={staffInitials}
            staffName={staffName}
            staffRole={staffRole}
            mobileOpen={sidebarOpen}
            onMobileClose={() => setSidebarOpen(false)}
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

          <main className={cx("main")}>
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
              integrationQueue={integrationQueue}
              integrationQueueBusyId={integrationQueueBusyId}
              onIntegrationQueueAction={handleIntegrationQueueAction}
            />

            <NotificationsPage isActive={activePage === "notifications"} session={session ?? null} onNavigate={setActivePage} />

            <TasksPage
              isActive={activePage === "tasks"}
              openTasksCount={openTasks.length}
              projectsCount={projects.length}
              taskCounts={taskCounts}
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
              onAddTaskExternalLink={handleAddTaskExternalLink}
              onRemoveTaskExternalLink={handleRemoveTaskExternalLink}
              onCreateExternalTask={handleCreateExternalTask}
              creatingExternalTaskId={creatingExternalTaskId}
              taskSyncEventsByTaskId={taskSyncEventsByTaskId}
              taskSyncEventsLoadingId={taskSyncEventsLoadingId}
              onLoadTaskIntegrationSyncEvents={handleLoadTaskIntegrationSyncEvents}
              onOpenTaskThread={handleOpenTaskThread}
              hasProjectThread={(projectId) => conversationByProjectId.has(projectId)}
              initialProjectFilter={filterProjectId}
              integrationOpenRequestsCount={integrationQueue.length}
              integrationProvidersByClientId={integrationProvidersByClientId}
              onNavigate={setActivePage}
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
              integrationProvidersByClientId={integrationProvidersByClientId}
              onCreateExternalTask={handleCreateExternalTask}
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
              onAutoEscalateBlocked={handleAutoEscalateKanbanBlocked}
              integrationOpenRequestsCount={integrationQueue.length}
              onOpenIntegrationQueue={() => setActivePage("myintegrations")}
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
              sendingMessage={sendingMessage}
              lastSendFailed={lastSendFailed}
              lastSendError={lastSendError}
              noteText={noteText}
              escalationReason={escalationReason}
              escalationSeverity={escalationSeverity}
              onComposeMessageChange={setComposeMessage}
              onNoteTextChange={setNoteText}
              onEscalationReasonChange={setEscalationReason}
              onEscalationSeverityChange={setEscalationSeverity}
              onSendMessage={handleSendMessage}
              onRetrySendMessage={handleRetrySendMessage}
              onAddNote={handleAddNote}
              onEscalate={handleEscalate}
              onEscalationAcknowledge={handleEscalationAcknowledge}
              onEscalationResolve={handleEscalationResolve}
              onEscalationReopen={handleEscalationReopen}
              onEscalationAssignToMe={handleEscalationAssignToMe}
              onClientClick={handleClientClick}
              onOpenThreadTask={handleOpenConversationTaskContext}
              onOpenThreadFiles={handleOpenConversationFiles}
              onCreateTaskFromThread={handleCreateTaskFromThread}
              onPrefillFollowUpNote={handlePrefillFollowUpNote}
              onScheduleCallback={handleScheduleCallback}
              onComposeSubmitShortcut={() => void handleSendMessage()}
              staffInitials={staffInitials}
              viewerUserId={session?.user.id ?? null}
              onAssignToMe={() => void handleAssignConversationToMe()}
              onUnassign={() => void handleUnassignConversation()}
              queueCounts={queueCounts}
            />

            <AutoDraftUpdatesPage isActive={activePage === "autodraft"} session={session ?? null} />

            <MeetingPrepPage isActive={activePage === "meetingprep"} session={session ?? null} onNotify={(tone, msg) => setFeedback({ tone, message: msg })} />

            <CommunicationHistoryPage isActive={activePage === "comms"} session={session ?? null} />

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

            <MilestoneSignOffPage isActive={activePage === "signoff"} session={session ?? null} onNotify={(tone, msg) => setFeedback({ tone, message: msg })} />

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

            <MyLeavePage isActive={activePage === "myleave"} session={session} onNotify={(tone, msg) => setFeedback({ tone, message: msg })} />

            <AppointmentsPage isActive={activePage === "appointments"} session={session ?? null} />

            <MyLearningPage isActive={activePage === "mylearning"} session={session} />

            <MyEnpsPage isActive={activePage === "myenps"} session={session ?? null} onNotify={(tone, msg) => setFeedback({ tone, message: msg })} />

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

            <MyIntegrationsPage
              isActive={activePage === "myintegrations"}
              session={session ?? null}
              onNotify={(tone, msg) => setFeedback({ tone, message: msg })}
            />

            <ChangeRequestsPage isActive={activePage === "changeRequests"} session={session ?? null} />

            <SlaTrackerPage isActive={activePage === "slaTracker"} session={session ?? null} />

            <WorkloadHeatmapPage isActive={activePage === "workloadheatmap"} session={session ?? null} />

            <MyGoalsPage isActive={activePage === "mygoals"} session={session ?? null} />

            <PeerReviewPage isActive={activePage === "peerreview"} session={session ?? null} />

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
              currentWeek={currentWeek}
              weekAlreadySubmitted={weekAlreadySubmitted}
              submittingWeek={submittingWeek}
              onSubmitWeek={handleSubmitWeek}
            />

            <AutomationsPage
              isActive={activePage === "automations"}
              session={session ?? null}
              onOpenDeliverables={() => setActivePage("deliverables")}
              onOpenClients={() => setActivePage("clients")}
            />

            <SettingsPage
              isActive={activePage === "settings"}
              session={session ?? null}
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
          </main>
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
            {/* Header — icon + input + esc hint */}
            <div className={styles.cmdHeader}>
              <span className={styles.cmdSearchIcon} aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="6.5" cy="6.5" r="4.5"/>
                  <path d="M10.5 10.5l2.5 2.5" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                className={styles.cmdInput}
                type="text"
                placeholder="Search pages, projects, threads…"
                value={commandSearch.query}
                onChange={(e) => commandSearch.setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") commandSearch.close();
                  if (e.key === "Enter") commandSearch.executeActive();
                  if (e.key === "ArrowUp") { e.preventDefault(); commandSearch.moveUp(); }
                  if (e.key === "ArrowDown") { e.preventDefault(); commandSearch.moveDown(); }
                }}
                autoFocus
              />
              <button type="button" className={styles.cmdEscHint} onClick={commandSearch.close} aria-label="Close">esc</button>
            </div>

            {/* Results list */}
            <div className={styles.cmdResults}>
              {/* Recent searches — shown when no query and history exists */}
              {!commandSearch.query && commandSearch.history.length > 0 && (
                <div>
                  <div className={cx("cmdSectionLabel", "flexRow")}>
                    <span>Recent searches</span>
                    <button
                      type="button"
                      className={cx("cmdClear")}
                      onClick={commandSearch.clearHistory}
                    >
                      Clear
                    </button>
                  </div>
                  <div className={styles.cmdHistoryChips}>
                    {commandSearch.history.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className={cx("cmdHistoryChip")}
                        onClick={() => commandSearch.selectHistory(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {commandSearch.results.length > 0 ? (
                <>
                  <div className={styles.cmdSectionLabel}>Results</div>
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
                      <span
                        className={styles.cmdTypeIcon}
                        style={{ "--cmd-ic-bg": STAFF_CMD_TYPE_BG[result.type] ?? "var(--s2)" } as React.CSSProperties}
                      >
                        <Ic
                          n={STAFF_CMD_TYPE_ICON[result.type] ?? "file"}
                          sz={13}
                          c={STAFF_CMD_TYPE_COLOR[result.type] ?? "var(--muted2)"}
                        />
                      </span>
                      <span className={styles.cmdItemLabel}>{result.label}</span>
                      {result.meta ? (
                        <span className={styles.cmdItemMeta}>{result.meta}</span>
                      ) : null}
                    </button>
                  ))}
                </>
              ) : commandSearch.query ? (
                <div className={styles.cmdEmpty}>
                  <span className={styles.cmdEmptyIcon} aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="7"/><path d="M16.5 16.5l4 4" strokeLinecap="round"/>
                      <path d="M8 11h6M11 8v6" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <span className={styles.cmdEmptyText}>No results for &ldquo;{commandSearch.query}&rdquo;</span>
                  <span className={styles.cmdEmptySub}>Try a different search term</span>
                </div>
              ) : (
                <div className={styles.cmdEmpty}>
                  <span className={styles.cmdEmptyIcon} aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="7"/><path d="M16.5 16.5l4 4" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <span className={styles.cmdEmptyText}>Jump anywhere</span>
                  <span className={styles.cmdEmptySub}>Type to search pages, projects, or threads</span>
                </div>
              )}
            </div>

            {/* Footer — keyboard hints */}
            <div className={styles.cmdFooter}>
              <span className={styles.cmdFooterHint}>
                <kbd className={styles.cmdKbd}>↑</kbd>
                <kbd className={styles.cmdKbd}>↓</kbd>
                navigate
              </span>
              <span className={styles.cmdFooterDot} />
              <span className={styles.cmdFooterHint}>
                <kbd className={styles.cmdKbd}>↵</kbd>
                open
              </span>
              <span className={styles.cmdFooterDot} />
              <span className={styles.cmdFooterHint}>
                <kbd className={styles.cmdKbd}>esc</kbd>
                close
              </span>
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

      {/* ── FTUE Welcome Modal ──────────────────────────────────────────── */}
      {showWelcomeModal && (
        <FtueWelcomeModal onDismiss={handleWelcomeModalDismiss} />
      )}

      {/* ── Toast stack ─────────────────────────────────────────────────── */}
      <DashboardToastStack toasts={toasts} />
    </div>
  );
}
