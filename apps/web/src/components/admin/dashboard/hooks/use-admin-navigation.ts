"use client";

import { useEffect, useMemo, useState } from "react";
import { navItems, pageTitles, type PageId, type NavItem } from "../config";
import type { AuthSession } from "../../../../lib/auth/session";
import type { NotificationJob, ProjectBlocker } from "../../../../lib/api/admin";

type Snapshot = {
  clients: Array<{ id: string; status: string }>;
  projects: Array<{ id: string }>;
  leads: Array<{ id: string; status: string }>;
  invoices: Array<{ id: string; status: string }>;
};

export type UseAdminNavigationReturn = {
  page: PageId;
  setPage: React.Dispatch<React.SetStateAction<PageId>>;
  topbarSearch: string;
  setTopbarSearch: React.Dispatch<React.SetStateAction<string>>;
  recentPages: PageId[];
  setRecentPages: React.Dispatch<React.SetStateAction<PageId[]>>;
  loggingOut: boolean;
  visibleNavItems: NavItem[];
  pinnedPages: PageId[];
  grouped: Record<string, NavItem[]>;
  navBadgeCounts: Partial<Record<PageId, number>>;
  handlePageChange: (nextPage: PageId) => void;
  handleTopbarSearchSubmit: () => void;
  handleLogout: () => Promise<void>;
};

type Params = {
  session: AuthSession | null;
  snapshot: Snapshot;
  notificationJobs: NotificationJob[];
  projectBlockers: ProjectBlocker[];
  signOut: () => Promise<void>;
};

