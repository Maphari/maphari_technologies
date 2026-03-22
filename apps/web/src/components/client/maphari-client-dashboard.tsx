"use client";

import { useCallback, useState, useEffect } from "react";
import {
  useDashboardToasts,
  DashboardToastStack,
  DashboardLoadingFallback,
  hasAnyDashboardData,
} from "../shared/dashboard-core";
import { usePortalWorkspace } from "../../lib/auth/use-portal-workspace";
import { useRealtimeRefresh } from "../../lib/auth/use-realtime-refresh";
import { pageTitles } from "./maphari-dashboard/constants";
import type { PageId } from "./maphari-dashboard/config";
import { cx, styles } from "./maphari-dashboard/style";
import { Ic } from "./maphari-dashboard/ui";
import { DashboardToastCtx, type PageNotifyFn } from "./maphari-dashboard/hooks/use-page-toast";
import { ProjectLayerCtx } from "./maphari-dashboard/hooks/use-project-layer";

// ── Hooks ────────────────────────────────────────────────────────────────────
import { useClientData } from "./maphari-dashboard/hooks/use-client-data";
import { useClientNavigation } from "./maphari-dashboard/hooks/use-client-navigation";
import { useNotifications } from "./maphari-dashboard/hooks/use-notifications";
import { useCommandSearch } from "./maphari-dashboard/hooks/use-command-search";
import { searchGlobal } from "../../lib/api/shared/search";
import { useKeyboardShortcuts } from "./maphari-dashboard/hooks/use-keyboard-shortcuts";
import { useClientTour, CLIENT_TOUR_STEPS } from "./maphari-dashboard/hooks/use-client-tour";
import { DashboardTour } from "../shared/dashboard-tour";
import { useSessionTimeout } from "./maphari-dashboard/hooks/use-session-timeout";
import { useTheme } from "./maphari-dashboard/hooks/use-theme";
import { useQuickCompose } from "./maphari-dashboard/hooks/use-quick-compose";
import { usePortalRealtime } from "./maphari-dashboard/hooks/use-portal-realtime";

// ── Shell components ─────────────────────────────────────────────────────────
import { DashboardErrorBoundary } from "./maphari-dashboard/error-boundary";
import { ClientSidebar } from "./maphari-dashboard/sidebar";
import { ClientTopbar } from "./maphari-dashboard/topbar";

// ── Pages ────────────────────────────────────────────────────────────────────
// Overview
import { HomePage } from "./maphari-dashboard/pages/home-page";
import { DashboardPage } from "./maphari-dashboard/pages/dashboard-page";
import { NotificationsPage } from "./maphari-dashboard/pages/notifications-page";
import { ActivityFeedPage } from "./maphari-dashboard/pages/activity-feed-page";
// Projects
import { MyProjectsPage } from "./maphari-dashboard/pages/my-projects-page";
import { ProjectRequestPage } from "./maphari-dashboard/pages/project-request-page";
import { TimelinePage } from "./maphari-dashboard/pages/timeline-page";
import { ProjectRoadmapPage } from "./maphari-dashboard/pages/project-roadmap-page";
import { MilestonesPage } from "./maphari-dashboard/pages/milestones-page";
import { SprintBoardPage } from "./maphari-dashboard/pages/sprint-board-page";
import { DeliverablesPage } from "./maphari-dashboard/pages/deliverables-page";
import { ChangeRequestsPage } from "./maphari-dashboard/pages/change-requests-page";
import { RiskRegisterPage } from "./maphari-dashboard/pages/risk-register-page";
import { DecisionLogPage } from "./maphari-dashboard/pages/decision-log-page";
import { ContentApprovalPage } from "./maphari-dashboard/pages/content-approval-page";
// Finance
import { PaymentsPage } from "./maphari-dashboard/pages/payments-page";
import { InvoicesPage } from "./maphari-dashboard/pages/invoices-page";
import { BudgetTrackerPage } from "./maphari-dashboard/pages/budget-tracker-page";
import { LegalHubPage } from "./maphari-dashboard/pages/legal-hub-page";
import { RetainerDashboardPage } from "./maphari-dashboard/pages/retainer-dashboard-page";
import { FinancialReportsPage } from "./maphari-dashboard/pages/financial-reports-page";
import { InvoiceHistoryPage } from "./maphari-dashboard/pages/invoice-history-page";
// Communication
import { MessagesPage } from "./maphari-dashboard/pages/messages-page";
import { BookCallPage } from "./maphari-dashboard/pages/book-call-page";
import { AnnouncementsPage } from "./maphari-dashboard/pages/announcements-page";
import { DesignReviewPage } from "./maphari-dashboard/pages/design-review-page";
import { MeetingArchivePage } from "./maphari-dashboard/pages/meeting-archive-page";
// Files
import { FilesAssetsPage } from "./maphari-dashboard/pages/files-assets-page";
import { BrandLibraryPage } from "./maphari-dashboard/pages/brand-library-page";
import { ResourceHubPage } from "./maphari-dashboard/pages/resource-hub-page";
// Reporting
import { ProjectReportsPage } from "./maphari-dashboard/pages/project-reports-page";
import { HealthScorePage } from "./maphari-dashboard/pages/health-score-page";
import { PerformanceDashboardPage } from "./maphari-dashboard/pages/performance-dashboard-page";
import { ExecutiveSummaryPage } from "./maphari-dashboard/pages/executive-summary-page";
import { AiInsightsPage } from "./maphari-dashboard/pages/ai-insights-page";
// Growth
import { ServiceCatalogPage } from "./maphari-dashboard/pages/service-catalog-page";
import { ReferralProgramPage } from "./maphari-dashboard/pages/referral-program-page";
import { LoyaltyCreditsPage } from "./maphari-dashboard/pages/loyalty-credits-page";
// Support
import { KnowledgeBasePage } from "./maphari-dashboard/pages/knowledge-base-page";
import { KnowledgeAccessPage } from "./maphari-dashboard/pages/knowledge-access-page";
import { SlaEscalationPage } from "./maphari-dashboard/pages/sla-escalation-page";
// Account
import { FeedbackSurveyPage } from "./maphari-dashboard/pages/feedback-survey-page";
import { TeamAccessPage } from "./maphari-dashboard/pages/team-access-page";
import { IntegrationsPage } from "./maphari-dashboard/pages/integrations-page";
import { SettingsPage } from "./maphari-dashboard/pages/settings-page";
import { DataPrivacyPage } from "./maphari-dashboard/pages/data-privacy-page";
import { OnboardingPage } from "./maphari-dashboard/pages/onboarding-page";
import { SupportPage as ProgressKnowledgePage } from "./maphari-dashboard/pages/support-page";
import { CommunicationHistoryPage } from "./maphari-dashboard/pages/communication-history-page";
import { ProjectBriefPage } from "./maphari-dashboard/pages/project-brief-page";
import { OffboardingPage } from "./maphari-dashboard/pages/offboarding-page";
import { CompanyProfilePage } from "./maphari-dashboard/pages/company-profile-page";

