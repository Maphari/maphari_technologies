"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { DM_Mono, Instrument_Serif, Syne } from "next/font/google";
import {
  createPortalConversationWithRefresh,
  createPortalChangeRequestWithRefresh,
  createPortalInvoiceWithRefresh,
  createPortalPaymentWithRefresh,
  createPortalProjectRequestWithRefresh,
  generatePortalHandoffSummaryWithRefresh,
  updatePortalChangeRequestWithRefresh,
  updatePortalMessageDeliveryWithRefresh,
  updatePortalMilestoneApprovalWithRefresh,
  type PortalProjectRequestBuildMode,
  type PortalProjectRequestComplexity,
  type PortalProjectRequestDesignPackage,
  type PortalProjectRequestAddonOption,
  type PortalProjectRequestServiceOption,
  type PortalProjectRequestServiceType
} from "../../lib/api/portal";
import { usePortalWorkspace } from "../../lib/auth/use-portal-workspace";
import { useRealtimeRefresh } from "../../lib/auth/use-realtime-refresh";
import { useTheme } from "./maphari-dashboard/hooks/use-theme";
import { useDelayedFlag } from "../shared/use-delayed-flag";
import { useCurrencyConverter } from "../../lib/i18n/exchange-rates";
import { pageTitles } from "./maphari-dashboard/constants";
import { cx, styles } from "./maphari-dashboard/style";
import { ClientSidebar } from "./maphari-dashboard/sidebar";
import { ClientTopbar } from "./maphari-dashboard/topbar";
import { ClientDashboardPage } from "./maphari-dashboard/pages/dashboard-page";
import { ClientAutomationPage } from "./maphari-dashboard/pages/automation-page";
import { ClientInvoicesPage } from "./maphari-dashboard/pages/invoices-page";
import { ClientMessagesPage } from "./maphari-dashboard/pages/messages-page";
import { ClientProjectsPage } from "./maphari-dashboard/pages/projects-page";
import { ClientMilestonesPage } from "./maphari-dashboard/pages/milestones-page";
import { ClientReportsPage } from "./maphari-dashboard/pages/reports-page";
import { ClientAiAutomationPage } from "./maphari-dashboard/pages/ai-automation-page";
import { ClientOnboardingPage } from "./maphari-dashboard/pages/onboarding-page";
import { ClientSettingsPage } from "./maphari-dashboard/pages/settings-page";
import { ClientCreateProjectPage } from "./maphari-dashboard/pages/create-project-page";
import { ClientDocumentsPage } from "./maphari-dashboard/pages/documents-page";
import onboardingTourStyles from "../../app/style/components/onboarding-tour.module.css";
import type { NavItem, PageId } from "./maphari-dashboard/types";
import type { TeamMember, SupportTicket } from "./maphari-dashboard/pages/types";
import { formatDateLong, formatMoney, formatStatus, getInitials } from "./maphari-dashboard/utils";
import { useDashboardToasts, DashboardToastStack } from "../shared/dashboard-core";
import { DashboardProvider } from "./maphari-dashboard/context/dashboard-context";
import { usePortalData } from "./maphari-dashboard/hooks/use-portal-data";
import { useNotifications } from "./maphari-dashboard/hooks/use-notifications";
import { useCommandSearch, type CommandResult } from "./maphari-dashboard/hooks/use-command-search";
import { useQuickCompose } from "./maphari-dashboard/hooks/use-quick-compose";
import { useClientTour } from "./maphari-dashboard/hooks/use-client-tour";
import { useSettings } from "./maphari-dashboard/hooks/use-settings";
import { useDashboardViews } from "./maphari-dashboard/hooks/use-dashboard-views";
import { ClientNotificationsPage } from "./maphari-dashboard/pages/notifications-page";
import { ClientSupportPage } from "./maphari-dashboard/pages/support-page";
import { ClientReviewsPage } from "./maphari-dashboard/pages/reviews-page";
import { ClientAnalyticsPage } from "./maphari-dashboard/pages/analytics-page";
import { ClientPaymentsPage } from "./maphari-dashboard/pages/payments-page";
import { ClientContractsPage } from "./maphari-dashboard/pages/contracts-page";
import { ClientCalendarPage } from "./maphari-dashboard/pages/calendar-page";
import { ClientBrandPage } from "./maphari-dashboard/pages/brand-page";
import { ClientFeedbackPage } from "./maphari-dashboard/pages/feedback-page";
import { ClientExportsPage } from "./maphari-dashboard/pages/exports-page";
import { ClientResourcesPage } from "./maphari-dashboard/pages/resources-page";
import { ClientReferralsPage } from "./maphari-dashboard/pages/referrals-page";
import { ClientIntegrationsPage } from "./maphari-dashboard/pages/integrations-page";
import { useKeyboardShortcuts, SHORTCUTS } from "./maphari-dashboard/hooks/use-keyboard-shortcuts";
import { useSessionTimeout } from "./maphari-dashboard/hooks/use-session-timeout";
import type { DashboardNotificationJobLite } from "../../lib/types/dashboard";

type TopbarDateRange = "7d" | "30d" | "90d" | "all";

type ClientProjectEstimate = {
  totalCents: number;
  deposit50Cents: number;
  milestone30Cents: number;
  handoff20Cents: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  lineItems: Array<{ label: string; amountCents: number }>;
  assumptions: string[];
};

const SERVICE_TO_LEGACY_TYPE: Record<PortalProjectRequestServiceOption, PortalProjectRequestServiceType> = {
  WEB_DEVELOPMENT: "WEBSITE",
  WORDPRESS_DEVELOPMENT: "WEBSITE",
  CUSTOM_WEB_APP_DEVELOPMENT: "WEBSITE",
  ECOMMERCE_DEVELOPMENT: "WEBSITE",
  CMS_IMPLEMENTATION: "WEBSITE",
  UI_UX_DESIGN: "UI_UX_DESIGN",
  UX_RESEARCH_TESTING: "UI_UX_DESIGN",
  WIREFRAMING_PROTOTYPING: "UI_UX_DESIGN",
  BRANDING_VISUAL_IDENTITY: "UI_UX_DESIGN",
  MOBILE_APP_IOS: "MOBILE_APP",
  MOBILE_APP_ANDROID: "MOBILE_APP",
  MOBILE_APP_CROSS_PLATFORM: "MOBILE_APP",
  API_DEVELOPMENT: "OTHER",
  THIRD_PARTY_INTEGRATIONS: "AUTOMATION",
  AUTOMATION_WORKFLOWS: "AUTOMATION",
  RPA_LEGACY_AUTOMATION: "AUTOMATION",
  AI_LLM_AUTOMATIONS: "AUTOMATION",
  QA_TESTING: "OTHER",
  SECURITY_COMPLIANCE: "OTHER",
  DEVOPS_CI_CD_CLOUD: "OTHER",
  ANALYTICS_TRACKING: "OTHER",
  SEO_TECHNICAL: "OTHER",
  CONTENT_MIGRATION: "OTHER",
  MAINTENANCE_SUPPORT: "OTHER",
  DEDICATED_TEAM: "OTHER",
  DISCOVERY_CONSULTING: "AUTO_RECOMMEND"
};

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne"
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-dm-mono"
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument"
});


