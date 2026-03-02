"use client";

import { useCallback, useState, type CSSProperties } from "react";
import {
  useDashboardToasts,
  DashboardToastStack,
  DashboardLoadingFallback,
  hasAnyDashboardData,
} from "../shared/dashboard-core";
import { usePortalWorkspace } from "../../lib/auth/use-portal-workspace";
import { useDelayedFlag } from "../shared/use-delayed-flag";
import { pageTitles } from "./maphari-dashboard/constants";
import { cx, styles } from "./maphari-dashboard/style";

// ── Hooks ────────────────────────────────────────────────────────────────────
import { useClientData } from "./maphari-dashboard/hooks/use-client-data";
import { useClientNavigation } from "./maphari-dashboard/hooks/use-client-navigation";
import { useClientActions } from "./maphari-dashboard/hooks/use-client-actions";
import { useNotifications } from "./maphari-dashboard/hooks/use-notifications";
import { useCommandSearch } from "./maphari-dashboard/hooks/use-command-search";
import { useKeyboardShortcuts } from "./maphari-dashboard/hooks/use-keyboard-shortcuts";
import { useClientTour } from "./maphari-dashboard/hooks/use-client-tour";
import { useSessionTimeout } from "./maphari-dashboard/hooks/use-session-timeout";
import { useTheme } from "./maphari-dashboard/hooks/use-theme";
import { useQuickCompose } from "./maphari-dashboard/hooks/use-quick-compose";

// ── Shell components ─────────────────────────────────────────────────────────
import { ClientSidebar } from "./maphari-dashboard/sidebar";
import { ClientTopbar } from "./maphari-dashboard/topbar";

// ── Pages ────────────────────────────────────────────────────────────────────
import { DashboardPage } from "./maphari-dashboard/pages/dashboard-page";
import { ProjectsPage } from "./maphari-dashboard/pages/projects-page";
import { MessagesPage } from "./maphari-dashboard/pages/messages-page";
import { NotificationsPage } from "./maphari-dashboard/pages/notifications-page";
import { ProjectRequestPage } from "./maphari-dashboard/pages/project-request-page";
import { ApprovalsPage } from "./maphari-dashboard/pages/approvals-page";
import { MeetingsPage } from "./maphari-dashboard/pages/meetings-page";
import { FilesPage } from "./maphari-dashboard/pages/files-page";
import { FeedbackPage } from "./maphari-dashboard/pages/feedback-page";
import { BillingPage } from "./maphari-dashboard/pages/billing-page";
import { ContractsPage } from "./maphari-dashboard/pages/contracts-page";
import { ReportsPage } from "./maphari-dashboard/pages/reports-page";
import { AIAutomationPage } from "./maphari-dashboard/pages/ai-automation-page";
import { ServicesGrowthPage } from "./maphari-dashboard/pages/services-growth-page";
import { SupportPage } from "./maphari-dashboard/pages/support-page";
import { OnboardingPage } from "./maphari-dashboard/pages/onboarding-page";
import { TeamPage } from "./maphari-dashboard/pages/team-page";
import { SettingsPage } from "./maphari-dashboard/pages/settings-page";
import { RetainerUsagePage } from "./maphari-dashboard/pages/retainer-usage-page";
import { SprintVisibilityPage } from "./maphari-dashboard/pages/sprint-visibility-page";
import { DeliverableStatusPage } from "./maphari-dashboard/pages/deliverable-status-page";
import { MilestoneApprovalsPage } from "./maphari-dashboard/pages/milestone-approvals-page";
import { HealthScorePage } from "./maphari-dashboard/pages/health-score-page";
import { SatisfactionSurveyPage } from "./maphari-dashboard/pages/satisfaction-survey-page";
import { KnowledgeAccessPage } from "./maphari-dashboard/pages/knowledge-access-page";