// ── FTUE components
import { FtueHoldingPage } from "./maphari-dashboard/pages/ftue-holding-page";
import { FtueWelcomeModal } from "./maphari-dashboard/components/ftue-welcome-modal";
import { OnboardingBanner } from "./maphari-dashboard/components/onboarding-banner";
import { CompletionBanner } from "./maphari-dashboard/components/completion-banner";

import type { NotificationPreference } from "./maphari-dashboard/types";

const DEFAULT_NOTIFICATION_PREFS: NotificationPreference[] = [
  { category: "Project Updates",   inApp: true,  email: true,  push: true  },
  { category: "Invoice & Payments",inApp: true,  email: true,  push: false },
  { category: "Messages",          inApp: true,  email: true,  push: true  },
  { category: "Milestone Approvals",inApp: true, email: true,  push: true  },
  { category: "File Uploads",      inApp: true,  email: false, push: false },
  { category: "Team Changes",      inApp: true,  email: true,  push: false },
  { category: "Support Tickets",   inApp: true,  email: true,  push: false },
  { category: "Weekly Digest",     inApp: false, email: true,  push: false },
];
import { getPortalPreferenceWithRefresh, setPortalPreferenceWithRefresh } from "@/lib/api/portal/settings";
import { inferCountryFromLocale, currencyFromCountry } from "@/lib/i18n/currency";
import { loadPortalProfileWithRefresh, type PortalClientProfile } from "@/lib/api/portal/profile";
import { loadPortalBrandingWithRefresh, type ClientBranding } from "@/lib/api/portal/brand";
import { disconnectGoogleCalendarWithRefresh } from "@/lib/api/portal/integrations";
import { saveSession } from "@/lib/auth/session";

// ── Command search constants ──────────────────────────────────────────────────

const CMD_SUGGESTIONS: Array<{ icon: string; label: string; page: PageId }> = [
  { icon: "home",       label: "Home",          page: "home"          },
  { icon: "briefcase",  label: "My Projects",   page: "myProjects"    },
  { icon: "bell",       label: "Notifications", page: "notifications" },
  { icon: "message",    label: "Messages",      page: "messages"      },
  { icon: "invoiceDoc", label: "Invoices",      page: "invoices"      },
  { icon: "settings",   label: "Settings",      page: "settings"      },
];

