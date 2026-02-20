"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { DM_Mono, Instrument_Serif, Syne } from "next/font/google";
import {
  createPortalConversationWithRefresh,
  createPortalChangeRequestWithRefresh,
  createPortalInvoiceWithRefresh,
  createPortalPaymentWithRefresh,
  createPortalProjectRequestWithRefresh,
  generatePortalHandoffSummaryWithRefresh,
  getPortalPreferenceWithRefresh,
  loadConversationMessagesWithRefresh,
  loadPortalChangeRequestsWithRefresh,
  loadPortalMilestoneApprovalsWithRefresh,
  loadPortalBlockersWithRefresh,
  loadPortalNotificationsWithRefresh,
  loadPortalProjectCollaborationWithRefresh,
  loadPortalProjectDetailWithRefresh,
  loadPortalTimelineWithRefresh,
  setPortalNotificationReadStateWithRefresh,
  setPortalPreferenceWithRefresh,
  updatePortalChangeRequestWithRefresh,
  updatePortalMessageDeliveryWithRefresh,
  updatePortalMilestoneApprovalWithRefresh,
  type PortalProjectRequestBuildMode,
  type PortalProjectRequestComplexity,
  type PortalProjectRequestDesignPackage,
  type PortalProjectRequestAddonOption,
  type PortalProjectRequestServiceOption,
  type PortalProjectRequestServiceType,
  type PortalProjectChangeRequest,
  type PortalProjectCollaboration,
  type PortalMilestoneApproval,
  type PortalMessage,
  type PortalProjectDetail
} from "../../lib/api/portal";
import { usePortalWorkspace } from "../../lib/auth/use-portal-workspace";
import { useRealtimeRefresh } from "../../lib/auth/use-realtime-refresh";
import { useCursorTrail } from "../shared/use-cursor-trail";
import { useDelayedFlag } from "../shared/use-delayed-flag";
import { pageTitles } from "./maphari-dashboard/constants";
import { cx, styles } from "./maphari-dashboard/style";
import { ClientSidebar } from "./maphari-dashboard/sidebar";
import { ClientTopbar } from "./maphari-dashboard/topbar";
import { ClientDashboardPage } from "./maphari-dashboard/pages/dashboard-page";
import { ClientAutomationPage } from "./maphari-dashboard/pages/automation-page";
import { ClientInvoicesPage } from "./maphari-dashboard/pages/invoices-page";
import { ClientMessagesPage } from "./maphari-dashboard/pages/messages-page";
import { ClientProjectsPage } from "./maphari-dashboard/pages/projects-page";
import { ClientSettingsPage } from "./maphari-dashboard/pages/settings-page";
import { ClientCreateProjectPage } from "./maphari-dashboard/pages/create-project-page";
import { ClientDocumentsPage } from "./maphari-dashboard/pages/documents-page";
import onboardingTourStyles from "./maphari-dashboard/pages/onboarding-tour.module.css";
import type {
  ActionCenterItem,
  ActionItem,
  ActivityItem,
  ApprovalQueueItem,
  ConfidenceSummary,
  DashboardStat,
  DecisionLogItem,
  LoginDigestItem,
  NavItem,
  OnboardingChecklistItem,
  PageId,
  RiskItem,
  ThreadPreview,
  TimelineItem
} from "./maphari-dashboard/types";
import { formatDateLong, formatDateShort, formatMoney, formatRelative, formatStatus, getInitials, isPast } from "./maphari-dashboard/utils";
import { useCurrencyConverter } from "../../lib/i18n/exchange-rates";

type TopbarDateRange = "7d" | "30d" | "90d" | "all";

type CommandResult =
  | { id: string; kind: "page"; label: string; detail: string; page: PageId }
  | { id: string; kind: "project"; label: string; detail: string; projectId: string }
  | { id: string; kind: "conversation"; label: string; detail: string; conversationId: string }
  | { id: string; kind: "invoice"; label: string; detail: string }
  | { id: string; kind: "milestone"; label: string; detail: string; projectId: string }
  | { id: string; kind: "notification"; label: string; detail: string; page: PageId; notificationId: string };

type ClientProjectEstimate = {
  totalCents: number;
  deposit50Cents: number;
  milestone30Cents: number;
  handoff20Cents: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  lineItems: Array<{ label: string; amountCents: number }>;
  assumptions: string[];
};

