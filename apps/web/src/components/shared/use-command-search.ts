"use client";

import { useState, useMemo, useCallback } from "react";

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

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_RESULTS = 14;

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
 * @example
 * const search = useCommandSearch({
 *   sources: [
 *     ...navItems.map(n => ({ id: n.id, type: "Page", label: n.label, meta: n.section, action: () => setPage(n.id) })),
 *     ...projects.map(p => ({ id: p.id, type: "Project", label: p.name, meta: p.status, action: () => setPage("projects") })),
 *   ],
 * });
 */
export function useCommandSearch({
  sources,
}: {
  sources: CommandSearchSource[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo<CommandSearchResult[]>(() => {
    const q = query.trim();
    if (!q) return [];

    const scored: Array<CommandSearchResult & { score: number }> = [];

    for (const source of sources) {
      const score = relevanceScore(source.label, q);
      if (score > 0) {
        scored.push({ ...source, score });
      }
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.label.localeCompare(b.label);
    });

    return scored.slice(0, MAX_RESULTS).map(({ score: _s, ...rest }) => rest);
  }, [query, sources]);

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