export function useAdminNavigation({ session, snapshot, notificationJobs, projectBlockers, signOut }: Params): UseAdminNavigationReturn {
  const [page, setPage] = useState<PageId>("dashboard");
  const [topbarSearch, setTopbarSearch] = useState("");
  const [recentPages, setRecentPages] = useState<PageId[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  const role = session?.user.role;
  const isAdmin = role === "ADMIN";

  const visibleNavItems = useMemo(() => {
    if (isAdmin) return navItems;
    const adminOnlyPages: PageId[] = ["integrations", "audit"];
    return navItems.filter((item) => !adminOnlyPages.includes(item.id));
  }, [isAdmin]);

  const pinnedPages = useMemo<PageId[]>(
    () => ["dashboard", "clients", "projects", "invoices", "staff", "reports", "settings"],
    []
  );

  const grouped = useMemo(() => {
    return visibleNavItems.reduce<Record<string, NavItem[]>>((acc, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    }, {});
  }, [visibleNavItems]);

  // Load recent pages from localStorage
  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `maphari:admin:recent-pages:${session.user.email}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as string[];
      const allowed = new Set<PageId>(visibleNavItems.map((item) => item.id));
      const next = parsed.filter((entry): entry is PageId => allowed.has(entry as PageId)).slice(0, 6);
      setRecentPages(next);
    } catch {
      // Ignore malformed local storage entries.
    }
  }, [session?.user?.email, visibleNavItems]);

  // Save recent pages to localStorage
  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `maphari:admin:recent-pages:${session.user.email}`;
    window.localStorage.setItem(key, JSON.stringify(recentPages.slice(0, 6)));
  }, [recentPages, session?.user?.email]);

  const navBadgeCounts = useMemo<Partial<Record<PageId, number>>>(() => {
    const failedClients = snapshot.clients.filter((client) => client.status !== "ACTIVE").length;
    const openInvoices = snapshot.invoices.filter((invoice) => invoice.status !== "PAID").length;
    const unreadMessages = snapshot.leads.filter((lead) => lead.status === "CONTACTED" || lead.status === "QUALIFIED").length;
    const openBlockers = projectBlockers.filter((blocker) => blocker.status !== "RESOLVED").length;

    return {
      leads: snapshot.leads.length,
      clients: failedClients,
      projects: Math.max(snapshot.projects.length, openBlockers),
      invoices: openInvoices,
      messages: unreadMessages,
      notifications: notificationJobs.filter((job) => !job.readAt).length
    };
  }, [notificationJobs, projectBlockers, snapshot.clients, snapshot.invoices, snapshot.leads, snapshot.projects]);

  function handlePageChange(nextPage: PageId): void {
    setPage(nextPage);
    setRecentPages((previous) => [nextPage, ...previous.filter((entry) => entry !== nextPage)].slice(0, 6));
  }

  function handleTopbarSearchSubmit(): void {
    const query = topbarSearch.trim().toLowerCase();
    if (!query) return;

    const direct = visibleNavItems.find((item) => {
      const [sectionLabel, pageLabel] = pageTitles[item.id];
      return (
        item.id.toLowerCase().includes(query) ||
        item.label.toLowerCase().includes(query) ||
        sectionLabel.toLowerCase().includes(query) ||
        pageLabel.toLowerCase().includes(query)
      );
    });
    if (direct) {
      setPage(direct.id);
      return;
    }

    if (query.includes("message") || query.includes("thread")) { setPage("messages"); return; }
    if (query.includes("invoice") || query.includes("billing")) { setPage("invoices"); return; }
    if (query.includes("revops") || query.includes("mrr") || query.includes("pipeline") || query.includes("arr")) { setPage("revops"); return; }
    if (query.includes("revenue forecasting") || query.includes("forecast")) { setPage("revenueForecasting"); return; }
    if (query.includes("pricing") || query.includes("quote")) { setPage("pricing"); return; }
    if (query.includes("vendor") || query.includes("cost control") || query.includes("freelancer") || query.includes("software spend")) { setPage("vendors"); return; }
    if (query.includes("expense") || query.includes("receipt") || query.includes("budget")) { setPage("expenses"); return; }
    if (query.includes("payroll") || query.includes("payslip") || query.includes("paye") || query.includes("uif")) { setPage("payroll"); return; }
    if (query.includes("project profitability") || query.includes("profitability per project") || query.includes("project margin")) { setPage("projectProfitability"); return; }
    if (query.includes("year closeout") || query.includes("financial year") || query.includes("fy closeout")) { setPage("fyCloseout"); return; }
    if (query.includes("qa") || query.includes("quality assurance")) { setPage("qa"); return; }
    if (query.includes("sla") || query.includes("service level")) { setPage("sla"); return; }
    if (query.includes("gantt") || query.includes("timeline")) { setPage("gantt"); return; }
    if (query.includes("portfolio")) { setPage("portfolio"); return; }
    if (query.includes("resource") || query.includes("allocation") || query.includes("capacity")) { setPage("resources"); return; }
    if (query.includes("onboarding")) { setPage("onboarding"); return; }
    if (query.includes("offboarding")) { setPage("offboarding"); return; }
    if (query.includes("satisfaction") || query.includes("nps") || query.includes("csat")) { setPage("satisfaction"); return; }
    if (query.includes("communication audit") || query.includes("comms")) { setPage("comms"); return; }
    if (query.includes("document") || query.includes("vault")) { setPage("vault"); return; }
    if (query.includes("referral")) { setPage("referrals"); return; }
    if (query.includes("intervention") || query.includes("health intervention")) { setPage("interventions"); return; }
    if (query.includes("market") || query.includes("competitor intel")) { setPage("market"); return; }
    if (query.includes("team structure")) { setPage("team"); return; }
    if (query.includes("brand control")) { setPage("brand"); return; }
    if (query.includes("business development") || query.includes("bizdev")) { setPage("dashboard"); return; }
    if (query.includes("owner workspace")) { setPage("owner"); return; }
    if (query.includes("platform") || query.includes("infrastructure")) { setPage("platform"); return; }
    if (query.includes("crisis") || query.includes("escalation") || query.includes("incident")) { setPage("crisis"); return; }
    if (query.includes("performance") || query.includes("accountability") || query.includes("bonus")) { setPage("performance"); return; }
    if (query.includes("team performance") || query.includes("staff performance report")) { setPage("teamPerformanceReport"); return; }
    if (query.includes("risk register") || query.includes("portfolio risk") || query.includes("risk matrix")) { setPage("portfolioRiskRegister"); return; }
    if (query.includes("health scorecard")) { setPage("healthScorecard"); return; }
    if (query.includes("legal") || query.includes("compliance") || query.includes("contract")) { setPage("legal"); return; }
    if (query.includes("intelligence") || query.includes("segment") || query.includes("churn")) { setPage("intelligence"); return; }
    if (query.includes("access") || query.includes("permission") || query.includes("mfa")) { setPage("access"); return; }
    if (query.includes("staff onboarding") || query.includes("onboarding checklist") || query.includes("new hire onboarding")) { setPage("staffOnboarding"); return; }
    if (query.includes("leave") || query.includes("absence") || query.includes("sick leave")) { setPage("leaveAbsence"); return; }
    if (query.includes("recruitment") || query.includes("hiring") || query.includes("candidate")) { setPage("recruitment"); return; }
    if (query.includes("learning") || query.includes("development") || query.includes("course")) { setPage("learningDev"); return; }
    if (query.includes("staff satisfaction") || query.includes("enps") || query.includes("pulse survey")) { setPage("staffSatisfaction"); return; }
    if (query.includes("employment record") || query.includes("employment records") || query.includes("employee record") || query.includes("hr file")) { setPage("employmentRecords"); return; }
    if (query.includes("project")) { setPage("projects"); return; }
    if (query.includes("client")) { setPage("clients"); return; }
    if (query.includes("executive")) { setPage("executive"); return; }
    if (query.includes("automation") || query.includes("notification")) { setPage("notifications"); return; }
    if (query.includes("lead")) { setPage("leads"); return; }
    if (query.includes("setting")) { setPage("settings"); }
  }

  async function handleLogout(): Promise<void> {
    if (loggingOut) return;
    setLoggingOut(true);
    await signOut();
    window.location.href = "/internal-login";
  }

  return {
    page,
    setPage,
    topbarSearch,
    setTopbarSearch,
    recentPages,
    setRecentPages,
    loggingOut,
    visibleNavItems,
    pinnedPages,
    grouped,
    navBadgeCounts,
    handlePageChange,
    handleTopbarSearchSubmit,
    handleLogout
  };
}
