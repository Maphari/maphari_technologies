"use client";

import { useMemo, useRef } from "react";
import { styles, cx } from "./dashboard/style";
import { useAdminWorkspaceContext } from "./admin-workspace-context";
import { pageTitles, type PageId } from "./dashboard/config";
import { AdminSidebar, AdminTopbar, AdminTourCard } from "./dashboard/chrome";
import { ClientsAndProjectsPage } from "./dashboard/pages/clients-projects-page";
import { InvoicesPage } from "./dashboard/pages/invoices-page";
import { LeadsPage } from "./dashboard/pages/leads-page";
import { MessagesPage } from "./dashboard/pages/messages-page";
import { NotificationsPage } from "./dashboard/pages/notifications-page";
import { AccessControlPage } from "./dashboard/pages/access-control-page";
import { BrandControlPage } from "./dashboard/pages/brand-control-page";
import { BusinessDevelopmentPage } from "./dashboard/pages/business-development-page";
import { ClientOffboardingPage } from "./dashboard/pages/client-offboarding-page";
import { ClientOnboardingPage } from "./dashboard/pages/client-onboarding-page";
import { ClientSatisfactionPage } from "./dashboard/pages/client-satisfaction-page";
import { ClientJourneyPage } from "./dashboard/pages/client-journey-page";
import { CrisisCommandPage } from "./dashboard/pages/crisis-command-page";
import { CommunicationAuditPage } from "./dashboard/pages/communication-audit-page";
import { CompetitorMarketIntelPage } from "./dashboard/pages/competitor-market-intel-page";
import { DocumentVaultPage } from "./dashboard/pages/document-vault-page";
import { HealthInterventionsPage } from "./dashboard/pages/health-interventions-page";
import { LegalPage } from "./dashboard/pages/legal-page";
import { PerformancePage } from "./dashboard/pages/performance-page";
import { PlatformInfrastructurePage } from "./dashboard/pages/platform-infrastructure-page";
import { PricingPage } from "./dashboard/pages/pricing-page";
import { ProfitabilityPerClientPage } from "./dashboard/pages/profitability-per-client-page";
import { ProfitabilityPerProjectPage } from "./dashboard/pages/profitability-per-project-page";
import { CashFlowCalendarPage } from "./dashboard/pages/cash-flow-calendar-page";
import { FinancialYearCloseoutPage } from "./dashboard/pages/financial-year-closeout-page";
import { ExpenseTrackerPage } from "./dashboard/pages/expense-tracker-page";
import { PayrollLedgerPage } from "./dashboard/pages/payroll-ledger-page";
import { ProjectOperationsPage } from "./dashboard/pages/project-operations-page";
import { ProjectPortfolioPage } from "./dashboard/pages/project-portfolio-page";
import { QualityAssurancePage } from "./dashboard/pages/quality-assurance-page";
import { ReferralTrackingPage } from "./dashboard/pages/referral-tracking-page";
import { ResourceAllocationPage } from "./dashboard/pages/resource-allocation-page";
import { RevOpsPage } from "./dashboard/pages/revops-dashboard-page";
import { RevenueForecastingPage } from "./dashboard/pages/revenue-forecasting-page";
import { ExecutiveDashboardPage } from "./dashboard/pages/executive-dashboard-page";
import { OwnersWorkspacePage } from "./dashboard/pages/owners-workspace-page";
import { SlaTrackerPage } from "./dashboard/pages/sla-tracker-page";
import { VendorCostControlPage } from "./dashboard/pages/vendor-cost-control-page";
import { StrategicClientIntelligencePage } from "./dashboard/pages/strategic-client-intelligence-page";
import { ClientHealthScorecardPage } from "./dashboard/pages/client-health-scorecard-page";
import { StaffAccessPage } from "./dashboard/pages/staff-access-page";
import { StaffOnboardingPage } from "./dashboard/pages/staff-onboarding-page";
import { LeaveAbsencePage } from "./dashboard/pages/leave-absence-page";
import { RecruitmentPipelinePage } from "./dashboard/pages/recruitment-pipeline-page";
import { LearningDevelopmentPage } from "./dashboard/pages/learning-development-page";
import { StaffSatisfactionPage } from "./dashboard/pages/staff-satisfaction-page";
import { EmploymentRecordsPage } from "./dashboard/pages/employment-records-page";
import { TeamPerformanceReportPage } from "./dashboard/pages/team-performance-report-page";
import { PortfolioRiskRegisterPage } from "./dashboard/pages/portfolio-risk-register-page";
import { TeamStructurePage } from "./dashboard/pages/team-structure-page";
import { TimelineGanttPage } from "./dashboard/pages/timeline-gantt-page";
import { AdminAnalyticsPageClient } from "./dashboard/pages/admin-analytics-page-client";
import { AdminAuditPageClient } from "./dashboard/pages/admin-audit-page-client";
import { AdminAutomationPageClient } from "./dashboard/pages/admin-automation-page-client";
import { AdminIntegrationsPageClient } from "./dashboard/pages/admin-integrations-page-client";
import { AdminReportsPageClient } from "./dashboard/pages/admin-reports-page-client";
import { AdminSettingsPageClient } from "./dashboard/pages/admin-settings-page-client";
import { AdminStubPage } from "./dashboard/pages/admin-stub-page";
import { KnowledgeBaseAdminPage } from "./dashboard/pages/knowledge-base-admin-page";
import { DecisionRegistryPage } from "./dashboard/pages/decision-registry-page";
import { HandoverManagementPage } from "./dashboard/pages/handover-management-page";
import { CloseoutReviewPage } from "./dashboard/pages/closeout-review-page";
import { StaffTransitionPlannerPage } from "./dashboard/pages/staff-transition-planner-page";
import { ServiceCatalogManagerPage } from "./dashboard/pages/service-catalog-manager-page";
import { RequestInboxPage } from "./dashboard/pages/request-inbox-page";
import { ChangeRequestManagerPage } from "./dashboard/pages/change-request-manager-page";
import { SupportQueuePage } from "./dashboard/pages/support-queue-page";
import { LifecycleDashboardPage } from "./dashboard/pages/lifecycle-dashboard-page";
import { StakeholderDirectoryPage } from "./dashboard/pages/stakeholder-directory-page";
import { AIActionRecommendationsPage } from "./dashboard/pages/ai-action-recommendations-page";
import { UpdateQueueManagerPage } from "./dashboard/pages/update-queue-manager-page";
import { StandupFeedPage } from "./dashboard/pages/standup-feed-page";
import { EODDigestPage } from "./dashboard/pages/eod-digest-page";
import { PeerReviewQueuePage } from "./dashboard/pages/peer-review-queue-page";
import { AutomationAuditTrailPage } from "./dashboard/pages/automation-audit-trail-page";
import { ProjectBriefingPage } from "./dashboard/pages/project-briefing-page";
import { ActiveHealthMonitorPage } from "./dashboard/pages/active-health-monitor-page";
import { createMaintenanceCheckWithRefresh, setNotificationReadStateWithRefresh } from "../../lib/api/admin";
import { DashboardLoadingFallback, DashboardToastStack, hasAnyDashboardData, useDashboardToasts } from "../shared/dashboard-core";
import { ADMIN_PAGE_TO_NOTIFICATION_TAB } from "../shared/notification-routing";
import { useMarkActiveTabNotificationsRead } from "../shared/use-mark-active-tab-notifications-read";
import { useCursorTrail } from "../shared/use-cursor-trail";
import { useCommandSearch } from "../shared/use-command-search";
import { useKeyboardShortcuts } from "../shared/use-keyboard-shortcuts";
import { useSessionTimeout } from "../shared/use-session-timeout";
import { useTheme } from "../shared/use-theme";
import { useAdminNavigation } from "./dashboard/hooks/use-admin-navigation";
import { useAdminData } from "./dashboard/hooks/use-admin-data";
import { useAdminTour } from "./dashboard/hooks/use-admin-tour";
import { useAdminAutomation } from "./dashboard/hooks/use-admin-automation";

