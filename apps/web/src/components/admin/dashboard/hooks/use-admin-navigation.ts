"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { navItems, type PageId, type NavItem } from "../config";
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
  recentPages: PageId[];
  setRecentPages: React.Dispatch<React.SetStateAction<PageId[]>>;
  loggingOut: boolean;
  visibleNavItems: NavItem[];
  pinnedPages: PageId[];
  grouped: Record<string, NavItem[]>;
  navBadgeCounts: Partial<Record<PageId, number>>;
  statusBar: { clientsActive: number; blockers: number; atRisk: number };
  handlePageChange: (nextPage: PageId) => void;
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

  const statusBar = useMemo(() => {
    const clientsActive = snapshot.clients.filter(
      (client) => client.status === "ACTIVE",
    ).length;
    const blockers = projectBlockers.filter(
      (blocker) => blocker.status !== "RESOLVED",
    ).length;
    const atRisk = snapshot.clients.filter(
      (client) => client.status !== "ACTIVE",
    ).length;
    return { clientsActive, blockers, atRisk };
  }, [projectBlockers, snapshot.clients]);

  const handlePageChange = useCallback((nextPage: PageId): void => {
    setPage(nextPage);
    setRecentPages((previous) => [nextPage, ...previous.filter((entry) => entry !== nextPage)].slice(0, 6));
  }, []);

  const handleLogout = useCallback(async (): Promise<void> => {
    if (loggingOut) return;
    setLoggingOut(true);
    await signOut();
    window.location.href = "/internal-login";
  }, [loggingOut, signOut]);

  return {
    page,
    setPage,
    recentPages,
    setRecentPages,
    loggingOut,
    visibleNavItems,
    pinnedPages,
    grouped,
    navBadgeCounts,
    statusBar,
    handlePageChange,
    handleLogout
  };
}