export function MaphariClientDashboard() {
  /* ── navigation & interaction state (stays in orchestrator) ── */
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [topbarProjectId, setTopbarProjectId] = useState<string | null>(null);
  const [topbarDateRange, setTopbarDateRange] = useState<TopbarDateRange>("30d");
  const [activeInvoiceTab, setActiveInvoiceTab] = useState<"all" | "outstanding" | "paid">("all");
  const [changeRequestForm, setChangeRequestForm] = useState({
    projectId: "",
    title: "",
    description: "",
    reason: "",
    impactSummary: ""
  });
  const [submittingChangeRequest, setSubmittingChangeRequest] = useState(false);
  const { toasts, setFeedback } = useDashboardToasts({ dismissMs: 4200 });
  const [projectRequestForm, setProjectRequestForm] = useState({
    name: "",
    description: "",
    serviceType: "AUTO_RECOMMEND" as PortalProjectRequestServiceType,
    selectedServices: ["WEB_DEVELOPMENT"] as PortalProjectRequestServiceOption[],
    addonServices: [] as PortalProjectRequestAddonOption[],
    buildMode: "AUTO" as PortalProjectRequestBuildMode,
    complexity: "STANDARD" as PortalProjectRequestComplexity,
    designPackage: "NONE" as PortalProjectRequestDesignPackage,
    websitePageCount: "5",
    appScreenCount: "6",
    integrationsCount: "1",
    targetPlatforms: ["WEB"] as Array<"WEB" | "IOS" | "ANDROID">,
    requiresContentSupport: true,
    requiresDomainAndHosting: true,
    scopePrompt: "",
    desiredStartAt: "",
    desiredDueAt: "",
    estimatedBudgetCents: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
    agreementFileId: ""
  });
  const [projectRequestEstimate, setProjectRequestEstimate] = useState<ClientProjectEstimate | null>(null);
  const [projectEstimateModalOpen, setProjectEstimateModalOpen] = useState(false);
  const [projectRequestPhase, setProjectRequestPhase] = useState<"idle" | "creating_deposit" | "submitting_request">("idle");
  const [submittingProjectRequest, setSubmittingProjectRequest] = useState(false);
  const [composeMessage, setComposeMessage] = useState("");
  const [threadSearch, setThreadSearch] = useState("");
  const [newThreadSubject, setNewThreadSubject] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

  /* ── theme ── */
  const { resolvedTheme, toggleTheme } = useTheme();

  /* ── workspace ── */
  const {
    session,
    snapshot,
    selectedConversationId,
    conversationMessages,
    messagesLoading,
    selectConversation,
    uploadFile,
    uploadState,
    sendMessage,
    refreshSnapshot
  } = usePortalWorkspace();

  const animateProgress = useDelayedFlag(activePage, 200);

  /* ── resolved IDs ── */
  const projects = useMemo(() => snapshot.projects ?? [], [snapshot.projects]);
  const resolvedSelectedProjectId = selectedProjectId && projects.some((p) => p.id === selectedProjectId) ? selectedProjectId : null;
  const resolvedTopbarProjectId = topbarProjectId && projects.some((p) => p.id === topbarProjectId) ? topbarProjectId : null;
  const projectScopeId = resolvedTopbarProjectId ?? resolvedSelectedProjectId;

  /* ── portal data hook ── */
  const portalData = usePortalData({
    session,
    snapshot,
    topbarDateRange,
    projectScopeId
  });

  const {
    invoices,
    conversations,
    sortedProjects,
    projectScopedConversations,
    projectScopedProjects,
    dateScopedInvoices,
    scopedOutstandingInvoices,
    overdueInvoices,
    scopedProjectDetails,
    scopedBlockers,
    scopedChangeRequests,
    milestoneApprovals,
    setMilestoneApprovals,
    changeRequests: _changeRequests,
    setChangeRequests,
    handoffSummary,
    setHandoffSummary,
    handleRealtimeRefresh
  } = portalData;

  useRealtimeRefresh(session, handleRealtimeRefresh);

  /* ── currency ── */
  const displayCurrency = portalData.invoices[0]?.currency || "AUTO";
  const { convert: convertMoney } = useCurrencyConverter(displayCurrency);

  /* ── notifications hook ── */
  const notifications = useNotifications({ session, activePage });
  const {
    notificationJobs,
    notificationsTrayOpen,
    setNotificationsTrayOpen,
    unreadByTab,
    totalUnreadNotifications,
    toPageFromNotificationTab,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead
  } = notifications;

  /* ── derived identity values ── */
  const userEmail = session?.user.email ?? "client@maphari.co.za";
  const userGreetingName = session?.user.email ? session.user.email.split("@")[0] : "there";
  const userInitials = getInitials(userGreetingName);
  const clientBadge = session?.user.clientId ? `Client ${session.user.clientId.slice(0, 6).toUpperCase()}` : "Client";
  const defaultProjectName = sortedProjects[0]?.name ?? "Unassigned";
  const activeProjectId = resolvedSelectedProjectId ? resolvedSelectedProjectId : sortedProjects[0]?.id ?? null;
  const activeProjectName = projects.find((p) => p.id === activeProjectId)?.name ?? "No active project";

  /* ── team members (derived from project collaboration data) ── */
  const teamMembers: TeamMember[] = useMemo(() => {
    const AVATAR_COLORS = ["#a78bfa", "#34d98b", "#f5a623", "#60a5fa", "#c8f135", "#ff5f5f", "#38bdf8", "#fb923c"];
    const seen = new Map<string, TeamMember>();
    Object.entries(portalData.projectCollaborationById).forEach(([projectId, collab]) => {
      collab.contributors.forEach((contributor, idx) => {
        const key = contributor.name.toLowerCase();
        if (!seen.has(key)) {
          const colorIndex = seen.size % AVATAR_COLORS.length;
          const parts = contributor.name.trim().split(" ");
          const initials = parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : contributor.name.slice(0, 2).toUpperCase();
          const specialty = contributor.role === "ADMIN" ? ["Product Strategy", "Quality Assurance"]
            : contributor.role === "STAFF" ? ["Development", "Delivery"]
            : ["Design", "Review"];
          seen.set(key, {
            id: `tm-${idx}-${key.replace(/\s/g, "-")}`,
            name: contributor.name,
            initials,
            avatarBg: AVATAR_COLORS[colorIndex],
            role: contributor.role,
            specialties: specialty,
            projectIds: [projectId]
          });
        } else {
          const existing = seen.get(key)!;
          if (!existing.projectIds.includes(projectId)) {
            existing.projectIds.push(projectId);
          }
        }
      });
    });
    return Array.from(seen.values());
  }, [portalData.projectCollaborationById]);

  /* ── open support tickets (derived from project blockers) ── */
  const openTickets: SupportTicket[] = useMemo(() => {
    return portalData.scopedBlockers
      .filter((b) => b.status !== "RESOLVED")
      .map((b) => ({
        id: b.id,
        subject: b.title,
        status: b.status === "IN_PROGRESS" ? "in_progress" : "open",
        priority: b.severity === "CRITICAL" || b.severity === "HIGH" ? "high"
          : b.severity === "MEDIUM" ? "medium" : "low",
        createdAt: b.updatedAt
      }));
  }, [portalData.scopedBlockers]);

  /* ── first views pass (empty search) — feeds commandSearch data ── */
  const views = useDashboardViews({
    sortedScopedProjects: portalData.sortedScopedProjects,
    projectScopedProjects,
    projectScopedConversations,
    scopedProjectDetails,
    effectiveProjectDetails: portalData.effectiveProjectDetails,
    effectiveMessagePreviewMap: portalData.effectiveMessagePreviewMap,
    projectCollaborationById: portalData.projectCollaborationById,
    milestoneApprovals,
    dateScopedInvoices,
    scopedOutstandingInvoices,
    overdueInvoices,
    outstandingInvoices: portalData.outstandingInvoices,
    scopedBlockers,
    scopedTimelineEvents: portalData.scopedTimelineEvents,
    scopedChangeRequests,
    allMilestones: portalData.allMilestones,
    scopedMilestones: portalData.scopedMilestones,
    projects: portalData.projects,
    snapshot,
    fileById: portalData.fileById,
    nowTs: portalData.nowTs,
    lastLoginAt: portalData.lastLoginAt,
    searchQuery: "", // placeholder, see below
    threadSearch,
    displayCurrency,
    convertMoney,
    activeInvoiceTab,
    projectScopeId,
    openThreads: portalData.openThreads,
    unreadByTab,
    defaultProjectName
  });

  /* ── command search hook ── */
  const commandSearch = useCommandSearch({
    projectScopedProjects: projectScopedProjects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      description: p.description
    })),
    allMessageThreads: views.allMessageThreads,
    dateScopedInvoices: dateScopedInvoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amountCents: inv.amountCents,
      currency: inv.currency
    })),
    milestoneRows: views.milestoneRows,
    allMilestones: portalData.allMilestones.map((e) => ({
      milestone: { id: e.milestone.id },
      projectId: e.projectId
    })),
    notificationJobs: notificationJobs.map((j) => ({
      id: j.id,
      status: j.status,
      tab: j.tab,
      readAt: j.readAt
    })),
    convertMoney,
    displayCurrency,
    setActivePage,
    setTopbarProjectId,
    setSelectedProjectId,
    selectConversation,
    handleMarkNotificationRead,
    setNotificationsTrayOpen,
    setQuickComposeOpen: () => {} // will be wired after quick compose hook
  });

  const {
    commandSearchOpen,
    setCommandSearchOpen,
    commandSearchValue,
    setCommandSearchValue,
    topbarSearch,
    commandSearchInputRef,
    commandResults,
    handleCommandResultSelect
  } = commandSearch;

  /* ── quick compose hook ── */
  const quickCompose = useQuickCompose({
    session,
    projects: sortedProjects.map((p) => ({ id: p.id, name: p.name })),
    sendMessage,
    refreshSnapshot,
    selectConversation,
    setActivePage,
    setNotificationsTrayOpen,
    setFeedback
  });

  const {
    quickComposeOpen,
    setQuickComposeOpen,
    quickComposeSubject,
    setQuickComposeSubject,
    quickComposeBody,
    setQuickComposeBody,
    quickComposeProjectId: _quickComposeProjectId,
    setQuickComposeProjectId,
    quickComposeCreating,
    quickComposeSubjectRef,
    resolvedQuickComposeProjectId,
    handleQuickComposeSubmit
  } = quickCompose;

  /* ── client tour hook ── */
  const tour = useClientTour({ session });
  const {
    clientTourOpen,
    clientTourStep,
    clientTourLayout,
    clientTourSteps,
    activeTourStep,
    setClientTourOpen,
    setClientTourStep
  } = tour;

  /* ── settings hook (needs commandSearch.topbarSearch + setTopbarSearch) ── */
  const settings = useSettings({
    session,
    activePage,
    topbarDateRange,
    projectScopeId,
    topbarSearch,
    userEmail,
    userGreetingName,
    clientBadge,
    setActivePage,
    setTopbarSearch: commandSearch.setTopbarSearch,
    setTopbarDateRange,
    setTopbarProjectId,
    setSelectedProjectId,
    setFeedback
  });

  const {
    settingsProfile,
    setSettingsProfile,
    settingsNotifications,
    setSettingsNotifications,
    handleSaveClientProfile,
    handleSaveClientNotifications
  } = settings;

  /* ── final views pass with real search query ── */
  const realSearchQuery = topbarSearch.trim().toLowerCase();
  const viewsFinal = useDashboardViews({
    sortedScopedProjects: portalData.sortedScopedProjects,
    projectScopedProjects,
    projectScopedConversations,
    scopedProjectDetails,
    effectiveProjectDetails: portalData.effectiveProjectDetails,
    effectiveMessagePreviewMap: portalData.effectiveMessagePreviewMap,
    projectCollaborationById: portalData.projectCollaborationById,
    milestoneApprovals,
    dateScopedInvoices,
    scopedOutstandingInvoices,
    overdueInvoices,
    outstandingInvoices: portalData.outstandingInvoices,
    scopedBlockers,
    scopedTimelineEvents: portalData.scopedTimelineEvents,
    scopedChangeRequests,
    allMilestones: portalData.allMilestones,
    scopedMilestones: portalData.scopedMilestones,
    projects: portalData.projects,
    snapshot,
    fileById: portalData.fileById,
    nowTs: portalData.nowTs,
    lastLoginAt: portalData.lastLoginAt,
    searchQuery: realSearchQuery,
    threadSearch,
    displayCurrency,
    convertMoney,
    activeInvoiceTab,
    projectScopeId,
    openThreads: portalData.openThreads,
    unreadByTab,
    defaultProjectName
  });

  /* ── keyboard shortcuts ── */
  const { shortcutsOpen, setShortcutsOpen } = useKeyboardShortcuts({
    onNavigate: setActivePage,
    onOpenSearch: () => setCommandSearchOpen(true),
  });

  /* ── session timeout ── */
  const { showWarning: showTimeoutWarning, remainingSeconds, extendSession, formatTime } = useSessionTimeout();

  /* ── last login tracking ── */
  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `maphari:last-login:${session.user.email}`;
    window.localStorage.getItem(key); // read only; portal data hook reads lastLoginAt
    window.localStorage.setItem(key, new Date().toISOString());
  }, [session?.user?.email]);

  /* ── mark inbound messages read ── */
  useEffect(() => {
    if (!session || !selectedConversationId || conversationMessages.length === 0) return;
    const inbound = conversationMessages
      .filter((message) => (message.authorRole ?? "").toUpperCase() !== "CLIENT")
      .filter((message) => message.deliveryStatus !== "READ")
      .slice(-8);
    if (inbound.length === 0) return;

    void Promise.all(
      inbound.map((message) =>
        updatePortalMessageDeliveryWithRefresh(session, message.id, {
          status: "READ",
          deliveredAt: message.deliveredAt ?? new Date().toISOString(),
          readAt: new Date().toISOString()
        })
      )
    );
  }, [conversationMessages, selectedConversationId, session]);

  /* ── nav items ── */
  const navItems = useMemo<NavItem[]>(
    () => [
      /* ── Command ── */
      { id: "dashboard", label: "Dashboard", section: "Command", badge: unreadByTab.dashboard > 0 ? { value: String(unreadByTab.dashboard) } : undefined },

      /* ── Work ── */
      { id: "projects", label: "Projects", section: "Work", badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects) } : undefined },
      { id: "milestones", label: "Milestones", section: "Work" },
      { id: "docs", label: "Documents", section: "Work" },
      { id: "messages", label: "Messages", section: "Work", badge: unreadByTab.messages > 0 ? { value: String(unreadByTab.messages), tone: "amber" } : undefined },
      { id: "reviews", label: "Reviews", section: "Work" },
      { id: "calendar", label: "Calendar", section: "Work" },
      { id: "brand", label: "Brand Assets", section: "Work" },

      /* ── Finance ── */
      {
        id: "invoices",
        label: "Invoices",
        section: "Finance",
        badge: unreadByTab.invoices > 0
          ? { value: String(unreadByTab.invoices), tone: overdueInvoices.length > 0 ? "red" : "amber" }
          : undefined
      },
      { id: "payments", label: "Payments", section: "Finance" },
      { id: "contracts", label: "Contracts", section: "Finance" },

      /* ── Intelligence ── */
      { id: "reports", label: "Reports", section: "Intelligence" },
      { id: "ai", label: "AI & Automation", section: "Intelligence" },
      { id: "automations", label: "Scheduling", section: "Intelligence", badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "amber" } : undefined },
      { id: "analytics", label: "Analytics", section: "Intelligence" },

      /* ── Account ── */
      { id: "settings", label: "Settings", section: "Account", badge: unreadByTab.settings > 0 ? { value: String(unreadByTab.settings) } : undefined },
      { id: "team", label: "Team", section: "Account" },
      { id: "support", label: "Help & Support", section: "Account" },
      { id: "feedback", label: "Feedback", section: "Account" },
      { id: "exports", label: "Exports", section: "Account" },
      { id: "resources", label: "Resources", section: "Account" },
      { id: "referrals", label: "Referrals", section: "Account" },
      { id: "integrations", label: "Integrations", section: "Account" }
    ],
    [overdueInvoices.length, unreadByTab]
  );

  const navSections = useMemo(() => {
    const sections = new Map<string, NavItem[]>();
    navItems.forEach((item) => {
      if (!sections.has(item.section)) sections.set(item.section, []);
      sections.get(item.section)?.push(item);
    });
    return Array.from(sections.entries());
  }, [navItems]);

  const [topbarEyebrow, topbarTitle] = pageTitles[activePage];

  /* ── selected conversation ── */
  const selectedConversation = useMemo(
    () => projectScopedConversations.find((c) => c.id === selectedConversationId) ?? null,
    [projectScopedConversations, selectedConversationId]
  );
  const selectedProjectName = projectScopedProjects.find((p) => p.id === selectedConversation?.projectId)?.name ?? "General";
  const selectedAgreementFile = snapshot.files.find((f) => f.id === projectRequestForm.agreementFileId) ?? null;

  /* ── lookup maps for navigation handlers ── */
  const milestoneProjectById = useMemo(() => {
    const map = new Map<string, string>();
    portalData.allMilestones.forEach((e) => map.set(e.milestone.id, e.projectId));
    return map;
  }, [portalData.allMilestones]);
  const taskProjectById = useMemo(() => {
    const map = new Map<string, string>();
    scopedProjectDetails.forEach((p) => p.tasks.forEach((t) => map.set(t.id, p.id)));
    return map;
  }, [scopedProjectDetails]);
  const projectActivityById = useMemo(() => {
    const map = new Map<string, string>();
    scopedProjectDetails.forEach((p) => p.activities.forEach((a) => map.set(a.id, p.id)));
    return map;
  }, [scopedProjectDetails]);
  const changeRequestProjectById = useMemo(() => {
    const map = new Map<string, string>();
    scopedChangeRequests.forEach((r) => map.set(r.id, r.projectId));
    return map;
  }, [scopedChangeRequests]);
  const timelineEventById = useMemo(() => {
    const map = new Map<string, { category: "PROJECT" | "LEAD" | "BLOCKER"; projectId: string | null }>();
    portalData.scopedTimelineEvents.forEach((e) => map.set(e.id, { category: e.category, projectId: e.projectId }));
    return map;
  }, [portalData.scopedTimelineEvents]);

  /* ── interaction handlers ── */
  const handleMilestoneApproval = async (milestoneId: string, status: "APPROVED" | "REJECTED") => {
    if (!session) return;
    const result = await updatePortalMilestoneApprovalWithRefresh(session, milestoneId, { status });
    const approval = result.data;
    if (!approval) return;
    setMilestoneApprovals((prev) => ({ ...prev, [milestoneId]: approval }));
  };

  const handleSubmitChangeRequest = async () => {
    const targetProjectId = changeRequestForm.projectId || activeProjectId || sortedProjects[0]?.id;
    if (!session || !targetProjectId || changeRequestForm.title.trim().length < 3) return;
    setSubmittingChangeRequest(true);
    const created = await createPortalChangeRequestWithRefresh(session, {
      projectId: targetProjectId,
      title: changeRequestForm.title.trim(),
      description: changeRequestForm.description.trim() || undefined,
      reason: changeRequestForm.reason.trim() || undefined,
      impactSummary: changeRequestForm.impactSummary.trim() || undefined
    });
    if (created.data) {
      setChangeRequests((prev) => [created.data!, ...prev]);
      setChangeRequestForm((prev) => ({ ...prev, title: "", description: "", reason: "", impactSummary: "" }));
      setFeedback({ tone: "success", message: "Change request submitted successfully." });
    } else {
      setFeedback({ tone: "error", message: created.error?.message ?? "Unable to submit change request." });
    }
    setSubmittingChangeRequest(false);
  };

  const handleClientChangeRequestDecision = async (
    changeRequestId: string,
    status: "CLIENT_APPROVED" | "CLIENT_REJECTED",
    metadata?: { addendumFileId?: string; additionalPaymentInvoiceId?: string; additionalPaymentId?: string }
  ) => {
    if (!session) return;
    const updated = await updatePortalChangeRequestWithRefresh(session, changeRequestId, {
      status,
      clientDecisionNote: status === "CLIENT_APPROVED" ? "Approved by client in portal." : "Rejected by client in portal.",
      addendumFileId: metadata?.addendumFileId,
      additionalPaymentInvoiceId: metadata?.additionalPaymentInvoiceId,
      additionalPaymentId: metadata?.additionalPaymentId
    });
    if (!updated.data) {
      setFeedback({ tone: "error", message: updated.error?.message ?? "Unable to update change request." });
      return;
    }
    setChangeRequests((prev) => prev.map((item) => (item.id === changeRequestId ? updated.data! : item)));
    setFeedback({
      tone: "success",
      message: status === "CLIENT_APPROVED" ? "Change request accepted." : "Change request rejected."
    });
  };

  const buildProjectEstimate = useCallback((form: typeof projectRequestForm): ClientProjectEstimate => {
    const safeInt = (value: string, fallback: number) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
    };
    const pageCount = safeInt(form.websitePageCount, 5);
    const screenCount = safeInt(form.appScreenCount, 6);
    const integrationCount = safeInt(form.integrationsCount, 1);
    const budgetHint = (() => {
      const parsed = Number(form.estimatedBudgetCents.trim());
      return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
    })();

    const lineItems: Array<{ label: string; amountCents: number }> = [];
    const serviceSet = new Set(form.selectedServices);
    if (serviceSet.size === 0) {
      const fallback = form.serviceType === "AUTO_RECOMMEND" ? "DISCOVERY_CONSULTING" : "WEB_DEVELOPMENT";
      serviceSet.add(fallback as PortalProjectRequestServiceOption);
    }
    serviceSet.forEach((service) => {
      if (service === "WEB_DEVELOPMENT") lineItems.push({ label: "Web development base", amountCents: 320_000 });
      if (service === "WORDPRESS_DEVELOPMENT") lineItems.push({ label: "WordPress build base", amountCents: 240_000 });
      if (service === "CUSTOM_WEB_APP_DEVELOPMENT") lineItems.push({ label: "Custom web app base", amountCents: 620_000 });
      if (service === "ECOMMERCE_DEVELOPMENT") lineItems.push({ label: "E-commerce base", amountCents: 540_000 });
      if (service === "CMS_IMPLEMENTATION") lineItems.push({ label: "CMS implementation base", amountCents: 210_000 });
      if (service === "UI_UX_DESIGN") lineItems.push({ label: "UI/UX design base", amountCents: 260_000 });
      if (service === "UX_RESEARCH_TESTING") lineItems.push({ label: "UX research/testing", amountCents: 170_000 });
      if (service === "WIREFRAMING_PROTOTYPING") lineItems.push({ label: "Wireframing/prototyping", amountCents: 140_000 });
      if (service === "BRANDING_VISUAL_IDENTITY") lineItems.push({ label: "Branding + visual identity", amountCents: 210_000 });
      if (service === "MOBILE_APP_IOS") lineItems.push({ label: "Mobile app (iOS) base", amountCents: 640_000 });
      if (service === "MOBILE_APP_ANDROID") lineItems.push({ label: "Mobile app (Android) base", amountCents: 640_000 });
      if (service === "MOBILE_APP_CROSS_PLATFORM") lineItems.push({ label: "Mobile app (cross-platform) base", amountCents: 780_000 });
      if (service === "API_DEVELOPMENT") lineItems.push({ label: "API development base", amountCents: 280_000 });
      if (service === "THIRD_PARTY_INTEGRATIONS") lineItems.push({ label: "Third-party integrations base", amountCents: 190_000 });
      if (service === "AUTOMATION_WORKFLOWS") lineItems.push({ label: "Automation workflows base", amountCents: 180_000 });
      if (service === "RPA_LEGACY_AUTOMATION") lineItems.push({ label: "RPA/legacy automation base", amountCents: 320_000 });
      if (service === "AI_LLM_AUTOMATIONS") lineItems.push({ label: "AI/LLM automation base", amountCents: 280_000 });
      if (service === "QA_TESTING") lineItems.push({ label: "QA/testing base", amountCents: 130_000 });
      if (service === "SECURITY_COMPLIANCE") lineItems.push({ label: "Security/compliance base", amountCents: 170_000 });
      if (service === "DEVOPS_CI_CD_CLOUD") lineItems.push({ label: "DevOps/CI-CD/cloud base", amountCents: 220_000 });
      if (service === "ANALYTICS_TRACKING") lineItems.push({ label: "Analytics/tracking setup", amountCents: 120_000 });
      if (service === "SEO_TECHNICAL") lineItems.push({ label: "Technical SEO setup", amountCents: 110_000 });
      if (service === "CONTENT_MIGRATION") lineItems.push({ label: "Content migration", amountCents: 105_000 });
      if (service === "MAINTENANCE_SUPPORT") lineItems.push({ label: "Maintenance/support retainer", amountCents: 140_000 });
      if (service === "DEDICATED_TEAM") lineItems.push({ label: "Dedicated team allocation", amountCents: 420_000 });
      if (service === "DISCOVERY_CONSULTING") lineItems.push({ label: "Discovery/consulting", amountCents: 180_000 });
    });
    if (
      serviceSet.has("WEB_DEVELOPMENT") ||
      serviceSet.has("WORDPRESS_DEVELOPMENT") ||
      serviceSet.has("CUSTOM_WEB_APP_DEVELOPMENT") ||
      serviceSet.has("ECOMMERCE_DEVELOPMENT")
    ) {
      lineItems.push({ label: `Web pages (${pageCount})`, amountCents: pageCount * 8_000 });
    }
    if (
      serviceSet.has("MOBILE_APP_IOS") ||
      serviceSet.has("MOBILE_APP_ANDROID") ||
      serviceSet.has("MOBILE_APP_CROSS_PLATFORM") ||
      serviceSet.has("UI_UX_DESIGN")
    ) {
      lineItems.push({ label: `Screens (${screenCount})`, amountCents: screenCount * 12_000 });
    }
    if (
      serviceSet.has("AUTOMATION_WORKFLOWS") ||
      serviceSet.has("THIRD_PARTY_INTEGRATIONS") ||
      serviceSet.has("AI_LLM_AUTOMATIONS") ||
      serviceSet.has("API_DEVELOPMENT")
    ) {
      lineItems.push({ label: `Integrations (${integrationCount})`, amountCents: integrationCount * 30_000 });
    }
    if (form.serviceType === "UI_UX_DESIGN") {
      lineItems.push({
        label: form.designPackage === "WIREFRAMES_AND_UX" ? "Wireframes + UX flows" : "Design package",
        amountCents: form.designPackage === "WIREFRAMES_AND_UX" ? 180_000 : form.designPackage === "WIREFRAMES" ? 110_000 : 60_000
      });
    }
    form.addonServices.forEach((addon) => {
      if (addon === "COPYWRITING_CONTENT") lineItems.push({ label: "Add-on: Copywriting/content", amountCents: 60_000 });
      if (addon === "ADVANCED_SEO") lineItems.push({ label: "Add-on: Advanced SEO", amountCents: 75_000 });
      if (addon === "PERFORMANCE_OPTIMIZATION") lineItems.push({ label: "Add-on: Performance optimization", amountCents: 55_000 });
      if (addon === "TRAINING_HANDOFF") lineItems.push({ label: "Add-on: Team training + handoff", amountCents: 45_000 });
      if (addon === "PRIORITY_SUPPORT") lineItems.push({ label: "Add-on: Priority support", amountCents: 90_000 });
      if (addon === "ADDITIONAL_QA_CYCLE") lineItems.push({ label: "Add-on: Additional QA cycle", amountCents: 50_000 });
      if (addon === "SECURITY_REVIEW") lineItems.push({ label: "Add-on: Security review", amountCents: 80_000 });
      if (addon === "ANALYTICS_DASHBOARD") lineItems.push({ label: "Add-on: Analytics dashboard", amountCents: 65_000 });
    });
    if (form.complexity === "ADVANCED") lineItems.push({ label: "Advanced complexity uplift", amountCents: 180_000 });
    if (form.complexity === "STANDARD") lineItems.push({ label: "Standard complexity uplift", amountCents: 90_000 });
    if (form.complexity === "SIMPLE") lineItems.push({ label: "Simple complexity uplift", amountCents: 35_000 });

    const estimatedCentsRaw = lineItems.reduce((sum, item) => sum + item.amountCents, 0);
    const totalCents = budgetHint ? Math.max(estimatedCentsRaw, budgetHint) : estimatedCentsRaw;
    return {
      totalCents,
      deposit50Cents: Math.ceil(totalCents * 0.5),
      milestone30Cents: Math.ceil(totalCents * 0.3),
      handoff20Cents: totalCents - Math.ceil(totalCents * 0.5) - Math.ceil(totalCents * 0.3),
      confidence: form.selectedServices.length === 0 || form.scopePrompt.trim().length < 20 ? "MEDIUM" : "HIGH",
      lineItems,
      assumptions: [
        "Domain, hosting, and third-party subscription costs are paid directly by the client.",
        "Scope changes after approval may increase the total estimate.",
        "50% deposit is required before request submission is sent to admin."
      ]
    };
  }, []);

  const handleConfirmProjectRequest = async () => {
    if (!session || !projectRequestEstimate || submittingProjectRequest) return;
    setSubmittingProjectRequest(true);
    setProjectRequestPhase("creating_deposit");

    const invoiceNumber = `DEP-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const dueIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const invoice = await createPortalInvoiceWithRefresh(session, {
      number: invoiceNumber,
      amountCents: projectRequestEstimate.deposit50Cents,
      currency: "USD",
      status: "ISSUED",
      issuedAt: nowIso,
      dueAt: dueIso
    });
    if (!invoice.data) {
      setSubmittingProjectRequest(false);
      setProjectRequestPhase("idle");
      setFeedback({ tone: "error", message: invoice.error?.message ?? "Unable to create deposit invoice." });
      return;
    }

    const payment = await createPortalPaymentWithRefresh(invoice.nextSession ?? session, {
      invoiceId: invoice.data.id,
      amountCents: projectRequestEstimate.deposit50Cents,
      status: "COMPLETED",
      provider: "MANUAL_GATEWAY",
      transactionRef: `dep-${invoice.data.id.slice(0, 8)}`,
      paidAt: new Date().toISOString()
    });
    if (!payment.data) {
      setSubmittingProjectRequest(false);
      setProjectRequestPhase("idle");
      setFeedback({ tone: "error", message: payment.error?.message ?? "Deposit payment failed." });
      return;
    }

    setProjectRequestPhase("submitting_request");
    const parsedBudget = projectRequestForm.estimatedBudgetCents.trim().length > 0
      ? Number(projectRequestForm.estimatedBudgetCents.trim())
      : undefined;
    const primaryService = projectRequestForm.selectedServices[0];
    const legacyServiceType = primaryService ? SERVICE_TO_LEGACY_TYPE[primaryService] : projectRequestForm.serviceType;
    const created = await createPortalProjectRequestWithRefresh(payment.nextSession ?? invoice.nextSession ?? session, {
      name: projectRequestForm.name.trim(),
      description: projectRequestForm.description.trim() || undefined,
      desiredStartAt: projectRequestForm.desiredStartAt ? new Date(`${projectRequestForm.desiredStartAt}T00:00:00.000Z`).toISOString() : undefined,
      desiredDueAt: projectRequestForm.desiredDueAt ? new Date(`${projectRequestForm.desiredDueAt}T00:00:00.000Z`).toISOString() : undefined,
      estimatedBudgetCents: parsedBudget,
      priority: projectRequestForm.priority,
      serviceType: legacyServiceType,
      buildMode: projectRequestForm.buildMode,
      complexity: projectRequestForm.complexity,
      designPackage: projectRequestForm.designPackage,
      selectedServices: projectRequestForm.selectedServices,
      addonServices: projectRequestForm.addonServices,
      websitePageCount: Number(projectRequestForm.websitePageCount) || undefined,
      appScreenCount: Number(projectRequestForm.appScreenCount) || undefined,
      integrationsCount: Number(projectRequestForm.integrationsCount) || undefined,
      targetPlatforms: projectRequestForm.targetPlatforms,
      requiresContentSupport: projectRequestForm.requiresContentSupport,
      requiresDomainAndHosting: projectRequestForm.requiresDomainAndHosting,
      scopePrompt: projectRequestForm.scopePrompt.trim() || undefined,
      signedAgreementFileId: projectRequestForm.agreementFileId,
      estimatedQuoteCents: projectRequestEstimate.totalCents,
      depositInvoiceId: invoice.data.id,
      depositPaymentId: payment.data.id
    });
    setSubmittingProjectRequest(false);
    setProjectRequestPhase("idle");
    setProjectEstimateModalOpen(false);
    if (!created.data) {
      setFeedback({ tone: "error", message: created.error?.message ?? "Unable to submit project request." });
      return;
    }

    setProjectRequestForm({
      name: "", description: "", serviceType: "AUTO_RECOMMEND",
      selectedServices: ["WEB_DEVELOPMENT"], addonServices: [],
      buildMode: "AUTO", complexity: "STANDARD", designPackage: "NONE",
      websitePageCount: "5", appScreenCount: "6", integrationsCount: "1",
      targetPlatforms: ["WEB"], requiresContentSupport: true, requiresDomainAndHosting: true,
      scopePrompt: "", desiredStartAt: "", desiredDueAt: "", estimatedBudgetCents: "",
      priority: "MEDIUM", agreementFileId: ""
    });
    setProjectRequestEstimate(null);
    await refreshSnapshot(created.nextSession ?? payment.nextSession ?? invoice.nextSession ?? session, { background: true });
    setFeedback({ tone: "success", message: "Project request submitted with 50% deposit confirmation." });
  };

  const handleSendMessage = async () => {
    if (!selectedConversationId || !composeMessage.trim()) return;
    const created = await sendMessage(selectedConversationId, composeMessage.trim());
    if (created) setComposeMessage("");
  };

  const handleCreateThread = async () => {
    if (!session || creatingThread) return;
    if (newThreadSubject.trim().length < 2) {
      setFeedback({ tone: "error", message: "Thread subject is required." });
      return;
    }
    setCreatingThread(true);
    const result = await createPortalConversationWithRefresh(session, {
      clientId: session.user.clientId ?? undefined,
      subject: newThreadSubject.trim()
    });
    setCreatingThread(false);
    if (!result.data) {
      setFeedback({ tone: "error", message: result.error?.message ?? "Unable to create thread." });
      return;
    }
    setNewThreadSubject("");
    selectConversation(result.data.id);
    await refreshSnapshot(result.nextSession ?? session, { background: true });
    setFeedback({ tone: "success", message: "Thread created." });
  };

  const handleMessageAttachmentUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!selectedConversationId) {
      setFeedback({ tone: "error", message: "Select a thread before attaching a file." });
      event.target.value = "";
      return;
    }
    const uploaded = await uploadFile(file);
    if (!uploaded) {
      setFeedback({ tone: "error", message: "Unable to upload attachment." });
      event.target.value = "";
      return;
    }
    await sendMessage(selectedConversationId, `Shared file: ${file.name}`);
    setFeedback({ tone: "success", message: `Attachment uploaded: ${uploaded.fileName}` });
    event.target.value = "";
  };

  const handleProjectFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const uploaded = await uploadFile(file);
    if (!uploaded) {
      setFeedback({ tone: "error", message: "Unable to upload project file." });
      event.target.value = "";
      return;
    }
    if (/agreement|contract|addendum/i.test(uploaded.fileName)) {
      setProjectRequestForm((prev) => ({ ...prev, agreementFileId: uploaded.id }));
    }
    setFeedback({ tone: "success", message: `Uploaded: ${uploaded.fileName}` });
    event.target.value = "";
  };

  const handlePreviewProjectRequest = () => {
    const estimate = buildProjectEstimate(projectRequestForm);
    setProjectRequestEstimate(estimate);
    setProjectEstimateModalOpen(true);
  };

  const handleGenerateHandoff = async () => {
    if (!session) return;
    const result = await generatePortalHandoffSummaryWithRefresh(session);
    if (!result.data) {
      setFeedback({ tone: "error", message: result.error?.message ?? "Unable to generate handoff package." });
      return;
    }
    setHandoffSummary({
      docs: result.data.docs,
      decisions: result.data.decisions,
      blockers: result.data.blockers,
      generatedAt: result.data.generatedAt
    });
    setFeedback({ tone: "success", message: "Handoff package refreshed." });
  };

  const handleExportProjects = () => {
    if (viewsFinal.searchedProjectCards.length === 0) {
      setFeedback({ tone: "error", message: "No projects available to export." });
      return;
    }
    const escapeCsv = (value: string | number | null | undefined) => {
      const text = value === null || value === undefined ? "" : String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
    };
    const header = ["Project", "Status", "Priority", "Progress (%)", "Due Date", "Budget", "Owner", "Milestones", "Open Milestones"];
    const lines = viewsFinal.searchedProjectCards.map((project) => {
      const openMilestones = project.milestones.filter((m) => m.status !== "COMPLETED").length;
      return [
        escapeCsv(project.name), escapeCsv(formatStatus(project.status)), escapeCsv(formatStatus(project.priority)),
        escapeCsv(project.progressPercent), escapeCsv(project.dueAt ? formatDateLong(project.dueAt) : "TBD"),
        escapeCsv(formatMoney(project.budgetCents, displayCurrency)), escapeCsv(project.ownerName ?? ""),
        escapeCsv(project.milestones.length), escapeCsv(openMilestones)
      ].join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `client-projects-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setFeedback({ tone: "success", message: "Projects export downloaded." });
  };

  const handleExportInvoices = () => {
    if (viewsFinal.searchedFilteredInvoiceTable.length === 0) {
      setFeedback({ tone: "error", message: "No invoices available to export." });
      return;
    }
    const escapeCsv = (value: string | number | null | undefined) => {
      const text = value === null || value === undefined ? "" : String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
    };
    const header = ["Invoice #", "Project", "Issued", "Due", "Amount", "Status"];
    const lines = viewsFinal.searchedFilteredInvoiceTable.map((inv) =>
      [escapeCsv(inv.id), escapeCsv(inv.project), escapeCsv(inv.issued), escapeCsv(inv.due), escapeCsv(inv.amount), escapeCsv(inv.badge.label)].join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `client-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setFeedback({ tone: "success", message: "Invoices export downloaded." });
  };

  const handleDownloadAgreementTemplate = () => {
    const content = [
      "MAPHARI PROJECT AGREEMENT", "",
      `Project: ${projectRequestForm.name || "Untitled Project"}`,
      `Client: ${settingsProfile.company || "Client"}`, "",
      "Terms:",
      "1) Client confirms submitted scope details are accurate.",
      "2) A 50% deposit is required before request submission is sent.",
      "3) 30% is due at approved milestone stage.",
      "4) Final 20% is due before project handoff.",
      "5) Domain, hosting, and third-party subscriptions are paid by the client.",
      "6) Scope changes may increase price and timeline.", "",
      "Client Signature: _________________________",
      "Date: _________________________"
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "maphari-project-agreement-template.txt";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  /* ── navigation helpers ── */
  const openProjectContext = (projectId?: string | null) => {
    if (projectId) {
      setSelectedProjectId(projectId);
      setTopbarProjectId(projectId);
    }
    setActivePage("projects");
  };

  const handleOpenThreadFromDashboard = (threadId: string) => {
    selectConversation(threadId);
    setActivePage("messages");
  };

  const handleOpenInvoiceFromDashboard = (invoiceId: string) => {
    const inv = dateScopedInvoices.find((i) => i.id === invoiceId);
    if (inv?.status === "PAID") setActiveInvoiceTab("paid");
    else if (inv) setActiveInvoiceTab("outstanding");
    setActivePage("invoices");
  };

  const handleOpenActionItem = (id: string) => {
    if (id.startsWith("invoice-")) { handleOpenInvoiceFromDashboard(id.replace("invoice-", "")); return; }
    if (id.startsWith("milestone-")) { openProjectContext(milestoneProjectById.get(id.replace("milestone-", "")) ?? projectScopeId); return; }
    if (id.startsWith("task-")) { openProjectContext(taskProjectById.get(id.replace("task-", "")) ?? projectScopeId); return; }
    openProjectContext(projectScopeId);
  };

  const handleOpenRiskItem = (id: string) => {
    if (id.startsWith("invoice-risk-")) { handleOpenInvoiceFromDashboard(id.replace("invoice-risk-", "")); return; }
    if (id.startsWith("milestone-risk-")) { openProjectContext(milestoneProjectById.get(id.replace("milestone-risk-", "")) ?? projectScopeId); return; }
    if (id.startsWith("milestone-soon-")) { openProjectContext(milestoneProjectById.get(id.replace("milestone-soon-", "")) ?? projectScopeId); return; }
    if (id.startsWith("task-blocked-")) { openProjectContext(taskProjectById.get(id.replace("task-blocked-", "")) ?? projectScopeId); return; }
    if (id.startsWith("risk-")) { openProjectContext(id.replace("risk-", "")); return; }
    if (id.startsWith("blocker-")) { openProjectContext(projectScopeId); return; }
    openProjectContext(projectScopeId);
  };

  const handleOpenApprovalItem = (id: string) => {
    if (id.startsWith("approval-milestone-")) { openProjectContext(milestoneProjectById.get(id.replace("approval-milestone-", "")) ?? projectScopeId); return; }
    if (id.startsWith("approval-change-")) { openProjectContext(changeRequestProjectById.get(id.replace("approval-change-", "")) ?? projectScopeId); return; }
    openProjectContext(projectScopeId);
  };

  const handleOpenDecisionItem = (id: string) => {
    if (id.startsWith("decision-milestone-")) { openProjectContext(milestoneProjectById.get(id.replace("decision-milestone-", "")) ?? projectScopeId); return; }
    if (id.startsWith("decision-change-")) { openProjectContext(changeRequestProjectById.get(id.replace("decision-change-", "")) ?? projectScopeId); return; }
    openProjectContext(projectScopeId);
  };

  const handleOpenActivityItem = (id: string) => {
    if (id.startsWith("thread-")) { handleOpenThreadFromDashboard(id.replace("thread-", "")); return; }
    if (id.startsWith("invoice-")) { handleOpenInvoiceFromDashboard(id.replace("invoice-", "")); return; }
    if (id.startsWith("timeline-")) {
      const info = timelineEventById.get(id.replace("timeline-", ""));
      if (info?.projectId) { openProjectContext(info.projectId); return; }
      openProjectContext(projectScopeId); return;
    }
    if (id.startsWith("file-")) { openProjectContext(projectScopeId); return; }
    openProjectContext(projectActivityById.get(id) ?? projectScopeId);
  };

  const handleOpenTimelineItem = (id: string) => {
    if (id.startsWith("invoice-")) { handleOpenInvoiceFromDashboard(id.replace("invoice-", "")); return; }
    openProjectContext(milestoneProjectById.get(id) ?? projectScopeId);
  };

  /* ── render ── */
  return (
    <DashboardProvider value={{
      activePage,
      setActivePage,
      resolvedTheme,
      toggleTheme,
      setFeedback,
      projectScopeId,
      dateRange: topbarDateRange,
    }}>
    <div className={`${styles.clientRoot} ${resolvedTheme === "light" ? styles.clientRootLight : ""} ${syne.variable} ${dmMono.variable} ${instrument.variable}`}>
      <div className={styles.shell}>
        <ClientSidebar
          navSections={navSections}
          activePage={activePage}
          onChangePage={setActivePage}
          projects={sortedProjects.map((p) => ({ id: p.id, name: p.name }))}
          selectedProjectId={activeProjectId}
          onSelectProject={(projectId) => {
            setSelectedProjectId(projectId);
            setTopbarProjectId(projectId);
          }}
          userInitials={userInitials}
          userGreetingName={userGreetingName}
          clientBadge={clientBadge}
          resolvedTheme={resolvedTheme}
          onToggleTheme={toggleTheme}
        />

        <div className={styles.main}>
          <ClientTopbar
            topbarEyebrow={topbarEyebrow}
            topbarTitle={topbarTitle}
            activeProjectId={projectScopeId}
            projectOptions={sortedProjects.map((p) => ({ id: p.id, name: p.name }))}
            dateRange={topbarDateRange}
            notificationCount={totalUnreadNotifications}
            onProjectChange={(projectId) => {
              setTopbarProjectId(projectId);
              setSelectedProjectId(projectId);
            }}
            onDateRangeChange={setTopbarDateRange}
            onOpenCommandSearch={() => {
              setCommandSearchValue(topbarSearch);
              setCommandSearchOpen(true);
            }}
            onOpenNotifications={() => {
              setNotificationsTrayOpen((prev) => !prev);
              setQuickComposeOpen(false);
              setCommandSearchOpen(false);
            }}
            onOpenMessages={() => {
              setQuickComposeOpen(true);
              setQuickComposeProjectId(projectScopeId);
              setNotificationsTrayOpen(false);
              setCommandSearchOpen(false);
            }}
          />

          {notificationsTrayOpen ? (
            <div className={styles.topbarOverlay} role="dialog" aria-label="Notifications">
              <div className={styles.overlayHeader}>
                <div className={styles.overlayTitle}>Notifications</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className={styles.overlayLink}
                    type="button"
                    onClick={() => {
                      setNotificationsTrayOpen(false);
                      setActivePage("notifications");
                    }}
                  >
                    View all
                  </button>
                  <button className={styles.overlayLink} type="button" onClick={() => void handleMarkAllNotificationsRead()}>
                    Mark all read
                  </button>
                </div>
              </div>
              <div className={styles.overlayBody}>
                {notificationJobs.length === 0 ? (
                  <div className={styles.emptyState}>No notifications yet.</div>
                ) : (
                  (["dashboard", "projects", "invoices", "messages", "operations", "settings"] as const).map((tab) => {
                    const tabJobs = notificationJobs.filter((job) => job.tab === tab).slice(0, 6);
                    if (tabJobs.length === 0) return null;
                    return (
                      <div key={tab} className={styles.notificationGroup}>
                        <div className={styles.notificationGroupTitle}>{tab === "operations" ? "automations" : tab}</div>
                        {tabJobs.map((job) => (
                          <div key={job.id} className={styles.notificationItem}>
                            <button
                              type="button"
                              className={styles.notificationMain}
                              onClick={() => {
                                setActivePage(toPageFromNotificationTab(tab));
                                setNotificationsTrayOpen(false);
                              }}
                            >
                              <span className={styles.notificationStatus}>{formatStatus(job.status)}</span>
                              <span className={styles.notificationMeta}>{job.readAt ? "Read" : "Unread"}</span>
                            </button>
                            <button
                              type="button"
                              className={styles.overlayLink}
                              onClick={() => void handleMarkNotificationRead(job.id, !job.readAt)}
                            >
                              {job.readAt ? "Unread" : "Read"}
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}

          {commandSearchOpen ? (
            <div className={styles.commandBackdrop} role="dialog" aria-label="Command search">
              <div className={styles.commandCard}>
                <input
                  ref={commandSearchInputRef}
                  className={styles.commandInput}
                  value={commandSearchValue}
                  onChange={(event) => setCommandSearchValue(event.target.value)}
                  placeholder="Search commands, projects, invoices, threads..."
                />
                <div className={styles.commandList}>
                  {commandResults.length === 0 ? (
                    <div className={styles.emptyState}>No matches.</div>
                  ) : (
                    commandResults.map((result) => (
                      <button
                        key={result.id}
                        className={styles.commandItem}
                        type="button"
                        onClick={() => void handleCommandResultSelect(result)}
                      >
                        <span>{result.label}</span>
                        <span>{result.detail}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {quickComposeOpen ? (
            <div className={styles.commandBackdrop} role="dialog" aria-label="Quick compose message">
              <div className={styles.composeCard}>
                <div className={styles.overlayHeader}>
                  <div className={styles.overlayTitle}>Start New Thread</div>
                  <button className={styles.overlayLink} type="button" onClick={() => setQuickComposeOpen(false)}>
                    Close
                  </button>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Subject</label>
                    <input
                      ref={quickComposeSubjectRef}
                      className={styles.fieldInput}
                      value={quickComposeSubject}
                      onChange={(event) => setQuickComposeSubject(event.target.value)}
                      placeholder="Kickoff updates"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Project</label>
                    <select
                      title="project-selector"
                      className={styles.fieldInput}
                      value={resolvedQuickComposeProjectId ?? ""}
                      onChange={(event) => setQuickComposeProjectId(event.target.value || null)}
                    >
                      <option value="">General</option>
                      {sortedProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>First message (optional)</label>
                    <textarea
                      className={styles.fieldInput}
                      rows={4}
                      value={quickComposeBody}
                      onChange={(event) => setQuickComposeBody(event.target.value)}
                      placeholder="Share your update or question..."
                    />
                  </div>
                  <div className={styles.pageActions}>
                    <button className={`${styles.button} ${styles.buttonGhost}`} type="button" onClick={() => setQuickComposeOpen(false)}>
                      Cancel
                    </button>
                    <button
                      className={`${styles.button} ${styles.buttonAccent}`}
                      type="button"
                      disabled={quickComposeCreating || quickComposeSubject.trim().length < 2}
                      onClick={() => void handleQuickComposeSubmit()}
                    >
                      {quickComposeCreating ? "Creating..." : "Create thread"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {clientTourOpen ? (
            <div className={onboardingTourStyles.overlay} role="dialog" aria-label="Client onboarding tour">
              <div className={onboardingTourStyles.backdrop} />
              {clientTourLayout.spotlight ? (
                <div
                  className={onboardingTourStyles.spotlight}
                  style={{
                    top: clientTourLayout.spotlight.top,
                    left: clientTourLayout.spotlight.left,
                    width: clientTourLayout.spotlight.width,
                    height: clientTourLayout.spotlight.height
                  }}
                />
              ) : null}
              <div className={onboardingTourStyles.tooltip} style={clientTourLayout.tooltip}>
                {clientTourStep === 0 ? (
                  <div className={onboardingTourStyles.mustNote}>⚠ You must complete this step to continue.</div>
                ) : null}
                <div className={onboardingTourStyles.stepEye}>Step {clientTourStep + 1} of {clientTourSteps.length}</div>
                <div className={onboardingTourStyles.stepTitle}>{activeTourStep.title}</div>
                <div className={onboardingTourStyles.stepDesc}>{activeTourStep.detail}</div>
                <div className={onboardingTourStyles.nav}>
                  <div className={onboardingTourStyles.dots}>
                    {clientTourSteps.map((step, index) => (
                      <div
                        key={`${step.title}-${index}`}
                        className={cx(
                          onboardingTourStyles.dot,
                          index < clientTourStep && onboardingTourStyles.dotDone,
                          index === clientTourStep && onboardingTourStyles.dotActive
                        )}
                      />
                    ))}
                  </div>
                  <div className={onboardingTourStyles.buttons}>
                    <button
                      className={onboardingTourStyles.skip}
                      type="button"
                      style={{ display: clientTourStep === 0 ? "none" : "inline-flex" }}
                      onClick={() => {
                        if (clientTourStep === 0) return;
                        if (session?.user?.email) {
                          window.localStorage.setItem(`maphari:tour:client:${session.user.email}`, "done");
                        }
                        setClientTourOpen(false);
                      }}
                    >
                      Skip tour
                    </button>
                    <button
                      className={onboardingTourStyles.next}
                      type="button"
                      onClick={() => {
                        if (clientTourStep < clientTourSteps.length - 1) {
                          setClientTourStep((value) => value + 1);
                          return;
                        }
                        if (session?.user?.email) {
                          window.localStorage.setItem(`maphari:tour:client:${session.user.email}`, "done");
                        }
                        setClientTourOpen(false);
                      }}
                    >
                      {clientTourStep < clientTourSteps.length - 1 ? "Next →" : "Get Started ✓"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {projectEstimateModalOpen && projectRequestEstimate ? (
            <div className={styles.commandBackdrop} role="dialog" aria-label="Project estimate confirmation">
              <div className={styles.commandCard}>
                <div className={styles.overlayHeader}>
                  <div className={styles.overlayTitle}>Estimate & Agreement</div>
                  <button className={styles.overlayLink} type="button" onClick={() => setProjectEstimateModalOpen(false)}>Decline</button>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.pageSub} style={{ marginTop: 0 }}>
                    Confirm this estimate and deposit to send your request to admin review.
                  </div>
                  <div className={styles.grid2} style={{ marginTop: 12 }}>
                    <div className={styles.card}>
                      <div className={styles.cardBody}>
                        <div className={styles.fieldLabel}>Estimated Total</div>
                        <div className={styles.pageTitle} style={{ fontSize: "1.2rem" }}>{formatMoney(projectRequestEstimate.totalCents, displayCurrency)}</div>
                        <div className={styles.pageSub}>Confidence: {projectRequestEstimate.confidence}</div>
                      </div>
                    </div>
                    <div className={styles.card}>
                      <div className={styles.cardBody}>
                        <div className={styles.fieldLabel}>Payment Plan</div>
                        <div className={styles.pageSub} style={{ marginTop: 0 }}>Deposit 50%: {formatMoney(projectRequestEstimate.deposit50Cents, displayCurrency)}</div>
                        <div className={styles.pageSub}>Milestone 30%: {formatMoney(projectRequestEstimate.milestone30Cents, displayCurrency)}</div>
                        <div className={styles.pageSub}>Handoff 20%: {formatMoney(projectRequestEstimate.handoff20Cents, displayCurrency)}</div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.card} style={{ marginTop: 12 }}>
                    <div className={styles.cardBody}>
                      <div className={styles.fieldLabel}>Estimate Breakdown</div>
                      <div className={styles.milestoneList}>
                        {projectRequestEstimate.lineItems.map((item) => (
                          <div key={item.label} className={styles.milestoneItem}>
                            <div className={styles.milestoneTitle}>{item.label}</div>
                            <div className={styles.milestoneDate}>{formatMoney(item.amountCents, displayCurrency)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={styles.pageSub} style={{ marginTop: 12 }}>
                    Agreement file: {selectedAgreementFile?.fileName ?? "Not selected"}
                  </div>
                  <div className={styles.pageSub}>
                    Domain, hosting, and third-party subscriptions are paid directly by the client.
                  </div>
                  <div className={styles.pageActions} style={{ marginTop: 16 }}>
                    <button className={`${styles.button} ${styles.buttonGhost}`} type="button" onClick={handleDownloadAgreementTemplate}>
                      Download Agreement
                    </button>
                    <button
                      className={`${styles.button} ${styles.buttonAccent}`}
                      type="button"
                      onClick={() => void handleConfirmProjectRequest()}
                      disabled={submittingProjectRequest}
                    >
                      {projectRequestPhase === "creating_deposit"
                        ? "Processing deposit..."
                        : projectRequestPhase === "submitting_request"
                        ? "Submitting request..."
                        : "Accept & Pay 50%"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <DashboardToastStack toasts={toasts} />

          <div className={styles.content}>
            <ClientDashboardPage
              active={activePage === "dashboard"}
              userGreetingName={userGreetingName}
              lastSyncedLabel={viewsFinal.lastSyncedLabel}
              projectDetailsLoading={portalData.projectDetailsLoading}
              dashboardStats={viewsFinal.dashboardStats}
              projectRows={viewsFinal.searchedProjectRows}
              animateProgress={animateProgress}
              actionCenter={viewsFinal.actionCenter}
              milestoneRows={viewsFinal.searchedMilestoneRows}
              recentThreads={viewsFinal.searchedRecentThreads}
              invoiceRows={viewsFinal.searchedInvoiceRows}
              nextActions={viewsFinal.nextActions}
              activityFeed={viewsFinal.activityFeed}
              timelineItems={viewsFinal.timelineItems}
              onboardingChecklist={viewsFinal.onboardingChecklist}
              digestItems={viewsFinal.digestItems}
              approvalQueue={viewsFinal.approvalQueue}
              decisionLog={viewsFinal.decisionLog}
              slaAlerts={viewsFinal.slaAlerts}
              confidenceSummary={viewsFinal.confidenceSummary}
              handoffSummary={handoffSummary}
              onGenerateHandoff={handleGenerateHandoff}
              onOpenProjects={() => setActivePage("projects")}
              onOpenMessages={() => setActivePage("messages")}
              onOpenInvoices={() => setActivePage("invoices")}
              onOpenThread={handleOpenThreadFromDashboard}
              onOpenInvoice={handleOpenInvoiceFromDashboard}
              onOpenActionItem={handleOpenActionItem}
              onOpenRiskItem={handleOpenRiskItem}
              onOpenActivityItem={handleOpenActivityItem}
              onOpenTimelineItem={handleOpenTimelineItem}
              onOpenApprovalItem={handleOpenApprovalItem}
              onOpenDecisionItem={handleOpenDecisionItem}
              onApproveMilestone={(milestoneId) => void handleMilestoneApproval(milestoneId, "APPROVED")}
              onRejectMilestone={(milestoneId) => void handleMilestoneApproval(milestoneId, "REJECTED")}
            />
            <ClientReportsPage
              active={activePage === "reports"}
              invoices={snapshot.invoices}
              projects={portalData.projects}
              allMilestones={portalData.allMilestones}
              convertMoney={convertMoney}
              displayCurrency={displayCurrency}
            />
            <ClientAiAutomationPage
              active={activePage === "ai"}
              automationRows={viewsFinal.clientAutomationRows}
              projects={portalData.projects}
              convertMoney={convertMoney}
              displayCurrency={displayCurrency}
            />
            <ClientOnboardingPage active={activePage === "onboarding"} />
            <ClientProjectsPage
              active={activePage === "projects"}
              projectsCount={projectScopedProjects.length}
              projectCards={viewsFinal.searchedProjectCards}
              animateProgress={animateProgress}
              milestoneApprovals={milestoneApprovals}
              onApproveMilestone={(milestoneId) => void handleMilestoneApproval(milestoneId, "APPROVED")}
              onRejectMilestone={(milestoneId) => void handleMilestoneApproval(milestoneId, "REJECTED")}
              onExportProjects={handleExportProjects}
              currency={displayCurrency}
              files={snapshot.files}
              changeRequests={scopedChangeRequests}
              changeRequestForm={changeRequestForm}
              onChangeRequestFormChange={setChangeRequestForm}
              onSubmitChangeRequest={() => void handleSubmitChangeRequest()}
              submittingChangeRequest={submittingChangeRequest}
              onClientDecision={(changeRequestId, status, metadata) =>
                void handleClientChangeRequestDecision(changeRequestId, status, metadata)
              }
            />
            <ClientMilestonesPage
              active={activePage === "milestones"}
              onApproveMilestone={(id) => void handleMilestoneApproval(id, "APPROVED")}
              onRejectMilestone={(id) => void handleMilestoneApproval(id, "REJECTED")}
            />
            <ClientCreateProjectPage
              active={activePage === "create"}
              onClose={() => setActivePage("projects")}
              files={snapshot.files}
              uploadState={uploadState}
              uploadMessage={null}
              onFileUpload={(event) => void handleProjectFileUpload(event)}
              projectRequestForm={projectRequestForm}
              onProjectRequestFormChange={setProjectRequestForm}
              onDownloadAgreementTemplate={handleDownloadAgreementTemplate}
              onPreviewProjectRequest={handlePreviewProjectRequest}
              submittingProjectRequest={submittingProjectRequest}
            />
            <ClientDocumentsPage
              active={activePage === "docs"}
              files={snapshot.files}
              activeProjectName={activeProjectName}
              onDownloadAgreementTemplate={handleDownloadAgreementTemplate}
            />
            <ClientInvoicesPage
              active={activePage === "invoices"}
              invoiceSummaryStats={viewsFinal.invoiceSummaryStats}
              invoiceTabs={viewsFinal.invoiceTabs}
              activeInvoiceTab={activeInvoiceTab}
              onInvoiceTabChange={setActiveInvoiceTab}
              onOpenInvoice={handleOpenInvoiceFromDashboard}
              onExportInvoices={handleExportInvoices}
              filteredInvoiceTable={viewsFinal.searchedFilteredInvoiceTable}
            />
            <ClientMessagesPage
              active={activePage === "messages"}
              openThreadsCount={portalData.openThreads.length}
              messageThreads={viewsFinal.messageThreads}
              threadSearch={threadSearch}
              onThreadSearchChange={setThreadSearch}
              newThreadSubject={newThreadSubject}
              onNewThreadSubjectChange={setNewThreadSubject}
              creatingThread={creatingThread}
              onCreateThread={() => void handleCreateThread()}
              selectedConversationId={selectedConversationId}
              onThreadClick={(id) => selectConversation(id)}
              selectedConversation={selectedConversation}
              selectedProjectName={selectedProjectName}
              messagesLoading={messagesLoading}
              conversationMessages={conversationMessages}
              composeMessage={composeMessage}
              setComposeMessage={setComposeMessage}
              onSendMessage={() => void handleSendMessage()}
              onAttachFile={(event) => void handleMessageAttachmentUpload(event)}
              attachingFile={uploadState === "uploading"}
            />
            <ClientAutomationPage
              active={activePage === "automations"}
              queuedJobs={notificationJobs.filter((job) => job.status === "QUEUED").length}
              overdueInvoices={overdueInvoices.length}
              pendingApprovals={viewsFinal.pendingApprovalCount}
              openBlockers={scopedBlockers.filter((item) => item.status !== "RESOLVED").length}
              workflowRows={viewsFinal.clientAutomationRows}
              onOpenMessages={() => setActivePage("messages")}
              onOpenInvoices={() => setActivePage("invoices")}
              onOpenProjects={() => setActivePage("projects")}
            />
            <ClientSettingsPage
              active={activePage === "settings"}
              userInitials={userInitials}
              userGreetingName={userGreetingName}
              userEmail={userEmail}
              profile={settingsProfile}
              onProfileChange={(key, value) =>
                setSettingsProfile((prev) => ({ ...prev, [key]: value }))
              }
              onSaveProfile={() => void handleSaveClientProfile()}
              notifications={settingsNotifications}
              onNotificationChange={(key, value) =>
                setSettingsNotifications((prev) => ({ ...prev, [key]: value }))
              }
              onSaveNotifications={() => void handleSaveClientNotifications()}
            />
            <ClientNotificationsPage
              active={activePage === "notifications"}
              notifications={notificationJobs as DashboardNotificationJobLite[]}
              selectedNotificationId={selectedNotificationId}
              timelineEvents={portalData.scopedTimelineEvents}
              onClose={() => setActivePage("dashboard")}
              onSelectNotification={(id) => setSelectedNotificationId(id)}
              onToggleRead={(id, nextRead) => void handleMarkNotificationRead(id, nextRead)}
              onMarkAllRead={() => void handleMarkAllNotificationsRead()}
            />
            <ClientSupportPage
              active={activePage === "support" || activePage === "team"}
              teamMembers={teamMembers}
              onOpenMessages={() => setActivePage("messages")}
              openTickets={openTickets}
              onSubmitTicket={(subject, _category, _priority, _message) => {
                setFeedback({ tone: "success", message: `Support ticket submitted: ${subject}` });
              }}
            />
            <ClientReviewsPage active={activePage === "reviews"} />
            <ClientCalendarPage active={activePage === "calendar"} />
            <ClientBrandPage active={activePage === "brand"} />
            <ClientAnalyticsPage active={activePage === "analytics"} />
            <ClientPaymentsPage active={activePage === "payments"} />
            <ClientContractsPage active={activePage === "contracts"} />
            <ClientFeedbackPage active={activePage === "feedback"} />
            <ClientExportsPage active={activePage === "exports"} />
            <ClientResourcesPage active={activePage === "resources"} />
            <ClientReferralsPage active={activePage === "referrals"} />
            <ClientIntegrationsPage active={activePage === "integrations"} />
          </div>
        </div>
      </div>

      {/* ── Keyboard Shortcuts Modal ── */}
      {shortcutsOpen ? (
        <div className={cx("overlay")} onClick={() => setShortcutsOpen(false)}>
          <div className={`${cx("modal")} ${cx("modalShortcuts")}`} onClick={e => e.stopPropagation()}>
            <div className={cx("modalHeader")}>
              <span className={cx("modalTitle")}>Keyboard Shortcuts</span>
              <button className={cx("modalClose")} onClick={() => setShortcutsOpen(false)} type="button">&#x2715;</button>
            </div>
            <div className={cx("shortcutGrid")}>
              {SHORTCUTS.map(s => (
                <div key={s.key} className={cx("shortcutRow")}>
                  <span className={cx("shortcutKey")}>{s.key}</span>
                  <span className={cx("shortcutDesc")}>{s.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Session Timeout Modal ── */}
      {showTimeoutWarning ? (
        <div className={cx("overlay")}>
          <div className={`${cx("modal")} ${cx("modalTimeout")}`} onClick={e => e.stopPropagation()}>
            <div className={cx("modalHeader")}>
              <span className={cx("modalTitle")}>Session Expiring</span>
            </div>
            <div className={cx("modalTimeoutBody")}>
              <div className={cx("timeoutCountdown")}>{formatTime(remainingSeconds)}</div>
              <div className={cx("timeoutText")}>Your session is about to expire due to inactivity. Would you like to continue?</div>
              <div className={cx("timeoutActions")}>
                <button className={`${cx("button")} ${cx("buttonAccent")}`} onClick={extendSession} type="button">Extend Session</button>
                <button className={`${cx("button")} ${cx("buttonGhost")}`} onClick={() => window.location.href = "/logout"} type="button">Log Out</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
    </DashboardProvider>
  );
}