type ClientTourStep = {
  title: string;
  detail: string;
  mustComplete?: boolean;
  targetId?: string;
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
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [topbarProjectId, setTopbarProjectId] = useState<string | null>(null);
  const [topbarDateRange, setTopbarDateRange] = useState<TopbarDateRange>("30d");
  const [activeInvoiceTab, setActiveInvoiceTab] = useState<"all" | "outstanding" | "paid">("all");
  const [projectDetails, setProjectDetails] = useState<PortalProjectDetail[]>([]);
  const [projectCollaborationById, setProjectCollaborationById] = useState<Record<string, PortalProjectCollaboration>>({});
  const [milestoneApprovals, setMilestoneApprovals] = useState<Record<string, PortalMilestoneApproval>>({});
  const [messagePreviewMap, setMessagePreviewMap] = useState<Record<string, PortalMessage | null>>({});
  const [notificationJobs, setNotificationJobs] = useState<Array<{
    id: string;
    status: string;
    tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations";
    readAt: string | null;
  }>>([]);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);
  const [handoffSummary, setHandoffSummary] = useState<{
    docs: number;
    decisions: number;
    blockers: number;
    generatedAt: string;
  } | null>(null);
  const [blockers, setBlockers] = useState<Array<{
    id: string;
    projectId: string;
    title: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
    ownerName: string | null;
    etaAt: string | null;
    updatedAt: string;
  }>>([]);
  const [timelineEvents, setTimelineEvents] = useState<Array<{
    id: string;
    category: "PROJECT" | "LEAD" | "BLOCKER";
    title: string;
    detail: string | null;
    createdAt: string;
  }>>([]);
  const [changeRequests, setChangeRequests] = useState<PortalProjectChangeRequest[]>([]);
  const [changeRequestForm, setChangeRequestForm] = useState({
    projectId: "",
    title: "",
    description: "",
    reason: "",
    impactSummary: ""
  });
  const [submittingChangeRequest, setSubmittingChangeRequest] = useState(false);
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
  const [clientTourOpen, setClientTourOpen] = useState(false);
  const [clientTourStep, setClientTourStep] = useState(0);
  const [clientTourLayout, setClientTourLayout] = useState<{
    spotlight: { top: number; left: number; width: number; height: number } | null;
    tooltip: { top?: number; left?: number; right?: number; bottom?: number; transform?: string };
  }>({
    spotlight: null,
    tooltip: { top: 0, left: 0 }
  });
  const [submittingProjectRequest, setSubmittingProjectRequest] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [composeMessage, setComposeMessage] = useState("");
  const [threadSearch, setThreadSearch] = useState("");
  const [topbarSearch, setTopbarSearch] = useState("");
  const [commandSearchOpen, setCommandSearchOpen] = useState(false);
  const [commandSearchValue, setCommandSearchValue] = useState("");
  const [notificationsTrayOpen, setNotificationsTrayOpen] = useState(false);
  const [newThreadSubject, setNewThreadSubject] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [quickComposeOpen, setQuickComposeOpen] = useState(false);
  const [quickComposeSubject, setQuickComposeSubject] = useState("");
  const [quickComposeBody, setQuickComposeBody] = useState("");
  const [quickComposeProjectId, setQuickComposeProjectId] = useState<string | null>(null);
  const [quickComposeCreating, setQuickComposeCreating] = useState(false);
  const [settingsProfile, setSettingsProfile] = useState({
    fullName: "there",
    email: "",
    company: "Client",
    phone: "",
    currency: "AUTO"
  });
  const [settingsNotifications, setSettingsNotifications] = useState({
    projectUpdates: true,
    invoiceReminders: true,
    newMessages: true,
    weeklyDigest: false,
    marketingEmails: false
  });
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const commandSearchInputRef = useRef<HTMLInputElement>(null);
  const quickComposeSubjectRef = useRef<HTMLInputElement>(null);
  const savedViewBaseRef = useRef<Record<string, unknown>>({});
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

  useCursorTrail(cursorRef, ringRef, { cursorOffset: 5, ringOffset: 17, easing: 0.11 });
  const animateProgress = useDelayedFlag(activePage, 200);

  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `maphari:last-login:${session.user.email}`;
    const previous = window.localStorage.getItem(key);
    queueMicrotask(() => {
      setLastLoginAt(previous);
    });
    window.localStorage.setItem(key, new Date().toISOString());
  }, [session?.user?.email]);

  useEffect(() => {
    if (!session?.user?.email) return;
    const tourKey = `maphari:tour:client:${session.user.email}`;
    if (!window.localStorage.getItem(tourKey)) {
      queueMicrotask(() => setClientTourOpen(true));
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (!actionFeedback) return;
    const timeoutId = window.setTimeout(() => setActionFeedback(null), 4200);
    return () => window.clearTimeout(timeoutId);
  }, [actionFeedback]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandSearchValue(topbarSearch);
        setCommandSearchOpen(true);
        return;
      }
      if (event.key === "Escape") {
        setCommandSearchOpen(false);
        setQuickComposeOpen(false);
        setNotificationsTrayOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [topbarSearch]);

  useEffect(() => {
    if (!commandSearchOpen) return;
    commandSearchInputRef.current?.focus();
  }, [commandSearchOpen]);

  useEffect(() => {
    if (!quickComposeOpen) return;
    quickComposeSubjectRef.current?.focus();
  }, [quickComposeOpen]);


  const projects = useMemo(() => snapshot.projects ?? [], [snapshot.projects]);
  const invoices = useMemo(() => snapshot.invoices ?? [], [snapshot.invoices]);
  const displayCurrency = settingsProfile.currency || invoices[0]?.currency || "AUTO";
  const { convert: convertMoney } = useCurrencyConverter(displayCurrency);
  const conversations = useMemo(() => snapshot.conversations ?? [], [snapshot.conversations]);
  const fileById = useMemo(() => new Map(snapshot.files.map((file) => [file.id, file])), [snapshot.files]);
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [projects]);
  const resolvedSelectedProjectId = selectedProjectId && projects.some((project) => project.id === selectedProjectId)
    ? selectedProjectId
    : null;
  const resolvedTopbarProjectId = topbarProjectId && projects.some((project) => project.id === topbarProjectId)
    ? topbarProjectId
    : null;
  const projectScopeId = resolvedTopbarProjectId ?? resolvedSelectedProjectId;
  const resolvedQuickComposeProjectId =
    quickComposeProjectId && projects.some((project) => project.id === quickComposeProjectId)
      ? quickComposeProjectId
      : null;
  const nowTs = useMemo(() => new Date().getTime(), []);
  const isWithinSelectedDateRange = useCallback(
    (dateValue?: string | null): boolean => {
      if (topbarDateRange === "all") return true;
      if (!dateValue) return false;
      const timestamp = new Date(dateValue).getTime();
      if (Number.isNaN(timestamp)) return false;
      const now = Date.now();
      const days = topbarDateRange === "7d" ? 7 : topbarDateRange === "30d" ? 30 : 90;
      return now - timestamp <= days * 24 * 60 * 60 * 1000;
    },
    [topbarDateRange]
  );
  const projectScopedConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        if (projectScopeId && conversation.projectId !== projectScopeId) return false;
        return isWithinSelectedDateRange(conversation.updatedAt);
      }),
    [conversations, isWithinSelectedDateRange, projectScopeId]
  );
  const projectScopedProjects = useMemo(
    () =>
      projects.filter((project) => {
        if (projectScopeId && project.id !== projectScopeId) return false;
        return isWithinSelectedDateRange(project.updatedAt);
      }),
    [isWithinSelectedDateRange, projectScopeId, projects]
  );
  const sortedScopedProjects = useMemo(
    () => [...projectScopedProjects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [projectScopedProjects]
  );
  const openThreads = useMemo(
    () => projectScopedConversations.filter((conversation) => conversation.status === "OPEN"),
    [projectScopedConversations]
  );
  const dateScopedInvoices = useMemo(
    () => invoices.filter((invoice) => isWithinSelectedDateRange(invoice.updatedAt)),
    [invoices, isWithinSelectedDateRange]
  );
  const scopedOutstandingInvoices = useMemo(
    () => dateScopedInvoices.filter((invoice) => invoice.status === "ISSUED" || invoice.status === "OVERDUE"),
    [dateScopedInvoices]
  );
  const outstandingInvoices = scopedOutstandingInvoices;
  const overdueInvoices = useMemo(
    () => dateScopedInvoices.filter((invoice) => invoice.status === "OVERDUE"),
    [dateScopedInvoices]
  );
  const effectiveProjectDetails = useMemo(
    () => (projects.length === 0 ? [] : projectDetails),
    [projectDetails, projects.length]
  );
  const scopedProjectDetails = useMemo(
    () =>
      effectiveProjectDetails.filter((detail) => {
        if (projectScopeId && detail.id !== projectScopeId) return false;
        return true;
      }),
    [effectiveProjectDetails, projectScopeId]
  );
  const effectiveMessagePreviewMap = useMemo(
    () => (conversations.length === 0 ? {} : messagePreviewMap),
    [conversations.length, messagePreviewMap]
  );
  const projectDetailsLoading = Boolean(session && projectScopedProjects.length > 0 && scopedProjectDetails.length === 0);

  useEffect(() => {
    if (!session || projects.length === 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const detailResponses = await Promise.all(
        projects.map((project) => loadPortalProjectDetailWithRefresh(session, project.id))
      );

      if (cancelled) return;
      const details = detailResponses
        .map((result) => result.data)
        .filter((detail): detail is PortalProjectDetail => Boolean(detail));

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
      const responses = await Promise.all(
        projects.map((project) => loadPortalProjectCollaborationWithRefresh(session, project.id))
      );
      if (cancelled) return;
      const next: Record<string, PortalProjectCollaboration> = {};
      responses.forEach((response) => {
        if (response.data) {
          next[response.data.projectId] = response.data;
        }
      });
      setProjectCollaborationById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [projects, session]);

  useEffect(() => {
    if (!session || projects.length === 0) return;
    let cancelled = false;
    void (async () => {
      const approvals = await loadPortalMilestoneApprovalsWithRefresh(session);
      if (cancelled) return;
      const map: Record<string, PortalMilestoneApproval> = {};
      (approvals.data ?? []).forEach((approval) => {
        map[approval.milestoneId] = approval;
      });
      setMilestoneApprovals(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [projects.length, session]);

  useEffect(() => {
    if (!session || conversations.length === 0) {
      return;
    }

    let cancelled = false;
    const topThreads = [...conversations]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);

    void (async () => {
      const results = await Promise.all(
        topThreads.map(async (conversation) => {
          const messages = await loadConversationMessagesWithRefresh(session, conversation.id);
          const lastMessage = messages.data?.[messages.data.length - 1] ?? null;
          return [conversation.id, lastMessage] as const;
        })
      );

      if (cancelled) return;
      const nextMap: Record<string, PortalMessage | null> = {};
      results.forEach(([id, message]) => {
        nextMap[id] = message;
      });
      setMessagePreviewMap(nextMap);
    })();

    return () => {
      cancelled = true;
    };
  }, [conversations, session]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const [blockersResult, timelineResult, changeRequestsResult] = await Promise.all([
        loadPortalBlockersWithRefresh(session, { limit: 80 }),
        loadPortalTimelineWithRefresh(session, { limit: 80 }),
        loadPortalChangeRequestsWithRefresh(session, { limit: 80 })
      ]);
      if (cancelled) return;
      setBlockers(blockersResult.data ?? []);
      setTimelineEvents(timelineResult.data ?? []);
      setChangeRequests(changeRequestsResult.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const result = await loadPortalNotificationsWithRefresh(session, { unreadOnly: false });
      if (cancelled || !result.nextSession) return;
      setNotificationJobs(result.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const handleRealtimeRefresh = useCallback(() => {
    if (!session) return;
    void (async () => {
      const [notificationsResult, blockersResult, timelineResult, changeRequestsResult] = await Promise.all([
        loadPortalNotificationsWithRefresh(session, { unreadOnly: false }),
        loadPortalBlockersWithRefresh(session, { limit: 80 }),
        loadPortalTimelineWithRefresh(session, { limit: 80 }),
        loadPortalChangeRequestsWithRefresh(session, { limit: 80 })
      ]);
      if (notificationsResult.data) setNotificationJobs(notificationsResult.data);
      if (blockersResult.data) setBlockers(blockersResult.data);
      if (timelineResult.data) setTimelineEvents(timelineResult.data);
      if (changeRequestsResult.data) setChangeRequests(changeRequestsResult.data);
    })();
  }, [session]);

  useRealtimeRefresh(session, handleRealtimeRefresh);

  useEffect(() => {
    if (!session) return;
    const tab = activePage === "dashboard" ? "dashboard" : activePage === "automations" ? "operations" : activePage;
    const unreadForTab = notificationJobs.filter((job) => !job.readAt && job.tab === tab);
    if (unreadForTab.length === 0) return;
    void Promise.all(
      unreadForTab.map((job) => setPortalNotificationReadStateWithRefresh(session, job.id, true))
    ).then(() => {
      setNotificationJobs((previous) =>
        previous.map((job) =>
          unreadForTab.some((target) => target.id === job.id)
            ? { ...job, readAt: new Date().toISOString() }
            : job
        )
      );
    });
  }, [activePage, notificationJobs, session]);

  const unreadByTab = useMemo(() => {
    const map = {
      dashboard: 0,
      projects: 0,
      invoices: 0,
      messages: 0,
      operations: 0,
      settings: 0
    };
    notificationJobs.forEach((job) => {
      if (job.readAt) return;
      if (job.tab in map) {
        map[job.tab as keyof typeof map] += 1;
      }
    });
    return map;
  }, [notificationJobs]);
  const totalUnreadNotifications = useMemo(
    () =>
      unreadByTab.dashboard +
      unreadByTab.projects +
      unreadByTab.invoices +
      unreadByTab.messages +
      unreadByTab.operations +
      unreadByTab.settings,
    [unreadByTab]
  );
  const scopedBlockers = useMemo(
    () =>
      blockers.filter((item) => {
        if (projectScopeId && item.projectId !== projectScopeId) return false;
        return true;
      }),
    [blockers, projectScopeId]
  );
  const scopedTimelineEvents = useMemo(
    () =>
      timelineEvents.filter((event) => {
        if (!projectScopeId) return true;
        return event.projectId === projectScopeId;
      }),
    [projectScopeId, timelineEvents]
  );
  const scopedChangeRequests = useMemo(
    () =>
      changeRequests.filter((request) => {
        if (projectScopeId && request.projectId !== projectScopeId) return false;
        return true;
      }),
    [changeRequests, projectScopeId]
  );

  const navItems = useMemo<NavItem[]>(
    () => {
      return [
        {
          id: "dashboard",
          label: "Dashboard",
          section: "Overview",
          badge: unreadByTab.dashboard > 0 ? { value: String(unreadByTab.dashboard) } : undefined
        },
        {
          id: "projects",
          label: "My Projects",
          section: "Projects",
          badge: unreadByTab.projects > 0 ? { value: String(unreadByTab.projects) } : undefined
        },
        {
          id: "create",
          label: "Create Request",
          section: "Projects"
        },
        {
          id: "docs",
          label: "Documents",
          section: "Projects"
        },
        {
          id: "invoices",
          label: "Invoices",
          section: "Finance",
          badge: unreadByTab.invoices > 0
            ? {
                value: String(unreadByTab.invoices),
                tone: overdueInvoices.length > 0 ? "red" : "amber"
              }
            : undefined
        },
        {
          id: "messages",
          label: "Messages",
          section: "Communication",
          badge: unreadByTab.messages > 0 ? { value: String(unreadByTab.messages), tone: "amber" } : undefined
        },
        {
          id: "automations",
          label: "Automations",
          section: "Communication",
          badge: unreadByTab.operations > 0 ? { value: String(unreadByTab.operations), tone: "amber" } : undefined
        },
        {
          id: "settings",
          label: "Settings",
          section: "Account",
          badge: unreadByTab.settings > 0 ? { value: String(unreadByTab.settings) } : undefined
        }
      ];
    },
    [overdueInvoices.length, unreadByTab]
  );

  const navSections = useMemo(() => {
    const sections = new Map<string, NavItem[]>();
    navItems.forEach((item) => {
      if (!sections.has(item.section)) {
        sections.set(item.section, []);
      }
      sections.get(item.section)?.push(item);
    });
    return Array.from(sections.entries());
  }, [navItems]);

  const [topbarEyebrow, topbarTitle] = pageTitles[activePage];
  const searchQuery = topbarSearch.trim().toLowerCase();

  const activeProjectId =
    resolvedSelectedProjectId
      ? resolvedSelectedProjectId
      : sortedProjects[0]?.id ?? null;
  const activeProjectName = projects.find((project) => project.id === activeProjectId)?.name ?? "No active project";
  const defaultProjectName = sortedProjects[0]?.name ?? "Unassigned";

  const projectRows = useMemo(
    () =>
      sortedScopedProjects.slice(0, 3).map((project) => {
        const status = project.status;
        const statusTone =
          status === "IN_PROGRESS" || status === "COMPLETED"
            ? "bgGreen"
            : status === "REVIEW"
            ? "bgAmber"
            : status === "PLANNING"
            ? "bgPurple"
            : status === "ON_HOLD" || status === "CANCELLED"
            ? "bgRed"
            : "bgMuted";
        const progressTone =
          status === "IN_PROGRESS" || status === "COMPLETED"
            ? "pfGreen"
            : status === "REVIEW"
            ? "pfAmber"
            : status === "PLANNING"
            ? "pfPurple"
            : "pfGreen";
        return {
          id: project.id,
          name: project.name,
          subtitle: project.description ?? `${project.priority} priority`,
          status: formatStatus(status),
          statusTone,
          progress: project.progressPercent ?? 0,
          progressTone,
          due: project.dueAt ? formatDateShort(project.dueAt) : "TBD",
          dueTone: project.dueAt && isPast(project.dueAt) ? "var(--red)" : "var(--muted)"
        };
      }),
    [sortedScopedProjects]
  );

  const allMilestones = useMemo(() => {
    return scopedProjectDetails.flatMap((detail) =>
      detail.milestones.map((milestone) => ({ milestone, projectId: detail.id }))
    );
  }, [scopedProjectDetails]);
  const scopedMilestones = useMemo(
    () =>
      allMilestones.filter((entry) => {
        return isWithinSelectedDateRange(entry.milestone.updatedAt);
      }),
    [allMilestones, isWithinSelectedDateRange]
  );

  const milestoneRows = useMemo(() => {
    return scopedMilestones
      .filter((entry) => entry.milestone.dueAt || entry.milestone.status !== "COMPLETED")
      .sort((a, b) => {
        const aTime = a.milestone.dueAt ? new Date(a.milestone.dueAt).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.milestone.dueAt ? new Date(b.milestone.dueAt).getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      })
      .slice(0, 6)
      .map((entry) => {
        const milestone = entry.milestone;
        const status: "" | "done" | "now" =
          milestone.status === "COMPLETED" ? "done" : milestone.status === "IN_PROGRESS" ? "now" : "";
        const dateLabel = milestone.dueAt ? `${isPast(milestone.dueAt) ? "Overdue" : "Due"} · ${formatDateShort(milestone.dueAt)}` : "Planned";
        const fileName = milestone.fileId ? fileById.get(milestone.fileId)?.fileName ?? null : null;
        return {
          id: milestone.id,
          title: milestone.title,
          date: dateLabel,
          status,
          highlight: milestone.status === "IN_PROGRESS" || isPast(milestone.dueAt ?? null),
          fileName,
          approval: milestoneApprovals[milestone.id]?.status ?? "PENDING"
        };
      });
  }, [fileById, milestoneApprovals, scopedMilestones]);
  const pendingApprovalCount = milestoneRows.filter((row) => row.approval === "PENDING").length;

  const clientAutomationRows = useMemo(
    () => [
      {
        id: "client-status-sync",
        name: "Project Status Sync",
        trigger: "Project and milestone updates",
        status: projectScopedProjects.length > 0 ? "active" as const : "draft" as const,
        impact: `${projectScopedProjects.length} project${projectScopedProjects.length === 1 ? "" : "s"} tracked`,
        lastEvent: scopedTimelineEvents[0] ? formatRelative(scopedTimelineEvents[0].createdAt) : "No events yet"
      },
      {
        id: "client-invoice-reminders",
        name: "Invoice Reminder Engine",
        trigger: "Invoice due and overdue dates",
        status: overdueInvoices.length > 0 ? "risk" as const : outstandingInvoices.length > 0 ? "watch" as const : "active" as const,
        impact: `${outstandingInvoices.length} outstanding invoice${outstandingInvoices.length === 1 ? "" : "s"}`,
        lastEvent: scopedTimelineEvents[1] ? formatRelative(scopedTimelineEvents[1].createdAt) : "No events yet"
      },
      {
        id: "client-approvals",
        name: "Milestone Approval Requests",
        trigger: "Milestones waiting on client decision",
        status: pendingApprovalCount > 0 ? "watch" as const : "active" as const,
        impact: `${pendingApprovalCount} pending approval${pendingApprovalCount === 1 ? "" : "s"}`,
        lastEvent: scopedTimelineEvents[2] ? formatRelative(scopedTimelineEvents[2].createdAt) : "No events yet"
      },
      {
        id: "client-thread-alerts",
        name: "Thread Response Alerts",
        trigger: "New messages and escalation notices",
        status: unreadByTab.messages > 0 ? "watch" as const : "active" as const,
        impact: `${openThreads.length} active thread${openThreads.length === 1 ? "" : "s"}`,
        lastEvent: scopedTimelineEvents[3] ? formatRelative(scopedTimelineEvents[3].createdAt) : "No events yet"
      }
    ],
    [
      openThreads.length,
      outstandingInvoices.length,
      overdueInvoices.length,
      pendingApprovalCount,
      projectScopedProjects.length,
      scopedTimelineEvents,
      unreadByTab.messages
    ]
  );

  const handleMilestoneApproval = async (
    milestoneId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
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
      setChangeRequests((previous) => [created.data!, ...previous]);
      setChangeRequestForm((previous) => ({
        ...previous,
        title: "",
        description: "",
        reason: "",
        impactSummary: ""
      }));
      setActionFeedback({ tone: "success", message: "Change request submitted successfully." });
    } else {
      setActionFeedback({ tone: "error", message: created.error?.message ?? "Unable to submit change request." });
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
      setActionFeedback({ tone: "error", message: updated.error?.message ?? "Unable to update change request." });
      return;
    }
    setChangeRequests((previous) =>
      previous.map((item) => (item.id === changeRequestId ? updated.data! : item))
    );
    setActionFeedback({
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
      confidence:
        form.selectedServices.length === 0 || form.scopePrompt.trim().length < 20 ? "MEDIUM" : "HIGH",
      lineItems,
      assumptions: [
        "Domain, hosting, and third-party subscription costs are paid directly by the client.",
        "Scope changes after approval may increase the total estimate.",
        "50% deposit is required before request submission is sent to admin."
      ]
    };
  }, []);
  void buildProjectEstimate;

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
      setActionFeedback({ tone: "error", message: invoice.error?.message ?? "Unable to create deposit invoice." });
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
      setActionFeedback({ tone: "error", message: payment.error?.message ?? "Deposit payment failed." });
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
      setActionFeedback({ tone: "error", message: created.error?.message ?? "Unable to submit project request." });
      return;
    }

    setProjectRequestForm({
      name: "",
      description: "",
      serviceType: "AUTO_RECOMMEND",
      selectedServices: ["WEB_DEVELOPMENT"],
      addonServices: [],
      buildMode: "AUTO",
      complexity: "STANDARD",
      designPackage: "NONE",
      websitePageCount: "5",
      appScreenCount: "6",
      integrationsCount: "1",
      targetPlatforms: ["WEB"],
      requiresContentSupport: true,
      requiresDomainAndHosting: true,
      scopePrompt: "",
      desiredStartAt: "",
      desiredDueAt: "",
      estimatedBudgetCents: "",
      priority: "MEDIUM",
      agreementFileId: ""
    });
    setProjectRequestEstimate(null);
    await refreshSnapshot(created.nextSession ?? payment.nextSession ?? invoice.nextSession ?? session, { background: true });
    setActionFeedback({ tone: "success", message: "Project request submitted with 50% deposit confirmation." });
  };

  const projectCards = useMemo(() => {
    const source = effectiveProjectDetails.length
      ? scopedProjectDetails
      : projectScopedProjects.map((project) => ({
          ...project,
          milestones: [],
          tasks: [],
          dependencies: [],
          activities: []
        }));
    return source.map((project) => {
      const collaboration = projectCollaborationById[project.id];
      const collaborators = collaboration?.contributors ?? [];
      const activeSessions = collaboration?.sessions?.filter((session) => session.status === "ACTIVE").length ?? 0;
      const statusTone =
        project.status === "IN_PROGRESS" || project.status === "COMPLETED"
          ? "bgGreen"
          : project.status === "REVIEW"
          ? "bgAmber"
          : project.status === "PLANNING"
          ? "bgPurple"
          : project.status === "ON_HOLD" || project.status === "CANCELLED"
          ? "bgRed"
          : "bgMuted";
      const progressTone =
        project.status === "IN_PROGRESS" || project.status === "COMPLETED"
          ? "pfGreen"
          : project.status === "REVIEW"
          ? "pfAmber"
          : project.status === "PLANNING"
          ? "pfPurple"
          : "pfGreen";
      return {
        id: project.id,
        name: project.name,
        status: project.status,
        statusTone,
        progressTone,
        progressPercent: project.progressPercent ?? 0,
        dueAt: project.dueAt,
        description: project.description,
        priority: project.priority,
        ownerName: project.ownerName,
        budgetCents: project.budgetCents ?? 0,
        collaborators,
        activeSessions,
        milestones: project.milestones ?? []
      };
    });
  }, [effectiveProjectDetails.length, projectCollaborationById, projectScopedProjects, scopedProjectDetails]);

  const recentThreads = useMemo<ThreadPreview[]>(() => {
    const palette = ["var(--accent)", "var(--purple)", "var(--amber)"];
    return [...projectScopedConversations]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .map((conversation, index) => {
        const lastMessage = effectiveMessagePreviewMap[conversation.id];
        const projectName = projects.find((project) => project.id === conversation.projectId)?.name ?? "General";
        return {
          id: conversation.id,
          sender: conversation.subject,
          project: projectName,
          time: formatRelative(conversation.updatedAt),
          preview: lastMessage?.content ?? conversation.subject,
          avatar: {
            label: getInitials(conversation.subject),
            bg: palette[index % palette.length],
            color: index % palette.length === 1 ? "#fff" : "#050508"
          },
          unread: conversation.status === "OPEN"
        };
      });
  }, [effectiveMessagePreviewMap, projectScopedConversations, projects]);

  const allMessageThreads = useMemo<ThreadPreview[]>(() => {
    const palette = ["var(--accent)", "var(--purple)", "var(--amber)", "var(--surface2)"];
    return [...projectScopedConversations]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((conversation, index) => {
        const lastMessage = effectiveMessagePreviewMap[conversation.id];
        const projectName = projects.find((project) => project.id === conversation.projectId)?.name ?? "General";
        return {
          id: conversation.id,
          sender: conversation.subject,
          project: projectName,
          time: formatRelative(conversation.updatedAt),
          preview: lastMessage?.content ?? conversation.subject,
          avatar: {
            label: getInitials(conversation.subject),
            bg: palette[index % palette.length],
            color: index % palette.length === 1 ? "#fff" : index % palette.length === 3 ? "var(--muted)" : "#050508",
            bordered: index % palette.length === 3
          },
          unread: conversation.status === "OPEN"
        };
      });
  }, [effectiveMessagePreviewMap, projectScopedConversations, projects]);

  const messageThreads = useMemo<ThreadPreview[]>(() => {
    const q = [searchQuery, threadSearch.trim().toLowerCase()].filter(Boolean).join(" ");
    if (!q) return allMessageThreads;
    return allMessageThreads.filter((thread) => {
      return (
        thread.sender.toLowerCase().includes(q) ||
        thread.project.toLowerCase().includes(q) ||
        thread.preview.toLowerCase().includes(q)
      );
    });
  }, [allMessageThreads, searchQuery, threadSearch]);

  const commandResults = useMemo<CommandResult[]>(() => {
    const q = commandSearchValue.trim().toLowerCase();
    const include = (value: string) => !q || value.toLowerCase().includes(q);
    const results: CommandResult[] = [];

    [
      { id: "dashboard", label: "Open Dashboard", detail: "Navigate to overview", page: "dashboard" as const },
      { id: "projects", label: "Open Projects", detail: "Navigate to project workspace", page: "projects" as const },
      { id: "invoices", label: "Open Invoices", detail: "Navigate to billing", page: "invoices" as const },
      { id: "messages", label: "Open Messages", detail: "Navigate to threads", page: "messages" as const },
      { id: "automations", label: "Open Automations", detail: "Navigate to automation stream", page: "automations" as const },
      { id: "settings", label: "Open Settings", detail: "Navigate to account settings", page: "settings" as const }
    ].forEach((item) => {
      if (include(`${item.label} ${item.detail}`)) {
        results.push({ id: `page-${item.id}`, kind: "page", label: item.label, detail: item.detail, page: item.page });
      }
    });

    projectScopedProjects.slice(0, 12).forEach((project) => {
      if (include(`${project.name} ${project.status} ${project.description ?? ""}`)) {
        results.push({
          id: `project-${project.id}`,
          kind: "project",
          label: project.name,
          detail: `Project · ${formatStatus(project.status)}`,
          projectId: project.id
        });
      }
    });

    allMessageThreads.slice(0, 12).forEach((thread) => {
      if (include(`${thread.sender} ${thread.project} ${thread.preview}`)) {
        results.push({
          id: `conversation-${thread.id}`,
          kind: "conversation",
          label: thread.sender,
          detail: `Thread · ${thread.project}`,
          conversationId: thread.id
        });
      }
    });

    dateScopedInvoices.slice(0, 8).forEach((invoice) => {
      const label = `Invoice ${invoice.number}`;
      if (include(`${label} ${invoice.status}`)) {
        results.push({
          id: `invoice-${invoice.id}`,
          kind: "invoice",
          label,
          detail: `${formatStatus(invoice.status)} · ${formatMoney(convertMoney(invoice.amountCents, invoice.currency), displayCurrency)}`
        });
      }
    });

    milestoneRows.slice(0, 12).forEach((milestone) => {
      const projectId = allMilestones.find((entry) => entry.milestone.id === milestone.id)?.projectId;
      if (!projectId) return;
      if (include(`${milestone.title} ${milestone.date} ${milestone.approval}`)) {
        results.push({
          id: `milestone-${milestone.id}`,
          kind: "milestone",
          label: milestone.title,
          detail: `Milestone · ${milestone.date}`,
          projectId
        });
      }
    });

    notificationJobs.slice(0, 12).forEach((job) => {
      const page =
        job.tab === "operations"
          ? "automations"
          : (job.tab as Exclude<PageId, "automations">);
      const label = job.readAt ? "Notification (Read)" : "Notification (Unread)";
      const detail = `${job.tab} · ${formatStatus(job.status)}`;
      if (include(`${label} ${detail}`)) {
        results.push({
          id: `notification-${job.id}`,
          kind: "notification",
          label,
          detail,
          page,
          notificationId: job.id
        });
      }
    });

    return results.slice(0, 16);
  }, [
    allMessageThreads,
    allMilestones,
    commandSearchValue,
    convertMoney,
    displayCurrency,
    dateScopedInvoices,
    milestoneRows,
    notificationJobs,
    projectScopedProjects
  ]);

  const invoiceRows = useMemo(() => {
    return dateScopedInvoices.map((invoice) => {
      const badgeTone =
        invoice.status === "OVERDUE"
          ? "red"
          : invoice.status === "PAID"
          ? "green"
          : invoice.status === "ISSUED"
          ? "amber"
          : "muted";
      return {
        id: invoice.number,
        sourceId: invoice.id,
        issued: invoice.issuedAt ? formatDateLong(invoice.issuedAt) : formatDateLong(invoice.createdAt),
        amount: formatMoney(convertMoney(invoice.amountCents, invoice.currency), displayCurrency),
        amountTone: invoice.status === "OVERDUE" ? "var(--red)" : undefined,
        badge: {
          label: invoice.status === "ISSUED" ? "Due Soon" : formatStatus(invoice.status),
          tone: badgeTone === "muted" ? "amber" : (badgeTone as "amber" | "red" | "green")
        },
        action: {
          label: invoice.status === "PAID" ? "PDF" : "Pay",
          tone: (invoice.status === "PAID" ? "ghost" : "accent") as "accent" | "ghost"
        }
      };
    });
  }, [convertMoney, dateScopedInvoices, displayCurrency]);

  const invoiceTableRows = useMemo(() => {
    return dateScopedInvoices.map((invoice) => {
      const badgeTone =
        invoice.status === "OVERDUE"
          ? "red"
          : invoice.status === "PAID"
          ? "green"
          : invoice.status === "ISSUED"
          ? "amber"
          : "muted";
      return {
        id: invoice.number,
        sourceId: invoice.id,
        status: invoice.status,
        project: defaultProjectName,
        issued: formatDateLong(invoice.issuedAt ?? invoice.createdAt),
        due: invoice.dueAt ? formatDateLong(invoice.dueAt) : "TBD",
        dueTone: invoice.dueAt && isPast(invoice.dueAt) ? "var(--red)" : "var(--muted)",
        amount: formatMoney(convertMoney(invoice.amountCents, invoice.currency), displayCurrency),
        amountTone: invoice.status === "OVERDUE" ? "var(--red)" : "var(--text)",
        badge: {
          label: invoice.status === "ISSUED" ? "Due Soon" : formatStatus(invoice.status),
          tone: badgeTone === "muted" ? "amber" : (badgeTone as "amber" | "red" | "green")
        },
        action: {
          label: invoice.status === "PAID" ? "Download PDF" : "Pay Now",
          tone: (invoice.status === "PAID" ? "ghost" : "accent") as "accent" | "ghost"
        }
      };
    });
  }, [convertMoney, dateScopedInvoices, defaultProjectName, displayCurrency]);

  const filteredInvoiceTable = useMemo(() => {
    if (activeInvoiceTab === "paid") {
      return invoiceTableRows.filter((row) => row.status === "PAID");
    }
    if (activeInvoiceTab === "outstanding") {
      return invoiceTableRows.filter((row) => row.status === "ISSUED" || row.status === "OVERDUE");
    }
    return invoiceTableRows;
  }, [activeInvoiceTab, invoiceTableRows]);

  const searchedProjectRows = useMemo(() => {
    if (!searchQuery) return projectRows;
    return projectRows.filter((row) => `${row.name} ${row.subtitle} ${row.status} ${row.due}`.toLowerCase().includes(searchQuery));
  }, [projectRows, searchQuery]);

  const searchedMilestoneRows = useMemo(() => {
    if (!searchQuery) return milestoneRows;
    return milestoneRows.filter((row) =>
      `${row.title} ${row.date} ${row.fileName ?? ""} ${row.approval}`.toLowerCase().includes(searchQuery)
    );
  }, [milestoneRows, searchQuery]);

  const searchedRecentThreads = useMemo(() => {
    if (!searchQuery) return recentThreads;
    return recentThreads.filter((row) =>
      `${row.sender} ${row.project} ${row.preview}`.toLowerCase().includes(searchQuery)
    );
  }, [recentThreads, searchQuery]);

  const searchedInvoiceRows = useMemo(() => {
    if (!searchQuery) return invoiceRows;
    return invoiceRows.filter((row) =>
      `${row.id} ${row.amount} ${row.badge.label}`.toLowerCase().includes(searchQuery)
    );
  }, [invoiceRows, searchQuery]);

  const searchedProjectCards = useMemo(() => {
    const scopedCards = projectScopeId ? projectCards.filter((row) => row.id === projectScopeId) : projectCards;
    if (!searchQuery) return scopedCards;
    return scopedCards.filter((row) =>
      `${row.name} ${row.description ?? ""} ${row.status} ${row.ownerName ?? ""}`.toLowerCase().includes(searchQuery)
    );
  }, [projectCards, projectScopeId, searchQuery]);

  const searchedFilteredInvoiceTable = useMemo(() => {
    if (!searchQuery) return filteredInvoiceTable;
    return filteredInvoiceTable.filter((row) =>
      `${row.id} ${row.project} ${row.amount} ${row.badge.label} ${row.status}`.toLowerCase().includes(searchQuery)
    );
  }, [filteredInvoiceTable, searchQuery]);

  const invoiceTabs = useMemo(
    () => [
      { id: "all" as const, label: `All (${invoiceTableRows.length})` },
      {
        id: "outstanding" as const,
        label: `Outstanding (${invoiceTableRows.filter((row) => row.status === "ISSUED" || row.status === "OVERDUE").length})`
      },
      { id: "paid" as const, label: `Paid (${invoiceTableRows.filter((row) => row.status === "PAID").length})` }
    ],
    [invoiceTableRows]
  );

  const invoiceSummaryStats = useMemo<DashboardStat[]>(() => {
    const outstandingTotal = scopedOutstandingInvoices.reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);
    const paidThisMonth = dateScopedInvoices.filter((invoice) => {
      if (!invoice.paidAt) return false;
      const paidDate = new Date(invoice.paidAt);
      const now = new Date();
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
    });
    const paidTotal = paidThisMonth.reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);
    const year = new Date().getFullYear();
    const billedYtd = dateScopedInvoices
      .filter((invoice) => {
        const created = new Date(invoice.createdAt);
        return created.getFullYear() === year;
      })
      .reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0);

    return [
      {
        label: "Outstanding",
        value: formatMoney(outstandingTotal, displayCurrency),
        delta: `${scopedOutstandingInvoices.length} invoice${scopedOutstandingInvoices.length === 1 ? "" : "s"} due`,
        tone: "var(--amber)",
        deltaTone: scopedOutstandingInvoices.length > 0 ? "deltaWarn" : "deltaUp"
      },
      {
        label: "Paid This Month",
        value: formatMoney(paidTotal, displayCurrency),
        delta: `${paidThisMonth.length} invoice${paidThisMonth.length === 1 ? "" : "s"} settled`,
        tone: "var(--accent)",
        deltaTone: "deltaUp"
      },
      {
        label: "Total Billed (YTD)",
        value: formatMoney(billedYtd, displayCurrency),
        delta: `${projectScopedProjects.length} scoped project${projectScopedProjects.length === 1 ? "" : "s"}`,
        tone: "transparent",
        deltaTone: ""
      }
    ];
  }, [convertMoney, dateScopedInvoices, displayCurrency, projectScopedProjects.length, scopedOutstandingInvoices]);

  const dashboardStats = useMemo<DashboardStat[]>(() => {
    const activeProjects = projectScopedProjects.filter((project) => project.status !== "COMPLETED" && project.status !== "CANCELLED");
    const completedMilestones = scopedMilestones.filter((entry) => entry.milestone.status === "COMPLETED");
    const completedLast30 = completedMilestones.filter((entry) => {
      const date = new Date(entry.milestone.updatedAt);
      return nowTs - date.getTime() < 30 * 24 * 60 * 60 * 1000;
    });
    const updatedThreads = projectScopedConversations.filter((conversation) => {
      const date = new Date(conversation.updatedAt);
      return nowTs - date.getTime() < 7 * 24 * 60 * 60 * 1000;
    });

    return [
      {
        label: "Active Projects",
        value: String(activeProjects.length),
        delta: `${activeProjects.length} live engagement${activeProjects.length === 1 ? "" : "s"}`,
        tone: "var(--accent)",
        deltaTone: "deltaUp"
      },
      {
        label: "Milestones Done",
        value: String(completedMilestones.length),
        delta: `${completedLast30.length} completed in 30 days`,
        tone: "var(--purple)",
        deltaTone: completedLast30.length > 0 ? "deltaUp" : "deltaWarn"
      },
      {
        label: "Outstanding Balance",
        value: formatMoney(scopedOutstandingInvoices.reduce((sum, invoice) => sum + convertMoney(invoice.amountCents, invoice.currency), 0), displayCurrency),
        delta: `${scopedOutstandingInvoices.length} invoice${scopedOutstandingInvoices.length === 1 ? "" : "s"} due`,
        tone: "var(--amber)",
        deltaTone: scopedOutstandingInvoices.length > 0 ? "deltaWarn" : "deltaUp"
      },
      {
        label: "Unread Messages",
        value: String(updatedThreads.length),
        delta: `${updatedThreads.length} thread${updatedThreads.length === 1 ? "" : "s"} updated this week`,
        tone: "var(--purple)",
        deltaTone: "deltaUp"
      }
    ];
  }, [convertMoney, displayCurrency, nowTs, projectScopedConversations, projectScopedProjects, scopedMilestones, scopedOutstandingInvoices]);

  const nextActions = useMemo<ActionItem[]>(() => {
    const actions: ActionItem[] = [];
    const overdue = dateScopedInvoices.filter((invoice) => invoice.status === "OVERDUE");
    overdue.slice(0, 2).forEach((invoice) => {
      actions.push({
        id: `invoice-${invoice.id}`,
        title: `Pay invoice ${invoice.number}`,
        meta: invoice.dueAt ? `Overdue · ${formatDateShort(invoice.dueAt)}` : "Overdue",
        tone: "red"
      });
    });

    const upcomingMilestones = allMilestones
      .filter((entry) => entry.milestone.status !== "COMPLETED")
      .filter((entry) => entry.milestone.dueAt && !isPast(entry.milestone.dueAt))
      .sort((a, b) => new Date(a.milestone.dueAt ?? 0).getTime() - new Date(b.milestone.dueAt ?? 0).getTime())
      .slice(0, 2);
    upcomingMilestones.forEach((entry) => {
      actions.push({
        id: `milestone-${entry.milestone.id}`,
        title: `Review milestone: ${entry.milestone.title}`,
        meta: `Due · ${formatDateShort(entry.milestone.dueAt)}`,
        tone: "amber"
      });
    });

    const blockedTasks = scopedProjectDetails.flatMap((detail) => detail.tasks.filter((task) => task.status === "BLOCKED"));
    blockedTasks.slice(0, 2).forEach((task) => {
      actions.push({
        id: `task-${task.id}`,
        title: `Unblock task: ${task.title}`,
        meta: task.dueAt ? `Due · ${formatDateShort(task.dueAt)}` : "Needs attention",
        tone: "purple"
      });
    });

    if (actions.length === 0) {
      actions.push({
        id: "action-none",
        title: "All caught up",
        meta: "No urgent actions right now",
        tone: "accent"
      });
    }

    return actions.slice(0, 5);
  }, [allMilestones, dateScopedInvoices, scopedProjectDetails]);

  const slaAlerts = useMemo<RiskItem[]>(() => {
    const risks: RiskItem[] = [];
    const soonCutoff = nowTs + 1000 * 60 * 60 * 24 * 3;
    projectScopedProjects
      .filter((project) => project.riskLevel === "HIGH")
      .forEach((project) => {
        risks.push({
          id: `risk-${project.id}`,
          title: `${project.name} marked high risk`,
          meta: `Due ${project.dueAt ? formatDateShort(project.dueAt) : "TBD"}`,
          tone: "red"
        });
      });

    allMilestones
      .filter((entry) => entry.milestone.status !== "COMPLETED")
      .filter((entry) => entry.milestone.dueAt && isPast(entry.milestone.dueAt))
      .forEach((entry) => {
        risks.push({
          id: `milestone-risk-${entry.milestone.id}`,
          title: `Milestone overdue: ${entry.milestone.title}`,
          meta: `Due ${formatDateShort(entry.milestone.dueAt)}`,
          tone: "amber"
        });
      });

    dateScopedInvoices
      .filter((invoice) => invoice.status === "OVERDUE")
      .forEach((invoice) => {
        risks.push({
          id: `invoice-risk-${invoice.id}`,
          title: `Invoice ${invoice.number} overdue`,
          meta: invoice.dueAt ? `Due ${formatDateShort(invoice.dueAt)}` : "Overdue",
          tone: "red"
        });
      });

    scopedProjectDetails
      .flatMap((detail) => detail.tasks.filter((task) => task.status === "BLOCKED"))
      .slice(0, 3)
      .forEach((task) => {
        risks.push({
          id: `task-blocked-${task.id}`,
          title: `Blocked task: ${task.title}`,
          meta: task.dueAt ? `Due ${formatDateShort(task.dueAt)}` : "No ETA yet",
          tone: "amber"
        });
      });

    allMilestones
      .filter((entry) => entry.milestone.status !== "COMPLETED")
      .filter((entry) => entry.milestone.dueAt)
      .filter((entry) => new Date(entry.milestone.dueAt ?? 0).getTime() <= soonCutoff)
      .forEach((entry) => {
        risks.push({
          id: `milestone-soon-${entry.milestone.id}`,
          title: `SLA window closing: ${entry.milestone.title}`,
          meta: `Due ${formatDateShort(entry.milestone.dueAt)}`,
          tone: "amber"
        });
      });

    scopedBlockers
      .filter((blocker) => blocker.status !== "RESOLVED")
      .forEach((blocker) => {
        risks.push({
          id: `blocker-${blocker.id}`,
          title: `Blocker: ${blocker.title}`,
          meta: blocker.etaAt ? `ETA ${formatDateShort(blocker.etaAt)}` : "No ETA set",
          tone: blocker.severity === "HIGH" || blocker.severity === "CRITICAL" ? "red" : "amber"
        });
      });

    return risks.slice(0, 5);
  }, [allMilestones, dateScopedInvoices, nowTs, projectScopedProjects, scopedBlockers, scopedProjectDetails]);

  const onboardingChecklist = useMemo<OnboardingChecklistItem[]>(() => {
    const firstProject = scopedProjectDetails[0];
    if (!firstProject) return [];
    const ownerAssigned = Boolean(firstProject.ownerName);
    const hasMilestones = firstProject.milestones.length > 0;
    const requiredFiles = snapshot.files.length > 0;
    const etaDefined = Boolean(firstProject.dueAt);
    return [
      {
        id: "owner",
        label: "Delivery owner assigned",
        status: ownerAssigned ? "done" : "pending",
        detail: ownerAssigned ? `Owner: ${firstProject.ownerName}` : "Assign an owner in project settings."
      },
      {
        id: "milestones",
        label: "Milestones mapped",
        status: hasMilestones ? "done" : "pending",
        detail: hasMilestones ? `${firstProject.milestones.length} milestones planned.` : "No milestones yet."
      },
      {
        id: "files",
        label: "Required files uploaded",
        status: requiredFiles ? "done" : "pending",
        detail: requiredFiles ? `${snapshot.files.length} file(s) on record.` : "Upload kickoff files."
      },
      {
        id: "eta",
        label: "Delivery ETA confirmed",
        status: etaDefined ? "done" : "pending",
        detail: etaDefined ? `ETA: ${formatDateShort(firstProject.dueAt)}` : "No delivery ETA set."
      }
    ];
  }, [scopedProjectDetails, snapshot.files]);

  const digestItems = useMemo<LoginDigestItem[]>(() => {
    if (!lastLoginAt) return [];
    const sinceTs = new Date(lastLoginAt).getTime();
    if (Number.isNaN(sinceTs)) return [];
    const digest: LoginDigestItem[] = [];

    projectScopedConversations
      .filter((conversation) => new Date(conversation.updatedAt).getTime() > sinceTs)
      .slice(0, 2)
      .forEach((conversation) => {
        digest.push({
          id: `digest-thread-${conversation.id}`,
          change: `Thread updated: ${conversation.subject}`,
          impact: "Communication is active on this workstream",
          action: "Open messages to review and reply",
          time: formatRelative(conversation.updatedAt)
        });
      });

    dateScopedInvoices
      .filter((invoice) => new Date(invoice.updatedAt).getTime() > sinceTs)
      .slice(0, 2)
      .forEach((invoice) => {
        digest.push({
          id: `digest-invoice-${invoice.id}`,
          change: `Invoice ${invoice.number} changed to ${formatStatus(invoice.status)}`,
          impact: formatMoney(convertMoney(invoice.amountCents, invoice.currency), displayCurrency),
          action: invoice.status === "OVERDUE" ? "Review overdue balance in billing" : "Review billing updates",
          time: formatRelative(invoice.updatedAt)
        });
      });

    allMilestones
      .filter((entry) => new Date(entry.milestone.updatedAt).getTime() > sinceTs)
      .slice(0, 2)
      .forEach((entry) => {
        digest.push({
          id: `digest-milestone-${entry.milestone.id}`,
          change: `Milestone update: ${entry.milestone.title}`,
          impact: `Status ${formatStatus(entry.milestone.status)}`,
          action:
            (milestoneApprovals[entry.milestone.id]?.status ?? "PENDING") === "PENDING"
              ? "Review pending milestone approval"
              : "Track delivery progress",
          time: formatRelative(entry.milestone.updatedAt)
        });
      });

    return digest.slice(0, 6);
  }, [allMilestones, convertMoney, dateScopedInvoices, displayCurrency, lastLoginAt, milestoneApprovals, projectScopedConversations]);

  const actionCenter = useMemo<ActionCenterItem[]>(() => {
    const pendingApprovals = scopedMilestones.filter(
      (entry) => (milestoneApprovals[entry.milestone.id]?.status ?? "PENDING") === "PENDING"
    ).length;
    const unreadMessages = projectScopedConversations.filter((conversation) => conversation.status === "OPEN").length;
    const overdueInvoicesCount = dateScopedInvoices.filter((invoice) => invoice.status === "OVERDUE").length;
    const checklistGaps = onboardingChecklist.filter((item) => item.status === "pending").length;

    return [
      {
        id: "center-approvals",
        label: "Pending approvals",
        value: pendingApprovals,
        detail: pendingApprovals > 0 ? "needs review" : "all clear",
        tone: pendingApprovals > 0 ? "amber" : "accent",
        target: "projects"
      },
      {
        id: "center-messages",
        label: "Unread messages",
        value: unreadMessages,
        detail: unreadMessages > 0 ? "inbox active" : "all clear",
        tone: unreadMessages > 0 ? "purple" : "accent",
        target: "messages"
      },
      {
        id: "center-overdue",
        label: "Overdue invoices",
        value: overdueInvoicesCount,
        detail: overdueInvoicesCount > 0 ? "payment risk" : "on track",
        tone: overdueInvoicesCount > 0 ? "red" : "accent",
        target: "invoices"
      },
      {
        id: "center-gaps",
        label: "Checklist gaps",
        value: checklistGaps,
        detail: checklistGaps > 0 ? "action needed" : "ready",
        tone: checklistGaps > 0 ? "amber" : "accent",
        target: "projects"
      }
    ];
  }, [dateScopedInvoices, milestoneApprovals, onboardingChecklist, projectScopedConversations, scopedMilestones]);

  const approvalQueue = useMemo<ApprovalQueueItem[]>(() => {
    const queue: ApprovalQueueItem[] = [];

    allMilestones
      .filter((entry) => (milestoneApprovals[entry.milestone.id]?.status ?? "PENDING") === "PENDING")
      .slice(0, 4)
      .forEach((entry) => {
        queue.push({
          id: `approval-milestone-${entry.milestone.id}`,
          title: entry.milestone.title,
          detail: entry.milestone.dueAt ? `Milestone approval pending · Due ${formatDateShort(entry.milestone.dueAt)}` : "Milestone approval pending",
          priority: entry.milestone.dueAt && isPast(entry.milestone.dueAt) ? "high" : "normal"
        });
      });

    scopedChangeRequests
      .filter((request) => request.status === "SUBMITTED" || request.status === "ESTIMATED" || request.status === "ADMIN_APPROVED")
      .slice(0, 3)
      .forEach((request) => {
        queue.push({
          id: `approval-change-${request.id}`,
          title: request.title,
          detail: `Change request · ${formatStatus(request.status)}`,
          priority: request.status === "ADMIN_APPROVED" ? "high" : "normal"
        });
      });

    return queue.slice(0, 6);
  }, [allMilestones, milestoneApprovals, scopedChangeRequests]);

  const decisionLog = useMemo<DecisionLogItem[]>(() => {
    const entries: Array<DecisionLogItem & { ts: number }> = [];

    allMilestones
      .filter((entry) => {
        const status = milestoneApprovals[entry.milestone.id]?.status ?? "PENDING";
        return status === "APPROVED" || status === "REJECTED";
      })
      .forEach((entry) => {
        const ts = new Date(entry.milestone.updatedAt).getTime();
        const decision = milestoneApprovals[entry.milestone.id]?.status ?? "PENDING";
        entries.push({
          id: `decision-milestone-${entry.milestone.id}`,
          title: `${entry.milestone.title} ${decision === "APPROVED" ? "approved" : "rejected"}`,
          detail: `Milestone · ${formatStatus(entry.milestone.status)}`,
          time: formatRelative(entry.milestone.updatedAt),
          ts: Number.isNaN(ts) ? 0 : ts
        });
      });

    scopedChangeRequests
      .filter((request) => request.status === "ADMIN_REJECTED" || request.status === "CLIENT_APPROVED" || request.status === "CLIENT_REJECTED")
      .forEach((request) => {
        const ts = new Date(request.updatedAt).getTime();
        entries.push({
          id: `decision-change-${request.id}`,
          title: `${request.title} ${formatStatus(request.status).toLowerCase()}`,
          detail: "Change request decision",
          time: formatRelative(request.updatedAt),
          ts: Number.isNaN(ts) ? 0 : ts
        });
      });

    return entries
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 6)
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        detail: entry.detail,
        time: entry.time
      }));
  }, [allMilestones, milestoneApprovals, scopedChangeRequests]);

  const confidenceSummary = useMemo<ConfidenceSummary>(() => {
    const overdueMilestones = allMilestones.filter(
      (entry) => entry.milestone.dueAt && isPast(entry.milestone.dueAt) && entry.milestone.status !== "COMPLETED"
    ).length;
    const blockedTasks = scopedProjectDetails.flatMap((detail) => detail.tasks.filter((task) => task.status === "BLOCKED")).length;
    const highRiskProjects = projectScopedProjects.filter((project) => project.riskLevel === "HIGH").length;
    const totalSignals = Math.max(allMilestones.length + scopedProjectDetails.length, 1);
    const penalties = overdueMilestones * 16 + blockedTasks * 12 + highRiskProjects * 18;
    const score = Math.max(5, Math.min(97, 100 - Math.round((penalties / totalSignals) * 10)));
    const tone: ConfidenceSummary["tone"] = score < 45 ? "red" : score < 70 ? "amber" : "accent";
    const label: ConfidenceSummary["label"] = score < 45 ? "At Risk" : score < 70 ? "Needs Attention" : "On Track";
    const reasons = [
      `${overdueMilestones} overdue milestone${overdueMilestones === 1 ? "" : "s"}`,
      `${blockedTasks} blocked task${blockedTasks === 1 ? "" : "s"}`,
      `${highRiskProjects} high-risk project${highRiskProjects === 1 ? "" : "s"}`
    ];
    const nextActionsConfidence = [
      "Prioritize blocked tasks with owner assignment",
      "Confirm near-term milestone approvals",
      "Resolve overdue invoices impacting delivery cadence"
    ];
    return {
      score,
      tone,
      label,
      reasons,
      nextActions: nextActionsConfidence
    };
  }, [allMilestones, projectScopedProjects, scopedProjectDetails]);

  const activityFeed = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    scopedProjectDetails.forEach((detail) => {
      detail.activities.slice(0, 10).forEach((activity) => {
        const timestamp = new Date(activity.createdAt).getTime();
        items.push({
          id: activity.id,
          icon: "✓",
          title: activity.type.replace(/_/g, " ").toLowerCase(),
          detail: activity.details ?? detail.name,
          time: formatRelative(activity.createdAt),
          tone: "accent",
          timestamp: Number.isNaN(timestamp) ? 0 : timestamp
        });
      });
    });

    dateScopedInvoices.forEach((invoice) => {
      const timestamp = new Date(invoice.updatedAt).getTime();
      items.push({
        id: `invoice-${invoice.id}`,
        icon: invoice.status === "PAID" ? "✓" : "🧾",
        title: `Invoice ${invoice.number}`,
        detail: `${invoice.status.toLowerCase()} · ${formatMoney(convertMoney(invoice.amountCents, invoice.currency), displayCurrency)}`,
        time: formatRelative(invoice.updatedAt),
        tone: invoice.status === "OVERDUE" ? "red" : invoice.status === "PAID" ? "accent" : "amber",
        timestamp: Number.isNaN(timestamp) ? 0 : timestamp
      });
    });

    snapshot.files.forEach((file) => {
      const timestamp = new Date(file.createdAt).getTime();
      items.push({
        id: `file-${file.id}`,
        icon: "📄",
        title: file.fileName,
        detail: "File uploaded",
        time: formatRelative(file.createdAt),
        tone: "purple",
        timestamp: Number.isNaN(timestamp) ? 0 : timestamp
      });
    });

    projectScopedConversations.forEach((conversation) => {
      const timestamp = new Date(conversation.updatedAt).getTime();
      items.push({
        id: `thread-${conversation.id}`,
        icon: "💬",
        title: conversation.subject,
        detail: "Thread updated",
        time: formatRelative(conversation.updatedAt),
        tone: "accent",
        timestamp: Number.isNaN(timestamp) ? 0 : timestamp
      });
    });

    scopedTimelineEvents.forEach((event) => {
      const timestamp = new Date(event.createdAt).getTime();
      items.push({
        id: `timeline-${event.id}`,
        icon: event.category === "BLOCKER" ? "⚠" : event.category === "LEAD" ? "◎" : "✓",
        title: event.title,
        detail: event.detail ?? "Shared timeline update",
        time: formatRelative(event.createdAt),
        tone: event.category === "BLOCKER" ? "amber" : event.category === "LEAD" ? "purple" : "accent",
        timestamp: Number.isNaN(timestamp) ? 0 : timestamp
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
  }, [convertMoney, dateScopedInvoices, displayCurrency, projectScopedConversations, scopedProjectDetails, scopedTimelineEvents, snapshot.files]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    allMilestones.forEach((entry) => {
      if (!entry.milestone.dueAt) return;
      const timestamp = new Date(entry.milestone.dueAt).getTime();
      items.push({
        id: entry.milestone.id,
        title: entry.milestone.title,
        meta: projectScopedProjects.find((project) => project.id === entry.projectId)?.name ?? "Project",
        dateLabel: formatDateShort(entry.milestone.dueAt),
        tone: entry.milestone.status === "COMPLETED" ? "muted" : "accent",
        timestamp: Number.isNaN(timestamp) ? 0 : timestamp
      });
    });
    dateScopedInvoices.forEach((invoice) => {
      if (!invoice.dueAt) return;
      const timestamp = new Date(invoice.dueAt).getTime();
      items.push({
        id: `invoice-${invoice.id}`,
        title: `Invoice ${invoice.number} due`,
        meta: formatMoney(convertMoney(invoice.amountCents, invoice.currency), displayCurrency),
        dateLabel: formatDateShort(invoice.dueAt),
        tone: invoice.status === "OVERDUE" ? "amber" : "purple",
        timestamp: Number.isNaN(timestamp) ? 0 : timestamp
      });
    });
    return items.sort((a, b) => a.timestamp - b.timestamp).slice(0, 6);
  }, [allMilestones, convertMoney, dateScopedInvoices, displayCurrency, projectScopedProjects]);

  const lastUpdatedAt = useMemo(() => {
    const dates = [
      ...projectScopedProjects.map((project) => project.updatedAt),
      ...projectScopedConversations.map((conversation) => conversation.updatedAt),
      ...dateScopedInvoices.map((invoice) => invoice.updatedAt),
      ...snapshot.files.map((file) => file.updatedAt)
    ];
    const latest = dates
      .map((value) => new Date(value).getTime())
      .filter((value) => !Number.isNaN(value))
      .sort((a, b) => b - a)[0];
    return latest ? new Date(latest).toISOString() : null;
  }, [dateScopedInvoices, projectScopedConversations, projectScopedProjects, snapshot.files]);
  const lastSyncedLabel = lastUpdatedAt ? formatRelative(lastUpdatedAt) : "Awaiting data";

  const selectedConversation = useMemo(
    () => projectScopedConversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [projectScopedConversations, selectedConversationId]
  );
  const selectedProjectName =
    projectScopedProjects.find((project) => project.id === selectedConversation?.projectId)?.name ?? "General";
  const userEmail = session?.user.email ?? "client@maphari.co.za";
  const userGreetingName = session?.user.email ? session.user.email.split("@")[0] : "there";
  const userInitials = getInitials(userGreetingName);
  const clientBadge = session?.user.clientId ? `Client ${session.user.clientId.slice(0, 6).toUpperCase()}` : "Client";
  const milestoneProjectById = useMemo(() => {
    const map = new Map<string, string>();
    allMilestones.forEach((entry) => {
      map.set(entry.milestone.id, entry.projectId);
    });
    return map;
  }, [allMilestones]);
  const taskProjectById = useMemo(() => {
    const map = new Map<string, string>();
    scopedProjectDetails.forEach((project) => {
      project.tasks.forEach((task) => {
        map.set(task.id, project.id);
      });
    });
    return map;
  }, [scopedProjectDetails]);
  const projectActivityById = useMemo(() => {
    const map = new Map<string, string>();
    scopedProjectDetails.forEach((project) => {
      project.activities.forEach((activity) => {
        map.set(activity.id, project.id);
      });
    });
    return map;
  }, [scopedProjectDetails]);
  const changeRequestProjectById = useMemo(() => {
    const map = new Map<string, string>();
    scopedChangeRequests.forEach((request) => {
      map.set(request.id, request.projectId);
    });
    return map;
  }, [scopedChangeRequests]);
  const timelineEventById = useMemo(() => {
    const map = new Map<string, { category: "PROJECT" | "LEAD" | "BLOCKER"; projectId: string | null }>();
    scopedTimelineEvents.forEach((event) => {
      map.set(event.id, { category: event.category, projectId: event.projectId });
    });
    return map;
  }, [scopedTimelineEvents]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const [profilePref, notificationsPref, savedViewPref] = await Promise.all([
        getPortalPreferenceWithRefresh(session, "settingsProfile"),
        getPortalPreferenceWithRefresh(session, "settingsNotifications"),
        getPortalPreferenceWithRefresh(session, "savedView")
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
        setSettingsProfile({
          fullName: typeof profile.fullName === "string" ? profile.fullName : userGreetingName,
          email: typeof profile.email === "string" ? profile.email : userEmail,
          company: typeof profile.company === "string" ? profile.company : clientBadge,
          phone: typeof profile.phone === "string" ? profile.phone : "",
          currency: typeof profile.currency === "string" ? profile.currency : "AUTO"
        });
      } else {
        setSettingsProfile((previous) => ({
          fullName: previous.fullName === "there" ? userGreetingName : previous.fullName,
          email: previous.email || userEmail,
          company: previous.company === "Client" ? clientBadge : previous.company,
          phone: previous.phone,
          currency: previous.currency || "AUTO"
        }));
      }

      const notifications = parse(notificationsPref.data?.value);
      if (notifications) {
        setSettingsNotifications({
          projectUpdates: Boolean(notifications.projectUpdates),
          invoiceReminders: Boolean(notifications.invoiceReminders),
          newMessages: Boolean(notifications.newMessages),
          weeklyDigest: Boolean(notifications.weeklyDigest),
          marketingEmails: Boolean(notifications.marketingEmails)
        });
      }

      const savedView = parse(savedViewPref.data?.value);
      if (savedView) {
        savedViewBaseRef.current = savedView;
      }
      const topbar = savedView?.clientDashboardTopbar;
      if (topbar && typeof topbar === "object") {
        const topbarRecord = topbar as Record<string, unknown>;
        if (typeof topbarRecord.search === "string") {
          setTopbarSearch(topbarRecord.search);
        }
        if (
          topbarRecord.dateRange === "7d" ||
          topbarRecord.dateRange === "30d" ||
          topbarRecord.dateRange === "90d" ||
          topbarRecord.dateRange === "all"
        ) {
          setTopbarDateRange(topbarRecord.dateRange);
        }
        if (typeof topbarRecord.projectId === "string" || topbarRecord.projectId === null) {
          const nextProjectId = (topbarRecord.projectId as string | null) ?? null;
          setTopbarProjectId(nextProjectId);
          setSelectedProjectId(nextProjectId);
        }
        if (
          topbarRecord.activePage === "dashboard" ||
          topbarRecord.activePage === "projects" ||
          topbarRecord.activePage === "invoices" ||
          topbarRecord.activePage === "messages" ||
          topbarRecord.activePage === "automations" ||
          topbarRecord.activePage === "settings"
        ) {
          setActivePage(topbarRecord.activePage);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientBadge, session, userEmail, userGreetingName]);

  useEffect(() => {
    if (!session) return;
    const timeoutId = window.setTimeout(() => {
      const nextSavedView = {
        ...savedViewBaseRef.current,
        clientDashboardTopbar: {
          activePage,
          search: topbarSearch,
          dateRange: topbarDateRange,
          projectId: projectScopeId
        }
      };
      savedViewBaseRef.current = nextSavedView;
      void setPortalPreferenceWithRefresh(session, {
        key: "savedView",
        value: JSON.stringify(nextSavedView)
      });
    }, 450);
    return () => window.clearTimeout(timeoutId);
  }, [activePage, projectScopeId, session, topbarDateRange, topbarSearch]);

  const handleThreadClick = (id: string) => {
    selectConversation(id);
  };

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

  const handleSendMessage = async () => {
    if (!selectedConversationId || !composeMessage.trim()) return;
    const created = await sendMessage(selectedConversationId, composeMessage.trim());
    if (created) {
      setComposeMessage("");
    }
  };

  const handleCreateThread = async () => {
    if (!session || creatingThread) return;
    if (newThreadSubject.trim().length < 2) {
      setActionFeedback({ tone: "error", message: "Thread subject is required." });
      return;
    }
    setCreatingThread(true);
    const result = await createPortalConversationWithRefresh(session, {
      clientId: session.user.clientId ?? undefined,
      subject: newThreadSubject.trim()
    });
    setCreatingThread(false);
    if (!result.data) {
      setActionFeedback({ tone: "error", message: result.error?.message ?? "Unable to create thread." });
      return;
    }
    setNewThreadSubject("");
    selectConversation(result.data.id);
    await refreshSnapshot(result.nextSession ?? session, { background: true });
    setActionFeedback({ tone: "success", message: "Thread created." });
  };

  const toPageFromNotificationTab = (
    tab: "dashboard" | "projects" | "invoices" | "messages" | "settings" | "operations"
  ): PageId => {
    return tab === "operations" ? "automations" : tab;
  };

  const handleMarkNotificationRead = async (notificationId: string, nextRead: boolean) => {
    if (!session) return;
    const result = await setPortalNotificationReadStateWithRefresh(session, notificationId, nextRead);
    if (!result.data) return;
    setNotificationJobs((previous) =>
      previous.map((job) => (job.id === notificationId ? result.data! : job))
    );
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!session) return;
    const unread = notificationJobs.filter((job) => !job.readAt);
    if (unread.length === 0) return;
    const updates = await Promise.all(
      unread.map((job) => setPortalNotificationReadStateWithRefresh(session, job.id, true))
    );
    setNotificationJobs((previous) =>
      previous.map((job) => {
        const updated = updates.find((candidate) => candidate.data?.id === job.id)?.data;
        return updated ?? job;
      })
    );
  };

  const handleQuickComposeSubmit = async () => {
    if (!session) return;
    if (quickComposeSubject.trim().length < 2) {
      setActionFeedback({ tone: "error", message: "Subject must be at least 2 characters." });
      return;
    }
    setQuickComposeCreating(true);
    const created = await createPortalConversationWithRefresh(session, {
      clientId: session.user.clientId ?? undefined,
      subject: quickComposeSubject.trim(),
      projectId: resolvedQuickComposeProjectId ?? undefined
    });
    if (!created.data) {
      setQuickComposeCreating(false);
      setActionFeedback({ tone: "error", message: created.error?.message ?? "Unable to create thread." });
      return;
    }

    if (quickComposeBody.trim()) {
      await sendMessage(created.data.id, quickComposeBody.trim());
    }

    await refreshSnapshot(created.nextSession ?? session, { background: true });
    selectConversation(created.data.id);
    setActivePage("messages");
    setQuickComposeOpen(false);
    setNotificationsTrayOpen(false);
    setQuickComposeSubject("");
    setQuickComposeBody("");
    setQuickComposeProjectId(null);
    setQuickComposeCreating(false);
    setActionFeedback({ tone: "success", message: "New thread started from top bar." });
  };

  const handleCommandResultSelect = async (result: CommandResult) => {
    if (result.kind === "page") {
      setActivePage(result.page);
    }
    if (result.kind === "project") {
      setTopbarProjectId(result.projectId);
      setSelectedProjectId(result.projectId);
      setActivePage("projects");
    }
    if (result.kind === "conversation") {
      selectConversation(result.conversationId);
      setActivePage("messages");
    }
    if (result.kind === "invoice") {
      setActivePage("invoices");
    }
    if (result.kind === "milestone") {
      setTopbarProjectId(result.projectId);
      setSelectedProjectId(result.projectId);
      setActivePage("projects");
    }
    if (result.kind === "notification") {
      setActivePage(result.page);
      await handleMarkNotificationRead(result.notificationId, true);
    }
    setCommandSearchOpen(false);
  };

  const handleMessageAttachmentUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!selectedConversationId) {
      setActionFeedback({ tone: "error", message: "Select a thread before attaching a file." });
      event.target.value = "";
      return;
    }
    const uploaded = await uploadFile(file);
    if (!uploaded) {
      setActionFeedback({ tone: "error", message: "Unable to upload attachment." });
      event.target.value = "";
      return;
    }
    await sendMessage(selectedConversationId, `Shared file: ${file.name}`);
    setActionFeedback({ tone: "success", message: `Attachment uploaded: ${uploaded.fileName}` });
    event.target.value = "";
  };

  const handleProjectFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const uploaded = await uploadFile(file);
    if (!uploaded) {
      setActionFeedback({ tone: "error", message: "Unable to upload project file." });
      event.target.value = "";
      return;
    }
    if (/agreement|contract|addendum/i.test(uploaded.fileName)) {
      setProjectRequestForm((previous) => ({ ...previous, agreementFileId: uploaded.id }));
    }
    setActionFeedback({ tone: "success", message: `Uploaded: ${uploaded.fileName}` });
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
      setActionFeedback({ tone: "error", message: result.error?.message ?? "Unable to generate handoff package." });
      return;
    }
    setHandoffSummary({
      docs: result.data.docs,
      decisions: result.data.decisions,
      blockers: result.data.blockers,
      generatedAt: formatRelative(result.data.generatedAt)
    });
    setActionFeedback({ tone: "success", message: "Handoff package refreshed." });
  };

  const handleSaveClientProfile = async () => {
    if (!session) return;
    const result = await setPortalPreferenceWithRefresh(session, {
      key: "settingsProfile",
      value: JSON.stringify(settingsProfile)
    });
    setActionFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Profile settings saved." : result.error?.message ?? "Unable to save profile settings."
    });
  };

  const handleSaveClientNotifications = async () => {
    if (!session) return;
    const result = await setPortalPreferenceWithRefresh(session, {
      key: "settingsNotifications",
      value: JSON.stringify(settingsNotifications)
    });
    setActionFeedback({
      tone: result.data ? "success" : "error",
      message: result.data ? "Notification settings saved." : result.error?.message ?? "Unable to save notification settings."
    });
  };

  const handleExportProjects = () => {
    if (searchedProjectCards.length === 0) {
      setActionFeedback({ tone: "error", message: "No projects available to export." });
      return;
    }
    const escapeCsv = (value: string | number | null | undefined) => {
      const text = value === null || value === undefined ? "" : String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
    };
    const header = [
      "Project",
      "Status",
      "Priority",
      "Progress (%)",
      "Due Date",
      "Budget",
      "Owner",
      "Milestones",
      "Open Milestones"
    ];
    const lines = searchedProjectCards.map((project) => {
      const openMilestones = project.milestones.filter((milestone) => milestone.status !== "COMPLETED").length;
      return [
        escapeCsv(project.name),
        escapeCsv(formatStatus(project.status)),
        escapeCsv(formatStatus(project.priority)),
        escapeCsv(project.progressPercent),
        escapeCsv(project.dueAt ? formatDateLong(project.dueAt) : "TBD"),
        escapeCsv(formatMoney(project.budgetCents, displayCurrency)),
        escapeCsv(project.ownerName ?? ""),
        escapeCsv(project.milestones.length),
        escapeCsv(openMilestones)
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
    setActionFeedback({ tone: "success", message: "Projects export downloaded." });
  };

  const handleExportInvoices = () => {
    if (searchedFilteredInvoiceTable.length === 0) {
      setActionFeedback({ tone: "error", message: "No invoices available to export." });
      return;
    }
    const escapeCsv = (value: string | number | null | undefined) => {
      const text = value === null || value === undefined ? "" : String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
    };
    const header = ["Invoice #", "Project", "Issued", "Due", "Amount", "Status"];
    const lines = searchedFilteredInvoiceTable.map((invoice) =>
      [
        escapeCsv(invoice.id),
        escapeCsv(invoice.project),
        escapeCsv(invoice.issued),
        escapeCsv(invoice.due),
        escapeCsv(invoice.amount),
        escapeCsv(invoice.badge.label)
      ].join(",")
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
    setActionFeedback({ tone: "success", message: "Invoices export downloaded." });
  };

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
    const invoice = dateScopedInvoices.find((item) => item.id === invoiceId);
    if (invoice?.status === "PAID") {
      setActiveInvoiceTab("paid");
    } else if (invoice) {
      setActiveInvoiceTab("outstanding");
    }
    setActivePage("invoices");
  };

  const handleOpenActionItem = (id: string) => {
    if (id.startsWith("invoice-")) {
      handleOpenInvoiceFromDashboard(id.replace("invoice-", ""));
      return;
    }
    if (id.startsWith("milestone-")) {
      const projectId = milestoneProjectById.get(id.replace("milestone-", ""));
      openProjectContext(projectId ?? projectScopeId);
      return;
    }
    if (id.startsWith("task-")) {
      const projectId = taskProjectById.get(id.replace("task-", ""));
      openProjectContext(projectId ?? projectScopeId);
      return;
    }
    openProjectContext(projectScopeId);
  };

  const handleOpenRiskItem = (id: string) => {
    if (id.startsWith("invoice-risk-")) {
      handleOpenInvoiceFromDashboard(id.replace("invoice-risk-", ""));
      return;
    }
    if (id.startsWith("milestone-risk-")) {
      const projectId = milestoneProjectById.get(id.replace("milestone-risk-", ""));
      openProjectContext(projectId ?? projectScopeId);
      return;
    }
    if (id.startsWith("milestone-soon-")) {
      const projectId = milestoneProjectById.get(id.replace("milestone-soon-", ""));
      openProjectContext(projectId ?? projectScopeId);
      return;
    }
    if (id.startsWith("task-blocked-")) {
      const projectId = taskProjectById.get(id.replace("task-blocked-", ""));
      openProjectContext(projectId ?? projectScopeId);
      return;
    }
    if (id.startsWith("risk-")) {
      openProjectContext(id.replace("risk-", ""));
      return;
    }
    if (id.startsWith("blocker-")) {
      openProjectContext(projectScopeId);
      return;
    }
    openProjectContext(projectScopeId);
  };

  const handleOpenApprovalItem = (id: string) => {
    if (id.startsWith("approval-milestone-")) {
      const projectId = milestoneProjectById.get(id.replace("approval-milestone-", ""));
      openProjectContext(projectId ?? projectScopeId);
      return;
    }
    if (id.startsWith("approval-change-")) {
      const projectId = changeRequestProjectById.get(id.replace("approval-change-", ""));
      openProjectContext(projectId ?? projectScopeId);
      return;
    }
    openProjectContext(projectScopeId);
  };

  const handleOpenDecisionItem = (id: string) => {
    if (id.startsWith("decision-milestone-")) {
      const projectId = milestoneProjectById.get(id.replace("decision-milestone-", ""));
      openProjectContext(projectId ?? projectScopeId);
      return;
    }
    if (id.startsWith("decision-change-")) {
      const projectId = changeRequestProjectById.get(id.replace("decision-change-", ""));
      openProjectContext(projectId ?? projectScopeId);
      return;
    }
    openProjectContext(projectScopeId);
  };

  const handleOpenActivityItem = (id: string) => {
    if (id.startsWith("thread-")) {
      handleOpenThreadFromDashboard(id.replace("thread-", ""));
      return;
    }
    if (id.startsWith("invoice-")) {
      handleOpenInvoiceFromDashboard(id.replace("invoice-", ""));
      return;
    }
    if (id.startsWith("timeline-")) {
      const eventInfo = timelineEventById.get(id.replace("timeline-", ""));
      if (eventInfo?.projectId) {
        openProjectContext(eventInfo.projectId);
        return;
      }
      openProjectContext(projectScopeId);
      return;
    }
    if (id.startsWith("file-")) {
      openProjectContext(projectScopeId);
      return;
    }
    const projectId = projectActivityById.get(id);
    openProjectContext(projectId ?? projectScopeId);
  };

  const handleOpenTimelineItem = (id: string) => {
    if (id.startsWith("invoice-")) {
      handleOpenInvoiceFromDashboard(id.replace("invoice-", ""));
      return;
    }
    const projectId = milestoneProjectById.get(id);
    openProjectContext(projectId ?? projectScopeId);
  };

  const clientTourSteps = useMemo<ClientTourStep[]>(
    () => [
      {
        title: "Welcome to Maphari",
        detail:
          "This is your client portal — your central hub for managing every project with us. Let's take 60 seconds to show you around.",
        mustComplete: true
      },
      {
        targetId: "nav-dashboard",
        title: "Your Dashboard",
        detail:
          "Start here every time. See all active projects, upcoming milestones, recent messages, and outstanding invoices at a glance."
      },
      {
        targetId: "nav-projects",
        title: "My Projects",
        detail: "View detailed progress on every project, including milestones, team members, deadlines, and budgets."
      },
      {
        targetId: "nav-request",
        title: "New Project Request",
        detail:
          "Click here to start a new project. Our system will guide you through selecting a service, describing your needs, and getting an instant price estimate."
      },
      {
        targetId: "nav-invoices",
        title: "Invoices & Payments",
        detail: "View all invoices, pay outstanding balances via Paystack, and download receipts. Your 3-part payment schedule lives here."
      },
      {
        targetId: "nav-docs",
        title: "Documents Library",
        detail:
          "All contracts, signed agreements, quotes, and handover documents are stored here. You can also download template documents like our NDA. That's the tour — let's get started!"
      }
    ],
    []
  );
  const activeTourStep = clientTourSteps[clientTourStep] ?? clientTourSteps[0];
  const selectedAgreementFile = snapshot.files.find((file) => file.id === projectRequestForm.agreementFileId) ?? null;

  useEffect(() => {
    if (!clientTourOpen) return;
    const updateTourLayout = () => {
      if (!activeTourStep?.targetId) {
        setClientTourLayout({
          spotlight: null,
          tooltip: { top: window.innerHeight / 2, left: window.innerWidth / 2, transform: "translate(-50%, -50%)" }
        });
        return;
      }

      const target = document.getElementById(activeTourStep.targetId);
      if (!target) {
        setClientTourLayout({
          spotlight: null,
          tooltip: { top: 120, left: 260, transform: "none" }
        });
        return;
      }

      const rect = target.getBoundingClientRect();
      const pad = 6;
      setClientTourLayout({
        spotlight: {
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2
        },
        tooltip: {
          top: Math.max(14, rect.top - pad),
          left: Math.min(window.innerWidth - 328, rect.right + pad + 20),
          transform: "none"
        }
      });
    };

    updateTourLayout();
    window.addEventListener("resize", updateTourLayout);
    window.addEventListener("scroll", updateTourLayout, true);
    return () => {
      window.removeEventListener("resize", updateTourLayout);
      window.removeEventListener("scroll", updateTourLayout, true);
    };
  }, [activeTourStep, clientTourOpen]);

  const handleDownloadAgreementTemplate = () => {
    const content = [
      "MAPHARI PROJECT AGREEMENT",
      "",
      `Project: ${projectRequestForm.name || "Untitled Project"}`,
      `Client: ${settingsProfile.company || "Client"}`,
      "",
      "Terms:",
      "1) Client confirms submitted scope details are accurate.",
      "2) A 50% deposit is required before request submission is sent.",
      "3) 30% is due at approved milestone stage.",
      "4) Final 20% is due before project handoff.",
      "5) Domain, hosting, and third-party subscriptions are paid by the client.",
      "6) Scope changes may increase price and timeline.",
      "",
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

  return (
    <div className={`${styles.clientRoot} ${syne.variable} ${dmMono.variable} ${instrument.variable}`}>
      <div className={styles.cursor} ref={cursorRef} />
      <div className={styles.cursorRing} ref={ringRef} />

      <div className={styles.shell}>
        <ClientSidebar
          navSections={navSections}
          activePage={activePage}
          onChangePage={setActivePage}
          projects={sortedProjects.map((project) => ({ id: project.id, name: project.name }))}
          selectedProjectId={activeProjectId}
          onSelectProject={(projectId) => {
            setSelectedProjectId(projectId);
            setTopbarProjectId(projectId);
          }}
          currentProjectName={activeProjectName}
          userInitials={userInitials}
          userGreetingName={userGreetingName}
          clientBadge={clientBadge}
        />

        <div className={styles.main}>
          <ClientTopbar
            topbarEyebrow={topbarEyebrow}
            topbarTitle={topbarTitle}
            activeProjectId={projectScopeId}
            projectOptions={sortedProjects.map((project) => ({ id: project.id, name: project.name }))}
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
              setNotificationsTrayOpen((previous) => !previous);
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
                <button className={styles.overlayLink} type="button" onClick={() => void handleMarkAllNotificationsRead()}>
                  Mark all read
                </button>
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

          <div className={styles.content}>
            {actionFeedback ? (
              <div
                className={styles.card}
                role="status"
                aria-live="polite"
                style={{
                  marginBottom: 12,
                  borderColor: actionFeedback.tone === "error" ? "rgba(255,95,124,0.4)" : "rgba(44,211,165,0.35)",
                  background: actionFeedback.tone === "error" ? "rgba(255,95,124,0.08)" : "rgba(44,211,165,0.08)"
                }}
              >
                <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
                  <div className={styles.pageSub} style={{ color: actionFeedback.tone === "error" ? "var(--red)" : "var(--green)" }}>
                    {actionFeedback.message}
                  </div>
                </div>
              </div>
            ) : null}
            <ClientDashboardPage
              active={activePage === "dashboard"}
              userGreetingName={userGreetingName}
              lastSyncedLabel={lastSyncedLabel}
              projectDetailsLoading={projectDetailsLoading}
              dashboardStats={dashboardStats}
              projectRows={searchedProjectRows}
              animateProgress={animateProgress}
              actionCenter={actionCenter}
              milestoneRows={searchedMilestoneRows}
              recentThreads={searchedRecentThreads}
              invoiceRows={searchedInvoiceRows}
              nextActions={nextActions}
              activityFeed={activityFeed}
              timelineItems={timelineItems}
              onboardingChecklist={onboardingChecklist}
              digestItems={digestItems}
              approvalQueue={approvalQueue}
              decisionLog={decisionLog}
              slaAlerts={slaAlerts}
              confidenceSummary={confidenceSummary}
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
            <ClientProjectsPage
              active={activePage === "projects"}
              projectsCount={projectScopedProjects.length}
              projectCards={searchedProjectCards}
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
            <ClientCreateProjectPage
              active={activePage === "create"}
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
              invoiceSummaryStats={invoiceSummaryStats}
              invoiceTabs={invoiceTabs}
              activeInvoiceTab={activeInvoiceTab}
              onInvoiceTabChange={setActiveInvoiceTab}
              onOpenInvoice={handleOpenInvoiceFromDashboard}
              onExportInvoices={handleExportInvoices}
              filteredInvoiceTable={searchedFilteredInvoiceTable}
            />
            <ClientMessagesPage
              active={activePage === "messages"}
              openThreadsCount={openThreads.length}
              messageThreads={messageThreads}
              threadSearch={threadSearch}
              onThreadSearchChange={setThreadSearch}
              newThreadSubject={newThreadSubject}
              onNewThreadSubjectChange={setNewThreadSubject}
              creatingThread={creatingThread}
              onCreateThread={() => void handleCreateThread()}
              selectedConversationId={selectedConversationId}
              onThreadClick={handleThreadClick}
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
              pendingApprovals={pendingApprovalCount}
              openBlockers={scopedBlockers.filter((item) => item.status !== "RESOLVED").length}
              workflowRows={clientAutomationRows}
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
                setSettingsProfile((previous) => ({ ...previous, [key]: value }))
              }
              onSaveProfile={() => void handleSaveClientProfile()}
              notifications={settingsNotifications}
              onNotificationChange={(key, value) =>
                setSettingsNotifications((previous) => ({ ...previous, [key]: value }))
              }
              onSaveNotifications={() => void handleSaveClientNotifications()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
