"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
} from "@/lib/utils/search-history";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CommandSearchResult {
  id: string;
  type: string;
  label: string;
  meta: string;
  action: () => void;
}

export interface CommandSearchSource {
  id: string;
  type: string;
  label: string;
  meta: string;
  action: () => void;
}

/** Optional async backend search. Return CommandSearchSource[] for the given query. */
export type AsyncSearchFn = (query: string) => Promise<CommandSearchSource[]>;

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_RESULTS = 14;
const ASYNC_DEBOUNCE_MS = 300;
const ASYNC_MIN_CHARS = 2;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relevanceScore(text: string, query: string): number {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  if (lower === q) return 3;
  if (lower.startsWith(q)) return 2;
  if (lower.includes(q)) return 1;
  return 0;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Shared command palette (⌘K) hook usable by all dashboards.
 * Each dashboard provides its own `sources` — an array of searchable items
 * with labels, metadata, and actions.
 *
 * Optionally pass `asyncSearch` to augment local results with live backend
 * results. The async function is debounced (300 ms) and fires when the query
 * is at least 2 characters. Its results are merged after local results so
 * instant local matches always appear first.
 *
 * @example
 * const search = useCommandSearch({
 *   sources: [
 *     ...navItems.map(n => ({ id: n.id, type: "Page", label: n.label, meta: n.section, action: () => setPage(n.id) })),
 *     ...projects.map(p => ({ id: p.id, type: "Project", label: p.name, meta: p.status, action: () => setPage("projects") })),
 *   ],
 *   asyncSearch: async (q) => {
 *     const res = await searchGlobal(q, session);
 *     return (res.data?.results ?? []).map(hit => ({ ... }));
 *   },
 * });
 */
export function useCommandSearch({
  sources,
  asyncSearch,
}: {
  sources: CommandSearchSource[];
  asyncSearch?: AsyncSearchFn;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [asyncResults, setAsyncResults] = useState<CommandSearchSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState<string[]>(() => getSearchHistory());

  // Cancel-token ref so stale responses are discarded
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // Store asyncSearch in a ref so the debounce effect doesn't re-register on every render
  // when the caller's session/callback reference changes. See memory note: asyncSearchRef pattern.
  const asyncSearchRef = useRef(asyncSearch);
  useEffect(() => { asyncSearchRef.current = asyncSearch; }, [asyncSearch]);

  // Debounced async fetch — only re-runs when query changes
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
        if (!token.cancelled) {
          setAsyncResults(hits);
          setIsSearching(false);
        }
      } catch {
        if (!token.cancelled) {
          setAsyncResults([]);
          setIsSearching(false);
        }
      }
    }, ASYNC_DEBOUNCE_MS);

    return () => {
      token.cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Reset async results when search closes
  useEffect(() => {
    if (!isOpen) {
      setAsyncResults([]);
      setIsSearching(false);
    }
  }, [isOpen]);

  const results = useMemo<CommandSearchResult[]>(() => {
    const q = query.trim();
    if (!q) return [];

    // ── Local results (instant) ──────────────────────────────────────────────
    const seen = new Set<string>();
    const scored: Array<CommandSearchResult & { score: number }> = [];

    for (const source of sources) {
      const score = relevanceScore(source.label, q);
      if (score > 0) {
        seen.add(source.id);
        scored.push({ ...source, score });
      }
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.label.localeCompare(b.label);
    });

    const local = scored.slice(0, MAX_RESULTS).map(({ score: _s, ...rest }) => rest);

    // ── Async results (backend, deduped) ─────────────────────────────────────
    const remote: CommandSearchResult[] = [];
    for (const source of asyncResults) {
      if (!seen.has(source.id)) {
        seen.add(source.id);
        remote.push(source);
      }
    }

    return [...local, ...remote].slice(0, MAX_RESULTS);
  }, [query, sources, asyncResults]);

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
    setQuery(q);
    setActiveIndex(0);
  }, []);

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