// ---------------------------------------------------------------------------
// useClock — simple per-second timestamp kept in orchestrator for pages that
// need a live "now" reference (Leads, Invoices, Clients).
// ---------------------------------------------------------------------------
import { useEffect, useState } from "react";

function useClock(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ---------------------------------------------------------------------------
// MaphariDashboard — admin workspace orchestrator.
// All heavy state is delegated to the 4 hooks called below; this file owns
// only the render tree, cursor trail, toast stack, and the two local
// imperative handlers (maintenance check + the clock utility).
// ---------------------------------------------------------------------------

export function MaphariDashboard() {
  const { session, snapshot, loading, transitioningLeadId, moveLead, refreshSnapshot, signOut } =
    useAdminWorkspaceContext();

  const clock = useClock();
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const { toasts, pushToast } = useDashboardToasts({ dismissMs: 3200 });

  // ── 1. Navigation ──────────────────────────────────────────────────────────
  const {
    page,
    setPage,
    recentPages,
    loggingOut,
    visibleNavItems,
    pinnedPages,
    grouped,
    navBadgeCounts,
    handlePageChange,
    handleLogout
  } = useAdminNavigation({
    session,
    snapshot,
    notificationJobs: [],   // populated after useAdminData below; wired via ref-free pattern
    projectBlockers: [],
    signOut
  });

  // ── 2. Data ────────────────────────────────────────────────────────────────
  const {
    notificationJobs,
    setNotificationJobs,
    projectBlockers,
    publicApiKeys,
    setPublicApiKeys,
    analyticsMetricsRows,
    adminDisplayCurrency,
    setAdminDisplayCurrency
  } = useAdminData({ session, activePage: page, pushToast });

  // ── 3. Tour ────────────────────────────────────────────────────────────────
  const {
    adminTourOpen,
    adminTourStep,
    setAdminTourStep,
    completeAdminTour,
    handleAdminTourNext
  } = useAdminTour({ session });

  // ── 4. Automation / queue ──────────────────────────────────────────────────
  const {
    processingQueue,
    handleProcessQueue,
    handleRefreshKeys
  } = useAdminAutomation({
    session,
    snapshot,
    notificationJobs,
    setNotificationJobs,
    pushToast
  });

  // ── Notification read tracking ─────────────────────────────────────────────
  useMarkActiveTabNotificationsRead({
    session,
    activeTab: ADMIN_PAGE_TO_NOTIFICATION_TAB[page],
    notificationJobs,
    setNotificationJobs,
    markNotificationRead: setNotificationReadStateWithRefresh
  });

  // ── Cursor trail ───────────────────────────────────────────────────────────
  useCursorTrail(cursorRef, ringRef, { cursorOffset: 5, ringOffset: 18, easing: 0.12 });

  // ── UX hooks: Theme ────────────────────────────────────────────────────────
  const themeHook = useTheme({ storageKey: "maphari_admin_theme" });

  // ── UX hooks: Session Timeout (shorter for admin security) ─────────────────
  const sessionTimeout = useSessionTimeout({
    onTimeout: () => void signOut(),
    idleDurationMs: 20 * 60 * 1000, // 20 minutes for admin
  });

  // ── UX hooks: Command Search ───────────────────────────────────────────────
  const commandSearchSources = useMemo(() => {
    const sources: Array<{ id: string; type: string; label: string; meta: string; action: () => void }> = [];

    for (const nav of visibleNavItems) {
      sources.push({
        id: `nav-${nav.id}`,
        type: "Page",
        label: nav.label,
        meta: nav.section,
        action: () => handlePageChange(nav.id),
      });
    }

    // Clients
    for (const client of (snapshot.clients ?? [])) {
      sources.push({
        id: `client-${client.id}`,
        type: "Client",
        label: client.name ?? client.id,
        meta: client.status ?? "",
        action: () => handlePageChange("clients"),
      });
    }

    // Projects
    for (const project of (snapshot.projects ?? [])) {
      sources.push({
        id: `project-${project.id}`,
        type: "Project",
        label: project.name,
        meta: "",
        action: () => handlePageChange("projects"),
      });
    }

    // Leads
    for (const lead of (snapshot.leads ?? [])) {
      sources.push({
        id: `lead-${lead.id}`,
        type: "Lead",
        label: lead.company ?? lead.title ?? lead.id,
        meta: lead.status,
        action: () => handlePageChange("leads"),
      });
    }

    return sources;
  }, [visibleNavItems, snapshot.clients, snapshot.projects, snapshot.leads, handlePageChange]);

  const commandSearch = useCommandSearch({ sources: commandSearchSources });

  // ── UX hooks: Keyboard Shortcuts ───────────────────────────────────────────
  const adminChordMap: Record<string, PageId> = useMemo(() => ({
    d: "dashboard",
    e: "executive",
    l: "leads",
    c: "clients",
    p: "projects",
    i: "invoices",
    n: "notifications",
    m: "messages",
    r: "reports",
    a: "analytics",
    t: "team",
    s: "settings",
    o: "owner",
    f: "staff",
    b: "brand",
    q: "qa",
    v: "revops",
  }), []);

  const shortcuts = useKeyboardShortcuts({
    chordMap: adminChordMap,
    onNavigate: handlePageChange,
    onOpenSearch: commandSearch.open,
    isSearchOpen: commandSearch.isOpen,
  });

  // ── Local imperative: maintenance check ───────────────────────────────────
  async function handleRunMaintenanceCheck(): Promise<void> {
    if (!session) return;
    const result = await createMaintenanceCheckWithRefresh(session, {
      checkType: "SECURITY",
      status: "PASS",
      details: "Manual maintenance trigger from admin dashboard"
    });
    if (!result.nextSession || result.error) {
      pushToast("error", result.error?.message ?? "Unable to run maintenance check.");
      return;
    }
    pushToast("success", "Maintenance check created.");
  }

  // ── Loading gate ───────────────────────────────────────────────────────────
  const hasWorkspaceData = hasAnyDashboardData([
    snapshot.clients,
    snapshot.projects,
    snapshot.leads,
    snapshot.invoices,
    snapshot.payments
  ]);

  if (loading && !hasWorkspaceData) return <DashboardLoadingFallback label="Loading dashboard..." />;

  // ── Derived display values ─────────────────────────────────────────────────
  const title = pageTitles[page];
  const email = session?.user.email ?? "admin@maphari";
  const isAdmin = session?.user.role === "ADMIN";
  const unreadNotificationsCount = notificationJobs.filter((job) => !job.readAt).length;

  const adminTourSteps = [
    { title: "Dashboard", detail: "Monitor business health, workload, and operational KPIs." },
    { title: "Clients & Projects", detail: "Approve project requests, assign staff, and manage delivery pipeline." },
    { title: "Billing", detail: "Track invoice and payment status across clients." },
    { title: "Messages & Automation", detail: "Manage communication queues and workflow alerts." }
  ] as const;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`${styles.dashboardRoot} ${styles.root} dashboardScale dashboardThemeAdmin`}>
      <div className={styles.cursor} ref={cursorRef} />
      <div className={styles.cursorRing} ref={ringRef} />

      <div className={styles.shell}>
        <AdminSidebar
          grouped={grouped}
          allItems={visibleNavItems}
          page={page}
          pinnedPages={pinnedPages}
          recentPages={recentPages}
          navBadgeCounts={navBadgeCounts}
          email={email}
          onPageChange={handlePageChange}
        />

        <main className={styles.main}>
          <AdminTopbar
            title={title}
            unreadNotificationsCount={unreadNotificationsCount}
            email={email}
            loggingOut={loggingOut}
            onOpenNotifications={() => setPage("notifications")}
            onOpenMessages={() => setPage("messages")}
            onLogout={() => void handleLogout()}
          />

          <section className={styles.content}>
            <AdminTourCard
              open={adminTourOpen}
              step={adminTourStep}
              steps={adminTourSteps}
              onBack={() => setAdminTourStep((value) => Math.max(0, value - 1))}
              onNext={() => handleAdminTourNext(adminTourSteps.length)}
              onSkip={completeAdminTour}
            />

            {page === "dashboard" ? <BusinessDevelopmentPage /> : null}
            {page === "executive" ? <ExecutiveDashboardPage /> : null}

            {page === "leads" ? (
              <LeadsPage
                leads={snapshot.leads}
                session={session}
                transitioningLeadId={transitioningLeadId}
                onMoveLead={moveLead}
                onRefreshSnapshot={refreshSnapshot}
                onNotify={pushToast}
                clock={clock}
              />
            ) : null}

            {page === "projects" ? (
              <ProjectOperationsPage
                snapshot={snapshot}
                session={session}
                onNotify={pushToast}
                currency={adminDisplayCurrency}
              />
            ) : null}

            {page === "invoices" ? (
              <InvoicesPage
                snapshot={snapshot}
                session={session}
                onRefreshSnapshot={refreshSnapshot}
                onNotify={pushToast}
                clock={clock}
              />
            ) : null}

            {page === "revops" ? <RevOpsPage /> : null}
            {page === "revenueForecasting" ? <RevenueForecastingPage /> : null}
            {page === "profitability" ? <ProfitabilityPerClientPage /> : null}
            {page === "projectProfitability" ? <ProfitabilityPerProjectPage /> : null}
            {page === "cashflow" ? <CashFlowCalendarPage /> : null}
            {page === "fyCloseout" ? <FinancialYearCloseoutPage /> : null}
            {page === "expenses" ? <ExpenseTrackerPage /> : null}
            {page === "payroll" ? <PayrollLedgerPage /> : null}
            {page === "pricing" ? <PricingPage /> : null}
            {page === "vendors" ? <VendorCostControlPage /> : null}
            {page === "platform" ? <PlatformInfrastructurePage /> : null}
            {page === "brand" ? <BrandControlPage /> : null}
            {page === "owner" ? <OwnersWorkspacePage /> : null}
            {page === "market" ? <CompetitorMarketIntelPage /> : null}
            {page === "portfolio" ? <ProjectPortfolioPage /> : null}
            {page === "resources" ? <ResourceAllocationPage /> : null}
            {page === "gantt" ? <TimelineGanttPage /> : null}
            {page === "qa" ? <QualityAssurancePage /> : null}
            {page === "sla" ? <SlaTrackerPage /> : null}
            {page === "offboarding" ? <ClientOffboardingPage /> : null}
            {page === "onboarding" ? <ClientOnboardingPage /> : null}
            {page === "satisfaction" ? <ClientSatisfactionPage /> : null}
            {page === "comms" ? <CommunicationAuditPage /> : null}
            {page === "vault" ? <DocumentVaultPage /> : null}
            {page === "referrals" ? <ReferralTrackingPage /> : null}
            {page === "interventions" ? <HealthInterventionsPage /> : null}
            {page === "team" ? <TeamStructurePage /> : null}
            {page === "crisis" ? <CrisisCommandPage /> : null}
            {page === "performance" ? <PerformancePage /> : null}
            {page === "teamPerformanceReport" ? <TeamPerformanceReportPage /> : null}
            {page === "portfolioRiskRegister" ? <PortfolioRiskRegisterPage /> : null}
            {page === "legal" ? <LegalPage /> : null}
            {page === "intelligence" ? <StrategicClientIntelligencePage /> : null}
            {page === "healthScorecard" ? <ClientHealthScorecardPage /> : null}
            {page === "access" ? <AccessControlPage /> : null}

            {page === "messages" ? (
              <MessagesPage
                snapshot={snapshot}
                session={session}
                onNotify={pushToast}
              />
            ) : null}

            {page === "notifications" ? (
              <NotificationsPage
                snapshot={snapshot}
                session={session}
                jobs={notificationJobs}
                processing={processingQueue}
                onProcess={handleProcessQueue}
                onRefreshSnapshot={refreshSnapshot}
                onNotify={pushToast}
              />
            ) : null}

            {page === "staff" ? (
              <StaffAccessPage
                session={session}
                onNotify={pushToast}
              />
            ) : null}

            {page === "staffOnboarding" ? <StaffOnboardingPage /> : null}
            {page === "leaveAbsence" ? <LeaveAbsencePage /> : null}
            {page === "recruitment" ? <RecruitmentPipelinePage /> : null}
            {page === "learningDev" ? <LearningDevelopmentPage /> : null}
            {page === "staffSatisfaction" ? <StaffSatisfactionPage /> : null}
            {page === "employmentRecords" ? <EmploymentRecordsPage /> : null}

            {page === "clients" ? (
              <ClientsAndProjectsPage
                snapshot={snapshot}
                session={session}
                onRefreshSnapshot={refreshSnapshot}
                onNotify={pushToast}
                clock={clock}
              />
            ) : null}

            {page === "experience" ? (
              <ClientJourneyPage
                snapshot={snapshot}
                session={session}
                onNotify={pushToast}
                currency={adminDisplayCurrency}
              />
            ) : null}

            {page === "automation" ? (
              <AdminAutomationPageClient
                jobs={notificationJobs}
                analyticsPoints={analyticsMetricsRows}
                onRunMaintenance={handleRunMaintenanceCheck}
                onProcessQueue={handleProcessQueue}
                onNotify={pushToast}
              />
            ) : null}

            {page === "integrations" ? (
              <AdminIntegrationsPageClient
                keys={publicApiKeys}
                onRefreshKeys={(sessionOverride) => handleRefreshKeys(sessionOverride, setPublicApiKeys)}
                onNotify={pushToast}
              />
            ) : null}

            {page === "analytics" ? (
              <AdminAnalyticsPageClient currency={adminDisplayCurrency} />
            ) : null}

            {page === "reports" ? (
              <AdminReportsPageClient
                onNotify={pushToast}
                currency={adminDisplayCurrency}
              />
            ) : null}

            {page === "audit" ? (
              isAdmin
                ? <AdminAuditPageClient />
                : <AdminStubPage title="Audit Log" eyebrow="Restricted" subtitle="This section is available to ADMIN role only." />
            ) : null}

            {page === "settings" ? (
              <AdminSettingsPageClient
                jobs={notificationJobs}
                publicApiKeys={publicApiKeys}
                analyticsPoints={analyticsMetricsRows}
                onNavigate={setPage}
                onNotify={pushToast}
                currencyValue={adminDisplayCurrency}
                onCurrencySaved={setAdminDisplayCurrency}
              />
            ) : null}

            {page === "knowledgeBaseAdmin" ? <KnowledgeBaseAdminPage /> : null}
            {page === "decisionRegistry" ? <DecisionRegistryPage /> : null}
            {page === "handoverManagement" ? <HandoverManagementPage /> : null}
            {page === "closeoutReview" ? <CloseoutReviewPage /> : null}
            {page === "staffTransitionPlanner" ? <StaffTransitionPlannerPage /> : null}
            {page === "serviceCatalogManager" ? <ServiceCatalogManagerPage /> : null}
            {page === "requestInbox" ? <RequestInboxPage /> : null}
            {page === "changeRequestManager" ? <ChangeRequestManagerPage /> : null}
            {page === "supportQueue" ? <SupportQueuePage /> : null}
            {page === "lifecycleDashboard" ? <LifecycleDashboardPage /> : null}
            {page === "stakeholderDirectory" ? <StakeholderDirectoryPage /> : null}
            {page === "aiActionRecommendations" ? <AIActionRecommendationsPage /> : null}
            {page === "updateQueueManager" ? <UpdateQueueManagerPage /> : null}
            {page === "standupFeed" ? <StandupFeedPage /> : null}
            {page === "eodDigest" ? <EODDigestPage /> : null}
            {page === "peerReviewQueue" ? <PeerReviewQueuePage /> : null}
            {page === "automationAuditTrail" ? <AutomationAuditTrailPage /> : null}
            {page === "projectBriefing" ? <ProjectBriefingPage /> : null}
            {page === "activeHealthMonitor" ? <ActiveHealthMonitorPage /> : null}
          </section>
        </main>
      </div>

      <DashboardToastStack toasts={toasts} />

      {/* ── Command search overlay ──────────────────────────────────────── */}
      {commandSearch.isOpen && (
        <div className={styles.cmdOverlay} onClick={commandSearch.close}>
          <div
            className={styles.cmdPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Admin command search"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              className={styles.cmdInput}
              type="text"
              placeholder="Search pages, clients, projects, leads..."
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
              ["G → E", "Executive"],
              ["G → L", "Leads"],
              ["G → C", "Clients"],
              ["G → P", "Projects"],
              ["G → I", "Invoices"],
              ["G → N", "Notifications"],
              ["G → M", "Messages"],
              ["G → R", "Reports"],
              ["G → A", "Analytics"],
              ["G → T", "Team"],
              ["G → O", "Owner"],
              ["G → F", "Staff"],
              ["G → V", "RevOps"],
              ["G → Q", "QA"],
              ["G → B", "Brand"],
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

      {/* ── Session timeout warning ─────────────────────────────────────── */}
      {sessionTimeout.showWarning && (
        <div className={styles.sessionWarning}>
          <div className={styles.sessionCard} role="alertdialog" aria-modal="true" aria-labelledby="admin-session-warning">
            <div id="admin-session-warning" className={styles.sessionTitle}>Session Expiring</div>
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
    </div>
  );
}
