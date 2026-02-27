"use client";

import { useRef } from "react";
import { styles } from "./dashboard/style";
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
import { createMaintenanceCheckWithRefresh, setNotificationReadStateWithRefresh } from "../../lib/api/admin";
import { DashboardLoadingFallback, DashboardToastStack, hasAnyDashboardData, useDashboardToasts } from "../shared/dashboard-core";
import { ADMIN_PAGE_TO_NOTIFICATION_TAB } from "../shared/notification-routing";
import { useMarkActiveTabNotificationsRead } from "../shared/use-mark-active-tab-notifications-read";
import { useCursorTrail } from "../shared/use-cursor-trail";
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
    topbarSearch,
    setTopbarSearch,
    recentPages,
    loggingOut,
    visibleNavItems,
    pinnedPages,
    grouped,
    navBadgeCounts,
    handlePageChange,
    handleTopbarSearchSubmit,
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
    <div className={`${styles.dashboardRoot} dashboardScale dashboardThemeAdmin`}>
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
            topbarSearch={topbarSearch}
            unreadNotificationsCount={unreadNotificationsCount}
            email={email}
            loggingOut={loggingOut}
            onSearchChange={setTopbarSearch}
            onSearchSubmit={handleTopbarSearchSubmit}
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
          </section>
        </main>
      </div>

      <DashboardToastStack toasts={toasts} />
    </div>
  );
}