// ── Dummy data (no backend source for these entities yet) ────────────────────
import {
  DUMMY_NOTIFICATION_PREFS,
  DUMMY_INTEGRATIONS,
  DUMMY_SESSIONS,
} from "./maphari-dashboard/dummy-data";

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

  // ── 3. Delayed flag for animation delay ──────────────────────────────────
  const _ready = useDelayedFlag(snapshot, 200);

  // ── 4. Data transformation ───────────────────────────────────────────────
  const clientData = useClientData({
    snapshot,
    userId: session?.user.id ?? null,
  });

  // ── 5. Notifications ────────────────────────────────────────────────────
  const notifs = useNotifications({
    session: session ?? null,
    activePage: "dashboard",
  });

  // ── 6. Navigation (with badge counts) ───────────────────────────────────
  // Derive pending approvals from overdue/at-risk projects as a proxy
  const pendingApprovalCount = snapshot.projects.filter(
    (p) =>
      p.riskLevel === "HIGH" ||
      p.riskLevel === "CRITICAL" ||
      (p.dueAt && new Date(p.dueAt).getTime() < Date.now() && p.status !== "COMPLETED"),
  ).length;

  const nav = useClientNavigation({
    initialPage: "dashboard",
    unreadNotifications: notifs.unreadCount,
    pendingApprovals: pendingApprovalCount,
    outstandingInvoiceCount: clientData.outstandingInvoices.length,
    unreadThreadCount: clientData.threads.filter((t) => t.unread).length,
  });

  // ── 7. Actions ──────────────────────────────────────────────────────────
  const actions = useClientActions({
    session: session ?? null,
    refreshSnapshot,
    setFeedback,
  });

  // ── 8. Command search ───────────────────────────────────────────────────
  const commandSearch = useCommandSearch({
    threads: clientData.threads,
    projects: clientData.projects,
    invoices: clientData.invoices,
    navItems: nav.navSectionsWithBadges.flatMap(([, items]) => items),
    notifications: notifs.notifications,
    onNavigate: nav.navigateTo,
    onSelectThread: (threadId) => {
      selectConversation(threadId);
      nav.navigateTo("messages");
    },
  });

  // ── 9. Keyboard shortcuts ───────────────────────────────────────────────
  const shortcuts = useKeyboardShortcuts({
    onNavigate: nav.navigateTo,
    onOpenSearch: commandSearch.open,
    isSearchOpen: commandSearch.isOpen,
  });

  // ── 10. Tour ────────────────────────────────────────────────────────────
  const tour = useClientTour();

  // ── 11. Session timeout ─────────────────────────────────────────────────
  const sessionTimeout = useSessionTimeout({ onTimeout: signOut });

  // ── 12. Theme ───────────────────────────────────────────────────────────
  const themeHook = useTheme();

  // ── 13. Quick compose ───────────────────────────────────────────────────
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  // ── Loading gate ─────────────────────────────────────────────────────────
  if (loading && !hasWorkspaceData) {
    return <DashboardLoadingFallback label="Loading your portal..." />;
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const contentStyle = nav.activePage === "settings"
    ? ({ "--layout-content-pad": "0px" } as CSSProperties)
    : undefined;

  return (
    <div className={`${styles.clientRoot} ${styles.root} dashboardScale dashboardBlendClient`}>
      <div className={styles.shell}>
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <ClientSidebar
          navSections={nav.navSectionsWithBadges}
          allPagesSections={nav.allPagesSections}
          activePage={nav.activePage}
          onNavigate={nav.navigateTo}
          clientName={session?.user.email?.split("@")[0] ?? "Client"}
          companyName={session?.user.email?.split("@")[1] ?? "Company"}
          clientInitials={(session?.user.email?.[0] ?? "C").toUpperCase()}
          projects={snapshot.projects.map((p) => ({ id: p.id, name: p.name }))}
          activeProjectName={
            selectedProjectId
              ? snapshot.projects.find((p) => p.id === selectedProjectId)?.name
              : undefined
          }
          onProjectChange={setSelectedProjectId}
        />

        {/* ── Main area ───────────────────────────────────────────────── */}
        <div className={styles.main}>
          <ClientTopbar
            eyebrow={eyebrow}
            title={title}
            onOpenApps={() => window.dispatchEvent(new CustomEvent("client:open-app-grid"))}
            onOpenNotifications={() => nav.navigateTo("notifications")}
            onNewMessage={() => quickCompose.open()}
            unreadCount={notifs.unreadCount}
            onLogout={handleLogout}
            clientInitials={(session?.user.email?.[0] ?? "C").toUpperCase()}
            clientEmail={session?.user.email ?? ""}
            isLoggingOut={isLoggingOut}
          />

          <div className={styles.content} style={contentStyle}>
            {/* ── Dashboard ───────────────────────────────────────────── */}
            {nav.activePage === "dashboard" && <DashboardPage />}

            {/* ── Projects ────────────────────────────────────────────── */}
            {nav.activePage === "projects" && <ProjectsPage />}

            {/* ── Messages ────────────────────────────────────────────── */}
            {nav.activePage === "messages" && <MessagesPage />}

            {/* ── Notifications ───────────────────────────────────────── */}
            {nav.activePage === "notifications" && (
              <NotificationsPage />
            )}

            {/* ── Project Request ─────────────────────────────────────── */}
            {nav.activePage === "request" && (
              <ProjectRequestPage />
            )}

            {/* ── Approvals ───────────────────────────────────────────── */}
            {nav.activePage === "approvals" && (
              <ApprovalsPage />
            )}

            {/* ── Meetings ────────────────────────────────────────────── */}
            {nav.activePage === "meetings" && <MeetingsPage />}

            {/* ── Files ───────────────────────────────────────────────── */}
            {nav.activePage === "files" && <FilesPage />}

            {/* ── Feedback ────────────────────────────────────────────── */}
            {nav.activePage === "feedback" && <FeedbackPage />}

            {/* ── Billing ─────────────────────────────────────────────── */}
            {nav.activePage === "billing" && (
              <BillingPage />
            )}

            {/* ── Contracts ───────────────────────────────────────────── */}
            {nav.activePage === "contracts" && (
              <ContractsPage />
            )}

            {/* ── Reports ─────────────────────────────────────────────── */}
            {nav.activePage === "reports" && (
              <ReportsPage />
            )}

            {/* ── AI & Automation ─────────────────────────────────────── */}
            {nav.activePage === "automation" && (
              <AIAutomationPage />
            )}

            {/* ── Services & Growth ────────────────────────────────────── */}
            {nav.activePage === "services" && (
              <ServicesGrowthPage />
            )}

            {/* ── Support ─────────────────────────────────────────────── */}
            {nav.activePage === "support" && (
              <SupportPage />
            )}

            {/* ── Onboarding ──────────────────────────────────────────── */}
            {nav.activePage === "onboarding" && (
              <OnboardingPage />
            )}

            {/* ── Team ────────────────────────────────────────────────── */}
            {nav.activePage === "team" && (
              <TeamPage />
            )}

            {nav.activePage === "retainerUsage" && (
              <RetainerUsagePage />
            )}

            {nav.activePage === "sprintVisibility" && (
              <SprintVisibilityPage />
            )}

            {nav.activePage === "deliverableStatus" && (
              <DeliverableStatusPage />
            )}

            {nav.activePage === "milestoneApprovals" && (
              <MilestoneApprovalsPage />
            )}

            {nav.activePage === "healthScore" && (
              <HealthScorePage />
            )}

            {nav.activePage === "satisfactionSurvey" && (
              <SatisfactionSurveyPage />
            )}

            {nav.activePage === "knowledgeAccess" && (
              <KnowledgeAccessPage />
            )}

            {/* ── Settings ────────────────────────────────────────────── */}
            {nav.activePage === "profile" && (
              <SettingsPage
                notificationPrefs={DUMMY_NOTIFICATION_PREFS}
                integrations={DUMMY_INTEGRATIONS}
                sessions={DUMMY_SESSIONS}
                onToggleNotification={() => {}}
                onDisconnectIntegration={() => {}}
                onRevokeSession={() => {}}
                theme={themeHook.theme}
                onToggleTheme={themeHook.toggleTheme}
                mode="profile"
              />
            )}

            {nav.activePage === "settings" && (
              <SettingsPage
                notificationPrefs={DUMMY_NOTIFICATION_PREFS}
                integrations={DUMMY_INTEGRATIONS}
                sessions={DUMMY_SESSIONS}
                onToggleNotification={() => {}}
                onDisconnectIntegration={() => {}}
                onRevokeSession={() => {}}
                theme={themeHook.theme}
                onToggleTheme={themeHook.toggleTheme}
                mode="security"
              />
            )}
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
              ["G \u2192 D", "Dashboard"],
              ["G \u2192 P", "Project Overview"],
              ["G \u2192 M", "Messages"],
              ["G \u2192 N", "Communication Log"],
              ["G \u2192 B", "Billing"],
              ["G \u2192 A", "Change History"],
              ["G \u2192 F", "Files"],
              ["G \u2192 R", "Status & Launch"],
              ["G \u2192 I", "AI & Automation"],
              ["G \u2192 V", "Services & Growth"],
              ["G \u2192 T", "Team"],
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
      {tour.tourActive && (
        <div className={styles.tourOverlay}>
          <div className={styles.tourCard} role="dialog" aria-modal="true" aria-label="Product tour">
            <div className={styles.tourTitle}>
              {tour.currentStepData.title}
            </div>
            <div className={styles.tourDesc}>
              {tour.currentStepData.description}
            </div>
            <div className={styles.tourSteps}>
              {Array.from({ length: tour.totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cx(
                    "tourStepDot",
                    i === tour.tourStep && "tourStepDotActive",
                  )}
                />
              ))}
            </div>
            <div className={styles.tourActions}>
              {tour.tourStep > 0 && (
                <button
                  type="button"
                  className={cx("button", "buttonGhost")}
                  onClick={tour.prevStep}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                className={cx("button", "buttonGhost")}
                onClick={tour.skipTour}
              >
                Skip
              </button>
              {tour.tourStep < tour.totalSteps - 1 ? (
                <button
                  type="button"
                  className={cx("button", "buttonAccent")}
                  onClick={tour.nextStep}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className={cx("button", "buttonAccent")}
                  onClick={tour.completeTour}
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* ── Toast stack ─────────────────────────────────────────────────── */}
      <DashboardToastStack toasts={toasts} />
    </div>
  );
}
