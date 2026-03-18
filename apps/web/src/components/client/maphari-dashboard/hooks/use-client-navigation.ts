"use client";

import { useState, useMemo, useCallback } from "react";
import type { PageId } from "../config";
import { navSections } from "../config";
import type { NavItem } from "../types";

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useClientNavigation({
  initialPage,
  unreadNotifications,
  pendingApprovals,
  outstandingInvoiceCount,
  unreadThreadCount,
}: {
  initialPage: PageId;
  unreadNotifications: number;
  pendingApprovals: number;
  outstandingInvoiceCount: number;
  unreadThreadCount?: number;
}) {
  const [activePage, setActivePage] = useState<PageId>(initialPage);
  const [recentPages, setRecentPages] = useState<PageId[]>([initialPage]);

  // ── Navigate ─────────────────────────────────────────────────────────────

  const navigateTo = useCallback((page: PageId) => {
    setActivePage(page);
    setRecentPages((prev) => {
      const filtered = prev.filter((p) => p !== page);
      const next = [page, ...filtered];
      return next.slice(0, 5);
    });
  }, []);

  // ── Badge map ────────────────────────────────────────────────────────────

  const badgeMap = useMemo(() => {
    const map: Partial<Record<PageId, { value: number; tone: "amber" | "red" }>> = {};

    if (pendingApprovals > 0) {
      map.milestones = { value: pendingApprovals, tone: "amber" };
    }
    if (unreadNotifications > 0) {
      map.notifications = { value: unreadNotifications, tone: "red" };
    }
    if (outstandingInvoiceCount > 0) {
      map.invoices = { value: outstandingInvoiceCount, tone: "amber" };
    }
    if (unreadThreadCount && unreadThreadCount > 0) {
      map.messages = { value: unreadThreadCount, tone: "amber" };
    }

    return map;
  }, [pendingApprovals, unreadNotifications, outstandingInvoiceCount, unreadThreadCount]);

  // ── Sections with badges ─────────────────────────────────────────────────

  const navSectionsWithBadges = useMemo<Array<[string, NavItem[]]>>(() => {
    return navSections.map((section) => {
      const items: NavItem[] = section.items.map((item) => {
        const badge = badgeMap[item.id];
        return {
          id: item.id,
          label: item.label,
          section: section.title,
          badge,
        };
      });
      return [section.title, items];
    });
  }, [badgeMap]);

  // ── All pages (for popup grid) ───────────────────────────────────────────

  const allPagesSections = useMemo<Array<[string, NavItem[]]>>(() => {
    return navSections.map((section) => {
      const items: NavItem[] = section.items.map((item) => {
        const badge = badgeMap[item.id];
        return {
          id: item.id,
          label: item.label,
          section: section.title,
          badge,
        };
      });
      return [section.title, items];
    });
  }, [badgeMap]);

  return {
    activePage,
    navigateTo,
    recentPages,
    navSectionsWithBadges,
    allPagesSections,
  };
}
