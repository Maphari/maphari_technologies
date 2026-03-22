"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
} from "@/lib/utils/search-history";
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

/** Optional async backend search provider.  Return SearchResult[] for the given query string. */
export type AsyncSearchFn = (query: string) => Promise<SearchResult[]>;

const ASYNC_DEBOUNCE_MS = 300;
const ASYNC_MIN_CHARS   = 2;

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
  asyncSearch,
}: {
  threads: Thread[];
  projects: ProjectCard[];
  invoices: InvoiceSummaryRow[];
  navItems: NavItem[];
  notifications: PortalNotificationJob[];
  onNavigate: (page: PageId) => void;
  onSelectThread: (threadId: string) => void;
  asyncSearch?: AsyncSearchFn;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [asyncResults, setAsyncResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [history, setHistory] = useState<string[]>(() => getSearchHistory());
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // Store asyncSearch in a ref so the debounce effect doesn't re-register on every render
  const asyncSearchRef = useRef(asyncSearch);
  useEffect(() => { asyncSearchRef.current = asyncSearch; }, [asyncSearch]);

  // Debounced async backend search — only re-runs when query changes
  useEffect(() => {
    const q = query.trim();
    if (!asyncSearchRef.current || q.length < ASYNC_MIN_CHARS) {
      setAsyncResults((prev) => (prev.length === 0 ? prev : []));
      setIsSearching((prev) => (prev ? false : prev));
      return;
    }
    setIsSearching(true);
    const token = { cancelled: false };
    cancelRef.current = token;
    const timer = setTimeout(async () => {
      try {
        const hits = await asyncSearchRef.current!(q);
        if (!token.cancelled) { setAsyncResults(hits); setIsSearching(false); }
      } catch {
        if (!token.cancelled) { setAsyncResults([]); setIsSearching(false); }
      }
    }, ASYNC_DEBOUNCE_MS);
    return () => { token.cancelled = true; clearTimeout(timer); };
  }, [query]);

  // Reset async results when closed
  useEffect(() => {
    if (!isOpen) { setAsyncResults([]); setIsSearching(false); }
  }, [isOpen]);

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
          action: () => onNavigate("myProjects"),
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
          action: () => onNavigate("invoices"),
          score,
        });
      }
    }

    // Search notifications — prefer subject (clean headline); fall back to message
    for (const notif of notifications) {
      const raw = notif.subject ?? notif.message ?? "";
      if (!raw) continue;
      const clean = raw
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "")
        .replace(/\(\s*\)/g, "")   // drop empty parentheses left after UUID removal
        .replace(/\s{2,}/g, " ")
        .trim();
      if (!clean) continue;
      const label = clean.length > 72 ? clean.slice(0, 72) + "…" : clean;
      const score = relevanceScore(clean, q);
      if (score > 0) {
        scored.push({
          id: `notif-${notif.id}`,
          type: "Notification",
          label,
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

    const seen = new Set<string>(scored.map((r) => r.id));
    const local = scored.slice(0, MAX_RESULTS).map(({ score: _s, ...rest }) => rest);

    // Merge async remote results (deduped, appended after local)
    const remote: SearchResult[] = [];
    for (const hit of asyncResults) {
      if (!seen.has(hit.id)) { seen.add(hit.id); remote.push(hit); }
    }

    return [...local, ...remote].slice(0, MAX_RESULTS);
  }, [query, navItems, projects, threads, invoices, notifications, onNavigate, onSelectThread, asyncResults]);

  // ── Controls ─────────────────────────────────────────────────────────────

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setActiveIndex(0);
    setHistory(getSearchHistory()); // sync from localStorage on open
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
      const q = query.trim();
      if (q) {
        addToSearchHistory(q);
        setHistory(getSearchHistory());
      }
      result.action();
      close();
    }
  }, [results, activeIndex, close, query]);

  const moveUp = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
  }, [results.length]);

  const moveDown = useCallback(() => {
    setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
  }, [results.length]);

  const clearHistory = useCallback(() => {
    clearSearchHistory();
    setHistory([]);
  }, []);

  const selectHistory = useCallback((q: string) => {
    setQueryWrapped(q);
  }, [setQueryWrapped]);

  return {
    isOpen,
    query,
    results,
    activeIndex,
    isSearching,
    open,
    close,
    setQuery: setQueryWrapped,
    executeActive,
    moveUp,
    moveDown,
    history,
    clearHistory,
    selectHistory,
  };
}
