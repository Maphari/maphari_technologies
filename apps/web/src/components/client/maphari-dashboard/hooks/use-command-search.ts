"use client";

import { useState, useMemo, useCallback } from "react";
import type { PageId } from "../config";
import type { NavItem, Thread, InvoiceSummaryRow, ProjectCard } from "../types";
import type { PortalNotificationJob } from "../../../../lib/api/portal/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  type: string;
  label: string;
  meta: string;
  action: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MAX_RESULTS = 12;

function relevanceScore(text: string, query: string): number {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  if (lower === q) return 3;
  if (lower.startsWith(q)) return 2;
  if (lower.includes(q)) return 1;
  return 0;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCommandSearch({
  threads,
  projects,
  invoices,
  navItems,
  notifications,
  onNavigate,
  onSelectThread,
}: {
  threads: Thread[];
  projects: ProjectCard[];
  invoices: InvoiceSummaryRow[];
  navItems: NavItem[];
  notifications: PortalNotificationJob[];
  onNavigate: (page: PageId) => void;
  onSelectThread: (threadId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // ── Search results ───────────────────────────────────────────────────────

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim();
    if (!q) return [];

    const scored: Array<SearchResult & { score: number }> = [];

    // Search nav items
    for (const nav of navItems) {
      const score = relevanceScore(nav.label, q);
      if (score > 0) {
        scored.push({
          id: `nav-${nav.id}`,
          type: "Page",
          label: nav.label,
          meta: nav.section ?? "",
          action: () => onNavigate(nav.id),
          score,
        });
      }
    }

    // Search projects
    for (const project of projects) {
      const score = relevanceScore(project.name, q);
      if (score > 0) {
        scored.push({
          id: `project-${project.id}`,
          type: "Project",
          label: project.name,
          meta: project.status,
          action: () => onNavigate("projects"),
          score,
        });
      }
    }

    // Search threads
    for (const thread of threads) {
      const score = relevanceScore(thread.subject, q);
      if (score > 0) {
        scored.push({
          id: `thread-${thread.id}`,
          type: "Message",
          label: thread.subject,
          meta: thread.projectName,
          action: () => {
            onNavigate("messages");
            onSelectThread(thread.id);
          },
          score,
        });
      }
    }

    // Search invoices
    for (const invoice of invoices) {
      const score = relevanceScore(invoice.number, q);
      if (score > 0) {
        scored.push({
          id: `invoice-${invoice.id}`,
          type: "Invoice",
          label: `Invoice #${invoice.number}`,
          meta: invoice.status,
          action: () => onNavigate("billing"),
          score,
        });
      }
    }

    // Search notifications
    for (const notif of notifications) {
      const text = notif.message ?? notif.subject ?? "";
      if (!text) continue;
      const score = relevanceScore(text, q);
      if (score > 0) {
        scored.push({
          id: `notif-${notif.id}`,
          type: "Notification",
          label: text,
          meta: notif.tab,
          action: () => onNavigate("notifications"),
          score,
        });
      }
    }

    // Sort by relevance, then alphabetically
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.label.localeCompare(b.label);
    });

    // Strip the score and limit results
    return scored.slice(0, MAX_RESULTS).map(({ score: _s, ...rest }) => rest);
  }, [query, navItems, projects, threads, invoices, notifications, onNavigate, onSelectThread]);

  // ── Controls ─────────────────────────────────────────────────────────────

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const setQueryWrapped = useCallback((q: string) => {
    setQuery(q);
    setActiveIndex(0);
  }, []);

  const executeActive = useCallback(() => {
    const result = results[activeIndex];
    if (result) {
      result.action();
      close();
    }
  }, [results, activeIndex, close]);

  const moveUp = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
  }, [results.length]);

  const moveDown = useCallback(() => {
    setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
  }, [results.length]);

  return {
    isOpen,
    query,
    results,
    activeIndex,
    open,
    close,
    setQuery: setQueryWrapped,
    executeActive,
    moveUp,
    moveDown,
  };
}