const CMD_TYPE_ICON: Record<string, string> = {
  Page:         "file",
  Project:      "briefcase",
  Message:      "message",
  Invoice:      "invoiceDoc",
  Notification: "bell",
};

const CMD_TYPE_ICO_COLOR: Record<string, string> = {
  Page:         "var(--blue)",
  Project:      "var(--accent)",
  Message:      "var(--lime)",
  Invoice:      "var(--amber)",
  Notification: "var(--purple)",
};

const CMD_TYPE_ICO_BG: Record<string, string> = {
  Page:         "color-mix(in oklab, var(--blue)   10%, var(--s2))",
  Project:      "color-mix(in oklab, var(--accent)  10%, var(--s2))",
  Message:      "color-mix(in oklab, var(--lime)    10%, var(--s2))",
  Invoice:      "color-mix(in oklab, var(--amber)   10%, var(--s2))",
  Notification: "color-mix(in oklab, var(--purple)  10%, var(--s2))",
};

// ── Component ────────────────────────────────────────────────────────────────

export function MaphariClientDashboard() {
  // ── 1. Auth & data workspace ─────────────────────────────────────────────
  const workspace = usePortalWorkspace();
  const {
    session,
    snapshot,
    loading,
    signOut,
    refreshSnapshot,
    selectConversation,
  } = workspace;

  // ── 2. Toast system ──────────────────────────────────────────────────────
  const { toasts, setFeedback } = useDashboardToasts();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  // ── 3. Delayed flag for animation delay ──────────────────────────────────
  // ── 3. Data transformation ───────────────────────────────────────────────
  const clientData = useClientData({
    snapshot,
    userId: session?.user.id ?? null,
  });

  const [activePageForHooks, setActivePageForHooks] = useState<PageId>("home");

  // ── 5. Notifications ────────────────────────────────────────────────────
  const notifs = useNotifications({
    session: session ?? null,
    activePage: activePageForHooks,
  });

  // ── 5. Navigation (with badge counts) ───────────────────────────────────
  // Use elevated risk as a proxy for items likely to need client attention.
  const pendingApprovalCount = snapshot.projects.filter(
    (p) => p.riskLevel === "HIGH" || p.riskLevel === "CRITICAL",
  ).length;

  const nav = useClientNavigation({
    initialPage: "home",
    unreadNotifications: notifs.unreadCount,
    pendingApprovals: pendingApprovalCount,
    outstandingInvoiceCount: clientData.outstandingInvoices.length,
    unreadThreadCount: clientData.threads.filter((t) => t.unread).length,
  });

  // nav.navigateTo is stable (useCallback with no deps in useClientNavigation)
  // Using nav.navigateTo as dep instead of nav object prevents recreation on every render
  const handleNavigate = useCallback(
    (page: PageId) => {
      setActivePageForHooks(page);
      nav.navigateTo(page);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nav.navigateTo],
  );

  // ── 6. Command search ───────────────────────────────────────────────────
  const clientAsyncSearch = useCallback(async (q: string) => {
    if (!session) return [];
    const res = await searchGlobal(q, session);
    if (res.nextSession) saveSession(res.nextSession);
    return (res.data?.results ?? []).map((hit) => ({
      id: `search-${hit.id}`,
      type: hit.type.charAt(0).toUpperCase() + hit.type.slice(1),
      label: hit.title,
      meta: [hit.status, hit.subtitle].filter(Boolean).join(" · ") || hit.type,
      action: () => {
        if (hit.type === "project") handleNavigate("myProjects");
        else handleNavigate("dashboard");
      },
    }));
  }, [session, handleNavigate]);

  const commandSearch = useCommandSearch({
    threads: clientData.threads,
    projects: clientData.projects,
    invoices: clientData.invoices,
    navItems: nav.navSectionsWithBadges.flatMap(([, items]) => items),
    notifications: notifs.notifications,
    onNavigate: handleNavigate,
    onSelectThread: (threadId) => {
      selectConversation(threadId);
      handleNavigate("messages");
    },
    asyncSearch: clientAsyncSearch,
  });

  // ── 7. Keyboard shortcuts ───────────────────────────────────────────────
  const shortcuts = useKeyboardShortcuts({
    onNavigate: handleNavigate,
    onOpenSearch: commandSearch.open,
    isSearchOpen: commandSearch.isOpen,
  });

  // ── 8. Tour ────────────────────────────────────────────────────────────
  const tour = useClientTour();

  // ── 9. Real-time SSE refresh ──────────────────────────────────────────
  const handleSseRefresh = useCallback(() => {
    void refreshSnapshot(undefined, { background: true });
  }, [refreshSnapshot]);
  useRealtimeRefresh(session ?? null, handleSseRefresh);

  // ── 9b. Polling realtime feed (project status events) ─────────────────
  const handleRealtimeToast = useCallback(
    (tone: "success" | "info" | "warning" | "error", message: string) => {
      setFeedback({ tone, message });
    },
    [setFeedback],
  );
  const handleMilestoneCompleted = useCallback(() => {
    void refreshSnapshot(undefined, { background: true });
  }, [refreshSnapshot]);
  const { isConnected: isRealtimeConnected } = usePortalRealtime({
    session: session ?? null,
    onToast: handleRealtimeToast,
    onMilestoneCompleted: handleMilestoneCompleted,
  });

  // ── 9. Session timeout ─────────────────────────────────────────────────
  const sessionTimeout = useSessionTimeout({ onTimeout: signOut });

  // ── 10. Theme ───────────────────────────────────────────────────────────
  const themeHook = useTheme();

  // ── 11. Quick compose ───────────────────────────────────────────────────
  const quickCompose = useQuickCompose({
    session: session ?? null,
    projects: snapshot.projects.map((p) => ({ id: p.id, name: p.name })),
    refreshSnapshot,
    setFeedback,
  });

  // ── Local state for pages ────────────────────────────────────────────────
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  // ── FTUE: welcome modal ─────────────────────────────────────────────────
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (!session) return;
    void getPortalPreferenceWithRefresh(session, "portal_ftue_v1_seen").then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.data?.value) setShowWelcomeModal(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  function handleWelcomeModalDismiss() {
    setShowWelcomeModal(false);
    if (!session) return;
    void setPortalPreferenceWithRefresh(session, {
      key: "portal_ftue_v1_seen",
      value: "true",
    }).then((r) => { if (r.nextSession) saveSession(r.nextSession); });
  }

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ── Client profile (for sidebar user card) ───────────────────────────────
  const [profile, setProfile] = useState<PortalClientProfile | null>(null);

  useEffect(() => {
    if (!session) return;
    void loadPortalProfileWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setProfile(r.data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  // ── Portal branding (white-label colours / logo) ─────────────────────────
  const [branding, setBranding] = useState<ClientBranding | null>(null);

  useEffect(() => {
    if (!session) return;
    void loadPortalBrandingWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setBranding(r.data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  // Apply branding CSS variables to document root when branding is active
  useEffect(() => {
    if (!branding?.enabled) return;
    const root = document.documentElement;
    if (branding.primaryColor) {
      root.style.setProperty("--lime", branding.primaryColor);
      root.style.setProperty("--accent", branding.primaryColor);
    }
    return () => {
      root.style.removeProperty("--lime");
      root.style.removeProperty("--accent");
    };
  }, [branding]);

  // ── Currency preference ──────────────────────────────────────────────────
  const [currency, setCurrency] = useState<string>(() => {
    if (typeof navigator === "undefined") return "USD";
    const country = inferCountryFromLocale(navigator.language);
    return currencyFromCountry(country) ?? "USD";
  });

  useEffect(() => {
    if (!session) return;
    void getPortalPreferenceWithRefresh(session, "settingsCurrency").then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data?.value) setCurrency(r.data.value);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  // ── Notification preferences (loaded from portal preferences API) ─────────
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference[]>(DEFAULT_NOTIFICATION_PREFS);

  useEffect(() => {
    if (!session) return;
    getPortalPreferenceWithRefresh(session, "settingsNotifications").then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data?.value) {
        try {
          const parsed = JSON.parse(r.data.value) as NotificationPreference[];
          if (Array.isArray(parsed) && parsed.length > 0) setNotificationPrefs(parsed);
        } catch { /* keep defaults */ }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const handleToggleNotification = useCallback(
    (category: string, channel: string, value: boolean) => {
      setNotificationPrefs(prev => {
        const next = prev.map(p =>
          p.category === category ? { ...p, [channel]: value } : p
        );
        // Persist asynchronously — fire and forget
        if (session) {
          setPortalPreferenceWithRefresh(session, {
            key: "settingsNotifications",
            value: JSON.stringify(next),
          }).then(r => { if (r.nextSession) saveSession(r.nextSession); });
        }
        return next;
      });
    },
    [session],
  );

  // ── FTUE: project state detection ──────────────────────────────────────
  type ProjectStatus = "SETUP" | "ONBOARDING" | "ACTIVE" | "COMPLETE" | "ARCHIVED";
  const activeProject = snapshot.projects.find((p) => p.id === selectedProjectId) ?? snapshot.projects[0] ?? null;
  const activeStatus  = (activeProject?.status ?? "") as ProjectStatus;
  const hasNoProjects = !loading && snapshot.projects.length === 0;
  const isOnboarding  = activeStatus === "SETUP" || activeStatus === "ONBOARDING";
  const isComplete    = activeStatus === "COMPLETE" || activeStatus === "ARCHIVED";

  // ── Derived ──────────────────────────────────────────────────────────────
  const hasWorkspaceData = hasAnyDashboardData([
    snapshot.projects,
    snapshot.conversations,
    snapshot.invoices,
    snapshot.files,
  ]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
  }, [signOut]);

  // ── Breadcrumb title parts ───────────────────────────────────────────────
  const pageTitle = pageTitles[nav.activePage] ?? "Dashboard";
  const [eyebrow, title] = pageTitle.includes("/")
    ? pageTitle.split(" / ")
    : ["Portal", pageTitle];

  // ── Page notify (must be before early returns to satisfy Rules of Hooks) ──
  const pageNotify: PageNotifyFn = useCallback(
    (tone, title, subtitle) =>
      setFeedback({ tone, message: subtitle ? `${title} — ${subtitle}` : title }),
    [setFeedback],
  );

  // ── Loading gate ─────────────────────────────────────────────────────────
  if (loading && !hasWorkspaceData) {
    return <DashboardLoadingFallback variant="client" label="Loading your portal…" />;
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const contentStyle = undefined;

  return (
    <ProjectLayerCtx.Provider value={{ session, projectId: selectedProjectId ?? snapshot.projects[0]?.id ?? null }}>
    <DashboardToastCtx.Provider value={pageNotify}>
    <div className={`${styles.clientRoot} ${styles.root} dashboardScale dashboardBlendClient`}>
      <div className={styles.shell}>
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <ClientSidebar
          navSections={nav.navSectionsWithBadges}
          allPagesSections={nav.allPagesSections}
          activePage={nav.activePage}
          onNavigate={(p) => { handleNavigate(p); setSidebarOpen(false); }}
          clientName={profile?.ownerName ?? session?.user.email?.split("@")[0] ?? "Client"}
          companyName={profile?.companyName ?? profile?.name ?? session?.user.email?.split("@")[1] ?? "Company"}
          clientInitials={((profile?.ownerName ?? profile?.companyName ?? profile?.name ?? session?.user.email)?.[0] ?? "C").toUpperCase()}
          planLabel={profile?.tier ? profile.tier.charAt(0) + profile.tier.slice(1).toLowerCase().replace(/_/g, " ") : undefined}
          projects={snapshot.projects.map((p) => ({ id: p.id, name: p.name }))}
          activeProjectName={
            selectedProjectId
              ? snapshot.projects.find((p) => p.id === selectedProjectId)?.name
              : undefined
          }
          onProjectChange={setSelectedProjectId}
          onOpenSearch={() => commandSearch.open()}
          mobileOpen={sidebarOpen}
          onActiveSectionChange={(id) => setFlyoutOpen(!!id)}
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

        {/* ── Main area ───────────────────────────────────────────────── */}
        <div
          className={styles.main}
          style={{
            marginLeft: flyoutOpen ? 'calc(var(--sw) + 248px)' : undefined,
            transition: 'margin-left 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <ClientTopbar
            eyebrow={eyebrow}
            title={title}
            onOpenApps={() => window.dispatchEvent(new CustomEvent("client:open-app-grid"))}
            onOpenNotifications={() => handleNavigate("notifications")}
            onNewMessage={() => handleNavigate("messages")}
            onOpenHelp={() => handleNavigate("knowledgeBase")}
            unreadCount={notifs.unreadCount}
            onLogout={handleLogout}
            clientInitials={(session?.user.email?.[0] ?? "C").toUpperCase()}
            clientEmail={session?.user.email ?? ""}
            isLoggingOut={isLoggingOut}
            onOpenSearch={() => commandSearch.open()}
            onNavigateSettings={() => handleNavigate("settings")}
            onNavigateTeam={() => handleNavigate("teamAccess")}
            onMenuToggle={() => setSidebarOpen((v) => !v)}
            brandCompanyName={branding?.enabled ? branding.companyDisplayName : null}
            brandLogoUrl={branding?.enabled ? branding.logoUrl : null}
            planLabel={profile?.tier ? profile.tier.charAt(0) + profile.tier.slice(1).toLowerCase().replace(/_/g, " ") : undefined}
            projects={snapshot.projects.map((p) => ({ id: p.id, name: p.name, status: p.status }))}
            selectedProjectId={selectedProjectId}
            onProjectSelect={setSelectedProjectId}
            onViewAllProjects={() => handleNavigate("myProjects")}
            isRealtimeConnected={isRealtimeConnected}
          />

          <div className={styles.content} style={contentStyle}>
            <DashboardErrorBoundary>
            {/* ── FTUE: No-project holding page ───────────────────────── */}
            {hasNoProjects && nav.activePage !== "projectRequest" && nav.activePage !== "messages" && nav.activePage !== "bookCall" ? (
              <FtueHoldingPage session={session ?? null} navigateTo={handleNavigate} />
            ) : (
              <>
                {/* ── Contextual banners ──────────────────────────────── */}
                {isOnboarding && (
                  <OnboardingBanner session={session ?? null} navigateTo={handleNavigate} />
                )}
                {isComplete && activeProject && (
                  <CompletionBanner projectId={activeProject.id} session={session ?? null} navigateTo={handleNavigate} />
                )}

                {/* ── Overview ──────────────────────────────────────────── */}
                {nav.activePage === "home" && (
              <HomePage
                projects={clientData.projects}
                outstandingInvoices={clientData.outstandingInvoices}
                budgetHealth={clientData.budgetHealth}
                onNavigate={handleNavigate}
              />
            )}
            {nav.activePage === "dashboard" && (
              <DashboardPage
                projects={clientData.projects}
                outstandingInvoices={clientData.outstandingInvoices}
                budgetHealth={clientData.budgetHealth}
                onNavigate={handleNavigate}
              />
            )}
            {nav.activePage === "notifications" && <NotificationsPage />}
            {nav.activePage === "activityFeed" && <ActivityFeedPage />}

            {/* ── Projects ────────────────────────────────────────────── */}
            {nav.activePage === "myProjects" && <MyProjectsPage projects={clientData.projects} onNavigate={handleNavigate} />}
            {nav.activePage === "projectRequest" && <ProjectRequestPage onNavigate={handleNavigate} />}
            {nav.activePage === "timeline" && <TimelinePage />}
            {nav.activePage === "projectRoadmap" && <ProjectRoadmapPage />}
            {nav.activePage === "milestones" && <MilestonesPage />}
            {nav.activePage === "sprintBoard" && <SprintBoardPage />}
            {nav.activePage === "deliverables" && <DeliverablesPage />}
            {nav.activePage === "changeRequests" && <ChangeRequestsPage />}
            {nav.activePage === "riskRegister" && <RiskRegisterPage />}
            {nav.activePage === "decisionLog" && <DecisionLogPage />}
            {nav.activePage === "contentApproval" && <ContentApprovalPage />}

            {/* ── Finance ─────────────────────────────────────────────── */}
            {nav.activePage === "payments" && <PaymentsPage payments={snapshot.payments} invoices={snapshot.invoices} currency={currency} />}
            {nav.activePage === "invoices" && <InvoicesPage invoices={snapshot.invoices} currency={currency} />}
            {nav.activePage === "budgetTracker" && <BudgetTrackerPage invoices={snapshot.invoices} currency={currency} />}
            {nav.activePage === "legalHub" && <LegalHubPage />}
            {nav.activePage === "retainerDashboard" && <RetainerDashboardPage />}
            {nav.activePage === "financialReports" && <FinancialReportsPage invoices={snapshot.invoices} />}
            {nav.activePage === "invoiceHistory" && <InvoiceHistoryPage invoices={snapshot.invoices} />}

            {/* ── Communication ───────────────────────────────────────── */}
            {nav.activePage === "messages" && <MessagesPage threads={clientData.threads} />}
            {nav.activePage === "bookCall" && <BookCallPage />}
            {nav.activePage === "announcements" && <AnnouncementsPage />}
            {nav.activePage === "designReview" && <DesignReviewPage />}
            {nav.activePage === "meetingArchive" && <MeetingArchivePage />}

            {/* ── Files ───────────────────────────────────────────────── */}
            {nav.activePage === "filesAssets" && <FilesAssetsPage />}
            {nav.activePage === "brandLibrary" && <BrandLibraryPage />}
            {nav.activePage === "resourceHub" && <ResourceHubPage />}

            {/* ── Reporting ───────────────────────────────────────────── */}
            {nav.activePage === "projectReports" && <ProjectReportsPage />}
            {nav.activePage === "healthScore" && <HealthScorePage invoices={snapshot.invoices} projects={snapshot.projects} />}
            {nav.activePage === "performanceDashboard" && <PerformanceDashboardPage invoices={snapshot.invoices} projects={snapshot.projects} />}
            {nav.activePage === "executiveSummary" && <ExecutiveSummaryPage onNavigate={handleNavigate} />}
            {nav.activePage === "aiInsights" && (
              <AiInsightsPage
                projects={snapshot.projects.map((p) => ({
                  id: p.id,
                  name: p.name,
                  progress: p.progressPercent ?? 0,
                  riskLevel: p.riskLevel ?? "LOW",
                  status: p.status,
                }))}
                invoices={snapshot.invoices}
              />
            )}

            {/* ── Growth ──────────────────────────────────────────────── */}
            {nav.activePage === "serviceCatalog" && <ServiceCatalogPage />}
            {nav.activePage === "referralProgram" && <ReferralProgramPage />}
            {nav.activePage === "loyaltyCredits" && <LoyaltyCreditsPage />}

            {/* ── Support ─────────────────────────────────────────────── */}
            {nav.activePage === "progressKnowledge" && <ProgressKnowledgePage />}
            {nav.activePage === "knowledgeBase" && <KnowledgeBasePage />}
            {nav.activePage === "knowledgeAccess" && <KnowledgeAccessPage />}
            {nav.activePage === "slaEscalation" && <SlaEscalationPage />}

            {/* ── Account ─────────────────────────────────────────────── */}
            {nav.activePage === "feedbackSurvey" && <FeedbackSurveyPage />}
            {nav.activePage === "teamAccess" && <TeamAccessPage />}
            {nav.activePage === "integrations" && <IntegrationsPage />}
            {nav.activePage === "dataPrivacy" && <DataPrivacyPage />}
            {nav.activePage === "onboarding" && <OnboardingPage />}
            {nav.activePage === "communicationHistory" && <CommunicationHistoryPage />}
            {nav.activePage === "projectBrief" && <ProjectBriefPage onNavigate={handleNavigate} />}
            {nav.activePage === "offboarding" && <OffboardingPage />}

            {/* ── Settings / Profile ──────────────────────────────────── */}
            {nav.activePage === "profile" && <CompanyProfilePage />}
            {nav.activePage === "settings" && (
              <SettingsPage
                notificationPrefs={notificationPrefs}
                integrations={[]}
                sessions={[]}
                onToggleNotification={handleToggleNotification}
                onDisconnectIntegration={(id) => {
                  if (!session) return;
                  if (id === "google-calendar") {
                    void disconnectGoogleCalendarWithRefresh(session).then((result) => {
                      if (result.nextSession) saveSession(result.nextSession);
                      if (result.data?.disconnected) {
                        setFeedback({ tone: "success", message: "Google Calendar disconnected." });
                      } else {
                        setFeedback({ tone: "error", message: "Failed to disconnect integration." });
                      }
                    });
                  }
                }}
                onRevokeSession={(_id) => {
                  setFeedback({ tone: "info", message: "Session management is handled via your admin. Contact support to revoke a session." });
                }}
                theme={themeHook.theme}
                onToggleTheme={themeHook.toggleTheme}
                mode="security"
                currency={currency}
                onCurrencyChange={(c) => {
                  setCurrency(c);
                  if (session) {
                    void setPortalPreferenceWithRefresh(session, { key: "settingsCurrency", value: c })
                      .then(r => { if (r.nextSession) saveSession(r.nextSession); });
                  }
                }}
                clientName={profile?.ownerName ?? session?.user.email?.split("@")[0] ?? "Client"}
                companyName={profile?.companyName ?? profile?.name ?? session?.user.email?.split("@")[1] ?? "Company"}
                clientEmail={session?.user.email ?? ""}
                clientInitials={((profile?.ownerName ?? profile?.companyName ?? profile?.name ?? session?.user.email)?.[0] ?? "C").toUpperCase()}
                onNavigate={handleNavigate}
                session={session}
                onRestartTour={tour.resetTour}
              />
            )}
              </>
            )}
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
            {/* Input row */}
            <div className={styles.cmdInputWrap}>
              <Ic n="search" sz={16} c="var(--muted2)" />
              <input
                className={styles.cmdInput}
                type="text"
                placeholder="Search pages, projects, messages…"
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
              <kbd className={styles.cmdEscHint}>esc</kbd>
            </div>

            {/* Results */}
            <div className={styles.cmdResults}>
              {/* Quick navigate grid when no query */}
              {!commandSearch.query && (
                <>
                  <div className={styles.cmdSuggestLabel}>Quick navigate</div>
                  <div className={styles.cmdSuggestGrid}>
                    {CMD_SUGGESTIONS.map(({ icon, label, page }) => (
                      <button
                        key={page}
                        type="button"
                        className={styles.cmdSuggestItem}
                        onClick={() => { commandSearch.close(); handleNavigate(page); }}
                      >
                        <Ic n={icon} sz={13} c="var(--muted)" />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Search results — flat rows with colored dot + stacked label/meta */}
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
                    style={{ "--cmd-ic-bg": CMD_TYPE_ICO_BG[result.type] ?? "var(--s2)" } as React.CSSProperties}
                  >
                    <Ic
                      n={CMD_TYPE_ICON[result.type] ?? "file"}
                      sz={14}
                      c={CMD_TYPE_ICO_COLOR[result.type] ?? "var(--muted2)"}
                    />
                  </span>
                  <span className={styles.cmdItemBody}>
                    <span className={styles.cmdItemLabel}>{result.label}</span>
                    {result.meta ? (
                      <span className={styles.cmdItemMeta}>{result.meta}</span>
                    ) : null}
                  </span>
                  {result.type !== "Page" ? (
                    <span
                      className={styles.cmdItemType}
                      style={{
                        background: CMD_TYPE_ICO_BG[result.type]   ?? "var(--s2)",
                        color:      CMD_TYPE_ICO_COLOR[result.type] ?? "var(--muted2)",
                      }}
                    >
                      {result.type}
                    </span>
                  ) : null}
                </button>
              ))}

              {/* No results */}
              {commandSearch.query && commandSearch.results.length === 0 && (
                <div className={styles.cmdEmpty}>
                  <Ic n="search" sz={22} c="var(--muted2)" />
                  No results for &ldquo;{commandSearch.query}&rdquo;
                </div>
              )}
            </div>

            {/* Footer: keyboard hints + result count */}
            <div className={styles.cmdFooter}>
              <span className={styles.cmdFooterHint}>
                <kbd className={styles.cmdKbd}>↑↓</kbd> navigate
              </span>
              <span className={styles.cmdFooterHint}>
                <kbd className={styles.cmdKbd}>↵</kbd> open
              </span>
              <span className={styles.cmdFooterHint}>
                <kbd className={styles.cmdKbd}>esc</kbd> close
              </span>
              {commandSearch.query && commandSearch.results.length > 0 && (
                <span className={styles.cmdFooterCount}>
                  {commandSearch.results.length} result{commandSearch.results.length !== 1 ? "s" : ""}
                </span>
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
              ["G \u2192 H", "Home"],
              ["G \u2192 N", "Notifications"],
              ["G \u2192 P", "My Projects"],
              ["G \u2192 M", "Messages"],
              ["G \u2192 B", "Payments"],
              ["G \u2192 I", "Invoices"],
              ["G \u2192 C", "Change Requests"],
              ["G \u2192 A", "Milestones"],
              ["G \u2192 D", "Design Review"],
              ["G \u2192 F", "Files & Assets"],
              ["G \u2192 R", "Project Reports"],
              ["G \u2192 K", "Knowledge Base"],
              ["G \u2192 T", "Team Access"],
              ["G \u2192 S", "Settings"],
              ["\u2318K", "Search"],
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

      {/* ── Tour overlay ────────────────────────────────────────────────── */}
      <DashboardTour
        open={tour.tourActive}
        step={tour.tourStep}
        steps={CLIENT_TOUR_STEPS}
        showOverlay
        onBack={tour.prevStep}
        onNext={tour.nextStep}
        onSkip={tour.skipTour}
      />

      {/* ── Session timeout warning ─────────────────────────────────────── */}
      {sessionTimeout.showWarning && (
        <div className={styles.sessionWarning}>
          <div className={styles.sessionCard} role="alertdialog" aria-modal="true" aria-labelledby="session-warning-title">
            <div id="session-warning-title" className={styles.sessionTitle}>Session Expiring</div>
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
                <label className={styles.inputLabel} htmlFor="compose-subject-input">Subject</label>
                <input
                  id="compose-subject-input"
                  className={styles.input}
                  type="text"
                  value={quickCompose.subject}
                  onChange={(e) => quickCompose.setSubject(e.target.value)}
                  placeholder="Message subject"
                />
              </div>
              <div className={`${styles.inputGroup} ${styles.mt12}`}>
                <label className={styles.inputLabel} htmlFor="compose-project-select">Project</label>
                <select
                  id="compose-project-select"
                  className={styles.select}
                  value={quickCompose.selectedProjectId}
                  onChange={(e) =>
                    quickCompose.setSelectedProjectId(e.target.value)
                  }
                >
                  <option value="">No project</option>
                  {snapshot.projects.map((p) => (
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
                disabled={
                  quickCompose.sending || !quickCompose.subject.trim()
                }
              >
                {quickCompose.sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Quick Ask button ───────────────────────────────────── */}
      {!quickCompose.isOpen && (
        <button
          type="button"
          className={cx("floatingAskBtn")}
          onClick={() => quickCompose.open(snapshot.projects[0]?.id)}
          aria-label="Quick ask — send a message to your team"
        >
          <Ic n="message" sz={13} c="var(--bg)" />
          Quick Ask
        </button>
      )}

      {/* ── FTUE Welcome Modal ──────────────────────────────────────────── */}
      {showWelcomeModal && (
        <FtueWelcomeModal onDismiss={handleWelcomeModalDismiss} />
      )}

      {/* ── Toast stack ─────────────────────────────────────────────────── */}
      <DashboardToastStack toasts={toasts} />
    </div>
    </DashboardToastCtx.Provider>
    </ProjectLayerCtx.Provider>
  );
}
